/* ============ FitYar — shaded objects ============

   The flat outlines elsewhere in the app are the right language for icons:
   at 20px, shading is invisible. These are the drawings that get to be
   bigger than that — empty states, the loaded bar, the water glass — and at
   that size a flat outline reads as a placeholder.

   Every object here is one of two tricks, repeated:
   · a CYLINDER is a shape filled with the colour it is given, with the same
     shape drawn over it in a gradient that goes white → nothing → black
     down its length;
   · a SPHERE is a shape with the same shape drawn over it in a radial
     gradient that puts the light at the top-left and the dark at the bottom.

   Both overlays are white/black over `currentColor`, so every object keeps
   taking its colour from wherever it is placed — the one property that lets
   a drawing serve the teal card and the orange one alike. No library, no
   WebGL, no external request: the same constraint as the rest of art.js. */

const NS = 'http://www.w3.org/2000/svg';

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

/* Unique-per-instance gradient ids: several drawings can sit on one page,
   and duplicated ids silently point the later ones at the first's defs. */
let uid = 0;
const nextId = () => 'a3' + (++uid).toString(36);

/* Every painter below stamps this class on its root, so CSS sizes the
   drawing in one place instead of trusting each caller to remember. */
const CLS = 'art3d';
const finish = (root) => { root.classList.add(CLS); return root; };

/**
 * The two gradients every drawing here shares, plus a colour-fade gradient
 * for areas that carry the accent itself (chart fills, flames).
 * `v`  — vertical sheen: lit at the top, shaded at the bottom
 * `r`  — radial: light top-left, shade bottom-right
 * `ag` — the current colour fading downward (for fills, not for shading)
 */
function defs3d() {
  const v = nextId(), r = nextId(), ag = nextId();
  const node = s('defs', {},
    s('linearGradient', { id: v, x1: 0, y1: 0, x2: 0, y2: 1 },
      s('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.5' }),
      s('stop', { offset: '30%', 'stop-color': '#fff', 'stop-opacity': '.1' }),
      s('stop', { offset: '55%', 'stop-color': '#000', 'stop-opacity': '0' }),
      s('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': '.4' })),
    s('radialGradient', { id: r, cx: '34%', cy: '28%', r: '80%' },
      s('stop', { offset: '0%', 'stop-color': '#fff', 'stop-opacity': '.65' }),
      s('stop', { offset: '42%', 'stop-color': '#fff', 'stop-opacity': '.07' }),
      s('stop', { offset: '100%', 'stop-color': '#000', 'stop-opacity': '.45' })),
    s('linearGradient', { id: ag, x1: 0, y1: 0, x2: 0, y2: 1 },
      s('stop', { offset: '0%', 'stop-color': 'currentColor', 'stop-opacity': '.85' }),
      s('stop', { offset: '100%', 'stop-color': 'currentColor', 'stop-opacity': '.08' })),
  );
  return { node, v, r, ag };
}

/** Build an svg with the shared gradients installed, then hand it over. */
export function stage3d(viewBox, draw) {
  const d = defs3d();
  const root = svg(viewBox, {}, d.node);
  draw(root, d);
  return finish(root);
}

/* the two overlay fills, for shapes drawn inside stage3d */
export const sheenV = (d) => ({ fill: `url(#${d.v})`, stroke: 'none' });
export const shadeR = (d, opacity = .9) => ({ fill: `url(#${d.r})`, stroke: 'none', opacity });

/** a soft ellipse of floor shadow under whatever stands above it */
export const groundShadow = (cx, cy, rx, ry = rx / 6.5, opacity = .28) =>
  s('ellipse', { cx, cy, rx, ry, fill: '#000', opacity, stroke: 'none' });

/** a specular arc — the bright line a curved surface catches, top-left */
export function specular(cx, cy, r, { from = -155, to = -35, width = 2.4, opacity = .55 } = {}) {
  const rad = (a) => (a * Math.PI) / 180;
  const x1 = cx + r * Math.cos(rad(from)), y1 = cy + r * Math.sin(rad(from));
  const x2 = cx + r * Math.cos(rad(to)), y2 = cy + r * Math.sin(rad(to));
  return s('path', {
    d: `M${x1.toFixed(1)} ${y1.toFixed(1)} A${r} ${r} 0 0 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`,
    stroke: '#fff', 'stroke-opacity': opacity, 'stroke-width': width,
    'stroke-linecap': 'round', fill: 'none',
  });
}

/* ============================================================
   THE OBJECTS
   ============================================================ */

/** A dumbbell standing on the floor, bar toward the viewer, plates aside. */
export function dumbbell3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 70.5, 38, 5));
    const plate = (x, w, y, h) => {
      root.append(s('rect', { x, y, width: w, height: h, rx: w / 2.6, fill: 'currentColor' }));
      root.append(s('rect', { x, y, width: w, height: h, rx: w / 2.6, ...sheenV(d) }));
      root.append(s('rect', { x, y, width: w, height: h, rx: w / 2.6,
        stroke: '#000', 'stroke-opacity': '.22', 'stroke-width': 1, fill: 'none' }));
      root.append(s('ellipse', { cx: x + w * 0.3, cy: y + h * 0.2, rx: w * 0.16, ry: h * 0.1,
        fill: '#fff', opacity: .5, stroke: 'none' }));
    };
    /* small outer plates, big inner ones — how a dumbbell is actually stacked */
    plate(13, 9.5, 27, 26);
    plate(26, 14, 21.5, 37);
    plate(80, 14, 21.5, 37);
    plate(97.5, 9.5, 27, 26);
    /* bar between them, with a knurled grip */
    root.append(s('rect', { x: 39, y: 36.5, width: 42, height: 7, rx: 3.5, fill: 'currentColor' }));
    root.append(s('rect', { x: 39, y: 36.5, width: 42, height: 7, rx: 3.5, ...sheenV(d) }));
    for (const x of [54, 60, 66]) {
      root.append(s('line', { x1: x, y1: 37.6, x2: x, y2: 42.4,
        stroke: '#000', 'stroke-opacity': '.2', 'stroke-width': 1.1 }));
    }
    /* collars */
    for (const x of [35.5, 81.5]) {
      root.append(s('rect', { x, y: 34, width: 4.5, height: 12, rx: 2.2, fill: 'currentColor' }));
      root.append(s('rect', { x, y: 34, width: 4.5, height: 12, rx: 2.2, ...sheenV(d) }));
    }
  });
}

/** A bumper plate, tilted toward the viewer so the hub reads as a hole. */
export function plate3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 72, 34, 4.5));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 31, ry: 28, fill: 'currentColor' }));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 31, ry: 28, ...shadeR(d) }));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 31, ry: 28,
      stroke: '#000', 'stroke-opacity': '.25', 'stroke-width': 1.2, fill: 'none' }));
    /* the face drops in from the rim */
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 21, ry: 18.5, fill: '#000', opacity: .14, stroke: 'none' }));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 21, ry: 18.5,
      stroke: '#000', 'stroke-opacity': '.22', 'stroke-width': 1, fill: 'none' }));
    /* hub */
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 7, ry: 6, fill: 'currentColor' }));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 7, ry: 6, ...shadeR(d) }));
    root.append(s('ellipse', { cx: 60, cy: 40, rx: 3.1, ry: 2.6, fill: '#000', opacity: .5, stroke: 'none' }));
    root.append(specular(60, 40, 26.5, { width: 2.6 }));
  });
}

/** A line climbing, with the area under it carrying the colour. */
export function chart3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(s('path', { d: 'M18 64h84', stroke: 'currentColor', 'stroke-opacity': .4,
      'stroke-width': 1.6, 'stroke-linecap': 'round' }));
    root.append(s('path', { d: 'M18 64V16', stroke: 'currentColor', 'stroke-opacity': .4,
      'stroke-width': 1.6, 'stroke-linecap': 'round' }));
    const area = 'M24 50l18-15 15 10 22-25 17 13 L96 64 L24 64 Z';
    root.append(s('path', { d: area, fill: `url(#${d.ag})`, stroke: 'none' }));
    root.append(s('path', { d: 'M24 50l18-15 15 10 22-25 17 13', stroke: 'currentColor',
      'stroke-width': 3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }));
    /* the last reading: a ring with a lit centre, like the live charts */
    root.append(s('circle', { cx: 96, cy: 33, r: 6.5, fill: 'currentColor', opacity: .25, stroke: 'none' }));
    root.append(s('circle', { cx: 96, cy: 33, r: 3.4, fill: 'currentColor', stroke: 'none' }));
    root.append(s('circle', { cx: 94.9, cy: 31.9, r: 1.2, fill: '#fff', opacity: .85, stroke: 'none' }));
    root.append(s('circle', { cx: 42, cy: 35, r: 2.6, fill: 'currentColor', stroke: 'none' }));
    root.append(s('circle', { cx: 79, cy: 20, r: 2.6, fill: 'currentColor', stroke: 'none' }));
  });
}

/** A flame with its own light inside. */
export function flame3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 68, 22, 3.5, .22));
    const outer = 'M60 12c11 13 17 21 17 31a17 17 0 0 1-34 0c0-6 3-11 6.5-15 1 5.5 4 7.5 6 7.5 3 0 4.5-3 4.5-8.5 0-5.5-2-9.5 0-15z';
    root.append(s('path', { d: outer, fill: 'currentColor', stroke: 'none' }));
    root.append(s('path', { d: outer, ...shadeR(d) }));
    root.append(s('path', { d: 'M56 44c0-6 4-10 6-13 2 3 6 7 6 13a6 6 0 0 1-12 0z',
      fill: `url(#${d.ag})`, stroke: 'none' }));
    root.append(s('path', { d: 'M52 30c-2.5 4-4 8-4 12', stroke: '#fff', 'stroke-opacity': .5,
      'stroke-width': 2.2, 'stroke-linecap': 'round', fill: 'none' }));
  });
}

/** The bathroom scale, face up, glass over the dial. */
export function scale3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 70, 34, 4.5));
    root.append(s('rect', { x: 32, y: 20, width: 56, height: 46, rx: 10, fill: 'currentColor' }));
    root.append(s('rect', { x: 32, y: 20, width: 56, height: 46, rx: 10, ...sheenV(d) }));
    root.append(s('rect', { x: 32, y: 20, width: 56, height: 46, rx: 10,
      stroke: '#000', 'stroke-opacity': '.22', 'stroke-width': 1.1, fill: 'none' }));
    /* the dial under glass */
    root.append(s('circle', { cx: 60, cy: 43, r: 14.5, fill: '#000', opacity: .22, stroke: 'none' }));
    root.append(s('circle', { cx: 60, cy: 43, r: 12.5, fill: `url(#${d.r})` }));
    root.append(s('path', { d: 'M60 35.5v7.5l5 4', stroke: '#fff', 'stroke-opacity': .85,
      'stroke-width': 2.3, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }));
    root.append(s('circle', { cx: 60, cy: 43, r: 1.7, fill: '#fff', opacity: .9, stroke: 'none' }));
    root.append(specular(60, 43, 16.5, { width: 1.8, opacity: .35 }));
  });
}

/** A clipboard standing at a slight angle, paper catching light. */
export function clipboard3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 71, 28, 4));
    root.append(s('rect', { x: 40, y: 14, width: 40, height: 54, rx: 7, fill: 'currentColor' }));
    root.append(s('rect', { x: 40, y: 14, width: 40, height: 54, rx: 7, ...sheenV(d) }));
    root.append(s('rect', { x: 40, y: 14, width: 40, height: 54, rx: 7,
      stroke: '#000', 'stroke-opacity': '.22', 'stroke-width': 1.1, fill: 'none' }));
    /* the sheet */
    root.append(s('rect', { x: 45.5, y: 24, width: 29, height: 38, rx: 3,
      fill: '#fff', opacity: .16, stroke: 'none' }));
    for (const y of [32, 40, 48, 55]) {
      root.append(s('line', { x1: 50, y1: y, x2: y === 55 ? 62 : 69, y2: y,
        stroke: '#fff', 'stroke-opacity': .4, 'stroke-width': 1.8, 'stroke-linecap': 'round' }));
    }
    /* the clip */
    root.append(s('rect', { x: 51, y: 9, width: 18, height: 11, rx: 4, fill: 'currentColor' }));
    root.append(s('rect', { x: 51, y: 9, width: 18, height: 11, rx: 4, ...sheenV(d) }));
    root.append(s('rect', { x: 51, y: 9, width: 18, height: 11, rx: 4,
      stroke: '#000', 'stroke-opacity': '.25', 'stroke-width': 1, fill: 'none' }));
  });
}

/** The target, rings sunk into one another, arrow home. */
export function target3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(58, 71, 30, 4));
    const ring = (r, opacity) => {
      root.append(s('circle', { cx: 58, cy: 40, r, fill: 'currentColor', opacity, stroke: 'none' }));
      root.append(s('circle', { cx: 58, cy: 40, r, ...shadeR(d, .75) }));
      root.append(s('circle', { cx: 58, cy: 40, r, stroke: '#000', 'stroke-opacity': '.18',
        'stroke-width': 1, fill: 'none' }));
    };
    ring(27, .38);
    ring(17, .7);
    root.append(s('circle', { cx: 58, cy: 40, r: 6.5, fill: 'currentColor', stroke: 'none' }));
    root.append(s('circle', { cx: 58, cy: 40, r: 6.5, ...shadeR(d) }));
    root.append(specular(58, 40, 22, { width: 2.2, opacity: .4 }));
    /* the arrow, arriving high-right */
    root.append(s('path', { d: 'M76 22l16-12-4.5 13 13-4.5-13.5 13.5', stroke: 'currentColor',
      'stroke-width': 2.4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', fill: 'none' }));
  });
}

/** A drop of water, glossy, lit from the top-left. */
export function water3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 69, 18, 3, .2));
    const drop = 'M60 12c11 15 19 24 19 34a19 19 0 0 1-38 0c0-10 8-19 19-34z';
    root.append(s('path', { d: drop, fill: 'currentColor', stroke: 'none' }));
    root.append(s('path', { d: drop, ...shadeR(d) }));
    root.append(s('ellipse', { cx: 52, cy: 46, rx: 4.5, ry: 7, fill: '#fff', opacity: .45,
      stroke: 'none', transform: 'rotate(-18 52 46)' }));
  });
}

/** A kettlebell — what "workout" looks like when it is an object, not a list. */
export function kettlebell3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 71, 26, 4));
    /* handle */
    root.append(s('path', { d: 'M46 34c-2-12 5-19 14-19s16 7 14 19', stroke: 'currentColor',
      'stroke-width': 6.5, 'stroke-linecap': 'round', fill: 'none' }));
    root.append(s('path', { d: 'M46 34c-2-12 5-19 14-19s16 7 14 19', stroke: `url(#${d.v})`,
      'stroke-width': 2.4, 'stroke-linecap': 'round', fill: 'none', opacity: .8 }));
    /* body */
    root.append(s('circle', { cx: 60, cy: 48, r: 21, fill: 'currentColor', stroke: 'none' }));
    root.append(s('circle', { cx: 60, cy: 48, r: 21, ...shadeR(d) }));
    root.append(s('circle', { cx: 60, cy: 48, r: 21, stroke: '#000', 'stroke-opacity': '.22',
      'stroke-width': 1.1, fill: 'none' }));
    root.append(specular(60, 48, 16.5, { width: 2.2, opacity: .45 }));
  });
}

/** A page of days, corner lifted. */
export function calendar3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 71, 28, 4));
    root.append(s('rect', { x: 32, y: 18, width: 56, height: 50, rx: 8, fill: 'currentColor' }));
    root.append(s('rect', { x: 32, y: 18, width: 56, height: 50, rx: 8, ...sheenV(d) }));
    root.append(s('rect', { x: 32, y: 18, width: 56, height: 50, rx: 8,
      stroke: '#000', 'stroke-opacity': '.22', 'stroke-width': 1.1, fill: 'none' }));
    /* the header bar and the ring binding */
    root.append(s('path', { d: 'M32 32h56', stroke: '#000', 'stroke-opacity': '.18', 'stroke-width': 1.2 }));
    for (const x of [46, 60, 74]) {
      root.append(s('line', { x1: x, y1: 13, x2: x, y2: 23, stroke: 'currentColor',
        'stroke-width': 3, 'stroke-linecap': 'round' }));
    }
    /* day dots: two kept, one today */
    for (const [x, y, on] of [[44, 42, 1], [56, 42, 1], [68, 42, 0], [80, 42, 0],
                              [44, 52, 0], [56, 52, 0], [68, 52, 1]]) {
      root.append(s('circle', { cx: x, cy: y, r: on ? 3.4 : 2.2,
        fill: on ? '#fff' : 'currentColor', opacity: on ? .85 : .3, stroke: 'none' }));
    }
  });
}

/* ============================================================
   SMALL OBJECTS FOR THE INTERFACE ITSELF
   ============================================================ */

/**
 * The water glass behind each cup slot on the home screen.
 * `fill` 0..1 — how full it is drawn.
 */
let glassUid = 0;
export function glassIco(fill = 1) {
  return stage3d('0 0 24 30', (root, d) => {
    const uid = 'gw' + (++glassUid);
    const defs = s('defs', {});
    /* water: lighter at the surface, deeper at the base — depth, not a flat tile.
       The deep stop tracks currentColor so every theme keeps its own blue. */
    defs.append(s('linearGradient', {
      id: uid, x1: 0, y1: 0, x2: 0, y2: 1,
    },
      s('stop', { offset: '0', 'stop-color': 'currentColor', 'stop-opacity': .78 }),
      s('stop', { offset: '.55', 'stop-color': 'currentColor', 'stop-opacity': .95 }),
      s('stop', { offset: '1', 'stop-color': 'currentColor', 'stop-opacity': 1 })));
    root.append(defs);

    if (fill > 0.02) {
      /* the glass tapers: half-width 6.5 at the rim, ~3.5 at the base */
      const ys = 26.6 - Math.max(0, Math.min(1, fill)) * 21;
      const hwTop = 3.5 + ((ys - 3.5) / 23.1) * 3.0;
      root.append(s('path', {
        d: `M${(12 - hwTop).toFixed(2)} ${ys.toFixed(2)} L8.5 26.2 Q12 27.7 15.5 26.2 L${(12 + hwTop).toFixed(2)} ${ys.toFixed(2)} Z`,
        fill: `url(#${uid})`, stroke: 'none' }));
      /* the surface: a lit ellipse with a soft meniscus against the glass */
      root.append(s('ellipse', { cx: 12, cy: ys.toFixed(2), rx: hwTop.toFixed(2), ry: 1.3,
        fill: '#fff', opacity: .42, stroke: 'none' }));
      root.append(s('path', {
        d: `M${(12 - hwTop).toFixed(2)} ${ys.toFixed(2)} Q12 ${(ys + 1.5).toFixed(2)} ${(12 + hwTop).toFixed(2)} ${ys.toFixed(2)}`,
        stroke: '#fff', 'stroke-opacity': .3, 'stroke-width': .7, fill: 'none' }));
    }
    /* the bowl — slightly translucent so the water reads as *inside* glass */
    root.append(s('path', { d: 'M5.5 3.5 L8 26.2 Q8.3 27.8 12 27.8 Q15.7 27.8 16 26.2 L18.5 3.5',
      stroke: 'currentColor', 'stroke-opacity': .8, 'stroke-width': 1.6, 'stroke-linecap': 'round', fill: 'none' }));
    /* the rim as an ellipse — this is what says "opening" */
    root.append(s('ellipse', { cx: 12, cy: 3.5, rx: 6.5, ry: 1.7,
      stroke: 'currentColor', 'stroke-opacity': .5, 'stroke-width': 1.3, fill: 'none' }));
    /* a reflection that lives on the glass, whether full or empty */
    root.append(s('line', { x1: 8.9, y1: 7, x2: 9.5, y2: 23.5,
      stroke: '#fff', 'stroke-opacity': fill > 0.02 ? .45 : .25, 'stroke-width': 1.2, 'stroke-linecap': 'round' }));
  });
}

/**
 * The trophy: a cup that earned its shine, on a stem and a base.
 */
export function trophy3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 72, 26, 4));
    /* base */
    root.append(s('rect', { x: 48, y: 63, width: 24, height: 6, rx: 2, fill: 'currentColor' }));
    root.append(s('rect', { x: 48, y: 63, width: 24, height: 6, rx: 2, ...sheenV(d) }));
    root.append(s('rect', { x: 55, y: 54, width: 10, height: 10, fill: 'currentColor' }));
    root.append(s('rect', { x: 55, y: 54, width: 10, height: 10, ...sheenV(d) }));
    /* the cup */
    const cup = 'M42 18h36v12c0 10-8 18-18 18s-18-8-18-18V18z';
    root.append(s('path', { d: cup, fill: 'currentColor', stroke: 'none' }));
    root.append(s('path', { d: cup, ...shadeR(d) }));
    root.append(s('path', { d: cup, stroke: '#000', 'stroke-opacity': '.2', 'stroke-width': 1, fill: 'none' }));
    /* handles */
    for (const [sx, flip] of [[39.5, 1], [80.5, -1]]) {
      root.append(s('path', { d: `M${sx} 21c-7 ${flip === 1 ? '-1' : '-1'} -9 12 -1 15`,
        stroke: 'currentColor', 'stroke-width': 4, fill: 'none', 'stroke-linecap': 'round' }));
    }
    /* the shine down the cup's left face */
    root.append(s('path', { d: 'M48 22v7c0 4 1.5 7.5 4 10', stroke: '#fff', 'stroke-opacity': .65,
      'stroke-width': 2.6, 'stroke-linecap': 'round', fill: 'none' }));
  });
}

/**
 * The medal: a disc in the accent, star-embossed, hanging from its ribbon.
 */
export function medal3d() {
  return stage3d('0 0 120 80', (root, d) => {
    root.append(groundShadow(60, 74, 22, 3.5, .2));
    /* ribbon: two bands in a V */
    root.append(s('path', { d: 'M46 8l14 26 14-26-9-4-5 9-5-9z', fill: 'currentColor', opacity: .8, stroke: 'none' }));
    root.append(s('path', { d: 'M46 8l14 26 14-26', stroke: '#000', 'stroke-opacity': .18, 'stroke-width': 1, fill: 'none' }));
    /* the disc */
    root.append(s('circle', { cx: 60, cy: 51, r: 19, fill: 'currentColor', stroke: 'none' }));
    root.append(s('circle', { cx: 60, cy: 51, r: 19, ...shadeR(d) }));
    root.append(s('circle', { cx: 60, cy: 51, r: 19, stroke: '#000', 'stroke-opacity': '.25', 'stroke-width': 1.1, fill: 'none' }));
    root.append(s('circle', { cx: 60, cy: 51, r: 13.5, fill: '#000', opacity: .12, stroke: 'none' }));
    /* an embossed star: cut dark, lit on one side */
    const star = (cx, cy, r) => {
      const pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i * Math.PI) / 5;
        const rr = i % 2 ? r * .45 : r;
        pts.push(`${(cx + Math.cos(a) * rr).toFixed(2)} ${(cy + Math.sin(a) * rr).toFixed(2)}`);
      }
      return 'M' + pts.join('L') + 'Z';
    };
    root.append(s('path', { d: star(60, 51, 8.5), fill: '#fff', opacity: .5, stroke: 'none' }));
    root.append(specular(60, 51, 15.5, { width: 2.2, opacity: .5 }));
  });
}

/**
 * The loaded barbell, side view, at a slight perspective — the object this
 * whole app orbits. Used by the personal-record celebration: it is the thing
 * that just moved.
 */
export function barbell3d() {
  return stage3d('0 0 150 70', (root, d) => {
    root.append(groundShadow(75, 64, 52, 4.5));
    const plate = (cx, w, h) => {
      root.append(s('ellipse', { cx, cy: 38, rx: w / 2, ry: h / 2, fill: 'currentColor', stroke: 'none' }));
      root.append(s('ellipse', { cx, cy: 38, rx: w / 2, ry: h / 2, ...sheenV(d) }));
      root.append(s('ellipse', { cx, cy: 38, rx: w / 2, ry: h / 2, stroke: '#000', 'stroke-opacity': '.3', 'stroke-width': 1, fill: 'none' }));
      root.append(s('ellipse', { cx, cy: 38, rx: w * .17, ry: h * .17, fill: '#000', opacity: .3, stroke: 'none' }));
      root.append(s('ellipse', { cx: cx - w * .12, cy: 38 - h * .18, rx: w * .09, ry: h * .07, fill: '#fff', opacity: .4, stroke: 'none' }));
    };
    /* the bar between the plates */
    root.append(s('rect', { x: 30, y: 35.4, width: 90, height: 5.2, rx: 2.6, fill: '#b9c2ce' }));
    root.append(s('rect', { x: 30, y: 35.4, width: 90, height: 5.2, rx: 2.6, fill: `url(#${d.v})` }));
    root.append(s('rect', { x: 30, y: 35.4, width: 90, height: 5.2, rx: 2.6, stroke: '#000', 'stroke-opacity': '.3', 'stroke-width': .8, fill: 'none' }));
    /* plates, big in, small out — and the near pair overlapping the bar end */
    plate(21, 9, 26); plate(31, 13, 40);
    plate(119, 13, 40); plate(129, 9, 26);
  });
}

/**
 * The logo mark: a small dumbbell seen at a slight angle, the same steel as
 * the bar in the calculator. Sits in the top bar; the gradient ids are per-
 * instance so it can appear there and nowhere else without a collision.
 */
export function dumbbellMark() {
  return stage3d('0 0 26 26', (root, d) => {
    const plate = (x, w, y, h) => {
      root.append(s('rect', { x, y, width: w, height: h, rx: w / 2.4, fill: 'currentColor' }));
      root.append(s('rect', { x, y, width: w, height: h, rx: w / 2.4, ...sheenV(d) }));
    };
    plate(2.2, 3.4, 8.6, 8.8);
    plate(6.8, 4.6, 6.4, 13.2);
    plate(14.6, 4.6, 6.4, 13.2);
    plate(20.4, 3.4, 8.6, 8.8);
    root.append(s('rect', { x: 11.2, y: 10.9, width: 3.6, height: 4.2, rx: 1.8, fill: 'currentColor' }));
    root.append(s('rect', { x: 11.2, y: 10.9, width: 3.6, height: 4.2, rx: 1.8, ...sheenV(d) }));
  });
}

/**
 * The loaded bar seen end-on: rings of steel receding to the hub.
 * `items` = [{ w, color }] in any order; heaviest drawn first (largest ring).
 */
export function endBarbell(items) {
  return stage3d('0 0 130 130', (root, d) => {
    const max = Math.max(1, ...items.map(i => i.w));
    const sorted = [...items].sort((a, b) => b.w - a.w);
    for (const { w, color } of sorted) {
      const r = 15 + (Math.max(0, Math.min(1, w / max)) * 40);
      root.append(s('circle', { cx: 65, cy: 65, r, fill: color, stroke: '#000',
        'stroke-opacity': .38, 'stroke-width': 1.2 }));
      root.append(s('circle', { cx: 65, cy: 65, r, ...shadeR(d, .85) }));
    }
    /* bar sleeve in the hole, then the collar facing you */
    root.append(s('circle', { cx: 65, cy: 65, r: 7, fill: '#11161c', stroke: '#000',
      'stroke-opacity': .5, 'stroke-width': 1 }));
    root.append(s('circle', { cx: 65, cy: 65, r: 4.4, fill: '#a9b3c1', stroke: 'none' }));
    root.append(s('circle', { cx: 65, cy: 65, r: 4.4, ...shadeR(d) }));
    root.append(s('circle', { cx: 65, cy: 65, r: 1.5, fill: '#2c343f', stroke: 'none' }));
    if (sorted.length) {
      const rOut = 15 + (Math.max(0, Math.min(1, sorted[0].w / max)) * 40);
      root.append(specular(65, 65, rOut - 2.5, { width: 2.6, opacity: .5 }));
    }
  });
}
