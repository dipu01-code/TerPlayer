/** Center-channel vocal isolation/removal — the SoX `oops` complement, M/S based. */

/** Keep mid (center-panned) content, discard side. Mono passes through unchanged. */
export function isolate<T extends Float32Array | Float64Array>(channels: T[]): T[]
/** Keep side content, discard mid (center-panned) — karaoke. Mono passes through unchanged. */
export function remove<T extends Float32Array | Float64Array>(channels: T[]): T[]
