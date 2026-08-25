// atom manifest — ITU-R 468 noise weighting per @audio/compile CONTRACT. Fixed standard curve:
// no tunable params (params = {} is the processor marker); per-channel biquad
// state rides one params object per channel, seeded with the host rate.
import fn from './itu468.js'

export const itu468 = (ctx) => {
	const chP = []
	for (let c = 0, N = ctx.maxChannels ?? 8; c < N; c++) chP.push({ fs: ctx.sampleRate })
	return (inputs, outputs, params) => {
		const inp = inputs[0], out = outputs[0]
		if (!inp || !inp.length) return
		for (let c = 0; c < inp.length; c++) {
			out[c].set(inp[c])
			fn(out[c], chP[c])
		}
	}
}
itu468.channels = 'any'
itu468.params = {}
