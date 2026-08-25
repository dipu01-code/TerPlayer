// Phase-vocoder engine — the spectral bin-scatter/phase-lock machinery behind
// pitch shifting (@audio/shift-pvoc*), time stretching (@audio/stretch-pvoc*), and
// spectral freezing. Operates on STFT magnitude/phase frames; pair with
// fourier-transform/stft (ana/syn hop) or @audio/stft (AMS).
//
//   - scatterGated: Bernsee/SMB peak-gated bin scatter (pitch shift by ratio)
//   - scatterLocked: Laroche-Dolson rigid-ROI peak-locked scatter (phase coherent)
//   - lockPhase: lock non-peak bin phases to their nearest peak's rotation (time stretch)
//   - findPeaks / nearestPeak / makeFrameRatio / wrapPhase: the supporting primitives

export const PI2 = Math.PI * 2

export function wrapPhase(p) {
  return p - Math.round(p / PI2) * PI2
}

// First-order local magnitude peaks above a fraction of the frame's peak.
// ±1 comparison keeps closely-spaced chord partials whose mainlobes overlap. `>=` on the
// left / `>` on the right reports the trailing edge of an exact-magnitude plateau exactly
// once, instead of a strict `>` on both sides missing the whole plateau.
export function findPeaks(mag, half) {
  let maxM = 0
  for (let k = 0; k <= half; k++) if (mag[k] > maxM) maxM = mag[k]
  let floor = Math.max(1e-8, maxM * 0.005)
  let peaks = []
  for (let k = 1; k < half; k++) {
    let v = mag[k]
    if (v < floor) continue
    if (v >= mag[k - 1] && v > mag[k + 1]) peaks.push(k)
  }
  return peaks
}

// Binary-search nearest peak index for bin k.
export function nearestPeak(peaks, k) {
  if (!peaks.length) return -1
  let lo = 0, hi = peaks.length - 1
  while (lo < hi) {
    let mid = (lo + hi) >> 1
    if (peaks[mid] < k) lo = mid + 1
    else hi = mid
  }
  if (lo > 0 && Math.abs(peaks[lo - 1] - k) <= Math.abs(peaks[lo] - k)) return lo - 1
  return lo
}

// Peak-gated bin scatter (Bernsee/SMB scheme): every analysis bin at or adjacent (±1) to a
// local magnitude peak advances phase at its own instantaneous frequency, scales it by
// `ratio`, and deposits into the destination bin that frequency implies. Colliding bins
// accumulate in the energy domain (Σmag², √ at the end) — synthesis treats each bin as an
// independent oscillator, so energies add where magnitude-summing overshoots (+4.3 dB for
// a Hann mainlobe's own ±1 bins landing together) and last-writer-wins discards every
// other contributor. The frequency written to a bin is its loudest contributor's (a
// quieter contributor's frequency estimate is masked anyway).
// The gate keeps only mainlobe cores; skirt bins it drops carry real energy belonging to
// the same partials. The frame is renormalized so kept-bin energy matches the input
// frame's — minus content whose destination fell outside Nyquist, which is legitimately
// lost — times WIN_GAIN: concentrating a windowed mainlobe into one bin makes the ISTFT
// frame a pure sinusoid where the analysis frame was a windowed one, and through the
// engine's w·(·)/Σw² overlap-add that costs exactly mean(w)/rms(w). Per-frame and causal,
// so batch and stream reconstruct at identical loudness with no whole-signal correction.
// `newMag`/`newFreq`/`peakMag` are caller-owned scratch sized `half+1`, zero-filled by the
// caller before the call. `prevPhase` is the previous frame's unwrapped phase, or `null`
// on the first frame.
export function scatterGated(mag, phase, prevPhase, ratio, ctx, newMag, newFreq, peakMag) {
  let { half, hop, freqPerBin } = ctx
  let maxM = 0
  for (let k = 0; k <= half; k++) if (mag[k] > maxM) maxM = mag[k]
  let floor = Math.max(1e-8, maxM * 0.005)
  let eIn = 0, eOut = 0
  for (let k = 0; k <= half; k++) {
    let e = mag[k] * mag[k]
    eIn += e
    let eligible = false
    for (let d = -1; d <= 1; d++) {
      let j = k + d
      if (j <= 0 || j >= half) continue
      if (mag[j] >= floor && mag[j] >= mag[j - 1] && mag[j] > mag[j + 1]) { eligible = true; break }
    }
    if (!eligible) continue
    let trueFreq
    if (!prevPhase) trueFreq = k * freqPerBin
    else {
      let dp = wrapPhase(phase[k] - prevPhase[k] - k * freqPerBin * hop)
      trueFreq = k * freqPerBin + dp / hop
    }
    let shifted = trueFreq * ratio
    let destBin = Math.round(shifted / freqPerBin)
    if (destBin < 0 || destBin > half) { eIn -= e; continue }
    eOut += e
    let r = lobeGain(shifted - destBin * freqPerBin, ctx.N)
    newMag[destBin] += e / (r * r)
    if (mag[k] > peakMag[destBin]) { peakMag[destBin] = mag[k]; newFreq[destBin] = shifted }
  }
  let g = (eOut > 1e-24 && eIn > 1e-24 ? Math.sqrt(eIn / eOut) : 1) * WIN_GAIN
  for (let k = 0; k <= half; k++) if (newMag[k]) newMag[k] = Math.sqrt(newMag[k]) * g
}

// rms(w)/mean(w) for the engine's periodic Hann: sqrt(3/8)/(1/2) = sqrt(3/2).
export const WIN_GAIN = Math.sqrt(1.5)

// Mean overlap-add amplitude of a partial whose intra-frame (bin-grid) and inter-frame
// (true) frequencies differ by `dw` rad/sample: |W(dw)|/W(0) for the engine's periodic
// Hann of length N. The synthesized bin oscillates on the bin grid inside each frame
// while its phase steps at the true frequency across frames, so overlapping frames sum
// slightly incoherently — the classic vocoder scalloping loss, deterministic per bin.
function lobeGain(dw, N) {
  if (!dw) return 1
  let d = (t) => {
    let s = Math.sin(t / 2)
    return Math.abs(s) < 1e-12 ? N : Math.sin(N * t / 2) / s
  }
  let b = PI2 / N
  return Math.abs(0.5 * d(dw) + 0.25 * d(dw - b) + 0.25 * d(dw + b)) / (0.5 * N)
}

// Peak-locked rigid-ROI bin scatter (Laroche-Dolson): each `findPeaks` peak advances its own
// phase at its instantaneous frequency × `ratio`; every other bin rides along rigidly at its
// nearest peak's integer bin-shift, carrying phase relative to that peak (phase coherence
// across the peak's region of influence). Colliding destination bins accumulate in the
// energy domain (Σmag², √ at the end); the phase written is the loudest contributor's —
// same RMS-preserving collision policy as `scatterGated`.
// `reset` skips phase-derivative estimation (first frame, or a caller-detected phase
// discontinuity such as a transient) and uses the analysis phase directly instead of
// integrating. `syn` is the caller-owned running per-bin phase accumulator (persists across
// frames). `newMag`/`newPhase`/`peakMag` are caller-owned scratch sized `half+1`, zero-filled
// by the caller; `peakDest`/`peakSynPhase` are caller-owned scratch sized `peaks.length`.
export function scatterLocked(mag, phase, prevPhase, reset, peaks, ratio, ctx, syn, newMag, newPhase, peakDest, peakSynPhase, peakMag) {
  let { half, hop, freqPerBin } = ctx
  if (_boost.length <= half) _boost = new Float64Array(half + 1)
  for (let i = 0; i < peaks.length; i++) {
    let k = peaks[i]
    let trueFreq
    if (reset) trueFreq = k * freqPerBin
    else {
      let dp = wrapPhase(phase[k] - prevPhase[k] - k * freqPerBin * hop)
      trueFreq = k * freqPerBin + dp / hop
    }
    let shifted = trueFreq * ratio
    // Shift the lobe by the integer bin count closest to the true frequency delta: the
    // lobe's own frac is preserved, so the intra-/inter-frame frequency mismatch stays
    // within ±half a bin — where the scalloping model below is accurate.
    let destBin = k + Math.round((shifted - trueFreq) / freqPerBin)
    if (destBin < 0 || destBin > half) { peakDest[i] = -1; continue }
    let newSyn = reset ? phase[k] : wrapPhase(syn[destBin] + shifted * hop)
    peakDest[i] = destBin
    peakSynPhase[i] = newSyn
    syn[destBin] = newSyn
    let r = lobeGain(shifted - (trueFreq + (destBin - k) * freqPerBin), ctx.N)
    _boost[i] = 1 / (r * r)
  }

  // No WIN_GAIN here: the rigid ROI shift carries the whole mainlobe shape to the
  // destination, so the ISTFT frame stays a windowed one — only collision and
  // past-Nyquist bookkeeping need correction. Bins riding a peak whose destination
  // fell outside Nyquist are legitimately lost and excluded from the energy target.
  let eIn = 0, eOut = 0
  for (let k = 0; k <= half; k++) {
    let pi = nearestPeak(peaks, k)
    if (pi < 0) continue
    let destBin = peakDest[pi]
    if (destBin < 0) continue
    let e = mag[k] * mag[k]
    eIn += e
    let pk = peaks[pi]
    let dest = destBin + (k - pk)
    if (dest < 0 || dest > half) continue
    eOut += e
    newMag[dest] += e * _boost[pi]
    if (mag[k] > peakMag[dest]) { peakMag[dest] = mag[k]; newPhase[dest] = peakSynPhase[pi] + (phase[k] - phase[pk]) }
  }
  let g = eOut > 1e-24 && eIn > 1e-24 ? Math.sqrt(eIn / eOut) : 1
  for (let k = 0; k <= half; k++) if (newMag[k]) newMag[k] = Math.sqrt(newMag[k]) * g
}

// scatterLocked-internal per-peak scalloping boosts; grown once, reused across frames.
let _boost = new Float64Array(0)

// Variable-ratio resolver for STFT process callbacks. Returns `{ scalar, at }`
// where `scalar` is the ratio at t=0 and `at(frameStart, sampleRate)` resolves
// the ratio for a given frame position.
export function makeFrameRatio(ratio) {
  if (typeof ratio !== 'function') return { scalar: ratio, at: () => ratio }
  let scalar = ratio(0)
  return {
    scalar,
    at(frameStart, sampleRate) {
      let r = ratio(Math.max(0, frameStart) / sampleRate)
      return (!Number.isFinite(r) || r <= 0) ? (scalar || 1) : r
    }
  }
}

// ── Time-stretch phase locking (Laroche & Dolson 1999) ──
// Prominence-based peak mask tuned for stretch: keeps chord partials, rejects
// leakage shoulders. Internal to lockPhase; distinct from the shift-side findPeaks.
let _peakMask = new Uint8Array(0)
function peakMask(mag, half) {
  if (_peakMask.length !== half + 1) _peakMask = new Uint8Array(half + 1)
  let peaks = _peakMask
  peaks.fill(0)
  if (half <= 1) {
    peaks[0] = 1
    if (half === 1) peaks[1] = 1
    return peaks
  }

  let maxMag = 0
  for (let k = 0; k <= half; k++) if (mag[k] > maxMag) maxMag = mag[k]

  let minMag = Math.max(1e-8, maxMag * 0.015)
  let minProm = Math.max(1e-9, maxMag * 0.003)
  let lastPeak = -2, lastPeakMag = 0

  for (let k = 1; k < half; k++) {
    let value = mag[k]
    if (value < minMag || value < mag[k - 1] || value < mag[k + 1]) continue

    let shoulder = Math.max(mag[k - 1], mag[k + 1], k > 1 ? mag[k - 2] : 0, k + 2 <= half ? mag[k + 2] : 0)
    if (value - shoulder < minProm && value < maxMag * 0.1) continue

    if (k - lastPeak <= 1) {
      if (value > lastPeakMag) { peaks[lastPeak] = 0; peaks[k] = 1; lastPeak = k; lastPeakMag = value }
      continue
    }
    peaks[k] = 1; lastPeak = k; lastPeakMag = value
  }

  let found = false
  for (let k = 0; k <= half; k++) if (peaks[k]) { found = true; break }
  if (!found) {
    let best = 0
    for (let k = 1; k <= half; k++) if (mag[k] > mag[best]) best = k
    peaks[best] = 1
  }
  return peaks
}

// Lock non-peak bin phases to nearest peak's rotation, in place on `propPhase`.
let _peakBins = new Int32Array(0)
export function lockPhase(phase, propPhase, mag, half) {
  let peaks = peakMask(mag, half)
  if (_peakBins.length < half + 1) _peakBins = new Int32Array(half + 1)
  let peakBins = _peakBins, nBins = 0
  for (let k = 0; k <= half; k++) if (peaks[k]) peakBins[nBins++] = k
  if (!nBins) return

  for (let i = 0; i < nBins; i++) {
    let pk = peakBins[i]
    let start = i === 0 ? 0 : Math.floor((peakBins[i - 1] + pk) * 0.5) + 1
    let end = i === nBins - 1 ? half : Math.floor((pk + peakBins[i + 1]) * 0.5)
    let delta = propPhase[pk] - phase[pk]
    let lockFloor = Math.max(1e-10, mag[pk] * 0.03)
    for (let k = start; k <= end; k++) {
      if (k === pk || mag[k] < lockFloor) continue
      propPhase[k] = phase[k] + delta
    }
  }
}
