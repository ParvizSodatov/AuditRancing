import type { OrgWithRating, OrgKScores, RankMode } from '../types';
import { getIndicatorGroups } from './indicatorOptions';
import i18n from '../i18n';

/** Колонки листа — порядок и ширина совпадают с таблицей результатов. */
function ratingColumns(): { header: string; width: number }[] {
  return [
    { header: i18n.t('exportXlsx.colNum'), width: 5 },
    { header: i18n.t('exportXlsx.colName'), width: 38 },
    { header: i18n.t('exportXlsx.colScore'), width: 9 },
    { header: i18n.t('results.colGroupA'), width: 22 },
    { header: i18n.t('results.colGroupB'), width: 22 },
    { header: i18n.t('results.colGroupC'), width: 22 },
    { header: i18n.t('exportXlsx.colPj'), width: 12 },
    { header: i18n.t('exportXlsx.colQuality'), width: 16 },
    { header: i18n.t('exportXlsx.colLevel'), width: 10 },
  ];
}

/**
 * Выгружает отранжированный список организаций в файл .xlsx
 * со стилизованной шапкой. Сортировка повторяет экран «Результаты».
 */
export async function exportResultsToExcel(orgs: OrgWithRating[], mode: RankMode) {
  const sorted = [...orgs].sort((a, b) =>
    mode === 'score' ? b.totalScore - a.totalScore : a.pj - b.pj
  );

  const COLUMNS = ratingColumns();

  // Подгружаем тяжёлую библиотеку только при экспорте — не утяжеляем стартовый бандл.
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(i18n.t('exportXlsx.sheetRating'));

  ws.columns = COLUMNS.map(c => ({ width: c.width }));

  // ── Строка-заголовок: жирный текст, тёмный фон, золотой цвет ──
  const header = ws.addRow(COLUMNS.map(c => c.header));
  header.height = 52;
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFC9A84C' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1E2E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      bottom: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      left: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      right: { style: 'thin', color: { argb: 'FFD4C8AE' } },
    };
  });

  // ── Строки данных: числа храним числами, чередуем фон ──
  sorted.forEach((org, i) => {
    const row = ws.addRow([
      i + 1,
      org.name,
      Number(org.totalScore.toFixed(1)),
      Number(org.sumA.toFixed(1)),
      Number(org.sumB.toFixed(1)),
      Number(org.sumC.toFixed(1)),
      Number(org.pj.toFixed(3)),
      Number(org.q.toFixed(0)),
      org.level,
    ]);

    const zebra = i % 2 === 0 ? 'FFF5F0E2' : 'FFEFE9DA';
    row.eachCell((cell, col) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
      cell.alignment = { vertical: 'middle', horizontal: col === 2 ? 'left' : 'center' };
      cell.border = {
        bottom: { style: 'thin', color: { argb: 'FFE0D8C4' } },
        right: { style: 'thin', color: { argb: 'FFE0D8C4' } },
      };
    });
    // Название и итоговый балл — выделить жирным.
    row.getCell(2).font = { bold: true, color: { argb: 'FF2C2820' } };
    row.getCell(3).font = { bold: true, color: { argb: 'FFB8902C' } };
  });

  // Закрепляем шапку — при прокрутке заголовки остаются на месте.
  ws.views = [{ state: 'frozen', ySplit: 1 }];

  // ── Скачивание файла в браузере ──
  const buf = await wb.xlsx.writeBuffer();
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `${i18n.t('exportXlsx.fileRating')}_${date}.xlsx`;
  // Ссылку нужно добавить в DOM, иначе часть браузеров не запускает скачивание.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Освобождаем URL с задержкой — иначе браузер не успевает начать загрузку.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Запускает скачивание готового буфера .xlsx в браузере. */
function downloadXlsx(buf: ArrayBuffer, fileName: string) {
  const blob = new Blob([buf], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Безопасное имя файла: убираем символы, недопустимые в именах файлов. */
function safeFileName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, '_').trim() || i18n.t('exportXlsx.fallbackName');
}

/** Колонки детального листа одной организации. */
function detailColumns(): { header: string; width: number }[] {
  return [
    { header: i18n.t('exportXlsx.colGroup'), width: 12 },
    { header: i18n.t('exportXlsx.colCode'), width: 8 },
    { header: i18n.t('exportXlsx.colIndicator'), width: 46 },
    { header: i18n.t('exportXlsx.colChosen'), width: 40 },
    { header: i18n.t('exportXlsx.colScore'), width: 9 },
  ];
}

/**
 * Выгружает одну организацию в .xlsx со всеми 25 показателями,
 * которые были выбраны при её создании: группа, код, название,
 * выбранный вариант и его балл.
 */
export async function exportOrgToExcel(org: OrgWithRating) {
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(i18n.t('exportXlsx.sheetOrg'));

  const DETAIL_COLUMNS = detailColumns();
  ws.columns = DETAIL_COLUMNS.map(c => ({ width: c.width }));

  // ── Заголовок-«шапка» с названием организации и сводкой ──
  const titleRow = ws.addRow([org.name]);
  ws.mergeCells(titleRow.number, 1, titleRow.number, DETAIL_COLUMNS.length);
  titleRow.height = 26;
  const titleCell = titleRow.getCell(1);
  titleCell.font = { bold: true, size: 14, color: { argb: 'FFC9A84C' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1E2E' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'left' };

  const summaryRow = ws.addRow([
    i18n.t('exportXlsx.summaryTotal', { value: org.totalScore.toFixed(1) }),
    '',
    i18n.t('exportXlsx.summaryGroups', { a: org.sumA.toFixed(1), b: org.sumB.toFixed(1), c: org.sumC.toFixed(1) }),
    i18n.t('exportXlsx.summaryPjQ', { pj: org.pj.toFixed(3), q: org.q.toFixed(0) }),
    i18n.t('exportXlsx.summaryLevel', { level: org.level }),
  ]);
  summaryRow.height = 20;
  summaryRow.eachCell(cell => {
    cell.font = { bold: true, size: 10, color: { argb: 'FF2C2820' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE8E2D0' } };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  });

  ws.addRow([]); // пустая строка-отступ

  // ── Шапка таблицы показателей ──
  const header = ws.addRow(DETAIL_COLUMNS.map(c => c.header));
  header.height = 22;
  header.eachCell(cell => {
    cell.font = { bold: true, color: { argb: 'FFC9A84C' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1E2E' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      bottom: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      left: { style: 'thin', color: { argb: 'FFD4C8AE' } },
      right: { style: 'thin', color: { argb: 'FFD4C8AE' } },
    };
  });

  // ── Строки по всем 25 показателям ──
  let rowIndex = 0;
  getIndicatorGroups(i18n.t).forEach(group => {
    group.indicators.forEach(ind => {
      const score = org.kScores[ind.key as keyof OrgKScores];
      // Подбираем выбранный вариант по баллу (как в редакторе организации).
      const chosen = ind.options.find(opt => opt.score === score);
      const row = ws.addRow([
        group.id,
        ind.code,
        ind.name,
        chosen ? chosen.label : i18n.t('exportXlsx.notSet'),
        Number(score),
      ]);

      const zebra = rowIndex % 2 === 0 ? 'FFF5F0E2' : 'FFEFE9DA';
      row.eachCell((cell, col) => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: zebra } };
        cell.alignment = {
          vertical: 'middle',
          horizontal: col === 3 || col === 4 ? 'left' : 'center',
          wrapText: true,
        };
        cell.border = {
          bottom: { style: 'thin', color: { argb: 'FFE0D8C4' } },
          right: { style: 'thin', color: { argb: 'FFE0D8C4' } },
        };
      });
      row.getCell(2).font = { bold: true, color: { argb: 'FFB8902C' } };
      row.getCell(5).font = { bold: true, color: { argb: 'FF2C2820' } };
      rowIndex++;
    });
  });

  const buf = await wb.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);
  downloadXlsx(buf, `${safeFileName(org.name)}_${date}.xlsx`);
}
