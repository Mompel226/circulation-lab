/* ============================================================
   w-task.js — the assessed gym investigation: what to do, and where to learn how.

     taskmap      (10 Oct 2026) the four steps of the task: press a step to see when it happens, who does it
                  and what you do. One step open at a time. It replaced a tick list (Daniel: pupils read this
                  station before the gym, "they're not going to come back" to tick the steps).
     reportmap    (9 Oct 2026) the six parts of the 2026-27 report: press a part to see which criterion
                  marks it (in the task sheet's colours), what the mark scheme asks of it, and where to
                  learn it (a Write-Up Lab page or tool in a new tab, or a station of this lab), and, under
                  it, the Write-Up Lab's whole-report checklist. One part open at a time. The words come from
                  the master (spec.parts): the sheet's own targets, rules only. It replaced a list of links
                  (reportlinks) that repeated its "Learn it" links (Daniel, 10 Oct: "you cannot repeat information").

   Neither widget says what to write. The report is assessed, and working it out from the guide
   is the point: Daniel, 25 Sep 2026, "otherwise, you're doing the assessment for them". ?lv=g
   opens the Write-Up Lab at IGCSE level.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h, esc = L.esc;

  var WUL = 'https://nlcsbiology.com/write-up-lab/?lv=g#/';
  /* 9 Oct 2026: the 2026-27 report (risk assessment before the method; no sources; the hypothesis ends the
     background; the table and the graph are not part of this report). */
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
    if (spec.check) box.appendChild(h('p', 'rl__check', '<a class="rl__a rl__a--big" href="' + esc(WUL + 'check') + '" target="_blank" rel="noopener">Check your whole report against the Write-Up Lab\u2019s checklist <span aria-hidden="true">\u2197</span><span class="rl__sr"> (opens in a new tab)</span></a>'));
    if (parts.length) show(0);
    return box;
  }

  /* ---------- taskmap (10 Oct 2026) ---------- */
  function taskmap(spec) {
    var steps = spec.steps || [];
    var box = h('div', 'widget rm tm');
    box.appendChild(L.head(spec.title || 'What you have to do', spec.ask || 'Press each step.', null));
    var wrap = h('div', 'rm__wrap');
    var list = h('ol', 'rm__list');
    var panel = h('div', 'rm__panel tm__panel'); panel.setAttribute('aria-live', 'polite');
    var btns = [];
    function row(k, v) { return v ? '<p class="tm__row"><span class="tm__k">' + esc(k) + '</span> ' + L.mk(v) + '</p>' : ''; }
    function show(i) {
      var p = steps[i];
      btns.forEach(function (b, k) { b.classList.toggle('is-on', k === i); b.setAttribute('aria-pressed', String(k === i)); });
      panel.innerHTML = '<p class="rm__crit"><span class="rm__chip">' + (i + 1) + '</span> Step ' + (i + 1) + ' of ' + steps.length + '</p>' +
        '<h4 class="rm__name">' + esc(p.name) + '</h4>' + row('When', p.when) + row('Who', p.who) +
        '<p class="rm__h">What you do</p><ul class="rm__asks">' + (p.does || []).map(function (a) { return '<li>' + L.mk(a) + '</li>'; }).join('') + '</ul>';
    }
    steps.forEach(function (p, i) {
      var li = h('li', 'rm__item');
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'rm__btn tm__btn';
      b.innerHTML = '<span class="rm__num" aria-hidden="true">' + (i + 1) + '</span><span class="rm__txt">' + esc(p.name) + '</span>';
      b.addEventListener('click', function () { show(i); });
      btns.push(b); li.appendChild(b); list.appendChild(li);
    });
    wrap.appendChild(list); wrap.appendChild(panel); box.appendChild(wrap);
    if (steps.length) show(0);
    return box;
  }

  L.add('taskmap', taskmap);
  L.add('reportmap', reportmap);
})(window);
