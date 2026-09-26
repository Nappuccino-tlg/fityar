/* ============ AI-generated nutrition + training plan ============ */
import * as db from './db.js';
import { lineIcon } from './icons.js';
import { S, tdee, bmr, saveGoals, kgToDisp, wUnit, aiConfig, hasAI, usesTargetWeight } from './store.js';
import { t, num, getLang, pick, numText } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, loading, round,
} from './ui.js';
import * as ai from './ai.js';
import { catalog, exById } from './workouts.js';

const PLAN_ID = 'current';

export async function getPlan() {
  return db.get('plans', PLAN_ID);
}

export async function renderPlan() {
  const host = $('#plan-body');
  host.replaceChildren();
  const rec = await getPlan();

  if (!rec) {
    host.append(
      el('div', { class: 'card', style: 'text-align:center;padding:30px 18px' },
        el('div', { style: 'font-size:var(--t-5xl);margin-bottom:10px' }, '🧠'),
        el('h3', { style: 'font-size:var(--t-xl);margin-bottom:8px' }, t('aiPlan')),
        el('p', { class: 'muted', style: 'line-height:1.9;margin:0 0 18px' }, t('planIntro')),
        el('button', { class: 'btn full', onclick: buildPlan }, t('generatePlan')),
      ),
      profileSummary(),
    );
    return;
  }

  const p = rec.plan;
  host.append(
    el('div', { class: 'card' },
      el('div', { class: 'card-head' },
        el('h3', {}, t('aiPlan')),
        el('span', { class: 'muted', style: 'font-size:var(--t-sm)' }, new Date(rec.at).toLocaleDateString(getLang() === 'fa' ? 'fa-IR' : 'en-US'))),
      el('p', { style: 'line-height:1.9;font-size:var(--t-md);color:var(--tx2);margin:0' }, p.summary || ''),
    ),

    /* targets */
    el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, t('goalsCalories'))),
      el('div', { class: 'kv' }, el('span', {}, t('calorieGoal')), el('b', {}, `${num(Math.round(p.targets.kcal))} ${t('kcal')}`)),
      el('div', { class: 'kv' }, el('span', {}, t('protein')), el('b', {}, `${num(Math.round(p.targets.protein))} g`)),
      el('div', { class: 'kv' }, el('span', {}, t('carbs')), el('b', {}, `${num(Math.round(p.targets.carbs))} g`)),
      el('div', { class: 'kv' }, el('span', {}, t('fat')), el('b', {}, `${num(Math.round(p.targets.fat))} g`)),
      el('div', { class: 'kv' }, el('span', {}, t('water')), el('b', {}, `${num(Math.round(p.targets.water))} ml`)),
      p.targets.rationale ? el('div', { class: 'info', style: 'margin-top:12px' }, p.targets.rationale) : null,
      el('button', { class: 'btn full', style: 'margin-top:12px', onclick: async () => {
        Object.assign(S.goals, {
          auto: false,
          kcal: Math.round(p.targets.kcal), protein: Math.round(p.targets.protein),
          carbs: Math.round(p.targets.carbs), fat: Math.round(p.targets.fat),
          water: Math.round(p.targets.water),
        });
        await saveGoals();
        toast(t('saved'), 'ok');
        window.dispatchEvent(new CustomEvent('data-changed'));
      } }, t('applyAuto')),
    ),

    /* meals */
    el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, t('mealPlan'))),
      ...(p.meals || []).map(m => el('div', { class: 'plan-sec' },
        el('h4', {}, `${m.meal} — ${num(Math.round(m.kcal))} ${t('kcal')}`),
        el('ul', {}, ...(m.options || []).map(o => el('li', {}, o))),
      )),
    ),

    /* training */
    el('div', { class: 'card' },
      el('div', { class: 'card-head' },
        el('h3', {}, t('trainingPlan')),
        el('button', { class: 'link', onclick: () => saveTrainingAsRoutines(p) }, t('saveRoutinesFromPlan'))),
      ...(p.training || []).map(d => el('div', { class: 'plan-sec' },
        el('h4', {}, `${d.day} — ${d.focus}`),
        el('div', {}, ...(d.exercises || []).map(x => el('div', { class: 'kv' },
          el('span', {}, x.name),
          el('b', {}, `${num(x.sets)} × ${numText(x.reps)}`)))),
        d.cardio && d.cardio !== '—' ? el('p', { style: 'margin:8px 0 0' }, `🏃 ${d.cardio}`) : null,
      )),
    ),

    /* tips */
    (p.tips || []).length ? el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, getLang() === 'fa' ? 'نکته‌ها' : 'Tips')),
      el('ul', { class: 'plan-sec', style: 'margin:0' }, ...(p.tips || []).map(x => el('li', {}, x))),
    ) : null,

    p.progression ? el('div', { class: 'card' },
      el('div', { class: 'card-head' }, el('h3', {}, getLang() === 'fa' ? 'پیشرفت تدریجی' : 'Progression')),
      el('p', { style: 'line-height:1.9;font-size:var(--t-md);color:var(--tx2);margin:0' }, p.progression),
    ) : null,

    el('div', { class: 'warn' }, t('disclaimer')),
    el('button', { class: 'btn ghost full', onclick: buildPlan },
      lineIcon('refresh', { size: 17 }), t('regenerate')),
  );
}

function profileSummary() {
  const p = S.profile;
  return el('div', { class: 'card' },
    el('div', { class: 'card-head' }, el('h3', {}, t('profile'))),
    el('div', { class: 'kv' }, el('span', {}, t('sex')), el('b', {}, t(p.sex))),
    el('div', { class: 'kv' }, el('span', {}, t('age')), el('b', {}, num(p.age))),
    el('div', { class: 'kv' }, el('span', {}, t('weight')), el('b', {}, `${num(round(kgToDisp(p.weight), 1), 1)} ${wUnit()}`)),
    el('div', { class: 'kv' }, el('span', {}, t('goalType')), el('b', {}, t(p.goal))),
    el('div', { class: 'kv' }, el('span', {}, t('daysPerWeek')), el('b', {}, num(p.daysPerWeek))),
    el('div', { class: 'kv' }, el('span', {}, t('tdee')), el('b', {}, `${num(Math.round(tdee()))} ${t('kcal')}`)),
    el('button', { class: 'btn ghost full', style: 'margin-top:12px', onclick: () =>
      window.dispatchEvent(new CustomEvent('open-profile')) }, t('edit')),
  );
}

export async function buildPlan() {
  if (!hasAI()) {
    toast(t('noKey'), 'err');
    window.dispatchEvent(new CustomEvent('open-ai-settings'));
    return;
  }
  const p = S.profile;
  const profile = {
    sex: p.sex, age: p.age, heightCm: p.height, weightKg: round(p.weight, 1),
    ...(usesTargetWeight() ? { targetWeightKg: round(p.targetWeight, 1) } : {}),
    activity: p.activity, goal: p.goal, experience: p.experience,
    daysPerWeek: p.daysPerWeek, dietNotes: p.diet || 'none',
    bmr: Math.round(bmr()), tdee: Math.round(tdee()),
    country: 'Iran',
  };

  loading(true, t('generating'));
  try {
    const plan = await ai.generatePlan(aiConfig(), {
      profile,
      exerciseCatalog: catalog().filter(e => e.builtin).map(e => ({ id: e.id, name: e.name })),
    });
    await db.put('plans', { id: PLAN_ID, at: Date.now(), profile, plan });
    loading(false);
    toast(t('done'), 'ok');
    renderPlan();
  } catch (e) {
    loading(false);
    toast(ai.aiErrorText(e), 'err');
  }
}

async function saveTrainingAsRoutines(plan) {
  const days = plan.training || [];
  if (!days.length) return;
  let made = 0;
  for (const d of days) {
    const ex = (d.exercises || [])
      .map(x => {
        const id = x.exerciseId && exById(x.exerciseId) ? x.exerciseId : matchExercise(x.name);
        if (!id) return null;
        return { exId: id, sets: Math.max(1, Number(x.sets) || 3), reps: String(x.reps || '8-12'),
                 restSec: Number(x.restSec) || S.settings.restDefault };
      })
      .filter(Boolean);
    if (!ex.length) continue;
    await db.put('routines', {
      id: db.uid('r_'), name: `${d.day} · ${d.focus}`.slice(0, 60), ex, updated: Date.now(),
      fromPlan: true,
    });
    made++;
  }
  toast(made ? `${t('saved')} (${num(made)})` : t('error'), made ? 'ok' : 'err');
  window.dispatchEvent(new CustomEvent('data-changed'));
}

/** Best-effort name → exercise id match for plan entries with no id. */
function matchExercise(name) {
  const norm = (x) => (x || '').toLowerCase()
    .replace(/[يى]/g, 'ی').replace(/ك/g, 'ک').replace(/‌/g, ' ').replace(/[^\p{L}\p{N} ]/gu, '').trim();
  const n = norm(name);
  if (!n) return null;
  const pool = catalog();
  let best = null, bestScore = 0;
  for (const e of pool) {
    const a = norm(e.name), b = norm(e.nameFa);
    let score = 0;
    if (a === n || b === n) score = 100;
    else if (a.includes(n) || b.includes(n) || n.includes(a) || n.includes(b)) score = 60;
    else {
      const words = n.split(' ').filter(w => w.length > 2);
      const hit = words.filter(w => a.includes(w) || b.includes(w)).length;
      score = words.length ? (hit / words.length) * 50 : 0;
    }
    if (score > bestScore) { bestScore = score; best = e.id; }
  }
  return bestScore >= 40 ? best : null;
}
