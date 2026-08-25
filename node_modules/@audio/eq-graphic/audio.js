// atom manifest — 10-band ISO 266 graphic EQ per @audio/compile CONTRACT.
// One live dB param per octave band; the kernel rebuilds its biquad cascade when any
// gain changes (self-detected via key) and keeps filter state on the params object —
// one persistent object per channel.

import graphicEq from './graphic-eq.js'

const BANDS = [31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000]
const NAMES = ['g31', 'g63', 'g125', 'g250', 'g500', 'g1k', 'g2k', 'g4k', 'g8k', 'g16k']

export const geq = (ctx) => {
	const chP = []
	for (let c = 0, N = ctx.maxChannels ?? 8; c < N; c++) chP.push({ fs: ctx.sampleRate, gains: {} })
	return (inputs, outputs, params) => {
		const inp = inputs[0], out = outputs[0]
		if (!inp || !inp.length) return
		for (let c = 0; c < inp.length; c++) {
			const p = chP[c]
			for (let b = 0; b < BANDS.length; b++) p.gains[BANDS[b]] = params[NAMES[b]][0]
			out[c].set(inp[c])
			graphicEq(out[c], p)
		}
	}
}
geq.channels = 'any'
geq.params = Object.fromEntries(NAMES.map(n => [n, { type: 'number', min: -15, max: 15, default: 0, unit: 'dB' }]))
