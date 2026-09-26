/* ============ Barcode scanning — you teach it once, it remembers ============
   Reading the code is done on the device by the browser's BarcodeDetector.

   Three places are asked for the product, in this order, and the first two need
   no connection: what you have taught this device before, the branded products
   that ship with the app, and only then Open Food Facts. Whatever comes back is
   remembered, so a second scan of anything is offline too.
=========================================================================== */
import * as db from './db.js';
import { S, MEAL_KEYS, saveSettings } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, parseNum, buzz, loading,
} from './ui.js';
import { addLog, scaleFood, refreshAll } from './nutrition.js';
import { foodByBarcode } from './data-foods.js';
import { PROXY_URL } from './config.js';
import { emptyArt } from './art.js';

const FORMATS = ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'itf'];

export const canScan = () => typeof window.BarcodeDetector !== 'undefined';

/* ---------------- storage ---------------- */

export const findBarcode = (code) => db.get('barcodes', code);
export const allBarcodes = () => db.all('barcodes');

export async function bindBarcode(code, food) {
  await db.put('barcodes', { code, food, at: Date.now() });
}

/* ---------------- live scanner ---------------- */

let stream = null, raf = 0, detector = null;

function stopCamera() {
  cancelAnimationFrame(raf);
  raf = 0;
  if (stream) { stream.getTracks().forEach(tk => tk.stop()); stream = null; }
}

/**
 * Open the camera and watch for a barcode.
 * @param {(code:string)=>void} onCode
 */
export async function openScanner(meal = 'snack') {
  if (!canScan()) {
    return sheet(t('barcode'), el('div', {},
      el('div', { class: 'warn' }, t('barcodeNotSupported')),
      el('div', { class: 'info' }, getLang() === 'fa'
        ? 'روی کروم اندروید کار می‌کند. روی آیفون یا مرورگرهای قدیمی‌تر می‌توانی کد را دستی وارد کنی.'
        : 'Works on Chrome for Android. Elsewhere you can type the code by hand.'),
      manualEntry(meal),
    ));
  }

  const video = el('video', { autoplay: '', playsinline: '', muted: '' , class: 'bc-video' });
  const status = el('div', { class: 'bc-status' }, t('barcodeCamera'));
  const box = el('div', {},
    el('div', { class: 'bc-frame' }, video, el('div', { class: 'bc-reticle' })),
    status,
    manualEntry(meal),
  );
  sheet(t('scanBarcode'), box, { onClose: stopCamera });

  try {
    detector = detector || new window.BarcodeDetector({ formats: FORMATS });
    stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 } }, audio: false,
    });
    video.srcObject = stream;
    await video.play();
  } catch (e) {
    stopCamera();
    status.textContent = (getLang() === 'fa' ? 'دوربین باز نشد: ' : 'Camera failed: ') + (e.message || e);
    status.style.color = 'var(--red)';
    return;
  }

  let busy = false;
  const tick = async () => {
    if (!stream) return;
    if (!busy && video.readyState >= 2) {
      busy = true;
      try {
        const found = await detector.detect(video);
        if (found.length) {
          const code = found[0].rawValue;
          stopCamera();
          closeSheet();
          buzz(50);
          handleCode(code, meal);
          return;
        }
      } catch {}
      busy = false;
    }
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
}

function manualEntry(meal) {
  const inp = input({
    inputmode: 'numeric', placeholder: '6260…',
    style: 'direction:ltr;font-family:monospace;text-align:center',
  });
  return el('details', { style: 'margin-top:14px' },
    el('summary', { class: 'muted', style: 'cursor:pointer;padding:6px 0' },
      getLang() === 'fa' ? 'وارد کردن دستی کد' : 'Type the code instead'),
    el('div', { style: 'padding-top:10px' }, inp,
      el('button', { class: 'btn ghost full', style: 'margin-top:8px', onclick: () => {
        const c = inp.value.trim();
        if (!c) return;
        stopCamera(); closeSheet(); handleCode(c, meal);
      } }, t('ok'))),
  );
}

/* ---------------- Open Food Facts ----------------
   An open database of packaged products, keyed by barcode. Only the digits that
   were scanned are sent, and only when the user asked to scan. */

const OFF_URL = (code) =>
  `https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json`
  + '?fields=product_name,product_name_fa,brands,quantity,serving_quantity,nutriments';

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) && x >= 0 ? Math.round(x * 10) / 10 : 0;
};

/** Map an Open Food Facts product onto the shape the rest of the app uses. */
function fromOFF(p) {
  const nut = p?.nutriments || {};
  /* energy-kcal_100g is the field we want; some products only carry kJ */
  let kcal = Number(nut['energy-kcal_100g']);
  if (!Number.isFinite(kcal) || kcal <= 0) {
    const kj = Number(nut['energy-kj_100g'] ?? nut.energy_100g);
    if (Number.isFinite(kj) && kj > 0) kcal = kj / 4.184;
  }
  const protein = n(nut.proteins_100g);
  const carbs = n(nut.carbohydrates_100g);
  const fat = n(nut.fat_100g);
  const fiber = n(nut.fiber_100g);

  /* a row with no energy and no macros tells the user nothing — treat it as a
     miss rather than filling the form with zeros */
  if (!(kcal > 0) && !(protein || carbs || fat)) return null;

  const brand = String(p.brands || '').split(',')[0].trim();
  const base = String(p.product_name_fa || p.product_name || '').trim();
  /* many records already carry the brand inside the product name, which gave
     labels like "Nutella — Nutella" */
  const hasBrand = brand && base.toLowerCase().includes(brand.toLowerCase());
  const label = (hasBrand || !brand) ? base : [base, brand].join(' — ');
  if (!label) return null;

  return {
    name: label,
    nameFa: String(p.product_name_fa || '').trim() || label,
    kcal: Math.round(kcal || (protein * 4 + carbs * 4 + fat * 9)),
    p: protein, c: carbs, f: fat, fib: fiber,
    serving: n(p.serving_quantity) || 100,
    source: 'off',
  };
}

async function lookupOFF(code) {
  if (!navigator.onLine) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 7000);   // a slow lookup must not hang the sheet
    const r = await fetch(OFF_URL(code), { signal: ctrl.signal });
    clearTimeout(timer);
    if (!r.ok) return null;
    const j = await r.json();
    if (j.status !== 1 && !j.product) return null;
    return fromOFF(j.product);
  } catch {
    return null;      /* offline, blocked, or unknown — the manual form still works */
  }
}

/* ---------------- the shared pool ----------------
   Readings of nutrition labels that other people have typed in. What is sent is
   a barcode and the numbers printed on a packet — nothing about the person, and
   no token, so the server cannot tell who sent what.
================================================================= */

const shareUrl = () => {
  const base = String(S.settings.baseUrl || PROXY_URL || '').replace(/\/+$/, '');
  return base || null;
};

/** Is contributing switched on? Defaults to on; a person can turn it off. */
export const sharingOn = () => S.settings.shareBarcodes !== false;

async function askPool(code) {
  const base = shareUrl();
  if (!base || !navigator.onLine) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 7000);
  try {
    const r = await fetch(`${base}/barcode/get`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }), signal: ctrl.signal,
    });
    const d = await r.json();
    return d?.found ? { ...d.product, confirmedBy: d.confirmedBy } : null;
  } catch { return null; }
  finally { clearTimeout(timer); }
}

/** Offer a reading back. Failure is silent: it must never block logging food. */
async function offerToPool(code, food) {
  if (!sharingOn()) return;
  const base = shareUrl();
  if (!base || !navigator.onLine) return;
  try {
    await fetch(`${base}/barcode/put`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code, name: food.nameFa || food.name, brand: food.brand || '',
        kcal: food.kcal, p: food.p, c: food.c, f: food.f, fib: food.fib,
        serving: food.serving, liquid: !!food.liquid,
      }),
    });
  } catch { /* the diary entry is what matters; this is a gift, not a duty */ }
}

/* ---------------- what happens after a code is read ---------------- */

export async function handleCode(code, meal = 'snack') {
  const rec = await findBarcode(code);
  if (rec?.food) return openKnown(rec, meal);

  /* Products that ship with the app resolve instantly and with no connection,
     which is the point of carrying their barcodes at all. */
  const builtin = foodByBarcode(code);
  if (builtin) {
    return openKnown({ code, food: {
      name: builtin.nameFa, brand: builtin.brand,
      kcal: builtin.kcal, p: builtin.p, c: builtin.c, f: builtin.f, fib: builtin.fib,
      serving: builtin.servings?.[0]?.[1] || 100, liquid: builtin.liquid,
    }, source: 'builtin' }, meal);
  }

  /* Not on this device yet. Ask the people who have already read this label,
     then Open Food Facts, then the person holding the packet. */
  const busy = loading(t('searching'));
  let found = null;
  try {
    found = await askPool(code);
    if (!found) found = await lookupOFF(code);
  } finally { busy(); }   /* a lookup that throws must not strand the spinner */

  if (found) {
    /* remember it, so the next scan of this product works with no connection */
    await bindBarcode(code, found);
    return openKnown({ code, food: found,
                       source: found.confirmedBy ? 'pool' : 'off' }, meal);
  }
  openTeach(code, meal);
}

/** Known product — straight to the portion sheet. */
function openKnown(rec, meal) {
  const f = rec.food;
  const amt = input({ type: 'number', inputmode: 'decimal',
    value: f.serving || 100, step: '5' });
  const mealSel = select(MEAL_KEYS.map(m => ({ value: m, label: t(m) })), meal);
  const out = el('div', { class: 'info' });

  const refresh = () => {
    const g = parseNum(amt.value);
    const m = scaleFood(f, g);
    out.replaceChildren(
      el('div', { style: 'font-size:var(--t-2xl);font-weight:700;color:var(--tx);margin-bottom:6px' },
        `${num(Math.round(m.kcal))} ${t('kcal')}`),
      el('div', {}, `${t('protein')} ${num(round(m.protein, 1), 1)}g · ${t('carbs')} ${num(round(m.carbs, 1), 1)}g · ${t('fat')} ${num(round(m.fat, 1), 1)}g`));
  };
  amt.oninput = refresh; refresh();

  sheet(pick(f), el('div', {},
    el('div', { class: 'bc-chip' }, '🏷️ ' + rec.code),
    rec.source === 'off' || f.source === 'off'
      ? el('div', { class: 'muted', style: 'margin:-4px 0 10px;font-size:var(--t-sm)' },
          t('fromOFF'))
      : null,
    field(t('amount') + ' (' + t('gram') + ')', amt),
    out,
    field(t('addTo'), mealSel),
    el('button', { class: 'btn full', onclick: async () => {
      const g = parseNum(amt.value);
      if (g <= 0) return toast(t('error'), 'err');
      await addLog({ date: S.date, meal: mealSel.value, name: f.name, nameFa: f.nameFa,
                     grams: g, foodId: f.id || null, source: 'barcode', ...scaleFood(f, g) });
      closeSheet(); toast(t('done'), 'ok'); buzz(); refreshAll();
    } }, t('add')),
    el('button', { class: 'btn ghost full', style: 'margin-top:9px', onclick: () => {
      closeSheet(); openTeach(rec.code, meal, f);
    } }, t('edit')),
  ));
}

/** Unknown product — the user teaches it once. */
function openTeach(code, meal, existing = null) {
  const f = existing || {};
  const nFa = input({ value: f.nameFa || '', placeholder: 'ماست پرچرب دامداران' });
  const nEn = input({ value: f.name || '', placeholder: 'Full-fat yogurt' });
  const serv = input({ type: 'number', inputmode: 'decimal', value: f.serving ?? 100, step: '5' });
  const kc = input({ type: 'number', inputmode: 'decimal', value: f.kcal ?? '', placeholder: '0' });
  const pr = input({ type: 'number', inputmode: 'decimal', value: f.p ?? '', placeholder: '0' });
  const cb = input({ type: 'number', inputmode: 'decimal', value: f.c ?? '', placeholder: '0' });
  const ft = input({ type: 'number', inputmode: 'decimal', value: f.f ?? '', placeholder: '0' });
  const fb = input({ type: 'number', inputmode: 'decimal', value: f.fib ?? '', placeholder: '0' });

  sheet(existing ? t('edit') : t('barcodeNew'), el('div', {},
    el('div', { class: 'bc-chip' }, '🏷️ ' + code),
    existing ? null : el('div', { class: 'info' }, t('barcodeBind')),
    el('div', { class: 'info' }, t('per100')),
    field(t('name') + ' (فا)', nFa),
    field(t('name') + ' (EN)', nEn),
    el('div', { class: 'grid2' },
      field(t('kcal'), kc),
      field(t('protein') + ' (g)', pr)),
    el('div', { class: 'grid2' },
      field(t('carbs') + ' (g)', cb),
      field(t('fat') + ' (g)', ft)),
    el('div', { class: 'grid2' },
      field(t('fiber') + ' (g)', fb),
      field(t('servingSize') + ' (' + t('gram') + ')', serv)),
    el('button', { class: 'btn full', onclick: async () => {
      const name = nFa.value.trim() || nEn.value.trim();
      if (!name) return toast(t('error'), 'err');
      const food = {
        id: f.id || db.uid('bc_'),
        name: nEn.value.trim() || name, nameFa: nFa.value.trim() || name,
        cat: 'iranian', builtin: false,
        kcal: parseNum(kc.value), p: parseNum(pr.value), c: parseNum(cb.value),
        f: parseNum(ft.value), fib: parseNum(fb.value),
        serving: Math.max(1, parseNum(serv.value) || 100),
      };
      await bindBarcode(code, food);
      await db.put('foods', food);          // also lands in "my foods" for search
      offerToPool(code, food);              // not awaited: a gift, not a step
      closeSheet(); toast(t('barcodeSaved'), 'ok'); buzz();
      openKnown({ code, food }, meal);
    } }, t('save')),
    /* Said where the decision is made, not buried in settings. */
    el('label', { class: 'share-note' },
      el('input', { type: 'checkbox', checked: sharingOn(), onchange: async (e) => {
        S.settings.shareBarcodes = e.target.checked;
        await saveSettings();
      } }),
      el('span', {}, t('shareBarcodeNote'))),
  ));
}

/* ---------------- manager ---------------- */

export async function openMyBarcodes() {
  const rows = await allBarcodes();
  rows.sort((a, b) => (b.at || 0) - (a.at || 0));
  const body = el('div', {});
  if (!rows.length) {
    body.append(emptyArt('empty', t('empty'), t('barcodeBind'), 'var(--teal)'));
  } else {
    const list = el('div', { class: 'list' });
    rows.forEach(r => list.append(el('div', { class: 'li' },
      el('div', { class: 'li-main', onclick: () => { closeSheet(); openKnown(r, 'snack'); } },
        el('b', {}, pick(r.food)),
        el('span', { style: 'direction:ltr;display:inline-block' }, r.code)),
      el('button', { class: 'swipe-del', onclick: async (e) => {
        e.stopPropagation();
        await db.del('barcodes', r.code);
        closeSheet(); toast(t('deleted')); openMyBarcodes();
      } }, t('delete')))));
    body.append(list);
  }
  sheet(t('myBarcodes'), body);
}
