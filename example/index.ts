import { parse } from 'rs-module-lexer'

import fs from 'fs'
import path from 'path'

const filename = path.join(
  __dirname,
  '../crates/binding/tests/fixtures/index.ts',
)

console.log(
  parse({
    input: [
      {
        filename,
        code: fs.readFileSync(filename, 'utf8'),
      },
    ],
  }),
)
