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

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const c = require('./config');
const {logger} = require('./logger');

/**
 * Update the project and user npmrc files.
 *
 * @param {string} fromConfigPath Path to the npmrc file to read scope registry configs from, should be the project npmrc file.
 * @param {string} toConfigPath Path to npmrc file to write authentication configs to, should be the user npmrc file.
 * @param {string} creds Encrypted credentials.
 * @return {!Promise<undefined>}
 */
async function updateConfigFiles(fromConfigPath, toConfigPath, creds) {
  fromConfigPath = path.resolve(fromConfigPath);
  toConfigPath = path.resolve(toConfigPath);
  // Backward-compatible scenario. Update auth configs in project npmrc directly.
  if (fromConfigPath == toConfigPath) {
    updateConfigFile(fromConfigPath, creds);
    return;
  }

  const fromConfigs = [];
  const toConfigs = [];
  const registryAuthConfigs = new Map();

  // We do not use basic auth any more in `gcloud artifacts print-settings`; replace them.
  let fromConfigLines = await fs.promises.readFile(fromConfigPath, "utf8")
  const legacyRegex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/):_password=.*(\n\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:username=oauth2accesstoken)/g;
  fromConfigLines = fromConfigLines.replace(legacyRegex, `$1:_authToken=${creds}`)

  // Read configs from project npmrc file. For each:
  // - registry config, create an auth token config in the user npmrc file (expect an auth token or password config already exists)
  // - auth token config, print a warning and remove it.
  // - password config, print a warning and move it to the user npmrc file.
  // - everything else, keep it in the project npmrc file.
  for (const line of fromConfigLines.split('\n')) {
    let config = c.parseConfig(line.trim());
    switch (config.type) {
      case c.configType.Registry:
        fromConfigs.push(config);
        registryAuthConfigs.set(config.registry, {
          type: c.configType.AuthToken,
          registry: config.registry,
          token: creds,
          toString: function() {
            return `${this.registry}:_authToken=${this.token}`;
          }
        });
        break;
      case c.configType.AuthToken:
        logger.debug(`Found an auth token for the registry ${config.registry} in the project npmrc file. Moving it to the user npmrc file...`);
        break;
      case c.configType.Password:
        logger.debug(`Found password for the registry ${config.registry} in the project npmrc file. Moving it to the user npmrc file...`);
        registryAuthConfigs.set(config.registry, config);
        break;
      default:
        fromConfigs.push(config);
    }
  }

  if (fs.existsSync(toConfigPath)) {
    const toConfigLines = await fs.promises.readFile(toConfigPath, "utf8")

    // refresh tokens for all auth token configs; keep everything else unchanged.
    for (const line of toConfigLines.split('\n')) {
      if (line == "") {
        continue;
      }
      let config = c.parseConfig(line.trim());
      if (config.type == c.configType.AuthToken || config.type == c.configType.Password) {
        registryAuthConfigs.delete(config.registry);
      }
      // refresh the token.
      if (config.type == c.configType.AuthToken) {
        config.token = creds;
      }
      toConfigs.push(config);
    }
  }

  // Registries that we need to move password configs from the project npmrc file
  // or write a new auth token config.
  toConfigs.push(...registryAuthConfigs.values());

  // Write to the user npmrc file first so that if it failed the project npmrc file
  // would still be untouched.
  await fs.promises.writeFile(toConfigPath, toConfigs.join(`\n`));
  await fs.promises.writeFile(fromConfigPath, fromConfigs.join(`\n`));
}

/**
 * Update an npmrc file with credentials.
 *
 * @deprecated
 * @param {string} configPath Path to npmrc file.
 * @param {string} creds Encrypted credentials.
 * @return {!Promise<undefined>}
 */
async function updateConfigFile(configPath, creds) {
  
  contents = await fs.promises.readFile(configPath, 'utf8')

  const regex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:_authToken=).*/g;
  const legacyRegex =
      /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:_password=).*(\n\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/:username=oauth2accesstoken)/g;
  let newContents;
  // If config is basic auth, encrypt the token.
  if (contents.match(legacyRegex)) {
    encrypted_creds = Buffer.from(creds).toString('base64');
    newContents = contents.replace(legacyRegex, `$1"${encrypted_creds}"$2`);
    contents = newContents;
  }
  else if (!contents.match(regex)) {
    throw new Error(
        'Artifact Registry config not found in ' + configPath +
        '\nRun `gcloud beta artifacts print-settings npm`.');
  }
  newContents = contents.replace(regex, `$1"${creds}"`);
  const tempConfigPath = configPath.replace('.npmrc', '.npmrc-temp');
  await fs.promises.writeFile(configPath, newContents);
}

module.exports = {
  updateConfigFiles,
  updateConfigFile
};
