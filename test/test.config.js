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
const c = require('../src/config');

describe('#config', () => {
  it('toString()', () => {
    assert.equal(new c.Config("myregistry.someProperty=someValue").toString(), "myregistry.someProperty=someValue");
    assert.equal(new c.AuthTokenConfig("//us-west1-npm.pkg.dev/myproj/myrepo", "myToken").toString(), "//us-west1-npm.pkg.dev/myproj/myrepo:_authToken=myToken");
    assert.equal(new c.PasswordConfig("//us-west1-npm.pkg.dev/myproj/myrepo", "myPassword").toString(), "//us-west1-npm.pkg.dev/myproj/myrepo:_password=myPassword");
    assert.equal(new c.RegistryConfig("", "//us-west1-npm.pkg.dev/myproj/myrepo").toString(), "registry=https://us-west1-npm.pkg.dev/myproj/myrepo");
    assert.equal(new c.RegistryConfig("@myscope", "//us-west1-npm.pkg.dev/myproj/myrepo").toString(), "@myscope:registry=https://us-west1-npm.pkg.dev/myproj/myrepo");
  })

  it('parseConfig()', () => {
    assert.deepEqual(c.parseConfig("myregistry.someProperty=someValue"), new c.Config("myregistry.someProperty=someValue"));
    assert.deepEqual(c.parseConfig("//us-west1-npm.pkg.dev/myproj/myrepo/:_authToken=myToken"), new c.AuthTokenConfig("//us-west1-npm.pkg.dev/myproj/myrepo/", "myToken"));
    assert.deepEqual(c.parseConfig("//us-west1-npm.pkg.dev/myproj/myrepo/:_password=myPassword"), new c.PasswordConfig("//us-west1-npm.pkg.dev/myproj/myrepo/", "myPassword"));
    assert.deepEqual(c.parseConfig("registry=https://us-west1-npm.pkg.dev/myproj/myrepo/"), new c.RegistryConfig(undefined, "//us-west1-npm.pkg.dev/myproj/myrepo/"));
    assert.deepEqual(c.parseConfig("@myscope:registry=https://us-west1-npm.pkg.dev/myproj/myrepo/"), new c.RegistryConfig("@myscope", "//us-west1-npm.pkg.dev/myproj/myrepo/"));
  })
})
