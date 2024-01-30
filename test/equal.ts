import { expect } from 'vitest'
import { init, parse as esParse } from 'es-module-lexer'

export const getParser = () => {
  let parseAsync: typeof import('../').parseAsync
  if (process.env.TEST_WASM) {
    parseAsync = require('../target/wasm').parseAsync
  } else {
    parseAsync = require('../').parseAsync
  }
  return parseAsync
}

export const isEqual = async (filename: string, code: string) => {
  await init
  const result = esParse(code)
  const parseAsync = getParser()
  const { output } = await parseAsync({
    input: [
      {
        filename,
        code,
      },
    ],
  })
  // facade
  expect(output[0].facade).toEqual(result[2])
  // hasModuleSyntax
  expect(output[0].hasModuleSyntax).toEqual(result[3])
  // import
  expect(output[0].imports).toEqual(result[0])
  // export
  try {
    if (process.env.DEBUG_RESULT) {
      console.log('rs-module-lexer: ', output[0].exports)
      console.log('es-module-lexer: ', result[1])
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
