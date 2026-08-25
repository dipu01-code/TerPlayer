/**
 * Tilt EQ — see-saw around a pivot frequency.
 * One knob: positive tilts bass up / treble down, negative does the opposite.
 *
 * @module  audio-filter/eq/tilt
 */

import { lowshelf, highshelf, filter } from '@audio/biquad'

export default function tilt (data, params) {
	let gain = params.gain ?? 0       // dB: positive = bass boost / treble cut
	let pivot = params.pivot || 1000  // Hz
	let fs = params.fs || 44100

	if (!params._lo) { params._lo = {}; params._hi = {} }

	if (params._gain !== gain || params._pivot !== pivot || params._fs !== fs) {
		params._lo.coefs = [lowshelf(pivot, 0.5, fs, gain)]
		params._hi.coefs = [highshelf(pivot, 0.5, fs, -gain)]
		params._gain = gain; params._pivot = pivot; params._fs = fs
	}

	filter(data, params._lo)
	filter(data, params._hi)

	return data
}
