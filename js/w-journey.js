/* ============================================================
   w-journey.js — "journey": travel with the blood, from an artery to a vein.

   Daniel's brief (25 Sep 2026): students confuse artery, arteriole, capillary, venule and vein.
   Travel inside the vessel and watch the structure change; show how it looks inside and how it
   looks in reality; label everything, animate everything, and be exactly right.

   Five stages, each played and then held until "Next step" (the Plants Lab's pollentube rules):
     1 artery   2 arteriole   3 capillary   4 venule   5 vein
   At every stage the dark plate shows two drawings side by side:
     INSIDE      the vessel cut along its length, the blood moving in it — what HAPPENS there;
     CUT ACROSS  the vessel cut across at the dashed line — the STRUCTURE the exam asks for
                 (0610 9.3.1: relative thickness of wall, diameter of lumen, valves in veins).
   Under them, a real image of that vessel where an open-licence one exists. The strip across the
   top is the progress bar and, at the same time, a graph of the blood pressure along the way.

   Between stages the camera ZOOMS, and says so: an artery is millimetres across and a capillary
   micrometres, so no single drawing can hold both. The zoom follows real branching — the artery
   divides, and divides again, until the branch is an arteriole — and the scale bar in each
   drawing gives the true size at every moment.

   Everything drawn is a pure function of the time t (render(t)), so Play, a click on a stage,
   reduced motion and the headless checks all come down to the same frames. box.__seek(t) jumps
   to any frame; box.__onReset stops the clock.

   ---- The biology, and where each number comes from ----
   [OS] OpenStax, Anatomy and Physiology 2e (2022), ch. 20 "The Cardiovascular System: Blood
        Vessels and Circulation", sections 20.1–20.3, CC BY 4.0.
   [GH] Guyton and Hall, Textbook of Medical Physiology, 12th ed. (2011), ch. 14.
   [KL] Klabunde, Cardiovascular Physiology Concepts, "Systemic Circulation" (cvphysiology.com).
   [BU] Burton (1954) Physiological Reviews 34: 619–642 — the classic table of vessel sizes.
   [MU] Muller (2002) Laboratory Investigation 82: 521–533 — where white cells leave the blood.
   [MS] Cambridge 0610 mark schemes, as quoted in the 9.3 lesson slides (slides 20 and 21).

   Artery      thick wall, three layers: endothelium on a thin layer with the internal elastic
               lamina; a thick middle layer of smooth muscle and elastic fibres; an outer layer
               of collagen [OS 20.1, Table 20.1]. Drawn: lumen 4 mm, wall 1 mm [BU]. Round in
               section. No valves. Elastic fibres stretch with each surge and recoil between
               beats [OS 20.2]; the artery does not pump — its recoil maintains the pressure [MS].
               Mean pressure about 93 mmHg at 120/80 [OS 20.2]. The wall is drawn stretching 6%
               in radius with each beat; the wall's area is kept, so it thins as it stretches.
   Arteriole   lumen about 30 µm or less, one or two layers of smooth muscle; the main site of
               resistance, and the steepest fall in pressure [OS 20.1, 20.2]. Drawn: lumen 30 µm,
               two layers of muscle cells. Vasoconstriction narrows it, vasodilation widens it;
               named in 0610 only in S 14.4 (arterioles supplying skin capillaries).
   Capillary   wall = endothelium on a basement membrane, one cell thick; lumen 5–10 µm, so red
               cells (7.5 µm) pass in single file, bent [OS 20.1]. Drawn: lumen 6 µm. Pressure
               about 35 mmHg at the arterial end and 18 mmHg at the venous end [OS 20.3]. Blood
               moves about 0.3 mm/s, 1/1000 of its speed in the aorta, and stays 1–3 s [GH].
               Exchanged here: oxygen and glucose out, carbon dioxide in. Glucose crosses mostly
               between the wall cells, oxygen through them [OS 20.3], so the glucose arrow is drawn
               at a gap between two cells. Urea is NOT drawn entering from these tissue cells: it is
               made only in the liver (the urea cycle), so it enters the blood there; the stage's
               fenced line says so. (The station's exam text lists "urea in", as mark schemes do.)
   Venule      8–100 µm; endothelium, a thin middle layer with few muscle cells, connective
               tissue [OS 20.1]. Drawn: lumen 38 µm. Most white cells leave the blood through
               postcapillary venules, between the endothelial cells [MU].
   Vein        thin wall, wide lumen; the outer layer is the thickest; little muscle; valves let
               blood move only towards the heart [OS 20.1, Table 20.1]. Drawn: lumen 4.6 mm, wall
               0.33 mm (0.5 mm on a 5 mm lumen in [BU]). About 64% of the blood is in the veins
               [GH]. Skeletal muscles AROUND the vein squeeze it; the valve above opens and the
               one below closes [OS 20.2]. Never "muscle in the vein wall pushes the blood" [MS].

   ---- What is simplified, on purpose (and said on the page) ----
   · Time is slowed down, differently at each stage, so the eye can follow the blood; the order of
     speeds is kept (artery > vein > venule > capillary). The heart beats at a real 70 a minute.
   · Blood cells in the artery and the vein are far below the drawing's resolution (7.5 µm in a
     4 mm tube) and are drawn larger; the page says so.
   · A capillary is 0.3–1 mm long [GH]; its colour change is drawn over a shorter stretch.
   · Valves are drawn closer together than in a real leg vein, so two fit in one view.
   · Red = oxygenated, blue = deoxygenated is the diagram convention; the page says once that
     real deoxygenated blood is dark red.
   ============================================================ */
(function (global) {
  'use strict';
  var CL = global.CircLearn;
  if (!CL) return;
  var h = CL.h, esc = CL.esc;
  var UID = 0;

  /* ---------- small maths ---------- */
  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function ease(k) { k = clamp01(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function smooth(k) { k = clamp01(k); return k * k * (3 - 2 * k); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function mod(a, n) { return ((a % n) + n) % n; }
  function n1(v) { return Math.round(v * 10) / 10; }
  function n2(v) { return Math.round(v * 100) / 100; }
  /* anything that moves or scales gets four decimals: a camera scale rounded to two made the
     Plants Lab's drawing shake by several pixels during every zoom */
  function n4(v) { return Math.round(v * 10000) / 10000; }
  /* ...and a SCALE needs significant figures, not decimals: 0.0263 px/µm rounded to four decimals
     is 0.4% out, a third of a pixel at the far side of a vein. Nine significant figures. */
  function nk(v) { return +v.toPrecision(9); }
  function rng(seed) {
    var s = seed >>> 0;
    return function () {
      s = (s + 0x6D2B79F5) >>> 0; var t = s;
      t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  var HEXC = {};
  function hex(c) { return HEXC[c] || (HEXC[c] = [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]); }
  function mixc(a, b, k) {
    k = clamp01(k); if (k === 0) return a; if (k === 1) return b;
    var x = hex(a), y = hex(b);
    return 'rgb(' + Math.round(lerp(x[0], y[0], k)) + ',' + Math.round(lerp(x[1], y[1], k)) + ',' + Math.round(lerp(x[2], y[2], k)) + ')';
  }
  function set(el, attrs) { for (var k in attrs) el.setAttribute(k, attrs[k]); }
  function show(el, op) {
    var v = op > .004;
    if (el.__on !== v) { el.style.display = v ? '' : 'none'; el.__on = v; }
    if (v) { var o = n2(clamp01(op)); if (el.__op !== o) { el.setAttribute('opacity', o); el.__op = o; } }
  }
  /* a smooth path through points (Catmull–Rom as cubic Béziers) */
  function smoothPath(P) {
    var d = 'M' + n2(P[0][0]) + ' ' + n2(P[0][1]);
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      d += 'C' + n2(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n2(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
                 n2(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n2(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n2(p2[0]) + ' ' + n2(p2[1]);
    }
    return d;
  }
  /* the same curve, sampled, with its arc length: for cells that travel along it */
  function sampled(P, per) {
    var pts = [];
    for (var i = 0; i < P.length - 1; i++) {
      var p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || P[i + 1];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (var k = 0; k < per; k++) {
        var u = k / per, v = 1 - u;
        pts.push([v * v * v * p1[0] + 3 * v * v * u * c1[0] + 3 * v * u * u * c2[0] + u * u * u * p2[0],
                  v * v * v * p1[1] + 3 * v * v * u * c1[1] + 3 * v * u * u * c2[1] + u * u * u * p2[1]]);
      }
    }
    pts.push(P[P.length - 1].slice());
    var len = [0];
    for (i = 1; i < pts.length; i++) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    return { pts: pts, len: len, total: len[len.length - 1] };
  }
  function along(path, L) {
    var pts = path.pts, len = path.len, last = pts.length - 1;
    if (L <= 0) return { x: pts[0][0], y: pts[0][1], a: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) };
    if (L >= path.total) return { x: pts[last][0], y: pts[last][1], a: Math.atan2(pts[last][1] - pts[last - 1][1], pts[last][0] - pts[last - 1][0]) };
    var lo = 0, hi = last;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (len[mid] < L) lo = mid; else hi = mid; }
    var u = (L - len[lo]) / ((len[hi] - len[lo]) || 1);
    return { x: lerp(pts[lo][0], pts[hi][0], u), y: lerp(pts[lo][1], pts[hi][1], u), a: Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]) };
  }
  /* the cumulative distance a flow has carried the blood, from a velocity v(t): a table built
     once, so the drawing stays a pure function of t */
  function integral(v, T, dt) {
    var n = Math.ceil(T / dt) + 1, D = new Float64Array(n), prev = v(0);
    for (var i = 1; i < n; i++) { var c = v(i * dt); D[i] = D[i - 1] + (prev + c) / 2 * dt; prev = c; }
    return function (t) {
      if (t <= 0) return v(0) * t;
      var x = t / dt; if (x >= n - 1) return D[n - 1] + v(T) * (t - (n - 1) * dt);
      var i2 = Math.floor(x); return D[i2] + (D[i2 + 1] - D[i2]) * (x - i2);
    };
  }

  /* ---------- the heartbeat ----------
     70 a minute, a resting rate. The pressure rises steeply as the ventricle ejects, falls, shows
     the small second wave after the aortic valve shuts (the dicrotic notch), and decays. */
  var BEAT = 60 / 70;
  var E1 = Math.exp(-.87 / .2);
  function beatPh(t) { return mod(t, BEAT) / BEAT; }
  function pulseP(t) {
    var f = beatPh(t);
    if (f < .13) return smooth(f / .13);
    var p = (Math.exp(-(f - .13) / .2) - E1) / (1 - E1);
    return clamp01(p + .07 * Math.exp(-Math.pow((f - .38) / .035, 2)));
  }
  /* the surge of blood in a large artery: fast while the ventricle ejects, slower between beats
     but never stopping, because the stretched wall recoils */
  function surgeD(t, vd, vs) {
    var n = Math.floor(t / BEAT), f = t / BEAT - n, I = f < .32 ? f / 2 - .32 / (4 * Math.PI) * Math.sin(2 * Math.PI * f / .32) : .16;
    return vd * t + (vs - vd) * BEAT * (n * .16 + I);
  }

  /* ---------- colours: the lab's plate, and a tissue palette that keeps one colour per layer ---------- */
  var C = {
    oxy: '#E8453F', oxyHi: '#FF8A7E', deo: '#3F72D6', deoHi: '#8FB2FF',
    plasmaA: '#3A1519', plasmaV: '#16213F', plasmaM: '#2A1B2E',
    intima: '#E3C7B8', endo: '#F4E1D4', nuc: '#9B6CBA', bm: '#D9C6A0',
    elastic: '#F2C94C',
    muscle: '#B65860', muscleHi: '#D98086', muscleLo: '#7C3A42', smcNuc: '#5A2B5C',
    adv: '#5E5040', advHi: '#C9AF85',
    ct: '#0D1920', ctLine: '#1B2D37',
    tissue: '#1D2F39', tissueEdge: '#3F6273', tissueNuc: '#6A8B9C', fluid: '#0A151B',
    skm: '#963A42', skmHi: '#C25A62', skmLine: '#E08A90',
    wbc: '#E9E3F5', wbcNuc: '#8A68C4',
    o2: '#FF9270', glc: '#F2D06B', co2: '#9CC6DC',
    hint: '#8EA8B5'
  };

  /* ---------- the five stages: the words ----------
     text: sentences; a sentence marked 1 is Supplement (Paper 4), shown with an S.
     Each stage's main text is kept to about 25 words, one idea to a sentence. */
  var STAGES = [
    { key: 'artery', name: 'Artery', t: 0, dur: 12,
      inside: 'Inside an artery', dir: 'Away from the heart',
      text: [['An artery carries blood away from the heart.'],
             ['Its thick wall withstands the high pressure.', 1],
             ['Its elastic fibres stretch with each surge, then recoil.', 1]],
      beyond: 'The three layers are the tunica intima, tunica media and tunica externa. Mean pressure in a large artery is about 93 mmHg.',
      note: 'Blood cells are too small to see at this scale: they are drawn larger.',
      pic: { img: 'jn-artery', w: 900, h: 900, big: 1,
             alt: 'A photograph through a microscope of an artery cut across: a round ring with a thick pink wall around an empty lumen.',
             cap: 'A real artery, cut across and stained (×40). It keeps its round shape. Its wall is thick.',
             credit: 'Андрюша Романов (Andryusha Romanov), Wikimedia Commons, CC BY 4.0',
             url: 'https://commons.wikimedia.org/wiki/File:%D0%90%D1%80%D1%82%D0%B5%D1%80%D0%B8%D1%8F_%D0%BC%D1%8B%D1%88%D0%B5%D1%87%D0%BD%D0%BE_-_%D1%8D%D0%BB%D0%B0%D1%81%D1%82%D0%B8%D1%87%D0%B5%D1%81%D0%BA%D0%BE%D0%B3%D0%BE_%D1%82%D0%B8%D0%BF%D0%B0,_%D0%B3%D0%B5%D0%BC%D0%B0%D1%82%D0%BE%D0%BA%D1%81%D0%B8%D0%BB%D0%B8%D0%BD_-_%D1%8D%D0%BE%D0%B7%D0%B8%D0%BD,_%D1%83%D0%B2%D0%B5%D0%BB%D0%B8%D1%87%D0%B5%D0%BD%D0%B8%D0%B5_40.jpg' } },
    { key: 'arteriole', name: 'Arteriole', t: 12, dur: 13, ext: 'arteriole',
      inside: 'Inside an arteriole', dir: 'To the capillaries',
      text: [['Arteries divide into narrower arterioles.'],
             ['The muscle in their wall contracts to narrow them, or relaxes to widen them.'],
             ['This controls the blood flow into the capillaries.']],
      beyond: 'The lumen of an arteriole is about 30 µm across, or less. Blood pressure falls most steeply here.',
      note: '',
      pic: { img: 'jn-skin-capillaries', w: 900, h: 444, big: 1,
             alt: 'Dark red hairpin loops of capillaries in pale skin, seen from above through a microscope.',
             cap: 'Real capillary loops in the skin at the base of a fingernail, in a living person. Arterioles control how much blood flows into loops like these.',
             credit: 'Dmitry Stavtsev, Nikita Margaryants and Mikhail Volkov, Wikimedia Commons, CC BY 4.0',
             url: 'https://commons.wikimedia.org/wiki/File:Nailfold_Capillaries.png' } },
    { key: 'capillary', name: 'Capillary', t: 25, dur: 14,
      inside: 'Inside a capillary', dir: 'To the venules',
      text: [['Capillaries exchange substances with the tissue cells.'],
             ['Oxygen and glucose diffuse out; carbon dioxide diffuses in.'],
             ['The wall is one cell thick: a short diffusion distance.', 1]],
      beyond: 'Blood moves only about 0.3 mm a second here, so it stays 1–3 seconds: time for exchange. Urea is made only in the liver, so it enters the blood there.',
      note: 'A real capillary is 0.3–1 mm long: the colour change is drawn over a shorter stretch.',
      pic: { img: 'jn-capillary-tem', w: 900, h: 723, big: 1,
             alt: 'An electron micrograph in black and white: a round capillary with one dark, curved red blood cell almost filling it, and a thin wall around it.',
             cap: 'A real capillary in the pancreas, cut across and seen with an electron microscope. One red blood cell almost fills the lumen. Its wall is one cell thick. Scale bar: 1 µm.',
             credit: 'Louisa Howard, Dartmouth Electron Microscope Facility, public domain',
             url: 'https://commons.wikimedia.org/wiki/File:A_red_blood_cell_in_a_capillary,_pancreatic_tissue_-_TEM.jpg' } },
    { key: 'venule', name: 'Venule', t: 39, dur: 12, ext: 'venule',
      inside: 'Inside a venule', dir: 'To the veins',
      text: [['Capillaries join to form venules.'],
             ['The blood is now deoxygenated, and its pressure is low.'],
             ['The wall is thin.']],
      beyond: 'A venule is about 8–100 µm across. White blood cells mostly leave the blood from venules, by squeezing between the wall cells.',
      note: '',
      pic: null },
    { key: 'vein', name: 'Vein', t: 51, dur: 15,
      inside: 'Inside a vein', dir: 'Towards the heart',
      text: [['A vein returns blood to the heart, at low pressure.'],
             ['Its wall is thin and its lumen is wide.'],
             ['Muscles around the vein squeeze it; its valves prevent backflow.', 1]],
      beyond: 'At any moment about 64% of the blood is in the veins. Pressure falls to about 0 mmHg at the heart.',
      note: 'Blood cells are drawn larger than scale, and the valves closer together than in a real vein.',
      pic: { img: 'jn-artery-vein', w: 600, h: 400, big: 0,
             alt: 'A photograph through a microscope: a round artery with a thick pink wall, and beside it a flattened vein with a thinner wall and a wider lumen.',
             cap: 'A real vein beside a real artery, cut across (×40). The vein has a thinner wall and a wider, flattened lumen. The artery keeps its round shape.',
             credit: 'From the 9.3 lesson slides', url: '' } }
  ];
  var END = 66;
  var WEBP = (function () {
    try { var c = document.createElement('canvas'); c.width = c.height = 1; return c.toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  })();
  var TAG = {
    arteriole: { chip: 'Not in 9.3', note: 'Arterioles appear in 14.4 (S): vasoconstriction and vasodilation in the skin.' },
    venule: { chip: 'Beyond the syllabus', note: '' }
  };
  /* the comparison the exam asks for (9.3.1 and S 9.3.4), for the three vessels it names */
  var TABLE = {
    head: ['', 'Artery', 'Capillary', 'Vein'],
    rows: [['Wall', 'thick: muscle and elastic fibres', 'one cell thick', 'thin: little muscle'],
           ['Lumen', 'narrow', 'about one red blood cell wide', 'wide'],
           ['Valves', 'none', 'none', 'valves prevent backflow'],
           ['Blood pressure', 'high, in surges', 'lower, and falling', 'low and steady', 1]]
  };

  /* ---------- the sizes drawn (µm), each from the sources above ---------- */
  var ART = { ri: 2000, iel: 2040, med: 2070, adv: 2660, ro: 3000 };        /* [BU] lumen 4 mm, wall 1 mm */
  var AOL = { ri: 15, endo: 15.8, m1: 20.4, m2: 25.3, ro: 28.3 };            /* [OS] lumen ≤30 µm, 1–2 muscle layers */
  var CAP = { ri: 3, endo: 3.5, bm: 3.75, fluid: 5.4 };                       /* [OS] lumen 5–10 µm; RBC 7.5 µm */
  var VNL = { ri: 19, endo: 19.6, ro: 21.5 };                                 /* [OS] 8–100 µm; thin wall */
  var VEIN = { r0: 2300, intima: 15, media: 105, adv: 210 };                  /* [BU] [OS] thin wall, outer layer thickest */
  VEIN.wall = VEIN.intima + VEIN.media + VEIN.adv;

  /* ---------- the stages' frames and cameras (µm) ----------
     F: the height of the view. The zoom between stages follows from F: ×100, ×2, ÷2, ÷100. */
  var SC = [
    { F: 7000, camE: [-1400, 0], camH: [4800, 0], pan: [0.3, 5.0], cut: 3000 },
    { F: 70, camE: [20, 0], camH: [105, 0], pan: [2.7, 5.2], cut: 88 },
    { F: 35, camE: [40, 0], camH: [62, 0], pan: [1.7, 6.5], cut: 62 },
    { F: 70, camE: [-25, 0], camH: [45, 0], pan: [1.8, 6.0], cut: 60 },
    { F: 7000, camE: [-2600, 1800], camH: [3850, 0], camHn: [4350, 0], pan: [3.1, 6.0], cut: 3850 }
  ];
  /* the joins between stages: fA in the old stage's world is the same point as fB in the new one */
  /* keys: the camera on its way, [u, x, y, zoom relative to the old stage], so it follows the
     branches instead of cutting the corner */
  var TR = [null,
    { d: 2.8, fA: [12600, -4890], fB: [0, 0], dir: 1, keys: [[.3, 10800, -3900, 1.6]] },            /* into a branch, ×100 */
    { d: 1.6, fA: [300, 0], fB: [0, 0], dir: 1 },                                                   /* into a capillary, ×2 */
    { d: 1.8, fA: [160, 0], fB: [-60, 0], dir: -1 },                                                /* out, as capillaries join, ÷2 */
    { d: 3.0, fA: [300, 0], fB: [-6750, 6000], dir: -1, keys: [[.42, 900, -150, .1], [.74, 2600, -2000, .025]] }   /* out, as venules join veins, ÷100 */
  ];

  /* ---------- the artery's branches: it divides until a branch is an arteriole ---------- */
  var ATREE = [
    { p: [[8200, -1650], [8900, -2500], [9800, -3350], [10700, -4000], [11350, -4420]], ro: 700, ri: 470 },
    { p: [[11350, -4420], [11750, -4640], [12050, -4770]], ro: 230, ri: 150 },
    { p: [[12050, -4770], [12250, -4850], [12420, -4885], [12520, -4890]], ro: 80, ri: 52 },
    { p: [[12520, -4890], [12620, -4890]], ro: AOL.ro, ri: AOL.ri },
    { p: [[11350, -4420], [11520, -4900], [11600, -5500], [11650, -6400]], ro: 520, ri: 350 },
    { p: [[12050, -4770], [12230, -4520], [12420, -4280]], ro: 180, ri: 118 },
    { p: [[12520, -4890], [12600, -4990], [12700, -5090]], ro: 55, ri: 36 }
  ];
  /* ...and the vein's tributaries: venules join into veins, which join the vein */
  var VTREE = [
    { p: [[-6750, 6000], [-6440, 6000]], ro: VNL.ro, ri: VNL.ri },
    { p: [[-6440, 6000], [-6150, 5950], [-5900, 5880]], ro: 70, ri: 62 },
    { p: [[-5900, 5880], [-5400, 5720], [-4800, 5480]], ro: 250, ri: 225 },
    { p: [[-4800, 5480], [-3800, 4700], [-2800, 3700], [-2100, 2950], [-1750, 2400], [-1650, 1900]], ro: 780, ri: 700 },
    { p: [[-6150, 5950], [-6060, 6180], [-5960, 6450]], ro: 55, ri: 48 },
    { p: [[-5400, 5720], [-5320, 6120], [-5260, 6650]], ro: 190, ri: 170 },
    { p: [[-3800, 4700], [-3520, 5350], [-3300, 6300]], ro: 560, ri: 500 }
  ];

  /* ---------- the vein's pump: skeletal muscle around the vein, and two valves ---------- */
  var PUMP = { xA: 700, xB: 7000, xm: 3850, w: 2500, beta: .5, starts: [6.4, 9.4, 12.4], TC: .75, TR: 1.2, last: 3.0 };
  var A0 = Math.PI * VEIN.r0 * VEIN.r0;
  function bump(x) { var d = (x - PUMP.xm) / PUMP.w; return Math.abs(d) >= 1 ? 0 : Math.pow(Math.cos(d * Math.PI / 2), 2); }
  /* ∫ b and ∫ b², from the start of the squeezed stretch to x (closed forms of cos² and cos⁴) */
  function bumpInt(x) {
    var d = clamp((x - PUMP.xm) / PUMP.w, -1, 1), th = d * Math.PI / 2, k = 2 * PUMP.w / Math.PI;
    return [k * (th / 2 + Math.sin(2 * th) / 4 + Math.PI / 4),
            k * (3 * th / 8 + Math.sin(2 * th) / 4 + Math.sin(4 * th) / 32 + 3 * Math.PI / 16)];
  }
  /* the squeeze s (0 relaxed … 1 fully squeezed) and which way it is going, at stage time tl */
  function pumpAt(tl) {
    var P = PUMP, st = P.starts;
    for (var i = st.length - 1; i >= 0; i--) {
      if (tl < st[i]) continue;
      var u = tl - st[i], tc = i === st.length - 1 ? P.last : P.TC;
      if (u < tc) return { s: smooth(u / tc), dir: 1, i: i, u: u, tc: tc };
      if (i === st.length - 1) return { s: 1, dir: 0, i: i };
      if (u < tc + P.TR) return { s: 1 - smooth((u - tc) / P.TR), dir: -1, i: i, u: u - tc };
      return { s: 0, dir: 0, i: i };
    }
    return { s: 0, dir: 0, i: -1 };
  }
  function vmOf(s) { var B = PUMP.beta, w = PUMP.w; return A0 * (-2 * B * s * w + B * B * s * s * .75 * w); }   /* V_M(s) − V_M(0) */
  var Q0 = A0 * 1100;                         /* the slow steady flow with both valves open, per second */
  var RAMP = .45;                             /* ...which starts again gently as valve B opens */
  function rampInt(tau) { if (tau <= 0) return 0; if (tau >= RAMP) return RAMP / 2 + (tau - RAMP); var u = tau / RAMP; return RAMP * (u * u * u - u * u * u * u / 2); }
  /* the volume that has passed valve A by stage time tl: nothing while the muscle squeezes (A is
     shut), the refill while it relaxes (B is shut), and the steady flow at rest, starting gently */
  function flowA(tl) {
    var P = PUMP, st = P.starts, n = st.length, Q;
    if (tl <= st[0]) return Q0 * tl;
    Q = Q0 * st[0];
    for (var i = 0; i < n; i++) {
      var tc = i === n - 1 ? P.last : P.TC, s1 = st[i] + tc;
      if (tl <= s1 || i === n - 1) return Q;
      var s2 = s1 + P.TR;
      if (tl <= s2) return Q + vmOf(1 - smooth((tl - s1) / P.TR)) - vmOf(1);
      Q += vmOf(0) - vmOf(1);
      if (tl <= st[i + 1]) return Q + Q0 * rampInt(tl - s2);
      Q += Q0 * rampInt(st[i + 1] - s2);
    }
    return Q;
  }
  function veinR(x, s) { return VEIN.r0 * (1 - PUMP.beta * s * bump(x)); }
  /* the valve sinus: the vein bulges a little where each valve's cusps sit */
  function sinus(x) {
    var b = 0;
    [PUMP.xA, PUMP.xB].forEach(function (xv) { var d = (x - (xv + 900)) / 1300; if (Math.abs(d) < 1) b += 190 * Math.pow(Math.cos(d * Math.PI / 2), 2); });
    return b;
  }
  /* where a tracer sits: the blood between the far left and x has a volume; invert it */
  var XREF = -9800;
  function volAt(x, s) {
    var I = bumpInt(x), B = PUMP.beta;
    return A0 * ((x - XREF) - s * (2 * B * I[0] - B * B * s * I[1]));
  }
  function xOfVol(v, s) {
    var P = PUMP, lo = P.xm - P.w, hi = P.xm + P.w;
    var x = XREF + v / A0;
    if (x <= lo) return x;
    var vHi = volAt(hi, s);
    if (v >= vHi) return hi + (v - vHi) / A0;
    var a = lo, b = hi;
    for (var k = 0; k < 26; k++) { var m = (a + b) / 2; if (volAt(m, s) < v) a = m; else b = m; }
    return (a + b) / 2;
  }

  /* ---------- text ---------- */
  var FAMILY = 'Calibri, Carlito, "Segoe UI", system-ui, -apple-system, "Helvetica Neue", sans-serif';
  var mctx = null, WCACHE = {};
  function textW(s, font) {
    var key = font + '|' + s;
    if (WCACHE[key] == null) {
      try { mctx = mctx || document.createElement('canvas').getContext('2d'); mctx.font = '600 ' + font + 'px ' + FAMILY; WCACHE[key] = mctx.measureText(s).width; }
      catch (e) { WCACHE[key] = s.length * font * .53; }
    }
    return WCACHE[key];
  }
  function wrapText(text, room, font) {
    var words = text.split(' '), lines = [], cur = '';
    words.forEach(function (w) { if (!cur) cur = w; else if (textW(cur + ' ' + w, font) <= room) cur += ' ' + w; else { lines.push(cur); cur = w; } });
    if (cur) lines.push(cur);
    return lines;
  }

  /* ============================================================
     The widget
     ============================================================ */
  function journey(spec) {
    var uid = ++UID;
    function id(k) { return 'jn' + k + uid; }
    var box = h('div', 'widget jn-w');
    box.appendChild(CL.head(spec.title || 'Travel with the blood', spec.ask, 'Press play'));
    var root = h('div', 'jn');
    box.appendChild(root);

    /* ----- the controls ----- */
    var bar = h('div', 'jn__bar');
    var play = h('button', 'jn__play'); play.type = 'button';
    var all = h('button', 'jn__all', '<span class="jn__ico" aria-hidden="true">▶▶</span> Play all'); all.type = 'button';
    var count = h('span', 'jn__count');
    bar.appendChild(play); bar.appendChild(all); bar.appendChild(count);
    root.appendChild(bar);

    /* ----- the route: progress, and the blood pressure along the way ----- */
    var routeBox = h('div', 'jn__route');
    root.appendChild(routeBox);

    /* ----- the plate ----- */
    var plate = h('div', 'jn__plate');
    var views = h('div', 'jn__views');
    var svgT = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    var svgS = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgT.setAttribute('class', 'jn__svg jn__svg--in'); svgS.setAttribute('class', 'jn__svg jn__svg--x');
    svgT.setAttribute('role', 'img'); svgS.setAttribute('role', 'img');
    views.appendChild(svgT); views.appendChild(svgS);
    plate.appendChild(views);
    var key = h('p', 'jn__key');
    plate.appendChild(key);
    root.appendChild(plate);

    /* ----- the words, and the real picture ----- */
    var below = h('div', 'jn__below');
    var cap = h('div', 'jn__cap'); cap.setAttribute('aria-live', 'polite');
    var real = h('figure', 'jn__real');
    below.appendChild(cap); below.appendChild(real);
    root.appendChild(below);
    var table = null;
    if (spec.table !== false) {
      table = h('table', 'jn__sum');
      table.innerHTML = '<caption>The three vessels in 9.3</caption><thead><tr>' + TABLE.head.map(function (c, i) {
        return '<th scope="col" data-col="' + (i - 1) + '">' + esc(c) + '</th>';
      }).join('') + '</tr></thead><tbody>' + TABLE.rows.map(function (r) {
        return '<tr><th scope="row">' + esc(r[0]) + (r[4] ? ' <span class="jn__s" aria-label="Supplement">S</span>' : '') + '</th>' +
          r.slice(1, 4).map(function (c, i) { return '<td data-col="' + i + '">' + esc(c) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody>';
      root.appendChild(table);
    }

    /* ============================================================
       Layout: every size in the two drawings is a CSS pixel (viewBox = pixels), worked out from
       the width the widget really has. Two drawings side by side from 600 px; one above the other
       below that. Each drawing keeps a gutter on its right for its labels.
       ============================================================ */
    var G = null, FONT = 13;
    function layout() {
      var W = Math.floor(plate.getBoundingClientRect().width || root.getBoundingClientRect().width || 700);
      var narrow = W < 600, pad = narrow ? 16 : 24;
      var PW = Math.max(260, W - pad);
      FONT = PW < 420 ? 12 : 13;
      var g = { W: W, PW: PW, narrow: narrow };
      if (!narrow) {
        var gut = clamp(Math.round(PW * .165), 112, 152);
        var SWd = clamp(Math.round(PW * .245), 168, 240);
        var H = clamp(Math.round(PW * .33), 216, 284);
        var TW = PW - 10 - SWd - gut;
        g.T = { w: TW, h: H, VX: 0, VY: 24, VW: TW - gut, VH: H - 50 };
        g.S = { w: SWd + gut, h: H, VX: 0, VY: 24, VW: SWd, VH: H - 50 };
      } else {
        var gut2 = clamp(Math.round(PW * .385), 112, 150);
        var H1 = clamp(Math.round(PW * .64), 196, 250), H2 = clamp(Math.round(PW * .7), 200, 260);
        g.T = { w: PW, h: H1, VX: 0, VY: 24, VW: PW - gut2, VH: H1 - 50 };
        g.S = { w: PW, h: H2, VX: 0, VY: 24, VW: PW - gut2, VH: H2 - 50 };
      }
      [g.T, g.S].forEach(function (v) { v.gx = v.VX + v.VW + 7; v.gw = v.w - v.gx - 2; v.cx = v.VX + v.VW / 2; v.cy = v.VY + v.VH / 2; });
      return g;
    }

    /* ============================================================
       The scenes. World units are micrometres; the axis of each vessel is y = 0 and the blood
       flows towards +x. Each scene gives its markup (built once) and an update(tl) for one frame.
       ============================================================ */
    var R = {};      /* named elements, by data-r */
    var CELLS = {};  /* per-scene moving things */
    var SCN = [];    /* the scene objects */

    function tubeMarkup(tree, cols, walls) {
      return tree.map(function (tb) {
        var d = smoothPath(tb.p);
        if (walls) return '<path d="' + d + '" fill="none" stroke="' + cols[0] + '" stroke-width="' + n2(tb.ro * 2) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
          '<path d="' + d + '" fill="none" stroke="' + cols[1] + '" stroke-width="' + n2((tb.ri + (tb.ro - tb.ri) * .55) * 2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
        return '<path d="' + d + '" fill="none" stroke="' + cols[2] + '" stroke-width="' + n2(tb.ri * 2) + '" stroke-linecap="round" stroke-linejoin="round"/>';
      }).join('');
    }
    function wavy(x0, x1, y, amp, per) {
      var d = 'M' + x0 + ' ' + y, n = Math.ceil((x1 - x0) / per * 4);
      for (var i = 1; i <= n; i++) { var x = x0 + i * per / 4; d += 'L' + n2(x) + ' ' + n2(y + amp * Math.sin(i * Math.PI / 2)); }
      return d;
    }
    function ringPath(r, n, wob, seed, rx, ry) {       /* a closed ring, a little irregular */
      var R2 = rng(seed), ph = [R2() * 6, R2() * 6, R2() * 6], d = '';
      for (var i = 0; i <= n; i++) {
        var a = i / n * Math.PI * 2, k = 1 + wob * (Math.sin(3 * a + ph[0]) * .5 + Math.sin(5 * a + ph[1]) * .3 + Math.sin(2 * a + ph[2]) * .2);
        d += (i ? 'L' : 'M') + n2((rx || 1) * r * k * Math.cos(a)) + ' ' + n2((ry || 1) * r * k * Math.sin(a));
      }
      return d + 'Z';
    }

    /* body cells packed round small vessels, as in the capillary stage, kept clear of the vessels;
       each vessel then gets its band of tissue fluid */
    function tissueField(x0, x1, y0, y1, seed, clear) {
      var Rt = rng(seed), o = '', stepX = 17.5, stepY = 16.5;
      for (var yy = y0; yy < y1; yy += stepY) {
        for (var xx = x0 + ((yy / stepY) % 2 ? stepX / 2 : 0); xx < x1; xx += stepX) {
          var cx = xx + (Rt() - .5) * 4, cy = yy + (Rt() - .5) * 4, w = 13 + Rt() * 4.5, hh = 12 + Rt() * 4, r = Math.max(w, hh) / 2;
          if (clear(cx, cy, r)) continue;
          o += '<rect x="' + n1(cx - w / 2) + '" y="' + n1(cy - hh / 2) + '" width="' + n1(w) + '" height="' + n1(hh) + '" rx="2.6" transform="rotate(' + n1((Rt() - .5) * 24) + ' ' + n1(cx) + ' ' + n1(cy) + ')" fill="' + C.tissue + '" stroke="' + C.tissueEdge + '" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
               '<ellipse cx="' + n1(cx + (Rt() - .5) * 4) + '" cy="' + n1(cy + (Rt() - .5) * 3) + '" rx="' + n1(2.6 + Rt()) + '" ry="' + n1(1.9 + Rt() * .5) + '" fill="' + C.tissueNuc + '" opacity=".75"/>';
        }
      }
      return o;
    }
    function distTo(path, x, y) {
      var m = Infinity, pts = path.pts;
      for (var i = 0; i < pts.length; i += 2) { var d = Math.hypot(pts[i][0] - x, pts[i][1] - y); if (d < m) m = d; }
      return m;
    }

    /* ---------------- 1 ARTERY ---------------- */
    function artery() {
      var A = ART, X0 = -17000, X1 = 17000;
      function wallTop() {
        var s = '<rect x="' + X0 + '" y="' + -A.ro + '" width="' + (X1 - X0) + '" height="' + (A.ro - A.adv) + '" fill="url(#' + id('adv') + ')"/>' +
                '<rect x="' + X0 + '" y="' + -A.adv + '" width="' + (X1 - X0) + '" height="' + (A.adv - A.med) + '" fill="url(#' + id('med') + ')"/>' +
                '<rect x="' + X0 + '" y="' + -A.med + '" width="' + (X1 - X0) + '" height="' + (A.med - A.ri) + '" fill="' + C.intima + '"/>' +
                '<path d="' + wavy(X0, X1, -A.iel, 7, 380) + '" fill="none" stroke="' + C.elastic + '" stroke-width="1.4" vector-effect="non-scaling-stroke"/>' +
                '<path d="M' + X0 + ' ' + -(A.ri + 4) + 'H' + X1 + '" stroke="' + C.endo + '" stroke-width="1.6" vector-effect="non-scaling-stroke"/>';
        for (var x = X0 + 200; x < X1; x += 640) s += '<ellipse cx="' + x + '" cy="' + -(A.ri + 18) + '" rx="170" ry="26" fill="' + C.nuc + '"/>';
        return s;
      }
      var top = wallTop();
      var s = '<g data-r="aS">' +
        '<rect x="' + X0 + '" y="-12000" width="' + (X1 - X0) + '" height="24000" fill="url(#' + id('ct') + ')"/>' +
        '<rect x="' + X0 + '" y="-2300" width="' + (X1 - X0) + '" height="4600" fill="' + C.plasmaA + '"/>' +
        '<g clip-path="url(#' + id('aclip') + ')">' + tubeMarkup(ATREE, [C.adv, C.muscleLo, C.plasmaA], 1) + '</g>' +
        '<g data-r="aWt">' + top + '</g><g data-r="aWb"><g transform="scale(1 -1)">' + top + '</g></g>' +
        tubeMarkup(ATREE, [C.adv, C.muscleLo, C.plasmaA], 0) +
        '<g data-r="aCells"></g></g>';
      /* the cross-section: every layer is a ring; each keeps its area as the artery stretches */
      var R3 = rng(11), sm = '', col = '';
      [2200, 2390, 2560].forEach(function (rr, ring) {
        for (var i = 0; i < 17; i++) {
          var a0 = (i + ring * .37 + R3() * .3) / 17 * Math.PI * 2, da = .29 + R3() * .08, th = 34 + R3() * 10;
          sm += spindle(rr, a0, da, th, C.muscleHi) ;
        }
      });
      for (var j = 0; j < 46; j++) {
        var ra = 2720 + R3() * 240, aa = R3() * Math.PI * 2, dd = .08 + R3() * .1;
        col += '<path d="M' + n2(ra * Math.cos(aa)) + ' ' + n2(ra * Math.sin(aa)) + 'A' + ra + ' ' + ra + ' 0 0 1 ' + n2(ra * Math.cos(aa + dd)) + ' ' + n2(ra * Math.sin(aa + dd)) + '" fill="none" stroke="' + C.advHi + '" stroke-width="22" stroke-linecap="round" opacity=".7"/>';
      }
      var nucs = '';
      for (var q = 0; q < 12; q++) { var an = q / 12 * Math.PI * 2 + .2; nucs += '<ellipse cx="' + n2(2016 * Math.cos(an)) + '" cy="' + n2(2016 * Math.sin(an)) + '" rx="120" ry="24" transform="rotate(' + n2(an * 180 / Math.PI + 90) + ' ' + n2(2016 * Math.cos(an)) + ' ' + n2(2016 * Math.sin(an)) + ')" fill="' + C.nuc + '"/>'; }
      var dots = '';
      for (var k = 0; k < 70; k++) { var rr2 = Math.sqrt(R3()) * 1850, a2 = R3() * Math.PI * 2; dots += '<circle cx="' + n1(rr2 * Math.cos(a2)) + '" cy="' + n1(rr2 * Math.sin(a2)) + '" r="44" fill="' + (k % 3 ? C.oxy : C.oxyHi) + '"/>'; }
      var x = '<g data-r="aX">' +
        '<circle data-r="axAdv" r="' + A.ro + '" fill="' + C.adv + '"/><g data-r="axAdvT">' + col + '</g>' +
        '<circle data-r="axMed" r="' + A.adv + '" fill="' + C.muscleLo + '"/><g data-r="axMedT">' + sm +
          '<circle r="2290" fill="none" stroke="' + C.elastic + '" stroke-width="16" opacity=".85"/><circle r="2470" fill="none" stroke="' + C.elastic + '" stroke-width="16" opacity=".85"/></g>' +
        '<circle data-r="axInt" r="' + A.med + '" fill="' + C.intima + '"/>' +
        '<circle data-r="axIel" r="' + A.iel + '" fill="none" stroke="' + C.elastic + '" stroke-width="22"/>' +
        '<circle data-r="axLum" r="' + A.ri + '" fill="' + C.plasmaA + '" stroke="' + C.endo + '" stroke-width="22"/>' +
        '<g data-r="axNuc">' + nucs + '</g><g data-r="axDots">' + dots + '</g></g>';
      return { markup: s, xmarkup: x, ext: 3000 * 2 };
    }
    /* a smooth-muscle cell cut along its length: a curved spindle with its nucleus */
    function spindle(r, a0, da, th, fill) {
      var n = 9, o = '', i2, a, w;
      for (i2 = 0; i2 <= n; i2++) { a = a0 + da * i2 / n; w = th * Math.sin(Math.PI * i2 / n); o += (i2 ? 'L' : 'M') + n1((r + w) * Math.cos(a)) + ' ' + n1((r + w) * Math.sin(a)); }
      for (i2 = n; i2 >= 0; i2--) { a = a0 + da * i2 / n; w = th * Math.sin(Math.PI * i2 / n); o += 'L' + n1((r - w) * Math.cos(a)) + ' ' + n1((r - w) * Math.sin(a)); }
      var am = a0 + da / 2;
      return '<path d="' + o + 'Z" fill="' + fill + '" opacity=".9"/><ellipse cx="' + n1(r * Math.cos(am)) + '" cy="' + n1(r * Math.sin(am)) + '" rx="' + n1(r * da * .2) + '" ry="' + n1(th * .42) +
        '" transform="rotate(' + n2(am * 180 / Math.PI + 90) + ' ' + n1(r * Math.cos(am)) + ' ' + n1(r * Math.sin(am)) + ')" fill="' + C.smcNuc + '"/>';
    }

    /* ---------------- 2 ARTERIOLE ---------------- */
    var AOLP = null;
    function arteriole() {
      var a = AOL, s = '';
      /* the three capillaries it divides into, and the lanes of cells into them */
      var CAPS = [
        [[236, -5.2], [252, -12], [272, -27], [300, -46], [345, -74]],
        [[236, 0], [300, 0], [360, 0], [440, 0]],
        [[236, 5.2], [252, 12.5], [272, 28], [300, 47], [345, 76]]
      ];
      AOLP = {
        caps: CAPS,
        lanes: [-8, 0, 8].map(function (y, i) {
          var P = [[-160, y], [150, y], [205, y * .92], [232, y * .7]].concat(CAPS[i].slice(1));
          return sampled(P, 10);
        })
      };
      s += '<rect x="-300" y="-160" width="900" height="320" fill="url(#' + id('cts') + ')"/>';
      var capA = CAPS.map(function (P) { return sampled(P, 8); });
      s += tissueField(236, 520, -140, 145, 212, function (x, y, r) {
        if (x < 250 + r && Math.abs(y) < 34) return true;
        for (var q = 0; q < capA.length; q++) if (distTo(capA[q], x, y) < r + 4.6) return true;
        return false;
      });
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.fluid + '" stroke-width="' + n1(CAP.fluid * 2) + '" stroke-linecap="round"/>'; }).join('');
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.endo + '" stroke-width="7.4" stroke-linecap="round"/>'; }).join('');
      s += '<path data-r="bTaperW" fill="' + C.muscleLo + '"/>';
      s += '<rect x="-300" y="-19" width="515" height="38" fill="' + C.plasmaA + '"/>';
      function wallTop() {
        var R4 = rng(21), o = '<rect x="-300" y="' + -a.ro + '" width="515" height="' + (a.ro - a.m2) + '" fill="' + C.adv + '"/>';
        for (var x = -296; x < 212; x += 7 + R4() * 5) o += '<path d="M' + n1(x) + ' ' + n1(-a.ro + .6 + R4() * 2) + 'q4 ' + n1(-.8 + R4() * 1.6) + ' 9 0" fill="none" stroke="' + C.advHi + '" stroke-width=".55" opacity=".8"/>';
        o += '<rect x="-300" y="' + -a.m2 + '" width="515" height="' + (a.m2 - a.endo) + '" fill="' + C.muscleLo + '"/>';
        /* the muscle cells wrap round the arteriole, so a cut along it shows each one cut across */
        [a.m1 + 2.35, a.endo + 2.3].forEach(function (yc, row) {
          for (var x2 = -298 + row * 2.7; x2 < 214; x2 += 5.4) o += '<ellipse cx="' + n1(x2) + '" cy="' + n1(-yc) + '" rx="2.55" ry="2.15" fill="' + C.muscle + '"/>' +
            ((Math.round(x2 * 7) % 3) ? '' : '<ellipse cx="' + n1(x2) + '" cy="' + n1(-yc) + '" rx="1.1" ry="1" fill="' + C.smcNuc + '"/>');
        });
        o += '<rect x="-300" y="' + -a.endo + '" width="515" height="' + (a.endo - a.ri) + '" fill="' + C.endo + '"/>';
        for (var x3 = -290; x3 < 212; x3 += 17) o += '<ellipse cx="' + x3 + '" cy="' + -(a.ri + .35) + '" rx="4.2" ry="1.05" fill="' + C.nuc + '"/>';
        return o;
      }
      var top = wallTop();
      s += '<g data-r="bWt">' + top + '</g><g data-r="bWb"><g transform="scale(1 -1)">' + top + '</g></g>';
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.plasmaA + '" stroke-width="6" stroke-linecap="round"/>'; }).join('');
      s += '<path data-r="bTaperL" fill="' + C.plasmaA + '"/>';
      s += '<g data-r="bCells"></g>';
      var x = '<g data-r="bX"><circle data-r="bxAdv" fill="' + C.adv + '"/><circle data-r="bxMed" fill="' + C.muscleLo + '"/><g data-r="bxSmc"></g>' +
        '<circle data-r="bxEnd" fill="' + C.endo + '"/><circle data-r="bxLum" fill="' + C.plasmaA + '"/><g data-r="bxNuc"></g><g data-r="bxRbc"></g></g>';
      return { markup: '<g data-r="bS">' + s + '</g>', xmarkup: x };
    }
    /* the arteriole's tone: normal, then constricted, then back past normal to dilated */
    function toneAt(tl) {
      if (tl < 5.6) return 0;
      if (tl < 7.2) return smooth(seg(tl, 5.6, 7.2));
      if (tl < 8.4) return 1;
      return 1 - 2 * smooth(seg(tl, 8.4, 10.6));
    }
    function aolRi(c) { return AOL.ri * (c >= 0 ? 1 - .32 * c : 1 - .2 * c); }
    function aolRo(c) { var ri = aolRi(c); return Math.sqrt(AOL.ro * AOL.ro - AOL.ri * AOL.ri + ri * ri); }

    /* ---------------- 3 CAPILLARY ---------------- */
    function capillary() {
      var c = CAP, s = '', R5 = rng(31);
      s += '<rect x="-120" y="-40" width="420" height="80" fill="' + C.fluid + '"/>';
      /* tissue cells either side, with the tissue fluid between them and the capillary */
      [-1, 1].forEach(function (sg) {
        var x = -130 + R5() * 6;
        while (x < 300) {
          var w = 15 + R5() * 7, y0 = sg * (c.fluid + .4 + R5() * .8), y1 = sg * 26, r = 2.4;
          var yA = Math.min(y0, y1), hgt = Math.abs(y1 - y0);
          s += '<rect x="' + n1(x) + '" y="' + n1(yA) + '" width="' + n1(w - 1.1) + '" height="' + n1(hgt) + '" rx="' + r + '" fill="' + C.tissue + '" stroke="' + C.tissueEdge + '" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
               '<ellipse cx="' + n1(x + w * (.35 + R5() * .3)) + '" cy="' + n1(sg * (c.fluid + 5.2 + R5() * 3)) + '" rx="' + n1(3 + R5()) + '" ry="' + n1(2 + R5() * .6) + '" fill="' + C.tissueNuc + '" opacity=".75"/>';
          x += w;
        }
      });
      s += '<rect x="-120" y="' + -c.ri + '" width="360" height="' + c.ri * 2 + '" fill="' + C.plasmaM + '"/>';
      /* the wall: flat endothelial cells, the gaps between them, and each cell's nucleus */
      CAPCLEFT = [];
      [-1, 1].forEach(function (sg) {
        s += '<path d="M-120 ' + sg * c.bm + 'H240" stroke="' + C.bm + '" stroke-width="1" opacity=".75" vector-effect="non-scaling-stroke"/>';
        var x = -120 + (sg > 0 ? 9 : 0);
        while (x < 240) {
          var w = 19 + Math.abs(Math.round(x * 13) % 7);
          if (sg < 0) CAPCLEFT.push(x);
          s += '<rect x="' + n1(x + .25) + '" y="' + n2(sg > 0 ? c.ri : -c.endo) + '" width="' + n1(w - .5) + '" height="' + (c.endo - c.ri) + '" fill="' + C.endo + '"/>' +
               '<ellipse cx="' + n1(x + w * .52) + '" cy="' + n2(sg * (c.ri + .02)) + '" rx="4.4" ry=".95" fill="' + C.nuc + '"/>';
          x += w;
        }
      });
      s += '<g data-r="cArrows"></g><g data-r="cParts"></g><g data-r="cCells"></g>';
      var x = '<g data-r="cX"></g>';
      return { markup: '<g data-r="cS">' + s + '</g>', xmarkup: x };
    }
    var CAPCLEFT = [], CAPX = { glc: 76 };
    function capOxy(x) { return 1 - smooth((x - 22) / 88); }   /* 1 red … 0 blue, along the capillary */

    /* ---------------- 4 VENULE ---------------- */
    var VNLP = null;
    function venule() {
      var v = VNL, s = '';
      var CAPS = [
        [[-190, -1], [-90, -.5], [-40, 0], [-6, 0]],
        [[-190, -44], [-100, -34], [-44, -12.5], [-8, -5.8]],
        [[-190, 46], [-100, 35], [-44, 13], [-8, 5.8]],
        [[-80, -86], [-30, -52], [8, -30], [24, -17.5]]
      ];
      function rin(x) { return x < -6 ? 10.5 : x > 44 ? v.ri : lerp(10.5, v.ri, smooth((x + 6) / 50)); }
      var top = [], bot = [], xs = [];
      for (var x = -6; x <= 360; x += 3) xs.push(x);
      xs.forEach(function (x2) { top.push([x2, -rin(x2)]); bot.push([x2, rin(x2)]); });
      function edge(list, off) { return list.map(function (p, i) { return (i ? 'L' : 'M') + n1(p[0]) + ' ' + n1(p[1] + off); }).join(''); }
      function band(list, sg, o1, o2) {
        var a2 = list.map(function (p) { return [p[0], p[1] + sg * o1]; }), b2 = list.slice().reverse().map(function (p) { return [p[0], p[1] + sg * o2]; });
        return a2.concat(b2).map(function (p, i) { return (i ? 'L' : 'M') + n1(p[0]) + ' ' + n1(p[1]); }).join('') + 'Z';
      }
      s += '<rect x="-300" y="-160" width="800" height="320" fill="url(#' + id('cts') + ')"/>';
      var capS = CAPS.map(function (P) { return sampled(P, 8); });
      s += tissueField(-260, 60, -130, 135, 404, function (x, y, r) {
        if (x > -14 && Math.abs(y) < rin(Math.max(x, -6)) + (v.ro - v.ri) + r + 3) return true;
        for (var q = 0; q < capS.length; q++) if (distTo(capS[q], x, y) < r + 4.6) return true;
        return false;
      });
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.fluid + '" stroke-width="' + n1(CAP.fluid * 2) + '" stroke-linecap="round"/>'; }).join('');
      s += '<path d="' + band(top, -1, 0, v.ro - v.ri + 3) + '" fill="' + C.fluid + '"/><path d="' + band(bot, 1, 0, v.ro - v.ri + 3) + '" fill="' + C.fluid + '"/>';
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.endo + '" stroke-width="7.4" stroke-linecap="round"/>'; }).join('');
      s += '<path d="' + band(top, -1, 0, v.ro - v.ri) + '" fill="' + C.adv + '"/><path d="' + band(bot, 1, 0, v.ro - v.ri) + '" fill="' + C.adv + '"/>';
      s += '<path d="' + band(top, -1, 0, v.endo - v.ri) + '" fill="' + C.endo + '"/><path d="' + band(bot, 1, 0, v.endo - v.ri) + '" fill="' + C.endo + '"/>';
      /* pericytes and a few muscle cells, outside the endothelium */
      [[70, -1], [132, 1], [196, -1], [250, 1], [300, -1]].forEach(function (p) {
        s += '<ellipse cx="' + p[0] + '" cy="' + n1(p[1] * (v.ri + 1.2)) + '" rx="6.5" ry=".85" fill="' + C.muscle + '" opacity=".9"/>';
      });
      for (var xn = 4; xn < 360; xn += 19) {
        s += '<ellipse cx="' + xn + '" cy="' + n1(-(rin(xn) + .15)) + '" rx="4.4" ry="1" fill="' + C.nuc + '"/>' +
             '<ellipse cx="' + (xn + 9) + '" cy="' + n1(rin(xn + 9) + .15) + '" rx="4.4" ry="1" fill="' + C.nuc + '"/>';
      }
      s += '<path d="' + edge(top, 0) + 'L' + edge(bot.slice().reverse(), 0).slice(1) + 'Z" fill="' + C.plasmaV + '"/>';
      s += CAPS.map(function (P) { return '<path d="' + smoothPath(P) + '" fill="none" stroke="' + C.plasmaV + '" stroke-width="6" stroke-linecap="round"/>'; }).join('');
      s += '<g data-r="dCells"></g><g data-r="dWbc"></g>';
      VNLP = {
        rin: rin,
        lanes: [
          sampled([[-190, -1], [-90, -.5], [-40, 0], [-6, 0], [30, 0], [120, -.5], [400, -.5]], 8),
          sampled([[-190, -44], [-100, -34], [-44, -12.5], [-8, -5.8], [30, -7], [120, -7.5], [400, -7.5]], 8),
          sampled([[-190, 46], [-100, 35], [-44, 13], [-8, 5.8], [30, 5.2], [120, 5.2], [400, 5.2]], 8),
          sampled([[-80, -86], [-30, -52], [8, -30], [24, -17.5], [44, -14.5], [120, -14.2], [400, -14.2]], 8)
        ]
      };
      var x3 = '<g data-r="dX"></g>';
      return { markup: '<g data-r="dS">' + s + '</g>', xmarkup: x3 };
    }

    /* ---------------- 5 VEIN ---------------- */
    function vein() {
      var s = '<g data-r="eS">' +
        '<rect x="-12000" y="-12000" width="30000" height="24000" fill="url(#' + id('ct') + ')"/>' +
        '<path data-r="eMt" fill="url(#' + id('skm') + ')"/><path data-r="eMb" fill="url(#' + id('skm') + ')"/>' +
        '<path data-r="eMtL" fill="none" stroke="' + C.skmLine + '" stroke-width="1" opacity=".55" vector-effect="non-scaling-stroke"/>' +
        '<path data-r="eMbL" fill="none" stroke="' + C.skmLine + '" stroke-width="1" opacity=".55" vector-effect="non-scaling-stroke"/>' +
        '<g clip-path="url(#' + id('vclip') + ')">' + tubeMarkup(VTREE, [C.adv, '#6A5A48', C.plasmaV], 1) + '</g>' +
        '<path data-r="eLum" fill="' + C.plasmaV + '"/>' +
        '<path data-r="eAt" fill="url(#' + id('vadv') + ')"/><path data-r="eAb" fill="url(#' + id('vadv') + ')"/>' +
        '<path data-r="eMdt" fill="' + C.muscleLo + '"/><path data-r="eMdb" fill="' + C.muscleLo + '"/>' +
        '<path data-r="eIt" fill="' + C.endo + '"/><path data-r="eIb" fill="' + C.endo + '"/>' +
        tubeMarkup(VTREE, [C.adv, C.muscleLo, C.plasmaV], 0) +
        '<g data-r="eCells"></g>' +
        '<path data-r="eVAt" fill="' + C.endo + '" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '<path data-r="eVAb" fill="' + C.endo + '" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '<path data-r="eVBt" fill="' + C.endo + '" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '<path data-r="eVBb" fill="' + C.endo + '" stroke="#FFFFFF" stroke-opacity=".35" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '</g>';
      var x = '<g data-r="eX"><path data-r="exAdv" fill="' + C.adv + '"/><g data-r="exAdvT"></g><path data-r="exMed" fill="' + C.muscleLo + '"/><g data-r="exMedT"></g>' +
        '<path data-r="exInt" fill="' + C.endo + '"/><path data-r="exLum" fill="' + C.plasmaV + '"/><g data-r="exDots"></g></g>';
      return { markup: s, xmarkup: x };
    }

    /* ============================================================
       Building the SVGs for a layout
       ============================================================ */
    var built = null, SX = [], SEL = {};
    function defs() {
      /* textures for the big vessels, in µm: they zoom with the camera */
      var R6 = rng(5), med = '', adv = '', ct = '', cts = '';
      for (var i = 0; i < 7; i++) { var mx = R6() * 360, my = 18 + R6() * 104; med += '<ellipse cx="' + n1(mx) + '" cy="' + n1(my) + '" rx="' + n1(40 + R6() * 20) + '" ry="' + n1(15 + R6() * 6) + '" fill="' + C.muscle + '" opacity=".85"/>'; }
      med += '<path d="' + wavy(0, 360, 44, 7, 180) + '" fill="none" stroke="' + C.elastic + '" stroke-width="9" opacity=".7"/>' +
             '<path d="' + wavy(0, 360, 104, 7, 180) + '" fill="none" stroke="' + C.elastic + '" stroke-width="9" opacity=".7"/>';
      for (var j = 0; j < 6; j++) { var ay = 12 + j * 23; adv += '<path d="' + wavy(0, 520, n1(ay + R6() * 6), 9, 130) + '" fill="none" stroke="' + C.advHi + '" stroke-width="' + n1(8 + R6() * 6) + '" opacity=".55"/>'; }
      for (var k = 0; k < 8; k++) { var cy = R6() * 900; ct += '<path d="' + wavy(0, 900, n1(cy), 40, 450) + '" fill="none" stroke="' + C.ctLine + '" stroke-width="18"/>'; }
      for (var m = 0; m < 9; m++) { var cy2 = R6() * 60; cts += '<path d="' + wavy(0, 60, n1(cy2), 2.2, 30) + '" fill="none" stroke="' + C.ctLine + '" stroke-width=".9"/>'; }
      var skm = '';
      for (var q = 0; q < 9; q++) skm += '<rect x="0" y="' + (q * 60) + '" width="1400" height="52" rx="26" fill="' + (q % 2 ? C.skm : '#8A343C') + '"/>';
      return '<defs>' +
        '<pattern id="' + id('med') + '" patternUnits="userSpaceOnUse" width="360" height="120"><rect width="360" height="120" fill="' + C.muscleLo + '"/>' + med + '</pattern>' +
        '<pattern id="' + id('adv') + '" patternUnits="userSpaceOnUse" width="520" height="150"><rect width="520" height="150" fill="' + C.adv + '"/>' + adv + '</pattern>' +
        '<pattern id="' + id('vadv') + '" patternUnits="userSpaceOnUse" width="520" height="150"><rect width="520" height="150" fill="' + C.adv + '"/>' + adv + '</pattern>' +
        '<pattern id="' + id('ct') + '" patternUnits="userSpaceOnUse" width="900" height="900"><rect width="900" height="900" fill="' + C.ct + '"/>' + ct + '</pattern>' +
        '<pattern id="' + id('cts') + '" patternUnits="userSpaceOnUse" width="60" height="60"><rect width="60" height="60" fill="' + C.ct + '"/>' + cts + '</pattern>' +
        '<pattern id="' + id('skm') + '" patternUnits="userSpaceOnUse" width="1400" height="540">' + skm + '</pattern>' +
        '<clipPath id="' + id('aclip') + '"><rect x="-20000" y="-20000" width="40000" height="' + (20000 - ART.ri) + '"/></clipPath>' +
        '<clipPath id="' + id('vclip') + '"><rect x="-20000" y="' + VEIN.r0 + '" width="40000" height="20000"/></clipPath>' +
        '</defs>';
    }

    function build() {
      G = layout();
      var T = G.T, X = G.S;
      SCN = [artery(), arteriole(), capillary(), venule(), vein()];
      /* INSIDE */
      set(svgT, { viewBox: '0 0 ' + T.w + ' ' + T.h, width: T.w, height: T.h });
      svgT.innerHTML = defs() +
        '<clipPath id="' + id('tv') + '"><rect x="' + T.VX + '" y="' + T.VY + '" width="' + T.VW + '" height="' + T.VH + '" rx="10"/></clipPath>' +
        '<rect class="jn__view" x="' + T.VX + '" y="' + T.VY + '" width="' + T.VW + '" height="' + T.VH + '" rx="10"/>' +
        '<g clip-path="url(#' + id('tv') + ')">' +
          SCN.map(function (sc, i) { return '<g data-r="cam' + i + '">' + sc.markup + '</g>'; }).join('') +
          '<g data-r="tOver"></g>' +
        '</g>' +
        '<rect class="jn__viewline" x="' + T.VX + '" y="' + T.VY + '" width="' + T.VW + '" height="' + T.VH + '" rx="10"/>' +
        '<text data-r="tHead" class="jn__head" x="' + (T.VX + 2) + '" y="15"></text>' +
        '<text data-r="tDir" class="jn__dir" x="' + (T.w - 2) + '" y="15" text-anchor="end"></text>' +
        '<g data-r="tScale"></g><g data-r="tZoom"></g>' +
        '<g data-r="tLabs" class="jn__labs"></g>';
      /* CUT ACROSS */
      set(svgS, { viewBox: '0 0 ' + X.w + ' ' + X.h, width: X.w, height: X.h });
      svgS.innerHTML =
        '<clipPath id="' + id('sv') + '"><rect x="' + X.VX + '" y="' + X.VY + '" width="' + X.VW + '" height="' + X.VH + '" rx="10"/></clipPath>' +
        '<rect class="jn__view" x="' + X.VX + '" y="' + X.VY + '" width="' + X.VW + '" height="' + X.VH + '" rx="10"/>' +
        '<g clip-path="url(#' + id('sv') + ')">' +
          SCN.map(function (sc, i) { return '<g data-r="sx' + i + '">' + sc.xmarkup + '</g>'; }).join('') +
          '<g data-r="sOver"></g>' +
        '</g>' +
        '<rect class="jn__viewline" x="' + X.VX + '" y="' + X.VY + '" width="' + X.VW + '" height="' + X.VH + '" rx="10"/>' +
        '<text class="jn__head" x="' + (X.VX + 2) + '" y="15">Cut across at the dashed line</text>' +
        '<g data-r="sScale"></g>' +
        '<g data-r="sLabs" class="jn__labs"></g>';
      R = {};
      [svgT, svgS].forEach(function (sv) {
        Array.prototype.forEach.call(sv.querySelectorAll('[data-r]'), function (el) { R[el.getAttribute('data-r')] = el; });
      });
      buildCells();
      buildSections();
      buildVeinSection();
      buildRoute();
      built = G;
    }

    /* ----- the moving cells, made once per layout ----- */
    function buildCells() {
      var T = G.T;
      /* artery: a lane per cell, in the lumen; enough cells to fill the widest view */
      var kA = T.VH / SC[0].F, span = T.VW / kA + 4000, Ra = rng(101), out = '';
      var nA = Math.round(span / 12000 * 150 * clamp(T.VH / 190, .8, 1.3));
      CELLS.a = { span: span, list: [] };
      for (var i = 0; i < nA; i++) {
        var r = (Ra() * 2 - 1) * .9;
        CELLS.a.list.push({ x0: Ra() * span, r: r, rot: Ra() * 40 - 20 });
        out += '<ellipse rx="52" ry="36" fill="' + (i % 4 ? C.oxy : C.oxyHi) + '"/>';
      }
      R.aCells.innerHTML = out;
      CELLS.a.els = R.aCells.children;
      /* arteriole: cells along three lanes that run on into the capillaries */
      var Rb = rng(202); out = ''; CELLS.b = [];
      AOLP.lanes.forEach(function (ln, li) {
        var s0 = Rb() * 10;
        while (s0 < ln.total) {
          var face = Rb() < .62;
          CELLS.b.push({ lane: li, s0: s0, face: face, tilt: face ? .45 + Rb() * .55 : .2 + Rb() * .12, rot: Rb() * 50 - 25 });
          out += '<g><ellipse rx="3.75" ry="3.75" fill="' + C.oxy + '"/><ellipse rx="1.7" ry="1.7" fill="' + C.oxyHi + '" opacity=".75"/><path fill="' + C.oxy + '"/></g>';
          s0 += 16 + Rb() * 11;
        }
      });
      R.bCells.innerHTML = out;
      CELLS.bEls = R.bCells.children;
      /* capillary: single file */
      var Rc = rng(303); out = ''; CELLS.c = [];
      var x = 0;
      while (x < 305) { CELLS.c.push({ x0: x, w: Rc() }); out += '<path/>'; x += 12.5 + Rc() * 4.5; }
      R.cCells.innerHTML = out;
      CELLS.cEls = R.cCells.children;
      /* venule: four lanes from four capillaries */
      var Rd = rng(404); out = ''; CELLS.d = [];
      VNLP.lanes.forEach(function (ln, li) {
        var s1 = Rd() * 12;
        while (s1 < ln.total) {
          var face = Rd() < .6;
          CELLS.d.push({ lane: li, s0: s1, face: face, tilt: face ? .45 + Rd() * .55 : .2 + Rd() * .12, rot: Rd() * 50 - 25 });
          out += '<g><ellipse rx="3.75" ry="3.75" fill="' + C.deo + '"/><ellipse rx="1.7" ry="1.7" fill="' + C.deoHi + '" opacity=".75"/><path fill="' + C.deo + '"/></g>';
          s1 += 15 + Rd() * 10;
        }
      });
      R.dCells.innerHTML = out;
      CELLS.dEls = R.dCells.children;
      R.dWbc.innerHTML = '<path data-w="body" fill="' + C.wbc + '" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
        '<g data-w="nuc"><ellipse rx="1.9" ry="1.6" fill="' + C.wbcNuc + '"/><ellipse rx="1.7" ry="1.5" fill="' + C.wbcNuc + '"/><ellipse rx="1.6" ry="1.4" fill="' + C.wbcNuc + '"/></g>';
      /* vein: tracers of the blood's volume */
      var Re = rng(505); out = ''; CELLS.e = [];
      var nE = Math.round(26000 / 12000 * 150 * .95);
      for (var j = 0; j < nE; j++) { CELLS.e.push({ v0: (j + Re() * .8) / nE, r: (Re() * 2 - 1) * .9 }); out += '<ellipse rx="58" ry="40" fill="' + (j % 4 ? C.deo : C.deoHi) + '"/>'; }
      R.eCells.innerHTML = out;
      CELLS.eEls = R.eCells.children;
      /* the exchange in the capillary: four arrows and what crosses the wall along them */
      /* oxygen crosses the wall cells themselves; glucose mostly crosses where two wall cells meet [OS 20.3] */
      var gx = CAPCLEFT.reduce(function (b, x) { return Math.abs(x - 76) < Math.abs(b - 76) ? x : b; }, 76);
      CAPX.glc = gx;
      var AR = [
        { x: 48, y0: -1.3, y1: -11.2, c: C.o2, k: 'o2' }, { x: gx, y0: -1.3, y1: -11.2, c: C.glc, k: 'glc' },
        { x: 71, y0: 11.2, y1: 1.3, c: C.co2, k: 'co2' }
      ];
      CELLS.ar = AR;
      R.cArrows.innerHTML = AR.map(function (a) {
        var sg = a.y1 < a.y0 ? -1 : 1, yh = a.y1 - sg * 3.2;
        return '<path d="M' + (a.x - 1.25) + ' ' + a.y0 + 'L' + (a.x - 1.25) + ' ' + n1(yh) + 'L' + (a.x - 2.9) + ' ' + n1(yh) + 'L' + a.x + ' ' + a.y1 + 'L' + (a.x + 2.9) + ' ' + n1(yh) + 'L' + (a.x + 1.25) + ' ' + n1(yh) + 'L' + (a.x + 1.25) + ' ' + a.y0 + 'Z" fill="' + a.c + '" fill-opacity=".2" stroke="' + a.c + '" stroke-opacity=".85" stroke-width="1.2" vector-effect="non-scaling-stroke"/>';
      }).join('');
      out = '';
      AR.forEach(function (a) {
        for (var p = 0; p < 4; p++) {
          /* glucose a small hexagon (its ring); oxygen and carbon dioxide dots */
          if (a.k === 'glc') out += '<path d="M.62 0L.31 .54L-.31 .54L-.62 0L-.31 -.54L.31 -.54Z" fill="' + a.c + '"/>';
          else out += '<circle r=".55" fill="' + a.c + '"/>';
        }
      });
      R.cParts.innerHTML = out;
      CELLS.pEls = R.cParts.children;
    }

    /* ----- the cross-sections that are drawn once (the moving ones update in render) ----- */
    function buildSections() {
      /* capillary: one endothelial cell curls round the lumen; one red cell, bent, almost fills it —
         as in the electron micrograph shown with this stage */
      var c = CAP, R7 = rng(71), s = '';
      s += '<circle r="40" fill="' + C.fluid + '"/>';
      var cells = [[-10.5, -9, 12, 10, .2], [4.5, -11.5, 13, 9, -.3], [12, 1.5, 9, 13, .4], [2, 12, 14, 9, .1], [-11.5, 7.5, 10, 12, -.2], [-15, -1.5, 8, 9, 0]];
      cells.forEach(function (q) {
        s += '<rect x="' + n1(q[0] - q[2] / 2) + '" y="' + n1(q[1] - q[3] / 2) + '" width="' + q[2] + '" height="' + q[3] + '" rx="2.6" transform="rotate(' + n1(q[4] * 57) + ' ' + q[0] + ' ' + q[1] + ')" fill="' + C.tissue + '" stroke="' + C.tissueEdge + '" stroke-width="1" vector-effect="non-scaling-stroke"/>' +
             '<ellipse cx="' + n1(q[0] + (R7() - .5) * 3) + '" cy="' + n1(q[1] + (R7() - .5) * 3) + '" rx="2.8" ry="2" fill="' + C.tissueNuc + '" opacity=".75"/>';
      });
      s += '<circle r="' + (c.bm + 1.25) + '" fill="' + C.fluid + '"/>';
      s += '<circle r="' + c.bm + '" fill="none" stroke="' + C.bm + '" stroke-width="1" vector-effect="non-scaling-stroke" opacity=".8"/>';
      s += '<circle r="' + ((c.ri + c.endo) / 2) + '" fill="none" stroke="' + C.endo + '" stroke-width="' + (c.endo - c.ri) + '"/>';
      s += '<path d="M-2.9 -2.2Q-3.9 -.4 -3.2 1.5Q-2.6 .4 -2.75 -1.1Z" fill="' + C.nuc + '"/>';   /* its nucleus, bulging */
      s += '<path d="M1.95 2.35L2.35 2.75" stroke="' + C.fluid + '" stroke-width=".3"/>';          /* the gap where it meets itself */
      s += '<circle r="' + c.ri + '" fill="' + C.plasmaM + '"/>';
      s += '<path data-r="cxRbc" d="M-1.7 -1.9C-.3 -2.6 1.9 -2.2 2.3 -.6C2.6 .9 1.7 2.1 .4 2.3C1.1 1.4 1.2 .3 .8 -.4C.3 -1.2 -.7 -1.4 -1.7 -1.2C-2.3 -1.1 -2.4 -1.6 -1.7 -1.9Z" fill="' + C.oxy + '"/>';
      R.cX.innerHTML = s;
      R.cxRbc = R.cX.querySelector('[data-r="cxRbc"]');
      /* venule: a thin wall, a little flattened and irregular */
      var v = VNL, s2 = '';
      s2 += '<path d="' + ringPath(v.ro, 72, .035, 8, 1.13, .86) + '" fill="' + C.adv + '"/>';
      s2 += '<path d="' + ringPath(v.endo, 72, .035, 8, 1.13, .86) + '" fill="' + C.endo + '"/>';
      s2 += '<path d="' + ringPath(v.ri, 72, .035, 8, 1.13, .86) + '" fill="' + C.plasmaV + '"/>';
      [[.6, 1], [2.3, 1], [4.2, 1]].forEach(function (q) { var a = q[0]; s2 += '<ellipse cx="' + n1(19.1 * 1.13 * Math.cos(a)) + '" cy="' + n1(19.1 * .86 * Math.sin(a)) + '" rx="4.4" ry="1.1" transform="rotate(' + n1(a * 57.3 + 90) + ' ' + n1(19.1 * 1.13 * Math.cos(a)) + ' ' + n1(19.1 * .86 * Math.sin(a)) + ')" fill="' + C.nuc + '"/>'; });
      [[1.5], [3.4], [5.4]].forEach(function (q) { var a = q[0]; s2 += '<ellipse cx="' + n1(20.9 * 1.13 * Math.cos(a)) + '" cy="' + n1(20.9 * .86 * Math.sin(a)) + '" rx="5.5" ry=".8" transform="rotate(' + n1(a * 57.3 + 90) + ' ' + n1(20.9 * 1.13 * Math.cos(a)) + ' ' + n1(20.9 * .86 * Math.sin(a)) + ')" fill="' + C.muscle + '"/>'; });
      [[-9, -4, 1, 20], [3, -8, 0, -30], [9, 4, 1, 70], [-3, 7, 0, 10], [-15, 5, 1, -50]].forEach(function (q) {
        s2 += q[2] ? '<g transform="translate(' + q[0] + ' ' + q[1] + ') rotate(' + q[3] + ')"><ellipse rx="3.75" ry="3.3" fill="' + C.deo + '"/><ellipse rx="1.6" ry="1.4" fill="' + C.deoHi + '" opacity=".75"/></g>'
                   : '<g transform="translate(' + q[0] + ' ' + q[1] + ') rotate(' + q[3] + ')"><path d="' + dumbbell() + '" fill="' + C.deo + '"/></g>';
      });
      R.dX.innerHTML = s2;
    }
    /* a red cell seen edge-on: thick rim, thin middle */
    function dumbbell() { return 'M-3.75 0C-3.75 -1.05 -3.1 -1.25 -2.3 -1.2C-1.5 -1.15 -.9 -.55 0 -.55C.9 -.55 1.5 -1.15 2.3 -1.2C3.1 -1.25 3.75 -1.05 3.75 0C3.75 1.05 3.1 1.25 2.3 1.2C1.5 1.15 .9 .55 0 .55C-.9 .55 -1.5 1.15 -2.3 1.2C-3.1 1.25 -3.75 1.05 -3.75 0Z'; }
    /* a red cell in a capillary: bent into a bowl, the rounded side forward */
    function parachute(wob) {
      var b = .15 * wob;
      return 'M-1.1 -3.05C1.2 ' + n2(-2.8 + b) + ' 2.4 -1.35 2.45 0C2.4 1.35 1.2 ' + n2(2.8 - b) + ' -1.1 3.05C-.1 1.95 .45 .95 .45 0C.45 -.95 -.1 -1.95 -1.1 -3.05Z';
    }

    /* ----- the route: a stage for each vessel, and the blood pressure across them ----- */
    var RT = null;
    function routeP(u) {
      /* mmHg: arteries 120/80 [OS 20.2]; the steepest fall in the arterioles; 35 → 18 along the
         capillary [OS 20.3]; near 0 at the heart [GH] */
      if (u < 1) return 80 + 40 * pulseP(u * 5.2 * BEAT);
      if (u < 2) { var f = u - 1; return lerp(93, 36, smooth(f)) + (1 - f) * (1 - f) * 40 * (pulseP(f * 4 * BEAT) - .35); }
      if (u < 3) return lerp(35, 18, u - 2);
      if (u < 4) return lerp(18, 13, u - 3);
      return lerp(13, 2, smooth(u - 4));
    }
    function buildRoute() {
      var W = Math.floor(routeBox.getBoundingClientRect().width || G.W), H = 62, gap = 6, x0 = 2, x1 = W - 2;
      var tot = END, xs = [x0];
      STAGES.forEach(function (st) { xs.push(xs[xs.length - 1] + (x1 - x0 - gap * 4) * st.dur / tot + gap); });
      xs[5] = x1;
      function segX(i) { return [xs[i] + (i ? gap / 2 : 0), xs[i + 1] - (i < 4 ? gap / 2 : 0)]; }
      function yOf(p) { return 34 - p / 125 * 27; }
      function xOfU(u) { var i = Math.min(4, Math.floor(u)), s2 = segX(i); return lerp(s2[0], s2[1], u - i); }
      var d = '';
      for (var k = 0; k <= 400; k++) { var u = k / 400 * 5; d += (k ? 'L' : 'M') + n2(xOfU(Math.min(u, 4.9999))) + ' ' + n2(yOf(routeP(Math.min(u, 4.9999)))); }
      var gid = id('rg');
      var st = STAGES.map(function (sg, i) {
        var s2 = segX(i), mid = (s2[0] + s2[1]) / 2;
        return '<g class="jn__stop' + (sg.ext ? ' jn__stop--ext' : '') + '" data-i="' + i + '" role="button" tabindex="0" aria-label="Stage ' + (i + 1) + ': ' + sg.name + '">' +
          '<rect x="' + n1(s2[0]) + '" y="0" width="' + n1(s2[1] - s2[0]) + '" height="' + H + '" fill="transparent"/>' +
          '<line x1="' + n1(s2[0]) + '" x2="' + n1(s2[1]) + '" y1="39" y2="39" class="jn__track"/>' +
          '<text x="' + n1(mid) + '" y="55" text-anchor="middle" class="jn__stopn">' + esc(sg.name) + '</text>' +
          (sg.ext ? '<line x1="' + n1(mid - textW(sg.name, 12) / 2) + '" x2="' + n1(mid + textW(sg.name, 12) / 2) + '" y1="58.5" y2="58.5" class="jn__stopx"/>' : '') + '</g>';
      }).join('');
      routeBox.innerHTML = '<svg class="jn__routesvg" viewBox="0 0 ' + W + ' ' + H + '" width="' + W + '" height="' + H + '" aria-label="Blood pressure along the way: high and pulsing in the artery, falling most steeply in the arteriole, low in the capillary, lower in the venule and the vein.">' +
        '<defs><linearGradient id="' + gid + '" gradientUnits="userSpaceOnUse" x1="' + x0 + '" x2="' + x1 + '" y1="0" y2="0">' +
          '<stop offset="0" stop-color="' + C.oxy + '"/><stop offset="' + n2((segX(2)[0] - x0) / (x1 - x0)) + '" stop-color="' + C.oxy + '"/>' +
          '<stop offset="' + n2((segX(2)[1] - x0) / (x1 - x0)) + '" stop-color="' + C.deo + '"/><stop offset="1" stop-color="' + C.deo + '"/></linearGradient>' +
          '<clipPath id="' + id('rc') + '"><rect data-q="clip" x="0" y="0" width="0" height="' + H + '"/></clipPath></defs>' +
        '<text x="' + (W - 2) + '" y="9" text-anchor="end" class="jn__rlab">blood pressure</text>' +
        st +
        '<path d="' + d + '" class="jn__rcurve"/>' +
        '<path d="' + d + '" class="jn__rcurve jn__rcurve--on" stroke="url(#' + gid + ')" clip-path="url(#' + id('rc') + ')"/>' +
        '<circle data-q="dot" r="4.6" class="jn__rdot"/></svg>';
      RT = { xOfU: xOfU, yOf: yOf, clip: routeBox.querySelector('[data-q="clip"]'), dot: routeBox.querySelector('[data-q="dot"]'),
             stops: routeBox.querySelectorAll('.jn__stop') };
      Array.prototype.forEach.call(RT.stops, function (g) {
        var i = +g.getAttribute('data-i');
        g.addEventListener('click', function () { goStep(i); });
        g.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goStep(i); } });
      });
    }

    /* ============================================================
       The camera
       ============================================================ */
    function kOf(i) { return G.T.VH / SC[i].F; }
    function mixCam(p, q, k) {
      k = clamp01(k);
      var sc = p[2] * Math.pow(q[2] / p[2], k);
      /* move the centre as fast as the view narrows (or widens), so the thing zoomed into stays in view */
      var kc = Math.abs(q[2] - p[2]) < 1e-9 ? k : (1 / p[2] - 1 / sc) / (1 / p[2] - 1 / q[2]);
      return [lerp(p[0], q[0], kc), lerp(p[1], q[1], kc), sc];
    }
    function stepAt(t) { var k = 0; for (var i = 0; i < STAGES.length; i++) if (t >= STAGES[i].t) k = i; return k; }
    /* the camera at t, in the world of stage `own`, and how visible each stage is */
    function camAt(t) {
      var i = stepAt(t), tl = t - STAGES[i].t, tr = TR[i];
      if (tr && tl < tr.d) {
        var u = ease(tl / tr.d), A = SC[i - 1], B = SC[i], kA = kOf(i - 1);
        var keys = [[0, A.camH[0], A.camH[1], kA]];
        (tr.keys || []).forEach(function (q2) { keys.push([q2[0], q2[1], q2[2], kA * q2[3]]); });
        keys.push([1, B.camE[0] - tr.fB[0] + tr.fA[0], B.camE[1] - tr.fB[1] + tr.fA[1], kOf(i)]);
        var ki = 0; while (ki < keys.length - 2 && u > keys[ki + 1][0]) ki++;
        var k0 = keys[ki], k1 = keys[ki + 1];
        var c = mixCam(k0.slice(1), k1.slice(1), (u - k0[0]) / (k1[0] - k0[0]));
        var opA, opB;
        if (tr.dir > 0) { opA = 1 - seg(u, .72, .93); opB = seg(u, .6, .86); }
        else { opA = 1 - seg(u, .12, .42); opB = seg(u, .04, .3); }
        return { own: i - 1, x: c[0], y: c[1], k: c[2], vis: [[i - 1, opA, 0, 0], [i, opB, tr.fA[0] - tr.fB[0], tr.fA[1] - tr.fB[1]]], u: u, tr: tr, i: i };
      }
      var sc = SC[i], pp = ease(seg(tl, sc.pan[0], sc.pan[1])), ch = G.narrow && sc.camHn ? sc.camHn : sc.camH;
      return { own: i, x: lerp(sc.camE[0], ch[0], pp), y: lerp(sc.camE[1], ch[1], pp), k: kOf(i), vis: [[i, 1, 0, 0]], u: 1, i: i };
    }

    /* ============================================================
       One frame
       ============================================================ */
    var ST = {};      /* the frame just drawn, for the labels */
    function toScr(E, x, y) { var T = G.T; return { x: T.cx + E.k * (x - E.x), y: T.cy + E.k * (y - E.y) }; }
    function render(t) {
      if (!built) return;
      var E = camAt(t), T = G.T;
      ST = { t: t, E: E, i: E.i };
      for (var i = 0; i < 5; i++) {
        var vis = null;
        E.vis.forEach(function (v) { if (v[0] === i) vis = v; });
        var g = R['cam' + i];
        if (!vis || vis[1] <= .004) { show(g, 0); continue; }
        show(g, vis[1]);
        var k = E.k, ox = vis[2], oy = vis[3];
        g.setAttribute('transform', 'matrix(' + nk(k) + ' 0 0 ' + nk(k) + ' ' + n4(T.cx - k * (E.x - ox)) + ' ' + n4(T.cy - k * (E.y - oy)) + ')');
        var tl = t - STAGES[i].t;
        UPD[i](tl, { k: k, cx: E.x - ox, cy: E.y - oy, own: i === E.own });
      }
      renderSections(t, E);
      renderOverlay(t, E);
      drawLabels(t, E);
      renderRoute(t);
    }

    /* ----- per-stage updates of the INSIDE drawing ----- */
    var UPD = [
      function (tl, V) {                                  /* ARTERY */
        var A = ART, a = .06 * pulseP(tl), ri = A.ri * (1 + a), dR = ri * ri - A.ri * A.ri, ro = Math.sqrt(A.ro * A.ro + dR);
        var s = (ro - ri) / (A.ro - A.ri);
        R.aWt.setAttribute('transform', 'matrix(1 0 0 ' + n4(s) + ' 0 ' + n4(s * A.ri - ri) + ')');
        R.aWb.setAttribute('transform', 'matrix(1 0 0 ' + n4(s) + ' 0 ' + n4(ri - s * A.ri) + ')');
        ST.aRi = ri; ST.aRo = ro; ST.aA = a;
        /* the cells: faster in the middle of the lumen than near the wall */
        var D = surgeD(tl, 1450, 8400), L = CELLS.a, half = G.T.VW / 2 / V.k, xl = V.cx - half - 1500;
        for (var j = 0; j < L.list.length; j++) {
          var c = L.list[j], x = xl + mod(c.x0 + D * (1 - c.r * c.r) - xl, L.span), y = c.r * (ri - 90);
          L.els[j].setAttribute('transform', 'translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + c.rot + ')');
        }
      },
      function (tl, V) {                                  /* ARTERIOLE */
        var c = toneAt(tl), ri = aolRi(c), ro = aolRo(c), a = AOL;
        var s = (ro - ri) / (a.ro - a.ri);
        R.bWt.setAttribute('transform', 'matrix(1 0 0 ' + n4(s) + ' 0 ' + n4(s * a.ri - ri) + ')');
        R.bWb.setAttribute('transform', 'matrix(1 0 0 ' + n4(s) + ' 0 ' + n4(ri - s * a.ri) + ')');
        ST.bRi = ri; ST.bRo = ro; ST.bC = c;
        /* where the arteriole divides into capillaries: a short taper, following the tone */
        var xt0 = 205, xt1 = 238, o = '', l = '', n = 12, k;
        for (k = 0; k <= n; k++) { var f = k / n, x = lerp(xt0, xt1, f), e = smooth(f), yo = lerp(ro, 9.2, e), yi = lerp(ri, 5.6, e); o += (k ? 'L' : 'M') + n2(x) + ' ' + n2(-yo); l += (k ? 'L' : 'M') + n2(x) + ' ' + n2(-yi); ST['tp' + k] = [yo, yi]; }
        for (k = n; k >= 0; k--) { var f2 = k / n, x2 = lerp(xt0, xt1, f2), e2 = smooth(f2); o += 'L' + n2(x2) + ' ' + n2(lerp(ro, 9.2, e2)); l += 'L' + n2(x2) + ' ' + n2(lerp(ri, 5.6, e2)); }
        R.bTaperW.setAttribute('d', o + 'Z'); R.bTaperL.setAttribute('d', l + 'Z');
        /* blood moves faster when the arteriole is wide: flow rises steeply with the radius */
        var D = DB(tl), els = CELLS.bEls, sc = ri / a.ri;
        CELLS.b.forEach(function (cl, j) {
          var ln = AOLP.lanes[cl.lane], p = along(ln, mod(cl.s0 + D, ln.total)), y = p.y;
          if (p.x < 205) y *= sc; else if (p.x < 236) y *= lerp(sc, 1, smooth((p.x - 205) / 31));
          var el = els[j], cap2 = smooth((p.x - 226) / 20);
          if (!el.__k) el.__k = el.children;
          var kids = el.__k;
          if (cap2 > .5) {
            show(kids[0], 0); show(kids[1], 0); show(kids[2], 1);
            kids[2].setAttribute('d', parachute(Math.sin(tl * 3 + j)));
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(y) + ') rotate(' + n1(p.a * 180 / Math.PI) + ')');
          } else if (cl.face) {
            show(kids[0], 1); show(kids[1], 1); show(kids[2], 0);
            kids[0].setAttribute('ry', n2(3.75 * cl.tilt)); kids[1].setAttribute('ry', n2(1.7 * cl.tilt));
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(y) + ') rotate(' + n1(cl.rot) + ')');
          } else {
            show(kids[0], 0); show(kids[1], 0); show(kids[2], 1);
            kids[2].setAttribute('d', dumbbell());
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(y) + ') rotate(' + n1(cl.rot + 90) + ')');
          }
        });
      },
      function (tl, V) {                                  /* CAPILLARY */
        var D = 5.9 * tl, els = CELLS.cEls;
        CELLS.c.forEach(function (cl, j) {
          var x = -70 + mod(cl.x0 + D, 305), wob = Math.sin(tl * 2.2 + j * 1.7);
          var el = els[j];
          el.setAttribute('d', parachute(wob));
          el.setAttribute('fill', mixc(C.deo, C.oxy, capOxy(x)));
          el.setAttribute('transform', 'translate(' + n2(x) + ' ' + n2(.12 * Math.sin(tl * 1.3 + j)) + ')');
        });
        /* the exchange: the arrows appear, and particles cross the wall along them, slowly and a
           little unevenly, as diffusion does */
        var op = seg(tl, 6.6, 7.4);
        show(R.cArrows, op); show(R.cParts, op);
        if (op > 0) {
          var pe = CELLS.pEls, n = 0;
          CELLS.ar.forEach(function (a, ai) {
            for (var p = 0; p < 4; p++) {
              var ph = mod(tl / 1.9 + p / 4 + ai * .13, 1), y = lerp(a.y0, a.y1, ph), x = a.x + .7 * Math.sin(ph * 9 + p * 2 + ai);
              var el2 = pe[n++];
              el2.setAttribute('transform', 'translate(' + n2(x) + ' ' + n2(y) + ')');
              show(el2, Math.min(1, ph * 6, (1 - ph) * 6));
            }
          });
        }
      },
      function (tl, V) {                                  /* VENULE */
        var D = 21 * tl, els = CELLS.dEls;
        CELLS.d.forEach(function (cl, j) {
          var ln = VNLP.lanes[cl.lane], p = along(ln, mod(cl.s0 + D * (cl.lane === 3 ? .92 : 1), ln.total));
          var el = els[j];
          if (!el.__k) el.__k = el.children;
          var kids = el.__k, inCap = p.x < -8 || (cl.lane === 3 && p.x < 20);
          if (inCap) {
            show(kids[0], 0); show(kids[1], 0); show(kids[2], 1);
            kids[2].setAttribute('d', parachute(Math.sin(tl * 2 + j)));
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(p.y) + ') rotate(' + n1(p.a * 180 / Math.PI) + ')');
          } else if (cl.face) {
            show(kids[0], 1); show(kids[1], 1); show(kids[2], 0);
            kids[0].setAttribute('ry', n2(3.75 * cl.tilt)); kids[1].setAttribute('ry', n2(1.7 * cl.tilt));
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(p.y) + ') rotate(' + n1(cl.rot) + ')');
          } else {
            show(kids[0], 0); show(kids[1], 0); show(kids[2], 1);
            kids[2].setAttribute('d', dumbbell());
            el.setAttribute('transform', 'translate(' + n2(p.x) + ' ' + n2(p.y) + ') rotate(' + n1(cl.rot + 90) + ')');
          }
        });
        wbcAt(tl);
      },
      function (tl, V) {                                  /* VEIN */
        var P = pumpAt(tl), s = P.s, half = G.T.VW / 2 / V.k, xa = V.cx - half - 600, xb = V.cx + half + 600;
        var hh = G.T.VH / 2 / V.k, ya = V.cy - hh - 600, yb = V.cy + hh + 600;
        ST.eP = P;
        var step = Math.max(40, (xb - xa) / 110), xs = [];
        for (var x = xa; x < xb + step; x += step) xs.push(Math.min(x, xb));
        [PUMP.xA, PUMP.xB].forEach(function (xv) { if (xv > xa && xv < xb) xs.push(xv); });
        xs.sort(function (p, q) { return p - q; });
        var W = VEIN, rr = xs.map(function (x2) { return veinR(x2, s) + sinus(x2); });
        function edge(sg, off) { return xs.map(function (x2, i2) { return (i2 ? 'L' : 'M') + n1(x2) + ' ' + n1(sg * (rr[i2] + off)); }).join(''); }
        function bandP(sg, o1, o2) {
          var a2 = xs.map(function (x2, i2) { return n1(x2) + ' ' + n1(sg * (rr[i2] + o1)); });
          var b2 = xs.map(function (x2, i2) { return n1(x2) + ' ' + n1(sg * (rr[i2] + o2)); }).reverse();
          return 'M' + a2.join('L') + 'L' + b2.join('L') + 'Z';
        }
        R.eLum.setAttribute('d', edge(-1, W.intima + 2) + 'L' + xs.slice().reverse().map(function (x2, i2) { return n1(x2) + ' ' + n1(rr[xs.length - 1 - i2] + W.intima + 2); }).join('L') + 'Z');
        R.eIt.setAttribute('d', bandP(-1, 0, W.intima)); R.eIb.setAttribute('d', bandP(1, 0, W.intima));
        R.eMdt.setAttribute('d', bandP(-1, W.intima, W.intima + W.media)); R.eMdb.setAttribute('d', bandP(1, W.intima, W.intima + W.media));
        R.eAt.setAttribute('d', bandP(-1, W.intima + W.media, W.wall)); R.eAb.setAttribute('d', bandP(1, W.intima + W.media, W.wall));
        /* the leg muscle round the vein: it shortens and thickens, and squeezes the vein */
        var x0 = -420 + 170 * s, x1 = Math.max(xb, 9000) + 600, gap = 70, far = -Math.max(5200, -ya + 200);
        function muscle(sg) {
          var o = 'M' + n1(x0) + ' ' + n1(sg * -far), lines = '';
          var pts = [], n3 = 70;
          for (var q3 = 0; q3 <= n3; q3++) {
            var x3 = x0 + (x1 - x0) * Math.pow(q3 / n3, 1.35);
            var rim = veinR(x3, s) + W.wall + gap, e = Math.min(1, (x3 - x0) / 700);
            pts.push([x3, sg * lerp(-far, rim, Math.sqrt(1 - Math.pow(1 - e, 2)))]);
          }
          o += pts.map(function (p) { return 'L' + n1(p[0]) + ' ' + n1(p[1]); }).join('') + 'L' + n1(x1) + ' ' + n1(sg * -far) + 'Z';
          [.12, .3, .5, .72].forEach(function (f) {
            lines += pts.map(function (p, i2) { return (i2 ? 'L' : 'M') + n1(p[0]) + ' ' + n1(lerp(p[1], sg * -far, f)); }).join('');
          });
          return [o, lines];
        }
        var mt = muscle(-1), mb = muscle(1);
        R.eMt.setAttribute('d', mt[0]); R.eMb.setAttribute('d', mb[0]); R.eMtL.setAttribute('d', mt[1]); R.eMbL.setAttribute('d', mb[1]);
        /* the valves: pockets of the lining. Blood going towards the heart pushes the cusps against
           the wall; blood going back fills the pockets and shuts them */
        var vo = valveOpen(tl, P);
        ST.vA = vo[0]; ST.vB = vo[1];
        [['A', PUMP.xA, vo[0]], ['B', PUMP.xB, vo[1]]].forEach(function (q) {
          ['t', 'b'].forEach(function (side) {
            var sg = side === 't' ? -1 : 1, xv = q[1], op = q[2], rv = veinR(xv, s) + sinus(xv) * .3;
            var fx = xv + lerp(.88, 1.08, op) * VEIN.r0, fy = sg * lerp(55, .78 * VEIN.r0, op);
            var bx = xv, by = sg * (rv - 10), cxp = lerp(xv + .55 * VEIN.r0, xv + .6 * VEIN.r0, op), cyp = sg * lerp(.25 * VEIN.r0, .9 * VEIN.r0, op);
            var th = 105;
            var d = 'M' + n1(bx - 40) + ' ' + n1(by + sg * 25) + 'Q' + n1(cxp) + ' ' + n1(cyp - sg * th) + ' ' + n1(fx) + ' ' + n1(fy) +
                    'Q' + n1(cxp + 90) + ' ' + n1(cyp + sg * th * .55) + ' ' + n1(bx + 330) + ' ' + n1(by + sg * 70) + 'Z';
            R['eV' + q[0] + side].setAttribute('d', d);
            ST['v' + q[0] + side] = { fx: fx, fy: fy, bx: bx, by: by, cx: cxp, cy: cyp };
          });
        });
        /* the blood: each tracer marks a fixed volume of blood; the volume that has passed valve A
           moves them all, and the squeeze moves the ones between the valves */
        var Q = flowA(tl), span = A0 * 26000, els = CELLS.eEls;
        CELLS.e.forEach(function (cl, j) {
          var v = mod(cl.v0 * span + Q, span), x = xOfVol(v, s);
          var el = els[j];
          if (x < xa || x > xb) { show(el, 0); return; }
          var r = veinR(x, s) + sinus(x) * .5, y = cl.r * (r - 110);
          if (y < ya || y > yb) { show(el, 0); return; }
          show(el, 1);
          el.setAttribute('transform', 'translate(' + n1(x) + ' ' + n1(y) + ')');
        });
      }
    ];
    var DB = integral(function (tl) { var c = toneAt(tl), sc = aolRi(c) / AOL.ri; return 41 * (1 + .18 * (pulseP(tl) - .35)) * sc * sc; }, 30, 1 / 200);
    function valveOpen(tl, P) {
      /* A shuts while the muscle squeezes; B shuts while it relaxes; both open at rest */
      var st = PUMP.starts, a = 1, b = 1;
      for (var i = 0; i < st.length; i++) {
        var tc = i === st.length - 1 ? PUMP.last : PUMP.TC;
        var s0 = st[i], s1 = s0 + tc, s2 = s1 + PUMP.TR;
        a = Math.min(a, 1 - seg(tl, s0, s0 + .14) + (i === st.length - 1 ? 0 : seg(tl, s1, s1 + .16)));
        /* B floats open as the refill ends, just before the steady flow starts again */
        if (i < st.length - 1) b = Math.min(b, 1 - seg(tl, s1, s1 + .14) + seg(tl, s2 - .1, s2 + .04));
      }
      return [clamp01(a), clamp01(b)];
    }
    /* the white cell in the venule: it rolls along the wall, stops, and squeezes between two wall
       cells [MU]. Squeezing through takes minutes in life: here it is half-way when the stage ends. */
    var WBC_X = 78;
    function wbcAt(tl) {
      var body = R.dWbc.querySelector('[data-w="body"]'), nuc = R.dWbc.querySelector('[data-w="nuc"]').children;
      var roll = ease(seg(tl, .4, 6.3)), x = lerp(30, WBC_X, roll), rr = 5.4;
      var p = ease(seg(tl, 7.4, 12.6)) * .66;
      var wallIn = VNL.ri, wallOut = VNL.ro;
      var ru = rr * Math.sqrt(1 - p), rl = rr * Math.sqrt(p), flat = seg(tl, 6.1, 7.2);
      var yu = wallIn - ru * (1 - .25 * flat), yl = wallOut + rl * .9;
      var d;
      if (p < .02) {
        d = 'M' + n2(x - rr * (1 + .12 * flat)) + ' ' + n2(yu) + 'a' + n2(rr * (1 + .12 * flat)) + ' ' + n2(rr * (1 - .2 * flat)) + ' 0 1 0 ' + n2(2 * rr * (1 + .12 * flat)) + ' 0a' + n2(rr * (1 + .12 * flat)) + ' ' + n2(rr * (1 - .2 * flat)) + ' 0 1 0 ' + n2(-2 * rr * (1 + .12 * flat)) + ' 0Z';
      } else {
        var nk = 1.25;
        d = 'M' + n2(x - nk) + ' ' + n2(wallIn - .3) + 'A' + n2(ru) + ' ' + n2(ru * .8) + ' 0 1 1 ' + n2(x + nk) + ' ' + n2(wallIn - .3) +
            'L' + n2(x + nk) + ' ' + n2(wallOut + .3) + 'A' + n2(Math.max(rl, 1.3)) + ' ' + n2(Math.max(rl * .85, 1.1)) + ' 0 1 1 ' + n2(x - nk) + ' ' + n2(wallOut + .3) + 'Z';
      }
      body.setAttribute('d', d);
      var spin = roll * 6;
      for (var i = 0; i < 3; i++) {
        var a = spin + i * 2.1, down = p * 3.4 * (i + .6), nx = x + Math.cos(a) * 2.1 * (1 - p), ny = (p < .02 ? yu : wallIn - 1) + Math.sin(a) * 1.9 * (1 - p) + down;
        nuc[i].setAttribute('cx', n2(nx)); nuc[i].setAttribute('cy', n2(ny));
      }
      ST.wbc = { x: x, y: p < .02 ? yu : wallIn - ru * .6, p: p, roll: roll };
    }

    /* ----- the cross-sections ----- */
    var SXK = [0, 0, 0, 0, 0];
    function sectK(i) {
      var X = G.S, ext = [6000, 2 * 30.5, 30, 50, 7700][i], fitK = (Math.min(X.VW, X.VH) - 12) / ext;
      /* side by side, the two drawings share a scale where the section fits; stacked on a phone,
         the section fills its own drawing, and its own scale bar says so */
      return G.narrow ? fitK : Math.min(kOf(i), fitK);
    }
    function renderSections(t, E) {
      var X = G.S, i = E.i;
      for (var j = 0; j < 5; j++) {
        var op = 0, sc = 1;
        if (j === i) { op = E.tr ? seg(E.u, .45, .95) : 1; sc = E.tr ? lerp(.88, 1, ease(seg(E.u, .45, 1))) : 1; }
        else if (E.tr && j === i - 1) op = 1 - seg(E.u, 0, .4);
        var g = R['sx' + j];
        show(g, op);
        if (op <= .004) continue;
        var k = sectK(j) * sc;
        SXK[j] = sectK(j);
        g.setAttribute('transform', 'matrix(' + nk(k) + ' 0 0 ' + nk(k) + ' ' + n2(X.cx) + ' ' + n2(X.cy) + ')');
        var tl = t - STAGES[j].t;
        if (j === 0) {
          var A = ART, a = .06 * pulseP(tl), ri = A.ri * (1 + a), dR = ri * ri - A.ri * A.ri;
          var rr = function (r) { return n2(Math.sqrt(r * r + dR)); };
          R.axAdv.setAttribute('r', rr(A.ro)); R.axMed.setAttribute('r', rr(A.adv)); R.axInt.setAttribute('r', rr(A.med));
          R.axIel.setAttribute('r', rr(A.iel)); R.axLum.setAttribute('r', rr(A.ri));
          R.axMedT.setAttribute('transform', 'scale(' + n4(Math.sqrt(2365 * 2365 + dR) / 2365) + ')');
          R.axAdvT.setAttribute('transform', 'scale(' + n4(Math.sqrt(2830 * 2830 + dR) / 2830) + ')');
          R.axNuc.setAttribute('transform', 'scale(' + n4(ri / A.ri) + ')');
          R.axDots.setAttribute('transform', 'scale(' + n4(ri / A.ri) + ')');
          ST.xa = { dR: dR };
        } else if (j === 1) {
          var c = toneAt(tl), ri2 = aolRi(c), ro2 = aolRo(c), a2 = AOL;
          var en = ri2 + (a2.endo - a2.ri), ad = ro2 - (a2.ro - a2.m2);
          R.bxAdv.setAttribute('r', n2(ro2)); R.bxMed.setAttribute('r', n2(ad)); R.bxEnd.setAttribute('r', n2(en)); R.bxLum.setAttribute('r', n2(ri2));
          /* the muscle cells wrap round it; contracted, each is shorter and fatter */
          var th = (ad - en) / 2, sm = '';
          [en + th * .5, en + th * 1.5].forEach(function (rm, row) {
            for (var q = 0; q < 5; q++) sm += spindle(rm, q / 5 * Math.PI * 2 + row * .6 + .3, 1.5 - .25 * Math.max(0, c), th * .48, C.muscle);
          });
          R.bxSmc.innerHTML = sm;
          var nu = '';
          [.4, 2.3, 4.3].forEach(function (an) { nu += '<ellipse cx="' + n2((ri2 + .1) * Math.cos(an)) + '" cy="' + n2((ri2 + .1) * Math.sin(an)) + '" rx="3.8" ry="1.05" transform="rotate(' + n1(an * 57.3 + 90) + ' ' + n2((ri2 + .1) * Math.cos(an)) + ' ' + n2((ri2 + .1) * Math.sin(an)) + ')" fill="' + C.nuc + '"/>'; });
          R.bxNuc.innerHTML = nu;
          var fk = ri2 / a2.ri;
          R.bxRbc.innerHTML = '<g transform="translate(' + n2(-5 * fk) + ' ' + n2(-3.2 * fk) + ') rotate(25)"><ellipse rx="3.75" ry="3.1" fill="' + C.oxy + '"/><ellipse rx="1.6" ry="1.3" fill="' + C.oxyHi + '" opacity=".75"/></g>' +
            '<g transform="translate(' + n2(5.2 * fk) + ' ' + n2(3.4 * fk) + ') rotate(-35)"><path d="' + dumbbell() + '" fill="' + C.oxy + '"/></g>';
          ST.xb = { ri: ri2, ro: ro2, en: en, ad: ad };
        } else if (j === 2) {
          R.cxRbc.setAttribute('fill', mixc(C.deo, C.oxy, capOxy(SC[2].cut)));
        } else if (j === 4) {
          var P = pumpAt(tl), b = veinR(PUMP.xm, P.s), aa = ellA(b), W = VEIN;
          var ell = function (ax, bx) { return 'M' + n1(-ax) + ' 0A' + n1(ax) + ' ' + n1(bx) + ' 0 1 0 ' + n1(ax) + ' 0A' + n1(ax) + ' ' + n1(bx) + ' 0 1 0 ' + n1(-ax) + ' 0Z'; };
          R.exAdv.setAttribute('d', ell(aa + W.wall, b + W.wall));
          R.exMed.setAttribute('d', ell(aa + W.intima + W.media, b + W.intima + W.media));
          R.exInt.setAttribute('d', ell(aa + W.intima, b + W.intima));
          R.exLum.setAttribute('d', ell(aa, b));
          R.exAdvT.setAttribute('transform', 'scale(' + n4((aa + W.wall) / (ELLA0 + W.wall)) + ' ' + n4((b + W.wall) / (VEIN.r0 + W.wall)) + ')');
          R.exMedT.setAttribute('transform', 'scale(' + n4((aa + 70) / (ELLA0 + 70)) + ' ' + n4((b + 70) / (VEIN.r0 + 70)) + ')');
          R.exDots.setAttribute('transform', 'scale(' + n4(aa / ELLA0) + ' ' + n4(b / VEIN.r0) + ')');
          ST.xe = { a: aa, b: b };
        }
      }
      /* the scale bar of the cross-section */
      var kk = sectK(i), bar = niceBar(kk, X.VW * .42);
      R.sScale.innerHTML = scaleBar(X.VX + 8, X.VY + X.VH + 15, bar.px, bar.label, E.tr ? seg(E.u, .6, 1) : 1);
    }
    /* the vein cut across: its wall does not stretch, so squeezed flatter it gets wider */
    var ELLA0 = 2650;
    var PERIM0 = null;
    function perim(a, b) { return Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b))); }
    function ellA(b) {
      if (PERIM0 == null) PERIM0 = perim(ELLA0, VEIN.r0);
      var lo = b, hi = 6000;
      for (var i = 0; i < 30; i++) { var m = (lo + hi) / 2; if (perim(m, b) < PERIM0) lo = m; else hi = m; }
      return (lo + hi) / 2;
    }
    function buildVeinSection() {
      var R9 = rng(91), t1 = '', t2 = '', dots = '';
      for (var i = 0; i < 40; i++) {
        var a = R9() * Math.PI * 2, r = 1 + (R9() * .9 + .05) * (VEIN.wall - VEIN.intima - VEIN.media) / (ELLA0 + VEIN.wall);
        var x = (ELLA0 + VEIN.intima + VEIN.media) * Math.cos(a), y = (VEIN.r0 + VEIN.intima + VEIN.media) * Math.sin(a);
        var ex = x * (1 + (r - 1) * 1.02), ey = y * (1 + (r - 1) * 1.02);
        t1 += '<path d="M' + n1(ex) + ' ' + n1(ey) + 'l' + n1(-Math.sin(a) * 260) + ' ' + n1(Math.cos(a) * 200) + '" stroke="' + C.advHi + '" stroke-width="30" stroke-linecap="round" opacity=".65"/>';
      }
      for (var j = 0; j < 7; j++) {
        var a2 = j / 7 * Math.PI * 2 + R9() * .4;
        t2 += '<ellipse cx="' + n1((ELLA0 + 70) * Math.cos(a2)) + '" cy="' + n1((VEIN.r0 + 70) * Math.sin(a2)) + '" rx="220" ry="30" transform="rotate(' + n1(Math.atan2((VEIN.r0 + 70) * Math.cos(a2), -(ELLA0 + 70) * Math.sin(a2)) * 57.3) + ' ' + n1((ELLA0 + 70) * Math.cos(a2)) + ' ' + n1((VEIN.r0 + 70) * Math.sin(a2)) + ')" fill="' + C.muscle + '"/>';
      }
      for (var k = 0; k < 90; k++) { var rr = Math.sqrt(R9()) * .9, a3 = R9() * Math.PI * 2; dots += '<circle cx="' + n1(rr * ELLA0 * Math.cos(a3)) + '" cy="' + n1(rr * VEIN.r0 * Math.sin(a3)) + '" r="44" fill="' + (k % 3 ? C.deo : C.deoHi) + '"/>'; }
      R.exAdvT.innerHTML = t1; R.exMedT.innerHTML = t2; R.exDots.innerHTML = dots;
    }
    function niceBar(k, maxPx) {
      var list = [5000, 2000, 1000, 500, 200, 100, 50, 20, 10, 5, 2, 1];
      for (var i = 0; i < list.length; i++) if (list[i] * k <= maxPx) return { px: list[i] * k, label: list[i] >= 1000 ? (list[i] / 1000) + ' mm' : list[i] + ' µm' };
      return { px: k, label: '1 µm' };
    }
    function scaleBar(x, y, px, label, op) {
      return '<g opacity="' + n2(op) + '"><path d="M' + n1(x) + ' ' + (y - 3) + 'V' + y + 'H' + n1(x + px) + 'V' + (y - 3) + '" class="jn__sbar"/>' +
        '<text x="' + n1(x + px + 6) + '" y="' + (y + 3) + '" class="jn__sbarl">' + esc(label) + '</text></g>';
    }

    /* ----- over the INSIDE drawing: the heading, the cut, the scale, the zoom ----- */
    function renderOverlay(t, E) {
      var T = G.T, i = E.i, st = STAGES[i];
      var headTxt = st.inside.toUpperCase(), dirTxt = '→ ' + st.dir.toUpperCase();
      if (R.tHead.__t !== headTxt) { R.tHead.textContent = headTxt; R.tHead.__t = headTxt; }
      if (R.tDir.__t !== dirTxt) { R.tDir.textContent = dirTxt; R.tDir.__t = dirTxt; }
      /* the dashed line where the cross-section is cut */
      var o = '', sc = SC[i], tl = t - st.t;
      var cutOp = E.tr ? seg(E.u, .9, 1) * seg(tl - E.tr.d, 0, .6) : seg(tl, .4, 1.2);
      if (!E.tr || E.u >= .99) {
        var p = toScr(E, sc.cut, 0), half = [ART.ro, AOL.ro, CAP.fluid + 1, VNL.ro, VEIN.r0 + VEIN.wall][i] * 1.12 * E.k;
        if (i === 4) half = (veinR(sc.cut, ST.eP ? ST.eP.s : 0) + VEIN.wall) * 1.1 * E.k;
        if (i === 1) half = (ST.bRo || AOL.ro) * 1.12 * E.k;
        if (i === 2) half = Math.min(T.VH / 2 - 4, 11 * E.k);
        if (p.x > T.VX + 4 && p.x < T.VX + T.VW - 4) {
          o += '<g opacity="' + n2(cutOp) + '"><path d="M' + n1(p.x) + ' ' + n1(p.y - half) + 'V' + n1(p.y + half) + '" class="jn__cut"/>' +
            '<path d="M' + n1(p.x) + ' ' + n1(p.y - half - 7) + 'l-3.5 -6h7z" class="jn__cutm"/><path d="M' + n1(p.x) + ' ' + n1(p.y + half + 7) + 'l-3.5 6h7z" class="jn__cutm"/></g>';
        }
      }
      R.tOver.innerHTML = o;
      /* the scale bar, which changes as the camera zooms */
      var bar = niceBar(E.k, T.VW * .34);
      R.tScale.innerHTML = scaleBar(T.VX + 8, T.VY + T.VH + 15, bar.px, bar.label, 1);
      /* while zooming, say how much */
      var z = '';
      if (E.tr) {
        var f = Math.round(E.tr.dir > 0 ? SC[i - 1].F / SC[i].F : SC[i].F / SC[i - 1].F);
        var zop = Math.min(seg(E.u, 0, .12), 1 - seg(E.u, .85, 1));
        var txt = (E.tr.dir > 0 ? 'Zooming in ×' : 'Zooming out ×') + f;
        var w = textW(txt, 12) + 22;
        z = '<g opacity="' + n2(zop) + '"><rect x="' + n1(T.cx - w / 2) + '" y="' + (T.VY + 10) + '" width="' + n1(w) + '" height="22" rx="11" class="jn__zoom"/>' +
            '<text x="' + n1(T.cx) + '" y="' + (T.VY + 25) + '" text-anchor="middle" class="jn__zoomt">' + esc(txt) + '</text></g>';
      }
      R.tZoom.innerHTML = z;
    }

    /* ============================================================
       Labels: each in the gutter to the right of its drawing, level with its part, joined by a
       leader RULED HORIZONTALLY. Horizontal leaders at different heights cannot cross; labels are
       kept in the order of their parts and never overlap. A label whose part is a band (a layer
       of the wall, the lumen) may move up or down within that band to make room, and its point
       moves with it, so its leader stays level.
       ============================================================ */
    function L(view, stage, text, t0, spec2) { var o = spec2; o.view = view; o.stage = stage; o.text = text; o.t0 = t0; return o; }
    var LABELS = [
      /* 1 artery — inside */
      L('in', 0, 'the artery divides', 5.0, { at: function () { return { x: 8950, y: -2560 }; } }),
      L('in', 0, 'blood surges with each heartbeat', 5.6, { x: 6400, y: 300, band: [-1000, 1200] }),
      L('in', 0, 'wall stretches, then recoils', 6.2, { x: 7300, y: function () { return ST.aRi + (ST.aRo - ST.aRi) * .36; }, band: function () { return [ST.aRi + (ST.aRo - ST.aRi) * .1, ST.aRi + (ST.aRo - ST.aRi) * .72]; } }),
      /* 1 artery — cut across */
      L('x', 0, 'fibrous outer layer', 1.2, { ring: function () { return rX0(2830); }, y: -.78 }),
      L('x', 0, 'endothelium', 1.8, { ring: function () { return rX0(2008); }, y: -.62 }),
      L('x', 0, 'muscle and elastic fibres', 2.4, { ring: function () { return rX0(2365); }, y: -.15 }),
      L('x', 0, 'narrow lumen', 3.0, { lumen: function () { return rX0(2000); }, y: .3 }),
      L('x', 0, 'thick wall', 3.6, { bracket: function () { return [rX0(2000), rX0(3000)]; }, y: .72 }),
      /* 2 arteriole — inside */
      L('in', 1, 'red blood cells', 4.6, { x: 132, y: 0, band: [-6, 6] }),
      L('in', 1, function () { var c = ST.bC || 0; return c > .35 ? 'muscle contracts: lumen narrows' : c < -.35 ? 'muscle relaxes: lumen widens' : 'smooth muscle'; }, 5.2,
        { x: 124, y: function () { return -((ST.bRi || AOL.ri) + ((ST.bRo || AOL.ro) - (ST.bRi || AOL.ri)) * .45); }, band: function () { var ri = ST.bRi || AOL.ri, ro = ST.bRo || AOL.ro; return [-(ri + (ro - ri) * .78), -(ri + (ro - ri) * .2)]; } }),
      /* 2 arteriole — cut across */
      L('x', 1, 'smooth muscle', 3.4, { ring: function () { var q = ST.xb; return q ? (q.en + q.ad) / 2 : 20; }, y: -.55 }),
      L('x', 1, 'endothelium', 4.0, { ring: function () { var q = ST.xb; return q ? q.ri + .4 : 15.4; }, y: -.08 }),
      L('x', 1, 'lumen', 4.6, { lumen: function () { var q = ST.xb; return q ? q.ri : 15; }, y: .5, lx: .05 }),
      /* 3 capillary — inside */
      L('in', 2, 'red blood cells in single file', 3.4, { x: 60, y: 0, band: [-1.6, 1.6] }),
      L('in', 2, 'oxygen', 7.4, { x: 48, y: -9.4, band: [-10.4, -6] }),
      L('in', 2, 'glucose', 7.9, { x: function () { return CAPX.glc; }, y: -5.2, band: [-8, -3] }),
      L('in', 2, 'carbon dioxide', 8.4, { x: 71, y: 7, band: [3, 10.4] }),
      /* 3 capillary — cut across */
      L('x', 2, 'red blood cell', 2.2, { band2: [-2.35, -1.45], bx: .35, y: -1.9 }),
      L('x', 2, 'wall: one cell thick', 2.8, { ring: function () { return (CAP.ri + CAP.endo) / 2; }, y: .6 }),
      L('x', 2, 'tissue cell', 3.4, { band2: [9.6, 14.2], bx: 6, y: 11.5 }),
      /* 4 venule — inside */
      L('in', 3, 'capillaries join', 3.6, { x: 16, y: -10, band: [-11.8, -6] }),
      L('in', 3, 'white blood cell leaving the blood', 7.8, { at: function () { var w = ST.wbc; return w ? { x: w.x + 1.5, y: VNL.ri + .6 } : null; } }),
      /* 4 venule — cut across */
      L('x', 3, 'thin wall', 2.6, { ringE: function () { return [20.5 * 1.13, 20.5 * .86]; }, y: -.5 }),
      L('x', 3, 'lumen', 3.2, { lumenE: function () { return [19 * 1.13, 19 * .86]; }, y: .35, lx: .55 }),
      /* 5 vein — inside */
      L('in', 4, function () { var P = ST.eP; return !P || P.dir === 0 ? (P && P.s > .5 ? 'leg muscle contracts' : 'leg muscle') : P.dir > 0 ? 'leg muscle contracts' : 'leg muscle relaxes'; }, 6.0,
        { x: 3850, y: function () { return veinR(3850, ST.eP ? ST.eP.s : 0) + VEIN.wall + 600; }, band: function () { var r = veinR(3850, ST.eP ? ST.eP.s : 0) + VEIN.wall; return [r + 180, r + 2600]; } }),
      L('in', 4, function () { return (ST.vB || 0) > .5 ? 'valve open' : 'valve closed'; }, 6.8, { at: function () { var v = ST.vBt; return v ? { x: lerp(v.bx, v.fx, .3), y: lerp(v.by, v.fy, .3) } : null; } }),
      L('in', 4, function () { return (ST.vA || 0) > .5 ? 'valve open' : 'valve closed'; }, 7.4, { at: function () { var v = ST.vAb; return v ? { x: lerp(v.bx, v.fx, .5), y: lerp(v.by, v.fy, .5) } : null; } }),
      /* 5 vein — cut across */
      L('x', 4, 'little muscle', 1.4, { ringE: function () { var q = ST.xe || { a: ELLA0, b: VEIN.r0 }; return [q.a + 70, q.b + 70]; }, y: -.62 }),
      L('x', 4, 'wide lumen', 2.0, { lumenE: function () { var q = ST.xe || { a: ELLA0, b: VEIN.r0 }; return [q.a, q.b]; }, y: -.05, lx: .45 }),
      L('x', 4, 'thin wall', 2.6, { bracketE: function () { var q = ST.xe || { a: ELLA0, b: VEIN.r0 }; return [q.a, q.b, VEIN.wall]; }, y: .5 })
    ];
    function rX0(r) { var d = ST.xa ? ST.xa.dR : 0; return Math.sqrt(r * r + d); }

    function drawLabels(t, E) {
      var outIn = '', outX = '';
      var lh = FONT * 1.17, gap = 4;
      ['in', 'x'].forEach(function (view) {
        var V = view === 'in' ? G.T : G.S, list = [];
        LABELS.forEach(function (lb) {
          if (lb.view !== view) return;
          var st = STAGES[lb.stage], tl = t - st.t;
          /* a stage's labels fade in one by one, and go when the next stage starts */
          var op = seg(tl, lb.t0, lb.t0 + .4);
          if (E.i !== lb.stage) {
            if (E.i === lb.stage + 1 && E.tr) op *= 1 - seg(t - STAGES[E.i].t, 0, .35); else op = 0;
          } else if (E.tr) op = 0;
          if (op <= .01) return;
          var item = place(lb, view, E);
          if (!item) return;
          var text = typeof lb.text === 'function' ? lb.text() : lb.text;
          item.lines = wrapText(text, V.gw - 10, FONT);
          item.h = item.lines.length * lh; item.op = op; item.ly = item.sy;
          list.push(item);
        });
        list.sort(function (a, b) { return a.sy - b.sy; });
        resolve(list, V.VY, V.h - 4, lh, gap);
        var o = '';
        list.forEach(function (it) {
          var ex = V.gx, bend = Math.abs(it.ly - it.sy) > .5;
          var d = 'M' + n1(it.sx) + ' ' + n1(it.sy) + 'L' + n1(ex + (bend ? 1 : 3)) + ' ' + n1(it.sy) + (bend ? 'L' + n1(ex + 5) + ' ' + n1(it.ly) : '') + 'L' + n1(ex + 6) + ' ' + n1(it.ly);
          var y0 = it.ly - it.h / 2 + FONT * .8, tx = ex + 10;
          o += '<g opacity="' + n2(it.op) + '" data-lab="' + esc(it.lines.join(' ')) + '" data-ax="' + n1(it.sx) + '" data-ay="' + n1(it.sy) + '" data-ly="' + n1(it.ly) + '">' +
            (it.bracket ? '<path d="' + it.bracket + '" class="jn__brh"/><path d="' + it.bracket + '" class="jn__br"/>' : '') +
            '<path class="jn__leadh" d="' + d + '"/><path class="jn__lead" d="' + d + '"/>' +
            '<circle class="jn__pin" cx="' + n1(it.sx) + '" cy="' + n1(it.sy) + '" r="2.3"/>' +
            '<text class="jn__lab" x="' + n1(tx) + '" y="' + n1(y0) + '" style="font-size:' + FONT + 'px">' +
            it.lines.map(function (ln, k) { return '<tspan x="' + n1(tx) + '" dy="' + (k ? n1(lh) : 0) + '">' + esc(ln) + '</tspan>'; }).join('') + '</text></g>';
        });
        if (view === 'in') outIn = o; else outX = o;
      });
      R.tLabs.innerHTML = outIn;
      R.sLabs.innerHTML = outX;
    }
    /* Make room between labels. First only the labels whose part is a band move, each within its
       band, and its point moves with it, so its leader stays level. Only if that is not enough are
       the others moved, and their leaders take a short step near the gutter. A label that is still
       fading in claims its room early (by a quarter of its fade), so no two ever overlap. */
    function resolve(list, top, bottom, lh, gap) {
      var n = list.length, i, pass;
      if (!n) return;
      function room(p, q) { return (p.h / 2 + gap + q.h / 2) * Math.min(1, Math.min(p.op, q.op) * 4); }
      function lim(it) {
        var lo = top + it.h / 2, hi = bottom - it.h / 2;
        if (it.band) { lo = Math.max(lo, it.band[0]); hi = Math.min(hi, it.band[1]); }
        return [lo, Math.max(lo, hi)];
      }
      list.forEach(function (it) { var L2 = lim(it); it.ly = clamp(it.sy, L2[0], L2[1]); });
      for (pass = 0; pass < 80; pass++) {
        var moved = false;
        for (i = 0; i + 1 < n; i++) {
          var A = list[i], B = list[i + 1], need = room(A, B) - (B.ly - A.ly);
          if (need <= .05) continue;
          var up = A.band ? Math.max(0, A.ly - lim(A)[0]) : 0, dn = B.band ? Math.max(0, lim(B)[1] - B.ly) : 0;
          if (up + dn <= .01) continue;
          var mA = Math.min(up, need * up / (up + dn)), mB = Math.min(dn, need - mA);
          A.ly -= mA; B.ly += mB; moved = true;
        }
        if (!moved) break;
      }
      /* the last resort: move whatever must move, down and then up, keeping the order */
      for (pass = 0; pass < 3; pass++) {
        if (list[0].ly < top + list[0].h / 2) list[0].ly = top + list[0].h / 2;
        for (i = 1; i < n; i++) { var lo = list[i - 1].ly + room(list[i - 1], list[i]); if (list[i].ly < lo - .05) list[i].ly = lo; }
        for (i = n - 1; i >= 0; i--) {
          var hi = i === n - 1 ? bottom - list[i].h / 2 : list[i + 1].ly - room(list[i], list[i + 1]);
          if (list[i].ly > hi + .05) list[i].ly = hi;
        }
      }
      list.forEach(function (it) {
        if (!it.band) return;
        var yy = clamp(it.ly, it.band[0], it.band[1]);
        it.sy = yy; it.sx = it.xAt(yy);
      });
    }
    /* where a label's point is, in the pixels of its drawing */
    function place(lb, view, E) {
      if (view === 'in') {
        var T = G.T;
        function scr(x, y) { return toScr(E, x, y); }
        if (lb.at) { var p = lb.at(); if (!p) return null; var s = scr(p.x, p.y); return inView(T, s) ? { sx: s.x, sy: s.y } : null; }
        var y = typeof lb.y === 'function' ? lb.y() : lb.y, band = typeof lb.band === 'function' ? lb.band() : lb.band;
        var lx = typeof lb.x === 'function' ? lb.x() : lb.x;
        var s2 = scr(lx, y);
        if (!inView(T, s2)) return null;
        var b0 = scr(lx, band[0]).y, b1 = scr(lx, band[1]).y;
        return { sx: s2.x, sy: s2.y, band: [Math.min(b0, b1), Math.max(b0, b1)], xAt: function () { return s2.x; } };
      }
      /* the cross-section: centred in its drawing, at the section's own scale */
      var X = G.S, k = SXK[lb.stage] || sectK(lb.stage), cx = X.cx, cy = X.cy;
      if (lb.fixed) return { sx: cx + k * lb.fixed[0], sy: cy + k * lb.fixed[1] };
      if (lb.band2) return { sx: cx + k * lb.bx, sy: cy + k * lb.y, band: [cy + k * lb.band2[0], cy + k * lb.band2[1]], xAt: function () { return cx + k * lb.bx; } };
      if (lb.ring) {
        var r = lb.ring() * k;
        return { sx: cx + Math.sqrt(Math.max(0, r * r - Math.pow(lb.y * r, 2))), sy: cy + lb.y * r, band: [cy - r * .92, cy + r * .92],
                 xAt: function (yy) { var dy = yy - cy; return cx + Math.sqrt(Math.max(0, r * r - dy * dy)); } };
      }
      if (lb.ringE) {
        var ab = lb.ringE(), ra = ab[0] * k, rb = ab[1] * k;
        function ex(yy) { var dy = (yy - cy) / rb; return cx + ra * Math.sqrt(Math.max(0, 1 - dy * dy)); }
        return { sx: ex(cy + lb.y * rb), sy: cy + lb.y * rb, band: [cy - rb * .9, cy + rb * .9], xAt: ex };
      }
      if (lb.lumen) {
        var rl = lb.lumen() * k, lx = lb.lx != null ? lb.lx : .3;
        return { sx: cx + lx * rl, sy: cy + lb.y * rl, band: [cy - rl * .7, cy + rl * .7], xAt: function () { return cx + lx * rl; } };
      }
      if (lb.lumenE) {
        var q = lb.lumenE(), qa = q[0] * k, qb = q[1] * k, lx2 = lb.lx != null ? lb.lx : .3;
        return { sx: cx + lx2 * qa, sy: cy + lb.y * qb, band: [cy - qb * .7, cy + qb * .7], xAt: function () { return cx + lx2 * qa; } };
      }
      if (lb.bracket) {
        var rr = lb.bracket(), r1 = rr[0] * k, r2 = rr[1] * k, rm = (r1 + r2) / 2;
        var it = { band: [cy - rm * .9, cy + rm * .9] };
        it.xAt = function (yy) {
          var sn = clamp((yy - cy) / rm, -.95, .95), cs = Math.sqrt(1 - sn * sn);
          var ax = cx + r1 * cs, ay = cy + r1 * sn, bx = cx + r2 * cs, by = cy + r2 * sn, nx = -sn * 4, ny = cs * 4;
          it.bracket = 'M' + n1(ax + nx) + ' ' + n1(ay + ny) + 'L' + n1(ax) + ' ' + n1(ay) + 'L' + n1(bx) + ' ' + n1(by) + 'L' + n1(bx + nx) + ' ' + n1(by + ny) +
                       'M' + n1(ax - nx) + ' ' + n1(ay - ny) + 'L' + n1(ax) + ' ' + n1(ay) + 'M' + n1(bx - nx) + ' ' + n1(by - ny) + 'L' + n1(bx) + ' ' + n1(by);
          return cx + rm * cs;
        };
        it.sy = cy + lb.y * rm; it.sx = it.xAt(it.sy);
        return it;
      }
      if (lb.bracketE) {
        var e = lb.bracketE(), ea = e[0] * k, eb = e[1] * k, wl = e[2] * k;
        var it2 = { band: [cy - eb * .9, cy + eb * .9] };
        it2.xAt = function (yy) {
          var dy = (yy - cy) / eb, xin = cx + ea * Math.sqrt(Math.max(0, 1 - dy * dy)), xo = xin + Math.max(wl, 2.5);
          it2.bracket = 'M' + n1(xin) + ' ' + n1(yy - 4) + 'V' + n1(yy + 4) + 'M' + n1(xo) + ' ' + n1(yy - 4) + 'V' + n1(yy + 4) + 'M' + n1(xin) + ' ' + n1(yy) + 'H' + n1(xo);
          return (xin + xo) / 2;
        };
        it2.sy = cy + lb.y * eb; it2.sx = it2.xAt(it2.sy);
        return it2;
      }
      return null;
    }
    function inView(V, p) { return p.x > V.VX + 3 && p.x < V.VX + V.VW - 3 && p.y > V.VY + 3 && p.y < V.VY + V.VH - 3; }

    /* ----- the route: how far along, and the pressure there now ----- */
    function renderRoute(t) {
      if (!RT) return;
      var i = stepAt(t), st = STAGES[i], f = clamp01((t - st.t) / st.dur), u = i + f;
      if (!started) u = 0;
      var x = RT.xOfU(Math.min(u, 4.9999)), p;
      if (i === 0) p = 80 + 40 * pulseP(t - st.t);
      else p = routeP(Math.min(u, 4.9999));
      RT.clip.setAttribute('width', n1(started ? x : 0));
      set(RT.dot, { cx: n1(x), cy: n1(RT.yOf(p)), fill: i < 2 ? C.oxy : i === 2 ? mixc(C.deo, C.oxy, 1 - f) : C.deo });
      Array.prototype.forEach.call(RT.stops, function (g, k) { g.classList.toggle('is-on', started && k === i); g.classList.toggle('is-done', started && k < i); });
    }

    /* ============================================================
       The words under the plate, the picture, the table: they change with the stage
       ============================================================ */
    var shownStep = -2;
    function paintStage(i) {
      if (i === shownStep) return;
      shownStep = i;
      var st = STAGES[Math.max(0, i)];
      if (i < 0) {
        cap.innerHTML = '<p class="jn__caph"><b>Five stages</b></p><p class="jn__capp">You travel with the blood: from an artery, through the smallest vessels, back along a vein. The blood moves in slow motion. Each stage stops, so you can read it and look.</p>';
      } else {
        var tag = st.ext ? TAG[st.ext] : null;
        cap.innerHTML = '<p class="jn__caph"><span class="jn__num">' + (i + 1) + '</span><b>' + esc(st.name) + '</b>' +
          (tag ? ' <span class="jn__tag">' + esc(tag.chip) + '</span>' : '') + '</p>' +
          '<p class="jn__capp">' + st.text.map(function (s) { return (s[1] ? '<span class="jn__s" aria-label="Supplement">S</span>' : '') + esc(s[0]); }).join(' ') + '</p>' +
          (tag && tag.note ? '<p class="jn__tagnote">' + esc(tag.note) + '</p>' : '') +
          '<p class="jn__beyond"><span class="jn__beyondt">Beyond the syllabus</span> ' + esc(st.beyond) + '</p>';
      }
      /* the picture */
      var pic = st.pic;
      below.classList.toggle('jn__below--nopic', !pic);
      real.hidden = !pic;
      if (pic) {
        var base = 'assets/photos/' + pic.img;
        real.innerHTML = '<button type="button" class="jn__realb" aria-label="Enlarge: ' + esc(pic.cap) + '"><picture>' +
          '<source type="image/webp" srcset="' + base + '-900.webp ' + pic.w + 'w' + (pic.big ? ', ' + base + '-1400.webp 1400w' : '') + '" sizes="(max-width: 620px) 92vw, 380px">' +
          '<img src="' + base + '-900.jpg" srcset="' + base + '-900.jpg ' + pic.w + 'w' + (pic.big ? ', ' + base + '-1400.jpg 1400w' : '') + '" sizes="(max-width: 620px) 92vw, 380px" width="' + pic.w + '" height="' + pic.h + '" alt="' + esc(pic.alt) + '" loading="lazy" decoding="async"></picture></button>' +
          '<figcaption><span class="jn__realk">Real</span> ' + esc(pic.cap) + ' <span class="jn__credit">' +
          (pic.url ? '<a href="' + esc(pic.url) + '" target="_blank" rel="noopener">' + esc(pic.credit) + '</a>' : esc(pic.credit)) + '</span></figcaption>';
        var btn = real.querySelector('button'), im = real.querySelector('img');
        btn.addEventListener('click', function () {
          if (global.LabLightbox) global.LabLightbox(im.currentSrc || im.src, esc(pic.cap), 'Photograph', pic.url ? '<a href="' + esc(pic.url) + '" target="_blank" rel="noopener">' + esc(pic.credit) + '</a>' : esc(pic.credit));
        });
      }
      /* fetch the next stage's picture now, so it is there when the reader gets to it; the same
         candidate the page will choose (WebP where the browser takes it) */
      var nx = STAGES[Math.max(0, i) + 1], np = nx && nx.pic;
      if (np && i >= -1) {
        try {
          var nb = 'assets/photos/' + np.img, pre = new Image(), ext = WEBP ? '.webp' : '.jpg';
          pre.sizes = '(max-width: 620px) 92vw, 380px';
          pre.srcset = nb + '-900' + ext + ' ' + np.w + 'w' + (np.big ? ', ' + nb + '-1400' + ext + ' 1400w' : '');
          pre.src = nb + '-900.jpg';
        } catch (e) {}
      }
      /* the key under the plate: the colours, said once, and what is simplified here */
      key.innerHTML = '<span class="jn__sw jn__sw--o"></span>oxygenated <span class="jn__sw jn__sw--d"></span>deoxygenated — the diagram convention: real deoxygenated blood is dark red.' +
        (st.note && i >= 0 ? ' <span class="jn__simp">' + esc(st.note) + '</span>' : '');
      if (table) Array.prototype.forEach.call(table.querySelectorAll('[data-col]'), function (c) {
        var col = +c.getAttribute('data-col');
        c.classList.toggle('is-on', i >= 0 && col === { 0: 0, 2: 1, 4: 2 }[i]);
      });
      svgT.setAttribute('aria-label', i < 0 ? 'An artery cut along its length, with blood in it.' : st.inside + ', cut along its length. ' + st.text.map(function (s) { return s[0]; }).join(' '));
      svgS.setAttribute('aria-label', 'The ' + st.name.toLowerCase() + ' cut across, labelled.');
    }

    /* ============================================================
       Playing, one stage at a time (the pollentube rules): each stage plays, then holds its last
       frame until "Next step". "Play all" runs straight through. With reduced motion, each press
       shows the next stage as a still, with no timer.
       ============================================================ */
    var T0 = 0, playing = false, raf = null, last = null, started = false, stopAt = null;
    function stepEnd(i) { return i + 1 < STAGES.length ? STAGES[i + 1].t : END; }
    function segEnd(i) { return i + 1 < STAGES.length ? STAGES[i + 1].t - .02 : END; }
    function atStepEnd() { return started && !playing && stopAt != null && T0 >= stopAt - 1e-3; }
    function still() { return global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches; }
    function paint(t) {
      if (G && built) render(t);
      var k = stepAt(t);
      paintStage(started ? k : -1);
      count.textContent = started ? 'Stage ' + (k + 1) + ' of ' + STAGES.length : STAGES.length + ' stages';
      syncPlay();
    }
    function syncPlay() {
      var ended = T0 >= END - 1e-3, next = atStepEnd() && !ended;
      play.innerHTML = playing ? '<span class="jn__ico" aria-hidden="true">❚❚</span> Pause'
        : ended ? '<span class="jn__ico" aria-hidden="true">↻</span> Play again'
        : !started ? '<span class="jn__ico" aria-hidden="true">▶</span> Play'
        : next ? '<span class="jn__ico" aria-hidden="true">▶</span> Next step'
        : '<span class="jn__ico" aria-hidden="true">▶</span> Resume';
      play.classList.toggle('is-playing', playing);
      play.classList.toggle('is-next', next);
      all.hidden = still();
    }
    function stop() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function frame(ts) {
      if (!box.isConnected) { stop(); return; }
      if (last == null) last = ts;
      var lim = stopAt == null ? END : stopAt;
      T0 = Math.min(lim, T0 + Math.min(.1, (ts - last) / 1000)); last = ts;
      if (T0 >= lim) { playing = false; raf = null; paint(T0); return; }
      paint(T0);
      raf = requestAnimationFrame(frame);
    }
    function run(from, to) {
      stop(); watchSize(); started = true; stopAt = to;
      if (!built) build();
      if (still()) { T0 = to; paint(T0); return; }
      T0 = from; playing = true; last = null; paint(T0);
      raf = requestAnimationFrame(frame);
    }
    function goStep(i) { run(STAGES[i].t, segEnd(i)); }
    play.addEventListener('click', function () {
      if (playing) { stop(); paint(T0); return; }
      if (!started || T0 >= END - 1e-3) { goStep(0); return; }
      if (atStepEnd()) { goStep(stepAt(T0) + 1); return; }
      run(T0, stopAt == null ? segEnd(stepAt(T0)) : stopAt);
    });
    all.addEventListener('click', function () {
      var from = !started || T0 >= END - 1e-3 ? 0 : atStepEnd() ? STAGES[stepAt(T0) + 1].t : T0;
      run(from, END);
    });

    /* ----- sizes: build when the widget has a width; build again when it changes ----- */
    var ro = null, lastW = 0;
    function fit() {
      var w = Math.floor(plate.getBoundingClientRect().width);
      if (!w || Math.abs(w - lastW) < 2) return;
      lastW = w;
      try { var fam = getComputedStyle(document.documentElement).getPropertyValue('--font').trim(); if (fam) FAMILY = fam; } catch (e) {}
      root.classList.toggle('jn--narrow', w < 600);
      build();
      paint(T0);
    }
    function watchSize() {
      if (ro || !global.ResizeObserver) return;
      ro = new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); ro = null; return; } fit(); });
      ro.observe(plate);
    }
    if (global.ResizeObserver) watchSize(); else global.addEventListener('resize', fit);

    box.__onReset = function () { stop(); if (ro) { ro.disconnect(); ro = null; } };
    /* for the headless checks (_journey.html): jump straight to a frame */
    box.__seek = function (t) {
      stop();
      if (!built || Math.abs(Math.floor(plate.getBoundingClientRect().width) - lastW) >= 2) { lastW = 0; fit(); }
      started = t > 0; T0 = Math.max(0, Math.min(END, t));
      stopAt = null;
      STAGES.forEach(function (st, i) { if (Math.abs(segEnd(i) - T0) < .011) stopAt = segEnd(i); });
      paint(T0);
      return { steps: STAGES.map(function (s) { return s.t; }), end: END, holds: STAGES.map(function (s, i) { return segEnd(i); }) };
    };
    box.__state = function () { return { T: T0, playing: playing, started: started, stopAt: stopAt, G: G }; };
    box.__render = render;
    box.__frame = function () { return ST; };

    paintStage(-1);
    syncPlay();
    count.textContent = STAGES.length + ' stages';
    /* the first build waits for a width; a node not yet in the page has none */
    setTimeout(function () { if (box.isConnected) fit(); }, 0);
    return box;
  }

  CL.add('journey', journey);
})(window);
