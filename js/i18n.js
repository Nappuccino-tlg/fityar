/* ============ Bilingual strings (fa / en) ============ */

export const STRINGS = {
  fa: {
    /* nav */
    navHome:'خانه', navDiary:'تغذیه', navTrain:'تمرین', navProgress:'پیشرفت', navMore:'بیشتر',
    appName:'فیت‌یار',
    /* home */
    kcalLeft:'کالری باقی‌مانده', goal:'هدف', eaten:'خورده', burned:'سوزانده',
    scanMeal:'اسکن غذا', addFood:'افزودن غذا', startWorkout:'شروع تمرین',
    water:'آب', todayMeals:'وعده‌های امروز', recentWorkouts:'تمرین‌های اخیر', seeAll:'مشاهده همه',
    overBy:'اضافه', kcal:'کالری',
    /* macros */
    protein:'پروتئین', carbs:'کربوهیدرات', fat:'چربی', fiber:'فیبر',
    /* meals */
    breakfast:'صبحانه', lunch:'ناهار', dinner:'شام', snack:'میان‌وعده',
    dailyNote:'یادداشت روز', addTo:'افزودن به',
    /* diary */
    today:'امروز', yesterday:'دیروز', tomorrow:'فردا',
    /* train */
    routines:'برنامه‌ها', history:'تاریخچه', exercises:'حرکات',
    startEmptyWorkout:'شروع تمرین خالی', myRoutines:'برنامه‌های من', templates:'الگوهای آماده',
    new:'جدید', workouts:'تمرین', totalVolume:'حجم کل', totalTime:'زمان کل',
    addExercise:'افزودن حرکت', cancelWorkout:'لغو تمرین', finish:'پایان', resume:'ادامه',
    sets:'ست', reps:'تکرار', weightCol:'وزن', prev:'قبلی', rest:'استراحت',
    addSet:'افزودن ست', removeSet:'حذف ست', notes:'یادداشت',
    startRoutine:'شروع این برنامه', editRoutine:'ویرایش برنامه', deleteRoutine:'حذف برنامه',
    useTemplate:'استفاده از این الگو', saveAsRoutine:'ذخیره به عنوان برنامه',
    exerciseName:'نام حرکت', muscle:'عضله', equipment:'تجهیزات',
    /* progress */
    body:'بدن', nutrition:'تغذیه', strength:'قدرت',
    weight:'وزن', measurements:'اندازه‌ها', log:'ثبت',
    calories14:'کالری ۱۴ روز اخیر', macroAvg:'میانگین درشت‌مغذی‌ها',
    weeklyVolume:'حجم هفتگی', records:'رکوردها',
    start:'شروع', current:'فعلی', change:'تغییر', avg:'میانگین', perWeek:'در هفته',
    /* more */
    aiPlan:'برنامه هوشمند', ai:'هوش مصنوعی', goalsCalories:'اهداف و کالری',
    myFoods:'غذاهای من', aiSettings:'تنظیمات هوش مصنوعی', preferences:'تنظیمات کلی',
    backupRestore:'پشتیبان‌گیری و بازیابی', about:'درباره', edit:'ویرایش',
    /* profile */
    profile:'پروفایل', name:'نام', age:'سن', sex:'جنسیت', male:'مرد', female:'زن',
    height:'قد', activity:'سطح فعالیت', goalType:'هدف',
    sedentary:'کم‌تحرک (کار پشت میز)', light:'کم (۱-۳ روز ورزش)',
    moderate:'متوسط (۳-۵ روز ورزش)', high:'زیاد (۶-۷ روز ورزش)', athlete:'خیلی زیاد (ورزشکار)',
    lose:'کاهش وزن', maintain:'حفظ وزن', gain:'افزایش وزن', recomp:'عضله‌سازی و چربی‌سوزی',
    experience:'سطح تجربه', beginner:'مبتدی', intermediate:'متوسط', advanced:'پیشرفته',
    daysPerWeek:'روز تمرین در هفته', targetWeight:'وزن هدف',
    /* goals */
    calorieGoal:'هدف کالری روزانه', proteinGoal:'هدف پروتئین', carbGoal:'هدف کربوهیدرات',
    fatGoal:'هدف چربی', waterGoal:'هدف آب (میلی‌لیتر)',
    autoCalc:'محاسبه خودکار', bmr:'متابولیسم پایه (BMR)', tdee:'کالری نگهدارنده (TDEE)',
    calcNote:'با فرمول Mifflin-St Jeor محاسبه می‌شود.',
    applyAuto:'اعمال مقادیر پیشنهادی',
    /* AI */
    apiKey:'کلید API', provider:'سرویس‌دهنده', model:'مدل',
    proxyTitle:'سرور من', proxyUrl:'آدرس سرور',
    proxyHelp:'کلید روی خود سرور نگه داشته می‌شود و هیچ‌وقت به گوشی نمی‌آید. برای همین اینجا کلیدی نمی‌خواهی و در کد گیت‌هاب هم چیزی پیدا نمی‌شود.',
    proxyReady:'آماده است — اسکن عکس و توصیف با متن فعال‌اند.',
    proxySetup:'راهنمای راه‌اندازی در پوشه‌ی worker پروژه است.',
    noKeyNeeded:'کلیدی لازم نیست',
    getKeyFree:'کلید رایگان بگیرید',
    apiHelp:'کلید فقط روی همین گوشی ذخیره می‌شود و به هیچ سروری جز خود سرویس‌دهنده فرستاده نمی‌شود.',
    testKey:'تست اتصال', saveKey:'ذخیره',
    analyzing:'در حال تحلیل عکس…', generating:'در حال ساخت برنامه…',
    noKey:'ابتدا کلید API را در «تنظیمات هوش مصنوعی» وارد کنید.',
    aiResult:'نتیجه تحلیل', addAll:'افزودن همه', retake:'عکس دیگر',
    describeMore:'توضیح بیشتر (اختیاری)', describePh:'مثلاً: برنج ۱ پیمانه، مرغ کبابی…',
    kcalFixed:'کالری اصلاح شد', kcalFixedWhy:'عدد کالری با درشت‌مغذی‌ها نمی‌خواند؛ از روی پروتئین، کربوهیدرات و چربی دوباره حساب شد.',
    reanalyze:'تحلیل مجدد با توضیح',
    /* food */
    search:'جستجو', searchFood:'جستجوی غذا', recent:'اخیر', myFoodsShort:'غذاهای من',
    createFood:'ساخت غذای جدید', servingSize:'اندازه سروینگ', amount:'مقدار', unit:'واحد',
    solid:'جامد', liquid:'مایع', foodState:'حالت غذا',
    per100ml:'به ازای ۱۰۰ میلی‌لیتر (سی‌سی)',
    volume:'حجم', cc:'سی‌سی', mlUnit:'میلی‌لیتر',
    per100:'به ازای ۱۰۰ گرم', save:'ذخیره', delete:'حذف', cancel:'انصراف', add:'افزودن',
    gram:'گرم', ml:'میلی‌لیتر', piece:'عدد', cup:'پیمانه', tbsp:'قاشق غذاخوری', tsp:'قاشق چای‌خوری',
    serving:'سروینگ', portion:'پرس',
    /* prefs */
    language:'زبان', theme:'پوسته', dark:'تیره', lightTheme:'روشن',
    units:'واحدها', metric:'متریک (کیلوگرم/سانتی‌متر)', imperial:'امپریال (پوند/اینچ)',
    restTimerDefault:'زمان استراحت پیش‌فرض (ثانیه)',
    soundVibrate:'صدا و لرزش', on:'روشن', off:'خاموش',
    firstDay:'روز اول هفته', saturday:'شنبه', monday:'دوشنبه', sunday:'یکشنبه',
    /* backup */
    importWarn:'فقط فایلی را بازیابی کن که خودت ساخته‌ای. یک فایل ناشناس می‌تواند تنظیمات هوش مصنوعی — از جمله آدرس سرویس — را عوض کند و کلید تو را جای دیگری بفرستد.',
    keepMySettings:'تنظیمات فعلی خودم را نگه دار',
    includePhotos:'شامل عکس‌ها هم بشود', estSize:'حجم تقریبی',
    whereData:'داده‌ها کجا ذخیره می‌شوند؟',
    whereDataText:'روی همین مرورگر و همین دستگاه. هر دستگاه یا مرورگر دیگری از صفر شروع می‌کند. آدرس هم مهم است: localhost و آدرس اینترنتی دو حافظه‌ی جداگانه‌اند.',
    moveDevice:'انتقال به دستگاه دیگر', moveStep1:'اینجا خروجی بگیر',
    moveStep2:'فایل را به دستگاه دوم برسان (تلگرام، ایمیل، USB)',
    moveStep3:'در دستگاه دوم همان اپ را باز کن و «بازیابی از فایل» را بزن',
    exportData:'خروجی گرفتن (JSON)', importData:'بازیابی از فایل',
    importMerge:'ادغام با داده فعلی', importReplace:'جایگزینی کامل',
    wipe:'پاک کردن همه داده‌ها', wipeConfirm:'مطمئنید؟ همه داده‌ها برای همیشه پاک می‌شوند.',
    storageUsed:'فضای مصرفی', photosStored:'عکس ذخیره‌شده',
    autoBackupTip:'روی آیفون هر چند وقت یک‌بار خروجی بگیرید؛ سافاری ممکن است داده اپ‌های استفاده‌نشده را پاک کند.',
    /* generic */
    apply:'اعمال', ok:'باشه', done:'انجام شد', saved:'ذخیره شد', deleted:'حذف شد',
    error:'خطا', empty:'چیزی اینجا نیست', loading:'در حال بارگذاری…',
    confirmDelete:'حذف شود؟', yes:'بله', no:'خیر', close:'بستن',
    min:'دقیقه', sec:'ثانیه', hour:'ساعت', kg:'کیلوگرم', lb:'پوند', cm:'سانتی‌متر', inch:'اینچ',
    /* measurements */
    neck:'گردن', chest:'سینه', waist:'کمر', hips:'باسن', thigh:'ران', arm:'بازو',
    calf:'ساق', shoulders:'شانه', bodyFat:'درصد چربی',
    /* misc */
    total:'مجموع', volume:'حجم', duration:'مدت', bestSet:'بهترین ست',
    est1rm:'۱RM تخمینی', newPR:'رکورد جدید!', prShort:'رکورد',
    warmup:'گرم‌کردن', dropSet:'دراپ‌ست', failure:'ناتوانی', normalSet:'ست عادی',
    setType:'نوع ست', pickType:'انتخاب نوع ست',
    workoutSaved:'تمرین ذخیره شد', workoutEmpty:'هیچ ستی کامل نشده',
    cancelConfirm:'تمرین لغو شود؟ اطلاعات ثبت‌نشده از بین می‌رود.',
    installTip:'برای نصب: منوی مرورگر ← «افزودن به صفحه اصلی»',
    offlineReady:'آماده برای کار آفلاین',
    aboutText:'وزن، وعده‌ها، تمرین‌ها و عکس‌هایتان فقط روی همین دستگاه ذخیره می‌شوند — نه حساب کاربری هست، نه سروری که نگهشان دارد. تنها چیزی که دستگاه را ترک می‌کند، عکس یا متنی است که خودتان برای تخمین کالری می‌فرستید.',
    privacyLink:'سیاست حریم خصوصی', dataStays:'روی همین دستگاه', aiOff:'خاموش',
    disclaimer:'مقادیر کالری و برنامه‌های تمرینی تخمینی و عمومی‌اند و جای مشاورهٔ پزشک، متخصص تغذیه یا مربی را نمی‌گیرند. اگر بیماری زمینه‌ای، بارداری یا شرایط خاصی دارید، پیش از تغییر رژیم یا شروع تمرین با پزشک مشورت کنید.',
    weeklyPlan:'برنامه هفتگی', mealPlan:'برنامه غذایی', trainingPlan:'برنامه تمرینی',
    generatePlan:'ساخت برنامه جدید', regenerate:'ساخت مجدد',
    planIntro:'با توجه به پروفایل و اهداف شما، یک برنامه تغذیه و تمرین ساخته می‌شود.',
    saveRoutinesFromPlan:'افزودن تمرین‌ها به برنامه‌های من',

    /* ---- workout wizard ---- */
    wizard:'ساخت برنامه تمرین', wizardSub:'چند سؤال، بعد برنامه‌ات آماده است',
    startWizard:'ساخت برنامه اختصاصی', rebuildPlan:'ساخت دوباره برنامه',
    stepOf:'مرحله', next:'بعدی', back:'قبلی', build:'بساز برنامه را',
    wBody:'اطلاعات بدن', wBodySub:'برای محاسبه‌ی کالری و حجم تمرین',
    wGoal:'هدف از ورزش', wGoalSub:'مهم‌ترین چیزی که می‌خواهی به دست بیاوری',
    wPlace:'کجا تمرین می‌کنی؟', wPlaceSub:'حرکات بر اساس تجهیزات در دسترس انتخاب می‌شوند',
    wFocus:'تمرکز اصلی', wFocusSub:'کدام عضله بیشترین توجه را بگیرد؟',
    wMuscles:'عضلات مورد نظر', wMusclesSub:'هر کدام را می‌خواهی کار کنی انتخاب کن',
    wDays:'روزهای تمرین', wDaysSub:'در هفته چند روز می‌توانی تمرین کنی؟',
    wTime:'زمان هر جلسه', wTimeSub:'هر روز چقدر وقت داری؟',
    goalMuscle:'عضله‌سازی', goalMuscleD:'افزایش حجم و قدرت عضلانی',
    goalFatloss:'چربی‌سوزی', goalFatlossD:'کاهش چربی با حفظ عضله',
    goalRecomp:'بازسازی بدن', goalRecompD:'همزمان چربی کم کن و عضله بساز',
    goalStrength:'قدرت', goalStrengthD:'بلند کردن وزنه‌های سنگین‌تر',
    goalEndurance:'استقامت', goalEnduranceD:'نفس و تحمل بیشتر',
    goalHealth:'سلامت عمومی', goalHealthD:'فعال ماندن و تناسب کلی',
    placeHomeNone:'خانه — بدون تجهیزات', placeHomeNoneD:'فقط وزن بدن و کش',
    placeHomeBasic:'خانه — دمبل دارم', placeHomeBasicD:'دمبل، کتل‌بل، کش',
    placeGym:'باشگاه', placeGymD:'دستگاه، هالتر، سیم‌کش — همه‌چیز',
    minPerSession:'دقیقه', sessionShort:'جلسه',
    pickAtLeastOne:'حداقل یک عضله انتخاب کن',
    planReady:'برنامه‌ات آماده شد', planSaved:'به «برنامه‌های من» اضافه شد',
    weeklySplit:'تقسیم‌بندی هفته', estPerSession:'تخمین هر جلسه',
    focusBadge:'تمرکز اصلی', totalSets:'کل ست‌ها',
    yourProgram:'برنامه‌ی تو', regenerateProgram:'ساخت مجدد',
    applyNutrition:'اعمال کالری و ماکروها',
    nutritionFromPlan:'کالری و ماکروی پیشنهادی',
    /* ---- day report ---- */
    lastMeal:'این آخرین وعده‌ی امروز بود', closeDay:'بستن روز و گزارش',
    dayReport:'گزارش روز', dayReports:'گزارش‌های روزانه', reports:'گزارش‌ها',
    dayClosed:'روز بسته شد', reopenDay:'باز کردن دوباره روز',
    overBudget:'بیش از حد', underBudget:'کمتر از حد', onTarget:'در محدوده‌ی هدف',
    tooMuch:'زیاد مصرف شد', tooLittle:'کم مصرف شد', missing:'اصلاً مصرف نشد',
    good:'خوب بود', advice:'توصیه', summary:'خلاصه',
    noReports:'هنوز روزی بسته نشده', closeDayHint:'برای دیدن گزارش، روز را ببند',
    consumed:'مصرف‌شده', target:'هدف', diff:'اختلاف',
    groupVeg:'سبزیجات', groupFruit:'میوه', groupProtein:'منابع پروتئین',
    groupDairy:'لبنیات', groupGrain:'غلات', groupNut:'آجیل و دانه', groupSnack:'تنقلات و شیرینی',
    afterClose:'این روز بسته شده — برای افزودن غذا دوباره بازش کن',
    projected:'با احتساب این وعده',

    noDataDay:'داده‌ای ثبت نشده', inProgress:'در جریان',
    historyStartsAfter:'از اولین روزی که چیزی ثبت کنی، همه‌ی روزها اینجا نگه داشته می‌شوند — حتی روزهایی که خالی باشند.',
    workoutsOfDay:'تمرین‌های این روز', noWorkout:'تمرینی ثبت نشده',
    firstDataDay:'اولین روز ثبت‌شده', totalDays:'روز در تاریخچه',
    emptyDayHint:'این روز چیزی ثبت نشده. اگر یادت رفته بود، می‌توانی همین حالا اضافه کنی.',
    dayHistory:'تاریخچه روزها', fullHistory:'تاریخچه کامل', goToDay:'رفتن به این روز',
    foodHistory:'تاریخچه تغذیه', whatYouAte:'چه چیزهایی خوردی',
    autoArchived:'به‌صورت خودکار بایگانی شد', archivedNote:'روزهای گذشته وقتی روز عوض می‌شود خودشان بایگانی می‌شوند.',
    goalsAtTime:'مقایسه با اهداف فعلی توست.',
    noHistory:'هنوز روزی ثبت نشده', nothingLogged:'چیزی ثبت نشده',
    recipeOf:'ترکیب این غذا', logParts:'ثبت اجزا به‌صورت جداگانه',
    logPartsHint:'اگر برنجش را کامل نخوردی یا کباب بیشتری داشتی، این دقیق‌تر است',
    derivedNote:'این مقادیر از روی اجزای زیر حساب شده‌اند، نه حدس.',
    partsAdded:'اجزا ثبت شدند',
    /* ---- saved meals & quick logging ---- */
    savedMeals:'وعده‌های ذخیره‌شده', saveMeal:'ذخیره این وعده', mealName:'نام وعده',
    repeatYesterday:'مثل دیروز', repeatDay:'تکرار یک روز', pickDayToCopy:'کدام روز کپی شود؟',
    noSavedMeals:'هنوز وعده‌ای ذخیره نکرده‌ای', savedMealHint:'یک وعده را کامل ثبت کن، بعد ذخیره‌اش کن',
    itemsCount:'قلم', copied:'کپی شد', quickAdd:'ثبت سریع',
    /* ---- barcode ---- */
    barcode:'بارکد', scanBarcode:'اسکن بارکد', barcodeNew:'این بارکد را نمی‌شناسم',
    barcodeBind:'یک بار مقادیرش را وارد کن، دفعه‌ی بعد خودش پر می‌شود',
    barcodeSaved:'بارکد ذخیره شد', barcodeNotSupported:'مرورگر تو اسکن بارکد را پشتیبانی نمی‌کند',
    barcodeCamera:'دوربین را روی بارکد بگیر', myBarcodes:'بارکدهای من',
    /* ---- schedule / today ---- */
    todayWorkout:'تمرین امروز', restDay:'روز استراحت', restDayHint:'امروز ریکاوری',
    weekSchedule:'برنامه‌ی هفته', assignDays:'تنظیم روزهای هفته', unassigned:'خالی',
    autoAssign:'چیدن خودکار', startNow:'شروع کن',
    /* ---- coach ---- */
    coachTip:'پیشنهاد', addWeight:'وزنه اضافه کن', addWeightHint:'جلسه‌ی قبل همه‌ی ست‌ها را کامل زدی',
    keepWeight:'همین وزنه را نگه دار', tryHarder:'به سقف تکرار نرسیدی',
    lastTime:'دفعه‌ی قبل', suggested:'پیشنهادی',
    streak:'روز پشت‌سرهم', streakBest:'بهترین رکورد', weekReview:'مرور هفته',
    adherence:'پایبندی', daysLogged:'روز ثبت‌شده', avgKcal:'میانگین کالری',
    thisWeek:'این هفته', lastWeek:'هفته‌ی قبل', trend:'روند',
    /* ---- tools ---- */
    plateCalc:'ماشین‌حساب وزنه', barWeight:'وزن میله', targetLoad:'وزن هدف',
    perSide:'هر طرف', notExact:'دقیقاً نمی‌شود — نزدیک‌ترین:', availablePlates:'صفحه‌های موجود',
    portionGuide:'راهنمای تخمین حجم', portionGuideSub:'بدون ترازو، با دست خودت',
    /* ---- body photos ---- */
    bodyPhotos:'عکس‌های پیشرفت', addPhoto:'افزودن عکس', comparePhotos:'مقایسه',
    noPhotos:'هنوز عکسی نگرفتی', photoHint:'هر چند هفته یک عکس بگیر تا تغییر را ببینی',
    photoPrivacy:'عکس‌ها فقط روی همین گوشی می‌مانند و در فایل بکاپ نمی‌آیند.',
    before:'قبل', after:'بعد', pickTwo:'دو عکس انتخاب کن',
    /* days */
    dayNames:['یکشنبه','دوشنبه','سه‌شنبه','چهارشنبه','پنجشنبه','جمعه','شنبه'],
    dayShort:['ی','د','س','چ','پ','ج','ش'],
    monthNames:['ژانویه','فوریه','مارس','آوریل','مه','ژوئن','ژوئیه','اوت','سپتامبر','اکتبر','نوامبر','دسامبر'],
  },

  en: {
    navHome:'Home', navDiary:'Food', navTrain:'Train', navProgress:'Progress', navMore:'More',
    appName:'FitYar',
    kcalLeft:'kcal left', goal:'Goal', eaten:'Eaten', burned:'Burned',
    scanMeal:'Scan meal', addFood:'Add food', startWorkout:'Start workout',
    water:'Water', todayMeals:"Today's meals", recentWorkouts:'Recent workouts', seeAll:'See all',
    overBy:'over', kcal:'kcal',
    protein:'Protein', carbs:'Carbs', fat:'Fat', fiber:'Fiber',
    breakfast:'Breakfast', lunch:'Lunch', dinner:'Dinner', snack:'Snack',
    dailyNote:'Daily note', addTo:'Add to',
    today:'Today', yesterday:'Yesterday', tomorrow:'Tomorrow',
    routines:'Routines', history:'History', exercises:'Exercises',
    startEmptyWorkout:'Start empty workout', myRoutines:'My routines', templates:'Templates',
    new:'New', workouts:'workouts', totalVolume:'Total volume', totalTime:'Total time',
    addExercise:'Add exercise', cancelWorkout:'Cancel workout', finish:'Finish', resume:'Resume',
    sets:'Set', reps:'Reps', weightCol:'Weight', prev:'Previous', rest:'Rest',
    addSet:'Add set', removeSet:'Remove set', notes:'Notes',
    startRoutine:'Start routine', editRoutine:'Edit routine', deleteRoutine:'Delete routine',
    useTemplate:'Use this template', saveAsRoutine:'Save as routine',
    exerciseName:'Exercise name', muscle:'Muscle', equipment:'Equipment',
    body:'Body', nutrition:'Nutrition', strength:'Strength',
    weight:'Weight', measurements:'Measurements', log:'Log',
    calories14:'Calories — last 14 days', macroAvg:'Macro average',
    weeklyVolume:'Weekly volume', records:'Records',
    start:'Start', current:'Current', change:'Change', avg:'Avg', perWeek:'Per week',
    aiPlan:'AI plan', ai:'AI', goalsCalories:'Goals & calories',
    myFoods:'My foods', aiSettings:'AI settings', preferences:'Preferences',
    backupRestore:'Backup & restore', about:'About', edit:'Edit',
    profile:'Profile', name:'Name', age:'Age', sex:'Sex', male:'Male', female:'Female',
    height:'Height', activity:'Activity level', goalType:'Goal',
    sedentary:'Sedentary (desk job)', light:'Light (1-3 days/wk)',
    moderate:'Moderate (3-5 days/wk)', high:'High (6-7 days/wk)', athlete:'Athlete',
    lose:'Lose weight', maintain:'Maintain', gain:'Gain weight', recomp:'Body recomposition',
    experience:'Experience', beginner:'Beginner', intermediate:'Intermediate', advanced:'Advanced',
    daysPerWeek:'Training days / week', targetWeight:'Target weight',
    calorieGoal:'Daily calorie goal', proteinGoal:'Protein goal', carbGoal:'Carb goal',
    fatGoal:'Fat goal', waterGoal:'Water goal (ml)',
    autoCalc:'Auto calculate', bmr:'BMR', tdee:'TDEE (maintenance)',
    calcNote:'Calculated with the Mifflin-St Jeor formula.',
    applyAuto:'Apply suggested values',
    apiKey:'API key', provider:'Provider', model:'Model',
    proxyTitle:'My server', proxyUrl:'Server URL',
    proxyHelp:'The key stays on the server and never reaches this phone, so you need no key here and nothing sensitive sits in the public code.',
    proxyReady:'Ready — photo scanning and text description are on.',
    proxySetup:'Setup instructions are in the project’s worker folder.',
    noKeyNeeded:'No key needed',
    getKeyFree:'Get a free key',
    apiHelp:'The key is stored only on this device and is sent to nobody but the provider.',
    testKey:'Test connection', saveKey:'Save',
    analyzing:'Analyzing photo…', generating:'Building your plan…',
    noKey:'Add your API key in “AI settings” first.',
    aiResult:'Analysis result', addAll:'Add all', retake:'New photo',
    describeMore:'Extra description (optional)', describePh:'e.g. 1 cup rice, grilled chicken…',
    kcalFixed:'kcal corrected', kcalFixedWhy:'The calorie figure disagreed with the macros, so it was recomputed from protein, carbs and fat.',
    reanalyze:'Re-analyze with note',
    search:'Search', searchFood:'Search food', recent:'Recent', myFoodsShort:'My foods',
    createFood:'Create food', servingSize:'Serving size', amount:'Amount', unit:'Unit',
    solid:'Solid', liquid:'Liquid', foodState:'Form',
    per100ml:'per 100 ml',
    volume:'Volume', cc:'cc', mlUnit:'ml',
    per100:'per 100 g', save:'Save', delete:'Delete', cancel:'Cancel', add:'Add',
    gram:'g', ml:'ml', piece:'piece', cup:'cup', tbsp:'tbsp', tsp:'tsp',
    serving:'serving', portion:'portion',
    language:'Language', theme:'Theme', dark:'Dark', lightTheme:'Light',
    units:'Units', metric:'Metric (kg/cm)', imperial:'Imperial (lb/in)',
    restTimerDefault:'Default rest timer (sec)',
    soundVibrate:'Sound & vibration', on:'On', off:'Off',
    firstDay:'First day of week', saturday:'Saturday', monday:'Monday', sunday:'Sunday',
    importWarn:'Only restore a file you made yourself. An unknown file can rewrite your AI settings — including the endpoint — and send your key elsewhere.',
    keepMySettings:'Keep my current settings',
    includePhotos:'Include photos', estSize:'Approx. size',
    whereData:'Where is the data kept?',
    whereDataText:'In this browser on this device. Any other device or browser starts empty. The address matters too: localhost and your web address are two separate stores.',
    moveDevice:'Move to another device', moveStep1:'Export here',
    moveStep2:'Get the file to the other device (Telegram, email, USB)',
    moveStep3:'Open the same app there and tap “Import from file”',
    exportData:'Export (JSON)', importData:'Import from file',
    importMerge:'Merge with current data', importReplace:'Replace everything',
    wipe:'Erase all data', wipeConfirm:'Are you sure? All data is gone forever.',
    storageUsed:'Storage used', photosStored:'photos stored',
    autoBackupTip:'On iPhone, export now and then — Safari may clear data for unused apps.',
    apply:'Apply', ok:'OK', done:'Done', saved:'Saved', deleted:'Deleted',
    error:'Error', empty:'Nothing here yet', loading:'Loading…',
    confirmDelete:'Delete this?', yes:'Yes', no:'No', close:'Close',
    min:'min', sec:'sec', hour:'h', kg:'kg', lb:'lb', cm:'cm', inch:'in',
    neck:'Neck', chest:'Chest', waist:'Waist', hips:'Hips', thigh:'Thigh', arm:'Arm',
    calf:'Calf', shoulders:'Shoulders', bodyFat:'Body fat %',
    total:'Total', volume:'Volume', duration:'Duration', bestSet:'Best set',
    est1rm:'Est. 1RM', newPR:'New PR!', prShort:'PR',
    warmup:'Warm-up', dropSet:'Drop set', failure:'Failure', normalSet:'Normal set',
    setType:'Set type', pickType:'Pick set type',
    workoutSaved:'Workout saved', workoutEmpty:'No sets completed',
    cancelConfirm:'Cancel workout? Unsaved sets are lost.',
    installTip:'To install: browser menu → “Add to Home Screen”',
    offlineReady:'Ready to work offline',
    aboutText:'Your weight, meals, workouts and photos stay on this device — no account, no server holding them. The only thing that leaves is a photo or a description you choose to send for a calorie estimate.',
    privacyLink:'Privacy policy', dataStays:'this device only', aiOff:'off',
    disclaimer:'Calorie figures and training plans are estimates and general guidance — not a substitute for a doctor, dietitian or coach. If you have a medical condition, are pregnant, or have particular needs, talk to a doctor before changing your diet or starting to train.',
    weeklyPlan:'Weekly plan', mealPlan:'Meal plan', trainingPlan:'Training plan',
    generatePlan:'Generate plan', regenerate:'Regenerate',
    planIntro:'A nutrition and training plan will be built from your profile and goals.',
    saveRoutinesFromPlan:'Add workouts to my routines',

    /* ---- workout wizard ---- */
    wizard:'Build a training plan', wizardSub:'A few questions, then your plan is ready',
    startWizard:'Build my plan', rebuildPlan:'Rebuild plan',
    stepOf:'Step', next:'Next', back:'Back', build:'Build the plan',
    wBody:'Body data', wBodySub:'Used for calories and training volume',
    wGoal:'Training goal', wGoalSub:'The main thing you want out of this',
    wPlace:'Where do you train?', wPlaceSub:'Exercises are picked from what you have',
    wFocus:'Main focus', wFocusSub:'Which muscle should get the most attention?',
    wMuscles:'Muscles to train', wMusclesSub:'Pick every one you want to work',
    wDays:'Training days', wDaysSub:'How many days a week can you train?',
    wTime:'Time per session', wTimeSub:'How long do you have each day?',
    goalMuscle:'Build muscle', goalMuscleD:'Add size and strength',
    goalFatloss:'Lose fat', goalFatlossD:'Cut fat while keeping muscle',
    goalRecomp:'Recomposition', goalRecompD:'Lose fat and build muscle at once',
    goalStrength:'Get stronger', goalStrengthD:'Move heavier weight',
    goalEndurance:'Endurance', goalEnduranceD:'More stamina and conditioning',
    goalHealth:'General health', goalHealthD:'Stay active and fit',
    placeHomeNone:'Home — no equipment', placeHomeNoneD:'Bodyweight and bands only',
    placeHomeBasic:'Home — I have dumbbells', placeHomeBasicD:'Dumbbells, kettlebells, bands',
    placeGym:'Gym', placeGymD:'Machines, barbells, cables — everything',
    minPerSession:'min', sessionShort:'session',
    pickAtLeastOne:'Pick at least one muscle',
    planReady:'Your plan is ready', planSaved:'Added to My routines',
    weeklySplit:'Weekly split', estPerSession:'Per session',
    focusBadge:'Main focus', totalSets:'Total sets',
    yourProgram:'Your program', regenerateProgram:'Rebuild',
    applyNutrition:'Apply calories & macros',
    nutritionFromPlan:'Suggested calories & macros',
    /* ---- day report ---- */
    lastMeal:'This was my last meal today', closeDay:'Close the day & report',
    dayReport:'Day report', dayReports:'Daily reports', reports:'Reports',
    dayClosed:'Day closed', reopenDay:'Reopen this day',
    overBudget:'Over budget', underBudget:'Under budget', onTarget:'On target',
    tooMuch:'Too much', tooLittle:'Too little', missing:'Missing entirely',
    good:'Good', advice:'Advice', summary:'Summary',
    noReports:'No day closed yet', closeDayHint:'Close a day to see its report',
    consumed:'Consumed', target:'Target', diff:'Difference',
    groupVeg:'Vegetables', groupFruit:'Fruit', groupProtein:'Protein sources',
    groupDairy:'Dairy', groupGrain:'Grains', groupNut:'Nuts & seeds', groupSnack:'Snacks & sweets',
    afterClose:'This day is closed — reopen it to add more food',
    projected:'Including this meal',

    noDataDay:'داده‌ای ثبت نشده', inProgress:'در جریان',
    historyStartsAfter:'از اولین روزی که چیزی ثبت کنی، همه‌ی روزها اینجا نگه داشته می‌شوند — حتی روزهایی که خالی باشند.',
    workoutsOfDay:'تمرین‌های این روز', noWorkout:'تمرینی ثبت نشده',
    firstDataDay:'اولین روز ثبت‌شده', totalDays:'روز در تاریخچه',
    emptyDayHint:'این روز چیزی ثبت نشده. اگر یادت رفته بود، می‌توانی همین حالا اضافه کنی.',
    dayHistory:'تاریخچه روزها', fullHistory:'تاریخچه کامل', goToDay:'رفتن به این روز',
    foodHistory:'تاریخچه تغذیه', whatYouAte:'چه چیزهایی خوردی',
    autoArchived:'به‌صورت خودکار بایگانی شد', archivedNote:'روزهای گذشته وقتی روز عوض می‌شود خودشان بایگانی می‌شوند.',
    goalsAtTime:'مقایسه با اهداف فعلی توست.',
    noHistory:'هنوز روزی ثبت نشده', nothingLogged:'چیزی ثبت نشده',
    recipeOf:'ترکیب این غذا', logParts:'ثبت اجزا به‌صورت جداگانه',
    logPartsHint:'اگر برنجش را کامل نخوردی یا کباب بیشتری داشتی، این دقیق‌تر است',
    derivedNote:'این مقادیر از روی اجزای زیر حساب شده‌اند، نه حدس.',
    partsAdded:'اجزا ثبت شدند',
    noDataDay:'Nothing logged', inProgress:'In progress',
    historyStartsAfter:'From the first day you log anything, every day is kept here — including the empty ones.',
    workoutsOfDay:'Workouts that day', noWorkout:'No workout logged',
    firstDataDay:'First logged day', totalDays:'days in history',
    emptyDayHint:'Nothing was logged this day. If you forgot, you can still add it.',
    dayHistory:'Day history', fullHistory:'Full history', goToDay:'Open this day',
    foodHistory:'Food history', whatYouAte:'What you ate',
    autoArchived:'Archived automatically', archivedNote:'Past days archive themselves when the date rolls over.',
    goalsAtTime:'Compared against your current targets.',
    noHistory:'No day logged yet', nothingLogged:'Nothing logged',
    recipeOf:'What is in this', logParts:'Log the parts separately',
    logPartsHint:'More accurate if you left rice behind or had extra meat',
    derivedNote:'These figures are computed from the components below, not guessed.',
    partsAdded:'Components logged',
    /* ---- saved meals & quick logging ---- */
    savedMeals:'Saved meals', saveMeal:'Save this meal', mealName:'Meal name',
    repeatYesterday:'Same as yesterday', repeatDay:'Copy a day', pickDayToCopy:'Which day to copy?',
    noSavedMeals:'No saved meals yet', savedMealHint:'Log a meal, then save it for next time',
    itemsCount:'items', copied:'Copied', quickAdd:'Quick add',
    /* ---- barcode ---- */
    barcode:'Barcode', scanBarcode:'Scan barcode', barcodeNew:"I don't know this barcode yet",
    barcodeBind:'Enter its values once — next time it fills itself in',
    barcodeSaved:'Barcode saved', barcodeNotSupported:'Your browser cannot scan barcodes',
    barcodeCamera:'Point the camera at the barcode', myBarcodes:'My barcodes',
    /* ---- schedule / today ---- */
    todayWorkout:"Today's workout", restDay:'Rest day', restDayHint:'Recovery today',
    weekSchedule:'Week schedule', assignDays:'Assign weekdays', unassigned:'Empty',
    autoAssign:'Auto-arrange', startNow:'Start now',
    /* ---- coach ---- */
    coachTip:'Suggestion', addWeight:'Add weight', addWeightHint:'You hit every set last time',
    keepWeight:'Stay at this weight', tryHarder:"You didn't reach the top of the range",
    lastTime:'Last time', suggested:'Suggested',
    streak:'day streak', streakBest:'Best streak', weekReview:'Week review',
    adherence:'Adherence', daysLogged:'days logged', avgKcal:'Avg calories',
    thisWeek:'This week', lastWeek:'Last week', trend:'Trend',
    /* ---- tools ---- */
    plateCalc:'Plate calculator', barWeight:'Bar weight', targetLoad:'Target weight',
    perSide:'Per side', notExact:'Not exact — closest:', availablePlates:'Available plates',
    portionGuide:'Portion guide', portionGuideSub:'No scale needed — use your hand',
    /* ---- body photos ---- */
    bodyPhotos:'Progress photos', addPhoto:'Add photo', comparePhotos:'Compare',
    noPhotos:'No photos yet', photoHint:'Take one every few weeks to see the change',
    photoPrivacy:'Photos stay on this device only and are never in the backup file.',
    before:'Before', after:'After', pickTwo:'Pick two photos',
    dayNames:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
    dayShort:['S','M','T','W','T','F','S'],
    monthNames:['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
  },
};

let LANG = 'fa';

export function setLang(l) {
  LANG = STRINGS[l] ? l : 'fa';
  document.documentElement.lang = LANG;
  document.documentElement.dir = LANG === 'fa' ? 'rtl' : 'ltr';
  applyDom();
  return LANG;
}
export const getLang = () => LANG;
export const isRTL = () => LANG === 'fa';

/** Translate a key. Falls back to English, then to the key itself. */
export function t(key) {
  const v = STRINGS[LANG]?.[key];
  if (v !== undefined) return v;
  const e = STRINGS.en?.[key];
  return e !== undefined ? e : key;
}

/** Replace text of every [data-i18n] node in the document. */
export function applyDom(root = document) {
  root.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  root.querySelectorAll('[data-i18n-ph]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPh);
  });
}

/** Format a number with the current locale digits (Persian digits for fa). */
export function num(n, digits = 0) {
  if (n === null || n === undefined || Number.isNaN(n)) return '—';
  const s = Number(n).toLocaleString(LANG === 'fa' ? 'fa-IR' : 'en-US', {
    minimumFractionDigits: digits, maximumFractionDigits: digits,
  });
  return s;
}

/**
 * "۸ حرکت" / "8 exercises". Persian takes no plural agreement after a numeral,
 * English does — so never build these by concatenating a bare label.
 */
const COUNT_WORDS = {
  exercise: { fa: 'حرکت',  one: 'exercise', many: 'exercises' },
  set:      { fa: 'ست',    one: 'set',      many: 'sets' },
  item:     { fa: 'قلم',   one: 'item',     many: 'items' },
  day:      { fa: 'روز',   one: 'day',      many: 'days' },
  workout:  { fa: 'تمرین', one: 'workout',  many: 'workouts' },
  minute:   { fa: 'دقیقه', one: 'minute',   many: 'minutes' },
};
export function countLabel(n, kind = 'item') {
  const w = COUNT_WORDS[kind] || COUNT_WORDS.item;
  return LANG === 'fa' ? `${num(n)} ${w.fa}` : `${num(n)} ${n === 1 ? w.one : w.many}`;
}

/** Pick the right language field of an object like {name, nameFa}. */
export function pick(obj, base = 'name') {
  if (!obj) return '';
  if (LANG === 'fa') return obj[base + 'Fa'] || obj[base] || '';
  return obj[base] || obj[base + 'Fa'] || '';
}
