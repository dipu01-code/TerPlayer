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
