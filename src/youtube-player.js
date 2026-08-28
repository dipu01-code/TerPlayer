import { spawn } from 'node:child_process';
import { accessSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveFfplay } from './ffplay-player.js';

const MODULE_DIR = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(MODULE_DIR, '..');
const YT_DLP = path.join(PROJECT_ROOT, 'node_modules', 'youtube-dl-exec', 'bin', 'yt-dlp');

const MIN_PLAY_MS = 1500;

export const playYouTube = (videoId, { onEnd, onError } = {}) => {
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const ffplayBin = resolveFfplay();
    let stopped = false;
    const startedAt = Date.now();

    const ytdlp = spawn(
        YT_DLP,
        ['-f', 'bestaudio/best', '-o', '-', '--no-warnings', '--no-playlist', watchUrl],
        { stdio: ['ignore', 'pipe', 'pipe'] },
    );

    const ffplay = spawn(ffplayBin, ['-nodisp', '-autoexit', '-loglevel', 'quiet', '-'], {
        stdio: ['pipe', 'ignore', 'ignore'],
    });

    ytdlp.stdout.pipe(ffplay.stdin);

    const stderrChunks = [];
    ytdlp.stderr.on('data', (chunk) => stderrChunks.push(chunk));

    ytdlp.stdout.on('error', () => {
        // ffplay closed first while yt-dlp was still piping.
    });

    ffplay.stdin.on('error', () => {
        // Pipe closed during stop or stream end.
    });

    const cleanup = () => {
        if (!ytdlp.killed) {
            ytdlp.kill('SIGTERM');
        }

        if (!ffplay.killed) {
            ffplay.kill('SIGTERM');
        }
    };

    const handle = {
        stop() {
            stopped = true;
            cleanup();
        },
    };

    ytdlp.on('error', (error) => {
        if (stopped) {
            return;
        }

        stopped = true;
        onError?.(error);
    });

    ffplay.on('error', (error) => {
        if (stopped) {
            return;
        }

        stopped = true;
        cleanup();
        onError?.(error);
    });

    ffplay.on('close', (code, signal) => {
        if (stopped || signal === 'SIGTERM') {
            return;
        }

        cleanup();

        const elapsed = Date.now() - startedAt;
        if (code === 0 && elapsed >= MIN_PLAY_MS) {
            onEnd?.();
            return;
        }

        const detail = Buffer.concat(stderrChunks).toString('utf8').trim();
        const reason =
            elapsed < MIN_PLAY_MS
                ? 'Stream ended too quickly. Check your internet connection and try another result.'
                : `Playback stopped (code ${code ?? 'unknown'}).`;

        onError?.(new Error(detail ? `${reason} ${detail.split('\n').at(-1)}` : reason));
    });

    return handle;
};
