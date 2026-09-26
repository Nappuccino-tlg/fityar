/* ============ FitYar — a body you can turn ============

   The flat map draws a front and a back and asks you to hold both in your
   head at once. This is one figure in perspective that you spin with your
   finger, and the muscle facing you is the one you are looking at.

   It is genuinely three-dimensional: every part is a box of four faces with
   real depth, sitting inside a `perspective` container, and the browser sorts
   them by distance as the rig turns. Not a drawing of a body from an angle —
   a body at an angle.

   No library and no WebGL. A figure of this complexity is about seventy
   elements and CSS transforms handle it on the compositor, which is cheaper
   than a canvas redrawing every frame and survives a phone deciding to throw
   the GL context away.

   ────────────────────────────────────────────────────────────────────────
   The part table below is the whole model. Each row is a box: its size, where
   its centre sits, and which muscle its front and back belong to. Left and
   right limbs are one row with `mirror`, so the two sides cannot drift apart.
*/

/* Units are the figure's own, scaled to the container at draw time. The
   origin is the middle of the pelvis, y grows downward, z toward the viewer. */
export const PARTS = [
  /* name        w    h    d    x     y     z   front        back          joint  */
  ['head',      34,  40,  34,   0, -132,   0,  null,        null,         'torso'],
  ['neck',      19,  16,  19,   0, -106,  -1,  'traps',     'traps',      'torso'],
  ['chest',     78,  48,  38,   0,  -74,   2,  'chest',     'back',       'torso'],
  ['lats',      70,  34,  30,   0,  -46,  -4,  'back',      'back',       'torso'],
  ['abs',       58,  40,  32,   0,  -22,   2,  'abs',       'back',       'torso'],
  ['pelvis',    64,  28,  34,   0,    6,   0,  'abs',       'glutes',     'root'],
  ['shoulder',  27,  27,  27,  49,  -82,   0,  'shoulders', 'shoulders',  'arm'],
  ['upperArm',  21,  56,  21,  52,  -48,   0,  'biceps',    'triceps',    'arm'],
  ['forearm',   18,  52,  18,  54,    8,   0,  'forearms',  'forearms',   'fore'],
  ['thigh',     28,  64,  28,  19,   50,   0,  'quads',     'hamstrings', 'thigh'],
  ['shin',      22,  60,  22,  19,  112,   0,  'quads',     'calves',     'shin'],
  ['foot',      22,  12,  30,  19,  148,   6,  null,        null,         'heel'],
];

/* The skeleton. `at` is where the joint is in the figure's own units, `of`
   is what it hangs from, and a mirrored joint exists twice — so the two
   sides cannot drift apart, exactly as the parts table intends.

   Every pivot sits a few units *inside* the part below it rather than on the
   seam between them. On the seam, a bent elbow opens a wedge of daylight at
   the joint; buried, the parent's box stays over the gap however far the
   limb swings. The names are the movement table's, so `rotations()` hands
   back one angle per joint and nothing has to be matched up by hand. */
export const JOINTS = {
  root:  { at: [0, 0, 0] },
  torso: { at: [0, 4, 0], of: 'root' },
  arm:   { at: [52, -76, 0], of: 'torso', mirror: true },
  fore:  { at: [54, -14, 0], of: 'arm', mirror: true },
  thigh: { at: [19, 20, 0], of: 'root', mirror: true },
  shin:  { at: [19, 86, 0], of: 'thigh', mirror: true },
  heel:  { at: [19, 144, 0], of: 'shin', mirror: true },
};

/* What the hands hold, when the movement holds something. Both sit in the
   forearm's frame at hand height, so they travel with the hands and need no
   arithmetic of their own. The bar is half a bar: it reaches from the hand
   past the middle of the body, where it meets the other half. */
const LOAD = [
  /* name     w    h    d    x    y   z */
  ['bar',    74,   7,   7,  17,  34,  0],
  ['plate',   7,  34,  34,  58,  34,  0],
];

/* The side-view figure is 38 units from hip to ankle and this one is 124, so
   a movement that lowers the whole body — a squat, a lunge — has to lower it
   by that much more. */
export const DY = 3.26;

/** Every muscle the figure can light up. */
export const MODELLED = [...new Set(
  PARTS.flatMap(([, , , , , , , front, back]) => [front, back]).filter(Boolean),
)];

/* ---------------- the room ----------------

   One floor, at the height a standing figure's feet reach, and everything
   else measured up from it. A bench top is 79 units above it, which is a
   45cm bench at this figure's scale.

   `view` slides the whole scene - props and body together - so that a
   movement performed lying down is still composed in the middle of its
   frame. It is a camera move and not a lie about where anything is: the
   body and the thing it rests on move by the same amount.

   Each prop is boxes in the same units as the body, drawn by the same
   code, so a bench is lit by the same light. */
const FLOOR = 154;
const SURFACES = {
  floor: {
    view: -104,
    props: [['mat', 170, 10, 320, 0, FLOOR + 5, 0]],
  },
  bench: {
    view: -54,
    props: [
      ['pad', 56, 16, 200, 0, FLOOR - 71, -40],
      ['post', 30, 63, 30, 0, FLOOR - 31, -40],
      ['base', 42, 10, 150, 0, FLOOR - 5, -40],
    ],
  },
  wall: {
    view: 0,
    /* Its face at z 137, which is where the hands land. */
    props: [['panel', 320, 440, 12, 0, -20, 143]],
  },
  bar: {
    view: 26,
    props: [
      ['rail', 230, 10, 10, 0, -191, 10],
      ['postR', 12, 360, 12, 110, -14, 10],
      ['postL', 12, 360, 12, -110, -14, 10],
    ],
  },
  bars: {
    view: -8,
    props: [
      ['railR', 14, 10, 180, 54, 41, 0],
      ['railL', 14, 10, 180, -54, 41, 0],
      ['legR', 12, 118, 12, 54, 100, -70],
      ['legL', 12, 118, 12, -54, 100, -70],
    ],
  },
};

/* Lying on the back is a quarter turn one way and face down the other. */
const LIE = { up: 90, down: -90 };

/* All six faces of a box.

   The caps used to be left off, on the reasoning that you only ever see the
   top of a box from directly above. That held while the figure stood still
   and stopped holding the moment it began performing movements: a press
   ends with both arms overhead and showed the hollow inside of each
   forearm. They are two more elements each and they close the body. */
const FACES = [
  ['front', (w, h, d) => `translateZ(${d / 2}px)`, (w, h, d) => [w, h]],
  ['back', (w, h, d) => `translateZ(${-d / 2}px) rotateY(180deg)`, (w, h, d) => [w, h]],
  ['left', (w, h, d) => `translateX(${-w / 2}px) rotateY(-90deg)`, (w, h, d) => [d, h]],
  ['right', (w, h, d) => `translateX(${w / 2}px) rotateY(90deg)`, (w, h, d) => [d, h]],
  ['top', (w, h, d) => `translateY(${-h / 2}px) rotateX(90deg)`, (w, h, d) => [w, d]],
  ['bottom', (w, h, d) => `translateY(${h / 2}px) rotateX(-90deg)`, (w, h, d) => [w, d]],
];

/* How round each part is, as a share of its own narrow side. A limb is a
   capsule and the head is very nearly an egg; the trunk is only softened,
   because a torso rounded like an arm reads as a barrel. */
const ROUND = {
  head: 0.5, neck: 0.46, chest: 0.3, lats: 0.3, abs: 0.32, pelvis: 0.3,
  shoulder: 0.5, upperArm: 0.45, forearm: 0.45,
  thigh: 0.42, shin: 0.44, foot: 0.34,
};

const el = (cls) => {
  const n = document.createElement('div');
  n.className = cls;
  return n;
};

import { motionOff } from './motion.js';
import { MOVES, poseOf, rotations, NEUTRAL_POSE } from './moves.js';

/**
 * Build the figure.
 *
 * `onPick` receives a muscle id when a face is tapped — the same contract the
 * flat map uses, so the two are interchangeable to their callers.
 */
export function body3d({ heat = {}, onPick = null, scale = 1,
  move = null, still = false, ms = 2600, load = scale > 0.5, face = false,
  openAt = null } = {}) {
  const stage = el('b3d');
  const rig = el('b3d-rig');
  /* The props and the body live together in here, so sliding the view to
     compose a lying movement moves the bench with the person on it. */
  const scene = el('b3d-scene');
  rig.append(scene);
  stage.append(rig);

  const faceOf = new Map();          // muscle id -> [face elements]
  const add = (muscle, node) => {
    if (!muscle) return;
    if (!faceOf.has(muscle)) faceOf.set(muscle, []);
    faceOf.get(muscle).push(node);
  };

  /* ---- the skeleton ----
     Built parents first, so a joint always finds the one it hangs from. Each
     carries its own place in its parent as a translate, and its angle as a
     rotate after it: that order puts the origin on the pivot, which is the
     whole point of a pivot. */
  const joints = new Map();          // `name:side` -> { node, base }
  const key = (name, side) => `${name}:${JOINTS[name].mirror ? side : 0}`;

  for (const [name, j] of Object.entries(JOINTS)) {
    for (const side of j.mirror ? [1, -1] : [0]) {
      const sx = side || 1;
      const node = el('b3d-joint');
      node.dataset.joint = name + (side ? (side > 0 ? '-r' : '-l') : '');

      const host = j.of ? joints.get(key(j.of, side)) : null;
      const pa = j.of ? JOINTS[j.of].at : [0, 0, 0];
      const px = j.of && JOINTS[j.of].mirror ? pa[0] * sx : pa[0];
      const base = `translate3d(${(j.at[0] * sx - px) * scale}px,`
        + ` ${(j.at[1] - pa[1]) * scale}px, ${(j.at[2] - pa[2]) * scale}px)`;
      node.style.transform = base;

      joints.set(key(name, side), { node, base, side });
      (host ? host.node : scene).append(node);
    }
  }

  /* ---- the parts, each inside the joint that moves it ---- */
  const faceOn = face;
  for (const [name, w, h, d, x, y, z, front, back, joint] of PARTS) {
    const j = JOINTS[joint];
    for (const side of j.mirror ? [1, -1] : [0]) {
      const sx = side || 1;
      const part = el('b3d-part');
      part.dataset.part = name + (side ? (side > 0 ? '-r' : '-l') : '');
      part.style.transform = `translate3d(${(x - j.at[0]) * sx * scale}px,`
        + ` ${(y - j.at[1]) * scale}px, ${(z - j.at[2]) * scale}px)`;

      for (const [face, place, size] of FACES) {
        const [fw, fh] = size(w * scale, h * scale, d * scale);
        const node = el('b3d-face b3d-' + face);
        node.style.width = `${fw}px`;
        node.style.height = `${fh}px`;
        node.style.marginLeft = `${-fw / 2}px`;
        node.style.marginTop = `${-fh / 2}px`;
        node.style.transform = place(w * scale, h * scale, d * scale);
        /* Rounded off its own narrow side, so a thin forearm and a wide
           chest are rounded by the same eye rather than by the same
           number. A limb is a capsule; a rectangle is furniture. */
        node.style.borderRadius = `${Math.min(fw, fh) * (ROUND[name] ?? 0.4)}px`;

        /* The front and the two sides belong to the front muscle; only the
           back face belongs to the back one. That is what makes the biceps
           and the triceps two different things on one arm. */
        /* A head with eyes is somebody; a head without them is a prop. They
           go on the front face alone, so turning the figure round shows the
           back of its head, which is the point of a head. */
        if (faceOn && name === 'head' && face === 'front') {
          node.append(el('b3d-eye left'), el('b3d-eye right'));
        }

        const muscle = face === 'back' ? back : front;
        if (muscle) {
          node.dataset.muscle = muscle;
          add(muscle, node);
          if (onPick) {
            node.classList.add('tappable');
            node.addEventListener('click', (e) => { e.stopPropagation(); onPick(muscle); });
          }
        }
        part.append(node);
      }
      joints.get(key(joint, side)).node.append(part);
    }
  }

  /* The bar, in the hands, when there is one to hold. Left off the small
     figures: at a third of this size it is three pixels of grey across the
     chest, which reads as a smudge rather than as a barbell. */
  if (load && typeof move === 'string' && MOVES[move]?.bar) {
    for (const [name, w, h, d, x, y, z] of LOAD) {
      for (const side of [1, -1]) {
        const part = el('b3d-part b3d-load');
        part.dataset.part = name + (side > 0 ? '-r' : '-l');
        part.style.transform = `translate3d(${(x - JOINTS.fore.at[0]) * side * scale}px,`
          + ` ${(y - JOINTS.fore.at[1]) * scale}px, ${(z - JOINTS.fore.at[2]) * scale}px)`;
        for (const [face, place, size] of FACES) {
          const [fw, fh] = size(w * scale, h * scale, d * scale);
          const node = el('b3d-face b3d-' + face);
          node.style.width = `${fw}px`;
          node.style.height = `${fh}px`;
          node.style.marginLeft = `${-fw / 2}px`;
          node.style.marginTop = `${-fh / 2}px`;
          node.style.transform = place(w * scale, h * scale, d * scale);
          part.append(node);
        }
        joints.get(key('fore', side)).node.append(part);
      }
    }
  }

  /** How hard each muscle has been worked, 0..1, straight onto the faces. */
  const setHeat = (next = {}) => {
    for (const [muscle, nodes] of faceOf) {
      const v = next[muscle] || 0;
      for (const n of nodes) {
        n.style.setProperty('--heat', v.toFixed(3));
        n.classList.toggle('lit', v > 0.02);
      }
    }
  };
  setHeat(heat);

  /* ---- holding a pose ----
     One angle per joint, straight off the movement table. The side-view
     drawing measures a positive rotation clockwise and this body measures it
     the other way about the same axis, so the whole set is negated — once,
     here, rather than in a second table that could drift out of step. */
  const angles = (pose) => {
    const r = rotations(pose);
    return { torso: -r.torso, arm: -r.arm, fore: -r.fore,
      thigh: -r.thigh, shin: -r.shin, heel: -r.heel };
  };
  const turnTo = (name, side, deg) => {
    const j = joints.get(key(name, side));
    if (j) j.node.style.transform = `${j.base} rotateX(${deg}deg)`;
    return j;
  };

  /* Where the body sits, and which way up. Set once per movement and read
     by every pose after it, so a pose never has to know what it is lying on. */
  let surface = null, lieDeg = 0, liftPx = 0;

  /** The root's whole transform, for one pose. See the note on order above. */
  const rootAt = (pose) => {
    const sh = pose?.shift || [0, 0, 0];
    return `translate3d(${sh[0] * scale}px, ${sh[1] * scale}px, ${sh[2] * scale}px)`
      + ` translateY(${liftPx}px)`
      + (lieDeg ? ` rotateX(${lieDeg}deg)` : '')
      + ` translateY(${(pose?.dy || 0) * DY * scale}px)`;
  };

  /** Stand the figure in one pose. */
  const setPose = (pose) => {
    if (!pose) return;
    const a = angles(pose);
    for (const name of Object.keys(a)) {
      for (const side of JOINTS[name].mirror ? [1, -1] : [0]) turnTo(name, side, a[name]);
    }
    joints.get('root:0').node.style.transform = rootAt(pose);
  };

  /* ---- what the movement is performed on ----
     Built once, from boxes, by the same code that builds the body - so a
     bench catches the same light as the person on it rather than looking
     like a sticker behind them. */
  const dressStage = (move) => {
    for (const n of scene.querySelectorAll('.b3d-prop')) n.remove();
    surface = move?.on ? SURFACES[move.on] : null;
    lieDeg = move?.lie ? LIE[move.lie] : 0;
    liftPx = (move?.lift || 0) * scale;
    scene.style.transform = `translateY(${(surface?.view || 0) * scale}px)`;
    /* A movement with its own ground does not want the stage's painted one
       underneath it as well. */
    stage.classList.toggle('grounded', !!surface);
    if (!surface) return;
    for (const [name, w, h, d, x, y, z] of surface.props) {
      const part = el('b3d-part b3d-prop');
      part.dataset.part = name;
      part.style.transform = `translate3d(${x * scale}px, ${y * scale}px, ${z * scale}px)`;
      for (const [f, place, size] of FACES) {
        const [fw, fh] = size(w * scale, h * scale, d * scale);
        const node = el('b3d-face b3d-' + f);
        node.style.width = `${fw}px`;
        node.style.height = `${fh}px`;
        node.style.marginLeft = `${-fw / 2}px`;
        node.style.marginTop = `${-fh / 2}px`;
        node.style.transform = place(w * scale, h * scale, d * scale);
        node.style.borderRadius = `${Math.min(fw, fh) * 0.16}px`;
        part.append(node);
      }
      scene.append(part);
    }
  };

  /* ---- performing a movement ----
     Every pattern is two ends and the time between them, so every joint that
     differs gets one animation alternating between the two. A stride is the
     exception worth the extra line: with both sides in step a run reads as a
     hop, so the left side plays the same animation backwards. */
  let runs = [];
  const stop = () => { runs.forEach((r) => { try { r.cancel(); } catch {} }); runs = []; };

  const perform = (moveId, { ms = 2600, still = false } = {}) => {
    stop();
    /* Either the name of a pattern from the movement table, or a pair of
       poses written out — because cheering is not an exercise and has no
       business in a table of exercises, but it is the same two-ended shape. */
    const named = typeof moveId === 'string';
    const move = named ? MOVES[moveId] : moveId;
    if (!move) return false;
    dressStage(move);
    const a = named ? poseOf(moveId, 'a') : { ...NEUTRAL_POSE, ...(move.a || {}) };
    const b = named ? poseOf(moveId, 'b') : { ...NEUTRAL_POSE, ...(move.b || {}) };

    /* Motion off, a hold, or a browser without animations: stand in the
       middle of the movement. The shape still says what it is. */
    if (still || move.still || (motionOff && motionOff()) || !stage.animate) {
      const mid = {};
      for (const k of Object.keys(a)) mid[k] = move.still ? a[k] : (a[k] + b[k]) / 2;
      setPose(mid);
      return true;
    }

    setPose(a);
    const ra = angles(a), rb = angles(b);
    const timing = (rev) => ({
      duration: ms, iterations: Infinity, easing: 'cubic-bezier(.45,0,.55,1)',
      direction: move.alt && rev ? 'alternate-reverse' : 'alternate',
    });
    for (const name of Object.keys(ra)) {
      if (ra[name] === rb[name]) continue;
      for (const side of JOINTS[name].mirror ? [1, -1] : [0]) {
        const j = joints.get(key(name, side));
        runs.push(j.node.animate([
          { transform: `${j.base} rotateX(${ra[name]}deg)` },
          { transform: `${j.base} rotateX(${rb[name]}deg)` },
        ], timing(side < 0)));
      }
    }
    /* The root carries the surface, the lift and the lie as well as dy, so
       the two ends are compared as whole transforms rather than by dy alone
       — a bridge and a wall push-up move the body without touching dy. */
    const rootA = rootAt(a), rootB = rootAt(b);
    if (rootA !== rootB) {
      runs.push(joints.get('root:0').node.animate(
        [{ transform: rootA }, { transform: rootB }], timing(false)));
    }
    return true;
  };

  /* ---- turning it ----
     Opens at three-quarters, because a figure square-on reads as a diagram
     and one at an angle reads as an object. Vertical tilt is clamped: past
     about 40 degrees you are looking at the top of its head. */
  /* A movement is mostly forward and back, and forward and back is the one
     direction a figure square-on cannot show. So a performing body opens
     nearer the side; a resting one opens at three-quarters. A figure that
     is somebody rather than something overrides both and faces you. */
  /* A movement performed on something is nearly always a side view: the
     bench, the wall and the bar all run across the frame, and square-on
     they are a single edge. */
  const onSurface = typeof move === 'string' && MOVES[move]?.on;
  let spin = openAt ?? (onSurface ? 86 : move ? 62 : 28);
  let tilt = -6, dragging = false, last = null, moved = 0;
  const apply = () => {
    rig.style.transform = `rotateX(${tilt}deg) rotateY(${spin}deg)`;
    stage.dataset.facing = Math.abs(((spin % 360) + 360) % 360 - 180) < 90 ? 'back' : 'front';
  };
  apply();

  /* ---- the idle turn ----
     A still figure is a poster. Left alone it sways gently and settles back
     where it started, which is what makes the figure feel like a thing in
     space rather than a picture of one. The sway is one bounded animation:
     it ends where it began (so a finger landing mid-sway never sees a jump),
     it is cancelled the moment anyone steers, and it never re-arms — a
     figure the user has turned stays where they left it. */
  let idleTimer = 0, idleRaf = 0;
  const stopIdle = () => {
    clearTimeout(idleTimer);
    cancelAnimationFrame(idleRaf);
    idleRaf = 0;
  };
  const sway = () => {
    if (document.hidden || motionOff && motionOff()) return;
    const t0 = performance.now(), base = spin, D = 5200, A = 12;
    const frame = (t) => {
      const k = Math.min(1, (t - t0) / D);
      spin = base + Math.sin(k * Math.PI * 2) * A;
      apply();
      idleRaf = k < 1 && !dragging && !document.hidden
        ? requestAnimationFrame(frame) : 0;
    };
    idleRaf = requestAnimationFrame(frame);
  };
  idleTimer = setTimeout(() => { if (!dragging) sway(); }, 2600);

  stage.addEventListener('pointerdown', (e) => {
    dragging = true; moved = 0; last = [e.clientX, e.clientY];
    stage.setPointerCapture?.(e.pointerId);
    stage.classList.add('turning');
    clearTimeout(idleTimer); stopIdle();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    const [px, py] = last;
    spin += (e.clientX - px) * 0.55;
    tilt = Math.max(-38, Math.min(38, tilt - (e.clientY - py) * 0.3));
    moved += Math.abs(e.clientX - px) + Math.abs(e.clientY - py);
    last = [e.clientX, e.clientY];
    apply();
  });
  const release = () => { dragging = false; stage.classList.remove('turning'); };
  stage.addEventListener('pointerup', release);
  stage.addEventListener('pointercancel', release);
  /* A drag that ends on a muscle should not also be a tap on it. */
  stage.addEventListener('click', (e) => { if (moved > 8) e.stopPropagation(); }, true);

  /* Keyboard, because a figure you can only reach by dragging is a figure
     some people cannot reach at all. */
  stage.tabIndex = 0;
  stage.setAttribute('role', 'img');
  stage.addEventListener('keydown', (e) => {
    const step = e.shiftKey ? 45 : 15;
    if (e.key === 'ArrowLeft') spin -= step;
    else if (e.key === 'ArrowRight') spin += step;
    else if (e.key === 'ArrowUp') tilt = Math.max(-38, tilt - 8);
    else if (e.key === 'ArrowDown') tilt = Math.min(38, tilt + 8);
    else return;
    e.preventDefault();
    apply();
    clearTimeout(idleTimer); stopIdle();     /* a steered figure steers itself no longer */
  });

  if (move) perform(move, { ms: move.ms || ms, still });

  return {
    node: stage, setHeat, setPose, perform, stop,
    turn: (deg) => { spin = deg; apply(); },
    /** called by the owner when the figure leaves the screen */
    dispose: () => { clearTimeout(idleTimer); cancelAnimationFrame(idleRaf); stop(); },
  };
}
