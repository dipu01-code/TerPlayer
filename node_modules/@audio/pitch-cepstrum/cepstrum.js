import { fft, ifft } from 'fourier-transform'

/**
 * Cepstrum pitch detection (Noll, 1967).
 * Real cepstrum c(τ) = IFFT(log |FFT(x)|). A peak at quefrency τ
 * corresponds to period τ in the time domain.
 *
 * @param {Float32Array | Float64Array} data - window, length must be a power of 2
 * @param {{fs?: number, minFreq?: number, maxFreq?: number, threshold?: number}} [params]
 * @returns {{freq: number, clarity: number} | null}
 */
export default function cepstrum(data, params) {
  let fs = params?.fs || 44100
  let minFreq = params?.minFreq ?? 50
  let maxFreq = params?.maxFreq ?? 2000
  let threshold = params?.threshold ?? 0.3
  let N = data.length
  if ((N & (N - 1)) !== 0) throw new Error('cepstrum: window length must be a power of 2')

  // FFT → half-complex; take log magnitude; IFFT → real cepstrum
  let [re, im] = fft(data)
  let half = re.length                 // N/2 + 1
  let logMag = new Float64Array(half)
  let eps = 1e-12
  for (let i = 0; i < half; i++) {
    logMag[i] = Math.log(Math.hypot(re[i], im[i]) + eps)
  }
  // real spectrum → pass as re with zero imaginary
  let zeros = new Float64Array(half)
  let cep = ifft(logMag, zeros)

  let tauMin = Math.max(2, Math.floor(fs / maxFreq))
  let tauMax = Math.min((N >> 1) - 1, Math.ceil(fs / minFreq))
  if (tauMax <= tauMin + 1) return null

  // find the largest peak within valid quefrency range
  let peak = tauMin, peakVal = -Infinity
  for (let tau = tauMin; tau <= tauMax; tau++) {
    if (cep[tau] > peakVal) { peakVal = cep[tau]; peak = tau }
  }
  if (peak <= tauMin || peak >= tauMax) return null

  // parabolic interpolation
  let s0 = cep[peak - 1], s1 = cep[peak], s2 = cep[peak + 1]
  let denom = s0 - 2 * s1 + s2
  let shift = denom !== 0 ? (s0 - s2) / (2 * denom) : 0
  let period = peak + shift

  // clarity: peak-to-second-local-max ratio. For periodic signals the
  // quefrency peak is much taller than any competing local maximum; for
  // noise, several local maxima have comparable height.
  let second = -Infinity
  for (let tau = tauMin + 1; tau < tauMax; tau++) {
    if (Math.abs(tau - peak) < 3) continue
    if (cep[tau] > cep[tau - 1] && cep[tau] > cep[tau + 1] && cep[tau] > second) {
      second = cep[tau]
    }
  }
  let clarity = peakVal > 0 && second > 0 ? 1 - second / peakVal : (peakVal > 0 ? 1 : 0)
  clarity = Math.max(0, Math.min(1, clarity))

  if (clarity < threshold) return null
  return { freq: fs / period, clarity }
}
