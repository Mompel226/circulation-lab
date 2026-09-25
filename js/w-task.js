/* ============================================================
   w-task.js — the assessed gym investigation: what to do, and where to learn how.

     tasklist     the steps of the task, each ticked off by the reader. The ticks stay in this
                  browser only (localStorage), as a reminder; nothing is sent anywhere.
     reportlinks  the parts of the report, in the order they are written, each opening the page
                  of the Write-Up Lab (the lab report guide) that teaches it.

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
  var PARTS = [
    { name: 'Research question', say: 'What a focused research question contains, and a tool that builds one part by part.',
      links: [['part/question', 'Research question'], ['tool/rq-builder', 'Question builder'], ['part/hypothesis', 'Hypothesis']] },
    { name: 'Background knowledge', say: 'How to cite a published source in your text and list it at the end.',
      links: [['part/sources', 'Sources'], ['tool/ref-builder', 'Reference builder']] },
    { name: 'Variables', say: 'The independent, dependent and controlled variables, and how to write each one so it earns its mark.',
      links: [['part/variables', 'Variables']] },
    { name: 'Equipment list', say: 'One line for each item, with its size or quantity, and how precise each instrument is.',
      links: [['part/apparatus', 'Apparatus']] },
    { name: 'Method', say: 'A numbered method that another person could follow, written in the past tense and the passive voice.',
      links: [['part/method', 'Method']] },
    { name: 'Risk assessment', say: 'Hazards, risks and the precautions that prevent them, in a table.',
      links: [['part/safety', 'Risk, ethics and environment'], ['tool/risk-builder', 'Risk builder']] },
    { name: 'Results table', say: 'How to build a results table, and a broken table to fix.',
      links: [['part/tables', 'Tables'], ['tool/table-fixer', 'Table fixer']] },
    { name: 'Graph', say: 'How to choose the right kind of graph for your data, and how to draw it.',
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

  L.add('tasklist', tasklist);
  L.add('reportlinks', reportlinks);
})(window);
