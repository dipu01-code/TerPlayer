/** Phase-vocoder engine — frame-level primitives over STFT magnitude/phase arrays. Pure math, no defaults. */

/** Per-frame geometry the scatter/lock primitives read from. */
export interface PvocCtx {
  /** Nyquist bin index (frameSize / 2) */
  half: number
  /** hop size, samples */
  hop: number
  /** Hz per FFT bin (fs / N) */
  freqPerBin: number
  /** analysis window / FFT size */
  N: number
}

export const PI2: number
/** rms(w)/mean(w) for the engine's periodic Hann — energy-preserving OLA gain for scatterGated. */
export const WIN_GAIN: number

/** Wrap a phase (radians) into (−π, π]. */
export function wrapPhase(p: number): number

/** Local magnitude maxima of `mag[0..half]` above a fraction of the frame's peak. Returns bin indices, ascending. */
export function findPeaks(mag: Float32Array | Float64Array, half: number): number[]

/** Binary-search the peak (from `findPeaks`) nearest bin `k`. Returns −1 if `peaks` is empty. */
export function nearestPeak(peaks: number[], k: number): number

/**
 * Bernsee/SMB peak-gated bin scatter — pitch shift by `ratio`, RMS-preserving collisions.
 * `newMag`/`newFreq`/`peakMag` are caller-owned scratch sized `half+1`, zero-filled before the call.
 * Writes into `newMag`/`newFreq` in place.
 */
export function scatterGated(
  mag: Float32Array | Float64Array,
  phase: Float32Array | Float64Array,
  prevPhase: Float32Array | Float64Array | null,
  ratio: number,
  ctx: PvocCtx,
  newMag: Float64Array,
  newFreq: Float64Array,
  peakMag: Float64Array,
): void

/**
 * Laroche-Dolson rigid-ROI peak-locked bin scatter — phase-coherent shift by `ratio`.
 * `syn` is the caller-owned running per-bin phase accumulator (persists across frames), mutated in place.
 * `newMag`/`newPhase`/`peakMag` are caller-owned scratch sized `half+1`; `peakDest`/`peakSynPhase` sized `peaks.length`. All zero-filled before the call.
 */
export function scatterLocked(
  mag: Float32Array | Float64Array,
  phase: Float32Array | Float64Array,
  prevPhase: Float32Array | Float64Array | null,
  reset: boolean,
  peaks: number[],
  ratio: number,
  ctx: PvocCtx,
  syn: Float64Array,
  newMag: Float64Array,
  newPhase: Float64Array,
  peakDest: Int32Array,
  peakSynPhase: Float64Array,
  peakMag: Float64Array,
): void

/** Scalar or time-varying ratio → per-frame resolver. */
export function makeFrameRatio(ratio: number | ((t: number) => number)): {
  /** ratio at t = 0 */
  scalar: number
  /** ratio at a given frame position */
  at(frameStart: number, sampleRate: number): number
}

/** Lock non-peak bin phases to their nearest peak's rotation, in place on `propPhase` (time-stretch coherence). */
export function lockPhase(
  phase: Float32Array | Float64Array,
  propPhase: Float32Array | Float64Array,
  mag: Float32Array | Float64Array,
  half: number,
): void
