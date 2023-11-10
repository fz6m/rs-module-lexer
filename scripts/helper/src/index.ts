import { resolve, join } from 'path'
import * as assert from 'assert'

const pkgPath = join(__dirname, './package.json')
const pkg = require(pkgPath)
const pkgName = pkg.name
const binaryEnv = pkgName.replace('-', '_').toUpperCase() + '_BINARY_PATH'
const wasmPkgName = `${pkg.napi.package.name}-wasm`

// Allow overrides to the location of the .node binding file
const bindingsOverride = process.env[binaryEnv]
let fallbackBindings: any
// @ts-ignore
const bindings: typeof import('./binding') = (() => {
  let binding
  try {
    binding = !!bindingsOverride
      ? require(resolve(bindingsOverride))
      : require('./binding')

    // If native binding loaded successfully, it should return proper target triple constant.
    const triple = binding.getTargetTriple()
    assert.ok(triple, 'Failed to read target triple from native binary.')
    return binding
  } catch (_) {
    fallbackBindings = require(wasmPkgName)
  } finally {
    return binding
  }
})()

export = bindings
