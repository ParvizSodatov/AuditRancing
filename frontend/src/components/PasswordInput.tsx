import { useState } from 'react';

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
  autoComplete?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  /** Внешние отступы (например, marginTop) — применяются к обёртке. */
  style?: React.CSSProperties;
}

/** Поле ввода пароля с кнопкой-«глазиком» для переключения видимости. */
export default function PasswordInput({ value, onChange, placeholder, autoFocus, autoComplete, onKeyDown, style }: Props) {
  const [show, setShow] = useState(false);

  return (
    <div style={{ position: 'relative', ...style }}>
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete={autoComplete}
        style={inputStyle}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        tabIndex={-1}
        aria-label={show ? 'Скрыть пароль' : 'Показать пароль'}
        title={show ? 'Скрыть пароль' : 'Показать пароль'}
        style={eyeBtnStyle}
        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = '#2c2820'; }}
        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = '#9a8a70'; }}
      >
        {show ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  fontSize: '14px',
  padding: '11px 42px 11px 13px',
  border: '1px solid #c8bcaa',
  borderRadius: '8px',
  background: '#fff',
  color: '#2c2820',
  outline: 'none',
};

const eyeBtnStyle: React.CSSProperties = {
  position: 'absolute',
  right: '6px',
  top: '50%',
  transform: 'translateY(-50%)',
  background: 'transparent',
  border: 'none',
  padding: '6px',
  cursor: 'pointer',
  color: '#9a8a70',
  display: 'flex',
  alignItems: 'center',
  transition: 'color 0.15s',
};

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}
