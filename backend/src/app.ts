import express from 'express';
import cors, { type CorsOptions } from 'cors';
import { config } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

// Список разрешённых origin: поддерживает несколько через запятую и игнорирует
// случайный слэш в конце (частая причина «битого» CORS).
const allowedOrigins = config.corsOrigin
  .split(',')
  .map(o => o.trim().replace(/\/+$/, ''))
  .filter(Boolean);

const corsOptions: CorsOptions = {
  origin: allowedOrigins.includes('*')
    ? true
    : (origin, callback) => {
        // Запросы без Origin (curl, серверные обращения) — пропускаем.
        if (!origin) return callback(null, true);
        callback(null, allowedOrigins.includes(origin.replace(/\/+$/, '')));
      },
};

/** Создаёт и настраивает экземпляр Express-приложения. */
export function createApp() {
  const app = express();

  app.use(cors(corsOptions));
  app.use(express.json());

  app.use('/api', routes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
