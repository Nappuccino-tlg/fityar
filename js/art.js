/* ============ Inline SVG artwork — no external requests, theme-aware ============ */

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

/**
 * Interactive body map.
 * @param {object} opts
 *   selected  Set|Array of muscle ids to highlight
 *   focus     one id drawn in the strong accent
 *   onPick    (muscleId) => void — makes regions tappable
 *   view      'both' | 'front' | 'back'
 */
export function bodyMap({ selected = [], focus = null, onPick = null, view = 'both' } = {}) {
  const sel = new Set(selected);
  const wrap = document.createElement('div');
  wrap.className = 'bodymap' + (onPick ? ' tappable' : '');

  const build = (map, label) => {
    const el = svg('0 0 120 215', { class: 'bm-svg' }, silhouette());
    for (const [muscle, shapes] of Object.entries(map)) {
      const g = s('g', {
        class: 'bm-m' + (sel.has(muscle) ? ' on' : '') + (focus === muscle ? ' focus' : ''),
        'data-m': muscle,
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
  dumbbell: () => svg('0 0 120 80', { class: 'art' },
    s('rect', { x: 52, y: 35, width: 16, height: 10, rx: 3, ...stroke() }),
    s('rect', { x: 34, y: 26, width: 14, height: 28, rx: 5, ...stroke() }),
    s('rect', { x: 72, y: 26, width: 14, height: 28, rx: 5, ...stroke() }),
    s('rect', { x: 20, y: 32, width: 10, height: 16, rx: 4, ...stroke() }),
    s('rect', { x: 90, y: 32, width: 10, height: 16, rx: 4, ...stroke() }),
  ),

  plate: () => svg('0 0 120 80', { class: 'art' },
    s('circle', { cx: 60, cy: 40, r: 28, ...stroke() }),
    s('circle', { cx: 60, cy: 40, r: 19, ...stroke({ 'stroke-dasharray': '3 5', 'stroke-opacity': .6 }) }),
    s('path', { d: 'M22 24v14a5 5 0 0 0 5 5M27 24v19M17 24v14a5 5 0 0 0 5 5', ...stroke({ 'stroke-width': 1.8 }) }),
    s('path', { d: 'M98 24c4 4 4 12 0 16v16', ...stroke({ 'stroke-width': 1.8 }) }),
  ),

  chart: () => svg('0 0 120 80', { class: 'art' },
    s('path', { d: 'M18 62h84', ...stroke({ 'stroke-opacity': .45 }) }),
    s('path', { d: 'M18 62V18', ...stroke({ 'stroke-opacity': .45 }) }),
    s('path', { d: 'M26 52l16-14 14 10 20-24 16 12', ...stroke({ 'stroke-width': 2.5 }) }),
    s('circle', { cx: 42, cy: 38, r: 3, fill: 'currentColor' }),
    s('circle', { cx: 76, cy: 24, r: 3, fill: 'currentColor' }),
  ),

  flame: () => svg('0 0 120 80', { class: 'art' },
    s('path', { d: 'M60 14c10 12 16 20 16 30a16 16 0 0 1-32 0c0-6 3-10 6-14 1 5 4 7 6 7 3 0 4-3 4-8 0-5-2-9 0-15z', ...stroke() }),
  ),

  scale: () => svg('0 0 120 80', { class: 'art' },
    s('rect', { x: 34, y: 22, width: 52, height: 42, rx: 8, ...stroke() }),
    s('circle', { cx: 60, cy: 43, r: 12, ...stroke({ 'stroke-opacity': .6 }) }),
    s('path', { d: 'M60 35v8l5 4', ...stroke({ 'stroke-width': 2.2 }) }),
  ),

  clipboard: () => svg('0 0 120 80', { class: 'art' },
    s('rect', { x: 40, y: 16, width: 40, height: 52, rx: 6, ...stroke() }),
    s('rect', { x: 52, y: 10, width: 16, height: 11, rx: 3, ...stroke() }),
    s('path', { d: 'M49 36h22M49 46h22M49 56h14', ...stroke({ 'stroke-width': 1.8, 'stroke-opacity': .7 }) }),
  ),

  empty: () => svg('0 0 120 80', { class: 'art' },
    s('rect', { x: 30, y: 26, width: 60, height: 40, rx: 8, ...stroke({ 'stroke-dasharray': '5 6', 'stroke-opacity': .55 }) }),
    s('path', { d: 'M45 46h30', ...stroke({ 'stroke-opacity': .4 }) }),
  ),

  target: () => svg('0 0 120 80', { class: 'art' },
    s('circle', { cx: 60, cy: 40, r: 26, ...stroke({ 'stroke-opacity': .5 }) }),
    s('circle', { cx: 60, cy: 40, r: 16, ...stroke({ 'stroke-opacity': .75 }) }),
    s('circle', { cx: 60, cy: 40, r: 6, fill: 'currentColor' }),
    s('path', { d: 'M78 22l14-10-4 12 12-4-12 12', ...stroke({ 'stroke-width': 2.2 }) }),
  ),

  water: () => svg('0 0 120 80', { class: 'art' },
    s('path', { d: 'M60 14c10 14 18 22 18 32a18 18 0 0 1-36 0c0-10 8-18 18-32z', ...stroke() }),
    s('path', { d: 'M52 48a8 8 0 0 0 8 8', ...stroke({ 'stroke-width': 1.8, 'stroke-opacity': .6 }) }),
  ),
};

/** Big friendly empty state: illustration + title + optional hint. */
export function emptyArt(kind, title, hint = '', color = 'var(--tx3)') {
  const box = document.createElement('div');
  box.className = 'empty-art';
  box.style.color = color;
  const art = (ART[kind] || ART.empty)();
  box.append(art);
  const h = document.createElement('b');
  h.textContent = title;
  box.append(h);
  if (hint) {
    const p = document.createElement('span');
    p.textContent = hint;
    box.append(p);
  }
  return box;
}
