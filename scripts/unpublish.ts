import 'zx/globals'

const run = async () => {
  const packages = [
    '@xn-sakina/rml-linux-x64-gnu',
    '@xn-sakina/rml-linux-x64-musl',
    '@xn-sakina/rml-darwin-x64',
    '@xn-sakina/rml-linux-arm64-musl',
    '@xn-sakina/rml-darwin-arm64',
    '@xn-sakina/rml-linux-arm64-gnu',
    '@xn-sakina/rml-win32-x64-msvc',
    '@xn-sakina/rml-linux-arm-gnueabihf',
    '@xn-sakina/rml-win32-arm64-msvc',
    // "@xn-sakina/rml-wasm",
  ]
  const unpublishVersion = '2.7.0'

  const sleep = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms))

  // input otp
  const otp = await question('Enter OTP: ')

  for (const pkg of packages) {
    await $`npm unpublish ${pkg}@${unpublishVersion} --otp=${otp}`
    console.log(`Unpublished ${pkg}@${unpublishVersion}`)
    // sleep
    await sleep(1000)
  }
}

run()
