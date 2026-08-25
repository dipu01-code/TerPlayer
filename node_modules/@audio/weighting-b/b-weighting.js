import { filter, cascadeMagnitude } from '@audio/biquad'
import matchedZ from 'digital-filter/core/matched-z.js'

let { PI } = Math

export default function bWeighting(data, params = {}) {
	let fs = params.fs || 44100
	if (!params._sos || params._fs !== fs) {
		params._fs = fs
		params._sos = bWeighting.coefs(fs)
		params.coefs = params._sos
	}
	return filter(data, params)
}

bWeighting.coefs = function coefs(fs = 44100) {
	// B-weighting: H(s) = K·s³ / ((s+w1)²(s+w2)(s+w4)²). Shares f1/f4 with A/C-weighting
	// but its own single mid pole at 158.5 Hz (not A's f2=107.65/f3=737.86) — the original
	// ANSI B-curve corner, distinct from the later-harmonized A/C poles. Confirmed against
	// this repo's own a-weighting.b() reference: denominator (f²+424.36)·sqrt(f²+25122.25)
	// ·(f²+148840000) ⇒ f2 = sqrt(25122.25) = 158.5 exactly.
	let f1 = 20.598997, f2 = 158.5, f4 = 12194.217
	let w = f => 2 * PI * f
	return matchedZ(
		[-w(f1), -w(f1), -w(f2), -w(f4), -w(f4)],
		[0, 0, 0],
		fs,
		1000
	)
}

/** |H(f)| at a given frequency, fs — the analytic response of bWeighting's own filter. */
bWeighting.response = function response (f, fs = 44100) {
	return cascadeMagnitude(bWeighting.coefs(fs), f, fs)
}
