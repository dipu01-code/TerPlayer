import test from 'node:test';
import assert from 'node:assert/strict';
import {
    clamp,
    wrapIndex,
    formatTime,
    formatDuration,
    makeProgressBar,
    stripExtension,
    randomIndex,
    repeatLabel,
    playbackLabel,
    getVisibleTracks,
    decideNextTrackIndex,
    getPlaybackCandidates,
    pickPlaybackCommand,
} from '../src/player-core.js';

test('clamp keeps values inside range', () => {
    assert.equal(clamp(5, 1, 10), 5);
    assert.equal(clamp(-2, 1, 10), 1);
    assert.equal(clamp(20, 1, 10), 10);
});

test('wrapIndex handles underflow, overflow, and empty list', () => {
    assert.equal(wrapIndex(-1, 4), 3);
    assert.equal(wrapIndex(4, 4), 0);
    assert.equal(wrapIndex(2, 4), 2);
    assert.equal(wrapIndex(100, 0), 0);
});

test('formatTime and formatDuration handle edge values', () => {
    assert.equal(formatTime(0), '00:00');
    assert.equal(formatTime(65), '01:05');
    assert.equal(formatTime(-100), '00:00');
    assert.equal(formatTime(Number.NaN), '00:00');
    assert.equal(formatDuration(null), '--:--');
    assert.equal(formatDuration(8), '00:08');
});

test('makeProgressBar handles unknown duration and clamps overshoot', () => {
    assert.equal(makeProgressBar(10, null, 10), '[----------]');
    assert.equal(makeProgressBar(20, 10, 10), '[##########]');
    assert.equal(makeProgressBar(5, 10, 10), '[#####-----]');
});

test('stripExtension removes only final extension', () => {
    assert.equal(stripExtension('song.mp3'), 'song');
    assert.equal(stripExtension('track.final.mix.flac'), 'track.final.mix');
});

test('randomIndex avoids except when length > 1', () => {
    const values = [0.2, 0.2, 0.7];
    let i = 0;
    const customRandom = () => values[i++ % values.length];
    const result = randomIndex(4, 0, customRandom);
    assert.notEqual(result, 0);
    assert.ok(result >= 0 && result < 4);
    assert.equal(randomIndex(1, 0), 0);
});

test('repeatLabel and playbackLabel map states correctly', () => {
    assert.equal(repeatLabel('off'), 'OFF');
    assert.equal(repeatLabel('all'), 'ALL');
    assert.equal(repeatLabel('one'), 'ONE');

    assert.equal(playbackLabel(false, false), 'STOPPED');
    assert.equal(playbackLabel(true, true), 'PAUSED');
    assert.equal(playbackLabel(true, false), 'PLAYING');
});

test('getVisibleTracks returns full list when small', () => {
    const tracks = [1, 2, 3];
    const visible = getVisibleTracks(tracks, 0, null, 8);
    assert.deepEqual(visible.items, tracks);
    assert.equal(visible.start, 0);
    assert.equal(visible.end, 3);
});

test('getVisibleTracks centers around selection and clamps bounds', () => {
    const tracks = Array.from({ length: 20 }, (_, idx) => idx);

    const nearTop = getVisibleTracks(tracks, 1, null, 8);
    assert.equal(nearTop.start, 0);
    assert.equal(nearTop.end, 8);

    const mid = getVisibleTracks(tracks, 10, null, 8);
    assert.equal(mid.start, 6);
    assert.equal(mid.end, 14);

    const nearBottom = getVisibleTracks(tracks, 19, null, 8);
    assert.equal(nearBottom.start, 12);
    assert.equal(nearBottom.end, 20);
});

test('decideNextTrackIndex handles repeat and shuffle modes', () => {
    assert.equal(
        decideNextTrackIndex({
            justFinishedIndex: 2,
            tracksLength: 5,
            repeatMode: 'one',
            shuffle: false,
        }),
        2
    );

    assert.equal(
        decideNextTrackIndex({
            justFinishedIndex: 4,
            tracksLength: 5,
            repeatMode: 'off',
            shuffle: false,
        }),
        null
    );

    assert.equal(
        decideNextTrackIndex({
            justFinishedIndex: 4,
            tracksLength: 5,
            repeatMode: 'all',
            shuffle: false,
        }),
        0
    );

    const shuffled = decideNextTrackIndex({
        justFinishedIndex: 1,
        tracksLength: 5,
        repeatMode: 'off',
        shuffle: true,
        random: () => 0.9,
    });

    assert.notEqual(shuffled, 1);
    assert.ok(shuffled >= 0 && shuffled < 5);

    assert.equal(
        decideNextTrackIndex({
            justFinishedIndex: 0,
            tracksLength: 0,
            repeatMode: 'off',
            shuffle: false,
        }),
        null
    );
});

test('getPlaybackCandidates returns platform-specific command lists', () => {
    assert.deepEqual(getPlaybackCandidates('darwin'), ['afplay', 'ffplay', 'mpv']);
    assert.deepEqual(getPlaybackCandidates('linux'), ['ffplay', 'mpv', 'vlc']);
    assert.deepEqual(getPlaybackCandidates('win32'), []);
});

test('pickPlaybackCommand returns first available candidate', () => {
    const picked = pickPlaybackCommand(['afplay', 'ffplay'], (name) => name === 'ffplay');
    assert.equal(picked, 'ffplay');

    const firstWins = pickPlaybackCommand(['afplay', 'ffplay', 'mpv'], (name) => name === 'afplay' || name === 'mpv');
    assert.equal(firstWins, 'afplay');

    const none = pickPlaybackCommand(['afplay', 'ffplay'], () => false);
    assert.equal(none, null);
});
