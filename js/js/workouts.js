/* ============ Training: exercises, routines, live session, history ============ */
import * as db from './db.js';
import { icon, lineIcon } from './icons.js';
import { motionOff } from './motion.js';
import { S, e1rm, kgToDisp, dispToKg, wUnit, workoutKcal } from './store.js';
import { t, num, pick, getLang, countLabel, numText } from './i18n.js';
import {
  $, $$, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, sum, parseNum, clock, durLabel, todayKey, dateKey, shortDate, longDate,
  buzz, beep, clamp,
} from './ui.js';
import { EXERCISES, EX_INDEX, MUSCLES, EQUIPMENT, TEMPLATES } from './data-exercises.js';
import { emptyArt, bodyMap } from './art.js';
import { moveFor, MOVES } from './moves.js';
import { muscleStats, heatFrom, recencyOf, RECENCY_TONE } from './muscles.js';
import { body3d } from './body3d.js';
import { afterWorkout, pouyaCard, workoutFacts } from './pouya.js';
import { barbell3d } from './art3d.js';

const SET_TYPES = {
  n: { key: 'n', label: 'normalSet', short: '', cls: '' },
  w: { key: 'w', label: 'warmup',    short: 'W', cls: 'warm' },
  d: { key: 'd', label: 'dropSet',   short: 'D', cls: 'drop' },
  f: { key: 'f', label: 'failure',   short: 'F', cls: 'fail' },
};

/* ---------------- exercise catalog ---------------- */

/**
 * Every record you hold, newest first.
 *
 * Sorted by when it was set rather than alphabetically: what you did
 * recently is what you want to see, and a list in exercise order buries it.
 */
export async function openRecords() {
  const recs = await records();
  const fa = getLang() === 'fa';
  const rows = Object.values(recs)
    .filter((r) => r.maxW || r.maxReps)
    .sort((a, b) => String(b.weightAt || b.repsAt || '').localeCompare(
      String(a.weightAt || a.repsAt || '')));

  if (!rows.length) {
    sheet(t('myRecords'), emptyArt('workout', t('noRecordsYet'), t('noRecordsHint')));
    return;
  }

  const pr = (label, value, when) => el('div', { class: 'pr-cell' },
    el('span', { class: 'pr-lab' }, label),
    el('b', {}, value),
    when ? el('span', { class: 'pr-when' }, shortDate(when)) : null);

  sheet(t('myRecords'), el('div', { class: 'pr-list' }, ...rows.map((r) => el('div', { class: 'pr-row' },
    el('div', { class: 'pr-head' },
      el('b', {}, exName(r.exId)),
      r.best1rm
        ? el('span', {}, `${t('est1rm')} ${num(round(kgToDisp(r.best1rm), 1))}${wUnit()}`)
        : null),
    el('div', { class: 'pr-grid' },
      pr(fa ? PR_KINDS[0].fa : PR_KINDS[0].en,
         r.maxW ? `${num(round(kgToDisp(r.maxW), 1))}${wUnit()} × ${num(r.reps)}` : '—',
         r.weightAt),
      pr(fa ? PR_KINDS[1].fa : PR_KINDS[1].en,
         r.maxReps ? `${num(r.maxReps)}${r.repsWeight ? ` × ${num(round(kgToDisp(r.repsWeight), 1))}${wUnit()}` : ''}` : '—',
         r.repsAt),
      pr(fa ? PR_KINDS[2].fa : PR_KINDS[2].en,
         r.maxVol ? `${num(round(kgToDisp(r.maxVol)))}${wUnit()}` : '—',
         r.volumeAt)),
  ))));
}


let customEx = [];
export async function loadExercises() {
  customEx = await db.all('exercises');
  return catalog();
}
export const catalog = () => [...customEx, ...EXERCISES];
export const exById = (id) => customEx.find(e => e.id === id) || EX_INDEX[id] || null;
export const exName = (id) => { const e = exById(id); return e ? pick(e) : id; };

function searchEx(q, muscle = 'all') {
  const norm = (x) => (x || '').toLowerCase().replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ');
  const s = norm((q || '').trim());
  let pool = catalog();
  if (muscle !== 'all') pool = pool.filter(e => e.muscle === muscle);
  if (!s) return pool;
  return pool.filter(e => norm(e.name).includes(s) || norm(e.nameFa).includes(s));
}

/* ---------------- history helpers ---------------- */

let historyCache = null;
async function history() {
  if (!historyCache) {
    historyCache = await db.all('workouts');
    historyCache.sort((a, b) => b.start - a.start);
  }
  return historyCache;
}
const invalidate = () => { historyCache = null; };

/** Last completed sets logged for an exercise, most recent workout. */
export async function lastSetsFor(exId) {
  const hs = await history();
  for (const w of hs) {
    const e = (w.exercises || []).find(x => x.exId === exId);
    const done = (e?.sets || []).filter(s => s.done && s.type !== 'w');
    if (done.length) return done;
  }
  return [];
}

/**
 * Personal records per exercise, kept as the three different things they are.
 *
 *   weight  the heaviest single lift
 *   reps    the most reps ever done in one set, at any weight
 *   volume  the most work in one set, weight times reps
 *
 * Collapsing them loses real achievements: adding a rep at a weight below
 * your heaviest is not visible in "heaviest weight" at all, and it is often
 * the thing that actually happened this month.
 *
 * Each carries the date it fell, because a record set last week and one set
 * a year ago say different things about where you are now.
 */
export async function records() {
  const hs = await history();
  const rec = {};
  for (const w of hs) {
    for (const e of w.exercises || []) {
      for (const s of e.sets || []) {
        if (!s.done || s.type === 'w') continue;
        const wt = Number(s.w) || 0, rp = Number(s.r) || 0;
        if (!rp) continue;
        const r = (rec[e.exId] ||= {
          exId: e.exId, maxW: 0, best1rm: 0, maxVol: 0, maxReps: 0,
          date: w.date, reps: 0,
          weightAt: null, repsAt: null, volumeAt: null,
          repsWeight: 0, volumeReps: 0, volumeWeight: 0,
        });
        if (wt > r.maxW) { r.maxW = wt; r.reps = rp; r.date = w.date; r.weightAt = w.date; }
        if (rp > r.maxReps) { r.maxReps = rp; r.repsWeight = wt; r.repsAt = w.date; }
        const est = e1rm(wt, rp);
        if (est > r.best1rm) r.best1rm = est;
        if (wt * rp > r.maxVol) {
          r.maxVol = wt * rp; r.volumeReps = rp; r.volumeWeight = wt; r.volumeAt = w.date;
        }
      }
    }
  }
  return rec;
}

/**
 * A record just fell. Say which one, once, and get out of the way.
 *
 * One banner that rises, holds and leaves. Not confetti: a PR happens with
 * a bar in your hands and a party on screen is the wrong register for it.
 * With motion off it is the ordinary toast, because the information still
 * has to arrive.
 */
function celebratePR(exId, kinds) {
  const fa = getLang() === 'fa';
  const which = kinds.map((k) => {
    const kind = PR_KINDS.find((x) => x.id === k);
    return fa ? kind.fa : kind.en;
  }).join(fa ? ' و ' : ' & ');
  const line = `${exName(exId)} · ${which}`;

  buzz(60);
  if (motionOff() || !document.body.animate) {
    toast(`${t('newPR')} — ${line}`, 'ok');
    return;
  }

  /* The bar is the thing that just moved — the banner announces the record
     ON the object that set it, the plates lit and the bar rising the last
     few centimetres it earned. The glow behind it brightens with the lift. */
  const bar = barbell3d();
  const el2 = el('div', { class: 'pr-pop pr-lift' },
    el('span', { class: 'pr-pop-bar' }, bar),
    el('div', {}, el('b', {}, t('newPR')), el('span', {}, line)));
  document.body.append(el2);
  bar.animate?.([
    { transform: 'translateY(7px) rotate(-2.2deg)' },
    { transform: 'translateY(-3px) rotate(1.6deg)', offset: .38 },
    { transform: 'translateY(1px) rotate(-0.8deg)', offset: .62 },
    { transform: 'translateY(0) rotate(0deg)' },
  ], { duration: 1500, easing: 'cubic-bezier(.34,1.3,.64,1)', fill: 'both' });
  el2.animate([
    { transform: 'translateY(26px)', opacity: 0 },
    { transform: 'translateY(0)', opacity: 1, offset: 0.14 },
    { transform: 'translateY(0)', opacity: 1, offset: 0.82 },
    { transform: 'translateY(-14px)', opacity: 0 },
  ], { duration: 2600, easing: 'cubic-bezier(.23,1,.32,1)' })
    .finished.catch(() => {}).then(() => el2.remove());
}

/** The three kinds, named once so the screen and the toast agree. */
export const PR_KINDS = [
  { id: 'weight', fa: 'بیشترین وزن', en: 'Heaviest' },
  { id: 'reps', fa: 'بیشترین تکرار', en: 'Most reps' },
  { id: 'volume', fa: 'بیشترین کار در یک ست', en: 'Best set' },
];

export function workoutVolume(w) {
  return sum(w.exercises || [], e => sum((e.sets || []).filter(s => s.done && s.type !== 'w'), s => (Number(s.w) || 0) * (Number(s.r) || 0)));
}
export function workoutSets(w) {
  return sum(w.exercises || [], e => (e.sets || []).filter(s => s.done).length);
}

/* ============================================================
   LIVE SESSION
   ============================================================ */

export const session = {
  active: false, id: null, name: '', start: 0, routineId: null,
  exercises: [], notes: '', minimized: false,
};

let tickTimer = null;
let prCache = {};

async function persist() {
  if (session.active) await db.metaSet('session', { ...session });
  else await db.metaSet('session', null);
}

export async function restoreSession() {
  const s = await db.metaGet('session', null);
  if (s && s.active) {
    Object.assign(session, s);
    prCache = await records();
    startTick();
    if (session.minimized) showMini(true);
    else openSessionView();
  }
  gymModeOff();   // a refresh mid-gym-mode lands on the normal session view
}

export async function startWorkout(routine = null) {
  gymModeOff();   // a leftover gym overlay from a finished session must never survive
  sessionPR = null;
  if (session.active) {
    const wanted = routine?.routineId || routine?.id || null;
    /* Asking for the workout that is already open, or for no routine at all,
       means "take me back to it". */
    if (!routine || wanted === session.routineId) { openSessionView(); return; }

    const logged = workoutSets(session);
    if (logged) {
      /* Sets already recorded are never discarded to make room for a different
         routine. Show the running workout and say why. */
      openSessionView();
      toast(t('finishCurrentFirst'), 'err');
      return;
    }
    /* Nothing logged, so nothing to lose — swap it for the routine that was
       actually asked for, and say so rather than appearing to ignore the tap. */
    await cancelWorkout(true);
    toast(t('switchedWorkout'), 'ok');
  }
  prCache = await records();

  const exercises = [];
  for (const x of routine?.ex || []) {
    const prev = await lastSetsFor(x.exId);
    exercises.push({
      exId: x.exId, notes: '', restSec: x.restSec || S.settings.restDefault,
      target: x.reps || '',
      sets: Array.from({ length: x.sets || 3 }, (_, i) => ({
        w: '', r: '', type: 'n', done: false,
        prevLabel: prevLabelFor(x.exId, prev[i]),
      })),
    });
  }

  Object.assign(session, {
    active: true, id: db.uid('w_'), start: Date.now(), minimized: false, notes: '',
    routineId: routine?.routineId || routine?.id || null,
    name: routine ? (pick(routine, 'name') || routine.name) : (getLang() === 'fa' ? 'تمرین' : 'Workout'),
    exercises,
  });
  await persist();
  startTick();
  openSessionView();
  buzz(40);
}

/** "60×8" style hint from a previous set of the same exercise. */
function prevLabelFor(exId, prevSet) {
  if (!prevSet) return '—';
  const type = exById(exId)?.type || 'wr';
  if (type === 'r') return `${num(prevSet.r)}×`;
  if (type === 'd') return `${num(prevSet.secs || 0)}s`;
  if (type === 'dd') return `${num(prevSet.dist || 0)}km`;
  return `${num(round(kgToDisp(Number(prevSet.w) || 0), 1))}×${num(prevSet.r)}`;
}

function startTick() {
  clearInterval(tickTimer);
  tickTimer = setInterval(() => {
    if (!session.active) return clearInterval(tickTimer);
    const sec = (Date.now() - session.start) / 1000;
    const txt = clock(sec, sec >= 3600);
    const a = $('#s-time'), b = $('#mini-time');
    if (a) a.textContent = txt;
    if (b) b.textContent = txt;
  }, 1000);
}

export function openSessionView() {
  session.minimized = false;
  $('#session').hidden = false;
  showMini(false);
  document.body.style.overflow = 'hidden';
  renderSession();
  persist();
  syncGymButton();
  /* The workout opens on the stage, not the list: one exercise, its sets,
     the clock. The ✕ on the stage is what reveals the full list. */
  if (session.active && !focusEl && !gymEl) focusEnter(firstOpenIndex());
}

/** The gym-mode switch lives in the session footer; it only exists mid-workout. */
function syncGymButton() {
  const host = document.querySelector('.s-actions');
  if (!host) return;
  let b = $('#gym-btn');
  if (!b) {
    b = el('button', { class: 'btn ghost', id: 'gym-btn', onclick: () => gymModeOn() });
    host.prepend(b);
  }
  b.hidden = !session.active;
  b.replaceChildren('🏋️ ' + t('gymMode'));
}
export function minimizeSession() {
  session.minimized = true;
  $('#session').hidden = true;
  document.body.style.overflow = '';
  showMini(true);
  persist();
}
function showMini(on) {
  const m = $('#mini-session');
  m.hidden = !on || !session.active;
  if (on && session.active) $('#mini-name').textContent = session.name;
}

/* ============================================================
   GYM MODE 🏋️ — one huge set at a time
   The phone lives on the floor between sets: the session fills
   the screen with today's current exercise, its inputs and its
   done-button are finger-sized, and a Wake Lock keeps the
   display awake while the person works. Everything else —
   scrolling, headers, footers — stays exactly as it was.
   ============================================================ */
let gymUI = null, gymEl = null, gymWake = null;

export function gymModeOn() {
  if (!session.active || gymEl) return;
  gymEl = el('div', { class: 'gym-mode' });
  document.body.append(gymEl);
  document.body.style.overflow = 'hidden';
  $('#session').style.visibility = 'hidden';
  drawGym();
  requestWake().catch(() => {});
  toast(t('gymModeOn'), 'ok'); buzz(30);
}
function gymModeOff() {
  if (!gymEl) return;
  gymEl.remove(); gymEl = null;
  gymUI = null;
  document.body.style.overflow = '';
  $('#session').style.visibility = '';
  releaseWake().catch(() => {});
}
export function gymModeRunning() { return !!gymEl; }

async function requestWake() {
  try { gymWake = await navigator.wakeLock?.request('screen'); } catch { /* denied or absent */ }
}
async function releaseWake() {
  try { gymWake?.release(); } catch { /* fine */ } gymWake = null;
}
document.addEventListener('visibilitychange', () => {
  /* the lock dies with the tab: re-request it when the person comes back */
  if (document.visibilityState === 'visible' && gymEl) requestWake().catch(() => {});
});

/** The one exercise whose turn it is: first with work left, else the last. */
function currentGymEx() {
  return session.exercises.find(e => e.sets.some(s => !s.done)) || session.exercises.at(-1);
}

function drawGym() {
  if (!gymEl || !session.active) return gymModeOff();
  const ex = currentGymEx();
  gymEl.replaceChildren();
  if (!ex) { gymModeOff(); return; }
  const done = workoutSets(session);
  const total = session.exercises.reduce((n, e) => n + e.sets.length, 0);
  const meta = exById(ex.exId);
  const type = meta?.type || 'wr';

  const rows = el('div', { class: 'gym-rows' });
  ex.sets.forEach((st, si) => {
    const ti = SET_TYPES[st.type] || SET_TYPES.n;
    const wIn = el('input', { class: 'gym-in', type: 'number', inputmode: 'decimal', step: '0.5',
      value: st.w === '' ? '' : (st.w === null ? '' : st.w), placeholder: '0' });
    const rIn = el('input', { class: 'gym-in gym-r', type: 'number', inputmode: 'numeric',
      value: st.r ?? '', placeholder: '0' });
    if (type === 'r') wIn.hidden = true;
    wIn.oninput = () => { st.w = parseNum(wIn.value); persist(); };
    rIn.oninput = () => { st.r = parseNum(rIn.value); persist(); };
    const ok = el('button', { class: 'gym-ok' + (st.done ? ' done' : '') },
      el('b', {}, String(si + 1)), el('span', {}, st.done ? '✓' : '→'));
    ok.onclick = () => toggleSet(ex, session.exercises.indexOf(ex), st, si);
    rows.append(el('div', { class: 'gym-row' + (st.done ? ' done' : '') },
      el('span', { class: 'gym-tt' }, ti.short || ''),
      wIn, el('span', { class: 'gym-x' }, '×'), rIn, ok));
  });

  const actions = el('div', { class: 'gym-actions' });
  actions.replaceChildren(
    el('button', { class: 'btn ghost', onclick: () => {
      ex.sets.push({ w: ex.sets.at(-1)?.w ?? '', r: ex.sets.at(-1)?.r ?? '', type: 'n', done: false }); persist(); drawGym();
    } }, '+ ' + t('addSet')),
    el('button', { class: 'btn ghost', onclick: () => gymModeOff() }, t('gymModeExit')),
  );

  gymEl.append(
    el('div', { class: 'gym-top' },
      el('div', {}, el('span', { class: 'muted' }, session.name), el('b', { class: 'gym-ex' }, exName(ex.exId))),
      el('div', { class: 'gym-count' }, el('b', {}, `${num(done)}/${num(total)}`), el('span', {}, t('doneSets'))),
      el('button', { class: 'tb-btn', onclick: () => { import('./voice.js').then(v => v.onNextSet(Number(ex.sets.find(s => !s.done)?.w) || 0, Number(ex.sets.find(s => !s.done)?.r) || 0)).catch(() => {}); } }, '🔊'),
    ),
    el('div', { class: 'gym-progress' }, el('i', { style: `width:${total ? (done / total) * 100 : 0}%` })),
    rows,
    actions,
  );
}

/* ---------- session rendering ---------- */

export function renderSession() {
  if (!session.active) return;
  $('#s-name').textContent = session.name;
  const sec = (Date.now() - session.start) / 1000;
  $('#s-time').textContent = clock(sec, sec >= 3600);

  const vol = workoutVolume(session);
  const sets = workoutSets(session);
  $('#s-stats').replaceChildren(
    el('div', {}, el('b', {}, num(round(kgToDisp(vol)))), el('span', {}, `${t('volume')} (${wUnit()})`)),
    el('div', {}, el('b', {}, num(sets)), el('span', {}, t('sets'))),
    el('div', {}, el('b', {}, num(session.exercises.length)), el('span', {}, t('exercises'))),
  );

  const host = $('#s-body');
  host.replaceChildren();
  if (!session.exercises.length) {
    /* No button: the session footer already carries "add exercise", and two
       identical buttons a centimetre apart is worse than one. */
    host.append(emptyArt('dumbbell', t('sessionEmpty'), t('sessionEmptyHint'), 'var(--blue)'));
  }
  session.exercises.forEach((ex, xi) => host.append(exerciseCard(ex, xi)));
  syncGymButton();
  /* focus mode is the live surface — keep it in step with the list */
  if (focusEl) drawFocus();
}

function exerciseCard(ex, xi) {
  const meta = exById(ex.exId);
  const type = meta?.type || 'wr';
  const card = el('div', { class: 'sx' });

  /* The muscle this movement is for, lit on a body you can turn — and
     brightening as the sets are done. The figure knew how to do this
     already; it was only ever shown on the browsing tab, which is not
     where anyone needs it. */
  const worked = meta?.muscle && meta.muscle !== 'cardio' && meta.muscle !== 'fullbody'
    ? meta.muscle : null;
  const doneSets = (ex.sets || []).filter((st) => st.done && st.type !== 'w').length;
  const planned = Math.max(1, (ex.sets || []).filter((st) => st.type !== 'w').length);
  /* Held in the middle of its movement rather than standing to attention: at
     this size the shape is what carries — a squat and a press are two
     different silhouettes long before the name has been read. Still, not
     animated: a screen of cards each running its own loop is a hot phone. */
  const figure = worked
    ? body3d({
      heat: { [worked]: Math.max(0.25, Math.min(1, doneSets / planned)) },
      scale: 0.21, move: moveFor(meta), still: true,
    })
    : null;

  card.append(el('div', { class: 'sx-head' },
    figure ? el('span', { class: 'sx-body' }, figure.node) : null,
    el('b', {}, exName(ex.exId)),
    ex.target ? el('span', { class: 'pr-tag' }, `${t('reps')} ${numText(ex.target)}`) : null,
    el('button', { class: 'tb-btn', onclick: () => exerciseMenu(xi) }, '⋯'),
  ));

  /* progressive-overload hint, filled in once the history is read */
  if (type === 'wr') {
    const hint = el('div', { class: 'sx-hint', hidden: true });
    card.append(hint);
    import('./coach.js').then(c => c.overloadFor(ex.exId, ex.target)).then(sug => {
      if (!sug || sug.kind === 'none') return;
      hint.hidden = false;
      hint.className = 'sx-hint ' + sug.kind;
      hint.replaceChildren(
        el('span', {}, sug.kind === 'up' ? '📈' : '🔁'),
        el('b', {}, sug.text),
        sug.weight ? el('button', { class: 'sx-apply', onclick: () => {
          ex.sets.forEach(st => { if (!st.done) st.w = sug.weight; });
          persist(); renderSession(); buzz(20);
        } }, t('apply') ) : null);
    }).catch(() => {});
  }

  const note = el('input', { class: 'sx-note', placeholder: t('notes'), value: ex.notes || '' });
  note.oninput = () => { ex.notes = note.value; persist(); };
  card.append(note);

  const table = el('table', { class: 'set-table' });
  const cols = type === 'd' ? [t('sets'), t('prev'), t('duration'), ''] :
               type === 'dd' ? [t('sets'), t('prev'), 'km', t('min'), ''] :
               type === 'r' ? [t('sets'), t('prev'), t('reps'), ''] :
               [t('sets'), t('prev'), `${t('weightCol')} (${wUnit()})`, t('reps'), ''];
  table.append(el('thead', {}, el('tr', {}, ...cols.map(c => el('th', {}, c)))));

  const tb = el('tbody', {});
  let normalIdx = 0;
  ex.sets.forEach((st, si) => {
    if (st.type === 'n' || st.type === 'f') normalIdx++;
    tb.append(setRow(ex, xi, st, si, normalIdx, type));
  });
  table.append(tb);
  card.append(table);

  card.append(el('button', { class: 'sx-add', onclick: () => {
    const last = ex.sets.at(-1);
    ex.sets.push({ w: last?.w ?? '', r: last?.r ?? '', type: 'n', done: false });
    persist(); renderSession();
  } }, '+ ' + t('addSet')));

  return card;
}

function setRow(ex, xi, st, si, normalIdx, type) {
  const tr = el('tr', { class: st.done ? 'done' : '' });
  const ti = SET_TYPES[st.type] || SET_TYPES.n;

  tr.append(el('td', { class: 'set-n' },
    el('button', { class: ti.cls, onclick: () => pickSetType(xi, si) }, ti.short || String(normalIdx)),
  ));

  const prevTxt = st.prevLabel || '—';
  tr.append(el('td', { class: 'set-prev' }, prevTxt));

  const mkInput = (val, ph, onCh, step = 'any') => {
    const i = el('input', {
      class: 'set-in', type: 'number', inputmode: 'decimal', step,
      value: val === '' || val === null || val === undefined ? '' : val, placeholder: ph,
    });
    i.oninput = () => onCh(i.value);
    i.onfocus = () => i.select();
    return i;
  };

  if (type === 'd') {
    tr.append(el('td', {}, mkInput(st.secs ?? '', 'sec', v => { st.secs = parseNum(v); persist(); })));
  } else if (type === 'dd') {
    tr.append(el('td', {}, mkInput(st.dist ?? '', 'km', v => { st.dist = parseNum(v); persist(); })));
    tr.append(el('td', {}, mkInput(st.mins ?? '', 'min', v => { st.mins = parseNum(v); persist(); })));
  } else if (type === 'r') {
    tr.append(el('td', {}, mkInput(st.r ?? '', '0', v => { st.r = parseNum(v); persist(); })));
  } else {
    tr.append(el('td', {}, mkInput(st.w === '' ? '' : round(kgToDisp(Number(st.w) || 0), 1) || '', '0',
      v => { st.w = v === '' ? '' : dispToKg(parseNum(v)); persist(); }, '0.5')));
    tr.append(el('td', {}, mkInput(st.r ?? '', '0', v => { st.r = parseNum(v); persist(); })));
  }

  const okBtn = el('button', {}, el('svg', { class: 'ico', viewBox: '0 0 24 24' }));
  okBtn.firstChild.innerHTML = '<path d="M5 13l4 4L19 7"/>';
  okBtn.onclick = () => toggleSet(ex, xi, st, si);
  tr.append(el('td', { class: 'set-ok' }, okBtn));

  return tr;
}

function toggleSet(ex, xi, st, si) {
  if (!st.done) {
    /* Ghost of the same set last time: it races beside this one and a
       breath after you tick, the verdict is spoken. Anything the athlete
       does not need is kept out of the way — one line, then gone. */
    import('./coach.js').then(c => c.lastSetsFor(ex.exId)).then(prev => {
      if (!prev?.length) return;
      const pw = Number(prev[0]?.w) || 0, pr = Number(prev[0]?.r) || 0;
      if (!pw && !pr) return;
      const w = Number(st.w) || 0, rp = Number(st.r) || 0;
      if (!w && !rp) return;
      const better = w * rp > pw * pr;
      const same = w === pw && rp === pr;
      const msg = same ? t('ghostEven', { w: w, r: rp })
        : better ? t('ghostUp', { w: w, r: rp, pw, pr })
        : t('ghostDown', { w: w, r: rp, pw, pr });
      const el2 = el('div', { class: 'ghost-note' + (better ? ' up' : same ? '' : ' down') }, msg);
      const card = okBtn.closest('.sx');
      if (card) { card.prepend(el2); setTimeout(() => el2.remove(), 3500); }
    }).catch(() => {});
  }
  st.done = !st.done;
  if (st.done) {
    buzz(25);
    // PR check
    /* Three records, checked apart. The old test compared estimated 1RM
       only, so adding reps at a weight below your heaviest went unremarked
       even when it was the best set you had ever done. */
    const r = prCache[ex.exId];
    const w = Number(st.w) || 0, rp = Number(st.r) || 0;
    if (r && rp && st.type !== 'w') {
      const broke = [];
      if (w && w > r.maxW) { broke.push('weight'); r.maxW = w; }
      if (rp > r.maxReps) { broke.push('reps'); r.maxReps = rp; }
      if (w && w * rp > r.maxVol) { broke.push('volume'); r.maxVol = w * rp; }
      if (w) r.best1rm = Math.max(r.best1rm, e1rm(w, rp));
      if (broke.length) {
        /* Kept for the end of the session. Weight only: "most reps at a
           light weight" is a record too, but it is not the one anybody
           wants read back to them as the headline. */
        if (broke.includes('weight')) sessionPR = { name: exName(ex.exId), weight: w };
        celebratePR(ex.exId, broke);
        import('./voice.js').then(v => v.onPR(exName(ex.exId))).catch(() => {});
      }
    }
    const rest = ex.restSec ?? S.settings.restDefault;
    if (rest > 0) startRest(rest);
  }
  persist();
  renderSession();
  if (gymEl) drawGym();
}

function pickSetType(xi, si) {
  const st = session.exercises[xi].sets[si];
  const body = el('div', { class: 'list' });
  Object.values(SET_TYPES).forEach(ty => {
    body.append(el('button', { class: 'li', onclick: () => {
      st.type = ty.key; closeSheet(); persist(); renderSession();
    } },
      el('div', { class: 'li-main' }, el('b', {}, t(ty.label))),
      el('div', { class: 'li-end' }, el('b', {}, ty.short || '#')),
    ));
  });
  body.append(el('button', { class: 'li', style: 'color:var(--red)', onclick: () => {
    session.exercises[xi].sets.splice(si, 1);
    closeSheet(); persist(); renderSession();
  } }, el('div', { class: 'li-main' }, el('b', {}, t('removeSet')))));
  sheet(t('pickType'), body);
}

function exerciseMenu(xi) {
  const ex = session.exercises[xi];
  const restIn = input({ type: 'number', inputmode: 'numeric', value: ex.restSec ?? S.settings.restDefault });
  const body = el('div', {},
    field(t('rest') + ' (' + t('sec') + ')', restIn),
    el('div', { class: 'chips' }, ...[0, 45, 60, 90, 120, 150, 180, 240].map(s =>
      el('button', { class: 'chip', onclick: () => { restIn.value = s; } }, s ? s + 's' : t('off')))),
    el('button', { class: 'btn full', style: 'margin-top:8px', onclick: () => {
      ex.restSec = parseNum(restIn.value); closeSheet(); persist(); toast(t('saved'), 'ok');
    } }, t('save')),
    el('button', { class: 'btn ghost full', onclick: async () => {
      const last = [...ex.sets].reverse().find(st => Number(st.w) > 0);
      closeSheet();
      const tools = await import('./tools.js');
      tools.openPlateCalc(last ? Number(last.w) : null);
    } }, el('span', { class: 'streak-line' },
      icon('dumbbell', { size: 16 }), el('em', {}, t('plateCalc')))),
    el('hr', { class: 'sep' }),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn ghost', disabled: xi === 0 || null, onclick: () => {
        [session.exercises[xi - 1], session.exercises[xi]] = [session.exercises[xi], session.exercises[xi - 1]];
        closeSheet(); persist(); renderSession();
      } }, '↑'),
      el('button', { class: 'btn ghost', disabled: xi === session.exercises.length - 1 || null, onclick: () => {
        [session.exercises[xi + 1], session.exercises[xi]] = [session.exercises[xi], session.exercises[xi + 1]];
        closeSheet(); persist(); renderSession();
      } }, '↓'),
    ),
    el('button', { class: 'btn danger ghost full', style: 'margin-top:9px', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('confirmDelete'), exName(ex.exId))) {
        session.exercises.splice(xi, 1); persist(); renderSession();
      }
    } }, t('delete')),
  );
  sheet(exName(ex.exId), body);
}

/* ---------- adding exercises to the session ---------- */

export function addExerciseToSession() {
  openExercisePicker(async (ids) => {
    for (const id of ids) {
      const prev = await lastSetsFor(id);
      const n = Math.max(1, Math.min(5, prev.length || 3));
      session.exercises.push({
        exId: id, notes: '', restSec: S.settings.restDefault, target: '',
        sets: Array.from({ length: n }, (_, i) => ({
          w: '', r: '', type: 'n', done: false, prevLabel: prevLabelFor(id, prev[i]),
        })),
      });
    }
    persist(); renderSession();
  });
}

/** Multi-select exercise picker. cb receives an array of exercise ids. */
export function openExercisePicker(cb, { multi = true } = {}) {
  const chosen = new Set();
  const q = input({ placeholder: t('search'), autocomplete: 'off' });
  const chips = el('div', { class: 'chips' });
  const list = el('div', { class: 'list' });
  let muscle = 'all';
  const doneBtn = el('button', { class: 'btn full', style: 'margin-top:12px', onclick: () => {
    if (!chosen.size) return;
    const ids = [...chosen]; closeSheet(); cb(ids);
  } }, t('add'));

  MUSCLES.forEach(m => {
    const b = el('button', { class: 'chip' + (m.id === muscle ? ' on' : ''), onclick: () => {
      muscle = m.id;
      [...chips.children].forEach(x => x.classList.remove('on'));
      b.classList.add('on'); draw();
    } }, pick(m));
    chips.append(b);
  });

  function draw() {
    list.replaceChildren();
    const res = searchEx(q.value, muscle);
    if (!res.length) { list.append(el('div', { class: 'empty' }, t('empty'))); return; }
    res.slice(0, 200).forEach(e => {
      const eq = EQUIPMENT.find(x => x.id === e.equip);
      const mu = MUSCLES.find(x => x.id === e.muscle);
      const row = el('div', { class: 'li' + (chosen.has(e.id) ? ' on' : ''),
        style: chosen.has(e.id) ? 'border-color:var(--acc)' : '',
        onclick: () => {
          if (!multi) { closeSheet(); cb([e.id]); return; }
          if (chosen.has(e.id)) chosen.delete(e.id); else chosen.add(e.id);
          doneBtn.textContent = chosen.size ? `${t('add')} (${num(chosen.size)})` : t('add');
          draw();
        } },
        el('div', { class: 'li-main' },
          el('b', {}, pick(e)),
          el('span', {}, `${pick(mu)} · ${pick(eq)}`)),
        el('div', { class: 'li-end' }, el('b', { style: chosen.has(e.id) ? 'color:var(--acc)' : '' }, chosen.has(e.id) ? '✓' : '+')),
      );
      list.append(row);
    });
  }
  q.oninput = draw;
  draw();
  const body = el('div', {}, q, el('div', { style: 'height:10px' }), chips, list);
  if (multi) body.append(doneBtn);
  sheet(t('addExercise'), body);
}

/* ---------- finish / cancel ---------- */

export async function finishWorkout() {
  const doneSets = workoutSets(session);
  if (!doneSets) {
    const ok = await confirmSheet(t('workoutEmpty'), t('cancelConfirm'));
    if (!ok) return;
    return cancelWorkout(true);
  }
  const end = Date.now();
  const rec = {
    id: session.id,
    date: dateKey(new Date(session.start)),
    name: session.name,
    routineId: session.routineId,
    start: session.start, end,
    notes: session.notes || '',
    exercises: session.exercises
      .map(e => ({ exId: e.exId, notes: e.notes || '', restSec: e.restSec,
                   sets: e.sets.filter(s => s.done).map(s => ({ w: Number(s.w) || 0, r: Number(s.r) || 0, type: s.type, secs: s.secs || null, dist: s.dist || null, mins: s.mins || null, done: true })) }))
      .filter(e => e.sets.length),
  };
  rec.volume = workoutVolume(rec);
  rec.sets = workoutSets(rec);
  rec.kcal = workoutKcal(rec);
  await db.put('workouts', rec);
  invalidate();

  session.active = false;
  clearInterval(tickTimer);
  stopRest();
  gymModeOff();
  focusLeave();
  await persist();
  $('#session').hidden = true;
  document.body.style.overflow = '';
  showMini(false);
  buzz(60); beep(880, 120); setTimeout(() => beep(1180, 160), 140);
  toast(`${t('workoutSaved')} · ${durLabel((end - rec.start) / 1000)}`, 'ok');
  window.dispatchEvent(new CustomEvent('data-changed'));

  /* What just happened, in facts — every one of them out of the database
     that was written a moment ago, which is the only kind پویا is allowed
     to speak from. Anything that cannot be worked out is simply left out. */
  let facts = null;
  try {
    const all = await history();
    /* The shape of the facts is pouya.js's business and is checked there;
       the weights are this file's, because kilograms or pounds is a
       setting. */
    facts = workoutFacts(rec, all, {
      volume: Math.round(kgToDisp(rec.volume || 0)),
      unit: wUnit(),
      prName: sessionPR?.name || '',
      prWeight: sessionPR ? round(kgToDisp(sessionPR.weight), 1) : 0,
    });
    const same = all.find((x) => x.id === facts.sameId);
    facts.lastVolume = same ? Math.round(kgToDisp(same.volume || 0)) : 0;
  } catch { facts = null; }
  sessionPR = null;

  showWorkoutDetail(rec, facts);
}

export async function cancelWorkout(skipConfirm = false) {
  if (!skipConfirm) {
    const ok = await confirmSheet(t('cancelWorkout'), t('cancelConfirm'));
    if (!ok) return;
  }
  session.active = false;
  session.exercises = [];
  clearInterval(tickTimer);
  stopRest();
  gymModeOff();
  focusLeave();
  await persist();
  $('#session').hidden = true;
  document.body.style.overflow = '';
  showMini(false);
}

/* ============================================================
   REST TIMER
   ============================================================ */
/* The session's heaviest new record, for پویا to mention at the end. */
let sessionPR = null;

let restEnd = 0, restTotal = 0, restTimer = null;
let countdownShownAt = 0;   // the last whole second the big 3-2-1 card repainted

export function startRest(sec) {
  restTotal = sec;
  restEnd = Date.now() + sec * 1000;
  countdownShownAt = 0;   // a new rest counts from its own numbers
  $('#rest-bar').hidden = false;
  clearInterval(restTimer);
  restTimer = setInterval(restTick, 250);
  import('./voice.js').then(v => v.onRestStart(restTotal, () => bumpRest(30))).catch(() => {});
  restTick();
}
function restTick() {
  const left = Math.max(0, (restEnd - Date.now()) / 1000);
  $('#rest-time').textContent = clock(left);
  $('#rest-fill').style.transform =
    `scaleX(${left / Math.max(1, restTotal)})`;
  import('./voice.js').then(v => v.onRestTick(left)).catch(() => {});
  /* the final four seconds count down on the screen itself, full size */
  if (focusEl && left > 0 && left <= 4) {
    const sec = Math.ceil(left);
    if (sec !== countdownShownAt) {
      countdownShownAt = sec;
      focusCountdown(sec);
    }
  }
  if (left <= 0) {
    stopRest();
    import('./voice.js').then(v => v.onRestEnd()).catch(() => {});
    buzz([90, 60, 90]); beep(760, 180); setTimeout(() => beep(1020, 220), 200);
    /* rest over → the choice card, not a silent return to the list */
    if (focusEl) focusRestOver();
  }
}
export function stopRest() {
  clearInterval(restTimer);
  $('#rest-bar').hidden = true;
}
export function bumpRest(sec) {
  restEnd += sec * 1000;
  restTotal = Math.max(restTotal, (restEnd - Date.now()) / 1000);
  restTick();
}

/* ============================================================
   FOCUS MODE 🎯 — one exercise at a time
   The whole session view becomes a single-exercise stage: the
   move figure centre-screen, that exercise's sets, the session
   clock up top and nothing else. After a set's rest runs out
   the screen asks: next exercise, or stay? A corner button
   keeps "next" reachable while staying. Per-exercise timers are
   gone on purpose — the clock and the person decide when to move.
   ============================================================ */
let focusEl = null, focusIdx = 0, focusCountdownEl = null;

function focusActive() { return !!focusEl; }

function focusEnter(startIdx = 0) {
  if (!session.active || focusEl) return;
  focusIdx = clamp(startIdx, 0, Math.max(0, session.exercises.length - 1));
  focusEl = el('div', { class: 'focus-mode' });
  document.body.append(focusEl);
  document.body.style.overflow = 'hidden';
  $('#session').style.visibility = 'hidden';
  drawFocus();
  toast(getLang() === 'fa' ? 'حالت تمرکز — هر حرکت، یک نما' : 'Focus mode — one exercise per view', 'ok');
}
function focusLeave() {
  if (!focusEl) return;
  focusEl.remove(); focusEl = null; focusCountdownEl = null;
  document.body.style.overflow = '';
  $('#session').style.visibility = '';
  renderSession();
}

/** Which exercise should be on stage: the first one with work left. */
function firstOpenIndex() {
  const i = session.exercises.findIndex(e => (e.sets || []).some(s => !s.done));
  return i === -1 ? 0 : i;
}

function drawFocus() {
  if (!focusEl) return;
  if (!session.active) { focusLeave(); return; }
  focusIdx = clamp(focusIdx, 0, session.exercises.length - 1);
  const ex = session.exercises[focusIdx];
  if (!ex) { focusLeave(); return; }
  const meta = exById(ex.exId);
  const type = meta?.type || 'wr';
  const moveId = moveFor(meta || {});
  const doneSets = (ex.sets || []).filter(s => s.done).length;
  const totalSets = (ex.sets || []).length;
  const fa = getLang() === 'fa';

  focusEl.replaceChildren();

  /* top: session clock + exit */
  const sec = (Date.now() - session.start) / 1000;
  focusEl.append(el('div', { class: 'focus-top' },
    el('button', { class: 'tb-btn', onclick: focusLeave, 'aria-label': 'close' }, '✕'),
    el('div', { class: 'focus-clock' },
      el('b', {}, clock(sec, sec >= 3600)),
      el('span', {}, t('focusTime'))),
    el('button', { class: 'tb-btn', id: 'focus-min', onclick: () => { focusLeave(); minimizeSession(); }, 'aria-label': 'minimize' }, '▾'),
  ));

  /* stage: the move figure, big, centre screen */
  const stage = el('div', { class: 'focus-stage' });
  if (moveId) {
    /* The body, performing it, and turnable while it does. The side view is
       the right drawing for a card you glance at; here someone is mid-set
       and wants to see the movement from their own angle, which is the one
       thing a drawing cannot give them. */
    const fig = body3d({ move: moveId, scale: 0.62, ms: 2800 });
    if (fig?.node) stage.append(fig.node);
    focusEl.addEventListener('focusstop', () => fig.dispose(), { once: true });
  } else {
    stage.append(el('div', { style: 'font-size:var(--t-5xl)' }, '🏋️'));
  }
  stage.append(el('div', { class: 'focus-hint' },
    moveId && MOVES[moveId] ? (fa ? MOVES[moveId].hint.fa : MOVES[moveId].hint.en) : ''));
  focusEl.append(stage);

  /* the exercise, its sets, nothing else */
  focusEl.append(el('div', { class: 'focus-head' },
    el('b', {}, exName(ex.exId)),
    ex.target ? el('span', { class: 'pr-tag' }, `${t('reps')} ${numText(ex.target)}`) : null,
    el('span', { class: 'focus-count' },
      `${t('focusSet')} ${num(Math.min(doneSets + 1, totalSets))} ${t('focusOf')} ${num(totalSets)}`),
  ));

  const tableHost = el('div', { class: 'focus-table' });
  const card = exerciseCard(ex, focusIdx);
  tableHost.append(card);
  focusEl.append(tableHost);

  /* bottom rail: previous / next exercise, add set lives in the card */
  focusEl.append(el('div', { class: 'focus-nav' },
    el('button', { class: 'btn ghost', disabled: focusIdx === 0 || null, onclick: () => { focusIdx--; countdownShownAt = 0; drawFocus(); } }, '→ ' + (fa ? 'قبلی' : 'Prev')),
    el('button', { class: 'btn', onclick: () => {
      const st = (ex.sets || []).find(s => !s.done);
      if (st) toggleSet(ex, focusIdx, st, ex.sets.indexOf(st));
      else if (focusIdx < session.exercises.length - 1) { focusIdx++; countdownShownAt = 0; drawFocus(); }
      else finishWorkout();
    } }, doneSets >= totalSets ? t('focusDone') : `✓ ${t('focusSet')} ${num(doneSets + 1)}`),
    el('button', { class: 'btn ghost', disabled: focusIdx === session.exercises.length - 1 || null, onclick: () => { focusIdx++; countdownShownAt = 0; drawFocus(); } }, (fa ? 'بعدی' : 'Next') + ' ←'),
  ));

  /* the corner "next exercise" — reachable while staying */
  if (focusIdx < session.exercises.length - 1) {
    focusEl.append(el('button', { class: 'focus-corner', onclick: () => { focusIdx++; countdownShownAt = 0; drawFocus(); } },
      (fa ? 'بعدی' : 'Next') + ' ⬅'));
  }
}

function focusRerender() { if (focusEl) drawFocus(); }

/** The big 3-2-1 during the last seconds of a set's rest. */
function focusCountdown(sec) {
  if (!focusEl) return;
  if (focusCountdownEl) focusCountdownEl.remove();
  focusCountdownEl = el('div', { class: 'focus-countdown' }, el('b', {}, num(sec)), el('span', {}, t('focusRest')));
  focusEl.append(focusCountdownEl);
  requestAnimationFrame(() => focusCountdownEl?.classList.add('pop'));
  buzz(15);
}

/** Rest over: the choice card only when the exercise is complete —
    a mid-exercise rest just returns to the stage, where the corner
    "next" button stays reachable for whoever wants to move on. */
function focusRestOver() {
  if (!focusEl) return;
  if (focusCountdownEl) { focusCountdownEl.remove(); focusCountdownEl = null; }
  const ex = session.exercises[focusIdx];
  const allDone = ex && (ex.sets || []).every(s => s.done);
  const hasNext = focusIdx < session.exercises.length - 1;
  const fa = getLang() === 'fa';
  if (!allDone) { drawFocus(); return; }
  if (!hasNext) {
    /* the last exercise just finished — offer ending the workout */
    const card = el('div', { class: 'focus-choice' },
      el('b', {}, fa ? 'همه‌ی حرکات تمام شد' : 'All exercises complete'),
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn', onclick: () => { card.remove(); finishWorkout(); } },
          '✓ ' + t('finish')),
        el('button', { class: 'btn ghost', onclick: () => card.remove() }, t('focusStay')),
      ));
    focusEl.append(card);
    requestAnimationFrame(() => card.classList.add('pop'));
    buzz(30);
    return;
  }
  const card = el('div', { class: 'focus-choice' },
    el('b', {}, fa ? 'این حرکت تمام شد' : 'Exercise complete'),
    el('div', { class: 'btn-row' },
      el('button', { class: 'btn', onclick: () => { card.remove(); focusIdx++; countdownShownAt = 0; drawFocus(); } },
        '⬅ ' + t('focusNext')),
      el('button', { class: 'btn ghost', onclick: () => card.remove() }, t('focusStay')),
    ));
  focusEl.append(card);
  requestAnimationFrame(() => card.classList.add('pop'));
  buzz(30);
}

/* ============================================================
   ROUTINES
   ============================================================ */

export async function getRoutines() {
  const rs = await db.all('routines');
  rs.sort((a, b) => (b.updated || 0) - (a.updated || 0));
  return rs;
}

/**
 * Routine editor.
 * @param existing  routine record to edit, or null for a new one
 * @param draft     internal — a working copy carried across the exercise picker
 */
export function openRoutineEditor(existing = null, draft = null) {
  const isEdit = !!existing;
  const r = draft || (existing ? JSON.parse(JSON.stringify(existing))
                               : { id: db.uid('r_'), name: '', ex: [], updated: Date.now() });
  const nameIn = input({ value: r.name, placeholder: getLang() === 'fa' ? 'مثلاً پوش A' : 'e.g. Push A' });
  const list = el('div', { class: 'list' });

  function draw() {
    list.replaceChildren();
    if (!r.ex.length) list.append(el('div', { class: 'empty' }, t('empty')));
    r.ex.forEach((x, i) => {
      const setsIn = input({ type: 'number', inputmode: 'numeric', value: x.sets, style: 'padding:8px;text-align:center' });
      const repsIn = input({ value: x.reps ?? '', placeholder: '8-12', style: 'padding:8px;text-align:center' });
      setsIn.oninput = () => x.sets = Math.max(1, parseNum(setsIn.value) || 1);
      repsIn.oninput = () => x.reps = repsIn.value;
      list.append(el('div', { class: 'li', style: 'flex-wrap:wrap' },
        el('div', { class: 'li-main', style: 'flex-basis:100%' },
          el('b', {}, exName(x.exId)),
          el('span', {}, `${pick(MUSCLES.find(m => m.id === exById(x.exId)?.muscle) || {})}`)),
        el('div', { style: 'display:flex;gap:7px;align-items:center;width:100%;margin-top:8px' },
          el('span', { class: 'muted', style: 'font-size:var(--t-sm);width:34px' }, t('sets')),
          el('div', { style: 'width:64px' }, setsIn),
          el('span', { class: 'muted', style: 'font-size:var(--t-sm);width:44px' }, t('reps')),
          el('div', { style: 'flex:1' }, repsIn),
          el('button', { class: 'tb-btn', onclick: () => { r.ex.splice(i, 1); draw(); } }, '✕'),
        ),
        el('div', { style: 'display:flex;gap:6px;width:100%;margin-top:6px' },
          el('button', { class: 'chip', disabled: i === 0 || null, onclick: () => { [r.ex[i - 1], r.ex[i]] = [r.ex[i], r.ex[i - 1]]; draw(); } }, '↑'),
          el('button', { class: 'chip', disabled: i === r.ex.length - 1 || null, onclick: () => { [r.ex[i + 1], r.ex[i]] = [r.ex[i], r.ex[i + 1]]; draw(); } }, '↓'),
        ),
      ));
    });
  }
  draw();

  const body = el('div', {},
    field(t('name'), nameIn),
    el('button', { class: 'btn ghost full', style: 'margin-bottom:12px', onclick: () => {
      r.name = nameIn.value;
      openExercisePicker(ids => {
        ids.forEach(id => r.ex.push({ exId: id, sets: 3, reps: '8-12', restSec: S.settings.restDefault }));
        setTimeout(() => openRoutineEditor(existing, r), 60);
      });
    } }, '+ ' + t('addExercise')),
    list,
    el('div', { class: 'btn-row', style: 'margin-top:14px' },
      isEdit ? el('button', { class: 'btn danger ghost', onclick: async () => {
        closeSheet();
        if (await confirmSheet(t('deleteRoutine'), r.name)) {
          await db.del('routines', r.id); toast(t('deleted'));
          window.dispatchEvent(new CustomEvent('data-changed'));
        }
      } }, t('delete')) : null,
      el('button', { class: 'btn', onclick: async () => {
        r.name = nameIn.value.trim() || (getLang() === 'fa' ? 'برنامه' : 'Routine');
        if (!r.ex.length) return toast(t('empty'), 'err');
        r.updated = Date.now();
        await db.put('routines', r);
        closeSheet(); toast(t('saved'), 'ok');
        window.dispatchEvent(new CustomEvent('data-changed'));
      } }, t('save')),
    ),
  );
  sheet(isEdit ? t('editRoutine') : t('new'), body);
}

export async function startTemplate(tpl, dayIdx = 0) {
  const day = tpl.days[dayIdx];
  await startWorkout({
    id: null,
    name: `${pick(tpl)} · ${pick(day)}`,
    ex: day.ex.map(([exId, sets, reps]) => ({ exId, sets, reps, restSec: S.settings.restDefault })),
  });
}

export async function saveTemplateAsRoutines(tpl) {
  for (const day of tpl.days) {
    await db.put('routines', {
      id: db.uid('r_'),
      name: `${pick(tpl)} · ${pick(day)}`,
      ex: day.ex.map(([exId, sets, reps]) => ({ exId, sets, reps, restSec: S.settings.restDefault })),
      updated: Date.now(),
    });
  }
  toast(t('saved'), 'ok');
  window.dispatchEvent(new CustomEvent('data-changed'));
}

/* ============================================================
   TRAIN SCREEN RENDERING
   ============================================================ */

/** Roughly how long a routine takes: work plus the rest between sets. */
function routineMinutes(r) {
  const WORK_PER_SET = 42;                    /* seconds actually under the bar */
  let seconds = 0, sets = 0;
  for (const x of r.ex || []) {
    const n = x.sets || 3;
    sets += n;
    /* every set is worked; only the gaps BETWEEN them are rested through */
    seconds += n * WORK_PER_SET + Math.max(0, n - 1) * (x.restSec || S.settings.restDefault);
  }
  /* the walk between machines, once per exercise */
  seconds += (r.ex?.length || 0) * 45;
  return { minutes: Math.round(seconds / 60), sets };
}

/* Fourteen muscle groups cannot be given fourteen distinguishable colours - the
   palette validator puts the ceiling at three on a dark surface. They are
   grouped into the three families a lifter already thinks in, which reads
   better than naming every head of every muscle anyway. */
const MUSCLE_FAMILY = {
  chest: 'upper', back: 'upper', shoulders: 'upper', biceps: 'upper',
  triceps: 'upper', forearms: 'upper', traps: 'upper',
  quads: 'lower', hamstrings: 'lower', glutes: 'lower', calves: 'lower',
  abs: 'core', cardio: 'core', fullbody: 'core',
};
const FAMILY_NAME = {
  upper: { fa: 'بالاتنه', en: 'Upper body' },
  lower: { fa: 'پایین‌تنه', en: 'Lower body' },
  core:  { fa: 'مرکزی و هوازی', en: 'Core & cardio' },
};

/** Which families a routine trains, most-worked first, with their share. */
function routineFamilies(r) {
  const sets = new Map();
  let total = 0;
  for (const x of r.ex || []) {
    const fam = MUSCLE_FAMILY[exById(x.exId)?.muscle];
    if (!fam) continue;
    const n = x.sets || 3;
    sets.set(fam, (sets.get(fam) || 0) + n);
    total += n;
  }
  return [...sets.entries()].sort((a, b) => b[1] - a[1]).map(([id, n]) => ({
    id,
    label: getLang() === 'fa' ? FAMILY_NAME[id].fa : FAMILY_NAME[id].en,
    share: total ? n / total : 0,
  }));
}

function agoLabel(ts) {
  if (!ts) return null;
  const days = Math.floor((Date.now() - ts) / 86400000);
  if (days <= 0) return t('today');
  if (days === 1) return t('yesterday');
  return getLang() === 'fa' ? `${num(days)} روز پیش` : `${days} days ago`;
}

/* ---------------- the training month ---------------- */

/** A date's parts in the calendar the app is showing, in Latin digits. */
function calParts(date) {
  const loc = getLang() === 'fa' ? 'fa-IR-u-nu-latn' : 'en-US';
  const p = new Intl.DateTimeFormat(loc, { year: 'numeric', month: 'numeric', day: 'numeric' })
    .formatToParts(date);
  const get = (t) => Number(p.find(x => x.type === t)?.value);
  return { y: get('year'), m: get('month'), d: get('day') };
}

const sameMonth = (a, b) => a.y === b.y && a.m === b.m;
const dayKeyOf = (date) => {
  const z = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return z.toISOString().slice(0, 10);
};

/**
 * Every day of the month containing `seed`.
 *
 * Walked day by day from the seed rather than calculated, because the month
 * being walked is Persian and its length is what Intl says it is.
 */
function monthDays(seed) {
  const target = calParts(seed);
  let first = new Date(seed);
  for (let i = 0; i < 40 && sameMonth(calParts(new Date(first.getTime() - 86400000)), target); i++) {
    first = new Date(first.getTime() - 86400000);
  }
  const days = [];
  let cur = new Date(first);
  while (sameMonth(calParts(cur), target) && days.length < 40) {
    days.push(new Date(cur));
    cur = new Date(cur.getTime() + 86400000);
  }
  return days;
}

/** How many days in a row, ending today or yesterday, had a workout. */
function streakOf(trainedKeys) {
  let n = 0;
  let cur = new Date();
  if (!trainedKeys.has(dayKeyOf(cur))) {
    cur = new Date(cur.getTime() - 86400000);      /* today may not be over yet */
    if (!trainedKeys.has(dayKeyOf(cur))) return 0;
  }
  while (trainedKeys.has(dayKeyOf(cur)) && n < 400) {
    n += 1;
    cur = new Date(cur.getTime() - 86400000);
  }
  return n;
}

let calSeed = new Date();

export async function renderTrainCalendar() {
  const host = $('#train-calendar');
  if (!host) return;
  host.replaceChildren();

  const all = await history();   /* the module-local name; allWorkouts is its export */
  const byDay = new Map();
  for (const w of all) {
    const list = byDay.get(w.date) || [];
    list.push(w);
    byDay.set(w.date, list);
  }
  const trainedKeys = new Set(byDay.keys());

  const days = monthDays(calSeed);
  /* Month then year. The locale's own yMMMM pattern puts the year first here,
     which is not how Persian writes a date. */
  const monthParts = new Intl.DateTimeFormat(getLang() === 'fa' ? 'fa-IR' : 'en-US',
    { month: 'long', year: 'numeric' }).formatToParts(days[0] || calSeed);
  const monthPart = (type) => monthParts.find(x => x.type === type)?.value || '';
  const monthLabel = `${monthPart('month')} ${monthPart('year')}`;

  const step = (delta) => {
    /* 20 days lands inside the neighbouring month whatever its length */
    calSeed = new Date(calSeed.getTime() + delta * 20 * 86400000);
    renderTrainCalendar();
  };

  host.append(el('div', { class: 'cal-head' },
    el('button', { class: 'cal-nav', onclick: () => step(-1) }, '‹'),
    el('b', {}, monthLabel),
    el('button', { class: 'cal-nav', onclick: () => step(1) }, '›')));

  /* weekday letters, in the order this calendar starts its week */
  const letters = getLang() === 'fa'
    ? [['ش', 6], ['ی', 0], ['د', 1], ['س', 2], ['چ', 3], ['پ', 4], ['ج', 5]]
    : [['S', 0], ['M', 1], ['T', 2], ['W', 3], ['T', 4], ['F', 5], ['S', 6]];
  host.append(el('div', { class: 'cal-grid cal-dow' },
    ...letters.map(([ch]) => el('span', {}, ch))));

  const grid = el('div', { class: 'cal-grid' });
  /* blanks so the first day lands under its own weekday */
  const firstCol = letters.findIndex(([, wd]) => wd === (days[0]?.getDay() ?? 0));
  for (let i = 0; i < Math.max(0, firstCol); i++) grid.append(el('span', { class: 'cal-blank' }));

  const todayKeyStr = dayKeyOf(new Date());
  let monthCount = 0;

  for (const date of days) {
    const key = dayKeyOf(date);
    const list = byDay.get(key) || [];
    const sets = list.reduce((a, w) => a + (w.sets || 0), 0);
    if (list.length) monthCount += 1;

    /* one hue, four steps: this is magnitude, not identity */
    const level = !list.length ? 0 : sets >= 20 ? 3 : sets >= 12 ? 2 : 1;
    const cell = el('button', {
      class: 'cal-day' + (key === todayKeyStr ? ' today' : ''),
      dataset: { level: String(level) },
      title: list.length ? list.map(w => w.name).join('، ') : '',
      onclick: () => openCalendarDay(key, list),
    }, num(calParts(date).d));
    /* A day in the future has not happened yet; every past day can be asked. */
    if (key > todayKeyStr) cell.disabled = true;
    grid.append(cell);
  }
  host.append(grid);

  const streak = streakOf(trainedKeys);
  host.append(el('div', { class: 'cal-foot' },
    el('span', {}, `${t('thisMonth')}: ${num(monthCount)} ${t('workouts')}`),
    streak > 1 ? el('b', { class: 'streak-line' },
      icon('flame', { size: 15, cls: 'ic-lift' }),
      el('em', {}, `${num(streak)} ${t('dayStreak')}`)) : null));
}

/**
 * Everything one day held, from the training calendar.
 *
 * A day is not a shortcut to its first workout: someone who lifts in the
 * morning and runs in the evening could not reach the evening at all. And an
 * empty day is a real question with a real answer, so it opens too.
 */
async function openCalendarDay(key, list) {
  const fa = getLang() === 'fa';
  const body = el('div', {});

  if (list.length) {
    body.append(el('div', { class: 'day-sec' }, t('workouts')));
    for (const w of list) {
      body.append(el('button', {
        class: 'day-row',
        onclick: () => { closeSheet(); showWorkoutDetail(w); },
      },
        el('span', { class: 'day-ic' }, icon('dumbbell', { size: 18, cls: 'ic-lift' })),
        el('div', {},
          el('b', {}, w.name || t('workout')),
          el('span', {}, [
            `${num(w.sets || 0)} ${t('muscleSetsShort')}`,
            w.volume ? `${num(Math.round(kgToDisp(w.volume)))}${wUnit()}` : null,
            w.durationSec ? clock(w.durationSec) : null,
          ].filter(Boolean).join(' · '))),
        el('i', { class: 'sh-arrow' }, fa ? '‹' : '›')));
    }
  }

  /* What else the day held. Read, never invented: a day with no food logged
     says so rather than showing a zero that looks like a fast. */
  const [logs, weight] = await Promise.all([
    nutritionFor(key),
    db.get('weights', key),
  ]);

  const facts = [];
  if (logs) {
    facts.push([icon('flame', { size: 16 }), num(Math.round(logs.kcal)), t('kcal')]);
    facts.push([icon('meat', { size: 16 }),
      `${num(Math.round(logs.protein))}${fa ? ' گرم' : 'g'}`, t('protein')]);
  }
  if (weight) facts.push([icon('scale', { size: 16 }),
    `${num(round(kgToDisp(weight.kg), 1), 1)} ${wUnit()}`, t('weight')]);

  if (facts.length) {
    body.append(el('div', { class: 'day-sec' }, t('theDay')));
    body.append(el('div', { class: 'day-facts' }, ...facts.map(([ic, value, label]) =>
      el('div', { class: 'day-fact' }, ic, el('b', {}, value), el('span', {}, label)))));
  }

  if (!list.length && !facts.length) {
    body.append(emptyArt('calendar', t('nothingThisDay'), t('nothingThisDayHint'), 'var(--tx3)'));
  }

  sheet(longDate(key), body);
}

/** The day's totals, or null when nothing was logged that day. */
async function nutritionFor(key) {
  const logs = await db.byIndex('foodLogs', 'date', key);
  if (!logs.length) return null;
  const add = (f) => logs.reduce((n, l) => n + (Number(l[f]) || 0), 0);
  return { kcal: add('kcal'), protein: add('protein') };
}

export async function renderRoutines() {
  const host = $('#routine-list');
  host.replaceChildren();
  const rs = await getRoutines();
  if (!rs.length) host.append(emptyArt('clipboard', t('empty'),
    getLang() === 'fa' ? 'با ویزارد بالا یکی بساز' : 'Build one with the wizard above', 'var(--blue)'));

  /* when each routine was last actually done */
  const history = await db.all('workouts');
  const lastDone = new Map();
  for (const w of history) {
    if (!w.routineId) continue;
    const at = w.start || 0;
    if (at > (lastDone.get(w.routineId) || 0)) lastDone.set(w.routineId, at);
  }

  rs.forEach(r => {
    const { minutes, sets } = routineMinutes(r);
    const families = routineFamilies(r);
    const ago = agoLabel(lastDone.get(r.id));

    const stat = (value, label) => el('div', { class: 'rc-stat' },
      el('b', {}, value), el('span', {}, label));

    host.append(el('div', { class: 'routine-card', onclick: () => routineMenu(r) },
      el('div', { class: 'rc-head' },
        el('b', {}, r.name),
        ago ? el('span', { class: 'rc-ago' }, ago) : el('span', { class: 'rc-ago new' }, t('neverDone'))),

      families.length ? el('div', { class: 'rc-families' },
        /* a bar showing how the sets are split, then the same families named -
           the label is what carries identity, the colour only reinforces it */
        el('div', { class: 'rc-split' },
          ...families.map(f => el('i', { dataset: { fam: f.id },
            style: `flex:${Math.max(1, Math.round(f.share * 100))}` }))),
        el('div', { class: 'rc-chips' },
          ...families.map(f => el('span', { class: 'rc-chip', dataset: { fam: f.id } },
            el('i', {}), f.label,
            el('b', {}, `${num(Math.round(f.share * 100))}٪`)))),
      ) : null,

      el('div', { class: 'rc-stats' },
        stat(num(r.ex.length), t('exercises')),
        stat(num(sets), t('sets')),
        stat('~' + num(minutes), t('minutes'))),

      el('button', { class: 'btn rc-start', onclick: (e) => {
        e.stopPropagation(); startWorkout({ ...r, routineId: r.id });
      } }, lineIcon('play', { size: 17 }), t('startRoutine')),
    ));
  });

  const th = $('#template-list');
  th.replaceChildren();
  TEMPLATES.forEach(tp => th.append(el('div', { class: 'li', onclick: () => templateMenu(tp) },
    el('div', { class: 'li-main' },
      el('b', {}, pick(tp)),
      el('span', {}, pick(tp, 'desc'))),
    el('div', { class: 'li-end' }, el('b', {}, num(tp.days.length)), el('span', {}, t('workouts'))),
  )));
}

function routineMenu(r) {
  const body = el('div', { class: 'list' },
    el('button', { class: 'btn full', onclick: () => { closeSheet(); startWorkout({ ...r, routineId: r.id }); } }, t('startRoutine')),
    el('button', { class: 'btn ghost full', onclick: () => { closeSheet(); openRoutineEditor(r); } }, t('editRoutine')),
    el('hr', { class: 'sep' }),
    ...r.ex.map(x => el('div', { class: 'li' },
      el('div', { class: 'li-main' }, el('b', {}, exName(x.exId))),
      el('div', { class: 'li-end' },
        el('b', {}, `${num(x.sets)} × ${x.reps ? numText(x.reps) : '—'}`)))),
  );
  sheet(r.name, body);
}

function templateMenu(tp) {
  const body = el('div', {},
    el('div', { class: 'info' }, pick(tp, 'desc')),
    ...tp.days.map((d, i) => el('div', { class: 'li' },
      el('div', { class: 'li-main' },
        el('b', {}, pick(d)),
        el('span', {}, d.ex.map(([id]) => exName(id)).slice(0, 3).join('، ') + (d.ex.length > 3 ? ' …' : ''))),
      el('button', { class: 'btn sm', onclick: () => { closeSheet(); startTemplate(tp, i); } }, t('start')),
    )),
    el('button', { class: 'btn full', style: 'margin-top:14px', onclick: () => { closeSheet(); saveTemplateAsRoutines(tp); } }, t('saveAsRoutine')),
  );
  sheet(pick(tp), body);
}

export async function renderHistory() {
  const hs = await history();
  $('#h-count').textContent = num(hs.length);
  $('#h-vol').textContent = num(Math.round(kgToDisp(sum(hs, w => w.volume || workoutVolume(w))))) + ' ' + wUnit();
  $('#h-time').textContent = durLabel(sum(hs, w => ((w.end || w.start) - w.start) / 1000));

  const host = $('#workout-history');
  host.replaceChildren();
  if (!hs.length) { host.append(emptyArt('dumbbell', t('empty'), '', 'var(--blue)')); return; }
  hs.slice(0, 60).forEach(w => host.append(el('div', { class: 'li', onclick: () => showWorkoutDetail(w) },
    el('div', { class: 'li-main' },
      el('b', {}, w.name),
      el('span', {}, `${longDate(w.date)} · ${durLabel(((w.end || w.start) - w.start) / 1000)} · ${countLabel(w.sets || workoutSets(w), 'set')}`)),
    el('div', { class: 'li-end' },
      el('b', {}, num(Math.round(kgToDisp(w.volume || workoutVolume(w))))),
      el('span', {}, wUnit())),
  )));
}

export function showWorkoutDetail(w, justFinished = null) {
  /* Only when the workout has this second been saved. Opening a workout
     from June to look at it is not an occasion for congratulation. */
  const said = justFinished ? afterWorkout(justFinished, (v) => num(v)) : null;
  const pouya = said
    ? pouyaCard({ line: getLang() === 'fa' ? said.fa : said.en, mood: said.mood,
      fa: getLang() === 'fa' })
    : null;

  const body = el('div', {},
    pouya?.node || null,
    el('div', { class: 'card summary-bar', style: 'margin-bottom:14px' },
      el('div', {}, el('b', {}, durLabel(((w.end || w.start) - w.start) / 1000)), el('span', {}, t('duration'))),
      el('div', {}, el('b', {}, num(Math.round(kgToDisp(w.volume || workoutVolume(w)))) + wUnit()), el('span', {}, t('volume'))),
      el('div', {}, el('b', {}, num(w.sets || workoutSets(w))), el('span', {}, t('sets'))),
      el('div', {}, el('b', {}, num(w.kcal || 0)), el('span', {}, t('kcal'))),
    ),
    ...(w.exercises || []).map(e => {
      const meta = exById(e.exId);
      const rows = e.sets.map((s, i) => {
        let txt;
        if (meta?.type === 'd') txt = `${num(s.secs || 0)} ${t('sec')}`;
        else if (meta?.type === 'dd') txt = `${num(s.dist || 0)} km · ${num(s.mins || 0)} ${t('min')}`;
        else if (meta?.type === 'r') txt = `${num(s.r)} ${t('reps')}`;
        else txt = `${num(round(kgToDisp(s.w), 1))} ${wUnit()} × ${num(s.r)}`;
        const ty = SET_TYPES[s.type];
        return el('div', { class: 'kv' },
          el('span', {}, `${t('sets')} ${num(i + 1)}${ty?.short ? ' (' + ty.short + ')' : ''}`),
          el('b', {}, txt));
      });
      return el('div', { class: 'card' },
        el('div', { class: 'card-head' }, el('h3', { style: 'color:var(--acc)' }, exName(e.exId))),
        ...rows,
        e.notes ? el('div', { class: 'muted', style: 'margin-top:8px' }, e.notes) : null);
    }),
    el('button', { class: 'btn danger ghost full', style: 'margin-top:10px', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('confirmDelete'), w.name)) {
        await db.del('workouts', w.id); invalidate(); toast(t('deleted'));
        window.dispatchEvent(new CustomEvent('data-changed'));
      }
    } }, t('delete')),
  );
  sheet(w.name + ' · ' + shortDate(w.date), body, { onClose: () => pouya?.dispose() });
}

export async function renderExerciseList() {
  const host = $('#exercise-list');
  const q = $('#ex-search').value;
  const active = $('#ex-filters .chip.on')?.dataset.m || 'all';
  host.replaceChildren();
  const res = searchEx(q, active);
  const recs = await records();
  if (!res.length) { host.append(el('div', { class: 'empty' }, t('empty'))); return; }
  res.slice(0, 250).forEach(e => {
    const r = recs[e.id];
    host.append(el('div', { class: 'li', onclick: () => exerciseDetail(e, r) },
      el('div', { class: 'li-main' },
        el('b', {}, pick(e)),
        el('span', {}, `${pick(MUSCLES.find(m => m.id === e.muscle) || {})} · ${pick(EQUIPMENT.find(x => x.id === e.equip) || {})}`)),
      r ? el('div', { class: 'li-end' },
        el('b', {}, num(round(kgToDisp(r.maxW), 1))),
        el('span', {}, wUnit() + ' ' + t('prShort'))) : null,
    ));
  });
}

/**
 * Everything the workouts say about one muscle.
 *
 * Opened by tapping the body. Counting only - no model, no network, and
 * nothing claimed that the training log does not actually contain.
 */
export async function openMuscleSheet(muscle) {
  const info = MUSCLES.find((m) => m.id === muscle);
  if (!info) return;
  const ws = await history();
  const index = {};
  for (const w of ws) for (const x of w.exercises || []) {
    const e = exById(x.exId);
    if (e) index[x.exId] = e;
  }
  const r = muscleStats(ws, index)[muscle];
  const fa = getLang() === 'fa';

  /* how long ago, in words rather than a date */
  const ago = r.daysSince === null ? null
    : r.daysSince === 0 ? t('today')
    : r.daysSince === 1 ? t('yesterday')
    : `${num(r.daysSince)} ${t('daysAgo')}`;

  const key = recencyOf(r.daysSince);
  const RECENCY_TEXT = {
    justTrained: 'recJustTrained', trainedRecently: 'recTrainedRecently',
    aWhileAgo: 'recAWhileAgo', longAgo: 'recLongAgo', untrained: 'recUntrained',
  };

  const stat = (value, label) => el('div', { class: 'ms-stat' },
    el('b', {}, value), el('span', {}, label));

  const body = el('div', { class: 'ms-body' },
    /* the figure, with this muscle alone picked out */
    el('div', { class: 'ms-fig' },
      bodyMap({ focus: muscle, selected: [muscle], view: sideOf(muscle) })),

    /* what the log says about how recently */
    el('div', { class: 'ms-recency', style: `--tone:${RECENCY_TONE[key]}` },
      el('b', {}, t(RECENCY_TEXT[key])),
      ago ? el('span', {}, `${t('muscleLastTrained')}: ${ago}`) : null),

    r.sets30 ? el('div', { class: 'ms-stats' },
      stat(num(r.sets7), t('muscleWeekSets')),
      stat(num(r.sessions7), t('muscleWeekSessions')),
      stat(num(r.sets30), t('muscleMonthSets')),
    ) : null,

    /* the trend, only when there is a week before this one to compare to */
    r.volumeTrend === null ? null
      : el('div', { class: 'ms-trend' + (r.volumeTrend >= 0 ? ' up' : ' down') },
          el('b', {}, (r.volumeTrend >= 0 ? '+' : '\u2212') + num(Math.abs(r.volumeTrend)) + '%'),
          el('span', {}, t('muscleTrend'))),

    r.byExercise.length
      ? el('div', { class: 'ms-list' },
          el('h4', {}, t('muscleExercises')),
          ...r.byExercise.slice(0, 6).map((e) => el('div', { class: 'ms-ex' },
            el('b', {}, e.name),
            el('span', {}, `${num(e.sets)} ${t('muscleSetsShort')}`
              + (e.topWeight ? ` \u00b7 ${num(round(kgToDisp(e.topWeight), 1))}${wUnit()}` : '')))))
      : el('div', { class: 'empty' }, t('muscleNoData')),

    el('div', { class: 'ms-note' }, t('recencyNote')),

    el('button', { class: 'btn full', style: 'margin-top:14px', onclick: () => {
      closeSheet();
      window.dispatchEvent(new CustomEvent('show-muscle-exercises', { detail: muscle }));
    } }, fa ? `حرکت‌های ${pick(info)}` : `${pick(info)} exercises`),
  );

  sheet(pick(info), body);
}

/** The side a muscle shows best from, so the sheet opens on the right view. */
function sideOf(muscle) {
  return ['back', 'triceps', 'glutes', 'hamstrings', 'traps'].includes(muscle)
    ? 'back' : 'front';
}

export function buildExerciseFilters() {
  const host = $('#ex-filters');
  host.replaceChildren();

  const select = (id) => {
    $$('#ex-filters .chip').forEach(x => x.classList.toggle('on', x.dataset.m === id));
    drawPicker(id);
    renderExerciseList();
  };

  /* The chips stay: they are still the fastest way to reach "all", and they
     name the muscles for anyone who would rather read than aim. */
  MUSCLES.forEach((m, i) => {
    host.append(el('button', {
      class: 'chip' + (i === 0 ? ' on' : ''), dataset: { m: m.id },
      onclick: () => select(m.id),
    }, pick(m)));
  });

  /* And the body, because a list organised by muscle is most naturally
     indexed by pointing at one. */
  const picker = $('#ex-body');
  if (!picker) return;

  /* What the figure glows with: the same seven-day set counts the muscle
     sheet reads, so the body and the numbers can never disagree.

     Fetched alongside rather than awaited: buildExerciseFilters is called
     from several places and making it async would make every one of their
     timings a question. The body appears at once and lights when the counts
     arrive, which is better than a body that arrives late. */
  let heat = {};
  const figures = new Set();
  history().then((hs) => {
    heat = heatFrom(muscleStats(hs, EX_INDEX));
    for (const f of figures) f.setHeat(heat);
  });

  /* Tapping the muscle you are already filtered to asks about it rather than
     toggling back to "all" - the chips are there for that, and the second tap
     is the one that means "tell me more". */
  const pick3d = (m) => (m === currentMuscle() ? openMuscleSheet(m) : select(m));

  function drawPicker(id) {
    picker.replaceChildren(
      el('div', { class: 'body-view seg tight' },
        ...[['3d', t('view3d')], ['flat', t('viewFlat')]].map(([mode, label]) =>
          el('button', {
            class: 'seg-btn' + (bodyView === mode ? ' active' : ''),
            onclick: () => { if (bodyView !== mode) { bodyView = mode; drawPicker(currentMuscle()); } },
          }, label))),
    );

    if (bodyView === '3d') {
      const fig = body3d({ heat, onPick: pick3d, scale: 0.94 });
      for (const old of figures) old.dispose?.();   /* stop its idle drift */
      figures.clear();                 /* only the one on screen matters */
      figures.add(fig);
      fig.node.append(el('div', { class: 'b3d-hint' }, t('turnHint')));
      fig.node.setAttribute('aria-label', t('bodyFigureLabel'));
      picker.append(fig.node);
      return;
    }
    for (const old of figures) old.dispose?.();
    figures.clear();

    picker.append(bodyMap({
      selected: id && id !== 'all' ? [id] : [],
      focus: id !== 'all' ? id : null,
      heat,
      onPick: pick3d,
    }));
  }
  drawPicker('all');
}

/* Which body the exercises tab is showing. Remembered for the session: it is
   a preference about how you like to look at a body, not about this visit. */
let bodyView = '3d';

/** Filter the exercise list to a muscle, once the shell has shown the tab. */
export function filterToMuscle(muscle) {
  const b = $(`#ex-filters .chip[data-m="${muscle}"]`);
  if (b) b.click();
}

/** Which muscle the exercise list is filtered to right now. */
const currentMuscle = () => $('#ex-filters .chip.on')?.dataset.m || 'all';

async function exerciseDetail(e, rec) {
  const hs = await history();
  const points = [];
  for (const w of hs.slice().reverse()) {
    const ent = (w.exercises || []).find(x => x.exId === e.id);
    if (!ent) continue;
    const best = Math.max(0, ...ent.sets.filter(s => s.type !== 'w').map(s => e1rm(s.w, s.r)));
    if (best) points.push({ x: shortDate(w.date), y: round(kgToDisp(best), 1) });
  }
  const chart = el('div', { class: 'chart' });

  /* What the movement looks like, before anything else. Someone opening an
     exercise they have not done is asking exactly that, and the sheet used to
     answer with a muscle name and a chart of one-rep maxes.

     It is labelled as the pattern it is: "Press" under a dumbbell shoulder
     press is true, and a drawing claiming to *be* that exercise would not be. */
  const moveId = moveFor(e);
  const move = moveId ? MOVES[moveId] : null;
  /* The same body the focus screen performs on, because the side-view
     drawing does not know what a bench is: it would draw the chest press
     that opens this sheet standing upright, which is the thing that had to
     be fixed everywhere else. */
  const figure = moveId
    ? body3d({ move: moveId, scale: 0.42, ms: 2800, load: true })
    : null;
  const movePanel = figure?.node ? el('div', { class: 'mv-card mv-card-3d' },
    figure.node,
    el('span', { class: 'mv-name' }, getLang() === 'fa' ? move.fa : move.en),
    el('span', { class: 'mv-hint' }, getLang() === 'fa' ? move.hint.fa : move.hint.en),
    el('span', { class: 'mv-note' }, t('movePatternNote')),
  ) : null;

  const body = el('div', {},
    movePanel,
    el('div', { class: 'info' },
      `${pick(MUSCLES.find(m => m.id === e.muscle) || {})} · ${pick(EQUIPMENT.find(x => x.id === e.equip) || {})}`),
    rec ? el('div', { class: 'card summary-bar' },
      el('div', {}, el('b', {}, num(round(kgToDisp(rec.maxW), 1)) + wUnit()), el('span', {}, t('bestSet'))),
      el('div', {}, el('b', {}, num(round(kgToDisp(rec.best1rm), 1)) + wUnit()), el('span', {}, t('est1rm'))),
      el('div', {}, el('b', {}, num(points.length)), el('span', {}, t('workouts'))),
    ) : el('div', { class: 'empty' }, t('empty')),
    points.length > 1 ? el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, t('est1rm'))), chart) : null,
    session.active ? el('button', { class: 'btn full', onclick: () => {
      closeSheet();
      session.exercises.push({ exId: e.id, notes: '', restSec: S.settings.restDefault,
        sets: [{ w: '', r: '', type: 'n', done: false }] });
      persist(); renderSession(); openSessionView();
    } }, t('addExercise')) : null,
    !e.builtin ? el('button', { class: 'btn danger ghost full', style: 'margin-top:10px', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('confirmDelete'), pick(e))) {
        await db.del('exercises', e.id); await loadExercises(); renderExerciseList(); toast(t('deleted'));
      }
    } }, t('delete')) : null,
  );
  sheet(pick(e), body, { onClose: () => figure?.dispose() });
  if (points.length > 1) {
    const { lineChart } = await import('./ui.js');
    lineChart(chart, points.slice(-14), { color: '#3ddc84' });
  }
}

export function openCreateExercise() {
  const nEn = input({ placeholder: 'Cable Y-Raise' });
  const nFa = input({ placeholder: 'نشر Y سیم‌کش' });
  const mus = select(MUSCLES.filter(m => m.id !== 'all').map(m => ({ value: m.id, label: pick(m) })), 'chest');
  const eqp = select(EQUIPMENT.map(m => ({ value: m.id, label: pick(m) })), 'dumbbell');
  const typ = select([
    { value: 'wr', label: getLang() === 'fa' ? 'وزن × تکرار' : 'Weight × reps' },
    { value: 'r',  label: getLang() === 'fa' ? 'فقط تکرار' : 'Reps only' },
    { value: 'd',  label: getLang() === 'fa' ? 'زمان' : 'Duration' },
    { value: 'dd', label: getLang() === 'fa' ? 'مسافت + زمان' : 'Distance + time' },
  ], 'wr');
  const body = el('div', {},
    field(t('exerciseName') + ' (EN)', nEn),
    field(t('exerciseName') + ' (فا)', nFa),
    field(t('muscle'), mus),
    field(t('equipment'), eqp),
    field(t('setType'), typ),
    el('button', { class: 'btn full', onclick: async () => {
      const name = nEn.value.trim() || nFa.value.trim();
      if (!name) return toast(t('error'), 'err');
      await db.put('exercises', {
        id: db.uid('ce_'), name, nameFa: nFa.value.trim() || name,
        muscle: mus.value, equip: eqp.value, type: typ.value, builtin: false,
      });
      await loadExercises();
      closeSheet(); toast(t('saved'), 'ok'); renderExerciseList();
    } }, t('save')),
  );
  sheet(t('new'), body);
}

export { invalidate as invalidateHistory, history as allWorkouts };
