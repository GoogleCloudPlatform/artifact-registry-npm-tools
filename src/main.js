#!/usr/bin/env node

// Copyright 2019 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

const os = require('os');
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')
const auth = require('./auth');
const { logger } = require('./logger');
const update = require('./update');

/**
 * Get credentials and update .npmrc file.
 *
 * Usage:
 * - Add to scripts in package.json:
 * "scripts": {
 *   "artifactregistry-auth": "google-artifactregistry-auth --repo-config=[./.npmrc] --credential-config=[~/.npmrc]",
 *    ...
 * },
 * - Or run directly $ ./src/main.js --repo-config=[./.npmrc] --credential-config=[~/.npmrc]
 *
 * @return {!Promise<undefined>}
 */
async function main() {
  try {
    const allArgs = yargs(hideBin(process.argv))
      .command('$0 [config]', 'Refresh the tokens for .npmrc config file', (yargs) => {
        yargs.positional('config', {
          type: 'string',
          describe: '(Deprecated) Path to the .npmrc file to update auth tokens',
        })
      })
      .option('repo-config', {
        type: 'string',
        describe: 'Path to the .npmrc file to read registry configs from, usually the project-level npmrc file',
        default: '.npmrc',
      })
      .option('credential-config', {
        type: 'string',
        describe: 'Path to the .npmrc file to write credentials to, usually the user-level npmrc file',
        default: `${os.homedir()}/.npmrc`,
      })
      .option('verbose', {
        type: 'boolean',
        describe: 'Set log level to verbose',
        default: false,
      })
      .help()
      .argv;

    logger.logVerbose = allArgs.verbose;
    const configPath = allArgs.config;
    const creds = await auth.getCreds();
    if (configPath) {
      console.warn('Updating project .npmrc inline is deprecated and may no longer be supported\n'
          + 'in future versions. Run the plugin with `--repo-config` and `--credential-config`.');
      await update.updateConfigFile(configPath, creds);
    } else {
      await update.updateConfigFiles(allArgs.repoConfig, allArgs.credentialConfig, creds);
    }
    console.log("Success!");
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
