import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import { getClient } from './client';
import { runWithContext } from './run';

async function run(): Promise<void> {
  const logger: Logger = {
    debug: core.debug,
    error: core.error,
    print: core.info,
  };
  try {
    const artifactName = core.getInput('upload-artifact');
    const retentionDays = parseInt(core.getInput('artifact-retention-days'));
    const pathToArtifact = await runWithContext({
      logger,
      appId: core.getInput('app-id'),
      token: core.getInput('token'),
      platform: core.getInput('platform'),
      buildStack: core.getInput('build-stack'),
      buildType: core.getInput('build-type'),
      certificate: core.getInput('certificate'),
      environment: core.getInput('environment'),
      nativeConfig: core.getInput('native-config'),
      webPreview: core.getInput('web-preview') === 'yes',
      filename: core.getInput('filename'),
      destinations: core.getInput('destinations'),
    });
    if (pathToArtifact && artifactName) {
      core.info('Attempting to upload generated artifacts.');
      const artifactClient = artifact.create();
      const uploadResult = await artifactClient.uploadArtifact(
        artifactName,
        [pathToArtifact],
        process.env.HOME as string,
        { retentionDays }
      );
      uploadResult.failedItems.forEach(item =>
        core.warning(`Failed to upload artifact ${item}`)
      );
      core.info(`Uploaded artifact ${uploadResult.artifactName}`);
    }
  } catch (error) {
    if (error.response) {
      try {
        core.error(JSON.stringify(error.response.data, null, 2));
      } catch (e) {}
    }
    core.setFailed(error.message);
  }
}

run();
