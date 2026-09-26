/* ============ Small UI + utility layer ============ */
import { t, getLang, num } from './i18n.js';

/* ---------- DOM ---------- */
import { setMotion, motionOff } from './motion.js';
import { lineIcon } from './icons.js';

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
  const n = el('div', { class: 'toast ' + kind }, el('span', {}, msg));
  /* Confirmation belongs in the toast, not pasted into six different message
     strings as a ✅ that the seventh caller forgets. It springs in slightly
     after the words, so it reads as a reply rather than as decoration. */
  if (kind === 'ok') {
    const tick = el('i', { class: 'toast-tick' }, lineIcon('check', { size: 14 }));
    n.prepend(tick);
    if (!motionOff() && !document.hidden && tick.animate) {
      tick.animate([
        { transform: 'scale(.2)', opacity: 0 },
        { transform: 'scale(1.15)', opacity: 1, offset: 0.65 },
        { transform: 'scale(1)', opacity: 1 },
      ], { duration: 340, delay: 90, fill: 'backwards', easing: 'cubic-bezier(.34,1.56,.64,1)' });
    }
  }
  host.append(n);
  setTimeout(() => {
    n.style.transition = 'opacity .25s, transform .25s';
    n.style.opacity = '0'; n.style.transform = 'translateY(10px)';
    setTimeout(() => n.remove(), 260);
  }, kind === 'err' ? 3800 : 2200);
}

/* ---------- loader ---------- */
/**
 * Show or hide the full-screen spinner.
 *
 * Two shapes are accepted because both get written: loading(true, 'text') and
 * loading('text'). The second reading is natural enough that it has been
 * written twice by mistake, and the punishment for it was severe — the spinner
 * came up and never came down, which leaves the app looking frozen.
 *
 * A dismiss function comes back either way, so `const done = loading(...)`
 * followed by `done()` is correct rather than a silent no-op.
 */
export function loading(on = true, text = '') {
  const l = $('#loader');
  if (!l) return () => {};
  if (typeof on === 'string') { text = on; on = true; }
  const txt = $('#loader-text');
  if (txt) txt.textContent = text || t('loading');
  l.hidden = !on;
  return () => { l.hidden = true; };
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
/* Vibration, sound and motion are one setting to the user, so they are one
   switch here. motion.js holds its own flag because it must also answer to the
   system's reduce-motion preference, which this switch knows nothing about. */
export const setFx = (v) => { fxEnabled = !!v; setMotion(fxEnabled); };
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
 * A path through the points, curved rather than kinked.
 *
 * Catmull-Rom converted to cubic Béziers. The tension is deliberately low:
 * a smoothed line that overshoots between two readings has drawn a weight
 * the person never recorded, which is worse than a corner.
 */
function curveThrough(pts, tension = 0.22) {
  if (pts.length < 3) {
    return pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1 = [p1[0] + (p2[0] - p0[0]) * tension, p1[1] + (p2[1] - p0[1]) * tension];
    const c2 = [p2[0] - (p3[0] - p1[0]) * tension, p2[1] - (p3[1] - p1[1]) * tension];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)}, ${c2[0].toFixed(1)} ${c2[1].toFixed(1)},`
       + ` ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

/**
 * Draw a chart in, once, when it is rendered.
 *
 * Absent when the page is not being drawn: an animation that starts on a
 * hidden tab finishes before anyone sees it and spends frames on nobody.
 */
function drawIn(nodes, { stagger = 0 } = {}) {
  if (motionOff() || document.hidden) return;
  nodes.forEach((n, i) => {
    if (!n.animate) return;
    if (n.tagName === 'path') {
      const len = n.getTotalLength?.();
      if (!len) return;
      n.style.strokeDasharray = len;
      n.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }],
        { duration: 700, easing: 'cubic-bezier(.22,1,.36,1)' })
        .finished.catch(() => {}).then(() => { n.style.strokeDasharray = ''; });
    } else {
      n.animate([{ transform: 'scaleY(0)' }, { transform: 'scaleY(1)' }], {
        duration: 460, delay: i * stagger, fill: 'backwards',
        easing: 'cubic-bezier(.22,1,.36,1)',
      });
    }
  });
}

/**
 * Line chart. points = [{x:label, y:number|null}]
 */
/* The box a chart is drawn in, in real pixels.

   Both charts used to declare a fixed 320 by 150 grid and then hand the
   browser preserveAspectRatio="none", which stretches that grid to whatever
   box it lands in. On a phone that is about 307 by 160 — x squeezed to .96,
   y pulled to 1.07 — so every circle marking a reading arrived as an
   ellipse, every rounded bar corner as an oval, and a line came out thicker
   where it climbed than where it ran flat.

   Measuring instead means one unit is one pixel, a circle is a circle, and
   the padding numbers mean the pixels they were picked as. The fallback is
   the old grid, for the case where the host is not laid out yet. */
/* How many labels fit along the bottom, given the width.

   Both charts used to space labels by counting points — every second bar,
   or one in six readings — which is a rule about the data when the question
   is about pixels. At thirty bars that printed fifteen dates like
   «۳۱ شهریور» into three hundred pixels, and the axis came out as a grey
   smear.

   Sixty-six is one of those dates — about forty-five pixels at nine
   point — plus twenty of air. Fifty-six left them nearly touching, which
   is legible but reads as a crowded strip rather than as a scale; four
   dates with room around them say more than five pressed together. */
function labelStep(count, W) {
  const fits = Math.max(2, Math.floor(W / 66));
  return Math.max(1, Math.ceil(count / fits));
}

/* A date under the chart, centred on the mark it belongs to.

   Always centred — an earlier version anchored the outermost labels to the
   edge they were near, using `start` and `end`, which in a Persian document
   are the right and left edges respectively. The leftmost date was thrown
   to the other end of the chart and sat over bars three weeks away from it.

   Keeping a label over its own mark means the chart has to have room for
   it at the ends instead; see PADX in each chart, and fitLabels below for
   the case where even that is not enough. */
function axisLabel(svg, text, x, y) {
  const tx = svgEl('text', {
    x: x.toFixed(1), y, 'text-anchor': 'middle', fill: 'currentColor',
    'fill-opacity': .45, 'font-size': 9, class: 'axis-label',
  });
  tx.textContent = text;
  svg.append(tx);
}

/* The last resort, once the chart is in the document — which is the only
   point at which a text node knows how wide it is. Side padding is sized
   for the dates these charts actually print; this catches a longer one, or
   a narrower phone, by sliding the label just far enough to fit rather
   than flinging it to an edge. */
function fitLabels(svg, W) {
  for (const tx of svg.querySelectorAll('text.axis-label')) {
    let w = 0;
    try { w = tx.getComputedTextLength(); } catch { return; }
    if (!w) continue;
    const half = w / 2 + 1;
    const x = Number(tx.getAttribute('x'));
    if (x < half) tx.setAttribute('x', half.toFixed(1));
    else if (x > W - half) tx.setAttribute('x', (W - half).toFixed(1));
  }
}

function chartBox(host) {
  const r = host.getBoundingClientRect();
  return {
    W: r.width > 40 ? Math.round(r.width) : 320,
    H: r.height > 40 ? Math.round(r.height) : 150,
  };
}

export function lineChart(host, points, { color = '#3ddc84', fill = true, goal = null } = {}) {
  host.replaceChildren();
  const { W, H } = chartBox(host);
  const PADX = 26, PADY = 16;
  const vals = points.filter(p => p.y !== null && p.y !== undefined).map(p => p.y);
  if (vals.length < 1) { host.append(el('div', { class: 'empty', text: t('empty') })); return; }

  /* The axis belongs to the readings. It used to be taken across the
     readings and the target together, so someone at 82kg aiming for 72 got
     a twelve-kilo axis — and three months of real change, two kilos of it,
     came out as a flat line across the top third. The target only joins in
     when it is close enough that the readings stay legible; otherwise it is
     a number on the row below the chart, which is where it already is. */
  let min = Math.min(...vals);
  let max = Math.max(...vals);
  if (min === max) { min -= 1; max += 1; }
  const pad = (max - min) * 0.12;
  min -= pad; max += pad;
  if (goal !== null) {
    const reach = (max - min) * 0.45;
    if (goal > min - reach && goal < max + reach) {
      min = Math.min(min, goal - pad);
      max = Math.max(max, goal + pad);
    }
  }

  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}` });
  const X = i => PADX + (i / Math.max(1, points.length - 1)) * (W - PADX * 2);
  const Y = v => PADY + (1 - (v - min) / (max - min)) * (H - PADY * 2);

  for (let i = 0; i <= 3; i++) {
    const y = PADY + (i / 3) * (H - PADY * 2);
    svg.append(svgEl('line', { x1: PADX, y1: y, x2: W - PADX, y2: y, stroke: 'currentColor', 'stroke-opacity': .12, 'stroke-width': 1 }));
  }
  /* What those lines mean. Four gridlines with no number against any of
     them make the shape readable and the scale invisible — a line that
     climbs could be two kilos or twenty. Both ends carry their value, which
     is enough to read every height in between. */
  for (const [v, y, anchor] of [[max, PADY + 3, 'start'], [min, H - PADY, 'start']]) {
    const tx = svgEl('text', {
      x: 2, y, 'text-anchor': anchor, fill: 'currentColor',
      'fill-opacity': .42, 'font-size': 9,
    });
    tx.textContent = num(Math.round(v * 10) / 10);
    svg.append(tx);
  }
  if (goal !== null && goal >= min && goal <= max) {
    svg.append(svgEl('line', {
      x1: PADX, y1: Y(goal), x2: W - PADX, y2: Y(goal),
      stroke: color, 'stroke-opacity': .45, 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
    }));
  }

  const spacing = (W - PADX * 2) / Math.max(1, points.length - 1);
  const drawn = [];
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
    const d = curveThrough(seg);
    if (fill) {
      const area = d + ` L${seg.at(-1)[0].toFixed(1)} ${H - PADY} L${seg[0][0].toFixed(1)} ${H - PADY} Z`;
      const grad = svgEl('linearGradient', { id: 'g' + Math.random().toString(36).slice(2, 7), x1: 0, y1: 0, x2: 0, y2: 1 });
      grad.append(svgEl('stop', { offset: '0%', 'stop-color': color, 'stop-opacity': .3 }));
      grad.append(svgEl('stop', { offset: '100%', 'stop-color': color, 'stop-opacity': 0 }));
      svg.append(grad);
      svg.append(svgEl('path', { d: area, fill: `url(#${grad.id})`, stroke: 'none' }));
    }
    const line = svgEl('path', { d, fill: 'none', stroke: color, 'stroke-width': 2.4,
      'stroke-linejoin': 'round', 'stroke-linecap': 'round' });
    svg.append(line);
    drawn.push(line);
    /* A ring, not a dot: a filled circle at every reading competes with the
       line, while a ring lets it through and still says "a real number was
       recorded here".

       And only while they are far enough apart to be separate rings. At
       ninety readings across three hundred pixels they touch, and what was
       a line with marks on it becomes a fat dotted band — the rings stop
       pointing at anything and just thicken the line. */
    if (spacing >= 9) {
      seg.forEach(pt => svg.append(svgEl('circle', {
        cx: pt[0], cy: pt[1], r: 2.9, fill: 'var(--card)', stroke: color, 'stroke-width': 1.8,
      })));
    }
  }

  const step = labelStep(points.length, W);
  points.forEach((p, i) => {
    if (i % step !== 0 && i !== points.length - 1) return;
    /* the last reading always gets its date, and the one before it is
       dropped if they would collide */
    if (i !== points.length - 1 && points.length - 1 - i < step * 0.6) return;
    axisLabel(svg, p.x, X(i), H - 2);
  });

  host.append(svg);
  fitLabels(svg, W);
  drawIn(drawn);
}

/** Bar chart. points = [{x, y, color?}] */
export function barChart(host, points, { color = '#4c9aff', goal = null, unit = '' } = {}) {
  host.replaceChildren();
  if (!points.length) { host.append(el('div', { class: 'empty', text: t('empty') })); return; }
  const { W, H } = chartBox(host);
  /* Twenty-two, not eight. The first bar's date is centred on that bar, so
     the chart needs half a date's width of room at each end or the outer
     labels hang off the card. Half of «۵ شهریور» at nine point is twenty. */
  const PADY = 18, PADX = 22;
  const max = Math.max(...points.map(p => p.y), goal ?? 0, 1) * 1.12;
  const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}` });
  const bw = (W - PADX * 2) / points.length;
  const Y = v => PADY + (1 - v / max) * (H - PADY * 2);

  /* The tallest bar's value, so the height of the others can be read off
     it. Bars without a scale say which day was biggest and nothing about
     how big any of them were. */
  {
    const tx = svgEl('text', {
      x: 2, y: PADY - 6, 'text-anchor': 'start', fill: 'currentColor',
      'fill-opacity': .42, 'font-size': 9,
    });
    tx.textContent = num(Math.round(max / 1.12));
    svg.append(tx);
  }

  if (goal) {
    const gl = svgEl('line', {
      x1: PADX, y1: Y(goal), x2: W - PADX, y2: Y(goal),
      'stroke-opacity': .55, 'stroke-width': 1.2, 'stroke-dasharray': '4 4',
    });
    gl.style.stroke = 'var(--acc)';
    svg.append(gl);
  }
  const bars = [];
  const step = labelStep(points.length, W);
  points.forEach((p, i) => {
    const x = PADX + i * bw + bw * 0.18;
    const w = bw * 0.64;
    const y = Y(p.y);
    const h = Math.max(1, H - PADY - y);
    const bar = svgEl('rect', {
      x: x.toFixed(1), y: y.toFixed(1), width: w.toFixed(1), height: h.toFixed(1),
      rx: Math.min(4.5, w / 2), 'fill-opacity': p.dim ? .35 : .9,
    });
    bar.style.fill = p.color || color;          // style, so CSS vars resolve
    /* grown from the floor, which is where a bar grows from */
    bar.style.transformOrigin = `0 ${(H - PADY).toFixed(1)}px`;
    bar.style.transformBox = 'view-box';
    svg.append(bar);
    bars.push(bar);
    /* centred on the bar, which is what makes the date under a bar the
       bar's own date */
    if (i % step === 0) axisLabel(svg, p.x, x + w / 2, H - 3);
  });
  host.append(svg);
  fitLabels(svg, W);
  drawIn(bars, { stagger: 22 });
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
  const bar = el('div', { style: 'display:flex;height:14px;border-radius:var(--r-xs);overflow:hidden;margin:10px 0 14px' });
  parts.forEach(x => bar.append(el('i', { style: `flex:${x.v};background:${x.col}` })));
  const legend = el('div', { style: 'display:flex;flex-direction:column;gap:9px' });
  parts.forEach(x => legend.append(el('div', { style: 'display:flex;align-items:center;gap:9px;font-size:var(--t-md)' },
    el('i', { style: `width:9px;height:9px;border-radius:var(--r-xs);background:${x.col};flex:0 0 auto` }),
    el('span', { style: 'flex:1;color:var(--tx2)' }, t(x.k)),
    el('b', {}, `${num(round(x.g))}g`),
    el('span', { style: 'color:var(--tx3);font-size:var(--t-sm);min-width:38px;text-align:end' },
      `${num(Math.round(x.v / kcal * 100))}%`),
  )));
  host.append(bar, legend);
}
