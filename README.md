# Artifact Registry tools for npm packages

This repository contains tools to simplify the process of working with npm
packages using Artifact Registry.

# Artifact Registry Module

The Artifact Registry google-artifactregistry-auth module is an npm package
which allows you to configure npm to interact with npm private repositories
in Artifact Registry.

For more details, see
https://cloud.google.com/artifact-registry/docs/nodejs/authentication

The module automatically searches for credentials from the environment and authenticates to Artifact Registry. It looks for
credentials in the following order:
1. [Google Application Default Credentials](https://developers.google.com/accounts/docs/application-default-credentials).
2. The current active account logged in via `gcloud auth login`.
3. If neither of them exist, an error occurs.

NOTE: This module would update credentials for **all** Artifact Registry
repositories. It would not be suitable if you use multiple account credentials
in npmrc file.

To use the module:

1.  Log in
    
    Option 1: log in as a service account:

    (1). Using a JSON file that contains a service account key:

           `$ export GOOGLE_APPLICATION_CREDENTIALS=[path/to/key.json]`
    
    (2). Or using gcloud:

           `$ gcloud auth application-default login` 
    
    Option 2: log in as an end user via gcloud:
    
       `$ gcloud auth login`

2.  Add settings to connect to the repository to .npmrc. Use the output from the
    following command:

    `$ gcloud artifacts print-settings npm`

    ```
    registry=https://LOCATION-npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/
    //LOCATION-npm.pkg.dev/PROJECT_ID/REPOSITORY_ID/:always-auth=true
    ```

    Where

    **PROJECT_ID** is the ID of the project.

    **REPOSITORY_ID** is the ID of the repository.

    **LOCATION** is the location of the repository.

3.  Use one of these below options to run the script

    1.  Run the module outside of the directory containing the target npmrc file

        `$ npx google-artifactregistry-auth --repo-config=[./.npmrc] --credential-config=[~/.npmrc]`

    2.  Include the command in the scripts in package.json

        ```
        "scripts": {
            "artifactregistry-login": "npx google-artifactregistry-auth --repo-config=[./.npmrc] --credential-config=[~/.npmrc]",
        }
        ```
        
        Where:
        - `--repo-config` is the `.npmrc` file with your repository settings. If you don't specify this flag, 
        the default location is the current directory.
        - `--credential-config` is the path to the `.npmrc` file where you want to write the access token. The default is your user `.npmrc` file.

        If you want to skip checking for npm Artifact Registry domain and allow the auth token to be attached to any domains, add the flag `--allow-all-domains`

        And then run the script

        `$ npm run artifactregistry-login`

    3.  `npx` should come with `npm` 5.2+. If `npx` is not available:

        Install the module from npmjs.com as a dev dependency and include the
        command in the script

        `$ npm install google-artifactregistry-auth --save-dev`

        ```
        "scripts": {
            "artifactregistry-login": "./node_modules/.bin/artifactregistry-auth --repo-config=[./.npmrc] --credential-config=[~/.npmrc]",
        }
        ```

        Run the script

        `$ npm run artifactregistry-login`

