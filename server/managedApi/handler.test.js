import test from 'node:test';
import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import {
  createManagedApiRuntime,
  dispatchManagedApiRequest,
  handleManagedApiRoute,
  resolveAllowedOrigin,
} from './handler.js';

function createMockRequest({ method = 'GET', url = '/api/health', headers = {}, body } = {}) {
  const chunks = body === undefined ? [] : [typeof body === 'string' ? body : JSON.stringify(body)];
  const req = Readable.from(chunks);
  req.method = method;
  req.url = url;
  req.headers = headers;
  return req;
}

function createMockResponse() {
  return {
    statusCode: 0,
    headers: {},
    body: '',
    writeHead(statusCode, headers) {
      this.statusCode = statusCode;
      this.headers = headers;
    },
    end(payload = '') {
      this.body += payload;
    },
  };
}

test('dispatchManagedApiRequest returns health payload for local server routing', async () => {
  const runtime = createManagedApiRuntime({
    env: {
      MANAGED_API_ALLOWED_ORIGIN: 'https://frontend.example.com',
    },
  });
  const req = createMockRequest({
    url: '/api/health',
    headers: {
      host: 'localhost:8787',
      origin: 'https://frontend.example.com',
    },
  });
  const res = createMockResponse();

  await dispatchManagedApiRequest(req, res, runtime);

  assert.equal(res.statusCode, 200);
  assert.equal(res.headers['Access-Control-Allow-Origin'], 'https://frontend.example.com');
  assert.equal(JSON.parse(res.body).ok, true);
});

test('models handler uses injected dependency and returns provider models', async () => {
  const runtime = createManagedApiRuntime({
    env: {
      GEMINI_API_KEY: 'gemini-secret',
      MANAGED_API_ALLOWED_ORIGIN: 'https://frontend.example.com',
    },
    dependencies: {
      supportedProviders: ['gemini'],
      fetchAvailableModels: async (apiKey, options) => {
        assert.equal(apiKey, 'gemini-secret');
        assert.deepEqual(options, { provider: 'gemini' });
        return ['gemini-2.5-pro'];
      },
    },
  });
  const req = createMockRequest({
    method: 'GET',
    url: '/api/models?provider=gemini',
    headers: {
      host: 'localhost:8787',
      origin: 'https://frontend.example.com',
    },
  });
  const res = createMockResponse();

  await handleManagedApiRoute(req, res, {
    runtime,
    routeName: 'models',
    pathname: '/api/models',
  });

  assert.equal(res.statusCode, 200);
  assert.deepEqual(JSON.parse(res.body), {
    provider: 'gemini',
    models: ['gemini-2.5-pro'],
  });
});

test('transmute handler rejects missing vibe with 400', async () => {
  const runtime = createManagedApiRuntime({
    env: {
      GEMINI_API_KEY: 'gemini-secret',
    },
    dependencies: {
      supportedProviders: ['gemini'],
      transmuteVibeToSpec: async () => ({ ok: true }),
    },
  });
  const req = createMockRequest({
    method: 'POST',
    url: '/api/transmute',
    headers: {
      host: 'localhost:8787',
    },
    body: {
      vibe: '   ',
      options: { provider: 'gemini' },
    },
  });
  const res = createMockResponse();

  await handleManagedApiRoute(req, res, {
    runtime,
    routeName: 'transmute',
    pathname: '/api/transmute',
  });

  assert.equal(res.statusCode, 400);
  assert.deepEqual(JSON.parse(res.body), { error: 'vibe is required.' });
});

test('resolveAllowedOrigin supports comma-separated origins', () => {
  assert.equal(
    resolveAllowedOrigin('https://preview.example.com', [
      'https://frontend.example.com',
      'https://preview.example.com',
    ]),
    'https://preview.example.com',
  );
});
