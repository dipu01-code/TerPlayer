# @audio/weighting-k [![npm](https://img.shields.io/npm/v/@audio/weighting-k)](https://www.npmjs.com/package/@audio/weighting-k) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

ITU-R BS.1770-4 K-weighting — the loudness pre-filter behind LUFS

```
npm install @audio/weighting-k
```

```js
import kWeighting from '@audio/weighting-k'
```

Time-domain K-weighting: two cascaded stages redesigned per sample rate from the
canonical ITU-R BS.1770-4 Annex 1 analog prototype constants (De Man 2014, "Evaluation
of Implementations of the ITU-R BS.1770 Loudness Algorithm" — the same design pyloudnorm
uses). Stage 1 is a spherical-head high shelf (G=3.999843853973347 dB,
Q=0.7071752369554196, fc=1681.974450955533 Hz); stage 2 is the RLB weighting highpass
(Q=0.5003270373238773, fc=38.13547087602444 Hz, unnormalized `{1,-2,1}` numerator at any
`fs`). At fs=48000 this reproduces the spec's published coefficient table to ~1e-11.

```js
kWeighting(data)                          // in place, fs=48000
kWeighting(data, { fs: 44100 })
let sos = kWeighting.coefs(44100)         // 2 SOS sections (shelf, then RLB highpass)
kWeighting.response(2000, 48000)          // |H(2000)| — shelf boost
```

| Param | Default | |
|---|---|---|
| `fs` | `48000` | sample rate — SOS recomputed when it changes mid-stream |

| Static | Returns | |
|---|---|---|
| `.coefs(fs)` | `SOS` | 2-section cascade (high shelf + RLB highpass) at rate `fs`, for analysis/plotting |
| `.response(f, fs)` | `number` | `\|H(f)\|` — exact magnitude of this atom's own `.coefs(fs)` cascade, not an independent approximation |

**Use when:** implementing integrated/momentary/short-term loudness (LUFS) per ITU-R BS.1770 / EBU R128 — this is the mandated pre-filter, applied before mean-square gating and channel summing.

---

Part of [@audio/weighting](https://github.com/audiojs/weighting) — the weighting family umbrella.

MIT © [audiojs](https://github.com/audiojs)
