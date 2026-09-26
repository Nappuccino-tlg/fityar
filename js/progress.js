/* ============ Progress: weight, measurements, nutrition & strength trends ============ */
import * as db from './db.js';
import { S, kgToDisp, dispToKg, wUnit, cmToDisp, dispToCm, lUnit, usesTargetWeight } from './store.js';
import { t, num, pick, getLang } from './i18n.js';
import {
  $, el, sheet, closeSheet, confirmSheet, toast, field, input, select,
  round, sum, parseNum, todayKey, addDays, shortDate, longDate, dateKey, daysBetween, keyToDate,
  lineChart, barChart, macroBar,
} from './ui.js';
import { rankState, XP_RULES, xpForLevel } from './xp.js';
import { bodyPeriods, sparkPoints, driftOf, persianMonthId } from './timeline.js';
import { icon } from './icons.js';
import { totals } from './nutrition.js';
import { allWorkouts, workoutVolume, records, exName, openRecords } from './workouts.js';
import { renderReports, dayStatusMap, STATUS_COLOR } from './report.js';
import { emptyArt, svgNode, svgRoot } from './art.js';
import { medal3d } from './art3d.js';
import { motionOff } from './motion.js';

export const renderReportsInline = () => renderReports('#ptab-reports');

const MEASURE_FIELDS = ['neck', 'shoulders', 'chest', 'arm', 'waist', 'hips', 'thigh', 'calf', 'bodyFat'];

/* ---------------- range ---------------- */

/* Named once, so the weight chart and the calorie chart cannot drift apart. */
export const RANGES = [
  { id: '7d', days: 7, fa: '۷ روز', en: '7D' },
  { id: '30d', days: 30, fa: '۳۰ روز', en: '30D' },
  { id: '3m', days: 90, fa: '۳ ماه', en: '3M' },
  { id: '6m', days: 180, fa: '۶ ماه', en: '6M' },
  { id: '1y', days: 365, fa: '۱ سال', en: '1Y' },
  { id: 'all', days: null, fa: 'همه', en: 'All' },
];
let RANGE = '30d';
const rangeDays = () => RANGES.find((r) => r.id === RANGE)?.days ?? null;

/** The picker itself. Small, because it is a control and not the content. */
function rangePicker(onPick) {
  const fa = getLang() === 'fa';
  return el('div', { class: 'seg tight range-seg' }, ...RANGES.map((r) =>
    el('button', {
      class: 'seg-btn' + (RANGE === r.id ? ' active' : ''),
      onclick: () => { if (RANGE !== r.id) { RANGE = r.id; onPick(); } },
    }, fa ? r.fa : r.en)));
}

/**
 * Thin a daily series down to something a small chart can draw.
 *
 * Averaged into buckets rather than sampled: dropping four days in five
 * makes the line jump between whichever mornings happened to survive, while
 * an average over a week is both smoother and a truer reading of a body's
 * weight than any single morning.
 */
/** How many readings go into one plotted point, given how many there are. */
export const bucketWidth = (n, maxPoints = 30) =>
  (n <= maxPoints ? 1 : Math.ceil(n / maxPoints));

/** Average every `per` readings into one point. */
export function bucketBy(points, per) {
  if (per <= 1) return points;
  const out = [];
  for (let i = 0; i < points.length; i += per) {
    const slice = points.slice(i, i + per);
    const real = slice.filter((p) => p.y !== null && p.y !== undefined);
    out.push({
      /* The middle of the window, not its end.

         This used to be slice.at(-1), so a point that was the average of
         three days wore the third day's date — and the date under a mark
         said something that was not true of that date. A mean over a window
         belongs where the window's middle is, which is also where it sits
         on the time axis. */
      x: slice[Math.floor((slice.length - 1) / 2)].x,
      y: real.length ? real.reduce((n, p) => n + p.y, 0) / real.length : null,
      dim: !real.length,
    });
  }
  return out;
}

export const bucketSeries = (points, maxPoints = 30) =>
  bucketBy(points, bucketWidth(points.length, maxPoints));

/** Whole weeks, and as many of them as read cleanly across a phone.

    A long range has to be averaged — ninety days of calories at one point
    per day is three pixels a point, and what people eat swings forty per
    cent overnight, so it draws as a picket fence with no trend in it. The
    window is whole weeks rather than "however many days it takes to fit",
    because a week is a unit someone recognises and the note under the
    chart then says a number that means something. Past about a year it
    doubles and trebles, still in weeks. */
const weeklyWindow = (days) => Math.max(7, Math.ceil(days / 420) * 7);

/* Where a bar chart stops being honest and a line takes over.

   Thirty-one is a month: at a phone's width that is bars about nine pixels
   apart, which is the last point at which a bar is still a thing you can
   point at, and every bar is still one day. */
const BARS_MAX = 31;

/* ---------------- body tab ---------------- */

/* ---------------- rank ---------------- */

/**
 * Level, progress into it, and what has been done to earn it.
 *
 * Everything shown is derived from the database on each render, so it can
 * never disagree with the training log. There is no counter to drift.
 */
export async function renderRank() {
  const host = $('#rank-card');
  if (!host) return;
  const r = await rankState();
  const fa = getLang() === 'fa';
  const unlocked = r.achievements.filter((a) => a.done).length;

  const fact = (value, label) => el('div', { class: 'rk-fact' },
    el('b', {}, value), el('span', {}, label));

  /* The medal is not a drawing pinned to the card; it is an object on a
     stage. The counterweight is the medal's shadow, the ribbon swings with
     the same motion the disc rocks against, and nothing here runs if motion
     is off — the drawing arrives at rest and simply waits. */
  const medalBox = el('div', { class: 'rk-medal' });
  const rock = () => {
    if (motionOff() || !medalBox.animate) return;
    medalBox.animate(
      [{ transform: 'rotate(-5deg)' },
       { transform: 'rotate(4deg)', offset: .3 },
       { transform: 'rotate(-2.5deg)', offset: .58 },
       { transform: 'rotate(1.5deg)', offset: .8 },
       { transform: 'rotate(0deg)' }],
      { duration: 5200, easing: 'cubic-bezier(.45,0,.55,1)', fill: 'both' });
  };
  rock();
  /* re-rock it once when the tab becomes visible again; a medal that rocks
     only once per session still feels alive, not looped */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && document.contains(medalBox)) rock();
  });

  medalBox.append(el('div', { class: 'rk-medal-swing' }, medal3d()));
  host.replaceChildren(el('div', { class: 'card rank-card' },
    el('div', { class: 'rk-hero' },
      medalBox,
      el('div', { class: 'rk-hero-txt' },
        el('div', { class: 'rk-level' },
          el('span', {}, t('level')), el('b', {}, num(r.level))),
        el('div', { class: 'rk-meta' },
          el('b', {}, `${num(r.xp)} ${t('xp')}`),
          el('span', {}, `${num(r.toNext)} ${t('xpToNext')}`)))),

    el('div', { class: 'rk-track' }, el('i', { style: `width:${(r.fraction * 100).toFixed(1)}%` })),

    el('div', { class: 'rk-facts' },
      fact(num(r.facts.workouts), t('workouts')),
      fact(num(r.facts.sets), t('muscleSetsShort')),
      fact(num(r.facts.prs), t('records')),
      fact(num(r.facts.bestStreak), t('streakBest'))),

    el('div', { class: 'btn-row', style: 'margin-top:12px' },
      el('button', { class: 'btn ghost', onclick: () => openAchievements(r) },
        `${t('achievements')} · ${num(unlocked)} ${t('outOf')} ${num(r.achievements.length)}`),
      el('button', { class: 'btn ghost', onclick: () => openMedalShelf(r) }, '🏆 ' + t('medalShelf')),
      el('button', { class: 'btn ghost', onclick: () => openRecords() }, t('myRecords'))),
  ));
}

/**
 * The ladder behind the level number.
 *
 * A bare "L1" on a card is a number with nothing to measure itself against.
 * This is what it is measured against: the levels above it and what each
 * one costs, with the one you are on marked and the bar showing how far
 * through it you are.
 *
 * It stops ten above where you are. The curve runs to 99 and printing all
 * of them would be a wall of arithmetic rather than a list - the ones worth
 * seeing are the one you are on and the few you can imagine reaching.
 */
export async function openLevels() {
  const r = await rankState();
  const fa = getLang() === 'fa';
  const top = Math.min(99, r.level + 9);

  const rows = [];
  for (let lv = 1; lv <= top; lv++) {
    const need = xpForLevel(lv);
    const here = lv === r.level;
    rows.push(el('div', { class: 'lv-row' + (here ? ' on' : '') + (lv < r.level ? ' past' : '') },
      el('b', { class: 'lv-n' }, num(lv)),
      el('div', { class: 'lv-mid' },
        el('span', {}, lv === 1
          ? (fa ? 'از همین‌جا شروع می‌شود' : 'Where everyone starts')
          : `${num(need)} ${t('xp')}`),
        here ? el('div', { class: 'lv-track' },
          el('i', { style: `width:${(r.fraction * 100).toFixed(1)}%` })) : null),
      here ? el('span', { class: 'lv-tag' }, `${num(r.toNext)} ${t('xpToNext')}`)
        : (lv < r.level ? el('span', { class: 'lv-tick' }, '✓') : null)));
  }

  /* How experience is earned, because a ladder with no rungs named is a
     list of numbers going up. */
  const how = el('div', { class: 'lv-how' },
    el('b', {}, fa ? 'امتیاز از کجا می‌آید' : 'Where experience comes from'),
    ...XP_RULES.map((rule) => el('div', { class: 'lv-rule' },
      el('span', {}, fa ? rule.fa : rule.en),
      el('b', {}, `${num(rule.xp)} ${t('xp')}`))));

  sheet(t('level') + ' ' + num(r.level), el('div', {},
    el('div', { class: 'lv-list' }, ...rows),
    how,
    el('button', {
      class: 'btn ghost full', style: 'margin-top:12px',
      onclick: () => { closeSheet(); openAchievements(r); },
    }, `${t('achievements')} · ${num(r.achievements.filter((a) => a.done).length)} ${t('outOf')} ${num(r.achievements.length)}`)));
}

/* ============================================================
   MEDAL SHELF 🏆 — the ten badges as real objects
   Two wooden boards under warm light; every earned badge is a
   shaded 3D medal standing on the shelf with its own shadow.
   The list version stays in the sheet — this is the showcase.
   ============================================================ */

export async function openMedalShelf() {
  const r = await rankState();
  const rows = [];
  const onShelf = r.achievements.filter(a => a.done);
  const locked = r.achievements.filter(a => !a.done);

  const board = (items) => {
    const shelf = el('div', { class: 'shelf-board' });
    items.forEach(a => {
      const m = el('div', { class: 'shelf-medal' }, medal3d(),
        el('b', {}, getLang() === 'fa' ? a.fa : a.en));
      shelf.append(m);
    });
    return shelf;
  };

  if (onShelf.length) {
    rows.push(el('div', { class: 'shelf-row' }, board(onShelf.slice(0, 4)), board(onShelf.slice(4, 8)), board(onShelf.slice(8))));
  } else {
    /* an empty trophy room still has a shelf: the next three badges stand
       there as grey silhouettes, each labelled with how far along it is */
    const next3 = locked.slice(0, 3);
    const ghost = el('div', { class: 'shelf-board shelf-ghost' });
    next3.forEach(a => ghost.append(el('div', { class: 'shelf-medal' },
      medal3d(), el('b', {}, `${num(Math.min(a.at, a.of))}/${num(a.of)}`))));
    rows.push(el('div', { class: 'shelf-row' }, ghost));
  }
  if (locked.length) {
    rows.push(el('div', { class: 'shelf-locked' },
      ...locked.map(a => el('div', { class: 'shelf-locked-item' },
        el('span', { class: 'shelf-locked-ic' }, icon(a.glyph, { size: 18 })),
        el('span', {}, getLang() === 'fa' ? a.fa : a.en),
        el('b', {}, `${num(Math.min(a.at, a.of))}/${num(a.of)}`)))));
  }
  rows.push(el('div', { class: 'ms-note' }, t('medalShelfHint')));

  sheet(t('medalShelf'), el('div', { class: 'shelf-wrap' }, ...rows));
}

/** The ten, earned and not. */
function openAchievements(r) {
  const fa = getLang() === 'fa';
  const rows = r.achievements.map((a) => el('div', { class: 'ach' + (a.done ? ' on' : '') },
    el('span', { class: 'ach-ic' }, icon(a.glyph, { size: 20, cls: a.done ? 'ic-lift' : '' })),
    el('div', { class: 'ach-txt' },
      el('b', {}, fa ? a.fa : a.en),
      /* An unearned one shows how far along you are: "41 of 100 sets" is a
         reason to train and a padlock is not. */
      a.done ? null
        : el('span', {}, `${num(Math.min(a.at, a.of))} ${t('outOf')} ${num(a.of)}`)),
    a.done ? el('span', { class: 'ach-tick' }, icon('check', { size: 17 })) : null,
  ));

  sheet(t('achievements'), el('div', { class: 'ach-list' },
    ...rows,
    el('div', { class: 'ms-note', style: 'margin-top:14px' }, t('xpNote')),
    el('div', { class: 'xp-rules' },
      ...XP_RULES.map((x) => el('div', {},
        el('span', {}, fa ? x.fa : x.en),
        el('b', {}, `+${num(x.xp)}`)))),
  ));
}

export async function renderBody() {
  const ws = (await db.all('weights')).sort((a, b) => a.date < b.date ? -1 : 1);
  const host = $('#weight-chart');
  const picker = $('#weight-range');
  if (picker) picker.replaceChildren(rangePicker(() => { renderBody(); renderNutriTrends(); }));

  if (ws.length) {
    /* the line starts at the very first weigh-in, never before it */
    const days = rangeDays();
    const from = days === null ? null : addDays(todayKey(), -(days - 1));
    const inRange = from === null ? ws : ws.filter((w) => w.date >= from);
    /* A range with nothing in it would draw an empty box and look broken, so
       it falls back to everything there is and says so by simply showing it. */
    const last = inRange.length >= 2 ? inRange : ws;
    const showTarget = usesTargetWeight() && S.profile.targetWeight;
    lineChart(host, bucketSeries(
      last.map(w => ({ x: shortDate(w.date), y: round(kgToDisp(w.kg), 1) })),
    ).map(p => ({ ...p, y: p.y === null ? null : round(p.y, 1) })), {
      color: '#3ddc84',
      goal: showTarget ? round(kgToDisp(S.profile.targetWeight), 1) : null,
    });
    /* The figures below the chart describe the range on screen, not all of
       history: a "change" of -9kg under a seven-day chart is a lie. */
    const first = last[0].kg, cur = last.at(-1).kg;
    const diff = cur - first;
    /* when the scale is not the target, weekly rate of change is the useful number */
    const spanDays = Math.max(1, Math.abs(daysBetween(last[0].date, last.at(-1).date)));
    const perWeek = last.length > 1 ? diff / spanDays * 7 : 0;
    const gainGoal = !usesTargetWeight();
    const good = gainGoal ? diff >= 0 : diff <= 0;

    $('#weight-stats').replaceChildren(
      el('div', {}, el('b', {}, num(round(kgToDisp(first), 1), 1)), el('span', {}, `${t('start')} (${wUnit()})`)),
      el('div', {}, el('b', {}, num(round(kgToDisp(cur), 1), 1)), el('span', {}, `${t('current')} (${wUnit()})`)),
      el('div', {}, el('b', { style: `color:${good ? 'var(--acc)' : 'var(--orange)'}` },
        (diff > 0 ? '+' : '') + num(round(kgToDisp(diff), 1), 1)), el('span', {}, t('change'))),
      showTarget
        ? el('div', {}, el('b', {}, num(round(kgToDisp(S.profile.targetWeight), 1), 1)),
            el('span', {}, t('targetWeight')))
        : el('div', {}, el('b', { style: 'color:var(--blue)' },
              (perWeek > 0 ? '+' : '') + num(round(kgToDisp(perWeek), 2), 2)),
            el('span', {}, t('perWeek'))),
    );
  } else {
    host.replaceChildren(emptyArt('scale', t('empty'),
      getLang() === 'fa' ? 'اولین وزنت را ثبت کن' : 'Log your first weigh-in', 'var(--acc)'));
    $('#weight-stats').replaceChildren();
  }

  await renderTimeline($('#body-timeline'));

  const ms = (await db.all('measurements')).sort((a, b) => a.date < b.date ? 1 : -1);
  const mHost = $('#measure-list');
  mHost.replaceChildren();
  if (!ms.length) {
    mHost.append(emptyArt('scale', t('noMeasures'), t('noMeasuresHint'), 'var(--teal)', {
      label: t('logMeasurements'), onClick: openMeasureLog,
    }));
    return;
  }

  const latest = ms[0];
  const prev = ms[1];
  for (const f of MEASURE_FIELDS) {
    if (latest[f] === undefined || latest[f] === null || latest[f] === '') continue;
    const unit = f === 'bodyFat' ? '%' : lUnit();
    const v = f === 'bodyFat' ? latest[f] : round(cmToDisp(latest[f]), 1);
    let delta = null;
    if (prev && prev[f] !== undefined && prev[f] !== null && prev[f] !== '') {
      const d = latest[f] - prev[f];
      delta = (d > 0 ? '+' : '') + num(round(f === 'bodyFat' ? d : cmToDisp(d), 1), 1);
    }
    mHost.append(el('div', { class: 'kv' },
      el('span', {}, t(f)),
      el('b', {}, `${num(v, 1)} ${unit}`, delta ? el('span', { class: 'muted', style: 'margin-inline-start:8px;font-size:var(--t-sm)' }, delta) : null),
    ));
  }
  mHost.append(el('div', { class: 'muted', style: 'margin-top:10px;font-size:var(--t-sm)' }, longDate(latest.date)));
}

/* ---------------- the body's story ---------------- */

const DRIFT_TONE = { toward: 'var(--acc)', away: 'var(--orange)', flat: 'var(--blue)', none: 'var(--tx3)' };

/** The period's own name, in the reader's calendar. */
function periodLabel(row) {
  const loc = getLang() === 'fa' ? 'fa-IR' : 'en-US';
  if (row.unit === 'month') {
    /* Month then year, in both languages. Left to the locale's own pattern
       this came out "۱۴۰۵ شهریور", which is not how Persian writes a date. */
    try {
      const parts = new Intl.DateTimeFormat(loc, { month: 'long', year: 'numeric' })
        .formatToParts(keyToDate(row.endKey));
      const get = (type) => parts.find((x) => x.type === type)?.value || '';
      return `${get('month')} ${get('year')}`;
    } catch { return row.startKey.slice(0, 7); }
  }
  /* A range rather than a week number: nobody knows what week 38 was. */
  return `${shortDate(row.startKey)} ${t('toDate')} ${shortDate(row.endKey)}`;
}

/** "three months with nothing logged" — built from parts, since t() has none. */
function gapText(row) {
  const one = row.spans === 1;
  const unit = t(row.unit === 'week' ? (one ? 'weekWord' : 'weeksWord')
                                     : (one ? 'monthWord' : 'monthsWord'));
  return `${num(row.spans)} ${unit} ${t('nothingLogged')}`;
}

/** The little line inside a row, drawn from the period's own weigh-ins. */
function spark(weights, tone) {
  const pts = sparkPoints(weights);
  if (pts.length < 2) return null;
  const W = 72, H = 26, pad = 3;
  const d = pts.map((p, i) => `${i ? 'L' : 'M'}${(pad + p.x * (W - pad * 2)).toFixed(1)} ${(pad + p.y * (H - pad * 2)).toFixed(1)}`).join(' ');
  const last = pts[pts.length - 1];
  return svgRoot(`0 0 ${W} ${H}`, { class: 'tl-spark', 'aria-hidden': 'true' },
    svgNode('path', { d, fill: 'none', stroke: tone, 'stroke-width': 2,
      'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
    svgNode('circle', { cx: (pad + last.x * (W - pad * 2)).toFixed(1),
      cy: (pad + last.y * (H - pad * 2)).toFixed(1), r: 2.6, fill: tone }));
}

const signed = (v, digits = 1) => (v > 0 ? '+' : v < 0 ? '−' : '') + num(round(Math.abs(v), digits), digits);

/**
 * The body's story on the Body tab.
 *
 * Read-only: every tap here opens something that already exists rather than
 * offering a second way to edit the same record.
 */
export async function renderTimeline(host) {
  if (!host) return;
  const [weights, measurements, photos] = await Promise.all([
    db.all('weights'), db.all('measurements'), db.all('bodyPhotos'),
  ]);

  const fa = getLang() === 'fa';
  const rows = bodyPeriods({ weights, measurements, photos }, {
    today: todayKey(),
    firstDay: S.settings?.firstDay ?? 6,
    monthOf: fa ? persianMonthId : undefined,
  });

  host.replaceChildren();
  if (!rows.length) {
    host.append(emptyArt('scale', t('noStoryYet'), t('noStoryHint'), 'var(--teal)'));
    return;
  }

  const down = usesTargetWeight();

  /* Which period holds the extreme, worked out once. The very first period
     is skipped: a first weigh-in is both the lightest and the heaviest there
     has ever been, and is neither. */
  const scored = rows.filter((r) => !r.quiet && r.endKg !== null);
  const candidates = scored.slice(0, Math.max(0, scored.length - 1));
  const extreme = candidates.reduce((best, r) => {
    const v = down ? r.low : r.high;
    if (best === null) return r;
    const bv = down ? best.low : best.high;
    return (down ? v < bv : v > bv) ? r : best;
  }, null);
  const extremeKey = extreme ? extreme.startKey : null;

  const track = el('div', { class: 'tl' });

  for (const row of rows) {
    if (row.quiet) {
      track.append(el('div', { class: 'tl-row quiet' },
        el('i', { class: 'tl-node hollow' }),
        el('div', { class: 'tl-gap' }, gapText(row))));
      continue;
    }

    const drift = driftOf(row.delta, { down });
    const tone = DRIFT_TONE[drift];
    const body = el('div', { class: 'tl-body' });

    body.append(el('div', { class: 'tl-head' },
      el('b', {}, periodLabel(row)),
      row.delta !== null
        ? el('span', { class: 'tl-delta', style: `color:${tone}` },
            `${signed(kgToDisp(row.delta))} ${wUnit()}`)
        : null));

    if (row.endKg !== null) {
      body.append(el('div', { class: 'tl-weight' },
        spark(row.weights, tone),
        el('div', { class: 'tl-kg' },
          el('b', {}, `${num(round(kgToDisp(row.endKg), 1), 1)}`),
          el('span', {}, wUnit())),
        el('span', { class: 'tl-count' },
          `${num(row.weights.length)} ${t(row.weights.length === 1 ? 'weighInOne' : 'weighIns')}`)));
    }

    /* One badge, on the one period that holds the extreme. Marking every
       new low puts it on every row of a steady cut, and a label that is
       always there is read as decoration rather than as a fact. */
    if (extremeKey !== null && row.startKey === extremeKey) {
      body.append(el('div', { class: 'tl-marks' },
        el('span', { class: 'tl-mark' },
          icon('scale', { size: 14 }), t(down ? 'lightest' : 'heaviest'))));
    }

    if (row.changes.length) {
      body.append(el('div', { class: 'tl-tape' }, ...row.changes.slice(0, 4).map((c) => {
        const unit = c.field === 'bodyFat' ? '%' : lUnit();
        const shown = c.field === 'bodyFat' ? c.delta : cmToDisp(c.delta);
        /* The waist going down and the arm going up are both good news; the
           app does not know which one the reader wanted, so neither is green. */
        return el('span', { class: 'tl-chip' },
          el('i', {}, t(c.field)), `${signed(shown)} ${unit}`);
      })));
    }

    if (row.photos.length) {
      const strip = el('div', { class: 'tl-shots' });
      for (const p of row.photos.slice(0, 5)) {
        const url = URL.createObjectURL(p.blob);
        strip.append(el('button', {
          class: 'tl-shot',
          'aria-label': shortDate(p.date),
          onclick: async () => (await import('./tools.js')).openPhotoById(p.id),
        }, el('img', { src: url, loading: 'lazy', alt: '' })));
      }
      if (row.photos.length > 5) {
        strip.append(el('span', { class: 'tl-more' }, `+${num(row.photos.length - 5)}`));
      }
      body.append(strip);
    }

    track.append(el('div', { class: 'tl-row' },
      el('i', { class: 'tl-node', style: `--node:${tone}` }), body));
  }

  host.append(track);
}

export function openWeightLog() {
  const dIn = input({ type: 'date', value: todayKey() });
  const wIn = input({ type: 'number', inputmode: 'decimal', step: '0.1',
    value: round(kgToDisp(S.profile.weight), 1) });
  const body = el('div', {},
    field(t('weight') + ` (${wUnit()})`, wIn),
    field(t('today'), dIn),
    el('button', { class: 'btn full', onclick: async () => {
      const v = parseNum(wIn.value);
      if (v <= 0) return toast(t('error'), 'err');
      const kg = dispToKg(v);
      await db.put('weights', { date: dIn.value || todayKey(), kg: round(kg, 2) });
      S.profile.weight = round(kg, 2);
      const { saveProfile, applyAutoGoals } = await import('./store.js');
      await saveProfile();
      if (S.goals.auto) await applyAutoGoals();
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('weight'), body);
}

export async function openMeasureLog() {
  const ms = (await db.all('measurements')).sort((a, b) => a.date < b.date ? 1 : -1);
  const last = ms[0] || {};
  const dIn = input({ type: 'date', value: todayKey() });
  const inputs = {};
  const grid = el('div', {});
  for (const f of MEASURE_FIELDS) {
    const unit = f === 'bodyFat' ? '%' : lUnit();
    const v = last[f] === undefined || last[f] === null || last[f] === ''
      ? '' : (f === 'bodyFat' ? last[f] : round(cmToDisp(last[f]), 1));
    inputs[f] = input({ type: 'number', inputmode: 'decimal', step: '0.1', value: v, placeholder: '—' });
    grid.append(field(`${t(f)} (${unit})`, inputs[f]));
  }
  const body = el('div', {},
    field(t('today'), dIn),
    grid,
    el('button', { class: 'btn full', onclick: async () => {
      const rec = { id: db.uid('ms_'), date: dIn.value || todayKey() };
      let any = false;
      for (const f of MEASURE_FIELDS) {
        const raw = inputs[f].value.trim();
        if (!raw) continue;
        const v = parseNum(raw);
        rec[f] = f === 'bodyFat' ? round(v, 1) : round(dispToCm(v), 1);
        any = true;
      }
      if (!any) return toast(t('empty'), 'err');
      await db.put('measurements', rec);
      closeSheet(); toast(t('saved'), 'ok');
      window.dispatchEvent(new CustomEvent('data-changed'));
    } }, t('save')),
  );
  sheet(t('measurements'), body);
}

/* ---------------- nutrition tab ---------------- */

export async function renderNutriTrends() {
  const end = todayKey();
  const all = await db.all('foodLogs');
  if (!all.length) {
    $('#kcal-chart').replaceChildren(emptyArt('plate', t('empty'),
      getLang() === 'fa' ? 'اولین وعده‌ات را ثبت کن' : 'Log your first meal', 'var(--orange)'));
    $('#macro-chart').replaceChildren();
    $('#nutri-stats').replaceChildren();
    return;
  }

  /* start the chart on the first day anything was logged, never before it */
  const firstLog = all.reduce((m, l) => (l.date < m ? l.date : m), all[0].date);
  const windowDays = rangeDays();
  const from = windowDays === null ? firstLog : addDays(end, -(windowDays - 1));
  const start = firstLog > from ? firstLog : from;

  const logs = await db.range('foodLogs', 'date', start, end);
  const byDay = {};
  for (const l of logs) (byDay[l.date] ||= []).push(l);

  const span = Math.max(0, daysBetween(start, end));
  const days = [];
  for (let i = span; i >= 0; i--) days.push(addDays(end, -i));

  const goal = S.goals.kcal || 2000;
  /* A day with nothing logged is not a day of zero calories, so it is null
     rather than 0 — the bar chart greys it and the line leaves a gap. */
  const daily = days.map(d => ({
    x: shortDate(d),
    y: byDay[d]?.length ? totals(byDay[d]).kcal : null,
  }));

  const note = $('#kcal-note');
  if (daily.length <= BARS_MAX) {
    /* One bar per day, and no averaging.

       A bar is a thing you point at: it has edges, it stands over one
       label, and it asks to be read as one item. So it has to be one day.
       This chart used to average days together to make them fit — three
       days to a bar over three months — and then print the last of those
       three days underneath, which is a date that is not the bar's. */
    barChart($('#kcal-chart'), daily.map((p) => {
      const ratio = (p.y || 0) / goal;
      return { ...p, y: p.y ?? 0, dim: p.y === null,
        color: p.y === null ? 'var(--line2)'
          : ratio > 1.08 ? 'var(--red)'
          : ratio < 0.88 ? 'var(--warn)' : 'var(--acc)' };
    }), { color: 'var(--acc)', goal });
    note.textContent = '';
  } else {
    /* Past a month there is no honest bar chart: ninety bars are thinner
       than the gaps between them, and averaging them back into thirty
       makes every bar a lie about a day. A line is read as a trend across
       time rather than as a row of items, so no mark on it claims to be
       one day.

       Averaged by the week, because a line of raw days over three months is
       a picket fence — the swing between one day's eating and the next is
       bigger than the drift across the whole range, so the trend is
       invisible under the noise. The note says how many days went into a
       point, so nobody has to guess. */
    const per = weeklyWindow(daily.length);
    lineChart($('#kcal-chart'), bucketBy(daily, per).map(p => ({
      ...p, y: p.y === null ? null : Math.round(p.y),
    })), { color: 'var(--acc)', goal, fill: true });
    note.textContent = t('avgPerPoint').replace('{n}', num(per));
  }

  const logged = days.filter(d => byDay[d]?.length);
  const agg = logged.map(d => totals(byDay[d]));
  const n = Math.max(1, agg.length);
  const avg = {
    kcal: Math.round(sum(agg, x => x.kcal) / n),
    p: round(sum(agg, x => x.protein) / n, 1),
    c: round(sum(agg, x => x.carbs) / n, 1),
    f: round(sum(agg, x => x.fat) / n, 1),
    fib: round(sum(agg, x => x.fiber) / n, 1),
  };
  macroBar($('#macro-chart'), { p: avg.p, c: avg.c, f: avg.f });
  $('#nutri-stats').replaceChildren(
    el('div', {}, el('b', {}, num(avg.kcal)), el('span', {}, `${t('avg')} ${t('kcal')}`)),
    el('div', {}, el('b', {}, num(logged.length)), el('span', {}, getLang() === 'fa' ? 'روز ثبت‌شده' : 'days logged')),
    el('div', {}, el('b', {}, num(avg.fib, 1)), el('span', {}, `${t('avg')} ${t('fiber')}`)),
  );
}

/* ---------------- strength tab ---------------- */

export async function renderStrength() {
  const hs = await allWorkouts();

  if (!hs.length) {
    $('#volume-chart').replaceChildren(emptyArt('dumbbell', t('empty'),
      getLang() === 'fa' ? 'اولین تمرینت را ثبت کن' : 'Log your first workout', 'var(--purple)'));
    $('#pr-list').replaceChildren(emptyArt('chart', t('empty'), '', 'var(--purple)'));
    return;
  }

  /* weekly volume, starting at the week that holds the very first workout */
  const now = new Date();
  const firstDay = S.settings.firstDay ?? 6;
  const backToStart = (now.getDay() - firstDay + 7) % 7;
  const thisWeekStart = new Date(now); thisWeekStart.setDate(now.getDate() - backToStart);

  /* count back to the week that CONTAINS the first workout, so that workout
     always lands inside a bar rather than falling off the left edge */
  const firstDate = hs.reduce((m, w) => (w.date < m ? w.date : m), hs[0].date);
  const fd = keyToDate(firstDate);
  const firstWeekStart = new Date(fd);
  firstWeekStart.setDate(fd.getDate() - ((fd.getDay() - firstDay + 7) % 7));
  const weeksSinceFirst = Math.round(
    daysBetween(dateKey(firstWeekStart), dateKey(thisWeekStart)) / 7);
  const backWeeks = Math.min(11, Math.max(0, weeksSinceFirst));

  const weeks = [];
  for (let i = backWeeks; i >= 0; i--) {
    const st = new Date(thisWeekStart); st.setDate(thisWeekStart.getDate() - i * 7);
    const en = new Date(st); en.setDate(st.getDate() + 6);
    const a = dateKey(st), b = dateKey(en);
    const vol = sum(hs.filter(w => w.date >= a && w.date <= b), w => w.volume || workoutVolume(w));
    weeks.push({ x: shortDate(a), y: Math.round(kgToDisp(vol)) });
  }
  barChart($('#volume-chart'), weeks, { color: 'var(--purple)' });

  const recs = await records();
  const host = $('#pr-list');
  host.replaceChildren();
  const arr = Object.values(recs).sort((a, b) => b.best1rm - a.best1rm).slice(0, 25);
  /* No button here: the way out of an empty records list is to train, and
     the tab bar already offers that. An invented one would just be a detour. */
  if (!arr.length) {
    host.append(emptyArt('target', t('noRecordsYet'), t('noRecordsHint'), 'var(--purple)'));
    return;
  }
  arr.forEach(r => host.append(el('div', { class: 'kv' },
    el('span', {}, exName(r.exId)),
    el('b', {}, `${num(round(kgToDisp(r.maxW), 1), 1)}${wUnit()} × ${num(r.reps)}`,
      el('span', { class: 'muted', style: 'margin-inline-start:8px;font-size:var(--t-xs)' },
        `1RM ${num(round(kgToDisp(r.best1rm)))}`)),
  )));
}
