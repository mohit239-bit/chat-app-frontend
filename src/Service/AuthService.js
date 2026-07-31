import { httpClient } from '../config/AxiosHelper';

export const registerApi = async (details) => {
  const response = await httpClient.post('/api/v1/auth/register', details);
  return response.data;
};

export const loginApi = async (details) => {
  const response = await httpClient.post('/api/v1/auth/login', details);
  return response.data;
};

export const googleLoginApi = async (credential) => {
  const response = await httpClient.post('/api/v1/auth/google', { credential });
  return response.data;
};

export const currentUserApi = async () => {
  const response = await httpClient.get('/api/v1/auth/me');
  return response.data;
};

export const webSocketTokenApi = async () => {
  const response = await httpClient.get('/api/v1/auth/websocket-token');
  return response.data.token;
};

export const logoutApi = async () => {
  await httpClient.post('/api/v1/auth/logout');
};
