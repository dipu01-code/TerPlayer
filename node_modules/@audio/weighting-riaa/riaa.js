import { filter, cascadeMagnitude } from '@audio/biquad'

let {PI, tan} = Math

export default function riaa(data, params = {}) {
	let fs = params.fs || 44100
	if (!params._sos || params._fs !== fs) {
		params._fs = fs
		params._sos = riaa.coefs(fs)
		params.coefs = params._sos
	}
	return filter(data, params)
}

riaa.coefs = function coefs(fs = 44100) {
	// RIAA playback (de-emphasis): H(s) = (1 + s*T2) / ((1 + s*T1) * (1 + s*T3))
	let T1 = 3180e-6, T2 = 318e-6, T3 = 75e-6
	let fp1 = 1 / (2 * PI * T1)   // 50.05 Hz  (pole)
	let fz  = 1 / (2 * PI * T2)   // 500.5 Hz  (zero)
	let fp2 = 1 / (2 * PI * T3)   // 2122 Hz   (pole)

	let Wp1 = prewarp(fp1, fs), Wz = prewarp(fz, fs), Wp2 = prewarp(fp2, fs)
	let C = 2 * fs

	// Bilinear transform of 1st-order sections folded into one biquad
	let n0 = C + Wz, n1 = Wz - C
	let d0 = (C + Wp1) * (C + Wp2)
	let d1 = (C + Wp1) * (Wp2 - C) + (Wp1 - C) * (C + Wp2)
	let d2 = (Wp1 - C) * (Wp2 - C)

	let s1 = { b0: n0/d0, b1: n1/d0, b2: 0, a1: d1/d0, a2: d2/d0 }

	// Normalize to 0 dB at 1 kHz
	let g = cascadeMagnitude([s1], 1000, fs)
	s1.b0 /= g; s1.b1 /= g

	return [s1]
}

function prewarp(f, fs) {
	return 2 * fs * tan(PI * f / fs)
}

/** |H(f)| at a given frequency, fs — the analytic response of riaa's own filter. */
riaa.response = function response (f, fs = 44100) {
	return cascadeMagnitude(riaa.coefs(fs), f, fs)
}
