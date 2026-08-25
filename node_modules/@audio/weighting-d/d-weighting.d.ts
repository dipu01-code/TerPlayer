// @audio/weighting-d — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface DWeightingParams {
  /** sample rate, default 44100 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface DWeighting {
  /** Filter `data` in place through the D-weighting cascade. Returns `data`. */
  (data: Buf, params?: DWeightingParams): Buf
  /**
   * IEC 537 D-weighting analog prototype (aircraft-noise curve), matched-z discretized and
   * normalized to exactly 0 dB at 1 kHz —
   * H(s) = s·(s²+6532s+4.0975e7) / [(s+1776.3)(s+7288.5)(s²+21514s+3.8836e8)]:
   * one zero at DC plus a complex zero pair, two real poles plus a complex pole pair.
   * The only weighting curve with a resonant peak rather than a monotonic rolloff —
   * ≈+11.6 dB near 3.3 kHz (+11.5 dB at the IEC 537 3.15 kHz third-octave reference
   * point). Withdrawn from the modern standard. Returns 2 SOS sections.
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

/** IEC 537 D-weighting filter (aircraft noise, resonant hump near 3.3 kHz). `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const dWeighting: DWeighting
export default dWeighting
