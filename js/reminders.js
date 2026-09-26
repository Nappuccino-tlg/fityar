/* ============ Daily reminders ============
   A food diary is abandoned for one reason more than any other: the person
   forgets. Three meals logged on day one, two on day three, none by day five.
   A nudge at the time they normally eat is the single largest thing that keeps
   a diary alive, so it is worth more than another hundred foods.

   These are LOCAL notifications: the phone schedules them itself and fires them
   with no network and no server. Nothing leaves the device, and nothing knows
   whether they were opened.

   The app has no bundler, so the plugin is reached through the object Capacitor
   publishes at runtime rather than through an import. In a plain browser that
   object is absent — a web page cannot schedule a notification for a time when
   it is closed without a push server — so the feature reports itself as
   unavailable instead of pretending to work.
============================================== */

import * as db from './db.js';
import { S } from './store.js';
import { t, getLang } from './i18n.js';

const plugin = () => window.Capacitor?.Plugins?.LocalNotifications || null;

/** Reminders can only be scheduled inside the installed app. */
export const available = () => !!plugin();

/* Ids are fixed so rescheduling replaces rather than accumulates. */
const SLOTS = [
  { key: 'breakfast', id: 101, hour: 8,  minute: 0 },
  { key: 'lunch',     id: 102, hour: 13, minute: 30 },
  { key: 'dinner',    id: 103, hour: 20, minute: 30 },
  { key: 'snack',     id: 104, hour: 17, minute: 0 },
  { key: 'weighIn',   id: 110, hour: 8,  minute: 0, weekday: 7 },  // Saturday
];

export const DEFAULTS = {
  enabled: false,
  slots: Object.fromEntries(SLOTS.map(s => [
    s.key, { on: s.key !== 'snack', time: pad(s.hour) + ':' + pad(s.minute) },
  ])),
};

function pad(n) { return String(n).padStart(2, '0'); }

export async function load() {
  const saved = await db.metaGet('reminders', null);
  const cfg = { ...DEFAULTS, ...(saved || {}) };
  cfg.slots = { ...DEFAULTS.slots, ...(saved?.slots || {}) };
  return cfg;
}

export const save = (cfg) => db.metaSet('reminders', cfg);

/** Ask once, and report honestly whether we may post notifications. */
export async function requestPermission() {
  const p = plugin();
  if (!p) return false;
  try {
    const cur = await p.checkPermissions();
    if (cur.display === 'granted') return true;
    const res = await p.requestPermissions();
    return res.display === 'granted';
  } catch {
    return false;
  }
}

function bodyFor(key) {
  const fa = getLang() === 'fa';
  const name = t(key);
  if (key === 'weighIn') {
    return fa ? 'وزن این هفته را ثبت کن' : 'Log this week’s weight';
  }
  return fa ? `${name} را ثبت کن` : `Log your ${name.toLowerCase()}`;
}

function titleFor() {
  return getLang() === 'fa' ? 'فیت‌یار' : 'FitYar';
}

/**
 * Cancel everything we own, then schedule what is switched on.
 * Called whenever the settings change and again on every app start, so a phone
 * that dropped its schedule (a reboot, a force-stop) gets it back.
 */
export async function apply(cfg) {
  const p = plugin();
  if (!p) return { scheduled: 0, reason: 'unavailable' };

  const ids = SLOTS.map(s => ({ id: s.id }));
  try { await p.cancel({ notifications: ids }); } catch {}

  if (!cfg.enabled) return { scheduled: 0, reason: 'off' };
  if (!(await requestPermission())) return { scheduled: 0, reason: 'denied' };

  const out = [];
  for (const slot of SLOTS) {
    const conf = cfg.slots[slot.key];
    if (!conf?.on) continue;
    const [h, m] = String(conf.time || '').split(':').map(Number);
    if (!Number.isFinite(h) || !Number.isFinite(m)) continue;

    out.push({
      id: slot.id,
      title: titleFor(),
      body: bodyFor(slot.key),
      /* `on` without a day repeats daily; adding weekday makes it weekly */
      schedule: {
        on: slot.weekday ? { weekday: slot.weekday, hour: h, minute: m }
                         : { hour: h, minute: m },
        allowWhileIdle: true,
      },
      smallIcon: 'ic_launcher',
    });
  }

  if (!out.length) return { scheduled: 0, reason: 'none-selected' };
  try {
    await p.schedule({ notifications: out });
    return { scheduled: out.length, reason: 'ok' };
  } catch (e) {
    return { scheduled: 0, reason: 'error', message: String(e?.message || e) };
  }
}

/** Re-apply on start so a schedule lost to a reboot comes back. */
export async function reapply() {
  if (!available()) return;
  const cfg = await load();
  if (cfg.enabled) await apply(cfg);
}

export { SLOTS };
