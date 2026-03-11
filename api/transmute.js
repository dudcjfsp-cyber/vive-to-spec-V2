import { createManagedApiRouteHandler } from '../server/managedApi/handler.js';

export const maxDuration = 60;
const handler = createManagedApiRouteHandler('transmute');

export default handler;
