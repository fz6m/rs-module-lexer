import 'zx/globals'

const run = async () => {
  const rootDts = path.join(__dirname, '../index.d.ts')
  const notFound = !fs.existsSync(rootDts)
  if (notFound) {
    throw new Error('index.d.ts not found, please build first')
  }
  const patch = (file: string) => {
    const fromStr = 'at?: Array<Array<string>>'
    const toStr = 'at: Array<[string, string]> | undefined'

    const content = fs.readFileSync(file, 'utf-8')
    if (!content.includes(fromStr)) {
      if (content.includes(toStr)) {
        console.log('🟢 index.d.ts has already been post-processed, skipping')
        return
      }
      throw new Error(
        'index.d.ts does not contain the expected string, please check the file',
      )
    }
    const newContent = content.replace(fromStr, toStr)
    fs.writeFileSync(file, newContent, 'utf-8')
    console.log('🟢 index.d.ts has been post-processed successfully')
  }
  patch(rootDts)
}

run()
