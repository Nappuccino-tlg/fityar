/* ============ Weekly card — the week, as one picture ============
   A summary someone would actually want to send: seven days of calories against
   the goal, what was trained, and which way the weight moved.

   It is drawn straight onto a canvas rather than screenshotted from the DOM.
   The app ships under a strict Content-Security-Policy with script-src 'self',
   so an HTML-to-image library could not load even if one were wanted, and this
   way the card looks the same on every device and works with no connection.

   Nothing here invents a number. A week with two logged days says two days.
================================================================= */

import * as db from './db.js';
import { S } from './store.js';
import { t, getLang } from './i18n.js';
import { todayKey, addDays } from './ui.js';

const W = 1080, H = 1350;                 /* the shape a story wants */
const PAD = 72;

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const faNum = (n) => String(n).replace(/\d/g, (d) => FA_DIGITS[+d]);
const fmt = (n) => (getLang() === 'fa' ? faNum(Math.round(n)) : String(Math.round(n)));
/* one decimal, then the digits — rounding a Persian numeral string gives NaN */
const oneDp = (n) => {
  const v = (Math.round(n * 10) / 10).toFixed(1);
  return getLang() === 'fa' ? faNum(v).replace('.', '٫') : v;
};

/* Indexed by Date#getDay(): 0 is Sunday. The Persian week opens on Saturday,
   which is why the lists start where they do rather than at index 0. */
const DAY_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
const DAY_EN = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const dayLetter = (dateKey) => {
  const d = new Date(dateKey + 'T00:00:00');
  const i = Number.isNaN(d.getTime()) ? 0 : d.getDay();
  return (getLang() === 'fa' ? DAY_FA : DAY_EN)[i];
};

/** The last seven days, oldest first, with whatever was actually logged. */
async function collectWeek() {
  const days = [];
  for (let i = 6; i >= 0; i--) days.push(addDays(todayKey(), -i));

  const [logs, workouts, weights] = await Promise.all([
    db.all('foodLogs'), db.all('workouts'), db.all('weights'),
  ]);

  const kcalByDay = new Map();
  for (const l of logs) {
    if (!days.includes(l.date)) continue;
    kcalByDay.set(l.date, (kcalByDay.get(l.date) || 0) + (l.kcal || 0));
  }

  const trainByDay = new Map();
  let sets = 0, volume = 0;
  for (const w of workouts) {
    if (!days.includes(w.date)) continue;
    trainByDay.set(w.date, (trainByDay.get(w.date) || 0) + 1);
    sets += w.sets || 0;
    volume += w.volume || 0;
  }

  const inWeek = weights.filter(w => days.includes(w.date))
    .sort((a, b) => a.date.localeCompare(b.date));
  const weightFrom = inWeek[0]?.kg ?? null;
  const weightTo = inWeek.at(-1)?.kg ?? null;

  return {
    days,
    kcal: days.map(d => kcalByDay.get(d) || 0),
    trained: days.map(d => (trainByDay.get(d) || 0) > 0),
    loggedDays: days.filter(d => kcalByDay.has(d)).length,
    workouts: [...trainByDay.values()].reduce((a, b) => a + b, 0),
    sets, volume,
    weightFrom, weightTo,
    goal: S.goals.kcal || 0,
  };
}

/* ---------- drawing helpers ---------- */

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

/** Text anchored to the side the language reads from. */
function line(ctx, text, x, y, { size = 34, weight = 600, color = '#e9edf2',
                                align = 'start' } = {}) {
  const rtl = getLang() === 'fa';
  ctx.font = `${weight} ${size}px Vazirmatn, system-ui, sans-serif`;
  ctx.fillStyle = color;
  /* A canvas built in JavaScript is not in the document, so it lays text out
     left to right and Persian digits reorder around the edges of a sentence:
     «۱ روز ثبت‌شده از ۷» came out «روز ثبت‌شده از ۱۷». Physical textAlign is
     unaffected — only 'start' and 'end' follow direction, and this uses
     'left' and 'right'. */
  ctx.direction = rtl ? 'rtl' : 'ltr';
  ctx.textAlign = align === 'start' ? (rtl ? 'right' : 'left')
                : align === 'end' ? (rtl ? 'left' : 'right') : 'center';
  ctx.fillText(text, x, y);
}

const startX = () => (getLang() === 'fa' ? W - PAD : PAD);
const endX = () => (getLang() === 'fa' ? PAD : W - PAD);

/** Draw the card and hand back the canvas. */
export async function drawWeekCard() {
  const d = await collectWeek();
  const cv = document.createElement('canvas');
  cv.width = W; cv.height = H;
  const ctx = cv.getContext('2d');

  /* ground */
  const bg = ctx.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, '#0e1116');
  bg.addColorStop(1, '#131a20');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  /* a wash of the app's accent, so the card is recognisably from here */
  /* Two washes, not one. A single accent over a single grey is a brand
     colour being used as the whole design. */
  const glow = ctx.createRadialGradient(W * 0.82, 140, 20, W * 0.82, 140, 620);
  glow.addColorStop(0, 'rgba(61,220,132,.20)');
  glow.addColorStop(1, 'rgba(61,220,132,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  const cool = ctx.createRadialGradient(W * 0.12, H * 0.78, 20, W * 0.12, H * 0.78, 700);
  cool.addColorStop(0, 'rgba(88,166,255,.14)');
  cool.addColorStop(1, 'rgba(88,166,255,0)');
  ctx.fillStyle = cool;
  ctx.fillRect(0, 0, W, H);

  let y = PAD + 40;
  line(ctx, getLang() === 'fa' ? 'هفته‌ی من' : 'My week', startX(), y,
       { size: 62, weight: 800, color: '#ffffff' });
  y += 52;
  line(ctx, getLang() === 'fa'
         ? `${faNum(d.loggedDays)} روز ثبت‌شده از ۷`
         : `${d.loggedDays} of 7 days logged`,
       startX(), y, { size: 30, weight: 500, color: '#93a1b1' });

  /* ---- the seven days ---- */
  y += 96;
  const chartH = 300, barW = 96, gap = (W - PAD * 2 - barW * 7) / 6;
  const peak = Math.max(d.goal, ...d.kcal, 1);

  /* the goal, as one quiet line across the week */
  if (d.goal) {
    const gy = y + chartH - (d.goal / peak) * chartH;
    ctx.strokeStyle = 'rgba(147,161,177,.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([10, 10]);
    ctx.beginPath(); ctx.moveTo(PAD, gy); ctx.lineTo(W - PAD, gy); ctx.stroke();
    ctx.setLineDash([]);
    line(ctx, `${t('goal')} ${fmt(d.goal)}`, endX(), gy - 16,
         { size: 24, weight: 600, color: '#93a1b1', align: 'end' });
  }

  d.kcal.forEach((k, i) => {
    /* right to left in Persian, so the week reads the way the language does */
    const idx = getLang() === 'fa' ? 6 - i : i;
    const x = PAD + idx * (barW + gap);
    const h = Math.max(k > 0 ? 10 : 0, (k / peak) * chartH);

    ctx.fillStyle = 'rgba(255,255,255,.055)';
    roundRect(ctx, x, y, barW, chartH, 20); ctx.fill();

    if (k > 0) {
      const over = d.goal && k > d.goal;
      const grad = ctx.createLinearGradient(0, y + chartH - h, 0, y + chartH);
      grad.addColorStop(0, over ? '#ffb454' : '#5df0a1');
      grad.addColorStop(1, over ? '#e08b2a' : '#2fae76');
      ctx.fillStyle = grad;
      roundRect(ctx, x, y + chartH - h, barW, h, 20); ctx.fill();
    }

    /* a dot under the day when it was also trained */
    if (d.trained[i]) {
      ctx.fillStyle = '#3ddc84';
      ctx.beginPath(); ctx.arc(x + barW / 2, y + chartH + 58, 7, 0, Math.PI * 2); ctx.fill();
    }
    line(ctx, dayLetter(d.days[i]), x + barW / 2, y + chartH + 40,
         { size: 26, weight: 600, color: '#93a1b1', align: 'center' });
  });

  /* ---- the three numbers worth showing ---- */
  y += chartH + 130;
  const avg = d.loggedDays ? d.kcal.reduce((a, b) => a + b, 0) / d.loggedDays : 0;
  const dw = (d.weightFrom != null && d.weightTo != null) ? d.weightTo - d.weightFrom : null;

  const tiles = [
    [fmt(avg), getLang() === 'fa' ? 'میانگین کالری' : 'avg kcal'],
    [fmt(d.workouts), getLang() === 'fa' ? 'تمرین' : 'workouts'],
    dw == null
      ? ['—', getLang() === 'fa' ? 'تغییر وزن' : 'weight']
      : [(dw > 0 ? '+' : dw < 0 ? '−' : '') + oneDp(Math.abs(dw)),
         getLang() === 'fa' ? 'کیلو تغییر' : 'kg change'],
  ];
  /* One colour per tile, and the same three the rest of the app uses for
     the same three things: energy, training, body. Carried by the tile's
     wash and its rule rather than by the figure, which stays white so it
     survives being screenshotted and shrunk. */
  const TINTS = ['61,220,132', '88,166,255', '185,140,255'];
  const tileW = (W - PAD * 2 - 28 * 2) / 3;
  tiles.forEach((tile, i) => {
    const idx = getLang() === 'fa' ? 2 - i : i;
    const x = PAD + idx * (tileW + 28);
    const tint = TINTS[i];
    ctx.fillStyle = `rgba(${tint},.10)`;
    roundRect(ctx, x, y, tileW, 168, 26); ctx.fill();
    ctx.strokeStyle = `rgba(${tint},.34)`; ctx.lineWidth = 2; ctx.stroke();
    line(ctx, tile[0], x + tileW / 2, y + 76, { size: 52, weight: 800, color: '#ffffff', align: 'center' });
    ctx.fillStyle = `rgba(${tint},.85)`;
    ctx.fillRect(x + tileW / 2 - 26, y + 92, 52, 5);
    line(ctx, tile[1], x + tileW / 2, y + 134, { size: 25, weight: 500, color: '#a9b7c6', align: 'center' });
  });

  /* ---- sets and volume, when there were any ---- */
  y += 220;
  if (d.sets) {
    line(ctx, getLang() === 'fa'
           ? `${faNum(d.sets)} ست · ${faNum(Math.round(d.volume))} کیلوگرم حجم`
           : `${d.sets} sets · ${Math.round(d.volume)} kg volume`,
         startX(), y, { size: 30, weight: 600, color: '#c9d4df' });
    y += 54;
  }

  /* ---- the mark at the foot ---- */
  ctx.fillStyle = '#3ddc84';
  roundRect(ctx, getLang() === 'fa' ? W - PAD - 64 : PAD, H - PAD - 64, 64, 64, 20);
  ctx.fill();
  line(ctx, 'F', (getLang() === 'fa' ? W - PAD - 32 : PAD + 32), H - PAD - 20,
       { size: 40, weight: 800, color: '#06101f', align: 'center' });
  line(ctx, getLang() === 'fa' ? 'ساخته‌شده با فیت‌یار' : 'Made with FitYar',
       getLang() === 'fa' ? W - PAD - 84 : PAD + 84, H - PAD - 20,
       { size: 28, weight: 600, color: '#93a1b1' });

  return { canvas: cv, data: d };
}

/**
 * Hand the picture to whatever the device can do with it.
 *
 * Sharing a file is the point, but it is not available everywhere: an older
 * WebView, a desktop browser, or a platform that refuses files all end up here.
 * Each fallback is quieter than the last, and the card stays on screen either
 * way, so a screenshot is always possible.
 */
export async function shareCanvas(canvas) {
  const blob = await new Promise(res => canvas.toBlob(res, 'image/png'));
  if (!blob) return 'failed';

  const file = new File([blob], 'fityar-week.png', { type: 'image/png' });
  if (navigator.canShare?.({ files: [file] })) {
    try { await navigator.share({ files: [file] }); return 'shared'; }
    catch (e) { if (e?.name === 'AbortError') return 'cancelled'; }
  }

  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'fityar-week.png';
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    return 'saved';
  } catch { return 'screenshot'; }
}

/* ---------------- the sheet ---------------- */

/**
 * Show the card, at a size a phone can actually see, with one button that does
 * whatever this device supports.
 *
 * The canvas is drawn at story resolution and displayed scaled down, so what
 * gets shared is full size while what is on screen fits the sheet.
 */
export async function openWeekCard() {
  const ui = await import('./ui.js');
  const { canvas, data } = await drawWeekCard();

  canvas.style.cssText = 'width:100%;height:auto;border-radius:var(--r-lg);display:block';
  const status = ui.el('div', { class: 'muted',
    style: 'margin-top:10px;min-height:20px;text-align:center;font-size:var(--t-sm);line-height:1.7' });

  /* A week with nothing in it makes a card nobody wants to send. Say so rather
     than producing an empty picture. */
  if (!data.loggedDays && !data.workouts) {
    status.textContent = t('weekCardEmpty');
  }

  const share = ui.el('button', { class: 'btn full', style: 'margin-top:14px',
    onclick: async () => {
      const how = await shareCanvas(canvas);
      status.textContent =
        how === 'shared' ? t('weekCardShared')
        : how === 'saved' ? t('weekCardSaved')
        : how === 'cancelled' ? ''
        : t('weekCardScreenshot');
    } }, t('weekCardShare'));

  /* plain download, for when sharing is not what is wanted */
  const dl = ui.el('button', { class: 'btn ghost full', style: 'margin-top:8px',
    onclick: () => {
      canvas.toBlob(blob => {
        if (!blob) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `fityar-week-${new Date().toISOString().slice(0, 10)}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 4000);
        status.textContent = t('weekCardSaved');
      }, 'image/png');
    } }, '⬇ ' + t('storyMake'));

  ui.sheet(t('weekCard'), ui.el('div', {}, canvas, share, dl, status));
}
