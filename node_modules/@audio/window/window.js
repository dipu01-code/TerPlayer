// Audio-facing window kit over window-function (scijs, canonical per-sample math):
// typed-array fill with symmetric/periodic variants, in-place apply, and COLA
// (constant-overlap-add) verification for STFT hop choices.

import * as wf from 'window-function'

/**
 * Fill a Float64Array with the named window.
 * @param {string} name — any window-function export (hann, hamming, blackman, …)
 * @param {number} N — length
 * @param {object} opts — { periodic=true } — periodic (DFT-even, for STFT) vs symmetric (filter design)
 */
export default function window (name, N, { periodic = true } = {}) {
	let fn = wf[name]
	if (typeof fn !== 'function') throw new RangeError(`window: unknown window "${name}"`)
	let out = new Float64Array(N)
	let M = periodic ? N + 1 : N
	for (let i = 0; i < N; i++) out[i] = fn(i, M)
	return out
}

/** Multiply data by win in place. */
export function apply (data, win) {
	for (let i = 0; i < data.length; i++) data[i] *= win[i % win.length]
	return data
}

/**
 * COLA check: does Σ win(n − m·hop) (or win² with {squared}) stay constant?
 * @returns {{ ok, ripple, mean }} — ripple = (max−min)/mean over the steady region
 */
export function cola (win, hop, { squared = false, tolerance = 1e-6 } = {}) {
	let N = win.length
	let sum = new Float64Array(hop)
	for (let i = 0; i < hop; i++)
		for (let j = i; j < N; j += hop) sum[i] += squared ? win[j] * win[j] : win[j]
	let min = Math.min(...sum), max = Math.max(...sum)
	let mean = sum.reduce((a, x) => a + x, 0) / hop
	return { ok: mean > 0 && (max - min) / mean < tolerance, ripple: mean > 0 ? (max - min) / mean : Infinity, mean }
}

export * from 'window-function'
