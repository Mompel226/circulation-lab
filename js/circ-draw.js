/* ============================================================
   circ-draw.js — the plate: a body with its whole circulation inside it.

   The body outline is Mikael Häggström's "Man shadow" (CC0, js/body-art.js), the same outline the
   Human Body Hub stands its organs in. Everything inside it is drawn here, in the outline's own
   coordinates (viewBox 352 86 576 1164): the heart (js/heart-art.js) where the heart is, the
   lungs, liver, kidneys and gut where they are, and every vessel the syllabus names running
   between them. Blood flows: red cells move along every vessel, change colour in the capillaries
   of the lungs and of the body, and pulse with the heartbeat.

   Colours follow the convention every diagram uses, and the lab says so: RED is oxygenated
   blood and BLUE is deoxygenated blood. Real deoxygenated blood is dark red, never blue.

   CircDraw(svg, opts) → an object the lab's plate.js drives:
     light(ids) / clear()        light some parts, dim the rest
     flyTo(box, done)            move the camera; boxOf(id, pad), FULL, isZoomed()
     setRate(bpm)                the heart rate the heart beats and the blood flows at
     heartMode('section'|'exterior')
     pin(el, label, colour)      the name tag over a part
     G                           the parts: label, note, colour
   ============================================================ */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var ART = global.BODY_ART || { viewBox: [352, 86, 576, 1164], skin: { d: '', tx: 0, ty: 0 } };
  var SCENE = { x: ART.viewBox[0], y: ART.viewBox[1], w: ART.viewBox[2], h: ART.viewBox[3] };
  /* the heart's local frame (js/heart-art.js) placed in the body */
  var HT = { cx: 648, cy: 668, s: 0.46, ox: 205, oy: 300 };
  function hx(x) { return HT.cx + (x - HT.ox) * HT.s; }
  function hy(y) { return HT.cy + (y - HT.oy) * HT.s; }

  var OXY = '#E8453F', DEO = '#3F72D6';
  var OXY_CELL = '#FF8A7E', DEO_CELL = '#8FB2FF';

  /* ---------- the parts: what a hover names, what a station lights ---------- */
  var G = {
    heart:   { label: 'The heart', note: 'two pumps side by side, one for each circulation', colour: '#FF7F72' },
    ra:      { label: 'Right atrium', note: 'receives deoxygenated blood from the body', colour: '#8FB2FF' },
    la:      { label: 'Left atrium', note: 'receives oxygenated blood from the lungs', colour: '#FF8A7E' },
    rv:      { label: 'Right ventricle', note: 'pumps blood to the lungs', colour: '#8FB2FF' },
    lv:      { label: 'Left ventricle', note: 'pumps blood to the whole body', colour: '#FF8A7E' },
    septum:  { label: 'Septum', note: 'keeps oxygenated and deoxygenated blood apart', colour: '#FFB0A2' },
    'av-valves': { label: 'Atrioventricular valves', note: 'between each atrium and its ventricle', colour: '#F4E6D0' },
    'sl-valves': { label: 'Semilunar valves', note: 'where the blood leaves the ventricles', colour: '#F4E6D0' },
    coronary: { label: 'Coronary arteries', note: 'the heart muscle’s own blood supply', colour: '#FF8A7E' },
    lungs:   { label: 'Lungs', note: 'the blood picks up oxygen here', colour: '#F2B8C2' },
    aorta:   { label: 'Aorta', note: 'the artery that carries blood to the body', colour: '#FF8A7E' },
    'vena-cava': { label: 'Vena cava', note: 'the vein that returns blood from the body', colour: '#8FB2FF' },
    'pulmonary-artery': { label: 'Pulmonary artery', note: 'carries blood from the heart to the lungs', colour: '#8FB2FF' },
    'pulmonary-vein': { label: 'Pulmonary vein', note: 'carries blood from the lungs to the left atrium; from the right lung it passes behind the heart', colour: '#FF8A7E' },
    'hepatic-artery': { label: 'Hepatic artery', note: 'oxygenated blood to the liver', colour: '#FF8A7E' },
    'hepatic-vein': { label: 'Hepatic vein', note: 'blood from the liver to the vena cava', colour: '#8FB2FF' },
    'hepatic-portal-vein': { label: 'Hepatic portal vein', note: 'from the gut to the liver', colour: '#8FB2FF' },
    'renal-artery': { label: 'Renal artery', note: 'blood to the kidney', colour: '#FF8A7E' },
    'renal-vein': { label: 'Renal vein', note: 'blood from the kidney', colour: '#8FB2FF' },
    liver:   { label: 'Liver', note: 'two vessels in, one out', colour: '#E0A08E' },
    kidneys: { label: 'Kidneys', note: 'a renal artery in, a renal vein out', colour: '#E0A08E' },
    gut:     { label: 'Capillaries of the gut', note: 'where digested food is absorbed', colour: '#E6C1A4' },
    head:    { label: 'Capillaries of the head', note: 'the brain’s supply', colour: '#C9D8E6' },
    arms:    { label: 'Capillaries of the arms', note: 'exchange with the arm muscles', colour: '#C9D8E6' },
    legs:    { label: 'Capillaries of the legs', note: 'exchange with the leg muscles', colour: '#C9D8E6' },
    body:    { label: 'The body', note: 'every organ, in parallel', colour: '#C9D8E6' },
    /* the other big vessels on the body. Each has its own name, so none is ever called the aorta or
       the vena cava by mistake; the syllabus names none of them, and the notes say so. */
    'aorta-branch': { label: 'Branch of the aorta', note: 'one of the three arteries from the arch of the aorta, to the head and arms', colour: '#FF8A7E' },
    carotid:  { label: 'Carotid artery', note: 'takes blood to the head; the pulse in the neck (not named in 0610)', colour: '#FF8A7E' },
    'arm-artery': { label: 'Artery to the arm', note: 'the subclavian artery, then the arteries of the arm; the pulse at the wrist (not named in 0610)', colour: '#FF8A7E' },
    'leg-artery': { label: 'Artery to the leg', note: 'the iliac artery, a branch of the aorta (not named in 0610)', colour: '#FF8A7E' },
    'gut-artery': { label: 'Artery to the intestine', note: 'the mesenteric artery, a branch of the aorta (not named in 0610)', colour: '#FF8A7E' },
    jugular:  { label: 'Jugular vein', note: 'brings blood back from the head (not named in 0610)', colour: '#8FB2FF' },
    'arm-vein': { label: 'Vein from the arm', note: 'the subclavian vein (not named in 0610)', colour: '#8FB2FF' },
    'head-arm-vein': { label: 'Brachiocephalic vein', note: 'the two join to form the vena cava (not named in 0610)', colour: '#8FB2FF' },
    'leg-vein': { label: 'Vein from the leg', note: 'the iliac vein; the two join to form the vena cava (not named in 0610)', colour: '#8FB2FF' }
  };

  /* ---------- the vessels, as centre lines in the body's coordinates ----------
     w is the drawn width. kind: 'a' artery, 'v' vein. oxy: the blood it carries is oxygenated.
     back: drawn behind the organs it passes. The direction of each path is the direction of flow. */
  var V = [
    /* systemic arteries */
    { id: 'aoAbd', part: 'aorta', kind: 'a', oxy: 1, w: 11, back: 1,
      d: 'M' + hx(300) + ' ' + hy(540) + ' C 690 812 662 830 661 862 L 661 1118' },
    { id: 'iliacR', part: 'leg-artery', kind: 'a', oxy: 1, w: 8, d: 'M661 1118 C 648 1146 622 1168 606 1200 L 600 1236' },
    { id: 'iliacL', part: 'leg-artery', kind: 'a', oxy: 1, w: 8, d: 'M661 1118 C 676 1146 704 1168 718 1200 L 724 1236' },
    { id: 'hepA', part: 'hepatic-artery', kind: 'a', oxy: 1, w: 5, d: 'M661 846 C 648 840 626 842 606 850' },
    { id: 'sma', part: 'gut-artery', kind: 'a', oxy: 1, w: 6, d: 'M661 884 C 668 910 664 948 652 992' },
    { id: 'renAL', part: 'renal-artery', kind: 'a', oxy: 1, w: 5, d: 'M661 916 C 676 918 690 922 701 926' },
    { id: 'renAR', part: 'renal-artery', kind: 'a', oxy: 1, w: 5, back: 1, d: 'M661 920 C 632 922 598 930 574 944' },
    { id: 'brachio', part: 'aorta-branch', kind: 'a', oxy: 1, w: 6, d: 'M' + hx(193) + ' ' + hy(-60) + ' C 638 492 634 486 628 478' },
    { id: 'carR', part: 'carotid', kind: 'a', oxy: 1, w: 5, d: 'M628 478 C 624 440 622 380 622 300' },
    { id: 'carL', part: 'carotid', kind: 'a', oxy: 1, w: 5, d: 'M' + hx(247) + ' ' + hy(-60) + ' C 664 460 662 380 662 300' },
    { id: 'subR', part: 'arm-artery', kind: 'a', oxy: 1, w: 5, d: 'M628 478 C 600 470 540 470 496 500 C 470 520 462 560 458 620 C 452 720 440 820 420 912' },
    { id: 'subL', part: 'arm-artery', kind: 'a', oxy: 1, w: 5, d: 'M' + hx(299) + ' ' + hy(-60) + ' C 704 480 752 470 790 500 C 816 522 822 560 826 620 C 832 720 842 820 862 912' },
    /* systemic veins */
    { id: 'ivc', part: 'vena-cava', kind: 'v', oxy: 0, w: 12, d: 'M598 1118 L 598 960 C 598 900 596 850 586 820 C 580 804 572 796 ' + hx(28) + ' ' + hy(540) },
    { id: 'iliacVR', part: 'leg-vein', kind: 'v', oxy: 0, w: 8, back: 1, d: 'M584 1238 L 588 1200 C 590 1170 594 1142 598 1118' },
    { id: 'iliacVL', part: 'leg-vein', kind: 'v', oxy: 0, w: 8, back: 1, d: 'M740 1238 L 734 1200 C 724 1168 690 1142 640 1128 C 620 1122 606 1120 598 1118' },
    { id: 'renVR', part: 'renal-vein', kind: 'v', oxy: 0, w: 6, d: 'M574 952 C 582 952 590 950 598 948' },
    { id: 'renVL', part: 'renal-vein', kind: 'v', oxy: 0, w: 6, d: 'M701 934 C 680 934 650 936 620 940 C 610 941 604 942 598 942' },
    { id: 'hepV', part: 'hepatic-vein', kind: 'v', oxy: 0, w: 6, d: 'M540 832 C 552 824 564 814 576 804' },
    { id: 'hepV2', part: 'hepatic-vein', kind: 'v', oxy: 0, w: 5, d: 'M616 834 C 604 826 592 816 582 806' },
    { id: 'portal', part: 'hepatic-portal-vein', kind: 'v', oxy: 0, w: 8, d: 'M632 992 C 634 960 630 920 622 890 C 618 874 612 862 604 856' },
    { id: 'jugR', part: 'jugular', kind: 'v', oxy: 0, w: 6, d: 'M608 300 C 608 380 608 440 604 480' },
    { id: 'jugL', part: 'jugular', kind: 'v', oxy: 0, w: 6, d: 'M676 300 C 676 380 674 440 668 478' },
    { id: 'subVR', part: 'arm-vein', kind: 'v', oxy: 0, w: 6, d: 'M432 916 C 452 820 466 720 470 620 C 474 560 482 526 506 508 C 540 486 580 482 604 480' },
    { id: 'subVL', part: 'arm-vein', kind: 'v', oxy: 0, w: 6, d: 'M850 916 C 832 820 818 720 814 620 C 810 560 802 524 778 506 C 744 484 700 480 668 478' },
    { id: 'bcvL', part: 'head-arm-vein', kind: 'v', oxy: 0, w: 7, d: 'M668 478 C 646 482 624 488 ' + hx(104) + ' ' + (hy(-60) - 2) },
    { id: 'bcvR', part: 'head-arm-vein', kind: 'v', oxy: 0, w: 7, d: 'M604 480 C 603 488 602 494 ' + hx(104) + ' ' + (hy(-60) - 2) }
  ];

  /* ---------- the capillary beds: where the blood changes colour ----------
     A bed is a net of fine vessels filling a region. The artery arrives at inP and branches into
     it; the net drains into the vein at outP. Every piece of the net is coloured by how far along
     the way from artery to vein it lies: OXY → DEO in the body, DEO → OXY in the lungs. `region`
     is an organ's outline (ORG) or an ellipse [cx, cy, rx, ry, degrees]. */
  var BEDS = [
    { id: 'lungR', part: 'lungs', inP: [hx(-30), hy(161)], outP: [hx(-30), hy(206)], lung: 1, region: 'lungR', sp: 15 },
    { id: 'lungL', part: 'lungs', inP: [hx(430), hy(145)], outP: [hx(430), hy(206)], lung: 1, region: 'lungL', sp: 15 },
    { id: 'head', part: 'head', inP: [622, 300], outP: [608, 300], region: [640, 205, 78, 86, 0], sp: 15, also: { inP: [662, 300], outP: [676, 300] } },
    { id: 'armR', part: 'arms', inP: [420, 912], outP: [432, 916], region: [414, 978, 20, 62, 12], sp: 11 },
    { id: 'armL', part: 'arms', inP: [862, 912], outP: [850, 916], region: [868, 978, 20, 62, -12], sp: 11 },
    { id: 'liver', part: 'liver', inP: [606, 852], outP: [540, 832], region: 'liver', sp: 14, also: { inP: [606, 852], outP: [616, 834] } },
    { id: 'kidR', part: 'kidneys', inP: [572, 944], outP: [572, 954], region: 'kidR', sp: 10 },
    { id: 'kidL', part: 'kidneys', inP: [701, 926], outP: [701, 936], region: 'kidL', sp: 10 },
    { id: 'gut', part: 'gut', inP: [652, 994], outP: [632, 994], region: [652, 1054, 82, 56, 0], sp: 14 },
    { id: 'legR', part: 'legs', inP: [600, 1236], outP: [584, 1238], region: [566, 1226, 44, 20, 0], sp: 11 },
    { id: 'legL', part: 'legs', inP: [724, 1236], outP: [740, 1238], region: [758, 1226, 44, 20, 0], sp: 11 }
  ];

  /* ---------- organ shapes ---------- */
  var ORG = {
    lungR: 'M566 514 C540 520 516 560 508 610 C500 660 496 720 500 772 C530 790 572 784 608 776 C604 740 598 700 596 668 C594 620 596 580 590 548 C586 526 578 514 566 514 Z',
    lungL: 'M718 514 C744 520 768 560 776 612 C784 664 788 724 784 778 C760 792 724 792 700 786 C704 766 712 750 724 742 C708 728 700 708 700 690 C700 640 700 590 706 548 C708 528 712 516 718 514 Z',
    fissR: 'M502 648 C530 646 566 640 598 634 M520 566 C548 640 578 710 604 772',
    fissL: 'M712 560 C738 640 762 710 784 776',
    liver: 'M500 776 C540 764 600 762 650 766 C690 770 720 778 738 790 C720 806 690 822 660 836 C630 852 600 868 570 876 C540 882 514 872 504 850 C496 830 496 800 500 776 Z',
    kidR: 'M548 906 C528 906 520 928 522 950 C524 974 534 994 552 994 C566 994 572 982 570 968 C568 958 574 952 574 946 C574 938 568 930 570 922 C572 912 562 906 548 906 Z',
    kidL: 'M724 896 C744 896 752 918 750 940 C748 964 738 984 720 984 C706 984 700 972 702 958 C704 948 698 942 698 936 C698 928 704 920 702 912 C700 902 710 896 724 896 Z',
    gut: 'M604 1000 C586 1000 578 1014 590 1022 C606 1032 640 1016 660 1008 C684 998 716 996 722 1012 C728 1030 704 1036 684 1034 C660 1032 636 1036 616 1044 C594 1052 578 1060 584 1074 C590 1088 612 1082 630 1076 C652 1068 676 1060 698 1060 C722 1060 736 1070 730 1084 C724 1098 700 1096 680 1092 C656 1088 632 1092 612 1100 C596 1106 594 1120 610 1122 C630 1124 652 1114 674 1112 C694 1110 708 1116 712 1110'
  };

  function el(tag, attrs, parent) {
    var e = document.createElementNS(NS, tag);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function f2(v) { return Math.round(v * 100) / 100; }
  function f4(v) { return Math.round(v * 10000) / 10000; }
  function hexRgb(c) { return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)]; }
  function mix(a, b, k) { var x = hexRgb(a), y = hexRgb(b); return 'rgb(' + Math.round(x[0] + (y[0] - x[0]) * k) + ',' + Math.round(x[1] + (y[1] - x[1]) * k) + ',' + Math.round(x[2] + (y[2] - x[2]) * k) + ')'; }

  /* a loop through a capillary bed: out from the artery to a point in the organ, back to the vein */
  function loopPath(a, p, b) {
    var mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
    var c1 = [a[0] + (p[0] - mx) * .55, a[1] + (p[1] - my) * .55], c2 = [p[0] - (b[0] - a[0]) * .18, p[1] - (b[1] - a[1]) * .18];
    var c3 = [p[0] + (b[0] - a[0]) * .18, p[1] + (b[1] - a[1]) * .18], c4 = [b[0] + (p[0] - mx) * .55, b[1] + (p[1] - my) * .55];
    return 'M' + f2(a[0]) + ' ' + f2(a[1]) + ' C' + f2(c1[0]) + ' ' + f2(c1[1]) + ' ' + f2(c2[0]) + ' ' + f2(c2[1]) + ' ' + f2(p[0]) + ' ' + f2(p[1]) +
           ' C' + f2(c3[0]) + ' ' + f2(c3[1]) + ' ' + f2(c4[0]) + ' ' + f2(c4[1]) + ' ' + f2(b[0]) + ' ' + f2(b[1]);
  }

  /* ---------- the beat ----------
     One beat, as a fraction of the cycle. At rest (72 a minute) the ventricles contract for
     about a third of the cycle and relax for two thirds; as the rate rises, the relaxation is
     what gets shorter. */
  function beatState(ph, bpm) {
    var sys = Math.min(.62, .3 / (60 / Math.max(40, bpm)) * 1.0);   /* fraction of the cycle the ventricles spend contracting, ~0.3 s */
    var aS = .12, v0 = .13, v1 = v0 + sys;
    function bump(t, a, b) { if (t <= a || t >= b) return 0; var k = (t - a) / (b - a); return Math.sin(Math.PI * k); }
    function ramp(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
    var atria = bump(ph, 0, aS);
    var vent = ph < v0 ? 0 : ph < v1 ? Math.sin(Math.PI * Math.min(1, (ph - v0) / (sys * 1.1))) : 0;
    var av = 1 - ramp(ph, v0 - .01, v0 + .02) + ramp(ph, v1 + .03, v1 + .07);
    var sl = ramp(ph, v0 + .03, v0 + .06) - ramp(ph, v1 - .02, v1 + .01);
    return { atria: atria, vent: vent, av: Math.max(0, Math.min(1, av)), sl: Math.max(0, Math.min(1, sl)), ejecting: ph > v0 + .04 && ph < v1 };
  }

  function CircDraw(svg, opts) {
    opts = opts || {};
    var still = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    svg.setAttribute('viewBox', SCENE.x + ' ' + SCENE.y + ' ' + SCENE.w + ' ' + SCENE.h);
    var defs = svg.querySelector('defs') || el('defs', {}, svg);
    defs.innerHTML =
      '<radialGradient id="cdSky" cx=".5" cy=".42" r=".75"><stop offset="0" stop-color="#11232D"/><stop offset=".7" stop-color="#0A161D"/><stop offset="1" stop-color="#060D12"/></radialGradient>' +
      '<linearGradient id="cdSkin" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1B2F3A"/><stop offset="1" stop-color="#132029"/></linearGradient>' +
      '<filter id="cdGlow" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="3.2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>' +
      '<filter id="cdSoft" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="6"/></filter>';

    var root = el('g', { 'class': 'cd' }, svg);
    el('rect', { x: SCENE.x - 400, y: SCENE.y - 400, width: SCENE.w + 800, height: SCENE.h + 800, fill: 'url(#cdSky)' }, root);
    /* the body: a rim of soft light, then the outline */
    var body = el('g', { 'class': 'cd__body', transform: 'translate(' + ART.skin.tx + ',' + ART.skin.ty + ')' }, root);
    el('path', { d: ART.skin.d, fill: 'none', stroke: '#4F7486', 'stroke-width': 10, opacity: .22, filter: 'url(#cdSoft)' }, body);
    el('path', { d: ART.skin.d, fill: 'url(#cdSkin)', stroke: '#48697A', 'stroke-width': 1.3 }, body);

    var gBack = el('g', { 'class': 'cd__back' }, root);     /* vessels behind the organs */
    var gOrg = el('g', { 'class': 'cd__organs' }, root);
    var gBeds = el('g', { 'class': 'cd__beds' }, root);
    var gVes = el('g', { 'class': 'cd__vessels' }, root);
    var gHeart = el('g', { 'class': 'cd__heart',
      transform: 'translate(' + f4(HT.cx - HT.ox * HT.s) + ',' + f4(HT.cy - HT.oy * HT.s) + ') scale(' + HT.s + ')' }, root);
    var gCells = el('g', { 'class': 'cd__cells' }, root);
    var gHit = el('g', { 'class': 'cd__hits' }, root);

    /* ----- organs ----- */
    function organ(d, part, fill, stroke, op) {
      return el('path', { d: d, fill: fill, 'fill-opacity': op, stroke: stroke, 'stroke-width': 1.2, 'stroke-opacity': .55, 'data-part': part, 'class': 'cd__org' }, gOrg);
    }
    organ(ORG.lungR, 'lungs', '#E7B4BE', '#F0C8D0', .16);
    organ(ORG.lungL, 'lungs', '#E7B4BE', '#F0C8D0', .16);
    el('path', { d: ORG.fissR + ' ' + ORG.fissL, fill: 'none', stroke: '#F0C8D0', 'stroke-opacity': .28, 'stroke-width': 1, 'data-part': 'lungs', 'class': 'cd__org' }, gOrg);
    organ(ORG.liver, 'liver', '#9A4A3C', '#D08A74', .42);
    organ(ORG.kidR, 'kidneys', '#A8584A', '#D89A86', .45);
    organ(ORG.kidL, 'kidneys', '#A8584A', '#D89A86', .45);
    /* the small intestine: one tube folding back and forth, a darker edge, a paler centre */
    el('path', { d: ORG.gut, fill: 'none', stroke: '#6E4336', 'stroke-opacity': .55, 'stroke-width': 17, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-part': 'gut', 'class': 'cd__org' }, gOrg);
    el('path', { d: ORG.gut, fill: 'none', stroke: '#C99280', 'stroke-opacity': .5, 'stroke-width': 13.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'data-part': 'gut', 'class': 'cd__org' }, gOrg);
    el('path', { d: ORG.gut, fill: 'none', stroke: '#F3D2BE', 'stroke-opacity': .28, 'stroke-width': 4, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', transform: 'translate(-1,-2)', 'data-part': 'gut', 'class': 'cd__org' }, gOrg);

    /* ----- a tube: a darker wall, the lumen, a line of light along it ----- */
    var TRACKS = [];
    function tube(v) {
      var host = v.back ? gBack : gVes;
      var g = el('g', { 'class': 'cd__v cd__v--' + (v.kind === 'a' ? 'art' : 'vein'), 'data-part': v.part, 'data-v': v.id }, host);
      var col = v.oxy ? OXY : DEO;
      el('path', { d: v.d, fill: 'none', stroke: v.oxy ? '#7A1E21' : '#1B3570', 'stroke-width': v.w + (v.kind === 'a' ? 2.4 : 1.4), 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, g);
      el('path', { d: v.d, fill: 'none', stroke: col, 'stroke-width': v.w, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'class': 'cd__lumen' }, g);
      el('path', { d: v.d, fill: 'none', stroke: '#FFFFFF', 'stroke-opacity': .16, 'stroke-width': Math.max(1, v.w * .22), 'stroke-linecap': 'round', transform: 'translate(-' + f2(v.w * .18) + ',-' + f2(v.w * .12) + ')' }, g);
      TRACKS.push({ d: v.d, oxy0: v.oxy, oxy1: v.oxy, speed: v.kind === 'a' ? 120 : 70, pulse: v.kind === 'a', gap: v.w > 9 ? 13 : 17, part: v.part, cell: Math.min(1.25, .6 + v.w * .06) });
      el('path', { d: v.d, fill: 'none', stroke: 'transparent', 'stroke-width': Math.max(16, v.w + 10), 'data-part': v.part, 'class': 'cd__hit' }, gHit);
    }
    V.forEach(tube);

    /* ----- the beds: a net, the arterioles into it, the venules out of it ----- */
    function rng(seed) { var x = seed >>> 0; return function () { x = (Math.imul(x, 1664525) + 1013904223) >>> 0; return x / 4294967296; }; }
    function regionTest(b) {
      if (typeof b.region === 'string') {
        var pr = el('path', { d: ORG[b.region] }, svg);
        var bb = pr.getBBox();
        var P = svg.createSVGPoint();
        return { box: bb, has: function (x, y) { P.x = x; P.y = y; return pr.isPointInFill(P); }, done: function () { svg.removeChild(pr); } };
      }
      var r = b.region, cx = r[0], cy = r[1], rx = r[2], ry = r[3], a = (r[4] || 0) * Math.PI / 180, ca = Math.cos(a), sa = Math.sin(a);
      var R = Math.max(rx, ry);
      return { box: { x: cx - R, y: cy - R, width: 2 * R, height: 2 * R },
               has: function (x, y) { var dx = x - cx, dy = y - cy, u = dx * ca + dy * sa, v = -dx * sa + dy * ca; return (u * u) / (rx * rx) + (v * v) / (ry * ry) <= 1; },
               done: function () {} };
    }
    function bed(b, inP, outP, seed) {
      var from = b.lung ? DEO : OXY, to = b.lung ? OXY : DEO;
      var g = el('g', { 'class': 'cd__bed', 'data-part': b.part }, gBeds);
      var R = regionTest(b), rand = rng(seed), sp = b.sp, pts = [];
      for (var y = R.box.y + sp / 2; y < R.box.y + R.box.height; y += sp * .86)
        for (var x = R.box.x + sp / 2 + ((Math.round(y / sp) % 2) ? sp / 2 : 0); x < R.box.x + R.box.width; x += sp) {
          var px = x + (rand() - .5) * sp * .7, py = y + (rand() - .5) * sp * .7;
          if (R.has(px, py)) pts.push([px, py]);
        }
      R.done();
      function tOf(p) { var a = Math.hypot(p[0] - inP[0], p[1] - inP[1]), c = Math.hypot(p[0] - outP[0], p[1] - outP[1]); return a / (a + c + 1e-6); }
      /* the net: each point joined to its near neighbours by a slightly bent piece */
      var seen = {}, net = '';
      pts.forEach(function (p, i) {
        var near = pts.map(function (q, j) { return [j, Math.hypot(q[0] - p[0], q[1] - p[1])]; })
          .filter(function (e) { return e[0] !== i && e[1] < sp * 1.35; }).sort(function (u, v) { return u[1] - v[1]; }).slice(0, 3);
        near.forEach(function (e) {
          var j = e[0], key = i < j ? i + '-' + j : j + '-' + i; if (seen[key]) return; seen[key] = 1;
          var q = pts[j], mx = (p[0] + q[0]) / 2 + (rand() - .5) * sp * .35, my = (p[1] + q[1]) / 2 + (rand() - .5) * sp * .35;
          var k = (tOf(p) + tOf(q)) / 2;
          net += '<path d="M' + f2(p[0]) + ' ' + f2(p[1]) + ' Q' + f2(mx) + ' ' + f2(my) + ' ' + f2(q[0]) + ' ' + f2(q[1]) + '" stroke="' + mix(from, to, Math.max(0, Math.min(1, (k - .25) / .5))) + '"/>';
        });
      });
      var gn = el('g', { fill: 'none', 'stroke-width': 1, 'stroke-opacity': .78, 'stroke-linecap': 'round' }, g);
      gn.innerHTML = net;
      /* arterioles fanning in from the artery, venules gathering to the vein: a few curved branches */
      function branches(end, side, col, w) {
        var cand = pts.filter(function (p) { var t = tOf(p); return side < 0 ? t < .34 : t > .66; });
        cand.sort(function (u, v) { return Math.hypot(u[0] - end[0], u[1] - end[1]) - Math.hypot(v[0] - end[0], v[1] - end[1]); });
        var pick = [], step = Math.max(1, Math.floor(cand.length / 5));
        for (var i = Math.floor(step / 2); i < cand.length && pick.length < 5; i += step) pick.push(cand[i]);
        var d = '';
        pick.forEach(function (q) {
          var mx = (end[0] + q[0]) / 2 + (rand() - .5) * 10, my = (end[1] + q[1]) / 2 + (rand() - .5) * 10;
          d += 'M' + f2(end[0]) + ' ' + f2(end[1]) + ' Q' + f2(mx) + ' ' + f2(my) + ' ' + f2(q[0]) + ' ' + f2(q[1]) + ' ';
        });
        el('path', { d: d, fill: 'none', stroke: col, 'stroke-width': w, 'stroke-linecap': 'round', 'stroke-opacity': .95 }, g);
        return pick;
      }
      var ins = branches(inP, -1, from, 2.1), outs = branches(outP, 1, to, 2.3);
      /* a few routes through the net for the cells: artery → an arteriole end → the net → a venule end → vein */
      for (var r = 0; r < Math.min(ins.length, outs.length); r++) {
        var a = ins[r], c = outs[(r * 2 + 1) % outs.length];
        var mid = pts[Math.floor(rand() * pts.length)] || [(a[0] + c[0]) / 2, (a[1] + c[1]) / 2];
        var d = 'M' + f2(inP[0]) + ' ' + f2(inP[1]) + ' Q' + f2((inP[0] + a[0]) / 2) + ' ' + f2((inP[1] + a[1]) / 2) + ' ' + f2(a[0]) + ' ' + f2(a[1]) +
                ' Q' + f2(mid[0]) + ' ' + f2(mid[1]) + ' ' + f2(c[0]) + ' ' + f2(c[1]) + ' Q' + f2((c[0] + outP[0]) / 2) + ' ' + f2((c[1] + outP[1]) / 2) + ' ' + f2(outP[0]) + ' ' + f2(outP[1]);
        TRACKS.push({ d: d, oxy0: b.lung ? 0 : 1, oxy1: b.lung ? 1 : 0, speed: 22, pulse: false, gap: 26, part: b.part, cell: .5, bed: true });
      }
      /* the whole region is the thing to click */
      if (typeof b.region === 'string') el('path', { d: ORG[b.region], fill: 'transparent', 'data-part': b.part, 'class': 'cd__hit' }, gHitBeds);
      else { var rr = b.region; el('ellipse', { cx: rr[0], cy: rr[1], rx: rr[2] + 6, ry: rr[3] + 6, transform: 'rotate(' + (rr[4] || 0) + ' ' + rr[0] + ' ' + rr[1] + ')', fill: 'transparent', 'data-part': b.part, 'class': 'cd__hit' }, gHitBeds); }
    }
    var gHitBeds = el('g', { 'class': 'cd__hits cd__hits--beds' }, root);
    root.insertBefore(gHitBeds, gHit);
    BEDS.forEach(function (b, i) { bed(b, b.inP, b.outP, 7 + i * 131); if (b.also) bed(b, b.also.inP, b.also.outP, 91 + i * 17); });

    /* the heart catches clicks on its own drawing (its chambers and vessels carry data-part) */

    /* ----- the heart ----- */
    var mode = 'section', beat = { atria: 0, vent: 0, av: 1, sl: 0 };
    function drawHeart() {
      gHeart.innerHTML = global.HeartArt ? global.HeartArt.svg(beat, { mode: mode, ids: 'cdh-' }) : '';
      nodes = {
        ra: gHeart.querySelector('.ha__ra'), la: gHeart.querySelector('.ha__la'), rv: gHeart.querySelector('.ha__rv'), lv: gHeart.querySelector('.ha__lv'),
        outer: gHeart.querySelector('.ha__outer'), av: gHeart.querySelector('.ha__av'), sl: gHeart.querySelector('.ha__sl'),
        cords: gHeart.querySelectorAll('.ha__cords line')
      };
      applyLight();
    }
    var nodes = {};
    function paintBeat() {
      if (!global.HeartArt || !nodes.outer) return;
      var p = global.HeartArt.paths(beat);
      nodes.outer.setAttribute('d', p.outer);
      if (mode !== 'section') return;
      nodes.ra.setAttribute('d', p.ra); nodes.la.setAttribute('d', p.la);
      nodes.rv.setAttribute('d', p.rv); nodes.lv.setAttribute('d', p.lv);
      nodes.av.setAttribute('d', p.tri + ' ' + p.mit);
      if (nodes.sl) nodes.sl.setAttribute('d', p.pulv + ' ' + p.aov);
      for (var i = 0; i < nodes.cords.length; i++) {
        var c = p.cords[i]; nodes.cords[i].setAttribute('x1', f2(c[0][0])); nodes.cords[i].setAttribute('y1', f2(c[0][1]));
      }
    }
    drawHeart();

    /* ----- the red cells ----- */
    var CELLS = [];
    TRACKS.forEach(function (t) {
      var probe = el('path', { d: t.d }, svg), L = probe.getTotalLength();
      var pts = [], step = 3;
      for (var s = 0; s <= L; s += step) { var q = probe.getPointAtLength(s); pts.push([q.x, q.y]); }
      svg.removeChild(probe);
      t.L = L; t.pts = pts; t.step = step;
      var n = Math.max(1, Math.floor(L / t.gap));
      for (var i = 0; i < n; i++) {
        var c = el('ellipse', { rx: f2(3.2 * t.cell), ry: f2(2 * t.cell), 'class': 'cd__cell', 'data-part': t.part }, gCells);
        CELLS.push({ el: c, t: t, s0: (i + Math.random() * .6) * (L / n) });
      }
    });
    function placeCells(time, pulse) {
      for (var i = 0; i < CELLS.length; i++) {
        var c = CELLS[i], t = c.t;
        var s = (c.s0 + time * t.speed * (t.pulse ? pulse : 1) * rateK) % t.L;
        var k = Math.min(t.pts.length - 2, Math.floor(s / t.step)), a = t.pts[k], b = t.pts[k + 1];
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        c.el.setAttribute('transform', 'translate(' + f2(a[0]) + ',' + f2(a[1]) + ') rotate(' + f2(ang) + ')');
        var ox = t.oxy0 === t.oxy1 ? t.oxy0 : t.oxy0 + (t.oxy1 - t.oxy0) * (s / t.L);
        if (t.bed) c.el.setAttribute('fill', mix(DEO_CELL, OXY_CELL, ox));
        else if (c.fill !== ox) { c.fill = ox; c.el.setAttribute('fill', ox ? OXY_CELL : DEO_CELL); }
      }
    }

    /* ----- the clock: one loop moves the cells and beats the heart ----- */
    var bpm = 72, rateK = 1, phase = 0, clock = 0, last = null, raf = null, running = false, flowOn = true;
    function setRate(b) { bpm = Math.max(40, Math.min(210, b || 72)); rateK = .55 + .45 * bpm / 72; }
    function tick(ts) {
      raf = null;
      if (!running) return;
      if (!svg.isConnected || document.hidden) { last = null; raf = requestAnimationFrame(tick); return; }
      var r = svg.getBoundingClientRect();
      if (!r.width || !r.height) { last = null; raf = requestAnimationFrame(tick); return; }
      if (last == null) last = ts;
      var dt = Math.min(.05, (ts - last) / 1000); last = ts;
      clock += dt; phase = (phase + dt * bpm / 60) % 1;
      var st = beatState(phase, bpm);
      beat = st; paintBeat();
      /* arterial blood surges while the ventricles eject, and creeps between beats */
      var pulse = st.ejecting ? 1.9 : .55;
      pulseClock += dt * pulse;
      placeCells(flowOn ? clock : 0, 1);
      placeArtCells(pulseClock);
      raf = requestAnimationFrame(tick);
    }
    var pulseClock = 0;
    /* arteries move on their own clock so the surge is visible without the veins jerking */
    function placeArtCells(pc) {
      for (var i = 0; i < CELLS.length; i++) {
        var c = CELLS[i], t = c.t; if (!t.pulse) continue;
        var s = (c.s0 + pc * t.speed * rateK) % t.L;
        var k = Math.min(t.pts.length - 2, Math.floor(s / t.step)), a = t.pts[k], b = t.pts[k + 1];
        var ang = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
        c.el.setAttribute('transform', 'translate(' + f2(a[0]) + ',' + f2(a[1]) + ') rotate(' + f2(ang) + ')');
      }
    }
    function start() { if (still) { placeCells(0, 1); return; } if (running) return; running = true; last = null; raf = requestAnimationFrame(tick); }
    function stop() { running = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    placeCells(0, 1);
    start();

    /* ----- lighting ----- */
    var lit = null;
    function applyLight() {
      var all = svg.querySelectorAll('[data-part]');
      for (var i = 0; i < all.length; i++) {
        var e = all[i], p = e.getAttribute('data-part');
        if (e.classList.contains('cd__hit')) continue;
        var on = !lit || lit[p] || (lit.heart && e.closest && e.closest('.cd__heart'));
        e.classList.toggle('is-dim', !on);
        e.classList.toggle('is-lit', !!(lit && lit[p]));
      }
    }
    function light(ids) {
      if (!ids || !ids.length) { lit = null; applyLight(); return { colour: null }; }
      lit = {}; ids.forEach(function (id) { lit[id] = 1; });
      applyLight();
      var g0 = G[ids[0]];
      return { colour: g0 ? g0.colour : null };
    }

    /* ----- the camera ----- */
    var FULL = { x: SCENE.x, y: SCENE.y, w: SCENE.w, h: SCENE.h };
    var cam = { x: FULL.x, y: FULL.y, w: FULL.w, h: FULL.h }, flying = null;
    function setView(b) { cam = b; svg.setAttribute('viewBox', f2(b.x) + ' ' + f2(b.y) + ' ' + f2(b.w) + ' ' + f2(b.h)); }
    function fit(b) {
      /* the box, grown to the column's shape so nothing asked for is cut off */
      var r = svg.getBoundingClientRect(), ar = r.width && r.height ? r.width / r.height : FULL.w / FULL.h;
      var w = b.w, h = b.h;
      if (w / h < ar) w = h * ar; else h = w / ar;
      return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h };
    }
    function flyTo(box, done) {
      var to = fit(box), from = { x: cam.x, y: cam.y, w: cam.w, h: cam.h };
      if (flying) cancelAnimationFrame(flying);
      if (opts.map) opts.map.classList.add('is-flying');
      if (still) { setView(to); if (opts.map) opts.map.classList.remove('is-flying'); if (done) done(); return; }
      var t0 = null, D = 750;
      function step(ts) {
        if (t0 == null) t0 = ts;
        var k = Math.min(1, (ts - t0) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        setView({ x: from.x + (to.x - from.x) * e, y: from.y + (to.y - from.y) * e, w: from.w + (to.w - from.w) * e, h: from.h + (to.h - from.h) * e });
        if (k < 1) flying = requestAnimationFrame(step);
        else { flying = null; if (opts.map) opts.map.classList.remove('is-flying'); if (done) done(); }
      }
      flying = requestAnimationFrame(step);
    }
    /* the boxes the stations fly to, in the body's coordinates */
    var BOX = {
      heart: { x: 548, y: 480, w: 200, h: 300 },
      heartClose: { x: 560, y: 560, w: 180, h: 200 },
      valves: { x: 590, y: 560, w: 120, h: 150 },
      coronary: { x: 556, y: 570, w: 190, h: 190 },
      lungs: { x: 480, y: 480, w: 320, h: 340 },
      chest: { x: 470, y: 440, w: 340, h: 420 },
      liver: { x: 490, y: 740, w: 290, h: 280 },
      abdomen: { x: 480, y: 740, w: 320, h: 420 },
      kidneys: { x: 500, y: 880, w: 280, h: 140 },
      gut: { x: 540, y: 960, w: 220, h: 180 },
      head: { x: 520, y: 100, w: 240, h: 240 },
      legs: { x: 500, y: 1100, w: 320, h: 150 },
      trunk: { x: 440, y: 440, w: 400, h: 760 }
    };
    function boxOf(id, pad) {
      if (BOX[id]) return BOX[id];
      var b = null;
      Array.prototype.forEach.call(svg.querySelectorAll('[data-part="' + id + '"]'), function (e) {
        if (e.classList.contains('cd__cell') || e.classList.contains('cd__hit')) return;
        var bb; try { bb = e.getBBox(); } catch (x) { return; }
        var inHeart = e.closest && e.closest('.cd__heart');
        var x0 = inHeart ? hx(bb.x) : bb.x, y0 = inHeart ? hy(bb.y) : bb.y, x1 = inHeart ? hx(bb.x + bb.width) : bb.x + bb.width, y1 = inHeart ? hy(bb.y + bb.height) : bb.y + bb.height;
        if (!b) b = { x0: x0, y0: y0, x1: x1, y1: y1 };
        else { b.x0 = Math.min(b.x0, x0); b.y0 = Math.min(b.y0, y0); b.x1 = Math.max(b.x1, x1); b.y1 = Math.max(b.y1, y1); }
      });
      if (!b) return FULL;
      pad = pad == null ? 40 : pad;
      return { x: b.x0 - pad, y: b.y0 - pad, w: b.x1 - b.x0 + pad * 2, h: b.y1 - b.y0 + pad * 2 };
    }
    function isZoomed() { return cam.w < FULL.w * .9; }
    function jump(box) { if (flying) cancelAnimationFrame(flying); flying = null; setView(fit(box)); }

    /* ----- pointing and clicking ----- */
    function partAt(e) { var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null; return t ? t.getAttribute('data-part') : null; }
    var hoverPart = null;
    svg.addEventListener('pointermove', function (e) {
      var p = partAt(e);
      if (p === hoverPart) return;
      hoverPart = p;
      if (p && G[p] && opts.onEnter) opts.onEnter(p, e.target); else if (opts.onLeave) opts.onLeave();
      svg.style.cursor = p ? 'pointer' : '';
    });
    svg.addEventListener('pointerleave', function () { hoverPart = null; if (opts.onLeave) opts.onLeave(); });
    svg.addEventListener('click', function (e) { var p = partAt(e); if (p && opts.onClick) opts.onClick(p); });

    /* the name tag, over the part */
    function pin(target, label, colour) {
      var tag = opts.tag; if (!tag || !target || !opts.map) return;
      var r = target.getBoundingClientRect(), mr = opts.map.getBoundingClientRect();
      tag.style.left = (r.left + r.width / 2 - mr.left) + 'px';
      tag.style.top = Math.max(22, r.top - mr.top - 6) + 'px';
      var pill = tag.querySelector('.tag__pill'); if (pill) pill.textContent = label;
      if (colour) tag.style.setProperty('--c', colour); else tag.style.removeProperty('--c');
      tag.classList.add('on');
    }
    function elFor(id) {
      var list = svg.querySelectorAll('[data-part="' + id + '"]:not(.cd__cell):not(.cd__hit)');
      return list.length ? list[0] : null;
    }

    return {
      G: G, FULL: FULL, BOX: BOX, light: light, clear: function () { return light(null); },
      flyTo: flyTo, jump: jump, boxOf: boxOf, isZoomed: isZoomed, pin: pin, elFor: elFor,
      setRate: setRate, rate: function () { return bpm; },
      heartMode: function (m) { if (m !== mode) { mode = m === 'exterior' ? 'exterior' : 'section'; drawHeart(); } },
      flow: function (on) { flowOn = on !== false; },
      start: start, stop: stop,
      /* for the headless checks: draw a given moment of the beat, and where the cells are */
      __seek: function (ph, t) { stop(); beat = beatState(ph || 0, bpm); paintBeat(); placeCells(t || 0, 1); placeArtCells(t || 0); }
    };
  }

  global.CircDraw = CircDraw;
  global.CircDraw.G = G;
  global.CircDraw.beatState = beatState;
})(window);
