import { useState } from 'react';
import { api } from '../utils/api';

interface Props {
  /** Возврат на страницу входа. */
  onBack: () => void;
}

/** Экран запроса ссылки для сброса пароля по почте. */
export default function ForgotPasswordPage({ onBack }: Props) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);
    setBusy(true);
    try {
      await api.forgotPassword(email.trim());
      // Ответ всегда успешный — не раскрываем, есть ли такая почта.
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Не удалось отправить письмо');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={logoStyle}>
            <img src="/gerb.png" alt="Герб Республики Таджикистан" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c2820', textAlign: 'center' }}>
            Восстановление пароля
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#9a8a70', textAlign: 'center' }}>
            Введите почту — пришлём ссылку для сброса пароля
          </p>
        </div>

        {sent ? (
          <div style={{ background: '#eef7ee', border: '1px solid #aed8ae', color: '#2f7a2f', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', marginBottom: '18px' }}>
            ✓ Если такая почта зарегистрирована, мы отправили на неё письмо со ссылкой для сброса пароля. Проверьте входящие и папку «Спам».
          </div>
        ) : (
          <>
            {error && (
              <div style={errorStyle}>⚠ {error}</div>
            )}
            <label style={labelStyle}>Почта</label>
            <input
              autoFocus
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              autoComplete="email"
              style={inputStyle}
            />
            <button type="submit" disabled={busy} style={primaryBtn(busy)}>
              {busy ? 'Отправка…' : 'Отправить ссылку'}
            </button>
          </>
        )}

        <div style={{ textAlign: 'center', marginTop: '18px' }}>
          <button type="button" onClick={onBack} style={linkBtn}>
            ← Вернуться ко входу
          </button>
        </div>
      </form>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const cardStyle: React.CSSProperties = { width: '380px', maxWidth: '92vw', background: '#faf7f0', border: '1px solid #d4c8ae', borderRadius: '16px', boxShadow: '0 16px 50px rgba(0,0,0,0.4)', padding: '32px 28px' };
const logoStyle: React.CSSProperties = { width: '52px', height: '52px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', overflow: 'hidden' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#6a5e48', marginBottom: '6px' };
const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', fontSize: '14px', padding: '11px 13px', border: '1px solid #c8bcaa', borderRadius: '8px', background: '#fff', color: '#2c2820', outline: 'none' };
const errorStyle: React.CSSProperties = { background: '#fbeeee', border: '1px solid #e8aeae', color: '#b03030', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', padding: 0, color: '#9a7a2c', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' };
const primaryBtn = (busy: boolean): React.CSSProperties => ({ width: '100%', marginTop: '20px', background: busy ? '#3a4057' : '#1a1e2e', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'background 0.15s' });
