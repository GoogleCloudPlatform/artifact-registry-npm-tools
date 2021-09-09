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


const registryRegex = /(@[a-zA-Z1-9-]+:)?registry=https:(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/)/;
const authTokenRegex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/):_authToken=(.*)/;
const passwordRegex = /(\/\/[a-zA-Z1-9-]+[-]npm[.]pkg[.]dev\/.*\/):_password=(.*)/;

const configType = {
  Default: "Default",
  Registry: "Registry",
  AuthToken: "AuthToken",
  Password: "Password",
}

class Config {
  constructor(text) {
    this.text = text;
    this.type = configType.Default;
  }

  toString() {
    return this.text;
  }
}


class RegistryConfig {
  constructor(scope, registry) {
    this.scope = scope;
    this.registry = registry;
    this.type = configType.Registry;
  }

  toString() {
    let prefix = this.scope ? this.scope + ':' : '';
    return `${prefix}registry=https:${this.registry}`;
  }
}

class AuthTokenConfig {
  constructor(registry, token) {
    this.registry = registry;
    this.token = token;
    this.type = configType.AuthToken;
  }

  toString() {
    return `${this.registry}:_authToken=${this.token}`;
  }

  refreshToken(token) {
    this.token = token;
  }
}

class PasswordConfig {
  constructor(registry, password) {
    this.registry = registry;
    this.password = password;
    this.type = configType.Password;
  }

  toString() {
    return `${this.registry}:_password=${this.password}`;
  }
}

function parseConfig(text) {
  let m = text.match(registryRegex);
  if (m?.length == 3) {
    scope = m[1];
    scope = scope?.replace(':', '')
    return new RegistryConfig(scope, m[2]);
  }
  m = text.match(authTokenRegex);
  if (m?.length == 3) {
    return new AuthTokenConfig(m[1], m[2]);
  }
  m = text.match(passwordRegex);
  if (m?.length == 3) {
    return new PasswordConfig(m[1], m[2]);
  }
  return new Config(text);
}

module.exports = {
  configType,
  Config,
  RegistryConfig,
  AuthTokenConfig,
  PasswordConfig,
  parseConfig
};
