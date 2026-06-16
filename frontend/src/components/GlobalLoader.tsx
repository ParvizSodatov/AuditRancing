import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { onLoadingChange } from '../utils/api';

/**
 * Глобальный индикатор загрузки. Подписывается на трекер запросов в api.ts
 * и автоматически показывается на время любого вызова api.* — отдельная
 * настройка в компонентах не нужна.
 */
export default function GlobalLoader() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  useEffect(() => onLoadingChange(setLoading), []);

  return (
    <>
      {/* Полоса прогресса вверху страницы */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: '3px',
          zIndex: 2000,
          pointerEvents: 'none',
          opacity: loading ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
      >
        {loading && (
          <div
            style={{
              height: '100%',
              width: '40%',
              borderRadius: '0 3px 3px 0',
              background: 'linear-gradient(90deg, transparent, #c9a84c 40%, #f0d98a 70%, #c9a84c)',
              boxShadow: '0 0 8px rgba(201,168,76,0.7)',
              animation: 'loader-slide 1.1s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Плавающий индикатор в углу */}
      <div
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          zIndex: 2000,
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          background: '#1a1e2e',
          border: '1px solid #c9a84c',
          borderRadius: '999px',
          padding: '8px 16px 8px 12px',
          boxShadow: '0 8px 24px rgba(20,20,30,0.28)',
          pointerEvents: 'none',
          opacity: loading ? 1 : 0,
          transform: loading ? 'translateY(0)' : 'translateY(12px)',
          transition: 'opacity 0.25s ease, transform 0.25s ease',
        }}
      >
        <span
          style={{
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            border: '2px solid rgba(201,168,76,0.3)',
            borderTopColor: '#c9a84c',
            animation: 'loader-spin 0.7s linear infinite',
            display: 'inline-block',
          }}
        />
        <span style={{ color: '#e8dfc8', fontSize: '12.5px', fontWeight: 600, letterSpacing: '0.2px' }}>
          {t('common.loading')}
        </span>
      </div>

      <style>{`
        @keyframes loader-slide {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(350%); }
        }
        @keyframes loader-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}
