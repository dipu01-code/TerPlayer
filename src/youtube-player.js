import { spawn, spawnSync } from 'node:child_process';

const YT_DLP_CANDIDATES = ['yt-dlp', '/opt/homebrew/bin/yt-dlp', '/usr/local/bin/yt-dlp'];

let ytDlpBin = null;

// Bare names live on PATH, so probe by running them instead of checking the file.
// A miss is not cached, so installing yt-dlp works without restarting the player.
const resolveYtDlp = () =>
    (ytDlpBin ??= YT_DLP_CANDIDATES.find((bin) => !spawnSync(bin, ['--version'], { stdio: 'ignore' }).error) ?? null);

// Downloads the audio into memory (nothing is written to disk). The `audio` package
// stalls on YouTube's stream URLs, so it gets the bytes instead.
// `signal` kills yt-dlp, so stopping or switching tracks ends the download.
export const fetchYouTubeAudio = (videoId, signal) =>
    new Promise((resolve, reject) => {
        const bin = resolveYtDlp();
        if (!bin) {
            reject(new Error('yt-dlp not found. Install it (e.g. `brew install yt-dlp`) and try again.'));
            return;
        }

        const proc = spawn(
            bin,
            [
                '-q',
                '--no-warnings',
                '--no-playlist',
                '-f',
                // m4a piped to stdout skips yt-dlp's container fix-up and won't decode; webm does.
                'bestaudio[ext=webm]/bestaudio',
                '-o',
                '-',
                `https://www.youtube.com/watch?v=${videoId}`,
            ],
            { stdio: ['ignore', 'pipe', 'pipe'], signal },
        );

        const out = [];
        const err = [];
        proc.stdout.on('data', (chunk) => out.push(chunk));
        proc.stderr.on('data', (chunk) => err.push(chunk));
        proc.on('error', reject);
        proc.on('close', (code) => {
            if (code === 0 && out.length > 0) {
                resolve(new Uint8Array(Buffer.concat(out)));
                return;
            }

            const detail = Buffer.concat(err).toString('utf8').trim().split('\n').at(-1);
            reject(new Error(`YouTube download failed${detail ? `: ${detail}` : ` (code ${code})`}.`));
        });
    });
