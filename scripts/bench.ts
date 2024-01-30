import 'zx/globals'
import { init, parse } from 'es-module-lexer'
import { parseAsync as rsParser } from 'rs-module-lexer'
import { transformSync } from 'esbuild'

const bench = async (isTS = false) => {
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
        isTS
          ? transformSync(sample.code, {
              loader: 'ts',
              sourcemap: false,
            }).code
          : sample.code,
      )
    })
    const result = await Promise.all(tasks)
    const end = Date.now()
    const diff = end - start
    // console.log(`es-module-lexer: ${diff}ms`)
    return diff
  }

  // use rs-module-lexer
  const runrsModuleLexer = async () => {
    const start = Date.now()
    const result = await rsParser({
      input: samples,
    })
    const end = Date.now()
    const diff = end - start
    // console.log(`rs-module-lexer: ${diff}ms`)
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

  const esAve = esModuleLexerTotal / times
  const rsAve = rsModuleLexerTotal / times
  const esWin = esAve < rsAve ? '🎉' : ''
  const rsWin = esAve > rsAve ? '🎉' : ''
  console.log(`[${isTS ? 'TS' : 'JS'}]`)
  console.log(`es-module-lexer average: ${esAve}ms ${esWin}`)
  console.log(`rs-module-lexer average: ${rsAve}ms ${rsWin}`)
}

const run = async () => {
  await bench(false)
  await bench(true)
}

run()
