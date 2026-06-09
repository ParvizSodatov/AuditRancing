import { createContext, useContext, useState, useCallback, useRef } from 'react';
import type { ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastApi {
  success: (message: string) => void;
  error: (message: string) => void;
  info: (message: string) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Хук для показа всплывающих уведомлений. Должен использоваться внутри <ToastProvider>. */
export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>');
  return ctx;
}

const STYLES: Record<ToastType, { bg: string; border: string; bar: string; icon: string }> = {
  success: { bg: '#eef9f1', border: '#bfe6cb', bar: '#27924f', icon: '✓' },
  error: { bg: '#fbeeee', border: '#e8aeae', bar: '#b03030', icon: '!' },
  info: { bg: '#eef3fb', border: '#aec6e8', bar: '#2a5db0', icon: 'i' },
};

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const nextId = useRef(1);

  const remove = useCallback((id: number) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback((type: ToastType, message: string) => {
    const id = nextId.current++;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => remove(id), 4000);
  }, [remove]);

  const api = useRef<ToastApi>({
    success: (m: string) => push('success', m),
    error: (m: string) => push('error', m),
    info: (m: string) => push('info', m),
  });

  return (
    <ToastContext.Provider value={api.current}>
      {children}
      <div
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => {
          const s = STYLES[t.type];
          return (
            <div
              key={t.id}
              onClick={() => remove(t.id)}
              style={{
                pointerEvents: 'auto',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                minWidth: '280px',
                maxWidth: '380px',
                background: s.bg,
                border: `1px solid ${s.border}`,
                borderLeft: `4px solid ${s.bar}`,
                borderRadius: '10px',
                padding: '13px 16px',
                boxShadow: '0 8px 24px rgba(20,20,30,0.18)',
                animation: 'toast-in 0.25s cubic-bezier(0.21,1.02,0.73,1)',
              }}
            >
              <span
                style={{
                  flexShrink: 0,
                  width: '22px',
                  height: '22px',
                  borderRadius: '50%',
                  background: s.bar,
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '13px',
                  fontWeight: 700,
                }}
              >
                {s.icon}
              </span>
              <span style={{ fontSize: '13.5px', color: '#2c2820', lineHeight: 1.4, fontWeight: 500 }}>
                {t.message}
              </span>
            </div>
          );
        })}
      </div>
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateX(24px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </ToastContext.Provider>
  );
}
