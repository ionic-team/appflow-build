import Axios, { AxiosInstance } from 'axios';
import { createWriteStream } from 'fs';

export async function triggerWebBuild({
  app,
  commit,
  platform,
  stack,
  environment,
  channels,
  ctx,
  client,
}: {
  app: App;
  commit: Commit;
  platform: WebPlatform;
  stack: Stack;
  environment?: Environment;
  channels?: Channel[];
  ctx: AppflowContext;
  client: AxiosInstance;
}) {
  printBuildContext({
    app,
    commit,
    platform,
    stack,
    environment,
    destinations: channels,
    ctx,
  });
  const resp = await client.post(`/apps/${app.id}/deploys/`, {
    commit_id: commit.id,
    stack_id: stack.id,
    platform,
    environment_id: environment?.id,
    channel_ids: channels?.map(c => c.id),
    web_preview: ctx.webPreview,
  });

  const { data: build } = resp.data as { data: Build };
  const finishedBuild = await tailBuildLog(app, build.job_id, client, ctx);
  switch (finishedBuild.state) {
    case 'success':
      ctx.logger.print('Successfully finished build.');
      return;
    default:
      throw new Error(`Build finished with ${finishedBuild.state} state.`);
  }
}

export async function triggerNativeBuild({
  app,
  commit,
  platform,
  stack,
  buildType,
  certificate,
  environment,
  nativeConfig,
  destinations,
  ctx,
  client,
}: {
  app: App;
  commit: Commit;
  platform: NativePlatform;
  stack: Stack;
  buildType?: BuildType;
  certificate?: Certificate;
  environment?: Environment;
  nativeConfig?: NativeConfig;
  destinations?: DistributionCredential[];
  ctx: AppflowContext;
  client: AxiosInstance;
}) {
  if (destinations && destinations.length > 1) {
    throw new Error(
      `Multiple destinations for ${ctx.platform} currently unsupported.`
    );
  }
  printBuildContext({
    app,
    commit,
    platform,
    stack,
    buildType,
    certificate,
    environment,
    nativeConfig,
    destinations,
    ctx,
  });
  const resp = await client.post(`/apps/${app.id}/packages/`, {
    commit_id: commit.id,
    stack_id: stack.id,
    environment_id: environment?.id,
    native_config_id: nativeConfig?.id,
    profile_tag: certificate?.tag,
    build_type: buildType?.name,
    distribution_credential_id: destinations && destinations[0].id,
    platform: platform,
  });

  const { data: build } = resp.data as { data: Build };
  const finishedBuild = await tailBuildLog(app, build.job_id, client, ctx);
  switch (finishedBuild.state) {
    case 'success':
      const fileLocation = determineFileLocation(ctx, platform);
      await downloadBuild(app, finishedBuild.job_id, client, fileLocation);
      return fileLocation;
    default:
      throw new Error(
        `Build finished with ${finishedBuild.state} state. Unable to download artifact.`
      );
  }
}

function printBuildContext({
  app,
  commit,
  platform,
  stack,
  buildType,
  certificate,
  environment,
  nativeConfig,
  destinations,
  ctx,
}: {
  app: App;
  commit: Commit;
  platform: Platform;
  stack: Stack;
  buildType?: BuildType;
  certificate?: Certificate;
  environment?: Environment;
  nativeConfig?: NativeConfig;
  destinations?: (DistributionCredential | Channel)[];
  ctx: AppflowContext;
}) {
  let output = `
  App:           ${app.name}(${app.id})
  Commit:        ${commit.short_sha} - ${commit.note}
  Platform:      ${ctx.platform}
  Build Stack:   ${stack.friendly_name}
  Environment:   ${environment?.name || 'None'}`;
  switch (platform) {
    case 'web-deploy':
      output += `
  Web Preview:   ${ctx.webPreview ? 'YES' : 'NO'}
  Channels:      ${destinations?.map(d => d.name).join(', ') || 'None'}`;
      ctx.logger.print(output);
      return;
    default:
      output += `
  Build Type:    ${buildType?.friendly_name || 'None'}
  Certificate:   ${certificate?.name || 'None'}
  Native Config: ${nativeConfig?.name || 'None'}`;
      ctx.logger.print(output);
      return output;
  }
}

function determineFileLocation(ctx: AppflowContext, platform: NativePlatform) {
  let filename =
    ctx.filename ||
    `${process.env.GITHUB_WORKFLOW}-${process.env.GITHUB_RUN_ID}`;
  const extension = platform === 'android' ? '.apk' : '.ipa';
  if (!filename.endsWith(extension)) {
    filename = `${filename}${extension}`;
  }
  return `${process.env.HOME}/${filename}`;
}

async function sleep(ms: number) {
  return new Promise(resolve => {
    setTimeout(resolve, ms);
  });
}

async function tailBuildLog(
  app: App,
  buildId: number,
  client: AxiosInstance,
  ctx: AppflowContext
): Promise<Build> {
  let build;
  let start = 0;

  let isCreatedMessage = false;
  let errorsEncountered = 0;
  while (
    !(
      build &&
      (build.state === 'success' ||
        build.state === 'failed' ||
        build.state === 'canceled')
    )
  ) {
    try {
      await sleep(5000);
      build = await getBuild(app, buildId, client);
      if (build && build.state === 'created' && !isCreatedMessage) {
        ctx.logger.print(
          'Concurrency limit reached: build will start as soon as other builds finish.'
        );
        isCreatedMessage = true;
      }
      // split on line breaks
      const trace: string[] = build.job.trace.split('\n');
      // get rid of always added final empty item
      trace.pop();

      if (trace.length > start) {
        const end = trace.length;
        trace.splice(start).forEach(line => ctx.logger.print(line));
        start = end;
      }
      errorsEncountered = 0;
    } catch (e) {
      // Retry up to 3 times in the case of an error.
      errorsEncountered++;
      ctx.logger.print(
        `Encountered error: ${e} while fetching build data retrying.`
      );
      if (errorsEncountered >= 3) {
        ctx.logger.print(
          `Encountered ${errorsEncountered} errors in a row. Job will now fail.`
        );
        throw e;
      }
    }
  }

  return build;
}

async function getBuild(
  app: App,
  buildId: number,
  client: AxiosInstance
): Promise<Build> {
  const resp = await client.get(`/apps/${app.id}/builds/${buildId}`);
  const { data: build } = resp.data as { data: Build };
  return build;
}

async function getDownloadUrl(
  app: App,
  buildId: number,
  client: AxiosInstance
): Promise<string> {
  const resp = await client.get(`/apps/${app.id}/packages/${buildId}/download`);
  const url = resp.data.data.url;
  if (!url) {
    throw new Error('Failed to download binary');
  }
  return url as string;
}

async function downloadBuild(
  app: App,
  buildId: number,
  client: AxiosInstance,
  fileLocation: string
) {
  const downloadUrl = await getDownloadUrl(app, buildId, client);
  const writer = createWriteStream(fileLocation);

  return Axios({
    method: 'get',
    url: downloadUrl,
    responseType: 'stream',
  }).then(response => {
    //ensure that the user can call `then()` only when the file has
    //been downloaded entirely.

    return new Promise((resolve, reject) => {
      response.data.pipe(writer);

      let error: Error | undefined;
      writer.on('error', err => {
        error = err;
        writer.close();
        reject(err);
      });
      writer.on('close', () => {
        if (!error) {
          resolve(true);
        }
        //no need to call the reject here, as it will have been called in the
        //'error' stream;
      });
    });
  });
}
