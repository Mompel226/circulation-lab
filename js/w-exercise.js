/* ============================================================
   w-exercise.js — why the heart rate rises when you exercise.

     muscle   a close-up of a working leg muscle: two muscle cells and the capillary between
              them. Step by step: at rest; the muscles contract more; they respire faster
              (oxygen and glucose diffuse in from the blood, carbon dioxide diffuses out); the
              heart beats faster, so more blood flows through the muscle every minute; in hard
              exercise some respiration is anaerobic and lactic acid builds up (Supplement); after
              exercise the heart rate stays high while the blood carries the lactic acid to the
              liver: the oxygen debt (Supplement).

   The biology is the syllabus's own chain (0610 2026–28, 9.2 and S9.2; 12.2–12.3, S12.3.6–7) and
   the station's text; the numbers on the heart-rate panel are typical for a teenager (resting
   70 bpm; about 150 bpm in hard exercise). What is simplified, and said in the note: blood is
   drawn red when oxygenated and blue when deoxygenated; the molecules are drawn hugely enlarged
   and far fewer than the real billions; the lactic acid is shown leaving the cells for the blood,
   which it does, and its breakdown in the liver is only named.

   Nothing here is the students' investigation: no data, no graph, no method. The assessed
   report is theirs (Daniel, 25 Sep 2026).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h, esc = L.esc;

  function n2(v) { return Math.round(v * 100) / 100; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rnd(i, s) { var x = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return x - Math.floor(x); }

  var STEPS = [
    { t: 0,  h: 'At rest', p: 'Your leg muscles are relaxed. Blood flows slowly through the capillaries between the muscle cells. Your heart beats about 70 times a minute.' },
    { t: 6,  h: 'The muscles contract more', p: 'You start to exercise. The muscle cells contract, again and again, to move your legs. Contracting needs energy.' },
    { t: 12, h: 'They respire faster', p: 'To release more energy, the muscle cells respire faster, in their mitochondria. They absorb more oxygen and glucose from the blood, and release more carbon dioxide into it. All three move by diffusion.' },
    { t: 19, h: 'The heart beats faster', p: 'Your heart beats faster, and pumps more blood with each beat. So more blood flows through the muscles every minute: oxygen and glucose are delivered faster, and carbon dioxide is removed faster.' },
    { t: 27, h: 'Hard exercise: not enough oxygen', tag: 'Supplement', p: 'In hard exercise the blood cannot bring oxygen fast enough. Some of the muscle cells respire anaerobically as well. This releases less energy, and it makes lactic acid, which passes into the blood.' },
    { t: 34, h: 'After exercise: the oxygen debt', tag: 'Supplement', p: 'You stop, but your heart rate stays high for a while. The fast blood flow carries the lactic acid to the liver, where it is broken down by aerobic respiration. This is repaying the oxygen debt. Then the heart rate slowly returns to the resting rate.' }
  ];
  var END = 42;

  /* how each thing changes through the story: pure functions of time */
  function contract(t) { return t < 6 ? 0 : t < 7.5 ? seg(t, 6, 7.5) : t < 34 ? 1 : 1 - seg(t, 34, 35); }            /* how hard the muscle is working, 0–1 */
  function resp(t) { return t < 12 ? .18 + .12 * contract(t) : t < 34 ? lerp(.3, 1, ease(seg(t, 12, 14))) : lerp(1, .5, seg(t, 34, 38)); }  /* aerobic respiration rate */
  function bpm(t) {
    if (t < 19) return 70 + 14 * contract(t) + (t >= 12 ? 8 * seg(t, 12, 19) : 0);        /* a first rise with the work, before the step that names it */
    if (t < 34) return lerp(92, 150, ease(seg(t, 19, 23)));
    return lerp(150, 104, ease(seg(t, 36, 42)));                                          /* high at first after stopping, then falling */
  }
  function flow(t) { return .35 + .65 * seg(bpm(t), 70, 150); }                             /* blood flow through the muscle, relative */
  function lactic(t) { return t < 27 ? 0 : t < 34 ? ease(seg(t, 27.5, 32)) : 1 - ease(seg(t, 35, 42)); }   /* lactic acid in the cells and blood */

  /* the distance the blood has moved by time t: the integral of its speed, tabled once */
  var DT = .05, DIST = [0];
  (function () { for (var x = DT; x <= END + DT; x += DT) DIST.push(DIST[DIST.length - 1] + 70 * flow(x) * DT); })();
  function dist(t) { var i = Math.max(0, Math.min(DIST.length - 2, Math.floor(t / DT))), k = t / DT - i; return DIST[i] + (DIST[i + 1] - DIST[i]) * k; }
  /* the muscle's own clock: it contracts once a second while it works */
  function beatPhase(t) { return t < 6 ? 0 : (t - 6) % 1; }

  /* the scene, in its own units. A view down a microscope (Daniel, 26 Sep: "do muscle cells look like
     this?"): a skeletal muscle cell (a muscle fibre) is about ten times as wide as a capillary and
     millimetres long, so the view shows only the part of each fibre next to the capillary, and every
     fibre runs on beyond its edges. What the view shows, as in a histology textbook: the fibre's
     striations, bands across it from its myofibrils; its nuclei, many, flattened, just under its
     membrane; its mitochondria, in rows between the myofibrils and clustered under the membrane next
     to the capillary; the capillary running alongside it, its wall one layer of flat cells (each with a
     flattened nucleus that bulges into the lumen), the red blood cells in single file. Between them,
     tissue fluid. Sources: OpenStax Anatomy and Physiology 2e, 10.2 and 20.1; Junqueira's Basic
     Histology, ch. 10 and 11. */
  var VB = { x: 0, y: 0, w: 960, h: 560 };
  var X0 = 262, X1 = 698;                          /* the label columns stand 58 outside these */
  var WIN = { x: 222, y: 124, w: 516, h: 346 };     /* the view: everything is cut off at its edges */
  var CAP = { y: 262, h: 70, wall: 6 };             /* the capillary: its outer edges; its wall one cell thick */
  var MEM1 = 248, MEM2 = 346;                        /* the fibres' membranes facing the capillary, relaxed */
  var XC = 480;                                      /* the fibres shorten towards the middle of the view */
  var P0 = 22, ABAND = 12;                           /* a sarcomere, relaxed, and its dark band, which keeps its width */

  function muscle(spec) {
    var box = h('div', 'widget mx');
    box.appendChild(L.head(spec.title || 'Why your heart rate rises', spec.ask, 'Press play'));
    var fig = h('figure', 'mx__fig');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h);
    svg.setAttribute('class', 'mx__svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'A close-up of a working leg muscle: two muscle cells, and a capillary between them with red blood cells flowing along it. A panel shows the heart rate. Oxygen and glucose diffuse from the blood into the muscle cells, and carbon dioxide diffuses out.');
    fig.appendChild(svg);

    /* static parts: drawn once */
    var s = '<defs>' +
      '<linearGradient id="mxFib" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#B8505A"/><stop offset=".5" stop-color="#C9636B"/><stop offset="1" stop-color="#A2424C"/></linearGradient>' +
      '<linearGradient id="mxCap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A1418"/><stop offset="1" stop-color="#1F1830"/></linearGradient>' +
      '<radialGradient id="mxMito" cx=".5" cy=".45" r=".65"><stop offset="0" stop-color="#F6B870"/><stop offset="1" stop-color="#C9722E"/></radialGradient>' +
      '<clipPath id="mxWin"><rect x="' + WIN.x + '" y="' + WIN.y + '" width="' + WIN.w + '" height="' + WIN.h + '" rx="16"/></clipPath>' +
      '<linearGradient id="mxEnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F3CDBE"/><stop offset="1" stop-color="#DDA898"/></linearGradient>' +
      '<radialGradient id="mxNuc" cx=".45" cy=".4" r=".7"><stop offset="0" stop-color="#8A67A8"/><stop offset="1" stop-color="#553673"/></radialGradient>' +
      '</defs>' +
      '<rect class="mx__bg" x="0" y="0" width="' + VB.w + '" height="' + VB.h + '" rx="18"/>' +
      '<rect x="' + WIN.x + '" y="' + WIN.y + '" width="' + WIN.w + '" height="' + WIN.h + '" rx="16" fill="#1A2830"/>' +
      '<g clip-path="url(#mxWin)"><g class="mx__cells"></g><g class="mx__cap"></g><g class="mx__rbc"></g><g class="mx__mol"></g></g>' +
      '<rect x="' + WIN.x + '" y="' + WIN.y + '" width="' + WIN.w + '" height="' + WIN.h + '" rx="16" fill="none" stroke="#3A5563" stroke-width="2"/>' +
      '<g class="mx__hud"></g><g class="mx__labels"></g><g class="mx__key"></g>';
    svg.innerHTML = s;
    var gCells = svg.querySelector('.mx__cells'), gCap = svg.querySelector('.mx__cap'), gMol = svg.querySelector('.mx__mol'),
        gRbc = svg.querySelector('.mx__rbc'), gHud = svg.querySelector('.mx__hud'), gLab = svg.querySelector('.mx__labels'), gKey = svg.querySelector('.mx__key');

    /* each fibre, as it is when relaxed: which side faces the capillary, its membrane there, and the
       rows between its myofibrils (every 19 units inward from a zone under the membrane that holds its
       nuclei and a cluster of mitochondria) */
    var FIB = [{ up: true, mem: MEM1 }, { up: false, mem: MEM2 }];
    var MITO = [], NUC = [];
    FIB.forEach(function (F, fi) {
      var s = F.up ? -1 : 1;
      /* under the membrane, next to the capillary: mitochondria between the nuclei */
      for (var i = 0; i < 8; i++) MITO.push({ f: fi, x: WIN.x + 30 + i * 64 + (rnd(i, fi + 3) - .5) * 18, y: F.mem + s * 10.5, sub: true });
      /* rows deeper in, between myofibrils; fewer the further from the capillary */
      for (var r = 0; r < 3; r++) {
        var yr = F.mem + s * (36 + r * 38), nr = 6 - r * 2;          /* on the gaps between myofibrils */
        for (var j = 0; j < nr; j++) MITO.push({ f: fi, x: WIN.x + 26 + (j + rnd(j, r + fi * 5)) * (WIN.w - 40) / nr, y: yr, sub: false });
      }
    });
    NUC.push({ f: 0, x: 318 }, { f: 0, x: 636 }, { f: 1, x: 412 }, { f: 1, x: 716 });

    /* the contraction now: 0 relaxed, 1 fully contracted. While it works the muscle contracts about once
       a second: its sarcomeres shorten, their light bands narrowing while the dark bands keep their width,
       so the fibre shortens (towards the middle of the view here) and thickens a little. */
    function squeezeNow(t) { var ph = beatPhase(t); return contract(t) * (t >= 34 ? 0 : 1) * (ph < .5 ? Math.sin(ph / .5 * Math.PI) : 0); }
    function geom(t) {
      var k = squeezeNow(t), sx = 1 - .16 * k, th = 3 * k;
      return { k: k, sx: sx, fx: function (x) { return XC + (x - XC) * sx; }, mem: [MEM1 + th, MEM2 - th], P: P0 * sx };
    }

    function cellsSvg(t) {
      var G = geom(t), out = '', glow = resp(t);
      FIB.forEach(function (F, fi) {
        var up = F.up, m = G.mem[fi], s = up ? -1 : 1;
        var y0 = up ? WIN.y - 30 : m, y1 = up ? m : WIN.y + WIN.h + 30;
        /* the fibre: cytoplasm, then the striations across its myofibrils (not in the zone under the membrane) */
        out += '<rect x="' + (WIN.x - 10) + '" y="' + n2(y0) + '" width="' + (WIN.w + 20) + '" height="' + n2(y1 - y0) + '" fill="url(#mxFib)"/>';
        var sy0 = up ? y0 : m + 17, sy1 = up ? m - 17 : y1, str = '';
        for (var j = -16; j <= 16; j++) {
          var z = XC + j * G.P, c = z + G.P / 2;
          str += '<rect x="' + n2(c - ABAND / 2) + '" y="' + n2(sy0) + '" width="' + ABAND + '" height="' + n2(sy1 - sy0) + '" fill="#7A2433" opacity=".36"/>' +
                 '<line x1="' + n2(z) + '" y1="' + n2(sy0) + '" x2="' + n2(z) + '" y2="' + n2(sy1) + '" stroke="#5A1622" stroke-width="1.2" opacity=".5"/>';
        }
        /* the gaps between myofibrils, where the rows of mitochondria lie */
        for (var r = 0; r < 6; r++) { var yl = m + s * (17 + r * 19); if (yl > y0 && yl < y1) str += '<line x1="' + (WIN.x - 10) + '" y1="' + n2(yl) + '" x2="' + (WIN.x + WIN.w + 10) + '" y2="' + n2(yl) + '" stroke="#E7A6A8" stroke-width="1.3" opacity=".16"/>'; }
        out += str;
        /* the membrane facing the capillary */
        out += '<line x1="' + (WIN.x - 10) + '" y1="' + n2(m) + '" x2="' + (WIN.x + WIN.w + 10) + '" y2="' + n2(m) + '" stroke="#F6D2CD" stroke-width="2"/>';
      });
      /* the nuclei: flattened, just under the membrane; they move with the fibre */
      NUC.forEach(function (N) {
        var up = FIB[N.f].up, m = G.mem[N.f], y = m + (up ? -8.5 : 8.5);
        out += '<ellipse cx="' + n2(G.fx(N.x)) + '" cy="' + n2(y) + '" rx="' + n2(25 * G.sx) + '" ry="' + n2(5.6 + 1.2 * G.k) + '" fill="url(#mxNuc)" stroke="#2E1A40" stroke-width="1.1"/>';
      });
      /* the mitochondria: they glow as the muscle respires faster */
      MITO.forEach(function (q) {
        var up = FIB[q.f].up, y = q.y + (up ? 1 : -1) * 3 * G.k, x = G.fx(q.x);
        out += '<g transform="translate(' + n2(x) + ',' + n2(y) + ')">' +
          (glow > .32 ? '<ellipse rx="' + n2(11 + 4 * glow) + '" ry="' + n2(5.5 + 2 * glow) + '" fill="#FFB14E" opacity="' + n2(.08 + .3 * (glow - .3)) + '"/>' : '') +
          '<ellipse rx="9.5" ry="4.3" fill="url(#mxMito)" stroke="#6E3A10" stroke-width=".9"/>' +
          '<path d="M-6 0 C-4.5 -2.4 -3 2.4 -1.5 0 C0 -2.4 1.5 2.4 3 0 C4 -1.6 5 1 6 0" fill="none" stroke="#7A4214" stroke-width=".9"/></g>';
      });
      return out;
    }

    /* the capillary: its wall one layer of flat endothelial cells, each with a flattened nucleus that
       bulges into the lumen, joined edge to edge; a thin basement membrane outside; the blood flows
       left to right (Daniel, 26 Sep: show the wall "as multiple cells, really representing one cell thick") */
    var ENDO = [[WIN.x - 20, 318, 448, 574, 694, WIN.x + WIN.w + 20], [WIN.x - 20, 272, 396, 522, 646, WIN.x + WIN.w + 20]];
    function capSvg(t) {
      var y0 = CAP.y, y1 = CAP.y + CAP.h, w = CAP.wall, out = '';
      out += '<rect x="' + (WIN.x - 20) + '" y="' + (y0 + w) + '" width="' + (WIN.w + 40) + '" height="' + (CAP.h - 2 * w) + '" fill="url(#mxCap)"/>';
      [0, 1].forEach(function (side) {
        var top = side === 0, xs = ENDO[side], outer = top ? y0 : y1, inner = top ? y0 + w : y1 - w, dir = top ? 1 : -1;
        for (var i = 0; i < xs.length - 1; i++) {
          var a = xs[i], b = xs[i + 1], mid = (a + b) / 2, bulge = inner + dir * 7.5, shade = (i + side) % 2 ? 'url(#mxEnd)' : '#E4B09F';
          out += '<path d="M' + a + ' ' + outer + 'L' + a + ' ' + inner + 'L' + n2(mid - 30) + ' ' + inner +
            'C' + n2(mid - 20) + ' ' + inner + ' ' + n2(mid - 16) + ' ' + n2(bulge) + ' ' + mid + ' ' + n2(bulge) +
            'C' + n2(mid + 16) + ' ' + n2(bulge) + ' ' + n2(mid + 20) + ' ' + inner + ' ' + n2(mid + 30) + ' ' + inner +
            'L' + b + ' ' + inner + 'L' + b + ' ' + outer + 'Z" fill="' + shade + '" stroke="#8E5646" stroke-width="1"/>' +
            '<ellipse cx="' + mid + '" cy="' + n2(inner + dir * 3.2) + '" rx="21" ry="3.9" fill="url(#mxNuc)" stroke="#2E1A40" stroke-width=".8"/>';
          if (i > 0) out += '<line x1="' + a + '" y1="' + n2(outer - dir) + '" x2="' + a + '" y2="' + n2(inner + dir) + '" stroke="#5E2E24" stroke-width="2"/>';
        }
        out += '<line x1="' + (WIN.x - 20) + '" y1="' + n2(outer - dir * 1.2) + '" x2="' + (WIN.x + WIN.w + 20) + '" y2="' + n2(outer - dir * 1.2) + '" stroke="#E2B6A6" stroke-width="1" opacity=".75"/>';
      });
      return out;
    }

    /* red blood cells: in single file, as they pass along a capillary; each turns from red to blue as it
       gives up its oxygen, and gives it up sooner when the muscle respires faster */
    var NR = 11, LEN = WIN.w + 90;
    function rbcSvg(t) {
      var d = dist(t), out = '', r = resp(t), ym = CAP.y + CAP.h / 2;
      for (var i = 0; i < NR; i++) {
        var x = WIN.x - 45 + ((i * LEN / NR + d) % LEN), yy = ym + (rnd(i, 2) - .5) * 6;
        var along = seg(x, WIN.x, WIN.x + WIN.w);
        var deo = Math.min(1, along * (.45 + .75 * r));
        var col = mix([214, 60, 59], [59, 98, 181], deo), rim = mix([240, 110, 104], [110, 140, 214], deo);
        /* bent as it squeezes along, a red blood cell being about as wide as a capillary: a parachute
           shape, its rounded side leading (the blood flows to the right) */
        out += '<g transform="translate(' + n2(x) + ',' + n2(yy) + ') scale(-1,1)"><path d="M-17 -10 C-6 -15 8 -14 17 -9 C12 -3 12 3 17 9 C8 14 -6 15 -17 10 C-21 5 -21 -5 -17 -10 Z" fill="' + col + '" stroke="#26101A" stroke-width="1.1"/>' +
               '<path d="M-10 -5 C-2 -8 6 -7 11 -4 C8 -1 8 1 11 4 C6 7 -2 8 -10 5 C-12 2 -12 -2 -10 -5 Z" fill="#000" opacity=".14"/>' +
               '<path d="M-15 -8 C-6 -12 6 -12 14 -8" fill="none" stroke="' + rim + '" stroke-width="1.4" opacity=".7"/></g>';
      }
      return out;
    }
    function mix(a, b, k) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }

    /* the molecules, each kind its own shape (Daniel, 26 Sep: "it's a bit hard to differentiate them"):
       oxygen a pair of joined balls (O2), glucose a hexagon (its ring), carbon dioxide three balls in a
       row (O=C=O), lactic acid a diamond. A fixed pool of each; how many are moving at once follows the
       rate. Oxygen and glucose leave the blood, cross the capillary wall and the tissue fluid, and are
       used at a mitochondrion; carbon dioxide and lactic acid go the other way and are carried off
       with the blood. */
    var SHAPE = {
      o2: function (x, y, op) { return '<g transform="translate(' + n2(x) + ',' + n2(y) + ')" opacity="' + op + '"><circle cx="-3.4" r="4.3" fill="#FF6F61" stroke="#FFE4DE" stroke-width="1"/><circle cx="3.4" r="4.3" fill="#FF6F61" stroke="#FFE4DE" stroke-width="1"/></g>'; },
      glu: function (x, y, op) { var p = ''; for (var a = 0; a < 6; a++) { var an = Math.PI / 3 * a + Math.PI / 6; p += (a ? 'L' : 'M') + n2(x + 7.6 * Math.cos(an)) + ' ' + n2(y + 7.6 * Math.sin(an)); } return '<path d="' + p + 'Z" fill="#FFF3A6" stroke="#4A3C06" stroke-width="1.4" opacity="' + op + '"/>'; },
      co2: function (x, y, op) { return '<g transform="translate(' + n2(x) + ',' + n2(y) + ')" opacity="' + op + '"><circle cx="-6.8" r="3.7" fill="#E3E9EE" stroke="#26343C" stroke-width=".9"/><circle cx="6.8" r="3.7" fill="#E3E9EE" stroke="#26343C" stroke-width=".9"/><circle r="4.2" fill="#65737D" stroke="#26343C" stroke-width=".9"/></g>'; },
      lac: function (x, y, op) { return '<path d="M' + n2(x) + ' ' + n2(y - 7.2) + 'L' + n2(x + 7.2) + ' ' + n2(y) + 'L' + n2(x) + ' ' + n2(y + 7.2) + 'L' + n2(x - 7.2) + ' ' + n2(y) + 'Z" fill="#7FDB5A" stroke="#1E4A12" stroke-width="1.1" opacity="' + op + '"/>'; }
    };
    var POOL = 15;
    function molSvg(t) {
      var out = '', r = resp(t), la = lactic(t), G = geom(t), drift = 70 * flow(t);
      function stream(kind, rate, dir) {
        for (var i = 0; i < POOL; i++) {
          if (rnd(i, kind.length * 5) > rate) continue;
          var up = rnd(i, kind.length) < .5, per = 3.4 + rnd(i, 11) * 1.4, u = ((t + rnd(i, 13) * per) % per) / per;
          /* one mitochondrion in the fibre it enters or leaves: under the membrane, or a row deeper */
          var cand = MITO.filter(function (q) { return q.f === (up ? 0 : 1) && (q.sub || rnd(i, 23) < .35); });
          var mt = cand[Math.floor(rnd(i, 19 + kind.length) * cand.length) % cand.length];
          var mx = G.fx(mt.x), my = mt.y, x0 = mx + (rnd(i, 29) - .5) * 40;
          var yLumen = up ? CAP.y + CAP.wall + 9 : CAP.y + CAP.h - CAP.wall - 9;
          var x, y;
          if (dir > 0) { x = lerp(x0, mx, u); y = lerp(yLumen, my, u); }
          else {
            /* out of the cell into the blood, then carried along with it */
            var a = Math.min(1, u / .7);
            x = lerp(mx, x0, a); y = lerp(my, yLumen, a);
            if (u > .7) x += (u - .7) / .3 * drift * .9;
          }
          y += Math.sin((t + i) * 3.1) * 1.6; x += Math.sin((t * 1.7 + i) * 2) * 2;
          var op = dir > 0 ? (u < .1 ? u / .1 : u > .85 ? (1 - u) / .15 : 1) : (u < .15 ? u / .15 : u > .9 ? (1 - u) / .1 : 1);
          out += SHAPE[kind](x, y, n2(op));
        }
      }
      stream('o2', r, 1);
      stream('glu', r * .8, 1);
      stream('co2', r, -1);
      if (la > .02) stream('lac', la * .8, -1);
      return out;
    }

    /* the heart-rate panel, top centre: a heart that beats at the rate, and the number */
    function hudSvg(t) {
      var b = Math.round(bpm(t)), per = 60 / b, ph = (t % per) / per, pulse = ph < .18 ? Math.sin(ph / .18 * Math.PI) : 0;
      var s = 1 + .12 * pulse, cx = 480, cy = 62;
      return '<g class="mx__hud">' +
        '<rect x="' + (cx - 170) + '" y="' + (cy - 36) + '" width="340" height="72" rx="36" fill="#13242E" stroke="#2E4A58" stroke-width="1.5"/>' +
        '<g transform="translate(' + (cx - 118) + ',' + cy + ') scale(' + n2(s) + ')"><path d="M0 14 C-22 -2 -24 -18 -12 -22 C-5 -24 -1 -19 0 -15 C1 -19 5 -24 12 -22 C24 -18 22 -2 0 14 Z" fill="#E24A47" stroke="#FF9C8E" stroke-width="1.5"/></g>' +
        '<text x="' + (cx - 84) + '" y="' + (cy - 6) + '" class="mx__hudk">heart rate</text>' +
        '<text x="' + (cx - 84) + '" y="' + (cy + 24) + '" class="mx__hudv">' + b + ' <tspan class="mx__hudu">beats per minute</tspan></text>' +
        '</g>';
    }

    var fontPx = 20;
    var LAB = [
      { id: 'cell', text: 'muscle cell', x: 300, y: 172, side: 'L' },
      { id: 'mito', text: 'mitochondrion', x: 0, y: 0, side: 'L' },
      { id: 'wall', text: 'capillary wall, one cell thick', x: 262, y: CAP.y + 2.5, side: 'L' },
      { id: 'in', text: 'blood from an arteriole', x: WIN.x + 10, y: CAP.y + CAP.h / 2, side: 'L' },
      { id: 'nuc', text: 'nucleus', x: 0, y: MEM1 - 8.5, side: 'R' },
      { id: 'out', text: 'on to a venule', x: WIN.x + WIN.w - 10, y: CAP.y + CAP.h / 2, side: 'R' },
      { id: 'cell2', text: 'muscle cell', x: 660, y: 420, side: 'R' }
    ];
    /* the mitochondrion's and the nucleus's dots stay on theirs as the fibre shortens (only across:
       the labels themselves do not bob) */
    var MLAB = MITO.filter(function (q) { return q.f === 0 && q.sub; }).sort(function (a, b) { return a.x - b.x; })[1];
    function placeDots(t) { var G = geom(t); LAB[1].x = n2(G.fx(MLAB.x)); LAB[1].y = MLAB.y; LAB[4].x = n2(G.fx(NUC[1].x) + 10 * G.sx); }

    /* the key under the drawing: what is in the blood, and the colours of the red cells. It
       wraps onto more rows when the box is narrow. Returns { svg, h }. */
    function keySvg(t, x0, xmax, y0) {
      var fs = Math.round(fontPx * .8), cw = fs * .54, lh = fs + 16;
      var items = [['o2', '', 'oxygen'], ['glu', '', 'glucose'], ['co2', '', 'carbon dioxide']].concat(t >= 27 ? [['lac', '', 'lactic acid']] : [])
        .concat([['br'], ['rbc', '#D63C3B', 'red blood cell, oxygenated'], ['rbc', '#3B62B5', 'red blood cell, deoxygenated']]);
      var out = '<g class="mx__keyg">', x = x0, y = y0;
      items.forEach(function (it) {
        if (it[0] === 'br') { if (x > x0) { x = x0; y += lh; } return; }
        var wItem = 44 + it[2].length * cw;
        if (x > x0 && x + wItem - 24 > xmax) { x = x0; y += lh; }
        var mol = SHAPE[it[0]], cx = x + (it[0] === 'co2' ? 12 : 8), sh = mol ? mol(cx, y, 1)
          : '<ellipse cx="' + cx + '" cy="' + y + '" rx="12" ry="7.5" fill="' + it[1] + '" stroke="#26101A" stroke-width="1"/>';
        out += sh + '<text x="' + (cx + (it[0] === 'co2' ? 20 : 18)) + '" y="' + n2(y + fs * .36) + '" class="mx__keyt" style="font-size:' + fs + 'px">' + esc(it[2]) + '</text>';
        x += wItem + (it[0] === 'co2' ? 6 : 0);
      });
      return { svg: out + '</g>', h: y - y0 + lh };
    }
    var narrow = false, NV = null, bandH = 0, keyH = 64;
    function render(t) {
      placeDots(t);
      gCells.innerHTML = cellsSvg(t);
      gCap.innerHTML = capSvg(t);
      gRbc.innerHTML = rbcSvg(t);
      gMol.innerHTML = molSvg(t);
      gHud.innerHTML = hudSvg(t);
      if (narrow) {
        /* a phone: numbered pins on the same ruled leaders, the words in a band above */
        var P = L.pinLabels({ items: LAB, left: X0 - 50, right: X1 + 50, font: fontPx, top: 112, bottom: 470, gap: 4 });
        var B = L.pinBand(P.order, NV.x + 16, NV.y + 8, NV.w - 32, Math.round(fontPx * .9), 2);
        gLab.innerHTML = B.svg + P.svg;
        var K = keySvg(t, NV.x + 20, NV.x + NV.w - 16, 486);
        gKey.innerHTML = K.svg;
        var need = 486 + K.h - NV.y;
        if (Math.abs(need - NV.h) > 1) { NV.h = need; frame(); }
      } else {
        gLab.innerHTML = L.labels({ items: LAB, left: X0 - 58, right: X1 + 58, font: fontPx, width: 160, top: 112, bottom: VB.h - 96, gap: 8 });
        gKey.innerHTML = keySvg(t, 48, VB.w - 24, VB.h - 64).svg;
      }
    }
    function frame() {
      var b = narrow ? NV : VB, bg = svg.querySelector('.mx__bg');
      svg.setAttribute('viewBox', b.x + ' ' + b.y + ' ' + b.w + ' ' + b.h);
      bg.setAttribute('x', b.x); bg.setAttribute('y', b.y); bg.setAttribute('width', b.w); bg.setAttribute('height', b.h);
    }

    var sp = L.stepper({ steps: STEPS, end: END, render: render });
    box.appendChild(sp.bar);
    var wrap = h('div', 'mx__wrap');
    fig.appendChild(sp.now);
    /* on a wide screen the drawing stands in the plate's column; the steps stay here */
    var pack = h('div', 'mx__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'Why your heart rate rises')); packT.hidden = true;
    pack.appendChild(packT); pack.appendChild(fig);
    wrap.appendChild(pack); wrap.appendChild(sp.list);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note', 'A drawing, not a photograph. A muscle cell is about ten times as wide as a capillary and millimetres long, so only the part of each cell next to the capillary is shown. The molecules are shown hugely enlarged, and far fewer than the real billions. Blood is drawn red when it is oxygenated and blue when it is deoxygenated, as on every diagram; real blood is never blue. The story is slowed down: a real heart rate rises within a minute of starting to exercise.'));

    var staged = false;
    function fit() {
      var ww = wrap.getBoundingClientRect().width; if (!ww) return;
      /* the list goes under the drawing unless there is room for both at full size; standing in the
         plate's column, the drawing has left, and each step keeps its words in the list */
      wrap.classList.toggle('mx--stack', !staged && ww < 1000);
      var rb = svg.getBoundingClientRect(), w = rb.width; if (!w) return;
      if (staged && rb.height) w = Math.min(w, rb.height * VB.w / VB.h);     /* held back by the height there */
      var nar = w < 520, f;
      if (nar) {
        var NW = 640;
        f = Math.round(Math.max(22, Math.min(34, 12.5 / (w / NW))));
        var fb = Math.round(f * .9);
        bandH = Math.ceil(LAB.length / 2) * fb * 1.25 + fb * .6 + 16;
        NV = { x: 160, y: -bandH, w: NW, h: NV ? NV.h : VB.h + bandH };
      } else {
        f = Math.round(Math.max(18, Math.min(26, 12.5 / (w / VB.w))));
      }
      if (f !== fontPx || nar !== narrow) { fontPx = f; narrow = nar; frame(); sp.paint(sp.time()); }
    }
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } fit(); }) : null;
    if (ro) { ro.observe(wrap); ro.observe(fig); }
    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: wrap, before: function () { return sp.list; }, watch: function () { return box; },
      onPlace: function (inColumn) { staged = inColumn; packT.hidden = !inColumn; box.classList.toggle('mx--staged', inColumn); sp.compact(inColumn); fit(); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); if (stg) stg.detach(); };
    box.__seek = function (t) { return sp.seek(t); };
    sp.paint(0);
    return box;
  }

  L.add('muscle', muscle);
})(window);
