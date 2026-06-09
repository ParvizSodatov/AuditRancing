import { useState, useEffect, useCallback } from 'react';
import type { AuditOrg, OrgWithRating, RankMode } from './types';
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from './types';
import { computeRatings } from './utils/ratingCalculator';
import { getSettings, saveSettings } from './utils/storage';
import { api } from './utils/api';
import RatingBadge from './components/RatingBadge';
import OrgEditor from './pages/OrgEditor';
import ResultsPage from './pages/ResultsPage';
import ChartsPage from './pages/ChartsPage';

type Tab = 'orgs' | 'results' | 'charts';

const NAV_TABS: { id: Tab; label: string }[] = [
  { id: 'orgs', label: 'Организации' },
  { id: 'results', label: 'Результаты' },
  { id: 'charts', label: 'Аналитика' },
];

export default function App() {
  const [orgs, setOrgs] = useState<AuditOrg[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('orgs');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rankMode, setRankMode] = useState<RankMode>(() => getSettings().rankMode);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Загрузка списка с сервера. Возвращает актуальный список для последующей логики.
  const reload = useCallback(async (): Promise<AuditOrg[]> => {
    try {
      const list = await api.listOrgs();
      setOrgs(list);
      setError(null);
      return list;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось загрузить данные с сервера');
      return [];
    }
  }, []);

  // Первичная загрузка организаций из БД.
  useEffect(() => {
    (async () => {
      setLoading(true);
      const list = await reload();
      setSelectedId(prev => prev ?? list[0]?.id ?? null);
      setLoading(false);
    })();
  }, [reload]);

  // Сохранение режима ранжирования между сессиями.
  useEffect(() => {
    saveSettings({ weights: DEFAULT_WEIGHTS, thresholds: DEFAULT_THRESHOLDS, rankMode });
  }, [rankMode]);

  const rated: OrgWithRating[] = computeRatings(orgs, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, rankMode);
  const selected = rated.find(o => o.id === selectedId) ?? null;

  const openAdd = () => { setNewName(''); setAddOpen(true); };

  const confirmAdd = async () => {
    const name = newName.trim() || `Организация ${orgs.length + 1}`;
    try {
      const created = await api.createOrg({ name });
      await reload();
      setSelectedId(created.id);
      setActiveTab('orgs');
      setAddOpen(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать организацию');
    }
  };

  const handleSave = useCallback(async (org: AuditOrg) => {
    try {
      await api.updateOrg(org.id, { name: org.name, kScores: org.kScores });
      await reload();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось сохранить изменения');
    }
  }, [reload]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await api.deleteOrg(id);
      const updated = await reload();
      setSelectedId(prev => prev === id ? (updated[0]?.id ?? null) : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось удалить организацию');
    }
  }, [reload]);

  return (
    <div style={{ background: '#ede8d8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <header style={{ background: '#1a1e2e', borderBottom: '3px solid #c9a84c', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#c9a84c', color: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '13px', flexShrink: 0 }}>
              МФ
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', lineHeight: 1 }}>
                Рейтинг аудиторских организаций
              </div>
              <div style={{ color: '#8a7e6a', fontSize: '11px', marginTop: '3px' }}>
                Система присвоения рейтингов надёжности и качества услуг · рабочее место рейтингового органа
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <nav style={{ display: 'flex', gap: '2px' }}>
              {NAV_TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    padding: '6px 16px',
                    fontSize: '14px',
                    fontWeight: 500,
                    background: 'transparent',
                    border: 'none',
                    borderBottom: activeTab === tab.id ? '2px solid #c9a84c' : '2px solid transparent',
                    color: activeTab === tab.id ? '#c9a84c' : '#8a7e6a',
                    cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
            <span style={{ color: '#8a7e6a', fontSize: '13px' }}>{orgs.length} орг.</span>
          </div>
        </div>
      </header>

      {/* ── Баннер ошибки соединения с API ── */}
      {error && (
        <div style={{ background: '#fbeeee', borderBottom: '1px solid #e8aeae', color: '#b03030', padding: '10px 24px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <span>⚠ {error}. Проверьте, что бэкенд запущен (npm run dev в папке backend).</span>
          <button
            onClick={() => { setLoading(true); reload().finally(() => setLoading(false)); }}
            style={{ flexShrink: 0, border: '1px solid #e8aeae', background: '#fff', color: '#b03030', borderRadius: '6px', padding: '5px 12px', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
          >
            Повторить
          </button>
        </div>
      )}

      {/* ── BODY ── */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', width: '100%', display: 'flex', flex: 1 }}>
        {/* ── SIDEBAR ── */}
        <aside style={{ width: '272px', flexShrink: 0, borderRight: '1px solid #d4c8ae', background: '#ede8d8', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '12px' }}>
            <button
              onClick={openAdd}
              style={{ width: '100%', background: '#1a1e2e', color: '#fff', border: 'none', borderRadius: '8px', padding: '11px 16px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(0,0,0,0.15)', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#2a3047'; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#1a1e2e'; }}
            >
              + Добавить организацию
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {rated.length === 0 && (
              <p style={{ color: '#9a8a70', fontSize: '12px', textAlign: 'center', padding: '24px 16px' }}>
                {loading ? 'Загрузка…' : 'Нет организаций. Нажмите «Добавить».'}
              </p>
            )}
            {rated.map(org => (
              <button
                key={org.id}
                onClick={() => { setSelectedId(org.id); setActiveTab('orgs'); }}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '10px 16px',
                  background: selectedId === org.id ? '#ddd4be' : 'transparent',
                  borderLeft: selectedId === org.id ? '3px solid #c9a84c' : '3px solid transparent',
                  border: 'none',
                  borderBottom: '1px solid #ddd5c0',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (selectedId !== org.id) (e.currentTarget as HTMLElement).style.background = '#ddd4be'; }}
                onMouseLeave={e => { if (selectedId !== org.id) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span style={{ color: '#2c2820', fontSize: '13px', fontWeight: 500, flex: 1, marginRight: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {org.name}
                </span>
                <RatingBadge level={org.level} size="sm" />
              </button>
            ))}
          </div>
        </aside>

        {/* ── MAIN ── */}
        <main style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
          {activeTab === 'orgs' && (
            selected
              ? <OrgEditor org={selected} onSave={handleSave} onDelete={handleDelete} />
              : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#9a8a70', fontSize: '14px' }}>
                  Выберите организацию слева или добавьте новую.
                </div>
              )
          )}
          {activeTab === 'results' && <ResultsPage orgs={rated} mode={rankMode} onMode={setRankMode} />}
          {activeTab === 'charts' && <ChartsPage orgs={rated} />}
        </main>
      </div>

      {/* ── Модалка создания организации ── */}
      {addOpen && (
        <div
          onClick={() => setAddOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#faf7f0', borderRadius: '14px', border: '1px solid #d4c8ae', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', width: '420px', maxWidth: '92vw', padding: '24px' }}
          >
            <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#2c2820' }}>Новая организация</h2>
            <p style={{ margin: '0 0 16px', fontSize: '12.5px', color: '#9a8a70' }}>Введите название аудиторской организации.</p>
            <input
              autoFocus
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') confirmAdd(); if (e.key === 'Escape') setAddOpen(false); }}
              placeholder={`Организация ${orgs.length + 1}`}
              style={{ width: '100%', boxSizing: 'border-box', fontSize: '14px', padding: '11px 13px', border: '1px solid #c8bcaa', borderRadius: '8px', background: '#fff', color: '#2c2820', outline: 'none', marginBottom: '18px' }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                onClick={() => setAddOpen(false)}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid #d4c8ae', background: 'transparent', color: '#6a5e48', cursor: 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={confirmAdd}
                style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: '#1a1e2e', color: '#fff', cursor: 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              >
                Создать
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
