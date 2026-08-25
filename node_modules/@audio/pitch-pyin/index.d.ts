/** pYIN — probabilistic YIN (Mauch & Dixon, 2014). */
export interface PyinOptions {
  /** sample rate (Hz), default 44100 */
  fs?: number
  /** minimum detectable frequency (Hz), default 50 */
  minFreq?: number
  /** maximum detectable frequency (Hz), default 2000 */
  maxFreq?: number
}

/** One candidate period from the Beta(2, 18)-weighted threshold sweep. */
export interface PyinCandidate {
  /** candidate frequency (Hz) */
  freq: number
  /** posterior probability, normalized across all candidates (sums to 1) */
  prob: number
}

/**
 * Single-frame pitch estimate with full posterior over candidate periods.
 * `clarity` is the clamped total probability mass captured by the candidate set.
 * Returns null if no candidate period was found at any threshold.
 */
export default function pyin(data: Float32Array | Float64Array, options?: PyinOptions): { freq: number, clarity: number, candidates: PyinCandidate[] } | null
