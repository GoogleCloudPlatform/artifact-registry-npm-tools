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

const auth = require('./auth');

/**
 * Get credentials and update .npmrc file.
 *
 * Usage:
 * - Add to scripts in package.json:
 * "scripts": {
 *   "buildartifacts-auth": "google-buildartifacts-auth [path/to/.npmrc]",
 *    ...
 * },
 * - Or run directly $ ./src/main.js [path/to/.npmrc]
 *
 * @return {!Promise}
 */
async function main() {
  try {
    const allArgs = process.argv;
    if (allArgs.length > 3) {
      throw new Error(
          'Incorrect number of arguments. User can only specify the path to npmrc file.');
    }
    let configPath = __dirname + '/.npmrc';
    if (allArgs.length == 3) {
      configPath = allArgs[2];
    }

    const creds = await auth.getCreds();
    await auth.updateConfigFile(configPath, creds);
    console.log('Credentials updated in ' + configPath);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
