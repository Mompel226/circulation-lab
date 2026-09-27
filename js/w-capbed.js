/* ============================================================
   w-capbed.js — "capbed": how arteries, capillaries and veins join (station `vessels`, 0610 9.3).

   Daniel, 27 Sep 2026: "show artery, vein and capillaries, how they interconnect together, in one image,
   with a little bit of animation ... instead of actually showing the whole body". One capillary bed, as
   every textbook draws it: an artery branches into arterioles, each arteriole into capillaries that run
   between the tissue cells, and the capillaries join into venules, which join a vein. Red blood cells flow
   through it all, slowest in the capillaries, where they pass in single file; the blood turns from red
   (oxygenated) to blue (deoxygenated) along the capillaries, as oxygen and glucose diffuse out to the cells
   and carbon dioxide diffuses in.

   On a wide screen the drawing stands in the plate's column (the station is a bench: plate.js shows
   #benchHost instead of the body); the widget keeps a line saying where it is, and a pause button. On a
   phone, or while the journey from artery to vein stands in the column, the drawing stays in the widget.
   box.__seek(t) draws any moment, for the headless checks.

   The biology (OpenStax, Anatomy and Physiology 2e, 2022, sections 20.1 and 20.3, CC BY 4.0): an artery's
   wall is thick, with muscle and elastic fibres; an arteriole's has one or two layers of smooth muscle; a
   capillary's wall is one cell thick and its lumen so narrow that red cells pass one at a time; a venule's
   wall is thin; a vein has a thin wall and a wide lumen. Arterioles and venules are named in 0610 only in
   14.4 (S), so their names are drawn as extension. Not to scale: a real capillary is 5-10 µm across and an
   artery millimetres; the widget says so.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L || !L.add) return;
  var h = L.h, esc = L.esc;
  var NS = 'http://www.w3.org/2000/svg';
  var UID = 0;
  function n1(v) { return Math.round(v * 10) / 10; }
  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  function mix(a, b, k) {
    var A = [parseInt(a.slice(1, 3), 16), parseInt(a.slice(3, 5), 16), parseInt(a.slice(5, 7), 16)], B = [parseInt(b.slice(1, 3), 16), parseInt(b.slice(3, 5), 16), parseInt(b.slice(5, 7), 16)], o = '#';
    for (var i = 0; i < 3; i++) { var v = Math.round(A[i] + (B[i] - A[i]) * clamp01(k)); o += (v < 16 ? '0' : '') + v.toString(16); }
    return o;
  }
  var OXY = '#D63C3B', DEO = '#3B62B5';

  /* ---------- the bed, in its own units: the artery down the left, the vein up the right ---------- */
  var AX = 64, VX = 356, AR = 21, AL = 11, VR = 23, VL = 19, TOP = -24, BOT = 600;
  var BEDS = [96, 290, 484];                     /* where each arteriole leaves the artery */
  var X0 = 132, X1 = 292;                        /* the capillaries run between these */
  /* a smooth path through points (Catmull-Rom) */
  function curve(P) {
    var d = 'M' + n1(P[0][0]) + ' ' + n1(P[0][1]);
    for (var i = 0; i + 1 < P.length; i++) {
      var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      d += ' C' + n1(p1[0] + (p2[0] - p0[0]) / 6) + ' ' + n1(p1[1] + (p2[1] - p0[1]) / 6) + ' ' + n1(p2[0] - (p3[0] - p1[0]) / 6) + ' ' + n1(p2[1] - (p3[1] - p1[1]) / 6) + ' ' + n1(p2[0]) + ' ' + n1(p2[1]);
    }
    return d;
  }
  /* sample a Catmull-Rom curve into points */
  function sampleCurve(P, per) {
    var out = [];
    for (var i = 0; i + 1 < P.length; i++) {
      var p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      var c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
      for (var k = 0; k < per; k++) {
        var t = k / per, u = 1 - t;
        out.push([u * u * u * p1[0] + 3 * u * u * t * c1[0] + 3 * u * t * t * c2[0] + t * t * t * p2[0], u * u * u * p1[1] + 3 * u * u * t * c1[1] + 3 * u * t * t * c2[1] + t * t * t * p2[1]]);
      }
    }
    out.push(P[P.length - 1]);
    return out;
  }
  /* each bed: an arteriole, three capillaries fanning out and back, a venule */
  var BED = BEDS.map(function (yb, b) {
    var yv = yb + 22;
    var arteriole = [[AX + AR - 6, yb], [AX + 38, yb + 2], [X0 - 16, yb]];
    var caps = [-46, 0, 46].map(function (dy, c) {
      var w = (b + c) % 2 ? 1 : -1;
      return [[X0 - 16, yb], [X0 + 14, yb + dy * .7], [X0 + 58, yb + dy + 8 * w], [X0 + 104, yb + dy - 6 * w], [X1 - 14, yv + dy * .7], [X1 + 14, yv]];
    });
    var venule = [[X1 + 14, yv], [X1 + 40, yv - 4], [VX - VR + 6, yv - 14]];
    return { yb: yb, yv: yv, arteriole: arteriole, caps: caps, venule: venule };
  });
  /* The capillaries of one bed also join those of the next: a network, not separate fans. Blood in a link flows
     from higher pressure to lower, so each runs from the arteriole half of one capillary to the venule half of the
     next and carries red cells (Daniel, 27 Sep: the links were upright tubes with no flow, their ends sealed by the
     capillaries' walls). i1, i2: where it leaves and joins, as sample numbers along the two capillaries. */
  var LINKS = [0, 1].map(function (b) {
    var A = sampleCurve(BED[b].caps[2], 8), B = sampleCurve(BED[b + 1].caps[0], 8);
    var i1 = Math.round(A.length * .34), i2 = Math.round(B.length * .64), p1 = A[i1], p2 = B[i2];
    var a1 = A[i1 + 1], b1 = B[i2 - 1];                /* leave and join along each capillary's own direction */
    var d1 = [a1[0] - p1[0], a1[1] - p1[1]], d2 = [p2[0] - b1[0], p2[1] - b1[1]], l1 = Math.hypot(d1[0], d1[1]) || 1, l2 = Math.hypot(d2[0], d2[1]) || 1;
    return { b: b, i1: i1, i2: i2, A: A, B: B,
             pts: [p1, [p1[0] + d1[0] / l1 * 14, p1[1] + d1[1] / l1 * 14 + 12], [(p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2], [p2[0] - d2[0] / l2 * 14, p2[1] - d2[1] / l2 * 14 - 12], p2] };
  });

  /* the routes a red cell can take, each a list of [points, speed, kind] segments */
  function routes() {
    var out = [];
    BED.forEach(function (bd) {
      bd.caps.forEach(function (cp) {
        out.push([
          [[[AX, TOP], [AX, bd.yb]], 1.8, 'a'],
          [sampleCurve(bd.arteriole, 6), 1.2, 'a'],
          [sampleCurve(cp, 8), .42, 'c'],
          [sampleCurve(bd.venule, 6), .9, 'v'],
          [[[VX, bd.yv - 14], [VX, TOP]], 1.3, 'v']
        ]);
      });
    });
    LINKS.forEach(function (lk) {                             /* through a link, from one bed to the next */
      var bd = BED[lk.b], bn = BED[lk.b + 1];
      out.push([
        [[[AX, TOP], [AX, bd.yb]], 1.8, 'a'],
        [sampleCurve(bd.arteriole, 6), 1.2, 'a'],
        [lk.A.slice(0, lk.i1 + 1), .42, 'c'],
        [sampleCurve(lk.pts, 8), .42, 'c'],
        [lk.B.slice(lk.i2), .42, 'c'],
        [sampleCurve(bn.venule, 6), .9, 'v'],
        [[[VX, bn.yv - 14], [VX, TOP]], 1.3, 'v']
      ]);
    });
    out.push([[[[AX, TOP], [AX, BOT]], 1.8, 'a']]);          /* on down the artery, to the beds below */
    out.push([[[[VX, BOT], [VX, TOP]], 1.3, 'v']]);          /* up the vein, from the beds below */
    /* each route as samples, with the time it takes to reach each one */
    return out.map(function (segs) {
      var pts = [], tt = [0], kind = [];
      segs.forEach(function (sg) {
        var P = sg[0];
        if (P.length === 2) {           /* a straight run: sample it */
          var n = Math.max(2, Math.round(Math.hypot(P[1][0] - P[0][0], P[1][1] - P[0][1]) / 8)), Q = [];
          for (var i = 0; i <= n; i++) Q.push([P[0][0] + (P[1][0] - P[0][0]) * i / n, P[0][1] + (P[1][1] - P[0][1]) * i / n]);
          P = Q;
        }
        P.forEach(function (q) {
          if (pts.length) { var l = pts[pts.length - 1]; tt.push(tt[tt.length - 1] + Math.hypot(q[0] - l[0], q[1] - l[1]) / (sg[1] * 60)); }
          pts.push(q); kind.push(sg[2]);
        });
      });
      return { pts: pts, tt: tt, kind: kind, T: tt[tt.length - 1] };
    });
  }
  var ROUTES = routes();

  function capbed(spec) {
    var u = 'cb' + (++UID) + '-';
    var box = h('div', 'widget cb');
    box.appendChild(L.head(spec.title || 'How arteries, capillaries and veins join', spec.ask, 'Watch'));
    var where = h('p', 'cb__where', 'The drawing is on the left: blood flows from an artery, through the capillaries between the tissue cells, into a vein.');
    var ctl = h('div', 'cb__ctl');
    var pause = h('button', 'wbtn cb__pause', '❚❚ Pause'); pause.type = 'button';
    ctl.appendChild(pause);
    var slot = h('div', 'cb__slot');
    var stage = h('figure', 'cb__stage');
    var title = h('p', 'stg__title cb__title', esc(spec.title || 'How arteries, capillaries and veins join'));
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'cb__svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('viewBox', '-150 -34 700 664');
    svg.setAttribute('aria-label', 'A capillary bed: an artery on the left branches into arterioles, which branch into capillaries running between the tissue cells; the capillaries join into venules, which join a vein on the right. Red blood cells flow through, and the blood turns from red to blue in the capillaries.');
    stage.appendChild(title); stage.appendChild(svg);
    stage.appendChild(h('figcaption', 'cb__key', '<span class="cb__sw cb__sw--o"></span>oxygenated <span class="cb__sw cb__sw--d"></span>deoxygenated · <span class="cb__arr cb__arr--o">→</span> oxygen and glucose out to the cells · <span class="cb__arr cb__arr--c">←</span> carbon dioxide in. Not to scale: a capillary is 5–10 µm across, an artery millimetres.'));
    slot.appendChild(stage);
    box.appendChild(where); box.appendChild(slot); box.appendChild(ctl);

    /* ----- the drawing, built once ----- */
    var r = rng(17), s = '';
    s += '<defs>' +
      '<linearGradient id="' + u + 'cg" gradientUnits="userSpaceOnUse" x1="' + (X0 + 6) + '" x2="' + (X1 - 6) + '" y1="0" y2="0"><stop offset="0" stop-color="' + OXY + '"/><stop offset=".5" stop-color="#8E4A87"/><stop offset="1" stop-color="' + DEO + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'aw" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#8F2F2A"/><stop offset=".3" stop-color="#D0736A"/><stop offset=".7" stop-color="#B9544C"/><stop offset="1" stop-color="#7A2622"/></linearGradient>' +
      '<linearGradient id="' + u + 'vw" x1="0" x2="1" y1="0" y2="0"><stop offset="0" stop-color="#5E7BB8"/><stop offset=".35" stop-color="#A9BEE3"/><stop offset=".7" stop-color="#8FA7D8"/><stop offset="1" stop-color="#4E6AA6"/></linearGradient>' +
      '<radialGradient id="' + u + 'tc" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#FBE9E1"/><stop offset="1" stop-color="#EBCFC3"/></radialGradient>' +
      '</defs>';
    /* the tissue: a pale ground, then cells packed between the capillaries */
    s += '<rect x="' + (AX + AR + 2) + '" y="' + (TOP + 30) + '" width="' + (VX - VR - AX - AR - 4) + '" height="' + (BOT - TOP - 60) + '" rx="18" class="cb__tissue"/>';
    var capPts = [];
    BED.forEach(function (bd) { bd.caps.forEach(function (cp) { capPts = capPts.concat(sampleCurve(cp, 8)); }); capPts = capPts.concat(sampleCurve(bd.arteriole, 6), sampleCurve(bd.venule, 6)); });
    LINKS.forEach(function (lk) { capPts = capPts.concat(sampleCurve(lk.pts, 6)); });
    var cells = '', CELLC = [];
    for (var gy = TOP + 42; gy < BOT - 32; gy += 23) {
      for (var gx = AX + AR + 16 + (Math.round(gy / 23) % 2 ? 11 : 0); gx < VX - VR - 12; gx += 23) {
        var cx = gx + (r() - .5) * 9, cy = gy + (r() - .5) * 9, ok = true;
        for (var i = 0; i < capPts.length; i++) { if (Math.hypot(capPts[i][0] - cx, capPts[i][1] - cy) < 14.5) { ok = false; break; } }
        if (!ok) continue;
        var rr = 10.2 + r() * 1.6, poly = '';
        for (var k = 0; k < 6; k++) { var an = k / 6 * Math.PI * 2 + r() * .5, rk = rr * (.86 + r() * .2); poly += (k ? ' L' : 'M') + n1(cx + Math.cos(an) * rk) + ' ' + n1(cy + Math.sin(an) * rk); }
        CELLC.push([cx, cy]);
        cells += '<path d="' + poly + 'Z" class="cb__cell" fill="url(#' + u + 'tc)"/><circle cx="' + n1(cx + (r() - .5) * 3) + '" cy="' + n1(cy + (r() - .5) * 3) + '" r="' + n1(2.6 + r()) + '" class="cb__nuc"/>';
      }
    }
    s += '<g class="cb__cells">' + cells + '</g>';
    /* the capillaries, the links, the arterioles and venules: each a wall, then its blood */
    /* every wall first, then every lumen: where two vessels meet, their lumens run into each other with no wall
       drawn across the opening */
    var WALLS = [], BLOOD = [];
    function tube(d, wallW, lumW, wallCls, blood) {
      WALLS.push('<path d="' + d + '" class="cb__wall ' + wallCls + '" stroke-width="' + wallW + '"/>');
      BLOOD.push('<path d="' + d + '" class="cb__blood" stroke="' + blood + '" stroke-width="' + lumW + '"/>');
    }
    var capBlood = 'url(#' + u + 'cg)';
    LINKS.forEach(function (lk) { tube(curve(lk.pts), 7.2, 4.6, 'cb__wall--c', capBlood); });
    BED.forEach(function (bd) { bd.caps.forEach(function (cp) { tube(curve(cp), 7.2, 4.6, 'cb__wall--c', capBlood); }); });
    BED.forEach(function (bd) {
      tube(curve(bd.arteriole), 16, 8.5, 'cb__wall--ao', OXY);
      tube(curve(bd.venule), 15, 11, 'cb__wall--vo', DEO);
    });
    s += WALLS.join('') + BLOOD.join('');
    /* the artery and the vein: tubes shaded round, the artery's wall thick, the vein's thin with a wide lumen */
    s += '<rect x="' + (AX - AR) + '" y="' + TOP + '" width="' + (AR * 2) + '" height="' + (BOT - TOP) + '" fill="url(#' + u + 'aw)"/>' +
         '<rect x="' + (AX - AL) + '" y="' + TOP + '" width="' + (AL * 2) + '" height="' + (BOT - TOP) + '" fill="' + OXY + '"/>' +
         '<rect x="' + (AX - AL + 2) + '" y="' + TOP + '" width="3" height="' + (BOT - TOP) + '" fill="#FF9C8E" opacity=".45"/>';
    s += '<rect x="' + (VX - VR) + '" y="' + TOP + '" width="' + (VR * 2) + '" height="' + (BOT - TOP) + '" fill="url(#' + u + 'vw)"/>' +
         '<rect x="' + (VX - VL) + '" y="' + TOP + '" width="' + (VL * 2) + '" height="' + (BOT - TOP) + '" fill="' + DEO + '"/>' +
         '<rect x="' + (VX - VL + 3) + '" y="' + TOP + '" width="3" height="' + (BOT - TOP) + '" fill="#86A7EA" opacity=".45"/>';
    /* where the arterioles leave the artery and the venules join the vein: the lumens meet */
    BED.forEach(function (bd) {
      s += '<rect x="' + (AX + AL - 2) + '" y="' + (bd.yb - 4.2) + '" width="' + (AR - AL + 10) + '" height="8.5" fill="' + OXY + '"/>';
      s += '<rect x="' + (VX - VR - 8) + '" y="' + (bd.yv - 19.5) + '" width="' + (VR - VL + 12) + '" height="11" fill="' + DEO + '"/>';
    });
    /* the smooth muscle round each arteriole: bands across it */
    BED.forEach(function (bd) {
      sampleCurve(bd.arteriole, 6).forEach(function (q, i, A) {
        if (i % 2 || i < 2 || i > A.length - 3) return;
        var nx = A[i + 1] ? A[i + 1][0] - q[0] : 1, ny = A[i + 1] ? A[i + 1][1] - q[1] : 0, ln = Math.hypot(nx, ny) || 1;
        s += '<path d="M' + n1(q[0] - ny / ln * 8) + ' ' + n1(q[1] + nx / ln * 8) + ' L' + n1(q[0] + ny / ln * 8) + ' ' + n1(q[1] - nx / ln * 8) + '" class="cb__smc"/>';
      });
    });
    /* which way the blood goes */
    s += '<g class="cb__flow"><path d="M' + AX + ' ' + (TOP + 4) + ' l0 22 m-7 -8 l7 8 l7 -8"/><path d="M' + VX + ' ' + (TOP + 26) + ' l0 -22 m-7 8 l7 -8 l7 8"/></g>';
    s += '<text x="' + AX + '" y="' + (TOP - 2) + '" text-anchor="middle" class="cb__end">from the heart</text><text x="' + VX + '" y="' + (TOP - 2) + '" text-anchor="middle" class="cb__end">to the heart</text>';
    /* the exchange, on the middle capillary of each bed: oxygen and glucose out, carbon dioxide in */
    var ex = '';
    BED.forEach(function (bd, b) {
      var cp = sampleCurve(bd.caps[1], 8), q = cp[Math.round(cp.length * .38)], q2 = cp[Math.round(cp.length * .62)];
      ex += '<g class="cb__ex" data-b="' + b + '"><path class="cb__o2" d="M' + n1(q[0]) + ' ' + n1(q[1] - 6) + ' l0 -15 m-4 5 l4 -5 l4 5"/>' +
        '<path class="cb__co2" d="M' + n1(q2[0]) + ' ' + n1(q2[1] + 21) + ' l0 -15 m-4 5 l4 -5 l4 5"/></g>';
    });
    s += ex + '<g class="cb__rbc"></g><g class="cb__labs"></g>';
    svg.innerHTML = s;
    var gRbc = svg.querySelector('.cb__rbc'), gLabs = svg.querySelector('.cb__labs'), exEls = svg.querySelectorAll('.cb__ex');

    /* ----- the red cells: a few on every route, spread evenly in time ----- */
    var RBC = [];
    ROUTES.forEach(function (rt, ri) {
      var n = ri >= ROUTES.length - 2 ? 9 : 6;
      for (var i = 0; i < n; i++) {
        var el = document.createElementNS(NS, 'ellipse');
        el.setAttribute('class', 'cb__c');
        gRbc.appendChild(el);
        RBC.push({ el: el, rt: rt, off: rt.T * (i + r() * .4) / n });
      }
    });
    function at(rt, tau) {
      var lo = 0, hi = rt.tt.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (rt.tt[m] < tau) lo = m; else hi = m; }
      var k = (tau - rt.tt[lo]) / ((rt.tt[hi] - rt.tt[lo]) || 1), a = rt.pts[lo], b = rt.pts[hi];
      return { x: a[0] + (b[0] - a[0]) * k, y: a[1] + (b[1] - a[1]) * k, dx: b[0] - a[0], dy: b[1] - a[1], kind: rt.kind[hi] };
    }
    function render(t) {
      RBC.forEach(function (c) {
        var q = at(c.rt, (t + c.off) % c.rt.T);
        var capK = q.kind === 'c' ? clamp01((q.x - X0 - 6) / (X1 - X0 - 12)) : q.kind === 'a' ? 0 : 1;
        var ang = Math.atan2(q.dy, q.dx) * 57.3, small = q.kind === 'c';
        c.el.setAttribute('rx', small ? 3.3 : 5.2); c.el.setAttribute('ry', small ? 2.1 : 3.2);
        c.el.setAttribute('transform', 'translate(' + n1(q.x) + ' ' + n1(q.y) + ') rotate(' + n1(ang) + ')');
        c.el.setAttribute('fill', q.kind === 'c' ? mix(mix('#FF8A7E', '#B77CC0', capK * 2), '#7FA0E8', (capK - .5) * 2) : q.kind === 'a' ? '#FF8A7E' : '#7FA0E8');
      });
      /* the exchange arrows pulse slowly, one bed after another */
      Array.prototype.forEach.call(exEls, function (g, b) { var ph = ((t / 2.4) + b / 3) % 1; g.setAttribute('opacity', n1(.25 + .75 * Math.sin(Math.PI * ph))); });
    }

    /* ----- the names, in the margins, leaders ruled level ----- */
    /* the lettering is at least 13 px on screen, as in every drawing in the lab; the margins widen to hold the
       longest name at that size, and the drawing's own width stays 440 units */
    var DW = 440;
    function fitLab(D) {
      var f = 17, mL = 150, mR = 110;
      for (var i = 0; i < 8; i++) { f = Math.max(17, 13 * (DW + mL + mR) / Math.max(200, D)); mL = Math.max(150, 11 * .55 * f + 24); mR = Math.max(110, 11 * .55 * f + 24); }
      return { f: f, mL: mL, mR: mR };
    }
    function labels() {
      var D = svg.getBoundingClientRect().width || 700, fl = fitLab(D), f = fl.f;
      svg.setAttribute('viewBox', n1(-fl.mL) + ' -34 ' + n1(DW + fl.mL + fl.mR) + ' 664');
      var items = [
        { id: 'artery', text: 'artery', x: AX - AR, y: 36, side: 'L' },
        { id: 'arteriole', text: 'arteriole', x: AX + 44, y: BEDS[1] + 1, side: 'L', cls: 'is-ext' },
        { id: 'cells', text: 'tissue cells', x: 0, y: 0, side: 'L' },
        { id: 'caps', text: 'capillaries', x: 0, y: 0, side: 'R' },
        { id: 'venule', text: 'venule', x: X1 + 38, y: BED[2].yv - 4, side: 'R', cls: 'is-ext' },
        { id: 'vein', text: 'vein', x: VX + VR, y: 560, side: 'R' }
      ];
      /* the tissue cell and the capillary named: points found on them */
      /* from the drawing's own numbers, not measured: a hidden drawing measures as nothing */
      var cc = CELLC[Math.round(CELLC.length * .78)]; if (cc) { items[2].x = cc[0]; items[2].y = cc[1]; }
      var cp = sampleCurve(BED[0].caps[0], 8), qc = cp[Math.round(cp.length * .7)]; items[3].x = qc[0]; items[3].y = qc[1];
      gLabs.innerHTML = L.labels({ items: items.filter(function (q) { return q.side === 'L'; }), left: -10, right: 430, font: f, width: fl.mL - 22, top: -20, bottom: 610, gap: 6 }) +
        L.labels({ items: items.filter(function (q) { return q.side === 'R'; }), left: -10, right: 430, font: f, width: fl.mR - 22, top: -20, bottom: 610, gap: 6 });
    }
    var lastLW = 0;
    var roL = global.ResizeObserver ? new ResizeObserver(function () {
      var w = svg.getBoundingClientRect().width; if (!w || Math.abs(w - lastLW) < 8) return;
      lastLW = w; global.requestAnimationFrame(labels);
    }) : null;
    if (roL) roL.observe(svg);

    /* ----- the clock: a gentle loop, paused off screen, still with reduced motion ----- */
    var reduced = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var T = 3, raf = 0, last = 0, paused = reduced, onScreen = false;
    function frame(now) {
      raf = 0;
      if (paused || !onScreen || document.hidden) return;
      var dt = last ? Math.min(.05, (now - last) / 1000) : 0; last = now;
      T += dt; render(T);
      raf = global.requestAnimationFrame(frame);
    }
    function go() { if (!raf && !paused && onScreen) { last = 0; raf = global.requestAnimationFrame(frame); } }
    pause.addEventListener('click', function () {
      paused = !paused;
      pause.innerHTML = paused ? '▶ Play' : '❚❚ Pause';
      pause.setAttribute('aria-pressed', paused ? 'true' : 'false');
      go();
    });
    if (reduced) { pause.hidden = true; }
    var io = global.IntersectionObserver ? new IntersectionObserver(function (en) { onScreen = en.some(function (e) { return e.isIntersecting; }); go(); }) : null;
    if (io) io.observe(svg); else onScreen = true;
    document.addEventListener('visibilitychange', go);

    /* ----- where the drawing stands: in the plate's column on a wide screen (the station's bench) ----- */
    var wideQ = global.matchMedia('(min-width: 1001px)');
    function mount() {
      var host = document.getElementById('benchHost'), sim = document.getElementById('simHost');
      var inSim = !!(sim && sim.contains(box));
      var wide = wideQ.matches && host && !inSim;       /* parked in the bench even while a staged widget covers it */
      var target = wide ? host : slot;
      if (stage.parentNode !== target) { if (wide) host.innerHTML = ''; target.appendChild(stage); }
      box.classList.toggle('cb--benched', !!wide);
      where.hidden = !wide;
      title.hidden = !wide;
    }
    box.__onMove = mount;
    var onWide = function () { if (box.isConnected) mount(); else wideQ.removeEventListener('change', onWide); };
    if (wideQ.addEventListener) wideQ.addEventListener('change', onWide);
    box.__onReset = function () { paused = true; if (io) io.disconnect(); if (roL) roL.disconnect(); };
    box.__seek = function (t) { T = t; render(T); return T; };
    render(T);
    /* the labels need the drawing laid out: after it is in the page */
    setTimeout(function () { mount(); labels(); render(T); go(); }, 0);
    return box;
  }

  L.add('capbed', capbed);
})(window);
