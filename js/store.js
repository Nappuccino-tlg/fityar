/* ============ App state: settings, profile, goals, derived math ============ */
import * as db from './db.js';
import { round, clamp, todayKey } from './ui.js';
import { PROXY_URL, PROXY_MODEL } from './config.js';

export const DEFAULTS = {
  settings: {
    lang: 'fa',
    theme: 'dark',
    units: 'metric',          // metric | imperial
    restDefault: 90,          // seconds
    fx: true,                 // sound + vibration
    firstDay: 6,              // 0=Sun … 6=Sat  (Saturday for Iran)
    provider: 'gemini',       // gemini | openai (any OpenAI-compatible endpoint)
    apiKey: '',
    model: 'gemini-2.5-flash',
    baseUrl: '',              // only used when provider === 'openai'
    keepPhotos: true,
  },
  profile: {
    name: '',
    sex: 'male',              // male | female
    age: 30,
    height: 175,              // cm
    weight: 75,               // kg  (mirror of latest weight log)
    targetWeight: 72,
    activity: 'moderate',     // sedentary | light | moderate | high | athlete
    goal: 'lose',             // lose | maintain | gain | recomp
    experience: 'intermediate',
    daysPerWeek: 4,
    diet: '',                 // free text: allergies, preferences
  },
  goals: {
    auto: true,
    kcal: 2200, protein: 150, carbs: 220, fat: 70, water: 2500,
  },
};

export const ACTIVITY_FACTOR = {
  sedentary: 1.2, light: 1.375, moderate: 1.55, high: 1.725, athlete: 1.9,
};
export const GOAL_ADJUST = {
  lose: -0.18, maintain: 0, gain: 0.12, recomp: -0.08,
};

/* ---------- live state ---------- */
export const S = {
  settings: { ...DEFAULTS.settings },
  profile:  { ...DEFAULTS.profile },
  goals:    { ...DEFAULTS.goals },
  /** currently viewed diary date */
  date: todayKey(),
};

export async function load() {
  const stored = await db.metaGet('settings', null);
  S.settings = { ...DEFAULTS.settings, ...(stored || {}) };

  /* A build that ships a proxy turns the AI on for anyone who has nothing else
     working — including people already using the app, whose stored settings say
     'gemini' with an empty key. Someone who did configure their own provider
     (a key, or their own base URL) keeps it untouched. */
  const configuredOwnAI = !!(S.settings.apiKey || S.settings.baseUrl);
  if (PROXY_URL && !configuredOwnAI) {
    S.settings.provider = 'proxy';
    S.settings.baseUrl = PROXY_URL;
    S.settings.model = PROXY_MODEL;
  }
  S.profile  = { ...DEFAULTS.profile,  ...(await db.metaGet('profile', {})) };
  S.goals    = { ...DEFAULTS.goals,    ...(await db.metaGet('goals', {})) };
  // keep profile weight synced with the most recent weight log
  const ws = await db.all('weights');
  if (ws.length) {
    ws.sort((a, b) => a.date < b.date ? 1 : -1);
    S.profile.weight = ws[0].kg;
  }
  if (S.goals.auto) applyAutoGoals(false);
  return S;
}

export const saveSettings = () => db.metaSet('settings', S.settings);

/** Everything the AI layer needs, in one object. */
export function aiConfig() {
  const s = S.settings;
  return { provider: s.provider || 'gemini', key: s.apiKey, model: s.model, baseUrl: s.baseUrl };
}
/** True when the AI features are usable. */
export function hasAI() {
  const s = S.settings;
  if (!s.model) return false;
  const p = s.provider || 'gemini';
  /* the proxy holds the key server-side, so this device needs none */
  if (p === 'proxy') return !!String(s.baseUrl || '').trim();
  if (!s.apiKey) return false;
  if (p === 'openai') return !!String(s.baseUrl || '').trim();
  return true;
}
export const saveProfile  = () => db.metaSet('profile', S.profile);
export const saveGoals    = () => db.metaSet('goals', S.goals);

/* ---------- energy math ---------- */

/** Mifflin-St Jeor basal metabolic rate. */
export function bmr(p = S.profile) {
  const s = p.sex === 'female' ? -161 : 5;
  return Math.max(800, 10 * p.weight + 6.25 * p.height - 5 * p.age + s);
}

export function tdee(p = S.profile) {
  return bmr(p) * (ACTIVITY_FACTOR[p.activity] || 1.55);
}

/** Body-mass index, used to decide how to scale protein. */
export const bmi = (p = S.profile) => p.weight / ((p.height / 100) ** 2);

/**
 * The weight protein should be based on.
 * Guidelines scale protein with lean mass. Above a BMI of about 27 the extra
 * kilos are mostly fat, so we taper: only a quarter of the excess over a
 * BMI-25 weight counts. Without this a 110 kg cut asks for 220 g of protein —
 * 43% of the budget — and squeezes carbs out of the day.
 */
export function proteinBasisKg(p = S.profile) {
  const bmiNow = bmi(p);
  if (!Number.isFinite(bmiNow) || bmiNow <= 27) return p.weight;
  const refWeight = 25 * ((p.height / 100) ** 2);         // weight at BMI 25
  return refWeight + (p.weight - refWeight) * 0.25;
}

/** Fibre target: the DRI is 14 g per 1000 kcal, floored and capped sensibly. */
export const fiberGoal = (kcal = S.goals.kcal) => clamp(round(kcal / 1000 * 14), 20, 50);

/** Suggested daily targets from profile. */
export function suggestGoals(p = S.profile) {
  const maint = tdee(p);
  let kcal = maint * (1 + (GOAL_ADJUST[p.goal] ?? 0));
  const floor = p.sex === 'female' ? 1200 : 1500;
  kcal = Math.max(floor, kcal);

  // protein: higher when cutting, moderate when bulking — scaled off lean-ish mass
  const pPerKg = p.goal === 'lose' ? 2.0 : p.goal === 'recomp' ? 2.0 : 1.8;
  const basis = proteinBasisKg(p);
  // and never let protein crowd out the rest of the day
  const protein = round(Math.min(basis * pPerKg, kcal * 0.35 / 4));
  const fat = round(Math.max(p.weight * 0.7, kcal * 0.25 / 9));
  const carbs = round(Math.max(50, (kcal - protein * 4 - fat * 9) / 4));
  const water = round(clamp(p.weight * 35, 1800, 4500) / 100) * 100;

  return { kcal: round(kcal / 10) * 10, protein, carbs, fat, water };
}

export function applyAutoGoals(persist = true) {
  const g = suggestGoals();
  Object.assign(S.goals, g, { auto: true });
  if (persist) return saveGoals();
}

/** A target weight only makes sense when the plan is to move the scale in a
    known direction. Building muscle or recomping deliberately holds it. */
export const usesTargetWeight = (p = S.profile) => !['gain', 'recomp'].includes(p.goal);

/* ---------- units ---------- */
export const isImperial = () => S.settings.units === 'imperial';
export const kgToDisp   = (kg) => isImperial() ? round(kg * 2.20462, 1) : round(kg, 1);
export const dispToKg   = (v)  => isImperial() ? v / 2.20462 : v;
export const wUnit      = () => isImperial() ? 'lb' : 'kg';
export const cmToDisp   = (cm) => isImperial() ? round(cm / 2.54, 1) : round(cm, 1);
export const dispToCm   = (v)  => isImperial() ? v * 2.54 : v;
export const lUnit      = () => isImperial() ? 'in' : 'cm';

/* ---------- 1RM ---------- */
/** Epley formula, capped at a sane rep range. */
export function e1rm(weight, reps) {
  if (!weight || !reps) return 0;
  if (reps === 1) return weight;
  if (reps > 15) return weight * (1 + 15 / 30);
  return weight * (1 + reps / 30);
}

/* ---------- calories burned ---------- */
import { MET } from './data-exercises.js';

/**
 * Rough kcal for a workout, NET of resting metabolism.
 * Published MET values are gross — they include the ~1 MET you burn simply
 * existing, which TDEE already accounts for. Adding the gross number back onto
 * the day's budget would credit those calories twice, so subtract the 1 MET
 * baseline: net = (MET − 1) × kg × hours.
 */
export function workoutKcal(workout) {
  const kg = S.profile.weight || 75;
  const hours = ((workout.end || Date.now()) - workout.start) / 3600000;
  if (!hours || hours < 0) return 0;
  const cardioIds = (workout.exercises || []).map(x => x.exId).filter(id => MET.cardio[id]);
  const met = cardioIds.length
    ? cardioIds.reduce((s, id) => s + MET.cardio[id], 0) / cardioIds.length
    : MET.strength;
  return Math.round(Math.max(0, met - 1) * kg * Math.min(hours, 4));
}

/* ---------- helpers used across screens ---------- */
export const MEAL_KEYS = ['breakfast', 'lunch', 'dinner', 'snack'];
export const MEAL_ICON = { breakfast: '🌅', lunch: '🍽️', dinner: '🌙', snack: '🍎' };

/** Split of a day's calorie goal across meals (used for suggestions). */
export const MEAL_SPLIT = { breakfast: 0.25, lunch: 0.35, dinner: 0.30, snack: 0.10 };
