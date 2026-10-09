/* ============================================================
   w-task.js — the assessed gym investigation: what to do, and where to learn how.

     tasklist     the steps of the task, each ticked off by the reader. The ticks stay in this
                  browser only (localStorage), as a reminder; nothing is sent anywhere.
     reportlinks  the parts of the report, in the order they are written, each opening the page
                  of the Write-Up Lab (the lab report guide) that teaches it.
     reportmap    (9 Oct 2026) the six parts of the 2026-27 report: press a part to see which criterion
                  marks it (in the task sheet's colours), what the mark scheme asks of it, and where to
                  learn it (a Write-Up Lab page in a new tab, or a station of this lab). One part open at
                  a time. The words come from the master (spec.parts): the sheet's own targets, rules only.

   Neither widget says what to write. The report is assessed, and working it out from the guide
   is the point: Daniel, 25 Sep 2026, "otherwise, you're doing the assessment for them". The
   links were opened on the live Write-Up Lab on 25 Sep 2026; ?lv=g opens it at IGCSE level.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h, esc = L.esc;

  /* ---------- tasklist ---------- */
  function tasklist(spec) {
    var KEY = 'circulation-lab.tasklist.' + (spec.store || 'task');
    var items = spec.items || [];
    var done = {};
    try { done = JSON.parse(global.localStorage.getItem(KEY) || '{}') || {}; } catch (e) { done = {}; }
    var box = h('div', 'widget tl');
    box.appendChild(L.head(spec.title || 'What you have to do', spec.ask, null));
    var list = h('ol', 'tl__list');
    var count = h('p', 'tl__count'); count.setAttribute('aria-live', 'polite');
    items.forEach(function (text, i) {
      var li = h('li', 'tl__item');
      var id = 'tl-' + (spec.store || 'task') + '-' + i;
      li.innerHTML = '<input type="checkbox" class="tl__box" id="' + id + '"><label class="tl__lab" for="' + id + '">' +
        '<span class="tl__num" aria-hidden="true">' + (i + 1) + '</span><span class="tl__txt">' + L.mk(text) + '</span></label>';
      var cb = li.querySelector('input');
      cb.checked = !!done[i];
      li.classList.toggle('is-done', cb.checked);
      cb.addEventListener('change', function () {
        done[i] = cb.checked; li.classList.toggle('is-done', cb.checked); paint();
        try { global.localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) { /* a private window: the ticks last until the page closes */ }
      });
      list.appendChild(li);
    });
    function paint() {
      var n = items.filter(function (_, i) { return done[i]; }).length;
      count.textContent = n === items.length ? 'All ' + n + ' steps done.' : n + ' of ' + items.length + ' steps done.';
    }
    box.appendChild(list); box.appendChild(count);
    /* the widget's Reset starts the list again: the ticks go too */
    box.__onReset = function () { try { global.localStorage.removeItem(KEY); } catch (e) {} };
    box.appendChild(h('p', 'widget__note', 'The ticks are kept in this browser only, as a reminder for you. Your teacher does not see them.'));
    paint();
    return box;
  }

  /* ---------- reportlinks ---------- */
  var WUL = 'https://nlcsbiology.com/write-up-lab/?lv=g#/';
  /* 9 Oct 2026: the 2026-27 report (risk assessment before the method; no sources; the hypothesis ends the
     background; the table and the graph are not part of this report). */
  var PARTS = [
    { name: 'Research question', say: 'What a focused research question contains, and a tool that builds one part by part.',
      links: [['part/question', 'Research question'], ['tool/rq-builder', 'Question builder']] },
    { name: 'Background knowledge, ending with your hypothesis', say: 'Only the biology your question needs, explained with cause and effect, then your hypothesis.',
      links: [['part/background', 'Background'], ['part/hypothesis', 'Hypothesis']] },
    { name: 'Variables', say: 'The independent, dependent and controlled variables, and how to write each one so it earns its mark.',
      links: [['part/variables', 'Variables']] },
    { name: 'Equipment list', say: 'One line for each item, with its size or quantity, and how precise each instrument is.',
      links: [['part/apparatus', 'Apparatus']] },
    { name: 'Risk assessment', say: 'Safety, ethical and environmental issues, and how to address each one.',
      links: [['part/safety', 'Risk, ethics and environment'], ['tool/risk-builder', 'Risk builder']] },
    { name: 'Method', say: 'A numbered method that another person could follow, ending with how the raw data were processed.',
      links: [['part/method', 'Method'], ['part/processing', 'Processing data']] },
    { name: 'Data table (before the gym)', say: 'How to build a results table, and a broken table to fix.',
      links: [['part/tables', 'Tables'], ['tool/table-fixer', 'Table fixer']] },
    { name: 'Graph (practice for a later report)', say: 'How to choose the right kind of graph for your data, and how to draw it.',
      links: [['part/graphs', 'Graphs'], ['tool/graph-chooser', 'Graph chooser']] }
  ];
  function reportlinks(spec) {
    var box = h('div', 'widget rl');
    box.appendChild(L.head(spec.title || 'Each part, in the Write-Up Lab', spec.ask || 'Open the page for the part you are writing. Each opens in a new tab, so you keep your place here.', null));
    var list = h('ol', 'rl__list');
    PARTS.forEach(function (p, i) {
      var li = h('li', 'rl__item');
      li.innerHTML = '<span class="rl__num" aria-hidden="true">' + (i + 1) + '</span>' +
        '<div class="rl__body"><b class="rl__name">' + esc(p.name) + '</b><span class="rl__say">' + esc(p.say) + '</span>' +
        '<span class="rl__links">' + p.links.map(function (l) {
          return '<a class="rl__a" href="' + esc(WUL + l[0]) + '" target="_blank" rel="noopener">' + esc(l[1]) + ' <span aria-hidden="true">↗</span><span class="rl__sr"> (opens in a new tab)</span></a>';
        }).join('') + '</span></div>';
      list.appendChild(li);
    });
    box.appendChild(list);
    var chk = h('p', 'rl__check', '<a class="rl__a rl__a--big" href="' + esc(WUL + 'check') + '" target="_blank" rel="noopener">Check your whole report against the checklist <span aria-hidden="true">↗</span><span class="rl__sr"> (opens in a new tab)</span></a>');
    box.appendChild(chk);
    return box;
  }

  /* ---------- reportmap ---------- */
  var CRIT = {
    1: { name: 'Research Question', cls: 'rm--rq' }, 2: { name: 'Background Knowledge', cls: 'rm--bk' },
    3: { name: 'Method Considerations', cls: 'rm--mc' }, 4: { name: 'Description of Method', cls: 'rm--dm' }
  };
  function reportmap(spec) {
    var parts = spec.parts || [];
    var box = h('div', 'widget rm');
    box.appendChild(L.head(spec.title || 'The parts of your lab report', spec.ask || 'Press a part. The colours are the ones on your task sheet.', null));
    var wrap = h('div', 'rm__wrap');
    var list = h('ol', 'rm__list');
    var panel = h('div', 'rm__panel'); panel.setAttribute('aria-live', 'polite');
    var btns = [];
    function show(i) {
      var p = parts[i], c = CRIT[p.crit] || { name: '', cls: '' };
      btns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
      panel.className = 'rm__panel ' + c.cls;
      panel.innerHTML = '<p class="rm__crit"><span class="rm__chip">' + esc(String(p.crit)) + '</span> Marked in <b>' + esc(c.name) + '</b>, out of 6</p>' +
        '<h4 class="rm__name">' + esc(p.name) + '</h4>' +
        '<p class="rm__h">What the mark scheme asks of it</p><ul class="rm__asks">' +
        (p.asks || []).map(function (a) { return '<li>' + L.mk(a) + '</li>'; }).join('') + '</ul>' +
        '<p class="rm__h">Learn it</p><p class="rm__links">' + (p.links || []).map(function (l) {
          return l[0] === 'lab'
            ? '<a class="rl__a" href="#' + esc(l[1]) + '">This lab: ' + esc(l[2]) + ' <span aria-hidden="true">→</span></a>'
            : '<a class="rl__a" href="' + esc(WUL + l[1]) + '" target="_blank" rel="noopener">Write-Up Lab: ' + esc(l[2]) + ' <span aria-hidden="true">↗</span><span class="rl__sr"> (opens in a new tab)</span></a>';
        }).join('') + '</p>';
    }
    parts.forEach(function (p, i) {
      var c = CRIT[p.crit] || { cls: '' };
      var li = h('li', 'rm__item');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'rm__btn ' + c.cls;
      b.innerHTML = '<span class="rm__num" aria-hidden="true">' + (i + 1) + '</span><span class="rm__txt">' + esc(p.name) + '</span>';
      b.addEventListener('click', function () { show(i); });
      btns.push(b); li.appendChild(b); list.appendChild(li);
    });
    wrap.appendChild(list); wrap.appendChild(panel); box.appendChild(wrap);
    if (parts.length) show(0);
    return box;
  }

  L.add('tasklist', tasklist);
  L.add('reportlinks', reportlinks);
  L.add('reportmap', reportmap);
})(window);
