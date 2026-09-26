/* ============ Built-in exercise library + routine templates ============
   type: 'wr' weight×reps | 'r' reps only | 'd' duration | 'dd' distance+duration | 'wd' weight+duration
========================================================================= */

export const MUSCLES = [
  { id:'all',        name:'All',        nameFa:'همه' },
  { id:'chest',      name:'Chest',      nameFa:'سینه' },
  { id:'back',       name:'Back',       nameFa:'پشت' },
  { id:'shoulders',  name:'Shoulders',  nameFa:'سرشانه' },
  { id:'biceps',     name:'Biceps',     nameFa:'جلوبازو' },
  { id:'triceps',    name:'Triceps',    nameFa:'پشت‌بازو' },
  { id:'quads',      name:'Quads',      nameFa:'چهارسر ران' },
  { id:'hamstrings', name:'Hamstrings', nameFa:'همسترینگ' },
  { id:'glutes',     name:'Glutes',     nameFa:'باسن' },
  { id:'calves',     name:'Calves',     nameFa:'ساق پا' },
  { id:'abs',        name:'Abs',        nameFa:'شکم' },
  { id:'forearms',   name:'Forearms',   nameFa:'ساعد' },
  { id:'traps',      name:'Traps',      nameFa:'کول' },
  { id:'cardio',     name:'Cardio',     nameFa:'هوازی' },
  { id:'fullbody',   name:'Full body',  nameFa:'تمام بدن' },
];

export const EQUIPMENT = [
  { id:'barbell',    name:'Barbell',    nameFa:'هالتر' },
  { id:'dumbbell',   name:'Dumbbell',   nameFa:'دمبل' },
  { id:'machine',    name:'Machine',    nameFa:'دستگاه' },
  { id:'cable',      name:'Cable',      nameFa:'سیم‌کش' },
  { id:'bodyweight', name:'Bodyweight', nameFa:'وزن بدن' },
  { id:'kettlebell', name:'Kettlebell', nameFa:'کتل‌بل' },
  { id:'band',       name:'Band',       nameFa:'کش' },
  { id:'smith',      name:'Smith',      nameFa:'اسمیت' },
  { id:'cardio',     name:'Cardio',     nameFa:'هوازی' },
  { id:'other',      name:'Other',      nameFa:'سایر' },
];

const E = (id, name, nameFa, muscle, equip, type = 'wr') => ({ id, name, nameFa, muscle, equip, type, builtin: true });

export const EXERCISES = [
  /* ---------- CHEST ---------- */
  E('bench_bb',       'Bench Press (Barbell)',      'پرس سینه هالتر',            'chest', 'barbell'),
  E('bench_db',       'Bench Press (Dumbbell)',     'پرس سینه دمبل',             'chest', 'dumbbell'),
  E('incline_bb',     'Incline Bench Press (Barbell)','پرس بالا سینه هالتر',     'chest', 'barbell'),
  E('incline_db',     'Incline Bench Press (Dumbbell)','پرس بالا سینه دمبل',     'chest', 'dumbbell'),
  E('decline_bb',     'Decline Bench Press',        'پرس زیر سینه',              'chest', 'barbell'),
  E('chest_press_m',  'Chest Press (Machine)',      'پرس سینه دستگاه',           'chest', 'machine'),
  E('pec_deck',       'Pec Deck / Chest Fly',       'قفسه سینه دستگاه',          'chest', 'machine'),
  E('fly_db',         'Chest Fly (Dumbbell)',       'قفسه سینه دمبل',            'chest', 'dumbbell'),
  E('cable_cross',    'Cable Crossover',            'کراس اور سیم‌کش',           'chest', 'cable'),
  E('cable_fly_low',  'Low Cable Fly',              'قفسه سیم‌کش از پایین',      'chest', 'cable'),
  E('pushup',         'Push Up',                    'شنا سوئدی',                 'chest', 'bodyweight', 'r'),
  E('pushup_incline', 'Incline Push Up',            'شنا روی سطح شیب‌دار',       'chest', 'bodyweight', 'r'),
  E('dip_chest',      'Chest Dip',                  'دیپ سینه',                  'chest', 'bodyweight', 'r'),
  E('pullover',       'Dumbbell Pullover',          'پول‌اور دمبل',              'chest', 'dumbbell'),
  E('smith_bench',    'Smith Machine Bench Press',  'پرس سینه اسمیت',            'chest', 'smith'),

  /* ---------- BACK ---------- */
  E('deadlift',       'Deadlift',                   'ددلیفت',                    'back', 'barbell'),
  E('deadlift_sumo',  'Sumo Deadlift',              'ددلیفت سومو',               'back', 'barbell'),
  E('deadlift_rdl',   'Romanian Deadlift',          'ددلیفت رومانیایی',          'hamstrings', 'barbell'),
  E('row_bb',         'Barbell Row',                'زیربغل هالتر خم',           'back', 'barbell'),
  E('row_pendlay',    'Pendlay Row',                'روئینگ پندلی',              'back', 'barbell'),
  E('row_db',         'Dumbbell Row (single arm)',  'زیربغل دمبل تک‌دست',        'back', 'dumbbell'),
  E('row_tbar',       'T-Bar Row',                  'زیربغل تی‌بار',             'back', 'machine'),
  E('row_seated',     'Seated Cable Row',           'زیربغل قایقی سیم‌کش',       'back', 'cable'),
  E('row_machine',    'Machine Row',                'زیربغل دستگاه',             'back', 'machine'),
  E('lat_pulldown',   'Lat Pulldown',               'لت از جلو',                 'back', 'cable'),
  E('lat_pulldown_c', 'Close Grip Pulldown',        'لت دست‌جمع',                'back', 'cable'),
  E('pullup',         'Pull Up',                    'بارفیکس',                   'back', 'bodyweight', 'r'),
  E('chinup',         'Chin Up',                    'بارفیکس دست‌برعکس',         'back', 'bodyweight', 'r'),
  E('straight_pull',  'Straight-Arm Pulldown',      'پول‌داون دست صاف',          'back', 'cable'),
  E('back_ext',       'Back Extension',             'فیله کمر',                  'back', 'bodyweight', 'r'),
  E('good_morning',   'Good Morning',               'گودمورنینگ',                'back', 'barbell'),
  E('shrug_bb',       'Shrug (Barbell)',            'شراگ هالتر',                'traps', 'barbell'),
  E('shrug_db',       'Shrug (Dumbbell)',           'شراگ دمبل',                 'traps', 'dumbbell'),

  /* ---------- SHOULDERS ---------- */
  E('ohp_bb',         'Overhead Press (Barbell)',   'پرس سرشانه هالتر',          'shoulders', 'barbell'),
  E('ohp_db',         'Shoulder Press (Dumbbell)',  'پرس سرشانه دمبل',           'shoulders', 'dumbbell'),
  E('ohp_machine',    'Shoulder Press (Machine)',   'پرس سرشانه دستگاه',         'shoulders', 'machine'),
  E('arnold',         'Arnold Press',               'پرس آرنولدی',               'shoulders', 'dumbbell'),
  E('lat_raise',      'Lateral Raise (Dumbbell)',   'نشر جانب دمبل',             'shoulders', 'dumbbell'),
  E('lat_raise_c',    'Lateral Raise (Cable)',      'نشر جانب سیم‌کش',           'shoulders', 'cable'),
  E('front_raise',    'Front Raise',                'نشر جلو',                   'shoulders', 'dumbbell'),
  E('rear_delt_fly',  'Rear Delt Fly',              'نشر خم',                    'shoulders', 'dumbbell'),
  E('face_pull',      'Face Pull',                  'فیس پول',                   'shoulders', 'cable'),
  E('upright_row',    'Upright Row',                'کول هالتر',                 'shoulders', 'barbell'),
  E('pike_pushup',    'Pike Push Up',               'شنا پایک',                  'shoulders', 'bodyweight', 'r'),

  /* ---------- BICEPS ---------- */
  E('curl_bb',        'Barbell Curl',               'جلوبازو هالتر',             'biceps', 'barbell'),
  E('curl_db',        'Dumbbell Curl',              'جلوبازو دمبل',              'biceps', 'dumbbell'),
  E('curl_hammer',    'Hammer Curl',                'جلوبازو چکشی',              'biceps', 'dumbbell'),
  E('curl_incline',   'Incline Dumbbell Curl',      'جلوبازو روی میز شیب‌دار',   'biceps', 'dumbbell'),
  E('curl_preacher',  'Preacher Curl',              'جلوبازو لاری',              'biceps', 'barbell'),
  E('curl_cable',     'Cable Curl',                 'جلوبازو سیم‌کش',            'biceps', 'cable'),
  E('curl_conc',      'Concentration Curl',         'جلوبازو تمرکزی',            'biceps', 'dumbbell'),
  E('curl_ez',        'EZ-Bar Curl',                'جلوبازو هالتر خم (EZ)',     'biceps', 'barbell'),

  /* ---------- TRICEPS ---------- */
  E('tri_pushdown',   'Triceps Pushdown (Cable)',   'پشت بازو سیم‌کش',           'triceps', 'cable'),
  E('tri_rope',       'Rope Pushdown',              'پشت بازو طنابی',            'triceps', 'cable'),
  E('skullcrusher',   'Skullcrusher',               'پشت بازو خوابیده هالتر',    'triceps', 'barbell'),
  E('tri_overhead',   'Overhead Triceps Extension', 'پشت بازو بالای سر',         'triceps', 'dumbbell'),
  E('close_grip',     'Close-Grip Bench Press',     'پرس دست‌جمع',               'triceps', 'barbell'),
  E('dip_tri',        'Triceps Dip',                'دیپ پشت بازو',              'triceps', 'bodyweight', 'r'),
  E('kickback',       'Triceps Kickback',           'پشت بازو کیک‌بک',           'triceps', 'dumbbell'),
  E('diamond_pushup', 'Diamond Push Up',            'شنا الماسی',                'triceps', 'bodyweight', 'r'),

  /* ---------- QUADS / LEGS ---------- */
  E('squat_bb',       'Back Squat',                 'اسکوات هالتر',              'quads', 'barbell'),
  E('squat_front',    'Front Squat',                'اسکوات از جلو',             'quads', 'barbell'),
  E('squat_goblet',   'Goblet Squat',               'اسکوات گابلت',              'quads', 'dumbbell'),
  E('squat_hack',     'Hack Squat',                 'هاک اسکوات',                'quads', 'machine'),
  E('squat_smith',    'Smith Machine Squat',        'اسکوات اسمیت',              'quads', 'smith'),
  E('leg_press',      'Leg Press',                  'پرس پا',                    'quads', 'machine'),
  E('leg_ext',        'Leg Extension',              'جلو پا دستگاه',             'quads', 'machine'),
  E('lunge_db',       'Lunge (Dumbbell)',           'لانج دمبل',                 'quads', 'dumbbell'),
  E('lunge_walk',     'Walking Lunge',              'لانج راه‌رونده',            'quads', 'dumbbell'),
  E('bulgarian',      'Bulgarian Split Squat',      'اسکوات بلغاری',             'quads', 'dumbbell'),
  E('step_up',        'Step Up',                    'استپ آپ',                   'quads', 'dumbbell'),
  E('sissy_squat',    'Sissy Squat',                'سیسی اسکوات',               'quads', 'bodyweight', 'r'),

  /* ---------- HAMSTRINGS / GLUTES ---------- */
  E('leg_curl_lying', 'Lying Leg Curl',             'پشت پا خوابیده',            'hamstrings', 'machine'),
  E('leg_curl_seat',  'Seated Leg Curl',            'پشت پا نشسته',              'hamstrings', 'machine'),
  E('rdl_db',         'Romanian Deadlift (Dumbbell)','ددلیفت رومانیایی دمبل',    'hamstrings', 'dumbbell'),
  E('stiff_leg',      'Stiff-Leg Deadlift',         'ددلیفت پا صاف',             'hamstrings', 'barbell'),
  E('nordic',         'Nordic Curl',                'نوردیک کرل',                'hamstrings', 'bodyweight', 'r'),
  E('hip_thrust',     'Hip Thrust',                 'هیپ تراست',                 'glutes', 'barbell'),
  E('glute_bridge',   'Glute Bridge',               'گلوت بریج',                 'glutes', 'bodyweight', 'r'),
  E('cable_kickback', 'Cable Glute Kickback',       'کیک‌بک باسن سیم‌کش',        'glutes', 'cable'),
  E('abduction',      'Hip Abduction (Machine)',    'ابداکشن دستگاه',            'glutes', 'machine'),
  E('adduction',      'Hip Adduction (Machine)',    'اداکشن دستگاه',             'glutes', 'machine'),

  /* ---------- CALVES ---------- */
  E('calf_standing',  'Standing Calf Raise',        'ساق پا ایستاده',            'calves', 'machine'),
  E('calf_seated',    'Seated Calf Raise',          'ساق پا نشسته',              'calves', 'machine'),
  E('calf_leg_press', 'Calf Press (Leg Press)',     'ساق پا با دستگاه پرس',      'calves', 'machine'),
  E('calf_db',        'Dumbbell Calf Raise',        'ساق پا با دمبل',            'calves', 'dumbbell'),

  /* ---------- ABS ---------- */
  E('plank',          'Plank',                      'پلانک',                     'abs', 'bodyweight', 'd'),
  E('side_plank',     'Side Plank',                 'پلانک جانبی',               'abs', 'bodyweight', 'd'),
  E('crunch',         'Crunch',                     'کرانچ',                     'abs', 'bodyweight', 'r'),
  E('cable_crunch',   'Cable Crunch',               'کرانچ سیم‌کش',              'abs', 'cable'),
  E('leg_raise',      'Hanging Leg Raise',          'زیرشکم آویزان',             'abs', 'bodyweight', 'r'),
  E('leg_raise_lying','Lying Leg Raise',            'زیرشکم خوابیده',            'abs', 'bodyweight', 'r'),
  E('russian_twist',  'Russian Twist',              'روسی تویست',                'abs', 'bodyweight', 'r'),
  E('ab_wheel',       'Ab Wheel Rollout',           'چرخ شکم',                   'abs', 'other', 'r'),
  E('mountain_climb', 'Mountain Climbers',          'کوهنورد',                   'abs', 'bodyweight', 'd'),
  E('bicycle_crunch', 'Bicycle Crunch',             'کرانچ دوچرخه',              'abs', 'bodyweight', 'r'),
  E('deadbug',        'Dead Bug',                   'ددباگ',                     'abs', 'bodyweight', 'r'),

  /* ---------- FOREARMS ---------- */
  E('wrist_curl',     'Wrist Curl',                 'مچ هالتر',                  'forearms', 'barbell'),
  E('rev_wrist_curl', 'Reverse Wrist Curl',         'مچ برعکس',                  'forearms', 'barbell'),
  E('farmer_walk',    "Farmer's Walk",              'راه‌رفتن کشاورز',           'forearms', 'dumbbell', 'wd'),
  E('rev_curl',       'Reverse Curl',               'جلوبازو برعکس',             'forearms', 'barbell'),

  /* ---------- FULL BODY / OLYMPIC ---------- */
  E('clean',          'Power Clean',                'پاور کلین',                 'fullbody', 'barbell'),
  E('snatch',         'Snatch',                     'اسنچ',                      'fullbody', 'barbell'),
  E('clean_jerk',     'Clean & Jerk',               'کلین و جرک',                'fullbody', 'barbell'),
  E('thruster',       'Thruster',                   'تراستر',                    'fullbody', 'barbell'),
  E('kb_swing',       'Kettlebell Swing',           'سوئینگ کتل‌بل',             'fullbody', 'kettlebell'),
  E('burpee',         'Burpee',                     'برپی',                      'fullbody', 'bodyweight', 'r'),
  E('turkish',        'Turkish Get-Up',             'ترکیش گت‌آپ',               'fullbody', 'kettlebell'),
  E('battle_rope',    'Battle Ropes',               'طناب نبرد',                 'fullbody', 'other', 'd'),

  /* ---------- CARDIO ---------- */
  E('run',            'Running',                    'دویدن',                     'cardio', 'cardio', 'dd'),
  E('treadmill',      'Treadmill',                  'تردمیل',                    'cardio', 'cardio', 'dd'),
  E('cycling',        'Cycling',                    'دوچرخه',                    'cardio', 'cardio', 'dd'),
  E('elliptical',     'Elliptical',                 'الپتیکال',                  'cardio', 'cardio', 'dd'),
  E('rowing',         'Rowing Machine',             'دستگاه پارو',               'cardio', 'cardio', 'dd'),
  E('stairmaster',    'Stair Master',               'پله‌نورد',                  'cardio', 'cardio', 'd'),
  E('jump_rope',      'Jump Rope',                  'طناب زدن',                  'cardio', 'other', 'd'),
  E('walking',        'Walking',                    'پیاده‌روی',                 'cardio', 'cardio', 'dd'),
  E('swimming',       'Swimming',                   'شنا',                       'cardio', 'cardio', 'dd'),
  E('hiit',           'HIIT Session',               'تمرین HIIT',                'cardio', 'other', 'd'),
];

export const EX_INDEX = Object.fromEntries(EXERCISES.map(e => [e.id, e]));

/** Approximate MET values used to estimate calories burned. */
export const MET = {
  cardio: { run:9.8, treadmill:8.5, cycling:7.5, elliptical:5.5, rowing:7,
            stairmaster:9, jump_rope:11, walking:3.5, swimming:8, hiit:10 },
  strength: 5.0,
};

/* ============ Built-in routine templates ============ */
const R = (id, name, nameFa, desc, descFa, days) => ({ id, name, nameFa, desc, descFa, days, builtin: true });

export const TEMPLATES = [
  R('t_ppl', 'Push / Pull / Legs', 'پوش / پول / پا',
    '6 days — classic hypertrophy split', '۶ روز — اسپلیت کلاسیک حجم', [
    { name:'Push A', nameFa:'پوش A', ex:[
      ['bench_bb',4,'6-8'],['incline_db',3,'8-12'],['ohp_db',3,'8-12'],
      ['lat_raise',4,'12-15'],['tri_rope',3,'10-15'],['tri_overhead',3,'10-12']]},
    { name:'Pull A', nameFa:'پول A', ex:[
      ['deadlift',3,'5'],['pullup',3,'AMRAP'],['row_bb',3,'8-10'],
      ['row_seated',3,'10-12'],['face_pull',3,'15'],['curl_bb',3,'8-12']]},
    { name:'Legs A', nameFa:'پا A', ex:[
      ['squat_bb',4,'6-8'],['rdl_db',3,'8-10'],['leg_press',3,'10-12'],
      ['leg_curl_lying',3,'12'],['calf_standing',4,'15'],['plank',3,'60s']]},
    { name:'Push B', nameFa:'پوش B', ex:[
      ['ohp_bb',4,'6-8'],['bench_db',3,'8-12'],['cable_cross',3,'12-15'],
      ['lat_raise_c',3,'15'],['close_grip',3,'8-10'],['tri_pushdown',3,'12']]},
    { name:'Pull B', nameFa:'پول B', ex:[
      ['lat_pulldown',4,'8-12'],['row_db',3,'10-12'],['row_machine',3,'10-12'],
      ['rear_delt_fly',3,'15'],['curl_hammer',3,'10-12'],['curl_incline',3,'12']]},
    { name:'Legs B', nameFa:'پا B', ex:[
      ['deadlift_rdl',4,'6-8'],['bulgarian',3,'10'],['leg_ext',3,'12-15'],
      ['hip_thrust',3,'10-12'],['calf_seated',4,'15'],['cable_crunch',3,'12']]},
  ]),

  R('t_ul', 'Upper / Lower', 'بالاتنه / پایین‌تنه',
    '4 days — great strength+size balance', '۴ روز — تعادل قدرت و حجم', [
    { name:'Upper A', nameFa:'بالاتنه A', ex:[
      ['bench_bb',4,'5-8'],['row_bb',4,'6-10'],['ohp_db',3,'8-12'],
      ['lat_pulldown',3,'10-12'],['lat_raise',3,'12-15'],['curl_db',3,'10-12'],['tri_rope',3,'12']]},
    { name:'Lower A', nameFa:'پایین‌تنه A', ex:[
      ['squat_bb',4,'5-8'],['rdl_db',3,'8-10'],['leg_press',3,'10-12'],
      ['leg_curl_lying',3,'12'],['calf_standing',4,'12-15'],['leg_raise',3,'12']]},
    { name:'Upper B', nameFa:'بالاتنه B', ex:[
      ['ohp_bb',4,'5-8'],['pullup',4,'AMRAP'],['incline_db',3,'8-12'],
      ['row_seated',3,'10-12'],['face_pull',3,'15'],['curl_hammer',3,'12'],['close_grip',3,'10']]},
    { name:'Lower B', nameFa:'پایین‌تنه B', ex:[
      ['deadlift',4,'4-6'],['bulgarian',3,'10'],['leg_ext',3,'12-15'],
      ['hip_thrust',3,'10'],['calf_seated',4,'15'],['plank',3,'60s']]},
  ]),

  R('t_fb3', 'Full Body 3×', 'تمام بدن ۳ روزه',
    '3 days — perfect for beginners', '۳ روز — عالی برای مبتدی‌ها', [
    { name:'Day A', nameFa:'روز A', ex:[
      ['squat_bb',3,'8-10'],['bench_bb',3,'8-10'],['row_bb',3,'8-10'],
      ['ohp_db',2,'10-12'],['plank',3,'45s']]},
    { name:'Day B', nameFa:'روز B', ex:[
      ['deadlift_rdl',3,'8'],['ohp_bb',3,'8-10'],['lat_pulldown',3,'10-12'],
      ['leg_press',3,'12'],['curl_db',2,'12']]},
    { name:'Day C', nameFa:'روز C', ex:[
      ['squat_goblet',3,'10-12'],['incline_db',3,'10'],['row_seated',3,'10-12'],
      ['lat_raise',3,'15'],['leg_curl_lying',3,'12'],['crunch',3,'20']]},
  ]),

  R('t_home', 'Home / Bodyweight', 'خانگی / وزن بدن',
    'No equipment needed', 'بدون نیاز به تجهیزات', [
    { name:'Full A', nameFa:'کامل A', ex:[
      ['pushup',4,'AMRAP'],['squat_goblet',4,'15'],['lunge_db',3,'12'],
      ['pike_pushup',3,'10'],['plank',3,'60s'],['glute_bridge',3,'15']]},
    { name:'Full B', nameFa:'کامل B', ex:[
      ['pullup',4,'AMRAP'],['bulgarian',3,'12'],['diamond_pushup',3,'12'],
      ['leg_raise_lying',3,'15'],['russian_twist',3,'20'],['burpee',3,'10']]},
  ]),

  R('t_bro', '5-Day Bro Split', 'اسپلیت ۵ روزه',
    'One muscle group per day', 'هر روز یک گروه عضلانی', [
    { name:'Chest', nameFa:'سینه', ex:[
      ['bench_bb',4,'6-8'],['incline_db',4,'8-12'],['pec_deck',3,'12'],
      ['cable_cross',3,'12-15'],['dip_chest',3,'AMRAP']]},
    { name:'Back', nameFa:'پشت', ex:[
      ['deadlift',3,'5'],['pullup',4,'AMRAP'],['row_bb',4,'8-10'],
      ['row_seated',3,'10-12'],['straight_pull',3,'15'],['shrug_db',3,'12']]},
    { name:'Shoulders', nameFa:'سرشانه', ex:[
      ['ohp_bb',4,'6-8'],['lat_raise',4,'12-15'],['rear_delt_fly',3,'15'],
      ['front_raise',3,'12'],['face_pull',3,'15'],['upright_row',3,'12']]},
    { name:'Legs', nameFa:'پا', ex:[
      ['squat_bb',4,'6-8'],['leg_press',4,'10-12'],['leg_ext',3,'15'],
      ['leg_curl_lying',4,'12'],['rdl_db',3,'10'],['calf_standing',5,'15']]},
    { name:'Arms', nameFa:'بازو', ex:[
      ['curl_bb',4,'8-10'],['skullcrusher',4,'10'],['curl_hammer',3,'12'],
      ['tri_rope',3,'12-15'],['curl_preacher',3,'12'],['kickback',3,'15']]},
  ]),

  R('t_str', 'Strength 5×5', 'قدرتی ۵×۵',
    '3 days — heavy compound focus', '۳ روز — تمرکز روی حرکات پایه سنگین', [
    { name:'Workout A', nameFa:'تمرین A', ex:[
      ['squat_bb',5,'5'],['bench_bb',5,'5'],['row_bb',5,'5']]},
    { name:'Workout B', nameFa:'تمرین B', ex:[
      ['squat_bb',5,'5'],['ohp_bb',5,'5'],['deadlift',1,'5']]},
  ]),
];
