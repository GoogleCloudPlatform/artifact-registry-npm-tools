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
    const newConfig = `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=""
//us-west1-npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const existingConfig = `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken="not_abcd"
//us-west1-npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const multipleConfig = `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken="my-repo-creds"
//us-west1-npm.pkg.dev/my-project/my-repo/:always-auth=true
@cba:registry=https://asia-npm.pkg.dev/my-project/my-other-repo/
//asia-npm.pkg.dev/my-project/my-other-repo/:_authToken="my-other-repo-creds"
//asia-npm.pkg.dev/my-project/my-other-repo/:always-auth=true`;

    const wantContent = `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken="abcd"
//us-west1-npm.pkg.dev/my-project/my-repo/:always-auth=true`;

    const wantMultipleContent =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken="abcd"
//us-west1-npm.pkg.dev/my-project/my-repo/:always-auth=true
@cba:registry=https://asia-npm.pkg.dev/my-project/my-other-repo/
//asia-npm.pkg.dev/my-project/my-other-repo/:_authToken="abcd"
//asia-npm.pkg.dev/my-project/my-other-repo/:always-auth=true`;

    const nonCBAConfig =
        `registry=https://npm.other.registry/my-project/my-repo/
//npm.other.registry/my-project/my-repo/:_authToken="other.registry.creds"
//npm.other.registry/my-project/my-repo/:always-auth=true
@old-registry=https://asia-npm.pkg/my-project/my-repo/
//asia-npm.pkg/my-project/my-repo/:_password="old.registry.creds"
//asia-npm.pkg/my-project/my-repo/:username=oauth2accesstoken
//asia-npm.pkg/my-project/my-repo/:email=not.valid@email.com
//asia-npm.pkg/my-project/my-repo/:always-auth=true
//another.registry.com/:_authToken=another-registry-creds`;

    const existingWithLegacyConfig =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password="stale-creds"
//us-west1-npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//us-west1-npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
@cba:registry=https://asia-npm.pkg.dev/my-project/my-other-repo/
//asia-npm.pkg.dev/my-project/my-other-repo/:_authToken="another-stale-creds"
//asia-npm.pkg.dev/my-project/my-other-repo/:always-auth=true
@ar=https://asia-npm.pkg/my-project/my-repo/
//asia-npm.pkg/my-project/my-repo/:_password="json-key"
//asia-npm.pkg/my-project/my-repo/:username=_json_key_base64
//asia-npm.pkg/my-project/my-repo/:email=not.valid@email.com
//asia-npm.pkg/my-project/my-repo/:always-auth=true`;

    const wantExistingWithLegacyContent =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password="YWJjZA=="
//us-west1-npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//us-west1-npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com
@cba:registry=https://asia-npm.pkg.dev/my-project/my-other-repo/
//asia-npm.pkg.dev/my-project/my-other-repo/:_authToken="abcd"
//asia-npm.pkg.dev/my-project/my-other-repo/:always-auth=true
@ar=https://asia-npm.pkg/my-project/my-repo/
//asia-npm.pkg/my-project/my-repo/:_password="json-key"
//asia-npm.pkg/my-project/my-repo/:username=_json_key_base64
//asia-npm.pkg/my-project/my-repo/:email=not.valid@email.com
//asia-npm.pkg/my-project/my-repo/:always-auth=true`;

    const legacyConfig =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password="stale-creds"
//us-west1-npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//us-west1-npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com`;

    const wantLegacyContent =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password="YWJjZA=="
//us-west1-npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken
//us-west1-npm.pkg.dev/my-project/my-repo/:email=not.valid@email.com`;

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

    it('replace creds with legacy', async () => {
      fs.writeFileSync(configPath, existingWithLegacyConfig);
      await buildartifactsAuth.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantExistingWithLegacyContent);
    });

    it('replace legacy creds', async () => {
      fs.writeFileSync(configPath, legacyConfig);
      await buildartifactsAuth.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantLegacyContent);
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
