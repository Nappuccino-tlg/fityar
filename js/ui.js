/* ============ Small UI + utility layer ============ */
import { t, getLang, num } from './i18n.js';

/* ---------- DOM ---------- */
export const $  = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export function el(tag, props = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (k === 'class') n.className = v;
    else if (k === 'html') n.innerHTML = v;
    else if (k === 'text') n.textContent = v;
    else if (k.startsWith('on') && typeof v === 'function') n.addEventListener(k.slice(2), v);
    else if (k === 'dataset') Object.assign(n.dataset, v);
    else if (v !== null && v !== undefined && v !== false) n.setAttribute(k, v);
  }
  for (const kid of kids.flat()) {
    if (kid === null || kid === undefined || kid === false) continue;
    n.append(kid.nodeType ? kid : document.createTextNode(String(kid)));
  }
  return n;
}

export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, c =>
    ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
}

/* ---------- dates ---------- */
export const todayKey = () => dateKey(new Date());

export function dateKey(d) {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
}
export function keyToDate(k) {
  const [y, m, d] = k.split('-').map(Number);
  return new Date(y, m - 1, d);
}
export function addDays(key, n) {
  const d = keyToDate(key);
  d.setDate(d.getDate() + n);
  return dateKey(d);
}
export function daysBetween(a, b) {
  return Math.round((keyToDate(b) - keyToDate(a)) / 86400000);
}

/** Human label: Today / Yesterday / weekday + date */
export function dateLabel(key) {
  const tk = todayKey();
  if (key === tk) return t('today');
  if (key === addDays(tk, -1)) return t('yesterday');
  if (key === addDays(tk, 1)) return t('tomorrow');
  return longDate(key);
}

export function longDate(key) {
  const d = keyToDate(key);
  const loc = getLang() === 'fa' ? 'fa-IR' : 'en-US';
  try {
    return d.toLocaleDateString(loc, { weekday: 'long', day: 'numeric', month: 'long' });
  } catch { return key; }
}
export function shortDate(key) {
  const d = keyToDate(key);
  const loc = getLang() === 'fa' ? 'fa-IR' : 'en-US';
  try { return d.toLocaleDateString(loc, { day: 'numeric', month: 'short' }); }
  catch { return key.slice(5); }
}

/** hh:mm or mm:ss from seconds */
export function clock(sec, forceHours = false) {
  sec = Math.max(0, Math.round(sec));
  const h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
  const p = (x) => String(x).padStart(2, '0');
  return (h || forceHours) ? `${p(h)}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`;
}
export function durLabel(sec) {
  const m = Math.round(sec / 60);
  if (m < 60) return `${num(m)} ${t('min')}`;
  return `${num(Math.floor(m / 60))}${t('hour')} ${num(m % 60)}${t('min')}`;
}

/* ---------- numbers ---------- */
export const round = (n, d = 0) => {
  const f = 10 ** d;
  return Math.round((Number(n) || 0) * f) / f;
};
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
export const sum = (arr, f = x => x) => arr.reduce((s, x) => s + (Number(f(x)) || 0), 0);

/** Parse user-typed numbers, tolerating Persian/Arabic digits and commas. */
export function parseNum(v) {
  if (typeof v === 'number') return v;
  if (!v) return 0;
  const map = { '۰':'0','۱':'1','۲':'2','۳':'3','۴':'4','۵':'5','۶':'6','۷':'7','۸':'8','۹':'9',
                '٠':'0','١':'1','٢':'2','٣':'3','٤':'4','٥':'5','٦':'6','٧':'7','٨':'8','٩':'9' };
  const s = String(v).replace(/[۰-۹٠-٩]/g, c => map[c]).replace(/[,،\s]/g, '');
  const n = parseFloat(s);
  return Number.isFinite(n) ? n : 0;
}

/* ---------- toast ---------- */
export function toast(msg, kind = '') {
  const host = $('#toast-host');
  if (!host) { console.info('[toast]', msg); return; }   // headless / test pages
  const n = el('div', { class: 'toast ' + kind, text: msg });
  host.append(n);
  setTimeout(() => {
    n.style.transition = 'opacity .25s, transform .25s';
    n.style.opacity = '0'; n.style.transform = 'translateY(10px)';
    setTimeout(() => n.remove(), 260);
  }, kind === 'err' ? 3800 : 2200);
}

/* ---------- loader ---------- */
export function loading(on, text = '') {
  const l = $('#loader');
  if (!l) return;
  const txt = $('#loader-text');
  if (txt) txt.textContent = text || t('loading');
  l.hidden = !on;
}

/* ---------- bottom sheet ---------- */
let sheetOnClose = null;

export function sheet(title, contentNode, { onClose = null } = {}) {
  const s = $('#sheet'), body = $('#sheet-body');
  $('#sheet-title').textContent = title || '';
  body.replaceChildren();
  if (contentNode) body.append(contentNode);
  s.hidden = false;
  $('#scrim').hidden = false;
  sheetOnClose = onClose;
  body.scrollTop = 0;
  return body;
}

export function closeSheet() {
  $('#sheet').hidden = true;
  $('#scrim').hidden = true;
  $('#sheet-body').replaceChildren();
  const cb = sheetOnClose; sheetOnClose = null;
  if (cb) cb();
}

export const isSheetOpen = () => !$('#sheet').hidden;

/* ---------- confirm dialog ---------- */
export function confirmSheet(title, message, { danger = true, okLabel = null } = {}) {
  return new Promise(res => {
    let done = false;
    const finish = (v) => { if (done) return; done = true; closeSheet(); res(v); };
    const box = el('div', {},
      message ? el('p', { class: 'muted', style: 'line-height:1.8;margin:0 0 16px', text: message }) : null,
      el('div', { class: 'btn-row' },
        el('button', { class: 'btn ghost', onclick: () => finish(false) }, t('cancel')),
        el('button', { class: 'btn' + (danger ? ' danger ghost' : ''), onclick: () => finish(true) },
          okLabel || t('yes')),
      ),
    );
    sheet(title, box, { onClose: () => finish(false) });
  });
}

/* ---------- form helpers ---------- */
export function field(label, input) {
  return el('div', { class: 'field' }, el('label', { text: label }), input);
}
export function input(props = {}) {
  return el('input', { class: 'input', ...props });
}
export function select(options, value, props = {}) {
  const s = el('select', { class: 'input', ...props });
  for (const o of options) {
    const opt = el('option', { value: o.value }, o.label);
    if (String(o.value) === String(value)) opt.selected = true;
    s.append(opt);
  }
  return s;
}
export function segmented(options, value, onPick) {
  const wrap = el('div', { class: 'seg' });
  options.forEach(o => {
    const b = el('button', {
      class: 'seg-btn' + (String(o.value) === String(value) ? ' active' : ''),
      onclick: () => {
        [...wrap.children].forEach(c => c.classList.remove('active'));
        b.classList.add('active');
        onPick(o.value);
      },
    }, o.label);
    wrap.append(b);
  });
  return wrap;
}

/* ---------- feedback ---------- */
let fxEnabled = true;
export const setFx = (v) => { fxEnabled = !!v; };
export function buzz(ms = 30) {
  if (!fxEnabled) return;
  try { navigator.vibrate?.(ms); } catch {}
}
let audioCtx = null;
export function beep(freq = 880, ms = 160) {
  if (!fxEnabled) return;
  try {
    audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const o = audioCtx.createOscillator(), g = audioCtx.createGain();
    o.type = 'sine'; o.frequency.value = freq;
    g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.25, audioCtx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + ms / 1000);
    o.connect(g); g.connect(audioCtx.destination);
    o.start(); o.stop(audioCtx.currentTime + ms / 1000 + 0.02);
  } catch {}
}

/* ---------- tiny SVG charts ---------- */
const NS = 'http://www.w3.org/2000/svg';
const svgEl = (tag, attrs = {}) => {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
};

/**
 * Line chart. points = [{x:label, y:number|null}]
 */
export function lineChart(host, points, { color = '#3ddc84', fill = true, goal = null } = {}) {
  host.replaceChildren();
  const W = 320, H = 150, PADX = 26, PADY = 16;
  const vals = points.filter(p => p.y !== null && p.y !== undefined).map(p => p.y);
  if (vals.length < 1) { host.append(el('div', { class: 'empty', text: t('empty') })); return; }

  let min = Math.min(...vals, goal ?? Infinity);
  let max = Math.max(...vals, goal ?? -Infinity);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
  const X = i => PADX + (i / Math.max(1, points.length - 1)) * (W - PADX * 2);
  const Y = v => PADY + (1 - (v - min) / (max - min)) * (H - PADY * 2);

  for (let i = 0; i <= 3; i++) {
    const y = PADY + (i / 3) * (H - PADY * 2);
    svg.append(svgEl('line', { x1: PADX, y1: y, x2: W - PADX, y2: y, stroke: 'currentColor', 'stroke-opacity': .12, 'stroke-width': 1 }));
  }
  if (goal !== null && goal >= min && goal <= max) {
    svg.append(svgEl('line', {
      x1: PADX, y1: Y(goal), x2: W - PADX, y2: Y(goal),
      stroke: color, 'stroke-opacity': .45, 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
    }));
  }

  const segs = [];
  let cur = [];
  points.forEach((p, i) => {
    if (p.y === null || p.y === undefined) { if (cur.length) segs.push(cur); cur = []; }
    else cur.push([X(i), Y(p.y)]);
  });
  if (cur.length) segs.push(cur);

  for (const seg of segs) {
    if (seg.length === 1) {
      svg.append(svgEl('circle', { cx: seg[0][0], cy: seg[0][1], r: 3, fill: color }));
      continue;
    }
    const d = seg.map((pt, i) => (i ? 'L' : 'M') + pt[0].toFixed(1) + ' ' + pt[1].toFixed(1)).join(' ');
    if (fill) {
      const area = d + ` L${seg.at(-1)[0].toFixed(1)} ${H - PADY} L${seg[0][0].toFixed(1)} ${H - PADY} Z`;
      const grad = svgEl('linearGradient', { id: 'g' + Math.random().toString(36).slice(2, 7), x1: 0, y1: 0, x2: 0, y2: 1 });
      grad.append(svgEl('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': .3 }));
      grad.append(svgEl('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }));
      svg.append(grad);
      svg.append(svgEl('path', { d: area, fill: `url(#${grad.id})`, stroke: 'none' }));
    }
    svg.append(svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.2, 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }));
    seg.forEach(pt => svg.append(svgEl('circle', { cx: pt[0], cy: pt[1], r: 2.6, fill: color })));
  }

  points.forEach((p, i) => {
    if (points.length > 8 && i % Math.ceil(points.length / 6) !== 0 && i !== points.length - 1) return;
    const tx = svgEl('text', { x: X(i), y: H - 2, 'text-anchor': 'middle', fill: 'currentColor', 'fill-opacity': .45, 'font-size': 9 });
    tx.textContent = p.x;
    svg.append(tx);
  });

  host.append(svg);
}

/** Bar chart. points = [{x, y, color?}] */
export function barChart(host, points, { color = '#4c9aff', goal = null, unit = '' } = {}) {
  host.replaceChildren();
  if (!points.length) { host.append(el('div', { class: 'empty', text: t('empty') })); return; }
  const W = 320, H = 150, PADY = 18, PADX = 8;
  const max = Math.max(...points.map(p => p.y), goal ?? 0, 1) * 1.12;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none' });
  const bw = (W - PADX * 2) / points.length;
  const Y = v => PADY + (1 - v / max) * (H - PADY * 2);

  if (goal) {
    const gl = svgEl('line', {
      x1: PADX, y1: Y(goal), x2: W - PADX, y2: Y(goal),
      'stroke-opacity': .55, 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
    });
    gl.style.stroke = 'var(--acc)';
    svg.append(gl);
  }
  points.forEach((p, i) => {
    const x = PADX + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const y = Y(p.y);
    const h = Math.max(1, H - PADY - y);
    const bar = svgEl('rect', {
      x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1),
      rx: Math.min(3, w / 2), 'fill-opacity': p.dim ? .35 : .9,
    });
    bar.style.fill = p.color || color;          // style, so CSS vars resolve
    svg.append(bar);
    if (points.length <= 10 || i % 2 === 0) {
      const tx = svgEl('text', { x: x + w / 2, y: H - 3, 'text-anchor': 'middle', fill: 'currentColor', 'fill-opacity': .45, 'font-size': 9 });
      tx.textContent = p.x; svg.append(tx);
    }
  });
  host.append(svg);
}

/** Horizontal stacked bar for macro split */
export function macroBar(host, { p, c, f }) {
  host.replaceChildren();
  const kcal = p * 4 + c * 4 + f * 9;
  if (!kcal) { host.append(el('div', { class: 'empty', text: t('empty') })); return; }
  const parts = [
    { k: 'protein', v: p * 4, col: 'var(--blue)', g: p },
    { k: 'carbs',   v: c * 4, col: 'var(--orange)', g: c },
    { k: 'fat',     v: f * 9, col: 'var(--pink)', g: f },
  ];
  const bar = el('div', { style: 'display:flex;height:14px;border-radius:7px;overflow:hidden;margin:10px 0 14px' });
  parts.forEach(x => bar.append(el('i', { style: `flex:${x.v};background:${x.col}` })));
  const legend = el('div', { style: 'display:flex;flex-direction:column;gap:9px' });
  parts.forEach(x => legend.append(el('div', { style: 'display:flex;align-items:center;gap:9px;font-size:13px' },
    el('i', { style: `width:9px;height:9px;border-radius:3px;background:${x.col};flex:0 0 auto` }),
    el('span', { style: 'flex:1;color:var(--tx2)' }, t(x.k)),
    el('b', {}, `${num(round(x.g))}g`),
    el('span', { style: 'color:var(--tx3);font-size:11.5px;min-width:38px;text-align:end' },
      `${num(Math.round(x.v / kcal * 100))}%`),
  )));
  host.append(bar, legend);
}
