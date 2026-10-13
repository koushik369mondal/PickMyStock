import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { env, getSafeConfig } from './config/env';
import stocksRoutes from './routes/stocks.routes';
import watchlistRoutes from './routes/watchlist.routes';
import { stocksController } from './controllers/stocks.controller';
import { bharatStockProvider } from './services/market-data/bharatstock.provider';

const app = express();

// Middlewares
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow localhost dev servers and matching configured origin
      if (!origin || origin.startsWith('http://localhost:') || origin === env.CORS_ORIGIN) {
        callback(null, true);
      } else {
        callback(null, true); // Permissive for local preview
      }
    },
    credentials: true,
  })
);

app.use(express.json());

// Request logger without leaking query strings with secrets
app.use((req: Request, _res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
});

// Health check endpoint
app.get('/api/health', async (_req: Request, res: Response) => {
  const safeConfig = getSafeConfig();
  let providerStatus = { status: 'unknown' };

  try {
    providerStatus = await bharatStockProvider.getDataStatus();
  } catch {
    providerStatus = { status: 'unreachable' };
  }

  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'PickMyStock API',
    version: '1.0.0',
    config: safeConfig,
    provider: providerStatus,
  });
});

// Main API routes
app.use('/api/stocks', stocksRoutes);
app.use('/api/watchlist', watchlistRoutes);
app.post('/api/agent/chat', (req, res) => stocksController.chat(req, res));

// Centralized error handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[PickMyStock Server Error]:', err.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'An unexpected internal server error occurred',
  });
});

// Start server
if (process.env.NODE_ENV !== 'test') {
  app.listen(env.PORT, () => {
    console.log(`=======================================================`);
    console.log(` PickMyStock Server running at http://localhost:${env.PORT}`);
    console.log(` Environment: ${env.NODE_ENV}`);
    console.log(` BharatStock Integration: ${env.BHARATSTOCK_API_KEY ? 'Active (Key Configured)' : 'Missing Key'}`);
    console.log(` AI Provider: ${env.AI_PROVIDER}`);
    console.log(`=======================================================`);
  });
}

export default app;
