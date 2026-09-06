/* ============ FitYar — app shell, router, wiring ============ */
import * as db from './db.js';
import { S, load as loadStore, MEAL_KEYS, MEAL_ICON, kgToDisp, wUnit, hasAI, fiberGoal } from './store.js';
import { t, num, setLang, applyDom, getLang, pick } from './i18n.js';
import {
  $, $$, el, sheet, closeSheet, toast, loading, round, sum, clamp,
  todayKey, dateKey, addDays, dateLabel, longDate, shortDate, keyToDate, setFx, buzz,
} from './ui.js';
import * as nut from './nutrition.js';
import * as wk from './workouts.js';
import * as prog from './progress.js';
import * as st from './settings.js';
import * as plan from './plan.js';
import * as wiz from './wizard.js';
import * as rep from './report.js';
import { targetsCard } from './targets.js';
import { emptyArt, ART } from './art.js';
import * as coach from './coach.js';
import * as tools from './tools.js';
import * as meals from './meals.js';
import * as barcode from './barcode.js';

/* ---------------- router ---------------- */

const SCREENS = ['home', 'diary', 'train', 'progress', 'more', 'plan', 'program', 'reports'];
const TITLES = {
  home: 'appName', diary: 'navDiary', train: 'navTrain',
  progress: 'navProgress', more: 'navMore', plan: 'aiPlan',
  program: 'yourProgram', reports: 'dayReports',
};
let current = 'home';
let bootDay = todayKey();
const stack = [];

export function go(screen, { push = true } = {}) {
  if (!SCREENS.includes(screen)) screen = 'home';
  if (push && current !== screen && !['home', 'diary', 'train', 'progress', 'more'].includes(screen)) {
    stack.push(current);
  }
  if (['home', 'diary', 'train', 'progress', 'more'].includes(screen)) stack.length = 0;

  current = screen;
  SCREENS.forEach(s => { const n = $('#screen-' + s); if (n) n.hidden = s !== screen; });
  $$('#tabbar .tab').forEach(b => b.classList.toggle('active', b.dataset.screen === screen));
  $('#tb-title').textContent = t(TITLES[screen] || 'appName');
  $('#tb-back').hidden = !stack.length;
  $('#main').scrollTop = 0;
  window.scrollTo(0, 0);
  refresh();
}

function back() {
  const prev = stack.pop();
  go(prev || 'home', { push: false });
}

/* ---------------- refresh ---------------- */

let refreshing = false;
export async function refresh() {
  if (refreshing) return;
  refreshing = true;
  try {
    $('#tb-title').textContent = t(TITLES[current] || 'appName');
    if (current === 'home') await renderHome();
    else if (current === 'diary') await nut.renderDiary();
    else if (current === 'train') await renderTrain();
    else if (current === 'progress') await renderProgress();
    else if (current === 'more') await renderMore();
    else if (current === 'plan') await plan.renderPlan();
    else if (current === 'program') await wiz.renderProgram();
    else if (current === 'reports') await rep.renderReports();
  } catch (e) {
    console.error(e);
    toast(t('error') + ': ' + e.message, 'err');
  } finally {
    refreshing = false;
  }
}

/* ---------------- HOME ---------------- */

async function renderHome() {
  /* Home is always today. Browsing other days happens in the diary or the
     history, so the quick-add buttons here can never land on the wrong date. */
  S.date = todayKey();
  $('#today-label').textContent = longDate(S.date);
  const days = (await rep.historyDates()).length;
  $('#history-count').textContent = days ? `· ${num(days)}` : '';

  const { kcal, protein, carbs, fat, fiber, burned, logs } = await nut.daySummary(S.date);
  const g = S.goals;
  const left = Math.round(g.kcal - kcal + burned);
  const pct = clamp((kcal - burned) / Math.max(1, g.kcal), 0, 1.3);

  $('#kcal-goal').textContent = num(g.kcal);
  $('#kcal-eaten').textContent = num(kcal);
  $('#kcal-burned').textContent = num(burned);
  const leftEl = $('#kcal-left');
  leftEl.textContent = num(Math.abs(left));
  leftEl.nextElementSibling.textContent = left >= 0 ? t('kcalLeft') : t('overBy');

  const ring = $('#kcal-ring');
  const C = 2 * Math.PI * 52;
  ring.style.strokeDasharray = C;
  ring.style.strokeDashoffset = C * (1 - Math.min(pct, 1));
  ring.style.stroke = pct > 1 ? 'var(--red)' : pct > 0.85 ? 'var(--orange)' : 'var(--acc)';

  /* macros */
  const mg = $('#macro-grid');
  mg.replaceChildren();
  const macros = [
    { cls: 'm-p',  key: 'protein', v: protein, goal: g.protein },
    { cls: 'm-c',  key: 'carbs',   v: carbs,   goal: g.carbs },
    { cls: 'm-f',  key: 'fat',     v: fat,     goal: g.fat },
    { cls: 'm-fi', key: 'fiber',   v: fiber,   goal: fiberGoal() },
  ];
  macros.forEach(m => {
    const p = clamp(m.v / Math.max(1, m.goal), 0, 1);
    mg.append(el('div', { class: 'macro ' + m.cls },
      el('div', { class: 'bar' }, el('i', { style: `width:${p * 100}%` })),
      el('b', {}, `${num(Math.round(m.v))}/${num(Math.round(m.goal))}`),
      el('span', {}, t(m.key)),
    ));
  });

  /* water */
  const ml = await nut.getWater(S.date);
  const goalMl = g.water || 2500;
  $('#water-sum').textContent = `${num(ml)} / ${num(goalMl)} ml`;
  const cups = $('#water-cups');
  cups.replaceChildren();
  const total = Math.ceil(goalMl / 250);
  const on = Math.round(ml / 250);
  for (let i = 0; i < Math.max(total, on); i++) {
    cups.append(el('div', { class: 'cup' + (i < on ? ' on' : '') }));
  }

  /* today's session, then what you need in a day */
  $('#home-today').replaceChildren(await coach.todayCard());
  $('#home-targets').replaceChildren(targetsCard());

  /* meals */
  const mh = $('#home-meals');
  mh.replaceChildren();
  let any = false;
  for (const mk of MEAL_KEYS) {
    const items = logs.filter(l => l.meal === mk);
    if (!items.length) continue;
    any = true;
    mh.append(el('div', { class: 'kv meal-kv', dataset: { meal: mk }, onclick: () => go('diary') },
      el('span', {}, `${MEAL_ICON[mk]} ${t(mk)}`),
      el('b', {}, `${num(Math.round(sum(items, x => x.kcal)))} ${t('kcal')}`)));
  }
  if (!any) mh.append(emptyArt('plate', t('empty'),
    getLang() === 'fa' ? 'اولین وعده‌ات را ثبت کن' : 'Log your first meal', 'var(--orange)'));

  /* workouts */
  const hs = await wk.allWorkouts();
  const wh = $('#home-workouts');
  wh.replaceChildren();
  if (!hs.length) wh.append(emptyArt('dumbbell', t('empty'),
    getLang() === 'fa' ? 'هنوز تمرینی ثبت نشده' : 'No workout logged yet', 'var(--blue)'));
  hs.slice(0, 3).forEach(w => wh.append(el('div', { class: 'kv', onclick: () => wk.showWorkoutDetail(w) },
    el('span', {}, `${w.name} · ${shortDate(w.date)}`),
    el('b', {}, `${num(Math.round(kgToDisp(w.volume || 0)))} ${wUnit()}`))));
}

/* ---------------- TRAIN ---------------- */

let trainTab = 'routines';
async function renderTrain() {
  $$('#train-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === trainTab));
  $('#tab-routines').hidden = trainTab !== 'routines';
  $('#tab-history').hidden = trainTab !== 'history';
  $('#tab-exercises').hidden = trainTab !== 'exercises';
  if (trainTab === 'routines') await wk.renderRoutines();
  else if (trainTab === 'history') await wk.renderHistory();
  else await wk.renderExerciseList();
}

/* ---------------- PROGRESS ---------------- */

let progTab = 'body';
async function renderProgress() {
  $$('#prog-seg .seg-btn').forEach(b => b.classList.toggle('active', b.dataset.tab === progTab));
  $('#ptab-body').hidden = progTab !== 'body';
  $('#ptab-nutri').hidden = progTab !== 'nutri';
  $('#ptab-strength').hidden = progTab !== 'strength';
  $('#ptab-reports').hidden = progTab !== 'reports';
  if (progTab === 'body') {
    $('#week-review').replaceChildren(await coach.weekReviewCard());
    await prog.renderBody();
    await tools.renderPhotoStrip($('#photo-host'));
  }
  else if (progTab === 'nutri') await prog.renderNutriTrends();
  else if (progTab === 'reports') await prog.renderReportsInline();
  else await prog.renderStrength();
}

/* ---------------- MORE ---------------- */

async function renderMore() {
  const p = S.profile;
  const nm = p.name || (getLang() === 'fa' ? 'کاربر' : 'You');
  $('#profile-name').textContent = nm;
  $('#avatar').textContent = nm.trim().charAt(0).toUpperCase() || '?';
  $('#profile-sub').textContent =
    `${num(p.age)} ${getLang() === 'fa' ? 'سال' : 'yr'} · ${num(round(kgToDisp(p.weight), 1), 1)} ${wUnit()} · ${t(p.goal)}`;
  $('#api-dot').classList.toggle('on', hasAI());
}

/* ---------------- wiring ---------------- */

function wire() {
  /* tab bar */
  $$('#tabbar .tab').forEach(b => b.onclick = () => { buzz(12); go(b.dataset.screen); });
  $('#tb-back').onclick = back;

  /* home quick actions */
  $('#q-photo').onclick = () => nut.openPhotoScan(guessMeal());
  $('#q-food').onclick  = () => nut.openAddMenu(guessMeal());
  $('#q-train').onclick = () => { if (wk.session.active) wk.openSessionView(); else go('train'); };
  $('#go-diary').onclick = () => go('diary');
  $('#home-history').onclick = () => { progTab = 'reports'; go('progress'); };
  $('#go-train').onclick = () => { trainTab = 'history'; go('train'); };

  /* water */
  $('#water-plus').onclick  = async () => { await nut.addWater(S.date, 250); refresh(); buzz(15); };
  $('#water-minus').onclick = async () => { await nut.addWater(S.date, -250); refresh(); };

  /* diary date nav */
  $('#d-prev').onclick = () => { S.date = addDays(S.date, -1); refresh(); };
  $('#d-next').onclick = () => {
    const next = addDays(S.date, 1);
    if (next > todayKey()) return;      // nothing to log for a day that has not happened
    S.date = next; refresh();
  };
  $('#d-label').onclick = () => openDatePicker();
  $('#d-history').onclick = () => { progTab = 'reports'; go('progress'); };
  $('#day-note').addEventListener('change', async (e) => {
    await db.put('notes', { date: S.date, text: e.target.value });
  });

  /* train tabs */
  $$('#train-seg .seg-btn').forEach(b => b.onclick = () => { trainTab = b.dataset.tab; renderTrain(); });
  $('#start-empty').onclick = () => wk.startWorkout(null);
  $('#new-routine').onclick = () => wk.openRoutineEditor(null);
  $('#open-wizard').onclick = () => wiz.openWizard();
  $('#ex-search').addEventListener('input', () => wk.renderExerciseList());
  $('#add-exercise').onclick = () => wk.openCreateExercise();

  /* progress tabs */
  $$('#prog-seg .seg-btn').forEach(b => b.onclick = () => { progTab = b.dataset.tab; renderProgress(); });
  $('#log-weight').onclick = () => prog.openWeightLog();
  $('#log-measure').onclick = () => prog.openMeasureLog();

  /* more */
  $('#edit-profile').onclick = () => st.openProfile();
  $('#profile-card').onclick = (e) => { if (e.target.id !== 'edit-profile') st.openProfile(); };
  $('#open-program').onclick  = () => go('program');
  $('#open-tools').onclick    = () => tools.openPlateCalc();
  $('#open-barcodes').onclick = () => barcode.openMyBarcodes();
  $('#open-schedule').onclick = () => coach.openScheduleEditor();
  $('#open-plan').onclick    = () => go('plan');
  $('#open-goals').onclick   = () => st.openGoals();
  $('#open-myfoods').onclick = () => nut.openMyFoods();
  $('#open-api').onclick     = () => st.openAISettings();
  $('#open-prefs').onclick   = () => st.openPrefs();
  $('#open-backup').onclick  = () => st.openBackup();
  $('#open-about').onclick   = () => st.openAbout();

  /* session */
  $('#s-min').onclick    = () => wk.minimizeSession();
  $('#s-finish').onclick = () => wk.finishWorkout();
  $('#s-cancel').onclick = () => wk.cancelWorkout();
  $('#s-add-ex').onclick = () => wk.addExerciseToSession();
  $('#mini-open').onclick = () => wk.openSessionView();

  /* rest timer */
  $('#rest-minus').onclick = () => wk.bumpRest(-15);
  $('#rest-plus').onclick  = () => wk.bumpRest(15);
  $('#rest-skip').onclick  = () => wk.stopRest();

  /* sheet */
  $('#sheet-close').onclick = closeSheet;
  $('#scrim').onclick = closeSheet;

  /* cross-module events */
  window.addEventListener('open-ai-settings', () => st.openAISettings());
  window.addEventListener('open-profile', () => st.openProfile());
  window.addEventListener('open-program', () => go('program'));
  window.addEventListener('open-wizard', () => wiz.openWizard());
  window.addEventListener('open-day', (e) => { S.date = e.detail; go('diary'); });
  window.addEventListener('data-changed', () => refresh());
  window.addEventListener('lang-changed', () => {
    wk.buildExerciseFilters();
    $('#ex-search').placeholder = t('search');
    if (wk.session.active) wk.renderSession();
    refresh();
  });

  /* android back button / browser back */
  window.addEventListener('popstate', () => {
    if (!$('#sheet').hidden) { closeSheet(); history.pushState(null, '', location.href); return; }
    if (!$('#session').hidden) { wk.minimizeSession(); history.pushState(null, '', location.href); return; }
    if (stack.length) { back(); history.pushState(null, '', location.href); return; }
    if (current !== 'home') { go('home'); history.pushState(null, '', location.href); return; }
    history.pushState(null, '', location.href);
  });
  history.pushState(null, '', location.href);

  /* keep timers honest after the phone sleeps */
  document.addEventListener('visibilitychange', async () => {
    if (document.hidden) return;
    if (wk.session.active) wk.renderSession();
    /* the app may have been open across midnight */
    if (bootDay !== todayKey()) {
      bootDay = todayKey();
      if (S.date < bootDay) S.date = bootDay;
      await rep.autoArchive();
      refresh();
    }
  });
}

/** Meal guessed from the time of day. */
function guessMeal() {
  const h = new Date().getHours();
  if (h < 10) return 'breakfast';
  if (h < 16) return 'lunch';
  if (h < 22) return 'dinner';
  return 'snack';
}

function openDatePicker() {
  const inp = el('input', { class: 'input', type: 'date', value: S.date });
  const body = el('div', {}, inp,
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn ghost', onclick: () => { S.date = todayKey(); closeSheet(); refresh(); } }, t('today')),
      el('button', { class: 'btn', onclick: () => { if (inp.value) S.date = inp.value; closeSheet(); refresh(); } }, t('ok'))),
  );
  sheet(dateLabel(S.date), body);
}

/* ---------------- first run ---------------- */

async function firstRunIfNeeded() {
  const seen = await db.metaGet('onboarded', false);
  if (seen) return;

  const fa = getLang() === 'fa';
  const body = el('div', {},
    el('div', { style: 'text-align:center;margin-bottom:20px' },
      el('div', { style: 'font-size:40px' }, '💪'),
      el('h3', { style: 'font-size:20px;margin:8px 0 6px' }, 'FitYar'),
      el('p', { class: 'muted', style: 'line-height:1.9;margin:0' },
        fa ? 'برای شروع، پروفایل خود را کامل کنید تا کالری روزانه محاسبه شود.'
           : 'Fill in your profile so your daily calories can be calculated.')),
    el('button', { class: 'btn full', style: 'margin-bottom:10px', onclick: async () => {
      await db.metaSet('onboarded', true);
      closeSheet(); st.openProfile();
    } }, fa ? 'تکمیل پروفایل' : 'Set up profile'),
    el('button', { class: 'btn ghost full', onclick: async () => {
      await db.metaSet('onboarded', true); closeSheet();
    } }, fa ? 'بعداً' : 'Later'),
  );
  sheet(fa ? 'خوش آمدید' : 'Welcome', body);
}

/** The manifest defines home-screen shortcuts as ?a=… — act on them. */
function handleShortcut() {
  let a = '';
  try { a = new URLSearchParams(location.search).get('a') || ''; } catch {}
  if (!a) return;
  history.replaceState(null, '', location.pathname);   // don't re-fire on reload
  setTimeout(() => {
    if (a === 'scan') nut.openPhotoScan(guessMeal());
    else if (a === 'food') nut.openAddMenu(guessMeal());
    else if (a === 'barcode') barcode.openScanner(guessMeal());
    else if (a === 'train') { trainTab = 'routines'; go('train'); }
  }, 350);
}

/* ---------------- boot ---------------- */

async function boot() {
  window.__fityarStarted = true;
  await db.open();
  await loadStore();

  setLang(S.settings.lang);
  st.applyTheme();
  setFx(S.settings.fx !== false);
  applyDom();

  await wk.loadExercises();
  wk.buildExerciseFilters();
  nut.setRefresh(refresh);
  nut.initPhotoInput();
  st.initImportInput();
  tools.initPhotoPicker();

  wire();
  await rep.autoArchive();              // past days land in history on their own
  go('home', { push: false });
  handleShortcut();
  window.__fityarBooted?.();          // stand the watchdog down — the UI is up
  await wk.restoreSession();
  await firstRunIfNeeded();

  /* service worker — reload once when a newer version takes over, so an
     updated app never runs half on cached files from the previous version.

     Skipped inside the packaged Android app: there every asset already sits on
     disk, so a worker would only add a second cache able to serve the previous
     release's files after an update. The web build is unaffected. */
  if ('serviceWorker' in navigator && !window.__NO_SW__) {
    try {
      const reg = await navigator.serviceWorker.register('./sw.js');
      if (navigator.serviceWorker.controller) {
        let reloaded = false;
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          if (reloaded) return;
          reloaded = true;
          location.reload();
        });
      }
      reg.update?.().catch(() => {});   // a failed update check is not an app error
    } catch {}
  }
}

boot().catch(e => {
  console.error(e);
  window.__fityarBootFailed = true;
  const box = document.getElementById('boot-fail');
  if (box) {
    document.getElementById('boot-fail-msg').textContent = 'راه‌اندازی اپ با خطا متوقف شد.';
    document.getElementById('boot-fail-detail').textContent = `${e.message}\n${e.stack || ''}`;
    box.hidden = false;
  }
});

/* expose a few things for debugging from the console */
window.FitYar = { db, S, go, refresh, wk, nut, prog, st, plan, wiz, rep };
