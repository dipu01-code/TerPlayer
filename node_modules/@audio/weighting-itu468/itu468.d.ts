// @audio/weighting-itu468 — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface Itu468Params {
  /** sample rate, default 48000 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface Itu468 {
  /** Filter `data` in place through the ITU-R BS.468-4 cascade. Returns `data`. */
  (data: Buf, params?: Itu468Params): Buf
  /**
   * ITU-R BS.468-4 noise-weighting analog prototype, exact matched-z realization —
   * 6 poles (two complex pairs plus two real) and one zero at DC, found via Durand-Kerner
   * root-finding on the spec's rational polynomial (Rec. ITU-R BS.468-4 Annex 1). The
   * analog prototype matches the spec's reference table to within 0.05 dB across
   * 31.5 Hz–20 kHz; error grows above ~10 kHz at 44.1/48 kHz as Nyquist is approached.
   * Peaks +12.2 dB near 6.3 kHz, normalized to exactly 0 dB at 1 kHz. Returns 3 SOS
   * sections.
   * @param fs sample rate, default 48000
   */
  coefs(fs?: number): SOS
  /**
   * |H(f)| — the exact magnitude of this atom's own `.coefs(fs)` cascade at frequency `f`,
   * not an independent analog approximation.
   * @param fs sample rate, default 48000
   */
  response(f: number, fs?: number): number
}

/** ITU-R BS.468-4 noise-weighting filter, peaked near 6.3 kHz. `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const itu468: Itu468
export default itu468
