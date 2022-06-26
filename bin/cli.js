#!/usr/bin/env node
const { execSync } = require('child_process')

const runCommand = command => {
  try {
    execSync(command, {stdio: 'inherit'})
  } catch (error) {
    
  }
}

const repositoryName = process.argv[2]
const gitCheckoutCommand = `git clone --depth 1 git@github.com:saeidjoker/nx-ddd-template.git ${repositoryName}`
const installDepsCommand = `cd ${repositoryName} && npm i`

console.log(`Cloning the repository with name ${repositoryName}`)
const checkedOut = 