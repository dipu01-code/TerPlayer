# @audio/vocals

> Center-channel vocal isolation / removal — the SoX `oops` complement, M/S based.

```js
import { isolate, remove } from '@audio/vocals'

isolate([L, R])   // keep center-panned content (typically the vocal), discard sides
remove([L, R])    // keep sides, discard center — karaoke
```

Built on `@audio/spatial-midside`'s encode/decode; mono passes through unchanged. ML stem separation is out of scope here (see `@audio/mir` deferred tier).
