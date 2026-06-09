import { createApp } from './app.js';
import { config } from './config/env.js';
import { initDb } from './data/db.js';

async function start(): Promise<void> {
  await initDb();

  const app = createApp();
  app.listen(config.port, () => {
    console.log(`AuditRank API запущен на http://localhost:${config.port} (${config.nodeEnv})`);
  });
}

start().catch(err => {
  console.error('Не удалось запустить сервер:', err);
  process.exit(1);
});
