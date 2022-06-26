#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
const { readFileSync, writeFileSync, unlinkSync, existsSync, createWriteStream } = require('fs')
const { join } = require('path')
const { replaceInFileSync } = require('replace-in-file')
const extract = require('extract-zip')
const { promisify } = require('util')
const { pipeline } = require('stream')
const { randomUUID } = require('crypto')

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

async function main() {
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
            name: 'husky',
            message: 'Use husky?',
            default: true,
          },
        ])
        .then((answers) => {
          answers.nvm = answers.nvm ? 'y' : 'n'
          answers.husky = answers.husky ? 'y' : 'n'
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
    const { nvm, husky, name } = params

    let workingDir = process.cwd()

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

          const file = join(workingDir, `${randomUUID()}.zip`)
          const url = 'https://github.com/saeidjoker/nx-ddd-template/archive/refs/heads/main.zip'
          await download(url, file)

          await unzip(file, workingDir)
          unlinkSync(file)

          // cd into directory
          workingDir = join(workingDir, name)

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
        'Removing husky',
        () => !isYes(husky),
        async () => {
          const filePath = join(workingDir, 'package.json')
          const json = JSON.parse(readFileSync(filePath))
          delete json.scripts.prepare
          delete json.scripts.postinstall
          delete json.devDependencies.husky
          writeFileSync(filePath, JSON.stringify(json, null, 2))

          return runCommand(`cd ${name} && rm -rf .husky`)
        },
      ],
      ['Removing nvm', () => !isYes(nvm), async () => runCommand(`cd ${name} && rm .nvmrc`)],
      [`Installing dependencies for ${name}`, () => true, async () => runCommand(`cd ${name} && npm install`)],
    ]

    for (let i = 0; i < 1; i++) {
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

  const options = program
    .option('--name <name>', 'Repository name')
    .option('--nvm <Y/n>', 'Use NVM', 'y')
    .option('--husky <Y/n>', 'Use husky', 'y')
    .parse(process.argv)
    .opts()

  const hasRequiredOptions = options.name && options.nvm && options.husky
  if (!hasRequiredOptions) {
    await install(await interactiveMode())
  } else {
    await install(options)
  }
}
