#!/usr/bin/env node
const { execSync } = require('child_process')

const runCommand = (command) => {
  try {
    execSync(command, { stdio: 'inherit' })
    return true
  } catch (error) {
    console.log(`Failed to execute ${command}`, e)
    return false
  }
}

const repositoryName = process.argv[2]
const gitCheckoutCommand = `git clone --depth 1 git@github.com:saeidjoker/nx-ddd-template.git ${repositoryName}`
const installDepsCommand = `cd ${repositoryName} && npm i`

console.log(`Cloning the repository with name ${repositoryName}`)
const checkedOut = runCommand(gitCheckoutCommand)
if (!checkedOut) process.exit(-1)

console.log(`Installing dependencies for ${repositoryName}`)
const installedDeps = runCommand(installDepsCommand)
if (!installedDeps) process.exit(-1)

console.log("Congratulations! You're API app and Shared library are ready.")
console.log('Follow the following commands to start')
console.log(`cd ${repositoryName} && npm serve api`)
