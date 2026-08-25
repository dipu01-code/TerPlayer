# @audio/eq-graphic [![npm](https://img.shields.io/npm/v/@audio/eq-graphic)](https://www.npmjs.com/package/@audio/eq-graphic) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

ISO 266 10-band graphic equalizer

```
npm install @audio/eq-graphic
```

```js
import graphicEq from '@audio/eq-graphic'
```

Fixed 10-band graphic EQ at the ISO 266 / IEC 61260 1/1-octave nominal center frequencies — `31.5, 63, 125, 250, 500, 1000, 2000, 4000, 8000, 16000` Hz. One RBJ peaking biquad per non-zero band (Q 1.4), cascaded low-to-high; bands left at 0 dB build no filter section, so an all-flat EQ costs nothing.

```js
let params = { gains: { 1000: 6, 8000: -3 }, fs: 44100 }
for (let buf of stream) graphicEq(buf, params)
```

| Param | Default | |
|---|---|---|
| `gains` | `{}` | Per-band gain in dB, keyed by center frequency (e.g. `1000`) or its rounded form |
| `fs` | `44100` | Sample rate, Hz |

Pass the same `params` object across successive calls — the filter cascade is cached on it and only rebuilt when `gains`/`fs` change by value, so state carries across block boundaries automatically.

**Use when:** the classic mixing-console/PA slider EQ — fixed bands, familiar layout, quick broad-strokes shaping.

---

Part of [@audio/eq](https://github.com/audiojs/eq) — the eq family umbrella.

MIT © [audiojs](https://github.com/audiojs)
