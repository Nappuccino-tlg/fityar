/* ============================================================
   SMART COACH 🧠 — local pattern-finder, no AI, no network
   Reads what the person actually logged and surfaces the few
   things worth acting on: protein gap with foods that fill it,
   forgotten volume, water debt, a streak about to break, and
   — in the session — a weight to load from real history.
   ============================================================ */

import * as db from './db.js';
import { S } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import { el, round, sum } from './ui.js';
import { daySummary, allFoods } from './nutrition.js';
import { lastSetsFor, records, catalog, exName } from './workouts.js';

/* ------------------------------------------------------------
   Protein gap → foods that fill it
   ------------------------------------------------------------ */

/** High-protein foods worth suggesting, best density first. */
async function proteinFoods() {
  const pool = await allFoods();
  return pool
    .filter(f => !f.liquid && f.p >= 12)
    .map(f => ({ f, density: f.p / Math.max(1, f.kcal) }))
    .sort((a, b) => b.density - a.density)
    .slice(0, 24);
}

/**
 * How far behind today's protein is, in grams, or 0 when it is not behind
 * enough to be worth a word.
 *
 * Split out from the card so home can ask the question without building
 * the answer: home shows the number and a way in, and the foods are the
 * nutrition tab's business.
 */
export async function proteinGap() {
  const s = await daySummary(S.date);
  const goal = S.goals?.protein || 0;
  const gap = goal - (s?.protein || 0);
  return (goal < 30 || gap < goal * 0.25) ? 0 : gap;
}

/**
 * Which four of a ranked pool to show today, and which of them is new.
 *
 * A window of `count` sliding along the pool by one place a day. Sliding by
 * one rather than reshuffling is the whole point: three of the four carried
 * over from yesterday, so the card still reads as a considered list, and
 * exactly one is new, so it is worth looking at again.
 *
 * Pure, and keyed on the date rather than on a stored cursor — two devices
 * on the same day show the same four, and nothing has to be written down.
 */
export function pickDaily(pool, dateKey, count = 4) {
  if (!pool.length) return { picked: [], fresh: null };
  const day = Math.floor(Date.parse(`${dateKey}T00:00:00Z`) / 86400000);
  if (!Number.isFinite(day)) return { picked: pool.slice(0, count), fresh: null };
  const n = pool.length;
  const start = ((day % n) + n) % n;
  const picked = [];
  for (let i = 0; i < Math.min(count, n); i++) picked.push(pool[(start + i) % n]);
  /* The one that entered the window today is the one at its far end — the
     window moved forward, so the last place is the place that changed. */
  return { picked, fresh: picked.length === count ? picked[count - 1] : null };
}

/**
 * The nutrition coach card: only appears when protein is meaningfully
 * behind by mid-day, and offers real foods from the person's database.
 */
export async function proteinCoachCard() {
  const gap = await proteinGap();
  if (!gap) return null;   // nothing worth saying

  const fa = getLang() === 'fa';
  /* Sixteen candidates rather than four, so the window has somewhere to
     travel. Beyond that the density drops far enough that a suggestion
     stops being a good one. */
  const pool = (await proteinFoods()).slice(0, 16);
  const { picked: foods, fresh } = pickDaily(pool, S.date, 4);

  const card = el('div', { class: 'card smart-card' },
    el('div', { class: 'smart-head' },
      el('span', { class: 'smart-ic' }, '🧠'),
      el('div', {},
        el('b', {}, t('smartProtein')),
        el('span', {}, `${num(Math.round(gap))}g · ${t('smartProteinSub')}`))));

  const list = el('div', { class: 'smart-foods' });
  for (const entry of foods) {
    const { f } = entry;
    const isNew = entry === fresh;
    /* the portion that delivers ~40% of the gap, rounded to a kitchen amount */
    const grams = Math.max(50, Math.min(300, Math.round((gap * 0.4) / f.p * 100 / 10) * 10));
    const kcal = Math.round(f.kcal * grams / 100);
    const p = round(f.p * grams / 100, 1);
    list.append(el('button', { class: 'smart-food', onclick: async () => {
      /* Open it, do not log it. The suggested grams are a guess — a good
         one, and still a guess — so they become the number the chooser
         opens on rather than the number that lands in the diary. */
      const nut = await import('./nutrition.js');
      const { closeSheet } = await import('./ui.js');
      closeSheet();
      nut.openPortion(f, guessMeal(), grams);
    } },
      el('div', { class: 'sf-main' },
        el('b', {}, pick(f),
          isNew ? el('span', { class: 'sf-new' }, t('newToday')) : null),
        el('span', {}, `${num(grams)}g · ${num(kcal)} ${t('kcal')} · P ${num(p, 1)}g`)),
      el('span', { class: 'sf-add' }, '+')));
  }
  card.append(list);
  return card;
}

function guessMeal() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 22) return 'dinner';
  return 'snack';
}

/* ------------------------------------------------------------
   Training suggestions from history
   ------------------------------------------------------------ */

/**
 * Suggestions for the TRAIN tab: which muscle has drifted quiet,
 * which exercise is ready for a load jump, what was last trained.
 * Returns [] when the week looks balanced — silence is a feature.
 */
export async function trainCoachList() {
  const ws = await db.all('workouts');
  if (!ws.length) return [];
  const fa = getLang() === 'fa';
  const out = [];

  /* volume per muscle, last 7 days */
  const weekAgo = Date.now() - 7 * 864e5;
  const perMuscle = {};
  const perEx = {};
  for (const w of ws) {
    const when = w.start || Date.parse(w.date);
    for (const e of w.exercises || []) {
      const vol = sum(e.sets || [], s => (Number(s.w) || 0) * (Number(s.r) || 0));
      const sets = (e.sets || []).filter(s => s.done).length;
      const meta = catalog().find(x => x.id === e.exId);
      const m = meta?.muscle || 'other';
      if (when >= weekAgo) {
        perMuscle[m] = (perMuscle[m] || 0) + vol;
      }
      perEx[e.exId] = perEx[e.exId] || { last: when, sets: 0 };
      perEx[e.exId].last = Math.max(perEx[e.exId].last, when);
      perEx[e.exId].sets += sets;
    }
  }

  /* 1) a muscle not touched all week while its siblings were */
  const trained = Object.entries(perMuscle);
  if (trained.length >= 2) {
    const max = Math.max(...trained.map(([, v]) => v));
    const quiet = trained.filter(([m, v]) => v < max * 0.1);
    for (const [m] of quiet.slice(0, 1)) {
      const name = pick({ name: m, nameFa: faName(m) }) || m;
      out.push({ ic: '🌑', text: fa
        ? `${name} این هفته ساکت است — یک حرکت برایش بگذار`
        : `${name} hasn't been trained this week — give it a slot` });
    }
  }

  /* 2) an exercise untouched for 10+ days that used to be regular */
  const recs = await records().catch(() => ({}));
  const stale = Object.entries(perEx)
    .filter(([id, v]) => v.sets >= 6 && Date.now() - v.last > 10 * 864e5 && recs[id])
    .sort((a, b) => a[1].last - b[1].last)[0];
  if (stale) {
    out.push({ ic: '⏳', text: fa
      ? `${exName(stale[0])} را ${Math.round((Date.now() - stale[1].last) / 864e5)} روز است رها کرده‌ای`
      : `${exName(stale[0])} has been idle ${Math.round((Date.now() - stale[1].last) / 864e5)} days` });
  }

  /* 3) a ready-for-progress exercise: same weight for 3+ sessions */
  for (const [id, r] of Object.entries(recs)) {
    if (r.sessions >= 3 && r.flatSessions >= 3) {
      out.push({ ic: '📈', text: fa
        ? `وزنه‌ی ${exName(id)} مدتی است ثابت مانده — وقت افزایش`
        : `${exName(id)} load has been flat — time to add`, exId: id });
      break;
    }
  }
  return out.slice(0, 3);
}

/** A starting weight for an exercise, from the person's own history. */
export async function suggestWeightFor(exId, targetReps, dispKg) {
  const prev = await lastSetsFor(exId);
  if (!prev?.length) return null;
  const good = prev.filter(s => (Number(s.w) || 0) > 0 && (Number(s.r) || 0) > 0);
  if (!good.length) return null;
  const w = Number(good[0].w);
  const r = Number(good[0].r);
  const target = Number(targetReps) || r;
  /* hit the target easily last time → suggest +2.5kg; struggled (reps below
     target) → hold; never reached half the target → step down. dispKg, when
     given, is the value already written into the first empty set. */
  const cur = Number(dispKg) || 0;
  if (target && r >= target && (!cur || cur < round(w + 2.4, 1) || cur > w + 0.1)) return { w: round(w + 2.5, 1), why: 'up' };
  if (target && r < target * 0.6) return { w: round(Math.max(w - 2.5, 0), 1), why: 'down' };
  if (cur && Math.abs(cur - w) < 0.1) return null;   // already matches
  return { w, why: 'hold' };
}

function faName(m) {
  const FA = { chest: 'سینه', back: 'پشت', shoulders: 'سرشانه', biceps: 'جلوبازو',
    triceps: 'پشت‌بازو', quads: 'چهارسر', hamstrings: 'همسترینگ', glutes: 'باسن',
    calves: 'ساق', abs: 'شکم', cardio: 'هوازی' };
  return FA[m] || m;
}
