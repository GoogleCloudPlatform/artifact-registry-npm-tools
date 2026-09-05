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

describe('#config', function() {
  const tests = [
    {name: 'registry', config: 'myregistry.someProperty=someValue'},
    {name: 'auth token', config: '//us-west1-npm.pkg.dev/myproj/myrepo/:_authToken=myToken'},
    {name: 'password', config: '//us-west1-npm.pkg.dev/myproj/myrepo/:_password=myPassword'},
    {name: 'registry', config: 'registry=https://us-west1-npm.pkg.dev/myproj/myrepo/'},
    {name: 'scoped registry', config: '@myscope:registry=https://us-west1-npm.pkg.dev/myproj/myrepo/'}
  ];

  tests.forEach(({name, config}) => {
    it(`parses config ${name} and converts it to string correctly`, () => {
      assert.equal(c.parseConfig(config).toString(), config);
    });
  });

  // https://github.com/GoogleCloudPlatform/artifact-registry-npm-tools/issues/85
  it('preserves the repository name when the registry URL has no trailing slash', () => {
    const config = c.parseConfig('registry=https://us-central1-npm.pkg.dev/my-project/my-repo');
    assert.equal(config.registry, '//us-central1-npm.pkg.dev/my-project/my-repo/');
    assert.equal(config.toString(), 'registry=https://us-central1-npm.pkg.dev/my-project/my-repo/');
  });

  it('preserves the repository name when a scoped registry URL has no trailing slash', () => {
    const config = c.parseConfig('@myscope:registry=https://us-central1-npm.pkg.dev/my-project/my-repo');
    assert.equal(config.registry, '//us-central1-npm.pkg.dev/my-project/my-repo/');
    assert.equal(config.toString(), '@myscope:registry=https://us-central1-npm.pkg.dev/my-project/my-repo/');
  });
})
