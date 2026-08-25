# @audio/weighting-b [![npm](https://img.shields.io/npm/v/@audio/weighting-b)](https://www.npmjs.com/package/@audio/weighting-b) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

IEC 61672-1:2013 / ANSI S1.42 B-weighting filter — moderate-loudness curve

```
npm install @audio/weighting-b
```

```js
import bWeighting from '@audio/weighting-b'
```

Time-domain B-weighting: matched-z discretization of the historical ANSI B-curve analog
prototype, sharing A/C-weighting's f1=20.598997 Hz (double pole) and f4=12194.217 Hz
(double pole) but with its own single mid pole at f2=158.5 Hz — the original ANSI B
corner, distinct from A's f2/f3. Withdrawn from the modern IEC 61672 standard (superseded
by A/C), retained here for compatibility with legacy ANSI S1.4 meters. 3 second-order
sections, normalized to exactly 0 dB at 1 kHz.

```js
bWeighting(data)                          // in place, fs=44100
bWeighting(data, { fs: 48000 })
let sos = bWeighting.coefs(48000)         // 3 SOS sections — feed digital-filter's freqz
bWeighting.response(1000, 48000)          // |H(1000)| — 1.0 (0dB normalization)
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 3-section cascade at rate `fs` (double pole f1 + single pole f2 + double pole f4), for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** reproducing or matching legacy ANSI S1.4 moderate-loudness meter readings; A or C-weighting for anything current.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
