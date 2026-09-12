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
  chicken_stew:{ fa: 'مرغ خورشتی (پخته)', en: 'Stewing chicken, cooked',
                 kcal: 209, p: 26, c: 0, f: 10.9, fib: 0 },
  mince_beef:  { fa: 'گوشت چرخ‌کرده (پخته)', en: 'Minced beef, cooked',
                 kcal: 250, p: 26, c: 0, f: 16, fib: 0 },
  fish_white:  { fa: 'ماهی سفید (پخته)', en: 'White fish, cooked',
                 kcal: 105, p: 23, c: 0, f: 1, fib: 0 },
  prawn:       { fa: 'میگو (پخته)', en: 'Prawns, cooked',
                 kcal: 99, p: 24, c: 0.2, f: 0.3, fib: 0 },
  liver_lamb:  { fa: 'جگر (پخته)', en: 'Liver, cooked',
                 kcal: 175, p: 26, c: 5, f: 5, fib: 0 },
  tamarind:    { fa: 'تمر هندی', en: 'Tamarind paste',
                 kcal: 239, p: 2.8, c: 62.5, f: 0.6, fib: 5.1 },
  coriander_fr:{ fa: 'سبزی قلیه (سرخ‌شده)', en: 'Fried coriander & fenugreek',
                 kcal: 196, p: 3.0, c: 6.0, f: 18.0, fib: 3.2 },
  kashk_liq:   { fa: 'کشک مایع', en: 'Liquid kashk',
                 kcal: 160, p: 14, c: 12, f: 6, fib: 0 },
  whey_dough:  { fa: 'دوغ / آب‌کشک', en: 'Whey / thin doogh',
                 kcal: 34, p: 1.8, c: 2.6, f: 1.7, fib: 0 },
  bread_crumb: { fa: 'نان خشک‌شده', en: 'Dried bread',
                 kcal: 395, p: 13, c: 72, f: 5, fib: 4.5 },
  chickpea_fl: { fa: 'آرد نخودچی', en: 'Chickpea flour',
                 kcal: 387, p: 22, c: 58, f: 6.7, fib: 10.8 },
  quince:      { fa: 'به', en: 'Quince', kcal: 57, p: 0.4, c: 15.3, f: 0.1, fib: 1.9 },
  plum_dried:  { fa: 'آلوی خشک', en: 'Dried plum',
                 kcal: 240, p: 2.2, c: 64, f: 0.4, fib: 7.1 },
  celery_fr:   { fa: 'کرفس سرخ‌شده', en: 'Fried celery',
                 kcal: 118, p: 1.0, c: 4.0, f: 11.0, fib: 1.8 },
  green_bean_c:{ fa: 'لوبیا سبز پخته', en: 'Green beans, cooked',
                 kcal: 35, p: 1.9, c: 7.9, f: 0.3, fib: 3.0 },
  okra_cooked: { fa: 'بامیه پخته', en: 'Okra, cooked',
                 kcal: 33, p: 1.9, c: 7.5, f: 0.2, fib: 3.2 },
  cabbage_c:   { fa: 'کلم پخته', en: 'Cabbage, cooked',
                 kcal: 25, p: 1.3, c: 5.8, f: 0.1, fib: 2.5 },
  vermicelli:  { fa: 'رشته پلویی', en: 'Rice vermicelli, dry',
                 kcal: 371, p: 13, c: 75, f: 1.5, fib: 3.2 },
  lentil_ckd:  { fa: 'عدس پخته', en: 'Lentils, cooked',
                 kcal: 116, p: 9, c: 20, f: 0.4, fib: 7.9 },
  yogurt_full: { fa: 'ماست پرچرب', en: 'Full-fat yogurt',
                 kcal: 88, p: 3.3, c: 4.5, f: 6, fib: 0 },
  egg_cooked:  { fa: 'تخم‌مرغ (پخته)', en: 'Egg, cooked',
                 kcal: 143, p: 12.6, c: 0.7, f: 9.5, fib: 0 },
  turmeric_oil:{ fa: 'روغن مایع', en: 'Vegetable oil',
                 kcal: 884, p: 0, c: 0, f: 100, fib: 0 },
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
  /* --- added after the first twenty: the dishes people log most --- */
  ir_bademjan: {
    parts: [
      { part: 'lamb_stew',    g: 75 },
      { part: 'fried_egpl',   g: 110 },
      { part: 'tomato_paste', g: 22 },
      { food: 'v_onion',      g: 35 },
      { part: 'turmeric_oil', g: 8 },
    ],
  },
  ir_karafs: {
    parts: [
      { part: 'lamb_stew',  g: 75 },
      { part: 'celery_fr',  g: 120 },
      { food: 'v_herbs',    g: 35 },
      { part: 'turmeric_oil', g: 6 },
      { food: 'v_onion',    g: 30 },
    ],
  },
  ir_loobia_sabz: {
    parts: [
      { part: 'mince_beef',   g: 70 },
      { part: 'green_bean_c', g: 130 },
      { part: 'tomato_paste', g: 20 },
      { food: 'v_onion',      g: 30 },
      { part: 'turmeric_oil', g: 10 },
    ],
  },
  ir_bamieh_kh: {
    parts: [
      { part: 'lamb_stew',    g: 70 },
      { part: 'okra_cooked',  g: 130 },
      { part: 'tomato_paste', g: 22 },
      { food: 'v_onion',      g: 28 },
      { part: 'turmeric_oil', g: 8 },
    ],
  },
  ir_beh: {
    parts: [
      { part: 'lamb_stew',  g: 70 },
      { part: 'quince',     g: 120 },
      { part: 'split_peas', g: 35 },
      { part: 'sugar',      g: 10 },
      { part: 'turmeric_oil', g: 8 },
      { food: 'v_onion',    g: 28 },
    ],
  },
  ir_aloo_esfenaj: {
    parts: [
      { part: 'lamb_stew',   g: 70 },
      { food: 'v_spinach',   g: 110 },
      { part: 'plum_dried',  g: 35 },
      { part: 'turmeric_oil', g: 8 },
      { food: 'v_onion',     g: 28 },
    ],
  },
  ir_gharch: {
    parts: [
      { part: 'chicken_stew', g: 90 },
      { food: 'v_mushroom',   g: 110 },
      { food: 'd_cream',      g: 20 },
      { part: 'turmeric_oil', g: 7 },
      { food: 'v_onion',      g: 25 },
    ],
  },
  ir_ghalieh_mahi: {
    parts: [
      { part: 'fish_white',   g: 120 },
      { part: 'coriander_fr', g: 70 },
      { part: 'tamarind',     g: 18 },
      { part: 'turmeric_oil', g: 12 },
      { food: 'v_onion',      g: 25 },
    ],
  },
  ir_ghalieh_meygu: {
    parts: [
      { part: 'prawn',        g: 110 },
      { part: 'coriander_fr', g: 70 },
      { part: 'tamarind',     g: 18 },
      { part: 'turmeric_oil', g: 12 },
      { food: 'v_onion',      g: 25 },
    ],
  },
  ir_estamboli: {
    parts: [
      { food: 'g_rice_white', g: 230 },
      { part: 'mince_beef',   g: 60 },
      { part: 'tomato_paste', g: 25 },
      { part: 'fried_potato', g: 50 },
      { part: 'turmeric_oil', g: 12 },
      { food: 'v_onion',      g: 25 },
    ],
  },
  ir_loobia_polo: {
    parts: [
      { food: 'g_rice_white', g: 230 },
      { part: 'mince_beef',   g: 65 },
      { part: 'green_bean_c', g: 70 },
      { part: 'tomato_paste', g: 20 },
      { part: 'turmeric_oil', g: 12 },
    ],
  },
  ir_kalam_polo: {
    parts: [
      { food: 'g_rice_white', g: 230 },
      { part: 'cabbage_c',    g: 90 },
      { part: 'mince_beef',   g: 55 },
      { food: 'v_herbs',      g: 25 },
      { part: 'turmeric_oil', g: 12 },
    ],
  },
  ir_adas_polo: {
    parts: [
      { food: 'g_rice_white', g: 230 },
      { part: 'lentil_ckd',   g: 90 },
      { food: 'fr_raisin',    g: 20 },
      { part: 'fried_onion',  g: 15 },
      { part: 'turmeric_oil', g: 10 },
    ],
  },
  ir_reshteh_polo: {
    parts: [
      { food: 'g_rice_white', g: 210 },
      { part: 'vermicelli',   g: 35 },
      { food: 'fr_date',      g: 20 },
      { food: 'fr_raisin',    g: 15 },
      { part: 'turmeric_oil', g: 12 },
    ],
  },
  ir_shevid_polo: {
    parts: [
      { food: 'g_rice_white', g: 240 },
      { part: 'broad_beans',  g: 70 },
      { part: 'dill',         g: 25 },
      { food: 'd_butter',     g: 10 },
    ],
  },
  ir_sabzi_mahi: {
    parts: [
      { food: 'g_rice_white', g: 220 },
      { food: 'v_herbs',      g: 45 },
      { part: 'fish_white',   g: 120 },
      { part: 'turmeric_oil', g: 12 },
    ],
  },
  ir_makaroni: {
    parts: [
      { food: 'g_pasta',      g: 260 },
      { part: 'mince_beef',   g: 60 },
      { part: 'tomato_paste', g: 28 },
      { part: 'turmeric_oil', g: 10 },
      { food: 'v_onion',      g: 25 },
    ],
  },
  ir_koofteh_tab: {
    parts: [
      { part: 'mince_beef',   g: 110 },
      { food: 'g_rice_white', g: 60 },
      { part: 'split_peas',   g: 45 },
      { food: 'v_herbs',      g: 30 },
      { part: 'tomato_paste', g: 20 },
      { part: 'turmeric_oil', g: 10 },
    ],
  },
  ir_kookoo_sib: {
    parts: [
      { part: 'fried_potato', g: 110 },
      { part: 'egg_cooked',   g: 60 },
      { part: 'flour',        g: 10 },
      { part: 'turmeric_oil', g: 14 },
    ],
  },
  ir_kookoo_bad: {
    parts: [
      { part: 'fried_egpl',   g: 110 },
      { part: 'egg_cooked',   g: 55 },
      { part: 'turmeric_oil', g: 12 },
      { food: 'v_onion',      g: 20 },
    ],
  },
  ir_borani: {
    parts: [
      { part: 'yogurt_full',  g: 110 },
      { part: 'fried_egpl',   g: 70 },
      { food: 'v_garlic',     g: 4 },
    ],
  },
  ir_mast_musir: {
    parts: [
      { part: 'yogurt_full', g: 95 },
      { food: 'v_onion',     g: 12 },
    ],
  },
  ir_kaleh_joosh: {
    parts: [
      { part: 'kashk_liq',    g: 60 },
      { part: 'whey_dough',   g: 160 },
      { part: 'fried_onion',  g: 20 },
      { food: 'v_mint',       g: 3 },
      { part: 'bread_crumb',  g: 25 },
    ],
  },
  ir_baghala_ghatogh: {
    parts: [
      { part: 'broad_beans',  g: 140 },
      { part: 'egg_cooked',   g: 55 },
      { part: 'dill',         g: 30 },
      { part: 'turmeric_oil', g: 12 },
      { food: 'v_garlic',     g: 6 },
    ],
  },
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
