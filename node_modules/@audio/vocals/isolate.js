// Vocal isolation — keep mid (center-panned content), discard side.
// Works on stereo where vocals are panned center; mono passes through unchanged.
// Extracted from audio core (SoX `oops` complement).

import { encode, decode } from '@audio/spatial-midside'

export default function isolate (channels) {
	if (channels.length < 2) return channels
	let [L, R] = channels
	encode([L, R])
	R.fill(0)
	return decode([L, R])
}
