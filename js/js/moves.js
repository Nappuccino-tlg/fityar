/* ============ FitYar — how the movement goes ============

   Two hundred exercises cannot each have their own drawing, and pretending
   otherwise would mean two hundred half-right pictures. What they can share
   is the *pattern*: a bench press, a dumbbell press and a machine press are
   one movement done with three pieces of equipment, and someone who has
   never seen the exercise needs the pattern, not the bench.

   So this is a small set of movements and a side-view figure that performs
   them. It says which pattern an exercise belongs to and never claims to be
   a photograph of that exercise.

   The maths is here; the drawing is in art.js with the rest of the artwork,
   so this file runs and can be checked without a browser.
*/

/* Every pattern's two ends, as joint angles in degrees — absolute, so they
   can be read without holding the whole skeleton in your head.

   For a limb, 0 points straight down and positive swings it forward; 180 is
   straight up. A straight arm is one whose forearm angle equals its upper
   arm's, and a straight leg one whose shin equals its thigh. The torso alone
   is measured from upright, positive leaning forward.

   The drawing turns these into the relative rotations its nesting needs. That
   arithmetic is the drawing's problem: a table nobody can read is a table
   nobody can check, and the first version of this one had a forearm folded
   back on itself and a squat whose knees went backwards.

   Anything a movement does not mention stays at the resting pose.

   ─────────────────────────────────────────────────────────────────────────
   WHERE THE MOVEMENT HAPPENS. `on` names the surface and `lie` says how the
   body meets it:

     on: 'bench'  a flat bench          on: 'floor'  the ground
     on: 'wall'   a wall in front       on: 'bar'    a bar overhead
     lie: 'up'    on the back           lie: 'down'  face down

   `lift` is how far the body has to move for the part of it that rests on
   that surface to actually reach it. Every one is solved against a contact
   the test file then checks: a plank's hands and toes on one floor, a bench
   press's feet beside the bench, a pull-up's hands on the bar.

   A movement with no `on` is done standing, which is the common case and so
   stays unwritten. The angles never change with the surface: they are
   measured in the body's own frame, so a press is the same set of numbers
   lying on a bench as standing under a bar, and the drawing lays the whole
   body down around them. */
const NEUTRAL = { torso: 0, arm: 8, fore: 14, thigh: 6, shin: -4, heel: 0,
  dy: 0, shift: [0, 0, 0] };

export const MOVES = {
  press: {
    fa: 'پرس', en: 'Press',
    hint: { fa: 'از شانه، رو به بالا', en: 'From the shoulder, upward' },
    bar: true,
    a: { torso: 4, arm: 74, fore: 158 }, b: { torso: 4, arm: 176, fore: 176 },
  },
  /* The joint angles here were right all along; the figure was simply
     standing up while it did them. A bench press from the chest, on a
     bench, is the same arm and forearm sweep — measured from the body,
     not from the room. */
  pressDown: {
    lift: 56,   /* solved: where this pose meets its surface */
    fa: 'پرس سینه', en: 'Chest press',
    hint: { fa: 'روی میز، از سینه رو به بالا', en: 'On a bench, from the chest up' },
    bar: true, on: 'bench', lie: 'up',
    /* Knees bent so the feet reach the floor beside the bench, which is
       where they go and what stops the figure looking like it is floating
       on its back. */
    a: { torso: 0, arm: 52, fore: 134, thigh: -38, shin: -112 },
    b: { torso: 0, arm: 92, fore: 92, thigh: -38, shin: -112 },
  },
  pull: {
    fa: 'کشش از بالا', en: 'Pull-down',
    hint: { fa: 'از بالای سر، به سمت سینه', en: 'From overhead, down to the chest' },
    bar: true,
    a: { torso: 4, arm: 172, fore: 172 }, b: { torso: 4, arm: 138, fore: 56 },
  },
  row: {
    fa: 'پارویی', en: 'Row',
    hint: { fa: 'خم از لگن، آرنج به عقب', en: 'Hinged at the hip, elbows back' },
    bar: true,
    a: { torso: 52, thigh: 10, shin: -6, arm: 2, fore: 4 },
    b: { torso: 52, thigh: 10, shin: -6, arm: -34, fore: 8 },
  },
  curl: {
    fa: 'جلو بازو', en: 'Curl',
    hint: { fa: 'فقط آرنج خم می‌شود', en: 'The elbow alone bends' },
    bar: true,
    a: { arm: 8, fore: 14 }, b: { arm: 10, fore: 146 },
  },
  extend: {
    fa: 'پشت بازو', en: 'Extension',
    hint: { fa: 'بازو ثابت، ساعد باز می‌شود', en: 'Upper arm still, forearm opens' },
    bar: true,
    a: { torso: 4, arm: 168, fore: 56 }, b: { torso: 4, arm: 172, fore: 172 },
  },
  raise: {
    fa: 'نشر', en: 'Raise',
    hint: { fa: 'بازوی صاف تا ارتفاع شانه', en: 'A straight arm to shoulder height' },
    a: { arm: 8, fore: 8 }, b: { arm: 92, fore: 92 },
  },
  fly: {
    fa: 'قفسه', en: 'Fly',
    hint: { fa: 'آرنج کمی خم، باز و بسته', en: 'Elbows soft, open and close' },
    /* the elbow keeps the same soft angle at both ends: fore − arm = 26 */
    a: { torso: 8, arm: 34, fore: 60 }, b: { torso: 8, arm: 124, fore: 150 },
  },
  squat: {
    fa: 'اسکوات', en: 'Squat',
    hint: { fa: 'لگن پایین، زانو و لگن با هم', en: 'Hips down, knee and hip together' },
    bar: true,
    a: { torso: 8, thigh: 6, shin: -4 },
    b: { torso: 34, thigh: 76, shin: -34, dy: 15 },
  },
  hinge: {
    fa: 'حرکت از لگن', en: 'Hinge',
    hint: { fa: 'زانو تقریباً صاف، لگن به عقب', en: 'Knees nearly straight, hips back' },
    bar: true,
    a: { torso: 4, thigh: 6, shin: -4, arm: 4, fore: 8 },
    b: { torso: 74, thigh: 12, shin: -2, arm: 0, fore: 4 },
  },
  lunge: {
    alt: true,   /* left side out of phase: a stride, not a hop */
    fa: 'لانج', en: 'Lunge',
    hint: { fa: 'یک پا جلو، پایین و بالا', en: 'One leg forward, down and up' },
    a: { torso: 6, thigh: 14, shin: -6 },
    b: { torso: 14, thigh: 62, shin: -30, dy: 11 },
  },
  calf: {
    fa: 'ساق پا', en: 'Calf raise',
    hint: { fa: 'فقط مچ پا', en: 'The ankle alone' },
    a: { heel: 0 }, b: { heel: 30 },
  },
  crunch: {
    lift: 137,   /* solved: where this pose meets its surface */
    fa: 'شکم', en: 'Crunch',
    hint: { fa: 'خوابیده، بالاتنه به سمت زانو', en: 'On your back, chest toward the knees' },
    on: 'floor', lie: 'up',
    a: { torso: 14, thigh: 76, shin: 2, arm: 2, fore: 150 },
    b: { torso: 52, thigh: 76, shin: 2, arm: -8, fore: 140 },
  },
  /* Already horizontal, and floating: the body made its own shape out of
     joint angles and there was nothing underneath it. */
  plank: {
    lift: 78,   /* solved: where this pose meets its surface */
    fa: 'پلانک', en: 'Hold',
    hint: { fa: 'روی زمین، ثابت بمان', en: 'On the floor, stay still' },
    still: true, on: 'floor',
    /* 62, not 86. At 86 the body is flat and its toes finish 73 units above
       its hands, which is a plank held in mid-air. A real one is tilted:
       the shoulders sit at arm's length above the floor and the line runs
       down from there to the toes. */
    a: { torso: 62, arm: 0, fore: 0, thigh: -62, shin: -62, heel: -20 },
    b: { torso: 62, arm: 0, fore: 0, thigh: -62, shin: -62, heel: -20 },
  },

  /* ---- the patterns that were missing ----
     Each of these was being served by a pattern that shares a word with it
     and nothing else. */

  /* A push-up is a plank whose arms bend, and a body that comes down with
     them — which is what `dy` is for. The hands stay on the floor. */
  pushUp: {
    lift: 78,   /* solved: where this pose meets its surface */
    fa: 'شنا سوئدی', en: 'Push-up',
    hint: { fa: 'بدن صاف، آرنج خم و باز', en: 'Body straight, elbows bend and open' },
    on: 'floor',
    a: { torso: 62, arm: 0, fore: 0, thigh: -62, shin: -62, heel: -20 },
    b: { torso: 70, arm: -34, fore: 48, thigh: -70, shin: -70, heel: -20, dy: 4.9 },
  },

  /* Against a wall, which is the whole point of the easier version. */
  wallPush: {
    fa: 'شنا روی سطح شیب‌دار', en: 'Incline push-up',
    hint: { fa: 'دست‌ها روی دیوار، بدن صاف', en: 'Hands on the wall, body straight' },
    on: 'wall',
    a: { torso: 26, arm: 66, fore: 70, thigh: 22, shin: -6 },
    b: { torso: 26, arm: 46, fore: 118, thigh: 22, shin: -6, shift: [0, 0, 15] },
  },

  /* Lying on a bench, upper arm still, forearm opening — the skullcrusher.
     It used to be drawn standing with the arms overhead. */
  lyingExt: {
    lift: 56,   /* solved: where this pose meets its surface */
    fa: 'پشت بازو خوابیده', en: 'Lying extension',
    hint: { fa: 'روی میز، بازو ثابت', en: 'On a bench, upper arm still' },
    bar: true, on: 'bench', lie: 'up',
    a: { torso: 0, arm: 92, fore: 24, thigh: -38, shin: -112 },
    b: { torso: 0, arm: 92, fore: 92, thigh: -38, shin: -112 },
  },

  /* Elbow at the side, forearm opening downward. Two cable pushdowns were
     being drawn as an overhead extension, which is a different exercise. */
  pushdown: {
    fa: 'پشت بازو سیم‌کش', en: 'Pushdown',
    hint: { fa: 'آرنج کنار بدن، ساعد باز می‌شود', en: 'Elbow at your side, forearm opens' },
    a: { torso: 6, arm: 8, fore: 92 }, b: { torso: 6, arm: 8, fore: 12 },
  },

  /* Face down on a bench, heel toward the seat. It was reaching the biceps
     curl, because both are called a curl. */
  legCurl: {
    lift: 54,   /* solved: where this pose meets its surface */
    fa: 'پشت پا', en: 'Leg curl',
    hint: { fa: 'دمر، پاشنه به سمت باسن', en: 'Face down, heel toward the hip' },
    on: 'bench', lie: 'down',
    a: { torso: 0, thigh: 0, shin: 0, arm: 4, fore: 8 },
    b: { torso: 0, thigh: 0, shin: -104, arm: 4, fore: 8 },
  },

  /* On your back, hips driving up. A hip thrust was being drawn as a
     standing hinge, which is the movement it exists to replace. */
  bridge: {
    lift: 137,   /* solved: where this pose meets its surface */
    fa: 'پل باسن', en: 'Bridge',
    hint: { fa: 'خوابیده، لگن را بالا ببر', en: 'On your back, drive the hips up' },
    on: 'floor', lie: 'up',
    a: { torso: 0, thigh: 88, shin: -4, arm: 2, fore: 6 },
    /* The shoulders stay on the floor and the hips come up. Without the
       shift the body pivots about its own pelvis, which draws the opposite
       movement: hips still, shoulders sinking through the floor. */
    b: { torso: -26, thigh: 62, shin: -4, arm: 2, fore: 6, shift: [0, -32, 0] },
  },

  /* Hanging from a bar. A pull-up was drawn as a lat pulldown: the same
     arms, but a body that stays on the ground. */
  hang: {
    fa: 'بارفیکس', en: 'Pull-up',
    hint: { fa: 'آویزان از میله، تا سینه بالا بیا', en: 'Hang from the bar, pull to the chest' },
    on: 'bar',
    a: { torso: 2, arm: 176, fore: 176, thigh: 4, shin: -16 },
    b: { torso: 2, arm: 176, fore: 120, thigh: 4, shin: -16, dy: -7.3 },
  },

  /* Between two rails, body upright, pressing straight down through the
     hands. It was being drawn as an overhead extension, which is the same
     joint moving the opposite way. */
  dip: {
    fa: '\u062f\u06cc\u067e', en: 'Dip',
    hint: { fa: '\u0628\u06cc\u0646 \u062f\u0648 \u0645\u06cc\u0644\u0647\u060c \u0622\u0631\u0646\u062c \u062e\u0645 \u0648 \u0628\u0627\u0632', en: 'Between two bars, elbows bend and open' },
    on: 'bars',
    a: { torso: 12, arm: 2, fore: 4, thigh: 24, shin: -52 },
    b: { torso: 16, arm: -26, fore: 58, thigh: 24, shin: -52, dy: 9 },
  },

  /* Hanging, and the knees come up instead. */
  hangRaise: {
    fa: 'زیرشکم آویزان', en: 'Hanging leg raise',
    hint: { fa: 'آویزان از میله، زانو بالا', en: 'Hang from the bar, knees up' },
    on: 'bar',
    a: { torso: 2, arm: 176, fore: 176, thigh: 2, shin: -8 },
    b: { torso: 2, arm: 176, fore: 176, thigh: 88, shin: 6 },
  },
  run: {
    alt: true,   /* left side out of phase: a stride, not a hop */
    fa: 'دویدن', en: 'Run',
    hint: { fa: 'گام پس از گام', en: 'Stride after stride' },
    a: { torso: 12, arm: -40, fore: 24, thigh: 38, shin: 6 },
    b: { torso: 12, arm: 44, fore: 104, thigh: -26, shin: -72 },
  },
  carry: {
    alt: true,   /* left side out of phase: a stride, not a hop */
    fa: 'حمل وزنه', en: 'Carry',
    hint: { fa: 'وزنه در دست، راه برو', en: 'Weight in hand, walk' },
    a: { torso: 2, arm: 6, fore: 8, thigh: 20, shin: 12 },
    b: { torso: 2, arm: 6, fore: 8, thigh: -14, shin: -22 },
  },
};

export const MOVE_IDS = Object.keys(MOVES);

/* Name first, because the name is what says which movement it is. A
   Bulgarian split squat is a lunge and its muscle says quads, which would
   have sent it to a back squat. Both languages are matched, and the list is
   ordered so that "pull-up" never loses to "press". */
const BY_NAME = [
  /* The wall and the floor first: a wall push-up and a push-up both contain
     the word push, and the wall is the narrower claim. */
  [/wall|\u062f\u06cc\u0648\u0627\u0631|incline push|\u0634\u0646\u0627 \u0631\u0648\u06cc \u0633\u0637\u062d/i, 'wallPush'],
  [/push[- ]?up|\u0634\u0646\u0627 \u0633\u0648\u0626\u062f\u06cc|\u0634\u0646\u0627 \u0627\u0644\u0645\u0627\u0633\u06cc|diamond push|pike push|\u0634\u0646\u0627 \u067e\u0627\u06cc\u06a9/i, 'pushUp'],
  /* Hanging, before anything that mentions a bar or a raise. */
  [/pull[- ]?up|\u0628\u0627\u0631\u0641\u06cc\u06a9\u0633|chin[- ]?up/i, 'hang'],
  [/hanging leg|\u0632\u06cc\u0631\u0634\u06a9\u0645 \u0622\u0648\u06cc\u0632\u0627\u0646|\u0622\u0648\u06cc\u0632\u0627\u0646/i, 'hangRaise'],
  /* Lying, before the standing version of the same joint. */
  [/skull|\u062e\u0648\u0627\u0628\u06cc\u062f\u0647 \u0647\u0627\u0644\u062a\u0631/i, 'lyingExt'],
  [/leg curl|\u067e\u0634\u062a \u067e\u0627|nordic|\u0646\u0648\u0631\u062f\u06cc\u06a9/i, 'legCurl'],
  [/hip thrust|\u0647\u06cc\u067e \u062a\u0631\u0627\u0633\u062a|glute bridge|\u06af\u0644\u0648\u062a \u0628\u0631\u06cc\u062c|\u067e\u0644 \u0628\u0627\u0633\u0646/i, 'bridge'],
  [/pushdown|\u0633\u06cc\u0645\u200c?\u06a9\u0634 \u067e\u0634\u062a|\u067e\u0634\u062a \u0628\u0627\u0632\u0648 \u0633\u06cc\u0645|\u067e\u0634\u062a \u0628\u0627\u0632\u0648 \u0637\u0646\u0627\u0628|rope push/i, 'pushdown'],
  [/\bdip\b|\u062f\u06cc\u067e|\u067e\u0627\u0631\u0627\u0644\u0644/i, 'dip'],
  /* A glute kickback and a triceps kickback share a name and nothing else. */
  [/glute kickback|\u06a9\u06cc\u06a9\u200c?\u0628\u06a9 \u0628\u0627\u0633\u0646|abduction|adduction|\u0627\u0628\u062f\u0627\u06a9\u0634\u0646|\u0627\u062f\u0627\u06a9\u0634\u0646/i, 'hinge'],
  /* Done in a plank, not on your feet. */
  [/mountain climb|\u06a9\u0648\u0647\u0646\u0648\u0631\u062f/i, 'plank'],
  /* Then the hinges and the squats, which are the most confusable pair. */
  [/deadlift|\u062f\u062f\u0644\u06cc\u0641\u062a|\u0631\u0648\u0645\u0627\u0646\u06cc\u0627\u06cc\u06cc|good\s*morning|\u0635\u0628\u062d \u0628\u062e\u06cc\u0631|\u06af\u0648\u062f\u0645\u0648\u0631\u0646\u06cc\u0646\u06af|back extension|\u0641\u06cc\u0644\u0647 \u06a9\u0645\u0631|\u067e\u0627 \u0635\u0627\u0641|stiff|swing|سوئینگ|kettlebell|کتل‌?بل/i, 'hinge'],
  [/lunge|\u0644\u0627\u0646\u062c|split squat|\u0627\u0633\u067e\u0644\u06cc\u062a|step[- ]?up|\u0627\u0633\u062a\u067e \u0622\u067e|bulgarian|\u0628\u0644\u063a\u0627\u0631\u06cc/i, 'lunge'],
  [/calf|\u0633\u0627\u0642/i, 'calf'],
  [/squat|\u0627\u0633\u06a9\u0648\u0627\u062a|leg press|\u067e\u0631\u0633 \u067e\u0627|hack|\u0647\u06a9|\u0633\u06cc\u0633\u06cc|leg ext|\u062c\u0644\u0648 \u067e\u0627/i, 'squat'],
  [/plank|\u067e\u0644\u0627\u0646\u06a9|hollow|\u0647\u0627\u0644\u0648|vacuum|\u0627\u06cc\u0633\u062a\u0627/i, 'plank'],
  [/crunch|\u06a9\u0631\u0627\u0646\u0686|sit[- ]?up|\u062f\u0631\u0627\u0632 \u0648 \u0646\u0634\u0633\u062a|\u0632\u06cc\u0631 ?\u0634\u06a9\u0645|leg raise|\u0628\u0627\u0644\u0627 \u0622\u0648\u0631\u062f\u0646 \u067e\u0627|russian|\u0631\u0648\u0633\u06cc|ab wheel|\u0686\u0631\u062e \u0634\u06a9\u0645|dead ?bug|\u062f\u062f\u0628\u0627\u06af/i, 'crunch'],
  [/pulldown|pull[- ]?down|\u0644\u062a |\u0632\u06cc\u0631\u0628\u063a\u0644 \u0633\u06cc\u0645\u200c\u06a9\u0634|\u067e\u0648\u0644\u0627\u0648\u0631|pullover/i, 'pull'],
  [/row|\u067e\u0627\u0631\u0648\u06cc\u06cc|\u0632\u06cc\u0631\u0628\u063a\u0644|\u0631\u0648\u0626\u06cc\u0646\u06af|face pull|\u0641\u06cc\u0633 \u067e\u0648\u0644|shrug|\u0634\u0631\u0627\u06af|\u06a9\u0648\u0644/i, 'row'],
  [/fly|\u0642\u0641\u0633\u0647|pec deck|crossover|\u06a9\u0631\u0627\u0633 \u0627\u0648\u0631|\u0646\u0634\u0631 \u062e\u0645/i, 'fly'],
  [/lateral raise|\u0646\u0634\u0631|front raise|\u062c\u0644\u0648 \u0634\u0627\u0646\u0647|upright/i, 'raise'],
  [/curl|\u062c\u0644\u0648 \u0628\u0627\u0632\u0648|\u062c\u0644\u0648\u0628\u0627\u0632\u0648|\u0645\u0686/i, 'curl'],
  [/triceps|\u067e\u0634\u062a \u0628\u0627\u0632\u0648|\u067e\u0634\u062a\u200c\u0628\u0627\u0632\u0648|\bdip\b|\u067e\u0627\u0631\u0627\u0644\u0644|\u062f\u06cc\u067e|kickback/i, 'extend'],
  [/bench|\u067e\u0631\u0633 \u0633\u06cc\u0646\u0647|\u067e\u0631\u0633 \u0628\u0627\u0644\u0627 \u0633\u06cc\u0646\u0647|\u067e\u0631\u0633 \u0632\u06cc\u0631 \u0633\u06cc\u0646\u0647|\u062f\u0633\u062a\u200c?\u062c\u0645\u0639/i, 'pressDown'],
  [/press|\u067e\u0631\u0633/i, 'press'],
  [/carry|\u062d\u0645\u0644|farmer|\u0641\u0627\u0631\u0645\u0631/i, 'carry'],
  [/\brun|\u062f\u0648\u06cc\u062f\u0646|treadmill|\u062a\u0631\u062f\u0645\u06cc\u0644|bike|\u062f\u0648\u0686\u0631\u062e\u0647|elliptical|\u0627\u0644\u067e\u062a\u06cc\u06a9\u0627\u0644|jump|\u0637\u0646\u0627\u0628|\u067e\u0644\u0647|\u067e\u06cc\u0627\u062f\u0647|walk|swim|\u0634\u0646\u0627\b|climb|\u06a9\u0648\u0647\u0646\u0648\u0631\u062f|burpee|\u0628\u0631\u067e\u06cc|hiit/i, 'run'],
];

/* Only when the name says nothing. A muscle is a weak signal — "chest" could
   be a press or a fly — so it is the fallback and never the first answer. */
const BY_MUSCLE = {
  chest: 'pressDown', back: 'row', shoulders: 'press', biceps: 'curl',
  triceps: 'extend', quads: 'squat', hamstrings: 'hinge', glutes: 'hinge',
  calves: 'calf', abs: 'crunch', forearms: 'curl', traps: 'row',
  cardio: 'run', fullbody: 'squat',
};

/** Which movement an exercise is: by its name first, by its muscle after. */
export function moveFor(ex) {
  if (!ex) return null;
  const text = `${ex.name || ''} ${ex.nameFa || ''}`;
  for (const [re, id] of BY_NAME) if (re.test(text)) return id;
  return BY_MUSCLE[ex.muscle] || null;
}

/** The pose at either end of a movement, filled out from neutral. */
export function poseOf(moveId, end = 'a') {
  const move = MOVES[moveId];
  if (!move) return null;
  return { ...NEUTRAL, ...(move[end] || {}) };
}

/** Where the limbs hang when a movement says nothing about them. */
export const NEUTRAL_POSE = { ...NEUTRAL };

/* Absolute angles in, relative rotations out.

   A limb that hangs down and a torso that stands up turn opposite ways for
   the same sign — south turned clockwise goes west, north turned clockwise
   goes east — so the limbs are negated and the torso is not. Each joint then
   sits inside its parent, which is why the parent's angle comes back off
   again. Getting this wrong is what made a squat's knees go backwards.

   The signs here are the side-view drawing's, where a positive rotation is
   clockwise. The 3D body turns the other way about the same axis, so it
   negates the whole set rather than keeping a second table. */
export function rotations(pose) {
  return {
    torso: pose.torso,
    arm: -pose.arm - pose.torso,
    fore: pose.arm - pose.fore,
    thigh: -pose.thigh,
    shin: pose.thigh - pose.shin,
    heel: pose.heel + pose.shin,
  };
}
