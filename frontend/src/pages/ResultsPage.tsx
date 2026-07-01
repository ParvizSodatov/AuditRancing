import { Download, Printer } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import type { OrgWithRating, RankMode } from '../types';
import { MAX_TOTAL } from '../utils/ratingCalculator';
import { LEVEL_STYLES } from '../components/RatingBadge';
import RatingBadge from '../components/RatingBadge';
import { exportResultsToExcel, exportOrgToExcel } from '../utils/exportExcel';
import { printResults } from '../utils/printResults';
import { useToast } from '../components/Toast';

interface Props {
  orgs: OrgWithRating[];
  mode: RankMode;
  onMode: (mode: RankMode) => void;
}

export default function ResultsPage({ orgs, mode, onMode }: Props) {
  const { t } = useTranslation();
  const toast = useToast();

  const COLS = ['#', t('results.colName'), t('results.colScore'), t('results.colGroupA'), t('results.colGroupB'), t('results.colGroupC'), t('results.colPj'), t('results.colQuality'), t('results.colLevel'), t('results.colExcel')];

  const sorted = [...orgs].sort((a, b) =>
    mode === 'score' ? b.totalScore - a.totalScore : a.pj - b.pj
  );

  const handleExport = async () => {
    try {
      await exportResultsToExcel(orgs, mode);
      toast.success(t('results.excelDone'));
    } catch (e) {
      console.error('Ошибка экспорта в Excel:', e);
      toast.error(e instanceof Error ? t('results.exportError', { message: e.message }) : t('results.exportFailed'));
    }
  };

  const handleExportOrg = async (org: OrgWithRating) => {
    try {
      await exportOrgToExcel(org);
      toast.success(t('results.orgFileDone', { name: org.name }));
    } catch (e) {
      console.error('Ошибка экспорта организации:', e);
      toast.error(e instanceof Error ? t('results.exportError', { message: e.message }) : t('results.exportFailed'));
    }
  };

  const handlePrint = () => {
    try {
      printResults(orgs, mode);
    } catch (e) {
      console.error('Ошибка печати:', e);
      toast.error(e instanceof Error ? e.message : t('results.printFailed'));
    }
  };

  return (
    <div style={{ padding: '24px 20px' }}>
      {/* ── Сегментированный переключатель режима ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '10px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '13px', color: '#7a6f5e', fontWeight: 500 }}>{t('results.ranking')}</span>
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
              {m === 'score' ? t('results.byScore') : t('results.byPj')}
            </button>
          ))}
        </div>

        {/* ── Печать ── */}
        <button
          onClick={handlePrint}
          disabled={orgs.length === 0}
          title={orgs.length === 0 ? t('results.printDisabled') : t('results.printTitle')}
          style={{
            marginLeft: 'auto',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid #c8bcaa',
            background: orgs.length === 0 ? '#e3dcc8' : '#faf7f0',
            color: orgs.length === 0 ? '#a89c84' : '#4a3e2e',
            cursor: orgs.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: orgs.length === 0 ? 'none' : '0 1px 2px rgba(40,30,10,0.1)',
            transition: 'background 0.15s',
          }}
        >
          <Printer size={15} />
          {t('results.print')}
        </button>

        {/* ── Экспорт в Excel ── */}
        <button
          onClick={() => { void handleExport(); }}
          disabled={orgs.length === 0}
          title={orgs.length === 0 ? t('results.exportDisabled') : t('results.exportTitle')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '7px',
            padding: '8px 16px',
            fontSize: '13px',
            fontWeight: 600,
            borderRadius: '8px',
            border: '1px solid #d4c8ae',
            background: orgs.length === 0 ? '#e3dcc8' : '#1a1e2e',
            color: orgs.length === 0 ? '#a89c84' : '#c9a84c',
            cursor: orgs.length === 0 ? 'not-allowed' : 'pointer',
            boxShadow: orgs.length === 0 ? 'none' : '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'background 0.15s',
          }}
        >
          <Download size={15} />
          {t('results.exportExcel')}
        </button>
      </div>

      <p style={{ fontSize: '12px', color: '#9a8a70', marginBottom: '18px' }}>
        {mode === 'score'
          ? t('results.descScore', { max: MAX_TOTAL })
          : t('results.descPj')}
      </p>

      {/* ── Таблица ── */}
      <div style={{ border: '1px solid #d4c8ae', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(40,30,10,0.08)' }}>
        <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'collapse', fontSize: '13.5px' }}>
          <thead>
            <tr style={{ background: '#1a1e2e' }}>
              {COLS.map((h, i) => {
                const isGroup = i >= 3 && i <= 5;
                const isLevel = i === 8;
                return (
                  <th
                    key={h}
                    style={{
                      color: '#c9a84c',
                      fontSize: '11px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      fontWeight: 600,
                      padding: '10px 14px',
                      textAlign: i <= 1 ? 'left' : i === 8 || i === 9 ? 'center' : isGroup ? 'center' : 'right',
                      whiteSpace: isGroup || isLevel ? 'normal' : 'nowrap',
                      width: isGroup ? '115px' : isLevel ? '92px' : undefined,
                      lineHeight: isGroup || isLevel ? 1.3 : undefined,
                      verticalAlign: 'middle',
                    }}
                  >
                    {h}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sorted.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: '48px', textAlign: 'center', color: '#9a8a70' }}>
                  {t('results.empty')}
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
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumA.toFixed(1)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumB.toFixed(1)}</td>
                  <td style={{ padding: '12px 14px', textAlign: 'center', fontFamily: 'monospace', color: '#4a3e2e' }}>{org.sumC.toFixed(1)}</td>
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
                  {/* Скачать Excel этой организации */}
                  <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                    <button
                      onClick={() => { void handleExportOrg(org); }}
                      title={t('results.downloadOrg', { name: org.name })}
                      style={{
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        width: '34px', height: '34px', borderRadius: '8px',
                        border: '1px solid #d4c8ae', background: '#faf7f0', color: '#1a1e2e',
                        cursor: 'pointer', transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = '#1a1e2e'; (e.currentTarget as HTMLElement).style.color = '#c9a84c'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = '#faf7f0'; (e.currentTarget as HTMLElement).style.color = '#1a1e2e'; }}
                    >
                      <Download size={16} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        </div>
      </div>

      <p style={{ textAlign: 'center', fontSize: '11.5px', color: '#b0a28a', marginTop: '20px' }}>
        {t('results.footer')}
      </p>
    </div>
  );
}
