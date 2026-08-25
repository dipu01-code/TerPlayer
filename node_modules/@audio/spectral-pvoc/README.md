# @audio/spectral-pvoc

> Phase-vocoder engine — the spectral scatter/lock machinery behind pitch shifting and time stretching.

Frame-level primitives over STFT magnitude/phase arrays. Pure math, no dependencies; pair with [`fourier-transform/stft`](https://github.com/scijs/fourier-transform) (ana/syn hop) or [`@audio/stft`](https://github.com/audiojs/stft) (AMS).

```js
import { findPeaks, scatterLocked, lockPhase, makeFrameRatio } from '@audio/spectral-pvoc'
```

| export | role |
|---|---|
| `scatterGated(mag, phase, prevPhase, ratio, ctx, …scratch)` | Bernsee/SMB peak-gated bin scatter — pitch shift by ratio, RMS-preserving collisions |
| `scatterLocked(mag, phase, prevPhase, reset, peaks, ratio, ctx, …scratch)` | Laroche-Dolson rigid-ROI scatter — phase-coherent shift |
| `lockPhase(phase, propPhase, mag, half)` | lock non-peak bins to their peak's rotation (time-stretch coherence) |
| `findPeaks(mag, half)` / `nearestPeak(peaks, k)` | local-maxima peak indices + nearest lookup |
| `makeFrameRatio(ratio)` | scalar or time-varying ratio → per-frame resolver |
| `wrapPhase(p)` / `WIN_GAIN` / `PI2` | phase wrap, Hann OLA gain constant |

Used by [`@audio/shift`](https://github.com/audiojs/shift)'s pvoc/pvoc-lock/sms/formant/transient/hpss and [`@audio/stretch`](https://github.com/audiojs/stretch)'s pvoc-lock/transient. MIT.
