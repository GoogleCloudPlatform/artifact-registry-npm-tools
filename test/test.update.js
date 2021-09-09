/**
 * Copyright 2021 Google LLC. All Rights Reserved.
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
const os = require('os');
const path = require('path');
var update = require('../src/update');

const creds = 'abcd';

function getTestDir(test) {
  return path.join(os.tmpdir(), test);
}

// Writing to a file whose name starts with a dot is tricky on Windows, thus
// changing the name of the config file to "npmrc".
function getConfigPath(test) {
  return path.join(os.tmpdir(), test, '/npmrc');
}

describe('#update', () => {
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

    const noAuthTokenPlaceholderConfig =
        `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`;

    beforeEach(function(){
      const testDir = getTestDir(this.currentTest.title);
      if (!fs.existsSync(testDir)){
          fs.mkdirSync(testDir);
      }
    });

    afterEach(function(){
      fs.rmdirSync(getTestDir(this.currentTest.title), {recursive: true});
    });

    it('add new', async function(){
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, newConfig);
      await update.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantContent);
    });

    it('replace old creds', async function(){
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, existingConfig);
      await update.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantContent);
    });

    it('replace multiple creds', async function(){
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, multipleConfig);
      await update.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantMultipleContent);
    });

    it('replace creds with legacy', async function(){
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, existingWithLegacyConfig);
      await update.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantExistingWithLegacyContent);
    });

    it('replace legacy creds', async function(){
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, legacyConfig);
      await update.updateConfigFile(configPath, creds);

      const got = fs.readFileSync(configPath, 'utf8');
      assert.equal(got, wantLegacyContent);
    });

    it('no creds', async function() {
      configPath = getConfigPath(this.test.title);
      fs.writeFileSync(configPath, nonCBAConfig);
      await assert.rejects(update.updateConfigFile(configPath, creds));
    });

    it ('non-existing', async function() {
      configPath = getConfigPath(this.test.title);
      await assert.rejects(update.updateConfigFile(configPath, creds));
    });
  });

  describe('#updateConfigFiles', () => {
    beforeEach(function(){
      const fromTestDir = getTestDir(`${this.currentTest.title}-from`);
      if (!fs.existsSync(fromTestDir)){
          fs.mkdirSync(fromTestDir);
      }
      const toTestDir = getTestDir(`${this.currentTest.title}-to`);
      if (!fs.existsSync(toTestDir)){
          fs.mkdirSync(toTestDir);
      }
    });

    afterEach(function(){
      fs.rmdirSync(getTestDir(`${this.currentTest.title}-from`), {recursive: true});
      fs.rmdirSync(getTestDir(`${this.currentTest.title}-to`), {recursive: true});
    });

    it('add new unscoped', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      fs.writeFileSync(toConfigPath, ``);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('add new scoped', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      fs.writeFileSync(toConfigPath, ``);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('add new to config file does not exist', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('refresh tokens in to config file', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      fs.writeFileSync(toConfigPath, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=oldToken`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('use password config if exists', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      fs.writeFileSync(toConfigPath, `//us-west1-npm.pkg.dev/my-project/my-repo/:_password=mypassword`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_password=mypassword`);
    });

    it('move auth tokens', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=oldToken`);
      fs.writeFileSync(toConfigPath, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=oldToken`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('move passwords', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password=mypassword`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_password=mypassword`);
    });

    it('replace legacy configs', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
//us-west1-npm.pkg.dev/my-project/my-repo/:_password="YWJjZA=="
//us-west1-npm.pkg.dev/my-project/my-repo/:username=oauth2accesstoken`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/`);
      assert.equal(gotTo, `//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd`);
    });

    it('keep everything else untouched', async function(){
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      fs.writeFileSync(fromConfigPath, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
@anotherscope:registry=https://us-west1-npm.pkg.dev/another-proj/another-repo/
myregistry.myproperty=myvalue`);
      fs.writeFileSync(toConfigPath, `myregistry.myproperty=myvalue`);
      await update.updateConfigFiles(fromConfigPath, toConfigPath, creds);
      
      const gotFrom = fs.readFileSync(fromConfigPath, 'utf8');
      const gotTo = fs.readFileSync(toConfigPath, 'utf8');
      assert.equal(gotFrom, `@myscope:registry=https://us-west1-npm.pkg.dev/my-project/my-repo/
@anotherscope:registry=https://us-west1-npm.pkg.dev/another-proj/another-repo/
myregistry.myproperty=myvalue`);
      assert.equal(gotTo, `myregistry.myproperty=myvalue
//us-west1-npm.pkg.dev/my-project/my-repo/:_authToken=abcd
//us-west1-npm.pkg.dev/another-proj/another-repo/:_authToken=abcd`);
    });

    it('rejects if input does not exist', async function() {
      fromConfigPath = getConfigPath(`${this.test.title}-from`);
      toConfigPath = getConfigPath(`${this.test.title}-to`)
      await assert.rejects(update.updateConfigFiles(fromConfigPath, toConfigPath, creds));
    });
  });
})
