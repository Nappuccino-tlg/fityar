/* ============ FitYar — what each muscle has been doing ============
   Everything the body map, the detail sheet and the recovery note need,
   worked out from the workouts already on the device. No network, no model,
   no guessing: counting.

   Warm-up sets (type 'w') are excluded throughout, the same way the rest of
   the app excludes them from volume. Counting them would say you trained
   harder than you did, which is the one thing a training log must not do.
*/

import { MUSCLES } from './data-exercises.js';

/** Every muscle the app tracks, minus the two that are labels rather than muscles. */
export const REAL_MUSCLES = MUSCLES
  .map((m) => m.id)
  .filter((id) => id !== 'all' && id !== 'fullbody' && id !== 'cardio');

const DAY = 86400000;
const dayKey = (d) => new Date(d).toISOString().slice(0, 10);
const daysBetweenKeys = (a, b) =>
  Math.round((Date.parse(b + 'T00:00:00') - Date.parse(a + 'T00:00:00')) / DAY);

/**
 * A row of facts per muscle, from the workouts given.
 *
 * `sets` counts working sets; `volume` is weight times reps over them. Both
 * are windowed twice — the last seven days and the seven before that — so a
 * trend can be stated without a second pass over the data.
 */
export function muscleStats(workouts, exerciseIndex, { today = dayKey(Date.now()) } = {}) {
  const out = {};
  for (const id of REAL_MUSCLES) {
    out[id] = {
      lastDate: null, daysSince: null,
      sets7: 0, sets14: 0, sets30: 0,
      volume7: 0, volumePrev7: 0,
      days7: new Set(), days30: new Set(),
      byExercise: new Map(),
    };
  }

  for (const w of workouts || []) {
    if (!w?.date) continue;
    const age = daysBetweenKeys(w.date, today);
    if (age < 0 || age > 30) continue;

    for (const ex of w.exercises || []) {
      const info = exerciseIndex?.[ex.exId];
      const m = info?.muscle;
      if (!m || !out[m]) continue;

      const work = (ex.sets || []).filter((s) => s.done && s.type !== 'w');
      if (!work.length) continue;
      const vol = work.reduce((n, s) => n + (Number(s.w) || 0) * (Number(s.r) || 0), 0);
      const top = work.reduce((n, s) => Math.max(n, Number(s.w) || 0), 0);
      const r = out[m];

      if (!r.lastDate || w.date > r.lastDate) r.lastDate = w.date;
      r.sets30 += work.length;
      r.days30.add(w.date);
      if (age <= 14) r.sets14 += work.length;
      if (age <= 7) {
        r.sets7 += work.length;
        r.volume7 += vol;
        r.days7.add(w.date);
      } else if (age <= 14) {
        r.volumePrev7 += vol;
      }

      const e = r.byExercise.get(ex.exId)
        || { id: ex.exId, name: info.nameFa || info.name, sets: 0, topWeight: 0, lastDate: null };
      e.sets += work.length;
      e.topWeight = Math.max(e.topWeight, top);
      if (!e.lastDate || w.date > e.lastDate) e.lastDate = w.date;
      r.byExercise.set(ex.exId, e);
    }
  }

  for (const r of Object.values(out)) {
    r.daysSince = r.lastDate === null ? null : daysBetweenKeys(r.lastDate, today);
    r.sessions7 = r.days7.size;
    r.sessions30 = r.days30.size;
    r.byExercise = [...r.byExercise.values()].sort((a, b) => b.sets - a.sets);
    delete r.days7;
    delete r.days30;
    /* the trend, only where there is a previous week to compare against */
    r.volumeTrend = r.volumePrev7 > 0
      ? Math.round((r.volume7 - r.volumePrev7) / r.volumePrev7 * 100)
      : null;
  }
  return out;
}

/** The two things the map can be shaded by. */
export const HEAT_MODES = [
  { id: 'volume', fa: 'مقدار تمرین', en: 'How much' },
  { id: 'frequency', fa: 'دفعات تمرین', en: 'How often' },
];

/**
 * 0..1 per muscle for the body map.
 *
 * "How much" counts working sets over the week. Sets rather than kilos:
 * weight would zero out every exercise that has none - pull-ups, dips, abs -
 * and leave the back blank after a week of nothing but pull-ups.
 *
 * "How often" counts the days a muscle was touched at all, capped at four,
 * because the difference between training something four times and six times
 * in a week is not what the reader is asking when they choose that mode.
 *
 * Scaled to the hardest-worked muscle, so the map always has a brightest
 * point and a quiet week still reads.
 */
export function heatFrom(stats, mode = 'volume') {
  const raw = {};
  for (const [id, r] of Object.entries(stats)) {
    raw[id] = mode === 'frequency' ? Math.min(r.sessions7, 4) : r.sets7;
  }
  const top = Math.max(0, ...Object.values(raw));
  if (!top) return {};
  const heat = {};
  for (const [id, v] of Object.entries(raw)) if (v > 0) heat[id] = v / top;
  return heat;
}

/**
 * How recently a muscle was trained — and nothing more than that.
 *
 * This is a reading of the training log, not of the body. Whether a muscle
 * has recovered depends on sleep, food, age, how hard the sets actually
 * were and a dozen things this app cannot see, so it does not say "recovered"
 * and does not advise. It says when you last trained it, which is true.
 */
export function recencyOf(daysSince) {
  if (daysSince === null || daysSince === undefined) return 'untrained';
  if (daysSince <= 1) return 'justTrained';
  if (daysSince <= 3) return 'trainedRecently';
  if (daysSince <= 7) return 'aWhileAgo';
  return 'longAgo';
}

/** The colour a recency reads in, matching the app's own meanings. */
export const RECENCY_TONE = {
  justTrained: 'var(--orange)',
  trainedRecently: 'var(--warn)',
  aWhileAgo: 'var(--tx2)',
  longAgo: 'var(--blue)',
  untrained: 'var(--tx3)',
};
