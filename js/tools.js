/* ============ Gym tools: plate calculator, progress photos ============ */
import * as db from './db.js';
import { S, kgToDisp, dispToKg, wUnit, isImperial } from './store.js';
import { t, num, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, parseNum, todayKey, longDate, shortDate, buzz,
} from './ui.js';
import { shrinkImage } from './ai.js';
import { emptyArt } from './art.js';

/* ============================================================
   PLATE CALCULATOR
   ============================================================ */

const KG_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const LB_PLATES = [45, 35, 25, 10, 5, 2.5];
const PLATE_COLOR = {
  25: '#e5493a', 20: '#3b6fd4', 15: '#f0b429', 10: '#4caf50', 5: '#dfe3e8',
  2.5: '#1f2733', 1.25: '#8b95a4',
  45: '#3b6fd4', 35: '#f0b429',
};

/**
 * Work out the plates per side. Greedy from heaviest down — which is
 * exactly how you load a bar in practice.
 */
export function solvePlates(target, bar, plates) {
  const perSide = (target - bar) / 2;
  if (perSide < 0) return { ok: false, perSide: 0, used: [], achieved: bar };
  let left = perSide;
  const used = [];
  for (const p of plates) {
    while (left >= p - 1e-9) { used.push(p); left = round(left - p, 3); }
  }
  const achieved = round(bar + (perSide - left) * 2, 2);
  return { ok: Math.abs(achieved - target) < 1e-6, perSide: round(perSide - left, 2), used, achieved };
}

export function openPlateCalc(prefillKg = null) {
  const imp = isImperial();
  const plates = imp ? LB_PLATES : KG_PLATES;
  const defBar = imp ? 45 : 20;

  const targetIn = input({ type: 'number', inputmode: 'decimal', step: '2.5',
    value: prefillKg ? round(kgToDisp(prefillKg), 1) : '' , placeholder: '80' });
  const barIn = input({ type: 'number', inputmode: 'decimal', step: '2.5', value: defBar });
  const out = el('div', {});

  const refresh = () => {
    const target = parseNum(targetIn.value);
    const bar = parseNum(barIn.value);
    out.replaceChildren();
    if (!target || target < bar) {
      out.append(el('div', { class: 'info' },
        getLang() === 'fa' ? 'وزن هدف باید از وزن میله بیشتر باشد.' : 'Target must exceed the bar.'));
      return;
    }
    const r = solvePlates(target, bar, plates);

    out.append(el('div', { class: 'plate-bar' },
      el('div', { class: 'pb-sleeve' }),
      ...r.used.map(p => el('div', {
        class: 'pb-plate',
        style: `--pc:${PLATE_COLOR[p] || '#6b7684'};height:${clampH(p, plates)}%`,
      }, el('span', {}, String(p)))),
      el('div', { class: 'pb-collar' }),
    ));

    out.append(el('div', { class: 'kv' },
      el('span', {}, t('perSide')),
      el('b', {}, r.used.length ? r.used.map(p => num(p)).join(' + ') : '—')));
    out.append(el('div', { class: 'kv' },
      el('span', {}, t('total')),
      el('b', {}, `${num(r.achieved)} ${wUnit()}`)));

    if (!r.ok) {
      out.append(el('div', { class: 'warn', style: 'margin-top:10px' },
        `${t('notExact')} ${num(r.achieved)} ${wUnit()}`));
    }
  };
  targetIn.oninput = refresh; barIn.oninput = refresh;

  const quick = el('div', { class: 'chips' });
  [40, 60, 80, 100, 120, 140].forEach(v => {
    const disp = imp ? Math.round(v * 2.20462 / 5) * 5 : v;
    quick.append(el('button', { class: 'chip', onclick: () => { targetIn.value = disp; refresh(); } },
      `${num(disp)}`));
  });

  refresh();
  sheet(t('plateCalc'), el('div', {},
    field(`${t('targetLoad')} (${wUnit()})`, targetIn),
    quick,
    field(`${t('barWeight')} (${wUnit()})`, barIn),
    out,
    el('div', { class: 'muted', style: 'font-size:11.5px;margin-top:14px;line-height:1.8' },
      getLang() === 'fa'
        ? `صفحه‌های فرض‌شده: ${plates.map(p => num(p)).join('، ')} — از سنگین به سبک چیده می‌شوند.`
        : `Assumed plates: ${plates.join(', ')} — loaded heaviest first.`),
  ));
}
function clampH(p, plates) {
  const max = plates[0];
  return 45 + (p / max) * 55;
}

/* ============================================================
   PROGRESS PHOTOS
   ============================================================ */

export async function allPhotos() {
  const ps = await db.all('bodyPhotos');
  ps.sort((a, b) => a.date < b.date ? 1 : -1);
  return ps;
}

export function pickPhoto() {
  const inp = $('#file-body-photo');
  inp.value = '';
  inp.click();
}

export function initPhotoPicker() {
  $('#file-body-photo').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    try {
      const blob = await shrinkImage(file, 1080, 0.82);
      const dIn = input({ type: 'date', value: todayKey() });
      const wIn = input({ type: 'number', inputmode: 'decimal', step: '0.1',
        value: round(kgToDisp(S.profile.weight), 1) });
      const noteIn = input({ placeholder: getLang() === 'fa' ? 'یادداشت (اختیاری)' : 'Note (optional)' });
      const img = el('img', { class: 'photo-preview', src: URL.createObjectURL(blob) });

      sheet(t('addPhoto'), el('div', {}, img,
        field(t('today'), dIn),
        field(`${t('weight')} (${wUnit()})`, wIn),
        field(t('notes'), noteIn),
        el('div', { class: 'info' }, t('photoPrivacy')),
        el('button', { class: 'btn full', onclick: async () => {
          await db.put('bodyPhotos', {
            id: db.uid('bp_'), date: dIn.value || todayKey(), blob,
            kg: round(dispToKg(parseNum(wIn.value)), 2) || null,
            note: noteIn.value.trim(), at: Date.now(),
          });
          closeSheet(); toast(t('saved'), 'ok'); buzz();
          window.dispatchEvent(new CustomEvent('data-changed'));
        } }, t('save')),
      ));
    } catch (err) {
      toast(t('error') + ': ' + err.message, 'err');
    }
  });
}

export async function renderPhotoStrip(host) {
  const ps = await allPhotos();
  host.replaceChildren();

  if (!ps.length) {
    host.append(emptyArt('scale', t('noPhotos'), t('photoHint'), 'var(--teal)'));
    host.append(el('button', { class: 'btn ghost full', onclick: pickPhoto }, '📷 ' + t('addPhoto')));
    return;
  }

  const strip = el('div', { class: 'photo-strip' });
  ps.forEach(p => {
    const url = URL.createObjectURL(p.blob);
    strip.append(el('button', { class: 'photo-cell', onclick: () => openPhoto(p) },
      el('img', { src: url, loading: 'lazy' }),
      el('span', {}, shortDate(p.date)),
      p.kg ? el('i', {}, `${num(round(kgToDisp(p.kg), 1), 1)}${wUnit()}`) : null));
  });
  host.append(strip);
  host.append(el('div', { class: 'btn-row' },
    el('button', { class: 'btn ghost', onclick: pickPhoto }, '📷 ' + t('addPhoto')),
    ps.length >= 2 ? el('button', { class: 'btn ghost', onclick: () => openCompare(ps) }, '⇄ ' + t('comparePhotos')) : null));
}

function openPhoto(p) {
  const url = URL.createObjectURL(p.blob);
  sheet(longDate(p.date), el('div', {},
    el('img', { class: 'photo-full', src: url }),
    p.kg ? el('div', { class: 'kv' }, el('span', {}, t('weight')),
      el('b', {}, `${num(round(kgToDisp(p.kg), 1), 1)} ${wUnit()}`)) : null,
    p.note ? el('div', { class: 'info', style: 'margin-top:10px' }, p.note) : null,
    el('button', { class: 'btn danger ghost full', style: 'margin-top:14px', onclick: async () => {
      closeSheet();
      if (await confirmSheet(t('confirmDelete'), longDate(p.date))) {
        await db.del('bodyPhotos', p.id);
        toast(t('deleted'));
        window.dispatchEvent(new CustomEvent('data-changed'));
      }
    } }, t('delete')),
  ));
}

function openCompare(ps) {
  let a = ps[ps.length - 1], b = ps[0];        // oldest vs newest by default
  const host = el('div', {});

  const draw = () => {
    host.replaceChildren(
      el('div', { class: 'cmp' },
        cmpSide(a, t('before')),
        cmpSide(b, t('after'))),
      a.kg && b.kg ? el('div', { class: 'kv', style: 'margin-top:12px' },
        el('span', {}, t('change')),
        el('b', { style: `color:${b.kg - a.kg <= 0 ? 'var(--acc)' : 'var(--blue)'}` },
          `${b.kg - a.kg > 0 ? '+' : ''}${num(round(kgToDisp(b.kg - a.kg), 1), 1)} ${wUnit()}`)) : null,
      el('div', { class: 'muted', style: 'margin:14px 0 8px;font-size:12px' }, t('pickTwo')),
      el('div', { class: 'photo-strip small' },
        ...ps.map(p => el('button', {
          class: 'photo-cell' + (p === a ? ' pick-a' : p === b ? ' pick-b' : ''),
          onclick: () => { if (p === a) return; a = b; b = p; draw(); },
        },
          el('img', { src: URL.createObjectURL(p.blob), loading: 'lazy' }),
          el('span', {}, shortDate(p.date))))),
    );
  };
  const cmpSide = (p, label) => el('div', { class: 'cmp-side' },
    el('img', { src: URL.createObjectURL(p.blob) }),
    el('b', {}, label),
    el('span', {}, `${shortDate(p.date)}${p.kg ? ' · ' + num(round(kgToDisp(p.kg), 1), 1) + wUnit() : ''}`));

  draw();
  sheet(t('comparePhotos'), host);
}
