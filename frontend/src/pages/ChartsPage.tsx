import { useTranslation } from 'react-i18next';
import type { OrgWithRating, RatingLevel } from '../types';
import { RATING_LEVELS } from '../types';
import { MAX_TOTAL } from '../utils/ratingCalculator';
import RatingBadge, { LEVEL_STYLES } from '../components/RatingBadge';

interface Props {
  orgs: OrgWithRating[];
}

const GROUP_COLORS = { a: '#7a9a5a', b: '#c9a84c', c: '#b5524a' };
const GROUP_META: { key: 'a' | 'b' | 'c'; labelKey: 'charts.groupA' | 'charts.groupB' | 'charts.groupC'; field: 'sumA' | 'sumB' | 'sumC' }[] = [
  { key: 'a', labelKey: 'charts.groupA', field: 'sumA' },
  { key: 'b', labelKey: 'charts.groupB', field: 'sumB' },
  { key: 'c', labelKey: 'charts.groupC', field: 'sumC' },
];

const card: React.CSSProperties = {
  background: '#faf7f0',
  border: '1px solid #d4c8ae',
  borderRadius: '12px',
  padding: '20px 22px',
  boxShadow: '0 1px 3px rgba(40,30,10,0.06)',
};

const cardTitle: React.CSSProperties = {
  fontSize: '14px',
  fontWeight: 700,
  color: '#2c2820',
  margin: '0 0 16px',
  letterSpacing: '0.01em',
};

/** «Красивая» шкала оси Y: округлённый максимум и ровные деления. */
function buildAxis(maxVal: number): { max: number; ticks: number[] } {
  if (maxVal <= 0) return { max: 1, ticks: [0, 1] };
  const rough = maxVal / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  const max = Math.ceil(maxVal / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { max, ticks };
}

export default function ChartsPage({ orgs }: Props) {
  const { t } = useTranslation();
  if (orgs.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '240px', color: '#9a8a70', fontSize: '14px' }}>
        {t('charts.empty')}
      </div>
    );
  }

  const byTotal = [...orgs].sort((a, b) => b.totalScore - a.totalScore);
  const leader = byTotal[0];
  const avgTotal = orgs.reduce((s, o) => s + o.totalScore, 0) / orgs.length;
  const avgQ = orgs.reduce((s, o) => s + o.q, 0) / orgs.length;
  const maxTotal = Math.max(...orgs.map(o => o.totalScore), 1);

  // Распределение по уровням
  const levelCounts = RATING_LEVELS
    .map(lvl => ({ lvl, count: orgs.filter(o => o.level === lvl).length }))
    .filter(d => d.count > 0);
  const maxLevelCount = Math.max(...levelCounts.map(d => d.count), 1);

  // Агрегация баллов по годам для столбчатой диаграммы (в каждом году — А/Б/В).
  const yearMap = new Map<number, { a: number; b: number; c: number }>();
  for (const o of orgs) {
    const y = new Date(o.createdAt).getFullYear();
    if (Number.isNaN(y)) continue;
    const e = yearMap.get(y) ?? { a: 0, b: 0, c: 0 };
    e.a += o.sumA; e.b += o.sumB; e.c += o.sumC;
    yearMap.set(y, e);
  }
  const yearData = [...yearMap.entries()].sort((a, b) => a[0] - b[0]).map(([year, v]) => ({ year, ...v }));
  const groupMax = Math.max(...yearData.flatMap(d => [d.a, d.b, d.c]), 1);
  const axis = buildAxis(groupMax);
  const PLOT_H = 240;

  // Итого по каждой группе (по всем годам) — для боковой сводки.
  const groupTotals = {
    a: orgs.reduce((s, o) => s + o.sumA, 0),
    b: orgs.reduce((s, o) => s + o.sumB, 0),
    c: orgs.reduce((s, o) => s + o.sumC, 0),
  };
  const groupTotalMax = Math.max(groupTotals.a, groupTotals.b, groupTotals.c, 1);

  const stats = [
    { label: t('charts.orgs').toUpperCase(), value: String(orgs.length) },
    { label: t('charts.avgScore').toUpperCase(), value: avgTotal.toFixed(1) },
    { label: t('charts.avgQ').toUpperCase(), value: `${avgQ.toFixed(0)}%` },
    { label: t('charts.leader').toUpperCase(), value: leader.name, badge: leader.level },
  ];

  return (
    <div style={{ padding: '22px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Сводные карточки ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
        {stats.map(s => (
          <div key={s.label} style={{ ...card, padding: '16px 18px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', color: '#9a8a70' }}>{s.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px' }}>
              <span style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'monospace', color: '#2c2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {s.value}
              </span>
              {s.badge && <RatingBadge level={s.badge as RatingLevel} size="sm" />}
            </div>
          </div>
        ))}
      </div>

      {/* ── Распределение по уровням ── */}
      <div style={card}>
        <h3 style={cardTitle}>{t('charts.distribution')}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {levelCounts.map(({ lvl, count }) => (
            <div key={lvl} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '44px', flexShrink: 0 }}>
                <RatingBadge level={lvl} size="sm" />
              </div>
              <div style={{ flex: 1, height: '24px', background: '#ece6d4', borderRadius: '6px', overflow: 'hidden' }}>
                <div
                  style={{
                    width: `${(count / maxLevelCount) * 100}%`,
                    height: '100%',
                    background: LEVEL_STYLES[lvl].bg,
                    borderRadius: '6px',
                    transition: 'width 0.4s ease',
                    minWidth: '6px',
                  }}
                />
              </div>
              <span style={{ width: '28px', textAlign: 'right', fontFamily: 'monospace', fontSize: '14px', fontWeight: 700, color: '#4a3e2e' }}>
                {count}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Структура баллов по группам ── */}
      <div style={card}>
        <h3 style={cardTitle}>{t('charts.structure')}</h3>
        {/* Легенда */}
        <div style={{ display: 'flex', gap: '18px', marginBottom: '16px', flexWrap: 'wrap' }}>
          {GROUP_META.map(g => (
            <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#4a3e2e' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: GROUP_COLORS[g.key] }} />
              {t(g.labelKey)}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {byTotal.map(org => (
            <div key={org.id}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '5px' }}>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#2c2820' }}>{org.name}</span>
                <span style={{ fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#c9a84c' }}>
                  {org.totalScore.toFixed(1)}
                </span>
              </div>
              <div style={{ display: 'flex', height: '22px', borderRadius: '6px', overflow: 'hidden', background: '#ece6d4', width: `${(org.totalScore / maxTotal) * 100}%`, minWidth: '4px' }}>
                {GROUP_META.map(g => {
                  const val = org[g.field];
                  return val > 0 ? (
                    <div
                      key={g.key}
                      title={`${t(g.labelKey)}: ${val.toFixed(1)}`}
                      style={{
                        width: `${(val / org.totalScore) * 100}%`,
                        background: GROUP_COLORS[g.key],
                        transition: 'width 0.4s ease',
                      }}
                    />
                  ) : null;
                })}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Столбчатая диаграмма по группам (А/Б/В) ── */}
      <div style={card}>
        <h3 style={cardTitle}>{t('charts.groupBars')}</h3>
        {/* Легенда */}
        <div style={{ display: 'flex', gap: '18px', marginBottom: '18px', flexWrap: 'wrap' }}>
          {GROUP_META.map(g => (
            <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#4a3e2e' }}>
              <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: GROUP_COLORS[g.key] }} />
              {t(g.labelKey)}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'flex-start' }}>
         <div style={{ flex: '1 1 0', minWidth: 0, display: 'flex', gap: '8px' }}>
          {/* Ось Y */}
          <div style={{ position: 'relative', height: `${PLOT_H}px`, width: '40px', flexShrink: 0 }}>
            {axis.ticks.map(tk => (
              <div
                key={tk}
                style={{
                  position: 'absolute', right: '4px', bottom: `${(tk / axis.max) * 100}%`,
                  transform: 'translateY(50%)', fontSize: '10px', fontFamily: 'monospace', color: '#9a8a70',
                }}
              >
                {tk}
              </div>
            ))}
          </div>
          {/* Область графика */}
          <div style={{ flex: 1, minWidth: 0, overflowX: 'auto' }}>
            <div style={{ position: 'relative', height: `${PLOT_H}px` }}>
              {/* Сетка */}
              {axis.ticks.map(tk => (
                <div
                  key={tk}
                  style={{
                    position: 'absolute', left: 0, right: 0, bottom: `${(tk / axis.max) * 100}%`,
                    borderTop: tk === 0 ? '1px solid #d4c8ae' : '1px dashed #e4dcc8',
                  }}
                />
              ))}
              {/* Группы столбиков по годам */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start', height: '100%', gap: '28px', paddingLeft: '12px' }}>
                {yearData.map(d => (
                  <div key={d.year} style={{ width: '92px', flexShrink: 0, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '8px', height: '100%' }}>
                    {GROUP_META.map(g => {
                      const val = d[g.key];
                      return (
                        <div
                          key={g.key}
                          title={`${d.year} — ${t(g.labelKey)}: ${val.toFixed(1)}`}
                          style={{
                            flex: 1, maxWidth: '24px',
                            height: `${(val / axis.max) * 100}%`,
                            minHeight: val > 0 ? '2px' : '0',
                            background: GROUP_COLORS[g.key],
                            borderRadius: '3px 3px 0 0',
                            transition: 'height 0.4s ease',
                          }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {/* Подписи оси X — годы */}
            <div style={{ display: 'flex', gap: '28px', marginTop: '7px', paddingLeft: '12px' }}>
              {yearData.map(d => (
                <div
                  key={d.year}
                  style={{ width: '92px', flexShrink: 0, textAlign: 'center', fontSize: '13px', fontWeight: 700, fontFamily: 'monospace', color: '#4a3e2e' }}
                >
                  {d.year}
                </div>
              ))}
            </div>
          </div>
         </div>

          {/* Боковая сводка «Итого по группам» */}
          <div style={{ width: '230px', flexShrink: 0, alignSelf: 'stretch', borderLeft: '1px solid #e4dcc8', paddingLeft: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.06em', color: '#9a8a70' }}>
              {t('charts.totalByGroup')}
            </div>
            {GROUP_META.map(g => {
              const val = groupTotals[g.key];
              return (
                <div key={g.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '7px', fontSize: '12px', color: '#4a3e2e' }}>
                      <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: GROUP_COLORS[g.key] }} />
                      {t(g.labelKey)}
                    </span>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '13px', color: '#2c2820' }}>
                      {val.toFixed(1)}
                    </span>
                  </div>
                  <div style={{ height: '8px', background: '#ece6d4', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(val / groupTotalMax) * 100}%`, height: '100%', background: GROUP_COLORS[g.key], borderRadius: '4px', minWidth: val > 0 ? '3px' : '0', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Качество Q ── */}
      <div style={card}>
        <h3 style={cardTitle}>{t('charts.quality', { max: MAX_TOTAL })}</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {byTotal.map((org, i) => (
            <div key={org.id} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ width: '22px', flexShrink: 0, fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: i === 0 ? '#c9a84c' : '#9a8a70' }}>
                {i === 0 ? '★' : i + 1}
              </span>
              <span style={{ width: '140px', flexShrink: 0, fontSize: '13px', fontWeight: 500, color: '#2c2820', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {org.name}
              </span>
              <div style={{ flex: 1, height: '20px', background: '#ece6d4', borderRadius: '6px', overflow: 'hidden', position: 'relative' }}>
                <div
                  style={{
                    width: `${Math.max(0, Math.min(100, org.q))}%`,
                    height: '100%',
                    background: `linear-gradient(90deg, ${LEVEL_STYLES[org.level].bg}, ${LEVEL_STYLES[org.level].bg}cc)`,
                    borderRadius: '6px',
                    transition: 'width 0.4s ease',
                    minWidth: '4px',
                  }}
                />
              </div>
              <span style={{ width: '44px', textAlign: 'right', fontFamily: 'monospace', fontSize: '13px', fontWeight: 700, color: '#4a3e2e' }}>
                {org.q.toFixed(0)}%
              </span>
              <div style={{ width: '44px', flexShrink: 0, textAlign: 'right' }}>
                <RatingBadge level={org.level} size="sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
