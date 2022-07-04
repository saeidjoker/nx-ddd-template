#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
const {
  readFileSync,
  writeFileSync,
  unlinkSync,
  existsSync,
  createWriteStream,
  renameSync,
  copyFileSync,
} = require('fs')
const { join, resolve } = require('path')
const { replaceInFileSync } = require('replace-in-file')
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
    console.warn(`Failed to execute ${command}`, e)
    return false
  }
}

function isYes(v) {
  return v === true || v.toLowerCase() === 'y'
}

async function download(url, filePath) {
  if (existsSync(filePath)) unlinkSync(filePath)

  const streamPipeline = promisify(pipeline)
  const response = await fetch(url)
  if (!response.ok) throw new Error(`unexpected response ${response.statusText}`)
  await streamPipeline(response.body, createWriteStream(filePath))
}

async function unzip(file, dir) {
  await extract(file, { dir })
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
          type: 'confirm',
          name: 'nvm',
          message: 'Use NVM?',
          default: true,
        },
        {
          type: 'confirm',
          name: 'lefthook',
          message: 'Use lefthook?',
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
        answers.lefthook = answers.lefthook ? 'y' : 'n'
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
  const { nvm, lefthook, name, rootpath } = params

  let workingDir = process.cwd()
  let rootDir = null

  const commands = [
    [
      `Downloading repository with name ${name}`,
      () => true,
      async () => {
        if (existsSync(join(workingDir, name))) {
          console.log(`Directory ${name} already exists! Please remove it first to continue`)
          process.exit(-1)
          return false
        }

        // download zip file
        const file = join(workingDir, `${uuidv4()}.zip`)
        const url = 'https://github.com/saeidjoker/nx-ddd-template/archive/refs/heads/main.zip'
        await download(url, file)

        // unzip and delete the zip file
        await unzip(file, workingDir)
        unlinkSync(file)

        // rename the folder which was inside the zip file
        renameSync('nx-ddd-template-main', name)

        // cd into directory and resolve rootDir
        workingDir = join(workingDir, name)
        rootDir = resolve(rootpath, workingDir)

        return true
      },
    ],
    ['Remove package-lock', () => true, () => runCommand(`cd ${name} && rm package-lock.json`)],
    [
      'Replacing repository name',
      () => true,
      async () =>
        replaceInFileSync({
          files: [
            join(workingDir, 'nx.json'),
            join(workingDir, 'README.md'),
            join(workingDir, 'tsconfig.base.json'),
            join(workingDir, 'packages/shared/package.json'),
          ],
          from: 'e-commerce',
          to: name,
        }).length > 0,
    ],
    [
      `Update package.json`,
      () => true,
      async () => {
        const filePath = join(workingDir, 'package.json')
        const json = JSON.parse(readFileSync(filePath))
        json.name = name
        json.version = '0.0.1'
        writeFileSync(filePath, JSON.stringify(json, null, 2))
        return true
      },
    ],
    [
      'Installing lefthook',
      () => isYes(lefthook),
      async () => {
        console.log(`Repository located at ${rootDir}. Will add lefthook.yaml there.`)
        var sampleLeftHookFilePath = join(workingDir, 'lefthook.yaml.sample')
        replaceInFileSync({
          files: [sampleLeftHookFilePath],
          from: 'e-commerce',
          to: name,
        })
        copyFileSync(sampleLeftHookFilePath, join(rootDir, 'lefthook.yml'))
        unlinkSync(sampleLeftHookFilePath)
        return runCommand(`cd ${rootDir} && npx lefthook run pre-commit`)
      },
    ],
    ['Removing nvm', () => !isYes(nvm), async () => runCommand(`cd ${name} && rm .nvmrc`)],
    [`Installing dependencies for ${name}`, () => true, async () => runCommand(`cd ${name} && npm install`)],
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
  console.log(`cd ${name} && nx serve api`)
}

async function main() {
  const options = program
    .option('--name <name>', 'Repository name')
    .option('--nvm <Y/n>', 'Use NVM', 'y')
    .option('--lefthook <Y/n>', 'Use lefthook', 'y')
    .option('--rootpath <path>', 'Relative path to the repository root folder', '..')
    .parse(process.argv)
    .opts()

  const hasRequiredOptions = options.name && options.nvm && options.lefthook && option.rootpath
  if (!hasRequiredOptions) {
    await install(await interactiveMode())
  } else {
    await install(options)
  }
}
