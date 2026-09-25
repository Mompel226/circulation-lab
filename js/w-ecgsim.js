/* ============================================================
   w-ecgsim.js — "Why an ECG has peaks and troughs": beyond the syllabus, in the Monitoring the heart
   station, and linked from the "what starts each beat" box of Inside the heart.

     { after: 6, type: 'ecgsim', onStage: true, title: 'Why an ECG has peaks and troughs', ask: '…' }

   Daniel, 25 Sep 2026: show "how the signal starts in the sinoatrial node and then it spreads out",
   and "why you see peaks and troughs depending on where you place the electrodes"; from the
   normal physiology in Ninja Nerd's lecture "ECG Basics | How to Read & Interpret ECGs" (Zach
   Murphy, youtube.com/watch?v=CNN30YHsJw0; chapters: isoelectric line, downward deflection, upward
   deflection, PR interval, leads). Nothing about disease.

   What it shows, one step at a time (the lab's step player: each step stops until Next step):
     the heart as the lab draws it (js/heart-art.js), its muscle as cells (js/ecg-cells.js) that
     light up when the signal reaches them and go dark when they recover; the conduction system
     (SA node, AV node, bundle of His, bundle branches, Purkinje fibres); the direction the signal
     is moving now, as an arrow; the electrodes; and the ECG drawn as the beat goes on.
   The one rule it teaches (the lecture's upward and downward deflections): the signal moving
   TOWARDS the + electrode draws the line UP, moving AWAY draws it DOWN, and at right angles to
   the lead, or with nothing moving, the line is FLAT — the isoelectric line.

   THE PHYSIOLOGY, and where it comes from
     Order and timing: SA node → both atria (about 0.1 s: the P wave) → AV node, which holds the
     signal about 0.1 s (the PR segment; PR interval normally 0.12–0.20 s) → bundle of His → the
     septum, from its left side to its right (the small Q wave in the leads that look from the left)
     → bundle branches to the apex → Purkinje fibres through the ventricle walls, from the inside of
     the wall outwards (the R wave) → the base of the ventricles last (the S wave); QRS under 0.12 s
     → all the ventricle muscle excited together (the flat ST segment) → the ventricles recover, from
     the outside of the wall inwards (the T wave); the atria recover during the QRS, hidden by it.
     OpenStax Anatomy and Physiology 2e (2022, CC BY 4.0), 19.2 Cardiac Muscle and Electrical
     Activity (conduction system, the ECG's waves, the AV node delay of about 100 ms) and the lecture.
     The heart's electrical axis, normally about +60 degrees (down and to the person's left), and the
     angles of the six limb leads (I 0, II +60, III +120, aVR −150, aVL −30, aVF +90): the hexaxial
     reference system in the lecture's "leads" chapter. The trace in each lead is the heart's
     electrical vector projected on to that lead's direction; the vector here is a sum of five waves
     (P, septal Q, R, S, T) with directions and sizes chosen to give the textbook normal traces
     (upright P, QRS and T in lead II; all three inverted in aVR; a septal q in lead I under a
     quarter of the R; the late r in aVR under 0.3 mV).
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h, esc = L.esc, mk = L.mk;
  var NS = 'http://www.w3.org/2000/svg';

  /* ---------- the heart's electrical vector, in the frontal plane ----------
     degrees: 0 = towards the person's left (your right, looking at them), +90 = down */
  var WAVES = [
    { k: 'P', c: 46, s1: 20, s2: 20, a: 0.2, dir: 55 },
    { k: 'Q', c: 170, s1: 6, s2: 6, a: 0.18, dir: 160 },
    { k: 'R', c: 198, s1: 10, s2: 10, a: 1.4, dir: 55 },
    { k: 'S', c: 226, s1: 7, s2: 7, a: 0.38, dir: -110 },
    { k: 'T', c: 410, s1: 55, s2: 35, a: 0.38, dir: 45 }
  ];
  var BEAT = 800;              /* ms: 75 beats a minute */
  function gauss(t, w) { var s = t < w.c ? w.s1 : w.s2, d = (t - w.c) / s; return Math.exp(-0.5 * d * d); }
  function vecAt(t) {
    var x = 0, y = 0;
    WAVES.forEach(function (w) { var g = w.a * gauss(t, w), r = w.dir * Math.PI / 180; x += g * Math.cos(r); y += g * Math.sin(r); });
    return [x, y];
  }
  function volt(t, ang) { var v = vecAt(t), r = ang * Math.PI / 180; return v[0] * Math.cos(r) + v[1] * Math.sin(r); }
  /* the QRS's deflections in one lead, named as an ECG is read (the lecture's naming): the first dip
     before any rise is Q; every rise is R (a second one R'); a dip after a rise is S. A wave less than
     half the size of the biggest in the complex takes a small letter: q, r, s. */
  function qrsNames(ang) {
    /* split the complex where the line crosses the baseline; each part is one wave, at its peak */
    var parts = [], cur = null;
    for (var t = 154; t <= 250; t += 1) {
      var v = volt(t, ang), sg = v > 0.03 ? 1 : v < -0.03 ? -1 : 0;
      if (!sg) { cur = null; continue; }
      if (!cur || cur.sg !== sg) { cur = { sg: sg, t: t, v: v }; parts.push(cur); }
      else if (Math.abs(v) > Math.abs(cur.v)) { cur.t = t; cur.v = v; }
    }
    var big = Math.max.apply(null, parts.map(function (e) { return Math.abs(e.v); }).concat([0.001])), seenR = false, rs = 0;
    return parts.map(function (e) {
      var k = e.v < 0 ? (seenR ? 'S' : 'Q') : (rs++ ? 'R′' : 'R');
      if (e.v > 0) seenR = true;
      if (Math.abs(e.v) < 0.5 * big) k = k.toLowerCase();
      return { t: e.t, v: e.v, k: k };
    });
  }


  /* ---------- the leads ---------- */
  var LEADS = [
    { id: 'I', name: 'Lead I', ang: 0, plus: 'LA', minus: 'RA', say: '− on the right arm, + on the left arm' },
    { id: 'II', name: 'Lead II', ang: 60, plus: 'LL', minus: 'RA', say: '− on the right arm, + on the left leg' },
    { id: 'III', name: 'Lead III', ang: 120, plus: 'LL', minus: 'LA', say: '− on the left arm, + on the left leg' },
    { id: 'aVR', name: 'aVR', ang: -150, plus: 'RA', minus: 'C', say: '+ on the right arm; − is the other two limbs together' },
    { id: 'aVL', name: 'aVL', ang: -30, plus: 'LA', minus: 'C', say: '+ on the left arm; − is the other two limbs together' },
    { id: 'aVF', name: 'aVF', ang: 90, plus: 'LL', minus: 'C', say: '+ on the left leg; − is the two arms together' }
  ];

  /* ---------- the steps: ms of the beat each one covers, and its words ---------- */
  var STEPS = [
    { ms: [0, 100], wave: 'P', h: 'The SA node fires',
      p: 'The beat starts in the _sinoatrial node_ (SA node), the heart’s pacemaker, in the wall of the right atrium. A wave of electrical activity spreads from it across both atria, and they contract. It moves down and to the heart’s left side (on your right in the drawing), towards the ventricles. This wave draws the P wave.' },
    { ms: [100, 160], wave: null, h: 'The AV node holds the signal',
      p: 'The signal reaches the _atrioventricular node_ (AV node), between the atria and the ventricles, and is held there for about 0.1 s, so the atria finish emptying before the ventricles contract. So little tissue is active that nothing is recorded: the line is flat. This is the PR segment. From the start of P to the start of the next wave is the PR interval, normally 0.12 to 0.20 s.' },
    { ms: [160, 182], wave: 'Q', h: 'The septum goes first',
      p: 'The signal passes along the _bundle of His_ into the septum. The septum is excited from its left side to its right, so this small wave moves to the right. Seen from the left (lead I or aVL), it draws a small trough: the Q wave.' },
    { ms: [182, 214], wave: 'R', h: 'Down to the apex and out through the walls',
      p: 'The signal passes along the left and right _bundle branches_ to the apex, then through the ventricle walls in the _Purkinje fibres_, from the inside of each wall to the outside. The left ventricle has far more muscle than the right, so the biggest wave moves down and to the heart’s left side. In lead II this draws the R wave, the tallest peak.' },
    { ms: [214, 240], wave: 'S', h: 'The top of the ventricles last',
      p: 'The last muscle to be excited is at the top of the ventricles, near the valves, so the wave now moves up. In lead II this draws the S wave, a small trough. Q, R and S together are the QRS complex, less than 0.12 s long. It is much bigger than the P wave because the ventricles have much more muscle than the atria.' },
    { ms: [240, 330], wave: null, h: 'All the ventricle muscle is excited',
      p: 'Every ventricle cell is excited, and the ventricles are contracting. No wave is moving, so the line is flat again: the ST segment. The atria have recovered by now: the small wave of their recovery was hidden inside the QRS complex.' },
    { ms: [330, 500], wave: 'T', h: 'The ventricles recover',
      p: 'The ventricle cells recover, ready for the next beat. Recovery starts at the outside of each wall and moves inwards, the opposite way to the first wave. A recovery wave moving away from the + electrode draws the same shape as a signal moving towards it, so the T wave usually points the same way as the biggest wave of the QRS complex.' },
    { ms: [500, 800], wave: null, h: 'Rest until the next beat',
      p: 'The whole heart is at rest and the line is flat: the isoelectric line. Then the SA node fires again. At 75 beats a minute one beat lasts 0.8 s, so the next P wave starts here.' }
  ];
  function words(s) { return String(s).replace(/_/g, '').split(/\s+/).length; }
  (function () {
    var t = 0;
    STEPS.forEach(function (st) { st.t = t; st.dur = Math.max(7, Math.ceil((words(st.h) + words(st.p)) / 4) + 2); t += st.dur; });
    STEPS.end = t;
  })();

  /* ---------- the drawing's frame ----------
     the three limb electrodes at the corners of Einthoven's triangle, the heart in the middle */
  var W = 600, H = 720;
  var E = { RA: [92, 66], LA: [508, 66], LL: [300, 426], C: [300, 196] };
  var HEART = { tx: 300, ty: 196, k: 0.78, ox: 206, oy: 300 };   /* heart-art's point (ox, oy) sits at (tx, ty) */
  function hx(x) { return HEART.tx + (x - HEART.ox) * HEART.k; }
  function hy(y) { return HEART.ty + (y - HEART.oy) * HEART.k; }
  var STRIP = { x: 20, y: 470, w: 560, h: 230, base: 594, mv: 62 };   /* one beat across the strip; 62 px per mV */
  function sx(ms) { return STRIP.x + ms / BEAT * STRIP.w; }
  function sy(v) { return STRIP.base - v * STRIP.mv; }
  /* the conduction system, in heart-art's frame */
  var COND = {
    sa: [110, 164], av: [186, 262],
    atrial: 'M110 164 C130 196 160 232 186 262 M110 164 C100 200 110 236 150 256 C164 260 176 262 186 262 M110 164 C170 156 240 158 290 172',
    his: 'M186 262 C192 268 198 276 200 290',
    rbb: 'M200 290 C198 330 200 370 208 404',
    lbb: 'M200 290 C208 322 214 352 222 384 C226 396 230 404 236 410',
    purk: 'M208 404 C184 416 152 408 118 384 C92 364 74 332 66 298 M208 404 C196 430 170 432 150 424 ' +
          'M236 410 C262 432 300 426 324 404 C344 378 352 340 352 300 M236 410 C252 442 280 440 300 430 ' +
          'M118 384 C110 360 104 336 100 310 M324 404 C330 378 334 350 334 322'
  };
  function sv(name, attrs) { var e = document.createElementNS(NS, name); for (var k in attrs) e.setAttribute(k, attrs[k]); return e; }
  function n1(v) { return Math.round(v * 10) / 10; }

  function tracePath(ang, upto) {
    var d = '', step = 4;
    for (var t = 0; t <= upto + 0.01; t += step) d += (t ? 'L' : 'M') + n1(sx(t)) + ' ' + n1(sy(volt(t, ang)));
    return d;
  }
  /* the mechanical beat that follows the electrical one: the atria contract after P, the ventricles
     through the ST segment */
  function beatState(ms) {
    function hump(a, b) { if (ms <= a || ms >= b) return 0; return Math.sin(Math.PI * (ms - a) / (b - a)); }
    return { atria: hump(70, 170), vent: hump(200, 460), av: ms < 180 || ms > 470 ? 1 : 0, sl: ms > 232 && ms < 450 ? 1 : 0 };
  }

  L.add('ecgsim', function (spec) {
    var box = h('div', 'widget es');
    box.appendChild(L.head(spec.title || 'Why an ECG has peaks and troughs', spec.ask || '', 'Press play'));
    box.appendChild(h('p', 'es__beyond', '<b>Beyond the syllabus.</b> 0610 asks you to know that an ECG records the heart’s electrical activity, not why its line rises and falls. Here for anyone who wants to see it.'));
    /* the one rule */
    box.appendChild(h('div', 'es__rule',
      '<b>How an ECG draws its line</b>' +
      '<span><i class="es__up" aria-hidden="true">▲</i> The signal moves <b>towards</b> the + electrode: the line <b>rises</b> (a peak).</span>' +
      '<span><i class="es__dn" aria-hidden="true">▼</i> It moves <b>away</b> from the + electrode: the line <b>falls</b> (a trough).</span>' +
      '<span><i class="es__fl" aria-hidden="true">▬</i> It moves at right angles to the lead, or nothing moves: the line is <b>flat</b>.</span>'));

    /* where the + electrode is */
    var pick = h('div', 'es__leads'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Choose the lead');
    var leadBtns = {};
    LEADS.concat([{ id: 'free', name: 'Move it yourself', say: 'drag the + electrode round the heart' }]).forEach(function (ld) {
      var b = h('button', 'es__lead', '<b>' + esc(ld.name) + '</b><small>' + esc(ld.say) + '</small>'); b.type = 'button';
      b.addEventListener('click', function () { setLead(ld.id); });
      pick.appendChild(b); leadBtns[ld.id] = b;
    });
    box.appendChild(pick);
    var barSlot = h('div', 'es__barslot'); box.appendChild(barSlot);
    var listSlot = h('div', 'es__listslot'); box.appendChild(listSlot);
    /* the whole beat in every lead, side by side: the same beat, six different lines */
    var minis = h('div', 'es__minis');
    minis.appendChild(h('p', 'es__minih', 'The same beat, seen by each lead'));
    var miniGrid = h('div', 'es__minig'); minis.appendChild(miniGrid);
    LEADS.forEach(function (ld) {
      var b = h('button', 'es__mini'); b.type = 'button'; b.setAttribute('aria-label', ld.name + ': show this lead');
      var s = sv('svg', { viewBox: '0 0 160 70', 'aria-hidden': 'true' });
      var d = '';
      for (var t = 0; t <= BEAT; t += 6) d += (t ? 'L' : 'M') + n1(8 + t / BEAT * 144) + ' ' + n1(38 - volt(t, ld.ang) * 20);
      s.innerHTML = '<line x1="8" y1="38" x2="152" y2="38" class="es__minibase"/><path d="' + d + '" class="es__minitrace"/>';
      b.appendChild(s); b.appendChild(h('span', 'es__mininame', esc(ld.name)));
      b.addEventListener('click', function () { setLead(ld.id); });
      miniGrid.appendChild(b); ld.mini = b;
    });
    box.appendChild(minis);
    box.appendChild(h('p', 'widget__note', 'A simplified heart. The six limb leads see the signal move up, down, left and right, as drawn here. A real ECG also has six chest leads, which see it move towards the front or the back of the chest. Seen from a lead that points the same way as the heart’s main electrical direction (lead II), the P, R and T waves all point up. Seen from the other side (aVR), they all point down. It is the same beat. A small wave is named with a small letter (q, r, s). On the ECG paper one small square is 0.04 s wide, as on a real ECG; the heights are not to scale. Source: the conduction system and the waves, OpenStax Anatomy and Physiology 2e, section 19.2; the leads and deflections, Ninja Nerd, “ECG Basics”.'));

    /* ---------- the pack: the drawing, and what it is doing now ---------- */
    var pack = h('div', 'es__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'Why an ECG has peaks and troughs')); packT.hidden = true;
    pack.appendChild(packT);
    var fig = h('figure', 'es__fig');
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'es__svg', role: 'img',
      'aria-label': 'The heart seen from the front, with its conduction system, three limb electrodes at the corners of a triangle round it, and an ECG strip below that draws the beat as it happens.' });
    fig.appendChild(svg);
    var now = h('p', 'es__now'); now.setAttribute('aria-live', 'polite');
    pack.appendChild(fig); pack.appendChild(now);
    var home = h('div', 'es__home'); home.appendChild(pack);
    box.insertBefore(home, pick);

    /* static layers, then the moving ones */
    var u = 'es' + Math.round(Math.random() * 1e6);
    var grid = '';
    for (var gx = 0; gx <= STRIP.w + 0.1; gx += 28) grid += '<line x1="' + n1(STRIP.x + gx) + '" y1="' + STRIP.y + '" x2="' + n1(STRIP.x + gx) + '" y2="' + (STRIP.y + STRIP.h) + '" class="' + (Math.round(gx / 28) % 5 === 0 ? 'es__g2' : 'es__g1') + '"/>';
    for (var gy = 0; gy <= STRIP.h + 0.1; gy += 23) grid += '<line x1="' + STRIP.x + '" y1="' + n1(STRIP.y + gy) + '" x2="' + (STRIP.x + STRIP.w) + '" y2="' + n1(STRIP.y + gy) + '" class="' + (Math.round(gy / 23) % 5 === 0 ? 'es__g2' : 'es__g1') + '"/>';
    svg.innerHTML =
      '<defs><filter id="' + u + 'glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>' +
      [['up', '#56D38A'], ['down', '#FF7A6E'], ['flat', '#B8C4CC'], ['axis', '#9BE3A8']].map(function (m) {
        return '<marker id="' + u + m[0] + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="' + m[1] + '"/></marker>';
      }).join('') + '</defs>' +
      '<rect x="0" y="0" width="' + W + '" height="460" rx="16" class="es__bg"/>' +
      '<path d="M' + E.RA + 'L' + E.LA + 'L' + E.LL + 'Z" class="es__tri"/>' +
      '<g class="es__heart" transform="translate(' + n1(HEART.tx - HEART.ox * HEART.k) + ' ' + n1(HEART.ty - HEART.oy * HEART.k) + ') scale(' + HEART.k + ')">' +
        (global.HeartArt ? global.HeartArt.svg({ av: 1, sl: 0, atria: 0, vent: 0 }, { mode: 'section', rightPV: false }) : '') +
        '<g class="es__cells"></g>' +
        '<g class="es__cond"><path d="' + COND.atrial + '" class="es__c es__c--atrial"/><path d="' + COND.his + '" class="es__c es__c--his"/>' +
          '<path d="' + COND.rbb + ' ' + COND.lbb + '" class="es__c es__c--bb"/><path d="' + COND.purk + '" class="es__c es__c--purk"/>' +
          '<circle cx="' + COND.sa[0] + '" cy="' + COND.sa[1] + '" r="9" class="es__node es__node--sa"/><circle cx="' + COND.av[0] + '" cy="' + COND.av[1] + '" r="8" class="es__node es__node--av"/></g>' +
      '</g>' +
      '<g class="es__names"></g><g class="es__lead"></g><g class="es__vec"></g>' +
      '<rect x="' + STRIP.x + '" y="' + STRIP.y + '" width="' + STRIP.w + '" height="' + STRIP.h + '" class="es__paper"/>' + grid +
      '<line x1="' + STRIP.x + '" y1="' + STRIP.base + '" x2="' + (STRIP.x + STRIP.w) + '" y2="' + STRIP.base + '" class="es__iso"/>' +
      '<g class="es__marks"></g><path class="es__trace" d=""/><circle class="es__pen" r="5" cx="' + STRIP.x + '" cy="' + STRIP.base + '"/>' +
      '<text x="' + (STRIP.x + STRIP.w - 8) + '" y="' + (STRIP.y + 18) + '" class="es__stripname" text-anchor="end"></text>';
    var g = {
      cells: svg.querySelector('.es__cells'), lead: svg.querySelector('.es__lead'), vec: svg.querySelector('.es__vec'), names: svg.querySelector('.es__names'),
      trace: svg.querySelector('.es__trace'), pen: svg.querySelector('.es__pen'), marks: svg.querySelector('.es__marks'), sname: svg.querySelector('.es__stripname'),
      sa: svg.querySelector('.es__node--sa'), av: svg.querySelector('.es__node--av'), atrial: svg.querySelector('.es__c--atrial'), his: svg.querySelector('.es__c--his'),
      bb: svg.querySelector('.es__c--bb'), purk: svg.querySelector('.es__c--purk')
    };
    var hn = {
      outer: svg.querySelector('.ha__outer'), ra: svg.querySelector('.ha__ra'), la: svg.querySelector('.ha__la'), rv: svg.querySelector('.ha__rv'), lv: svg.querySelector('.ha__lv'),
      av: svg.querySelector('.ha__av'), sl: svg.querySelector('.ha__sl'), cords: svg.querySelectorAll('.ha__cords line')
    };
    /* the cells: one small dot each, lit while the signal holds it */
    var cells = (global.ECG_CELLS || []).map(function (c) {
      var d = sv('circle', { cx: c[0], cy: c[1], r: 3.1, 'class': 'es__cell' });
      g.cells.appendChild(d);
      return { el: d, t: c[3], r: c[4], on: null };
    });
    /* names on the heart's conduction system, ruled out level to the sides (the lab's rule) */
    var NAMES = [
      { at: COND.sa, text: 'SA node', side: 'R', ms: 0 },
      { at: COND.av, text: 'AV node', side: 'L', ms: 40 },
      { at: [200, 282], text: 'bundle of His', side: 'R', ms: 150 },
      { at: [222, 384], text: 'bundle branches', side: 'R', ms: 160 },
      { at: [100, 316], text: 'Purkinje fibres', side: 'L', ms: 170 }
    ];
    var ELNAME = { RA: 'right arm', LA: 'left arm', LL: 'left leg' };

    var leadId = 'II', freeAng = 60, ms = 0, sp = null, dragging = false;
    function curAng() { if (leadId === 'free') return freeAng; for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === leadId) return LEADS[i].ang; return 60; }
    function curLead() { for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === leadId) return LEADS[i]; return null; }
    function freePos() { var r = freeAng * Math.PI / 180; return [E.C[0] + Math.cos(r) * 212, E.C[1] + Math.sin(r) * 212]; }

    function drawLead() {
      var ld = curLead(), s = '';
      /* the three limb electrodes, always there */
      ['RA', 'LA', 'LL'].forEach(function (k) {
        var p = E[k], on = ld && (ld.plus === k || ld.minus === k), sign = ld ? (ld.plus === k ? '+' : ld.minus === k ? '−' : '') : '';
        s += '<g class="es__el' + (on ? ' is-on' : '') + (ld && ld.plus === k ? ' is-plus' : '') + '"><circle cx="' + p[0] + '" cy="' + p[1] + '" r="17"/>' +
          '<text x="' + p[0] + '" y="' + (p[1] + 6) + '" class="es__elsign">' + sign + '</text>' +
          (k === 'LL' ? '<text x="' + (p[0] + 26) + '" y="' + (p[1] + 5) + '" class="es__elname" text-anchor="start">' + ELNAME[k] + '</text></g>'
            : '<text x="' + p[0] + '" y="' + (p[1] - 24) + '" class="es__elname">' + ELNAME[k] + '</text></g>');
      });
      var ang = curAng(), r = ang * Math.PI / 180, from, to;
      if (ld && ld.minus !== 'C') { from = E[ld.minus]; to = E[ld.plus]; }
      else { from = E.C; to = ld ? E[ld.plus] : freePos(); }
      if (!ld) {
        var fp = freePos();
        s += '<circle cx="' + E.C[0] + '" cy="' + E.C[1] + '" r="212" class="es__ring"/>' +
          '<g class="es__el is-on is-plus es__free"><circle cx="' + n1(fp[0]) + '" cy="' + n1(fp[1]) + '" r="19"/><text x="' + n1(fp[0]) + '" y="' + n1(fp[1] + 6) + '" class="es__elsign">+</text></g>';
      }
      if (!ld || ld.minus === 'C') s += '<g class="es__el is-on"><circle cx="' + E.C[0] + '" cy="' + E.C[1] + '" r="9" class="es__centre"/></g>';
      /* the lead's direction: from − to +, running through the heart's centre */
      var cx = E.C[0], cy = E.C[1], dx = Math.cos(r), dy = Math.sin(r);
      s += '<line x1="' + n1(cx - dx * 170) + '" y1="' + n1(cy - dy * 170) + '" x2="' + n1(cx + dx * 176) + '" y2="' + n1(cy + dy * 176) + '" class="es__axis" marker-end="url(#' + u + 'axis)"/>';
      g.lead.innerHTML = s;
      var deg = Math.round(((ang % 360) + 540) % 360 - 180), near = null;
      LEADS.forEach(function (x) { var d = Math.abs(((deg - x.ang) % 360 + 540) % 360 - 180); if (d <= 12 && (!near || d < near.d)) near = { d: d, name: x.name }; });
      g.sname.innerHTML = ld ? '<tspan>' + esc(ld.name) + '</tspan><tspan class="es__stripsay"> · ' + esc(ld.say) + '</tspan>'
        : '<tspan>Your lead: + at ' + deg + '°</tspan><tspan class="es__stripsay">' + (near ? ' (close to ' + esc(near.name) + ')' : '') + '</tspan>';
      var fr = g.lead.querySelector('.es__free circle');
      if (fr) fr.addEventListener('pointerdown', startDrag);
    }
    function drawNames() {
      var s = '';
      NAMES.forEach(function (nm) {
        var x = hx(nm.at[0]), y = hy(nm.at[1]), x2 = nm.side === 'L' ? 160 : 440;
        s += '<g class="es__name' + (ms >= nm.ms ? ' is-on' : '') + '"><line x1="' + n1(x) + '" y1="' + n1(y) + '" x2="' + x2 + '" y2="' + n1(y) + '"/><circle cx="' + n1(x) + '" cy="' + n1(y) + '" r="2.6"/>' +
          '<text x="' + (nm.side === 'L' ? x2 - 6 : x2 + 6) + '" y="' + n1(y + 4.5) + '" text-anchor="' + (nm.side === 'L' ? 'end' : 'start') + '">' + esc(nm.text) + '</text></g>';
      });
      g.names.innerHTML = s;
    }
    /* everything at one moment of the beat (ms) */
    function paint() {
      var ang = curAng();
      /* the muscle */
      cells.forEach(function (c) {
        var on = ms >= c.t && ms < c.r;
        if (on !== c.on) { c.on = on; c.el.setAttribute('class', 'es__cell' + (on ? ' is-on' : '')); }
      });
      /* the conduction system, each part lit while it carries the signal */
      function lit(el, a, b) { el.classList.toggle('is-on', ms >= a && ms < b); }
      lit(g.sa, 0, 26); lit(g.atrial, 0, 90); lit(g.av, 40, 162); lit(g.his, 150, 172); lit(g.bb, 158, 190); lit(g.purk, 170, 225);
      /* the heart contracting behind it all */
      if (global.HeartArt && hn.outer) {
        var p = global.HeartArt.paths(beatState(ms));
        hn.outer.setAttribute('d', p.outer);
        if (hn.ra) { hn.ra.setAttribute('d', p.ra); hn.la.setAttribute('d', p.la); hn.rv.setAttribute('d', p.rv); hn.lv.setAttribute('d', p.lv); }
        if (hn.av) hn.av.setAttribute('d', p.tri + ' ' + p.mit);
        if (hn.sl) hn.sl.setAttribute('d', p.pulv + ' ' + p.aov);
        for (var i = 0; i < hn.cords.length; i++) { var cd = p.cords[i]; if (cd) { hn.cords[i].setAttribute('x1', n1(cd[0][0])); hn.cords[i].setAttribute('y1', n1(cd[0][1])); } }
      }
      /* the direction the signal is moving now */
      var v = vecAt(ms), mag = Math.hypot(v[0], v[1]), proj = volt(ms, ang), vs = '';
      var kind = mag < 0.03 ? 'none' : Math.abs(proj) < 0.35 * mag ? 'flat' : proj > 0 ? 'up' : 'down';
      if (mag >= 0.03) {
        /* while the ventricles recover, the arrow is the way the RECOVERY moves: the opposite way to
           the electrical direction that draws the line, so the rule still reads true (recovery
           moving away from + draws the line up) */
        var rec = ms >= 330 && ms < 500, sgn = rec ? -1 : 1;
        var Lr = 26 + 88 * Math.min(1.5, mag), x2 = E.C[0] + sgn * v[0] / mag * Lr, y2 = E.C[1] + sgn * v[1] / mag * Lr;
        vs += '<line x1="' + E.C[0] + '" y1="' + E.C[1] + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '" class="es__arrow es__arrow--' + kind + (rec ? ' es__arrow--rec' : '') + '" marker-end="url(#' + u + (kind === 'none' ? 'flat' : kind) + ')"/>';
        if (rec) vs += '<text x="' + n1(x2 + sgn * v[0] / mag * 16) + '" y="' + n1(y2 + sgn * v[1] / mag * 16 + 5) + '" class="es__arrowname">recovery</text>';
      }
      g.vec.innerHTML = vs;
      /* the ECG so far */
      g.trace.setAttribute('d', tracePath(ang, ms));
      g.pen.setAttribute('cx', n1(sx(ms))); g.pen.setAttribute('cy', n1(sy(volt(ms, ang))));
      /* the name of each wave, once it is drawn */
      var m = '';
      function letter(t, vv, k) {
        var y = sy(vv) + (vv >= 0 ? -12 : 22);
        return '<text x="' + n1(sx(t)) + '" y="' + n1(Math.max(STRIP.y + 14, Math.min(STRIP.y + STRIP.h - 6, y))) + '" class="es__wave">' + k + '</text>';
      }
      if (ms >= 52) m += letter(46, volt(46, ang), 'P');
      qrsNames(ang).forEach(function (q) { if (ms >= q.t + 6) m += letter(q.t, q.v, q.k); });
      if (ms >= 440) { var tv = volt(410, ang); if (Math.abs(tv) >= 0.03) m += letter(410, tv, 'T'); }
      if (ms >= 160) m += '<text x="' + n1(sx(130)) + '" y="' + (STRIP.base + 20) + '" class="es__seg">PR</text>';
      if (ms >= 330) m += '<text x="' + n1(sx(285)) + '" y="' + (STRIP.base + 20) + '" class="es__seg">ST</text>';
      g.marks.innerHTML = m;
      drawNames();
      /* in words: what the line is doing now, and why */
      var ld = curLead(), who = ld ? ld.name : 'your lead';
      var line = kind === 'none' ? 'No signal is moving, so the line is <b>flat</b>: the isoelectric line.'
        : kind === 'flat' ? 'The signal is moving almost at right angles to ' + esc(who) + ', so the line hardly changes.'
        : kind === 'up' ? 'The signal is moving <b>towards</b> the + electrode of ' + esc(who) + ', so the line <b>rises</b>.'
        : 'The signal is moving <b>away from</b> the + electrode of ' + esc(who) + ', so the line <b>falls</b>.';
      if (ms >= 330 && ms < 500 && kind !== 'none') line = 'The ventricles are recovering. ' + (kind === 'up' ? 'The recovery moves away from the + electrode of ' + esc(who) + ', so the line <b>rises</b>.'
        : kind === 'down' ? 'The recovery moves towards the + electrode of ' + esc(who) + ', so the line <b>falls</b>.' : 'The recovery moves at right angles to ' + esc(who) + ', so the line hardly changes.');
      now.innerHTML = line;
      /* which lead is chosen, on the buttons and the small traces */
      Object.keys(leadBtns).forEach(function (k) { var on = k === leadId; leadBtns[k].classList.toggle('is-on', on); leadBtns[k].setAttribute('aria-pressed', on ? 'true' : 'false'); });
      LEADS.forEach(function (x) { x.mini.classList.toggle('is-on', x.id === leadId); });
    }
    function setLead(id) { leadId = id; drawLead(); paint(); }

    /* the + electrode, dragged round the heart */
    function startDrag(e) {
      e.preventDefault(); dragging = true;
      try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
      e.target.addEventListener('pointermove', onDrag); e.target.addEventListener('pointerup', endDrag); e.target.addEventListener('pointercancel', endDrag);
    }
    function onDrag(e) {
      if (!dragging) return;
      /* the drawing keeps its shape (xMidYMid meet): one scale for both directions */
      var r = svg.getBoundingClientRect(), k = Math.max(W / r.width, H / r.height);
      var x = (e.clientX - r.left - (r.width - W / k) / 2) * k, y = (e.clientY - r.top - (r.height - H / k) / 2) * k;
      freeAng = Math.atan2(y - E.C[1], x - E.C[0]) * 180 / Math.PI;
      drawLead(); paint();
      var fr = g.lead.querySelector('.es__free circle');
      if (fr && fr !== e.target) { try { fr.setPointerCapture(e.pointerId); } catch (x2) {} fr.addEventListener('pointermove', onDrag); fr.addEventListener('pointerup', endDrag); }
    }
    function endDrag() { dragging = false; }

    /* the step player: each step runs its part of the beat slowly, then waits for Next step */
    function render(t) {
      var k = 0; for (var i = 0; i < STEPS.length; i++) if (t >= STEPS[i].t - 1e-6) k = i;
      var st = STEPS[k], u = Math.min(1, Math.max(0, (t - st.t) / (st.dur * 0.72)));
      ms = st.ms[0] + (st.ms[1] - st.ms[0]) * u;
      if (t >= STEPS.end - 1e-6) ms = BEAT;
      paint();
    }
    sp = L.stepper({ steps: STEPS.map(function (s) { return { t: s.t, h: s.h, p: s.p }; }), end: STEPS.end, render: render });
    barSlot.appendChild(sp.bar);
    listSlot.appendChild(sp.list);
    pack.appendChild(sp.now);

    drawLead(); sp.paint(0);
    /* in the plate's column beside the buttons, on a wide screen (CircLearn.stage) */
    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: home, watch: function () { return box; },
      onPlace: function (inColumn) { packT.hidden = !inColumn; box.classList.toggle('es--staged', inColumn); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { if (sp) sp.stop(); if (stg) stg.detach(); };
    /* for the headless checks: any moment of the beat in any lead */
    box.__seek = function (t, lead) { if (lead) setLead(lead); return sp.seek(t); };
    box.__stepT = function (i, f) { return STEPS[i].t + STEPS[i].dur * (f == null ? 0.75 : f); };
    box.__at = function (m, lead) { if (lead) { leadId = lead; drawLead(); } ms = m; paint(); return { v: volt(m, curAng()), ms: m }; };
    return box;
  });

  /* for the checks: the voltage in a lead at a moment */
  L.ecgVolt = function (t, lead) { for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === lead) return volt(t, LEADS[i].ang); return null; };
  L.ecgQrs = function (lead) { for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === lead) return qrsNames(LEADS[i].ang).map(function (q) { return q.k + '(' + q.v.toFixed(2) + ')'; }).join(' '); return null; };
})(window);
