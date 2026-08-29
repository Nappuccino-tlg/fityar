/* ============ Nutrition: diary, food picker, AI photo scan ============ */
import * as db from './db.js';
import { S, MEAL_KEYS, MEAL_ICON, workoutKcal, aiConfig, hasAI } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, loading, field, input, select,
  segmented, round, sum, parseNum, todayKey, dateKey, addDays, dateLabel, shortDate, buzz,
} from './ui.js';
import { FOODS, FOOD_CATS, FOOD_INDEX, searchFoods } from './data-foods.js';
import { statusOf, STATUS_COLOR, closeDay, reportSheet, getReport } from './report.js';
import { emptyArt } from './art.js';
import { RECIPES, PARTS } from './data-recipes.js';
import * as ai from './ai.js';

/* ---------------- data helpers ---------------- */

export async function logsFor(date) {
  return db.byIndex('foodLogs', 'date', date);
}

export function totals(logs) {
  return {
    kcal: Math.round(sum(logs, x => x.kcal)),
    protein: round(sum(logs, x => x.protein), 1),
    carbs: round(sum(logs, x => x.carbs), 1),
    fat: round(sum(logs, x => x.fat), 1),
    fiber: round(sum(logs, x => x.fiber), 1),
  };
}

export async function burnedOn(date) {
  const ws = await db.byIndex('workouts', 'date', date);
  return Math.round(sum(ws, w => w.kcal || workoutKcal(w)));
}

export async function daySummary(date) {
  const logs = await logsFor(date);
  const tt = totals(logs);
  tt.burned = await burnedOn(date);
  tt.logs = logs;
  return tt;
}

export async function addLog(entry) {
  const rec = {
    id: db.uid('fl_'),
    date: entry.date || S.date,
    meal: entry.meal || 'snack',
    name: entry.name || '',
    nameFa: entry.nameFa || entry.name || '',
    grams: round(entry.grams || 0, 1),
    unitLabel: entry.unitLabel || null,
    kcal: Math.round(entry.kcal || 0),
    protein: round(entry.protein || 0, 1),
    carbs: round(entry.carbs || 0, 1),
    fat: round(entry.fat || 0, 1),
    fiber: round(entry.fiber || 0, 1),
    foodId: entry.foodId || null,
    liquid: !!entry.liquid,
    photoId: entry.photoId || null,
    source: entry.source || 'db',
    createdAt: Date.now(),
  };
  await db.put('foodLogs', rec);
  return rec;
}

export async function deleteLog(id) {
  const rec = await db.get('foodLogs', id);
  await db.del('foodLogs', id);
  if (rec?.photoId) {
    const others = (await db.all('foodLogs')).filter(l => l.photoId === rec.photoId);
    if (!others.length) await db.del('photos', rec.photoId);
  }
}

/** ml for drinks, g for everything else. Drives every label and input. */
export const isLiquid = (food) =>
  food?.liquid !== undefined ? !!food.liquid : food?.cat === 'drink';
export const unitOf = (food) => (isLiquid(food) ? t('mlUnit') : t('gram'));

/** Scale a per-100 g food record to a gram amount. */
export function scaleFood(food, grams) {
  const k = grams / 100;
  return {
    kcal: food.kcal * k, protein: food.p * k, carbs: food.c * k,
    fat: food.f * k, fiber: (food.fib || 0) * k,
  };
}

async function allFoods() {
  const custom = await db.all('foods');
  return [...custom, ...FOODS];
}

/** Foods logged recently, most used first. */
async function recentFoods(limit = 24) {
  const logs = await db.all('foodLogs');
  logs.sort((a, b) => b.createdAt - a.createdAt);
  const seen = new Map();
  for (const l of logs) {
    const key = l.foodId || l.name;
    if (!seen.has(key)) seen.set(key, l);
    if (seen.size >= limit) break;
  }
  return [...seen.values()];
}

/* ---------------- diary screen ---------------- */

export async function renderDiary() {
  const date = S.date;
  $('#d-label').textContent = dateLabel(date);
  const { logs, kcal, protein, carbs, fat } = await daySummary(date);

  $('#dsum-kcal').textContent = num(kcal);
  $('#dsum-p').textContent = num(protein, protein % 1 ? 1 : 0) + 'g';
  $('#dsum-c').textContent = num(carbs, carbs % 1 ? 1 : 0) + 'g';
  $('#dsum-f').textContent = num(fat, fat % 1 ? 1 : 0) + 'g';

  const host = $('#diary-meals');
  host.replaceChildren();

  for (const mk of MEAL_KEYS) {
    const items = logs.filter(l => l.meal === mk);
    const mkcal = Math.round(sum(items, x => x.kcal));
    const box = el('div', { class: 'meal', dataset: { meal: mk } },
      el('div', { class: 'meal-head' },
        el('div', { class: 'mi' }, MEAL_ICON[mk]),
        el('b', {}, t(mk)),
        el('span', { class: 'kc' }, `${num(mkcal)} ${t('kcal')}`),
      ),
    );
    if (items.length) {
      const list = el('div', { class: 'meal-items' });
      for (const it of items) list.append(foodRow(it));
      box.append(list);
    }
    const foot = el('div', { class: 'meal-foot' },
      el('button', { class: 'meal-add', onclick: () => openAddMenu(mk) }, '+ ' + t('addFood')));
    if (items.length) {
      foot.append(el('button', { class: 'meal-save', onclick: async () => {
        const m = await import('./meals.js'); m.saveMealFromDay(date, mk);
      } }, '⭐ ' + t('saveMeal')));
    }
    box.append(foot);
    host.append(box);
  }

  /* quick actions: repeat yesterday, copy any day */
  const quick = $('#diary-quick');
  quick.replaceChildren();
  const yest = addDays(date, -1);
  const yestLogs = await logsFor(yest);
  if (yestLogs.length) {
    quick.append(el('button', { class: 'btn ghost sm', onclick: async () => {
      const m = await import('./meals.js'); await m.copyDay(yest, date);
    } }, '⧉ ' + t('repeatYesterday')));
  }
  quick.append(el('button', { class: 'btn ghost sm', onclick: async () => {
    const m = await import('./meals.js'); m.openCopyDay();
  } }, t('repeatDay')));
  quick.append(el('button', { class: 'btn ghost sm', onclick: async () => {
    const m = await import('./meals.js'); m.openSavedMeals();
  } }, '⭐ ' + t('savedMeals')));

  /* closed-day banner / close button */
  const rep = await getReport(date);
  const cta = $('#diary-close');
  cta.replaceChildren();
  if (rep) {
    const c = STATUS_COLOR[rep.dayStatus];
    cta.append(el('button', { class: 'closed-banner', style: `--cc:${c}`, onclick: () => reportSheet(rep) },
      el('span', { class: 'cb-ico' }, rep.dayStatus === 'over' ? '⚠️' : rep.dayStatus === 'under' ? '🟡' : '✅'),
      el('span', { class: 'cb-txt' },
        el('b', {}, t('dayClosed')),
        el('span', {}, `${num(rep.kcal)} / ${num(rep.goals.kcal)} ${t('kcal')} — ${t('dayReport')}`)),
      el('span', { class: 'cb-arrow' }, '›')));
  } else if (logs.length) {
    cta.append(el('button', { class: 'btn ghost full close-day-btn', onclick: () => closeDayFlow(date) },
      '🌙 ' + t('closeDay')));
  }

  const noteEl = $('#day-note');
  const rec = await db.get('notes', date);
  noteEl.value = rec?.text || '';
}

function foodRow(it) {
  const row = el('div', { class: 'mrow' },
    el('div', { class: 't' },
      el('b', {}, pick(it)),
      el('span', {}, `${num(round(it.grams))}${it.liquid ? t('mlUnit') : 'g'} · ${t('protein')} ${num(round(it.protein))} · ${t('carbs')} ${num(round(it.carbs))} · ${t('fat')} ${num(round(it.fat))}`),
    ),
    el('div', { class: 'k' }, num(Math.round(it.kcal))),
  );
  row.onclick = () => openEditLog(it);
  return row;
}

async function openEditLog(it) {
  const gEl = input({ type: 'number', inputmode: 'decimal', value: round(it.grams, 1), step: '1' });
  const per = it.grams ? { kcal: it.kcal / it.grams, p: it.protein / it.grams, c: it.carbs / it.grams, f: it.fat / it.grams, fib: it.fiber / it.grams } : null;
  const prev = el('div', { class: 'info' });
  const mealSel = select(MEAL_KEYS.map(m => ({ value: m, label: t(m) })), it.meal);

  const refresh = () => {
    const g = parseNum(gEl.value);
    if (!per) { prev.textContent = ''; return; }
    prev.textContent = `${num(Math.round(per.kcal * g))} ${t('kcal')} · ${t('protein')} ${num(round(per.p * g, 1), 1)}g · ${t('carbs')} ${num(round(per.c * g, 1), 1)}g · ${t('fat')} ${num(round(per.f * g, 1), 1)}g`;
  };
  gEl.oninput = refresh; refresh();

  const body = el('div', {},
    field(`${t('amount')} (${it.liquid ? t('mlUnit') : t('gram')})`, gEl),
    field(t('addTo'), mealSel),
    prev,
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn danger ghost', onclick: async () => {
        closeSheet();
        if (await confirmSheet(t('confirmDelete'), pick(it))) {
          await deleteLog(it.id); toast(t('deleted')); refreshAll();
        }
      } }, t('delete')),
      el('button', { class: 'btn', onclick: async () => {
        const g = parseNum(gEl.value);
        if (per && g > 0) Object.assign(it, {
          grams: round(g, 1), kcal: Math.round(per.kcal * g),
          protein: round(per.p * g, 1), carbs: round(per.c * g, 1),
          fat: round(per.f * g, 1), fiber: round(per.fib * g, 1),
        });
        it.meal = mealSel.value;
        await db.put('foodLogs', it);
        closeSheet(); toast(t('saved'), 'ok'); refreshAll();
      } }, t('save')),
    ),
  );
  sheet(pick(it), body);
}

/* ---------------- add menu ---------------- */

export function openAddMenu(meal = 'snack') {
  const mk = (icon, label, sub, fn) => el('button', { class: 'row-btn', onclick: () => { closeSheet(); fn(); } },
    el('span', { class: 'mi', style: 'width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:var(--card2);font-size:17px' }, icon),
    el('span', { style: 'display:flex;flex-direction:column;gap:2px' },
      el('b', { style: 'font-size:14.5px;font-weight:600' }, label),
      el('span', { class: 'muted', style: 'font-size:11.5px' }, sub)),
  );
  const body = el('div', {},
    mk('📷', t('scanMeal'), getLang() === 'fa' ? 'عکس بگیرید، هوش مصنوعی کالری را تخمین می‌زند' : 'Snap a photo, AI estimates the calories', () => openPhotoScan(meal)),
    mk('🔍', t('searchFood'), getLang() === 'fa' ? 'از پایگاه داده غذاها' : 'From the food database', () => openFoodPicker(meal)),
    mk('✏️', t('createFood'), getLang() === 'fa' ? 'ساخت غذای دلخواه با مقادیر خودتان' : 'Your own food with your numbers', () => openCreateFood(meal)),
    mk('💬', getLang() === 'fa' ? 'توصیف با متن' : 'Describe in words', getLang() === 'fa' ? 'مثلاً «دو تخم‌مرغ نیمرو با نان»' : 'e.g. “two fried eggs with bread”', () => openTextEstimate(meal)),
    mk('🏷️', t('scanBarcode'), getLang() === 'fa' ? 'یک بار یاد بگیرد، همیشه بشناسد' : 'Teach it once, it remembers', async () => {
      const bc = await import('./barcode.js'); bc.openScanner(meal);
    }),
    mk('⭐', t('savedMeals'), getLang() === 'fa' ? 'وعده‌های همیشگی‌ات با یک ضربه' : 'Your usual combos in one tap', async () => {
      const m = await import('./meals.js'); m.openSavedMeals(meal);
    }),
    mk('🖐️', t('portionGuide'), t('portionGuideSub'), async () => {
      const m = await import('./meals.js'); m.openPortionGuide();
    }),
  );
  sheet(t('addTo') + ' · ' + t(meal), body);
}

/* ---------------- food picker ---------------- */

export async function openFoodPicker(meal = 'snack') {
  const q = input({ placeholder: t('search'), autocomplete: 'off' });
  const chips = el('div', { class: 'chips' });
  const list = el('div', { class: 'list' });
  let cat = 'all';
  const pool = await allFoods();
  const recents = await recentFoods();

  FOOD_CATS.forEach(c => {
    const b = el('button', { class: 'chip' + (c.id === cat ? ' on' : ''), onclick: () => {
      cat = c.id;
      [...chips.children].forEach(x => x.classList.remove('on'));
      b.classList.add('on'); draw();
    } }, pick(c));
    chips.append(b);
  });

  function draw() {
    const term = q.value.trim();
    list.replaceChildren();

    if (!term && cat === 'all' && recents.length) {
      list.append(el('div', { class: 'muted', style: 'margin:2px 2px 4px' }, t('recent')));
      recents.slice(0, 8).forEach(r => list.append(recentRow(r)));
      list.append(el('hr', { class: 'sep' }));
    }
    const res = searchFoods(term, pool, cat);
    if (!res.length) {
      list.append(el('div', { class: 'empty' }, t('empty')));
      return;
    }
    res.forEach(f => list.append(el('div', { class: 'li', onclick: () => openPortion(f, meal) },
      el('div', { class: 'li-main' },
        el('b', {}, pick(f)),
        el('span', {}, `${num(f.kcal)} ${t('kcal')} / 100${unitOf(f)} · P${num(round(f.p))} C${num(round(f.c))} F${num(round(f.f))}`)),
      el('div', { class: 'li-end' }, el('b', {}, '+')),
    )));
  }

  function recentRow(r) {
    return el('div', { class: 'li', onclick: async () => {
      await addLog({ ...r, id: undefined, date: S.date, meal, createdAt: undefined });
      closeSheet(); toast(t('done'), 'ok'); buzz(); refreshAll();
    } },
      el('div', { class: 'li-main' },
        el('b', {}, pick(r)),
        el('span', {}, `${num(round(r.grams))}g · ${num(Math.round(r.kcal))} ${t('kcal')}`)),
      el('div', { class: 'li-end' }, el('b', {}, '+')),
    );
  }

  q.oninput = draw;
  draw();
  sheet(t('searchFood'), el('div', {}, q, el('div', { style: 'height:10px' }), chips, list));
  setTimeout(() => q.focus(), 120);
}

/** Portion chooser for a database food. */
function openPortion(food, meal) {
  const liq = isLiquid(food);
  const unit = unitOf(food);
  const presets = [[`100 ${unit}`, 100], ...(food.servings || [])];
  const amt = input({ type: 'number', inputmode: 'decimal', value: presets[0][1], step: '1' });
  const out = el('div', { class: 'info' });

  const refresh = () => {
    const g = parseNum(amt.value);
    const m = scaleFood(food, g);
    out.replaceChildren(
      el('div', { style: 'font-size:19px;font-weight:700;color:var(--tx);margin-bottom:6px' },
        `${num(Math.round(m.kcal))} ${t('kcal')}`),
      el('div', {}, `${t('protein')} ${num(round(m.protein, 1), 1)}g · ${t('carbs')} ${num(round(m.carbs, 1), 1)}g · ${t('fat')} ${num(round(m.fat, 1), 1)}g · ${t('fiber')} ${num(round(m.fiber, 1), 1)}g`),
    );
  };
  amt.oninput = refresh;

  const quick = el('div', { class: 'chips' });
  presets.forEach(([label, g]) => quick.append(el('button', { class: 'chip', onclick: () => { amt.value = g; refresh(); } }, label)));
  (liq ? [100, 200, 250, 330, 500] : [50, 150, 200, 250, 300])
    .forEach(g => quick.append(el('button', { class: 'chip', onclick: () => { amt.value = g; refresh(); } },
      `${num(g)} ${unit}`)));

  const mealSel = select(MEAL_KEYS.map(m => ({ value: m, label: t(m) })), meal);
  refresh();

  const body = el('div', {},
    recipeBlock(food, mealSel),
    field(`${t('amount')} (${unit})${liq ? ' · ' + t('cc') : ''}`, amt),
    quick, out,
    field(t('addTo'), mealSel),
    el('button', { class: 'btn full', onclick: async () => {
      const g = parseNum(amt.value);
      if (g <= 0) return toast(t('error'), 'err');
      const m = scaleFood(food, g);
      await addLog({
        date: S.date, meal: mealSel.value, name: food.name, nameFa: food.nameFa,
        grams: g, foodId: food.id, liquid: liq,
        source: food.builtin ? 'db' : 'custom', ...m,
      });
      closeSheet(); toast(t('done'), 'ok'); buzz(); refreshAll();
    } }, t('add')),
  );
  sheet(pick(food), body);
}

/** Component breakdown for a composite dish, with the option to log the parts. */
function recipeBlock(food, mealSel) {
  const rec = RECIPES[food.id];
  if (!rec) return null;

  const resolve = (item) => {
    if (item.food) {
      const f = FOOD_INDEX[item.food];
      return f ? { name: pick(f), src: f, g: item.g } : null;
    }
    const pt = PARTS[item.part];
    return pt ? { name: getLang() === 'fa' ? pt.fa : pt.en, src: pt, g: item.g } : null;
  };
  const rows = rec.parts.map(resolve).filter(Boolean);
  if (!rows.length) return null;

  const kcalOf = (r) => Math.round(r.src.kcal * r.g / 100);
  const total = rows.reduce((s, r) => s + kcalOf(r), 0);

  return el('details', { class: 'recipe-block' },
    el('summary', {},
      el('b', {}, '🧾 ' + t('recipeOf')),
      el('span', {}, `${num(rows.length)} ${getLang() === 'fa' ? 'جزء' : 'parts'} · ${num(total)} ${t('kcal')}`)),
    el('div', { class: 'recipe-body' },
      el('div', { class: 'muted', style: 'font-size:11.5px;line-height:1.8;margin-bottom:10px' },
        t('derivedNote')),
      ...rows.map(r => el('div', { class: 'recipe-row' },
        el('span', {}, r.name),
        el('i', {}, `${num(r.g)}g`),
        el('b', {}, num(kcalOf(r))))),
      el('button', { class: 'btn ghost full', style: 'margin-top:12px', onclick: async () => {
        for (const r of rows) {
          if (!r.src.kcal && !r.src.p && !r.src.c && !r.src.f) continue;   // water etc.
          const k = r.g / 100;
          await addLog({
            date: S.date, meal: mealSel.value,
            name: r.src.en || r.name, nameFa: r.src.fa || r.name, grams: r.g,
            kcal: r.src.kcal * k, protein: r.src.p * k, carbs: r.src.c * k,
            fat: r.src.f * k, fiber: (r.src.fib || 0) * k,
            foodId: r.src.id || null, source: 'recipe',
          });
        }
        closeSheet(); toast(t('partsAdded'), 'ok'); buzz(); refreshAll();
      } }, t('logParts')),
      el('div', { class: 'muted', style: 'font-size:11px;margin-top:8px;line-height:1.7' },
        t('logPartsHint'))),
  );
}

/* ---------------- create custom food ---------------- */

export function openCreateFood(meal = null, existing = null) {
  const f = existing || {};
  const nEn = input({ value: f.name || '', placeholder: 'Chicken shawarma' });
  const nFa = input({ value: f.nameFa || '', placeholder: 'شاورما مرغ' });
  const kc = input({ type: 'number', inputmode: 'decimal', value: f.kcal ?? '', placeholder: '0' });
  const pr = input({ type: 'number', inputmode: 'decimal', value: f.p ?? '', placeholder: '0' });
  const cb = input({ type: 'number', inputmode: 'decimal', value: f.c ?? '', placeholder: '0' });
  const ft = input({ type: 'number', inputmode: 'decimal', value: f.f ?? '', placeholder: '0' });
  const fb = input({ type: 'number', inputmode: 'decimal', value: f.fib ?? '', placeholder: '0' });
  const catSel = select(FOOD_CATS.filter(c => c.id !== 'all').map(c => ({ value: c.id, label: pick(c) })), f.cat || 'iranian');

  /* Drinks are measured by volume, not weight — the whole form has to follow. */
  let liquid = f.liquid ?? (f.cat === 'drink');
  const perLabel = el('div', { class: 'info' });
  const stateSeg = segmented(
    [{ value: 'solid', label: '🍽️ ' + t('solid') }, { value: 'liquid', label: '🥤 ' + t('liquid') }],
    liquid ? 'liquid' : 'solid',
    (v) => {
      liquid = v === 'liquid';
      perLabel.textContent = liquid ? t('per100ml') : t('per100');
      if (liquid && catSel.value !== 'drink') catSel.value = 'drink';
    });
  perLabel.textContent = liquid ? t('per100ml') : t('per100');

  const body = el('div', {},
    el('div', { class: 'field' }, el('label', {}, t('foodState')), stateSeg),
    perLabel,
    field(t('name') + ' (EN)', nEn),
    field(t('name') + ' (فا)', nFa),
    el('div', { class: 'grid2' },
      field(t('kcal'), kc),
      field(t('protein') + ' (g)', pr)),
    el('div', { class: 'grid2' },
      field(t('carbs') + ' (g)', cb),
      field(t('fat') + ' (g)', ft)),
    el('div', { class: 'grid2' },
      field(t('fiber') + ' (g)', fb),
      field('—', catSel)),
    el('button', { class: 'btn full', onclick: async () => {
      const name = nEn.value.trim() || nFa.value.trim();
      if (!name) return toast(t('error'), 'err');
      const rec = {
        id: f.id || db.uid('cf_'),
        name, nameFa: nFa.value.trim() || name,
        cat: catSel.value,
        kcal: parseNum(kc.value), p: parseNum(pr.value), c: parseNum(cb.value),
        f: parseNum(ft.value), fib: parseNum(fb.value),
        liquid,                                  // measured in ml rather than g
        servings: f.servings || [[liquid ? '۱ لیوان / glass' : '۱ پرس / portion', liquid ? 250 : 100]],
        builtin: false,
      };
      await db.put('foods', rec);
      closeSheet(); toast(t('saved'), 'ok');
      if (meal) openPortion(rec, meal); else refreshAll();
    } }, t('save')),
  );
  sheet(existing ? t('edit') : t('createFood'), body);
}

/* ---------------- describe-in-words estimate ---------------- */

export function openTextEstimate(meal = 'snack') {
  if (!hasAI()) return needKey();
  const box = el('textarea', { class: 'input', rows: 3, placeholder: t('describePh') });
  const mealSel = select(MEAL_KEYS.map(m => ({ value: m, label: t(m) })), meal);
  const body = el('div', {},
    field(t('describeMore'), box),
    field(t('addTo'), mealSel),
    el('button', { class: 'btn full', onclick: async () => {
      const text = box.value.trim();
      if (!text) return;
      const m = mealSel.value;
      closeSheet(); loading(true, t('analyzing'));
      try {
        const r = await ai.estimateFoodText(aiConfig(), { text });
        loading(false);
        showAIResults({ dish: r.name, items: [{ ...r, confidence: 'medium' }], notes: '' }, m, null);
      } catch (e) {
        loading(false); toast(ai.aiErrorText(e), 'err');
      }
    } }, t('add')),
  );
  sheet(t('describeMore'), body);
}

function needKey() {
  const body = el('div', {},
    el('div', { class: 'warn' }, t('noKey')),
    el('button', { class: 'btn full', onclick: () => { closeSheet(); window.dispatchEvent(new CustomEvent('open-ai-settings')); } }, t('aiSettings')),
  );
  sheet(t('aiSettings'), body);
}

/* ---------------- AI photo scan ---------------- */

let pendingMeal = 'snack';

export function openPhotoScan(meal = 'snack') {
  if (!hasAI()) return needKey();
  pendingMeal = meal;
  const inp = $('#file-photo');
  inp.value = '';
  inp.click();
}

/** Wired once from app.js */
export function initPhotoInput() {
  $('#file-photo').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await handlePhoto(file, pendingMeal);
  });
}

async function handlePhoto(file, meal, hint = '') {
  loading(true, t('analyzing'));
  try {
    const small = await ai.shrinkImage(file, 1024, 0.85);
    const b64 = await ai.blobToBase64(small);
    const res = await ai.analyzeMeal(aiConfig(), { imageB64: b64, mime: 'image/jpeg', hint });
    loading(false);
    if (!res.items.length) {
      toast(res.notes || t('error'), 'err');
      return;
    }
    buzz(40);
    showAIResults(res, meal, small, file);
  } catch (err) {
    loading(false);
    toast(ai.aiErrorText(err), 'err');
  }
}

function confChip(c) {
  const label = { high: getLang() === 'fa' ? 'مطمئن' : 'confident',
                  medium: getLang() === 'fa' ? 'تقریبی' : 'estimate',
                  low: getLang() === 'fa' ? 'نامطمئن' : 'unsure' }[c] || c;
  return el('span', { class: 'conf ' + (c === 'high' ? 'high' : c === 'low' ? 'low' : '') }, label);
}

function showAIResults(res, meal, blob, originalFile = null) {
  const rows = res.items.map(it => ({ ...it, on: true }));
  const mealSel = select(MEAL_KEYS.map(m => ({ value: m, label: t(m) })), meal);
  const list = el('div', {});
  const totalEl = el('div', { class: 'live-wrap' });
  const isLast = { on: false };

  /* the day's running total before this meal, so the ring can show the projection */
  let dayBase = { kcal: 0, protein: 0, carbs: 0, fat: 0 };
  daySummary(S.date).then(d => { dayBase = d; recompute(); });

  const recompute = () => {
    const act = rows.filter(r => r.on);
    const k = Math.round(sum(act, r => r.kcal));
    const p = round(sum(act, r => r.protein), 1);
    const c = round(sum(act, r => r.carbs), 1);
    const f = round(sum(act, r => r.fat), 1);
    const goal = S.goals.kcal || 2000;
    const projected = Math.round((dayBase.kcal || 0) + k);
    const st = statusOf(projected, goal);
    const col = projected > goal ? 'var(--red)' : STATUS_COLOR[st];
    const ratio = Math.min(1, projected / goal);
    const C = 2 * Math.PI * 46;

    totalEl.replaceChildren(
      el('div', { class: 'live-ring', style: `--lc:${col}` },
        el('div', { class: 'live-svg', html:
          `<svg viewBox="0 0 110 110">
             <circle cx="55" cy="55" r="46" fill="none" stroke="var(--card2)" stroke-width="9"/>
             <circle cx="55" cy="55" r="46" fill="none" stroke="${col}" stroke-width="9"
                     stroke-linecap="round" transform="rotate(-90 55 55)"
                     stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - ratio)}"
                     style="transition:stroke-dashoffset .55s cubic-bezier(.4,0,.2,1),stroke .3s"/>
           </svg>` }),
        el('div', { class: 'live-center' },
          el('b', { style: `color:${col}` }, num(projected)),
          el('span', {}, `/ ${num(goal)}`))),
      el('div', { class: 'live-side' },
        el('div', { class: 'live-add' }, `+${num(k)} ${t('kcal')}`),
        el('div', { class: 'muted', style: 'font-size:11.5px' }, t('projected')),
        el('div', { class: 'live-macros' },
          el('span', { style: 'color:var(--blue)' }, `P ${num(p, p % 1 ? 1 : 0)}`),
          el('span', { style: 'color:var(--orange)' }, `C ${num(c, c % 1 ? 1 : 0)}`),
          el('span', { style: 'color:var(--pink)' }, `F ${num(f, f % 1 ? 1 : 0)}`)),
        projected > goal
          ? el('div', { class: 'live-warn' }, `⚠️ ${num(projected - goal)} ${t('overBy')}`)
          : null),
    );
  };

  rows.forEach((r, i) => {
    const gEl = input({ type: 'number', inputmode: 'decimal', value: r.grams, step: '5',
      style: 'padding:7px;font-size:13px;text-align:center' });
    const per = r.grams ? { k: r.kcal / r.grams, p: r.protein / r.grams, c: r.carbs / r.grams, f: r.fat / r.grams, fb: r.fiber / r.grams } : null;
    const macEl = el('div', { class: 'mac' });
    const drawMac = () => macEl.replaceChildren(
      el('span', {}, `${num(Math.round(r.kcal))} ${t('kcal')}`),
      el('span', {}, `P ${num(round(r.protein, 1), 1)}`),
      el('span', {}, `C ${num(round(r.carbs, 1), 1)}`),
      el('span', {}, `F ${num(round(r.fat, 1), 1)}`),
    );
    gEl.oninput = () => {
      const g = parseNum(gEl.value);
      if (per) {
        r.grams = g; r.kcal = per.k * g; r.protein = per.p * g;
        r.carbs = per.c * g; r.fat = per.f * g; r.fiber = per.fb * g;
      }
      drawMac(); recompute();
    };
    const chk = el('input', { type: 'checkbox', checked: true, style: 'width:19px;height:19px;accent-color:var(--acc)' });
    chk.onchange = () => { r.on = chk.checked; card.style.opacity = chk.checked ? '1' : '.45'; recompute(); };
    drawMac();
    const card = el('div', { class: 'ai-item' },
      el('div', { class: 'top' }, chk, el('b', {}, pick(r)), confChip(r.confidence),
        /* say so when the app overruled the model's own calorie figure */
        r.adjusted ? el('span', { class: 'conf low', title: t('kcalFixedWhy') }, t('kcalFixed')) : null),
      el('div', { style: 'display:flex;align-items:center;gap:9px' },
        el('div', { style: 'width:74px' }, gEl),
        el('span', { class: 'muted', style: 'font-size:11.5px' }, t('gram')),
        el('div', { style: 'flex:1' }, macEl)),
    );
    list.append(card);
  });
  recompute();

  const hintBox = el('textarea', { class: 'input', rows: 2, placeholder: t('describePh') });

  const body = el('div', {});
  if (blob) {
    const img = el('img', { class: 'photo-preview', src: URL.createObjectURL(blob) });
    body.append(img);
  }
  if (res.dish) body.append(el('h3', { style: 'text-align:center;margin-bottom:4px' }, res.dish));
  body.append(totalEl, list);
  if (res.notes) body.append(el('div', { class: 'info' }, res.notes));
  body.append(
    field(t('addTo'), mealSel),
    el('details', { style: 'margin-bottom:12px' },
      el('summary', { class: 'muted', style: 'cursor:pointer;padding:6px 0' }, t('reanalyze')),
      el('div', { style: 'padding-top:8px' }, hintBox,
        el('button', { class: 'btn ghost full', style: 'margin-top:8px', onclick: async () => {
          const h = hintBox.value.trim();
          if (!h || !originalFile) return;
          closeSheet();
          await handlePhoto(originalFile, mealSel.value, h);
        } }, t('reanalyze')))),
    lastMealToggle(isLast),
    el('button', { class: 'btn full', onclick: async () => {
      const act = rows.filter(r => r.on);
      if (!act.length) return closeSheet();
      let photoId = null;
      if (blob && S.settings.keepPhotos) {
        photoId = db.uid('ph_');
        await db.put('photos', { id: photoId, blob, at: Date.now() });
      }
      for (const r of act) {
        await addLog({
          date: S.date, meal: mealSel.value,
          name: r.name, nameFa: r.nameFa, grams: r.grams,
          kcal: r.kcal, protein: r.protein, carbs: r.carbs, fat: r.fat, fiber: r.fiber,
          source: 'ai', photoId,
        });
      }
      closeSheet(); buzz(); refreshAll();
      if (isLast.on) {
        const rep = await closeDay(S.date);
        toast(`✅ ${t('dayClosed')}`, 'ok');
        refreshAll();
        setTimeout(() => reportSheet(rep), 260);
      } else {
        toast(t('done'), 'ok');
      }
    } }, t('addAll')),
    el('div', { class: 'muted', style: 'text-align:center;font-size:11.5px;margin-top:12px;line-height:1.7' }, t('disclaimer')),
  );
  sheet(t('aiResult'), body);
}

/** “This was my last meal today” switch shown under a logged photo. */
function lastMealToggle(state) {
  const box = el('button', { class: 'last-meal', onclick: () => {
    state.on = !state.on;
    box.classList.toggle('on', state.on);
    dot.textContent = state.on ? '✓' : '';
    buzz(15);
  } },
    el('span', { class: 'lm-ico' }, '🌙'),
    el('span', { class: 'lm-txt' },
      el('b', {}, t('lastMeal')),
      el('span', {}, getLang() === 'fa'
        ? 'روز بسته می‌شود و گزارش کامل ساخته می‌شود'
        : 'Closes the day and builds the full report')),
  );
  const dot = el('span', { class: 'lm-dot' });
  box.append(dot);
  return box;
}

/** Close the current day from anywhere (diary button, home card). */
export async function closeDayFlow(date = S.date) {
  const existing = await getReport(date);
  if (existing) { reportSheet(existing); return; }
  const rep = await closeDay(date);
  toast(`✅ ${t('dayClosed')}`, 'ok');
  refreshAll();
  setTimeout(() => reportSheet(rep), 200);
}

/* ---------------- my foods manager ---------------- */

export async function openMyFoods() {
  const foods = await db.all('foods');
  const list = el('div', { class: 'list' });
  if (!foods.length) list.append(el('div', { class: 'empty' }, t('empty')));
  foods.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
  foods.forEach(f => list.append(el('div', { class: 'li' },
    el('div', { class: 'li-main', onclick: () => { closeSheet(); openCreateFood(null, f); } },
      el('b', {}, pick(f)),
      el('span', {}, `${num(f.kcal)} ${t('kcal')} / 100${t('gram')}`)),
    el('button', { class: 'swipe-del', onclick: async (e) => {
      e.stopPropagation();
      await db.del('foods', f.id); toast(t('deleted')); closeSheet(); openMyFoods();
    } }, t('delete')),
  )));
  sheet(t('myFoods'), el('div', {},
    el('button', { class: 'btn full', style: 'margin-bottom:14px', onclick: () => { closeSheet(); openCreateFood(); } }, '+ ' + t('createFood')),
    list));
}

/* ---------------- water ---------------- */

export async function getWater(date) {
  const r = await db.get('water', date);
  return r?.ml || 0;
}
export async function addWater(date, delta) {
  const cur = await getWater(date);
  const ml = Math.max(0, cur + delta);
  await db.put('water', { date, ml });
  return ml;
}

/* ---------------- refresh hook ---------------- */
let refreshFn = () => {};
export const setRefresh = (fn) => { refreshFn = fn; };
export const refreshAll = () => refreshFn();
