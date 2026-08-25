# @audio/pitch-autocorrelation [![npm](https://img.shields.io/npm/v/@audio/pitch-autocorrelation)](https://www.npmjs.com/package/@audio/pitch-autocorrelation) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Normalized autocorrelation pitch detection (baseline)

```
npm install @audio/pitch-autocorrelation
```

```js
import autocorrelation from '@audio/pitch-autocorrelation'
```

Normalized autocorrelation — the simplest pitch estimator. Educational baseline.

```js
let result = autocorrelation(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `threshold` | `0.5` | Minimum normalized autocorrelation value to accept |

**Use when:** Learning, quick prototypes, signals with strong dominant periodicity and low noise.<br>
**Not for:** Production — octave errors are common without additional heuristics.<br>
**Ref:** Rabiner, ["Use of autocorrelation analysis for pitch detection"](https://doi.org/10.1109/TASSP.1977.1162905), IEEE TASSP 1977.<br>
**Complexity:** $O(N^2/4)$.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
