/* ============ Built-in food database ============
   All macros are per 100 g (or per 100 ml for liquids).
   f = [kcal, protein, carbs, fat, fiber]
   u = default serving presets: [label, grams]
   International foods use USDA reference values.

   A few rows look wrong against a plain 4/4/9 check and are not: USDA applies
   food-specific factors where the generic ones overestimate. Citrus and its
   juice carry organic acids, mushrooms carry chitin, and most of wheat bran's
   very high fibre is never absorbed. Do not "correct" لیموترش, آب لیموترش,
   قارچ or سبوس گندم to match the formula — the reference value is the right
   one and the formula is the approximation.
   Iranian composite dishes come from two places, and the difference matters:
     - the twenty in data-recipes.js are DERIVED from their components, so
       editing a recipe and running tools/build_recipes.py updates them;
     - the rest are figures for a typical home preparation. They are internally
       consistent (calories match their own macros) but they are not derived,
       so a cook who uses more oil will really be eating more than they say.
   Weigh the components separately when a number has to be right.
================================================== */

/* Foods you pour rather than weigh. Category alone is not enough — milk and
   doogh are filed under dairy, so the liquid ones are named explicitly. */
const LIQUID_IDS = new Set(['d_milk_whole', 'd_milk_low', 'd_doogh']);

/**
 * A branded product: the same shape as F, plus the company whose label the
 * numbers came from and the barcode that identifies the package.
 */
const B = (id, name, nameFa, brand, code, cat, kcal, p, c, fat, fib, servings) =>
  ({ id, name, nameFa, brand, code, src: 'label', cat, kcal, p, c, f: fat, fib,
     servings: servings || null, liquid: BRAND_LIQUID.has(id), builtin: true });

const BRAND_LIQUID = new Set(['br_kalleh_milk_zero', 'br_kalleh_milk_full', 'br_kalleh_majan', 'br_kalleh_protonic', 'br_haraz_doogh_mint']);

/**
 * A Kalleh product, from the company's own product page.
 *
 * Energy, fat and protein are as printed; carbohydrate is recovered from the
 * energy identity, which is the arithmetic behind "carbohydrate by difference"
 * run backwards. It checks itself — on their sliced gouda it returns exactly
 * the sugar figure they publish — and no row was kept whose energy disagreed
 * with its own macros.
 *
 * The page each row came from is listed in tools/kalleh-sources.json.
 */
const K = (id, nameFa, cat, kcal, p, c, fat, fib, servings) =>
  ({ id, name: nameFa, nameFa, brand: 'کاله', src: 'kalleh.com', cat,
     kcal, p, c, f: fat, fib,
     servings: servings || null, liquid: KALLEH_LIQUID.has(id), builtin: true });

const KALLEH_LIQUID = new Set(['kl_دوغ_بدون_گاز_گرمادیده',
  'kl_دوغ_لیوانی',
  'kl_شیر_طالبی_غنی_شده',
  'kl_شیر_زیرو_بدون_لاکتوز_و_چربی',
  'kl_شیر_قهوه_فرادما',
  'kl_پروشیر_کازئین_وانیلی',
  'kl_پروشیر_کازئین_شکلاتی',
  'kl_شیر_موز_فرادما',
  'kl_شیر_پرچرب_3_درصد_ESL',
  'kl_شیر_کاکائو_فرادما',
  'kl_شیر_پرچرب_تترافینو',
  'kl_شیر_کم_چرب_1_5_درصد_ESL',
  'kl_شیر_کم_چرب_فرادما',
  'kl_شیر_پر_چرب_فرادما',
  'kl_شیر_فندق',
  'kl_نوشیدنی_بدون_گاز_زرشک_و_زعفر',
  'kl_نوشیدنی_بدون_گاز_لیمو_گلاب_و',
  'kl_دوغ_ساده',
  'kl_دوغ_تک_نفره_نعنا_پونه',
  'kl_دوغ_نایلونی_ساده',
  'kl_پروشیر_کازئین_قهوه_کاله_پرو',
  'kl_نوشیدنی_شکلاتی',
  'kl_شیر_چای_کلاسیک_چای_لاته_کاله',
  'kl_دسر_نوشیدنی_کولا',
  'kl_شیر_برنج_پروتئینه_دارچینی',
  'kl_کاتلا_مربای_شیر_بهارنارنج',
  'kl_شیر_برنج_پروتئینه_عسلی',
  'kl_کاتلا_مربای_شیر_ارده',
  'kl_پروشیر_وی_وانیلی_کاله_پرو',
  'kl_پروشیر_وی_شکلاتی_کاله_پرو',
  'kl_شیر_پرچرب_بدون_لاکتوز',
  'kl_شیر_کاکائو_ESL',
  'kl_شیر_پرچرب_کیسه_ای_ESL',
  'kl_شیر_پرچرب_بدون_لاکتوز_فرادما',
  'kl_شیر_شکلات_سفید_فرادما',
  'kl_شیر_طالبی_فرادما',
  'kl_شیر_کم_چرب_تترافینو',
  'kl_دوغ_بدون_گاز_نایلونی_نعناع_و',
  'kl_پنیر_کممبر_با_شیر_بز',
  'kl_دوغ_گازدار_سنتی_شمرون',
  'kl_نوشیدنی_پرتقال_گازدار_لاکی_ف',
  'kl_شیر_باریستا',
  'kl_شیر_کاکائو_دونو',
  'kl_شیر_قهوه_ESL',
  'kl_شیر_کم_چرب_غنی_شده_کیسه_ای_E',
  'kl_شیر_کم_چرب_1_2_ویتامین_ESL_D',
  'kl_شیر_عسل_فرادما',
  'kl_شیر_کاکائو_غنی_شده',
  'kl_شیر_موز_غنی_شده',
  'kl_شیر_نارگیل_غنی_شده',
  'kl_شیر_میوه_ای_موز',
  'kl_شیر_میوه_ای_سیب',
  'kl_شیر_کم_چرب_غنی_شده',
  'kl_شیر_توت_فرنگی_غنی_شده',
  'kl_شیر_موز_دونو',
  'kl_پنیر_گودا_با_شیر_بز',
  'kl_شیر_پرچرب_4_2_ESL',
  'kl_شیر_دبل_پروتئین_ESL']);

/**
 * A Zar Macaron product, from the company's own product page.
 *
 * The only brand so far that publishes a complete panel: energy, protein, fat,
 * carbohydrate and fibre are all printed, so nothing is recovered — the energy
 * identity was used only to check their figures against each other.
 *
 * The figures are for dry pasta, which is how the packet states them and how
 * pasta is weighed, so the serving says "dry" rather than leaving it to be
 * guessed. Sources: tools/zar-sources.json.
 */
const Z = (id, nameFa, kcal, p, c, fat, fib, perG) =>
  ({ id, name: nameFa, nameFa, brand: 'زر ماکارون', src: 'zarmacaron.com',
     cat: 'grain', kcal, p, c, f: fat, fib, liquid: false, builtin: true,
     servings: [[`۱ وعده (${perG} گرم خشک)`, perG]] });

/**
 * A row from the owner's own curated Iranian table.
 *
 * Checked two ways before being accepted: the stated energy has to agree with
 * the stated macros, and where a fair USDA reference exists the figures have to
 * agree with that too. 116 of 118 rows passed; the two that did not were left
 * out rather than adjusted.
 *
 * src:'table' marks the provenance. It is a different thing from a figure read
 * off a packet (src:'label') or taken from a company's own published page, and
 * the data says which so it can always be traced.
 */
const T = (id, nameFa, brand, cat, kcal, p, c, fat, fib, servings) =>
  ({ id, name: nameFa, nameFa, brand: brand || undefined, src: 'table', cat,
     kcal, p, c, f: fat, fib, servings: servings || null,
     liquid: TABLE_LIQUID.has(id), builtin: true });

const TABLE_LIQUID = new Set(['tb_001', 'tb_002', 'tb_003', 'tb_008', 'tb_013', 'tb_016', 'tb_018', 'tb_019', 'tb_020', 'tb_021', 'tb_053', 'tb_054', 'tb_059', 'tb_064', 'tb_066', 'tb_067', 'tb_070', 'tb_072', 'tb_099', 'tb_100', 'tb_101', 'tb_121', 'tb_125', 'tb_144', 'tb_145', 'tb_146', 'tb_147', 'tb_148', 'tb_149', 'tb_150', 'tb_166', 'tb_169', 'tb_182', 'tb_183', 'tb_187', 'tb_188', 'tb_194']);

const F = (id, name, nameFa, cat, kcal, p, c, fat, fib, servings) =>
  ({ id, name, nameFa, cat, kcal, p, c, f: fat, fib, servings: servings || null,
     /* measured by volume — per 100 ml, entered in ml/cc */
     liquid: cat === 'drink' || LIQUID_IDS.has(id), builtin: true });

export const FOOD_CATS = [
  { id:'all',     name:'All',        nameFa:'همه' },
  { id:'iranian', name:'Iranian',    nameFa:'ایرانی' },
  { id:'protein', name:'Protein',    nameFa:'پروتئین' },
  { id:'grain',   name:'Grains',     nameFa:'غلات' },
  { id:'dairy',   name:'Dairy',      nameFa:'لبنیات' },
  { id:'veg',     name:'Vegetables', nameFa:'سبزیجات' },
  { id:'fruit',   name:'Fruit',      nameFa:'میوه' },
  { id:'nut',     name:'Nuts & seeds', nameFa:'آجیل' },
  { id:'fat',     name:'Fats & oils', nameFa:'روغن‌ها' },
  { id:'drink',   name:'Drinks',     nameFa:'نوشیدنی' },
  { id:'fastfood', name:'Fast food', nameFa:'فست‌فود' },
  { id:'snack',   name:'Snacks',     nameFa:'تنقلات' },
  { id:'supp',    name:'Supplements', nameFa:'مکمل' },
];

export const FOODS = [
  /* ---------- Iranian dishes ---------- */
  F('ir_chelo_kabab', 'Chelo Kabab Koobideh', 'چلوکباب کوبیده', 'iranian', 151, 8.1, 15.6, 6.1, 0.5, [['1 پرس / portion', 590]]),
  F('ir_joojeh',      'Joojeh Kabab',        'جوجه کباب',       'iranian', 231, 21.9, 0.9, 15.1, 0.2, [['1 سیخ / skewer', 200]]),
  F('ir_ghormeh',     'Ghormeh Sabzi',       'قورمه سبزی',      'iranian', 165, 10.6, 7.9, 10.2, 2.5, [['1 پرس خورش / stew only', 260]]),
  F('ir_gheymeh',     'Gheymeh',             'قیمه',            'iranian', 205, 10.2, 15.2, 11.7, 3.5, [['1 پرس خورش / stew only', 260]]),
  F('ir_fesenjan',    'Fesenjan',            'فسنجان',          'iranian', 225, 10.6, 13.6, 15.1, 1.4, [['1 پرس خورش / stew only', 300]]),
  F('ir_ghelyeh',     'Baghali Polo',        'باقالی پلو',      'iranian', 160, 6.7, 21.0, 5.2, 1.1, [['1 پرس / portion', 410]]),
  F('ir_zereshk',     'Zereshk Polo',        'زرشک پلو',        'iranian', 176, 8.7, 22.2, 5.3, 0.5, [['1 پرس / portion', 420]]),
  F('ir_adasi',       'Adasi (lentil stew)', 'عدسی',            'iranian', 115, 6.3, 15.0, 3.8, 5.5, [['1 کاسه / bowl', 270]]),
  F('ir_ash',         'Ash Reshteh',         'آش رشته',         'iranian', 102, 5.3, 15.6, 2.1, 3.2, [['1 کاسه / bowl', 385]]),
  F('ir_abgoosht',    'Abgoosht / Dizi',     'آبگوشت (دیزی)',   'iranian', 110, 7.8, 11.4, 3.8, 2.3, [['1 پرس / portion', 470]]),
  F('ir_kotlet',      'Kotlet',              'کتلت',            'iranian', 240, 11.6, 11.1, 16.8, 0.8, [['1 عدد / piece', 105]]),
  F('ir_kookoo',      'Kookoo Sabzi',        'کوکو سبزی',       'iranian', 208, 6.7, 5.4, 18.1, 1.7, [['1 برش / slice', 125]]),
  F('ir_mirza',       'Mirza Ghasemi',       'میرزا قاسمی',     'iranian', 170, 2.7, 6.0, 15.2, 1.9, [['1 پرس / portion', 210]]),
  F('ir_kashk',       'Kashk-e Bademjan',    'کشک بادمجان',     'iranian', 259, 4.2, 9.3, 23.0, 2.4, [['1 پرس / portion', 190]]),
  F('ir_tahchin',     'Tahchin',             'ته‌چین',          'iranian', 167, 8.6, 16.0, 7.6, 0.2, [['1 برش / slice', 340]]),
  F('ir_haleem',      'Haleem',              'حلیم',            'iranian', 130, 6.9, 17.7, 3.6, 2.7, [['1 کاسه / bowl', 310]]),
  F('ir_salad_shir',  'Salad Shirazi',       'سالاد شیرازی',    'iranian', 43, 0.8, 4.2, 2.9, 0.9, [['1 کاسه / bowl', 145]]),
  F('ir_mast_khiar',  'Mast-o Khiar',        'ماست و خیار',     'iranian', 70, 3.2, 4.7, 4.6, 0.4, [['1 کاسه / bowl', 170]]),
  F('ir_sangak',      'Sangak bread',        'نان سنگک',        'iranian', 250, 8.5, 51, 1.1, 4.5, [['1 برش / piece', 80]]),
  F('ir_barbari',     'Barbari bread',       'نان بربری',       'iranian', 275, 8.8, 55, 2, 2.6, [['1 برش / piece', 100]]),
  F('ir_lavash',      'Lavash bread',        'نان لواش',        'iranian', 275, 9, 56, 1.5, 2.2, [['1 برگ / sheet', 45]]),
  F('ir_taftoon',     'Taftoon bread',       'نان تافتون',      'iranian', 265, 8.5, 54, 1.8, 2.4, [['1 برگ / sheet', 60]]),
  F('ir_halva',       'Halva',               'حلوا',            'iranian', 392, 3.7, 51.2, 19.6, 0.9, [['1 قاشق / tbsp', 25]]),
  F('ir_sholezard',   'Sholeh Zard',         'شله زرد',         'iranian', 147, 1.3, 30.4, 2.2, 0.2, [['1 کاسه / bowl', 200]]),

  F('ir_koobideh_m', 'Kabab Koobideh (meat only)', 'کباب کوبیده (فقط گوشت)', 'iranian', 245, 18, 1.5, 18.5, 0.2, [['1 سیخ / skewer', 110]]),
  F('ir_barg', 'Kabab Barg', 'کباب برگ', 'iranian', 211, 27, 1, 11, 0.1, [['1 سیخ / skewer', 180]]),
  F('ir_soltani', 'Chelo Kabab Soltani', 'چلوکباب سلطانی', 'iranian', 168, 10.5, 15.2, 7.4, 0.5, [['1 پرس / portion', 620]]),
  F('ir_shishlik', 'Shishlik (lamb chops)', 'شیشلیک', 'iranian', 280, 25, 0, 20, 0, [['1 پرس / portion', 260]]),
  F('ir_bakhtiari', 'Kabab Bakhtiari', 'کباب بختیاری', 'iranian', 217, 24, 1, 13, 0.1, [['1 سیخ / skewer', 190]]),
  F('ir_chenjeh', 'Kabab Chenjeh', 'کباب چنجه', 'iranian', 216, 27, 0, 12, 0, [['1 سیخ / skewer', 180]]),
  F('ir_torsh', 'Kabab Torsh (Gilaki)', 'کباب ترش', 'iranian', 230, 22, 4, 14, 0.6, [['1 سیخ / skewer', 170]]),
  F('ir_tabei', 'Pan kabab', 'کباب تابه‌ای', 'iranian', 211, 14, 5, 15, 0.8, [['1 پرس / portion', 200]]),
  F('ir_jujeh_bone', 'Joojeh with bone', 'جوجه کباب با استخوان', 'iranian', 215, 20, 0.8, 14.5, 0.2, [['1 سیخ / skewer', 230]]),
  F('ir_gheymeh_bad', 'Gheymeh Bademjan', 'قیمه بادمجان', 'iranian', 200, 8.5, 10, 14, 3.0, [['1 پرس خورش / stew only', 270]]),
  F('ir_bademjan', 'Khoresh Bademjan', 'خورش بادمجان', 'iranian', 211, 8.5, 6.3, 16.9, 1.9, [['1 پرس خورش / stew only', 260]]),
  F('ir_karafs', 'Khoresh Karafs', 'خورش کرفس', 'iranian', 154, 8.0, 3.4, 12.1, 1.4, [['1 پرس خورش / stew only', 260]]),
  F('ir_aloo_esfenaj', 'Khoresh Aloo Esfenaj', 'خورش آلو اسفناج', 'iranian', 148, 8.7, 11.5, 8.2, 2.1, [['1 پرس خورش / stew only', 260]]),
  F('ir_beh', 'Khoresh Beh', 'خورش به', 'iranian', 152, 7.8, 14.2, 7.4, 2.1, [['1 پرس خورش / stew only', 260]]),
  F('ir_mast_khoresh', 'Khoresh Mast (Isfahani)', 'خورش ماست', 'iranian', 172, 7, 18, 8, 0.4, [['1 پرس / portion', 180]]),
  F('ir_loobia_sabz', 'Khoresh Loobia Sabz', 'خورش لوبیا سبز', 'iranian', 130, 8.4, 6.5, 8.4, 2.0, [['1 پرس خورش / stew only', 260]]),
  F('ir_havij', 'Khoresh Havij', 'خورش هویج', 'iranian', 170, 8, 12, 10, 2.2, [['1 پرس خورش / stew only', 260]]),
  F('ir_rivas', 'Khoresh Rivas', 'خورش ریواس', 'iranian', 154, 9, 7, 10, 2.0, [['1 پرس خورش / stew only', 260]]),
  F('ir_bamieh_kh', 'Khoresh Bamieh', 'خورش بامیه', 'iranian', 125, 8.2, 6.4, 7.9, 2.1, [['1 پرس خورش / stew only', 260]]),
  F('ir_gharch', 'Chicken & mushroom stew', 'خورش قارچ و مرغ', 'iranian', 140, 10.9, 2.6, 9.7, 0.6, [['1 پرس خورش / stew only', 260]]),
  F('ir_kadoo_kh', 'Khoresh Kadoo', 'خورش کدو', 'iranian', 154, 8, 8, 10, 1.8, [['1 پرس خورش / stew only', 260]]),
  F('ir_estamboli', 'Estamboli Polo', 'استانبولی پلو', 'iranian', 180, 6.2, 22.3, 7.2, 1.0, [['1 پرس / portion', 380]]),
  F('ir_loobia_polo', 'Loobia Polo', 'لوبیا پلو', 'iranian', 153, 6.4, 18.6, 5.9, 1.0, [['1 پرس / portion', 390]]),
  F('ir_kalam_polo', 'Kalam Polo', 'کلم پلو', 'iranian', 139, 5.4, 17.2, 5.3, 1.0, [['1 پرس / portion', 390]]),
  F('ir_sabzi_mahi', 'Sabzi Polo ba Mahi', 'سبزی پلو با ماهی', 'iranian', 134, 8.7, 16.0, 3.5, 0.6, [['1 پرس / portion', 400]]),
  F('ir_adas_polo', 'Adas Polo', 'عدس پلو', 'iranian', 165, 4.2, 27.6, 4.3, 2.5, [['1 پرس / portion', 390]]),
  F('ir_reshteh_polo', 'Reshteh Polo', 'رشته پلو', 'iranian', 209, 3.8, 38.3, 4.6, 1.4, [['1 پرس / portion', 380]]),
  F('ir_morasa', 'Morasa Polo', 'مرصع پلو', 'iranian', 174, 5, 25, 6, 1.2, [['1 پرس / portion', 400]]),
  F('ir_shirin_polo', 'Shirin Polo', 'شیرین پلو', 'iranian', 182, 5, 27, 6, 1.3, [['1 پرس / portion', 400]]),
  F('ir_kateh', 'Kateh (soft rice)', 'کته', 'iranian', 130, 2.7, 28, 0.3, 0.4, [['1 پیمانه / cup', 200]]),
  F('ir_tahdig', 'Tahdig (rice crust)', 'ته دیگ', 'iranian', 298, 4.5, 34, 16, 0.6, [['1 تکه / piece', 60]]),
  F('ir_makaroni', 'Iranian macaroni', 'ماکارونی ایرانی', 'iranian', 178, 8.4, 23.0, 5.8, 1.6, [['1 پرس / portion', 350]]),
  F('ir_koofteh_tab', 'Koofteh Tabrizi', 'کوفته تبریزی', 'iranian', 189, 12.9, 11.4, 10.3, 2.1, [['1 عدد / ball', 300]]),
  F('ir_koofteh_gh', 'Koofteh Ghelgheli', 'کوفته قلقلی', 'iranian', 188, 12, 8, 12, 0.8, [['1 عدد / ball', 35]]),
  F('ir_shami', 'Shami', 'شامی', 'iranian', 230, 12, 14, 14, 1.0, [['1 عدد / piece', 90]]),
  F('ir_kookoo_sib', 'Kookoo Sibzamini', 'کوکو سیب‌زمینی', 'iranian', 282, 6.4, 24.5, 17.6, 2.0, [['1 برش / slice', 110]]),
  F('ir_kookoo_bad', 'Kookoo Bademjan', 'کوکو بادمجان', 'iranian', 215, 4.2, 5.3, 19.6, 1.8, [['1 برش / slice', 110]]),
  F('ir_dolmeh_barg', 'Dolmeh Barg-e Mo', 'دلمه برگ مو', 'iranian', 152, 4, 16, 8, 1.6, [['1 عدد / piece', 35]]),
  F('ir_dolmeh_fel', 'Dolmeh Felfel', 'دلمه فلفل', 'iranian', 144, 6, 12, 8, 1.8, [['1 عدد / piece', 180]]),
  F('ir_ash_doogh', 'Ash-e Doogh', 'آش دوغ', 'iranian', 83, 4, 10, 3, 1.6, [['1 کاسه / bowl', 350]]),
  F('ir_ash_shole', 'Ash-e Sholeh Ghalamkar', 'آش شله قلمکار', 'iranian', 111, 5, 16, 3, 3.0, [['1 کاسه / bowl', 380]]),
  F('ir_ash_jo', 'Ash-e Jo', 'آش جو', 'iranian', 95, 4, 13, 3, 2.2, [['1 کاسه / bowl', 350]]),
  F('ir_ash_sabzi', 'Ash-e Sabzi', 'آش سبزی', 'iranian', 91, 4, 12, 3, 2.6, [['1 کاسه / bowl', 350]]),
  F('ir_soup_jo', 'Barley soup', 'سوپ جو', 'iranian', 70, 3, 9, 2.5, 1.2, [['1 کاسه / bowl', 300]]),
  F('ir_soup_morgh', 'Chicken soup', 'سوپ مرغ', 'iranian', 58, 4, 6, 2, 0.8, [['1 کاسه / bowl', 300]]),
  F('ir_haleem_bad', 'Haleem Bademjan', 'حلیم بادمجان', 'iranian', 142, 5, 8, 10, 2.4, [['1 پرس / portion', 200]]),
  F('ir_bozbash', 'Abgoosht Bozbash', 'آبگوشت بزباش', 'iranian', 112, 7.5, 11, 4, 2.4, [['1 پرس / portion', 450]]),
  F('ir_kalepache', 'Kale Pache', 'کله پاچه', 'iranian', 204, 14, 1, 16, 0, [['1 پرس / portion', 300]]),
  F('ir_sirabi', 'Sirabi (tripe)', 'سیرابی', 'iranian', 92, 12, 2, 4, 0, [['1 کاسه / bowl', 300]]),
  F('ir_del_jigar', 'Del-o Jigar (grilled)', 'دل و جگر', 'iranian', 146, 20, 3, 6, 0, [['1 سیخ / skewer', 90]]),
  F('ir_jigar_morgh', 'Chicken liver', 'جگر مرغ', 'iranian', 167, 24.5, 0.9, 6.5, 0, [['1 سیخ / skewer', 80]]),
  F('ir_zaban', 'Beef tongue', 'زبان', 'iranian', 271, 22, 0, 20.5, 0, [['1 پرس / portion', 150]]),
  F('ir_maghz', 'Brain, cooked', 'مغز', 'iranian', 142, 12, 1, 10, 0, [['1 پرس / portion', 120]]),
  F('ir_nimroo', 'Nimroo (fried eggs)', 'نیمرو', 'iranian', 187, 12, 1, 15, 0, [['۲ تخم‌مرغ / 2 eggs', 120]]),
  F('ir_omelet', 'Tomato omelette', 'املت گوجه', 'iranian', 156, 8, 4, 12, 0.7, [['1 پرس / portion', 220]]),
  F('ir_khagineh', 'Khagineh', 'خاگینه', 'iranian', 225, 7, 20, 13, 0.3, [['1 پرس / portion', 120]]),
  F('ir_sarshir', 'Sarshir (clotted cream)', 'سرشیر', 'iranian', 384, 3, 3, 40, 0, [['1 قاشق / tbsp', 20]]),
  F('ir_khameh_sob', 'Breakfast cream', 'خامه صبحانه', 'iranian', 294, 2.5, 3.5, 30, 0, [['1 ظرف / tub', 100]]),
  F('ir_naan_panir', 'Bread, cheese & walnut', 'نان و پنیر و گردو', 'iranian', 320, 12, 28, 18, 2.2, [['1 وعده / serving', 120]]),
  F('ir_torshi', 'Torshi (pickles)', 'ترشی', 'iranian', 30, 1, 6, 0.5, 1.6, [['1 قاشق / tbsp', 25]]),
  F('ir_zeytoon_par', 'Zeytoon Parvardeh', 'زیتون پرورده', 'iranian', 230, 2.5, 9, 21, 3.0, [['1 قاشق / tbsp', 25]]),
  F('ir_olvieh', 'Salad Olvieh', 'سالاد الویه', 'iranian', 245, 7, 12, 19, 1.2, [['1 پرس / portion', 200]]),
  F('ir_mast_musir', 'Mast-o Musir', 'ماست موسیر', 'iranian', 83, 3.1, 5.0, 5.3, 0.2, [['1 قاشق / tbsp', 25]]),
  F('ir_borani', 'Borani Bademjan', 'بورانی بادمجان', 'iranian', 136, 2.5, 6.3, 11.0, 1.2, [['1 پرس / portion', 180]]),
  F('ir_borani_esf', 'Borani Esfenaj', 'بورانی اسفناج', 'iranian', 95, 3.5, 5, 7, 1.4, [['1 پرس / portion', 180]]),
  F('ir_falafel', 'Falafel balls', 'فلافل', 'fastfood', 333, 13, 32, 18, 4.9, [['1 عدد / ball', 20]]),
  F('ir_s_falafel', 'Falafel sandwich', 'ساندویچ فلافل', 'fastfood', 238, 7, 30, 10, 3.5, [['1 عدد / sandwich', 280]]),
  F('ir_s_kalbas', 'Cold-cut sandwich', 'ساندویچ کالباس', 'fastfood', 252, 11, 25, 12, 1.5, [['1 عدد / sandwich', 220]]),
  F('ir_s_bandari', 'Sosis Bandari sandwich', 'ساندویچ سوسیس بندری', 'fastfood', 266, 9, 26, 14, 1.8, [['1 عدد / sandwich', 250]]),
  F('ir_s_burger', 'Hamburger sandwich', 'ساندویچ همبرگر', 'fastfood', 261, 12, 24, 13, 1.6, [['1 عدد / sandwich', 250]]),
  F('ir_s_morgh', 'Chicken sandwich', 'ساندویچ مرغ', 'fastfood', 233, 14, 24, 9, 1.4, [['1 عدد / sandwich', 250]]),
  F('ir_s_kotlet', 'Kotlet sandwich', 'ساندویچ کتلت', 'fastfood', 252, 10, 26, 12, 1.6, [['1 عدد / sandwich', 240]]),
  F('ir_s_zaban', 'Tongue sandwich', 'ساندویچ زبان', 'fastfood', 271, 12, 22, 15, 1.2, [['1 عدد / sandwich', 230]]),
  F('ir_shawarma', 'Shawarma', 'شاورما', 'fastfood', 260, 14, 24, 12, 1.5, [['1 عدد / sandwich', 280]]),
  F('ir_pizza', 'Pizza, mixed', 'پیتزا', 'fastfood', 263, 11, 30, 11, 2.0, [['1 برش / slice', 120]]),
  F('ir_samboseh', 'Samboseh', 'سمبوسه', 'fastfood', 279, 6, 30, 15, 2.0, [['1 عدد / piece', 60]]),
  F('ir_nugget', 'Chicken nuggets', 'ناگت مرغ', 'fastfood', 286, 15, 16, 18, 1.0, [['1 عدد / piece', 20]]),
  F('ir_fries', 'French fries', 'سیب‌زمینی سرخ‌کرده', 'fastfood', 312, 3.4, 41, 15, 3.8, [['1 پرس / portion', 150]]),
  F('ir_hotdog', 'Hot dog', 'هات داگ', 'fastfood', 275, 11, 24, 15, 1.2, [['1 عدد / piece', 150]]),
  F('ir_fried_chicken', 'Fried chicken', 'مرغ سوخاری', 'iranian', 280, 22, 12, 16, 0.6, [['1 تکه / piece', 120]]),

  /* ---------- regional dishes ----------
     Added after measuring which searches came back empty. Typical home
     preparation, per 100 g as served; internally consistent but not
     derived from weighed components. */
  F('ir_ghalieh_mahi', 'Ghalieh Mahi (Bandari fish stew)', 'قلیه ماهی', 'iranian', 172, 12.4, 7.3, 10.6, 1.5, [['1 پرس / portion', 300]]),
  F('ir_ghalieh_meygu', 'Ghalieh Meygu (prawn stew)', 'قلیه میگو', 'iranian', 172, 12.5, 7.7, 10.7, 1.5, [['1 پرس / portion', 300]]),
  F('ir_meygu_polo', 'Meygu Polo (prawn rice)', 'میگو پلو', 'iranian', 168, 9, 22, 5.5, 1.2, [['1 پرس / portion', 380]]),
  F('ir_havari', 'Havari (Bandari omelette)', 'حواری', 'iranian', 178, 9, 6, 14, 1.0, [['1 پرس / portion', 200]]),
  F('ir_baghala_ghatogh', 'Baghala Ghatogh', 'باقلا قاتق', 'iranian', 148, 7.8, 13.1, 7.5, 3.4, [['1 پرس / portion', 280]]),
  F('ir_torsh_tareh', 'Torsh Tareh', 'ترش تره', 'iranian', 96, 4.5, 8, 5.5, 2.4, [['1 کاسه / bowl', 280]]),
  F('ir_mirza_ghasemi_r', 'Naz Khatoon', 'ناز خاتون', 'iranian', 112, 2.2, 7, 8.5, 2.2, [['1 پرس / portion', 180]]),
  F('ir_kabab_torsh_g', 'Waldoon Bij', 'والدون بیج', 'iranian', 205, 6, 9, 16, 2.0, [['1 پرس / portion', 200]]),
  F('ir_biryani', 'Biryani (Isfahani)', 'بریانی اصفهانی', 'iranian', 268, 16, 14, 17, 1.2, [['1 پرس / portion', 250]]),
  F('ir_kaleh_joosh', 'Kaleh Joosh', 'کله جوش', 'iranian', 119, 5.6, 12.2, 5.1, 0.6, [['1 کاسه / bowl', 280]]),
  F('ir_khoresh_mosamma', 'Khoresh Mosamma Bademjan', 'خورش مسما', 'iranian', 181, 8, 8, 13, 2.8, [['1 پرس خورش / stew only', 260]]),
  F('ir_gheymeh_rizeh', 'Gheymeh Rizeh', 'قیمه ریزه', 'iranian', 196, 10, 10, 13, 1.6, [['1 پرس خورش / stew only', 260]]),
  F('ir_beryan', 'Beryan', 'بریان', 'iranian', 252, 18, 2, 19, 0.2, [['1 پرس / portion', 220]]),
  F('ir_kabab_hosseini', 'Kabab Hosseini', 'کباب حسینی', 'iranian', 214, 17, 6, 13.5, 1.0, [['1 سیخ / skewer', 180]]),
  F('ir_dolmeh_barg_az', 'Dolmeh Azari', 'دلمه آذری', 'iranian', 158, 6, 14, 8.5, 1.8, [['1 عدد / piece', 60]]),
  F('ir_ash_doogh_az', 'Ash-e Doogh Azari', 'آش دوغ آذری', 'iranian', 86, 4.2, 10, 3.2, 1.6, [['1 کاسه / bowl', 350]]),
  F('ir_kufteh_shirin', 'Koofteh Shirin', 'کوفته شیرین', 'iranian', 192, 10, 16, 10, 1.4, [['1 عدد / ball', 200]]),
  F('ir_shole_mashhadi', 'Sholeh Mashhadi', 'شله مشهدی', 'iranian', 138, 7, 14, 5.5, 2.0, [['1 کاسه / bowl', 320]]),
  F('ir_ash_jo_mashhad', 'Ash-e Ardeh', 'آش ارده', 'iranian', 128, 5, 13, 6, 1.8, [['1 کاسه / bowl', 320]]),
  F('ir_dizi_sangi', 'Dizi Sangi', 'دیزی سنگی', 'iranian', 116, 8, 11, 4.2, 2.4, [['1 پرس / portion', 450]]),
  F('ir_khoresh_khalal', 'Khoresh Khalal', 'خورش خلال', 'iranian', 232, 11, 12, 15, 2.2, [['1 پرس خورش / stew only', 260]]),
  F('ir_dandeh_kabab', 'Dandeh Kabab', 'دنده کباب', 'iranian', 276, 24, 0, 20, 0, [['1 پرس / portion', 250]]),
  F('ir_ash_reshteh_k', 'Ash-e Doo', 'آش دوو', 'iranian', 92, 4.4, 11, 3.2, 1.6, [['1 کاسه / bowl', 330]]),
  F('ir_shevid_polo', 'Shevid Baghali Polo', 'شوید باقالی پلو', 'iranian', 137, 3.7, 24.0, 2.7, 1.5, [['1 پرس / portion', 390]]),
  F('ir_havij_polo', 'Havij Polo', 'هویج پلو', 'iranian', 172, 5.5, 24, 5.8, 1.6, [['1 پرس / portion', 390]]),
  F('ir_albaloo_polo', 'Albaloo Polo', 'آلبالو پلو', 'iranian', 178, 5.2, 26, 5.6, 1.2, [['1 پرس / portion', 390]]),
  F('ir_kalam_polo_shz', 'Kalam Polo Shirazi', 'کلم پلو شیرازی', 'iranian', 162, 6.2, 20, 6.2, 1.8, [['1 پرس / portion', 390]]),
  F('ir_addas_polo_shz', 'Adas Polo with raisins', 'عدس پلو با کشمش', 'iranian', 174, 6, 26, 5, 2.2, [['1 پرس / portion', 390]]),
  F('ir_dampokhtak', 'Dampokhtak', 'دم‌پختک', 'iranian', 158, 5.5, 22, 5.2, 1.8, [['1 پرس / portion', 360]]),
  F('ir_kadoo_polo', 'Kadoo Polo', 'کدو پلو', 'iranian', 154, 5, 21, 5.4, 1.6, [['1 پرس / portion', 380]]),
  F('ir_del_gholveh', 'Del-o Gholveh', 'دل و قلوه', 'iranian', 152, 21, 2, 6.5, 0, [['1 سیخ / skewer', 90]]),
  F('ir_jigar_goosaleh', 'Jigar (grilled liver)', 'جگر کبابی', 'iranian', 172, 25, 4, 6.4, 0, [['1 سیخ / skewer', 90]]),
  F('ir_gipa', 'Gipa', 'گیپا', 'iranian', 218, 12, 16, 12, 1.2, [['1 پرس / portion', 220]]),
  F('ir_torshi_tareh', 'Torshi Tareh (pickled herbs)', 'ترشی تره', 'iranian', 42, 1.4, 6, 1.2, 2.0, [['1 قاشق / tbsp', 25]]),
  F('ir_torshi_liteh', 'Torshi Liteh', 'ترشی لیته', 'iranian', 58, 1.6, 8, 2.2, 2.4, [['1 قاشق / tbsp', 25]]),
  F('ir_shoor', 'Khiar Shoor', 'خیارشور', 'iranian', 18, 0.7, 3.2, 0.2, 1.0, [['1 عدد / piece', 40]]),
  F('ir_morabba_baleng', 'Moraba-ye Baleng', 'مربای بالنگ', 'iranian', 258, 0.4, 64, 0.2, 1.4, [['1 قاشق / tbsp', 20]]),
  F('sw_sohan_asali', 'Sohan Asali', 'سوهان عسلی', 'iranian', 486, 8, 48, 29, 2.4, [['1 عدد / piece', 20]]),
  F('sw_koloocheh_fmn', 'Koloocheh Fooman', 'کلوچه فومن', 'iranian', 402, 5.5, 56, 17, 1.8, [['1 عدد / piece', 70]]),
  F('sw_baslogh', 'Baslogh', 'باسلوق', 'iranian', 364, 2.4, 78, 5.2, 1.0, [['1 عدد / piece', 20]]),
  F('sw_haj_badam', 'Haji Badam', 'حاجی بادام', 'iranian', 448, 9, 52, 23, 2.6, [['1 عدد / piece', 12]]),
  F('sw_komaj', 'Komaj Sen', 'کماج', 'iranian', 372, 7, 54, 14, 2.2, [['1 برش / slice', 60]]),
  F('sw_shirini_keshmeshi', 'Keshmeshi', 'شیرینی کشمشی', 'iranian', 428, 6, 58, 19, 1.4, [['1 عدد / piece', 14]]),
  F('ir_soup_jo_shir', 'Barley & milk soup', 'سوپ جو شیری', 'iranian', 84, 4, 10, 3, 1.0, [['1 کاسه / bowl', 300]]),
  F('ir_kachi', 'Kachi', 'کاچی', 'iranian', 296, 3.4, 42, 13, 0.8, [['1 کاسه / bowl', 180]]),
  F('ir_halim_bademjan_t', 'Tabriz Haleem', 'حلیم تبریزی', 'iranian', 142, 8, 15, 5.4, 2.2, [['1 کاسه / bowl', 300]]),
  F('ir_nargesi', 'Nargesi Esfenaj', 'نرگسی اسفناج', 'iranian', 134, 7, 5, 10, 1.6, [['1 پرس / portion', 200]]),

  /* ---------- Protein ---------- */
  F('p_chicken_br',   'Chicken breast, cooked', 'سینه مرغ پخته', 'protein', 165, 31, 0, 3.6, 0, [['1 fillet', 170]]),
  F('p_chicken_th',   'Chicken thigh, cooked',  'ران مرغ پخته',  'protein', 209, 26, 0, 10.9, 0, [['1 thigh', 120]]),
  F('p_beef_lean',    'Beef, lean cooked',      'گوشت گوساله بدون چربی', 'protein', 217, 30, 0, 10, 0, null),
  F('p_beef_ground',  'Ground beef 15% fat',    'گوشت چرخ‌کرده',  'protein', 250, 26, 0, 16, 0, null),
  F('p_lamb',         'Lamb, cooked',           'گوشت گوسفند',    'protein', 258, 25, 0, 17, 0, null),
  F('p_turkey',       'Turkey breast',          'سینه بوقلمون',   'protein', 135, 29, 0, 1.7, 0, null),
  F('p_salmon',       'Salmon, cooked',         'ماهی سالمون',    'protein', 208, 22, 0, 13, 0, [['1 fillet', 150]]),
  F('p_tuna_can',     'Tuna, canned in water',  'تن ماهی در آب',  'protein', 116, 26, 0, 0.8, 0, [['1 قوطی / can', 120]]),
  F('p_shrimp',       'Shrimp, cooked',         'میگو',           'protein', 99, 24, 0.2, 0.3, 0, null),
  F('p_white_fish',   'White fish (cod)',       'ماهی سفید',      'protein', 105, 23, 0, 1, 0, null),
  F('p_egg',          'Egg, whole',             'تخم مرغ',        'protein', 143, 12.6, 0.7, 9.5, 0, [['1 عدد / egg', 50]]),
  F('p_egg_white',    'Egg white',              'سفیده تخم مرغ',  'protein', 52, 11, 0.7, 0.2, 0, [['1 عدد / white', 33]]),
  F('p_tofu',         'Tofu, firm',             'توفو',           'protein', 144, 15, 3.9, 8.7, 2.3, null),
  F('p_lentil',       'Lentils, cooked',        'عدس پخته',       'protein', 116, 9, 20, 0.4, 7.9, [['1 cup', 198]]),
  F('p_chickpea',     'Chickpeas, cooked',      'نخود پخته',      'protein', 164, 8.9, 27, 2.6, 7.6, [['1 cup', 164]]),
  F('p_kidney_bean',  'Kidney beans, cooked',   'لوبیا قرمز پخته','protein', 127, 8.7, 23, 0.5, 6.4, [['1 cup', 177]]),
  F('p_white_bean',   'White beans, cooked',    'لوبیا سفید پخته','protein', 139, 9.7, 25, 0.4, 6.3, null),

  F('p_trout', 'Trout, cooked', 'ماهی قزل‌آلا', 'protein', 148, 20.8, 0, 6.6, 0, [['1 فیله / fillet', 150]]),
  F('p_kilka', 'Kilka fish', 'ماهی کیلکا', 'protein', 158, 20, 0, 8, 0, [['1 پرس / portion', 150]]),
  F('p_halva_fish', 'Pomfret (halva)', 'ماهی حلوا', 'protein', 130, 20, 0, 5.5, 0, [['1 فیله / fillet', 150]]),
  F('p_shir_fish', 'King mackerel (shir)', 'ماهی شیر', 'protein', 158, 22, 0, 7, 0, [['1 فیله / fillet', 150]]),
  F('p_tilapia', 'Tilapia', 'ماهی تیلاپیا', 'protein', 128, 26, 0, 2.7, 0, [['1 فیله / fillet', 150]]),
  F('p_tuna_oil', 'Tuna, canned in oil', 'تن ماهی در روغن', 'protein', 198, 24, 0, 11, 0, [['1 قوطی / can', 120]]),
  F('p_sausage', 'Sausage', 'سوسیس', 'protein', 290, 11, 6, 25, 0, [['1 عدد / piece', 60]]),
  F('p_kalbas', 'Cold cuts (kalbas)', 'کالباس', 'protein', 270, 13, 5, 22, 0, [['1 برش / slice', 20]]),
  F('p_burger_raw', 'Hamburger patty, raw', 'همبرگر خام', 'protein', 250, 15, 8, 18, 0.5, [['1 عدد / patty', 80]]),
  F('p_quail', 'Quail, cooked', 'بلدرچین', 'protein', 227, 25, 0, 14, 0, [['1 عدد / bird', 110]]),
  F('p_quail_egg', 'Quail egg', 'تخم بلدرچین', 'protein', 158, 13, 0.4, 11, 0, [['1 عدد / egg', 9]]),
  F('p_camel', 'Camel meat', 'گوشت شتر', 'protein', 160, 22, 0, 8, 0, null),
  F('p_beef_liver', 'Beef liver, cooked', 'جگر گوساله', 'protein', 175, 26, 5, 5, 0, [['1 پرس / portion', 120]]),
  F('p_kidney', 'Kidney, cooked', 'قلوه', 'protein', 157, 27, 0.3, 4.7, 0, [['1 پرس / portion', 120]]),
  F('p_chicken_wing', 'Chicken wings', 'بال مرغ', 'protein', 203, 30.5, 0, 8.1, 0, [['1 عدد / wing', 34]]),
  F('p_chicken_whole', 'Chicken, whole cooked', 'مرغ کامل پخته', 'protein', 239, 27, 0, 14, 0, [['1 پرس / portion', 200]]),

  /* ---------- cuts, poultry and fish ----------
     Added after a coverage test found cuts of meat at 0%. Single
     ingredients, so these are reference values rather than estimates:
     USDA for the international ones, and for the Caspian and Gulf fish
     the nearest USDA species of the same fat class. */
  F('p_lamb_leg', 'Lamb leg, roasted', 'ران گوسفند', 'protein', 217, 28.0, 0, 11.0, 0, [['1 پرس / portion', 150]]),
  F('p_lamb_shoulder', 'Lamb shoulder, cooked', 'سردست گوسفند', 'protein', 269, 24.6, 0, 18.4, 0, [['1 پرس / portion', 150]]),
  F('p_lamb_shank', 'Lamb shank, cooked', 'ماهیچه گوسفند', 'protein', 201, 28.4, 0, 9.0, 0, [['1 عدد / piece', 180]]),
  F('p_lamb_neck', 'Lamb neck, cooked', 'گردن گوسفند', 'protein', 292, 23.0, 0, 22.0, 0, [['1 پرس / portion', 150]]),
  F('p_lamb_rib', 'Lamb ribs, cooked', 'دنده گوسفند', 'protein', 305, 22.0, 0, 24.0, 0, [['1 پرس / portion', 150]]),
  F('p_beef_loin', 'Beef loin, cooked', 'راسته گوساله', 'protein', 212, 29.5, 0, 9.8, 0, [['1 پرس / portion', 150]]),
  F('p_beef_fillet', 'Beef fillet, cooked', 'فیله گوساله', 'protein', 196, 30.0, 0, 7.9, 0, [['1 پرس / portion', 150]]),
  F('p_beef_shank', 'Beef shank, cooked', 'ماهیچه گوساله', 'protein', 201, 30.5, 0, 7.8, 0, [['1 پرس / portion', 150]]),
  F('p_beef_rib', 'Beef ribs, cooked', 'دنده گوساله', 'protein', 291, 24.0, 0, 21.2, 0, [['1 پرس / portion', 150]]),
  F('p_mince_mixed', 'Mixed mince (beef+lamb)', 'چرخ‌کرده مخلوط', 'protein', 254, 25.0, 0, 16.8, 0, null),
  F('p_chicken_br_sk', 'Chicken breast, skinless', 'سینه مرغ بدون پوست', 'protein', 165, 31.0, 0, 3.6, 0, [['1 عدد / fillet', 170]]),
  F('p_chicken_th_sk', 'Chicken thigh, skinless', 'ران مرغ بدون پوست', 'protein', 177, 24.6, 0, 8.2, 0, [['1 عدد / thigh', 110]]),
  F('p_chicken_fillet', 'Chicken fillet (tender)', 'فیله مرغ', 'protein', 153, 30.2, 0, 3.1, 0, [['1 عدد / piece', 60]]),
  F('p_chicken_drum', 'Chicken drumstick, cooked', 'ساق مرغ', 'protein', 172, 28.3, 0, 5.7, 0, [['1 عدد / piece', 95]]),
  F('p_turkey_mince', 'Turkey mince, cooked', 'بوقلمون چرخ‌کرده', 'protein', 203, 27.4, 0, 10.4, 0, null),
  F('p_fish_halva_s', 'Black pomfret', 'ماهی حلوا سیاه', 'protein', 152, 21.0, 0, 7.3, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_sangesar', 'Grunt (sangesar)', 'ماهی سنگسر', 'protein', 118, 22.5, 0, 2.8, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_soof', 'Pike-perch (soof)', 'ماهی سوف', 'protein', 113, 23.4, 0, 1.6, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_kafal', 'Mullet (kafal)', 'ماهی کفال', 'protein', 150, 24.8, 0, 4.9, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_ghobad', 'Mackerel (ghobad)', 'ماهی قباد', 'protein', 205, 23.8, 0, 11.5, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_khalkhal', 'Spanish mackerel', 'ماهی خال‌خالی', 'protein', 158, 22.0, 0, 7.0, 0, [['1 فیله / fillet', 150]]),
  F('p_fish_ozon', 'Sturgeon (ozon boroon)', 'ماهی ازون برون', 'protein', 135, 20.7, 0, 5.2, 0, [['1 فیله / fillet', 150]]),
  F('p_caviar', 'Caviar', 'خاویار', 'protein', 264, 24.6, 4.0, 17.9, 0, [['1 قاشق / tbsp', 16]]),
  F('p_fish_sardine', 'Sardine, canned', 'کنسرو ساردین', 'protein', 208, 24.6, 0, 11.5, 0, [['1 قوطی / can', 120]]),
  F('p_squid', 'Squid, cooked', 'ماهی مرکب', 'protein', 175, 17.9, 7.8, 7.5, 0, null),
  F('p_crab', 'Crab, cooked', 'خرچنگ', 'protein', 97, 19.4, 0, 1.5, 0, null),
  F('p_egg_boiled', 'Egg, hard-boiled', 'تخم مرغ آب‌پز', 'protein', 155, 12.6, 1.1, 10.6, 0, [['1 عدد / egg', 50]]),
  F('p_egg_yolk', 'Egg yolk', 'زرده تخم مرغ', 'protein', 322, 15.9, 3.6, 26.5, 0, [['1 عدد / yolk', 17]]),

  /* ---------- Grains & starch ---------- */
  F('g_rice_white',   'White rice, cooked',   'برنج سفید پخته',  'grain', 130, 2.7, 28, 0.3, 0.4, [['1 cup', 158], ['1 پیمانه', 200]]),
  F('g_rice_brown',   'Brown rice, cooked',   'برنج قهوه‌ای پخته','grain', 123, 2.7, 26, 1, 1.6, [['1 cup', 195]]),
  F('g_bread_white',  'White bread',          'نان سفید',        'grain', 265, 9, 49, 3.2, 2.7, [['1 slice', 30]]),
  F('g_bread_whole',  'Whole wheat bread',    'نان سبوس‌دار',    'grain', 247, 13, 41, 3.4, 7, [['1 slice', 32]]),
  F('g_pasta',        'Pasta, cooked',        'ماکارونی پخته',   'grain', 158, 5.8, 31, 0.9, 1.8, [['1 cup', 140]]),
  F('g_oats',         'Oats, dry',            'جو دوسر (خشک)',   'grain', 389, 16.9, 66, 6.9, 10.6, [['1/2 cup', 40]]),
  F('g_potato',       'Potato, boiled',       'سیب‌زمینی آب‌پز',  'grain', 87, 1.9, 20, 0.1, 1.8, [['1 medium', 173]]),
  F('g_sweet_potato', 'Sweet potato, baked',  'سیب‌زمینی شیرین', 'grain', 90, 2, 21, 0.2, 3.3, null),
  F('g_quinoa',       'Quinoa, cooked',       'کینوا پخته',      'grain', 120, 4.4, 21, 1.9, 2.8, [['1 cup', 185]]),
  F('g_corn',         'Corn, cooked',         'ذرت',             'grain', 96, 3.4, 21, 1.5, 2.4, null),
  F('g_couscous',     'Couscous, cooked',     'کوسکوس',          'grain', 112, 3.8, 23, 0.2, 1.4, null),
  F('g_barley',       'Barley, cooked',       'جو پرک پخته',     'grain', 123, 2.3, 28, 0.4, 3.8, null),

  F('g_bread_barley', 'Barley bread', 'نان جو', 'grain', 246, 8, 48, 2.5, 5.5, [['1 برش / slice', 40]]),
  F('g_baguette', 'Baguette', 'نان باگت', 'grain', 274, 9, 52, 3, 2.3, [['1 عدد / piece', 120]]),
  F('g_toast', 'Toast bread', 'نان تست', 'grain', 265, 9, 49, 3.2, 2.7, [['1 برش / slice', 28]]),
  F('g_burger_bun', 'Burger bun', 'نان همبرگر', 'grain', 279, 9.6, 50, 4.5, 2.2, [['1 عدد / bun', 70]]),
  F('g_pasta_dry', 'Pasta, dry', 'ماکارونی خشک', 'grain', 371, 13, 75, 1.5, 3.2, [['1 بسته / pack', 500]]),
  F('g_reshteh_ash', 'Ash noodles', 'رشته آش', 'grain', 348, 12, 71, 1.4, 3.0, [['1 مشت / handful', 50]]),
  F('g_bulgur', 'Bulgur, dry', 'بلغور', 'grain', 342, 12.3, 76, 1.3, 18, [['1 پیمانه / cup', 140]]),
  F('g_wheat_cooked', 'Wheat, cooked', 'گندم پخته', 'grain', 124, 5, 26, 0.5, 4.0, [['1 کاسه / bowl', 180]]),
  F('g_bran', 'Wheat bran', 'سبوس گندم', 'grain', 216, 15.5, 64.5, 4.3, 42.8, [['1 قاشق / tbsp', 8]]),
  F('g_flour', 'White flour', 'آرد سفید', 'grain', 364, 10.3, 76, 1, 2.7, [['1 پیمانه / cup', 125]]),
  F('g_cornflakes', 'Corn flakes', 'کورن فلکس', 'grain', 357, 7.5, 84, 0.4, 3.3, [['1 کاسه / bowl', 30]]),
  F('g_granola', 'Granola', 'گرانولا', 'grain', 471, 10, 64, 20, 7.0, [['1 کاسه / bowl', 55]]),
  F('g_rusk', 'Rusk / dry toast', 'نان سوخاری', 'grain', 395, 13, 72, 5, 4.5, [['1 عدد / piece', 10]]),

  /* ---------- more pulses and grains ---------- */
  F('v_fava_dry', 'Fava beans, dry', 'باقلا خشک', 'grain', 341, 26.1, 58.3, 1.5, 25.0, [['1 پیمانه / cup', 150]]),
  F('g_barley_gr', 'Cracked barley', 'بلغور جو', 'grain', 352, 9.9, 77.7, 1.2, 15.6, [['1 پیمانه / cup', 140]]),
  F('g_millet', 'Millet, cooked', 'ارزن پخته', 'grain', 119, 3.5, 23.7, 1.0, 1.3, [['1 کاسه / bowl', 174]]),
  F('g_buckwheat', 'Buckwheat, cooked', 'گندم سیاه پخته', 'grain', 92, 3.4, 19.9, 0.6, 2.7, [['1 کاسه / bowl', 168]]),
  F('g_freekeh', 'Freekeh, cooked', 'فریکه پخته', 'grain', 115, 4.6, 23.0, 0.7, 4.2, [['1 کاسه / bowl', 170]]),
  F('v_lentil_red', 'Red lentils, cooked', 'عدس قرمز پخته', 'grain', 116, 9.0, 20.1, 0.4, 7.9, [['1 کاسه / bowl', 198]]),
  F('v_soy_chunks', 'Soy chunks, cooked', 'سویا پروتئینی', 'grain', 168, 16.0, 14.0, 4.5, 5.5, null),

  /* ---------- Dairy ---------- */
  F('d_milk_whole',   'Milk, whole 3%',       'شیر پرچرب',       'dairy', 61, 3.2, 4.8, 3.3, 0, [['1 لیوان / glass', 240]]),
  F('d_milk_low',     'Milk, low fat 1.5%',   'شیر کم‌چرب',      'dairy', 50, 3.4, 4.9, 1.5, 0, [['1 لیوان / glass', 240]]),
  F('d_yogurt',       'Yogurt, plain',        'ماست',            'dairy', 61, 3.5, 4.7, 3.3, 0, [['1 کاسه / bowl', 170]]),
  F('d_yogurt_low',   'Yogurt, low fat',      'ماست کم‌چرب',     'dairy', 48, 4.5, 5.5, 1, 0, [['1 کاسه / bowl', 170]]),
  F('d_greek',        'Greek yogurt, 2%',     'ماست یونانی',     'dairy', 73, 10, 3.9, 1.9, 0, [['1 cup', 227]]),
  F('d_cheese_feta',  'Feta cheese',          'پنیر فتا',        'dairy', 264, 14, 4.1, 21, 0, [['1 برش / slice', 30]]),
  F('d_cheese_white', 'White cheese (Iranian)','پنیر سفید',      'dairy', 253, 15, 3, 20, 0, [['1 برش / slice', 30]]),
  F('d_cheese_ched',  'Cheddar cheese',       'پنیر چدار',       'dairy', 403, 25, 1.3, 33, 0, [['1 slice', 28]]),
  F('d_cottage',      'Cottage cheese',       'پنیر کاتیج',      'dairy', 98, 11, 3.4, 4.3, 0, null),
  F('d_kashk',        'Kashk',                'کشک',             'dairy', 160, 14, 12, 6, 0, [['1 قاشق / tbsp', 20]]),
  F('d_doogh',        'Doogh',                'دوغ',             'drink', 34, 1.8, 2.6, 1.7, 0, [['1 لیوان / glass', 250]]),
  F('d_butter',       'Butter',               'کره',             'fat', 717, 0.9, 0.1, 81, 0, [['1 tbsp', 14]]),
  F('d_cream',        'Cream (heavy)',        'خامه',            'fat', 340, 2.1, 2.8, 36, 0, [['1 tbsp', 15]]),

  F('d_lighvan', 'Lighvan cheese', 'پنیر لیقوان', 'dairy', 292, 17, 2, 24, 0, [['1 برش / slice', 30]]),
  F('d_cream_cheese', 'Cream cheese', 'پنیر خامه‌ای', 'dairy', 342, 6, 4, 34, 0, [['1 قاشق / tbsp', 15]]),
  F('d_mozzarella', 'Mozzarella (pizza cheese)', 'پنیر پیتزا', 'dairy', 300, 22, 2.2, 22, 0, [['1 مشت / handful', 30]]),
  F('d_yogurt_full', 'Yogurt, full fat', 'ماست پرچرب', 'dairy', 88, 3.3, 4.5, 6, 0, [['1 کاسه / bowl', 170]]),
  F('d_chekideh', 'Strained yogurt', 'ماست چکیده', 'dairy', 130, 8, 4, 9, 0, [['1 قاشق / tbsp', 25]]),
  F('d_milk_powder', 'Milk powder', 'شیر خشک', 'dairy', 496, 26, 38, 27, 0, [['1 قاشق / tbsp', 12]]),

  /* ---------- Vegetables ---------- */
  F('v_tomato',       'Tomato',      'گوجه فرنگی',  'veg', 18, 0.9, 3.9, 0.2, 1.2, [['1 medium', 123]]),
  F('v_cucumber',     'Cucumber',    'خیار',        'veg', 15, 0.7, 3.6, 0.1, 0.5, [['1 medium', 200]]),
  F('v_onion',        'Onion',       'پیاز',        'veg', 40, 1.1, 9.3, 0.1, 1.7, [['1 medium', 110]]),
  F('v_lettuce',      'Lettuce',     'کاهو',        'veg', 15, 1.4, 2.9, 0.2, 1.3, null),
  F('v_spinach',      'Spinach',     'اسفناج',      'veg', 23, 2.9, 3.6, 0.4, 2.2, null),
  F('v_broccoli',     'Broccoli',    'کلم بروکلی',  'veg', 34, 2.8, 6.6, 0.4, 2.6, [['1 cup', 91]]),
  F('v_carrot',       'Carrot',      'هویج',        'veg', 41, 0.9, 9.6, 0.2, 2.8, [['1 medium', 61]]),
  F('v_eggplant',     'Eggplant',    'بادمجان',     'veg', 25, 1, 5.9, 0.2, 3, null),
  F('v_zucchini',     'Zucchini',    'کدو سبز',     'veg', 17, 1.2, 3.1, 0.3, 1, null),
  F('v_bellpepper',   'Bell pepper', 'فلفل دلمه‌ای','veg', 31, 1, 6, 0.3, 2.1, null),
  F('v_cauliflower',  'Cauliflower', 'گل کلم',      'veg', 25, 1.9, 5, 0.3, 2, null),
  F('v_greenbean',    'Green beans', 'لوبیا سبز',   'veg', 31, 1.8, 7, 0.2, 2.7, null),
  F('v_mushroom',     'Mushroom',    'قارچ',        'veg', 22, 3.1, 3.3, 0.3, 1, null),
  F('v_garlic',       'Garlic',      'سیر',         'veg', 149, 6.4, 33, 0.5, 2.1, [['1 clove', 3]]),
  F('v_herbs',        'Fresh herbs (sabzi)', 'سبزی خوردن', 'veg', 30, 2.5, 4.5, 0.5, 3, null),

  F('v_pumpkin', 'Pumpkin', 'کدو حلوایی', 'veg', 26, 1, 6.5, 0.1, 0.5, [['1 کاسه / bowl', 116]]),
  F('v_turnip', 'Turnip', 'شلغم', 'veg', 28, 0.9, 6.4, 0.1, 1.8, [['1 عدد / piece', 122]]),
  F('v_beet', 'Beetroot, cooked', 'چغندر', 'veg', 44, 1.7, 10, 0.2, 2.0, [['1 عدد / piece', 82]]),
  F('v_cabbage', 'Cabbage', 'کلم برگ', 'veg', 25, 1.3, 5.8, 0.1, 2.5, [['1 کاسه / bowl', 89]]),
  F('v_redcabbage', 'Red cabbage', 'کلم قرمز', 'veg', 31, 1.4, 7.4, 0.2, 2.1, [['1 کاسه / bowl', 89]]),
  F('v_radish', 'Radish', 'تربچه', 'veg', 16, 0.7, 3.4, 0.1, 1.6, [['1 عدد / piece', 5]]),
  F('v_basil', 'Basil', 'ریحان', 'veg', 23, 3.2, 2.6, 0.6, 1.6, [['1 مشت / handful', 20]]),
  F('v_parsley', 'Parsley', 'جعفری', 'veg', 36, 3, 6.3, 0.8, 3.3, [['1 مشت / handful', 20]]),
  F('v_coriander', 'Coriander', 'گشنیز', 'veg', 23, 2.1, 3.7, 0.5, 2.8, [['1 مشت / handful', 20]]),
  F('v_dill', 'Dill', 'شوید', 'veg', 43, 3.5, 7, 1.1, 2.1, [['1 مشت / handful', 20]]),
  F('v_mint', 'Mint', 'نعناع', 'veg', 44, 3.3, 8.4, 0.7, 6.8, [['1 مشت / handful', 20]]),
  F('v_scallion', 'Spring onion', 'پیازچه', 'veg', 32, 1.8, 7.3, 0.2, 2.6, [['1 عدد / piece', 15]]),
  F('v_leek', 'Leek', 'تره‌فرنگی', 'veg', 61, 1.5, 14.2, 0.3, 1.8, [['1 عدد / piece', 89]]),
  F('v_okra', 'Okra', 'بامیه (سبزی)', 'veg', 33, 1.9, 7.5, 0.2, 3.2, [['1 کاسه / bowl', 100]]),
  F('v_chili', 'Hot pepper', 'فلفل تند', 'veg', 40, 1.9, 8.8, 0.4, 1.5, [['1 عدد / piece', 15]]),
  F('v_artichoke', 'Artichoke', 'کنگر', 'veg', 47, 3.3, 10.5, 0.2, 5.4, [['1 عدد / piece', 128]]),
  F('v_celery', 'Celery', 'کرفس', 'veg', 16, 0.7, 3, 0.2, 1.6, [['1 ساقه / stalk', 40]]),
  F('v_peas', 'Green peas', 'نخود سبز', 'veg', 81, 5.4, 14.5, 0.4, 5.7, [['1 کاسه / bowl', 145]]),
  F('v_fava', 'Fava beans, cooked', 'باقالا', 'veg', 88, 7.6, 17.6, 0.4, 5.4, [['1 کاسه / bowl', 170]]),
  F('v_pinto', 'Pinto beans, cooked', 'لوبیا چیتی', 'veg', 143, 9.1, 26, 0.7, 9.0, [['1 کاسه / bowl', 171]]),
  F('v_splitpea', 'Split peas, cooked', 'لپه', 'veg', 116, 8.3, 20, 0.4, 8.0, [['1 کاسه / bowl', 196]]),
  F('v_mung', 'Mung beans, cooked', 'ماش', 'veg', 105, 7, 19, 0.4, 7.6, [['1 کاسه / bowl', 202]]),
  F('v_soy', 'Soybeans, cooked', 'سویا', 'veg', 173, 16.6, 9.9, 9, 6.0, [['1 کاسه / bowl', 172]]),
  F('v_cornsweet', 'Sweet corn', 'ذرت شیرین', 'veg', 86, 3.2, 19, 1.2, 2.7, [['1 بلال / cob', 90]]),

  /* ---------- Fruit ---------- */
  F('fr_apple',   'Apple',       'سیب',        'fruit', 52, 0.3, 14, 0.2, 2.4, [['1 medium', 182]]),
  F('fr_banana',  'Banana',      'موز',        'fruit', 89, 1.1, 23, 0.3, 2.6, [['1 medium', 118]]),
  F('fr_orange',  'Orange',      'پرتقال',     'fruit', 47, 0.9, 12, 0.1, 2.4, [['1 medium', 131]]),
  F('fr_grape',   'Grapes',      'انگور',      'fruit', 69, 0.7, 18, 0.2, 0.9, [['1 cup', 151]]),
  F('fr_water',   'Watermelon',  'هندوانه',    'fruit', 30, 0.6, 7.6, 0.2, 0.4, [['1 slice', 280]]),
  F('fr_melon',   'Melon',       'طالبی',      'fruit', 34, 0.8, 8.2, 0.2, 0.9, null),
  F('fr_date',    'Dates',       'خرما',       'fruit', 282, 2.5, 75, 0.4, 8, [['1 عدد / date', 24]]),
  F('fr_pome',    'Pomegranate', 'انار',       'fruit', 83, 1.7, 19, 1.2, 4, [['1 medium', 282]]),
  F('fr_straw',   'Strawberry',  'توت فرنگی',  'fruit', 32, 0.7, 7.7, 0.3, 2, [['1 cup', 152]]),
  F('fr_kiwi',    'Kiwi',        'کیوی',       'fruit', 61, 1.1, 15, 0.5, 3, [['1 medium', 75]]),
  F('fr_peach',   'Peach',       'هلو',        'fruit', 39, 0.9, 10, 0.3, 1.5, [['1 medium', 150]]),
  F('fr_cherry',  'Cherry',      'گیلاس',      'fruit', 63, 1.1, 16, 0.2, 2.1, null),
  F('fr_fig',     'Fig, dried',  'انجیر خشک',  'fruit', 249, 3.3, 64, 0.9, 9.8, null),
  F('fr_raisin',  'Raisins',     'کشمش',       'fruit', 299, 3.1, 79, 0.5, 3.7, [['1 قاشق / tbsp', 15]]),
  F('fr_avocado', 'Avocado',     'آووکادو',    'fruit', 160, 2, 8.5, 15, 6.7, [['1/2 medium', 100]]),

  F('fr_persimmon', 'Persimmon', 'خرمالو', 'fruit', 70, 0.6, 18.6, 0.2, 3.6, [['1 عدد / piece', 168]]),
  F('fr_tangerine', 'Tangerine', 'نارنگی', 'fruit', 53, 0.8, 13.3, 0.3, 1.8, [['1 عدد / piece', 88]]),
  F('fr_sweetlemon', 'Sweet lemon', 'لیمو شیرین', 'fruit', 43, 0.8, 11, 0.2, 2.8, [['1 عدد / piece', 130]]),
  F('fr_lemon', 'Lemon', 'لیموترش', 'fruit', 29, 1.1, 9.3, 0.3, 2.8, [['1 عدد / piece', 60]]),
  F('fr_sour_orange', 'Sour orange', 'نارنج', 'fruit', 34, 0.7, 8.5, 0.2, 2.3, [['1 عدد / piece', 120]]),
  F('fr_grapefruit', 'Grapefruit', 'گریپ‌فروت', 'fruit', 42, 0.8, 10.7, 0.1, 1.6, [['نصف / half', 123]]),
  F('fr_plum', 'Plum', 'آلو', 'fruit', 46, 0.7, 11.4, 0.3, 1.4, [['1 عدد / piece', 66]]),
  F('fr_apricot', 'Apricot', 'زردآلو', 'fruit', 48, 1.4, 11, 0.4, 2.0, [['1 عدد / piece', 35]]),
  F('fr_nectarine', 'Nectarine', 'شلیل', 'fruit', 44, 1.1, 10.6, 0.3, 1.7, [['1 عدد / piece', 142]]),
  F('fr_pear', 'Pear', 'گلابی', 'fruit', 57, 0.4, 15.2, 0.1, 3.1, [['1 عدد / piece', 178]]),
  F('fr_quince', 'Quince', 'به', 'fruit', 57, 0.4, 15.3, 0.1, 1.9, [['1 عدد / piece', 92]]),
  F('fr_loquat', 'Loquat / medlar', 'ازگیل', 'fruit', 47, 0.4, 12.1, 0.2, 1.7, [['1 عدد / piece', 16]]),
  F('fr_mulberry', 'Mulberry', 'توت', 'fruit', 43, 1.4, 9.8, 0.4, 1.7, [['1 کاسه / bowl', 140]]),
  F('fr_black_mul', 'Black mulberry', 'شاه‌توت', 'fruit', 43, 1.4, 9.8, 0.4, 1.7, [['1 کاسه / bowl', 140]]),
  F('fr_greengage', 'Green plum', 'گوجه سبز', 'fruit', 41, 0.8, 9.5, 0.2, 1.5, [['1 مشت / handful', 60]]),
  F('fr_sourcherry', 'Sour cherry', 'آلبالو', 'fruit', 50, 1.0, 12.2, 0.3, 1.6, [['1 کاسه / bowl', 155]]),
  F('fr_fig_fresh', 'Fig, fresh', 'انجیر تازه', 'fruit', 74, 0.8, 19.2, 0.3, 2.9, [['1 عدد / piece', 50]]),
  F('fr_honeydew', 'Honeydew melon', 'خربزه', 'fruit', 36, 0.5, 9.1, 0.1, 0.8, [['1 برش / slice', 160]]),
  F('fr_mango', 'Mango', 'انبه', 'fruit', 60, 0.8, 15, 0.4, 1.6, [['1 عدد / piece', 200]]),
  F('fr_pineapple', 'Pineapple', 'آناناس', 'fruit', 50, 0.5, 13.1, 0.1, 1.4, [['1 برش / slice', 84]]),
  F('fr_coconut', 'Coconut, fresh', 'نارگیل', 'fruit', 354, 3.3, 15.2, 33.5, 9.0, [['1 تکه / piece', 45]]),
  F('fr_senjed', 'Oleaster (senjed)', 'سنجد', 'fruit', 315, 6, 70, 1.5, 10, [['1 مشت / handful', 30]]),
  F('fr_jujube', 'Jujube (annab)', 'عناب', 'fruit', 79, 1.2, 20.2, 0.2, 10, [['1 مشت / handful', 30]]),
  F('fr_cornel', 'Cornelian cherry', 'زغال‌اخته', 'fruit', 46, 0.4, 12, 0.1, 4.4, [['1 کاسه / bowl', 120]]),
  F('fr_barberry', 'Barberry, dried', 'زرشک', 'fruit', 320, 3, 74, 1, 10, [['1 قاشق / tbsp', 10]]),
  F('fr_raspberry', 'Raspberry', 'تمشک', 'fruit', 52, 1.2, 11.9, 0.7, 6.5, [['1 کاسه / bowl', 123]]),
  F('fr_blueberry', 'Blueberry', 'بلوبری', 'fruit', 57, 0.7, 14.5, 0.3, 2.4, [['1 کاسه / bowl', 148]]),
  F('fr_prune', 'Prunes', 'آلو خشک', 'fruit', 240, 2.2, 64, 0.4, 7.1, [['1 عدد / piece', 9]]),
  F('fr_apricot_dry', 'Dried apricot', 'برگه هلو', 'fruit', 241, 3.4, 63, 0.5, 7.3, [['1 عدد / piece', 8]]),

  /* ---------- Nuts & seeds ---------- */
  F('n_almond',   'Almonds',       'بادام',      'nut', 579, 21, 22, 50, 12.5, [['10 عدد / nuts', 12]]),
  F('n_walnut',   'Walnuts',       'گردو',       'nut', 654, 15, 14, 65, 6.7, [['1 عدد / half', 8]]),
  F('n_pista',    'Pistachios',    'پسته',       'nut', 560, 20, 28, 45, 10.3, [['1 مشت / handful', 30]]),
  F('n_cashew',   'Cashews',       'بادام هندی', 'nut', 553, 18, 30, 44, 3.3, null),
  F('n_hazel',    'Hazelnuts',     'فندق',       'nut', 628, 15, 17, 61, 9.7, null),
  F('n_peanut',   'Peanuts',       'بادام زمینی','nut', 567, 26, 16, 49, 8.5, null),
  F('n_pb',       'Peanut butter', 'کره بادام زمینی','nut', 588, 25, 20, 50, 6, [['1 tbsp', 16]]),
  F('n_sunflower','Sunflower seeds','تخمه آفتابگردان','nut', 584, 21, 20, 51, 8.6, null),
  F('n_pumpkin',  'Pumpkin seeds', 'تخمه کدو',   'nut', 559, 30, 11, 49, 6, null),
  F('n_chia',     'Chia seeds',    'دانه چیا',   'nut', 486, 17, 42, 31, 34, [['1 tbsp', 12]]),
  F('n_sesame',   'Sesame / tahini','ارده',      'nut', 595, 17, 21, 54, 9.3, [['1 tbsp', 15]]),

  F('n_pista_raw', 'Pistachios, unsalted', 'پسته خام', 'nut', 560, 20, 28, 45, 10.3, [['1 مشت / handful', 30]]),
  F('n_almond_raw', 'Almonds, raw', 'بادام خام', 'nut', 579, 21, 22, 50, 12.5, [['1 مشت / handful', 30]]),
  F('n_apricot_kernel', 'Apricot kernel', 'مغز زردآلو', 'nut', 520, 20, 20, 44, 9, [['1 مشت / handful', 25]]),
  F('n_flax', 'Flaxseed', 'بذر کتان', 'nut', 534, 18, 29, 42, 27, [['1 قاشق / tbsp', 10]]),
  F('n_melon_seed', 'Melon seeds', 'تخمه خربزه', 'nut', 557, 28, 15, 44, 4, [['1 مشت / handful', 25]]),
  F('n_coconut_dry', 'Desiccated coconut', 'نارگیل خشک', 'nut', 660, 6.9, 24, 64, 16, [['1 قاشق / tbsp', 8]]),
  F('n_walnut_kernel', 'Walnut kernels', 'مغز گردو', 'nut', 654, 15, 14, 65, 6.7, [['1 مشت / handful', 30]]),

  /* ---------- Fats & oils ---------- */
  F('o_olive',    'Olive oil',     'روغن زیتون', 'fat', 884, 0, 0, 100, 0, [['1 tbsp', 14]]),
  F('o_sun',      'Sunflower oil', 'روغن آفتابگردان','fat', 884, 0, 0, 100, 0, [['1 tbsp', 14]]),
  F('o_olives',   'Olives',        'زیتون',      'fat', 115, 0.8, 6, 11, 3.2, [['5 عدد / olives', 20]]),
  F('o_mayo',     'Mayonnaise',    'سس مایونز',  'fat', 680, 1, 0.6, 75, 0, [['1 tbsp', 14]]),

  F('o_ghee', 'Ghee / animal fat', 'روغن حیوانی', 'fat', 900, 0, 0, 100, 0, [['1 قاشق / tbsp', 14]]),
  F('o_canola', 'Canola oil', 'روغن کانولا', 'fat', 884, 0, 0, 100, 0, [['1 قاشق / tbsp', 14]]),
  F('o_sesame_oil', 'Sesame oil', 'روغن کنجد', 'fat', 884, 0, 0, 100, 0, [['1 قاشق / tbsp', 14]]),
  F('o_ketchup', 'Ketchup', 'سس گوجه', 'fat', 101, 1.3, 25, 0.1, 0.3, [['1 قاشق / tbsp', 17]]),
  F('o_sauce_salad', 'Salad dressing', 'سس سالاد', 'fat', 450, 1, 10, 45, 0, [['1 قاشق / tbsp', 15]]),

  /* ---------- cooking staples and spices ---------- */
  F('s_date_syrup', 'Date syrup', 'شیره خرما', 'fat', 290, 1.5, 72.0, 0.2, 1.0, [['1 قاشق / tbsp', 21]]),
  F('o_vinegar_bal', 'Balsamic vinegar', 'سرکه بالزامیک', 'fat', 70, 0.5, 17.0, 0, 0, [['1 قاشق / tbsp', 16]]),
  F('o_vinegar', 'Vinegar', 'سرکه', 'fat', 21, 0, 0.9, 0, 0, [['1 قاشق / tbsp', 15]]),
  F('sp_saffron', 'Saffron', 'زعفران', 'fat', 310, 11.4, 65.4, 5.9, 3.9, [['1 گرم / gram', 1]]),
  F('sp_cinnamon', 'Cinnamon', 'دارچین', 'fat', 247, 4.0, 80.6, 1.2, 53.1, [['1 قاشق / tsp', 3]]),
  F('sp_turmeric', 'Turmeric', 'زردچوبه', 'fat', 312, 9.7, 67.1, 3.3, 22.7, [['1 قاشق / tsp', 3]]),
  F('sp_salt', 'Salt', 'نمک', 'fat', 0, 0, 0, 0, 0, [['1 قاشق / tsp', 6]]),
  F('sp_pepper', 'Black pepper', 'فلفل سیاه', 'fat', 251, 10.4, 63.9, 3.3, 25.3, [['1 قاشق / tsp', 2]]),
  F('sp_sumac', 'Sumac', 'سماق', 'fat', 275, 5.0, 62.0, 4.0, 30.0, [['1 قاشق / tsp', 3]]),

  /* ---------- Drinks ---------- */
  F('dr_water',   'Water',         'آب',         'drink', 0, 0, 0, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_tea',     'Tea, plain',    'چای',        'drink', 1, 0, 0.2, 0, 0, [['1 لیوان / glass', 200]]),
  F('dr_coffee',  'Coffee, black', 'قهوه',       'drink', 2, 0.3, 0, 0, 0, [['1 cup', 240]]),
  F('dr_cola',    'Cola',          'نوشابه',     'drink', 42, 0, 10.6, 0, 0, [['1 قوطی / can', 330]]),
  F('dr_juice_o', 'Orange juice',  'آب پرتقال',  'drink', 45, 0.7, 10.4, 0.2, 0.2, [['1 لیوان / glass', 250]]),
  F('dr_energy',  'Energy drink',  'نوشیدنی انرژی','drink', 45, 0, 11, 0, 0, [['1 قوطی / can', 250]]),

  F('dr_doogh_gaz', 'Doogh, carbonated', 'دوغ گازدار', 'drink', 34, 1.8, 2.6, 1.7, 0, [['1 بطری / bottle', 280]]),
  F('dr_delster', 'Malt drink (Delster)', 'ماءالشعیر (دلستر)', 'drink', 45, 0.3, 11, 0, 0, [['1 قوطی / can', 330]]),
  F('dr_ablimoo', 'Sharbat Ablimoo', 'شربت آبلیمو', 'drink', 60, 0, 15, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_sekanjabin', 'Sekanjabin', 'سکنجبین', 'drink', 80, 0, 20, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_bidmeshk', 'Sharbat Bidmeshk', 'شربت بیدمشک', 'drink', 64, 0, 16, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_zaferan', 'Saffron sharbat', 'شربت زعفران', 'drink', 72, 0, 18, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_albaloo', 'Sour cherry sharbat', 'شربت آلبالو', 'drink', 80, 0, 20, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_golab', 'Rosewater sharbat', 'شربت گلاب', 'drink', 64, 0, 16, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_khakshir', 'Khakshir drink', 'خاکشیر', 'drink', 48, 0.5, 11, 0.3, 1.0, [['1 لیوان / glass', 250]]),
  F('dr_tokhm_sharbati', 'Basil seed drink', 'تخم شربتی', 'drink', 40, 0.4, 9, 0.2, 1.2, [['1 لیوان / glass', 250]]),
  F('dr_havij', 'Carrot juice', 'آب هویج', 'drink', 40, 0.9, 9.3, 0.2, 0.8, [['1 لیوان / glass', 250]]),
  F('dr_havij_bastani', 'Carrot juice with ice cream', 'آب هویج بستنی', 'drink', 95, 1.8, 17, 2.5, 0.6, [['1 لیوان / glass', 300]]),
  F('dr_talebi', 'Melon juice', 'آب طالبی', 'drink', 34, 0.6, 8, 0.2, 0.4, [['1 لیوان / glass', 250]]),
  F('dr_anar', 'Pomegranate juice', 'آب انار', 'drink', 54, 0.15, 13, 0.3, 0.1, [['1 لیوان / glass', 250]]),
  F('dr_sib', 'Apple juice', 'آب سیب', 'drink', 46, 0.1, 11.3, 0.1, 0.2, [['1 لیوان / glass', 250]]),
  F('dr_ananas', 'Pineapple juice', 'آب آناناس', 'drink', 53, 0.4, 12.9, 0.1, 0.2, [['1 لیوان / glass', 250]]),
  F('dr_limoo', 'Lemon juice', 'آب لیموترش', 'drink', 22, 0.4, 6.9, 0.2, 0.3, [['1 قاشق / tbsp', 15]]),
  F('dr_zereshk', 'Barberry juice', 'آب زرشک', 'drink', 48, 0.4, 11.5, 0.2, 0.3, [['1 لیوان / glass', 250]]),
  F('dr_juice_box', 'Packaged fruit juice', 'آبمیوه پاکتی', 'drink', 45, 0.3, 11, 0.1, 0.1, [['1 پاکت / carton', 200]]),
  F('dr_tea_green', 'Green tea', 'چای سبز', 'drink', 1, 0, 0.2, 0, 0, [['1 لیوان / glass', 200]]),
  F('dr_damnoosh', 'Herbal infusion', 'دمنوش', 'drink', 1, 0, 0.2, 0, 0, [['1 لیوان / glass', 200]]),
  F('dr_ghahve_turk', 'Turkish coffee', 'قهوه ترک', 'drink', 2, 0.3, 0.3, 0, 0, [['1 فنجان / cup', 80]]),
  F('dr_nescafe', 'Instant coffee mix (3-in-1)', 'نسکافه ۳ در ۱', 'drink', 81, 1.5, 12, 3, 0.2, [['1 لیوان / glass', 200]]),
  F('dr_cappuccino', 'Cappuccino', 'کاپوچینو', 'drink', 46, 2.5, 4.5, 2, 0, [['1 فنجان / cup', 180]]),
  F('dr_hot_choc', 'Hot chocolate', 'شیر کاکائو داغ', 'drink', 90, 3.2, 13, 2.8, 0.8, [['1 لیوان / glass', 250]]),
  F('dr_milk_choco', 'Chocolate milk', 'شیر کاکائو', 'drink', 77, 3.2, 10.4, 2.5, 0.5, [['1 پاکت / carton', 200]]),
  F('dr_milk_banana', 'Banana milk', 'شیر موز', 'drink', 82, 3, 12, 2.5, 0.4, [['1 لیوان / glass', 250]]),
  F('dr_smoothie', 'Fruit smoothie', 'اسموتی میوه', 'drink', 68, 1, 15, 0.5, 1.2, [['1 لیوان / glass', 300]]),
  F('dr_cola_diet', 'Diet cola', 'نوشابه رژیمی', 'drink', 0.4, 0, 0.1, 0, 0, [['1 قوطی / can', 330]]),
  F('dr_ice_tea', 'Iced tea', 'آیس‌تی', 'drink', 32, 0, 8, 0, 0, [['1 بطری / bottle', 330]]),
  F('dr_soda_water', 'Sparkling water', 'آب معدنی گازدار', 'drink', 0, 0, 0, 0, 0, [['1 بطری / bottle', 330]]),
  F('dr_coconut_w', 'Coconut water', 'آب نارگیل', 'drink', 19, 0.7, 3.7, 0.2, 1.1, [['1 لیوان / glass', 250]]),
  F('dr_milk_almond', 'Almond milk, unsweetened', 'شیر بادام', 'drink', 24, 0.5, 3, 1.1, 0.4, [['1 لیوان / glass', 240]]),
  F('dr_yogurt_drink', 'Drinking yogurt', 'ماست نوشیدنی', 'drink', 71, 3.1, 12, 1.2, 0, [['1 بطری / bottle', 200]]),

  /* ---------- Snacks & sweets ---------- */
  F('s_choc_dark','Dark chocolate 70%','شکلات تلخ','snack', 598, 7.8, 46, 42.6, 11, [['1 مربع / square', 10]]),
  F('s_choc_milk','Milk chocolate','شکلات شیری',  'snack', 535, 7.6, 59, 30, 3.4, null),
  F('s_chips',    'Potato chips',  'چیپس',       'snack', 536, 7, 53, 35, 4.8, [['1 بسته / bag', 40]]),
  F('s_popcorn',  'Popcorn, plain','پاپ‌کورن',   'snack', 387, 13, 78, 4.5, 15, null),
  F('s_biscuit',  'Biscuit / cookie','بیسکویت',  'snack', 460, 6, 68, 18, 2, [['1 عدد / piece', 15]]),
  F('s_cake',     'Sponge cake',   'کیک',        'snack', 350, 5, 52, 13, 1, [['1 برش / slice', 80]]),
  F('s_icecream', 'Ice cream',     'بستنی',      'snack', 207, 3.5, 24, 11, 0.7, [['1 اسکوپ / scoop', 65]]),
  F('s_honey',    'Honey',         'عسل',        'snack', 304, 0.3, 82, 0, 0.2, [['1 tbsp', 21]]),
  F('s_sugar',    'Sugar',         'شکر',        'snack', 387, 0, 100, 0, 0, [['1 tsp', 4]]),
  F('s_jam',      'Jam',           'مربا',       'snack', 278, 0.4, 69, 0.1, 1, [['1 tbsp', 20]]),

  F('sw_gaz', 'Gaz (nougat)', 'گز', 'snack', 435, 5, 70, 15, 1.5, [['1 عدد / piece', 20]]),
  F('sw_sohan', 'Sohan', 'سوهان', 'snack', 469, 6, 55, 25, 1.2, [['1 عدد / piece', 25]]),
  F('sw_baghlava', 'Baghlava', 'باقلوا', 'snack', 449, 6, 50, 25, 1.8, [['1 عدد / piece', 30]]),
  F('sw_nan_berenji', 'Nan-e Berenji', 'نان برنجی', 'snack', 440, 5, 60, 20, 0.8, [['1 عدد / piece', 15]]),
  F('sw_nan_nokhod', 'Nan-e Nokhodchi', 'نان نخودچی', 'snack', 446, 7, 55, 22, 2.0, [['1 عدد / piece', 10]]),
  F('sw_nan_chai', 'Nan-e Chai', 'نان چایی', 'snack', 434, 6, 62, 18, 1.4, [['1 عدد / piece', 15]]),
  F('sw_koloocheh', 'Koloocheh', 'کلوچه', 'snack', 418, 6, 58, 18, 1.6, [['1 عدد / piece', 60]]),
  F('sw_zoolbia', 'Zoolbia', 'زولبیا', 'snack', 432, 3, 60, 20, 0.5, [['1 عدد / piece', 25]]),
  F('sw_bamieh', 'Bamieh (sweet)', 'بامیه (شیرینی)', 'snack', 424, 3, 58, 20, 0.5, [['1 عدد / piece', 25]]),
  F('sw_ranginak', 'Ranginak', 'رنگینک', 'snack', 402, 5, 55, 18, 4.0, [['1 برش / piece', 45]]),
  F('sw_masghati', 'Masghati', 'مسقطی', 'snack', 267, 0.5, 55, 5, 0.3, [['1 عدد / piece', 30]]),
  F('sw_pashmak', 'Pashmak', 'پشمک', 'snack', 387, 2, 88, 3, 0.2, [['1 مشت / handful', 25]]),
  F('sw_noghl', 'Noghl', 'نقل', 'snack', 396, 2, 88, 4, 0.3, [['1 قاشق / tbsp', 15]]),
  F('sw_ghotab', 'Ghotab', 'قطاب', 'snack', 449, 6, 50, 25, 1.5, [['1 عدد / piece', 25]]),
  F('sw_shirini_tar', 'Cream pastry', 'شیرینی تر', 'snack', 356, 4, 40, 20, 0.7, [['1 عدد / piece', 55]]),
  F('sw_shirini_khoshk', 'Dry pastry', 'شیرینی خشک', 'snack', 444, 6, 60, 20, 1.2, [['1 عدد / piece', 20]]),
  F('sw_cake_yazdi', 'Cake Yazdi', 'کیک یزدی', 'snack', 400, 5, 50, 20, 0.8, [['1 عدد / piece', 55]]),
  F('sw_halva_ardeh', 'Halva Ardeh', 'حلوا ارده', 'snack', 518, 12, 50, 30, 4.0, [['1 قاشق / tbsp', 20]]),
  F('sw_shireh', 'Grape syrup', 'شیره انگور', 'snack', 302, 0.5, 75, 0, 0.2, [['1 قاشق / tbsp', 21]]),
  F('sw_looz', 'Looz-e Nargil', 'لوز نارگیل', 'snack', 434, 4, 55, 22, 3.0, [['1 عدد / piece', 15]]),
  F('sw_tar_halva', 'Tar Halva', 'تر حلوا', 'snack', 354, 3, 45, 18, 0.6, [['1 قاشق / tbsp', 25]]),
  F('sw_bastani_sonati', 'Traditional ice cream', 'بستنی سنتی', 'snack', 236, 4, 28, 12, 0.3, [['1 اسکوپ / scoop', 80]]),
  F('sw_faloodeh', 'Faloodeh', 'فالوده', 'snack', 140, 0.5, 34, 0.2, 0.2, [['1 کاسه / bowl', 180]]),
  F('sw_ghand', 'Sugar cube', 'قند', 'snack', 387, 0, 100, 0, 0, [['1 حبه / cube', 4]]),
  F('sw_nabat', 'Nabat', 'نبات', 'snack', 387, 0, 100, 0, 0, [['1 عدد / piece', 8]]),
  F('sn_pofak', 'Pofak (cheese puffs)', 'پفک', 'snack', 514, 6, 55, 30, 1.5, [['1 بسته / bag', 60]]),
  F('sn_corn_mex', 'Mexican corn cup', 'ذرت مکزیکی', 'snack', 168, 4, 20, 8, 2.2, [['1 لیوان / cup', 200]]),
  F('sn_nokhodchi', 'Roasted chickpeas', 'نخودچی', 'snack', 374, 19, 61, 6, 11, [['1 مشت / handful', 30]]),
  F('sn_tokhme_hend', 'Watermelon seeds', 'تخمه هندوانه', 'snack', 595, 28, 15, 47, 4.0, [['1 مشت / handful', 25]]),
  F('sn_lavashak', 'Lavashak', 'لواشک', 'snack', 308, 1, 75, 0.5, 3.0, [['1 برگ / sheet', 20]]),
  F('sn_alucheh', 'Alucheh', 'آلوچه', 'snack', 287, 1, 70, 0.3, 2.5, [['1 مشت / handful', 30]]),
  F('sn_bargeh', 'Dried apricot (bargeh)', 'برگه زردآلو', 'snack', 241, 3.4, 63, 0.5, 7.3, [['1 عدد / piece', 8]]),
  F('sn_ghaysi', 'Ghaysi', 'قیسی', 'snack', 241, 3.4, 63, 0.5, 7.3, [['1 عدد / piece', 8]]),
  F('sn_toot_khoshk', 'Dried mulberry', 'توت خشک', 'snack', 360, 3.4, 88, 0.6, 5.0, [['1 مشت / handful', 30]]),
  F('sn_choobshoor', 'Pretzel sticks', 'چوب شور', 'snack', 387, 10, 80, 3, 3.0, [['1 بسته / bag', 35]]),
  F('sn_wafer', 'Wafer', 'ویفر', 'snack', 493, 5, 62, 25, 1.5, [['1 عدد / bar', 35]]),
  F('sn_pastil', 'Gummy sweets', 'پاستیل', 'snack', 338, 6, 78, 0.2, 0, [['1 بسته / bag', 40]]),
  F('sn_choc_spread', 'Chocolate spread', 'شکلات صبحانه', 'snack', 531, 6, 57, 31, 3.0, [['1 قاشق / tbsp', 20]]),
  F('sn_cracker', 'Crackers', 'کراکر', 'snack', 437, 9, 70, 13, 2.5, [['1 بسته / pack', 30]]),
  F('sn_donut', 'Donut', 'دونات', 'snack', 421, 5, 51, 22, 1.5, [['1 عدد / piece', 60]]),
  F('sn_croissant', 'Croissant', 'کروسان', 'snack', 406, 8, 46, 21, 2.6, [['1 عدد / piece', 60]]),

  /* ---------- diet and sports items ---------- */
  F('su_bcaa', 'BCAA powder', 'بی‌سی‌ای‌ای', 'supp', 20, 5.0, 0, 0, 0, [['1 اسکوپ / scoop', 7]]),
  F('su_stevia', 'Stevia', 'استویا', 'supp', 0, 0, 0, 0, 0, [['1 قاشق / tsp', 1]]),
  F('s_sugar_brown', 'Brown sugar', 'شکر قهوه‌ای', 'supp', 380, 0, 98.1, 0, 0, [['1 قاشق / tsp', 4]]),
  F('g_bread_diet', 'Diet bread', 'نان رژیمی', 'supp', 240, 11.0, 44.0, 2.0, 8.0, [['1 برش / slice', 25]]),

  /* ---------- Supplements ---------- */
  F('su_whey',    'Whey protein powder','پودر پروتئین وی','supp', 400, 80, 8, 5, 0, [['1 اسکوپ / scoop', 30]]),
  F('su_casein',  'Casein protein',     'کازئین',        'supp', 370, 76, 8, 3, 0, [['1 scoop', 32]]),
  F('su_creatine','Creatine monohydrate','کراتین',       'supp', 0, 0, 0, 0, 0, [['1 tsp', 5]]),
  F('su_mass',    'Mass gainer',        'گینر',          'supp', 380, 20, 65, 4, 2, [['1 scoop', 100]]),
  F('su_bar',     'Protein bar',        'پروتئین بار',   'supp', 350, 30, 35, 10, 5, [['1 عدد / bar', 60]]),

/* ---------- branded products, from their own labels ----------
   Each row is one packaged product, with the barcode it carries. The figures
   are the ones printed on that package, recorded on Open Food Facts and checked
   twice: the stated energy has to agree with the stated macros, and the whole
   label has to be plausible for that kind of food.

   These are deliberately the only rows that name a brand. A generic row keeps a
   generic name even when a brand's name finds it through an alias, because
   putting a company's name on a figure that did not come from its label would
   borrow a trust the number has not earned.

   Two products were left out rather than repaired: one doogh carrying a
   yogurt's fat figure, and a biscuit claiming no protein at all.             */
  B('br_kalleh_milk_zero', 'Fat-free, Lactose-free, ZeroMilk', 'شیر بدون لاکتوز و بدون چربی', 'کاله', '6260161505705', 'dairy', 32, 3, 5, 0, 0, [['۱ لیوان', 200], ['۱ پاکت', 1000]]),
  B('br_kalleh_milk_full', 'Full Fat Milk', 'شیر پرچرب', 'کاله', '6267287300658', 'dairy', 60, 3, 4.8, 3, 0, [['۱ لیوان', 200], ['۱ پاکت', 1000]]),
  B('br_kalleh_yog_prob', 'Probiotic Full Cream Yoghurt', 'ماست پروبیوتیک پرچرب', 'کاله', '6260161513106', 'dairy', 126, 4, 5, 10, 0, [['۱ کاسه', 150]]),
  B('br_kalleh_skyr', 'Pro Kaleh Iceland Yogurt (Sykr, with 8% Casein and 2% Whey protein)', 'ماست ایسلندی پروتئینه (اسکیر)', 'کاله', '6260161534118', 'dairy', 52, 10, 3, 0, 0, [['۱ ظرف', 200]]),
  B('br_kalleh_yog_pom', 'Pro yogurt pomegranate', 'ماست پروتئینه انار', 'کاله', '6260161552181', 'dairy', 56, 8, 6, 0, 0.8, [['۱ ظرف', 200]]),
  B('br_kalleh_yog_seven', 'Yogurt Lactose Free Seven', 'ماست بدون لاکتوز سون', 'کاله', '6260161570857', 'dairy', 69, 4, 4.1, 4, 0, [['۱ کاسه', 150]]),
  B('br_kalleh_yog_veg', 'Vegetable Pro Yogurt', 'ماست پروتئینه سبزیجات', 'کاله', '6260161574060', 'dairy', 49, 8.7, 3.5, 0, 0.2, [['۱ ظرف', 400]]),
  B('br_kalleh_cream_chz', 'Cream Cheese With Added Protein', 'پنیر خامه‌ای پروتئینه', 'کاله', '6260161581747', 'dairy', 186, 20, 4, 10, 1, [['۱ قاشق غذاخوری', 15]]),
  B('br_kalleh_majan', 'Majan', 'نوشیدنی ماجان', 'کاله', '6260161538703', 'drink', 47, 3.2, 4.6, 1.5, 0, [['۱ بطری', 200]]),
  B('br_kalleh_protonic', 'Protonic Isotonic Sports Drink Lime', 'نوشیدنی ورزشی ایزوتونیک پروتونیک', 'کاله', '6260161563859', 'drink', 18, 0, 4.5, 0, 0, [['۱ بطری', 500]]),
  B('br_kalleh_thousand', 'Thousand Island Sauce', 'سس هزارجزیره', 'کاله', '6262004907172', 'fat', 24, 1.2, 3.6, 0.5, 0, [['۱ قاشق غذاخوری', 15]]),
  B('br_kalleh_salsa', 'صلصة', 'سس سالسا', 'کاله', '6262004900173', 'fat', 382, 1.1, 16.8, 36, 0, [['۱ قاشق غذاخوری', 15]]),
  B('br_haraz_doogh_mint', 'Dough, Non Carbonated, Mint flavor', 'دوغ نعنا بدون گاز', 'هراز', '6260661008454', 'drink', 25, 1.6, 2.4, 1, 0, [['۱ لیوان', 250], ['۱ بطری', 1000]]),
  B('br_haraz_greek', 'Greek Yogurt', 'ماست یونانی', 'هراز', '6260661009345', 'dairy', 95, 5.6, 7, 5, 0, [['۱ ظرف', 200]]),
  B('br_haraz_mousir', 'Strained Yoghurt With Shallots', 'ماست چکیده موسیر', 'هراز', '6260661006108', 'dairy', 79, 4.6, 5, 4.5, 0, [['۱ قاشق غذاخوری', 20]]),
  B('br_mihan_yog_low', 'Low Fat Yogurt', 'ماست کم‌چرب', 'میهن', '6260176816230', 'dairy', 32, 3, 2, 1.4, 0, [['۱ کاسه', 150]]),
  B('br_cheetoz_sticks', 'Potato Sticks', 'چیپس چوبی سیب‌زمینی', 'چی‌توز', '6260053185954', 'snack', 447, 4.5, 55.3, 23, 0, [['۱ بسته کوچک', 40]]),
  B('br_cheetoz_crunchy', 'Crunchy chili', 'اسنک کرانچی فلفلی', 'چی‌توز', '6261847502223', 'snack', 167, 2, 18, 9.6, 0.0, [['۱ بسته', 95]]),
  B('br_mahdiyar_puff', 'Whole Grains Puffy Snacks (Onions & Parsley)', 'اسنک پفکی غلات کامل (پیازی)', 'مهدیار', '6269591600219', 'snack', 356, 15.4, 57.1, 11.8, 7, [['۱ بسته', 50]]),
  B('br_baraka_choco_bisc', 'choco biscuit', 'بیسکویت با روکش شکلات', 'برکت', '6260336000974', 'snack', 428, 6.4, 36.9, 28.5, 0, [['۱ بسته', 400]]),
  B('br_dream_choco_bisc', 'Dream choco biscuit', 'بیسکویت شکلاتی', 'دریم', '6261149163238', 'snack', 538, 7.9, 59, 30, 0, [['۱ عدد', 25]]),
  B('br_naderi_coconut', 'Cookie Filled with Coconut', 'کلوچه نارگیلی', 'نادری', '6260098400395', 'snack', 426, 7.1, 62.7, 16.3, 12, [['۱ عدد', 50]]),
  B('br_nadi_walnut_cookie', 'Walnut Cookies', 'کوکی گردویی', 'نادی', '6260175210022', 'snack', 403, 6.3, 66, 12.7, 1, [['۱ عدد', 20]]),
  B('br_oab_quinoa', 'Quinoa', 'کینوا', 'اوآب', '6266218301221', 'grain', 380, 14, 70, 6, 6, [['۱ پیمانه خام', 170]]),
  B('br_maggi_barley_soup', 'Mushroom barley soup', 'سوپ جو و قارچ (پودر خشک)', 'مگی', '6260418700556', 'grain', 334, 14.5, 58.8, 3.2, 5.6, [['۱ بسته', 75]]),

/* ---------- reference foods from USDA SR Legacy ----------
   Figures as published, per 100 g. The USDA record behind each row is listed
   in tools/usda-sources.json, which is a maintenance reference and is not
   bundled into the app.

   Three of these fail a plain 4/4/9 check and are right anyway, for the same
   reason the citrus and bran rows above do: cider vinegar's energy comes from
   acetic acid, which the formula does not model; watercress is 11 kcal, where
   rounding alone is a third of the value; and USDA applies a lower digestibility
   factor to oat bran, as it does to wheat bran.                              */
  F('d_parmesan', 'Parmesan', 'پنیر پارمزان', 'dairy', 420, 28.4, 13.9, 27.8, 0.0, [['۱ قاشق غذاخوری', 5]]),
  F('d_gouda', 'Gouda', 'پنیر گودا', 'dairy', 356, 24.9, 2.2, 27.4, 0.0, [['۱ برش', 30]]),
  F('d_brie', 'Brie', 'پنیر بری', 'dairy', 334, 20.8, 0.5, 27.7, 0.0, [['۱ برش', 30]]),
  F('d_ricotta', 'Ricotta', 'پنیر ریکوتا', 'dairy', 150, 7.5, 7.3, 10.2, 0.0, [['۱ قاشق غذاخوری', 30]]),
  F('d_provolone', 'Provolone', 'پنیر پروولونه', 'dairy', 351, 25.6, 2.1, 26.6, 0.0, [['۱ برش', 30]]),
  F('d_swiss_chz', 'Swiss cheese', 'پنیر سوییسی', 'dairy', 393, 27.0, 1.4, 31.0, 0.0, [['۱ برش', 30]]),
  F('d_processed_chz', 'Processed cheese', 'پنیر پروسس', 'dairy', 180, 24.6, 3.5, 7.0, 0.0, [['۱ برش', 30]]),
  F('d_sour_cream', 'Sour cream', 'خامه ترش', 'dairy', 198, 2.4, 4.6, 19.4, 0.0, [['۱ قاشق غذاخوری', 15]]),
  F('d_half_cream', 'Light cream', 'خامه قهوه', 'dairy', 195, 3.0, 3.7, 19.1, 0.0, [['۱ قاشق غذاخوری', 15]]),
  F('d_whip_cream', 'Whipped cream', 'خامه فرم‌گرفته', 'dairy', 257, 3.2, 12.5, 22.2, 0.0, [['۱ قاشق غذاخوری', 6]]),
  F('d_goat_milk', 'Goat milk', 'شیر بز', 'dairy', 69, 3.6, 4.5, 4.1, 0.0, [['۱ لیوان', 200]]),
  F('d_buttermilk', 'Buttermilk', 'دوغ کره', 'dairy', 40, 3.3, 4.8, 1.1, 0.0, [['۱ لیوان', 200]]),
  F('d_kefir_milk', 'Kefir', 'کفیر', 'dairy', 62, 3.2, 4.9, 3.3, 0.0, [['۱ لیوان', 200]]),
  F('d_evap_milk', 'Evaporated milk', 'شیر تغلیظ‌شده', 'dairy', 134, 6.8, 10.0, 7.6, 0.0, [['۱ قاشق غذاخوری', 15]]),
  F('d_cond_milk', 'Condensed milk', 'شیر عسل', 'dairy', 321, 7.9, 54.4, 8.7, 0.0, [['۱ قاشق غذاخوری', 20]]),
  F('d_labneh', 'Labneh', 'لبنه', 'dairy', 97, 9.0, 4.0, 5.0, 0.0, [['۱ قاشق غذاخوری', 20]]),
  F('d_egg_white_pw', 'Egg white powder', 'پودر سفیده تخم مرغ', 'dairy', 382, 81.1, 7.8, 0.0, 0.0, [['۱ قاشق غذاخوری', 8]]),
  F('x_coconut_oil', 'Coconut oil', 'روغن نارگیل', 'fat', 892, 0.0, 0.0, 99.1, 0.0, [['۱ قاشق غذاخوری', 14]]),
  F('x_corn_oil', 'Corn oil', 'روغن ذرت', 'fat', 900, 0.0, 0.0, 100, 0.0, [['۱ قاشق غذاخوری', 14]]),
  F('x_palm_oil', 'Palm oil', 'روغن پالم', 'fat', 884, 0.0, 0.0, 100, 0.0, [['۱ قاشق غذاخوری', 14]]),
  F('x_margarine', 'Margarine', 'مارگارین', 'fat', 717, 0.2, 0.7, 80.7, 0.0, [['۱ قاشق غذاخوری', 14]]),
  F('x_ghee_usda', 'Ghee', 'روغن کره (گی)', 'fat', 876, 0.3, 0.0, 99.5, 0.0, [['۱ قاشق غذاخوری', 13]]),
  F('x_mustard', 'Mustard', 'سس خردل', 'fat', 60, 3.7, 5.8, 3.3, 4.0, [['۱ قاشق چای‌خوری', 5]]),
  F('x_bbq_sauce', 'Barbecue sauce', 'سس باربیکیو', 'fat', 172, 0.8, 40.8, 0.6, 0.9, [['۱ قاشق غذاخوری', 17]]),
  F('x_soy_sauce', 'Soy sauce', 'سس سویا', 'fat', 53, 8.1, 4.9, 0.6, 0.8, [['۱ قاشق غذاخوری', 16]]),
  F('x_hot_sauce', 'Hot sauce', 'سس تند', 'fat', 11, 0.5, 1.8, 0.4, 0.3, [['۱ قاشق چای‌خوری', 5]]),
  F('x_tomato_paste', 'Tomato paste', 'رب گوجه فرنگی', 'fat', 82, 4.3, 18.9, 0.5, 4.1, [['۱ قاشق غذاخوری', 16]]),
  F('x_apple_vin', 'Apple cider vinegar', 'سرکه سیب', 'fat', 21, 0.0, 0.9, 0.0, 0.0, [['۱ قاشق غذاخوری', 15]]),
  F('x_ginger_g', 'Ginger, ground', 'زنجبیل', 'fat', 335, 9.0, 71.6, 4.2, 14.1, [['۱ قاشق چای‌خوری', 2]]),
  F('x_cumin', 'Cumin seed', 'زیره', 'fat', 375, 17.8, 44.2, 22.3, 10.5, [['۱ قاشق چای‌خوری', 2]]),
  F('x_cardamom', 'Cardamom', 'هل', 'fat', 311, 10.8, 68.5, 6.7, 28.0, [['۱ قاشق چای‌خوری', 2]]),
  F('x_cloves', 'Cloves', 'میخک', 'fat', 274, 6.0, 65.5, 13.0, 33.9, [['۱ قاشق چای‌خوری', 2]]),
  F('x_nutmeg', 'Nutmeg', 'جوز هندی', 'fat', 525, 5.8, 49.3, 36.3, 20.8, [['۱ قاشق چای‌خوری', 2]]),
  F('x_thyme_dry', 'Thyme, dried', 'آویشن خشک', 'fat', 276, 9.1, 63.9, 7.4, 37.0, [['۱ قاشق چای‌خوری', 1]]),
  F('x_rosemary', 'Rosemary, dried', 'رزماری', 'fat', 331, 4.9, 64.1, 15.2, 42.6, [['۱ قاشق چای‌خوری', 1]]),
  F('x_paprika', 'Paprika', 'پاپریکا', 'fat', 282, 14.1, 54.0, 12.9, 34.9, [['۱ قاشق چای‌خوری', 2]]),
  F('x_chili_pw', 'Chili powder', 'پودر فلفل قرمز', 'fat', 282, 13.5, 49.7, 14.3, 34.8, [['۱ قاشق چای‌خوری', 3]]),
  F('x_garlic_pw', 'Garlic powder', 'پودر سیر', 'fat', 331, 16.6, 72.7, 0.7, 9.0, [['۱ قاشق چای‌خوری', 3]]),
  F('x_onion_pw', 'Onion powder', 'پودر پیاز', 'fat', 341, 10.4, 79.1, 1.0, 15.2, [['۱ قاشق چای‌خوری', 2]]),
  F('x_curry_pw', 'Curry powder', 'پودر کاری', 'fat', 325, 14.3, 55.8, 14.0, 53.2, [['۱ قاشق چای‌خوری', 2]]),
  F('n_pecan', 'Pecan', 'گردوی آمریکایی', 'nut', 691, 9.2, 13.9, 72.0, 9.6, [['۱ مشت', 30]]),
  F('n_macadamia', 'Macadamia', 'ماکادمیا', 'nut', 718, 7.9, 13.8, 75.8, 8.6, [['۱ مشت', 30]]),
  F('n_brazil_nut', 'Brazil nut', 'بادام برزیلی', 'nut', 659, 14.3, 11.7, 67.1, 7.5, [['۱ مشت', 30]]),
  F('n_pine_nut', 'Pine nut', 'چلغوز', 'nut', 673, 13.7, 13.1, 68.4, 3.7, [['۱ مشت', 30]]),
  F('n_chestnut', 'Chestnut', 'شاه‌بلوط', 'nut', 245, 3.2, 53.0, 2.2, 5.1, [['۱ عدد', 13]]),
  F('n_sesame_seed', 'Sesame seeds', 'کنجد', 'nut', 573, 17.7, 23.4, 49.7, 11.8, [['۱ قاشق غذاخوری', 9]]),
  F('n_hemp_seed', 'Hemp seed', 'دانه شاهدانه', 'nut', 553, 31.6, 8.7, 48.8, 4.0, [['۱ قاشق غذاخوری', 10]]),
  F('n_almond_bt', 'Almond butter', 'کره بادام', 'nut', 614, 21.0, 18.8, 55.5, 10.3, [['۱ قاشق غذاخوری', 16]]),
  F('n_cashew_bt', 'Cashew butter', 'کره بادام هندی', 'nut', 587, 17.6, 27.6, 49.4, 2.0, [['۱ قاشق غذاخوری', 16]]),
  F('n_poppy_seed', 'Poppy seed', 'خشخاش', 'nut', 525, 18.0, 28.1, 41.6, 19.5, [['۱ قاشق چای‌خوری', 3]]),
  F('n_watermelon_s', 'Watermelon seeds', 'تخمه هندوانه خام', 'nut', 557, 28.3, 15.3, 47.4, 0, [['۱ مشت', 30]]),
  F('v_potato_raw', 'Potato, raw', 'سیب‌زمینی خام', 'veg', 77, 2.0, 17.5, 0.1, 2.1, [['۱ عدد متوسط', 170]]),
  F('v_asparagus', 'Asparagus', 'مارچوبه', 'veg', 20, 2.2, 3.9, 0.1, 2.1, [['۱ ساقه', 16]]),
  F('v_brussels', 'Brussels sprouts', 'کلم بروکسل', 'veg', 43, 3.4, 8.9, 0.3, 3.8, [['۱ عدد', 19]]),
  F('v_sweet_potato', 'Sweet potato, raw', 'سیب‌زمینی شیرین خام', 'veg', 86, 1.6, 20.1, 0.1, 3.0, [['۱ عدد متوسط', 130]]),
  F('v_zucchini_raw', 'Zucchini, raw', 'کدو سبز خام', 'veg', 17, 1.2, 3.1, 0.3, 1.0, [['۱ عدد', 200]]),
  F('v_mung_sprout', 'Mung bean sprouts', 'جوانه ماش', 'veg', 30, 3.0, 5.9, 0.2, 1.8, [['۱ پیمانه', 100]]),
  F('v_watercress', 'Watercress', 'شاهی', 'veg', 11, 2.3, 1.3, 0.1, 0.5, [['۱ پیمانه', 100]]),
  F('v_arugula', 'Arugula', 'روکولا', 'veg', 25, 2.6, 3.6, 0.7, 1.6, [['۱ پیمانه', 100]]),
  F('v_endive', 'Endive', 'کاسنی', 'veg', 17, 1.2, 3.4, 0.2, 3.1, [['۱ پیمانه', 100]]),
  F('v_rhubarb', 'Rhubarb', 'ریواس', 'veg', 21, 0.9, 4.5, 0.2, 1.8, [['۱ ساقه', 51]]),
  F('v_seaweed', 'Seaweed', 'جلبک دریایی', 'veg', 45, 3.0, 9.1, 0.6, 0.5, [['۱ پیمانه', 100]]),
  F('v_pickled_cuc', 'Pickled cucumber', 'خیارشور صنعتی', 'veg', 11, 0.3, 2.3, 0.2, 1.2, [['۱ عدد', 65]]),
  F('v_tomato_ck', 'Tomato, cooked', 'گوجه پخته', 'veg', 18, 0.9, 4.0, 0.1, 0.7, [['۱ پیمانه', 100]]),
  F('v_spinach_ck', 'Spinach, cooked', 'اسفناج پخته', 'veg', 23, 3.0, 3.8, 0.3, 2.4, [['۱ پیمانه', 100]]),
  F('fr_papaya', 'Papaya', 'پاپایا', 'fruit', 43, 0.5, 10.8, 0.3, 1.7, [['۱ عدد کوچک', 157]]),
  F('fr_guava', 'Guava', 'گواوا', 'fruit', 68, 2.5, 14.3, 0.9, 5.4, [['۱ عدد', 55]]),
  F('fr_lychee', 'Lychee', 'لیچی', 'fruit', 66, 0.8, 16.5, 0.4, 1.3, [['۱ عدد', 10]]),
  F('fr_passion', 'Passion fruit', 'پشن‌فروت', 'fruit', 97, 2.2, 23.4, 0.7, 10.4, [['۱ عدد', 18]]),
  F('fr_blackberry', 'Blackberry', 'شاه‌توت سیاه', 'fruit', 43, 1.4, 9.6, 0.5, 5.3, [['۱ پیمانه', 144]]),
  F('fr_cranberry', 'Cranberry', 'کرن‌بری', 'fruit', 46, 0.5, 12.0, 0.1, 3.6, [['۱ پیمانه', 100]]),
  F('fr_grapefruit_j', 'Grapefruit juice', 'آب گریپ‌فروت', 'fruit', 39, 0.5, 9.2, 0.1, 0.1, [['۱ لیوان', 200]]),
  F('fr_dried_fig', 'Dried fig', 'انجیر خشک (USDA)', 'fruit', 249, 3.3, 63.9, 0.9, 9.8, [['۱ عدد', 8]]),
  F('fr_raisin_gold', 'Golden raisins', 'کشمش طلایی', 'fruit', 301, 3.3, 80.0, 0.2, 3.3, [['۱ قاشق غذاخوری', 10]]),
  F('fr_date_medjool', 'Medjool date', 'خرمای مجول', 'fruit', 277, 1.8, 75.0, 0.1, 6.7, [['۱ عدد', 24]]),
  F('g_rice_flour', 'Rice flour', 'آرد برنج', 'grain', 366, 6.0, 80.1, 1.4, 2.4, [['۱ پیمانه', 158]]),
  F('g_chickpea_fl', 'Chickpea flour', 'آرد نخودچی', 'grain', 387, 22.4, 57.8, 6.7, 10.8, [['۱ پیمانه', 92]]),
  F('g_semolina', 'Semolina', 'سمولینا', 'grain', 360, 12.7, 72.8, 1.1, 3.9, [['۱ پیمانه', 167]]),
  F('g_cornstarch', 'Cornstarch', 'نشاسته ذرت', 'grain', 381, 0.3, 91.3, 0.1, 0.9, [['۱ قاشق غذاخوری', 8]]),
  F('g_whole_wheat_f', 'Whole wheat flour', 'آرد سبوس‌دار', 'grain', 332, 9.6, 74.5, 1.9, 13.1, [['۱ پیمانه', 120]]),
  F('g_pasta_ww', 'Whole wheat pasta', 'ماکارونی سبوس‌دار', 'grain', 149, 6.0, 30.1, 1.7, 3.9, [['۱ پیمانه', 140]]),
  F('g_rye_bread', 'Rye bread', 'نان چاودار', 'grain', 259, 8.5, 48.3, 3.3, 5.8, [['۱ برش', 32]]),
  F('g_pita', 'Pita bread', 'نان پیتا', 'grain', 275, 9.1, 55.7, 1.2, 2.2, [['۱ عدد', 60]]),
  F('g_tortilla', 'Tortilla', 'نان تورتیلا', 'grain', 306, 8.2, 49.4, 8.0, 3.5, [['۱ عدد', 49]]),
  F('g_barley_ck', 'Barley, cooked', 'جو پخته', 'grain', 123, 2.3, 28.2, 0.4, 3.8, [['۱ پیمانه', 157]]),
  F('g_oat_bran', 'Oat bran', 'سبوس جو دوسر', 'grain', 246, 17.3, 66.2, 7.0, 15.4, [['۱ قاشق غذاخوری', 7]]),
  F('pr_duck', 'Duck', 'اردک', 'protein', 201, 23.5, 0.0, 11.2, 0.0, [['۱ وعده', 100]]),
  F('pr_goat_meat', 'Goat meat', 'گوشت بز', 'protein', 143, 27.1, 0.0, 3.0, 0.0, [['۱ وعده', 100]]),
  F('pr_chicken_hrt', 'Chicken heart', 'دل مرغ', 'protein', 185, 26.4, 0.1, 7.9, 0.0, [['۱ وعده', 100]]),
  F('pr_chicken_giz', 'Chicken gizzard', 'سنگدان مرغ', 'protein', 154, 30.4, 0.0, 2.7, 0.0, [['۱ وعده', 100]]),
  F('pr_cod', 'Cod', 'ماهی کاد', 'protein', 105, 22.8, 0.0, 0.9, 0.0, [['۱ وعده', 100]]),
  F('pr_mackerel', 'Mackerel', 'ماهی ماکرل', 'protein', 262, 23.8, 0.0, 17.8, 0.0, [['۱ وعده', 100]]),
  F('pr_anchovy', 'Anchovy', 'ماهی آنچوی', 'protein', 210, 28.9, 0.0, 9.7, 0.0, [['۱ وعده', 100]]),
  F('pr_mussel', 'Mussel', 'صدف', 'protein', 172, 23.8, 7.4, 4.5, 0.0, [['۱ وعده', 85]]),
  F('pr_tempeh', 'Tempeh', 'تمپه', 'protein', 192, 20.3, 7.6, 10.8, 0, [['۱ وعده', 84]]),
  F('pr_edamame', 'Edamame', 'سویای سبز', 'protein', 141, 12.4, 11.0, 6.4, 4.2, [['۱ پیمانه', 155]]),
  F('pr_black_bean', 'Black beans', 'لوبیا سیاه پخته', 'protein', 132, 8.9, 23.7, 0.5, 8.7, [['۱ پیمانه', 172]]),
  F('pr_fava_ck', 'Fava beans, cooked', 'باقلا پخته', 'protein', 110, 7.6, 19.6, 0.4, 5.4, [['۱ پیمانه', 170]]),

/* ---------- Kalleh products, from kalleh.com ----------
   259 packaged products, their figures taken from the company's own product
   pages. These are the only rows besides the barcode-carrying ones that name a
   brand, because they are the only other rows whose numbers came from a
   specific product rather than from a reference table.            */
  K('kl_بستنی_وانیلی_با_شهد_توت_فرنگ', 'بستنی ‌وانیلی‌ با شهد توت فرنگی رندو‌', 'snack', 202, 3.4, 26.9, 9.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_زعفرانی_با_پسته_و_خامه', 'بستنی زعفرانی با پسته و خامه فوردو یک لیتری', 'snack', 206, 3.7, 23.0, 11.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_قهوه_با_کیک', 'بستنی رندو پاکتی قهوه با کیک براونی', 'snack', 243, 3.0, 30.8, 12.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_کوکی_فوردو_یک_لیتری', 'بستنی کوکی فوردو یک لیتری', 'snack', 235, 4.0, 25.5, 13.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_اسپیتامن_تیرامیسو', 'بستنی چوبی اسپیتامن تیرامیسو', 'snack', 386, 4.9, 38.1, 23.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_مینی_دبل_چاکلت_اسپیتام', 'بستنی مینی دبل چاکلت اسپیتامن', 'snack', 370, 2.0, 44.5, 20.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_وانیلی_۱_لی', 'بستنی رندو پاکتی وانیلی ۱ لیتری', 'snack', 200, 3.4, 25.7, 9.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_شکلاتی_1_لی', 'بستنی رندو پاکتی شکلاتی 1 لیتری', 'snack', 195, 3.7, 24.1, 9.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_توت_فرنگی', 'بستنی رندو پاکتی توت فرنگی', 'snack', 211, 3.7, 26.6, 10.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_زعفرانی_ویژه_رندو', 'بستنی چوبی زعفرانی ویژه رندو', 'snack', 285, 3.3, 27.5, 18.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_عروسکی', 'بستنی چوبی عروسکی', 'snack', 287, 4.6, 34.2, 14.6, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_هندوانه', 'بستنی چوبی هندوانه', 'snack', 200, 3.7, 31.5, 6.6, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_فروتیس_انبه', 'بستنی چوبی فروتیس انبه', 'snack', 296, 2.1, 26.9, 20.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_یخی_پرتقالی_جیتو', 'بستنی یخی پرتقالی جیتو', 'snack', 60, 0.0, 15.0, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_یخی_آلو_جیتو', 'بستنی یخی آلو جیتو', 'snack', 52, 0.0, 13.0, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_یخی_زرشک_جیتو', 'بستنی چوبی یخی زرشک جیتو', 'snack', 69, 0.3, 17.0, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_یخی_فالوده_جیتو', 'بستنی یخی فالوده جیتو', 'snack', 53, 0.0, 13.2, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_شکلاتی_معمولی_مدل', 'بستنی چوبی شکلاتی معمولی مدل شوت گل', 'snack', 295, 3.5, 32.2, 16.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_نارگیلی', 'بستنی چوبی نارگیلی', 'snack', 261, 4.9, 21.2, 17.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_معجون_دوکی_لیوانی', 'بستنی معجون دوکی لیوانی', 'snack', 277, 5.3, 28.4, 15.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_وانیلی_رندو_لیوانی', 'بستنی ‌وانیلی رندو‌ لیوانی‌‌', 'snack', 194, 3.2, 25.0, 9.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_پذیرایی_قهوه', 'بستنی پذیرایی قهوه', 'snack', 300, 4.3, 32.1, 17.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_زعفرانی', 'بستنی رندو پاکتی زعفرانی', 'snack', 198, 3.6, 23.4, 10.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_قیفی_ویفری_وانیلی_سورب', 'بستنی قیفی ویفری وانیلی سوربن', 'snack', 236, 4.0, 34.8, 9.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_قیفی_دوکی_شکلاتی', 'بستنی قیفی دوکی شکلاتی', 'snack', 236, 4.5, 34.7, 8.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_دوکی_قیفی_وانیلی_رندو', 'بستنی دوکی قیفی وانیلی رندو', 'snack', 256, 5.0, 32.0, 12.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_شکلاتی_ویژه_رندو', 'بستنی چوبی شکلاتی ویژه رندو', 'snack', 286, 3.5, 24.1, 19.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_وانیلی_ظرفی_رندو', 'بستنی ‌وانیلی ظرفی‌‌ رندو‌', 'snack', 194, 3.2, 25.0, 9.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_شکلاتی_رندو_ظرفی', 'بستنی ‌شکلاتی‌‌ رندو‌ ظرفی‌‌', 'snack', 196, 3.4, 23.3, 9.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_شکلاتی_با_رگه_شکلات_ظر', 'بستنی ‌شکلاتی‌ با رگه شکلات‌ ظرفی‌‌ رندو‌', 'snack', 233, 3.6, 25.6, 12.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_تکه_شکلات_فوردو_یک_لیت', 'بستنی تکه شکلات فوردو یک لیتری', 'snack', 221, 5.0, 26.6, 10.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_پنیر_ورقه_ای_پستو', 'پنیر ورقه‌ ای پستو', 'dairy', 255, 14.0, 4.8, 20.0, 0, [['۱ برش', 30]]),
  K('kl_دوغ_بدون_گاز_گرمادیده', 'دوغ بدون گاز گرمادیده', 'drink', 29, 1.5, 2.3, 1.5, 0, [['۱ لیوان', 250]]),
  K('kl_سولاته_کاپوچینو', 'سولاته کاپوچینو', 'snack', 63, 7.6, 4.8, 1.5, 0, [['۱ وعده', 100]]),
  K('kl_پنیر_ورقه_ای_لازانیا', 'پنیر ورقه‌ ای لازانیا', 'dairy', 255, 14.0, 4.8, 20.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_ورقه_ای_پارمسان', 'پنیر ورقه‌ ای پارمسان', 'dairy', 255, 14.0, 4.8, 20.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_بلوچیز_ورقه_ای', 'پنیر بلوچیز ورقه‌ای', 'dairy', 350, 12.0, 17.0, 26.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_ورقه_ای_چدار', 'پنیر ورقه‌ ای چدار', 'dairy', 255, 14.0, 4.8, 20.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_پیتزا_پروسس_فیلافیلا', 'پنیر پیتزا پروسس فیلافیلا', 'dairy', 284, 20.0, 1.5, 22.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_ورقه_ای_گودا', 'پنیر ورقه‌ ای گودا', 'dairy', 255, 14.0, 4.8, 20.0, 0, [['۱ برش', 30]]),
  K('kl_دوغ_لیوانی', 'دوغ لیوانی', 'drink', 26, 1.2, 3.0, 1.0, 0, [['۱ لیوان', 250]]),
  K('kl_کره_پاستوریزه_زعفرانی', 'کره پاستوریزه زعفرانی', 'fat', 111, 0.0, 0.1, 12.3, 0, [['۱ قاشق چای‌خوری', 5]]),
  K('kl_کرم_صبحانه_کلاسیک_کاتلا', 'کرم صبحانه کلاسیک کاتلا', 'snack', 78, 1.9, 12.8, 2.1, 0, [['۱ وعده', 100]]),
  K('kl_ماست_کفیر_پرچرب_پروبیوتیک_نا', 'ماست کفیر پرچرب پروبیوتیک ناری', 'dairy', 81, 3.7, 5.4, 5.0, 0, [['۱ کاسه', 150]]),
  K('kl_شیر_طالبی_غنی_شده', 'شیر طالبی غنی‌ شده', 'dairy', 66, 3.0, 10.2, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_زیرو_بدون_لاکتوز_و_چربی', 'شیر زیرو بدون لاکتوز و چربی', 'dairy', 32, 3.0, 5.0, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_قهوه_فرادما', 'شیر قهوه فرادما', 'dairy', 71, 3.0, 11.4, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_پروشیر_کازئین_وانیلی', 'پروشیر کازئین وانیلی', 'dairy', 66, 12.1, 4.5, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_پروشیر_کازئین_شکلاتی', 'پروشیر کازئین شکلاتی', 'dairy', 66, 12.1, 4.5, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_موز_فرادما', 'شیر موز فرادما', 'dairy', 90, 3.0, 14.0, 2.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_پرچرب_3_درصد_ESL', 'شیر پرچرب 3 درصد ESL', 'dairy', 59, 3.0, 4.9, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کاکائو_فرادما', 'شیر کاکائو فرادما', 'dairy', 77, 3.0, 12.8, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_پرچرب_تترافینو', 'شیر پرچرب تترافینو', 'dairy', 59, 3.0, 4.9, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_پنیر_پروسس_پینکا', 'پنیر پروسس پینکا', 'dairy', 304, 10.0, 3.0, 28.0, 0, [['۱ برش', 30]]),
  K('kl_شیر_کم_چرب_1_5_درصد_ESL', 'شیر کم چرب 1.5 درصد ESL', 'dairy', 46, 3.0, 5.0, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کم_چرب_فرادما', 'شیر کم‌چرب فرادما', 'dairy', 45, 3.0, 4.8, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_پر_چرب_فرادما', 'شیر پر‌چرب فرادما', 'dairy', 60, 3.0, 5.2, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_پنیر_تازه_موزارلا_توپی', 'پنیر تازه موزارلا توپی', 'dairy', 267, 17.0, 0.2, 22.0, 0, [['۱ برش', 30]]),
  K('kl_ماست_تازه_کم_چرب', 'ماست تازه کم چرب', 'dairy', 50, 3.7, 5.6, 1.4, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_تازه_پرچرب', 'ماست تازه پرچرب', 'dairy', 63, 3.7, 5.2, 3.0, 0, [['۱ کاسه', 150]]),
  K('kl_پروماست_پروتئین_کازئین', 'پروماست (پروتئین کازئین)', 'dairy', 60, 10.0, 5.0, 0.0, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_پرچرب_سون', 'ماست پرچرب سون', 'dairy', 69, 4.0, 4.2, 4.0, 0, [['۱ کاسه', 150]]),
  K('kl_بستنی_رندو_پاکتی_وانیلی_با_ک', 'بستنی رندو پاکتی وانیلی با کیک براونی', 'snack', 233, 3.0, 32.1, 10.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_تریپل_چاکلت_فوردو_یک_ل', 'بستنی تریپل چاکلت فوردو یک لیتری', 'snack', 227, 4.0, 26.2, 11.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_وانیلی_با_باقلوا', 'بستنی وانیلی با باقلوا', 'snack', 235, 6.0, 31.6, 9.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_لیوانی_وانیلی_با_شهد_ت', 'بستنی لیوانی وانیلی با شهد توت فرنگی و دراژه', 'snack', 199, 2.1, 25.2, 10.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_تیرامیسو_فوردو_یک_لیتر', 'بستنی تیرامیسو فوردو یک لیتری', 'snack', 190, 3.6, 24.1, 8.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_شکلاتی_معمولی_اکس', 'بستنی چوبی شکلاتی معمولی اکسترودری', 'snack', 236, 3.0, 24.1, 14.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_مگنوم_فروتیس_پرتق', 'بستنی چوبی مگنوم فروتیس پرتقالی', 'snack', 148, 2.5, 24.6, 4.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_مگنوم_فروتیس_بلوب', 'بستنی چوبی مگنوم فروتیس بلوبری', 'snack', 148, 2.5, 24.6, 4.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_یخی_دو_رنگ_لیمو_آ', 'بستنی چوبی یخی دو رنگ لیمو-آلبالو', 'snack', 69, 0.3, 17.0, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_یخی_موهیتو', 'بستنی چوبی یخی موهیتو', 'snack', 75, 0.4, 18.4, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_میلکی_شکلاتی', 'بستنی چوبی میلکی شکلاتی', 'snack', 111, 3.0, 16.8, 3.6, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_قهوه_ویژه_رندو', 'بستنی چوبی قهوه ویژه رندو', 'snack', 287, 3.7, 25.7, 18.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_وانیلی', 'بستنی چوبی وانیلی', 'snack', 239, 3.3, 26.5, 13.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_حصیری_زعفرانی', 'بستنی حصیری زعفرانی', 'snack', 199, 4.0, 12.0, 15.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_بار_شکلاتی_بریموند', 'بستنی بار شکلاتی بریموند', 'snack', 153, 2.5, 14.4, 9.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_تاپینگ_پیتزا', 'تاپینگ پیتزا', 'snack', 287, 21.0, 1.2, 22.0, 0, [['۱ وعده', 100]]),
  K('kl_چیزکیک_شکلات_فوردو_دلیس', 'چیزکیک شکلات فوردو دلیس', 'snack', 355, 5.2, 40.1, 19.3, 0, [['۱ برش', 60]]),
  K('kl_شیر_فندق', 'شیر فندق', 'dairy', 50, 0.8, 6.1, 2.5, 0, [['۱ لیوان', 200]]),
  K('kl_بستنی_چوبی_فانتزی', 'بستنی چوبی فانتزی', 'snack', 258, 3.1, 23.8, 16.7, 0, [['۱ اسکوپ', 75]]),
  K('kl_نوشیدنی_بدون_گاز_زرشک_و_زعفر', 'نوشیدنی بدون گاز زرشک و زعفران لاکی یو', 'drink', 72, 0.0, 18.0, 0.0, 0, [['۱ بطری', 250]]),
  K('kl_نوشیدنی_بدون_گاز_لیمو_گلاب_و', 'نوشیدنی بدون گاز لیمو گلاب و زعفران لاکی یو', 'drink', 72, 0.0, 18.0, 0.0, 0, [['۱ بطری', 250]]),
  K('kl_ماست_تازه_کم_چرب_پروبیوتیک', 'ماست تازه کم چرب پروبیوتیک', 'dairy', 50, 3.7, 5.6, 1.4, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_چکیده_کفیر_پروبیوتیک_نا', 'ماست چکیده کفیر پروبیوتیک ناری', 'dairy', 138, 10.0, 1.9, 10.0, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_سنتی', 'ماست سنتی', 'dairy', 106, 3.9, 4.6, 8.0, 0, [['۱ کاسه', 150]]),
  K('kl_پروماست_وی_انار', 'پروماست وی انار', 'dairy', 66, 8.0, 8.5, 0.0, 0, [['۱ کاسه', 150]]),
  K('kl_پروماست_پروتئین_وی', 'پروماست (پروتئین وی)', 'dairy', 62, 10.0, 5.5, 0.0, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_پرچرب_پروبیوتیک_لاکتیوی', 'ماست پرچرب پروبیوتیک لاکتیویا', 'dairy', 79, 5.0, 4.5, 4.5, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_کم_چرب_پروبیوتیک_لاکتیو', 'ماست کم چرب پروبیوتیک لاکتیویا', 'dairy', 65, 6.0, 7.1, 1.4, 0, [['۱ کاسه', 150]]),
  K('kl_ماست_کم_چرب_پروبیوتیک_سون', 'ماست کم چرب پروبیوتیک سون', 'dairy', 50, 4.5, 5.0, 1.4, 0, [['۱ کاسه', 150]]),
  K('kl_پنیر_خامه_ای_ویلی', 'پنیر خامه ای ویلی', 'dairy', 270, 8.0, 3.3, 25.0, 0, [['۱ برش', 30]]),
  K('kl_بستنی_تیوپی_جیتو_با_طعم_پرتق', 'بستنی تیوپی جیتو با طعم پرتقال', 'snack', 119, 0.5, 29.3, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_جیتو_کولا', 'بستنی جیتو کولا', 'snack', 109, 0.7, 26.6, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_یخی_آنتی_اکسیدان', 'بستنی چوبی یخی آنتی اکسیدان', 'snack', 70, 0.3, 17.2, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_بادام_زمینی_با_رگ', 'بستنی چوبی بادام زمینی با رگه کارامل اسپیتامن', 'snack', 349, 22.2, 20.0, 20.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_وانیلی_اکسترودری', 'بستنی چوبی وانیلی اکسترودری', 'snack', 239, 3.3, 25.4, 13.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_میلک_آیس', 'بستنی چوبی میلک آیس', 'snack', 117, 2.8, 17.8, 3.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_موزی_با_روکش_شکلا', 'بستنی چوبی موزی با روکش شکلات کاکائویی', 'snack', 206, 4.7, 30.3, 7.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_مگنوم_وانیلی_ناتر', 'بستنی چوبی مگنوم وانیلی ناتر', 'snack', 348, 5.0, 38.5, 19.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_شاتوت_با_روکش_یخی', 'بستنی چوبی شاتوت با روکش یخی شاتوت', 'snack', 132, 1.5, 26.6, 2.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_دوکی_قیفی_شکلاتی_رندو', 'بستنی دوکی قیفی شکلاتی رندو', 'snack', 260, 5.0, 33.0, 12.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_قیفی_دوکی_کارامل_و_باد', 'بستنی قیفی دوکی کارامل و بادام زمینی', 'snack', 301, 5.0, 30.8, 17.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_پاندای_کونگ_فو_کا', 'بستنی چوبی پاندای کونگ فو کار', 'snack', 124, 2.5, 18.3, 4.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_آدامسی_با_روکش_شک', 'بستنی چوبی آدامسی با روکش شکلات جرقه ای', 'snack', 151, 1.7, 15.6, 9.1, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_قیفی_ویفری_شکلاتی_سورب', 'بستنی قیفی ویفری شکلاتی سوربن', 'snack', 282, 4.0, 39.5, 12.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_یک_لیتری_کره_ای_با_تکه', 'بستنی یک لیتری کره ای با تکه های گردو', 'snack', 262, 3.9, 27.9, 15.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_پاکتی_دو_رنگ_شکلاتی_پر', 'بستنی پاکتی دو رنگ شکلاتی-پرتقالی', 'snack', 210, 3.3, 26.7, 10.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_میوه_های_تازه_فصل', 'بستنی میوه های تازه فصل', 'snack', 204, 3.7, 31.6, 7.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_ماکیاتو', 'بستنی ماکیاتو', 'snack', 170, 4.0, 2.5, 16.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_جیتو_شاتوت', 'بستنی جیتو شاتوت', 'snack', 104, 0.4, 25.6, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_دبل_شکلات_اسپیتام', 'بستنی چوبی دبل شکلات اسپیتامن', 'snack', 354, 3.6, 38.7, 20.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_پنیر_پیتزای_رنده_شده_هلندی', 'پنیر پیتزای رنده شده هلندی', 'dairy', 314, 21.0, 8.0, 22.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_پیتزای_رنده_شده_ایتالیا', 'پنیر پیتزای رنده شده ایتالیایی', 'dairy', 314, 21.0, 8.0, 22.0, 0, [['۱ برش', 30]]),
  K('kl_پودینگ_زعفرانی', 'پودینگ زعفرانی', 'snack', 141, 0.0, 24.0, 5.0, 0, [['۱ وعده', 100]]),
  K('kl_دوغ_ساده', 'دوغ ساده', 'drink', 94, 3.4, 13.4, 3.0, 0, [['۱ لیوان', 250]]),
  K('kl_دوغ_تک_نفره_نعنا_پونه', 'دوغ تک نفره نعنا پونه', 'drink', 64, 1.2, 8.4, 2.9, 0, [['۱ لیوان', 250]]),
  K('kl_دوغ_نایلونی_ساده', 'دوغ نایلونی ساده', 'drink', 94, 3.4, 13.4, 3.0, 0, [['۱ لیوان', 250]]),
  K('kl_پروشیر_کازئین_قهوه_کاله_پرو', 'پروشیر کازئین قهوه کاله پرو', 'dairy', 70, 12.1, 5.3, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_پروشیک_وانیلی_کاله_پرو', 'پروشیک وانیلی کاله پرو', 'snack', 88, 6.0, 16.0, 0.0, 0, [['۱ وعده', 100]]),
  K('kl_نوشیدنی_شکلاتی', 'نوشیدنی شکلاتی', 'drink', 136, 2.6, 27.6, 1.7, 0, [['۱ بطری', 250]]),
  K('kl_شیر_چای_کلاسیک_چای_لاته_کاله', 'شیر چای کلاسیک (چای لاته) کاله', 'dairy', 65, 0.0, 14.0, 1.0, 0, [['۱ لیوان', 200]]),
  K('kl_دسر_نوشیدنی_کولا', 'دسر نوشیدنی کولا', 'drink', 103, 0.0, 19.0, 3.0, 0, [['۱ بطری', 250]]),
  K('kl_شیر_برنج_پروتئینه_دارچینی', 'شیر برنج پروتئینه دارچینی', 'dairy', 62, 6.0, 7.2, 1.0, 0, [['۱ لیوان', 200]]),
  K('kl_کاتلا_مربای_شیر_بهارنارنج', 'کاتلا (مربای شیر ) بهارنارنج', 'dairy', 222, 0.0, 39.8, 7.0, 0, [['۱ لیوان', 200]]),
  K('kl_ژله_توت_فرنگی_تتراپک', 'ژله توت‌فرنگی تتراپک', 'snack', 56, 0.0, 14.0, 0.0, 0, [['۱ وعده', 100]]),
  K('kl_شیر_برنج_پروتئینه_عسلی', 'شیر برنج پروتئینه عسلی', 'dairy', 62, 6.0, 7.2, 1.0, 0, [['۱ لیوان', 200]]),
  K('kl_کاتلا_مربای_شیر_ارده', 'کاتلا (مربای شیر ) ارده', 'dairy', 237, 0.0, 36.8, 10.0, 0, [['۱ لیوان', 200]]),
  K('kl_بستنی_ژلاتو_پسته', 'بستنی ژلاتو پسته', 'snack', 186, 2.4, 28.4, 7.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_ژلاتو_شاه_توت', 'بستنی ژلاتو شاه‌توت', 'snack', 131, 0.4, 32.0, 0.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_ژلاتو_آلو', 'بستنی ژلاتو آلو', 'snack', 131, 0.4, 31.9, 0.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_پنیر_پراتو', 'پنیر پراتو', 'dairy', 332, 22.0, 0.2, 27.0, 0, [['۱ برش', 30]]),
  K('kl_بستنی_ژلاتو_کارامل_دلسه_دلیچ', 'بستنی ژلاتو کارامل (دلسه دلیچه)', 'snack', 217, 3.5, 29.4, 9.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_پنیر_اسرم', 'پنیر اسرم', 'dairy', 369, 20.0, 0.3, 32.0, 0, [['۱ برش', 30]]),
  K('kl_لیموناد_زنجبیل_گازدار_لاکی_ف', 'لیموناد زنجبیل گازدار لاکی‌فروت', 'snack', 108, 0.0, 27.0, 0.0, 0, [['۱ وعده', 100]]),
  K('kl_سس_باربیکیو_کاله_پرو', 'سس باربیکیو کاله‌پرو', 'fat', 16, 0.0, 4.1, 0.0, 0, [['۱ قاشق غذاخوری', 15]]),
  K('kl_سس_کچاپ_کاله_پرو', 'سس کچاپ کاله‌پرو', 'fat', 20, 0.0, 5.0, 0.0, 0, [['۱ قاشق غذاخوری', 15]]),
  K('kl_سس_هزارجزیره_کاله_پرو', 'سس هزارجزیره کاله‌پرو', 'fat', 24, 0.0, 5.9, 0.0, 0, [['۱ قاشق غذاخوری', 15]]),
  K('kl_پروشیر_وی_وانیلی_کاله_پرو', 'پروشیر وی وانیلی کاله پرو', 'dairy', 59, 12.1, 2.7, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_پروشیر_وی_شکلاتی_کاله_پرو', 'پروشیر وی شکلاتی کاله پرو', 'dairy', 59, 12.1, 2.7, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_نان_تست_سفید_بدون_گلوتن_سلین', 'نان تست سفید بدون گلوتن سلینو', 'snack', 424, 3.8, 66.9, 15.7, 0, [['۱ وعده', 100]]),
  K('kl_مافین_کاکائویی_بدون_گلوتن_سل', 'مافین کاکائویی بدون گلوتن سلینو', 'snack', 400, 9.5, 69.1, 9.5, 0, [['۱ وعده', 100]]),
  K('kl_مافین_طلایی_کلاسیک_بدون_گلوت', 'مافین طلایی کلاسیک بدون گلوتن سلینو', 'snack', 374, 8.3, 61.6, 10.5, 0, [['۱ وعده', 100]]),
  K('kl_کیک_صبحانه_وانیلی_بدون_گلوتن', 'کیک صبحانه وانیلی بدون گلوتن سلینو', 'snack', 374, 8.3, 61.6, 10.5, 0, [['۱ برش', 60]]),
  K('kl_پیتزا_گوشت_بدون_گلوتن_سلینو', 'پیتزا گوشت بدون گلوتن سلینو', 'snack', 198, 9.6, 25.9, 6.2, 0, [['۱ وعده', 100]]),
  K('kl_پیتزا_مرغ_بدون_گلوتن_سلینو', 'پیتزا مرغ بدون گلوتن سلینو', 'snack', 196, 11.0, 23.3, 6.5, 0, [['۱ وعده', 100]]),
  K('kl_نان_لواش_سلینو', 'نان لواش سلینو', 'snack', 158, 4.7, 32.4, 1.0, 0, [['۱ وعده', 100]]),
  K('kl_پودر_پنیر_پارمسان', 'پودر پنیر پارمسان', 'dairy', 362, 34.0, 0.2, 25.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_هالومی_کبابی', 'پنیر هالومی کبابی', 'dairy', 342, 22.0, 0.5, 28.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_چدار', 'پنیر چدار', 'dairy', 372, 23.0, 0.2, 31.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_پارمسان', 'پنیر پارمسان', 'dairy', 362, 34.0, 0.2, 25.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_بلوچیز', 'پنیر بلوچیز', 'dairy', 343, 18.0, 0.2, 30.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_بوترکیزه', 'پنیر بوترکیزه', 'dairy', 369, 20.0, 0.2, 32.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_کممبر_خامه_ای', 'پنیر کممبر خامه‌ای', 'dairy', 329, 19.0, 0.2, 28.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_پستوی_قرمز', 'پنیر پستوی قرمز', 'dairy', 341, 22.0, 0.2, 28.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_پستوی_سبز', 'پنیر پستوی سبز', 'dairy', 341, 22.0, 0.2, 28.0, 0, [['۱ برش', 30]]),
  K('kl_پیتزا_مارگاریتا_بدون_گلوتن_س', 'پیتزا مارگاریتا بدون گلوتن سلینو', 'snack', 185, 8.6, 28.2, 4.2, 0, [['۱ وعده', 100]]),
  K('kl_پروشیک_مونته_کاله_پرو', 'پروشیک مونته کاله پرو', 'snack', 84, 6.0, 10.5, 2.0, 0, [['۱ وعده', 100]]),
  K('kl_بستنی_چوبی_گز_ویژه_رندو', 'بستنی چوبی گز ویژه رندو', 'snack', 305, 4.3, 26.3, 20.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_بیسکویت_کاتلا_ویژ', 'بستنی چوبی بیسکویت کاتلا ویژه رندو', 'snack', 306, 4.5, 28.2, 19.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_کیم_ویژه_رندو', 'بستنی چوبی کیم ویژه رندو', 'snack', 284, 4.0, 28.5, 17.1, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_چای_لوندر_ویژه_رن', 'بستنی چوبی چای لوندر ویژه رندو', 'snack', 279, 2.8, 26.9, 17.8, 0, [['۱ اسکوپ', 75]]),
  K('kl_شیر_پرچرب_بدون_لاکتوز', 'شیر پرچرب بدون لاکتوز', 'dairy', 58, 3.0, 4.8, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کاکائو_ESL', 'شیر کاکائو ESL', 'dairy', 70, 3.0, 11.1, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_پرچرب_کیسه_ای_ESL', 'شیر پرچرب کیسه‌ای ESL', 'dairy', 59, 3.0, 4.9, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_پرچرب_بدون_لاکتوز_فرادما', 'شیر پرچرب بدون لاکتوز فرادما', 'dairy', 58, 3.0, 4.8, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_شکلات_سفید_فرادما', 'شیر شکلات سفید فرادما', 'dairy', 51, 3.0, 6.3, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_طالبی_فرادما', 'شیر طالبی فرادما', 'dairy', 90, 3.0, 14.0, 2.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کم_چرب_تترافینو', 'شیر کم‌چرب تترافینو', 'dairy', 46, 3.0, 5.2, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_دوغ_بدون_گاز_نایلونی_نعناع_و', 'دوغ بدون گاز نایلونی نعناع و پونه', 'drink', 27, 1.2, 4.7, 0.4, 0, [['۱ لیوان', 250]]),
  K('kl_پنیر_بلوچیز_خامه_ای', 'پنیر بلوچیز خامه‌ای', 'dairy', 516, 14.0, 0.2, 51.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_اُلدآمل', 'پنیر اُلدآمل', 'dairy', 399, 23.0, 0.2, 34.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_کممبر_با_شیر_بز', 'پنیر کممبر با شیر بز', 'dairy', 383, 19.0, 0.2, 34.0, 0, [['۱ لیوان', 200]]),
  K('kl_پنیر_شایربلو', 'پنیر شایربلو', 'dairy', 368, 20.0, 0.0, 32.0, 0, [['۱ برش', 30]]),
  K('kl_هات_داگ_گوشت_قرمز_بدون_گلوتن', 'هات‌ داگ گوشت قرمز بدون گلوتن سلینو', 'snack', 231, 13.6, 2.5, 18.5, 0, [['۱ وعده', 100]]),
  K('kl_کالباس_گوشت_قرمز_بدون_گلوتن_', 'کالباس گوشت قرمز بدون گلوتن سلینو', 'protein', 227, 13.0, 2.8, 18.2, 0, [['۲ برش', 40]]),
  K('kl_پنیر_K_ریکو', 'پنیر K ریکو', 'dairy', 304, 8.0, 5.0, 28.0, 0, [['۱ برش', 30]]),
  K('kl_دوغ_گازدار_سنتی_شمرون', 'دوغ گازدار سنتی شمرون', 'drink', 24, 0.0, 4.4, 0.7, 0, [['۱ لیوان', 250]]),
  K('kl_نوشیدنی_پرتقال_گازدار_لاکی_ف', 'نوشیدنی پرتقال گازدار لاکی‌فروت', 'drink', 192, 0.0, 48.0, 0.0, 0, [['۱ بطری', 250]]),
  K('kl_شیر_باریستا', 'شیر باریستا', 'dairy', 68, 3.0, 5.5, 3.8, 0, [['۱ لیوان', 200]]),
  K('kl_بستنی_سوربتو_انار', 'بستنی سوربتو انار', 'snack', 158, 1.2, 32.9, 2.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_شیر_کاکائو_دونو', 'شیر کاکائو دونو', 'dairy', 75, 2.9, 13.6, 1.0, 0, [['۱ لیوان', 200]]),
  K('kl_بستنی_رندو_پاکتی_طالبی', 'بستنی رندو پاکتی طالبی', 'snack', 198, 2.9, 24.3, 9.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_انبه', 'بستنی رندو پاکتی انبه', 'snack', 163, 3.5, 25.5, 5.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_شکلاتی', 'بستنی رندو پاکتی شکلاتی', 'snack', 195, 3.7, 23.9, 9.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_معجون', 'بستنی رندو پاکتی معجون', 'snack', 198, 2.9, 24.3, 9.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_رندو_پاکتی_وانیلی', 'بستنی رندو پاکتی وانیلی', 'snack', 197, 3.8, 23.0, 10.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_زعفرانی_لیوانی_رندو', 'بستنی زعفرانی لیوانی‌‌ رندو', 'snack', 199, 3.8, 23.7, 9.9, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_انبه_لیوانی_رندو', 'بستنی انبه لیوانی رندو', 'snack', 175, 3.7, 26.5, 6.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_قهوه_لیوانی_رندو', 'بستنی قهوه لیوانی‌‌ رندو', 'snack', 221, 3.7, 24.3, 12.1, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_کاکائویی_لیوانی_رندو', 'بستنی کاکائویی لیوانی رندو', 'snack', 194, 3.9, 22.8, 9.7, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_لیوانی_پذیرایی_قهوه_با', 'بستنی لیوانی پذیرایی قهوه با دراژه', 'snack', 238, 3.5, 24.5, 14.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_لیوانی_پذیرایی_زعفرانی', 'بستنی لیوانی پذیرایی زعفرانی با خلال پسته', 'snack', 203, 3.3, 31.4, 7.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_لیوانی_پلمبیر', 'بستنی لیوانی پلمبیر', 'snack', 298, 4.8, 28.9, 18.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_لیوانی_شکلات_تلخ_و_پرت', 'بستنی لیوانی شکلات تلخ و پرتقال', 'snack', 266, 5.0, 33.7, 12.4, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_چوبی_عروسکی_توپی', 'بستنی چوبی عروسکی توپی', 'snack', 254, 4.1, 30.0, 13.1, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_دبل_توت_فرنگی', 'بستنی دبل توت فرنگی', 'snack', 199, 3.9, 30.2, 7.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_شیر_قهوه_ESL', 'شیر قهوه ESL', 'dairy', 90, 3.0, 11.7, 3.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کم_چرب_غنی_شده_کیسه_ای_E', 'شیر کم‌چرب غنی‌شده کیسه‌ای ESL', 'dairy', 46, 3.0, 5.7, 1.2, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کم_چرب_1_2_ویتامین_ESL_D', 'شیر کم‌چرب 1.2% ویتامین ESL D3', 'dairy', 46, 3.0, 5.7, 1.2, 0, [['۱ لیوان', 200]]),
  K('kl_دیپ_پنیر_گودا', 'دیپ پنیر گودا', 'dairy', 299, 0.3, 72.5, 0.9, 0, [['۱ برش', 30]]),
  K('kl_اسکوییز_پنیر_هالوپینو', 'اسکوییز پنیر هالوپینو', 'dairy', 297, 0.3, 71.8, 0.9, 0, [['۱ برش', 30]]),
  K('kl_شیر_عسل_فرادما', 'شیر عسل فرادما', 'dairy', 73, 3.0, 11.9, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_بستنی_دو_لایه_شاتوت_شکلات_فو', 'بستنی دو لایه شاتوت شکلات فوردو', 'snack', 382, 3.5, 33.5, 26.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_بروله_فوردو', 'بستنی بروله فوردو', 'snack', 260, 4.4, 33.0, 12.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_وانیلی_توت_فرنگی_رندو_', 'بستنی ‌وانیلی توت فرنگی‌‌ رندو‌ لیوانی‌‌', 'snack', 187, 3.4, 24.2, 8.5, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_وانیلی_شکلاتی_رندو_لیو', 'بستنی وانیلی شکلاتی رندو لیوانی', 'snack', 191, 3.4, 25.6, 8.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_شیر_کاکائو_غنی_شده', 'شیر کاکائو غنی‌ شده', 'dairy', 76, 3.0, 12.8, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_موز_غنی_شده', 'شیر موز غنی‌ شده', 'dairy', 66, 3.0, 10.2, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_نوشابه_گازدار_با_طعم_پرتقال_', 'نوشابه گازدار با طعم پرتقال دوکولا', 'snack', 105, 0.0, 26.2, 0.0, 0, [['۱ وعده', 100]]),
  K('kl_نوشابه_گازدار_با_طعم_لیمو_دو', 'نوشابه گازدار با طعم لیمو دوکولا', 'snack', 85, 0.0, 21.2, 0.0, 0, [['۱ وعده', 100]]),
  K('kl_شیر_نارگیل_غنی_شده', 'شیر نارگیل غنی‌ شده', 'dairy', 81, 3.0, 11.6, 2.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_میوه_ای_موز', 'شیر میوه ای موز', 'dairy', 133, 3.0, 23.6, 3.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_میوه_ای_سیب', 'شیر میوه ای سیب', 'dairy', 137, 3.0, 31.2, 0.0, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_کم_چرب_غنی_شده', 'شیر کم‌ چرب غنی‌شده', 'dairy', 37, 3.0, 2.9, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_توت_فرنگی_غنی_شده', 'شیر توت‌ فرنگی غنی‌ شده', 'dairy', 66, 3.0, 10.2, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_موز_دونو', 'شیر موز دونو', 'dairy', 62, 2.9, 10.3, 1.0, 0, [['۱ لیوان', 200]]),
  K('kl_پرو_بستنی_توت_وحشی', 'پرو بستنی توت وحشی', 'snack', 132, 15.0, 12.9, 2.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_پرو_بستنی_شکلاتی', 'پرو بستنی شکلاتی', 'snack', 150, 15.0, 14.2, 3.7, 0, [['۱ اسکوپ', 75]]),
  K('kl_پرو_بستنی_لیمو_چیزکیک', 'پرو بستنی لیمو چیزکیک', 'snack', 132, 15.0, 12.9, 2.2, 0, [['۱ اسکوپ', 75]]),
  K('kl_پرو_بستنی_وانیلی', 'پرو بستنی وانیلی', 'snack', 132, 15.0, 12.8, 2.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_مینی_تیرامیسو_اسپیتامن', 'بستنی مینی تیرامیسو اسپیتامن', 'snack', 369, 3.4, 25.2, 28.3, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_پسته_ای_فوردو', 'بستنی پسته ای فوردو', 'snack', 265, 5.0, 34.2, 12.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_کارامل_بادام_زمینی_و_ش', 'بستنی کارامل بادام زمینی و شکلات فوردو یک لیتری', 'snack', 263, 4.3, 27.7, 15.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_چیزکیک_شاتوت_فوردو_دلیس', 'چیزکیک شاتوت فوردو دلیس', 'snack', 280, 3.6, 34.9, 14.0, 0, [['۱ برش', 60]]),
  K('kl_پنیر_ورقه_ای_تست_با_طعم_کره', 'پنیر ورقه‌ ای تست با طعم کره', 'dairy', 258, 0.6, 62.3, 0.7, 0, [['۱ برش', 30]]),
  K('kl_پنیر_ورقه_ای_آلفردو', 'پنیر ورقه‌‌ ای آلفردو', 'dairy', 248, 14.0, 3.1, 20.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_تیلسیتر', 'پنیر تیلسیتر', 'dairy', 332, 22.0, 0.2, 27.0, 0, [['۱ برش', 30]]),
  K('kl_دیپ_پنیر_بلوچیز', 'دیپ پنیر بلوچیز', 'dairy', 299, 0.3, 72.5, 0.9, 0, [['۱ برش', 30]]),
  K('kl_پنیر_سفید_تازه_حامی', 'پنیر سفید تازه حامی', 'dairy', 193, 12.0, 0.3, 16.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_گودا_با_شیر_بز', 'پنیر گودا با شیر بز', 'dairy', 385, 24.0, 0.2, 32.0, 0, [['۱ لیوان', 200]]),
  K('kl_پنیر_موزارلا_رشته_ای', 'پنیر موزارلا رشته ای', 'dairy', 267, 17.0, 0.2, 22.0, 0, [['۱ برش', 30]]),
  K('kl_تاپینگ_پیتزا_کم_چرب', 'تاپینگ پیتزا کم‌ چرب', 'snack', 193, 20.0, 1.2, 12.0, 0, [['۱ وعده', 100]]),
  K('kl_پنیر_موزارلا', 'پنیر موزارلا', 'dairy', 279, 20.0, 0.3, 22.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_موزارلا_مدادی', 'پنیر موزارلا مدادی', 'dairy', 292, 22.0, 1.5, 22.0, 0, [['۱ برش', 30]]),
  K('kl_اسکوییز_پنیر_چدار', 'اسکوییز پنیر چدار', 'dairy', 299, 0.3, 72.5, 0.9, 0, [['۱ برش', 30]]),
  K('kl_پنیر_تازه_موزارلا_گیلاسی', 'پنیر تازه موزارلا گیلاسی', 'dairy', 267, 17.0, 0.2, 22.0, 0, [['۱ برش', 30]]),
  K('kl_دیپ_پنیر_چدار', 'دیپ پنیر چدار', 'dairy', 299, 0.3, 72.5, 0.9, 0, [['۱ برش', 30]]),
  K('kl_اسکوییز_پنیر_آلفردو', 'اسکوییز پنیر آلفردو', 'dairy', 293, 0.3, 70.8, 0.9, 0, [['۱ برش', 30]]),
  K('kl_پنیر_آروشه', 'پنیر آروشه', 'dairy', 605, 32.0, 2.2, 52.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_رومانو_گوسفندی', 'پنیر رومانو گوسفندی', 'dairy', 387, 24.0, 0.8, 32.0, 0, [['۱ برش', 30]]),
  K('kl_پنیر_گودا', 'پنیر گودا', 'dairy', 341, 22.0, 0.2, 28.0, 0, [['۱ برش', 30]]),
  K('kl_روغن_کره_حیوانی', 'روغن کره حیوانی', 'fat', 895, 0.0, 0.1, 99.4, 0, [['۱ قاشق چای‌خوری', 5]]),
  K('kl_شیر_پرچرب_4_2_ESL', 'شیر پرچرب 4.2% ESL', 'dairy', 60, 3.0, 2.6, 4.2, 0, [['۱ لیوان', 200]]),
  K('kl_شیر_دبل_پروتئین_ESL', 'شیر دبل پروتئین ESL', 'dairy', 58, 6.0, 5.0, 1.5, 0, [['۱ لیوان', 200]]),
  K('kl_مربای_شاه_توت_کاتلا', 'مربای شاه توت کاتلا', 'snack', 90, 0.0, 22.5, 0.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_مربای_زرشک_کاتلا', 'مربای زرشک کاتلا', 'snack', 90, 0.0, 22.5, 0.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_مربای_توت_فرنگی_کاتلا', 'مربای توت فرنگی کاتلا', 'snack', 90, 0.0, 22.5, 0.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_مربای_انجیر_کاتلا', 'مربای انجیر کاتلا', 'snack', 90, 0.0, 22.5, 0.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_مربای_آلبالو_کاتلا', 'مربای آلبالو کاتلا', 'snack', 90, 0.0, 22.5, 0.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_کرم_صبحانه_پسته_ای_کاتلا', 'کرم صبحانه پسته ای کاتلا', 'snack', 400, 8.3, 46.7, 20.0, 0, [['۱ وعده', 100]]),
  K('kl_کرم_صبحانه_شکلات_فندقی_کاتلا', 'کرم صبحانه شکلات فندقی کاتلا', 'snack', 389, 7.3, 51.8, 17.0, 0, [['۱ عدد', 25]]),
  K('kl_کرم_صبحانه_بادام_زمینی_کاتلا', 'کرم صبحانه بادام زمینی کاتلا', 'snack', 406, 24.8, 29.4, 21.0, 0, [['۱ وعده', 100]]),
  K('kl_بستنی_یخی_پیناکولادا_جیتو', 'بستنی یخی پیناکولادا جیتو', 'snack', 77, 0.0, 17.8, 0.6, 0, [['۱ اسکوپ', 75]]),
  K('kl_بستنی_یخی_بلوبری_جیتو', 'بستنی یخی بلوبری جیتو', 'snack', 56, 0.0, 14.0, 0.0, 0, [['۱ اسکوپ', 75]]),
  K('kl_کشک_بلوچیز_پاستوریزه', 'کشک بلوچیز پاستوریزه', 'dairy', 144, 11.0, 4.7, 9.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_کشک_پاستوریزه', 'کشک پاستوریزه', 'dairy', 68, 8.0, 4.6, 2.0, 0, [['۱ قاشق غذاخوری', 20]]),
  K('kl_پنیر_خامه_ای_ویلی_2X_با_دو_ب', 'پنیر خامه ای ویلی 2X با دو برابر پروتئین', 'dairy', 306, 12.0, 8.2, 25.0, 0, [['۱ برش', 30]]),
  K('kl_کشک_اسکوییز_پاستوریزه', 'کشک اسکوییز پاستوریزه', 'dairy', 68, 8.0, 4.6, 2.0, 0, [['۱ قاشق غذاخوری', 20]]),

/* ---------- Zar Macaron, from zarmacaron.com ----------
   Pasta, noodles and flours. Figures as published, for the dry product.   */
  Z('zr_اسپاگتی_قطر_۱_۲_وزن_۷۰۰_گر', 'اسپاگتی قطر ۱.۲ وزن ۷۰۰ گرمی', 356, 12.5, 74.0, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۵_وزن_۱۰۰۰_گ', 'اسپاگتی قطر ۱.۵ وزن ۱۰۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_پنه_ریگاته', 'پاستا پنه ریگاته', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_لازانیا_کلاسیک_۳۰۰_گرمی', 'لازانیا کلاسیک ۳۰۰ گرمی', 354, 12.8, 75.0, 0.3, 0.0, 55),
  Z('zr_پاستا_فتوچینی_آشیانه_ای_۳۰', 'پاستا فتوچینی آشیانه‌ای ۳۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_سبوس_دار_قطر_۱_۵_و', 'اسپاگتی سبوس دار قطر ۱.۵ وزن ۷۰۰ گرمی', 348, 12.8, 73.2, 0.4, 5.5, 55),
  Z('zr_اسپاگتی_سبوس_دار_قطر_۱_۵_و_2', 'اسپاگتی سبوس دار قطر ۱.۵ وزن ۵۰۰ گرمی', 348, 12.8, 73.2, 0.4, 5.5, 55),
  Z('zr_پاستا_فتوچینی_آشیانه_ای_سب', 'پاستا فتوچینی آشیانه‌ای سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_اسپاگتی_سبزیجات_قطر_۱_۵_وز', 'اسپاگتی سبزیجات قطر ۱.۵ وزن ۵۰۰ گرمی', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_مته_ای_سبزیجات', 'پاستا مته‌ای سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_پروانه_ای_سبزیجات', 'پاستا پروانه‌ای سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_ریگاته_سبزیجات', 'پاستا ریگاته سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_فوسیلی_سبزیجات', 'پاستا فوسیلی سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_میکس_سبزیجات', 'پاستا میکس سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_فرمی_شلز_سبزیجات', 'پاستا فرمی شلز سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_گراندی_سبزیجات', 'پاستا گراندی سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_فرمی_پیکولی_سبزیجات', 'پاستا فرمی پیکولی سبزیجات', 347, 13.4, 72.0, 0.6, 2.0, 55),
  Z('zr_پاستا_فرمی_تابی', 'پاستا فرمی تابی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_سدانو', 'پاستا فرمی سدانو', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_فوسیلی', 'پاستا فرمی فوسیلی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_پروانه_ای', 'پاستا فرمی پروانه‌ای', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_پیکولی', 'پاستا پیکولی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_شلز', 'پاستا فرمی شلز', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_فانتزیا_میکس', 'پاستا فرمی فانتزیا میکس', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_گرامینیا', 'پاستا فرمی گرامینیا', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فرمی_گراندی', 'پاستا فرمی گراندی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_پاستا_فتوچینی_آشیانه_ای_۵۰', 'پاستا فتوچینی آشیانه‌ای ۵۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_لازانیا_پیش_پخت_۳۰۰_گرمی', 'لازانیا پیش پخت ۳۰۰ گرمی', 390, 11.3, 86.2, 0.1, 0.0, 55),
  Z('zr_لازانیا_پیش_پخت_۵۰۰_گرمی', 'لازانیا پیش پخت ۵۰۰ گرمی', 390, 11.3, 86.2, 0.1, 0.0, 55),
  Z('zr_لازانیا_کلاسیک_5۰۰_گرمی', 'لازانیا کلاسیک 5۰۰ گرمی', 354, 12.8, 75.0, 0.3, 0.0, 55),
  Z('zr_اسپاگتی_بوکاتینی_قطر_۲_۵_و', 'اسپاگتی بوکاتینی قطر ۲.۵ وزن ۵۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_لینگوئینی_وزن_۵۰۰_', 'اسپاگتی لینگوئینی وزن ۵۰۰ گرمی', 356, 12.5, 74.0, 0.5, 1.1, 55),
  Z('zr_رشته_سوپی_آشیانه_ای_وزن_۳۰', 'رشته سوپی آشیانه‌ای وزن ۳۰۰ گرمی', 350, 10.0, 76.1, 0.6, 0.6, 55),
  Z('zr_رشته_سوپی_آشیانه_ای_وزن_۵۰', 'رشته سوپی آشیانه‌ای وزن ۵۰۰ گرمی', 350, 10.0, 76.1, 0.6, 0.6, 55),
  Z('zr_پاستا_فرمی_مته_ای', 'پاستا فرمی مته‌ای', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۷_وزن_۵۰۰_گر', 'اسپاگتی قطر ۱.۷ وزن ۵۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۷_وزن_۷۰۰_گر', 'اسپاگتی قطر ۱.۷ وزن ۷۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۵_وزن_۹۰۰_گر', 'اسپاگتی قطر ۱.۵ وزن ۹۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۵_وزن_۷۰۰_گر', 'اسپاگتی قطر ۱.۵ وزن ۷۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۵_وزن_۵۰۰_گر', 'اسپاگتی قطر ۱.۵ وزن ۵۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),
  Z('zr_اسپاگتی_قطر_۱_۲_وزن_۵۰۰_گر', 'اسپاگتی قطر ۱.۲ وزن ۵۰۰ گرمی', 341, 11.8, 72.4, 0.5, 1.1, 55),

/* ---------- the owner's curated Iranian table ----------
   Verified against USDA before import; see tools/table-sources.json.     */
  T('tb_001', 'شیر پرچرب 3٪', 'کاله', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_002', 'شیر کم چرب 1.5٪', 'کاله', 'dairy', 45, 3.2, 4.8, 1.5, 0, [['۱ لیوان', 200]]),
  T('tb_003', 'شیر بدون لاکتوز پرچرب', 'کاله', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_004', 'ماست سنتی پرچرب 8٪', 'کاله', 'dairy', 106, 3.9, 4.4, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_005', 'ماست یونانی/چکیده', 'کاله', 'grain', 97, 9.0, 4.0, 5.0, 0, [['۱ وعده', 100]]),
  T('tb_006', 'پنیر سفید صبحانه', 'کاله', 'dairy', 220, 14.0, 1.5, 18.0, 0, [['۱ وعده', 100]]),
  T('tb_007', 'پنیر خامه ای', 'کاله', 'dairy', 250, 5.0, 3.0, 24.0, 0, [['۱ وعده', 100]]),
  T('tb_008', 'شیر کم چرب', 'پگاه', 'dairy', 42, 3.3, 5.0, 1.0, 0, [['۱ لیوان', 200]]),
  T('tb_009', 'ماست همزده پرچرب', 'پگاه', 'dairy', 74, 3.6, 3.6, 5.0, 0, [['۱ وعده', 100]]),
  T('tb_010', 'ماست قفقازی', 'پگاه', 'dairy', 78, 3.6, 3.6, 5.0, 0, [['۱ وعده', 100]]),
  T('tb_011', 'ماست گاومیش', 'پگاه', 'dairy', 80, 3.5, 3.5, 6.0, 0, [['۱ وعده', 100]]),
  T('tb_012', 'ماست ساده', 'میهن', 'dairy', 65, 3.5, 4.5, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_013', 'ماست محلی شیراز', 'رامک', 'dairy', 90, 3.5, 4.0, 6.0, 0, [['۱ لیوان', 200]]),
  T('tb_014', 'ماست پروبیوتیک کم چرب', 'رامک', 'dairy', 55, 4.0, 4.5, 1.5, 0, [['۱ وعده', 100]]),
  T('tb_015', 'پنیر خامه ای', 'رامک', 'dairy', 250, 5.0, 2.0, 24.0, 0, [['۱ وعده', 100]]),
  T('tb_016', 'دوغ نعنا', 'رامک', 'drink', 30, 1.5, 3.0, 1.2, 0, [['۱ لیوان', 200]]),
  T('tb_017', 'ماست پرچرب پروبیوتیک', 'هراز', 'dairy', 70, 3.8, 4.2, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_018', 'شیر', 'هراز', 'dairy', 58, 3.1, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_019', 'شیر', 'صباح', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_020', 'شیر', 'پاک', 'dairy', 58, 3.1, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_021', 'شیر', 'کالبر', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_022', 'پنیر لیقوان/تبریز', null, 'dairy', 260, 18.0, 1.0, 21.0, 0, [['۱ وعده', 100]]),
  T('tb_024', 'کنسرو لوبیا چیتی با سس', 'چین چین', 'fat', 90, 4.5, 12.0, 3.5, 4.0, [['۱ وعده', 100]]),
  T('tb_025', 'کنسرو لوبیا با قارچ', 'چین چین', 'protein', 90, 4.0, 12.0, 2.4, 3.5, [['۱ وعده', 100]]),
  T('tb_026', 'کنسرو نخود سبز', 'چین چین', 'protein', 70, 4.0, 12.0, 1.0, 4.0, [['۱ وعده', 100]]),
  T('tb_027', 'کنسرو خوراک بادمجان', 'چین چین', 'veg', 80, 2.0, 6.0, 5.0, 2.0, [['۱ وعده', 100]]),
  T('tb_028', 'کنسرو لوبیا چیتی', 'یک و یک', 'protein', 95, 5.0, 13.0, 3.0, 4.5, [['۱ وعده', 100]]),
  T('tb_029', 'کنسرو نخود', 'یک و یک', 'protein', 85, 5.0, 14.0, 1.5, 4.0, [['۱ وعده', 100]]),
  T('tb_030', 'کنسرو خورش قیمه', 'یک و یک', 'protein', 120, 6.0, 10.0, 6.0, 2.0, [['۱ وعده', 100]]),
  T('tb_031', 'کنسرو خورش قورمه سبزی', 'یک و یک', 'veg', 110, 7.0, 5.0, 7.0, 2.5, [['۱ وعده', 100]]),
  T('tb_032', 'کنسرو لوبیا', 'برتر', 'protein', 90, 4.5, 12.0, 3.0, 4.0, [['۱ وعده', 100]]),
  T('tb_033', 'کنسرو سبزیجات', 'فامیلا', 'veg', 50, 2.0, 10.0, 0.5, 3.0, [['۱ وعده', 100]]),
  T('tb_034', 'کنسرو ذرت', null, 'protein', 80, 2.5, 16.0, 1.0, 2.0, [['۱ وعده', 100]]),
  T('tb_035', 'کنسرو قارچ', null, 'protein', 25, 2.0, 3.0, 0.3, 1.5, [['۱ وعده', 100]]),
  T('tb_036', 'روغن مایع آفتابگردان', 'لادن', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_037', 'کره گیاهی/مارگارین', 'لادن', 'fat', 720, 0.5, 0.5, 80.0, 0, [['۱ وعده', 100]]),
  T('tb_038', 'روغن مایع', 'بهار', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_039', 'روغن سرخ کردنی', 'بهار', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_040', 'روغن زیتون فوق بکر', null, 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_041', 'کره حیوانی', null, 'fat', 717, 0.9, 0.1, 81.0, 0, [['۱ وعده', 100]]),
  T('tb_042', 'نان تست سفید', 'نان آوران', 'grain', 270, 9.0, 50.0, 3.5, 2.5, [['۱ وعده', 100]]),
  T('tb_043', 'نان تست سبوس دار', 'نان آوران', 'grain', 250, 10.0, 45.0, 3.0, 6.0, [['۱ وعده', 100]]),
  T('tb_044', 'برنج سفید ایرانی (پخته)', 'گلستان', 'grain', 130, 2.7, 28.0, 0.3, 0.4, [['۱ وعده', 100]]),
  T('tb_045', 'برنج قهوه ای (پخته)', 'گلستان', 'grain', 112, 2.6, 23.5, 0.9, 1.8, [['۱ وعده', 100]]),
  T('tb_046', 'جو دوسر خام', null, 'grain', 389, 17.0, 66.0, 7.0, 10.0, [['۱ وعده', 100]]),
  T('tb_047', 'بلغور گندم', null, 'grain', 342, 12.0, 76.0, 1.5, 13.0, [['۱ وعده', 100]]),
  T('tb_048', 'سوسیس معمولی', 'کاله پروتئین/سولیکو', 'protein', 280, 12.0, 3.0, 24.0, 0, [['۱ وعده', 100]]),
  T('tb_049', 'کباب لقمه', 'رباط', 'protein', 220, 18.0, 3.0, 15.0, 0, [['۱ وعده', 100]]),
  T('tb_050', 'سینه مرغ پخته بدون پوست', null, 'protein', 165, 31.0, 0.0, 3.6, 0, [['۱ وعده', 100]]),
  T('tb_051', 'گوشت گوسفند پخته', null, 'protein', 280, 25.0, 0.0, 20.0, 0, [['۱ وعده', 100]]),
  T('tb_052', 'گوشت گوساله پخته', null, 'protein', 250, 26.0, 0.0, 15.0, 0, [['۱ وعده', 100]]),
  T('tb_053', 'آبمیوه پرتقال', 'سن ایچ', 'drink', 45, 0.5, 10.0, 0.1, 0.2, [['۱ لیوان', 200]]),
  T('tb_054', 'آبمیوه سیب', 'سن ایچ', 'drink', 46, 0.1, 11.0, 0.1, 0.2, [['۱ لیوان', 200]]),
  T('tb_055', 'ترشی مخلوط', 'مهرام', 'veg', 20, 0.8, 4.0, 0.3, 1.5, [['۱ وعده', 100]]),
  T('tb_056', 'بیسکویت ساده', 'شیرین عسل', 'snack', 450, 7.0, 65.0, 18.0, 2.0, [['۱ وعده', 100]]),
  T('tb_057', 'مربا توت فرنگی', null, 'snack', 250, 0.4, 65.0, 0.1, 1.0, [['۱ وعده', 100]]),
  T('tb_058', 'لپه پخته', null, 'protein', 118, 8.3, 21.0, 0.4, 5.0, [['۱ وعده', 100]]),
  T('tb_059', 'سیب زمینی آب پز', null, 'fruit', 87, 1.9, 20.0, 0.1, 1.8, [['۱ لیوان', 200]]),
  T('tb_060', 'بادمجان پخته', null, 'veg', 35, 0.8, 8.6, 0.2, 2.5, [['۱ وعده', 100]]),
  T('tb_061', 'تخم مرغ کامل', null, 'protein', 155, 13.0, 1.1, 11.0, 0, [['۱ وعده', 100]]),
  T('tb_062', 'گوشت مرغ سینه', null, 'protein', 165, 31.0, 0.0, 3.6, 0, [['۱ وعده', 100]]),

/* ---------- the rest of the owner's table ----------
   Brand rows the first import discarded by deduplicating on the name alone,
   which treated "پگاه / شیر پرچرب" as the same row as a reference figure for
   whole milk. They are different foods and both belong.                 */
  T('tb_063', 'خامه صبحانه', 'کاله', 'dairy', 300, 2.5, 3.0, 30.0, 0, [['۱ وعده', 100]]),
  T('tb_064', 'شیر پرچرب', 'پگاه', 'dairy', 60, 3.1, 4.8, 3.2, 0, [['۱ لیوان', 200]]),
  T('tb_065', 'پنیر پروسس', 'پگاه', 'fat', 213, 12.0, 1.3, 18.0, 0, [['۱ وعده', 100]]),
  T('tb_066', 'دوغ', 'پگاه', 'drink', 28, 1.4, 3.2, 0.9, 0, [['۱ لیوان', 200]]),
  T('tb_067', 'شیر پرچرب', 'میهن', 'dairy', 60, 3.0, 4.7, 3.2, 0, [['۱ لیوان', 200]]),
  T('tb_068', 'بستنی وانیلی', 'میهن', 'snack', 200, 3.5, 24.0, 10.0, 0, [['۱ وعده', 100]]),
  T('tb_069', 'خامه', 'میهن', 'dairy', 320, 2.2, 3.0, 32.0, 0, [['۱ وعده', 100]]),
  T('tb_070', 'شیر پرچرب', 'رامک', 'dairy', 60, 3.0, 4.8, 3.2, 0, [['۱ لیوان', 200]]),
  T('tb_071', 'ماست پروبیوتیک پرچرب', 'رامک', 'dairy', 70, 3.8, 4.0, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_072', 'شیر پرچرب', 'دامداران', 'dairy', 60, 3.1, 4.8, 3.2, 0, [['۱ لیوان', 200]]),
  T('tb_073', 'ماست', 'دامداران', 'dairy', 65, 3.5, 4.5, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_074', 'ماست پرچرب', 'صباح', 'dairy', 70, 3.6, 4.0, 4.0, 0, [['۱ وعده', 100]]),
  T('tb_075', 'ماست', 'پاک', 'dairy', 62, 3.5, 4.5, 3.2, 0, [['۱ وعده', 100]]),
  T('tb_076', 'پنیر سفید', 'کالبر', 'dairy', 210, 14.0, 1.5, 17.0, 0, [['۱ وعده', 100]]),
  T('tb_077', 'کشک مایع', null, 'dairy', 80, 8.0, 6.0, 2.0, 0, [['۱ وعده', 100]]),
  T('tb_078', 'تن ماهی در روغن', 'چین چین', 'fat', 186, 26.5, 0.0, 8.1, 0, [['۱ وعده', 100]]),
  T('tb_079', 'تن ماهی در آب', 'چین چین', 'protein', 116, 25.5, 0.0, 0.8, 0, [['۱ وعده', 100]]),
  T('tb_080', 'تن ماهی', 'برتر', 'protein', 180, 25.0, 0.0, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_081', 'تن ماهی', 'اویلا', 'protein', 185, 26.0, 0.0, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_082', 'روغن ذرت', 'لادن', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_083', 'روغن زیتون', 'اویلا', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_084', 'روغن کنجد', 'اویلا', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_085', 'نان تست', 'نان سحر', 'grain', 265, 9.0, 50.0, 3.0, 2.5, [['۱ وعده', 100]]),
  T('tb_090', 'ماکارونی پخته', 'تک ماکارون', 'grain', 131, 5.0, 25.0, 0.8, 1.5, [['۱ وعده', 100]]),
  T('tb_091', 'کالباس', 'کاله پروتئین/سولیکو', 'protein', 250, 13.0, 4.0, 20.0, 0, [['۱ وعده', 100]]),
  T('tb_092', 'همبرگر', 'کاله پروتئین/سولیکو', 'protein', 250, 15.0, 5.0, 18.0, 0.5, [['۱ وعده', 100]]),
  T('tb_093', 'سوسیس', '202', 'protein', 290, 12.0, 3.0, 25.0, 0, [['۱ وعده', 100]]),
  T('tb_094', 'کالباس', '202', 'protein', 260, 13.0, 4.0, 21.0, 0, [['۱ وعده', 100]]),
  T('tb_095', 'ناگت مرغ', 'رباط', 'protein', 250, 14.0, 15.0, 14.0, 1.0, [['۱ وعده', 100]]),
  T('tb_096', 'سس مایونز', 'مهرام', 'fat', 680, 1.0, 2.0, 75.0, 0, [['۱ وعده', 100]]),
  T('tb_097', 'سس کچاپ', 'مهرام', 'fat', 100, 1.5, 25.0, 0.2, 1.0, [['۱ وعده', 100]]),
  T('tb_098', 'ویفر', 'شیرین عسل', 'snack', 500, 6.0, 60.0, 25.0, 1.5, [['۱ وعده', 100]]),

/* ---------- second pass of the owner's table ---------- */
  T('tb_099', 'شیر پرچرب 4٫2٪', 'کاله', 'dairy', 60, 3.0, 4.7, 4.2, 0, [['۱ لیوان', 200]]),
  T('tb_100', 'شیر کم چرب 1٫5٪', 'کاله', 'dairy', 46, 3.0, 4.8, 1.5, 0, [['۱ لیوان', 200]]),
  T('tb_101', 'شیر زیرو (بدون چربی)', 'کاله', 'dairy', 32, 3.0, 4.8, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_102', 'ماست سنتی 8٪ چربی', 'کاله', 'dairy', 106, 3.9, 4.4, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_103', 'ماست پرچرب', 'پگاه', 'dairy', 70, 3.6, 3.6, 4.5, 0, [['۱ وعده', 100]]),
  T('tb_104', 'کره گیاهی/مارگارین', null, 'fat', 720, 0.5, 0.5, 80.0, 0, [['۱ وعده', 100]]),
  T('tb_105', 'نان تست سفید', null, 'grain', 270, 9.0, 50.0, 3.5, 2.5, [['۱ وعده', 100]]),
  T('tb_106', 'نان تست سبوس دار', null, 'grain', 250, 10.0, 45.0, 3.0, 6.0, [['۱ وعده', 100]]),
  T('tb_107', 'برنج سفید ایرانی پخته', 'گلستان', 'grain', 130, 2.7, 28.0, 0.3, 0.4, [['۱ وعده', 100]]),
  T('tb_108', 'برنج قهوه ای پخته', 'گلستان', 'grain', 112, 2.6, 23.5, 0.9, 1.8, [['۱ وعده', 100]]),

/* ---------- third pass of the owner's table ---------- */
  T('tb_121', 'شیر زیرو بدون چربی', 'کاله', 'dairy', 32, 3.0, 4.8, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_122', 'ماست سنتی 8٪', 'کاله', 'dairy', 106, 3.9, 4.4, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_123', 'کره حیوانی', 'کاله', 'fat', 717, 0.9, 0.1, 81.0, 0, [['۱ وعده', 100]]),
  T('tb_124', 'ماست کم چرب', 'پگاه', 'dairy', 55, 4.0, 4.5, 1.5, 0, [['۱ وعده', 100]]),
  T('tb_125', 'شیر', 'چوپان', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_126', 'ماست چکیده سنتی', null, 'dairy', 120, 8.0, 4.0, 7.0, 0, [['۱ وعده', 100]]),
  T('tb_127', 'لوبیا چیتی با سس', 'چین چین', 'fat', 90, 4.5, 12.0, 3.5, 4.0, [['۱ وعده', 100]]),
  T('tb_128', 'لوبیا با قارچ', 'چین چین', 'protein', 90, 4.0, 12.0, 2.4, 3.5, [['۱ وعده', 100]]),
  T('tb_129', 'نخود سبز', 'چین چین', 'protein', 70, 4.0, 12.0, 1.0, 4.0, [['۱ وعده', 100]]),
  T('tb_130', 'خوراک بادمجان', 'چین چین', 'veg', 80, 2.0, 6.0, 5.0, 2.0, [['۱ وعده', 100]]),
  T('tb_131', 'لوبیا چیتی', 'یک و یک', 'protein', 95, 5.0, 13.0, 3.0, 4.5, [['۱ وعده', 100]]),
  T('tb_132', 'نخود', 'یک و یک', 'protein', 85, 5.0, 14.0, 1.5, 4.0, [['۱ وعده', 100]]),
  T('tb_133', 'خورش قیمه', 'یک و یک', 'protein', 120, 6.0, 10.0, 6.0, 2.0, [['۱ وعده', 100]]),
  T('tb_134', 'خورش قورمه سبزی', 'یک و یک', 'protein', 110, 7.0, 5.0, 7.0, 2.5, [['۱ وعده', 100]]),
  T('tb_135', 'تن ماهی', 'یک و یک', 'protein', 180, 25.0, 0.0, 8.0, 0, [['۱ وعده', 100]]),
  T('tb_136', 'لوبیا', 'برتر', 'protein', 90, 4.5, 12.0, 3.0, 4.0, [['۱ وعده', 100]]),
  T('tb_137', 'کنسرو نخود فرنگی', null, 'protein', 70, 4.5, 12.0, 0.5, 4.5, [['۱ وعده', 100]]),
  T('tb_138', 'روغن آفتابگردان', 'لادن', 'fat', 884, 0.0, 0.0, 100.0, 0, [['۱ وعده', 100]]),
  T('tb_139', 'کره گیاهی', 'لادن', 'fat', 720, 0.5, 0.5, 80.0, 0, [['۱ وعده', 100]]),
  T('tb_140', 'برنج سفید پخته', 'گلستان', 'grain', 130, 2.7, 28.0, 0.3, 0.4, [['۱ وعده', 100]]),
  T('tb_141', 'آرد گندم', null, 'grain', 364, 10.0, 76.0, 1.0, 2.7, [['۱ وعده', 100]]),
  T('tb_142', 'ران مرغ با پوست', null, 'protein', 215, 24.0, 0.0, 12.0, 0, [['۱ وعده', 100]]),
  T('tb_143', 'گوشت چرخ کرده پخته', null, 'protein', 250, 26.0, 0.0, 15.0, 0, [['۱ وعده', 100]]),
  T('tb_144', 'نکتار هلو', 'سن ایچ', 'drink', 50, 0.3, 12.0, 0.1, 0.3, [['۱ لیوان', 200]]),
  T('tb_145', 'آبمیوه', 'عالیس', 'drink', 45, 0.4, 10.0, 0.1, 0.2, [['۱ لیوان', 200]]),
  T('tb_146', 'دوغ', 'کاله', 'drink', 30, 1.5, 3.5, 1.0, 0, [['۱ لیوان', 200]]),
  T('tb_147', 'ماءالشعیر', null, 'drink', 40, 0.3, 9.0, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_148', 'نوشابه گازدار', null, 'drink', 42, 0.0, 10.6, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_149', 'آب معدنی', null, 'drink', 0, 0.0, 0.0, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_150', 'چای سیاه (بدون قند)', null, 'drink', 1, 0.0, 0.3, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_151', 'زیتون شور', 'مهرام', 'iranian', 145, 1.0, 4.0, 15.0, 3.0, [['۱ وعده', 100]]),
  T('tb_152', 'سس کچاپ', 'فامیلا', 'fat', 100, 1.5, 25.0, 0.2, 1.0, [['۱ وعده', 100]]),
  T('tb_153', 'شکلات', 'شونیز', 'snack', 530, 6.0, 58.0, 30.0, 3.0, [['۱ وعده', 100]]),
  T('tb_154', 'چیپس سیب زمینی', null, 'iranian', 536, 7.0, 50.0, 35.0, 4.0, [['۱ وعده', 100]]),
  T('tb_155', 'آجیل مخلوط', null, 'iranian', 600, 18.0, 20.0, 50.0, 8.0, [['۱ وعده', 100]]),
  T('tb_165', 'ماهی قزل آلا پخته', null, 'protein', 208, 22.0, 0.0, 13.0, 0, [['۱ وعده', 100]]),

/* ---------- third pass of the owner's table ---------- */
  T('tb_166', 'قهوه سیاه', null, 'drink', 2, 0.1, 0.0, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_167', 'خیارشور', 'مهرام', 'veg', 15, 0.5, 2.0, 0.2, 1.0, [['۱ وعده', 100]]),
  T('tb_168', 'خیارشور', 'فامیلا', 'veg', 15, 0.5, 2.0, 0.2, 1.0, [['۱ وعده', 100]]),

/* ---------- fourth pass of the owner's table ---------- */
  T('tb_169', 'شیر زیرو', 'کاله', 'dairy', 32, 3.0, 4.8, 0.0, 0, [['۱ لیوان', 200]]),
  T('tb_170', 'ماست یونانی', 'کاله', 'grain', 97, 9.0, 4.0, 5.0, 0, [['۱ وعده', 100]]),
  T('tb_171', 'ماست پروبیوتیک', 'رامک', 'dairy', 70, 3.8, 4.0, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_172', 'سوسیس', 'کاله پروتئین/سولیکو', 'protein', 280, 12.0, 3.0, 24.0, 0, [['۱ وعده', 100]]),
  T('tb_175', 'سس فرانسوی', 'مهرام', 'fat', 528, 1.5, 7.6, 54.0, 0, [['۱ وعده', 100]]),
  T('tb_176', 'سس هزار جزیره', 'مهرام', 'fat', 400, 1.5, 9.5, 39.0, 0, [['۱ وعده', 100]]),
  T('tb_177', 'سس رنچ', 'مهرام', 'fat', 700, 1.5, 7.5, 72.0, 0, [['۱ وعده', 100]]),
  T('tb_178', 'ترشی بندری', 'مهرام', 'veg', 23, 0.5, 4.0, 0.3, 1.5, [['۱ وعده', 100]]),
  T('tb_179', 'مربا توت فرنگی', 'مهرام', 'snack', 278, 0.4, 69.0, 0.1, 1.1, [['۱ وعده', 100]]),
  T('tb_180', 'مربا آلبالو', 'مهرام', 'snack', 278, 0.4, 69.0, 0.1, 1.1, [['۱ وعده', 100]]),

/* ---------- fourth pass of the owner's table ---------- */
  T('tb_181', 'برنج سفید خام', 'گلستان', 'grain', 364, 7.6, 80.0, 0.3, 1.3, [['۱ وعده', 100]]),

/* ---------- Mihan products ---------- */
  T('tb_182', 'شیر کم چرب', 'میهن', 'dairy', 45, 3.2, 4.8, 1.5, 0, [['۱ لیوان', 200]]),
  T('tb_183', 'شیر فرادما', 'میهن', 'dairy', 58, 3.0, 4.7, 3.0, 0, [['۱ لیوان', 200]]),
  T('tb_184', 'ماست ساده پرچرب', 'میهن', 'dairy', 65, 3.5, 4.5, 3.5, 0, [['۱ وعده', 100]]),
  T('tb_185', 'ماست چکیده / غلیظ', 'میهن', 'dairy', 100, 7.0, 4.0, 6.0, 0, [['۱ وعده', 100]]),
  T('tb_186', 'کره', 'میهن', 'fat', 717, 0.9, 0.1, 81.0, 0, [['۱ وعده', 100]]),
  T('tb_187', 'دوغ ساده', 'میهن', 'drink', 30, 1.5, 3.5, 1.0, 0, [['۱ لیوان', 200]]),
  T('tb_188', 'دوغ نعنا', 'میهن', 'drink', 30, 1.5, 3.5, 1.0, 0, [['۱ لیوان', 200]]),
  T('tb_189', 'بستنی شکلاتی', 'میهن', 'snack', 220, 3.5, 25.0, 12.0, 0.5, [['۱ وعده', 100]]),
  T('tb_190', 'بستنی میوه ای', 'میهن', 'snack', 180, 2.5, 28.0, 6.0, 0.5, [['۱ وعده', 100]]),
  T('tb_191', 'بستنی قیفی / سنتی', 'میهن', 'snack', 210, 3.5, 24.0, 11.0, 0, [['۱ وعده', 100]]),
  T('tb_192', 'پنیر سفید', 'میهن', 'dairy', 220, 14.0, 1.5, 18.0, 0, [['۱ وعده', 100]]),
  T('tb_193', 'پنیر خامه ای', 'میهن', 'dairy', 250, 5.0, 3.0, 24.0, 0, [['۱ وعده', 100]]),
  T('tb_194', 'دسر شیری', 'میهن', 'dairy', 120, 3.0, 18.0, 4.0, 0, [['۱ لیوان', 200]]),

/* ---------- fast food ----------
   USDA's own published records — the pizzas by topping, fried chicken by cut,
   the burgers and the sides. FDC ids are in tools/usda-sources.json so every
   figure can be traced back to the record it was taken from.              */
  F('ff_pizza_cheese', 'Cheese pizza', 'پیتزا پنیر', 'fastfood', 268, 10.4, 29.0, 12.3, 2.2, [['۱ برش', 110]]),
  F('ff_pizza_veg', 'Meat and vegetable pizza', 'پیتزا گوشت و سبزیجات', 'fastfood', 276, 11.3, 25.1, 14.4, 2.2, [['۱ برش', 110]]),
  F('ff_pizza_meat', 'Meat pizza, thick crust', 'پیتزا گوشت (خمیر ضخیم)', 'fastfood', 274, 11.8, 30.8, 11.5, 2.3, [['۱ برش', 115]]),
  F('ff_pizza_thick', 'Thick crust pizza', 'پیتزا خمیر ضخیم پنیر', 'fastfood', 271, 10.8, 33.2, 10.5, 2.2, [['۱ برش', 130]]),
  F('ff_fc_breast', 'Fried chicken breast', 'سینه مرغ سوخاری', 'fastfood', 260, 24.8, 9.0, 13.2, 0.3, [['۱ تکه', 140]]),
  F('ff_fc_wing', 'Fried chicken wing', 'بال سوخاری', 'fastfood', 324, 19.9, 10.9, 21.8, 0.3, [['۳ عدد', 100]]),
  F('ff_pizza_pep', 'Pepperoni pizza', 'پیتزا پپرونی', 'fastfood', 274, 14.4, 24.7, 13.1, 2.0, [['۱ برش', 110]]),
  F('ff_fc_drum', 'Fried drumstick', 'ساق مرغ سوخاری', 'fastfood', 268, 22.0, 8.3, 15.8, 0.3, [['۱ عدد', 100]]),
  F('ff_fc_thigh', 'Fried chicken thigh', 'ران مرغ سوخاری', 'fastfood', 277, 21.6, 9.1, 16.5, 0.3, [['۱ عدد', 110]]),
  F('ff_fc_strips', 'Chicken strips', 'استریپس مرغ', 'fastfood', 228, 21.4, 10.4, 11.2, 0.9, [['۴ عدد', 120]]),
  F('ff_fc_popcorn', 'Popcorn chicken', 'پاپ‌کورن چیکن', 'fastfood', 268, 12.0, 16.1, 17.3, 1.6, [['۱ وعده', 100]]),
  F('ff_bg_cheese', 'Cheeseburger', 'چیزبرگر', 'fastfood', 308, 16.5, 28.0, 14.7, 2.0, [['۱ عدد', 130]]),
  F('ff_bg_double', 'Double burger', 'دوبل برگر', 'fastfood', 282, 16.2, 18.0, 16.2, 1.0, [['۱ عدد', 190]]),
  F('ff_bg_plain', 'Hamburger, plain', 'همبرگر ساده', 'fastfood', 297, 16.5, 31.5, 12.0, 1.7, [['۱ عدد', 120]]),
  F('ff_sw_chickenf', 'Chicken fillet sandwich', 'ساندویچ فیله مرغ سوخاری', 'fastfood', 250, 16.3, 20.9, 11.2, 1.4, [['۱ عدد', 180]]),
  F('ff_sw_fish', 'Fish sandwich', 'ساندویچ ماهی', 'fastfood', 257, 10.3, 26.7, 12.4, 1.0, [['۱ عدد', 160]]),
  F('ff_sw_roastbeef', 'Roast beef sandwich', 'ساندویچ رست بیف', 'fastfood', 244, 15.2, 22.2, 10.3, 1.3, [['۱ عدد', 140]]),
  F('ff_sw_club', 'Club sandwich', 'ساندویچ کلاب', 'fastfood', 146, 10.7, 20.4, 2.4, 1.4, [['۱ عدد', 220]]),
  F('ff_sw_tuna', 'Tuna sandwich', 'ساندویچ تن ماهی', 'fastfood', 218, 12.3, 16.0, 12.0, 0.7, [['۱ عدد', 220]]),
  F('ff_sw_steak', 'Steak sandwich', 'ساندویچ استیک', 'fastfood', 183, 12.3, 21.5, 5.3, 1.2, [['۱ عدد', 220]]),
  F('ff_sd_onionring', 'Onion rings', 'پیاز سوخاری', 'fastfood', 356, 4.9, 40.7, 19.3, 2.6, [['۱ وعده', 80]]),
  F('ff_sd_nachos', 'Nachos with cheese', 'ناچو با پنیر', 'fastfood', 343, 4.3, 34.9, 21.5, 3.2, [['۱ وعده', 110]]),
  F('ff_sd_coleslaw', 'Coleslaw', 'سالاد کلم (کول‌اسلا)', 'fastfood', 153, 0.9, 14.9, 9.9, 1.9, [['۱ وعده', 100]]),
  F('ff_sd_hashbrown', 'Hash browns', 'هش براون', 'fastfood', 242, 3.2, 34.0, 10.3, 3.6, [['۱ وعده', 80]]),
  F('ff_sd_potwedge', 'Oven steak fries', 'سیب‌زمینی استیکی تنوری', 'fastfood', 148, 2.6, 27.0, 3.8, 2.6, [['۱ وعده', 120]]),
  F('ff_sd_mozz', 'Mozzarella sticks', 'پنیر سوخاری', 'fastfood', 325, 14.8, 25.1, 18.3, 2.0, [['۴ عدد', 90]]),
  F('ff_ww_burrito', 'Beef and bean burrito', 'بوریتو گوشت و لوبیا', 'fastfood', 205, 7.3, 31.2, 6.0, 4.2, [['۱ عدد', 190]]),
  F('ff_ww_taco', 'Beef taco', 'تاکو گوشت', 'fastfood', 226, 8.9, 19.8, 12.7, 3.9, [['۱ عدد', 100]]),
  F('ff_bf_eggmuffin', 'Egg and cheese sandwich', 'ساندویچ تخم مرغ و پنیر', 'fastfood', 312, 11.1, 21.0, 20.8, 0.2, [['۱ عدد', 160]]),
  F('ff_bf_pancake', 'Pancakes', 'پنکیک', 'fastfood', 227, 6.4, 28.3, 9.7, 0, [['۲ عدد', 150]]),
  F('ff_bf_waffle', 'Waffle', 'وافل', 'fastfood', 291, 7.9, 32.9, 14.1, 0, [['۱ عدد', 90]]),
  F('ff_sw_shake_ch', 'Chocolate shake', 'میلک‌شیک شکلاتی', 'fastfood', 119, 3.0, 21.2, 2.7, 0.3, [['۱ لیوان', 250]]),
  F('ff_sw_softserve', 'Soft serve ice cream', 'بستنی نرم (سافت)', 'fastfood', 126, 4.9, 21.8, 2.6, 0.0, [['۱ اسکوپ', 90]]),
  F('ff_sw_apple_pie', 'Apple pie', 'پای سیب', 'fastfood', 237, 1.9, 34.0, 11.0, 1.6, [['۱ برش', 120]]),
];

export const FOOD_INDEX = Object.fromEntries(FOODS.map(f => [f.id, f]));

/* ============================================================================
   ALIASES — the other names people type
   ----------------------------------------------------------------------------
   Measuring the search showed that every branded product it could not find
   already existed here as a generic food: "ماست میهن" failed while "ماست"
   was sitting in the table. So these are not new foods, they are the words
   people actually use for the foods already listed.

   A brand alias deliberately resolves to the generic row. Claiming to know
   one company's exact label would be inventing a number; saying "that is a
   full-fat yogurt" is true, and the user can still correct the grams.
============================================================================ */

export const ALIASES = {
  /* --- dairy brands --- */
  d_yogurt:      ['ماست میهن', 'ماست کاله', 'ماست دامداران', 'ماست پگاه', 'ماست رامک', 'ماست صباح'],
  d_yogurt_full: ['ماست پرچرب میهن', 'ماست سنتی', 'ماست چکه'],
  d_yogurt_low:  ['ماست کم چرب کاله', 'ماست رژیمی', 'ماست پروبیوتیک'],
  d_milk_whole:  ['شیر پگاه', 'شیر میهن', 'شیر کاله', 'شیر دامداران', 'شیر پرچرب', 'شیر نایلونی'],
  d_milk_low:    ['شیر کم چرب پگاه', 'شیر رژیمی', 'شیر بدون لاکتوز'],
  d_cheese_white:['پنیر کاله', 'پنیر پگاه', 'پنیر میهن', 'پنیر صباح', 'پنیر ورقه ای', 'پنیر تبریز', 'پنیر بلغاری'],
  d_cheese_feta: ['پنیر فتا کاله', 'پنیر یونانی'],
  d_mozzarella:  ['پنیر پیتزا کاله', 'موزارلا', 'پنیر ورقه ای پیتزا'],
  d_cream_cheese:['پنیر خامه ای کاله', 'پنیر صبحانه'],
  d_lighvan:     ['پنیر لیقوان تبریز', 'پنیر گوسفندی'],
  d_chekideh:    ['ماست چکیده کاله', 'لبنه'],
  d_kashk:       ['کشک بطری', 'کشک مایع'],
  ir_khameh_sob: ['خامه کاله', 'خامه صبحانه میهن', 'خامه پگاه'],

  /* --- drinks --- */
  dr_cola:       ['کوکا کولا', 'کوکاکولا', 'پپسی', 'زمزم', 'کولا', 'فانتا', 'اسپرایت', 'سون آپ', 'کنزو'],
  dr_cola_diet:  ['کوکا زیرو', 'پپسی دیت', 'نوشابه بدون قند', 'کولا زیرو'],
  dr_delster:    ['دلستر بهنوش', 'دلستر', 'ماالشعیر', 'ایستک', 'هوفنبرگ', 'جوجو', 'بهنوش'],
  dr_juice_box:  ['آبمیوه سن ایچ', 'سن ایچ', 'تکدانه', 'میهن آبمیوه', 'رانی', 'آبمیوه پاکتی', 'نکتار'],
  d_doogh:       ['دوغ آبعلی', 'دوغ کاله', 'دوغ میهن', 'دوغ عالیس', 'دوغ سنتی'],
  dr_doogh_gaz:  ['دوغ گازدار آبعلی', 'دوغ گازدار کاله'],
  dr_ice_tea:    ['آیس تی', 'چای سرد', 'نستله آیس تی', 'لیپتون آیس تی'],
  dr_nescafe:    ['نسکافه', 'کافی میکس', 'قهوه فوری', 'نسکافه ۳ در ۱', 'هات چاکلت'],
  dr_milk_choco: ['شیر کاکائو کاله', 'شیر کاکائو میهن', 'پرو شیر کاکائو', 'شیرکاکائو'],
  dr_tea:        ['چای سیاه', 'چای گلستان', 'چای احمد', 'چای دبش', 'چای کیسه ای'],
  dr_water:      ['آب معدنی', 'آب آشامیدنی', 'دماوند', 'واتا'],

  /* --- snacks --- */
  s_chips:       ['چیپس چی توز', 'چی توز', 'چیتوز', 'چیپس مزمز', 'مزمز', 'چیپس لینا', 'چیپس سیب زمینی'],
  sn_pofak:      ['پفک نمکی', 'پفک مزمز', 'پفک چی توز', 'اسنک', 'موشی موشی', 'لینا پفک'],
  s_biscuit:     ['بیسکویت مادر', 'بیسکویت ساقه طلایی', 'ساقه طلایی', 'بیسکویت گرجی', 'بیسکویت شیرین عسل',
                  'بیسکویت پتی بور', 'مینو بیسکویت', 'اورئو'],
  s_choc_milk:   ['شکلات شیرین عسل', 'شکلات مینو', 'شکلات فرمند', 'شکلات آیدین', 'کیندر', 'شکلات تخته ای'],
  sn_choc_spread:['نوتلا', 'شکلات صبحانه', 'شکلات صبحانه شیرین عسل', 'کرم کاکائو'],
  s_cake:        ['کیک هاتی کارا', 'هاتی کارا', 'کیک تی تی', 'کیک دوقلو', 'کیک صبحانه', 'کیک یزدی'],
  sn_wafer:      ['ویفر شیرین عسل', 'ویفر مینو', 'ویفر آناتا', 'کیت کت'],
  sn_pastil:     ['پاستیل', 'ژله ای', 'مارشمالو', 'آدامس خرسی'],
  s_icecream:    ['بستنی میهن', 'بستنی کاله', 'بستنی دومینو', 'بستنی چوبی', 'مگنوم'],
  sn_nokhodchi:  ['نخودچی کشمش', 'نخودچی آجیل'],

  n_sesame:     ['ارده', 'ارده کنجد', 'طحینه', 'کره کنجد'],

  /* --- packaged staples --- */
  p_tuna_can:    ['تن ماهی شیلانه', 'تن ماهی طبیعت', 'تن ماهی', 'کنسرو ماهی', 'تون ماهی'],
  p_tuna_oil:    ['تن ماهی در روغن شیلانه', 'کنسرو تن در روغن'],
  p_sausage:     ['سوسیس کاله', 'سوسیس میکائیلیان', 'هات داگ سوسیس', 'سوسیس آلمانی'],
  p_kalbas:      ['کالباس کاله', 'کالباس میکائیلیان', 'کالباس خروس', 'کالباس مرغ'],
  o_mayo:        ['سس مایونز بهروز', 'مایونز', 'سس مایونز کامچین', 'سس مایونز مهرام'],
  o_ketchup:     ['سس گوجه بهروز', 'رب گوجه', 'کچاپ', 'سس قرمز'],
  s_jam:         ['مربا بهروز', 'مربا شانا', 'مربای آلبالو', 'مربای هویج'],
  s_honey:       ['عسل طبیعی', 'عسل سبلان'],
  g_pasta_dry:   ['ماکارونی تک ماکارون', 'ماکارونی زر', 'اسپاگتی', 'پاستا', 'فتوچینی'],
  g_cornflakes:  ['کورن فلکس', 'کرنفلکس', 'صبحانه غلات', 'نستله غلات'],
  g_rusk:        ['نان سوخاری', 'نان تست خشک'],
  su_whey:       ['پودر پروتئین', 'وی پروتئین', 'پروتئین ایزوله', 'مکمل پروتئین'],

  /* --- chain-restaurant items ---
     Deliberately NOT given rows of their own: a chain changes its recipe
     without telling anyone and portions differ by branch, so a row claiming to
     know one chain's sandwich would be publishing a guess as a fact. These
     point at the generic equivalent, which is true and still useful — and the
     grams stay editable. */
  ir_fried_chicken: ['زینگر', 'سوخاری', 'کنتاکی', 'کی اف سی', 'فیله سوخاری', 'مرغ سوخاری'],
  ir_s_morgh:       ['ساندویچ چیکن', 'ساندویچ فیله مرغ', 'چیکن برگر', 'ساندویچ مرغ',
                     'ساندویچ زینگر', 'زینگر ساندویچ'],
  p_chicken_wing:   ['بال کبابی', 'بال مرغ کبابی'],
  p_lamb_leg:       ['گوشت بره', 'بره', 'ران بره'],
  p_fish_ghobad:    ['ماهی خال‌خالی', 'ماهی خالخالی', 'شیر ماهی'],

  /* --- cuts people ask for by a different word --- */
  p_lamb_shank:     ['ماهیچه', 'ماهیچه پخته'],
  p_chicken_br_sk:  ['سینه مرغ', 'مرغ سینه', 'chicken breast'],
  p_chicken_th_sk:  ['ران مرغ', 'مرغ ران'],
  p_beef_fillet:    ['فیله گوشت', 'فیله'],
  p_mince_mixed:    ['گوشت چرخ کرده', 'چرخ کرده'],
  p_egg_boiled:     ['تخم مرغ آب پز', 'تخم مرغ پخته'],
  p_fish_soof:      ['ماهی سوف', 'سوف'],
  p_caviar:         ['خاویار', 'اشپل'],

  /* --- spelling variants and other names for dishes we already have --- */
  ir_tahchin:    ['تهچین', 'ته چين', 'تahchin'],
  ir_chelo_kabab:['چلو کباب', 'چلوکباب', 'کباب کوبیده با برنج', 'چلو کباب کوبیده'],
  ir_koobideh_m: ['کوبیده', 'کباب کوبیده', 'کوبيده'],
  ir_jujeh_bone: ['جوجه با استخوان', 'جوجه کباب استخوان دار'],
  ir_ghormeh:    ['قرمه سبزی', 'قورمه', 'خورش سبزی'],
  ir_gheymeh:    ['قیمه نثار', 'خورش قیمه', 'قيمه'],
  ir_ash:        ['آش', 'آش رشته نذری'],
  ir_abgoosht:   ['دیزی', 'آبگوشت بزباش', 'گوشت کوبیده دیزی'],
  ir_mast_khiar: ['ماست خیار', 'ماست و خیار سنتی'],
  ir_salad_shir: ['سالاد شیرازی', 'سالاد خیار و گوجه'],
  ir_sangak:     ['سنگک', 'نان سنگک کنجدی'],
  ir_barbari:    ['بربری', 'نان بربری کنجدی'],
  ir_lavash:     ['لواش', 'نان ماشینی'],
  ir_taftoon:    ['تافتون', 'نان تافتون'],
  ir_fries:      ['سیب زمینی سرخ شده', 'فرنچ فرایز', 'سیب زمینی سرخ کرده'],
  ir_s_burger:   ['همبرگر', 'ساندویچ برگر', 'برگر', 'دبل برگر', 'چیز برگر',
                  'برگر مخصوص', 'رویال برگر', 'ویژه برگر'],
  ir_pizza:      ['پیتزا مخلوط', 'پیتزا مرغ', 'پیتزا مخصوص',
                  'پیتزا مرغ و قارچ', 'پیتزا سبزیجات', 'پیتزا یونانی'],
  ir_falafel:    ['فلافل', 'ساندویچ فلافل'],

  /* --- fast food --- */
  ff_pizza_pep: ['پیتزا پپرونی', 'پپرونی'],
  ff_fc_wing: ['وینگز', 'بال مرغ سوخاری', 'هات وینگز', 'بال سوخاری'],
  ff_fc_breast: ['مرغ سوخاری سینه'],
  ff_fc_drum: ['درام استیک', 'ساق سوخاری'],
  ff_fc_strips: ['چیکن استریپس', 'تندر', 'استریپس سوخاری'],
  ff_fc_popcorn: ['پاپ کورن چیکن', 'ناگت سوخاری'],
  ff_pizza_cheese: ['پیتزا مارگاریتا', 'پیتزا پنیری', 'اسلایس پیتزا'],
  ff_pizza_veg: ['پیتزا سبزیجات و گوشت'],
  ff_pizza_meat: ['پیتزا گوشت'],
  ff_bg_cheese: ['برگر پنیری'],
  ff_bg_double: ['برگر دوبل', 'دوبل چیزبرگر'],
  ff_bg_plain: ['برگر ساده', 'همبرگر معمولی'],
  ff_sw_chickenf: ['ساندویچ مرغ سوخاری', 'ساندویچ زینگر مرغ'],
  ff_sw_fish: ['فیش برگر', 'ساندویچ فیله ماهی'],
  ff_sw_steak: ['فیلی چیز استیک', 'ساندویچ گوشت و پنیر'],
  ff_sd_onionring: ['انیون رینگ', 'حلقه پیاز'],
  ff_sd_nachos: ['ناچوز', 'چیپس و پنیر'],
  ff_sd_coleslaw: ['سالاد کلم', 'کلم سالاد'],
  ff_sd_potwedge: ['پتیتو', 'سیب زمینی وجی', 'وجز'],
  ff_sd_mozz: ['چیز استیک سوخاری', 'موزارلا استیک'],
  ff_sd_hashbrown: ['هشبراون', 'سیب زمینی رشته ای'],
  ff_ww_taco: ['تاکو'],
  ff_ww_burrito: ['بوریتو'],
  ff_bf_eggmuffin: ['ساندویچ صبحانه', 'مافین تخم مرغ'],
  ff_bf_pancake: ['پن کیک'],
  ff_sw_shake_ch: ['شیک شکلاتی', 'میلک شیک'],
  ff_sw_softserve: ['سافت آیس کریم'],
  ff_sw_apple_pie: ['اپل پای'],
};


/**
 * Shop names that lead to the right generic food.
 *
 * People type what is printed on the packet — ساقه طلایی, مزمز, ساندیس — and
 * these route that to the reference row for that kind of food. The row keeps
 * its generic name on screen: an alias is a way of finding a food, never a
 * claim that a reference figure belongs to a company. Rows that do carry a
 * brand are the ones whose figures came from that brand's own label or page.
 *
 * Kept separate from ALIASES rather than merged into it, because hand-merging
 * into a literal of that size is how a duplicate key gets in, and a duplicate
 * silently discards whichever came first.
 */
export const ALIASES_BRANDS = {
  s_biscuit: ['ساقه طلایی', 'پتی بور', 'بیسکویت مادر', 'بیسکویت مینو', 'بیسکویت شیرین عسل', 'بیسکویت گرجی', 'دایجستیو', 'بیسکویت نادری', 'تی تاب', 'بیسکویت ویتانا', 'بیسکویت سبوس دار', 'بیسکویت کنجدی'],
  sn_wafer: ['ویفر آیدین', 'ویفر شیرین عسل', 'ویفر مینو', 'ویفر شکلاتی', 'شوکو ویفر', 'ویفر نارگیلی'],
  s_cake: ['کیک مینو', 'کیک دوقلو', 'کیک اسفنجی', 'کاپ کیک', 'رول کیک', 'کیک صبحانه', 'کیک شکلاتی'],
  sw_koloocheh: ['کلوچه نادری', 'کلوچه شکلاتی', 'کلوچه خرمایی'],
  s_choc_milk: ['شکلات آیدین', 'شوکوپارس', 'شکلات فرمند', 'آناتا', 'دراژه', 'شکلات شیری مینو', 'تافی', 'شکلات مغزدار'],
  s_choc_dark: ['شکلات تلخ فرمند', 'شکلات ۸۰ درصد', 'شکلات ترش'],
  sn_choc_spread: ['نوتلا', 'شکلات صبحانه فرمند', 'شکلات صبحانه نوتلا'],
  sn_pastil: ['پاستیل ژله ای', 'پاستیل آلوچه', 'ژله ای'],
  sw_halva_ardeh: ['حلوا شکری', 'حلوا ارده عقیلی', 'ارده شیره'],
  sw_gaz: ['گز بلداجی', 'گز اصفهان', 'گز پسته ای', 'گز کرمانی'],
  sw_sohan: ['سوهان قم', 'سوهان عسلی قم', 'سوهان پسته ای'],
  s_chips: ['چیپس مزمز', 'چیپس چی توز', 'چیپس لینا', 'چیپس چاکلز', 'چیپس شور', 'چیپس فلفلی', 'چیپس سرکه نمکی', 'چیپس پنیری'],
  sn_pofak: ['پفک نمکی', 'پفک مزمز', 'پفک چی توز', 'پفک لینا', 'پفک پنیری'],
  sn_corn_mex: ['اسنک ذرت', 'ذرت مکزیکی مزمز', 'کرانچی'],
  sn_choobshoor: ['چوب شور نمکی', 'استیک نمکی'],
  sn_cracker: ['کراکر مینو', 'کراکر نمکی', 'تست کراکر'],
  dr_juice_box: ['ساندیس', 'سن ایچ', 'تکدانه', 'عالیس', 'شادلی', 'آبمیوه تتراپک', 'آبمیوه پاکتی سن ایچ', 'می ماس'],
  dr_cola: ['کوکاکولا', 'کوکا کولا', 'پپسی', 'زمزم', 'فانتا', 'اسپرایت', 'کانادادرای', 'سون آپ', 'میرندا', 'نوشابه مشکی'],
  dr_cola_diet: ['کوکا زیرو', 'پپسی دایت', 'نوشابه زیرو'],
  dr_delster: ['دلستر', 'ماءالشعیر بهنوش', 'هی دی', 'ایستک', 'جوجو', 'ماالشعیر', 'آبجو بدون الکل'],
  dr_energy: ['هایپ', 'ردبول', 'بیگ بر', 'نوشابه انرژی زا'],
  dr_nescafe: ['نسکافه گلد', 'کافی میکس', 'مولتی کافی', 'نسکافه ساشه'],
  dr_tea: ['چای احمد', 'چای گلستان', 'چای شهرزاد', 'چای دبش', 'چای سیلان', 'چای کیسه ای'],
  d_doogh: ['دوغ آبعلی', 'دوغ عالیس', 'دوغ خوشگوار', 'دوغ کاله', 'دوغ پگاه', 'دوغ لیوانی', 'دوغ محلی'],
  s_icecream: ['بستنی میهن', 'بستنی دومینو', 'بستنی پاکبان', 'بستنی چوبی', 'بستنی قیفی', 'بستنی لیوانی', 'بستنی وانیلی', 'بستنی شکلاتی'],
  d_cheese_white: ['پنیر بلغاری', 'پنیر تبریزی', 'پنیر ورقه ای', 'پنیر رامک', 'پنیر هراز', 'پنیر چوپان'],
  d_cream_cheese: ['پنیر خامه ای کاله', 'پنیر لبنه', 'پنیر ویلی'],
  d_milk_whole: ['شیر رامک', 'شیر هراز', 'شیر چوپان', 'شیر عسل', 'شیر تتراپک'],
  d_yogurt: ['ماست هراز', 'ماست چوپان', 'ماست سطلی', 'ماست همزده'],
  d_kashk: ['کشک سمیه', 'کشک بطری', 'کشک مایع'],
  g_pasta_dry: ['ماکارونی زر', 'ماکارونی تک', 'ماکارونی مانا', 'ماکارونی سمیرا', 'اسپاگتی زر', 'پاستا خشک', 'ماکارونی فرمی'],
  g_rice_white: ['برنج هاشمی', 'برنج طارم', 'برنج دم سیاه', 'برنج پاکستانی', 'برنج هندی', 'برنج ایرانی', 'برنج شمال', 'برنج محسن'],
  g_bread_white: ['نان فانتزی', 'نان ساندویچی', 'نان بستنی'],
  g_cornflakes: ['کورن فلکس', 'صبحانه آماده', 'کرن فلکس شکلاتی'],
  p_sausage: ['سوسیس آندره', 'سوسیس ب آ', 'سوسیس کوکتل', 'هات داگ سولیکو', 'سوسیس آلمانی', 'سوسیس بلغاری'],
  p_kalbas: ['کالباس مارتادلا', 'کالباس خشک', 'ژامبون مرغ', 'ژامبون گوشت', 'کالباس آندره', 'کالباس ۹۰ درصد'],
  p_tuna_can: ['تن ماهی شیلانه', 'تن ماهی تحفه', 'تن ماهی گلدن', 'تن ماهی جنوب', 'کنسرو ماهی'],
  x_tomato_paste: ['رب مهرام', 'رب یک و یک', 'رب دلپذیر', 'رب چین چین', 'رب گوجه بهروز'],
  o_mayo: ['سس مایونز مهرام', 'سس مایونز بهروز', 'سس مایونز کاله', 'سس سفید'],
  o_ketchup: ['سس گوجه مهرام', 'سس کچاپ', 'سس قرمز'],
  x_hot_sauce: ['سس تند مهرام', 'سس فلفل', 'سس چیلی'],
  o_olives: ['زیتون شکسته', 'زیتون سیاه', 'زیتون رودبار'],
  n_pb: ['کره بادام زمینی شیررضا', 'کره بادام زمینی مزمز'],
};

/* alias -> id, built once. Lets the search match without walking the map. */
const ALIAS_INDEX = (() => {
  const out = [];
  for (const src of [ALIASES, ALIASES_BRANDS]) {
    for (const [id, list] of Object.entries(src)) {
      for (const a of list) out.push([a, id]);
    }
  }
  return out;
})();


/** Simple fuzzy search across both languages.

    The cap used to be a flat 80, which quietly truncated every category once
    the table grew past a hundred rows — picking 'Iranian' showed 80 of 104 with
    nothing to say the rest existed. A chosen category now lists in full; only
    the unfiltered 'all' view is capped, and that view is for searching anyway. */
const CAP = 120;

/** A product shipped with the app, found by the barcode on its package. */
export function foodByBarcode(code) {
  const c = String(code || '').trim();
  return c ? FOODS.find(f => f.code === c) || null : null;
}

export function searchFoods(q, list = FOODS, cat = 'all') {
  const s = (q || '').trim().toLowerCase();
  const filtered = cat === 'all';
  let pool = filtered ? list : list.filter(f => f.cat === cat);
  if (!s) return filtered ? pool.slice(0, CAP) : pool;
  const norm = (x) => (x || '').toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ');
  const ns = norm(s);

  /* which foods does this query name through an alias? */
  const viaAlias = new Map();
  for (const [alias, id] of ALIAS_INDEX) {
    const na = norm(alias);
    /* an alias scores below a real name match, so "چیپس" still ranks the food
       called چیپس above a brand that merely resolves to it */
    const sc = na.startsWith(ns) || ns.startsWith(na) ? 2.5
             : na.includes(ns) ? 1.5
             : ns.split(' ').every(w => na.includes(w)) ? 1.2
             : 0;
    if (sc > (viaAlias.get(id) || 0)) viaAlias.set(id, sc);
  }

  const scored = [];
  for (const f of pool) {
    const a = norm(f.name), b = norm(f.nameFa);
    /* Someone typing "کاله" is naming the company, and someone typing
       "ماست کاله" is naming a product; matching the brand alongside the name
       serves both without letting the brand outrank an exact product name. */
    const br = norm(f.brand);
    const hay = br ? `${b} ${br}` : b;
    /* "ماست کاله" names a company and a product at once. Matching the brand
       against one word and the name against the rest puts that company's
       yoghurts above every other yoghurt, which is what was asked for. */
    const words = ns.split(' ').filter(Boolean);
    const brandWord = br && words.some(w => br.includes(w) || w.includes(br));
    const restMatch = brandWord && words
      .filter(w => !(br.includes(w) || w.includes(br)))
      .every(w => a.includes(w) || b.includes(w));

    let sc = 0;
    /* an exact name beats a name that merely starts with the query, so
       searching "ماست" offers ماست before ماست و خیار */
    if (a === ns || b === ns) sc = 4;
    else if (brandWord && restMatch && words.length > 1) sc = 3.5;
    else if (a.startsWith(ns) || b.startsWith(ns)) sc = 3;
    else if (a.includes(ns) || b.includes(ns)) sc = 2;
    /* naming the company outranks an alias that merely contains its name:
       "میهن" must show Mihan's products, not a juice whose alias mentions it */
    else if (br && (br === ns || br.startsWith(ns))) sc = 2.8;
    else if (br && br.includes(ns)) sc = 1.8;
    else if (words.every(w => a.includes(w) || hay.includes(w))) sc = 1;
    sc = Math.max(sc, viaAlias.get(f.id) || 0);
    if (sc) scored.push([sc, f]);
  }
  /* equal score: the shorter name is nearer what was typed, so "شیر" offers
     شیر پرچرب before شیرین پلو */
  scored.sort((x, y) => (y[0] - x[0])
    || (norm(x[1].nameFa).length - norm(y[1].nameFa).length));
  return scored.slice(0, CAP).map(x => x[1]);
}
