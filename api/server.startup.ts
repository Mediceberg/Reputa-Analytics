import { Express } from 'express';
import { connectMongoDB } from '../server/db/mongoModels';

export async function startUnifiedServer(app: Express, port: number) {
  try {
    await connectMongoDB();
    if (!process.env.VERCEL) {
      app.listen(port, '0.0.0.0', () => {
        console.log(`🚀 Unified API Server ready at http://0.0.0.0:${port}`);
      });
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
  }
}
