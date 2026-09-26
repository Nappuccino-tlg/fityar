/* ============ FitYar — XP, levels and achievements ============

   Everything here is *derived*, never stored. XP is recomputed from the
   workouts, days and records already on the device rather than kept as a
   counter that gets incremented.

   That is the whole design. A stored counter drifts: a double render adds
   twice, a failed write loses a hundred, and after a backup restore it is
   simply wrong with no way to tell. Derived XP always matches what you
   actually did — delete a workout and it goes down, which is correct, and
   restore a backup and it comes back exactly.

   Warm-up sets are excluded, as everywhere else. A level earned by logging
   warm-ups would not be a level.
*/

import * as db from './db.js';

/* What earns it, and how much. Kept few and legible: the user can be shown
   this table and recognise every line as something they did. */
export const XP_RULES = [
  { id: 'workout', xp: 100, fa: 'هر تمرین کامل', en: 'Each workout' },
  { id: 'set', xp: 2, fa: 'هر ست کاری', en: 'Each working set' },
  { id: 'pr', xp: 200, fa: 'هر رکورد شخصی', en: 'Each personal record' },
  { id: 'nutritionDay', xp: 50, fa: 'هر روز در هدف کالری', en: 'Each day on target' },
  { id: 'streakWeek', xp: 150, fa: 'هر هفته پیوستگی', en: 'Each full week of streak' },
];
const XP = Object.fromEntries(XP_RULES.map((r) => [r.id, r.xp]));

/**
 * Cumulative XP needed to reach a level.
 *
 * Superlinear, so early levels come from turning up and later ones take
 * real work: level 2 after about three workouts, level 10 after a couple of
 * months of training. A curve that never slows down makes the number
 * meaningless by the second month.
 */
export function xpForLevel(level) {
  if (level <= 1) return 0;
  return Math.round(400 * Math.pow(level - 1, 1.55));
}

/** The level a given XP total has reached, and how far into it. */
export function levelFor(xp) {
  let level = 1;
  while (xpForLevel(level + 1) <= xp && level < 99) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  return {
    level,
    into: xp - floor,
    span: ceil - floor,
    toNext: ceil - xp,
    fraction: Math.min(1, (xp - floor) / Math.max(1, ceil - floor)),
  };
}

/**
 * Every personal record ever set, by replaying history oldest first.
 *
 * `records()` in workouts.js gives the current bests; this gives the moments
 * they were set, which is what earns XP. The first time an exercise is done
 * is not a record - there was nothing to beat - or every first session would
 * pay out for every exercise in it.
 */
function countRecords(workouts) {
  const best = {};
  let prs = 0;
  const byDate = [...workouts].sort((a, b) => (a.start || 0) - (b.start || 0));
  for (const w of byDate) {
    for (const ex of w.exercises || []) {
      for (const s of ex.sets || []) {
        if (!s.done || s.type === 'w') continue;
        const weight = Number(s.w) || 0;
        if (!weight || !(Number(s.r) || 0)) continue;
        const seen = best[ex.exId];
        if (seen === undefined) { best[ex.exId] = weight; continue; }
        if (weight > seen) { best[ex.exId] = weight; prs++; }
      }
    }
  }
  return prs;
}

/** Working sets and reps across every workout. */
function tallySets(workouts) {
  let sets = 0, reps = 0;
  for (const w of workouts || []) {
    for (const ex of w.exercises || []) {
      for (const s of ex.sets || []) {
        if (!s.done || s.type === 'w') continue;
        sets++;
        reps += Number(s.r) || 0;
      }
    }
  }
  return { sets, reps };
}

/** The longest run of consecutive days that appear in a set of date keys. */
function longestRun(dates) {
  const days = [...new Set(dates)].sort();
  let best = 0, run = 0, prev = null;
  for (const d of days) {
    const t = Date.parse(d + 'T00:00:00');
    run = prev !== null && t - prev === 86400000 ? run + 1 : 1;
    best = Math.max(best, run);
    prev = t;
  }
  return best;
}

/**
 * Everything the rank card needs, worked out from the database.
 *
 * One pass over the three stores it needs; nothing is cached, because the
 * answer has to match the data and the data is small.
 */
export async function rankState() {
  const [workouts, reports] = await Promise.all([
    db.all('workouts'),
    db.all('dayReports'),
  ]);

  const { sets, reps } = tallySets(workouts);
  const prs = countRecords(workouts);
  const onTarget = reports.filter((r) => r.dayStatus === 'ok');
  const loggedDays = reports.map((r) => r.date);
  const workoutDays = workouts.map((w) => w.date).filter(Boolean);

  const streakDays = longestRun(loggedDays);
  const streakWeeks = Math.floor(streakDays / 7);

  const earned = {
    workout: workouts.length * XP.workout,
    set: sets * XP.set,
    pr: prs * XP.pr,
    nutritionDay: onTarget.length * XP.nutritionDay,
    streakWeek: streakWeeks * XP.streakWeek,
  };
  const xp = Object.values(earned).reduce((a, b) => a + b, 0);

  const facts = {
    workouts: workouts.length, sets, reps, prs,
    onTargetDays: onTarget.length, loggedDays: loggedDays.length,
    bestStreak: streakDays,
    bestWorkoutStreak: longestRun(workoutDays),
  };

  return {
    xp, earned, facts,
    ...levelFor(xp),
    achievements: ACHIEVEMENTS.map((a) => ({ ...a, ...a.check(facts) })),
  };
}

/* A short list. Each one is a thing a person would actually tell someone
   about; a wall of trivial badges devalues the ones that mean something. */
export const ACHIEVEMENTS = [
  { id: 'first', glyph: 'dumbbell', fa: 'اولین تمرین', en: 'First workout',
    check: (f) => ({ done: f.workouts >= 1, at: f.workouts, of: 1 }) },
  { id: 'firstPr', glyph: 'target', fa: 'اولین رکورد', en: 'First record',
    check: (f) => ({ done: f.prs >= 1, at: f.prs, of: 1 }) },
  { id: 'ten', glyph: 'dumbbell', fa: '۱۰ تمرین', en: '10 workouts',
    check: (f) => ({ done: f.workouts >= 10, at: f.workouts, of: 10 }) },
  { id: 'fifty', glyph: 'dumbbell', fa: '۵۰ تمرین', en: '50 workouts',
    check: (f) => ({ done: f.workouts >= 50, at: f.workouts, of: 50 }) },
  { id: 'sets100', glyph: 'flame', fa: '۱۰۰ ست', en: '100 sets',
    check: (f) => ({ done: f.sets >= 100, at: f.sets, of: 100 }) },
  { id: 'reps1000', glyph: 'flame', fa: '۱۰۰۰ تکرار', en: '1000 reps',
    check: (f) => ({ done: f.reps >= 1000, at: f.reps, of: 1000 }) },
  { id: 'streak7', glyph: 'check', fa: '۷ روز پیوسته', en: '7 day streak',
    check: (f) => ({ done: f.bestStreak >= 7, at: f.bestStreak, of: 7 }) },
  { id: 'streak30', glyph: 'check', fa: '۳۰ روز پیوسته', en: '30 day streak',
    check: (f) => ({ done: f.bestStreak >= 30, at: f.bestStreak, of: 30 }) },
  { id: 'onTarget30', glyph: 'meat', fa: '۳۰ روز در هدف', en: '30 days on target',
    check: (f) => ({ done: f.onTargetDays >= 30, at: f.onTargetDays, of: 30 }) },
  { id: 'prs10', glyph: 'target', fa: '۱۰ رکورد', en: '10 records',
    check: (f) => ({ done: f.prs >= 10, at: f.prs, of: 10 }) },
];
