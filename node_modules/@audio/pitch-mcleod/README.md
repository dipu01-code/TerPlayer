# @audio/pitch-mcleod [![npm](https://img.shields.io/npm/v/@audio/pitch-mcleod)](https://www.npmjs.com/package/@audio/pitch-mcleod) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

McLeod Pitch Method (McLeod & Wyvill, 2005)

```
npm install @audio/pitch-mcleod
```

```js
import mcleod from '@audio/pitch-mcleod'
```

**McLeod & Wyvill, 2005.** Normalized square difference with smarter peak picking. Handles smaller windows — good for vibrato and fast pitch changes.

```js
let result = mcleod(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `threshold` | `0.9` | Peak selection threshold as fraction of global max |

**Use when:** Vibrato tracking, small hop sizes, singing voice where YIN occasionally double-triggers.<br>
**Not for:** Highly noisy signals (NSDF is less thresholded than YIN's CMND).<br>
**Ref:** McLeod & Wyvill, ["A smarter way to find pitch"](https://www.cs.otago.ac.nz/research/publications/oucs-2008-03.pdf), ICMC 2005.<br>
**Complexity:** $O(N^2/4)$ — same asymptotic cost as YIN.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
