/* ============================================================
   app.js — wiring: body ⇄ panel ⇄ rail, progress, saving.
   The Plants Lab's app.js with the plate swapped: the plant is replaced by the body and its
   circulation (js/plate.js, drawing js/circ-draw.js and js/heart-art.js), and the Learn tab
   carries this lab's widgets (js/learn.js) between its sentences.
   ============================================================ */
(function () {
  'use strict';

  var LAB = 'circulation-lab';
  var STORE = LAB + '.v1';
  var ORDER = [];
  var S = {};                       /* stations by id */
  var OWNER = {};                   /* a part of the body -> the station that teaches it */

  var progress = load();
  var current = null;
  var tab = 'learn';

  /* ---------- progress ---------- */
  function load() {
    try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch (e) { return {}; }
  }
  var saveBroken = false;
  function save() {
    if (typeof queueSave === 'function') queueSave();   /* the records get it a couple of minutes later */
    try { localStorage.setItem(STORE, JSON.stringify(progress)); }
    catch (e) {
      /* Private browsing, or a school profile with site data blocked. Said once per session. */
      if (!saveBroken) { saveBroken = true; toast('This browser cannot keep your work between visits — sign in, so it goes to Dr Mompel’s records as you work, and do not reload.'); }
    }
  }
  function p(id) {
    if (!progress[id]) progress[id] = { done:{}, tried:{}, sig:(S[id] ? stationSig(S[id]) : '') };
    return progress[id];
  }
  /* A record is filed by the question's position, and a changed question set would credit
     a reader for a question they never saw: the record carries a fingerprint of the set. */
  /* FNV-1a, base 36. Small, stable, and it only has to notice a change, not resist an attack. */
  function hash36(s) {
    var h = 0x811c9dc5;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = (h + ((h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24))) >>> 0;
    }
    return h.toString(36);
  }
  /* The fingerprint covers the number of questions AND everything a student reads in each one,
     in order — the prompt, the options, the items, the labels. Counting types alone was not
     enough: rewording a question, or reordering its options, left the fingerprint unchanged, so
     a student kept a tick against a question that had changed underneath them.

     Deliberately NOT the answer key `k`. It is salted afresh on every build, so hashing it
     would wipe every record on every deploy whether anything changed or not. Verified: across
     two rebuilds with no content change, every station's fingerprint is identical in both labs. */
  function stationSig(st) {
    var acts = st.activities || [];
    var body = acts.map(function (a) {
      var c = {};
      /* `k` holds the answer hashes and `anyOrder` is marking policy — neither is something a
         student reads, and both change when marking is made more generous. Leaving them out
         keeps a fixed question fingerprinted the same, so widening what an answer may say never
         wipes anybody's ticks, and snapshots already saved in the spreadsheet still restore. */
      Object.keys(a).sort().forEach(function (k) { if (k !== 'k' && k !== 'anyOrder') c[k] = a[k]; });
      return JSON.stringify(c);
    }).join('|');
    return acts.length + ':' + hash36(body);
  }
  function reconcile() {
    var dropped = 0;
    Object.keys(progress).forEach(function (id) {
      var st = S[id];
      if (!st) { delete progress[id]; dropped++; return; }
      var sig = stationSig(st);
      if (progress[id].sig && progress[id].sig !== sig) {
        progress[id] = { done:{}, tried:{}, sig:sig }; dropped++;
      } else progress[id].sig = sig;
    });
    if (dropped) save();
    return dropped;
  }
  function stationScore(id) {
    var st = S[id];
    if (!st) return { done:0, total:0, tried:0 };
    var rec = p(id), total = (st.activities || []).length, n = 0, t = 0;
    Object.keys(rec.done).forEach(function (k) { if (rec.done[k] && +k < total) n++; });
    Object.keys(rec.tried).forEach(function (k) { if (rec.tried[k] && +k < total) t++; });
    return { done:n, total:total, tried:t };
  }
  function totals() {
    var done = 0, total = 0, tried = 0, checks = 0, first1 = 0, from = 0;
    ORDER.forEach(function (id) {
      var s = stationScore(id); done += s.done; total += s.total; tried += s.tried;
      var rec = p(id);
      Object.keys(rec.per || {}).forEach(function (k) { if (+k < s.total) checks += rec.per[k]; });
      Object.keys(rec.one || {}).forEach(function (k) { if (+k < s.total && rec.done[k]) first1++; });
      if (rec.first && (!from || rec.first < from)) from = rec.first;
    });
    return { done:done, total:total, tried:tried, checks:checks, first1:first1, from:from };
  }

  /* ---------- header ---------- */
  function paintHeader() {
    var t = totals(), pct = t.total ? t.done / t.total : 0, C = 2 * Math.PI * 11;
    paintSaveChip();
    document.getElementById('ringFg').setAttribute('stroke-dasharray', (C * pct).toFixed(1) + ' ' + C.toFixed(1));
    document.getElementById('qDone').textContent = t.done;
    document.getElementById('qTotal').textContent = t.total;
    document.getElementById('stDone').textContent = ORDER.filter(function (id) { var s = stationScore(id); return s.total && s.done === s.total; }).length;
    document.getElementById('stTotal').textContent = ORDER.length;
  }

  /* ---------- the rail ---------- */
  function paintRail() {
    var track = document.getElementById('railTrack');
    track.innerHTML = '';
    ORDER.forEach(function (id, i) {
      var st = S[id]; if (!st) return;
      var sc = stationScore(id), full = sc.total && sc.done === sc.total;
      var b = document.createElement('button');
      b.className = 'rstep' + (full ? ' done' : '');
      b.setAttribute('aria-current', id === current ? 'true' : 'false');
      b.title = st.name + ' — ' + sc.done + ' of ' + sc.total + ' questions answered';
      var n = document.createElement('span'); n.className = 'rstep__n'; n.textContent = full ? '✓' : (i + 1);
      var lab = document.createElement('span'); lab.textContent = st.name;
      var bar = document.createElement('span'); bar.className = 'rstep__bar';
      var fill = document.createElement('i'); fill.style.width = (sc.total ? (sc.done / sc.total) * 100 : 0) + '%';
      bar.appendChild(fill);
      b.appendChild(n); b.appendChild(lab); b.appendChild(bar);
      b.addEventListener('click', function () { open(id); });
      track.appendChild(b);
    });
    var cur = track.querySelector('[aria-current="true"]');
    if (cur) cur.scrollIntoView({ block:'nearest', inline:'center', behavior:'smooth' });
  }

  /* ---------- panel ---------- */
  /* the other number of a term, when the glossary gives one: stoma → stomata, microvilli → microvillus */
  function numberOf(w) { return w && w.plural ? ' <small class="num" title="The plural">plural: ' + esc(w.plural) + '</small>' : w && w.singular ? ' <small class="num" title="The singular">singular: ' + esc(w.singular) + '</small>' : ''; }
  function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
  function icon() {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="#14572B" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M12 20.5C6.5 16.4 3.5 13.2 3.5 9.4C3.5 6.8 5.5 4.8 8 4.8C9.8 4.8 11.2 5.8 12 7.2C12.8 5.8 14.2 4.8 16 4.8C18.5 4.8 20.5 6.8 20.5 9.4C20.5 13.2 17.5 16.4 12 20.5Z" fill="#F5B7AE"/>' +
      '<path d="M5.5 11.5H9L10.5 8.5L13 14L14.5 11.5H18.5"/></svg>';
  }

  function paintPanel() {
    var st = S[current]; if (!st) return;
    var host = document.getElementById('panelInner'), sc = stationScore(current);
    parkSim();                                      /* out of the panel before it is emptied */
    host.innerHTML = '';
    if (window.Learn && Learn.reap) Learn.reap();   /* the old station's widgets are detached now */

    var head = document.createElement('div');
    head.className = 'st-head';
    head.innerHTML = '<div class="st-head__ic">' + icon() + '</div>' +
      '<div><h2 class="st-title">' + esc(st.name) + '</h2><div class="st-sub">' + esc(st.subtitle || '') + '</div></div>';
    host.appendChild(head);

    var chips = document.createElement('div');
    chips.className = 'chips';
    (st.tags || []).forEach(function (tg) {
      var c = document.createElement('span');
      c.className = 'chip chip--' + (tg.cls || 'k');
      c.textContent = tg.text;
      chips.appendChild(c);
    });
    host.appendChild(chips);

    var tabs = document.createElement('div');
    tabs.className = 'tabs'; tabs.setAttribute('role', 'tablist');
    [['learn','Learn',''],['do','Practise', sc.done + '/' + sc.total]].forEach(function (t) {
      var b = document.createElement('button');
      b.className = 'tab'; b.setAttribute('role', 'tab');
      b.setAttribute('aria-selected', tab === t[0] ? 'true' : 'false');
      b.appendChild(document.createTextNode(t[1]));
      if (t[2]) { var n = document.createElement('span'); n.className = 'tab__n'; n.textContent = t[2]; b.appendChild(n); }
      b.addEventListener('click', function () { tab = t[0]; paintPanel(); });
      tabs.appendChild(b);
    });
    host.appendChild(tabs);

    var pane = document.createElement('div');
    pane.className = 'tabpane';
    host.appendChild(pane);

    if (tab === 'learn' && window.Terms && !(st.plate && st.plate.bench)) {   /* the bench station has no body to colour: no legend there */
      var key = document.createElement('div');
      key.className = 'keybar';
      key.innerHTML = window.Terms.legend();
      pane.appendChild(key);
    }
    /* The bench has to be showing BEFORE the pane is built. A bench widget's mount() reads
       #benchHost.hidden to decide whether its apparatus stands in the column or stays inside the
       widget, and coming back from Practise the bench is still hidden from when the simulation
       covered the column. Plate.showBench only unhides it — showStation would empty it. */
    /* Tell the glossary which pictures this station is about to show, so a magnifier never
       opens the photograph the reader is already looking at. */
    if (window.Terms && window.Terms.setShown) {
      var onPage = {};
      ((st.learn && st.learn.interact) || []).forEach(function (w) {
        var im = w.img || (w.photo && w.photo.img); if (im) onPage[/\./.test(im) ? im : im + '-900.jpg'] = 1;
      });
      (st.activities || []).forEach(function (a2) { if (a2.img) onPage[/\./.test(a2.img) ? a2.img : a2.img + '-900.jpg'] = 1; });
      window.Terms.setShown(onPage);
    }
    if (tab === 'learn' && st.plate && st.plate.bench && window.Plate && window.Plate.showBench) window.Plate.showBench(true);
    if (tab === 'learn') paintLearn(pane, st); else paintDo(pane, st);
    paintSim(st, pane);
    var sc = panelScroller();
    if (sc) { var prev = sc.style.scrollBehavior; sc.style.scrollBehavior = 'auto'; sc.scrollTop = 0; sc.style.scrollBehavior = prev || ''; }
  }

  var WIDGET_CTX = {
    focus: function (gid) { if (window.Plate) window.Plate.focus(gid); },
    home: function () { if (window.Plate) window.Plate.home(); }
  };

  /* ---------- a simulation standing beside the questions ----------
     A question that can only be answered by trying something is worth more than one that can be
     answered by remembering; but a student will not walk back to Learn, scroll to the widget, try
     it, and walk back. So on the Practise tab the station's simulations can stand where the body
     is, and the questions are answered beside them.

     ONE NODE per (station, widget), created once and RE-PARENTED — never a second live copy, and
     never rebuilt on a repaint. Both rules are load-bearing. The Plants Lab's potometer keeps its model in a
     module-level PO_STATE, so two copies would share one model and neither would repaint when the
     other wrote. And paintPanel runs on the tab bar, on both glossary known-word toggles, on a
     sync and on Reset: rebuilding there would throw away a half-finished experiment because the
     student looked up a word. */
  var SIM_NOT = { photo: 1, figure: 1, video: 1, watch: 1, finder: 1, table: 1, curio: 1, sound: 1, tasklist: 1, reportlinks: 1, labelphoto: 1 };   /* pictures, recordings, stories and lists are not simulations to try beside the questions */
  var simView = null, simOpen = {}, simPick = {},
      simWide = window.matchMedia ? window.matchMedia('(min-width: 1001px)') : { matches: true, addEventListener: function () {} };

  function simsOf(st) {
    return ((st.learn && st.learn.interact) || []).filter(function (w) {
      return w && !SIM_NOT[w.type] && window.Widgets && window.Widgets.has(w.type);
    });
  }
  function simName(w) {
    return w.simLabel || w.title || ({ equation: 'The equation', diagram: 'The diagram' }[w.type]) || 'The simulation';
  }
  function simHostEl() { return document.getElementById('simHost'); }

  function simSlot(pane) {
    var el = pane.querySelector('.sim__slot');
    if (!el) { el = document.createElement('div'); el.className = 'sim__slot'; pane.insertBefore(el, pane.firstChild); }
    return el;
  }
  /* the chooser is rebuilt; the widget node beside it is not */
  function simChooser(container, st, sims, idx) {
    var old = container.querySelector('.sim__pick');
    if (old) old.parentNode.removeChild(old);
    if (sims.length < 2) return;
    var row = document.createElement('div'); row.className = 'sim__pick';
    sims.forEach(function (w, i) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'sim__pickb' + (i === idx ? ' is-on' : '');
      b.textContent = simName(w);
      b.addEventListener('click', function () { simPick[st.id] = i; paintPanel(); });
      row.appendChild(b);
    });
    container.insertBefore(row, container.firstChild);
  }

  var simWired = false;
  function wireSim() {
    if (simWired) return; simWired = true;
    var btn = document.getElementById('simBtn');
    if (btn) btn.addEventListener('click', function () {
      simOpen[current] = !simOpen[current];
      paintPanel();
      var h = simHostEl(), hd = h && h.querySelector('.widget__h');
      if (simOpen[current] && hd) { hd.setAttribute('tabindex', '-1'); hd.focus(); }
      else { var b2 = document.getElementById('simBtn'); if (b2) b2.focus(); }
    });
    if (simWide.addEventListener) simWide.addEventListener('change', function () { paintPanel(); });
  }

  function paintSim(st, pane) {
    wireSim();
    var btn = document.getElementById('simBtn'), host = simHostEl();
    var sims = simsOf(st), onBench = !!(st.plate && st.plate.bench);

    /* On a bench station there is no body to go back to, and switching to Practise used to
       destroy the Plants Lab potometer's controls while its apparatus and readout survived orphaned in
       #benchHost — a student left looking at a bench they could not drive. So there the
       simulation is simply always open, and no button is offered. */
    if (tab === 'do' && onBench && sims.length) { simOpen[st.id] = true; if (btn) btn.hidden = true; }
    else if (tab !== 'do' || !sims.length) {
      dropSim();
      if (btn) btn.hidden = true;
      /* A widget marked onStage keeps its drawing in the column and shows it only while the
         reader is level with it. Start from the body and let the widget decide; the heavy
         showSim would rebuild the whole station, which the scroll must never do.

         A BENCH station must not take showSim either, and for a sharper reason: showSim(false)
         puts the body back by re-running showStation, and showStation empties #benchHost. On
         the bench station's Learn tab the widget has just mounted its apparatus there, so that call
         deleted the bench a moment after it was built and left the column blank. There is no
         body to put back on a bench station; all that is wanted is the simulation layer off. */
      var staged = sims.some(function (w) { return w.onStage; });
      if (onBench || (tab === 'learn' && staged && simWide.matches)) {
        if (window.Plate && window.Plate.stageSim) window.Plate.stageSim(false);
      } else if (window.Plate && window.Plate.showSim) window.Plate.showSim(false);
      return;
    }
    if (simPick[st.id] == null) simPick[st.id] = 0;
    var idx = Math.min(simPick[st.id], sims.length - 1), open = !!simOpen[st.id];

    if (btn && !onBench) {
      btn.hidden = false;
      btn.textContent = open ? '▲ Back to the body'
        : (sims.length > 1 ? '⚗ Try the ' + sims.length + ' simulations' : '⚗ ' + simName(sims[0]));
      btn.title = open ? 'Put the body back' : 'Open it beside the questions and try it while you answer';
      btn.setAttribute('aria-pressed', open ? 'true' : 'false');
    }
    if (!open) {
      dropSim();
      if (window.Plate && window.Plate.showSim) window.Plate.showSim(false);
      return;
    }

    var key = st.id + ':' + idx;
    if (!simView || simView.key !== key) {
      dropSim();
      var node = buildSim(st, idx);
      if (!node) { if (window.Plate && window.Plate.showSim) window.Plate.showSim(false); return; }
      simView = { key: key, node: node };
    }
    /* below 1001px the body column is a 42vh strip — a bench does not fit in it, so the same
       single node mounts at the top of the questions instead. The query is the one a
       bench widget uses. */
    var wide = simWide.matches, target = wide ? host : simSlot(pane);
    /* a drawing left behind in the column by a Learn-tab widget that has since been destroyed */
    if (wide) Array.prototype.slice.call(host.children).forEach(function (c) {
      if (c !== simView.node && !c.classList.contains('sim__pick')) host.removeChild(c);
    });
    simChooser(target, st, sims, idx);
    if (simView.node.parentNode !== target) target.appendChild(simView.node);
    if (typeof simView.node.__onMove === 'function') simView.node.__onMove();
    if (window.Plate && window.Plate.showSim) window.Plate.showSim(wide);
  }

  /* park it somewhere the panel wipe cannot reach, before the wipe */
  function parkSim() {
    var host = simHostEl();
    if (simView && host && simView.node.parentNode !== host) host.appendChild(simView.node);
  }
  function dropSim() {
    if (!simView) return;
    /* pondweed and auxin both run intervals that only __onReset clears; dropping the node
       without this leaks a timer for the life of the page */
    if (typeof simView.node.__onReset === 'function') simView.node.__onReset();
    if (simView.node.parentNode) simView.node.parentNode.removeChild(simView.node);
    simView = null;
  }
  function buildSim(st, idx) {
    var w = simsOf(st)[idx]; if (!w) return null;
    /* quiet, because wireTermClicks is bound to #panel: a marked term rendered in the body
       column would look alive and be dead on click */
    if (window.Terms) window.Terms.setQuiet(true);
    var node = window.Learn.widget(w, WIDGET_CTX);
    if (window.Terms) window.Terms.setQuiet(false);
    return node;
  }

  function paintLearn(pane, st) {
    if (window.Terms) window.Terms.setStation(st.id);
    WIDGET_CTX.station = st.id;      /* a widget that keeps state needs a name that survives a repaint */
    var M = window.Terms ? window.Terms.mark : esc;
    var widgets = (st.learn && st.learn.interact) || [];

    var card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = '<div class="card__h">What you need to know</div>';
    var list = document.createElement('ul');
    list.className = 'exam-list';
    card.appendChild(list);
    var partName = null;

    (st.learn.exam || []).forEach(function (b, i) {
      /* sentences that belong to a named part — "Setting it up" — sit together in their own block */
      var part = (typeof b === 'object' && b.part) || null;
      if (part !== partName) {
        partName = part;
        list = document.createElement('ul'); list.className = 'exam-list';
        if (part) { var wrap = document.createElement('div'); wrap.className = 'exam-part'; wrap.innerHTML = '<div class="exam-part__h">' + esc(part) + '</div>'; wrap.appendChild(list); card.appendChild(wrap); }
        else card.appendChild(list);
      }
      var li = document.createElement('li');
      var txt = typeof b === 'string' ? b : b.text;
      /* visit every text node under an element, collected first so replacing one does not
         disturb the walk */
      function walkText(root, fn) {
        var out = [], w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null, false), nd;
        while ((nd = w.nextNode())) out.push(nd);
        out.forEach(fn);
      }
      var badge = '';
      if (typeof b === 'object' && b.sup) badge = '<span class="sup tip" tabindex="0" data-tip="Supplement — examined on Paper 4 (Extended) only. Core candidates can skip it.">S</span>';
      if (typeof b === 'object' && b.ext) badge = '<span class="sup sup--ext tip" tabindex="0" data-tip="Extension — not in the 2026–28 syllabus. Here to make sense of the rest; you will not be asked to write it.">extension</span>';
      li.innerHTML = badge + M(txt);
      /* the part of the body this sentence answers. Clicking that part on the drawing opens the
         station and lands here (openGroup looks for exactly this attribute). */
      if (typeof b === 'object' && b.group) li.setAttribute('data-group', b.group);
      /* A small picture beside the sentence, with the words running round it. One idea each and
         about the size of a postage stamp: a reader takes a picture in faster than a clause, and
         a big diagram in the middle of a paragraph stops the reading instead of helping it. */
      if (typeof b === 'object' && b.fig && window.FIGS && window.FIGS[b.fig]) {
        var fg = document.createElement('figure');
        fg.className = 'minifig';
        fg.innerHTML = window.FIGS[b.fig];
        li.insertBefore(fg, li.firstChild);
      }
      /* A sentence that names something shown further down — "that is demonstration 1" — should
         take you to it. The phrase is already marked by _..._, so the mark becomes the link and
         nothing new appears in the text. */
      /* a numbered run of facts belongs on its own rows, not strung through the sentence:
         it is what the mark scheme is counting, so it is what the eye should be able to count */
      if (typeof b === 'object' && b.list) {
        var ol = document.createElement('ol'); ol.className = 'exam-steps';
        b.list.forEach(function (x) { var s2 = document.createElement('li'); s2.innerHTML = M(x); ol.appendChild(s2); });
        li.appendChild(ol);
      }
      /* Run AFTER the nested list is in place, or a (1) inside one of the numbered facts is
         still plain text when the walk goes past. */
      if (typeof b === 'object' && b.fig && window.FIGS && window.FIGS[b.fig]) {
        /* (1) in the sentence becomes the same numbered token that is pinned on the drawing, so
           the word and the part it names are tied together and neither has to repeat the other.
           Only inside a bullet that HAS a figure, so an ordinary bracketed number elsewhere in
           the lab is left alone. */
        walkText(li, function (node) {
          if (!/\(\d\)/.test(node.data)) return;
          var frag = document.createDocumentFragment(), rest = node.data, m;
          while ((m = /\((\d)\)/.exec(rest))) {
            if (m.index) frag.appendChild(document.createTextNode(rest.slice(0, m.index)));
            var sp = document.createElement('span');
            sp.className = 'figref'; sp.textContent = m[1];
            frag.appendChild(sp);
            rest = rest.slice(m.index + m[0].length);
          }
          if (rest) frag.appendChild(document.createTextNode(rest));
          node.parentNode.replaceChild(frag, node);
        });
      }
      /* a phrase that opens a short aside, for a reader who wants to know why */
      if (typeof b === 'object' && b.explain) {
        Array.prototype.forEach.call(li.querySelectorAll('u.syl-u'), function (u) {
          var e = b.explain[u.textContent.trim().toLowerCase()];
          if (!e) return;
          var j = document.createElement('button');
          j.type = 'button'; j.className = 'xplain';
          j.innerHTML = u.innerHTML + '<span class="xplain__a" aria-hidden="true">?</span>';
          j.addEventListener('click', function () { openExplain(e); });
          u.parentNode.replaceChild(j, u);
        });
      }
      if (typeof b === 'object' && b.goto) {
        Array.prototype.forEach.call(li.querySelectorAll('u.syl-u'), function (u) {
          var to = b.goto[u.textContent.trim().toLowerCase()];
          if (!to) return;
          var j = document.createElement('button');
          j.type = 'button'; j.className = 'goto'; j.setAttribute('data-goto', to);
          j.title = 'Go to it';
          j.innerHTML = u.innerHTML + '<span class="goto__a" aria-hidden="true">↓</span>';
          u.parentNode.replaceChild(j, u);
        });
      }
      list.appendChild(li);
      /* the thing to press, drag or count sits under the sentence it belongs to */
      widgets.filter(function (w) { return w.after === i; }).forEach(function (w) {
        var el = window.Learn.widget(w, WIDGET_CTX);
        if (el && w.anchor && el.setAttribute) el.setAttribute('data-anchor', w.anchor);
        /* A tall, narrow diagram set under the sentence leaves a column of empty paper beside it.
           Put it FIRST instead and let the sentence close round it — css floats it into the
           margin. Everything else still sits under the sentence it belongs to. */
        if (el && el.classList && el.classList.contains('photo--portrait')) li.insertBefore(el, li.firstChild);
        else li.appendChild(el);
      });
    });
    widgets.filter(function (w) { return w.after == null; }).forEach(function (w) {
      var el = window.Learn.widget(w, WIDGET_CTX);
      if (el && w.anchor && el.setAttribute) el.setAttribute('data-anchor', w.anchor);
      card.appendChild(el);
    });

    if (st.learn && st.learn.golden) {
      var g = document.createElement('div');
      g.className = 'golden';
      /* one mistake is a string; a station with more than one gives a list, one paragraph each */
      var gs = [].concat(st.learn.golden);
      g.innerHTML = '<div class="golden__h">⬤ Check yourself — ' + (gs.length > 1 ? 'the mistakes students make here' : 'the mistake students make here') + '</div>' +
        gs.map(function (para) { return '<p>' + M(para) + '</p>'; }).join('');
      card.appendChild(g);
    }
    if ((st.learn.examFocus || []).length) {
      var ef = document.createElement('div');
      ef.className = 'examfocus';
      ef.innerHTML = '<div class="examfocus__h">In the exam — what to write here</div><ul>' +
        st.learn.examFocus.map(function (b) {
          var tag = typeof b === 'object' && b.tag ? '<b class="examfocus__tag">' + esc(b.tag) + '</b> ' : '';
          return '<li>' + tag + esc(typeof b === 'string' ? b : b.text) + '</li>';
        }).join('') + '</ul>';
      card.appendChild(ef);
    }
    pane.appendChild(card);

    var further = (st.learn && st.learn.further) || [];
    if (further.length) {
      var L = document.createElement('div');
      L.className = 'card later';
      L.innerHTML = '<div class="card__h">Going further — links to other topics, IB, and beyond the syllabus</div>' +
        '<ul class="later__list">' + further.map(function (x) {
          var kind = /^IB/.test(x.ref) ? ' later__ref--ib' : /^(Beyond|Not in)/.test(x.ref) ? ' later__ref--beyond' : '';
          /* an entry may point at something outside the lab. It opens in a new tab, and the
             link says so, because a student halfway through a station should not lose it. */
          var body = M(x.text) + (x.url ? ' <a class="later__out" href="' + esc(x.url) + '" target="_blank" rel="noopener">' + esc(x.link || 'Watch it') + ' ↗</a>' : '');
          return '<li><span class="later__ref' + kind + '">' + esc(x.ref) + '</span>' + body + '</li>';
        }).join('') + '</ul>';
      pane.appendChild(L);
    }

    if ((st.keywords || []).length) {
      if (window.Terms) window.Terms.setQuiet(true);
      var k = document.createElement('div');
      k.className = 'card';
      k.innerHTML = '<div class="card__h">Key words</div>' +
        '<p class="kw-hint">Say the definition to yourself first, then turn the card.</p>' +
        '<dl class="kw-grid">' +
        st.keywords.map(function (w) {
          var g2 = (window.GLOSSARY || []).filter(function (e) { return e.term.toLowerCase() === w.term.toLowerCase(); })[0] || {};
          var tag = g2.ext ? ' <span class="tier tier--ext" title="Worth knowing, but 0610 will not ask you to name it">not asked in 0610</span>'
                  : g2.sup ? ' <span class="tier tier--sup" title="Supplement — Paper 4 (Extended) only">Supplement</span>' : '';
          return '<div class="kw kw--flip" role="button" tabindex="0" aria-expanded="false">' +
                 '<dt>' + M(w.term) + numberOf(g2) + tag + '</dt><p class="kw__ask">Do you know it? Tap to check</p><dd>' + M(w.def) + '</dd></div>';
        }).join('') + '</dl>';
      Array.prototype.forEach.call(k.querySelectorAll('.kw--flip'), function (c) {
        var turn = function () { var o = c.classList.toggle('is-open'); c.setAttribute('aria-expanded', o ? 'true' : 'false'); };
        c.addEventListener('click', function (e) { if (e.target.closest('[data-peek],[data-jump],[data-gloss],[data-stat]')) return; turn(); });
        c.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); turn(); } });
      });
      pane.appendChild(k);
      if (window.Terms) window.Terms.setQuiet(false);
    }
  }

  /* click any image to see it full size */
  window.LabLightbox = function (src, cap, kind, credit) { lightbox(src, cap + (credit ? ' <span class="lens__credit">' + credit + '</span>' : ''), kind); };
  function lightbox(src, cap, kind) {
    var lb = document.getElementById('lightbox');
    var st = lb.querySelector('.lb__stage');
    st.innerHTML = '';
    var im = new Image(); im.src = src; im.alt = '';
    st.appendChild(im);
    lb.querySelector('.lb__cap').innerHTML = '<span class="kindtag">' + esc(kind) + '</span> ' + cap;
    lb.hidden = false;
  }

  function paintDo(pane, st) {
    (st.activities || []).forEach(function (a, i) {
      var card = window.Engine.render(a, i, st.id + ':' + i);
      if (p(st.id).done[i]) {
        var tick = document.createElement('span');
        tick.className = 'verdict ok'; tick.textContent = '✓ answered correctly earlier'; tick.style.marginLeft = 'auto';
        var top = card.querySelector('.act__top');
        if (top) top.appendChild(tick);
      }
      card.addEventListener('result', function (e) {
        if (!e.detail) return;
        var rec = p(st.id);
        rec.per = rec.per || {};
        rec.per[i] = (rec.per[i] || 0) + 1;
        if (!rec.first) rec.first = Date.now();
        rec.last = Date.now();
        if (e.detail.correct && !rec.done[i] && rec.per[i] === 1) { rec.one = rec.one || {}; rec.one[i] = true; }
        rec.tried[i] = true;
        if (e.detail.correct) rec.done[i] = true;
        save(); paintHeader(); paintRail(); refreshTabCount();
        var s = stationScore(st.id);
        if (e.detail.correct && s.done === s.total) toast('Station complete: ' + st.name);
      });
      pane.appendChild(card);
    });

    var nav = document.createElement('div');
    nav.className = 'act__foot'; nav.style.justifyContent = 'space-between';
    var i = ORDER.indexOf(st.id);
    if (i > 0) {
      var prev = document.createElement('button');
      prev.className = 'btn btn--ghost'; prev.textContent = '← ' + S[ORDER[i - 1]].name;
      prev.addEventListener('click', function () { open(ORDER[i - 1]); });
      nav.appendChild(prev);
    }
    if (i < ORDER.length - 1) {
      var next = document.createElement('button');
      next.className = 'btn'; next.textContent = 'Next: ' + S[ORDER[i + 1]].name + ' →';
      next.addEventListener('click', function () { open(ORDER[i + 1]); });
      nav.appendChild(next);
    }
    pane.appendChild(nav);
  }
  function refreshTabCount() {
    var sc = stationScore(current);
    var n = document.querySelector('.tabs .tab:last-child .tab__n');
    if (n) n.textContent = sc.done + '/' + sc.total;
  }

  /* ---------- open a station, or a group on the tree ---------- */
  function open(id, focusTerm, cameFrom) {
    if (!S[id]) return;
    current = id;
    tab = 'learn';
    p(id).opened = true;
    save();
    if (window.Plate) window.Plate.showStation(S[id]);
    paintPanel(); paintRail();
    if (focusTerm) focusOnTerm(focusTerm, cameFrom);
    if (location.hash.slice(1) !== id) history.replaceState(null, '', '#' + id);
  }
  /* ---------- landing in the right place ----------
     Following a word to another station used to CENTRE the paragraph it landed on, so on any
     paragraph taller than half the panel the reader arrived in the middle of it and had to
     scroll back up to find where it began. It now puts the START of the block just below the
     top of the panel.

     Two things have to be measured rather than assumed. The tab bar is position:sticky at
     top:0 inside the panel, so anything scrolled to the panel's top edge lands underneath it;
     and its height is not the same on a laptop, an iPad and a phone. And a picture above the
     target can finish loading just after the scroll and push everything down, so the position
     is re-applied on the next frame and once more a moment later. */
  /* Which box actually scrolls. Below 1000px the panel is overflow:visible and .stage takes
     over the scrolling, so scrolling #panel there moves nothing at all — which is why a jump
     did nothing on an iPad held upright or on a phone. Never assume; walk up and find it. */
  function scrollerFor(el) {
    /* A box that scrolls but is not full yet still owns the scrolling. Right after a station is
       painted its widgets and pictures have no height, so the panel briefly looks short — take it
       anyway, or a click on the body scrolls the window, which does not move, and the reader is
       left at the top of a station they asked to be shown the middle of. */
    var loose = null;
    for (var n = el.parentNode; n && n.nodeType === 1 && n !== document.body; n = n.parentNode) {
      var oy = window.getComputedStyle(n).overflowY;
      if (oy !== 'auto' && oy !== 'scroll') continue;
      if (n.scrollHeight > n.clientHeight + 4) return n;
      if (!loose) loose = n;
    }
    return loose || document.scrollingElement || document.documentElement;
  }
  /* The tab bar sticks to the top of that same box, so the first line a reader can actually
     read starts below it, not at the box's top edge. */
  function stickyInset(scroller) {
    /* on a phone the plate is pinned above the notes, so the first readable line starts under it */
    var inset = 0, plate = document.querySelector('.platecol');
    if (plate && scroller.contains(plate) && window.getComputedStyle(plate).position === 'sticky') inset += Math.round(plate.getBoundingClientRect().height);
    var tabs = document.querySelector('#panelInner .tabs');
    if (!tabs || window.getComputedStyle(tabs).position !== 'sticky') return inset;
    var tr = tabs.getBoundingClientRect(), sr = topOf(scroller);
    return inset + (tr.height && tr.top <= sr + tr.height + 2 ? Math.round(tr.height) : 0);
  }
  function topOf(scroller) {
    return scroller === document.scrollingElement || scroller === document.documentElement
      ? 0 : scroller.getBoundingClientRect().top;
  }
  /* A word can send a reader into a section that is folded shut — the "optimum pH" line lives
     inside a closed <details>, and scrolling to something behind a shut disclosure scrolls to
     nothing the reader can see. Open the way in first. */
  function revealAncestors(target) {
    for (var n = target.parentNode; n && n.nodeType === 1; n = n.parentNode) {
      if (n.tagName === 'DETAILS' && !n.open) n.open = true;
    }
  }
  function placeBlock(target, smooth, gap) {
    revealAncestors(target);
    var sc = scrollerFor(target);
    var inset = stickyInset(sc) + (gap == null ? 14 : gap);
    var prev = sc.style.scrollBehavior;
    sc.style.scrollBehavior = smooth ? 'smooth' : 'auto';
    sc.scrollTop += (target.getBoundingClientRect().top - topOf(sc)) - inset;
    sc.style.scrollBehavior = prev || '';
  }
  /* Re-place on the next frame and again shortly after: a picture above the target often
     finishes loading after the first scroll and pushes the paragraph back down the page. */
  function landOn(target, smooth) {
    placeBlock(target, smooth);
    requestAnimationFrame(function () { placeBlock(target, false); });
    setTimeout(function () { placeBlock(target, false); }, 160);
    /* A widget or a photograph above the target keeps growing after the first scroll — a station
       whose animation is still building can push the sentence a page and a half down. So keep
       re-placing while the page above is still changing height, for up to a second and a half, and
       stop the moment the reader scrolls for themselves. */
    var h0 = -1, mine = -1, t0 = Date.now(), tries = 0;
    (function again() {
      setTimeout(function () {
        if (!target.isConnected) return;
        var sc = scrollerFor(target);                            /* re-asked each time: it can change */
        if (mine >= 0 && Math.abs(sc.scrollTop - mine) > 2) return;   /* the reader has taken over */
        if (sc.scrollHeight !== h0) { h0 = sc.scrollHeight; placeBlock(target, false); }
        mine = sc.scrollTop;
        if (++tries < 14 && Date.now() - t0 < 1600) again();
      }, 110);
    })();
  }
  function panelScroller() {
    var inner = document.getElementById('panelInner');
    return inner ? scrollerFor(inner) : (document.scrollingElement || document.documentElement);
  }
  function toStationTop() { var sc = panelScroller(); if (sc) sc.scrollTop = 0; }

  /* a part clicked on the body opens the station that teaches it, on that part */
  function openGroup(gid) {
    var id = OWNER[gid];
    if (!id) { toast('No station is about that part yet.'); return; }
    var changed = current !== id;
    if (changed || tab !== 'learn') { current = id; tab = 'learn'; p(id).opened = true; save(); if (changed && window.Plate) window.Plate.showStation(S[id]); paintPanel(); paintRail(); }   /* the plate must hear of the new station too: its bend, sap, breathing and hint belong to a station */
    if (window.Plate) window.Plate.focus(gid);
    history.replaceState(null, '', '#' + gid);
    var target = document.querySelector('#panelInner [data-group="' + gid + '"]');
    if (!target) return;
    landOn(target, true);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
  }

  /* Plurals English refuses to make regularly, and which this lab uses constantly. */
  var SAME_WORD = { atria: 'atrium', arteries: 'artery', capillaries: 'capillary', veins: 'vein', valves: 'valve', ventricles: 'ventricle',
    arterioles: 'arteriole', venules: 'venule', lymphocytes: 'lymphocyte', phagocytes: 'phagocyte', platelets: 'platelet', antibodies: 'antibody',
    clots: 'clot', clotted: 'clotting', pumps: 'pump', pumped: 'pump', respire: 'respiration', respires: 'respiration', beats: 'heart rate' };

  /* An element's words, with a space at every child boundary. Read straight off textContent,
     a badge letter in its own <span> glues itself to the first word — "SClassification
     systems" — and a whole-word search then fails on a word that is plainly there. */
  function wordsOf(el) {
    var out = '', w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false), n;
    while ((n = w.nextNode())) out += ' ' + n.nodeValue;
    return out.replace(/\s+/g, ' ').trim();
  }

  function focusOnTerm(term, cameFrom) {
    var low = String(term).toLowerCase().trim();
    var esc = function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); };
    var whole = function (t) { return new RegExp('(?<![A-Za-z0-9-])' + esc(t) + '(?![A-Za-z0-9-])', 'i'); };
    var starts = function (t) { return new RegExp('(?<![A-Za-z0-9-])' + esc(t), 'i'); };

    /* Tried in order, most exact first. A reader clicking "ancestry" is sent to the station
       that says "ancestor", "genera" to the one that says "genus", "animal kingdom" to the
       line about animals. Without these, nine words arrived with nothing found and nothing
       highlighted, which leaves a reader at the top of a station wondering why. */
    var tries = [whole(low)];
    if (SAME_WORD[low]) tries.push(whole(SAME_WORD[low]));
    var trimmed = low.replace(/(ies|es|ing|ed|al|ic|um|s|y)$/, '');
    if (trimmed.length >= 4 && trimmed !== low) tries.push(starts(trimmed));
    if (low.length >= 7) tries.push(starts(low.slice(0, 6)));
    if (/ /.test(low)) tries.push(whole(low.split(' ')[0]));

    /* Where to look, best first: the keyword card that defines it, then the lines a student
       reads, then anything else on the station that names it. */
    var ORDER = [
      ['#panelInner .kw', function (el) { return el.querySelector('dt') || el; }],
      ['#panelInner .exam-list > li', null],
      ['#panelInner .later__list li', null],
      ['#panelInner li', null],
      ['#panelInner .st-sub, #panelInner .card p, #panelInner .widget__note, #panelInner p', null],
      ['#panelInner td, #panelInner th', null]
    ];
    function firstIn(sel, re, pick) {
      var els = document.querySelectorAll(sel);
      for (var i = 0; i < els.length; i++) {
        var probe = pick ? pick(els[i]) : els[i];
        if (probe && re.test(wordsOf(probe))) return els[i];
      }
      return null;
    }
    var target = null, t, k;
    for (t = 0; t < tries.length && !target; t++)
      for (k = 0; k < ORDER.length && !target; k++) target = firstIn(ORDER[k][0], tries[t], ORDER[k][1]);
    /* a table cell is not a paragraph: take the whole table, so the headings come with it */
    if (target && /^(TD|TH)$/.test(target.tagName)) target = target.closest('.ctable') || target.closest('table') || target;

    if (!target) {
      /* nothing on this station names it. Start the reader at the beginning rather than
         leaving them wherever the previous scroll happened to be. */
      toStationTop();
      if (cameFrom && S[cameFrom]) showBackChip(cameFrom, term);
      return;
    }
    /* arriving from another station: there is nothing to animate from, so land instantly */
    landOn(target, cameFrom == null);
    target.classList.add('flash');
    setTimeout(function () { target.classList.remove('flash'); }, 2800);
    if (cameFrom && S[cameFrom]) showBackChip(cameFrom, term);
  }

  var backChip = null, whereWeWere = null;
  function jumpTo(el, top) { var prev = el.style.scrollBehavior; el.style.scrollBehavior = 'auto'; el.scrollTop = top; el.style.scrollBehavior = prev || ''; }
  function markWhereWeAre() { var sc = panelScroller(); whereWeWere = { id: current, top: sc ? sc.scrollTop : 0, tab: tab }; }
  function goBackToMark(id) {
    var w = whereWeWere && whereWeWere.id === id ? whereWeWere : null;
    open(id);
    if (!w) return;
    requestAnimationFrame(function () { requestAnimationFrame(function () { var sc = panelScroller(); if (sc) jumpTo(sc, w.top); }); });
  }
  function showBackChip(id, term) {
    if (backChip) backChip.remove();
    var b = document.createElement('button');
    b.className = 'backchip'; b.innerHTML = '← back to ' + esc(S[id].name); b.title = 'You followed "' + term + '" from here';
    b.addEventListener('click', function () { b.remove(); backChip = null; goBackToMark(id); });
    document.getElementById('panel').appendChild(b);
    backChip = b;
    setTimeout(function () { if (backChip === b) b.classList.add('is-fading'); }, 9000);
    setTimeout(function () { if (backChip === b) { b.remove(); backChip = null; } }, 11000);
  }

  /* ---------- whose work this is, and saving it ----------
     The lab is public and stays public: anyone may work through it. Signing in with the school
     Google account is what lets the work be recorded, so Dr Mompel's spreadsheet holds his own
     students and nobody else's. There is nothing to hand in: signed in, the work is sent to the
     records on its own — two minutes after the last check, and at once when the lab is finished
     or the page is left. Work done signed out stays in this browser and goes the moment they
     sign in. The records only ever grow: a save can never take a right answer away.

     One sign-in for the whole site, kept by js/signin.js (shared, from labs-shared/): a student
     who signed in on the Biology Hub or in another lab is already known here, and signing in
     here signs them in there. It is remembered after Google's hour is up — `signIn` is who, and
     haveToken() says whether their token is still good — and renewed without a click when
     Google allows, so a student is not asked again every hour. */
  var SI = window.SignIn || null;
  var CID = (window.LAB_CONFIG || {}).googleClientId || '';
  var signIn = SI ? SI.who() : null;
  var LAB_ID = LAB;
  var afterSignIn = null;
  function mountSignIn(el) {
    return !!(CID && SI && SI.button(el, CID, { theme:'outline', size:'large', text:'signin_with', width: 260, locale:'en-GB' }));
  }
  /* "not you?" and "sign in again" sign out everywhere on the site: the hub, every lab */
  function signOut() {
    if (SI) SI.out(); else { signIn = null; paintSaveChip(); fillSaveDialog(); }
  }
  /* The sign-in changed — in this page, or in another tab of the site. A sign-in that was not
     there before brings their records back, then sends what was done here. */
  function onSignIn(v, here) {
    var was = signIn && signIn.email;
    signIn = v;
    paintSaveChip();
    var dlg = document.getElementById('subDlg');
    if (dlg && !dlg.hidden) fillSaveDialog();
    if (v && SI.fresh(v) && v.email !== was) pullThenPush();
    if (v && here && afterSignIn && SI.fresh(v)) { var next = afterSignIn; afterSignIn = null; next(); }
  }
  if (SI) SI.on(onSignIn);

  function snapshotNow() {
    return (window.LabSync && window.LabSync.snapshot)
      ? window.LabSync.snapshot(progress, S, ORDER, stationSig) : '';
  }
  function syncEnabled() { return !!((window.LAB_CONFIG || {}).submitUrl && window.LabSync); }
  function haveToken() { return !!(SI && SI.fresh(signIn)); }

  /* Ask Google for a sign-in — for the same account, when one is remembered — then come back
     and finish. One Tap can be refused by the browser; `failed` hears why. */
  function signInThen(fn, failed) {
    afterSignIn = fn;
    if (!CID || !SI) { if (failed) failed('unavailable'); return; }
    SI.renew(CID, function (v, why) {
      if (v) { if (afterSignIn === fn) { signIn = v; afterSignIn = null; fn(); } return; }
      if (why === 'signed out') return;
      if (failed) failed(why);
    });
  }

  /* ---------- bringing work back ----------
     What the records hold for this lab, folded in. js/sync.js only ever adds: a question right
     on either machine stays right. */
  function applySnap(snap, quiet) {
    if (!snap) return;
    var res = window.LabSync.merge(progress, snap, S, stationSig);
    if (res.added) { save(); reconcile(); paintHeader(); paintRail(); paintPanel(); refreshTabCount(); }
    if (!quiet || res.added) toast(window.LabSync.say(res));
  }
  function pull(then) {
    if (!syncEnabled() || !haveToken()) { if (then) then(); return; }
    fetch((window.LAB_CONFIG || {}).submitUrl, {
      method:'POST', mode:'cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' },
      body: JSON.stringify({ action:'progress', token: signIn.token })
    })
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (j) { var mine = j && j.ok && j.labs && j.labs[LAB_ID]; applySnap(mine && mine.snap, true); })
      .catch(function () {})
      .then(function () { if (then) then(); });
  }
  /* Signed in: their records first, so nothing here is older than what is there; then whatever
     this browser has that the records do not. */
  function pullThenPush() { pull(function () { queueSave(true); }); }
  if (signIn && syncEnabled()) {
    if (haveToken()) pullThenPush();
    else if (SI && CID) SI.renew(CID, function (v) { if (v) { signIn = v; pullThenPush(); } });
  }

  /* ---------- saving on its own ----------
     Two minutes after the last check, one save carries everything since. Forty students on one
     script is comfortable at that pace; a save that finds the records busy simply goes again a
     minute later, and nothing is lost meanwhile because this browser keeps its own copy. */
  var SAVE_AFTER = 120000, RETRY_AFTER = 60000;
  var saveTimer = null, savePending = false, saving = false, savedAt = null, saveWhy = '', lastSent = '', lastScore = -1, askedAgain = false;
  function queueSave(now) {
    if (!syncEnabled()) return;
    savePending = true;
    paintSaveChip();
    if (now) { clearTimeout(saveTimer); saveTimer = null; flushSave(); return; }
    if (!saveTimer) saveTimer = setTimeout(function () { saveTimer = null; flushSave(); }, SAVE_AFTER);
  }
  function retryLater() {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveTimer = null; flushSave(); }, RETRY_AFTER);
  }
  function payloadNow() {
    var t = totals(), perStation = {};
    ORDER.forEach(function (id) {
      var s = stationScore(id), rec = p(id), c = 0;
      Object.keys(rec.per || {}).forEach(function (k) { if (+k < s.total) c += rec.per[k]; });
      perStation[id] = s.done + '/' + s.total + (c ? ' in ' + c : '');
    });
    var name = signIn ? signIn.name : '';
    return { app: LAB_ID, token: signIn ? signIn.token : '', name: name, form: '',
             score: t.done, total: t.total, complete: t.done === t.total,
             checks: t.checks, firstTime: t.first1, tried: t.tried,
             from: t.from ? new Date(t.from).toISOString() : '', stations: perStation,
             snap: snapshotNow(), at: new Date().toISOString() };
  }
  /* What the records said when they would not keep it, as a state the chip can show. */
  function whyNot(reply) {
    var r = String(reply || '').trim();
    if (/^not recorded: sign-in is not set up/.test(r)) return 'setup';
    if (/^not recorded: not signed in/.test(r)) return 'stale';
    if (/^not recorded: not on this class list/.test(r)) return 'list';
    if (/^busy/.test(r)) return 'busy';
    if (/^rejected/.test(r)) return 'rejected';
    return 'other';
  }
  function renewThenSave() {
    if (askedAgain) { paintSaveChip(); return; }
    askedAgain = true; setTimeout(function () { askedAgain = false; }, 60000);
    SI.renew(CID, function (v) { if (v) { signIn = v; saveWhy = ''; flushSave(); } else paintSaveChip(); });
  }
  function flushSave(leaving) {
    if (!savePending || !syncEnabled() || saving) return;
    if (!signIn) { saveWhy = 'signin'; paintSaveChip(); return; }          /* kept here until they sign in */
    if (!haveToken()) { saveWhy = 'stale'; if (!leaving) renewThenSave(); else paintSaveChip(); return; }
    var payload = payloadNow();
    if (!payload.snap && !payload.score && !payload.checks) { savePending = false; saveWhy = ''; paintSaveChip(); return; }   /* nothing done yet: nothing to send */
    if (payload.snap === lastSent && payload.score <= lastScore) { savePending = false; saveWhy = ''; paintSaveChip(); return; }
    saving = true; savePending = false; saveWhy = ''; paintSaveChip();
    var opts = { method:'POST', mode:'cors', headers:{ 'Content-Type':'text/plain;charset=utf-8' }, body: JSON.stringify(payload) };
    if (leaving) opts.keepalive = true;
    fetch((window.LAB_CONFIG || {}).submitUrl, opts)
      .then(function (r) { return r.text(); })
      .then(function (reply) {
        saving = false;
        var r = String(reply || '').trim();
        if (/^recorded/.test(r)) {
          savedAt = new Date(); lastSent = payload.snap; lastScore = payload.score; saveWhy = '';
          try { localStorage.setItem(LAB_ID + '.submitted', JSON.stringify({ at: payload.at, sent: true, name: payload.name })); } catch (e) {}
          if (savePending) queueSave();          /* something changed while it was on its way */
        } else {
          saveWhy = whyNot(r); savePending = true;
          if (saveWhy === 'busy' || saveWhy === 'other') retryLater();
          else if (saveWhy === 'stale') renewThenSave();
        }
        paintSaveChip();
      })
      .catch(function () { saving = false; savePending = true; saveWhy = 'offline'; paintSaveChip(); retryLater(); });
  }
  addEventListener('pagehide', function () { if (savePending && !saving) flushSave(true); });
  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'hidden' && savePending && !saving) flushSave(true);
  });

  /* ---------- the chip in the header, and what opens from it ---------- */
  function hhmm(d) { return ('0' + d.getHours()).slice(-2) + ':' + ('0' + d.getMinutes()).slice(-2); }
  function paintSaveChip() {
    var b = document.getElementById('btnSubmit'); if (!b) return;
    if (!syncEnabled()) { b.hidden = true; return; }
    b.hidden = false;
    var cls = 'hbtn hbtn--save tip tip--right', text, tip;
    if (!signIn) { cls += ' is-off'; text = 'Sign in to save'; tip = 'Your work stays in this browser until you sign in with your school account. Sign in and it goes to Dr Mompel’s records — what you have done already, too.'; }
    else if (saving) { cls += ' is-busy'; text = 'Saving…'; tip = 'Sending your work to Dr Mompel’s records.'; }
    else if (saveWhy === 'list') { cls += ' is-no'; text = 'Not on the class list'; tip = 'The account you signed in with is not on Dr Mompel’s class list, so nothing is recorded for it. Your work stays in this browser.'; }
    else if (saveWhy === 'setup') { cls += ' is-no'; text = 'Not being collected'; tip = 'The records are not set up to accept sign-ins yet. Your work stays in this browser.'; }
    else if (saveWhy === 'stale') { cls += ' is-no'; text = 'Sign in again'; tip = 'Your Google sign-in has run out — they last about an hour. Press to sign in again; nothing is lost, it is sent afterwards.'; }
    else if (saveWhy === 'offline') { cls += ' is-no'; text = 'Offline · will retry'; tip = 'Could not reach the records. Your work is kept here and sent again in a minute.'; }
    else if (saveWhy === 'rejected') { cls += ' is-no'; text = 'Not saved'; tip = 'The records would not accept this. Show your teacher.'; }
    else if (savePending) { cls += ' is-busy'; text = 'Saving…'; tip = 'Sent to Dr Mompel’s records within two minutes, and at once when you finish or leave.'; }
    else if (savedAt) { cls += ' is-ok'; text = 'Saved ✓ ' + hhmm(savedAt); tip = 'In Dr Mompel’s records. Every check is sent on its own — there is nothing to hand in.'; }
    else { cls += ' is-ok'; text = 'Saves as you go'; tip = 'Signed in: every check is sent to Dr Mompel’s records on its own — there is nothing to hand in.'; }
    b.className = cls; b.textContent = text; b.setAttribute('data-tip', tip);
  }
  function openSaveDialog() {
    var dlg = document.getElementById('subDlg'); if (!dlg) return;
    fillSaveDialog();
    dlg.hidden = false;
    if (signIn && !haveToken() && SI && CID) SI.renew(CID, function () {});
    document.getElementById('subClose').onclick = function () { dlg.hidden = true; };
    dlg.onclick = function (e) { if (e.target === dlg) dlg.hidden = true; };
  }
  function saveLine() {
    if (saving) return 'Saving…';
    if (saveWhy === 'list') return 'The account you signed in with (' + esc(signIn.email) + ') is not on the class list, so nothing is recorded for it. The list is matched on email address, not on name.';
    if (saveWhy === 'setup') return 'The records are not set up to accept sign-ins yet, so nothing is recorded. Show your teacher this message.';
    if (saveWhy === 'offline') return 'Could not reach the records just now. Your work is kept here and sent again in a minute.';
    if (saveWhy === 'stale') return 'Your sign-in has run out. Sign in again and it is sent.';
    if (saveWhy === 'rejected') return 'The records would not accept this. Show your teacher.';
    if (savePending) return 'What you have done since the last save goes within two minutes.';
    if (savedAt) return 'Saved at ' + hhmm(savedAt) + '. Everything you have done here is in the records.';
    return 'Saves as you go.';
  }
  function fillSaveDialog() {
    var body = document.getElementById('subBody'), go = document.getElementById('subGo');
    if (!body || !go) return;
    var cfg = window.LAB_CONFIG || {}, t = totals();
    var sofar = '<p class="st-sub"><b>' + t.done + '</b> of <b>' + t.total + '</b> right so far, in <b>' + t.checks + '</b> check' + (t.checks === 1 ? '' : 's') + '.</p>';
    if (!cfg.googleClientId || !syncEnabled()) {
      body.innerHTML = sofar + '<p class="fineprint">This copy of the lab is not connected to a teacher’s records, so your work stays in this browser.</p>';
      go.style.display = 'none'; return;
    }
    if (signIn) {
      var stale = !haveToken();
      body.innerHTML = sofar +
        '<div class="who">Saving as <b>' + esc(signIn.name) + '</b><button type="button" class="tourcard__link" id="subOut">' + (stale ? 'sign in again' : 'not you?') + '</button></div>' +
        (stale ? '<p class="submsg no">Your Google sign-in has run out — they last about an hour, and a lab takes longer than that. Press <b>sign in again</b>; nothing is lost, it is sent afterwards.</p>' : '') +
        '<p class="submsg' + (saveWhy && saveWhy !== 'signin' ? ' no' : ' ok') + '">' + saveLine() + '</p>' +
        '<p class="fineprint">Every check is sent to Dr&nbsp;Mompel’s records on its own — within two minutes, and at once when you finish or leave. There is nothing to hand in. If you are on his class list it goes into his records; if you are not — anyone in the world is welcome here — nothing is recorded anywhere.</p>';
      go.style.display = (savePending || saveWhy) ? '' : 'none'; go.textContent = 'Save now';
      go.onclick = function () { queueSave(true); fillSaveDialog(); };
      document.getElementById('subOut').onclick = signOut;
      return;
    }
    body.innerHTML = sofar +
      '<p class="fineprint">Sign in with your school Google account and your work is sent to Dr&nbsp;Mompel’s records as you go — what you have done here already goes too. The lab is open to everyone; signing in is only how a result reaches his records.</p>' +
      '<div id="subWho" class="signinbox"></div>';
    go.style.display = 'none';
    if (!mountSignIn(document.getElementById('subWho'))) {
      document.getElementById('subWho').innerHTML = '<p class="fineprint">Google sign-in could not load here — offline, or a school filter has blocked accounts.google.com. Your work stays in this browser; sign in later and it is sent then.</p>';
    }
  }

  /* ---------- clicking a highlighted word ---------- */
  var peekEl = null;
  function closePeek() { if (peekEl) { peekEl.remove(); peekEl = null; } }
  function openPeek(el) {
    closePeek();
    var host = document.getElementById('panelInner');
    var src = el.getAttribute('data-peek'), note = el.getAttribute('data-note'), credit = el.getAttribute('data-credit');
    var pk = document.createElement('div');
    pk.className = 'peek';
    /* the same box reservation the finder pictures get: without it the note under the picture
       jumps down the moment the file lands */
    var pkw = (window.PHOTO_SIZE || {})[src] || (window.PHOTO_SIZE || {})[String(src).replace(/-900\.jpg$/, '')];
    /* "fig:name" draws one of the lab's own diagrams instead of a photograph. Some things
       cannot be photographed at all — a plasmid is inside a cell and far below the resolution
       of any school microscope — and showing a picture of the outside of a bacterium under the
       word "plasmids" teaches nothing. */
    var art = '';
    if (String(src).slice(0, 4) === 'fig:') {
      art = '<div class="peek__fig">' + (window.Learn ? window.Learn.svgFor(String(src).slice(4)) : '') + '</div>';
      pk.className += ' peek--fig';   /* a drawing with lettering in it needs the room */
    } else if (src) {
      art = '<img src="assets/photos/' + src + '" alt="" decoding="async"' +
            (pkw ? ' width="' + pkw[0] + '" height="' + pkw[1] + '"' : '') + '>';
    }
    pk.innerHTML = art +
      '<div class="peek__note">' + note + (credit ? '<span class="peek__credit">' + credit + '</span>' : '') + '</div>' +
      '<button class="peek__x" aria-label="Close">×</button>';
    host.appendChild(pk);
    var sheet = window.innerWidth < 600;
    if (sheet) pk.className += ' peek--sheet';
    function place() {
      var hr = host.getBoundingClientRect(), r = el.getBoundingClientRect();
      var w = pk.offsetWidth, hh = pk.offsetHeight, pad = 8, gap = 8;
      var left = Math.min(Math.max(pad, (r.left - hr.left) + r.width / 2 - w / 2), host.clientWidth - w - pad);
      var below = window.innerHeight - r.bottom - gap - pad, above = r.top - gap - pad, room = Math.max(above, below), top;
      if (hh > room) { pk.style.maxHeight = room + 'px'; pk.style.overflowY = 'auto'; hh = pk.offsetHeight; }
      else { pk.style.maxHeight = ''; pk.style.overflowY = ''; }
      if (below >= hh) top = (r.bottom - hr.top) + gap; else top = (r.top - hr.top) - hh - gap;
      var vTop = hr.top + top;
      if (vTop + hh > window.innerHeight - pad) { top -= (vTop + hh) - (window.innerHeight - pad); vTop = hr.top + top; }
      if (vTop < pad) top += pad - vTop;
      pk.style.left = left + 'px'; pk.style.top = top + 'px';
    }
    if (!sheet) place();
    var im = pk.querySelector('img');
    if (im && !sheet) im.addEventListener('load', place);
    pk.querySelector('.peek__x').addEventListener('click', closePeek);
    peekEl = pk;
  }
  /* A short aside a reader opens on purpose. Not the glossary, which defines a word, and not
     the peek, which shows a picture: this is a paragraph or two of why, for the one student in
     the class who wants it. Nothing in it is examined, and it says so. */
  var xpBox = null;
  function closeExplain() {
    if (!xpBox) return;
    xpBox.remove(); xpBox = null;
    document.removeEventListener('keydown', xpKey);
  }
  function xpKey(e) { if (e.key === 'Escape') closeExplain(); }
  function openExplain(spec) {
    closeExplain();
    xpBox = document.createElement('div');
    xpBox.className = 'xp';
    xpBox.setAttribute('role', 'dialog');
    xpBox.setAttribute('aria-modal', 'true');
    xpBox.setAttribute('aria-label', spec.title || 'Why');
    var card = document.createElement('div');
    card.className = 'xp__card';
    card.innerHTML = '<div class="xp__h"><b>' + esc(spec.title || 'Why') + '</b>' +
                     '<button type="button" class="xp__x" aria-label="Close">✕</button></div>' +
                     /* Every one of these panels is off-syllabus, and the line saying so was the
                        first sentence of the body — where a reader in a hurry goes straight past it
                        and comes away thinking they have to learn it. It is a banner now, put here
                        rather than in each panel so no panel can ever be written without one. */
                     '<div class="xp__b"><p class="xp__warn">Not on the syllabus — here out of curiosity. ' +
                     'You will not be asked to write any of this.</p>' + spec.body + '</div>';
    /* These panels are the one place in the lab where a hard word got no help: the body is HTML,
       and Terms.mark escapes its input, so it can never be passed a whole panel. Walking the text
       nodes and marking each one separately gives the panel the same tappable definitions as the
       rest of the station — which matters more here than anywhere, since this is where words like
       coleoptile and expansin live. Links and the citation are left alone. */
    if (window.Terms && window.Terms.mark) {
      var tn = [], tw = document.createTreeWalker(card.querySelector('.xp__b'), NodeFilter.SHOW_TEXT, null, false), nd;
      while ((nd = tw.nextNode())) tn.push(nd);
      tn.forEach(function (node) {
        if (!node.data.trim() || !node.parentNode) return;
        if (node.parentNode.closest('a, b.t, .xp__cite, .xp__warn')) return;
        var html = window.Terms.mark(node.data);
        if (html.indexOf('<b class="t') < 0) return;
        var sp = document.createElement('span');
        sp.innerHTML = html;
        node.parentNode.replaceChild(sp, node);
      });
    }
    xpBox.appendChild(card);
    xpBox.addEventListener('click', function (e) { if (e.target === xpBox || e.target.closest('.xp__x')) closeExplain(); });
    document.body.appendChild(xpBox);
    document.addEventListener('keydown', xpKey);
    var x = card.querySelector('.xp__x'); if (x) x.focus();
  }

  function wireGoto(root) {
    root.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('[data-goto]') : null;
      if (!b) return;
      var t = document.querySelector('[data-anchor="' + b.getAttribute('data-goto') + '"]');
      if (!t) return;
      t.scrollIntoView({ behavior: 'smooth', block: 'center' });
      t.classList.remove('is-found');
      void t.offsetWidth;                       /* restart the flash if it is clicked twice */
      t.classList.add('is-found');
    });
  }

  function wireTermClicks(root) {
    function act(t) {
      markWhereWeAre();
      if (t.hasAttribute('data-peek')) openPeek(t);
      else if (t.hasAttribute('data-gloss')) { closePeek(); window.LabGlossary(t.getAttribute('data-gloss')); }
      else if (t.hasAttribute('data-stat')) { closePeek(); if (window.LabStats) window.LabStats.show(t.getAttribute('data-stat'), t); }
      else { closePeek(); open(t.getAttribute('data-jump'), (t.getAttribute('data-term') || t.textContent).trim(), current); }
    }
    root.addEventListener('click', function (e) {
      var t = e.target.closest('[data-peek],[data-jump],[data-gloss],[data-stat]');
      if (!t) { closePeek(); return; }
      e.preventDefault(); act(t);
    });
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target.closest('[data-peek],[data-jump],[data-gloss],[data-stat]');
      if (!t) return;
      e.preventDefault(); act(t);
    });
  }

  /* ---------- toast, tooltips ---------- */
  var toastT = null;
  function toast(msg) {
    var t = document.getElementById('toast');
    t.style.pointerEvents = ''; t.textContent = msg; t.classList.add('show');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.remove('show'); }, 2800);
  }
  document.addEventListener('click', function (e) {
    var tip = e.target.closest ? e.target.closest('.tip') : null;
    Array.prototype.forEach.call(document.querySelectorAll('.tip.is-open'), function (el) { if (el !== tip) el.classList.remove('is-open'); });
    if (tip) { e.preventDefault(); tip.classList.toggle('is-open'); }
  });

  /* ---------- credits: every picture and video the stations name ---------- */
  function paintCredits() {
    var cr = document.getElementById('creditsList'); if (!cr) return;
    var seenC = {}, out = [];
    function add(c, url) { if (!c || seenC[c]) return; seenC[c] = 1; out.push(url ? '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(c) + '</a>' : esc(c)); }
    function walk(o) {
      if (!o || typeof o !== 'object') return;
      if (Array.isArray(o)) { o.forEach(walk); return; }
      if (o.credit && (o.img || o.src || o.type === 'photo' || o.type === 'finder' || o.type === 'video')) add(o.credit, o.url);
      Object.keys(o).forEach(function (k) { if (k !== 'credit') walk(o[k]); });
    }
    ORDER.forEach(function (id) { walk(S[id].learn); walk(S[id].activities); });
    cr.innerHTML = out.join(' · ') + '.';
  }

  /* ---------- boot ---------- */
  function boot() {
    (window.STATIONS || []).forEach(function (s) { S[s.id] = s; ORDER.push(s.id); });
    /* the first station to light a part owns it, unless a station claims it outright */
    /* a station may claim a part outright; otherwise the first station that lights it owns it */
    ORDER.forEach(function (id) { ((S[id].plate || {}).owns || []).forEach(function (g) { OWNER[g] = id; }); });
    ORDER.forEach(function (id) { ((S[id].plate || {}).light || []).forEach(function (g) { if (!OWNER[g]) OWNER[g] = id; }); });
    if (!OWNER.body) OWNER.body = ORDER[0];
    var stale = reconcile();
    if (stale) console.info('Circulation Lab: ' + stale + ' station record(s) reset — the questions there have changed since they were answered.');

    if (window.Plate) window.Plate.init({ onPick: openGroup });
    document.getElementById('btnSubmit').addEventListener('click', openSaveDialog);
    wireTermClicks(document.getElementById('panel'));
    wireGoto(document.getElementById('panel'));
    window.addEventListener('resize', closePeek);
    var lb = document.getElementById('lightbox');
    lb.addEventListener('click', function () { lb.hidden = true; });
    paintCredits();

    /* ---------- the glossary ---------- */
    (function () {
      var dlg = document.getElementById('glossDlg'), list = document.getElementById('glossList');
      var find = document.getElementById('glossFind'), count = document.getElementById('glossCount');
      var built = false, pinTerm = null, atOpen = null;
      function tierTag(w) {
        if (w.ext) return ' <span class="tier tier--ext" title="Worth knowing, but 0610 will not ask you to name it">not asked in 0610</span>';
        if (w.sup) return ' <span class="tier tier--sup" title="Supplement — examined on Paper 4 (Extended) only">Supplement</span>';
        return '';
      }
      function build() {
        if (built) return; built = true;
        var all = (window.GLOSSARY || []).slice(), where = {};
        ORDER.forEach(function (id) { (S[id].keywords || []).forEach(function (w) { where[w.term.toLowerCase()] = id; }); });
        var groups = [], byId = {};
        ORDER.forEach(function (id) { byId[id] = { name: S[id].name, rows: [] }; groups.push(byId[id]); });
        var general = { name: 'Words used across the labs', rows: [] }, pinned = null;
        all.forEach(function (e) {
          if (pinTerm && e.term.toLowerCase() === pinTerm && !pinned) { pinned = e; return; }
          (byId[where[e.term.toLowerCase()]] || general).rows.push(e);
        });
        if (general.rows.length) groups.push(general);
        if (pinned) groups.unshift({ name: 'The word you tapped', rows: [pinned] });
        list.innerHTML = groups.filter(function (g) { return g.rows.length; }).map(function (g) {
          return '<section class="gloss__grp"><h3 class="gloss__h">' + esc(g.name) + '</h3><dl class="gloss__dl">' + g.rows.map(function (w) {
            var known = window.Terms && window.Terms.isKnown(w.term);
            var got = '<button type="button" class="gloss__got' + (known ? ' is-known' : '') + '" data-got="' + esc(w.term) + '">' +
                      (known ? '✓ you know this — show it again' : 'I know this one — stop marking it') + '</button>';
            var also = (w.also || []).length ? '<p class="gloss__also">See also: ' + w.also.map(function (t) { return '<button type="button" class="gloss__see" data-see="' + esc(t) + '">' + esc(t) + '</button>'; }).join(' ') + '</p>' : '';
            return '<div class="gloss__row" data-term="' + esc((w.term + ' ' + (w.plural || '') + ' ' + (w.singular || '') + ' ' + w.def).toLowerCase()) + '"><dt>' + esc(w.term) + numberOf(w) + tierTag(w) + '</dt><dd>' + esc(w.def) + also + got + '</dd></div>';
          }).join('') + '</dl></section>';
        }).join('');
      }
      function filter() {
        var q = (find.value || '').trim().toLowerCase();
        var rows = list.querySelectorAll('.gloss__row'), shown = 0;
        Array.prototype.forEach.call(rows, function (r) { var hit = !q || r.getAttribute('data-term').indexOf(q) >= 0; r.hidden = !hit; if (hit) shown++; });
        Array.prototype.forEach.call(list.querySelectorAll('.gloss__grp'), function (g) { g.hidden = !g.querySelector('.gloss__row:not([hidden])'); });
        count.textContent = q ? (shown ? shown + (shown === 1 ? ' word' : ' words') + ' match “' + find.value.trim() + '”' : 'Nothing matches “' + find.value.trim() + '”')
                              : rows.length + ' key words across ' + list.querySelectorAll('.gloss__grp').length + ' stations';
      }
      function countKnown() {
        var n = window.Terms ? window.Terms.knownCount() : 0;
        var el = document.getElementById('glossKnown'); if (!el) return;
        el.hidden = !n;
        el.innerHTML = n + (n === 1 ? ' word is' : ' words are') + ' marked as known. <button type="button" id="glossForget">Mark them all as new again</button>';
        var f = document.getElementById('glossForget');
        if (f) f.addEventListener('click', function () { window.Terms.forgetAll(); built = false; build(); filter(); countKnown(); paintPanel(); });
      }
      function openG(term) {
        var sc = panelScroller();
        atOpen = sc ? sc.scrollTop : null;
        pinTerm = term ? String(term).trim().toLowerCase() : null;
        built = false; build(); find.value = term || ''; filter(); countKnown(); dlg.hidden = false;
        var box = dlg.querySelector('.modal__box'); if (box) box.scrollTop = 0;
        var touch = false; try { touch = matchMedia('(pointer: coarse)').matches; } catch (e) {}
        if (!term && !touch) setTimeout(function () { try { find.focus({ preventScroll: true }); } catch (e) { find.focus(); } if (box) box.scrollTop = 0; }, 30);
      }
      window.LabGlossary = openG;
      document.getElementById('btnGloss').addEventListener('click', function () { openG(''); });
      function close() { dlg.hidden = true; var sc = panelScroller(); if (sc && atOpen != null) jumpTo(sc, atOpen); }
      document.getElementById('glossClose').addEventListener('click', close);
      dlg.addEventListener('click', function (e) { if (e.target === this) close(); });
      find.addEventListener('input', filter);
      list.addEventListener('click', function (e) {
        var got = e.target.closest('.gloss__got');
        if (got) {
          var term = got.getAttribute('data-got'), now = !(window.Terms && window.Terms.isKnown(term));
          window.Terms.setKnown(term, now);
          got.classList.toggle('is-known', now);
          got.textContent = now ? '✓ you know this — show it again' : 'I know this one — stop marking it';
          countKnown(); paintPanel(); return;
        }
        var b = e.target.closest('.gloss__see'); if (!b) return;
        find.value = b.getAttribute('data-see'); filter();
        var box2 = dlg.querySelector('.modal__box'); if (box2) box2.scrollTop = 0;
      });
    })();

    document.getElementById('btnHelp').addEventListener('click', function () { document.getElementById('modal').hidden = false; });
    document.getElementById('modalClose').addEventListener('click', function () { document.getElementById('modal').hidden = true; });
    document.getElementById('modal').addEventListener('click', function (e) { if (e.target === this) this.hidden = true; });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closePeek();
      document.getElementById('modal').hidden = true;
      document.getElementById('glossDlg').hidden = true;
      document.getElementById('subDlg').hidden = true;
      lb.hidden = true;
      Array.prototype.forEach.call(document.querySelectorAll('.tip.is-open'), function (el) { el.classList.remove('is-open'); });
    });
    /* the questions count in the header opens this station's questions: students click it expecting them */
    var qStat = document.querySelector('.hdr .stat[title="Questions answered correctly"]');
    if (qStat) {
      qStat.setAttribute('role', 'button'); qStat.tabIndex = 0; qStat.title = 'Open the questions for this station'; qStat.classList.add('stat--go');
      var goQuestions = function () {
        if (current == null) return;
        tab = 'do'; paintPanel();
        var tabs = document.querySelector('#panelInner .tabs'); if (tabs) landOn(tabs, true);   /* lands below the pinned plate on a phone */
      };
      qStat.addEventListener('click', goQuestions);
      /* on a phone the plate is pinned above the notes; this folds it to a strip for a reader who wants the notes alone */
      var plate = document.querySelector('.platecol'), fold = document.getElementById('plateFold');
      if (plate && fold) {
        var FOLD_KEY = 'labs.plateFolded', foldedNow = false;
        try { foldedNow = localStorage.getItem(FOLD_KEY) === '1'; } catch (e) {}
        var paintFold = function () { plate.classList.toggle('is-folded', foldedNow); fold.setAttribute('aria-expanded', foldedNow ? 'false' : 'true'); fold.textContent = (foldedNow ? '▼ Show ' : '▲ Hide ') + fold.getAttribute('data-what'); };
        paintFold();
        fold.addEventListener('click', function () { foldedNow = !foldedNow; lentTo = false; try { localStorage.setItem(FOLD_KEY, foldedNow ? '1' : '0'); } catch (e) {} paintFold(); });
        /* A simulation arriving in the strip while the strip is folded away would be invisible,
           and the reader would never know it was there. So it opens itself — and closes again
           afterwards, unless the reader has since made the choice themselves, in which case their
           choice stands and is what gets remembered. */
        var lentTo = false;
        window.PlateFold = {
          lend: function (on) {
            if (on) {
              if (foldedNow) { lentTo = true; plate.classList.remove('is-folded'); fold.setAttribute('aria-expanded', 'true'); fold.textContent = '▲ Hide ' + fold.getAttribute('data-what'); }
            } else if (lentTo) { lentTo = false; paintFold(); }
          }
        };
      }
      qStat.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); goQuestions(); } });
    }
    document.getElementById('btnReset').addEventListener('click', function () {
      if (!confirm('Clear all your answers and start again? This cannot be undone.')) return;
      progress = {};
      try { localStorage.removeItem(STORE); } catch (e) {}
      paintHeader(); paintRail(); paintPanel();
      toast('Progress cleared.');
    });

    /* a link can name a station or a part of the body */
    function fromHash() {
      var hsh = (location.hash || '').slice(1);
      if (S[hsh]) { open(hsh); return true; }
      if (OWNER[hsh]) { open(OWNER[hsh]); openGroup(hsh); return true; }
      return false;
    }
    if (!fromHash()) open(ORDER[0]);
    paintHeader();
    window.addEventListener('hashchange', function () {
      var hsh = location.hash.slice(1);
      if (S[hsh] && hsh !== current) open(hsh);
      else if (OWNER[hsh]) openGroup(hsh);
    });
    /* A widget's button that leads to a widget on another station (Inside the heart's "what starts
       each beat" → the ECG simulation in Monitoring the heart): open that station, land on the
       widget as a followed word does, and offer the way back. */
    if (window.CircLearn) window.CircLearn.goToWidget = function (id, sel, what) {
      if (!S[id]) return false;
      var from = current;
      markWhereWeAre(); closePeek();
      open(id);
      var target = document.querySelector('#panelInner ' + sel);
      if (!target) { toStationTop(); return false; }
      landOn(target, false);
      if (from !== id && S[from]) showBackChip(from, what || S[id].name);
      return true;
    };
  }

  /* GitHub Pages caches the HTML for ten minutes; the page's own stamp comes from its script
     tags, and the banner only shows once the server's index.html carries a newer one. */
  var pageVersion = (function () {
    var sc = document.querySelector('script[src*="stations.js"]');
    var m = sc && (sc.getAttribute('src') || '').match(/[?&]v=(\d+)/);
    return m ? m[1] : null;
  })();
  var updateShown = false;
  function checkForUpdate() {
    if (!pageVersion || updateShown || document.hidden) return;
    fetch('version.txt', { cache: 'no-store' })
      .then(function (r) { return r.ok ? r.text() : null; })
      .then(function (v) {
        v = v && v.trim();
        if (!v || v === pageVersion) return;
        return fetch(location.pathname, { cache: 'reload' })
          .then(function (r) { return r.ok ? r.text() : ''; })
          .then(function (html) {
            var m = html.match(/stations\.js\?v=(\d+)/);
            if (!m || m[1] === pageVersion) return;
            updateShown = true;
            var t = document.getElementById('updBar') || document.getElementById('toast');
            t.innerHTML = 'A newer version of this page is available. <button class="btn btn--ghost" style="margin-left:8px;padding:3px 12px;font-size:13px" onclick="location.reload()">Reload</button>';
            t.style.pointerEvents = 'auto'; t.classList.add('show');
          });
      }).catch(function () {});
  }
  setTimeout(checkForUpdate, 4000);
  setInterval(checkForUpdate, 10 * 60 * 1000);
  window.LabUpdateCheck = checkForUpdate;
  document.addEventListener('visibilitychange', function () { if (!document.hidden) setTimeout(checkForUpdate, 800); });

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
