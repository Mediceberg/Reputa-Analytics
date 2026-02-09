import express from 'express';   
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import apiApp from '../api/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  
  app.use(express.json());

  // Mount unified API routes
  app.use(apiApp);

  // Create Vite dev server in middleware mode
  const vite = await createViteServer({
    server: { 
      middlewareMode: true,
      hmr: {
        port: 24678,
      },
    },
    appType: 'spa',
  });

  app.use(vite.middlewares);

  const PORT = 5000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Dev server running at http://0.0.0.0:${PORT}`);
    console.log(`📡 API routes mounted at /api/*`);
  });
}

startServer().catch(console.error);
