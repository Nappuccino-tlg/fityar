/* ============ Progress: weight, measurements, nutrition & strength trends ============ */
import * as db from './db.js';
import { S, kgToDisp, dispToKg, wUnit, cmToDisp, dispToCm, lUnit, usesTargetWeight } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, sum, parseNum, todayKey, addDays, shortDate, longDate, dateKey, daysBetween, keyToDate,
  lineChart, barChart, macroBar,
} from './ui.js';
import { totals } from './nutrition.js';
import { allWorkouts, workoutVolume, records, exName } from './workouts.js';
import { renderReports, dayStatusMap, STATUS_COLOR } from './report.js';
import { emptyArt } from './art.js';

export const renderReportsInline = () => renderReports('#ptab-reports');

const MEASURE_FIELDS = ['neck', 'shoulders', 'chest', 'arm', 'waist', 'hips', 'thigh', 'calf', 'bodyFat'];

/* ---------------- body tab ---------------- */

export async function renderBody() {
  const ws = (await db.all('weights')).sort((a, b) => a.date < b.date ? -1 : 1);
  const host = $('#weight-chart');

  if (ws.length) {
    /* the line starts at the very first weigh-in, never before it */
    const last = ws.slice(-30);
    const showTarget = usesTargetWeight() && S.profile.targetWeight;
    lineChart(host, last.map(w => ({ x: shortDate(w.date), y: round(kgToDisp(w.kg), 1) })), {
      color: '#3ddc84',
      goal: showTarget ? round(kgToDisp(S.profile.targetWeight), 1) : null,
    });
    const first = ws[0].kg, cur = ws.at(-1).kg;
    const diff = cur - first;
    /* when the scale is not the target, weekly rate of change is the useful number */
    const spanDays = Math.max(1, Math.abs(daysBetween(ws[0].date, ws.at(-1).date)));
    const perWeek = ws.length > 1 ? diff / spanDays * 7 : 0;
    const gainGoal = !usesTargetWeight();
    const good = gainGoal ? diff >= 0 : diff <= 0;

    $('#weight-stats').replaceChildren(
      el('div', {}, el('b', {}, num(round(kgToDisp(first), 1), 1)), el('span', {}, `${t('start')} (${wUnit()})`)),
      el('div', {}, el('b', {}, num(round(kgToDisp(cur), 1), 1)), el('span', {}, `${t('current')} (${wUnit()})`)),
      el('div', {}, el('b', { style: `color:${good ? 'var(--acc)' : 'var(--orange)'}` },
        (diff > 0 ? '+' : '') + num(round(kgToDisp(diff), 1), 1)), el('span', {}, t('change'))),
      showTarget
        ? el('div', {}, el('b', {}, num(round(kgToDisp(S.profile.targetWeight), 1), 1)),
            el('span', {}, t('targetWeight')))
        : el('div', {}, el('b', { style: 'color:var(--blue)' },
              (perWeek > 0 ? '+' : '') + num(round(kgToDisp(perWeek), 2), 2)),
            el('span', {}, t('perWeek'))),
    );
  } else {
    host.replaceChildren(emptyArt('scale', t('empty'),
      getLang() === 'fa' ? 'اولین وزنت را ثبت کن' : 'Log your first weigh-in', 'var(--acc)'));
    $('#weight-stats').replaceChildren();
  }

  const ms = (await db.all('measurements')).sort((a, b) => a.date < b.date ? 1 : -1);
  const mHost = $('#measure-list');
  mHost.replaceChildren();
  if (!ms.length) { mHost.append(el('div', { class: 'empty' }, t('empty'))); return; }

  const latest = ms[0];
  const prev = ms[1];
  for (const f of MEASURE_FIELDS) {
    if (latest[f] === undefined || latest[f] === null || latest[f] === '') continue;
    const unit = f === 'bodyFat' ? '%' : lUnit();
    const v = f === 'bodyFat' ? latest[f] : round(cmToDisp(latest[f]), 1);
    let delta = null;
    if (prev && prev[f] !== undefined && prev[f] !== null && prev[f] !== '') {
      const d = latest[f] - prev[f];
      delta = (d > 0 ? '+' : '') + num(round(f === 'bodyFat' ? d : cmToDisp(d), 1), 1);
    }
    mHost.append(el('div', { class: 'kv' },
      el('span', {}, t(f)),
      el('b', {}, `${num(v, 1)} ${unit}`, delta ? el('span', { class: 'muted', style: 'margin-inline-start:8px;font-size:11.5px' }, delta) : null),
    ));
  }
  mHost.append(el('div', { class: 'muted', style: 'margin-top:10px;font-size:11.5px' }, longDate(latest.date)));
}

export function openWeightLog() {
  const dIn = input({ type: 'date', value: todayKey() });
  const wIn = input({ type: 'number', inputmode: 'decimal', step: '0.1',
    value: round(kgToDisp(S.profile.weight), 1) });
  const body = el('div', {},
    field(t('weight') + ` (${wUnit()})`, wIn),
    field(t('today'), dIn),
    el('button', { class: 'btn full', onclick: async () => {
      const v = parseNum(wIn.value);
      if (v <= 0) return toast(t('error'), 'err');
      const kg = dispToKg(v);
      await db.put('weights', { date: dIn.value || todayKey(), kg: round(kg, 2) });
      S.profile.weight = round(kg, 2);
      const { saveProfile, applyAutoGoals } = await import('./store.js');
      await saveProfile();
      if (S.goals.auto) await applyAutoGoals();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('weight'), body);
}

export async function openMeasureLog() {
  const ms = (await db.all('measurements')).sort((a, b) => a.date < b.date ? 1 : -1);
  const last = ms[0] || {};
  const dIn = input({ type: 'date', value: todayKey() });
  const inputs = {};
  const grid = el('div', {});
  for (const f of MEASURE_FIELDS) {
    const unit = f === 'bodyFat' ? '%' : lUnit();
    const v = last[f] === undefined || last[f] === null || last[f] === ''
      ? '' : (f === 'bodyFat' ? last[f] : round(cmToDisp(last[f]), 1));
    inputs[f] = input({ type: 'number', inputmode: 'decimal', step: '0.1', value: v, placeholder: '—' });
    grid.append(field(`${t(f)} (${unit})`, inputs[f]));
  }
  const body = el('div', {},
    field(t('today'), dIn),
    grid,
    el('button', { class: 'btn full', onclick: async () => {
      const rec = { id: db.uid('ms_'), date: dIn.value || todayKey() };
      let any = false;
      for (const f of MEASURE_FIELDS) {
        const raw = inputs[f].value.trim();
        if (!raw) continue;
        const v = parseNum(raw);
        rec[f] = f === 'bodyFat' ? round(v, 1) : round(dispToCm(v), 1);
        any = true;
      }
      if (!any) return toast(t('empty'), 'err');
      await db.put('measurements', rec);
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('measurements'), body);
}

/* ---------------- nutrition tab ---------------- */

export async function renderNutriTrends() {
  const end = todayKey();
  const all = await db.all('foodLogs');
  if (!all.length) {
    $('#kcal-chart').replaceChildren(emptyArt('plate', t('empty'),
      getLang() === 'fa' ? 'اولین وعده‌ات را ثبت کن' : 'Log your first meal', 'var(--orange)'));
    $('#macro-chart').replaceChildren();
    $('#nutri-stats').replaceChildren();
    return;
  }

  /* start the chart on the first day anything was logged, never before it */
  const firstLog = all.reduce((m, l) => (l.date < m ? l.date : m), all[0].date);
  const window14 = addDays(end, -13);
  const start = firstLog > window14 ? firstLog : window14;

  const logs = await db.range('foodLogs', 'date', start, end);
  const byDay = {};
  for (const l of logs) (byDay[l.date] ||= []).push(l);

  const span = Math.max(0, daysBetween(start, end));
  const days = [];
  for (let i = span; i >= 0; i--) days.push(addDays(end, -i));

  const goal = S.goals.kcal || 2000;
  const points = days.map(d => {
    const tt = totals(byDay[d] || []);
    const has = !!byDay[d]?.length;
    const ratio = tt.kcal / goal;
    const color = !has ? 'var(--line2)'
                : ratio > 1.08 ? 'var(--red)'
                : ratio < 0.88 ? 'var(--warn)' : 'var(--acc)';
    return { x: shortDate(d), y: tt.kcal, dim: !has, color };
  });
  barChart($('#kcal-chart'), points, { color: 'var(--acc)', goal });

  const logged = days.filter(d => byDay[d]?.length);
  const agg = logged.map(d => totals(byDay[d]));
  const n = Math.max(1, agg.length);
  const avg = {
    kcal: Math.round(sum(agg, x => x.kcal) / n),
    p: round(sum(agg, x => x.protein) / n, 1),
    c: round(sum(agg, x => x.carbs) / n, 1),
    f: round(sum(agg, x => x.fat) / n, 1),
    fib: round(sum(agg, x => x.fiber) / n, 1),
  };
  macroBar($('#macro-chart'), { p: avg.p, c: avg.c, f: avg.f });
  $('#nutri-stats').replaceChildren(
    el('div', {}, el('b', {}, num(avg.kcal)), el('span', {}, `${t('avg')} ${t('kcal')}`)),
    el('div', {}, el('b', {}, num(logged.length)), el('span', {}, getLang() === 'fa' ? 'روز ثبت‌شده' : 'days logged')),
    el('div', {}, el('b', {}, num(avg.fib, 1)), el('span', {}, `${t('avg')} ${t('fiber')}`)),
  );
}

/* ---------------- strength tab ---------------- */

export async function renderStrength() {
  const hs = await allWorkouts();

  if (!hs.length) {
    $('#volume-chart').replaceChildren(emptyArt('dumbbell', t('empty'),
      getLang() === 'fa' ? 'اولین تمرینت را ثبت کن' : 'Log your first workout', 'var(--purple)'));
    $('#pr-list').replaceChildren(emptyArt('chart', t('empty'), '', 'var(--purple)'));
    return;
  }

  /* weekly volume, starting at the week that holds the very first workout */
  const now = new Date();
  const firstDay = S.settings.firstDay ?? 6;
  const backToStart = (now.getDay() - firstDay + 7) % 7;
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - backToStart);

  /* count back to the week that CONTAINS the first workout, so that workout
     always lands inside a bar rather than falling off the left edge */
  const firstDate = hs.reduce((m, w) => (w.date < m ? w.date : m), hs[0].date);
  const fd = keyToDate(firstDate);
  const firstWeekStart = new Date(fd);
  firstWeekStart.setDate(fd.getDate() - ((fd.getDay() - firstDay + 7) % 7));
  const weeksSinceFirst = Math.round(
    daysBetween(dateKey(firstWeekStart), dateKey(thisWeekStart)) / 7);
  const backWeeks = Math.min(11, Math.max(0, weeksSinceFirst));

  const weeks = [];
  for (let i = backWeeks; i >= 0; i--) {
    const st = new Date(thisWeekStart); st.setDate(thisWeekStart.getDate() - i * 7);
    const en = new Date(st); en.setDate(st.getDate() + 6);
    const a = dateKey(st), b = dateKey(en);
    const vol = sum(hs.filter(w => w.date >= a && w.date <= b), w => w.volume || workoutVolume(w));
    weeks.push({ x: shortDate(a), y: Math.round(kgToDisp(vol)) });
  }
  barChart($('#volume-chart'), weeks, { color: 'var(--purple)' });

  const recs = await records();
  const host = $('#pr-list');
  host.replaceChildren();
  const arr = Object.values(recs).sort((a, b) => b.best1rm - a.best1rm).slice(0, 25);
  if (!arr.length) { host.append(el('div', { class: 'empty' }, t('empty'))); return; }
  arr.forEach(r => host.append(el('div', { class: 'kv' },
    el('span', {}, exName(r.exId)),
    el('b', {}, `${num(round(kgToDisp(r.maxW), 1), 1)}${wUnit()} × ${num(r.reps)}`,
      el('span', { class: 'muted', style: 'margin-inline-start:8px;font-size:11px' },
        `1RM ${num(round(kgToDisp(r.best1rm)))}`)),
  )));
}
