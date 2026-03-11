import { createServer } from 'node:http';
import { createManagedApiRuntime, dispatchManagedApiRequest } from './managedApi/handler.js';

const runtime = createManagedApiRuntime();

const server = createServer(async (req, res) => {
  await dispatchManagedApiRequest(req, res, runtime);
});

server.listen(runtime.port, runtime.host, () => {
  console.log(`[managed-api] listening at http://${runtime.host}:${runtime.port}${runtime.apiPrefix}`);
});
