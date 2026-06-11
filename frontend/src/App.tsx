import { useState, useEffect, useCallback } from 'react';
import type { AuditOrg, OrgWithRating, RankMode } from './types';
import { DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS } from './types';
import { computeRatings } from './utils/ratingCalculator';
import { getSettings, saveSettings } from './utils/storage';
import { api, type AuthUser } from './utils/api';
import { getToken, onUnauthorized } from './utils/auth';
import { useToast } from './components/Toast';
import RatingBadge from './components/RatingBadge';
import OrgEditor from './pages/OrgEditor';
import ResultsPage from './pages/ResultsPage';
import ChartsPage from './pages/ChartsPage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import PasswordInput from './components/PasswordInput';

/** Экран авторизации: обычный вход, восстановление или установка нового пароля по ссылке. */
type AuthView = 'login' | 'forgot' | 'reset';

/** Сырой токен сброса из ссылки в письме: /reset?token=... */
function readResetToken(): string {
  if (window.location.pathname !== '/reset') return '';
  return new URLSearchParams(window.location.search).get('token') ?? '';
}

type Tab = 'orgs' | 'results' | 'charts';

const NAV_TABS: { id: Tab; label: string }[] = [
  { id: 'orgs', label: 'Организации' },
  { id: 'results', label: 'Результаты' },
  { id: 'charts', label: 'Аналитика' },
];

export default function App() {
  const toast = useToast();
  // Авторизация: user === null — показываем страницу входа.
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  // Какой экран авторизации показывать. Если открыли ссылку из письма — сразу сброс пароля.
  const [resetToken] = useState(readResetToken);
  const [authView, setAuthView] = useState<AuthView>(() => (readResetToken() ? 'reset' : 'login'));
  const [orgs, setOrgs] = useState<AuditOrg[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('orgs');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rankMode, setRankMode] = useState<RankMode>(() => getSettings().rankMode);
  const [addOpen, setAddOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Модалка профиля: смена логина и/или пароля в одном месте.
  const [profileOpen, setProfileOpen] = useState(false);
  const [profEmail, setProfEmail] = useState('');
  const [profNewPw, setProfNewPw] = useState('');
  const [profConfirmPw, setProfConfirmPw] = useState('');
  const [profCurrentPw, setProfCurrentPw] = useState('');
  const [profBusy, setProfBusy] = useState(false);

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

  // Проверка сохранённой сессии при запуске + реакция на разлогин (истёкший токен).
  useEffect(() => {
    const unsubscribe = onUnauthorized(() => setUser(null));
    (async () => {
      if (getToken()) {
        try {
          setUser(await api.me());
        } catch { /* токен невалиден — останемся на странице входа */ }
      }
      setAuthChecked(true);
    })();
    return unsubscribe;
  }, []);

  // Первичная загрузка организаций из БД — только для авторизованного пользователя.
  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const list = await reload();
      setSelectedId(prev => prev ?? list[0]?.id ?? null);
      setLoading(false);
    })();
  }, [reload, user]);

  // Сохранение режима ранжирования между сессиями.
  useEffect(() => {
    saveSettings({ weights: DEFAULT_WEIGHTS, thresholds: DEFAULT_THRESHOLDS, rankMode });
  }, [rankMode]);

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

  const handleLogout = () => {
    api.logout();
    setUser(null);
    setOrgs([]);
    setSelectedId(null);
  };

  // Возврат ко входу: чистим адрес от ?token, чтобы ссылка сброса не висела в URL.
  const goToLogin = () => {
    if (window.location.pathname === '/reset') window.history.replaceState(null, '', '/');
    setAuthView('login');
  };

  // Открыли ссылку из письма — показываем установку нового пароля (приоритетнее всего).
  if (authView === 'reset') {
    return <ResetPasswordPage token={resetToken} onDone={goToLogin} />;
  }

  // Пока проверяем сохранённый токен — короткая заглушка, чтобы не мигала форма входа.
  if (!authChecked) {
    return (
      <div style={{ minHeight: '100vh', background: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8a7e6a', fontSize: '14px' }}>
        Загрузка…
      </div>
    );
  }

  // Не авторизован — вход или восстановление пароля.
  if (!user) {
    if (authView === 'forgot') {
      return <ForgotPasswordPage onBack={() => setAuthView('login')} />;
    }
    return <LoginPage onLogin={setUser} onForgot={() => setAuthView('forgot')} />;
  }

  const rated: OrgWithRating[] = computeRatings(orgs, DEFAULT_WEIGHTS, DEFAULT_THRESHOLDS, rankMode);
  const selected = rated.find(o => o.id === selectedId) ?? null;

  const openAdd = () => { setNewName(''); setAddOpen(true); };

  const openProfile = () => {
    setProfEmail(user?.email ?? '');
    setProfNewPw(''); setProfConfirmPw(''); setProfCurrentPw('');
    setProfileOpen(true);
  };

  const saveProfile = async () => {
    if (profBusy) return;
    const nextEmail = profEmail.trim();
    const emailChanged = nextEmail !== (user?.email ?? '');
    const wantPwChange = profNewPw.length > 0 || profConfirmPw.length > 0;

    // Проверки до обращения к серверу.
    if (!emailChanged && !wantPwChange) {
      toast.error('Нет изменений');
      return;
    }
    if (emailChanged && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      toast.error('Введите корректный адрес почты');
      return;
    }
    if (wantPwChange) {
      if (profNewPw.length < 6) { toast.error('Новый пароль должен быть не короче 6 символов'); return; }
      if (profNewPw !== profConfirmPw) { toast.error('Пароли не совпадают'); return; }
    }
    if (!profCurrentPw) {
      toast.error('Введите текущий пароль для подтверждения');
      return;
    }

    setProfBusy(true);
    try {
      // Сначала почта (не трогает пароль), затем пароль (он делает текущий пароль недействительным).
      if (emailChanged) {
        const updated = await api.changeEmail(profCurrentPw, nextEmail);
        setUser(updated);
      }
      if (wantPwChange) {
        await api.changePassword(profCurrentPw, profNewPw);
      }
      setProfileOpen(false);
      toast.success('Профиль обновлён');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Не удалось сохранить профиль');
    } finally {
      setProfBusy(false);
    }
  };

  const confirmAdd = async () => {
    const name = newName.trim();
    if (!name) {
      toast.error('Введите название организации');
      return;
    }
    try {
      const created = await api.createOrg({ name });
      await reload();
      setSelectedId(created.id);
      setActiveTab('orgs');
      setAddOpen(false);
      toast.success(`Организация «${name}» добавлена`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Не удалось создать организацию');
      toast.error('Не удалось создать организацию');
    }
  };

  return (
    <div style={{ background: '#ede8d8', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── HEADER ── */}
      <header style={{ background: '#1a1e2e', borderBottom: '3px solid #c9a84c', position: 'sticky', top: 0, zIndex: 20 }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 24px', height: '64px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
              <img src="/gerb.png" alt="Герб Республики Таджикистан" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            </div>
            <div>
              <div style={{ color: '#fff', fontWeight: 600, fontSize: '15px', lineHeight: 1 }}>
               Министерство финансов Республики Таджикистан
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
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingLeft: '16px', borderLeft: '1px solid #2e3346' }}>
              <button
                onClick={openProfile}
                title="Профиль: сменить почту или пароль"
                style={{ display: 'flex', alignItems: 'center', gap: '7px', background: 'transparent', border: '1px solid #3a4057', borderRadius: '6px', color: '#c9a84c', fontSize: '13px', fontWeight: 600, padding: '5px 12px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = '#3a4057'; }}
              >
                <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#c9a84c', color: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '11px', fontWeight: 700 }}>
                  {user.email.slice(0, 1).toUpperCase()}
                </span>
                {user.email}
              </button>
              <button
                onClick={handleLogout}
                style={{ background: 'transparent', border: '1px solid #3a4057', borderRadius: '6px', color: '#8a7e6a', fontSize: '12px', fontWeight: 600, padding: '5px 12px', cursor: 'pointer', transition: 'color 0.15s, border-color 0.15s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#fff'; (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#8a7e6a'; (e.currentTarget as HTMLElement).style.borderColor = '#3a4057'; }}
              >
                Выйти
              </button>
            </div>
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

      {/* ── Модалка профиля: логин + пароль в одном месте ── */}
      {profileOpen && (
        <div
          onClick={() => !profBusy && setProfileOpen(false)}
          style={{ position: 'fixed', inset: 0, background: 'rgba(20,20,30,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: '#faf7f0', borderRadius: '14px', border: '1px solid #d4c8ae', boxShadow: '0 12px 40px rgba(0,0,0,0.3)', width: '440px', maxWidth: '92vw', padding: '24px' }}
          >
            <h2 style={{ margin: '0 0 4px', fontSize: '17px', fontWeight: 700, color: '#2c2820' }}>Профиль</h2>
            <p style={{ margin: '0 0 18px', fontSize: '12.5px', color: '#9a8a70' }}>Измените почту и/или пароль и подтвердите текущим паролем.</p>

            {/* Почта */}
            <label style={labelStyle}>Почта</label>
            <input
              autoFocus
              type="email"
              value={profEmail}
              onChange={e => setProfEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={fieldStyle}
            />

            {/* Новый пароль (необязательно) */}
            <label style={{ ...labelStyle, marginTop: '16px' }}>Новый пароль</label>
            <PasswordInput
              value={profNewPw}
              onChange={setProfNewPw}
              placeholder="Оставьте пустым, чтобы не менять"
              autoComplete="new-password"
            />
            <PasswordInput
              value={profConfirmPw}
              onChange={setProfConfirmPw}
              placeholder="Повторите новый пароль"
              autoComplete="new-password"
              style={{ marginTop: '10px' }}
            />

            {/* Подтверждение текущим паролем */}
            <div style={{ borderTop: '1px solid #e6ddca', margin: '18px 0 14px' }} />
            <label style={labelStyle}>Текущий пароль <span style={{ color: '#b03030' }}>*</span></label>
            <PasswordInput
              value={profCurrentPw}
              onChange={setProfCurrentPw}
              onKeyDown={e => { if (e.key === 'Enter') saveProfile(); if (e.key === 'Escape' && !profBusy) setProfileOpen(false); }}
              placeholder="Подтвердите изменения паролем"
              autoComplete="current-password"
            />

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setProfileOpen(false)}
                disabled={profBusy}
                style={{ padding: '9px 18px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: '1px solid #d4c8ae', background: 'transparent', color: '#6a5e48', cursor: profBusy ? 'default' : 'pointer' }}
              >
                Отмена
              </button>
              <button
                onClick={saveProfile}
                disabled={profBusy}
                style={{ padding: '9px 22px', fontSize: '13px', fontWeight: 600, borderRadius: '8px', border: 'none', background: profBusy ? '#3a4057' : '#1a1e2e', color: '#fff', cursor: profBusy ? 'default' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              >
                {profBusy ? 'Сохранение…' : 'Сохранить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '12.5px',
  fontWeight: 600,
  color: '#6a5e48',
  marginBottom: '6px',
};

const fieldStyle: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '14px',
  padding: '11px 13px',
  border: '1px solid #c8bcaa',
  borderRadius: '8px',
  background: '#fff',
  color: '#2c2820',
  outline: 'none',
};
