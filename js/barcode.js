/* ============ Barcode scanning — you teach it once, it remembers ============
   Uses the browser's on-device BarcodeDetector. No lookup service is involved,
   so it works offline and knows exactly the products you actually buy.
=========================================================================== */
import * as db from './db.js';
import { S, MEAL_KEYS } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, parseNum, buzz,
} from './ui.js';
import { addLog, scaleFood, refreshAll } from './nutrition.js';
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

/* ---------------- what happens after a code is read ---------------- */

export async function handleCode(code, meal = 'snack') {
  const rec = await findBarcode(code);
  if (rec?.food) return openKnown(rec, meal);
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
      el('div', { style: 'font-size:19px;font-weight:700;color:var(--tx);margin-bottom:6px' },
        `${num(Math.round(m.kcal))} ${t('kcal')}`),
      el('div', {}, `${t('protein')} ${num(round(m.protein, 1), 1)}g · ${t('carbs')} ${num(round(m.carbs, 1), 1)}g · ${t('fat')} ${num(round(m.fat, 1), 1)}g`));
  };
  amt.oninput = refresh; refresh();

  sheet(pick(f), el('div', {},
    el('div', { class: 'bc-chip' }, '🏷️ ' + rec.code),
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
      closeSheet(); toast(t('barcodeSaved'), 'ok'); buzz();
      openKnown({ code, food }, meal);
    } }, t('save')),
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
