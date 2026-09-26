/* ============ Settings screens: profile, goals, AI, preferences, backup ============ */
import * as db from './db.js';
import { ICON_STYLES, setIconStyle, lineIcon } from './icons.js';
import {
  S, saveSettings, saveProfile, saveGoals, suggestGoals, applyAutoGoals,
  bmr, tdee, kgToDisp, dispToKg, wUnit, cmToDisp, dispToCm, lUnit, usesTargetWeight, hasAI,
} from './store.js';
import { t, num, setLang, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, loading, field, input, select,
  segmented, round, parseNum, todayKey, setFx,
} from './ui.js';
import * as ai from './ai.js';
import * as rem from './reminders.js';
import * as acc from './account.js';

/* ---------------- profile ---------------- */

export function openProfile() {
  const p = S.profile;
  const nameIn = input({ value: p.name, placeholder: '—' });
  const ageIn = input({ type: 'number', inputmode: 'numeric', value: p.age });
  const hIn = input({ type: 'number', inputmode: 'decimal', step: '0.5', value: round(cmToDisp(p.height), 1) });
  const wIn = input({ type: 'number', inputmode: 'decimal', step: '0.1', value: round(kgToDisp(p.weight), 1) });
  const twIn = input({ type: 'number', inputmode: 'decimal', step: '0.1', value: round(kgToDisp(p.targetWeight), 1) });
  const sexSel = select([{ value: 'male', label: t('male') }, { value: 'female', label: t('female') }], p.sex);
  const actSel = select(['sedentary', 'light', 'moderate', 'high', 'athlete'].map(v => ({ value: v, label: t(v) })), p.activity);
  const goalSel = select(['lose', 'maintain', 'gain', 'recomp'].map(v => ({ value: v, label: t(v) })), p.goal);
  const expSel = select(['beginner', 'intermediate', 'advanced'].map(v => ({ value: v, label: t(v) })), p.experience);
  const daysSel = select([2, 3, 4, 5, 6].map(v => ({ value: v, label: num(v) })), p.daysPerWeek);
  /* target weight is meaningless when the goal is building muscle — hide it */
  const twField = field(`${t('targetWeight')} (${wUnit()})`, twIn);
  const syncTarget = () => {
    const hide = !usesTargetWeight({ goal: goalSel.value });
    twField.hidden = hide;
    twField.parentElement?.classList.toggle('one-col', hide);
  };
  goalSel.addEventListener('change', syncTarget);

  const dietIn = el('textarea', { class: 'input', rows: 3, value: p.diet,
    placeholder: getLang() === 'fa' ? 'آلرژی، غذاهایی که نمی‌خورید، ترجیحات…' : 'Allergies, foods you avoid, preferences…' });

  const body = el('div', {},
    field(t('name'), nameIn),
    el('div', { class: 'grid2' }, field(t('sex'), sexSel), field(t('age'), ageIn)),
    el('div', { class: 'grid2' }, field(`${t('height')} (${lUnit()})`, hIn), field(`${t('weight')} (${wUnit()})`, wIn)),
    el('div', { class: 'grid2' }, twField, field(t('daysPerWeek'), daysSel)),
    field(t('activity'), actSel),
    field(t('goalType'), goalSel),
    field(t('experience'), expSel),
    field(getLang() === 'fa' ? 'یادداشت تغذیه‌ای' : 'Diet notes', dietIn),
    el('button', { class: 'btn full', onclick: async () => {
      Object.assign(p, {
        name: nameIn.value.trim(),
        sex: sexSel.value,
        age: Math.max(10, Math.min(100, parseNum(ageIn.value) || 30)),
        height: round(dispToCm(parseNum(hIn.value)) || 175, 1),
        weight: round(dispToKg(parseNum(wIn.value)) || 75, 2),
        targetWeight: twField.hidden ? p.targetWeight : round(dispToKg(parseNum(twIn.value)) || 72, 2),
        activity: actSel.value, goal: goalSel.value,
        experience: expSel.value, daysPerWeek: Number(daysSel.value),
        diet: dietIn.value.trim(),
      });
      await saveProfile();
      const existing = await db.get('weights', todayKey());
      if (!existing) await db.put('weights', { date: todayKey(), kg: p.weight });
      if (S.goals.auto) await applyAutoGoals();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('profile'), body);
  syncTarget();
}

/* ---------------- goals ---------------- */

export function openGoals() {
  const g = S.goals;
  const sug = suggestGoals();
  const kc = input({ type: 'number', inputmode: 'numeric', value: g.kcal });
  const pr = input({ type: 'number', inputmode: 'numeric', value: g.protein });
  const cb = input({ type: 'number', inputmode: 'numeric', value: g.carbs });
  const ft = input({ type: 'number', inputmode: 'numeric', value: g.fat });
  const wt = input({ type: 'number', inputmode: 'numeric', value: g.water });

  const autoBox = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  autoBox.checked = !!g.auto;
  const setDisabled = () => [kc, pr, cb, ft, wt].forEach(i => { i.disabled = autoBox.checked; i.style.opacity = autoBox.checked ? '.55' : '1'; });
  autoBox.onchange = () => {
    setDisabled();
    if (autoBox.checked) { kc.value = sug.kcal; pr.value = sug.protein; cb.value = sug.carbs; ft.value = sug.fat; wt.value = sug.water; }
  };
  setDisabled();

  const body = el('div', {},
    el('div', { class: 'info' },
      el('div', { class: 'kv' }, el('span', {}, t('bmr')), el('b', {}, `${num(Math.round(bmr()))} ${t('kcal')}`)),
      el('div', { class: 'kv' }, el('span', {}, t('tdee')), el('b', {}, `${num(Math.round(tdee()))} ${t('kcal')}`)),
      el('div', { style: 'margin-top:8px' }, t('calcNote')),
    ),
    el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:16px;cursor:pointer' },
      autoBox, el('span', {}, t('autoCalc')),
      el('span', { class: 'muted', style: 'margin-inline-start:auto;font-size:var(--t-sm)' },
        `${num(sug.kcal)} ${t('kcal')}`)),
    field(t('calorieGoal'), kc),
    el('div', { class: 'grid3' },
      field(t('protein') + ' g', pr),
      field(t('carbs') + ' g', cb),
      field(t('fat') + ' g', ft)),
    field(t('waterGoal'), wt),
    el('button', { class: 'btn full', onclick: async () => {
      g.auto = autoBox.checked;
      if (g.auto) Object.assign(g, sug);
      else Object.assign(g, {
        kcal: Math.max(800, parseNum(kc.value)), protein: Math.max(0, parseNum(pr.value)),
        carbs: Math.max(0, parseNum(cb.value)), fat: Math.max(0, parseNum(ft.value)),
        water: Math.max(0, parseNum(wt.value)),
      });
      await saveGoals();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('goalsCalories'), body);
}

/* ---------------- AI settings ---------------- */

export function openAISettings() {
  const fa = getLang() === 'fa';
  let provider = S.settings.provider || 'gemini';

  /* --- shared controls --- */
  const keyIn = input({
    value: S.settings.apiKey, placeholder: fa ? 'کلید را اینجا بچسبانید' : 'paste your key', type: 'password',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    style: 'direction:ltr;font-family:monospace;font-size:var(--t-md)',
  });
  const showBtn = el('button', { class: 'chip', onclick: () => {
    keyIn.type = keyIn.type === 'password' ? 'text' : 'password';
  } }, '👁');
  const keepPhotos = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  keepPhotos.checked = S.settings.keepPhotos !== false;
  const status = el('div', { class: 'muted', style: 'margin-top:10px;text-align:center;min-height:20px;line-height:1.8' });

  /* --- gemini controls --- */
  const geminiModel = select(ai.GEMINI_MODELS, S.settings.model);

  /* --- openai-compatible controls --- */
  const urlIn = input({
    value: S.settings.baseUrl || '', placeholder: 'https://…/v1',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    style: 'direction:ltr;font-family:monospace;font-size:var(--t-sm)',
  });
  const modelIn = input({
    value: S.settings.model || '', placeholder: 'model-name',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    style: 'direction:ltr;font-family:monospace;font-size:var(--t-sm)',
  });
  const presetChips = el('div', { class: 'chips' });
  const modelChips = el('div', { class: 'chips' });

  const fillModels = (preset) => {
    modelChips.replaceChildren();
    (preset?.models || []).forEach(m => modelChips.append(
      el('button', { class: 'chip', onclick: () => { modelIn.value = m; } }, m)));
  };
  ai.ENDPOINT_PRESETS.forEach(p => {
    presetChips.append(el('button', { class: 'chip', onclick: () => {
      if (p.url) urlIn.value = p.url;
      if (p.models[0]) modelIn.value = p.models[0];
      fillModels(p);
    } }, p.label));
  });
  fillModels(ai.ENDPOINT_PRESETS.find(p => p.url && S.settings.baseUrl?.startsWith(p.url)));

  /* --- provider-specific panes --- */
  const proxyPane = el('div', {},
    el('div', { class: 'info' }, t('proxyHelp')),
    field(t('proxyUrl'), urlIn),
    field(t('model'), modelIn),
    el('div', { class: 'chips' },
      el('span', { class: 'chip on' }, '🔒 ' + t('noKeyNeeded'))),
    el('div', { class: 'info' }, t('proxySetup')),
  );

  const geminiPane = el('div', {},
    el('div', { class: 'info', html: '<ol style="margin:0;padding-inline-start:18px;line-height:2">' +
      (fa ? [
        'وارد <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a> شوید',
        'با حساب گوگل وارد شوید و روی «Create API key» بزنید',
        'کلید را کپی کرده و اینجا بچسبانید',
      ] : [
        'Open <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">aistudio.google.com/apikey</a>',
        'Sign in with Google and click “Create API key”',
        'Copy the key and paste it here',
      ]).map(s => `<li>${s}</li>`).join('') + '</ol>' }),
    el('div', { class: 'warn' }, fa
      ? 'اگر پیام «User location is not supported» گرفتید یا صفحه اصلاً باز نشد، یعنی سرویس از موقعیت شما در دسترس نیست. یا با VPN امتحان کنید، یا بالا «سازگار با OpenAI» را انتخاب کنید.'
      : 'If you see “User location is not supported”, this service is blocked from your region. Use a VPN, or switch to “OpenAI-compatible” above.'),
    field(t('model'), geminiModel),
  );

  const openaiPane = el('div', {},
    el('div', { class: 'info' }, fa
      ? 'هر سرویسی که endpoint سازگار با OpenAI بدهد اینجا کار می‌کند: OpenAI، OpenRouter، Groq، یک مدل محلی روی کامپیوتر خودتان (Ollama / LM Studio)، یا هر واسط داخلی. آدرس Base URL و نام مدل را از مستندات همان سرویس بردارید.'
      : 'Anything that exposes an OpenAI-compatible endpoint works here: OpenAI, OpenRouter, Groq, a local model on your own machine (Ollama / LM Studio), or any gateway. Take the base URL and model name from that provider’s docs.'),
    el('div', { class: 'field' }, el('label', {}, fa ? 'سرویس‌های آماده' : 'Presets'), presetChips),
    field('Base URL', urlIn),
    el('div', { class: 'field' },
      el('label', {}, t('model')),
      modelIn,
      el('div', { style: 'height:8px' }),
      modelChips),
    el('div', { class: 'warn' }, fa
      ? 'برای «اسکن عکس» مدل باید vision داشته باشد. اگر مدل عکس نخواند، دکمه‌ی «تست عکس» خطا می‌دهد — در آن حالت هم می‌توانید از «توصیف با متن» استفاده کنید.'
      : 'Photo scanning needs a vision-capable model. If “Test image” fails, you can still use “describe in words”.'),
  );

  const paneHost = el('div', {});
  const keyField = field(t('apiKey'),
    el('div', { style: 'display:flex;gap:8px;align-items:center' }, keyIn, showBtn));
  const syncPane = () => {
    paneHost.replaceChildren(
      provider === 'proxy' ? proxyPane : provider === 'openai' ? openaiPane : geminiPane);
    keyField.hidden = provider === 'proxy';     // the server holds it, not the phone
  };

  const provSeg = segmented(
    ai.PROVIDERS.map(p => ({ value: p.id, label: fa ? p.nameFa : p.name })),
    provider,
    (v) => { provider = v; syncPane(); status.textContent = ''; },
  );
  syncPane();

  /* --- current config from the form --- */
  const cfg = () => ({
    provider,
    key: provider === 'proxy' ? '' : keyIn.value.trim(),
    model: (provider === 'gemini' ? geminiModel.value : modelIn.value).trim(),
    baseUrl: urlIn.value.trim(),
  });

  const runTest = async (withImage) => {
    const c = cfg();
    if (provider !== 'proxy' && !c.key) return toast(t('noKey'), 'err');
    if (provider !== 'gemini' && !c.baseUrl) return toast(fa ? 'آدرس سرور خالی است' : 'Server URL is empty', 'err');
    status.style.color = 'var(--tx2)';
    status.textContent = t('loading');
    try {
      await (withImage ? ai.testVision(c) : ai.testKey(c));
      status.style.color = 'var(--acc)';
      status.textContent = '✅ ' + (withImage
        ? (fa ? 'مدل عکس را می‌خواند' : 'Model reads images')
        : t('done'));
    } catch (e) {
      status.style.color = 'var(--red)';
      status.textContent = '⚠️ ' + ai.aiErrorText(e);
    }
  };

  const body = el('div', {},
    el('div', { class: 'field' }, el('label', {}, t('provider')), provSeg),
    paneHost,
    keyField,
    el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px;cursor:pointer' },
      keepPhotos, el('span', {}, fa ? 'نگهداری عکس وعده‌ها روی دستگاه' : 'Keep meal photos on device')),
    el('div', { class: 'info' }, t('apiHelp')),
    status,
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn ghost', onclick: () => runTest(false) }, t('testKey')),
      el('button', { class: 'btn ghost', onclick: () => runTest(true) }, fa ? 'تست عکس' : 'Test image'),
    ),
    el('button', { class: 'btn full', style: 'margin-top:9px', onclick: async () => {
      const c = cfg();
      Object.assign(S.settings, {
        provider: c.provider, apiKey: c.key, model: c.model,
        baseUrl: c.baseUrl, keepPhotos: keepPhotos.checked,
      });
      await saveSettings();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('saveKey')),
    el('button', { class: 'btn ghost full', style: 'margin-top:9px', onclick: async () => {
      Object.assign(S.settings, { apiKey: '', baseUrl: '' });
      await saveSettings();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, fa ? 'پاک کردن کلید' : 'Clear key'),
  );
  sheet(t('aiSettings'), body);
}

/* ---------------- preferences ---------------- */

export function openPrefs() {
  const langSel = select([{ value: 'fa', label: 'فارسی' }, { value: 'en', label: 'English' }], S.settings.lang);
  const themeSel = select([
    { value: 'light', label: t('lightTheme') },
    { value: 'dark', label: t('dark') },
    { value: 'oled', label: t('themeOled') },
  ], S.settings.theme);
  const accentSel = select([
    { value: 'green', label: t('accentGreen') },
    { value: 'blue', label: t('accentBlue') },
    { value: 'orange', label: t('accentOrange') },
    { value: 'purple', label: t('accentPurple') },
    { value: 'teal', label: t('accentTeal') },
  ], S.settings.accent || 'green');
  accentSel.onchange = () => { S.settings.accent = accentSel.value; saveSettings(); applyTheme(); };
  const unitSel = select([{ value: 'metric', label: t('metric') }, { value: 'imperial', label: t('imperial') }], S.settings.units);
  const iconSel = select(
    ICON_STYLES.map((x) => ({ value: x.id, label: getLang() === 'fa' ? x.fa : x.en })),
    S.settings.iconStyle || 'flat');
  const restIn = input({ type: 'number', inputmode: 'numeric', value: S.settings.restDefault });
  const daySel = select([
    { value: 6, label: t('saturday') }, { value: 1, label: t('monday') }, { value: 0, label: t('sunday') },
  ], S.settings.firstDay);
  const fxBox = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  fxBox.checked = S.settings.fx !== false;

  /* Voice coach — strictly opt-in, and the switch speaks when it turns on. */
  const voiceBox = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  voiceBox.checked = !!S.settings.voice;
  voiceBox.onchange = () => {
    import('./voice.js').then(v => voiceBox.checked ? v.hello() : v.bye()).catch(() => {});
  };
  const voiceRow = el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:16px;cursor:pointer' },
    voiceBox, el('span', {}, t('voiceCoach')),
    el('span', { class: 'muted', style: 'font-size:var(--t-xs);margin-inline-start:auto;text-align:end;line-height:1.7' }, t('voiceCoachHint')));

  const guidesRow = el('button', {
    class: 'btn ghost full', style: 'margin-bottom:16px',
    onclick: async () => {
      const { resetIntros } = await import('./intro.js');
      await resetIntros();
      closeSheet();
      toast(t('guidesRestored'), 'ok');
    },
  }, lineIcon('book', { size: 16 }), t('showGuidesAgain'));
  /* Say how many are left, so the row means something before it is pressed. */
  import('./intro.js').then(async ({ introsLeft }) => {
    const n = await introsLeft();
    if (n) guidesRow.append(el('span', { class: 'muted', style: 'font-size:var(--t-xs)' },
      `· ${num(n)} ${t('guidesLeft')}`));
  }).catch(() => {});

  const body = el('div', {},
    field(t('language'), langSel),
    field(t('theme'), themeSel),
    field(t('accent'), accentSel),
    field(t('iconStyle'), iconSel),
    field(t('units'), unitSel),
    field(t('restTimerDefault'), restIn),
    field(t('firstDay'), daySel),
    el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:16px;cursor:pointer' },
      fxBox, el('span', {}, t('soundVibrate'))),
    voiceRow,
    /* Dismiss all five in the first minute and there was no way back. */
    guidesRow,
    el('button', { class: 'btn full', onclick: async () => {
      const langChanged = langSel.value !== S.settings.lang;
      Object.assign(S.settings, {
        lang: langSel.value, theme: themeSel.value, units: unitSel.value,
        iconStyle: iconSel.value,
        restDefault: Math.max(0, parseNum(restIn.value)), firstDay: Number(daySel.value),
        fx: fxBox.checked,
        voice: voiceBox.checked,
      });
      await saveSettings();
      setFx(S.settings.fx);
      if (!voiceBox.checked) { import('./voice.js').then(v => v.bye()).catch(() => {}); }
      applyTheme();
      if (langChanged) {
        setLang(S.settings.lang);
        window.dispatchEvent(new CustomEvent('lang-changed'));
      }
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  /* The app ships with a working AI service, so supplying your own key is a
     power-user option rather than something for the main menu. */
  body.append(
    el('hr', { class: 'sep' }),
    el('button', { class: 'btn ghost full', onclick: () => { closeSheet(); openAISettings(); } },
      t('aiSettings')),
  );
  sheet(t('preferences'), body);
}

/* ---------------- account ---------------- */

/**
 * Show the spinner for the length of one action and take it down again -
 * including when the action throws, which is exactly when a stuck spinner
 * would be most alarming.
 */
async function withLoader(text, fn) {
  loading(true, text);
  try { return await fn(); }
  finally { loading(false); }
}

/** Put an error where the person is already looking, in words they can act on. */
function showError(box, e) {
  box.textContent = acc.errorText(e, t);
  box.style.color = 'var(--red)';
}
const statusBox = () =>
  el('div', { class: 'muted', style: 'margin-top:10px;min-height:22px;line-height:1.8' });

export async function openAccount(mode = 'auto') {
  const sess = await acc.session();
  /* A token that ran out leaves the account behind so the form can come back
     with the username filled in: the person types a password, nothing else. */
  if (sess?.expired || (sess?.account && !sess.token)) {
    return openAuthForm('login', { username: sess.account?.username, note: t('accSignInAgain') });
  }
  if (mode === 'auto' && sess?.account) return openAccountHome(sess);
  return openAuthForm(mode === 'register' ? 'register' : 'login');
}

/** Signed in: what the account is for, and the two directions of sync. */
async function openAccountHome(sess) {
  const a = sess.account || {};
  const status = statusBox();
  const when = sess.lastSync
    ? new Date(sess.lastSync).toLocaleString(getLang() === 'fa' ? 'fa-IR' : 'en-GB')
    : t('accNever');

  const upload = async (force = false) => {
    try {
      await withLoader(t('accUploading'), () => acc.push({ force }));
      closeSheet();
      toast(t('accUploaded'), 'ok');
    } catch (e) {
      /* The account moved on somewhere else. Never resolve this quietly: one of
         the two copies is about to disappear and only the person knows which
         one matters. */
      if (e?.code === 'stale') {
        const yes = await confirmSheet(t('accConflictTitle'), t('accConflictBody'),
                                       { okLabel: t('accOverwrite') });
        if (yes) return upload(true);
        return openAccountHome(await acc.session());
      }
      showError(status, e);
    }
  };

  /* only offered while there is genuinely something to put back */
  const undoAt = await acc.undoAvailable();
  const undoRow = !undoAt ? null : el('div', { style: 'margin-top:14px' },
    el('div', { class: 'info' }, t('accUndoNote')),
    el('button', { class: 'btn ghost full', style: 'margin-top:9px', onclick: async () => {
      try {
        await withLoader(t('accWorking'), () => acc.undoPull());
        closeSheet(); toast(t('accUndone'), 'ok');
        location.reload();
      } catch (e) { showError(status, e); }
    } }, t('accUndo')));

  const body = el('div', {},
    el('div', { class: 'info' },
      el('div', { class: 'kv' }, el('span', {}, t('accName')), el('b', {}, `${a.first || ''} ${a.last || ''}`.trim() || '—')),
      el('div', { class: 'kv' }, el('span', {}, t('username')), el('b', { style: 'direction:ltr' }, a.username || '—')),
      el('div', { class: 'kv' }, el('span', {}, t('phone')), el('b', { style: 'direction:ltr' }, a.phone || '—')),
      el('div', { class: 'kv' }, el('span', {}, t('accLastSync')), el('b', {}, when))),

    el('div', { class: 'info', style: 'margin-top:12px' }, t('accSyncNote')),

    el('button', { class: 'btn full', style: 'margin-top:14px', onclick: () => upload(false) },
      t('accUpload')),

    el('button', { class: 'btn ghost full', style: 'margin-top:9px', onclick: async () => {
      /* pulling replaces this device's diary, so never do it without asking */
      if (!await confirmSheet(t('accDownload'), t('accDownloadWarn'))) return;
      try {
        const res = await withLoader(t('accDownloading'), () => acc.pull());
        closeSheet();
        toast(res.restored ? t('accDownloaded') : t('accNothingThere'), 'ok');
        window.dispatchEvent(new CustomEvent('data-changed'));
        if (res.restored) location.reload();
      } catch (e) { showError(status, e); }
    } }, t('accDownload')),

    status,
    undoRow,

    el('button', { class: 'btn ghost full', style: 'margin-top:16px', onclick: async () => {
      if (!await confirmSheet(t('accSignOut'), t('accSignOutNote'))) return;
      await acc.signOut();
      closeSheet(); toast(t('done'), 'ok');
    } }, t('accSignOut')),

    el('button', { class: 'btn ghost danger full', style: 'margin-top:9px', onclick: async () => {
      if (!await confirmSheet(t('accDelete'), t('accDeleteWarn'), { okLabel: t('accDelete') })) {
        return openAccountHome(await acc.session());
      }
      try {
        await withLoader(t('accWorking'), () => acc.deleteAccount());
        closeSheet(); toast(t('accDeleted'), 'ok');
      } catch (e) { showError(status, e); }
    } }, t('accDelete')),
  );
  sheet(t('account'), body);
}

/**
 * The recovery code, shown once.
 *
 * There is no email address on file to send a reset link to - that was a
 * deliberate choice about what to collect - so this code is the only way back
 * into an account whose password is forgotten. It is worth an interruption.
 */
function showRecoveryCode(code, after) {
  const copy = el('button', { class: 'btn ghost full', style: 'margin-top:12px',
    onclick: async () => {
      try {
        await navigator.clipboard.writeText(code);
        toast(t('accRecoveryCopied'), 'ok');
      } catch {
        /* clipboard access is refused in some WebViews; the code is on screen
           and selectable either way, so say nothing alarming */
        getSelection()?.selectAllChildren(shown);
      }
    } }, t('accRecoveryCopy'));

  const shown = el('div', {
    style: 'direction:ltr;text-align:center;font:700 20px/1.9 ui-monospace,monospace;'
         + 'letter-spacing:.09em;user-select:all;padding:14px;border-radius:var(--r-md);'
         + 'background:var(--bg2);border:1px solid var(--line);margin-top:6px',
    text: code,
  });

  sheet(t('accRecoveryTitle'), el('div', {},
    el('div', { class: 'info' }, t('accRecoveryIntro')),
    shown,
    copy,
    el('button', { class: 'btn full', style: 'margin-top:16px',
      onclick: () => { closeSheet(); after?.(); } }, t('accRecoverySaved')),
  ));
}

/** Registration and sign-in, in one sheet with a switch between them. */
function openAuthForm(start, { username = '', note = '' } = {}) {
  let mode = start;

  const first = input({ placeholder: getLang() === 'fa' ? 'پرهام' : 'Parham' });
  const last = input({ placeholder: getLang() === 'fa' ? 'روزمند' : 'Rouzmand' });
  const user = input({ placeholder: 'parham89', autocapitalize: 'off', spellcheck: 'false',
                       value: username, style: 'direction:ltr' });
  const phone = input({ type: 'tel', inputmode: 'tel', placeholder: '09121234567',
                        style: 'direction:ltr' });
  const pass = input({ type: 'password', autocomplete: 'off', placeholder: '••••••••' });

  const regOnly = el('div', {},
    el('div', { class: 'grid2' }, field(t('firstName'), first), field(t('lastName'), last)),
    field(t('phone'), phone));

  const status = statusBox();
  if (note) status.textContent = note;
  const submit = el('button', { class: 'btn full', style: 'margin-top:14px' });
  const swap = el('button', { class: 'btn ghost full', style: 'margin-top:9px' });
  const forgot = el('button', { class: 'btn link full', style: 'margin-top:4px',
    onclick: () => openResetForm(user.value.trim()) }, t('accForgot'));

  const sync = () => {
    const reg = mode === 'register';
    regOnly.hidden = !reg;
    forgot.hidden = reg;
    submit.textContent = reg ? t('accCreate') : t('accSignIn');
    swap.textContent = reg ? t('accHaveAccount') : t('accNoAccount');
    status.textContent = '';
  };
  swap.onclick = () => { mode = mode === 'register' ? 'login' : 'register'; sync(); };

  submit.onclick = async () => {
    status.style.color = 'var(--tx2)';
    try {
      if (mode === 'register') {
        const res = await withLoader(t('accWorking'), () => acc.register({
          first: first.value.trim(), last: last.value.trim(),
          username: user.value.trim(), phone: phone.value.trim(), password: pass.value,
        }));
        toast(t('accWelcome'), 'ok');
        /* The code comes before the account screen: it is never retrievable
           later. A server that predates recovery codes simply sends none, and
           the person goes straight through rather than meeting an empty box. */
        if (res.recoveryCode) {
          return showRecoveryCode(res.recoveryCode,
            async () => openAccountHome(await acc.session()));
        }
      }
      await withLoader(t('accWorking'), () =>
        acc.login({ username: user.value.trim(), password: pass.value }));
      toast(t('accWelcome'), 'ok');
      /* a fresh sign-in on a second device is exactly when the diary should
         come down, so offer it rather than leaving the person to find it */
      openAccountHome(await acc.session());
    } catch (e) { showError(status, e); }
  };

  const body = el('div', {},
    el('div', { class: 'info' }, t('accWhy')),
    regOnly,
    field(t('username'), user),
    field(t('password'), pass),
    submit, swap, forgot, status,
  );
  sheet(t('account'), body);
  sync();
}

/** A forgotten password, answered with the code given at registration. */
function openResetForm(username = '') {
  const user = input({ value: username, autocapitalize: 'off', spellcheck: 'false',
                       style: 'direction:ltr' });
  const code = input({ placeholder: 'XXXX-XXXX-XXXX-XXXX', autocapitalize: 'characters',
                       spellcheck: 'false', style: 'direction:ltr;letter-spacing:.05em' });
  const pass = input({ type: 'password', autocomplete: 'off', placeholder: '••••••••' });
  const status = statusBox();

  const body = el('div', {},
    el('div', { class: 'info' }, t('accRecoveryIntro')),
    field(t('username'), user),
    field(t('accRecoveryCode'), code),
    field(t('accNewPassword'), pass),
    el('button', { class: 'btn full', style: 'margin-top:14px', onclick: async () => {
      try {
        const res = await withLoader(t('accWorking'), () => acc.resetPassword({
          username: user.value.trim(), recoveryCode: code.value, password: pass.value,
        }));
        toast(t('accResetDone'), 'ok');
        /* the used code is dead now, so hand over the replacement at once */
        showRecoveryCode(res.recoveryCode, async () => openAccountHome(await acc.session()));
      } catch (e) { showError(status, e); }
    } }, t('accResetDo')),
    el('button', { class: 'btn ghost full', style: 'margin-top:9px',
      onclick: () => openAuthForm('login', { username: user.value.trim() }) }, t('accSignIn')),
    status,
  );
  sheet(t('accResetTitle'), body);
}

/* ---------------- reminders ---------------- */

export async function openReminders() {
  const cfg = await rem.load();
  const body = el('div', {});

  if (!rem.available()) {
    /* Say why rather than showing switches that would do nothing: a web page
       cannot fire a notification at a time when it is closed. */
    body.append(
      el('div', { class: 'warn' }, t('remindersNeedApp')),
      el('button', { class: 'btn ghost full', onclick: () => closeSheet() }, t('ok')));
    sheet(t('reminders'), body);
    return;
  }

  const master = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  master.checked = !!cfg.enabled;

  const rows = el('div', { style: 'margin-top:4px' });
  const inputs = {};
  for (const slot of rem.SLOTS) {
    const conf = cfg.slots[slot.key] || {};
    const on = el('input', { type: 'checkbox', style: 'width:18px;height:18px;accent-color:var(--acc)' });
    on.checked = !!conf.on;
    const time = input({ type: 'time', value: conf.time || '08:00' });
    time.style.maxWidth = '130px';
    inputs[slot.key] = { on, time };

    rows.append(el('label', {
      style: 'display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid var(--line)',
    },
      on,
      el('span', { style: 'flex:1' },
        slot.key === 'weighIn' ? t('weighInWeekly') : t(slot.key)),
      time));
  }

  const status = el('div', { class: 'muted', style: 'margin-top:12px;font-size:var(--t-sm)' });
  const sync = () => { rows.style.opacity = master.checked ? '1' : '.45'; };
  master.onchange = sync; sync();

  body.append(
    el('div', { class: 'info' }, t('remindersWhy')),
    el('label', { style: 'display:flex;align-items:center;gap:10px;margin:14px 0 2px;cursor:pointer' },
      master, el('b', {}, t('remindersOn'))),
    rows,
    status,
    el('button', { class: 'btn full', style: 'margin-top:16px', onclick: async () => {
      const next = { enabled: master.checked, slots: {} };
      for (const slot of rem.SLOTS) {
        next.slots[slot.key] = {
          on: inputs[slot.key].on.checked,
          time: inputs[slot.key].time.value || '08:00',
        };
      }
      await rem.save(next);
      const res = await rem.apply(next);
      if (res.reason === 'denied') {
        status.textContent = t('remindersDenied');
        status.style.color = 'var(--red)';
        return;
      }
      closeSheet();
      toast(res.scheduled ? t('remindersSet') : t('saved'), 'ok');
    } }, t('save')),
  );
  sheet(t('reminders'), body);
}

export function applyTheme() {
  /* The icon language rides with the theme: both are "how the app looks",
     both are read at boot and after every save, and one path cannot fall
     out of step with the other. */
  setIconStyle(S.settings.iconStyle || 'flat');
  const theme = S.settings.theme;
  document.documentElement.dataset.theme =
    theme === 'light' ? 'light' : theme === 'oled' ? 'oled' : 'dark';
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', theme === 'light' ? '#f4f6f9' : theme === 'oled' ? '#000000' : '#0b0d10');
  /* the person's accent, if they picked one — one variable recolours the app */
  const ACCENTS = {
    green: null,                                    // the built-in default
    blue: '#4c9df8', orange: '#ff9f43',
    purple: '#a78bfa', teal: '#2dd4bf',
  };
  const acc = ACCENTS[S.settings.accent];
  if (acc) {
    document.documentElement.style.setProperty('--acc', acc);
    document.documentElement.style.setProperty('--acc-d', `color-mix(in oklab, ${acc} 82%, #000)`);
  } else {
    document.documentElement.style.removeProperty('--acc');
    document.documentElement.style.removeProperty('--acc-d');
  }
}

/* ---------------- backup ---------------- */

export async function openBackup() {
  const photoCount = (await db.count('photos')) + (await db.count('bodyPhotos'));
  const fa = getLang() === 'fa';
  let est = '';
  try {
    const q = await navigator.storage?.estimate?.();
    if (q?.usage) est = `${(q.usage / 1048576).toFixed(1)} MB`;
  } catch {}

  const withPhotos = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  const sizeLabel = el('span', { class: 'muted', style: 'margin-inline-start:auto;font-size:var(--t-sm)' });

  const refreshSize = async () => {
    const bytes = await db.exportSize({ photos: withPhotos.checked });
    sizeLabel.textContent = `${t('estSize')}: ${(bytes / 1048576).toFixed(1)} MB`;
  };
  withPhotos.onchange = refreshSize;
  refreshSize();

  const step = (n, txt) => el('div', { class: 'move-step' },
    el('i', {}, num(n)), el('span', {}, txt));

  const body = el('div', {},
    el('div', { class: 'info' },
      el('div', { class: 'kv' }, el('span', {}, t('storageUsed')), el('b', {}, est || '—')),
      el('div', { class: 'kv' }, el('span', {}, t('photosStored')), el('b', {}, num(photoCount))),
    ),

    el('div', { class: 'card-head', style: 'margin-top:16px' }, el('h3', {}, t('whereData'))),
    el('div', { class: 'info' }, t('whereDataText')),

    el('div', { class: 'card-head', style: 'margin-top:16px' }, el('h3', {}, t('moveDevice'))),
    el('div', { class: 'move-list' },
      step(1, t('moveStep1')), step(2, t('moveStep2')), step(3, t('moveStep3'))),

    photoCount ? el('label', { style: 'display:flex;align-items:center;gap:10px;margin:14px 0;cursor:pointer' },
      withPhotos, el('span', {}, t('includePhotos')), sizeLabel) : sizeLabel,

    el('button', { class: 'btn full', style: 'margin-bottom:10px',
      onclick: () => exportBackup({ photos: withPhotos.checked } ) },
      lineIcon('download', { size: 17 }), t('exportData')),
    el('button', { class: 'btn ghost full', style: 'margin-bottom:10px',
      onclick: () => $('#file-import').click() },
      lineIcon('upload', { size: 17 }), t('importData')),

    el('div', { class: 'warn' }, t('autoBackupTip')),
    el('hr', { class: 'sep' }),
    photoCount ? el('button', { class: 'btn ghost full', style: 'margin-bottom:10px', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('confirmDelete'), `${num(photoCount)} ${t('photosStored')}`)) {
        await db.clear('photos'); await db.clear('bodyPhotos'); toast(t('deleted'));
        window.dispatchEvent(new CustomEvent('data-changed'));
      }
    } }, fa ? 'پاک کردن عکس‌ها' : 'Delete stored photos') : null,
    el('button', { class: 'btn danger ghost full', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('wipe'), t('wipeConfirm'))) {
        await db.wipeAll();
        toast(t('deleted'));
        setTimeout(() => location.reload(), 700);
      }
    } }, t('wipe')),
  );
  sheet(t('backupRestore'), body);
}

export async function exportBackup({ photos = false } = {}) {
  loading(true, t('loading'));
  try {
    const data = await db.exportAll({ photos });
    // never write the API key into a file the user might share
    const s = data.meta?.find(m => m.k === 'settings');
    if (s?.v) s.v = { ...s.v, apiKey: '' };
    const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = el('a', { href: url, download: `fityar-${todayKey()}.json` });
    document.body.append(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    loading(false);
    toast(`${t('done')} · ${(blob.size / 1048576).toFixed(1)} MB`, 'ok');
  } catch (e) {
    loading(false);
    toast(t('error') + ': ' + e.message, 'err');
  }
}

export function initImportInput() {
  $('#file-import').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    let data;
    try { data = JSON.parse(await file.text()); }
    catch { return toast(t('error'), 'err'); }
    if (data?._app !== 'fityar') return toast(t('error'), 'err');

    const counts = Object.entries(data).filter(([k, v]) => Array.isArray(v) && v.length)
      .map(([k, v]) => `${k}: ${v.length}`).join(' · ');
    const keepSettings = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
    keepSettings.checked = true;
    const body = el('div', {},
      el('div', { class: 'info' }, counts || '—'),
      el('div', { class: 'warn' }, t('importWarn')),
      el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:14px;cursor:pointer' },
        keepSettings, el('span', {}, t('keepMySettings'))),
      el('button', { class: 'btn full', style: 'margin-bottom:10px',
        onclick: () => doImport(data, true, keepSettings.checked) }, t('importMerge')),
      el('button', { class: 'btn danger ghost full',
        onclick: () => doImport(data, false, keepSettings.checked) }, t('importReplace')),
    );
    sheet(t('importData'), body);
  });
}

async function doImport(data, merge, keepSettings = true) {
  closeSheet();
  loading(true);
  try {
    const mine = { ...S.settings };
    await db.importAll(data, { merge });
    if (keepSettings) {
      /* the file must never be able to repoint this device's AI endpoint */
      await db.metaSet('settings', mine);
    } else {
      const s = await db.metaGet('settings', {});
      if (!s.apiKey && mine.apiKey) await db.metaSet('settings', { ...s, apiKey: mine.apiKey });
    }
    loading(false);
    toast(t('done'), 'ok');
    setTimeout(() => location.reload(), 600);
  } catch (e) {
    loading(false);
    toast(t('error') + ': ' + e.message, 'err');
  }
}

/* ---------------- about ---------------- */

/** Which engine answers, in words a non-technical reader can check. */
function aiLabel() {
  const p = S.settings.provider;
  if (p === 'proxy') return getLang() === 'fa' ? 'سرویس داخلی اپ' : 'the app’s own service';
  if (p === 'gemini') return 'Google Gemini';
  return getLang() === 'fa' ? 'سرویس شخصی شما' : 'your own service';
}


export function openAbout() {
  const body = el('div', {},
    el('div', { style: 'text-align:center;margin-bottom:18px' },
      el('div', { style: 'font-size:var(--t-5xl);margin-bottom:6px' }, '💪'),
      el('h3', { style: 'font-size:var(--t-2xl)' }, 'FitYar'),
      el('div', { class: 'muted' }, 'v1.0'),
    ),
    el('div', { class: 'info' }, t('aboutText')),
    el('div', { class: 'info' }, t('installTip')),
    el('div', { class: 'warn' }, t('disclaimer')),
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'داده‌های شما' : 'Your data'), el('b', {}, t('dataStays'))),
    /* name whichever engine is actually configured — it was hard-coded to
       Gemini, which stopped being true the day the proxy arrived */
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'هوش مصنوعی' : 'AI'),
      el('b', {}, hasAI() ? aiLabel() : t('aiOff'))),
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'حالت آفلاین' : 'Offline'), el('b', {}, t('offlineReady'))),
    el('a', { class: 'btn ghost', style: 'display:block;text-align:center;margin-top:14px',
              href: './privacy.html', target: '_blank', rel: 'noopener' }, t('privacyLink')),
  );
  sheet(t('about'), body);
}
