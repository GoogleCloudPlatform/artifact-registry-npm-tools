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


const {GoogleAuth} = require('google-auth-library');
const fs = require('fs');

/**
 * Automatically choose the right client credentials based on the environment.
 *
 * @return {!Promise<string>} cred Encrypted access token.
 */
async function getCreds() {
  let client;
  try {
    const auth = new GoogleAuth({
      scopes: 'https://www.googleapis.com/auth/cloud-platform',
      projectId: 'unused-project'
    });
    client = await auth.getClient();
  } catch (err) {
    throw new Error(
        'Fail to get credentials. Please run: \n' +
        '`gcloud auth application-default login` or \n' +
        '`export GOOGLE_APPLICATION_CREDENTIALS=<path/to/service/account/key>`');
  }

  let creds;
  try {
    creds = (await client.getAccessToken()).token;
  } catch (err) {
    throw new Error(
        'Fail to get credentials. Please run: \n' +
        '`gcloud auth application-default login` or \n' +
        '`export GOOGLE_APPLICATION_CREDENTIALS=<path/to/service/account/key>`');
  } finally {
    const tokenScopes = (await client.getTokenInfo(creds)).scopes;
    if (!tokenScopes.includes(
            'https://www.googleapis.com/auth/cloud-platform')) {
      throw new Error(
          'Token has insufficient authentication scopes.\n' +
          'Please configure access scope following instructions on ' +
          'https://cloud.google.com/artifact-registry/docs/access-control#compute');
    }
  }
  return Buffer.from(creds).toString('base64');
}

/**
 * Update an npmrc file with credentials.
 *
 * @param {string} configPath Path to npmrc file.
 * @param {string} creds Encrypted credentials.
 * @return {!Promise<undefined>}
 */
async function updateConfigFile(configPath, creds) {
  return new Promise((resolve, reject) => {
    fs.readFile(configPath, 'utf8', (err, contents) => {
      if (err) {
        reject(err);
        return;
      }

      const regex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:_password=).*/g;
      if (!contents.match(regex)) {
        reject(new Error(
            'Artifact Registry config not found in ' + configPath +
            '\nPlease run `gcloud beta artifacts print-settings npm`.'));
        return;
      }

      const newContents = contents.replace(regex, `$1"${creds}"`);

      const tempConfigPath = configPath.replace('.npmrc', '.npmrc-temp');
      fs.writeFile(tempConfigPath, newContents, err => {
        if (err) {
          reject(err);
          return;
        }
        fs.rename(tempConfigPath, configPath, err => {
          if (err) {
            reject(err);
            return;
          }
          resolve();
        });
      });
    });
  });
}

module.exports = {
  updateConfigFile,
  getCreds
};
