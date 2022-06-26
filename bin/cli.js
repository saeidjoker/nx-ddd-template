#!/usr/bin/env node
const { execSync } = require('child_process')
const { program } = require('commander')
const replaceInFile = require('replace-in-file')

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
    console.log(`Failed to execute ${command}`, e)
    return false
  }
}

const isYes = (v) => (typeof v === 'string' && v.toString().toLowerCase() === 'y') || (typeof v === 'boolean' && v)

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

  // const repositoryName = process.argv[2]
  // const gitCheckoutCommand = `git clone --depth 1 git@github.com:saeidjoker/nx-ddd-template.git ${repositoryName}`
  // const installDepsCommand = `cd ${repositoryName} && npm i`

  // console.log(`Cloning the repository with name ${repositoryName}`)
  // const checkedOut = runCommand(gitCheckoutCommand)
  // if (!checkedOut) process.exit(-1)

  // console.log(`Installing dependencies for ${repositoryName}`)
  // const installedDeps = runCommand(installDepsCommand)
  // if (!installedDeps) process.exit(-1)

  // console.log("Congratulations! You're API app and Shared library are ready.")
  // console.log('Follow the following commands to start')
  // console.log(`cd ${repositoryName} && nx serve api`)
}
