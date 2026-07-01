/**
 * Рисование простых столбчатых диаграмм на canvas и выгрузка их в PNG (base64).
 * Используется только при экспорте одной организации в Excel: ExcelJS не умеет
 * создавать нативные диаграммы, поэтому график рисуется картинкой и вставляется
 * на лист через ws.addImage(). Палитра и стиль повторяют экран «Аналитика».
 */

export interface BarDatum {
  label: string;
  value: number;
  /** HEX-цвет столбца, например '#7a9a5a'. */
  color: string;
}

export interface ChartImage {
  /** PNG без префикса data-URL — готов для ExcelJS addImage({ base64 }). */
  base64: string;
  /** Размер в пикселях для ext-якоря изображения. */
  width: number;
  height: number;
}

const BG = '#ffffff';
const INK = '#2c2820';
const LABEL = '#4a3e2e';
const MUTED = '#9a8a70';
const GRID = '#e4dcc8';
const AXIS = '#d4c8ae';
const TRACK = '#f0ead9';
const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';

/** «Красивая» шкала: округлённый максимум и ровные деления (как на экране «Аналитика»). */
function niceAxis(maxVal: number): { max: number; ticks: number[] } {
  if (maxVal <= 0) return { max: 10, ticks: [0, 5, 10] };
  const rough = maxVal / 4;
  const pow = Math.pow(10, Math.floor(Math.log10(rough)));
  const n = rough / pow;
  const step = (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * pow;
  const max = Math.ceil(maxVal / step) * step;
  const ticks: number[] = [];
  for (let v = 0; v <= max + 1e-9; v += step) ticks.push(Math.round(v * 100) / 100);
  return { max, ticks };
}

function formatVal(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(1);
}

/** Canvas с 2× плотностью для чёткого изображения; работа ведётся в логических пикселях. */
function makeCanvas(width: number, height: number) {
  const scale = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');
  ctx.scale(scale, scale);
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, width, height);
  return { canvas, ctx };
}

function toBase64(canvas: HTMLCanvasElement): string {
  return canvas.toDataURL('image/png').split(',')[1];
}

/** Прямоугольник со скруглёнными верхними углами (для вертикальных столбцов). */
function barTop(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return;
  const rr = Math.min(r, w / 2, h);
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fill();
}

/** Прямоугольник со скруглёнными правыми углами (для горизонтальных полос). */
function barRight(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (w <= 0) return;
  const rr = Math.min(r, h / 2, w);
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x, y + h);
  ctx.closePath();
  ctx.fill();
}

/** Вертикальная столбчатая диаграмма (немного категорий: группы А/Б/В). */
export function verticalBarChart(title: string, data: BarDatum[]): ChartImage {
  const width = 500;
  const height = 320;
  const padL = 46, padR = 22, padT = 50, padB = 44;
  const { canvas, ctx } = makeCanvas(width, height);

  const plotW = width - padL - padR;
  const plotH = height - padT - padB;
  const x0 = padL;
  const yBase = padT + plotH;
  const axis = niceAxis(Math.max(...data.map(d => d.value), 0));

  // Заголовок
  ctx.fillStyle = INK;
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(title, padL - 10, 28);

  // Сетка и подписи оси Y
  ctx.font = `500 11px ${FONT}`;
  axis.ticks.forEach(tk => {
    const y = yBase - (tk / axis.max) * plotH;
    ctx.strokeStyle = tk === 0 ? AXIS : GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x0, y + 0.5);
    ctx.lineTo(x0 + plotW, y + 0.5);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'right';
    ctx.fillText(formatVal(tk), x0 - 8, y + 4);
  });

  // Столбцы
  const slot = plotW / data.length;
  const barW = Math.min(70, slot * 0.5);
  data.forEach((d, i) => {
    const cx = x0 + slot * (i + 0.5);
    const h = axis.max > 0 ? (Math.max(0, d.value) / axis.max) * plotH : 0;
    ctx.fillStyle = d.color;
    barTop(ctx, cx - barW / 2, yBase - h, barW, h, 5);

    ctx.textAlign = 'center';
    ctx.fillStyle = INK;
    ctx.font = `700 14px ${FONT}`;
    ctx.fillText(formatVal(d.value), cx, yBase - h - 8);

    ctx.fillStyle = LABEL;
    ctx.font = `600 13px ${FONT}`;
    ctx.fillText(d.label, cx, yBase + 22);
  });

  return { base64: toBase64(canvas), width, height };
}

/** Горизонтальная столбчатая диаграмма (много категорий: 25 показателей). */
export function horizontalBarChart(title: string, data: BarDatum[]): ChartImage {
  const rowH = 20, gap = 5;
  const padL = 58, padR = 46, padT = 50, padB = 22;
  const width = 580;
  const height = padT + padB + data.length * (rowH + gap) - gap;
  const { canvas, ctx } = makeCanvas(width, height);

  const plotW = width - padL - padR;
  const axis = niceAxis(Math.max(...data.map(d => d.value), 0));

  // Заголовок
  ctx.fillStyle = INK;
  ctx.font = `700 16px ${FONT}`;
  ctx.textAlign = 'left';
  ctx.fillText(title, padL - 12, 28);

  // Вертикальная сетка и подписи оси X сверху
  ctx.font = `500 10px ${FONT}`;
  axis.ticks.forEach(tk => {
    const x = padL + (tk / axis.max) * plotW;
    ctx.strokeStyle = tk === 0 ? AXIS : GRID;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 0.5, padT - 4);
    ctx.lineTo(x + 0.5, height - padB);
    ctx.stroke();
    ctx.fillStyle = MUTED;
    ctx.textAlign = 'center';
    ctx.fillText(formatVal(tk), x, padT - 10);
  });

  // Полосы
  data.forEach((d, i) => {
    const y = padT + i * (rowH + gap);
    const val = Math.max(0, d.value);
    const w = axis.max > 0 ? (val / axis.max) * plotW : 0;

    // Подпись слева (код показателя)
    ctx.fillStyle = LABEL;
    ctx.textAlign = 'right';
    ctx.font = `600 11px ${FONT}`;
    ctx.fillText(d.label, padL - 8, y + rowH / 2 + 4);

    // Фоновая дорожка + полоса
    ctx.fillStyle = TRACK;
    barRight(ctx, padL, y, plotW, rowH, 4);
    ctx.fillStyle = d.color;
    barRight(ctx, padL, y, w, rowH, 4);

    // Значение в конце полосы
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.font = `700 11px ${FONT}`;
    ctx.fillText(formatVal(d.value), padL + w + 6, y + rowH / 2 + 4);
  });

  return { base64: toBase64(canvas), width, height };
}
