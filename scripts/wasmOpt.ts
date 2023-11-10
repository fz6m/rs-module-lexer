import { existsSync, mkdirSync } from 'fs'
import 'zx/globals'

// https://github.com/rustwasm/wasm-pack/issues/864#issuecomment-957818452
const run = async () => {
  const version = 'version_116'
  const url = `https://github.com/WebAssembly/binaryen/releases/download/${version}/binaryen-${version}-x86_64-macos.tar.gz`
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
  await $`${optPath} -Oz -o ./target/wasm/index_bg.wasm ./target/wasm/index_bg.wasm`
}

run()
