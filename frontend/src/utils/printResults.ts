import type { OrgWithRating, RankMode } from '../types';
import i18n from '../i18n';

/** Экранирование текста, чтобы кавычки/угловые скобки в названии не ломали разметку. */
function esc(s: string): string {
  return s.replace(/[&<>"']/g, c =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!)
  );
}

/**
 * Открывает отдельное окно с чистой версткой таблицы и вызывает печать браузера.
 * Тёмный хедер и сайдбар приложения на бумагу не попадают.
 */
export function printResults(orgs: OrgWithRating[], mode: RankMode) {
  const t = i18n.t;
  const lang = i18n.language === 'tg' ? 'tg' : 'ru';
  const COLUMNS = [
    t('print.colNum'), t('print.colName'), t('print.colScore'),
    t('results.colGroupA'), t('results.colGroupB'), t('results.colGroupC'), t('print.colPj'), t('print.colQuality'), t('print.colLevel'),
  ];

  const sorted = [...orgs].sort((a, b) =>
    mode === 'score' ? b.totalScore - a.totalScore : a.pj - b.pj
  );

  const date = new Date().toLocaleDateString('ru-RU', { day: '2-digit', month: 'long', year: 'numeric' });
  const subtitle = mode === 'score' ? t('print.subScore') : t('print.subPj');

  const rows = sorted.map((org, i) => `
    <tr>
      <td class="num">${i + 1}</td>
      <td class="name">${esc(org.name)}</td>
      <td class="num bold">${org.totalScore.toFixed(1)}</td>
      <td class="num">${org.sumA.toFixed(1)}</td>
      <td class="num">${org.sumB.toFixed(1)}</td>
      <td class="num">${org.sumC.toFixed(1)}</td>
      <td class="num">${org.pj.toFixed(3)}</td>
      <td class="num">${org.q.toFixed(0)}%</td>
      <td class="center">${esc(org.level)}</td>
    </tr>`).join('');

  const html = `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="utf-8" />
  <title>${esc(t('print.title'))}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, "Segoe UI", sans-serif; color: #1a1a1a; margin: 28px; }
    h1 { font-size: 18px; margin: 0 0 4px; }
    .sub { font-size: 12px; color: #555; margin: 0 0 2px; }
    .date { font-size: 12px; color: #555; margin: 0 0 18px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    thead th {
      background: #1a1e2e; color: #c9a84c; font-weight: bold;
      text-transform: uppercase; letter-spacing: 0.04em; font-size: 10.5px;
      padding: 9px 8px; border: 1px solid #1a1e2e; text-align: center;
    }
    tbody td { padding: 7px 8px; border: 1px solid #d4c8ae; }
    tbody tr:nth-child(even) { background: #f5f0e2; }
    .num { text-align: right; font-variant-numeric: tabular-nums; }
    .center { text-align: center; }
    .name { text-align: left; font-weight: 600; }
    .bold { font-weight: bold; color: #8a6d1f; }
    tfoot td { padding-top: 14px; font-size: 10.5px; color: #888; text-align: center; border: none; }
    @media print {
      body { margin: 0; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${esc(t('print.title'))}</h1>
  <p class="sub">${esc(subtitle)}</p>
  <p class="date">${esc(t('print.generated', { date, count: sorted.length }))}</p>
  <table>
    <thead>
      <tr>${COLUMNS.map(c => `<th>${esc(c)}</th>`).join('')}</tr>
    </thead>
    <tbody>${rows}</tbody>
    <tfoot>
      <tr><td colspan="${COLUMNS.length}">${esc(t('print.footer'))}</td></tr>
    </tfoot>
  </table>
</body>
</html>`;

  const win = window.open('', '_blank', 'width=1000,height=700');
  if (!win) {
    throw new Error(t('print.popupBlocked'));
  }
  win.document.open();
  win.document.write(html);
  win.document.close();

  // Дожидаемся отрисовки, затем вызываем печать.
  win.focus();
  win.onload = () => {
    win.print();
  };
  // Подстраховка, если onload не сработает (контент уже готов).
  setTimeout(() => {
    try { win.print(); } catch { /* окно могли закрыть */ }
  }, 400);
}
