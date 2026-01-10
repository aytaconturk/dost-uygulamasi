export type ApiEnv = 'test' | 'product';
export type AppMode = 'dev' | 'prod';

const COOKIE_NAME = 'api_env';
const APP_MODE_KEY = 'app_mode';

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

/**
 * Checks if the app is running on a production domain
 */
export const isProductionDomain = (): boolean => {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname;
  // localhost, 127.0.0.1, 0.0.0.0 are development environments
  return hostname !== 'localhost' && 
         hostname !== '127.0.0.1' && 
         hostname !== '0.0.0.0' && 
         !hostname.includes('localhost');
};

export const getApiEnv = (): ApiEnv => {
  const fromCookie = (getCookie(COOKIE_NAME) as ApiEnv | null);
  // If explicitly set via cookie, use that
  if (fromCookie === 'product' || fromCookie === 'test') {
    return fromCookie;
  }
  // Default: always use product API (safer for production)
  // Switch to test manually via sidebar or admin panel if needed
  return 'product';
};

export const setApiEnv = (env: ApiEnv) => setCookie(COOKIE_NAME, env);

export const getRoot = () => (import.meta as any).env?.VITE_API_ROOT || 'https://arge.aquateknoloji.com';

export const getApiBase = () => {
  const root = getRoot().replace(/\/$/, '');
  const env = getApiEnv();
  return env === 'product' ? `${root}/webhook` : `${root}/webhook-test`;
};

export const getAppMode = (): AppMode => {
  try {
    const stored = localStorage.getItem(APP_MODE_KEY) as AppMode | null;
    // If explicitly set, use that value
    if (stored === 'prod' || stored === 'dev') {
      return stored;
    }
    // Default: production domain = prod mode, otherwise dev mode
    return isProductionDomain() ? 'prod' : 'dev';
  } catch {
    // On error, check domain
    return isProductionDomain() ? 'prod' : 'dev';
  }
};

export const setAppMode = (mode: AppMode) => {
  try {
    localStorage.setItem(APP_MODE_KEY, mode);
  } catch {}
};
