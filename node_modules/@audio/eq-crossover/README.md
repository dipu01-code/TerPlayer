# @audio/eq-crossover [![npm](https://img.shields.io/npm/v/@audio/eq-crossover)](https://www.npmjs.com/package/@audio/eq-crossover) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

N-way crossover network using Linkwitz-Riley filters

```
npm install @audio/eq-crossover
```

```js
import crossover from '@audio/eq-crossover'
```

A **designer**, not a filter — it takes no audio buffer and processes nothing. Given N-1 crossover frequencies it returns N per-band SOS (second-order-section) cascades built from `digital-filter`'s Linkwitz-Riley design, low band to high, ready to feed a biquad engine.

LR order ≡ 2 (mod 4) — LR2, LR6, ... — needs one output inverted per crossover point to sum flat; order ≡ 0 (mod 4) — LR4, LR8, ... — sums in-phase already (Linkwitz & Riley, JAES 24(1), 1976). That inversion is applied internally, so the bands `crossover` returns already sum flat when added in the time domain — no extra polarity handling needed at the call site.

```js
import { cascade } from '@audio/biquad'

let bands = crossover([500, 2000], 4, 44100)  // 2 freqs → 3 bands: low, mid, high
let low = cascade(data.slice(), bands[0])
let mid = cascade(data.slice(), bands[1])
let high = cascade(data.slice(), bands[2])
```

| Param | Default | |
|---|---|---|
| `frequencies` | — | Crossover frequencies, ascending, Hz — N-1 frequencies for N bands |
| `order` | `4` | LR filter order: 2, 4, or 8 |
| `fs` | `44100` | Sample rate, Hz |

**Use when:** multiway speaker/DSP crossovers, multiband compression band splits — anywhere bands must sum back to flat.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
