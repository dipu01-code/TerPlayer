// atom manifest — Baxandall bass/treble tone control per @audio/compile CONTRACT.
// All params live; the kernel re-derives each shelf on change and keeps biquad state
// on the params object — one persistent object per channel.

import baxandallFn from './baxandall.js'

export const baxandall = (ctx) => {
	const chP = []
	for (let c = 0, N = ctx.maxChannels ?? 8; c < N; c++) chP.push({ fs: ctx.sampleRate })
	return (inputs, outputs, params) => {
		const inp = inputs[0], out = outputs[0]
		if (!inp || !inp.length) return
		for (let c = 0; c < inp.length; c++) {
			const p = chP[c]
			p.bass = params.bass[0]
			p.treble = params.treble[0]
			p.fBass = params.fBass[0]
			p.fTreble = params.fTreble[0]
			out[c].set(inp[c])
			baxandallFn(out[c], p)
		}
	}
}
baxandall.channels = 'any'
baxandall.params = {
	bass:    { type: 'number', min: -15, max: 15, default: 0, unit: 'dB' },
	treble:  { type: 'number', min: -15, max: 15, default: 0, unit: 'dB' },
	fBass:   { type: 'number', min: 60, max: 1000, default: 250, unit: 'Hz', curve: 'log' },
	fTreble: { type: 'number', min: 1000, max: 12000, default: 4000, unit: 'Hz', curve: 'log' },
}
