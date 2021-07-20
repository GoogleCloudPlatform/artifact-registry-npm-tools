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
const util = require('util');
const exec = util.promisify(require('child_process').exec);

/**
 * Automatically choose the right client credentials based on the environment.
 *
 * @return {!Promise<string>} cred Encrypted access token.
 */
async function getCreds() {
  try {
    console.log(`Retrieving application default credentials...`)
    const creds = await getApplicationDefaultCredentials();
    console.log(`Retrieved application default credentials.`)
    return creds;
  } catch (err) {
    console.log(`Failed to retrieve application default credentials: ${err.message}.`);
  }
  try {
    console.log(`Retrieving credentials from gcloud...`)
    const creds = await getGcloudCredentials();
    console.log(`Retrieved credentials from the current active account from gcloud.`)
    return creds;
  } catch (err) {
    console.log(`Failed to retrieve credentials from gcloud: ${err.message}.`)
  }
  throw new Error(
      'Fail to get credentials. Please run: \n' +
      '`gcloud auth application-default login` or \n' +
      '`export GOOGLE_APPLICATION_CREDENTIALS=<path/to/service/account/key>`');
}

/**
 * Retrieves the application default credentials.
 *
 * @return {!Promise<string>} cred Encrypted access token.
 */
async function getApplicationDefaultCredentials() {
  const auth = new GoogleAuth({
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
    projectId: 'unused-project'
  });
  const client = await auth.getClient();
  const creds = (await client.getAccessToken()).token;
  const tokenScopes = (await client.getTokenInfo(creds)).scopes;
  if (!tokenScopes.includes(
          'https://www.googleapis.com/auth/cloud-platform')) {
    throw new Error(
        'Token has insufficient authentication scopes.\n' +
        'Please configure access scope following instructions on ' +
        'https://cloud.google.com/artifact-registry/docs/access-control#compute');
  }
  return creds; 
}

/**
 * Retrieves the credentials from the current active account from gcloud.
 *
 * @return {!Promise<string>} cred Encrypted access token.
 */
async function getGcloudCredentials() {
  const isWindows = process.platform === 'win32';
  let gcloud = isWindows? "gcloud.cmd" : "gcloud";
  const {stdout, stderr} = await exec(`${gcloud} auth print-access-token`);
  // the token from gcloud auth print-access-token has a newline in the end
  return stdout.trim();
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

      const regex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:_authToken=).*/g;
      const legacy_regex =
          /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:_password=).*(\n\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:username=oauth2accesstoken)/g;
      let newContents;
      // If config is basic auth, encrypt the token.
      if (contents.match(legacy_regex)) {
        encrypted_creds = Buffer.from(creds).toString('base64');
        newContents = contents.replace(legacy_regex, `$1"${encrypted_creds}"$2`);
        contents = newContents;
      }
      else if (!contents.match(regex)) {
        reject(new Error(
            'Artifact Registry config not found in ' + configPath +
            '\nPlease run `gcloud beta artifacts print-settings npm`.'));
        return;
      }

      newContents = contents.replace(regex, `$1"${creds}"`);

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
