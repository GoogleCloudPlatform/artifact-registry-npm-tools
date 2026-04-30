// Copyright 2025 Google LLC
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
const path = require('path');
const {updateYarnConfigFiles} = require('../src/update-yarn');
const yaml = require('js-yaml');

const testDir = path.join(__dirname, '.');
const fromConfigPath = path.join(testDir, '.yarnrc.yml');
const toConfigPath = path.join(testDir, 'user.yarnrc.yml');

describe('updateYarnConfigFiles', () => {
  afterEach(() => {
    if (fs.existsSync(fromConfigPath)) {
      fs.unlinkSync(fromConfigPath);
    }
    if (fs.existsSync(toConfigPath)) {
      fs.unlinkSync(toConfigPath);
    }
  });

  it('should update yarnrc.yml with auth token', async () => {
    const fromContent = {
      npmScopes: {
        workspace: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
        },
      },
    };
    fs.writeFileSync(fromConfigPath, yaml.dump(fromContent));

    await updateYarnConfigFiles(fromConfigPath, toConfigPath, 'my-secret-token');

    const toContent = yaml.load(fs.readFileSync(toConfigPath, 'utf8'));
    assert.deepStrictEqual(toContent, {
      npmScopes: {
        workspace: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
          npmAlwaysAuth: true,
          npmAuthToken: 'my-secret-token',
        },
      },
    });
  });

  it('should not update token for non-AR registry by default', async () => {
    const fromContent = {
      npmScopes: {
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
        },
        other: {
          npmRegistryServer: 'https://registry.npmjs.org',
        },
      },
    };
    fs.writeFileSync(fromConfigPath, yaml.dump(fromContent));

    await updateYarnConfigFiles(fromConfigPath, toConfigPath, 'my-secret-token', false);

    const toContent = yaml.load(fs.readFileSync(toConfigPath, 'utf8'));
    assert.deepStrictEqual(toContent, {
      npmScopes: {
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
          npmAlwaysAuth: true,
          npmAuthToken: 'my-secret-token',
        },
      },
    });
  });

  it('should update token for all registries when allowAllDomains is true', async () => {
    const fromContent = {
      npmScopes: {
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
        },
        other: {
          npmRegistryServer: 'https://registry.npmjs.org',
        },
      },
    };
    fs.writeFileSync(fromConfigPath, yaml.dump(fromContent));

    await updateYarnConfigFiles(fromConfigPath, toConfigPath, 'my-secret-token', true);

    const toContent = yaml.load(fs.readFileSync(toConfigPath, 'utf8'));
    assert.deepStrictEqual(toContent, {
      npmScopes: {
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
          npmAlwaysAuth: true,
          npmAuthToken: 'my-secret-token',
        },
        other: {
          npmRegistryServer: 'https://registry.npmjs.org',
          npmAlwaysAuth: true,
          npmAuthToken: 'my-secret-token',
        },
      },
    });
  });

  it('should preserve existing non-AR scopes in toConfig', async () => {
    const fromContent = {
      npmScopes: {
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
        },
      },
    };
    const toExistingContent = {
      npmScopes: {
        other: {
          npmRegistryServer: 'https://registry.npmjs.org',
          npmAuthToken: 'other-token',
        },
      },
    };
    fs.writeFileSync(fromConfigPath, yaml.dump(fromContent));
    fs.writeFileSync(toConfigPath, yaml.dump(toExistingContent));

    await updateYarnConfigFiles(fromConfigPath, toConfigPath, 'my-secret-token', false);

    const toContent = yaml.load(fs.readFileSync(toConfigPath, 'utf8'));
    assert.deepStrictEqual(toContent, {
      npmScopes: {
        other: {
          npmRegistryServer: 'https://registry.npmjs.org',
          npmAuthToken: 'other-token',
        },
        ar: {
          npmRegistryServer: 'https://region-npm.pkg.dev/project/repo',
          npmAlwaysAuth: true,
          npmAuthToken: 'my-secret-token',
        },
      },
    });
  });
});
