/* ============================================================
   w-route.js — "Trace the route": the main blood vessels, in order.

   The same body as the plate (js/circ-draw.js, drawn a second time inside the widget and kept
   still), so the reader clicks the real vessels, chambers and organs, not boxes on a chart. Each
   puzzle names a start and an end; the reader clicks, in order, every chamber, vessel and organ
   the blood passes through. A right click lights that part and adds it to the route; a wrong one
   says why it is wrong, in the words of the station. Everything can also be chosen from a list,
   for the keyboard and for a small screen.

   The routes are the ones 0610 asks for (9.3: the vessels to and from the heart, lungs and
   kidneys; Supplement: the liver's three), and the classic exam traces: kidney → lungs,
   small intestine → heart.
   ============================================================ */
(function (global) {
  'use strict';
  var L = global.CircLearn;
  if (!L) return;
  var h = L.h, esc = L.esc;

  var NAME = {
    ra: 'right atrium', rv: 'right ventricle', la: 'left atrium', lv: 'left ventricle',
    lungs: 'lungs', kidneys: 'kidney', liver: 'liver', gut: 'small intestine',
    aorta: 'aorta', 'vena-cava': 'vena cava', 'pulmonary-artery': 'pulmonary artery', 'pulmonary-vein': 'pulmonary vein',
    'renal-artery': 'renal artery', 'renal-vein': 'renal vein',
    'hepatic-artery': 'hepatic artery', 'hepatic-vein': 'hepatic vein', 'hepatic-portal-vein': 'hepatic portal vein'
  };
  /* the order the list offers them in: the heart, then the vessels, then the organs */
  var LIST = ['ra', 'rv', 'la', 'lv', 'vena-cava', 'aorta', 'pulmonary-artery', 'pulmonary-vein', 'renal-artery', 'renal-vein',
              'hepatic-artery', 'hepatic-portal-vein', 'hepatic-vein', 'lungs', 'liver', 'kidneys', 'gut'];

  var PUZZLES = [
    { title: 'From the vena cava to the lungs', start: 'vena-cava', steps: ['ra', 'rv', 'pulmonary-artery', 'lungs'] },
    { title: 'From the lungs to the aorta', start: 'lungs', steps: ['pulmonary-vein', 'la', 'lv', 'aorta'] },
    { title: 'From the left ventricle to a kidney, and back to the heart', start: 'lv', steps: ['aorta', 'renal-artery', 'kidneys', 'renal-vein', 'vena-cava', 'ra'] },
    { title: 'From a kidney to the lungs', start: 'kidneys', steps: ['renal-vein', 'vena-cava', 'ra', 'rv', 'pulmonary-artery', 'lungs'] },
    { title: 'From the small intestine to the heart', start: 'gut', steps: ['hepatic-portal-vein', 'liver', 'hepatic-vein', 'vena-cava', 'ra'], sup: true },
    { title: 'From the left ventricle through the liver, and back to the heart', start: 'lv', steps: ['aorta', 'hepatic-artery', 'liver', 'hepatic-vein', 'vena-cava', 'ra'], sup: true },
    { title: 'One complete circuit, through a kidney', start: 'ra',
      steps: ['rv', 'pulmonary-artery', 'lungs', 'pulmonary-vein', 'la', 'lv', 'aorta', 'renal-artery', 'kidneys', 'renal-vein', 'vena-cava', 'ra'] }
  ];

  /* why a tempting wrong answer is wrong: "expected|clicked" */
  var WHY = {
    'rv|lv': 'The right atrium empties into the right ventricle, below it. The septum keeps the two sides of the heart apart.',
    'rv|la': 'The right atrium empties into the right ventricle, below it. The septum keeps the two sides of the heart apart.',
    'lv|rv': 'The left atrium empties into the left ventricle, below it. The septum keeps the two sides of the heart apart.',
    'la|ra': 'Blood from the lungs returns to the LEFT atrium, not the right.',
    'ra|la': 'The vena cava brings blood from the body into the RIGHT atrium.',
    'pulmonary-artery|aorta': 'The right ventricle pumps blood into the pulmonary artery, to the lungs. The aorta leaves the left ventricle.',
    'aorta|pulmonary-artery': 'The left ventricle pumps blood into the aorta, to the body. The pulmonary artery leaves the right ventricle.',
    'pulmonary-vein|pulmonary-artery': 'The pulmonary artery brings blood to the lungs. Blood leaves the lungs in the pulmonary vein.',
    'pulmonary-artery|pulmonary-vein': 'The pulmonary vein brings blood from the lungs to the heart. Blood goes to the lungs in the pulmonary artery.',
    'renal-vein|renal-artery': 'The renal artery brings blood to the kidney. Blood leaves the kidney in the renal vein.',
    'renal-artery|renal-vein': 'The renal vein takes blood away from the kidney. Blood arrives in the renal artery, a branch of the aorta.',
    'hepatic-portal-vein|hepatic-artery': 'The hepatic artery brings blood from the aorta. Blood from the small intestine reaches the liver in the hepatic portal vein.',
    'hepatic-artery|hepatic-portal-vein': 'The hepatic portal vein comes from the small intestine. The branch of the aorta that supplies the liver is the hepatic artery.',
    'hepatic-vein|hepatic-portal-vein': 'The hepatic portal vein brings blood INTO the liver. Blood leaves the liver in the hepatic vein.',
    'vena-cava|aorta': 'Veins take blood back to the heart: the renal and hepatic veins join the vena cava, not the aorta.',
    'liver|hepatic-vein': 'The blood passes through the liver, in its capillaries, before it leaves in the hepatic vein.',
    'kidneys|renal-vein': 'The blood passes through the kidney, in its capillaries, before it leaves in the renal vein.',
    'lungs|pulmonary-vein': 'The blood passes through the lungs, in their capillaries, before it leaves in the pulmonary vein.'
  };
  var NOT_A_ROUTE = {
    heart: 'That is the muscular wall of the heart. Click one of the four chambers.',
    septum: 'That is the septum, the wall between the two sides of the heart. Blood never passes through it.',
    'av-valves': 'That is an atrioventricular valve. Blood passes through it, but click the chamber it goes into.',
    'sl-valves': 'That is a semilunar valve. Blood passes through it, but click the vessel it goes into.',
    coronary: 'Those are the coronary arteries, the heart muscle’s own supply. They are not on this route.'
  };

  var UID = 0;
  function route(spec) {
    var box = h('div', 'widget rt');
    box.appendChild(L.head(spec.title || 'Trace the route', spec.ask, 'Click the body'));

    var wrap = h('div', 'rt__wrap');
    var map = h('div', 'rt__map');
    var svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet'); svg.setAttribute('class', 'rt__svg'); svg.setAttribute('role', 'group');
    svg.setAttribute('aria-label', 'The body, with the heart cut open and the lungs, liver, kidneys and small intestine, and the blood vessels between them. Click the parts in the order the blood passes through them, or choose them from the list.');
    svg.innerHTML = '<defs></defs>';
    var tag = h('div', 'tag rt__tag', '<span class="tag__pill"></span>'); tag.setAttribute('aria-hidden', 'true');
    map.appendChild(svg); map.appendChild(tag);
    var loading = h('p', 'rt__loading', 'Drawing the body…'); map.appendChild(loading);

    var side = h('div', 'rt__side');
    var pick = h('div', 'rt__pick'); pick.setAttribute('role', 'group'); pick.setAttribute('aria-label', 'Choose a puzzle');
    var task = h('div', 'rt__task');
    var trail = h('ol', 'rt__trail'); trail.setAttribute('aria-label', 'Your route so far');
    var say = h('p', 'rt__say'); say.setAttribute('aria-live', 'polite');
    var tools = h('div', 'rt__tools');
    var hintB = h('button', 'wbtn wbtn--quiet', 'Hint'); hintB.type = 'button';
    var againB = h('button', 'wbtn wbtn--quiet', 'Start this puzzle again'); againB.type = 'button';
    var nextB = h('button', 'wbtn', 'Next puzzle →'); nextB.type = 'button'; nextB.hidden = true;
    var namesB = h('button', 'wbtn wbtn--quiet', 'Hide the names'); namesB.type = 'button'; namesB.setAttribute('aria-pressed', 'false');
    tools.appendChild(hintB); tools.appendChild(againB); tools.appendChild(namesB); tools.appendChild(nextB);
    var listD = document.createElement('details'); listD.className = 'rt__list';
    listD.innerHTML = '<summary>Or choose from a list</summary>';
    var listBox = h('div', 'rt__listbox');
    LIST.forEach(function (id) {
      var b = h('button', 'rt__lb', esc(NAME[id])); b.type = 'button';
      b.addEventListener('click', function () { choose(id); });
      listBox.appendChild(b);
    });
    listD.appendChild(listBox);
    side.appendChild(pick); side.appendChild(task); side.appendChild(trail); side.appendChild(say); side.appendChild(tools); side.appendChild(listD);
    wrap.appendChild(map); wrap.appendChild(side);
    box.appendChild(wrap);
    box.appendChild(h('p', 'widget__note', 'Red is oxygenated blood and blue is deoxygenated blood, as on every diagram; real blood is never blue. On the body, the heart is cut open and seen from the front, so its right side is on your left. Each organ is drawn with one bed of capillaries.'));

    var solved = {}, cur = 0, got = [], wrong = 0, names = true, draw = null;
    PUZZLES.forEach(function (p, i) {
      var b = h('button', 'rt__pb', String(i + 1) + (p.sup ? ' <small>S</small>' : '')); b.type = 'button';
      b.setAttribute('aria-label', 'Puzzle ' + (i + 1) + ': ' + p.title + (p.sup ? ' (Supplement)' : ''));
      b.addEventListener('click', function () { start(i); });
      pick.appendChild(b);
    });

    function lightRoute() {
      if (!draw) return;
      var on = {}; on[PUZZLES[cur].start] = 1; got.forEach(function (id) { on[id] = 1; });
      Array.prototype.forEach.call(svg.querySelectorAll('[data-part]'), function (e) {
        if (e.classList.contains('cd__hit')) return;
        var p = e.getAttribute('data-part');
        e.classList.toggle('rt-on', !!on[p]);
        e.classList.toggle('rt-dim', !on[p] && !e.closest('.cd__heart'));
      });
    }
    function paint() {
      var P = PUZZLES[cur], done = got.length === P.steps.length;
      Array.prototype.forEach.call(pick.children, function (b, i) { b.classList.toggle('is-on', i === cur); b.classList.toggle('is-solved', !!solved[i]); });
      task.innerHTML = '<span class="rt__n">Puzzle ' + (cur + 1) + ' of ' + PUZZLES.length + (P.sup ? ' · Supplement' : '') + '</span>' +
        '<b class="rt__title">' + esc(P.title) + '</b>' +
        '<span class="rt__how">Start: <i>' + esc(NAME[P.start]) + '</i>. ' + (done ? 'Done.' : 'Click the next part: ' + (P.steps.length - got.length) + ' to go.') + '</span>';
      var arr = '<li class="rt__arr" aria-hidden="true">→</li>';
      trail.innerHTML = '<li class="rt__t rt__t--start">' + esc(NAME[P.start]) + '</li>' + got.map(function (id) { return arr + '<li class="rt__t">' + esc(NAME[id]) + '</li>'; }).join('') +
        (done ? '' : arr + '<li class="rt__t rt__t--next" aria-hidden="true">?</li>');
      nextB.hidden = !done || cur === PUZZLES.length - 1;
      hintB.disabled = done;
      lightRoute();
    }
    function start(i) {
      cur = i; got = []; wrong = 0;
      say.className = 'rt__say'; say.textContent = '';
      paint();
    }
    function choose(id) {
      var P = PUZZLES[cur];
      if (got.length === P.steps.length) return;
      var want = P.steps[got.length], last = got.length ? got[got.length - 1] : P.start;
      if (id === want) {
        got.push(id);
        if (got.length === P.steps.length) {
          solved[cur] = true;
          say.className = 'rt__say is-done';
          say.innerHTML = '<b>Route complete' + (wrong ? '' : ', with no wrong clicks') + '.</b> ' + esc([P.start].concat(got).map(function (x) { return NAME[x]; }).join(' → ')) + '.';
        } else {
          say.className = 'rt__say is-right';
          say.textContent = 'Yes: from the ' + NAME[last] + ' to the ' + NAME[id] + '.';
        }
        paint();
        return;
      }
      wrong++;
      var g = draw && draw.G[id];
      var why = WHY[want + '|' + id] || NOT_A_ROUTE[id] ||
        (NAME[id] ? 'Not next. The blood is in the ' + NAME[last] + '. Where does it go from there?'
          : g ? 'That is the ' + g.label.toLowerCase() + '. It is not on this route.' : 'Not on this route.');
      say.className = 'rt__say is-wrong';
      say.textContent = why;
    }
    hintB.addEventListener('click', function () {
      var P = PUZZLES[cur]; if (got.length === P.steps.length) return;
      var want = P.steps[got.length];
      say.className = 'rt__say is-hint';
      say.textContent = 'Next: the ' + NAME[want] + '. Find it on the body.';
      if (draw) {
        var e = draw.elFor(want);
        Array.prototype.forEach.call(svg.querySelectorAll('[data-part="' + want + '"]'), function (x) { if (!x.classList.contains('cd__hit')) { x.classList.remove('rt-hint'); void x.getBoundingClientRect(); x.classList.add('rt-hint'); } });
        if (e && names) draw.pin(e, NAME[want], null);
      }
    });
    againB.addEventListener('click', function () { start(cur); });
    nextB.addEventListener('click', function () { if (cur < PUZZLES.length - 1) start(cur + 1); });
    namesB.addEventListener('click', function () {
      names = !names; namesB.setAttribute('aria-pressed', names ? 'false' : 'true');
      namesB.textContent = names ? 'Hide the names' : 'Show the names';
      box.classList.toggle('rt--nonames', !names);
      if (!names) tag.classList.remove('on');
    });

    /* the body is drawn once the widget is on the page: the beds are laid out by measuring the
       organs, which needs the drawing to be in the document */
    var tries = 0;
    function init() {
      if (!box.isConnected || !global.CircDraw) { if (tries++ < 200) setTimeout(init, 60); return; }
      draw = global.CircDraw(svg, {
        map: map, tag: tag,
        onEnter: function (id, target) { if (!names) return; var nm = NAME[id] || (draw.G[id] && draw.G[id].label); if (nm) draw.pin(target, nm.charAt(0).toUpperCase() + nm.slice(1), draw.G[id] ? draw.G[id].colour : null); },
        onLeave: function () { tag.classList.remove('on'); },
        onClick: function (id) { choose(id); }
      });
      draw.__seek(.15, 3);                         /* one still moment of the beat: cells in place, nothing moving */
      draw.jump({ x: 470, y: 486, w: 340, h: 640 });
      loading.remove();
      paint();
    }
    setTimeout(init, 0);
    box.__seek = function (t) { var i = Math.max(0, Math.min(PUZZLES.length - 1, Math.floor(t))); start(i); var n = Math.round((t - i) * 100); for (var k = 0; k < n && k < PUZZLES[i].steps.length; k++) choose(PUZZLES[i].steps[k]); return PUZZLES.length; };
    paint();
    return box;
  }

  L.add('route', route);
})(window);
