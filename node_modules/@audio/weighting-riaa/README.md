# @audio/weighting-riaa [![npm](https://img.shields.io/npm/v/@audio/weighting-riaa)](https://www.npmjs.com/package/@audio/weighting-riaa) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

RIAA playback equalization — vinyl de-emphasis curve

```
npm install @audio/weighting-riaa
```

```js
import riaa from '@audio/weighting-riaa'
```

Time-domain RIAA de-emphasis: bilinear transform (with frequency prewarping) of the
analog playback curve `H(s) = (1 + s·T2) / ((1 + s·T1)(1 + s·T3))`, T1=3180 µs
(fp1≈50.05 Hz pole), T2=318 µs (fz≈500.5 Hz zero), T3=75 µs (fp2≈2122 Hz pole) — the
standard RIAA time constants, folded into a single biquad. 1 second-order section,
normalized to exactly 0 dB at 1 kHz.

```js
riaa(data)                                // in place, fs=44100
riaa(data, { fs: 48000 })
let sos = riaa.coefs(48000)               // 1 SOS section — feed digital-filter's freqz
riaa.response(20, 48000)                  // |H(20)| — the bass-boost region
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 1-section cascade at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** decoding a phono-preamp signal that was cut with RIAA pre-emphasis (i.e. reversing vinyl mastering's treble boost / bass cut) back to a flat response.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
