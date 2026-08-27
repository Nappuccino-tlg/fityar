/* ============ Built-in food database ============
   All macros are per 100 g (or per 100 ml for liquids).
   f = [kcal, protein, carbs, fat, fiber]
   u = default serving presets: [label, grams]
   International foods use USDA reference values.
   Iranian composite dishes are DERIVED from their components in data-recipes.js
   rather than guessed — run tools/build_recipes.py after editing a recipe.
================================================== */

const F = (id, name, nameFa, cat, kcal, p, c, fat, fib, servings) =>
  ({ id, name, nameFa, cat, kcal, p, c, f: fat, fib, servings: servings || null, builtin: true });

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

  /* ---------- Fats & oils ---------- */
  F('o_olive',    'Olive oil',     'روغن زیتون', 'fat', 884, 0, 0, 100, 0, [['1 tbsp', 14]]),
  F('o_sun',      'Sunflower oil', 'روغن آفتابگردان','fat', 884, 0, 0, 100, 0, [['1 tbsp', 14]]),
  F('o_olives',   'Olives',        'زیتون',      'fat', 115, 0.8, 6, 11, 3.2, [['5 عدد / olives', 20]]),
  F('o_mayo',     'Mayonnaise',    'سس مایونز',  'fat', 680, 1, 0.6, 75, 0, [['1 tbsp', 14]]),

  /* ---------- Drinks ---------- */
  F('dr_water',   'Water',         'آب',         'drink', 0, 0, 0, 0, 0, [['1 لیوان / glass', 250]]),
  F('dr_tea',     'Tea, plain',    'چای',        'drink', 1, 0, 0.2, 0, 0, [['1 لیوان / glass', 200]]),
  F('dr_coffee',  'Coffee, black', 'قهوه',       'drink', 2, 0.3, 0, 0, 0, [['1 cup', 240]]),
  F('dr_cola',    'Cola',          'نوشابه',     'drink', 42, 0, 10.6, 0, 0, [['1 قوطی / can', 330]]),
  F('dr_juice_o', 'Orange juice',  'آب پرتقال',  'drink', 45, 0.7, 10.4, 0.2, 0.2, [['1 لیوان / glass', 250]]),
  F('dr_energy',  'Energy drink',  'نوشیدنی انرژی','drink', 45, 0, 11, 0, 0, [['1 قوطی / can', 250]]),

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

  /* ---------- Supplements ---------- */
  F('su_whey',    'Whey protein powder','پودر پروتئین وی','supp', 400, 80, 8, 5, 0, [['1 اسکوپ / scoop', 30]]),
  F('su_casein',  'Casein protein',     'کازئین',        'supp', 370, 76, 8, 3, 0, [['1 scoop', 32]]),
  F('su_creatine','Creatine monohydrate','کراتین',       'supp', 0, 0, 0, 0, 0, [['1 tsp', 5]]),
  F('su_mass',    'Mass gainer',        'گینر',          'supp', 380, 20, 65, 4, 2, [['1 scoop', 100]]),
  F('su_bar',     'Protein bar',        'پروتئین بار',   'supp', 350, 30, 35, 10, 5, [['1 عدد / bar', 60]]),
];

export const FOOD_INDEX = Object.fromEntries(FOODS.map(f => [f.id, f]));

/** Simple fuzzy search across both languages. */
export function searchFoods(q, list = FOODS, cat = 'all') {
  const s = (q || '').trim().toLowerCase();
  let pool = cat === 'all' ? list : list.filter(f => f.cat === cat);
  if (!s) return pool.slice(0, 80);
  const norm = (x) => (x || '').toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ');
  const ns = norm(s);
  const scored = [];
  for (const f of pool) {
    const a = norm(f.name), b = norm(f.nameFa);
    let sc = 0;
    if (a.startsWith(ns) || b.startsWith(ns)) sc = 3;
    else if (a.includes(ns) || b.includes(ns)) sc = 2;
    else if (ns.split(' ').every(w => a.includes(w) || b.includes(w))) sc = 1;
    if (sc) scored.push([sc, f]);
  }
  scored.sort((x, y) => y[0] - x[0]);
  return scored.slice(0, 80).map(x => x[1]);
}
