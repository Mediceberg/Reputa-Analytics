/**
 * Reputa API Server v3.0
 * 
 * Key changes from v2:
 * - MongoDB as primary source (not Redis)
 * - Redis for caching only (5-minute TTL)
 * - Single protocol implementation (v3.0)
 * - Unified scoring: 80% wallet + 20% app engagement
 * - 20 levels, 0-100000 points
 */

import express from 'express';
import cors from 'cors';
import { connectMongoDB, closeMongoDb } from './db/mongoModels';
import v3ReputationRoutes from '../api/v3ReputationRoutes';

const app = express();
const PORT = process.env.PORT || 3000;

// ====================
// MIDDLEWARE
// ====================

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Request logging
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ====================
// HEALTH CHECK
// ====================

app.get('/health', (req, res) => {
  res.json({
    status: 'Reputa API v3.0 Operational',
    timestamp: new Date().toISOString(),
    protocol: {
      version: '3.0',
      database: 'MongoDB',
      cache: 'Redis (5-min TTL)',
    }
  });
});

// ====================
// V3 REPUTATION API
// ====================

app.use('/api', v3ReputationRoutes);

// ====================
// LEGACY ENDPOINTS (DEPRECATED)
// ====================

// Redirect old endpoints to v3
app.get('/api/reputation', (req, res) => {
  return res.status(301).json({
    message: 'Endpoint moved',
    newEndpoint: '/api/v3/reputation',
    note: 'Please migrate to API v3.0'
  });
});

app.post('/api/reputation', (req, res) => {
  return res.status(301).json({
    message: 'Endpoint moved',
    newEndpoint: '/api/v3/reputation/*',
    note: 'Please migrate to API v3.0'
  });
});

// ====================
// ERROR HANDLING
// ====================

app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: 'Not found',
    availableEndpoints: {
      v3: '/api/v3/*',
      health: '/health'
    }
  });
});

// ====================
// STARTUP
// ====================

async function start() {
  try {
    console.log('\n' + '='.repeat(80));
    console.log('🚀 REPUTA API SERVER v3.0');
    console.log('='.repeat(80) + '\n');
    
    // Connect to MongoDB
    console.log('📊 Initializing MongoDB...');
    await connectMongoDB();
    console.log('✅ MongoDB initialized\n');
    
    // Start server
    const server = app.listen(PORT, () => {
      console.log(`🌐 Server listening on port ${PORT}`);
      console.log(`📍 API Base URL: http://localhost:${PORT}/api`);
      console.log(`💚 Health Check: http://localhost:${PORT}/health`);
      console.log('\n' + '='.repeat(80));
      console.log('✅ Server Ready for Requests');
      console.log('='.repeat(80) + '\n');
    });
    
    // Graceful shutdown
    process.on('SIGTERM', async () => {
      console.log('\n📛 SIGTERM received, shutting down gracefully...');
      server.close(async () => {
        await closeMongoDb();
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });
    
    process.on('SIGINT', async () => {
      console.log('\n📛 SIGINT received, shutting down gracefully...');
      server.close(async () => {
        await closeMongoDb();
        console.log('✅ Server stopped');
        process.exit(0);
      });
    });
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
start();

export default app;
