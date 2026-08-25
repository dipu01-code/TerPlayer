// Vocal removal — keep side, discard mid (center-panned content).
// Karaoke / SoX `oops`: side = (L − R) / 2, anti-phase in the output pair.
// Mono passes through unchanged. Extracted from audio core.

import { encode, decode } from '@audio/spatial-midside'

export default function remove (channels) {
	if (channels.length < 2) return channels
	let [L, R] = channels
	encode([L, R])
	L.fill(0)
	return decode([L, R])
}
