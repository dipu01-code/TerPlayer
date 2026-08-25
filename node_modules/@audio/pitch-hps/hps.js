import rfft from 'fourier-transform'

/**
 * Harmonic Product Spectrum (Schroeder, 1968).
 * Multiplies the spectrum by its downsampled copies so that harmonic peaks
 * align at the fundamental. Robust to the missing-fundamental problem.
 *
 * @param {Float32Array | Float64Array} data - window, length must be a power of 2
 * @param {{fs?: number, harmonics?: number, minFreq?: number, maxFreq?: number, threshold?: number}} [params]
 * @returns {{freq: number, clarity: number} | null}
 */
export default function hps(data, params) {
  let fs = params?.fs || 44100
  let K = params?.harmonics ?? 5
  let minFreq = params?.minFreq ?? 50
  let maxFreq = params?.maxFreq ?? 4000
  let threshold = params?.threshold ?? 0.1
  let N = data.length
  if ((N & (N - 1)) !== 0) throw new Error('hps: window length must be a power of 2')

  let spec = rfft(data)                // length N/2, magnitude
  let half = spec.length
  let binHz = fs / N

  let specMax = 0
  for (let i = 0; i < half; i++) if (spec[i] > specMax) specMax = spec[i]
  if (specMax === 0) return null
  let floor = specMax * 1e-3

  // Interpolated magnitude lookup — removes bin-alignment bias that would
  // otherwise prefer harmonic candidates whose multiples happen to land on
  // integer bin indices.
  let mag = (f) => {
    if (f <= 0 || f >= (half - 1) * binHz) return floor
    let b = f / binHz
    let bi = b | 0
    let bf = b - bi
    return Math.max(floor, (1 - bf) * spec[bi] + bf * spec[bi + 1])
  }

  // log-spaced candidates at `cents` resolution (default 10 cents)
  let cents = params?.cents ?? 10
  let ratio = Math.pow(2, cents / 1200)
  let candidates = []
  for (let f = minFreq; f <= maxFreq && f * K < (half - 1) * binHz; f *= ratio) candidates.push(f)
  if (candidates.length < 3) return null

  // H(f0) = Σ log |X(h·f0)|  — multiplicative product in log-domain
  let hpsLog = new Float64Array(candidates.length)
  let best = 0, bestVal = -Infinity
  for (let c = 0; c < candidates.length; c++) {
    let f0 = candidates[c]
    let sum = 0
    for (let h = 1; h <= K; h++) sum += Math.log(mag(h * f0))
    hpsLog[c] = sum
    if (sum > bestVal) { bestVal = sum; best = c }
  }
  if (best <= 0 || best >= candidates.length - 1) return null

  // parabolic interpolation in log-frequency for sub-cent accuracy
  let s0 = hpsLog[best - 1], s1 = hpsLog[best], s2 = hpsLog[best + 1]
  let denom = s0 - 2 * s1 + s2
  let shift = denom !== 0 ? (s0 - s2) / (2 * denom) : 0
  let logF = Math.log(candidates[best]) + shift * Math.log(ratio)
  let freq = Math.exp(logF)

  // clarity: ratio of peak height to the second-highest non-adjacent peak.
  // For a truly periodic signal the fundamental towers above every octave
  // and spurious candidate; for noise, several candidates sit close together.
  let second = -Infinity
  for (let c = 0; c < candidates.length; c++) {
    if (Math.abs(c - best) < 3) continue
    // only count local maxima so we don't compare against the flank of `best`
    let left = c > 0 ? hpsLog[c - 1] : -Infinity
    let right = c < candidates.length - 1 ? hpsLog[c + 1] : -Infinity
    if (hpsLog[c] > left && hpsLog[c] > right && hpsLog[c] > second) second = hpsLog[c]
  }
  let clarity = second > -Infinity ? 1 - Math.exp(-(bestVal - second)) : 1
  clarity = Math.max(0, Math.min(1, clarity))

  if (clarity < threshold) return null
  return { freq, clarity }
}
