# @audio/eq-tilt [![npm](https://img.shields.io/npm/v/@audio/eq-tilt)](https://www.npmjs.com/package/@audio/eq-tilt) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

One-knob see-saw tilt EQ

```
npm install @audio/eq-tilt
```

```js
import tilt from '@audio/eq-tilt'
```

One knob, one pivot frequency: a low-shelf at `pivot` boosted by `gain` and a high-shelf at `pivot` cut by the same `gain` (both fixed Q 0.5), cascaded. The two shelves meet near-flat at `pivot` and diverge oppositely on either side — positive `gain` tilts bass up / treble down, negative does the opposite. Mastering-bus "warmer"/"brighter" macro; broadcast tilt EQ.

```js
let params = { gain: 2, pivot: 1000, fs: 44100 }
for (let buf of stream) tilt(buf, params)
```

| Param | Default | |
|---|---|---|
| `gain` | `0` | Tilt amount, dB — positive tilts bass up / treble down, negative the opposite |
| `pivot` | `1000` | Pivot frequency, Hz — the point the tilt see-saws around |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — both shelves' coefficients and filter memory are cached on it and only rebuilt when `gain`/`pivot`/`fs` change, so state carries across block boundaries automatically.

**Use when:** one-knob mastering-bus balance — a single control that trades bass for treble without a multi-band EQ; broadcast/mastering tilt.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
