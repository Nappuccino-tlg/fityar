/* ============ Saved meals, day copying, portion guide ============
   Everything here works with no AI key at all — it is the fast path
   for food you eat again and again.
================================================================== */
import * as db from './db.js';
import { mealIcon } from './icons.js';
import { S, MEAL_KEYS } from './store.js';
import { t, num, pick, getLang, countLabel } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, sum, todayKey, addDays, dateLabel, longDate, buzz,
} from './ui.js';
import { logsFor, addLog, refreshAll } from './nutrition.js';
import { emptyArt } from './art.js';

/* ---------------- saved meals ---------------- */

export async function allSavedMeals() {
  const ms = await db.all('savedMeals');
  ms.sort((a, b) => (b.usedAt || b.createdAt || 0) - (a.usedAt || a.createdAt || 0));
  return ms;
}

/** Turn the logged items of one meal slot into a reusable combo. */
export async function saveMealFromDay(date, mealKey) {
  const logs = (await logsFor(date)).filter(l => l.meal === mealKey);
  if (!logs.length) { toast(t('empty'), 'err'); return; }

  const nameIn = input({
    value: `${t(mealKey)} — ${longDate(date)}`.slice(0, 40),
    placeholder: getLang() === 'fa' ? 'صبحانه‌ی همیشگی من' : 'My usual breakfast',
  });
  const kcal = Math.round(sum(logs, l => l.kcal));

  sheet(t('saveMeal'), el('div', {},
    el('div', { class: 'info' },
      el('div', { class: 'kv' }, el('span', {}, t('itemsCount')), el('b', {}, num(logs.length))),
      el('div', { class: 'kv' }, el('span', {}, t('kcal')), el('b', {}, num(kcal))),
      el('div', { style: 'margin-top:8px;font-size:var(--t-sm)' },
        logs.map(l => pick(l)).join('، '))),
    field(t('mealName'), nameIn),
    el('button', { class: 'btn full', onclick: async () => {
      const name = nameIn.value.trim();
      if (!name) return toast(t('error'), 'err');
      await db.put('savedMeals', {
        id: db.uid('sm_'), name, meal: mealKey,
        items: logs.map(l => ({
          name: l.name, nameFa: l.nameFa, grams: l.grams, foodId: l.foodId,
          kcal: l.kcal, protein: l.protein, carbs: l.carbs, fat: l.fat, fiber: l.fiber,
        })),
        kcal, createdAt: Date.now(), usedAt: Date.now(),
      });
      closeSheet(); toast(t('saved'), 'ok'); buzz();
    } }, t('save')),
  ));
}

/** Log every item of a saved combo into the current day. */
export async function applySavedMeal(sm, mealKey = null) {
  for (const it of sm.items) {
    await addLog({ ...it, date: S.date, meal: mealKey || sm.meal || 'snack', source: 'saved' });
  }
  sm.usedAt = Date.now();
  await db.put('savedMeals', sm);
  toast(`${t('done')} · ${countLabel(sm.items.length, 'item')}`, 'ok');
  buzz();
  refreshAll();
}

export async function openSavedMeals(mealKey = null) {
  const ms = await allSavedMeals();
  const body = el('div', {});

  if (!ms.length) {
    body.append(emptyArt('plate', t('noSavedMeals'), t('savedMealHint'), 'var(--orange)'));
  } else {
    const list = el('div', { class: 'list' });
    ms.forEach(sm => list.append(el('div', { class: 'li saved-meal' },
      el('div', { class: 'li-main', onclick: () => { closeSheet(); applySavedMeal(sm, mealKey); } },
        el('b', { class: 'meal-name' }, mealIcon(sm.meal, { size: 15 }), el('em', {}, sm.name)),
        el('span', {}, `${countLabel(sm.items.length, 'item')} · ${num(sm.kcal)} ${t('kcal')}`)),
      el('button', { class: 'swipe-del', onclick: async (e) => {
        e.stopPropagation();
        await db.del('savedMeals', sm.id);
        closeSheet(); toast(t('deleted')); openSavedMeals(mealKey);
      } }, t('delete')),
    )));
    body.append(list);
  }
  sheet(t('savedMeals'), body);
}

/* ---------------- copy a whole day ---------------- */

/** Copy every food entry of `from` into `to`. */
export async function copyDay(from, to = S.date) {
  const logs = await logsFor(from);
  if (!logs.length) { toast(t('empty'), 'err'); return 0; }
  for (const l of logs) {
    await addLog({
      date: to, meal: l.meal, name: l.name, nameFa: l.nameFa, grams: l.grams,
      kcal: l.kcal, protein: l.protein, carbs: l.carbs, fat: l.fat, fiber: l.fiber,
      foodId: l.foodId, source: 'copy',
    });
  }
  toast(`${t('copied')} · ${countLabel(logs.length, 'item')}`, 'ok');
  buzz();
  refreshAll();
  return logs.length;
}

/** Offer the last seven days that actually have entries. */
export async function openCopyDay() {
  const body = el('div', {});
  const list = el('div', { class: 'list' });
  let found = 0;
  for (let i = 1; i <= 10 && found < 7; i++) {
    const d = addDays(S.date, -i);
    const logs = await logsFor(d);
    if (!logs.length) continue;
    found++;
    const kcal = Math.round(sum(logs, l => l.kcal));
    list.append(el('div', { class: 'li', onclick: async () => { closeSheet(); await copyDay(d); } },
      el('div', { class: 'li-main' },
        el('b', {}, dateLabel(d)),
        el('span', {}, `${countLabel(logs.length, 'item')} · ${num(kcal)} ${t('kcal')}`)),
      el('div', { class: 'li-end' }, el('b', {}, '⧉'))));
  }
  if (!found) body.append(emptyArt('empty', t('empty'), '', 'var(--tx3)'));
  else body.append(list);
  sheet(t('pickDayToCopy'), body);
}

/* ---------------- portion guide ---------------- */

const HAND = [
  { icon: '🖐️', g: 100, en: 'Palm (no fingers)', fa: 'کف دست (بدون انگشت)',
    enEx: 'cooked meat, chicken, fish', faEx: 'گوشت، مرغ یا ماهی پخته' },
  { icon: '✊', g: 150, en: 'Closed fist', fa: 'مشت بسته',
    enEx: 'cooked rice or pasta — about one cup', faEx: 'برنج یا ماکارونی پخته — حدود یک پیمانه' },
  { icon: '🤲', g: 80, en: 'Cupped hand', fa: 'کف دست گود',
    enEx: 'nuts, dried fruit, cereal', faEx: 'آجیل، میوه خشک، کورن‌فلکس' },
  { icon: '👍', g: 15, en: 'Thumb', fa: 'شست',
    enEx: 'oil, butter, peanut butter, cheese', faEx: 'روغن، کره، کره بادام‌زمینی، پنیر' },
  { icon: '☝️', g: 5, en: 'Fingertip', fa: 'نوک انگشت',
    enEx: 'one teaspoon of oil or sugar', faEx: 'یک قاشق چای‌خوری روغن یا شکر' },
];

const IRANIAN = [
  { fa: 'یک پرس چلوکباب', en: 'One serving chelo kabab', g: 400, kcal: 820 },
  { fa: 'یک کاسه خورش با برنج', en: 'One bowl stew with rice', g: 350, kcal: 560 },
  { fa: 'یک برش نان سنگک', en: 'One piece sangak bread', g: 80, kcal: 200 },
  { fa: 'یک برگ نان لواش', en: 'One sheet lavash', g: 45, kcal: 124 },
  { fa: 'یک لیوان دوغ', en: 'One glass doogh', g: 250, kcal: 85 },
  { fa: 'یک کاسه ماست', en: 'One bowl yogurt', g: 170, kcal: 104 },
  { fa: 'یک عدد تخم‌مرغ', en: 'One egg', g: 50, kcal: 72 },
  { fa: 'یک سیخ جوجه', en: 'One chicken skewer', g: 200, kcal: 330 },
  { fa: 'یک کاسه آش', en: 'One bowl ash', g: 300, kcal: 294 },
];

export function openPortionGuide() {
  const fa = getLang() === 'fa';
  const body = el('div', {},
    el('div', { class: 'info' }, t('portionGuideSub')),
    el('div', { class: 'hand-grid' },
      ...HAND.map(h => el('div', { class: 'hand' },
        el('span', { class: 'hand-ico' }, h.icon),
        el('b', {}, fa ? h.fa : h.en),
        el('span', { class: 'hand-g' }, `≈ ${num(h.g)} ${t('gram')}`),
        el('span', { class: 'hand-ex' }, fa ? h.faEx : h.enEx)))),
    el('hr', { class: 'sep' }),
    el('div', { class: 'card-head' }, el('h3', {}, fa ? 'پرس‌های رایج ایرانی' : 'Common Iranian portions')),
    ...IRANIAN.map(x => el('div', { class: 'kv' },
      el('span', {}, fa ? x.fa : x.en),
      el('b', {}, `${num(x.g)}g · ${num(x.kcal)} ${t('kcal')}`))),
    el('div', { class: 'muted', style: 'font-size:var(--t-sm);margin-top:14px;line-height:1.8' },
      fa ? 'این‌ها تخمین‌اند. اگر ترازو داری، یک هفته وزن کن تا چشمت عادت کند — بعد دیگر لازم نیست.'
         : 'These are estimates. If you own a scale, weigh for a week to train your eye — after that you can stop.'),
  );
  sheet(t('portionGuide'), body);
}
