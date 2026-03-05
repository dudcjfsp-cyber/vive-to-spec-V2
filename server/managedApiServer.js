import { createServer } from 'node:http';
import {
  fetchAvailableModels,
  recommendHybridStacks,
  SUPPORTED_MODEL_PROVIDERS,
  transmuteVibeToSpec,
} from '../engine/graph/transmuteEngine.js';

const HOST = process.env.MANAGED_API_HOST || '127.0.0.1';
const PORT = Number(process.env.MANAGED_API_PORT || 8787);
const ALLOWED_ORIGIN = process.env.MANAGED_API_ALLOWED_ORIGIN || '*';
const API_PREFIX = normalizePath(process.env.MANAGED_API_PREFIX || '/api');
const BODY_LIMIT_BYTES = 1_000_000;

const PROVIDER_KEY_ENV = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

function toText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizePath(pathname) {
  const trimmed = toText(pathname, '/api');
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function normalizeProvider(provider) {
  const normalized = toText(provider, SUPPORTED_MODEL_PROVIDERS[0]).toLowerCase();
  return SUPPORTED_MODEL_PROVIDERS.includes(normalized) ? normalized : SUPPORTED_MODEL_PROVIDERS[0];
}

function getProviderApiKey(provider) {
  const normalizedProvider = normalizeProvider(provider);
  const envName = PROVIDER_KEY_ENV[normalizedProvider];
  const key = toText(process.env[envName], '');

  if (!key) {
    throw new Error(`Missing server API key: ${envName}`);
  }

  return key;
}

function getCorsHeaders() {
  return {
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    ...getCorsHeaders(),
    'Content-Type': 'application/json; charset=utf-8',
  });
  res.end(JSON.stringify(payload));
}

async function readJsonBody(req) {
  let raw = '';

  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > BODY_LIMIT_BYTES) {
      throw new Error('Request body is too large.');
    }
  }

  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function getRoute(pathname) {
  const normalized = normalizePath(pathname);
  if (normalized === `${API_PREFIX}/health`) return 'health';
  if (normalized === `${API_PREFIX}/models`) return 'models';
  if (normalized === `${API_PREFIX}/transmute`) return 'transmute';
  if (normalized === `${API_PREFIX}/hybrid-stacks`) return 'hybrid-stacks';
  return '';
}

const server = createServer(async (req, res) => {
  const method = String(req.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, getCorsHeaders());
    res.end();
    return;
  }

  const requestUrl = new URL(req.url || '/', `http://${req.headers.host || `${HOST}:${PORT}`}`);
  const route = getRoute(requestUrl.pathname);

  try {
    if (route === 'health' && method === 'GET') {
      sendJson(res, 200, {
        ok: true,
        mode: 'managed',
        providers: SUPPORTED_MODEL_PROVIDERS,
      });
      return;
    }

    if (route === 'models' && method === 'GET') {
      const provider = normalizeProvider(requestUrl.searchParams.get('provider'));
      const apiKey = getProviderApiKey(provider);
      const models = await fetchAvailableModels(apiKey, { provider });
      sendJson(res, 200, {
        provider,
        models: Array.isArray(models) ? models : [],
      });
      return;
    }

    if (route === 'transmute' && method === 'POST') {
      const body = await readJsonBody(req);
      const vibe = toText(body?.vibe, '');
      if (!vibe) {
        sendJson(res, 400, { error: 'vibe is required.' });
        return;
      }

      const options = body?.options && typeof body.options === 'object' ? body.options : {};
      const provider = normalizeProvider(options.provider);
      const apiKey = getProviderApiKey(provider);
      const result = await transmuteVibeToSpec(vibe, apiKey, {
        ...options,
        provider,
      });

      sendJson(res, 200, result);
      return;
    }

    if (route === 'hybrid-stacks' && method === 'POST') {
      const body = await readJsonBody(req);
      const vibe = toText(body?.vibe, '');
      if (!vibe) {
        sendJson(res, 400, { error: 'vibe is required.' });
        return;
      }

      const options = body?.options && typeof body.options === 'object' ? body.options : {};
      const provider = normalizeProvider(options.provider);
      const apiKey = getProviderApiKey(provider);

      const result = await recommendHybridStacks(
        vibe,
        body?.standardOutput || {},
        apiKey,
        {
          provider,
          modelName: toText(options.modelName, ''),
        },
      );

      sendJson(res, 200, result);
      return;
    }

    sendJson(res, 404, {
      error: 'Route not found.',
      route: requestUrl.pathname,
      expected_prefix: API_PREFIX,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Managed API server error.';
    sendJson(res, 500, { error: message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[managed-api] listening at http://${HOST}:${PORT}${API_PREFIX}`);
});
