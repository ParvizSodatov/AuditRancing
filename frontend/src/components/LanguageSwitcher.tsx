import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES, type AppLanguage } from '../i18n';

/** Короткие подписи языков для кнопки и пунктов меню. */
const LANG_META: Record<AppLanguage, { short: string; name: string }> = {
  ru: { short: 'РУ', name: 'Русский' },
  tg: { short: 'ТҶ', name: 'Тоҷикӣ' },
};

/** Глобус — иконка переключателя. */
function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  );
}

/** Стрелка-«шеврон», поворачивается при открытии. */
function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
      style={{ transition: 'transform 0.18s ease', transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

/**
 * Переключатель языка в шапке. Тёмная тема под хедер, золотой акцент.
 * Список языков берётся из конфигурации i18n, текущий язык сохраняется в localStorage.
 */
export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = (SUPPORTED_LANGUAGES.includes(i18n.language as AppLanguage)
    ? i18n.language
    : 'ru') as AppLanguage;

  // Закрытие по клику вне меню.
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const choose = (lng: AppLanguage) => {
    void i18n.changeLanguage(lng);
    setOpen(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        title={LANG_META[current].name}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '7px',
          background: 'transparent',
          border: '1px solid #3a4057',
          borderRadius: '6px',
          color: '#c9a84c',
          fontSize: '13px',
          fontWeight: 600,
          padding: '5px 10px',
          cursor: 'pointer',
          transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = '#c9a84c'; }}
        onMouseLeave={e => { if (!open) (e.currentTarget as HTMLElement).style.borderColor = '#3a4057'; }}
      >
        <GlobeIcon />
        <span>{LANG_META[current].short}</span>
        <Chevron open={open} />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            minWidth: '150px',
            background: '#1a1e2e',
            border: '1px solid #3a4057',
            borderRadius: '10px',
            boxShadow: '0 10px 30px rgba(0,0,0,0.45)',
            padding: '5px',
            zIndex: 60,
            animation: 'lang-pop 0.15s ease',
          }}
        >
          {SUPPORTED_LANGUAGES.map(lng => {
            const active = lng === current;
            return (
              <button
                key={lng}
                onClick={() => choose(lng)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: '100%',
                  textAlign: 'left',
                  background: active ? '#2a3047' : 'transparent',
                  border: 'none',
                  borderRadius: '7px',
                  color: active ? '#c9a84c' : '#cfc6b4',
                  fontSize: '13.5px',
                  fontWeight: active ? 700 : 500,
                  padding: '9px 12px',
                  cursor: 'pointer',
                  transition: 'background 0.12s, color 0.12s',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = '#262c40'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <span
                  style={{
                    flexShrink: 0,
                    width: '26px',
                    height: '20px',
                    borderRadius: '4px',
                    background: active ? '#c9a84c' : '#3a4057',
                    color: active ? '#1a1e2e' : '#cfc6b4',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '10.5px',
                    fontWeight: 700,
                  }}
                >
                  {LANG_META[lng].short}
                </span>
                {LANG_META[lng].name}
                {active && <span style={{ marginLeft: 'auto', color: '#c9a84c', fontSize: '13px' }}>✓</span>}
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes lang-pop {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
