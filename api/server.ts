import 'dotenv/config.js';
import app from './server.app';
import { startUnifiedServer } from './server.startup';

const PORT = Number(process.env.PORT) || 3001;
const entryArg = process.argv[1] ?? '';

// Keep startup guard broad to support tsx/ts-node and compiled JS paths.
const shouldStart = !process.env.VERCEL && (entryArg.includes('api/server') || entryArg.endsWith('/server.ts') || entryArg.endsWith('/server.js'));
if (shouldStart) {
  void startUnifiedServer(app, PORT);
}

export default app;
