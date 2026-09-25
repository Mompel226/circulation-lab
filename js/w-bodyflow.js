/* ============================================================
   w-bodyflow.js — after a meal: from the gut to the liver, and on round the body.

   One widget, 'bodyflow': the journey of the blood AFTER the heart, told in ten steps that each
   play and then hold until "Next step" (js/w-common.js, the lab's step player). It follows one
   molecule of glucose and one amino acid from the small intestine, through the liver, back to the
   heart, through the lungs, and out again: the amino acid is deaminated in the liver and its
   nitrogen leaves as urea, which the kidneys excrete; the glucose is used in respiration by a
   muscle cell. A switch sets the moment: "After a meal" or "Hours later", and two readings show
   the glucose in the hepatic portal vein and in the hepatic vein.

   Four scenes, one camera. The body (A) is drawn in the plate's own coordinates, with the plate's
   heart (js/heart-art.js), its colours and its anatomy: the liver on the body's right (your left),
   the aorta to the left of the vena cava in the abdomen, the right kidney lower than the left,
   the left renal vein crossing in front of the aorta, the right renal artery behind the vena cava.
   Three magnified views open from it like a lens: a villus (B), liver cells beside a blood space
   (C), and a capillary between two muscle cells (D).

   What the biology is, and where it was checked (the full audit is in the report to Daniel):
     · absorption: glucose and amino acids enter the villus capillaries; most fat leaves the
       epithelial cells as fat droplets, into the lacteal and the lymph, and so does not pass through
       the liver first; glycerol, which dissolves in water, enters the capillaries (OpenStax Anatomy
       and Physiology 2e, section 23.7 and table 23.10);
     · the liver stores glucose as glycogen after a meal and releases glucose from it between meals;
       muscle cells store glycogen too (OpenStax 24.5). It does NOT store amino acids: it makes
       proteins such as fibrinogen from some, and deaminates the excess, forming urea (0610 S 13.1.6–8);
     · the liver removes only part of the absorbed glucose, about a quarter to a third (Ludvik et al.
       1995, J Clin Invest 95: 2232; Moore et al. 2012, Adv Nutr 3: 286), so glucose in the hepatic
       vein rises after a meal too, but less than in the hepatic portal vein. The two readings are
       drawn in those proportions, with no numbers: after a meal the portal vein is well above the
       hepatic vein; hours later the hepatic vein is a little above the portal vein, because the liver
       is releasing glucose.
   Only the substances each step is about are drawn; blood always carries some glucose, amino acids
   and urea. Every drawing is a pure function of the time t, so any moment can be drawn on demand:
   box.__seek(t, { meal }) is the headless hook, and box.__labels() returns the leaders drawn.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var HA = global.HeartArt, ART = global.BODY_ART;
  var h = L.h, esc = L.esc, NS = 'http://www.w3.org/2000/svg';

  /* ---------- numbers ---------- */
  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function seg(t, a, b) { return clamp01((t - a) / (b - a)); }
  function ease(k) { k = clamp01(k); return k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; }
  function sm(k) { k = clamp01(k); return k * k * (3 - 2 * k); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function n2(v) { return Math.round(v * 100) / 100; }
  function n4(v) { return Math.round(v * 10000) / 10000; }
  function rgb(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, k) {
    k = clamp01(k); if (k === 0) return a; if (k === 1) return b;
    var x = rgb(a), y = rgb(b);
    return 'rgb(' + Math.round(lerp(x[0], y[0], k)) + ',' + Math.round(lerp(x[1], y[1], k)) + ',' + Math.round(lerp(x[2], y[2], k)) + ')';
  }
  function rng(seed) { var x = seed >>> 0; return function () { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }
  function fract(v) { return v - Math.floor(v); }
  /* on for a window, with soft edges */
  function win(t, a, b, f) { f = f || .35; return Math.min(seg(t, a, a + f), 1 - seg(t, b - f, b)); }

  /* ---------- curves ----------
     A smooth curve through points (centripetal Catmull–Rom, so a tight bend never loops), sampled
     about every `step` units, with the running length at each sample. */
  function curve(P, closed, step) {
    step = step || 3;
    var n = P.length, pts = [], i, k;
    function get(j) {
      if (closed) return P[(j + n) % n];
      if (j < 0) return [2 * P[0][0] - P[1][0], 2 * P[0][1] - P[1][1]];
      if (j >= n) return [2 * P[n - 1][0] - P[n - 2][0], 2 * P[n - 1][1] - P[n - 2][1]];
      return P[j];
    }
    function tj(ti, a, b) { return ti + Math.max(1e-4, Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]), .5)); }
    var segs = closed ? n : n - 1;
    for (i = 0; i < segs; i++) {
      var p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
      var t0 = 0, t1 = tj(t0, p0, p1), t2 = tj(t1, p1, p2), t3 = tj(t2, p2, p3);
      var m = Math.max(2, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
      for (k = 0; k < m; k++) {
        var t = lerp(t1, t2, k / m), q = [0, 0];
        for (var d = 0; d < 2; d++) {
          var a1 = (t1 - t) / (t1 - t0) * p0[d] + (t - t0) / (t1 - t0) * p1[d];
          var a2 = (t2 - t) / (t2 - t1) * p1[d] + (t - t1) / (t2 - t1) * p2[d];
          var a3 = (t3 - t) / (t3 - t2) * p2[d] + (t - t2) / (t3 - t2) * p3[d];
          var b1 = (t2 - t) / (t2 - t0) * a1 + (t - t0) / (t2 - t0) * a2;
          var b2 = (t3 - t) / (t3 - t1) * a2 + (t - t1) / (t3 - t1) * a3;
          q[d] = (t2 - t) / (t2 - t1) * b1 + (t - t1) / (t2 - t1) * b2;
        }
        pts.push(q);
      }
    }
    pts.push(closed ? pts[0].slice() : P[n - 1].slice());
    return measure(pts);
  }
  function measure(pts) {
    var len = [0], x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (var i = 0; i < pts.length; i++) {
      if (i) len.push(len[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
      x0 = Math.min(x0, pts[i][0]); y0 = Math.min(y0, pts[i][1]); x1 = Math.max(x1, pts[i][0]); y1 = Math.max(y1, pts[i][1]);
    }
    return { pts: pts, len: len, total: len[len.length - 1], box: [x0, y0, x1, y1] };
  }
  function at(c, s) {
    var pts = c.pts, len = c.len, last = pts.length - 1;
    if (s <= 0) return { x: pts[0][0], y: pts[0][1], a: Math.atan2(pts[1][1] - pts[0][1], pts[1][0] - pts[0][0]) };
    if (s >= c.total) return { x: pts[last][0], y: pts[last][1], a: Math.atan2(pts[last][1] - pts[last - 1][1], pts[last][0] - pts[last - 1][0]) };
    var lo = 0, hi = last;
    while (hi - lo > 1) { var mid = (lo + hi) >> 1; if (len[mid] < s) lo = mid; else hi = mid; }
    var u = (s - len[lo]) / ((len[hi] - len[lo]) || 1);
    return { x: lerp(pts[lo][0], pts[hi][0], u), y: lerp(pts[lo][1], pts[hi][1], u), a: Math.atan2(pts[hi][1] - pts[lo][1], pts[hi][0] - pts[lo][0]) };
  }
  function atF(c, f) { return at(c, c.total * f); }
  function dOf(c, close) {
    var s = 'M' + n2(c.pts[0][0]) + ' ' + n2(c.pts[0][1]);
    for (var i = 1; i < c.pts.length; i++) s += 'L' + n2(c.pts[i][0]) + ' ' + n2(c.pts[i][1]);
    return s + (close ? 'Z' : '');
  }
  function nearest(c, x, y) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < c.pts.length; i++) { var d = Math.hypot(c.pts[i][0] - x, c.pts[i][1] - y); if (d < bd) { bd = d; best = i; } }
    return c.len[best];
  }
  function inPoly(pts, x, y) {
    var inside = false;
    for (var i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      var xi = pts[i][0], yi = pts[i][1], xj = pts[j][0], yj = pts[j][1];
      if (((yi > y) !== (yj > y)) && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)) inside = !inside;
    }
    return inside;
  }
  /* several curves end to end, as one */
  function chain(list) {
    var pts = [];
    list.forEach(function (c) {
      c.pts.forEach(function (p, i) {
        if (pts.length && i === 0 && Math.hypot(p[0] - pts[pts.length - 1][0], p[1] - pts[pts.length - 1][1]) < 1.5) return;
        pts.push(p);
      });
    });
    return measure(pts);
  }
  /* the part of a curve between two lengths, as a curve */
  function sub(c, s0, s1) {
    var pts = [], a = at(c, s0), b = at(c, s1);
    pts.push([a.x, a.y]);
    for (var i = 0; i < c.pts.length; i++) if (c.len[i] > s0 && c.len[i] < s1) pts.push(c.pts[i]);
    pts.push([b.x, b.y]);
    return measure(pts);
  }

  /* ---------- colours: the plate's red and blue, and one colour per substance ---------- */
  var C = {
    oxy: '#E8453F', deo: '#3F72D6', oxyWall: '#7A1E21', deoWall: '#1B3570', oxyCell: '#FF8A7E', deoCell: '#8FB2FF',
    glu: '#F6C945', gluLine: '#7A4E00', aa: '#6FD08C', aaLine: '#185C2C', aaN: '#C8A2FF',
    urea: '#C9A4FF', ureaLine: '#43237F', fat: '#FFEFC4', fatLine: '#A5813A',
    o2: '#FF7B6B', co2: '#C3CCD3', co2Dark: '#66737D',
    margin: '#0D1A22'
  };

  /* ================================================================
     SCENE A — the body, in the plate's coordinates (viewBox 352 86 576 1164)
     ================================================================ */
  var HT = { cx: 648, cy: 668, s: .46, ox: 205, oy: 300 };     /* the heart, placed where the plate places it */
  function hx(x) { return HT.cx + (x - HT.ox) * HT.s; }
  function hy(y) { return HT.cy + (y - HT.oy) * HT.s; }
  function hp(p) { return [hx(p[0]), hy(p[1])]; }
  var AO0 = hp([300, 560]), IVC0 = hp([28, 560]);            /* where the heart drawing's aorta and vena cava end */

  var ORG = {
    lungR: curve([[566, 514], [546, 524], [526, 550], [512, 590], [504, 640], [500, 700], [502, 766], [530, 784], [572, 781], [604, 775], [600, 740], [597, 700], [595, 660], [595, 610], [591, 560], [583, 527]], true, 4),
    lungL: curve([[718, 514], [738, 522], [758, 548], [772, 590], [782, 650], [786, 720], [784, 776], [760, 789], [726, 790], [703, 785], [707, 768], [716, 754], [721, 743], [708, 728], [701, 706], [700, 680], [700, 630], [702, 580], [708, 540]], true, 4),
    liver: curve([[502, 806], [512, 787], [540, 775], [590, 771], [642, 776], [692, 784], [734, 794], [754, 803], [739, 812], [705, 825], [669, 840], [635, 855], [603, 869], [569, 883], [537, 890], [513, 881], [503, 853]], true, 4),
    kidR: curve([[546, 904], [562, 910], [570, 926], [568, 940], [574, 950], [568, 962], [570, 978], [560, 994], [544, 998], [528, 988], [520, 966], [520, 938], [528, 914]], true, 3),
    kidL: curve([[726, 892], [742, 900], [752, 920], [752, 948], [744, 972], [728, 984], [712, 980], [704, 966], [706, 950], [700, 938], [706, 926], [704, 912], [712, 898]], true, 3),
    gut: curve([[704, 988], [676, 992], [640, 996], [606, 999], [590, 1010], [598, 1024], [630, 1030], [670, 1030], [708, 1027], [726, 1038], [718, 1054], [684, 1060], [640, 1062], [602, 1063], [588, 1076], [600, 1090], [640, 1094], [682, 1094], [714, 1091], [728, 1104], [716, 1118], [678, 1123], [634, 1124], [598, 1122], [580, 1112]], false, 3)
  };

  var VES = [
    /* arteries, from the heart outwards */
    { id: 'aoAbd', a: 1, w: 11, z: 0, p: [AO0, [689, 806], [678, 828], [667, 852], [664, 880], [664, 960], [664, 1040], [664, 1110]] },
    { id: 'iliacAR', a: 1, w: 8, z: 0, p: [[664, 1110], [651, 1136], [627, 1168], [608, 1204], [600, 1238]] },
    { id: 'iliacAL', a: 1, w: 8, z: 0, p: [[664, 1110], [677, 1136], [701, 1168], [720, 1204], [728, 1238]] },
    { id: 'renAR', a: 1, w: 5, z: -1, p: [[664, 920], [640, 923], [606, 932], [575, 946]] },
    { id: 'renAL', a: 1, w: 5, z: 0, p: [[664, 915], [682, 918], [701, 927]] },
    { id: 'hepA', a: 1, w: 5, z: 1, p: [[664, 846], [650, 845], [633, 848], [618, 854], [610, 859]] },
    { id: 'sma', a: 1, w: 6, z: 1, p: [[664, 876], [659, 902], [650, 940], [639, 982], [626, 1026], [612, 1070]] },
    { id: 'bcA', a: 1, w: 6, z: 1, p: [hp([193, -60]), [636, 488], [630, 474]] },
    { id: 'carAR', a: 1, w: 5, z: 1, p: [[630, 474], [626, 430], [624, 360]] },
    { id: 'subAR', a: 1, w: 5, z: 1, p: [[630, 474], [600, 467], [552, 470], [508, 494], [482, 536]] },
    { id: 'carAL', a: 1, w: 5, z: 1, p: [hp([247, -60]), [666, 460], [664, 360]] },
    { id: 'subAL', a: 1, w: 5, z: 1, p: [hp([299, -60]), [706, 486], [748, 476], [792, 496], [818, 540]] },
    /* veins, towards the heart */
    { id: 'iliacVR', a: 0, w: 8, z: -1, p: [[586, 1238], [590, 1204], [595, 1158], [598, 1110]] },
    { id: 'iliacVL', a: 0, w: 8, z: -1, p: [[742, 1238], [737, 1206], [716, 1170], [681, 1140], [640, 1124], [598, 1110]] },
    { id: 'ivcAbd', a: 0, w: 12, z: -1, p: [[598, 1110], [598, 1040], [598, 960], [596, 904], [590, 862], [581, 826], [572, 801], IVC0] },
    { id: 'renVR', a: 0, w: 6, z: 0, p: [[575, 957], [586, 955], [597, 953]] },
    { id: 'renVL', a: 0, w: 6, z: 0.5, p: [[701, 941], [680, 942], [650, 944], [622, 946], [599, 947]] },
    { id: 'hepVR', a: 0, w: 6, z: 2, p: [[522, 838], [540, 823], [556, 809], [568, 798]] },
    { id: 'hepVM', a: 0, w: 6, z: 2, p: [[598, 836], [589, 820], [578, 807], [570, 800]] },
    { id: 'hepVL', a: 0, w: 5, z: 2, p: [[680, 812], [648, 806], [610, 803], [574, 801]] },
    { id: 'portal', a: 0, w: 8, z: 1, p: [[586, 1106], [594, 1064], [604, 1022], [613, 983], [620, 945], [625, 913], [622, 889], [613, 873], [604, 864]] },
    { id: 'jugR', a: 0, w: 5, z: 1, p: [[610, 360], [610, 430], [607, 474]] },
    { id: 'subVR', a: 0, w: 5, z: 1, p: [[474, 546], [500, 504], [548, 480], [596, 476], [607, 474]] },
    { id: 'bcvR', a: 0, w: 7, z: 1, p: [[607, 474], [604, 490], hp([104, -60])] },
    { id: 'jugL', a: 0, w: 5, z: 1, p: [[680, 360], [680, 430], [676, 472]] },
    { id: 'subVL', a: 0, w: 5, z: 1, p: [[828, 546], [798, 502], [748, 482], [700, 476], [676, 472]] },
    { id: 'bcvL', a: 0, w: 7, z: 1, p: [[676, 472], [648, 480], [620, 490], hp([104, -60])] },
    /* the ureters: urine, not blood */
    { id: 'ureR', ure: 1, w: 3.4, z: -1, p: [[566, 972], [578, 1004], [586, 1060], [590, 1120], [594, 1200]] },
    { id: 'ureL', ure: 1, w: 3.4, z: -1, p: [[705, 962], [696, 1004], [690, 1060], [686, 1120], [682, 1200]] }
  ];
  var VI = {};
  VES.forEach(function (v) { v.c = curve(v.p, false, 3); VI[v.id] = v; });

  /* the vessels of the small intestine: arteries from the superior mesenteric artery to each loop,
     veins from each loop to the vein that becomes the hepatic portal vein */
  (function () {
    var sma = VI.sma.c, por = VI.portal.c, gut = ORG.gut;
    var A = [[.34, 690, 993], [.5, 701, 1028], [.64, 690, 1061], [.78, 676, 1093], [.92, 646, 1123], [1, 586, 1112]];
    var V = [[.6, 675, 996], [.47, 686, 1030], [.34, 673, 1062], [.22, 660, 1094], [.08, 630, 1124], [0, 584, 1104]];
    A.forEach(function (a, i) {
      var p = atF(sma, a[0]), qs = nearest(gut, a[1], a[2]), q = at(gut, qs);
      var v = { id: 'ma' + i, a: 1, w: 3, z: 1, p: [[p.x, p.y], [lerp(p.x, q.x, .5) + 3, lerp(p.y, q.y, .5) - 6], [q.x, q.y]] };
      v.c = curve(v.p, false, 3); VES.push(v); VI[v.id] = v;
    });
    V.forEach(function (a, i) {
      var qs = nearest(gut, a[1], a[2]), q = at(gut, qs), p = atF(por, a[0]);
      var v = { id: 'mv' + i, a: 0, w: 3.6, z: 1, p: [[q.x, q.y], [lerp(q.x, p.x, .5) - 2, lerp(q.y, p.y, .5) + 7], [p.x, p.y]] };
      v.c = curve(v.p, false, 3); VES.push(v); VI[v.id] = v;
    });
  })();
  /* the branches inside the liver: the hepatic portal vein and the hepatic artery divide, the
     hepatic veins gather. Drawn faint: they are inside the organ. */
  var LIVER_IN = [
    { a: 0, w: 4, p: [[604, 864], [584, 856], [560, 849], [534, 844]] },
    { a: 0, w: 3.4, p: [[604, 864], [626, 852], [656, 838], [690, 822]] },
    { a: 1, w: 2.4, p: [[610, 859], [590, 851], [566, 845], [542, 840]] },
    { a: 1, w: 2.2, p: [[610, 859], [630, 848], [660, 834], [694, 818]] }
  ];
  LIVER_IN.forEach(function (v) { v.c = curve(v.p, false, 3); });

  /* where the camera looks, as boxes in the body's coordinates */
  var VIEW = {
    trunk:   { x: 452, y: 436, w: 376, h: 806 },
    portWide: { x: 524, y: 792, w: 232, h: 350 },
    liverHeart: { x: 528, y: 556, w: 244, h: 330 },
    gutSpot: { x: 598, y: 1016, w: 104, h: 92 },
    livSpot: { x: 540, y: 800, w: 100, h: 88 },
    livUp:   { x: 520, y: 740, w: 150, h: 170 },
    chestL:  { x: 578, y: 512, w: 232, h: 290 },
    desc:    { x: 580, y: 620, w: 190, h: 360 },
    kidney:  { x: 572, y: 856, w: 206, h: 190 },
    legSpot: { x: 548, y: 1206, w: 86, h: 76 }
  };
  var SPOT = { B: [650, 1062], C: [590, 844], D: [591, 1244] };

  /* ================================================================
     THE TIMELINE — ten steps; each plays, then holds on its last frame
     ================================================================ */
  var T = { s1: 0, s2: 8, s3: 17, s4: 25, s5: 34, s6: 43, s7: 51, s8: 60, s9: 68, s10: 78 }, END = 87;
  var LENS = [
    { id: 'B', open: [8.9, 10.1], close: [25, 26.2] },
    { id: 'C', open: [35, 36.2], close: [51, 52.2] },
    { id: 'D', open: [80, 81.2], close: [99, 100] }
  ];
  function lensAt(t) {
    for (var i = 0; i < LENS.length; i++) {
      var l = LENS[i];
      if (t >= l.open[0] && t < l.close[1]) return { id: l.id, k: Math.min(seg(t, l.open[0], l.open[1]), 1 - seg(t, l.close[0], l.close[1])) };
    }
    return { id: null, k: 0 };
  }

  /* the journeys of the two molecules the story follows, in the body (step 4 and steps 7 to 10) */
  var J4 = curve([[676, 1062], [656, 1048], [634, 1034], [606, 1021], [613, 983], [620, 945], [625, 913], [622, 889], [613, 873], [604, 864], [594, 852]], false, 3);
  var J7 = chain([curve([[596, 832], [589, 820], [578, 807], [570, 800], IVC0], false, 3),
                  curve([[28, 560], [28, 420], [30, 330], [48, 268], [80, 238], [98, 262], [104, 318], [116, 364], [134, 390], [156, 380], [170, 340], [172, 280], [172, 210], [172, 150], [178, 108], [240, 97], [330, 110]].map(hp), false, 3)]);
  var J8 = curve([hp([330, 110]), hp([430, 144]), [768, 588], [782, 612], [779, 648], [764, 660], [756, 640], hp([430, 192]), hp([396, 195]), hp([363, 200]), hp([330, 212]), hp([310, 232]), hp([308, 262]), hp([302, 310]), hp([290, 368]), hp([274, 404])], false, 3);
  var AORTA = chain([curve([[274, 404], [252, 414], [238, 352], [230, 282], [229, 214], [229, 150], [232, 96], [248, 58], [272, 38], [298, 42], [306, 70], [300, 110], [300, 300], [300, 560]].map(hp), false, 3),
                     curve([AO0, [689, 806], [678, 828], [667, 852], [664, 880], [664, 915]], false, 3)]);
  var J9U = chain([AORTA, curve([[664, 915], [682, 918], [701, 927], [716, 930], [734, 920], [742, 940], [730, 956], [712, 956], [705, 962], [699, 986], [696, 1004]], false, 3)]);
  var J9G = chain([AORTA, curve([[664, 915], [664, 960], [664, 1000], [664, 1040]], false, 3)]);
  var J10 = curve([[664, 1040], [664, 1110], [651, 1136], [627, 1168], [608, 1204], [600, 1236], [594, 1244]], false, 3);
  function journey(c, t, a, b, lag) {
    var u = ease(seg(t, a, b));
    return at(c, Math.max(0, c.total * u - (lag || 0)));
  }

  /* ================================================================
     SCENES B, C, D — the magnified views, each 300 × 540 units
     ================================================================ */
  var MW = 300, MH = 540;

  /* ---- B: one villus ---- */
  var VIL = (function () {
    var outer = curve([[62, 560], [64, 470], [68, 380], [74, 292], [82, 212], [93, 150], [110, 104], [131, 80], [150, 73], [169, 80], [190, 104], [207, 150], [218, 212], [226, 292], [232, 380], [236, 470], [238, 560]], false, 3);
    var EP = 25, inner = [], cells = [], nuclei = [], fringe = '';
    var pts = outer.pts;
    function normalAt(i) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)], dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1;
      /* the curve runs up the left side and down the right: its right-hand normal points inwards */
      return [-dy / l, dx / l];
    }
    var nrm = pts.map(function (p, i) { return normalAt(i); });
    pts.forEach(function (p, i) { inner.push([p[0] + nrm[i][0] * EP, p[1] + nrm[i][1] * EP]); });
    for (var s = 7; s < outer.total; s += 14.5) {
      var i0 = 0; while (i0 < outer.len.length - 1 && outer.len[i0] < s) i0++;
      var p = pts[i0], nn = nrm[i0];
      cells.push([p[0], p[1], p[0] + nn[0] * EP, p[1] + nn[1] * EP]);
      var c = at(outer, s + 7.2), j = 0; while (j < outer.len.length - 1 && outer.len[j] < s + 7.2) j++;
      nuclei.push([c.x + nrm[j][0] * EP * .7, c.y + nrm[j][1] * EP * .7, Math.atan2(nrm[j][1], nrm[j][0]) * 180 / Math.PI]);
    }
    for (var f = 1; f < outer.total; f += 2.4) {
      var q = at(outer, f), k = 0; while (k < outer.len.length - 1 && outer.len[k] < f) k++;
      fringe += 'M' + n2(q.x) + ' ' + n2(q.y) + 'l' + n2(-nrm[k][0] * 4.6) + ' ' + n2(-nrm[k][1] * 4.6);
    }
    var innerC = measure(inner);
    /* the capillaries: an arteriole up the right, over the tip, a venule down the left, and rungs
       between them. Blood enters at the bottom right and leaves at the bottom left. */
    var art = curve([[194, 560], [194, 470], [191, 380], [186, 292], [180, 212], [172, 158], [163, 124]], false, 3);
    var ven = curve([[137, 124], [128, 158], [120, 212], [114, 292], [109, 380], [106, 470], [106, 560]], false, 3);
    function xOn(c, y) { for (var i = 1; i < c.pts.length; i++) { var a = c.pts[i - 1], b = c.pts[i]; if ((a[1] - y) * (b[1] - y) <= 0 && a[1] !== b[1]) return lerp(a[0], b[0], (y - a[1]) / (b[1] - a[1])); } return c.pts[0][0]; }
    var tip = curve([[163, 124], [157, 110], [150, 106], [143, 110], [137, 124]], false, 2);
    var RY = [178, 240, 305, 368, 430, 492];
    var rungs = RY.map(function (y) {
      var xa = xOn(art, y), xv = xOn(ven, y + 24);
      return curve([[xa, y], [xa - 12, y + 7], [150, y + 13], [xv + 12, y + 19], [xv, y + 24]], false, 2.5);
    });
    /* each route: up the arteriole, across (the tip or a rung), down the venule */
    function route(k) {
      if (k === 0) return chain([art, tip, ven]);
      var r = rungs[k - 1], a0 = r.pts[0], b0 = r.pts[r.pts.length - 1];
      return chain([sub(art, 0, nearest(art, a0[0], a0[1])), r, sub(ven, nearest(ven, b0[0], b0[1]), ven.total)]);
    }
    var routes = []; for (var r = 0; r <= RY.length; r++) routes.push(route(r));
    /* where each route crosses from arteriole to venule: the stretch where the blood gives up its oxygen */
    routes.forEach(function (rc, i) {
      var cross = i === 0 ? [nearest(rc, 163, 124), nearest(rc, 137, 124)] : [nearest(rc, rungs[i - 1].pts[0][0], rungs[i - 1].pts[0][1]), nearest(rc, rungs[i - 1].pts[rungs[i - 1].pts.length - 1][0], rungs[i - 1].pts[rungs[i - 1].pts.length - 1][1])];
      rc.x0 = cross[0]; rc.x1 = cross[1];
    });
    var lacteal = curve([[139, 560], [139, 400], [139.5, 260], [141, 188], [145, 164], [150, 158], [155, 164], [159, 188], [160.5, 260], [161, 400], [161, 560]], false, 2.5);
    return { outer: outer, inner: innerC, cells: cells, nuclei: nuclei, fringe: fringe, art: art, ven: ven, tip: tip, rungs: rungs, routes: routes, lacteal: lacteal, EP: EP, nrm: nrm };
  })();

  /* ---- C: liver cells beside a blood space ---- */
  var LIV = (function () {
    var rows = [[92, 182], [186, 278], [282, 372], [376, 458]];
    var cells = [];
    rows.forEach(function (r, i) {
      cells.push({ x0: 14, x1: 124, y0: r[0], y1: r[1], side: -1, row: i });
      cells.push({ x0: 176, x1: 286, y0: r[0], y1: r[1], side: 1, row: i });
    });
    cells.forEach(function (c, i) {
      var r = rng(300 + i * 17), j = function (a) { return (r() - .5) * a; }, x0 = c.x0, x1 = c.x1, y0 = c.y0, y1 = c.y1;
      /* the side against the blood space stays straight: that is where the cell meets the blood */
      var inner = c.side < 0 ? x1 : x0, outer = c.side < 0 ? x0 : x1, s = c.side < 0 ? -1 : 1;
      c.poly = curve([[inner, y0 + 7], [lerp(inner, outer, .45) + j(10), y0 + j(3)], [outer - s * 7 + j(4), y0 + 3 + j(4)], [outer + j(3), lerp(y0, y1, .45) + j(10)],
                      [outer - s * 4 + j(3), y1 - 6 + j(4)], [lerp(inner, outer, .5) + j(10), y1 + j(3)], [inner, y1 - 7]], true, 3);
      c.cx = (c.x0 + c.x1) / 2; c.cy = (c.y0 + c.y1) / 2;
      c.nx = c.side < 0 ? c.x0 + 34 : c.x1 - 34; c.ny = c.cy + (i % 3 - 1) * 8;
      c.gx = c.side < 0 ? c.x1 - 40 : c.x0 + 26; c.gy = c.cy - 18;       /* where its glycogen sits */
    });
    return { cells: cells };
  })();
  /* a glycogen granule: glucose units joined in branches. The order is the order they are added. */
  var GLY = [[0, 0], [1.7, 0], [3.4, .1], [5.1, .4], [2.5, 1.5], [4.2, 1.8], [2.5, -1.5], [4.1, -1.9], [5.9, -1.7], [5.9, 2.2], [6.8, .5], [7.6, -1.2], [1, 2.9], [7.4, 3], [1.1, -3]];

  /* ---- D: a capillary between two muscle cells ---- */
  var MUS = (function () {
    var mito = [[212, 96], [256, 150], [214, 214], [258, 282], [216, 346], [258, 414], [214, 476], [48, 120], [92, 186], [46, 252], [90, 320], [48, 392], [92, 458]];
    return { mito: mito, target: [216, 346] };
  })();

  /* ================================================================
     THE STEPS
     ================================================================ */
  var STEP_DEF = [
    { t: T.s1, h: 'The aorta', tag: 'C 9.3.3',
      p: 'The left ventricle pumps oxygenated blood into the aorta. Each organ of the body receives its own branch of the aorta.',
      beyond: 'The arteries to the intestine are the mesenteric arteries. The hepatic artery branches from a short artery, the coeliac artery; here it is drawn straight from the aorta.' },
    { t: T.s2, h: 'In a villus: oxygen', tag: 'C 9.3.2',
      p: 'Blood flows through the capillaries of each villus. Oxygen diffuses from the blood into the respiring cells of the villus. The blood becomes deoxygenated.',
      beyond: 'The respiring cells also add carbon dioxide to the blood.' },
    { t: T.s3, h: 'In a villus: absorption', tag: 'S 7.5.5',
      p: 'Glucose and amino acids are absorbed into the blood in the capillaries. Most fat is absorbed into the lacteal instead.',
      later: 'Hours after a meal, the food has already been digested and absorbed. Few glucose and amino acid molecules are left to absorb.',
      beyond: 'Inside the epithelial cells, fatty acids are rebuilt into fat, in tiny droplets. The droplets enter the lacteal and travel in the lymph. The lymph joins the blood in a large vein at the base of the neck, so this fat does not pass through the liver first. Glycerol dissolves in water and enters the capillaries.' },
    { t: T.s4, h: 'The hepatic portal vein', tag: 'S 9.3.6',
      p: 'Veins from the intestine join to form the hepatic portal vein. After a meal, its deoxygenated blood is very rich in glucose and amino acids.',
      later: 'Veins from the intestine join to form the hepatic portal vein. Hours after a meal, its deoxygenated blood carries much less glucose and fewer amino acids.',
      beyond: 'The veins from the intestine are the mesenteric veins. The hepatic portal vein also collects blood from the stomach, the large intestine, the pancreas and the spleen.' },
    { t: T.s5, h: 'In the liver: glucose', tag: 'S 9.3.6 · S 14.4.4',
      p: 'The hepatic artery also brings oxygenated blood. Liver cells convert excess glucose to glycogen and store it. Muscle cells store glycogen too.',
      later: 'The hepatic artery also brings oxygenated blood. Between meals, liver cells convert glycogen to glucose and release it into the blood.',
      beyond: 'The liver removes only part of the glucose absorbed after a meal, roughly a quarter to a third. The muscles store much of the rest as glycogen. So the glucose concentration in the hepatic vein still rises after a meal, but less than in the hepatic portal vein.' },
    { t: T.s6, h: 'In the liver: amino acids', tag: 'S 13.1.6–13.1.8',
      p: 'Liver cells use some amino acids to make proteins, such as fibrinogen. Excess amino acids cannot be stored, so liver cells deaminate them. This forms urea.',
      beyond: 'Deamination removes the nitrogen-containing part of the amino acid as ammonia, which is toxic. Liver cells convert the ammonia to urea. The rest of the amino acid is respired, or converted to glucose or fat.' },
    { t: T.s7, h: 'Back to the heart', tag: 'S 9.3.6 · C 9.3.3',
      p: 'The hepatic veins carry the blood into the vena cava, which returns it to the right atrium. The right ventricle pumps it into the pulmonary artery.',
      beyond: 'There are two venae cavae. Blood from the liver, the kidneys and the legs returns in the inferior vena cava.' },
    { t: T.s8, h: 'Through the lungs', tag: 'C 9.3.3',
      p: 'In the lungs, oxygen diffuses into the blood and carbon dioxide diffuses out. The pulmonary veins carry the oxygenated blood to the left atrium.',
      beyond: 'Each lung receives its own pulmonary artery. Usually four pulmonary veins, two from each lung, return the blood to the left atrium.' },
    { t: T.s9, h: 'Urea to the kidneys', tag: 'C 9.3.3 · C 13.1.2',
      p: 'The aorta and the renal arteries bring urea to the kidneys. The kidneys excrete it in urine, so the renal veins carry less urea.',
      beyond: 'About a fifth of the blood that the heart pumps to the body flows through the kidneys.' },
    { t: T.s10, h: 'Glucose to the respiring cells', tag: 'C 9.3.2',
      p: 'In the capillaries of every organ, glucose and oxygen diffuse into the respiring cells. The cells use them in respiration to release energy.',
      beyond: 'Muscle cells store glycogen too, but they use it themselves. The liver is the organ that releases glucose from glycogen into the blood.' }
  ];

  /* the two readings: glucose in the blood of each vessel, relative. No numbers are drawn; the
     proportions follow the estimate in the header (after a meal: portal about 9, hepatic vein about
     7.5; hours later: portal about 4.9, hepatic vein about 5.4 mmol per dm³). */
  var READ = { portal: [4.9, 9.3], hepatic: [5.4, 7.7], max: 10.5 };

  /* ================================================================
     THE WIDGET
     ================================================================ */
  var UID = 0;
  function bodyflow(spec) {
    var uid = 'bf' + (++UID);
    var box = h('div', 'widget bf');
    box.appendChild(L.head(spec.title || 'After a meal: from the gut to the liver, and on round the body', spec.ask, 'Press play'));
    if (!L.stepper) { box.appendChild(h('p', 'widget__note', 'This animation needs js/w-common.js, loaded before it.')); return box; }

    var meal = 1;                                         /* 1: after a meal · 0: hours later */
    var G = { W: 560, H: 560, font: 16 };
    function layout() {
      G.lh = G.font * 1.2;
      G.GUT = Math.round(G.font * 7.3);
      G.VX = G.GUT; G.VY = 8; G.VW = G.W - 2 * G.GUT; G.VH = G.H - 16;
      G.room = G.GUT - 20;
    }
    layout();
    var FAMILY = 'Inter, system-ui, -apple-system, "Segoe UI", sans-serif';
    var id = function (k) { return uid + k; };

    /* ---------- the drawing ---------- */
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + G.W + ' ' + G.H);
    svg.setAttribute('class', 'bf__svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'An animation in ten steps. The aorta carries oxygenated blood to every organ. In a villus of the small intestine, oxygen leaves the blood. Glucose and amino acids are absorbed into the capillaries, and fat enters the lacteal. The hepatic portal vein carries this blood to the liver, which also receives the hepatic artery. Liver cells store excess glucose as glycogen, make proteins from some amino acids and deaminate the rest, forming urea. The hepatic veins carry the blood to the vena cava and the heart, then through the lungs and back to the heart. The aorta carries urea to the kidneys, which excrete it, and glucose to respiring muscle cells.');

    var defs =
      '<defs>' +
      '<clipPath id="' + id('vp') + '"><rect data-r="vpclip" rx="12"/></clipPath>' +
      '<clipPath id="' + id('lens') + '"><circle data-r="lensclip" r="0"/></clipPath>' +
      '<radialGradient id="' + id('sky') + '" cx=".5" cy=".42" r=".8"><stop offset="0" stop-color="#132834"/><stop offset=".7" stop-color="#0B1820"/><stop offset="1" stop-color="#081218"/></radialGradient>' +
      '<linearGradient id="' + id('skin') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2F3A"/><stop offset="1" stop-color="#132029"/></linearGradient>' +
      '<linearGradient id="' + id('rung') + '" gradientUnits="userSpaceOnUse" x1="194" y1="0" x2="106" y2="0"><stop offset="0" stop-color="' + C.oxy + '"/><stop offset=".25" stop-color="' + C.oxy + '"/><stop offset=".8" stop-color="' + C.deo + '"/><stop offset="1" stop-color="' + C.deo + '"/></linearGradient>' +
      '<linearGradient id="' + id('capD') + '" gradientUnits="userSpaceOnUse" x1="0" y1="540" x2="0" y2="0"><stop offset="0" stop-color="' + C.oxy + '"/><stop offset=".3" stop-color="' + C.oxy + '"/><stop offset=".85" stop-color="' + C.deo + '"/><stop offset="1" stop-color="' + C.deo + '"/></linearGradient>' +
      '<linearGradient id="' + id('sinus') + '" gradientUnits="userSpaceOnUse" x1="0" y1="470" x2="0" y2="80"><stop offset="0" stop-color="#7A4F9A"/><stop offset=".35" stop-color="#5A5CAE"/><stop offset="1" stop-color="' + C.deo + '"/></linearGradient>' +
      '<radialGradient id="' + id('hep') + '" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#BE775D"/><stop offset=".75" stop-color="#A5604A"/><stop offset="1" stop-color="#8E4E3C"/></radialGradient>' +
      '<radialGradient id="' + id('flash') + '"><stop offset="0" stop-color="#FFF6C8" stop-opacity="1"/><stop offset=".5" stop-color="#FFD66B" stop-opacity=".55"/><stop offset="1" stop-color="#FFD66B" stop-opacity="0"/></radialGradient>' +
      /* the substances, drawn once each and used many times; their outlines keep one width at any zoom */
      '<g id="' + id('glu') + '"><path d="M1 0L.5 .866L-.5 .866L-1 0L-.5 -.866L.5 -.866Z" fill="' + C.glu + '" stroke="' + C.gluLine + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('aa') + '"><circle r=".78" fill="' + C.aa + '" stroke="' + C.aaLine + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/><circle data-n="1" cx=".74" cy="-.6" r=".4" fill="' + C.aaN + '" stroke="' + C.ureaLine + '" stroke-width=".9" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('aa0') + '"><circle r=".78" fill="' + C.aa + '" stroke="' + C.aaLine + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('urea') + '"><path d="M0 -1L.82 0L0 1L-.82 0Z" fill="' + C.urea + '" stroke="' + C.ureaLine + '" stroke-width="1.1" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('o2') + '"><circle cx="-.46" r=".56" fill="' + C.o2 + '" stroke="#FFFFFF" stroke-width=".8" vector-effect="non-scaling-stroke"/><circle cx=".46" r=".56" fill="' + C.o2 + '" stroke="#FFFFFF" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('co2') + '"><circle cx="-.78" r=".46" fill="' + C.co2 + '" stroke="#1B252C" stroke-width=".8" vector-effect="non-scaling-stroke"/><circle cx=".78" r=".46" fill="' + C.co2 + '" stroke="#1B252C" stroke-width=".8" vector-effect="non-scaling-stroke"/><circle r=".54" fill="' + C.co2Dark + '" stroke="#1B252C" stroke-width=".8" vector-effect="non-scaling-stroke"/></g>' +
      '<g id="' + id('fat') + '"><circle r="1" fill="' + C.fat + '" stroke="' + C.fatLine + '" stroke-width=".9" vector-effect="non-scaling-stroke"/><circle cx="-.32" cy="-.32" r=".3" fill="#FFFFFF" fill-opacity=".8"/></g>' +
      '<g id="' + id('rbc') + '"><ellipse rx="1" ry=".6" stroke-width=".8" vector-effect="non-scaling-stroke"/><ellipse rx=".42" ry=".2" fill="#000" fill-opacity=".16" stroke="none"/></g>' +
      '<g id="' + id('ring') + '"><circle r="1" fill="none" stroke="#FFFFFF" stroke-width="1.6" vector-effect="non-scaling-stroke"/><circle r="1" fill="#FFFFFF" fill-opacity=".12"/></g>' +
      '</defs>';

    /* ----- scene A, the body: everything that does not move is drawn once ----- */
    function tube(v) {
      var col = v.ure ? '#E3CF7A' : v.a ? C.oxy : C.deo, wall = v.ure ? '#6E5A1F' : v.a ? C.oxyWall : C.deoWall, d = dOf(v.c);
      return '<g class="bf__v" data-v="' + v.id + '">' +
        '<path d="' + d + '" fill="none" stroke="' + wall + '" stroke-width="' + n2(v.w + (v.a ? 2.4 : 1.4)) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + v.w + '" stroke-linecap="round" stroke-linejoin="round"/>' +
        '<path d="' + d + '" fill="none" stroke="#FFFFFF" stroke-opacity=".16" stroke-width="' + n2(Math.max(.8, v.w * .22)) + '" stroke-linecap="round" transform="translate(' + n2(-v.w * .18) + ',' + n2(-v.w * .12) + ')"/>' +
        '</g>';
    }
    /* a capillary bed in an organ: points in the region, joined to their near neighbours; each piece
       coloured by how far it lies between the artery (in) and the vein (out) */
    function bedNet(poly, inP, outP, sp, seed, lung, box4) {
      var rand = rng(seed), pts = [], x, y, i;
      for (y = box4[1] + sp / 2; y < box4[3]; y += sp * .86)
        for (x = box4[0] + sp / 2 + ((Math.round(y / sp) % 2) ? sp / 2 : 0); x < box4[2]; x += sp) {
          var px = x + (rand() - .5) * sp * .7, py = y + (rand() - .5) * sp * .7;
          if (poly(px, py)) pts.push([px, py]);
        }
      function tOf(p) { var a = Math.hypot(p[0] - inP[0], p[1] - inP[1]), c = Math.hypot(p[0] - outP[0], p[1] - outP[1]); return a / (a + c + 1e-6); }
      var out = '', seen = {};
      pts.forEach(function (p, i2) {
        pts.map(function (q, j) { return [j, Math.hypot(q[0] - p[0], q[1] - p[1])]; })
          .filter(function (e) { return e[0] !== i2 && e[1] < sp * 1.35; }).sort(function (u, v) { return u[1] - v[1]; }).slice(0, 3)
          .forEach(function (e) {
            var j = e[0], key = i2 < j ? i2 + '-' + j : j + '-' + i2; if (seen[key]) return; seen[key] = 1;
            var q = pts[j], k = (tOf(p) + tOf(q)) / 2, kk = clamp01((k - .25) / .5);
            out += '<path d="M' + n2(p[0]) + ' ' + n2(p[1]) + 'Q' + n2((p[0] + q[0]) / 2 + (rand() - .5) * sp * .35) + ' ' + n2((p[1] + q[1]) / 2 + (rand() - .5) * sp * .35) + ' ' + n2(q[0]) + ' ' + n2(q[1]) + '" stroke="' + (lung ? mix(C.deo, C.oxy, kk) : mix(C.oxy, C.deo, kk)) + '"/>';
          });
      });
      return '<g fill="none" stroke-width=".9" stroke-opacity=".7" stroke-linecap="round">' + out + '</g>';
    }
    function polyTest(c) { return function (x, y) { return inPoly(c.pts, x, y); }; }
    function ellTest(cx, cy, rx, ry) { return function (x, y) { var dx = (x - cx) / rx, dy = (y - cy) / ry; return dx * dx + dy * dy <= 1; }; }

    var body = '';
    if (ART && ART.skin && ART.skin.d) {
      body += '<g transform="translate(' + ART.skin.tx + ',' + ART.skin.ty + ')"><path d="' + ART.skin.d + '" fill="url(#' + id('skin') + ')" stroke="#48697A" stroke-width="1.3"/></g>';
    }
    /* behind the organs */
    body += '<g class="bf__back">';
    VES.filter(function (v) { return v.z < 0; }).forEach(function (v) { body += v.ure ? '<g opacity=".5">' + tube(v) + '</g>' : tube(v); });
    VES.filter(function (v) { return v.z === 0; }).forEach(function (v) { body += tube(v); });
    VES.filter(function (v) { return v.z === .5; }).forEach(function (v) { body += tube(v); });
    body += '</g>';
    /* the organs */
    body += '<g class="bf__organs">' +
      '<path d="' + dOf(ORG.lungR, 1) + '" fill="#E7B4BE" fill-opacity=".13" stroke="#F0C8D0" stroke-opacity=".5" stroke-width="1.2"/>' +
      '<path d="' + dOf(ORG.lungL, 1) + '" fill="#E7B4BE" fill-opacity=".13" stroke="#F0C8D0" stroke-opacity=".5" stroke-width="1.2"/>' +
      bedNet(polyTest(ORG.lungR), hp([-30, 160]), hp([-30, 214]), 15, 11, true, [500, 514, 606, 790]) +
      bedNet(polyTest(ORG.lungL), hp([430, 145]), hp([430, 220]), 15, 23, true, [700, 514, 787, 792]) +
      '<path d="' + dOf(ORG.kidR, 1) + '" fill="#A8584A" fill-opacity=".5" stroke="#D89A86" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<path d="' + dOf(ORG.kidL, 1) + '" fill="#A8584A" fill-opacity=".5" stroke="#D89A86" stroke-opacity=".6" stroke-width="1.2"/>' +
      '<path d="' + dOf(ORG.liver, 1) + '" fill="#9A4A3C" fill-opacity=".5" stroke="#D08A74" stroke-opacity=".7" stroke-width="1.3"/>' +
      '<path d="' + dOf(ORG.gut) + '" fill="none" stroke="#6E4336" stroke-opacity=".75" stroke-width="19" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + dOf(ORG.gut) + '" fill="none" stroke="#C99280" stroke-opacity=".62" stroke-width="15.5" stroke-linecap="round" stroke-linejoin="round"/>' +
      '<path d="' + dOf(ORG.gut) + '" fill="none" stroke="#F3D2BE" stroke-opacity=".28" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="translate(-1,-2)"/>' +
      bedNet(ellTest(592, 1248, 24, 13), [600, 1238], [586, 1238], 8, 41, false, [566, 1234, 618, 1262]) +
      bedNet(ellTest(736, 1248, 24, 13), [728, 1238], [742, 1238], 8, 43, false, [710, 1234, 762, 1262]) +
      '</g>';
    /* the vessels inside the liver, faint */
    body += '<g class="bf__inliver" opacity=".55">';
    LIVER_IN.forEach(function (v) { body += '<path d="' + dOf(v.c) + '" fill="none" stroke="' + (v.a ? C.oxy : C.deo) + '" stroke-width="' + v.w + '" stroke-linecap="round"/>'; });
    body += '</g>';
    /* in front of the organs */
    body += '<g class="bf__front">';
    VES.filter(function (v) { return v.z === 1; }).forEach(function (v) { body += tube(v); });
    body += '</g><g class="bf__inside" opacity=".85">';
    VES.filter(function (v) { return v.z === 2; }).forEach(function (v) { body += tube(v); });
    body += '</g>';
    /* the glow that names a vessel in a step: under the heart, over everything else */
    body += '<g data-r="glow" class="bf__glow"></g>';
    body += '<g class="bf__heart" transform="translate(' + n4(HT.cx - HT.ox * HT.s) + ',' + n4(HT.cy - HT.oy * HT.s) + ') scale(' + HT.s + ')">' + (HA ? HA.svg({ av: 1, sl: 0 }, { mode: 'section' }) : '') + '</g>';
    body += '<g data-r="cellsA"></g><g data-r="dotsA"></g>';

    /* ----- scene B: the villus ----- */
    var vb = VIL, villus = '';
    villus += '<rect x="-60" y="-60" width="420" height="680" fill="#1D1611"/>';
    /* the neighbours, out of focus */
    villus += '<path d="M-70 560C-68 380-60 240-40 170C-26 120 6 118 20 170C36 240 42 380 44 560Z" fill="#5A3A36" fill-opacity=".45"/>' +
              '<path d="M256 560C258 380 264 240 282 170C296 120 330 118 344 170C362 240 368 380 370 560Z" fill="#5A3A36" fill-opacity=".45"/>';
    /* chyme: the digested food in the lumen, a haze of fine specks */
    (function () {
      var r = rng(77), s = '';
      for (var i = 0; i < 90; i++) { var x = r() * 300, y = r() * 520; if (x > 60 && x < 240 && y > 70) continue; s += '<circle cx="' + n2(x) + '" cy="' + n2(y) + '" r="' + n2(.8 + r() * 1.4) + '"/>'; }
      villus += '<g fill="#C8A86A" fill-opacity=".22">' + s + '</g>';
    })();
    var epi = 'M' + vb.outer.pts.map(function (p) { return n2(p[0]) + ' ' + n2(p[1]); }).join('L') + 'L' + vb.inner.pts.slice().reverse().map(function (p) { return n2(p[0]) + ' ' + n2(p[1]); }).join('L') + 'Z';
    var core = 'M' + vb.inner.pts.map(function (p) { return n2(p[0]) + ' ' + n2(p[1]); }).join('L') + 'Z';
    villus += '<path d="' + core + '" fill="#2F1B1D"/>';
    villus += '<g class="bf__caps">' +
      vb.rungs.map(function (r) { return '<path d="' + dOf(r) + '" fill="none" stroke="#12090A" stroke-width="6.4" stroke-linecap="round"/><path d="' + dOf(r) + '" fill="none" stroke="url(#' + id('rung') + ')" stroke-width="4.4" stroke-linecap="round"/>'; }).join('') +
      '<path d="' + dOf(vb.art) + '" fill="none" stroke="' + C.oxyWall + '" stroke-width="8.4" stroke-linecap="round"/><path d="' + dOf(vb.art) + '" fill="none" stroke="' + C.oxy + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="' + dOf(vb.ven) + '" fill="none" stroke="' + C.deoWall + '" stroke-width="8.4" stroke-linecap="round"/><path d="' + dOf(vb.ven) + '" fill="none" stroke="' + C.deo + '" stroke-width="6" stroke-linecap="round"/>' +
      '<path d="' + dOf(vb.tip) + '" fill="none" stroke="#12090A" stroke-width="6.4" stroke-linecap="round"/><path d="' + dOf(vb.tip) + '" fill="none" stroke="url(#' + id('rung') + ')" stroke-width="4.6" stroke-linecap="round"/>' +
      '</g>';
    villus += '<path d="' + dOf(vb.lacteal) + '" fill="#EADCB8" fill-opacity=".82" stroke="#FFF4DA" stroke-width="1.2"/>';
    villus += '<path d="' + epi + '" fill="#8E5A55" stroke="none"/>';
    villus += '<path d="' + vb.cells.map(function (c) { return 'M' + n2(c[0]) + ' ' + n2(c[1]) + 'L' + n2(c[2]) + ' ' + n2(c[3]); }).join('') + '" stroke="#C99A92" stroke-width=".9" fill="none"/>';
    villus += vb.nuclei.map(function (q) { return '<ellipse cx="' + n2(q[0]) + '" cy="' + n2(q[1]) + '" rx="5.2" ry="2.9" transform="rotate(' + n2(q[2]) + ' ' + n2(q[0]) + ' ' + n2(q[1]) + ')" fill="#3E2436" stroke="#6A4658" stroke-width=".6"/>'; }).join('');
    villus += '<path d="' + dOf(vb.outer) + '" fill="none" stroke="#E7B3A8" stroke-width="1.3"/>';
    villus += '<path d="' + vb.fringe + '" stroke="#F4CBBF" stroke-width="1" stroke-linecap="round" fill="none"/>';
    villus += '<path d="' + dOf(vb.inner) + '" fill="none" stroke="#5E3A3A" stroke-width="1"/>';
    villus += '<g data-r="cellsB"></g><g data-r="dotsB"></g>';

    /* ----- scene C: liver cells beside a blood space ----- */
    var lv = LIV, livr = '';
    livr += '<rect x="-60" y="-60" width="420" height="680" fill="#3A1A16"/>';
    /* the neighbouring blood spaces at the edges, and the plates of cells beyond them */
    livr += '<rect x="-60" y="86" width="68" height="378" fill="#26121A"/><rect x="292" y="86" width="68" height="378" fill="#26121A"/>';
    livr += '<rect x="126" y="86" width="48" height="382" fill="url(#' + id('sinus') + ')" fill-opacity=".5"/>';
    livr += '<path d="M127 470V86M173 470V86" stroke="#E6D7EA" stroke-opacity=".55" stroke-width="1.2" stroke-dasharray="9 4" fill="none"/>';
    lv.cells.forEach(function (c) {
      livr += '<path d="' + dOf(c.poly, 1) + '" fill="url(#' + id('hep') + ')" stroke="#E6AA8E" stroke-width="1.4" stroke-linejoin="round"/>' +
              '<circle cx="' + c.nx + '" cy="' + c.ny + '" r="12" fill="#5A2A33" stroke="#8F5260" stroke-width="1"/><circle cx="' + (c.nx + 3) + '" cy="' + (c.ny - 3) + '" r="3.4" fill="#2E1319"/>';
    });
    /* the central vein at the top, and at the bottom a branch of the hepatic portal vein and a branch of the hepatic artery */
    livr += '<path d="M-60 60H360" stroke="' + C.deoWall + '" stroke-width="48" fill="none"/><path d="M-60 60H360" stroke="' + C.deo + '" stroke-width="44" fill="none"/>' +
            '<path d="M130 84Q150 76 170 84" stroke="' + C.deo + '" stroke-width="10" fill="none"/>';
    livr += '<path d="M-60 492H360" stroke="' + C.deoWall + '" stroke-width="34" fill="none"/><path d="M-60 492H360" stroke="' + C.deo + '" stroke-width="30" fill="none"/>' +
            '<path d="M-60 521H360" stroke="' + C.oxyWall + '" stroke-width="15" fill="none"/><path d="M-60 521H360" stroke="' + C.oxy + '" stroke-width="12" fill="none"/>' +
            '<path d="M132 480Q150 466 168 480" stroke="' + C.deo + '" stroke-width="12" fill="none"/>' +
            '<path d="M178 516C176 502 170 488 164 474" stroke="' + C.oxyWall + '" stroke-width="7.4" fill="none" stroke-linecap="round"/><path d="M178 516C176 502 170 488 164 474" stroke="' + C.oxy + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
    livr += '<g data-r="glyC"></g><g data-r="cellsC"></g><g data-r="dotsC"></g>';

    /* ----- scene D: a capillary between two muscle cells ----- */
    var mus = MUS, musr = '';
    musr += '<rect x="-60" y="-60" width="420" height="680" fill="#1C1214"/>';
    [[4, 128], [172, 296]].forEach(function (f, fi) {
      musr += '<rect x="' + f[0] + '" y="-40" width="' + (f[1] - f[0]) + '" height="620" rx="14" fill="#8E3F3E" stroke="#C26A62" stroke-width="1.4"/>';
      var st = '';
      for (var y = -36; y < 580; y += 9) st += 'M' + (f[0] + 4) + ' ' + y + 'H' + (f[1] - 4);
      musr += '<path d="' + st + '" stroke="#5E2426" stroke-opacity=".55" stroke-width="3" fill="none"/>';
      for (var yy = 40; yy < 560; yy += 150) musr += '<ellipse cx="' + (fi ? f[1] - 7 : f[0] + 7) + '" cy="' + (yy + fi * 60) + '" rx="4.2" ry="16" fill="#3E1E2C" stroke="#6D3E52" stroke-width=".8"/>';
    });
    mus.mito.forEach(function (m, i) {
      musr += '<g transform="translate(' + m[0] + ' ' + m[1] + ') rotate(' + (i % 2 ? 8 : -6) + ')"><ellipse rx="15" ry="7.5" fill="#D78A61" stroke="#8E4E2E" stroke-width="1"/><path d="M-9 -3.5V3.5M-4 -5V5M1 -5V5M6 -4V4M10 -2.5V2.5" stroke="#8E4E2E" stroke-width="1" fill="none"/></g>';
    });
    musr += '<rect x="132" y="-40" width="36" height="620" fill="#241A20"/>';
    musr += '<path d="M136 580V-40" stroke="url(#' + id('capD') + ')" stroke-width="3" fill="none"/><path d="M164 580V-40" stroke="url(#' + id('capD') + ')" stroke-width="3" fill="none"/>';
    musr += '<rect x="138" y="-40" width="24" height="620" fill="url(#' + id('capD') + ')" fill-opacity=".35"/>';
    musr += '<g data-r="glyD"></g><g data-r="cellsD"></g><g data-r="dotsD"></g>';

    svg.innerHTML = defs +
      '<rect class="bf__bg" width="' + G.W + '" height="' + G.H + '" rx="16"/>' +
      '<rect data-r="view" class="bf__view" rx="12" fill="url(#' + id('sky') + ')"/>' +
      '<g clip-path="url(#' + id('vp') + ')">' +
        '<g data-r="A"><g data-r="camA">' + body + '</g></g>' +
        '<g data-r="M" clip-path="url(#' + id('lens') + ')">' +
          '<rect data-r="mbg" fill="#120C0A"/>' +
          '<g data-r="B" style="display:none">' + villus + '</g>' +
          '<g data-r="C" style="display:none">' + livr + '</g>' +
          '<g data-r="D" style="display:none">' + musr + '</g>' +
        '</g>' +
        '<circle data-r="rim" class="bf__rim" r="0"/>' +
        '<g data-r="tagline" class="bf__tagline"><rect data-r="tagbg" rx="9"/><text data-r="tagtx"></text></g>' +
      '</g>' +
      '<rect data-r="viewline" class="bf__viewline" rx="12"/>' +
      '<g data-r="labels"></g>';

    var R = {};
    Array.prototype.forEach.call(svg.querySelectorAll('[data-r]'), function (el) { R[el.getAttribute('data-r')] = el; });
    var heartG = svg.querySelector('.bf__heart');
    var HN = heartG ? { outer: heartG.querySelector('.ha__outer'), ra: heartG.querySelector('.ha__ra'), la: heartG.querySelector('.ha__la'), rv: heartG.querySelector('.ha__rv'), lv: heartG.querySelector('.ha__lv'),
                        av: heartG.querySelector('.ha__av'), sl: heartG.querySelector('.ha__sl'), cords: heartG.querySelectorAll('.ha__cords line') } : {};

    function mk(tag, attrs, parent) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; }
    function use(sym, parent) { var e = mk('use', { href: '#' + id(sym) }, parent); e.style.display = 'none'; return e; }
    function place(e, x, y, r, deg, op, sx) {
      if (!(op > .01)) { if (e.__on !== 0) { e.style.display = 'none'; e.__on = 0; } return; }
      if (e.__on !== 1) { e.style.display = ''; e.__on = 1; }
      e.setAttribute('transform', 'translate(' + n2(x) + ' ' + n2(y) + ')' + (deg ? ' rotate(' + n2(deg) + ')' : '') + ' scale(' + n4(r * (sx || 1)) + ' ' + n4(r) + ')');
      e.setAttribute('opacity', n2(Math.min(1, op)));
    }

    /* ----- the red cells of the body: on every vessel, moving with the flow ----- */
    var FLOW = [];
    VES.forEach(function (v) {
      if (v.ure) return;
      var g = mk('g', {}, R.cellsA), n = Math.max(1, Math.floor(v.c.total / (v.w > 7 ? 15 : 19))), r = rng(v.c.total * 13 | 0);
      var f = { v: v, g: g, cells: [], speed: v.a ? 34 : 22, pulse: !!v.a };
      for (var i = 0; i < n; i++) { var e = use('rbc', g); e.setAttribute('fill', v.a ? C.oxyCell : C.deoCell); e.setAttribute('stroke', v.a ? '#7A1E21' : '#1B3570'); f.cells.push({ e: e, s0: (i + r() * .6) * v.c.total / n }); }
      FLOW.push(f);
    });
    /* through the lungs: a few loops from the pulmonary arteries to the pulmonary veins, where the cells turn red */
    var LUNGRUN = [
      curve([hp([-30, 160]), [522, 590], [512, 560], [522, 540], [540, 556], [546, 590], hp([-30, 200])], false, 3),
      curve([hp([-30, 160]), [528, 640], [516, 690], [530, 720], [552, 690], [548, 650], hp([-30, 236])], false, 3),
      curve([hp([430, 145]), [768, 588], [782, 612], [779, 648], [764, 660], [756, 640], hp([430, 192])], false, 3),
      curve([hp([430, 145]), [760, 560], [752, 532], [736, 540], [742, 574], hp([430, 192])], false, 3),
      curve([hp([430, 150]), [770, 680], [772, 730], [752, 736], [748, 690], hp([430, 248])], false, 3)
    ];
    LUNGRUN.forEach(function (c, k) {
      var g = mk('g', {}, R.cellsA), n = Math.floor(c.total / 17), f = { lung: 1, c: c, g: g, cells: [], speed: 16 };
      for (var i = 0; i < n; i++) { var e = use('rbc', g); e.setAttribute('stroke', '#1B2A3A'); f.cells.push({ e: e, s0: (i + .3 * (k % 2)) * c.total / n }); }
      f.v = { c: c, a: 0 };
      FLOW.push(f);
    });

    /* ----- the substances in the body (A): streams that run in some steps ----- */
    function stream(c, sym, n, speed, seed) {
      var r = rng(seed), g = R.dotsA, s = { c: c, sym: sym, speed: speed, items: [] };
      for (var i = 0; i < n; i++) s.items.push({ e: use(sym, g), s0: (i + r() * .7) * c.total / n, th: r(), dx: (r() - .5) * .5 });
      return s;
    }
    var gutVeins = [0, 1, 2, 3, 4].map(function (i) { return chain([VI['mv' + i].c, sub(VI.portal.c, nearest(VI.portal.c, VI['mv' + i].p[2][0], VI['mv' + i].p[2][1]), VI.portal.c.total)]); });
    var ST = {
      portGlu: gutVeins.map(function (c, i) { return stream(c, 'glu', 6, 20, 100 + i); }),
      portAa: gutVeins.map(function (c, i) { return stream(c, 'aa', 5, 20, 200 + i); }),
      hepGlu: ['hepVR', 'hepVM', 'hepVL'].map(function (k, i) { return stream(chain([VI[k].c, curve([VI[k].p[VI[k].p.length - 1], IVC0], false, 3)]), 'glu', 3, 16, 300 + i); }),
      hepUrea: ['hepVR', 'hepVM', 'hepVL'].map(function (k, i) { return stream(chain([VI[k].c, curve([VI[k].p[VI[k].p.length - 1], IVC0], false, 3)]), 'urea', 3, 16, 400 + i); }),
      renA: [stream(VI.renAL.c, 'urea', 4, 24, 500), stream(VI.renAR.c, 'urea', 6, 24, 501), stream(sub(VI.aoAbd.c, nearest(VI.aoAbd.c, 664, 852), nearest(VI.aoAbd.c, 664, 1040)), 'urea', 7, 30, 502)],
      renV: [stream(VI.renVL.c, 'urea', 4, 16, 600), stream(VI.renVR.c, 'urea', 2, 16, 601)],
      ure: [stream(VI.ureL.c, 'urea', 7, 9, 700), stream(VI.ureR.c, 'urea', 7, 9, 701)],
      lungO2: [], lungCo2: []
    };
    /* in the lungs: oxygen moving in from the air, carbon dioxide moving out */
    (function () {
      var r = rng(808);
      for (var i = 0; i < 16; i++) {
        var c = LUNGRUN[2 + (i % 3)], s = c.total * (.25 + .5 * r()), p = at(c, s), ang = r() * Math.PI * 2, far = 14 + r() * 10;
        ST.lungO2.push({ e: use('o2', R.dotsA), from: [p.x + Math.cos(ang) * far, p.y + Math.sin(ang) * far], to: [p.x, p.y], ph: r() });
        var ang2 = r() * Math.PI * 2;
        ST.lungCo2.push({ e: use('co2', R.dotsA), from: [p.x, p.y], to: [p.x + Math.cos(ang2) * far, p.y + Math.sin(ang2) * far], ph: r() });
      }
    })();
    /* the two molecules the story follows, with a ring round each */
    var TR = { G: { ring: use('ring', R.dotsA), e: use('glu', R.dotsA) }, A: { ring: use('ring', R.dotsA), e: use('aa', R.dotsA) }, U: { ring: use('ring', R.dotsA), e: use('urea', R.dotsA) } };

    /* ----- scene B: red cells, oxygen, food ----- */
    var BF = { cells: [], o2: [], food: [], fat: [] };
    VIL.routes.forEach(function (c, k) {
      var n = Math.floor(c.total / 22);
      for (var i = 0; i < n; i++) { var e = use('rbc', R.cellsB); e.setAttribute('stroke', '#20141A'); BF.cells.push({ e: e, c: c, s0: (i + (k % 3) * .33) * c.total / n }); }
    });
    (function () {
      var r = rng(901), ni;
      for (ni = 0; ni < 20; ni++) {
        var k = 1 + (ni % 6), c = VIL.routes[k], s = lerp(c.x0, c.x1, .15 + .6 * r()), p = at(c, s);
        /* out to the nearest epithelial cell */
        var best = null, bd = Infinity;
        VIL.inner.pts.forEach(function (q, qi) { var d = Math.hypot(q[0] - p.x, q[1] - p.y); if (d < bd) { bd = d; best = qi; } });
        var q = VIL.inner.pts[best], nn = VIL.nrm[Math.min(best, VIL.nrm.length - 1)];
        BF.o2.push({ e: use('o2', R.dotsB), from: [p.x, p.y], to: [q[0] - nn[0] * VIL.EP * .45, q[1] - nn[1] * VIL.EP * .45], ph: r() });
      }
      /* glucose and amino acids in the lumen: each is absorbed at a point of the villus surface, crosses
         an epithelial cell, and joins the blood in the nearest capillary */
      var sides = [];
      for (ni = 0; ni < 16; ni++) sides.push(ni);
      sides.forEach(function (i) {
        var s = lerp(40, VIL.outer.total - 40, (i + .5) / 16) + (r() - .5) * 8, j = 0;
        while (j < VIL.outer.len.length - 1 && VIL.outer.len[j] < s) j++;
        var p = VIL.outer.pts[j], nn = VIL.nrm[j];
        var inP = [p[0] + nn[0] * (VIL.EP + 3), p[1] + nn[1] * (VIL.EP + 3)];
        /* the capillary route nearest to where it comes through */
        var bestR = 1, bestS = 0, bd2 = Infinity;
        VIL.routes.forEach(function (rc, ri) {
          for (var q = 0; q < rc.pts.length; q += 2) { var d = Math.hypot(rc.pts[q][0] - inP[0], rc.pts[q][1] - inP[1]); if (d < bd2) { bd2 = d; bestR = ri; bestS = rc.len[q]; } }
        });
        BF.food.push({ e: use(i % 2 ? 'aa' : 'glu', R.dotsB), sym: i % 2 ? 'aa' : 'glu', out: [p[0] - nn[0] * (18 + r() * 22), p[1] - nn[1] * (18 + r() * 22)], edge: [p[0], p[1]], inP: inP,
                       route: VIL.routes[bestR], rs: bestS, t0: 17.5 + (i * 0.29) % 4.2 + r() * .25, rank: r() });
      });
      /* fat, into the lacteal */
      for (ni = 0; ni < 7; ni++) {
        var s2 = lerp(90, VIL.outer.total - 90, (ni + .5) / 7), j2 = 0;
        while (j2 < VIL.outer.len.length - 1 && VIL.outer.len[j2] < s2) j2++;
        var p2 = VIL.outer.pts[j2], n2v = VIL.nrm[j2];
        var ly = Math.max(175, Math.min(520, p2[1] + 8));
        BF.fat.push({ e: use('fat', R.dotsB), edge: [p2[0], p2[1]], inP: [p2[0] + n2v[0] * VIL.EP, p2[1] + n2v[1] * VIL.EP],
                      lac: [150 + (p2[0] < 150 ? -5 : 5), ly], t0: 18 + ni * .52, rank: r() });
      }
    })();
    /* the two the story follows, in the villus: one glucose and one amino acid, on the left side */
    function pickFood(sym, want) { var best = null; BF.food.forEach(function (f) { if (f.sym === sym && !f.tracer && (!best || Math.abs(f.edge[1] - want) < Math.abs(best.edge[1] - want)) && f.edge[0] < 150) best = f; }); return best; }
    var fG = pickFood('glu', 250), fA = pickFood('aa', 330);
    fG.tracer = 'G'; fG.t0 = 17.7; fA.tracer = 'A'; fA.t0 = 18.4;
    var TRB = { G: { ring: use('ring', R.dotsB) }, A: { ring: use('ring', R.dotsB) } };

    /* ----- scene C: the liver ----- */
    var CF = { cells: [], glu: [], gly: [], events: [], aa: [] };
    (function () {
      var r = rng(1201), i;
      for (i = 0; i < 26; i++) {
        var e = use('rbc', R.cellsC); e.setAttribute('stroke', '#20141A');
        CF.cells.push({ e: e, x: 138 + r() * 24, s0: r() * 420, red: i % 3 === 0, sp: 18 + r() * 6 });
      }
      for (i = 0; i < 16; i++) CF.glu.push({ e: use('glu', R.glyC), x: 136 + r() * 28, s0: r() * 420, th: r(), sp: 15 + r() * 5 });
      for (i = 0; i < 10; i++) CF.aa.push({ e: use('aa', R.glyC), x: 136 + r() * 28, s0: r() * 420, th: r(), sp: 15 + r() * 5 });
      /* each cell's glycogen: the units as elements, shown as many as it has */
      LIV.cells.forEach(function (c, ci) {
        c.gang = (ci * 47) % 50 - 25;
        var g = mk('g', { transform: 'translate(' + c.gx + ' ' + c.gy + ') rotate(' + c.gang + ')' }, R.glyC), units = [];
        GLY.forEach(function (u) { var e = mk('use', { href: '#' + id('glu'), transform: 'translate(' + n2(u[0] * 5.4 * (c.side < 0 ? -1 : 1)) + ' ' + n2(u[1] * 5.4) + ') scale(3.1)' }, g); units.push(e); });
        CF.gly.push({ g: g, units: units, cell: c, seed: ci });
      });
      /* glucose between the blood and the cells: after a meal it goes into the cells and onto the
         glycogen; hours later it comes off the glycogen and out into the blood */
      for (i = 0; i < 10; i++) {
        var c = LIV.cells[(i * 3) % 8], ty = c.cy + (r() - .5) * 40;
        CF.events.push({ e: use('glu', R.dotsC), cell: c, bx: c.side < 0 ? 140 : 160, by: ty + 30, t0: 36.6 + i * .5 + r() * .2 });
      }
    })();
    /* step 6: four amino acids join into a protein (fibrinogen); one is deaminated and its nitrogen
       leaves as urea; more are deaminated in other cells */
    var PROT = { cell: LIV.cells[3], parts: [], chain: mk('g', {}, R.dotsC) };
    (function () {
      var c = PROT.cell;
      for (var i = 0; i < 4; i++) PROT.parts.push({ e: use('aa0', R.dotsC), from: [160, c.cy + 40 - i * 8], at: [c.x0 + 30 + i * 13, c.cy + 18 + (i % 2) * 6], t0: 43.6 + i * .45 });
      PROT.links = mk('path', { fill: 'none', stroke: C.aaLine, 'stroke-width': 2.2, 'stroke-linecap': 'round' }, PROT.chain);
      PROT.beads = []; for (var k = 0; k < 4; k++) PROT.beads.push(use('aa0', PROT.chain));
    })();
    var DEAM = [
      { cell: LIV.cells[4], t0: 43.8, tracer: true },
      { cell: LIV.cells[1], t0: 44.6 },
      { cell: LIV.cells[6], t0: 45.2 },
      { cell: LIV.cells[7], t0: 45.9 }
    ];
    DEAM.forEach(function (d, i) {
      d.aa = use('aa0', R.dotsC); d.n = mk('circle', { r: 2.4, fill: C.aaN, stroke: C.ureaLine, 'stroke-width': .9 }, R.dotsC); d.n.style.display = 'none';
      d.urea = use('urea', R.dotsC); d.rest = use('aa0', R.dotsC);
      var c = d.cell;
      d.inAt = [c.side < 0 ? c.x1 - 26 : c.x0 + 26, c.cy + 12];
      d.from = [c.side < 0 ? 142 : 158, c.cy + 52];
      d.out = [c.side < 0 ? 142 : 158, c.cy + 2];
    });
    var TRC = { G: { ring: use('ring', R.dotsC), e: use('glu', R.dotsC) }, A: { ring: use('ring', R.dotsC) }, U: { ring: use('ring', R.dotsC) } };

    /* ----- scene D: the muscle ----- */
    var DF = { cells: [], o2: [], glu: [], co2: [] };
    (function () {
      var r = rng(1501), i;
      for (i = 0; i < 24; i++) { var e = use('rbc', R.cellsD); e.setAttribute('stroke', '#20141A'); DF.cells.push({ e: e, x: 144 + r() * 12, s0: i * 25, sp: 26 }); }
      for (i = 0; i < 14; i++) {
        var m = MUS.mito[i % MUS.mito.length], y = 520 - (i * 37) % 480;
        DF.o2.push({ e: use('o2', R.dotsD), from: [150 + (m[0] > 150 ? 6 : -6), y], to: [m[0] + (r() - .5) * 14, m[1] + (r() - .5) * 8], ph: r() });
      }
      for (i = 0; i < 7; i++) { var m2 = MUS.mito[(i * 3 + 1) % MUS.mito.length]; DF.glu.push({ e: use('glu', R.dotsD), from: [150, m2[1] + 40], to: [m2[0] + (r() - .5) * 10, m2[1] + 10], ph: r() }); }
      for (i = 0; i < 9; i++) { var m3 = MUS.mito[(i * 5 + 2) % MUS.mito.length]; DF.co2.push({ e: use('co2', R.dotsD), from: [m3[0], m3[1] - 8], to: [150 + (r() - .5) * 10, m3[1] - 30], ph: r() }); }
      DF.gly = [];
      [[236, 180], [60, 290], [240, 440], [64, 150]].forEach(function (p, gi) {
        var g = mk('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')' }, R.glyD);
        GLY.slice(0, 7).forEach(function (u) { mk('use', { href: '#' + id('glu'), transform: 'translate(' + n2(u[0] * 4.4) + ' ' + n2(u[1] * 4.4) + ') scale(2.5)' }, g); });
        DF.gly.push(g);
      });
    })();
    var TRD = { G: { ring: use('ring', R.dotsD), e: use('glu', R.dotsD) }, flash: mk('circle', { r: 0, fill: 'url(#' + id('flash') + ')' }, R.dotsD), co2a: use('co2', R.dotsD), co2b: use('co2', R.dotsD), o2: use('o2', R.dotsD) };

    /* ================================================================
       THE CAMERA
       ================================================================ */
    function fitBox(b) { var z = Math.min(G.VW / b.w, G.VH / b.h); return [b.x + b.w / 2, b.y + b.h / 2, z]; }
    function mixCam(p, q, k) {
      k = clamp01(k);
      if (k === 0) return p; if (k === 1) return q;
      var sc = p[2] * Math.pow(q[2] / p[2], k);
      /* move the centre as fast as the view narrows, so what is zoomed into stays in view */
      var kc = Math.abs(q[2] - p[2]) < 1e-6 ? k : (1 / p[2] - 1 / sc) / (1 / p[2] - 1 / q[2]);
      return [lerp(p[0], q[0], kc), lerp(p[1], q[1], kc), sc];
    }
    function around(p, w, hh, dy) { return fitBox({ x: p.x - w / 2, y: p.y - hh / 2 + (dy || 0), w: w, h: hh }); }
    function camA(t) {
      var V = VIEW, c;
      if (t < T.s2) return fitBox(V.trunk);
      if (t < T.s4) return mixCam(fitBox(V.trunk), fitBox(V.gutSpot), ease(seg(t, 8, 9.8)));
      if (t < T.s5) {
        return mixCam(fitBox(V.gutSpot), fitBox(V.portWide), ease(seg(t, 25.1, 27.4)));
      }
      if (t < T.s7) return mixCam(fitBox(V.portWide), fitBox(V.livSpot), ease(seg(t, 34, 35.6)));
      if (t < T.s8) {
        c = mixCam(fitBox(V.livSpot), fitBox(V.livUp), ease(seg(t, 51.1, 52.9)));
        var p7 = journey(J7, t, 52.4, 59.4);
        c = mixCam(c, around({ x: lerp(p7.x, 640, .6), y: p7.y }, 210, 250, -30), ease(seg(t, 52.7, 54.4)));
        return mixCam(c, fitBox(V.liverHeart), ease(seg(t, 56.2, 58.6)));
      }
      if (t < T.s9) return mixCam(fitBox(V.liverHeart), fitBox(V.chestL), ease(seg(t, 60, 61.8)));
      if (t < T.s10) {
        c = mixCam(fitBox(V.chestL), fitBox(V.desc), ease(seg(t, 68.6, 71)));
        return mixCam(c, fitBox(V.kidney), ease(seg(t, 71.2, 73.2)));
      }
      c = fitBox(V.kidney);
      c = mixCam(c, fitBox({ x: 560, y: 1010, w: 170, h: 250 }), ease(seg(t, 78, 79.4)));
      return mixCam(c, fitBox(V.legSpot), ease(seg(t, 79.2, 81)));
    }
    function toScreen(cam, x, y) { return [G.VX + G.VW / 2 + cam[2] * (x - cam[0]), G.VY + G.VH / 2 + cam[2] * (y - cam[1])]; }
    function microFit() { var z = Math.min(G.VW / MW, G.VH / MH); return { z: z, x: G.VX + (G.VW - MW * z) / 2, y: G.VY + (G.VH - MH * z) / 2 }; }

    /* ================================================================
       RENDER — the whole picture at time t
       ================================================================ */
    var LB = [];                                  /* the labels this frame, collected by each scene */
    function lab(text, side, sx, sy, op, cls) { if (op > .01) LB.push({ text: text, side: side, sx: sx, sy: sy, op: op, cls: cls || '' }); }
    var beat = global.CircDraw && global.CircDraw.beatState;
    var lastStep = -1;

    function render(t) {
      LB = [];
      var lens = lensAt(t), k = ease(lens.k);
      var cam = camA(t);
      var showA = k < .999;
      if (R.A.__on !== showA) { R.A.style.display = showA ? '' : 'none'; R.A.__on = showA; }
      if (showA) renderA(t, cam, 1 - k);
      /* the lens */
      var mf = microFit();
      if (lens.id) {
        var spot = SPOT[lens.id], s = toScreen(cam, spot[0], spot[1]);
        var far = Math.max(Math.hypot(s[0] - G.VX, s[1] - G.VY), Math.hypot(s[0] - G.VX - G.VW, s[1] - G.VY), Math.hypot(s[0] - G.VX, s[1] - G.VY - G.VH), Math.hypot(s[0] - G.VX - G.VW, s[1] - G.VY - G.VH));
        var rad = k * far + (k > 0 ? 2 : 0);
        R.lensclip.setAttribute('cx', n2(s[0])); R.lensclip.setAttribute('cy', n2(s[1])); R.lensclip.setAttribute('r', n2(rad));
        R.rim.setAttribute('cx', n2(s[0])); R.rim.setAttribute('cy', n2(s[1])); R.rim.setAttribute('r', n2(rad));
        R.rim.setAttribute('opacity', n2(k > 0 && k < 1 ? .9 : 0));
        if (R.M.__on !== true) { R.M.style.display = ''; R.M.__on = true; }
        /* the magnified scene grows out of the spot as the lens opens */
        var zs = mf.z * lerp(.18, 1, k), cx = lerp(s[0], G.VX + G.VW / 2, k), cy = lerp(s[1], G.VY + G.VH / 2, k);
        var tx = cx - zs * MW / 2, ty = cy - zs * MH / 2;
        ['B', 'C', 'D'].forEach(function (m) { var on = m === lens.id; if (R[m].__on !== on) { R[m].style.display = on ? '' : 'none'; R[m].__on = on; } });
        R[lens.id].setAttribute('transform', 'matrix(' + n4(zs) + ' 0 0 ' + n4(zs) + ' ' + n4(tx) + ' ' + n4(ty) + ')');
        var M = { z: zs, x: tx, y: ty, k: k };
        if (lens.id === 'B') renderB(t, M);
        else if (lens.id === 'C') renderC(t, M);
        else renderD(t, M);
        var tag = lens.id === 'B' ? 'Magnified: one villus' : lens.id === 'C' ? 'Magnified: liver cells' : 'Magnified: a leg muscle';
        tagline(tag, seg(k, .6, 1));
      } else {
        if (R.M.__on !== false) { R.M.style.display = 'none'; R.M.__on = false; }
        R.rim.setAttribute('opacity', 0);
        tagline('', 0);
      }
      R.mbg.setAttribute('x', G.VX); R.mbg.setAttribute('y', G.VY); R.mbg.setAttribute('width', G.VW); R.mbg.setAttribute('height', G.VH);
      drawLabels();
      readings();
      var st = stepAt(t);
      if (st !== lastStep) { lastStep = st; syncBeyond(st); }
    }
    function tagline(text, op) {
      if (!(op > .01) || !text) { R.tagline.style.display = 'none'; return; }
      R.tagline.style.display = '';
      if (R.tagtx.textContent !== text) R.tagtx.textContent = text;
      /* the tag fits the window: smaller type on a narrow screen rather than a cut word */
      var fs = Math.round(G.font * .78 * 10) / 10, w = textW(text, fs, 500) + 18;
      if (w > G.VW - 12) { fs = Math.round(fs * (G.VW - 30) / (w - 18) * 10) / 10; w = textW(text, fs, 500) + 18; }
      R.tagtx.setAttribute('x', n2(G.VX + G.VW / 2)); R.tagtx.setAttribute('y', n2(G.VY + 10 + fs * .95)); R.tagtx.style.fontSize = fs + 'px';
      R.tagbg.setAttribute('x', n2(G.VX + G.VW / 2 - w / 2)); R.tagbg.setAttribute('y', n2(G.VY + 8)); R.tagbg.setAttribute('width', n2(w)); R.tagbg.setAttribute('height', n2(fs * 1.5));
      R.tagline.setAttribute('opacity', n2(op));
    }

    /* ---------- A: the body ---------- */
    var GLOWS = [
      { d: dOf(AORTA), col: C.oxy, w: 14, on: [[.4, 8.6], [68.2, 78.6]] },
      { d: dOf(VI.aoAbd.c), col: C.oxy, w: 14, on: [[.4, 8.6], [68.4, 78.6]] },
      { d: dOf(VI.hepA.c), col: C.oxy, w: 10, on: [[1.6, 8.6], [34.2, 36.2]] },
      { d: dOf(VI.sma.c) + ['ma0', 'ma1', 'ma2', 'ma3', 'ma4', 'ma5'].map(function (k) { return dOf(VI[k].c); }).join(''), col: C.oxy, w: 8, on: [[2.6, 8.6]] },
      { d: dOf(VI.renAL.c) + dOf(VI.renAR.c), col: C.oxy, w: 10, on: [[3.6, 8.6], [70.6, 78.6]] },
      { d: dOf(VI.iliacAR.c) + dOf(VI.iliacAL.c), col: C.oxy, w: 11, on: [[4.6, 8.6], [78.4, 81.2]] },
      { d: dOf(VI.carAR.c) + dOf(VI.carAL.c) + dOf(VI.subAR.c) + dOf(VI.subAL.c) + dOf(VI.bcA.c), col: C.oxy, w: 9, on: [[4.6, 8.6]] },
      { d: dOf(VI.portal.c) + ['mv0', 'mv1', 'mv2', 'mv3', 'mv4', 'mv5'].map(function (k) { return dOf(VI[k].c); }).join(''), col: C.deo, w: 13, on: [[26.4, 34.6]] },
      { d: dOf(VI.hepVR.c) + dOf(VI.hepVM.c) + dOf(VI.hepVL.c), col: C.deo, w: 11, on: [[52.4, 60.6]] },
      { d: dOf(sub(VI.ivcAbd.c, nearest(VI.ivcAbd.c, 590, 862), VI.ivcAbd.c.total)) + dOf(curve([[28, 560], [28, 420], [30, 330], [48, 268], [70, 244]].map(hp), false, 3)), col: C.deo, w: 14, on: [[53.4, 60.6]] },
      { d: dOf(curve([[172, 380], [172, 280], [172, 210], [172, 150], [178, 108], [240, 97], [330, 110], [430, 144]].map(hp), false, 3)), col: C.deo, w: 12, on: [[56.4, 61.5]] },
      { d: dOf(curve([[430, 192], [396, 195], [363, 200], [330, 212]].map(hp), false, 3)) + dOf(curve([[430, 248], [396, 244], [363, 238], [330, 226]].map(hp), false, 3)), col: C.oxy, w: 10, on: [[62.6, 68.6]] },
      { d: dOf(VI.renVL.c) + dOf(VI.renVR.c), col: C.deo, w: 10, on: [[72.6, 78.6]] },
      { d: dOf(VI.ureL.c) + dOf(VI.ureR.c), col: '#E3CF7A', w: 8, on: [[73.6, 78.6]] }
    ];
    GLOWS.forEach(function (gw) { gw.el = mk('path', { d: gw.d, fill: 'none', stroke: gw.col, 'stroke-width': gw.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'stroke-opacity': 0 }, R.glow); });

    function renderA(t, cam, vis) {
      R.camA.setAttribute('transform', 'matrix(' + n4(cam[2]) + ' 0 0 ' + n4(cam[2]) + ' ' + n4(G.VX + G.VW / 2 - cam[2] * cam[0]) + ' ' + n4(G.VY + G.VH / 2 - cam[2] * cam[1]) + ')');
      var z = cam[2], vx0 = cam[0] - G.VW / 2 / z - 12, vx1 = cam[0] + G.VW / 2 / z + 12, vy0 = cam[1] - G.VH / 2 / z - 12, vy1 = cam[1] + G.VH / 2 / z + 12;
      function inView(b) { return !(b[2] < vx0 || b[0] > vx1 || b[3] < vy0 || b[1] > vy1); }
      /* the heart beats, about once a second on this clock */
      if (HA && HN.outer) {
        var bs = beat ? beat(fract(t), 60) : { atria: 0, vent: .5 + .5 * Math.sin(t * 6.283), av: 1, sl: 0 };
        var p = HA.paths(bs);
        HN.outer.setAttribute('d', p.outer); HN.ra.setAttribute('d', p.ra); HN.la.setAttribute('d', p.la); HN.rv.setAttribute('d', p.rv); HN.lv.setAttribute('d', p.lv);
        if (HN.av) HN.av.setAttribute('d', p.tri + ' ' + p.mit);
        if (HN.sl) HN.sl.setAttribute('d', p.pulv + ' ' + p.aov);
        for (var ci = 0; ci < HN.cords.length; ci++) { HN.cords[ci].setAttribute('x1', n2(p.cords[ci][0][0])); HN.cords[ci].setAttribute('y1', n2(p.cords[ci][0][1])); }
      }
      /* the glows */
      GLOWS.forEach(function (gw) {
        var op = 0; gw.on.forEach(function (w) { op = Math.max(op, win(t, w[0], w[1], .6)); });
        gw.el.setAttribute('stroke-opacity', n2(op * .32));
      });
      /* the red cells */
      var rs = 3.1, pulseT = t + .1 * Math.sin(6.283 * t);
      FLOW.forEach(function (f) {
        var on = inView(f.v.c.box);
        if (f.g.__on !== on) { f.g.style.display = on ? '' : 'none'; f.g.__on = on; }
        if (!on) return;
        var L0 = f.v.c.total, tt = f.pulse ? pulseT : t;
        f.cells.forEach(function (c) {
          var s = (c.s0 + tt * f.speed) % L0, q = at(f.v.c, s), fade = Math.min(1, s / 8, (L0 - s) / 8);
          if (f.lung) c.e.setAttribute('fill', mix(C.deoCell, C.oxyCell, seg(s / L0, .3, .7)));
          place(c.e, q.x, q.y, rs, q.a * 180 / Math.PI, fade);
        });
      });
      /* the substances: each stream only in its own steps */
      var gz = 1 / z, R4 = 5.4 * gz, RA = 5 * gz;
      function runStream(st, op, dens, r) {
        st.items.forEach(function (it) {
          var s = (it.s0 + t * st.speed) % st.c.total, q = at(st.c, s), fade = Math.min(1, s / 10, (st.c.total - s) / 10);
          place(it.e, q.x, q.y, r, 0, op * fade * clamp01((dens - it.th) / .12 + 1) * (it.th < dens ? 1 : 0));
        });
      }
      var w4 = win(t, 26.2, 34.6, .6), m = meal;
      ST.portGlu.forEach(function (s) { runStream(s, w4, m ? .95 : .3, R4); });
      ST.portAa.forEach(function (s) { runStream(s, w4, m ? .9 : .2, RA); });
      var w7 = win(t, 52.2, 60.6, .6);
      ST.hepGlu.forEach(function (s) { runStream(s, w7, m ? .8 : .7, R4); });
      ST.hepUrea.forEach(function (s) { runStream(s, w7, .8, R4); });
      var w9 = win(t, 70.6, 78.6, .6);
      ST.renA.forEach(function (s) { runStream(s, w9, .95, R4); });
      ST.renV.forEach(function (s) { runStream(s, w9, .5, R4); });
      ST.ure.forEach(function (s) { runStream(s, win(t, 72.4, 78.6, .6), .9, R4); });
      /* the lungs: oxygen in, carbon dioxide out */
      var w8 = win(t, 60.8, 68.6, .6);
      ST.lungO2.forEach(function (o) { var u = fract((t - 60) / 2.2 + o.ph), e = sm(u); place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 5.2 * gz, 0, w8 * Math.sin(Math.PI * u)); });
      ST.lungCo2.forEach(function (o) { var u = fract((t - 60) / 2.4 + o.ph), e = sm(u); place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 5.2 * gz, 0, w8 * Math.sin(Math.PI * u)); });
      /* the molecules the story follows */
      var g = null, a = null, u = null;
      if (t >= 26.2 && t < 36.3) { g = journey(J4, t, 26.4, 33.4); a = journey(J4, t, 26.4, 33.4, 14); }
      if (t >= 51.8 && t < 60) { g = journey(J7, t, 52.4, 59.4); u = journey(J7, t, 52.4, 59.4, 13); }
      if (t >= 60 && t < 68) { g = journey(J8, t, 60.3, 67.4); u = journey(J8, t, 60.3, 67.4, 13); }
      if (t >= 68 && t < 78) {
        var kU = seg(t, 68.3, 76.6), kG = seg(t, 68.3, 77.8);
        u = at(J9U, J9U.total * ease(kU));
        g = at(J9G, J9G.total * sm(kG));
      }
      if (t >= 78) { g = journey(J10, t, 78.3, 80.6); if (t < 78.5) u = at(J9U, J9U.total); }
      var opT = function (a0) { return a0 ? 1 : 0; };
      tracer(TR.G, g, 5.8 * gz, opT(g) * win(t, 26.2, 99, .4) * (t >= 36.3 && t < 51.8 ? 0 : 1) * (t >= 81 ? 1 - seg(t, 80.6, 81.2) : 1));
      tracer(TR.A, a, 5.4 * gz, opT(a) * win(t, 26.2, 36.3, .4));
      tracer(TR.U, u, 5.8 * gz, opT(u) * (1 - seg(t, 78, 78.5)));

      /* labels, in the body */
      var li = [];
      function L2(text, side, x, y, a0, b0, cls, f) { var op = win(t, a0, b0, f || .45) * vis; if (op > .01) li.push([text, side, x, y, op, cls]); }
      L2('left ventricle', 'R', hx(292), hy(372), .3, 8.6);
      L2('aorta', 'R', 689, 806, .5, 8.6);
      L2('hepatic artery', 'R', 652, 845.5, 1.5, 8.6);
      L2('renal artery', 'R', 688, 919.5, 3.5, 8.6);
      var smaQ = atF(VI.sma.c, .5); L2('mesenteric artery', 'R', smaQ.x, smaQ.y, 2.5, 8.6, 'is-beyond');
      L2('to the legs', 'L', 608, 1204, 4.5, 8.6);
      L2('to the head and arms', 'L', 612, 467.5, 4.5, 8.6);
      /* step 4 */
      L2('small intestine', 'R', 726, 1104, 26.4, 34.6);
      L2('liver', 'L', 540, 870, 26.6, 34.6);
      L2('hepatic portal vein', 'L', 623, 894, 27, 34.6);
      var smvQ = atF(VI.portal.c, .3); L2('mesenteric vein', 'R', smvQ.x, smvQ.y, 26.6, 34.6, 'is-beyond');
      L2('hepatic artery', 'R', 646, 845.5, 30.5, 36);
      /* step 7 */
      L2('hepatic veins', 'L', 591, 824, 52.4, 60.6);
      L2('vena cava', 'L', 591, 864, 53.2, 60.6);
      L2('right atrium', 'L', hx(84), hy(222), 55.2, 60.6);
      L2('right ventricle', 'L', hx(98), hy(330), 56.2, 60.6);
      L2('pulmonary artery', 'R', hx(250), hy(97), 57.2, 61.8);
      /* step 8 */
      L2('lung', 'R', 777, 562, 60.4, 68.6);
      L2('pulmonary vein', 'R', hx(396), hy(195), 62.4, 68.6);
      L2('left atrium', 'R', hx(338), hy(236), 63.8, 68.6);
      L2('left ventricle', 'R', hx(300), hy(372), 65.4, 68.8);
      /* step 9 */
      L2('aorta', 'L', 664, 1016, 69.6, 78.6);
      L2('renal artery', 'R', 686, 919, 70.8, 78.6);
      L2('renal vein', 'R', 690, 942.5, 71.8, 78.6);
      L2('kidney', 'R', 750, 960, 71.2, 78.6);
      L2('ureter', 'R', 693, 1030, 73.2, 78.6);
      L2('vena cava', 'L', 598, 1000, 71.6, 78.6);
      /* step 10 */
      L2('to the legs', 'L', 612, 1188, 78.6, 81);
      li.forEach(function (q) { var s = toScreen(cam, q[2], q[3]); lab(q[0], q[1], s[0], s[1], q[4], q[5]); });
      /* the followed molecules, named where they are */
      function tl(txt, pos, side, a0, b0) { if (!pos) return; var op = win(t, a0, b0, .4) * vis; var s = toScreen(cam, pos.x, pos.y); lab(txt, side, s[0], s[1], op, 'is-tracer'); }
      tl('glucose', g, 'R', 27.4, 34.6); tl('amino acid', a, 'R', 27.4, 34.6);
      tl('glucose', g, 'R', 53.4, 60.6); tl('urea', u, 'R', 53.4, 60.6);
      tl('glucose', g, 'R', 60.6, 68.6); tl('urea', u, 'R', 60.6, 68.6);
      tl('urea', u, 'R', 70.4, 78.6); tl('glucose', g, 'L', 71.4, 78.6);
      tl('glucose', g, 'R', 78.6, 80.8);
    }
    function tracer(tr, p, r, op) {
      if (!p || !(op > .01)) { place(tr.e, 0, 0, 1, 0, 0); place(tr.ring, 0, 0, 1, 0, 0); return; }
      place(tr.e, p.x, p.y, r, 0, op);
      place(tr.ring, p.x, p.y, r * 1.9, 0, op * .9);
    }

    /* ---------- B: the villus ---------- */
    function renderB(t, M) {
      var S2 = function (x, y) { return [M.x + M.z * x, M.y + M.z * y]; };
      /* red cells: bright red in the arteriole, blue after they have crossed */
      BF.cells.forEach(function (c) {
        var s = (c.s0 + t * 26) % c.c.total, q = at(c.c, s), ox = 1 - seg(s, c.c.x0 + 6, c.c.x1 - 6);
        c.e.setAttribute('fill', mix(C.deoCell, C.oxyCell, ox));
        place(c.e, q.x, q.y, 4.4, q.a * 180 / Math.PI, Math.min(1, s / 10, (c.c.total - s) / 10));
      });
      /* oxygen, out to the respiring cells (step 2, and on through step 3 more faintly) */
      var wO = win(t, 10.4, 25, .8) * (t > T.s3 ? .45 : 1);
      BF.o2.forEach(function (o) {
        var u = fract((t - 10) / 1.9 + o.ph), e = sm(u);
        place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 8.5, 0, wO * Math.sin(Math.PI * Math.min(1, u * 1.15)));
      });
      /* food: after a meal every molecule is absorbed; hours later only a few are there to absorb */
      BF.food.forEach(function (f) {
        var present = meal ? 1 : (f.tracer || f.rank < .22 ? 1 : 0);
        if (!present || t < 17) { place(f.e, 0, 0, 1, 0, 0); if (f.tracer) tracerB(f, null, 0); return; }
        var a1 = f.t0, a2 = a1 + 1.1, a3 = a2 + 1.3, p;
        var fadeIn = seg(t, 17, 17.5);
        if (t < a1) p = [f.out[0], f.out[1]];
        else if (t < a2) { var e1 = sm(seg(t, a1, a2)); p = [lerp(f.out[0], f.edge[0], e1), lerp(f.out[1], f.edge[1], e1)]; }
        else if (t < a3) { var e2 = sm(seg(t, a2, a3)); p = [lerp(f.edge[0], f.inP[0], e2), lerp(f.edge[1], f.inP[1], e2)]; }
        else {
          var q = at(f.route, f.rs), e3 = sm(seg(t, a3, a3 + .6));
          var s = f.rs + Math.max(0, t - a3 - .6) * 22;
          var q2 = at(f.route, Math.min(f.route.total, s));
          p = e3 < 1 ? [lerp(f.inP[0], q.x, e3), lerp(f.inP[1], q.y, e3)] : [q2.x, q2.y];
          if (s > f.route.total - 12) fadeIn *= clamp01((f.route.total - s) / 12);
        }
        place(f.e, p[0], p[1], f.sym === 'glu' ? 7.8 : 7.2, 0, fadeIn * (t < T.s4 + 1.2 ? 1 : 0));
        if (f.tracer) tracerB(f, p, fadeIn);
      });
      /* fat: digested in the gut cavity, so it is not drawn there. The epithelial cells make the
         products back into fat droplets, which leave the cell and enter the lacteal. */
      BF.fat.forEach(function (f) {
        var present = meal ? 1 : (f.rank < .2 ? 1 : 0);
        if (!present || t < 17) { place(f.e, 0, 0, 1, 0, 0); return; }
        var a2 = f.t0 + .9, a3 = a2 + .6, a4 = a3 + 1.4, p, r = 6.4, op;
        var mid = [lerp(f.edge[0], f.inP[0], .55), lerp(f.edge[1], f.inP[1], .55)];
        if (t < a2) { place(f.e, 0, 0, 1, 0, 0); return; }
        if (t < a3) { p = mid; r = lerp(2.4, 6.4, sm(seg(t, a2, a3))); op = seg(t, a2, a2 + .3); }
        else if (t < a4) { var e2 = sm(seg(t, a3, a4)); p = [lerp(mid[0], f.lac[0], e2), lerp(mid[1], f.lac[1], e2)]; op = 1; }
        else { var y = f.lac[1] + (t - a4) * 9; p = [lerp(f.lac[0], 150, seg(t, a4, a4 + 1)), y]; op = y > 540 ? 0 : 1; }
        place(f.e, p[0], p[1], r, 0, op);
      });
      /* labels */
      var vis = seg(M.k, .7, 1);
      function L3(text, side, x, y, a0, b0, cls) { var op = win(t, a0, b0, .4) * vis; if (op > .01) { var s = S2(x, y); lab(text, side, s[0], s[1], op, cls); } }
      L3('villus', 'R', 213, 170, 10, 25.6);
      L3('epithelium', 'L', 81, 238, 10.4, 25.6);
      var rq = atF(VIL.rungs[1], .2); L3('capillary', 'R', rq.x, rq.y, 10.8, 25.6);
      L3('arteriole', 'R', 194, 516, 11.2, 25.6);
      L3('to the hepatic portal vein', 'L', 106, 522, 11.6, 25.6);
      L3('lacteal', 'R', 157, 420, 18.2, 25.6);
      L3('microvilli', 'L', 120, 94, 17.4, 25.6);
      var g = fG.__p, a = fA.__p;
      if (g) L3('glucose', 'L', g[0], g[1], 17.9, 25.6, 'is-tracer');
      if (a) L3('amino acid', 'L', a[0], a[1], 18.6, 25.6, 'is-tracer');
    }
    function tracerB(f, p, op) {
      var tr = TRB[f.tracer];
      f.__p = p && op > .01 ? p : null;
      if (!p) { place(tr.ring, 0, 0, 1, 0, 0); return; }
      place(tr.ring, p[0], p[1], 14, 0, op * .9);
    }

    /* ---------- C: the liver cells ---------- */
    function renderC(t, M) {
      var S2 = function (x, y) { return [M.x + M.z * x, M.y + M.z * y]; };
      /* red cells in the blood space: those from the hepatic artery start red and turn blue as they rise */
      CF.cells.forEach(function (c) {
        var y = 470 - ((c.s0 + t * c.sp) % 420), up = seg(470 - y, 0, 390);
        c.e.setAttribute('fill', c.red ? mix(C.oxyCell, C.deoCell, sm(up * 1.2)) : C.deoCell);
        place(c.e, c.x, y, 5.2, 90 + Math.sin(c.s0 + t) * 12, Math.min(1, (470 - y) / 12, (y - 76) / 12));
      });
      /* glucose in the blood space: after a meal, plenty coming in at the bottom and less leaving at the
         top (the cells take some); hours later, less coming in and more leaving (the cells add some) */
      CF.glu.forEach(function (g) {
        var y = 470 - ((g.s0 + t * g.sp) % 420), up = (470 - y) / 390;
        var dens = meal ? lerp(.95, .45, up) : lerp(.28, .62, up);
        place(g.e, g.x, y, 5.6, 0, (g.th < dens ? 1 : 0) * Math.min(1, (470 - y) / 12, (y - 80) / 12) * win(t, 35.4, 60, .8));
      });
      CF.aa.forEach(function (g) {
        var y = 470 - ((g.s0 + t * g.sp) % 420), up = (470 - y) / 390;
        var dens = meal ? lerp(.9, .35, up) : lerp(.25, .15, up);
        place(g.e, g.x, y, 5.2, 0, (g.th < dens ? 1 : 0) * Math.min(1, (470 - y) / 12, (y - 80) / 12) * win(t, 42.8, 60, .6));
      });
      /* glycogen in each cell: grows after a meal, shrinks hours later */
      var kG = meal ? lerp(.3, .82, sm(seg(t, 36.8, 42))) : lerp(.85, .32, sm(seg(t, 36.8, 42)));
      CF.gly.forEach(function (gl, i) {
        var n = Math.round(GLY.length * clamp01(kG + ((i * 37) % 7 - 3) * .025));
        gl.units.forEach(function (e, j) { e.style.display = j < n ? '' : 'none'; });
      });
      /* glucose going into cells (after a meal) or coming out of them (hours later) */
      CF.events.forEach(function (ev) {
        var u = seg(t, ev.t0, ev.t0 + 1.8), c = ev.cell, ga = (c.gang || 0) * Math.PI / 180, ox = GLY[2][0] * 5.4 * (c.side < 0 ? -1 : 1), oy = GLY[2][1] * 5.4;
        var gx = c.gx + ox * Math.cos(ga) - oy * Math.sin(ga), gy = c.gy + ox * Math.sin(ga) + oy * Math.cos(ga);
        var p0 = meal ? [ev.bx, ev.by] : [gx, gy], p1 = meal ? [gx, gy] : [ev.bx, ev.by - 20];
        var e = sm(u);
        place(ev.e, lerp(p0[0], p1[0], e), lerp(p0[1], p1[1], e), 5.6, 0, u > 0 && u < 1 ? Math.sin(Math.PI * Math.min(1, u * 1.1)) * .5 + .5 : 0);
      });
      /* the protein: four amino acids come in, join, and leave as one molecule */
      var pc = PROT.cell, join = seg(t, 45.6, 46.4), leave = seg(t, 46.8, 49.2);
      PROT.parts.forEach(function (pp, i) {
        var e = sm(seg(t, pp.t0, pp.t0 + 1.3));
        place(pp.e, lerp(pp.from[0], pp.at[0], e), lerp(pp.from[1], pp.at[1], e), 5.2, 0, t > pp.t0 && join < 1 ? 1 : 0);
      });
      var cx = lerp(pc.x0 + 50, 150, sm(leave)), cy = lerp(pc.cy + 21, pc.cy - 10, sm(leave)) - Math.max(0, t - 49.2) * 16;
      var chainOn = join >= 1 && cy > 84;
      PROT.chain.style.display = chainOn ? '' : 'none';
      if (chainOn) {
        var pts = [0, 1, 2, 3].map(function (i) { return [cx - 20 + i * 13, cy + (i % 2 ? 5 : -5)]; });
        PROT.links.setAttribute('d', 'M' + pts.map(function (p) { return n2(p[0]) + ' ' + n2(p[1]); }).join('L'));
        PROT.beads.forEach(function (b, i) { place(b, pts[i][0], pts[i][1], 5.2, 0, 1); });
      }
      /* deamination: the amino acid comes in, its nitrogen-containing part comes off and becomes urea,
         which leaves in the blood */
      DEAM.forEach(function (d) {
        var a1 = d.t0, a2 = a1 + 1.4, a3 = a2 + 1.1, a4 = a3 + .9, a5 = a4 + 1.2;
        var e1 = sm(seg(t, a1, a2)), p = [lerp(d.from[0], d.inAt[0], e1), lerp(d.from[1], d.inAt[1], e1)];
        var on = t > a1;
        place(d.aa, p[0], p[1], 5.6, 0, on && t < a3 ? 1 : 0);
        /* the part with nitrogen, still attached, then pulled away */
        var sep = sm(seg(t, a2 + .2, a3)), nx = p[0] + 4.2 + sep * 12 * (d.cell.side < 0 ? 1 : -1), ny = p[1] - 3.6 - sep * 8;
        if (on && t < a4) { d.n.style.display = ''; d.n.setAttribute('cx', n2(nx)); d.n.setAttribute('cy', n2(ny)); d.n.setAttribute('opacity', n2(1 - seg(t, a3 + .5, a4))); }
        else d.n.style.display = 'none';
        /* what is left of the amino acid: used by the cell (beyond the syllabus: respired, or made into glucose or fat) */
        place(d.rest, p[0], p[1], 5.6, 0, t >= a3 ? 1 - seg(t, a3 + .6, a5 + .8) : 0);
        /* urea: forms, then leaves the cell and rises in the blood */
        var e4 = sm(seg(t, a4, a5)), uy0 = ny, ux0 = nx;
        var ux = lerp(ux0, d.out[0], e4), uy = lerp(uy0, d.out[1], e4) - Math.max(0, t - a5) * 15;
        var uop = t >= a3 + .3 ? seg(t, a3 + .3, a4) : 0;
        if (uy < 84) uop = 0;
        place(d.urea, ux, uy, 6, 0, uop);
        d.__u = uop > .01 ? [ux, uy] : null; d.__a = on && t < a3 ? p : null;
      });
      /* the glucose the story follows: through the blood space and out at the top */
      var gy = t < 43 ? lerp(470, 250, sm(seg(t, 36.4, 42.6))) : lerp(250, 84, sm(seg(t, 43, 45)));
      var gop = win(t, 36.2, 45.1, .3);
      place(TRC.G.e, 146, gy, 6.4, 0, gop); place(TRC.G.ring, 146, gy, 12, 0, gop * .9);
      var dT = DEAM[0];
      if (dT.__a) place(TRC.A.ring, dT.__a[0], dT.__a[1], 12, 0, .9); else place(TRC.A.ring, 0, 0, 1, 0, 0);
      if (dT.__u) place(TRC.U.ring, dT.__u[0], dT.__u[1], 12, 0, .9 * seg(t, 47.4, 47.9)); else place(TRC.U.ring, 0, 0, 1, 0, 0);
      /* labels */
      var vis = seg(M.k, .7, 1);
      function L3(text, side, x, y, a0, b0, cls) { var op = win(t, a0, b0, .4) * vis; if (op > .01) { var s = S2(x, y); lab(text, side, s[0], s[1], op, cls); } }
      L3('liver cell', 'L', 30, 330, 36, 51.6);
      L3('glycogen', 'R', LIV.cells[3].gx + 36, LIV.cells[3].gy - 2, 36.6, 51.6);
      L3('blood from the hepatic portal vein', 'L', 34, 492, 36.2, 51.6);
      L3('blood from the hepatic artery', 'R', 246, 521, 36.4, 51.6);
      L3('blood to the hepatic vein', 'R', 262, 56, 36.8, 51.6);
      if (gop > .01) L3('glucose', 'L', 146, gy, 36.8, 45, 'is-tracer');
      if (chainOn) L3('protein: fibrinogen', 'R', cx + 20, cy - 5, 46.2, 51.6);
      if (dT.__a) L3('amino acid', 'L', dT.__a[0], dT.__a[1], 44, 47.2, 'is-tracer');
      if (dT.__u) L3('urea', 'L', dT.__u[0], dT.__u[1], 47.4, 51.6, 'is-tracer');
    }

    /* ---------- D: the muscle ---------- */
    function renderD(t, M) {
      var S2 = function (x, y) { return [M.x + M.z * x, M.y + M.z * y]; };
      DF.cells.forEach(function (c) {
        var y = 560 - ((c.s0 + t * c.sp) % 600), up = seg(560 - y, 120, 460);
        c.e.setAttribute('fill', mix(C.oxyCell, C.deoCell, up));
        place(c.e, c.x, y, 5.4, 90, 1);
      });
      var w = win(t, 81, 99, .8);
      DF.o2.forEach(function (o) { var u = fract((t - 80) / 2.3 + o.ph), e = sm(u); place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 5.6, 0, w * Math.sin(Math.PI * u)); });
      DF.glu.forEach(function (o) { var u = fract((t - 80) / 2.8 + o.ph), e = sm(u); place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 6, 0, w * Math.sin(Math.PI * u)); });
      DF.co2.forEach(function (o) { var u = fract((t - 80) / 2.5 + o.ph), e = sm(u); place(o.e, lerp(o.from[0], o.to[0], e), lerp(o.from[1], o.to[1], e), 5.6, 0, w * Math.sin(Math.PI * u)); });
      /* the glucose the story follows: out of the capillary, into the muscle cell, to a mitochondrion,
         where it is used in respiration with oxygen; carbon dioxide leaves */
      var tg = MUS.target, a1 = 81.6, a2 = 83.4, a3 = 84.6, a4 = 85.4;
      var e1 = sm(seg(t, a1, a2)), gx = lerp(150, tg[0] - 8, e1), gyy = lerp(470, tg[1] + 2, e1);
      if (t < a1) { gyy = lerp(560, 470, sm(seg(t, 80.2, a1))); gx = 150; }
      var gop = t < a3 ? seg(t, 80.4, 80.9) : 1 - seg(t, a3, a3 + .5);
      place(TRD.G.e, gx, gyy, 6.6, 0, gop); place(TRD.G.ring, gx, gyy, 12.5, 0, gop * .9);
      var eo = sm(seg(t, a1 + .3, a2)); place(TRD.o2, lerp(150, tg[0] + 8, eo), lerp(430, tg[1] - 4, eo), 5.8, 0, t > a1 + .3 && t < a3 ? 1 : 0);
      var fl = seg(t, a3 - .2, a3 + .4) * (1 - seg(t, a3 + .9, a4 + .6));
      TRD.flash.setAttribute('cx', tg[0]); TRD.flash.setAttribute('cy', tg[1]); TRD.flash.setAttribute('r', n2(12 + 26 * fl)); TRD.flash.setAttribute('opacity', n2(fl));
      var ec = sm(seg(t, a4, a4 + 1.3));
      place(TRD.co2a, lerp(tg[0] - 4, 156, ec), lerp(tg[1] - 6, tg[1] - 40, ec), 5.6, 0, t > a3 + .2 ? 1 : 0);
      place(TRD.co2b, lerp(tg[0] + 6, 146, ec), lerp(tg[1] + 6, tg[1] - 16, ec), 5.6, 0, t > a3 + .3 ? 1 : 0);
      var vis = seg(M.k, .7, 1);
      function L3(text, side, x, y, a0, b0, cls) { var op = win(t, a0, b0, .4) * vis; if (op > .01) { var s = S2(x, y); lab(text, side, s[0], s[1], op, cls); } }
      L3('capillary', 'L', 137, 506, 80.8, 99);
      L3('muscle cell', 'L', 26, 214, 81, 99);
      L3('mitochondrion', 'R', tg[0] + 15, tg[1] + 4, 81.4, 99);
      L3('glycogen', 'R', 236 + 36, 180, 81.8, 99);
      if (gop > .01) L3('glucose', 'L', gx, gyy, 81, a3 + .3, 'is-tracer');
      L3('carbon dioxide', 'R', lerp(tg[0] + 6, 146, ec) + 6, lerp(tg[1] + 6, tg[1] - 16, ec), a4, 99);
    }

    /* ================================================================
       LABELS — in the two margins, each level with its part, on a ruled leader
       ================================================================ */
    var cvs = null, widths = {};
    function textW(s, fs, wt) {
      var key = (wt || 500) + '|' + fs + '|' + s;
      if (widths[key] == null) {
        try { cvs = cvs || document.createElement('canvas').getContext('2d'); cvs.font = (wt || 500) + ' ' + fs + 'px ' + FAMILY; widths[key] = cvs.measureText(s).width; }
        catch (e) { widths[key] = s.length * fs * .55; }
      }
      return widths[key];
    }
    /* a word too long for the margin is broken where a dictionary breaks it: the second part
       always starts a new line */
    var HYPH = { mitochondrion: ['mito-', 'chondrion'], epithelium: ['epi-', 'thelium'], fibrinogen: ['fibrin-', 'ogen'], intestine: ['intes-', 'tine'], ventricle: ['ven-', 'tricle'], microvilli: ['micro-', 'villi'] };
    function wrap(text, room) {
      var lines = [], cur = '';
      text.split(' ').forEach(function (w) {
        var parts = textW(w, G.font) > room && HYPH[w] ? HYPH[w] : [w];
        parts.forEach(function (p, i) {
          if (i > 0) { lines.push(cur); cur = p; return; }
          if (!cur) cur = p; else if (textW(cur + ' ' + p, G.font) <= room) cur += ' ' + p; else { lines.push(cur); cur = p; }
        });
      });
      if (cur) lines.push(cur);
      return lines;
    }
    var LAST = [];
    function drawLabels() {
      var F = G.font, lh = G.lh, gap = 4, out = '', drawn = [];
      ['L', 'R'].forEach(function (side) {
        var it = LB.filter(function (x) { return x.side === side; });
        /* a label whose part is outside the window is not drawn; one near the edge fades */
        it = it.filter(function (x) {
          var inX = Math.min(x.sx - G.VX, G.VX + G.VW - x.sx), inY = Math.min(x.sy - G.VY, G.VY + G.VH - x.sy);
          if (inX < 3 || inY < 3) return false;
          x.op *= Math.min(1, inX / 14, inY / 14);
          return x.op > .01;
        });
        it.sort(function (a, b) { return a.sy - b.sy; });
        /* two parts at the same height on one side would share a line: part them by a unit */
        for (var i = 1; i < it.length; i++) if (it[i].sy - it[i - 1].sy < 1.2) it[i].sy = it[i - 1].sy + 1.2;
        it.forEach(function (x) { x.lines = wrap(x.text, G.room); x.h = x.lines.length * lh; x.ly = x.sy; });
        /* Two labels keep their full distance once both are half showing. While one fades in or out, the
           other slides to or from its own part, instead of jumping there in one frame. */
        function room(p, q) { return (p.h / 2 + gap + q.h / 2) * Math.min(1, Math.min(p.op, q.op) * 2); }
        var top = 5, bot = G.H - 5;
        if (it.length && it[0].ly - it[0].h / 2 < top) it[0].ly = top + it[0].h / 2;
        for (i = 1; i < it.length; i++) { var lo = it[i - 1].ly + room(it[i - 1], it[i]); if (it[i].ly < lo) it[i].ly = lo; }
        for (i = it.length - 1; i >= 0; i--) {
          var hi = i === it.length - 1 ? bot - it[i].h / 2 : it[i + 1].ly - room(it[i], it[i + 1]);
          if (it[i].ly > hi) it[i].ly = hi;
        }
        it.forEach(function (x) {
          var edge = side === 'L' ? G.VX : G.VX + G.VW, dir = side === 'L' ? -1 : 1;
          var jog = Math.abs(x.ly - x.sy) > .5;
          var d = 'M' + n2(x.sx) + ' ' + n2(x.sy) + 'L' + n2(edge + dir * 2) + ' ' + n2(x.sy) + (jog ? 'L' + n2(edge + dir * 7) + ' ' + n2(x.ly) : '') + 'L' + n2(edge + dir * 10) + ' ' + n2(x.ly);
          var tx = edge + dir * 14, anchor = side === 'L' ? 'end' : 'start', y0 = x.ly - x.h / 2 + F * .86;
          out += '<g class="lb bf__lb ' + x.cls + '" opacity="' + n2(Math.min(1, x.op)) + '">' +
            '<path class="lb__halo" d="' + d + '"/><path class="lb__lead" d="' + d + '"/>' +
            '<circle class="lb__dot" cx="' + n2(x.sx) + '" cy="' + n2(x.sy) + '" r="' + n2(F * .17) + '"/>' +
            '<text class="lb__txt" x="' + n2(tx) + '" y="' + n2(y0) + '" text-anchor="' + anchor + '" style="font-size:' + F + 'px">' +
            x.lines.map(function (ln, k) { return '<tspan x="' + n2(tx) + '" dy="' + (k ? n2(lh) : 0) + '">' + esc(ln) + '</tspan>'; }).join('') + '</text></g>';
          var wmax = 0; x.lines.forEach(function (ln) { wmax = Math.max(wmax, textW(ln, F)); });
          drawn.push({ text: x.text, side: side, op: x.op, anchor: [x.sx, x.sy], lead: [[x.sx, x.sy], [edge + dir * 2, x.sy]].concat(jog ? [[edge + dir * 7, x.ly]] : []).concat([[edge + dir * 10, x.ly]]),
                       box: side === 'L' ? [tx - wmax, x.ly - x.h / 2, tx, x.ly + x.h / 2] : [tx, x.ly - x.h / 2, tx + wmax, x.ly + x.h / 2] });
        });
      });
      R.labels.innerHTML = out;
      LAST = drawn;
    }

    /* ================================================================
       THE CONTROLS
       ================================================================ */
    var STEPS = STEP_DEF.map(function (d) { return { t: d.t, h: d.h, tag: d.tag, p: d.p }; });
    function stepAt(t) { var k = 0; for (var i = 0; i < STEPS.length; i++) if (t >= STEPS[i].t - 1e-6) k = i; return k; }
    var sp = L.stepper({ steps: STEPS, end: END, render: render, onStart: function () { watchSize(); } });
    /* each step's "Beyond the syllabus" line, closed until opened, under its paragraph */
    var beyondEls = [];
    Array.prototype.forEach.call(sp.list.children, function (li, i) {
      var d = STEP_DEF[i];
      li.classList.add('bf__step');
      if (!d.beyond) { beyondEls.push(null); return; }
      var det = h('details', 'bf__beyond', '<summary>Beyond the syllabus</summary><p>' + esc(d.beyond) + '</p>');
      li.appendChild(det); beyondEls.push(det);
    });
    function syncBeyond(k) { beyondEls.forEach(function (d, i) { if (d && i !== k) d.open = false; }); paintCap(k); }

    /* on a narrow screen the list of steps falls below the readings and the key, far from the
       drawing: the step on screen is repeated just under the drawing (the list keeps its title) */
    var cap = h('div', 'bf__cap'), capK = -1;
    cap.setAttribute('aria-hidden', 'true');          /* the step is already read out by the player */
    function paintCap(k) {
      if (k == null) k = capK; capK = k; if (k < 0) return;
      var d = STEP_DEF[k], txt = STEPS[k].p.replace(/_/g, '');
      cap.innerHTML = '<span class="bf__capn">' + (k + 1) + '</span><div class="bf__capt"><b>' + esc(d.h) + '</b> <span class="sp__tag">' + esc(d.tag) + '</span>' +
        '<span class="bf__capp">' + esc(txt) + '</span>' +
        (d.beyond ? '<details class="bf__beyond bf__beyond--cap"><summary>Beyond the syllabus</summary><p>' + esc(d.beyond) + '</p></details>' : '') + '</div>';
    }

    /* the readings and the switch */
    var read = h('div', 'bf__read');
    read.innerHTML =
      '<div class="bf__readh"><span class="bf__readt">Glucose concentration in the blood</span>' +
        '<span class="bf__tog" role="group" aria-label="Time since the meal">' +
          '<button type="button" class="bf__togb" data-m="1" aria-pressed="true">After a meal</button>' +
          '<button type="button" class="bf__togb" data-m="0" aria-pressed="false">Hours later</button>' +
        '</span></div>' +
      '<div class="bf__meter" data-v="portal"><span class="bf__mname">Hepatic portal vein</span><span class="bf__bar" role="img"><i class="bf__fill bf__fill--portal"></i><i class="bf__ghost"></i></span></div>' +
      '<div class="bf__meter" data-v="hepatic"><span class="bf__mname">Hepatic vein</span><span class="bf__bar" role="img"><i class="bf__fill bf__fill--hepatic"></i><i class="bf__ghost"></i></span></div>' +
      '<p class="bf__readp"></p>' +
      '<p class="bf__x"><span class="bf__xk">Topic 14</span> Insulin and glucagon control these changes (S 14.4.4). The pale mark shows the other time.</p>';
    var meters = { portal: read.querySelector('[data-v="portal"]'), hepatic: read.querySelector('[data-v="hepatic"]') };
    function readings() {
      ['portal', 'hepatic'].forEach(function (k) {
        var v = READ[k][meal], o = READ[k][1 - meal], m = meters[k];
        var f = m.querySelector('.bf__fill'), gh = m.querySelector('.bf__ghost'), w = (v / READ.max * 100).toFixed(1) + '%';
        if (f.style.width !== w) f.style.width = w;
        var gl = (o / READ.max * 100).toFixed(1) + '%'; if (gh.style.left !== gl) gh.style.left = gl;
        var more = k === 'portal' ? (meal ? 'a higher glucose concentration than the hepatic vein' : 'a lower glucose concentration than the hepatic vein') : (meal ? 'a lower glucose concentration than the hepatic portal vein' : 'a higher glucose concentration than the hepatic portal vein');
        m.querySelector('.bf__bar').setAttribute('aria-label', (k === 'portal' ? 'Hepatic portal vein: ' : 'Hepatic vein: ') + more);
      });
      var txt = meal ? 'After a meal, the glucose concentration is higher in the hepatic portal vein than in the hepatic vein. The liver stores some of the glucose as glycogen.'
                     : 'Hours later, the glucose concentration is higher in the hepatic vein than in the hepatic portal vein. The liver releases glucose from its glycogen.';
      var pEl = read.querySelector('.bf__readp'); if (pEl.textContent !== txt) pEl.textContent = txt;
    }
    /* the moment: the switch, and the words of the steps that depend on it */
    function applyMeal(v) {
      meal = v;
      Array.prototype.forEach.call(read.querySelectorAll('.bf__togb'), function (b) { b.setAttribute('aria-pressed', String(+b.getAttribute('data-m') === meal)); });
      STEP_DEF.forEach(function (d, i) {
        if (!d.later) return;
        STEPS[i].p = meal ? d.p : d.later;
        var pe = sp.list.children[i].querySelector('.sp__p'); if (pe) pe.innerHTML = L.mk(STEPS[i].p);
      });
      paintCap();
    }
    function setMeal(v) {
      if (v === meal) return;
      applyMeal(v);
      /* on a step that the moment changes, play that step again in the new state */
      var k = stepAt(sp.time());
      if (sp.time() > 0 && k >= 2 && k <= 5) { var b = sp.list.children[k].querySelector('.sp__stepb'); if (b) { b.click(); return; } }
      sp.paint(sp.time());
    }
    Array.prototype.forEach.call(read.querySelectorAll('.bf__togb'), function (b) { b.addEventListener('click', function () { setMeal(+b.getAttribute('data-m')); }); });

    /* the key to the drawing */
    function glyph(sym, extra) { return '<svg class="bf__kg" viewBox="-7 -7 14 14" aria-hidden="true"><use href="#' + id(sym) + '" transform="scale(' + (extra || 5) + ')"/></svg>'; }
    var key = h('div', 'bf__key');
    key.innerHTML =
      '<span class="bf__ki"><i class="bf__sw bf__sw--oxy"></i>oxygenated blood</span>' +
      '<span class="bf__ki"><i class="bf__sw bf__sw--deo"></i>deoxygenated blood</span>' +
      '<span class="bf__ki">' + glyph('glu') + 'glucose</span>' +
      '<span class="bf__ki"><svg class="bf__kg bf__kg--wide" viewBox="-4 -9 30 18" aria-hidden="true">' + GLY.slice(0, 9).map(function (u) { return '<use href="#' + id('glu') + '" transform="translate(' + n2(u[0] * 3) + ' ' + n2(u[1] * 3) + ') scale(1.8)"/>'; }).join('') + '</svg>glycogen</span>' +
      '<span class="bf__ki">' + glyph('aa') + 'amino acid <small>(violet: the part with nitrogen)</small></span>' +
      '<span class="bf__ki"><svg class="bf__kg bf__kg--wide" viewBox="-6 -8 50 16" aria-hidden="true"><path d="M0 -3L12 3L24 -3L36 3" stroke="' + C.aaLine + '" stroke-width="2" fill="none"/>' + [0, 12, 24, 36].map(function (x, i) { return '<use href="#' + id('aa0') + '" transform="translate(' + x + ' ' + (i % 2 ? 3 : -3) + ') scale(4.4)"/>'; }).join('') + '</svg>protein</span>' +
      '<span class="bf__ki">' + glyph('urea') + 'urea</span>' +
      '<span class="bf__ki">' + glyph('o2') + 'oxygen</span>' +
      '<span class="bf__ki">' + glyph('co2', 4.4) + 'carbon dioxide</span>' +
      '<span class="bf__ki">' + glyph('fat') + 'fat</span>' +
      '<span class="bf__ki bf__ki--note"><i class="bf__beyondname">name in grey italics</i> beyond the syllabus</span>';

    /* the layout: the drawing, its readings and key on the left, the steps on the right */
    var wrapEl = h('div', 'bf__wrap');
    var left = h('div', 'bf__left'), fig = h('figure', 'bf__fig');
    fig.appendChild(svg); fig.appendChild(sp.now);
    /* on a wide screen the drawing and its readings stand in the plate's column, beside the steps (Daniel,
       26 Sep: "the after a meal ... also move it to the left") */
    var pack = h('div', 'bf__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'After a meal')); packT.hidden = true;
    pack.appendChild(packT); pack.appendChild(fig); pack.appendChild(cap); pack.appendChild(read);
    /* the key's small pictures use the drawing's own shapes, from its defs */
    left.appendChild(pack); left.appendChild(key);
    wrapEl.appendChild(left); wrapEl.appendChild(sp.list);
    box.appendChild(sp.bar);
    box.appendChild(wrapEl);
    box.appendChild(h('p', 'widget__note bf__note', 'Red is oxygenated blood and blue is deoxygenated blood, as on the body. Only the substances each step follows are drawn; blood always carries some glucose, amino acids and urea. Molecules are drawn far larger than they are, and a protein as four amino acids: fibrinogen has nearly 3,000. The kidneys are drawn above the small intestine so that both can be seen.'));

    /* ----- size: the lettering stays about 12.5 px on screen at any width ----- */
    function applyLayout() {
      var vx = G.VX, vy = G.VY, vw = G.VW, vh = G.VH;
      [R.view, R.viewline, R.vpclip].forEach(function (r) { r.setAttribute('x', vx); r.setAttribute('y', vy); r.setAttribute('width', vw); r.setAttribute('height', vh); });
    }
    applyLayout();
    function fit() {
      /* the drawing's own width on screen: in the column it can be held back by the height instead */
      var rb = svg.getBoundingClientRect ? svg.getBoundingClientRect() : { width: 0, height: 0 };
      var wpx = rb.height && rb.height < rb.width ? rb.height * G.W / G.H : rb.width;
      var ww = wrapEl.getBoundingClientRect ? wrapEl.getBoundingClientRect().width : 0;
      if (ww) wrapEl.classList.toggle('bf--stack', ww < 640);
      if (!wpx) return;
      var kk = wpx / G.W, font = Math.round(Math.max(14, Math.min(22, (kk < .7 ? 11.5 : 12.5) / kk)));
      if (font !== G.font) { G.font = font; layout(); applyLayout(); sp.paint(sp.time()); }
    }
    var ro = null;
    function watchSize() {
      if (ro || !global.ResizeObserver) return;
      ro = new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); ro = null; return; } fit(); });
      ro.observe(wrapEl); ro.observe(fig);
    }
    watchSize();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { widths = {}; if (box.isConnected) sp.paint(sp.time()); });

    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: left, before: function () { return key; }, watch: function () { return box; },
      onPlace: function (inColumn) { packT.hidden = !inColumn; box.classList.toggle('bf--staged', inColumn); requestAnimationFrame(fit); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { sp.stop(); if (ro) { ro.disconnect(); ro = null; } if (stg) stg.detach(); };
    /* for the headless checks: draw any moment, after a meal or hours later */
    box.__seek = function (t, o) {
      o = o || {};
      if (o.meal != null && +o.meal !== meal) applyMeal(+o.meal);
      fit();
      var r = sp.seek(t);
      return { steps: r, end: END };
    };
    box.__labels = function () { return { labels: LAST, view: [G.VX, G.VY, G.VW, G.VH], W: G.W, H: G.H, font: G.font }; };
    box.__meal = function () { return meal; };
    box.__time = function () { return sp.time(); };

    sp.paint(0);
    return box;
  }

  L.add('bodyflow', bodyflow);
})(window);
