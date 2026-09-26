/* ============ FitYar — motion ============
   Numbers that move when they change, and the small bits of feedback that
   tell you a thing landed.

   Everything here is a no-op when the phone asks for less motion, or when the
   user has turned effects off in settings. A tracker is used several times a
   day, every day; motion that cannot be switched off stops being delight and
   becomes noise. */

const reduceQ = window.matchMedia?.('(prefers-reduced-motion: reduce)');
let fxOn = true;
/** Settings owns the effects switch; this keeps motion in step with it. */
export const setMotion = (v) => { fxOn = !!v; };
export const motionOff = () => !fxOn || !!reduceQ?.matches;

/* The last value each counter showed. Keyed by a caller-supplied name rather
   than the element, because the home screen rebuilds its macro cells on every
   render - a new element each time, but the same number to the reader. */
const shown = new Map();
const running = new WeakMap();

const easeOut = (t) => 1 - Math.pow(1 - t, 3);

/**
 * Count an element from what it last showed to `to`.
 *
 * The formatter does the writing, so Persian digits, separators and units stay
 * exactly as the rest of the app renders them - this never formats a number
 * itself. Returns nothing; it is fire-and-forget by design.
 */
export function countTo(el, to, { key = null, format = String, ms = 0 } = {}) {
  if (!el) return;
  const id = key || el.id || null;
  const prev = id && shown.has(id) ? shown.get(id) : null;
  if (id) shown.set(id, to);

  running.get(el)?.();            // a second render mid-count wins
  /* First sight of this number, motion is unwanted, or the page is not being
     drawn at all: just show it. Counting up from nothing on every visit to
     the screen would be theatre, and a count that cannot run would freeze
     partway and leave a wrong total on screen. */
  if (prev === null || prev === to || motionOff() || document.hidden) {
    el.textContent = format(to);
    return;
  }

  const span = Math.abs(to - prev);
  /* Logging a meal is an occasional action, which puts this in the 200-500ms
     band. A bigger jump earns a little more time to be read, but not much:
     past half a second a counting number stops being feedback and starts
     being something you wait for. */
  const dur = ms || Math.min(500, 220 + span * 0.55);
  const t0 = performance.now();
  let raf = 0;
  /* hidden mid-count: land on the real number rather than freezing partway */
  const onHide = () => { if (document.hidden) finish(); };
  /* Cancelling has to unhook the listener as well, or a count superseded by
     the next render leaves one attached for the life of the page. */
  const cancel = () => {
    cancelAnimationFrame(raf);
    document.removeEventListener('visibilitychange', onHide);
  };
  const finish = () => { cancel(); running.delete(el); el.textContent = format(to); };
  running.set(el, cancel);
  document.addEventListener('visibilitychange', onHide);

  const step = (now) => {
    const t = Math.min(1, (now - t0) / dur);
    el.textContent = format(prev + (to - prev) * easeOut(t));
    if (t < 1) raf = requestAnimationFrame(step);
    else finish();
  };
  raf = requestAnimationFrame(step);
}

/**
 * Fill a progress bar to `fraction` of its track.
 *
 * Scales rather than resizing, because width is a layout property and a bar
 * that grows on every frame - the rest timer runs for minutes - would run
 * layout with it. The track clips the rounded ends, so it looks the same.
 *
 * The bar is usually a brand-new element sitting at its start value, which
 * gives a CSS transition nothing to move from; waiting a frame gives it two
 * values. A page that is not being drawn gets no frames, so there the value
 * is set outright - otherwise the bar stays empty until something redraws it.
 */
export function growTo(el, fraction) {
  if (!el) return;
  const to = `scaleX(${Math.max(0, Math.min(1, fraction))})`;
  if (motionOff() || document.hidden) { el.style.transform = to; return; }
  requestAnimationFrame(() => { el.style.transform = to; });
}

/** Forget what a counter showed, so the next render sets it without counting. */
export const resetCount = (key) => { shown.delete(key); };

/**
 * A short squash-and-settle on an element that just took on a new value.
 * Sized to be felt rather than watched.
 */
export function pop(el, { scale = 1.06, from = 1, duration = 300 } = {}) {
  /* Nothing to animate, motion is unwanted, or the page is not being drawn:
     a pop on a hidden tab is a frame budget spent on nobody. */
  if (!el || motionOff() || !el.animate || document.hidden) return;
  el.animate(
    [{ transform: `scale(${from})` },
     { transform: `scale(${scale})`, offset: 0.42 },
     { transform: 'scale(1)' }],
    { duration, easing: 'cubic-bezier(.34,1.56,.64,1)' },
  );
}

/**
 * Send a label flying from one element to another - "+۳۰۱" leaving the food
 * you just logged and landing on the calorie ring, so the number that changes
 * is visibly the one you changed.
 *
 * The chip is positioned in viewport coordinates on <body>, so it is not
 * clipped by the scrolling card it started inside.
 *
 * `from` may be an element or a rectangle from one, so a chip can still start
 * where a button was after that button has gone away.
 */
export function flyTo(from, to, text, { cls = '' } = {}) {
  /* document.hidden matters as much as the motion preference here: a paused
     animation never finishes, and the chip is only removed when it does. */
  if (!from || !to || motionOff() || document.hidden || !document.body.animate) {
    return Promise.resolve();
  }
  /* `from` may be a plain rectangle: the button that was pressed is often gone
     by the time the screen behind the sheet is visible again. */
  const a = from.getBoundingClientRect ? from.getBoundingClientRect() : from;
  const b = to.getBoundingClientRect();
  if (!a.width || !b.width) return Promise.resolve();

  const chip = document.createElement('div');
  chip.className = 'fly-chip ' + cls;
  chip.textContent = text;
  chip.style.cssText = `position:fixed;left:${a.left + a.width / 2}px;top:${a.top + a.height / 2}px;`;
  document.body.append(chip);

  const dx = (b.left + b.width / 2) - (a.left + a.width / 2);
  const dy = (b.top + b.height / 2) - (a.top + a.height / 2);
  const anim = chip.animate([
    { transform: 'translate(-50%,-50%) scale(.6)', opacity: 0 },
    { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: 0.18 },
    { transform: `translate(calc(-50% + ${dx * 0.55}px),calc(-50% + ${dy * 0.5 - 26}px)) scale(1)`,
      opacity: 1, offset: 0.62 },
    { transform: `translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.45)`, opacity: 0 },
  ], { duration: 560, easing: 'cubic-bezier(.23,1,.32,1)' });

  /* if the page goes away mid-flight, take the chip with it */
  const clear = () => {
    chip.remove();
    document.removeEventListener('visibilitychange', onHide);
  };
  const onHide = () => { if (document.hidden) { anim.cancel(); clear(); } };
  document.addEventListener('visibilitychange', onHide);
  return anim.finished.catch(() => {}).then(clear);
}

/* ============================================================
   staggerIn — cards arrive one after another when a screen opens.
   A transform+opacity animation only, gated behind the same
   motion switch as everything else; honors reduced motion by
   doing nothing. Cheap enough to run on every tab switch.
   ============================================================ */
export function staggerIn(root, selector = '.card, .row-btn, .kv', step = 45) {
  if (motionOff() || !root) return;
  const items = root.querySelectorAll(selector);
  items.forEach((n, i) => {
    if (i > 11) return;                       // enough; the rest just appear
    n.style.opacity = '0';
    n.style.transform = 'translateY(14px)';
    n.style.transition = 'none';
    setTimeout(() => {
      n.style.transition = 'opacity .38s ease, transform .38s cubic-bezier(.2,.8,.2,1)';
      n.style.opacity = '';
      n.style.transform = '';
      setTimeout(() => { n.style.transition = ''; }, 420);
    }, 40 + i * step);
  });
}
