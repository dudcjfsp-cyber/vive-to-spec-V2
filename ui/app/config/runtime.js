function toText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

const rawMode = toText(import.meta.env.VITE_APP_MODE, 'demo').toLowerCase();
const managedBaseFromEnv = toText(import.meta.env.VITE_MANAGED_API_BASE_URL, '');

export const IS_MANAGED_MODE = rawMode === 'managed';
export const RUNTIME_APP_MODE = IS_MANAGED_MODE ? 'managed' : 'demo';
export const REQUIRES_USER_API_KEY = !IS_MANAGED_MODE;

function normalizeBaseUrl(baseUrl) {
  const normalized = toText(baseUrl, '/api');
  return normalized.replace(/\/+$/, '');
}

export const MANAGED_API_BASE_URL = normalizeBaseUrl(managedBaseFromEnv);

export function buildManagedApiUrl(pathname) {
  const path = pathname.startsWith('/') ? pathname : `/${pathname}`;
  return `${MANAGED_API_BASE_URL}${path}`;
}
