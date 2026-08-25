# @audio/pitch [![test](https://github.com/audiojs/pitch/actions/workflows/test.yml/badge.svg)](https://github.com/audiojs/pitch/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/@audio/pitch)](https://www.npmjs.com/package/@audio/pitch) [![MIT](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://github.com/krishnized/license)

Pitch detection (F0 estimation). YIN, McLeod, pYIN, autocorrelation, AMDF, HPS, cepstrum, SWIPE.

<table><tr><td valign="top">

### Time-domain

**[YIN](#yin)** — cumulative mean normalized difference<br>
**[McLeod](#mcleod)** — normalized square difference (MPM)<br>
**[pYIN](#pyin)** — probabilistic YIN with Beta prior<br>
**[Autocorrelation](#autocorrelation)** — normalized autocorrelation<br>
**[AMDF](#amdf)** — average magnitude difference<br>

</td><td valign="top">

### Spectral

**[HPS](#hps)** — harmonic product spectrum<br>
**[Cepstrum](#cepstrum)** — real cepstrum peak picking<br>
**[SWIPE](#swipe)** — sawtooth waveform inspired estimator<br>

</td></tr></table>

> Chroma, chord and key detection moved to [@audio/mir](https://github.com/audiojs/mir) (`mir-chroma`, `mir-chord`, `mir-key`).


## Install

```
npm install @audio/pitch
```


## Usage

```js
import { yin, mcleod } from '@audio/pitch'

let fs = 44100
let frame = new Float32Array(2048)  // fill from your audio source

let result = yin(frame, { fs })
// → { freq: 440.1, clarity: 0.97 }  or  null
```

> Works in Node.js and browser. No Web Audio API needed — operates on raw `Float32Array` samples.

**Sliding windows** — call repeatedly as new samples arrive:

```js
let hop = 512
for (let i = 0; i + 2048 <= samples.length; i += hop) {
  let frame = samples.subarray(i, i + 2048)
  let result = yin(frame, { fs })
  if (result) console.log(i / fs, result.freq.toFixed(1))
}
```

**Harmony pipeline** — chroma → chord → key lives in [@audio/mir](https://github.com/audiojs/mir):

```js
import { chroma, chord, smoothChords, key } from '@audio/mir'

let frames = []
for (let i = 0; i + 4096 <= samples.length; i += 2048) {
  frames.push(chroma(samples.subarray(i, i + 4096), { fs, method: 'nnls' }))
}
let chords = smoothChords(frames, { selfProb: 0.5 })
let k = key(frames)
```


## API

All pitch algorithms return `{ freq, clarity } | null`:

- `freq` — fundamental frequency in Hz
- `clarity` — algorithm-specific confidence in `[0, 1]`
- `null` — no periodic structure found (silence, noise, polyphony)

Time-domain algorithms (YIN, McLeod, pYIN, autocorrelation, AMDF) accept any buffer length. Spectral algorithms (HPS, cepstrum, SWIPE) require power-of-2 length.

Each algorithm is also installable standalone: `npm install @audio/pitch-yin` etc.


---


## YIN

**de Cheveigné & Kawahara, 2002.** The reference algorithm for monophonic pitch estimation. Most cited, most tested, most robust.

```js
import yin from '@audio/pitch-yin'

let result = yin(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `threshold` | `0.15` | CMND threshold — lower = stricter, fewer detections |

**Use when:** General-purpose monophonic pitch tracking — speech, singing, solo instruments. The most reliable choice when in doubt.<br>
**Not for:** Polyphonic audio (returns dominant or null), real-time with hard latency budgets (needs full window).<br>
**Ref:** de Cheveigné & Kawahara, ["YIN, a fundamental frequency estimator for speech and music"](https://doi.org/10.1121/1.1458024), JASA 2002.<br>
**Complexity:** $O(N^2/4)$ — two nested passes over half the window.


## McLeod

**McLeod & Wyvill, 2005.** Normalized square difference with smarter peak picking. Handles smaller windows — good for vibrato and fast pitch changes.

```js
import mcleod from '@audio/pitch-mcleod'

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


## pYIN

**Mauch & Dixon, 2014.** Probabilistic YIN — runs YIN at multiple thresholds weighted by a Beta(2, 18) prior, producing a distribution over candidate pitches instead of a single hard pick. More robust than YIN on ambiguous frames.

```js
import pyin from '@audio/pitch-pyin'

let result = pyin(samples, { fs: 44100 })
// → { freq: 440.1, clarity: 0.92, candidates: [{ freq: 440.1, prob: 0.85 }, ...] }
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |

**Use when:** Ambiguous pitched content — breathy vocals, noisy recordings, or when you need a pitch posterior for downstream HMM tracking.<br>
**Not for:** Clean signals where YIN already works well (pYIN is ~10× slower due to multi-threshold sweep).<br>
**Ref:** Mauch & Dixon, ["pYIN: A Fundamental Frequency Estimator Using Probabilistic Threshold Distributions"](https://doi.org/10.1109/ICASSP.2014.6853678), ICASSP 2014.


## Autocorrelation

Normalized autocorrelation — the simplest pitch estimator. Educational baseline.

```js
import autocorrelation from '@audio/pitch-autocorrelation'

let result = autocorrelation(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `threshold` | `0.5` | Minimum normalized autocorrelation value to accept |

**Use when:** Learning, quick prototypes, signals with strong dominant periodicity and low noise.<br>
**Not for:** Production — octave errors are common without additional heuristics.<br>
**Ref:** Rabiner, ["Use of autocorrelation analysis for pitch detection"](https://doi.org/10.1109/TASSP.1977.1162905), IEEE TASSP 1977.<br>
**Complexity:** $O(N^2/4)$.


## AMDF

**Ross et al., 1974.** Average Magnitude Difference Function — the classical predecessor to YIN. Measures average absolute difference between a signal and its delayed copy; minima indicate periodicity.

```js
import amdf from '@audio/pitch-amdf'

let result = amdf(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |
| `threshold` | `0.3` | Normalized AMDF dip threshold |

**Use when:** Low-complexity environments, embedded systems. Simpler and cheaper than YIN (no squaring, no cumulative normalization).<br>
**Not for:** Noisy signals — lacks YIN's cumulative normalization that suppresses octave errors.<br>
**Ref:** Ross et al., ["Average magnitude difference function pitch extractor"](https://doi.org/10.1109/TASSP.1974.1162598), IEEE TASSP 1974.<br>
**Complexity:** $O(N^2/4)$.


---


## HPS

**Schroeder, 1968.** Harmonic Product Spectrum — multiplies the spectrum by its downsampled copies so that harmonic peaks align at the fundamental. Robust to the missing-fundamental problem.

```js
import hps from '@audio/pitch-hps'

let result = hps(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `harmonics` | `5` | Number of harmonic products |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `4000` | Maximum detectable frequency (Hz) |
| `cents` | `10` | Candidate spacing in cents |
| `threshold` | `0.1` | Minimum clarity to accept |

**Use when:** Harmonic-rich signals (guitar, piano, brass). Naturally handles missing fundamentals.<br>
**Not for:** Pure sinusoids (only one harmonic), very noisy signals.<br>
**Ref:** Schroeder, ["Period histogram and product spectrum"](https://doi.org/10.1121/1.1910902), JASA 1968.<br>
**Requires:** Power-of-2 window length.


## Cepstrum

**Noll, 1967.** Real cepstrum — $c(\tau) = \text{IFFT}(\log |\text{FFT}(x)|)$. A peak at quefrency $\tau$ corresponds to period $\tau$ in the time domain.

```js
import cepstrum from '@audio/pitch-cepstrum'

let result = cepstrum(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `50` | Minimum detectable frequency (Hz) |
| `maxFreq` | `2000` | Maximum detectable frequency (Hz) |
| `threshold` | `0.3` | Minimum clarity to accept |

**Use when:** Harmonic signals where you want a clean spectral-domain method. Good pedagogical complement to time-domain algorithms.<br>
**Not for:** Low-pitched signals (quefrency resolution is limited by window length).<br>
**Ref:** Noll, ["Cepstrum pitch determination"](https://doi.org/10.1121/1.1911537), JASA 1967.<br>
**Requires:** Power-of-2 window length.


## SWIPE

**Camacho & Harris, 2008.** SWIPE' (Sawtooth Waveform Inspired Pitch Estimator, prime harmonics). Measures spectral similarity between the window and a sawtooth template whose lobes sit at prime harmonics. More accurate than HPS on clean instrumental signals; robust against octave errors because only prime harmonics contribute.

Simplified single-window form: uses one FFT instead of the multi-resolution loudness pyramid of the original paper — sufficient for stationary windows.

```js
import swipe from '@audio/pitch-swipe'

let result = swipe(samples, { fs: 44100 })
```

| Param | Default | |
|---|---|---|
| `fs` | `44100` | Sample rate (Hz) |
| `minFreq` | `60` | Minimum detectable frequency (Hz) |
| `maxFreq` | `4000` | Maximum detectable frequency (Hz) |
| `cents` | `10` | Candidate spacing in cents |
| `threshold` | `0.15` | Minimum clarity to accept |

**Use when:** Clean instrumental signals, studio recordings, where sub-Hz accuracy matters.<br>
**Not for:** Very noisy or reverberant signals (single-window form lacks multi-resolution robustness of the full SWIPE').<br>
**Ref:** Camacho & Harris, ["A sawtooth waveform inspired pitch estimator for speech and music"](https://doi.org/10.1121/1.2951592), JASA 2008.<br>
**Requires:** Power-of-2 window length.


---


## Comparison

### Pitch algorithms

| | YIN | McLeod | pYIN | AMDF | HPS | Cepstrum | SWIPE |
|---|---|---|---|---|---|---|---|
| **Domain** | time | time | time | time | spectral | spectral | spectral |
| **Accuracy** | ★★★★★ | ★★★★ | ★★★★★ | ★★★ | ★★★★ | ★★★ | ★★★★★ |
| **Noise robustness** | ★★★★★ | ★★★★ | ★★★★★ | ★★★ | ★★★ | ★★★ | ★★★★ |
| **Octave errors** | rare | rare | rare | common | rare | occasional | rare |
| **Missing fundamental** | no | no | no | no | yes | yes | yes |
| **Min window** | ~4 periods | ~2 periods | ~4 periods | ~4 periods | power of 2 | power of 2 | power of 2 |
| **Best for** | general | vibrato | ambiguous | embedded | harmonic-rich | pedagogical | studio |

## See also

- [fourier-transform](https://github.com/scijs/fourier-transform) — FFT used by spectral algorithms
- [mir](https://github.com/audiojs/mir) — chroma, chord, key, melody, structure, fingerprint
- [beat](https://github.com/audiojs/beat) — onset detection, tempo estimation, beat tracking
- [digital-filter](https://github.com/audiojs/digital-filter) — filter design and processing
- [stretch](https://github.com/audiojs/stretch) — time stretching and pitch shifting
- [shift](https://github.com/audiojs/shift) — pitch shifting algorithms
