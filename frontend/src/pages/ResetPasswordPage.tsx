import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import PasswordInput from '../components/PasswordInput';

interface Props {
  /** Токен сброса из ссылки в письме (?token=...). */
  token: string;
  /** Переход на страницу входа (после успеха или по кнопке). */
  onDone: () => void;
}

/** Экран установки нового пароля по ссылке из письма. */
export default function ResetPasswordPage({ token, onDone }: Props) {
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setError(null);

    if (password.length < 6) {
      setError(t('profile.pwTooShort'));
      return;
    }
    if (password !== confirm) {
      setError(t('profile.pwMismatch'));
      return;
    }

    setBusy(true);
    try {
      await api.resetPassword(token, password);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('reset.failed'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={pageStyle}>
      <form onSubmit={submit} style={cardStyle}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '20px' }}>
          <div style={logoStyle}>
            <img src="/gerb.png" alt={t('header.coatAlt')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#2c2820', textAlign: 'center' }}>
            {t('reset.title')}
          </h1>
          <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: '#9a8a70', textAlign: 'center' }}>
            {t('reset.subtitle')}
          </p>
        </div>

        {done ? (
          <>
            <div style={{ background: '#eef7ee', border: '1px solid #aed8ae', color: '#2f7a2f', borderRadius: '8px', padding: '12px 14px', fontSize: '13px', marginBottom: '18px' }}>
              {t('reset.done')}
            </div>
            <button type="button" onClick={onDone} style={primaryBtn(false)}>
              {t('reset.goLogin')}
            </button>
          </>
        ) : (
          <>
            {error && <div style={errorStyle}>⚠ {error}</div>}

            <label style={labelStyle}>{t('profile.newPw')}</label>
            <PasswordInput
              value={password}
              onChange={setPassword}
              placeholder={t('reset.minChars')}
              autoComplete="new-password"
            />

            <label style={{ ...labelStyle, marginTop: '16px' }}>{t('reset.repeat')}</label>
            <PasswordInput
              value={confirm}
              onChange={setConfirm}
              placeholder={t('profile.confirmPwPlaceholder')}
              autoComplete="new-password"
            />

            <button type="submit" disabled={busy} style={primaryBtn(busy)}>
              {busy ? t('common.saving') : t('reset.save')}
            </button>
            <div style={{ textAlign: 'center', marginTop: '18px' }}>
              <button type="button" onClick={onDone} style={linkBtn}>
                {t('forgot.back')}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  );
}

const pageStyle: React.CSSProperties = { minHeight: '100vh', background: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' };
const cardStyle: React.CSSProperties = { width: '380px', maxWidth: '92vw', background: '#faf7f0', border: '1px solid #d4c8ae', borderRadius: '16px', boxShadow: '0 16px 50px rgba(0,0,0,0.4)', padding: '32px 28px' };
const logoStyle: React.CSSProperties = { width: '52px', height: '52px', borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px', overflow: 'hidden' };
const labelStyle: React.CSSProperties = { display: 'block', fontSize: '12.5px', fontWeight: 600, color: '#6a5e48', marginBottom: '6px' };
const errorStyle: React.CSSProperties = { background: '#fbeeee', border: '1px solid #e8aeae', color: '#b03030', borderRadius: '8px', padding: '10px 12px', fontSize: '13px', marginBottom: '16px' };
const linkBtn: React.CSSProperties = { background: 'none', border: 'none', padding: 0, color: '#9a7a2c', fontSize: '12.5px', fontWeight: 600, cursor: 'pointer', textDecoration: 'underline' };
const primaryBtn = (busy: boolean): React.CSSProperties => ({ width: '100%', marginTop: '20px', background: busy ? '#3a4057' : '#1a1e2e', color: '#fff', border: 'none', borderRadius: '8px', padding: '12px 16px', fontSize: '14px', fontWeight: 600, cursor: busy ? 'default' : 'pointer', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'background 0.15s' });
