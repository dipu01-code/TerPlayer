// atom manifest — center isolation, the channel-coupled case: stereo in, mid out.

export const isolate = (ctx) => (inputs, outputs) => {
	const inp = inputs[0], out = outputs[0]
	if (!inp || !inp.length) return
	const L = inp[0], R = inp[1]
	if (!R) { out[0].set(L); return }
	for (let i = 0; i < L.length; i++) {
		const mid = (L[i] + R[i]) * 0.5
		out[0][i] = mid
		if (out[1]) out[1][i] = mid
	}
}
isolate.channels = 2
isolate.params = {}
