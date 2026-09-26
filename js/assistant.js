/* ============ FitYar — the answers ============

   ask.js works out which question was asked. This answers it, and every
   answer here comes out of the database on the phone: nothing is generated,
   nothing is guessed, and nothing leaves the device.

   That is the whole argument for this feature. A chat model asked "how much
   protein have I got left today" has to be told the answer before it can
   say it; a query already knows. So the questions people actually ask a
   fitness app — their own numbers, their own history, their own records —
   are answered here exactly, offline, instantly, and the app can put a
   button under the answer that acts on it.

   What it cannot do, it says it cannot do. A question with no matching
   intent gets an honest "I did not understand that" and three examples,
   never an invented answer. And a question answered from the written
   library is labelled as general advice, because that is what it is.
*/

import * as db from './db.js';
import { S, kgToDisp, wUnit, fiberGoal } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  el, sheet, closeSheet, round, todayKey, addDays, shortDate, longDate, daysBetween,
} from './ui.js';
import { lineIcon } from './icons.js';
import {
  match, findNamed, periodOf, words, EXAMPLES_FA, EXAMPLES_EN, EXAMPLE_GROUPS,
} from './ask.js';
import { FOODS } from './data-foods.js';
import { EXERCISES, EX_INDEX, MUSCLES } from './data-exercises.js';
import { KNOWLEDGE_TEXT } from './knowledge.js';

const fa = () => getLang() === 'fa';

/* One icon per topic on the questions sheet. A grid of eight identical
   buttons is eight rectangles; the icon is what lets someone find «تغذیه»
   without reading all eight. */
const TOPIC_ICON = {
  today: 'sun', body: 'scale', howto: 'dumbbell', plan: 'calendar',
  eating: 'cutlery', supps: 'drop', health: 'moon', goals: 'target',
};

/* ---------------- small helpers ---------------- */

const g = (n) => `${num(Math.round(n))}${fa() ? ' گرم' : 'g'}`;
const kc = (n) => `${num(Math.round(n))} ${t('kcal')}`;

/** An answer: a line or two, optionally some things you can act on. */
const say = (text, extra = {}) => ({ text, ...extra });

/* ---------------- the day ---------------- */

async function today() {
  const nut = await import('./nutrition.js');
  const sum = await nut.daySummary(S.date);
  const water = await nut.getWater(S.date);
  return { ...sum, water };
}

const goals = () => ({
  kcal: S.goals?.kcal || 0,
  protein: S.goals?.protein || 0,
  carbs: S.goals?.carbs || 0,
  fat: S.goals?.fat || 0,
  fiber: fiberGoal(),
  water: S.goals?.water || 2500,
});

async function macroLeft(key, label) {
  const sum = await today();
  const goal = goals()[key];
  if (!goal) {
    return say(fa() ? `هدفی برای ${label} تعیین نشده.` : `No ${label} target is set.`);
  }
  const had = sum[key === 'kcal' ? 'kcal' : key] || 0;
  const left = key === 'kcal'
    ? Math.round(goal - had + (sum.burned || 0))
    : Math.round(goal - had);

  if (left <= 0) {
    return say(fa()
      ? `${label} امروزت کامل شده — ${key === 'kcal' ? kc(had) : g(had)} از ${key === 'kcal' ? kc(goal) : g(goal)}.`
      : `You have met today's ${label}: ${key === 'kcal' ? kc(had) : g(had)} of ${key === 'kcal' ? kc(goal) : g(goal)}.`);
  }
  const shown = key === 'kcal' ? kc(left) : g(left);
  return say(fa()
    ? `${shown} ${label} مانده. تا حالا ${key === 'kcal' ? kc(had) : g(had)} از ${key === 'kcal' ? kc(goal) : g(goal)}.`
    : `${shown} of ${label} left — ${key === 'kcal' ? kc(had) : g(had)} of ${key === 'kcal' ? kc(goal) : g(goal)} so far.`);
}

/* ---------------- what to eat ---------------- */

/**
 * Foods that would fill the protein gap without blowing the calorie budget.
 *
 * Ranked by protein per calorie rather than by protein alone, because
 * otherwise the answer is always the fattiest cut in the table. Foods the
 * person has logged before come first: a suggestion they already eat is
 * worth more than a better one they do not.
 */
async function proteinFoods() {
  const sum = await today();
  const G = goals();
  const needP = Math.round(G.protein - (sum.protein || 0));
  const roomK = Math.round(G.kcal - (sum.kcal || 0) + (sum.burned || 0));

  if (needP <= 0) {
    return say(fa()
      ? 'پروتئین امروزت کامل شده. لازم نیست چیزی اضافه کنی.'
      : "Today's protein is already met.");
  }

  /* what this person actually eats */
  const logs = await db.all('foodLogs');
  const mine = new Map();
  for (const l of logs) if (l.foodId) mine.set(l.foodId, (mine.get(l.foodId) || 0) + 1);

  const serving = (f) => {
    const s = f.servings?.[0];
    return s ? { label: s[0], grams: s[1] } : { label: fa() ? '۱۰۰ گرم' : '100 g', grams: 100 };
  };

  const ranked = FOODS
    .filter((f) => f.p >= 8 && f.kcal > 0 && !f.liquid)
    .map((f) => {
      const sv = serving(f);
      const k = f.kcal * sv.grams / 100;
      const p = f.p * sv.grams / 100;
      return { food: f, sv, kcal: k, protein: p, density: f.p / f.kcal, seen: mine.get(f.id) || 0 };
    })
    /* a serving has to be a real portion and has to fit what is left */
    .filter((x) => x.protein >= 6 && (roomK <= 0 || x.kcal <= Math.max(220, roomK)))
    .sort((a, b) => (b.seen - a.seen) || (b.density - a.density));

  /* One row per food. Ranking ran over every serving, so a food with two
     portion sizes took two of the three slots and offered the reader a
     choice between one tin of tuna and a slightly smaller tin. */
  const seenFood = new Set();
  const picks = ranked.filter((x) => {
    if (seenFood.has(x.food.id)) return false;
    seenFood.add(x.food.id);
    return true;
  }).slice(0, 3);

  if (!picks.length) {
    return say(fa()
      ? `${g(needP)} پروتئین مانده، ولی با ${kc(Math.max(0, roomK))} باقی‌مانده چیزی که جا بشود پیدا نکردم.`
      : `${g(needP)} of protein left, but nothing fits in the ${kc(Math.max(0, roomK))} remaining.`);
  }

  return say(
    fa()
      ? `${g(needP)} پروتئین مانده و ${kc(Math.max(0, roomK))} جا داری. این‌ها جا می‌شوند:`
      : `${g(needP)} of protein to go, with ${kc(Math.max(0, roomK))} of room. These fit:`,
    { foods: picks },
  );
}

/* ---------------- the body ---------------- */

async function weightChange(text) {
  const ws = (await db.all('weights')).filter((w) => Number(w.kg) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  if (ws.length < 2) {
    return say(fa()
      ? 'برای مقایسه حداقل دو وزن‌کشی لازم است. یکی ثبت کن تا بتوانم بگویم.'
      : 'Two weigh-ins are needed to compare. Log one and I can tell you.');
  }
  const period = periodOf(text);
  const days = { today: 1, yesterday: 2, week: 7, month: 30, year: 365 }[period] || 30;
  const from = addDays(todayKey(), -(days - 1));
  const inRange = ws.filter((w) => w.date >= from);
  const first = (inRange.length >= 2 ? inRange : ws)[0];
  const last = ws[ws.length - 1];
  const diff = last.kg - first.kg;
  const label = { week: fa() ? 'این هفته' : 'this week', month: fa() ? 'این ماه' : 'this month',
    year: fa() ? 'امسال' : 'this year' }[period] || (fa() ? 'از اولین وزن‌کشی' : 'since you started');

  const amount = `${num(round(Math.abs(kgToDisp(diff)), 1), 1)} ${wUnit()}`;
  if (Math.abs(diff) < 0.05) {
    return say(fa() ? `${label} وزنت تقریباً ثابت مانده.` : `Your weight is steady ${label}.`);
  }
  return say(fa()
    ? `${label} ${amount} ${diff < 0 ? 'کم' : 'اضافه'} کرده‌ای — از ${num(round(kgToDisp(first.kg), 1), 1)} به ${num(round(kgToDisp(last.kg), 1), 1)} ${wUnit()}.`
    : `${diff < 0 ? 'Down' : 'Up'} ${amount} ${label} — ${num(round(kgToDisp(first.kg), 1), 1)} to ${num(round(kgToDisp(last.kg), 1), 1)} ${wUnit()}.`);
}

async function weightNow() {
  const ws = (await db.all('weights')).filter((w) => Number(w.kg) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const last = ws[ws.length - 1];
  if (!last) {
    return say(fa() ? 'هنوز وزنی ثبت نکرده‌ای.' : 'You have not logged a weight yet.');
  }
  const ago = daysBetween(last.date, todayKey());
  const when = ago === 0 ? (fa() ? 'امروز' : 'today')
    : ago === 1 ? (fa() ? 'دیروز' : 'yesterday')
      : (fa() ? `${num(ago)} روز پیش` : `${num(ago)} days ago`);
  return say(fa()
    ? `${num(round(kgToDisp(last.kg), 1), 1)} ${wUnit()} — ثبت‌شده ${when}.`
    : `${num(round(kgToDisp(last.kg), 1), 1)} ${wUnit()}, logged ${when}.`);
}

/* ---------------- training ---------------- */

async function trainCount(text) {
  const period = periodOf(text);
  const days = { today: 1, yesterday: 2, week: 7, month: 30, year: 365 }[period] || 7;
  const from = addDays(todayKey(), -(days - 1));
  const all = await db.all('workouts');
  const inRange = all.filter((w) => w.date && w.date >= from);
  const label = { today: fa() ? 'امروز' : 'today', week: fa() ? 'این هفته' : 'this week',
    month: fa() ? 'این ماه' : 'this month', year: fa() ? 'امسال' : 'this year' }[period]
    || (fa() ? 'این هفته' : 'this week');

  if (!inRange.length) {
    return say(fa() ? `${label} هنوز تمرینی ثبت نشده.` : `No workouts ${label} yet.`);
  }
  const sets = inRange.reduce((n, w) => n + (w.sets || 0), 0);
  return say(fa()
    ? `${label} ${num(inRange.length)} تمرین کرده‌ای، روی هم ${num(sets)} ست.`
    : `${num(inRange.length)} workouts ${label}, ${num(sets)} sets in total.`);
}

async function trainLast() {
  const all = (await db.all('workouts')).filter((w) => w.date)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  if (!all.length) return say(fa() ? 'هنوز تمرینی ثبت نکرده‌ای.' : 'No workouts logged yet.');
  const w = all[0];
  const ago = daysBetween(w.date, todayKey());
  const when = ago === 0 ? (fa() ? 'امروز' : 'today')
    : ago === 1 ? (fa() ? 'دیروز' : 'yesterday')
      : (fa() ? `${num(ago)} روز پیش` : `${num(ago)} days ago`);
  return say(fa()
    ? `آخرین تمرینت ${when} بود — ${w.name || 'تمرین'}، ${num(w.sets || 0)} ست.`
    : `Your last workout was ${when}: ${w.name || 'workout'}, ${num(w.sets || 0)} sets.`);
}

async function exerciseLast(text) {
  const ex = findNamed(text, EXERCISES, (e) => [e.nameFa, e.name]);
  if (!ex) {
    return say(fa()
      ? 'کدام حرکت؟ اسمش را بنویس — مثلاً «دفعه قبل پرس سینه هالتر چند زدم».'
      : 'Which exercise? Name it — "what did I lift on bench press last time".');
  }
  const all = (await db.all('workouts')).sort((a, b) => (b.start || 0) - (a.start || 0));
  for (const w of all) {
    const entry = (w.exercises || []).find((x) => x.exId === ex.id);
    const done = (entry?.sets || []).filter((s) => s.done && s.type !== 'w');
    if (!done.length) continue;
    const best = done.reduce((a, b) => ((Number(b.w) || 0) > (Number(a.w) || 0) ? b : a));
    const ago = daysBetween(w.date, todayKey());
    return say(fa()
      ? `${pick(ex)} — ${num(ago)} روز پیش، ${num(done.length)} ست، بهترینش ${num(round(kgToDisp(best.w), 1), 1)}${wUnit()} × ${num(best.r)}.`
      : `${pick(ex)} — ${num(ago)} days ago, ${num(done.length)} sets, best ${num(round(kgToDisp(best.w), 1), 1)}${wUnit()} × ${num(best.r)}.`);
  }
  return say(fa() ? `${pick(ex)} را هنوز ثبت نکرده‌ای.` : `You have not logged ${pick(ex)} yet.`);
}

async function exerciseRecord(text) {
  const wk = await import('./workouts.js');
  const recs = await wk.records();
  const ex = findNamed(text, EXERCISES, (e) => [e.nameFa, e.name]);

  if (ex) {
    const r = recs[ex.id];
    if (!r?.maxW) return say(fa() ? `هنوز رکوردی برای ${pick(ex)} نداری.` : `No record for ${pick(ex)} yet.`);
    return say(fa()
      ? `رکورد ${pick(ex)}: ${num(round(kgToDisp(r.maxW), 1), 1)}${wUnit()} × ${num(r.reps)} — و بیشترین تکرارت ${num(r.maxReps)}.`
      : `${pick(ex)}: ${num(round(kgToDisp(r.maxW), 1), 1)}${wUnit()} × ${num(r.reps)}, most reps ${num(r.maxReps)}.`);
  }

  const top = Object.values(recs).filter((r) => r.maxW)
    .sort((a, b) => b.best1rm - a.best1rm).slice(0, 3);
  if (!top.length) return say(fa() ? 'هنوز رکوردی ثبت نشده.' : 'No records yet.');
  return say(
    fa() ? 'سنگین‌ترین رکوردهایت:' : 'Your heaviest records:',
    { lines: top.map((r) => `${wk.exName(r.exId)} — ${num(round(kgToDisp(r.maxW), 1), 1)}${wUnit()} × ${num(r.reps)}`) },
  );
}

async function muscleNeglected() {
  const { muscleStats } = await import('./muscles.js');
  const all = await db.all('workouts');
  const stats = muscleStats(all, EX_INDEX);
  const rows = Object.entries(stats)
    .map(([id, r]) => ({ id, ...r }))
    .sort((a, b) => (b.daysSince ?? 999) - (a.daysSince ?? 999));

  const name = (id) => pick(MUSCLES.find((m) => m.id === id) || { name: id, nameFa: id });
  const cold = rows.filter((r) => r.sets30 === 0).slice(0, 3);
  if (cold.length) {
    return say(
      fa() ? 'این‌ها در سی روز گذشته اصلاً تمرین نشده‌اند:' : 'Not trained at all in the last 30 days:',
      { lines: cold.map((r) => name(r.id)), muscles: cold.map((r) => r.id) },
    );
  }
  const oldest = rows.slice(0, 3).filter((r) => r.daysSince !== null);
  if (!oldest.length) return say(fa() ? 'هنوز تمرینی ثبت نشده.' : 'No training logged yet.');
  return say(
    fa() ? 'بیشترین فاصله از آخرین تمرین:' : 'Longest since trained:',
    {
      lines: oldest.map((r) => `${name(r.id)} — ${num(r.daysSince)} ${fa() ? 'روز' : 'days'}`),
      muscles: oldest.map((r) => r.id),
    },
  );
}

async function muscleExercises(text) {
  const m = findNamed(text, MUSCLES.filter((x) => x.id !== 'all'), (x) => [x.nameFa, x.name]);
  if (!m) {
    return say(fa()
      ? 'برای کدام عضله؟ مثلاً «برای سینه چه حرکتی».'
      : 'Which muscle? For example "what exercises for chest".');
  }
  const list = EXERCISES.filter((e) => e.muscle === m.id).slice(0, 5);
  if (!list.length) return say(fa() ? `حرکتی برای ${pick(m)} پیدا نکردم.` : `No exercises found for ${pick(m)}.`);
  return say(
    fa() ? `برای ${pick(m)}:` : `For ${pick(m)}:`,
    { lines: list.map((e) => pick(e)), muscles: [m.id] },
  );
}

/* ---------------- the long view ---------------- */

async function streakAnswer() {
  const coach = await import('./coach.js');
  const st = await coach.streaks();
  return say(fa()
    ? `ثبت تغذیه: ${num(st.nutrition.current)} روز پیوسته (بهترین ${num(st.nutrition.best)}).\n`
      + `تمرین: ${num(st.training.current)} هفته پیوسته (بهترین ${num(st.training.best)}).`
    : `Logging: ${num(st.nutrition.current)} days (best ${num(st.nutrition.best)}).\n`
      + `Training: ${num(st.training.current)} weeks (best ${num(st.training.best)}).`);
}

async function levelAnswer() {
  const { rankState } = await import('./xp.js');
  const r = await rankState();
  return say(fa()
    ? `سطح ${num(r.level)} با ${num(r.xp)} امتیاز — ${num(r.toNext)} امتیاز تا سطح بعد.\n`
      + `${num(r.facts.workouts)} تمرین، ${num(r.facts.sets)} ست، ${num(r.facts.prs)} رکورد.`
    : `Level ${num(r.level)}, ${num(r.xp)} XP — ${num(r.toNext)} to the next.\n`
      + `${num(r.facts.workouts)} workouts, ${num(r.facts.sets)} sets, ${num(r.facts.prs)} records.`);
}

async function todaySummary() {
  const sum = await today();
  const G = goals();
  const left = Math.round(G.kcal - (sum.kcal || 0) + (sum.burned || 0));
  return say(fa()
    ? `امروز ${kc(sum.kcal || 0)} خورده‌ای و ${kc(sum.burned || 0)} سوزانده‌ای — ${left >= 0 ? `${kc(left)} مانده` : `${kc(-left)} بیشتر از هدف`}.\n`
      + `پروتئین ${g(sum.protein || 0)} از ${g(G.protein)} · آب ${num(sum.water || 0)} از ${num(G.water)} میلی‌لیتر.`
    : `Today: ${kc(sum.kcal || 0)} eaten, ${kc(sum.burned || 0)} burned — ${left >= 0 ? `${kc(left)} left` : `${kc(-left)} over`}.\n`
      + `Protein ${g(sum.protein || 0)} of ${g(G.protein)}, water ${num(sum.water || 0)} of ${num(G.water)} ml.`);
}

async function weekSummary() {
  const from = addDays(todayKey(), -6);
  const all = (await db.all('workouts')).filter((w) => w.date >= from);
  const logs = (await db.all('foodLogs')).filter((l) => l.date >= from);
  const days = new Set(logs.map((l) => l.date)).size;
  const sets = all.reduce((n, w) => n + (w.sets || 0), 0);
  return say(fa()
    ? `هفت روز گذشته: ${num(all.length)} تمرین (${num(sets)} ست) و ${num(days)} روز ثبت تغذیه.`
    : `Last seven days: ${num(all.length)} workouts (${num(sets)} sets), ${num(days)} days logged.`);
}

/* ---------------- what it can do ---------------- */

export const EXAMPLES = () => (fa() ? EXAMPLES_FA : EXAMPLES_EN);

function helpAnswer() {
  return say(
    fa()
      ? 'از دادهٔ خودت جواب می‌دهم — چیزی از خودم درنمی‌آورم و چیزی هم جایی نمی‌رود. مثلاً:'
      : 'I answer from your own data — nothing invented, nothing sent anywhere. For example:',
    { lines: EXAMPLES().slice(0, 8) },
  );
}

/* ---------------- the switchboard ---------------- */

const DATA = {
  'protein.left': () => macroLeft('protein', fa() ? 'پروتئین' : 'protein'),
  'kcal.left': () => macroLeft('kcal', fa() ? 'کالری' : 'calories'),
  'carbs.left': () => macroLeft('carbs', fa() ? 'کربوهیدرات' : 'carbs'),
  'fat.left': () => macroLeft('fat', fa() ? 'چربی' : 'fat'),
  'protein.what': proteinFoods,
  'water.left': async () => {
    const sum = await today();
    const goal = goals().water;
    const left = Math.max(0, goal - (sum.water || 0));
    return say(left
      ? (fa() ? `${num(left)} میلی‌لیتر آب مانده — ${num(sum.water || 0)} از ${num(goal)}.`
        : `${num(left)} ml of water to go — ${num(sum.water || 0)} of ${num(goal)}.`)
      : (fa() ? 'آب امروزت کامل شده.' : "Today's water is done."));
  },
  'today.summary': todaySummary,
  'week.summary': weekSummary,
  'weight.change': weightChange,
  'weight.now': weightNow,
  'train.count': trainCount,
  'train.last': trainLast,
  'exercise.last': exerciseLast,
  'exercise.record': exerciseRecord,
  'muscle.neglected': muscleNeglected,
  'muscle.exercises': muscleExercises,
  streak: streakAnswer,
  level: levelAnswer,
  help: helpAnswer,
};

/**
 * Answer a question, or say honestly that it was not understood.
 *
 * Never throws: a question that cannot be answered gets the same shape as
 * one that can, because a chat that can crash is a chat nobody trusts.
 */
export async function answer(text) {
  const hit = match(text);
  if (!hit) {
    return say(
      fa() ? 'این را نفهمیدم. چیزهایی که بلدم:' : "I did not understand that. Here is what I can do:",
      { lines: EXAMPLES().slice(0, 3), unknown: true, asked: String(text || '').slice(0, 120) },
    );
  }

  if (hit.knowledge) {
    const body = KNOWLEDGE_TEXT[hit.id];
    if (!body) {
      return say(fa() ? 'این را نفهمیدم.' : 'I did not understand that.',
        { lines: EXAMPLES().slice(0, 3), unknown: true, asked: String(text || '').slice(0, 120) });
    }
    /* Labelled, because this one is written advice rather than the reader's
       own numbers, and the difference matters. */
    return say(fa() ? body.fa : body.en, { general: true });
  }

  try {
    return await DATA[hit.id](text);
  } catch (e) {
    return say(fa()
      ? 'موقع خواندن داده‌ها به مشکل خوردم.'
      : 'Something went wrong reading your data.', { error: String(e?.message || e) });
  }
}

/**
 * What the assistant could not answer, kept on this device.
 *
 * This is the roadmap for the written library: rather than guessing which
 * questions matter, read the ones people actually asked that fell through.
 * Capped, and never sent anywhere.
 */
export async function noteMiss(text) {
  const q = String(text || '').trim().slice(0, 120);
  if (!q) return;
  const list = (await db.metaGet('askMisses', [])) || [];
  const found = list.find((x) => x.q === q);
  if (found) found.n += 1;
  else list.push({ q, n: 1, at: todayKey() });
  list.sort((a, b) => b.n - a.n);
  await db.metaSet('askMisses', list.slice(0, 120));
}

/** The misses, most-asked first, for whoever writes the answers. */
export const misses = () => db.metaGet('askMisses', []);

/* ---------------- the chat ---------------- */

/**
 * Ask a question, get an answer out of your own data.
 *
 * Opens with the suggestions showing: an empty box asks the reader to guess
 * what it understands, and a wrong guess is read as "it does not work".
 */
/**
 * Build the chat, and hand it back.
 *
 * The tab mounts this in a screen; `openAsk` puts the same thing in a sheet.
 * One conversation, built once, so the two can never drift apart.
 */
export async function buildAsk() {
  const log = el('div', { class: 'ask-log' });
  const input = el('input', {
    class: 'input ask-in', id: 'ask-input',
    placeholder: fa() ? 'چیزی بپرس…' : 'Ask something…',
    enterkeyhint: 'send', autocomplete: 'off',
  });

  const bubble = (who, node) => {
    const b = el('div', { class: 'ask-row ' + who }, el('div', { class: 'ask-bubble' }, node));
    log.append(b);
    b.scrollIntoView({ block: 'end' });
    return b;
  };

  /** One food the answer suggested, with the button that logs it. */
  const foodRow = (x) => {
    const f = x.food;
    return el('div', { class: 'ask-food' },
      el('div', {},
        /* The brand, because two rows named «تن ماهی در آب» are two
           different tins and without it they read as one listed twice. */
        el('b', {}, pick(f), f.brand ? el('span', { class: 'brand-tag' }, f.brand) : null),
        el('span', {}, `${x.sv.label} · ${kc(x.kcal)} · ${g(x.protein)} ${fa() ? 'پروتئین' : 'protein'}`)),
      el('button', {
        class: 'btn sm',
        onclick: async (e) => {
          const nut = await import('./nutrition.js');
          await nut.addLog({
            date: S.date, meal: mealNow(), foodId: f.id,
            name: f.name, nameFa: f.nameFa, grams: x.sv.grams, unitLabel: x.sv.label,
            kcal: x.kcal, protein: x.protein,
            carbs: f.c * x.sv.grams / 100, fat: f.f * x.sv.grams / 100,
            fiber: (f.fib || 0) * x.sv.grams / 100,
          });
          e.target.disabled = true;
          e.target.textContent = fa() ? 'ثبت شد' : 'Logged';
          window.dispatchEvent(new CustomEvent('data-changed'));
        },
      }, t('log')));
  };

  const render = (a) => {
    const node = el('div', {});
    for (const line of String(a.text).split('\n')) {
      node.append(el('p', { class: 'ask-p' }, line));
    }
    if (a.lines?.length) {
      node.append(el('ul', { class: 'ask-list' }, ...a.lines.map((l) => el('li', {}, l))));
    }
    if (a.foods?.length) {
      node.append(el('div', { class: 'ask-foods' }, ...a.foods.map(foodRow)));
    }
    /* Written advice is labelled as written advice. The reader is owed the
       difference between their own numbers and someone's opinion. */
    if (a.general) node.append(el('div', { class: 'ask-note' }, t('askGeneral')));
    return node;
  };

  async function send(text) {
    const q = String(text || '').trim();
    if (!q) return;
    bubble('me', document.createTextNode(q));
    input.value = '';
    /* Out of the way while the answer arrives, back afterwards. Hiding them
       for good left the screen with nothing to do next: somebody who has
       just had one question answered is exactly the person with a second
       one, and the list is how they find out it can be asked. */
    chips.hidden = true;

    const thinking = bubble('it', el('span', { class: 'ask-dots' },
      el('i', {}), el('i', {}), el('i', {})));
    const a = await answer(q);
    thinking.remove();
    bubble('it', render(a));
    chips.hidden = false;
    if (a.unknown) noteMiss(a.asked).catch(() => {});
  }

  /* One button, with the heading that says what this screen is for.

     Twenty-six chips laid out inline filled half the screen and made the
     chat look like a menu rather than somewhere to type. The heading stays
     visible either way, because "common questions" is the one thing a
     reader needs to know before typing into a box that is not an AI. */
  const chips = el('div', { class: 'ask-faq' },
    el('b', {}, t('faqTitle')),
    el('button', {
      class: 'btn ghost full ask-faq-btn',
      onclick: () => {
        /* Two levels, not one long column.

           The questions were grouped before this and the grouping did not
           do anything: five headings in one scroll meant the reader still
           met all ninety-five and had to pass the four topics they did not
           want to reach the one they did.

           So the sheet opens on the topics alone. Tap one and the same
           sheet becomes that topic's questions with a way back. Ten
           questions on a screen is a list; ninety-five is a phone book. */
        const body = el('div', { class: 'faq-body' });

        const showTopics = () => body.replaceChildren(
          el('p', { class: 'faq-note' }, t('faqNote')),
          el('div', { class: 'faq-topics' }, ...EXAMPLE_GROUPS.map((g) => {
            const n = (fa() ? g.faQ : g.enQ).length;
            return el('button', {
              class: 'faq-topic', onclick: () => showQuestions(g),
            },
            el('span', { class: 'faq-topic-icon' },
              lineIcon(TOPIC_ICON[g.id] || 'chat', { size: 19 })),
            el('span', { class: 'faq-topic-name' }, fa() ? g.fa : g.en),
            el('span', { class: 'faq-topic-n' }, num(n)));
          })),
        );

        const showQuestions = (g) => body.replaceChildren(
          el('button', { class: 'faq-back', onclick: showTopics },
            lineIcon('chevron', { size: 15 }), t('faqTopics')),
          el('h4', { class: 'faq-group' }, fa() ? g.fa : g.en),
          el('div', { class: 'faq-list' }, ...(fa() ? g.faQ : g.enQ).map((x) =>
            el('button', {
              class: 'faq-item',
              onclick: () => { closeSheet(); send(x); },
            }, el('span', {}, x), lineIcon('chat', { size: 15 })))),
        );

        showTopics();
        sheet(t('faqTitle'), body);
      },
    }, lineIcon('book', { size: 16 }),
    `${t('faqAll')} (${num(EXAMPLES().length)})`));

  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') send(input.value); });

  const body = el('div', { class: 'ask-wrap' },
    log,
    chips,
    el('div', { class: 'ask-bar' },
      input,
      el('button', {
        class: 'btn ask-send', 'aria-label': fa() ? 'بفرست' : 'Send',
        onclick: () => send(input.value),
      }, lineIcon('swap', { size: 17 }))),
  );

  /* The offline answers get a face. It is the same body the training screens
     use, thinking — not a second mascot drawn separately and kept in step
     by hand. */
  const { pouyaCard } = await import('./pouya.js');
  const hello = pouyaCard({ line: t('askHello'), mood: 'think', fa: fa() });
  /* One line of welcome, so the first thing in an empty log is not nothing. */
  bubble('it', hello.node);

  return { node: body, send, dispose: () => hello.dispose() };
}

/** The chat in a sheet, for the ways in that are not the tab. */
export async function openAsk(seed = '') {
  const chat = await buildAsk();
  sheet(t('askTitle'), chat.node, { onClose: () => chat.dispose() });
  if (seed) chat.send(seed);
}

/**
 * The chat as a screen.
 *
 * Kept alive between visits — a conversation you have to start again every
 * time you look at another tab is not a conversation. Rebuilt only when the
 * language changes, because every word in it would otherwise be the old one.
 */
let mounted = null, mountedLang = null;
export async function renderChat(host) {
  if (mounted && mountedLang === getLang() && host.contains(mounted.node)) return;
  mounted?.dispose();
  mounted = await buildAsk();
  mountedLang = getLang();
  host.replaceChildren(mounted.node);
}

/** The meal it is time for, so a logged suggestion lands in the right one. */
function mealNow() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 22) return 'dinner';
  return 'snack';
}
