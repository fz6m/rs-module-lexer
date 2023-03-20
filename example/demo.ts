import { parse } from 'rs-module-lexer'

const { output } = parse({
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

// [ { n: 'react', s: 67, e: 72, ss: 41, se: 73, d: -1, a: -1 } ]
console.log(output[0].imports)
// [ { n: 'member', ln: 'member', s: 22, e: 28, ls: 22, le: 28 } ]
console.log(output[0].exports)
