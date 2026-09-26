/* ============ "What you need per day" — the numbers, and where they come from ============ */
import { S, bmr, tdee, ACTIVITY_FACTOR, GOAL_ADJUST, kgToDisp, wUnit,
         proteinBasisKg, fiberGoal, bmi } from './store.js';
import { t, num, getLang } from './i18n.js';
import { metricIcon } from './icons.js';
import { el, round } from './ui.js';
import { ART } from './art.js';

/** Per-kilogram figures behind each macro target, so the number is explainable. */
export function breakdown(p = S.profile, g = S.goals) {
  const kg = p.weight || 75;
  const maint = tdee(p);
  const adj = GOAL_ADJUST[p.goal] ?? 0;
  return {
    kg,
    bmr: Math.round(bmr(p)),
    tdee: Math.round(maint),
    factor: ACTIVITY_FACTOR[p.activity] || 1.55,
    adjustPct: Math.round(adj * 100),
    kcal: g.kcal,
    kcalDelta: Math.round(g.kcal - maint),
    protein: g.protein,
    proteinPerKg: round(g.protein / kg, 2),
    proteinBasis: round(proteinBasisKg(p), 1),
    proteinPerBasisKg: round(g.protein / proteinBasisKg(p), 2),
    leanScaled: proteinBasisKg(p) < p.weight - 0.05,
    carbs: g.carbs,     carbsPerKg: round(g.carbs / kg, 2),
    fat: g.fat,         fatPerKg: round(g.fat / kg, 2),
    water: g.water,     waterPerKg: Math.round(g.water / kg),
    fiber: fiberGoal(g.kcal),
    /* how the calories split across the macros */
    split: (() => {
      const pk = g.protein * 4, ck = g.carbs * 4, fk = g.fat * 9;
      const tot = Math.max(1, pk + ck + fk);
      return { p: Math.round(pk / tot * 100), c: Math.round(ck / tot * 100), f: Math.round(fk / tot * 100) };
    })(),
  };
}

const MACROS = [
  { key: 'protein', color: 'var(--blue)',   unit: 'g' },
  { key: 'carbs',   color: 'var(--orange)', unit: 'g' },
  { key: 'fat',     color: 'var(--pink)',   unit: 'g' },
  { key: 'fiber',   color: 'var(--purple)', unit: 'g' },
];

/**
 * The headline card: how much of everything you need in a day,
 * with one plain sentence explaining each figure.
 */
/**
 * What the day asks for, and why.
 *
 * `quiet` keeps every number and folds the reasoning behind a question mark
 * — "2.0 g per kg of bodyweight" is worth reading once and worth not
 * reading the other hundred times you open the home screen. Nothing is
 * deleted; one tap brings all of it back.
 */
export function targetsCard({ compact = false, quiet = false } = {}) {
  const fa = getLang() === 'fa';
  const b = breakdown();
  const wu = wUnit();
  const wDisp = round(kgToDisp(b.kg), 1);

  const why = {
    kcal: fa
      ? `کالری نگهدارنده‌ات ${num(b.tdee)} است. برای «${t(S.profile.goal)}» ${b.adjustPct === 0 ? 'همان مقدار' : (b.adjustPct > 0 ? `${num(Math.abs(b.adjustPct))}٪ بیشتر` : `${num(Math.abs(b.adjustPct))}٪ کمتر`)} در نظر گرفته شده.`
      : `Your maintenance is ${num(b.tdee)} kcal. For “${t(S.profile.goal)}” that is adjusted by ${b.adjustPct}%.`,
    protein: b.leanScaled
      ? (fa
          ? `${num(b.proteinPerBasisKg, 1)} گرم به ازای هر کیلوگرم وزن مرجع (${num(round(kgToDisp(b.proteinBasis), 1), 1)} ${wu}) — چون بالای BMI ۲۷ پروتئین بر پایه‌ی توده‌ی بدون چربی حساب می‌شود.`
          : `${num(b.proteinPerBasisKg, 1)} g per kg of reference weight (${num(round(kgToDisp(b.proteinBasis), 1), 1)} ${wu}) — above BMI 27 protein is scaled to lean mass.`)
      : (fa
          ? `${num(b.proteinPerKg, 1)} گرم به ازای هر کیلوگرم وزن بدن (${num(wDisp, 1)} ${wu}).`
          : `${num(b.proteinPerKg, 1)} g per kg of bodyweight (${num(wDisp, 1)} ${wu}).`),
    carbs: fa
      ? `باقی‌مانده‌ی کالری بعد از پروتئین و چربی — سوخت تمرین.`
      : `Whatever calories are left after protein and fat — your training fuel.`,
    fat: fa
      ? `${num(b.fatPerKg, 1)} گرم به ازای هر کیلوگرم — حداقل لازم برای هورمون‌ها.`
      : `${num(b.fatPerKg, 1)} g per kg — the floor your hormones need.`,
    fiber: fa
      ? `۱۴ گرم به ازای هر ۱۰۰۰ کالری — مقدار مرجع تغذیه‌ای.`
      : `14 g per 1000 kcal — the dietary reference intake.`,
    water: fa
      ? `${num(b.waterPerKg)} میلی‌لیتر به ازای هر کیلوگرم وزن بدن.`
      : `${num(b.waterPerKg)} ml per kg of bodyweight.`,
  };

  const card = el('div', { class: 'card targets-card' + (quiet ? ' tc-quiet' : '') });
  const art = ART.target();
  art.classList.add('tc-art');
  card.append(art);

  const head = el('div', { class: 'card-head' },
    el('h3', {}, fa ? 'نیاز روزانه‌ی تو' : 'What you need per day'),
    el('span', { class: 'chip on', style: 'font-size:var(--t-xs)' }, t(S.profile.goal)));
  if (quiet) {
    head.append(el('button', {
      class: 'tc-why-btn', 'aria-label': t('whyThis'), title: t('whyThis'),
      onclick: () => {
        const open = card.classList.toggle('tc-open');
        card.querySelector('.tc-why-btn').setAttribute('aria-expanded', String(open));
      },
    }, '؟'));
  }
  card.append(head);

  /* calories headline */
  card.append(el('div', { class: 'tc-hero' },
    el('div', { class: 'tc-kcal' },
      el('b', {}, num(b.kcal)),
      el('span', {}, t('kcal'))),
    el('div', { class: 'tc-why' },
      el('div', { class: 'tc-chain' },
        chainStep(t('bmr'), num(b.bmr)),
        el('span', { class: 'tc-op' }, '×'),
        chainStep(t('activity'), num(b.factor, 2)),
        el('span', { class: 'tc-op' }, b.adjustPct >= 0 ? '+' : '−'),
        chainStep(t('goalType'), num(Math.abs(b.adjustPct)) + '٪'.replace('٪', fa ? '٪' : '%'))),
      el('p', {}, why.kcal))));

  /* macro rows — protein, carbs, fat with their share of the day */
  const list = el('div', { class: 'tc-list' });
  MACROS.slice(0, 3).forEach(m => {
    const value = b[m.key];
    const pct = b.split[m.key[0]];
    list.append(el('div', { class: 'tc-row', style: `--tcc:${m.color}` },
      el('span', { class: 'tc-ico', style: `color:${m.color}` },
        metricIcon(m.key, { size: 19, cls: 'ic-lift' })),
      el('div', { class: 'tc-mid' },
        el('b', {}, t(m.key)),
        el('span', {}, why[m.key])),
      el('div', { class: 'tc-val' },
        el('b', {}, num(value) + m.unit),
        pct !== null && pct !== undefined ? el('span', {}, num(pct) + (fa ? '٪' : '%')) : null)));
  });
  /* fiber + water as one compact secondary row — full rows were noise:
     they are floors and glasses, not macros competing for calories */
  list.append(el('div', { class: 'tc-mini' },
    el('div', { class: 'tc-mini-cell', style: '--tcc:var(--purple)' },
      el('span', { class: 'tc-ico', style: 'color:var(--purple)' },
        metricIcon('fiber', { size: 16, cls: 'ic-lift' })),
      el('div', { class: 'tc-mini-mid' }, el('b', {}, t('fiber')), el('span', {}, why.fiber)),
      el('b', { class: 'tc-mini-val' }, num(b.fiber) + 'g')),
    el('div', { class: 'tc-mini-cell', style: '--tcc:var(--blue)' },
      el('span', { class: 'tc-ico', style: 'color:var(--blue)' },
        metricIcon('water', { size: 16, cls: 'ic-lift' })),
      el('div', { class: 'tc-mini-mid' }, el('b', {}, t('water')), el('span', {}, why.water)),
      el('b', { class: 'tc-mini-val' }, num(b.water) + ' ml'))));
  card.append(list);

  if (!compact) {
    /* the macros should add up to the calorie goal — say so and prove it */
    const pK = b.protein * 4, cK = b.carbs * 4, fK = b.fat * 9;
    const sumK = pK + cK + fK;
    const ok = Math.abs(sumK - b.kcal) <= b.kcal * 0.05;
    card.append(el('div', { class: 'tc-bar' },
      el('i', { style: `flex:${b.split.p};background:var(--blue)` }),
      el('i', { style: `flex:${b.split.c};background:var(--orange)` }),
      el('i', { style: `flex:${b.split.f};background:var(--pink)` })));
    card.append(el('div', { class: 'muted', style: 'font-size:var(--t-sm);text-align:center;margin-top:8px' },
      ok
        ? (fa ? `جمع ماکروها: ${num(sumK)} کالری از هدف ${num(b.kcal)} — هماهنگ ✓`
              : `Macros add up to ${num(sumK)} of ${num(b.kcal)} kcal — consistent ✓`)
        : (fa ? `جمع ماکروها ${num(sumK)} کالری — با هدف ${num(b.kcal)} هماهنگ نیست`
              : `Macros total ${num(sumK)} kcal — off the ${num(b.kcal)} kcal goal`)));
  }
  return card;
}

function chainStep(label, value) {
  return el('span', { class: 'tc-step' }, el('b', {}, value), el('i', {}, label));
}

/** One-line version for tight spaces. */
export function targetsStrip() {
  const b = breakdown();
  return el('div', { class: 'tc-strip' },
    pill('kcal', num(b.kcal), t('kcal'), 'var(--acc)'),
    pill('protein', num(b.protein) + 'g', t('protein'), 'var(--blue)'),
    pill('carbs', num(b.carbs) + 'g', t('carbs'), 'var(--orange)'),
    pill('fat', num(b.fat) + 'g', t('fat'), 'var(--pink)'),
  );
}
function pill(key, value, label, color) {
  return el('div', { class: 'tcp', style: `--pc:${color}` },
    el('span', { class: 'tcp-ic' }, metricIcon(key, { size: 15, cls: 'ic-lift' })),
    el('b', {}, value), el('i', {}, label));
}
