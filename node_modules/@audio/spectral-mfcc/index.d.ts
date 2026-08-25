/** MFCC — mel-frequency cepstral coefficients: FFT → mel filterbank (Davis & Mermelstein 1980) → log → DCT-II. */
export interface MfccOptions {
  /** sample rate, default 44100 */
  fs?: number
  /** number of cepstral coefficients returned, default 13 */
  bins?: number
  /** mel filterbank size, default 40 */
  nMel?: number
  /** filterbank low edge, Hz, default 0 */
  fmin?: number
  /** filterbank high edge, Hz, default fs / 2 */
  fmax?: number
}

/** Signal-domain: pass a raw PCM frame (power-of-2 length), computes its own FFT. */
export default function mfcc(data: Float32Array | Float64Array, options?: MfccOptions): Float32Array
