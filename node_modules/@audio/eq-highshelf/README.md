# @audio/eq-highshelf [![npm](https://img.shields.io/npm/v/@audio/eq-highshelf)](https://www.npmjs.com/package/@audio/eq-highshelf) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

RBJ high-shelf filter — boost or cut above a corner frequency

```
npm install @audio/eq-highshelf
```

```js
import highShelf from '@audio/eq-highshelf'
```

RBJ Audio-EQ-Cookbook shelf biquad, via `@audio/biquad`. One section, no cascade — `fc` is the shelf's mid-point (half the `gain` is reached there), `Q` sets slope.

```js
let params = { fc: 4000, gain: -6, fs: 44100 }
for (let buf of stream) highShelf(buf, params)
```

| Param | Default | |
|---|---|---|
| `fc` | `4000` | Corner frequency, Hz |
| `gain` | `0` | Shelf gain, dB (positive boosts, negative cuts) |
| `Q` | `0.707` | Shelf slope (1 = RBJ "shelf slope = 1", steepest monotonic; lower is gentler) |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — coefficients and filter memory are cached on it and only rebuilt when `fc`/`gain`/`Q`/`fs` change, so state carries across block boundaries automatically.

**Use when:** brightening or dulling above a corner frequency — air band, presence, de-harsh; the top half of a Baxandall-style tone stack.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
