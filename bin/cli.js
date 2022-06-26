#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
const { unlinkSync, existsSync } = require('fs')
const { join } = require('path')
const { replaceInFileSync } = require('replace-in-file')

let inquirer
import('inquirer').then((module) => {
  inquirer = module.default
  main()
})

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.warn(`Failed to execute ${command}`, e)
    return false
  }
}

const isYes = (v) => v === true || v.toLowerCase() === 'y'

function main() {
  const interactiveMode = () => {
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
        install(answers)
      })
      .catch((error) => {
        if (error.isTtyError) {
          // Prompt couldn't be rendered in the current environment
        } else {
          // Something else went wrong
        }
      })
  }

  const install = (params) => {
    const { nvm, husky, name } = params

    let directory = process.cwd()

    const version = '0.0.1'

    const commands = [
      [
        `Cloning the repository with name ${name}`,
        () => true,
        () => {
          const cmd = `git clone --depth 1 git@github.com:saeidjoker/nx-ddd-template.git ${name}`
          if (!runCommand(cmd)) {
            process.exit(-1)
          }
          // cd into directory
          directory = join(directory, name)
          return true
        },
      ],
      ['Remove package-lock', () => true, () => runCommand(`cd ${name} && rm package-lock.json`)],
      [
        'Replacing repository name',
        () => true,
        () => {
          const result = replaceInFileSync({
            files: [
              join(directory, 'nx.json'),
              join(directory, 'README.md'),
              join(directory, 'tsconfig.base.json'),
              join(directory, 'packages/shared/package.json'),
            ],
            from: 'e-commerce',
            to: name,
          })
          const result2 = replaceInFileSync({
            files: join(directory, 'package.json'),
            from: '@saeidjoker/nx-ddd-template',
            to: name,
          })
          console.log(`Updated ${result.length + result2.length} files with repository name`)
          return true
        },
      ],
      [
        `Reset version to ${version} in package.json`,
        () => true,
        () =>
          replaceInFileSync({
            files: join(directory, 'package.json'),
            from: /"version"\s*:\s*"\d+.\d+.\d+",/g,
            to: `"version": "${version}",`,
          }).length > 0,
      ],
      [`Installing dependencies for ${name}`, () => true, () => runCommand(`cd ${name} && npm install`)],
      [
        'Removing husky',
        () => !isYes(husky),
        () => {
          return (
            runCommand(`cd ${name} && npm set-script prepare ""`) &&
            runCommand(`cd ${name} && npm set-script postinstall ""`) &&
            runCommand(`cd ${name} && npm uninstall husky && rm -rf .husky`)
          )
        },
      ],
      ['Removing nvm', () => !isYes(nvm), () => runCommand(`cd ${name} && rm .nvmrc`)],
    ]

    for (let i = 0; i < commands.length; i++) {
      const [cmdDescription, canExecute, execute] = commands[i]
      if (canExecute()) {
        console.log(`${cmdDescription}...`)
        if (execute()) {
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
    interactiveMode()
  } else {
    install(options)
  }
}
