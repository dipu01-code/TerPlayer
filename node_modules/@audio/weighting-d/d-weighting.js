import { filter, cascadeMagnitude } from '@audio/biquad'
import matchedZ from 'digital-filter/core/matched-z.js'

let { PI } = Math

export default function dWeighting(data, params = {}) {
	let fs = params.fs || 44100
	if (!params._sos || params._fs !== fs) {
		params._fs = fs
		params._sos = dWeighting.coefs(fs)
		params.coefs = params._sos
	}
	return filter(data, params)
}

dWeighting.coefs = function coefs(fs = 44100) {
	// D-weighting (IEC 537 aircraft-noise curve): the one weighting with a resonant
	// hump — peaks +11.6 dB near 3.3 kHz. Canonical analog transfer function
	//   H(s) = s·(s² + 6532·s + 4.0975e7)
	//          ───────────────────────────────────────────────
	//          (s + 1776.3)(s + 7288.5)(s² + 21514·s + 3.8836e8)
	// (standard D-weighting rational form; its quadratic constants confirmed against
	// this repo's a-weighting.d() closed form — 4.0975e7 = 1037918.48·(2π)²,
	// 3.8836e8 = 9837328·(2π)², 6532 = √(1080768.16·(2π)²), 21514 = √(11723776·(2π)²),
	// 1776.3 = 2π·√79919.29, 7288.5 = 2π·√1345600). One zero at DC + a complex zero
	// pair; two real poles + a complex pole pair. Matched-z is exact away from Nyquist;
	// like A/C, its rolloff error grows above ~8 kHz at 44.1/48 kHz.
	let qroots = (b, c) => { let im = Math.sqrt(c - b * b / 4); return [{ re: -b / 2, im }, { re: -b / 2, im: -im }] }
	return matchedZ(
		[-1776.3, -7288.5, ...qroots(21514, 3.8836e8)],
		[0, ...qroots(6532, 4.0975e7)],
		fs,
		1000
	)
}

/** |H(f)| at a given frequency, fs — the analytic response of dWeighting's own filter. */
dWeighting.response = function response (f, fs = 44100) {
	return cascadeMagnitude(dWeighting.coefs(fs), f, fs)
}
