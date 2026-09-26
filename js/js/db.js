/* ============ IndexedDB wrapper ============ */
/* The storage key stays 'fitcore' even though the app is now called FitYar —
   renaming it would point the browser at a brand-new, empty database and every
   existing log would vanish. The name is invisible to the user either way. */
const DB_NAME = 'fitcore';
const DB_VER = 3;

export const STORES = {
  meta:         { keyPath: 'k' },
  foodLogs:     { keyPath: 'id', idx: { date: 'date' } },
  foods:        { keyPath: 'id', idx: { name: 'name' } },
  photos:       { keyPath: 'id' },
  weights:      { keyPath: 'date' },
  water:        { keyPath: 'date' },
  notes:        { keyPath: 'date' },
  exercises:    { keyPath: 'id' },
  routines:     { keyPath: 'id' },
  workouts:     { keyPath: 'id', idx: { date: 'date' } },
  measurements: { keyPath: 'id', idx: { date: 'date' } },
  plans:        { keyPath: 'id' },
  dayReports:   { keyPath: 'date' },     // end-of-day analysis, one per date
  savedMeals:   { keyPath: 'id' },       // reusable combos ("my usual breakfast")
  barcodes:     { keyPath: 'code' },     // barcode -> food, built up by the user
  bodyPhotos:   { keyPath: 'id', idx: { date: 'date' } },
};

let _db = null;

function createMissing(db) {
  for (const [name, cfg] of Object.entries(STORES)) {
    if (db.objectStoreNames.contains(name)) continue;
    const s = db.createObjectStore(name, { keyPath: cfg.keyPath });
    if (cfg.idx) for (const [n, kp] of Object.entries(cfg.idx)) s.createIndex(n, kp);
  }
}

function openAt(version) {
  return new Promise((res, rej) => {
    const req = version ? indexedDB.open(DB_NAME, version) : indexedDB.open(DB_NAME);
    req.onupgradeneeded = (e) => createMissing(e.target.result);
    req.onsuccess = () => res(req.result);
    req.onerror = () => rej(req.error);
    /* Another tab holding the old version open blocks the upgrade. Saying so
       beats hanging on a promise that never settles. */
    req.onblocked = () => rej(new Error('db-blocked'));
  });
}

export function open() {
  if (_db) return Promise.resolve(_db);
  return (async () => {
    /* Open at whatever version is already on the device — never at DB_VER.
       Asking for a LOWER version than the one stored is a VersionError, and a
       database that has ever been repaired sits one above DB_VER, so naming the
       constant here would break the app on the launch after every repair. */
    let db = await openAt(null);

    /* Adding a store to STORES without raising DB_VER leaves existing installs
       without it — correct for whoever wrote the code, broken for everyone who
       updated. Rather than trust that the number was remembered, look. */
    const missing = Object.keys(STORES).filter(n => !db.objectStoreNames.contains(n));
    if (missing.length || db.version < DB_VER) {
      if (missing.length) console.warn('[db] restoring stores this install lacks:', missing.join(', '));
      const next = Math.max(DB_VER, db.version + 1);
      db.close();
      db = await openAt(next);
    }

    /* A tab that opens later with a higher version needs this one to let go,
       or its upgrade blocks forever and that tab looks frozen. */
    db.onversionchange = () => { db.close(); _db = null; };

    _db = db;
    return db;
  })();
}

function tx(store, mode = 'readonly') {
  return open().then(db => db.transaction(store, mode).objectStore(store));
}
function wrap(request) {
  return new Promise((res, rej) => {
    request.onsuccess = () => res(request.result);
    request.onerror = () => rej(request.error);
  });
}

export const get     = (s, k)   => tx(s).then(o => wrap(o.get(k)));
export const all     = (s)      => tx(s).then(o => wrap(o.getAll()));
export const put     = (s, v)   => tx(s, 'readwrite').then(o => wrap(o.put(v)));
export const del     = (s, k)   => tx(s, 'readwrite').then(o => wrap(o.delete(k)));
export const clear   = (s)      => tx(s, 'readwrite').then(o => wrap(o.clear()));
export const count   = (s)      => tx(s).then(o => wrap(o.count()));

export function putMany(store, items) {
  return open().then(db => new Promise((res, rej) => {
    const t = db.transaction(store, 'readwrite');
    const o = t.objectStore(store);
    items.forEach(it => o.put(it));
    t.oncomplete = () => res(true);
    t.onerror = () => rej(t.error);
  }));
}

/** Get all records whose index value is in [from, to] (inclusive). */
export function range(store, index, from, to) {
  return tx(store).then(o => wrap(o.index(index).getAll(IDBKeyRange.bound(from, to))));
}
export function byIndex(store, index, value) {
  return tx(store).then(o => wrap(o.index(index).getAll(value)));
}

/* ---------- meta / settings helpers ---------- */
export async function metaGet(key, fallback = null) {
  const r = await get('meta', key);
  return r === undefined || r === null ? fallback : r.v;
}
export const metaSet = (key, v) => put('meta', { k: key, v });

/* ---------- ids ---------- */
export function uid(prefix = '') {
  const t = Date.now().toString(36);
  const r = Math.random().toString(36).slice(2, 8);
  return prefix + t + r;
}

/* ---------- blob <-> base64, for moving photos between devices ---------- */
const PHOTO_STORES = ['photos', 'bodyPhotos'];

const blobToB64 = (blob) => new Promise((res, rej) => {
  const r = new FileReader();
  r.onload = () => res(String(r.result).split(',')[1]);
  r.onerror = () => rej(r.error);
  r.readAsDataURL(blob);
});
const b64ToBlob = (b64, type = 'image/jpeg') => {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return new Blob([bytes], { type });
};

/* ---------- full export / import ---------- */

/**
 * Everything, as one JSON object.
 * @param {{photos?: boolean}} opts  photos are large, so they are opt-in
 */
export async function exportAll({ photos = false } = {}) {
  const out = { _app: 'fityar', _ver: DB_VER, _at: new Date().toISOString(), _photos: !!photos };
  for (const name of Object.keys(STORES)) {
    if (PHOTO_STORES.includes(name)) continue;
    out[name] = await all(name);
  }
  if (photos) {
    for (const name of PHOTO_STORES) {
      const rows = await all(name);
      out[name] = [];
      for (const r of rows) {
        if (!r.blob) continue;
        out[name].push({ ...r, blob: undefined, b64: await blobToB64(r.blob),
                         mime: r.blob.type || 'image/jpeg' });
      }
    }
  }
  return out;
}

/** Roughly how big the export will be, in bytes. */
export async function exportSize({ photos = false } = {}) {
  let bytes = 0;
  for (const name of Object.keys(STORES)) {
    if (PHOTO_STORES.includes(name)) continue;
    bytes += JSON.stringify(await all(name)).length;
  }
  if (photos) bytes += Math.round((await photoBytes()) * 1.37);   // base64 overhead
  return bytes;
}

/**
 * Restore a backup.
 *
 * Everything is decoded and validated FIRST, and only then written. A truncated
 * file or one bad photo used to blow up half way through — after some stores had
 * already been cleared — which left the user worse off than before they tried.
 */
export async function importAll(data, { merge = false } = {}) {
  // older exports carry the previous name — still perfectly valid
  if (!data || !['fityar', 'fitcore'].includes(data._app)) throw new Error('bad-file');

  /* ---- phase 1: decode everything, touching nothing ---- */
  const staged = {};
  for (const name of Object.keys(STORES)) {
    const rows = data[name];
    if (!Array.isArray(rows)) continue;

    if (!PHOTO_STORES.includes(name)) {
      if (rows.some(r => r === null || typeof r !== 'object')) {
        throw new Error(`bad-rows:${name}`);
      }
      staged[name] = rows;
      continue;
    }

    const out = [];
    for (const r of rows) {
      if (!r || !r.b64) continue;
      const { b64, mime, ...rest } = r;
      let blob;
      try { blob = b64ToBlob(b64, mime); }
      catch { throw new Error(`bad-photo:${name}`); }
      out.push({ ...rest, blob });
    }
    staged[name] = out;
  }
  if (!Object.keys(staged).length) throw new Error('nothing-to-import');

  /* ---- phase 2: apply, now that nothing can fail on decoding ---- */
  for (const [name, rows] of Object.entries(staged)) {
    if (!merge) await clear(name);
    if (rows.length) await putMany(name, rows);
  }
  return true;
}

export async function wipeAll() {
  for (const name of Object.keys(STORES)) await clear(name);
}

/** Rough size of every stored image, in bytes. */
export async function photoBytes() {
  let total = 0;
  for (const name of PHOTO_STORES) {
    for (const p of await all(name)) total += p.blob?.size || 0;
  }
  return total;
}
