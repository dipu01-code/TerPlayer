// Note math — Hz ↔ MIDI ↔ note name, cents offset. 12-TET, MIDI convention (C4 = 60, A4 = 69).

export const NAMES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
export const NAMES_FLAT = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

export const hzToMidi = (hz, a4 = 440) => 69 + 12 * Math.log2(hz / a4)
export const midiToHz = (midi, a4 = 440) => a4 * 2 ** ((midi - 69) / 12)

/** midi → 'C#4' (or 'Db4' with {flat: true}) */
export function name (midi, { flat = false } = {}) {
	let m = Math.round(midi)
	let pc = ((m % 12) + 12) % 12
	let oct = Math.floor(m / 12) - 1
	return (flat ? NAMES_FLAT : NAMES_SHARP)[pc] + oct
}

/** 'A4' | 'C#3' | 'Bb2' → midi number */
export function parse (str) {
	let m = /^([A-Ga-g])([#b]?)(-?\d+)$/.exec(str.trim())
	if (!m) throw new RangeError(`note: cannot parse "${str}"`)
	const BASE = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 }
	let pc = BASE[m[1].toUpperCase()] + (m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0)
	return pc + (Number(m[3]) + 1) * 12
}

/** hz → { midi, name, hz (exact note), cents (offset from it) } — tuner readout */
export function cents (hz, { a4 = 440, flat = false } = {}) {
	let midi = Math.round(hzToMidi(hz, a4))
	let ref = midiToHz(midi, a4)
	return { midi, name: name(midi, { flat }), hz: ref, cents: 1200 * Math.log2(hz / ref) }
}
