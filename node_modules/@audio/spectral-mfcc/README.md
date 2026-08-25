# @audio/spectral-mfcc

> MFCC — mel-frequency cepstral coefficients: FFT → mel filterbank (triangular, Davis & Mermelstein 1980) → log → DCT-II.

`npm install @audio/spectral-mfcc`

```js
import mfcc from '@audio/spectral-mfcc'

let coeffs = mfcc(frame, { fs: 44100 })   // Float32Array(13), frame.length a power of 2
```

Options: - `fs` — sample rate (default 44100, Hz) · `bins` — number of cepstral coefficients returned (default 13) · `nMel` — mel filterbank size (default 40) · `fmin` — filterbank low edge (default 0, Hz) · `fmax` — filterbank high edge (default `fs / 2`, Hz)

Part of [@audio/spectral](https://github.com/audiojs/spectral).
