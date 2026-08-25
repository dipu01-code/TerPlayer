# @audio/pitch-swipe [![npm](https://img.shields.io/npm/v/@audio/pitch-swipe)](https://www.npmjs.com/package/@audio/pitch-swipe) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

SWIPE′ — Sawtooth Waveform Inspired Pitch Estimator with prime harmonics

```
npm install @audio/pitch-swipe
```

```js
import swipe from '@audio/pitch-swipe'
```

**Camacho & Harris, 2008.** SWIPE' (Sawtooth Waveform Inspired Pitch Estimator, prime harmonics). Measures spectral similarity between the window and a sawtooth template whose lobes sit at prime harmonics. More accurate than HPS on clean instrumental signals; robust against octave errors because only prime harmonics contribute.

Simplified single-window form: uses one FFT instead of the multi-resolution loudness pyramid of the original paper — sufficient for stationary windows.

```js
let result = swipe(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `60` | Minimum detectable frequency (Hz) |
| `maxFreq` | `4000` | Maximum detectable frequency (Hz) |
| `cents` | `10` | Candidate spacing in cents |
| `threshold` | `0.15` | Minimum clarity to accept |

**Use when:** Clean instrumental signals, studio recordings, where sub-Hz accuracy matters.<br>
**Not for:** Very noisy or reverberant signals (single-window form lacks multi-resolution robustness of the full SWIPE').<br>
**Ref:** Camacho & Harris, ["A sawtooth waveform inspired pitch estimator for speech and music"](https://doi.org/10.1121/1.2951592), JASA 2008.<br>
**Requires:** Power-of-2 window length — throws otherwise.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
