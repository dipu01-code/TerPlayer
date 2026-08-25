/** Harmonic Product Spectrum pitch detection (Schroeder, 1968). Requires power-of-2 window length. */
export interface HpsOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** number of harmonic products, default 5 */
  harmonics?: number
  /** minimum detectable frequency (Hz), default 50 */
  minFreq?: number
  /** maximum detectable frequency (Hz), default 4000 */
  maxFreq?: number
  /** candidate spacing in cents, default 10 */
  cents?: number
  /** minimum clarity to accept, default 0.1 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. Throws if data.length is not a power of 2. */
export default function hps(data: Float32Array | Float64Array, options?: HpsOptions): { freq: number, clarity: number } | null
