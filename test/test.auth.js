/**
 * Copyright 2019 Google LLC. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
const assert = require('assert');
const fs = require('fs');
const buildartifactsAuth = require('../src/auth');

const configPath = __dirname + '/.npmrc';
const creds = 'abcd';

describe('#auth', () => {
  describe('#updateConfigFile(configPath, creds)', () => {
    const newConfig = `registry=https://npm.pkg.dev/my-project/my-repo/
//npm.pkg.dev/my-project/my-repo/:_password=""
//npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const existingConfig = `registry=https://npm.pkg.dev/my-project/my-repo/
//npm.pkg.dev/my-project/my-repo/:_password="not_abcd"
//npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const multipleConfig = `registry=https://npm.pkg.dev/my-project/my-repo/
//npm.pkg.dev/my-project/my-repo/:_password="my-repo-creds"
//npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-repo/:always-auth=true
@cba:registry=https://npm.pkg.dev/my-project/my-other-repo/
//npm.pkg.dev/my-project/my-other-repo/:_password="my-other-repo-creds"
//npm.pkg.dev/my-project/my-other-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-other-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-other-repo/:always-auth=true`;

    const wantContent = `registry=https://npm.pkg.dev/my-project/my-repo/
//npm.pkg.dev/my-project/my-repo/:_password="abcd"
//npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const wantMultipleContent =
        `registry=https://npm.pkg.dev/my-project/my-repo/
//npm.pkg.dev/my-project/my-repo/:_password="abcd"
//npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-repo/:always-auth=true
@cba:registry=https://npm.pkg.dev/my-project/my-other-repo/
//npm.pkg.dev/my-project/my-other-repo/:_password="abcd"
//npm.pkg.dev/my-project/my-other-repo/:username=oauth2accesstoken
//npm.pkg.dev/my-project/my-other-repo/:email=not.valid@email.com
//npm.pkg.dev/my-project/my-other-repo/:always-auth=true`;

    const nonCBAConfig =
        `registry=https://npm.other.registry/my-project/my-repo/
//npm.other.registry/my-project/my-repo/:_password="other.registry.creds"
//npm.other.registry/my-project/my-repo/:username=oauth2accesstoken
//npm.other.registry/my-project/my-repo/:email=not.valid@email.com
//npm.other.registry/my-project/my-repo/:always-auth=true
//another.registry.com/:_authToken=another-registry-creds`;

    beforeEach(() => {
      fs.openSync(configPath, 'w');
    });

    afterEach(() => {
      fs.unlinkSync(configPath);
    });

    it('add new', async () => {
      fs.writeFileSync(configPath, newConfig);
      await buildartifactsAuth.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantContent);
    });

    it('replace old creds', async () => {
      fs.writeFileSync(configPath, existingConfig);
      await buildartifactsAuth.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantContent);
    });

    it('replace multiple creds', async () => {
      fs.writeFileSync(configPath, multipleConfig);
      await buildartifactsAuth.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantMultipleContent);
    });

    it('no creds', async () => {
      fs.writeFileSync(configPath, nonCBAConfig);
      assert.rejects(buildartifactsAuth.updateConfigFile(configPath, creds));
    });
  });

  describe('#non-existing', () => {
    it('.npmrc', async () => {
      assert.rejects(buildartifactsAuth.updateConfigFile(configPath, creds));
    });
  });
});
