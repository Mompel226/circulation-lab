/* ============================================================
   w-heart3d.js — "Explore a real heart": a real human heart in 3D, cut open, with the blood
   flowing through it and the valves under the reader's control.

     { after: 1, type: 'heart3d', title: 'Explore a real heart', ask: '…' }

   A classic script, loaded after js/learn.js. It builds the widget and its words; the 3D scene
   is js/heart3d.js, an ES module fetched with import() only when the widget comes on screen, so
   the page pays nothing for three.js until a reader reaches the heart. Without WebGL, or if the
   module cannot load, the same widget works on the lab's own 2D section (heart-art.js).

   Three tabs:
     Explore     turn it, zoom, cut it open along the four-chamber plane, press a part to name it
     Blood flow  the heart as glass, beating, all four chambers facing you: blue deoxygenated
                 blood in the right side, red oxygenated blood in the left, each chamber and
                 vessel outlined and named, the blood filling and leaving each chamber by volume
     The valves  set each valve open or closed for each stage of a beat and see what the blood
                 does; then "Play the beat", one stage at a time, each holding until Next step

   THE BIOLOGY (sources in the head of heart3d.js: OpenStax Anatomy and Physiology 2e, 19.1 and
   19.3, CC BY 4.0; the lab's own syllabus, 0610 9.2.1, 9.2.7–9.2.10):
     both atria contract together, then both ventricles; a valve has no muscle and is moved only
     by the pressure of the blood; the atrioventricular and semilunar valves are never both
     open; the heart sounds are valves CLOSING — "lub" atrioventricular, "dub" semilunar; the
     thick left ventricle wall PRODUCES the higher pressure (never "to withstand" it).
   What a wrong setting does is the real consequence: an atrioventricular valve open while the
   ventricles contract lets blood back into the atrium (regurgitation, as in a leaking mitral
   valve); a semilunar valve open while the ventricles relax lets blood fall back from the
   artery (as in aortic regurgitation); an atrium contracting against a shut valve pushes blood
   back into the veins, which have no valves where they enter the atria.
   ============================================================ */
(function (global) {
  'use strict';
  var CL = global.CircLearn;
  var beyondOpen = false;
  if (!CL) return;
  var h = CL.h, esc = CL.esc, mk = CL.mk, head = CL.head;

  /* where this script came from: the module and the model sit beside it, stamped the same way */
  var ME = document.currentScript, SRC = (ME && ME.src) || '';
  var STAMP = (/[?&]v=([^&#]+)/.exec(SRC) || [])[1] || '1';
  var BASE = SRC ? SRC.replace(/[^\/?#]*(\?.*)?$/, '') : 'js/';
  var MODULE = BASE + 'heart3d.js?v=' + STAMP;
  var MODEL = BASE + '../assets/3d/heart.glb';
  var MODEL_MB = '0.4 MB';

  /* ---------- the parts: syllabus name, the specific name, and one short caption ---------- */
  var PART = {
    ra: { name: 'right atrium', cap: 'Receives deoxygenated blood from the body through the vena cava. It contracts to push blood into the right ventricle.' },
    la: { name: 'left atrium', cap: 'Receives oxygenated blood from the lungs through four pulmonary veins. It contracts to push blood into the left ventricle.' },
    rv: { name: 'right ventricle', cap: 'Pumps deoxygenated blood to the lungs through the pulmonary artery. Its muscular wall is thinner than the wall of the left ventricle.' },
    lv: { name: 'left ventricle', cap: 'Pumps oxygenated blood through the aorta to the whole body. Its wall is about three times as thick as the wall of the right ventricle.' },
    septum: { name: 'septum', cap: 'The wall of muscle between the left and right sides. It keeps oxygenated and deoxygenated blood apart.' },
    valve_tri: { name: 'atrioventricular valve', sub: 'tricuspid · right', cap: 'The right atrioventricular valve has three cusps. It closes when the ventricles contract and prevents backflow into the right atrium.' },
    valve_mit: { name: 'atrioventricular valve', sub: 'mitral (bicuspid) · left', cap: 'The left atrioventricular valve has two cusps. It closes when the ventricles contract and prevents backflow into the left atrium.' },
    valve_pul: { name: 'semilunar valve', sub: 'pulmonary', cap: 'Three pocket-shaped cusps at the base of the pulmonary artery. They close when the ventricles relax and prevent backflow into the right ventricle.' },
    valve_aor: { name: 'semilunar valve', sub: 'aortic', cap: 'Three pocket-shaped cusps at the base of the aorta. They close when the ventricles relax and prevent backflow into the left ventricle.' },
    aorta: { name: 'aorta', cap: 'The largest artery. It carries oxygenated blood from the left ventricle to the whole body.' },
    pulmonary_artery: { name: 'pulmonary artery', cap: 'Carries deoxygenated blood from the right ventricle to the lungs. It divides into a branch for each lung.' },
    pulmonary_veins: { name: 'pulmonary vein', cap: 'Four pulmonary veins, two from each lung, bring oxygenated blood to the left atrium.' },
    vena_cava: { name: 'vena cava', cap: 'Two venae cavae bring deoxygenated blood from the body to the right atrium.' },
    vena_cava_sup: { name: 'vena cava', sub: 'superior', cap: 'Brings deoxygenated blood from the head, neck and arms to the right atrium.' },
    vena_cava_inf: { name: 'vena cava', sub: 'inferior', cap: 'Brings deoxygenated blood from the lower body to the right atrium.' },
    coronary: { name: 'coronary artery', cap: 'Coronary arteries branch from the aorta just above the aortic valve. They supply the heart muscle with oxygen and glucose.' },
    papillary: { name: 'papillary muscle', beyond: true, cap: 'A small muscle in the ventricle wall. Tendons, the chordae tendineae, join it to the cusps and prevent them being pushed into the atrium.' }
  };
  /* the cut surface of a wall: the muscular wall itself (0610 9.2.1, and S 9.2.8) */
  var WALLCAP = {
    lv: 'The thickest wall in the heart. More muscle contracts with more force and produces a higher pressure, to pump blood round the whole body.',
    rv: 'About a third as thick as the wall of the left ventricle. It pumps blood only to the lungs, which are close by.',
    ra: 'Thinner than the wall of a ventricle. The atria push blood only a short distance, into the ventricles just below them.',
    la: 'Thinner than the wall of a ventricle. The atria push blood only a short distance, into the ventricles just below them.',
    septum: 'The wall of muscle between the two ventricles. It keeps oxygenated and deoxygenated blood apart.'
  };
  function partKey(id) { return /^pap_/.test(id) ? 'papillary' : id; }
  var NAME_ALL = ['ra', 'la', 'rv', 'lv', 'septum', 'aorta', 'pulmonary_artery', 'vena_cava', 'pulmonary_veins', 'coronary',
                  'valve_tri', 'valve_mit', 'valve_pul', 'valve_aor', 'papillary'];
  var LIST = [['ra', 'right atrium'], ['la', 'left atrium'], ['rv', 'right ventricle'], ['lv', 'left ventricle'], ['septum', 'septum'],
              ['valve_tri', 'atrioventricular valve (tricuspid)'], ['valve_mit', 'atrioventricular valve (mitral)'],
              ['valve_pul', 'semilunar valve (pulmonary)'], ['valve_aor', 'semilunar valve (aortic)'],
              ['aorta', 'aorta'], ['pulmonary_artery', 'pulmonary artery'], ['pulmonary_veins', 'pulmonary veins'],
              ['vena_cava_sup', 'vena cava (superior)'], ['vena_cava_inf', 'vena cava (inferior)'], ['coronary', 'coronary arteries'],
              ['papillary', 'papillary muscles']];

  /* ---------- one beat ----------
     The correct valve settings of each stage, which chambers squeeze, and the step captions. */
  var STAGES = [
    { key: 'A', name: 'The atria contract', correct: { tri: true, mit: true, pul: false, aor: false }, atria: [0, 1], vent: [0, 0],
      step: 'The atria contract. Blood passes through the open atrioventricular valves into the ventricles. The semilunar valves are closed.',
      right: 'Correct. The atria contract and push blood through the open atrioventricular valves into the ventricles. The semilunar valves stay closed.' },
    { key: 'V', name: 'The ventricles contract', correct: { tri: false, mit: false, pul: true, aor: true }, atria: [1, 0], vent: [0, 1], sound: 'lub',
      step: 'The ventricles contract. The atrioventricular valves close (“lub”) and prevent backflow into the atria. Blood passes through the semilunar valves into the arteries.',
      right: 'Correct. The atrioventricular valves close and prevent backflow into the atria. Blood is pumped through the semilunar valves into the arteries.' },
    { key: 'D', name: 'The ventricles relax', correct: { tri: true, mit: true, pul: false, aor: false }, atria: [0, 0], vent: [1, 0], sound: 'dub',
      step: 'The ventricles relax. The semilunar valves close (“dub”) and prevent backflow into the ventricles. Blood flows from the atria into the ventricles.',
      right: 'Correct. The semilunar valves close and prevent backflow into the ventricles. Blood flows from the atria through the open atrioventricular valves.' }
  ];
  var VK = ['tri', 'mit', 'pul', 'aor'];
  var VNAME = { tri: 'tricuspid', mit: 'mitral', pul: 'pulmonary', aor: 'aortic' };
  var VTYPE = { tri: 'right atrioventricular', mit: 'left atrioventricular', pul: 'semilunar, right', aor: 'semilunar, left' };
  var SIDEW = { tri: 'right', mit: 'left', pul: 'right', aor: 'left' };
  var ARTERY = { pul: 'the pulmonary artery', aor: 'the aorta' };
  var BED = { pul: 'the lungs', aor: 'the body' };

  /* What the blood does on one side in one stage with these two valves: the volume that passes from the
     veins into the atrium, through the atrioventricular valve, through the semilunar valve, and from the
     artery on to the lungs or the body, as a fraction of one stroke volume (+ forward, − backward).
     With the right valves one beat moves one stroke volume through every valve and returns every
     chamber to where it began (the atrium gives the last quarter of the filling: OpenStax 19.3, 20-30 %),
     so beat after beat no blood piles up anywhere. */
  function rates(key, av, sl) {
    if (key === 'A') {            /* atria contract; ventricles relaxed, at low pressure */
      return { in: av ? 0 : -0.25,              /* against a shut valve the atrium pushes blood back into the veins */
               av: av ? 0.25 : 0,               /* the atria top the ventricles up */
               sl: sl ? -0.4 : 0,               /* an open semilunar valve lets blood fall back from the artery */
               out: 0.16 };                     /* the arteries' elastic recoil keeps the blood moving on */
    }
    if (key === 'V') {            /* ventricles contract; pressure in them rises above atria and arteries */
      return { in: 0.4,                         /* the atria fill from the veins */
               av: av ? (sl ? -0.5 : -1) : 0,   /* regurgitation into the atrium */
               sl: sl ? (av ? 0.6 : 1) : 0,
               out: sl ? 0.5 : 0.3 };
    }
    /* ventricles relax; pressure in them falls below atria and arteries */
    return { in: 0.6, av: av ? 0.75 : 0, sl: sl ? -0.5 : 0, out: 0.34 };
  }
  /* the words for each wrong setting — one valve at a time, the real consequence */
  function wrongLine(key, v, isOpen) {
    var Vn = 'The ' + VNAME[v] + ' valve', side = SIDEW[v];
    var av = v === 'tri' || v === 'mit';
    if (key === 'A') {
      if (av) return Vn + ' is closed. The ' + side + ' atrium contracts, but blood cannot pass into the ventricle. It returns to the veins.';
      return Vn + ' is open. The ventricle is relaxed, so blood flows backwards from ' + ARTERY[v] + ' into it.';
    }
    if (key === 'V') {
      if (av) return Vn + ' is open. As the ventricle contracts, blood is forced back into the ' + side + ' atrium. This backflow is called regurgitation.';
      return Vn + ' is closed. No blood can leave the ' + side + ' ventricle, so none reaches ' + BED[v] + '.';
    }
    if (av) return Vn + ' is closed. The ' + side + ' ventricle cannot fill, so blood collects in the atrium and the veins.';
    return Vn + ' is open. Blood flows backwards from ' + ARTERY[v] + ' into the relaxed ventricle. This backflow is called regurgitation.';
  }
  function outcome(si, vs) {
    var st = STAGES[si], lines = [];
    VK.forEach(function (v) { if (!!vs[v] !== st.correct[v]) lines.push(wrongLine(st.key, v, !!vs[v])); });
    if ((vs.tri && vs.pul) || (vs.mit && vs.aor)) lines.push('An atrioventricular valve and a semilunar valve are never open at the same time.');
    return lines.length ? { ok: false, lines: lines } : { ok: true, lines: [st.right] };
  }
  /* a plan the 3D view can play: one stage that holds, or the whole beat */
  var SLOW = [1.1, 2.0, 2.3], REAL = [0.1, 0.27, 0.43];   /* seconds; real: OpenStax 19.3, 75 beats a minute */
  function seg(si, vs, dur, hold, real) {
    var st = STAGES[si], R = rates(st.key, vs.tri, vs.pul), L = rates(st.key, vs.mit, vs.aor);
    /* blood reaches the veins from the body steadily: each stage's share of one stroke volume */
    R.body = L.body = real ? REAL[si] / 0.8 : SLOW[si] / 5.4;
    return { stage: st.key, dur: dur, hold: hold, valves: vs, atria: st.atria, vent: st.vent, rates: { R: R, L: L } };
  }
  function beatPlan(real) {
    return STAGES.map(function (st, i) { return seg(i, st.correct, real ? REAL[i] : SLOW[i], false, real); });
  }
  function stagePlan(si, vs) { return [seg(si, vs, 3.2, true)]; }

  function still() { return !!(global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches); }
  function coarse() { return !!(global.matchMedia && global.matchMedia('(pointer: coarse)').matches) || (global.innerWidth || 1000) < 700; }

  /* =======================================================================
     the widget
     ======================================================================= */
  CL.add('heart3d', function (spec) {
    var box = h('div', 'widget h3');
    box.appendChild(head(spec.title || 'Explore a real heart', spec.ask || '', 'Turn · cut · press'));

    /* tabs */
    var tabs = h('div', 'h3__tabs'); tabs.setAttribute('role', 'tablist'); tabs.setAttribute('aria-label', 'What to do with the heart');
    var MODES = [['explore', 'Explore'], ['flow', 'Blood flow'], ['valves', 'The valves']];
    var tabBtn = {};
    MODES.forEach(function (m, i) {
      var b = h('button', 'h3__tab' + (i ? '' : ' is-on'), esc(m[1])); b.type = 'button';
      b.setAttribute('role', 'tab'); b.setAttribute('aria-selected', i ? 'false' : 'true');
      b.addEventListener('click', function () { setMode(m[0]); });
      tabs.appendChild(b); tabBtn[m[0]] = b;
    });
    /* the controls: the tabs and their panels. The stage stands between them in the text, and on a wide
       screen in the plate's column instead, while you are level with these (CircLearn.stage) */
    var ctrl = h('div', 'h3__ctrl');
    ctrl.appendChild(tabs);
    box.appendChild(ctrl);

    /* the stage */
    var stage = h('div', 'h3__stage');
    var load = h('div', 'h3__load', '<span class="h3__loadt">The heart loads when you reach it (' + MODEL_MB + ').</span><span class="h3__bar"><i></i></span>');
    load.setAttribute('role', 'status');
    stage.appendChild(load);
    var where = h('p', 'h3__where', 'Front view'); stage.appendChild(where);
    var vbar = h('div', 'h3__views'); vbar.setAttribute('role', 'group'); vbar.setAttribute('aria-label', 'Turn the heart to a view');
    var VIEWS = [['front', 'Front'], ['back', 'Back'], ['section', 'Cut face']];
    var viewBtn = {};
    VIEWS.forEach(function (v) {
      var b = h('button', 'h3__vb', esc(v[1])); b.type = 'button'; b.setAttribute('data-view', v[0]);
      b.addEventListener('click', function () { if (view) { view.view(v[0]); setWhere(v[0] === 'section' && mode === 'flow' ? 'chambers' : v[0]); } });
      if (v[0] === 'section') b.hidden = true;
      vbar.appendChild(b); viewBtn[v[0]] = b;
    });
    stage.appendChild(vbar);
    /* turning with buttons (Daniel, 25 Sep: "can you add maybe arrows so that ... if I just want to turn it
       I click those arrows and it turns more easily, and then if I just want to flip it then I can use
       the mouse"): a press turns the heart 30 degrees, the way a drag in that direction would; holding the
       button keeps it turning */
    var pad = h('div', 'h3__pad'); pad.setAttribute('role', 'group'); pad.setAttribute('aria-label', 'Turn the heart');
    var TURNS = [['up', '▲', 'Tip the heart up', 0, 1], ['left', '◀', 'Turn the heart left', 1, 0], ['right', '▶', 'Turn the heart right', -1, 0], ['down', '▼', 'Tip the heart down', 0, -1]];
    TURNS.forEach(function (t) {
      var b = h('button', 'h3__turn h3__turn--' + t[0], '<span aria-hidden="true">' + t[1] + '</span>'); b.type = 'button';
      b.setAttribute('aria-label', t[2]);
      var hold = null;
      function stop() { if (hold) { clearTimeout(hold); hold = null; } if (view) view.spin(0, 0); b.classList.remove('is-held'); }
      b.addEventListener('pointerdown', function (e) {
        if (!view || e.button > 0) return;
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch (x) {}
        view.turn(t[3] * 30, t[4] * 30); setWhere('own');
        hold = setTimeout(function () { hold = null; b.classList.add('is-held'); view.spin(t[3] * 70, t[4] * 70); }, 420);
      });
      b.addEventListener('pointerup', stop); b.addEventListener('pointercancel', stop); b.addEventListener('lostpointercapture', stop);
      /* the keyboard: Enter or Space turns one step */
      b.addEventListener('click', function (e) { if (e.detail === 0 && view) { view.turn(t[3] * 30, t[4] * 30); setWhere('own'); } });
      pad.appendChild(b);
    });
    stage.appendChild(pad);
    var hint = h('p', 'h3__hint', coarse() ? 'Arrows or drag to turn · pinch to zoom · tap a part' : 'Arrows or drag to turn · scroll to zoom · press a part to name it');
    stage.appendChild(hint);
    /* the colour key (Daniel, 25 Sep: "you should add a legend ... I see blue and I see red"): the blood
       and the outline of the side of the heart that carries it share a colour */
    var legend = h('p', 'h3__legend', '<span class="h3__key"><span class="h3__sw h3__sw--deo"></span>deoxygenated blood · right side</span>' +
      '<span class="h3__key"><span class="h3__sw h3__sw--oxy"></span>oxygenated blood · left side</span>');
    legend.hidden = true; stage.appendChild(legend);
    /* what the beat is doing now, on the heart itself */
    var stageCap = h('p', 'h3__stagecap'); stageCap.setAttribute('aria-hidden', 'true'); stageCap.hidden = true; stage.appendChild(stageCap);
    function capStage(k) {
      if (k == null || k < 0 || mode === 'explore') { stageCap.hidden = true; return; }
      var st = STAGES[k];
      stageCap.innerHTML = '<b>' + (k + 1) + ' of 3</b> ' + esc(st.name) + (st.sound ? ' <i>' + st.sound + '</i>' : '');
      stageCap.hidden = false;
    }
    ctrl.appendChild(stage);

    /* ---------- Explore panel ---------- */
    var pEx = h('div', 'h3__panel'); pEx.setAttribute('data-for', 'explore');
    var cutRow = h('div', 'h3__row h3__row--cut');
    var cutLab = h('label', 'h3__cut');
    cutLab.innerHTML = '<span class="h3__cutname">Cut open</span>';
    var cut = document.createElement('input'); cut.type = 'range'; cut.min = '0'; cut.max = '100'; cut.step = '1'; cut.value = '0';
    cut.className = 'h3__range'; cut.setAttribute('aria-describedby', '');
    var cutWrap = h('span', 'h3__rangewrap'); cutWrap.appendChild(cut);
    cutWrap.appendChild(h('span', 'h3__tick', '<i></i>four chambers'));
    cutLab.appendChild(cutWrap);
    var cutVal = h('span', 'h3__cutval', 'whole heart'); cutLab.appendChild(cutVal);
    cutRow.appendChild(cutLab);
    var names = h('button', 'wbtn h3__names', 'Name every part'); names.type = 'button'; names.setAttribute('aria-pressed', 'false');
    cutRow.appendChild(names);
    pEx.appendChild(cutRow);
    var info = h('div', 'h3__info'); info.setAttribute('aria-live', 'polite');
    pEx.appendChild(info);
    var pickRow = h('div', 'h3__row h3__row--pick');
    var sel = document.createElement('select'); sel.className = 'h3__select'; sel.setAttribute('aria-label', 'Choose a part to name');
    sel.innerHTML = '<option value="">Or choose a part from the list…</option>' + LIST.map(function (p) { return '<option value="' + p[0] + '">' + esc(p[1]) + '</option>'; }).join('');
    pickRow.appendChild(sel);
    pEx.appendChild(pickRow);
    var cutNote = h('p', 'h3__note', 'The cut follows the heart’s own long axis. This cut shows all four chambers together, like the diagram in your book. The heart sits turned in the chest, so the cut is tilted from the body’s frontal plane.');
    cutNote.hidden = true; pEx.appendChild(cutNote);
    ctrl.appendChild(pEx);

    /* ---------- Blood flow panel ---------- */
    var pFl = h('div', 'h3__panel'); pFl.setAttribute('data-for', 'flow'); pFl.hidden = true;
    var flRow = h('div', 'h3__row');
    var flPlay = h('button', 'h3__play', '❚❚ Pause'); flPlay.type = 'button';
    flRow.appendChild(flPlay);
    var spd = h('div', 'h3__seg'); spd.setAttribute('role', 'group'); spd.setAttribute('aria-label', 'Speed');
    var spSlow = h('button', 'h3__segb is-on', 'Slow motion'), spReal = h('button', 'h3__segb', 'Real speed');
    [spSlow, spReal].forEach(function (b, i) { b.type = 'button'; b.setAttribute('aria-pressed', i ? 'false' : 'true'); spd.appendChild(b); });
    flRow.appendChild(spd);
    pFl.appendChild(flRow);
    /* one side at a time (Daniel: "be able to remove maybe the left side and the right side of the heart"):
       the other side fades to a trace and its blood is hidden */
    var sideRow = h('div', 'h3__row h3__row--side');
    sideRow.appendChild(h('span', 'h3__lead', 'Show'));
    var sideSeg = h('div', 'h3__seg'); sideSeg.setAttribute('role', 'group'); sideSeg.setAttribute('aria-label', 'Which side of the heart to show');
    var sideNow = null, sideBtns = {};
    [[null, 'Both sides'], ['R', 'Right side'], ['L', 'Left side']].forEach(function (o) {
      var b = h('button', 'h3__segb' + (o[0] === null ? ' is-on' : ''), esc(o[1])); b.type = 'button';
      b.setAttribute('aria-pressed', o[0] === null ? 'true' : 'false');
      b.addEventListener('click', function () { setSide(o[0]); });
      sideSeg.appendChild(b); sideBtns[String(o[0])] = b;
    });
    sideRow.appendChild(sideSeg);
    pFl.appendChild(sideRow);
    pFl.appendChild(h('p', 'h3__note h3__note--tip', 'Follow one side at a time. The right side takes deoxygenated blood from the body to the lungs; the left side takes oxygenated blood from the lungs to the body. Both sides beat together.'));
    function setSide(sd) {
      sideNow = sd;
      Object.keys(sideBtns).forEach(function (k) { var on = k === String(sd); sideBtns[k].classList.toggle('is-on', on); sideBtns[k].setAttribute('aria-pressed', on ? 'true' : 'false'); });
      if (view) { view.showSide(sd); view.labels(labelList()); }
    }
    var flStages = h('ol', 'h3__stages');
    STAGES.forEach(function (st, i) {
      var li = h('li', 'h3__stg'); var b = h('button', 'h3__stgb', '<span class="h3__num">' + (i + 1) + '</span>' + esc(st.name) + (st.sound ? ' <span class="h3__snd">' + st.sound + '</span>' : ''));
      b.type = 'button'; b.addEventListener('click', function () { flowStill(i); });
      li.appendChild(b); flStages.appendChild(li);
    });
    pFl.appendChild(flStages);
    var flCap = h('p', 'h3__cap'); pFl.appendChild(flCap);
    pFl.appendChild(h('p', 'h3__note', 'Blue is deoxygenated blood and red is oxygenated blood, as in every diagram. Real deoxygenated blood is dark red, never blue.'));
    ctrl.appendChild(pFl);

    /* ---------- Valves panel ---------- */
    var pVa = h('div', 'h3__panel'); pVa.setAttribute('data-for', 'valves'); pVa.hidden = true;
    pVa.appendChild(h('p', 'h3__intro', 'In a real heart, only the pressure of the blood opens and closes the valves. Here you set them yourself, to see what each one does.'));
    var stPick = h('div', 'h3__seg h3__seg--stages'); stPick.setAttribute('role', 'group'); stPick.setAttribute('aria-label', 'Stage of the beat');
    var stBtns = STAGES.map(function (st, i) {
      var b = h('button', 'h3__segb' + (i ? '' : ' is-on'), '<span class="h3__num">' + (i + 1) + '</span>' + esc(st.name)); b.type = 'button';
      b.setAttribute('aria-pressed', i ? 'false' : 'true');
      b.addEventListener('click', function () { chooseStage(i); });
      stPick.appendChild(b); return b;
    });
    pVa.appendChild(stPick);
    var vgrid = h('div', 'h3__vgrid');
    var vBtns = {};
    VK.forEach(function (v) {
      var b = h('button', 'h3__valve h3__valve--' + v); b.type = 'button'; b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { setValve(v, !settings[stageIdx][v]); });
      vgrid.appendChild(b); vBtns[v] = b;
    });
    pVa.appendChild(vgrid);
    var runRow = h('div', 'h3__row');
    var run = h('button', 'h3__run', '▶ Run this stage'); run.type = 'button';
    runRow.appendChild(run);
    var score = h('span', 'h3__score'); runRow.appendChild(score);
    pVa.appendChild(runRow);
    var result = h('div', 'h3__result'); result.setAttribute('aria-live', 'polite');
    pVa.appendChild(result);
    /* Play the beat: the right settings, one stage at a time, each holding until Next step */
    var beat = h('div', 'h3__beat');
    beat.appendChild(h('div', 'h3__beath', 'Play the beat <small>The correct valves, one stage at a time</small>'));
    var bBar = h('div', 'h3__row');
    var bPlay = h('button', 'h3__bplay'); bPlay.type = 'button';
    var bAll = h('button', 'h3__ball', '<span aria-hidden="true">▶▶</span> Play all'); bAll.type = 'button';
    var bCount = h('span', 'h3__count');
    bBar.appendChild(bPlay); bBar.appendChild(bAll); bBar.appendChild(bCount);
    beat.appendChild(bBar);
    var bSteps = h('ol', 'h3__steps');
    STAGES.forEach(function (st, i) {
      var li = h('li', 'h3__step'); var b = h('button', 'h3__stepb', '<span class="h3__num">' + (i + 1) + '</span><span class="h3__stept"><b>' + esc(st.name) + '</b><span class="h3__stepp">' + esc(st.step) + '</span></span>');
      b.type = 'button'; b.addEventListener('click', function () { goStep(i); });
      li.appendChild(b); bSteps.appendChild(li);
    });
    beat.appendChild(bSteps);
    var bNow = h('p', 'h3__sr'); bNow.setAttribute('aria-live', 'polite'); beat.appendChild(bNow);
    pVa.appendChild(beat);
    ctrl.appendChild(pVa);

    /* ---------- beyond the syllabus, closed ---------- */
    var more = document.createElement('details'); more.className = 'h3__beyond';
    more.innerHTML = '<summary><span class="h3__ibchip">IB</span> Beyond the syllabus: what starts each beat</summary>' +
      '<div class="h3__bybody"><p class="h3__bybanner"><b>Not in IGCSE 0610.</b> IB Biology, higher level: B3.2.15 and B3.2.16.</p>' +
      '<p>The wall of the heart is <b>cardiac muscle</b>: branched cells joined end to end. It contracts all your life and does not tire.</p>' +
      '<p>Each beat starts in the <b>sinoatrial node</b>, the pacemaker, in the wall of the right atrium near the vena cava. Its electrical signal spreads across both atria, so they contract together.</p>' +
      '<p>At the <b>atrioventricular node</b> the signal is delayed by about 0.1 s, so the atria finish contracting first. It then passes down the septum to the apex, and the ventricles contract from the bottom up.</p>' +
      '<p>At 75 beats a minute one beat lasts 0.8 s. The atria contract for about 0.1 s; the ventricles contract for about 0.27 s and relax for about 0.43 s. <b>Real speed</b> in the Blood flow tab uses these times.</p>' +
      '<p>At the start of each contraction and relaxation of the ventricles, all four valves are closed for a moment. The pressure changes, but no blood moves.</p>' +
      '<p class="h3__golink"><button type="button" class="wbtn h3__goecg">See the signal spread, and why an ECG has peaks and troughs →</button>' +
      '<span class="h3__golinkw">in Monitoring the heart</span></p>' +
      '<p class="h3__src">Sources: IB Biology guide, first assessment 2025, B3.2.15–B3.2.16 · OpenStax, <i>Anatomy and Physiology</i> 2e (2022), sections 19.2 and 19.3, CC BY 4.0.</p></div>';
    box.appendChild(more);
    /* opened once, it stays open when the station is drawn again (the ECG link's way back) */
    if (beyondOpen) more.open = true;
    more.addEventListener('toggle', function () { beyondOpen = more.open; });
    /* Daniel, 25 Sep: from here, "click a button so that it takes you to then the ECG simulation" */
    more.querySelector('.h3__goecg').addEventListener('click', function () {
      if (!(CL.goToWidget && CL.goToWidget('monitor', '.es', 'the ECG simulation'))) location.hash = 'monitor';
    });
    box.appendChild(h('p', 'h3__credit', 'The heart is a real one: HuBMAP Human Reference Atlas (Browne and Schlehlein 2024), from the Visible Human Male, US National Library of Medicine. CC BY 4.0. The moving valve cusps, the tendons and the blood paths are added for this lab.'));

    /* =====================================================================
       state
       ===================================================================== */
    var view = null, loading = false, failed = false, flat = null;
    var mode = 'explore', selected = null, allNames = false;
    var stageIdx = 0, settings = STAGES.map(function () { return { tri: false, mit: false, pul: false, aor: false }; });
    var solved = [false, false, false];
    var shown = { tri: true, mit: true, pul: false, aor: false };     /* what the 3D valves show now */
    var flowReal = false, flowPaused = false;
    var steps = { started: false, k: -1, playing: false, all: false };
    var NAMES = {};                        /* label words handed to the 3D view (mutated for valve states) */
    Object.keys(PART).forEach(function (k) { NAMES[k] = { name: PART[k].name, sub: PART[k].sub || '' }; });
    Object.keys(WALLCAP).forEach(function (k) { NAMES[k + '#wall'] = { name: 'muscular wall', sub: 'of the ' + PART[k].name }; });

    function setWhere(v) {
      where.innerHTML = v === 'own' ? 'Your own view<span class="h3__where2"><br>press Front to return</span>'
        : v === 'back' ? 'Back view' : v === 'section' ? 'The cut face<span class="h3__where2"><br>right side on your left</span>'
        : v === 'chambers' ? 'Four chambers facing you<span class="h3__where2"><br>right side on your left</span>'
        : 'Front view<span class="h3__where2"><br>right side on your left</span>';
      var on = v === 'chambers' ? 'section' : v;
      Object.keys(viewBtn).forEach(function (k) { viewBtn[k].classList.toggle('is-on', k === on); });
    }
    setWhere('front');

    /* ---------- Explore: names ---------- */
    function showInfo(id, wall) {
      if (!id) { info.innerHTML = '<b>Press any part of the heart</b><small>Its name, and what it does, appear here. Cut the heart open to see inside.</small>'; return; }
      var k = partKey(id), p = PART[k] || { name: k, cap: '' };
      if (wall && WALLCAP[k]) {
        info.innerHTML = '<b>muscular wall</b><span class="h3__of">of the ' + esc(p.name) + '</span><small>' + mk(WALLCAP[k]) + '</small>';
        return;
      }
      info.innerHTML = '<b>' + esc(p.name) + '</b>' + (p.sub ? '<span class="h3__of">' + esc(p.sub) + '</span>' : '') +
        (p.beyond ? '<span class="h3__tag">not named in 0610</span>' : '') + '<small>' + mk(p.cap) + '</small>';
    }
    function labelList() {
      if (mode === 'valves') return ['valve_tri', 'valve_mit', 'valve_pul', 'valve_aor'];
      /* while the blood flows, the chambers and the vessels are named, so you can say where it is */
      if (mode === 'flow') return sideNow === 'R' ? ['ra', 'rv', 'vena_cava', 'pulmonary_artery'] : sideNow === 'L' ? ['la', 'lv', 'pulmonary_veins', 'aorta']
        : ['ra', 'la', 'rv', 'lv', 'vena_cava', 'pulmonary_artery', 'pulmonary_veins', 'aorta'];
      /* the valves are inside: from outside a whole heart only the wall of the aorta round them shows */
      var l = allNames ? NAME_ALL.filter(function (x) { return +cut.value > 0 || !/^valve_/.test(x); }) : [];
      if (selected) { var s = partKey(selected) === 'papillary' ? 'papillary' : selected; l = l.filter(function (x) { return x !== s && !(s.indexOf('vena_cava') === 0 && x === 'vena_cava'); }); l.unshift(selWall ? s + '#wall' : s); }
      return l;
    }
    var selWall = false;
    function pick(id, wall, fromList) {
      if (mode !== 'explore') { if (id && /^valve_/.test(id) && mode === 'valves') { /* a press on a valve in the valve tab toggles it */ setValve(id.slice(6), !settings[stageIdx][id.slice(6)]); } return; }
      /* pressed from outside a whole heart, the "semilunar valve" of the scan is the root of its artery:
         the cusps are inside it */
      if (!fromList && +cut.value === 0 && id === 'valve_aor') id = 'aorta';
      if (!fromList && +cut.value === 0 && id === 'valve_pul') id = 'pulmonary_artery';
      selected = id ? (partKey(id) === 'papillary' ? 'papillary' : id) : null;
      selWall = !!(id && wall && WALLCAP[id]);
      showInfo(id, wall);
      sel.value = selected && LIST.some(function (p) { return p[0] === selected; }) ? selected : '';
      if (view) { view.select(selected); view.labels(labelList()); }
      if (flat) flat.select(selected);
    }
    names.addEventListener('click', function () {
      allNames = !allNames; names.setAttribute('aria-pressed', allNames ? 'true' : 'false'); names.classList.toggle('is-on', allNames);
      if (view) view.labels(labelList());
      if (flat) flat.names(allNames);
    });
    sel.addEventListener('change', function () {
      if (!sel.value) return;
      var id = sel.value; pick(id === 'papillary' ? 'pap_lv_al' : id, false, true);
    });
    function cutText(k) { return k <= 0 ? 'whole heart' : Math.abs(k - 0.5) < 0.04 ? 'four chambers' : k < 0.5 ? 'the front taken off' : 'towards the back'; }
    cut.addEventListener('input', function () {
      var k = +cut.value / 100;
      if (Math.abs(k - 0.5) < 0.04) { k = 0.5; }
      cutVal.textContent = cutText(k);
      cut.setAttribute('aria-valuetext', cutText(k));
      viewBtn.section.hidden = k <= 0;
      if (k > 0 && cutNote.hidden) cutNote.hidden = false;
      if (view) { view.setCut(k); if (k > 0) setWhere('section'); if (allNames) view.labels(labelList()); }
      if (flat) flat.cut(k);
    });

    /* ---------- tabs ---------- */
    function setMode(m) {
      if (m === mode && view) return;
      stopSteps(); mode = m;
      Object.keys(tabBtn).forEach(function (k) { var on = k === m; tabBtn[k].classList.toggle('is-on', on); tabBtn[k].setAttribute('aria-selected', on ? 'true' : 'false'); });
      [pEx, pFl, pVa].forEach(function (p) { p.hidden = p.getAttribute('data-for') !== m; });
      legend.hidden = m === 'explore';
      if (m !== 'flow' && sideNow) setSide(null);
      capStage(-1);
      box.classList.toggle('h3--live', m !== 'explore');
      if (m !== 'explore') { cut.value = '0'; cutVal.textContent = cutText(0); selected = null; selWall = false; showInfo(null); sel.value = ''; if (view) view.select(null); }
      /* the blood is easiest to follow with all four chambers facing you: the heart turned to the plane
         of the book's diagram, not cut. The same button is the cut face in Explore. */
      viewBtn.section.textContent = m === 'flow' ? 'Four chambers' : 'Cut face';
      viewBtn.section.hidden = m === 'flow' ? false : m === 'explore' ? +cut.value <= 0 : true;
      if (m !== 'valves') valveNamesBack();
      if (view) {
        view.setMode(m);
        if (m === 'flow') { view.view('section'); setWhere('chambers'); }
        else if (m !== 'explore') { view.view('front'); setWhere('front'); }
        if (m === 'flow') startFlow();
        if (m === 'valves') { chooseStage(stageIdx); }
        view.labels(labelList());
      }
      if (flat) flat.mode(m);
      if (m === 'valves') paintValves();
    }

    /* ---------- Blood flow ---------- */
    function paintStages(k) {
      capStage(k);
      Array.prototype.forEach.call(flStages.children, function (li, i) { li.classList.toggle('is-on', i === k); });
      flCap.textContent = k >= 0 ? STAGES[k].step : '';
    }
    function startFlow() {
      if (!view) return;
      flowPaused = false; syncFlowBtn();
      if (still()) { flowStill(0); return; }
      view.reseed('A');                /* the beat starts where a beating heart would be as the atria contract */
      view.play(beatPlan(flowReal), { loop: true, from: STAGES[2].correct, onStep: function (k) { paintStages(k); } });
    }
    /* a stage pressed in the list: the beat stops there, on the end of that stage, until Play */
    function flowStill(i) {
      if (!view) return;
      view.reseed(STAGES[i].key);
      view.play([seg(i, STAGES[i].correct, SLOW[i], true)], { still: true, from: STAGES[(i + 2) % 3].correct });
      paintStages(i); flowPaused = true; syncFlowBtn();
    }
    function syncFlowBtn() { flPlay.innerHTML = flowPaused ? '▶ Play' : '❚❚ Pause'; flPlay.hidden = still(); }
    flPlay.addEventListener('click', function () {
      if (!view) return;
      flowPaused = !flowPaused; syncFlowBtn();
      if (flowPaused) view.pause(); else if (view.playing && !view.playing()) { startFlow(); } else view.resume();
    });
    [spSlow, spReal].forEach(function (b, i) {
      b.addEventListener('click', function () {
        flowReal = i === 1;
        spSlow.classList.toggle('is-on', !flowReal); spReal.classList.toggle('is-on', flowReal);
        spSlow.setAttribute('aria-pressed', flowReal ? 'false' : 'true'); spReal.setAttribute('aria-pressed', flowReal ? 'true' : 'false');
        if (mode === 'flow') startFlow();
      });
    });

    /* ---------- The valves ---------- */
    function paintValves() {
      var s = settings[stageIdx];
      VK.forEach(function (v) {
        var b = vBtns[v], on = !!s[v];
        b.setAttribute('aria-pressed', on ? 'true' : 'false');
        b.classList.toggle('is-open', on);
        b.innerHTML = '<span class="h3__vn">' + esc(VNAME[v][0].toUpperCase() + VNAME[v].slice(1)) + '</span><span class="h3__vt">' + esc(VTYPE[v]) + '</span>' +
          '<span class="h3__vs">' + (on ? 'open' : 'closed') + '</span>';
        b.setAttribute('aria-label', VNAME[v] + ' valve, ' + VTYPE[v] + ': ' + (on ? 'open' : 'closed') + '. Press to ' + (on ? 'close' : 'open') + ' it.');
      });
      stBtns.forEach(function (b, i) { b.classList.toggle('is-on', i === stageIdx); b.setAttribute('aria-pressed', i === stageIdx ? 'true' : 'false'); b.classList.toggle('is-done', solved[i]); });
      var n = solved.filter(Boolean).length;
      score.textContent = n === 3 ? 'All three stages right.' : n + ' of 3 stages right';
    }
    /* on the stage, in the valve tab, each valve is named on one line with what it is doing now, so all
       four fit beside the heart; the buttons below give the full names */
    function valveWords(vs) {
      VK.forEach(function (v) { NAMES['valve_' + v].name = VNAME[v] + ' valve · ' + (vs[v] ? 'open' : 'closed'); NAMES['valve_' + v].sub = ''; });
    }
    function valveNamesBack() {
      VK.forEach(function (v) { var p = PART['valve_' + v]; NAMES['valve_' + v].name = p.name; NAMES['valve_' + v].sub = p.sub || ''; });
    }
    function chooseStage(i) {
      stopSteps(); stageIdx = i; result.innerHTML = ''; result.className = 'h3__result';
      paintValves(); capStage(i);
      result.innerHTML = '<p class="h3__ask2">Stage ' + (i + 1) + ' of 3: <b>' + esc(STAGES[i].name.toLowerCase()) + '</b>. Set each valve open or closed, then press Run.</p>';
      var vs = settings[i]; shown = Object.assign({}, vs);
      if (view && mode === 'valves') { view.stop(); view.reseed(STAGES[i].key); view.setValves(vs); valveWords(vs); view.labels(labelList()); }
      if (flat) flat.valves(vs, STAGES[i]);
    }
    function setValve(v, open) {
      settings[stageIdx][v] = open; solved[stageIdx] = false;
      paintValves();
      var vs = settings[stageIdx]; shown = Object.assign({}, vs);
      if (view) { view.stop(); view.setValves(vs); valveWords(vs); view.labels(labelList()); }
      if (flat) flat.valves(vs, STAGES[stageIdx]);
    }
    run.addEventListener('click', function () {
      stopSteps();
      var vs = Object.assign({}, settings[stageIdx]), o = outcome(stageIdx, vs);
      result.className = 'h3__result ' + (o.ok ? 'is-ok' : 'is-bad');
      result.innerHTML = '<ul>' + o.lines.map(function (l) { return '<li>' + mk(l) + '</li>'; }).join('') + '</ul>' +
        (o.ok && stageIdx < 2 ? '<p class="h3__next"><button type="button" class="wbtn h3__nextb">Next: stage ' + (stageIdx + 2) + '</button></p>' : '') +
        (o.ok && solved.filter(Boolean).length === 2 && !solved[stageIdx] ? '<p class="h3__next">Now press <b>Play the beat</b> to see the three stages one after another.</p>' : '');
      var nb = result.querySelector('.h3__nextb'); if (nb) nb.addEventListener('click', function () { chooseStage(stageIdx + 1); });
      if (o.ok) solved[stageIdx] = true;
      paintValves();
      if (view) {
        view.reseed(STAGES[stageIdx].key);
        var from = stageIdx === 0 ? STAGES[2].correct : STAGES[stageIdx - 1].correct;
        view.play(stagePlan(stageIdx, vs), { from: from, still: still() });
        valveWords(vs); view.labels(labelList());
      }
      if (flat) flat.valves(vs, STAGES[stageIdx], o);
    });

    /* ---------- Play the beat: each step plays, then waits for Next step ---------- */
    function syncSteps() {
      var k = steps.k, ended = steps.started && k === STAGES.length - 1 && !steps.playing;
      bPlay.innerHTML = steps.playing ? '<span aria-hidden="true">❚❚</span> Pause' : ended ? '<span aria-hidden="true">↻</span> Play again' :
        !steps.started ? '<span aria-hidden="true">▶</span> Play' : '<span aria-hidden="true">▶</span> Next step';
      bPlay.classList.toggle('is-next', steps.started && !steps.playing && !ended);
      bAll.hidden = still();
      bCount.textContent = steps.started ? 'Step ' + (k + 1) + ' of ' + STAGES.length : STAGES.length + ' steps';
      Array.prototype.forEach.call(bSteps.children, function (li, i) {
        li.classList.toggle('is-on', steps.started && i === k);
        li.classList.toggle('is-done', steps.started && i < k);
      });
    }
    function stopSteps() { if (steps.playing && view) view.stop(); steps.playing = false; steps.all = false; syncSteps(); }
    function goStep(i) {
      if (!view && !flat) return;
      steps.started = true; steps.k = i; steps.playing = !still();
      bNow.textContent = 'Step ' + (i + 1) + ': ' + STAGES[i].step;
      capStage(i);
      var vs = STAGES[i].correct; shown = Object.assign({}, vs);
      valveWords(vs);
      if (view) {
        if (i === 0) view.reseed('A');
        view.play(stagePlan(i, vs), { from: STAGES[(i + 2) % 3].correct, still: still(), onDone: function () {
          steps.playing = false;
          if (steps.all && steps.k < STAGES.length - 1) { goStep(steps.k + 1); return; }
          steps.all = false; syncSteps();
        } });
        view.labels(labelList());
      }
      if (flat) { flat.valves(vs, STAGES[i]); steps.playing = false; }
      syncSteps();
    }
    bPlay.addEventListener('click', function () {
      if (steps.playing) { if (view) view.pause(); steps.playing = false; steps.paused = true; syncSteps(); return; }
      if (steps.paused && view) { steps.paused = false; steps.playing = true; view.resume(); syncSteps(); return; }
      var ended = steps.started && steps.k === STAGES.length - 1;
      goStep(!steps.started || ended ? 0 : steps.k + 1);
    });
    bAll.addEventListener('click', function () { steps.all = true; goStep(!steps.started || steps.k === STAGES.length - 1 ? 0 : steps.k + 1); });
    syncSteps();

    /* =====================================================================
       loading: only when the widget is on screen
       ===================================================================== */
    var bar = load.querySelector('.h3__bar i'), loadT = load.querySelector('.h3__loadt');
    function start() {
      if (view || loading || failed || flat) return;
      loading = true;
      loadT.textContent = 'Loading the heart (' + MODEL_MB + ')…';
      import(MODULE).then(function (M) {
        if (!M.webglAvailable()) throw new Error('no WebGL');
        return M.mount(stage, {
          model: MODEL, names: NAMES, reduced: still(), coarse: coarse(), test: !!global.__H3TEST,
          ariaLabel: 'A real human heart, from the front. Its right side is on your left. Use the buttons below the heart to cut it open, name its parts and control its valves.',
          onProgress: function (a, b) { if (b) bar.style.width = Math.round(a / b * 100) + '%'; },
          onPick: pick,
          onInteract: function () { setWhere('own'); }
        });
      }).then(function (v) {
        loading = false;
        if (!v) return;
        if (!box.isConnected) { v.dispose(); return; }
        view = v; box.__view = v;
        load.hidden = true; box.classList.add('is-ready');
        var m = mode; mode = ''; setMode(m);
        showInfo(null);
      }).catch(function (e) {
        loading = false;
        /* the reader left the station while the model was loading (the ECG link does this): the
           fetch is cut off, but nothing failed that anyone sees, and the next visit loads afresh */
        if (!box.isConnected) return;
        failed = true;
        if (global.console) console.warn('heart3d: 3D unavailable, using the 2D section', e);
        fallback2D();
      });
    }
    showInfo(null);
    var io = null;
    if (global.IntersectionObserver) {
      io = new IntersectionObserver(function (ents) { if (ents.some(function (e) { return e.isIntersecting; })) start(); }, { rootMargin: '240px' });
      io.observe(box);
    } else setTimeout(start, 0);

    /* the lab rebuilds the panel without telling its widgets: let the scene go when this box has gone */
    var gone = 0;
    var watch = setInterval(function () {
      if (box.isConnected) { gone = 0; return; }
      if (++gone >= 2) teardown();
    }, 1500);
    function teardown() {
      clearInterval(watch);
      if (io) io.disconnect();
      if (stg) stg.detach();
      if (view) { view.dispose(); view = null; box.__view = null; }
    }
    /* the stage in the plate's column, beside the controls, while you are level with them */
    var stg = CL.stage ? CL.stage({ box: box, spec: spec, pack: stage, home: ctrl, before: function () { return pEx; }, watch: function () { return ctrl; },
      onPlace: function (inColumn) { stage.classList.toggle('h3__stage--col', inColumn); if (view) view.resize(); } }) : null;
    box.__onReset = teardown;
    box.__onMove = function () { if (stg) stg.mount(); if (view) view.resize(); };
    /* for the headless checks */
    box.__mode = setMode;
    box.__stage = function (i, vs) { chooseStage(i); if (vs) VK.forEach(function (v) { if (!!vs[v] !== !!settings[i][v]) setValve(v, !!vs[v]); }); };
    box.__seek = function (t, which) {
      if (!view) return null;
      var plan = which === 'beat' ? beatPlan(false) : stagePlan(stageIdx, settings[stageIdx]);
      var r = view.seek(plan, t, { from: stageIdx === 0 ? STAGES[2].correct : STAGES[stageIdx - 1].correct });
      valveWords(settings[stageIdx]); view.labels(labelList());
      return r;
    };
    box.__outcome = outcome;
    box.__start = start;

    /* =====================================================================
       without WebGL: the lab's own 2D section does the same jobs
       ===================================================================== */
    function fallback2D() {
      var HA = global.HeartArt;
      load.hidden = true; box.classList.add('h3--flat');
      vbar.hidden = true; hint.hidden = true;
      where.textContent = 'The heart cut open, as the exam draws it';
      var why = h('p', 'h3__note', 'This device cannot show the heart in 3D, so here is the same heart drawn as the exam draws it. Press a part to name it.');
      stage.parentNode.insertBefore(why, stage.nextSibling);
      if (!HA) return;
      var wrap = h('div', 'h3__flat');
      stage.appendChild(wrap);
      var st = { av: 1, sl: 0, atria: 0, vent: 0 };
      function draw(vs) {
        wrap.innerHTML = '<svg viewBox="-40 -70 480 540" role="img" aria-label="A section of the heart from the front: right side on your left.">' + HA.svg(st, { mode: 'section' }) + '</svg>';
        if (vs) {
          /* each valve drawn open or shut on its own */
          var pT = HA.paths({ av: vs.tri ? 1 : 0 }), pM = HA.paths({ av: vs.mit ? 1 : 0 }), pP = HA.paths({ sl: vs.pul ? 1 : 0 }), pA = HA.paths({ sl: vs.aor ? 1 : 0 });
          var av = wrap.querySelector('.ha__av'), sl = wrap.querySelector('.ha__sl');
          if (av) av.setAttribute('d', pT.tri + ' ' + pM.mit);
          if (sl) sl.setAttribute('d', pP.pulv + ' ' + pA.aov);
        }
        Array.prototype.forEach.call(wrap.querySelectorAll('[data-part]'), function (el) {
          var p = el.getAttribute('data-part');
          var map = { 'av-valves': 'valve_tri', 'sl-valves': 'valve_aor', 'pulmonary-artery': 'pulmonary_artery', 'pulmonary-vein': 'pulmonary_veins', 'vena-cava': 'vena_cava', heart: null };
          var id = p in map ? map[p] : p;
          if (!id) return;
          el.style.cursor = 'pointer';
          el.addEventListener('click', function () { pick2(id); });
        });
      }
      function pick2(id) {
        if (mode === 'explore') { selected = id; showInfo(id, false); }
      }
      flat = {
        select: function () {}, names: function () {}, cut: function () {},
        mode: function (m) { if (m === 'explore') { st = { av: 1, sl: 0, atria: 0, vent: 0 }; draw(); } else draw(settings[stageIdx]); },
        valves: function (vs, stg) {
          st = { av: 1, sl: 0, atria: stg.atria[1], vent: stg.vent[1] };
          draw(vs);
        }
      };
      draw();
    }
    return box;
  });

  /* exported for the checks: the pure logic, testable without a browser */
  CL.heart3dLogic = { STAGES: STAGES, rates: rates, outcome: outcome, beatPlan: beatPlan, stagePlan: stagePlan };
})(window);
