# Build Artifacts tools for npm

This repository contains tools to simplify the process of working with npm
repositories using Cloud Build Artifacts.

# Cloud Build Artifacts Module

The Cloud Build Artifacts google-buildartifacts-auth module is an npm package
which allows you to configure npm to interact with npm repositories stored in
Cloud Build Artifacts.

The module authenticates to Cloud Build Artifacts using
[Google Application Default Credentials](https://developers.google.com/accounts/docs/application-default-credentials).

NOTE: This module would update credentials for **all** Cloud Build Artifacts
repositories. It would not be suitable if you use multiple account
credentials in npmrc file.

To use the module:

1.  Log in

    Using end user credentials:

    `$ gcloud auth application-default login`

    Using service account:

    `$ export GOOGLE_APPLICATION_CREDENTIALS=[path/to/key.json]`

2.  Add settings to connect to the repository to .npmrc. Use the output from the
    following command:

    `$ gcloud alpha build-artifacts print-settings npm`

    ```
    registry=https://npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/
    //npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:_password=""
    //npm.pkg.dev/PROJECT_ID/REPOSITORY_ID:username=oauth2accesstoken
    //npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:email=not.valid@email.com
    //npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:always-auth=true
    ```

    Where

    **PROJECT_ID** is the ID of the project.

    **REPOSITORY_ID** is the ID of the repository.

3.  Use one of these below options to run the script

    1.  Run the script

        `$ npx google-buildartifacts-auth [path/to/.npmrc]`

    2.  Include the binary in the scripts in package.json

        ```
        "scripts": {
            "build-artifacts-login": "npx google-buildartifacts-auth [path/to/.npmrc]",
        }
        ```

        Run the script

        `$ npm run buildartifacts-login`

    3.  `npx` should come with `npm` 5.2+. If `npx` is not available:

        Install the module from npmjs.com as a dev dependency and include the
        binary in the script

        `$ npm install google-buildartifacts-auth --save-dev`

        ```
        "scripts": {
            "buildartifacts-auth": "google-buildartifacts-auth [path/to/.npmrc]",
        }
        ```

        Where **[path/to/.npmrc]** is the optional argument you can provide to
        the script. If no path is provided, .npmrc file at current directory is
        used.

        Run the script

        `$ npm run buildartifacts-login`
