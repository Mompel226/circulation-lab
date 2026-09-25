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
      onEnter: function (id, target) { var g = draw.G[id]; if (g) draw.pin(target, g.label, g.colour); },
      onLeave: function () { if (tag) tag.classList.remove('on'); },
      onClick: function (id) { onPick(id); }
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
    current = st;
    if (col) col.classList.remove('is-sim');
    if (sim) sim.hidden = true;
    var s = spec(st), ids = s.light || [];
    var onBench = !!s.bench;
    if (col) col.classList.toggle('is-bench', onBench);
    if (bench) { bench.hidden = !onBench; bench.innerHTML = ''; }
    if (onBench) { draw.stop(); draw.clear(); if (tag) tag.classList.remove('on'); return; }
    draw.start();
    draw.heartMode(s.heart === 'exterior' ? 'exterior' : 'section');
    draw.lens(wantsLens(s));
    draw.setRate(s.rate || 72);
    if (hint) hint.textContent = 'Click a part to open its station · scroll or pinch to zoom';
    var r = draw.light(ids);
    shown = { name: st.name, n: ids.length };
    var names = ids.map(function (id) { return draw.G[id] ? draw.G[id].label.toLowerCase() : id; });
    /* a station that lights many parts says what they are in a few words (plate.say) instead of listing them */
    say(st.name, s.say || (names.length ? names.join(' · ') : 'the whole circulation'), r.colour);
    var box = s.fly && s.fly !== 'whole' ? draw.boxOf(s.fly, 36) : draw.FULL;
    draw.flyTo(box);
  }

  /* one part, named and framed: the student clicked it on the body or in the text. An organ comes
     with the vessels that bring its blood and take it away: the liver with its three */
  function focus(id) {
    if (!draw || !draw.G[id]) return;
    var g = draw.G[id];
    var lit = draw.organVessels(id) || [id];
    var r = draw.light(lit);
    shown = { name: g.label, n: lit.length };
    say(g.label, g.note || '', r.colour);
    if (CHAMBER[id] || id === 'heart') draw.lens('section');
    draw.flyTo(draw.boxOf(id, 40), function () { var e = draw.elFor(id); if (e) draw.pin(e, g.label, r.colour); });
  }

  function flyHome() {
    if (!draw) return;
    if (tag) tag.classList.remove('on');
    draw.flyTo(draw.FULL);
    if (shown) say(shown.name, shown.n ? 'the whole body · ' + shown.n + (shown.n === 1 ? ' part lit' : ' parts lit') : 'the whole circulation', null);
  }

  function stageSim(on) {
    if (col) col.classList.toggle('is-sim', !!on);
    if (sim) sim.hidden = !on;
    if (on && bench) bench.hidden = true;
    if (on && tag) tag.classList.remove('on');
    if (global.PlateFold) global.PlateFold.lend(!!on);
  }
  function showSim(on) {
    if (col) col.classList.toggle('is-sim', !!on);
    if (sim) sim.hidden = !on;
    if (on) { if (bench) bench.hidden = true; if (tag) tag.classList.remove('on'); }
    else if (current) showStation(current);
  }
  function showBench(on) { if (bench) bench.hidden = !on; }

  global.Plate = { init: init, showStation: showStation, focus: focus, home: flyHome, showSim: showSim, stageSim: stageSim,
                   showBench: showBench, setRate: function (b) { if (draw) draw.setRate(b); },
                   partsOf: function (st) { return spec(st).light || []; }, draw: function () { return draw; } };
})(window);
