// atom manifest — dynamic EQ (band energy drives that band's peaking gain; Pro-Q3 /
// soothe class, the generalized de-esser) per @audio/compile CONTRACT. The kernel builds
// its sidechain/envelope state inside each call — declared streaming: false: the host
// materializes the whole timeline and calls process once, per channel. Scalar form is
// ONE band; multi-band curves take an array argument — direct-import for those.

import dynamicEq from './dynamic.js'

export const dyneq = (ctx) => {
	return (inputs, outputs, params) => {
		const inp = inputs[0], out = outputs[0]
		if (!inp || !inp.length) return
		const opts = {
			fs: ctx.sampleRate,
			bands: [{
				fc: params.fc[0],
				Q: params.Q[0],
				threshold: params.threshold[0],
				ratio: params.ratio[0],
				attack: params.attack[0],
				release: params.release[0],
				maxGain: params.maxGain[0],
				mode: params.mode,
			}],
		}
		for (let c = 0; c < inp.length; c++) {
			out[c].set(inp[c])
			dynamicEq(out[c], opts)
		}
	}
}
dyneq.channels = 'any'
dyneq.streaming = false
dyneq.tail = 0.2
dyneq.params = {
	fc:        { type: 'number', min: 40, max: 16000, default: 6000, unit: 'Hz', curve: 'log' },
	Q:         { type: 'number', min: 0.3, max: 20, default: 2, curve: 'log' },
	threshold: { type: 'number', min: -60, max: 0, default: -30, unit: 'dB' },
	ratio:     { type: 'number', min: 1, max: 20, default: 3 },
	attack:    { type: 'number', min: 0.5, max: 100, default: 5, unit: 'ms' },
	release:   { type: 'number', min: 10, max: 1000, default: 80, unit: 'ms' },
	maxGain:   { type: 'number', min: 0, max: 24, default: 12, unit: 'dB' },
	mode:      { type: 'enum', values: ['down', 'up'], default: 'down' },
}
