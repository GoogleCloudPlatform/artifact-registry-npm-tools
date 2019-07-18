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


const {auth} = require('google-auth-library');
const fs = require('fs');

/**
 * Automatically choose the right client credentials based on the environment.
 * Update an npmrc file with credentials.
 *
 * Usage:
 * - Add to scripts in package.json:
 * "scripts": {
 *   "run": "build-artifacts-login [path/to/.npmrc]",
 *    ...
 * },
 * - Or run directly $ ./build-artifacts-login.js [path/to/.npmrc]
 *
 * @return {!Promise}
 */
async function main() {
  const allArgs = process.argv;
  if (allArgs.length > 3) {
    return console.log(
        'Incorrect number of arguments. User can only specify the path to npmrc file.');
  }
  let configPath = __dirname + '/.npmrc';
  if (allArgs.length == 3) {
    configPath = allArgs[2];
  }

  let client;
  try {
    client = await auth.getClient(
        {scopes: 'https://www.googleapis.com/auth/cloud-platform'});
  } catch (err) {
    return console.log(
        'Fail to get credentials. Please run `gcloud auth application-default login`');
  }

  let creds;
  try {
    const headers = await client.getRequestHeaders();
    creds = headers['Authorization'].split(' ')[1];
  } catch (err) {
    return console.log('Corrupted credentials.');
  }
  creds = Buffer.from(creds).toString('base64');
  fs.readFile(configPath, 'utf8', (err, contents) => {
    if (err) {
      return console.log(err);
    }
    const newContents = contents.replace(
        /^(\/\/npm[.]pkg[.]dev\/.*\/:_password=).*$/g,
        `$1"${creds}"`);
    fs.writeFile(configPath, newContents, err => {
      if (err) {
        return console.log(err);
      }

      console.log('Credentials updated!');
    });
  });
}

main().catch(console.error);
