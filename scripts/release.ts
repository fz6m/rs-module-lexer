import 'zx/globals'
import { sortPackageJson } from 'rs-module-lexer/compiled/sort-package-json'
import { pick } from 'lodash'

// Release SOP
// 1. update new version in local package.json
// 2. push and mannually trigger release workflow
// 3. check sub packages are published
// 4. publish root package in local

const ARCH_DESC: Record<string, string> = {
  'darwin-arm64': 'macOS ARM 64-bit',
  'darwin-x64': 'macOS 64-bit',
  'linux-arm-gnueabihf': 'Linux ARM 32-bit',
  'linux-arm64-gnu': 'Linux ARM 64-bit',
  'linux-arm64-musl': 'Linux ARM 64-bit (musl)',
  'linux-x64-gnu': 'Linux 64-bit',
  'linux-x64-musl': 'Linux 64-bit (musl)',
  'win32-arm64-msvc': 'Windows ARM 64-bit',
  'win32-x64-msvc': 'Windows 64-bit',
}

const release = async () => {
  const root = path.join(__dirname, '..')
  const rootPkgPath = path.join(root, 'package.json')
  const rootPkg = require(rootPkgPath)
  const globalVersion = rootPkg.version
  const globalName = rootPkg.name
  const globalProps = pick(rootPkg, [
    'author',
    'homepage',
    'repository',
    'engines',
    'license',
    'publishConfig',
  ])
  const subPackagesPrefix = rootPkg.napi.package.name

  const npmDir = path.join(__dirname, '../npm')
  const dirs = fs
    .readdirSync(npmDir)
    .filter((i) => i !== '.DS_Store')
    .map((p) => path.join(npmDir, p))

  const isReleaseRoot = argv?.root
  if (isReleaseRoot) {
    const optionalDependencies = dirs.reduce<Record<string, string>>(
      (memo, cur) => {
        const arch = path.basename(cur)
        const pkgName = `${subPackagesPrefix}-${arch}`
        memo[pkgName] = globalVersion
        return memo
      },
      {}
    )
    // create publish dir
    const publishDir = path.join(root, 'dist')
    if (fs.existsSync(publishDir)) {
      fs.removeSync(publishDir)
    }
    fs.mkdirSync(publishDir)
    const publishPkg = pick(rootPkg, [
      'name',
      'version',
      'main',
      'types',
      'description',
      'author',
      'homepage',
      'repository',
      'keywords',
      'license',
      'engines',
    ]) as Record<string, any>
    publishPkg.optionalDependencies = optionalDependencies
    fs.writeFileSync(
      path.join(publishDir, 'package.json'),
      `${JSON.stringify(sortPackageJson(publishPkg), null, 2)}\n`,
      'utf-8'
    )
    // copy files
    const files = ['LICENSE', 'README.md', ...rootPkg.files]
    files.forEach((file) => {
      const sourcePath = path.join(root, file)
      if (!fs.existsSync(sourcePath)) {
        // ensure index.js
        const isIndex = file === 'index.js'
        if (!isIndex) {
          throw new Error(`File not found: ${sourcePath}`)
        }
        console.log(chalk.yellow(`File not found: ${sourcePath}, skip copy`))
        return
      }
      fs.copyFileSync(sourcePath, path.join(publishDir, file))
    })
    // publish: root package only
    await $`cd ./dist && npm publish --registry https://registry.npmjs.com/`
    return
  }

  dirs.forEach((dir) => {
    const pkgPath = path.join(dir, 'package.json')
    const readmePath = path.join(dir, 'README.md')
    const pkg = require(pkgPath)
    const arch = path.basename(dir)
    const pkgName = `${subPackagesPrefix}-${arch}`
    const newReadmeContent = `
# \`${pkgName}\`

This is the \`${ARCH_DESC[arch]}\` binary for [\`rs-module-lexer\`](https://github.com/fz6m/rs-module-lexer).
`.trimStart()

    // patch pkg
    pkg.name = pkgName
    pkg.description = `This is the ${ARCH_DESC[arch]} binary for rs-module-lexer.`
    pkg.version = globalVersion
    pkg.main = `${globalName}.${arch}.node`
    pkg.files = [pkg.main]
    // other props
    Object.assign(pkg, globalProps)

    // copy license
    const globalLicensePath = path.join(root, 'LICENSE')
    const licensePath = path.join(dir, 'LICENSE')
    fs.copyFileSync(globalLicensePath, licensePath)

    // write readme
    fs.writeFileSync(readmePath, newReadmeContent, 'utf-8')
    // write package.json
    fs.writeFileSync(
      pkgPath,
      `${JSON.stringify(sortPackageJson(pkg), null, 2)}\n`,
      'utf-8'
    )

    console.log(chalk.green(`Patched: ${pkgName}`))
  })

  // add npm to workspace
  const pnpmWorkspacePath = path.join(root, 'pnpm-workspace.yaml')
  const workspaceContent = fs.readFileSync(pnpmWorkspacePath, 'utf-8')
  const ws = YAML.parse(workspaceContent)
  ;(ws.packages as string[]).push('./npm/*')
  // write yaml
  fs.writeFileSync(
    pnpmWorkspacePath,
    YAML.stringify(ws, { lineWidth: 1000 }),
    'utf-8'
  )

  // set root package to private
  rootPkg.private = true
  fs.writeFileSync(
    rootPkgPath,
    `${JSON.stringify(sortPackageJson(rootPkg), null, 2)}\n`,
    'utf-8'
  )

  // reinstall
  await $`pnpm i --no-frozen-lockfile`

  // publish: sub packages only
  await publish()
}

const publish = async () => {
  let userNpmrcPath = `${process.env.HOME}/.npmrc`
  if (fs.existsSync(userNpmrcPath)) {
    console.log('Found existing user .npmrc file')
    const userNpmrcContent = await fs.readFile(userNpmrcPath, 'utf8')
    const authLine = userNpmrcContent.split('\n').find((line) => {
      // check based on https://github.com/npm/cli/blob/8f8f71e4dd5ee66b3b17888faad5a7bf6c657eed/test/lib/adduser.js#L103-L105
      return /^\s*\/\/registry\.npmjs\.com\/:[_-]authToken=/i.test(line)
    })
    if (authLine) {
      console.log(
        'Found existing auth token for the npm registry in the user .npmrc file'
      )
    } else {
      console.log(
        "Didn't find existing auth token for the npm registry in the user .npmrc file, creating one"
      )
      fs.appendFileSync(
        userNpmrcPath,
        `\n//registry.npmjs.com/:_authToken=${process.env.NPM_TOKEN}\n`
      )
    }
  } else {
    console.log('No user .npmrc file found, creating one')
    fs.writeFileSync(
      userNpmrcPath,
      `//registry.npmjs.com/:_authToken=${process.env.NPM_TOKEN}\n`
    )
  }

  await $`pnpm release:only`
}

release()
