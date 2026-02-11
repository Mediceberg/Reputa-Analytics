import 'dotenv/config.js';

import app from './server.app.js';
import { startUnifiedServer } from './server.startup.js';

const PORT = Number(process.env.PORT) || 3001;

const entryArg = process.argv[1] ?? '';
const isDevStart = !process.env.VERCEL && (entryArg.includes('api/server') || entryArg.endsWith('/server.ts'));

if (isDevStart) {
  startUnifiedServer(app, PORT);
}

export default app;
