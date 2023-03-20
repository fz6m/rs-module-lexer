import 'zx/globals'
import { init, parse } from 'es-module-lexer'
import { parse as rsParser } from 'rs-module-lexer'
import { transformSync } from 'esbuild'

const bench = async () => {
  const samplesDir = path.join(__dirname, '../test/samples')
  const samples = fs
    .readdirSync(samplesDir)
    .filter((i) => i.endsWith('.js'))
    .map((i) => path.join(samplesDir, i))
    .map((i) => {
      return {
        filename: i,
        code: fs.readFileSync(i, 'utf-8'),
      }
    })

  await init

  // use es-module-lexer
  const runEsModuleLexer = async () => {
    const start = Date.now()
    const tasks = samples.map((sample) => {
      return parse(
        // sample.code
        transformSync(sample.code, {
          loader: 'ts',
          sourcemap: false,
        }).code
      )
    })
    const result = await Promise.all(tasks)
    const end = Date.now()
    const diff = end - start
    console.log(`es-module-lexer: ${diff}ms`)
    return diff
  }

  // use rs-module-lexer
  // 🤔 if we parse ts files, it is 1x faster than es-module-lexer
  // 😅 if we parse js files, it is 2x slower than es-module-lexer
  const runrsModuleLexer = async () => {
    const start = Date.now()
    const result = rsParser({
      input: samples,
    })
    const end = Date.now()
    const diff = end - start
    console.log(`rs-module-lexer: ${diff}ms`)
    return diff
  }

  // for 10 times, and get the average
  const times = 10
  let esModuleLexerTotal = 0
  let rsModuleLexerTotal = 0
  for (let i = 0; i < times; i++) {
    esModuleLexerTotal += await runEsModuleLexer()
    rsModuleLexerTotal += await runrsModuleLexer()
  }
  console.log(`es-module-lexer average: ${esModuleLexerTotal / times}ms`)
  console.log(`rs-module-lexer average: ${rsModuleLexerTotal / times}ms`)
}

bench()
