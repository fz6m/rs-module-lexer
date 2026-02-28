import 'zx/globals'

const run = async () => {
  const root = path.join(__dirname, '../')
  const wasmDTS = path.join(root, 'target/wasm/index.d.ts')
  if (!fs.existsSync(wasmDTS)) {
    throw new Error('index.d.ts not found, plz build wasm first')
  }

  const originContent = await fs.readFile(wasmDTS, 'utf-8')
  const newLines: string[] = []
  const lines = originContent.split('\n')
  lines.forEach((line) => {
    if (line.startsWith('export type ImportType')) {
      // delete
      return
    } else if (line.includes(`ImportType`)) {
      line = line.replace('ImportType', [1, 2, 3, 4, 5].join(' | '))
      newLines.push(line)
    } else if (line.includes(`at: string[][] | null;`)) {
      line = line.replace(
        `at: string[][] | null;`,
        'at: Array<[string, string]> | undefined;',
      )
      newLines.push(line)
    } else {
      // push
      newLines.push(line)
    }
  })
  const newContent = newLines.join('\n')

  const wasmOutDir = [
    path.join(root, 'target/wasm'),
    path.join(root, 'target/wasm_web'),
  ]
  const tasks = wasmOutDir.map(async (dir) => {
    const indexDtsPath = path.join(dir, 'index.d.ts')
    if (!fs.existsSync(indexDtsPath)) {
      // ignore
      return
    }
    await fs.writeFile(indexDtsPath, `${newContent}\n`, 'utf-8')
    console.log(`Update dts ${path.relative(root, indexDtsPath)}`)
  })
  await Promise.all(tasks)
}

run()
