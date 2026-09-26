/* ============ FitYar — the shape of the world ============

   Where the land is, and how to scatter points across it. Data and
   arithmetic only: no canvas, no DOM, nothing that needs a browser — so
   tools/test-land.mjs can check that there are dots on India and none in
   the middle of the Pacific without one.

   The globe that draws these lives in globe.js.
*/

const D2R = Math.PI / 180;

/* Coastlines, as closed rings of [lon, lat] in degrees.

   These used to be about twenty vertices each, coarse on purpose, on the
   theory that detail costs frames. It does not: inRing runs only while the
   dots are being placed — once, at build — and the renderer never sees a
   ring at all. What coarseness actually cost was correctness. Eurasia ran
   from the Strait of Hormuz straight up to the Caucasus, which put the
   whole Arabian Peninsula in the ocean: Riyadh, Baghdad, Dubai and Mecca
   all at sea, on a globe drawn for people who live next door to them.

   So: the resolution the coastline deserves. Elongated water that gives a
   continent its outline — the Persian Gulf, the Red Sea, the Adriatic, the
   Gulf of California — is traced as a real inlet, because the shape of the
   land around it is the part anyone recognises. Water that is simply a hole
   in the middle of a landmass is in SEAS below. */
export const LAND = [
  /* North America: Bering Strait east along the Arctic, down the Atlantic,
     round the Gulf and Central America, up the Pacific by way of Baja. */
  [[-168, 65.5], [-166, 68.3], [-159, 70.5], [-156.5, 71.3], [-148, 70.2], [-141, 69.7],
   [-134, 69.5], [-128, 70.2], [-121, 69.5], [-115, 68.2], [-108, 68], [-101, 68],
   [-95, 68.5], [-90, 68.5], [-86, 67.5], [-83, 66], [-81, 63], [-78, 62], [-72, 62],
   [-66, 59], [-64, 60], [-62, 58], [-58, 54], [-55.5, 52], [-56, 51], [-59, 48],
   [-64, 47], [-66, 45], [-70, 43.5], [-71, 41.5], [-74, 40.5], [-76, 37], [-78, 34],
   [-81, 31.5], [-81.5, 30.7], [-80.5, 28.5], [-80.05, 26.5], [-80.1, 25.2],
   [-81.8, 26], [-82.7, 27.8], [-83, 29.5], [-84.3, 30], [-88, 30.3], [-89.2, 29],
   [-93, 29.7], [-94, 29.5],
   [-97, 26], [-97, 22], [-95, 18.5], [-92, 18.5], [-90, 21], [-87, 21.5], [-88, 18],
   [-88, 15.8], [-83, 15], [-82, 9.5], [-80, 9.6], [-79, 9.6], [-77.5, 8.7],
   [-78.5, 8.2], [-80, 8.2], [-81.5, 7.8], [-83, 8.2], [-87, 13], [-92, 15],
   [-96, 16], [-99, 17], [-105, 20.5], [-106, 23], [-109, 25.5], [-111, 27.5], [-113, 30],
   /* down Baja's east shore, round Cabo, back up its west shore: the Gulf
      of California is the notch between the two chains. */
   [-114.6, 31.2], [-113.5, 29.5], [-112.8, 28], [-111.5, 26], [-110.3, 24.3],
   [-109.9, 22.9], [-112, 24.8], [-114, 27.5], [-115.2, 29.2], [-116.2, 30.8],
   [-117.2, 32.5], [-120.5, 34.5], [-122, 37], [-124, 40], [-124, 46.5], [-125, 49],
   [-131, 54], [-136, 58], [-140, 60], [-146, 60.5], [-150, 59], [-153, 58], [-158, 56],
   [-161, 58.5], [-165, 60.5]],

  /* South America */
  [[-77.5, 7.8], [-75.5, 9.5], [-74, 11], [-71.3, 12.4], [-68, 11], [-64, 10.6],
   [-61.5, 10.7], [-60, 8.6], [-57, 6], [-52, 5], [-50, 1.5], [-48.5, -0.5], [-44.3, -2.5],
   [-41, -2.9], [-37.5, -5], [-35.2, -6], [-37, -11], [-38.5, -13], [-39, -17.5],
   [-40.8, -21], [-43.2, -23], [-46, -24], [-48.5, -25.5], [-50, -29], [-52, -32],
   [-56.5, -34.9], [-58.5, -38], [-62, -39], [-65, -41], [-65, -45], [-67.5, -46],
   [-68, -50], [-69, -52.5], [-68, -54.9], [-71, -54], [-74, -52.5], [-75, -49],
   [-74.5, -45], [-73.5, -42], [-73.5, -37], [-72, -33], [-71.5, -30], [-70.5, -25],
   [-70.4, -23.5], [-71, -20], [-71.5, -17.5], [-76, -14], [-77.2, -12], [-79, -8],
   [-81.3, -5], [-80.5, -3], [-80.9, -2.2], [-79.5, 1], [-78, 2], [-77.5, 4]],

  /* Africa, with the Red Sea's African shore traced from Suez down to
     Bab-el-Mandeb rather than cut across. */
  [[-17.5, 14.7], [-16.5, 19], [-16, 21], [-13, 24], [-11, 26], [-9.8, 29.5], [-9.8, 31.5],
   [-8.8, 32.9], [-7.7, 33.8], [-6.8, 34.2], [-6, 35.8], [-2, 35.2], [1, 36], [3, 36.8], [8, 37], [10.2, 37],
   [11, 33.5], [15, 32.4], [20, 32.9], [25, 32], [29, 31], [32.3, 31.2], [32.5, 29.9],
   [34, 27.8], [35.5, 24], [37, 21.5], [38.5, 18], [39, 15], [41, 15], [43.2, 12.7],
   [44.5, 12.5], [47, 11.5], [51.3, 11.9], [50, 8], [48, 5], [45, 2], [41.5, -2],
   [40, -5], [40, -10], [40.5, -16], [36.5, -19], [35, -21], [33, -26], [31, -29.5],
   [28, -32.5], [25, -34], [20, -34.8], [18.4, -34], [17, -30], [15, -26.5], [13, -23],
   [11.8, -18], [13, -13], [12.2, -6], [9.5, -1], [9.8, 4], [6, 4.3], [3, 6.4], [0, 5.5],
   [-4, 5], [-7.5, 4.4], [-11, 6], [-13.3, 8.5], [-16, 12]],

  /* Eurasia: Gibraltar north up the Atlantic, along the Arctic, down the
     Pacific, round India and Arabia, home along the Mediterranean. The
     Persian Gulf, the Red Sea's Arabian shore and the Adriatic are traced
     as inlets — they are what makes this shape readable. */
  [[-5.6, 36], [-9, 37], [-9, 39], [-8.9, 43.5], [-4, 43.5], [-1.5, 43.4], [-1, 46],
   [-2, 47.3], [-4.8, 48.4], [-1.5, 49.7], [2, 51], [4.3, 52], [8, 53.6], [8.2, 57.6],
   [5.5, 58.9], [5, 61], [8, 63.5], [13, 66], [16, 68.5], [20, 70], [26, 71], [31, 70],
   [36, 68], [41, 66], [44, 68], [52, 69], [58, 68.5], [66, 69], [69, 73], [74, 72],
   [80, 73.5], [86, 76], [95, 78], [104, 77.7], [112, 74], [120, 73], [128, 73.5],
   [136, 72], [145, 71], [155, 70], [165, 69.5], [180, 65.5], [172, 63], [163, 60],
   [163, 57], [160, 54], [156.5, 51], [155, 55], [152, 59], [143, 59], [141, 54],
   [137, 54], [135, 48], [131, 43], [129, 40], [126, 39], [126, 37], [126, 34.5],
   [129, 35.2], [129, 38], [128, 41], [124, 40], [122, 39], [119, 37], [120, 34],
   [121.9, 31.4], [121.5, 30.5], [121, 29.2], [120.5, 28], [119, 25], [117, 23.5], [114, 22.3], [110, 21.5], [108, 21.5],
   [106, 18.5], [107, 16.5], [109, 13], [109, 11], [106, 9], [103, 10], [100, 13],
   [100, 7], [102.5, 5.5], [103.5, 4], [104, 2], [103.8, 1.4], [103, 1.5], [102, 2.5],
   [101.3, 3.2], [100.5, 4.5], [100.3, 6], [100, 6.5], [98, 8], [98, 12], [97, 16], [94, 20], [91, 22],
   [87, 21.5], [85, 20], [80.5, 15.8], [80.5, 13.2], [79.9, 11.9], [79.3, 10.3],
   [78.2, 9.2], [77.5, 8.1], [75.8, 11.5], [74, 14.5], [72.6, 17.5], [72.6, 19.3],
   [72.5, 21], [72.8, 21.7], [68, 24], [64, 25], [60, 25.3], [57, 25.5],
   /* into the Persian Gulf along Iran, out again along Arabia */
   [56.5, 26.7], [54, 27.2], [52, 27.8], [50, 29.5], [48.5, 30.1], [48, 29], [49.5, 27.4],
   [50.2, 26.3], [50.8, 25.5], [50.8, 24.6],
   /* Qatar's peninsula, up its west coast and back down its east, so that
      Doha is standing on something */
   [51, 25.5], [51.6, 26.1], [51.6, 25], [51.3, 24.6],
   [52.5, 24.2], [54.4, 24.6], [55.2, 25.4], [56, 25.9], [56.3, 26.4],
   /* round Oman and up the Red Sea's Arabian shore */
   [56.7, 24.4], [58.6, 23.6], [59.5, 22.6], [59.8, 22.5], [58, 20], [55, 17], [52, 17], [49, 14], [45, 12.8], [43.3, 12.6],
   [42, 15], [40, 19], [37, 24], [35, 28], [34.3, 31.3], [35, 33], [36, 36], [33, 36.3],
   [30, 36.3], [27, 36.8], [27, 38], [26.5, 40], [26, 40.5], [28.5, 41], [25, 40.9],
   [23.5, 40.5], [24, 38], [23, 37.5], [21.5, 37], [21, 38.5], [20, 39.5], [19.3, 41],
   /* up the Adriatic's eastern shore to Trieste, then back down Italy */
   [19, 42.5], [16.5, 43], [15, 44.5], [13.5, 45.6], [12.4, 44.5], [14, 42], [16, 41.8],
   [18.4, 40.1], [17, 38.9], [16, 38], [15.6, 38.2], [14, 40.7], [11, 42.4], [10, 44],
   [8.8, 44.4], [5.3, 43.3], [3, 42.5], [2, 41.4], [0, 39.5], [-0.7, 37.6], [-2.5, 36.8]],

  /* Australia, with the Gulf of Carpentaria and Cape York */
  [[113.5, -22], [113.5, -26], [115, -30], [115.7, -33], [115.1, -34.4], [118, -35],
   [122, -34], [126, -32], [130, -31.5], [134, -32.5], [137, -35], [138.5, -35],
   [140, -38], [143, -38.8], [144.8, -38.4], [146.4, -39.1], [148, -37.8], [150, -37.5],
   [151.3, -33.9], [153.4, -28.6], [153.2, -25.5], [151, -24], [149, -21], [146.5, -19],
   [145.8, -17], [143.5, -14], [142.5, -10.7], [141.5, -13], [140.8, -17.5], [139, -17],
   [137, -16], [136.7, -12.2], [135, -12], [132, -11.3], [130.8, -12.4], [129, -15],
   [127, -14], [125, -16], [122.2, -18], [119, -20], [116, -20.5], [114, -21.5]],

  /* Greenland */
  [[-43, 59.8], [-50.5, 62.5], [-52.5, 64.2], [-53.5, 66.5], [-53.5, 69], [-55, 71], [-57, 75], [-60, 76],
   [-68, 77], [-70, 79], [-60, 82], [-45, 83], [-30, 83.5], [-22, 81], [-20, 77],
   [-22, 74], [-26, 70], [-32, 68], [-38, 65], [-41, 62]],

  /* --- the islands, each its own ring rather than one blob spanning
     Sumatra to New Guinea with the Java Sea inside it --- */
  /* Sumatra */
  [[95, 5.5], [98, 3], [100, 0], [102, -3], [105, -6], [106, -5.5], [103, -2], [100, 1], [97, 4]],
  /* Java */
  [[105, -6], [110, -7], [114, -8.5], [114.5, -7], [110, -6], [106, -5.8]],
  /* Borneo */
  [[109, 1.5], [113, 3], [117, 4.5], [119, 1], [117, -3], [114, -3.5], [110, -3], [109, -1]],
  /* Sulawesi */
  [[119, -5.5], [120, -2], [125, 1], [125, -1], [122, -3], [121, -5]],
  /* New Guinea */
  [[131, -1], [132.5, -2.8], [135, -3.5], [137.5, -5], [140, -6.5], [143, -8],
   [146, -9], [148, -10.3], [150.5, -10.5], [150, -9.4], [147.5, -8], [145, -5.8],
   [142, -4.5], [138, -2.2], [134, -0.9], [132, -0.3]],
  /* Luzon and Mindanao, as one chain */
  [[120, 18.5], [122, 18], [122.5, 14], [124, 13], [126, 9], [126, 6], [124, 6], [122, 7],
   [121, 13], [120, 15]],
  /* Japan */
  [[130.5, 31], [131.5, 33], [134, 34], [136, 34], [138, 35], [140, 35], [140.5, 36.5],
   [141, 38], [141.5, 41], [143, 42.5], [145.5, 43.5], [144, 43], [141, 42], [140, 40],
   [139.5, 38], [137, 37], [135, 36], [132, 35], [131, 33]],
  /* Britain */
  [[-5.5, 50], [-3, 50.7], [0, 50.8], [1.5, 51], [0, 52.8], [-1, 54], [-2, 56], [-3, 58.5],
   [-5, 58.5], [-5.5, 56], [-4.5, 54], [-3, 53.4], [-5, 51.6]],
  /* Ireland */
  [[-10, 51.5], [-6, 52], [-6, 54.5], [-8, 55.3], [-10, 54]],
  /* Iceland */
  [[-24, 65.5], [-22, 66.5], [-18, 66.5], [-14.5, 65.5], [-13.5, 64.5], [-16, 63.5],
   [-20, 63.4], [-22.5, 64]],
  /* Madagascar */
  [[49.5, -12.3], [50.5, -15], [50, -18], [48, -22], [47, -25], [45, -25.5], [43.3, -22],
   [43.5, -19], [45, -16], [47, -13.5]],
  /* Sri Lanka */
  [[80, 9.8], [81.9, 7.5], [81.5, 6], [80, 6], [79.7, 8.5]],
  /* Tasmania */
  [[144.7, -40.7], [148, -40.7], [148.3, -42.5], [147, -43.6], [145.5, -43], [144.7, -41.5]],
  /* Cuba */
  [[-84.9, 22], [-83, 22.9], [-82.4, 23.2], [-81, 23.2], [-79, 22.5], [-77, 20.7],
   [-74.2, 20.2], [-75.5, 19.9], [-77.5, 19.9], [-80, 21.8], [-82.5, 22.4], [-84.5, 21.8]],
  /* New Zealand, as the two islands it is — Cook Strait is wider than the
     gap between two dots, and the South Island's east coast has to reach
     Banks Peninsula or Christchurch is at sea. */
  [[172.7, -34.4], [174.8, -35.1], [176.3, -37], [178, -37.6], [178.5, -38.8],
   [177, -39.5], [176, -40.5], [175.3, -41.4], [174.7, -41.3], [174.3, -39.6],
   [175, -38.7], [174.5, -37], [173, -35.2]],
  [[174.3, -41], [173.8, -42.5], [173, -43.6], [171.5, -44.5], [170.7, -45.9],
   [168.4, -46.6], [166.5, -45.9], [167.8, -44.5], [169.5, -43.5], [171.5, -41.8],
   [173.2, -40.9]],
];


/* The water that sits inside a coastline.

   Some seas are best traced and some are best punched. An elongated one
   that gives a continent its outline is traced above, as an inlet, because
   the shape of the land around it is what anyone recognises — the Gulf, the
   Red Sea, the Adriatic, the Gulf of California. A sea that is simply a
   hole in the middle of a landmass is here instead: tracing the way in and
   back out again would take forty vertices to say what six say better.

   A dot is land only if it is inside a ring above and inside none of these.
   tools/test-land.mjs asserts each one comes out empty, because "is the
   Caspian wet" is a question with an answer. */
export const SEAS = [
  /* Black Sea and the Sea of Azov */
  [[27.5, 41.2], [31, 43], [34, 42], [38, 41], [41.5, 42], [41, 44.5], [38, 47],
   [34, 46.3], [31.5, 46.5], [29, 45], [28, 43.3]],
  /* Caspian. Its southern shore is the Iranian coast, so this edge is the
     one that decides whether Rasht is a city or a shipwreck. */
  [[48.9, 38.4], [49.6, 37.5], [51, 36.8], [53, 36.6], [54, 37], [54, 38.5],
   [53.5, 40.5], [52.5, 42], [51, 44], [49.5, 45.3], [48, 46], [47, 45], [47.3, 43],
   [48.3, 41], [48.6, 39.5]],
  /* Baltic, up through the Gulf of Bothnia. The western edge runs outside
     Stockholm and the northern one outside Helsinki: both cities sit on
     this water, so a hole a degree too wide drowns a capital. */
  [[11, 54.6], [14, 54.6], [18, 55], [21, 56], [23.5, 57], [24.5, 58], [25, 59.5],
   [24.5, 60.3], [22, 60.5], [21.5, 62], [23.5, 64], [25.2, 65.5], [23, 65.7],
   [21, 63.5], [19.5, 61.5], [18.6, 60.2], [18.3, 58.8], [17, 57.3], [15.5, 56], [12.5, 55]],
  /* Gulf of Finland */
  [[24, 59.4], [28, 59.5], [30, 59.8], [32, 60], [30.5, 60.3], [28, 60], [25, 59.9]],
  /* White Sea */
  [[33, 66], [36, 64.6], [39, 64.3], [41, 65.5], [40.5, 67], [38, 67.3], [35, 67.3]],
  /* Hudson Bay */
  [[-95, 58.5], [-90, 56.5], [-85, 55.5], [-79, 56.5], [-77, 60], [-78, 63], [-83, 65],
   [-89, 64], [-94, 61.5]],
  /* Superior, Michigan and Huron. Erie and Ontario are left out on
     purpose: at this size they are thinner than the gap between two dots,
     and a hole wide enough to show would swallow Toronto and Detroit. */
  [[-92, 47], [-88, 48.5], [-84.5, 47], [-82, 45.5], [-80.5, 45], [-81, 43.5],
   [-83, 44], [-85, 45.5], [-86.5, 44], [-86.5, 42.3], [-88, 42.3], [-88, 45], [-90, 46]],
];


/* A planet that is a different planet on every page load is not a planet.
   The old sampler called Math.random at module scope, so the continents
   kept their places and their grain changed every time. One seed, one
   Earth. Mulberry32: three lines, and an even spread that a seeded
   sin-fract hash does not give. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Is this point inside the ring? Ray crossing, the usual one. */
export function inRing(lon, lat, ring) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i], [xj, yj] = ring[j];
    if ((yi > lat) !== (yj > lat)
      && lon < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/* ---------------- height ----------------

   A field over the sphere: a sum of plane waves, each with its own random
   direction, frequency and phase. Smooth by construction, seeded, and one
   dot product per wave to evaluate — which matters, because this is
   sampled twice per dot and there are four thousand of them.

   Perlin would be the usual answer and needs a gradient table and a lattice
   on a surface that has no natural one. Plane waves have neither problem on
   a sphere. */
function makeField(seed, waves = 8) {
  const rand = rng(seed);
  const w = [];
  for (let i = 0; i < waves; i++) {
    /* directions spread evenly over the sphere, not clustered at its poles */
    const z = rand() * 2 - 1, a = rand() * Math.PI * 2, s2 = Math.sqrt(1 - z * z);
    w.push({
      dx: s2 * Math.cos(a), dy: s2 * Math.sin(a), dz: z,
      k: 1.1 + i * 1.35 + rand() * 0.8,     // each octave finer than the last
      ph: rand() * Math.PI * 2,
      amp: 1 / (1 + i * 0.85),              // and quieter
    });
  }
  /* Normalised by the spread the sum actually has, not by the sum of the
     amplitudes. Eight sines with unrelated phases almost never line up, so
     dividing by the theoretical maximum left the field inside 0.08 to 0.67
     — and the bands above 0.72 were unreachable, which is to say there was
     no rock and no snow anywhere on the planet.

     The RMS of a sum of independent sines is sqrt(Σa²/2); two and a half of
     those covers nearly all of the distribution, and the clamp takes the
     rest. */
  const spread = 2.5 * Math.sqrt(w.reduce((t, o) => t + o.amp * o.amp / 2, 0));
  return (x, y, z) => {
    let v = 0;
    for (const o of w) v += o.amp * Math.sin((x * o.dx + y * o.dy + z * o.dz) * o.k + o.ph);
    return Math.max(0, Math.min(1, v / spread * 0.5 + 0.5));
  };
}

/** The height field the globe is drawn from. One per page. */
export const height = makeField(84213);

/* A second, coarser field, used only to soften the edge of a desert. An
   aridity computed from distance alone gives every desert a clean circular
   rim, which is the one thing no desert on Earth has. */
const wobbleField = makeField(20260924, 4);

/* How dry the ground under one dot is: the aridity of its longitude and
   latitude, nudged by the wobble field so a desert has a ragged edge
   rather than a rim.

   This lives here rather than inline in landPoints because the test has to
   ask the same question of a finished dot, and a rule written down twice
   is a rule that drifts. */
export function dotAridity(x, y, z, lon, lat) {
  const raw = aridity(lon, lat);
  if (raw <= 0) return 0;
  return Math.max(0, Math.min(1, raw + (wobbleField(x, y, z) - 0.5) * 0.34));
}

/* The light the relief is lit by: up, and toward the viewer's left, which
   is where the globe's own key light sits. A unit vector, so stepping along
   it is a step of a known size. */
const SUN = (() => {
  const v = [-0.55, -0.62, 0.56];
  const m = Math.hypot(...v);
  return v.map((c) => c / m);
})();

/**
 * How lit a point is by its own slope, −1 to 1.
 *
 * The field sampled a short step toward the light, minus the field here. A
 * dot on a slope facing the sun comes out brighter than the one below it,
 * and that difference is the only thing the eye needs to read a bump as a
 * bump.
 */
export function relief(x, y, z, step = 0.055) {
  const h0 = height(x, y, z);
  const h1 = height(x + SUN[0] * step, y + SUN[1] * step, z + SUN[2] * step);
  return Math.max(-1, Math.min(1, (h1 - h0) * 14));
}

/* ---------------- what the ground looks like ----------------

   Height and latitude together, which is most of why Earth reads as Earth
   from orbit. Every desert on the planet sits on the same two parallels,
   because that is where the air that rose at the equator comes back down
   dry; past sixty there is tundra and then ice. A ramp that knows those two
   facts does more for the look of a globe than any amount of dot detail. */
const BANDS = {
  ice: '#dfe9f0',
  rock: '#a2937e',
  desert: '#d3b477',
  dry: '#9fae6a',
  grass: '#6fb972',
  forest: '#3f9560',
  deep: '#2f7a51',
  tundra: '#a9b3a6',
};

/* Every colour the ground can be, in a fixed order, so the renderer can
   carry an index instead of a string. It batches its dots by colour — one
   path per colour rather than one path per dot — and an index into this is
   what makes that lookup free. The two greys belong to the poles and are
   written out in terrainColour rather than named in BANDS. */
export const PALETTE = [
  BANDS.ice, BANDS.rock, BANDS.desert, BANDS.dry, BANDS.grass, BANDS.forest,
  BANDS.deep, BANDS.tundra,
];
const PALETTE_AT = new Map(PALETTE.map((c, i) => [c, i]));

/**
 * The colour of land at this height and latitude.
 *
 * Pure, and exported, so tools/test-land.mjs can hold it to the two claims
 * that matter: the Sahara's latitude is not green, and the Arctic's is not
 * tropical.
 */

/* Where the dry places actually are.

   Height and latitude were the whole of this, and latitude cannot tell
   Arabia from India — same parallel, and one of them is sand. The rule
   said everything from 17° to 35° was desert, which is most of India,
   southern China and the American south, and the planet came out bleached.

   So the deserts are named: a centre and a reach, in degrees, and every
   other place on those parallels is free to be green. [lon, lat, reach] */
const ARID = [
  [13, 23, 26],    // the Sahara
  [45, 23, 15],    // the Arabian
  [55, 32, 13],    // the Kavir and the Lut
  [72, 27, 8],     // the Thar
  [62, 42, 12],    // the Karakum and the Kyzylkum
  [100, 41, 17],   // the Taklamakan and the Gobi
  [-114, 38, 11],  // the Great Basin
  [-105, 28, 9],   // the Chihuahuan
  [19, -23, 13],   // the Namib and the Kalahari
  [-69, -23, 8],   // the Atacama
  [-68, -45, 10],  // Patagonia
  [133, -25, 17],  // the Australian interior
];

/* How dry a place is, 0 to 1: one at a desert's centre, nothing past its
   reach. A degree of longitude is shorter away from the equator, so the
   distance has to be scaled by the cosine or every desert comes out
   stretched sideways the further it is from the tropics. */
export function aridity(lon, lat) {
  let worst = 0;
  for (const [lo, la, reach] of ARID) {
    let dx = Math.abs(lon - lo);
    if (dx > 180) dx = 360 - dx;
    dx *= Math.cos(lat * D2R);
    const dist = Math.hypot(dx, lat - la);
    if (dist < reach) worst = Math.max(worst, 1 - dist / reach);
  }
  return worst;
}

export function terrainColour(h, lat, arid = 0) {
  const a = Math.abs(lat);
  /* `h` is a rank, not a raw field value — see landPoints. So these are
     percentiles of the land that actually exists: the top three per cent
     is snow and the nine under it is rock. Written against the raw field
     they described ground that was not there, and the planet had no
     mountains at all. */
  if (h > 0.97) return BANDS.ice;
  /* The polar rules used to start at 58°, and Eurasia reaches 78° — so a
     quarter of the largest landmass on the planet came out white and the
     eastern hemisphere read as an ice cap. */
  if (a > 72) return h > 0.35 ? BANDS.ice : BANDS.tundra;
  if (h > 0.91) return BANDS.rock;
  /* The sixties are taiga, not tundra. Siberia and northern Canada hold
     the largest forest on Earth between them, and colouring them olive
     turned it into scrubland. */
  if (a > 63) return h > 0.62 ? BANDS.tundra : BANDS.forest;
  /* Deserts by name rather than by parallel — see ARID. This is the line
     that stops India, southern China and the American south coming out the
     same sand colour as Arabia. */
  if (arid > 0.55) return BANDS.desert;
  if (arid > 0.3) return BANDS.dry;
  /* the wet tropics */
  if (a < 11) return h < 0.72 ? BANDS.deep : BANDS.forest;
  /* the savanna shoulder either side of the dry belt */
  if (a < 33) return h < 0.62 ? BANDS.grass : BANDS.dry;
  return h < 0.55 ? BANDS.forest : BANDS.grass;
}

let LAND_PTS = null;   // unit vectors, cached for the page's lifetime
export function landPoints(density = 1) {
  if (LAND_PTS) return LAND_PTS;
  const rand = rng(20260923);
  const pts = [];

  for (const ring of LAND) {
    let lo0 = 180, lo1 = -180, la0 = 90, la1 = -90;
    for (const [lo, la] of ring) {
      if (lo < lo0) lo0 = lo; if (lo > lo1) lo1 = lo;
      if (la < la0) la0 = la; if (la > la1) la1 = la;
    }
    /* Uniform in sin(lat), not in degrees — a degree of latitude near a
       pole covers far less surface than one at the equator, and sampling
       in degrees made Greenland denser than the Congo for no reason but
       its latitude. */
    const s0 = Math.sin(la0 * D2R), s1 = Math.sin(la1 * D2R);
    const area = Math.abs((lo1 - lo0) * (s1 - s0));
    /* Rate, and a floor so the small islands do not vanish. The floor used
       to be forty, which is nothing on Eurasia and everything on Greenland
       — it came out three and a half times denser than Africa for no
       reason but being small. Nine per unit area with a floor of four puts
       every landmass within eight per cent of the same dot spacing, and
       still leaves Britain a few pixels of itself. */
    /* Denser than it was, twice over. At nine dots per unit area the
       continents read as a scatter of specks rather than as ground: the
       shapes were right and you could count the pixels. Thirty-two puts
       the dots about three pixels apart at the size this is drawn, which
       with a dot four pixels across is a surface rather than a stipple.
       What paid for it was batching the paint — see globe.js. */
    const want = Math.round(area * 32 * density) + 8;
    let tries = 0;
    for (let got = 0; got < want && tries < want * 14; tries++) {
      const lon = lo0 + rand() * (lo1 - lo0);
      const lat = Math.asin(s0 + rand() * (s1 - s0)) / D2R;
      if (!inRing(lon, lat, ring)) continue;
      /* Inside a coastline and inside a sea is water. */
      if (SEAS.some((sea) => inRing(lon, lat, sea))) continue;
      got++;
      const la = lat * D2R, lo = lon * D2R;
      const x = Math.cos(la) * Math.sin(lo);
      const y = -Math.sin(la);
      const z = Math.cos(la) * Math.cos(lo);
      /* Computed once at build rather than every frame: four thousand dots
         times two field samples times sixty frames is not free. */
      /* Raw for now; ranked once the whole world is known. */
      pts.push({
        x, y, z, raw: height(x, y, z), lat, grain: .5 + rand() * .7,
        arid: dotAridity(x, y, z, lon, lat),
      });
    }
  }

  /* ---- rank the land, then colour it ----

     A raw field value means nothing on its own. This one runs 0 to 0.72 on
     the continents it happens to cover, so every threshold written above
     that described ground that did not exist — no rock, no snow, nowhere.
     Sorting the land and giving each dot its place in that order makes 0.9
     mean "higher than nine tenths of the land on this planet", which is
     what the bands were always trying to say, and it holds whatever the
     field does on another seed. */
  const order = [...pts].sort((a, b) => a.raw - b.raw);
  const last = Math.max(1, order.length - 1);
  order.forEach((q, i) => { q.h = i / last; });
  for (const q of pts) {
    q.colour = terrainColour(q.h, q.lat, q.arid);
    q.ci = PALETTE_AT.get(q.colour);
    q.lit = relief(q.x, q.y, q.z);
    /* Higher ground reads as slightly heavier, which is the second cue
       after colour that something is raised. */
    q.s = q.grain * (0.82 + q.h * 0.42);
    delete q.raw; delete q.grain; delete q.arid;
  }

  /* There were a hundred and fifty pale cloud puffs here, scattered over
     the whole sphere. Over land they read as haze; over the ocean they read
     as specks of dirt on the screen, which is how they were reported. A
     globe does not need them, and they were the only thing on this one that
     was neither land nor sea. */
  LAND_PTS = pts;
  return pts;
}

