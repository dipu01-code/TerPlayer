/** AMDF (Average Magnitude Difference Function) pitch detection (Ross et al., 1974). */
export interface AmdfOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** minimum detectable frequency (Hz), default 50 */
  minFreq?: number
  /** maximum detectable frequency (Hz), default 2000 */
  maxFreq?: number
  /** normalized AMDF dip threshold, default 0.3 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. */
export default function amdf(data: Float32Array | Float64Array, options?: AmdfOptions): { freq: number, clarity: number } | null
