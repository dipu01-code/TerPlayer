# @audio/pitch-amdf [![npm](https://img.shields.io/npm/v/@audio/pitch-amdf)](https://www.npmjs.com/package/@audio/pitch-amdf) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

AMDF (Average Magnitude Difference Function) pitch detection

```
npm install @audio/pitch-amdf
```

```js
import amdf from '@audio/pitch-amdf'
```

**Ross et al., 1974.** Average Magnitude Difference Function — the classical predecessor to YIN. Measures average absolute difference between a signal and its delayed copy; minima indicate periodicity.

```js
let result = amdf(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |
| `threshold` | `0.3` | Normalized AMDF dip threshold |

**Use when:** Low-complexity environments, embedded systems. Simpler and cheaper than YIN (no squaring, no cumulative normalization).<br>
**Not for:** Noisy signals — lacks YIN's cumulative normalization that suppresses octave errors.<br>
**Ref:** Ross et al., ["Average magnitude difference function pitch extractor"](https://doi.org/10.1109/TASSP.1974.1162598), IEEE TASSP 1974.<br>
**Complexity:** $O(N^2/4)$.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
