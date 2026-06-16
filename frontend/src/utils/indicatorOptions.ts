import type { TFunction } from 'i18next';
import type { OrgKScores } from '../types';

export interface IndicatorOption {
  label: string;
  score: number;
}

export interface IndicatorDef {
  key: string;
  code: string;
  name: string;
  options: IndicatorOption[];
}

export interface IndicatorGroup {
  id: 'A' | 'B' | 'C';
  label: string;
  indicators: IndicatorDef[];
}

/**
 * Структурное описание показателей: ключ, код и баллы вариантов.
 * Это «данные» методики — значения баллов, коды и ключи неизменны и
 * не зависят от языка. Человекочитаемый текст (название группы, название
 * показателя и подписи вариантов) берётся из словарей i18n по ключу.
 */
interface IndicatorStruct {
  key: keyof OrgKScores;
  code: string;
  /** Баллы вариантов в том же порядке, что и подписи в словарях (без варианта «не задано»). */
  scores: number[];
}

interface GroupStruct {
  id: 'A' | 'B' | 'C';
  indicators: IndicatorStruct[];
}

const STRUCT: GroupStruct[] = [
  {
    id: 'A',
    indicators: [
      { key: 'k1', code: 'K1', scores: [4, 8, 10] },
      { key: 'k2', code: 'K2', scores: [4, 8, 10] },
      { key: 'k3', code: 'K3', scores: [4, 8, 10] },
      { key: 'k4', code: 'K4', scores: [5, 8, 10] },
      { key: 'k5', code: 'K5', scores: [2, 5, 8, 10] },
      { key: 'k6', code: 'K6', scores: [4, 8, 10] },
    ],
  },
  {
    id: 'B',
    indicators: [
      { key: 'k7', code: 'K7', scores: [4, 6, 10] },
      { key: 'k8', code: 'K8', scores: [4, 6, 8, 10] },
      { key: 'k9', code: 'K9', scores: [2, 4, 6, 8, 10] },
      { key: 'k10', code: 'K10', scores: [4, 6, 10] },
      { key: 'k11', code: 'K11', scores: [5, 10] },
      { key: 'k12', code: 'K12', scores: [5, 10] },
      { key: 'k13', code: 'K13', scores: [5, 10] },
      { key: 'k14', code: 'K14', scores: [2.5, 5, 7.5, 10] },
      { key: 'k15', code: 'K15', scores: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
      { key: 'k16', code: 'K16', scores: [10] },
      { key: 'k17', code: 'K17', scores: [10] },
      { key: 'k18', code: 'K18', scores: [10] },
      { key: 'k19', code: 'K19', scores: [6, 8, 10] },
      { key: 'k20', code: 'K20', scores: [6, 8, 10] },
      { key: 'k21', code: 'K21', scores: [2, 4, 7, 10] },
    ],
  },
  {
    id: 'C',
    indicators: [
      { key: 'k22', code: 'K22', scores: [4, 6, 8, 10] },
      { key: 'k23', code: 'K23', scores: [3, 5, 7, 10] },
      { key: 'k24', code: 'K24', scores: [10] },
      { key: 'k25', code: 'K25', scores: [5, 10] },
    ],
  },
];

/** Ключи всех 25 показателей — для проверок заполненности (не зависят от языка). */
export const ALL_INDICATOR_KEYS: (keyof OrgKScores)[] =
  STRUCT.flatMap(g => g.indicators.map(ind => ind.key));

/** Максимально возможная сумма баллов — из шкал показателей (не зависит от языка). */
export const MAX_TOTAL_SCORE: number = STRUCT.reduce(
  (sum, g) => sum + g.indicators.reduce((s, ind) => s + Math.max(...ind.scores), 0),
  0,
);

/**
 * Собирает группы показателей с подписями на текущем языке.
 * Баллы/коды/ключи берутся из STRUCT, текст — из словарей i18n.
 */
export function getIndicatorGroups(t: TFunction): IndicatorGroup[] {
  // Ключи здесь динамические (собираются из STRUCT), поэтому обращаемся к t
  // через нестрогую сигнатуру — типизированные литеральные ключи тут неприменимы.
  const tr = t as unknown as (key: string, options?: Record<string, unknown>) => string;
  const trArr = t as unknown as (key: string, options: { returnObjects: true }) => string[];
  return STRUCT.map(group => ({
    id: group.id,
    label: tr(`indicators.group.${group.id}`),
    indicators: group.indicators.map(ind => {
      const labels = trArr(`indicators.${ind.key}.options`, { returnObjects: true });
      return {
        key: ind.key,
        code: ind.code,
        name: tr(`indicators.${ind.key}.name`),
        options: [
          { label: tr('indicators.none'), score: 0 },
          ...ind.scores.map((score, i) => ({ label: labels[i], score })),
        ],
      };
    }),
  }));
}
