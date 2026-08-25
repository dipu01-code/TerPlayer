# @audio/pitch-yin [![npm](https://img.shields.io/npm/v/@audio/pitch-yin)](https://www.npmjs.com/package/@audio/pitch-yin) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

YIN pitch detection (de Cheveigné & Kawahara, 2002)

```
npm install @audio/pitch-yin
```

```js
import yin from '@audio/pitch-yin'
```

**de Cheveigné & Kawahara, 2002.** The reference algorithm for monophonic pitch estimation. Most cited, most tested, most robust.

```js
let result = yin(samples, { fs: 44100 })
// → { freq: 440.1, clarity: 0.97 }  or  null
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `threshold` | `0.15` | CMND threshold — lower = stricter, fewer detections |

**Use when:** General-purpose monophonic pitch tracking — speech, singing, solo instruments. The most reliable choice when in doubt.<br>
**Not for:** Polyphonic audio (returns dominant or null), real-time with hard latency budgets (needs full window).<br>
**Ref:** de Cheveigné & Kawahara, ["YIN, a fundamental frequency estimator for speech and music"](https://doi.org/10.1121/1.1458024), JASA 2002.<br>
**Complexity:** $O(N^2/4)$ — two nested passes over half the window.

---

Part of [@audio/pitch](https://github.com/audiojs/pitch) — the pitch family umbrella. This README is generated from the umbrella docs.

MIT © [audiojs](https://github.com/audiojs)
