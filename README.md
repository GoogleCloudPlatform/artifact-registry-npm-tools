# Build Artifacts tools for npm

This repository contains tools to simplify the process of working with npm repositories using
Cloud Build Artifacts.

# Cloud Build Artifacts Module

The Cloud Build Artifacts cba-login module is an npm package which allows you to configure
npm to interact with npm repositories stored in Cloud Build Artifacts.

The module will authenticate to Cloud Build Artifacts using
[Google Application Default Credentials](https://developers.google.com/accounts/docs/application-default-credentials).


To use the module:

- Install the module from npmjs.com as a dev dependency

`$ npm install cba-login --save-dev`

- Add settings to connect to the repository to .npmrc. Use the output from the following command:

`$ gcloud alpha build-artifacts print-settings npm`

```
registry=https://npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/
//npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:_password="${GOOGLE_BUILDARTIFACTS_TOKEN_NPM}"
//npm.pkg.dev/PROJECT_ID/REPOSITORY_ID:username=oauth2accesstoken
//npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:email=not.valid@email.com
//npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:always-auth=true
```

Where

**PROJECT_ID** is the ID of the project.

**REPOSITORY_ID** is the ID of the repository.

- Include the module in the scripts in package.json

```
"scripts": {
    "cba-login": "cba-login [path/to/.npmrc]",
}
```

Where [path/to/.npmrc] is the optional argument you can provide to the script.

- Run the script

`$ npm run cba-login`
