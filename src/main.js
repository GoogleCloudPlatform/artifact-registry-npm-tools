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
const update = require('./update');

/**
 * Get credentials and update .npmrc file.
 *
 * Usage:
 * - Add to scripts in package.json:
 * "scripts": {
 *   "artifactregistry-auth": "google-artifactregistry-auth --project-config=[path/to/.npmrc] --user-config=[path/to/.npmrc]",
 *    ...
 * },
 * - Or run directly $ ./src/main.js [path/to/.npmrc]
 *
 * @return {!Promise<undefined>}
 */
async function main() {
  try {
    const allArgs = yargs(hideBin(process.argv))
      .command('$0 [config]', 'Refresh the tokens for .npmrc config file', (yargs) => {
        yargs.positional('config', {
          type: 'string',
          describe: '(Deprecated) Path to the .npmrc file to update auth tokens'
        })
      })
      .option('project-config', {
        type: 'string',
        describe: 'Path to the project .npmrc file to read registry configs from',
        default: '.npmrc'
      })
      .option('user-config', {
        type: 'string',
        describe: 'Path to the user .npmrc file to write auth tokens to',
        default: `${os.homedir()}/.npmrc`
      })
      .help()
      .argv;

    const configPath = allArgs.config;
    const creds = await auth.getCreds();
    if (configPath) {
      console.warn('Updating project .npmrc inline is deprecated and may no longer be supported\n'
          + 'in future versions. Please run the plugin with `--project-config` and `--user-config`.');
      await update.updateConfigFile(configPath, creds);
    } else {
      await update.updateConfigFiles(allArgs.projectConfig, allArgs.userConfig, creds);
    }    
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
