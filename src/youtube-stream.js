import { Innertube } from 'youtubei.js';

let innertubePromise = null;

const getInnertube = () => {
    if (!innertubePromise) {
        innertubePromise = Innertube.create({ generate_session_locally: true }).catch((error) => {
            innertubePromise = null;
            throw error;
        });
    }

    return innertubePromise;
};

export const getYouTubeAudioUrl = async (videoId, signal) => {
    const yt = await getInnertube();
    const info = await yt.getBasicInfo(videoId, { client: 'IOS' });

    if (signal?.aborted) {
        throw new Error('Cancelled');
    }

    const format = info.chooseFormat({ type: 'audio', quality: 'best' });
    const url = format?.url;

    if (!url) {
        throw new Error('No playable audio stream found for this video.');
    }

    return {
        url,
        durationSec: Number(info.basic_info?.duration) || null,
    };
};
