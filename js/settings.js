/* ============ Settings screens: profile, goals, AI, preferences, backup ============ */
import * as db from './db.js';
import {
  S, saveSettings, saveProfile, saveGoals, suggestGoals, applyAutoGoals,
  bmr, tdee, kgToDisp, dispToKg, wUnit, cmToDisp, dispToCm, lUnit, usesTargetWeight,
} from './store.js';
import { t, num, setLang, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, loading, field, input, select,
  segmented, round, parseNum, todayKey, setFx,
} from './ui.js';
import * as ai from './ai.js';

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
      el('span', { class: 'muted', style: 'margin-inline-start:auto;font-size:11.5px' },
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
    style: 'direction:ltr;font-family:monospace;font-size:13px',
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
    style: 'direction:ltr;font-family:monospace;font-size:12.5px',
  });
  const modelIn = input({
    value: S.settings.model || '', placeholder: 'model-name',
    autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false',
    style: 'direction:ltr;font-family:monospace;font-size:12.5px',
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
  const syncPane = () => paneHost.replaceChildren(provider === 'openai' ? openaiPane : geminiPane);

  const provSeg = segmented(
    ai.PROVIDERS.map(p => ({ value: p.id, label: fa ? p.nameFa : p.name })),
    provider,
    (v) => { provider = v; syncPane(); status.textContent = ''; },
  );
  syncPane();

  /* --- current config from the form --- */
  const cfg = () => ({
    provider,
    key: keyIn.value.trim(),
    model: (provider === 'openai' ? modelIn.value : geminiModel.value).trim(),
    baseUrl: urlIn.value.trim(),
  });

  const runTest = async (withImage) => {
    const c = cfg();
    if (!c.key) return toast(t('noKey'), 'err');
    if (provider === 'openai' && !c.baseUrl) return toast(fa ? 'Base URL خالی است' : 'Base URL is empty', 'err');
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
    field(t('apiKey'), el('div', { style: 'display:flex;gap:8px;align-items:center' }, keyIn, showBtn)),
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
  const themeSel = select([{ value: 'dark', label: t('dark') }, { value: 'light', label: t('lightTheme') }], S.settings.theme);
  const unitSel = select([{ value: 'metric', label: t('metric') }, { value: 'imperial', label: t('imperial') }], S.settings.units);
  const restIn = input({ type: 'number', inputmode: 'numeric', value: S.settings.restDefault });
  const daySel = select([
    { value: 6, label: t('saturday') }, { value: 1, label: t('monday') }, { value: 0, label: t('sunday') },
  ], S.settings.firstDay);
  const fxBox = el('input', { type: 'checkbox', style: 'width:19px;height:19px;accent-color:var(--acc)' });
  fxBox.checked = S.settings.fx !== false;

  const body = el('div', {},
    field(t('language'), langSel),
    field(t('theme'), themeSel),
    field(t('units'), unitSel),
    field(t('restTimerDefault'), restIn),
    field(t('firstDay'), daySel),
    el('label', { style: 'display:flex;align-items:center;gap:10px;margin-bottom:16px;cursor:pointer' },
      fxBox, el('span', {}, t('soundVibrate'))),
    el('button', { class: 'btn full', onclick: async () => {
      const langChanged = langSel.value !== S.settings.lang;
      Object.assign(S.settings, {
        lang: langSel.value, theme: themeSel.value, units: unitSel.value,
        restDefault: Math.max(0, parseNum(restIn.value)), firstDay: Number(daySel.value),
        fx: fxBox.checked,
      });
      await saveSettings();
      setFx(S.settings.fx);
      applyTheme();
      if (langChanged) {
        setLang(S.settings.lang);
        window.dispatchEvent(new CustomEvent('lang-changed'));
      }
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('preferences'), body);
}

export function applyTheme() {
  document.documentElement.dataset.theme = S.settings.theme === 'light' ? 'light' : 'dark';
  document.querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', S.settings.theme === 'light' ? '#f4f6f9' : '#0b0d10');
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
  const sizeLabel = el('span', { class: 'muted', style: 'margin-inline-start:auto;font-size:11.5px' });

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
      onclick: () => exportBackup({ photos: withPhotos.checked }) }, '⬇ ' + t('exportData')),
    el('button', { class: 'btn ghost full', style: 'margin-bottom:10px',
      onclick: () => $('#file-import').click() }, '⬆ ' + t('importData')),

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

export function openAbout() {
  const body = el('div', {},
    el('div', { style: 'text-align:center;margin-bottom:18px' },
      el('div', { style: 'font-size:34px;margin-bottom:6px' }, '💪'),
      el('h3', { style: 'font-size:19px' }, 'FitYar'),
      el('div', { class: 'muted' }, 'v1.0'),
    ),
    el('div', { class: 'info' }, t('aboutText')),
    el('div', { class: 'info' }, t('installTip')),
    el('div', { class: 'warn' }, t('disclaimer')),
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'ذخیره‌سازی' : 'Storage'), el('b', {}, 'IndexedDB (local)')),
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'هوش مصنوعی' : 'AI'), el('b', {}, 'Google Gemini')),
    el('div', { class: 'kv' }, el('span', {}, getLang() === 'fa' ? 'حالت آفلاین' : 'Offline'), el('b', {}, t('offlineReady'))),
  );
  sheet(t('about'), body);
}
