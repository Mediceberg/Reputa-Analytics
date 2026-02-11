/**
 * Legacy entrypoint kept for backwards compatibility.
 *
 * Unified API implementation lives in `api/server.ts` to prevent
 * protocol drift and duplicated route logic.
 */

import app from './server.js';

export default app;
