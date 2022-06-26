#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
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
    console.log(params)
    const { nvm, husky, name } = params

    const commands = [
      [
        `Cloning the repository with name ${name}`,
        () => false,
        () => {
          const cmd = `git clone --depth 1 git@github.com:saeidjoker/nx-ddd-template.git ${name}`
          if (!runCommand(cmd)) {
            process.exit(-1)
          }
        },
      ],
      [
        `Installing dependencies for ${name}`,
        () => false,
        () => {
          const cmd = `cd ${name} && rm package-lock.json && npm install`
          if (runCommand(cmd)) {
          }
        },
      ],
      [
        'Replacing repository name',
        () => true,
        () => {
          const result = replaceInFileSync({
            files: ['nx.json', 'README.md', 'tsconfig.base.json', 'packages/shared/package.json'],
            from: 'e-commerce',
            to: name,
          })
          const result2 = replaceInFileSync({
            files: 'package.json',
            from: '@saeidjoker/nx-ddd-template',
            to: name,
          })
          console.log(`Updated ${result.length + result2.length} files with repository name`)
        },
      ],
      [
        'Reset version',
        () => true,
        () => {
          const version = '0.0.1'
          const result = replaceInFileSync({
            files: 'package.json',
            from: /"version"\s*:\s*"\d+.\d+.\d+",/g,
            to: version,
          })
          if (result.length > 0) {
            console.log(`Reset version to ${version} in package.json`)
          }
        },
      ],
      [
        'Removing husky',
        () => !husky,
        () => {
          const cmd =
            'npm set-script prepare "" && npm set-script postinstall "" && npm uninstall husky && rm -rf .husky'
          runCommand(cmd)
        },
      ],
      [
        'Removing nvm',
        () => !nvm,
        () => {
          runCommand('rm .nvmrc')
        },
      ],
    ]

    for (let i = 0; i < commands.length; i++) {
      const [cmdDescription, canExecute, execute] = commands[i]
      if (canExecute()) {
        console.log(cmdDescription)
        execute()
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

  const hasAllOptions = options.name && options.nvm && options.husky
  if (!hasAllOptions) {
    interactiveMode()
  } else {
    install(options)
  }
}
