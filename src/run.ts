import { AxiosInstance } from 'axios';
import { triggerNativeBuild, triggerWebBuild } from './build';
import {
  getBuildStack,
  getAndValidateBuildType,
  getPlatform,
} from './build-stack';
import { getClient } from './client';
import {
  getAppStoreDestinations,
  getCertificate,
  getChannels,
  getCommit,
  getEnvironment,
  getNativeConfig,
} from './configuration';
import { getApp, validateToken } from './validate';

export async function runWithContext(
  ctx: AppflowContext
): Promise<string | void> {
  const client = getClient(ctx);
  await validateToken(client, ctx);

  const app = await getApp(client, ctx);
  ctx.logger.debug(`got app ${app.name}.`);

  const commit = await getCommit(app, client);
  ctx.logger.debug(
    `got commit with note ${commit.note} and sha: ${commit.short_sha}.`
  );

  const platform = getPlatform(ctx);
  ctx.logger.debug(`got platform: ${platform}`);

  const stack = await getBuildStack(client, platform, ctx);
  ctx.logger.debug(`got stack: ${stack.friendly_name}`);

  const buildType = getAndValidateBuildType(ctx, stack);
  if (buildType) {
    ctx.logger.debug(`got build-type: ${buildType.friendly_name}`);
  }

  const certificate = await getCertificate(client, ctx, app);
  if (certificate) {
    ctx.logger.debug(`got certificate with tag: ${certificate.tag}`);
  }

  const environment = await getEnvironment(client, ctx, app);
  if (environment) {
    ctx.logger.debug(`got environment with id: ${environment.id}`);
  }

  const nativeConfig = await getNativeConfig(client, ctx, app);
  if (nativeConfig) {
    ctx.logger.debug(`got native config with id: ${nativeConfig.id}`);
  }

  switch (platform) {
    case 'WEB':
      const channels = await getChannels(client, ctx, app);
      if (channels) {
        ctx.logger.debug(
          `got channels (${channels.map(c => c.id).join(', ')})`
        );
      }
      return await triggerWebBuild({
        app,
        commit,
        platform,
        stack,
        environment,
        channels,
        ctx,
        client,
      });
    default:
      // ios or android
      const destinations = await getAppStoreDestinations(client, ctx, app);
      if (destinations) {
        ctx.logger.debug(
          `got destinations (${destinations.map(c => c.id).join(', ')})`
        );
      }
      return await triggerNativeBuild({
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
      });
  }
}
