// @audio/weighting-riaa — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface RiaaParams {
  /** sample rate, default 44100 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface Riaa {
  /** Filter `data` in place through the RIAA de-emphasis cascade. Returns `data`. */
  (data: Buf, params?: RiaaParams): Buf
  /**
   * RIAA playback (de-emphasis) analog curve, bilinear-transformed with frequency
   * prewarping and normalized to exactly 0 dB at 1 kHz —
   * H(s) = (1 + s·T2) / ((1 + s·T1)(1 + s·T3)), T1=3180 µs (fp1≈50.05 Hz pole),
   * T2=318 µs (fz≈500.5 Hz zero), T3=75 µs (fp2≈2122 Hz pole) — the standard RIAA time
   * constants, folded into a single biquad. Returns 1 SOS section.
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

/** RIAA playback (de-emphasis) equalization filter. `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const riaa: Riaa
export default riaa
