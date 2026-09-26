/* ============================================================
   VOICE — the Persian-speaking coach 🗣️
   Plain SpeechSynthesis: no key, no network, no library.
   Announces the rest countdown (۳…۲…۱), "rest over", the next
   set ("۸۰ کیلوگرم، ۸ تکرار"), new records and level-ups.
   Strictly opt-in: nothing speaks unless voice: true in settings.
   ============================================================ */

import { getLang, num } from './i18n.js';
import { S } from './store.js';

let enabled = null;          // tri-state cache of S.settings.voice
let lastSpokenKey = '';      // dedupe: one copy of each line
let lastTickSpoken = -1;

function on() {
  if (enabled === null) enabled = !!(S.settings && S.settings.voice);
  return enabled;
}

/** Pick a Persian voice if there is one; refresh when the choir changes. */
let voice = null, voiceTried = false;
function pickVoice() {
  try {
    const vs = speechSynthesis.getVoices();
    if (!vs.length) return null;
    return vs.find(v => /^fa([-_]|$)/i.test(v.lang))
        || vs.find(v => /persian|farsi|irani/i.test(v.name))
        || null;
  } catch { return null; }
}
try {
  speechSynthesis.addEventListener('voiceschanged', () => { voiceTried = false; });
} catch { /* older engines */ }

function say(text, { rate = 1, pitch = 1, force = false } = {}) {
  if (!force && !on()) return;
  try {
    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (!voiceTried) { voice = pickVoice(); voiceTried = true; }
    if (voice) u.voice = voice;
    u.lang = voice?.lang || 'fa-IR';
    u.rate = rate; u.pitch = pitch; u.volume = 1;
    speechSynthesis.speak(u);
  } catch { /* speech is garnish; never let it break a workout */ }
}

function once(key, fn) {
  if (lastSpokenKey === key) return;
  lastSpokenKey = key;
  fn();
}

/* ---------------- rest timer hooks ---------------- */

let restPendingCountdown = false;

export function onRestStart(totalSec) {
  lastTickSpoken = -1;
  restPendingCountdown = totalSec >= 10;   // long rests get a countdown at the end
  if (!on()) return;
  const fa = getLang() === 'fa';
  once('r' + Math.round(totalSec) + Date.now() / 60000, () =>
    say(fa ? `${num(Math.round(totalSec))} ثانیه استراحت` : `Rest ${Math.round(totalSec)} seconds`, { rate: 1.05 }));
}

export function onRestTick(leftSec) {
  if (!on() || !restPendingCountdown) return;
  const n = Math.ceil(leftSec);
  if (n <= 3 && n >= 1 && n !== lastTickSpoken) {
    lastTickSpoken = n;
    const fa = getLang() === 'fa';
    say(fa ? ['سه', 'دو', 'یک'][3 - n] : String(n), { rate: 1.1 });
  }
}

export function onRestEnd() {
  lastTickSpoken = -1;
  if (!on()) return;
  const fa = getLang() === 'fa';
  say(fa ? 'استراحت تمام شد' : 'Rest over', { rate: 1.05 });
}

/* ---------------- workout moments ---------------- */

/** The next set, read out: «۸۰ کیلوگرم، ۸ تکرار». */
export function onNextSet(w, reps, unitLabel) {
  if (!on()) return;
  const fa = getLang() === 'fa';
  const unit = unitLabel || (fa ? 'کیلوگرم' : 'kilograms');
  const parts = [];
  if (w) parts.push(`${num(w)} ${unit}`);
  if (reps) parts.push(fa ? `${num(reps)} تکرار` : `${reps} reps`);
  if (parts.length) say(parts.join(fa ? '، ' : ', '), { rate: 1 });
}

export function onPR(exLabel) {
  if (!on()) return;
  const fa = getLang() === 'fa';
  say(fa ? `رکورد جدید در ${exLabel || 'حرکت'}! آفرین` : `New record on ${exLabel || 'exercise'}!`, { rate: 1, pitch: 1.1 });
}

export function onLevelUp(level) {
  if (!on()) return;
  const fa = getLang() === 'fa';
  say(fa ? `سطح ${num(level)} شدی!` : `Level ${level} reached!`, { rate: 1, pitch: 1.1 });
}

/** A courtesy line when the person flips the switch — proves the mouth works. */
export function hello() {
  say(getLang() === 'fa' ? 'مربی صوتی روشن شد' : 'Voice coach on', { force: true });
}
export function bye() {
  try { speechSynthesis.cancel(); } catch { /* fine */ }
}
