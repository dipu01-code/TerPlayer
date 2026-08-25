# @audio/eq-baxandall [![npm](https://img.shields.io/npm/v/@audio/eq-baxandall)](https://www.npmjs.com/package/@audio/eq-baxandall) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Baxandall tone control — bass/treble shelving with reciprocal characteristics

```
npm install @audio/eq-baxandall
```

```js
import baxandall from '@audio/eq-baxandall'
```

The canonical two-knob tone control found in amplifiers, mixers, and guitar pedals — a low-shelf at `fBass` and a high-shelf at `fTreble` (both fixed Q 0.707), cascaded. Each shelf tracks its own frequency/gain/`fs` independently, so bass and treble move without disturbing each other.

```js
let params = { bass: 3, treble: -2, fs: 44100 }
for (let buf of stream) baxandall(buf, params)
```

| Param | Default | |
|---|---|---|
| `bass` | `0` | Bass shelf gain, dB (positive boosts, negative cuts) |
| `treble` | `0` | Treble shelf gain, dB (positive boosts, negative cuts) |
| `fBass` | `250` | Bass shelf corner frequency, Hz |
| `fTreble` | `4000` | Treble shelf corner frequency, Hz |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — both shelves' coefficients and filter memory are cached on it and only rebuilt when their own gain/frequency/`fs` change, so state carries across block boundaries automatically.

**Use when:** a simple two-knob tone stack — mixer channel strip, guitar amp voicing, quick "warmer/brighter" macro control.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
