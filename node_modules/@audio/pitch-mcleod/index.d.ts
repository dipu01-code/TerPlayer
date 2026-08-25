/** McLeod Pitch Method (McLeod & Wyvill, 2005). */
export interface McleodOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** peak selection threshold as fraction of global max, default 0.9 */
  threshold?: number
}

/** Single-frame pitch estimate. Returns null if no periodic structure is found. */
export default function mcleod(data: Float32Array | Float64Array, options?: McleodOptions): { freq: number, clarity: number } | null
