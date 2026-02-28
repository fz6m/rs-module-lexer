# rs-module-lexer

ES module parser powered by Rust. Drop-in compatible with [es-module-lexer](https://github.com/guybedford/es-module-lexer).

### Why

`es-module-lexer` only handles plain JS. Parsing `ts` / `tsx` / `jsx` requires a separate transform step first:

```ts
import { parse } from 'es-module-lexer'
import { transformSync } from 'esbuild'

// 1. transform ts to js
const js = transformSync(ts)
// 2. parse imports
const result = parse(js)
```

`rs-module-lexer` collapses that into a single call. It parses `ts(x)` / `js(x)` directly, powered by SWC.

### Just Use It

Tools like [Oxc](https://github.com/oxc-project/oxc) and [SWC](https://github.com/swc-project/swc) already handle import parsing well, and sure, you could vibe one up. But even then, you still own the edge cases, spec drift, and the transform pipeline. This library takes care of all that, and it is compatible with the `es-module-lexer` data structure out of the box.

SWC is not as performance-optimized as Oxc, but import parsing is never the bottleneck in a real build pipeline. Good enough is good enough here.

### Install

```bash
pnpm i -D rs-module-lexer
```

### Usage

```ts
import { parseAsync } from 'rs-module-lexer'
// Sync: import { parse } from 'rs-module-lexer'

const { output } = await parseAsync({
  input: [
    {
      filename: 'index.ts',
      code: `
        export const member = 5
        import { useState } from 'react'
      `,
    },
    // ... other files
  ],
})

// [ { n: 'react', s: 67, e: 72, ss: 41, se: 73, d: -1, a: -1, t: 1 } ]
console.log(output[0].imports)
// [ { n: 'member', ln: 'member', s: 22, e: 28, ls: 22, le: 28 } ]
console.log(output[0].exports)
```

For the full result shape, see [`es-module-lexer`](https://github.com/guybedford/es-module-lexer).

The API accepts multiple files in one call. Syntax is auto-detected from the `filename` extension.

#### Migrate from `es-module-lexer`

```diff
- import { init, parse } from 'es-module-lexer'
- await init
- const [imports, exports, facade, hasModuleSyntax] = parse(code)

+ import { parseAsync } from 'rs-module-lexer'
+ const { output } = await parseAsync({ input: [{ filename: 'index.ts', code }] })
+ const { imports, exports, facade, hasModuleSyntax } = output[0]
```

### License

MIT
