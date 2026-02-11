import { Express } from 'express';
import { connectMongoDB } from '../server/db/mongoModels.js';

export async function startUnifiedServer(app: Express, port: number) {
  if (process.env.VERCEL) {
    return;
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Unified API Server ready at http://0.0.0.0:${port}`);
  });

  try {
    await connectMongoDB();
  } catch (error) {
    console.error('⚠️ MongoDB connection failed on startup (API still running):', error);
  }
}
