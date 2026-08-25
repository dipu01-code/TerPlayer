# @audio/weighting-c [![npm](https://img.shields.io/npm/v/@audio/weighting-c)](https://www.npmjs.com/package/@audio/weighting-c) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

IEC 61672-1:2013 C-weighting filter — near-flat curve for high-SPL measurement

```
npm install @audio/weighting-c
```

```js
import cWeighting from '@audio/weighting-c'
```

Time-domain C-weighting: matched-z discretization of the IEC 61672-1:2013 analog
prototype `H(s) = K·s² / ((s+w1)²(s+w4)²)`, sharing A-weighting's outer poles —
f1=20.598997 Hz (double), f4=12194.217 Hz (double) — but no mid-band poles, giving a
near-flat response across the audible range. 2 second-order sections, normalized to
exactly 0 dB at 1 kHz.

```js
cWeighting(data)                          // in place, fs=44100
cWeighting(data, { fs: 48000 })
let sos = cWeighting.coefs(48000)         // 2 SOS sections — feed digital-filter's freqz
cWeighting.response(1000, 48000)          // |H(1000)| — 1.0 (0dB normalization)
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 2-section cascade at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** measuring high-SPL or low-frequency-heavy sources (peak/impulse SPL, subwoofer output) where A-weighting's low-end rolloff would understate levels.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
