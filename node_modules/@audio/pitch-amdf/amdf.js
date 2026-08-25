/**
 * AMDF (Average Magnitude Difference Function) pitch detection.
 * Ross et al., 1974 — the classical predecessor to YIN.
 *
 * @param {Float32Array | Float64Array} data
 * @param {{fs?: number, minFreq?: number, maxFreq?: number, threshold?: number}} [params]
 * @returns {{freq: number, clarity: number} | null}
 */
export default function amdf(data, params) {
  let fs = params?.fs || 44100
  let minFreq = params?.minFreq ?? 50
  let maxFreq = params?.maxFreq ?? 2000
  let threshold = params?.threshold ?? 0.3
  let len = data.length

  let tauMin = Math.max(2, Math.floor(fs / maxFreq))
  let tauMax = Math.min(len >> 1, Math.ceil(fs / minFreq))
  if (tauMax <= tauMin + 1) return null

  // d(τ) = (1/(N-τ)) Σ |x[i] - x[i+τ]|
  let d = new Float64Array(tauMax + 1)
  for (let tau = tauMin; tau <= tauMax; tau++) {
    let sum = 0
    let count = len - tau
    for (let i = 0; i < count; i++) sum += Math.abs(data[i] - data[i + tau])
    d[tau] = sum / count
  }

  // normalize by max so threshold is scale-invariant
  let dMax = 0
  for (let tau = tauMin; tau <= tauMax; tau++) if (d[tau] > dMax) dMax = d[tau]
  if (dMax === 0) return null
  for (let tau = tauMin; tau <= tauMax; tau++) d[tau] /= dMax

  // find first local minimum below threshold
  let tau = tauMin + 1
  while (tau < tauMax) {
    if (d[tau] < threshold && d[tau] <= d[tau - 1] && d[tau] <= d[tau + 1]) break
    tau++
  }
  if (tau >= tauMax) return null

  // parabolic interpolation around the minimum
  let s0 = d[tau - 1], s1 = d[tau], s2 = d[tau + 1]
  let denom = s0 - 2 * s1 + s2
  let period = denom !== 0 ? tau + (s0 - s2) / (2 * denom) : tau

  return { freq: fs / period, clarity: 1 - s1 }
}
