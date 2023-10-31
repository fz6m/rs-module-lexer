import { expect } from 'vitest'
import { parse } from '../'

export const isEqual = async (filename: string, code: string) => {
  const es = await import('es-module-lexer')
  await es.init
  const result = es.parse(code)
  const { output } = parse({
    input: [
      {
        filename,
        code,
      },
    ],
  })
  // facade
  expect(output[0].facade).toEqual(result[2])
  // import
  expect(output[0].imports).toEqual(result[0])
  // export
  try {
    if (process.env.DEBUG_RESULT) {
      console.log('output[0].exports: ', output[0].exports)
      console.log('result[1]: ', result[1])
    }
    expect(output[0].exports).toEqual(result[1])
  } catch {
    // export
    output[0].exports.forEach((e, idx) => {
      const esExport = result[1][idx]
      const isEsNotLnInfo =
        !esExport?.ln && esExport.ls === -1 && esExport.le === -1
      const isCurrentHasLnInfo = e.ls !== -1 && e.le !== -1 && !!e.ln?.length
      // good
      if (isEsNotLnInfo && isCurrentHasLnInfo) {
        delete e.ln
        e.ls = -1
        e.le = -1
      }
    })
    // recheck
    expect(output[0].exports).toEqual(result[1])
  }
}
