import { init, parse } from 'es-module-lexer'
import { readFileSync } from 'fs'
import { join } from 'path'
// import { transformSync } from '@swc/core'

!(async () => {
  await init
  let content = readFileSync(
    join(__dirname, '../crates/binding/tests/fixtures/index.tsx'),
    'utf-8',
  )
  // content = transformSync(content, {
  //   isModule: true,
  //   filename: 'index.ts',
  //   minify: false,
  //   module: {
  //     type: 'es6'
  //   },
  //   jsc: {
  //     parser: {
  //       syntax: 'typescript',
  //       dynamicImport: true,
  //       tsx: true,
  //     },
  //     target: 'esnext',
  //     minify: {
  //       compress: false,
  //       mangle: false,
  //     }
  //   },
  // }).code
  console.log('content: ', content)
  const [imports, exports, facade] = parse(content)
  // console.log('facade: ', facade);
  console.log(imports)
  console.log(exports)

  // console.log(
  //   content.slice(
  //     33488,
  //     33497
  //     // exports[0].s,
  //     // exports[0].e
  //   )
  // )
})()
