# @audio/pitch-cepstrum [![npm](https://img.shields.io/npm/v/@audio/pitch-cepstrum)](https://www.npmjs.com/package/@audio/pitch-cepstrum) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Cepstrum pitch detection (Noll, 1967)

```
npm install @audio/pitch-cepstrum
```

```js
import cepstrum from '@audio/pitch-cepstrum'
```

**Noll, 1967.** Real cepstrum — $c(\tau) = \text{IFFT}(\log |\text{FFT}(x)|)$. A peak at quefrency $\tau$ corresponds to period $\tau$ in the time domain.

```js
let result = cepstrum(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |
| `threshold` | `0.3` | Minimum clarity to accept |

**Use when:** Harmonic signals where you want a clean spectral-domain method. Good pedagogical complement to time-domain algorithms.<br>
**Not for:** Low-pitched signals (quefrency resolution is limited by window length).<br>
**Ref:** Noll, ["Cepstrum pitch determination"](https://doi.org/10.1121/1.1911537), JASA 1967.<br>
**Requires:** Power-of-2 window length — throws otherwise.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
