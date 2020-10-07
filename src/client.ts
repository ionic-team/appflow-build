import axios from 'axios';

export function getClient(ctx: AppflowContext) {
  const token = ctx.token;
  const baseURL = ctx.apiUrl || 'https://api.ionicjs.com/';

  return axios.create({
    baseURL,
    timeout: 5000,
    responseType: 'json',
    headers: { Authorization: `Bearer ${token}` },
  });
}
