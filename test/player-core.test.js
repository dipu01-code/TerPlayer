import test from 'node:test';
import assert from 'node:assert/strict';
import {
    clamp,
    wrapIndex,
    formatTime,
    formatDuration,
    makeProgressBar,
    playbackLabel,
    getVisibleTracks,
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

test('playbackLabel maps states correctly', () => {
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
