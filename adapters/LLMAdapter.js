/**
 * llmAdapter.js
 * - App 레이어는 이 파일만 통해 LLM 기능을 사용합니다.
 * - demo 모드: 브라우저 직접 호출(transmuteEngine.js 위임)
 * - managed 모드: 서버 API 호출(사용자 API 키 입력 불필요)
 */
import {
  SUPPORTED_MODEL_PROVIDERS,
  getProviderDisplayName,
  fetchAvailableModels as fetchAvailableModelsDirect,
  transmuteVibeToSpec as transmuteVibeToSpecDirect,
  recommendHybridStacks as recommendHybridStacksDirect,
} from '../engine/graph/transmuteEngine';
import { buildManagedApiUrl, IS_MANAGED_MODE } from '../ui/app/config/runtime.js';

export { SUPPORTED_MODEL_PROVIDERS, getProviderDisplayName };

async function parseJsonSafely(response) {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

async function requestManagedApi(pathname, payload = {}, method = 'POST') {
  const response = await fetch(buildManagedApiUrl(pathname), {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    body: method === 'GET' ? undefined : JSON.stringify(payload),
  });

  const data = await parseJsonSafely(response);
  if (!response.ok) {
    const message = String(data?.error || data?.message || `Managed API request failed (${response.status})`);
    throw new Error(message);
  }

  return data;
}

export async function fetchAvailableModels(apiKey, options = {}) {
  if (!IS_MANAGED_MODE) {
    return fetchAvailableModelsDirect(apiKey, options);
  }

  const provider = String(options?.provider || SUPPORTED_MODEL_PROVIDERS[0]);
  const query = new URLSearchParams({ provider }).toString();
  const data = await requestManagedApi(`/models?${query}`, {}, 'GET');
  return Array.isArray(data?.models) ? data.models : [];
}

export async function transmuteVibeToSpec(vibe, apiKey, options = {}) {
  if (!IS_MANAGED_MODE) {
    return transmuteVibeToSpecDirect(vibe, apiKey, options);
  }

  return requestManagedApi('/transmute', {
    vibe,
    options,
  });
}

export async function recommendHybridStacks(vibe, standardOutput, apiKey, options = {}) {
  if (!IS_MANAGED_MODE) {
    return recommendHybridStacksDirect(vibe, standardOutput, apiKey, options);
  }

  return requestManagedApi('/hybrid-stacks', {
    vibe,
    standardOutput,
    options,
  });
}
