import express from 'express';
import cors from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

/** Создаёт и настраивает экземпляр Express-приложения. */
export function createApp() {
  const app = express();

  app.use(cors({ origin: config.corsOrigin }));
  app.use(express.json());

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
