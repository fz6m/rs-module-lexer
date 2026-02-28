import 'zx/globals'

const run = async () => {
  const args = process.argv.slice(2)
  const argsStr = args.join(' ')
  await $`pnpm build:napi ${argsStr}`
  await $`pnpm build:postprocess`
}

run()
