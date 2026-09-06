import 'zx/globals'

interface PackageJson {
  version?: string
  napi?: {
    package?: {
      name?: string
    }
  }
  vary?: {
    wasmName?: string
  }
}

const run = async () => {
  const root = path.join(__dirname, '..')
  const pkg = JSON.parse(
    await fs.readFile(path.join(root, 'package.json'), 'utf-8'),
  ) as PackageJson
  const version = pkg.version
  const wasmPackageName =
    pkg.vary?.wasmName ||
    (pkg.napi?.package?.name ? `${pkg.napi.package.name}-wasm` : undefined)

  if (!version) {
    throw new Error('package.json#version is required')
  }
  if (!wasmPackageName) {
    throw new Error(
      'package.json#vary.wasmName or package.json#napi.package.name is required',
    )
  }

  const packageSpec = `${wasmPackageName}@${version}`
  console.log(`Checking whether ${packageSpec} is published on npm...`)

  try {
    const result =
      await $`npm view ${packageSpec} version --json --registry https://registry.npmjs.org/`
    const publishedVersion = JSON.parse(result.stdout.trim())

    if (publishedVersion !== version) {
      throw new Error(`npm returned unexpected version: ${publishedVersion}`)
    }
  } catch (error) {
    throw new Error(
      `${packageSpec} is not available on npm. Please publish the WASM package before releasing the root package.`,
      { cause: error },
    )
  }

  console.log(`${packageSpec} is published on npm.`)
}

run()
