import { createManagedApiRouteHandler } from '../server/managedApi/handler.js';

export const maxDuration = 60;
const handler = createManagedApiRouteHandler('hybrid-stacks');

export default handler;
