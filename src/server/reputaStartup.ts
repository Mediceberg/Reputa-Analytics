/**
 * Reputa Protocol - Unified Initialization
 * Delegates to the single Express app in /api/server.ts.
 */

import app from '../../api/server.js';

export async function initializeReputaServer(): Promise<typeof app> {
  return app;
}

export default initializeReputaServer;
