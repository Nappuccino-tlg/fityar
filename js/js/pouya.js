/* ============ پویا — the one who trains with you ============

   The competing app has برزو: a character who talks, because behind him is a
   language model and talking is what it can do. Ours cannot talk and should
   not pretend to. So پویا is built on the opposite footing — he says less,
   and everything he says is a fact out of the user's own database.

   The name is a real one and an ordinary one. برزو is out of the Shahnameh,
   a hero's name; this is somebody you train next to.

   ────────────────────────────────────────────────────────────────────────
   THE RULES OF WHAT HE SAYS. Everything below obeys all five, and a line
   that cannot obey them does not get written.

   1. EVERY LINE CARRIES A NUMBER THAT CAME OUT OF THE DATABASE. Not a
      number about training in general — a number about this person. "Three
      sets more than last time" is his job. "You can do it" is not.

   2. NEVER SHAME. A three-week gap is stated, never scolded: "after 21 days"
      and not "where were you". A tracker is used by people having a bad
      month, and a bad month is when an app gets deleted.

   3. NO MEDICINE, NO DIAGNOSIS, NO INVENTED TARGET. He reports; the targets
      screen sets targets and the knowledge file answers questions. If he
      does not have a fact, he says the plainest true thing available.

   4. ONE SENTENCE, OR TWO IF THE SECOND IS SHORT. He appears at the end of
      a workout, when somebody wants to put their phone away.

   5. HE NEVER CLAIMS TO KNOW WHY. Volume fell — that is a fact. Why it fell
      is between the person and their week, and a guess would be wrong often
      enough to be insulting.

   The picking is a pure function over a plain object of facts, so it runs in
   node and is checked there: tools/test-pouya.mjs.
*/

import { body3d } from './body3d.js';

/** What he is called. Used in the UI, not only in this file. */
export const POUYA = { fa: 'پویا', en: 'Pouya' };

/* ---------------- the gestures ----------------

   Not exercises, so they are not in the movement table — but the same shape:
   two ends and the time between them, in the same joint vocabulary. Angles
   are absolute; anything left out rests. */
export const GESTURES = {
  /* Both arms overhead, with a small bounce. For a record or a gain. */
  cheer: { a: { arm: 156, fore: 164, torso: -2 }, b: { arm: 176, fore: 178, torso: -5 }, ms: 1400 },
  /* Arms at shoulder height, forearms opening and closing: a greeting. */
  greet: { a: { arm: 94, fore: 150, torso: 2 }, b: { arm: 96, fore: 96, torso: 2 }, ms: 1100 },
  /* Almost still, breathing. For a long session, and for standing about. */
  breathe: { a: { torso: 4, arm: 9, fore: 15 }, b: { torso: 7, arm: 6, fore: 12 }, ms: 3600 },
  /* A hand toward the chin. For the screen where he is being asked things. */
  think: { a: { arm: 40, fore: 144, torso: 3 }, b: { arm: 44, fore: 152, torso: 5 }, ms: 2800 },
};

/* ---------------- what he says after a workout ----------------

   Ordered by how specific the fact is, and the first one that holds wins. A
   personal record beats a streak beats a plain total, because that is the
   order the person themselves would put them in.

   `facts` is whatever the caller could work out, and every field is
   optional — a missing fact simply skips its line rather than producing a
   sentence with a hole in it. */

const pct = (a, b) => (b > 0 ? Math.round(((a - b) / b) * 100) : 0);

const LINES = [
  {
    id: 'pr',
    when: (f) => f.prName && f.prWeight > 0,
    mood: 'cheer',
    fa: (f, n) => `رکورد زدی: ${f.prName}، ${n(f.prWeight)} ${f.unit}.`,
    en: (f, n) => `A personal record: ${f.prName}, ${n(f.prWeight)} ${f.unit}.`,
  },
  {
    id: 'first',
    when: (f) => f.totalWorkouts === 1,
    mood: 'greet',
    fa: (f, n) => `اولین جلسه‌ات ثبت شد — ${n(f.sets)} ست.`,
    en: (f, n) => `Your first workout is in — ${n(f.sets)} sets.`,
  },
  {
    /* Rule 2 lives or dies here. A number, and nothing else. */
    id: 'return',
    when: (f) => f.daysSinceLast >= 10,
    mood: 'greet',
    fa: (f, n) => `بعد از ${n(f.daysSinceLast)} روز، ${n(f.sets)} ست.`,
    en: (f, n) => `After ${n(f.daysSinceLast)} days, ${n(f.sets)} sets.`,
  },
  {
    id: 'volumeUp',
    when: (f) => f.lastVolume > 0 && pct(f.volume, f.lastVolume) >= 8,
    mood: 'cheer',
    fa: (f, n) => `${n(pct(f.volume, f.lastVolume))}٪ بیشتر از دفعهٔ قبلِ همین تمرین جابه‌جا کردی.`,
    en: (f, n) => `${n(pct(f.volume, f.lastVolume))}% more moved than last time you did this.`,
  },
  {
    id: 'streak',
    when: (f) => f.thisWeek >= 3,
    mood: 'cheer',
    fa: (f, n) => `${n(f.thisWeek)} جلسه در این هفته.`,
    en: (f, n) => `${n(f.thisWeek)} sessions this week.`,
  },
  {
    id: 'long',
    when: (f) => f.minutes >= 75,
    mood: 'breathe',
    fa: (f, n) => `${n(f.minutes)} دقیقه. حالا استراحت.`,
    en: (f, n) => `${n(f.minutes)} minutes. Rest now.`,
  },
  {
    /* Never reached with nothing to say: a saved workout always has sets. */
    id: 'total',
    when: (f) => f.sets > 0,
    mood: 'breathe',
    fa: (f, n) => `${n(f.sets)} ست، ${n(f.volume)} ${f.unit} جابه‌جا شده.`,
    en: (f, n) => `${n(f.sets)} sets, ${n(f.volume)} ${f.unit} moved.`,
  },
];

/**
 * The line for one finished workout.
 *
 * Pure: facts in, `{ id, mood, fa, en }` out, or null when there is nothing
 * true to say — which is better than something general.
 *
 * `n` formats a number the way the rest of the app does (Persian digits and
 * separators), and is passed in rather than imported so this file can be
 * read outside a browser.
 */
export function afterWorkout(facts = {}, n = (v) => String(v)) {
  const f = { sets: 0, volume: 0, minutes: 0, unit: 'kg', ...facts };
  /* A fact that is not a number is not a fact. Anything broken becomes zero
     here rather than reaching a sentence: "NaN kg moved" is worse than
     saying nothing, and a number arriving broken is a bug somewhere else
     that should not also become a bug the user reads. */
  for (const k of ['sets', 'volume', 'minutes', 'totalWorkouts',
    'daysSinceLast', 'thisWeek', 'lastVolume', 'prWeight']) {
    const v = Number(f[k]);
    f[k] = Number.isFinite(v) && v > 0 ? v : 0;
  }
  for (const line of LINES) {
    if (!line.when(f)) continue;
    return { id: line.id, mood: line.mood, fa: line.fa(f, n), en: line.en(f, n) };
  }
  return null;
}

/**
 * Turn a saved workout and the history around it into the facts پویا reads.
 *
 * Pulled out of the finishing code so it can be checked without a browser
 * and without a database — everything it needs arrives as arguments. The
 * conversions are the caller's, because kilograms or pounds is a setting
 * and this file does not know about settings.
 *
 * @param rec     the workout just written
 * @param all     every workout there is, this one included
 * @param extras  {volume, lastVolume, prWeight, unit} already converted
 */
export function workoutFacts(rec = {}, all = [], extras = {}) {
  const start = Number(rec.start) || 0;
  const past = all.filter((x) => x && x.id !== rec.id && Number(x.start) > 0)
    .sort((a, b) => b.start - a.start);
  const prev = past.find((x) => x.start <= start) || past[0] || null;
  /* The same workout, not merely the last one: "more than last time" only
     means something measured against the same session. Falls back to the
     name when there is no routine, because an unnamed routine repeated by
     hand is still the same workout to the person doing it. */
  const same = past.find((x) => (rec.routineId && x.routineId === rec.routineId)
    || (!rec.routineId && rec.name && x.name === rec.name)) || null;
  const weekAgo = start - 6 * 86400000;
  return {
    sets: rec.sets || 0,
    minutes: Math.round((((Number(rec.end) || start) - start) / 60000)),
    totalWorkouts: all.length,
    daysSinceLast: prev ? Math.round((start - prev.start) / 86400000) : 0,
    thisWeek: all.filter((x) => (Number(x?.start) || 0) >= weekAgo
      && (Number(x?.start) || 0) <= start).length,
    sameId: same ? same.id : null,
    ...extras,
  };
}

/* ---------------- and what he says on the home screen ----------------

   The same rules, one extra: on home he is allowed to say nothing at all,
   and does so whenever no specific fact holds. A character who is on the
   busiest screen of the app every single day, with something general to
   say, is wallpaper by the second week — and wallpaper is what the user
   stops reading before they stop seeing. */

const TODAY = [
  {
    id: 'trainedToday',
    when: (f) => f.setsToday > 0,
    mood: 'cheer',
    fa: (f, n) => `امروز ${n(f.setsToday)} ست زدی.`,
    en: (f, n) => `${n(f.setsToday)} sets done today.`,
  },
  {
    id: 'proteinDone',
    when: (f) => f.proteinTarget > 0 && f.protein >= f.proteinTarget,
    mood: 'cheer',
    fa: (f, n) => `${n(f.protein)} گرم پروتئین — به هدف امروز رسیدی.`,
    en: (f, n) => `${n(f.protein)} g of protein — today's target met.`,
  },
  {
    /* A fact, with no opinion attached to it. See rule 2. */
    id: 'away',
    when: (f) => f.daysSinceLast >= 4,
    mood: 'breathe',
    fa: (f, n) => `${n(f.daysSinceLast)} روز از آخرین تمرینت.`,
    en: (f, n) => `${n(f.daysSinceLast)} days since your last workout.`,
  },
  {
    id: 'weekGoing',
    when: (f) => f.thisWeek >= 3,
    mood: 'cheer',
    fa: (f, n) => `${n(f.thisWeek)} جلسه در این هفته.`,
    en: (f, n) => `${n(f.thisWeek)} sessions this week.`,
  },
  /* Protein short of its target used to be a line here. It moved to its own
     row, which can hand over to the foods that would fix it — a sentence
     that names a problem on a screen with no way to act on it is worse than
     no sentence. */
];

/**
 * Today's line, or null.
 *
 * Null is the common answer and the correct one: it means nothing specific
 * is true today, and the screen carries on saying what it said before.
 */
export function today(facts = {}, n = (v) => String(v)) {
  const f = { setsToday: 0, protein: 0, proteinTarget: 0,
    daysSinceLast: 0, thisWeek: 0, ...facts };
  for (const k of ['setsToday', 'protein', 'proteinTarget', 'daysSinceLast', 'thisWeek']) {
    const v = Number(f[k]);
    f[k] = Number.isFinite(v) && v > 0 ? v : 0;
  }
  for (const line of TODAY) {
    if (!line.when(f)) continue;
    return { id: line.id, mood: line.mood, fa: line.fa(f, n), en: line.en(f, n) };
  }
  return null;
}

/** Every line he is capable of, for the tests and the diagnostics page. */
export const LINE_IDS = LINES.map((l) => l.id);
export const TODAY_IDS = TODAY.map((l) => l.id);

/* ---------------- and what he looks like ----------------

   The same three-dimensional body the rest of the app uses — turnable,
   with the same joints — given eyes and a gesture instead of an exercise.
   He is not a second illustration to keep in step with the first one. */
export function pouyaCard({ line, mood = 'breathe', scale = 0.36 }) {
  /* Turned to face the reader rather than opened side-on like a movement
     demo — the whole difference between a figure you look at and one that
     is looking back. It still turns under a finger. */
  const fig = body3d({
    move: GESTURES[mood] || GESTURES.breathe,
    scale, face: true, load: false, openAt: 16,
  });
  const node = document.createElement('div');
  node.className = 'pouya';

  const stage = document.createElement('div');
  stage.className = 'pouya-fig';
  stage.append(fig.node);

  /* No name plate. A label over every sentence is a caption on a thing that
     needs no caption — you can see who is talking, and the sentence is the
     part worth reading. */
  const say = document.createElement('div');
  say.className = 'pouya-say';
  const what = document.createElement('p');
  what.textContent = line;
  say.append(what);

  node.append(stage, say);
  /* An animation behind a closed sheet is a battery leak nobody sees. */
  return { node, dispose: () => fig.dispose() };
}
