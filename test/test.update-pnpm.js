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

const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const yaml = require('js-yaml');
const {
  findPnpmWorkspaceConfig,
  updatePnpmConfigFiles,
} = require('../src/update-pnpm');

const testDir = path.join(os.tmpdir(), 'artifactregistry-update-pnpm');
const fromConfigPath = path.join(testDir, 'pnpm-workspace.yaml');
const toConfigPath = path.join(testDir, 'user.npmrc');

describe('updatePnpmConfigFiles', () => {
  beforeEach(() => {
    fs.mkdirSync(testDir, {recursive: true});
  });

  afterEach(() => {
    fs.rmSync(testDir, {recursive: true, force: true});
  });

  it('should update npmrc with auth tokens for workspace registries', async () => {
    fs.writeFileSync(fromConfigPath, yaml.dump({
      registries: {
        default: 'https://region-npm.pkg.dev/project/default-repo/',
        '@workspace': 'https://region-npm.pkg.dev/project/scoped-repo/',
      },
    }));
    fs.writeFileSync(toConfigPath,
        `color=true
//region-npm.pkg.dev/project/default-repo/:_authToken=old-token`);

    await updatePnpmConfigFiles(fromConfigPath, toConfigPath, 'my-secret-token', false);

    assert.equal(fs.readFileSync(toConfigPath, 'utf8'),
        `color=true
//region-npm.pkg.dev/project/default-repo/:_authToken=my-secret-token
//region-npm.pkg.dev/project/scoped-repo/:_authToken=my-secret-token`);
  });

  it('should find a pnpm workspace config without a packages setting', async () => {
    const packageDir = path.join(testDir, 'nested', 'directory');
    fs.mkdirSync(packageDir, {recursive: true});
    fs.writeFileSync(fromConfigPath, yaml.dump({
      registries: {
        '@workspace': 'https://region-npm.pkg.dev/project/repo/',
      },
    }));

    const result = await findPnpmWorkspaceConfig(packageDir);

    assert.equal(result, fromConfigPath);
  });
});
