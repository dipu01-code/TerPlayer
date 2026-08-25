# @audio/eq-fir [![npm](https://img.shields.io/npm/v/@audio/eq-fir)](https://www.npmjs.com/package/@audio/eq-fir) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Linear-phase FIR EQ from an arbitrary magnitude response — firequalizer / match-EQ class

```
npm install @audio/eq-fir
```

```js
import firEq, { design } from '@audio/eq-fir'
```

FFmpeg firequalizer's class of EQ: frequency-sampling design builds an odd-length, type-I symmetric FIR from a target dB curve (a list of `{f, gain}` points, linearly interpolated, or a `frequency => dB` function), Hann-windowed against Gibbs ripple. Zero-latency apply — the group delay of `(taps-1)/2` samples is compensated internally, so the filtered output stays time-aligned with the input. This is the substrate for match-EQ tools like Matchering: hand it a captured target spectrum and it reproduces it exactly, phase-linearly.

```js
firEq(data, { response: [{ f: 100, gain: -3 }, { f: 1000, gain: 0 }, { f: 8000, gain: 4 }] })

// or design once, reuse across buffers
let coefs = design(f => (f > 5000 ? 6 : 0), { taps: 1023, fs: 48000 })
firEq(bufA, { coefs })
firEq(bufB, { coefs })
```

| Param | Default | |
|---|---|---|
| `response` | — | `{f, gain}[]` dB points (linear interpolation, clamped outside) or `f => dB` function. Ignored if `coefs` given |
| `coefs` | — | Precomputed `Float64Array` from `design()` — skips the design step |
| `taps` | `511` | FIR length — forced odd (type-I symmetric) |
| `fs` | `44100` | Sample rate, Hz |

Unlike the biquad-based atoms in this family, `firEq` holds no state across calls — `taps`/`response` (or `coefs`) are used fresh every call, convolved directly against `data` with zero-padded edges. There's no streaming/chunked mode: call it with the whole buffer. Only typed arrays are accepted (`Float32Array`/`Float64Array`, via `TypedArray#set`) — plain `number[]` is not supported.

**Use when:** matching a captured target spectrum exactly, or any EQ curve too irregular for a handful of biquads — where phase linearity matters more than CPU cost.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
