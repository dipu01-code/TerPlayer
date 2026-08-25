// atom manifest — tilt EQ (see-saw shelving around a pivot) per @audio/compile CONTRACT.
// gain/pivot are live; the kernel re-derives shelves on change and keeps biquad state
// on the params object — one persistent object per channel.

import tiltFn from './tilt.js'

export const tilt = (ctx) => {
	const chP = []
	for (let c = 0, N = ctx.maxChannels ?? 8; c < N; c++) chP.push({ fs: ctx.sampleRate })
	return (inputs, outputs, params) => {
		const inp = inputs[0], out = outputs[0]
		if (!inp || !inp.length) return
		for (let c = 0; c < inp.length; c++) {
			const p = chP[c]
			p.gain = params.gain[0]
			p.pivot = params.pivot[0]
			out[c].set(inp[c])
			tiltFn(out[c], p)
		}
	}
}
tilt.channels = 'any'
tilt.params = {
	gain:  { type: 'number', min: -12, max: 12, default: 0, unit: 'dB' },
	pivot: { type: 'number', min: 100, max: 10000, default: 1000, unit: 'Hz', curve: 'log' },
}
