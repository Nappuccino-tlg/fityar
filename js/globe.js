/* ============================================================
   GLOBE — the app as a planet 🌍
   A true-3D dot-matrix Earth on a 2D canvas (the GitHub/Stripe
   globe look): continents are point clouds projected with real
   rotation maths, the key light and limb shading are painted
   fixed every frame, so the sphere reads as a sphere at any
   angle. Drag to spin with inertia; the five stations are real
   DOM buttons positioned by the same projection. No WebGL,
   no libraries.
   ============================================================ */

import { $, el, shortDate, longDate } from './ui.js';
import { t, num, getLang } from './i18n.js';
import { S } from './store.js';
import { go } from './app.js';
import { daySummary, getWater } from './nutrition.js';
import { rankState } from './xp.js';
import * as db from './db.js';
import { landPoints, PALETTE } from './land.js';

const D2R = Math.PI / 180;
const TAU = Math.PI * 2;

/* How finely the depth fade and the slope shading are quantised before the
   dots are bucketed for painting. Ten steps of fade is finer than the eye
   resolves across a 356-pixel sphere, and it is the difference between
   sixty fill calls a frame and thirteen thousand. */
const FADE_STEPS = 10;
const LIT_STEPS = 5;
let ground = null;   // dots to paint, filed by [colour][fade]
let shade = null;    // and their highlight/shadow pass, by [side][strength]
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ------------------------------------------------------------
   Continent point cloud — a tiny hand-drawn lat/lon map: each
   blob is a centre plus a radius; points are scattered inside
   with a gaussian falloff, so the land reads as land.
   ------------------------------------------------------------ */
/* ------------------------------------------------------------
   The globe renderer
   ------------------------------------------------------------ */
export function globe3d({ r = 132 } = {}) {
  const pad = 30;
  const size = r * 2 + pad * 2;

  const root = el('div', { class: 'gl-scene' });

  /* starfield behind everything */
  const stars = el('div', { class: 'gl-stars' });
  for (let i = 0; i < 46; i++) {
    const s = el('i');
    s.style.cssText =
      `left:${(Math.random() * 100).toFixed(1)}%;top:${(Math.random() * 100).toFixed(1)}%;` +
      `animation-delay:${(Math.random() * 3).toFixed(2)}s;` +
      `width:${(Math.random() * 1.6 + .8).toFixed(1)}px;height:${(Math.random() * 1.6 + .8).toFixed(1)}px;`;
    stars.append(s);
  }
  root.append(stars);

  /* the canvas — device-pixel-ratio aware */
  const cv = el('canvas', { class: 'gl-cv' });
  const dpr = Math.min(3, Math.max(2, window.devicePixelRatio || 1));
  cv.width = size * dpr; cv.height = size * dpr;
  cv.style.width = size + 'px'; cv.style.height = size + 'px';
  const ctx = cv.getContext('2d');
  ctx.scale(dpr, dpr);
  root.append(cv);

  /* glass base plate under the sphere */
  const plate = el('div', { class: 'gl-plate' });
  plate.style.top = `calc(46% + ${r + 30}px)`;
  root.append(plate);

  /* pins: real buttons positioned over the canvas */
  const pinsLayer = el('div', { class: 'gl-pins' });
  root.append(pinsLayer);

  const pts = landPoints(1.15);
  const st = { rx: -16, ry: 30, vx: 0, vy: .16, dragging: false, px: 0, py: 0, dead: false, raf: 0 };

  function render() {
    const cx = size / 2, cy = size / 2;
    ctx.clearRect(0, 0, size, size);

    /* --- sphere body: ocean ball, key light baked in --- */
    const ocean = ctx.createRadialGradient(cx - r * .38, cy - r * .42, r * .1, cx, cy, r);
    ocean.addColorStop(0, '#1c4a7e');
    ocean.addColorStop(.55, '#0e2f5a');
    ocean.addColorStop(1, '#071a38');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = ocean; ctx.fill();

    /* --- rotate and paint the point cloud ---

       Not one fill per dot. That was thirteen thousand beginPath/fillStyle/
       fill triples a frame once the highlight pass is counted, and it ran
       at forty frames a second on a desktop while the dots were still far
       enough apart to count — so there was no room to add the density the
       land actually needed.

       A canvas is fast at drawing a thousand circles inside one path and
       slow at being told a new colour. So each dot is filed by its terrain
       colour and by a tenth of its depth fade, and every bucket goes down
       as a single path: about sixty fills a frame. Circles that overlap
       within one path also fill once instead of twice, so crowded ground
       no longer darkens where two dots land on each other. */
    const dotK = r / 110;   // dot size scales with the sphere, not the screen
    const cyr = Math.cos(st.ry * D2R), syr = Math.sin(st.ry * D2R);
    const cxr = Math.cos(st.rx * D2R), sxr = Math.sin(st.rx * D2R);
    if (!ground) {
      /* Allocated once. A fresh array per frame at sixty frames a second
         is work for the garbage collector and nothing else. */
      ground = Array.from({ length: PALETTE.length * FADE_STEPS }, () => []);
      shade = Array.from({ length: LIT_STEPS * 2 }, () => []);
    }
    for (let i = 0; i < ground.length; i++) ground[i].length = 0;
    for (let i = 0; i < shade.length; i++) shade[i].length = 0;

    for (const p of pts) {
      /* Spin around Y, then tilt around X — but depth first. Half the dots
         are on the far side and get thrown away, and the two coordinates
         that decide where a dot lands on screen are not needed to know
         whether it lands at all. Computing them after the cull rather than
         before skips four multiplies for every hidden dot, which is a
         quarter of this loop. */
      const z1 = -p.x * syr + p.z * cyr;
      const z2 = p.y * sxr + z1 * cxr;
      if (z2 <= 0) continue;                      // hidden hemisphere
      const x1 = p.x * cyr + p.z * syr;
      const y2 = p.y * cxr - z1 * sxr;
      const depth = z2;                            // 0 limb … 1 centre
      const sx = cx + x1 * r, sy = cy + y2 * r;
      const fade = .25 + .75 * depth;
      const s = p.s * dotK * (0.78 + .62 * depth);
      let f = (depth * FADE_STEPS) | 0;
      if (f > FADE_STEPS - 1) f = FADE_STEPS - 1;
      const g = ground[p.ci * FADE_STEPS + f];
      g.push(sx, sy, s);
      /* Colour comes from the terrain, brightness from its slope. A dot
         lit brighter than the one downhill of it is the whole of what the
         eye reads as relief — three flat greens at random had no downhill
         to be brighter than. */
      if (p.lit > 0.06 || p.lit < -0.06) {
        const up = p.lit > 0;
        let k = (fade * (up ? p.lit * 0.5 : -p.lit * 0.42) * LIT_STEPS / 0.5) | 0;
        if (k > LIT_STEPS - 1) k = LIT_STEPS - 1;
        shade[(up ? 0 : LIT_STEPS) + k].push(sx, sy, s * .92);
      }
    }

    for (let i = 0; i < ground.length; i++) {
      const b = ground[i];
      if (!b.length) continue;
      ctx.globalAlpha = .25 + ((i % FADE_STEPS) + .5) / FADE_STEPS * .75;
      ctx.fillStyle = PALETTE[(i / FADE_STEPS) | 0];
      ctx.beginPath();
      /* moveTo before each arc, or the canvas joins one circle to the next
         with a straight line and the globe grows a cobweb. */
      for (let j = 0; j < b.length; j += 3) {
        ctx.moveTo(b[j] + b[j + 2], b[j + 1]);
        ctx.arc(b[j], b[j + 1], b[j + 2], 0, TAU);
      }
      ctx.fill();
    }
    for (let i = 0; i < shade.length; i++) {
      const b = shade[i];
      if (!b.length) continue;
      ctx.globalAlpha = ((i % LIT_STEPS) + .5) / LIT_STEPS * 0.5;
      ctx.fillStyle = i < LIT_STEPS ? '#ffffff' : '#0a1f18';
      ctx.beginPath();
      for (let j = 0; j < b.length; j += 3) {
        ctx.moveTo(b[j] + b[j + 2], b[j + 1]);
        ctx.arc(b[j], b[j + 1], b[j + 2], 0, TAU);
      }
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    /* --- fixed lighting: never rotates with the sphere --- */
    const key = ctx.createRadialGradient(cx - r * .42, cy - r * .48, 0, cx - r * .42, cy - r * .48, r * 1.15);
    key.addColorStop(0, 'rgba(255,255,255,.34)');
    key.addColorStop(.4, 'rgba(255,255,255,.07)');
    key.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fillStyle = key; ctx.fill();

    const night = ctx.createRadialGradient(cx + r * .5, cy + r * .55, r * .2, cx + r * .5, cy + r * .55, r * 1.3);
    night.addColorStop(0, 'rgba(2,5,16,.66)');
    night.addColorStop(.6, 'rgba(2,5,16,.22)');
    night.addColorStop(1, 'rgba(2,5,16,0)');
    ctx.fillStyle = night; ctx.fill();

    /* limb darkening — the edge of the sphere falls into shadow */
    const limb = ctx.createRadialGradient(cx, cy, r * .72, cx, cy, r);
    limb.addColorStop(0, 'rgba(0,0,0,0)');
    limb.addColorStop(1, 'rgba(1,4,14,.55)');
    ctx.fillStyle = limb; ctx.fill();

    /* --- atmosphere rim (outside the sphere edge) --- */
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2);
    const atm = ctx.createRadialGradient(cx, cy, r, cx, cy, r + 9);
    atm.addColorStop(0, 'rgba(110,190,255,.42)');
    atm.addColorStop(.5, 'rgba(110,190,255,.12)');
    atm.addColorStop(1, 'rgba(110,190,255,0)');
    ctx.strokeStyle = atm; ctx.lineWidth = 9; ctx.stroke();
  }

  /* project a lat/lon to screen space + depth (shared with the pins) */
  function project(lat, lon) {
    const la = lat * D2R, lo = lon * D2R;
    const px = Math.cos(la) * Math.sin(lo), py = -Math.sin(la), pz = Math.cos(la) * Math.cos(lo);
    const cyr = Math.cos(st.ry * D2R), syr = Math.sin(st.ry * D2R);
    const cxr = Math.cos(st.rx * D2R), sxr = Math.sin(st.rx * D2R);
    const x1 = px * cyr + pz * syr;
    const z1 = -px * syr + pz * cyr;
    const y2 = py * cxr - z1 * sxr;
    const z2 = py * sxr + z1 * cxr;
    return { sx: x1 * r, sy: y2 * r, z: z2 };
  }

  function draw() {
    render();
    const cx = size / 2, cy = size / 2;
    for (const p of pins) {
      const pr = project(p.lat, p.lon);
      const vis = pr.z > 0;
      const depth = (pr.z / r + 1) / 2;           // 0 back … 1 front
      p.el.classList.toggle('back', pr.z <= 0);
      /* the pin layer is a 0×0 point on the sphere's centre, so the
         projection needs no extra offset */
      p.el.style.transform = `translate(${pr.sx.toFixed(1)}px, ${pr.sy.toFixed(1)}px)`;
      p.el.style.zIndex = (200 + pr.z) | 0;
      p.el.style.opacity = vis ? String(.3 + .7 * depth) : '0';
      p.el.style.pointerEvents = vis ? 'auto' : 'none';
      p.el.setAttribute('aria-hidden', vis ? 'false' : 'true');
    }
  }

  function loop() {
    if (st.dead) return;
    if (!st.dragging) {
      st.ry += st.vy;
      st.vy += (.16 - st.vy) * .012;              // ease back to idle spin
      st.vx *= .9; st.rx += st.vx;
      st.rx += (clamp(st.rx, -52, 30) - st.rx) * .03;
      draw();
    }
    st.raf = requestAnimationFrame(loop);
  }

  /* ---- drag to spin, with inertia ---- */
  const down = e => {
    if (e.target.closest('.gl-pin')) return;      // pins are taps, not grabs
    st.dragging = true;
    st.px = e.clientX; st.py = e.clientY;
    root.classList.add('grab');
    e.preventDefault();
  };
  const move = e => {
    if (!st.dragging) return;
    const dx = e.clientX - st.px, dy = e.clientY - st.py;
    st.px = e.clientX; st.py = e.clientY;
    st.ry += dx * .45;
    st.rx = clamp(st.rx - dy * .32, -62, 30);
    st.vy = clamp(dx * .30, -6, 6);
    st.vx = clamp(-dy * .16, -4, 4);
    draw();
    if (e.cancelable) e.preventDefault();
  };
  const up = () => { st.dragging = false; root.classList.remove('grab'); };
  root.addEventListener('pointerdown', down);
  window.addEventListener('pointermove', move, { passive: false });
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);

  const pins = [];
  const api = {
    root,
    /* exposed for tests/debugging: live rotation + velocity state */
    state: st,
    addPin(lon, lat, glyph, label, color, onTap) {
      const p = el('button', { class: 'gl-pin', style: `--pc:${color}`, type: 'button' },
        el('i', { class: 'gl-pin-wave' }),
        el('i', { class: 'gl-pin-dot' }),
        el('span', { class: 'gl-pin-glyph' }, glyph),
        el('span', { class: 'gl-pin-lbl' }, label));
      /* tap: keep the drag logic from eating it */
      p.addEventListener('pointerdown', e => e.stopPropagation());
      p.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); onTap(p); });
      pinsLayer.append(p);
      pins.push({ el: p, lon, lat });
      draw();
      return p;
    },
    dispose() {
      st.dead = true;
      cancelAnimationFrame(st.raf);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    },
  };
  draw();
  root.__glState = st;   // reachable from the DOM for tests/debugging
  st.raf = requestAnimationFrame(loop);
  return api;
}

/* ============================================================
   The screen: five stations on one planet
   ============================================================ */

const PINS = [
  { id: 'home',      lon: 16,  lat: 24,  glyph: '🔥', screen: 'home',     color: 'var(--orange)' },
  { id: 'nutrition', lon: 118, lat: 18,  glyph: '🥗', screen: 'diary',    color: 'var(--green)' },
  { id: 'train',     lon: 226, lat: 12,  glyph: '🏋️', screen: 'train',    color: 'var(--blue)' },
  { id: 'progress',  lon: 292, lat: -26, glyph: '📈', screen: 'progress', color: 'var(--purple)' },
  { id: 'more',      lon: 76,  lat: -44, glyph: '✨', screen: 'more',     color: 'var(--teal)' },
  /* The one station that is not a shortcut to a tab: it opens something
     that exists nowhere else, which is what makes it worth landing on. */
  { id: 'ask',       lon: 186, lat: 52,  glyph: '؟',  screen: null,       color: 'var(--pink)', ask: true },
];

const NAVKEY = { home: 'navHome', nutrition: 'navDiary', train: 'navTrain',
  progress: 'navProgress', more: 'navMore', ask: 'askTitle' };

/* one live instance at a time — re-entering the screen must not
   stack rAF loops and window listeners */
let live = null;

/* ------------------------------------------------------------
   The week, and where you have got to
   ------------------------------------------------------------ */

/* Saturday first, because the week does. getDay() counts from Sunday, so
   the letters are indexed by it rather than reordered. */
const DAY_FA = ['ی', 'د', 'س', 'چ', 'پ', 'ج', 'ش'];
const DAY_EN = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const keyOf = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
/* The day of the month, in whichever calendar the app is speaking. Read off
   shortDate rather than the Date object, because a Persian day number is
   not the Gregorian one and the diary this row opens uses the Persian. */
const dayNum = (key) => {
  const m = String(shortDate(key)).match(/[\d۰-۹]+/);
  return m ? m[0] : '';
};

/**
 * The last seven days, ending today.
 *
 * Two marks per day and nothing else: a dot when something was eaten and a
 * ring when something was trained. Not a score — a week with three empty
 * days is a fact about the week, not a mark out of ten, and an app that
 * grades your week is an app you stop opening in a bad one.
 */
async function weekStrip() {
  const [workouts, logs] = await Promise.all([
    db.all('workouts').catch(() => []),
    db.all('foodLogs').catch(() => []),
  ]);
  const trained = new Set(workouts.map((w) => w.date).filter(Boolean));
  const ate = new Set(logs.map((l) => l.date).filter(Boolean));
  const fa = getLang() === 'fa';

  const cells = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - i);
    const k = keyOf(d);
    /* The day of the month under the letter. Seven letters alone do not say
       which week they are, and the row runs backwards from today — without
       a number it reads as the week ahead. */
    const cell = el('button', {
      class: 'gw-day' + (i === 0 ? ' today' : ''),
      onclick: () => { S.date = k; go('diary'); },
      title: longDate(k),
    },
      el('span', { class: 'gw-l' }, (fa ? DAY_FA : DAY_EN)[d.getDay()]),
      el('span', { class: 'gw-marks' },
        el('i', { class: 'gw-eat' + (ate.has(k) ? ' on' : '') }),
        el('i', { class: 'gw-train' + (trained.has(k) ? ' on' : '') })),
      el('span', { class: 'gw-d' }, dayNum(k)));
    cells.push(cell);
  }

  return el('div', { class: 'card gw', style: '--cardc:var(--teal)' },
    el('div', { class: 'card-head' },
      el('h3', {}, fa ? 'این هفته' : 'This week'),
      el('span', { class: 'gw-key' },
        el('i', { class: 'gw-eat on' }), fa ? 'غذا' : 'food',
        el('i', { class: 'gw-train on' }), fa ? 'تمرین' : 'training')),
    el('div', { class: 'gw-row' }, ...cells));
}

/**
 * The things this app knows about somebody that no other app could.
 *
 * Every line is computed here, on the phone, from timestamps that have
 * never left it — which is the one claim FitYar can make that a chat
 * product running in a data centre cannot.
 *
 * A pattern needs enough behind it to be a pattern. Under five workouts the
 * training lines stay quiet: "you usually train at six" drawn from two
 * sessions is a coincidence said in a confident voice.
 */
async function patternsCard() {
  const [workouts, logs] = await Promise.all([
    db.all('workouts').catch(() => []),
    db.all('foodLogs').catch(() => []),
  ]);
  const fa = getLang() === 'fa';
  const lines = [];

  const timed = workouts.filter((w) => Number(w.start) > 0);
  if (timed.length >= 5) {
    /* The hour, as the hour a session starts rather than the average of a
       set of clock numbers — averaging 23:00 and 01:00 gives noon. */
    const hours = new Array(24).fill(0);
    for (const w of timed) hours[new Date(w.start).getHours()]++;
    const hour = hours.indexOf(Math.max(...hours));
    lines.push([
      fa ? 'معمولاً این ساعت تمرین می‌کنی' : 'You usually train at',
      `${num(hour)}:۰۰`.replace('۰۰', fa ? '۰۰' : '00'),
    ]);

    /* And the day it most often is. */
    const days = new Array(7).fill(0);
    for (const w of timed) days[new Date(w.start).getDay()]++;
    const best = days.indexOf(Math.max(...days));
    const NAMES = fa
      ? ['یک‌شنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه', 'شنبه']
      : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    lines.push([fa ? 'پرتمرین‌ترین روزت' : 'Your strongest day', NAMES[best]]);
  }

  if (logs.length >= 10) {
    /* Counted by how many days it appears on rather than how many rows it
       has: eating rice twice in one day is one habit, not two. */
    const seen = new Map();
    for (const l of logs) {
      const name = (fa ? l.nameFa : l.name) || l.nameFa || l.name;
      if (!name) continue;
      if (!seen.has(name)) seen.set(name, new Set());
      seen.get(name).add(l.date);
    }
    let top = null;
    for (const [name, dates] of seen) if (!top || dates.size > top[1]) top = [name, dates.size];
    if (top && top[1] >= 3) {
      lines.push([fa ? 'بیش از همه این را ثبت کرده‌ای' : 'You log this most', top[0]]);
    }
  }

  /* How much of this month has anything at all on it. Days, not meals —
     a day you logged one apple counts, because showing up is the thing
     being measured. */
  const now = new Date();
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const soFar = Math.round((now - first) / 86400000) + 1;
  const active = new Set([...logs, ...workouts].map((x) => x.date)
    .filter((d) => d && new Date(d) >= first)).size;
  if (soFar >= 5) {
    lines.push([
      fa ? 'از این ماه تا امروز' : 'Of this month so far',
      `${num(active)} ${fa ? 'روز از' : 'of'} ${num(soFar)}`,
    ]);
  }

  if (!lines.length) return null;

  /* What these are and where they came from, behind the question mark that
     asks it — the same affordance the daily-needs card uses, so a reader
     who has met one has met both. Outlined rather than flat, because a
     card of plain rows gives no other clue that anything here is
     pressable. */
  const note = el('p', { class: 'gp-note', hidden: true },
    fa
      ? 'این‌ها از زمان‌های خود تو حساب می‌شوند — همین‌جا روی گوشی، و هیچ‌کدام جایی فرستاده نمی‌شود. تا وقتی داده‌ی کافی نباشد چیزی نوشته نمی‌شود.'
      : 'Worked out from your own timestamps, here on the phone, and none of it is sent anywhere. Nothing appears until there is enough behind it to be a pattern.');
  const card = el('div', { class: 'card gp', style: '--cardc:var(--purple)' },
    el('div', { class: 'card-head' },
      el('h3', {}, fa ? 'الگوهای تو' : 'Your patterns'),
      el('button', {
        class: 'tc-why-btn', 'aria-expanded': 'false',
        'aria-label': fa ? 'این‌ها از کجا می‌آیند؟' : 'Where do these come from?',
        onclick: (e) => {
          note.hidden = !note.hidden;
          e.currentTarget.setAttribute('aria-expanded', String(!note.hidden));
          e.currentTarget.closest('.gp').classList.toggle('open', !note.hidden);
        },
      }, '؟')),
    ...lines.map(([label, value]) => el('div', { class: 'gp-row' },
      el('span', {}, label), el('b', {}, value))),
    note);
  return card;
}

/** Four numbers that took four tabs to find. */
function statsRow(rk) {
  const fa = getLang() === 'fa';
  const f = rk?.facts || {};
  const cell = (value, label, onclick) => el(onclick ? 'button' : 'div',
    onclick ? { class: 'gl-stat-btn', onclick } : {},
    el('b', {}, value), el('span', {}, label));
  return el('div', { class: 'card summary-bar gl-stats' },
    /* A level number with nothing behind it is a number. This one opens the
       ladder it belongs to. */
    cell(num(rk?.level || 1), fa ? 'سطح' : 'Level', async () => {
      const prog = await import('./progress.js');
      prog.openLevels();
    }),
    cell(num(f.workouts || 0), t('workouts')),
    cell(num(f.prs || 0), t('records')),
    cell(num(f.bestStreak || 0), fa ? 'زنجیره' : 'Streak'));
}

export async function renderGlobe() {
  const host = $('#globe-body');
  if (!host) return;
  if (live) { live.dispose(); live = null; }
  host.replaceChildren();
  host.className = 'globe-body';

  const head = el('div', { class: 'gl-head' },
    el('b', {}, t('globeTitle')),
    el('span', {}, t('globeHint')));
  const stage = el('div', { class: 'gl-stage' });

  const g = globe3d({ r: Math.min(148, Math.max(128, (Math.min(window.innerWidth, 460) * .46) | 0)) });
  live = g;
  stage.append(g.root);

  /* live values under each pin */
  const sum = await daySummary(S.date);
  const rk = await rankState().catch(() => null);
  const fa = getLang() === 'fa';

  const goal = S.goals?.kcal || 0;
  const left = Math.max(0, Math.round(goal - (sum?.kcal || 0) + (sum?.burned || 0)));
  const vals = {
    home: {
      big: num(left), unit: t('kcal'),
      sub: t('kcalLeft'),
      chips: [
        [t('eaten'), num(Math.round(sum?.kcal || 0))],
        [t('burned'), num(Math.round(sum?.burned || 0))],
      ],
      tip: fa ? 'انرژی امروزت را کامل کن' : 'Complete today\u2019s energy',
    },
    nutrition: {
      big: num(Math.round(sum?.protein || 0)) + 'g', unit: 'P',
      sub: t('protein'),
      chips: [
        ['C', num(Math.round(sum?.carbs || 0))],
        ['F', num(Math.round(sum?.fat || 0))],
        [t('fiber'), num(Math.round(sum?.fiber || 0)) + 'g'],
        [t('water'), num(Math.round(await getWater(S.date))) + 'ml'],
      ],
      tip: fa ? 'پروتئین، ستون عضله‌سازی است' : 'Protein carries the gain',
    },
    train: {
      big: num(rk?.facts?.sets || 0), unit: t('sets'),
      sub: t('weeklyVolume'),
      chips: rk?.facts?.volume ? [[t('volume'), num(Math.round(rk.facts.volume))]] : [],
      tip: fa ? 'هر ست، یک سنگ ساختمان' : 'Every set lays a brick',
    },
    progress: {
      big: num(rk?.level || 1), unit: fa ? 'سطح' : 'level',
      sub: fa ? 'سطح و رکوردها' : 'Level & records',
      chips: rk?.facts?.prs ? [[t('records'), num(rk.facts.prs)]] : [],
      tip: fa ? 'رکوردهای تو، قاب تو' : 'Your records, your frame',
    },
    /* The chat has a tab of its own now. This station is a signpost to it
       and nothing more — it used to explain what the chat was, on a globe,
       to somebody who could simply be shown it. */
    ask: {
      big: '؟', unit: '',
      sub: '',
      chips: [],
      tip: fa ? 'برای چت با بات آفلاین اینجا کلیک کن'
        : 'Tap here to chat with the offline bot',
    },
    more: {
      big: num(rk?.facts?.workouts || 0), unit: t('workouts'),
      sub: fa ? 'بهترین زنجیره' : 'Best streak',
      chips: rk?.facts?.bestStreak ? [[fa ? 'روز' : 'days', num(rk.facts.bestStreak)]] : [],
      tip: fa ? 'زنجیره را نشکن' : 'Don\u2019t break the chain',
    },
  };

  /* panel — glass slide-up with live stats */
  const panel = el('div', { class: 'gl-panel', hidden: true });
  let activePin = null, hideTimer = 0;

  function showPin(pin) {
    if (activePin) activePin.classList.remove('sel');
    activePin = pin; pin.classList.add('sel');
    const id = pin.dataset.id, v = vals[id] || {}, color = pin.style.getPropertyValue('--pc');
    clearTimeout(hideTimer);
    panel.hidden = false;
    requestAnimationFrame(() => panel.classList.add('open'));
    /* replaceChildren stringifies nulls, so filter before handing over */
    panel.replaceChildren(...[
      el('div', { class: 'gl-panel-grab' }),
      el('div', { class: 'gl-panel-head', style: `--pc:${color}` },
        el('span', { class: 'gl-panel-glyph' }, pin.dataset.glyph),
        el('div', { class: 'gl-panel-title' },
          el('b', {}, t(NAVKEY[id]) || id),
          el('span', {}, v.sub || '')),
        el('button', { class: 'tb-btn', onclick: hidePanel, 'aria-label': 'close' }, '✕')),
      el('div', { class: 'gl-panel-big', style: `color:${color}` },
        el('b', {}, v.big), el('span', {}, v.unit || '')),
      v.chips?.length ? el('div', { class: 'gl-chips' },
        v.chips.map(([k, n]) => el('span', { class: 'gl-chip' }, `${k}: `, el('b', {}, n)))) : null,
      el('p', { class: 'gl-tip' }, v.tip || ''),
      el('button', {
        class: 'btn full',
        onclick: async () => {
          hidePanel();
          /* Its own tab, rather than a sheet on top of the globe. */
          go(id === 'ask' ? 'chat' : pin.dataset.screen);
        },
      }, id === 'ask' ? t('navChat') : t('globeOpen') + ' ' + (t(NAVKEY[id]) || '')),
    ].filter(Boolean));
  }

  function hidePanel() {
    panel.classList.remove('open');
    if (activePin) { activePin.classList.remove('sel'); activePin = null; }
    hideTimer = setTimeout(() => { panel.hidden = true; }, 280);
  }

  for (const p of PINS) {
    const pin = g.addPin(p.lon, p.lat, p.glyph, t(NAVKEY[p.id]), p.color,
      (el2) => showPin(el2));
    /* dataset.screen is what the panel's open-button navigates with —
       leaving it unset used to send every station back to home */
    pin.dataset.id = p.id; pin.dataset.glyph = p.glyph;
    if (p.screen) pin.dataset.screen = p.screen;
  }

  /* Below the planet: the week as it actually went, and the four numbers
     that otherwise live one tap deep behind four different pins. */
  const patterns = await patternsCard();
  host.append(head, stage, panel, statsRow(rk), await weekStrip(), patterns);
}
