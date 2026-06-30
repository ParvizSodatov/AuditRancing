import type { TFunction } from 'i18next';
import type { OrgKScores } from '../types';
import { UNSET } from '../types';

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
  /**
   * Баллы вариантов в порядке таблицы Приложения — по убыванию (10 → … → 0).
   * Число и порядок баллов точно совпадают с подписями в словарях i18n.
   * Нулевая строка из таблицы (например, «доход отсутствует» = 0) входит сюда
   * явно как настоящий ответ. Вариант «не выбрано» (UNSET) сюда НЕ входит — его
   * добавляет getIndicatorGroups первым пунктом для всех показателей.
   */
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
      { key: 'k1', code: 'K1', scores: [10, 8, 4, 2, 0] },
      { key: 'k2', code: 'K2', scores: [10, 8, 4, 0] },
      { key: 'k3', code: 'K3', scores: [10, 8, 4, 0] },
      { key: 'k4', code: 'K4', scores: [10, 8, 4, 0] },
      { key: 'k5', code: 'K5', scores: [10, 8, 4, 2] },
      { key: 'k6', code: 'K6', scores: [10, 8, 4] },
    ],
  },
  {
    id: 'B',
    indicators: [
      { key: 'k7', code: 'K7', scores: [10, 6, 4] },
      { key: 'k8', code: 'K8', scores: [10, 8, 6, 4] },
      { key: 'k9', code: 'K9', scores: [10, 8, 6, 4, 2] },
      { key: 'k10', code: 'K10', scores: [10, 6, 4, 0] },
      { key: 'k11', code: 'K11', scores: [10, 4, 0] },
      { key: 'k12', code: 'K12', scores: [10, 4, 0] },
      { key: 'k13', code: 'K13', scores: [10, 4, 0] },
      { key: 'k14', code: 'K14', scores: [2] },
      { key: 'k15', code: 'K15', scores: [2] },
      { key: 'k16', code: 'K16', scores: [10, 4, 0] },
      { key: 'k17', code: 'K17', scores: [10, 0] },
      { key: 'k18', code: 'K18', scores: [10, 0] },
      { key: 'k19', code: 'K19', scores: [10, 6, 4, 0] },
      { key: 'k20', code: 'K20', scores: [10, 6, 4, 0] },
      { key: 'k21', code: 'K21', scores: [10, 8, 4, 2] },
    ],
  },
  {
    id: 'C',
    indicators: [
      { key: 'k22', code: 'K22', scores: [10, 8, 6, 4] },
      { key: 'k23', code: 'K23', scores: [10, 8, 4, 2] },
      { key: 'k24', code: 'K24', scores: [10, 0] },
      { key: 'k25', code: 'K25', scores: [10, 4, 0] },
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
        // Первым — «не выбрано» (UNSET, незаполнено), затем баллы по убыванию из таблицы.
        options: [
          { label: tr('indicators.none'), score: UNSET },
          ...ind.scores.map((score, i) => ({ label: labels[i], score })),
        ],
      };
    }),
  }));
}
