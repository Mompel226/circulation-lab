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
     HeartArt.svg(state, opts)   the markup, ready to put in a <g>
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
    svc:   'M84 -60 L124 -60 L124 176 L84 176 Z',
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
  var PAP = 'M96 374 C100 358 110 354 116 366 C118 376 110 386 102 384 Z M160 392 C164 374 176 372 180 386 C180 398 170 404 164 400 Z ' +
            'M282 394 C284 376 298 372 302 388 C302 400 292 406 286 402 Z M320 374 C318 354 334 352 336 368 C336 382 326 388 322 384 Z';
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

  function paths(st) {
    st = st || {};
    var av = st.av == null ? 1 : st.av, sl = st.sl == null ? 0 : st.sl;
    var a = st.atria || 0, v = st.vent || 0;
    var tri = avValve(60, 136, 270, av, 50), mit = avValve(268, 350, 266, av, 54);
    /* contraction: the cavity shrinks and the wall round it thickens. Atria squeeze towards
       their valves; the ventricles squeeze towards the middle of their cavity and up towards
       the base, which is how a real ventricle shortens as well as narrows. */
    var ra = squeeze(RA, 98, 262, 1 - .16 * a, 1 - .2 * a), la = squeeze(LA, 310, 258, 1 - .16 * a, 1 - .2 * a);
    var rv = squeeze(RV, 150, 300, 1 - .2 * v, 1 - .14 * v), lv = squeeze(LV, 268, 300, 1 - .22 * v, 1 - .14 * v);
    var outer = squeeze(OUTER, 205, 250, 1 - .035 * v, 1 - .03 * v);
    return {
      outer: outer, ra: ra, la: la, rv: rv, lv: lv, septum: SEPTUM, pap: PAP,
      tri: tri.d, mit: mit.d,
      cords: [[tri.tl, PAPS[0]], [tri.tr, PAPS[1]], [mit.tl, PAPS[2]], [mit.tr, PAPS[3]]],
      pulv: slValve(150, 194, 206, sl), aov: slValve(206, 252, 222, sl),
      back: BACK, front: FRONT, ext: EXT
    };
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
        '<path d="' + E.auricleR + '" fill="#B7473F" stroke="' + COL.wall + '" stroke-width="1.6"' + dataP('ra') + '/>' +
        '<path d="' + E.auricleL + '" fill="#B7473F" stroke="' + COL.wall + '" stroke-width="1.6"' + dataP('la') + '/>' +
        '<path d="' + E.grooves + '" fill="none" stroke="' + COL.fat + '" stroke-width="16" stroke-linecap="round" opacity=".55"/>' +
        '<g class="ha__cor"' + id('coronary') + dataP('coronary') + ' fill="none" stroke-linecap="round" stroke-linejoin="round">' +
          '<path class="ha__corw" d="' + E.rca + ' ' + E.marg + ' ' + E.lca + ' ' + E.lad + ' ' + E.lcx + ' ' + E.diag + '" stroke="#6E1717" stroke-width="9"/>' +
          '<path class="ha__corl" d="' + E.rca + ' ' + E.marg + ' ' + E.lca + ' ' + E.lad + ' ' + E.lcx + ' ' + E.diag + '" stroke="#FF6B5B" stroke-width="5.5"/>' +
        '</g></g>';
    } else {
      out += '<g class="ha__sec"' + id('sec') + '>' +
        '<path class="ha__outer" d="' + p.outer + '" fill="url(#' + u + 'm)" stroke="' + COL.wall + '" stroke-width="2.2"' + dataP('heart') + '/>' +
        '<path class="ha__sep" d="' + p.septum + '" fill="#A63A36" opacity=".0"' + dataP('septum') + '/>' +
        '<path class="ha__ra" d="' + p.ra + '" fill="url(#' + u + 'd)" stroke="' + (opts.plain ? '#9C8C84' : COL.deoLo) + '" stroke-width="1"' + dataP('ra') + '/>' +
        '<path class="ha__la" d="' + p.la + '" fill="url(#' + u + 'o)" stroke="' + (opts.plain ? '#9C8C84' : COL.oxyLo) + '" stroke-width="1"' + dataP('la') + '/>' +
        '<path class="ha__rv" d="' + p.rv + '" fill="url(#' + u + 'd)" stroke="' + (opts.plain ? '#9C8C84' : COL.deoLo) + '" stroke-width="1"' + dataP('rv') + '/>' +
        '<path class="ha__lv" d="' + p.lv + '" fill="url(#' + u + 'o)" stroke="' + (opts.plain ? '#9C8C84' : COL.oxyLo) + '" stroke-width="1"' + dataP('lv') + '/>' +
        '<path d="' + p.pap + '" fill="#8A2A2A"/>' +
        '<g class="ha__cords" stroke="' + COL.cord + '" stroke-width="1.2" opacity=".8">' + p.cords.map(function (c) {
          return '<line x1="' + n(c[0][0]) + '" y1="' + n(c[0][1]) + '" x2="' + c[1][0] + '" y2="' + c[1][1] + '"/>'; }).join('') + '</g>' +
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

  global.HeartArt = { paths: paths, svg: svg, squeeze: squeeze, ANCHOR: ANCHOR, COL: COL };
})(window);
