import type {
  AuditOrg, OrgKScores, OrgWithRating, RatingLevel,
  Weights, Thresholds, RankMode,
} from '../types';
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, RATING_LEVELS } from '../types';
import { MAX_TOTAL_SCORE } from './indicatorOptions';

const GROUP_A_KEYS = ['k1','k2','k3','k4','k5','k6'] as const;
const GROUP_B_KEYS = ['k7','k8','k9','k10','k11','k12','k13','k14','k15','k16','k17','k18','k19','k20','k21'] as const;
const GROUP_C_KEYS = ['k22','k23','k24','k25'] as const;

/** Максимально возможная сумма баллов — из шкал показателей (для режима «по сумме»). */
export const MAX_TOTAL = MAX_TOTAL_SCORE;

function sumKeys(scores: OrgKScores, keys: readonly string[]): number {
  return keys.reduce((s, k) => s + (scores[k as keyof OrgKScores] ?? 0), 0);
}

/** Присвоение уровня по нормализованному качеству Q (%) сверху вниз по порогам. */
function levelForQ(q: number, thresholds: Thresholds): RatingLevel {
  for (const lvl of RATING_LEVELS) {
    if (lvl === 'C') break;
    if (q >= thresholds[lvl]) return lvl;
  }
  return 'C';
}

export function computeRatings(
  orgs: AuditOrg[],
  weights: Weights = DEFAULT_WEIGHTS,
  thresholds: Thresholds = DEFAULT_THRESHOLDS,
  rankMode: RankMode = 'score',
): OrgWithRating[] {
  if (orgs.length === 0) return [];

  const raw = orgs.map(org => ({
    org,
    sumA: sumKeys(org.kScores, GROUP_A_KEYS),
    sumB: sumKeys(org.kScores, GROUP_B_KEYS),
    sumC: sumKeys(org.kScores, GROUP_C_KEYS),
  }));

  // Лучший результат по каждой группе среди всех организаций (оптимум для нормализации x).
  const maxA = Math.max(...raw.map(d => d.sumA), 0);
  const maxB = Math.max(...raw.map(d => d.sumB), 0);
  const maxC = Math.max(...raw.map(d => d.sumC), 0);

  const W = weights.a + weights.b + weights.c;
  const maxPj = Math.sqrt(W) || 1;

  return raw.map(({ org, sumA, sumB, sumC }) => {
    const totalScore = sumA + sumB + sumC;
    const x1 = maxA > 0 ? sumA / maxA : 1;
    const x2 = maxB > 0 ? sumB / maxB : 1;
    const x3 = maxC > 0 ? sumC / maxC : 1;
    const pj = Math.sqrt(
      weights.a * (1 - x1) ** 2 +
      weights.b * (1 - x2) ** 2 +
      weights.c * (1 - x3) ** 2,
    );
    // Q (%), больше = лучше. В режиме «по сумме» — доля от максимума; по методике — обратная к Pj.
    const q = rankMode === 'score'
      ? (MAX_TOTAL > 0 ? (totalScore / MAX_TOTAL) * 100 : 0)
      : Math.max(0, Math.min(100, (1 - pj / maxPj) * 100));
    return { ...org, sumA, sumB, sumC, totalScore, pj, q, level: levelForQ(q, thresholds) };
  });
}
