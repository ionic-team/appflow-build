import * as core from '@actions/core';
import * as artifact from '@actions/artifact';
import { runWithContext } from './run';

async function run(): Promise<void> {
  const logger: Logger = {
    debug: core.debug,
    error: core.error,
    print: core.info,
  };
  const artifactName = core.getInput('upload-artifact');
  try {
    const retentionDays = parseInt(core.getInput('artifact-retention-days'));
    const pathToArtifact = await runWithContext({
      logger,
      appId: core.getInput('app-id'),
      token: core.getInput('token'),
      platform: core.getInput('platform'),
      buildStack: core.getInput('build-stack'),
      artifactType: core.getInput('artifact-type'),
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
      const artifactClient = new artifact.DefaultArtifactClient();
      await artifactClient.uploadArtifact(
        artifactName,
        [pathToArtifact],
        process.env.HOME as string,
        { retentionDays }
      );
      core.info(`Uploaded artifact ${artifactName}`);
    }
  } catch (err: unknown) {
    core.error(`Failed to upload artifact ${artifactName}: ${err}`);
    core.setFailed(`${err}`);
  }
}

run();
