import * as core from '@actions/core';
import { AxiosInstance } from 'axios';

export async function validateToken(
  client: AxiosInstance,
  ctx: AppflowContext
) {
  try {
    const resp = await client.get('/users/self');
    const { data: user } = resp.data;
    ctx.logger.print(`Logged in as ${user.username}.`);
  } catch (e) {
    const response = e && e.response;
    if (response && response.status === 401) {
      throw new Error('Invalid Token. Failed to Authenticate.');
    }
  }
}

export async function getApp(client: AxiosInstance, ctx: AppflowContext) {
  try {
    const resp = await client.get(`/apps/${ctx.appId}`);
    const { data: app } = resp.data as { data: App };
    return app;
  } catch (e) {
    throw new Error(`Failed to find app with id: ${ctx.appId}`);
  }
}
