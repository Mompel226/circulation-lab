/* ============================================================
   plate.js — the body and its circulation, as this lab's plate.
   The drawing is js/circ-draw.js (a public-domain anatomical plate); this file decides what the
   lab does with it: a station lights the parts it is about and flies the camera to them, opens
   the magnified heart for the heart stations, and sets the heart rate; a part clicked on the body
   opens the station that teaches it. The tools above the plate zoom, pull back to the whole
   body, and show the names. A station may also stand a bench in place of the body (none does).
   ============================================================ */
(function (global) {
  'use strict';

  var draw = null, svg, map, tag, said, whole, hint, col, bench, sim;
  var shown = null;                 /* what is lit now: { name, n } — a station's parts, or one part clicked */
  var lastPress = { id: null, t: 0 };
  var onPick = function () {};
  var current = null;
  var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function say(name, note, c) {
    if (!said) return;
    if (c) said.style.setProperty('--c', c); else said.style.removeProperty('--c');
    said.innerHTML = '<span class="said__name">' + esc(name) + '</span><span class="said__note">' + esc(note) + '</span>';
  }

  function init(opts) {
    svg = document.getElementById('body'); map = document.getElementById('map'); tag = document.getElementById('tag');
    said = document.getElementById('said'); whole = document.getElementById('tWhole'); hint = document.getElementById('plateHint');
    col = document.querySelector('.platecol'); bench = document.getElementById('benchHost'); sim = document.getElementById('simHost');
    onPick = (opts && opts.onPick) || onPick;
    if (!svg || !global.CircDraw) return;
    draw = global.CircDraw(svg, {
      map: map, tag: tag,
      onEnter: function (id, target) { var g = draw.G[PRESS_AS[id] || id]; if (g) draw.pin(target, g.label, g.colour); },
      onLeave: function () { if (tag) tag.classList.remove('on'); },
      onClick: function (id) {
        var gid = PRESS_AS[id] || id, now = Date.now();
        /* the second click of a double-click is not a second press: a double-click chooses the part, as one click does */
        if (gid === lastPress.id && now - lastPress.t < 450) return;
        lastPress = { id: gid, t: now };
        /* the part already chosen, pressed again: it is let go, and the station's parts come back */
        if (focused && gid === focused) { letGo(); return; }
        onPick(gid);
      }
    });
    if (whole) { whole.hidden = false; whole.addEventListener('click', flyHome); }
    var zin = document.getElementById('tZoomIn'), zout = document.getElementById('tZoomOut');
    if (zin) zin.addEventListener('click', function () { draw.zoomBy(.66); });
    if (zout) zout.addEventListener('click', function () { draw.zoomBy(1.5); });
    var tl = document.getElementById('tLabels'), tb = document.getElementById('tBeyond');
    function paintToggles() {
      if (tl) tl.setAttribute('aria-pressed', labels.on ? 'true' : 'false');
      if (tb) { tb.setAttribute('aria-pressed', labels.beyond ? 'true' : 'false'); tb.disabled = !labels.on; }
      draw.labels(labels.on, labels.beyond);
    }
    if (tl) tl.addEventListener('click', function () { labels.on = !labels.on; remember(); paintToggles(); });
    if (tb) tb.addEventListener('click', function () { labels.beyond = !labels.beyond; remember(); paintToggles(); });
    paintToggles();
    window.addEventListener('resize', function () { if (tag) tag.classList.remove('on'); });
  }
  /* the name toggles are remembered in this browser, like the Digestion Lab's */
  var labels = { on: true, beyond: false };
  try { var LS = JSON.parse(localStorage.getItem('circulation-lab.plate') || 'null'); if (LS) { labels.on = LS.on !== false; labels.beyond = !!LS.beyond; } } catch (e) {}
  function remember() { try { localStorage.setItem('circulation-lab.plate', JSON.stringify(labels)); } catch (e) {} }
  /* the heart, magnified beside the body: for a station about the chambers, the valves or the
     coronary arteries, or one that says so */
  var CHAMBER = { ra: 1, la: 1, rv: 1, lv: 1, septum: 1, 'av-valves': 1, 'sl-valves': 1 };
  function wantsLens(s) {
    if (s.lens === false) return null;
    var kind = s.heart === 'exterior' ? 'exterior' : 'section';
    if (s.lens) return kind;
    if ((s.light || []).some(function (id) { return CHAMBER[id]; })) return kind;
    if (['heart', 'heartClose', 'valves', 'coronary'].indexOf(s.fly) >= 0) return kind;
    return null;
  }

  function spec(st) { return (st && st.plate) || {}; }

  function showStation(st) {
    if (!draw) return;
    current = st; focused = null;
    if (col) col.classList.remove('is-sim');
    if (sim) sim.hidden = true;
    var s = spec(st), ids = s.light || [];
    var onBench = !!s.bench;
    draw.vesselNamesOnly(s.names === 'vessels');         /* plate.names: 'vessels' — the side names are vessels only */
    if (col) col.classList.toggle('is-bench', onBench);
    if (bench) { bench.hidden = !onBench; bench.innerHTML = ''; }
    if (onBench) { draw.stop(); draw.clear(); if (tag) tag.classList.remove('on'); return; }
    draw.start();
    draw.heartMode(s.heart === 'exterior' ? 'exterior' : 'section');
    draw.lens(wantsLens(s));
    draw.setRate(s.rate || 72);
    if (hint) hint.textContent = HINT;
    var r = draw.light(ids);
    shown = { name: st.name, n: ids.length };
    var names = ids.map(function (id) { return draw.G[id] ? draw.G[id].label.toLowerCase() : id; });
    /* a station that lights many parts says what they are in a few words (plate.say) instead of listing them */
    say(st.name, s.say || (names.length ? names.join(' · ') : 'the whole circulation'), r.colour);
    var box = s.fly && s.fly !== 'whole' ? draw.boxOf(s.fly, 36) : draw.FULL;
    draw.flyTo(box);
  }

  /* the small branches of the aortic arch in the magnified heart are pressed as the aorta itself */
  var PRESS_AS = { 'aorta-branch': 'aorta' };
  /* an organ comes with the vessels that bring its blood and take it away (circ-draw's organVessels);
     the small intestine also with the hepatic portal vein, since the sentence it lands on says where
     its blood goes: "the hepatic portal vein brings blood from the small intestine" */
  var FOCUS_WITH = { gut: ['gut', 'mesenteric-artery', 'mesenteric-vein', 'hepatic-portal-vein'] };
  function boxOfAll(ids, pad) {
    var b = null;
    ids.forEach(function (k) {
      var q = draw.boxOf(k, pad); if (!q || q === draw.FULL) return;
      if (!b) b = { x0: q.x, y0: q.y, x1: q.x + q.w, y1: q.y + q.h };
      else { b.x0 = Math.min(b.x0, q.x); b.y0 = Math.min(b.y0, q.y); b.x1 = Math.max(b.x1, q.x + q.w); b.y1 = Math.max(b.y1, q.y + q.h); }
    });
    return b ? { x: b.x0, y: b.y0, w: b.x1 - b.x0, h: b.y1 - b.y0 } : draw.FULL;
  }

  /* one part, named and framed: the student clicked it on the body or in the text */
  var focused = null;
  var HINT = 'Click a part to see what it does · scroll or pinch to zoom';
  function focus(id) {
    if (!draw || !draw.G[id]) return;
    var g = draw.G[id];
    if (hint) hint.textContent = 'Press it again, or Whole body, to see all the parts again';
    var lit = FOCUS_WITH[id] || draw.organVessels(id) || [id];
    var r = draw.light(lit);
    focused = id;
    shown = { name: g.label, n: lit.length };
    say(g.label, g.note || '', r.colour);
    if (CHAMBER[id] || id === 'heart') draw.lens('section');
    draw.flyTo(FOCUS_WITH[id] ? boxOfAll(lit, 40) : draw.boxOf(id, 40), function () { var e = draw.elFor(id); if (e && focused === id) draw.pin(e, g.label, r.colour); });
  }
  /* a part pressed is let go: the station's own parts are lit again. Daniel, 27 Sep: "once you click on one
     artery, it's stuck in there": it stayed until the reader scrolled on from its sentence, and Whole body only
     zoomed out. Now pressing it again, or Whole body, lets it go too. */
  function letGo() {
    if (!focused) return;
    unfocus();
    /* the body keeps the column until the reader scrolls on: letting go must not hand it to a widget that happens
       to be in view (Daniel, 27 Sep: pressing the mesenteric vein again brought up Trace the route, whose
       paragraph is beside the mesenteric vein's). The new hold replaces the part's own. */
    if (global.CircLearn && global.CircLearn.holdPlate) global.CircLearn.holdPlate(null, null);
  }
  /* the reader has moved on from the part: the station's own picture comes back */
  function unfocus() {
    if (!focused) return;
    focused = null;
    if (tag) tag.classList.remove('on');
    if (current) showStation(current);
  }

  function flyHome() {
    if (!draw) return;
    if (tag) tag.classList.remove('on');
    letGo();                                          /* the whole body with all the station's parts, not only the one pressed */
    draw.flyTo(draw.FULL);
    if (shown) say(shown.name, shown.n ? 'the whole body · ' + shown.n + (shown.n === 1 ? ' part lit' : ' parts lit') : 'the whole circulation', null);
  }

  /* a Learn-tab widget standing in the column in place of the body (CircLearn.stage): the body rests */
  function stageSim(on) {
    /* on a bench station the bench comes back when the widget leaves the column, and the body stays at rest */
    var onBench = !!(current && spec(current).bench);
    if (col) col.classList.toggle('is-sim', !!on);
    if (sim) sim.hidden = !on;
    if (bench) { if (on) bench.hidden = true; else if (onBench) bench.hidden = false; }
    if (on && tag) tag.classList.remove('on');
    if (draw) { if (on || onBench) draw.stop(); else draw.start(); }
    if (global.PlateFold) global.PlateFold.lend(!!on);
  }
  function showSim(on) {
    if (col) col.classList.toggle('is-sim', !!on);
    if (sim) sim.hidden = !on;
    if (on) { if (bench) bench.hidden = true; if (tag) tag.classList.remove('on'); }
    else if (current) showStation(current);
  }
  function showBench(on) { if (bench) bench.hidden = !on; }

  global.Plate = { init: init, showStation: showStation, focus: focus, unfocus: unfocus, home: flyHome, showSim: showSim, stageSim: stageSim,
                   showBench: showBench, setRate: function (b) { if (draw) draw.setRate(b); },
                   partsOf: function (st) { return spec(st).light || []; }, draw: function () { return draw; } };
})(window);
