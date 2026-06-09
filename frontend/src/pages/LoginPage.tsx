import { useState } from 'react';
import { api, type AuthUser } from '../utils/api';
import PasswordInput from '../components/PasswordInput';

interface Props {
  /** Вызывается после успешного входа с данными пользователя. */
  onLogin: (user: AuthUser) => void;
}

/** Страница входа: первое, что видит неавторизованный пользователь. */
export default function LoginPage({ onLogin }: Props) {
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      const user = await api.login(login.trim(), password);
      onLogin(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось войти');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <form
        onSubmit={submit}
        style={{ width: '380px', maxWidth: '92vw', background: '#faf7f0', border: '1px solid #d4c8ae', borderRadius: '16px', boxShadow: '0 16px 50px rgba(0,0,0,0.4)', padding: '32px 28px' }}
      >
        {/* Логотип / заголовок */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '50%', background: '#c9a84c', color: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '16px', marginBottom: '14px' }}>
            МФ
          </div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c2820', textAlign: 'center' }}>
            Рейтинг аудиторских организаций
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#9a8a70', textAlign: 'center' }}>
            Вход в рабочее место рейтингового органа
          </p>
        </div>

        {error && (
          <div style={{ background: '#fbeeee', border: '1px solid #e8aeae', color: '#b03030', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' }}>
            ⚠ {error}
          </div>
        )}

        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#6a5e48', marginBottom: '6px' }}>
          Логин
        </label>
        <input
          autoFocus
          value={login}
          onChange={e => setLogin(e.target.value)}
          placeholder="Введите логин"
          autoComplete="username"
          style={inputStyle}
        />

        <label style={{ display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#6a5e48', margin: '16px 0 6px' }}>
          Пароль
        </label>
        <PasswordInput
          value={password}
          onChange={setPassword}
          placeholder="Введите пароль"
          autoComplete="current-password"
        />

        <button
          type="submit"
          disabled={busy}
          style={{ width: '100%', marginTop: '24px', background: busy ? '#3a4057' : '#1a1e2e', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'background 0.15s' }}
        >
          {busy ? 'Вход…' : 'Войти'}
        </button>
      </form>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
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
