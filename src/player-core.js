export const SUPPORTED_EXTENSIONS = new Set(['.mp3', '.wav', '.m4a', '.aac', '.flac', '.ogg']);

export const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

export const wrapIndex = (value, length) => {
    if (length <= 0) {
        return 0;
    }

    if (value < 0) {
        return length - 1;
    }

    if (value >= length) {
        return 0;
    }

    return value;
};

export const formatTime = (seconds) => {
    const safe = Math.max(0, Number.isFinite(seconds) ? Math.floor(seconds) : 0);
    const minutes = Math.floor(safe / 60);
    const remain = safe % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remain).padStart(2, '0')}`;
};

export const formatDuration = (seconds) => (seconds == null ? '--:--' : formatTime(seconds));

export const makeProgressBar = (elapsedSec, durationSec, width) => {
    if (!durationSec || durationSec <= 0) {
        return `[${'-'.repeat(width)}]`;
    }

    const ratio = clamp(elapsedSec / durationSec, 0, 1);
    const filled = Math.round(ratio * width);
    const empty = Math.max(0, width - filled);
    return `[${'#'.repeat(filled)}${'-'.repeat(empty)}]`;
};

export const stripExtension = (fileName) => fileName.replace(/\.[^.]+$/, '');

export const randomIndex = (length, except, random = Math.random) => {
    if (length <= 1) {
        return 0;
    }

    let candidate = Math.floor(random() * length);
    while (candidate === except) {
        candidate = Math.floor(random() * length);
    }

    return candidate;
};

export const repeatLabel = (mode) => {
    if (mode === 'all') {
        return 'ALL';
    }

    if (mode === 'one') {
        return 'ONE';
    }

    return 'OFF';
};

export const playbackLabel = (isPlaying, isPaused) => {
    if (!isPlaying) {
        return 'STOPPED';
    }

    return isPaused ? 'PAUSED' : 'PLAYING';
};

export const getVisibleTracks = (tracks, selectedIndex, currentIndex, size) => {
    const total = tracks.length;

    if (total <= size) {
        return {
            items: tracks,
            start: 0,
            end: total,
        };
    }

    const anchor = Math.max(selectedIndex, currentIndex ?? 0);
    let start = anchor - Math.floor(size / 2);
    start = clamp(start, 0, total - size);
    const end = start + size;

    return {
        items: tracks.slice(start, end),
        start,
        end,
    };
};

export const decideNextTrackIndex = ({
    justFinishedIndex,
    tracksLength,
    repeatMode,
    shuffle,
    random = Math.random,
}) => {
    if (tracksLength <= 0) {
        return null;
    }

    if (repeatMode === 'one') {
        return justFinishedIndex;
    }

    if (shuffle) {
        return randomIndex(tracksLength, justFinishedIndex, random);
    }

    const next = justFinishedIndex + 1;
    if (next < tracksLength) {
        return next;
    }

    if (repeatMode === 'all') {
        return 0;
    }

    return null;
};

export const getPlaybackCandidates = (platform) => {
    if (platform === 'darwin') {
        return ['afplay', 'ffplay', 'mpv'];
    }

    if (platform === 'linux') {
        return ['ffplay', 'mpv', 'vlc'];
    }

    return [];
};

export const pickPlaybackCommand = (candidates, hasCommand) => {
    for (const candidate of candidates) {
        if (hasCommand(candidate)) {
            return candidate;
        }
    }

    return null;
};
