// atom manifest — YIN as an analyzer: audio in, no audio out, pitch/clarity
// emitted per analysis frame via ctx.emit.

import yin from './yin.js'

const FRAME = 2048

export const pitch = (ctx) => {
	const win = new Float32Array(FRAME)
	let fill = 0
	return (inputs, outputs, params) => {
		const x = inputs[0] && inputs[0][0]
		if (!x) return
		for (let i = 0; i < x.length; i++) {
			win[fill++] = x[i]
			if (fill === FRAME) {
				const r = yin(win, { fs: ctx.sampleRate, threshold: params.threshold[0] })
				if (r) {
					ctx.emit('pitch', r.freq)
					ctx.emit('clarity', r.clarity)
				}
				fill = 0
			}
		}
	}
}
pitch.channels = { inputs: 1, outputs: [] }
pitch.events = { out: { pitch: 'number', clarity: 'number' } }
pitch.params = {
	threshold: { type: 'number', min: 0.05, max: 0.5, default: 0.1 },
}
