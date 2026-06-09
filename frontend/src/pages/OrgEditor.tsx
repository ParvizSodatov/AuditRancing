import { useState, useEffect } from 'react';
import type { AuditOrg, OrgWithRating, OrgKScores } from '../types';
import { INDICATOR_GROUPS } from '../utils/indicatorOptions';
import RatingBadge from '../components/RatingBadge';

interface Props {
  org: OrgWithRating;
  onSave: (org: AuditOrg) => void;
  onDelete: (id: string) => void;
}

export default function OrgEditor({ org, onSave, onDelete }: Props) {
  const [name, setName] = useState(org.name);
  const [kScores, setKScores] = useState<OrgKScores>(org.kScores);
  const [saved, setSaved] = useState(false);

  // Sync when switching between orgs
  useEffect(() => {
    setName(org.name);
    setKScores(org.kScores);
    setSaved(false);
  }, [org.id]);

  const handleScore = (key: string, val: number) => {
    setKScores(prev => ({ ...prev, [key]: val }));
    setSaved(false);
  };

  const handleSave = () => {
    onSave({ id: org.id, name, createdAt: org.createdAt, kScores });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleNameBlur = () => {
    onSave({ id: org.id, name, createdAt: org.createdAt, kScores });
  };

  const handleDelete = () => {
    if (!confirm(`Удалить «${name}»?`)) return;
    onDelete(org.id);
  };

  const stats = [
    { label: 'ИТОГОВЫЙ БАЛЛ', value: org.totalScore.toFixed(1) },
    { label: 'ΣА', value: org.sumA.toFixed(1) },
    { label: 'ΣБ', value: org.sumB.toFixed(1) },
    { label: 'ΣВ', value: org.sumC.toFixed(1) },
    { label: 'Pj', value: org.pj.toFixed(3) },
    { label: 'Q', value: `${org.q.toFixed(0)}%` },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* ── Name + Delete ── */}
      <div style={{ background: '#f5f1e6', borderBottom: '1px solid #d4c8ae', padding: '14px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          onBlur={handleNameBlur}
          style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: '18px', fontWeight: 600, color: '#2c2820', flex: 1, marginRight: '16px' }}
          placeholder="Название организации"
        />
        <button
          onClick={handleDelete}
          style={{ color: '#b03030', border: '1px solid #e8aeae', background: '#fbeeee', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#b03030'; (e.currentTarget as HTMLElement).style.color = '#fff'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#fbeeee'; (e.currentTarget as HTMLElement).style.color = '#b03030'; }}
        >
          Удалить
        </button>
      </div>

      {/* ── Stats row ── */}
      <div style={{ background: '#f0ece0', borderBottom: '1px solid #d4c8ae', padding: '12px 28px', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap', position: 'sticky', top: '53px', zIndex: 10 }}>
        {stats.map(({ label, value }) => (
          <div key={label} style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a8a70' }}>
              {label}
            </span>
            <span style={{ fontSize: '22px', fontWeight: 700, fontFamily: 'monospace', color: '#2c2820', marginTop: '2px' }}>
              {value}
            </span>
          </div>
        ))}
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
          <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9a8a70' }}>
            УРОВЕНЬ
          </span>
          <div style={{ marginTop: '4px' }}>
            <RatingBadge level={org.level} size="lg" />
          </div>
        </div>
      </div>

      {/* ── Indicator groups ── */}
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: '24px' }}>
        {INDICATOR_GROUPS.map(group => (
          <div key={group.id}>

            {/* Group header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 28px', background: '#e8e2d0', borderTop: '1px solid #d4c8ae', borderBottom: '1px solid #d4c8ae' }}>
              <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: '#c9a84c', color: '#1a1e2e', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 700, flexShrink: 0 }}>
                {group.id}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#2c2820' }}>
                {group.label}
              </span>
            </div>

            {/* Rows */}
            {group.indicators.map((ind, i) => (
              <div
                key={ind.key}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 28px',
                  background: i % 2 === 0 ? '#f0ead8' : '#ece6d2',
                  borderBottom: '1px solid #ddd5c0',
                  minHeight: '52px',
                }}
              >
                <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: '#c9a84c', width: '36px', flexShrink: 0 }}>
                  {ind.code}
                </span>
                <span style={{ fontSize: '13px', color: '#4a3e2e', flex: 1 }}>
                  {ind.name}
                </span>
                <select
                  value={String(kScores[ind.key as keyof OrgKScores])}
                  onChange={e => handleScore(ind.key, parseFloat(e.target.value))}
                  style={{
                    width: '280px',
                    flexShrink: 0,
                    background: '#faf7f0',
                    border: '1px solid #c8bcaa',
                    borderRadius: '5px',
                    padding: '8px 12px',
                    fontSize: '13px',
                    color: '#2c2820',
                    cursor: 'pointer',
                    outline: 'none',
                  }}
                >
                  {ind.options.map(opt => (
                    <option key={`${ind.key}-${opt.score}-${opt.label}`} value={String(opt.score)}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        ))}

        {/* ── Save button footer ── */}
        <div style={{ padding: '24px 28px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button
            onClick={handleSave}
            style={{
              background: saved ? '#27924f' : '#1a1e2e',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 36px',
              fontSize: '14px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.2s, transform 0.1s',
              minWidth: '180px',
              boxShadow: '0 2px 6px rgba(26,30,46,0.25)',
            }}
            onMouseEnter={e => { if (!saved) (e.currentTarget as HTMLElement).style.background = '#2a3047'; }}
            onMouseLeave={e => { if (!saved) (e.currentTarget as HTMLElement).style.background = '#1a1e2e'; }}
          >
            {saved ? '✓ Сохранено' : 'Сохранить запись'}
          </button>
        </div>
      </div>
    </div>
  );
}
