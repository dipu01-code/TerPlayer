# @audio/window

> Audio-facing window kit — typed fills (periodic/symmetric), in-place apply, COLA check.

Thin layer over [`window-function`](https://github.com/scijs/window-function) (scijs — canonical per-sample math, re-exported whole): fills typed arrays with the DFT-even *periodic* variant STFT needs (or *symmetric* for filter design), and verifies constant-overlap-add for hop choices.

```js
import window, { apply, cola, hann } from '@audio/window'

let w = window('hann', 1024)                     // periodic (DFT-even) — for STFT
let sym = window('hann', 1024, { periodic: false }) // symmetric — for filter design

apply(frame, w)                                  // multiply in place

cola(w, 512)                                     // { ok, ripple, mean } — is this hop COLA?
cola(w, 512, { squared: true })                  // analysis+synthesis (win²) variant

hann(3, 7)                                       // any window-function export, re-exported
```

Any `window-function` name works: `hann`, `hamming`, `blackman`, `blackmanHarris`, `nuttall`, `gaussian`, `tukey`, `kaiser`, …

## See also

- [`@audio/stft`](https://github.com/audiojs/stft) — the canonical STFT this pairs with (its internal `hannWindow` is consistency-tested against this package)
- [`window-function`](https://github.com/scijs/window-function) — the per-sample math underneath (scijs layer)

## License

MIT
