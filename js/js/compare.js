/* ============ FitYar — two products, side by side ============

   The one thing this app has that nothing else here does is a hundred and
   sixty-six Iranian branded products with their real barcodes, and until now
   they only did one job: recording what you had already eaten.

   This is the other job. You are standing in front of the fridge with two
   tubs of yoghurt and no idea which is the better one. Scan both, or look
   them up, and see them next to each other — offline, which is exactly the
   condition you are in at the back of a shop with one bar of signal.

   Two rules about what it will and will not claim:

   · Everything is shown per 100 g or 100 ml. Comparing a 200 g tub against
     a 750 g one on pack values is not a comparison, it is a trick, and it is
     how labels mislead people in every country.

   · It marks a winner only where there is one. More protein is better for
     anyone using this app, and so is more fibre. Calories are not better or
     worse on their own — they depend on what the person is trying to do —
     so the difference is shown and no verdict is given.
*/

import * as db from './db.js';
import { t, num, pick, getLang } from './i18n.js';
import { $, el, sheet, closeSheet, toast, input, round } from './ui.js';
import { FOODS, searchFoods, foodByBarcode } from './data-foods.js';
import { lineIcon } from './icons.js';

const fa = () => getLang() === 'fa';

/* Per 100 of whatever the thing is measured in. A drink is entered in
   millilitres and a solid in grams, and the table says which. */
const unitOf = (f) => (f?.liquid ? (fa() ? 'میلی‌لیتر' : 'ml') : (fa() ? 'گرم' : 'g'));

/* What the table compares, and whether more of it is better.
   `better: 0` means the difference is shown and nothing is claimed. */
const ROWS = [
  { key: 'kcal', fa: 'کالری', en: 'Calories', better: 0, digits: 0 },
  { key: 'p', fa: 'پروتئین', en: 'Protein', better: 1, digits: 1 },
  { key: 'c', fa: 'کربوهیدرات', en: 'Carbs', better: 0, digits: 1 },
  { key: 'f', fa: 'چربی', en: 'Fat', better: 0, digits: 1 },
  { key: 'fib', fa: 'فیبر', en: 'Fibre', better: 1, digits: 1 },
];

/**
 * Protein per hundred calories.
 *
 * The single number that answers "which of these is the better protein",
 * and the one a label never prints because it is rarely flattering.
 */
export const proteinPerKcal = (f) => (f?.kcal > 0 ? (f.p * 100) / f.kcal : 0);

/**
 * Which of two products wins a row, or neither.
 *
 * Returns -1, 1 or 0. A row nobody can win — calories, carbs, fat — always
 * returns 0, because whether less of them is better depends on the person
 * and this screen does not know enough to say.
 */
export function winner(row, a, b) {
  if (!row.better || !a || !b) return 0;
  const va = Number(a[row.key]) || 0;
  const vb = Number(b[row.key]) || 0;
  if (Math.abs(va - vb) < 0.05) return 0;
  return va > vb ? -1 : 1;
}

/* ---------------- the screen ---------------- */

export function openCompare(seedA = null, seedB = null) {
  let left = seedA, right = seedB;
  const host = el('div', { class: 'cmp2' });

  const draw = () => {
    host.replaceChildren(
      el('div', { class: 'cmp2-heads' }, slot(left, 'left'), slot(right, 'right')),
      left && right ? table() : hint(),
    );
  };

  const hint = () => el('div', { class: 'cmp2-hint' },
    el('p', {}, t('cmpHint')));

  /** One side: the product, or the way to choose one. */
  const slot = (f, side) => {
    if (!f) {
      return el('div', { class: 'cmp2-slot empty' },
        el('button', { class: 'btn ghost full', onclick: () => choose(side) },
          lineIcon('search', { size: 16 }), t('cmpPick')),
        el('button', { class: 'btn ghost full', style: 'margin-top:8px',
          onclick: () => byCode(side) },
        lineIcon('tag', { size: 16 }), t('cmpByCode')));
    }
    return el('div', { class: 'cmp2-slot' },
      el('b', {}, pick(f)),
      f.brand ? el('span', { class: 'brand-tag' }, f.brand) : null,
      el('span', { class: 'cmp2-per' }, `${fa() ? 'هر ۱۰۰' : 'per 100'} ${unitOf(f)}`),
      el('button', { class: 'cmp2-clear', 'aria-label': t('delete'),
        onclick: () => { if (side === 'left') left = null; else right = null; draw(); } }, '✕'));
  };

  /** The comparison itself, per hundred, with a verdict only where earned. */
  const table = () => {
    const rows = ROWS.map((r) => {
      const w = winner(r, left, right);
      const cell = (f, side) => el('div', {
        class: 'cmp2-cell' + ((w === -1 && side === 'left') || (w === 1 && side === 'right') ? ' win' : ''),
      }, num(round(Number(f[r.key]) || 0, r.digits), r.digits));
      return el('div', { class: 'cmp2-row' },
        cell(left, 'left'),
        el('span', { class: 'cmp2-label' }, fa() ? r.fa : r.en),
        cell(right, 'right'));
    });

    /* the headline: protein for the calories, which no label prints */
    const pa = proteinPerKcal(left), pb = proteinPerKcal(right);
    const best = Math.abs(pa - pb) < 0.1 ? 0 : (pa > pb ? -1 : 1);
    rows.push(el('div', { class: 'cmp2-row ratio' },
      el('div', { class: 'cmp2-cell' + (best === -1 ? ' win' : '') }, num(round(pa, 1), 1)),
      el('span', { class: 'cmp2-label' }, t('cmpPerKcal')),
      el('div', { class: 'cmp2-cell' + (best === 1 ? ' win' : '') }, num(round(pb, 1), 1))));

    const verdict = best === 0
      ? t('cmpSame')
      : (fa() ? `${pick(best === -1 ? left : right)} پروتئین بیشتری به ازای هر کالری دارد.`
        : `${pick(best === -1 ? left : right)} gives more protein per calorie.`);

    return el('div', {},
      el('div', { class: 'cmp2-table' }, ...rows),
      el('div', { class: 'cmp2-verdict' }, verdict),
      el('div', { class: 'ask-note' }, t('cmpNote')));
  };

  /* ---- choosing a product ---- */

  function choose(side) {
    const q = input({ placeholder: t('searchFood'), autocomplete: 'off' });
    const list = el('div', { class: 'list' });
    const run = () => {
      const res = searchFoods(q.value.trim(), FOODS, 'all').slice(0, 24);
      list.replaceChildren(...res.map((f) => el('button', {
        class: 'li', onclick: () => {
          if (side === 'left') left = f; else right = f;
          closeSheet();
          sheet(t('cmpTitle'), host);
          draw();
        },
      },
        el('div', { class: 'li-main' },
          el('b', {}, pick(f), f.brand ? el('span', { class: 'brand-tag' }, f.brand) : null),
          el('span', {}, `${num(f.kcal)} ${t('kcal')} · P${num(round(f.p, 1), 1)} · ${fa() ? 'هر ۱۰۰' : 'per 100'} ${unitOf(f)}`)))));
    };
    q.addEventListener('input', run);
    run();
    sheet(t('cmpPick'), el('div', {}, q, list));
  }

  /* Typed rather than scanned. barcode.js's camera is bound to logging a
     meal, and BarcodeDetector only exists on Chrome for Android — so the
     digits are typed and resolved against the products that ship with the
     app, offline, which is the same lookup the camera would have fed. */
  function byCode(side) {
    const q = input({ inputmode: 'numeric', placeholder: '6260...' , autocomplete: 'off' });
    const out = el('div', { class: 'cmp2-hint' });
    const go = () => {
      const code = q.value.replace(/\D/g, '');
      if (code.length < 8) { out.replaceChildren(el('p', {}, t('cmpCodeShort'))); return; }
      const f = foodByBarcode(code);
      if (!f) { out.replaceChildren(el('p', {}, t('cmpNotFound'))); return; }
      if (side === 'left') left = f; else right = f;
      closeSheet();
      sheet(t('cmpTitle'), host);
      draw();
    };
    q.addEventListener('keydown', (e) => { if (e.key === 'Enter') go(); });
    sheet(t('cmpByCode'), el('div', {},
      q,
      el('button', { class: 'btn full', style: 'margin-top:10px', onclick: go }, t('search')),
      out));
  }

  draw();
  sheet(t('cmpTitle'), host);
}
