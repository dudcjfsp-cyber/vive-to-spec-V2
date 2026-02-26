const API_PROVIDER_STORAGE_KEY = 'ai_provider';
const API_KEY_STORAGE_PREFIX = 'ai_api_key';
const API_KEY_SAVED_AT_STORAGE_PREFIX = 'ai_api_key_saved_at';
const LEGACY_API_KEY_STORAGE_KEY = 'gemini_api_key';
const LEGACY_API_KEY_SAVED_AT_STORAGE_KEY = 'gemini_api_key_saved_at';

export const API_KEY_TTL_MS = 30 * 60 * 1000;

export function normalizeProvider(provider, supportedProviders = ['gemini']) {
  const normalized = String(provider || '').trim().toLowerCase();
  return supportedProviders.includes(normalized) ? normalized : supportedProviders[0];
}

export function getApiKeyStorageKey(provider, supportedProviders) {
  return `${API_KEY_STORAGE_PREFIX}_${normalizeProvider(provider, supportedProviders)}`;
}

export function getApiKeySavedAtStorageKey(provider, supportedProviders) {
  return `${API_KEY_SAVED_AT_STORAGE_PREFIX}_${normalizeProvider(provider, supportedProviders)}`;
}

export function getStoredProvider(supportedProviders) {
  return normalizeProvider(sessionStorage.getItem(API_PROVIDER_STORAGE_KEY), supportedProviders);
}

export function persistProviderToSession(provider, supportedProviders) {
  sessionStorage.setItem(API_PROVIDER_STORAGE_KEY, normalizeProvider(provider, supportedProviders));
}

function clearLegacyGeminiStorage() {
  sessionStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_API_KEY_SAVED_AT_STORAGE_KEY);
  localStorage.removeItem(LEGACY_API_KEY_STORAGE_KEY);
}

export function clearStoredApiKey(provider, supportedProviders) {
  const storageKey = getApiKeyStorageKey(provider, supportedProviders);
  const savedAtKey = getApiKeySavedAtStorageKey(provider, supportedProviders);
  sessionStorage.removeItem(storageKey);
  sessionStorage.removeItem(savedAtKey);
  localStorage.removeItem(storageKey);
}

export function isApiKeyExpired(savedAtMs) {
  return !Number.isFinite(savedAtMs) || (Date.now() - savedAtMs > API_KEY_TTL_MS);
}

export function persistApiKeyToSession(key, provider, supportedProviders) {
  const normalizedProvider = normalizeProvider(provider, supportedProviders);
  const storageKey = getApiKeyStorageKey(normalizedProvider, supportedProviders);
  const savedAtKey = getApiKeySavedAtStorageKey(normalizedProvider, supportedProviders);
  sessionStorage.setItem(storageKey, key);
  sessionStorage.setItem(savedAtKey, String(Date.now()));
  localStorage.removeItem(storageKey);

  if (normalizedProvider === 'gemini') {
    clearLegacyGeminiStorage();
  }
}

export function getStoredApiKey(provider, supportedProviders) {
  const normalizedProvider = normalizeProvider(provider, supportedProviders);
  const storageKey = getApiKeyStorageKey(normalizedProvider, supportedProviders);
  const savedAtKey = getApiKeySavedAtStorageKey(normalizedProvider, supportedProviders);

  let key = sessionStorage.getItem(storageKey) || '';
  let savedAtMs = Number(sessionStorage.getItem(savedAtKey));

  if (!key && normalizedProvider === 'gemini') {
    const legacyKey = sessionStorage.getItem(LEGACY_API_KEY_STORAGE_KEY) || localStorage.getItem(LEGACY_API_KEY_STORAGE_KEY) || '';
    const legacySavedAt = Number(sessionStorage.getItem(LEGACY_API_KEY_SAVED_AT_STORAGE_KEY));
    if (legacyKey) {
      sessionStorage.setItem(storageKey, legacyKey);
      sessionStorage.setItem(savedAtKey, Number.isFinite(legacySavedAt) ? String(legacySavedAt) : String(Date.now()));
      key = legacyKey;
      savedAtMs = Number(sessionStorage.getItem(savedAtKey));
    }
  }

  if (!key) {
    sessionStorage.removeItem(savedAtKey);
    return '';
  }

  if (isApiKeyExpired(savedAtMs)) {
    clearStoredApiKey(normalizedProvider, supportedProviders);
    return '';
  }

  return key;
}

