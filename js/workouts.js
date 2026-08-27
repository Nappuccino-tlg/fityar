/* ============ Training: exercises, routines, live session, history ============ */
import * as db from './db.js';
import { S, e1rm, kgToDisp, dispToKg, wUnit, workoutKcal } from './store.js';
import { t, num, pick, getLang, countLabel } from './i18n.js';
import {
  $, $$, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, sum, parseNum, clock, durLabel, todayKey, dateKey, shortDate, longDate,
  buzz, beep,
} from './ui.js';
import { EXERCISES, EX_INDEX, MUSCLES, EQUIPMENT, TEMPLATES } from './data-exercises.js';
import { emptyArt } from './art.js';

const SET_TYPES = {
  n: { key: 'n', label: 'normalSet', short: '', cls: '' },
  w: { key: 'w', label: 'warmup',    short: 'W', cls: 'warm' },
  d: { key: 'd', label: 'dropSet',   short: 'D', cls: 'drop' },
  f: { key: 'f', label: 'failure',   short: 'F', cls: 'fail' },
};

/* ---------------- exercise catalog ---------------- */

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

/** Personal records per exercise: heaviest weight and best estimated 1RM. */
export async function records() {
  const hs = await history();
  const rec = {};
  for (const w of hs) {
    for (const e of w.exercises || []) {
      for (const s of e.sets || []) {
        if (!s.done || s.type === 'w') continue;
        const wt = Number(s.w) || 0, rp = Number(s.r) || 0;
        if (!rp) continue;
        const r = (rec[e.exId] ||= { exId: e.exId, maxW: 0, best1rm: 0, maxVol: 0, date: w.date, reps: 0 });
        if (wt > r.maxW) { r.maxW = wt; r.reps = rp; r.date = w.date; }
        const est = e1rm(wt, rp);
        if (est > r.best1rm) r.best1rm = est;
        if (wt * rp > r.maxVol) r.maxVol = wt * rp;
      }
    }
  }
  return rec;
}

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
}

export async function startWorkout(routine = null) {
  if (session.active) { openSessionView(); return; }
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
    host.append(el('div', { class: 'empty' }, getLang() === 'fa' ? 'یک حرکت اضافه کنید تا شروع شود' : 'Add an exercise to begin'));
  }
  session.exercises.forEach((ex, xi) => host.append(exerciseCard(ex, xi)));
}

function exerciseCard(ex, xi) {
  const meta = exById(ex.exId);
  const type = meta?.type || 'wr';
  const card = el('div', { class: 'sx' });

  card.append(el('div', { class: 'sx-head' },
    el('b', {}, exName(ex.exId)),
    ex.target ? el('span', { class: 'pr-tag' }, `${t('reps')} ${ex.target}`) : null,
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
  st.done = !st.done;
  if (st.done) {
    buzz(25);
    // PR check
    const r = prCache[ex.exId];
    const w = Number(st.w) || 0, rp = Number(st.r) || 0;
    if (r && w && rp && st.type !== 'w') {
      if (e1rm(w, rp) > r.best1rm * 1.0001) {
        toast(`🏆 ${t('newPR')} ${exName(ex.exId)}`, 'ok');
        r.best1rm = e1rm(w, rp);
        if (w > r.maxW) r.maxW = w;
      }
    }
    const rest = ex.restSec ?? S.settings.restDefault;
    if (rest > 0) startRest(rest);
  }
  persist();
  renderSession();
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
    } }, '🏋️ ' + t('plateCalc')),
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
  await persist();
  $('#session').hidden = true;
  document.body.style.overflow = '';
  showMini(false);
  buzz(60); beep(880, 120); setTimeout(() => beep(1180, 160), 140);
  toast(`✅ ${t('workoutSaved')} · ${durLabel((end - rec.start) / 1000)}`, 'ok');
  window.dispatchEvent(new CustomEvent('data-changed'));
  showWorkoutDetail(rec);
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
  await persist();
  $('#session').hidden = true;
  document.body.style.overflow = '';
  showMini(false);
}

/* ============================================================
   REST TIMER
   ============================================================ */
let restEnd = 0, restTotal = 0, restTimer = null;

export function startRest(sec) {
  restTotal = sec;
  restEnd = Date.now() + sec * 1000;
  $('#rest-bar').hidden = false;
  clearInterval(restTimer);
  restTimer = setInterval(restTick, 250);
  restTick();
}
function restTick() {
  const left = Math.max(0, (restEnd - Date.now()) / 1000);
  $('#rest-time').textContent = clock(left);
  $('#rest-fill').style.width = (left / Math.max(1, restTotal) * 100) + '%';
  if (left <= 0) {
    stopRest();
    buzz([90, 60, 90]); beep(760, 180); setTimeout(() => beep(1020, 220), 200);
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
          el('span', { class: 'muted', style: 'font-size:11.5px;width:34px' }, t('sets')),
          el('div', { style: 'width:64px' }, setsIn),
          el('span', { class: 'muted', style: 'font-size:11.5px;width:44px' }, t('reps')),
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

export async function renderRoutines() {
  const host = $('#routine-list');
  host.replaceChildren();
  const rs = await getRoutines();
  if (!rs.length) host.append(emptyArt('clipboard', t('empty'),
    getLang() === 'fa' ? 'با ویزارد بالا یکی بساز' : 'Build one with the wizard above', 'var(--blue)'));
  rs.forEach(r => host.append(el('div', { class: 'li' },
    el('div', { class: 'li-main', onclick: () => routineMenu(r) },
      el('b', {}, r.name),
      el('span', {}, r.ex.map(x => exName(x.exId)).slice(0, 3).join('، ') + (r.ex.length > 3 ? ' …' : ''))),
    el('button', { class: 'btn sm', onclick: (e) => { e.stopPropagation(); startWorkout({ ...r, routineId: r.id }); } }, t('start')),
  )));

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
      el('div', { class: 'li-end' }, el('b', {}, `${num(x.sets)} × ${x.reps || '—'}`)))),
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

export function showWorkoutDetail(w) {
  const body = el('div', {},
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
  sheet(w.name + ' · ' + shortDate(w.date), body);
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

export function buildExerciseFilters() {
  const host = $('#ex-filters');
  host.replaceChildren();
  MUSCLES.forEach((m, i) => {
    const b = el('button', { class: 'chip' + (i === 0 ? ' on' : ''), dataset: { m: m.id }, onclick: () => {
      $$('#ex-filters .chip').forEach(x => x.classList.remove('on'));
      b.classList.add('on'); renderExerciseList();
    } }, pick(m));
    host.append(b);
  });
}

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
  const body = el('div', {},
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
  sheet(pick(e), body);
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
