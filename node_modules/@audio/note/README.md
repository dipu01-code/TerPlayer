# @audio/note

> Music-theory primitives: Hz ↔ MIDI ↔ note name, cents, scales, snapping.

```js
import { hzToMidi, midiToHz, name, parse, cents, SCALES, snapMidi, snapHz } from '@audio/note'

name(69)                          // 'A4'
cents(443)                        // { midi: 69, name: 'A4', hz: 440, cents: 11.7 } — tuner readout
snapHz(450, { scale: 'major' })   // nearest major-scale frequency
```

Hz/MIDI/name conversion + scale tables/snapping — one small, always-together substrate. Not a music-theory library (chords, keys, roman numerals): that's composition/notation tooling out of `@audio`'s audio-processing scope — see tonal.js/teoria.js for that. Used by `@audio/tune` (pitch correction), the tuner tool, and `@audio/midi`.
