import yts from 'yt-search';

const AUDIUS_HOSTS = [
    'https://discoveryprovider.audius.co',
    'https://discoveryprovider2.audius.co',
    'https://discoveryprovider3.audius.co',
];

const APP_NAME = 'terplayer';

const fetchJson = async (url, timeoutMs = 12_000) => {
    const response = await fetch(url, {
        signal: AbortSignal.timeout(timeoutMs),
        headers: { accept: 'application/json' },
    });

    if (!response.ok) {
        throw new Error(`Request failed (${response.status})`);
    }

    return response.json();
};

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
        .map((video) => ({
            id: `youtube:${video.videoId}`,
            title: video.title?.trim() || 'Untitled',
            artist: video.author?.name?.trim() || 'YouTube',
            durationSec: Number.isFinite(video.seconds) ? video.seconds : null,
            source: 'youtube',
            videoId: video.videoId,
            streamUrl: null,
            _score: scoreYouTubeVideo(video, queryTokens, query),
        }))
        .sort((left, right) => right._score - left._score)
        .slice(0, limit)
        .map(({ _score, ...track }) => track);
};

const searchAudius = async (query, limit, signal) => {
    const encoded = encodeURIComponent(query.trim());

    for (const host of AUDIUS_HOSTS) {
        if (signal?.aborted) {
            return [];
        }

        try {
            const data = await fetch(
                `${host}/v1/tracks/search?query=${encoded}&app_name=${APP_NAME}&limit=${limit}`,
                { signal: AbortSignal.any([AbortSignal.timeout(12_000), signal].filter(Boolean)) },
            );

            if (!data.ok) {
                continue;
            }

            const payload = await data.json();
            const tracks = payload.data ?? [];

            return tracks
                .filter((track) => track?.is_streamable !== false)
                .map((track) => ({
                    id: `audius:${track.id}`,
                    title: track.title?.trim() || 'Untitled',
                    artist: track.user?.name?.trim() || 'Unknown artist',
                    durationSec: Number.isFinite(track.duration) ? track.duration : null,
                    source: 'audius',
                    streamUrl:
                        track.stream?.url ??
                        `${host}/v1/tracks/${track.id}/stream?app_name=${APP_NAME}`,
                }));
        } catch {
            // Try the next Audius host.
        }
    }

    return [];
};

const pickArchiveFile = (files = []) => {
    const ranked = files
        .filter((file) => {
            const name = file.name?.toLowerCase() ?? '';
            return (
                name.endsWith('.mp3') ||
                name.endsWith('.ogg') ||
                name.endsWith('.wav') ||
                name.endsWith('.flac') ||
                name.endsWith('.m4a')
            );
        })
        .sort((left, right) => {
            const score = (file) => {
                const name = file.name?.toLowerCase() ?? '';
                if (name.endsWith('.mp3')) {
                    return 0;
                }

                if (name.endsWith('.m4a')) {
                    return 1;
                }

                if (name.endsWith('.ogg')) {
                    return 2;
                }

                return 3;
            };

            return score(left) - score(right);
        });

    return ranked[0] ?? null;
};

const searchArchive = async (query, limit, signal) => {
    const encoded = encodeURIComponent(query.trim());
    const searchUrl =
        `https://archive.org/advancedsearch.php?q=${encoded} AND mediatype:audio` +
        `&fl[]=identifier,title,creator&rows=${limit}&output=json`;

    const data = await fetchJson(searchUrl, 12_000);
    const docs = data?.response?.docs ?? [];
    const results = [];

    for (const doc of docs) {
        if (signal?.aborted) {
            break;
        }

        const identifier = doc.identifier;
        if (!identifier) {
            continue;
        }

        try {
            const metadata = await fetchJson(`https://archive.org/metadata/${identifier}`, 10_000);
            const file = pickArchiveFile(metadata.files);
            if (!file?.name) {
                continue;
            }

            const title = doc.title?.trim() || file.title?.trim() || identifier;
            const artist = doc.creator?.trim() || metadata.metadata?.creator?.trim() || 'Internet Archive';
            const durationSec = Number(file.length);
            const streamUrl = `https://archive.org/download/${identifier}/${encodeURIComponent(file.name)}`;

            results.push({
                id: `archive:${identifier}:${file.name}`,
                title,
                artist,
                durationSec: Number.isFinite(durationSec) ? durationSec : null,
                source: 'archive',
                streamUrl,
            });
        } catch {
            // Skip entries that fail metadata lookup.
        }
    }

    return results;
};

const mergeResults = (groups) => {
    const seen = new Set();
    const merged = [];

    for (const group of groups) {
        for (const track of group) {
            const key = track.id || `${track.title.toLowerCase()}|${track.artist.toLowerCase()}`;
            if (seen.has(key)) {
                continue;
            }

            seen.add(key);
            merged.push(track);
        }
    }

    return merged;
};

export const searchTracks = async (query, { limit = 12, signal } = {}) => {
    const trimmed = query.trim();
    if (!trimmed) {
        return [];
    }

    const youtubeLimit = Math.max(limit, 10);
    const youtube = await searchYouTube(trimmed, youtubeLimit, signal);

    if (signal?.aborted) {
        return [];
    }

    const settled = await Promise.allSettled([
        searchAudius(trimmed, Math.min(4, limit), signal),
        searchArchive(trimmed, Math.min(3, limit), signal),
    ]);

    const extras = settled
        .filter((result) => result.status === 'fulfilled')
        .map((result) => result.value);

    return mergeResults([youtube, ...extras]).slice(0, limit);
};
