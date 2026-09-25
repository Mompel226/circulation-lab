/* ============================================================
   terms.js — the colour language of the Learn tab, for Topic 9, Transport in animals.

   · Four inks, one per part of the story: HEART (crimson) for the pump, its chambers and
     valves; VESSEL (amber) for the arteries, veins and capillaries and the routes they take;
     BLOOD (violet) for what blood is made of and what it does; HEALTH (teal) for exercise,
     measuring the heart and coronary heart disease.
   · Red and blue are NOT inks here: on the plate they mean oxygenated and deoxygenated blood,
     and a word printed in red would say something about oxygen that the sentence does not.
   · Green is the app's own colour and means nothing in the text.
   · A word with a definition but no colour of its own carries the quiet dotted rule.
   Same API as the other labs' terms.js, so app.js is the same code.

   What a mark promises — Daniel's rule, the same in every lab:
     a magnifying glass   a picture opens where you are
     a faint dotted rule  the definition opens where you are
     an arrow             you are taken to another station
   The arrow is only for a journey with something at the other end; one arrow per
   destination per station; never a word inside a negative.

   Audited 26 Sep 2026, as a student in doubt (Daniel: "when the student clicks that word, where is
   it taking the student? Is the student going to learn more about that? ... if you make too many
   things take you somewhere, it's going to be a bit overwhelming"):
     · an arrow only in the sentences of "What you need to know" (Terms.teach), never in an
       animation's steps, a caption, a Did-you-know card or the Going further list, where a jump
       would pull the student out of what they are doing: there the word opens its definition;
     · an arrow only for a word with something at the other end (GOES_THERE), at most one in a sentence;
     · one mark per idea per station: "clot", "clots" and "blood clot" open the same definition,
       so only the first of them is marked;
     · "heart" is never dotted: no student in this topic is in doubt about it.
   ============================================================ */
(function (global) {
  'use strict';

  var CATS = {
    heart:  { n: '', label: 'The heart', chip: false },
    vessel: { n: '', label: 'Blood vessels and routes', chip: false },
    blood:  { n: '', label: 'Blood', chip: false },
    health: { n: '', label: 'Exercise, measuring and health', chip: false },
    plain:  { n: '', label: 'Words used across the labs', chip: false }
  };

  var CHIP_WORDS = {};

  var PLAIN_WORDS = {
    heart:  ['heart', 'hearts', 'atrium', 'atria', 'left atrium', 'right atrium', 'ventricle', 'ventricles', 'left ventricle', 'right ventricle',
             'septum', 'muscular wall', 'cardiac muscle', 'valve', 'valves', 'one-way valve', 'one-way valves', 'atrioventricular valve', 'atrioventricular valves',
             'semilunar valve', 'semilunar valves', 'cardiac cycle', 'systole', 'diastole', 'pacemaker', 'sinoatrial node',
             'circulatory system', 'single circulation', 'double circulation', 'pump', 'gills'],
    vessel: ['artery', 'arteries', 'vein', 'veins', 'capillary', 'capillaries', 'arteriole', 'arterioles', 'venule', 'venules', 'lumen', 'elastic fibres',
             'aorta', 'vena cava', 'pulmonary artery', 'pulmonary arteries', 'pulmonary vein', 'pulmonary veins', 'renal artery', 'renal arteries', 'renal vein', 'renal veins',
             'hepatic artery', 'hepatic vein', 'hepatic veins', 'hepatic portal vein', 'coronary artery', 'coronary arteries', 'blood vessel', 'blood vessels',
             'blood pressure', 'tissue fluid'],
    blood:  ['blood', 'plasma', 'red blood cell', 'red blood cells', 'white blood cell', 'white blood cells', 'platelet', 'platelets', 'haemoglobin', 'oxyhaemoglobin',
             'lymphocyte', 'lymphocytes', 'phagocyte', 'phagocytes', 'phagocytosis', 'antibody', 'antibodies', 'antigen', 'antigens',
             'clotting', 'blood clot', 'blood clots', 'clot', 'clots', 'fibrinogen', 'fibrin', 'scab', 'oxygenated', 'deoxygenated', 'photomicrograph', 'photomicrographs'],
    health: ['heart rate', 'pulse', 'pulse rate', 'ECG', 'electrocardiogram', 'stethoscope', 'physical activity', 'exercise',
             'coronary heart disease', 'CHD', 'atheroma', 'plaque', 'thrombus', 'risk factor', 'risk factors', 'genetic predisposition', 'cholesterol', 'saturated fat', 'saturated fats',
             'lactic acid', 'oxygen debt', 'aerobic respiration', 'anaerobic respiration',
             'independent variable', 'dependent variable', 'control variable', 'control variables', 'controlled variable', 'controlled variables',
             'hypothesis', 'research question', 'trial', 'trials', 'anomalous result', 'anomalous results', 'mean', 'range', 'results table', 'line graph', 'bar chart', 'risk assessment'],
    plain:  ['diffusion', 'diffuse', 'diffuses', 'concentration gradient', 'respiration', 'respire', 'respires', 'glucose', 'oxygen', 'carbon dioxide', 'urea', 'hormone', 'hormones',
             'ion', 'ions', 'nutrient', 'nutrients', 'pathogen', 'pathogens', 'nucleus', 'nuclei', 'cell membrane', 'mitochondrion', 'mitochondria', 'surface area',
             'organ', 'organs', 'tissue', 'tissues', 'enzyme', 'enzymes', 'vertebrate', 'vertebrates', 'mammal', 'mammals', 'fish',
             'standard deviation', 'accuracy', 'precision', 'reliability', 'validity', 'systematic error', 'random error', 'resolution']
  };

  /* --------- what happens when you click a term ---------
     peek : a small picture appears where you clicked — for a thing you need to SEE
     jump : go to the station where the word is properly explained
     The pictures are added station by station, from the lab's own pictures (assets/photos). */
  var PEEK = {};
  var S2 = 'From the 9.2 lesson slides', S3 = 'From the 9.3 lesson slides', S4 = 'From the 9.4 lesson materials', OX = 'OpenStax, Anatomy and Physiology 2e · CC BY 4.0';
  [
    ['stethoscope', 'stethoscope-900.jpg', 'A <b>stethoscope</b>: the chestpiece rests on the chest, and the tubes carry the sounds of the valves closing to the earpieces.', S2],
    ['coronary artery', 'coronary-cast-900.jpg', 'The <b>coronary arteries</b>, as a resin cast: they branch from the base of the aorta and spread over the whole of the heart muscle.', S2],
    ['coronary arteries', 'coronary-cast-900.jpg', 'The <b>coronary arteries</b>, as a resin cast: they branch from the base of the aorta and spread over the whole of the heart muscle.', S2],
    ['septum', 'heart-dissected-900.jpg', 'The <b>septum</b> in a real heart cut in half: the thick wall of muscle between the two ventricles.', S2],
    ['atrioventricular valves', 'heart-valves-above-900.jpg', 'The <b>atrioventricular valves</b>, at the back, seen from above with the atria removed: the tricuspid valve on the right side of the heart and the bicuspid valve on the left.', OX],
    ['semilunar valves', 'heart-valves-above-900.jpg', 'The <b>semilunar valves</b>, at the front, seen from above: the aortic and pulmonary valves, each with three pocket-shaped cusps.', OX],
    ['red blood cells', 'blood-smear-900.jpg', '<b>Red blood cells</b> in a stained smear: pale pink discs with no nucleus, paler in the middle where each cell is thinnest.', S4],
    ['phagocyte', 'blood-smear-900.jpg', 'A <b>phagocyte</b> (top left): a white blood cell with a lobed nucleus and a granular cytoplasm.', S4],
    ['phagocytes', 'blood-smear-900.jpg', 'A <b>phagocyte</b> (top left): a white blood cell with a lobed nucleus and a granular cytoplasm.', S4],
    ['lymphocyte', 'blood-smear-900.jpg', 'A <b>lymphocyte</b> (top right): a white blood cell with a large round nucleus that almost fills it.', S4],
    ['lymphocytes', 'blood-smear-900.jpg', 'A <b>lymphocyte</b> (top right): a white blood cell with a large round nucleus that almost fills it.', S4],
    ['platelets', 'blood-smear-900.jpg', '<b>Platelets</b>: the tiny purple specks between the red blood cells, fragments of cells with no nucleus.', S4],
    ['plasma', 'blood-centrifuged-900.jpg', '<b>Plasma</b>: the yellow liquid at the top when blood is spun in a centrifuge. The red blood cells sink to the bottom.', 'From the 9.4 lesson slides'],
    ['hepatic portal vein', 'liver-vessels-900.jpg', 'The <b>hepatic portal vein</b>, labelled "portal vein" here: it brings blood from the small intestine into the liver.', S3]
  ].forEach(function (e) { PEEK[e[0]] = [e[1], e[2], e[3]]; });

  /* the same word, different station: a picture that is right in one place can be wrong in another */
  var CONTEXT = {};

  /* statistics words that open a worked explanation when clicked (the Plants Lab has them): none in this lab */
  var STAT = {};

  var JUMP = {};
  function jump(list, st) { list.forEach(function (w) { JUMP[w] = st; }); }
  jump(['circulatory system', 'pump', 'one-way valve', 'one-way valves'], 'system');
  jump(['single circulation', 'double circulation', 'gills'], 'double');
  jump(['atrium', 'atria', 'left atrium', 'right atrium', 'ventricle', 'ventricles', 'left ventricle', 'right ventricle', 'septum', 'muscular wall', 'cardiac muscle',
        'atrioventricular valve', 'atrioventricular valves', 'semilunar valve', 'semilunar valves', 'valve', 'valves'], 'heart');
  jump(['cardiac cycle', 'systole', 'diastole', 'pacemaker', 'sinoatrial node'], 'beat');
  jump(['pulse', 'pulse rate', 'ECG', 'electrocardiogram', 'stethoscope'], 'monitor');
  jump(['heart rate', 'physical activity', 'lactic acid', 'oxygen debt', 'aerobic respiration', 'anaerobic respiration'], 'exercise');
  jump(['independent variable', 'dependent variable', 'control variable', 'control variables', 'controlled variable', 'controlled variables', 'hypothesis', 'research question',
        'trial', 'trials', 'anomalous result', 'anomalous results', 'results table', 'line graph', 'bar chart', 'risk assessment'], 'plan');
  jump(['coronary heart disease', 'CHD', 'coronary artery', 'coronary arteries', 'atheroma', 'plaque', 'thrombus', 'risk factor', 'risk factors', 'genetic predisposition', 'cholesterol', 'saturated fat', 'saturated fats'], 'chd');
  jump(['artery', 'arteries', 'vein', 'veins', 'capillary', 'capillaries', 'arteriole', 'arterioles', 'venule', 'venules', 'lumen', 'elastic fibres', 'blood pressure', 'tissue fluid'], 'vessels');
  jump(['aorta', 'vena cava', 'pulmonary artery', 'pulmonary arteries', 'pulmonary vein', 'pulmonary veins', 'renal artery', 'renal arteries', 'renal vein', 'renal veins',
        'hepatic artery', 'hepatic vein', 'hepatic veins', 'hepatic portal vein'], 'routes');
  jump(['plasma', 'red blood cell', 'red blood cells', 'white blood cell', 'white blood cells', 'platelet', 'platelets', 'haemoglobin', 'oxyhaemoglobin',
        'lymphocyte', 'lymphocytes', 'phagocyte', 'phagocytes', 'phagocytosis', 'antibody', 'antibodies', 'photomicrograph', 'photomicrographs'], 'blood');
  jump(['clotting', 'blood clot', 'blood clots', 'clot', 'clots', 'fibrinogen', 'fibrin', 'scab'], 'clotting');

  /* --------- build one matcher, longest phrase first --------- */
  var ENTRIES = [];
  Object.keys(CHIP_WORDS).forEach(function (cat) { CHIP_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, true]); }); });
  Object.keys(PLAIN_WORDS).forEach(function (cat) { PLAIN_WORDS[cat].forEach(function (w) { ENTRIES.push([w, cat, false]); }); });
  ENTRIES.sort(function (a, b) { return b[0].length - a[0].length; });

  var DEFINED = {};
  (global.GLOSSARY || []).forEach(function (e) { DEFINED[e.term.toLowerCase()] = e.term; });
  /* a plural or an inflection opens the singular's definition */
  function defined(low) {
    if (DEFINED[low]) return DEFINED[low];
    var F = global.GLOSSARY_FORMS || {}; if (F[low]) return F[low];   /* the plural, the singular, the verb, an alias: worked out at build time */
    var tries = [low.replace(/ies$/, 'y'), low.replace(/ata$/, 'a'), low.replace(/s$/, ''), low.replace(/es$/, ''), low.replace(/ed$/, ''), low.replace(/ing$/, 'e'), low.replace(/ing$/, '')];
    for (var i = 0; i < tries.length; i++) if (tries[i] !== low && DEFINED[tries[i]]) return DEFINED[tries[i]];
    return null;
  }

  var KNOWN = {};
  var KNOWN_KEY = 'labs.knownWords.v1';
  try { (JSON.parse(localStorage.getItem(KNOWN_KEY) || '[]') || []).forEach(function (w) { KNOWN[w] = 1; }); } catch (e) {}
  function saveKnown() { try { localStorage.setItem(KNOWN_KEY, JSON.stringify(Object.keys(KNOWN))); } catch (e) {} }
  function setKnown(term, yes) { var low = String(term).toLowerCase(); if (yes) KNOWN[low] = 1; else delete KNOWN[low]; saveKnown(); }
  function isKnown(term) { return !!KNOWN[String(term).toLowerCase()]; }
  function forgetAll() { KNOWN = {}; saveKnown(); }
  function knownCount() { return Object.keys(KNOWN).length; }

  var INFO = {};
  ENTRIES.forEach(function (e) { if (!INFO[e[0].toLowerCase()]) INFO[e[0].toLowerCase()] = e; });

  function esc(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function escRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }
  var RE = new RegExp('(?<![A-Za-z0-9-])(' + ENTRIES.map(function (e) { return escRe(e[0]); }).join('|') + ')(?![A-Za-z0-9-])', 'gi');

  /* the words with something at the other end worth the journey: a table, a widget, a
     picture, the part itself. Everything else with a definition opens it in place. */
  var GOES_THERE = {};
  ['circulatory system', 'single circulation', 'double circulation', 'atrium', 'atria', 'ventricle', 'ventricles', 'septum',
   'atrioventricular valve', 'atrioventricular valves', 'semilunar valve', 'semilunar valves', 'cardiac cycle',
   'pulse', 'pulse rate', 'ECG', 'electrocardiogram', 'heart rate', 'physical activity',
   'independent variable', 'dependent variable', 'controlled variable', 'controlled variables', 'results table', 'line graph', 'bar chart',
   'coronary heart disease', 'coronary arteries', 'coronary artery', 'risk factors',
   'artery', 'arteries', 'vein', 'veins', 'capillary', 'capillaries',
   'aorta', 'vena cava', 'pulmonary artery', 'pulmonary vein', 'renal artery', 'renal vein', 'hepatic artery', 'hepatic vein', 'hepatic portal vein',
   'red blood cells', 'white blood cells', 'platelets', 'plasma', 'lymphocyte', 'lymphocytes', 'phagocyte', 'phagocytes', 'phagocytosis',
   'clotting', 'fibrinogen', 'fibrin'].forEach(function (w) { GOES_THERE[w] = true; });

  var here = null, seen = null, quiet = false, wentTo = null, teaching = false, arrowed = false;
  var NEVER_DOTTED = { heart: 1, hearts: 1 };
  /* The pictures this station is about to put on the page. A magnifier that opens one of
     them shows the reader what is already in front of them — worst where the caption of a
     picture uses the very word, so the word beside the dark dust opens the dark dust. Where
     that would happen the word takes its definition instead, which is the next thing it has
     to give. */
  var SHOWN = {};
  function setShown(m) { SHOWN = m || {}; }
  function setStation(id) { here = id; seen = Object.create(null); quiet = false; wentTo = Object.create(null); }
  /* a widget built afresh (its reset) marks its words as it did the first time: forget what it introduced */
  function unsee(words, jumps) {
    if (seen) (words || []).forEach(function (w) { var low = String(w).toLowerCase(), d = defined(low); delete seen[low]; if (d) delete seen[d.toLowerCase()]; });
    if (wentTo) (jumps || []).forEach(function (j) { delete wentTo[j]; });
  }
  function setQuiet(v) { quiet = !!v; }
  function teach(v) { teaching = !!v; }

  var U0 = '', U1 = '';
  function underlineMarks(escaped) { return escaped.replace(/_([^_\n]{1,240})_/g, U0 + '$1' + U1); }
  function underlineTags(html) {
    return html.replace(new RegExp(U0 + '([\\s\\S]*?)' + U1, 'g'), function (m, inner) {
      return '<u class="syl-u">' + inner.replace(/<i class="tc__n">[^<]*<\/i>/g, '').replace(/<\/?[bi][^>]*>/g, '') + '</u>';
    });
  }

  /* a word inside a negative is a word about something that is NOT there */
  var NEGATED = /(?:^|[\s(—-])(?:no|not|non|never|without|neither|nor|lack|lacks|lacking|nothing)\s+(?:[a-z]+\s+){0,2}$/i;


  /* ---- a word can be a glossary word and still be the wrong word ----
     The glossary matches on spelling. "Control" as a verb is not the control in an experiment;
     "mean" as a verb ("that means") is not the average; "range" of a value is the statistic only
     where numbers are about; "plaque" on teeth is not the plaque in an artery; "pump" as a verb
     stays plain after "to". Each rule says: this spelling, in this context, is not the glossary's
     sense — leave it alone. Add to it rather than removing a word from the glossary. */
  var NOT_HERE = {
    'control':  [{ after: /^\s+(the|it|them|this|these|for|every|all|each|how)\b/i }],
    'mean':     [{ before: /\b(this|that|which|it|they|does|do|will|would|can|could|may|might|not)\s+$/i }, { after: /^\s+(that|the|a|an|you|it|to)\b/i }],
    'range':    [{ after: /^\s+of\s+(activities|exercises|things|ways|foods|sizes|shapes)/i }],
    'pump':     [{ before: /\b(to|can|will|must|they|it|and|ones)\s+$/i }, { after: /^\s+(blood|it|them)\b/i }],
    'pulse':    [{ after: /^\s+(of|through)\b/i }],
    'plaque':   [{ before: /\b(dental|tooth|teeth)\s+$/i }, { after: /^\s+on\s+(the\s+)?(teeth|tooth)/i }]
  };
  function wrongSense(low, before, after, whole) {
    var rules = NOT_HERE[low];
    if (!rules) return false;
    for (var i = 0; i < rules.length; i++) {
      var r = rules[i];
      if (r.before && r.before.test(before)) return true;
      if (r.after && r.after.test(after)) return true;
      if (r.unlessWhole && !r.unlessWhole.test(whole) && here !== r.orStation) return true;   /* the glossary's sense needs this context, and it is not here */
    }
    return false;
  }

  function mark(text) {
    arrowed = false;                              /* one arrow in a sentence at most */
    return underlineTags(underlineMarks(esc(text)).replace(RE, function (m, _g, at, whole) {
      var low = m.toLowerCase(), e = INFO[low];
      if (!e) return m;
      if (STAT[low]) return '<b class="t t--plain is-stat" data-stat="' + STAT[low] + '" data-term="' + esc(m) + '" tabindex="0" role="button">' + m + '</b>';
      /* a word inside a syllabus phrase (_..._) is underlined, never clickable: it does not use up the
         word's one mark, so the next time the word comes it is offered */
      var raw = String(whole).slice(0, at);
      if (raw.lastIndexOf(U0) > raw.lastIndexOf(U1)) return m;
      var before = raw.replace(/<[^>]*>/g, '');
      if (NEGATED.test(before)) return m;
      if (wrongSense(low, before, String(whole).slice(at + m.length).replace(/<[^>]*>/g, ''), String(whole).replace(/<[^>]*>/g, ''))) return m;
      var cat = e[1], act = '', cls = '';
      var def = defined(low), idea = def ? def.toLowerCase() : low;     /* "clots" and "blood clot" are one idea */
      var first = !quiet && !(seen && (seen[low] || seen[idea]));
      if (seen) { seen[low] = true; seen[idea] = true; }
      if (!first) return m;
      if (NEVER_DOTTED[low]) def = null;
      var ctx = (CONTEXT[here] || {})[low];
      var canJump = teaching && !arrowed;
      var pk0 = ctx || PEEK[low];
      if (pk0 && !SHOWN[pk0[0]]) {
        var pk = pk0;
        act = ' data-peek="' + pk[0] + '" data-note="' + esc(pk[1]) + '"' + (pk[2] ? ' data-credit="' + esc(pk[2]) + '"' : '') + ' tabindex="0" role="button"';
        cls = ' is-peek';
      } else if (JUMP[low] === here) {
        return '<b class="t t--' + cat + '">' + m + '</b>';
      } else if (canJump && JUMP[low] && GOES_THERE[low] && !(wentTo && wentTo[JUMP[low]])) {
        if (wentTo) wentTo[JUMP[low]] = true;
        arrowed = true;
        act = ' data-jump="' + JUMP[low] + '" tabindex="0" role="button"';
        cls = ' is-jump';
      } else if (def && !KNOWN[def.toLowerCase()]) {
        act = ' data-gloss="' + esc(def) + '" tabindex="0" role="button"';
        cls = ' is-gloss';
      }
      return '<b class="t t--' + cat + cls + '"' + act + (act ? ' data-term="' + esc(m) + '"' : '') + '>' + m + '</b>';
    }));
  }

  function legend() {
    var out = '<p class="legend__intro">Each ink is one part of the circulatory system. On the body, red is oxygenated blood and blue is deoxygenated blood.</p><div class="legend">';
    ['heart', 'vessel', 'blood', 'health'].forEach(function (c) {
      out += '<span class="legend__i"><b class="t t--' + c + '">' + CATS[c].label + '</b></span>';
    });
    out += '</div>';
    return out;
  }

  global.Terms = { setKnown: setKnown, isKnown: isKnown, forgetAll: forgetAll, knownCount: knownCount, mark: mark, legend: legend, unsee: unsee,
                   CATS: CATS, setStation: setStation, setQuiet: setQuiet, setShown: setShown, teach: teach, PEEK: PEEK, JUMP: JUMP };
})(window);

/* A number never parts from its unit at a line break — 20 °C, 5 min, 48 mm, 60 %, 4 marks, pH 2 — wherever the page
   writes one: the theory, a question, the bench, a pop-up, the syllabus. The join is made in the text itself as the
   page changes, so nothing that renders text has to remember to do it. */
(function () {
  var UNIT = /(\d)[ \t]+(%|°C|°|mm³\/min|mm\/min|mm³|mm|cm³|cm|dm³|m\b|km\b|µm\b|μm\b|nm\b|min\b|minutes?\b|seconds?\b|s\b|hours?\b|h\b|days?\b|weeks?\b|years?\b|kg\b|mg\b|g\b|ml\b|l\b|kPa\b|kJ\b|J\b|runs?\b|trials?\b|marks?\b|leaves\b|grams?\b|degrees?\b|metres?\b|litres?\b|per cent\b|chews?\b|drops?\b)/g;
  var LEAD = /\b(pH|[Dd]ay|[Tt]ube|Paper|Topic|Question|Stage|Step|Figure|Fig\.)[ \t]+(\d)/g;
  function fix(t) {
    var p = t.parentNode; if (!p || p.nodeType !== 1) return;
    var tag = p.tagName; if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'OPTION') return;
    var v = t.nodeValue; if (!/\d/.test(v)) return;
    var n = v.replace(UNIT, '$1\u00A0$2').replace(LEAD, '$1\u00A0$2');
    if (n !== v) t.nodeValue = n;
  }
  function join(node) {
    if (!node) return;
    if (node.nodeType === 3) { fix(node); return; }
    if (node.nodeType !== 1 && node.nodeType !== 11) return;
    var w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT), t, list = [];
    while ((t = w.nextNode())) list.push(t);
    list.forEach(fix);
  }
  function watch() {
    join(document.body);
    new MutationObserver(function (recs) {
      recs.forEach(function (r) { if (r.type === 'characterData') fix(r.target); else for (var i = 0; i < r.addedNodes.length; i++) join(r.addedNodes[i]); });
    }).observe(document.body, { subtree: true, childList: true, characterData: true });
  }
  if (document.body) watch(); else document.addEventListener('DOMContentLoaded', watch);
  window.KeepUnits = { join: join };
})();
