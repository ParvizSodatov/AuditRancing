export type RatingLevel = 'A++' | 'A+' | 'A' | 'B++' | 'B+' | 'B' | 'C++' | 'C+' | 'C';

export interface OrgKScores {
  k1: number; k2: number; k3: number; k4: number; k5: number; k6: number;
  k7: number; k8: number; k9: number; k10: number; k11: number; k12: number;
  k13: number; k14: number; k15: number; k16: number; k17: number; k18: number;
  k19: number; k20: number; k21: number;
  k22: number; k23: number; k24: number; k25: number;
}

export const DEFAULT_SCORES: OrgKScores = {
  k1:0,k2:0,k3:0,k4:0,k5:0,k6:0,
  k7:0,k8:0,k9:0,k10:0,k11:0,k12:0,
  k13:0,k14:0,k15:0,k16:0,k17:0,k18:0,
  k19:0,k20:0,k21:0,
  k22:0,k23:0,k24:0,k25:0,
};

export interface AuditOrg {
  id: string;
  name: string;
  createdAt: string;
  kScores: OrgKScores;
}

export interface OrgWithRating extends AuditOrg {
  sumA: number;
  sumB: number;
  sumC: number;
  totalScore: number;
  pj: number;
  q: number;
  level: RatingLevel;
}

/** Режим ранжирования: по сумме баллов или по методике (Pj). */
export type RankMode = 'score' | 'pj';

/** Весовые коэффициенты групп показателей А / Б / В. */
export interface Weights {
  a: number;
  b: number;
  c: number;
}

/** Пороги уровня по нормализованному качеству Q (%) для всех уровней, кроме нижнего «C». */
export type Thresholds = Record<Exclude<RatingLevel, 'C'>, number>;

/** Настраиваемые параметры методики, сохраняемые между сессиями. */
export interface AppSettings {
  weights: Weights;
  thresholds: Thresholds;
  rankMode: RankMode;
}

/** Уровни от высшего к низшему — порядок важен для присвоения по порогам. */
export const RATING_LEVELS: RatingLevel[] = [
  'A++', 'A+', 'A', 'B++', 'B+', 'B', 'C++', 'C+', 'C',
];

export const DEFAULT_WEIGHTS: Weights = { a: 0.75, b: 2, c: 2.5 };

// В инструкции пороги не заданы — значения по умолчанию.
export const DEFAULT_THRESHOLDS: Thresholds = {
  'A++': 90, 'A+': 80, 'A': 70, 'B++': 60, 'B+': 50, 'B': 40, 'C++': 30, 'C+': 20,
};

export const DEFAULT_SETTINGS: AppSettings = {
  weights: DEFAULT_WEIGHTS,
  thresholds: DEFAULT_THRESHOLDS,
  rankMode: 'score',
};
