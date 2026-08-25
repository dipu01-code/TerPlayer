# @audio/weighting

> Frequency weighting filters — time-domain SOS implementations with `.coefs(fs)` for analysis.

| Package | What |
|---|---|
| `@audio/weighting-a` | IEC 61672 A-weighting |
| `@audio/weighting-b` | IEC 61672 / ANSI S1.42 B-weighting |
| `@audio/weighting-c` | IEC 61672 C-weighting |
| `@audio/weighting-d` | IEC 537 D-weighting (aircraft noise, resonant hump near 3.3 kHz) |
| `@audio/weighting-k` | ITU-R BS.1770-4 K-weighting (exact at any sample rate) |
| `@audio/weighting-itu468` | ITU-R BS.468-4 noise weighting |
| `@audio/weighting-riaa` | RIAA playback equalization |

Each atom carries `.response(f, fs)` — the magnitude of its own SOS cascade, absorbed from the standalone [a-weighting](https://github.com/audiojs/a-weighting) response *functions*. Extracted from [filter](https://github.com/audiojs/filter).
