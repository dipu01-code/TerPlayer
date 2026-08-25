# @audio/weighting-itu468 [![npm](https://img.shields.io/npm/v/@audio/weighting-itu468)](https://www.npmjs.com/package/@audio/weighting-itu468) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

ITU-R BS.468-4 noise weighting — broadcast noise-measurement curve, peaked near 6.3 kHz

```
npm install @audio/weighting-itu468
```

```js
import itu468 from '@audio/weighting-itu468'
```

Time-domain ITU-R BS.468-4 weighting: exact matched-z realization of the analog
prototype (6 poles — two complex pairs plus two real, one zero at DC — found via
Durand-Kerner root-finding on the spec's rational polynomial, Rec. ITU-R BS.468-4 Annex
1). The analog prototype matches the spec's reference table to within 0.05 dB across
31.5 Hz–20 kHz; the discrete filter reproduces this near-exactly away from Nyquist
(error grows above ~10 kHz at 44.1/48 kHz — use ≥96 kHz for closest match at the top
octave). Peaks +12.2 dB near 6.3 kHz. 3 second-order sections, normalized to exactly 0 dB
at 1 kHz.

```js
itu468(data)                              // in place, fs=48000
itu468(data, { fs: 96000 })
let sos = itu468.coefs(96000)             // 3 SOS sections — feed digital-filter's freqz
itu468.response(6300, 48000)              // |H(6300)| — near the +12.2dB peak
```

| Param | Default | |
|---|---|---|
| `fs` | `48000` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 3-section cascade at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** measuring broadcast/telecom noise (hum, hiss, quantization noise) per ITU-R BS.468-4 / EBU Tech 3308 — weights toward the ear's peak sensitivity band rather than SPL-meter curves (A/B/C/D).

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
