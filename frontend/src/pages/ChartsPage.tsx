import { useTranslation } from 'react-i18next';
import type { OrgWithRating, RatingLevel } from '../types';
import { RATING_LEVELS } from '../types';
import { MAX_TOTAL } from '../utils/ratingCalculator';
import RatingBadge, { LEVEL_STYLES } from '../components/RatingBadge';

interface Props {
  orgs: OrgWithRating[];
}

const GROUP_COLORS = { a: '#c9a84c', b: '#5a7a9a', c: '#7a9a5a' };
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
