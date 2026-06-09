import type { AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

/**
 * В localStorage хранятся только настройки отображения (режим ранжирования).
 * Сами организации теперь живут в БД на сервере (см. utils/api.ts).
 */
const SETTINGS_KEY = 'auditrank_settings_v1';

export function getSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    const parsed = JSON.parse(raw);
    // Слияние с дефолтами на случай неполного/устаревшего сохранения.
    return {
      weights: { ...DEFAULT_SETTINGS.weights, ...parsed.weights },
      thresholds: { ...DEFAULT_SETTINGS.thresholds, ...parsed.thresholds },
      rankMode: parsed.rankMode === 'pj' ? 'pj' : 'score',
    };
  } catch { return DEFAULT_SETTINGS; }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
