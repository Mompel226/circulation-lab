/* ============================================================
   widgets.js — the Learn-tab widgets every lab can use. SHARED: the copy in
   labs-shared/engine/ is the source; a lab's build copies it in as js/widgets.js.

   A lab's own js/learn.js registers the widgets its topic needs on top of these:
     Widgets.register('mywidget', function (spec, ctx) { ... return element; });
   and app.js draws a station's learn.interact entries with Widgets.widget(spec, ctx).

   What is here, because more than one lab wants it:
     picture   a photograph from assets/photos/<base>-900.jpg (+ -1400 when it exists),
               WebP first, its box reserved before it loads (window.PHOTO_SIZE)
     pinned    numbered pins on a picture, named in a column beside it, joined by ruled
               lines that never cross — the way a labelled figure is drawn
     finder    a photograph with the features to find on it, built on pinned
     table     a comparison table, its words marked by the lab's Terms
     photo     a photograph with its caption and credit, opening full size on a click
     head      a widget's heading line and the sentence that asks for something
   The Classification Lab still carries its own copy of the first five inside its
   js/learn.js, from before this file existed; the two are the same code.
   ============================================================ */
(function (global) {
  'use strict';

  function h(tag, cls, html) { var n = document.createElement(tag); if (cls) n.className = cls; if (html != null) n.innerHTML = html; return n; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, function (c) { return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]; }); }
  function mk(t) { return (global.Terms && global.Terms.mark) ? global.Terms.mark(t) : esc(t); }

  function head(title, ask, tryWord) {
    var d = h('div', 'widget__h', esc(title) + (tryWord ? '<span class="widget__try">' + esc(tryWord) + '</span>' : ''));
    var frag = document.createDocumentFragment(); frag.appendChild(d);
    if (ask) frag.appendChild(h('p', 'widget__ask', mk(ask)));
    return frag;
  }

  /* How wide a picture is really drawn, measured across the widgets at 390, 820, 1100 and
     1440 px: the widest is about 440. Saying the true width lets the browser pick the
     smaller file whenever it can. */
  var SIZES_ATTR = '(max-width: 620px) 92vw, 440px';

  var WEBP = (function () {
    try { var c = document.createElement('canvas'); c.width = c.height = 1;
          return !!c.toDataURL && c.toDataURL('image/webp').indexOf('data:image/webp') === 0; }
    catch (e) { return false; }
  })();
  function sizeOf(base) { return (global.PHOTO_SIZE || {})[base.replace('assets/photos/', '')] || null; }
  function hasBig(base) { return !!(global.PHOTO_SIZE || {})[base.replace('assets/photos/', '') + '-1400.jpg']; }
  function bigVariant(base) { return base + (hasBig(base) ? '-1400' : '-900') + (WEBP ? '.webp' : '.jpg'); }

  /* a picture: assets/photos/<base>-900.jpg, and -1400 where the build found one. Every
     base has its WebP twin; <picture> asks for it safely. A picture whose source was small
     has no -1400, and the srcset simply stops at 900. */
  function picture(spec) {
    if (!spec || !spec.img) return null;
    var base = 'assets/photos/' + spec.img, alt = spec.alt || '', credit = spec.credit || '', url = spec.url || '';
    var im = new Image();
    var wh = sizeOf(spec.img + '-900.jpg') || sizeOf(spec.img);
    if (wh) { im.width = wh[0]; im.height = wh[1]; }
    var big = hasBig(base);
    var pic = document.createElement('picture');
    var wp = document.createElement('source');
    wp.type = 'image/webp';
    wp.srcset = base + '-900.webp 900w' + (big ? ', ' + base + '-1400.webp 1400w' : '');
    wp.sizes = SIZES_ATTR;
    pic.appendChild(wp);
    im.src = base + '-900.jpg';
    im.srcset = base + '-900.jpg 900w' + (big ? ', ' + base + '-1400.jpg 1400w' : '');
    im.sizes = SIZES_ATTR;
    im.alt = alt; im.loading = 'lazy'; im.decoding = 'async';
    pic.appendChild(im);
    return { img: im, pic: pic, base: base,
             credit: url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(credit) + '</a>' : esc(credit) };
  }

  /* every pinned picture on screen, so one listener can lay them all out again */
  var LIVE = [];
  window.addEventListener('resize', function () {
    for (var i = LIVE.length - 1; i >= 0; i--) {
      if (!LIVE[i].box.isConnected) { LIVE.splice(i, 1); continue; }
      LIVE[i].layout();
    }
  });

  /* ---------- pins on a picture, named in a column, joined by ruled lines ----------
     Nothing is written on the picture: a pin carries a number, its name sits in a column
     beside the picture at the same height as the pin, and clicking either rules a line
     between them. A second click takes the line away. Two lines are never allowed to
     cross: names are placed level with their pins, kept apart, and swapped if their lines
     would meet. Beside each found name is a close crop of the feature. */
  function pinned(box, stage, spotsIn, list, opts) {
    opts = opts || {};
    var spots = spotsIn.slice().sort(function (a, b) { return a.y - b.y; });
    var lines = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    lines.setAttribute('class', 'pins__lines'); lines.setAttribute('aria-hidden', 'true');
    box.appendChild(lines);
    var found = {}, pins = [], items = [], zooms = [], Y = [], order = [];
    var NARROW = 520, MIN_COL = 150;
    function stacked() {
      var b = list.parentNode && list.parentNode.getBoundingClientRect();
      if (b && b.width && b.width < NARROW) return true;
      var sb = stage.getBoundingClientRect(), lb = list.getBoundingClientRect();
      if (lb.top >= sb.bottom - 4) return true;
      if (lb.width && lb.width < MIN_COL) return true;
      return false;
    }
    function crosses(a, b, c, d) {
      function ccw(p, q, r) { return (r.y - p.y) * (q.x - p.x) > (q.y - p.y) * (r.x - p.x); }
      return ccw(a, c, d) !== ccw(b, c, d) && ccw(a, b, c) !== ccw(a, b, d);
    }
    function layout() {
      var sb = stage.getBoundingClientRect(), lb = list.getBoundingClientRect();
      var narrow = stacked();
      if (list.parentNode) list.parentNode.classList.toggle('finder--narrow', narrow);
      if (!sb.width || !sb.height || narrow) {
        items.forEach(function (li) { li.style.position = ''; li.style.top = ''; });
        list.style.minHeight = ''; list.classList.remove('is-column'); drawLines(); return;
      }
      list.classList.add('is-column');
      var H = items.map(function (li) { return li.offsetHeight; }), gap = 6;
      var py = spots.map(function (sp) { return sb.top + sp.y / 100 * sb.height - lb.top; });
      var px = spots.map(function (sp) { return sb.left + sp.x / 100 * sb.width - lb.left; });
      order = spots.map(function (sp, i) { return i; }).sort(function (a, b) { return py[a] - py[b]; });
      function place(ord) {
        ord = ord || order;
        var top = ord.map(function (i) { return py[i] - H[i] / 2; });
        for (var pass = 0; pass < 80; pass++) {
          var moved = false;
          for (var k = 0; k + 1 < ord.length; k++) {
            var over = (top[k] + H[ord[k]] + gap) - top[k + 1];
            if (over > 0.5) { top[k] -= over / 2; top[k + 1] += over / 2; moved = true; }
          }
          if (top[0] < 0) { var d = -top[0]; for (var m = 0; m < top.length; m++) top[m] += d; moved = true; }
          if (!moved) break;
        }
        var out = [];
        ord.forEach(function (i, k) { out[i] = top[k]; });
        return out;
      }
      /* The lines are drawn from each pin to an elbow just left of its item, then across;
         two lines cross only if those slanted legs do. The column order that gives no
         crossings is found by trying every order (there are never more than a handful of
         pins), keeping the one whose items sit nearest their pins; beyond eight pins the
         search would be slow, so adjacent pairs are swapped until none cross. */
      function endOf(i, Yi) { var elbow = Math.min(38, Math.max(14, -px[i] * 0.34)); return { x: -elbow, y: Yi + H[i] / 2 }; }
      function score(ord) {
        var Yt = place(ord), cross = 0, drift = 0;
        for (var i = 0; i < ord.length; i++) {
          drift += Math.abs(Yt[ord[i]] + H[ord[i]] / 2 - py[ord[i]]);
          for (var j = i + 1; j < ord.length; j++) {
            var p = ord[i], q = ord[j];
            if (crosses({ x: px[p], y: py[p] }, endOf(p, Yt[p]), { x: px[q], y: py[q] }, endOf(q, Yt[q]))) cross++;
          }
        }
        return { cross: cross, drift: drift, Y: Yt };
      }
      var best = score(order);
      if (best.cross > 0 && order.length <= 8) {
        var perm = order.slice(), c = perm.map(function () { return 0; }), k = 0, bestOrder = order.slice();
        while (k < perm.length) {
          if (c[k] < k) {
            if (k % 2 === 0) { var t0 = perm[0]; perm[0] = perm[k]; perm[k] = t0; } else { var t1 = perm[c[k]]; perm[c[k]] = perm[k]; perm[k] = t1; }
            var sc = score(perm);
            if (sc.cross < best.cross || (sc.cross === best.cross && sc.drift < best.drift)) { best = sc; bestOrder = perm.slice(); if (best.cross === 0 && best.drift < 1) break; }
            c[k]++; k = 0;
          } else { c[k] = 0; k++; }
        }
        order = bestOrder;
      } else if (best.cross > 0) {
        for (var pass2 = 0; pass2 < 40; pass2++) {
          var swapped = false;
          for (var k2 = 0; k2 + 1 < order.length && !swapped; k2++) {
            var i2 = order[k2], j2 = order[k2 + 1], Yn = place(order);
            if (crosses({ x: px[i2], y: py[i2] }, endOf(i2, Yn[i2]), { x: px[j2], y: py[j2] }, endOf(j2, Yn[j2]))) { order[k2] = j2; order[k2 + 1] = i2; swapped = true; }
          }
          if (!swapped) break;
        }
        best = score(order);
      }
      Y = best.Y;
      items.forEach(function (li, i) { li.style.position = 'absolute'; li.style.top = Y[i] + 'px'; });
      var bottom = Math.max.apply(null, items.map(function (li, i) { return Y[i] + H[i]; }));
      list.style.minHeight = Math.max(sb.height, bottom) + 'px';
      drawLines();
    }
    function drawLines() {
      var b = box.getBoundingClientRect(), out = '';
      if (!b.width) return;
      lines.setAttribute('viewBox', '0 0 ' + b.width + ' ' + b.height);
      lines.style.width = b.width + 'px'; lines.style.height = b.height + 'px';
      if (!stacked()) pins.forEach(function (pin, i) {
        if (!found[i]) return;
        var a = pin.getBoundingClientRect(), c = items[i].getBoundingClientRect();
        var x1 = a.left + a.width / 2 - b.left, y1 = a.top + a.height / 2 - b.top;
        var x2 = c.left - b.left, y2 = c.top + c.height / 2 - b.top;
        var elbow = Math.min(38, Math.max(14, (x2 - x1) * 0.34));
        var xe = x2 - elbow;
        var dx = xe - x1, dy = y2 - y1, len = Math.sqrt(dx * dx + dy * dy) || 1, r = a.width / 2 + 1;
        x1 += dx / len * r; y1 += dy / len * r;
        var pts = x1 + ',' + y1 + ' ' + (xe > x1 ? xe : x1) + ',' + y2 + ' ' + x2 + ',' + y2;
        out += '<polyline class="pins__halo" points="' + pts + '"/><polyline class="pins__line" points="' + pts + '"/>';
      });
      lines.innerHTML = out;
    }
    var ZOOM_W = 64, ZOOM_FRAC = 0.13;
    function zoomInto(i) {
      var z = zooms[i], sb = stage.getBoundingClientRect(); if (!z || !opts.zoom || !sb.width) return;
      var frac = spots[i].z || ZOOM_FRAC;
      var bgW = ZOOM_W / frac, bgH = bgW * (sb.height / sb.width);
      if (bgH < ZOOM_W) { bgW *= ZOOM_W / bgH; bgH = ZOOM_W; }
      z.style.backgroundImage = 'url("' + opts.zoom + '")';
      z.style.backgroundSize = bgW + 'px ' + bgH + 'px';
      var cx = spots[i].cx != null ? spots[i].cx : spots[i].x;
      var cy = spots[i].cy != null ? spots[i].cy : spots[i].y;
      var x = cx / 100 * bgW - ZOOM_W / 2, y = cy / 100 * bgH - ZOOM_W / 2;
      x = Math.max(0, Math.min(x, bgW - ZOOM_W)); y = Math.max(0, Math.min(y, bgH - ZOOM_W));
      z.style.backgroundPosition = (-x) + 'px ' + (-y) + 'px';
    }
    function toggle(i, on) {
      var now = on == null ? !found[i] : !!on;
      if (now === !!found[i]) return;
      if (now) { found[i] = 1; zoomInto(i); } else delete found[i];
      pins[i].classList.toggle('is-found', now); items[i].classList.toggle('is-found', now);
      pins[i].setAttribute('aria-pressed', now ? 'true' : 'false');
      layout();
      if (opts.onChange) opts.onChange(Object.keys(found).length, spots.length);
    }
    spots.forEach(function (sp, i) {
      var pin = h('button', 'pin' + (opts.pinClass ? ' ' + opts.pinClass : '') + (sp.extra ? ' pin--extra' : ''), String(i + 1)); pin.type = 'button';
      pin.style.left = sp.x + '%'; pin.style.top = sp.y + '%';
      pin.setAttribute('aria-label', (opts.pinWord || 'Spot') + ' ' + (i + 1) + ': ' + sp.label); pin.setAttribute('aria-pressed', 'false');
      pin.addEventListener('click', function () { toggle(i); });
      stage.appendChild(pin); pins.push(pin);
      var li = h('li', 'pins__item' + (sp.extra ? ' pins__item--extra' : ''), '<span class="n">' + (i + 1) + '</span><span class="pins__txt"><b>' + esc(sp.label) + '</b>' +
        (sp.extra ? '<span class="pins__tag">not in 0610</span>' : '') +
        (sp.note ? '<small>' + esc(sp.note) + '</small>' : '') + '</span>' + (opts.zoom ? '<span class="pins__zoom" aria-hidden="true">' +
          (sp.mark ? '<svg class="pins__mark" viewBox="0 0 100 100" preserveAspectRatio="none">' +
            (sp.mark.line || []).map(function (l) {
              return '<line class="pins__markl" x1="' + l[0] + '" y1="' + l[1] + '" x2="' + l[2] + '" y2="' + l[3] + '"/>';
            }).join('') + '</svg>' : '') + '</span>' : ''));
      li.setAttribute('role', 'button'); li.tabIndex = 0;
      li.addEventListener('click', function () { toggle(i); });
      li.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(i); } });
      list.appendChild(li); items.push(li); zooms.push(li.querySelector('.pins__zoom'));
    });
    var im = stage.querySelector('img');
    if (im) { im.addEventListener('load', layout); if (im.complete) setTimeout(layout, 0); }
    LIVE.push({ box: box, layout: layout });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
    setTimeout(layout, 50);
    return { toggle: toggle, layout: layout, count: function () { return Object.keys(found).length; },
             all: function (on) { spots.forEach(function (sp, i) { toggle(i, on); }); } };
  }

  /* ---------- finder: a photograph and the features to find on it ---------- */
  function finder(spec) {
    var box = h('div', 'widget'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.appendChild(head(spec.title || 'Find the features', spec.ask || 'Click a numbered pin on the picture, or its name beside it, and a line is ruled between them — the way a labelled figure is drawn. Click again to take the line away. The small picture beside a name is a close-up of that feature.', spec.tryWord || 'Click the pins'));
    var wrap = h('div', 'finder pins');
    var stage = h('div', 'finder__stage');
    var pic = picture(spec); if (pic) stage.appendChild(pic.pic);
    var list = h('ul', 'finder__list');
    var left = h('div', 'finder__left'); left.appendChild(stage);
    var done = null, all;
    var ctl = pinned(wrap, stage, spec.spots, list, {
      zoom: pic ? bigVariant(pic.base) : null,
      onChange: function (n, total) {
        all.textContent = n === total ? 'Hide every label' : 'Show every label';
        if (n === total && !done) { done = h('p', 'widget__done', mk(spec.done || ('All ' + total + ' found.'))); box.appendChild(done); }
        if (n < total && done) { done.remove(); done = null; }
      }
    });
    var tools = h('div', 'finder__tools');
    all = h('button', 'wbtn wbtn--quiet', 'Show every label'); all.type = 'button';
    all.addEventListener('click', function () { ctl.all(ctl.count() < spec.spots.length); });
    tools.appendChild(all);
    if (pic && pic.credit) tools.appendChild(h('p', 'finder__credit', pic.credit));
    left.appendChild(tools);
    wrap.appendChild(left); wrap.appendChild(list);
    box.appendChild(wrap);
    if (spec.note) box.appendChild(h('p', 'widget__note', mk(spec.note)));
    return box;
  }

  /* ---------- table: a comparison, its words marked ---------- */
  function table(spec) {
    var box = h('div', 'ctable'); if (spec.group) box.setAttribute('data-group', spec.group);
    box.innerHTML = '<table>' + (spec.caption ? '<caption>' + esc(spec.caption) + '</caption>' : '') +
      '<thead><tr>' + spec.head.map(function (c) { return '<th>' + mk(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      spec.rows.map(function (r) { return '<tr>' + r.map(function (c, i) { return i === 0 ? '<th scope="row">' + mk(c) + '</th>' : '<td>' + mk(c) + '</td>'; }).join('') + '</tr>'; }).join('') + '</tbody></table>';
    return box;
  }

  /* ---------- two pictures on one row: the drawing, and the thing itself ----------
     A diagram says what the parts are called; a photograph says what they actually look like.
     Side by side, a reader does not have to hold one of them in their head while looking at the
     other. The cells are sized by aspect ratio so both pictures come out the same HEIGHT —
     equal widths would make a tall close-up tower over a wide diagram. Below 620px there is no
     room for two columns and they stack. Opt in with `beside`, so nothing else changes. */
  function photoPair(spec) {
    var f = h('figure', 'photo photo--pair'), row = h('div', 'photo__row'), credits = [];
    [spec, spec.beside].forEach(function (s) {
      var pic = picture(s); if (!pic) return;
      var cell = h('div', 'photo__cell');
      var wh = sizeOf(s.img + '-900.jpg') || sizeOf(s.img);
      cell.style.flex = (wh && wh[1] ? (wh[0] / wh[1]).toFixed(3) : '1') + ' 1 0';
      cell.appendChild(pic.pic);
      pic.img.addEventListener('click', function () {
        if (global.LabLightbox) global.LabLightbox(pic.img.currentSrc || pic.img.src, s.cap || '', s.kind || 'Photograph', pic.credit);
      });
      if (s.cap) cell.appendChild(h('figcaption', 'photo__sub', mk(s.cap)));
      if (pic.credit && credits.indexOf(pic.credit) < 0) credits.push(pic.credit);
      row.appendChild(cell);
    });
    f.appendChild(row);
    f.appendChild(h('figcaption', null, (spec.pairCap ? mk(spec.pairCap) + ' · ' : '') + credits.join(' · ')));
    return f;
  }

  /* ---------- photo: a photograph with its credit, full size on a click ---------- */
  function photo(spec) {
    if (spec.beside) return photoPair(spec);
    /* A portrait picture set full width leaves a column of empty paper beside it — worst on a
       tall, narrow diagram like a xylem vessel or a sieve tube. Those are marked so the page can
       stand them beside the prose instead. The shape is known before the file loads, from the
       sizes the build wrote, so nothing moves once it arrives. */
    var wh0 = sizeOf(spec.img + '-900.jpg') || sizeOf(spec.img);
    var tall = wh0 && wh0[0] && wh0[1] / wh0[0] > 1.15;
    var f = h('figure', 'photo' + (spec.small ? ' photo--small' : '') + (tall ? ' photo--portrait' : '') +
                       (spec.align === 'right' ? ' photo--right' : '')); if (spec.group) f.setAttribute('data-group', spec.group);   /* small: a low-resolution diagram drawn at its own size, not blown up */
    var pic = picture(spec);
    if (pic) {
      f.appendChild(pic.pic);
      pic.img.addEventListener('click', function () { if (global.LabLightbox) global.LabLightbox(pic.img.currentSrc || pic.img.src, spec.cap || '', spec.kind || 'Photograph', pic.credit); });
    }
    f.appendChild(h('figcaption', null, (spec.cap ? mk(spec.cap) + ' · ' : '') + (pic ? pic.credit : '')));
    return f;
  }

  /* A widget a reader clicks through — tubes pressed, pins opened, sliders moved — gets a small reset in its
     header that builds it afresh in the same place. Pictures, videos, tables and the potometer (which has resets
     of its own) do not. */
  var NO_RESET = { video: 1, photo: 1, table: 1, potometer: 1, auxin: 1 };
  function addReset(spec, e, remake) {
    if (NO_RESET[spec.type] || !e.querySelector) return;
    var hd = e.querySelector('.widget__h'); if (!hd || !e.querySelector('button, input, select, [role="button"]')) return;
    var b = h('button', 'widget__reset', '↺ Reset'); b.type = 'button'; b.title = 'Start this one again';
    b.addEventListener('click', function () {
      /* the words this one introduced are marked again when it is built again */
      if (global.Terms && global.Terms.unsee) { var ws = [], js = []; Array.prototype.forEach.call(e.querySelectorAll('.t'), function (t) { ws.push(t.textContent); if (t.getAttribute('data-jump')) js.push(t.getAttribute('data-jump')); }); global.Terms.unsee(ws, js); }
      if (typeof e.__onReset === 'function') e.__onReset();   /* state kept outside the node — a saved route — goes too */
      var fresh = remake(); if (e.parentNode) e.parentNode.replaceChild(fresh, e); if (global.Widgets && global.Widgets.reap) global.Widgets.reap();
    });
    hd.appendChild(b);
  }
  var MAKERS = { finder: finder, table: table, photo: photo };
  global.Widgets = {
    register: function (type, maker) { MAKERS[type] = maker; },
    widget: function (spec, ctx) {
      var maker = MAKERS[spec.type];
      if (!maker) return h('p', 'widget__note', 'Unknown widget: ' + esc(spec.type));
      var e = maker(spec, ctx || {});
      if (spec.group && !e.getAttribute('data-group')) e.setAttribute('data-group', spec.group);
      addReset(spec, e, function () { return global.Widgets.widget(spec, ctx); });
      return e;
    },
    /* drop the pinned pictures that have left the page; call after a station is cleared
       and before the next is built */
    reap: function () { for (var i = LIVE.length - 1; i >= 0; i--) if (!LIVE[i].box.isConnected) LIVE.splice(i, 1); },
    has: function (type) { return !!MAKERS[type]; },
    h: h, esc: esc, mk: mk, head: head, picture: picture, pinned: pinned, bigVariant: bigVariant, hasBig: hasBig, addReset: addReset
  };
})(window);
