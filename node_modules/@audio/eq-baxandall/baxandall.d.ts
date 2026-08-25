/** Baxandall tone control — reciprocal bass/treble shelves. */
export interface BaxandallParams {
  /** bass shelf gain, dB (positive boosts, negative cuts). Default 0 */
  bass?: number
  /** treble shelf gain, dB (positive boosts, negative cuts). Default 0 */
  treble?: number
  /** bass shelf corner frequency, Hz. Default 250 */
  fBass?: number
  /** treble shelf corner frequency, Hz. Default 4000 */
  fTreble?: number
  /** sample rate, Hz. Default 44100 */
  fs?: number
}

/**
 * Apply Baxandall bass/treble tone control in place — a low-shelf at `fBass` and a
 * high-shelf at `fTreble` (both Q 0.707), cascaded.
 *
 * `params` doubles as persisted state: each shelf's coefficients and filter memory are
 * cached on `params` and only rebuilt when their own gain/frequency/`fs` change, so
 * passing the *same* params object across successive calls carries filter state across
 * block boundaries automatically.
 */
export default function baxandall<T extends number[] | Float32Array | Float64Array>(data: T, params: BaxandallParams): T
