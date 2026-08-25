# @audio/weighting-a [![npm](https://img.shields.io/npm/v/@audio/weighting-a)](https://www.npmjs.com/package/@audio/weighting-a) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

IEC 61672-1:2013 A-weighting filter — the standard SPL-meter curve

```
npm install @audio/weighting-a
```

```js
import aWeighting from '@audio/weighting-a'
```

Time-domain A-weighting: matched-z discretization of the IEC 61672-1:2013 analog prototype
`H(s) = K·s⁴ / ((s+w1)²(s+w2)(s+w3)(s+w4)²)` with poles at f1=20.598997 Hz (double),
f2=107.65265 Hz, f3=737.86223 Hz, f4=12194.217 Hz (double) — 3 second-order sections,
normalized to exactly 0 dB at 1 kHz.

```js
aWeighting(data)                          // in place, fs=44100
aWeighting(data, { fs: 48000 })
let sos = aWeighting.coefs(48000)         // 3 SOS sections — feed digital-filter's freqz
aWeighting.response(1000, 48000)          // |H(1000)| — 1.0 (0dB normalization)
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 3-section cascade at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** measuring or matching perceived loudness at low-to-moderate SPL — the standard curve for consumer/broadcast loudness meters and most "dBA" specs.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
