import { spawn } from 'node:child_process';
import { accessSync } from 'node:fs';

const FFPLAY_CANDIDATES = ['ffplay', '/opt/homebrew/bin/ffplay', '/usr/local/bin/ffplay'];

export const resolveFfplay = () => {
    for (const candidate of FFPLAY_CANDIDATES) {
        try {
            accessSync(candidate, 1);
            return candidate;
        } catch {
            // Try the next candidate.
        }
    }

    return FFPLAY_CANDIDATES[0];
};

export const playFfplay = (url, { onEnd, onError } = {}) => {
    const binary = resolveFfplay();
    const proc = spawn(binary, ['-nodisp', '-autoexit', '-loglevel', 'quiet', url], {
        stdio: 'ignore',
    });

    const handle = {
        stop() {
            if (!proc.killed) {
                proc.kill('SIGTERM');
            }
        },
    };

    proc.on('error', (error) => {
        onError?.(error);
    });

    proc.on('close', (code, signal) => {
        if (signal === 'SIGTERM') {
            return;
        }

        if (code === 0) {
            onEnd?.();
            return;
        }

        onError?.(new Error(`Playback stopped (code ${code ?? 'unknown'}).`));
    });

    return handle;
};
