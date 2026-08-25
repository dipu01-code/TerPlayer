// Dynamic EQ — per-band peaking gain driven by that band's energy (Pro-Q3 / soothe class;
// the generalized de-esser). Bandpass sidechain → envelope → over-threshold → peaking cut
// (or upward gain), coefficients re-derived per block for smoothness without per-sample cost.

import { bandpass, peaking } from '@audio/biquad'

const BLOCK = 64

/**
 * @param {Float32Array} data — mono PCM, processed in place
 * @param {object} opts — { fs=44100, bands: [{ fc, Q=2, threshold=-30 (dB), ratio=3,
 *   attack=5 (ms), release=80 (ms), maxGain=12 (dB, cut depth), mode='down' }] }
 */
export default function dynamicEq (data, { fs = 44100, bands = [] } = {}) {
	let states = bands.map(b => ({
		det: bandpass(b.fc, b.Q ?? 2, fs),
		dx1: 0, dx2: 0, dy1: 0, dy2: 0,   // sidechain biquad state
		env: 0,
		x1: 0, x2: 0, y1: 0, y2: 0,       // audio-path biquad state
		gain: 0,
		aCoef: Math.exp(-1 / ((b.attack ?? 5) * 0.001 * fs)),
		rCoef: Math.exp(-1 / ((b.release ?? 80) * 0.001 * fs)),
	}))

	for (let pos = 0; pos < data.length; pos += BLOCK) {
		let end = Math.min(data.length, pos + BLOCK)
		for (let bi = 0; bi < bands.length; bi++) {
			let b = bands[bi], s = states[bi]
			// detect on the incoming block
			for (let i = pos; i < end; i++) {
				let x = data[i]
				let y = s.det.b0 * x + s.det.b1 * s.dx1 + s.det.b2 * s.dx2 - s.det.a1 * s.dy1 - s.det.a2 * s.dy2
				s.dx2 = s.dx1; s.dx1 = x; s.dy2 = s.dy1; s.dy1 = y
				let a = Math.abs(y)
				s.env = a > s.env ? a + (s.env - a) * s.aCoef : a + (s.env - a) * s.rCoef
			}
			let levelDb = 20 * Math.log10(s.env + 1e-9)
			let over = levelDb - (b.threshold ?? -30)
			let target = over > 0 ? -Math.min(b.maxGain ?? 12, over * (1 - 1 / (b.ratio ?? 3))) : 0
			if ((b.mode ?? 'down') === 'up') target = -target
			s.gain += (target - s.gain) * 0.5 // block-rate smoothing

			if (Math.abs(s.gain) > 0.05) {
				let c = peaking(b.fc, b.Q ?? 2, fs, s.gain)
				for (let i = pos; i < end; i++) {
					let x = data[i]
					let y = c.b0 * x + c.b1 * s.x1 + c.b2 * s.x2 - c.a1 * s.y1 - c.a2 * s.y2
					s.x2 = s.x1; s.x1 = x; s.y2 = s.y1; s.y1 = data[i] = y
				}
			} else {
				// keep state warm on bypassed blocks
				for (let i = pos; i < end; i++) {
					let x = data[i]
					s.x2 = s.x1; s.x1 = x; s.y2 = s.y1; s.y1 = x
				}
			}
		}
	}
	return data
}
