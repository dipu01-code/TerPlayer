#!/usr/bin/env node

import React, {
    useCallback,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import {
    Box,
    Text,
    render,
    useApp,
    useInput,
} from 'ink';

import TextInput from 'ink-text-input';

import {
    clamp,
    formatDuration,
    formatTime,
    getVisibleTracks,
    makeProgressBar,
    playbackLabel,
    wrapIndex,
} from './src/player-core.js';

import { searchTracks } from './src/stream-search.js';
import audio from 'audio';

import { fetchYouTubeAudio } from './src/youtube-player.js';

const h = React.createElement;

const PROGRESS_WIDTH = 34;
const RESULTS_VIEW_SIZE = 7;

const SPINNER_FRAMES = ['|', '/', '-', '\\'];

const HEADER_COLORS = ['cyan', 'blue', 'magenta', 'magenta', 'red', 'red'];

const HEADER_LINES = [
    '> TERPLAYER',
    '',
    '  ▀█▀ █▀▀ █▀█ ▀█▀ █▀▀ █   █▀▀ █▀█',
    '   █  ██▄ █▀▄  █  ██▄ █▄▄ ██▀ █▀▄',
];

const TIPS = [
    'Type any song (English or Hindi) below and press Enter to search YouTube.',
    'After search: ↑/↓ pick a track · Enter play · Esc new search.',
    'Streams play from the internet — nothing is saved to disk.',
    'Space pause/resume · x stop · q quit',
];

const sourceLabel = (source) => {
    if (source === 'youtube') {
        return 'YouTube';
    }

    return source;
};

const gradientColor = (index, total) =>
    HEADER_COLORS[Math.min(HEADER_COLORS.length - 1, Math.floor((index / total) * HEADER_COLORS.length))];

const App = () => {
    const { exit } = useApp();

    const [query, setQuery] = useState('');
    const [inputFocused, setInputFocused] = useState(true);
    const [results, setResults] = useState([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(null);
    const [lastSearchQuery, setLastSearchQuery] = useState('');

    const [currentTrack, setCurrentTrack] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isBuffering, setIsBuffering] = useState(false);
    const [elapsedSec, setElapsedSec] = useState(0);
    const [durationSec, setDurationSec] = useState(null);
    const [spinnerIndex, setSpinnerIndex] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Ready — search for a song to start streaming.');
    const [activityFeed, setActivityFeed] = useState(['Welcome to the terminal music streamer.']);

    const audioRef = useRef(null);
    const downloadAbortRef = useRef(null);
    const searchAbortRef = useRef(null);
    const playTokenRef = useRef(0);
    const manualStopRef = useRef(false);
    const shouldExitRef = useRef(false);

    const releasePlayer = useCallback(() => {
        downloadAbortRef.current?.abort();
        downloadAbortRef.current = null;

        const player = audioRef.current;
        audioRef.current = null;

        try {
            player?.stop();
            player?.dispose();
        } catch {
            // Ignore stop/dispose errors.
        }
    }, []);

    const pushActivity = useCallback((message) => {
        setActivityFeed((previous) => [message, ...previous].slice(0, 4));
    }, []);

    const stopPlayback = useCallback(() => {
        manualStopRef.current = true;
        playTokenRef.current += 1;
        releasePlayer();

        setIsPlaying(false);
        setIsPaused(false);
        setIsBuffering(false);
        setElapsedSec(0);
        setDurationSec(null);
        setCurrentTrack(null);
        setInputFocused(false);
        setStatusMessage(
            results.length > 0
                ? 'Playback stopped. Use ↑/↓ to pick another track, Esc to search.'
                : 'Playback stopped.',
        );
        pushActivity('Playback stopped.');
    }, [pushActivity, releasePlayer, results.length]);

    const playTrack = useCallback(
        async (track) => {
            if (!track?.videoId) {
                setStatusMessage('This track cannot be played.');
                return;
            }

            const playToken = ++playTokenRef.current;
            manualStopRef.current = false;
            releasePlayer();
            const download = new AbortController();
            downloadAbortRef.current = download;

            setCurrentTrack(track);
            setIsPlaying(false);
            setIsPaused(false);
            setIsBuffering(true);
            setElapsedSec(0);
            setDurationSec(track.durationSec);
            setStatusMessage(`Buffering: ${track.title}`);
            pushActivity(`Loading stream: ${track.title}`);

            try {
                const source = await fetchYouTubeAudio(track.videoId, download.signal);

                if (playToken !== playTokenRef.current) {
                    return;
                }

                const player = audio(source);
                audioRef.current = player;
                // audio crashes if play() starts mid-download, so wait for the full decode first.
                await player;

                if (playToken !== playTokenRef.current || audioRef.current !== player) {
                    return;
                }

                setDurationSec(player.duration ?? track.durationSec ?? null);
                setIsBuffering(false);

                player.on('timeupdate', (currentTime) => {
                    if (audioRef.current === player) {
                        setElapsedSec(Number(currentTime) || 0);
                    }
                });

                player.on('ended', () => {
                    if (audioRef.current !== player || manualStopRef.current) {
                        return;
                    }

                    audioRef.current = null;
                    setIsPlaying(false);
                    setIsPaused(false);
                    setElapsedSec(0);
                    setInputFocused(false);
                    setStatusMessage(
                        results.length > 0
                            ? 'Playback finished. Use ↑/↓ to pick another, Esc to search.'
                            : 'Playback finished.',
                    );
                    pushActivity('Track finished.');
                });

                player.play();
                setIsPlaying(true);
                setIsPaused(false);
                setInputFocused(false);
                setStatusMessage(`Streaming: ${track.title}`);
                pushActivity(`Now playing: ${track.title}`);
            } catch (error) {
                if (playToken !== playTokenRef.current) {
                    return;
                }

                setIsPlaying(false);
                setIsPaused(false);
                setIsBuffering(false);
                setCurrentTrack(null);
                setInputFocused(false);
                setStatusMessage(`Playback error: ${error?.message ?? 'Unable to stream this track.'}`);
                pushActivity('Playback failed.');
            }
        },
        [pushActivity, releasePlayer, results.length],
    );

    const runSearch = useCallback(
        async (searchQuery) => {
            const trimmed = searchQuery.trim();
            if (!trimmed) {
                setStatusMessage('Type a song name before searching.');
                return;
            }

            searchAbortRef.current?.abort();
            const controller = new AbortController();
            searchAbortRef.current = controller;

            setIsSearching(true);
            setSearchError(null);
            setStatusMessage(`Searching for "${trimmed}"...`);
            pushActivity(`Searching: ${trimmed}`);

            try {
                // yt-search can't be cancelled; a newer search makes this one's results ignored below.
                const tracks = await searchTracks(trimmed, { limit: 10 });

                if (controller.signal.aborted) {
                    return;
                }

                setResults(tracks);
                setSelectedIndex(0);
                setLastSearchQuery(trimmed);
                setInputFocused(tracks.length === 0);

                if (tracks.length === 0) {
                    setStatusMessage(
                        `No streams found for "${trimmed}" (tracks over 20 min are skipped). Try another spelling or artist name.`,
                    );
                    pushActivity('No results found.');
                    return;
                }

                setStatusMessage(
                    `Found ${tracks.length} result${tracks.length === 1 ? '' : 's'}. ` +
                        'Use ↑/↓ to pick, Enter to play, Esc to search again.',
                );
                pushActivity(`Found ${tracks.length} result${tracks.length === 1 ? '' : 's'}.`);
            } catch (error) {
                if (controller.signal.aborted) {
                    return;
                }

                const message = error?.message ?? 'Search failed.';
                setSearchError(message);
                setResults([]);
                setStatusMessage(`Search error: ${message}`);
                pushActivity('Search failed.');
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearching(false);
                }
            }
        },
        [pushActivity],
    );

    const togglePause = useCallback(() => {
        const player = audioRef.current;
        if (!player || isBuffering) {
            return;
        }

        if (isPaused) {
            player.resume();
            setIsPlaying(true);
            setIsPaused(false);
            setStatusMessage('Resumed playback.');
            pushActivity('Playback resumed.');
            return;
        }

        player.pause();
        setIsPaused(true);
        setStatusMessage('Paused playback.');
        pushActivity('Playback paused.');
    }, [isBuffering, isPaused, pushActivity]);

    useEffect(() => {
        if ((!isPlaying && !isBuffering) || isPaused) {
            return;
        }

        const timer = setInterval(() => {
            setSpinnerIndex((previous) => (previous + 1) % SPINNER_FRAMES.length);
        }, 180);

        return () => clearInterval(timer);
    }, [isBuffering, isPaused, isPlaying]);

    useEffect(
        () => () => {
            shouldExitRef.current = true;
            manualStopRef.current = true;
            searchAbortRef.current?.abort();
            releasePlayer();
        },
        [releasePlayer],
    );

    useInput((input, key) => {
        if (key.escape) {
            setInputFocused(true);
            setStatusMessage('Search bar active — type a new song and press Enter.');
            return;
        }

        if (inputFocused) {
            if (key.return) {
                runSearch(query);
                return;
            }

            if (key.tab && results.length > 0) {
                setInputFocused(false);
                setStatusMessage('Results mode — ↑/↓ to pick, Enter to play, Esc to search.');
                return;
            }

            if (input === 'q' && query.length === 0) {
                shouldExitRef.current = true;
                stopPlayback();
                exit();
            }

            return;
        }

        if (key.upArrow || input === 'k') {
            if (results.length > 0) {
                setSelectedIndex((previous) => wrapIndex(previous - 1, results.length));
            }

            return;
        }

        if (key.downArrow || input === 'j') {
            if (results.length > 0) {
                setSelectedIndex((previous) => wrapIndex(previous + 1, results.length));
            }

            return;
        }

        if (/^[1-9]$/.test(input) && results.length > 0) {
            const index = Number(input) - 1;
            if (index < results.length) {
                setSelectedIndex(index);
                playTrack(results[index]);
            }

            return;
        }

        if (key.tab || input === '/') {
            setInputFocused(true);
            setStatusMessage('Search bar active — type a new song and press Enter.');
            return;
        }

        if (key.return) {
            const track = results[selectedIndex];
            if (track) {
                playTrack(track);
            }

            return;
        }

        if (input === ' ') {
            togglePause();
            return;
        }

        if (input === 'x') {
            stopPlayback();
            return;
        }

        if (input === 'r' && results.length > 0) {
            playTrack(results[selectedIndex]);
            return;
        }

        if (input === 'q' || (key.ctrl && input === 'c')) {
            shouldExitRef.current = true;
            stopPlayback();
            exit();
            return;
        }

        // Last, so Space, x, r and q above keep working as commands.
        if (
            input &&
            input.length === 1 &&
            !key.ctrl &&
            !key.meta &&
            input >= ' ' &&
            input !== '\t'
        ) {
            setInputFocused(true);
            setQuery(input);
            setStatusMessage('Search bar active — keep typing and press Enter.');
        }
    });

    const visibleResults = useMemo(
        () => getVisibleTracks(results, selectedIndex, null, RESULTS_VIEW_SIZE),
        [results, selectedIndex],
    );

    const cappedElapsed = useMemo(() => {
        if (!durationSec) {
            return elapsedSec;
        }

        return clamp(elapsedSec, 0, durationSec);
    }, [durationSec, elapsedSec]);

    const progressBar = makeProgressBar(cappedElapsed, durationSec, PROGRESS_WIDTH);
    const stateLabel = isBuffering ? 'BUFFERING' : playbackLabel(isPlaying, isPaused);
    const stateColor = isBuffering ? 'yellow' : !isPlaying ? 'gray' : isPaused ? 'yellow' : 'green';
    const spinner = isPlaying && !isPaused ? SPINNER_FRAMES[spinnerIndex] : isBuffering ? SPINNER_FRAMES[spinnerIndex] : ' ';
    const footerLeft = isSearching
        ? 'searching…'
        : inputFocused
          ? 'mode: search (Enter) · Esc'
          : 'mode: results (↑/↓ Enter) · Esc search';
    const footerRight = currentTrack
        ? `${formatTime(cappedElapsed)} / ${formatDuration(durationSec)}`
        : 'no track loaded';

    return h(
        Box,
        { flexDirection: 'column', paddingX: 1, paddingY: 1 },

        h(
            Box,
            { flexDirection: 'column', marginBottom: 1 },
            HEADER_LINES.map((line, lineIndex) => {
                if (!line) {
                    return h(Text, { key: `gap-${lineIndex}` }, '');
                }

                if (line.startsWith('> ')) {
                    const text = line.slice(2);
                    return h(
                        Box,
                        { key: `line-${lineIndex}` },
                        h(Text, { color: 'cyan', bold: true }, '> '),
                        ...text.split('').map((char, charIndex) =>
                            h(
                                Text,
                                {
                                    key: `${lineIndex}-${charIndex}`,
                                    color: gradientColor(charIndex, text.length),
                                    bold: true,
                                },
                                char,
                            ),
                        ),
                    );
                }

                return h(
                    Text,
                    { key: `line-${lineIndex}`, color: 'magenta' },
                    line,
                );
            }),
        ),

        h(Text, { color: 'gray', bold: true }, 'Tips for getting started:'),
        TIPS.map((tip, index) =>
            h(
                Text,
                { key: `tip-${index}`, color: 'gray' },
                `${index + 1}. ${tip}`,
            ),
        ),

        h(Text, null, ''),

        h(
            Box,
            { flexDirection: 'column', marginBottom: 1 },
            h(Text, { bold: true, color: 'white' }, 'Search results'),
            isSearching
                ? h(Text, { color: 'yellow' }, `${spinner} Searching online catalogs...`)
                : null,
            searchError ? h(Text, { color: 'red' }, searchError) : null,
            !isSearching && results.length === 0
                ? h(Text, { color: 'gray' }, lastSearchQuery ? `No results for "${lastSearchQuery}".` : 'No results yet.')
                : null,
            visibleResults.start > 0 ? h(Text, { color: 'gray' }, '...') : null,
            ...visibleResults.items.map((track, offset) => {
                const index = visibleResults.start + offset;
                const selected = index === selectedIndex;
                const active = currentTrack?.id === track.id;
                const prefix = selected ? '>' : ' ';
                const marker = active ? '♪' : ' ';
                const line =
                    `${prefix}${marker} ${String(index + 1).padStart(2, '0')}. ` +
                    `${track.title} — ${track.artist} ` +
                    `(${formatDuration(track.durationSec)}) [${sourceLabel(track.source)}]`;

                return h(
                    Text,
                    {
                        key: track.id,
                        color: active ? 'green' : selected ? 'cyan' : 'white',
                        bold: selected || active,
                    },
                    line,
                );
            }),
            visibleResults.end < results.length ? h(Text, { color: 'gray' }, '...') : null,
        ),

        currentTrack
            ? h(
                  Box,
                  { flexDirection: 'column', marginBottom: 1 },
                  h(Text, { color: stateColor, bold: true }, `${spinner} ${stateLabel}`),
                  h(Text, { color: 'white' }, `Now playing: ${currentTrack.title}`),
                  h(Text, { color: 'gray' }, `Artist: ${currentTrack.artist} · Source: ${sourceLabel(currentTrack.source)}`),
                  h(Text, { color: 'green' }, `${progressBar} ${formatTime(cappedElapsed)} / ${formatDuration(durationSec)}`),
              )
            : null,

        h(Text, { color: 'yellow' }, statusMessage),

        h(Text, null, ''),

        h(
            Box,
            {
                borderStyle: 'round',
                borderColor: inputFocused ? 'cyan' : 'gray',
                paddingX: 1,
                marginBottom: 1,
            },
            h(
                Box,
                { flexDirection: 'row' },
                h(Text, { color: 'cyan' }, '> '),
                h(TextInput, {
                    value: query,
                    onChange: setQuery,
                    placeholder: 'Type a song name (e.g. Shape of You Ed Sheeran)',
                    focus: inputFocused,
                    showCursor: inputFocused,
                }),
            ),
        ),

        h(
            Box,
            { justifyContent: 'space-between' },
            h(Text, { color: 'gray' }, `- ${footerLeft}`),
            h(Text, { color: 'cyan' }, footerRight),
        ),

        h(Text, null, ''),

        h(
            Box,
            { flexDirection: 'column' },
            h(Text, { color: 'gray', bold: true }, 'Activity'),
            ...activityFeed.map((entry, index) =>
                h(
                    Text,
                    {
                        key: `${index}-${entry}`,
                        color: index === 0 ? 'white' : 'gray',
                    },
                    `${index === 0 ? '>' : '-'} ${entry}`,
                ),
            ),
        ),
    );
};

render(h(App));
