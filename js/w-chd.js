/* ============================================================
   w-chd.js — coronary heart disease: the two widgets of the station `chd` (0610 9.2).

     artery    "Inside a coronary artery". Above, the heart from the front with its coronary arteries
               (Servier Medical Art, CC BY 4.0: js/data/chd-heart.js), a yellow ring on the left
               coronary artery's anterior descending branch; below, the part inside the ring cut along
               its length, in a yellow frame. Six steps, each held until "Next step": a healthy artery;
               fatty material builds up in the wall, under the lining; the deposit grows and the lumen
               narrows; its surface breaks and a blood clot forms on it; the clot blocks the artery; the
               heart muscle beyond the blockage dies. Red blood cells, drawn as biconcave discs, move
               with the blood: fewer pass each second as the lumen narrows, they move faster through the
               narrow part (the same blood through a smaller gap), and they stop when the artery is
               blocked. On the heart, the patch of muscle beyond the ring darkens as its supply fails and
               turns grey when its cells die, on the same clock. Drive it with the lab's step player
               (js/w-common.js): Play, Next step, Play all; box.__seek(t) draws any moment.
     profiles  "Who is most at risk?". The six people of the 9.2 worksheet. The reader puts
               them in order, highest risk first (drag a card by its handle, or use its arrow
               buttons). "Check" marks the 0610 risk factors on every card, counts them and
               gives the order by count, ties in any order; "Which can they change?" splits
               each person's factors. A sentence frame and a box for the answer close it.

   SOURCES (every number and claim)
   · Syllabus: Cambridge IGCSE Biology 0610, 2026–2028, 9.2 Core: "Describe coronary heart
     disease in terms of the blockage of coronary arteries and state the possible risk factors
     including: diet, lack of exercise, stress, smoking, genetic predisposition, age and sex";
     Supplement: "Discuss the roles of diet and exercise in reducing the risk of coronary heart
     disease". The station text (stations.master.js, chd) gives the wording used here.
   · Mark schemes and reports: the deposit is IN the wall (ER June 2017 41 Q1(e); MS 0610/32/O/N/11
     Q1(c) "fatty deposit in (wall of) artery", A "atheroma / plaque"); the heart MUSCLE is
     starved (ER Nov 2017 43 Q2(b)); a risk factor must be qualified (ER June 2016 32 Q5(b)).
   · The wall of a muscular artery: an intima (endothelium on the internal elastic lamina), a thick
     media of smooth muscle with elastic fibres, and an adventitia (Young B et al., Wheater's
     Functional Histology, 6th ed., 2014, ch. 8). The fatty deposit forms in the intima, under the
     endothelium, and contains cholesterol, much of it as crystals (Kumar V, Abbas AK, Aster JC,
     Robbins and Cotran Pathologic Basis of Disease, 10th ed., 2021, ch. 11; Libby P, Ridker PM,
     Hansson GK 2011, Nature 473: 317–325). Beneath a deposit the media thins and loses elastic
     fibres, so the wall is stiffer (Robbins, ch. 11).
   · A clot forms where the surface of the deposit breaks or wears away; platelets stick to it
     first (Falk E et al. 2013, Eur Heart J 34: 719–728).
   · Flow: a narrowing first limits the extra flow of exercise; flow at rest falls only when the
     narrowing is severe (Gould KL, Lipscomb K, Hamilton GW 1974, Am J Cardiol 33: 87–94). The
     drawing lowers the flow a little from step 3, as the station text says ("less blood can flow").
   · Time: a deposit grows over years to decades; heart muscle cells are damaged beyond repair
     after 20 to 40 minutes of severe loss of blood supply (Robbins, ch. 12; Reimer KA et al. 1977,
     Circulation 56: 786–794).
   · Size: a large coronary artery is about 3–4 mm across inside; a red blood cell is about 7.5 µm
     (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 33), so the cells are drawn
     several hundred times too large, and far fewer.
   · Profiles: the 9.2 worksheet "Coronary Heart Disease" (Dr Mompel's lesson; fictional people),
     copied faithfully and shortened. The worksheet gives no sex: it is taken from the names.
     Counting rules: age counts from 45 for a man and 55 for a woman, the cut-offs in NCEP ATP III
     (2001), JAMA 285: 2486–2497; any smoking counts, even a few cigarettes (Hackshaw A et al.
     2018, BMJ 360: j5855); a former smoker is not counted, because the risk falls after stopping
     (US Surgeon General 1990, The Health Benefits of Smoking Cessation); exercise once a week is
     too little: adults should spread exercise over 4 to 5 days a week, or every day (NHS physical
     activity guidelines for adults, from the UK Chief Medical Officers' guidelines 2019).
     Alcohol is on the worksheet but not in the 0610 list, so it is shown and not counted.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L || !L.stepper || !L.labels) return;
  var h = L.h, esc = L.esc;
  var NS = 'http://www.w3.org/2000/svg';
  var UID = 0;

  /* ---------- small helpers ---------- */
  function n1(v) { return Math.round(v * 10) / 10; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function rgbOf(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mixc(a, b, k) {
    var A = rgbOf(a), B = rgbOf(b), o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(A[i] + (B[i] - A[i]) * clamp01(k)); o += (v < 16 ? '0' : '') + v.toString(16); }
    return o;
  }
  /* a repeatable random sequence, so every drawing is the same on every load */
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }

  /* The lettering must be at least `px` on screen. The drawing is `bw` units wide; each margin is
     wide enough for its longest word (cL, cR: characters × about half a font). Returns the font
     and the two margins, in drawing units. */
  function fitType(D, bw, cL, cR, mL0, mR0, px) {
    var f = px * (bw + mL0 + mR0) / D, mL = mL0, mR = mR0;
    for (var i = 0; i < 10; i++) { mL = Math.max(mL0, cL * .55 * f + 20); mR = Math.max(mR0, cR * .55 * f + 20); f = px * (bw + mL + mR) / D; }
    return { f: f, mL: mL, mR: mR };
  }

  /* Reading time. Each step's animation is written in its own time (the model's); the reader's
     time stretches it so that a step lasts at least 1 second for every 3.2 words of its caption
     (the lab's rule is 4). R = when each step starts for the reader, M = in the model. */
  function readerClock(R, M) {
    return function (t) {
      for (var i = 0; i + 1 < R.length; i++) if (t < R[i + 1] || i + 2 === R.length) return M[i] + (Math.min(t, R[i + 1]) - R[i]) * (M[i + 1] - M[i]) / (R[i + 1] - R[i]);
      return M[M.length - 1];
    };
  }
  function readerSteps(steps, R) { return steps.map(function (s, i) { var o = {}; for (var k in s) o[k] = s[k]; o.t = R[i]; return o; }); }

  /* ================================================================
     artery — inside a coronary artery
     ================================================================ */
  /* Two drawings, one above the other, driven by one clock (Daniel, 27 Sep: "draw a little heart. And as
     the fatty deposit grows, you see a section of the heart ... going grey ... clearly in sync").
     Above, the heart from the front with its coronary arteries (Servier Medical Art, js/data/chd-heart.js);
     a yellow ring marks one place on the left coronary artery's anterior descending branch. Below, that
     place cut along its length, in a frame of the same yellow. The patch of heart muscle the artery
     supplies beyond the ring darkens as its blood supply fails and turns grey when its cells die.

     The artery's model, in its own units (about 34 to the millimetre): it runs left to right, blood
     entering from the aorta on the left. On a narrow screen the artery is turned on its side (x and y
     swapped), so it runs down the page under the heart, as the artery itself runs down the heart. */
  var AR = {
    W: 660,
    yOut: 46, yMed: 58, yIel: 86, yLum: 90,           /* upper wall, outside in: adventitia, media, internal elastic lamina, lining */
    yLum2: 206, yIel2: 210, yMed2: 238, yOut2: 250,    /* lower wall, inside out, before any deposit */
    xc: 250, hw: 150,                                   /* the fatty deposit: centre and half-length */
    xk: 256, hk: 64,                                    /* the clot: centre and half-length */
    yA: 36, yB: 260                                     /* the strip of the model that is drawn */
  };
  var LUM0 = AR.yLum2 - AR.yLum;                        /* 116: the lumen of the healthy artery */
  /* Downstream of the deposit the artery divides (FORK): the main artery goes on above, and a smaller branch
     leaves below it, narrowing as it goes. The model is XMAX long; the view shows AR.W of it, and pans by up to
     PAN_MAX to follow a piece of clot down to the branch (Daniel, 27 Sep: "move the animation towards a narrower
     area and show how the blood clot would block"). carTop / carBot: the upper and lower faces of the divide. */
  var XMAX = 1300, PAN_MAX = 620;
  var FORK = { x0: 772, x1: 900, top: 140, bot0: 164, bot1: 192 };
  function forkK(x) { var k = (x - FORK.x0) / (FORK.x1 - FORK.x0); k = k < 0 ? 0 : k > 1 ? 1 : k; return k * k * (3 - 2 * k); }
  function carTop(x) { return 168 - (168 - FORK.top) * forkK(x); }
  function carBot(x) { return x <= FORK.x1 ? 170 + (FORK.bot0 - 170) * forkK(x) : FORK.bot0 + (FORK.bot1 - FORK.bot0) * Math.min(1, (x - FORK.x1) / (XMAX - FORK.x1)); }
  function wLow(x) { return x < FORK.x0 ? 0 : AR.yLum2 - carBot(x); }      /* the small branch's lumen */
  function bump(u) { return u <= -1 || u >= 1 ? 0 : (1 - u * u) * (1 - u * u); }
  function bumpFlat(u) { if (u <= -1 || u >= 1) return 0; var q = 1 - u * u * u * u; return q * q; }

  /* The heart, in its own units (points of the Servier slide, 275 × 348). BLK: where the ring sits, on the
     anterior descending branch below the circumflex branch and above its first branch to the septum, so
     the artery beyond it is most of that branch. TERR: the muscle it supplies beyond that point — the front
     of the left ventricle, the front of the septum and the apex (the territory of the left anterior
     descending artery: Kumar V, Abbas AK, Aster JC, Robbins and Cotran Pathologic Basis of Disease, 10th
     ed., 2021, ch. 12) — drawn soft-edged and kept inside the ventricles' outline. */
  var BLK = [189.2, 196], BLK_R = 11;
  var TERR = [[189, 201], [206, 206], [229, 222], [248, 242], [259, 268], [262, 298], [250, 322], [232, 336], [210, 344],
              [184, 340], [164, 324], [152, 298], [148, 268], [152, 240], [163, 217], [177, 205]];
  function closedCurve(P) {         /* a smooth closed path through the points (Catmull-Rom as cubic Béziers) */
    var n = P.length, d = 'M' + P[0][0] + ' ' + P[0][1];
    for (var i = 0; i < n; i++) {
      var p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
      d += ' C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' +
           n1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + p2[0] + ' ' + p2[1];
    }
    return d + 'Z';
  }
  /* the heart muscle beyond the ring: supplied (no tint), short of oxygen (dusky), dead (grey) */
  var MUS = { isch: '#5E3F7E', dead: '#8C8A90' };

  /* The IGCSE story is steps 1-4, 6 and 7 (0610 9.2: the blockage of a coronary artery). Step 5, a piece of the
     clot carried off to block a smaller branch, is extension and less common (Daniel, 27 Sep: "make clear what is
     extension or less common but still interesting to know"): it has its own step, tagged, so it never blurs the
     main story. */
  var AR_STEPS = [
    { t: 0,  h: 'A healthy coronary artery', p: 'Above: the heart from the front, with its coronary arteries on its surface. Below: the part of one coronary artery inside the yellow ring, cut open along its length. Its lining is smooth and its lumen is wide, so blood flows freely. The blood brings oxygen and glucose to the heart muscle.' },
    { t: 12, h: 'Fatty material builds up in the wall', p: 'Over many years, fatty material containing cholesterol builds up in the wall of the artery, under the lining. At first the fatty deposit is small, and blood still flows freely.' },
    { t: 22, h: 'The lumen becomes narrower', p: 'The fatty deposit grows over more years. It bulges into the lumen, so the lumen becomes narrower and less blood can flow through it. The wall there is less elastic. During exercise, the heart muscle beyond the narrow part may not receive enough oxygen.' },
    { t: 35, h: 'A blood clot forms', p: 'The surface of the fatty deposit becomes rough and breaks. Platelets stick to the rough surface, and a blood clot forms on it.' },
    { t: 40, h: 'A piece of the clot breaks off', tag: 'Extension', p: 'Less common, and not in the 0610 syllabus: a piece of the clot can break off and be carried along until it reaches a branch too narrow for it. There it sticks and blocks that branch, and the small patch of heart muscle the branch supplies gets less oxygen.' },
    { t: 46, h: 'The clot blocks the artery', p: 'The clot grows until it blocks the artery completely. No blood can flow past it. The heart muscle beyond the blockage receives no oxygen and no glucose: on the heart, its patch darkens.' },
    { t: 55, h: 'Heart muscle cells die: a heart attack', p: 'Without oxygen, the heart muscle beyond the blockage cannot respire aerobically, so it cannot contract. Its cells die, and its patch turns grey. This is a heart attack. The muscle before the blockage still receives blood.' }
  ];
  var AR_END = 66;

  /* the state of the artery at time t */
  function depAt(t) {      /* the deposit's thickness at its centre */
    if (t < 13) return 0;
    if (t < 22.5) return 18 * ease(seg(t, 13, 20.5));
    return 18 + 64 * ease(seg(t, 23, 32.5));
  }
  function clotAt(t) {     /* the clot's thickness at its centre */
    if (t < 38.4) return 0;
    if (t < 46.2) return 16 * ease(seg(t, 38.4, 42.4));
    return 16 + 54 * ease(seg(t, 46.6, 52.5));
  }
  /* A deposit is long and low, not a peak: several times longer than it is thick, thickest along a broad
     stretch in its middle, thinning gently at its ends (Daniel, 27 Sep: "it kind of looks like a mountain";
     Kumar V et al., Robbins and Cotran Pathologic Basis of Disease, 10th ed., 2021, ch. 11) */
  function plateau(u) { var g = 1 - Math.abs(u); if (g <= 0) return 0; if (g >= .72) return 1; var k = g / .72; return k * k * (3 - 2 * k); }
  function P_(x, P) { return P * plateau((x - AR.xc) / AR.hw); }
  function clotHalf(C) { return 16 + (AR.hk - 16) * clamp01(C / 40); }
  function C_(x, C) { return C * bumpFlat((x - AR.xk) / clotHalf(C)); }
  function lumenW(x, P, C) { return Math.max(0, AR.yLum2 - P_(x, P) - C_(x, C) - AR.yLum); }
  function mainW(x, P, C) { return x < FORK.x0 ? lumenW(x, P, C) : carTop(x) - AR.yLum; }
  function narrowest(P, C) { var m = LUM0; for (var x = AR.xc - 90; x <= AR.xc + 90; x += 5) m = Math.min(m, lumenW(x, P, C)); return m; }
  /* flow through the artery, 1 = healthy. Unchanged until the lumen is half closed, then falling to
     nothing as it closes (a simplification of Gould et al. 1974). */
  function flowOf(w) { var r = w / LUM0; return r >= .5 ? 1 : Math.pow(r / .5, .75); }
  function flowAt(t) { return flowOf(narrowest(depAt(t), clotAt(t))); }
  /* how far the blood has moved by time t: the integral of the flow */
  var vMemo = { t: -1, v: 0 };
  function volumeAt(t) {
    if (Math.abs(vMemo.t - t) < 1e-9) return vMemo.v;
    var dt = .05, v = 0;
    for (var x = 0; x < t; x += dt) v += flowAt(x + Math.min(dt, t - x) / 2) * Math.min(dt, t - x);
    vMemo = { t: t, v: v };
    return v;
  }

  /* A red blood cell is a biconcave disc, about 7.5 µm across, 2 to 2.5 µm thick at its rim and about 1 µm at
     its centre (Guyton & Hall, Textbook of Medical Physiology, 14th ed., ch. 33). Face on it is a disc whose
     thin centre is paler; edge on, a flattened dumbbell; in between, the disc foreshortened. Lit from the top
     left: the rim bulges towards the light, the dimple is a hollow, so its lit side is the lower right.
     Two sets: oxygenated (bright) and, for blood trapped beyond the clot, dusky. */
  var RB = 1.22;                   /* the cells' size, as drawn: 17 units across */
  function rbcDefs(u) {
    function set(k, c) {
      return '<radialGradient id="' + u + 'rb' + k + 'o" cx=".4" cy=".36" r=".72"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".56" stop-color="' + c[1] + '"/><stop offset=".86" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[3] + '"/></radialGradient>' +
        '<linearGradient id="' + u + 'rb' + k + 'i" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="' + c[3] + '"/><stop offset=".55" stop-color="' + c[2] + '"/><stop offset="1" stop-color="' + c[0] + '"/></linearGradient>' +
        '<linearGradient id="' + u + 'rb' + k + 'e" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + c[0] + '"/><stop offset=".5" stop-color="' + c[1] + '"/><stop offset="1" stop-color="' + c[3] + '"/></linearGradient>' +
        '<g id="' + u + 'rb' + k + 'F"><circle r="7" fill="url(#' + u + 'rb' + k + 'o)" stroke="' + c[4] + '" stroke-width=".7"/>' +
          '<circle r="3.5" fill="url(#' + u + 'rb' + k + 'i)" opacity=".85"/><circle r="3.5" fill="none" stroke="' + c[2] + '" stroke-width=".9" stroke-opacity=".55"/></g>' +
        '<path id="' + u + 'rb' + k + 'S" d="M-7 0C-7-2.35-5.6-2.4-4.1-1.8C-2.5-1.1-1.2-.95 0-.95C1.2-.95 2.5-1.1 4.1-1.8C5.6-2.4 7-2.35 7 0C7 2.35 5.6 2.4 4.1 1.8C2.5 1.1 1.2 .95 0 .95C-1.2 .95-2.5 1.1-4.1 1.8C-5.6 2.4-7 2.35-7 0Z" fill="url(#' + u + 'rb' + k + 'e)" stroke="' + c[4] + '" stroke-width=".7"/>';
    }
    return set('', ['#FF9C8C', '#E5483F', '#BC262D', '#8E1A21', '#5E0F15']) + set('D', ['#B77684', '#8E4453', '#6E2E3D', '#4F1E2B', '#35121C']);
  }

  /* everything in the artery that never moves: built once */
  function arStatic(u) {
    var W = AR.W, XL = XMAX + 8, r = rng(7), s = '', i, x, y;
    s += '<defs>' +
      /* plasma, pale and straw-tinted, as it is between the cells: the blood's red is its cells */
      '<linearGradient id="' + u + 'lu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C98C7C"/><stop offset=".5" stop-color="#E8BFA6"/><stop offset="1" stop-color="#C98C7C"/></linearGradient>' +
      '<linearGradient id="' + u + 'dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D47E"/><stop offset="1" stop-color="#D3A244"/></linearGradient>' +
      '<linearGradient id="' + u + 'cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E1E2A"/><stop offset="1" stop-color="#5C111A"/></linearGradient>' +
      '<linearGradient id="' + u + 'sf" gradientUnits="userSpaceOnUse" x1="' + (AR.xc - AR.hw) + '" y1="0" x2="' + (AR.xc + AR.hw) + '" y2="0"><stop offset="0" stop-color="#B7675D" stop-opacity="0"/><stop offset=".28" stop-color="#B7675D"/><stop offset=".72" stop-color="#B7675D"/><stop offset="1" stop-color="#B7675D" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + u + 'm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9564C"/><stop offset="1" stop-color="#C7766A"/></linearGradient>' +
      '<linearGradient id="' + u + 'm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7766A"/><stop offset="1" stop-color="#A9564C"/></linearGradient>' +
      '<clipPath id="' + u + 'cp"><rect class="ar__cr" x="-4" y="' + AR.yA + '" width="' + (W + 8) + '" height="' + (AR.yB - AR.yA) + '" rx="12"/></clipPath>' +
      rbcDefs(u) +
      '</defs>';
    /* the view is a window on the artery: what is in it slides along (ar__pan) while the window stays */
    s += '<g clip-path="url(#' + u + 'cp)"><g class="ar__pan">';
    s += '<rect class="ar__void" x="-4" y="' + AR.yA + '" width="' + XL + '" height="' + (AR.yB - AR.yA) + '"/>';
    /* the blood in the lumen */
    s += '<rect x="-4" y="' + AR.yLum + '" width="' + XL + '" height="' + LUM0 + '" fill="url(#' + u + 'lu)"/>';
    /* the two walls: adventitia, media with elastic fibres, the internal elastic lamina, the lining */
    s += '<rect class="ar__adv" x="-4" y="' + AR.yOut + '" width="' + XL + '" height="' + (AR.yMed - AR.yOut) + '"/>';
    s += '<rect class="ar__med" x="-4" y="' + AR.yMed + '" width="' + XL + '" height="' + (AR.yIel - AR.yMed) + '" fill="url(#' + u + 'm1)"/>';
    s += '<rect class="ar__adv" x="-4" y="' + AR.yMed2 + '" width="' + XL + '" height="' + (AR.yOut2 - AR.yMed2) + '"/>';
    s += '<rect class="ar__med" x="-4" y="' + AR.yIel2 + '" width="' + XL + '" height="' + (AR.yMed2 - AR.yIel2) + '" fill="url(#' + u + 'm2)"/>';
    function wavy(y0, amp, per, ph) { var dd = 'M-6 ' + n1(y0); for (var xx = 0; xx <= XMAX + 12; xx += 6) dd += ' L' + xx + ' ' + n1(y0 + amp * Math.sin(xx / per + ph)); return dd; }
    var el = '';
    [64, 71, 78].forEach(function (yy, k) { el += '<path d="' + wavy(yy, 1.6, 7, k) + '"/>'; });
    [216, 223, 230].forEach(function (yy, k) { el += '<path d="' + wavy(yy, 1.6, 7, k + 1.5) + '"/>'; });
    s += '<g class="ar__el">' + el + '</g>';
    var col = '';
    [50, 54, 242, 246].forEach(function (yy, k) { col += '<path d="' + wavy(yy, 1.1, 11, k * 1.7) + '"/>'; });
    s += '<g class="ar__col">' + col + '</g>';
    s += '<g class="ar__iel"><path d="' + wavy(AR.yIel, 1.3, 5, 0) + '"/><path d="' + wavy(AR.yIel2 + 1, 1.3, 5, 2) + '"/></g>';
    var smc = '';
    for (i = 0; i < 88; i++) { x = r() * XMAX; y = (i % 2 ? AR.yMed + 4 : AR.yIel2 + 4) + r() * 20; smc += '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="5.4" ry="1.3" transform="rotate(' + n1(6 * (r() - .5)) + ' ' + n1(x) + ' ' + n1(y) + ')"/>'; }
    s += '<g class="ar__smc">' + smc + '</g>';
    /* the wall under the deposit loses its elastic fibres: this patch hides them as the deposit grows */
    s += '<rect class="ar__stiff" x="' + (AR.xc - AR.hw) + '" y="' + (AR.yIel2 - 1) + '" width="' + (2 * AR.hw) + '" height="' + (AR.yMed2 - AR.yIel2 + 1) + '" fill="url(#' + u + 'sf)" opacity="0"/>';
    s += '<rect class="ar__lin" x="-4" y="' + (AR.yIel - 1) + '" width="' + XL + '" height="5"/>';
    var en = '';
    for (x = 8; x < XMAX; x += 24) en += '<ellipse cx="' + x + '" cy="' + (AR.yLum - 2.2) + '" rx="4.4" ry="1.2"/>';
    s += '<g class="ar__enuc">' + en + '</g>';
    /* the divide: where the small branch leaves, the two vessels' walls meet as a wedge of wall, lined on both faces */
    var ct = 'M' + FORK.x0 + ' 169', cb = '';
    for (x = FORK.x0; x <= XMAX + 6; x += 6) ct += ' L' + x + ' ' + n1(carTop(x));
    for (x = XMAX + 6; x >= FORK.x0; x -= 6) cb += ' L' + x + ' ' + n1(carBot(x));
    s += '<path class="ar__med" d="' + ct + cb + 'Z" fill="#B8665C"/>';
    var mid = 'M' + (FORK.x0 + 30) + ' ' + n1((carTop(FORK.x0 + 30) + carBot(FORK.x0 + 30)) / 2);
    for (x = FORK.x0 + 36; x <= XMAX + 6; x += 6) mid += ' L' + x + ' ' + n1((carTop(x) + carBot(x)) / 2);
    s += '<path class="ar__cmid" d="' + mid + '"/>';
    var lt = '', lb = '';
    for (x = FORK.x0; x <= XMAX + 6; x += 6) { lt += (lt ? ' L' : 'M') + x + ' ' + n1(carTop(x) - 1.6); lb += (lb ? ' L' : 'M') + x + ' ' + n1(carBot(x) + 1.6); }
    s += '<path class="ar__clin" d="' + lt + '"/><path class="ar__clin" d="' + lb + '"/>';
    /* the parts that change: the deposit, the lower lining, the clot and the cells */
    s += '<g class="ar__dep"></g><g class="ar__lin2"></g><g class="ar__clot"></g><g class="ar__cells"></g>';
    s += '</g>';
    /* which way the blood flows: from the aorta, on the left (fixed to the window) */
    s += '<g class="ar__dir"><path d="M626 136 L635 148 L626 160"/><path d="M636 136 L645 148 L636 160"/></g>';
    s += '</g>';
    /* the frame, in the ring's yellow: this is the part inside the ring on the heart */
    s += '<rect class="ar__frame" x="-4" y="' + AR.yA + '" width="' + (W + 8) + '" height="' + (AR.yB - AR.yA) + '" rx="12"/>';
    return s;
  }

  /* the heart: Servier's drawing, the patch beyond the ring, the artery beyond the ring darkening, the ring */
  function heartStatic(u) {
    var HT = global.CHD_HEART; if (!HT) return '';
    return '<defs>' +
        '<clipPath id="' + u + 'vc"><path d="' + HT.vent + '"/></clipPath>' +
        '<clipPath id="' + u + 'dc"><path d="M120 ' + (BLK[1] + 2) + ' H290 V360 H120 Z"/></clipPath>' +
        '<filter id="' + u + 'soft" x="-25%" y="-25%" width="150%" height="150%"><feGaussianBlur stdDeviation="5"/></filter>' +
      '</defs>' +
      HT.a +
      '<g clip-path="url(#' + u + 'vc)"><path class="ar__terr" d="' + closedCurve(TERR) + '" filter="url(#' + u + 'soft)" opacity="0"/></g>' +
      HT.b +
      '<g clip-path="url(#' + u + 'dc)"><path class="ar__ladD" d="' + HT.lad + '" opacity="0"/></g>' +
      '<g clip-path="url(#' + u + 'vc)"><circle class="ar__lodgeS" cx="' + LODGE[0] + '" cy="' + LODGE[1] + '" r="13" filter="url(#' + u + 'soft)" opacity="0"/></g>' +
      '<circle class="ar__lodge" cx="' + LODGE[0] + '" cy="' + LODGE[1] + '" r="2.6" opacity="0"/>' +
      '<circle class="ar__ringH" cx="' + BLK[0] + '" cy="' + BLK[1] + '" r="' + BLK_R + '"/>' +
      '<circle class="ar__ring" cx="' + BLK[0] + '" cy="' + BLK[1] + '" r="' + BLK_R + '"/>';     /* moved with the view (render) */
  }

  /* the deposit's cholesterol crystals and fat droplets, placed in its own proportions */
  var DEP_BITS = (function () {
    var r = rng(21), out = [];
    for (var i = 0; i < 34; i++) out.push({ u: (r() * 2 - 1) * .78, v: .12 + r() * .7, a: r() * Math.PI, l: 7 + r() * 9, dot: i % 3 === 0, rr: 1.6 + r() * 2.2 });
    return out;
  })();
  var CLOT_BITS = (function () {
    var r = rng(33), out = [];
    for (var i = 0; i < 26; i++) out.push({ u: (r() * 2 - 1) * .85, v: .1 + r() * .8, a: r() * Math.PI, cell: i % 2 === 0 });
    return out;
  })();
  /* A piece of the clot breaks off while it grows and the blood carries it away, down the artery and into a
     smaller branch, until the branch is too narrow for it: there it sticks and blocks that branch (a microembolus:
     Falk E et al. 2013, Eur Heart J 34: 719–728; platelet emboli in small intramyocardial arteries: Davies MJ et
     al. 1986, Circulation 73: 418–427). The clot itself still blocks the artery where it formed, on the deposit,
     which is what causes most heart attacks (DeWood MA et al. 1980, N Engl J Med 303: 897–902); a clot carried
     in from elsewhere causes only about 3 in 100 (Shibata T et al. 2015, Circulation 132: 241–250).
     FR: when it breaks off and how long it travels; X_LODGE: where the branch is as narrow as the piece;
     LODGE: that place on the heart, at the end of a diagonal branch beyond the ring. */
  var FR = { tb: 40.2, dur: 2 };
  var X_LODGE = 1143, FRAG_S = 2, LODGE = [231, 253], LODGE_T = FR.tb + FR.dur;     /* the piece, drawn twice FRAG_D's size, is as tall as the branch at X_LODGE */
  var FRAG_D = 'M-6.5 -2.8C-4 -6.2 2.6 -6.4 6.2 -2.6C8.6 .4 6 4.8 1.4 5.2C-3 6 -8.4 2.8 -6.5 -2.8Z';
  function sm01(k) { k = k < 0 ? 0 : k > 1 ? 1 : k; return k * k * (3 - 2 * k); }
  function fragX0() { return AR.xk + clotHalf(clotAt(FR.tb)) * .72; }
  function fragX(t) { var x0 = fragX0(); return x0 + (X_LODGE - x0) * sm01((t - FR.tb) / FR.dur); }
  /* the view: still, then following the piece (keeping it near the middle), holding on it where it sticks,
     and back to the deposit as the next step begins */
  function panAt(t) {
    if (t <= FR.tb) return 0;
    if (t < 46) return Math.max(0, Math.min(PAN_MAX, fragX(Math.min(t, LODGE_T)) - 330));
    return PAN_MAX * (1 - ease(seg(t, 46, 47.2)));
  }
  var PLT = (function () { var r = rng(44), out = []; for (var i = 0; i < 14; i++) out.push({ x: -15 + 30 * (i / 13) + 2 * (r() - .5), t0: 37.4 + r() * 1.6, dy: r() * 2.5 }); return out; })();

  function artery(spec) {
    var u = 'ar' + (++UID) + '-';
    var box = h('div', 'widget ar');
    box.appendChild(L.head(spec.title || 'Inside a coronary artery', spec.ask, 'Press play'));
    var read = h('div', 'ar__read',
      '<span class="ar__pill" data-k="when"><b>When</b> <i></i></span>' +
      '<span class="ar__pill" data-k="flow"><b>Blood flow</b> <i></i></span>' +
      '<span class="ar__pill" data-k="mus"><b>Heart muscle beyond</b> <i></i></span>');
    var fig = h('figure', 'ar__fig');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'ar__svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'Above, the heart from the front with its coronary arteries; a yellow ring marks one place on a coronary artery. Below, that place cut along its length. Step by step, fatty material builds up in the wall of the artery, the lumen narrows, a blood clot forms and blocks the artery, and the patch of heart muscle beyond the blockage darkens and then turns grey as its cells die.');
    svg.innerHTML = '<rect class="ar__bg"/><g class="ar__heart">' + heartStatic(u) + '</g><g class="ar__model">' + arStatic(u) + '</g><g class="ar__labs"></g>';
    fig.appendChild(svg);
    var bg = svg.querySelector('.ar__bg'), model = svg.querySelector('.ar__model'), gHeart = svg.querySelector('.ar__heart'), gLab = svg.querySelector('.ar__labs');
    var gDep = svg.querySelector('.ar__dep'), gLin = svg.querySelector('.ar__lin2'), gClot = svg.querySelector('.ar__clot'), gCells = svg.querySelector('.ar__cells');
    var stiff = svg.querySelector('.ar__stiff'), terr = svg.querySelector('.ar__terr'), ladD = svg.querySelector('.ar__ladD');
    var lodge = svg.querySelector('.ar__lodge'), lodgeS = svg.querySelector('.ar__lodgeS');
    var panG = svg.querySelector('.ar__pan'), ringEls = [svg.querySelector('.ar__ringH'), svg.querySelector('.ar__ring')];

    /* red blood cells: five lanes across the lumen; each keeps its own tilt, from face on to edge on */
    var r = rng(5), TRUNK = [], LANES = [.12, .3, .5, .7, .88];
    LANES.forEach(function (lane, j) {
      var n = 34;
      for (var i = 0; i < n; i++) {
        var o = r();
        TRUNK.push({ lane: lane, g: 1.25 * (1 - .55 * (2 * lane - 1) * (2 * lane - 1)), s0: (i + [0, .55, .2, .8, .38][j] + .24 * (r() - .5)) / n,
                     tilt: 40 * (r() - .5), k: o < .38 ? 1 - .25 * r() : o < .76 ? .45 + .3 * r() : 0, spin: (r() - .5) * 26 });
      }
    });

    var LOWC = [];                 /* the small branch's own cells */
    for (var li = 0; li < 11; li++) LOWC.push({ s0: (li + .4 * r()) / 11, tilt: 8 * (r() - .5) });
    /* the length of the artery as the blood sees it, healthy: sets the cells' speed */
    var TOT0 = (function () { var t0 = 0, d6 = 6; for (var xx = 0; xx < XMAX; xx += d6) t0 += mainW(xx + d6 / 2, 0, 0) / LUM0 * d6; return t0; })();
    var V_LODGE = null;
    /* where things are on screen: set by setLayout */
    var lay = { tall: false, f: 17, mL: 146, mR: 150, sH: .92, hx: 0, hy: 0, ySec: 0, vb: null };
    var pan = 0;
    function toScreen(x, y) { return lay.tall ? [y - AR.yA, x - pan + lay.ySec] : [x - pan, y - AR.yA + lay.ySec]; }
    function heartPt(x, y) { return [lay.hx + x * lay.sH, lay.hy + y * lay.sH]; }

    function render(t) {
      var P = depAt(t), C = clotAt(t), Q = flowAt(t), V = volumeAt(t);
      var crack = ease(seg(t, 36, 37.6)), stf = ease(seg(t, 25, 33)), dead = ease(seg(t, 56.5, 63.5));
      var sB = Math.sqrt(Q);
      var i, x;
      stiff.setAttribute('opacity', n1(stf * .92));
      pan = panAt(t); panG.setAttribute('transform', 'translate(' + n1(-pan) + ' 0)');
      var pf = pan / PAN_MAX, rx = BLK[0] + (LODGE[0] - BLK[0]) * pf, ry = BLK[1] + (LODGE[1] - BLK[1]) * pf;
      ringEls.forEach(function (el) { el.setAttribute('cx', n1(rx)); el.setAttribute('cy', n1(ry)); });

      /* the heart: the patch beyond the ring darkens as its supply fails, then turns grey as its cells die;
         the artery beyond the ring darkens as the blood in it stops */
      var isch = clamp01((1 - Q) * 1.05);
      terr.setAttribute('fill', mixc(MUS.isch, MUS.dead, dead));
      terr.setAttribute('opacity', n1(Math.max(.62 * isch, .8 * dead)));
      ladD.setAttribute('opacity', n1(.85 * (1 - sB)));
      var lg = ease(seg(t, LODGE_T, LODGE_T + .8));
      lodge.setAttribute('opacity', n1(lg)); lodgeS.setAttribute('fill', MUS.isch); lodgeS.setAttribute('opacity', n1(.6 * lg * (1 - dead)));

      /* the deposit, under the lining; its surface tears in step 4 */
      var xn = AR.xc + 4;
      function notch(xx) { return crack * (12 * bump((xx - xn) / 17) + 1.8 * Math.sin(xx * 1.9) * bump((xx - xn) / 24)); }
      function top(xx) { return AR.yIel2 - P_(xx, P) + notch(xx); }        /* the deposit's upper surface */
      var dep = '';
      if (P > .4) {
        var x0 = AR.xc - AR.hw, x1 = AR.xc + AR.hw, d = 'M' + x0 + ' ' + AR.yIel2;
        for (x = x0; x <= x1; x += 3) d += ' L' + x + ' ' + n1(top(x));
        d += ' L' + x1 + ' ' + AR.yIel2 + 'Z';
        dep += '<path class="ar__depf" d="' + d + '" fill="url(#' + u + 'dp)"/>';
        /* the fibrous cap under the lining, once the deposit is large */
        var capT = clamp01((P - 24) / 20) * 5;
        if (capT > .2) {
          var gap = 12 * crack, parts = crack > .02 ? [[x0 + 20, xn - gap], [xn + gap, x1 - 20]] : [[x0 + 20, x1 - 20]];
          parts.forEach(function (pr) {
            var a = 'M' + pr[0] + ' ' + n1(top(pr[0])), b = '';
            for (x = pr[0]; x <= pr[1]; x += 3) a += ' L' + n1(x) + ' ' + n1(top(x));
            for (x = pr[1]; x >= pr[0]; x -= 3) b += ' L' + n1(x) + ' ' + n1(top(x) + capT * clamp01(P_(x, P) / 30));
            dep += '<path class="ar__capf" d="' + a + b + 'Z"/>';
          });
        }
        DEP_BITS.forEach(function (bit) {
          var bx = AR.xc + bit.u * AR.hw, th = P_(bx, P);
          if (th < 12 || bit.v * th < 5) return;
          var by = AR.yIel2 - bit.v * th, op = clamp01((th - 12) / 10);
          if (bit.dot) dep += '<circle class="ar__drop" cx="' + n1(bx) + '" cy="' + n1(by) + '" r="' + n1(bit.rr) + '" opacity="' + n1(op) + '"/>';
          else { var ca = Math.cos(bit.a) * bit.l / 2, sa = Math.sin(bit.a) * bit.l / 2 * Math.min(1, th / 50);
            dep += '<path class="ar__xtal" d="M' + n1(bx - ca) + ' ' + n1(by - sa) + ' L' + n1(bx + ca) + ' ' + n1(by + sa) + '" opacity="' + n1(op) + '"/>'; }
        });
      }
      gDep.innerHTML = dep;

      /* the lower lining, lifted by the deposit, torn where the surface breaks */
      var lin = '', gp = 15 * crack;
      function liningPath(a, b) {
        var up = 'M' + n1(a) + ' ' + n1(top(a) - 4), dn = '';
        for (x = a; x <= b; x += 3) up += ' L' + n1(x) + ' ' + n1(top(x) - 4 - (x > xn - 26 && x < xn + 26 ? notch(x) : 0));
        for (x = b; x >= a; x -= 3) dn += ' L' + n1(x) + ' ' + n1(top(x) - (x > xn - 26 && x < xn + 26 ? notch(x) : 0));
        return '<path class="ar__linf" d="' + up + dn + 'Z"/>';
      }
      if (crack > .02) { lin += liningPath(-4, xn - gp) + liningPath(xn + gp, XMAX + 4); }
      else lin += liningPath(-4, XMAX + 4);
      for (x = 8; x < XMAX; x += 24) {
        if (crack > .02 && Math.abs(x - xn) < gp + 5) continue;
        var ly = top(x) - 2 - (Math.abs(x - xn) < 26 ? notch(x) : 0), sl = (top(x + 2) - top(x - 2)) / 4;
        lin += '<ellipse class="ar__enuc2" cx="' + x + '" cy="' + n1(ly) + '" rx="4.4" ry="1.2" transform="rotate(' + n1(Math.atan(sl) * 57.3) + ' ' + x + ' ' + n1(ly) + ')"/>';
      }
      gLin.innerHTML = lin;

      /* the piece's height as it goes: off the clot's surface, down into the lower lanes, then into the middle of the
         small branch */
      function fragY(xx) {
        var x0 = fragX0(), y0 = top(x0) - 10;
        if (xx < 420) return y0 + (188 - y0) * sm01((xx - x0) / (420 - x0));
        var xc2 = Math.max(xx, FORK.x0), yc = carBot(xc2) + wLow(xc2) / 2;
        return 188 + (yc - 188) * sm01((xx - FORK.x0 + 20) / 80);
      }
      /* platelets stick to the torn surface first, then the clot grows on it */
      var clot = '';
      PLT.forEach(function (p) {
        var k = seg(t, p.t0, p.t0 + .8); if (k <= 0) return;
        var px = xn + p.x, py = top(px) - 4 - p.dy - 1.5;
        clot += '<circle class="ar__plt" cx="' + n1(px) + '" cy="' + n1(py) + '" r="2.7" opacity="' + n1(k) + '"/>';
      });
      if (C > .3) {
        /* the clot lies on the lining, and fills the tear down to the deposit */
        var hc = clotHalf(C), cx0 = AR.xk - hc, cx1 = AR.xk + hc, dt2 = '', db = '';
        var cbase = function (xx) { return Math.abs(xx - xn) < gp ? top(xx) + .8 : top(xx) - 4 - (Math.abs(xx - xn) < 26 ? notch(xx) : 0); };
        for (x = cx0; x <= cx1 + .01; x += 2) {
          var ytop = Math.max(AR.yLum, AR.yLum2 - P_(x, P) - C_(x, C));
          if (ytop > AR.yLum + .5) ytop += 1.1 * Math.sin(x * .9 + 2) * clamp01(C_(x, C) / 6);
          dt2 += (dt2 ? ' L' : 'M') + n1(x) + ' ' + n1(Math.min(ytop, cbase(x)));
        }
        for (x = cx1; x >= cx0 - .01; x -= 2) db += ' L' + n1(x) + ' ' + n1(cbase(x));
        clot += '<path class="ar__clotf" d="' + dt2 + db + 'Z" fill="url(#' + u + 'cl)"/>';
        CLOT_BITS.forEach(function (bit) {
          var bx = AR.xk + bit.u * clotHalf(C), th = C_(bx, C), lw = lumenW(bx, P, 0);
          var thick = Math.min(th, lw); if (thick < 7) return;
          var by = top(bx) - 4 - bit.v * thick;
          if (bit.cell) clot += '<ellipse class="ar__ccell" cx="' + n1(bx) + '" cy="' + n1(by) + '" rx="5.6" ry="3.1" transform="rotate(' + n1(bit.a * 57) + ' ' + n1(bx) + ' ' + n1(by) + ')"/>';
          else clot += '<path class="ar__fibr" d="M' + n1(bx - 9 * Math.cos(bit.a)) + ' ' + n1(by - 4 * Math.sin(bit.a)) + ' Q' + n1(bx) + ' ' + n1(by + 3) + ' ' + n1(bx + 9 * Math.cos(bit.a)) + ' ' + n1(by + 4 * Math.sin(bit.a)) + '"/>';
        });
      }
      if (t > FR.tb) {
        var xf = fragX(t), yf = fragY(xf), ang = 220 * sm01((t - FR.tb) / FR.dur);
        clot += '<path class="ar__frag" d="' + FRAG_D + '" fill="url(#' + u + 'cl)" transform="translate(' + n1(xf) + ' ' + n1(yf) + ') rotate(' + n1(ang) + ') scale(' + FRAG_S + ')" opacity="' + n1(Math.min(1, (t - FR.tb) / .15)) + '"/>';
      }
      gClot.innerHTML = clot;

      /* the red blood cells. Each lane carries the same blood per second along its whole length, so
         a cell moves faster where the lumen is narrow; when the lumen closes, every cell stops. Once the
         clot closes the artery, the blood trapped beyond it no longer flows: it gives up its oxygen to the
         muscle around it and is drawn dusky. */
      var NT = 218, dx = XMAX / (NT - 1), TX = [], TT = [0], TW = [];
      for (i = 0; i < NT; i++) { TX.push(i * dx); TW.push(mainW(i * dx, P, C)); }
      for (i = 1; i < NT; i++) TT.push(TT[i - 1] + (TW[i - 1] + TW[i]) / 2 / LUM0 * dx);
      var TOT = TT[NT - 1];
      function xOfTau(tau) {
        var lo = 0, hi = NT - 1;
        if (tau <= 0) return 0; if (tau >= TOT) return XMAX;
        while (hi - lo > 1) { var m = (lo + hi) >> 1; if (TT[m] < tau) lo = m; else hi = m; }
        return TX[lo] + (tau - TT[lo]) / ((TT[hi] - TT[lo]) || 1) * dx;
      }
      var cells = '', v0 = 72 / TOT0, past = AR.xk + AR.hk * .5, trapped = Q < .02, x0w = pan - 24, x1w = pan + AR.W + 24;
      TRUNK.forEach(function (c) {
        var sN = (c.s0 + c.g * V * v0) % 1, xx = xOfTau(sN * TOT); if (xx < x0w || xx > x1w) return;
        var w = mainW(xx, P, C);
        if (w < 4) return;
        /* past the divide the main artery is narrower: its five lanes are fitted into it, none faded */
        var fk = forkK(xx), ln = c.lane + (.18 + .64 * (c.lane - .12) / .76 - c.lane) * fk;
        var yy = AR.yLum + w * ln, slope = (mainW(xx + 2, P, C) - mainW(xx - 2, P, C)) / 4 * ln;
        var room = c.lane === .5 ? clamp01((w - 6) / 4) : (c.lane === .3 || c.lane === .7) ? clamp01((w - 24) / 10) : clamp01((w - 44) / 14);
        if (xx > FORK.x0) room = Math.max(room, fk);
        var op = Math.min(1, xx / 20, (XMAX - xx) / 20, room); if (op <= .02) return;
        var ang = Math.atan(slope) * 57.3 + (c.tilt + c.spin * sN) * (1 - clamp01((LUM0 - w) / 60));
        var set = trapped && xx > past ? 'D' : '';
        cells += '<use href="#' + u + 'rb' + set + (c.k ? 'F' : 'S') + '" transform="translate(' + n1(xx) + ' ' + n1(yy) + ') rotate(' + n1(ang) + ') scale(' + RB + ' ' + n1(RB * (c.k || 1)) + ')" opacity="' + n1(op) + '"/>';
      });
      /* the small branch: its cells squeeze through edge on; they stop when the piece sticks, and beyond it
         the blood, going nowhere, gives up its oxygen and turns dusky */
      if (V_LODGE == null) { V_LODGE = volumeAt(LODGE_T); volumeAt(t); }
      var VL = Math.min(V, V_LODGE), lodgedNow = t >= LODGE_T;
      LOWC.forEach(function (c) {
        var xx = FORK.x0 + 26 + ((c.s0 + .055 * VL) % 1) * (XMAX - FORK.x0 - 20); if (xx < x0w || xx > x1w) return;
        if (lodgedNow && Math.abs(xx - X_LODGE) < 24) return;
        var w = wLow(xx); if (w < 6) return;
        var dusky = t > LODGE_T + .4 && xx > X_LODGE;
        cells += '<use href="#' + u + 'rb' + (dusky ? 'D' : '') + 'S" transform="translate(' + n1(xx) + ' ' + n1(carBot(xx) + w / 2) + ') rotate(' + n1(c.tilt) + ') scale(1.15)" opacity="' + n1(Math.min(1, (xx - FORK.x0 - 20) / 20)) + '"/>';
      });
      gCells.innerHTML = cells;

      /* labels, in the margins, leaders ruled level: the heart's first, then the artery's */
      var hItems = [], aItems = [], vb = lay.vb, f = lay.f;
      function addA(id, text, mx, my, side, op) {
        if (mx < pan + 6 || mx > pan + AR.W - 6) return;             /* out of the window */
        var p = toScreen(mx, my); aItems.push({ id: id, text: text, x: p[0], y: p[1], side: side, op: op == null ? 1 : op });
      }
      function addH(id, text, hxp, hyp, side, op) { var p = heartPt(hxp, hyp); hItems.push({ id: id, text: text, x: p[0], y: p[1], side: side, op: op == null ? 1 : op }); }
      addH('aorta', 'aorta', 86, 62, 'L');
      addH('cor', 'coronary artery', 181, 171, 'L');
      addH('ring', pf > .5 ? 'a small branch, cut open below' : 'cut open below', rx + BLK_R, ry, 'R');
      if (lg > .05 && t < 48.5 && pf < .5) addH('lodge', 'a piece of clot blocks a small branch', LODGE[0] + 2, LODGE[1], 'R', Math.min(lg, clamp01((48.5 - t) / 1.5)));
      var tOp = clamp01(Math.max(isch * 2.5, dead));
      if (tOp > .02) addH('terr', 'heart muscle beyond the blockage', 222, 292, 'R', tOp);
      /* the wall, the lining and the lumen are the same all along: named on the right, near the end; the deposit
         and the clot on the left (Daniel, 27 Sep: every name on the left side was cluttered). A phone keeps
         its own sides. */
      var xp = AR.xc + (lay.tall ? 26 : -62), xk = AR.xc + (lay.tall ? -20 : -28);
      if (pf <= .5) {           /* down at the branch, the names are the branch, the piece and the lumen */
        addA('wall', 'wall of artery', (lay.tall ? 24 : 610) + pan, (AR.yMed + AR.yIel) / 2, lay.tall ? 'L' : 'R');
        addA('lining', 'lining', (lay.tall ? 64 : 610) + pan, AR.yLum - 2, lay.tall ? 'L' : 'R');
      }
      addA('lumen', 'lumen', (lay.tall ? 104 : 610) + pan, lay.tall ? 148 : 124, lay.tall ? 'L' : 'R');
      if (pf > .5) {
        var xb = X_LODGE - 150;
        addA('branch', 'a smaller branch', xb, carBot(xb) + wLow(xb) / 2, lay.tall ? 'R' : 'L', clamp01((pf - .5) * 4));
        if (t > FR.tb) { var xq = fragX(t); addA('piece', 'a piece of the clot', xq + 10, fragY(xq), 'R', clamp01((pf - .5) * 4)); }
      }
      var pth = P_(xp, P); if (pth > 5) addA('dep', 'fatty deposit (plaque)', xp, AR.yIel2 - pth / 2 + 1, lay.tall ? 'R' : 'L', clamp01((pth - 5) / 6));
      var cth = Math.min(C_(xk, C), lumenW(xk, P, 0)), cbot = top(xk) - 4;
      if (cth > 5) addA('clot', 'blood clot', xk, cbot - cth / 2, lay.tall ? 'R' : 'L', clamp01((cth - 5) / 5));
      var hTop = vb.y + 6, hBot = lay.ySec - 8, aTop = lay.ySec + 4, aBot = vb.y + vb.h - 6;
      /* while the view follows the piece of clot, it says so: extension, and less common */
      var pillOp = clamp01((pf - .3) * 3), pill2 = '';
      if (pillOp > .02) {
        var pfz = f * .72, ptx = 'EXTENSION \u00b7 LESS COMMON', pw = ptx.length * pfz * .64 + 18, py0 = lay.ySec + (lay.tall ? 8 : 10);
        pill2 = '<g class="ar__extpill" opacity="' + n1(pillOp) + '"><rect x="10" y="' + n1(py0) + '" width="' + n1(pw) + '" height="' + n1(pfz * 1.7) + '" rx="' + n1(pfz * .85) + '"/>' +
          '<text x="' + n1(10 + pw / 2) + '" y="' + n1(py0 + pfz * 1.18) + '" text-anchor="middle" style="font-size:' + n1(pfz) + 'px">' + ptx + '</text></g>';
      }
      gLab.innerHTML = pill2 +
        L.labels({ items: hItems.filter(function (q) { return q.side === 'L'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mL - 26, top: hTop, bottom: hBot, gap: 5 }) +
        L.labels({ items: hItems.filter(function (q) { return q.side === 'R'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mR - 26, top: hTop, bottom: hBot, gap: 5 }) +
        L.labels({ items: aItems.filter(function (q) { return q.side === 'L'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mL - 26, top: aTop, bottom: aBot, gap: 5 }) +
        L.labels({ items: aItems.filter(function (q) { return q.side === 'R'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mR - 26, top: aTop, bottom: aBot, gap: 5 });

      /* the read-outs above the drawing */
      var when = t < 12 ? 'at the start' : t < 22 ? 'over many years' : t < 35 ? 'over more years' : t < 46 ? 'suddenly' : t < 55 ? 'within minutes' : '20 to 40 minutes later';
      var flow = Q > .97 ? ['normal', 'ok'] : Q > .02 ? ['less', 'warn'] : ['none past the clot', 'bad'];
      var mus = dead > .05 ? ['cells die', 'bad'] : Q < .02 ? ['no oxygen, no glucose', 'bad'] : Q < .97 ? ['less oxygen', 'warn'] : ['oxygen and glucose', 'ok'];
      pill('when', when, 'plain'); pill('flow', flow[0], flow[1]); pill('mus', mus[0], mus[1]);
    }
    function pill(k, text, cls) {
      var p = read.querySelector('[data-k="' + k + '"]'), i = p.querySelector('i');
      if (i.textContent !== text) i.textContent = text;
      p.className = 'ar__pill is-' + cls;
    }

    var R = [0, 16, 28, 43.5, 51.5, 64, 75, 87], M = [0, 12, 22, 35, 40, 46, 55, AR_END], clock = readerClock(R, M);
    var sp = L.stepper({ steps: readerSteps(AR_STEPS, R), end: R[R.length - 1], render: function (t) { render(clock(t)); } });
    box.appendChild(sp.bar);
    var wrap = h('div', 'ar__wrap');
    /* on a wide screen the drawing stands in the plate's column; its read-outs and the steps stay here */
    var pack = h('div', 'ar__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'Inside a coronary artery')); packT.hidden = true;
    pack.appendChild(packT); pack.appendChild(fig);
    var left = h('div', 'ar__left'); left.appendChild(read); left.appendChild(pack);
    fig.appendChild(sp.now);
    wrap.appendChild(left); wrap.appendChild(sp.list);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note', 'Not to scale: the red blood cells are drawn hundreds of times larger than real, and far fewer. Time is squeezed: a deposit grows over years, a clot forms in minutes, and heart muscle cells die after 20 to 40 minutes without blood. Heart: Servier Medical Art, CC BY 4.0.'));
    box.appendChild(h('p', 'widget__note ar__fence', '<b>Not asked in 0610.</b> Step 5 is extension: in most heart attacks the clot blocks the artery where it forms, as in step 6. “Plaque” and “atheroma” are other names for the fatty deposit; the chest pain of step 3 is angina; a heart attack is also called a myocardial infarction.'));

    /* the layout: the heart above, the artery below; the artery turned on its side on a narrow screen;
       lettering at least 13 px on screen */
    var HT = global.CHD_HEART || { w: 275, h: 348 };
    function setLayout(D, ww) {
      var tall = (ww || D) < 440;
      var aw = tall ? AR.yB - AR.yA : AR.W, ah = tall ? AR.W : AR.yB - AR.yA;
      var sH = tall ? Math.min(.9, (aw + 40) / HT.w) : 1.45;      /* wide: the heart as tall as the column allows */
      var hw = HT.w * sH, hh = HT.h * sH;
      var ft = fitType(D, aw, 8, 9, tall ? 104 : 146, tall ? 104 : 150, 13);
      var ySec = hh + 24, bw = aw, bh = ySec + ah;
      var padT = 12, padB = 14;
      var vb = { x: -ft.mL, y: -padT, w: bw + ft.mL + ft.mR, h: bh + padT + padB, bw: bw, bh: bh };
      lay = { tall: tall, f: ft.f, mL: ft.mL, mR: ft.mR, sH: sH, hx: bw / 2 - hw / 2, hy: 0, ySec: ySec, vb: vb };
      svg.setAttribute('viewBox', n1(vb.x) + ' ' + n1(vb.y) + ' ' + n1(vb.w) + ' ' + n1(vb.h));
      bg.setAttribute('x', n1(vb.x)); bg.setAttribute('y', n1(vb.y)); bg.setAttribute('width', n1(vb.w)); bg.setAttribute('height', n1(vb.h)); bg.setAttribute('rx', 18);
      gHeart.setAttribute('transform', 'translate(' + n1(lay.hx) + ' ' + n1(lay.hy) + ') scale(' + n1(sH * 1000) / 1000 + ')');
      model.setAttribute('transform', tall ? 'matrix(0 1 1 0 ' + (-AR.yA) + ' ' + n1(ySec) + ')' : 'translate(0 ' + n1(ySec - AR.yA) + ')');
      box.classList.toggle('ar--tall', tall);
    }
    var lastD = 0;
    function fit() {
      var ww = wrap.getBoundingClientRect().width; if (!ww) return;
      wrap.classList.toggle('ar--side', ww >= 980);
      var D = fig.getBoundingClientRect().width; if (!D || (Math.abs(D - lastD) < 2 && (ww < 440) === box.classList.contains('ar--tall'))) return;
      lastD = D; setLayout(D, ww); sp.paint(sp.time());
    }
    setLayout(700);
    /* laid out a frame later: a layout changed inside the observer's own callback makes the browser
       report a "ResizeObserver loop" */
    var roF = 0;
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } if (!roF) roF = global.requestAnimationFrame(function () { roF = 0; fit(); }); }) : null;
    if (ro) { ro.observe(wrap); ro.observe(fig); }
    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: left, watch: function () { return box; },
      onPlace: function (inColumn) { packT.hidden = !inColumn; box.classList.toggle('ar--staged', inColumn); sp.compact(inColumn); lastD = 0; fit(); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); if (stg) stg.detach(); };
    box.__seek = function (t) { fit(); return sp.seek(t); };
    sp.paint(0);
    return box;
  }

  /* ================================================================
     profiles — who is most at risk?
     ================================================================ */
  /* The six people of the 9.2 worksheet, shortened. `risk` is what the page counts, from the
     0610 list; `why` explains the few that need a decision. The worksheet gives no sex: it is
     taken from the names. */
  var PEOPLE = [
    { id: 'john', name: 'John', age: 52, sex: 'man',
      f: { diet: 'often eats fast food, high in saturated fat', exercise: 'walks now and then, but sits at a desk all day at work', smoking: 'one pack a day, for the last 30 years', stress: 'a high-stress job, and irregular sleep', genetics: 'both parents had heart disease in their 50s', alcohol: 'drinks moderately, 2–3 times a week' },
      risk: { age: 1, sex: 1, diet: 1, exercise: 1, smoking: 1, stress: 1, genetics: 1 }, why: {} },
    { id: 'anna', name: 'Anna', age: 47, sex: 'woman',
      f: { diet: 'balanced: fruit, vegetables and lean protein', exercise: 'gym 3 times a week (cardio and weights)', smoking: 'non-smoker', stress: 'now and then, and she manages it with meditation', genetics: 'no family history of heart disease', alcohol: 'a social drinker, 1–2 times a month' },
      risk: {}, why: { age: 'Not counted: for a woman, age counts from 55.', stress: 'Not counted: it is not often, and she manages it.' } },
    { id: 'james', name: 'James', age: 63, sex: 'man',
      f: { diet: 'unhealthy: processed food and red meat', exercise: 'rarely exercises, and sits most of the day', smoking: 'a former smoker: he does not smoke now', stress: 'high stress from managing money and caring for his family', genetics: 'heart disease in his family', alcohol: 'drinks heavily at weekends' },
      risk: { age: 1, sex: 1, diet: 1, exercise: 1, stress: 1, genetics: 1 }, why: { smoking: 'Not counted: he has stopped, and the risk falls after stopping.' } },
    { id: 'lucy', name: 'Lucy', age: 35, sex: 'woman',
      f: { diet: 'vegan, with some processed vegan treats', exercise: 'very active: yoga and cycling every day', smoking: 'has never smoked', stress: 'manages it well with exercise and relaxation', genetics: 'her mother had a heart attack at the age of 45', alcohol: 'wine at weekends, 3–4 glasses a week' },
      risk: { genetics: 1 }, why: { genetics: 'Counted: a parent had heart disease at a young age.' } },
    { id: 'david', name: 'David', age: 55, sex: 'man',
      f: { diet: 'low in carbohydrate, high in protein, with a lot of red meat', exercise: 'plays golf once a week', smoking: 'smokes now and then, at social events', stress: 'moderate, and he manages it with hobbies and friends', genetics: 'no family history of heart disease', alcohol: 'beer every day, 2–3 drinks an evening' },
      risk: { age: 1, sex: 1, diet: 1, exercise: 1, smoking: 1 }, why: { exercise: 'Counted: once a week is not enough exercise.', smoking: 'Counted: even a few cigarettes raise the risk.', stress: 'Not counted: it is moderate, and he manages it.' } },
    { id: 'samantha', name: 'Samantha', age: 40, sex: 'woman',
      f: { diet: 'Mediterranean: fruit, vegetables, fish and olive oil', exercise: 'runs 3 times a week', smoking: 'has never smoked', stress: 'moderate stress at work, and she practises mindfulness and yoga', genetics: 'no family history of heart disease', alcohol: 'wine now and then, 1–2 times a month' },
      risk: {}, why: { stress: 'Not counted: it is moderate, and she manages it.' } }
  ];
  var ROWS = [['age', 'Age'], ['sex', 'Sex'], ['diet', 'Diet'], ['exercise', 'Exercise'], ['smoking', 'Smoking'], ['stress', 'Stress'], ['genetics', 'Genetics'], ['alcohol', 'Alcohol']];
  var FACTORS = ['age', 'sex', 'diet', 'exercise', 'smoking', 'stress', 'genetics'];
  var CAN = { diet: 1, exercise: 1, smoking: 1, stress: 1 };
  var NAMEOF = { age: 'age', sex: 'sex', diet: 'diet', exercise: 'lack of exercise', smoking: 'smoking', stress: 'stress', genetics: 'genetics' };
  /* each person's picture from the 9.2 worksheet (AI-made for the lesson; Daniel, 27 Sep: "the images helped a
     lot identifying who was who") */
  function portrait(id) {
    var b = 'assets/photos/chd-' + id + '-900';
    return '<picture><source type="image/webp" srcset="' + b + '.webp"><img class="pf__av pf__av--ph" src="' + b + '.jpg" width="240" height="240" alt="" loading="lazy" decoding="async"></picture>';
  }

  function countOf(p) { var n = 0; FACTORS.forEach(function (k) { if (p.risk[k]) n++; }); return n; }
  function nth(n) { return n + (n % 10 === 1 && n !== 11 ? 'st' : n % 10 === 2 && n !== 12 ? 'nd' : n % 10 === 3 && n !== 13 ? 'rd' : 'th'); }
  function listWords(a) { return a.length < 2 ? a.join('') : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]; }

  function profiles(spec) {
    var u = 'pf' + (++UID);
    var box = h('div', 'widget pf');
    box.appendChild(L.head(spec.title || 'Who is most at risk?', spec.ask, 'Try it'));
    box.appendChild(h('p', 'pf__how', 'Put the six people in order: the <b>highest risk at the top</b>. Drag a card by its handle, or use its arrow buttons.'));
    var live = h('p', 'pf__live'); live.setAttribute('aria-live', 'polite');
    var list = h('ol', 'pf__list'); list.setAttribute('aria-label', 'Your order, from the highest risk to the lowest');
    var byId = {}, checked = false, split = false;

    PEOPLE.forEach(function (p) {
      var li = h('li', 'pf__card'); li.setAttribute('data-id', p.id);
      var facts = ROWS.map(function (rw) {
        var x = rw[0] === 'alcohol';
        return '<div class="pf__f' + (x ? ' pf__f--x' : '') + '" data-k="' + rw[0] + '"><dt>' + rw[1] + '</dt><dd>' + esc(rw[0] === 'age' ? p.age + ' years old' : rw[0] === 'sex' ? p.sex : p.f[rw[0]]) +
          (x ? ' <span class="pf__no">not in the 0610 list</span>' : '') + '<span class="pf__why" hidden></span></dd></div>';
      }).join('');
      li.innerHTML =
        '<div class="pf__ctl"><button type="button" class="pf__mv" data-d="-1" aria-label="Move ' + p.name + ' up">▲</button>' +
        '<span class="pf__num" aria-hidden="true"></span>' +
        '<button type="button" class="pf__mv" data-d="1" aria-label="Move ' + p.name + ' down">▼</button></div>' +
        '<div class="pf__grip" aria-hidden="true"><i></i></div>' +
        '<div class="pf__who">' + portrait(p.id) + '<div class="pf__id"><b class="pf__name">' + p.name + '</b></div></div>' +
        '<dl class="pf__facts">' + facts + '</dl>' +
        '<div class="pf__out" hidden></div>';
      byId[p.id] = { p: p, li: li };
      list.appendChild(li);
    });
    function order() { return Array.prototype.map.call(list.children, function (li) { return li.getAttribute('data-id'); }); }
    function renumber() {
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.querySelector('.pf__num').textContent = i + 1;
        var b = li.querySelectorAll('.pf__mv');
        b[0].disabled = i === 0; b[1].disabled = i === list.children.length - 1;
      });
      if (checked) mark();
    }
    function move(li, d, focusBtn) {
      var kids = Array.prototype.slice.call(list.children), i = kids.indexOf(li), j = i + d;
      if (j < 0 || j >= kids.length) return;
      if (d < 0) list.insertBefore(li, kids[j]); else list.insertBefore(li, kids[j].nextSibling);
      renumber();
      var nm = byId[li.getAttribute('data-id')].p.name;
      live.textContent = nm + ' is now number ' + (j + 1) + ' of 6.';
      if (focusBtn) { var b = li.querySelector('.pf__mv[data-d="' + d + '"]'); if (b.disabled) b = li.querySelector('.pf__mv[data-d="' + (-d) + '"]'); b.focus(); }
    }
    list.addEventListener('click', function (e) {
      var b = e.target.closest ? e.target.closest('.pf__mv') : null; if (!b || b.disabled) return;
      move(b.closest('.pf__card'), +b.getAttribute('data-d'), true);
    });

    /* drag by the handle: pointer events, so a finger works as well as a mouse */
    var drag = null;
    list.addEventListener('pointerdown', function (e) {
      var g = e.target.closest ? e.target.closest('.pf__grip') : null; if (!g || (e.button != null && e.button !== 0)) return;
      var li = g.closest('.pf__card'), items = Array.prototype.slice.call(list.children);
      drag = { li: li, pid: e.pointerId, y0: e.clientY, items: items, rects: items.map(function (x) { return x.getBoundingClientRect(); }), from: items.indexOf(li), to: items.indexOf(li) };
      var gapPx = items.length > 1 ? drag.rects[1].top - drag.rects[0].bottom : 8;
      drag.gap = gapPx > 0 ? gapPx : 8;
      try { g.setPointerCapture(e.pointerId); } catch (err) { /* not every browser */ }
      li.classList.add('is-drag'); list.classList.add('is-dragging');
      e.preventDefault();
    });
    list.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.pid) return;
      var dy = e.clientY - drag.y0, r0 = drag.rects[drag.from], mid = r0.top + r0.height / 2 + dy, to = 0;
      drag.li.style.transform = 'translateY(' + dy + 'px)';
      drag.items.forEach(function (it, i) { if (i !== drag.from && drag.rects[i].top + drag.rects[i].height / 2 < mid) to++; });
      drag.to = to;
      var sh = r0.height + drag.gap;
      drag.items.forEach(function (it, i) {
        if (i === drag.from) return;
        var s = drag.from < to && i > drag.from && i <= to ? -sh : drag.from > to && i >= to && i < drag.from ? sh : 0;
        it.style.transform = s ? 'translateY(' + s + 'px)' : '';
      });
    });
    function endDrag() {
      if (!drag) return;
      var d = drag; drag = null;
      d.items.forEach(function (it) { it.style.transform = ''; });
      d.li.classList.remove('is-drag'); list.classList.remove('is-dragging');
      if (d.to !== d.from) {
        var rest = d.items.filter(function (x) { return x !== d.li; });
        list.insertBefore(d.li, rest[d.to] || null);
        renumber();
        live.textContent = byId[d.li.getAttribute('data-id')].p.name + ' is now number ' + (d.to + 1) + ' of 6.';
      }
    }
    list.addEventListener('pointerup', endDrag);
    list.addEventListener('pointercancel', endDrag);
    list.addEventListener('lostpointercapture', endDrag);

    var btns = h('div', 'pf__btns');
    var bCheck = h('button', 'wbtn pf__check', 'Check'); bCheck.type = 'button';
    bCheck.setAttribute('data-tip', 'Marks every risk factor from the 0610 list on each card, and counts them.');
    var bSplit = h('button', 'wbtn pf__split', 'Which can they change?'); bSplit.type = 'button'; bSplit.disabled = true;
    bSplit.setAttribute('data-tip', 'Splits each person’s risk factors: those they can change, and those they cannot.');
    btns.appendChild(bCheck); btns.appendChild(bSplit);
    var result = h('div', 'pf__result'); result.setAttribute('aria-live', 'polite');

    var counts = {}; PEOPLE.forEach(function (p) { counts[p.id] = countOf(p); });
    function range(id) {
      var c = counts[id], hi = 0, lo = 1;
      PEOPLE.forEach(function (q) { if (counts[q.id] > c) lo++; if (counts[q.id] >= c) hi++; });
      return [lo, hi];
    }
    var byCount = PEOPLE.slice().sort(function (a, b) { return counts[b.id] - counts[a.id]; });

    function mark() {
      var ord = order(), off = [];
      ord.forEach(function (id, i) {
        var o = byId[id], p = o.p, li = o.li, n = counts[id], rg = range(id), ok = i + 1 >= rg[0] && i + 1 <= rg[1];
        if (!ok) off.push(p.name);
        ROWS.forEach(function (rw) {
          var row = li.querySelector('.pf__f[data-k="' + rw[0] + '"]'), yes = !!p.risk[rw[0]];
          row.classList.toggle('is-risk', yes);
          row.classList.toggle('is-can', split && yes && !!CAN[rw[0]]);
          row.classList.toggle('is-cannot', split && yes && !CAN[rw[0]]);
          var chip = row.querySelector('.pf__chip');
          if (yes) { if (!chip) { chip = h('span', 'pf__chip'); var dd = row.querySelector('dd'); dd.insertBefore(chip, dd.querySelector('.pf__why')); } chip.textContent = split ? (CAN[rw[0]] ? 'can change' : 'cannot change') : 'risk factor'; }
          else if (chip) chip.parentNode.removeChild(chip);
          var why = row.querySelector('.pf__why'), wt = p.why[rw[0]];
          if (wt) { why.textContent = wt; why.hidden = false; } else why.hidden = true;
        });
        var out = li.querySelector('.pf__out');
        var can = [], cannot = [];
        FACTORS.forEach(function (k) { if (p.risk[k]) (CAN[k] ? can : cannot).push(NAMEOF[k]); });
        out.innerHTML = '<span class="pf__count">' + (n === 0 ? 'no risk factors' : n === 1 ? '1 risk factor' : n + ' risk factors') + '</span>' +
          '<span class="pf__pos' + (ok ? ' is-ok' : ' is-off') + '">' + (ok ? 'same place as the count' : 'the count puts ' + (p.sex === 'man' ? 'him' : 'her') + ' ' + (rg[0] === rg[1] ? nth(rg[0]) : nth(rg[0]) + ' or ' + nth(rg[1]))) + '</span>' +
          (split ? '<span class="pf__cc"><b>Can change:</b> ' + (can.length ? listWords(can) : 'none') + '. <b>Cannot change:</b> ' + (cannot.length ? listWords(cannot) : 'none') + '.</span>' : '');
        out.hidden = false;
      });
      var seq = [], k = 0;
      while (k < byCount.length) {
        var j = k; while (j + 1 < byCount.length && counts[byCount[j + 1].id] === counts[byCount[k].id]) j++;
        var names = byCount.slice(k, j + 1).map(function (p) { return p.name; });
        seq.push(names.length > 1 ? listWords(names) + ' (' + counts[byCount[k].id] + ' each, a tie)' : names[0] + ' (' + counts[byCount[k].id] + ')');
        k = j + 1;
      }
      result.innerHTML =
        '<p><b>Risk factors from the 0610 list are marked in red.</b> Age counts from 45 for a man and from 55 for a woman. Men have a higher risk than women of the same age. Alcohol is not in the 0610 list, so it is not counted.</p>' +
        '<p><b>Most to fewest risk factors:</b> ' + seq.join(', ') + '.</p>' +
        '<p class="pf__verdict ' + (off.length ? 'is-off' : 'is-ok') + '">' + (off.length ? 'Your order is different from the count for ' + listWords(off) + '.' : 'Your order is the same as the count.') + '</p>' +
        '<p>Real risk is not a simple count. Some factors raise the risk more than others, and each one can be small or large: a cigarette at a party is not the same as a pack a day. So the page accepts any order within a tie, and asks you to justify your order.</p>' +
        (split ? '<p><b>Diet, exercise, smoking and stress can be changed. Age, sex and genetics cannot.</b> A person can reduce their risk only through the factors they can change.</p>' : '');
    }
    bCheck.addEventListener('click', function () { checked = true; bSplit.disabled = false; box.classList.add('is-checked'); mark(); });
    bSplit.addEventListener('click', function () { split = true; box.classList.add('is-split'); bSplit.setAttribute('aria-pressed', 'true'); mark(); });

    var frame = h('div', 'pf__frame',
      '<p class="pf__fh">Write your answer</p>' +
      '<p class="pf__fs"><span class="pf__bl">………</span> is most at risk because <span class="pf__bl">………</span>. <span class="pf__bl">………</span> can reduce their risk by <span class="pf__bl">………</span>.</p>' +
      '<label class="pf__lab" for="' + u + '-ta">Your answer (it is not saved)</label>' +
      '<textarea id="' + u + '-ta" class="pf__ta" rows="4" placeholder="… is most at risk because … . … can reduce their risk by … ."></textarea>' +
      '<p class="pf__bank"><b>Words you can use:</b> a diet high in saturated fat · lack of exercise · smoking · stress · genetic predisposition · age · sex · eating less saturated fat and salt · exercising regularly · stopping smoking · reducing stress</p>');

    box.appendChild(list);
    box.appendChild(live);
    box.appendChild(btns);
    box.appendChild(result);
    box.appendChild(frame);
    box.appendChild(h('p', 'widget__note', 'John, Anna, James, Lucy, David and Samantha are the fictional people of the lesson worksheet. The worksheet does not give their sex, so the page takes it from their names. Each factor here is only counted or not counted; in real life each one can be small or large.'));
    renumber();
    /* the card's own width decides its layout, not the window's */
    var ro = global.ResizeObserver ? new ResizeObserver(function () {
      if (!box.isConnected) { ro.disconnect(); return; }
      global.requestAnimationFrame(function () {
        var w = list.getBoundingClientRect().width; if (w) box.classList.toggle('pf--narrow', w < 560);
      });
    }) : null;
    if (ro) ro.observe(list);
    box.__onReset = function () { drag = null; if (ro) ro.disconnect(); };
    return box;
  }

  L.add('artery', artery);
  L.add('profiles', profiles);
})(window);
