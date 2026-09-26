/* ============ Gym tools: plate calculator, progress photos ============ */
import * as db from './db.js';
import { lineIcon } from './icons.js';
import { S, kgToDisp, dispToKg, wUnit, isImperial } from './store.js';
import { t, num, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, parseNum, todayKey, longDate, shortDate, buzz,
} from './ui.js';
import { shrinkImage } from './ai.js';
import { emptyArt, svgNode, svgRoot } from './art.js';
import { endBarbell } from './art3d.js';

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

    /* The bar in perspective: each plate an ellipse seen at a slight angle,
       lit like the real rubber, sleeves receding to the hub. The side view
       told you the sizes; this tells you the shape. */
    const maxP = plates[0];
    out.append(el('div', { class: 'bar3d-wrap' },
      el('div', { class: 'bar3d' },
        /* the sleeve, running to the far edge */
        el('i', { class: 'b3-sleeve' }),
        ...r.used.map((p, i) => {
          const t = p / maxP;
          const dia = 34 + t * 62;                       // % of the rail height
          return el('div', {
            class: 'b3-plate',
            style: `--pc:${PLATE_COLOR[p] || '#6b7684'};--dia:${dia}%;--ix:${i}`,
          }, el('span', {}, num(p)));
        }),
        el('i', { class: 'b3-collar' }),
        el('i', { class: 'b3-knob' }),
      ),
      /* the same load seen end-on — the view you actually lift */
      endBarbell(r.used.map(p => ({ w: p, color: PLATE_COLOR[p] || '#6b7684' }))),
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
    el('div', { class: 'muted', style: 'font-size:var(--t-sm);margin-top:14px;line-height:1.8' },
      getLang() === 'fa'
        ? `صفحه‌های فرض‌شده: ${plates.map(p => num(p)).join('، ')} — از سنگین به سبک چیده می‌شوند.`
        : `Assumed plates: ${plates.join(', ')} — loaded heaviest first.`),
  ));
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
    host.append(el('button', { class: 'btn ghost full', onclick: pickPhoto },
    lineIcon('camera', { size: 17 }), t('addPhoto')));
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
    el('button', { class: 'btn ghost', onclick: pickPhoto },
      lineIcon('camera', { size: 17 }), t('addPhoto')),
    ps.length >= 2 ? el('button', { class: 'btn ghost', onclick: () => openCompare(ps) },
      lineIcon('swap', { size: 17 }), t('comparePhotos')) : null));
}

/** Open one photo by id, for callers that hold an id rather than the record. */
export async function openPhotoById(id) {
  const p = await db.get('bodyPhotos', id);
  if (p) openPhoto(p);
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

/**
 * Two photos in one box with a line you can drag between them.
 *
 * The same frame, the same size, the same crop: across the line the only
 * thing that changes is the body. Side by side cannot do that, because the
 * eye has to travel between two differently framed pictures and guess.
 */
function wipe(before, after, { flip = false }) {
  const box = el('div', { class: 'wipe', role: 'slider', tabindex: '0',
    'aria-valuemin': '0', 'aria-valuemax': '100', 'aria-valuenow': '50',
    'aria-label': `${t('before')} / ${t('after')}` });

  /* Whichever photo sits on the physical left is the clipped one; the other
     fills the box behind it. Keeping this in physical terms is deliberate —
     the finger moves in pixels, not in logical directions. */
  const left = flip ? after : before;
  const right = flip ? before : after;

  const under = el('img', { src: URL.createObjectURL(right.blob), alt: '' });
  const over = el('img', { class: 'top', src: URL.createObjectURL(left.blob), alt: '' });
  const bar = el('i', { class: 'wipe-bar' });
  const grip = el('i', { class: 'wipe-grip' },
    svgRoot('0 0 24 24', { width: 16, height: 16 },
      svgNode('path', { d: 'M10 8 6 12l4 4M14 8l4 4-4 4', fill: 'none',
        stroke: 'currentColor', 'stroke-width': 2,
        'stroke-linecap': 'round', 'stroke-linejoin': 'round' })));

  let pct = 50;
  const apply = () => {
    box.style.setProperty('--pos', pct + '%');
    box.style.setProperty('--cut', (100 - pct) + '%');
    box.setAttribute('aria-valuenow', String(Math.round(pct)));
  };
  const at = (clientX) => {
    const r = box.getBoundingClientRect();
    if (!r.width) return;
    pct = Math.min(100, Math.max(0, (clientX - r.left) / r.width * 100));
    apply();
  };

  let dragging = false;
  box.addEventListener('pointerdown', (e) => {
    dragging = true;
    box.setPointerCapture?.(e.pointerId);
    at(e.clientX);
  });
  box.addEventListener('pointermove', (e) => { if (dragging) at(e.clientX); });
  const stop = () => { dragging = false; };
  box.addEventListener('pointerup', stop);
  box.addEventListener('pointercancel', stop);
  /* Arrow keys nudge it, so the comparison is not lost to anyone who cannot
     drag. Left is left on screen, whatever the script direction. */
  box.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 10 : 2;
    if (e.key === 'ArrowLeft') pct = Math.max(0, pct - step);
    else if (e.key === 'ArrowRight') pct = Math.min(100, pct + step);
    else if (e.key === 'Home') pct = 0;
    else if (e.key === 'End') pct = 100;
    else return;
    e.preventDefault();
    apply();
  });

  box.append(under, over, bar, grip,
    el('span', { class: 'wipe-tag l' }, flip ? t('after') : t('before')),
    el('span', { class: 'wipe-tag r' }, flip ? t('before') : t('after')));
  apply();
  return box;
}

function openCompare(ps) {
  let a = ps[ps.length - 1], b = ps[0];        // oldest vs newest by default
  let mode = 'wipe';
  const host = el('div', {});

  const draw = () => {
    host.replaceChildren(
      el('div', { class: 'seg tight' },
        ...[['wipe', t('overlay')], ['side', t('sideBySide')]].map(([id, label]) =>
          el('button', { class: 'seg-btn' + (mode === id ? ' active' : ''),
            onclick: () => { if (mode !== id) { mode = id; draw(); } } }, label))),
      mode === 'wipe'
        ? wipe(a, b, { flip: getLang() === 'fa' })
        : el('div', { class: 'cmp' },
            cmpSide(a, t('before')),
            cmpSide(b, t('after'))),
      a.kg && b.kg ? el('div', { class: 'kv', style: 'margin-top:12px' },
        el('span', {}, t('change')),
        el('b', { style: `color:${b.kg - a.kg <= 0 ? 'var(--acc)' : 'var(--blue)'}` },
          `${b.kg - a.kg > 0 ? '+' : ''}${num(round(kgToDisp(b.kg - a.kg), 1), 1)} ${wUnit()}`)) : null,
      el('div', { class: 'muted', style: 'margin:14px 0 8px;font-size:var(--t-sm)' }, t('pickTwo')),
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
