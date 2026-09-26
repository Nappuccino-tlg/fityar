/* ============ Account and sync ============
   One job: the person changes phone and their history comes with them.

   The account is OPTIONAL and stays that way. Everything in FitYar works with
   no account and no connection, and signing in does not change that — it only
   adds a copy on the server that another device can pull down. Making it
   compulsory would break the app for anyone offline, which in Iran is often.

   The password is sent once, over HTTPS, and never stored on the device. What
   is stored is the token the server signed back, which expires.

   Photos are deliberately left out of sync: they are most of an export's size,
   and the numbers are what a person needs on a new phone. They stay on the
   device that took them, and the backup file still carries them if asked.
========================================== */

import * as db from './db.js';
import { S } from './store.js';
import { PROXY_URL } from './config.js';

const base = () => String(S.settings.baseUrl || PROXY_URL || '').replace(/\/+$/, '');

/** Accounts need the server; without one the feature reports itself off. */
export const available = () => !!base();

export async function session() {
  return (await db.metaGet('account', null)) || null;
}

const saveSession = (v) => db.metaSet('account', v);

class AccountError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

async function call(path, { body, token, timeout = 20000 } = {}) {
  if (!base()) throw new AccountError('no-server', 'no server configured');
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeout);
  let r;
  try {
    r = await fetch(`${base()}/${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'X-FitYar-Token': token } : {}),
      },
      body: JSON.stringify(body || {}),
      signal: ctrl.signal,
    });
  } catch {
    throw new AccountError('offline', 'could not reach the server');
  } finally {
    clearTimeout(timer);
  }

  let data = null;
  try { data = await r.json(); } catch {}
  if (!r.ok) {
    const code = data?.error?.code || 'http-' + r.status;
    /* A token lives 90 days and then stops. Drop it but keep who they are, so
       the sign-in form can come back with the username already filled and the
       person only has to type a password — not work out what went wrong. */
    if (code === 'bad-token') await expireSession();
    const err = new AccountError(code, data?.error?.message || 'request failed');
    if (data?.error) Object.assign(err, {
      serverAt: data.error.serverAt, serverVersion: data.error.serverVersion,
    });
    throw err;
  }
  return data;
}

async function expireSession() {
  const s = await session();
  if (s) await saveSession({ ...s, token: null, expired: true });
}

export async function register({ first, last, username, phone, password }) {
  const res = await call('auth/register', { body: { first, last, username, phone, password } });
  await saveSession({ token: res.token, account: res.account, at: Date.now(), version: 0 });
  /* the caller must show this once; it is never retrievable again */
  return { account: res.account, recoveryCode: res.recoveryCode };
}

export async function login({ username, password }) {
  const res = await call('auth/login', { body: { username, password } });
  /* A sign-in knows nothing about what this device holds, so version starts at
     zero: the first upload has to be a deliberate choice, not an accident. */
  await saveSession({ token: res.token, account: res.account, at: Date.now(), version: 0 });
  return res.account;
}

/** Forget the token. The diary on this device is untouched. */
export async function signOut() {
  await saveSession(null);
}

/**
 * Send this device's diary up.
 *
 * `baseVersion` is the version this device last saw. If the account has moved
 * on since — a second phone logged a week while this one was in a drawer — the
 * server refuses with `stale` instead of letting this upload erase it. Only a
 * person who has been told what they are choosing sends `force`.
 */
export async function push({ force = false } = {}) {
  const s = await session();
  if (!s?.token) throw new AccountError('signed-out', 'not signed in');
  const data = await db.exportAll({ photos: false });   /* photos stay on the device */
  const res = await call('sync/push', {
    body: { data, baseVersion: s.version || 0, force },
    token: s.token, timeout: 40000,
  });
  await saveSession({ ...s, lastSync: res.at, version: res.version || 0 });
  return res.at;
}

/**
 * Bring the account's diary down onto this device.
 * This REPLACES what is here, which is the point on a new phone and a hazard on
 * an old one, so every caller asks first.
 */
export async function pull() {
  const s = await session();
  if (!s?.token) throw new AccountError('signed-out', 'not signed in');
  const res = await call('sync/pull', { token: s.token, timeout: 40000 });
  if (!res.data) {
    /* Nothing up there yet, but this device is now level with the account, so
       its next upload is not mistaken for a stale one. */
    await saveSession({ ...s, version: res.version || 0 });
    return { restored: false, at: null };
  }
  /* Keep what is about to be replaced. The confirmation says plainly that this
     overwrites the phone, but a warning read in a hurry is not a safety net;
     this is. Photos are excluded here as everywhere, so it stays small. */
  let undo = null;
  try { undo = await db.exportAll({ photos: false }); } catch {}

  await db.importAll(res.data, { merge: false });
  if (undo) await db.metaSet('syncUndo', { at: Date.now(), data: undo });
  await saveSession({ ...s, lastSync: res.at, version: res.version || 0 });
  return { restored: true, at: res.at };
}

/** When the last download replaced something, this is when it happened. */
export async function undoAvailable() {
  const u = await db.metaGet('syncUndo', null);
  return u?.data ? u.at : null;
}

/** Put back the copy that the last download replaced. */
export async function undoPull() {
  const u = await db.metaGet('syncUndo', null);
  if (!u?.data) throw new AccountError('no-undo', 'nothing to undo');
  await db.importAll(u.data, { merge: false });
  await db.metaSet('syncUndo', null);
}

/** What the account holds, without touching this device. Used before a choice. */
export async function peek() {
  const s = await session();
  if (!s?.token) throw new AccountError('signed-out', 'not signed in');
  const res = await call('sync/pull', { token: s.token, timeout: 40000 });
  return { at: res.at, version: res.version || 0, has: !!res.data };
}

/**
 * A forgotten password, answered with the code given at registration.
 * There is no email here on purpose, so this code is the only way back in.
 */
export async function resetPassword({ username, recoveryCode, password }) {
  const res = await call('auth/reset', { body: { username, recoveryCode, password } });
  await saveSession({ token: res.token, account: res.account, at: Date.now(), version: 0 });
  return res;
}

/**
 * Remove the account and its copy from the server for good.
 * The diary on this device is deliberately left alone: someone closing their
 * account should not also lose the history on the phone in their hand.
 */
export async function deleteAccount() {
  const s = await session();
  if (!s?.token) throw new AccountError('signed-out', 'not signed in');
  await call('sync/delete', { token: s.token });
  await saveSession(null);
}

/** Turn an error code into something the person can act on. */
export function errorText(e, t) {
  const code = e?.code || '';
  const map = {
    'no-server':       t('accNoServer'),
    'no-accounts':     t('accNoServer'),
    'offline':         t('accOffline'),
    'bad-username':    t('accBadUsername'),
    'bad-phone':       t('accBadPhone'),
    'weak-password':   t('accWeakPassword'),
    'bad-name':        t('accBadName'),
    'username-taken':  t('accTaken'),
    'bad-credentials': t('accWrong'),
    'bad-token':       t('accExpired'),
    'too-large':       t('accTooLarge'),
    'stale':           t('accStale'),
    'bad-recovery':    t('accBadRecovery'),
    'auth-rate':       t('accTooMany'),
    'sync-rate':       t('accTooMany'),
    'rate':            t('accTooMany'),
    'signed-out':      t('accExpired'),
  };
  return map[code] || e?.message || t('error');
}
