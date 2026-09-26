/* ============================================================
   w-chd.js — coronary heart disease: the two widgets of the station `chd` (0610 9.2).

     artery    "Inside a coronary artery". One coronary artery, cut along its length, lying on
               the patch of heart muscle it supplies. Six steps, each held until "Next step":
               a healthy artery; fatty material builds up in the wall, under the lining; the
               deposit grows and the lumen narrows; its surface breaks and a blood clot forms on
               it; the clot blocks the artery; the heart muscle beyond the blockage dies. Red
               blood cells move with the blood: fewer pass each second as the lumen narrows,
               they move faster through the narrow part (the same blood through a smaller gap),
               and they stop when the artery is blocked. The colour of the heart muscle shows
               how well it is supplied. Drive it with the lab's step player (js/w-common.js):
               Play, Next step, Play all; box.__seek(t) draws any moment.
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
  /* The model, in its own units (about 34 units to the millimetre for the artery):
     the artery runs left to right across the top, blood entering from the aorta on the left;
     the heart muscle lies below it. On a narrow screen the whole model is turned on its side
     (x and y swapped), so the artery runs down the page and the labels have room either side. */
  var AR = {
    W: 660, H: 440,
    yOut: 46, yMed: 58, yIel: 86, yLum: 90,           /* upper wall, outside in: adventitia, media, internal elastic lamina, lining */
    yLum2: 206, yIel2: 210, yMed2: 238, yOut2: 250,    /* lower wall, inside out, before any deposit */
    yFat: 262,                                          /* the heart muscle starts here */
    xc: 190, hw: 92,                                    /* the fatty deposit: centre and half-length */
    xk: 196, hk: 64                                     /* the clot: centre and half-length */
  };
  var LUM0 = AR.yLum2 - AR.yLum;                        /* 116: the lumen of the healthy artery */
  function bump(u) { return u <= -1 || u >= 1 ? 0 : (1 - u * u) * (1 - u * u); }
  function bumpFlat(u) { if (u <= -1 || u >= 1) return 0; var q = 1 - u * u * u * u; return q * q; }

  var AR_STEPS = [
    { t: 0,  h: 'A healthy coronary artery', p: 'You are looking at a coronary artery, cut along its length. It lies on the surface of the heart. Its lining is smooth and its lumen is wide, so blood flows freely. The blood brings oxygen and glucose to the heart muscle.' },
    { t: 12, h: 'Fatty material builds up in the wall', p: 'Over many years, fatty material containing cholesterol builds up in the wall of the artery, under the lining. At first the fatty deposit is small, and blood still flows freely.' },
    { t: 22, h: 'The lumen becomes narrower', p: 'The fatty deposit grows over more years. It bulges into the lumen, so the lumen becomes narrower and less blood can flow through it. The wall there is less elastic. During exercise, the heart muscle beyond the narrow part may not receive enough oxygen.' },
    { t: 35, h: 'A blood clot forms', p: 'The surface of the fatty deposit becomes rough and breaks. Platelets stick to the rough surface, and a blood clot forms on it.' },
    { t: 43, h: 'The clot blocks the artery', p: 'The clot grows until it blocks the artery completely. No blood can flow past it. The heart muscle beyond the blockage receives no oxygen and no glucose.' },
    { t: 52, h: 'Heart muscle cells die: a heart attack', p: 'Without oxygen, the heart muscle beyond the blockage cannot respire aerobically, so it cannot contract. Its cells die. This is a heart attack. The muscle before the blockage still receives blood.' }
  ];
  var AR_END = 63;

  /* the state of the artery at time t */
  function depAt(t) {      /* the deposit's thickness at its centre */
    if (t < 13) return 0;
    if (t < 22.5) return 18 * ease(seg(t, 13, 20.5));
    return 18 + 64 * ease(seg(t, 23, 32.5));
  }
  function clotAt(t) {     /* the clot's thickness at its centre */
    if (t < 38.4) return 0;
    if (t < 43.2) return 16 * ease(seg(t, 38.4, 42.4));
    return 16 + 54 * ease(seg(t, 43.6, 49.5));
  }
  function P_(x, P) { return P * bump((x - AR.xc) / AR.hw); }
  function clotHalf(C) { return 16 + (AR.hk - 16) * clamp01(C / 40); }
  function C_(x, C) { return C * bumpFlat((x - AR.xk) / clotHalf(C)); }
  function lumenW(x, P, C) { return Math.max(0, AR.yLum2 - P_(x, P) - C_(x, C) - AR.yLum); }
  function narrowest(P, C) { var m = LUM0; for (var x = 150; x <= 240; x += 5) m = Math.min(m, lumenW(x, P, C)); return m; }
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

  /* branches of the artery that dive into the heart muscle: A before the deposit, B beyond it */
  var BR = [
    { k: 'A', main: [[26, 198], [27, 232], [31, 262], [40, 296]], subs: [[[40, 296], [22, 330], [10, 366], [2, 404]], [[40, 296], [66, 334], [92, 370], [112, 410]]] },
    { k: 'B', main: [[340, 198], [341, 232], [338, 262], [330, 296]], subs: [[[330, 296], [296, 322], [262, 350], [226, 388]], [[330, 296], [356, 336], [380, 376], [396, 418]]] },
    { k: 'B', main: [[452, 198], [453, 232], [456, 262], [462, 298]], subs: [[[462, 298], [440, 338], [428, 380], [430, 424]], [[462, 298], [492, 334], [520, 372], [540, 414]]] },
    { k: 'B', main: [[564, 198], [565, 232], [568, 262], [576, 296]], subs: [[[576, 296], [556, 340], [540, 384], [530, 426]], [[576, 296], [606, 332], [634, 366], [664, 398]]] }
  ];
  function ptsD(p) { return 'M' + p.map(function (q) { return n1(q[0]) + ' ' + n1(q[1]); }).join(' L'); }
  function sample(pts) {
    var out = [[pts[0][0], pts[0][1]]], len = [0];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.sqrt((b[0] - a[0]) * (b[0] - a[0]) + (b[1] - a[1]) * (b[1] - a[1])), n = Math.max(1, Math.ceil(d / 4));
      for (var k = 1; k <= n; k++) { out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); len.push(len[len.length - 1] + d / n); }
    }
    return { pts: out, len: len, total: len[len.length - 1] };
  }
  function at(P, s) {
    var lo = 0, hi = P.len.length - 1;
    if (s <= 0) return P.pts[0]; if (s >= P.total) return P.pts[hi];
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P.len[m] < s) lo = m; else hi = m; }
    var u = (s - P.len[lo]) / ((P.len[hi] - P.len[lo]) || 1);
    return [P.pts[lo][0] + (P.pts[hi][0] - P.pts[lo][0]) * u, P.pts[lo][1] + (P.pts[hi][1] - P.pts[lo][1]) * u];
  }
  var BR_PATHS = [];
  BR.forEach(function (b) { b.subs.forEach(function (s) { BR_PATHS.push({ k: b.k, s: sample(b.main.concat(s.slice(1))) }); }); });

  var MUS = { ok: '#B4453F', isch: '#6B3A4E', dead: '#A99583' };

  /* everything that never moves: built once */
  function arStatic(u) {
    var W = AR.W, H = AR.H, r = rng(7), s = '', i, x, y, d;
    s += '<defs>' +
      '<linearGradient id="' + u + 'mg" gradientUnits="userSpaceOnUse" x1="120" y1="0" x2="200" y2="0"><stop offset="0" class="ar__ma" stop-color="' + MUS.ok + '"/><stop offset="1" class="ar__mb" stop-color="' + MUS.ok + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'ms" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>' +
      '<linearGradient id="' + u + 'lu" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9C2229"/><stop offset=".5" stop-color="#B92F33"/><stop offset="1" stop-color="#9C2229"/></linearGradient>' +
      '<linearGradient id="' + u + 'dp" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F1D47E"/><stop offset="1" stop-color="#D3A244"/></linearGradient>' +
      '<linearGradient id="' + u + 'cl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#8E1E2A"/><stop offset="1" stop-color="#5C111A"/></linearGradient>' +
      '<linearGradient id="' + u + 'sf" gradientUnits="userSpaceOnUse" x1="' + (AR.xc - AR.hw) + '" y1="0" x2="' + (AR.xc + AR.hw) + '" y2="0"><stop offset="0" stop-color="#B7675D" stop-opacity="0"/><stop offset=".28" stop-color="#B7675D"/><stop offset=".72" stop-color="#B7675D"/><stop offset="1" stop-color="#B7675D" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + u + 'm1" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A9564C"/><stop offset="1" stop-color="#C7766A"/></linearGradient>' +
      '<linearGradient id="' + u + 'm2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C7766A"/><stop offset="1" stop-color="#A9564C"/></linearGradient>' +
      '<clipPath id="' + u + 'cp"><rect class="ar__cr" x="0" y="0" width="' + W + '" height="' + H + '"/></clipPath>' +
      '</defs>';
    /* the heart muscle: its colour shows its supply; fibres run across, striated, with central nuclei */
    s += '<rect class="ar__mus" x="-4" y="' + AR.yFat + '" width="' + (W + 8) + '" height="' + (H - AR.yFat + 4) + '" fill="url(#' + u + 'mg)"/>';
    var fib = '';
    for (y = AR.yFat + 7; y < H + 4; y += 7.5) {
      d = 'M-6 ' + n1(y);
      for (x = 0; x <= W + 40; x += 30) d += ' L' + x + ' ' + n1(y + 1.4 * Math.sin(x / 55 + y * .9));
      fib += '<path d="' + d + '"/>';
    }
    s += '<g class="ar__fib">' + fib + '</g><g class="ar__str">' + fib + '</g>';
    var nuc = '';
    for (i = 0; i < 70; i++) {
      y = AR.yFat + 11 + Math.floor(r() * 23) * 7.5; x = r() * W;
      nuc += '<ellipse cx="' + n1(x) + '" cy="' + n1(y + 1.4 * Math.sin(x / 55 + y * .9)) + '" rx="4.6" ry="1.7"/>';
    }
    s += '<g class="ar__mnuc">' + nuc + '</g>';
    s += '<rect x="-4" y="' + AR.yFat + '" width="' + (W + 8) + '" height="' + (H - AR.yFat + 4) + '" fill="url(#' + u + 'ms)"/>';
    /* the finest vessels in the muscle, from the ends of each branch */
    var capA = '', capB = '';
    BR.forEach(function (b, bi) {
      b.subs.forEach(function (sb, si) {
        var e = sb[sb.length - 1], p0 = sb[sb.length - 2], ang = Math.atan2(e[1] - p0[1], e[0] - p0[0]);
        for (var k = -1; k <= 1; k++) {
          var a2 = ang + k * .55, L1 = 16 + 8 * r(), x1 = e[0] + Math.cos(a2) * L1, y1 = e[1] + Math.sin(a2) * L1;
          var dd = 'M' + n1(e[0]) + ' ' + n1(e[1]) + ' Q' + n1(x1 + 6 * (r() - .5)) + ' ' + n1(y1 + 6 * (r() - .5)) + ' ' + n1(x1 + Math.cos(a2) * 12) + ' ' + n1(y1 + Math.sin(a2) * 12);
          if (b.k === 'A') capA += '<path d="' + dd + '"/>'; else capB += '<path d="' + dd + '"/>';
        }
        /* the smallest vessels also branch off along the way */
        for (var j = 1; j < sb.length - 1; j++) {
          var q = sb[j], side = (j + si + bi) % 2 ? 1 : -1, x2 = q[0] + side * (12 + 6 * r()), y2 = q[1] + 14 + 6 * r();
          var d2 = 'M' + n1(q[0]) + ' ' + n1(q[1]) + ' Q' + n1((q[0] + x2) / 2 + side * 4) + ' ' + n1((q[1] + y2) / 2) + ' ' + n1(x2) + ' ' + n1(y2);
          if (b.k === 'A') capA += '<path d="' + d2 + '"/>'; else capB += '<path d="' + d2 + '"/>';
        }
      });
    });
    s += '<g class="ar__cap">' + capA + '</g><g class="ar__cap ar__capB">' + capB + '</g>';
    /* the fat and connective tissue the artery lies on */
    s += '<rect class="ar__fat" x="-4" y="' + AR.yOut2 + '" width="' + (W + 8) + '" height="' + (AR.yFat - AR.yOut2) + '"/>';
    var fat = '';
    [[AR.yOut2, AR.yOut2 + 6.5, 0], [AR.yOut2 + 6.5, AR.yFat, 6]].forEach(function (row) {
      for (x = -8 + row[2]; x < W + 8; x += 10 + 5 * r()) {
        var w2 = 9 + 4 * r();
        fat += '<path d="M' + n1(x + 1.2) + ' ' + n1(row[0] + .6) + ' L' + n1(x + w2 - 1) + ' ' + n1(row[0] + .9 + r()) + ' Q' + n1(x + w2 + .6) + ' ' + n1((row[0] + row[1]) / 2) + ' ' + n1(x + w2 - 1.2) + ' ' + n1(row[1] - .6) +
          ' L' + n1(x + 1) + ' ' + n1(row[1] - .8) + ' Q' + n1(x - .6) + ' ' + n1((row[0] + row[1]) / 2) + ' ' + n1(x + 1.2) + ' ' + n1(row[0] + .6) + 'Z"/>';
      }
    });
    s += '<g class="ar__fatc">' + fat + '</g>';
    /* the blood in the lumen */
    s += '<rect x="-4" y="' + AR.yLum + '" width="' + (W + 8) + '" height="' + LUM0 + '" fill="url(#' + u + 'lu)"/>';
    /* the upper wall: adventitia, media with elastic fibres, the internal elastic lamina, the lining */
    s += '<rect class="ar__adv" x="-4" y="' + AR.yOut + '" width="' + (W + 8) + '" height="' + (AR.yMed - AR.yOut) + '"/>';
    s += '<rect class="ar__med" x="-4" y="' + AR.yMed + '" width="' + (W + 8) + '" height="' + (AR.yIel - AR.yMed) + '" fill="url(#' + u + 'm1)"/>';
    s += '<rect class="ar__adv" x="-4" y="' + AR.yMed2 + '" width="' + (W + 8) + '" height="' + (AR.yOut2 - AR.yMed2) + '"/>';
    s += '<rect class="ar__med" x="-4" y="' + AR.yIel2 + '" width="' + (W + 8) + '" height="' + (AR.yMed2 - AR.yIel2) + '" fill="url(#' + u + 'm2)"/>';
    function wavy(y0, amp, per, ph) { var dd = 'M-6 ' + n1(y0); for (var xx = 0; xx <= W + 12; xx += 6) dd += ' L' + xx + ' ' + n1(y0 + amp * Math.sin(xx / per + ph)); return dd; }
    var el = '';
    [64, 71, 78].forEach(function (yy, k) { el += '<path d="' + wavy(yy, 1.6, 7, k) + '"/>'; });
    [216, 223, 230].forEach(function (yy, k) { el += '<path d="' + wavy(yy, 1.6, 7, k + 1.5) + '"/>'; });
    s += '<g class="ar__el">' + el + '</g>';
    var col = '';
    [50, 54, 242, 246].forEach(function (yy, k) { col += '<path d="' + wavy(yy, 1.1, 11, k * 1.7) + '"/>'; });
    s += '<g class="ar__col">' + col + '</g>';
    s += '<g class="ar__iel"><path d="' + wavy(AR.yIel, 1.3, 5, 0) + '"/><path d="' + wavy(AR.yIel2 + 1, 1.3, 5, 2) + '"/></g>';
    var smc = '';
    for (i = 0; i < 44; i++) { x = r() * W; y = (i % 2 ? AR.yMed + 4 : AR.yIel2 + 4) + r() * 20; smc += '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="5.4" ry="1.3" transform="rotate(' + n1(6 * (r() - .5)) + ' ' + n1(x) + ' ' + n1(y) + ')"/>'; }
    s += '<g class="ar__smc">' + smc + '</g>';
    /* the wall under the deposit loses its elastic fibres: this patch hides them as the deposit grows */
    s += '<rect class="ar__stiff" x="' + (AR.xc - AR.hw) + '" y="' + (AR.yIel2 - 1) + '" width="' + (2 * AR.hw) + '" height="' + (AR.yMed2 - AR.yIel2 + 1) + '" fill="url(#' + u + 'sf)" opacity="0"/>';
    s += '<rect class="ar__lin" x="-4" y="' + (AR.yIel - 1) + '" width="' + (W + 8) + '" height="5"/>';
    var en = '';
    for (x = 8; x < W; x += 24) en += '<ellipse cx="' + x + '" cy="' + (AR.yLum - 2.2) + '" rx="4.4" ry="1.2"/>';
    s += '<g class="ar__enuc">' + en + '</g>';
    /* the parts that change: the deposit, the lower lining, then the branches, the clot and the cells */
    s += '<g class="ar__dep"></g><g class="ar__lin2"></g>';
    var bo = '', bi2 = '', biB = '';
    BR.forEach(function (b) {
      var m0 = [[b.main[0][0], AR.yIel2]].concat(b.main.slice(1));
      bo += '<path class="ar__bw" d="' + ptsD(m0) + '"/>' + b.subs.map(function (sb) { return '<path class="ar__bw ar__bw--s" d="' + ptsD(sb) + '"/>'; }).join('');
      var inner = '<path class="ar__bl" d="' + ptsD(b.main) + '"/>' + b.subs.map(function (sb) { return '<path class="ar__bl ar__bl--s" d="' + ptsD(sb) + '"/>'; }).join('');
      if (b.k === 'A') bi2 += inner; else biB += inner;
    });
    s += '<g class="ar__brw">' + bo + '</g><g class="ar__brl">' + bi2 + '</g><g class="ar__brl ar__brlB">' + biB + '</g>';
    s += '<g class="ar__clot"></g><g class="ar__cells"></g>';
    /* which way the blood flows: from the aorta, on the left */
    s += '<g class="ar__dir"><path d="M626 136 L635 148 L626 160"/><path d="M636 136 L645 148 L636 160"/></g>';
    return s;
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
    svg.setAttribute('aria-label', 'A coronary artery cut along its length, lying on the heart muscle it supplies. Step by step, fatty material builds up in its wall, the lumen narrows, a blood clot forms and blocks the artery, and the heart muscle beyond the blockage dies.');
    svg.innerHTML = '<rect class="ar__bg"/><g class="ar__model" clip-path="url(#' + u + 'cp)">' + arStatic(u) + '</g><g class="ar__labs"></g>';
    fig.appendChild(svg);
    var bg = svg.querySelector('.ar__bg'), model = svg.querySelector('.ar__model'), gLab = svg.querySelector('.ar__labs');
    var gDep = svg.querySelector('.ar__dep'), gLin = svg.querySelector('.ar__lin2'), gClot = svg.querySelector('.ar__clot'), gCells = svg.querySelector('.ar__cells');
    var stopA = svg.querySelector('.ar__ma'), stopB = svg.querySelector('.ar__mb'), stiff = svg.querySelector('.ar__stiff');
    var capB = svg.querySelector('.ar__capB'), brlB = svg.querySelector('.ar__brlB');

    /* red blood cells: five lanes across the lumen, and a few in every branch */
    var r = rng(5), TRUNK = [], LANES = [.12, .3, .5, .7, .88];
    LANES.forEach(function (lane, j) {
      var n = 15;
      for (var i = 0; i < n; i++) TRUNK.push({ lane: lane, g: 1.25 * (1 - .55 * (2 * lane - 1) * (2 * lane - 1)), s0: (i + [0, .55, .2, .8, .38][j] + .24 * (r() - .5)) / n, tilt: 14 * (r() - .5) });
    });
    var BCELLS = [];
    BR_PATHS.forEach(function (P, pi) { var n = Math.round(P.s.total / 30); for (var i = 0; i < n; i++) BCELLS.push({ p: pi, s0: (i + .4 * r()) / n }); });

    var lay = { tall: false, yA: 30, f: 17, mL: 146, mR: 96 };
    /* model → screen: on its side on a narrow screen; the empty strip above the artery is cut off */
    function toScreen(x, y) { return lay.tall ? [y - lay.yA, x] : [x, y - lay.yA]; }

    function render(t) {
      var P = depAt(t), C = clotAt(t), Q = flowAt(t), V = volumeAt(t);
      var crack = ease(seg(t, 36, 37.6)), stf = ease(seg(t, 25, 33)), dead = ease(seg(t, 53.5, 60.5));
      var sB = Math.sqrt(Q);
      var i, x, s;
      /* the muscle's colour: A is always supplied, B is beyond the deposit */
      var colB = mixc(mixc(MUS.isch, MUS.ok, sB), MUS.dead, dead);
      stopA.setAttribute('stop-color', MUS.ok); stopB.setAttribute('stop-color', colB);
      capB.setAttribute('opacity', n1((.3 + .7 * sB) * (1 - .7 * dead)));
      brlB.setAttribute('stroke', mixc('#5E2230', '#B92F33', sB));
      stiff.setAttribute('opacity', n1(stf * .92));

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
      if (crack > .02) { lin += liningPath(-4, xn - gp) + liningPath(xn + gp, AR.W + 4); }
      else lin += liningPath(-4, AR.W + 4);
      for (x = 8; x < AR.W; x += 24) {
        if (crack > .02 && Math.abs(x - xn) < gp + 5) continue;
        var ly = top(x) - 2 - (Math.abs(x - xn) < 26 ? notch(x) : 0), sl = (top(x + 2) - top(x - 2)) / 4;
        lin += '<ellipse class="ar__enuc2" cx="' + x + '" cy="' + n1(ly) + '" rx="4.4" ry="1.2" transform="rotate(' + n1(Math.atan(sl) * 57.3) + ' ' + x + ' ' + n1(ly) + ')"/>';
      }
      gLin.innerHTML = lin;

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
      gClot.innerHTML = clot;

      /* the red blood cells. Each lane carries the same blood per second along its whole length, so
         a cell moves faster where the lumen is narrow; when the lumen closes, every cell stops. */
      var NT = 111, dx = AR.W / (NT - 1), TX = [], TT = [0], TW = [];
      for (i = 0; i < NT; i++) { TX.push(i * dx); TW.push(lumenW(i * dx, P, C)); }
      for (i = 1; i < NT; i++) TT.push(TT[i - 1] + (TW[i - 1] + TW[i]) / 2 / LUM0 * dx);
      var TOT = TT[NT - 1];
      function xOfTau(tau) {
        var lo = 0, hi = NT - 1;
        if (tau <= 0) return 0; if (tau >= TOT) return AR.W;
        while (hi - lo > 1) { var m = (lo + hi) >> 1; if (TT[m] < tau) lo = m; else hi = m; }
        return TX[lo] + (tau - TT[lo]) / ((TT[hi] - TT[lo]) || 1) * dx;
      }
      var cells = '', v0 = 72 / AR.W;
      /* once the clot closes the artery, the blood trapped beyond it no longer flows: it gives up its
         oxygen to the muscle around it and is drawn dusky, like the branches beyond it */
      var fillT = mixc('#8E4452', '#FF8A7E', clamp01(Q / .02)), past = AR.xk + AR.hk * .5;
      TRUNK.forEach(function (c) {
        var sN = (c.s0 + c.g * V * v0) % 1, xx = xOfTau(sN * TOT), w = lumenW(xx, P, C);
        if (w < 4) return;
        var yy = AR.yLum + w * c.lane, slope = (lumenW(xx + 2, P, C) - lumenW(xx - 2, P, C)) / 4 * c.lane;
        var room = c.lane === .5 ? clamp01((w - 6) / 4) : (c.lane === .3 || c.lane === .7) ? clamp01((w - 24) / 10) : clamp01((w - 44) / 14);
        var op = Math.min(1, xx / 20, (AR.W - xx) / 20, room); if (op <= .02) return;
        var ang = Math.atan(slope) * 57.3 + c.tilt * (1 - clamp01((LUM0 - w) / 60));
        cells += '<ellipse class="ar__rbc" cx="' + n1(xx) + '" cy="' + n1(yy) + '" rx="6.5" ry="3.6" transform="rotate(' + n1(ang) + ' ' + n1(xx) + ' ' + n1(yy) + ')" opacity="' + n1(op) + '"' + (xx > past && Q < .02 ? ' style="fill:' + fillT + '"' : '') + '/>';
      });
      var fillB = mixc('#A6505A', '#FF8A7E', sB);
      BCELLS.forEach(function (c) {
        var B = BR_PATHS[c.p], dist = B.k === 'A' ? t * 46 : V * 46, sN = (c.s0 + dist / B.s.total) % 1;
        var q = at(B.s, sN * B.s.total), q2 = at(B.s, Math.min(B.s.total, sN * B.s.total + 3));
        var op = Math.min(1, sN * B.s.total / 14, (1 - sN) * B.s.total / 18); if (op <= .02) return;
        var ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 57.3;
        cells += '<ellipse class="ar__rbc ar__rbc--br" cx="' + n1(q[0]) + '" cy="' + n1(q[1]) + '" rx="5.2" ry="2.9" transform="rotate(' + n1(ang) + ' ' + n1(q[0]) + ' ' + n1(q[1]) + ')" opacity="' + n1(op) + '"' + (B.k === 'B' ? ' style="fill:' + fillB + '"' : '') + '/>';
      });
      gCells.innerHTML = cells;

      /* labels, in the margins, leaders ruled level */
      var items = [], xp = AR.xc + (lay.tall ? 26 : 24), xk = AR.xc + (lay.tall ? -20 : 2);
      function add(id, text, mx, my, side, op) { var p = toScreen(mx, my); items.push({ id: id, text: text, x: p[0], y: p[1], side: side, op: op == null ? 1 : op }); }
      add('wall', 'wall of artery', lay.tall ? 24 : 60, (AR.yMed + AR.yIel) / 2, 'L');
      add('lining', 'lining', lay.tall ? 64 : 60, AR.yLum - 2, 'L');
      add('lumen', 'lumen', lay.tall ? 104 : 60, 148, 'L');
      var pth = P_(xp, P); if (pth > 5) add('dep', 'fatty deposit (plaque)', xp, AR.yIel2 - pth / 2 + 1, 'L', clamp01((pth - 5) / 6));
      var cth = Math.min(C_(xk, C), lumenW(xk, P, 0)), cbot = top(xk) - 4;
      if (cth > 5) add('clot', 'blood clot', xk, cbot - cth / 2, 'L', clamp01((cth - 5) / 5));
      add('mus', 'heart muscle', lay.tall ? 470 : 560, lay.tall ? 380 : 372, 'R');
      add('br', 'branch of the artery', lay.tall ? 566 : 575, lay.tall ? 318 : 300, 'R');
      var f = lay.f, vb = lay.vb;
      gLab.innerHTML =
        L.labels({ items: items.filter(function (q) { return q.side === 'L'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mL - 26, top: vb.y + 6, bottom: vb.y + vb.h - 6, gap: 5 }) +
        L.labels({ items: items.filter(function (q) { return q.side === 'R'; }), left: -8, right: vb.bw + 8, font: f, width: lay.mR - 26, top: vb.y + 6, bottom: vb.y + vb.h - 6, gap: 5 });

      /* the read-outs above the drawing */
      var when = t < 12 ? 'at the start' : t < 22 ? 'over many years' : t < 35 ? 'over more years' : t < 43 ? 'suddenly' : t < 52 ? 'within minutes' : '20 to 40 minutes later';
      var flow = Q > .97 ? ['normal', 'ok'] : Q > .02 ? ['less', 'warn'] : ['none past the clot', 'bad'];
      var mus = dead > .05 ? ['cells die', 'bad'] : Q < .02 ? ['no oxygen, no glucose', 'bad'] : Q < .97 ? ['less oxygen', 'warn'] : ['oxygen and glucose', 'ok'];
      pill('when', when, 'plain'); pill('flow', flow[0], flow[1]); pill('mus', mus[0], mus[1]);
    }
    function pill(k, text, cls) {
      var p = read.querySelector('[data-k="' + k + '"]'), i = p.querySelector('i');
      if (i.textContent !== text) i.textContent = text;
      p.className = 'ar__pill is-' + cls;
    }

    var R = [0, 14.5, 26.5, 41.5, 50, 60, 72], M = [0, 12, 22, 35, 43, 52, AR_END], clock = readerClock(R, M);
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
    box.appendChild(h('p', 'widget__note', 'The blood in a coronary artery is oxygenated, so it is drawn red. The red blood cells are drawn several hundred times larger than real, and far fewer. As the lumen narrows, fewer cells pass each second; in the narrow part itself they move faster, as water does through the narrow end of a hose. Time is squeezed: a fatty deposit grows over many years, but a clot can block the artery within minutes, and heart muscle cells die after 20 to 40 minutes without blood.'));
    box.appendChild(h('p', 'widget__note ar__fence', '<b>Not asked in 0610.</b> “Plaque” and “atheroma” are other names for the fatty deposit; mark schemes accept them. The chest pain of step 3 is called angina. A heart attack is also called a myocardial infarction.'));

    /* the layout: turned on its side on a narrow screen; lettering at least 13 px on screen */
    var cr = svg.querySelector('.ar__cr');
    function setLayout(D, ww) {
      var tall = (ww || D) < 440, yA = tall ? 36 : 30, yB = tall ? 410 : AR.H;
      var bw = tall ? yB - yA : AR.W, bh = tall ? AR.W : yB - yA;
      var ft = fitType(D, bw, 8, 6, tall ? 108 : 146, tall ? 90 : 96, 13);
      var padT = 14, padB = 14;
      var vb = { x: -ft.mL, y: -padT, w: bw + ft.mL + ft.mR, h: bh + padT + padB, bw: bw, bh: bh };
      lay = { tall: tall, yA: yA, f: ft.f, mL: ft.mL, mR: ft.mR, vb: vb };
      svg.setAttribute('viewBox', n1(vb.x) + ' ' + n1(vb.y) + ' ' + n1(vb.w) + ' ' + n1(vb.h));
      bg.setAttribute('x', n1(vb.x)); bg.setAttribute('y', n1(vb.y)); bg.setAttribute('width', n1(vb.w)); bg.setAttribute('height', n1(vb.h)); bg.setAttribute('rx', 18);
      cr.setAttribute('y', yA); cr.setAttribute('height', yB - yA);
      model.setAttribute('transform', tall ? 'matrix(0 1 1 0 ' + (-yA) + ' 0)' : 'translate(0 ' + (-yA) + ')');
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
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } fit(); }) : null;
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
  var AVATAR = '<svg class="pf__av" viewBox="0 0 40 40" aria-hidden="true" focusable="false"><circle cx="20" cy="20" r="20" class="pf__avbg"/><circle cx="20" cy="15.2" r="6.8" class="pf__avfg"/><path class="pf__avfg" d="M6.4 34.7C8 28.3 13.4 24.4 20 24.4S32 28.3 33.6 34.7A20 20 0 0 1 6.4 34.7Z"/></svg>';

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
        '<div class="pf__who">' + AVATAR + '<div class="pf__id"><b class="pf__name">' + p.name + '</b></div></div>' +
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
      var w = list.getBoundingClientRect().width; if (w) box.classList.toggle('pf--narrow', w < 560);
    }) : null;
    if (ro) ro.observe(list);
    box.__onReset = function () { drag = null; if (ro) ro.disconnect(); };
    return box;
  }

  L.add('artery', artery);
  L.add('profiles', profiles);
})(window);
