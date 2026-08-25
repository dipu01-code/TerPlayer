/** Tilt EQ — one-knob see-saw around a pivot frequency. */
export interface TiltParams {
  /** tilt amount, dB. Positive tilts bass up / treble down; negative the opposite. Default 0 */
  gain?: number
  /** pivot frequency, Hz — the point the tilt see-saws around. Default 1000 */
  pivot?: number
  /** sample rate, Hz. Default 44100 */
  fs?: number
}

/**
 * Apply a one-knob tilt EQ in place — a low-shelf at `pivot` boosted by `gain` and a
 * high-shelf at `pivot` cut by `gain` (both Q 0.5), cascaded, so the two shelves meet
 * near-flat at the pivot and diverge oppositely on either side.
 *
 * `params` doubles as persisted state: both shelves' coefficients and filter memory are
 * cached on `params` and only rebuilt when `gain`/`pivot`/`fs` change, so passing the
 * *same* params object across successive calls carries filter state across block
 * boundaries automatically.
 */
export default function tilt<T extends number[] | Float32Array | Float64Array>(data: T, params: TiltParams): T
