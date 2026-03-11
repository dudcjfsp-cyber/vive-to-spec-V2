import {
  fetchAvailableModels as fetchAvailableModelsDirect,
  recommendHybridStacks as recommendHybridStacksDirect,
  SUPPORTED_MODEL_PROVIDERS,
  transmuteVibeToSpec as transmuteVibeToSpecDirect,
} from '../../engine/graph/transmuteEngine.js';

const DEFAULT_BODY_LIMIT_BYTES = 1_000_000;
const DEFAULT_API_PREFIX = '/api';
const DEFAULT_ALLOWED_ORIGIN = '*';
const DEFAULT_HOST = '0.0.0.0';
const DEFAULT_PORT = 8787;

const PROVIDER_KEY_ENV = {
  gemini: 'GEMINI_API_KEY',
  openai: 'OPENAI_API_KEY',
  anthropic: 'ANTHROPIC_API_KEY',
};

const ROUTE_PATH_SEGMENTS = {
  health: 'health',
  models: 'models',
  transmute: 'transmute',
  'hybrid-stacks': 'hybrid-stacks',
};

export function toText(value, fallback = '') {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

export function normalizePath(pathname) {
  const trimmed = toText(pathname, DEFAULT_API_PREFIX);
  const withLeadingSlash = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  const withoutTrailingSlash = withLeadingSlash.replace(/\/+$/, '');
  return withoutTrailingSlash || '/';
}

function normalizePort(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : DEFAULT_PORT;
}

export function parseAllowedOrigins(value) {
  const raw = toText(value, DEFAULT_ALLOWED_ORIGIN);
  if (raw === DEFAULT_ALLOWED_ORIGIN) {
    return [DEFAULT_ALLOWED_ORIGIN];
  }

  return raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

export function resolveAllowedOrigin(requestOrigin, allowedOrigins) {
  if (!Array.isArray(allowedOrigins) || allowedOrigins.length === 0) {
    return DEFAULT_ALLOWED_ORIGIN;
  }

  if (allowedOrigins.includes(DEFAULT_ALLOWED_ORIGIN)) {
    return DEFAULT_ALLOWED_ORIGIN;
  }

  const normalizedRequestOrigin = toText(requestOrigin, '');
  if (normalizedRequestOrigin && allowedOrigins.includes(normalizedRequestOrigin)) {
    return normalizedRequestOrigin;
  }

  return allowedOrigins[0];
}

export function normalizeProvider(provider, supportedProviders = SUPPORTED_MODEL_PROVIDERS) {
  const fallbackProvider = Array.isArray(supportedProviders) && supportedProviders.length > 0
    ? supportedProviders[0]
    : SUPPORTED_MODEL_PROVIDERS[0];
  const normalized = toText(provider, fallbackProvider).toLowerCase();
  return supportedProviders.includes(normalized) ? normalized : fallbackProvider;
}

export function createManagedApiRuntime({ env = process.env, dependencies = {} } = {}) {
  const supportedProviders = Array.isArray(dependencies.supportedProviders) && dependencies.supportedProviders.length > 0
    ? dependencies.supportedProviders
    : SUPPORTED_MODEL_PROVIDERS;

  return {
    env,
    host: toText(env.MANAGED_API_HOST, DEFAULT_HOST),
    port: normalizePort(env.PORT || env.MANAGED_API_PORT),
    apiPrefix: normalizePath(env.MANAGED_API_PREFIX || DEFAULT_API_PREFIX),
    allowedOrigins: parseAllowedOrigins(env.MANAGED_API_ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN),
    bodyLimitBytes: DEFAULT_BODY_LIMIT_BYTES,
    dependencies: {
      supportedProviders,
      fetchAvailableModels: dependencies.fetchAvailableModels || fetchAvailableModelsDirect,
      transmuteVibeToSpec: dependencies.transmuteVibeToSpec || transmuteVibeToSpecDirect,
      recommendHybridStacks: dependencies.recommendHybridStacks || recommendHybridStacksDirect,
    },
  };
}

export function getProviderApiKey(provider, runtime) {
  const normalizedProvider = normalizeProvider(provider, runtime.dependencies.supportedProviders);
  const envName = PROVIDER_KEY_ENV[normalizedProvider];
  const key = toText(runtime.env[envName], '');

  if (!key) {
    throw new Error(`Missing server API key: ${envName}`);
  }

  return key;
}

export function getCorsHeaders(req, runtime) {
  const allowedOrigin = resolveAllowedOrigin(req?.headers?.origin, runtime.allowedOrigins);
  const varyHeader = allowedOrigin === DEFAULT_ALLOWED_ORIGIN ? {} : { Vary: 'Origin' };

  return {
    ...varyHeader,
    'Access-Control-Allow-Origin': allowedOrigin,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  };
}

export function sendJson(res, req, runtime, statusCode, payload, extraHeaders = {}) {
  res.writeHead(statusCode, {
    ...getCorsHeaders(req, runtime),
    'Content-Type': 'application/json; charset=utf-8',
    ...extraHeaders,
  });
  res.end(JSON.stringify(payload));
}

function parseJsonText(raw) {
  if (!raw) return {};

  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON body.');
  }
}

function normalizeBodyInput(body) {
  if (body == null) return '';
  if (typeof body === 'string') return body;
  if (Buffer.isBuffer(body)) return body.toString('utf8');
  if (typeof body === 'object') return body;
  return String(body);
}

export async function readJsonBody(req, runtime) {
  if (req?.body !== undefined) {
    const normalizedBody = normalizeBodyInput(req.body);
    if (typeof normalizedBody === 'object') {
      return normalizedBody;
    }

    if (Buffer.byteLength(normalizedBody, 'utf8') > runtime.bodyLimitBytes) {
      throw new Error('Request body is too large.');
    }

    return parseJsonText(normalizedBody);
  }

  let raw = '';

  for await (const chunk of req) {
    raw += typeof chunk === 'string' ? chunk : chunk.toString('utf8');
    if (Buffer.byteLength(raw, 'utf8') > runtime.bodyLimitBytes) {
      throw new Error('Request body is too large.');
    }
  }

  return parseJsonText(raw);
}

export function resolveRouteName(pathname, apiPrefix = DEFAULT_API_PREFIX) {
  const normalizedPath = normalizePath(pathname);
  const normalizedPrefix = normalizePath(apiPrefix);

  if (normalizedPath === `${normalizedPrefix}/health`) return 'health';
  if (normalizedPath === `${normalizedPrefix}/models`) return 'models';
  if (normalizedPath === `${normalizedPrefix}/transmute`) return 'transmute';
  if (normalizedPath === `${normalizedPrefix}/hybrid-stacks`) return 'hybrid-stacks';
  return '';
}

export function buildRoutePath(routeName, runtime) {
  const pathSegment = ROUTE_PATH_SEGMENTS[routeName] || '';
  return pathSegment ? `${runtime.apiPrefix}/${pathSegment}` : runtime.apiPrefix;
}

function buildRequestUrl(req, runtime) {
  return new URL(req.url || '/', `http://${req?.headers?.host || `${runtime.host}:${runtime.port}`}`);
}

function sendMethodNotAllowed(res, req, runtime, method, allowedMethods) {
  sendJson(res, req, runtime, 405, {
    error: `Method ${method} not allowed.`,
    allowed_methods: allowedMethods,
  }, {
    Allow: allowedMethods.join(', '),
  });
}

async function handleHealth(req, res, runtime, method) {
  if (method !== 'GET') {
    sendMethodNotAllowed(res, req, runtime, method, ['GET', 'OPTIONS']);
    return;
  }

  sendJson(res, req, runtime, 200, {
    ok: true,
    mode: 'managed',
    host: runtime.host,
    port: runtime.port,
    api_prefix: runtime.apiPrefix,
    allowed_origin: runtime.allowedOrigins.includes(DEFAULT_ALLOWED_ORIGIN)
      ? DEFAULT_ALLOWED_ORIGIN
      : runtime.allowedOrigins.join(','),
    providers: runtime.dependencies.supportedProviders,
  });
}

async function handleModels(req, res, runtime, method, requestUrl) {
  if (method !== 'GET') {
    sendMethodNotAllowed(res, req, runtime, method, ['GET', 'OPTIONS']);
    return;
  }

  const provider = normalizeProvider(
    requestUrl.searchParams.get('provider'),
    runtime.dependencies.supportedProviders,
  );
  const apiKey = getProviderApiKey(provider, runtime);
  const models = await runtime.dependencies.fetchAvailableModels(apiKey, { provider });

  sendJson(res, req, runtime, 200, {
    provider,
    models: Array.isArray(models) ? models : [],
  });
}

async function handleTransmute(req, res, runtime, method) {
  if (method !== 'POST') {
    sendMethodNotAllowed(res, req, runtime, method, ['POST', 'OPTIONS']);
    return;
  }

  const body = await readJsonBody(req, runtime);
  const vibe = toText(body?.vibe, '');
  if (!vibe) {
    sendJson(res, req, runtime, 400, { error: 'vibe is required.' });
    return;
  }

  const options = body?.options && typeof body.options === 'object' ? body.options : {};
  const provider = normalizeProvider(options.provider, runtime.dependencies.supportedProviders);
  const apiKey = getProviderApiKey(provider, runtime);
  const result = await runtime.dependencies.transmuteVibeToSpec(vibe, apiKey, {
    ...options,
    provider,
  });

  sendJson(res, req, runtime, 200, result);
}

async function handleHybridStacks(req, res, runtime, method) {
  if (method !== 'POST') {
    sendMethodNotAllowed(res, req, runtime, method, ['POST', 'OPTIONS']);
    return;
  }

  const body = await readJsonBody(req, runtime);
  const vibe = toText(body?.vibe, '');
  if (!vibe) {
    sendJson(res, req, runtime, 400, { error: 'vibe is required.' });
    return;
  }

  const options = body?.options && typeof body.options === 'object' ? body.options : {};
  const provider = normalizeProvider(options.provider, runtime.dependencies.supportedProviders);
  const apiKey = getProviderApiKey(provider, runtime);
  const standardOutput = body?.standardOutput && typeof body.standardOutput === 'object'
    ? body.standardOutput
    : {};

  const result = await runtime.dependencies.recommendHybridStacks(
    vibe,
    standardOutput,
    apiKey,
    {
      provider,
      modelName: toText(options.modelName, ''),
    },
  );

  sendJson(res, req, runtime, 200, result);
}

export async function handleManagedApiRoute(req, res, {
  runtime = createManagedApiRuntime(),
  routeName = '',
  pathname,
} = {}) {
  const method = String(req?.method || 'GET').toUpperCase();

  if (method === 'OPTIONS') {
    res.writeHead(204, getCorsHeaders(req, runtime));
    res.end();
    return;
  }

  const requestUrl = buildRequestUrl(req, runtime);
  const resolvedPathname = pathname || requestUrl.pathname;

  try {
    if (routeName === 'health') {
      await handleHealth(req, res, runtime, method);
      return;
    }

    if (routeName === 'models') {
      await handleModels(req, res, runtime, method, requestUrl);
      return;
    }

    if (routeName === 'transmute') {
      await handleTransmute(req, res, runtime, method);
      return;
    }

    if (routeName === 'hybrid-stacks') {
      await handleHybridStacks(req, res, runtime, method);
      return;
    }

    sendJson(res, req, runtime, 404, {
      error: 'Route not found.',
      route: resolvedPathname,
      expected_prefix: runtime.apiPrefix,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Managed API server error.';
    sendJson(res, req, runtime, 500, { error: message });
  }
}

export async function dispatchManagedApiRequest(req, res, runtime = createManagedApiRuntime()) {
  const requestUrl = buildRequestUrl(req, runtime);
  const routeName = resolveRouteName(requestUrl.pathname, runtime.apiPrefix);
  return handleManagedApiRoute(req, res, {
    runtime,
    routeName,
    pathname: requestUrl.pathname,
  });
}

export function createManagedApiRouteHandler(routeName, runtime = createManagedApiRuntime()) {
  return async function managedApiRouteHandler(req, res) {
    return handleManagedApiRoute(req, res, {
      runtime,
      routeName,
      pathname: buildRoutePath(routeName, runtime),
    });
  };
}
