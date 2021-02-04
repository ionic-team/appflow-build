import { AxiosInstance } from 'axios';
import * as github from '@actions/github';

export async function getCertificate(
  client: AxiosInstance,
  ctx: AppflowContext,
  app: App
) {
  const { certificate } = ctx;
  if (!certificate) return;
  const certs = await fetchAllPages<Certificate>(
    `/apps/${app.id}/profiles`,
    client
  );
  const cert = certs.find(c => c.name === certificate);
  if (!cert) {
    throw new Error(
      `Couldn't find Certificate with name: ${certificate} for App: ${app.name}.`
    );
  }
  return cert;
}

export async function getEnvironment(
  client: AxiosInstance,
  ctx: AppflowContext,
  app: App
) {
  const { environment } = ctx;
  if (!environment) return;
  const envs = await fetchAllPages<Environment>(
    `/apps/${app.id}/environments`,
    client
  );
  const env = envs.find(e => e.name === environment);
  if (!env) {
    throw new Error(
      `Couldn't find Environment with name: ${environment} for App: ${app.name}.`
    );
  }
  return env;
}

export async function getNativeConfig(
  client: AxiosInstance,
  ctx: AppflowContext,
  app: App
) {
  const { nativeConfig } = ctx;
  if (!nativeConfig) return;
  const configs = await fetchAllPages<NativeConfig>(
    `/apps/${app.id}/native-configs`,
    client
  );
  const config = configs.find(c => c.name === nativeConfig);
  if (!config) {
    throw new Error(
      `Couldn't find Native Config with name: ${nativeConfig} for App: ${app.name}.`
    );
  }
  return config;
}

export async function getChannels(
  client: AxiosInstance,
  ctx: AppflowContext,
  app: App
) {
  const { destinations: destString } = ctx;
  if (!destString) return;
  const destinations = destString.split(',').map(d => d.trim());
  const channels = await fetchAllPages<Channel>(
    `/apps/${app.id}/channels`,
    client
  );
  const channelsToUse = channels.filter(c => destinations.includes(c.name));
  if (channelsToUse.length !== destinations.length) {
    throw new Error(
      `Couldn't find channel destination for (${destinations
        .filter(d => !channelsToUse.map(c => c.name).includes(d))
        .join(', ')})`
    );
  }
  return channelsToUse;
}

export async function getAppStoreDestinations(
  client: AxiosInstance,
  ctx: AppflowContext,
  app: App
) {
  const { destinations: destString } = ctx;
  if (!destString) return;
  const destinations = destString.split(',').map(d => d.trim());
  const credentials = await fetchAllPages<DistributionCredential>(
    `/apps/${app.id}/distribution-credentials`,
    client
  );
  const credentialsToUse = credentials.filter(c =>
    destinations.includes(c.name)
  );
  if (credentialsToUse.length !== destinations.length) {
    throw new Error(
      `Couldn't find destination for (${destinations
        .filter(d => !credentialsToUse.map(c => c.name).includes(d))
        .join(', ')})`
    );
  }
  return credentialsToUse;
}

export async function getCommit(app: App, client: AxiosInstance) {
  let sha: string | undefined = undefined;
  if (!!github.context.payload.pull_request) {
    console.log('Pull request: ', github.context.payload.pull_request);
    sha = github.context.payload.pull_request.head.sha;
  } else {
    sha = process.env.GITHUB_SHA;
    if (!sha) {
      throw new Error('Unable to determine commit sha');
    }
  }

  let commit: Commit | undefined = undefined;
  let hasMoreCommits = true;
  let page = 1;
  while (hasMoreCommits && !commit) {
    const { data: commits, hasMore } = await fetchPage<Commit>(
      `/apps/${app.id}/commits`,
      client,
      page,
      100
    );
    commit = commits.find(c => c.sha === sha);
    hasMoreCommits = hasMore;
  }
  if (!commit) {
    throw new Error(`Couldn't find commit with sha: ${sha} in Appflow.`);
  }
  return commit;
}

async function fetchAllPages<T>(
  url: string,
  client: AxiosInstance,
  currentPage: number = 1,
  pageSize: number = 1
): Promise<T[]> {
  const { data, hasMore } = await fetchPage<T>(
    url,
    client,
    currentPage,
    pageSize
  );

  if (!hasMore) return data;

  return data.concat(
    await fetchAllPages<T>(url, client, currentPage + 1, pageSize)
  );
}

async function fetchPage<T>(
  url: string,
  client: AxiosInstance,
  page: number,
  pageSize: number
): Promise<{ data: T[]; hasMore: boolean }> {
  const resp = await client.get(
    `${url}?page=${page}&page_size=${pageSize}&meta_fields=total`
  );
  const { data, meta } = resp.data as { data: T[]; meta: { total: number } };
  const hasMore = meta.total > page * pageSize;
  return { data, hasMore };
}
