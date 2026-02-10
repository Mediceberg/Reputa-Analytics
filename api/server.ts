import 'dotenv/config.js';
import app from './server.app';
import { startUnifiedServer } from './server.startup';

const PORT = Number(process.env.PORT) || 3001;

const shouldStart = !process.env.VERCEL && process.argv[1]?.includes('api/server');
if (shouldStart) {
  startUnifiedServer(app, PORT);
}

export default app;
