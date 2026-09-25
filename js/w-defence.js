/* ============================================================
   w-defence.js — two widgets about how blood defends the body (0610 9.4).

     phagocyte  "A phagocyte at work" (station `blood`). Six steps, each held until "Next step":
                a bacterium releases chemicals and a phagocyte moves towards it; the cytoplasm
                flows round it; the bacterium is engulfed into a vacuole; small sacs release
                enzymes into the vacuole; the enzymes digest the bacterium; the small soluble
                products are absorbed into the cytoplasm or released from the cell.
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
     (MS 0610/32/M/J/15 Q3(d)(ii); MS 0610/41/M/J/24 Q6(b); MS 0610/32/O/N/11 Q4(b)(ii)).
   · The phagocyte is drawn as a neutrophil, the commonest phagocyte in blood: 10–12 µm across,
     a nucleus of 2–5 lobes joined by thin strands, a cytoplasm full of small granules (Tortora GJ,
     Derrickson B, Principles of Anatomy and Physiology, 15th ed., 2017, ch. 19, table 19.3).
     Its granules are the sacs of digestive enzymes that empty into the vacuole (Borregaard N
     2010, Immunity 33: 657–670; Murphy K, Weaver C, Janeway's Immunobiology, 9th ed., 2016,
     ch. 3). The sacs are drawn larger than real ones so they can be seen.
   · A rod-shaped bacterium is about 2 µm long and 1 µm wide (Madigan MT et al., Brock Biology of
     Microorganisms, 15th ed., 2018, ch. 2), so a phagocyte is several times larger.
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
     release chemicals; a chain of reactions ends with the enzyme thrombin converting fibrinogen
     to fibrin; a small cut stops bleeding within a few minutes (Guyton & Hall, ch. 37). The scab
     dries over hours; new skin grows under it over days (Gurtner GC et al. 2008, Nature 453:
     314–321).
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
  function drawLabels(lay, items, tiny) {
    var vb = lay.vb, o = { left: -8, right: vb.bw + 8, font: lay.f, top: vb.y + 6, bottom: vb.y + vb.h - 6, gap: 5 };
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
    return { box: box, read: read, fig: fig, svg: svg,
             pill: function (k, text, tone) { var p = read.querySelector('[data-k="' + k + '"]'), i = p.querySelector('i'); if (i.textContent !== text) i.textContent = text; p.className = cls + '__pill is-' + tone; } };
  }
  function mount(S, sp, cls, notes, setLayout) {
    S.box.appendChild(sp.bar);
    var wrap = h('div', cls + '__wrap');
    var left = h('div', cls + '__left'); left.appendChild(S.read); left.appendChild(S.fig);
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
    if (ro) ro.observe(wrap);
    S.box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); };
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
    { t: 45, h: 'The products are absorbed', tag: 'Not asked in 0610', p: 'The small, soluble products are harmless. They are absorbed into the cytoplasm, or released from the cell. The vacuole becomes smaller, and the phagocyte can engulf another pathogen.' }
  ];
  var PH_END = 54;

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
    s += '<g class="ph__enz"></g><g class="ph__bac"></g><g class="ph__prod"></g><path class="ph__memo"/><path class="ph__memi"/>';
    return s;
  }

  function phagocyte(spec) {
    var u = 'ph' + (++UID) + '-';
    var S = shell(spec, 'ph', 'A phagocyte at work', 'A phagocyte, a white blood cell with a lobed nucleus, moves towards a bacterium, surrounds it, and encloses it in a vacuole. Enzymes are released into the vacuole and digest the bacterium, and the small soluble products are absorbed.', [['bac', 'The bacterium']]);
    var svg = S.svg;
    svg.innerHTML = '<rect class="ph__bg"/><g class="ph__model" clip-path="url(#' + u + 'cp)">' + phStatic(u) + '</g><g class="ph__labs"></g>';
    var q = function (c) { return svg.querySelector(c); };
    var bg = q('.ph__bg'), model = q('.ph__model'), cr = q('.ph__cr'), gLab = q('.ph__labs');
    var glow = q('.ph__glow'), gChem = q('.ph__chem'), cyto = q('.ph__cyto'), vac = q('.ph__vac'), vac1 = q('.ph__vac1'), gGran = q('.ph__gran'), nucg = q('.ph__nucg');
    var gEnz = q('.ph__enz'), gBac = q('.ph__bac'), gProd = q('.ph__prod'), memo = q('.ph__memo'), memi = q('.ph__memi');
    var lay = null;

    function render(t) {
      var St = phState(t), i;
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
          '<path class="ph__dna" d="M-13 1 C-9 -5 -5 5 -1 -1 S7 -5 11 1"/></g>';
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
        if (t > 31.8) add('enz', 'enzymes', enzPos[0][0], enzPos[0][1], 'R', clamp01((t - 31.8) / .8));
        if (t > 42.6 && prodPos[0]) add('pro', 'soluble products', prodPos[0][0], prodPos[0][1], 'R', clamp01((t - 42.6) / .8));
      } else {
        add('pha', 'phagocyte', cx - 92, cy - 40, 'L');
        add('nuc', 'lobed nucleus', cx - 44 - 4 * St.inw, cy - 56, 'L');
        var ys = outer ? crossings(outer, 'x', cx - 10).filter(function (v) { return v < cy; }) : [];
        if (ys.length) add('mem', 'cell membrane', cx - 10, Math.min.apply(null, ys), 'L');
        add('cyt', 'cytoplasm', cx + 40, cy + 90, 'R');
        if (cg > .05) add('chem', 'chemicals', St.bx - 56, St.by + 26, 'R', clamp01(cg * 1.5));
        if (bop > .25) add('bac', 'bacterium', St.bx, St.by, 'R', clamp01((bop - .25) * 3));
        if (t > 21.8) add('vac', 'vacuole', St.bx - Math.sin(St.al * Math.PI / 180) * (St.rv - 7) * .9, St.by + Math.cos(St.al * Math.PI / 180) * (St.rv - 7) * .9, 'R', clamp01((t - 21.8) / .8));
        if (t > 31.8) add('enz', 'enzymes', enzPos[1][0], enzPos[1][1], 'R', clamp01((t - 31.8) / .8));
        if (t > 42.6 && prodPos[0]) add('pro', 'soluble products', prodPos[0][0], prodPos[0][1], 'R', clamp01((t - 42.6) / .8));
      }
      gLab.innerHTML = drawLabels(lay, items, { enz: 1.5, pro: 1.3, chem: 1.5 });
      var state = t < 11 ? ['free in the tissue', 'warn'] : t < 21.6 ? ['being surrounded', 'warn'] : t < 37.6 ? ['in a vacuole', 'ok'] : t < 44.5 ? ['being digested', 'ok'] : ['digested', 'ok'];
      S.pill('bac', state[0], state[1]);
    }

    var R = [0, 13.5, 23.5, 33.5, 42, 50, 60], M = [0, 11, 20, 29, 37, 45, PH_END], clock = readerClock(R, M);
    var sp = L.stepper({ steps: readerSteps(PH_STEPS, R), end: R[R.length - 1], render: function (t) { render(clock(t)); } });
    return mount(S, sp, 'ph', [
      ['The phagocyte drawn is a neutrophil, the commonest phagocyte in blood: its nucleus has several lobes, and its cytoplasm is full of small granules. A real one is about 11 µm across, and the bacterium about 2 µm long. The sacs of enzymes are drawn larger than real, and the chemicals, enzymes and products are drawn as dots, far larger than real molecules. You see a thin slice, so the extensions look like two arms: in the whole cell they are a cup.'],
      ['<b>Not asked in 0610.</b> Moving towards the chemicals is called chemotaxis. The sacs of enzymes are called lysosomes. Step 6, what happens to the products, goes beyond the syllabus.', 'ph__fence']
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
    { t: 0,  h: 'A cut breaks the skin and a blood vessel', p: 'A cut breaks the skin and the wall of a small blood vessel. Blood flows out through the wound.' },
    { t: 8,  h: 'Platelets stick at the wound', p: 'Platelets are fragments of cells, much smaller than red blood cells. At the wound they stick to the damaged wall and to each other. They release chemicals that start the clotting reactions.' },
    { t: 18, h: 'Fibrinogen is converted into fibrin', tag: 'Supplement', p: 'Plasma carries a soluble protein called fibrinogen. At the wound, fibrinogen is converted into fibrin, which is insoluble. The fibrin forms long threads.' },
    { t: 27, h: 'A mesh traps the cells: a clot', tag: 'Supplement', p: 'The fibrin threads make a mesh across the wound. The mesh traps red blood cells and platelets, forming a clot. The clot prevents blood loss.' },
    { t: 36, h: 'The clot becomes a scab', p: 'The clot dries and hardens into a scab. The scab prevents the entry of pathogens into the body.' },
    { t: 44, h: 'New skin grows under the scab', p: 'Under the scab, the skin repairs itself. New skin cells grow across the wound, and the wall of the blood vessel is repaired. Then the scab falls off.' }
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
  /* the routes the escaping blood takes: up from the lumen, through the gap, up the cut, into the drop */
  var OUT = [-1, 0, 1].map(function (k) {
    return sampleP([[CL.vx + 34 * k, 372], [CL.vx + 5 * k, 322], [CL.vx + 3 * k, 300], [CL.vx + 6 * k, 250], [CL.vx + 9 * k, 200], [CL.vx + 13 * k, 150], [CL.vx + 18 * k, 100], [CL.vx + 24 * k, 74], [CL.vx + 36 * k, 58], [CL.vx + 42 * k, 64]]);
  });
  var OUTC = (function () { var r = rng(51), out = []; OUT.forEach(function (P, pi) { var n = 9; for (var i = 0; i < n; i++) out.push({ p: pi, s0: (i + [0, .45, .2][pi] + .2 * r()) / n, face: r() < .5, spin: r() * 360, plt: i % 4 === 2 }); }); return out; })();
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
  /* platelets that stick at the wound: from the blood to the edges of the gap and the cut, then to each other */
  var STICK = (function () {
    var tg = [[321, 311], [300, 311], [319, 300], [302, 300], [317, 290], [305, 289], [323, 278], [299, 280], [311, 305], [312, 296], [314, 284], [308, 276]];
    var from = [[364, 350], [258, 372], [352, 392], [284, 344], [378, 372], [236, 392], [336, 334], [262, 352], [322, 370], [340, 360], [300, 364], [278, 330]];
    return tg.map(function (p, i) { return { tx: p[0], ty: p[1], fx: from[i][0], fy: from[i][1], t0: 8.4 + .42 * i }; });
  })();
  /* fibrin threads: each grows across the wound; two dissolved fibrinogen molecules join it on the way */
  var THREADS = (function () {
    var r = rng(91), out = [];
    var spec = [[320, 214, 12, -28], [300, 262, 10, 20], [312, 170, 16, 18], [306, 124, 22, -16], [316, 300, 8, 8], [296, 92, 30, 10], [322, 70, 34, -8],
                [304, 232, 12, 30], [318, 150, 16, -26], [300, 190, 14, -10], [326, 110, 24, 22], [290, 60, 40, -6], [308, 280, 9, -22], [314, 84, 28, 26]];
    spec.forEach(function (s, i) {
      var ang = s[3] * Math.PI / 180, hw = 44 + s[2] * .8, dx = Math.cos(ang) * hw, dy = Math.sin(ang) * hw;
      out.push({ x0: s[0] - dx, y0: s[1] - dy, x1: s[0] + dx, y1: s[1] + dy, cx: s[0] + (r() - .5) * 10, cy: s[1] + (r() - .5) * 10, mx: s[0], my: s[1],
                 g0: i < 7 ? 18.6 + i * .8 : 27.3 + (i - 7) * .55, dur: i < 7 ? 3.4 : 2.6 });
    });
    return out;
  })();
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
    var gStick = q('.cl__stick'), gFib = q('.cl__fib'), clotP = q('.cl__clot'), gHeal = q('.cl__heal'), gScab = q('.cl__scab'), gBugs = q('.cl__bugs'), wclip = q('.cl__wclip');
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
      if (o > .01) {
        wall.setAttribute('d', ringPath(CL.vi, CL.vo, gb, ga + 2 * Math.PI));
        endo.setAttribute('d', ringPath(CL.vi, CL.vi + 2.4, gb, ga + 2 * Math.PI));
      } else {
        wall.setAttribute('d', annulus(CL.vi, CL.vo)); endo.setAttribute('d', annulus(CL.vi, CL.vi + 2.4));
      }
      var wn = '';
      for (i = 0; i < 16; i++) { var a = -Math.PI / 2 + (i + .5) * Math.PI / 8; if (o > .01 && a > ga - .06 && a < gb + .06) continue; var nx = CL.vx + Math.cos(a) * (CL.vi + 5.5), ny = CL.vy + Math.sin(a) * (CL.vi + 5.5); wn += '<ellipse cx="' + n1(nx) + '" cy="' + n1(ny) + '" rx="4.6" ry="1.6" transform="rotate(' + n1(a * 57.3 + 90) + ' ' + n1(nx) + ' ' + n1(ny) + ')"/>'; }
      wnuc.innerHTML = wn;

      /* the wound: open air above the blood, blood below it and in the drop */
      var Lp = cutPts(o, 0), Rp = cutPts(o, 1);
      function edgePoly(ytop) {
        var left = [], right = [];
        for (var k = 0; k < Lp.length; k++) { if (Lp[k][1] >= ytop) left.push(Lp[k]); }
        for (k = 0; k < Rp.length; k++) { if (Rp[k][1] >= ytop) right.push(Rp[k]); }
        left.unshift([edgeX(o, 0, ytop), ytop]); right.unshift([edgeX(o, 1, ytop), ytop]);
        var d = 'M' + left.map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L');
        d += ' L' + n1(CL.vx + (Rp[Rp.length - 1][0] - CL.vx)) + ' ' + (CL.vy - CL.vi + 6) + ' L' + n1(Lp[Lp.length - 1][0]) + ' ' + (CL.vy - CL.vi + 6);
        return d + ' L' + right.reverse().map(function (p) { return n1(p[0]) + ' ' + n1(p[1]); }).join(' L') + 'Z';
      }
      if (o > .01) {
        air.setAttribute('d', edgePoly(CL.ys - 10));
        var gone = t >= 51.8, dB = F < CL.vy - CL.vi - 1 ? edgePoly(gone ? CL.ys + 14 : Math.max(CL.ys - 10, F)) : '';
        if (hD > .3 && !gone) { var dd = 'M' + (CL.vx + 52) + ' ' + (CL.ys + 2); for (var xx = CL.vx + 52; xx >= CL.vx - 52; xx -= 4) dd += ' L' + xx + ' ' + n1(domeY(xx, hD)); dB += dd + ' L' + (CL.vx - 52) + ' ' + (CL.ys + 2) + 'Z'; }
        blood.setAttribute('d', dB);
        wclip.setAttribute('d', dB || 'M0 0Z');
      } else { air.setAttribute('d', ''); blood.setAttribute('d', ''); wclip.setAttribute('d', 'M0 0Z'); }

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
      var ou = '';
      if (o > .01) OUTC.forEach(function (c) {
        var P = OUT[c.p], sN = (c.s0 + V * 40 / P.total) % 1, pos = atP(P, sN * P.total);
        if (pos[1] < F - 4 && !(pos[1] < CL.ys && hD > 2)) return;
        if (pos[1] < CL.ys && pos[1] < domeY(pos[0], hD) + 6) return;
        if (t >= 51.8 && pos[1] < CL.ys + 16) return;
        var op = Math.min(1, sN * P.total / 20, (1 - sN) * P.total / 12);
        if (op < .05) return;
        ou += c.plt ? platelet(pos[0], pos[1], 0, ' opacity="' + n1(op) + '"') : rbc(pos[0], pos[1], c.spin + sN * 220, c.face, ' opacity="' + n1(op) + '"');
      });
      gOut.innerHTML = ou;

      /* platelets stick to the damaged wall and to each other, and release chemicals */
      var st = '';
      STICK.forEach(function (p, k) {
        var m = ease(seg(t, p.t0, p.t0 + 1.8)), act = ease(seg(t, p.t0 + 1.5, p.t0 + 2.4));
        var x = lerp(p.fx, p.tx, m), y = lerp(p.fy, p.ty, m);
        if (m < .01) { x += .6 * Math.sin(t + p.fx); y += .6 * Math.cos(t + p.fy); }
        st += platelet(x, y, act);
        if (act > .5 && t < 27) for (var j = 0; j < 3; j++) {
          var age = ((t - p.t0 - 2.4 + j * .6) % 1.8 + 1.8) % 1.8, aa = k * 1.3 + j * 2.1, rr = 4 + age * 7, op = (1 - age / 1.8) * (1 - seg(t, 24, 27));
          st += '<circle class="cl__chem" cx="' + n1(x + Math.cos(aa) * rr) + '" cy="' + n1(y + Math.sin(aa) * rr) + '" r="1.3" opacity="' + n1(op) + '"/>';
        }
      });
      gStick.innerHTML = o > .01 ? st : '';

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

      /* the clot: the mesh with what it has trapped */
      var ck = ease(seg(t, 28.5, 33));
      clotP.setAttribute('d', ck > .01 ? blood.getAttribute('d') : '');
      clotP.setAttribute('opacity', n1(ck * .3));

      /* healing: new skin under the scab, the vessel wall closes, the tissue below repairs */
      var hl = '';
      if (t > 44.5) {
        var gk = ease(seg(t, 45, 51)), dk = ease(seg(t, 46, 51.5));
        var yT = CL.ys + 16;
        hl += '<path class="cl__rep" opacity="' + n1(dk) + '" d="' + edgePoly(yBas(CL.vx) - 4).replace(/Z$/, 'Z') + '"/>';
        /* the wall grows back from both sides of the gap */
        if (heal > .01) {
          var e1 = ga + (mid - ga) * heal, e2 = gb - (gb - mid) * heal;
          hl += '<path class="cl__wallfix" d="' + ringPath(CL.vi, CL.vo, ga - .01, e1) + ringPath(CL.vi, CL.vo, e2, gb + .01) + '"/>' +
                '<path class="cl__endo" d="' + ringPath(CL.vi, CL.vi + 2.4, ga - .01, e1) + ringPath(CL.vi, CL.vi + 2.4, e2, gb + .01) + '"/>';
        }
        /* the new skin fills the gap from both sides: first its tissue, then its cells */
        var fL = lerp(262, CL.vx + 2, gk), fR = lerp(360, CL.vx - 2, gk);
        var nc = '<rect class="cl__newbg" x="250" y="' + (yT - 2) + '" width="' + n1(fL - 250) + '" height="' + n1(yBas(CL.vx) + 14 - yT) + '"/>' +
                 '<rect class="cl__newbg" x="' + n1(fR) + '" y="' + (yT - 2) + '" width="' + n1(372 - fR) + '" height="' + n1(yBas(CL.vx) + 14 - yT) + '"/>';
        for (var row = 0; row < 6; row++) {
          var ty = yT + row * 19, w = 24;
          for (var cx = 270 + (row % 2) * 12; cx < 352; cx += w) {
            var half = cx + w / 2 < CL.vx ? 0 : 1, front = half ? lerp(360, CL.vx - 2, gk) : lerp(262, CL.vx + 2, gk);
            var show = half ? cx >= front - 4 : cx + w <= front + 4;
            if (!show) continue;
            var base = yBas(cx + w / 2) - 2, hh = Math.min(17, base - ty - 1);
            if (hh < 8) continue;
            nc += '<rect x="' + n1(cx + 1) + '" y="' + n1(ty) + '" width="' + (w - 2) + '" height="' + n1(hh) + '" rx="5"/><ellipse class="cl__nn" cx="' + n1(cx + w / 2) + '" cy="' + n1(ty + hh / 2) + '" rx="3.8" ry="2.9"/>';
          }
        }
        hl += '<g class="cl__new" clip-path="url(#' + u + 'wd)">' + nc + '</g>';
        /* once the scab is off, the new skin makes its own outer layer, level with the rest */
        var sf = ease(seg(t, 52.4, 54.6));
        if (sf > .01) {
          var yA2 = CL.ys + 15 - 14 * sf, pL = [], pR = [];
          for (var yy = yA2; yy <= CL.ys + 16; yy += 2) { pL.push(n1(edgeX(o, 0, yy) - .5) + ' ' + n1(yy)); pR.unshift(n1(edgeX(o, 1, yy) + .5) + ' ' + n1(yy)); }
          hl += '<path class="cl__newtop" d="M' + pL.join(' L') + ' L' + pR.join(' L') + 'Z"/>';
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
      add('wall', 'blood vessel wall', CL.vx - CL.vi - CL.vw / 2, CL.vy, 'L');
      add('rbc', 'red blood cell', LUM.cells[0][0], LUM.cells[0][1], 'L');
      add('wbc', 'white blood cell', 286, 462, 'L');
      var p0 = STICK[0], pm = ease(seg(t, p0.t0, p0.t0 + 1.8));
      if (t < 50) add('plt', 'platelet', lerp(p0.fx, p0.tx, pm), lerp(p0.fy, p0.ty, pm), 'R', 1 - seg(t, 46.5, 49));
      add('fgn', 'fibrinogen (soluble)', LUM.rods[0][0], LUM.rods[0][1], 'R');
      var th0 = THREADS[0]; if (t > th0.g0 + th0.dur * .55 && t < 50) add('fib', 'fibrin (insoluble threads)', th0.mx, th0.my, 'R', Math.min(clamp01((t - th0.g0 - th0.dur * .55) / .6), 1 - seg(t, 46.5, 49)));
      if (ck > .3 && t < 50) add('clot', 'clot', 306, 262, 'R', Math.min(clamp01((ck - .3) * 3), 1 - seg(t, 47, 49.5)));
      if (sk > .3 && fall < .2) add('scab', 'scab', 296, 62, 'L', Math.min(clamp01((sk - .3) * 3), 1 - seg(fall, 0, .2)));
      if (t > 47.5) add('new', 'new skin', 318, 142, 'R', clamp01((t - 47.5) / .8));
      gLab.innerHTML = drawLabels(lay, items, { plt: 1.4, fgn: 1.2, bug: 1.2 });

      var when = t < 8 ? 'in seconds' : t < 18 ? 'within a minute' : t < 36 ? 'a few minutes' : t < 44 ? 'hours later' : 'days later';
      var bl = t < 1.1 ? ['none yet', 'plain'] : t < 8 ? ['blood flows out', 'bad'] : t < 31 ? ['slowing', 'warn'] : ['stopped', 'ok'];
      S.pill('when', when, 'plain'); S.pill('bleed', bl[0], bl[1]);
    }

    var R = [0, 9, 21, 30, 40, 48, 59], M = [0, 8, 18, 27, 36, 44, CL_END], clock = readerClock(R, M);
    var sp = L.stepper({ steps: readerSteps(CL_STEPS, R), end: R[R.length - 1], render: function (t) { render(clock(t)); } });
    return mount(S, sp, 'cl', [
      ['The blood vessel is cut across, so you see its wall as a ring; blood flows along it, towards you. The cells are drawn to one scale: a red blood cell is about 7.5 µm across, a platelet about 2–3 µm, a white blood cell about 12 µm. Fibrinogen molecules are drawn hundreds of times larger than real, as short rods. Time is squeezed: the bleeding stops within minutes, the scab dries over hours, and new skin takes days.'],
      ['<b>Not asked in 0610.</b> The conversion of fibrinogen into fibrin is done by an enzyme, thrombin, which is made at the wound by a chain of reactions.', 'cl__fence']
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
