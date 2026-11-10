import yts from 'yt-search';

// Tracks are fully downloaded and decoded in memory before playing (see youtube-player.js),
// so hour-long mixes mean a long silent wait and hundreds of MB. Live streams (0s) never end.
// shortcut: no tracks over 20 minutes, lift this once playback streams instead of downloading.
const MAX_TRACK_SEC = 20 * 60;

const tokenize = (value) =>
    value
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
        .split(/\s+/)
        .filter((token) => token.length > 1);

const scoreYouTubeVideo = (video, queryTokens, rawQuery) => {
    const title = video.title?.toLowerCase() ?? '';
    const artist = video.author?.name?.toLowerCase() ?? '';
    const combined = `${title} ${artist}`;
    let score = 0;

    const raw = rawQuery.toLowerCase();
    if (title.includes(raw) || combined.includes(raw)) {
        score += 80;
    }

    for (const token of queryTokens) {
        if (title.includes(token)) {
            score += 14;
        }

        if (artist.includes(token)) {
            score += 12;
        }
    }

    if (/official|lyric|audio|video/i.test(title)) {
        score += 10;
    }

    if (/live|cover|remix|mashup|bootleg|karaoke|sped up|slowed/i.test(title)) {
        score -= 18;
    }

    if (video.seconds > 0 && video.seconds <= 420) {
        score += 4;
    }

    if (video.views?.text) {
        score += 3;
    }

    return score;
};

const searchYouTube = async (query, limit, signal) => {
    if (signal?.aborted) {
        return [];
    }

    const result = await yts(query);
    const queryTokens = tokenize(query);

    return result.videos
        .filter((video) => video.seconds > 0 && video.seconds <= MAX_TRACK_SEC)
        .map((video) => ({
            id: `youtube:${video.videoId}`,
            title: video.title?.trim() || 'Untitled',
            artist: video.author?.name?.trim() || 'YouTube',
            durationSec: Number.isFinite(video.seconds) ? video.seconds : null,
            source: 'youtube',
            videoId: video.videoId,
            _score: scoreYouTubeVideo(video, queryTokens, query),
        }))
        .sort((left, right) => right._score - left._score)
        .slice(0, limit)
        .map(({ _score, ...track }) => track);
};

export const searchTracks = async (query, { limit = 12, signal } = {}) => {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    return searchYouTube(trimmed, limit, signal);
};
