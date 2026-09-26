/* ============ FitYar — icons ============
   Hand-drawn glyphs for the six figures the app repeats everywhere.

   They replace emoji, which are a different artwork on every phone: 🥩 is a
   flat red slab on one handset and a glossy 3D render on another, so a screen
   built from them cannot be designed. These are the same everywhere, take the
   colour of whatever they label, and scale without going soft.

   Depth comes from three flat layers rather than a gradient: the body in the
   current colour, a light face over the top of it, and a shade under the
   bottom. Gradients would mean a <defs> per icon and ids to keep unique, for
   an effect nobody would notice at 20px.

   Shape carries the meaning and colour carries the metric, so a protein glyph
   is legible in the app's blue without having to look like meat. */

const NS = 'http://www.w3.org/2000/svg';

/**
 * The drawing languages. One is in force at a time; settings picks it.
 *
 * Each is a whole language rather than a variation - choose one and every
 * glyph in the app follows it. They are listed here so settings can offer
 * them without knowing how any of them is drawn.
 */
export const ICON_STYLES = [
  { id: 'flat',    fa: 'ساده',        en: 'Flat' },
  { id: 'duo',     fa: 'دو‌تُنه',      en: 'Duotone' },
  { id: 'keyline', fa: 'خط‌دار',       en: 'Keyline' },
  { id: 'riso',    fa: 'چاپ افست',    en: 'Offset print' },
  { id: 'paper',   fa: 'کاغذ بریده',  en: 'Paper cut' },
  { id: 'tile',    fa: 'روی کاشی',    en: 'Tile' },
];

let STYLE = 'tile';
/** Settings owns the choice; icons drawn after this follow it. */
export const setIconStyle = (id) => {
  STYLE = ICON_STYLES.some((s) => s.id === id) ? id : 'tile';
};
export const iconStyle = () => STYLE;

/* paper and offset print both need a copy of the body sitting behind it */
const GHOSTS = { paper: ['ic-ghost'], riso: ['ic-ghost', 'ic-ghost2'] };


/* d = body, hi = the lit face, sh = the shaded underside. hi and sh are
   optional; a shape that reads flat in life (a leaf) is better left flat. */
/* Each icon is a list of shapes rather than one clever path. A drumstick and
   an ear of wheat are made of circles and ellipses, and trying to express them
   as a single outline produced a balloon and a shopping bag - which is what
   they looked like on screen before this was rewritten.

   layer: 'body' takes the current colour, 'hi' is the lit face over it and
   'sh' the shade under it. */
const ART = {
  /* calories - a flame with a brighter core */
  flame: [
    { t: 'path', d: 'M12 2.1c.6 2.7 2 4.1 3.4 5.6 1.6 1.7 3 3.5 3 6.3a6.4 6.4 0 1 1-12.8 0c0-2 .8-3.8 2.1-5.2.1 1.1.7 1.9 1.6 1.9 1.1 0 1.8-.9 1.8-2.5 0-2.2.4-4.2.9-6.1z' },
    { t: 'path', layer: 'hi', d: 'M12.1 20.3a3.2 3.2 0 0 1-3.2-3.2c0-1.7 1.3-2.7 2.1-4 .5.9 1 1.3 1.7 1.9.8.8 1.4 1.4 1.4 2.2a3 3 0 0 1-2 3.1z' },
  ],
  /* protein - a drumstick: meat, shaft, and two knuckles at the free end */
  meat: [
    { t: 'path', d: 'M20.8 3.8c2.4 2.4 2.1 6.6-.7 9.4-2.4 2.4-5.9 3-8.2 1.5l-2-2c-1.5-2.3-.9-5.8 1.5-8.2 2.8-2.8 7-3.1 9.4-.7z' },
    { t: 'path', d: 'M10.2 12.4l2.3 2.3-4.8 4.8-2.3-2.3z' },
    { t: 'circle', cx: 5.6, cy: 17.6, r: 2.1 },
    { t: 'circle', cx: 7.8, cy: 19.8, r: 2.1 },
    { t: 'ellipse', layer: 'hi', cx: 17.4, cy: 6.6, rx: 3.4, ry: 2.2, rot: -42 },
  ],
  /* carbs - an ear of wheat: a stem and four pairs of grains */
  grain: [
    { t: 'path', layer: 'sh', d: 'M11.2 21.6V9.9a.9.9 0 0 1 1.8 0v11.7a.9.9 0 0 1-1.8 0z' },
    { t: 'ellipse', cx: 8.6, cy: 16.4, rx: 2.1, ry: 3.4, rot: 32 },
    { t: 'ellipse', cx: 15.4, cy: 16.4, rx: 2.1, ry: 3.4, rot: -32 },
    { t: 'ellipse', cx: 8.9, cy: 11.3, rx: 2.1, ry: 3.4, rot: 32 },
    { t: 'ellipse', cx: 15.1, cy: 11.3, rx: 2.1, ry: 3.4, rot: -32 },
    { t: 'ellipse', cx: 9.6, cy: 6.5, rx: 2, ry: 3.2, rot: 26 },
    { t: 'ellipse', cx: 14.4, cy: 6.5, rx: 2, ry: 3.2, rot: -26 },
    { t: 'ellipse', cx: 12, cy: 4.2, rx: 1.9, ry: 3.1 },
  ],
  /* fat - a droplet of oil */
  drop: [
    { t: 'path', d: 'M12 2.6c3.7 4.5 6.2 7.7 6.2 10.8a6.2 6.2 0 0 1-12.4 0c0-3.1 2.5-6.3 6.2-10.8z' },
    { t: 'path', layer: 'hi', d: 'M9.1 12.9c0-1.4.7-2.7 1.7-4 .4-.5 1.1 0 .8.6-.7 1.1-1.2 2.1-1.2 3.4 0 .6-1.3.6-1.3 0z' },
  ],
  /* fibre - a leaf */
  leaf: [
    { t: 'path', d: 'M20 3.5c.6 6.3-1 10.5-3.8 12.8-2.6 2.2-6 2.2-8 .9L4.6 21a1 1 0 0 1-1.4-1.4l3.7-3.5C5.3 13.5 6 9.6 9 6.9c2.5-2.3 6.4-3.4 11-3.4z' },
    { t: 'path', layer: 'sh', d: 'M17.7 6.2c-3.4.5-6 1.9-7.8 4-1.5 1.8-2.3 3.8-2.5 6l1.2 1.2c.1-2.3.8-4.4 2.3-6.3 1.6-2 4-3.5 6.8-4.9z' },
  ],
  /* water - a glass, half filled */
  water: [
    { t: 'path', d: 'M5.4 3.4h13.2a1 1 0 0 1 1 1.1l-1.5 15a2 2 0 0 1-2 1.8H7.9a2 2 0 0 1-2-1.8l-1.5-15a1 1 0 0 1 1-1.1z' },
    { t: 'path', layer: 'hi', d: 'M6.3 11.2h11.4l-.8 8.2a1 1 0 0 1-1 .9H8.1a1 1 0 0 1-1-.9z' },
  ],

  /* breakfast - a sun coming up over the horizon */
  sunrise: [
    { t: 'path', d: 'M12 5.4a6 6 0 0 1 6 6H6a6 6 0 0 1 6-6z' },
    { t: 'path', d: 'M3.2 13.6h17.6a1.1 1.1 0 0 1 0 2.2H3.2a1.1 1.1 0 0 1 0-2.2zm3.4 4.6h10.8a1.1 1.1 0 0 1 0 2.2H6.6a1.1 1.1 0 0 1 0-2.2z' },
    { t: 'path', layer: 'hi', d: 'M11.1 1.6a.9.9 0 0 1 1.8 0v2.1a.9.9 0 0 1-1.8 0zM4 4.9a.9.9 0 0 1 1.3-1.3l1.5 1.5A.9.9 0 0 1 5.5 6.4zm14.7-1.3A.9.9 0 0 1 20 4.9l-1.5 1.5a.9.9 0 0 1-1.3-1.3z' },
  ],
  /* lunch - the sun at its highest */
  sun: [
    { t: 'circle', cx: 12, cy: 12, r: 5.2 },
    { t: 'path', d: 'M11.1 1.4a.9.9 0 0 1 1.8 0v2.4a.9.9 0 0 1-1.8 0zm0 18.8a.9.9 0 0 1 1.8 0v2.4a.9.9 0 0 1-1.8 0zM1.4 12.9a.9.9 0 0 1 0-1.8h2.4a.9.9 0 0 1 0 1.8zm18.8 0a.9.9 0 0 1 0-1.8h2.4a.9.9 0 0 1 0 1.8zM4.2 5.5A.9.9 0 0 1 5.5 4.2l1.7 1.7A.9.9 0 0 1 5.9 7.2zm12.6 12.6a.9.9 0 0 1 1.3-1.3l1.7 1.7a.9.9 0 0 1-1.3 1.3zM18.1 5.9a.9.9 0 0 1 1.3-1.7l.3.3a.9.9 0 0 1 0 1.3l-1.7 1.7a.9.9 0 0 1-1.3-1.3zM4.2 18.5a.9.9 0 0 1 0-1.3l1.7-1.7a.9.9 0 0 1 1.3 1.3l-1.7 1.7a.9.9 0 0 1-1.3 0z' },
    { t: 'circle', layer: 'hi', cx: 10.3, cy: 10.3, r: 2 },
  ],
  /* dinner - a crescent moon */
  moon: [
    { t: 'path', d: 'M20.6 15.3A9.3 9.3 0 0 1 8.7 3.4 9.3 9.3 0 1 0 20.6 15.3z' },
    { t: 'circle', layer: 'hi', cx: 8.4, cy: 16.2, r: 2.4 },
  ],
  /* a snack - an apple */
  apple: [
    { t: 'path', d: 'M12 6.9c1.5-1.1 3.4-1.5 5-.8 2.6 1.1 3.9 4.3 3 7.9-.9 3.6-3.4 7-5.6 7-1 0-1.6-.4-2.4-.4s-1.4.4-2.4.4c-2.2 0-4.7-3.4-5.6-7-.9-3.6.4-6.8 3-7.9 1.6-.7 3.5-.3 5 .8z' },
    { t: 'path', d: 'M12.9 6.6c-.1-2 .9-3.6 2.7-4.4.6-.3 1.1.6.6 1-1.2.8-1.7 1.8-1.6 3.3a.9.9 0 0 1-1.7.1z' },
    { t: 'path', layer: 'hi', d: 'M8.4 9.2c-1.4.7-2.1 2.4-1.8 4.3.1.7-.9.9-1.1.2-.5-2.5.4-4.8 2.4-5.8.6-.3 1.1.9.5 1.3z' },
  ],

  /* vegetables - a carrot, tapering, with two fronds */
  carrot: [
    { t: 'path', d: 'M17.8 8.1a1.6 1.6 0 0 1 .5 1.8c-1 2.8-3 6-5.3 8.3-2 2-4.4 3.2-6.4 3.7a1.6 1.6 0 0 1-2-2c.5-2 1.7-4.4 3.7-6.4 2.3-2.3 5.5-4.3 8.3-5.3a1.6 1.6 0 0 1 1.2-.1z' },
    { t: 'ellipse', cx: 17.5, cy: 5.2, rx: 1.7, ry: 3.1, rot: 38 },
    { t: 'ellipse', cx: 20.6, cy: 8.2, rx: 1.7, ry: 3.1, rot: 128 },
    { t: 'path', layer: 'sh', d: 'M14.6 11.2l1.4 1.4-1.7 2-1.4-1.4zm-4 4l1.4 1.4-1.7 2-1.4-1.4z' },
  ],
  /* dairy - a carton with a folded top */
  milk: [
    { t: 'path', d: 'M7.4 8.8h9.2a1 1 0 0 1 1 1v10.4a1 1 0 0 1-1 1H7.4a1 1 0 0 1-1-1V9.8a1 1 0 0 1 1-1z' },
    { t: 'path', d: 'M8.6 2.6h6.8a1 1 0 0 1 .8.4l1.9 2.6a1 1 0 0 1 .2.6v1.2a1 1 0 0 1-1 1H6.7a1 1 0 0 1-1-1V6.2a1 1 0 0 1 .2-.6L7.8 3a1 1 0 0 1 .8-.4z' },
    { t: 'path', layer: 'hi', d: 'M9 12.2h6a.9.9 0 0 1 0 1.8H9a.9.9 0 0 1 0-1.8z' },
  ],
  /* nuts and seeds - an almond, split */
  nut: [
    { t: 'path', d: 'M12 2.3c3.6 2.4 6 6.4 6 10.5 0 5-2.7 8.9-6 8.9s-6-3.9-6-8.9c0-4.1 2.4-8.1 6-10.5z' },
    { t: 'path', layer: 'sh', d: 'M11.1 4.6a.9.9 0 0 1 1.8 0v15.3a.9.9 0 0 1-1.8 0z' },
  ],
  /* the snack allowance - a biscuit */
  cookie: [
    { t: 'circle', cx: 12, cy: 12, r: 9.3 },
    { t: 'circle', layer: 'sh', cx: 9, cy: 9.2, r: 1.5 },
    { t: 'circle', layer: 'sh', cx: 15.2, cy: 10.4, r: 1.3 },
    { t: 'circle', layer: 'sh', cx: 10.8, cy: 15.4, r: 1.6 },
    { t: 'circle', layer: 'sh', cx: 15.4, cy: 15.6, r: 1.1 },
  ],
  /* training - a dumbbell */
  dumbbell: [
    { t: 'path', d: 'M8.4 10.9h7.2v2.2H8.4z' },
    { t: 'path', d: 'M5.3 7.7h2.2a1.1 1.1 0 0 1 1.1 1.1v6.4a1.1 1.1 0 0 1-1.1 1.1H5.3a1.1 1.1 0 0 1-1.1-1.1V8.8a1.1 1.1 0 0 1 1.1-1.1zm11.2 0h2.2a1.1 1.1 0 0 1 1.1 1.1v6.4a1.1 1.1 0 0 1-1.1 1.1h-2.2a1.1 1.1 0 0 1-1.1-1.1V8.8a1.1 1.1 0 0 1 1.1-1.1z' },
    { t: 'path', d: 'M1.6 10.2h1.5v3.6H1.6a.9.9 0 0 1 0-1.8zm19.3 0h1.5a.9.9 0 0 1 0 1.8h-1.5z' },
    { t: 'path', layer: 'hi', d: 'M5.4 9.3h1.9v2.1H5.4zm11.3 0h1.9v2.1h-1.9z' },
  ],
  /* done - a tick in a disc */
  check: [
    { t: 'circle', cx: 12, cy: 12, r: 9.4 },
    { t: 'path', layer: 'hi', d: 'M10.6 16.3a1.1 1.1 0 0 1-.8-.3l-3-3a1.1 1.1 0 0 1 1.6-1.6l2.2 2.2 5.1-5.1a1.1 1.1 0 0 1 1.6 1.6l-5.9 5.9a1.1 1.1 0 0 1-.8.3z' },
  ],
  /* a goal - rings and a centre */
  target: [
    { t: 'path', d: 'M12 1.8a10.2 10.2 0 1 0 0 20.4 10.2 10.2 0 0 0 0-20.4zm0 2.8a7.4 7.4 0 1 1 0 14.8 7.4 7.4 0 0 1 0-14.8z' },
    { t: 'path', d: 'M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2.8a2.2 2.2 0 1 1 0 4.4 2.2 2.2 0 0 1 0-4.4z' },
    { t: 'circle', layer: 'sh', cx: 12, cy: 12, r: 2.2 },
  ],

  /* weight - a bathroom scale seen from above: the slab, the window, the feet */
  scale: [
    { t: 'path', d: 'M4.4 4.6h15.2a1.8 1.8 0 0 1 1.8 1.8v11.2a1.8 1.8 0 0 1-1.8 1.8H4.4a1.8 1.8 0 0 1-1.8-1.8V6.4a1.8 1.8 0 0 1 1.8-1.8z' },
    { t: 'path', layer: 'sh', d: 'M8.4 8.4h7.2a1.3 1.3 0 0 1 1.3 1.3v3.1a1.3 1.3 0 0 1-1.3 1.3H8.4a1.3 1.3 0 0 1-1.3-1.3V9.7a1.3 1.3 0 0 1 1.3-1.3z' },
    { t: 'circle', layer: 'sh', cx: 5.5, cy: 16.4, r: 1 },
    { t: 'circle', layer: 'sh', cx: 18.5, cy: 16.4, r: 1 },
    { t: 'ellipse', layer: 'hi', cx: 8.2, cy: 6.5, rx: 3.2, ry: 1, rot: 0 },
  ],
  /* a day - a calendar block: two rings, the header band, and a marked day */
  calendar: [
    { t: 'path', d: 'M4.2 5.4h15.6a1.8 1.8 0 0 1 1.8 1.8v12.2a1.8 1.8 0 0 1-1.8 1.8H4.2a1.8 1.8 0 0 1-1.8-1.8V7.2a1.8 1.8 0 0 1 1.8-1.8z' },
    { t: 'path', layer: 'sh', d: 'M2.4 7.2a1.8 1.8 0 0 1 1.8-1.8h15.6a1.8 1.8 0 0 1 1.8 1.8v2.4H2.4z' },
    { t: 'path', d: 'M7.4 2.4a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-3a1 1 0 0 1 1-1z' },
    { t: 'path', d: 'M16.6 2.4a1 1 0 0 1 1 1v3a1 1 0 0 1-2 0v-3a1 1 0 0 1 1-1z' },
    { t: 'path', layer: 'hi', d: 'M10.6 12.8h2.8a1 1 0 0 1 1 1v2.6a1 1 0 0 1-1 1h-2.8a1 1 0 0 1-1-1v-2.6a1 1 0 0 1 1-1z' },
  ],
};

/** Every glyph there is, so a caller can tell a name from a stray character. */
export const GLYPHS = new Set(Object.keys(ART));

/** The figure each screen shows, by the key the app already uses for it. */
export const METRIC_ICON = {
  kcal: 'flame', protein: 'meat', carbs: 'grain',
  fat: 'drop', fiber: 'leaf', water: 'water',
};

/** The food groups the day report scores, in the report's own ids. */
export const GROUP_GLYPH = {
  veg: 'carrot', fruit: 'apple', protein: 'meat',
  dairy: 'milk', grain: 'grain', nut: 'nut', snack: 'cookie',
};

/** The glyph for a food group. */
export const groupIcon = (group, opts) =>
  GROUP_GLYPH[group] ? icon(GROUP_GLYPH[group], opts) : null;

/** The four meal slots, as times of day rather than as foods. */
export const MEAL_GLYPH = {
  breakfast: 'sunrise', lunch: 'sun', dinner: 'moon', snack: 'apple',
};

/** The glyph for a meal slot. */
export const mealIcon = (meal, opts) =>
  MEAL_GLYPH[meal] ? icon(MEAL_GLYPH[meal], opts) : null;

/**
 * One icon, as an <svg> ready to drop into the DOM.
 *
 * It takes its colour from the parent's `color`, so an icon inside a blue
 * macro cell is blue without anything here knowing about macros.
 */
export function icon(name, { size = 20, cls = '' } = {}) {
  const shapes = ART[name] || ART[METRIC_ICON[name]] || ART.flame;
  const svg = document.createElementNS(NS, 'svg');
  /* the tile language needs room around the mark for its field */
  svg.setAttribute('viewBox', STYLE === 'tile' ? '-3 -3 30 30' : '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', `ic ic--${STYLE} ${cls}`.trim());

  const draw = (sh) => {
    const n = document.createElementNS(NS, sh.t === 'path' ? 'path' : sh.t);
    if (sh.t === 'path') n.setAttribute('d', sh.d);
    else {
      n.setAttribute('cx', sh.cx); n.setAttribute('cy', sh.cy);
      if (sh.t === 'circle') n.setAttribute('r', sh.r);
      else { n.setAttribute('rx', sh.rx); n.setAttribute('ry', sh.ry); }
      if (sh.rot) n.setAttribute('transform', `rotate(${sh.rot} ${sh.cx} ${sh.cy})`);
    }
    return n;
  };

  if (STYLE === 'tile') {
    const r = document.createElementNS(NS, 'rect');
    r.setAttribute('x', -3); r.setAttribute('y', -3);
    r.setAttribute('width', 30); r.setAttribute('height', 30);
    r.setAttribute('rx', 9);
    r.setAttribute('class', 'ic-tile');
    svg.append(r);
  }

  /* The offset copies go in first so the mark stays on top of them. They
     carry only the body: offsetting the inner detail as well turns the
     whole thing to mud at 20px. */
  const body = shapes.filter((sh) => !sh.layer || sh.layer === 'body');
  for (const klass of GHOSTS[STYLE] || []) {
    const g = document.createElementNS(NS, 'g');
    g.setAttribute('class', klass);
    body.forEach((sh) => g.append(draw(sh)));
    svg.append(g);
  }

  for (const sh of shapes) {
    const n = draw(sh);
    n.setAttribute('class', 'ic-' + (sh.layer || 'body'));
    svg.append(n);
  }
  return svg;
}

/** The icon for a metric key, or null if that metric has none. */
export const metricIcon = (key, opts) =>
  METRIC_ICON[key] ? icon(METRIC_ICON[key], opts) : null;

/* ============================================================
   OUTLINE SET — the interface's own icons
   ============================================================

   The chrome set: what a button or a row uses. Same geometry as the icons
   written into index.html by hand — a 24 box, a 1.9px stroke, round caps —
   so a button built in JavaScript is indistinguishable from one in the
   markup. These replace the emoji that used to sit beside those labels,
   which were a different drawing on every phone.
*/
const LINES = {
  camera: 'M3 8h3l2-3h8l2 3h3v11H3z M12 9.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7z',
  star: 'M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z',
  copy: 'M9 9h10v11H9z M15 9V4H5v11h4',
  swap: 'M4 8h13l-3-3 M20 16H7l3 3',
  refresh: 'M20 12a8 8 0 1 1-2.3-5.6 M20 4v5h-5',
  download: 'M12 4v11 M8 11l4 4 4-4 M4 19h16',
  upload: 'M12 19V8 M8 12l4-4 4 4 M4 4h16',
  book: 'M4 5h6a2.5 2.5 0 0 1 2 2.2V20a2.2 2.2 0 0 0-2-1.6H4z M20 5h-6a2.5 2.5 0 0 0-2 2.2V20a2.2 2.2 0 0 1 2-1.6h6z',
  tag: 'M4 11V5h6l9.5 9.5-6 6z M8 8.5h.01',
  dice: 'M4.5 4.5h15v15h-15z M9 9h.01 M15 15h.01 M12 12h.01',
  play: 'M8 5.5l11 6.5-11 6.5z',
  search: 'M11 4.5a6.5 6.5 0 1 0 0 13 6.5 6.5 0 0 0 0-13z M16 16l4 4',
  pencil: 'M16.5 3.8l3.7 3.7L8.3 19.4 4 20.4l1-4.3z M14.4 5.9l3.7 3.7',
  chat: 'M4 5h16v11H9l-5 4z',
  chevron: 'M14.5 6.5L9 12l5.5 5.5',
  /* The globe's own, so its guide card stops borrowing the chart icon the
     progress tab already uses. A circle, a meridian and the equator — the
     three lines anyone draws when asked to draw a planet. */
  globe: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2z '
    + 'M3.6 12h16.8 M12 3.4c2.3 2.3 3.5 5.3 3.5 8.6s-1.2 6.3-3.5 8.6 '
    + 'c-2.3-2.3-3.5-5.3-3.5-8.6s1.2-6.3 3.5-8.6z',
  /* A plate is two concentric circles and so is a target; side by side in
     the questions grid they were the same drawing twice. Eating gets
     cutlery instead. */
  cutlery: 'M6.6 4v5.4a1.9 1.9 0 0 0 3.8 0V4 M8.5 9.4V20 '
    + 'M16.8 4c-1.7 1.1-2.6 2.8-2.6 4.9 0 1.7 .9 2.8 2.6 3.1V20',
  sun: 'M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z M12 2.6v2 M12 19.4v2 '
    + 'M2.6 12h2 M19.4 12h2 M5.3 5.3l1.4 1.4 M17.3 17.3l1.4 1.4 '
    + 'M18.7 5.3l-1.4 1.4 M6.7 17.3l-1.4 1.4',
  scale: 'M4.5 4.5h15v15h-15z M12 14.6a1.1 1.1 0 1 0 0-2.2 1.1 1.1 0 0 0 0 2.2z '
    + 'M12.6 12.5l2.6-3.9',
  dumbbell: 'M4 9.5v5 M7.2 7v10 M7.2 12h9.6 M16.8 7v10 M20 9.5v5',
  calendar: 'M4 6.5h16v13H4z M4 10.6h16 M8.4 4v4.2 M15.6 4v4.2',
  drop: 'M12 3.4c0 0 6 6.4 6 10.2a6 6 0 0 1-12 0c0-3.8 6-10.2 6-10.2z',
  target: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2z '
    + 'M12 7.9a4.1 4.1 0 1 0 0 8.2 4.1 4.1 0 0 0 0-8.2z M12 11.3h.01',
  clock: 'M12 3.4a8.6 8.6 0 1 0 0 17.2 8.6 8.6 0 0 0 0-17.2z M12 7.5V12l3 2',
  hand: 'M7 13V6.5a1.5 1.5 0 0 1 3 0V12 M10 11.5V5a1.5 1.5 0 0 1 3 0v6.5 M13 11.5V6a1.5 1.5 0 0 1 3 0v7 M16 10.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1a6 6 0 0 1-5-3.2L5 15',
  plate: 'M12 3.6a8.4 8.4 0 1 0 0 16.8 8.4 8.4 0 0 0 0-16.8z M12 7.6a4.4 4.4 0 1 0 0 8.8 4.4 4.4 0 0 0 0-8.8z',
  bars: 'M4 19V9 M10 19V5 M16 19v-7 M22 19H2',
  chart: 'M4 19.5h16 M4 19.5V4.5 M7 14.5l3.8-4.2 3 2.4 4.2-5.2',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z',
  warning: 'M12 4.2l8.5 15H3.5z M12 10v4 M12 17h.01',
  check: 'M5 12.6l4.6 4.6L19 7.2',
};

/**
 * An outline icon for the interface, matching the ones written by hand in
 * index.html. Unknown names return null rather than throwing, and diag
 * sweeps the source for names that do not exist — a silent hole where a
 * drawing should be is the worst way for this to fail.
 */
export function lineIcon(name, { size = 20, cls = '' } = {}) {
  const d = LINES[name];
  if (!d) return null;
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('width', size);
  svg.setAttribute('height', size);
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', ('ico ' + cls).trim());
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', d);
  svg.append(path);
  return svg;
}

export const LINE_ICONS = new Set(Object.keys(LINES));
