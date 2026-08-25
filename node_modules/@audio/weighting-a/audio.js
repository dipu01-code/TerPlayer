// atom manifest — A-weighting (IEC 61672) per @audio/compile CONTRACT. Fixed standard curve:
// no tunable params (params = {} is the processor marker); per-channel biquad
// state rides one params object per channel, seeded with the host rate.
import fn from './a-weighting.js'

export const aWeighting = (ctx) => {
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
aWeighting.channels = 'any'
aWeighting.params = {}
