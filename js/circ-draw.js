/* ============================================================
   circ-draw.js — the plate: the whole circulation, on a real anatomical drawing.

   The drawing is Mariana Ruiz Villarreal's "Circulatory System" (LadyofHats, Wikimedia Commons,
   public domain; js/circ-art.js), made from Gray's Anatomy and the Sobotta atlas — the same
   artist as the Digestion Lab's plate. Nothing on it is positioned by hand: every vessel is where
   the artist drew it, both arms included.

   On top of it this file adds four things, all made FROM the drawing:
     the blood flowing   dots move along the centre line of every drawn vessel (js/circ-flow.js,
                         traced from the drawing's own medial axis), away from the heart in the
                         arteries and towards it in the veins, surging with each beat
     lighting            a station lights its vessels and organs: the body is veiled in its own
                         skin colour (the artist's own way of fading an arm) and the lit parts are
                         redrawn above the veil at full colour, cut out along their centre lines
     the heart, cut open a magnified view beside the heart, beating, with the chambers and valves
                         the heart stations light (js/heart-art.js — the cardiac-cycle widget's heart)
     a camera            fly to a part, zoom and pan with the wheel, a drag or a pinch, "Whole body"
   and names ruled out to the sides of the plate, like a labelled figure.

   CircDraw(svg, opts) → the object js/plate.js (and the route puzzle) drive:
     light(ids) / clear()      light some parts, veil the rest; returns { colour }
     lens(mode)                'section' | 'exterior' | null — the magnified heart
     heartMode(m)              which drawing the lens shows
     flyTo(box, done), jump(box), boxOf(id, pad), FULL, BOX, isZoomed(), zoomBy(k), home()
     labels(on, beyond)        the names at the sides, and the ones beyond the syllabus
     setRate(bpm), rate(), flow(on), start(), stop()
     pin(el, label, colour), elFor(id), G (every part: label, note, colour)
     __seek(ph, t)             draw one moment, for the headless checks
   ============================================================ */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var ART = global.CIRC_ART, FLOW = global.CIRC_FLOW || {};
  var AW = 371, AH = 821;
  var FULL = { x: -4, y: 8, w: 379, h: 806 };
  var SKIN = '#f2f2f2';

  /* ---------- every part: what the tag and the line under the plate say ---------- */
  var G = {
    heart:   { label: 'Heart', note: 'a muscular pump: two sides, four chambers', colour: '#FF8A7E' },
    ra:      { label: 'Right atrium', note: 'receives deoxygenated blood from the body', colour: '#8FB2FF' },
    la:      { label: 'Left atrium', note: 'receives oxygenated blood from the lungs', colour: '#FF8A7E' },
    rv:      { label: 'Right ventricle', note: 'pumps blood to the lungs', colour: '#8FB2FF' },
    lv:      { label: 'Left ventricle', note: 'pumps blood to the whole body', colour: '#FF8A7E' },
    septum:  { label: 'Septum', note: 'keeps oxygenated and deoxygenated blood apart', colour: '#FFB0A2' },
    'av-valves': { label: 'Atrioventricular valves', note: 'between each atrium and its ventricle', colour: '#F4E6D0' },
    'sl-valves': { label: 'Semilunar valves', note: 'where the blood leaves the ventricles', colour: '#F4E6D0' },
    coronary: { label: 'Coronary arteries', note: 'the heart muscle’s own blood supply', colour: '#FF8A7E' },
    lungs:   { label: 'Lungs', note: 'the blood is oxygenated here', colour: '#F2B8C2' },
    liver:   { label: 'Liver', note: 'two vessels bring blood in, one takes it out', colour: '#E0A08E' },
    kidneys: { label: 'Kidneys', note: 'a renal artery in, a renal vein out', colour: '#E0A08E' },
    spleen:  { label: 'Spleen', note: 'not in 0610', colour: '#C9A5C0' },
    gut:     { label: 'Small intestine', note: 'digested food is absorbed into its capillaries', colour: '#E6C1A4' },
    aorta:   { label: 'Aorta', note: 'the artery that carries oxygenated blood from the left ventricle to the body', colour: '#FF8A7E' },
    'vena-cava': { label: 'Vena cava', note: 'brings deoxygenated blood from the body to the right atrium', colour: '#8FB2FF' },
    'pulmonary-artery': { label: 'Pulmonary artery', note: 'carries deoxygenated blood from the right ventricle to the lungs', colour: '#8FB2FF' },
    'pulmonary-vein': { label: 'Pulmonary vein', note: 'carries oxygenated blood from the lungs to the left atrium', colour: '#FF8A7E' },
    'hepatic-artery': { label: 'Hepatic artery', note: 'oxygenated blood from the aorta to the liver', colour: '#FF8A7E' },
    'hepatic-vein': { label: 'Hepatic vein', note: 'blood from the liver to the vena cava', colour: '#8FB2FF' },
    'hepatic-portal-vein': { label: 'Hepatic portal vein', note: 'from the gut to the liver, carrying absorbed nutrients', colour: '#7FE3DA' },
    'gut-vein': { label: 'Veins from the gut and spleen', note: 'they join to form the hepatic portal vein (names not in 0610)', colour: '#7FE3DA' },
    'renal-artery': { label: 'Renal artery', note: 'blood from the aorta to the kidney', colour: '#FF8A7E' },
    'renal-vein': { label: 'Renal vein', note: 'blood from the kidney to the vena cava', colour: '#8FB2FF' },
    'gut-artery': { label: 'Arteries to the gut and spleen', note: 'branches of the aorta (names not in 0610)', colour: '#FF8A7E' },
    carotid: { label: 'Arteries of the head and neck', note: 'the carotid arteries and their branches: the pulse in the neck (names not in 0610)', colour: '#FF8A7E' },
    jugular: { label: 'Veins of the head and neck', note: 'the jugular veins and their branches (names not in 0610)', colour: '#8FB2FF' },
    'arm-artery': { label: 'Arteries of the arm', note: 'the radial artery at the wrist carries the pulse you feel (names not in 0610)', colour: '#FF8A7E' },
    'arm-vein': { label: 'Veins of the arm', note: 'they carry blood back towards the heart (names not in 0610)', colour: '#8FB2FF' },
    'head-arm-vein': { label: 'Brachiocephalic veins', note: 'the veins from the head and arms join to form the vena cava (not in 0610)', colour: '#8FB2FF' },
    'leg-artery': { label: 'Arteries of the leg', note: 'branches of the aorta, below where it divides (names not in 0610)', colour: '#FF8A7E' },
    'leg-vein': { label: 'Veins of the leg', note: 'valves keep the blood flowing up, towards the heart (names not in 0610)', colour: '#8FB2FF' },
    artery:  { label: 'Artery', note: 'carries blood away from the heart', colour: '#FF8A7E' },
    vein:    { label: 'Vein', note: 'carries blood towards the heart', colour: '#8FB2FF' },
    head:    { label: 'Head', note: 'the brain’s blood supply', colour: '#C9D8E6' },
    arms:    { label: 'Arms', note: 'arteries and veins of the arm', colour: '#C9D8E6' },
    legs:    { label: 'Legs', note: 'arteries and veins of the leg', colour: '#C9D8E6' },
    body:    { label: 'The body', note: 'every organ, in parallel', colour: '#C9D8E6' }
  };
  /* what a station's broad names light */
  var ALIAS = {
    arms: ['arm-artery', 'arm-vein'], legs: ['leg-artery', 'leg-vein'], head: ['carotid', 'jugular', 'head'],
    gut: ['gut', 'gut-artery', 'gut-vein'], 'aorta-branch': [],
    body: ['aorta', 'vena-cava', 'carotid', 'jugular', 'arm-artery', 'arm-vein', 'leg-artery', 'leg-vein', 'renal-artery', 'renal-vein',
           'hepatic-artery', 'hepatic-vein', 'hepatic-portal-vein', 'gut-artery', 'gut-vein', 'head-arm-vein', 'artery', 'vein']
  };
  var CHAMBERS = { ra: 1, la: 1, rv: 1, lv: 1, septum: 1, 'av-valves': 1, 'sl-valves': 1 };
  var ORGANS = { lungs: 1, liver: 1, kidneys: 1, spleen: 1, head: 1, gut: 1 };
  var ORGAN_FILL = { lungs: ['#F3C3CB', .5], liver: ['#C9876F', .34], kidneys: ['#C47A74', .42], spleen: ['#B58AAE', .28], gut: ['#E8B9A4', .55] };

  /* the camera's frames, in the drawing's units */
  var BOX = {
    heart:      { x: 176, y: 168, w: 196, h: 128 },
    heartClose: { x: 180, y: 172, w: 188, h: 122 },
    valves:     { x: 180, y: 172, w: 188, h: 122 },
    coronary:   { x: 180, y: 172, w: 188, h: 122 },
    lungs:      { x: 128, y: 160, w: 166, h: 136 },
    chest:      { x: 118, y: 140, w: 184, h: 190 },
    liver:      { x: 136, y: 248, w: 150, h: 104 },
    abdomen:    { x: 128, y: 246, w: 170, h: 160 },
    kidneys:    { x: 146, y: 286, w: 136, h: 86 },
    gut:        { x: 140, y: 270, w: 150, h: 150 },
    head:       { x: 150, y: 6, w: 124, h: 196 },
    legs:       { x: 96, y: 366, w: 232, h: 446 },
    arms:       { x: -2, y: 150, w: 375, h: 380 },
    pulse:      { x: 0, y: 92, w: 372, h: 392 },
    forearm:    { x: 6, y: 300, w: 156, h: 196 },
    trunk:      { x: 104, y: 140, w: 216, h: 310 }
  };

  /* the names at the sides: the point each one's leader touches, on its own vessel or organ.
     The vessel points are the arrow tips of the artist's labelled version, moved into this frame. */
  var LABELS = [
    { id: 'heart', text: 'heart', at: [240.2, 238] },
    { id: 'aorta', text: 'aorta', at: [220.8, 193.5] },
    { id: 'vena-cava', text: 'vena cava', at: [201.1, 257.2] },
    { id: 'lungs', text: 'lung', at: [158, 250] },
    { id: 'liver', text: 'liver', at: [166, 296] },
    { id: 'kidneys', text: 'kidney', at: [251, 322] },
    { id: 'gut', text: 'small intestine', at: [214, 372], needs: 'gut' },
    /* the vessels of the heart, the lungs, the liver and the kidneys: from about twice the whole-body scale */
    { id: 'vena-cava', text: 'vena cava', at: [201.6, 211.4], near: 1.25 },
    { id: 'pulmonary-artery', text: 'pulmonary artery', at: [184, 206], near: 1.25 },
    { id: 'pulmonary-vein', text: 'pulmonary vein', at: [258, 216], near: 1.25 },
    { id: 'hepatic-vein', text: 'hepatic vein', at: [202.3, 268.6], near: 1.25 },
    { id: 'hepatic-artery', text: 'hepatic artery', at: [196, 289], near: 1.25 },
    { id: 'hepatic-portal-vein', text: 'hepatic portal vein', at: [205.6, 305.2], near: 1.25 },
    { id: 'renal-artery', text: 'renal artery', at: [233.9, 327.6], near: 1.25 },
    { id: 'renal-vein', text: 'renal vein', at: [198.8, 329.5], near: 1.25 },
    { id: 'coronary', text: 'coronary arteries', at: [233, 246.4], beyond: true, near: 1.6 },
    { id: 'carotid', text: 'carotid artery', at: [224.5, 160.5], beyond: true },
    { id: 'jugular', text: 'jugular vein', at: [229.5, 135.4], beyond: true },
    { id: 'arm-artery', text: 'subclavian artery', at: [162.2, 175.5], beyond: true },
    { id: 'arm-artery', text: 'radial artery', at: [65.1, 389.5], beyond: true },
    { id: 'leg-artery', text: 'femoral artery', at: [243.9, 499.7], beyond: true },
    { id: 'leg-vein', text: 'great saphenous vein', at: [219.7, 621.2], beyond: true }
  ];

  /* every vessel's name touches its OWN vessel: the point is moved onto the nearest centre line of
     that part (an artery and its vein often run side by side) */
  var snapped = false;
  function snapLabels() {
    if (snapped) return; snapped = true;
    LABELS.forEach(function (L) {
      var P = FLOW[L.id]; if (!P) return;
      var best = null;
      P.e.forEach(function (e) {
        for (var i = 1; i + 3 < e.length + 1 && i + 2 < e.length; i += 2) {
          var ax = e[i], ay = e[i + 1], bx = e[i + 2], by = e[i + 3];
          if (bx == null) break;
          var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((L.at[0] - ax) * dx + (L.at[1] - ay) * dy) / L2)) : 0;
          var qx = ax + t * dx, qy = ay + t * dy, d = (qx - L.at[0]) * (qx - L.at[0]) + (qy - L.at[1]) * (qy - L.at[1]);
          if (!best || d < best[0]) best = [d, qx, qy];
        }
      });
      if (best && best[0] < 14 * 14) L.at = [Math.round(best[1] * 10) / 10, Math.round(best[2] * 10) / 10];
    });
  }

  /* a heartbeat's moment: how far the atria and ventricles are squeezed, and how open the valves */
  function beatState(ph, bpm) {
    var sys = Math.min(.62, .3 / (60 / Math.max(40, bpm)) * 1.0);
    var aS = .12, v0 = .13, v1 = v0 + sys;
    function bump(t, a, b) { if (t <= a || t >= b) return 0; var k = (t - a) / (b - a); return Math.sin(Math.PI * k); }
    function ramp(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
    var atria = bump(ph, 0, aS);
    var vent = ph < v0 ? 0 : ph < v1 ? Math.sin(Math.PI * Math.min(1, (ph - v0) / (sys * 1.1))) : 0;
    var av = 1 - ramp(ph, v0 - .01, v0 + .02) + ramp(ph, v1 + .03, v1 + .07);
    var sl = ramp(ph, v0 + .03, v0 + .06) - ramp(ph, v1 - .02, v1 + .01);
    return { atria: atria, vent: vent, av: Math.max(0, Math.min(1, av)), sl: Math.max(0, Math.min(1, sl)), ejecting: ph > v0 + .04 && ph < v1 };
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function f2(v) { return Math.round(v * 100) / 100; }
  var UID = 0;

  function CircDraw(svg, opts) {
    opts = opts || {};
    snapLabels();
    var U = 'cp' + (++UID) + '-';
    var still = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
    var defs = el('defs', {}, svg);
    defs.innerHTML =
      '<radialGradient id="' + U + 'slab" cx=".5" cy=".42" r=".78"><stop offset="0" stop-color="#16303D"/><stop offset=".62" stop-color="#0D1C25"/><stop offset="1" stop-color="#081218"/></radialGradient>' +
      '<filter id="' + U + 'glow" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="1.1" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="' + U + 'soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<mask id="' + U + 'mA" maskUnits="userSpaceOnUse" x="-60" y="-60" width="500" height="960"><rect x="-60" y="-60" width="500" height="960" fill="#000"/><g class="cp__mk" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"></g></mask>' +
      '<mask id="' + U + 'mV" maskUnits="userSpaceOnUse" x="-60" y="-60" width="500" height="960"><rect x="-60" y="-60" width="500" height="960" fill="#000"/><g class="cp__mk" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round"></g></mask>' +
      '<clipPath id="' + U + 'lensclip"><rect x="0" y="0" width="1" height="1" rx="6"/></clipPath>';
    var mkA = defs.querySelector('#' + U + 'mA .cp__mk'), mkV = defs.querySelector('#' + U + 'mV .cp__mk');

    var root = el('g', { 'class': 'cp' }, svg);
    el('rect', { x: -600, y: -600, width: AW + 1200, height: AH + 1200, fill: 'url(#' + U + 'slab)', 'class': 'cp__bg' }, root);
    /* a soft light behind the body, so it reads as a specimen on a lit slab */
    var halo = el('g', { 'class': 'cp__halo', filter: 'url(#' + U + 'soft)', opacity: .55 }, root);

    /* ----- the drawing ----- */
    var artG = el('g', { 'class': 'cp__art' }, root);
    artG.innerHTML = ART ? ART.svg : '';
    function chain(node) {                       /* the transforms between the drawing's root and a shape */
      var t = []; var n = node.parentNode;
      while (n && n !== artG) { if (n.getAttribute && n.getAttribute('transform')) t.unshift(n.getAttribute('transform')); n = n.parentNode; }
      if (node.getAttribute('transform')) t.push(node.getAttribute('transform'));
      return t.join(' ');
    }
    function copyOf(node, attrs, parent) {        /* a shape, lifted out of its layer with its place kept */
      var g = el('g', { transform: chain(node) || null }, parent);
      var c = node.cloneNode(false); c.removeAttribute('id'); c.removeAttribute('transform'); c.removeAttribute('class');
      if (attrs && (attrs.fill != null || attrs.stroke != null)) c.removeAttribute('style');
      for (var k in attrs) if (attrs[k] != null) c.setAttribute(k, attrs[k]);
      g.appendChild(c);
      return c;
    }
    var skin = artG.querySelector('.cp-skin');
    var organs = {};                               /* organ id -> its outline shapes */
    Array.prototype.forEach.call(artG.querySelectorAll('.cp-organ'), function (n) {
      var p = n.getAttribute('data-part'); (organs[p] = organs[p] || []).push(n);
    });
    var heartShape = organs.heart && organs.heart[0];
    var corShapes = artG.querySelectorAll('.cp-cor');
    if (skin) copyOf(skin, { fill: '#DCE7EC', stroke: 'none' }, halo);

    /* organs are only outlines in the drawing: give them a tint, under the vessels */
    var firstLayer = skin; while (firstLayer && firstLayer.parentNode !== artG) firstLayer = firstLayer.parentNode;
    var organFill = el('g', { 'class': 'cp__ofill' });
    if (firstLayer && firstLayer.nextSibling) artG.insertBefore(organFill, firstLayer.nextSibling); else artG.appendChild(organFill);
    var fillOf = {};
    Object.keys(ORGAN_FILL).forEach(function (p) {
      (organs[p] || []).forEach(function (n) {
        var c = copyOf(n, { fill: ORGAN_FILL[p][0], 'fill-opacity': ORGAN_FILL[p][1], stroke: 'none', 'data-part': p }, organFill);
        (fillOf[p] = fillOf[p] || []).push(c);
      });
    });

    /* the small intestine, from the same artist's digestive system, if it is loaded (js/circ-gut.js) */
    if (global.CIRC_GUT) {
      var gut = el('g', { 'class': 'cp__gut', 'data-part': 'gut', transform: global.CIRC_GUT.transform }, organFill);
      gut.innerHTML = global.CIRC_GUT.svg;
      organs.gut = [gut];
    }
    Array.prototype.forEach.call(artG.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });

    /* ----- the veil, and the lit parts above it ----- */
    var veil = el('g', { 'class': 'cp__veil' }, root);
    if (skin) copyOf(skin, { fill: SKIN, 'fill-opacity': .8, stroke: 'none' }, veil);
    function overlay(kind, maskId) {
      var g = el('g', { 'class': 'cp__lit cp__lit--' + kind, mask: 'url(#' + maskId + ')' }, root);
      var c = artG.cloneNode(true);
      c.removeAttribute('class');
      Array.prototype.forEach.call(c.querySelectorAll('path,rect,ellipse,circle,polygon,polyline,line'), function (n) {
        if (!n.classList || !n.classList.contains(kind === 'a' ? 'cp-a' : 'cp-v')) n.style.display = 'none';
      });
      var of = c.querySelector('.cp__ofill'); if (of) of.parentNode.removeChild(of);
      g.appendChild(c);
      return g;
    }
    var litO = el('g', { 'class': 'cp__lito' }, root);          /* lit organs, under their vessels */
    var litA = overlay('a', U + 'mA'), litV = overlay('v', U + 'mV');
    var litH = el('g', { 'class': 'cp__lito cp__lith' }, root); /* the lit heart and its coronary vessels */

    /* ----- the blood ----- */
    var flowG = el('g', { 'class': 'cp__flow' }, root);
    var DOT = { a: '#FFE2DC', pv: '#FFE2DC', v: '#DCEAFF', pa: '#DCEAFF', po: '#D8FBF6' };
    var SPEED = { a: 34, pv: 22, v: 17, pa: 26, po: 15 };
    var BUCKETS = [0, .8, 1.8, 3.4, 1e9];
    var flows = [];
    function dAlong(e) { var d = 'M' + e[1] + ' ' + e[2]; for (var i = 3; i < e.length; i += 2) d += 'L' + e[i] + ' ' + e[i + 1]; return d; }
    Object.keys(FLOW).forEach(function (part) {
      var P = FLOW[part], byB = {};
      P.e.forEach(function (e) {
        var r = e[0], b = 0; while (r >= BUCKETS[b + 1]) b++;
        (byB[b] = byB[b] || []).push(e);
      });
      Object.keys(byB).forEach(function (b) {
        var list = byB[b], rs = list.map(function (e) { return e[0]; }).sort(function (x, y) { return x - y; }), r = rs[rs.length >> 1];
        var dot = Math.max(.36, Math.min(1.7, r * .5)), dash = dot * 1.5, gap = Math.max(3, dot * 4.6);
        var p = el('path', { d: list.map(dAlong).join(''), fill: 'none', stroke: DOT[P.c], 'stroke-width': f2(dot), 'stroke-linecap': 'round',
          'stroke-dasharray': f2(dash) + ' ' + f2(gap), 'class': 'cp__f', 'data-part': part, opacity: .82 }, flowG);
        flows.push({ el: p, part: part, c: P.c, gap: gap + dash, speed: SPEED[P.c] * (.72 + Math.min(.55, r * .09)), off: 0 });
      });
    });

    /* ----- the heart, cut open: a magnified view beside it ----- */
    var LENS = { x: 262, y: 176, w: 104, h: 124 };
    var lensG = el('g', { 'class': 'cp__lens', opacity: 0 }, root);
    var lensMode = null, heartKind = 'section', lensNodes = {};
    function buildLens() {
      lensG.innerHTML = '';
      if (!global.HeartArt) return;
      el('path', { d: 'M249 236 L' + LENS.x + ' 236', stroke: '#E8EEF1', 'stroke-width': .6, 'stroke-dasharray': '1.6 1.2', fill: 'none', 'class': 'cp__lensline' }, lensG);
      el('circle', { cx: 247, cy: 236, r: 1.6, fill: 'none', stroke: '#E8EEF1', 'stroke-width': .6 }, lensG);
      el('rect', { x: LENS.x, y: LENS.y, width: LENS.w, height: LENS.h, rx: 5, fill: '#0E1A22', stroke: '#E8EEF1', 'stroke-opacity': .5, 'stroke-width': .6 }, lensG);
      var clip = defs.querySelector('#' + U + 'lensclip rect');
      clip.setAttribute('x', LENS.x); clip.setAttribute('y', LENS.y); clip.setAttribute('width', LENS.w); clip.setAttribute('height', LENS.h);
      var inner = el('g', { 'clip-path': 'url(#' + U + 'lensclip)' }, lensG);
      var s = Math.min((LENS.w - 6) / 470, (LENS.h - 16) / 630);
      var tx = LENS.x + (LENS.w - 480 * s) / 2 + 40 * s, ty = LENS.y + 3 + 70 * s;
      var hg = el('g', { transform: 'translate(' + f2(tx) + ' ' + f2(ty) + ') scale(' + f2(s * 1000) / 1000 + ')', 'class': 'cp__lensheart' }, inner);
      hg.innerHTML = global.HeartArt.svg(beat, { mode: heartKind, rightPV: false });
      lensNodes = { outer: hg.querySelector('.ha__outer'), ra: hg.querySelector('.ha__ra'), la: hg.querySelector('.ha__la'), rv: hg.querySelector('.ha__rv'), lv: hg.querySelector('.ha__lv'),
                    av: hg.querySelector('.ha__av'), sl: hg.querySelector('.ha__sl'), cords: hg.querySelectorAll('.ha__cords line') };
      var cap = el('text', { x: LENS.x + LENS.w / 2, y: LENS.y + LENS.h - 4.2, 'text-anchor': 'middle', 'class': 'cp__lenscap' }, lensG);
      cap.textContent = heartKind === 'exterior' ? 'the heart from the front' : 'the heart, cut open';
      applyLight();
    }

    /* ----- what the pointer can press ----- */
    var hitG = el('g', { 'class': 'cp__hits' }, root);
    Object.keys(organs).forEach(function (p) {
      if (p === 'heart' || p === 'head') return;
      organs[p].forEach(function (n) {
        if (p === 'gut') { var gc = n.cloneNode(true); gc.setAttribute('class', 'cp__hit cp__hit--o'); gc.setAttribute('data-part', 'gut'); hitG.appendChild(gc); return; }
        copyOf(n, { fill: 'transparent', stroke: 'none', 'data-part': p, 'class': 'cp__hit cp__hit--o' }, hitG);
      });
    });
    if (heartShape) copyOf(heartShape, { fill: 'transparent', stroke: 'none', 'data-part': 'heart', 'class': 'cp__hit cp__hit--o' }, hitG);
    Array.prototype.forEach.call(corShapes, function (n) {      /* the coronary vessels on the heart win over the heart itself */
      copyOf(n, { fill: 'none', stroke: 'transparent', 'stroke-width': 8, 'vector-effect': 'non-scaling-stroke', 'data-part': 'coronary', 'class': 'cp__hit' }, hitG);
    });
    var hitOf = {};
    Object.keys(FLOW).forEach(function (part) {
      hitOf[part] = el('path', { d: FLOW[part].e.map(dAlong).join(''), fill: 'none', stroke: 'transparent', 'stroke-width': 13, 'vector-effect': 'non-scaling-stroke',
        'stroke-linecap': 'round', 'data-part': part, 'class': 'cp__hit' }, hitG);
    });
    root.appendChild(lensG);                                       /* the lens takes its own clicks: the chambers */

    /* ----- lighting ----- */
    var lit = null;
    function expand(ids) {
      var out = {};
      (ids || []).forEach(function (id) { (ALIAS[id] || [id]).forEach(function (k) { out[k] = 1; }); if (ALIAS[id] && G[id]) out[id] = 1; });
      return out;
    }
    function maskFor(host, cls) {
      host.innerHTML = '';
      if (!lit) return;
      var byW = {};
      Object.keys(lit).forEach(function (part) {
        var P = FLOW[part]; if (!P || cls.indexOf(P.c) < 0) return;
        P.e.forEach(function (e) { var w = Math.round((e[0] * 2 + 2.6) * 2) / 2; (byW[w] = byW[w] || []).push(dAlong(e)); });
      });
      Object.keys(byW).forEach(function (w) { el('path', { d: byW[w].join(''), 'stroke-width': w }, host); });
    }
    function applyLight() {
      root.classList.toggle('is-lighting', !!lit);
      maskFor(mkA, ['a', 'pv']); maskFor(mkV, ['v', 'pa', 'po']);
      litO.innerHTML = ''; litH.innerHTML = '';
      if (lit) {
        Object.keys(lit).forEach(function (p) {
          if (!ORGANS[p] || !organs[p]) return;
          if (p === 'gut') { var g2 = organs.gut[0].cloneNode(true); g2.setAttribute('class', 'cp__gut is-lit'); litO.appendChild(g2); return; }
          organs[p].forEach(function (n) {
            if (ORGAN_FILL[p]) copyOf(n, { fill: ORGAN_FILL[p][0], 'fill-opacity': Math.min(.85, ORGAN_FILL[p][1] + .3), stroke: 'none' }, litO);
            copyOf(n, { fill: 'none', stroke: '#6E7F8C', 'stroke-width': 1.6 }, litO);
          });
        });
        if ((lit.heart || lit.coronary || anyChamber()) && heartShape) {
          heartLit = copyOf(heartShape, {}, litH);
          if (lit.coronary || lit.heart) Array.prototype.forEach.call(corShapes, function (n) { copyOf(n, {}, litH); });
        } else heartLit = null;
      } else heartLit = null;
      flows.forEach(function (f) { f.el.classList.toggle('is-dim', !!lit && !lit[f.part]); });
      /* the lens: its chambers and valves, lit or dimmed */
      Array.prototype.forEach.call(lensG.querySelectorAll('[data-part]'), function (n) {
        var p = n.getAttribute('data-part');
        var on = !lit || lit[p] || (lit.heart && !anyChamber()) || (p === 'heart');
        n.classList.toggle('is-dim', !on);
        n.classList.toggle('is-lit', !!(lit && lit[p]));
      });
    }
    var heartLit = null;
    function anyChamber() { if (!lit) return false; for (var k in CHAMBERS) if (lit[k]) return true; return false; }
    function light(ids) {
      if (!ids || !ids.length) { lit = null; applyLight(); return { colour: null }; }
      lit = expand(ids);
      applyLight();
      var g0 = G[ids[0]];
      return { colour: g0 ? g0.colour : null };
    }

    /* ----- the lens on and off ----- */
    function lens(mode) {
      var want = mode === 'exterior' || mode === 'section' ? mode : null;
      if (want && want !== heartKind) { heartKind = want; buildLens(); }
      if (want && !lensG.firstChild) buildLens();
      lensMode = want;
      lensG.setAttribute('opacity', want ? 1 : 0);
      lensG.style.pointerEvents = want ? '' : 'none';
    }

    /* ----- the heartbeat, and the blood moving with it ----- */
    var bpm = 72, t0 = null, raf = null, flowOn = true, lastT = 0, beat = beatState(.9, 72), phase = 0;
    function setRate(b) { bpm = Math.max(40, Math.min(200, b || 72)); }
    function surge(ph) {                                        /* the push of each beat in the arteries */
      return ph < .12 ? .5 : ph < .45 ? .5 + 1.9 * Math.sin(Math.PI * (ph - .12) / .33) : .5;
    }
    var heartBase = heartShape ? (heartShape.getAttribute('transform') || '') : '', heartC = null;
    function paintBeat() {
      var k = 1 + .028 * beat.vent - .012 * beat.atria;
      if (heartShape && !heartC) { try { var hb0 = heartShape.getBBox(); if (hb0.width) heartC = [hb0.x + hb0.width / 2, hb0.y + hb0.height / 2]; } catch (x) {} }
      if (heartC) {
        var sc = 'translate(' + f2(heartC[0]) + ' ' + f2(heartC[1]) + ') scale(' + (Math.round(k * 1000) / 1000) + ') translate(' + f2(-heartC[0]) + ' ' + f2(-heartC[1]) + ')';
        heartShape.setAttribute('transform', (heartBase ? heartBase + ' ' : '') + sc);
        if (heartLit) heartLit.setAttribute('transform', sc);
      }
      if (!lensMode || !global.HeartArt || !lensNodes.outer) return;
      var p = global.HeartArt.paths(beat);
      lensNodes.outer.setAttribute('d', p.outer);
      if (lensNodes.ra) {
        lensNodes.ra.setAttribute('d', p.ra); lensNodes.la.setAttribute('d', p.la); lensNodes.rv.setAttribute('d', p.rv); lensNodes.lv.setAttribute('d', p.lv);
        lensNodes.av.setAttribute('d', p.tri + ' ' + p.mit);
        if (lensNodes.sl) lensNodes.sl.setAttribute('d', p.pulv + ' ' + p.aov);
        for (var i = 0; i < lensNodes.cords.length; i++) { var c = p.cords[i]; lensNodes.cords[i].setAttribute('x1', f2(c[0][0])); lensNodes.cords[i].setAttribute('y1', f2(c[0][1])); }
      }
    }
    function moveFlow(dt) {
      var s = surge(phase), rateK = .55 + .45 * bpm / 72;
      flows.forEach(function (f) {
        var v = f.speed * rateK * (f.c === 'a' || f.c === 'pa' ? s : 1);
        f.off = (f.off - v * dt) % (f.gap * 1000);
        f.el.setAttribute('stroke-dashoffset', f2(f.off));
      });
    }
    function frame(ts) {
      raf = null;
      if (!svg.isConnected) return;
      if (t0 == null) t0 = ts;
      var t = (ts - t0) / 1000, dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
      var period = 60 / bpm;
      phase = (phase + dt / period) % 1;
      beat = beatState(phase, bpm);
      paintBeat();
      if (flowOn && !still) moveFlow(dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !still) raf = requestAnimationFrame(frame); if (still) { paintBeat(); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; t0 = null; lastT = 0; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (svg.isConnected) start(); });

    /* ----- the camera ----- */
    var cam = { x: FULL.x, y: FULL.y, w: FULL.w, h: FULL.h }, flying = null;
    function aspect() { var r = svg.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r.width / r.height : FULL.w / FULL.h; }
    function fit(b) {
      var a = aspect(), w = b.w, h = b.h;
      if (w / h > a) h = w / a; else w = h * a;
      return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h };
    }
    function clampView(v) {
      var maxW = Math.max(FULL.w, FULL.h * aspect()) * 1.35, minW = 38;
      var w = Math.max(minW, Math.min(maxW, v.w)), h = w * v.h / v.w;
      var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      cx = Math.max(-20, Math.min(AW + 20, cx)); cy = Math.max(-10, Math.min(AH + 10, cy));
      return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    }
    function setView(v) {
      cam = v;
      svg.setAttribute('viewBox', f2(v.x) + ' ' + f2(v.y) + ' ' + f2(v.w) + ' ' + f2(v.h));
      layoutLabels();
      if (opts.onView) opts.onView(isZoomed());
    }
    function flyTo(box, done) {
      if (flying) cancelAnimationFrame(flying);
      var from = { x: cam.x, y: cam.y, w: cam.w, h: cam.h }, to = clampView(fit(box || FULL));
      if (still) { setView(to); if (done) done(); return; }
      var t0f = null, D = 780;
      (function step(ts) {
        if (t0f == null) t0f = ts;
        var k = Math.min(1, (ts - t0f) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        var zw = from.w * Math.pow(to.w / from.w, e);                      /* zoom evenly, not linearly */
        var f = (from.w === to.w) ? e : (from.w - zw) / (from.w - to.w);
        var cx = (from.x + from.w / 2) + ((to.x + to.w / 2) - (from.x + from.w / 2)) * f, cy = (from.y + from.h / 2) + ((to.y + to.h / 2) - (from.y + from.h / 2)) * f;
        var zh = zw * to.h / to.w;
        setView({ x: cx - zw / 2, y: cy - zh / 2, w: zw, h: zh });
        if (k < 1) flying = requestAnimationFrame(step); else { flying = null; if (done) done(); }
      })(performance.now());
    }
    function jump(box) { if (flying) cancelAnimationFrame(flying); flying = null; setView(clampView(fit(box || FULL))); }
    function isZoomed() { return cam.w < Math.max(FULL.w, FULL.h * aspect()) * .86; }
    function zoomAt(k, px, py) {            /* k < 1 zooms in; px, py a point in the drawing that stays put */
      var v = clampView({ x: px - (px - cam.x) * k, y: py - (py - cam.y) * k, w: cam.w * k, h: cam.h * k });
      setView(v);
    }
    function zoomBy(k) { zoomAt(k, cam.x + cam.w / 2, cam.y + cam.h / 2); }
    function toArt(clientX, clientY) {
      var r = svg.getBoundingClientRect(), a = r.width / r.height, va = cam.w / cam.h, sx, ox = r.left, oy = r.top;
      /* preserveAspectRatio meet: the view is letterboxed inside the element */
      if (a > va) { sx = r.height / cam.h; ox += (r.width - cam.w * sx) / 2; } else { sx = r.width / cam.w; oy += (r.height - cam.h * sx) / 2; }
      return { x: cam.x + (clientX - ox) / sx, y: cam.y + (clientY - oy) / sx, s: sx, ox: ox, oy: oy };
    }
    function toScreen(x, y) {                /* drawing units -> px inside the map */
      var r = svg.getBoundingClientRect(), a = r.width / r.height, va = cam.w / cam.h, sx, ox = 0, oy = 0;
      if (a > va) { sx = r.height / cam.h; ox = (r.width - cam.w * sx) / 2; } else { sx = r.width / cam.w; oy = (r.height - cam.h * sx) / 2; }
      var m = opts.map ? opts.map.getBoundingClientRect() : r;
      return { x: (r.left - m.left) + ox + (x - cam.x) * sx, y: (r.top - m.top) + oy + (y - cam.y) * sx };
    }
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = toArt(e.clientX, e.clientY), k = Math.exp(e.deltaY * (e.ctrlKey ? .012 : .0016));
      if (flying) { cancelAnimationFrame(flying); flying = null; }
      zoomAt(k, p.x, p.y);
    }, { passive: false });
    var ptrs = {}, drag = null, moved = false;
    svg.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (ids.length === 1) { drag = { x: e.clientX, y: e.clientY, cam: cam }; moved = false; }
      else if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cam: cam }; moved = true;
      }
    });
    svg.addEventListener('pointermove', function (e) {
      lastPtr = { x: e.clientX, y: e.clientY };
      if (ptrs[e.pointerId]) ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (!drag) return hover(e);
      var ids = Object.keys(ptrs);
      if (drag.pinch && ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam = drag.cam; var p = toArt(drag.mx, drag.my);
        var k = drag.pinch / Math.max(10, d);
        var v = { x: p.x - (p.x - drag.cam.x) * k, y: p.y - (p.y - drag.cam.y) * k, w: drag.cam.w * k, h: drag.cam.h * k };
        var s = svg.getBoundingClientRect().width / v.w;
        v.x -= (mx - drag.mx) / s; v.y -= (my - drag.my) / s;
        setView(clampView(v));
        return;
      }
      if (ids.length !== 1) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} if (flying) { cancelAnimationFrame(flying); flying = null; } }
      var s2 = toArt(0, 0).s;
      setView(clampView({ x: drag.cam.x - dx / s2, y: drag.cam.y - dy / s2, w: drag.cam.w, h: drag.cam.h }));
      svg.classList.add('is-dragging');
    });
    function up(e) {
      delete ptrs[e.pointerId];
      if (!Object.keys(ptrs).length) { drag = null; svg.classList.remove('is-dragging'); }
      else if (drag && drag.pinch) drag = null;
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('dblclick', function (e) { var p = toArt(e.clientX, e.clientY); zoomAt(.55, p.x, p.y); });

    /* ----- pointing and clicking ----- */
    var lastPtr = null, hoverPart = null;
    function partAt(e) { var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null; return t ? t.getAttribute('data-part') : null; }
    function hover(e) {
      var p = partAt(e);
      if (p === hoverPart) { if (p && opts.onEnter) opts.onEnter(p, e.target, e); return; }
      hoverPart = p;
      svg.style.cursor = p ? 'pointer' : 'grab';
      if (p && G[p] && opts.onEnter) opts.onEnter(p, e.target, e); else if (opts.onLeave) opts.onLeave();
    }
    svg.addEventListener('pointerleave', function () { hoverPart = null; lastPtr = null; if (opts.onLeave) opts.onLeave(); });
    svg.addEventListener('click', function (e) { if (moved) { moved = false; return; } var p = partAt(e); if (p && opts.onClick) opts.onClick(p); });

    function pin(target, label, colour) {
      var tag = opts.tag; if (!tag || !opts.map) return;
      var mr = opts.map.getBoundingClientRect(), x, y;
      if (lastPtr && lastPtr.x >= mr.left && lastPtr.x <= mr.right && lastPtr.y >= mr.top && lastPtr.y <= mr.bottom) { x = lastPtr.x - mr.left; y = lastPtr.y - mr.top - 14; }
      else if (target && target.getBoundingClientRect) { var r = target.getBoundingClientRect(); x = r.left + r.width / 2 - mr.left; y = r.top - mr.top - 6; }
      else return;
      tag.style.left = x + 'px'; tag.style.top = Math.max(22, y) + 'px';
      var pill = tag.querySelector('.tag__pill'); if (pill) pill.textContent = label;
      if (colour) tag.style.setProperty('--c', colour); else tag.style.removeProperty('--c');
      tag.classList.add('on');
    }
    function elFor(id) {
      if (hitOf[id]) return hitOf[id];
      var n = svg.querySelector('.cp__hits [data-part="' + id + '"]') || lensG.querySelector('[data-part="' + id + '"]');
      return n || null;
    }
    function boxOf(id, pad) {
      if (BOX[id]) return BOX[id];
      pad = pad == null ? 24 : pad;
      var b = null;
      function add(x0, y0, x1, y1) { if (!b) b = [x0, y0, x1, y1]; else { b[0] = Math.min(b[0], x0); b[1] = Math.min(b[1], y0); b[2] = Math.max(b[2], x1); b[3] = Math.max(b[3], y1); } }
      (ALIAS[id] || [id]).forEach(function (k) {
        if (FLOW[k]) { var q = FLOW[k].box; add(q[0], q[1], q[0] + q[2], q[1] + q[3]); }
        if (CHAMBERS[k] || k === 'heart') add(BOX.heart.x + pad, BOX.heart.y + pad, BOX.heart.x + BOX.heart.w - pad, BOX.heart.y + BOX.heart.h - pad);
        if (organs[k] && k !== 'heart') organs[k].forEach(function (n) {
          var r = n.getBoundingClientRect(), a1 = toArtFromClient(r.left, r.top), a2 = toArtFromClient(r.right, r.bottom);
          add(a1.x, a1.y, a2.x, a2.y);
        });
      });
      if (!b) return FULL;
      return { x: b[0] - pad, y: b[1] - pad, w: b[2] - b[0] + pad * 2, h: b[3] - b[1] + pad * 2 };
    }
    function toArtFromClient(x, y) { return toArt(x, y); }

    /* ----- the names at the sides ----- */
    var labOn = true, labBeyond = false, labSvg = null;
    if (opts.map && opts.labels !== false) {
      labSvg = document.createElementNS(NS, 'svg');
      labSvg.setAttribute('class', 'cp-labels'); labSvg.setAttribute('aria-hidden', 'true');
      opts.map.appendChild(labSvg);
    }
    var labRaf = null;
    function layoutLabels() {
      if (!labSvg || labRaf) return;
      labRaf = requestAnimationFrame(function () { labRaf = null; drawLabels(); });
    }
    function drawLabels() {
      if (!labSvg) return;
      var m = opts.map.getBoundingClientRect(), W = m.width, H = m.height;
      labSvg.setAttribute('width', W); labSvg.setAttribute('height', H); labSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if (!labOn || W < 10) { labSvg.innerHTML = ''; return; }
      var fs = W < 460 ? 11 : 12.5, lh = fs + 9, pad = 10, scale = toArt(0, 0).s;
      var items = [], seen = {};
      LABELS.forEach(function (L) {
        if (L.beyond && !labBeyond) return;
        if (L.needs && !organs[L.needs]) return;
        if (L.near && scale < L.near) return;
        if (lit && !lit[L.id] && !(L.id === 'heart' && (lit.heart || anyChamber()))) return;
        var key = L.id + '|' + L.text; if (seen[key] && !L.near) return;
        var p = toScreen(L.at[0], L.at[1]);
        if (p.x < 24 || p.x > W - 24 || p.y < 24 || p.y > H - 20) return;
        seen[key] = 1;
        items.push({ L: L, x: p.x, y: p.y, w: L.text.length * fs * .56 + 14 });
      });
      /* one name per part and text: a zoomed-in view shows the nearer of two */
      var out = '';
      /* the body's midline (x 211 in the drawing), not the middle of the picture, decides the side;
         with the heart magnified on the right, every name goes to the left */
      var mid = lensMode ? W : Math.max(W * .3, Math.min(W * .7, toScreen(211, 0).x));
      ['L', 'R'].forEach(function (side) {
        var it = items.filter(function (i) { return side === 'L' ? i.x < mid : i.x >= mid; }).sort(function (a, b) { return a.y - b.y; });
        if (!it.length) return;
        var colW = Math.max.apply(null, it.map(function (o) { return o.w; }));
        var edge = side === 'L' ? pad + colW : W - pad - colW, dir = side === 'L' ? -1 : 1;
        var i;
        for (i = 0; i < it.length; i++) it[i].ly = it[i].y;
        for (i = 1; i < it.length; i++) if (it[i].ly < it[i - 1].ly + lh) it[i].ly = it[i - 1].ly + lh;
        var over = it[it.length - 1].ly - (H - 16);
        if (over > 0) { for (i = 0; i < it.length; i++) it[i].ly -= over; for (i = it.length - 2; i >= 0; i--) if (it[i].ly > it[i + 1].ly - lh) it[i].ly = it[i + 1].ly - lh; }
        it.forEach(function (o) {
          /* level from the part to just outside the column, a short step to its own row, level in */
          var x1 = edge - dir * 12, x2 = edge - dir * 4;
          if ((side === 'L' && o.x < x1 + 2) || (side === 'R' && o.x > x1 - 2)) x1 = o.x;
          var d = 'M' + f2(o.x) + ' ' + f2(o.y) + 'L' + f2(x1) + ' ' + f2(o.y) + 'L' + f2(x2) + ' ' + f2(o.ly) + 'L' + f2(edge) + ' ' + f2(o.ly);
          var tx = side === 'L' ? edge - o.w : edge;
          var cls = 'cp-lab' + (o.L.beyond ? ' is-beyond' : '');
          out += '<g class="' + cls + '"><path class="cp-lab__halo" d="' + d + '"/><path class="cp-lab__lead" d="' + d + '"/><circle class="cp-lab__dot" cx="' + f2(o.x) + '" cy="' + f2(o.y) + '" r="2.2"/>' +
            '<rect class="cp-lab__pill" x="' + f2(tx) + '" y="' + f2(o.ly - lh / 2 + 2) + '" width="' + f2(o.w) + '" height="' + f2(lh - 4) + '" rx="' + f2((lh - 4) / 2) + '"/>' +
            '<text class="cp-lab__txt" x="' + f2(tx + o.w / 2) + '" y="' + f2(o.ly + fs * .36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + o.L.text + '</text></g>';
        });
      });
      labSvg.innerHTML = out;
    }
    function labels(on, beyond) { if (on != null) labOn = !!on; if (beyond != null) labBeyond = !!beyond; layoutLabels(); }
    if (global.ResizeObserver && opts.map) {
      var ro = new ResizeObserver(function () { if (!svg.isConnected) { ro.disconnect(); return; } jump(cam && isZoomed() ? cam : FULL); });
      ro.observe(opts.map);
    }

    buildLens(); lens(null);
    applyLight();
    setView(clampView(fit(FULL)));
    paintBeat();

    return {
      G: G, FULL: FULL, BOX: BOX, light: light, clear: function () { return light(null); }, lens: lens,
      flyTo: flyTo, jump: jump, boxOf: boxOf, isZoomed: isZoomed, zoomBy: zoomBy, home: function (done) { flyTo(FULL, done); },
      labels: labels, pin: pin, elFor: elFor,
      setRate: setRate, rate: function () { return bpm; },
      heartMode: function (m) { var k = m === 'exterior' ? 'exterior' : 'section'; if (k !== heartKind) { heartKind = k; buildLens(); lens(lensMode ? k : null); } },
      flow: function (on) { flowOn = on !== false; },
      start: start, stop: stop,
      /* for the headless checks: one moment of the beat, and the blood t seconds on */
      __seek: function (ph, t) {
        stop(); phase = ph || 0; beat = beatState(phase, bpm); paintBeat();
        flows.forEach(function (f) { f.off = 0; }); moveFlow(t || 0);
      }
    };
  }

  global.CircDraw = CircDraw;
  global.CircDraw.G = G;
  global.CircDraw.beatState = beatState;
})(window);
