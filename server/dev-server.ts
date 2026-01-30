import express from 'express';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  
  app.use(cors({
    origin: true,
    credentials: true,
  }));
  
  app.use(express.json());

  // Import API handlers dynamically
  const reputationHandler = await import('../api/reputation.js');
  const userHandler = await import('../api/user.js');
  const authHandler = await import('../api/auth.js');
  const walletHandler = await import('../api/wallet.js');
  const paymentsHandler = await import('../api/payments.js');
  const top100Handler = await import('../api/top100.js');
  const adminHandler = await import('../api/admin.js');

  // Create mock request/response adapters for Vercel-style handlers
  const createVercelAdapter = (handler: any) => {
    return async (req: express.Request, res: express.Response) => {
      const vercelReq = {
        method: req.method,
        url: req.url,
        query: req.query,
        body: req.body,
        headers: req.headers,
      };

      const vercelRes = {
        status: (code: number) => ({
          json: (data: any) => res.status(code).json(data),
          end: () => res.status(code).end(),
          send: (data: any) => res.status(code).send(data),
        }),
        json: (data: any) => res.json(data),
        end: () => res.end(),
        setHeader: (name: string, value: string) => res.setHeader(name, value),
      };

      try {
        await handler.default(vercelReq, vercelRes);
      } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ error: 'Internal Server Error' });
      }
    };
  };

  // Mount API routes
  app.all('/api/reputation', createVercelAdapter(reputationHandler));
  app.all('/api/user', createVercelAdapter(userHandler));
  app.all('/api/auth', createVercelAdapter(authHandler));
  app.all('/api/wallet', createVercelAdapter(walletHandler));
  app.all('/api/payments', createVercelAdapter(paymentsHandler));
  app.all('/api/top100', createVercelAdapter(top100Handler));
  app.all('/api/admin', createVercelAdapter(adminHandler));

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
