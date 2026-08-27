/* ============ The coaching layer ============
   Weekly schedule + today's session, progressive-overload suggestions,
   logging streak, and the week review. All computed locally.
============================================================== */
import * as db from './db.js';
import { S, kgToDisp, dispToKg, wUnit, e1rm } from './store.js';
import { t, num, pick, getLang, countLabel } from './i18n.js';
import {
  $, el, sheet, closeSheet, toast, field, input, select,
  round, sum, clamp, todayKey, addDays, dateKey, keyToDate, shortDate, daysBetween, buzz,
} from './ui.js';
import { getRoutines, allWorkouts, lastSetsFor, exById, exName, startWorkout } from './workouts.js';
import { logsFor, totals } from './nutrition.js';
import { emptyArt } from './art.js';

/* ============================================================
   WEEKLY SCHEDULE
   ============================================================ */

const DAY_LABEL = {
  fa: ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'],
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
};
const dayName = (i) => DAY_LABEL[getLang() === 'fa' ? 'fa' : 'en'][i];

/** schedule[weekdayIndex] = routineId | null */
export const getSchedule = () => db.metaGet('schedule', {});
export const setSchedule = (sc) => db.metaSet('schedule', sc);

/* Day offsets that give a sensible training/rest rhythm for each weekly
   frequency — these beat naive even spacing, e.g. 4 days works out as
   train-train-rest-train-train-rest-rest, the usual upper/lower pattern. */
const SPREAD = {
  1: [0],
  2: [0, 3],
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
  7: [0, 1, 2, 3, 4, 5, 6],
};

/** Lay the given routines across the week, starting at the user's first day. */
export function autoArrange(routineIds, firstDay = 6) {
  const n = routineIds.length;
  const sc = {};
  if (!n) return sc;
  const offsets = SPREAD[Math.min(7, n)] || SPREAD[4];
  const order = Array.from({ length: 7 }, (_, k) => (firstDay + k) % 7);
  routineIds.slice(0, 7).forEach((id, i) => {
    sc[order[offsets[i]]] = id;
  });
  return sc;
}

/** The routine assigned to a given date, if any. */
export async function routineForDate(date = todayKey()) {
  const sc = await getSchedule();
  const wd = keyToDate(date).getDay();
  const id = sc[wd];
  if (!id) return null;
  const rs = await getRoutines();
  return rs.find(r => r.id === id) || null;
}

/** Has a workout already been logged on this date? */
export async function workedOut(date = todayKey()) {
  const ws = await db.byIndex('workouts', 'date', date);
  return ws.length > 0;
}

export function openScheduleEditor() {
  let sc = {};
  const host = el('div', {});
  const body = el('div', {}, host);

  (async () => {
    sc = { ...(await getSchedule()) };
    const routines = await getRoutines();
    const opts = [{ value: '', label: '— ' + t('restDay') + ' —' },
                  ...routines.map(r => ({ value: r.id, label: r.name }))];

    const draw = () => {
      host.replaceChildren();
      if (!routines.length) {
        host.append(emptyArt('clipboard', t('empty'),
          getLang() === 'fa' ? 'اول یک برنامه بساز' : 'Create a routine first', 'var(--blue)'));
        return;
      }
      const firstDay = S.settings.firstDay ?? 6;
      const order = Array.from({ length: 7 }, (_, k) => (firstDay + k) % 7);
      order.forEach(wd => {
        const selEl = select(opts, sc[wd] || '');
        selEl.onchange = () => { sc[wd] = selEl.value || null; };
        host.append(el('div', { class: 'sched-row' + (sc[wd] ? ' on' : '') },
          el('b', {}, dayName(wd)),
          el('div', { style: 'flex:1' }, selEl)));
      });
      host.append(el('button', { class: 'btn ghost full', style: 'margin-top:12px', onclick: () => {
        sc = autoArrange(routines.map(r => r.id), S.settings.firstDay ?? 6);
        draw();
      } }, '🎲 ' + t('autoAssign')));
      host.append(el('button', { class: 'btn full', style: 'margin-top:9px', onclick: async () => {
        await setSchedule(sc);
        closeSheet(); toast(t('saved'), 'ok');
        window.dispatchEvent(new CustomEvent('data-changed'));
      } }, t('save')));
    };
    draw();
  })();

  sheet(t('weekSchedule'), body);
}

/** How many sessions the schedule asks for, and how many are already done. */
export async function weekProgress() {
  const sc = await getSchedule();
  const planned = Object.values(sc).filter(Boolean).length;
  const { a, b } = weekBounds(0);
  const ws = (await allWorkouts()).filter(w => w.date >= a && w.date <= b);
  return { planned, done: ws.length, left: Math.max(0, planned - ws.length) };
}

/**
 * The "today" card. A rest day is only a rest day when there IS a plan that
 * says so — otherwise the honest message is "you have no plan yet".
 */
export async function todayCard() {
  const fa = getLang() === 'fa';
  const routines = await getRoutines();
  const sc = await getSchedule();
  const assigned = Object.values(sc).filter(Boolean).length;
  const routine = await routineForDate();
  const done = await workedOut();

  const card = (kind, icon, title, sub, action) =>
    el('div', { class: 'card today-card ' + kind },
      el('span', { class: 'tdc-ico' }, icon),
      el('div', { class: 'tdc-txt' }, el('b', {}, title), el('span', {}, sub)),
      action);

  /* 1 — nothing has been built yet: say that, do not call it a rest day */
  if (!routines.length) {
    return card('new', '🎯',
      fa ? 'هنوز برنامه‌ای نداری' : 'No program yet',
      fa ? 'چند سؤال، بعد برنامه‌ات آماده است' : 'A few questions and it is ready',
      el('button', { class: 'btn sm', onclick: () => window.dispatchEvent(new CustomEvent('open-wizard')) },
        t('startWizard')));
  }

  /* 2 — routines exist but no week has been laid out */
  if (!assigned) {
    return card('new', '📅',
      fa ? 'روزهای هفته را تنظیم کن' : 'Lay out your week',
      fa ? 'تا بدانی هر روز چه تمرینی داری' : 'so each day knows its session',
      el('button', { class: 'btn sm', onclick: openScheduleEditor }, t('assignDays')));
  }

  const wp = await weekProgress();
  const progressLine = fa
    ? `${num(wp.done)} از ${num(wp.planned)} تمرین این هفته`
    : `${num(wp.done)} of ${num(wp.planned)} this week`;

  /* 3 — already trained today */
  if (done) {
    return card('done', '✅',
      fa ? 'تمرین امروز انجام شد' : "Today's workout is done", progressLine, null);
  }

  /* 4 — today has a session waiting */
  if (routine) {
    return card('go', '🔥',
      `${t('todayWorkout')}: ${routine.name}`,
      `${countLabel(routine.ex.length, 'exercise')} · ${progressLine}`,
      el('button', { class: 'btn sm', onclick: () => startWorkout({ ...routine, routineId: routine.id }) },
        t('startNow')));
  }

  /* 5 — a real rest day, because the plan says so.
         If the week is behind, offer to make it up instead of just resting. */
  const daysLeftInWeek = daysLeftThisWeek();
  const behind = wp.left > daysLeftInWeek;

  if (behind) {
    const missed = await nextUnfinishedRoutine(sc, routines);
    return card('behind', '⚠️',
      fa ? 'از برنامه عقبی' : 'Behind schedule',
      fa ? `${progressLine} — ${countLabel(wp.left, 'workout')} مانده و ${countLabel(daysLeftInWeek, 'day')} وقت داری`
         : `${progressLine} — ${countLabel(wp.left, 'workout')} left, ${countLabel(daysLeftInWeek, 'day')} to go`,
      missed ? el('button', { class: 'btn sm', onclick: () => startWorkout({ ...missed, routineId: missed.id }) },
        t('startNow')) : null);
  }

  return card('rest', '🌙', t('restDay'),
    `${t('restDayHint')} · ${progressLine}`,
    el('button', { class: 'btn ghost sm', onclick: openScheduleEditor }, t('weekSchedule')));
}

/** Days remaining in the current week, today included. */
function daysLeftThisWeek() {
  const firstDay = S.settings.firstDay ?? 6;
  const passed = (new Date().getDay() - firstDay + 7) % 7;
  return 7 - passed;
}

/** A scheduled routine that has not been trained yet this week. */
async function nextUnfinishedRoutine(sc, routines) {
  const { a, b } = weekBounds(0);
  const ws = (await allWorkouts()).filter(w => w.date >= a && w.date <= b);
  const doneIds = new Set(ws.map(w => w.routineId).filter(Boolean));
  const scheduled = Object.values(sc).filter(Boolean);
  const pending = scheduled.find(id => !doneIds.has(id));
  return routines.find(r => r.id === (pending || scheduled[0])) || null;
}

/* ============================================================
   PROGRESSIVE OVERLOAD
   ============================================================ */

/** Parse "8-12" / "8" / "AMRAP" into a top-of-range number. */
function topReps(range) {
  if (!range) return null;
  const m = String(range).match(/(\d+)\s*[-–]\s*(\d+)/);
  if (m) return Number(m[2]);
  const one = String(range).match(/(\d+)/);
  return one ? Number(one[1]) : null;
}

/** Smallest sensible jump for this exercise, in kg. */
function stepFor(exId) {
  const e = exById(exId);
  if (!e) return 2.5;
  if (['quads', 'hamstrings', 'glutes', 'back'].includes(e.muscle)) return 5;
  if (['biceps', 'triceps', 'shoulders', 'forearms', 'calves'].includes(e.muscle)) return 2.5;
  return 2.5;
}

/**
 * Look at last session for this exercise and say what to do today.
 * @returns {{kind:'up'|'hold'|'none', weight?:number, text:string} }
 */
export async function overloadFor(exId, targetReps) {
  const prev = await lastSetsFor(exId);
  const meta = exById(exId);
  if (!prev.length || (meta && meta.type !== 'wr')) return { kind: 'none', text: '' };

  const top = topReps(targetReps);
  const weights = prev.map(s => Number(s.w) || 0).filter(Boolean);
  if (!weights.length) return { kind: 'none', text: '' };
  const lastW = Math.max(...weights);
  const fa = getLang() === 'fa';

  if (top) {
    const allHit = prev.every(s => (Number(s.r) || 0) >= top);
    if (allHit) {
      const next = round(lastW + stepFor(exId), 1);
      return {
        kind: 'up', weight: next,
        text: fa ? `${t('addWeight')}: ${num(round(kgToDisp(next), 1), 1)} ${wUnit()}`
                 : `${t('addWeight')}: ${num(round(kgToDisp(next), 1), 1)} ${wUnit()}`,
      };
    }
    return {
      kind: 'hold', weight: lastW,
      text: fa ? `${t('keepWeight')} — ${num(round(kgToDisp(lastW), 1), 1)} ${wUnit()}`
               : `${t('keepWeight')} — ${num(round(kgToDisp(lastW), 1), 1)} ${wUnit()}`,
    };
  }
  return { kind: 'hold', weight: lastW,
           text: `${t('lastTime')}: ${num(round(kgToDisp(lastW), 1), 1)} ${wUnit()}` };
}

/* ============================================================
   STREAK
   ============================================================ */

/** Consecutive days (ending today or yesterday) with any food logged. */
export async function streak() {
  const logs = await db.all('foodLogs');
  if (!logs.length) return { current: 0, best: 0 };
  const days = new Set(logs.map(l => l.date));

  const tk = todayKey();
  let cur = 0;
  let cursor = days.has(tk) ? tk : addDays(tk, -1);
  while (days.has(cursor)) { cur++; cursor = addDays(cursor, -1); }

  const sorted = [...days].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) {
    run = (prev && daysBetween(prev, d) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current: cur, best };
}

/* ============================================================
   WEEK REVIEW
   ============================================================ */

function weekBounds(offset = 0) {
  const firstDay = S.settings.firstDay ?? 6;
  const now = new Date();
  const back = (now.getDay() - firstDay + 7) % 7;
  const start = new Date(now);
  start.setDate(now.getDate() - back - offset * 7);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return { a: dateKey(start), b: dateKey(end) };
}

export async function weekSummary(offset = 0) {
  const { a, b } = weekBounds(offset);
  const logs = await db.range('foodLogs', 'date', a, b);
  const byDay = {};
  for (const l of logs) (byDay[l.date] ||= []).push(l);
  const daysLogged = Object.keys(byDay).length;
  const agg = Object.values(byDay).map(totals);
  const n = Math.max(1, agg.length);

  const ws = (await allWorkouts()).filter(w => w.date >= a && w.date <= b);
  const goal = S.goals.kcal || 2000;
  const inRange = agg.filter(x => x.kcal >= goal * 0.88 && x.kcal <= goal * 1.08).length;

  return {
    a, b, daysLogged,
    avgKcal: Math.round(sum(agg, x => x.kcal) / n),
    avgProtein: round(sum(agg, x => x.protein) / n, 1),
    workouts: ws.length,
    volume: Math.round(sum(ws, w => w.volume || 0)),
    minutes: Math.round(sum(ws, w => ((w.end || w.start) - w.start) / 60000)),
    adherence: daysLogged ? Math.round(inRange / daysLogged * 100) : 0,
  };
}

export async function weekReviewCard() {
  const cur = await weekSummary(0);
  const prev = await weekSummary(1);
  const fa = getLang() === 'fa';
  const st = await streak();

  const delta = (a, b, unit = '') => {
    if (!b) return null;
    const d = a - b;
    if (!d) return null;
    const up = d > 0;
    return el('span', { class: 'wk-delta', style: `color:${up ? 'var(--acc)' : 'var(--orange)'}` },
      `${up ? '▲' : '▼'} ${num(Math.abs(Math.round(d)))}${unit}`);
  };

  return el('div', { class: 'card week-card' },
    el('div', { class: 'card-head' },
      el('h3', {}, t('weekReview')),
      el('span', { class: 'muted', style: 'font-size:11px' }, `${shortDate(cur.a)} — ${shortDate(cur.b)}`)),

    el('div', { class: 'streak-row' },
      el('span', { class: 'streak-ico' }, st.current >= 3 ? '🔥' : '📅'),
      el('div', { style: 'flex:1' },
        el('b', {}, `${num(st.current)} ${t('streak')}`),
        el('span', { class: 'muted', style: 'display:block;font-size:11px' },
          `${t('streakBest')}: ${num(st.best)}`))),

    el('div', { class: 'wk-grid' },
      wkCell('🍽️', num(cur.daysLogged) + '/۷'.replace('۷', fa ? '۷' : '7'), t('daysLogged'), 'var(--orange)', null),
      wkCell('🔥', num(cur.avgKcal), t('avgKcal'), 'var(--acc)', delta(cur.avgKcal, prev.avgKcal)),
      wkCell('🏋️', num(cur.workouts), t('workouts'), 'var(--blue)', delta(cur.workouts, prev.workouts)),
      wkCell('📊', num(cur.adherence) + (fa ? '٪' : '%'), t('adherence'), 'var(--purple)', delta(cur.adherence, prev.adherence, fa ? '٪' : '%')),
      wkCell('🥩', num(cur.avgProtein) + 'g', t('protein'), 'var(--pink)', delta(cur.avgProtein, prev.avgProtein, 'g')),
      wkCell('⏱️', num(cur.minutes), t('min'), 'var(--teal)', delta(cur.minutes, prev.minutes)),
    ),
  );
}

function wkCell(icon, value, label, color, deltaNode) {
  return el('div', { class: 'wk-cell', style: `--wc:${color}` },
    el('span', { class: 'wk-ico' }, icon),
    el('b', {}, value),
    el('span', { class: 'wk-lab' }, label),
    deltaNode);
}
