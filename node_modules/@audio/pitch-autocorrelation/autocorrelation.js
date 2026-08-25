/**
 * Normalized autocorrelation pitch detection (baseline).
 * Simplest approach — prone to octave errors without additional heuristics.
 *
 * @param {Float32Array | Float64Array} data - audio samples (single window)
 * @param {{fs?: number, threshold?: number}} params
 * @returns {{freq: number, clarity: number} | null}
 */
export default function autocorrelation(data, params) {
  let fs = params?.fs || 44100
  let threshold = params?.threshold ?? 0.5
  let len = data.length
  let half = len >> 1

  // biased autocorrelation: r[τ] = Σ_{i=0}^{N-τ-1} x[i]·x[i+τ]
  let r = new Float64Array(half)
  for (let tau = 0; tau < half; tau++) {
    let sum = 0
    for (let i = 0; i < len - tau; i++) sum += data[i] * data[i + tau]
    r[tau] = sum
  }

  // normalize by r[0]
  if (r[0] === 0) return null
  let r0 = r[0]
  for (let i = 0; i < half; i++) r[i] /= r0

  // find first peak after first dip
  let tau = 1
  while (tau < half - 1 && r[tau] > r[tau + 1]) tau++ // descend past initial peak
  while (tau < half - 1 && r[tau] < r[tau + 1]) tau++ // climb to first real peak

  if (tau >= half - 1 || r[tau] < threshold) return null

  // parabolic interpolation around the peak
  let s0 = r[tau - 1], s1 = r[tau], s2 = r[tau + 1]
  let denom = s0 - 2 * s1 + s2
  let period = denom !== 0 ? tau + (s0 - s2) / (2 * denom) : tau

  return { freq: fs / period, clarity: s1 }
}
