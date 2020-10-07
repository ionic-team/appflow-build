import { runWithContext } from './run';

async function test() {
  try {
    const logger: Logger = {
      debug: console.debug,
      error: console.error,
      print: console.log,
    };

    const pathToArtifact = await runWithContext({
      logger,
      appId: process.env.APPFLOW_APP_ID || '',
      token: process.env.APPFLOW_TOKEN || '',
      apiUrl: process.env.APPFLOW_API_URL || 'https://api.ionicjs.com',
      platform: process.env.APPFLOW_PLATFORM || 'iOS',
      buildStack: process.env.APPFLOW_BUILD_STACK || 'macOS - 2020.09',
      buildType: process.env.APPFLOW_BUILD_TYPE || 'ad-hoc',
      certificate: process.env.APPFLOW_CERTIFICATE || 'GitHub',
      environment: process.env.APPFLOW_ENVIRONMENT || 'GitHub',
      nativeConfig: process.env.APPFLOW_NATIVE_CONFIG || 'GitHub',
      destinations: process.env.APPFLOW_NATIVE_CONFIG,
      webPreview: false,
      // filename: 'myfile',
    });
  } catch (error) {
    if (error.response) {
      try {
        console.error(JSON.stringify(error.response.data, null, 2));
      } catch (e) {}
    }
    console.error(error.message);
  }
}

test();
