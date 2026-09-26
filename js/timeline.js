/* ============ FitYar — the body's story, in order ============

   Weigh-ins, measurements and progress photos live in three separate stores
   and were shown in three separate boxes. Nobody experiences their body that
   way. The photo from the first week and the number on the scale this
   morning are the same story, and the story is the thing that answers "was
   the last two months worth it" — which no single chart does.

   Grouped by period rather than listed event by event, because someone who
   weighs every morning would otherwise scroll three hundred rows to find the
   month they were looking for. The period follows the data: weeks while
   there is little of it, months once there is a lot.

   Only the maths lives here. The screen that draws it is in progress.js,
   the same split muscles.js and art.js use, and it is what keeps this file
   runnable — and therefore checkable — without a browser.
*/

export const MEASURE_FIELDS =
  ['neck', 'shoulders', 'chest', 'arm', 'waist', 'hips', 'thigh', 'calf', 'bodyFat'];

const DAY = 86400000;
const toDate = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const toKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const daysApart = (a, b) => Math.round((toDate(b) - toDate(a)) / DAY);

/** The Saturday (or whichever day the user starts on) that a date belongs to. */
function weekStartKey(key, firstDay) {
  const d = toDate(key);
  d.setDate(d.getDate() - ((d.getDay() - firstDay + 7) % 7));
  return toKey(d);
}
/** Which month a day belongs to. Gregorian unless the caller knows better. */
const gregorianMonthId = (key) => key.slice(0, 7);

/* The Persian calendar does not line up with the Gregorian one, so a row
   labelled شهریور that actually runs from mid-September to mid-October is
   lying about the calendar its reader lives in. Ask Intl which Persian month
   a day falls in and bucket by that. */
const faMonth = new Intl.DateTimeFormat('en-US-u-ca-persian-nu-latn',
  { year: 'numeric', month: '2-digit' });
export function persianMonthId(key) {
  const parts = faMonth.formatToParts(toDate(key));
  const get = (t) => parts.find((x) => x.type === t)?.value || '';
  return `${get('year')}-${get('month')}`;
}

/* Once the story is longer than about ten weeks, weeks stop being a story
   and become a spreadsheet. Months take over and the rows stay readable. */
const WEEKS_UNTIL_MONTHS = 70;

/**
 * The body's record, cut into periods, newest first.
 *
 * A period's change is measured against the last weigh-in *before* it, not
 * against its own first one — otherwise a week that opens and closes on the
 * same morning reads as no change at all when it was the week you lost a kilo.
 *
 * Stretches where nothing was logged are collapsed into a single quiet row.
 * A gap is information; three identical empty months are not.
 */
export function bodyPeriods(
  { weights = [], measurements = [], photos = [] } = {},
  { today = toKey(new Date()), firstDay = 6, monthOf = gregorianMonthId } = {},
) {
  const ws = [...weights].filter((w) => w?.date && Number(w.kg) > 0)
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const ms = [...measurements].filter((m) => m?.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  const ps = [...photos].filter((p) => p?.date).sort((a, b) => (a.date < b.date ? -1 : 1));
  if (!ws.length && !ms.length && !ps.length) return [];

  const firstKey = [ws[0]?.date, ms[0]?.date, ps[0]?.date].filter(Boolean).sort()[0];
  const unit = daysApart(firstKey, today) <= WEEKS_UNTIL_MONTHS ? 'week' : 'month';
  const bucket = (key) => (unit === 'week' ? weekStartKey(key, firstDay) : monthOf(key));

  /* Walk the days rather than stepping bucket to bucket: it is the only way
     the caller can define a month by a calendar this file does not know, and
     it makes every gap show up on its own without a second pass. */
  const spans = [];
  const seen = new Map();
  let cursor = firstKey;
  for (let guard = 0; cursor <= today && guard < 4400; guard++) {
    const id = bucket(cursor);
    let span = seen.get(id);
    if (!span) { span = { id, startKey: cursor, endKey: cursor }; seen.set(id, span); spans.push(span); }
    span.endKey = cursor;
    const d = toDate(cursor);
    d.setDate(d.getDate() + 1);
    cursor = toKey(d);
  }

  const rows = [];
  let beforeKg = null;          // last weigh-in strictly before the current bucket
  let beforeMeasure = null;     // and the last measurement record
  let allLow = Infinity, allHigh = -Infinity;

  for (const { startKey, endKey } of spans) {
    const inRange = (k) => k >= startKey && k <= endKey;
    const wIn = ws.filter((w) => inRange(w.date));
    const mIn = ms.filter((m) => inRange(m.date));
    const pIn = ps.filter((p) => inRange(p.date));

    if (!wIn.length && !mIn.length && !pIn.length) {
      const prev = rows[rows.length - 1];
      if (prev?.quiet) { prev.endKey = endKey; prev.spans++; }
      else rows.push({ quiet: true, unit, startKey, endKey, spans: 1 });
      continue;
    }

    const endKg = wIn.length ? wIn[wIn.length - 1].kg : null;
    const openKg = beforeKg ?? (wIn.length ? wIn[0].kg : null);
    const delta = endKg !== null && openKg !== null ? endKg - openKg : null;

    const low = wIn.length ? Math.min(...wIn.map((w) => w.kg)) : null;
    const high = wIn.length ? Math.max(...wIn.map((w) => w.kg)) : null;
    const isLowest = low !== null && low < allLow;
    const isHighest = high !== null && high > allHigh;
    if (low !== null) allLow = Math.min(allLow, low);
    if (high !== null) allHigh = Math.max(allHigh, high);

    /* what the tape says now against what it last said, whenever that was */
    const lastMeasure = mIn[mIn.length - 1] || null;
    const changes = [];
    if (lastMeasure && beforeMeasure) {
      for (const f of MEASURE_FIELDS) {
        const now = lastMeasure[f], was = beforeMeasure[f];
        if (now === undefined || now === null || now === '' ) continue;
        if (was === undefined || was === null || was === '') continue;
        const d = Number(now) - Number(was);
        if (Math.abs(d) >= 0.1) changes.push({ field: f, delta: d, value: Number(now) });
      }
    }

    rows.push({
      quiet: false, unit, startKey, endKey,
      weights: wIn, photos: pIn, measures: mIn,
      openKg, endKg, delta, low, high, isLowest, isHighest,
      changes, lastMeasure,
    });

    if (endKg !== null) beforeKg = endKg;
    if (lastMeasure) beforeMeasure = lastMeasure;
  }

  return rows.reverse();
}

/**
 * Points for the little line drawn inside a period, 0..1 on both axes.
 *
 * Scaled to the period's own range and never to zero, so a week where the
 * scale moved two hundred grams does not draw itself as a cliff.
 */
export function sparkPoints(weights, { minSpanKg = 1 } = {}) {
  const pts = (weights || []).filter((w) => Number(w.kg) > 0);
  if (pts.length < 2) return [];
  const xs = pts.map((w) => toDate(w.date).getTime());
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const kgs = pts.map((w) => w.kg);
  let lo = Math.min(...kgs), hi = Math.max(...kgs);
  const mid = (lo + hi) / 2;
  if (hi - lo < minSpanKg) { lo = mid - minSpanKg / 2; hi = mid + minSpanKg / 2; }
  return pts.map((w, i) => ({
    x: x1 === x0 ? i / (pts.length - 1) : (xs[i] - x0) / (x1 - x0),
    y: 1 - (w.kg - lo) / (hi - lo),
  }));
}

/** Toward the goal, away from it, or nowhere worth mentioning. */
export function driftOf(delta, { down = true, flatKg = 0.2 } = {}) {
  if (delta === null || delta === undefined) return 'none';
  if (Math.abs(delta) < flatKg) return 'flat';
  return (delta < 0) === down ? 'toward' : 'away';
}
