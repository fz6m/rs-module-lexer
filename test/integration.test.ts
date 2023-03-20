import 'zx/globals'
import { test, expect } from 'vitest'
import { isEqual } from './equal'
import { parse } from '../'

const samplesDir = path.join(__dirname, 'samples')
const files = fs
  .readdirSync(samplesDir)
  .filter((f) => f.endsWith('.js'))
  .map((f) => path.join(samplesDir, f))
  .map((file) => {
    const code = fs.readFileSync(file, 'utf-8')
    return {
      filename: file,
      code,
    }
  })

test('Equal', async () => {
  await Promise.all(
    files.map(async ({ filename, code }) => {
      const basename = path.basename(filename)
      console.log('> Equal', basename)
      await isEqual(filename, code)
    })
  )
})

test('Snapshot', async () => {
  const { output } = parse({
    input: files,
  })
  output.forEach((file) => {
    file.filename = path.basename(file.filename)
    expect(file).toMatchSnapshot(file.filename)
  })
})
