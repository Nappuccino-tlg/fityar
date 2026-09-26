/* ============ The coaching layer ============
   Weekly schedule + today's session, progressive-overload suggestions,
   logging streak, and the week review. All computed locally.
============================================================== */
import * as db from './db.js';
import { icon, GLYPHS, lineIcon } from './icons.js';
import { S, kgToDisp, dispToKg, wUnit, e1rm } from './store.js';
import { t, num, pick, getLang, countLabel } from './i18n.js';
import {
  $, el, sheet, closeSheet, toast, field, input, select,
  round, sum, clamp, todayKey, addDays, dateKey, keyToDate, shortDate, daysBetween, buzz,
} from './ui.js';
import { getRoutines, allWorkouts, lastSetsFor, exById, exName, startWorkout } from './workouts.js';
import { logsFor, totals } from './nutrition.js';
import { emptyArt, bodyMap } from './art.js';
import { muscleStats, heatFrom, HEAT_MODES } from './muscles.js';
import { body3d } from './body3d.js';

/* The week review keeps whatever body the user last looked at — the same
   preference the exercise tab stores, but one module cannot read another's
   private let, so each keeps its own and they simply agree by taste. */
let weekBodyView = '3d';
import { openMuscleSheet } from './workouts.js';

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
      } }, lineIcon('dice', { size: 16 }), t('autoAssign')));
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

  /* `mark` is a glyph name; anything not in the set falls through as text,
     which is how the few remaining emoji still render. */
  const card = (kind, mark, title, sub, action) =>
    el('div', { class: 'card today-card ' + kind },
      el('span', { class: 'tdc-ico' }, GLYPHS.has(mark) ? icon(mark, { size: 22, cls: 'ic-lift' }) : mark),
      el('div', { class: 'tdc-txt' }, el('b', {}, title), el('span', {}, sub)),
      action);

  /* 1 — nothing has been built yet: say that, do not call it a rest day */
  if (!routines.length) {
    return card('new', 'target',
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
    return card('done', 'check',
      fa ? 'تمرین امروز انجام شد' : "Today's workout is done", progressLine, null);
  }

  /* 4 — today has a session waiting */
  if (routine) {
    return card('go', 'flame',
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
/** Current and best run of consecutive days present in a set of date keys. */
function dayRun(days) {
  if (!days.size) return { current: 0, best: 0 };

  /* Today not being logged yet does not break a streak - the day is not over. */
  const tk = todayKey();
  let current = 0;
  let cursor = days.has(tk) ? tk : addDays(tk, -1);
  while (days.has(cursor)) { current++; cursor = addDays(cursor, -1); }

  const sorted = [...days].sort();
  let best = 0, run = 0, prev = null;
  for (const d of sorted) {
    run = (prev && daysBetween(prev, d) === 1) ? run + 1 : 1;
    if (run > best) best = run;
    prev = d;
  }
  return { current, best };
}

/**
 * The same, counted in weeks: a week counts if anything happened in it.
 *
 * This is the right unit for training. A daily streak punishes the thing it
 * should reward — rest days are part of a programme, and a number that falls
 * to zero every time someone takes the rest day they were told to take is
 * worse than no number at all.
 */
function weekRun(days) {
  if (!days.size) return { current: 0, best: 0 };
  const firstDay = S.settings.firstDay ?? 6;
  const weekOf = (key) => {
    const d = keyToDate(key);
    d.setDate(d.getDate() - ((d.getDay() - firstDay + 7) % 7));
    return dateKey(d);
  };

  const weeks = new Set([...days].map(weekOf));
  const thisWeek = weekOf(todayKey());

  /* The current week is not over either, so an empty one does not end it. */
  let current = 0;
  let cursor = weeks.has(thisWeek) ? thisWeek : addDays(thisWeek, -7);
  while (weeks.has(cursor)) { current++; cursor = addDays(cursor, -7); }

  const sorted = [...weeks].sort();
  let best = 0, run = 0, prev = null;
  for (const w of sorted) {
    run = (prev && daysBetween(prev, w) === 7) ? run + 1 : 1;
    if (run > best) best = run;
    prev = w;
  }
  return { current, best };
}

/**
 * Two streaks, because they are two different habits.
 *
 * One number for both said a month of training with nothing logged was a
 * streak of zero, and a month of logging with no training was a full month.
 * Neither reading was true of the person it was shown to.
 */
export async function streaks() {
  const [logs, workouts] = await Promise.all([db.all('foodLogs'), db.all('workouts')]);
  return {
    nutrition: dayRun(new Set(logs.map(l => l.date).filter(Boolean))),
    training: weekRun(new Set(workouts.map(w => w.date).filter(Boolean))),
  };
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
    /* the sessions themselves, so the card can show which muscles they went to */
    sessions: ws,
    volume: Math.round(sum(ws, w => w.volume || 0)),
    minutes: Math.round(sum(ws, w => ((w.end || w.start) - w.start) / 60000)),
    adherence: daysLogged ? Math.round(inRange / daysLogged * 100) : 0,
  };
}

/** One streak: what it counts, how long it is now, and the best it has been. */
function streakRow(glyph, run, label, unit, tone) {
  return el('div', { class: 'streak-row' },
    el('span', { class: 'streak-ico', style: `--sc:${tone}` },
      run.current >= 3 ? icon(glyph, { size: 19, cls: 'ic-lift' }) : icon(glyph, { size: 19 })),
    el('div', { style: 'flex:1' },
      el('b', {}, `${num(run.current)} ${unit}`),
      el('span', { class: 'muted', style: 'display:block;font-size:var(--t-xs)' },
        `${label} · ${t('streakBest')}: ${num(run.best)}`)));
}

export async function weekReviewCard() {
  const cur = await weekSummary(0);
  const prev = await weekSummary(1);
  const fa = getLang() === 'fa';
  const st = await streaks();

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
      el('span', { class: 'muted', style: 'font-size:var(--t-xs)' }, `${shortDate(cur.a)} — ${shortDate(cur.b)}`)),

    /* Two rows, two habits. The flame only lights once there is something
       to be pleased about; a flame beside a zero is just noise. */
    el('div', { class: 'streak-pair' },
      streakRow('flame', st.nutrition, t('streakLogging'), t('streak'), 'var(--orange)'),
      streakRow('dumbbell', st.training, t('streakTraining'), t('weeksInARow'), 'var(--blue)')),

    /* What you trained, and what you did not. Six tiles say what you did;
       none of them says what has been neglected, which is the question a
       week of training actually raises. */
    cur.sessions.length ? weekBody(cur.sessions, fa) : null,

    el('div', { class: 'wk-grid' },
      wkCell('🍽️', num(cur.daysLogged) + '/۷'.replace('۷', fa ? '۷' : '7'), t('daysLogged'), 'var(--orange)', null),
      wkCell('flame', num(cur.avgKcal), t('avgKcal'), 'var(--acc)', delta(cur.avgKcal, prev.avgKcal)),
      wkCell('dumbbell', num(cur.workouts), t('workouts'), 'var(--blue)', delta(cur.workouts, prev.workouts)),
      wkCell('📊', num(cur.adherence) + (fa ? '٪' : '%'), t('adherence'), 'var(--purple)', delta(cur.adherence, prev.adherence, fa ? '٪' : '%')),
      wkCell('meat', num(cur.avgProtein) + 'g', t('protein'), 'var(--pink)', delta(cur.avgProtein, prev.avgProtein, 'g')),
      wkCell('⏱️', num(cur.minutes), t('min'), 'var(--teal)', delta(cur.minutes, prev.minutes)),
    ),
  );
}

/**
 * The week's training as a body, shaded by how many sets each muscle got.
 *
 * Six tiles of numbers say what you did; none of them says what has been
 * neglected, which is the question a week of training actually raises.
 */
function weekBody(sessions, fa) {
  const index = {};
  for (const w of sessions) {
    for (const x of w.exercises || []) {
      const e = exById(x.exId);
      if (e) index[x.exId] = e;
    }
  }
  const stats = muscleStats(sessions, index);
  const wrap = el('div', { class: 'wk-body' });
  const figure = el('div');

  /* The body can be flat (both views at once) or the turning figure. The
     figure is remembered for the session, the same preference the exercise
     tab keeps — one taste, applied everywhere the body appears. */
  let view = weekBodyView || '3d';

  /* Volume and frequency answer different questions: how much went into a
     muscle, and how often you went back to it. One huge chest session and
     three moderate ones are identical under volume and quite different
     under frequency. */
  let mode = 'volume';
  let fig = null;
  const draw = () => {
    if (fig?.dispose) fig.dispose();
    if (view === '3d') {
      fig = body3d({ heat: heatFrom(stats, mode), onPick: (m) => openMuscleSheet(m), scale: 0.86 });
      fig.node.append(el('div', { class: 'b3d-hint' }, t('turnHint')));
      figure.replaceChildren(fig.node);
    } else {
      fig = null;
      figure.replaceChildren(bodyMap({
        heat: heatFrom(stats, mode),
        onPick: (m) => openMuscleSheet(m),
      }));
    }
  };

  const viewSeg = el('div', { class: 'body-view seg tight' },
    ...[['3d', t('view3d')], ['flat', t('viewFlat')]].map(([id, label]) =>
      el('button', {
        class: 'seg-btn' + (view === id ? ' active' : ''),
        onclick: () => {
          if (view === id) return;
          view = weekBodyView = id;
          [...viewSeg.children].forEach((c) => c.classList.toggle('active', c.dataset.v === id));
          draw();
        },
        dataset: { v: id },
      }, label)));

  const modes = el('div', { class: 'wk-modes' },
    ...HEAT_MODES.map((x) => {
      const b = el('button', {
        class: 'chip' + (x.id === mode ? ' on' : ''),
        onclick: () => {
          mode = x.id;
          [...modes.children].forEach((c) => c.classList.toggle('on', c === b));
          fig ? fig.setHeat(heatFrom(stats, mode)) : draw();
        },
      }, fa ? x.fa : x.en);
      return b;
    }));

  draw();
  wrap.append(viewSeg, modes, figure, el('span', { class: 'wk-body-cap' },
    fa ? 'برای جزئیات، روی عضله بزن' : 'Tap a muscle for detail'));
  return wrap;
}

function wkCell(mark, value, label, color, deltaNode) {
  return el('div', { class: 'wk-cell', style: `--wc:${color}` },
    el('span', { class: 'wk-ico' }, GLYPHS.has(mark) ? icon(mark, { size: 18, cls: 'ic-lift' }) : mark),
    el('b', {}, value),
    el('span', { class: 'wk-lab' }, label),
    deltaNode);
}
