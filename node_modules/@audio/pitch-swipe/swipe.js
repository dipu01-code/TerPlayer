import rfft from 'fourier-transform'

/**
 * SWIPE′ — Sawtooth Waveform Inspired Pitch Estimator with prime harmonics.
 * Camacho & Harris, 2008. Measures spectral similarity between the window
 * and a sawtooth template whose lobes sit at prime harmonics of the candidate
 * pitch. More accurate than HPS on clean instrumental signals; robust against
 * octave errors because only prime harmonics contribute.
 *
 * Simplified single-window form: uses one FFT instead of the multi-resolution
 * loudness pyramid of the original paper — sufficient for stationary windows.
 *
 * @param {Float32Array | Float64Array} data - window, length must be a power of 2
 * @param {{fs?: number, minFreq?: number, maxFreq?: number, cents?: number, threshold?: number}} [params]
 * @returns {{freq: number, clarity: number} | null}
 */
export default function swipe(data, params) {
  let fs = params?.fs || 44100
  let minFreq = params?.minFreq ?? 60
  let maxFreq = params?.maxFreq ?? 4000
  let cents = params?.cents ?? 10          // candidate spacing in cents
  let threshold = params?.threshold ?? 0.15
  let N = data.length
  if ((N & (N - 1)) !== 0) throw new Error('swipe: window length must be a power of 2')

  // Hann window before FFT — shapes the main lobe to be close to quadratic
  // so parabolic interpolation in the refinement step is accurate.
  let windowed = new Float64Array(N)
  for (let i = 0; i < N; i++) {
    let w = 0.5 - 0.5 * Math.cos(2 * Math.PI * i / (N - 1))
    windowed[i] = data[i] * w
  }
  let spec = rfft(windowed)
  let half = spec.length
  // SWIPE operates on √|X(f)| — emphasizes weaker harmonics
  let X = new Float64Array(half)
  for (let i = 0; i < half; i++) X[i] = Math.sqrt(spec[i])

  let binHz = fs / N
  let primes = [1, 2, 3, 5, 7, 11]

  // log-spaced candidates: step of `cents` cents
  let ratio = Math.pow(2, cents / 1200)
  let candidates = []
  for (let f = minFreq; f <= maxFreq; f *= ratio) candidates.push(f)
  if (candidates.length < 3) return null

  // SWIPE kernel at each harmonic: K(f; fk, f0) = cos(2π(f-fk)/f0) restricted
  // to |f-fk| ≤ f0/2. Positive central lobe rewards energy on the harmonic;
  // the cosine sidelobes (−1 at fk ± f0/2) penalize energy halfway between
  // harmonics, which suppresses octave/sub-harmonic errors.
  let strengths = new Float64Array(candidates.length)
  let best = 0, bestVal = -Infinity
  for (let c = 0; c < candidates.length; c++) {
    let f0 = candidates[c]
    let halfW = f0 / 2
    let s = 0, kNorm = 0
    for (let k of primes) {
      let fk = k * f0
      if (fk + halfW >= (half - 1) * binHz) break
      let w = 1 / Math.sqrt(k)
      let bLo = Math.max(1, Math.floor((fk - halfW) / binHz))
      let bHi = Math.min(half - 1, Math.ceil((fk + halfW) / binHz))
      for (let b = bLo; b <= bHi; b++) {
        let df = b * binHz - fk
        if (Math.abs(df) > halfW) continue
        let kern = Math.cos(2 * Math.PI * df / f0)
        s += w * kern * X[b]
        kNorm += w * kern * kern
      }
    }
    let score = kNorm > 0 ? s / Math.sqrt(kNorm) : 0
    strengths[c] = score
    if (score > bestVal) { bestVal = score; best = c }
  }
  if (best <= 0 || best >= candidates.length - 1) return null

  // parabolic interpolation in log-frequency for sub-cent accuracy
  let s0 = strengths[best - 1], s1 = strengths[best], s2 = strengths[best + 1]
  let denom = s0 - 2 * s1 + s2
  let shift = denom !== 0 ? (s0 - s2) / (2 * denom) : 0
  let logF = Math.log(candidates[best]) + shift * Math.log(ratio)
  let coarse = Math.exp(logF)

  // Refine by snapping to the nearest spectral peak and applying parabolic
  // interpolation on the magnitude spectrum. SWIPE′ localizes the correct
  // harmonic well but the coarse candidate grid introduces ±few Hz bias;
  // refinement against the raw spectrum recovers sub-bin accuracy.
  let centerBin = Math.round(coarse / binHz)
  let lo = Math.max(1, centerBin - 2), hi = Math.min(half - 2, centerBin + 2)
  let peakBin = centerBin
  for (let b = lo; b <= hi; b++) if (spec[b] > spec[peakBin]) peakBin = b
  let r0 = spec[peakBin - 1], r1 = spec[peakBin], r2 = spec[peakBin + 1]
  let rDen = r0 - 2 * r1 + r2
  let rShift = rDen !== 0 ? (r0 - r2) / (2 * rDen) : 0
  let freq = (peakBin + rShift) * binHz

  // normalized clarity: peak strength relative to max possible (sum of weights / sum of weights = 1)
  let clarity = Math.max(0, Math.min(1, bestVal))
  if (clarity < threshold) return null
  return { freq, clarity }
}
