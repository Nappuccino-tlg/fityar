/* ============ Inline SVG artwork — no external requests, theme-aware ============ */

const NS = 'http://www.w3.org/2000/svg';
import { MOVES, poseOf, rotations } from './moves.js';
/* The empty states are the drawings that get to be objects: a dumbbell with
   weight to it, a scale under glass. Shading comes from art3d.js; these
   names keep the same contract the flat outlines had. */
import {
  dumbbell3d, plate3d, chart3d, flame3d, scale3d, clipboard3d,
  target3d, water3d, kettlebell3d, calendar3d, trophy3d, medal3d, barbell3d,
} from './art3d.js';

function s(tag, attrs = {}, ...kids) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === null || v === undefined || v === false) continue;
    n.setAttribute(k, v);
  }
  kids.flat().forEach(k => k && n.append(k));
  return n;
}
const svg = (viewBox, attrs = {}, ...kids) =>
  s('svg', { viewBox, xmlns: NS, fill: 'none', ...attrs }, ...kids);

/* Anyone drawing an SVG must use these rather than el(): el() calls
   createElement, and createElement('svg') makes an unknown HTML element that
   takes up its CSS box and draws nothing. It looks right in the layout and is
   blank on screen, which is the worst way for a bug to present. */
export { s as svgNode, svg as svgRoot };

/* ============================================================
   BODY MAP — a stylised front/back figure whose muscle groups
   can be highlighted and tapped.
   ============================================================ */

/** Shapes per muscle, front view. viewBox 0 0 120 240 */
const FRONT = {
  traps:     [['path', { d: 'M48 40 L60 46 L72 40 L78 50 L60 54 L42 50 Z' }]],
  shoulders: [['ellipse', { cx: 34, cy: 57, rx: 11, ry: 9.5 }],
              ['ellipse', { cx: 86, cy: 57, rx: 11, ry: 9.5 }]],
  chest:     [['rect', { x: 43, y: 50, width: 16, height: 20, rx: 6 }],
              ['rect', { x: 61, y: 50, width: 16, height: 20, rx: 6 }]],
  biceps:    [['ellipse', { cx: 28, cy: 82, rx: 7, ry: 14 }],
              ['ellipse', { cx: 92, cy: 82, rx: 7, ry: 14 }]],
  forearms:  [['ellipse', { cx: 24, cy: 113, rx: 6, ry: 16 }],
              ['ellipse', { cx: 96, cy: 113, rx: 6, ry: 16 }]],
  abs:       [['rect', { x: 47, y: 73, width: 26, height: 34, rx: 8 }]],
  quads:     [['rect', { x: 43, y: 116, width: 15, height: 44, rx: 7 }],
              ['rect', { x: 62, y: 116, width: 15, height: 44, rx: 7 }]],
  calves:    [['ellipse', { cx: 50, cy: 183, rx: 7.5, ry: 18 }],
              ['ellipse', { cx: 70, cy: 183, rx: 7.5, ry: 18 }]],
};

/** Shapes per muscle, back view. */
const BACK = {
  traps:      [['path', { d: 'M46 40 L60 47 L74 40 L80 62 L60 68 L40 62 Z' }]],
  shoulders:  [['ellipse', { cx: 34, cy: 57, rx: 11, ry: 9.5 }],
               ['ellipse', { cx: 86, cy: 57, rx: 11, ry: 9.5 }]],
  back:       [['path', { d: 'M42 66 L58 70 L58 104 L46 96 Z' }],
               ['path', { d: 'M78 66 L62 70 L62 104 L74 96 Z' }]],
  triceps:    [['ellipse', { cx: 28, cy: 82, rx: 7, ry: 14 }],
               ['ellipse', { cx: 92, cy: 82, rx: 7, ry: 14 }]],
  forearms:   [['ellipse', { cx: 24, cy: 113, rx: 6, ry: 16 }],
               ['ellipse', { cx: 96, cy: 113, rx: 6, ry: 16 }]],
  glutes:     [['ellipse', { cx: 51, cy: 114, rx: 11, ry: 10 }],
               ['ellipse', { cx: 69, cy: 114, rx: 11, ry: 10 }]],
  hamstrings: [['rect', { x: 43, y: 126, width: 15, height: 38, rx: 7 }],
               ['rect', { x: 62, y: 126, width: 15, height: 38, rx: 7 }]],
  calves:     [['ellipse', { cx: 50, cy: 183, rx: 7.5, ry: 18 }],
               ['ellipse', { cx: 70, cy: 183, rx: 7.5, ry: 18 }]],
};

/** The silhouette drawn behind the muscle groups. */
function silhouette() {
  return s('g', { class: 'bm-body' },
    s('ellipse', { cx: 60, cy: 22, rx: 13, ry: 15 }),
    s('rect', { x: 55, y: 34, width: 10, height: 8, rx: 3 }),
    s('path', { d: 'M40 48 Q60 42 80 48 L82 108 Q60 114 38 108 Z' }),
    s('path', { d: 'M40 108 Q60 116 80 108 L78 205 L66 205 L60 140 L54 205 L42 205 Z' }),
    s('path', { d: 'M34 52 L24 132 L32 134 L44 60 Z' }),
    s('path', { d: 'M86 52 L96 132 L88 134 L76 60 Z' }),
  );
}

/** Every muscle the map can draw, in either view. */
export const MUSCLE_IDS = [...new Set([...Object.keys(FRONT), ...Object.keys(BACK)])];

/**
 * Interactive body map.
 * @param {object} opts
 *   selected  Set|Array of muscle ids to highlight
 *   heat      { muscleId: 0..1 } — how hard each was worked. A muscle with a
 *             number shades by it, which is the difference between "you
 *             trained chest" and "you trained chest for eleven sets".
 *   focus     one id drawn in the strong accent
 *   onPick    (muscleId) => void — makes regions tappable
 *   view      'both' | 'front' | 'back'
 */
export function bodyMap({ selected = [], heat = null, focus = null,
                          onPick = null, view = 'both' } = {}) {
  const sel = new Set(selected);
  const wrap = document.createElement('div');
  wrap.className = 'bodymap' + (onPick ? ' tappable' : '');

  const build = (map, label) => {
    const el = svg('0 0 120 215', { class: 'bm-svg' }, silhouette());
    for (const [muscle, shapes] of Object.entries(map)) {
      const hv = heat ? Math.max(0, Math.min(1, heat[muscle] || 0)) : null;
      const g = s('g', {
        class: 'bm-m' + (sel.has(muscle) || hv > 0 ? ' on' : '')
             + (focus === muscle ? ' focus' : ''),
        'data-m': muscle,
        ...(hv ? { style: `--heat:${hv.toFixed(3)}` } : {}),
      });
      shapes.forEach(([tag, attrs]) => g.append(s(tag, attrs)));
      if (onPick) {
        g.style.cursor = 'pointer';
        g.addEventListener('click', (e) => { e.stopPropagation(); onPick(muscle); });
      }
      el.append(g);
    }
    const box = document.createElement('div');
    box.className = 'bm-view';
    box.append(el);
    const cap = document.createElement('span');
    cap.className = 'bm-cap';
    cap.textContent = label;
    box.append(cap);
    return box;
  };

  const isFa = document.documentElement.lang === 'fa';
  if (view === 'both' || view === 'front') wrap.append(build(FRONT, isFa ? 'جلو' : 'Front'));
  if (view === 'both' || view === 'back') wrap.append(build(BACK, isFa ? 'پشت' : 'Back'));
  return wrap;
}

/** Which muscles are drawn on which view — used to hint the user. */
export const FRONT_MUSCLES = Object.keys(FRONT);
export const BACK_MUSCLES = Object.keys(BACK);

/* ============================================================
   DECORATIVE ILLUSTRATIONS
   ============================================================ */

/** Soft blurred blobs used as card backgrounds. */
export function blobs(colors = ['var(--acc)', 'var(--blue)']) {
  const id = 'b' + Math.random().toString(36).slice(2, 7);
  return svg('0 0 200 120', { class: 'art-blobs', preserveAspectRatio: 'none' },
    s('defs', {},
      s('radialGradient', { id: id + 'a' },
        s('stop', { offset: '0%', 'stop-color': colors[0], 'stop-opacity': '.55' }),
        s('stop', { offset: '100%', 'stop-color': colors[0], 'stop-opacity': '0' })),
      s('radialGradient', { id: id + 'b' },
        s('stop', { offset: '0%', 'stop-color': colors[1], 'stop-opacity': '.45' }),
        s('stop', { offset: '100%', 'stop-color': colors[1], 'stop-opacity': '0' }))),
    s('circle', { cx: 165, cy: 18, r: 55, fill: `url(#${id}a)` }),
    s('circle', { cx: 30, cy: 105, r: 48, fill: `url(#${id}b)` }),
  );
}

const stroke = (extra = {}) => ({
  fill: 'none', stroke: 'currentColor', 'stroke-width': 2,
  'stroke-linecap': 'round', 'stroke-linejoin': 'round', ...extra,
});

/** Illustration set. Each returns an <svg> that inherits `color`. */
export const ART = {
  dumbbell: dumbbell3d,
  plate: plate3d,
  chart: chart3d,
  flame: flame3d,
  scale: scale3d,
  clipboard: clipboard3d,
  empty: () => svg('0 0 120 80', { class: 'art' },
    s('rect', { x: 30, y: 26, width: 60, height: 40, rx: 8, ...stroke({ 'stroke-dasharray': '5 6', 'stroke-opacity': .55 }) }),
    s('path', { d: 'M45 46h30', ...stroke({ 'stroke-opacity': .4 }) }),
  ),
  target: target3d,
  water: water3d,
  kettlebell: kettlebell3d,
  calendar: calendar3d,
  trophy: trophy3d,
  medal: medal3d,
  barbell: barbell3d,
};

/**
 * Big friendly empty state: illustration, title, hint, and the way out.
 *
 * The way out is the part that was missing. "No measurements yet" tells
 * someone what they already know and leaves them to hunt for the button that
 * fixes it; an empty state that offers the first step is the difference
 * between a screen that looks unfinished and one that looks ready.
 *
 * `action` is { label, onClick } and is simply left off where there is no
 * single obvious first step — an invented one would be worse than none.
 */
export function emptyArt(kind, title, hint = '', color = 'var(--tx3)', action = null) {
  const box = document.createElement('div');
  box.className = 'empty-art';
  box.style.color = color;
  box.append((ART[kind] || ART.empty)());

  const h = document.createElement('b');
  h.textContent = title;
  box.append(h);

  if (hint) {
    const p = document.createElement('span');
    p.textContent = hint;
    box.append(p);
  }
  if (action?.label && typeof action.onClick === 'function') {
    const b = document.createElement('button');
    b.className = 'btn empty-go';
    b.textContent = action.label;
    b.addEventListener('click', action.onClick);
    box.append(b);
  }
  return box;
}

/* ============================================================
   MOVEMENT — a side-view figure that performs a pattern
   ============================================================ */

/* The skeleton, in the figure's own coordinates. Everything hangs off these
   six points, so changing the proportions is changing six numbers. */
/* The frame has room above the head because an arm straight overhead is
   31 units long and a press, a pull-down and an overhead extension all end
   there; with the hip any higher the weight is drawn against the top edge. */
const JOINT = {
  ankle: [50, 102], knee: [50, 84], hip: [50, 64],
  shoulder: [50, 38], elbow: [50, 54], hand: [50, 69], head: [50, 28],
};
const FLOOR = 106;

/* A limb has volume; a line does not. Widths are the figure's own units and
   are turned into tapered capsules with lit tops and shaded undersides, so
   the figure reads as a body at any size rather than as a wireframe. */
const LIMB = { round: 'round', width: 5.2 };

const bone = (from, to, extra = {}) => s('line', {
  x1: from[0], y1: from[1], x2: to[0], y2: to[1],
  'stroke-width': LIMB.width, 'stroke-linecap': LIMB.round, ...extra,
});

/**
 * A tapered capsule from A to B: one filled shape with volume, not a line.
 * `wa`, `wb` are the half-widths at each end (the figure's own units), so an
 * arm is thicker at the shoulder than at the wrist and a torso is an actual
 * torso. Drawn as a closed polygon — quadratic joins at the caps keep the
 * rounded ends — then lit from above with a highlight stroke down its spine.
 */
function capsule(a, b, wa, wb, cls) {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len, uy = dy / len;          // along the limb
  const nx = -uy, ny = ux;                     // across it
  /* arcs at both caps, run clockwise from the outer edge */
  const capA = `A${wa} ${wa} 0 0 1 ${(a[0] - nx * wa).toFixed(2)} ${(a[1] - ny * wa).toFixed(2)}`;
  const capB = `A${wb} ${wb} 0 0 1 ${(b[0] + nx * wb).toFixed(2)} ${(b[1] + ny * wb).toFixed(2)}`;
  const d = [
    `M${(a[0] + nx * wa).toFixed(2)} ${(a[1] + ny * wa).toFixed(2)}`,
    `L${(b[0] + nx * wb).toFixed(2)} ${(b[1] + ny * wb).toFixed(2)}`,
    capB,
    `L${(a[0] - nx * wa).toFixed(2)} ${(a[1] - ny * wa).toFixed(2)}`,
    capA, 'Z',
  ].join(' ');
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  /* the spine highlight is a short arc offset toward the light; it is what
     turns a flat shape into a rounded one */
  const spine = `M${(mid[0] + nx * wa * .3).toFixed(2)} ${(mid[1] + ny * wa * .3).toFixed(2)}` +
    ` L${(mid[0] - ux * len * .16 + nx * wa * .3).toFixed(2)} ${(mid[1] - uy * len * .16 + ny * wa * .3).toFixed(2)}`;
  return s('g', { class: 'mv-seg' },
    s('path', { d, class: cls, 'stroke-width': 0 }),
    s('path', { d: spine, class: 'mv-spine', 'stroke-width': wa * .32,
      'stroke-linecap': 'round' }),
  );
}

/** A ball joint — shoulder, hip, or the round of a knee. */
const jointBall = (p, r) => s('g', { class: 'mv-seg' },
  s('circle', { cx: p[0], cy: p[1], r, class: 'mv-ball' }),
  s('circle', { cx: p[0] - r * .28, cy: p[1] - r * .3, r: r * .3, class: 'mv-glint' }),
);

/**
 * SUPERSEDED — nothing in the app calls this any more; only diag.html does.
 *
 * It draws every movement standing up, because a side view in two
 * dimensions has nowhere to put a bench. Once the movement table learned
 * which surface each pattern is performed on, the 3D body in body3d.js
 * became the only one of the two that can draw a bench press without
 * lying about it, and both screens that used this one moved over.
 *
 * Kept for now rather than deleted in the same change that replaced it.
 * Do not reach for it: it will draw a push-up standing.
 *
 * A figure performing one movement, animated between its two ends.
 *
 * Returns the svg and a `stop()`, because an animation left running behind a
 * closed sheet is a battery leak nobody sees. It honours the motion switch
 * and reduced motion by simply standing in the mid-pose: the drawing still
 * says what the movement looks like, it just does not move.
 */
export function moveFigure(moveId, {
  size = 150, ms = 2600, still = false, accent = 'var(--acc)',
} = {}) {
  const move = MOVES[moveId];
  if (!move) return { node: null, stop: () => {} };

  /* Built inside out: each group turns about its own joint, in the
     coordinates it had before its parent turned it. */
  const foot = s('g', { class: 'mv-heel' },
    capsule(JOINT.ankle, [JOINT.ankle[0] + 9, JOINT.ankle[1]], 1.5, 1.9, 'mv-leg'));
  const shin = s('g', { class: 'mv-shin' },
    jointBall(JOINT.knee, 2.3),
    capsule(JOINT.knee, JOINT.ankle, 2.5, 1.7, 'mv-leg'), foot);
  const leg = s('g', { class: 'mv-thigh' },
    jointBall(JOINT.hip, 2.9),
    capsule(JOINT.hip, JOINT.knee, 3.4, 2.5, 'mv-leg'), shin);

  /* The load sits in the hand; when the movement holds a bar, it is a real
     bar — a sleeve with two plates of its own, each shaded like the plates
     in the calculator. */
  const load = MOVES[moveId]?.bar
    ? s('g', { class: 'mv-bar' },
        s('rect', { x: JOINT.hand[0] - 11.5, y: JOINT.hand[1] - 1.6, width: 23, height: 3.2,
          rx: 1.6, class: 'mv-steel' }),
        s('rect', { x: JOINT.hand[0] - 9.5, y: JOINT.hand[1] - 5.2, width: 3.4, height: 10.4,
          rx: 1.5, class: 'mv-plate' }),
        s('rect', { x: JOINT.hand[0] + 6.1, y: JOINT.hand[1] - 5.2, width: 3.4, height: 10.4,
          rx: 1.5, class: 'mv-plate' }))
    : s('circle', { cx: JOINT.hand[0], cy: JOINT.hand[1], r: 4.6,
        class: 'mv-load' });
  const fore = s('g', { class: 'mv-fore' },
    jointBall(JOINT.elbow, 2.0),
    capsule(JOINT.elbow, JOINT.hand, 2.2, 1.6, 'mv-limb'), load);
  const arm = s('g', { class: 'mv-arm' },
    jointBall(JOINT.shoulder, 2.7),
    capsule(JOINT.shoulder, JOINT.elbow, 2.7, 2.2, 'mv-limb'), fore);
  const trunk = s('g', { class: 'mv-torso' },
    capsule(JOINT.hip, JOINT.shoulder, 4.7, 4.2, 'mv-trunk'),
    s('circle', { cx: JOINT.head[0], cy: JOINT.head[1], r: 7.4, class: 'mv-head' }),
    s('circle', { cx: JOINT.head[0] - 2.2, cy: JOINT.head[1] - 2.4, r: 1.9, class: 'mv-glint' }),
    arm);

  /* The floor the figure stands on: a soft shadow, drawn first so everything
     sits on top of it. */
  const groundLayer = s('ellipse', { cx: 50, cy: FLOOR + 2.2, rx: 25, ry: 3.4, class: 'mv-shadow' });
  const body = s('g', { class: 'mv-body' }, groundLayer, leg, trunk);
  const node = svg('0 0 100 116', { class: 'mv', width: size, height: size * 1.16 },
    s('line', { x1: 14, y1: FLOOR, x2: 86, y2: FLOOR, class: 'mv-floor',
      'stroke-width': 2, 'stroke-linecap': 'round' }),
    body);

  const parts = [
    ['.mv-torso', 'torso', JOINT.hip],
    ['.mv-arm', 'arm', JOINT.shoulder],
    ['.mv-fore', 'fore', JOINT.elbow],
    ['.mv-thigh', 'thigh', JOINT.hip],
    ['.mv-shin', 'shin', JOINT.knee],
    ['.mv-heel', 'heel', JOINT.ankle],
  ];
  /* Every joint is a CSS transform about its own point, moving or not, so
     there is one way a pose is expressed rather than two that fight. */
  for (const [sel, , pivot] of parts) {
    const g = node.querySelector(sel);
    g.style.transformOrigin = `${pivot[0]}px ${pivot[1]}px`;
    g.style.transformBox = 'view-box';
  }

  const a = poseOf(moveId, 'a');
  const b = poseOf(moveId, 'b');
  /* A squat's hips come down. With them pinned the knee swings forward until
     the foot leaves the floor, so a pose may lower the whole body. */
  const hold = (pose) => {
    const r = rotations(pose);
    for (const [sel, joint] of parts) {
      node.querySelector(sel).style.transform = `rotate(${r[joint]}deg)`;
    }
    body.style.transform = `translateY(${pose.dy || 0}px)`;
  };

  /* Motion off, reduced motion, or a movement that is a hold: stand in the
     middle of it. The drawing still says what the shape is. */
  if (still || move.still || !node.animate) {
    const mid = {};
    for (const k of Object.keys(a)) mid[k] = (a[k] + b[k]) / 2;
    hold(move.still ? a : mid);
    return { node, stop: () => {} };
  }

  hold(a);
  body.style.transformBox = 'view-box';
  const ra = rotations(a), rb = rotations(b);
  const runs = [];
  if ((a.dy || 0) !== (b.dy || 0)) {
    runs.push(body.animate([
      { transform: `translateY(${a.dy || 0}px)` },
      { transform: `translateY(${b.dy || 0}px)` },
    ], { duration: ms, direction: 'alternate', iterations: Infinity,
         easing: 'cubic-bezier(.45,0,.55,1)' }));
  }
  for (const [sel, joint] of parts) {
    if (ra[joint] === rb[joint]) continue;
    runs.push(node.querySelector(sel).animate([
      { transform: `rotate(${ra[joint]}deg)` },
      { transform: `rotate(${rb[joint]}deg)` },
    ], {
      duration: ms, direction: 'alternate', iterations: Infinity,
      easing: 'cubic-bezier(.45,0,.55,1)',    /* a lift slows at both ends */
    }));
  }

  /* An animation left running behind a closed sheet is a battery leak nobody
     sees, so the caller is handed the way to stop it. */
  return { node, stop: () => runs.forEach((r) => r.cancel()) };
}
