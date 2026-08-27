/* ============ End-of-day report: what was over-, under- or un-eaten ============ */
import * as db from './db.js';
import { S, fiberGoal } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, round, sum,
  todayKey, addDays, longDate, shortDate, dateLabel, buzz,
} from './ui.js';
import { logsFor, totals, burnedOn, getWater } from './nutrition.js';
import { kgToDisp, wUnit } from './store.js';
import { MEAL_KEYS, MEAL_ICON } from './store.js';
import { FOOD_INDEX } from './data-foods.js';
import { emptyArt } from './art.js';

/* ---------------- status colours ---------------- */

/** over → red, under → amber, inside the band → green. */
export function statusOf(value, target, { overPct = 0.08, underPct = 0.12 } = {}) {
  if (!target) return 'none';
  const r = value / target;
  if (r > 1 + overPct) return 'over';
  if (r < 1 - underPct) return 'under';
  return 'ok';
}
export const STATUS_COLOR = {
  over: 'var(--red)', under: 'var(--warn)', ok: 'var(--acc)', none: 'var(--line2)',
};
export const STATUS_LABEL = { over: 'overBudget', under: 'underBudget', ok: 'onTarget', none: 'empty' };

/* ---------------- food-group coverage ---------------- */

const GROUPS = [
  { id: 'veg',     label: 'groupVeg',     cats: ['veg'],                    minG: 200, icon: '🥬' },
  { id: 'fruit',   label: 'groupFruit',   cats: ['fruit'],                  minG: 150, icon: '🍎' },
  { id: 'protein', label: 'groupProtein', cats: ['protein', 'supp'],        minG: 150, icon: '🍗' },
  { id: 'dairy',   label: 'groupDairy',   cats: ['dairy'],                  minG: 150, icon: '🥛' },
  { id: 'grain',   label: 'groupGrain',   cats: ['grain', 'iranian'],       minG: 150, icon: '🍚' },
  { id: 'nut',     label: 'groupNut',     cats: ['nut'],                    minG: 15,  icon: '🥜' },
  { id: 'snack',   label: 'groupSnack',   cats: ['snack'],                  maxG: 60,  icon: '🍫' },
];

/** Grams eaten per food group, using the built-in category of each logged food. */
function groupGrams(logs) {
  const out = {};
  GROUPS.forEach(g => out[g.id] = 0);
  for (const l of logs) {
    const f = l.foodId ? FOOD_INDEX[l.foodId] : null;
    let cat = f?.cat;
    if (!cat && l.source === 'ai') cat = guessCat(l);
    if (!cat) continue;
    const g = GROUPS.find(x => x.cats.includes(cat));
    if (g) out[g.id] += l.grams || 0;
  }
  return out;
}

/** Very rough category guess for AI-logged items, from the name. */
function guessCat(log) {
  const s = ((log.name || '') + ' ' + (log.nameFa || '')).toLowerCase();
  const has = (...w) => w.some(x => s.includes(x));
  if (has('salad', 'tomato', 'cucumber', 'lettuce', 'spinach', 'broccoli', 'carrot', 'onion', 'pepper',
          'سالاد', 'گوجه', 'خیار', 'کاهو', 'اسفناج', 'کلم', 'هویج', 'سبزی', 'بادمجان', 'کدو', 'قارچ')) return 'veg';
  if (has('apple', 'banana', 'orange', 'grape', 'melon', 'berry', 'fruit', 'date',
          'سیب', 'موز', 'پرتقال', 'انگور', 'هندوانه', 'میوه', 'خرما', 'انار', 'کیوی', 'هلو')) return 'fruit';
  if (has('chicken', 'beef', 'lamb', 'fish', 'egg', 'tuna', 'shrimp', 'turkey', 'meat', 'protein', 'lentil', 'bean',
          'مرغ', 'گوشت', 'ماهی', 'تخم', 'میگو', 'بوقلمون', 'کباب', 'عدس', 'لوبیا', 'نخود', 'پروتئین')) return 'protein';
  if (has('milk', 'yogurt', 'cheese', 'kashk', 'doogh', 'cream',
          'شیر', 'ماست', 'پنیر', 'کشک', 'دوغ', 'خامه')) return 'dairy';
  if (has('rice', 'bread', 'pasta', 'oat', 'potato', 'quinoa', 'corn', 'noodle',
          'برنج', 'نان', 'ماکارونی', 'جو', 'سیب‌زمینی', 'سیب زمینی', 'پلو', 'ذرت', 'رشته')) return 'grain';
  if (has('almond', 'walnut', 'pistachio', 'cashew', 'peanut', 'seed', 'nut',
          'بادام', 'گردو', 'پسته', 'فندق', 'تخمه', 'آجیل', 'ارده')) return 'nut';
  if (has('chocolate', 'cake', 'candy', 'chips', 'cookie', 'ice cream', 'sugar', 'soda', 'cola', 'juice', 'jam', 'honey',
          'شکلات', 'کیک', 'شیرینی', 'چیپس', 'بیسکویت', 'بستنی', 'شکر', 'نوشابه', 'آبمیوه', 'مربا', 'عسل', 'حلوا')) return 'snack';
  return null;
}

/* ---------------- the report ---------------- */

/**
 * Build the analysis for one day. Pure computation — safe to call any time.
 */
export async function buildReport(date) {
  const logs = await logsFor(date);
  const tt = totals(logs);
  const burned = await burnedOn(date);
  const water = await getWater(date);
  const g = S.goals;

  const metrics = [
    { key: 'kcal',    label: 'kcal',    value: tt.kcal,    target: g.kcal,    unit: '',  icon: '🔥' },
    { key: 'protein', label: 'protein', value: tt.protein, target: g.protein, unit: 'g', icon: '🥩' },
    { key: 'carbs',   label: 'carbs',   value: tt.carbs,   target: g.carbs,   unit: 'g', icon: '🍞' },
    { key: 'fat',     label: 'fat',     value: tt.fat,     target: g.fat,     unit: 'g', icon: '🥑' },
    { key: 'fiber',   label: 'fiber',   value: tt.fiber,   target: fiberGoal(), unit: 'g', icon: '🌾' },
    { key: 'water',   label: 'water',   value: water,      target: g.water,   unit: 'ml', icon: '💧' },
  ].map(m => {
    const st = statusOf(m.value, m.target);
    return { ...m, status: st, diff: round(m.value - m.target, 1), pct: m.target ? round(m.value / m.target * 100) : 0 };
  });

  const grams = groupGrams(logs);
  const groups = GROUPS.map(gr => {
    const v = round(grams[gr.id] || 0);
    let status = 'ok';
    if (gr.maxG !== undefined) status = v > gr.maxG ? 'over' : 'ok';
    else if (v <= 0) status = 'missing';
    else if (v < gr.minG) status = 'under';
    return { id: gr.id, label: gr.label, icon: gr.icon, grams: v, status,
             limit: gr.maxG !== undefined ? gr.maxG : gr.minG, isLimit: gr.maxG !== undefined };
  });

  /* headline status of the whole day, driven by calories */
  const dayStatus = metrics[0].status;

  const advice = buildAdvice(metrics, groups, logs);

  return {
    date, closed: true, closedAt: Date.now(),
    kcal: tt.kcal, protein: tt.protein, carbs: tt.carbs, fat: tt.fat, fiber: tt.fiber,
    water, burned, meals: logs.length,
    goals: { kcal: g.kcal, protein: g.protein, carbs: g.carbs, fat: g.fat, water: g.water },
    metrics, groups, dayStatus, advice,
  };
}

/** Turn the numbers into short, specific sentences. */
function buildAdvice(metrics, groups, logs) {
  const fa = getLang() === 'fa';
  const out = [];
  const M = Object.fromEntries(metrics.map(m => [m.key, m]));

  const over = (m) => Math.abs(m.diff);
  if (M.kcal.status === 'over') {
    out.push({ kind: 'over', icon: '🔥', text: fa
      ? `${num(over(M.kcal))} کالری بیشتر از هدف مصرف شد. فردا یا کمی کمتر بخور یا یک جلسه هوازی اضافه کن.`
      : `You ate ${num(over(M.kcal))} kcal over target. Trim a little tomorrow or add a cardio session.` });
  } else if (M.kcal.status === 'under') {
    out.push({ kind: 'under', icon: '🔥', text: fa
      ? `${num(over(M.kcal))} کالری کمتر از هدف خوردی. کم‌خوری مداوم جلوی عضله‌سازی و ریکاوری را می‌گیرد.`
      : `You were ${num(over(M.kcal))} kcal under target. Chronic under-eating blocks recovery and muscle gain.` });
  } else {
    out.push({ kind: 'ok', icon: '✅', text: fa ? 'کالری امروز دقیقاً در محدوده‌ی هدف بود.' : 'Calories landed right on target today.' });
  }

  if (M.protein.status === 'under') {
    out.push({ kind: 'under', icon: '🥩', text: fa
      ? `${num(over(M.protein))} گرم پروتئین کم آوردی. یک منبع پروتئین (سینه مرغ، ماست یونانی، تخم‌مرغ یا وی) اضافه کن.`
      : `${num(over(M.protein))}g short on protein. Add a protein source — chicken breast, Greek yogurt, eggs or whey.` });
  } else if (M.protein.status === 'ok' || M.protein.status === 'over') {
    out.push({ kind: 'ok', icon: '🥩', text: fa ? 'پروتئین امروز کافی بود.' : 'Protein was covered today.' });
  }

  if (M.fat.status === 'over') {
    out.push({ kind: 'over', icon: '🥑', text: fa
      ? `چربی ${num(over(M.fat))} گرم بیشتر از هدف بود — معمولاً از روغن پخت‌وپز و سس می‌آید.`
      : `Fat ran ${num(over(M.fat))}g over — usually cooking oil and sauces.` });
  }
  if (M.carbs.status === 'over') {
    out.push({ kind: 'over', icon: '🍞', text: fa
      ? `کربوهیدرات ${num(over(M.carbs))} گرم بیشتر از هدف بود. حجم برنج/نان را کمی کم کن.`
      : `Carbs ran ${num(over(M.carbs))}g over. Ease back on the rice/bread portion.` });
  }
  if (M.fiber.status === 'under') {
    out.push({ kind: 'under', icon: '🌾', text: fa
      ? 'فیبر کم بود. سبزیجات، حبوبات و میوه بیشتری اضافه کن.'
      : 'Fiber was low. Add more vegetables, legumes and fruit.' });
  }
  if (M.water.status === 'under') {
    out.push({ kind: 'under', icon: '💧', text: fa
      ? `${num(Math.abs(M.water.diff))} میلی‌لیتر آب کمتر از هدف نوشیدی.`
      : `You drank ${num(Math.abs(M.water.diff))} ml less water than your target.` });
  }

  for (const gr of groups) {
    if (gr.status === 'missing') {
      out.push({ kind: 'missing', icon: gr.icon, text: fa
        ? `${t(gr.label)}: امروز اصلاً مصرف نشد.`
        : `${t(gr.label)}: none at all today.` });
    } else if (gr.status === 'under') {
      out.push({ kind: 'under', icon: gr.icon, text: fa
        ? `${t(gr.label)}: فقط ${num(gr.grams)} گرم — کمتر از حد مطلوب (${num(gr.limit)} گرم).`
        : `${t(gr.label)}: only ${num(gr.grams)}g — below the ${num(gr.limit)}g mark.` });
    } else if (gr.status === 'over') {
      out.push({ kind: 'over', icon: gr.icon, text: fa
        ? `${t(gr.label)}: ${num(gr.grams)} گرم — بیش از حد توصیه‌شده (${num(gr.limit)} گرم).`
        : `${t(gr.label)}: ${num(gr.grams)}g — above the recommended ${num(gr.limit)}g.` });
    }
  }

  if (!logs.length) {
    return [{ kind: 'missing', icon: '📭', text: fa ? 'امروز هیچ غذایی ثبت نشد.' : 'No food was logged today.' }];
  }
  return out;
}

/* ---------------- persistence ---------------- */

export const getReport = (date) => db.get('dayReports', date);
export const allReports = async () => {
  const rs = await db.all('dayReports');
  rs.sort((a, b) => a.date < b.date ? 1 : -1);
  return rs;
};

export async function closeDay(date) {
  const rep = await buildReport(date);
  await db.put('dayReports', rep);
  buzz(45);
  return rep;
}
export async function reopenDay(date) {
  await db.del('dayReports', date);
}

/**
 * Any past day that has food logged but no report yet gets one, so history is
 * complete whether or not the user remembered to tap "last meal". Runs at boot
 * and whenever the date rolls over while the app is open.
 */
export async function autoArchive() {
  const today = todayKey();
  const logs = await db.all('foodLogs');
  if (!logs.length) return 0;

  const pastDays = [...new Set(logs.map(l => l.date))].filter(d => d < today);
  if (!pastDays.length) return 0;

  const existing = new Set((await db.all('dayReports')).map(r => r.date));
  let made = 0;
  for (const d of pastDays) {
    if (existing.has(d)) continue;
    const rep = await buildReport(d);
    rep.auto = true;                    // archived by the app, not closed by hand
    await db.put('dayReports', rep);
    made++;
  }
  return made;
}

/**
 * The first date anything at all was recorded — food, a workout or a weigh-in.
 * History runs continuously from here to today, so a blank Tuesday still gets
 * a row rather than silently disappearing.
 */
export async function firstRecordedDay() {
  const [logs, workouts, weights] = await Promise.all([
    db.all('foodLogs'), db.all('workouts'), db.all('weights'),
  ]);
  const dates = [
    ...logs.map(x => x.date),
    ...workouts.map(x => x.date),
    ...weights.map(x => x.date),
  ].filter(Boolean);
  if (!dates.length) return null;
  return dates.reduce((m, d) => (d < m ? d : m), dates[0]);
}

/** Every date from the first record up to today, newest first. */
export async function historyDates() {
  const first = await firstRecordedDay();
  if (!first) return [];
  const out = [];
  let cur = todayKey();
  let guard = 0;
  while (cur >= first && guard++ < 4000) {
    out.push(cur);
    cur = addDays(cur, -1);
  }
  return out;
}

/** Status colour for a date, if that day has been closed. */
export async function dayStatusMap() {
  const rs = await db.all('dayReports');
  return Object.fromEntries(rs.map(r => [r.date, r.dayStatus]));
}

/* ============================================================
   UI
   ============================================================ */

export function reportSheet(rep) {
  sheet(`${t('dayReport')} · ${dateLabel(rep.date)}`, dayBody(rep, rep.date));
}

/** Everything logged that day, grouped by meal. Loads asynchronously. */
function eatenBlock(date) {
  const host = el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, t('whatYouAte'))));
  const body = el('div', {}, el('div', { class: 'muted', style: 'padding:8px 0' }, t('loading')));
  host.append(body);

  logsFor(date).then(logs => {
    body.replaceChildren();
    if (!logs.length) {
      body.append(el('div', { class: 'empty' }, t('nothingLogged')));
      return;
    }
    for (const mk of MEAL_KEYS) {
      const items = logs.filter(l => l.meal === mk);
      if (!items.length) continue;
      const mkcal = Math.round(sum(items, x => x.kcal));
      body.append(el('div', { class: 'ate-head', dataset: { meal: mk } },
        el('span', {}, `${MEAL_ICON[mk]} ${t(mk)}`),
        el('b', {}, `${num(mkcal)} ${t('kcal')}`)));
      items.forEach(it => body.append(el('div', { class: 'ate-row' },
        el('div', { class: 'ate-name' },
          el('b', {}, pick(it)),
          el('span', {}, `${num(round(it.grams))}g`)),
        el('div', { class: 'ate-mac' },
          el('span', { style: 'color:var(--blue)' }, `P ${num(round(it.protein, 1), it.protein % 1 ? 1 : 0)}`),
          el('span', { style: 'color:var(--orange)' }, `C ${num(round(it.carbs, 1), it.carbs % 1 ? 1 : 0)}`),
          el('span', { style: 'color:var(--pink)' }, `F ${num(round(it.fat, 1), it.fat % 1 ? 1 : 0)}`)),
        el('b', { class: 'ate-kcal' }, num(Math.round(it.kcal))))));
    }
  }).catch(() => body.replaceChildren(el('div', { class: 'empty' }, t('error'))));

  return host;
}

export function reportBody(rep) {
  const fa = getLang() === 'fa';
  const box = el('div', {});

  /* headline */
  const col = STATUS_COLOR[rep.dayStatus];
  box.append(el('div', { class: 'rep-hero', style: `--rc:${col}` },
    el('div', { class: 'rep-ring' }, donut(rep.kcal, rep.goals.kcal, 96)),
    el('div', { style: 'flex:1' },
      el('b', { style: `font-size:16px;color:${col};display:block` }, t(STATUS_LABEL[rep.dayStatus] || 'onTarget')),
      el('span', { class: 'muted' }, `${num(rep.kcal)} / ${num(rep.goals.kcal)} ${t('kcal')}`),
      el('span', { class: 'muted', style: 'display:block;font-size:11.5px;margin-top:3px' },
        `${num(rep.meals)} ${fa ? 'قلم غذا' : 'items'} · ${num(rep.burned)} ${t('burned')}`),
      rep.auto ? el('span', { class: 'auto-tag' }, t('autoArchived')) : null),
  ));

  /* metric bars */
  const bars = el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, t('summary'))));
  rep.metrics.forEach(m => {
    const c = STATUS_COLOR[m.status];
    const w = Math.min(100, m.target ? m.value / m.target * 100 : 0);
    bars.append(el('div', { class: 'rep-metric' },
      el('div', { class: 'rep-metric-top' },
        el('span', {}, `${m.icon} ${t(m.label)}`),
        el('b', { style: `color:${c}` },
          `${num(round(m.value))}${m.unit} / ${num(round(m.target))}${m.unit}`)),
      el('div', { class: 'rep-track' }, el('i', { style: `width:${w}%;background:${c}` })),
      el('span', { class: 'rep-diff', style: `color:${c}` },
        m.status === 'over' ? `+${num(round(Math.abs(m.diff)))}${m.unit} ${t('overBudget')}`
        : m.status === 'under' ? `−${num(round(Math.abs(m.diff)))}${m.unit} ${t('underBudget')}`
        : t('onTarget')),
    ));
  });
  box.append(bars);

  /* everything that was actually eaten */
  box.append(eatenBlock(rep.date));

  /* food groups */
  const gh = el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, fa ? 'گروه‌های غذایی' : 'Food groups')),
    el('div', { class: 'grp-grid' },
      ...rep.groups.map(gr => {
        const c = gr.status === 'missing' ? 'var(--red)'
                : gr.status === 'under' ? 'var(--warn)'
                : gr.status === 'over' ? 'var(--red)' : 'var(--acc)';
        return el('div', { class: 'grp', style: `--gc:${c}` },
          el('span', { class: 'grp-ico' }, gr.icon),
          el('b', {}, t(gr.label)),
          el('span', { class: 'grp-v' }, gr.status === 'missing' ? (fa ? 'هیچ' : 'none') : `${num(gr.grams)}g`));
      })));
  box.append(gh);

  /* advice */
  const ad = el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, t('advice'))));
  rep.advice.forEach(a => {
    const c = a.kind === 'over' ? 'var(--red)' : a.kind === 'under' ? 'var(--warn)'
            : a.kind === 'missing' ? 'var(--red)' : 'var(--acc)';
    ad.append(el('div', { class: 'adv', style: `--ac:${c}` },
      el('span', { class: 'adv-ico' }, a.icon),
      el('p', {}, a.text)));
  });
  box.append(ad);

  return box;
}

/** "P 148/150" with a bar showing how close it landed. */
function macroPip(letter, value, target, color) {
  const pct = target ? Math.min(100, value / target * 100) : 0;
  return el('div', { class: 'rep-pip', style: `--pc:${color}` },
    el('span', {}, `${letter} ${num(value)}`),
    el('i', {}, el('u', { style: `width:${pct}%` })));
}

/** Small SVG donut used in report cards. */
export function donut(value, target, size = 96) {
  const NS = 'http://www.w3.org/2000/svg';
  const r = 40, C = 2 * Math.PI * r;
  const ratio = target ? value / target : 0;
  const st = statusOf(value, target);
  const col = STATUS_COLOR[st];
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 100 100');
  svg.setAttribute('width', size); svg.setAttribute('height', size);
  const mk = (attrs) => { const n = document.createElementNS(NS, 'circle');
    Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); return n; };
  svg.append(mk({ cx: 50, cy: 50, r, fill: 'none', stroke: 'var(--card2)', 'stroke-width': 9 }));
  svg.append(mk({
    cx: 50, cy: 50, r, fill: 'none', stroke: col, 'stroke-width': 9, 'stroke-linecap': 'round',
    'stroke-dasharray': C, 'stroke-dashoffset': C * (1 - Math.min(1, Math.max(0, ratio))),
    transform: 'rotate(-90 50 50)',
  }));
  const txt = document.createElementNS(NS, 'text');
  txt.setAttribute('x', 50); txt.setAttribute('y', 54);
  txt.setAttribute('text-anchor', 'middle');
  txt.setAttribute('fill', col);
  txt.setAttribute('font-size', 20);
  txt.setAttribute('font-weight', 700);
  txt.textContent = num(Math.round(ratio * 100)) + '٪'.replace('٪', getLang() === 'fa' ? '٪' : '%');
  svg.append(txt);
  return svg;
}

/* ---------------- history screen ---------------- */

export async function renderReports(hostSel = '#reports-body') {
  const host = typeof hostSel === 'string' ? $(hostSel) : hostSel;
  if (!host) return;
  host.replaceChildren();

  const dates = await historyDates();
  if (!dates.length) {
    host.append(el('div', { class: 'card' },
      emptyArt('clipboard', t('noHistory'), t('historyStartsAfter'), 'var(--purple)')));
    return;
  }

  const reports = Object.fromEntries((await allReports()).map(r => [r.date, r]));
  const today = todayKey();

  host.append(el('div', { class: 'card summary-bar' },
    el('div', {}, el('b', {}, num(dates.length)), el('span', {}, t('totalDays'))),
    el('div', {}, el('b', {}, num(Object.keys(reports).length)), el('span', {}, t('daysLogged'))),
    el('div', {}, el('b', { style: 'font-size:12px' }, shortDate(dates[dates.length - 1])),
      el('span', {}, t('firstDataDay'))),
  ));

  host.append(el('div', { class: 'legend' },
    ...[['ok', 'onTarget'], ['under', 'underBudget'], ['over', 'overBudget']].map(([k, lb]) =>
      el('span', { class: 'lg' }, el('i', { style: `background:${STATUS_COLOR[k]}` }), t(lb))),
    el('span', { class: 'lg' }, el('i', { style: 'background:var(--line2)' }), t('noDataDay'))));

  for (const date of dates) {
    if (date === today) { host.append(await todayRow(date)); continue; }
    const r = reports[date];
    host.append(r ? loggedRow(r) : emptyRow(date));
  }
}

/** A day that has a stored report. */
function loggedRow(r) {
  const c = STATUS_COLOR[r.dayStatus];
  return el('div', { class: 'card rep-row', style: `--rc:${c}`, onclick: () => openDay(r.date) },
    el('div', { class: 'rep-row-bar' }),
    donut(r.kcal, r.goals.kcal, 54),
    el('div', { style: 'flex:1;min-width:0' },
      el('b', {}, longDate(r.date)),
      el('span', { class: 'muted', style: 'display:block;font-size:11.5px;margin:2px 0 5px' },
        `${num(r.kcal)} / ${num(r.goals.kcal)} ${t('kcal')} · ${num(r.meals)} ${getLang() === 'fa' ? 'قلم' : 'items'}`),
      el('div', { class: 'rep-macros' },
        macroPip('P', round(r.protein), r.goals.protein, 'var(--blue)'),
        macroPip('C', round(r.carbs), r.goals.carbs, 'var(--orange)'),
        macroPip('F', round(r.fat), r.goals.fat, 'var(--pink)')),
      el('span', { style: `display:block;font-size:11px;color:${c};margin-top:5px` },
        t(STATUS_LABEL[r.dayStatus]))),
    el('span', { class: 'rep-arrow' }, '›'),
  );
}

/** A day inside the record with nothing on it. Still listed, deliberately. */
function emptyRow(date) {
  return el('div', { class: 'card rep-row empty-day', style: '--rc:var(--line2)', onclick: () => openDay(date) },
    el('div', { class: 'rep-row-bar' }),
    el('div', { class: 'ed-dash' }, '—'),
    el('div', { style: 'flex:1;min-width:0' },
      el('b', {}, longDate(date)),
      el('span', { class: 'muted', style: 'display:block;font-size:11.5px' }, t('noDataDay'))),
    el('span', { class: 'rep-arrow' }, '›'),
  );
}

/** Today is still running, so it is shown live rather than from an archive. */
async function todayRow(date) {
  const rep = await buildReport(date);
  const has = rep.meals > 0;
  const c = has ? STATUS_COLOR[rep.dayStatus] : 'var(--line2)';
  return el('div', { class: 'card rep-row today-row', style: `--rc:${c}`, onclick: () => openDay(date) },
    el('div', { class: 'rep-row-bar' }),
    has ? donut(rep.kcal, rep.goals.kcal, 54) : el('div', { class: 'ed-dash' }, '—'),
    el('div', { style: 'flex:1;min-width:0' },
      el('b', {}, `${longDate(date)} · ${t('today')}`),
      el('span', { class: 'muted', style: 'display:block;font-size:11.5px;margin:2px 0 5px' },
        has ? `${num(rep.kcal)} / ${num(rep.goals.kcal)} ${t('kcal')} · ${num(rep.meals)} ${getLang() === 'fa' ? 'قلم' : 'items'}`
            : t('noDataDay')),
      has ? el('div', { class: 'rep-macros' },
        macroPip('P', round(rep.protein), rep.goals.protein, 'var(--blue)'),
        macroPip('C', round(rep.carbs), rep.goals.carbs, 'var(--orange)'),
        macroPip('F', round(rep.fat), rep.goals.fat, 'var(--pink)')) : null,
      el('span', { class: 'inprog' }, t('inProgress'))),
    el('span', { class: 'rep-arrow' }, '›'),
  );
}

/**
 * Full picture of one day — the same things the home screen shows, for any date:
 * calories, macros, water, everything eaten, the workouts, and the analysis.
 */
export async function openDay(date) {
  const stored = await getReport(date);
  const rep = stored || await buildReport(date);
  if (!stored) rep.auto = false;
  sheet(`${dateLabel(date)}`, dayBody(rep, date));
}

/** The workouts logged on a date, rendered as a card. */
function workoutBlock(date) {
  const host = el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, t('workoutsOfDay'))));
  const body = el('div', {}, el('div', { class: 'muted', style: 'padding:6px 0' }, t('loading')));
  host.append(body);

  db.byIndex('workouts', 'date', date).then(ws => {
    body.replaceChildren();
    if (!ws.length) {
      body.append(el('div', { class: 'muted', style: 'padding:6px 0;font-size:12.5px' }, t('noWorkout')));
      return;
    }
    ws.forEach(w => {
      const mins = Math.round(((w.end || w.start) - w.start) / 60000);
      body.append(el('div', { class: 'wo-row' },
        el('span', { class: 'wo-ico' }, '🏋️'),
        el('div', { style: 'flex:1;min-width:0' },
          el('b', {}, w.name),
          el('span', {}, `${num(w.sets || 0)} ${t('sets')} · ${num(mins)} ${t('min')}`)),
        el('div', { class: 'wo-end' },
          el('b', {}, `${num(Math.round(kgToDisp(w.volume || 0)))} ${wUnit()}`),
          el('span', {}, `${num(w.kcal || 0)} ${t('kcal')}`))));
    });
  }).catch(() => body.replaceChildren());

  return host;
}

/** One day, in full — used by the history and by the day report alike. */
export function dayBody(rep, date) {
  const box = el('div', {});
  const hasFood = rep.meals > 0;

  if (!hasFood) {
    box.append(el('div', { class: 'card' },
      emptyArt('plate', t('noDataDay'), t('emptyDayHint'), 'var(--tx3)')));
    box.append(workoutBlock(date));
    box.append(el('button', { class: 'btn full', onclick: () => {
      closeSheet();
      window.dispatchEvent(new CustomEvent('open-day', { detail: date }));
    } }, '📖 ' + t('goToDay')));
    return box;
  }

  box.append(reportBody(rep, false));
  box.append(workoutBlock(date));

  box.append(el('button', { class: 'btn ghost full', style: 'margin-bottom:9px', onclick: () => {
    closeSheet();
    window.dispatchEvent(new CustomEvent('open-day', { detail: date }));
  } }, '📖 ' + t('goToDay')));

  if (date !== todayKey()) {
    box.append(el('button', { class: 'btn ghost full', onclick: async () => {
      await reopenDay(date);
      closeSheet(); toast(t('done'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('reopenDay')));
  }
  return box;
}
