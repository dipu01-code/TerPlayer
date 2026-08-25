// @audio/weighting-c — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface CWeightingParams {
  /** sample rate, default 44100 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface CWeighting {
  /** Filter `data` in place through the C-weighting cascade. Returns `data`. */
  (data: Buf, params?: CWeightingParams): Buf
  /**
   * IEC 61672-1:2013 C-weighting analog prototype, matched-z discretized and normalized
   * to exactly 0 dB at 1 kHz — H(s) = K·s² / ((s+w1)²(s+w4)²), poles at f1=20.598997 Hz
   * (double) and f4=12194.217 Hz (double), shared with A-weighting's outer poles but no
   * mid-band poles. Returns 2 SOS sections.
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

/** IEC 61672-1:2013 C-weighting filter. `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const cWeighting: CWeighting
export default cWeighting
