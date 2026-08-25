# @audio/pitch-hps [![npm](https://img.shields.io/npm/v/@audio/pitch-hps)](https://www.npmjs.com/package/@audio/pitch-hps) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Harmonic Product Spectrum (Schroeder, 1968)

```
npm install @audio/pitch-hps
```

```js
import hps from '@audio/pitch-hps'
```

**Schroeder, 1968.** Harmonic Product Spectrum — multiplies the spectrum by its downsampled copies so that harmonic peaks align at the fundamental. Robust to the missing-fundamental problem.

```js
let result = hps(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `harmonics` | `5` | Number of harmonic products |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `4000` | Maximum detectable frequency (Hz) |
| `cents` | `10` | Candidate spacing in cents |
| `threshold` | `0.1` | Minimum clarity to accept |

**Use when:** Harmonic-rich signals (guitar, piano, brass). Naturally handles missing fundamentals.<br>
**Not for:** Pure sinusoids (only one harmonic), very noisy signals.<br>
**Ref:** Schroeder, ["Period histogram and product spectrum"](https://doi.org/10.1121/1.1910902), JASA 1968.<br>
**Requires:** Power-of-2 window length — throws otherwise.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
