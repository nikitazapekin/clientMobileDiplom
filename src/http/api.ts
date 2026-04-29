import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { type AxiosAdapter, type AxiosError, type AxiosHeaders, type AxiosResponse, type InternalAxiosRequestConfig } from 'axios';

const DEFAULT_BASE_URL = 'https://hammer-webshots-assessed-revenues.trycloudflare.com';
const DEFAULT_TIMEOUT_MS = 45000;
const REFRESH_TIMEOUT_MS = 15000;
const DEFAULT_RETRY_COUNT = 2;
const BASE_RETRY_DELAY_MS = 800;
const FRESH_GET_CACHE_TTL_MS = 15000;
const STALE_GET_CACHE_TTL_MS = 5 * 60 * 1000;

export const BASE_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');

type RetryableConfig = InternalAxiosRequestConfig & {
  _requestKey?: string;
  _retry?: boolean;
  _retryCount?: number;
};

type CachedResponse = {
  data: AxiosResponse['data'];
  headers: AxiosResponse['headers'];
  status: number;
  statusText: string;
  expiresAt: number;
  staleUntil: number;
};

const inflightGetRequests = new Map<string, Promise<AxiosResponse>>();
const responseCache = new Map<string, CachedResponse>();
const defaultAdapter = axios.getAdapter(axios.defaults.adapter) as AxiosAdapter;

let refreshPromise: Promise<string | null> | null = null;

const isCacheableMethod = (method?: string) => (method || 'get').toLowerCase() === 'get';
const isRetryableMethod = (method?: string) => ['get', 'head', 'options'].includes((method || 'get').toLowerCase());

const isPlainObject = (value: unknown): value is Record<string, unknown> => {
  return Object.prototype.toString.call(value) === '[object Object]';
};

const stableSerialize = (value: unknown): string => {
  if (value == null) {
    return '';
  }

  if (Array.isArray(value)) {
    return `[${value.map((item) => stableSerialize(item)).join(',')}]`;
  }

  if (isPlainObject(value)) {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${key}:${stableSerialize(value[key])}`)
      .join(',')}}`;
  }

  return String(value);
};

const buildRequestKey = (config: InternalAxiosRequestConfig): string => {
  const method = (config.method || 'get').toLowerCase();
  const baseUrl = config.baseURL || '';
  const url = config.url || '';
  const params = stableSerialize(config.params);
  const headers = config.headers as Record<string, unknown> | undefined;
  const authorization =
    typeof headers?.Authorization === 'string'
      ? headers.Authorization
      : typeof headers?.authorization === 'string'
        ? headers.authorization
        : '';

  return `${method}::${baseUrl}::${url}::${params}::${authorization}`;
};

const cloneResponse = (
  response: Pick<AxiosResponse, 'data' | 'headers' | 'status' | 'statusText'>,
  config: InternalAxiosRequestConfig
): AxiosResponse => {
  return {
    data: response.data,
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
    config,
    request: undefined,
  };
};

const getCachedResponse = (
  config: RetryableConfig,
  allowStale: boolean
): AxiosResponse | null => {
  if (!isCacheableMethod(config.method)) {
    return null;
  }

  const requestKey = config._requestKey || buildRequestKey(config);
  const cached = responseCache.get(requestKey);

  if (!cached) {
    return null;
  }

  const now = Date.now();

  if (cached.expiresAt > now || (allowStale && cached.staleUntil > now)) {
    return cloneResponse(cached, config);
  }

  responseCache.delete(requestKey);

  return null;
};

const storeCachedResponse = (config: RetryableConfig, response: AxiosResponse): void => {
  if (!isCacheableMethod(config.method) || response.status < 200 || response.status >= 300) {
    return;
  }

  const now = Date.now();
  const requestKey = config._requestKey || buildRequestKey(config);

  responseCache.set(requestKey, {
    data: response.data,
    headers: response.headers,
    status: response.status,
    statusText: response.statusText,
    expiresAt: now + FRESH_GET_CACHE_TTL_MS,
    staleUntil: now + STALE_GET_CACHE_TTL_MS,
  });
};

const sleep = async (ms: number): Promise<void> => {
  await new Promise((resolve) => setTimeout(resolve, ms));
};

const getRetryDelay = (retryCount: number): number => {
  return BASE_RETRY_DELAY_MS * 2 ** retryCount;
};

const isNetworkError = (error: AxiosError): boolean => {
  return (
    !error.response &&
    (error.message === 'Network Error' ||
      error.code === 'ECONNABORTED' ||
      error.code === 'ETIMEDOUT' ||
      error.message.toLowerCase().includes('timeout'))
  );
};

const shouldRetryRequest = (error: AxiosError, config?: RetryableConfig): boolean => {
  if (!config || !isRetryableMethod(config.method)) {
    return false;
  }

  const retryCount = config._retryCount || 0;

  if (retryCount >= DEFAULT_RETRY_COUNT) {
    return false;
  }

  if (isNetworkError(error)) {
    return true;
  }

  const statusCode = error.response?.status;

  return statusCode === 429 || (statusCode != null && statusCode >= 500);
};

const shouldServeStaleCache = (error: AxiosError, config?: RetryableConfig): boolean => {
  if (!config || !isCacheableMethod(config.method)) {
    return false;
  }

  return isNetworkError(error) || error.response?.status === 429 || (error.response?.status ?? 0) >= 500;
};

const clearResponseCache = (): void => {
  responseCache.clear();
};

const resilientAdapter: AxiosAdapter = async (config) => {
  const requestConfig = config as RetryableConfig;

  requestConfig._requestKey = buildRequestKey(requestConfig);

  const cachedResponse = getCachedResponse(requestConfig, false);

  if (cachedResponse) {
    return cachedResponse;
  }

  if (!isCacheableMethod(requestConfig.method)) {
    return defaultAdapter(requestConfig);
  }

  const inflightRequest = inflightGetRequests.get(requestConfig._requestKey);

  if (inflightRequest) {
    return cloneResponse(await inflightRequest, requestConfig);
  }

  const requestPromise = (async () => {
    const response = await defaultAdapter(requestConfig);

    storeCachedResponse(requestConfig, response);

    return response;
  })();

  inflightGetRequests.set(requestConfig._requestKey, requestPromise);

  try {
    return cloneResponse(await requestPromise, requestConfig);
  } finally {
    inflightGetRequests.delete(requestConfig._requestKey);
  }
};

const $api = axios.create({
  adapter: resilientAdapter,
  baseURL: BASE_URL,
  timeout: DEFAULT_TIMEOUT_MS,
  withCredentials: true,
});

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      const refreshApi = axios.create({
        baseURL: BASE_URL,
        timeout: REFRESH_TIMEOUT_MS,
        withCredentials: true,
      });

      const response = await refreshApi.post('/auth/refresh');
      const accessToken = response.data?.accessToken as string | undefined;

      if (!accessToken) {
        return null;
      }

      await AsyncStorage.setItem('accessToken', accessToken);

      return accessToken;
    })().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
};

$api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const nextConfig = config as RetryableConfig;
    const token = await AsyncStorage.getItem('accessToken');
    const headers = axios.AxiosHeaders.from(nextConfig.headers) as AxiosHeaders;

    nextConfig.baseURL = nextConfig.baseURL || BASE_URL;
    nextConfig.timeout = nextConfig.timeout || DEFAULT_TIMEOUT_MS;

    if (token) {
      headers.set('Authorization', `Bearer ${token}`);
    }

    nextConfig.headers = headers;

    return nextConfig;
  },
  async (error: AxiosError) => Promise.reject(error)
);

$api.interceptors.response.use(
  (response: AxiosResponse) => {
    if (!isCacheableMethod(response.config.method)) {
      clearResponseCache();
    }

    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryableConfig | undefined;

    if (
      originalRequest &&
      error.response?.status === 401 &&
      !originalRequest._retry &&
      originalRequest.url !== '/auth/refresh'
    ) {
      originalRequest._retry = true;

      try {
        const accessToken = await refreshAccessToken();

        if (accessToken) {
          const headers = axios.AxiosHeaders.from(originalRequest.headers) as AxiosHeaders;

          headers.set('Authorization', `Bearer ${accessToken}`);
          originalRequest.headers = headers;

          return $api.request(originalRequest);
        }
      } catch (_refreshError) {
        await AsyncStorage.multiRemove(['accessToken', 'userRole', 'userEmail', 'userId']);
        clearResponseCache();

        const sessionExpiredError = new Error('SESSION_EXPIRED');

        sessionExpiredError.name = 'SESSION_EXPIRED';

        return Promise.reject(sessionExpiredError);
      }
    }

    if (shouldRetryRequest(error, originalRequest)) {
      const retryCount = originalRequest?._retryCount || 0;

      if (originalRequest) {
        originalRequest._retryCount = retryCount + 1;
      }

      await sleep(getRetryDelay(retryCount));

      return $api.request(originalRequest);
    }

    if (shouldServeStaleCache(error, originalRequest)) {
      const staleResponse = getCachedResponse(originalRequest as RetryableConfig, true);

      if (staleResponse) {
        return staleResponse;
      }
    }

    return Promise.reject(error);
  }
);

export default $api;
