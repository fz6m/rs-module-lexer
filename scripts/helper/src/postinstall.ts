import { existsSync } from 'fs'
import * as assert from 'assert'
import * as path from 'path'
import * as child_process from 'child_process'
import * as fs from 'fs'

function removeRecursive(dir: string): void {
  for (const entry of fs.readdirSync(dir)) {
    const entryPath = path.join(dir, entry)
    let stats
    try {
      stats = fs.lstatSync(entryPath)
    } catch {
      continue // Guard against https://github.com/nodejs/node/issues/4760
    }
    if (stats.isDirectory()) removeRecursive(entryPath)
    else fs.unlinkSync(entryPath)
  }
  fs.rmdirSync(dir)
}

const pkg = require(path.join(__dirname, './package.json'))
const PKG_NAME = pkg.name
const PKG_WASM_NAME = `${pkg.napi.package.name}-wasm`
const binaryEnv = PKG_NAME.replace('-', '_').toUpperCase() + '_BINARY_PATH'

const validateBinary = async () => {
  try {
    const { name } = require(
      path.resolve(process.env.INIT_CWD!, 'package.json'),
    )
    if (name === PKG_NAME) {
      return
    }
  } catch (_) {
    return
  }

  let binding
  try {
    binding = require('./binding')

    const triple = binding.getTargetTriple()
    assert.ok(triple, 'Failed to read target triple from native binary.')
  } catch (error: any) {
    // if error is unsupported architecture, ignore to display.
    if (!error.message?.includes('Unsupported architecture')) {
      console.warn(error)
    }

    console.warn(
      `${PKG_NAME} was not able to resolve native bindings installation. It'll try to use wasm version as fallback instead.`,
    )
  }

  if (!!binding) {
    return
  }

  // User choose to override the binary installation. Skip remanining validation.
  if (!!process.env[binaryEnv]) {
    console.warn(
      `${PKG_NAME} could not resolve native bindings installation, but found manual override config ${binaryEnv} specified. Skipping remaning validation.`,
    )
    return
  }

  let wasmBinding
  try {
    wasmBinding = require.resolve(PKG_WASM_NAME)
  } catch (_) {}

  if (!!wasmBinding && existsSync(wasmBinding)) {
    return
  }

  const env = { ...process.env, npm_config_global: undefined }
  const { version, repository } = require(
    path.join(path.dirname(require.resolve(PKG_NAME)), 'package.json'),
  )

  const coreDir = path.dirname(require.resolve(PKG_NAME))
  const installDir = path.join(coreDir, 'npm-install')

  try {
    fs.mkdirSync(installDir)
    fs.writeFileSync(path.join(installDir, 'package.json'), '{}')

    child_process.execSync(
      `npm install --no-save --loglevel=error --prefer-offline --no-audit --progress=false ${PKG_WASM_NAME}@${version}`,
      { cwd: installDir, stdio: 'pipe', env },
    )

    const installedBinPath = path.join(
      installDir,
      'node_modules',
      PKG_WASM_NAME,
    )
    // INIT_CWD is injected via npm. If it doesn't exists, can't proceed.
    fs.renameSync(
      installedBinPath,
      path.resolve(process.env.INIT_CWD!, 'node_modules', PKG_WASM_NAME),
    )
  } catch (error) {
    console.error(error)

    const reportText = repository?.git?.length
      ? `please report at ${repository.git}`
      : 'please report issue.'

    console.error(
      `Failed to install fallback ${PKG_WASM_NAME}@${version}. ${PKG_NAME} will not properly.
Please install ${PKG_WASM_NAME} manually, or retry whole installation.
If there are unexpected errors, ${reportText}`,
    )
  } finally {
    try {
      removeRecursive(installDir)
    } catch (_) {
      // Gracefully ignore any failures. This'll make few leftover files but it shouldn't block installation.
    }
  }
}

validateBinary().catch((error) => {
  // for now just throw the error as-is.
  throw error
})
