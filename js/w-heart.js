/* ============================================================
   w-heart.js — the heart's own widgets.
     cycle    one heartbeat, one step at a time: the chambers squeeze, the valves are pushed
              open and shut by the blood, the blood moves only when a valve lets it, and the
              two sounds are marked where the valves close. Built on js/heart-art.js, so it is
              the same heart as the plate.
     sound    a recorded heart sound from the lesson, with a play button
   and the drawing the hotspot questions use: DIAGRAMS.heart, the section with no labels.

   The timing of one beat follows the textbook sequence (Guyton & Hall, Textbook of Medical
   Physiology, 14th ed., ch. 9; Tortora & Derrickson, Principles of Anatomy and Physiology,
   ch. 20): the atria contract; the ventricles begin to contract and the atrioventricular valves
   close (first sound); the semilunar valves open and blood is ejected; the ventricles relax and
   the semilunar valves close (second sound); the atrioventricular valves open and the ventricles
   fill. The animation is slowed about fifteen times so each stage can be read.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn, HA = global.HeartArt;
  if (!L || !HA) return;
  var h = L.h, esc = L.esc;

  function n2(v) { return Math.round(v * 100) / 100; }
  function seg(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
  function ease(k) { return k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }

  /* ---------- the drawing for questions: the section, unlabelled ----------
     viewBox -40 -70 480 640, the frame heart-art.js is drawn in. A hotspot's x/y are percentages
     of that box, so a point (x, y) of the heart is ((x+40)/4.8 %, (y+70)/6.4 %). 'heart#plain' is
     the same drawing with no red and blue, for questions the colours would answer. */
  L.diagram('heart', function (arg) {
    var plain = arg === 'plain';
    return '<svg viewBox="-40 -70 480 640" xmlns="http://www.w3.org/2000/svg" class="hd" role="img" aria-label="A section through the heart, seen from the front, with no labels' + (plain ? ' and no colours' : '') + '">' +
      '<rect x="-40" y="-70" width="480" height="640" fill="#101C24"/>' + HA.svg({ av: 1, sl: 0 }, { mode: 'section', rightPV: false, plain: plain }) + '</svg>';
  });
  L.diagram('heart-outside', function () {
    return '<svg viewBox="-40 -70 480 640" xmlns="http://www.w3.org/2000/svg" class="hd" role="img" aria-label="The heart seen from the outside, with the coronary arteries on its surface">' +
      '<rect x="-40" y="-70" width="480" height="640" fill="#101C24"/>' + HA.svg({ av: 1, sl: 0 }, { mode: 'exterior' }) + '</svg>';
  });

  /* ---------- the paths the blood takes, in the heart's own frame ---------- */
  var PATHS = {
    svc:  { col: 'deo', pts: [[104, -60], [104, 40], [104, 140], [100, 196], [92, 226]] },
    ivc:  { col: 'deo', pts: [[28, 560], [28, 420], [30, 330], [48, 268], [78, 240]] },
    raRv: { col: 'deo', pts: [[96, 214], [98, 262], [100, 300], [110, 350], [124, 388]] },
    rvPa: { col: 'deo', pts: [[150, 396], [170, 350], [172, 280], [172, 210], [172, 150], [172, 104]] },
    paL:  { col: 'deo', pts: [[168, 104], [120, 110], [60, 124], [-30, 158]] },
    paR:  { col: 'deo', pts: [[178, 102], [240, 98], [330, 110], [430, 144]] },
    pv1:  { col: 'oxy', pts: [[430, 192], [390, 196], [340, 208], [310, 216]] },
    pv2:  { col: 'oxy', pts: [[430, 248], [390, 242], [344, 234], [316, 226]] },
    laLv: { col: 'oxy', pts: [[310, 214], [308, 262], [302, 310], [290, 368], [274, 404]] },
    lvAo: { col: 'oxy', pts: [[252, 414], [238, 352], [230, 282], [229, 214], [229, 150], [232, 96], [248, 58], [272, 38], [298, 42], [306, 70]] }
  };
  /* which paths carry blood, and how fast, in each part of the beat (units per second) */
  function flows(t) {
    var f = {};
    var vein = 55;
    f.svc = f.ivc = f.pv1 = f.pv2 = vein;                          /* the veins never stop filling the atria */
    if (t < 3) { f.raRv = f.laLv = 45; }                            /* filling: through the open atrioventricular valves */
    else if (t < 5.5) { f.raRv = f.laLv = 150; }                    /* the atria contract */
    else if (t < 7.6) { }                                           /* all valves shut: nothing enters or leaves the ventricles */
    else if (t < 10.6) { f.rvPa = f.lvAo = 190; f.paL = f.paR = 160; } /* ejection */
    else if (t < 13.1) { }                                          /* relaxing, valves shut */
    else { f.raRv = f.laLv = 45; }                                  /* filling again */
    return f;
  }
  function stateAt(t) {
    var atria = t < 3 ? 0 : t < 4.4 ? ease(seg(t, 3, 4.4)) : 1 - ease(seg(t, 4.4, 5.5));
    var vent = t < 5.5 ? 0 : t < 7.5 ? .45 * ease(seg(t, 5.5, 7.5)) : t < 9.5 ? .45 + .55 * ease(seg(t, 7.5, 9.5)) : t < 10.5 ? 1 : 1 - ease(seg(t, 10.5, 12.6));
    var av = t < 5.8 ? 1 : t < 6.1 ? 1 - seg(t, 5.8, 6.1) : t < 12.9 ? 0 : seg(t, 12.9, 13.3);
    var sl = t < 7.6 ? 0 : t < 7.9 ? seg(t, 7.6, 7.9) : t < 10.9 ? 1 : 1 - seg(t, 10.9, 11.2);
    return { atria: atria, vent: vent, av: av, sl: sl };
  }

  var STEPS = [
    { t: 0,    h: 'The atria fill', p: 'Blood flows into the atria from the veins: from the vena cava on the right, from the pulmonary veins on the left. The atrioventricular valves are open, so some blood already flows into the ventricles.' },
    { t: 3,    h: 'The atria contract', p: 'Both atria contract together. They push blood through the open atrioventricular valves into the ventricles. The semilunar valves stay shut.' },
    { t: 5.5,  h: 'The ventricles contract: “lub”', p: 'Both ventricles contract. Their pressure rises and pushes the atrioventricular valves shut, so blood cannot flow back into the atria. That is the first sound, “lub”.' },
    { t: 7.5,  h: 'Blood leaves the heart', p: 'The pressure pushes the semilunar valves open. Blood is forced out: from the right ventricle into the pulmonary artery, from the left ventricle into the aorta.' },
    { t: 10.5, h: 'The ventricles relax: “dub”', p: 'The ventricles relax and their pressure falls. Blood in the arteries starts to flow back, fills the pockets of the semilunar valves and shuts them. That is the second sound, “dub”.' },
    { t: 12.6, h: 'The next beat begins', p: 'Blood from the veins fills the atria again, the atrioventricular valves open, and blood flows into the ventricles. At rest this happens about 70 times a minute.' }
  ];
  var END = 15.4;

  /* sample a path into even points, once */
  function sample(pts) {
    var out = [[pts[0][0], pts[0][1]]], len = [0];
    for (var i = 1; i < pts.length; i++) {
      var a = pts[i - 1], b = pts[i], d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.ceil(d / 4));
      for (var k = 1; k <= n; k++) { var q = [a[0] + (b[0] - a[0]) * k / n, a[1] + (b[1] - a[1]) * k / n]; out.push(q); len.push(len[len.length - 1] + d / n); }
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
  Object.keys(PATHS).forEach(function (k) { PATHS[k].s = sample(PATHS[k].pts); });

  /* how far along its path each cell is at time t: the integral of that path's speed */
  function travelled(key, t) {
    var dt = .05, d = 0;
    for (var x = 0; x < t; x += dt) { var v = flows(x)[key] || 0; d += v * Math.min(dt, t - x); }
    return d;
  }

  var LABELS = [
    { id: 'vc', text: 'vena cava', x: 104, y: 6, side: 'L' },
    { id: 'pa', text: 'pulmonary artery', x: 160, y: 118, side: 'L' },
    { id: 'slp', text: 'semilunar valve', x: 158, y: 200, side: 'L', cls: 'is-valve sl' },
    { id: 'ra', text: 'right atrium', x: 82, y: 232, side: 'L' },
    { id: 'avr', text: 'atrioventricular valve', x: 74, y: 290, side: 'L', cls: 'is-valve av' },
    { id: 'rv', text: 'right ventricle', x: 146, y: 324, side: 'L' },        /* inside the cavity however far it squeezes */
    { id: 'ao', text: 'aorta', x: 290, y: 36, side: 'R' },
    { id: 'pv', text: 'pulmonary vein', x: 402, y: 190, side: 'R' },
    { id: 'sla', text: 'semilunar valve', x: 244, y: 216, side: 'R', cls: 'is-valve sl' },
    { id: 'la', text: 'left atrium', x: 332, y: 244, side: 'R' },
    { id: 'avl', text: 'atrioventricular valve', x: 336, y: 292, side: 'R', cls: 'is-valve av' },
    { id: 'lv', text: 'left ventricle', x: 290, y: 370, side: 'R' }
  ];

  function cycle(spec) {
    var box = h('div', 'widget cy');
    box.appendChild(L.head(spec.title || 'One beat, one step at a time', spec.ask, 'Press play'));
    var VB = { x: -222, y: -86, w: 844, h: 656 };
    var fig = h('figure', 'cy__fig');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h);
    svg.setAttribute('class', 'cy__svg'); svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', 'A section through the heart, seen from the front. The chambers contract in turn, the valves open and close, and blood moves through the heart.');
    svg.innerHTML = '<rect class="cy__bg" x="' + VB.x + '" y="' + VB.y + '" width="' + VB.w + '" height="' + VB.h + '" rx="18"/>' +
      '<g class="cy__heart"></g><g class="cy__cells"></g><g class="cy__marks"></g><g class="cy__labels"></g>';
    fig.appendChild(svg);
    var gHeart = svg.querySelector('.cy__heart'), gCells = svg.querySelector('.cy__cells'), gMarks = svg.querySelector('.cy__marks'), gLab = svg.querySelector('.cy__labels');
    gHeart.innerHTML = HA.svg({ av: 1, sl: 0 }, { mode: 'section', rightPV: false });
    var node = HA.nodes(gHeart);

    /* the valves' state, read out in words: a reader should never have to guess from the drawing */
    var read = h('div', 'cy__read', '<span class="cy__pill" data-v="av"><b>Atrioventricular valves</b> <i>open</i></span><span class="cy__pill" data-v="sl"><b>Semilunar valves</b> <i>shut</i></span>');
    var sound = h('button', 'wbtn wbtn--quiet cy__snd', '🔈 Sound off'); sound.type = 'button'; sound.setAttribute('aria-pressed', 'false');
    var soundOn = false;
    sound.addEventListener('click', function () { soundOn = !soundOn; sound.textContent = soundOn ? '🔊 Sound on' : '🔈 Sound off'; sound.setAttribute('aria-pressed', soundOn ? 'true' : 'false'); if (soundOn) L.thump('lub'); });

    /* cells: a few on each path, spaced evenly */
    var CELLS = [];
    Object.keys(PATHS).forEach(function (k) {
      var P = PATHS[k], n = Math.max(3, Math.round(P.s.total / 34));
      for (var i = 0; i < n; i++) {
        var e = document.createElementNS('http://www.w3.org/2000/svg', 'ellipse');
        e.setAttribute('rx', '6.4'); e.setAttribute('ry', '4'); e.setAttribute('class', 'cy__cell cy__cell--' + P.col);
        gCells.appendChild(e);
        CELLS.push({ el: e, key: k, off: P.s.total * i / n });
      }
    });
    var lastSound = -1, lastT = 0;
    function render(t) {
      var st = stateAt(t), p = HA.paths(st);
      HA.update(node, p);
      /* the cells: each path moves only while blood is flowing along it */
      var memo = {};
      CELLS.forEach(function (c) {
        var P = PATHS[c.key], d = memo[c.key] != null ? memo[c.key] : (memo[c.key] = travelled(c.key, t));
        var s = (c.off + d) % P.s.total, q = at(P.s, s), q2 = at(P.s, Math.min(P.s.total, s + 3));
        /* a cell in a chamber moves with its walls as they squeeze */
        q = HA.warpPoint(q[0], q[1], st); q2 = HA.warpPoint(q2[0], q2[1], st);
        var ang = Math.atan2(q2[1] - q[1], q2[0] - q[0]) * 180 / Math.PI;
        /* fade in at the start of the path and out at its end, so cells never pop */
        var edge = Math.min(s / 18, (P.s.total - s) / 18, 1);
        c.el.setAttribute('transform', 'translate(' + n2(q[0]) + ',' + n2(q[1]) + ') rotate(' + n2(ang) + ')');
        c.el.setAttribute('opacity', n2(Math.max(0, edge)));
      });
      /* the sounds, marked where the valves close */
      var lub = seg(t, 6.05, 6.35) * (1 - seg(t, 7.2, 7.6)), dub = seg(t, 11.15, 11.45) * (1 - seg(t, 12.3, 12.7));
      gMarks.innerHTML =
        (lub > 0 ? mark(206, 268, 'lub', lub) : '') + (dub > 0 ? mark(200, 180, 'dub', dub) : '') +
        '<text class="cy__state" x="' + ((narrow ? NV.x : VB.x) + 22) + '" y="' + (VB.y + VB.h - 22) + '" style="font-size:' + fontPx + 'px">' + esc(phaseWords(t)) + '</text>';
      /* the chambers that are contracting are outlined in yellow, so the eye finds them */
      var aOn = t >= 3 && t < 5.5 ? Math.min(1, st.atria * 1.8 + .25) : 0, vOn = t >= 5.5 && t < 10.5 ? Math.min(1, st.vent * 1.8 + .25) : 0;
      glow(node.ra, aOn, HA.COL.deoLo); glow(node.la, aOn, HA.COL.oxyLo); glow(node.rv, vOn, HA.COL.deoLo); glow(node.lv, vOn, HA.COL.oxyLo);
      /* the valve read-out */
      var avOpen = st.av > .5, slOpen = st.sl > .5;
      read.children[0].className = 'cy__pill' + (avOpen ? ' is-open' : ' is-shut'); read.children[0].querySelector('i').textContent = avOpen ? 'open' : 'shut';
      read.children[1].className = 'cy__pill' + (slOpen ? ' is-open' : ' is-shut'); read.children[1].querySelector('i').textContent = slOpen ? 'open' : 'shut';
      var items = LABELS.map(function (x) {
        var o = Object.assign({}, x);
        if (x.cls && x.cls.indexOf('av') >= 0) o.cls = x.cls + (avOpen ? ' is-open' : ' is-shut');
        if (x.cls && x.cls.indexOf('sl') >= 0) o.cls = x.cls + (slOpen ? ' is-open' : ' is-shut');
        return o; });
      if (narrow) {
        /* a phone: numbered pins in two narrow columns, the words in a band above the heart */
        var P = L.pinLabels({ items: items, left: -38, right: 438, font: fontPx, top: VB.y + 8, bottom: VB.y + VB.h - 40, gap: 4 });
        var B = L.pinBand(P.order, NV.x + 14, NV.y + 8, NV.w - 28, Math.round(fontPx * .92), 2);
        gLab.innerHTML = '<rect x="' + NV.x + '" y="' + NV.y + '" width="' + NV.w + '" height="' + n2(bandH) + '" fill="#0D1A22"/>' + B.svg + P.svg;
      } else {
        gLab.innerHTML = L.labels({ items: items, left: -22, right: 432, font: fontPx, width: 150, top: VB.y + 6, bottom: VB.y + VB.h - 6, gap: 6 });
      }
      /* sound: only when a step is playing forwards through the moment */
      if (soundOn && t > lastT) {
        if (lastT < 6.1 && t >= 6.1 && lastSound !== 1) { L.thump('lub'); lastSound = 1; }
        if (lastT < 11.2 && t >= 11.2 && lastSound !== 2) { L.thump('dub'); lastSound = 2; }
      }
      if (t < 1) lastSound = -1;
      lastT = t;
    }
    function mark(x, y, word, op) {
      var r = 18 + 12 * op;
      return '<g class="cy__snd-mark" opacity="' + n2(op) + '"><circle cx="' + x + '" cy="' + y + '" r="' + n2(r) + '"/><text x="' + x + '" y="' + (y + 6) + '" text-anchor="middle">' + word + '</text></g>';
    }
    function phaseWords(t) {
      return t < 3 ? 'All four chambers relaxed' : t < 5.5 ? 'The atria contract' : t < 10.5 ? 'The ventricles contract' : t < 12.6 ? 'The ventricles relax' : 'All four chambers relaxed';
    }
    function glow(el, k, base) {
      if (k > .02) { el.setAttribute('stroke', '#FFE58A'); el.setAttribute('stroke-width', n2(1 + 3 * k)); el.setAttribute('stroke-opacity', n2(.35 + .65 * k)); }
      else { el.setAttribute('stroke', base); el.setAttribute('stroke-width', '1'); el.setAttribute('stroke-opacity', '1'); }
    }
    var fontPx = 17, narrow = false, bandH = 0, NV = null;
    var sp = L.stepper({ steps: STEPS, end: END, render: render });
    var top = h('div', 'cy__top'); top.appendChild(read); top.appendChild(sound);
    box.appendChild(sp.bar);
    var wrap = h('div', 'cy__wrap');
    fig.appendChild(sp.now);
    /* on a wide screen the drawing stands in the plate's column; its read-outs and the steps stay here */
    var pack = h('div', 'cy__pack');
    var packT = h('p', 'stg__title', esc(spec.title || 'One beat, one step at a time')); packT.hidden = true;
    pack.appendChild(packT); pack.appendChild(fig);
    var left = h('div', 'cy__left'); left.appendChild(top); left.appendChild(pack);
    wrap.appendChild(left); wrap.appendChild(sp.list);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note', 'Red is oxygenated blood and blue is deoxygenated blood, as on every diagram. Both sides of the heart go through each step at the same moment. The real beat is about fifteen times faster.'));

    /* the drawing gets smaller on a phone, so its lettering gets relatively bigger */
    /* on a phone the drawing is cropped to the heart and the labels become pins (CircLearn.pinLabels) */
    var staged = false;
    function fit() {
      var ww = wrap.getBoundingClientRect().width; if (!ww) return;
      /* the list goes under the drawing unless there is room for both at full size; standing in the
         plate's column, the drawing has left, and each step keeps its words in the list */
      wrap.classList.toggle('cy--stack', !staged && ww < 1000);
      var rb = svg.getBoundingClientRect(), w = rb.width; if (!w) return;
      if (staged && rb.height) w = Math.min(w, rb.height * VB.w / VB.h);     /* held back by the height there */
      var nar = w < 520, f;
      if (nar) {
        var NW = 568, k2 = w / NW;
        f = Math.round(Math.max(20, Math.min(30, 12.5 / k2)));
        var lines = Math.ceil(LABELS.length / 2);
        bandH = lines * Math.round(f * .92) * 1.25 + Math.round(f * .92) * .6 + 18;
        NV = { x: -84, y: VB.y - bandH, w: NW, h: VB.h + bandH };
        svg.setAttribute('viewBox', NV.x + ' ' + NV.y + ' ' + NV.w + ' ' + NV.h);
        svg.querySelector('.cy__bg').setAttribute('x', NV.x); svg.querySelector('.cy__bg').setAttribute('y', NV.y);
        svg.querySelector('.cy__bg').setAttribute('width', NV.w); svg.querySelector('.cy__bg').setAttribute('height', NV.h);
      } else {
        f = Math.round(Math.max(15, Math.min(24, 12.5 / (w / VB.w))));
        if (narrow) {
          svg.setAttribute('viewBox', VB.x + ' ' + VB.y + ' ' + VB.w + ' ' + VB.h);
          var bg = svg.querySelector('.cy__bg'); bg.setAttribute('x', VB.x); bg.setAttribute('y', VB.y); bg.setAttribute('width', VB.w); bg.setAttribute('height', VB.h);
        }
      }
      if (f !== fontPx || nar !== narrow) { fontPx = f; narrow = nar; sp.paint(sp.time()); }
    }
    var ro = global.ResizeObserver ? new ResizeObserver(function () { if (!box.isConnected) { ro.disconnect(); return; } fit(); }) : null;
    if (ro) { ro.observe(wrap); ro.observe(fig); }
    var stg = L.stage ? L.stage({ box: box, spec: spec, pack: pack, home: left, watch: function () { return box; },
      onPlace: function (inColumn) { staged = inColumn; packT.hidden = !inColumn; box.classList.toggle('cy--staged', inColumn); sp.compact(inColumn); fit(); } }) : null;
    box.__onMove = function () { if (stg) stg.mount(); };
    box.__onReset = function () { sp.stop(); if (ro) ro.disconnect(); if (stg) stg.detach(); };
    box.__seek = function (t) { return sp.seek(t); };
    sp.paint(0);
    return box;
  }

  /* ---------- sound: a recording from the lesson ---------- */
  function sound(spec) {
    var box = h('div', 'widget snd');
    box.appendChild(L.head(spec.title || 'Listen', spec.ask));
    var a = document.createElement('audio');
    a.src = 'assets/audio/' + spec.audio + '.mp3'; a.controls = true; a.preload = 'none'; a.className = 'snd__el';
    a.setAttribute('aria-label', spec.title || 'Heart sound');
    box.appendChild(a);
    if (spec.credit) box.appendChild(h('p', 'widget__note', esc(spec.credit)));
    return box;
  }

  L.add('cycle', cycle);
  L.add('sound', sound);
})(window);
