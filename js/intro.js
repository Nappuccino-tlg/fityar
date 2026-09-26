/* ============ FitYar — what this screen is for ============

   The first time a section is opened it explains itself, once, and then
   never again. Not a tour that blocks the app before you have seen it, and
   not a tooltip that reappears every visit: a card at the top of the screen
   you can read or dismiss, in the place where the answer is needed.

   Three sentences at most. Someone who has just arrived at a screen wants to
   know what it is for and what the one useful thing to do here is; anything
   longer is a manual, and nobody reads a manual to log a sandwich.

   Which have been seen is one record in `meta`, so the whole thing is one
   read at boot and one write per dismissal. Restoring them is a single
   delete, which is what makes "show the guides again" a real setting rather
   than a promise.
*/

import * as db from './db.js';
import { t, getLang } from './i18n.js';
import { el } from './ui.js';
import { lineIcon } from './icons.js';

/* The screens that are worth explaining, with the colour each already wears
   in the tab bar — so the card belongs to its section on sight.

   Every glyph here has to exist in the outline set: `lineIcon` answers null
   for a name it does not have, and appending null throws, so a made-up
   glyph is a screen that cannot open. tools/test-intro.mjs checks them. */
export const INTROS = {
  home: { glyph: 'plate', tone: 'var(--acc)', offline: 'full' },
  diary: { glyph: 'book', tone: 'var(--orange)', offline: 'full' },
  train: { glyph: 'bars', tone: 'var(--blue)', offline: 'full' },
  progress: { glyph: 'chart', tone: 'var(--purple)', offline: 'full' },
  globe: { glyph: 'globe', tone: 'var(--cyan,var(--blue))', offline: 'full' },
  chat: { glyph: 'chat', tone: 'var(--pink)', offline: 'full' },
  /* Not 'full': the account and the smart programme both need the network,
     and a blanket "works offline" here would be untrue. */
  more: { glyph: 'search', tone: 'var(--teal)', offline: 'mostly' },
  /* Not in the tab bar, but a screen you can land on is a screen that
     should say what it is — these are reached from a button and used to
     open with no explanation at all. */
  program: { glyph: 'book', tone: 'var(--acc)', offline: 'full' },
  plan: { glyph: 'star', tone: 'var(--purple)', offline: 'mostly' },
  reports: { glyph: 'clock', tone: 'var(--orange)', offline: 'full' },
};

const KEY = 'introsSeen';
let seen = null;                      // loaded once, kept in memory

async function load() {
  if (seen) return seen;
  const raw = await db.metaGet(KEY, null);
  seen = new Set(Array.isArray(raw) ? raw : []);
  return seen;
}
const save = () => db.metaSet(KEY, [...seen]);

/** Has this screen introduced itself yet? */
export async function introSeen(screen) {
  return (await load()).has(screen);
}

/** Forget them all, so every screen explains itself again. */
export async function resetIntros() {
  seen = new Set();
  await save();
}

/** How many are still to come, for the settings row to say so. */
export async function introsLeft() {
  const s = await load();
  return Object.keys(INTROS).filter((k) => !s.has(k)).length;
}

/**
 * Put the card at the top of a screen, if this screen has not spoken yet.
 *
 * Returns nothing and throws nothing: a screen that cannot introduce itself
 * is a screen that simply opens, which is the correct failure.
 */
export async function introFor(screen) {
  const spec = INTROS[screen];
  if (!spec) return;
  const host = document.getElementById('screen-' + screen);
  if (!host) return;
  host.querySelector('.intro')?.remove();

  const s = await load();
  if (s.has(screen)) return;

  const fa = getLang() === 'fa';
  const card = el('div', { class: 'intro', style: `--tone:${spec.tone}` },
    el('span', { class: 'intro-ic' }, lineIcon(spec.glyph, { size: 19 })),
    el('div', { class: 'intro-txt' },
      el('b', {}, t('intro_' + screen + '_title')),
      el('p', {}, t('intro_' + screen + '_body')),
      /* Whether this screen needs a connection, said on every one of them
         so nobody has to wonder, and said per screen so it stays true. */
      el('span', { class: 'intro-off' },
        lineIcon('check', { size: 13 }),
        t(spec.offline === 'full' ? 'worksOffline' : 'worksMostlyOffline'))),
    el('button', {
      class: 'intro-go',
      'aria-label': fa ? 'بستن راهنما' : 'Dismiss',
      onclick: async () => {
        seen.add(screen);
        await save();
        /* Out rather than gone: a card that vanishes under the finger makes
           people wonder what they just did. */
        if (card.animate && !document.hidden) {
          card.animate([
            { opacity: 1, transform: 'none', maxHeight: card.offsetHeight + 'px' },
            { opacity: 0, transform: 'translateY(-6px)', maxHeight: '0px' },
          ], { duration: 260, easing: 'cubic-bezier(.4,0,1,1)' })
            .finished.catch(() => {}).then(() => card.remove());
        } else {
          card.remove();
        }
      },
    }, t('gotIt')),
  );

  host.prepend(card);
}
