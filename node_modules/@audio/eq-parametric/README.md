# @audio/eq-parametric [![npm](https://img.shields.io/npm/v/@audio/eq-parametric)](https://www.npmjs.com/package/@audio/eq-parametric) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

N-band parametric EQ

```
npm install @audio/eq-parametric
```

```js
import parametricEq from '@audio/eq-parametric'
```

Free-form multi-band EQ — any number of bands, each independently peaking, low-shelf, or high-shelf, each with its own `fc`/`Q`/`gain`. One RBJ biquad per band, cascaded in array order.

```js
let params = { bands: [
  { fc: 100, type: 'lowshelf', gain: 2 },
  { fc: 3000, Q: 1.4, gain: -4 },       // type omitted → 'peak'
], fs: 44100 }
for (let buf of stream) parametricEq(buf, params)
```

| Param | Default | |
|---|---|---|
| `bands` | `[]` | Array of `{ fc, Q, gain, type }` |
| `bands[].fc` | — | Band center/corner frequency, Hz |
| `bands[].Q` | `1` (peak) / `0.707` (shelf) | Bandwidth (peak) or shelf slope |
| `bands[].gain` | `0` | Band gain, dB |
| `bands[].type` | `'peak'` | `'peak'`, `'lowshelf'`, or `'highshelf'` |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — the filter cascade is cached on it and only rebuilt when any band's `fc`/`Q`/`gain`/`type` or `fs` changes by value, so state carries across block boundaries automatically.

**Use when:** general-purpose multi-band corrective or creative EQ — mixing-channel EQ, mastering surgical cuts, anywhere a fixed band layout (graphic) or two-knob tone stack (baxandall/tilt) is too rigid.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
