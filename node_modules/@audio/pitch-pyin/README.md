# @audio/pitch-pyin [![npm](https://img.shields.io/npm/v/@audio/pitch-pyin)](https://www.npmjs.com/package/@audio/pitch-pyin) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

pYIN — probabilistic YIN (Mauch & Dixon, 2014)

```
npm install @audio/pitch-pyin
```

```js
import pyin from '@audio/pitch-pyin'
```

**Mauch & Dixon, 2014.** Probabilistic YIN — runs YIN at multiple thresholds weighted by a Beta(2, 18) prior, producing a distribution over candidate pitches instead of a single hard pick. More robust than YIN on ambiguous frames.

```js
let result = pyin(samples, { fs: 44100 })
// → { freq: 440.1, clarity: 0.92, candidates: [{ freq: 440.1, prob: 0.85 }, ...] }
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |

Unlike the other atoms, the single-frame result also carries `candidates` — the full posterior over detected periods, sorted by probability, each `{ freq, prob }` with `prob` normalized to sum to 1 across candidates. `clarity` is the (clamped) total probability mass captured by the candidate set, not a single-peak confidence. Full pYIN additionally runs Viterbi smoothing over a sequence of frames with a pitch-transition prior — not implemented in this single-frame kernel.

**Use when:** Ambiguous pitched content — breathy vocals, noisy recordings, or when you need a pitch posterior for downstream HMM tracking.<br>
**Not for:** Clean signals where YIN already works well (pYIN is ~10× slower due to multi-threshold sweep).<br>
**Ref:** Mauch & Dixon, ["pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions"](https://doi.org/10.1109/ICASSP.2014.6853678), ICASSP 2014.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
