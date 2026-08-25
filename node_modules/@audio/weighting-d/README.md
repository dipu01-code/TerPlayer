# @audio/weighting-d [![npm](https://img.shields.io/npm/v/@audio/weighting-d)](https://www.npmjs.com/package/@audio/weighting-d) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

IEC 537 D-weighting filter — aircraft-noise curve with a resonant hump near 3.3 kHz

```
npm install @audio/weighting-d
```

```js
import dWeighting from '@audio/weighting-d'
```

Time-domain D-weighting: matched-z discretization of the IEC 537 analog prototype
`H(s) = s(s²+6532s+4.0975e7) / [(s+1776.3)(s+7288.5)(s²+21514s+3.8836e8)]` — one zero at
DC plus a complex zero pair, two real poles plus a complex pole pair. The only weighting
curve with a resonant peak rather than a monotonic rolloff: ≈+11.6 dB near 3.3 kHz
(+11.5 dB at the IEC 537 3.15 kHz third-octave reference point), matching the ear's
sensitivity to aircraft flyover noise. Withdrawn from the modern standard. 2 second-order
sections, normalized to exactly 0 dB at 1 kHz.

```js
dWeighting(data)                          // in place, fs=44100
dWeighting(data, { fs: 48000 })
let sos = dWeighting.coefs(48000)         // 2 SOS sections — feed digital-filter's freqz
dWeighting.response(1000, 48000)          // |H(1000)| — 1.0 (0dB normalization)
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 2-section cascade at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** measuring or matching perceived loudness of aircraft/jet-engine noise; the only weighting curve tuned for that resonant 3–4 kHz band rather than general SPL.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
