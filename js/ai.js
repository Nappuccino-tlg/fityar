/* ============ AI layer: meal photo analysis + plan generation ============
   Two provider families are supported:
     • gemini  — Google Generative Language API (native format)
     • openai  — ANY OpenAI-compatible /chat/completions endpoint:
                 OpenAI, OpenRouter, Groq, a local Ollama/LM Studio,
                 or a regional proxy that speaks the same protocol.
   Keys and base URLs never leave this device except in the request itself.
========================================================================== */
import { getLang } from './i18n.js';

const GEMINI_BASE = 'https://generativelanguage.googleapis.com/v1beta/models';

export const PROVIDERS = [
  { id: 'proxy',  name: 'My server',        nameFa: 'سرور من' },
  { id: 'gemini', name: 'Google Gemini',    nameFa: 'گوگل جِمینای' },
  { id: 'openai', name: 'OpenAI-compatible', nameFa: 'سازگار با OpenAI' },
];

/** Ready-made base URLs. `vision` flags whether the listed models can read images. */
export const ENDPOINT_PRESETS = [
  { id: 'openai',     label: 'OpenAI',                     url: 'https://api.openai.com/v1',                        models: ['gpt-4o-mini', 'gpt-4o'], vision: true },
  { id: 'openrouter', label: 'OpenRouter',                 url: 'https://openrouter.ai/api/v1',                     models: ['google/gemini-2.0-flash-exp:free', 'meta-llama/llama-3.2-11b-vision-instruct:free', 'qwen/qwen2.5-vl-72b-instruct:free'], vision: true },
  { id: 'groq',       label: 'Groq',                       url: 'https://api.groq.com/openai/v1',                   models: ['meta-llama/llama-4-scout-17b-16e-instruct', 'meta-llama/llama-4-maverick-17b-128e-instruct'], vision: true },
  { id: 'gemini_oai', label: 'Gemini (OpenAI-compatible)', url: 'https://generativelanguage.googleapis.com/v1beta/openai', models: ['gemini-2.5-flash', 'gemini-2.0-flash'], vision: true },
  { id: 'ollama',     label: 'Ollama / LM Studio (local)', url: 'http://localhost:11434/v1',                        models: ['qwen2.5vl:7b', 'llava:13b', 'llama3.2-vision'], vision: true },
  { id: 'custom',     label: 'Custom / سرویس دیگر',        url: '',                                                 models: [], vision: true },
];

export const GEMINI_MODELS = [
  { value: 'gemini-2.5-flash',      label: 'Gemini 2.5 Flash — free, fast (recommended)' },
  { value: 'gemini-2.5-flash-lite', label: 'Gemini 2.5 Flash Lite — free, fastest' },
  { value: 'gemini-2.0-flash',      label: 'Gemini 2.0 Flash — free, stable' },
  { value: 'gemini-2.5-pro',        label: 'Gemini 2.5 Pro — most accurate (limited free)' },
];
export const DEFAULT_MODEL = 'gemini-2.5-flash';

/* ---------------- image handling ---------------- */

/** Downscale + re-encode so uploads stay small and fast. */
export function shrinkImage(file, maxSide = 1024, quality = 0.85) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale), h = Math.round(img.height * scale);
      const cv = document.createElement('canvas');
      cv.width = w; cv.height = h;
      cv.getContext('2d').drawImage(img, 0, 0, w, h);
      cv.toBlob(b => b ? res(b) : rej(new Error('encode-failed')), 'image/jpeg', quality);
    };
    img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('bad-image')); };
    img.src = url;
  });
}

export function blobToBase64(blob) {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(String(r.result).split(',')[1]);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(blob);
  });
}

/* ---------------- errors ---------------- */

class AIError extends Error {
  constructor(code, msg) { super(msg); this.code = code; }
}

function friendly(code, raw) {
  const fa = getLang() === 'fa';
  const M = {
    'no-key':   fa ? 'کلید API وارد نشده است.' : 'No API key set.',
    'no-url':   fa ? 'آدرس سرویس (Base URL) وارد نشده است.' : 'No base URL set.',
    'bad-key':  fa ? 'کلید API نامعتبر است یا اعتبارش تمام شده. کلید را دوباره بررسی کنید.'
                   : 'Invalid or expired API key.',
    'quota':    fa ? 'سقف درخواست پر شده. چند دقیقه صبر کنید یا مدل سبک‌تری انتخاب کنید.'
                   : 'Rate limit reached. Wait a few minutes or pick a lighter model.',
    'geo':      fa ? 'این سرویس از موقعیت جغرافیایی شما در دسترس نیست. یا از VPN استفاده کنید، یا در «تنظیمات هوش مصنوعی» یک سرویس‌دهنده‌ی دیگر انتخاب کنید.'
                   : 'This service is not available from your location. Use a VPN or pick another provider.',
    'blocked':  fa ? 'سرویس این درخواست را رد کرد. عکس یا متن دیگری امتحان کنید.'
                   : 'The request was blocked. Try a different photo or wording.',
    'network':  fa ? 'اتصال به سرویس برقرار نشد. اینترنت، آدرس سرویس و در صورت نیاز VPN را بررسی کنید.'
                   : 'Could not reach the service. Check your connection and base URL.',
    'no-vision':fa ? 'این مدل عکس را نمی‌خواند. یک مدل با قابلیت vision انتخاب کنید، یا از «توصیف با متن» استفاده کنید.'
                   : 'This model cannot read images. Pick a vision model, or use “describe in words”.',
    'parse':    fa ? 'پاسخ سرویس قابل خواندن نبود. دوباره تلاش کنید یا مدل دیگری بزنید.'
                   : 'Could not read the response. Try again or use another model.',
    'model':    fa ? 'این مدل در دسترس نیست. نام مدل را بررسی کنید.'
                   : 'That model is unavailable. Check the model name.',
    'proxy-origin': fa ? 'سرور واسط این دامنه را نمی‌پذیرد. مقدار ALLOWED در تنظیمات Worker باید دقیقاً آدرس همین اپ باشد.'
                       : 'The proxy rejected this origin. Its ALLOWED setting must match this app’s address.',
    'proxy-setup':  fa ? 'سرور واسط هنوز کامل تنظیم نشده است.'
                       : 'The proxy is not fully configured yet.',
    'daily-quota':  fa ? 'ظرفیت رایگان امروز پر شده است. فردا دوباره فعال می‌شود — یا در «تنظیمات هوش مصنوعی» سرویس خودتان را وارد کنید. تا آن موقع می‌توانید غذا را دستی یا با بارکد ثبت کنید.'
                       : 'Today’s free capacity is used up. It resets tomorrow, or you can add your own service under AI settings. Manual and barcode entry still work.',
    'rate':         fa ? 'در یک ساعت گذشته درخواست زیادی از این دستگاه فرستاده شده. کمی صبر کنید و دوباره امتحان کنید.'
                       : 'Too many requests from this device in the past hour. Wait a little and try again.',
  };
  /* Unlisted codes (e.g. 'proxy-detail') deliberately fall through to the raw
     message, which the proxy wrote for this user. */
  return M[code] || raw || (fa ? 'خطای ناشناخته' : 'Unknown error');
}
export const aiErrorText = (e) => (e instanceof AIError ? friendly(e.code, e.message) : friendly('network', e?.message));

/** Map an HTTP failure onto one of our codes. */
function httpError(status, detail = '', viaProxy = false, code = '') {
  const d = detail.toLowerCase();

  /* Failures from our own Worker are already written for this user — a generic
     "check your connection" would hide the one line that says what to fix. */
  if (viaProxy) {
    if (code === 'daily-quota' || code === 'rate') return new AIError(code, detail);
    if (status === 403 && /origin/i.test(d)) return new AIError('proxy-origin', detail);
    if (status === 429) return new AIError('quota', detail);
    if (/no backend|binding|GEMINI_KEY/i.test(detail)) return new AIError('proxy-setup', detail);
    if (status >= 500 && detail) return new AIError('proxy-detail', detail);
  }

  if (/location is not supported|user location|not available in your country|unsupported_country|region/i.test(detail))
    return new AIError('geo', detail);
  if (status === 400 && /api[_ ]?key/i.test(detail)) return new AIError('bad-key', detail);
  if (status === 401 || status === 403) {
    if (/country|region|location/i.test(d)) return new AIError('geo', detail);
    return new AIError('bad-key', detail);
  }
  if (status === 429) return new AIError('quota', detail);
  if (status === 404) return new AIError('model', detail);
  if (/image|vision|multimodal/i.test(d) && status === 400) return new AIError('no-vision', detail);
  return new AIError('network', `${status} ${detail}`.trim());
}

function parseJSON(text) {
  try { return JSON.parse(text); } catch {}
  // strip markdown fences some models add
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenced) { try { return JSON.parse(fenced[1]); } catch {} }
  const m = text.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  throw new AIError('parse');
}

/* ---------------- provider calls ---------------- */

/**
 * Same wire format as Gemini, but the key lives on the proxy instead of here.
 * That is the only way a published static page can offer this to everyone
 * without handing the key to every visitor.
 */
async function callProxy(cfg, opts) {
  const base = String(cfg.baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new AIError('no-url');
  return callGemini({ ...cfg, key: null, _base: base }, opts);
}

async function callGemini(cfg, { parts, schema, temperature, maxTokens }) {
  const body = {
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature, maxOutputTokens: maxTokens,
      ...(schema ? { responseMimeType: 'application/json', responseSchema: schema } : {}),
    },
    safetySettings: [
      'HARM_CATEGORY_HARASSMENT', 'HARM_CATEGORY_HATE_SPEECH',
      'HARM_CATEGORY_SEXUALLY_EXPLICIT', 'HARM_CATEGORY_DANGEROUS_CONTENT',
    ].map(category => ({ category, threshold: 'BLOCK_ONLY_HIGH' })),
  };

  /* Through the proxy there is no key in the URL — the worker adds it. */
  const url = cfg._base
    ? `${cfg._base}/${encodeURIComponent(cfg.model)}:generateContent`
    : `${GEMINI_BASE}/${encodeURIComponent(cfg.model)}:generateContent?key=${encodeURIComponent(cfg.key)}`;

  let r;
  try {
    r = await fetch(url, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } catch (e) { throw new AIError('network', e.message); }

  if (!r.ok) {
    let detail = '', code = '';
    try {
      const e = (await r.json())?.error || {};
      detail = e.message || '';
      code = e.code || '';
    } catch {}
    throw httpError(r.status, detail, !!cfg._base, code);
  }

  const j = await r.json();
  const cand = j.candidates?.[0];
  if (!cand) {
    if (j.promptFeedback?.blockReason) throw new AIError('blocked', j.promptFeedback.blockReason);
    throw new AIError('parse');
  }
  if (cand.finishReason === 'SAFETY') throw new AIError('blocked');
  const text = (cand.content?.parts || []).map(p => p.text || '').join('').trim();
  if (!text) throw new AIError('parse');
  return text;
}

async function callOpenAICompat(cfg, { parts, schema, temperature, maxTokens }) {
  const base = String(cfg.baseUrl || '').trim().replace(/\/+$/, '');
  if (!base) throw new AIError('no-url');

  // neutral parts -> OpenAI content blocks
  const content = parts.map(p => p.inline_data
    ? { type: 'image_url', image_url: { url: `data:${p.inline_data.mime_type};base64,${p.inline_data.data}` } }
    : { type: 'text', text: p.text });

  const messages = [{ role: 'user', content }];
  if (schema) {
    messages.unshift({
      role: 'system',
      content: 'You reply with a single JSON object and nothing else — no prose, no markdown fences. '
             + 'It must match this JSON Schema exactly:\n' + JSON.stringify(schema),
    });
  }

  const send = (withFormat) => fetch(`${base}/chat/completions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.key}` },
    body: JSON.stringify({
      model: cfg.model, messages, temperature, max_tokens: maxTokens,
      ...(withFormat && schema ? { response_format: { type: 'json_object' } } : {}),
    }),
  });

  let r;
  try { r = await send(true); }
  catch (e) { throw new AIError('network', e.message); }

  // some gateways reject response_format — retry once without it
  if (!r.ok && r.status === 400 && schema) {
    try { r = await send(false); } catch (e) { throw new AIError('network', e.message); }
  }

  if (!r.ok) {
    let detail = '';
    try { const j = await r.json(); detail = j?.error?.message || j?.message || ''; } catch {}
    throw httpError(r.status, detail);
  }

  const j = await r.json();
  const text = j.choices?.[0]?.message?.content;
  if (!text || !String(text).trim()) throw new AIError('parse');
  return String(text).trim();
}

/** Dispatch to the configured provider. */
async function call(cfg, opts) {
  if (!cfg?.model) throw new AIError('model');
  const o = { temperature: 0.25, maxTokens: 4096, ...opts };
  if (cfg.provider === 'proxy') return callProxy(cfg, o);
  if (!cfg?.key) throw new AIError('no-key');
  return cfg.provider === 'openai' ? callOpenAICompat(cfg, o) : callGemini(cfg, o);
}

/* ---------------- meal photo analysis ---------------- */

const MEAL_SCHEMA = {
  type: 'object',
  properties: {
    dish:  { type: 'string' },
    items: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name:       { type: 'string' },
          nameFa:     { type: 'string' },
          grams:      { type: 'number' },
          kcal:       { type: 'number' },
          protein:    { type: 'number' },
          carbs:      { type: 'number' },
          fat:        { type: 'number' },
          fiber:      { type: 'number' },
          confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
        },
        required: ['name', 'nameFa', 'grams', 'kcal', 'protein', 'carbs', 'fat', 'confidence'],
      },
    },
    notes: { type: 'string' },
  },
  required: ['dish', 'items'],
};

const MEAL_PROMPT = `You are a nutrition estimation engine for a personal food-logging app.

Look at the meal photo and break it into the individual food components you can see.

For EACH component return:
- name: the food in English
- nameFa: the same food in Persian (Farsi). Use the common Iranian name when the dish is Iranian.
- grams: your best estimate of the edible portion weight in grams, judged from plate size, utensils and typical serving sizes
- kcal, protein, carbs, fat, fiber: totals for THAT estimated portion (not per 100 g), in kcal and grams
- confidence: "high" if the food and portion are both clear, "medium" if the food is clear but the portion is a guess, "low" if you are unsure what the food is

Also return:
- dish: a short name for the whole meal
- notes: one short sentence about what drove the portion estimate, or what is uncertain.

Rules:
- Include cooking oil, butter, sauces and dressings you can reasonably infer — they matter a lot for calories.
- Do not include inedible parts (bones, shells, wrappers).
- If several identical pieces are visible, count them and reflect that in grams.
- If the photo is not food at all, return an empty items array and say so in notes.
- Numbers must be plain numbers, never ranges or text.
- Be realistic, not optimistic: restaurant portions and home-cooked Iranian rice portions are large.`;

export async function analyzeMeal(cfg, { imageB64, mime = 'image/jpeg', hint = '' }) {
  const lang = getLang() === 'fa' ? 'Persian (Farsi)' : 'English';
  const parts = [
    { text: `${MEAL_PROMPT}\n\nWrite the "notes" field in ${lang}.` },
    { inline_data: { mime_type: mime, data: imageB64 } },
  ];
  if (hint && hint.trim()) {
    parts.push({ text: `The user adds this description of the meal — trust it over your visual guess where they conflict:\n"""${hint.trim()}"""` });
  }
  const text = await call(cfg, { parts, schema: MEAL_SCHEMA, temperature: 0.2, maxTokens: 2048 });
  const data = parseJSON(text);
  const n = (v) => Math.max(0, Math.round((Number(v) || 0) * 10) / 10);
  const items = (data.items || []).map(x => ({
    name: String(x.name || '').slice(0, 80),
    nameFa: String(x.nameFa || x.name || '').slice(0, 80),
    grams: Math.max(0, Math.round(Number(x.grams) || 0)),
    kcal: Math.max(0, Math.round(Number(x.kcal) || 0)),
    protein: n(x.protein), carbs: n(x.carbs), fat: n(x.fat), fiber: n(x.fiber),
    confidence: ['high', 'medium', 'low'].includes(x.confidence) ? x.confidence : 'medium',
  })).filter(x => x.name).map(reconcileKcal);
  return { dish: String(data.dish || '').slice(0, 80), items, notes: String(data.notes || '').slice(0, 400) };
}

/* A model can hand back macros and a calorie count that contradict each other —
   140 kcal for 10 g protein, 30 g carbs and 5 g fat, which by Atwater is 205.
   The macros are the sounder half far more often than the calorie figure is, so
   when the two disagree by more than a quarter we take Atwater's answer and say
   the confidence is low. Carbohydrate is carbs-by-difference, i.e. it already
   contains the fibre, which yields about 2 kcal/g rather than 4. */
const atwater = ({ protein = 0, carbs = 0, fat = 0, fiber = 0 }) =>
  protein * 4 + Math.max(0, carbs - fiber) * 4 + fat * 9 + fiber * 2;

export function reconcileKcal(item) {
  const calc = Math.round(atwater(item));
  if (!item.kcal) return calc ? { ...item, kcal: calc } : item;
  if (!calc) return item;
  const off = Math.abs(item.kcal - calc) / Math.max(item.kcal, calc);
  if (off <= 0.25) return item;
  return { ...item, kcal: calc, confidence: 'low', adjusted: true };
}

/* ---------------- text estimate ---------------- */

const TEXT_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' }, nameFa: { type: 'string' },
    grams: { type: 'number' }, kcal: { type: 'number' },
    protein: { type: 'number' }, carbs: { type: 'number' },
    fat: { type: 'number' }, fiber: { type: 'number' },
  },
  required: ['name', 'nameFa', 'grams', 'kcal', 'protein', 'carbs', 'fat'],
};

export async function estimateFoodText(cfg, { text }) {
  const parts = [{
    text: `Estimate the nutrition of this food described by a user of a food diary app.
Return the totals for the portion they describe (assume one typical serving if no amount is given).
"nameFa" must be the Persian name. Numbers only, no ranges.

User text: """${text}"""`,
  }];
  const out = await call(cfg, { parts, schema: TEXT_SCHEMA, temperature: 0.2, maxTokens: 800 });
  const d = parseJSON(out);
  const n = (v) => Math.max(0, Math.round((Number(v) || 0) * 10) / 10);
  return reconcileKcal({
    name: String(d.name || text).slice(0, 80),
    nameFa: String(d.nameFa || d.name || text).slice(0, 80),
    grams: Math.max(1, Math.round(Number(d.grams) || 100)),
    kcal: Math.max(0, Math.round(Number(d.kcal) || 0)),
    protein: n(d.protein), carbs: n(d.carbs), fat: n(d.fat), fiber: n(d.fiber),
  });
}

/* ---------------- plan generation ---------------- */

const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    summary: { type: 'string' },
    targets: {
      type: 'object',
      properties: {
        kcal: { type: 'number' }, protein: { type: 'number' },
        carbs: { type: 'number' }, fat: { type: 'number' },
        water: { type: 'number' }, rationale: { type: 'string' },
      },
      required: ['kcal', 'protein', 'carbs', 'fat', 'water', 'rationale'],
    },
    meals: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          meal: { type: 'string' }, kcal: { type: 'number' },
          options: { type: 'array', items: { type: 'string' } },
        },
        required: ['meal', 'kcal', 'options'],
      },
    },
    training: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          day: { type: 'string' }, focus: { type: 'string' },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' }, exerciseId: { type: 'string' },
                sets: { type: 'number' }, reps: { type: 'string' }, restSec: { type: 'number' },
              },
              required: ['name', 'sets', 'reps'],
            },
          },
          cardio: { type: 'string' },
        },
        required: ['day', 'focus', 'exercises'],
      },
    },
    tips: { type: 'array', items: { type: 'string' } },
    progression: { type: 'string' },
  },
  required: ['summary', 'targets', 'meals', 'training', 'tips', 'progression'],
};

export async function generatePlan(cfg, { profile, exerciseCatalog = [] }) {
  const lang = getLang() === 'fa' ? 'Persian (Farsi)' : 'English';
  const ids = exerciseCatalog.slice(0, 200).map(e => `${e.id}=${e.name}`).join('; ');

  const prompt = `You are an experienced strength coach and nutrition planner writing a plan for ONE person.

Person profile (JSON):
${JSON.stringify(profile, null, 1)}

Produce a practical, realistic plan:

targets — daily calorie and macro targets. Base them on the given TDEE. Use a moderate deficit or surplus (roughly 15–20%) suited to the goal, never below 1200 kcal for women or 1500 kcal for men. Protein 1.6–2.2 g per kg bodyweight. Fat at least 0.6 g/kg. Fill the rest with carbs. "water" is millilitres per day. "rationale" is 2–3 sentences explaining the numbers.

meals — 4 to 5 entries covering the day (breakfast, lunch, dinner, snacks). Each has a kcal budget and 3 concrete meal options. Prefer foods that are easy to buy in Iran and match the person's diet notes. Give portions in grams or household measures.

training — exactly ${profile.daysPerWeek || 4} training days. Each day has a focus, 4–7 exercises with sets, a rep range, and rest seconds. Where an exercise matches one from the catalog below, put its id in "exerciseId"; otherwise leave exerciseId empty. Add a short "cardio" note per day (may be "—").

Exercise catalog: ${ids}

tips — 4 to 6 short, specific, actionable tips for THIS person.
progression — one paragraph on how to add weight/reps over the coming weeks and when to deload.

Write every human-readable field in ${lang}. Keep "exerciseId" values exactly as given in the catalog. Do not add disclaimers inside the fields.`;

  const text = await call(cfg, { parts: [{ text: prompt }], schema: PLAN_SCHEMA, temperature: 0.6, maxTokens: 8192 });
  return parseJSON(text);
}

/* ---------------- connection test ---------------- */

export async function testKey(cfg) {
  const out = await call(cfg, {
    parts: [{ text: 'Reply with exactly: OK' }], temperature: 0, maxTokens: 16,
  });
  return /ok/i.test(out);
}

/** Send a 1×1 pixel to check whether the configured model actually accepts images. */
export async function testVision(cfg) {
  const PIXEL = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
  await call(cfg, {
    parts: [{ text: 'Reply with exactly: OK' }, { inline_data: { mime_type: 'image/png', data: PIXEL } }],
    temperature: 0, maxTokens: 16,
  });
  return true;
}
