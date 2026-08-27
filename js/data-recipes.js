/* ============ Iranian dishes, broken down into what is actually in them ============
   A composite dish has no single "true" calorie figure — it depends entirely on
   the ratio of its parts. So instead of guessing one number per dish, each dish
   is described by its components, and its per-100 g values are DERIVED from them.
   Every component is either a USDA-referenced food from data-foods.js, or an
   inline entry with its own reference values.

   `g` is the cooked weight of that component in one standard portion.
   Values below are per 100 g of the component.
=================================================================================== */

/** Components that are not in the main food table. */
export const PARTS = {
  koobideh:    { fa: 'گوشت کوبیده (پخته)', en: 'Koobideh meat, grilled',
                 kcal: 228, p: 21.5, c: 2.2, f: 15.0, fib: 0.3 },   // 85% beef 80/20 + 15% onion
  lamb_stew:   { fa: 'گوشت خورشتی (پخته)', en: 'Stewing lamb, cooked',
                 kcal: 258, p: 25, c: 0, f: 17, fib: 0 },
  tomato_paste:{ fa: 'رب گوجه', en: 'Tomato paste',
                 kcal: 82, p: 4.3, c: 18.9, f: 0.5, fib: 4.1 },     // USDA
  pom_paste:   { fa: 'رب انار', en: 'Pomegranate molasses',
                 kcal: 268, p: 0.4, c: 66, f: 0.2, fib: 0.5 },
  split_peas:  { fa: 'لپه پخته', en: 'Split peas, cooked',
                 kcal: 118, p: 8.3, c: 21.1, f: 0.4, fib: 8.3 },    // USDA
  noodles:     { fa: 'رشته آش (خشک)', en: 'Ash noodles, dry',
                 kcal: 371, p: 13, c: 75, f: 1.5, fib: 3.2 },
  fried_onion: { fa: 'پیاز داغ', en: 'Fried onion',
                 kcal: 340, p: 2.0, c: 16, f: 30, fib: 2.0 },
  fried_potato:{ fa: 'سیب‌زمینی سرخ‌شده', en: 'Fried potato',
                 kcal: 274, p: 3.4, c: 36, f: 13, fib: 3.2 },
  fried_egpl:  { fa: 'بادمجان سرخ‌شده', en: 'Fried aubergine',
                 kcal: 210, p: 1.0, c: 7.5, f: 19.5, fib: 3.0 },    // absorbs a lot of oil
  wheat_cooked:{ fa: 'گندم پخته', en: 'Cracked wheat, cooked',
                 kcal: 124, p: 4.4, c: 26, f: 0.4, fib: 4.5 },
  saffron_rice:{ fa: 'ته‌دیگ / برنج زعفرانی', en: 'Saffron rice',
                 kcal: 150, p: 2.7, c: 29, f: 2.6, fib: 0.4 },
  flour:       { fa: 'آرد گندم', en: 'Wheat flour',
                 kcal: 364, p: 10.3, c: 76, f: 1.0, fib: 2.7 },     // USDA
  sugar:       { fa: 'شکر', en: 'Sugar', kcal: 387, p: 0, c: 100, f: 0, fib: 0 },
  barberry:    { fa: 'زرشک', en: 'Barberries', kcal: 265, p: 3, c: 64, f: 0.5, fib: 8 },
  broad_beans: { fa: 'باقالی پخته', en: 'Broad beans, cooked',
                 kcal: 110, p: 7.6, c: 19.6, f: 0.4, fib: 5.4 },
  dill:        { fa: 'شوید', en: 'Dill', kcal: 43, p: 3.5, c: 7, f: 1.1, fib: 2.1 },
  walnut:      { fa: 'گردو', en: 'Walnuts', kcal: 654, p: 15, c: 14, f: 65, fib: 6.7 },
  rice_pudding:{ fa: 'برنج نیم‌کوب پخته', en: 'Broken rice, cooked',
                 kcal: 130, p: 2.4, c: 28, f: 0.3, fib: 0.4 },
};

/**
 * One standard portion of each dish, as its parts.
 * `food:` points at an id in data-foods.js; `part:` points at PARTS above.
 * Rice is listed explicitly wherever the dish is normally served with it, so
 * "with rice" and "stew only" are never silently confused.
 */
export const RECIPES = {
  ir_chelo_kabab: {
    withRice: true,
    parts: [
      { food: 'g_rice_white', g: 300 },
      { part: 'koobideh',     g: 180 },      // two skewers
      { food: 'd_butter',     g: 10 },
      { food: 'v_tomato',     g: 100 },      // grilled tomato
    ],
  },
  ir_joojeh: {
    parts: [
      { food: 'p_chicken_th', g: 170 },      // thigh, the usual cut
      { food: 'o_sun',        g: 8 },        // marinade oil
      { food: 'd_butter',     g: 5 },
      { food: 'v_onion',      g: 20 },
    ],
  },
  ir_ghormeh: {
    parts: [
      { part: 'lamb_stew',  g: 80 },
      { food: 'v_herbs',    g: 70 },         // sabzi, fried down
      { food: 'p_kidney_bean', g: 60 },
      { food: 'o_sun',      g: 12 },
      { food: 'v_onion',    g: 35 },
    ],
  },
  ir_gheymeh: {
    parts: [
      { part: 'lamb_stew',   g: 70 },
      { part: 'split_peas',  g: 70 },
      { part: 'tomato_paste', g: 25 },
      { food: 'o_sun',       g: 12 },
      { food: 'v_onion',     g: 35 },
      { part: 'fried_potato', g: 45 },       // the fries on top
    ],
  },
  ir_fesenjan: {
    parts: [
      { part: 'walnut',       g: 55 },
      { part: 'pom_paste',    g: 35 },
      { food: 'p_chicken_th', g: 90 },
      { part: 'sugar',        g: 8 },
      { food: 'v_onion',      g: 25 },
      { food: 'dr_water',     g: 90 },       // it cooks down to a loose stew
    ],
  },
  ir_ghelyeh: {                              // باقالی پلو
    withRice: true,
    parts: [
      { food: 'g_rice_white', g: 260 },
      { part: 'broad_beans',  g: 60 },
      { part: 'dill',         g: 15 },
      { food: 'd_butter',     g: 12 },
      { part: 'lamb_stew',    g: 60 },
    ],
  },
  ir_zereshk: {                              // زرشک پلو با مرغ
    withRice: true,
    parts: [
      { food: 'g_rice_white', g: 280 },
      { part: 'barberry',     g: 15 },
      { food: 'd_butter',     g: 12 },
      { part: 'sugar',        g: 6 },
      { food: 'p_chicken_th', g: 110 },
    ],
  },
  ir_adasi: {
    parts: [
      { food: 'p_lentil',    g: 180 },
      { part: 'fried_onion', g: 15 },
      { part: 'tomato_paste', g: 12 },
      { food: 'o_sun',       g: 5 },
      { food: 'dr_water',    g: 60 },
    ],
  },
  ir_ash: {                                  // آش رشته
    parts: [
      { part: 'noodles',      g: 30 },       // dry weight
      { food: 'p_kidney_bean', g: 45 },
      { food: 'p_chickpea',   g: 40 },
      { food: 'p_lentil',     g: 40 },
      { food: 'v_herbs',      g: 70 },
      { food: 'd_kashk',      g: 25 },
      { part: 'fried_onion',  g: 15 },
      { food: 'dr_water',     g: 120 },
    ],
  },
  ir_abgoosht: {
    parts: [
      { part: 'lamb_stew',    g: 95 },
      { food: 'p_chickpea',   g: 60 },
      { food: 'p_white_bean', g: 50 },
      { food: 'g_potato',     g: 90 },
      { part: 'tomato_paste', g: 20 },
      { food: 'v_onion',      g: 40 },
      { food: 'dr_water',     g: 120 },
    ],
  },
  ir_kotlet: {
    parts: [
      { part: 'koobideh',    g: 45 },        // meat + onion base
      { food: 'g_potato',    g: 35 },
      { food: 'p_egg',       g: 12 },
      { food: 'o_sun',       g: 10 },        // shallow-fried
      { part: 'flour',       g: 5 },
    ],
  },
  ir_kookoo: {
    parts: [
      { food: 'v_herbs',  g: 55 },
      { food: 'p_egg',    g: 45 },
      { food: 'o_sun',    g: 14 },
      { part: 'walnut',   g: 6 },
      { part: 'flour',    g: 4 },
    ],
  },
  ir_mirza: {
    parts: [
      { part: 'fried_egpl', g: 110 },
      { food: 'v_tomato',   g: 60 },
      { food: 'p_egg',      g: 30 },
      { food: 'o_sun',      g: 8 },
      { food: 'v_garlic',   g: 6 },
    ],
  },
  ir_kashk: {                                // کشک بادمجان
    parts: [
      { part: 'fried_egpl',  g: 120 },
      { food: 'd_kashk',     g: 35 },
      { part: 'fried_onion', g: 20 },
      { part: 'walnut',      g: 10 },
      { food: 'o_sun',       g: 6 },
    ],
  },
  ir_tahchin: {
    withRice: true,
    parts: [
      { part: 'saffron_rice', g: 180 },
      { food: 'd_yogurt',     g: 55 },
      { food: 'p_egg',        g: 30 },
      { food: 'd_butter',     g: 18 },
      { food: 'p_chicken_br', g: 60 },
    ],
  },
  ir_haleem: {
    parts: [
      { part: 'wheat_cooked', g: 190 },
      { food: 'p_turkey',     g: 45 },       // stands in for shredded lean meat
      { food: 'd_butter',     g: 12 },
      { part: 'sugar',        g: 6 },
      { food: 'dr_water',     g: 60 },
    ],
  },
  ir_salad_shir: {
    parts: [
      { food: 'v_cucumber', g: 70 },
      { food: 'v_tomato',   g: 55 },
      { food: 'v_onion',    g: 15 },
      { food: 'o_olive',    g: 4 },
    ],
  },
  ir_mast_khiar: {
    parts: [
      { food: 'd_yogurt',   g: 120 },
      { food: 'v_cucumber', g: 45 },
      { part: 'walnut',     g: 6 },
    ],
  },
  ir_halva: {
    parts: [
      { part: 'flour',  g: 40 },
      { part: 'sugar',  g: 30 },
      { food: 'd_butter', g: 28 },           // traditionally roghan
      { food: 'dr_water', g: 20 },
    ],
  },
  ir_sholezard: {
    parts: [
      { part: 'rice_pudding', g: 110 },
      { part: 'sugar',        g: 30 },
      { food: 'd_butter',     g: 5 },
      { food: 'dr_water',     g: 55 },
    ],
  },
};

/** Breads are single-ingredient and stay as direct reference values. */
export const NO_RECIPE = ['ir_sangak', 'ir_barbari', 'ir_lavash', 'ir_taftoon'];
