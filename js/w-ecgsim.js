/* ============================================================
   w-ecgsim.js — "Why an ECG has peaks and troughs": beyond the syllabus, in the Monitoring the heart
   station, and linked from the "what starts each beat" box of Inside the heart.

     { after: 6, type: 'ecgsim', onStage: true, title: 'Why an ECG has peaks and troughs', ask: '…' }

   Daniel, 25 Sep 2026: show "how the signal starts in the sinoatrial node and then it spreads out",
   and "why you see peaks and troughs depending on where you place the electrodes"; from the
   normal physiology in Ninja Nerd's lecture "ECG Basics | How to Read & Interpret ECGs" (Zach
   Murphy, youtube.com/watch?v=CNN30YHsJw0; chapters: isoelectric line, downward deflection, upward
   deflection, PR interval, leads). Nothing about disease.

   What it shows, one step at a time (the lab's step player: each step stops until Next step; Slow,
   Normal and Fast speeds): as on the lab's plate, the body (the plate's own outline) with the four
   limb electrodes where they are really placed, and beside it the heart, magnified (js/heart-art.js).
   Its muscle is soft cells (js/ecg-cells.js): the signal is a bright front sweeping through it, the
   excited muscle glows behind the front, and the recovering muscle cools to blue. A pulse runs along
   each part of the conduction system while it carries the signal, and the numbered markers and their
   key light up in turn (1 SA node, 2 AV node, 3 bundle of His, 4 bundle branches, 5 Purkinje fibres).
   An arrow shows the direction the signal is moving now (dashed while the ventricles recover), and the
   ECG is drawn underneath as the beat goes on. Daniel's second look (25 Sep): bigger, "more
   professional ... the flow of the current", faster or with a speed control, and the body shown with
   "the right arm, left arm, and right and left leg positions".
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
    { k: 'R', c: 202, s1: 8, s2: 10, a: 1.4, dir: 55 },     /* rises as the lower walls are excited (180-204 ms), not before */
    { k: 'S', c: 226, s1: 7, s2: 7, a: 0.38, dir: -110 },
    { k: 'T', c: 410, s1: 34, s2: 30, a: 0.38, dir: 45 }      /* rises as the ventricles start to recover (330 ms), not before */
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

  /* the leads offered: two, not six (Daniel, 25 Sep: "adding all of these different ways of measuring
     the ECG is a bit confusing ... include clearly lead two because it's the main one used, and maybe
     add a different one"). Lead II is what a heart monitor shows; aVR looks from the opposite side, so
     the same beat draws upside down: the clearest way to see that where the + electrode is decides
     whether the line rises or falls. The other four stay in the model and in the checks. */
  var OFFER = [
    { id: 'II', tag: 'the main lead', say: 'what a heart monitor shows: − on the right arm, + on the left leg' },
    { id: 'aVR', tag: 'the opposite side', say: 'looks from the right shoulder: + on the right arm' }
  ];
  function leadOf(id) { for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === id) return LEADS[i]; return null; }

  /* ---------- the steps: ms of the beat each one covers, and its words ---------- */
  var STEPS = [
    { ms: [0, 100], wave: 'P', h: 'The SA node fires',
      p: 'The beat starts in the _sinoatrial node_ (SA node), the heart’s pacemaker, in the wall of the right atrium. A wave of electrical activity spreads from it across both atria, and they contract. It moves down and to the heart’s left side (on your right in the drawing), towards the ventricles. This wave draws the P wave.' },
    { ms: [100, 150], wave: null, h: 'The AV node holds the signal',
      p: 'The signal reaches the _atrioventricular node_ (AV node), between the atria and the ventricles, and is held there for about 0.1 s, so the atria finish emptying before the ventricles contract. So little tissue is active that nothing is recorded: the line is flat. This is the PR segment. From the start of P to the start of the next wave is the PR interval, normally 0.12 to 0.20 s.' },
    { ms: [150, 180], wave: 'Q', h: 'The septum goes first',
      p: 'The signal passes along the _bundle of His_ and down the septum in the two _bundle branches_. The septum is excited from its left side to its right, so this small first wave moves to the right. It moves almost at right angles to lead II, so in lead II the line hardly moves. In aVR, which looks from the right, it draws a small peak.' },
    { ms: [180, 212], wave: 'R', h: 'Down to the apex and out through the walls',
      p: 'At the apex the _Purkinje fibres_ spread the signal over the inside of both ventricles in a moment, and it moves through each wall from the inside to the outside. The left ventricle has far more muscle than the right, so the biggest wave moves down and to the heart’s left side. In lead II this draws the R wave, the tallest peak. In aVR the same wave moves away from the + electrode and draws a deep trough.' },
    { ms: [212, 244], wave: 'S', h: 'The top of the ventricles last',
      p: 'The last muscle to be excited is at the top of the ventricles, near the valves, so the wave now moves up. In lead II this draws the S wave, a small trough. Q, R and S together are the QRS complex, less than 0.12 s long. It is much bigger than the P wave because the ventricles have much more muscle than the atria.' },
    { ms: [244, 330], wave: null, h: 'All the ventricle muscle is excited',
      p: 'Every ventricle cell is excited, and the ventricles are contracting. No wave is moving, so the line is flat again: the ST segment. The atria have recovered by now: the small wave of their recovery was hidden inside the QRS complex.' },
    { ms: [330, 500], wave: 'T', h: 'The ventricles recover',
      p: 'The ventricle cells recover, ready for the next beat. Recovery starts at the outside of each wall and moves inwards, the opposite way to the first wave. It also works the other way round: the surface of resting muscle is positive and of excited muscle negative, so recovery has its positive side behind it, where the signal had it in front. That is why recovery moving away from the + electrode makes the line rise. The two reversals cancel, so the T wave usually points the same way as the biggest wave of the QRS complex.' },
    { ms: [500, 800], wave: null, h: 'Rest until the next beat',
      p: 'The whole heart is at rest and the line is flat: the isoelectric line. Then the SA node fires again. At 75 beats a minute one beat lasts 0.8 s, so the next P wave starts here.' }
  ];
  function words(s) { return String(s).replace(/_/g, '').split(/\s+/).length; }
  /* each step plays its part of the beat in 5 to 9 seconds, then holds until Next step, so the words are
     read while it stands still (Daniel: "it takes a very long time to show the whole process"); the
     speed buttons halve or double it */
  (function () {
    var t = 0;
    STEPS.forEach(function (st) { st.t = t; st.dur = Math.min(9, Math.max(5, Math.round((words(st.h) + words(st.p)) / 8))); t += st.dur; });
    STEPS.end = t;
  })();

  /* ---------- the drawing ----------
     Daniel, 25 Sep, second look: "make it a bit bigger ... more professional, at least the flow of the
     current ... allow to change the speed ... show a little bit more of the body so that you actually
     show the right arm, left arm, and right and left leg positions". So, as on the lab's own plate: the
     body on the left, the four limb electrodes where they are really placed, and the heart beside it,
     magnified, with the signal sweeping through its muscle; the ECG runs underneath. */
  var W = 600, H = 780;
  /* the body: the plate's own outline (LadyofHats, "Circulatory System", public domain; js/circ-art.js),
     its point (bx, by) drawn at (x, y) */
  var BODY = { x: 6, y: 10, k: 0.6456, bx: 9, by: 15 };
  function bx(x) { return BODY.x + (x - BODY.bx) * BODY.k; }
  function by(y) { return BODY.y + (y - BODY.by) * BODY.k; }
  /* the limb electrodes, in the outline's units: on the forearms just above the wrists, and on the lower
     legs just above the ankles. A limb carries the signal like a wire, so it does not matter how far
     down the limb the electrode goes; the right leg's electrode is the earth, not part of any lead */
  var ELEC = { RA: [72, 405], LA: [330, 405], LL: [250, 735], RL: [175, 735] };
  var ELNAME = { RA: 'right arm', LA: 'left arm', LL: 'left leg', RL: 'right leg<tspan class="es__earth"> · earth</tspan>' };
  var BODY_HEART = [238, 247];
  /* the magnified heart */
  var LENS = { x: 240, y: 12, w: 354, h: 458 };
  var HEART = { tx: 417, ty: 222, k: 0.86, ox: 207, oy: 306 };   /* heart-art's point (ox, oy) at (tx, ty) */
  function hx(x) { return HEART.tx + (x - HEART.ox) * HEART.k; }
  function hy(y) { return HEART.ty + (y - HEART.oy) * HEART.k; }
  var C = [HEART.tx, HEART.ty], RING = 166;          /* the + electrode's circle: just clear of the heart */
  var STRIP = { x: 20, y: 540, w: 560, h: 228, base: 660, mv: 62 };   /* one beat across the strip; 62 px per mV */
  function sx(ms) { return STRIP.x + ms / BEAT * STRIP.w; }
  function sy(v) { return STRIP.base - v * STRIP.mv; }

  /* the conduction system, in heart-art's frame, each stretch with the time (ms) the signal runs along it */
  var COND = { sa: [110, 164], av: [186, 262] };
  var WIRES = [
    { d: 'M110 164 C130 196 160 232 186 262', t: [0, 42] },                                 /* SA to AV node, across the right atrium */
    { d: 'M110 164 C100 200 110 236 150 256 C164 260 176 262 186 262', t: [0, 46] },
    { d: 'M110 164 C170 156 240 158 290 172', t: [0, 50] },                                 /* to the left atrium */
    { d: 'M186 262 C192 268 198 276 200 290', t: [150, 164] },                              /* the bundle of His */
    { d: 'M200 290 C198 330 200 370 208 404', t: [158, 176] },                              /* the right bundle branch, down the septum */
    { d: 'M200 290 C208 322 214 352 222 384 C226 396 230 404 236 410', t: [158, 176] },     /* the left bundle branch */
    { d: 'M208 404 C184 416 152 408 118 384 C92 364 74 332 66 298', t: [180, 196] },        /* Purkinje fibres: fast, over the */
    { d: 'M208 404 C196 430 170 432 150 424', t: [180, 190] },                              /* inside of the lower walls */
    { d: 'M236 410 C262 432 300 426 324 404 C344 378 352 340 352 300', t: [180, 198] },
    { d: 'M236 410 C252 442 280 440 300 430', t: [180, 190] },
    { d: 'M118 384 C110 360 104 336 100 310', t: [186, 200] },
    { d: 'M324 404 C330 378 334 350 334 322', t: [188, 202] }
  ];
  /* the numbered markers on the conduction system, and the key under the heart */
  var PINS = [
    { n: 1, at: COND.sa, p: [80, 142], name: 'SA node', on: [0, 30] },
    { n: 2, at: COND.av, p: [150, 262], name: 'AV node', on: [40, 152] },
    { n: 3, at: [200, 282], p: [236, 270], name: 'bundle of His', on: [150, 166] },
    { n: 4, at: [222, 384], p: [258, 372], name: 'bundle branches', on: [158, 180] },
    { n: 5, at: [100, 316], p: [64, 326], name: 'Purkinje fibres', on: [180.01, 204] }
  ];
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
  /* the body's outline, from the plate's drawing */
  function skinPath() {
    var A = global.CIRC_ART && global.CIRC_ART.svg, m = A && /<path[^>]*cp-skin[^>]*>/.exec(A), d = m && /\sd="([^"]+)"/.exec(m[0]);
    return d ? d[1] : null;
  }

  L.add('ecgsim', function (spec) {
    var box = h('div', 'widget es');
    box.appendChild(L.head(spec.title || 'Why an ECG has peaks and troughs', spec.ask || '', 'Press play'));
    box.appendChild(h('p', 'es__beyond', '<b>Beyond the syllabus.</b> 0610 asks you to know that an ECG records the heart’s electrical activity, not why its line rises and falls. Here for anyone who wants to see it.'));
    /* the one rule */
    var ruleEl; box.appendChild(ruleEl = h('div', 'es__rule',
      '<b>How an ECG draws its line</b>' +
      '<span><i class="es__up" aria-hidden="true">▲</i> The signal moves <b>towards</b> the + electrode: the line <b>rises</b> (a peak).</span>' +
      '<span><i class="es__dn" aria-hidden="true">▼</i> It moves <b>away</b> from the + electrode: the line <b>falls</b> (a trough).</span>' +
      '<span><i class="es__fl" aria-hidden="true">▬</i> It moves at right angles to the lead, or nothing moves: the line is <b>flat</b>.</span>' +
      '<span class="es__rec"><i class="es__rc" aria-hidden="true">⇢</i> <b>Recovery</b> (the T wave) is the other way round: recovery moving <b>away</b> from the + electrode makes the line <b>rise</b>. ' +
        'Why: the surface of resting muscle is positive and of excited muscle negative, so the signal has its positive side in front of it, and recovery has its positive side behind it.</span>'));

    /* where the + electrode is */
    var pick = h('div', 'es__leads'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Choose the lead');
    var leadBtns = {};
    OFFER.map(function (o) { return { id: o.id, name: leadOf(o.id).name, tag: o.tag, say: o.say }; })
      .concat([{ id: 'free', name: 'Move it yourself', say: 'drag the + electrode round the heart' }]).forEach(function (ld) {
      var b = h('button', 'es__lead', '<b>' + esc(ld.name) + (ld.tag ? ' <span class="es__tag">' + esc(ld.tag) + '</span>' : '') + '</b><small>' + esc(ld.say) + '</small>'); b.type = 'button';
      b.addEventListener('click', function () { setLead(ld.id); });
      pick.appendChild(b); leadBtns[ld.id] = b;
    });
    box.appendChild(pick);
    var barSlot = h('div', 'es__barslot'); box.appendChild(barSlot);
    /* how fast the beat plays */
    var speed = 1;
    var spd = h('div', 'es__speed', '<span class="es__speedl">Speed</span>'); spd.setAttribute('role', 'group'); spd.setAttribute('aria-label', 'Speed');
    var spdBtns = [[0.5, 'Slow'], [1, 'Normal'], [2, 'Fast']].map(function (o) {
      var b = h('button', 'es__spd', o[1]); b.type = 'button';
      b.addEventListener('click', function () { speed = o[0]; spdBtns.forEach(function (x) { x.b.classList.toggle('is-on', x.v === speed); x.b.setAttribute('aria-pressed', x.v === speed ? 'true' : 'false'); }); });
      spd.appendChild(b); return { b: b, v: o[0] };
    });
    spdBtns[1].b.classList.add('is-on'); spdBtns.forEach(function (x) { x.b.setAttribute('aria-pressed', x.v === 1 ? 'true' : 'false'); });
    barSlot.appendChild(spd);
    var listSlot = h('div', 'es__listslot'); box.appendChild(listSlot);
    /* the whole beat in every lead, side by side: the same beat, six different lines */
    var minis = h('div', 'es__minis');
    minis.appendChild(h('p', 'es__minih', 'The same beat, from two places'));
    var miniGrid = h('div', 'es__minig'); minis.appendChild(miniGrid);
    OFFER.map(function (o) { return leadOf(o.id); }).forEach(function (ld) {
      var b = h('button', 'es__mini'); b.type = 'button'; b.setAttribute('aria-label', ld.name + ': show this lead');
      var s = sv('svg', { viewBox: '0 0 160 70', 'aria-hidden': 'true' });
      var d = '';
      for (var t = 0; t <= BEAT; t += 6) d += (t ? 'L' : 'M') + n1(8 + t / BEAT * 144) + ' ' + n1(38 - volt(t, ld.ang) * 20);
      s.innerHTML = '<line x1="8" y1="38" x2="152" y2="38" class="es__minibase"/><path d="' + d + '" class="es__minitrace"/>';
      b.appendChild(s); b.appendChild(h('span', 'es__mininame', esc(ld.name) + (ld.id === 'II' ? ': P, R and T point up' : ': the same waves point down')));
      b.addEventListener('click', function () { setLead(ld.id); });
      miniGrid.appendChild(b); ld.mini = b;
    });
    box.appendChild(minis);
    box.appendChild(h('p', 'widget__note', 'A simplified heart. A real ECG records the same beat from twelve places: six from the limbs, as here, and six across the chest. Lead II, the one a heart monitor shows, looks along the heart’s main electrical direction, so the P, R and T waves all point up. aVR looks from the opposite side, so they all point down. It is the same beat. A small wave is named with a small letter (q, r, s). On the ECG paper one small square is 0.04 s wide, as on a real ECG; the heights are not to scale. The limb electrodes can go anywhere on the limb: a limb carries the signal like a wire. Source: the conduction system and the waves, OpenStax Anatomy and Physiology 2e, section 19.2; the leads and deflections, Ninja Nerd, “ECG Basics”; the body, LadyofHats (public domain).'));

    /* ---------- the pack: the drawing, and what it is doing now ---------- */
    var pack = h('div', 'es__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'Why an ECG has peaks and troughs')); packT.hidden = true;
    pack.appendChild(packT);
    var fig = h('figure', 'es__fig');
    var svg = sv('svg', { viewBox: '0 0 ' + W + ' ' + H, 'class': 'es__svg', role: 'img',
      'aria-label': 'A body with electrodes on both forearms and both lower legs; beside it the heart, magnified, with its conduction system and the electrical signal spreading through it; below, an ECG strip that draws the beat as it happens.' });
    fig.appendChild(svg);
    var now = h('p', 'es__now'); now.setAttribute('aria-live', 'polite');
    var hkey = h('p', 'es__hkey', PINS.map(function (p) { return '<span data-n="' + p.n + '"><b>' + p.n + '</b> ' + esc(p.name) + '</span>'; }).join(''));
    hkey.setAttribute('aria-hidden', 'true');
    pack.appendChild(fig); pack.appendChild(hkey); pack.appendChild(now);
    var home = h('div', 'es__home'); home.appendChild(pack);
    box.insertBefore(home, pick);

    /* static layers, then the moving ones */
    var u = 'es' + Math.round(Math.random() * 1e6);
    var grid = '';
    for (var gx = 0; gx <= STRIP.w + 0.1; gx += 28) grid += '<line x1="' + n1(STRIP.x + gx) + '" y1="' + STRIP.y + '" x2="' + n1(STRIP.x + gx) + '" y2="' + (STRIP.y + STRIP.h) + '" class="' + (Math.round(gx / 28) % 5 === 0 ? 'es__g2' : 'es__g1') + '"/>';
    for (var gy = 0; gy <= STRIP.h + 0.1; gy += 22.8) grid += '<line x1="' + STRIP.x + '" y1="' + n1(STRIP.y + gy) + '" x2="' + (STRIP.x + STRIP.w) + '" y2="' + n1(STRIP.y + gy) + '" class="' + (Math.round(gy / 22.8) % 5 === 0 ? 'es__g2' : 'es__g1') + '"/>';
    var skin = skinPath();
    var hb = [bx(BODY_HEART[0]), by(BODY_HEART[1])];
    var art = global.HeartArt;
    var small = art ? art.paths({ av: 1, sl: 0, atria: 0, vent: 0 }).outer : '';
    /* the key under the heart: two rows of numbered names */
    var key = '', kx = LENS.x + 16, ky = LENS.y + LENS.h - 32;
    PINS.forEach(function (p, i) {
      if (i === 3) { kx = LENS.x + 16; ky += 20; }
      key += '<g class="es__key" data-n="' + p.n + '"><circle cx="' + (kx + 8) + '" cy="' + (ky - 4) + '" r="8"/><text x="' + (kx + 8) + '" y="' + n1(ky) + '" class="es__keyn">' + p.n + '</text>' +
        '<text x="' + (kx + 21) + '" y="' + n1(ky) + '" class="es__keyt">' + esc(p.name) + '</text></g>';
      kx += 21 + p.name.length * 6.9 + 16;
    });
    svg.innerHTML =
      '<defs>' + [['1', '#FFF6CC', .9], ['2', '#FF9E3D', .34], ['3', '#8FD3FF', .5]].map(function (gr) {
        return '<radialGradient id="' + u + 'g' + gr[0] + '"><stop offset="0" stop-color="' + gr[1] + '" stop-opacity="' + gr[2] + '"/><stop offset=".45" stop-color="' + gr[1] + '" stop-opacity="' + (gr[2] * .7) + '"/><stop offset="1" stop-color="' + gr[1] + '" stop-opacity="0"/></radialGradient>';
      }).join('') +
      '<clipPath id="' + u + 'lens"><rect x="' + LENS.x + '" y="' + LENS.y + '" width="' + LENS.w + '" height="' + LENS.h + '" rx="12"/></clipPath>' +
      [['up', '#56D38A'], ['down', '#FF7A6E'], ['flat', '#B8C4CC'], ['axis', '#9BE3A8']].map(function (m) {
        return '<marker id="' + u + m[0] + '" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="4.5" markerHeight="4.5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="' + m[1] + '"/></marker>';
      }).join('') + '</defs>' +
      '<rect x="0" y="0" width="' + W + '" height="530" rx="16" class="es__bg"/>' +
      /* the body */
      '<text x="12" y="24" class="es__cap">The electrodes</text>' +
      (skin ? '<g transform="translate(' + n1(BODY.x - BODY.bx * BODY.k) + ' ' + n1(BODY.y - BODY.by * BODY.k) + ') scale(' + BODY.k + ')"><g transform="translate(-85.217079,-4.0042005)"><path d="' + skin + '" class="es__body"/></g></g>' : '') +
      (small ? '<path d="' + small + '" class="es__bheart" transform="translate(' + n1(hb[0] - 207 * 0.115) + ' ' + n1(hb[1] - 306 * 0.115) + ') scale(0.115)"/>' : '') +
      '<rect x="' + n1(hb[0] - 23) + '" y="' + n1(hb[1] - 21) + '" width="46" height="42" rx="7" class="es__loupe"/>' +
      '<path d="M' + n1(hb[0] + 23) + ' ' + n1(hb[1] - 21) + 'L' + LENS.x + ' ' + (LENS.y + 10) + 'M' + n1(hb[0] + 23) + ' ' + n1(hb[1] + 21) + 'L' + LENS.x + ' ' + (LENS.y + LENS.h - 10) + '" class="es__cone"/>' +
      '<g class="es__blead"></g><g class="es__elecs"></g>' +
      /* the heart, magnified */
      '<rect x="' + LENS.x + '" y="' + LENS.y + '" width="' + LENS.w + '" height="' + LENS.h + '" rx="12" class="es__lensbg"/>' +
      '<g clip-path="url(#' + u + 'lens)">' +
        '<g class="es__heart" transform="translate(' + n1(HEART.tx - HEART.ox * HEART.k) + ' ' + n1(HEART.ty - HEART.oy * HEART.k) + ') scale(' + HEART.k + ')">' +
          (art ? art.svg({ av: 1, sl: 0, atria: 0, vent: 0 }, { mode: 'section', rightPV: false }) : '') +
          '<g class="es__cells"></g>' +
          '<g class="es__cond">' + WIRES.map(function (w) { return '<path d="' + w.d + '" class="es__c"/>'; }).join('') + '</g>' +
          '<g class="es__pulse">' + WIRES.map(function (w) { return '<path d="' + w.d + '" class="es__p"/>'; }).join('') + '</g>' +
          '<circle cx="' + COND.sa[0] + '" cy="' + COND.sa[1] + '" r="9" class="es__node es__node--sa"/><circle cx="' + COND.av[0] + '" cy="' + COND.av[1] + '" r="8" class="es__node es__node--av"/>' +
          '<g class="es__pins">' + PINS.map(function (p) {
            return '<g class="es__pin" data-n="' + p.n + '"><line x1="' + p.at[0] + '" y1="' + p.at[1] + '" x2="' + p.p[0] + '" y2="' + p.p[1] + '"/><circle cx="' + p.p[0] + '" cy="' + p.p[1] + '" r="11"/>' +
              '<text x="' + p.p[0] + '" y="' + p.p[1] + '">' + p.n + '</text></g>';
          }).join('') + '</g>' +
        '</g>' +
        '<g class="es__leadg"></g><g class="es__vec"></g>' +
      '</g>' +
      '<rect x="' + LENS.x + '" y="' + LENS.y + '" width="' + LENS.w + '" height="' + LENS.h + '" rx="12" class="es__lensrim"/>' +
      '<text x="' + (LENS.x + 12) + '" y="' + (LENS.y + 20) + '" class="es__cap">The heart, magnified</text>' +
      /* what the two arrows mean: solid, the signal spreading; dashed, the recovery */
      '<g class="es__vkey"><rect x="' + (LENS.x + LENS.w - 186) + '" y="' + (LENS.y + 5) + '" width="178" height="22" rx="11" class="es__vkbg"/><line x1="' + (LENS.x + LENS.w - 176) + '" y1="' + (LENS.y + 16) + '" x2="' + (LENS.x + LENS.w - 152) + '" y2="' + (LENS.y + 16) + '" class="es__vk" marker-end="url(#' + u + 'flat)"/>' +
        '<text x="' + (LENS.x + LENS.w - 146) + '" y="' + (LENS.y + 20) + '">signal</text>' +
        '<line x1="' + (LENS.x + LENS.w - 96) + '" y1="' + (LENS.y + 16) + '" x2="' + (LENS.x + LENS.w - 72) + '" y2="' + (LENS.y + 16) + '" class="es__vk es__vk--rec" marker-end="url(#' + u + 'flat)"/>' +
        '<text x="' + (LENS.x + LENS.w - 66) + '" y="' + (LENS.y + 20) + '">recovery</text></g>' +
      '<path d="M' + (LENS.x + 1) + ' ' + (LENS.y + LENS.h - 50) + 'H' + (LENS.x + LENS.w - 1) + 'V' + (LENS.y + LENS.h - 13) + 'a12 12 0 0 1 -12 12H' + (LENS.x + 13) + 'a12 12 0 0 1 -12 -12Z" class="es__keybg"/>' +
      '<g class="es__keys">' + key + '</g>' +
      /* the ECG */
      '<rect x="' + STRIP.x + '" y="' + STRIP.y + '" width="' + STRIP.w + '" height="' + STRIP.h + '" class="es__paper"/>' + grid +
      '<line x1="' + STRIP.x + '" y1="' + STRIP.base + '" x2="' + (STRIP.x + STRIP.w) + '" y2="' + STRIP.base + '" class="es__iso"/>' +
      '<g class="es__marks"></g><path class="es__trace" d=""/><circle class="es__pen" r="5" cx="' + STRIP.x + '" cy="' + STRIP.base + '"/>' +
      '<text x="' + (STRIP.x + STRIP.w - 8) + '" y="' + (STRIP.y + 18) + '" class="es__stripname" text-anchor="end"></text>';
    var g = {
      cells: svg.querySelector('.es__cells'), lead: svg.querySelector('.es__leadg'), vec: svg.querySelector('.es__vec'), blead: svg.querySelector('.es__blead'), elecs: svg.querySelector('.es__elecs'),
      trace: svg.querySelector('.es__trace'), pen: svg.querySelector('.es__pen'), marks: svg.querySelector('.es__marks'), sname: svg.querySelector('.es__stripname'),
      sa: svg.querySelector('.es__node--sa'), av: svg.querySelector('.es__node--av')
    };
    var wires = Array.prototype.map.call(svg.querySelectorAll('.es__c'), function (el, i) { return { base: el, t: WIRES[i].t }; });
    Array.prototype.forEach.call(svg.querySelectorAll('.es__p'), function (el, i) {
      var len = 0; try { len = el.getTotalLength(); } catch (x) {}
      wires[i].pulse = el; wires[i].len = len || 100;
      el.setAttribute('stroke-dasharray', '26 ' + n1(wires[i].len * 2 + 60));
    });
    var pins = Array.prototype.map.call(svg.querySelectorAll('.es__pin'), function (el, i) { return { el: el, on: PINS[i].on, key: svg.querySelector('.es__key[data-n="' + PINS[i].n + '"]'), hkey: hkey.querySelector('[data-n="' + PINS[i].n + '"]') }; });
    var hn = art ? art.nodes(svg.querySelector('.es__heart') || svg) : {};
    /* the muscle, as soft cells: each fades out at its edge, so together they show the signal as a wave
       sweeping through it (a blur filter did the same at a third of the frame rate) */
    var cells = (global.ECG_CELLS || []).map(function (c) {
      var d = sv('circle', { cx: c[0], cy: c[1], r: 12.5, 'class': 'es__cell' });
      g.cells.appendChild(d);
      return { el: d, t: c[3], r: c[4], s: -1 };
    });

    var leadId = 'II', freeAng = 60, ms = 0, sp = null, dragging = false;
    function curAng() { if (leadId === 'free') return freeAng; for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === leadId) return LEADS[i].ang; return 60; }
    function curLead() { for (var i = 0; i < LEADS.length; i++) if (LEADS[i].id === leadId) return LEADS[i]; return null; }
    function freePos() { var r = freeAng * Math.PI / 180; return [C[0] + Math.cos(r) * RING, C[1] + Math.sin(r) * RING]; }
    function ep(k) { return [bx(ELEC[k][0]), by(ELEC[k][1])]; }

    function drawLead() {
      var ld = curLead(), s = '', b = '';
      /* on the body: the four electrodes, the lead's two marked + and − */
      ['RA', 'LA', 'LL', 'RL'].forEach(function (k) {
        var p = ep(k), sign = ld ? (ld.plus === k ? '+' : ld.minus === k || (ld.minus === 'C' && k !== 'RL') ? '−' : '') : '';
        var cls = 'es__el' + (k === 'RL' ? ' is-earth' : '') + (ld && (ld.plus === k || ld.minus === k || (ld.minus === 'C' && k !== 'RL' && ld.plus !== k)) ? ' is-on' : '') + (ld && ld.plus === k ? ' is-plus' : '');
        var tx = k === 'RL' ? p[0] - 13 : k === 'LL' ? p[0] + 13 : p[0], anchor = k === 'RL' ? 'end' : k === 'LL' ? 'start' : 'middle', ty = k === 'RL' || k === 'LL' ? p[1] + 4.5 : p[1] + 25;
        b += '<g class="' + cls + '"><circle cx="' + n1(p[0]) + '" cy="' + n1(p[1]) + '" r="9"/>' +
          '<text x="' + n1(p[0]) + '" y="' + n1(p[1] + 5) + '" class="es__elsign">' + sign + '</text>' +
          '<text x="' + n1(tx) + '" y="' + n1(ty) + '" class="es__elname" text-anchor="' + anchor + '">' + ELNAME[k] + '</text></g>';
      });
      g.elecs.innerHTML = b;
      /* the lead on the body: from its − electrode (or the middle of the other two) to its + electrode */
      var bl = '';
      if (ld) {
        var to = ep(ld.plus), from;
        if (ld.minus !== 'C') from = ep(ld.minus);
        else { var o = ['RA', 'LA', 'LL'].filter(function (k) { return k !== ld.plus; }).map(ep); from = [(o[0][0] + o[1][0]) / 2, (o[0][1] + o[1][1]) / 2]; }
        var dx = to[0] - from[0], dy = to[1] - from[1], len = Math.hypot(dx, dy);
        bl = '<line x1="' + n1(from[0] + dx / len * 12) + '" y1="' + n1(from[1] + dy / len * 12) + '" x2="' + n1(to[0] - dx / len * 14) + '" y2="' + n1(to[1] - dy / len * 14) + '" class="es__baxis" marker-end="url(#' + u + 'axis)"/>';
        if (ld.minus === 'C') bl += '<circle cx="' + n1(from[0]) + '" cy="' + n1(from[1]) + '" r="3.5" class="es__bmid"/>';
      }
      g.blead.innerHTML = bl;
      /* in the heart: the direction the lead looks along, from − to + */
      var ang = curAng(), r = ang * Math.PI / 180, dxl = Math.cos(r), dyl = Math.sin(r);
      s += '<line x1="' + n1(C[0] - dxl * (RING - 30)) + '" y1="' + n1(C[1] - dyl * (RING - 30)) + '" x2="' + n1(C[0] + dxl * (RING - 18)) + '" y2="' + n1(C[1] + dyl * (RING - 18)) + '" class="es__axis" marker-end="url(#' + u + 'axis)"/>';
      if (!ld) s += '<circle cx="' + C[0] + '" cy="' + C[1] + '" r="' + RING + '" class="es__ring"/>';
      var pp = [C[0] + dxl * RING, C[1] + dyl * RING];
      s += '<g class="es__el is-on is-plus' + (ld ? '' : ' es__free') + '"><circle cx="' + n1(pp[0]) + '" cy="' + n1(pp[1]) + '" r="' + (ld ? 12 : 15) + '"/><text x="' + n1(pp[0]) + '" y="' + n1(pp[1] + 5.5) + '" class="es__elsign">+</text></g>';
      g.lead.innerHTML = s;
      var deg = Math.round(((ang % 360) + 540) % 360 - 180), near = null;
      OFFER.forEach(function (o) { var x = leadOf(o.id), d = Math.abs(((deg - x.ang) % 360 + 540) % 360 - 180); if (d <= 12 && (!near || d < near.d)) near = { d: d, name: x.name }; });
      g.sname.innerHTML = ld ? '<tspan>' + esc(ld.name) + '</tspan><tspan class="es__stripsay"> · ' + esc(ld.say) + '</tspan>'
        : '<tspan>Your lead: + at ' + deg + '°</tspan><tspan class="es__stripsay">' + (near ? ' (close to ' + esc(near.name) + ')' : '') + '</tspan>';
      var fr = g.lead.querySelector('.es__free circle');
      if (fr) fr.addEventListener('pointerdown', startDrag);
    }
    /* everything at one moment of the beat (ms) */
    function paint() {
      var ang = curAng();
      /* the muscle: the wave front bright, the excited muscle glowing, the recovering muscle cooling */
      cells.forEach(function (c) {
        var a = ms - c.t, s = a < 0 ? 0 : a < 24 ? 1 : ms < c.r ? 2 : ms < c.r + 70 ? 3 : 0;
        if (s !== c.s) { c.s = s; c.el.setAttribute('class', 'es__cell s' + s); if (s) c.el.setAttribute('fill', 'url(#' + u + 'g' + s + ')'); }
      });
      /* the conduction system: a pulse runs along each stretch while the signal is in it */
      wires.forEach(function (w) {
        var p = (ms - w.t[0]) / (w.t[1] - w.t[0]);
        var live = p > 0 && p < 1.15;
        w.base.classList.toggle('is-on', ms >= w.t[0] && ms < w.t[1] + 40);
        w.pulse.style.visibility = live ? 'visible' : 'hidden';
        if (live) w.pulse.setAttribute('stroke-dashoffset', n1(26 - Math.min(1.15, p) * (w.len + 26)));
      });
      g.sa.classList.toggle('is-on', ms >= 0 && ms < 30);
      g.av.classList.toggle('is-on', ms >= 40 && ms < 152);
      g.av.style.opacity = ms >= 40 && ms < 152 ? n1(0.65 + 0.35 * Math.sin((ms - 40) / 9)) : '';
      pins.forEach(function (p) { var on = ms >= p.on[0] && ms < p.on[1]; p.el.classList.toggle('is-on', on); if (p.key) p.key.classList.toggle('is-on', on); if (p.hkey) p.hkey.classList.toggle('is-on', on); });
      /* the heart contracting behind it all */
      if (art && hn.outer) {
        /* at 0.4 of the full squeeze: the muscle cells and the conduction paths drawn over the walls stay on them */
        art.update(hn, art.paths(beatState(ms), { k: .4 }));
      }
      /* the direction the signal is moving now */
      var v = vecAt(ms), mag = Math.hypot(v[0], v[1]), proj = volt(ms, ang), vs = '';
      var kind = mag < 0.03 ? 'none' : Math.abs(proj) < 0.35 * mag ? 'flat' : proj > 0 ? 'up' : 'down';
      if (mag >= 0.03) {
        /* while the ventricles recover, the arrow is the way the RECOVERY moves: the opposite way to
           the electrical direction that draws the line, so the rule still reads true (recovery
           moving away from + draws the line up) */
        var rec = ms >= 330 && ms < 500, sgn = rec ? -1 : 1;
        var Lr = 24 + 80 * Math.min(1.5, mag), x2 = C[0] + sgn * v[0] / mag * Lr, y2 = C[1] + sgn * v[1] / mag * Lr;
        vs += '<line x1="' + C[0] + '" y1="' + C[1] + '" x2="' + n1(x2) + '" y2="' + n1(y2) + '" class="es__arrow es__arrow--' + kind + (rec ? ' es__arrow--rec' : '') + '" marker-end="url(#' + u + (kind === 'none' ? 'flat' : kind) + ')"/>';
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
      /* in words: what the line is doing now, and why */
      var ld = curLead(), who = ld ? ld.name : 'your lead';
      var line = kind === 'none' ? 'No signal is moving, so the line is <b>flat</b>: the isoelectric line.'
        : kind === 'flat' ? 'The signal is moving almost at right angles to ' + esc(who) + ', so the line hardly changes.'
        : kind === 'up' ? 'The signal is moving <b>towards</b> the + electrode of ' + esc(who) + ', so the line <b>rises</b>.'
        : 'The signal is moving <b>away from</b> the + electrode of ' + esc(who) + ', so the line <b>falls</b>.';
      if (ms >= 330 && ms < 500 && kind !== 'none') line = 'The ventricles are recovering, and recovery is <b>the other way round</b>. ' + (kind === 'up' ? 'It is moving away from the + electrode of ' + esc(who) + ', so the line <b>rises</b>.'
        : kind === 'down' ? 'It is moving towards the + electrode of ' + esc(who) + ', so the line <b>falls</b>.' : 'It is moving at right angles to ' + esc(who) + ', so the line hardly changes.');
      now.innerHTML = line;
      /* which lead is chosen, on the buttons and the small traces */
      Object.keys(leadBtns).forEach(function (k) { var on = k === leadId; leadBtns[k].classList.toggle('is-on', on); leadBtns[k].setAttribute('aria-pressed', on ? 'true' : 'false'); });
      LEADS.forEach(function (x) { if (x.mini) x.mini.classList.toggle('is-on', x.id === leadId); });
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
      freeAng = Math.atan2(y - C[1], x - C[0]) * 180 / Math.PI;
      drawLead(); paint();
      var fr = g.lead.querySelector('.es__free circle');
      if (fr && fr !== e.target) { try { fr.setPointerCapture(e.pointerId); } catch (x2) {} fr.addEventListener('pointermove', onDrag); fr.addEventListener('pointerup', endDrag); }
    }
    function endDrag() { dragging = false; }

    /* the step player: each step plays its part of the beat, then waits for Next step */
    function render(t) {
      var k = 0; for (var i = 0; i < STEPS.length; i++) if (t >= STEPS[i].t - 1e-6) k = i;
      var st = STEPS[k], f = Math.min(1, Math.max(0, (t - st.t) / (st.dur * 0.85)));
      ms = st.ms[0] + (st.ms[1] - st.ms[0]) * f;
      if (t >= STEPS.end - 1e-6) ms = BEAT;
      paint();
    }
    sp = L.stepper({ steps: STEPS.map(function (s) { return { t: s.t, h: s.h, p: s.p }; }), end: STEPS.end, render: render, rate: function () { return speed; } });
    barSlot.insertBefore(sp.bar, spd);
    listSlot.appendChild(sp.list);
    pack.appendChild(sp.now);

    drawLead(); sp.paint(0);
    /* in the plate's column beside the buttons, on a wide screen (CircLearn.stage) */
    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: home, watch: function () { return box; },
      onPlace: function (inColumn) { packT.hidden = !inColumn; box.classList.toggle('es--staged', inColumn); sp.compact(inColumn); order(inColumn); } }) : null;
    /* with the drawing on the left, the buttons, the steps and the step's words come first on the right, then
       the choice of lead and the rule, so the words are never below the screen while the heart is playing */
    function order(inColumn) {
      if (inColumn) { box.insertBefore(barSlot, ruleEl); box.insertBefore(listSlot, ruleEl); box.insertBefore(pick, ruleEl); }
      else { box.insertBefore(ruleEl, barSlot); box.insertBefore(home, barSlot); box.insertBefore(pick, barSlot); }
    }
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
