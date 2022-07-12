#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
const {
  readFileSync,
  writeFileSync,
  removeSync,
  existsSync,
  createWriteStream,
  renameSync,
  copySync,
} = require('fs-extra')
const { join, resolve } = require('path')
const extract = require('extract-zip')
const { promisify } = require('util')
const { pipeline } = require('stream')
const { v4: uuidv4 } = require('uuid')

let inquirer
let fetch
import('inquirer').then(async (module) => {
  inquirer = module.default
  import('node-fetch').then(async (module2) => {
    fetch = module2.default

    await main()
  })
})

function runCommand(command) {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.warn(`Failed to execute ${command}`, error)
    return false
  }
}

function isYes(v) {
  return v === true || v.toLowerCase() === 'y'
}

async function download(url, filePath) {
  if (existsSync(filePath)) removeSync(filePath)

  const streamPipeline = promisify(pipeline)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
  await streamPipeline(response.body, createWriteStream(filePath))
}

async function unzip(file, dir) {
  await extract(file, { dir })
}

async function addParserOptionsToEsLintConfig(file) {
  const json = JSON.parse(readFileSync(file, { encoding: 'utf8', flag: 'r' }))
  json['overrides'][0]['parserOptions'] = {
    project: ['tsconfig.*?.json'],
  }
  writeFileSync(file, JSON.stringify(json, null, 2))
  return true
}

async function interactiveMode() {
  return new Promise((resolve, reject) => {
    inquirer
      .prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Repository name:',
        },
        {
          type: 'input',
          name: 'apiName',
          message: 'API project name:',
          default: 'api',
        },
        {
          type: 'input',
          name: 'sharedName',
          message: 'Shared library name:',
          default: 'shared',
        },
        {
          type: 'confirm',
          name: 'nvm',
          message: 'Use NVM?',
          default: true,
        },
        {
          type: 'input',
          name: 'rootpath',
          message: 'Relative path to the repository root folder',
          default: '..',
        },
      ])
      .then((answers) => {
        answers.nvm = answers.nvm ? 'y' : 'n'
        resolve(answers)
      })
      .catch((error) => {
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else went wrong
        }
        reject(error)
      })
  })
}

async function install(params) {
  const { nvm, name, rootpath, apiName, sharedName } = params

  let workingDir = process.cwd()
  let rootDir = null

  const commands = [
    [
      `Create Nx workspace`,
      () => true,
      async () => {
        if (!name) {
          console.log('Please enter a name for your repository')
          process.exit(-1)
          return false
        }
        if (existsSync(join(workingDir, name))) {
          console.log(`Directory ${name} already exists! Please remove it first to continue`)
          process.exit(-1)
          return false
        }

        runCommand(`npx create-nx-workspace ${name} --preset=ts`)

        // cd into directory and resolve rootDir
        workingDir = join(workingDir, name)
        rootDir = resolve(workingDir, rootpath)

        return true
      },
    ],
    [
      'Install Nest & Eslint+Prettier',
      () => true,
      async () =>
        runCommand(
          `cd ${name} && npm install -D @nrwl/nest @nrwl/linter eslint-plugin-prettier eslint @typescript-eslint/eslint-plugin @typescript-eslint/parser eslint-config-prettier @nrwl/eslint-plugin-nx`,
        ),
    ],
    [
      'Update eslintrc and prettierrc',
      () => true,
      async () => {
        const tempEslit = join(workingDir, uuidv4())
        const tempPrettier = join(workingDir, uuidv4())
        await Promise.all([
          download(
            'https://gist.githubusercontent.com/saeidjoker/ef585dcbec7995fba52a61cea20eeea4/raw/9724520c344523a47534a1bf01e2ab0bc6fd170e/.eslintrc.json',
            tempEslit,
          ),
          download(
            'https://gist.githubusercontent.com/saeidjoker/20969dcb73675c3a7044945baaa69d03/raw/77618bac541a7a59971ba5664794b210afc7321b/.prettierrc',
            tempPrettier,
          ),
        ])

        const prettier = join(workingDir, '.prettierrc')
        const eslint = join(workingDir, '.eslintrc.json')

        renameSync(tempEslit, eslint)
        renameSync(tempPrettier, prettier)

        return true
      },
    ],
    [
      'lts/* => .nvmrc',
      () => isYes(nvm),
      async () => {
        writeFileSync(join(workingDir, '.nvmrc'), 'lts/*')
        return true
      },
    ],
    // API project.....................
    ['Create API project', () => true, async () => runCommand(`cd ${name} && nx g @nrwl/nest:app ${apiName}`)],
    [
      'Update API project eslintrc',
      () => true,
      async () => addParserOptionsToEsLintConfig(join(workingDir, `packages/${apiName}/.eslintrc.json`)),
    ],
    ['Fix API lint errors', () => true, async () => runCommand(`cd ${name} && nx lint ${apiName} --fix`)],
    // Shared project .................
    [
      'Create Shared project',
      () => true,
      async () =>
        runCommand(
          `cd ${name} && nx g @nrwl/nest:lib ${sharedName} --publishable --importPath="@${name}/${sharedName}"`,
        ),
    ],
    [
      'Update Shared project eslintrc',
      () => true,
      async () => {
        await addParserOptionsToEsLintConfig(join(workingDir, `packages/${sharedName}/.eslintrc.json`))

        // download zip file
        const zipFile = join(workingDir, `${uuidv4()}.zip`)
        const url = 'https://github.com/saeidjoker/nx-ddd-template/archive/refs/heads/main.zip'
        await download(url, zipFile)

        // unzip and delete the zip file
        await unzip(zipFile, workingDir)
        removeSync(zipFile)

        const sourceDir = join(workingDir, 'nx-ddd-template-main')

        removeSync(join(workingDir, `packages/${sharedName}/src`))
        copySync(join(sourceDir, 'shared'), join(workingDir, `packages/${sharedName}`))

        removeSync(sourceDir)

        return true
      },
    ],
    [
      'Add scripts',
      () => true,
      async () => {
        const filePath = join(workingDir, 'package.json')
        const json = JSON.parse(readFileSync(filePath, { encoding: 'utf8', flag: 'r' }))

        json.scripts = {
          test: 'nx affected:test',
          'test:all': 'nx run-many --all --target=test',
          lint: 'nx affected:lint',
          'lint:all': 'nx run-many --all --target=lint',
          build: 'nx run-many --all --target=build',
          e2e: 'nx affected:e2e',
          'e2e:all': 'nx run-many --all --target=e2e',
        }

        writeFileSync(filePath, JSON.stringify(json, null, 2))

        return true
      },
    ],
  ]

  for (let i = 0; i < commands.length; i++) {
    const [cmdDescription, canExecute, execute] = commands[i]
    if (canExecute()) {
      console.log(`${cmdDescription}...`)
      const res = await execute()
      if (res) {
        console.log('===> Successful')
      } else {
        console.warn('===> Failed')
      }
    }
  }

  console.log("Congratulations! You're API app and Shared library are ready.")
  console.log('Follow the following commands to start')
  console.log(`cd ${name} && nx serve ${apiName}`)
}

async function main() {
  const options = program
    .option('--name <name>', 'Repository name')
    .option('--api-name <api>', 'API project name', 'api')
    .option('--shared-name <shared>', 'Shared library name', 'shared')
    .option('--nvm <Y/n>', 'Use NVM', 'y')
    .option('--rootpath <path>', 'Relative path to the repository root folder', '..')
    .parse(process.argv)
    .opts()

  const hasRequiredOptions = options.name && options.apiName && options.sharedName && options.nvm && options.rootpath
  if (!hasRequiredOptions) {
    await install(await interactiveMode())
  } else {
    await install(options)
  }
}
