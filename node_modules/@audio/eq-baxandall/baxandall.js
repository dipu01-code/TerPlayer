/**
 * Baxandall tone control — bass/treble shelving with reciprocal characteristics.
 * The canonical tone control in amplifiers, mixers, guitar pedals.
 *
 * @module  audio-filter/eq/baxandall
 */

import { lowshelf, highshelf, filter } from '@audio/biquad'

export default function baxandall (data, params) {
	let bass = params.bass ?? 0       // dB
	let treble = params.treble ?? 0   // dB
	let fBass = params.fBass || 250
	let fTreble = params.fTreble || 4000
	let fs = params.fs || 44100

	if (!params._b) { params._b = {}; params._t = {} }

	// each branch tracks its own fs — neither reads state the other branch writes
	if (params._bass !== bass || params._fBass !== fBass || params._bFs !== fs) {
		params._b.coefs = [lowshelf(fBass, 0.707, fs, bass)]
		params._bass = bass; params._fBass = fBass; params._bFs = fs
	}
	if (params._treble !== treble || params._fTreble !== fTreble || params._tFs !== fs) {
		params._t.coefs = [highshelf(fTreble, 0.707, fs, treble)]
		params._treble = treble; params._fTreble = fTreble; params._tFs = fs
	}

	filter(data, params._b)
	filter(data, params._t)

	return data
}
