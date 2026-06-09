import type { OrgWithRating, RankMode } from '../types';

/** Колонки листа — порядок и ширина совпадают с таблицей результатов. */
const COLUMNS: { header: string; width: number }[] = [
  { header: '#', width: 5 },
  { header: 'Организация', width: 38 },
  { header: 'Балл', width: 9 },
  { header: 'ΣА', width: 9 },
  { header: 'ΣБ', width: 9 },
  { header: 'ΣВ', width: 9 },
  { header: 'Pj', width: 10 },
  { header: 'Качество (Q), %', width: 16 },
  { header: 'Уровень', width: 10 },
];

/**
 * Выгружает отранжированный список организаций в файл .xlsx
 * со стилизованной шапкой. Сортировка повторяет экран «Результаты».
 */
export async function exportResultsToExcel(orgs: OrgWithRating[], mode: RankMode) {
  const sorted = [...orgs].sort((a, b) =>
    mode === 'score' ? b.totalScore - a.totalScore : a.pj - b.pj
  );

  // Подгружаем тяжёлую библиотеку только при экспорте — не утяжеляем стартовый бандл.
  const { default: ExcelJS } = await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet('Рейтинг');

  ws.columns = COLUMNS.map(c => ({ width: c.width }));

  // ── Строка-заголовок: жирный текст, тёмный фон, золотой цвет ──
  const header = ws.addRow(COLUMNS.map(c => c.header));
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
  a.download = `Рейтинг_аудиторских_организаций_${date}.xlsx`;
  // Ссылку нужно добавить в DOM, иначе часть браузеров не запускает скачивание.
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Освобождаем URL с задержкой — иначе браузер не успевает начать загрузку.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
