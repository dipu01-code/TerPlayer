// FIR convolution EQ — linear-phase filter from an arbitrary magnitude response.
// Frequency-sampling design (odd-length type-I symmetric FIR, Hann-windowed against Gibbs),
// zero-latency apply (group delay compensated).
// FFmpeg firequalizer class; the Matchering match-EQ substrate.

/**
 * Design linear-phase FIR coefficients from a magnitude response.
 * @param {Array<{f:number,gain:number}>|function} response — dB gain points (linearly
 *   interpolated over frequency, clamped outside) or `f => dB` function
 * @param {object} opts — { taps=511 (made odd), fs=44100 }
 * @returns {Float64Array} symmetric coefficients
 */
export function design (response, { taps = 511, fs = 44100 } = {}) {
	let N = taps | 1 // force odd (type-I)
	let dbAt
	if (typeof response === 'function') dbAt = response
	else {
		let pts = [...response].sort((a, b) => a.f - b.f)
		dbAt = f => {
			if (f <= pts[0].f) return pts[0].gain
			if (f >= pts[pts.length - 1].f) return pts[pts.length - 1].gain
			for (let i = 1; i < pts.length; i++) {
				if (f <= pts[i].f) {
					let t = (f - pts[i - 1].f) / (pts[i].f - pts[i - 1].f)
					return pts[i - 1].gain + t * (pts[i].gain - pts[i - 1].gain)
				}
			}
			return pts[pts.length - 1].gain
		}
	}

	let half = (N - 1) / 2
	let M = new Float64Array(half + 1)
	for (let k = 0; k <= half; k++) M[k] = 10 ** (dbAt(k * fs / N) / 20)

	// h[n] = (1/N)·[M0 + 2·Σ M_k·cos(2πk(n−α)/N)], α = (N−1)/2 → symmetric, linear phase
	let h = new Float64Array(N)
	for (let n = 0; n < N; n++) {
		let sum = M[0]
		for (let k = 1; k <= half; k++) sum += 2 * M[k] * Math.cos(2 * Math.PI * k * (n - half) / N)
		let win = 0.5 - 0.5 * Math.cos(2 * Math.PI * n / (N - 1)) // Hann against Gibbs ripple
		h[n] = (sum / N) * win
	}
	return h
}

/**
 * Apply the EQ in place, delay-compensated (output time-aligned with input).
 * @param {Float32Array} data — mono PCM
 * @param {object} opts — { response, taps, fs } or precomputed { coefs }
 */
export default function firEq (data, opts = {}) {
	let h = opts.coefs || design(opts.response, opts)
	let N = h.length, half = (N - 1) / 2
	let out = new Float32Array(data.length)
	for (let i = 0; i < data.length; i++) {
		let sum = 0
		for (let j = 0; j < N; j++) {
			let idx = i - j + half
			if (idx >= 0 && idx < data.length) sum += h[j] * data[idx]
		}
		out[i] = sum
	}
	data.set(out)
	return data
}
