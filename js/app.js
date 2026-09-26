/* ============ FitYar — app shell, router, wiring ============ */
import * as db from './db.js';
import { S, load as loadStore, MEAL_KEYS, kgToDisp, wUnit, fiberGoal } from './store.js';
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
import { countTo, pop, growTo, setMotion, staggerIn } from './motion.js';
import { glassIco, dumbbellMark } from './art3d.js';
import { introFor } from './intro.js';
import { metricIcon, mealIcon, icon, lineIcon } from './icons.js';
import * as globe from './globe.js';

/* ---------------- router ---------------- */

const SCREENS = ['home', 'diary', 'train', 'progress', 'globe', 'chat', 'more',
  'plan', 'program', 'reports'];
const TITLES = {
  home: 'appName', diary: 'navDiary', train: 'navTrain',
  progress: 'navProgress', globe: 'globeTitle', chat: 'navChat', more: 'navMore',
  plan: 'aiPlan',
  program: 'yourProgram', reports: 'dayReports',
};
/* The tabs in the bar: going to one of these is a fresh start, not a step
   forward, so the back stack is cleared rather than pushed to. */
const ROOT_TABS = ['home', 'diary', 'train', 'progress', 'globe', 'chat', 'more'];
let current = 'home';
let bootDay = todayKey();
const stack = [];

export function go(screen, { push = true } = {}) {
  if (!SCREENS.includes(screen)) screen = 'home';
  if (push && current !== screen && !ROOT_TABS.includes(screen)) stack.push(current);
  if (ROOT_TABS.includes(screen)) stack.length = 0;

  current = screen;
  SCREENS.forEach(s => { const n = $('#screen-' + s); if (n) n.hidden = s !== screen; });
  let activeTab = null;
  $$('#tabbar .tab').forEach(b => {
    const on = b.dataset.screen === screen;
    b.classList.toggle('active', on);
    /* Colour alone does not reach a screen reader, and the five tab colours
       are not all separable by everyone looking at them either. */
    if (on) { b.setAttribute('aria-current', 'page'); activeTab = b; }
    else b.removeAttribute('aria-current');
  });
  placeTabMarker(activeTab);
  $('#tb-title').textContent = t(TITLES[screen] || 'appName');
  $('#tb-back').hidden = !stack.length;
  $('#main').scrollTop = 0;
  window.scrollTo(0, 0);
  /* The first time a section is opened it explains itself, once. Not awaited:
     navigation should never wait on a card that may not even appear. */
  introFor(screen).catch(() => {});
  refresh();
  /* cards walk in, one after another — only on a real tab change */
  staggerIn($('#screen-' + screen));
}

function back() {
  const prev = stack.pop();
  go(prev || 'home', { push: false });
}

/**
 * Put the marker behind the active tab.
 *
 * Measured once per switch and written as a transform: animating `left` would
 * be layout, and animating a CSS variable that feeds a transform is not
 * reliably composited. One read on a discrete event is not a per-frame read.
 */
function placeTabMarker(btn) {
  const ind = $('#tab-ind'), bar = $('#tabbar');
  if (!ind || !bar || !btn) return;
  const b = btn.getBoundingClientRect(), r = bar.getBoundingClientRect();
  if (!b.width) return;                     // the bar is not laid out yet

  /* The icon springs in when its tab becomes the current one. Driven here
     rather than from a CSS animation on the icon being swapped in: display
     was meant to restart that animation and does not, so it was applied and
     never once started. This runs exactly once per switch, and only on a
     real switch - re-placing the marker on a resize is not an arrival. */
  const arrived = bar.dataset.active !== btn.dataset.screen;
  bar.dataset.active = btn.dataset.screen;
  if (arrived) pop(btn.querySelector('.ico-solid'), { from: 0.76, scale: 1.12, duration: 340 });
  ind.style.width = Math.round(b.width - 10) + 'px';
  ind.style.transform = `translateX(${Math.round(b.left - r.left + 5)}px)`;
  /* The first placement must not slide in from the corner. Flushing style
     commits it, which needs no animation frame - waiting one would leave the
     marker permanently un-animated on a page that is not being drawn. */
  if (!ind.dataset.ready) {
    void ind.offsetWidth;
    ind.dataset.ready = '1';
  }
}

/* a rotation or a split-screen resize moves the tabs out from under it */
window.addEventListener('resize', () =>
  placeTabMarker($('#tabbar .tab.active')));

/* ---------------- refresh ---------------- */

let refreshing = false;
let refreshAgain = false;
export async function refresh() {
  /* Asking for a refresh while one is running used to return early, which
     dropped it: logging a food mid-render left the totals showing the old
     numbers. Remember it instead and run once more at the end - many requests
     during one render still cost a single extra render. */
  if (refreshing) { refreshAgain = true; return; }
  refreshing = true;
  try {
    $('#tb-title').textContent = t(TITLES[current] || 'appName');
    if (current === 'home') await renderHome();
    else if (current === 'diary') await nut.renderDiary();
    else if (current === 'train') await renderTrain();
    else if (current === 'progress') await renderProgress();
    else if (current === 'globe') await globe.renderGlobe();
    else if (current === 'chat') {
      const as = await import('./assistant.js');
      await as.renderChat($('#chat-host'));
    }
    else if (current === 'more') await renderMore();
    else if (current === 'plan') await plan.renderPlan();
    else if (current === 'program') await wiz.renderProgram();
    else if (current === 'reports') await rep.renderReports();
  } catch (e) {
    console.error(e);
    toast(t('error') + ': ' + e.message, 'err');
  } finally {
    refreshing = false;
    if (refreshAgain) { refreshAgain = false; await refresh(); }
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

  /* The goal only moves when the user changes it, so it is set outright; the
     three that answer "where am I now" count to their new value. */
  $('#kcal-goal').textContent = num(g.kcal);
  const R = n => num(Math.round(n));
  countTo($('#kcal-eaten'), kcal, { format: R });
  countTo($('#kcal-burned'), burned, { format: R });
  const leftEl = $('#kcal-left');
  countTo(leftEl, Math.abs(left), { format: R });
  leftEl.nextElementSibling.textContent = left >= 0 ? t('kcalLeft') : t('overBy');

  /* Four arcs at four radii make the ring a tube rather than a line, and
     each one needs the dash length for its own radius - sharing one would
     leave the rims a few degrees out of step with the body. */
  const reach = Math.min(pct, 1);
  for (const arc of $$('.ring-arc')) {
    const c = 2 * Math.PI * Number(arc.getAttribute('r'));
    arc.style.strokeDasharray = c;
    arc.style.strokeDashoffset = c * (1 - reach);
  }
  /* Move the gradient's two stops rather than the stroke. Setting the stroke
     replaced the gradient with a flat colour, which is why the shading only
     ever existed in the markup. */
  const tone = pct > 1 ? 'var(--red)' : pct > 0.85 ? 'var(--orange)' : 'var(--acc)';
  const wrap = $('.ring-wrap');
  wrap.style.setProperty('--ring-a', tone);
  /* oklab, not srgb: mixing green toward white in srgb gives a pale mint
     that reads as faded. This keeps the colour and moves the light. */
  wrap.style.setProperty('--ring-b', `color-mix(in oklab, ${tone} 76%, #ffffff)`);
  wrap.style.color = tone;

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
    const value = el('b', {});
    const fill = el('i', {});
    /* A button rather than a div, because it now goes somewhere: the diary,
       where the food that made this number is. A cell that looks pressable
       and does nothing is worse than one that looks inert. */
    mg.append(el('button', { class: 'macro ' + m.cls, onclick: () => go('diary') },
      el('span', { class: 'm-ic' }, metricIcon(m.key, { size: 25, cls: 'ic-lift' })),
      value,
      el('span', { class: 'm-lb' }, t(m.key)),
      el('span', { class: 'm-of' }, `${t('outOf')} ${num(Math.round(m.goal))}`),
      el('div', { class: 'bar' }, fill),
    ));
    /* The cell is rebuilt on every render, so the counter is keyed by macro
       rather than by element - otherwise every render would look like a
       first render and nothing would ever count. */
    /* The value alone. It used to read `۰/۱۵۹`, and in Iranian typography a
       slash is a decimal point — that cell was saying 0.159 grams. */
    countTo(value, m.v, { key: 'macro-' + m.key,
      format: v => num(Math.round(v)) });
    growTo(fill, p);
  });

  /* water — each cup a small glass, filled to the fraction it stands for */
  const ml = await nut.getWater(S.date);
  const goalMl = g.water || 2500;
  $('#water-sum').textContent = `${num(ml)} / ${num(goalMl)} ml`;
  const cups = $('#water-cups');
  cups.replaceChildren();
  const total = Math.ceil(goalMl / 250);
  const exact = ml / 250, full = Math.floor(exact), frac = exact - full;
  for (let i = 0; i < Math.max(total, Math.ceil(exact)); i++) {
    /* the last glass holds what is really left, not a whole cup of it */
    const fill = i < full ? 1 : (i === full && frac > 0.02 ? frac : 0);
    const cup = el('div', { class: 'cup' + (fill > 0 ? ' on' : '') });
    cup.append(glassIco(fill));
    cups.append(cup);
  }

  /* today's session, then what you need in a day */
  $('#home-today').replaceChildren(await coach.todayCard());
  /* Quiet on home: every number, and the fifty words explaining them
     folded behind the question they answer. */
  $('#home-targets').replaceChildren(targetsCard({ quiet: true }));
  /* The protein gap, as a line and a way in — not as the whole card. The
     foods that fill it live on the nutrition tab, because choosing one is
     something you do when you have decided to eat, and home is the screen
     you open to find out where you are. It appears only on a day when the
     gap is real; the check is the coach's own. */
  try {
    const smart = await import('./smart.js');
    const gap = await smart.proteinGap();
    /* The tile is always there; only what it says changes. With a gap it
       carries the number, which is the one thing on this row the reader
       could not have worked out by looking at the ring. */
    const tile = $('#home-protein');
    tile.querySelector('.q-note').textContent =
      gap ? `${num(Math.round(gap))} ${t('gram')}` : '';
    tile.classList.toggle('speaking', !!gap);
    if (!tile.dataset.wired) {
      tile.dataset.wired = '1';
      tile.addEventListener('click', async () => {
        go('diary');
        const nut = await import('./nutrition.js');
        nut.openProteinCoach();
      });
    }
  } catch {}

  /* meals */
  const mh = $('#home-meals');
  mh.replaceChildren();
  let any = false;
  for (const mk of MEAL_KEYS) {
    const items = logs.filter(l => l.meal === mk);
    if (!items.length) continue;
    any = true;
    mh.append(el('div', { class: 'kv meal-kv', dataset: { meal: mk }, onclick: () => go('diary') },
      el('span', { class: 'meal-name' }, mealIcon(mk, { size: 15 }), el('em', {}, t(mk))),
      el('b', {}, `${num(Math.round(sum(items, x => x.kcal)))} ${t('kcal')}`)));
  }
  if (!any) mh.append(emptyArt('plate', t('empty'),
    getLang() === 'fa' ? 'اولین وعده‌ات را ثبت کن' : 'Log your first meal', 'var(--orange)'));

  /* workouts */
  const hs = await wk.allWorkouts();
  const wh = $('#home-workouts');
  wh.replaceChildren();

  /* پویا, on the row that opens his screen. He speaks only when something
     specific is true today and is silent otherwise, which is most days —
     the row then says what it has always said. A character with something
     general to say every morning stops being read by the second week. */
  try {
    const { today: pouyaToday } = await import('./pouya.js');
    const last = hs[0];
    const weekAgo = Date.now() - 6 * 86400000;
    const said = pouyaToday({
      setsToday: hs.filter(w => w.date === S.date).reduce((a, w) => a + (w.sets || 0), 0),
      protein: Math.round(protein),
      proteinTarget: g.protein || 0,
      daysSinceLast: last?.start ? Math.round((Date.now() - last.start) / 86400000) : 0,
      thisWeek: hs.filter(w => (w.start || 0) >= weekAgo).length,
    }, num);
    const note = $('#open-ask .q-note');
    if (note) {
      note.textContent = said ? (getLang() === 'fa' ? said.fa : said.en) : '';
      $('#open-ask').classList.toggle('speaking', !!said);
    }
  } catch { /* the tile keeps its own word */ }
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
  if (trainTab === 'routines') {
    await wk.renderRoutines();
    /* the coach speaks here: quiet observations from real history */
    const host = $('#train-smart');
    if (host) {
      host.replaceChildren();
      try {
        const smart = await import('./smart.js');
        const list = await smart.trainCoachList();
        if (list.length) {
          const card = el('div', { class: 'card smart-card' },
            el('div', { class: 'smart-head' },
              el('span', { class: 'smart-ic' }, '🧠'),
              el('div', {}, el('b', {}, t('smartTitle')))));
          list.forEach(s => card.append(el('div', { class: 'smart-line' }, el('span', {}, s.ic), el('span', {}, s.text))));
          host.append(card);
        }
      } catch {}
    }
  }
  else if (trainTab === 'history') { await wk.renderTrainCalendar(); await wk.renderHistory(); }
  else await wk.renderExerciseList();
}

/* ---------------- PROGRESS ---------------- */

let progTab = 'body';
async function renderProgress() {
  await prog.renderRank();
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
  /* the numbers the maths actually uses — height, activity, BMI — so the
     profile card answers "what does the app know about me?" at a glance */
  const body = $('#profile-stats');
  if (body) {
    const h = p.height || 0, w = p.weight || 0;
    const bmiV = h > 0 ? w / ((h / 100) ** 2) : 0;
    const bmiCls = !bmiV ? '' : bmiV < 18.5 ? 'muted' : bmiV < 25 ? '' : bmiV < 30 ? 'muted' : 'muted';
    body.replaceChildren(
      statCell(t('height'), num(h) + ' ' + (getLang() === 'fa' ? 'سم' : 'cm')),
      statCell(t('age'), num(p.age)),
      statCell(t('activity'), t(p.activity)),
      statCell('BMI', num(round(bmiV, 1), 1)));
    body.className = 'pstats ' + bmiCls;
    body.hidden = !h;   // no height logged yet → nothing to show
  }
}

function statCell(label, value) {
  return el('div', { class: 'pstat' }, el('b', {}, value), el('span', {}, label));
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
  $('#open-compare')?.addEventListener('click', async () => {
    const { openCompare } = await import('./compare.js');
    openCompare();
  });
  /* The chat is a tab now, so the row goes there rather than opening a
     sheet on top of home — two ways of looking at the same conversation is
     one way too many. */
  $('#open-ask')?.addEventListener('click', () => go('chat'));

  $('#log-weight').onclick = () => prog.openWeightLog();
  $('#log-measure').onclick = () => prog.openMeasureLog();

  /* more */
  $('#edit-profile').onclick = () => st.openProfile();
  $('#profile-card').onclick = (e) => { if (e.target.id !== 'edit-profile') st.openProfile(); };
  $('#open-plate').onclick    = () => tools.openPlateCalc();
  $('#open-weekcard').onclick = async () => {
    const wc = await import('./weekcard.js'); wc.openWeekCard();
  };
  $('#open-story').onclick = async () => {
    const st2 = await import('./story.js'); st2.openStoryCard();
  };
  $('#open-schedule').onclick = () => coach.openScheduleEditor();
  $('#open-account').onclick = () => st.openAccount();
  $('#open-reminders').onclick = () => st.openReminders();
  $('#open-goals').onclick   = () => st.openGoals();
  $('#open-myfoods').onclick = () => nut.openMyFoods();
  $('#open-prefs').onclick   = () => st.openPrefs();
  $('#open-backup').onclick  = () => st.openBackup();
  /* The guides were restorable only from inside the preferences sheet,
     which is three taps from anywhere and nobody found it — so somebody who
     dismissed one had no way back and reasonably concluded the guides were
     gone. Its own row, and it says how many are waiting. */
  $('#open-guides')?.addEventListener('click', async () => {
    const { resetIntros, introsLeft } = await import('./intro.js');
    await resetIntros();
    toast(`${t('guidesRestored')} · ${num(await introsLeft())}`, 'ok');
    go('home');
  });

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
  /* The muscle sheet asks for the exercise list; only the shell knows how to
     show a screen and switch its tab. */
  window.addEventListener('show-muscle-exercises', (e) => {
    go('train');
    trainTab = 'exercises';
    renderTrain().then(() => wk.filterToMuscle(e.detail));
  });
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
  const acc = await import('./account.js');
  const seal = async () => { await db.metaSet('onboarded', true); closeSheet(); };

  const body = el('div', {},
    el('div', { style: 'text-align:center;margin-bottom:20px' },
      el('div', { style: 'font-size:var(--t-5xl)' }, '💪'),
      el('h3', { style: 'font-size:var(--t-2xl);margin:8px 0 6px' }, 'FitYar'),
      el('p', { class: 'muted', style: 'line-height:1.9;margin:0' },
        fa ? 'اگر قبلاً حساب ساخته‌اید، وارد شوید تا سابقه‌تان روی این دستگاه بیاید.'
           : 'Already have an account? Sign in and your history follows you here.')),
  );

  /* An account is worth offering first — it is the only thing that cannot be
     done later without having already lost the data. But it stays optional:
     the whole app works with no account and no connection, and someone with
     neither must not be stuck on this screen. */
  if (acc.available()) {
    body.append(
      el('button', { class: 'btn full', style: 'margin-bottom:10px', onclick: async () => {
        await seal(); st.openAccount('login');
      } }, fa ? 'ورود به حساب' : 'Sign in'),
      el('button', { class: 'btn ghost full', style: 'margin-bottom:10px', onclick: async () => {
        await seal(); st.openAccount('register');
      } }, fa ? 'ساخت حساب جدید' : 'Create an account'),
      el('div', { class: 'sep-text', style: 'text-align:center;margin:12px 0;font-size:var(--t-sm);color:var(--tx3)' },
        fa ? 'یا بدون حساب ادامه دهید' : 'or carry on without one'),
    );
  }

  body.append(
    el('button', { class: acc.available() ? 'btn ghost full' : 'btn full',
                   style: 'margin-bottom:10px', onclick: async () => {
      await seal(); st.openProfile();
    } }, fa ? 'تکمیل پروفایل' : 'Set up profile'),
    el('button', { class: 'btn ghost full', onclick: seal },
      fa ? 'بعداً' : 'Later'),
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

/**
 * Ask the browser not to throw this data away.
 *
 * Without it, IndexedDB is "best effort": when the device runs short of space
 * the browser may clear the whole database, and a year of logs goes with it —
 * no warning, nothing to restore from. An installed app is usually granted this
 * silently; a browser tab may refuse or ask, which is not an error.
 *
 * It is asked for only once there is something to lose, so nobody meets a
 * storage prompt on the first screen of an app they have not used yet.
 */
async function keepStorage() {
  try {
    if (!navigator.storage?.persist) return;
    if (await navigator.storage.persisted()) return;
    const logs = await db.count('foodLogs').catch(() => 0);
    const sets = await db.count('workouts').catch(() => 0);
    if (logs + sets < 3) return;
    await navigator.storage.persist();
  } catch {}
}

/* ---------------- boot ---------------- */

async function boot() {
  window.__fityarStarted = true;
  /* Markup that wants a glyph says so with data-glyph, so the drawing lives
     in one place instead of being written out again in the HTML. */
  for (const host of $$('[data-glyph]')) {
    host.replaceChildren(icon(host.dataset.glyph, { size: 26, cls: 'ic-lift' }));
  }
  /* the mark in the top bar, drawn once */
  {
    const mark = $('#tb-mark');
    if (mark) { mark.hidden = false; mark.replaceChildren(dumbbellMark()); }
  }
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

  /* a reboot or a force-stop drops pending notifications, so put them back */
  import('./reminders.js').then(r => r.reapply()).catch(() => {});

  keepStorage();

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
