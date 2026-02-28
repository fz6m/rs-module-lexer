import { existsSync, mkdirSync } from 'fs'
import os from 'os'
import 'zx/globals'

const platform = os.platform()
const arch = os.arch()

const run = async () => {
  const version = 'version_124'
  const platformMark =
    platform === 'darwin'
      ? 'macos'
      : platform === 'linux'
        ? 'linux'
        : (() => {
            throw new Error('Unsupported platform')
          })()
  const archMark =
    arch === 'x64'
      ? 'x86_64'
      : arch === 'arm64'
        ? 'arm64'
        : (() => {
            throw new Error('Unsupported arch')
          })()
  const url = `https://github.com/WebAssembly/binaryen/releases/download/${version}/binaryen-${version}-${archMark}-${platformMark}.tar.gz`
  console.log(`Platform: ${platform}`)
  console.log(`Arch: ${arch}`)
  console.log(`Version: ${version}`)
  console.log(`URL: ${url}`)
  const cacheDir = path.join(__dirname, './.cache')
  if (!existsSync(cacheDir)) {
    mkdirSync(cacheDir)
  }
  const filePath = path.join(cacheDir, 'binaryen.tar.gz')
  if (!existsSync(filePath)) {
    // download
    console.log(`Downloading ${url}`)
    await $`curl -L ${url} -o ${filePath}`
    // unzip
    console.log(`Unzip ${filePath}`)
    await $`tar -xvf ${filePath} -C ${cacheDir}`
  }
  // opt
  console.log(`Optimizing`)
  const optPath = path.join(
    __dirname,
    `./.cache/binaryen-${version}/bin/wasm-opt`,
  )
  const dir = argv.dir || 'wasm'
  await $`${optPath} -Oz --enable-bulk-memory --enable-nontrapping-float-to-int --merge-similar-functions --converge -o ./target/${dir}/index_bg.wasm ./target/${dir}/index_bg.wasm`
}

run()
