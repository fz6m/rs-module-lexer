const assert = require('assert')
const { existsSync } = require('fs')
const { parseAsync } = require('rs-module-lexer')

const r = async () => {
  assert(existsSync(require.resolve('@xn-sakina/rml-wasm')))
  const result = await parseAsync({
    input: [
      {
        filename: 'index.ts',
        code: `import a from 'ss'`,
      },
    ],
  })
  console.log('result: ', result)
}

r()
