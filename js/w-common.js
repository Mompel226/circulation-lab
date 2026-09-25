/* ============================================================
   w-common.js — what this lab's animations share.

   CircLearn.stepper(opts)  the controls every step animation uses, the Plants Lab's pollen-tube
                            pattern: each step PLAYS, then HOLDS on its last frame until the reader
                            presses "Next step" (a continuous run was faster than an EAL reader can
                            read — Daniel, Sept 2026); "Play all" runs straight through for revision;
                            with reduced motion each press shows the next step's last frame, no timer.
       opts.steps   [{ t, h, p, tag? }]   start time (s), heading, one short paragraph
       opts.end     the last moment (s)
       opts.render  render(t) — must be a pure function of t, so any moment can be drawn on demand
       opts.rate    optional: a function returning how fast time runs (1 normal, 2 twice as fast)
       returns { bar, list, now, paint(t), seek(t), stop(), isStill() }

   CircLearn.labels(opts)   labels in two margins, each at its own part's height, joined to it by a
                            ruled horizontal leader. Horizontal leaders at different heights cannot
                            cross; labels that would collide are nudged apart in the order of their
                            parts, so the order never changes and the short jogs never cross either.
                            (Daniel: "never ever cross the labelling lines".)
   CircLearn.pinLabels(o)   the same labels on a phone: numbered discs on ruled leaders; and
   CircLearn.pinBand(...)   the numbered words, in a band above the drawing.
   CircLearn.thump(kind)    a heart sound, made in the browser: 'lub' or 'dub'. No recording needed.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  var h = L.h, esc = L.esc;

  function clamp01(k) { return k < 0 ? 0 : k > 1 ? 1 : k; }
  function still() { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); }

  function stepper(opts) {
    var STEPS = opts.steps, END = opts.end, render = opts.render;
    var bar = h('div', 'sp__bar');
    var play = h('button', 'sp__play'); play.type = 'button';
    var all = h('button', 'sp__all', '<span class="sp__ico" aria-hidden="true">▶▶</span> Play all'); all.type = 'button';
    var prog = h('div', 'sp__prog'); prog.setAttribute('aria-hidden', 'true');
    function stepEnd(i) { return i + 1 < STEPS.length ? STEPS[i + 1].t : END; }
    STEPS.forEach(function (st, i) {
      var sg = h('span', 'sp__seg', '<i></i>');
      sg.style.flexGrow = Math.max(.5, stepEnd(i) - st.t).toFixed(2);
      sg.addEventListener('click', function () { goStep(i); });
      prog.appendChild(sg);
    });
    var count = h('span', 'sp__count');
    bar.appendChild(play); bar.appendChild(all); bar.appendChild(prog); bar.appendChild(count);

    var list = h('ol', 'sp__steps');
    STEPS.forEach(function (st, i) {
      var li = h('li', 'sp__step');
      var b = h('button', 'sp__stepb', '<span class="sp__num">' + (i + 1) + '</span><span class="sp__txt"><b>' + esc(st.h) + '</b>' +
        (st.tag ? ' <span class="sp__tag">' + esc(st.tag) + '</span>' : '') + '<span class="sp__p">' + L.mk(st.p) + '</span></span>');
      b.type = 'button';
      b.addEventListener('click', function () { goStep(i); });
      li.appendChild(b); list.appendChild(li);
    });
    var now = h('p', 'sp__now'); now.setAttribute('aria-live', 'polite');

    var T = 0, playing = false, raf = null, last = null, started = false, stopAt = null;
    function stepAt(t) { var k = 0; for (var i = 0; i < STEPS.length; i++) if (t >= STEPS[i].t - 1e-6) k = i; return k; }
    function segEnd(i) { return i + 1 < STEPS.length ? STEPS[i + 1].t - .02 : END; }
    function atStepEnd() { return started && !playing && stopAt != null && T >= stopAt - 1e-3; }
    function paint(t) {
      render(t);
      var k = stepAt(t), done = t >= END - 1e-6;
      Array.prototype.forEach.call(list.children, function (li, i) {
        li.classList.toggle('is-on', started && i === k);
        li.classList.toggle('is-done', started && (i < k || (done && i === k)));
      });
      Array.prototype.forEach.call(prog.children, function (sg, i) {
        var a = STEPS[i].t, b = stepEnd(i);
        sg.firstChild.style.width = (started ? clamp01((t - a) / Math.max(.001, b - a)) * 100 : 0).toFixed(1) + '%';
        sg.classList.toggle('is-on', started && i === k);
      });
      count.textContent = started ? 'Step ' + (k + 1) + ' of ' + STEPS.length : STEPS.length + ' steps';
      /* the step's words under the drawing: read aloud to a screen reader, and shown when the
         step list is stacked below the drawing (a narrow widget), so they are never a scroll away */
      var nt = started ? '<b class="sp__nowh">Step ' + (k + 1) + ' of ' + STEPS.length + ' · ' + esc(STEPS[k].h) + '</b> ' + L.mk(STEPS[k].p) : '<b class="sp__nowh">Press Play</b> to start. Each step stops until you press Next step.';
      if (now.getAttribute('data-k') !== String(started ? k : -1)) { now.innerHTML = nt; now.setAttribute('data-k', String(started ? k : -1)); }
      sync();
    }
    function sync() {
      var ended = T >= END - 1e-3, next = atStepEnd() && !ended;
      play.innerHTML = playing ? '<span class="sp__ico" aria-hidden="true">❚❚</span> Pause'
        : ended ? '<span class="sp__ico" aria-hidden="true">↻</span> Play again'
        : !started ? '<span class="sp__ico" aria-hidden="true">▶</span> Play'
        : next ? '<span class="sp__ico" aria-hidden="true">▶</span> Next step'
        : '<span class="sp__ico" aria-hidden="true">▶</span> Resume';
      play.classList.toggle('is-playing', playing);
      play.classList.toggle('is-next', next);
      all.hidden = still();
    }
    function stop() { playing = false; if (raf) cancelAnimationFrame(raf); raf = null; }
    function frame(ts) {
      if (!bar.isConnected) { stop(); return; }
      if (last == null) last = ts;
      var lim = stopAt == null ? END : stopAt;
      T = Math.min(lim, T + Math.min(.1, (ts - last) / 1000) * (opts.rate ? opts.rate() : 1)); last = ts;
      if (T >= lim) { playing = false; raf = null; paint(T); if (opts.onHold) opts.onHold(stepAt(T)); return; }
      paint(T);
      raf = requestAnimationFrame(frame);
    }
    function run(from, to) {
      stop(); started = true; stopAt = to;
      if (opts.onStart) opts.onStart();
      if (still()) { T = to; paint(T); return; }
      T = from; playing = true; last = null; paint(T);
      raf = requestAnimationFrame(frame);
    }
    function goStep(i) { run(STEPS[i].t, segEnd(i)); }
    play.addEventListener('click', function () {
      if (playing) { stop(); paint(T); return; }
      if (!started || T >= END - 1e-3) { goStep(0); return; }
      if (atStepEnd()) { goStep(stepAt(T) + 1); return; }
      run(T, stopAt == null ? segEnd(stepAt(T)) : stopAt);
    });
    all.addEventListener('click', function () {
      var from = !started || T >= END - 1e-3 ? 0 : atStepEnd() ? STEPS[stepAt(T) + 1].t : T;
      run(from, END);
    });
    return {
      bar: bar, list: list, now: now, paint: paint, stop: stop, isStill: still,
      time: function () { return T; },
      seek: function (t) { stop(); started = t > 0; stopAt = null; T = Math.max(0, Math.min(END, t)); paint(T); return STEPS.map(function (s) { return s.t; }); }
    };
  }

  /* ---------- labels in two margins, leaders ruled level ----------
     opts: { items: [{ id, text, x, y, side: 'L'|'R' }], left: x of the left margin's inner edge,
             right: x of the right margin's inner edge, font, top, bottom, gap }
     returns the SVG markup. Text wraps to `width` units. */
  function labels(o) {
    var font = o.font || 16, lh = font * 1.18, gap = o.gap == null ? 5 : o.gap, out = '';
    function wrap(t, w) {
      var words = String(t).split(' '), lines = [], cur = '';
      words.forEach(function (wd) { var tr = cur ? cur + ' ' + wd : wd; if (tr.length * font * .52 > w && cur) { lines.push(cur); cur = wd; } else cur = tr; });
      if (cur) lines.push(cur);
      return lines;
    }
    ['L', 'R'].forEach(function (side) {
      var it = o.items.filter(function (x) { return x.side === side && !x.hidden; }).map(function (x) {
        var lines = wrap(x.text, o.width || 110);
        return { x: x.x, y: x.y, ly: x.y, lines: lines, h: lines.length * lh, id: x.id, cls: x.cls || '', op: x.op == null ? 1 : x.op };
      }).sort(function (a, b) { return a.y - b.y; });
      var i;
      var top = o.top == null ? -1e9 : o.top, bot = o.bottom == null ? 1e9 : o.bottom;
      if (it.length && it[0].ly - it[0].h / 2 < top) it[0].ly = top + it[0].h / 2;
      for (i = 1; i < it.length; i++) { var lo = it[i - 1].ly + it[i - 1].h / 2 + gap + it[i].h / 2; if (it[i].ly < lo) it[i].ly = lo; }
      for (i = it.length - 1; i >= 0; i--) {
        var hi = i === it.length - 1 ? bot - it[i].h / 2 : it[i + 1].ly - it[i + 1].h / 2 - gap - it[i].h / 2;
        if (it[i].ly > hi) it[i].ly = hi;
      }
      it.forEach(function (x) {
        var edge = side === 'L' ? o.left : o.right, dir = side === 'L' ? -1 : 1;
        var jog = Math.abs(x.ly - x.y) > .5;
        var d = 'M' + f2(x.x) + ' ' + f2(x.y) + 'L' + f2(edge) + ' ' + f2(x.y) + (jog ? 'L' + f2(edge + dir * 6) + ' ' + f2(x.ly) : '') + 'L' + f2(edge + dir * 9) + ' ' + f2(x.ly);
        var tx = edge + dir * 13, anchor = side === 'L' ? 'end' : 'start', y0 = x.ly - x.h / 2 + font * .84;
        out += '<g class="lb ' + x.cls + '" data-lab="' + esc(x.id || '') + '" opacity="' + x.op + '">' +
          '<path class="lb__halo" d="' + d + '"/><path class="lb__lead" d="' + d + '"/><circle class="lb__dot" cx="' + f2(x.x) + '" cy="' + f2(x.y) + '" r="' + (font * .16).toFixed(2) + '"/>' +
          '<text class="lb__txt" x="' + f2(tx) + '" y="' + f2(y0) + '" text-anchor="' + anchor + '" style="font-size:' + font + 'px">' +
          x.lines.map(function (ln, k) { return '<tspan x="' + f2(tx) + '" dy="' + (k ? f2(lh) : 0) + '">' + esc(ln) + '</tspan>'; }).join('') + '</text></g>';
      });
    });
    return out;
  }
  function f2(v) { return Math.round(v * 100) / 100; }

  /* ---------- the same labels on a phone: numbered pins, words in a band ----------
     Below about 520 px a column of words beside the drawing shrinks to a few pixels. So each
     label becomes a numbered disc in a narrow margin, joined to its part by the same ruled
     horizontal leader (so leaders still never cross), and the words go in a numbered list in a
     band above the drawing — the Plants Lab's rule for its animations on a phone.
     pinLabels(o): o as for labels(), with left/right the inner edges of the two pin columns.
       returns { svg, order: [{ n, text, cls }] } — number 1 is the top of the left column. */
  function pinLabels(o) {
    var font = o.font || 18, r = font * .72, gap = o.gap == null ? 4 : o.gap, out = '', order = [];
    ['L', 'R'].forEach(function (side) {
      var it = o.items.filter(function (x) { return x.side === side && !x.hidden; }).map(function (x) {
        return { x: x.x, y: x.y, ly: x.y, h: 2 * r, id: x.id, text: x.text, cls: x.cls || '', op: x.op == null ? 1 : x.op };
      }).sort(function (a, b) { return a.y - b.y; });
      var i, top = o.top == null ? -1e9 : o.top, bot = o.bottom == null ? 1e9 : o.bottom;
      if (it.length && it[0].ly - r < top) it[0].ly = top + r;
      for (i = 1; i < it.length; i++) { var lo = it[i - 1].ly + 2 * r + gap; if (it[i].ly < lo) it[i].ly = lo; }
      for (i = it.length - 1; i >= 0; i--) { var hi = i === it.length - 1 ? bot - r : it[i + 1].ly - 2 * r - gap; if (it[i].ly > hi) it[i].ly = hi; }
      it.forEach(function (x) {
        var n = order.length + 1, edge = side === 'L' ? o.left : o.right, dir = side === 'L' ? -1 : 1;
        var jog = Math.abs(x.ly - x.y) > .5, cx = edge + dir * (r + 8);
        var d = 'M' + f2(x.x) + ' ' + f2(x.y) + 'L' + f2(edge) + ' ' + f2(x.y) + (jog ? 'L' + f2(edge + dir * 5) + ' ' + f2(x.ly) : '') + 'L' + f2(cx - dir * r) + ' ' + f2(x.ly);
        out += '<g class="lb lb--pin ' + x.cls + '" data-lab="' + esc(x.id || '') + '" opacity="' + x.op + '">' +
          '<path class="lb__halo" d="' + d + '"/><path class="lb__lead" d="' + d + '"/><circle class="lb__dot" cx="' + f2(x.x) + '" cy="' + f2(x.y) + '" r="' + (font * .16).toFixed(2) + '"/>' +
          '<circle class="lb__pin" cx="' + f2(cx) + '" cy="' + f2(x.ly) + '" r="' + f2(r) + '"/>' +
          '<text class="lb__pinn" x="' + f2(cx) + '" y="' + f2(x.ly + font * .3) + '" text-anchor="middle" style="font-size:' + f2(font * .82) + 'px">' + n + '</text></g>';
        order.push({ n: n, text: x.text, cls: x.cls });
      });
    });
    return { svg: out, order: order };
  }
  /* the numbered words, in columns, from (x, y) down, inside width w. Returns { svg, h }. */
  function pinBand(order, x, y, w, font, cols) {
    cols = cols || 2;
    var lh = font * 1.25, colW = w / cols, per = Math.ceil(order.length / cols), out = '';
    order.forEach(function (it, i) {
      var c = Math.floor(i / per), k = i % per;
      out += '<text class="lb__band ' + (it.cls || '') + '" x="' + f2(x + c * colW) + '" y="' + f2(y + font + k * lh) + '" style="font-size:' + font + 'px">' +
        '<tspan class="lb__bandn">' + it.n + '</tspan> ' + esc(it.text) + '</text>';
    });
    return { svg: out, h: per * lh + font * .6 };
  }

  /* ---------- the two heart sounds, synthesised ----------
     A short low thump, the way a valve snapping shut sounds through a stethoscope: "lub" is
     lower and a little longer (the atrioventricular valves), "dub" higher and shorter (the
     semilunar valves). Only ever played after the reader has pressed something. */
  var ctx = null;
  function thump(kind) {
    try {
      ctx = ctx || new (global.AudioContext || global.webkitAudioContext)();
      if (ctx.state === 'suspended') ctx.resume();
      var t0 = ctx.currentTime, dur = kind === 'lub' ? .16 : .11, f = kind === 'lub' ? 46 : 62;
      var o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter();
      o.type = 'sine'; o.frequency.setValueAtTime(f * 1.6, t0); o.frequency.exponentialRampToValueAtTime(f, t0 + dur * .5);
      lp.type = 'lowpass'; lp.frequency.value = 180;
      g.gain.setValueAtTime(.0001, t0); g.gain.exponentialRampToValueAtTime(kind === 'lub' ? .9 : .7, t0 + .012); g.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
      o.connect(lp); lp.connect(g); g.connect(ctx.destination);
      o.start(t0); o.stop(t0 + dur + .02);
    } catch (e) { /* no sound: nothing else depends on it */ }
  }

  L.stepper = stepper;
  L.labels = labels;
  L.pinLabels = pinLabels;
  L.pinBand = pinBand;
  L.thump = thump;
  L.clamp01 = clamp01;
  L.still = still;
})(window);
