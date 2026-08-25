// Scales and pitch snapping — the tune-snap / tuner substrate.

import { hzToMidi, midiToHz } from './convert.js'

export const SCALES = {
	chromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
	major: [0, 2, 4, 5, 7, 9, 11],
	minor: [0, 2, 3, 5, 7, 8, 10],
	'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
	'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
	'pentatonic-major': [0, 2, 4, 7, 9],
	'pentatonic-minor': [0, 3, 5, 7, 10],
	blues: [0, 3, 5, 6, 7, 10],
	dorian: [0, 2, 3, 5, 7, 9, 10],
	mixolydian: [0, 2, 4, 5, 7, 9, 10],
	whole: [0, 2, 4, 6, 8, 10],
}

/** snap a (possibly fractional) midi value to the nearest scale degree */
export function snapMidi (midi, { scale = 'chromatic', root = 0 } = {}) {
	let degrees = typeof scale === 'string' ? SCALES[scale] : scale
	if (!degrees) throw new RangeError(`note: unknown scale "${scale}"`)
	let best = 0, bestDist = Infinity
	for (let oct = Math.floor(midi / 12) - 1; oct <= Math.floor(midi / 12) + 1; oct++) {
		for (let d of degrees) {
			let cand = oct * 12 + root + d
			let dist = Math.abs(cand - midi)
			if (dist < bestDist) { bestDist = dist; best = cand }
		}
	}
	return best
}

/** snap a frequency to the nearest scale note frequency */
export function snapHz (hz, { scale = 'chromatic', root = 0, a4 = 440 } = {}) {
	return midiToHz(snapMidi(hzToMidi(hz, a4), { scale, root }), a4)
}
