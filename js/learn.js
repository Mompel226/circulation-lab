/* ============================================================
   learn.js — the Learn tab's widgets for Topic 9: nothing here is only read.

   The generic ones — finder, table, photo — are the shared js/widgets.js. What this file adds:
     video        one of the lesson videos, with its poster, played on demand
     watch        a film on YouTube, loaded only when pressed
     curio        "Did you know?": one strange true thing, fenced off from the exam
     labelphoto   a photograph labelled the way a drawing is, leaders ruled level
   and the topic's own widgets, each introduced where it is defined below.
   Also exported for the questions: svgFor (the drawings), so a hotspot can use one.
   ============================================================ */
(function (global) {
  'use strict';
  var W = global.Widgets;
  var h = W.h, esc = W.esc, mk = W.mk, head = W.head;
  function svgEl(html) { var d = document.createElement('div'); d.innerHTML = html; return d.firstElementChild; }

  /* ---------- video: a lesson clip, on demand ---------- */
  function video(spec) {
    var f = h('figure', 'media media--video');
    var v = document.createElement('video');
    v.className = 'media__el';
    v.src = 'assets/video/' + spec.src + '.mp4';
    v.poster = 'assets/video/' + spec.src + '.jpg';
    v.controls = true; v.playsInline = true; v.preload = 'none';
    var wh = (global.PHOTO_SIZE || {})['video/' + spec.src + '.jpg'];
    if (wh) { v.width = wh[0]; v.height = wh[1]; }
    v.setAttribute('aria-label', spec.kind || 'Video');
    f.appendChild(v);
    f.appendChild(h('figcaption', 'media__cap', '<span class="kindtag">' + esc(spec.kind || 'Video') + '</span> ' + mk(spec.cap || '') +
      (spec.credit ? (spec.url ? ' <a class="media__credit" href="' + esc(spec.url) + '" target="_blank" rel="noopener">' + esc(spec.credit) + '</a>' : ' <span class="media__credit">' + esc(spec.credit) + '</span>') : '')));
    return f;
  }

  /* ---------- watch: an embedded YouTube film ----------
     These films are not ours, so they are not copied into the repository — they play from
     YouTube, in the page, like any other video on the station.

     Two details that are deliberate. The player is not loaded until somebody presses play: what
     sits on the page is the film's own still with a play button over it, and the iframe is built
     on the click. So a station with three films on it still loads three images rather than three
     copies of YouTube's player, and a reader who never presses play is never handed to Google.
     And when it does load it loads from youtube-nocookie.com, which is YouTube's own no-tracking
     host — same film, no cookie until they choose to watch. */
  function watch(spec) {
    var id = spec.id || (String(spec.url || '').match(/[?&]v=([A-Za-z0-9_-]+)/) || [])[1] || '';
    var f = h('figure', 'ytv');
    var frame = h('div', 'ytv__frame');

    var btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'ytv__poster';
    btn.setAttribute('aria-label', 'Play: ' + (spec.title || 'video') + ' (on YouTube)');
    var still = new Image();
    still.src = 'https://i.ytimg.com/vi/' + id + '/hqdefault.jpg';
    still.alt = ''; still.loading = 'lazy'; still.className = 'ytv__still';
    still.addEventListener('error', function () { btn.classList.add('is-bare'); });
    btn.appendChild(still);
    btn.appendChild(h('span', 'ytv__btn', '▶'));
    btn.appendChild(h('span', 'ytv__over', esc(spec.title || '')));
    btn.addEventListener('click', function () {
      var ifr = document.createElement('iframe');
      ifr.className = 'ytv__ifr';
      ifr.src = 'https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0&modestbranding=1&playsinline=1';
      ifr.title = spec.title || 'Video';
      ifr.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share';
      ifr.setAttribute('allowfullscreen', '');
      ifr.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
      frame.innerHTML = ''; frame.appendChild(ifr);
    });
    frame.appendChild(btn);
    f.appendChild(frame);

    f.appendChild(h('figcaption', 'media__cap',
      '<span class="kindtag">' + esc(spec.kind || 'Video') + '</span> ' + mk(spec.text || '') +
      ' <a class="media__credit" href="' + esc(spec.url) + '" target="_blank" rel="noopener">' +
      esc(spec.by || '') + ', on YouTube</a>'));
    return f;
  }

  /* ---------- curio: one strange true thing, fenced off from the exam ----------
     Daniel asked for these in the Plants Lab ("there are all these kind of weird things ... just
     display that"). A photograph, a short story in plain sentences, and the paper it comes from.
     Every card says, in its own head, that it is not on either syllabus. ---------- */
  function curio(spec) {
    /* ~like this~ is italic. The lab's own _like this_ means "underline this exam word", which is
       not what a scientific name or a journal title wants, and Terms.mark would escape a raw tag. */
    function ital(html) { return html.replace(/~([^~]+)~/g, '<i>$1</i>'); }
    var box = h('section', 'curio' + (spec.shape === 'tall' ? ' curio--tall' : ''));
    box.appendChild(h('div', 'curio__head',
      '<span class="curio__pill">Did you know?</span>' +
      '<span class="curio__fence">Not in 0610 or the IB guide. Nothing here is examined.</span>'));
    var body = h('div', 'curio__body');
    if (spec.img) {
      var P = W.picture({ img: spec.img, alt: spec.alt || '' });
      var fig = h('figure', 'curio__fig');
      fig.appendChild(P.pic);
      if (spec.credit) fig.appendChild(h('figcaption', 'curio__credit', ital(esc(spec.credit))));
      body.appendChild(fig);
    }
    var txt = h('div', 'curio__text');
    txt.appendChild(h('h4', 'curio__title', esc(spec.title || '')));
    (spec.body || []).forEach(function (t) { txt.appendChild(h('p', 'curio__p', ital(W.mk(t)))); });
    if (spec.source) txt.appendChild(h('p', 'curio__src', ital(esc(spec.source))));
    body.appendChild(txt);
    box.appendChild(body);
    return box;
  }

  /* ---------- labelphoto: a real photograph, labelled the way a drawing is ----------
     Labels sit in the margins at their part's own height, each on a leader RULED HORIZONTALLY, so no
     two leaders can cross. Parts can be ringed, and neighbouring labels can be bracketed into the
     structure they make up (anther + filament = stamen). Positions are percentages of the picture;
     ring sizes are in the picture's own pixels, so a rotated ring keeps its shape. The leaders and
     rings carry a halo, because a photograph is dark in one place and pale in the next. */
  function labelphoto(spec) {
    var f = h('figure', 'photo lp');
    var wh = (global.PHOTO_SIZE || {})[spec.img + '-900.jpg'] || [400, 400];
    var IW = wh[0], IH = wh[1], PAD = Math.round(IW * 0.40), VW = IW + PAD * 2;
    var pins = spec.pins || [], at = {};
    var s = '<svg viewBox="0 0 ' + VW + ' ' + IH + '" class="lp__svg" role="img" aria-label="' + esc(spec.alt || '') + '">' +
      '<image href="assets/photos/' + spec.img + '-900.jpg" x="' + PAD + '" y="0" width="' + IW + '" height="' + IH + '"/>';
    (spec.rings || []).forEach(function (r) {
      var cx = PAD + r[0] / 100 * IW, cy = r[1] / 100 * IH, tr = r[4] ? ' transform="rotate(' + r[4] + ' ' + cx.toFixed(1) + ' ' + cy.toFixed(1) + ')"' : '';
      var e = ' cx="' + cx.toFixed(1) + '" cy="' + cy.toFixed(1) + '" rx="' + r[2] + '" ry="' + r[3] + '"' + tr;
      s += '<ellipse class="lp__ringhalo"' + e + '/><ellipse class="lp__ring"' + e + '/>';
    });
    function textW(t) { return t.length * 7.4; }
    /* where a horizontal line at height y meets a ring, on the side facing the label — so a label can
       name the WHOLE ringed structure (the leader stops on its outline) while another names what is
       inside it (the leader goes in) */
    function ringEdgeX(r, y, right) {
      var cx = PAD + r[0] / 100 * IW, cy = r[1] / 100 * IH, rx = r[2], ry = r[3], th = (r[4] || 0) * Math.PI / 180;
      var A = rx * Math.sin(th), B = ry * Math.cos(th), R = Math.sqrt(A * A + B * B), d = y - cy;
      if (!R || Math.abs(d) > R) return null;
      var al = Math.atan2(A, B), s1 = Math.asin(d / R);
      var xs = [s1 - al, Math.PI - s1 - al].map(function (t) { return cx + rx * Math.cos(t) * Math.cos(th) - ry * Math.sin(t) * Math.sin(th); });
      return right ? Math.max(xs[0], xs[1]) : Math.min(xs[0], xs[1]);
    }
    pins.forEach(function (q) {
      var x = PAD + q[0] / 100 * IW, y = q[1] / 100 * IH, right = q[3] !== 'left';
      if (q[4] && q[4].edgeOf != null && spec.rings && spec.rings[q[4].edgeOf]) {
        var ex = ringEdgeX(spec.rings[q[4].edgeOf], y, right); if (ex != null) x = ex;
      }
      var end = right ? PAD + IW + 5 : PAD - 5, tx = right ? PAD + IW + 11 : PAD - 11;
      at[q[2]] = { y: y, right: right, w: textW(q[2]) };
      var ln = ' x1="' + x.toFixed(1) + '" y1="' + y.toFixed(1) + '" x2="' + end + '" y2="' + y.toFixed(1) + '"';
      s += '<line class="lp__leadhalo"' + ln + '/><line class="lp__lead"' + ln + '/>' +
           '<circle class="lp__dot" cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="3"/>' +
           '<text class="lp__lab" x="' + tx + '" y="' + (y + 4.5).toFixed(1) + '"' + (right ? '' : ' text-anchor="end"') + '>' + esc(q[2]) + '</text>';
    });
    /* a bracket joins two labels that sit next to each other on the same side, and names what they make up */
    (spec.groups || []).forEach(function (g) {
      var a = at[g[1]], b = at[g[2]]; if (!a || !b) return;
      var y1 = Math.min(a.y, b.y) - 8, y2 = Math.max(a.y, b.y) + 8, w = Math.max(a.w, b.w), mid = (y1 + y2) / 2;
      if (a.right) {
        var xb = PAD + IW + 11 + w + 9;
        s += '<path class="lp__brace" d="M' + (xb - 6).toFixed(1) + ' ' + y1.toFixed(1) + 'H' + xb.toFixed(1) + 'V' + y2.toFixed(1) + 'H' + (xb - 6).toFixed(1) + '"/>' +
             '<text class="lp__group" x="' + (xb + 8).toFixed(1) + '" y="' + (mid + 4.5).toFixed(1) + '">' + esc(g[3]) + '</text>';
      } else {
        var xl = PAD - 11 - w - 9;
        s += '<path class="lp__brace" d="M' + (xl + 6).toFixed(1) + ' ' + y1.toFixed(1) + 'H' + xl.toFixed(1) + 'V' + y2.toFixed(1) + 'H' + (xl + 6).toFixed(1) + '"/>' +
             '<text class="lp__group" x="' + (xl - 8).toFixed(1) + '" y="' + (mid + 4.5).toFixed(1) + '" text-anchor="end">' + esc(g[3]) + '</text>';
      }
    });
    f.innerHTML = s + '</svg><figcaption>' + (spec.cap ? mk(spec.cap) + ' · ' : '') + esc(spec.credit || '') + '</figcaption>';
    return f;
  }


  /* ---------- the lab's own drawings, by name: for a question to show, or a word to open ---------- */
  var DIAGRAMS = {};
  function svgFor(name) {
    var k = String(name || '').split('#')[0];
    var f = DIAGRAMS[k];
    return f ? f(String(name).split('#')[1] || '') : '';
  }

  var MAKERS = [['video', video], ['watch', watch], ['curio', curio], ['labelphoto', labelphoto]];
  global.CircLearn = { add: function (name, fn) { MAKERS.push([name, fn]); W.register(name, fn); }, diagram: function (name, fn) { DIAGRAMS[name] = fn; },
                       h: h, esc: esc, mk: mk, head: head, svgEl: svgEl };
  MAKERS.forEach(function (m) { W.register(m[0], m[1]); });
  global.Learn = { widget: W.widget, reap: W.reap, svgFor: svgFor, DIAGRAMS: DIAGRAMS };
})(window);
