// @audio/weighting-k — TypeScript declarations

export type Buf = Float32Array | Float64Array | number[]

/** One biquad section: H(z) = (b0 + b1*z⁻¹ + b2*z⁻²) / (1 + a1*z⁻¹ + a2*z⁻²) */
export interface BiquadCoef { b0: number; b1: number; b2: number; a1: number; a2: number }

/** Cascade of biquad sections (second-order sections), applied in series */
export type SOS = BiquadCoef[]

export interface KWeightingParams {
  /** sample rate, default 48000 — SOS is recomputed when this changes mid-stream */
  fs?: number
  /** per-section filter state (2 taps each); set automatically on first call and persisted on this object for streaming reuse across chunks */
  state?: Float64Array[]
  [key: string]: unknown
}

interface KWeighting {
  /** Filter `data` in place through the K-weighting cascade. Returns `data`. */
  (data: Buf, params?: KWeightingParams): Buf
  /**
   * ITU-R BS.1770-4 K-weighting, redesigned per sample rate from the canonical analog
   * prototype constants (De Man 2014, "Evaluation of Implementations of the ITU-R BS.1770
   * Loudness Algorithm"; same design as pyloudnorm). Stage 1: spherical-head high shelf
   * (G=3.999843853973347 dB, Q=0.7071752369554196, fc=1681.974450955533 Hz). Stage 2:
   * RLB weighting highpass (Q=0.5003270373238773, fc=38.13547087602444 Hz, unnormalized
   * `{1,-2,1}` numerator at any fs). At fs=48000 reproduces the spec's published
   * coefficient table to ~1e-11. Returns 2 SOS sections (shelf, then highpass).
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

/** ITU-R BS.1770-4 K-weighting filter — the loudness pre-filter behind LUFS. `.coefs(fs)` for analysis, `.response(f, fs)` for magnitude at a frequency. */
declare const kWeighting: KWeighting
export default kWeighting
