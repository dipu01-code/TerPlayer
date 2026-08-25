/**
 * SWIPE′ pitch detection (Camacho & Harris, 2008), simplified single-window form.
 * Requires power-of-2 window length.
 */
export interface SwipeOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** minimum detectable frequency (Hz), default 60 */
  minFreq?: number
  /** maximum detectable frequency (Hz), default 4000 */
  maxFreq?: number
  /** candidate spacing in cents, default 10 */
  cents?: number
  /** minimum clarity to accept, default 0.15 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. Throws if data.length is not a power of 2. */
export default function swipe(data: Float32Array | Float64Array, options?: SwipeOptions): { freq: number, clarity: number } | null
