/* ============ Training-plan wizard + local program generator ============
   Asks a short questionnaire, then builds a real weekly program from the
   built-in exercise library. Runs entirely offline — no AI key needed.
========================================================================= */
import * as db from './db.js';
import { lineIcon } from './icons.js';
import { S, saveProfile, saveGoals, suggestGoals, tdee, bmr, usesTargetWeight,
         kgToDisp, dispToKg, wUnit, cmToDisp, dispToCm, lUnit } from './store.js';
import { t, num, pick, getLang, countLabel, numText } from './i18n.js';
import {
  $, el, sheet, closeSheet, toast, field, input, select, round, parseNum, clamp, buzz,
} from './ui.js';
import { EXERCISES, MUSCLES, EQUIPMENT, EX_INDEX } from './data-exercises.js';
import { loadExercises, exById } from './workouts.js';
import { bodyMap, ART, blobs } from './art.js';

const WIZ_ID = 'training';

/* ---------------- option tables ---------------- */

export const TRAIN_GOALS = [
  { id: 'muscle',    icon: '💪', label: 'goalMuscle',    desc: 'goalMuscleD',    nutri: 'gain',     scheme: 'hyper' },
  { id: 'fatloss',   icon: '🔥', label: 'goalFatloss',   desc: 'goalFatlossD',   nutri: 'lose',     scheme: 'hyper' },
  { id: 'recomp',    icon: '⚖️', label: 'goalRecomp',    desc: 'goalRecompD',    nutri: 'recomp',   scheme: 'hyper' },
  { id: 'strength',  icon: '🏋️', label: 'goalStrength',  desc: 'goalStrengthD',  nutri: 'maintain', scheme: 'strength' },
  { id: 'endurance', icon: '🏃', label: 'goalEndurance', desc: 'goalEnduranceD', nutri: 'maintain', scheme: 'endur' },
  { id: 'health',    icon: '🌿', label: 'goalHealth',    desc: 'goalHealthD',    nutri: 'maintain', scheme: 'general' },
];

export const PLACES = [
  { id: 'home_none',  icon: '🏠', label: 'placeHomeNone',  desc: 'placeHomeNoneD',  equip: ['bodyweight', 'band', 'other'] },
  { id: 'home_basic', icon: '🏡', label: 'placeHomeBasic', desc: 'placeHomeBasicD', equip: ['bodyweight', 'band', 'other', 'dumbbell', 'kettlebell'] },
  { id: 'gym',        icon: '🏟️', label: 'placeGym',       desc: 'placeGymD',       equip: null /* everything */ },
];

/** Muscles the user can pick — the trainable ones. */
const PICKABLE = ['chest', 'back', 'shoulders', 'biceps', 'triceps',
                  'quads', 'hamstrings', 'glutes', 'calves', 'abs', 'traps', 'forearms'];

const SCHEME = {
  strength: { reps: '4-6',   rest: 180, setsPerEx: 4, cardio: 0.10 },
  hyper:    { reps: '8-12',  rest: 90,  setsPerEx: 3, cardio: 0.15 },
  endur:    { reps: '15-20', rest: 45,  setsPerEx: 3, cardio: 0.40 },
  general:  { reps: '10-15', rest: 60,  setsPerEx: 3, cardio: 0.25 },
};

/** Which muscles each kind of session covers, in priority order. */
const SPLIT_DAYS = {
  full:  ['quads', 'chest', 'back', 'shoulders', 'hamstrings', 'glutes', 'abs', 'biceps', 'triceps', 'calves'],
  upper: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'traps', 'forearms'],
  lower: ['quads', 'hamstrings', 'glutes', 'calves', 'abs'],
  push:  ['chest', 'shoulders', 'triceps'],
  pull:  ['back', 'biceps', 'traps', 'forearms'],
  legs:  ['quads', 'hamstrings', 'glutes', 'calves'],
};

/** Weekly split templates keyed by training days. */
const SPLITS = {
  2: [['full', 'A'], ['full', 'B']],
  3: [['full', 'A'], ['full', 'B'], ['full', 'C']],
  4: [['upper', 'A'], ['lower', 'A'], ['upper', 'B'], ['lower', 'B']],
  5: [['push', 'A'], ['pull', 'A'], ['legs', 'A'], ['upper', 'B'], ['lower', 'B']],
  6: [['push', 'A'], ['pull', 'A'], ['legs', 'A'], ['push', 'B'], ['pull', 'B'], ['legs', 'B']],
};

const DAY_NAME = {
  full:  { fa: 'تمام بدن', en: 'Full body' },
  upper: { fa: 'بالاتنه',  en: 'Upper' },
  lower: { fa: 'پایین‌تنه', en: 'Lower' },
  push:  { fa: 'پوش',      en: 'Push' },
  pull:  { fa: 'پول',      en: 'Pull' },
  legs:  { fa: 'پا',       en: 'Legs' },
};

/* ---------------- the generator ---------------- */

/**
 * Build a weekly program from the questionnaire answers.
 * Pure function — no DOM, no storage.
 */
export function buildProgram(a) {
  const goal = TRAIN_GOALS.find(g => g.id === a.goal) || TRAIN_GOALS[0];
  const place = PLACES.find(p => p.id === a.place) || PLACES[2];
  const sc = SCHEME[goal.scheme];

  /* how many working sets fit in the session */
  const warmup = 8;
  const secPerSet = 40 + sc.rest;                       // the set itself plus its rest
  const workMin = Math.max(12, a.minutes - warmup);
  const totalSets = clamp(Math.floor(workMin * 60 / secPerSet), 4, 32);
  const exCount = clamp(Math.round(totalSets / sc.setsPerEx), 3, 9);

  const wanted = new Set(a.muscles?.length ? a.muscles : PICKABLE);
  const pool = EXERCISES.filter(e =>
    (!place.equip || place.equip.includes(e.equip)) && e.muscle !== 'cardio');

  const days = (SPLITS[a.days] || SPLITS[4]).map(([kind, letter], di) => {
    /* muscles this session covers, keeping only what the user asked for
       (but never leaving a session empty) */
    let muscles = SPLIT_DAYS[kind].filter(m => wanted.has(m));
    if (!muscles.length) muscles = SPLIT_DAYS[kind].slice(0, 3);

    /* the focus muscle jumps to the front and gets a second slot */
    if (a.focus && muscles.includes(a.focus)) {
      muscles = [a.focus, ...muscles.filter(m => m !== a.focus)];
    }

    /* Hand out exercise slots round-robin. The focus muscle may take three,
       everything else at most two — but the cap stays fixed across passes so a
       session with few muscles still fills its whole time budget. */
    const capOf = (m) => (m === a.focus ? 3 : 2);
    const slots = {};
    muscles.forEach(m => slots[m] = 0);
    const roomTotal = muscles.reduce((s, m) => s + capOf(m), 0);
    let left = Math.min(exCount, roomTotal);
    for (let i = 0; left > 0 && i < muscles.length * 4; i++) {
      const m = muscles[i % muscles.length];
      if (slots[m] < capOf(m)) { slots[m]++; left--; }
    }

    /* pick the exercises — the library is ordered compound-first per muscle,
       and the B day starts one deeper so the two days differ */
    const offset = letter === 'B' ? 1 : letter === 'C' ? 2 : 0;
    const chosen = [];
    for (const m of muscles) {
      const n = slots[m] || 0;
      if (!n) continue;
      const list = pool.filter(e => e.muscle === m);
      if (!list.length) continue;
      for (let k = 0; k < n; k++) {
        const ex = list[(k + offset) % list.length];
        if (ex && !chosen.some(c => c.exId === ex.id)) {
          chosen.push({
            exId: ex.id,
            sets: m === a.focus ? sc.setsPerEx + 1 : sc.setsPerEx,
            reps: ex.type === 'd' ? '30-60s' : ex.type === 'r' ? sc.reps : sc.reps,
            restSec: m === a.focus ? sc.rest : Math.max(30, sc.rest - 15),
            muscle: m,
          });
        }
      }
    }

    /* Limited equipment can leave a session short — top it up from any muscle
       the split covers, so a 60-minute slot never turns into two exercises. */
    if (chosen.length < exCount) {
      const fallback = SPLIT_DAYS[kind];
      outer:
      for (let depth = 0; depth < 6; depth++) {
        for (const m of fallback) {
          if (chosen.length >= exCount) break outer;
          const list = pool.filter(e => e.muscle === m);
          const ex = list[depth];
          if (!ex || chosen.some(c => c.exId === ex.id)) continue;
          chosen.push({
            exId: ex.id, sets: sc.setsPerEx,
            reps: ex.type === 'd' ? '30-60s' : sc.reps,
            restSec: Math.max(30, sc.rest - 15), muscle: m,
          });
        }
      }
    }

    const cardioMin = Math.round(a.minutes * sc.cardio);
    return {
      key: kind, letter,
      name: `${DAY_NAME[kind][getLang() === 'fa' ? 'fa' : 'en']} ${letter}`,
      muscles,
      ex: chosen,
      sets: chosen.reduce((s, x) => s + x.sets, 0),
      cardioMin: cardioMin >= 5 ? cardioMin : 0,
    };
  });

  return {
    answers: a,
    goal: goal.id, scheme: goal.scheme, place: place.id,
    reps: sc.reps, rest: sc.rest,
    perSession: a.minutes, days,
    totalSets: days.reduce((s, d) => s + d.sets, 0),
    at: Date.now(),
  };
}

/** Calories + macros implied by the questionnaire. */
export function nutritionFor(a) {
  const goal = TRAIN_GOALS.find(g => g.id === a.goal) || TRAIN_GOALS[0];
  const p = { ...S.profile, sex: a.sex, age: a.age, height: a.height, weight: a.weight, goal: goal.nutri };

  /* activity factor derived from the actual training load rather than a guess */
  const weeklyHours = (a.days * a.minutes) / 60;
  const factor = clamp(1.2 + weeklyHours * 0.055, 1.2, 1.9);
  p.activity = factor >= 1.8 ? 'athlete' : factor >= 1.65 ? 'high'
             : factor >= 1.5 ? 'moderate' : factor >= 1.32 ? 'light' : 'sedentary';

  const g = suggestGoals(p);
  return { ...g, factor: round(factor, 2), profile: p, nutriGoal: goal.nutri };
}

/* ---------------- persistence ---------------- */

export const getProgram = () => db.get('plans', WIZ_ID);

export async function saveProgram(program) {
  await db.put('plans', { id: WIZ_ID, ...program });
}

/** Write the generated days into My Routines, replacing a previous generation. */
export async function programToRoutines(program) {
  const old = (await db.all('routines')).filter(r => r.fromWizard);
  for (const r of old) await db.del('routines', r.id);
  let n = 0;
  for (const d of program.days) {
    if (!d.ex.length) continue;
    await db.put('routines', {
      id: db.uid('r_'),
      name: d.name,
      ex: d.ex.map(x => ({ exId: x.exId, sets: x.sets, reps: x.reps, restSec: x.restSec })),
      updated: Date.now(), fromWizard: true,
    });
    n++;
  }
  return n;
}

/* ============================================================
   WIZARD UI
   ============================================================ */

const STEPS = 7;

export function openWizard() {
  const prev = S.profile;
  const a = {
    sex: prev.sex, age: prev.age, height: prev.height, weight: prev.weight,
    experience: prev.experience,
    goal: 'muscle', place: 'gym', focus: 'chest',
    muscles: [...PICKABLE], days: prev.daysPerWeek || 4, minutes: 60,
  };
  let step = 1;

  const bodyHost = el('div', {});
  const bar = el('div', { class: 'wiz-bar' });
  const title = el('h3', { class: 'wiz-title' });
  const sub = el('p', { class: 'wiz-sub' });
  const backBtn = el('button', { class: 'btn ghost', onclick: () => { if (step > 1) { step--; draw(); } } }, t('back'));
  const nextBtn = el('button', { class: 'btn', onclick: () => onNext() });

  function drawBar() {
    bar.replaceChildren();
    for (let i = 1; i <= STEPS; i++) {
      bar.append(el('i', { class: 'wiz-dot' + (i < step ? ' done' : i === step ? ' on' : '') }));
    }
  }

  function onNext() {
    if (step === 5 && !a.muscles.length) return toast(t('pickAtLeastOne'), 'err');
    if (step < STEPS) { step++; draw(); buzz(12); }
    else finish();
  }

  function draw() {
    drawBar();
    backBtn.style.visibility = step === 1 ? 'hidden' : 'visible';
    nextBtn.textContent = step === STEPS ? t('build') : t('next');
    bodyHost.replaceChildren(RENDER[step]());
    $('#sheet-body').scrollTop = 0;
  }

  /* ---- step renderers ---- */
  const RENDER = {
    1: () => {
      title.textContent = t('wBody'); sub.textContent = t('wBodySub');
      const sexSeg = el('div', { class: 'pick-grid two' });
      [['male', '♂'], ['female', '♀']].forEach(([v, ic]) => {
        const b = el('button', { class: 'pick' + (a.sex === v ? ' on' : ''), onclick: () => { a.sex = v; draw(); } },
          el('span', { class: 'pick-ico' }, ic), el('b', {}, t(v)));
        sexSeg.append(b);
      });
      const age = input({ type: 'number', inputmode: 'numeric', value: a.age });
      const hh = input({ type: 'number', inputmode: 'decimal', step: '0.5', value: round(cmToDisp(a.height), 1) });
      const ww = input({ type: 'number', inputmode: 'decimal', step: '0.1', value: round(kgToDisp(a.weight), 1) });
      age.oninput = () => a.age = clamp(parseNum(age.value) || 30, 10, 100);
      hh.oninput = () => a.height = round(dispToCm(parseNum(hh.value)) || 175, 1);
      ww.oninput = () => a.weight = round(dispToKg(parseNum(ww.value)) || 75, 2);

      const expSeg = el('div', { class: 'pick-grid three' });
      ['beginner', 'intermediate', 'advanced'].forEach(v => {
        expSeg.append(el('button', { class: 'pick sm' + (a.experience === v ? ' on' : ''), onclick: () => { a.experience = v; draw(); } },
          el('b', {}, t(v))));
      });

      return el('div', {},
        el('label', { class: 'wiz-label' }, t('sex')), sexSeg,
        el('div', { class: 'grid3', style: 'margin-top:14px' },
          field(t('age'), age),
          field(`${t('height')} (${lUnit()})`, hh),
          field(`${t('weight')} (${wUnit()})`, ww)),
        el('label', { class: 'wiz-label' }, t('experience')), expSeg,
      );
    },

    2: () => {
      title.textContent = t('wGoal'); sub.textContent = t('wGoalSub');
      const g = el('div', { class: 'pick-grid' });
      TRAIN_GOALS.forEach(o => g.append(
        el('button', { class: 'pick wide' + (a.goal === o.id ? ' on' : ''), onclick: () => { a.goal = o.id; draw(); } },
          el('span', { class: 'pick-ico' }, o.icon),
          el('span', { class: 'pick-txt' }, el('b', {}, t(o.label)), el('span', {}, t(o.desc))))));
      return g;
    },

    3: () => {
      title.textContent = t('wPlace'); sub.textContent = t('wPlaceSub');
      const g = el('div', { class: 'pick-grid' });
      PLACES.forEach(o => g.append(
        el('button', { class: 'pick wide' + (a.place === o.id ? ' on' : ''), onclick: () => { a.place = o.id; draw(); } },
          el('span', { class: 'pick-ico' }, o.icon),
          el('span', { class: 'pick-txt' }, el('b', {}, t(o.label)), el('span', {}, t(o.desc))))));
      return g;
    },

    4: () => {
      title.textContent = t('wFocus'); sub.textContent = t('wFocusSub');
      const g = el('div', { class: 'pick-grid three' });
      PICKABLE.forEach(m => {
        const mm = MUSCLES.find(x => x.id === m);
        g.append(el('button', { class: 'pick sm' + (a.focus === m ? ' on' : ''), onclick: () => { a.focus = m; draw(); } },
          el('b', {}, pick(mm))));
      });
      return el('div', {},
        bodyMap({ selected: [a.focus], focus: a.focus, onPick: (m) => { a.focus = m; draw(); } }),
        g);
    },

    5: () => {
      title.textContent = t('wMuscles'); sub.textContent = t('wMusclesSub');
      const g = el('div', { class: 'pick-grid three' });
      PICKABLE.forEach(m => {
        const mm = MUSCLES.find(x => x.id === m);
        const on = a.muscles.includes(m);
        g.append(el('button', { class: 'pick sm' + (on ? ' on' : ''), onclick: () => {
          if (on) a.muscles = a.muscles.filter(x => x !== m);
          else a.muscles = [...a.muscles, m];
          draw();
        } }, el('b', {}, pick(mm)), on ? el('span', { class: 'tick' }, '✓') : null));
      });
      return el('div', {},
        bodyMap({ selected: a.muscles, focus: a.focus, onPick: (m) => {
          if (a.muscles.includes(m)) a.muscles = a.muscles.filter(x => x !== m);
          else a.muscles = [...a.muscles, m];
          draw();
        } }),
        g,
        el('div', { class: 'btn-row', style: 'margin-top:12px' },
          el('button', { class: 'btn ghost sm', onclick: () => { a.muscles = [...PICKABLE]; draw(); } },
            getLang() === 'fa' ? 'همه' : 'All'),
          el('button', { class: 'btn ghost sm', onclick: () => { a.muscles = []; draw(); } },
            getLang() === 'fa' ? 'هیچ‌کدام' : 'None')));
    },

    6: () => {
      title.textContent = t('wDays'); sub.textContent = t('wDaysSub');
      const g = el('div', { class: 'pick-grid three' });
      [2, 3, 4, 5, 6].forEach(d => {
        g.append(el('button', { class: 'pick sm' + (a.days === d ? ' on' : ''), onclick: () => { a.days = d; draw(); } },
          el('b', { style: 'font-size:var(--t-2xl)' }, num(d)),
          el('span', { style: 'font-size:var(--t-xs);color:var(--tx2)' }, getLang() === 'fa' ? 'روز' : 'days')));
      });
      const split = SPLITS[a.days] || SPLITS[4];
      return el('div', {}, g,
        el('div', { class: 'info', style: 'margin-top:14px' },
          el('b', {}, t('weeklySplit') + ': '),
          split.map(([k, l]) => `${DAY_NAME[k][getLang() === 'fa' ? 'fa' : 'en']} ${l}`).join(' · ')));
    },

    7: () => {
      title.textContent = t('wTime'); sub.textContent = t('wTimeSub');
      const g = el('div', { class: 'pick-grid three' });
      [30, 45, 60, 75, 90].forEach(mn => {
        g.append(el('button', { class: 'pick sm' + (a.minutes === mn ? ' on' : ''), onclick: () => { a.minutes = mn; draw(); } },
          el('b', { style: 'font-size:var(--t-2xl)' }, num(mn)),
          el('span', { style: 'font-size:var(--t-xs);color:var(--tx2)' }, t('minPerSession'))));
      });
      const preview = buildProgram(a);
      const n = nutritionFor(a);
      return el('div', {}, g,
        el('div', { class: 'info', style: 'margin-top:14px' },
          el('div', { class: 'kv' }, el('span', {}, t('totalSets')), el('b', {}, num(preview.totalSets))),
          el('div', { class: 'kv' }, el('span', {}, t('estPerSession')),
            el('b', {}, `${countLabel(Math.round(preview.totalSets / preview.days.length), 'set')} · ${countLabel(a.minutes, 'minute')}`)),
          el('div', { class: 'kv' }, el('span', {}, t('calorieGoal')), el('b', {}, `${num(n.kcal)} ${t('kcal')}`)),
          el('div', { class: 'kv' }, el('span', {}, t('protein')), el('b', {}, `${num(n.protein)} g`)),
        ));
    },
  };

  async function finish() {
    const program = buildProgram(a);
    const n = nutritionFor(a);

    /* profile picks up everything the questionnaire learned */
    Object.assign(S.profile, {
      sex: a.sex, age: a.age, height: a.height, weight: a.weight,
      experience: a.experience, daysPerWeek: a.days,
      goal: n.nutriGoal, trainGoal: a.goal, place: a.place,
      focusMuscle: a.focus, muscles: a.muscles, sessionMinutes: a.minutes,
      activity: n.profile.activity,
    });
    await saveProfile();

    Object.assign(S.goals, { auto: true, kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, water: n.water });
    await saveGoals();

    await saveProgram(program);
    const made = await programToRoutines(program);

    /* lay the week out straight away, so "today's workout" and the rest days
       are real from the first moment rather than something to configure later */
    const coach = await import('./coach.js');
    const fresh = (await db.all('routines')).filter(r => r.fromWizard);
    await coach.setSchedule(coach.autoArrange(fresh.map(r => r.id), S.settings.firstDay ?? 6));

    closeSheet();
    buzz(50);
    toast(`${t('planReady')} — ${num(made)} ${t('sessionShort')}`, 'ok');
    window.dispatchEvent(new CustomEvent('data-changed'));
    window.dispatchEvent(new CustomEvent('open-program'));
  }

  const shell = el('div', { class: 'wiz' },
    bar, title, sub, bodyHost,
    el('div', { class: 'btn-row wiz-nav' }, backBtn, nextBtn),
  );
  sheet(t('wizard'), shell);
  draw();
}

/* ============================================================
   PROGRAM VIEW
   ============================================================ */

export async function renderProgram() {
  const host = $('#program-body');
  host.replaceChildren();
  const prog = await getProgram();

  if (!prog || !prog.days) {
    const emptyHero = el('div', { class: 'card hero-card' },
      el('div', { class: 'hero-glow' }),
      el('div', { style: 'position:relative;text-align:center' },
        artNode('target', 'var(--acc)'),
        el('h3', { style: 'font-size:var(--t-xl);margin-bottom:8px' }, t('wizard')),
        el('p', { class: 'muted', style: 'line-height:1.9;margin:0 0 18px' }, t('wizardSub')),
        el('button', { class: 'btn full', onclick: openWizard }, t('startWizard'))));
    host.append(emptyHero, bodyMap({ selected: [], view: 'both' }));
    return;
  }

  const g = TRAIN_GOALS.find(x => x.id === prog.goal);
  const pl = PLACES.find(x => x.id === prog.place);
  const focus = MUSCLES.find(m => m.id === prog.answers?.focus);

  host.append(
    el('div', { class: 'card hero-card' },
      el('div', { class: 'hero-glow' }),
      el('div', { style: 'position:relative' },
        el('div', { class: 'hero-row' },
          el('span', { class: 'hero-ico' }, g?.icon || '🎯'),
          el('div', { style: 'flex:1' },
            el('b', { style: 'font-size:var(--t-lg);display:block' }, t(g?.label || 'goalMuscle')),
            el('span', { class: 'muted' }, `${t(pl?.label || 'placeGym')} · ${num(prog.days.length)} ${getLang() === 'fa' ? 'روز' : 'days'} · ${num(prog.perSession)} ${t('minPerSession')}`))),
        focus ? el('div', { class: 'chips', style: 'margin-top:12px;padding:0' },
          el('span', { class: 'chip on' }, `${t('focusBadge')}: ${pick(focus)}`),
          el('span', { class: 'chip' }, `${t('reps')} ${numText(prog.reps)}`),
          el('span', { class: 'chip' }, `${t('rest')} ${num(prog.rest)}s`),
          el('span', { class: 'chip' }, `${num(prog.totalSets)} ${t('totalSets')}`)) : null,
      )),
  );

  prog.days.forEach((d, i) => {
    const hue = [160, 200, 265, 25, 330, 190][i % 6];
    host.append(el('div', { class: 'card day-card', style: `--dh:${hue}` },
      el('div', { class: 'day-head' },
        el('span', { class: 'day-badge' }, String.fromCharCode(65 + i)),
        el('div', { style: 'flex:1' },
          el('b', {}, d.name),
          el('span', { class: 'muted', style: 'display:block;font-size:var(--t-sm)' },
            `${countLabel(d.ex.length, 'exercise')} · ${countLabel(d.sets, 'set')}`)),
        el('button', { class: 'btn sm', onclick: async () => {
          const { startWorkout } = await import('./workouts.js');
          startWorkout({ name: d.name, ex: d.ex });
        } }, t('start'))),
      el('div', { class: 'day-legend' },
        el('span', {}, getLang() === 'fa' ? 'حرکت' : 'Exercise'),
        el('span', {}, `${t('sets')} × ${t('reps')} · ${t('rest')}`)),
      el('div', { class: 'day-list' },
        ...d.ex.map(x => {
          const meta = exById(x.exId);
          const mm = MUSCLES.find(m => m.id === x.muscle);
          const isFocus = x.muscle === prog.answers?.focus;
          return el('div', { class: 'day-row' },
            el('span', { class: 'day-dot' + (isFocus ? ' focus' : '') }),
            el('div', { style: 'flex:1;min-width:0' },
              el('b', {}, meta ? pick(meta) : x.exId),
              el('span', { class: 'muted', style: 'display:block;font-size:var(--t-xs)' }, pick(mm))),
            el('div', { class: 'day-spec' },
              el('span', { class: 'day-sets' },
                `${countLabel(x.sets, 'set')} × ${numText(x.reps)}`),
              el('span', { class: 'day-rest' }, `⏱ ${num(x.restSec)}${getLang() === 'fa' ? 'ث' : 's'}`)));
        })),
      d.cardioMin ? el('div', { class: 'day-cardio' }, `🏃 ${getLang() === 'fa' ? 'هوازی' : 'Cardio'} ${num(d.cardioMin)} ${t('minPerSession')}`) : null,
    ));
  });

  const { targetsCard } = await import('./targets.js');
  host.append(targetsCard());

  const n = prog.answers ? nutritionFor(prog.answers) : null;
  if (n) {
    host.append(el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, t('nutritionFromPlan'))),
      el('div', { class: 'macro-pills' },
        pill(t('kcal'), num(n.kcal), 'var(--acc)'),
        pill(t('protein'), num(n.protein) + 'g', 'var(--blue)'),
        pill(t('carbs'), num(n.carbs) + 'g', 'var(--orange)'),
        pill(t('fat'), num(n.fat) + 'g', 'var(--pink)')),
      el('button', { class: 'btn ghost full', style: 'margin-top:12px', onclick: async () => {
        Object.assign(S.goals, { auto: true, kcal: n.kcal, protein: n.protein, carbs: n.carbs, fat: n.fat, water: n.water });
        await saveGoals();
        toast(t('saved'), 'ok');
        window.dispatchEvent(new CustomEvent('data-changed'));
      } }, t('applyNutrition'))));
  }

  host.append(
    el('button', { class: 'btn ghost full', style: 'margin-top:6px', onclick: async () => {
      const made = await programToRoutines(prog);
      toast(`${t('planSaved')} (${num(made)})`, 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('saveAsRoutine')),
    el('button', { class: 'btn ghost full', style: 'margin-top:9px', onclick: openWizard },
      lineIcon('refresh', { size: 17 }), t('rebuildPlan')),
  );
}

function artNode(kind, color) {
  const n = ART[kind]();
  n.style.color = color;
  n.classList.add('art-hero');
  return n;
}

function pill(label, value, color) {
  return el('div', { class: 'mpill', style: `--pc:${color}` },
    el('b', {}, value), el('span', {}, label));
}
