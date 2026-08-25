/**
 * YIN pitch detection (de Cheveigné & Kawahara, 2002).
 * Difference fn → cumulative mean normalized difference → threshold → parabolic interpolation.
 *
 * @param {Float32Array | Float64Array} data - audio samples (single window, eg. 2048 samples)
 * @param {{fs?: number, threshold?: number}} params
 * @returns {{freq: number, clarity: number} | null}
 */
export default function yin(data, params) {
  let fs = params?.fs || 44100
  let threshold = params?.threshold ?? 0.15
  let len = data.length
  let half = len >> 1

  // step 1-2: difference function
  let d = new Float64Array(half)
  for (let tau = 1; tau < half; tau++) {
    let sum = 0
    for (let i = 0; i < half; i++) {
      let diff = data[i] - data[i + tau]
      sum += diff * diff
    }
    d[tau] = sum
  }

  // step 3: cumulative mean normalized difference
  let cmndf = new Float64Array(half)
  cmndf[0] = 1
  let running = 0
  for (let tau = 1; tau < half; tau++) {
    running += d[tau]
    cmndf[tau] = running > 0 ? d[tau] * tau / running : 1
  }

  // step 4: absolute threshold — find first dip below threshold
  let tau = 2
  while (tau < half - 1) {
    if (cmndf[tau] < threshold) {
      // find local minimum
      while (tau + 1 < half - 1 && cmndf[tau + 1] < cmndf[tau]) tau++
      break
    }
    tau++
  }
  if (tau >= half - 1) return null

  // step 5: parabolic interpolation
  let s0 = cmndf[tau - 1], s1 = cmndf[tau], s2 = cmndf[tau + 1]
  let denom = s0 - 2 * s1 + s2
  let shift = denom !== 0 ? (s0 - s2) / (2 * denom) : 0
  let period = tau + shift

  return { freq: fs / period, clarity: 1 - s1 }
}
