// @audio/weighting-a — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface AWeightingParams {
  /** sample rate, default 44100 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface AWeighting {
  /** Filter `data` in place through the A-weighting cascade. Returns `data`. */
  (data: Buf, params?: AWeightingParams): Buf
  /**
   * IEC 61672-1:2013 A-weighting analog prototype, matched-z discretized and normalized
   * to exactly 0 dB at 1 kHz — H(s) = K·s⁴ / ((s+w1)²(s+w2)(s+w3)(s+w4)²), poles at
   * f1=20.598997 Hz (double), f2=107.65265 Hz, f3=737.86223 Hz, f4=12194.217 Hz (double).
   * Returns 3 SOS sections.
   * @param fs sample rate, default 44100
   */
  coefs(fs?: number): SOS
  /**
   * |H(f)| — the exact magnitude of this atom's own `.coefs(fs)` cascade at frequency `f`,
   * not an independent analog approximation.
   * @param fs sample rate, default 44100
   */
  response(f: number, fs?: number): number
}

/** IEC 61672-1:2013 A-weighting filter. `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const aWeighting: AWeighting
export default aWeighting
