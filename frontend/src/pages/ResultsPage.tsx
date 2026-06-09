import type { OrgWithRating, RankMode } from '../types';
import { MAX_TOTAL } from '../utils/ratingCalculator';
import { LEVEL_STYLES } from '../components/RatingBadge';
import RatingBadge from '../components/RatingBadge';

interface Props {
  orgs: OrgWithRating[];
  mode: RankMode;
  onMode: (mode: RankMode) => void;
}

const COLS = ['#', 'Организация', 'Балл', 'ΣА', 'ΣБ', 'ΣВ', 'Pj', 'Качество (Q)', 'Уровень'];

export default function ResultsPage({ orgs, mode, onMode }: Props) {
  const sorted = [...orgs].sort((a, b) =>
    mode === 'score' ? b.totalScore - a.totalScore : a.pj - b.pj
  );

  return (
    <div style={{ padding: '24px 28px' }}>
      {/* ── Сегментированный переключатель режима ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#7a6f5e', fontWeight: 500 }}>Ранжирование:</span>
        <div style={{ display: 'inline-flex', background: '#e3dcc8', padding: '3px', borderRadius: '9px', border: '1px solid #d4c8ae' }}>
          {(['score', 'pj'] as RankMode[]).map(m => (
            <button
              key={m}
              onClick={() => onMode(m)}
              style={{
                padding: '7px 18px',
                fontSize: '13px',
                fontWeight: 600,
                border: 'none',
                borderRadius: '7px',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m ? '#1a1e2e' : 'transparent',
                color: mode === m ? '#c9a84c' : '#7a6f5e',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,0.2)' : 'none',
              }}
            >
              {m === 'score' ? 'По сумме баллов' : 'По методике (Pj)'}
            </button>
          ))}
        </div>
      </div>

      <p style={{ fontSize: '12px', color: '#9a8a70', marginBottom: '18px' }}>
        {mode === 'score'
          ? `Простой режим: выше итоговый балл — выше место. Q = доля от максимума (${MAX_TOTAL} б.).`
          : 'Методика Pj: меньший балл = выше надёжность и качество услуг. Q = (1 − Pj/max).'}
      </p>

      {/* ── Таблица ── */}
      <div style={{ border: '1px solid #d4c8ae', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(40,30,10,0.08)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: '#1a1e2e' }}>
              {COLS.map((h, i) => (
                <th
                  key={h}
                  style={{
                    color: '#c9a84c',
                    fontSize: '11px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    padding: '13px 14px',
                    textAlign: i <= 1 ? 'left' : i === 8 ? 'center' : 'right',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: '#9a8a70' }}>
                  Нет организаций для отображения
                </td>
              </tr>
            )}
            {sorted.map((org, i) => {
              const lead = i === 0;
              return (
                <tr
                  key={org.id}
                  className="transition-colors"
                  style={{
                    background: lead ? 'rgba(201,168,76,0.16)' : i % 2 === 0 ? '#f5f0e2' : '#efe9da',
                    borderBottom: '1px solid #e0d8c4',
                    borderLeft: lead ? '3px solid #c9a84c' : '3px solid transparent',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#e8e0cc'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = lead ? 'rgba(201,168,76,0.16)' : i % 2 === 0 ? '#f5f0e2' : '#efe9da'; }}
                >
                  {/* Ранг */}
                  <td style={{ padding: '12px 14px' }}>
                    <span
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '26px', height: '26px', borderRadius: '50%',
                        background: lead ? '#c9a84c' : '#ddd4be',
                        color: lead ? '#1a1e2e' : '#6a5e48',
                        fontFamily: 'monospace', fontSize: '13px', fontWeight: 700,
                      }}
                    >
                      {lead ? '★' : i + 1}
                    </span>
                  </td>
                  {/* Название */}
                  <td style={{ padding: '12px 14px', fontWeight: 600, color: '#2c2820' }}>{org.name}</td>
                  {/* Балл */}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '15px', fontWeight: 700, color: '#c9a84c' }}>
                    {org.totalScore.toFixed(1)}
                  </td>
                  {/* Группы */}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumA.toFixed(1)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumB.toFixed(1)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumC.toFixed(1)}</td>
                  {/* Pj */}
                  <td style={{ padding: '12px 14px', textAlign: 'right', fontFamily: 'monospace', fontSize: '12px', color: '#9a8a70' }}>{org.pj.toFixed(3)}</td>
                  {/* Q как прогресс-бар */}
                  <td style={{ padding: '12px 14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: '120px' }}>
                      <div style={{ flex: 1, height: '8px', background: '#ddd4be', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{ width: `${Math.max(0, Math.min(100, org.q))}%`, height: '100%', background: LEVEL_STYLES[org.level].bg, borderRadius: '4px', transition: 'width 0.4s ease' }} />
                      </div>
                      <span style={{ fontFamily: 'monospace', fontSize: '12px', fontWeight: 600, color: '#4a3e2e', width: '34px', textAlign: 'right' }}>
                        {org.q.toFixed(0)}%
                      </span>
                    </div>
                  </td>
                  {/* Уровень */}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <RatingBadge level={org.level} size="md" />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#b0a28a', marginTop: '20px' }}>
        Прототип · расчёт по методике инструкции · ранжирование: меньший Pj = выше надёжность
      </p>
    </div>
  );
}
