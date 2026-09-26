/* ============ FitYar — the answers that are written, not looked up ============

   Everything in assistant.js comes out of the database and is exact. These
   do not: they are general advice, written once, in plain language, and the
   assistant labels them as general when it says them. Someone reading "eat
   1.6 to 2.2 grams per kilo" deserves to know that is a guideline and not a
   reading of their own log.

   Rules for anything added here:

   · Say a range, not a number. Bodies differ and a single figure pretends
     to a precision nobody has.
   · Never diagnose and never prescribe. Where a question touches injury,
     illness or medication, the answer is to see someone qualified — this
     app is a notebook, not a doctor.
   · Short. Three sentences at most. Anyone who wants more will look it up.
   · Both languages, written rather than translated, because advice that
     reads as a translation is not read.

   The list is deliberately small. The honest way to grow it is to read what
   people actually asked and could not be answered — assistant.js records
   those on the device, and they make a better list than guessing does.
*/

export const KNOWLEDGE_TEXT = {
  'k.sets': {
    fa: 'برای هر عضله در هفته حدود ۱۰ تا ۲۰ ست کاری، پخش‌شده روی دو یا سه جلسه. '
      + 'مبتدی از پایین این بازه شروع کند و کم‌کم بالا بیاورد؛ بیشتر همیشه بهتر نیست، '
      + 'چون ریکاوری هم بخشی از تمرین است.',
    en: 'Around 10 to 20 working sets per muscle per week, spread over two or three '
      + 'sessions. Start at the bottom of that range if you are new and build up — more '
      + 'is not automatically better, because recovery is part of the training.',
  },
  'k.reps': {
    fa: 'برای عضله‌سازی بیشترِ ست‌ها در بازهٔ ۶ تا ۱۵ تکرار، با وزنه‌ای که تکرار آخر سخت باشد. '
      + 'تعداد تکرار از سختی ست کم‌اهمیت‌تر است: ۱۲ تکرار راحت کمتر از ۸ تکرار سنگین می‌سازد.',
    en: 'Most sets in the 6 to 15 rep range, with a weight that makes the last rep hard. '
      + 'The rep number matters less than the effort: twelve easy reps build less than '
      + 'eight hard ones.',
  },
  'k.rest': {
    fa: 'برای حرکات سنگین چندمفصلی ۲ تا ۳ دقیقه، برای حرکات تک‌مفصلی و سبک‌تر ۶۰ تا ۹۰ ثانیه. '
      + 'اگر ست بعدی را به‌خاطر نفس‌نفس زدن از دست می‌دهی، بیشتر استراحت کن.',
    en: 'Two to three minutes on heavy compound lifts, sixty to ninety seconds on isolation '
      + 'work. If you are losing the next set because you are still out of breath, rest longer.',
  },
  'k.preworkout': {
    fa: 'یک تا دو ساعت قبل، وعده‌ای با کربوهیدرات و کمی پروتئین — مثلاً نان و پنیر، یا برنج و مرغ. '
      + 'اگر وقت کم است، یک میوه بیست دقیقه قبل کافی است. معدهٔ پر تمرین را سخت می‌کند.',
    en: 'One to two hours before, a meal with carbohydrate and some protein — bread and cheese, '
      + 'or rice and chicken. If you are short of time, a piece of fruit twenty minutes before is '
      + 'enough. A full stomach makes training harder.',
  },
  'k.postworkout': {
    fa: 'در چند ساعت بعد از تمرین یک وعدهٔ معمولی با پروتئین کافی. '
      + 'آن «پنجرهٔ طلایی نیم‌ساعته» تا حد زیادی افسانه است؛ چیزی که اهمیت دارد کل پروتئین روز است، نه ساعتش.',
    en: 'A normal meal with enough protein within a few hours. The "thirty minute window" is '
      + 'largely a myth — what matters is the day’s total protein, not its timing.',
  },
  'k.creatine': {
    fa: 'کراتین مونوهیدرات یکی از معدود مکمل‌هایی است که شواهد محکمی پشتش هست: روزی ۳ تا ۵ گرم، '
      + 'هر ساعتی از روز، هر روز حتی روزهای استراحت. نیازی به دورهٔ بارگیری نیست.',
    en: 'Creatine monohydrate is one of the few supplements with solid evidence behind it: '
      + '3 to 5 grams a day, at any time, every day including rest days. No loading phase needed.',
  },
  'k.protein_target': {
    fa: 'حدود ۱٫۶ تا ۲٫۲ گرم به ازای هر کیلو وزن بدن در روز، اگر تمرین مقاومتی می‌کنی. '
      + 'بالاتر از این بازه فایدهٔ روشنی نشان نداده. هدف اپ از همین حساب می‌آید و در تنظیمات قابل تغییر است.',
    en: 'About 1.6 to 2.2 grams per kilo of bodyweight a day if you lift. Going above that range '
      + 'has not shown a clear benefit. The app’s target comes from this and can be changed in settings.',
  },
  'k.soreness': {
    fa: 'کوفتگی یک تا دو روز بعد از تمرین طبیعی است، به‌خصوص وقتی حرکتی تازه است — و نشانهٔ کیفیت تمرین نیست. '
      + 'با کوفتگی می‌شود تمرین کرد؛ با درد تیز یا درد مفصل نه.',
    en: 'Soreness a day or two after training is normal, especially with a new movement — and it '
      + 'is not a measure of how good the session was. You can train through soreness; you should '
      + 'not train through sharp or joint pain.',
  },
  'k.sick': {
    fa: 'تب، درد بدن یا علائم پایین‌تر از گلو: تمرین نکن. سرماخوردگی خفیف و بدون تب: تمرین سبک اشکالی ندارد. '
      + 'یک هفته استراحت چیزی از دست‌آوردهایت کم نمی‌کند.',
    en: 'Fever, body aches, or symptoms below the neck: do not train. A mild head cold without '
      + 'fever: light training is fine. A week off will not cost you what you have built.',
  },
  'k.water_target': {
    fa: 'حدود ۳۰ تا ۳۵ میلی‌لیتر به ازای هر کیلو وزن بدن در روز، و بیشتر در روزهای تمرین یا گرما. '
      + 'رنگ روشن ادرار نشانهٔ سادهٔ کافی بودن است.',
    en: 'Roughly 30 to 35 ml per kilo of bodyweight a day, more on training days or in heat. '
      + 'Pale urine is the simplest sign that you are drinking enough.',
  },
  'k.cardio': {
    fa: 'اگر هدف اصلی عضله و قدرت است، هوازی را بعد از وزنه یا در روز جدا بگذار. '
      + 'هوازی سنگین قبل از تمرین، ست‌های وزنه را ضعیف می‌کند.',
    en: 'If muscle and strength are the goal, put cardio after the weights or on a separate day. '
      + 'Hard cardio beforehand costs you the lifting sets that follow.',
  },
  'k.plateau': {
    fa: 'وقتی چند هفته پیشرفت متوقف شده، معمولاً یکی از این سه است: خواب کم، پروتئین یا کالری ناکافی، '
      + 'یا اینکه وزنه‌ها همان‌قدر مانده‌اند. یکی‌شان را برای دو هفته تغییر بده، نه هر سه را با هم.',
    en: 'When progress stalls for a few weeks it is usually one of three things: too little sleep, '
      + 'not enough protein or calories, or the weights simply have not gone up. Change one of '
      + 'them for a fortnight rather than all three at once.',
  },
  'k.warmup': {
    fa: 'پنج تا ده دقیقه حرکت سبک تا بدن گرم شود، بعد دو یا سه ست سبک از خود حرکتی که می‌خواهی بزنی. کشش طولانی را برای بعد تمرین بگذار؛ قبل از ست سنگین، عضله‌ی کشیده‌شده ضعیف‌تر است.',
    en: 'Five to ten minutes of easy movement to warm up, then two or three light sets of the lift itself. Save long stretches for afterwards — a muscle you have just stretched hard is weaker for the set that follows.',
  },
  'k.sleep': {
    fa: 'هفت تا نه ساعت. خواب جایی است که عضله ساخته می‌شود، نه باشگاه؛ باشگاه فقط محرک است. یک هفته کم‌خوابی بیشتر از یک هفته تمرین‌نکردن به پیشرفت ضربه می‌زند.',
    en: 'Seven to nine hours. Muscle is built while you sleep, not in the gym — the gym is only the signal. A week of short nights costs you more than a week of missed sessions.',
  },
  'k.frequency': {
    fa: 'سه تا پنج روز در هفته برای بیشتر آدم‌ها. مهم‌تر از تعداد روز این است که هر عضله هفته‌ای دو بار تمرین ببیند — همان حجم روی دو جلسه بهتر از یک جلسه جواب می‌دهد.',
    en: 'Three to five days a week suits most people. What matters more than the number of days is hitting each muscle twice a week — the same volume split over two sessions beats one.',
  },
  'k.fatloss': {
    fa: 'کالری کمتر از آنچه می‌سوزانی، حدود ۱۵ تا ۲۰ درصد کمتر، و پروتئین بالا تا عضله‌ات را نگه داری. تمرین با وزنه را کنار نگذار؛ چیزی که می‌خواهی از دست بدهی چربی است نه عضله.',
    en: 'Eat below what you burn — around 15 to 20 per cent below — and keep protein high so you hold on to muscle. Keep lifting: the thing you want to lose is fat, not the muscle underneath it.',
  },
  'k.gain': {
    fa: 'کمی بیشتر از نیازت بخور، حدود ۱۰ درصد، و هر هفته یا وزنه را سنگین‌تر کن یا تکرار را بیشتر. عضله کند ساخته می‌شود — ماهی نیم تا یک کیلو رشد سالم است و بیشترش بیشترش چربی است.',
    en: 'Eat a little above what you need, around ten per cent, and every week add either weight or reps. Muscle comes slowly: half a kilo to a kilo a month is healthy growth, and faster than that is mostly fat.',
  },
  'k.form': {
    fa: 'تکنیک قبل از وزنه. اگر برای بلند کردن وزنه‌ای شکل حرکت را عوض می‌کنی، آن وزنه هنوز مال تو نیست. یک بار از خودت فیلم بگیر؛ چیزی که حس می‌کنی با چیزی که می‌بینی اغلب یکی نیست.',
    en: 'Technique before weight. If you have to change the shape of a lift to move the bar, that weight is not yours yet. Film one set — what a lift feels like and what it looks like are rarely the same thing.',
  },
  'k.supplements': {
    fa: 'هیچ مکملی جای غذا و خواب را نمی‌گیرد. اگر همه‌چیز سر جایش باشد، کراتین و پودر پروتئین تنها دوتایی هستند که شواهد محکمی دارند — بقیه بیشترشان پول است.',
    en: 'No supplement replaces food and sleep. With those in place, creatine and protein powder are the only two with solid evidence behind them — most of the rest is money.',
  },
  'k.whey': {
    fa: 'پودر پروتئین غذاست، نه دارو: راه راحت رسیدن به پروتئین روزانه وقتی با غذا نمی‌رسی. اگر با مرغ و تخم‌مرغ و لبنیات به هدفت می‌رسی، لازمش نداری.',
    en: 'Protein powder is food, not medicine — a convenient way to reach your daily protein when meals fall short. If chicken, eggs and dairy already get you there, you do not need it.',
  },
  'k.carbs_night': {
    fa: 'کربوهیدرات شب چاق نمی‌کند. چیزی که وزن را بالا می‌برد کل کالری روز است، نه ساعتی که خورده شده. اگر شب راحت‌تر می‌خوری، شب بخور.',
    en: 'Carbs at night do not make you fat. What moves the scale is the day’s total, not the hour on the clock. If eating later suits your day, eat later.',
  },
  'k.cheat': {
    fa: 'یک وعده‌ی خارج از برنامه در هفته چیزی را خراب نمی‌کند — یک هفته‌ی خارج از برنامه می‌کند. به جای «وعده‌ی تقلب» فکر کن به غذایی که دوستش داری و در کالری روزت جا می‌شود.',
    en: 'One meal off plan in a week ruins nothing; a week off plan does. Rather than a cheat meal, think of it as food you enjoy that fits inside the day.',
  },
  'k.fasting': {
    fa: 'روزه‌ی متناوب یک روش زمان‌بندی است، نه یک قانون چربی‌سوزی. اگر با آن کمتر می‌خوری جواب می‌دهد، و اگر نه، هیچ برتری جادویی بر یک رژیم معمولی با همان کالری ندارد.',
    en: 'Intermittent fasting is a way of scheduling meals, not a fat-burning rule. It works if it makes you eat less; if it does not, it has no magic advantage over any other diet at the same calories.',
  },
  'k.spot': {
    fa: 'لاغری موضعی وجود ندارد. هزار دراز و نشست شکم را آب نمی‌کند؛ چربی از کل بدن کم می‌شود و ترتیبش را ژنتیک تعیین می‌کند، نه حرکتی که انتخاب می‌کنی.',
    en: 'You cannot lose fat from one place on purpose. A thousand sit-ups will not empty your waist — fat comes off the whole body, and the order it leaves in is decided by your genes, not by the exercise you pick.',
  },
  'k.stretch': {
    fa: 'کشش انعطاف را بهتر می‌کند و کوفتگی را کم نمی‌کند. بعد از تمرین یا در روز استراحت، هر حرکت سی ثانیه. قبل از ست سنگین، کشش طولانی نزن.',
    en: 'Stretching improves how far you can move and does nothing for soreness. Do it after training or on a rest day, about thirty seconds a position — not right before a heavy set.',
  },
  'k.deload': {
    fa: 'هر شش تا هشت هفته یک هفته سبک‌تر بزن: همان حرکات، حدود نصف حجم. خستگی جمع می‌شود و یک هفته عقب‌نشینی معمولاً ارزان‌تر از چند هفته درجا زدن است.',
    en: 'Every six to eight weeks take a lighter week — the same lifts at about half the volume. Fatigue accumulates, and one easier week usually costs less than a month of grinding.',
  },
  'k.overload': {
    fa: 'هر هفته یک چیز را بیشتر کن: یا وزنه، یا تکرار، یا ست. اگر هیچ‌کدام بالا نمی‌رود، بدن دلیلی برای تغییر ندارد — این تنها قانونی است که کل تمرین روی آن می‌چرخد.',
    en: 'Each week make one thing bigger: the weight, the reps, or the sets. If none of them goes up, the body has no reason to change — this is the one rule everything else in training hangs on.',
  },
  'k.women': {
    fa: 'وزنه زدن خانم‌ها را حجیم نمی‌کند. ساخت عضله کند است و بدون تستوسترون بالا کندتر — چیزی که از تمرین با وزنه می‌گیری فرم و قدرت و استخوان محکم‌تر است.',
    en: 'Lifting will not make a woman bulky. Building muscle is slow, and slower still without high testosterone — what lifting gives you is shape, strength and stronger bones.',
  },
  'k.beginner': {
    fa: 'سه روز در هفته، تمام بدن، شش تا هشت حرکت پایه. دو تا سه ماه اول را صرف یاد گرفتن تکنیک و ثابت‌کردن عادت کن، نه پیدا کردن بهترین برنامه.',
    en: 'Three days a week, whole body, six to eight basic lifts. Spend the first two or three months learning technique and building the habit rather than hunting for the perfect programme.',
  },
  'k.abs': {
    fa: 'شکم شش‌تکه در آشپزخانه ساخته می‌شود. عضله‌اش را تمرین می‌سازد و دیده‌شدنش به درصد چربی بستگی دارد — حرکت شکم هرچقدر هم بزنی، زیر چربی پیدا نیست.',
    en: 'Visible abs are made in the kitchen. Training builds the muscle, but seeing it depends on body fat — no amount of ab work uncovers what is under a layer of it.',
  },
  'k.scale': {
    fa: 'وزن روزانه یک تا دو کیلو بالا و پایین می‌رود و بیشترش آب و غذای هضم‌نشده است. میانگین هفته را نگاه کن، نه عدد امروز صبح را.',
    en: 'Daily weight swings a kilo or two and most of that is water and food still being digested. Look at the weekly average rather than this morning’s number.',
  },
  'k.caffeine': {
    fa: 'حدود ۳ تا ۶ میلی‌گرم به ازای هر کیلو وزن، سی تا شصت دقیقه قبل تمرین — برای بیشتر آدم‌ها یکی دو فنجان قهوه. نزدیک شب نخور؛ خوابی که می‌گیرد بیشتر از تمرینی است که می‌دهد.',
    en: 'Around 3 to 6 mg per kilo of bodyweight, thirty to sixty minutes before training — for most people that is a coffee or two. Not late in the day: the sleep it costs is worth more than the session it buys.',
  },
  'k.ramadan': {
    fa: 'تمرین را نزدیک افطار بگذار تا بتوانی بعدش بخوری و آب بخوری. حجم را کمی کم کن و انتظار رکورد نداشته باش؛ هدف این ماه نگه‌داشتن است، نه پیشرفت.',
    en: 'Train close to iftar so you can eat and drink afterwards. Drop the volume a little and do not chase records — the aim this month is holding on to what you have, not adding to it.',
  },
  'k.injury': {
    fa: 'دردی که بعد از گرم‌کردن نمی‌رود، یا در مفصل است نه عضله، یا بیشتر از چند روز طول کشیده — این‌ها را با پزشک یا فیزیوتراپیست ببین. این اپ یک دفترچه است، نه پزشک.',
    en: 'Pain that does not ease after warming up, that sits in a joint rather than a muscle, or that has lasted more than a few days — take that to a doctor or a physiotherapist. This app is a notebook, not a clinic.',
  },
  'k.home': {
    fa: 'بدون وسیله هم می‌شود: شنا، اسکوات، لانج، پلانک و بارفیکس اگر میله‌ای داری. '
      + 'وقتی حرکتی آسان شد، به جای تکرار بیشتر، سخت‌ترش کن — یک پا، دامنهٔ بیشتر، یا آرام‌تر.',
    en: 'You can train with nothing: push-ups, squats, lunges, planks, and pull-ups if '
      + 'you have a bar. When a movement gets easy, make it harder rather than doing more '
      + 'of it — one leg, a longer range, or slower.',
  },
  'k.tdee': {
    fa: 'کالری نگهدارنده یعنی مقداری که با آن وزنت ثابت می‌ماند: متابولیسم پایه ضربدر میزان تحرکت. همهٔ فرمول‌ها تخمینی‌اند — دو هفته وزن را دنبال کن و عدد را با چیزی که می‌بینی تنظیم کن.',
    en: 'Maintenance is the number that keeps your weight where it is: your resting burn multiplied by how much you move. Every formula for it is an estimate — track your weight for a fortnight and correct the number against what you see.',
  },
  'k.macros': {
    fa: 'پروتئین برای ساخت و نگه‌داشت عضله، چربی برای هورمون‌ها، کربوهیدرات برای انرژی تمرین. اول پروتئین و چربی را تعیین کن، بقیهٔ کالری می‌شود کربوهیدرات.',
    en: 'Protein builds and keeps muscle, fat runs your hormones, carbohydrate fuels training. Set protein and fat first; whatever calories are left become the carbs.',
  },
  'k.breakfast': {
    fa: 'صبحانه نه اجباری است و نه جادویی. اگر صبح‌ها گرسنه‌ای بخور، و اگر نه، نخور — چیزی که مهم است کل روز است، نه اینکه اولین وعده کی باشد.',
    en: 'Breakfast is neither compulsory nor magic. Eat it if you are hungry in the morning and skip it if you are not — what matters is the whole day, not when the first meal lands.',
  },
  'k.meal_timing': {
    fa: 'دو تا شش وعده در روز — هر چه برایت قابل تکرار است. تعداد وعده متابولیسم را عوض نمی‌کند؛ فقط پروتئین را روی روز پخش کن.',
    en: 'Two to six meals a day — whichever you can actually keep up. The number does not change your metabolism; just spread the protein across the day rather than stacking it in one meal.',
  },
  'k.veg_protein': {
    fa: 'عدس، لوبیا، نخود، سویا، توفو و لبنیات اگر می‌خوری. منابع گیاهی اغلب ناقص‌اند، پس تنوع داشته باش و حدود ۱۰ تا ۲۰ درصد بیشتر بگیر.',
    en: 'Lentils, beans, chickpeas, soy, tofu, and dairy if you eat it. Plant sources are often incomplete on their own, so vary them and aim about 10 to 20 per cent higher than you otherwise would.',
  },
  'k.sugar': {
    fa: 'شکر ذاتاً چاق نمی‌کند؛ مشکلش این است که کالری می‌دهد و سیر نمی‌کند. جایی که بیشتر از همه ضربه می‌زند نوشیدنی است، چون هیچ سیری‌ای نمی‌آورد.',
    en: 'Sugar is not fattening in itself; the trouble is that it brings calories without filling you up. Where it costs most is in drinks, because nothing you drink makes you any less hungry.',
  },
  'k.eating_out': {
    fa: 'قبلش سبک‌تر بخور و پروتئین را نگه دار، بعد هر چه دوست داری سفارش بده. تخمین بزن و ببخش — یک وعدهٔ تخمینی بهتر از نخوردن با دوست‌هاست.',
    en: 'Eat lighter earlier in the day and keep the protein up, then order what you like. Estimate it and let it go — a guessed meal logged is better than not eating with your friends.',
  },
  'k.motivation': {
    fa: 'انگیزه می‌آید و می‌رود؛ برنامه می‌ماند. روزی که حوصله نداری یک جلسهٔ کوتاه بزن — بیست دقیقه بهتر از هیچ است، و زنجیره را نمی‌شکند.',
    en: 'Motivation comes and goes; the schedule is what stays. On a day you cannot face it, do a short session — twenty minutes beats nothing, and it keeps the streak intact.',
  },
  'k.habit': {
    fa: 'یک چیز را در یک زمان عوض کن و آن را به کاری که همیشه می‌کنی بچسبان. سه هفته ثبات بیشتر از یک هفتهٔ عالی می‌ارزد.',
    en: 'Change one thing at a time and attach it to something you already do without thinking. Three steady weeks are worth more than one perfect one.',
  },
  'k.weight_plateau': {
    fa: 'اگر دو تا سه هفته وزن تکان نخورده، اول دقت ثبت را چک کن — اغلب مقصر همین است. اگر درست بود، حدود ۱۰ درصد کالری کم کن یا تحرک روزانه را بالا ببر.',
    en: 'If the scale has not moved in two or three weeks, check how accurately you are logging first — that is usually the answer. If the logging is honest, take about ten per cent off the calories or add movement to your day.',
  },
  'k.age': {
    fa: 'سن مانع عضله‌سازی نیست؛ فقط ریکاوری کندتر می‌شود. گرم‌کردن را جدی بگیر، یک روز استراحت بیشتر بگذار، و پروتئین را بالا نگه دار.',
    en: 'Age does not stop you building muscle; it slows the recovery between sessions. Take warming up seriously, leave an extra rest day, and keep the protein high.',
  },
  'k.teen': {
    fa: 'نوجوان می‌تواند وزنه بزند و این مانع قد کشیدن نمی‌شود — این حرف قدیمی است و درست نیست. تکنیک را با وزنهٔ سبک یاد بگیرد و زیر نظر کسی که بلد است.',
    en: 'A teenager can lift, and it does not stunt growth — that is an old story and it is not true. Learn technique with light weights and under someone who knows what they are looking at.',
  },
  'k.pregnancy': {
    fa: 'تمرین در بارداری اغلب مفید است، ولی برنامه‌اش را باید پزشک خودت بدهد، نه یک اپ. این جزو چیزهایی است که عدد عمومی برایش وجود ندارد.',
    en: 'Training through a pregnancy is often a good thing, but the plan has to come from your own doctor rather than from an app. This is one of the things there is no general number for.',
  },
  'k.machine_vs_free': {
    fa: 'هر دو کار می‌کنند. وزنهٔ آزاد تعادل و عضلات کمکی را هم درگیر می‌کند، دستگاه یادگیری‌اش آسان‌تر است و تا ناتوانی زدنش بی‌خطرتر.',
    en: 'Both work. Free weights bring in balance and the smaller supporting muscles; machines are easier to learn and safer to take close to failure on your own.',
  },
  'k.compound': {
    fa: 'جلسه را با حرکات ترکیبی شروع کن — اسکوات، پرس، ددلیفت، زیربغل — وقتی تازه‌ای. حرکات تک‌عضله آخر بزن تا جاهایی را پر کنند که ترکیبی‌ها جا گذاشته‌اند.',
    en: 'Start a session with the compounds — squat, press, deadlift, row — while you are fresh. Put the single-joint work at the end, to fill in what the compounds left out.',
  },
  'k.failure': {
    fa: 'لازم نیست هر ست را تا ناتوانی بزنی. یک یا دو تکرار ذخیره نگه دار — همان اندازه عضله می‌سازد و خستگی خیلی کمتری می‌گذارد.',
    en: 'You do not have to take every set to failure. Leave one or two reps in reserve — it builds much the same muscle and costs far less fatigue.',
  },
  'k.split': {
    fa: 'سه روز در هفته فول‌بادی، چهار روز بالاتنه و پایین‌تنه، پنج تا شش روز پوش پول پا. هیچ‌کدام بر دیگری برتری ندارد اگر حجم هفتگی یکی باشد.',
    en: 'Three days a week: whole body. Four: upper and lower. Five or six: push, pull, legs. None of them beats another as long as the weekly volume comes out the same.',
  },
  'k.travel': {
    fa: 'در سفر هدف نگه‌داشتن است نه پیشرفت. دو جلسهٔ کوتاه در هفته، حتی با وزن بدن، برای نگه‌داشتن هر چه ساخته‌ای کافی است.',
    en: 'On a trip the aim is holding on, not progress. Two short sessions a week, bodyweight if that is all there is, keeps everything you have built.',
  },

  'k.bulk_cut': {
    fa: 'اگر چربی‌ات زیاد است اول کات، اگر خیلی لاغری اول حجم؛ در میانهٔ این دو، حجم '
      + 'آهسته با مازاد کم معمولاً بهتر جواب می‌دهد. هر دوره را چند ماه نگه دار نه '
      + 'چند هفته — عوض‌کردن پی‌درپی جهت یعنی هیچ‌وقت نتیجهٔ هیچ‌کدام را نمی‌بینی.',
    en: 'If you are carrying a lot of fat, cut first; if you are very lean, build '
      + 'first. In between, a slow build on a small surplus usually works better. '
      + 'Give either phase a few months rather than a few weeks — switching '
      + 'direction constantly means you never see the result of either.',
  },
  'k.rest_days': {
    fa: 'یک تا سه روز استراحت در هفته برای بیشتر برنامه‌ها کافی است، و استراحت یعنی '
      + 'نزدنِ همان عضله، نه نشستن. اگر خواب و اشتها به هم ریخته یا وزنه‌ها چند هفته '
      + 'است پایین می‌آید، بدن یک روز بیشتر می‌خواهد.',
    en: 'One to three rest days a week suits most programmes, and resting means not '
      + 'training the same muscle rather than not moving at all. If sleep or '
      + 'appetite is off and the weights have been dropping for a few weeks, take '
      + 'another day.',
  },
  'k.time_of_day': {
    fa: 'ساعت تمرین تفاوت معناداری در نتیجه نمی‌سازد؛ ساعتی که بتوانی هر هفته سرِ آن '
      + 'حاضر شوی می‌سازد. بیشتر آدم‌ها عصر کمی قوی‌ترند، ولی این اختلاف در برابر '
      + 'نظم ناچیز است.',
    en: 'The hour you train makes little difference to the result; the hour you can '
      + 'actually keep every week does. Most people are slightly stronger in the '
      + 'afternoon, but that gap is small next to consistency.',
  },
  'k.body_fat': {
    fa: 'درصد چربی را ترازوها و دستگاه‌های خانگی با چند درصد خطا می‌گویند، پس عدد را '
      + 'مطلق نگیر و روندش را ببین. برای بیشتر آدم‌ها اندازهٔ دور کمر و یک عکس '
      + 'ماهانه، تصویر صادق‌تری از آن عدد می‌دهد.',
    en: 'Home scales and handheld devices read body fat with a few percentage points '
      + 'of error, so watch the trend rather than the number. For most people a '
      + 'waist measurement and a monthly photo tell the story more honestly.',
  },
  'k.bmi': {
    fa: 'شاخص تودهٔ بدنی فقط قد و وزن را می‌بیند و بین عضله و چربی فرقی نمی‌گذارد، '
      + 'برای همین برای کسی که تمرین می‌کند گمراه‌کننده است. به‌عنوان نگاهی کلی به '
      + 'یک جمعیت خوب است، به‌عنوان هدف شخصی نه.',
    en: 'BMI only knows your height and weight and cannot tell muscle from fat, '
      + 'which makes it misleading for anyone who trains. It is a reasonable look at '
      + 'a population and a poor personal target.',
  },
  'k.walking': {
    fa: 'پیاده‌روی کم‌فشارترین راه اضافه‌کردن کالریِ سوزانده است و ریکاوریِ تمرین با '
      + 'وزنه را هم خراب نمی‌کند. روزی بیست تا چهل دقیقه، حتی تکه‌تکه، برای بیشتر '
      + 'آدم‌ها شروع خوبی است.',
    en: 'Walking is the cheapest way to add burned calories and it does not '
      + 'interfere with recovering from lifting. Twenty to forty minutes a day, even '
      + 'broken into pieces, is a good place to start.',
  },
  'k.steps': {
    fa: 'عدد ده هزار قدم از یک تبلیغ قدیمی آمده نه از پژوهش؛ بیشترِ فایده جایی بین '
      + 'هفت تا نه هزار قدم به دست می‌آید. مهم‌تر از رسیدن به یک عدد این است که '
      + 'میانگین این هفته از هفتهٔ پیش کمتر نباشد.',
    en: 'The ten-thousand-step figure came from an old advertising campaign rather '
      + 'than research; most of the benefit turns up somewhere between seven and '
      + 'nine thousand. What matters more than hitting a number is this week '
      + 'averaging no less than last week.',
  },
  'k.fiber': {
    fa: 'روزی حدود ۲۵ تا ۳۵ گرم فیبر، از سبزیجات، حبوبات، میوه و غلات کامل. اگر الان '
      + 'کم می‌خوری آرام بالا ببر و آب بیشتری بنوش، وگرنه شکم چند روزی شاکی می‌شود.',
    en: 'Around 25 to 35 grams a day, from vegetables, pulses, fruit and whole '
      + 'grains. If you eat little of it now, raise it gradually and drink more '
      + 'water, or your stomach will complain for a few days.',
  },
  'k.salt': {
    fa: 'نمک بیشتر روی فشار خون و نگه‌داشتن آب اثر می‌گذارد تا روی چربی؛ یکی‌دو کیلو '
      + 'نوسان ترازو بعد از یک وعدهٔ شور معمولاً آب است. اگر فشار خون داری، مقدارش '
      + 'را با پزشک خودت تنظیم کن.',
    en: 'Salt mostly affects blood pressure and water retention rather than fat; a '
      + 'kilo or two on the scale after a salty meal is usually water. If you have '
      + 'high blood pressure, work out how much to cut with your own doctor.',
  },
  'k.vitamin_d': {
    fa: 'کمبود ویتامین D در کسانی که بیشترِ روز را داخل ساختمان‌اند شایع است، ولی '
      + 'دوزِ خودسرانه کار درستی نیست. آزمایش بده و مقدارش را از پزشک بگیر.',
    en: 'Vitamin D runs low in people who spend most of the day indoors, but '
      + 'guessing at a dose is not the answer. Get it tested and let a doctor set '
      + 'the amount.',
  },
  'k.iron': {
    fa: 'خستگیِ همیشگی و زود نفس‌کم‌آوردن سرِ تمرین دلایل زیادی دارد و کم‌خونی یکی '
      + 'از آن‌هاست — این را با آزمایش می‌فهمند نه با حدس. مکمل آهن را بدون نسخه '
      + 'نخور؛ زیادی‌اش هم ضرر دارد.',
    en: 'Constant tiredness and getting out of breath early in a session can have '
      + 'many causes and low iron is one of them — a blood test tells you, guessing '
      + 'does not. Do not take iron supplements without a prescription; too much is '
      + 'harmful.',
  },
  'k.omega3': {
    fa: 'ماهیِ چرب، دو بار در هفته، بیشترِ چیزی را که مردم از امگا۳ می‌خواهند '
      + 'می‌دهد. اگر ماهی نمی‌خوری مکمل گزینهٔ معقولی است، ولی جای یک رژیم مرتب را '
      + 'نمی‌گیرد.',
    en: 'Oily fish twice a week covers most of what people take omega-3 for. If you '
      + 'do not eat fish, a supplement is a reasonable stand-in, but it does not '
      + 'replace an otherwise sensible diet.',
  },
  'k.bread_rice': {
    fa: 'نان و برنج ذاتاً چاق‌کننده نیستند؛ مقدارشان کالریِ روز را بالا می‌برد، چون '
      + 'راحت زیاد خورده می‌شوند. اگر دوستشان داری نگهشان دار و اندازه را کنترل کن، '
      + 'و تا می‌شود سراغ نوع سبوس‌دار برو.',
    en: 'Bread and rice are not fattening in themselves; it is the amount, because '
      + 'they are easy to eat a lot of. If you like them, keep them and control the '
      + 'portion — and take the wholegrain version where you can.',
  },
  'k.dairy': {
    fa: 'لبنیات پروتئین و کلسیم خوبی دارند و ماست و پنیر در بیشتر برنامه‌ها راحت جا '
      + 'می‌شوند. اگر شیر دلت را به هم می‌ریزد، ماست و پنیر معمولاً بهتر تحمل '
      + 'می‌شوند.',
    en: 'Dairy is a good source of protein and calcium, and yoghurt and cheese fit '
      + 'easily into most plans. If milk upsets your stomach, yoghurt and cheese are '
      + 'usually tolerated better.',
  },
  'k.snack': {
    fa: 'میان‌وعده لازم نیست، ولی اگر بین وعده‌ها آن‌قدر گرسنه می‌شوی که بعد پرخوری '
      + 'می‌کنی، کمک می‌کند. چیزی بردار که پروتئین داشته باشد — ماست، تخم‌مرغ، مغزها '
      + '— نه چیزی که ده دقیقه بعد دوباره گرسنه‌ات کند.',
    en: 'Snacks are not necessary, but they help if you get so hungry between meals '
      + 'that you overeat at the next one. Pick something with protein in it — '
      + 'yoghurt, eggs, nuts — rather than something that leaves you hungry ten '
      + 'minutes later.',
  },
  'k.late_dinner': {
    fa: 'کالری بعد از ساعت خاصی چاق‌کننده‌تر نمی‌شود؛ مجموع روز است که حساب می‌شود. '
      + 'اگر شامِ دیر خوابت را خراب می‌کند، حجمش را کم کن، نه لزوماً ساعتش را.',
    en: 'Calories do not count for more after a certain hour; the day’s total is '
      + 'what matters. If a late dinner spoils your sleep, make it smaller rather '
      + 'than necessarily earlier.',
  },
  'k.cramps': {
    fa: 'گرفتگی معمولاً به کم‌آبی، خستگی یا گرم‌نکردن برمی‌گردد؛ کششِ آرام، آب و کمی '
      + 'نمک معمولاً کافی است. اگر مرتب و بی‌دلیل تکرار می‌شود، به پزشک بگو.',
    en: 'Cramp usually comes down to dehydration, fatigue or a skipped warm-up; a '
      + 'gentle stretch, water and a little salt usually settle it. If it keeps '
      + 'happening for no clear reason, mention it to a doctor.',
  },
  'k.posture': {
    fa: 'قوز بیشتر عادت است تا ضعف، ولی تقویت پشت و کشش سینه ایستادنِ صاف را آسان‌تر '
      + 'می‌کند. هیچ وضعیتی «درست» نیست اگر ساعت‌ها بی‌حرکت بماند؛ جابه‌جا شدن از '
      + 'نشستنِ ایدئال مهم‌تر است.',
    en: 'Slouching is more habit than weakness, but strengthening the back and '
      + 'stretching the chest makes standing up straight easier. No posture is the '
      + 'right one if you hold it for hours — moving matters more than sitting '
      + 'perfectly.',
  },
  'k.desk_job': {
    fa: 'اگر روزت پشت میز می‌گذرد، هر نیم تا یک ساعت چند دقیقه بلند شو و راه برو. هم '
      + 'کمر راحت‌تر است و هم بخش خوبی از تحرکِ روز بی‌سروصدا جمع می‌شود.',
    en: 'If you sit all day, get up and walk for a few minutes every half hour to an '
      + 'hour. It eases the back and quietly builds up a decent share of the day’s '
      + 'movement.',
  },
  'k.stress': {
    fa: 'استرس و کم‌خوابی هم‌زمان ریکاوری و اشتها را به هم می‌ریزند و کارِ ماه‌ها '
      + 'تمرین را کند می‌کنند. در هفته‌های شلوغ برنامه را سبک‌تر کن ولی قطع نکن — '
      + 'تمرین کوتاه از نرفتن بهتر است.',
    en: 'Stress and short sleep disrupt recovery and appetite at the same time, and '
      + 'they slow down months of training. In a busy week, lighten the programme '
      + 'rather than dropping it — a short session beats not going.',
  },
  'k.weigh_frequency': {
    fa: 'هر روز صبح، ناشتا و بعد از دستشویی، و میانگینِ هفته را ببین نه عددِ امروز '
      + 'را. وزن روزانه یکی‌دو کیلو بالا و پایین می‌رود و آن نوسان، آب است نه چربی.',
    en: 'Every morning, before eating and after the bathroom, and read the weekly '
      + 'average rather than today’s number. Daily weight swings by a kilo or two '
      + 'and that swing is water, not fat.',
  },
  'k.measure_progress': {
    fa: 'سه چیز را با هم ببین: وزنه‌ها و تکرارها، اندازهٔ دور کمر، و یک عکس ماهانه. '
      + 'اگر دست‌کم یکی از این سه در شش هفته بهتر شده، برنامه دارد کار می‌کند.',
    en: 'Watch three things together: the weights and reps, your waist measurement, '
      + 'and a monthly photo. If at least one of the three has improved over six '
      + 'weeks, the programme is working.',
  },
  'k.appetite': {
    fa: 'اگر برای رشد باید بیشتر بخوری ولی اشتها نداری، سراغ غذاهای پرکالری و کم‌حجم '
      + 'برو: مغزها، روغن زیتون، خرما، لبنیات پرچرب. کالریِ نوشیدنی هم راحت‌تر از '
      + 'بشقاب دوم پایین می‌رود.',
    en: 'If you need to eat more to grow but have no appetite, lean on foods that '
      + 'are dense rather than bulky: nuts, olive oil, dates, full-fat dairy. '
      + 'Calories you can drink also go down more easily than a second plate.',
  },
};

export const KNOWLEDGE_IDS = Object.keys(KNOWLEDGE_TEXT);
