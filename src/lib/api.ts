export type ApiEnv = 'test' | 'product';

const COOKIE_NAME = 'api_env';

const getCookie = (name: string) => {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name.replace(/([.$?*|{}()\[\]\\\/\+^])/g, '\\$1') + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
};

const setCookie = (name: string, value: string, days = 365) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; path=/; expires=${expires}`;
};

export const getApiEnv = (): ApiEnv => {
  const fromCookie = (getCookie(COOKIE_NAME) as ApiEnv | null);
  return fromCookie === 'product' ? 'product' : 'test';
};

export const setApiEnv = (env: ApiEnv) => setCookie(COOKIE_NAME, env);

export const getRoot = () => (import.meta as any).env?.VITE_API_ROOT || 'https://arge.aquateknoloji.com';

export const getApiBase = () => {
  const root = getRoot().replace(/\/$/, '');
  const env = getApiEnv();
  return env === 'product' ? `${root}/webhook` : `${root}/webhook-test`;
};
