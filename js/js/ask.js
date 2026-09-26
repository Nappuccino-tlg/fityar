/* ============ FitYar — understanding a Persian question ============

   This is not a language model and does not pretend to be one. It is a
   matcher: it decides which of about thirty questions someone is asking,
   and hands that decision to code that answers from the database.

   Why that is the right shape here. Almost everything people ask a fitness
   app is a question about their own numbers — how much protein is left, what
   they lifted last time, how long since they trained legs. A model is at its
   worst on exactly those, because it does not have the data; a query is at
   its best. So the hard part is not generating an answer, it is working out
   which question was asked. That is what lives here.

   What makes wording flexible without a model is that sentences are never
   compared. Words are. Each intent lists the groups of words that must be
   present, with their synonyms and misspellings, and the text is normalised
   first — Arabic ی and ک folded to Persian, both sets of digits folded to
   Latin, zero-width non-joiners opened out, common suffixes stripped. So
   «پروتئین چی بخورم»، «چی بخورم پروتئینم بالا بره» and «غذاي پروتئين دار»
   all land in the same place, because all three carry a protein word and an
   eating word.

   The vocabulary is mostly free: data-foods.js and data-exercises.js already
   name eleven hundred foods and a hundred and nineteen exercises in Persian,
   so the matcher knows what a «ماست پرچرب» and a «پرس بالا سینه» are without
   anyone writing them down again.

   This file stays free of the browser so it can be run and checked in node.
   The answers live in assistant.js.
*/

/* ---------------- normalising ---------------- */

const FOLD = new Map([
  ['ي', 'ی'], ['ى', 'ی'], ['ك', 'ک'], ['ﻙ', 'ک'], ['ﻷ', 'لا'],
  ['ة', 'ه'], ['ۀ', 'ه'], ['أ', 'ا'], ['إ', 'ا'], ['آ', 'ا'], ['ٱ', 'ا'],
  ['ؤ', 'و'], ['ئ', 'ی'],
]);

/* Both digit sets people actually type, folded to one. */
for (let d = 0; d <= 9; d++) {
  FOLD.set(String.fromCharCode(0x06F0 + d), String(d));   // Persian
  FOLD.set(String.fromCharCode(0x0660 + d), String(d));   // Arabic-Indic
}

/* Short vowels and tanwin: typed by some, never by most, and never
   meaningful for matching. */
const MARKS = /[ً-ٰٟـ]/g;

/**
 * One spelling of a phrase, so two people typing the same question in two
 * scripts arrive at the same string.
 */
export function normalise(text) {
  let s = String(text || '').toLowerCase();
  s = s.replace(MARKS, '');
  s = s.replace(/[‌‏‎]/g, ' ');     // ZWNJ and the bidi marks
  s = [...s].map((ch) => FOLD.get(ch) ?? ch).join('');
  s = s.replace(/[؟?!.،,:;«»"'()\[\]/\\-]/g, ' ');
  return s.replace(/\s+/g, ' ').trim();
}

/* Suffixes that change nothing about which question is being asked.
   Longest first, and only ever stripped when a real stem is left behind —
   otherwise «ها» becomes nothing and «راه» becomes «ه». */
const SUFFIXES = [
  'هایمان', 'هایتان', 'هایشان', 'هایم', 'هایت', 'هایش',
  'هایی', 'های', 'ها', 'مان', 'تان', 'شان', 'ام', 'ات', 'اش', 'یم', 'ید',
];

/** A word with its grammatical tail removed, when one can safely come off. */
export function stem(word) {
  for (const suf of SUFFIXES) {
    if (word.length > suf.length + 2 && word.endsWith(suf)) {
      return word.slice(0, -suf.length);
    }
  }
  return word;
}

/** The words of a question, normalised and stemmed, with the stray ones out. */
const NOISE = new Set(['را', 'رو', 'از', 'به', 'با', 'در', 'که', 'می', 'یه', 'یک', 'و', 'تا', 'بر']);
export function words(text) {
  return normalise(text).split(' ').filter(Boolean).map(stem).filter((w) => !NOISE.has(w));
}

/* ---------------- what can be asked ---------------- */

/** Fold a synonym list the way the question will be folded.
 *
 * Stemmed as well as normalised, because the question is. Without it the
 * two sides are folded differently and the matching has to paper over the
 * difference with a prefix rule in both directions — which is what let
 * «کار» match «کاردیو» and answer half of every question with cardio
 * advice. Both sides stemmed, and an exact comparison does almost all of
 * the work on its own. */
const SYN = (list) => list.map((w) => stem(normalise(w))).filter(Boolean);

/* Each intent is a list of groups. A group is satisfied when any of its
   words appears; the intent matches when every group is satisfied. So
   `protein.what` needs a protein word AND an eating word, which is what
   keeps it apart from `protein.left`, which needs a protein word and a
   remaining word.

   Misspellings are listed where they are common rather than guessed at:
   پروتین without the ء is at least as frequent as the correct spelling. */

/* Every list below is normalised at load, because the text they are matched
   against is normalised too — and normalising folds ئ to ی, so a «پروتئین»
   written here would never meet the «پروتیین» that arrives. */
const PROTEIN = SYN(['پروتئین', 'پروتین', 'پروتيين', 'پروتئن', 'prot', 'protein']);
const KCAL = SYN(['کالری', 'کالر', 'انرژی', 'kcal', 'calorie']);
const CARB = SYN(['کربوهیدرات', 'کربو', 'carb', 'نشاسته']);
const FAT = SYN(['چربی', 'چرب', 'fat']);
const WATER = SYN(['اب', 'ابی', 'water', 'مایعات', 'drink']);
/* The connective words carry the grammar of a question, and they were the
   half that had no English in them — so an English sentence brought a noun
   the matcher knew and nothing else, and every one of them fell through. */
const LEFT = SYN(['مانده', 'باقی', 'مونده', 'بمونه', 'کم', 'چقدر', 'چند', 'مقدار', 'بقیه',
  'left', 'remaining', 'remain', 'much', 'many', 'short']);
const EAT = SYN(['بخورم', 'بخور', 'خوردن', 'غذا', 'وعده', 'بزنم', 'میخورم', 'خوراک', 'منبع', 'دار',
  'eat', 'food', 'meal', 'source', 'snack']);
const TODAY = SYN(['امروز', 'الان', 'today', 'so far']);
const WEEK = SYN(['هفته', 'هفتگی', 'week']);
const MONTH = SYN(['ماه', 'ماهانه', 'month']);
const TRAIN = SYN(['تمرین', 'ورزش', 'باشگاه', 'workout', 'تمرینی',
  'train', 'training', 'gym', 'session', 'exercise']);
const WEIGHT = SYN(['وزن', 'کیلو', 'weight', 'ترازو', 'kg', 'scale']);
const RECORD = SYN(['رکورد', 'بهترین', 'بیشترین', 'record', 'pr', 'best', 'max', 'heaviest']);
const MUSCLE = SYN(['عضله', 'عضلات', 'muscle', 'muscles']);
const WHEN = SYN(['کی', 'چه وقت', 'اخرین', 'when', 'چندوقت', 'گذشته', 'last', 'ago', 'recent']);
const HOWMANY = SYN(['چند', 'چقدر', 'تعداد', 'how', 'many', 'much', 'count']);

export const INTENTS = [
  /* --- the day's numbers --- */
  { id: 'protein.what', groups: [PROTEIN, EAT] },
  { id: 'protein.left', groups: [PROTEIN, LEFT] },
  { id: 'kcal.left', groups: [KCAL, LEFT] },
  { id: 'carbs.left', groups: [CARB, LEFT] },
  { id: 'fat.left', groups: [FAT, LEFT] },
  { id: 'water.left', groups: [WATER, LEFT] },
  { id: 'today.summary', groups: [TODAY, SYN(['چطور', 'خلاصه', 'وضعیت', 'چجور', 'گزارش',
    'summary', 'doing', 'status', 'ate', 'had', 'خوردم', 'خوردهام', 'زدم', 'eat', 'eaten'])] },

  /* --- the body --- */
  /* Told apart by meaning, not by word length: both used to carry «چقدر»,
     and the longer match decided — which answered «چقدر وزن کم کردم» with
     today's weight. A change question owns the change words now. */
  { id: 'weight.change', groups: [WEIGHT, SYN(['کم', 'زیاد', 'اضافه', 'تغییر', 'لاغر', 'چاق', 'افتاد',
    'lost', 'lose', 'gained', 'gain', 'dropped'])] },
  { id: 'weight.now', groups: [WEIGHT,
    SYN(['الان', 'فعلی', 'چنده', 'چیه', 'امروز', 'هست', 'what', 'current', 'now', 'is'])] },

  /* --- training --- */
  { id: 'train.count', groups: [TRAIN, HOWMANY] },
  { id: 'train.last', groups: [TRAIN, WHEN] },
  { id: 'muscle.neglected', groups: [MUSCLE,
    SYN(['عقب', 'نزدم', 'فراموش', 'کمتر', 'نرسیدم', 'جامانده', 'کدام', 'کدوم',
      'behind', 'which', 'neglected', 'missing', 'skipped'])] },
  { id: 'exercise.record', groups: [RECORD] },
  { id: 'exercise.last', groups: [SYN(['قبل', 'قبلی', 'دفعه', 'گذشته', 'اخرین', 'last', 'previous', 'before']), SYN(['زدم', 'بردم', 'چند', 'وزن', 'lift', 'lifted', 'did', 'weight'])] },
  { id: 'muscle.exercises', groups: [SYN(['حرکت', 'تمرینات', 'exercise']), SYN(['چه', 'کدام', 'کدوم', 'برای', 'پیشنهاد', 'چیه', 'چیست',
      'what', 'which', 'list'])] },

  /* --- the long view --- */
  { id: 'streak', groups: [SYN(['زنجیره', 'پیوسته', 'پشت سرهم', 'استریک', 'streak', 'روزمتوالی', 'متوالی'])] },
  { id: 'level', groups: [SYN(['سطح', 'لول', 'امتیاز', 'level', 'xp', 'رتبه'])] },
  /* The second group had no English in it, so "how was my week" carried a
     week word and nothing else and fell through. */
  { id: 'week.summary', groups: [WEEK, SYN(['چطور', 'خلاصه', 'گزارش', 'چجور', 'وضعیت',
    'summary', 'report', 'going', 'was'])] },

  /* --- the app itself --- */
  { id: 'help', groups: [SYN(['چیکار', 'چه کار', 'بلدی', 'کمک', 'راهنما', 'میتونی',
    'help', 'چی بپرسم', 'can you', 'what can', 'answer'])] },
];

/* Knowledge, not data: questions whose answers are written rather than
   looked up. Kept apart from the list above because they fail differently —
   a data answer is either exact or absent, and one of these is an opinion
   someone wrote down, which the reader deserves to be told. */
export const KNOWLEDGE = [
  { id: 'k.sets', groups: [SYN(['ست', 'sets']), SYN(['چند', 'چقدر', 'تعداد', 'how', 'many'])] },
  { id: 'k.reps', groups: [SYN(['تکرار', 'رپ', 'reps', 'rep']), SYN(['چند', 'چقدر', 'بهتر', 'how', 'many'])] },
  { id: 'k.rest', groups: [SYN(['استراحت', 'ریکاوری', 'rest', 'recovery']),
    SYN(['چقدر', 'چند', 'بین', 'how', 'long', 'between'])] },
  { id: 'k.preworkout', groups: [SYN(['قبل', 'before', 'pre']), TRAIN, EAT] },
  { id: 'k.postworkout', groups: [SYN(['بعد', 'after', 'post']), TRAIN, EAT] },
  { id: 'k.creatine', groups: [SYN(['کراتین', 'creatine'])] },
  /* Three groups, so it beats «چقدر پروتئین مانده» on specificity rather
     than on a tie-break: this one is also about needing, and that one is not. */
  { id: 'k.protein_target', groups: [PROTEIN,
    SYN(['نیاز', 'لازم', 'باید', 'روزانه', 'توصیه', 'need', 'should', 'daily', 'per day']),
    SYN(['چقدر', 'چند', 'مقدار', 'how', 'much'])] },
  { id: 'k.soreness', groups: [SYN(['کوفتگی', 'درد', 'sore', 'soreness', 'ache', 'aching']),
    [...MUSCLE, ...SYN(['بدن', 'پا', 'دست', 'body', 'legs', 'train', 'am'])]] },
  { id: 'k.sick', groups: [SYN(['مریض', 'سرما', 'تب', 'بیمار', 'sick', 'ill', 'cold', 'fever']), TRAIN] },
  { id: 'k.water_target', groups: [WATER,
    SYN(['نیاز', 'لازم', 'باید', 'روزانه', 'توصیه', 'need', 'should', 'daily', 'per day']),
    SYN(['چقدر', 'چند', 'مقدار', 'how', 'much'])] },
  { id: 'k.cardio', groups: [SYN(['هوازی', 'کاردیو', 'cardio', 'دویدن', 'running']),
    SYN(['قبل', 'بعد', 'کی', 'چقدر', 'چند', 'کنم', 'بکنم', 'بهتر', 'لازم', 'خوبه',
      'before', 'after', 'when', 'should', 'do', 'need'])] },
  { id: 'k.plateau', groups: [SYN(['گیر', 'متوقف', 'ثابت', 'پیشرفت',
    'stuck', 'plateau', 'stalled', 'stopped']),
    SYN(['نمیکنم', 'نکردم', 'کردم', 'وزنه', 'not', 'no', 'cannot', 'do', 'lifts', 'going'])] },

  /* ---- the written answers added later ----
     Injury first: a question about pain that could be either this or
     soreness should get the careful answer, and first-match is the only
     way to say so. */
  { id: 'k.injury', groups: [
    SYN(['درد', 'اسیب', 'مصدوم', 'pain', 'injury', 'hurts', 'hurt']),
    SYN(['مفصل', 'زانو', 'شانه', 'کمر', 'ارنج', 'مچ', 'joint', 'knee', 'shoulder', 'elbow', 'wrist'])] },
  { id: 'k.warmup', groups: [
    SYN(['گرم کردن', 'گرمکردن', 'warm up', 'warmup', 'warm']),
    SYN(['قبل', 'چطور', 'چگونه', 'before', 'how', 'should'])] },
  { id: 'k.sleep', groups: [
    SYN(['خواب', 'بخوابم', 'sleep', 'ریکاوری', 'recovery']),
    SYN(['چقدر', 'چند', 'ساعت', 'how', 'much', 'many', 'hours', 'need', 'لازم'])] },
  /* Three groups, so "how often should I train" beats "how often did I". */
  { id: 'k.frequency', groups: [TRAIN, WEEK,
    SYN(['باید', 'بهتر', 'چندبار', 'ایده ال', 'should', 'often', 'ideal'])] },
  { id: 'k.fatloss', groups: [
    SYN(['چربی', 'لاغر', 'وزن', 'fat', 'weight']),
    SYN(['کم', 'بسوزانم', 'بسوزونم', 'اب کنم', 'lose', 'burn', 'drop', 'cut']),
    SYN(['چطور', 'چگونه', 'چیکار', 'چکار', 'how', 'باید', 'should'])] },
  { id: 'k.gain', groups: [
    SYN(['عضله', 'حجم', 'muscle', 'mass', 'bulk']),
    SYN(['بسازم', 'اضافه', 'build', 'gain', 'بیشتر', 'رشد', 'grow']),
    SYN(['چطور', 'چگونه', 'چیکار', 'چکار', 'how', 'باید', 'should'])] },
  { id: 'k.form', groups: [
    SYN(['تکنیک', 'فرم', 'form', 'technique']),
    SYN(['درست', 'مهم', 'یاد', 'correct', 'right', 'important', 'matter'])] },
  { id: 'k.supplements', groups: [SYN(['مکمل', 'مکملها', 'supplement', 'supplements'])] },
  { id: 'k.whey', groups: [
    SYN(['پودر', 'powder', 'whey', 'وی']), PROTEIN,
    SYN(['بخورم', 'لازم', 'خوبه', 'بگیرم', 'should', 'need', 'use', 'take'])] },
  { id: 'k.carbs_night', groups: [CARB, SYN(['شب', 'شبها', 'night', 'عصر', 'late'])] },
  { id: 'k.cheat', groups: [
    SYN(['چیت', 'تقلب', 'cheat', 'ازاد', 'free']),
    SYN(['وعده', 'meal', 'غذا', 'روز', 'day'])] },
  { id: 'k.ramadan', groups: [
    SYN(['رمضان', 'ramadan', 'ramazan']),
    SYN(['تمرین', 'بخورم', 'روزه', 'چطور', 'باید', 'train', 'how', 'eat', 'during'])] },
  { id: 'k.fasting', groups: [
    SYN(['فستینگ', 'fasting', 'intermittent', 'متناوب', 'روزه داری'])] },
  { id: 'k.spot', groups: [
    SYN(['موضعی', 'spot', 'لاغری موضعی', 'spot reduction']),
    SYN(['چربی', 'لاغر', 'شکم', 'fat', 'reduce', 'belly'])] },
  { id: 'k.stretch', groups: [
    SYN(['کشش', 'استرچ', 'stretch', 'stretching', 'انعطاف', 'flexibility'])] },
  { id: 'k.deload', groups: [
    SYN(['دیلود', 'deload', 'هفته سبک', 'light week', 'هفته استراحت'])] },
  { id: 'k.overload', groups: [
    SYN(['اضافه بار', 'اضافهبار', 'overload', 'progressive', 'اورلود'])] },
  { id: 'k.women', groups: [
    SYN(['خانم', 'خانمها', 'زن', 'زنان', 'دختر', 'women', 'woman', 'female']),
    SYN(['وزنه', 'حجیم', 'عضلانی', 'bulky', 'weights', 'lift', 'lifting'])] },
  { id: 'k.beginner', groups: [
    SYN(['مبتدی', 'تازهکار', 'تازه کار', 'beginner', 'novice', 'new']),
    SYN(['شروع', 'برنامه', 'چیکار', 'چکار', 'start', 'begin', 'programme', 'program', 'do'])] },
  { id: 'k.abs', groups: [
    SYN(['شکم', 'سیکس پک', 'شش تکه', 'abs', 'six pack', 'sixpack']),
    SYN(['پیدا', 'دیده', 'بیاد', 'بیرون', 'visible', 'see', 'get', 'show'])] },
  { id: 'k.scale', groups: [
    SYN(['ترازو', 'وزن', 'scale', 'weight']),
    SYN(['نوسان', 'هرروز', 'فرق', 'daily', 'swing', 'fluctuat', 'every day', 'بالا پایین'])] },
  { id: 'k.caffeine', groups: [
    SYN(['قهوه', 'کافیین', 'کافئین', 'coffee', 'caffeine', 'انرژی زا'])] },
  { id: 'k.home', groups: [
    SYN(['خانگی', 'تمرین خانه', 'home workout', 'بدون وسیله', 'بدون باشگاه', 'at home', 'بدون دستگاه'])] },

  /* ---- a second batch ----
     Pregnancy first, beside injury, for the same reason: this one is
     answered by declining to answer it, and a sentence that could be read
     two ways should get the careful reading. */
  { id: 'k.pregnancy', groups: [
    SYN(['بارداری', 'باردار', 'حامله', 'pregnant', 'pregnancy'])] },
  { id: 'k.tdee', groups: [
    SYN(['نگهدارنده', 'tdee', 'کالری پایه', 'maintenance', 'متابولیسم'])] },
  { id: 'k.macros', groups: [
    SYN(['ماکرو', 'درشت مغذی', 'macro', 'macros', 'درشتمغذی'])] },
  { id: 'k.breakfast', groups: [
    SYN(['صبحانه', 'breakfast']),
    SYN(['مهم', 'لازم', 'بخورم', 'نخورم',
      'important', 'skip', 'need', 'should', 'matter', 'matters'])] },
  { id: 'k.meal_timing', groups: [
    SYN(['وعده', 'وعدهها', 'meal', 'meals']),
    SYN(['چند', 'تعداد', 'روزی', 'how many', 'a day', 'per day'])] },
  { id: 'k.veg_protein', groups: [
    SYN(['گیاهی', 'گیاهخوار', 'vegetarian', 'vegan', 'plant']), PROTEIN] },
  { id: 'k.sugar', groups: [
    SYN(['شکر', 'قند', 'شیرینی', 'sugar', 'sweets'])] },
  { id: 'k.eating_out', groups: [
    SYN(['بیرون', 'رستوران', 'مهمانی', 'eating out', 'restaurant', 'party']),
    SYN(['غذا', 'بخورم', 'eat', 'food', 'meal'])] },
  { id: 'k.motivation', groups: [
    SYN(['انگیزه', 'حوصله', 'motivation', 'motivated', 'lazy'])] },
  { id: 'k.habit', groups: [
    SYN(['عادت', 'habit', 'routine', 'استمرار', 'ثبات', 'consistent', 'consistency'])] },
  { id: 'k.weight_plateau', groups: [
    SYN(['وزنم', 'وزن', 'ترازو', 'weight', 'scale']),
    SYN(['ثابت', 'کم نمیشه', 'نمیاد پایین', 'متوقف', 'stuck', 'not moving', 'stopped'])] },
  { id: 'k.age', groups: [
    SYN(['سن', 'سال', 'پیر', 'مسن', 'age', 'older', 'old']),
    SYN(['تمرین', 'عضله', 'وزنه', 'train', 'muscle', 'lift', 'بالا'])] },
  { id: 'k.teen', groups: [
    SYN(['نوجوان', 'teen', 'teenager', 'زیر هجده', 'بچه'])] },
  { id: 'k.machine_vs_free', groups: [
    SYN(['دستگاه', 'machine', 'machines']),
    SYN(['ازاد', 'هالتر', 'دمبل', 'free weight', 'barbell', 'dumbbell', 'بهتر', 'better'])] },
  { id: 'k.compound', groups: [
    SYN(['ترکیبی', 'چندمفصلی', 'compound', 'تک عضله', 'isolation', 'ایزوله'])] },
  { id: 'k.failure', groups: [
    SYN(['ناتوانی', 'failure', 'تا اخر', 'to failure', 'ناتوان'])] },
  { id: 'k.split', groups: [
    SYN(['تقسیم', 'اسپلیت', 'split', 'فول بادی', 'full body', 'پوش پول', 'push pull'])] },
  { id: 'k.travel', groups: [
    SYN(['سفر', 'مسافرت', 'travel', 'travelling', 'هتل', 'trip']),
    SYN(['تمرین', 'چطور', 'چیکار', 'train', 'how', 'keep', 'do'])] },
  /* --- the second batch ---

     Added after a read of what people typed and got nothing for. Each one
     needs enough groups to beat the shorter intent it sits next to: a
     question about how many rest days is also a question about rest, so it
     carries three groups where k.rest carries two, and wins on specificity
     rather than on the order of this list. */
  { id: 'k.bulk_cut', groups: [SYN(['بالک', 'کات', 'bulk', 'cut', 'bulking', 'cutting'])] },
  { id: 'k.rest_days', groups: [SYN(['استراحت', 'ریکاوری', 'rest', 'off']),
    SYN(['روز', 'روزه', 'days', 'day']),
    SYN(['چند', 'هفته', 'چقدر', 'many', 'week', 'how'])] },
  { id: 'k.time_of_day', groups: [SYN(['صبح', 'عصر', 'شب', 'ظهر', 'بعدازظهر',
    'morning', 'evening', 'afternoon', 'night']), TRAIN] },
  { id: 'k.body_fat', groups: [SYN(['درصد', 'percent', 'percentage']), FAT] },
  { id: 'k.bmi', groups: [SYN(['bmi', 'شاخص', 'توده'])] },
  { id: 'k.walking', groups: [SYN(['پیاده', 'پیادهروی', 'walk', 'walking'])] },
  { id: 'k.steps', groups: [SYN(['قدم', 'قدمی', 'steps', 'step']),
    SYN(['چند', 'روزانه', 'هزار', 'روزی', 'daily', 'many', 'thousand'])] },
  { id: 'k.fiber', groups: [SYN(['فیبر', 'fibre', 'fiber'])] },
  { id: 'k.salt', groups: [SYN(['نمک', 'سدیم', 'salt', 'sodium'])] },
  { id: 'k.vitamin_d', groups: [SYN(['ویتامین', 'vitamin']),
    SYN(['دی', 'd', 'آفتاب', 'کمبود', 'sun', 'sunlight', 'deficiency', 'take'])] },
  { id: 'k.iron', groups: [SYN(['آهن', 'خونی', 'iron', 'anemia', 'anaemia'])] },
  { id: 'k.omega3', groups: [SYN(['امگا', 'omega'])] },
  { id: 'k.bread_rice', groups: [SYN(['نان', 'نون', 'برنج', 'bread', 'rice'])] },
  { id: 'k.dairy', groups: [SYN(['لبنیات', 'شیر', 'ماست', 'پنیر',
    'dairy', 'milk', 'yoghurt', 'yogurt', 'cheese'])] },
  /* «میان‌وعده» arrives as two words, because the zero-width non-joiner
     between them is a word break. So the synonym is the half that is not
     «وعده», which k.meal_timing already owns. */
  { id: 'k.snack', groups: [SYN(['میان', 'اسنک', 'snack', 'snacks'])] },
  { id: 'k.late_dinner', groups: [SYN(['شام', 'dinner']),
    SYN(['دیر', 'دیروقت', 'شب', 'late', 'night'])] },
  { id: 'k.cramps', groups: [SYN(['گرفتگی', 'کرامپ', 'cramp', 'cramps'])] },
  /* Two groups, not one. With one, «برای قوز کمر چه کار کنم؟» tied with
     the help intent — which is a single group of "what do I do" words —
     and the tie went the wrong way. A question about a named thing should
     beat a question about nothing in particular. */
  { id: 'k.posture', groups: [SYN(['قوز', 'قامت', 'پاسچر', 'posture', 'slouch',
    'slouching', 'hunch']),
    SYN(['کمر', 'پشت', 'چه', 'چطور', 'کنم', 'اصلاح', 'درست',
      'back', 'what', 'how', 'do', 'fix', 'about'])] },
  { id: 'k.desk_job', groups: [SYN(['میز', 'اداری', 'صندلی', 'نشستن',
    'desk', 'sitting', 'office', 'sedentary'])] },
  { id: 'k.stress', groups: [SYN(['استرس', 'اضطراب', 'stress', 'anxiety', 'anxious'])] },
  /* Not WEIGHT, which has no "weigh" in it — an English speaker asking how
     often to weigh themselves never writes the noun. */
  { id: 'k.weigh_frequency', groups: [SYN(['وزن', 'weight', 'weigh', 'weighing']),
    SYN(['هر', 'چندوقت', 'روزانه', 'بار', 'دفعه', 'often', 'daily', 'times', 'frequently']),
    SYN(['کنم', 'بکشم', 'بسنجم', 'چک', 'myself', 'check', 'should'])] },
  { id: 'k.measure_progress', groups: [SYN(['پیشرفت', 'progress']),
    SYN(['بفهمم', 'بسنجم', 'چطور', 'چجوری', 'اندازه', 'کجا',
      'measure', 'know', 'track', 'tell', 'if'])] },
  { id: 'k.appetite', groups: [SYN(['اشتها', 'appetite'])] },
];

/* ---------------- what the screen offers ----------------

   The chips on the chat screen. They live here rather than with the chat
   because every one of them has to be a question the table above can
   answer, and here is where that can be checked without a browser -
   tools/test-ask.mjs puts all of them through match().

   The order is the order somebody thinks of them: today's numbers, then
   the body, then the things that are advice rather than data. */
/* The questions the chat offers, by topic.

   Five headings in one scrolling list was the shape before this, and two of
   the five carried twenty-odd questions each — which is a wall of text with
   signposts in it rather than something you can find your way around. Eight
   topics you tap into is the shape now: the reader picks what they are
   wondering about first and reads ten questions, not ninety-five.

   Every question here has to resolve. The reader taps one because the app
   offered it, so "I do not know that one" is the app going back on its own
   invitation — tools/test-ask.mjs asserts every single one matches, and
   that no two of them reach the same answer. That is also why the way to
   add questions is to add answers: see KNOWLEDGE above. */
export const EXAMPLE_GROUPS = [
  {
    id: 'today', fa: 'امروز', en: 'Today',
    faQ: [
      'چقدر پروتئین مانده؟',
      'چند کالری مانده؟',
      'چقدر کربوهیدرات مانده؟',
      'چقدر چربی مانده؟',
      'چقدر آب خوردم؟',
      'امروز چی خوردم؟',
      'پروتئین چی بخورم؟',
      'چه سوال‌هایی بلدی؟',
    ],
    enQ: [
      'How much protein is left?',
      'How many calories are left?',
      'How many carbs are left?',
      'How much fat is left?',
      'How much water have I had?',
      'What did I eat today?',
      'What should I eat for protein?',
      'What can you answer?',
    ],
  },
  {
    id: 'body', fa: 'بدن و پیشرفت', en: 'Body and progress',
    faQ: [
      'وزنم چنده؟',
      'چقدر وزن کم کردم؟',
      'چرا وزنم هر روز فرق می‌کند؟',
      'هر چند وقت یک بار وزن کنم؟',
      'درصد چربی بدنم را چطور بفهمم؟',
      'شاخص تودهٔ بدنی چقدر مهم است؟',
      'از کجا بفهمم پیشرفت کرده‌ام؟',
      'رکوردم چقدره؟',
      'آخرین بار پرس سینه چقدر زدم؟',
      'سطحم چنده؟',
      'زنجیره‌ام چند روزه؟',
      'مرور هفته‌ام چطور بود؟',
      'وزنم ثابت مانده، چیکار کنم؟',
    ],
    enQ: [
      'What is my weight?',
      'How much weight have I lost?',
      'Why does my weight change daily?',
      'How often should I weigh myself?',
      'How do I find my body fat percentage?',
      'How much does BMI matter?',
      'How do I know if I am making progress?',
      'What are my records?',
      'What did I last lift on bench press?',
      'What level am I?',
      'What is my streak?',
      'How was my week?',
      'My weight has stopped moving, what now?',
    ],
  },
  {
    id: 'howto', fa: 'اصول تمرین', en: 'How to train',
    faQ: [
      'چند ست بزنم؟',
      'چند تکرار بزنم؟',
      'چقدر بین ست استراحت کنم؟',
      'تا ناتوانی بزنم؟',
      'حرکات ترکیبی مهم‌ترند؟',
      'دستگاه بهتر است یا هالتر؟',
      'اضافه بار تدریجی یعنی چی؟',
      'تکنیک مهم‌تر است یا وزنه؟',
      'چطور گرم کردن کنم؟',
      'کشش کی بزنم؟',
      'دیلود لازم است؟',
    ],
    enQ: [
      'How many sets should I do?',
      'How many reps?',
      'How long should I rest?',
      'Should I train to failure?',
      'Are compound lifts more important?',
      'Machines or free weights?',
      'What is progressive overload?',
      'Does technique matter more than weight?',
      'How should I warm up?',
      'When should I stretch?',
      'Do I need a deload week?',
    ],
  },
  {
    id: 'plan', fa: 'برنامهٔ تمرین', en: 'Your programme',
    faQ: [
      'هفته‌ای چند روز باید تمرین کنم؟',
      'اسپلیت برنامهٔ من چه شکلی باشد؟',
      'هفته‌ای چند روز استراحت کنم؟',
      'صبح تمرین کنم بهتر است یا عصر؟',
      'کاردیو کنم یا نه؟',
      'تمرین خانگی بدون وسیله می‌شود؟',
      'در سفر چطور تمرین کنم؟',
      'مبتدی هستم، از کجا شروع کنم؟',
      'گیر کردم پیشرفت نمیکنم',
      'این هفته چند بار تمرین کردم؟',
      'آخرین تمرینم کی بود؟',
      'حرکت‌های سینه چیه؟',
      'کدوم عضله عقب مانده؟',
    ],
    enQ: [
      'How often should I train each week?',
      'How should I split my week?',
      'How many rest days a week should I take?',
      'Is it better to train in the morning or the evening?',
      'Should I do cardio?',
      'Can I train at home with no equipment?',
      'How do I train while travelling?',
      'I am a beginner, where do I start?',
      'My lifts have stopped going up',
      'How many workouts this week?',
      'When was my last workout?',
      'What are the chest exercises?',
      'Which muscle is behind?',
    ],
  },
  {
    id: 'eating', fa: 'تغذیه', en: 'Eating',
    faQ: [
      'روزی چقدر پروتئین لازم دارم؟',
      'روزی چقدر آب لازم دارم؟',
      'کالری نگهدارنده یعنی چی؟',
      'ماکرو یعنی چی؟',
      'صبحانه مهم است؟',
      'روزی چند وعده بخورم؟',
      'میان‌وعده بخورم؟',
      'شام دیروقت بد است؟',
      'پروتئین گیاهی از کجا بگیرم؟',
      'لبنیات بخورم یا نه؟',
      'نان و برنج را کنار بگذارم؟',
      'روزی چقدر فیبر لازم دارم؟',
      'نمک زیاد چه اثری دارد؟',
      'قند و شیرینی چقدر بد است؟',
      'کربوهیدرات شب چاق می‌کند؟',
      'بیرون غذا بخورم چیکار کنم؟',
      'وعدهٔ آزاد اشکال دارد؟',
      'فستینگ جواب می‌دهد؟',
      'قبل تمرین چی بخورم؟',
      'بعد تمرین چی بخورم؟',
      'اشتها ندارم، چطور بیشتر بخورم؟',
    ],
    enQ: [
      'How much protein do I need?',
      'How much water do I need?',
      'What is maintenance calories?',
      'What are macros?',
      'Does breakfast matter?',
      'How many meals a day?',
      'Should I eat snacks?',
      'Is a late dinner bad?',
      'Where do I get plant protein?',
      'Should I eat dairy?',
      'Should I cut out bread and rice?',
      'How much fibre do I need a day?',
      'What does too much salt do?',
      'How bad is sugar?',
      'Do carbs at night make you fat?',
      'What do I do when eating out?',
      'Is a cheat meal a problem?',
      'Does fasting work?',
      'What should I eat before training?',
      'What should I eat after training?',
      'I have no appetite, how do I eat more?',
    ],
  },
  {
    id: 'supps', fa: 'مکمل‌ها', en: 'Supplements',
    faQ: [
      'مکمل لازم دارم؟',
      'پودر پروتئین بخورم؟',
      'کراتین بخورم؟',
      'قهوه قبل تمرین خوب است؟',
      'امگا ۳ لازم است؟',
      'ویتامین D بخورم؟',
      'کم‌خونی روی تمرین اثر دارد؟',
    ],
    enQ: [
      'Do I need supplements?',
      'Should I use protein powder?',
      'Should I take creatine?',
      'Is coffee before training good?',
      'Do I need omega-3?',
      'Should I take vitamin D?',
      'Does low iron affect training?',
    ],
  },
  {
    id: 'health', fa: 'سلامت و ریکاوری', en: 'Health and recovery',
    faQ: [
      'چقدر باید بخوابم؟',
      'بدنم درد می‌کند، تمرین کنم؟',
      'گرفتگی عضله چرا پیش می‌آید؟',
      'مریضم، تمرین کنم؟',
      'زانویم درد می‌کند',
      'برای قوز کمر چه کار کنم؟',
      'کار پشت میز را چطور جبران کنم؟',
      'استرس روی تمرین اثر می‌گذارد؟',
      'در رمضان چطور تمرین کنم؟',
      'در بارداری تمرین کنم؟',
      'نوجوان می‌تواند وزنه بزند؟',
      'در سن بالا عضله می‌سازم؟',
      'خانم‌ها با وزنه حجیم می‌شوند؟',
    ],
    enQ: [
      'How much should I sleep?',
      'I am sore, should I train?',
      'Why do I get muscle cramp?',
      'I am ill, should I train?',
      'My knee hurts',
      'What can I do about slouching?',
      'How do I make up for a desk job?',
      'Does stress affect training?',
      'How do I train during Ramadan?',
      'Should I train while pregnant?',
      'Can a teenager lift weights?',
      'Can I build muscle when older?',
      'Will lifting make a woman bulky?',
    ],
  },
  {
    id: 'goals', fa: 'هدف و انگیزه', en: 'Goals and motivation',
    faQ: [
      'چطور چربی کم کنم؟',
      'چطور عضله بسازم؟',
      'اول بالک کنم یا کات؟',
      'شکم شش تکه چطور پیدا می‌شود؟',
      'لاغری موضعی ممکن است؟',
      'پیاده‌روی چقدر مفید است؟',
      'روزی چند قدم راه بروم؟',
      'انگیزه ندارم، چیکار کنم؟',
      'چطور عادت بسازم؟',
    ],
    enQ: [
      'How do I lose fat?',
      'How do I build muscle?',
      'Should I bulk or cut first?',
      'How do abs become visible?',
      'Can I spot reduce fat?',
      'How useful is walking?',
      'How many steps a day should I walk?',
      'I have no motivation, what now?',
      'How do I build the habit?',
    ],
  },
];

/* Flat, for the places that just want every question. */
export const EXAMPLES_FA = EXAMPLE_GROUPS.flatMap((g) => g.faQ);
export const EXAMPLES_EN = EXAMPLE_GROUPS.flatMap((g) => g.enQ);

/* ---------------- matching ---------------- */

/** Does any word of this group appear among the asker's words? */
function groupHit(group, asked, raw) {
  for (const syn of group) {
    if (asked.has(syn)) return syn.length;
    /* multi-word synonyms are checked against the whole line */
    if (syn.includes(' ') && raw.includes(syn)) return syn.length;
    /* A stemmed word may still carry the synonym as a prefix: «پروتئینم»
       extends «پروتئین» and is the same word with an ending on it.

       Only that direction. The reverse — the typed word being a prefix of
       the synonym — was also accepted, and it is not the same claim at all:
       a shortening is a different word. «کار», which is "what to do" and
       turns up in half the questions anyone asks, was matching «کاردیو»
       and answering every one of them with advice about cardio.

       A suffix is at most a few characters, so a typed word that is more
       than three longer than the synonym is not that synonym either. */
    for (const w of asked) {
      if (syn.length >= 3 && w.startsWith(syn) && w.length - syn.length <= 3) {
        return syn.length;
      }
    }
  }
  return 0;
}

/**
 * Which question was asked, and how sure we are.
 *
 * Every group of an intent has to be satisfied, so the score is a measure of
 * how specifically it was satisfied rather than of how much matched: an
 * intent with three groups beats one with two, and a long word beats a short
 * one. Ties go to the earlier intent, which is why the table is ordered with
 * the more specific questions first.
 */
export function match(text) {
  const list = words(text);
  const asked = new Set(list);
  const raw = normalise(text);
  if (!list.length) return null;

  let best = null;
  for (const intent of [...INTENTS, ...KNOWLEDGE]) {
    let score = 0, ok = true;
    for (const group of intent.groups) {
      const hit = groupHit(group, asked, raw);
      if (!hit) { ok = false; break; }
      score += hit;
    }
    if (!ok) continue;
    score += intent.groups.length * 4;          // specificity beats length
    if (!best || score > best.score) {
      best = { id: intent.id, score, knowledge: intent.id.startsWith('k.') };
    }
  }
  return best;
}

/* ---------------- the words that name a thing ---------------- */

/**
 * Find the longest name from a list that appears in the question.
 *
 * Longest wins because «پرس بالا سینه» must not be answered as «پرس سینه»,
 * and «ماست پرچرب» must not be answered as «ماست».
 */
export function findNamed(text, items, pickName) {
  const hay = ' ' + normalise(text) + ' ';
  let best = null;
  for (const item of items) {
    for (const name of pickName(item)) {
      if (!name) continue;
      const n = normalise(name);
      if (n.length < 3) continue;
      if (hay.includes(' ' + n + ' ') || hay.includes(' ' + n)) {
        if (!best || n.length > best.length) best = { item, length: n.length, name: n };
      }
    }
  }
  return best ? best.item : null;
}

/** Which stretch of time a question is about. Today unless it says otherwise. */
export function periodOf(text) {
  const w = new Set(words(text));
  if (w.has('امسال') || w.has('سال')) return 'year';
  if (w.has('ماه') || w.has('ماهانه')) return 'month';
  if (w.has('هفته') || w.has('هفتگی')) return 'week';
  if (w.has('دیروز')) return 'yesterday';
  return 'today';
}
