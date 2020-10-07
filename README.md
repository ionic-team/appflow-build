# Appflow Build Action for GitHub Actions

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Trigger [Appflow](https://useappflow.com) Capacitor & Cordova Mobile Builds.

## Usage

### Live Update

```yaml
- name: Build Live Update on Appflow
  uses: ionic-team/appflow-build@v1
  with:
    token: ${{ secrets.APPFLOW_TOKEN }}
    app-id: abcdef12
    platform: Web
    environment: MyEnvironment
```

> iOS & Android Builds Require a paid subscrpition to [Appflow](https://useappflow.com)

### iOS

```yaml
- name: Build iOS on Appflow
  uses: ionic-team/appflow-build@v1
  with:
    token: ${{ secrets.APPFLOW_TOKEN }}
    app-id: abcdef12
    platform: iOS
    build-type: ad-hoc
    certificate: MyCertificate
    environment: MyEnvironment
    upload-artifact: iOS-Build.zip
```

### Android

```yaml
- name: Build Android on Appflow
  uses: ionic-team/appflow-build@v1
  with:
    token: ${{ secrets.APPFLOW_TOKEN }}
    app-id: abcdef12
    platform: Android
    build-type: debug
    environment: MyEnvironment
    upload-artifact: Android-Build.zip
```

> For the action to work you will need to [connect your Appflow app to GitHub](https://ionicframework.com/docs/appflow/quickstart/github) in the Appflow dashboard.

The action can build iOS & Android binaries for Capacitor & Cordova apps using Appflow from any type of runner.
You can easily use the [Appflow Dashboard](https://dashboard.ionicframework.com) to setup your application and use this
action to run you builds & upload them as artifacts to GitHub.

See [action.yml](action.yml) for the full documentation for this action's inputs and outputs.

> You can learn more about how to configure your build in the [Appflow docs](https://ionicframework.com/docs/appflow)

## Authentication

You will need a token to authenticate with Appflow.
The easiest way to get your token is to use the Ionic CLI to login & retrieve the token.

To login type:

```bash
npm i -g @ionic/cli
ionic login
```

Then you can use the following command to see your token:

```bash
ionic config get -g tokens.user
```

Prevent the CLI from invalidating the token:

```bash
ionic config unset -g tokens.refresh
ionic config unset -g tokens.user
```

## License

[MIT](/LICENSE)
