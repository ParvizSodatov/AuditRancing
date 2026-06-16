/**
 * Сид тестовых организаций — по одной на каждый уровень рейтинга (A++ … C).
 * Нужен для визуальной проверки цветов бейджей уровней на странице результатов.
 *
 * Запуск из папки backend:  npx tsx scripts/seed-test-orgs.ts
 *
 * Уровень в режиме «по сумме» (дефолт) = total / 250 × 100, где total — сумма
 * баллов 25 показателей. Здесь каждой организации задаётся ровно столько
 * «десяток» (по 10 баллов на показатель), чтобы Q попал в нужный порог:
 *   A++ ≥90 · A+ ≥80 · A ≥70 · B++ ≥60 · B+ ≥50 · B ≥40 · C++ ≥30 · C+ ≥20 · C <20
 */
import { randomUUID } from 'node:crypto';
import { pool } from '../src/data/db.js';
import { orgStore } from '../src/data/orgStore.js';
import type { OrgKScores } from '../src/types/index.js';

// Порядок ключей k1..k25 (A: k1-6, B: k7-21, C: k22-25).
const KEYS: (keyof OrgKScores)[] = [
  'k1','k2','k3','k4','k5','k6',
  'k7','k8','k9','k10','k11','k12','k13','k14','k15','k16','k17','k18','k19','k20','k21',
  'k22','k23','k24','k25',
];

/** Ставит первым `tens` показателям по 10 баллов, остальным 0 → total = tens × 10. */
function scoresWithTens(tens: number): Partial<OrgKScores> {
  const out: Partial<OrgKScores> = {};
  KEYS.forEach((k, i) => { out[k] = i < tens ? 10 : 0; });
  return out;
}

// tens подобраны так, чтобы Q = tens × 10 / 250 × 100 = tens × 4 попал в порог.
const PLAN: { name: string; tens: number; expect: string }[] = [
  { name: 'ТЕСТ A++ — Аудит-Эталон',      tens: 24, expect: 'A++' }, // Q=96
  { name: 'ТЕСТ A+ — Премиум-Аудит',      tens: 21, expect: 'A+'  }, // Q=84
  { name: 'ТЕСТ A — Стандарт-Аудит',      tens: 19, expect: 'A'   }, // Q=76
  { name: 'ТЕСТ B++ — Профи-Консалт',     tens: 16, expect: 'B++' }, // Q=64
  { name: 'ТЕСТ B+ — Бизнес-Аудит',       tens: 13, expect: 'B+'  }, // Q=52
  { name: 'ТЕСТ B — Регион-Аудит',        tens: 11, expect: 'B'   }, // Q=44
  { name: 'ТЕСТ C++ — Старт-Аудит',       tens: 8,  expect: 'C++' }, // Q=32
  { name: 'ТЕСТ C+ — Малый-Аудит',        tens: 6,  expect: 'C+'  }, // Q=24
  { name: 'ТЕСТ C — Базовый-Аудит',       tens: 4,  expect: 'C'   }, // Q=16
];

async function main(): Promise<void> {
  for (const { name, tens, expect } of PLAN) {
    await orgStore.save({
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      kScores: { ...scoresWithTens(tens) } as OrgKScores,
    });
    console.log(`+ ${name}  (total=${tens * 10}, ожидается ${expect})`);
  }
  console.log(`\nГотово: добавлено ${PLAN.length} тестовых организаций.`);
  console.log('Проверяй на странице результатов в режиме «по сумме» (дефолт).');
  await pool.end();
}

main().catch(err => {
  console.error('Ошибка сидирования:', err);
  process.exit(1);
});
