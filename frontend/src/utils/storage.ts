import type { AuditOrg, AppSettings } from '../types';
import { DEFAULT_SETTINGS } from '../types';

const KEY = 'auditrank_v2';
const SETTINGS_KEY = 'auditrank_settings_v1';

export function getOrgs(): AuditOrg[] {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); }
  catch { return []; }
}

export function saveOrg(org: AuditOrg): void {
  const list = getOrgs();
  const idx = list.findIndex(o => o.id === org.id);
  if (idx >= 0) list[idx] = org; else list.push(org);
  localStorage.setItem(KEY, JSON.stringify(list));
}

export function deleteOrg(id: string): void {
  localStorage.setItem(KEY, JSON.stringify(getOrgs().filter(o => o.id !== id)));
}

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

/** Сброс всех данных: удаляет организации и возвращает настройки по умолчанию. */
export function resetAll(): void {
  localStorage.removeItem(KEY);
  localStorage.removeItem(SETTINGS_KEY);
}
