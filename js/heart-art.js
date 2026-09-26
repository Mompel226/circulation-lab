/* ============================================================
   heart-art.js — the heart, drawn once, for the plate and for every widget that needs it.

   One frame, the "local" frame: 400 wide, the ventricles' apex near y 460, the great vessels
   running up past y 0. It is the view every exam diagram uses — a section from the FRONT, so
   the heart's right side is on YOUR left. Nothing here is a picture: every part is a path
   worked out from a state, so the same drawing can beat on the plate and be taken slowly,
   step by step, in the cardiac cycle.

     HeartArt.paths(state)   the path data for one moment of the beat
        state.av    0 closed … 1 open        the atrioventricular valves
        state.sl    0 closed … 1 open        the semilunar valves
        state.atria 0 relaxed … 1 contracted
        state.vent  0 relaxed … 1 contracted
     HeartArt.paths(state, { k })  k scales the whole contraction (the ECG simulation uses 0.4, so the
                                   muscle cells it lays over the walls stay on them)
     HeartArt.svg(state, opts)   the markup, ready to put in a <g>
     HeartArt.nodes(g), HeartArt.update(nodes, paths)   find the parts a widget redraws each frame, and
                                   redraw them: every widget that beats uses these two
     HeartArt.warpPoint(x, y, state)   where a point inside a chamber is carried by the beat (for blood
                                   cells and label dots drawn over the heart)
        opts.mode   'section' (the chambers) or 'exterior' (the outside, with the coronary arteries)
        opts.ids    prefix for the ids the plate lights and clicks (default none)
        opts.plain  no red and blue: pale chambers and vessels, for questions about which blood is where

   What is simplified, on purpose, and said in the lab's help: the aorta and the pulmonary artery
   leave the top side by side, as in every school diagram (in the body the pulmonary trunk spirals
   round the front of the aorta); each atrioventricular valve is drawn as two flaps in section (the
   right one has three cusps); only the vena cava's two openings are drawn, not the coronary sinus.
   ============================================================ */
(function (global) {
  'use strict';

  var COL = {
    deo: '#3B62B5', deoHi: '#86A7EA', deoLo: '#23417F',
    oxy: '#D63C3B', oxyHi: '#FF9C8E', oxyLo: '#9E2426',
    valve: '#F4E6D0', valveEdge: '#B29470', cord: '#EFE2CC', fat: '#E9CF86',
    wall: '#D86E62'
  };

  function L(a, b, k) { return a + (b - a) * k; }
  function n(v) { return Math.round(v * 100) / 100; }

  /* scale a path's numbers about a centre: how a chamber squeezes. Every number pair in the
     path is a point (the paths here are written with absolute M, L, C and Z only). */
  function squeeze(d, cx, cy, kx, ky) {
    if (kx === 1 && ky === 1) return d;
    var i = 0;
    return d.replace(/-?\d+(?:\.\d+)?/g, function (m) {
      var v = parseFloat(m), out = (i % 2 === 0) ? cx + (v - cx) * kx : cy + (v - cy) * ky;
      i++;
      return String(n(out));
    });
  }

  /* ---- the vessels behind the heart ---- */
  var BACK = {
    descAorta: 'M282 96 C286 118 288 140 288 170 L288 560 L312 560 L312 168 C312 132 306 104 296 84 Z',
    rPA:  'M162 104 C128 100 92 106 60 118 C32 128 6 138 -30 150 L-30 172 C8 160 36 150 66 140 C98 128 132 122 164 126 Z',
    lPA:  'M186 106 C222 98 262 96 302 100 C348 106 390 118 430 134 L430 156 C390 140 348 128 302 122 C262 118 224 120 188 128 Z',
    pvL1: 'M-30 190 C20 190 70 194 120 200 L120 214 C70 208 20 206 -30 206 Z',
    pvL2: 'M-30 228 C20 228 70 230 120 232 L120 246 C70 244 20 244 -30 244 Z',
    pvR1: 'M362 192 C384 188 408 186 430 184 L430 200 C408 202 386 205 364 208 Z',
    pvR2: 'M364 230 C386 232 408 236 430 240 L430 256 C408 252 386 248 362 246 Z',
    ivc:  'M10 560 L46 560 L46 300 C46 284 50 272 58 262 L60 234 C44 236 34 244 26 256 C14 272 10 290 10 310 Z'
  };
  /* ---- the vessels in front ---- */
  var FRONT = {
    svc:   'M84 -60 L124 -60 L124 186 L84 186 Z',
    paTrunk: 'M150 200 L150 120 C150 104 156 96 164 94 L184 94 C192 96 194 104 194 120 L194 200 Z',
    aorta: 'M206 214 L206 110 C206 58 232 24 270 24 C300 24 314 46 314 84 L314 110 L290 110 L290 88 C290 62 282 50 270 50 C248 50 252 80 252 110 L252 214 Z',
    br1: 'M214 62 L186 -60 L200 -60 L226 52 Z',
    br2: 'M246 32 L240 -60 L254 -60 L260 30 Z',
    br3: 'M282 30 L292 -60 L306 -60 L296 38 Z'
  };
  /* ---- the heart itself ---- */
  var OUTER = 'M84 152 C54 150 32 182 30 222 C29 250 36 270 50 284 ' +
              'C58 334 96 398 154 432 C188 452 218 462 244 460 ' +
              'C304 452 350 406 365 346 C374 312 374 288 367 270 ' +
              'C381 256 389 226 381 200 C372 174 348 158 318 156 ' +
              'C302 156 292 160 284 166 L252 170 L206 170 L194 168 L150 166 L124 156 Z';
  var RA = 'M62 178 C46 198 44 238 56 262 L136 266 C143 240 143 200 133 180 C114 167 84 167 62 178 Z';
  var LA = 'M268 178 C259 202 260 238 268 260 L350 262 C363 241 365 208 353 188 C337 170 294 168 268 178 Z';
  /* each ventricle rises, on the septum's side, into the smooth funnel that leads to its
     artery: the right to the pulmonary valve, the left to the aortic valve */
  var RV = 'M60 272 C84 271 116 270 136 270 C146 262 150 238 150 202 L194 202 ' +
           'C195 246 196 288 198 322 C201 356 206 386 212 410 C196 424 176 426 158 420 ' +
           'C116 404 78 362 64 314 C61 300 60 286 60 272 Z';
  var LV = 'M206 216 L252 216 C253 238 258 256 268 266 C296 266 324 266 352 266 ' +
           'C354 308 346 358 324 396 C308 424 284 436 260 432 ' +
           'C244 428 236 418 230 404 C221 376 213 340 209 302 C207 270 206 242 206 216 Z';
  /* the muscle of the septum, for lighting it on its own: the wall between RV and LV, and on up
     between the two outflows */
  var SEPTUM = 'M194 196 L206 196 L206 240 C207 270 208 290 209 302 C213 340 221 376 230 404 ' +
               'C234 414 238 420 244 426 C232 432 220 424 212 410 C203 374 197 334 195 292 Z';
  var PAP_R = 'M96 374 C100 358 110 354 116 366 C118 376 110 386 102 384 Z M160 392 C164 374 176 372 180 386 C180 398 170 404 164 400 Z';
  var PAP_L = 'M282 394 C284 376 298 372 302 388 C302 400 292 406 286 402 Z M320 374 C318 354 334 352 336 368 C336 382 326 388 322 384 Z';
  var PAPS = [[106, 362], [170, 378], [292, 378], [328, 358]];

  /* the outside: the two auricles, the grooves where the coronary arteries run in fat */
  var EXT = {
    auricleR: 'M36 198 C22 186 26 164 46 160 C60 158 70 168 82 170 C94 172 98 186 90 198 C80 212 52 212 36 198 Z',
    auricleL: 'M300 178 C306 162 324 156 340 160 C352 163 360 158 368 166 C378 178 372 196 356 204 C336 212 304 200 300 178 Z',
    grooves: 'M50 284 C110 272 170 268 206 262 M206 262 C250 262 320 268 368 270 M210 214 C214 290 222 370 240 452',
    rca:  'M214 222 C170 240 110 258 64 276 C44 286 40 310 52 340 C70 384 110 420 160 440',
    marg: 'M58 322 C82 352 104 380 128 410',
    lca:  'M246 222 C252 228 258 232 264 236',
    lad:  'M264 236 C250 280 236 330 234 380 C232 410 236 436 242 452',
    lcx:  'M264 236 C300 250 340 258 368 272 C376 300 372 330 360 356',
    diag: 'M246 300 C276 318 300 340 318 372 M238 350 C258 370 276 392 288 418'
  };

  /* an atrioventricular valve: two flaps hinged at the ends of the ring between atrium and
     ventricle. Open, they hang down into the ventricle; shut, they meet across the ring. */
  function avValve(x0, x1, y, open, depth) {
    var w = x1 - x0, mid = (x0 + x1) / 2;
    var tl = [L(mid - 2, x0 + w * .24, open), L(y + 5, y + depth, open)];
    var tr = [L(mid + 2, x1 - w * .24, open), L(y + 5, y + depth, open)];
    function leaf(h, t, s) {
      return 'M' + n(h) + ' ' + n(y) +
        ' C' + n(L(h + s * w * .22, h + s * 5, open)) + ' ' + n(L(y - 3, y + depth * .45, open)) + ' ' + n(t[0] - s * 4) + ' ' + n(t[1] - 5) + ' ' + n(t[0]) + ' ' + n(t[1]) +
        ' C' + n(t[0] + s * 3) + ' ' + n(t[1] - 7) + ' ' + n(L(h + s * w * .18, h + s * 13, open)) + ' ' + n(L(y + 3, y + depth * .38, open)) + ' ' + n(h + s * 8) + ' ' + n(y - 1) + ' Z';
    }
    return { d: leaf(x0, tl, 1) + ' ' + leaf(x1, tr, -1), tl: tl, tr: tr };
  }
  /* a semilunar valve: two pocket-shaped cusps. Shut, blood falling back fills the pockets and
     they meet in the middle; open, they are pressed flat against the wall of the artery. */
  function slValve(x0, x1, y, open) {
    var mid = (x0 + x1) / 2;
    function cusp(e, s) {
      return 'M' + n(e) + ' ' + n(y) +
        ' C' + n(e + s * 10) + ' ' + n(L(y + 2, y - 4, open)) + ' ' + n(L(mid - s * 2, e + s * 6, open)) + ' ' + n(L(y - 6, y - 22, open)) + ' ' + n(L(mid - s * 1, e + s * 5, open)) + ' ' + n(L(y - 16, y - 30, open)) +
        ' C' + n(L(mid - s * 6, e + s * 2, open)) + ' ' + n(L(y - 12, y - 20, open)) + ' ' + n(e + s * 2) + ' ' + n(y - 8) + ' ' + n(e) + ' ' + n(y - 10) + ' Z';
    }
    return cusp(x0, 1) + ' ' + cusp(x1, -1);
  }

  /* ---- the beat, as a smooth warp of the drawing ----
     Daniel, 26 Sep: the outline of the heart stayed the same size while only the walls inside moved,
     which "might lead to misconceptions". Contracting muscle shortens and thickens, so the whole
     heart changes shape: when the atria contract, each atrium draws in towards the valve below it and
     the top of the heart shrinks; when the ventricles contract, they narrow and their tip rises
     towards the valves, and the lower part of the heart shrinks. Each cavity shrinks more than the
     outline round it, so the walls thicken. What stays still: the rings of the atrioventricular valves,
     the outflows into the two arteries, and the great vessels. */
  function sm(a, b, x) { var t = (x - a) / (b - a); t = t < 0 ? 0 : t > 1 ? 1 : t; return t * t * (3 - 2 * t); }
  function warpPath(d, f) {
    var nums = d.match(/-?\d+(?:\.\d+)?/g) || [], out = [], k = 0;
    for (var i = 0; i + 1 < nums.length; i += 2) { var q = f(+nums[i], +nums[i + 1]); out.push(n(q[0]), n(q[1])); }
    return d.replace(/-?\d+(?:\.\d+)?/g, function () { return String(out[k++]); });
  }
  /* the outside of the heart: its outline, the auricles, the grooves, the coronary arteries */
  function outerAt(a, v) {
    return function (x, y) {
      var X = x, Y = y;
      if (v && y > 262) { var t = sm(262, 332, y); X = 205 + (X - 205) * (1 - .085 * v * t); Y = 262 + (Y - 262) * (1 - .1 * v); }
      if (a && y < 296) {
        var left = x < 205, cx = left ? 96 : 312, wx = left ? 1 - sm(112, 150, x) : sm(260, 298, x), k = .13 * a * (1 - sm(248, 294, y)) * wx;
        if (k) { X = cx + (X - cx) * (1 - k); Y = 262 + (Y - 262) * (1 - k); }
      }
      return [X, Y];
    };
  }
  /* a ventricle's cavity: narrows towards a line near the septum, shortens towards its valve ring;
     above the ring (the outflow to its artery) it stays put */
  function ventAt(right, v) {
    var base = right ? 270 : 266, cx = right ? 172 : 248, kx = right ? .2 : .22;
    return function (x, y) {
      if (!v || y <= base) return [x, y];
      var t = sm(base, base + 70, y);
      return [cx + (x - cx) * (1 - kx * v * t), base + (y - base) * (1 - .16 * v)];
    };
  }
  /* an atrium's cavity: draws in towards its valve; its floor, the valve ring, stays put */
  function atrAt(right, a) {
    var cx = right ? 96 : 312;
    return function (x, y) {
      if (!a) return [x, y];
      var k = .24 * a * (1 - sm(236, 266, y));
      return [cx + (x - cx) * (1 - k), 264 + (y - 264) * (1 - k * .8)];
    };
  }
  function strength(st, opts) { var K = opts && opts.k != null ? opts.k : 1; return { a: (st.atria || 0) * K, v: (st.vent || 0) * K }; }

  function paths(st, opts) {
    st = st || {};
    var av = st.av == null ? 1 : st.av, sl = st.sl == null ? 0 : st.sl;
    var S = strength(st, opts), a = S.a, v = S.v;
    var tri = avValve(60, 136, 270, av, 50), mit = avValve(268, 350, 266, av, 54);
    var fo = outerAt(a, v), fRV = ventAt(true, v), fLV = ventAt(false, v), fRA = atrAt(true, a), fLA = atrAt(false, a);
    var paps = [fRV(PAPS[0][0], PAPS[0][1]), fRV(PAPS[1][0], PAPS[1][1]), fLV(PAPS[2][0], PAPS[2][1]), fLV(PAPS[3][0], PAPS[3][1])];
    var ext = {}; Object.keys(EXT).forEach(function (k) { ext[k] = warpPath(EXT[k], fo); });
    return {
      outer: warpPath(OUTER, fo), ra: warpPath(RA, fRA), la: warpPath(LA, fLA), rv: warpPath(RV, fRV), lv: warpPath(LV, fLV),
      septum: warpPath(SEPTUM, function (x, y) { return x < 206 ? fRV(x, y) : fLV(x, y); }),
      pap: warpPath(PAP_R, fRV) + ' ' + warpPath(PAP_L, fLV),
      tri: tri.d, mit: mit.d,
      cords: [[tri.tl, paps[0]], [tri.tr, paps[1]], [mit.tl, paps[2]], [mit.tr, paps[3]]],
      pulv: slValve(150, 194, 206, sl), aov: slValve(206, 252, 222, sl),
      back: BACK, front: FRONT, ext: ext
    };
  }

  /* where the beat carries a point inside a chamber (blood cells and label dots drawn over the heart).
     Points outside the heart's outline, and in the outflows and great vessels, stay where they are. */
  var OUTLINE = null;
  function outline() {           /* the relaxed outline as a polygon, sampled once */
    if (OUTLINE) return OUTLINE;
    var nums = OUTER.match(/-?\d+(?:\.\d+)?/g).map(Number), cmds = OUTER.match(/[MLCZ]/g), pts = [], i = 0, cur = [0, 0];
    cmds.forEach(function (c) {
      if (c === 'M' || c === 'L') { cur = [nums[i], nums[i + 1]]; i += 2; pts.push(cur); }
      else if (c === 'C') {
        var p0 = cur, p1 = [nums[i], nums[i + 1]], p2 = [nums[i + 2], nums[i + 3]], p3 = [nums[i + 4], nums[i + 5]]; i += 6;
        for (var k = 1; k <= 12; k++) { var t = k / 12, u = 1 - t;
          pts.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); }
        cur = p3;
      }
    });
    return (OUTLINE = pts);
  }
  function inOutline(x, y) {
    var P = outline(), inside = false;
    for (var i = 0, j = P.length - 1; i < P.length; j = i++) {
      if ((P[i][1] > y) !== (P[j][1] > y) && x < (P[j][0] - P[i][0]) * (y - P[i][1]) / (P[j][1] - P[i][1]) + P[i][0]) inside = !inside;
    }
    return inside;
  }
  function warpPoint(x, y, st, opts) {
    st = st || {};
    var S = strength(st, opts);
    if (!S.a && !S.v) return [x, y];
    if (!inOutline(x, y)) return [x, y];
    if (y > 266) return (x < 206 + (y - 266) * .1 ? ventAt(true, S.v) : ventAt(false, S.v))(x, y);
    if (x < 146) return atrAt(true, S.a)(x, y);
    if (x > 262) return atrAt(false, S.a)(x, y);
    return [x, y];
  }

  /* the parts a beating widget redraws, and redrawing them */
  function corD(E) { return E.rca + ' ' + E.marg + ' ' + E.lca + ' ' + E.lad + ' ' + E.lcx + ' ' + E.diag; }
  function nodes(g) {
    function q(sel) { return g.querySelector(sel); }
    return { outer: q('.ha__outer'), ra: q('.ha__ra'), la: q('.ha__la'), rv: q('.ha__rv'), lv: q('.ha__lv'), sep: q('.ha__sep'), pap: q('.ha__pap'),
             av: q('.ha__av'), sl: q('.ha__sl'), cords: g.querySelectorAll('.ha__cords line'),
             aurR: q('.ha__aurR'), aurL: q('.ha__aurL'), grooves: q('.ha__grooves'), corw: q('.ha__corw'), corl: q('.ha__corl') };
  }
  function update(N, p) {
    function set(el, d) { if (el) el.setAttribute('d', d); }
    set(N.outer, p.outer); set(N.ra, p.ra); set(N.la, p.la); set(N.rv, p.rv); set(N.lv, p.lv); set(N.sep, p.septum); set(N.pap, p.pap);
    set(N.av, p.tri + ' ' + p.mit); set(N.sl, p.pulv + ' ' + p.aov);
    if (N.cords) for (var i = 0; i < N.cords.length; i++) {
      var c = p.cords[i]; if (!c) continue;
      N.cords[i].setAttribute('x1', n(c[0][0])); N.cords[i].setAttribute('y1', n(c[0][1]));
      N.cords[i].setAttribute('x2', n(c[1][0])); N.cords[i].setAttribute('y2', n(c[1][1]));
    }
    var E = p.ext; set(N.aurR, E.auricleR); set(N.aurL, E.auricleL); set(N.grooves, E.grooves);
    if (N.corw || N.corl) { var cd = corD(E); set(N.corw, cd); set(N.corl, cd); }
  }

  var UID = 0;
  /* markup: the heart in one group. Ids carry a prefix so the plate can light and click them;
     a widget passes none. The veins from the right lung pass BEHIND the right atrium to the left
     atrium, so seen from the front they are drawn fading out at the heart's edge; a widget with no
     lungs passes opts.rightPV === false and leaves them out altogether. */
  function svg(st, opts) {
    opts = opts || {};
    var p = paths(st), u = 'ha' + (++UID), id = function (s) { return opts.ids ? ' id="' + opts.ids + s + '"' : ''; };
    var dataP = function (s) { return ' data-part="' + s + '"'; };
    var ext = opts.mode === 'exterior';
    var defs = '<defs>' +
      '<radialGradient id="' + u + 'm" cx=".42" cy=".38" r=".8"><stop offset="0" stop-color="#BE4D45"/><stop offset=".65" stop-color="#9A3230"/><stop offset="1" stop-color="#762224"/></radialGradient>' +
      '<radialGradient id="' + u + 'd" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#4A74C8"/><stop offset="1" stop-color="#2E5099"/></radialGradient>' +
      '<radialGradient id="' + u + 'o" cx=".5" cy=".45" r=".7"><stop offset="0" stop-color="#E24A47"/><stop offset="1" stop-color="#B42C2E"/></radialGradient>' +
      '<linearGradient id="' + u + 'x" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#C9584E"/><stop offset=".55" stop-color="#A33A36"/><stop offset="1" stop-color="#7C2527"/></linearGradient>' +
      /* the veins from the right lung fade as they pass BEHIND the heart, so they cannot be read as
         entering the right atrium: they run on, out of sight, to the left atrium */
      '<linearGradient id="' + u + 'pf" gradientUnits="userSpaceOnUse" x1="-30" y1="0" x2="34" y2="0"><stop offset="0" stop-color="' + COL.oxy + '"/><stop offset=".6" stop-color="' + COL.oxy + '" stop-opacity=".85"/><stop offset="1" stop-color="' + COL.oxy + '" stop-opacity="0"/></linearGradient>' +
      '<linearGradient id="' + u + 'ps" gradientUnits="userSpaceOnUse" x1="-30" y1="0" x2="34" y2="0"><stop offset="0" stop-color="' + COL.oxyHi + '"/><stop offset=".6" stop-color="' + COL.oxyHi + '" stop-opacity=".6"/><stop offset="1" stop-color="' + COL.oxyHi + '" stop-opacity="0"/></linearGradient>' +
      '</defs>';
    var B = p.back, F = p.front, E = p.ext;
    /* opts.plain: no red and blue, for a question that asks which side carries which blood */
    var P = opts.plain ? { deo: '#CDBFB6', deoHi: '#F1E7E0', oxy: '#CDBFB6', oxyHi: '#F1E7E0' } : COL;
    if (opts.plain) defs = defs.replace(/#4A74C8|#2E5099|#E24A47|#B42C2E/g, function (c) { return c === '#4A74C8' || c === '#E24A47' ? '#F4ECE6' : '#E2D5CC'; });
    var deo = function (d, part, extra) { return '<path d="' + d + '" fill="' + P.deo + '" stroke="' + P.deoHi + '" stroke-width="1.6"' + (part ? dataP(part) : '') + (extra || '') + '/>'; };
    var oxy = function (d, part, extra) { return '<path d="' + d + '" fill="' + P.oxy + '" stroke="' + P.oxyHi + '" stroke-width="1.6"' + (part ? dataP(part) : '') + (extra || '') + '/>'; };
    var behind = function (d) { return '<path d="' + d + '" fill="url(#' + u + 'pf)" stroke="url(#' + u + 'ps)" stroke-width="1.6"' + dataP('pulmonary-vein') + '/>'; };
    var out = defs;
    /* behind */
    out += '<g class="ha__back">' + oxy(B.descAorta, 'aorta') + deo(B.rPA, 'pulmonary-artery') + deo(B.lPA, 'pulmonary-artery') +
           (opts.rightPV === false ? '' : behind(B.pvL1) + behind(B.pvL2)) + oxy(B.pvR1, 'pulmonary-vein') + oxy(B.pvR2, 'pulmonary-vein') +
           deo(B.ivc, 'vena-cava') + '</g>';
    if (ext) {
      out += '<g class="ha__ext"' + id('ext') + '>' +
        '<path class="ha__outer" d="' + p.outer + '" fill="url(#' + u + 'x)" stroke="' + COL.wall + '" stroke-width="2.2"' + dataP('heart') + '/>' +
        '<path class="ha__aurR" d="' + E.auricleR + '" fill="#B7473F" stroke="' + COL.wall + '" stroke-width="1.6"' + dataP('ra') + '/>' +
        '<path class="ha__aurL" d="' + E.auricleL + '" fill="#B7473F" stroke="' + COL.wall + '" stroke-width="1.6"' + dataP('la') + '/>' +
        '<path class="ha__grooves" d="' + E.grooves + '" fill="none" stroke="' + COL.fat + '" stroke-width="16" stroke-linecap="round" opacity=".55"/>' +
        '<g class="ha__cor"' + id('coronary') + dataP('coronary') + ' fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<path class="ha__corw" d="' + corD(E) + '" stroke="#6E1717" stroke-width="9"/>' +
          '<path class="ha__corl" d="' + corD(E) + '" stroke="#FF6B5B" stroke-width="5.5"/>' +
        '</g></g>';
    } else {
      out += '<g class="ha__sec"' + id('sec') + '>' +
        '<path class="ha__outer" d="' + p.outer + '" fill="url(#' + u + 'm)" stroke="' + COL.wall + '" stroke-width="2.2"' + dataP('heart') + '/>' +
        '<path class="ha__sep" d="' + p.septum + '" fill="#A63A36" opacity=".0"' + dataP('septum') + '/>' +
        '<path class="ha__ra" d="' + p.ra + '" fill="url(#' + u + 'd)" stroke="' + (opts.plain ? '#9C8C84' : COL.deoLo) + '" stroke-width="1"' + dataP('ra') + '/>' +
        '<path class="ha__la" d="' + p.la + '" fill="url(#' + u + 'o)" stroke="' + (opts.plain ? '#9C8C84' : COL.oxyLo) + '" stroke-width="1"' + dataP('la') + '/>' +
        '<path class="ha__rv" d="' + p.rv + '" fill="url(#' + u + 'd)" stroke="' + (opts.plain ? '#9C8C84' : COL.deoLo) + '" stroke-width="1"' + dataP('rv') + '/>' +
        '<path class="ha__lv" d="' + p.lv + '" fill="url(#' + u + 'o)" stroke="' + (opts.plain ? '#9C8C84' : COL.oxyLo) + '" stroke-width="1"' + dataP('lv') + '/>' +
        '<path class="ha__pap" d="' + p.pap + '" fill="#8A2A2A"/>' +
        '<g class="ha__cords" stroke="' + COL.cord + '" stroke-width="1.2" opacity=".8">' + p.cords.map(function (c) {
          return '<line x1="' + n(c[0][0]) + '" y1="' + n(c[0][1]) + '" x2="' + n(c[1][0]) + '" y2="' + n(c[1][1]) + '"/>'; }).join('') + '</g>' +
        '<path class="ha__av" d="' + p.tri + ' ' + p.mit + '" fill="' + COL.valve + '" stroke="' + COL.valveEdge + '" stroke-width="1"' + dataP('av-valves') + '/>' +
        '</g>';
    }
    /* in front */
    out += '<g class="ha__front">' + deo(F.paTrunk, 'pulmonary-artery') + deo(F.svc, 'vena-cava') +
           oxy(F.br1, 'aorta-branch') + oxy(F.br2, 'aorta-branch') + oxy(F.br3, 'aorta-branch') + oxy(F.aorta, 'aorta', ' stroke-width="2.4"') +
           (ext ? '' : '<path class="ha__sl" d="' + p.pulv + ' ' + p.aov + '" fill="' + COL.valve + '" stroke="' + COL.valveEdge + '" stroke-width="1"' + dataP('sl-valves') + '/>') +
           '</g>';
    return out;
  }

  /* where each named thing sits in the local frame — for labels a widget rules out to, and for
     the plate's camera. [x, y] of a point ON the part. */
  var ANCHOR = {
    ra: [96, 214], la: [312, 212], rv: [110, 340], lv: [282, 350], septum: [212, 340],
    'av-right': [98, 284], 'av-left': [308, 280], 'sl-pulmonary': [172, 196], 'sl-aortic': [229, 212],
    'vena-cava': [104, 40], 'vena-cava-inf': [28, 470], aorta: [270, 36], 'pulmonary-artery': [172, 150], 'pulmonary-vein': [400, 196],
    wallLV: [356, 330], wallRV: [52, 330], coronary: [236, 330]
  };

  global.HeartArt = { paths: paths, svg: svg, nodes: nodes, update: update, warpPoint: warpPoint, squeeze: squeeze, ANCHOR: ANCHOR, COL: COL };
})(window);
