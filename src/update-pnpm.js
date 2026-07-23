// Copyright 2026 Google LLC
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
const yaml = require('js-yaml');
const {logger} = require('./logger');

/**
 * Find the nearest pnpm workspace configuration file.
 *
 * @param {string} startDir Directory to begin searching from.
 * @return {!Promise<?string>} Absolute path to pnpm-workspace.yaml, or null
 *     when the current directory is not in a pnpm workspace.
 */
async function findPnpmWorkspaceConfig(startDir = process.cwd()) {
  let currentDir = path.resolve(startDir);

  while (true) {
    const configPath = path.join(currentDir, 'pnpm-workspace.yaml');
    try {
      await fs.promises.stat(configPath);
      return configPath;
    } catch (e) {
      const parentDir = path.dirname(currentDir);
      if (parentDir === currentDir) {
        return null;
      }
      currentDir = parentDir;
    }
  }
}

/**
 * Convert a registry URL into an npmrc authentication key.
 *
 * @param {string} registry Registry URL.
 * @param {boolean} allowAllDomains Set if all domains are allowed.
 * @return {?string} npmrc registry key, or null when the registry is invalid
 *     or is not an Artifact Registry domain.
 */
function getRegistryAuthKey(registry, allowAllDomains) {
  if (typeof registry !== 'string') {
    return null;
  }

  try {
    const registryUrl = new URL(registry);
    if (registryUrl.protocol !== 'https:') {
      return null;
    }
    if (!allowAllDomains && !registryUrl.hostname.endsWith('-npm.pkg.dev')) {
      return null;
    }

    const pathname = registryUrl.pathname.endsWith('/')
      ? registryUrl.pathname
      : `${registryUrl.pathname}/`;
    return `//${registryUrl.host}${pathname}`;
  } catch (e) {
    return null;
  }
}

/**
 * Update the user npmrc with credentials for registries configured in a pnpm
 * workspace.
 *
 * @param {string} fromConfigPath Path to pnpm-workspace.yaml.
 * @param {string} toConfigPath Path to the npmrc file to write credentials to.
 * @param {string} creds Encrypted credentials.
 * @param {boolean} allowAllDomains Set if all domains are allowed.
 * @return {!Promise<undefined>}
 */
async function updatePnpmConfigFiles(fromConfigPath, toConfigPath, creds, allowAllDomains) {
  fromConfigPath = path.resolve(fromConfigPath);
  toConfigPath = path.resolve(toConfigPath);

  const fromDoc = yaml.load(await fs.promises.readFile(fromConfigPath, 'utf8')) || {};
  const registries = fromDoc.registries || {};
  const registryAuthConfigs = new Map();

  for (const registryName in registries) {
    const registry = registries[registryName];
    const registryAuthKey = getRegistryAuthKey(registry, allowAllDomains);
    if (registryAuthKey) {
      logger.debug(`Found registry ${registry} in ${fromConfigPath}`);
      registryAuthConfigs.set(registryAuthKey, `${registryAuthKey}:_authToken=${creds}`);
    }
  }

  if (registryAuthConfigs.size === 0) {
    return;
  }

  const toConfigLines = fs.existsSync(toConfigPath)
    ? (await fs.promises.readFile(toConfigPath, 'utf8')).split('\n')
    : [];
  const updatedConfigLines = [];
  const registryAuthKeys = new Set(registryAuthConfigs.keys());

  for (const line of toConfigLines) {
    const authTokenIndex = line.indexOf(':_authToken=');
    const passwordIndex = line.indexOf(':_password=');
    const configIndex = authTokenIndex >= 0 ? authTokenIndex : passwordIndex;
    const registryAuthKey = configIndex >= 0 ? line.slice(0, configIndex) : null;

    if (authTokenIndex >= 0 && registryAuthKeys.has(registryAuthKey)) {
      updatedConfigLines.push(`${registryAuthKey}:_authToken=${creds}`);
      registryAuthConfigs.delete(registryAuthKey);
    } else {
      updatedConfigLines.push(line);
      if (passwordIndex >= 0) {
        registryAuthConfigs.delete(registryAuthKey);
      }
    }
  }

  updatedConfigLines.push(...registryAuthConfigs.values());
  await fs.promises.writeFile(toConfigPath, updatedConfigLines.filter(Boolean).join('\n'));
}

module.exports = {
  findPnpmWorkspaceConfig,
  updatePnpmConfigFiles,
};
