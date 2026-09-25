/* ============================================================
   w-monitor.js — four widgets for the Circulation Lab (Cambridge IGCSE Biology 0610, Topic 9).

     oneway   station 1 "A pump, pipes and valves" (id system)       A pump with and without valves
     circuit  station 2 "Single and double circulation" (id double)  Follow one red blood cell
     pulse    station 5 "Monitoring the heart" (id monitor)          Count a pulse
     ecg      station 5 "Monitoring the heart" (id monitor)          Read an ECG

   Built the way js/w-heart.js is: each is a div.widget that starts with L.head(); drawings sit on
   the cycle widget's dark panel (#0D1A22) or, for the ECG, on real ECG paper; every label sits in
   a margin at its own part's height on a leader ruled level (CircLearn.labels); a ResizeObserver
   raises the lettering when the drawing is shown small, so no label is under ~12.5 px on screen;
   box.__seek(t) draws any moment for the headless harness and box.__onReset() stops what runs.
   Styles: css/w-monitor.css (ow__, ci__, pu__, ec__). Colours: the lab's inks, red = oxygenated,
   blue = deoxygenated (HeartArt.COL).

   ------------------------------------------------------------------ oneway
   Teaches: why a pump needs valves (syllabus 9.1.1: "a system of blood vessels with a pump and
   valves to ensure one-way flow of blood"). A closed loop of tube, a muscular chamber in it and a
   flap valve on each side. Press Squeeze: the chamber contracts, then relaxes by itself. With
   valves the rising pressure pushes the inlet valve shut and the outlet valve open, so blood
   leaves forwards only; as the chamber relaxes, blood falling back pushes the outlet valve shut,
   the inlet valve opens and the chamber refills from behind. Each squeeze moves every drop of
   blood one tenth of the way round. Without valves blood leaves by both ends and returns by both
   ends: it only moves back and forth. A marked cell and a results table show both cases.
   Drive: "Squeeze", and "With valves / Without valves". __seek(t): t >= 0 is t squeezes done
   with valves (t = 2.25 is half-way through the third squeeze; x.5 is the end of a squeeze);
   t < 0 is the same without valves.
   Physics: the blood is treated as incompressible. A closed loop can only take a squeeze if part
   of it can stretch, so the tube just before the inlet valve is soft: it holds the blood that
   arrives while the inlet valve is shut, as the atria fill while the ventricles contract.
   Sources: Guyton & Hall, Textbook of Medical Physiology, 14th ed. (2021), ch. 9 ("The valves
   close and open passively ... when a backward pressure gradient pushes blood backward, and they
   open when a forward pressure gradient forces blood in the forward direction"); valves in veins:
   Tortora & Derrickson, Principles of Anatomy and Physiology, 16th ed., ch. 21; atria filling
   during ventricular contraction: Guyton & Hall ch. 9 (the atrial "v" wave). The station's words:
   stations.master.js, station system, exam items 3-4.

   ------------------------------------------------------------------ circuit
   Teaches: single circulation in a fish and double circulation in a mammal (syllabus S 9.1.2 to
   S 9.1.4). One red blood cell goes round one complete circuit, one stage per step of the lab's
   step player. A qualitative pressure gauge follows it, a counter shows the passes through the
   heart, and the cell is blue or red for deoxygenated or oxygenated blood. Both atria contract
   together and then both ventricles, on each side at once (syllabus S 9.2.10).
   Drive: choose Fish or Mammal, then Play / Next step. spec.animal = 'fish' (the default) | 'mammal'.
   Sources: route and passes, syllabus S 9.1.2-9.1.3 and mark schemes 0610/42/O/N/22 Q6(a)(iii),
   0610/42/M/J/16 Q1(b)(i), 0610/42/O/N/23 Q5(a) ("blood is under less pressure" after the gills);
   pressures (shape only, no numbers shown): Guyton & Hall ch. 14, Fig. 14-2 (aorta about 100 mmHg
   mean, systemic capillaries 35 falling to 10 mmHg, right atrium about 0; pulmonary artery about
   16 mmHg mean, pulmonary capillaries about 7 mmHg) and Campbell Biology, 12th ed., Concept 42.1
   (in a fish the blood pressure drops substantially as blood passes through the gill
   capillaries, which limits the rate of flow to the rest of the body). The fish gauge falls by
   about two-fifths in the gills. Values reported for teleost fish (seen second-hand in a literature
   search, not checked against the papers): gill resistance about a quarter of total peripheral
   resistance; Atlantic cod about 4.4 kPa before the gills and 2.5 kPa after. So the station and
   the widget both say "much" of its pressure, not "most". Each gauge
   compares pressures inside one animal, and shows no numbers.

   ------------------------------------------------------------------ pulse
   Teaches: taking a pulse rate (syllabus 9.2.3; station 5's steps): two fingertips on the radial
   artery, count the beats for 15 s, multiply by 4. A plain counting practice: the reader watches
   the artery, presses Start, presses Beat (or the space bar) for every beat, and the page shows
   "N beats in 15 s, N x 4 = ... bpm", the true rate and the difference. Resting rates only.
   Drive: Start, Beat, Count another pulse. spec.rate fixes the rate; spec.count fixes the count
   shown by __seek. __seek(t) shows the count running at t seconds with every beat so far counted;
   t >= 15 shows the result.
   Anatomy: the radial artery runs from the middle of the forearm near the elbow towards the thumb
   side of the wrist, where it lies just under the skin over the radius, lateral to the tendon of
   flexor carpi radialis: Moore, Dalley & Agur, Clinically Oriented Anatomy, 8th ed., ch. 6.
   Fingertips, never the thumb (it has its own pulse): NHS, "How do I check my pulse?"; British
   Heart Foundation, "How to check your pulse". The hidden rate is chosen from 60-100 bpm (the
   station's resting range) and swings a few per cent with breathing, faster on breathing in
   (sinus arrhythmia: Guyton & Hall ch. 13). The pulse waveform (a steep rise, a slower fall with a
   small notch) is from Guyton & Hall ch. 15.

   ------------------------------------------------------------------ ecg
   Teaches: finding the heart rate from an ECG (syllabus 9.2.3; mark scheme 0610/42/F/M/21
   Q3(a)(i): time for one beat = squares x time per square; heart rate = 60 / time for one beat).
   Real ECG paper at 25 mm/s: 1 small square (1 mm) = 0.04 s, 1 large square (5 mm) = 0.2 s;
   10 mm = 1 mV. Three strips: R to R 0.80 s (75 bpm), 0.40 s (150 bpm), 1.20 s (50 bpm). The
   reader presses two tall spikes next to each other; the page measures the time between them;
   the reader types the rate and the page checks it (plus or minus 1 bpm), with the working and
   the golden rule from the March 2026 examiner report (multiplying the time by 60 gives an
   impossible answer). The wave names sit behind a toggle, as the station's extension text.
   Drive: choose a strip, press two spikes, type, Check. spec.strip = 0 | 1 | 2. __seek(t):
   0 plain, 1 one spike marked, 2 two spikes and the time, 3 a wrong answer (time x 60),
   4 the right answer, 5 the named waves shown as well.
   Shape of the trace (lead II, drawn to scale): P wave 0.08-0.09 s, PR interval 0.14-0.17 s,
   QRS 0.08 s, flat ST segment, T wave 0.14-0.20 s, QT = 0.40 x square root of R-R (Bazett, Heart
   7:353, 1920). Sources: Guyton & Hall ch. 11 (paper speed; dark lines 0.20 s apart; P-Q interval
   about 0.16 s; Q-T about 0.35 s); Hampton, The ECG Made Easy, 9th ed. (2019), ch. 1 (small
   square 0.04 s, large square 0.2 s, PR 0.12-0.2 s, QRS under 0.12 s).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L || !L.stepper || !L.labels) return;
  var h = L.h, esc = L.esc;
  var NS = 'http://www.w3.org/2000/svg';
  var C = {
    oxy: '#D63C3B', oxyHi: '#FF8A7E', deo: '#3B62B5', deoHi: '#8FB2FF', oxyLo: '#9E2426', deoLo: '#23417F',
    valve: '#F4E6D0', valveEdge: '#8C6E4E', glow: '#FFE58A', panel: '#0D1A22'
  };

  /* ---------------------------------------------------------------- helpers */
  function n2(v) { return Math.round(v * 100) / 100; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { k = clamp(k, 0, 1); return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  function smooth(k) { k = clamp(k, 0, 1); return k * k * (3 - 2 * k); }
  function lerp(a, b, k) { return a + (b - a) * k; }
  function rgb(c) { var v = parseInt(c.slice(1), 16); return [(v >> 16) & 255, (v >> 8) & 255, v & 255]; }
  function mix(c1, c2, k) {
    var a = rgb(c1), b = rgb(c2); k = clamp(k, 0, 1);
    return 'rgb(' + Math.round(lerp(a[0], b[0], k)) + ',' + Math.round(lerp(a[1], b[1], k)) + ',' + Math.round(lerp(a[2], b[2], k)) + ')';
  }
  function sv(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    if (attrs) for (var k in attrs) if (Object.prototype.hasOwnProperty.call(attrs, k)) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function button(cls, html) { var b = h('button', cls, html); b.type = 'button'; return b; }
  function words(s) { return String(s).replace(/[_~]/g, '').split(/\s+/).filter(Boolean).length; }
  function dist(a, b) { var dx = b[0] - a[0], dy = b[1] - a[1]; return Math.sqrt(dx * dx + dy * dy); }
  function pathD(pts, close) { var d = ''; for (var i = 0; i < pts.length; i++) d += (i ? 'L' : 'M') + n2(pts[i][0]) + ' ' + n2(pts[i][1]); return d + (close ? 'Z' : ''); }
  function arc(cx, cy, r, a0, a1, n) {
    var o = [];
    for (var i = 0; i <= n; i++) { var a = (a0 + (a1 - a0) * i / n) * Math.PI / 180; o.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
    return o;
  }
  /* a polyline measured along its length: at(s) a point, dir(s) the unit tangent */
  function track(pts, step) {
    step = step || 3;
    var P = [[pts[0][0], pts[0][1]]], S = [0];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = dist(a, b), n = Math.max(1, Math.ceil(d / step));
      for (var k = 1; k <= n; k++) { P.push([a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]); S.push(S[S.length - 1] + d / n); }
    }
    var total = S[S.length - 1];
    function at(s) {
      if (s <= 0) return P[0];
      if (s >= total) return P[P.length - 1];
      var lo = 0, hi = S.length - 1;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (S[m] < s) lo = m; else hi = m; }
      var u = (s - S[lo]) / ((S[hi] - S[lo]) || 1);
      return [P[lo][0] + (P[hi][0] - P[lo][0]) * u, P[lo][1] + (P[hi][1] - P[lo][1]) * u];
    }
    function dir(s) { var a = at(Math.max(0, s - 2)), b = at(Math.min(total, s + 2)), d = dist(a, b) || 1; return [(b[0] - a[0]) / d, (b[1] - a[1]) / d]; }
    /* the fraction of the length at which the polyline first passes within r of a point */
    function near(pt, r) { for (var i = 0; i < P.length; i++) if (dist(P[i], pt) <= r) return S[i] / total; return 1; }
    return { at: at, dir: dir, total: total, near: near };
  }
  /* the lettering of a drawing shown small is made larger in drawing units, so that on screen it
     never falls under about 12.5 px (the rule for phones); lo and hi keep it sensible */
  function fontFor(svg, vbW, lo, hi) { var w = svg.getBoundingClientRect().width; return w ? Math.round(clamp(12.5 / (w / vbW), lo, hi)) : 0; }
  function observe(el, fn) {
    if (!global.ResizeObserver) return null;
    var ro = new ResizeObserver(function () { if (!el.isConnected) { ro.disconnect(); return; } fn(); });
    ro.observe(el);
    return ro;
  }
  function still() { return L.still ? L.still() : false; }
  function raf(fn) { return global.requestAnimationFrame ? global.requestAnimationFrame(fn) : setTimeout(function () { fn(Date.now()); }, 16); }
  function unraf(id) { if (id == null) return; if (global.cancelAnimationFrame) global.cancelAnimationFrame(id); clearTimeout(id); }
  function nowS() { return (global.performance && performance.now ? performance.now() : Date.now()) / 1000; }
  var UID = 0;

  /* =====================================================================
     1 · ONEWAY — a pump with and without valves
     ===================================================================== */
  var OW = (function () {
    var W = 780, H = 560, X0 = 300, X1 = 700, Y0 = 70, Y1 = 500, R = 56, YOUT = 176, YIN = 404, YSOFT = 300;
    var pts = [], at = {};
    function add(list) { for (var i = 0; i < list.length; i++) pts.push(list[i]); }
    /* the centre line, in the direction blood is pumped: up through the chamber, round clockwise */
    add([[X0, YOUT], [X0, Y0 + R]]);
    add(arc(X0 + R, Y0 + R, R, 180, 270, 24).slice(1));
    add([[X1 - R, Y0]]);
    add(arc(X1 - R, Y0 + R, R, 270, 360, 24).slice(1)); at.rt = pts.length - 1;
    add([[X1, Y1 - R]]);
    add(arc(X1 - R, Y1 - R, R, 0, 90, 24).slice(1));
    add([[X0 + R, Y1]]);
    add(arc(X0 + R, Y1 - R, R, 90, 180, 24).slice(1));
    add([[X0, YIN]]); at.inl = pts.length - 1;
    add([[X0, YOUT]]);
    var cum = [0], i;
    for (i = 1; i < pts.length; i++) cum.push(cum[i - 1] + dist(pts[i - 1], pts[i]));
    var T = track(pts, 3);
    /* three parts: the ordinary tube (outlet valve round to sS), the soft tube (sS to the inlet
       valve) and the chamber (inlet valve to outlet valve) */
    var sS = cum[at.rt] + (YSOFT - (Y0 + R)), sIN = cum[at.inl], sTOT = cum[cum.length - 1];
    var HT = 18, WALL = 3, LC = sTOT - sIN, LS = sIN - sS, HW0 = 56, MW0 = 17, MW1 = 27, RAMP = 120;
    function bumpC(q) { var u = (q - .1) / .8; return u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * u), .8); }
    function bumpW(q) { var u = (q - .03) / .94; return u <= 0 || u >= 1 ? 0 : Math.pow(Math.sin(Math.PI * u), .55); }
    function bumpS(x) { return Math.min(smooth(x / RAMP), smooth((LS - x) / RAMP)); }
    var NC = 400, BC = [0], NSS = Math.ceil(LS / 2), BS = [0], DX = LS / NSS;
    for (i = 1; i <= NC; i++) BC.push(BC[i - 1] + bumpC((i - .5) / NC) / NC);
    for (i = 1; i <= NSS; i++) BS.push(BS[i - 1] + bumpS((i - .5) * DX) * DX);
    var BCI = BC[NC], BSI = BS[NSS];
    /* volumes in "tube lengths": one unit of ordinary tube holds 1 */
    var VT = sS, VS0 = LS, VC0 = LC * (1 + (HW0 - HT) * BCI / HT), V = VT + VS0 + VC0, SV = V / 10;

    function invC(g, HWc) {
      var k = (HWc - HT) / HT, target = g * (1 + k * BCI), lo = 0, hi = NC;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (m / NC + k * BC[m] < target) lo = m; else hi = m; }
      var f0 = lo / NC + k * BC[lo], f1 = hi / NC + k * BC[hi];
      return clamp((lo + (target - f0) / ((f1 - f0) || 1)) / NC, 0, 1);
    }
    function invS(f, dS) {
      var k = dS / HT, target = f * (LS + k * BSI), lo = 0, hi = NSS;
      while (hi - lo > 1) { var m = (lo + hi) >> 1; if (m * DX + k * BS[m] < target) lo = m; else hi = m; }
      var f0 = lo * DX + k * BS[lo], f1 = hi * DX + k * BS[hi];
      return clamp((lo + (target - f0) / ((f1 - f0) || 1)) * DX, 0, LS);
    }
    /* one beat: p runs 0-1 (squeeze) then 1-2 (relax). qo and qi are the blood that has passed the
       outlet and the inlet, forwards, since the start */
    function state(mode, n, p) {
      var qo, qi, oIn, oOut, a, b;
      if (mode === 'valves') {
        if (p < 1) {
          a = ease(seg(p, .14, .96)); qo = (n + a) * SV; qi = n * SV;
          oIn = 1 - smooth(seg(p, 0, .08));     /* the rising pressure pushes the inlet valve shut ... */
          oOut = smooth(seg(p, .1, .2));        /* ... and then pushes the outlet valve open */
        } else {
          b = ease(seg(p, 1.14, 1.96)); qo = (n + 1) * SV; qi = (n + b) * SV;
          oOut = 1 - smooth(seg(p, 1, 1.08));   /* blood falling back pushes the outlet valve shut */
          oIn = smooth(seg(p, 1.1, 1.2));       /* the inlet valve opens and the chamber refills */
        }
      } else {
        qo = p < 1 ? ease(seg(p, .06, .96)) * SV / 2 : (1 - ease(seg(p, 1.06, 1.96))) * SV / 2;
        qi = -qo; oIn = oOut = 1;
      }
      var dV = qo - qi, VC = VC0 - dV, sq = dV / SV;
      return { qo: qo, qi: qi, dV: dV, HW: HT + (VC / LC - 1) * HT / BCI, MW: lerp(MW0, MW1, sq), dS: dV * HT / BSI,
               oIn: oIn, oOut: oOut, sq: sq, glow: p < 1 ? smooth(seg(p, 0, .08)) : 1 - smooth(seg(p, 1, 1.12)) };
    }
    function widthAt(s, st) {
      if (s < sS) return [HT, WALL];
      if (s < sIN) return [HT + st.dS * bumpS(s - sS), WALL];
      var q = (s - sIN) / LC;
      return [HT + (st.HW - HT) * bumpC(q), WALL + (st.MW - WALL) * bumpW(q)];
    }
    function sOfU(u, st) {
      u = ((u % V) + V) % V;
      if (u < VT) return u;
      var vS = VS0 + st.dV;
      if (u < VT + vS) return sS + invS((u - VT) / vS, st.dS);
      return sIN + LC * invC((u - VT - vS) / (V - VT - vS), st.HW);
    }
    function point(s, off) { s = ((s % sTOT) + sTOT) % sTOT; var p = T.at(s), d = T.dir(s); return [p[0] + d[1] * off, p[1] - d[0] * off, d]; }
    return { W: W, H: H, X0: X0, YOUT: YOUT, YIN: YIN, sS: sS, sIN: sIN, sTOT: sTOT, HT: HT, LC: LC, V: V, SV: SV,
             state: state, widthAt: widthAt, sOfU: sOfU, point: point, T: T, bumpC: bumpC };
  })();

  var OW_ASK = 'Squeeze the pump and watch the blood. Then take the valves out and squeeze it again. Count how far the blood gets round the loop each time.';
  var OW_TEXT = {
    valves: [
      ['Squeeze', 'The muscle in the chamber wall contracts and the pressure inside rises. The pressure pushes the inlet valve shut and the outlet valve open. Blood can only leave forwards.'],
      ['Relax', 'The muscle relaxes and the pressure inside falls. Blood starts to flow back and pushes the outlet valve shut. The inlet valve opens, and blood from behind refills the chamber.']
    ],
    none: [
      ['Squeeze', 'The muscle contracts and the pressure inside rises. With no valves, blood leaves through both ends: some forwards and some backwards.'],
      ['Relax', 'The muscle relaxes and the pressure inside falls. Blood flows back in through both ends. It returns the way it came.']
    ]
  };
  var OW_START = 150;                        /* the marked cell starts here, on the top of the loop */

  function oneway(spec) {
    var G = OW;
    var box = h('div', 'widget ow');
    box.appendChild(L.head(spec.title || 'A pump with and without valves', spec.ask || OW_ASK, 'Press Squeeze'));

    /* controls */
    var bar = h('div', 'ow__bar');
    var go = button('ow__go', 'Squeeze');
    var modes = h('div', 'ow__seg'); modes.setAttribute('role', 'group'); modes.setAttribute('aria-label', 'Valves in the loop');
    var bV = button('ow__opt', 'With valves'), bN = button('ow__opt', 'Without valves');
    modes.appendChild(bV); modes.appendChild(bN);
    bar.appendChild(go); bar.appendChild(modes);
    box.appendChild(bar);

    /* the drawing */
    var wrap = h('div', 'ow__wrap');
    var fig = h('figure', 'ow__fig');
    fig.appendChild(h('div', 'ow__legend',
      '<span><svg viewBox="0 0 24 24" aria-hidden="true"><ellipse cx="12" cy="12" rx="5.5" ry="3.5" fill="#E0564E" stroke="#6E1A1E"/><circle cx="12" cy="12" r="9" fill="none" stroke="#FFE58A" stroke-width="2.4"/></svg>the marked red blood cell</span>' +
      '<span><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="12" y1="2" x2="12" y2="22" stroke="#FFE58A" stroke-width="3"/></svg>where it started</span>' +
      '<span><svg viewBox="0 0 24 24" aria-hidden="true"><line x1="2" y1="12" x2="22" y2="12" stroke="#FFE58A" stroke-width="4" stroke-linecap="round" opacity=".85"/></svg>how far it has gone</span>'));
    var svg = sv('svg', { viewBox: '0 0 ' + G.W + ' ' + G.H, 'class': 'ow__svg', role: 'img' });
    var u = 'ow' + (++UID);
    svg.innerHTML = '<defs>' +
      '<radialGradient id="' + u + 'm" gradientUnits="userSpaceOnUse" cx="' + G.X0 + '" cy="290" r="110"><stop offset="0" stop-color="#C9564C"/><stop offset=".6" stop-color="#9A3230"/><stop offset="1" stop-color="#6E1F22"/></radialGradient>' +
      '</defs>' +
      '<rect class="ow__bg" x="0" y="0" width="' + G.W + '" height="' + G.H + '" rx="18"/>' +
      '<g class="ow__progress"></g><path class="ow__wall" fill-rule="evenodd"/><path class="ow__lumen" fill-rule="evenodd"/>' +
      '<path class="ow__muscle" fill="url(#' + u + 'm)"/><path class="ow__tense"/>' +
      '<g class="ow__cells"></g><g class="ow__valves"></g><g class="ow__arrows"></g><path class="ow__start"/><g class="ow__mark"></g><g class="ow__labels"></g>';
    var q = function (c) { return svg.querySelector('.' + c); };
    var gProg = q('ow__progress'), pWall = q('ow__wall'), pLumen = q('ow__lumen'), pMus = q('ow__muscle'), pTense = q('ow__tense'),
        gCells = q('ow__cells'), gValves = q('ow__valves'), gArrows = q('ow__arrows'), pStart = q('ow__start'), gMark = q('ow__mark'), gLab = q('ow__labels');
    fig.appendChild(svg);
    wrap.appendChild(fig);

    /* beside it: the valves in words, the two stages, the results */
    var side = h('div', 'ow__side');
    var pills = h('div', 'ow__pills', '<span class="ow__pill" data-v="in"><b>Inlet valve</b> <i></i></span><span class="ow__pill" data-v="out"><b>Outlet valve</b> <i></i></span>');
    var phases = h('ol', 'ow__phases');
    var ph = [h('li', 'ow__ph'), h('li', 'ow__ph')];
    phases.appendChild(ph[0]); phases.appendChild(ph[1]);
    var table = h('table', 'ow__table');
    table.innerHTML = '<caption>How far the marked cell has gone round the loop</caption>' +
      '<thead><tr><th scope="col"></th><th scope="col">Squeezes</th><th scope="col">Distance round the loop</th></tr></thead>' +
      '<tbody><tr data-m="valves"><th scope="row">With valves</th><td></td><td></td></tr><tr data-m="none"><th scope="row">Without valves</th><td></td><td></td></tr></tbody>';
    var live = h('p', 'ow__live'); live.setAttribute('aria-live', 'polite');
    side.appendChild(pills); side.appendChild(phases); side.appendChild(table); side.appendChild(live);
    wrap.appendChild(side);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note',
      'The chamber works like a ventricle of the heart. The inlet valve is like an atrioventricular valve and the outlet valve is like a semilunar valve. ' +
      'Veins have valves too, and they work in the same way. In this model the lower part of the tube, before the inlet valve, is soft: it stretches to hold the blood that arrives while that valve is shut. ' +
      'One squeeze moves the blood one tenth of the way round. With each beat, each ventricle of your heart pumps about one seventieth of your blood. So a red blood cell takes about a minute to go all the way round.'));

    /* the state of each case, kept apart: how many squeezes, and where a squeeze has got to */
    var mode = 'valves', rec = { valves: 0, none: 0 }, tried = { valves: false, none: false };
    var p = 0, running = false, rafId = null, t0 = 0, holdTimer = null, fontPx = 17;
    var SQ = 1.3, RX = 1.5;                   /* seconds: the squeeze, then the relaxation */

    /* the cells: evenly spaced by volume, each with its own place across the tube */
    var NCELL = 64, cells = [];
    for (var k = 0; k < NCELL; k++) {
      var e = sv('ellipse', { rx: 5.6, ry: 3.6, 'class': 'ow__cell' + (k ? '' : ' is-marked') }, gCells);
      cells.push({ el: e, lam: OW_START + k * G.V / NCELL, j: k ? ((k * 0.618034) % 1) * 1.5 - .75 : 0 });
    }
    var ring = sv('circle', { r: 11, 'class': 'ow__ring' }, gMark);

    function cusps(yb, o) {
      var d = '';
      [-1, 1].forEach(function (sd) {
        var ax = G.X0 + sd * G.HT, fx = lerp(G.X0 + sd * .8, G.X0 + sd * (G.HT - 4.5), o), fy = lerp(yb - 20, yb - 28, o);
        var cx = lerp(G.X0 + sd * 7.5, G.X0 + sd * (G.HT - 1), o), cy = lerp(yb - 3.5, yb - 14, o);
        d += 'M' + n2(ax) + ' ' + yb + 'Q' + n2(cx) + ' ' + n2(cy) + ' ' + n2(fx) + ' ' + n2(fy);
      });
      return d;
    }
    function chev(y, up, op) {
      if (op <= .02) return '';
      var s = up ? -1 : 1, x = G.X0;
      return '<path class="ow__arrow" opacity="' + n2(op) + '" d="M' + x + ' ' + (y + 8 * s) + 'L' + (x - 9.5) + ' ' + (y - 6 * s) + 'L' + x + ' ' + (y - 1.5 * s) + 'L' + (x + 9.5) + ' ' + (y - 6 * s) + 'Z"/>';
    }
    function env(pp, a, b) { var k = seg(pp, a, b); return k <= 0 || k >= 1 ? 0 : Math.pow(Math.sin(Math.PI * k), .6); }

    function render(n, pp) {
      var st = G.state(mode, n, pp), i, s;
      /* the tube and the chamber: four offset rings round the centre line */
      var A = [], B = [], Cc = [], D = [], N = Math.ceil(G.sTOT / 4);
      for (i = 0; i < N; i++) {
        s = i * G.sTOT / N;
        var w = G.widthAt(s, st), pa = G.point(s, w[0] + w[1]), pb = G.point(s, w[0]), pc = G.point(s, -w[0]), pd = G.point(s, -w[0] - w[1]);
        A.push(pa); B.push(pb); Cc.push(pc); D.push(pd);
      }
      pWall.setAttribute('d', pathD(A, true) + pathD(D, true));
      pLumen.setAttribute('d', pathD(B, true) + pathD(Cc, true));
      /* the chamber's two muscular walls, drawn again in muscle */
      var lo = [], li = [], ro = [], ri = [];
      for (s = G.sIN; s <= G.sTOT + .01; s += 3) {
        var ww = G.widthAt(Math.min(s, G.sTOT - .01), st);
        lo.push(G.point(s, ww[0] + ww[1])); li.push(G.point(s, ww[0])); ro.push(G.point(s, -ww[0] - ww[1])); ri.push(G.point(s, -ww[0]));
      }
      pMus.setAttribute('d', pathD(lo.concat(li.slice().reverse()), true) + pathD(ro.concat(ri.slice().reverse()), true));
      pTense.setAttribute('d', pathD(lo) + pathD(ro));
      pTense.setAttribute('stroke-opacity', n2(st.glow));
      /* the cells */
      for (i = 0; i < cells.length; i++) {
        var c = cells[i], sc = G.sOfU(c.lam + st.qo, st), wc = G.widthAt(sc, st), pt = G.point(sc, c.j * Math.max(0, wc[0] - 6.5));
        c.el.setAttribute('transform', 'translate(' + n2(pt[0]) + ',' + n2(pt[1]) + ') rotate(' + n2(Math.atan2(pt[2][1], pt[2][0]) * 180 / Math.PI) + ')');
        if (!i) { ring.setAttribute('cx', n2(pt[0])); ring.setAttribute('cy', n2(pt[1])); c.s = sc; }
      }
      /* the valves: real flaps, pushed open by blood flowing forwards and shut by blood flowing back */
      gValves.innerHTML = mode === 'valves'
        ? '<path class="ow__cuspe" d="' + cusps(G.YOUT, st.oOut) + cusps(G.YIN, st.oIn) + '"/><path class="ow__cusp" d="' + cusps(G.YOUT, st.oOut) + cusps(G.YIN, st.oIn) + '"/>'
        : '';
      /* where blood is moving through each end of the chamber, and which way */
      var ar = '';
      if (mode === 'valves') {
        ar += chev(G.YOUT - 40, true, env(pp, .14, .96)) + chev(G.YOUT - 40, false, pp > 1.004 && pp < 1.1 ? .9 * (1 - seg(pp, 1.03, 1.1)) : 0);
        ar += chev(G.YIN - 46, true, env(pp, 1.14, 1.96)) + chev(G.YIN - 46, false, pp > 0 && pp < .1 ? .9 * (1 - seg(pp, .04, .1)) : 0);
      } else {
        ar += chev(G.YOUT - 40, true, env(pp, .06, .96)) + chev(G.YIN + 34, false, env(pp, .06, .96));
        ar += chev(G.YOUT - 40, false, env(pp, 1.06, 1.96)) + chev(G.YIN + 34, true, env(pp, 1.06, 1.96));
      }
      gArrows.innerHTML = ar;
      /* where the marked cell started, and how far it has gone (drawn inside the loop) */
      var w0 = G.widthAt(OW_START, st), a0 = G.point(OW_START, w0[0] + w0[1] + 7), b0 = G.point(OW_START, -w0[0] - w0[1] - 7);
      pStart.setAttribute('d', 'M' + n2(a0[0]) + ' ' + n2(a0[1]) + 'L' + n2(b0[0]) + ' ' + n2(b0[1]));
      var prog = '', laps = Math.floor(st.qo / G.V + 1e-6), sm = cells[0].s, span = ((sm - OW_START) % G.sTOT + G.sTOT) % G.sTOT;
      function band(from, len, cls) {
        var pts = [];
        for (var x = 0; x <= len + .01; x += 4) { var ss = from + Math.min(x, len), wx = G.widthAt(((ss % G.sTOT) + G.sTOT) % G.sTOT, st); pts.push(G.point(ss, -wx[0] - wx[1] - 11)); }
        return pts.length > 1 ? '<path class="' + cls + '" d="' + pathD(pts) + '"/>' : '';
      }
      if (laps >= 1) prog += band(OW_START, G.sTOT - 1, 'ow__lap');
      if (st.qo > .5 && span > 2) prog += band(OW_START, span, 'ow__prog');
      gProg.innerHTML = prog;
      /* read-outs */
      var pv = pills.children;
      pill(pv[0], mode === 'valves' ? (st.oIn > .5 ? 'open' : 'shut') : 'none', 'Inlet');
      pill(pv[1], mode === 'valves' ? (st.oOut > .5 ? 'open' : 'shut') : 'none', 'Outlet');
      /* labels, ruled level into the left margin */
      var mid = G.widthAt(G.sIN + G.LC * .5, st);
      gLab.innerHTML = L.labels({ items: [
        { id: 'out', text: 'outlet valve', x: G.X0 - G.HT + 2.5, y: G.YOUT - 5, side: 'L', hidden: mode !== 'valves' },
        { id: 'pump', text: 'pump', x: G.X0 - mid[0] - mid[1] / 2, y: 290, side: 'L' },
        { id: 'in', text: 'inlet valve', x: G.X0 - G.HT + 2.5, y: G.YIN - 5, side: 'L', hidden: mode !== 'valves' }
      ], left: 214, right: 760, font: fontPx, width: 190, top: 10, bottom: G.H - 10, gap: 6 });
      return st;
    }
    function pill(el, v, name) {
      el.className = 'ow__pill' + (v === 'open' ? ' is-open' : v === 'shut' ? ' is-shut' : ' is-none');
      el.querySelector('b').textContent = v === 'none' ? name + ':' : name + ' valve';
      el.querySelector('i').textContent = v === 'none' ? 'no valve' : v;
    }
    function pct(qo) {
      var f = qo / G.V, laps = Math.floor(f + 1e-6), rest = Math.round((f - laps) * 100);
      if (rest === 100) { laps++; rest = 0; }
      if (!laps) return rest + ' % of one lap';
      return laps + (laps > 1 ? ' laps' : ' lap') + (rest ? ' and ' + rest + ' %' : ': all the way round');
    }
    function table_(qo) {
      ['valves', 'none'].forEach(function (m) {
        var tr = table.querySelector('tr[data-m="' + m + '"]'), td = tr.querySelectorAll('td');
        tr.classList.toggle('is-on', m === mode);
        var busy = m === mode && p > 0;
        td[0].textContent = tried[m] ? String(rec[m] + (busy ? 1 : 0)) : '0';
        if (m === mode && p > 0) td[1].textContent = m === 'none' && qo < .5 ? '0 %: back at the start' : pct(qo);
        else td[1].textContent = !tried[m] ? 'not tried yet' : m === 'none' ? '0 %: back at the start' : pct(rec[m] * G.SV);
      });
    }
    function words_() {
      var tx = OW_TEXT[mode];
      ph[0].innerHTML = '<b>1 · ' + tx[0][0] + '</b>' + esc(tx[0][1]);
      ph[1].innerHTML = '<b>2 · ' + tx[1][0] + '</b>' + esc(tx[1][1]);
      svg.setAttribute('aria-label', 'A model pump: a closed loop of tube full of blood, with a muscular chamber in it' +
        (mode === 'valves' ? ' and a flap valve at each end of the chamber' : ', and no valves') + '. One red blood cell is marked.');
    }
    function paint() {
      var n = mode === 'valves' ? rec.valves : 0;
      var st = render(n, p);
      ph[0].classList.toggle('is-on', p > 0 && p <= 1);
      ph[1].classList.toggle('is-on', p > 1);
      table_(st.qo);
    }
    function finish() {
      running = false; unraf(rafId); rafId = null; clearTimeout(holdTimer); holdTimer = null;
      rec[mode]++; p = 0;
      go.disabled = false; bV.disabled = bN.disabled = false;
      paint();
      live.textContent = (mode === 'valves' ? 'With valves, after ' : 'Without valves, after ') + rec[mode] + (rec[mode] > 1 ? ' squeezes' : ' squeeze') +
        (mode === 'valves' ? ', the marked cell has gone ' + pct(rec.valves * G.SV) + '.' : ', the marked cell is back at the start. The blood only moved back and forth.');
    }
    function frame() {
      if (!box.isConnected) { running = false; return; }
      var el = nowS() - t0;
      p = el < SQ ? el / SQ : Math.min(2, 1 + (el - SQ) / RX);
      paint();
      if (p >= 2) { finish(); return; }
      rafId = raf(frame);
    }
    function squeeze() {
      if (running) return;
      tried[mode] = true; running = true; go.disabled = true; bV.disabled = bN.disabled = true; live.textContent = '';
      if (still()) {
        p = 1; paint();                                  /* reduced motion: the squeezed state ... */
        holdTimer = setTimeout(function () { if (!box.isConnected) return; p = 1.999; paint(); finish(); }, 1600);   /* ... then the relaxed one */
        return;
      }
      t0 = nowS(); p = 0; rafId = raf(frame);
    }
    function setMode(m) {
      if (running) { finish(); }
      mode = m; p = 0;
      bV.setAttribute('aria-pressed', m === 'valves' ? 'true' : 'false');
      bN.setAttribute('aria-pressed', m === 'none' ? 'true' : 'false');
      words_(); paint(); live.textContent = '';
    }
    go.addEventListener('click', squeeze);
    bV.addEventListener('click', function () { if (mode !== 'valves') setMode('valves'); });
    bN.addEventListener('click', function () { if (mode !== 'none') setMode('none'); });

    function fit() {
      var ww = wrap.getBoundingClientRect().width;
      wrap.classList.toggle('ow--stack', ww < 900);
      wrap.classList.toggle('ow--narrow', ww < 540);
      var f = fontFor(svg, G.W, 16, 34);           /* measured after the layout has changed */
      if (f && f !== fontPx) { fontPx = f; paint(); }
    }
    var ro = observe(wrap, fit);
    if (ro) ro.observe(svg);
    box.__onReset = function () { running = false; unraf(rafId); clearTimeout(holdTimer); if (ro) ro.disconnect(); };
    /* t >= 0: t squeezes with valves; t < 0: |t| squeezes without. x.5 = the end of a squeeze. */
    box.__seek = function (t) {
      running = false; unraf(rafId); clearTimeout(holdTimer); go.disabled = bV.disabled = bN.disabled = false;
      var m = t < 0 ? 'none' : 'valves', a = Math.abs(t), n = Math.floor(a + 1e-9), f = a - n;
      mode = m; tried[m] = t !== 0; rec[m] = n;
      bV.setAttribute('aria-pressed', m === 'valves' ? 'true' : 'false'); bN.setAttribute('aria-pressed', m === 'none' ? 'true' : 'false');
      words_();
      p = f > 1e-6 ? f * 2 : 0; paint();
      return [0, .25, .5, .75, 1];
    };
    bV.setAttribute('aria-pressed', 'true'); bN.setAttribute('aria-pressed', 'false');
    words_(); paint();
    return box;
  }

  /* =====================================================================
     2 · CIRCUIT — follow one red blood cell
     ===================================================================== */
  var CI_ASK = 'Choose the fish or the mammal and follow one red blood cell round one complete circuit. Watch the pressure gauge, and count how many times the cell passes through the heart.';
  var CI_W = 720, CI_H = 640;

  /* the route, stage by stage. kind: atria | vent | cap | vessel. P0/P1 (and Pk, the pressure the
     ventricle reaches) are points on a gauge from low (0) to high (1); O0/O1 the oxygen, 0 to 1 */
  var CI = {
    fish: {
      label: 'A circuit diagram of the single circulation of a fish. The heart, with one atrium and one ventricle, pumps blood to the capillaries of the gills, then on to the capillaries of the body, and back to the heart.',
      steps: [
        { kind: 'atria', h: 'The atrium contracts', p: 'The cell starts in the _atrium_, in deoxygenated blood. The atrium contracts and pushes the blood into the _ventricle_. The pressure is still low.',
          path: [[262, 406], [262, 372], [262, 322]], P0: .05, P1: .07, O0: 0, O1: 0 },
        { kind: 'vent', h: 'The ventricle contracts', p: 'The ventricle contracts and pumps the blood to the _gills_. The pressure is high as the blood leaves the ventricle. The cell has now passed through the heart once.',
          path: [[262, 322], [262, 268], [262, 104], [264, 96], [269, 91], [277, 89]], exit: [262, 276], P0: .07, Pk: .92, P1: .88, O0: 0, O1: 0 },
        { kind: 'cap', h: 'Through the gill capillaries', p: 'In the gills, the cell squeezes through a narrow capillary. Oxygen diffuses from the water into the blood, so the blood becomes oxygenated. The blood loses much of its pressure in these narrow vessels.',
          path: [[277, 89], [469, 89]], P0: .88, P1: .5, O0: 0, O1: 1, load: true },
        { kind: 'vessel', h: 'On to the body', p: 'The blood flows from the gills to the body. No pump raises its pressure again. So it travels to the body at low pressure, and it flows slowly.',
          path: [[469, 89], [477, 91], [482, 96], [484, 104], [484, 560], [482, 568], [477, 573], [469, 575]], P0: .5, P1: .43, O0: 1, O1: 1 },
        { kind: 'cap', h: 'Through the body capillaries', p: 'In the body, the cell squeezes through another capillary. Oxygen diffuses out of the blood into the respiring cells. The blood is now deoxygenated, and its pressure falls again.',
          path: [[469, 575], [277, 575]], P0: .43, P1: .1, O0: 1, O1: 0 },
        { kind: 'vessel', h: 'Back to the heart', p: 'The blood returns to the atrium in a vein, at very low pressure. That is one complete circuit of the body, and the cell has passed through the heart once. This is a _single circulation_.',
          path: [[277, 575], [269, 573], [264, 568], [262, 560], [262, 446], [262, 406]], P0: .1, P1: .04, O0: 0, O1: 0 }
      ],
      labels: [
        { id: 'gills', text: 'gills', x: 287, y: 60, side: 'L' },
        { id: 'heart', text: 'heart', x: 226, y: 296, side: 'L' },
        { id: 'ventricle', text: 'ventricle', x: 247, y: 334, side: 'L' },
        { id: 'atrium', text: 'atrium', x: 250, y: 414, side: 'L' },
        { id: 'body', text: 'body', x: 466, y: 602, side: 'R' }
      ]
    },
    mammal: {
      label: 'A circuit diagram of the double circulation of a mammal. The right side of the heart pumps blood through the pulmonary artery to the lungs; it returns in the pulmonary vein to the left side, which pumps it through the aorta to the body; it returns in the vena cava to the right side.',
      steps: [
        { kind: 'atria', h: 'The atria contract', p: 'The cell starts in the _right atrium_, in deoxygenated blood. Both atria contract. The right atrium pushes the blood into the _right ventricle_. The pressure is low.',
          path: [[302, 290], [306, 322], [312, 366]], P0: .04, P1: .06, O0: 0, O1: 0 },
        { kind: 'vent', h: 'The ventricles contract', p: 'Both ventricles contract. The right ventricle pumps the blood into the _pulmonary artery_, to the lungs. Its muscular wall is thinner than the left ventricle’s, so the pressure rises less. The cell has passed through the heart once.',
          path: [[312, 366], [332, 346], [343, 330], [343, 222], [340, 211], [333, 203], [322, 200], [284, 200], [273, 197], [265, 189], [262, 178], [262, 104], [264, 96], [269, 91], [277, 89]],
          exit: [343, 318], P0: .06, Pk: .34, P1: .3, O0: 0, O1: 0 },
        { kind: 'cap', h: 'Through the lung capillaries', p: 'In the lungs, the cell squeezes through a narrow capillary. Oxygen diffuses from the air in the alveoli into the blood. The blood becomes oxygenated, and its pressure falls.',
          path: [[277, 89], [469, 89]], P0: .3, P1: .11, O0: 0, O1: 1, load: true },
        { kind: 'vessel', h: 'Back to the heart', p: 'The oxygenated blood returns to the heart in the _pulmonary vein_. It enters the _left atrium_ at low pressure. In a fish, this blood would go directly to the body.',
          path: [[469, 89], [477, 91], [482, 96], [484, 104], [484, 178], [481, 189], [473, 197], [462, 200], [437, 200], [426, 203], [418, 211], [415, 222], [415, 262], [412, 289]],
          P0: .11, P1: .07, O0: 1, O1: 1 },
        { kind: 'atria', h: 'The atria contract again', p: 'Both atria contract. The left atrium pushes the blood into the _left ventricle_. The _septum_ keeps this oxygenated blood apart from the deoxygenated blood on the right.',
          path: [[412, 289], [412, 322], [406, 364]], P0: .07, P1: .09, O0: 1, O1: 1 },
        { kind: 'vent', h: 'The ventricles contract again', p: 'Both ventricles contract. The left ventricle has the thickest muscular wall, so it pumps the blood into the _aorta_ at high pressure. The heart has raised the pressure a second time, and the cell has passed through the heart twice.',
          path: [[406, 364], [418, 382], [430, 393], [448, 398], [462, 400], [474, 401], [481, 406], [484, 416], [484, 560], [482, 568], [477, 573], [469, 575]],
          exit: [440, 396], P0: .09, Pk: .96, P1: .88, O0: 1, O1: 1 },
        { kind: 'cap', h: 'Through the body capillaries', p: 'The blood reaches the body at high pressure, so it flows fast. In a capillary, oxygen diffuses out of the blood into the respiring cells. The blood becomes deoxygenated, and its pressure falls.',
          path: [[469, 575], [277, 575]], P0: .88, P1: .18, O0: 1, O1: 0 },
        { kind: 'vessel', h: 'Back to the right atrium', p: 'The blood returns to the right atrium in the _vena cava_, at very low pressure. That is one complete circuit of the body, and the cell has passed through the heart twice. This is a _double circulation_.',
          path: [[277, 575], [262, 575], [216, 575], [209, 572], [206, 565], [206, 302], [209, 295], [216, 292], [276, 292], [302, 290]], P0: .18, P1: .04, O0: 0, O1: 0 }
      ],
      labels: [
        { id: 'lungs', text: 'lungs', x: 290, y: 52, side: 'L' },
        { id: 'pa', text: 'pulmonary artery', x: 262, y: 146, side: 'L' },
        { id: 'ra', text: 'right atrium', x: 296, y: 274, side: 'L' },
        { id: 'rv', text: 'right ventricle', x: 300, y: 372, side: 'L' },
        { id: 'vc', text: 'vena cava', x: 206, y: 470, side: 'L' },
        { id: 'pv', text: 'pulmonary vein', x: 484, y: 140, side: 'R' },
        { id: 'heart', text: 'heart', x: 455, y: 274, side: 'R' },
        { id: 'la', text: 'left atrium', x: 426, y: 302, side: 'R' },
        { id: 'lv', text: 'left ventricle', x: 414, y: 360, side: 'R' },
        { id: 'ao', text: 'aorta', x: 484, y: 470, side: 'R' },
        { id: 'body', text: 'body', x: 466, y: 602, side: 'R' }
      ]
    }
  };
  /* timing: at least one second of animation for every four words of the step's words */
  ['fish', 'mammal'].forEach(function (k) {
    var t = 0;
    CI[k].steps.forEach(function (st) {
      st.t = t; st.dur = Math.max(6, Math.ceil((words(st.h) + words(st.p)) / 4) + 1); t += st.dur;
      st.tr = track(st.path, 2);
      st.kx = st.exit ? st.tr.near(st.exit, 3) : 1;
    });
    CI[k].end = t;
  });

  /* the static drawing of each animal */
  function ciTube(d, col, hi, w) {
    return '<path d="' + d + '" fill="none" stroke="' + mix(col, '#000000', .45) + '" stroke-width="' + (w + 4) + '" stroke-linecap="round" stroke-linejoin="round"/>' +
           '<path d="' + d + '" fill="none" stroke="' + col + '" stroke-width="' + w + '" stroke-linecap="round" stroke-linejoin="round"/>' +
           '<path d="' + d + '" fill="none" stroke="' + hi + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" opacity=".45" transform="translate(-2,-2)"/>';
  }
  function ciArrow(x, y, ang, col) {
    return '<path d="M-6 -6L4 0L-6 6" fill="none" stroke="' + (col || '#FFFFFF') + '" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" opacity=".85" transform="translate(' + x + ',' + y + ') rotate(' + ang + ')"/>';
  }
  /* a capillary bed between (277,y) and (469,y): the blood runs through seven fine vessels */
  function ciBed(y, grad) {
    var out = '<path d="M262 ' + y + 'L277 ' + y + 'M469 ' + y + 'L484 ' + y + '" stroke="url(#' + grad + ')" stroke-width="8" stroke-linecap="round"/>';
    for (var k = -3; k <= 3; k++) {
      var yy = y + k * 11, d = k === 0 ? 'M277 ' + y + 'L469 ' + y
        : 'M277 ' + y + 'C296 ' + y + ' 300 ' + yy + ' 320 ' + yy + 'C352 ' + (yy + (k % 2 ? 4 : -4)) + ' 392 ' + (yy + (k % 2 ? -4 : 4)) + ' 426 ' + yy + 'C446 ' + yy + ' 450 ' + y + ' 469 ' + y;
      out += '<path d="' + d + '" fill="none" stroke="url(#' + grad + ')" stroke-width="' + (k === 0 ? 3.6 : 2.6) + '" stroke-linecap="round" opacity="' + (k === 0 ? 1 : .8) + '"/>';
    }
    /* cross links between the fine vessels, as in a real network */
    for (var j = 0; j < 5; j++) {
      var x = 332 + j * 26, ya = y - 22 + (j % 2) * 11;
      out += '<path d="M' + x + ' ' + ya + 'L' + (x + 12) + ' ' + (ya + 11) + '" stroke="url(#' + grad + ')" stroke-width="1.6" opacity=".6"/>';
    }
    return out;
  }
  function ciDefs(u) {
    return '<defs>' +
      '<linearGradient id="' + u + 'up" gradientUnits="userSpaceOnUse" x1="290" y1="0" x2="400" y2="0"><stop offset="0" stop-color="' + C.deo + '"/><stop offset="1" stop-color="' + C.oxy + '"/></linearGradient>' +
      '<linearGradient id="' + u + 'dn" gradientUnits="userSpaceOnUse" x1="469" y1="0" x2="277" y2="0"><stop offset="0" stop-color="' + C.oxy + '"/><stop offset=".25" stop-color="' + C.oxy + '"/><stop offset=".85" stop-color="' + C.deo + '"/><stop offset="1" stop-color="' + C.deo + '"/></linearGradient>' +
      '<radialGradient id="' + u + 'mus" cx=".42" cy=".38" r=".8"><stop offset="0" stop-color="#BE4D45"/><stop offset=".65" stop-color="#9A3230"/><stop offset="1" stop-color="#762224"/></radialGradient>' +
      '<radialGradient id="' + u + 'd" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#4A74C8"/><stop offset="1" stop-color="#2E5099"/></radialGradient>' +
      '<radialGradient id="' + u + 'o" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#E24A47"/><stop offset="1" stop-color="#B42C2E"/></radialGradient>' +
      '</defs>';
  }
  function ciBody() {
    var out = '<rect x="248" y="540" width="250" height="72" rx="22" class="ci__organ ci__organ--body"/>';
    for (var r = 0; r < 2; r++) for (var c = 0; c < 9; c++) {
      var x = 262 + c * 27 + (r % 2) * 13, y = 552 + r * 44;
      out += '<rect x="' + x + '" y="' + y + '" width="20" height="14" rx="6" class="ci__tissue"/>';
    }
    return out;
  }
  function ciStatic(kind, u) {
    var s = ciDefs(u);
    if (kind === 'fish') {
      /* gills: a row of gill filaments behind the capillaries */
      s += '<path d="M252 118C300 132 440 132 494 118" class="ci__arch"/>';
      for (var i = 0; i < 17; i++) { var x = 258 + i * 14.5; s += '<path d="M' + x + ' 124C' + (x - 3) + ' 96 ' + (x + 3) + ' 70 ' + (x - 1) + ' 44" class="ci__fil"/>'; }
      s += ciBed(89, u + 'up') + ciBody() + ciBed(575, u + 'dn');
      /* vessels: vein up to the atrium, artery up from the ventricle, artery down to the body */
      s += ciTube('M277 575L269 573L264 568L262 560L262 442', C.deo, C.deoHi, 13);
      s += ciTube('M262 272L262 104L264 96L269 91L277 89', C.deo, C.deoHi, 13);
      s += ciTube('M469 89L477 91L482 96L484 104L484 560L482 568L477 573L469 575', C.oxy, C.oxyHi, 13);
      s += ciArrow(262, 505, -90) + ciArrow(262, 190, -90) + ciArrow(484, 250, 90) + ciArrow(484, 430, 90);
      /* the heart: one ventricle above one atrium, drawn in section; both hold deoxygenated blood */
      s += '<path class="ci__mus" fill="url(#' + u + 'mus)" d="M262 272C292 272 306 290 306 314L306 334C306 356 290 368 262 368C234 368 218 356 218 334L218 314C218 290 232 272 262 272Z"/>' +
           '<path class="ci__mus" fill="url(#' + u + 'mus)" d="M262 370C286 370 296 386 296 404C296 426 282 442 262 442C242 442 228 426 228 404C228 386 238 370 262 370Z"/>' +
           '<rect x="253" y="350" width="18" height="36" fill="url(#' + u + 'mus)"/>';
    } else {
      /* lungs: a soft outline of two lungs behind the capillaries */
      s += '<path class="ci__organ ci__organ--lung" d="M362 44C348 38 312 36 284 46C258 56 248 84 250 108C252 128 270 138 296 136C322 134 346 128 358 118Z"/>' +
           '<path class="ci__organ ci__organ--lung" d="M366 44C380 38 416 36 444 46C470 56 480 84 478 108C476 128 458 138 432 136C406 134 382 128 370 118Z"/>';
      for (var a = 0; a < 26; a++) { var ax = 268 + (a % 13) * 16.5, ay = a < 13 ? 58 : 122; s += '<circle cx="' + ax + '" cy="' + ay + '" r="4.2" class="ci__alv"/>'; }
      s += ciBed(89, u + 'up') + ciBody() + ciBed(575, u + 'dn');
      s += ciTube('M277 575L262 575L216 575L209 572L206 565L206 302L209 295L216 292L280 292', C.deo, C.deoHi, 13);
      s += ciTube('M343 330L343 222L340 211L333 203L322 200L284 200L273 197L265 189L262 178L262 104L264 96L269 91L277 89', C.deo, C.deoHi, 13);
      s += ciTube('M469 89L477 91L482 96L484 104L484 178L481 189L473 197L462 200L437 200L426 203L418 211L415 222L415 266', C.oxy, C.oxyHi, 13);
      s += ciTube('M440 397L462 400L474 401L481 406L484 416L484 560L482 568L477 573L469 575', C.oxy, C.oxyHi, 13);
      s += ciArrow(206, 430, -90) + ciArrow(245, 292, 0) + ciArrow(262, 150, -90) + ciArrow(303, 200, 180) + ciArrow(484, 140, 90) + ciArrow(445, 200, 180) + ciArrow(484, 480, 90);
      /* the heart, in section as if in the chest of a person facing you: its right side on YOUR left */
      s += '<path class="ci__mus" fill="url(#' + u + 'mus)" d="M262 300C262 266 282 246 306 246C326 246 340 254 352 262L372 262C384 254 398 246 418 246C444 246 462 266 462 300L462 330C462 384 430 430 386 458C380 462 372 462 366 458C314 426 262 382 262 330Z"/>';
    }
    return s;
  }
  /* the chambers and valves, which move */
  var CI_CH = {
    fish: {
      atria: [{ d: 'M262 378C280 378 290 390 290 404C290 422 278 436 262 436C246 436 234 422 234 404C234 390 244 378 262 378Z', c: [262, 406], col: 'd' }],
      vents: [{ d: 'M262 286C281 286 292 298 292 316L292 332C292 346 280 354 262 354C244 354 232 346 232 332L232 316C232 298 243 286 262 286Z', c: [262, 320], col: 'd' }],
      /* openings through the muscle: atrium to ventricle, ventricle to artery, vein to atrium */
      chanD: 'M255.5 350L268.5 350L268.5 382L255.5 382Z M255.5 266L268.5 266L268.5 290L255.5 290Z M255.5 430L268.5 430L268.5 446L255.5 446Z', chanO: '', front: '',
      av: [[255.5, 358, 268.5, 358, -1]], sl: [[255.5, 280, 268.5, 280, -1]]
    },
    mammal: {
      atria: [{ d: 'M276 316L276 290C276 272 288 262 302 262C318 262 328 272 328 290L328 316Z', c: [302, 292], col: 'd' },
              { d: 'M386 316L386 290C386 272 398 262 413 262C429 262 440 272 440 290L440 316Z', c: [413, 292], col: 'o' }],
      vents: [{ d: 'M278 328L350 328L350 392C350 410 340 420 326 416C304 408 280 372 278 328Z', c: [314, 366], col: 'd' },
              { d: 'M380 328L436 328C436 360 426 396 404 424C396 432 386 430 382 420L380 380Z', c: [406, 366], col: 'o' }],
      /* right side (blue): atrium to ventricle, vena cava into the atrium; left side (red): atrium to
         ventricle, pulmonary vein into the atrium, ventricle into the aorta */
      chanD: 'M291 314L321 314L321 331L291 331Z M258 285.5L279 285.5L279 298.5L258 298.5Z',
      chanO: 'M398 314L428 314L428 331L398 331Z M408.5 242L421.5 242L421.5 266L408.5 266Z M418 390L444 392L444 405L418 403Z',
      /* the pulmonary artery leaves the top of the right ventricle and runs up in front of the atria */
      front: 'M343 334L343 236',
      av: [[291, 330, 321, 330, 1], [398, 330, 428, 330, 1]], sl: [[336.5, 322, 349.5, 322, -1], [440, 391, 440, 404, 0]]
    }
  };
  /* one valve: two flaps hinged at (x0,y0) and (x1,y1). dir -1: blood flows up through it; 1: down;
     0: to the right. o 0 shut ... 1 open. Shut, the free edges meet in the middle. */
  function ciValve(v, o) {
    var x0 = v[0], y0 = v[1], x1 = v[2], y1 = v[3], dir = v[4], mx = (x0 + x1) / 2, my = (y0 + y1) / 2, d = '';
    if (dir === 0) {   /* flow to the right: hinges top and bottom, flaps point right */
      d += 'M' + x0 + ' ' + y0 + 'Q' + n2(lerp(x0 + 2, x0 + 7, o)) + ' ' + n2(lerp(my - 3, y0 + 1, o)) + ' ' + n2(lerp(mx + 9, x0 + 13, o)) + ' ' + n2(lerp(my - .5, y0 + 2, o));
      d += 'M' + x1 + ' ' + y1 + 'Q' + n2(lerp(x1 + 2, x1 + 7, o)) + ' ' + n2(lerp(my + 3, y1 - 1, o)) + ' ' + n2(lerp(mx + 9, x1 + 13, o)) + ' ' + n2(lerp(my + .5, y1 - 2, o));
      return d;
    }
    var L2 = (x1 - x0) / 2, len = dir === 1 ? 16 : 13;
    [[x0, 1], [x1, -1]].forEach(function (e) {
      var ex = e[0], sd = e[1];
      var fx = lerp(mx - sd * .6, ex + sd * 2.5, o), fy = lerp(y0 + dir * (len * .55), y0 + dir * len, o);
      var cx = lerp(ex + sd * L2 * .55, ex + sd * 1, o), cy = lerp(y0 + dir * (len * .1), y0 + dir * len * .5, o);
      d += 'M' + ex + ' ' + y0 + 'Q' + n2(cx) + ' ' + n2(cy) + ' ' + n2(fx) + ' ' + n2(fy);
    });
    return d;
  }

  function circuit(spec) {
    var box = h('div', 'widget ci');
    box.appendChild(L.head(spec.title || 'Follow one red blood cell', spec.ask || CI_ASK, 'Press play'));
    var pick = h('div', 'ci__animals'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Choose an animal');
    var bF = button('ci__opt', '<b>Fish</b> single circulation'), bM = button('ci__opt', '<b>Mammal</b> double circulation');
    pick.appendChild(bF); pick.appendChild(bM);
    box.appendChild(pick);
    var barSlot = h('div', 'ci__barslot');
    box.appendChild(barSlot);
    var wrap = h('div', 'ci__wrap');
    var left = h('div', 'ci__left');
    var read = h('div', 'ci__read',
      '<div class="ci__gauge"><span class="ci__gh">Blood pressure where the cell is</span>' +
      '<span class="ci__track" aria-hidden="true"><i></i><em></em></span><span class="ci__ends" aria-hidden="true"><span>low</span><span>high</span></span>' +
      '<span class="ci__trend"></span></div>' +
      '<div class="ci__passes"><span class="ci__gh">Passes through the heart</span><b>0</b></div>' +
      '<div class="ci__blood"><span class="ci__gh">The blood round the cell</span><span class="ci__bw"><i></i><span></span></span></div>');
    var fig = h('figure', 'ci__fig');
    var svg = sv('svg', { viewBox: '0 0 ' + CI_W + ' ' + CI_H, 'class': 'ci__svg', role: 'img' });
    fig.appendChild(svg);
    left.appendChild(read); left.appendChild(fig);
    wrap.appendChild(left);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note',
      'Red is oxygenated blood and blue is deoxygenated blood, as on every diagram. Real blood is never blue: deoxygenated blood is dark red. ' +
      'The gauge shows only low and high, and each gauge compares pressures inside one animal. ' +
      'This is a circuit diagram, not a drawing of a real heart. In the body, the aorta leaves the top of the left ventricle, next to the pulmonary artery. In real life one beat takes less than a second, and one complete circuit takes about a minute.'));

    var gauge = read.querySelector('.ci__track i'), gmark = read.querySelector('.ci__track em'), trend = read.querySelector('.ci__trend');
    var passes = read.querySelector('.ci__passes b'), bw = read.querySelector('.ci__bw');
    /* the station places this widget after the fish sentences, so the fish comes first */
    var animal = spec.animal === 'mammal' ? 'mammal' : 'fish', sp = null, fontPx = 17, g = {};

    function build() {
      var A = CI[animal], u = 'ci' + (++UID);
      svg.setAttribute('aria-label', A.label);
      svg.innerHTML = '<rect class="ci__bg" x="0" y="0" width="' + CI_W + '" height="' + CI_H + '" rx="18"/>' + ciStatic(animal, u) +
        '<g class="ci__heart"></g><g class="ci__cell"></g><g class="ci__labels"></g>';
      g.heart = svg.querySelector('.ci__heart'); g.cell = svg.querySelector('.ci__cell'); g.lab = svg.querySelector('.ci__labels'); g.u = u;
      bF.setAttribute('aria-pressed', animal === 'fish' ? 'true' : 'false');
      bM.setAttribute('aria-pressed', animal === 'mammal' ? 'true' : 'false');
      if (sp) sp.stop();
      sp = L.stepper({ steps: A.steps.map(function (s) { return { t: s.t, h: s.h, p: s.p }; }), end: A.end, render: render });
      barSlot.innerHTML = ''; barSlot.appendChild(sp.bar);
      var old = wrap.querySelector('.sp__steps'); if (old) wrap.removeChild(old);
      wrap.appendChild(sp.list);
      var oldNow = fig.querySelector('.sp__now'); if (oldNow) fig.removeChild(oldNow);
      fig.appendChild(sp.now);
      sp.paint(0);
    }
    function stepAt(t) { var st = CI[animal].steps, k = 0; for (var i = 0; i < st.length; i++) if (t >= st[i].t - 1e-6) k = i; return k; }
    /* everything at time t: where the cell is, the heart, the gauge, the counter */
    function at(t) {
      var A = CI[animal], i = stepAt(t), st = A.steps[i], tau = clamp((t - st.t) / st.dur, 0, 1);
      var k, P, O, atr = 0, ven = 0, av = 1, sl = 0, done = 0;
      for (var j = 0; j < i; j++) if (A.steps[j].kind === 'vent') done++;
      if (st.kind === 'atria') { k = ease(seg(tau, .15, .7)); atr = smooth(seg(tau, .1, .35)) * (1 - smooth(seg(tau, .62, .82))); P = lerp(st.P0, st.P1, k); }
      else if (st.kind === 'vent') {
        k = ease(seg(tau, .16, .96));
        ven = smooth(seg(tau, .05, .3)) * (1 - smooth(seg(tau, .6, .78)));
        av = tau < .8 ? 1 - smooth(seg(tau, .05, .12)) : smooth(seg(tau, .8, .86));
        sl = smooth(seg(tau, .14, .2)) * (1 - smooth(seg(tau, .62, .68)));
        P = k < st.kx ? lerp(st.P0, st.Pk, smooth(seg(tau, .05, .22))) : lerp(st.Pk, st.P1, (k - st.kx) / (1 - st.kx));
        if (k >= st.kx) done++;
      } else { k = ease(seg(tau, .04, .96)); P = lerp(st.P0, st.P1, k); }
      O = st.load ? lerp(st.O0, st.O1, smooth(seg(k, .05, .5))) : st.kind === 'cap' ? lerp(st.O0, st.O1, smooth(seg(k, .1, .9))) : st.O0;
      return { i: i, st: st, k: k, P: P, O: O, atr: atr, ven: ven, av: av, sl: sl, passes: done };
    }
    function render(t) {
      var s = at(t), A = CI[animal], ch = CI_CH[animal], u = g.u;
      /* the heart: chambers shrink as they contract, and glow while they do; valves follow */
      var hs = (ch.chanD ? '<path class="ci__chan ci__chan--d" d="' + ch.chanD + '"/>' : '') + (ch.chanO ? '<path class="ci__chan ci__chan--o" d="' + ch.chanO + '"/>' : '');
      function cav(c, kx, ky, on) {
        var tr = 'translate(' + c.c[0] + ',' + c.c[1] + ') scale(' + n2(kx) + ',' + n2(ky) + ') translate(' + (-c.c[0]) + ',' + (-c.c[1]) + ')';
        return '<path d="' + c.d + '" fill="url(#' + u + c.col + ')" transform="' + tr + '" class="ci__cav' + (on > .03 ? ' is-on' : '') + '" stroke-opacity="' + n2(Math.min(1, .3 + on)) + '"/>';
      }
      ch.atria.forEach(function (c) { hs += cav(c, 1 - .14 * s.atr, 1 - .18 * s.atr, s.atr); });
      ch.vents.forEach(function (c) { hs += cav(c, 1 - .16 * s.ven, 1 - .1 * s.ven, s.ven); });
      if (ch.front) hs += ciTube(ch.front, C.deo, C.deoHi, 13);
      var vd = ''; ch.av.forEach(function (v) { vd += ciValve(v, s.av); }); ch.sl.forEach(function (v) { vd += ciValve(v, s.sl); });
      hs += '<path class="ci__valve-e" d="' + vd + '"/><path class="ci__valve" d="' + vd + '"/>';
      g.heart.innerHTML = hs;
      /* the cell, with a ring so the eye can follow it */
      var pt = s.st.tr.at(s.k * s.st.tr.total), dr = s.st.tr.dir(s.k * s.st.tr.total), ang = Math.atan2(dr[1], dr[0]) * 180 / Math.PI;
      var col = mix(C.deoHi, C.oxyHi, s.O), edge = mix('#1B3570', '#7A1E21', s.O);
      g.cell.innerHTML = '<circle cx="' + n2(pt[0]) + '" cy="' + n2(pt[1]) + '" r="15" class="ci__halo"/>' +
        '<g transform="translate(' + n2(pt[0]) + ',' + n2(pt[1]) + ') rotate(' + n2(ang) + ')"><ellipse rx="9.5" ry="6" fill="' + col + '" stroke="' + edge + '" stroke-width="1.6"/>' +
        '<ellipse rx="4.6" ry="2.4" fill="' + edge + '" opacity=".28"/></g>';
      g.lab.innerHTML = L.labels({ items: A.labels, left: 176, right: 544, font: fontPx, width: 156, top: 8, bottom: CI_H - 8, gap: 6 });
      /* the read-outs */
      gauge.style.width = (s.P * 100).toFixed(1) + '%';
      gmark.style.left = (s.P * 100).toFixed(1) + '%';
      var before = at(Math.max(0, t - .4)).P, dp = s.P - before;
      /* the words agree with the steps: high as blood leaves the ventricle, falling in a capillary bed, low after it */
      trend.textContent = dp > .006 ? 'rising' : dp < -.006 ? 'falling' : s.P >= .8 ? 'high' : s.P < .12 ? 'very low' : 'low';
      passes.textContent = String(s.passes);
      bw.querySelector('i').style.background = col;
      bw.querySelector('span').textContent = s.O > .5 ? 'oxygenated' : 'deoxygenated';
    }
    function fit() {
      wrap.classList.toggle('ci--stack', wrap.getBoundingClientRect().width < 660);
      var f = fontFor(svg, CI_W, 16, 30);          /* measured after the layout has changed */
      if (f && f !== fontPx) { fontPx = f; if (sp) sp.paint(sp.time()); }
    }
    bF.addEventListener('click', function () { if (animal !== 'fish') { animal = 'fish'; build(); } });
    bM.addEventListener('click', function () { if (animal !== 'mammal') { animal = 'mammal'; build(); } });
    build();
    var ro = observe(wrap, fit);
    if (ro) ro.observe(svg);
    box.__onReset = function () { if (sp) sp.stop(); if (ro) ro.disconnect(); };
    box.__seek = function (t) { return sp.seek(t); };
    return box;
  }

  /* =====================================================================
     3 · PULSE — count a pulse
     ===================================================================== */
  var PU_ASK = 'Watch the artery beat. Press Start, then press the button once for every beat until the 15 seconds are up. The page multiplies by 4 — then compare your count with the true rate.';
  var PU_W = 900, PU_H = 400, COUNT_S = 15;
  /* the radial artery in the drawing: from the middle of the forearm near the elbow (left) to the
     thumb side of the wrist, where it lies about 1 cm in from the edge, then round towards the back
     of the wrist. Scale: about 25 units to 1 cm (the wrist is about 6 cm across). */
  var PU_ART = 'M96 210C220 198 340 172 440 164C470 161 492 155 508 142';
  var PU_TIP = [[396, 181], [441, 176]];          /* the middle and index fingertips, on the artery */
  var PU_TILT = 12;

  function puArt(u) {
    /* a left forearm and hand, palm up, seen from above: the thumb side is at the top, the hand on the right */
    return '<defs>' +
      '<linearGradient id="' + u + 'skin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#BF866C"/><stop offset=".2" stop-color="#D7A68B"/><stop offset=".5" stop-color="#E0B398"/><stop offset=".82" stop-color="#CF9C81"/><stop offset="1" stop-color="#AE775F"/></linearGradient>' +
      '<linearGradient id="' + u + 'fing" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B98269"/><stop offset=".22" stop-color="#D9AB91"/><stop offset=".55" stop-color="#E6BCA2"/><stop offset="1" stop-color="#B57E65"/></linearGradient>' +
      '<linearGradient id="' + u + 'fade" gradientUnits="userSpaceOnUse" x1="168" y1="0" x2="742" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".09" stop-color="#fff"/><stop offset=".955" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '<mask id="' + u + 'mask" maskUnits="userSpaceOnUse" x="0" y="0" width="' + PU_W + '" height="' + PU_H + '"><rect x="0" y="0" width="' + PU_W + '" height="' + PU_H + '" fill="url(#' + u + 'fade)"/></mask>' +
      '<filter id="' + u + 'soft" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<filter id="' + u + 'blur" x="-20%" y="-60%" width="140%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>' +
      '<radialGradient id="' + u + 'throb"><stop offset="0" stop-color="#FF6B5B" stop-opacity=".95"/><stop offset=".6" stop-color="#FF6B5B" stop-opacity=".35"/><stop offset="1" stop-color="#FF6B5B" stop-opacity="0"/></radialGradient>' +
      '</defs>' +
      '<rect class="pu__bg" x="0" y="0" width="' + PU_W + '" height="' + PU_H + '" rx="18"/>' +
      '<g mask="url(#' + u + 'mask)">' +
        /* the soft shadow the arm casts on the table */
        '<path d="M96 330C240 324 380 312 476 308C560 314 660 318 760 314L760 346L96 356Z" fill="#000" opacity=".35" filter="url(#' + u + 'blur)"/>' +
        /* forearm, wrist, palm and thumb, one outline */
        '<path fill="url(#' + u + 'skin)" stroke="#9C6A54" stroke-width="1.2" d="M96 112C220 110 360 124 470 136C492 138 510 136 526 132C548 126 566 116 584 104C610 88 640 70 664 60C684 52 704 58 704 76C704 92 690 100 672 110C650 122 626 138 612 154C640 150 690 148 760 150L760 304C680 310 600 312 540 306C516 304 496 302 476 300C380 306 240 316 96 322Z"/>' +
        /* the fleshy pads at the base of the thumb and of the little finger */
        '<ellipse cx="562" cy="196" rx="52" ry="62" transform="rotate(-24 562 196)" fill="#EBC3AA" opacity=".45" filter="url(#' + u + 'soft)"/>' +
        '<ellipse cx="648" cy="268" rx="78" ry="26" fill="#EBC3AA" opacity=".35" filter="url(#' + u + 'soft)"/>' +
        '<ellipse cx="300" cy="222" rx="190" ry="40" fill="#EBC3AA" opacity=".22" filter="url(#' + u + 'blur)"/>' +
        /* two tendons at the front of the wrist: the artery lies on the thumb side of both */
        '<path d="M372 192C412 189 446 186 476 184" stroke="#F0CDB6" stroke-width="7" stroke-linecap="round" fill="none" opacity=".3" filter="url(#' + u + 'soft)"/>' +
        '<path d="M384 222C420 220 450 219 476 218" stroke="#F0CDB6" stroke-width="6" stroke-linecap="round" fill="none" opacity=".24" filter="url(#' + u + 'soft)"/>' +
        /* wrist creases, the thumb crease and the crease round the base of the thumb */
        '<path d="M474 140C468 188 468 250 478 298M490 138C484 188 484 252 494 300" stroke="#8E5E48" stroke-width="1.5" fill="none" opacity=".5"/>' +
        '<path d="M612 156C582 190 556 236 538 294" stroke="#94644E" stroke-width="1.5" fill="none" opacity=".45"/>' +
        '<path d="M662 84C670 94 676 102 680 108" stroke="#94644E" stroke-width="1.4" fill="none" opacity=".5"/>' +
        /* the radial artery, faint under the skin; it throbs with each beat */
        '<path class="pu__art-wide" d="' + PU_ART + '" filter="url(#' + u + 'blur)"/>' +
        '<path class="pu__art" d="' + PU_ART + '" filter="url(#' + u + 'soft)"/>' +
      '</g>' +
      '<ellipse class="pu__throb" cx="419" cy="172" rx="96" ry="40" fill="url(#' + u + 'throb)"/>' +
      '<g class="pu__rings"></g>' +
      /* the tips of the index and middle fingers of the other hand, resting on the artery */
      '<g class="pu__fingers">' +
        PU_TIP.map(function (t) { return '<ellipse cx="' + (t[0] - 4) + '" cy="' + (t[1] + 3) + '" rx="23" ry="8" fill="#4A2A20" opacity=".4" filter="url(#' + u + 'soft)"/>'; }).join('') +
        fingerPath(PU_TIP[0][0], PU_TIP[0][1], u, PU_TILT) + fingerPath(PU_TIP[1][0], PU_TIP[1][1], u, PU_TILT) +
      '</g>';
  }
  /* a finger seen from the back, pointing down at its tip (x, tipY): about 1.7 cm wide, the nail
     near the tip, creases over the two joints */
  function fingerPath(x, tipY, u, tilt) {
    var w = 21, top = tipY - 280;
    function c(dx, dy) { return (x + dx) + ' ' + (tipY + dy); }
    return '<g transform="rotate(' + tilt + ' ' + x + ' ' + tipY + ')">' +
      '<path fill="url(#' + u + 'fing)" stroke="#8A5640" stroke-width="1.2" d="M' + (x - w - 2) + ' ' + top + 'L' + c(-w, -24) + 'C' + c(-w, -8) + ' ' + c(-12, 0) + ' ' + c(0, 0) +
        'C' + c(12, 0) + ' ' + c(w, -8) + ' ' + c(w, -24) + 'L' + (x + w + 2) + ' ' + top + 'Z"/>' +
      '<path fill="#F3D6C8" stroke="#BE8C78" stroke-width="1" d="M' + c(-15, -30) + 'C' + c(-15, -44) + ' ' + c(15, -44) + ' ' + c(15, -30) + 'L' + c(15, -15) + 'C' + c(15, -7) + ' ' + c(-15, -7) + ' ' + c(-15, -15) + 'Z"/>' +
      '<path d="M' + c(-12, -13) + 'C' + c(-5, -9) + ' ' + c(5, -9) + ' ' + c(12, -13) + '" stroke="#FFFFFF" stroke-width="2" fill="none" opacity=".65"/>' +
      '<path d="M' + c(-10, -36) + 'C' + c(-4, -39) + ' ' + c(4, -39) + ' ' + c(10, -36) + '" stroke="#C9998A" stroke-width="1.2" fill="none" opacity=".8"/>' +
      '<path d="M' + c(-13, -66) + 'C' + c(-5, -62) + ' ' + c(5, -62) + ' ' + c(13, -66) + 'M' + c(-11, -59) + 'C' + c(-4, -56) + ' ' + c(4, -56) + ' ' + c(11, -59) + '" stroke="#98624E" stroke-width="1.2" fill="none" opacity=".7"/>' +
      '<path d="M' + c(-15, -150) + 'C' + c(-6, -144) + ' ' + c(6, -144) + ' ' + c(15, -150) + 'M' + c(-13, -142) + 'C' + c(-5, -137) + ' ' + c(5, -137) + ' ' + c(13, -142) + 'M' + c(-10, -134) + 'C' + c(-4, -131) + ' ' + c(4, -131) + ' ' + c(10, -134) + '" stroke="#98624E" stroke-width="1.2" fill="none" opacity=".55"/>' +
      '</g>';
  }
  /* the hidden heart: a mean rate that swings a few per cent with breathing (faster breathing in) */
  function puHeart(rate, phase, breath) {
    var VAR = .04, BR = 4.6, beats = [], rate60 = rate / 60;
    function phi(t) { return rate60 * (t - VAR * BR / (2 * Math.PI) * (Math.cos(2 * Math.PI * t / BR + breath) - Math.cos(breath))) + phase; }
    function extend(upto) {
      var last = beats.length ? beats[beats.length - 1] : -1.5;
      while (last < upto) {
        var target = Math.floor(phi(last) + 1e-9) + 1, lo = last, hi = last + 2;
        while (phi(hi) < target) hi += 1;
        for (var it = 0; it < 40; it++) { var m = (lo + hi) / 2; if (phi(m) < target) lo = m; else hi = m; }
        last = hi; beats.push(hi);
      }
    }
    return {
      rate: rate,
      /* how strongly the artery is throbbing at time t: a steep rise, a slower fall, a small notch */
      wave: function (t) {
        extend(t + 2);
        var v = 0;
        for (var i = beats.length - 1; i >= 0 && beats[i] > t - 1.2; i--) {
          var tau = t - beats[i];
          if (tau < 0) continue;
          var w = tau < .09 ? smooth(tau / .09) : Math.exp(-(tau - .09) / .2) + .14 * Math.exp(-Math.pow((tau - .34) / .05, 2));
          if (w > v) v = w;
        }
        return v;
      },
      since: function (t) { extend(t + 2); for (var i = beats.length - 1; i >= 0; i--) if (beats[i] <= t) return t - beats[i]; return 9; },
      count: function (a, b) { extend(b + 2); var n = 0; for (var i = 0; i < beats.length; i++) if (beats[i] >= a && beats[i] < b) n++; return n; }
    };
  }

  function pulse(spec) {
    var box = h('div', 'widget pu');
    box.appendChild(L.head(spec.title || 'Count a pulse', spec.ask || PU_ASK, 'Press Start'));
    var wrap = h('div', 'pu__wrap');
    var fig = h('figure', 'pu__fig');
    var svg = sv('svg', { viewBox: '0 0 ' + PU_W + ' ' + PU_H, 'class': 'pu__svg', role: 'img',
      'aria-label': 'A left forearm and hand, palm up. The tips of the index and middle fingers of the other hand rest on the inside of the wrist, on the thumb side, over the radial artery, which shows faintly under the skin and throbs with each beat.' });
    var u = 'pu' + (++UID);
    svg.innerHTML = puArt(u) + '<g class="pu__labels"></g>';
    fig.appendChild(svg);
    wrap.appendChild(fig);
    var gLab = svg.querySelector('.pu__labels'), art = svg.querySelector('.pu__art'), artW = svg.querySelector('.pu__art-wide'),
        throb = svg.querySelector('.pu__throb'), rings = svg.querySelector('.pu__rings'), fingers = svg.querySelector('.pu__fingers');

    var panel = h('div', 'pu__panel');
    var dials = h('div', 'pu__dials',
      '<div class="pu__dial"><span class="pu__dh">Time left</span><b class="pu__time">15.0 s</b><span class="pu__bar" aria-hidden="true"><i></i></span></div>' +
      '<div class="pu__dial"><span class="pu__dh">Beats counted</span><b class="pu__n">0</b></div>');
    var start = button('pu__start', 'Start the 15-second count');
    var beat = button('pu__beat', 'Beat');
    beat.setAttribute('aria-describedby', u + 'hint');
    var hint = h('p', 'pu__hint', 'Press Beat, or the space bar, once for every beat you see.'); hint.id = u + 'hint';
    var msg = h('p', 'pu__msg'); msg.setAttribute('aria-live', 'polite');
    var result = h('div', 'pu__result'); result.setAttribute('aria-live', 'polite'); result.tabIndex = -1;
    var again = button('wbtn pu__again', 'Count another pulse');
    panel.appendChild(dials); panel.appendChild(start); panel.appendChild(beat); panel.appendChild(hint); panel.appendChild(msg); panel.appendChild(result); panel.appendChild(again);
    wrap.appendChild(panel);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note',
      'The radial artery runs close to the skin on the thumb side of the wrist. Each time the left ventricle contracts, a surge of blood stretches the artery: that surge is the pulse. ' +
      'Use the tips of your index and middle fingers. Never use your thumb: it has its own pulse. ' +
      'You cannot feel a screen, so here each beat shows as a glow under the fingertips.'));
    var tEl = dials.querySelector('.pu__time'), nEl = dials.querySelector('.pu__n'), barEl = dials.querySelector('.pu__bar i');

    function randRate(avoid) { var r; do { r = 60 + Math.floor(Math.random() * 41); } while (avoid && Math.abs(r - avoid) < 6); return r; }
    var heart = puHeart(spec.rate ? clamp(+spec.rate, 60, 100) : randRate(), Math.random(), Math.random() * 6.28);
    var clock0 = nowS(), stateNow = 'idle', tStart = 0, presses = 0, rafId = null, fontPx = 18, visible = true, frozen = null, doneAt = -9;

    function drawPulse(t) {
      var w = heart.wave(t), calm = still();
      art.setAttribute('stroke-opacity', n2(.3 + .62 * w));
      art.setAttribute('stroke-width', n2(calm ? 5 : 4.5 + 3.5 * w));
      artW.setAttribute('stroke-opacity', n2(.12 + .58 * w));
      throb.setAttribute('opacity', n2(w));
      fingers.setAttribute('transform', calm ? '' : 'translate(0,' + n2(-2.6 * w) + ')');
      var ts = heart.since(t), rs = '';
      if (!calm && ts < .7) { var k = ts / .7; rs = '<ellipse cx="419" cy="172" rx="' + n2(48 + 70 * k) + '" ry="' + n2(20 + 28 * k) + '" class="pu__ring" opacity="' + n2(.95 * (1 - k)) + '"/>'; }
      rings.innerHTML = rs;
    }
    /* where the centre line of a tilted finger crosses height y */
    function fingerX(i, y) { var t = PU_TIP[i]; return n2(t[0] + (t[1] - y) * Math.tan(PU_TILT * Math.PI / 180)); }
    function labels() {
      gLab.innerHTML = L.labels({ items: [
        { id: 'mid', text: 'middle finger', x: fingerX(0, 70), y: 70, side: 'L' },
        { id: 'art', text: 'radial artery', x: 243, y: 190, side: 'L' },
        { id: 'idx', text: 'index finger', x: fingerX(1, 38), y: 38, side: 'R' },
        { id: 'thumb', text: 'thumb', x: 684, y: 80, side: 'R' }
      ], left: 176, right: 746, font: fontPx, width: 140, top: 8, bottom: PU_H - 8, gap: 6 });
    }
    function show(t) {
      /* the dials and the buttons for the current state; t is the time since the count began */
      var left = stateNow === 'count' ? Math.max(0, COUNT_S - t) : stateNow === 'done' ? 0 : COUNT_S;
      tEl.textContent = left.toFixed(1) + ' s';
      barEl.style.width = ((1 - left / COUNT_S) * 100).toFixed(1) + '%';
      nEl.textContent = String(presses);
      start.hidden = stateNow !== 'idle';
      beat.hidden = stateNow !== 'count';
      hint.hidden = stateNow !== 'count';
      again.hidden = stateNow !== 'done';
      result.hidden = stateNow !== 'done';
      box.classList.toggle('is-counting', stateNow === 'count');
    }
    function finish() {
      stateNow = 'done';
      var bpm = presses * 4, diff = bpm - heart.rate;
      result.innerHTML = presses ?
        '<p class="pu__line">You counted <b>' + presses + '</b> beats in 15 s.</p>' +
        '<p class="pu__line pu__sum">' + presses + ' × 4 = <b>' + bpm + ' beats per minute</b></p>' +
        '<p class="pu__line">The true rate: <b>' + heart.rate + ' beats per minute</b></p>' +
        '<p class="pu__line pu__diff">' + (diff === 0 ? 'Your answer is the same as the true rate.' : 'The difference: <b>' + Math.abs(diff) + ' bpm</b> ' + (diff > 0 ? 'higher' : 'lower') + ' than the true rate.') + '</p>'
        : '<p class="pu__line">You did not press Beat, so there is no count. Press <b>Count another pulse</b> to try again.</p>';
      show(COUNT_S);
      /* the focus goes to the result, not to a button: a space bar still being pressed for beats must not start again */
      doneAt = nowS();
      try { result.focus({ preventScroll: true }); } catch (e) { result.focus(); }
    }
    function frame() {
      rafId = null;
      if (!box.isConnected) { if (io) io.disconnect(); if (ro) ro.disconnect(); return; }
      var t = nowS() - clock0;
      if (frozen == null) drawPulse(t);
      if (stateNow === 'count') {
        var el = nowS() - tStart;
        if (el >= COUNT_S) finish(); else show(el);
      }
      if (visible || stateNow === 'count') rafId = raf(frame);
    }
    function loop() { if (rafId == null && box.isConnected) rafId = raf(frame); }
    function press() {
      if (stateNow !== 'count') return;
      if (nowS() - tStart >= COUNT_S) return;
      presses++; nEl.textContent = String(presses);
      beat.classList.remove('is-hit'); void beat.offsetWidth; beat.classList.add('is-hit');
    }
    start.addEventListener('click', function () {
      frozen = null; stateNow = 'count'; presses = 0; tStart = nowS(); msg.textContent = 'Counting: 15 seconds.';
      show(0); beat.focus(); loop();
    });
    /* a press counts at once: on pointer down, or on the key going down */
    var keyed = false;
    beat.addEventListener('pointerdown', function (e) { if (e.button === 0 || e.pointerType !== 'mouse') { e.preventDefault(); press(); } });
    beat.addEventListener('keydown', function (e) { if (e.key === ' ' || e.key === 'Enter' || e.key === 'Spacebar') { e.preventDefault(); if (!e.repeat) press(); keyed = true; } });
    beat.addEventListener('click', function (e) { if (e.detail === 0 && !keyed) press(); keyed = false; });
    /* the space bar also works while the count runs and the focus is elsewhere in the widget */
    box.addEventListener('keydown', function (e) {
      var sp = e.key === ' ' || e.key === 'Spacebar';
      if (stateNow === 'count' && sp && e.target !== beat && !/INPUT|TEXTAREA|SELECT/.test(e.target.tagName)) { e.preventDefault(); if (!e.repeat) press(); }
      else if (stateNow === 'done' && sp && nowS() - doneAt < 1.5) e.preventDefault();
    });
    again.addEventListener('click', function () {
      heart = puHeart(randRate(heart.rate), Math.random(), Math.random() * 6.28);
      stateNow = 'idle'; presses = 0; msg.textContent = 'A new pulse. Watch it for a few beats, then press Start.'; frozen = null;
      show(0); start.focus(); loop();
    });

    function fit() {
      var ww = wrap.getBoundingClientRect().width;
      wrap.classList.toggle('pu--stack', ww < 820);
      wrap.classList.toggle('pu--narrow', ww < 500);
      var f = fontFor(svg, PU_W, 17, 36);          /* measured after the layout has changed */
      if (f && f !== fontPx) { fontPx = f; labels(); }
    }
    var ro = observe(wrap, fit);
    if (ro) ro.observe(svg);
    var io = global.IntersectionObserver ? new IntersectionObserver(function (es) { visible = es[0].isIntersecting; if (visible) loop(); }) : null;
    if (io) io.observe(svg);
    box.__onReset = function () { unraf(rafId); rafId = null; if (ro) ro.disconnect(); if (io) io.disconnect(); };
    /* t: seconds into the count, every beat so far pressed; t >= 15: the result */
    box.__seek = function (t) {
      unraf(rafId); rafId = null;
      heart = puHeart(spec.rate ? clamp(+spec.rate, 60, 100) : 72, .35, 1.1);
      frozen = t; drawPulse(t);
      if (t >= COUNT_S) { stateNow = 'count'; presses = spec.count != null ? +spec.count : heart.count(0, COUNT_S); finish(); }
      else if (t > 0) { stateNow = 'count'; presses = heart.count(0, t); show(t); }
      else { stateNow = 'idle'; presses = 0; show(0); }
      return [0, 5, 10, 15];
    };
    labels(); show(0); drawPulse(0); loop();
    return box;
  }

  /* =====================================================================
     4 · ECG — read an ECG
     ===================================================================== */
  var EC_ASK = 'Press two tall spikes one after the other. The page measures the time between them; work out the heart rate yourself, then check it.';
  var MM = 10, SPEED = 25, PX_S = MM * SPEED, EC_DUR = 3.2, EC_W = EC_DUR * PX_S, EC_H = 320, BASE = 215, MV = 10 * MM;
  var STRIPS = [
    { name: 'Strip 1', sub: 'resting', rr: .8, first: .4, pr: .16, pd: .09, pa: .16, td: .18, ta: .32 },
    { name: 'Strip 2', sub: 'a fast heart rate', rr: .4, first: .4, pr: .14, pd: .08, pa: .15, td: .14, ta: .28 },
    { name: 'Strip 3', sub: 'a slow heart rate', rr: 1.2, first: .6, pr: .17, pd: .09, pa: .16, td: .2, ta: .34 }
  ];
  /* one beat, in millivolts, t seconds after the start of its QRS */
  function ecBeat(S, t) {
    var qt = .4 * Math.sqrt(S.rr), v = 0;
    var p0 = -S.pr;                                                   /* the P wave starts PR before the QRS */
    if (t >= p0 && t <= p0 + S.pd) v += S.pa * (1 - Math.cos(2 * Math.PI * (t - p0) / S.pd)) / 2;
    var q = [[0, 0], [.015, -.1], [.04, 1.25], [.058, -.3], [.08, 0]];   /* Q, R, S: the QRS lasts 0.08 s */
    for (var i = 1; i < q.length; i++) if (t >= q[i - 1][0] && t <= q[i][0]) { v += lerp(q[i - 1][1], q[i][1], (t - q[i - 1][0]) / (q[i][0] - q[i - 1][0])); break; }
    var t0 = qt - S.td;                                               /* the T wave ends at the end of QT */
    if (t >= t0 && t <= qt) { var w = Math.pow((t - t0) / S.td, 1.25); v += S.ta * Math.pow(Math.sin(Math.PI * w), 1.5); }
    return v;
  }
  function ecRs(S) { var r = []; for (var x = S.first - 5 * S.rr; x < EC_DUR + 2 * S.rr; x += S.rr) r.push(Math.round(x * 1000) / 1000); return r; }
  function ecV(S, t) { var rs = ecRs(S), v = 0; for (var i = 0; i < rs.length; i++) v += ecBeat(S, t - (rs[i] - .04)); return v; }
  function ecTrace(S, x0, x1, pxs, base, mv, t0) {
    var pts = [], rs = ecRs(S), ts = [], t;
    for (t = t0; t <= t0 + (x1 - x0) / pxs + 1e-9; t += 1 / pxs) ts.push(t);
    rs.forEach(function (r) { [0, .015, .04, .058, .08].forEach(function (d) { var tt = r - .04 + d; if (tt > t0 && tt < t0 + (x1 - x0) / pxs) ts.push(tt); }); });
    ts.sort(function (a, b) { return a - b; });
    for (var i = 0; i < ts.length; i++) pts.push([x0 + (ts[i] - t0) * pxs, base - ecV(S, ts[i]) * mv]);
    return pathD(pts);
  }
  function ecGrid(w, hh, sm, x0, y0) {
    var s = '', x, y;
    for (x = 0; x <= w + .01; x += sm) s += '<line x1="' + n2(x0 + x) + '" y1="' + y0 + '" x2="' + n2(x0 + x) + '" y2="' + (y0 + hh) + '" class="' + (Math.round(x / sm) % 5 ? 'ec__g' : 'ec__G') + '"/>';
    for (y = 0; y <= hh + .01; y += sm) s += '<line x1="' + x0 + '" y1="' + n2(y0 + y) + '" x2="' + (x0 + w) + '" y2="' + n2(y0 + y) + '" class="' + (Math.round(y / sm) % 5 ? 'ec__g' : 'ec__G') + '"/>';
    return s;
  }
  function fmt2(v) { return v.toFixed(2); }

  function ecg(spec) {
    var box = h('div', 'widget ec');
    box.appendChild(L.head(spec.title || 'Read an ECG', spec.ask || EC_ASK, 'Press a spike'));
    var pick = h('div', 'ec__strips'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Choose a strip');
    var sb = STRIPS.map(function (S, i) { var b = button('ec__opt', '<b>' + S.name + '</b> ' + S.sub); b.addEventListener('click', function () { choose(i); }); pick.appendChild(b); return b; });
    box.appendChild(pick);
    var fig = h('figure', 'ec__fig');
    var svg = sv('svg', { viewBox: '0 0 ' + EC_W + ' ' + EC_H, 'class': 'ec__svg', role: 'group' });
    fig.appendChild(svg);
    /* the key, with a small and a large square of the same paper */
    var sq1 = '<svg class="ec__sw" viewBox="0 0 12 12" aria-hidden="true"><rect x=".5" y=".5" width="11" height="11" class="ec__paper"/><rect x=".5" y=".5" width="11" height="11" fill="none" class="ec__G"/></svg>';
    var sq5 = '<svg class="ec__sw ec__sw--5" viewBox="0 0 26 26" aria-hidden="true"><rect x=".5" y=".5" width="25" height="25" class="ec__paper"/>' +
      [5.5, 10.5, 15.5, 20.5].map(function (v) { return '<line x1="' + v + '" y1=".5" x2="' + v + '" y2="25.5" class="ec__g"/><line x1=".5" y1="' + v + '" x2="25.5" y2="' + v + '" class="ec__g"/>'; }).join('') +
      '<rect x=".5" y=".5" width="25" height="25" fill="none" class="ec__G"/></svg>';
    fig.appendChild(h('figcaption', 'ec__key', '<span>' + sq1 + '<b>1 small square</b> = 0.04 s</span><span>' + sq5 + '<b>1 large square</b> = 0.2 s</span><span>The paper moves at 25 mm each second.</span>'));
    box.appendChild(fig);
    var msg = h('p', 'ec__msg'); msg.setAttribute('aria-live', 'polite');
    box.appendChild(msg);
    var calc = h('div', 'ec__calc');
    var iid = 'ec' + (++UID);
    calc.innerHTML = '<label class="ec__lab" for="' + iid + '">Heart rate =</label><input class="ec__in" id="' + iid + '" type="text" inputmode="decimal" autocomplete="off" spellcheck="false">' +
      '<span class="ec__unit">beats per minute</span>';
    var inp = calc.querySelector('input'), chk = button('ec__check', 'Check'), clr = button('wbtn ec__clear', 'Choose other spikes');
    calc.appendChild(chk); calc.appendChild(clr);
    box.appendChild(calc);
    var fb = h('div', 'ec__fb'); fb.setAttribute('aria-live', 'polite');
    box.appendChild(fb);
    var namesBtn = button('wbtn ec__namesb', 'Name the waves <span>(not asked in 0610)</span>');
    namesBtn.setAttribute('aria-expanded', 'false');
    box.appendChild(namesBtn);
    var names = h('div', 'ec__names'); names.hidden = true;
    box.appendChild(names);
    box.appendChild(h('p', 'widget__note',
      'An ECG records the electrical activity of the heart through electrodes stuck to the skin of the chest, arms and legs. ' +
      'Every beat makes the same pattern, with one tall spike. These strips are drawn to scale for a healthy heart. In a real ECG the time between beats changes a little from beat to beat.'));

    var cur = spec.strip != null ? clamp(+spec.strip | 0, 0, 2) : 0, picks = [], tries = 0, fontPx = 22;

    function rsIn(S) { return ecRs(S).filter(function (r) { return r > .05 && r < EC_DUR - .05; }); }
    function draw() {
      var S = STRIPS[cur], rs = rsIn(S), s = '';
      s += '<rect x="0" y="0" width="' + EC_W + '" height="' + EC_H + '" class="ec__paper"/>' + ecGrid(EC_W, EC_H, MM, 0, 0);
      /* the time between the two chosen spikes, shaded and counted in large squares */
      if (picks.length === 2) {
        var a = Math.min(picks[0], picks[1]) * PX_S, b = Math.max(picks[0], picks[1]) * PX_S, nL = Math.round((b - a) / (5 * MM));
        s += '<rect x="' + a + '" y="0" width="' + (b - a) + '" height="' + EC_H + '" class="ec__span"/>';
        for (var k = 0; k < nL; k++) s += '<text x="' + (a + (k + .5) * 5 * MM) + '" y="' + (8 + fontPx * .8) + '" class="ec__num" style="font-size:' + fontPx + 'px">' + (k + 1) + '</text>';
        var ay = 12 + fontPx * 1.2;
        s += '<path class="ec__arrow" d="M' + (a + 2) + ' ' + ay + 'L' + (b - 2) + ' ' + ay + 'M' + (a + 10) + ' ' + (ay - 6) + 'L' + (a + 2) + ' ' + ay + 'L' + (a + 10) + ' ' + (ay + 6) + 'M' + (b - 10) + ' ' + (ay - 6) + 'L' + (b - 2) + ' ' + ay + 'L' + (b - 10) + ' ' + (ay + 6) + '"/>';
      }
      s += '<path class="ec__trace" d="' + ecTrace(S, 0, EC_W, PX_S, BASE, MV, 0) + '"/>';
      picks.forEach(function (r) { var x = r * PX_S; s += '<line x1="' + x + '" y1="0" x2="' + x + '" y2="' + EC_H + '" class="ec__pickline"/><circle cx="' + x + '" cy="' + n2(BASE - 1.25 * MV) + '" r="9" class="ec__pick"/>'; });
      /* the spikes a reader can press, each a tall band around its R wave */
      /* a wide band to press (up to 0.44 s, never overlapping the next), with a narrow highlight on the spike */
      var hw = Math.min(55, .45 * S.rr * PX_S);
      rs.forEach(function (r, i) {
        var x = r * PX_S, on = picks.indexOf(r) >= 0;
        s += '<g class="ec__zone' + (on ? ' is-picked' : '') + '" tabindex="0" role="button" data-r="' + r + '" aria-label="Tall spike ' + (i + 1) + ' of ' + rs.length + (on ? ', chosen' : '') + '">' +
          '<rect class="ec__hit" x="' + n2(x - hw) + '" y="0" width="' + n2(2 * hw) + '" height="' + EC_H + '"/>' +
          '<rect class="ec__hl" x="' + (x - 22) + '" y="4" width="44" height="' + (EC_H - 8) + '" rx="8"/></g>';
      });
      svg.innerHTML = s;
      svg.setAttribute('aria-label', S.name + ', ' + S.sub + ': an ECG strip on paper with a grid of small and large squares, showing ' + rs.length + ' tall spikes. Press two spikes next to each other.');
      sb.forEach(function (b, i) { b.setAttribute('aria-pressed', i === cur ? 'true' : 'false'); });
    }
    function time() { return Math.abs(picks[1] - picks[0]); }
    function status() {
      var S = STRIPS[cur];
      calc.hidden = picks.length !== 2;
      if (!picks.length) msg.innerHTML = 'Press one of the tall spikes.';
      else if (picks.length === 1) msg.innerHTML = 'Now press the next tall spike, to its left or right.';
      else {
        var T = time(), nL = Math.round(T / .2);
        msg.innerHTML = 'Time between the two spikes: <b>' + nL + ' large squares × 0.2 s = ' + fmt2(T) + ' s</b>. This is the time for one beat.';
      }
      clr.hidden = !picks.length;
      return S;
    }
    function pick_(r) {
      fb.innerHTML = ''; fb.className = 'ec__fb'; tries = 0; inp.value = '';
      var i = picks.indexOf(r);
      if (i >= 0) picks.splice(i, 1);
      else if (picks.length === 2) picks = [r];
      else picks.push(r);
      if (picks.length === 2) {
        var S = STRIPS[cur], gap = Math.round(time() / S.rr);
        if (gap > 1) {
          msg.innerHTML = 'Those spikes are ' + gap + ' beats apart. Choose two spikes next to each other: the time between them is the time for one beat.';
          picks = []; draw(); calc.hidden = true; clr.hidden = true; return;
        }
      }
      draw(); status();
      var z = svg.querySelector('.ec__zone[data-r="' + r + '"]'); if (z && document.activeElement !== inp) try { z.focus({ preventScroll: true }); } catch (e) { z.focus(); }
      if (picks.length === 2) inp.focus();
    }
    svg.addEventListener('click', function (e) { var z = e.target.closest ? e.target.closest('.ec__zone') : null; if (z) pick_(+z.getAttribute('data-r')); });
    svg.addEventListener('keydown', function (e) {
      var z = e.target.closest ? e.target.closest('.ec__zone') : null;
      if (z && (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar')) { e.preventDefault(); pick_(+z.getAttribute('data-r')); }
    });
    function check() {
      if (picks.length !== 2) return;
      var raw = String(inp.value).replace(',', '.').replace(/[^\d.\-]/g, ''), x = parseFloat(raw), T = time(), right = 60 / T, S = STRIPS[cur];
      var sense = T < 1 ? 'One beat takes less than one second, so the heart beats more than 60 times in a minute.' : T > 1 ? 'One beat takes more than one second, so the heart beats fewer than 60 times in a minute.' : '';
      var golden = '<p class="ec__gold"><b>Golden rule:</b> heart rate = 60 ÷ time for one beat. Multiplying the time by 60 gives an impossible answer.</p>';
      if (!isFinite(x)) { fb.className = 'ec__fb is-bad'; fb.innerHTML = '<p>Type the heart rate as a number, then press Check.</p>'; return; }
      if (Math.abs(x - right) <= 1) {
        fb.className = 'ec__fb is-ok';
        fb.innerHTML = '<p><b>Correct.</b> Heart rate = 60 ÷ time for one beat = 60 ÷ ' + fmt2(T) + ' = <b>' + Math.round(right) + ' beats per minute</b>.</p>' +
          '<p>Now try ' + (cur === 2 ? 'strip 1' : 'strip ' + (cur + 2)) + '.</p>';
        return;
      }
      tries++;
      fb.className = 'ec__fb is-bad';
      var why;
      if (Math.abs(x - T * 60) <= 1) why = '<p>You multiplied the time by 60: ' + fmt2(T) + ' × 60 = ' + n2(T * 60) + '. ' + sense + ' Divide 60 by the time instead.</p>';
      else if (Math.abs(x - 1 / T) <= .05) why = '<p>That is the number of beats in one second. Multiply it by 60 to find the beats in one minute, or divide 60 by the time for one beat.</p>';
      else why = '<p>Not yet. Use the working: heart rate = 60 ÷ time for one beat = 60 ÷ ' + fmt2(T) + '.</p>';
      fb.innerHTML = why + golden + (tries >= 2 ? '<p class="ec__ans">The answer: 60 ÷ ' + fmt2(T) + ' = <b>' + Math.round(right) + ' beats per minute</b>.</p>' : '<p>Calculate it and check again.</p>');
      void S;
    }
    chk.addEventListener('click', check);
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); check(); } });
    clr.addEventListener('click', function () { picks = []; fb.innerHTML = ''; fb.className = 'ec__fb'; inp.value = ''; tries = 0; draw(); status(); });
    function choose(i) { cur = i; picks = []; fb.innerHTML = ''; fb.className = 'ec__fb'; inp.value = ''; tries = 0; draw(); status(); }

    /* the named waves, on one beat drawn larger: not asked in 0610 */
    var NW = 640, NH = 320, NB = 240, NMM = 16, NX0 = 180, NX1 = 460;
    function drawNames() {
      var S = STRIPS[0], pxs = NMM * SPEED, rT = S.first + S.rr, t0 = rT - .26, s = '', mv = 10 * NMM;
      var tr = ecTrace({ rr: S.rr, first: S.first, pr: S.pr, pd: S.pd, pa: S.pa, td: S.td, ta: S.ta }, NX0, NX1, pxs, NB, mv, t0);
      var pPk = rT - .04 - S.pr + S.pd / 2, qt = .4 * Math.sqrt(S.rr), tPk = rT - .04 + qt - S.td + S.td * Math.pow(.5, 1 / 1.25);
      s += '<rect x="0" y="0" width="' + NW + '" height="' + NH + '" rx="14" class="ec__nbg"/>' +
           '<rect x="' + NX0 + '" y="0" width="' + (NX1 - NX0) + '" height="' + NH + '" class="ec__paper"/>' + ecGrid(NX1 - NX0, NH, NMM, NX0, 0) +
           '<path class="ec__trace" d="' + tr + '"/>';
      s += L.labels({ items: [
        { id: 'p', text: 'P wave', x: NX0 + (pPk - t0) * pxs, y: NB - S.pa * mv, side: 'L' },
        { id: 'qrs', text: 'QRS spike', x: NX0 + (rT - t0) * pxs, y: NB - 1.25 * mv, side: 'L' },
        { id: 't', text: 'T wave', x: NX0 + (tPk - t0) * pxs, y: NB - S.ta * mv, side: 'R' }
      ], left: NX0, right: NX1, font: Math.max(18, Math.round(fontPx * NW / EC_W * 1.15)), width: 160, top: 6, bottom: NH - 6, gap: 6 });
      names.innerHTML = '<p class="ec__fence">Extension: 0610 does not ask you to name the waves.</p>' +
        '<svg viewBox="0 0 ' + NW + ' ' + NH + '" class="ec__nsvg" role="img" aria-label="One beat of the ECG, drawn larger, with its three waves named: the P wave, the QRS spike and the T wave.">' + s + '</svg>' +
        '<ul class="ec__nlist"><li><b>P wave</b>: the electrical signal spreads over the atria, just before they contract.</li>' +
        '<li><b>QRS spike</b>: the signal spreads through the ventricles, just before they contract.</li>' +
        '<li><b>T wave</b>: the ventricles recover.</li></ul>';
    }
    namesBtn.addEventListener('click', function () {
      names.hidden = !names.hidden;
      namesBtn.setAttribute('aria-expanded', names.hidden ? 'false' : 'true');
      namesBtn.classList.toggle('is-on', !names.hidden);
      if (!names.hidden) drawNames();
    });

    function fit() {
      var f = fontFor(svg, EC_W, 18, 34);
      if (f && f !== fontPx) { fontPx = f; draw(); if (!names.hidden) drawNames(); }
    }
    var ro = observe(fig, fit);
    box.__onReset = function () { if (ro) ro.disconnect(); };
    /* 0 plain · 1 one spike · 2 two spikes · 3 a wrong answer (time x 60) · 4 the right answer · 5 the waves named */
    box.__seek = function (t) {
      var S = STRIPS[cur], rs = rsIn(S), k = Math.floor(t);
      picks = k >= 1 ? [rs[1]] : []; if (k >= 2) picks.push(rs[2]);
      fb.innerHTML = ''; fb.className = 'ec__fb'; inp.value = ''; tries = 0;
      draw(); status();
      if (k === 3) { inp.value = n2(time() * 60); check(); }
      if (k >= 4) { inp.value = String(Math.round(60 / time())); check(); }
      if (k >= 5 && names.hidden) namesBtn.click();
      return [0, 1, 2, 3, 4, 5];
    };
    draw(); status();
    return box;
  }

  L.add('oneway', oneway);
  L.add('circuit', circuit);
  L.add('pulse', pulse);
  L.add('ecg', ecg);
})(window);
