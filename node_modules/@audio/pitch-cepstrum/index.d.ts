/** Real cepstrum pitch detection (Noll, 1967). Requires power-of-2 window length. */
export interface CepstrumOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** minimum detectable frequency (Hz), default 50 */
  minFreq?: number
  /** maximum detectable frequency (Hz), default 2000 */
  maxFreq?: number
  /** minimum clarity to accept, default 0.3 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. Throws if data.length is not a power of 2. */
export default function cepstrum(data: Float32Array | Float64Array, options?: CepstrumOptions): { freq: number, clarity: number } | null
