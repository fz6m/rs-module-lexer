import assert from 'assert'
import { parse } from 'rs-module-lexer'

function failedParse() {
  const { output } = parse({
    input: [
      {
        filename: 'x.jsx',
        code: `
          export function Foo() {
            return (\`\`
              <div />
            );
          }
        `,
      },
    ],
  })
  console.log(output[0])
}

assert.throws(failedParse)

try {
  failedParse()
} catch (err) {
  console.log('caught error: ', err)
}
