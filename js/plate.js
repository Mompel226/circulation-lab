/* ============================================================
   plate.js — the body and its circulation, as this lab's plate.
   The drawing is js/circ-draw.js; this file decides what the lab does with it: a station
   lights the parts it is about and flies the camera to them, shows the heart cut open or from
   the outside, and sets the heart rate; a part clicked on the body opens the station that
   teaches it. A station may also stand a bench in place of the body (none does yet).
   ============================================================ */
(function (global) {
  'use strict';

  var draw = null, svg, map, tag, said, whole, hint, col, bench, sim;
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
    if (whole) whole.addEventListener('click', flyHome);
    window.addEventListener('resize', function () { if (tag) tag.classList.remove('on'); });
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
    draw.setRate(s.rate || 72);
    if (hint) hint.textContent = 'Click any part of the body to open its station';
    var r = draw.light(ids);
    var names = ids.map(function (id) { return draw.G[id] ? draw.G[id].label.toLowerCase() : id; });
    /* a station that lights many parts says what they are in a few words (plate.say) instead of listing them */
    say(st.name, s.say || (names.length ? names.join(' · ') : 'the whole circulation'), r.colour);
    var box = s.fly ? draw.boxOf(s.fly, 36) : draw.FULL;
    draw.flyTo(box, function () { if (whole) whole.hidden = !draw.isZoomed(); });
    if (whole) whole.hidden = false;
    setTimeout(function () { if (whole) whole.hidden = !draw.isZoomed(); }, still ? 0 : 800);
  }

  /* one part, named and framed: the student clicked it on the body or in the text */
  function focus(id) {
    if (!draw || !draw.G[id]) return;
    var g = draw.G[id];
    var r = draw.light([id]);
    say(g.label, g.note || '', r.colour);
    draw.flyTo(draw.boxOf(id, 40), function () { var e = draw.elFor(id); if (e) draw.pin(e, g.label, r.colour); if (whole) whole.hidden = !draw.isZoomed(); });
    if (whole) whole.hidden = false;
  }

  function flyHome() {
    if (!draw) return;
    if (tag) tag.classList.remove('on');
    draw.flyTo(draw.FULL, function () { if (whole) whole.hidden = !draw.isZoomed(); });
    if (whole) whole.hidden = true;
    if (current) {
      var ids = spec(current).light || [];
      say(current.name, ids.length ? 'the whole body · ' + ids.length + (ids.length === 1 ? ' part lit' : ' parts lit') : 'the whole circulation', null);
    }
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
