# @audio/eq-lowshelf [![npm](https://img.shields.io/npm/v/@audio/eq-lowshelf)](https://www.npmjs.com/package/@audio/eq-lowshelf) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

RBJ low-shelf filter — boost or cut below a corner frequency

```
npm install @audio/eq-lowshelf
```

```js
import lowShelf from '@audio/eq-lowshelf'
```

RBJ Audio-EQ-Cookbook shelf biquad, via `@audio/biquad`. One section, no cascade — `fc` is the shelf's mid-point (half the `gain` is reached there), `Q` sets slope.

```js
let params = { fc: 200, gain: 3, fs: 44100 }
for (let buf of stream) lowShelf(buf, params)
```

| Param | Default | |
|---|---|---|
| `fc` | `200` | Corner frequency, Hz |
| `gain` | `0` | Shelf gain, dB (positive boosts, negative cuts) |
| `Q` | `0.707` | Shelf slope (1 = RBJ "shelf slope = 1", steepest monotonic; lower is gentler) |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — coefficients and filter memory are cached on it and only rebuilt when `fc`/`gain`/`Q`/`fs` change, so state carries across block boundaries automatically.

**Use when:** warming or thinning below a corner frequency — low end, rumble region, weight; the bottom half of a Baxandall-style tone stack.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
