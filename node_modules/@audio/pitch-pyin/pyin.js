/**
 * pYIN — probabilistic YIN (Mauch & Dixon, 2014).
 *
 * Runs YIN over a range of thresholds and weights each result by the
 * Beta(α=2, β=18) prior, producing a distribution over candidate periods
 * instead of a single hard pick. For a single frame the function returns
 * the most probable candidate; the full posterior is exposed via `candidates`.
 *
 * Full pYIN additionally runs Viterbi smoothing over a sequence of frames
 * with a pitch-transition prior — implemented separately via `track()`.
 *
 * @param {Float32Array | Float64Array} data - window of samples
 * @param {{fs?: number, minFreq?: number, maxFreq?: number}} [params]
 * @returns {{freq: number, clarity: number, candidates: {freq: number, prob: number}[]} | null}
 */
export default function pyin(data, params) {
  let fs = params?.fs || 44100
  let minFreq = params?.minFreq ?? 50
  let maxFreq = params?.maxFreq ?? 2000
  let len = data.length
  let half = len >> 1

  let tauMin = Math.max(2, Math.floor(fs / maxFreq))
  let tauMax = Math.min(half - 1, Math.ceil(fs / minFreq))
  if (tauMax <= tauMin + 1) return null

  // YIN step 1–2: cumulative mean normalized difference (CMND)
  let d = new Float64Array(half)
  for (let tau = 1; tau < half; tau++) {
    let sum = 0
    for (let i = 0; i < half; i++) {
      let diff = data[i] - data[i + tau]
      sum += diff * diff
    }
    d[tau] = sum
  }
  let cmndf = new Float64Array(half)
  cmndf[0] = 1
  let running = 0
  for (let tau = 1; tau < half; tau++) {
    running += d[tau]
    cmndf[tau] = running > 0 ? d[tau] * tau / running : 1
  }

  // thresholds and Beta(2,18) weights (discrete prior)
  let thresholds = [0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]
  let weights = thresholds.map(t => betaPdf(t * 2, 2, 18))
  let wSum = weights.reduce((a, b) => a + b, 0)
  weights = weights.map(w => w / wSum)

  // for each threshold, pick the first τ whose CMND dips below it (with local-min descent)
  // aggregate into probability distribution over periods
  let probByTau = new Map()
  for (let i = 0; i < thresholds.length; i++) {
    let thr = thresholds[i]
    let tau = tauMin
    while (tau < tauMax) {
      if (cmndf[tau] < thr) {
        while (tau + 1 < tauMax && cmndf[tau + 1] < cmndf[tau]) tau++
        break
      }
      tau++
    }
    if (tau >= tauMax) continue
    // voicing probability: higher when CMND is well below threshold
    let voiced = Math.max(0, Math.min(1, 1 - cmndf[tau]))
    let p = weights[i] * voiced
    probByTau.set(tau, (probByTau.get(tau) || 0) + p)
  }
  if (probByTau.size === 0) return null

  // build candidate list sorted by probability
  let candidates = [...probByTau.entries()]
    .map(([tau, prob]) => ({ tau, prob }))
    .sort((a, b) => b.prob - a.prob)

  // parabolic interpolation on the best τ
  let refine = (tau) => {
    if (tau < 1 || tau >= half - 1) return tau
    let s0 = cmndf[tau - 1], s1 = cmndf[tau], s2 = cmndf[tau + 1]
    let denom = s0 - 2 * s1 + s2
    return denom !== 0 ? tau + (s0 - s2) / (2 * denom) : tau
  }

  let totalProb = candidates.reduce((a, c) => a + c.prob, 0)
  let freqCandidates = candidates.map(c => ({
    freq: fs / refine(c.tau),
    prob: c.prob / totalProb,
  }))

  let best = freqCandidates[0]
  return {
    freq: best.freq,
    clarity: Math.min(1, totalProb),
    candidates: freqCandidates,
  }
}

// Beta(α, β) density at x ∈ [0,1]. Unnormalized form suffices for weighting.
function betaPdf(x, a, b) {
  if (x <= 0 || x >= 1) return 0
  return Math.pow(x, a - 1) * Math.pow(1 - x, b - 1)
}
