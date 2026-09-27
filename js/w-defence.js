/* ============================================================
   w-defence.js — two widgets about how blood defends the body (0610 9.4).

     phagocyte  "A phagocyte at work" (station `blood`). Seven steps, each held until "Next step":
                a bacterium releases chemicals and a phagocyte moves towards it; the cytoplasm
                flows round it; the bacterium is engulfed into a vacuole; small sacs release
                enzymes into the vacuole; the enzymes digest the bacterium; the small soluble
                products are absorbed into the cytoplasm or released from the cell; and, beyond
                0610 (IB C3.2), pieces of the bacterium's antigens are carried to the cell membrane
                and displayed on its outer surface (Daniel, 27 Sep: "show that the phagocyte or
                macrophage shows the antigens of the bacteria being engulfed on its membrane ...
                add it as what topic it belongs to").
                The cell is drawn as the outline of a smooth shape (a signed distance field traced
                with marching squares), so its membrane is always one closed line: the extensions
                grow round the bacterium, meet and join, and the vacuole is then a closed membrane
                of its own. The sacs join the vacuole the same way.
     clot       "A cut, step by step" (station `clotting`). A section through skin and a small
                blood vessel, cut across: the cut breaks the skin and the vessel wall and blood
                flows out; platelets stick at the wound and release chemicals; soluble
                fibrinogen is converted into insoluble fibrin threads; the mesh traps red blood
                cells and platelets, a clot; the clot dries into a scab; new skin grows under it
                and the scab falls off.
   Drive both with the lab's step player (js/w-common.js): Play, Next step, Play all; every
   frame is a pure function of the time t, and box.__seek(t) draws any moment.

   SOURCES (every number and claim)
   · Syllabus, Cambridge IGCSE Biology 0610, 2026–2028, 9.4 Core: "white blood cells in
     phagocytosis and antibody production"; "platelets in clotting (details are not required)";
     "State the roles of blood clotting as preventing blood loss and the entry of pathogens".
     Supplement: "phagocytes – engulfing pathogens by phagocytosis"; "Describe the process of
     clotting as the conversion of fibrinogen to fibrin to form a mesh". The wording of the steps
     is the stations' own (stations.master.js, blood and clotting).
   · Mark schemes: phagocytes engulf (ingest) pathogens into a vacuole and digest them with
     enzymes, never "eat" (MS 0610/32/M/J/14 Q4(d)(ii); MS 0610/31/O/N/12 Q2(e); MS 0610/31/O/N/10
     Q4(c)(iii)); clotting: platelets; fibrinogen converted to fibrin; soluble to insoluble; a mesh
     that traps blood cells; a scab; keeps pathogens out, not "germs" or "foreign bodies"
     (MS 0610/32/M/J/15 Q3(d)(ii); MS 0610/41/M/J/24 Q6(b); MS 0610/32/O/N/11 Q4(b)(ii)). These are
     the words in bold in the clot's steps: the points 0610 schemes on clotting credit again and
     again (s09/3, w11/32, s12/31, s13/32, s15/32, w16/42, w19/41, w19/43, m21/42, s24/41, w24/43;
     the scab is credited in most, but w16/42 ignored it).
     Beyond the syllabus but credited: "thrombin / enzyme" (s09/3, s12/31, s13/32, s15/32) and, for
     healing, "cells divide by mitosis ... grow epidermis / new skin" (0610/31/M/J/12 Q1(c)) and
     "wound healing / tissue repair" (0610/42/O/N/18 Q5(b)(ii)).
   · The phagocyte is drawn as a neutrophil, the commonest phagocyte in blood: 10–12 µm across,
     a nucleus of 2–5 lobes joined by thin strands, a cytoplasm full of small granules (Tortora GJ,
     Derrickson B, Principles of Anatomy and Physiology, 15th ed., 2017, ch. 19, table 19.3).
     Its granules are the sacs of digestive enzymes that empty into the vacuole (Borregaard N
     2010, Immunity 33: 657–670; Murphy K, Weaver C, Janeway's Immunobiology, 9th ed., 2016,
     ch. 3). The sacs are drawn larger than real ones so they can be seen.
   · A rod-shaped bacterium is about 2 µm long and 1 µm wide (Madigan MT et al., Brock Biology of
     Microorganisms, 15th ed., 2018, ch. 2), so a phagocyte is several times larger.
   · Step 7, antigen display. Not a statement of the 0610 syllabus (2023-25 or 2026-28), whose Topic 10.1
     (Supplement) has only "each pathogen has its own antigens, which have specific shapes"; but 0610 mark
     schemes have credited it: 0610/32/M/J/14 Q4(d)(ii) "Describe the role of phagocytes in defence against
     disease", point 6 "identify antigen / pathogens, for lymphocytes" (the examiner report calls it the
     point on "the ability of the phagocyte to present the antigen to the lymphocyte"), and 0610/42/M/J/17
     Q6(c)(ii), AVP "e.g. antigens presented on cell surface". No 0654, 0653, 5090, 5129 or Edexcel 4BI1
     scheme credits it (searched 27 Sep 2026). IB Biology guide 2025, C3.2.7 "Antigens as recognition
     molecules that trigger antibody production" (most antigens are proteins or glycoproteins on the outer
     surface of pathogens) and C3.2.8 "Activation of B-lymphocytes by helper T-lymphocytes" (the helper
     T-cell "has also become activated by the same type of antigen"). Phagocytes, above all macrophages,
     break the pathogen's proteins into short pieces in the vacuole, load them onto their own membrane
     proteins (MHC class II) and carry them to the cell surface in small vesicles; a helper T-cell whose
     receptor fits the piece binds to it (Murphy K, Weaver C, Janeway's Immunobiology, 9th ed., 2016, ch. 6).
     Macrophages and dendritic cells do this most; neutrophils, like the cell drawn, only in some conditions
     (Vono M et al. 2017, Blood 129: 1991–2001). The antigens are drawn as triangles, far larger than real.
   · Bacteria release small peptides that attract neutrophils (Schiffmann E, Corcoran BA,
     Wahl SM 1975, PNAS 72: 1059–1062); damaged tissue releases others. Extensions of the cell
     surround the particle and fuse, enclosing it in a vacuole; sacs fuse with the vacuole and
     their enzymes digest it; small products pass into the cytoplasm, and material that is not
     digested can be released from the cell (Alberts B et al., Molecular Biology of the Cell,
     6th ed., 2015, ch. 13).
   · Sizes in the clot: red blood cell about 7.5 µm across and 2 µm thick, a biconcave disc
     (Guyton JE, Hall JE, Textbook of Medical Physiology, 14th ed., 2021, ch. 33); platelet 1–4 µm,
     a fragment of a cell with no nucleus (Guyton & Hall, ch. 37); white blood cell 10–12 µm
     (Tortora, ch. 19). A fibrinogen molecule is about 0.045 µm long (Weisel JW 2005, Adv Protein
     Chem 70: 247–299), so it is drawn hundreds of times too large; fibrin threads are thicker.
     The epidermis of thin skin is about 0.05–0.1 mm thick (Young B et al., Wheater's Functional
     Histology, 6th ed., 2014, ch. 9). The drawing keeps the cells to one scale (about 2.4 units
     to the micrometre) and the skin close to it.
   · Order and times of clotting: platelets stick to the damaged wall and to each other and
     release chemicals; with a factor exposed by the damaged tissue (tissue factor), they start a
     chain of reactions that ends with the enzyme thrombin converting fibrinogen to fibrin; a small
     cut stops bleeding within a few minutes (Guyton & Hall, ch. 37). The scab dries over hours;
     skin cells near the wound divide by mitosis and new skin grows under the scab over days
     (Gurtner GC et al. 2008, Nature 453: 314–321).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L || !L.stepper || !L.labels) return;
  var h = L.h;
  var NS = 'http://www.w3.org/2000/svg';
  var UID = 0;

  /* ---------- small helpers ---------- */
  function n1(v) { return Math.round(v * 10) / 10; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function len(x, y) { return Math.sqrt(x * x + y * y); }
  function rng(seed) { var s = seed >>> 0; return function () { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; }; }
  /* smooth minimum and maximum of two distances (Quilez), so shapes join with a curve */
  function smin(a, b, k) { var q = Math.max(k - Math.abs(a - b), 0) / k; return Math.min(a, b) - q * q * k * .25; }
  function smax(a, b, k) { return -smin(-a, -b, k); }
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

  /* ---------- marching squares: the zero outline of a distance field ----------
     f(x, y) < 0 inside. Returns closed loops of points. Every crossing is shared by the two
     squares on either side of it, so every loop closes: an outline can never have a gap. */
  function contours(f, x0, y0, x1, y1, st) {
    var nx = Math.ceil((x1 - x0) / st), ny = Math.ceil((y1 - y0) / st), W = nx + 1, i, j;
    var v = new Array(W * (ny + 1));
    for (j = 0; j <= ny; j++) for (i = 0; i <= nx; i++) v[j * W + i] = f(x0 + i * st, y0 + j * st);
    var pts = {}, segs = [];
    function P(id) {
      if (pts[id]) return pts[id];
      var k = id >> 1, i2 = k % W, j2 = (k - i2) / W, a = v[k], b, u;
      if ((id & 1) === 0) { b = v[k + 1]; u = a / (a - b); pts[id] = [x0 + (i2 + u) * st, y0 + j2 * st]; }
      else { b = v[k + W]; u = a / (a - b); pts[id] = [x0 + i2 * st, y0 + (j2 + u) * st]; }
      return pts[id];
    }
    for (j = 0; j < ny; j++) for (i = 0; i < nx; i++) {
      var k0 = j * W + i, a = v[k0], b = v[k0 + 1], c = v[k0 + W + 1], d = v[k0 + W];
      var m = (a < 0 ? 8 : 0) | (b < 0 ? 4 : 0) | (c < 0 ? 2 : 0) | (d < 0 ? 1 : 0);
      if (m === 0 || m === 15) continue;
      var T = k0 * 2, R = (k0 + 1) * 2 + 1, Bo = (k0 + W) * 2, Le = k0 * 2 + 1, mid = (a + b + c + d) / 4;
      switch (m) {
        case 1: segs.push([Le, Bo]); break;
        case 2: segs.push([Bo, R]); break;
        case 3: segs.push([Le, R]); break;
        case 4: segs.push([T, R]); break;
        case 5: if (mid < 0) { segs.push([T, Le]); segs.push([Bo, R]); } else { segs.push([T, R]); segs.push([Le, Bo]); } break;
        case 6: segs.push([T, Bo]); break;
        case 7: segs.push([T, Le]); break;
        case 8: segs.push([T, Le]); break;
        case 9: segs.push([T, Bo]); break;
        case 10: if (mid < 0) { segs.push([T, R]); segs.push([Le, Bo]); } else { segs.push([T, Le]); segs.push([Bo, R]); } break;
        case 11: segs.push([T, R]); break;
        case 12: segs.push([Le, R]); break;
        case 13: segs.push([Bo, R]); break;
        case 14: segs.push([Le, Bo]); break;
      }
    }
    var ends = {};
    segs.forEach(function (s, n) { (ends[s[0]] = ends[s[0]] || []).push(n); (ends[s[1]] = ends[s[1]] || []).push(n); });
    var used = [], loops = [];
    for (var n = 0; n < segs.length; n++) {
      if (used[n]) continue;
      var loop = [], cur = n, from = segs[n][0], guard = 0;
      loop.push(P(from));
      while (guard++ < 200000) {
        used[cur] = true;
        var to = segs[cur][0] === from ? segs[cur][1] : segs[cur][0];
        loop.push(P(to));
        var nb = ends[to], nxt = -1;
        for (var q = 0; q < nb.length; q++) if (!used[nb[q]]) { nxt = nb[q]; break; }
        if (nxt < 0) break;
        from = to; cur = nxt;
      }
      loop.pop();
      if (loop.length > 3) loops.push(loop);
    }
    return loops;
  }
  function area(loop) { var s = 0; for (var i = 0, n = loop.length; i < n; i++) { var p = loop[i], q = loop[(i + 1) % n]; s += p[0] * q[1] - q[0] * p[1]; } return s / 2; }
  /* a closed loop as a smooth path: quadratic curves through the midpoints */
  function smoothD(loop) {
    var pts = [loop[0]];
    for (var i = 1; i < loop.length; i++) { var a = pts[pts.length - 1], b = loop[i]; if (len(b[0] - a[0], b[1] - a[1]) > 2.2) pts.push(b); }
    var n = pts.length; if (n < 3) return '';
    function mid(a, b) { return n1((a[0] + b[0]) / 2) + ' ' + n1((a[1] + b[1]) / 2); }
    var d = 'M' + mid(pts[0], pts[1]);
    for (i = 1; i <= n; i++) { var p = pts[i % n], q = pts[(i + 1) % n]; d += 'Q' + n1(p[0]) + ' ' + n1(p[1]) + ' ' + mid(p, q); }
    return d + 'Z';
  }
  /* where a loop crosses a line: axis 'y' = the horizontal line y = v; returns every x (or y) */
  function crossings(loop, axis, v) {
    var out = [], a = axis === 'y' ? 1 : 0, o = 1 - a;
    for (var i = 0, n = loop.length; i < n; i++) {
      var p = loop[i], q = loop[(i + 1) % n];
      if ((p[a] - v) * (q[a] - v) <= 0 && p[a] !== q[a]) out.push(p[o] + (q[o] - p[o]) * (v - p[a]) / (q[a] - p[a]));
    }
    return out;
  }

  /* the drawing's frame: the model is drawn inside a window of it; on a narrow screen it may be
     turned on its side (x and y swapped), so the labels have room either side */
  function frameOf(svg, bg, model, clipRect, win, tall, D, cL, cR, mL0, mR0) {
    var bw = tall ? win.y1 - win.y0 : win.x1 - win.x0, bh = tall ? win.x1 - win.x0 : win.y1 - win.y0;
    var ft = fitType(D, bw, cL, cR, mL0, mR0, 13), padT = 12, padB = 12;
    var vb = { x: -ft.mL, y: -padT, w: bw + ft.mL + ft.mR, h: bh + padT + padB, bw: bw, bh: bh };
    svg.setAttribute('viewBox', n1(vb.x) + ' ' + n1(vb.y) + ' ' + n1(vb.w) + ' ' + n1(vb.h));
    bg.setAttribute('x', n1(vb.x)); bg.setAttribute('y', n1(vb.y)); bg.setAttribute('width', n1(vb.w)); bg.setAttribute('height', n1(vb.h)); bg.setAttribute('rx', 18);
    clipRect.setAttribute('x', win.x0); clipRect.setAttribute('y', win.y0); clipRect.setAttribute('width', win.x1 - win.x0); clipRect.setAttribute('height', win.y1 - win.y0);
    model.setAttribute('transform', tall ? 'matrix(0 1 1 0 ' + (-win.y0) + ' ' + (-win.x0) + ')' : 'translate(' + (-win.x0) + ' ' + (-win.y0) + ')');
    return { tall: tall, win: win, f: ft.f, mL: ft.mL, mR: ft.mR, vb: vb,
             to: function (x, y) { return tall ? [y - win.y0, x - win.x0] : [x - win.x0, y - win.y0]; } };
  }
  function drawLabels(lay, items, tiny, gap) {
    var vb = lay.vb, o = { left: -8, right: vb.bw + 8, font: lay.f, top: vb.y + 6, bottom: vb.y + vb.h - 6, gap: gap == null ? 5 : gap };
    var out = L.labels(Object.assign({}, o, { items: items.filter(function (q) { return q.side === 'L'; }), width: lay.mL - 26 })) +
              L.labels(Object.assign({}, o, { items: items.filter(function (q) { return q.side === 'R'; }), width: lay.mR - 26 }));
    /* a part smaller than the usual dot (a platelet, a molecule) gets a smaller dot, so it still shows round it */
    if (tiny) out = out.split('<g class="lb').map(function (chunk) {
      var m = chunk.match(/data-lab="([^"]*)"/);
      return m && tiny[m[1]] ? chunk.replace(/(<circle class="lb__dot"[^>]*? r=")[\d.]+"/, '$1' + tiny[m[1]] + '"') : chunk;
    }).join('<g class="lb');
    return out;
  }
  /* the shared shell of a step widget: head, step bar, read-outs, the figure, the step list */
  function shell(spec, cls, title, aria, pills) {
    var box = h('div', 'widget ' + cls);
    box.appendChild(L.head(spec.title || title, spec.ask, 'Press play'));
    var read = h('div', cls + '__read', pills.map(function (p) { return '<span class="' + cls + '__pill" data-k="' + p[0] + '"><b>' + p[1] + '</b> <i></i></span>'; }).join(''));
    var fig = h('figure', cls + '__fig');
    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', cls + '__svg'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', aria);
    fig.appendChild(svg);
    return { box: box, read: read, fig: fig, svg: svg, spec: spec, title: spec.title || title,
             pill: function (k, text, tone) { var p = read.querySelector('[data-k="' + k + '"]'), i = p.querySelector('i'); if (i.textContent !== text) i.textContent = text; p.className = cls + '__pill is-' + tone; } };
  }
  function mount(S, sp, cls, notes, setLayout) {
    S.box.appendChild(sp.bar);
    var wrap = h('div', cls + '__wrap');
    /* on a wide screen the drawing stands in the plate's column; its read-outs and the steps stay here
       (Daniel, 26 Sep: "any animations move them to the left and then the text and the buttons on the right") */
    var pack = h('div', cls + '__pack');
    var packT = h('p', 'stg__title', L.esc(S.title)); packT.hidden = true;
    pack.appendChild(packT); pack.appendChild(S.fig);
    var left = h('div', cls + '__left'); left.appendChild(S.read); left.appendChild(pack);
    S.fig.appendChild(sp.now);
    wrap.appendChild(left); wrap.appendChild(sp.list);
    S.box.appendChild(wrap);
    notes.forEach(function (n) { S.box.appendChild(h('p', 'widget__note' + (n[1] ? ' ' + n[1] : ''), n[0])); });
    var lastD = 0, lastN = false;
    function fit() {
      var ww = wrap.getBoundingClientRect().width; if (!ww) return;
      wrap.classList.toggle(cls + '--side', ww >= 980);
      var D = S.fig.getBoundingClientRect().width, narrow = ww < 440;
      if (!D || (Math.abs(D - lastD) < 2 && narrow === lastN)) return;
      lastD = D; lastN = narrow; setLayout(D, narrow); sp.paint(sp.time());
    }
    setLayout(700, false);
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (!S.box.isConnected) { ro.disconnect(); return; } fit(); }) : null;
    if (ro) { ro.observe(wrap); ro.observe(S.fig); }
    var stg = L.stage ? L.stage({ box: S.box, spec: S.spec, pack: pack, home: left, watch: function () { return S.box; },
      onPlace: function (inColumn) { packT.hidden = !inColumn; S.box.classList.toggle(cls + '--staged', inColumn); sp.compact(inColumn); lastD = 0; fit(); } }) : null;
    S.box.__onMove = function () { if (stg) stg.mount(); };
    S.box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); if (stg) stg.detach(); };
    S.box.__seek = function (t) { fit(); return sp.seek(t); };
    sp.paint(0);
    return S.box;
  }

  /* ================================================================
     phagocyte — a phagocyte at work
     ================================================================ */
  /* Model units: about 21 to the micrometre. The cell is 232 units across (11 µm); the
     bacterium is a rod 46 × 20 units (2.2 × 1 µm). */
  var PH = { R: 116, rv0: 30, B0: [492, 150], al0: 24 };
  var PH_STEPS = [
    { t: 0,  h: 'A phagocyte moves towards a bacterium', p: 'A bacterium, a pathogen, is in the tissue. It releases chemicals, which diffuse away from it. A phagocyte is attracted by the chemicals and moves towards the bacterium. The phagocyte is several times larger than the bacterium.' },
    { t: 11, h: 'The phagocyte surrounds the bacterium', p: 'The cytoplasm of the phagocyte flows round the bacterium. Extensions of the cell spread round it on both sides. The cell membrane stays whole all the time.' },
    { t: 20, h: 'The bacterium is engulfed', p: 'The ends of the extensions meet and join. The bacterium is now inside the phagocyte, enclosed in a vacuole. This is phagocytosis: the phagocyte engulfs the pathogen.' },
    { t: 29, h: 'Enzymes are released into the vacuole', p: 'Small sacs in the cytoplasm contain digestive enzymes. The sacs join with the vacuole and release their enzymes into it.' },
    { t: 37, h: 'The enzymes digest the bacterium', p: 'The enzymes digest the bacterium. They break down its large molecules into small, soluble molecules. The pathogen is destroyed.' },
    { t: 45, h: 'The products are absorbed', tag: 'Not asked in 0610', p: 'The small, soluble products are harmless. They are absorbed into the cytoplasm, or released from the cell. The vacuole becomes smaller, and the phagocyte can engulf another pathogen.' },
    { t: 54, h: 'The phagocyte displays the antigens', tag: 'IB C3.2 Defence against disease · beyond the 0610 syllabus', p: 'Pieces of the bacterium\'s antigens are kept. Small sacs carry them to the cell membrane, and proteins in the membrane hold them on its outer surface. The phagocyte now displays the antigens (antigen presentation). A helper T-cell, a lymphocyte whose receptor fits these antigens, can bind to them. This helps to start antibody production against this pathogen.' }
  ];
  var PH_END = 64;
  /* The antigens: on the bacterium, triangles on its surface, in its own frame (x, y, the angle they point);
     in step 7, pieces carried from the vacuole to the membrane, each held by a protein of the cell there,
     at an angle round the cell: on the side away from the nucleus, and clear of every label's dot and
     leader in both layouts (wide: the vacuole's leader crosses the membrane at about -7 degrees; on a
     phone, turned on its side, the cell membrane's dot is at about -95, the vacuole's and cytoplasm's
     leaders at about 58 and 70) */
  var AG_ON = [[-9, -10, -90], [3, -10, -90], [14, -9, -80], [-3, 10, 90], [9, 10, 90], [-23, 0, 180]];
  var AG_OUT = (function () {
    var r = rng(41), out = [], ang = [-78, -48, -22, 8, 34, 86];
    ang.forEach(function (a, i) { out.push({ th: a * Math.PI / 180, va: r() * 6.283, vr: .2 + .5 * r(), t0: 55.2 + .55 * i }); });
    return out;
  })();
  var AG_BAC = 'M4.6 0L0 -3L0 3Z', AG_SHOWN = 'M12 0L0 -5.6L0 5.6Z', AG_HOLD = 'M3.8 -7.6L-3 -7.6L-3 7.6L3.8 7.6';

  /* the nucleus: four lobes joined by thin strands, in the cell's own frame */
  var LOBES = [[-44, -56, 25, 19, 32], [-74, -4, 24, 20, 84], [-50, 50, 25, 19, -32], [-6, 73, 22, 17, -8]];
  function nucSdf(x, y) {
    var d = 1e9, i;
    for (i = 0; i < LOBES.length; i++) {
      var l = LOBES[i], a = l[4] * Math.PI / 180, dx = x - l[0], dy = y - l[1];
      var u = dx * Math.cos(a) + dy * Math.sin(a), v = -dx * Math.sin(a) + dy * Math.cos(a);
      d = smin(d, (len(u / l[2], v / l[3]) - 1) * Math.min(l[2], l[3]), 5);
    }
    for (i = 0; i + 1 < LOBES.length; i++) {       /* the strands between the lobes */
      var p = LOBES[i], q = LOBES[i + 1], ex = q[0] - p[0], ey = q[1] - p[1], k = clamp01(((x - p[0]) * ex + (y - p[1]) * ey) / (ex * ex + ey * ey));
      d = smin(d, len(x - p[0] - ex * k, y - p[1] - ey * k) - 4, 3);
    }
    return d;
  }
  /* the sacs of enzymes, in the cell's own frame; the first five join the vacuole in step 4 */
  var SACS = [[22, -62], [28, 50], [2, -14], [74, 54], [78, -62], [10, 22], [40, -92]];
  var ENZ = (function () { var r = rng(9), out = []; SACS.forEach(function (s, i) { for (var k = 0; k < 4; k++) { var a = k * 1.57 + r(); out.push({ sac: i, ox: Math.cos(a) * 2.8, oy: Math.sin(a) * 2.8, va: r() * 6.283, vr: .25 + .6 * r(), ph: r() * 6.283 }); } }); return out; })();
  var GRAN = (function () {
    var r = rng(3), out = [];
    while (out.length < 110) {
      var a = r() * 6.283, rr = Math.sqrt(r()) * (PH.R - 13), x = Math.cos(a) * rr, y = Math.sin(a) * rr;
      if (nucSdf(x, y) < 4) continue;
      if (len(x + 20, y - 92) < 9 || len(x + 40, y + 92) < 9 || len(x - 40, y - 90) < 9) continue;   /* keep the label spots clear */
      var near = SACS.some(function (s) { return len(x - s[0], y - s[1]) < 11; }); if (near) continue;
      out.push({ x: x, y: y, r: 1.6 + r() * 1.1 });
    }
    return out;
  })();
  var CHEM = (function () { var r = rng(17), out = []; for (var i = 0; i < 46; i++) out.push({ a: r() * 6.283, t0: i * .31 - 14, v: 16 + 8 * r() }); return out; })();
  var PROD = (function () {
    var r = rng(29), out = [];
    for (var i = 0; i < 16; i++) {
      var out2 = i >= 11, a = out2 ? -.9 + 1.8 * r() : Math.PI * (.35 + 1.3 * r()) + (i % 2 ? 0 : Math.PI);
      out.push({ u: -.8 + 1.6 * r(), w: -.6 + 1.2 * r(), a: a, d: out2 ? 110 + 30 * r() : 42 + 30 * r(), t0: 45.6 + r() * 2.4, out: out2 });
    }
    out[0] = { u: .1, w: .3, a: 1.95, d: 58, t0: 45.7, out: false };   /* the labelled one: it ends well inside the cytoplasm */
    return out;
  })();

  function phState(t) {
    var T = [0, 11, 20, 29, 37, 45];
    var mv = ease(seg(t, .6, 10.2)), press = ease(seg(t, 11.2, 14));
    var cx = 150 + 194 * mv + 12 * press, cy = 150;
    var moving = seg(t, .3, 1.5) * (1 - seg(t, 8.8, 10.4));
    var phi = t < T[1] + .4 ? 0 : t < T[2] ? .35 + (Math.PI - .45 - .35) * ease(seg(t, 11.4, 19.4)) : Math.PI - .45 + .45 * ease(seg(t, 20.1, 21.8));
    var inw = ease(seg(t, 22, 27.5));
    var bx = lerp(PH.B0[0], cx + 60, inw), by = lerp(PH.B0[1], cy - 6, inw), al = lerp(PH.al0, 8, inw);
    var rv = PH.rv0 - 13 * ease(seg(t, 47, 52.5));
    var dig = ease(seg(t, 37.8, 43.6));
    return { t: t, cx: cx, cy: cy, moving: moving, phi: phi, rb: 11 - 5 * inw, inw: inw, bx: bx, by: by, al: al, rv: rv, dig: dig, hole: t > 10.5 };
  }
  /* where each sac is at time t, and how big (it shrinks to nothing as it joins the vacuole) */
  function sacAt(i, S) {
    var s = SACS[i], x = S.cx + s[0], y = S.cy + s[1], r = 7;
    if (i < 5) {
      var m0 = 29.4 + .55 * i, k = ease(seg(S.t, m0, m0 + 2.2)), dx = x - S.bx, dy = y - S.by, dd = len(dx, dy) || 1;
      var tx = S.bx + dx / dd * (S.rv + r - 2.5), ty = S.by + dy / dd * (S.rv + r - 2.5);
      x = lerp(x, tx, k); y = lerp(y, ty, k);
      var f = ease(seg(S.t, m0 + 2.2, m0 + 3.4));
      r = 7 * (1 - f);
      x = lerp(x, S.bx + dx / dd * S.rv, f); y = lerp(y, S.by + dy / dd * S.rv, f);
      return { x: x, y: y, r: r, fused: f, arrive: m0 + 2.2 };
    }
    return { x: x, y: y, r: r, fused: 0, arrive: 1e9 };
  }
  function wob(th, t) { return 3.6 * Math.sin(3 * th + .8 * t) + 2.4 * Math.sin(5 * th - .6 * t + 1) + 1.5 * Math.sin(7 * th + 1.1 * t + 2); }
  function cellSdf(x, y, S, sacs) {
    var dx = x - S.cx, dy = y - S.cy, th = Math.atan2(dy, dx), st = 1 + .1 * S.moving;
    var front = S.moving * 7 * Math.pow(Math.max(0, Math.cos(th)), 3);
    var d = len(dx / st, dy) - (PH.R + wob(th, S.t) + front);
    if (S.phi > .01) {
      var ax = S.cx - S.bx, ay = S.cy - S.by, al = len(ax, ay) || 1; ax /= al; ay /= al;
      var qx = x - S.bx, qy = y - S.by, py = qx * ax + qy * ay, px = Math.abs(qx * -ay + qy * ax);
      var ra = S.rv + S.rb, da;
      if (S.phi >= Math.PI - 1e-3) da = Math.abs(len(px, py) - ra) - S.rb;
      else { var sn = Math.sin(S.phi), cs = Math.cos(S.phi); da = (cs * px > sn * py ? len(px - sn * ra, py - cs * ra) : Math.abs(len(px, py) - ra)) - S.rb; }
      d = smin(d, da, 14);
    }
    var hole = S.hole ? len(x - S.bx, y - S.by) - S.rv : 1e9;
    for (var i = 0; i < sacs.length; i++) if (sacs[i].r > .3) hole = smin(hole, len(x - sacs[i].x, y - sacs[i].y) - sacs[i].r, 5);
    return smax(d, -hole, 2.5);
  }
  function holeSdf(x, y, S, sacs) {
    var hole = S.hole ? len(x - S.bx, y - S.by) - S.rv : 1e9;
    for (var i = 0; i < sacs.length; i++) if (sacs[i].r > .3) hole = smin(hole, len(x - sacs[i].x, y - sacs[i].y) - sacs[i].r, 5);
    return hole;
  }

  function phStatic(u) {
    var s = '<defs>' +
      '<radialGradient id="' + u + 'cy" cx=".42" cy=".4" r=".75"><stop offset="0" stop-color="#F3E1EA"/><stop offset=".7" stop-color="#E6C9D8"/><stop offset="1" stop-color="#D8B3C8"/></radialGradient>' +
      '<radialGradient id="' + u + 'nu" cx=".4" cy=".35" r=".8"><stop offset="0" stop-color="#7E5BC2"/><stop offset="1" stop-color="#4A2C86"/></radialGradient>' +
      '<radialGradient id="' + u + 'ch"><stop offset="0" stop-color="#D8F08F" stop-opacity=".42"/><stop offset=".55" stop-color="#C8E57A" stop-opacity=".14"/><stop offset="1" stop-color="#C8E57A" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="' + u + 'ba" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#A6D264"/><stop offset="1" stop-color="#5F9A33"/></linearGradient>' +
      '<clipPath id="' + u + 'cp"><rect class="ph__cr"/></clipPath></defs>';
    var r = rng(12), fib = '';
    for (var i = 0; i < 7; i++) {
      var y0 = 20 + i * 44 + 14 * r(), d = 'M-20 ' + n1(y0);
      for (var x = 0; x <= 660; x += 40) d += ' L' + x + ' ' + n1(y0 + 7 * Math.sin(x / 70 + i * 1.7) + 4 * Math.sin(x / 23 + i));
      fib += '<path d="' + d + '"/>';
    }
    s += '<g class="ph__fib">' + fib + '</g>';
    s += '<circle class="ph__glow" r="126" fill="url(#' + u + 'ch)"/><g class="ph__chem"></g>';
    s += '<path class="ph__cyto" fill="url(#' + u + 'cy)" fill-rule="evenodd"/><path class="ph__vac"/><path class="ph__vac ph__vac1"/>';
    s += '<g class="ph__gran"></g>';
    var nl = contours(nucSdf, -110, -90, 30, 105, 2);
    s += '<g class="ph__nucg"><path class="ph__nuc" fill="url(#' + u + 'nu)" d="' + nl.map(smoothD).join('') + '"/>';
    var chr = '';
    LOBES.forEach(function (l, k) { for (var j = 0; j < 4; j++) { var a = r() * 6.283, rr = r() * .55; chr += '<ellipse cx="' + n1(l[0] + Math.cos(a) * l[2] * rr) + '" cy="' + n1(l[1] + Math.sin(a) * l[3] * rr) + '" rx="' + n1(3 + 3 * r()) + '" ry="' + n1(2 + 2 * r()) + '"/>'; } });
    s += '<g class="ph__chr">' + chr + '</g></g>';
    s += '<g class="ph__enz"></g><g class="ph__bac"></g><g class="ph__prod"></g><path class="ph__memo"/><path class="ph__memi"/><g class="ph__ag"></g>';
    return s;
  }

  function phagocyte(spec) {
    var u = 'ph' + (++UID) + '-', cx0 = 0;
    var S = shell(spec, 'ph', 'A phagocyte at work', 'A phagocyte, a white blood cell with a lobed nucleus, moves towards a bacterium, surrounds it, and encloses it in a vacuole. Enzymes are released into the vacuole and digest the bacterium, and the small soluble products are absorbed. Beyond the syllabus, pieces of the bacterium\'s antigens are then displayed on the cell membrane.', [['bac', 'The bacterium']]);
    var svg = S.svg;
    svg.innerHTML = '<rect class="ph__bg"/><g class="ph__model" clip-path="url(#' + u + 'cp)">' + phStatic(u) + '</g><g class="ph__labs"></g>';
    var q = function (c) { return svg.querySelector(c); };
    var bg = q('.ph__bg'), model = q('.ph__model'), cr = q('.ph__cr'), gLab = q('.ph__labs');
    var glow = q('.ph__glow'), gChem = q('.ph__chem'), cyto = q('.ph__cyto'), vac = q('.ph__vac'), vac1 = q('.ph__vac1'), gGran = q('.ph__gran'), nucg = q('.ph__nucg');
    var gEnz = q('.ph__enz'), gBac = q('.ph__bac'), gProd = q('.ph__prod'), memo = q('.ph__memo'), memi = q('.ph__memi'), gAg = q('.ph__ag');
    var lay = null;

    function render(t) {
      var St = phState(t), i;
      cx0 = St.cx;
      var sacs = SACS.map(function (s, k) { return sacAt(k, St); });
      var f = function (x, y) { return cellSdf(x, y, St, sacs); };
      /* the outline: every closed loop of the field; the largest is the cell, the others are holes */
      var x0 = Math.min(St.cx - PH.R * 1.2 - 12, St.bx - 64), x1 = Math.max(St.cx + PH.R * 1.2 + 12, St.bx + 64);
      var y0 = St.cy - PH.R - 22, y1 = St.cy + PH.R + 22;
      x0 = Math.floor(x0 / 3) * 3; y0 = Math.floor(y0 / 3) * 3;
      var loops = contours(f, x0, y0, x1, y1, 3), big = 0, bi = 0;
      loops.forEach(function (lp, k) { var a = Math.abs(area(lp)); if (a > big) { big = a; bi = k; } });
      var outer = loops[bi], holes = loops.filter(function (lp, k) { return k !== bi; });
      /* the largest hole is the vacuole: its fluid fades in as it closes; the others are the sacs */
      var vb2 = -1, va = 0; holes.forEach(function (lp, k) { var a = Math.abs(area(lp)); if (a > va) { va = a; vb2 = k; } });
      var vacD = va > 600 ? smoothD(holes[vb2]) : '', sacD = holes.filter(function (lp, k) { return !(va > 600 && k === vb2); }).map(smoothD).join('');
      var dAll = loops.map(smoothD).join('');
      cyto.setAttribute('d', dAll); vac.setAttribute('d', sacD); vac1.setAttribute('d', vacD); vac1.setAttribute('opacity', n1(ease(seg(t, 20.5, 21.5))));
      memo.setAttribute('d', dAll); memi.setAttribute('d', dAll);
      nucg.setAttribute('transform', 'translate(' + n1(St.cx - 4 * St.inw) + ' ' + n1(St.cy) + ')');

      /* the chemicals from the bacterium, and their gradient, until it is engulfed */
      var cg = 1 - seg(t, 20.2, 22.6);
      glow.setAttribute('cx', n1(St.bx)); glow.setAttribute('cy', n1(St.by)); glow.setAttribute('opacity', n1(cg));
      var ch = '';
      if (cg > .01) CHEM.forEach(function (c) {
        var age = ((t - c.t0) % 8 + 8) % 8, rr = 12 + age * c.v, op = cg * clamp01(age / .4) * (1 - age / 8);
        if (op < .03) return;
        ch += '<circle cx="' + n1(St.bx + Math.cos(c.a) * rr) + '" cy="' + n1(St.by + Math.sin(c.a) * rr) + '" r="2.1" opacity="' + n1(op) + '"/>';
      });
      gChem.innerHTML = ch;

      /* the granules of the cytoplasm: pushed aside by the vacuole, hidden outside the cell */
      var gr = '';
      GRAN.forEach(function (g) {
        var x = St.cx + g.x * (1 + .1 * St.moving), y = St.cy + g.y, dx = x - St.bx, dy = y - St.by, dd = len(dx, dy);
        if (St.hole && dd < St.rv + 7) { var k = (St.rv + 7) / (dd || 1); x = St.bx + dx * k; y = St.by + dy * k; }
        var d = f(x, y), hs = holeSdf(x, y, St, sacs), op = clamp01((-d - 2.5) / 4) * clamp01((hs - 2) / 3);
        if (op < .05) return;
        gr += '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(g.r) + '" opacity="' + n1(op) + '"/>';
      });
      gGran.innerHTML = gr;

      /* enzymes: in their sacs, then in the vacuole, then round the bacterium */
      var en = '', rs = St.rv / PH.rv0, enzPos = [];
      ENZ.forEach(function (e, k) {
        var sc = sacs[e.sac], x = sc.x + e.ox * Math.max(.3, sc.r / 7), y = sc.y + e.oy * Math.max(.3, sc.r / 7);
        if (e.sac < 5) {
          var m = ease(seg(t, sc.arrive + .2, sc.arrive + 1.8));
          var vx = St.bx + Math.cos(e.va) * e.vr * (St.rv - 6) * rs, vy = St.by + Math.sin(e.va) * e.vr * (St.rv - 6) * rs;
          var g2 = ease(seg(t, 37.4, 40.5)) * (1 - seg(t, 44, 46));
          vx = lerp(vx, St.bx + Math.cos(e.va) * (14 + 3 * Math.sin(e.ph)), g2 * .7); vy = lerp(vy, St.by + Math.sin(e.va) * (10 + 3 * Math.sin(e.ph)), g2 * .7);
          if (m > 0) { vx += 1.2 * Math.sin(t * 1.3 + e.ph); vy += 1.2 * Math.cos(t * 1.1 + e.ph); }
          x = lerp(x, vx, m); y = lerp(y, vy, m);
        }
        enzPos.push([x, y]);
        en += '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="2.2"/>';
      });
      gEnz.innerHTML = en;

      /* the bacterium, broken down in step 5 */
      var dig = St.dig, sc2 = 1 - .45 * dig, bop = 1 - .92 * dig;
      var bac = '';
      if (bop > .02) {
        var gap = dig > .02 ? ' stroke-dasharray="' + n1(9 * (1 - dig) + .8) + ' ' + n1(5 * dig) + '"' : '';
        bac = '<g transform="translate(' + n1(St.bx) + ' ' + n1(St.by) + ') rotate(' + n1(St.al) + ') scale(' + n1(sc2) + ')" opacity="' + n1(bop) + '">' +
          '<rect class="ph__rod" x="-23" y="-10" width="46" height="20" rx="10" fill="url(#' + u + 'ba)"' + gap + '/>' +
          '<path class="ph__dna" d="M-13 1 C-9 -5 -5 5 -1 -1 S7 -5 11 1"/>' +
          AG_ON.map(function (a) { return '<path class="ph__agn" transform="translate(' + a[0] + ' ' + a[1] + ') rotate(' + a[2] + ')" d="' + AG_BAC + '"/>'; }).join('') + '</g>';
      }
      gBac.innerHTML = bac;
      /* the small, soluble products of digestion */
      var pr = '', prodPos = [];
      if (dig > .02) PROD.forEach(function (p, k) {
        var ca = Math.cos(St.al * Math.PI / 180), sa = Math.sin(St.al * Math.PI / 180);
        var x = St.bx + (p.u * 23 * ca - p.w * 10 * sa) * sc2, y = St.by + (p.u * 23 * sa + p.w * 10 * ca) * sc2;
        var m = ease(seg(t, p.t0, p.t0 + 4.2)), op = dig;
        if (m > 0) {
          x = lerp(x, St.bx + Math.cos(p.a) * p.d, m); y = lerp(y, St.by + Math.sin(p.a) * p.d, m);
          if (p.out) op *= 1 - seg(m, .55, 1);
        }
        prodPos.push([x, y, op]);
        if (op > .03) pr += '<circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="1.9" opacity="' + n1(op) + '"/>';
      });
      gProd.innerHTML = pr;

      /* step 7: pieces of the bacterium's antigens, carried in small sacs from the vacuole to the membrane and
         held on its outer surface by a protein of the cell */
      var ag = '', agShown = null;
      if (t > 54.2) AG_OUT.forEach(function (a, k) {
        var fin = ease(seg(t, 54.3, 55.1)), mv = ease(seg(t, a.t0, a.t0 + 3)), land = ease(seg(t, a.t0 + 2.6, a.t0 + 3.4));
        var rm = PH.R + wob(a.th, t), nx = Math.cos(a.th), ny = Math.sin(a.th);
        /* a piece starts in the vacuole, small; a sac buds off round it and carries it out to the membrane */
        var sx = St.bx + Math.cos(a.va) * a.vr * (St.rv - 7), sy = St.by + Math.sin(a.va) * a.vr * (St.rv - 7);
        var ex = cx0 + nx * (rm + 1.2), ey = St.cy + ny * (rm + 1.2);
        var x = lerp(sx, ex, mv), y = lerp(sy, ey, mv), rot = Math.atan2(ey - sy, ex - sx) * (1 - land) + a.th * land;
        var sc = n1(.45 + .55 * mv);
        if (mv > 0 && land < 1) ag += '<circle class="ph__agv" cx="' + n1(x) + '" cy="' + n1(y) + '" r="' + n1(11.5 * (1 - land)) + '"/>';
        if (land > 0) ag += '<path class="ph__agc" transform="translate(' + n1(cx0 + nx * rm) + ' ' + n1(St.cy + ny * rm) + ') rotate(' + n1(a.th * 180 / Math.PI) + ') scale(' + n1(land) + ')" d="' + AG_HOLD + '"/>';
        ag += '<path class="ph__agn" transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(rot * 180 / Math.PI) + ') scale(' + sc + ')" opacity="' + n1(fin) + '" d="' + AG_SHOWN + '"/>';
        if (k === 3) agShown = [ex + nx * 8, ey + ny * 8, land];
      });
      gAg.innerHTML = ag;

      /* labels */
      var items = [], T = lay.tall, cx = St.cx, cy = St.cy;
      function add(id, text, x, y, side, op) { var p = lay.to(x, y); items.push({ id: id, text: text, x: p[0], y: p[1], side: side, op: op == null ? 1 : op }); }
      if (!T) {
        add('pha', 'phagocyte', cx - 40, cy - 92, 'L');
        add('nuc', 'lobed nucleus', cx - 74 - 4 * St.inw, cy - 4, 'L');
        var xs = outer ? crossings(outer, 'y', cy + 62).filter(function (v) { return v < cx; }) : [];
        if (xs.length) add('mem', 'cell membrane', Math.min.apply(null, xs), cy + 62, 'L');
        add('cyt', 'cytoplasm', cx - 20, cy + 92, 'L');
        if (cg > .05) add('chem', 'chemicals', St.bx - 6, St.by - 56, 'R', clamp01(cg * 1.5));
        if (bop > .25) add('bac', 'bacterium', St.bx, St.by, 'R', clamp01((bop - .25) * 3));
        if (t > 21.8) add('vac', 'vacuole', St.bx + Math.sin(St.al * Math.PI / 180) * (St.rv - 7) * .9, St.by - Math.cos(St.al * Math.PI / 180) * (St.rv - 7) * .9, 'R', clamp01((t - 21.8) / .8));
        if (t > 31.8 && t < 55) add('enz', 'enzymes', enzPos[0][0], enzPos[0][1], 'R', clamp01((t - 31.8) / .8) * clamp01((55 - t) / .8));
        if (t > 42.6 && t < 55 && prodPos[0]) add('pro', 'soluble products', prodPos[0][0], prodPos[0][1], 'R', clamp01((t - 42.6) / .8) * clamp01((55 - t) / .8));
        if (agShown && agShown[2] > 0) add('ag', 'antigen from the bacterium', agShown[0], agShown[1], 'R', agShown[2]);
      } else {
        add('pha', 'phagocyte', cx - 92, cy - 40, 'L');
        add('nuc', 'lobed nucleus', cx - 44 - 4 * St.inw, cy - 56, 'L');
        var ys = outer ? crossings(outer, 'x', cx - 10).filter(function (v) { return v < cy; }) : [];
        if (ys.length) add('mem', 'cell membrane', cx - 10, Math.min.apply(null, ys), 'L');
        add('cyt', 'cytoplasm', cx + 40, cy + 90, 'R');
        if (cg > .05) add('chem', 'chemicals', St.bx - 56, St.by + 26, 'R', clamp01(cg * 1.5));
        if (bop > .25) add('bac', 'bacterium', St.bx, St.by, 'R', clamp01((bop - .25) * 3));
        if (t > 21.8) add('vac', 'vacuole', St.bx - Math.sin(St.al * Math.PI / 180) * (St.rv - 7) * .9, St.by + Math.cos(St.al * Math.PI / 180) * (St.rv - 7) * .9, 'R', clamp01((t - 21.8) / .8));
        if (t > 31.8 && t < 55) add('enz', 'enzymes', enzPos[1][0], enzPos[1][1], 'R', clamp01((t - 31.8) / .8) * clamp01((55 - t) / .8));
        if (t > 42.6 && t < 55 && prodPos[0]) add('pro', 'soluble products', prodPos[0][0], prodPos[0][1], 'R', clamp01((t - 42.6) / .8) * clamp01((55 - t) / .8));
        if (agShown && agShown[2] > 0) add('ag', 'antigen from the bacterium', agShown[0], agShown[1], 'R', agShown[2]);
      }
      gLab.innerHTML = drawLabels(lay, items, { enz: 1.5, pro: 1.3, chem: 1.5, ag: 1.5 });
      var state = t < 11 ? ['free in the tissue', 'warn'] : t < 21.6 ? ['being surrounded', 'warn'] : t < 37.6 ? ['in a vacuole', 'ok'] : t < 44.5 ? ['being digested', 'ok'] : t < 54.5 ? ['digested', 'ok'] : ['digested; its antigens displayed', 'ok'];
      S.pill('bac', state[0], state[1]);
    }

    var R = [0, 13.5, 23.5, 33.5, 42, 50, 60, 78], M = [0, 11, 20, 29, 37, 45, 54, PH_END], clock = readerClock(R, M);
    var sp = L.stepper({ steps: readerSteps(PH_STEPS, R), end: R[R.length - 1], render: function (t) { render(clock(t)); } });
    return mount(S, sp, 'ph', [
      ['The phagocyte drawn is a neutrophil, the commonest phagocyte in blood: its nucleus has several lobes, and its cytoplasm is full of small granules. A real one is about 11 µm across, and the bacterium about 2 µm long. The sacs of enzymes are drawn larger than real, and the chemicals, enzymes, products and antigens far larger than real molecules. You see a thin slice, so the extensions look like two arms: in the whole cell they are a cup.'],
      ['<b>Not asked in 0610.</b> Moving towards the chemicals is called chemotaxis. The sacs of enzymes are called lysosomes. Step 6, what happens to the products, goes beyond the syllabus.', 'ph__fence'],
      ['<b>Step 7 is IB Biology C3.2, Defence against disease.</b> The 0610 syllabus does not list it, but two 0610 mark schemes gave a mark for it in questions on phagocytes (Paper 32, June 2014, Q4(d)(ii); Paper 42, June 2017, Q6(c)(ii)). Antigens are presented mostly by macrophages, larger phagocytes in the tissues, and by dendritic cells; a neutrophil, the cell drawn, does it only in some conditions (Vono et al. 2017).', 'ph__fence']
    ], function (D, narrow) {
      var tall = !!narrow;
      lay = frameOf(svg, bg, model, cr, tall ? { x0: 22, x1: 584, y0: 16, y1: 284 } : { x0: 0, x1: 620, y0: 8, y1: 292 }, tall, D, 9, 9, 118, 118);
      S.box.classList.toggle('ph--tall', tall);
    });
  }

  /* ================================================================
     clot — a cut, step by step
     ================================================================ */
  /* Model units: 2.4 to the micrometre, the same for every cell. The skin surface is at y = 70;
     the vessel, cut across, is centred at (310, 400), 98 units outside radius (about 80 µm). */
  var CL = { W: 620, H: 520, ys: 70, vx: 310, vy: 400, vo: 98, vw: 11 };
  CL.vi = CL.vo - CL.vw;
  var CL_STEPS = [
    { t: 0,  h: 'A cut breaks the skin and a blood vessel', p: 'A cut breaks the skin and the wall of a small blood vessel. Blood is lost through the wound.' },
    { t: 8,  h: 'Platelets stick at the wound', p: '**Platelets** are fragments of cells, much smaller than red blood cells. At the wound they stick to the damaged tissue and to each other, and collect at the break in the vessel. Chemicals from the platelets and the damaged tissue start a chain of reactions.' },
    { t: 18, h: 'Fibrinogen is converted into fibrin', tag: 'Supplement', p: 'Plasma carries a **soluble** protein, **fibrinogen**. The chain of reactions makes an enzyme, thrombin. Thrombin **converts** fibrinogen into **fibrin**, which is **insoluble**. Fibrin threads grow from the platelets and the damaged tissue across the wound.' },
    { t: 27, h: 'A mesh traps the cells: a clot', tag: 'Supplement', p: 'The fibrin threads form a **mesh** across the wound. The mesh **traps red blood cells** and platelets, forming a clot. The clot **prevents blood loss**.' },
    { t: 36, h: 'The clot becomes a scab', p: 'The clot dries and hardens into a **scab**. The scab **prevents the entry of pathogens** into the body.' },
    { t: 44, h: 'New skin grows under the scab', tag: 'Beyond the 0610 syllabus', p: 'Under the scab, skin cells near the wound divide by mitosis, and the new cells grow across the wound. Below, the clot is broken down and replaced by new tissue, and the wall of the blood vessel is repaired. Then the scab separates from the new skin.' }
  ];
  var CL_END = 55;
  /* the two sides of the cut, surface to vessel, when it is fully open */
  var CUT_L = [[272, 62], [279, 100], [285, 150], [291, 200], [295, 250], [298, 300], [300, 312]];
  var CUT_R = [[350, 62], [343, 102], [337, 152], [331, 202], [327, 252], [323, 300], [321, 312]];
  function yBas(x) { return 192 + 9 * Math.sin(x / 31) + 4 * Math.sin(x / 11); }
  function openAt(t) { return ease(seg(t, .4, 1.3)); }
  function cutPts(o, side) { return (side ? CUT_R : CUT_L).map(function (p) { return [CL.vx + (p[0] - CL.vx) * o, p[1]]; }); }
  function edgeX(o, side, y) {
    var P = cutPts(o, side);
    for (var i = 1; i < P.length; i++) if (y <= P[i][1]) { var k = (y - P[i - 1][1]) / (P[i][1] - P[i - 1][1]); return P[i - 1][0] + (P[i][0] - P[i - 1][0]) * clamp01(k); }
    return P[P.length - 1][0];
  }
  function fillAt(t) { return lerp(CL.vy - CL.vi, CL.ys - 8, ease(seg(t, 1.1, 3.4))); }       /* the level the blood has risen to */
  function dropAt(t) { return 26 * ease(seg(t, 3.1, 6.2)) * (1 - .3 * ease(seg(t, 36.6, 41))); } /* the drop above the cut */
  function flowAt(t) { return t < 1.1 ? 0 : t < 8 ? 1 : t < 18 ? lerp(1, .5, ease(seg(t, 8.5, 17))) : t < 27 ? lerp(.5, .18, ease(seg(t, 18.5, 26))) : .18 * (1 - ease(seg(t, 27.3, 31))); }
  var cMemo = { t: -1, v: 0 };
  function outflow(t) {
    if (Math.abs(cMemo.t - t) < 1e-9) return cMemo.v;
    var v = 0, dt = .05; for (var x = 0; x < t; x += dt) v += flowAt(x + Math.min(dt, t - x) / 2) * Math.min(dt, t - x);
    cMemo = { t: t, v: v }; return v;
  }
  function domeY(x, hD) { var u = (x - CL.vx) / 52; return u <= -1 || u >= 1 ? CL.ys : CL.ys - hD * Math.pow(1 - u * u, .8); }
  function sampleP(pts) {
    var out = [[pts[0][0], pts[0][1]]], L2 = [0];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = len(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 3));
      for (var k = 1; k <= n; k++) { out.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); L2.push(L2[L2.length - 1] + d / n); }
    }
    return { pts: out, len: L2, total: L2[L2.length - 1] };
  }
  function atP(P, s) {
    var lo = 0, hi = P.len.length - 1;
    if (s <= 0) return P.pts[0]; if (s >= P.total) return P.pts[hi];
    while (hi - lo > 1) { var m = (lo + hi) >> 1; if (P.len[m] < s) lo = m; else hi = m; }
    var k = (s - P.len[lo]) / ((P.len[hi] - P.len[lo]) || 1);
    return [P.pts[lo][0] + (P.pts[hi][0] - P.pts[lo][0]) * k, P.pts[lo][1] + (P.pts[hi][1] - P.pts[lo][1]) * k];
  }
  /* the routes the escaping blood takes: up from the lumen, through the gap, up the cut, into the drop (where each
     cell leaves this section; none ends at the edge of the drop, half out of it) */
  var OUT = [-1, 0, 1].map(function (k) {
    return sampleP([[CL.vx + 9 * k, 338], [CL.vx + 5 * k, 322], [CL.vx + 3 * k, 300], [CL.vx + 6 * k, 250], [CL.vx + 9 * k, 200], [CL.vx + 13 * k, 150], [CL.vx + 18 * k, 100], [CL.vx + 22 * k, 76], [CL.vx + 27 * k, 62]]);
  });
  /* the escaping cells, nine to a route. Where a step stops (the model times below), none is half-drawn: each is moved
     along its route, as little as it can be, until it is clear of where cells come into view and leave */
  var OUTC = (function () {
    var r = rng(51), out = [], VP = [8, 18, 27].map(function (m) { return [outflow(m), flowAt(m)]; });
    OUT.forEach(function (P, pi) {
      function clear(s0) { return VP.every(function (v) { var s = (((s0 + v[0] * 40 / P.total) % 1) + 1) % 1 * P.total; return s > Math.max(1, 8 * v[1]) + 2 && s < P.total - Math.max(1, 12 * v[1]) - 2; }); }
      for (var i = 0; i < 9; i++) {
        var s0 = (i + [0, .45, .2][pi] + .2 * r()) / 9, d = 0;
        while (d < .2 && !clear(s0 + d) && !clear(s0 - d)) d += .002;
        out.push({ p: pi, s0: (clear(s0 + d) ? s0 + d : s0 - d + 1) % 1, face: r() < .5, spin: r() * 360 });
      }
    });
    return out;
  })();
  /* what is in the lumen: red blood cells, a white blood cell, platelets and fibrinogen */
  var LUM = (function () {
    var r = rng(77), cells = [[262, 430, 0, true]], plts = [], rods = [[366, 440, .5]], k;
    function clear(x, y, d) { return len(x - 364, y - 350) > d && len(x - 366, y - 440) > d && len(x - 286, y - 462) > d + 14; }
    for (k = 0; k < 400 && cells.length < 21; k++) {
      var a = r() * 6.283, rr = Math.sqrt(r()) * 74, x = CL.vx + Math.cos(a) * rr, y = CL.vy + Math.sin(a) * rr;
      if (!clear(x, y, 16) || y < CL.vy - 62) continue;
      if (cells.some(function (c) { return len(c[0] - x, c[1] - y) < 19; })) continue;
      cells.push([x, y, r() * 180, r() < .5]);
    }
    for (k = 0; k < 200 && plts.length < 4; k++) {
      var x2 = CL.vx + (r() - .5) * 150, y2 = CL.vy + (r() - .5) * 150;
      if (len(x2 - CL.vx, y2 - CL.vy) > 80 || y2 < CL.vy - 30 || cells.some(function (c) { return len(c[0] - x2, c[1] - y2) < 13; }) || !clear(x2, y2, 12)) continue;
      plts.push([x2, y2]);
    }
    for (k = 0; k < 400 && rods.length < 34; k++) {
      var x3 = CL.vx + (r() - .5) * 170, y3 = CL.vy + (r() - .5) * 170;
      if (len(x3 - CL.vx, y3 - CL.vy) > 82 || cells.some(function (c) { return len(c[0] - x3, c[1] - y3) < 11; }) || !clear(x3, y3, 9)) continue;
      rods.push([x3, y3, r() * 3.14]);
    }
    return { cells: cells, plts: plts, rods: rods };
  })();
  /* the red blood cell that is named: face-on, on the left of the lumen, half-way down */
  var RBC_L = LUM.cells.filter(function (c) { return c[3]; }).sort(function (a, b) { return len(a[0] - 244, a[1] - 388) - len(b[0] - 244, b[1] - 388); })[0];
  /* platelets that stick at the wound: from the blood to the edges of the gap and the cut, then to each other */
  var STICK = (function () {
    var tg = [[321, 311], [300, 311], [319, 300], [302, 300], [317, 290], [305, 289], [323, 278], [299, 280], [311, 305], [312, 296], [314, 284], [308, 276]];
    var from = [[364, 350], [258, 372], [352, 392], [284, 344], [378, 372], [236, 392], [336, 334], [262, 352], [322, 370], [340, 360], [300, 364], [278, 330]];
    return tg.map(function (p, i) { return { tx: p[0], ty: p[1], fx: from[i][0], fy: from[i][1], t0: 8.4 + .42 * i }; });
  })();
  /* Platelets in the blood that fills the wound (Daniel, 28 Sep: fibrin "appearing at the top where there's no
     platelets ... the animation might actually be faking a few things"). They come with the blood, so they are all
     through the wound, not only at the break in the vessel. Each rides up the cut with the blood (at the speed the
     red blood cells move) and is caught where it is drawn: those at a side (L, R) touch the damaged tissue in step 2,
     become active (spiky), stick to it and release chemicals; those in the blood (M, x given) are slowed and caught
     as the blood clots in step 3, when thrombin activates them too. Fibrin then forms on the active platelets and the
     damaged tissue, so every thread below starts at a platelet. Each is [side, y] or ['M', y, x, when caught]. */
  var WP = (function () {
    var spec = [['L', 90], ['R', 112], ['L', 135], ['R', 158], ['L', 180], ['R', 204], ['L', 225], ['R', 248], ['L', 268],
                ['M', 128, 312, 19.2], ['M', 196, 306, 18.9], ['M', 76, 318, 20.5], ['M', 60, 296, 21], ['M', 61, 327, 21.4]];
    return spec.map(function (q, i) {
      var y = q[1], x = q[0] === 'L' ? edgeX(1, 0, y) + 3.6 : q[0] === 'R' ? edgeX(1, 1, y) - 3.6 : q[2];
      var dx = q[0] === 'L' ? -1.6 : q[0] === 'R' ? 1.6 : 0;           /* those at a side press onto it as they stick */
      var t0 = q[0] === 'M' ? q[3] : 8.8 + .28 * i;
      /* the way it comes: from the lumen through the break, up the middle of the cut, then across to its place */
      var lane = CL.vx + .3 * (q[0] === 'M' ? x - CL.vx : q[0] === 'L' ? -5 : 5), yT = y + 30, pts = [[lane, 338], [lane, 322]];
      for (var yy = 298; yy > yT; yy -= 24) pts.push([lane, yy]);
      for (var k = 0; k <= 6; k++) { var u = k / 6, a1 = 1 - u; pts.push([a1 * a1 * lane + 2 * a1 * u * lane + u * u * x, a1 * a1 * yT + 2 * a1 * u * (y + 8) + u * u * y]); }
      return { x: x, y: y, dx: dx, side: q[0], t0: t0, ph: i * 1.7, P: sampleP(pts), Va: outflow(t0) };
    });
  })();
  function anchorAt(a) {                  /* a thread's end: a wound platelet, a platelet of the plug, or a point of a side */
    if (a[0] === 'w') return [WP[a[1]].x + WP[a[1]].dx, WP[a[1]].y];
    if (a[0] === 's') return [STICK[a[1]].tx, STICK[a[1]].ty];
    return [edgeX(1, a[0] === 'l' ? 0 : 1, a[1]) + (a[0] === 'l' ? 1 : -1), a[1]];
  }
  /* fibrin threads: each grows from a platelet across the blood to another platelet or to a side of the cut; two
     dissolved fibrinogen molecules join it on the way. The first ones grow from the plug upwards (step 3); the rest
     thicken the mesh (step 4). */
  var THREADS = (function () {
    var r = rng(91), out = [];
    var spec = [[['s', 11], ['r', 262]], [['s', 7], ['w', 8]], [['w', 8], ['w', 7]], [['w', 7], ['l', 245]], [['w', 6], ['r', 228]],
                [['w', 5], ['w', 10]], [['w', 10], ['w', 4]], [['w', 4], ['r', 182]], [['w', 3], ['w', 9]], [['w', 9], ['w', 0]],
                [['w', 2], ['r', 140]], [['w', 1], ['l', 118]], [['w', 0], ['r', 78]], [['w', 11], ['w', 13]],
                [['w', 12], ['w', 13]], [['w', 6], ['w', 5]], [['w', 3], ['l', 160]], [['w', 1], ['w', 9]], [['w', 12], ['w', 0]], [['s', 6], ['w', 7]]];
    spec.forEach(function (q, i) {
      var a = anchorAt(q[0]), b = anchorAt(q[1]), mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, L = len(b[0] - a[0], b[1] - a[1]);
      var bend = (r() - .5) * .28 * L, nx = -(b[1] - a[1]) / (L || 1), ny = (b[0] - a[0]) / (L || 1);
      var cx = mx + nx * bend, cy = my + ny * bend;
      out.push({ x0: a[0], y0: a[1], x1: b[0], y1: b[1], cx: cx, cy: cy, mx: (a[0] + 2 * cx + b[0]) / 4, my: (a[1] + 2 * cy + b[1]) / 4,
                 g0: i < 13 ? 18.6 + i * .62 : 27.3 + (i - 13) * .55, dur: i < 13 ? 2.8 : 2.4 });
    });
    return out;
  })();
  /* the thread that is named: one of the first to form in step 3, across the lower half of the wound */
  var FIB_L = THREADS.filter(function (th) { return th.g0 < 22; }).sort(function (a, b) { return len(a.mx - 312, a.my - 228) - len(b.mx - 312, b.my - 228); })[0];
  function threadAt(th, k) { var a = 1 - k; return [a * a * th.x0 + 2 * a * k * th.cx + k * k * th.x1, a * a * th.y0 + 2 * a * k * th.cy + k * k * th.y1]; }
  var FEED = (function () {
    var r = rng(63), out = [];
    THREADS.forEach(function (th, i) { [.3, .72].forEach(function (k) { var p = threadAt(th, k); out.push({ th: i, k: k, sx: p[0] + (r() - .5) * 30, sy: p[1] + (r() - .5) * 24, a: r() * 3.14, ph: r() * 6.28 }); }); });
    return out;
  })();
  var BUGS = [[118, 67, 12], [236, 67, -8], [468, 67, 20], [392, 66, 4]];

  function clStatic(u) {
    var r = rng(4), s = '', i, x, y;
    s += '<defs>' +
      '<linearGradient id="' + u + 'de" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#EBC2B1"/><stop offset="1" stop-color="#DDAA99"/></linearGradient>' +
      '<linearGradient id="' + u + 'ep" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#F0D6C4"/><stop offset="1" stop-color="#E2B7A2"/></linearGradient>' +
      '<radialGradient id="' + u + 'lu" cx=".5" cy=".5" r=".5"><stop offset=".75" stop-color="#F4D2B4"/><stop offset="1" stop-color="#E9BE9C"/></radialGradient>' +
      '<linearGradient id="' + u + 'sc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5B2E1E"/><stop offset="1" stop-color="#7A3E26"/></linearGradient>' +
      '<clipPath id="' + u + 'cp"><rect class="cl__cr"/></clipPath>' +
      '<clipPath id="' + u + 'wd"><path class="cl__wclip"/></clipPath>' +
      '<clipPath id="' + u + 'hb"><path class="cl__hclip"/></clipPath>' +
      '<filter id="' + u + 'hs" x="-25%" y="-5%" width="150%" height="110%"><feGaussianBlur stdDeviation="2.2"/></filter>' +
      '</defs>';
    /* dermis: connective tissue with collagen fibres and fibroblasts */
    s += '<rect x="-10" y="150" width="' + (CL.W + 20) + '" height="' + (CL.H - 140) + '" fill="url(#' + u + 'de)"/>';
    var col = '';
    for (i = 0; i < 26; i++) {
      y = 214 + i * 12 + 6 * r(); var d = 'M-10 ' + n1(y);
      for (x = 0; x <= CL.W + 20; x += 24) d += ' L' + x + ' ' + n1(y + 4 * Math.sin(x / 30 + i * 1.3) + 2 * Math.sin(x / 9 + i));
      col += '<path d="' + d + '"/>';
    }
    s += '<g class="cl__col">' + col + '</g>';
    var fb = '';
    for (i = 0; i < 26; i++) { x = r() * CL.W; y = 220 + r() * 290; if (len(x - CL.vx, y - CL.vy) < CL.vo + 12) continue; fb += '<ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="7" ry="1.8" transform="rotate(' + n1(-10 + 20 * r()) + ' ' + n1(x) + ' ' + n1(y) + ')"/>'; }
    s += '<g class="cl__fb">' + fb + '</g>';
    /* epidermis: rows of cells, flattened towards the surface; the outermost layer has no nuclei */
    var ep = 'M-10 ' + (CL.ys + 14);
    for (x = -10; x <= CL.W + 10; x += 6) ep += ' L' + x + ' ' + n1(CL.ys + 14);
    for (x = CL.W + 10; x >= -10; x -= 6) ep += ' L' + x + ' ' + n1(yBas(x));
    s += '<path class="cl__epi" d="' + ep + 'Z" fill="url(#' + u + 'ep)"/>';
    var cells = '', nuc = '';
    for (var row = 0; row < 5; row++) {
      var top = CL.ys + 16 + row * 22, w = 26 - row * 1.2;
      for (x = -10 + (row % 2) * 13; x < CL.W + 10; x += w) {
        var cyy = top + 11, base = yBas(x + w / 2);
        if (cyy + 6 > base) continue;
        var hh = Math.min(20, base - top - 2);
        cells += '<rect x="' + n1(x + 1) + '" y="' + n1(top) + '" width="' + n1(w - 2) + '" height="' + n1(hh) + '" rx="5"/>';
        nuc += '<ellipse cx="' + n1(x + w / 2 + (r() - .5) * 3) + '" cy="' + n1(top + hh / 2) + '" rx="' + n1(row < 2 ? 4.4 : 3.6) + '" ry="' + n1(row < 2 ? 2.6 : 3.2) + '"/>';
      }
    }
    for (x = -6; x < CL.W + 10; x += 13) { var yb = yBas(x); cells += '<rect x="' + n1(x) + '" y="' + n1(yb - 15) + '" width="11" height="14" rx="4"/>'; nuc += '<ellipse cx="' + n1(x + 5.5) + '" cy="' + n1(yb - 8) + '" rx="3.4" ry="4"/>'; }
    s += '<g class="cl__ecell">' + cells + '</g><g class="cl__enuc">' + nuc + '</g>';
    var horn = '';
    for (i = 0; i < 4; i++) horn += '<path d="M-10 ' + (CL.ys + 3 + i * 3.4) + ' L' + (CL.W + 10) + ' ' + (CL.ys + 3 + i * 3.4) + '"/>';
    s += '<rect class="cl__horn" x="-10" y="' + CL.ys + '" width="' + (CL.W + 20) + '" height="16"/><g class="cl__hornl">' + horn + '</g>';
    /* the vessel: its wall and lumen; the parts that change are drawn each frame */
    s += '<circle class="cl__lum" cx="' + CL.vx + '" cy="' + CL.vy + '" r="' + CL.vi + '" fill="url(#' + u + 'lu)"/>';
    s += '<path class="cl__wall" fill-rule="evenodd"/><path class="cl__endo" fill-rule="evenodd"/><g class="cl__wnuc"></g>';
    s += '<g class="cl__lumc"></g>';
    s += '<path class="cl__air"/><path class="cl__blood"/><g class="cl__out"></g>';
    s += '<g class="cl__stick"></g><g class="cl__fib"></g><path class="cl__clot"/>';
    s += '<g class="cl__heal"></g><g class="cl__scab"></g><g class="cl__bugs"></g>';
    return s;
  }
  function rbc(x, y, rot, face, extra) {
    var tr = ' transform="translate(' + n1(x) + ' ' + n1(y) + ') rotate(' + n1(rot) + ')"';
    if (face) return '<g class="cl__rbc"' + tr + (extra || '') + '><circle r="9"/><circle class="cl__rbcc" r="4.2"/></g>';
    return '<g class="cl__rbc"' + tr + (extra || '') + '><path d="M-9 0 C-9 -3.4 -6 -3.3 -3 -2 C-1 -1.2 1 -1.2 3 -2 C6 -3.3 9 -3.4 9 0 C9 3.4 6 3.3 3 2 C1 1.2 -1 1.2 -3 2 C-6 3.3 -9 3.4 -9 0Z"/></g>';
  }
  /* a platelet has no nucleus: only a few tiny granules, scattered */
  function grains(x, y) { return '<circle cx="' + n1(x - 1.3) + '" cy="' + n1(y - .6) + '" r=".5"/><circle cx="' + n1(x + 1) + '" cy="' + n1(y - .8) + '" r=".45"/><circle cx="' + n1(x + .2) + '" cy="' + n1(y + 1) + '" r=".5"/>'; }
  function platelet(x, y, act, extra) {
    if (act > .05) {
      var d = '', n = 7;
      for (var i = 0; i < n * 2; i++) { var a = i * Math.PI / n, rr = i % 2 ? 2.6 : 2.6 + 3.2 * act; d += (i ? ' L' : 'M') + n1(x + Math.cos(a) * rr) + ' ' + n1(y + Math.sin(a) * rr); }
      return '<g class="cl__plt is-act"' + (extra || '') + '><path d="' + d + 'Z"/>' + grains(x, y) + '</g>';
    }
    return '<g class="cl__plt"' + (extra || '') + '><ellipse cx="' + n1(x) + '" cy="' + n1(y) + '" rx="3.2" ry="2.4"/>' + grains(x, y) + '</g>';
  }

  function clot(spec) {
    var u = 'cl' + (++UID) + '-';
    var S = shell(spec, 'cl', 'A cut, step by step', 'A section through skin and a small blood vessel, cut across. A cut breaks the skin and the vessel wall, and blood flows out. Platelets stick at the wound, fibrinogen is converted into fibrin threads, the threads trap blood cells in a clot, the clot hardens into a scab, and new skin grows under it.', [['when', 'When'], ['bleed', 'Bleeding']]);
    var svg = S.svg;
    svg.innerHTML = '<rect class="cl__bg"/><g class="cl__model" clip-path="url(#' + u + 'cp)">' + clStatic(u) + '</g><g class="cl__labs"></g>';
    var q = function (c) { return svg.querySelector(c); };
    var bg = q('.cl__bg'), model = q('.cl__model'), cr = q('.cl__cr'), gLab = q('.cl__labs');
    var wall = q('.cl__wall'), endo = q('.cl__endo'), wnuc = q('.cl__wnuc'), gLum = q('.cl__lumc'), air = q('.cl__air'), blood = q('.cl__blood'), gOut = q('.cl__out');
    var gStick = q('.cl__stick'), gFib = q('.cl__fib'), clotP = q('.cl__clot'), gHeal = q('.cl__heal'), gScab = q('.cl__scab'), gBugs = q('.cl__bugs'), wclip = q('.cl__wclip'), hclip = q('.cl__hclip');
    var lay = null;

    function ringPath(r1, r2, a0, a1) {   /* a ring from angle a0 to a1 (radians, clockwise), between radii r1 < r2 */
      var big = a1 - a0 > Math.PI ? 1 : 0, cx = CL.vx, cy = CL.vy;
      function pt(r, a) { return n1(cx + Math.cos(a) * r) + ' ' + n1(cy + Math.sin(a) * r); }
      return 'M' + pt(r2, a0) + ' A' + r2 + ' ' + r2 + ' 0 ' + big + ' 1 ' + pt(r2, a1) + ' L' + pt(r1, a1) + ' A' + r1 + ' ' + r1 + ' 0 ' + big + ' 0 ' + pt(r1, a0) + 'Z';
    }
    function annulus(r1, r2) {   /* a whole ring, no seams: two circles, filled even-odd */
      function circ(r) { return 'M' + (CL.vx + r) + ' ' + CL.vy + ' A' + r + ' ' + r + ' 0 1 1 ' + (CL.vx - r) + ' ' + CL.vy + ' A' + r + ' ' + r + ' 0 1 1 ' + (CL.vx + r) + ' ' + CL.vy + 'Z'; }
      return circ(r2) + ' ' + circ(r1);
    }
    function render(t) {
      var o = openAt(t), F = fillAt(t), hD = dropAt(t), V = outflow(t), i;
      /* the vessel wall, with the gap the cut made; it closes again in step 6 */
      var heal = ease(seg(t, 45.5, 50.5)), gA = -97 * Math.PI / 180, gB = -82.4 * Math.PI / 180, mid = (gA + gB) / 2;
      var ga = lerp(mid, gA, o), gb = lerp(mid, gB, o);
      if (o > .01 && heal < .999) {
        wall.setAttribute('d', ringPath(CL.vi, CL.vo, gb, ga + 2 * Math.PI));
        endo.setAttribute('d', ringPath(CL.vi, CL.vi + 2.4, gb, ga + 2 * Math.PI));
      } else {
        wall.setAttribute('d', annulus(CL.vi, CL.vo)); endo.setAttribute('d', annulus(CL.vi, CL.vi + 2.4));
      }
      var wn = '';
      for (i = 0; i < 16; i++) { var a = -Math.PI / 2 + (i + .5) * Math.PI / 8; if (o > .01 && a > ga - .06 && a < gb + .06) continue; var nx = CL.vx + Math.cos(a) * (CL.vi + 5.5), ny = CL.vy + Math.sin(a) * (CL.vi + 5.5); wn += '<ellipse cx="' + n1(nx) + '" cy="' + n1(ny) + '" rx="4.6" ry="1.6" transform="rotate(' + n1(a * 57.3 + 90) + ' ' + n1(nx) + ' ' + n1(ny) + ')"/>'; }
      wnuc.innerHTML = wn;

      /* the wound: open air above the blood, blood below it and in the drop. In step 6 new tissue replaces the clot
         from both sides of the cut: the wound is then the band between its two closing sides, and everything in it
         (the cells, the platelets, the fibrin) goes as the band passes it, so the skin drawn beneath shows again */
      var hc = ease(seg(t, 44.8, 51));
      var Lp = cutPts(o, 0).map(function (q) { return [lerp(q[0], CL.vx, hc), q[1]]; }), Rp = cutPts(o, 1).map(function (q) { return [lerp(q[0], CL.vx, hc), q[1]]; });
      function exC(side, y) { return lerp(edgeX(o, side, y), CL.vx, hc); }
      function inBand(x, y) { return Math.min(x - exC(0, y), exC(1, y) - x); }       /* how far inside the wound, now */
      /* what is in the wound is cut off at a line a little outside each closing side (the margin shrinks to nothing as
         they close, so nothing is cut when they start), and fades as that line comes within r of its middle */
      var HM = 7 * clamp01(1 - hc * 5);
      function fadeIn(x, y, r) { return hc > 0 ? clamp01((inBand(x, y) + HM - r) / 5) : 1; }
      function edgePoly(ytop) {
        var left = [], right = [];
        for (var k = 0; k < Lp.length; k++) { if (Lp[k][1] >= ytop) left.push(Lp[k]); }
        for (k = 0; k < Rp.length; k++) { if (Rp[k][1] >= ytop) right.push(Rp[k]); }
        left.unshift([exC(0, ytop), ytop]); right.unshift([exC(1, ytop), ytop]);
        var d = 'M' + left.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L');
        d += ' L' + n1(CL.vx + (Rp[Rp.length - 1][0] - CL.vx)) + ' ' + (CL.vy - CL.vi + 6) + ' L' + n1(Lp[Lp.length - 1][0]) + ' ' + (CL.vy - CL.vi + 6);
        return d + ' L' + right.reverse().map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L') + 'Z';
      }
      if (o > .01) {
        var open = hc < .995;
        air.setAttribute('d', open ? edgePoly(CL.ys - 10) : '');
        var dB = open && F < CL.vy - CL.vi - 1 ? edgePoly(Math.max(CL.ys - 10, F)) : '';
        if (hD > .3 && hc < .99) { var dd = 'M' + (CL.vx + 52) + ' ' + (CL.ys + 2); for (var xx = CL.vx + 52; xx >= CL.vx - 52; xx -= 4) dd += ' L' + xx + ' ' + n1(domeY(xx, hD)); dB += dd + ' L' + (CL.vx - 52) + ' ' + (CL.ys + 2) + 'Z'; }
        blood.setAttribute('d', dB);
        wclip.setAttribute('d', dB || 'M0 0Z');
        if (hc > 0) {
          var hl2 = [], hr2 = [];
          for (var yh = CL.ys - 40; yh <= CL.vy - CL.vi + 10; yh += 6) { hl2.push(n1(exC(0, yh) - HM) + ' ' + yh); hr2.unshift(n1(exC(1, yh) + HM) + ' ' + yh); }
          hclip.setAttribute('d', 'M' + hl2.join(' L') + ' L' + hr2.join(' L') + 'Z');
        }
      } else { air.setAttribute('d', ''); blood.setAttribute('d', ''); wclip.setAttribute('d', 'M0 0Z'); }
      [gOut, gStick].forEach(function (g) { if (hc > 0) g.setAttribute('clip-path', 'url(#' + u + 'hb)'); else g.removeAttribute('clip-path'); });

      /* the lumen's contents: still, apart from a slight shimmer (in this section the blood flows towards you) */
      var lm = '', stuckFrom = {};
      STICK.forEach(function (p) { stuckFrom[p.fx + ',' + p.fy] = 1; });
      LUM.rods.forEach(function (rd, k) {
        var x = rd[0] + 1.2 * Math.sin(t * .7 + k), y = rd[1] + 1.2 * Math.cos(t * .6 + k), a = rd[2] + .15 * Math.sin(t * .5 + k);
        lm += '<path class="cl__rod" d="M' + n1(x - 2.6 * Math.cos(a)) + ' ' + n1(y - 2.6 * Math.sin(a)) + ' L' + n1(x + 2.6 * Math.cos(a)) + ' ' + n1(y + 2.6 * Math.sin(a)) + '"/>';
      });
      LUM.cells.forEach(function (c, k) { lm += rbc(c[0] + .8 * Math.sin(t * .5 + k), c[1] + .8 * Math.cos(t * .45 + k), c[2], c[3]); });
      /* the white blood cell: larger than a red blood cell, with a lobed nucleus */
      lm += '<g class="cl__wbc" transform="translate(286 462)"><circle r="14.5"/><path class="cl__wbcn" d="M-8 -3 C-10 -8 -3 -10 -2 -5 C0 -9 7 -8 6 -3 C10 -1 8 6 3 4 C1 8 -6 7 -5 2 C-9 3 -10 -1 -8 -3Z"/></g>';
      LUM.plts.forEach(function (p) { if (!stuckFrom[p[0] + ',' + p[1]]) lm += platelet(p[0] + .6 * Math.sin(t + p[0]), p[1] + .6 * Math.cos(t + p[1]), 0); });
      gLum.innerHTML = lm;

      /* the blood that escapes: cells move up the cut while blood flows; when the flow stops they stay where they are */
      /* a cell comes into view (and leaves at the end of the drop) in the same short time whatever the speed of the flow,
         so none is left half-drawn when the flow is slow or stops */
      var ou = '', fl = flowAt(t), fIn = Math.max(1, 8 * fl), fOut = Math.max(1, 12 * fl);
      if (o > .01) OUTC.forEach(function (c) {
        var P = OUT[c.p], sN = (c.s0 + V * 40 / P.total) % 1, pos = atP(P, sN * P.total);
        if (pos[1] < F - 4 && !(pos[1] < CL.ys && hD > 2)) return;
        var op = Math.min(1, sN * P.total / fIn, (1 - sN) * P.total / fOut);
        if (pos[1] < CL.ys) op *= clamp01((pos[1] - domeY(pos[0], hD) - 4) / 4);
        /* one still inside the vessel when the plug closes the break is carried on along the vessel, out of this
           section, instead of into the wound */
        if (pos[1] > CL.vy - CL.vi + 2) op *= clamp01((fl - .05) / .07);
        op *= fadeIn(pos[0], pos[1], 4);
        if (op < .05) return;
        ou += rbc(pos[0], pos[1], c.spin + sN * 220, c.face, op < .99 ? ' opacity="' + n1(op) + '"' : '');
      });
      gOut.innerHTML = ou;

      /* platelets collect at the break in the vessel, stick to the damaged wall and to each other, and release
         chemicals */
      var st = '', plt0 = null;
      STICK.forEach(function (p, k) {
        var m = ease(seg(t, p.t0, p.t0 + 1.8)), act = ease(seg(t, p.t0 + 1.5, p.t0 + 2.4));
        var x = lerp(p.fx, p.tx, m), y = lerp(p.fy, p.ty, m);
        if (m < .01) { x += .6 * Math.sin(t + p.fx); y += .6 * Math.cos(t + p.fy); }
        var op = m > .5 ? fadeIn(x, y, 2) : 1;
        if (k === 0) plt0 = [x, y, op];
        if (op < .05) return;
        st += platelet(x, y, act, op < .99 ? ' opacity="' + n1(op) + '"' : '');
        if (act > .5 && t < 27) for (var j = 0; j < 3; j++) {
          var age = ((t - p.t0 - 2.4 + j * .6) % 1.8 + 1.8) % 1.8, aa = k * 1.3 + j * 2.1, rr = 4 + age * 7, op = (1 - age / 1.8) * (1 - seg(t, 24, 27));
          st += '<circle class="cl__chem" cx="' + n1(x + Math.cos(aa) * rr) + '" cy="' + n1(y + Math.sin(aa) * rr) + '" r="1.3" opacity="' + n1(op) + '"/>';
        }
      });
      /* the platelets that come out with the blood (WP): each rides up the cut with it and slows to a stop where it is
         caught; then it becomes active (spiky), one at a side presses onto it, and it too releases chemicals */
      WP.forEach(function (w, k) {
        var Db = 40 * (w.Va - V), D = Db >= 14 ? Db - 7 : Db > 0 ? Db * Db / 28 : 0;   /* still to go: slows to a stop */
        if (D > w.P.total) return;
        var at = atP(w.P, w.P.total - D), sN = w.P.total - D;
        var act = ease(seg(t, w.t0, w.t0 + 1)), stk = ease(seg(t, w.t0 + .5, w.t0 + 1.5));
        var x = at[0] + w.dx * stk, y = at[1];
        if (D <= 0) { x += (1 - act) * .7 * Math.sin(t * 1.1 + w.ph); y += (1 - act) * .7 * Math.cos(t * .9 + w.ph); }
        var op = Math.min(1, sN / fIn) * (y < CL.ys ? clamp01((y - domeY(x, hD) - 2) / 4) : 1) * fadeIn(x, y, 2);
        if (op < .05) return;
        st += platelet(x, y, act, op < .99 ? ' opacity="' + n1(op) + '"' : '');
        if (act > .5 && t < 27) for (var j = 0; j < 2; j++) {
          var age = ((t - w.t0 - 1 + j * .9) % 1.8 + 1.8) % 1.8, aa = k * 1.7 + j * 2.4, rr = 4 + age * 6, op2 = (1 - age / 1.8) * (1 - seg(t, 24, 27)) * op;
          st += '<circle class="cl__chem" cx="' + n1(x + Math.cos(aa) * rr) + '" cy="' + n1(y + Math.sin(aa) * rr) + '" r="1.3" opacity="' + n1(op2) + '"/>';
        }
      });
      /* and from the damaged tissue: the broken ends of the vessel wall and the sides of the cut */
      if (t > 8.6 && t < 27) {
        var dmg = [[ga, CL.vi + 3], [ga, CL.vo - 3], [gb, CL.vi + 3], [gb, CL.vo - 3]].map(function (q) { return [CL.vx + Math.cos(q[0]) * q[1], CL.vy + Math.sin(q[0]) * q[1]]; });
        dmg.push([edgeX(o, 0, 262), 262], [edgeX(o, 1, 262), 262], [edgeX(o, 0, 226), 226], [edgeX(o, 1, 226), 226]);
        dmg.forEach(function (q, k) {
          for (var j = 0; j < 2; j++) {
            var age = ((t - 8.6 + k * .37 + j * .9) % 1.8 + 1.8) % 1.8, aa = k * 1.9 + j * 2.6, rr = 3 + age * 6;
            var op = (1 - age / 1.8) * seg(t, 8.6, 9.4) * (1 - seg(t, 24, 27));
            st += '<circle class="cl__chem" cx="' + n1(q[0] + Math.cos(aa) * rr) + '" cy="' + n1(q[1] + Math.sin(aa) * rr) + '" r="1.3" opacity="' + n1(op) + '"/>';
          }
        });
      }
      gStick.innerHTML = st;

      /* fibrinogen in the wound joins into fibrin threads; the threads make a mesh */
      var fb = '';
      if (o > .01) {
        FEED.forEach(function (fd) {
          var th = THREADS[fd.th], tj = th.g0 + th.dur * fd.k, m = ease(seg(t, tj - 1.6, tj));
          if (t > tj + .05) return;
          var p = threadAt(th, fd.k), p2 = threadAt(th, Math.min(1, fd.k + .02)), ta = Math.atan2(p2[1] - p[1], p2[0] - p[0]);
          var x = lerp(fd.sx + 1.4 * Math.sin(t * .8 + fd.ph), p[0], m), y = lerp(fd.sy + 1.4 * Math.cos(t * .7 + fd.ph), p[1], m), a = lerp(fd.a, ta, m);
          if (y < F - 2 && !(y < CL.ys && hD > 2)) return;
          fb += '<path class="cl__rod" d="M' + n1(x - 2.6 * Math.cos(a)) + ' ' + n1(y - 2.6 * Math.sin(a)) + ' L' + n1(x + 2.6 * Math.cos(a)) + ' ' + n1(y + 2.6 * Math.sin(a)) + '"/>';
        });
        THREADS.forEach(function (th) {
          var g = clamp01((t - th.g0) / th.dur); if (g <= 0) return;
          var d = '', n = Math.max(2, Math.ceil(g * 24));
          for (var k = 0; k <= n; k++) { var p = threadAt(th, g * k / n); d += (k ? ' L' : 'M') + n1(p[0]) + ' ' + n1(p[1]); }
          fb += '<path class="cl__fibrin" d="' + d + '"/>';
        });
      }
      gFib.innerHTML = fb;
      gFib.setAttribute('clip-path', 'url(#' + u + 'wd)');
      var fibOp = 1 - ease(seg(hc, .5, .92));
      if (fibOp < 1) gFib.setAttribute('opacity', n1(fibOp)); else gFib.removeAttribute('opacity');

      /* the clot: the mesh with what it has trapped */
      var ck = ease(seg(t, 28.5, 33));
      clotP.setAttribute('d', ck > .01 ? blood.getAttribute('d') : '');
      clotP.setAttribute('opacity', n1(ck * .3));

      /* healing: where the clot was, new tissue (the skin's own layers, drawn beneath, show again as the band closes;
         a little paler while they are new); the vessel wall grows back from both sides of the gap */
      var hl = '';
      if (hc > .001) {
        var yTop = CL.ys + 1, yBot = CL.vy - CL.vi + 4, strip = '';
        [0, 1].forEach(function (side) {
          var outer = [], inner = [];
          for (var yy = yTop; yy <= yBot + .01; yy += 4) { outer.push(n1(edgeX(o, side, yy)) + ' ' + n1(yy)); inner.unshift(n1(exC(side, yy)) + ' ' + n1(yy)); }
          strip += 'M' + outer.join(' L') + ' L' + inner.join(' L') + 'Z';
        });
        hl += '<path class="cl__newt" d="' + strip + '" opacity="' + n1(.26 - .12 * ease(seg(t, 51.8, 54.4))) + '" filter="url(#' + u + 'hs)"/>';
        if (heal > .01 && heal < .999) {
          var e1 = ga + (mid - ga) * heal, e2 = gb - (gb - mid) * heal;
          hl += '<path class="cl__wallfix" d="' + ringPath(CL.vi, CL.vo, ga - .01, e1) + ringPath(CL.vi, CL.vo, e2, gb + .01) + '"/>' +
                '<path class="cl__endo" d="' + ringPath(CL.vi, CL.vi + 2.4, ga - .01, e1) + ringPath(CL.vi, CL.vi + 2.4, e2, gb + .01) + '"/>';
        }
      }
      gHeal.innerHTML = hl;

      /* the scab: the dried clot at the surface; it lifts off at the end */
      var sk = ease(seg(t, 36.8, 41.5)), fall = ease(seg(t, 51.8, 54.4)), scb = '';
      if (sk > .01 && fall < .99) {
        var dS = 'M' + (CL.vx - 52) + ' ' + (CL.ys + 1), r2 = rng(5);
        for (var x3 = CL.vx - 52; x3 <= CL.vx + 52; x3 += 3) dS += ' L' + x3 + ' ' + n1(domeY(x3, hD) - 1.2 + 2.4 * r2());
        var yb2 = CL.ys + 14;
        dS += ' L' + (CL.vx + 52) + ' ' + (CL.ys + 1) + ' L' + n1(edgeX(o, 1, CL.ys + 2)) + ' ' + (CL.ys + 2) + ' L' + n1(edgeX(o, 1, yb2)) + ' ' + yb2 + ' L' + n1(edgeX(o, 0, yb2)) + ' ' + yb2 + ' L' + n1(edgeX(o, 0, CL.ys + 2)) + ' ' + (CL.ys + 2) + 'Z';
        var tex = '', r3 = rng(8);
        for (var j2 = 0; j2 < 9; j2++) { var tx = CL.vx - 36 + 72 * r3(), ty2 = CL.ys - 10 + 30 * r3(); tex += '<ellipse cx="' + n1(tx) + '" cy="' + n1(ty2) + '" rx="' + n1(5 + 3 * r3()) + '" ry="2.4" transform="rotate(' + n1(180 * r3()) + ' ' + n1(tx) + ' ' + n1(ty2) + ')"/>'; }
        scb = '<g opacity="' + n1(sk * (1 - fall)) + '" transform="translate(' + n1(26 * fall) + ' ' + n1(-60 * fall) + ') rotate(' + n1(14 * fall) + ' ' + CL.vx + ' ' + CL.ys + ')"><path class="cl__scabf" d="' + dS + '" fill="url(#' + u + 'sc)"/><g class="cl__scabt">' + tex + '</g></g>';
      }
      gScab.innerHTML = scb;

      /* pathogens on the skin: one comes to the scab, and cannot get in */
      var bg2 = '';
      BUGS.forEach(function (b, k) {
        var x = b[0], y = b[1], a = b[2];
        if (k === 3) { var m2 = ease(seg(t, 37.5, 41.5)); x = lerp(b[0], 356, m2); y = lerp(b[1], domeY(356, hD) - 2.4, m2); a = lerp(b[2], -30, m2); }
        bg2 += '<rect class="cl__bug" x="' + n1(x - 3.2) + '" y="' + n1(y - 1.4) + '" width="6.4" height="2.8" rx="1.4" transform="rotate(' + n1(a) + ' ' + n1(x) + ' ' + n1(y) + ')"/>';
      });
      gBugs.innerHTML = bg2;

      /* labels: each on a part that is there at this moment */
      var items = [], wide = !lay.narrow;
      function add(id, text, x, y, side, op) { var p = lay.to(x, y); items.push({ id: id, text: text, x: p[0], y: p[1], side: side, op: op == null ? 1 : op }); }
      var mb = ease(seg(t, 37.5, 41.5));
      if (t > 37.2 && fall < .2) add('bug', 'pathogens', lerp(BUGS[3][0], 356, mb), lerp(BUGS[3][1], domeY(356, hD) - 2.4, mb), 'R', Math.min(clamp01((t - 37.2) / .8), 1 - seg(fall, 0, .2)));
      add('skin', 'skin', wide ? 80 : 214, 128, 'L');
      /* the names on the left a clear gap apart: the wall named high on the ring, the red blood cell on one
         half-way down, the white blood cell at the bottom */
      add('wall', 'blood vessel wall', CL.vx + Math.cos(-2.09) * (CL.vi + CL.vw / 2), CL.vy + Math.sin(-2.09) * (CL.vi + CL.vw / 2), 'L');
      add('rbc', 'red blood cell', RBC_L[0], RBC_L[1], 'L');
      add('wbc', 'white blood cell', 286, 462, 'L');
      if (plt0 && plt0[2] > .3) add('plt', 'platelet', plt0[0], plt0[1], 'R', clamp01((plt0[2] - .3) / .5));
      add('fgn', 'fibrinogen (soluble)', LUM.rods[0][0], LUM.rods[0][1], 'R');
      var th0 = FIB_L, fo = Math.min(fadeIn(th0.mx, th0.my, 2), fibOp);
      if (t > th0.g0 + th0.dur * .55 && fo > .3) add('fib', 'fibrin (insoluble threads)', th0.mx, th0.my, 'R', Math.min(clamp01((t - th0.g0 - th0.dur * .55) / .6), clamp01((fo - .3) / .5)));
      var co = fadeIn(306, 262, 2);
      if (ck > .3 && co > .3) add('clot', 'clot', 306, 262, 'R', Math.min(clamp01((ck - .3) * 3), clamp01((co - .3) / .5)));
      if (sk > .3 && fall < .2) add('scab', 'scab', 296, 62, 'L', Math.min(clamp01((sk - .3) * 3), 1 - seg(fall, 0, .2)));
      /* the new skin: named in the tissue that has grown in from the right side of the cut */
      if (hc > .3) add('new', 'new skin', (exC(1, 142) + edgeX(o, 1, 142)) / 2, 142, 'R', clamp01((hc - .3) / .2));
      gLab.innerHTML = drawLabels(lay, items, { plt: 1.4, fgn: 1.2, bug: 1.2 }, lay.f * .75);   /* names a clear gap apart */

      var when = t < 8 ? 'in seconds' : t < 18 ? 'within a minute' : t < 36 ? 'a few minutes' : t < 44 ? 'hours later' : 'days later';
      var bl = t < 1.1 ? ['none yet', 'plain'] : t < 8 ? ['blood flows out', 'bad'] : t < 31 ? ['slowing', 'warn'] : ['stopped', 'ok'];
      S.pill('when', when, 'plain'); S.pill('bleed', bl[0], bl[1]);
    }

    var R = [0, 9, 23.5, 35, 45, 53, 68], M = [0, 8, 18, 27, 36, 44, CL_END], clock = readerClock(R, M);
    var sp = L.stepper({ steps: readerSteps(CL_STEPS, R), end: R[R.length - 1], render: function (t) { render(clock(t)); } });
    return mount(S, sp, 'cl', [
      ['The cells are drawn to scale; fibrinogen (the short rods) is drawn hundreds of times larger than real.'],
      ['<b>Beyond the 0610 syllabus:</b> thrombin (step 3) and step 6, though 0610 mark schemes have given marks for both (for example Paper 31, June 2012, Q1(c)).', 'cl__fence']
    ], function (D, nar) {
      var narrow = !!nar;
      lay = frameOf(svg, bg, model, cr, narrow ? { x0: 198, x1: 422, y0: 20, y1: 510 } : { x0: 0, x1: 620, y0: 20, y1: 510 }, false, D, narrow ? 10 : 10, narrow ? 11 : 11, narrow ? 112 : 132, narrow ? 112 : 132);
      lay.narrow = narrow;
      S.box.classList.toggle('cl--narrow', narrow);
    });
  }

  L.add('phagocyte', phagocyte);
  L.add('clot', clot);
})(window);
