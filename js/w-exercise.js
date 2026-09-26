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

  /* the scene, in its own units */
  var VB = { x: 0, y: 0, w: 960, h: 560 };
  var X0 = 262, X1 = 698;                         /* where the muscle cells run; the capillary runs 40 further each way */
  var F1 = { y: 150, h: 92 }, F2 = { y: 352, h: 92 };
  var CAP = { y: 262, h: 70 };                     /* the capillary: its outer edges; the wall is one cell thick */

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
      '<pattern id="mxStr" width="9" height="10" patternUnits="userSpaceOnUse"><rect width="9" height="10" fill="none"/><rect x="0" width="3.2" height="10" fill="#7E2A36" opacity=".38"/><rect x="5.5" width="1" height="10" fill="#F4C9CB" opacity=".22"/></pattern>' +
      '<linearGradient id="mxCap" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#3A1418"/><stop offset="1" stop-color="#1F1830"/></linearGradient>' +
      '<radialGradient id="mxMito" cx=".5" cy=".5" r=".6"><stop offset="0" stop-color="#FFE9A8"/><stop offset="1" stop-color="#E8A94A"/></radialGradient>' +
      '</defs>' +
      '<rect class="mx__bg" x="0" y="0" width="' + VB.w + '" height="' + VB.h + '" rx="18"/>' +
      '<g class="mx__cells"></g>' +
      '<g class="mx__cap"></g><g class="mx__mol"></g><g class="mx__rbc"></g>' +
      '<g class="mx__hud"></g><g class="mx__labels"></g><g class="mx__key"></g>';
    svg.innerHTML = s;
    var gCells = svg.querySelector('.mx__cells'), gCap = svg.querySelector('.mx__cap'), gMol = svg.querySelector('.mx__mol'),
        gRbc = svg.querySelector('.mx__rbc'), gHud = svg.querySelector('.mx__hud'), gLab = svg.querySelector('.mx__labels'), gKey = svg.querySelector('.mx__key');

    /* the mitochondria: fixed places in each muscle cell, between the bundles of fibres */
    var MITO = [];
    [F1, F2].forEach(function (F, fi) {
      for (var i = 0; i < 11; i++) {
        var x = X0 + 34 + i * (X1 - X0 - 84) / 10 + (rnd(i, fi + 3) - .5) * 14, y = F.y + 18 + rnd(i, fi + 7) * (F.h - 36);
        MITO.push({ x: x, y: y, a: (rnd(i, fi + 9) - .5) * 30 });
      }
    });
    var NUC = [{ f: F1, x: X0 + 132, top: true }, { f: F1, x: X0 + 408, top: true }, { f: F2, x: X0 + 262, top: false }];

    function cellsSvg(t) {
      /* a contraction: the cell shortens a little from its right end and thickens, once a second */
      var ph = beatPhase(t), k = contract(t) * (t >= 34 ? 0 : 1) * (ph < .5 ? Math.sin(ph / .5 * Math.PI) : 0);
      var shrink = 16 * k, thick = 4 * k;
      var out = '';
      [F1, F2].forEach(function (F) {
        var x0 = X0, x1 = X1 - shrink, y0 = F.y - thick / 2, hh = F.h + thick;
        out += '<rect x="' + n2(x0) + '" y="' + n2(y0) + '" width="' + n2(x1 - x0) + '" height="' + n2(hh) + '" rx="34" fill="url(#mxFib)" stroke="#5A1A24" stroke-width="2"/>' +
               '<rect x="' + n2(x0 + 14) + '" y="' + n2(y0 + 6) + '" width="' + n2(x1 - x0 - 28) + '" height="' + n2(hh - 12) + '" rx="28" fill="url(#mxStr)"/>';
      });
      NUC.forEach(function (N) {
        var y = N.top ? N.f.y + 12 : N.f.y + N.f.h - 12;
        out += '<ellipse cx="' + N.x + '" cy="' + y + '" rx="22" ry="7" fill="#5B3A78" stroke="#2E1A40" stroke-width="1.2" opacity=".92"/>';
      });
      var glow = resp(t);
      MITO.forEach(function (m) {
        out += '<g transform="translate(' + n2(m.x) + ',' + n2(m.y) + ') rotate(' + n2(m.a) + ')">' +
          (glow > .32 ? '<ellipse rx="' + n2(13 + 7 * glow) + '" ry="' + n2(8 + 5 * glow) + '" fill="#FFD76A" opacity="' + n2(.12 + .3 * (glow - .3)) + '"/>' : '') +
          '<ellipse rx="11" ry="5.6" fill="url(#mxMito)" stroke="#8A5A12" stroke-width="1"/>' +
          '<path d="M-7 0 C-5 -3 -3 3 -1 0 C1 -3 3 3 5 0 C6 -2 7 1 8 0" fill="none" stroke="#9C6A1E" stroke-width="1"/></g>';
      });
      return out;
    }

    function capSvg(t) {
      /* the capillary: a thin wall one cell thick, and the lumen; the blood flows left to right */
      var y0 = CAP.y, y1 = CAP.y + CAP.h, wall = 5, a = X0 - 40, b = X1 + 40, ym = y0 + CAP.h / 2;
      return '<rect x="' + a + '" y="' + y0 + '" width="' + (b - a) + '" height="' + CAP.h + '" fill="url(#mxCap)"/>' +
        '<rect x="' + a + '" y="' + y0 + '" width="' + (b - a) + '" height="' + wall + '" fill="#E7B8A8"/>' +
        '<rect x="' + a + '" y="' + (y1 - wall) + '" width="' + (b - a) + '" height="' + wall + '" fill="#E7B8A8"/>';
    }

    /* red blood cells: evenly spaced, moving with the blood; each turns from red to blue as it
       gives up its oxygen, and gives it up sooner when the muscle respires faster */
    var NR = 12, LEN = X1 - X0 + 110;
    function rbcSvg(t) {
      var d = dist(t), out = '', r = resp(t);
      for (var i = 0; i < NR; i++) {
        var x = X0 - 55 + ((i * LEN / NR + d) % LEN), yy = CAP.y + CAP.h / 2 + (rnd(i, 2) - .5) * 14;
        var along = seg(x, X0 - 30, X1 + 30);
        var deo = Math.min(1, along * (.45 + .75 * r));
        var col = mix([214, 60, 59], [59, 98, 181], deo);
        var edge = Math.min(1, (x - (X0 - 40 + 14)) / 14, ((X1 + 40 - 14) - x) / 14);
        if (edge <= 0) continue;
        out += '<g transform="translate(' + n2(x) + ',' + n2(yy) + ')" opacity="' + n2(edge) + '"><ellipse rx="17" ry="11" fill="' + col + '" stroke="#26101A" stroke-width="1.2"/>' +
               '<ellipse rx="8" ry="4.5" fill="#000" opacity=".16"/></g>';
      }
      return out;
    }
    function mix(a, b, k) { return 'rgb(' + Math.round(a[0] + (b[0] - a[0]) * k) + ',' + Math.round(a[1] + (b[1] - a[1]) * k) + ',' + Math.round(a[2] + (b[2] - a[2]) * k) + ')'; }

    /* the molecules: a fixed pool of each; how many are moving at once follows the rate. Each
       crosses the wall and the gap between capillary and cell, then fades inside the cell (used)
       — or the other way for carbon dioxide and lactic acid. */
    var POOL = 26;
    function molSvg(t) {
      var out = '', r = resp(t), la = lactic(t);
      function stream(kind, n, rate, dir, colour, shape) {
        for (var i = 0; i < n; i++) {
          if (rnd(i, kind.length * 5) > rate) continue;
          var up = rnd(i, kind.length) < .5, per = 3.2 + rnd(i, 11) * 1.6, u = ((t + rnd(i, 13) * per) % per) / per;
          var x = X0 + 40 + rnd(i, 17 + kind.length) * (X1 - X0 - 80) + (dir > 0 ? 0 : 6);
          var yCap = up ? CAP.y + 8 : CAP.y + CAP.h - 8, yCell = up ? F1.y + F1.h - 26 : F2.y + 26;
          var k = dir > 0 ? u : 1 - u;
          var y = lerp(yCap, yCell, k) + Math.sin((t + i) * 3.1) * 2.2;
          var xx = x + Math.sin((t * 1.7 + i) * 2) * 3;
          var op = dir > 0 ? (u < .1 ? u / .1 : u > .82 ? (1 - u) / .18 : 1) : (u < .18 ? u / .18 : u > .9 ? (1 - u) / .1 : 1);
          out += shape(xx, y, colour, n2(op));
        }
      }
      var dot = function (x, y, c, op) { return '<circle cx="' + n2(x) + '" cy="' + n2(y) + '" r="5.2" fill="' + c + '" stroke="#0D1A22" stroke-width="1" opacity="' + op + '"/>'; };
      var hex = function (x, y, c, op) { var p = ''; for (var a = 0; a < 6; a++) { var an = Math.PI / 3 * a; p += (a ? 'L' : 'M') + n2(x + 6.4 * Math.cos(an)) + ' ' + n2(y + 6.4 * Math.sin(an)); } return '<path d="' + p + 'Z" fill="' + c + '" stroke="#0D1A22" stroke-width="1" opacity="' + op + '"/>'; };
      var diamond = function (x, y, c, op) { return '<path d="M' + n2(x) + ' ' + n2(y - 6.5) + 'L' + n2(x + 6.5) + ' ' + n2(y) + 'L' + n2(x) + ' ' + n2(y + 6.5) + 'L' + n2(x - 6.5) + ' ' + n2(y) + 'Z" fill="' + c + '" stroke="#0D1A22" stroke-width="1" opacity="' + op + '"/>'; };
      stream('oxygen', POOL, r, 1, '#FF8A7E', dot);
      stream('glucose', POOL, r * .8, 1, '#F2E6A0', hex);
      stream('carbondioxide', POOL, r, -1, '#B9C4CC', dot);
      if (la > .02) stream('lactic', POOL, la * .8, -1, '#9BE07C', diamond);
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
      { id: 'cell', text: 'muscle cell', x: X0 + 60, y: F1.y + 48, side: 'L' },
      { id: 'mito', text: 'mitochondrion', x: 0, y: 0, side: 'L' },
      { id: 'wall', text: 'capillary wall, one cell thick', x: X0 + 22, y: CAP.y + 2.5, side: 'L' },
      { id: 'in', text: 'blood from an arteriole', x: X0 - 26, y: CAP.y + CAP.h / 2 + 6, side: 'L' },
      { id: 'nuc', text: 'nucleus', x: NUC[1].x + 18, y: F1.y + 12, side: 'R' },
      { id: 'out', text: 'on to a venule', x: X1 + 26, y: CAP.y + CAP.h / 2, side: 'R' },
      { id: 'cell2', text: 'muscle cell', x: X1 - 50, y: F2.y + 60, side: 'R' }
    ];
    /* point the mitochondrion's label at a real one, on the left of the upper cell */
    (function () { var m = MITO.filter(function (q) { return q.y < F1.y + F1.h; }).sort(function (a, b) { return a.x - b.x; })[1]; LAB[1].x = m.x - 8; LAB[1].y = m.y; })();

    /* the key under the drawing: what is in the blood, and the colours of the red cells. It
       wraps onto more rows when the box is narrow. Returns { svg, h }. */
    function keySvg(t, x0, xmax, y0) {
      var fs = Math.round(fontPx * .8), cw = fs * .54, lh = fs + 16;
      var items = [['dot', '#FF8A7E', 'oxygen'], ['hex', '#F2E6A0', 'glucose'], ['dot', '#B9C4CC', 'carbon dioxide']].concat(t >= 27 ? [['dia', '#9BE07C', 'lactic acid']] : [])
        .concat([['br'], ['rbc', '#D63C3B', 'red blood cell, oxygenated'], ['rbc', '#3B62B5', 'red blood cell, deoxygenated']]);
      var out = '<g class="mx__keyg">', x = x0, y = y0;
      items.forEach(function (it) {
        if (it[0] === 'br') { if (x > x0) { x = x0; y += lh; } return; }
        var wItem = 44 + it[2].length * cw;
        if (x > x0 && x + wItem - 24 > xmax) { x = x0; y += lh; }
        var cx = x + 8, sh = it[0] === 'dot' ? '<circle cx="' + cx + '" cy="' + y + '" r="6.5" fill="' + it[1] + '"/>'
          : it[0] === 'hex' ? '<path d="M' + (cx + 7) + ' ' + y + 'L' + (cx + 3.5) + ' ' + (y + 6) + 'L' + (cx - 3.5) + ' ' + (y + 6) + 'L' + (cx - 7) + ' ' + y + 'L' + (cx - 3.5) + ' ' + (y - 6) + 'L' + (cx + 3.5) + ' ' + (y - 6) + 'Z" fill="' + it[1] + '"/>'
          : it[0] === 'dia' ? '<path d="M' + cx + ' ' + (y - 7.5) + 'L' + (cx + 7.5) + ' ' + y + 'L' + cx + ' ' + (y + 7.5) + 'L' + (cx - 7.5) + ' ' + y + 'Z" fill="' + it[1] + '"/>'
          : '<ellipse cx="' + cx + '" cy="' + y + '" rx="12" ry="7.5" fill="' + it[1] + '" stroke="#26101A" stroke-width="1"/>';
        out += sh + '<text x="' + (cx + 18) + '" y="' + n2(y + fs * .36) + '" class="mx__keyt" style="font-size:' + fs + 'px">' + esc(it[2]) + '</text>';
        x += wItem;
      });
      return { svg: out + '</g>', h: y - y0 + lh };
    }
    var narrow = false, NV = null, bandH = 0, keyH = 64;
    function render(t) {
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
    box.appendChild(h('p', 'widget__note', 'A drawing, not a photograph. The molecules are shown hugely enlarged, and far fewer than the real billions. Blood is drawn red when it is oxygenated and blue when it is deoxygenated, as on every diagram; real blood is never blue. The story is slowed down: a real heart rate rises within a minute of starting to exercise.'));

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
      onPlace: function (inColumn) { staged = inColumn; packT.hidden = !inColumn; box.classList.toggle('mx--staged', inColumn); fit(); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); if (stg) stg.detach(); };
    box.__seek = function (t) { return sp.seek(t); };
    sp.paint(0);
    return box;
  }

  L.add('muscle', muscle);
})(window);
