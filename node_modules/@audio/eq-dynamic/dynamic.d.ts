/** One dynamic-EQ band: a sidechain-driven peaking filter at `fc`. */
export interface DynamicBand {
  /** band center frequency, Hz — both the sidechain bandpass and the peaking filter */
  fc: number
  /** sidechain bandpass / peaking filter Q. Default 2 */
  Q?: number
  /** level, in dB, above which gain reduction (or, in `'up'` mode, boost) engages. Default -30 */
  threshold?: number
  /** compression ratio applied to the amount over threshold. Default 3 */
  ratio?: number
  /** envelope attack time, ms. Default 5 */
  attack?: number
  /** envelope release time, ms. Default 80 */
  release?: number
  /** maximum gain change, dB — caps cut depth (`'down'`) or boost (`'up'`). Default 12 */
  maxGain?: number
  /** `'down'` cuts the band when it's over threshold (de-esser/soothe); `'up'` boosts it instead. Default 'down' */
  mode?: 'down' | 'up'
}

/** Dynamic EQ parameters. */
export interface DynamicEqParams {
  /** sample rate, Hz. Default 44100 */
  fs?: number
  /** bands, each independently sidechain-detected and peaking-filtered */
  bands?: DynamicBand[]
}

/**
 * Apply a dynamic EQ in place — per-band peaking gain driven by that band's own energy
 * (Pro-Q3 / soothe class; the generalized de-esser). Per band: a bandpass sidechain feeds
 * an attack/release envelope follower; when the envelope exceeds `threshold`, a peaking
 * filter at `fc` cuts (or, in `'up'` mode, boosts) proportionally to `ratio`, capped at
 * `maxGain`. Peaking coefficients are re-derived every 64-sample block for smoothness
 * without per-sample coefficient cost.
 *
 * Unlike the biquad-based atoms in this family, `params` does **not** persist state
 * across calls — sidechain/audio-path biquad state and envelope followers are allocated
 * fresh inside every call and start at zero, so each call is a self-contained batch pass
 * rather than a streaming chunk. Call it once with the whole buffer, not chunk-by-chunk.
 */
export default function dynamicEq(data: Float32Array, params?: DynamicEqParams): Float32Array
