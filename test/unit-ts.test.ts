import { expect, test } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'
import { getParser } from './equal'

const parseSingleFile = async (code: string) => {
  const parse = getParser()
  return parse({
    input: [
      {
        filename: FILENAME,
        code,
      },
    ],
  })
}

// TODO: add more tests

const FILENAME = 'index.tsx'
test('Enum', async () => {
  const { output } = await parseSingleFile(`
export  enum   E 
{
    a = 1
}
export namespace C {
    export const b = 1
}
  `)
  expect(output[0].exports.length).toEqual(2)
  expect(output[0].exports[0].n).toEqual('E')
  expect(output[0].exports[1].n).toEqual('C')
})

const fixture = (filename: string) => {
  return readFileSync(join(__dirname, './fixtures', filename), 'utf-8')
}
test('Complex tsx', async () => {
  const { output } = await parseSingleFile(fixture('layout.tsx'))
  expect(output[0].exports.length).toEqual(1)
  expect(output[0].imports.length).toEqual(10)
})

// facade TS cases
test('facade TS', async () => {
  const { output } = await parseSingleFile(`
export type A = 1
export interface B {}  
`)
  expect(output[0].facade).toEqual(true)

  // align with es-module-lexer
  const { output: output1 } = await parseSingleFile(``)
  expect(output1[0].facade).toEqual(true)

  const { output: output2 } = await parseSingleFile(`
export const a = 1
`)
  expect(output2[0].facade).toEqual(false)

  const { output: output3 } = await parseSingleFile(`
export type * as A from 'a'
export * as B from 'b'
  `)
  expect(output3[0].facade).toEqual(true)
})

test('syntax error', async () => {
  try {
    await parseSingleFile(`
import af
  `)
  } catch (e: any) {
    expect(e.message).contain(`import af`)
  }
})
