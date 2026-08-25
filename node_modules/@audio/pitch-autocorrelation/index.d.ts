/** Normalized autocorrelation pitch detection (baseline). */
export interface AutocorrelationOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** minimum normalized autocorrelation value to accept, default 0.5 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. */
export default function autocorrelation(data: Float32Array | Float64Array, options?: AutocorrelationOptions): { freq: number, clarity: number } | null
