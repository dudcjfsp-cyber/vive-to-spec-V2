import { createManagedApiRouteHandler } from '../server/managedApi/handler.js';

export const maxDuration = 60;
const handler = createManagedApiRouteHandler('health');

export default handler;
