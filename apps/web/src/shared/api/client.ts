import axios, { type AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';

import { parseApiError } from './apiError';

type AuthTokenGetter = () => string | null;
type AuthRefreshHandler = () => Promise<string | null>;
type AuthFailureHandler = () => void;

let getAccessToken: AuthTokenGetter = () => null;
let refreshAccessToken: AuthRefreshHandler = () => Promise.resolve(null);
let onAuthFailure: AuthFailureHandler = () => undefined;

export const configureApiAuth = (options: {
  getAccessToken: AuthTokenGetter;
  refreshAccessToken: AuthRefreshHandler;
  onAuthFailure: AuthFailureHandler;
}) => {
  getAccessToken = options.getAccessToken;
  refreshAccessToken = options.refreshAccessToken;
  onAuthFailure = options.onAuthFailure;
};

type RetriableConfig = InternalAxiosRequestConfig & { _retried?: boolean };

export const apiClient: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const original = error.config as RetriableConfig | undefined;
    const status = error.response?.status;

    if (status === 401 && original && !original._retried) {
      original._retried = true;
      const newToken = await refreshAccessToken();
      if (newToken && original.headers) {
        original.headers.Authorization = `Bearer ${newToken}`;
        return apiClient.request(original);
      }
      onAuthFailure();
    }

    return Promise.reject(
      parseApiError(error.response?.data, status ?? 0, error.message || 'Request failed'),
    );
  },
);
