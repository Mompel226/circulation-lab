/* ============================================================
   circ-draw.js — the plate: the whole circulation, on a real anatomical drawing.

   The drawing is Mariana Ruiz Villarreal's "Circulatory System" (LadyofHats, Wikimedia Commons,
   public domain; js/circ-art.js), made from Gray's Anatomy and the Sobotta atlas — the same
   artist as the Digestion Lab's plate. Nothing on it is positioned by hand: every vessel is where
   the artist drew it, both arms included.

   On top of it this file adds, all made FROM the drawing:
     the blood flowing   dots move along the centre line of every drawn vessel (js/circ-flow.js,
                         traced from the drawing's own medial axis), away from the heart in the
                         arteries and towards it in the veins, surging with each beat
     lighting            a station lights its vessels and organs. The body is veiled in its own skin
                         colour, and each lit vessel is drawn again above the veil ALONG ITS OWN
                         CENTRE LINE, at its own width, in the drawing's colours — so a lit vessel
                         can never bring its neighbours with it (Daniel, 25 Sep: "make sure that
                         you highlight the right veins and arteries depending on what is selected")
     organs              clicking an organ lights it with the vessels that bring blood to it and take
                         it away: the liver with the hepatic artery, the hepatic portal vein and the
                         hepatic vein
     the heart, cut open a magnified view beside the heart, beating, with the chambers and valves
                         the heart stations light (js/heart-art.js — the cardiac-cycle widget's heart)
     a camera            fly to a part, zoom and pan with the wheel, a drag or a pinch, "Whole body"
     names               ruled out to columns at the sides, each leader level with its own part; the
                         syllabus names at every zoom, the vessels of an organ from closer, and with
                         "Beyond syllabus" every name the artist gave, each at the tip of her own arrow

   CircDraw(svg, opts) → the object js/plate.js (and the route puzzle) drive:
     light(ids) / clear()      light some parts, veil the rest; returns { colour }
     organVessels(id)          an organ with its vessels, for lighting it on its own
     lens(mode)                'section' | 'exterior' | null — the magnified heart
     heartMode(m)              which drawing the lens shows
     flyTo(box, done), jump(box), boxOf(id, pad), FULL, BOX, isZoomed(), zoomBy(k), home()
     labels(on, beyond)        the names at the sides, and the ones beyond the syllabus
     setRate(bpm), rate(), flow(on), start(), stop()
     pin(el, label, colour), elFor(id), G (every part: label, note, colour)
     __seek(ph, t)             draw one moment, for the headless checks
   ============================================================ */
(function (global) {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var ART = global.CIRC_ART, FLOW = global.CIRC_FLOW || {};
  var AW = 371, AH = 821;
  var FULL = { x: -4, y: 8, w: 379, h: 806 };
  var SKIN = '#f2f2f2';

  /* ---------- every part: what the tag and the line under the plate say ---------- */
  var NOT = ' (not named in 0610)';
  var G = {
    heart:   { label: 'Heart', note: 'a muscular pump: two sides, four chambers', colour: '#FF8A7E' },
    ra:      { label: 'Right atrium', note: 'receives deoxygenated blood from the body', colour: '#8FB2FF' },
    la:      { label: 'Left atrium', note: 'receives oxygenated blood from the lungs', colour: '#FF8A7E' },
    rv:      { label: 'Right ventricle', note: 'pumps blood to the lungs', colour: '#8FB2FF' },
    lv:      { label: 'Left ventricle', note: 'pumps blood to the whole body', colour: '#FF8A7E' },
    septum:  { label: 'Septum', note: 'keeps oxygenated and deoxygenated blood apart', colour: '#FFB0A2' },
    'av-valves': { label: 'Atrioventricular valves', note: 'between each atrium and its ventricle', colour: '#F4E6D0' },
    'sl-valves': { label: 'Semilunar valves', note: 'where the blood leaves the ventricles', colour: '#F4E6D0' },
    coronary: { label: 'Coronary arteries', note: 'the heart muscle’s own blood supply', colour: '#FF8A7E' },
    'cardiac-vein': { label: 'Cardiac veins', note: 'they take blood from the heart muscle back to the right atrium' + NOT, colour: '#8FB2FF' },
    lungs:   { label: 'Lungs', note: 'the blood is oxygenated here', colour: '#F2B8C2' },
    liver:   { label: 'Liver', note: 'two vessels bring blood in, one takes it out', colour: '#E0A08E' },
    kidneys: { label: 'Kidneys', note: 'a renal artery in, a renal vein out', colour: '#E0A08E' },
    spleen:  { label: 'Spleen', note: 'its blood leaves in the splenic vein, to the hepatic portal vein' + NOT, colour: '#C9A5C0' },
    gut:     { label: 'Small intestine', note: 'digested food is absorbed into the blood in its capillaries', colour: '#E6C1A4' },
    head:    { label: 'Head', note: 'the brain’s blood supply', colour: '#C9D8E6' },
    aorta:   { label: 'Aorta', note: 'the artery that carries oxygenated blood from the left ventricle to the body', colour: '#FF8A7E' },
    'vena-cava': { label: 'Vena cava', note: 'brings deoxygenated blood from the body to the right atrium', colour: '#8FB2FF' },
    'pulmonary-artery': { label: 'Pulmonary artery', note: 'carries deoxygenated blood from the right ventricle to the lungs', colour: '#8FB2FF' },
    'pulmonary-vein': { label: 'Pulmonary vein', note: 'carries oxygenated blood from the lungs to the left atrium', colour: '#FF8A7E' },
    'hepatic-artery': { label: 'Hepatic artery', note: 'brings oxygenated blood from the aorta into the liver', colour: '#FF8A7E' },
    'hepatic-portal-vein': { label: 'Hepatic portal vein', note: 'brings blood from the gut into the liver, rich in absorbed nutrients after a meal', colour: '#7FE3DA' },
    'hepatic-vein': { label: 'Hepatic vein', note: 'takes blood out of the liver, to the vena cava', colour: '#8FB2FF' },
    'mesenteric-vein': { label: 'Mesenteric vein', note: 'carries blood from the intestines, with the nutrients absorbed in the small intestine, to the hepatic portal vein' + NOT, colour: '#7FE3DA' },
    'splenic-vein': { label: 'Splenic vein', note: 'carries blood from the spleen; it joins the mesenteric vein to form the hepatic portal vein' + NOT, colour: '#7FE3DA' },
    'renal-artery': { label: 'Renal artery', note: 'brings blood from the aorta to the kidney', colour: '#FF8A7E' },
    'renal-vein': { label: 'Renal vein', note: 'takes blood from the kidney to the vena cava', colour: '#8FB2FF' },
    'coeliac-artery': { label: 'Coeliac artery', note: 'a short branch of the aorta; it divides into the hepatic, splenic and gastric arteries' + NOT, colour: '#FF8A7E' },
    'gastric-artery': { label: 'Gastric arteries', note: 'oxygenated blood to the stomach' + NOT, colour: '#FF8A7E' },
    'splenic-artery': { label: 'Splenic artery', note: 'oxygenated blood to the spleen' + NOT, colour: '#FF8A7E' },
    'mesenteric-artery': { label: 'Mesenteric arteries', note: 'branches of the aorta that carry oxygenated blood to the intestines' + NOT, colour: '#FF8A7E' },
    carotid: { label: 'Carotid artery', note: 'carries blood from the aorta to the head; you can feel its pulse at the side of the neck', colour: '#FF8A7E' },
    'head-artery': { label: 'Arteries of the head', note: 'the brain’s and the face’s supply' + NOT, colour: '#FF8A7E' },
    jugular: { label: 'Jugular vein', note: 'brings blood back from the head' + NOT, colour: '#8FB2FF' },
    'head-vein': { label: 'Veins of the head', note: 'they drain the brain and the face into the jugular veins' + NOT, colour: '#8FB2FF' },
    'radial-artery': { label: 'Radial artery', note: 'the artery at the wrist, on the thumb side, where you feel the pulse', colour: '#FF8A7E' },
    'arm-artery': { label: 'Arteries of the arm', note: 'they carry oxygenated blood to the arm and hand' + NOT, colour: '#FF8A7E' },
    'arm-vein': { label: 'Veins of the arm', note: 'they carry blood back towards the heart' + NOT, colour: '#8FB2FF' },
    'head-arm-vein': { label: 'Brachiocephalic veins', note: 'the veins from the head and arms join to form the vena cava' + NOT, colour: '#8FB2FF' },
    'leg-artery': { label: 'Arteries of the leg', note: 'branches of the aorta, below where it divides' + NOT, colour: '#FF8A7E' },
    'leg-vein': { label: 'Veins of the leg', note: 'valves keep the blood flowing up, towards the heart' + NOT, colour: '#8FB2FF' },
    artery:  { label: 'Gonadal artery', note: 'to the testis or the ovary' + NOT, colour: '#FF8A7E' },
    vein:    { label: 'Gonadal vein', note: 'from the testis or the ovary' + NOT, colour: '#8FB2FF' },
    arms:    { label: 'Arms', note: 'arteries and veins of the arm', colour: '#C9D8E6' },
    legs:    { label: 'Legs', note: 'arteries and veins of the leg', colour: '#C9D8E6' },
    body:    { label: 'The body', note: 'every organ, in parallel', colour: '#C9D8E6' }
  };
  /* what a station's broad names light */
  var SYSTEMIC = ['aorta', 'vena-cava', 'carotid', 'head-artery', 'jugular', 'head-vein', 'arm-artery', 'radial-artery', 'arm-vein', 'head-arm-vein',
                  'leg-artery', 'leg-vein', 'renal-artery', 'renal-vein', 'hepatic-artery', 'hepatic-vein', 'hepatic-portal-vein', 'coeliac-artery',
                  'gastric-artery', 'splenic-artery', 'mesenteric-artery', 'splenic-vein', 'mesenteric-vein', 'artery', 'vein'];
  var ALIAS = {
    arms: ['arm-artery', 'radial-artery', 'arm-vein'], legs: ['leg-artery', 'leg-vein'],
    head: ['head', 'carotid', 'head-artery', 'jugular', 'head-vein'],
    'gut-artery': ['coeliac-artery', 'gastric-artery', 'splenic-artery', 'mesenteric-artery'], 'gut-vein': ['splenic-vein', 'mesenteric-vein'],
    'aorta-branch': [], body: SYSTEMIC
  };
  /* an organ, lit on its own, brings the vessels that serve it */
  var ORGAN_VESSELS = {
    liver: ['liver', 'hepatic-artery', 'hepatic-portal-vein', 'hepatic-vein'],
    kidneys: ['kidneys', 'renal-artery', 'renal-vein'],
    lungs: ['lungs', 'pulmonary-artery', 'pulmonary-vein'],
    gut: ['gut', 'mesenteric-artery', 'mesenteric-vein'],
    spleen: ['spleen', 'splenic-artery', 'splenic-vein'],
    head: ['head', 'carotid', 'head-artery', 'jugular', 'head-vein']
  };
  var CHAMBERS = { ra: 1, la: 1, rv: 1, lv: 1, septum: 1, 'av-valves': 1, 'sl-valves': 1 };
  var ORGANS = { lungs: 1, liver: 1, kidneys: 1, spleen: 1, head: 1, gut: 1 };
  var ORGAN_FILL = { lungs: ['#F3C3CB', .5], liver: ['#C9876F', .34], kidneys: ['#C47A74', .42], spleen: ['#B58AAE', .28], gut: ['#E8B9A4', .55] };

  /* the camera's frames, in the drawing's units */
  var BOX = {
    heart:      { x: 176, y: 168, w: 196, h: 128 },
    heartClose: { x: 180, y: 172, w: 188, h: 122 },
    valves:     { x: 180, y: 172, w: 188, h: 122 },
    coronary:   { x: 180, y: 172, w: 188, h: 122 },
    'cardiac-vein': { x: 180, y: 172, w: 188, h: 122 },
    lungs:      { x: 128, y: 160, w: 166, h: 136 },
    chest:      { x: 118, y: 140, w: 184, h: 190 },
    liver:      { x: 118, y: 244, w: 180, h: 104 },
    abdomen:    { x: 128, y: 246, w: 170, h: 160 },
    kidneys:    { x: 128, y: 282, w: 176, h: 94 },
    gut:        { x: 150, y: 266, w: 130, h: 150 },
    head:       { x: 150, y: 6, w: 124, h: 196 },
    legs:       { x: 96, y: 366, w: 232, h: 446 },
    arms:       { x: -2, y: 150, w: 375, h: 380 },
    pulse:      { x: 0, y: 92, w: 372, h: 392 },
    forearm:    { x: 6, y: 300, w: 156, h: 196 },
    trunk:      { x: 104, y: 140, w: 216, h: 310 }
  };

  /* ---------- the names at the sides ----------
     lv  A  0610 names, and the two pulses of the practical: at every zoom
         B  the vessels of an organ, and the gut's veins that feed the hepatic portal vein: from closer
         G  "artery / vein in the arm" and so on, where nothing else is named: from closer, and not
            with Beyond syllabus on (then the real names replace them)
         X  beyond the syllabus: every name the artist gave, at the tip of her own arrow, or where the
            tip lies under another vessel, the nearest point along the same stretch that nothing
            covers (the internal iliac and peroneal arteries have none, and are left out; the common
            iliac vein's short stretch is under the mesenteric vein, 26 Sep, and is left out too)
     at  a point on the part; it is moved onto the nearest centre line of that part when the plate is
         built, so a leader always touches its own vessel. An organ's point is a spot in it far from
         every vessel, so "liver" never seems to name a vessel inside the liver, and away from the
         height where its own vessels enter, so its leader does not run along theirs.
     alt other points on the same part, tried in turn when the first would put its leader on the
         same line as a more needed name. z: the zoom (screen px per unit) it needs. */
  var LABELS = [
    { id: 'heart', text: 'heart', at: [238.7, 247.7], alt: [[235.2, 240.2], [233.2, 253.7]], lv: 'A' },
    { id: 'aorta', text: 'aorta', at: [225.9, 198.4], alt: [[213.4, 195.6], [222.4, 260.3]], lv: 'A' },
    { id: 'vena-cava', text: 'vena cava', at: [204.8, 254.2], alt: [[206.8, 316], [202.5, 199.1]], lv: 'A' },
    { id: 'lungs', text: 'lung', at: [154.8, 243.3], alt: [[157.3, 223.8], [151.8, 262.8], [242.8, 185.6]], lv: 'A' },
    { id: 'liver', text: 'liver', at: [157.7, 310.4], alt: [[153.7, 288.4], [161.2, 298.9], [188.2, 284.4], [242.7, 274.9]], lv: 'A' },
    { id: 'kidneys', text: 'kidney', at: [260.4, 338.4], alt: [[259.9, 323.9], [171.5, 346.2]], lv: 'A' },
    { id: 'gut', text: 'small intestine', at: [250, 375], alt: [[182.5, 370], [190, 395], [242.5, 392.5]], lv: 'A', needs: 'gut' },
    { id: 'carotid', text: 'carotid artery', at: [224.9, 134.2], lv: 'A' },
    { id: 'radial-artery', text: 'radial artery', at: [65.9, 396.8], alt: [[71.4, 372.9]], lv: 'A' },

    { id: 'pulmonary-artery', text: 'pulmonary artery', at: [184, 206], alt: [[187.1, 200.2], [189.8, 225.6]], lv: 'B' },
    { id: 'pulmonary-vein', text: 'pulmonary vein', at: [258, 216], alt: [[253.1, 205.4], [257.4, 232.8]], lv: 'B' },
    { id: 'hepatic-vein', text: 'hepatic vein', at: [195, 266], alt: [[187.2, 271.2]], lv: 'B' },
    { id: 'hepatic-artery', text: 'hepatic artery', at: [196, 290.5], alt: [[188.1, 295.6]], lv: 'B' },
    { id: 'hepatic-portal-vein', text: 'hepatic portal vein', at: [197, 300.5], alt: [[163.2, 313.2]], lv: 'B' },
    { id: 'mesenteric-vein', text: 'mesenteric vein', at: [215.9, 321.1], alt: [[217.3, 328.5], [212.6, 311.8]], lv: 'B' },
    { id: 'splenic-vein', text: 'splenic vein', at: [236.9, 300.2], alt: [[215.8, 305.4]], lv: 'B' },
    { id: 'spleen', text: 'spleen', at: [272.3, 301.2], alt: [[268.8, 288.7], [270.3, 314.7]], lv: 'B' },
    { id: 'renal-artery', text: 'renal artery', at: [233.9, 327.6], lv: 'B' },
    { id: 'renal-vein', text: 'renal vein', at: [198.8, 331.5], lv: 'B' },
    { id: 'coronary', text: 'coronary arteries', at: [230.7, 235.9], alt: [[227.1, 230.4], [207.3, 224.5]], lv: 'B', z: 1.6 },
    { id: 'cardiac-vein', text: 'cardiac vein', at: [200.9, 239.1], alt: [[231.7, 246.7]], lv: 'B', z: 1.6 },
    { id: 'head', text: 'head', at: [199.7, 51.4], alt: [[220.1, 53.7], [188, 78]], lv: 'B' },
    { id: 'carotid', text: 'carotid artery', at: [197.9, 139.8], alt: [[199.5, 128]], lv: 'B' },
    { id: 'radial-artery', text: 'radial artery', at: [320.4, 387.8], alt: [[322.5, 395], [318.5, 378]], lv: 'B' },

    { id: 'arm-artery', text: 'artery in the arm', at: [113.6, 287.4], lv: 'G' },
    { id: 'arm-vein', text: 'vein in the arm', at: [120.9, 255.9], lv: 'G' },
    { id: 'arm-artery', text: 'artery in the arm', at: [305.1, 269.4], lv: 'G' },
    { id: 'arm-vein', text: 'vein in the arm', at: [303.2, 256.9], lv: 'G' },
    { id: 'leg-artery', text: 'artery in the leg', at: [244.9, 507.1], lv: 'G' },
    { id: 'leg-vein', text: 'vein in the leg', at: [240.6, 529.1], lv: 'G' },
    { id: 'leg-vein', text: 'vein in the leg', at: [181.8, 484.8], lv: 'G' },
    { id: 'head-artery', text: 'artery in the head', at: [236.8, 90.4], lv: 'G', z: 1.5 },
    { id: 'head-vein', text: 'vein in the head', at: [246.2, 61.8], lv: 'G', z: 1.5 },

    { id: 'arm-artery', text: 'subclavian artery', at: [157.2, 182.5], lv: 'X' },
    { id: 'arm-vein', text: 'subclavian vein', at: [162.2, 177.5], lv: 'X' },
    { id: 'arm-artery', text: 'axillary artery', at: [139.7, 196.2], lv: 'X' },
    { id: 'arm-vein', text: 'axillary vein', at: [139.7, 198.2], lv: 'X' },
    { id: 'arm-vein', text: 'cephalic vein', at: [122.9, 215.1], lv: 'X' },
    { id: 'arm-artery', text: 'brachial artery', at: [112.8, 286.4], lv: 'X' },
    { id: 'arm-vein', text: 'basilic vein', at: [118.9, 294.5], lv: 'X' },
    { id: 'arm-vein', text: 'median cubital vein', at: [94.6, 324.7], lv: 'X' },
    { id: 'arm-artery', text: 'ulnar artery', at: [90.2, 387.1], lv: 'X' },
    { id: 'arm-artery', text: 'digital artery', at: [38, 460.3], lv: 'X', z: 2 },
    { id: 'arm-vein', text: 'digital vein', at: [53.8, 466.7], lv: 'X', z: 2 },
    { id: 'head-arm-vein', text: 'brachiocephalic vein', at: [200, 183.5], lv: 'X' },
    { id: 'jugular', text: 'internal jugular vein', at: [229.5, 135.4], lv: 'X' },
    { id: 'jugular', text: 'external jugular vein', at: [232.9, 120.1], lv: 'X' },
    { id: 'head-artery', text: 'vertebral artery', at: [218.4, 143.4], lv: 'X' },
    { id: 'head-artery', text: 'internal carotid artery', at: [224.3, 88.5], lv: 'X', z: 1.6 },
    { id: 'head-artery', text: 'external carotid artery', at: [233.3, 98.1], lv: 'X', z: 1.6 },
    { id: 'head-artery', text: 'basilar artery', at: [212.5, 72.3], lv: 'X', z: 1.8 },
    { id: 'head-vein', text: 'venous sinus', at: [239.5, 64.4], lv: 'X', z: 1.6 },
    { id: 'coeliac-artery', text: 'coeliac artery', at: [222.5, 281.2], lv: 'X', z: 1.6 },
    { id: 'gastric-artery', text: 'gastric artery', at: [225.2, 275.4], lv: 'X', z: 1.8 },
    { id: 'splenic-artery', text: 'splenic artery', at: [240.4, 293.3], lv: 'X', z: 1.6 },
    { id: 'mesenteric-artery', text: 'mesenteric artery', at: [221.1, 326.2], lv: 'X', z: 1.6 },
    { id: 'artery', text: 'gonadal artery', at: [231.7, 355.4], lv: 'X' },
    { id: 'vein', text: 'gonadal vein', at: [232, 372.4], lv: 'X' },
    { id: 'leg-artery', text: 'common iliac artery', at: [226.8, 386.2], lv: 'X' },
    { id: 'leg-artery', text: 'external iliac artery', at: [234.3, 407.5], lv: 'X', z: 1.6 },
    { id: 'leg-vein', text: 'external iliac vein', at: [232.3, 409.5], lv: 'X', z: 1.6 },
    { id: 'leg-artery', text: 'femoral artery', at: [243.9, 499.7], lv: 'X' },
    { id: 'leg-vein', text: 'femoral vein', at: [240.6, 505], lv: 'X' },
    { id: 'leg-artery', text: 'deep femoral artery', at: [249.7, 482.8], lv: 'X', z: 1.6 },
    { id: 'leg-vein', text: 'great saphenous vein', at: [219.7, 621.2], lv: 'X' },
    { id: 'leg-artery', text: 'popliteal artery', at: [235.6, 583.6], lv: 'X' },
    { id: 'leg-vein', text: 'popliteal vein', at: [238, 581], lv: 'X' },
    { id: 'leg-vein', text: 'small saphenous vein', at: [236.1, 642.5], lv: 'X' },
    { id: 'leg-artery', text: 'anterior tibial artery', at: [239.6, 662.9], lv: 'X' },
    { id: 'leg-artery', text: 'posterior tibial artery', at: [227, 664.3], lv: 'X' },
    { id: 'leg-vein', text: 'dorsal venous arch', at: [264.4, 769.1], lv: 'X', z: 1.6 },
    { id: 'leg-artery', text: 'arcuate artery', at: [169.3, 777.4], lv: 'X', z: 1.8 }
  ];
  var LV_RANK = { A: 0, B: 1, G: 2, X: 3 };
  var LV_ZOOM = { A: 0, B: 1.15, G: 1.2, X: 1.3 };
  /* the points found in the drawing for every part (plate-build/label-points.js → js/circ-labelpts.js) */
  var AUTO = global.CIRC_LABELPTS || {};
  /* one name per word: the entries that say the same thing are one name, with all their points, then
     the points found in the drawing, nearest to its first point first. A beyond-syllabus name stays at
     the tip of the artist's own arrow: its words name one stretch of a vessel, not all of it. */
  var NAMES = null;
  function names() {
    if (NAMES) return NAMES;
    var by = {}; NAMES = [];
    LABELS.forEach(function (L, idx) {
      var key = L.lv === 'X' ? 'X' + idx : L.text, z = L.z != null ? L.z : LV_ZOOM[L.lv];
      var N = by[key];
      if (!N) { N = by[key] = { key: key, id: L.id, text: L.text, lv: L.lv, z: z, needs: L.needs, i: idx, own: [] }; NAMES.push(N); }
      else { if (LV_RANK[L.lv] < LV_RANK[N.lv]) N.lv = L.lv; N.z = Math.min(N.z, z); }
      N.own = N.own.concat([L.at], L.alt || []);
    });
    NAMES.forEach(function (N) {
      var auto = N.lv !== 'X' && AUTO[N.id] ? nearFirstOf(AUTO[N.id], N.own[0]) : [];
      N.pts = N.own.concat(auto);
    });
    return NAMES;
  }
  function nearFirstOf(list, from) {
    return list.slice().sort(function (a, b) { return Math.hypot(a[0] - from[0], a[1] - from[1]) - Math.hypot(b[0] - from[0], b[1] - from[1]); });
  }

  /* every vessel's name touches its OWN vessel: the point is moved onto the nearest centre line of
     that part (an artery and its vein often run side by side) */
  var snapped = false;
  function snapLabels() {
    if (snapped) return; snapped = true;
    LABELS.forEach(function (L) {
      var P = FLOW[L.id]; if (!P) return;
      function snap(at) {
        var best = null;
        P.e.forEach(function (e) {
          for (var i = 0; i + 5 < e.length; i += 3) {
            var ax = e[i], ay = e[i + 1], bx = e[i + 3], by = e[i + 4];
            var dx = bx - ax, dy = by - ay, L2 = dx * dx + dy * dy, t = L2 ? Math.max(0, Math.min(1, ((at[0] - ax) * dx + (at[1] - ay) * dy) / L2)) : 0;
            var qx = ax + t * dx, qy = ay + t * dy, d = (qx - at[0]) * (qx - at[0]) + (qy - at[1]) * (qy - at[1]);
            if (!best || d < best[0]) best = [d, qx, qy];
          }
        });
        return best && best[0] < 14 * 14 ? [Math.round(best[1] * 10) / 10, Math.round(best[2] * 10) / 10] : at;
      }
      L.at = snap(L.at);
      if (L.alt) L.alt = L.alt.map(snap);
    });
  }

  /* a heartbeat's moment: how far the atria and ventricles are squeezed, and how open the valves */
  function beatState(ph, bpm) {
    var sys = Math.min(.62, .3 / (60 / Math.max(40, bpm)) * 1.0);
    var aS = .12, v0 = .13, v1 = v0 + sys;
    function bump(t, a, b) { if (t <= a || t >= b) return 0; var k = (t - a) / (b - a); return Math.sin(Math.PI * k); }
    function ramp(t, a, b) { return t <= a ? 0 : t >= b ? 1 : (t - a) / (b - a); }
    var atria = bump(ph, 0, aS);
    var vent = ph < v0 ? 0 : ph < v1 ? Math.sin(Math.PI * Math.min(1, (ph - v0) / (sys * 1.1))) : 0;
    var av = 1 - ramp(ph, v0 - .01, v0 + .02) + ramp(ph, v1 + .03, v1 + .07);
    var sl = ramp(ph, v0 + .03, v0 + .06) - ramp(ph, v1 - .02, v1 + .01);
    return { atria: atria, vent: vent, av: Math.max(0, Math.min(1, av)), sl: Math.max(0, Math.min(1, sl)), ejecting: ph > v0 + .04 && ph < v1 };
  }

  function el(name, attrs, parent) {
    var e = document.createElementNS(NS, name);
    for (var k in attrs) if (attrs[k] != null) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function f2(v) { return Math.round(v * 100) / 100; }
  function medianR(e) { var rs = []; for (var i = 2; i < e.length; i += 3) rs.push(e[i]); rs.sort(function (a, b) { return a - b; }); return rs[rs.length >> 1] || 1; }
  function dAlong(e) { var d = 'M' + e[0] + ' ' + e[1]; for (var i = 3; i + 1 < e.length; i += 3) d += 'L' + e[i] + ' ' + e[i + 1]; return d; }
  var UID = 0;

  function CircDraw(svg, opts) {
    opts = opts || {};
    snapLabels();
    var U = 'cp' + (++UID) + '-';
    var still = global.matchMedia && global.matchMedia('(prefers-reduced-motion: reduce)').matches;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    svg.setAttribute('viewBox', FULL.x + ' ' + FULL.y + ' ' + FULL.w + ' ' + FULL.h);
    var defs = el('defs', {}, svg);
    defs.innerHTML =
      '<radialGradient id="' + U + 'slab" cx=".5" cy=".42" r=".78"><stop offset="0" stop-color="#16303D"/><stop offset=".62" stop-color="#0D1C25"/><stop offset="1" stop-color="#081218"/></radialGradient>' +
      '<filter id="' + U + 'soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="3"/></filter>' +
      '<clipPath id="' + U + 'lensclip"><rect x="0" y="0" width="1" height="1" rx="6"/></clipPath>';

    var root = el('g', { 'class': 'cp' }, svg);
    el('rect', { x: -600, y: -600, width: AW + 1200, height: AH + 1200, fill: 'url(#' + U + 'slab)', 'class': 'cp__bg' }, root);
    /* a soft light behind the body, so it reads as a specimen on a lit slab */
    var halo = el('g', { 'class': 'cp__halo', filter: 'url(#' + U + 'soft)', opacity: .55 }, root);

    /* ----- the drawing ----- */
    var artG = el('g', { 'class': 'cp__art' }, root);
    artG.innerHTML = ART ? ART.svg : '';
    function chain(node) {                       /* the transforms between the drawing's root and a shape */
      var t = []; var n = node.parentNode;
      while (n && n !== artG) { if (n.getAttribute && n.getAttribute('transform')) t.unshift(n.getAttribute('transform')); n = n.parentNode; }
      if (node.getAttribute('transform')) t.push(node.getAttribute('transform'));
      return t.join(' ');
    }
    function copyOf(node, attrs, parent) {        /* a shape, lifted out of its layer with its place kept */
      var g = el('g', { transform: chain(node) || null }, parent);
      var c = node.cloneNode(false); c.removeAttribute('id'); c.removeAttribute('transform'); c.removeAttribute('class');
      if (attrs && (attrs.fill != null || attrs.stroke != null)) c.removeAttribute('style');
      for (var k in attrs) if (attrs[k] != null) c.setAttribute(k, attrs[k]);
      g.appendChild(c);
      return c;
    }
    var skin = artG.querySelector('.cp-skin');
    var organs = {};                               /* organ id -> its outline shapes */
    Array.prototype.forEach.call(artG.querySelectorAll('.cp-organ'), function (n) {
      var p = n.getAttribute('data-part'); (organs[p] = organs[p] || []).push(n);
    });
    var heartShape = organs.heart && organs.heart[0];
    /* the vessels on the heart's surface were bare 1-unit lines; every other vessel in the drawing has a rim,
       yellow round the arteries and pale blue round the veins. Give them the same, under all of them, so an
       artery and its vein running together sit on one clean edge (Daniel, 25 Sep: "very badly drawn") */
    (function () {
      var first = new Map();
      Array.prototype.forEach.call(artG.querySelectorAll('.cp-cor'), function (n) {
        if (!first.has(n.parentNode)) first.set(n.parentNode, n);
        var rim = n.cloneNode(false); rim.removeAttribute('id'); rim.classList.add('cp-cor-rim');
        rim.style.stroke = n.classList.contains('cp-v') ? '#00a0c6' : '#ffbf00'; rim.style.strokeWidth = '2.2px';
        rim.style.strokeLinecap = 'round'; rim.style.strokeLinejoin = 'round';
        n.parentNode.insertBefore(rim, first.get(n.parentNode));
        n.style.strokeWidth = '1.2px'; n.style.strokeLinecap = 'round'; n.style.strokeLinejoin = 'round';
      });
    })();
    var corShapes = artG.querySelectorAll('.cp-cor');
    if (skin) copyOf(skin, { fill: '#DCE7EC', stroke: 'none' }, halo);

    /* organs are only outlines in the drawing: give them a tint, under the vessels */
    var firstLayer = skin; while (firstLayer && firstLayer.parentNode !== artG) firstLayer = firstLayer.parentNode;
    var organFill = el('g', { 'class': 'cp__ofill' });
    if (firstLayer && firstLayer.nextSibling) artG.insertBefore(organFill, firstLayer.nextSibling); else artG.appendChild(organFill);
    Object.keys(ORGAN_FILL).forEach(function (p) {
      (organs[p] || []).forEach(function (n) {
        copyOf(n, { fill: ORGAN_FILL[p][0], 'fill-opacity': ORGAN_FILL[p][1], stroke: 'none', 'data-part': p }, organFill);
      });
    });

    /* the small intestine, from the same artist's digestive system, if it is loaded (js/circ-gut.js) */
    if (global.CIRC_GUT) {
      var gut = el('g', { 'class': 'cp__gut', 'data-part': 'gut', transform: global.CIRC_GUT.transform }, organFill);
      gut.innerHTML = global.CIRC_GUT.svg;
      Array.prototype.forEach.call(gut.querySelectorAll('[fill-opacity]'), function (c) { c.setAttribute('fill-opacity', .75); });   /* under the vessels, so it can be this solid */
      organs.gut = [gut];
    }
    Array.prototype.forEach.call(artG.querySelectorAll('[id]'), function (n) { n.removeAttribute('id'); });

    /* ----- the veil, and the lit parts above it ----- */
    var veil = el('g', { 'class': 'cp__veil' }, root);
    if (skin) copyOf(skin, { fill: SKIN, 'fill-opacity': .8, stroke: 'none' }, veil);
    /* the spotlight (Daniel, 25 Sep: the lit heart "doesn't look quite right ... think like a professional"): in
       the heart stations the veil opens round the heart, feathered, so the heart shows as the artist drew
       it, joined to its aorta, pulmonary artery and venae cavae, with its own coronary vessels. The flat
       copy it replaces was a pink blob cut off from its vessels. */
    defs.insertAdjacentHTML('beforeend',
      '<radialGradient id="' + U + 'spotg"><stop offset="0" stop-color="#000"/><stop offset=".6" stop-color="#000"/><stop offset="1" stop-color="#000" stop-opacity="0"/></radialGradient>' +
      '<mask id="' + U + 'spot" maskUnits="userSpaceOnUse" x="-600" y="-600" width="' + (AW + 1200) + '" height="' + (AH + 1200) + '">' +
        '<rect x="-600" y="-600" width="' + (AW + 1200) + '" height="' + (AH + 1200) + '" fill="#fff"/>' +
        '<ellipse class="cp__spot" cx="222" cy="228" rx="46" ry="50" fill="url(#' + U + 'spotg)"/></mask>');
    var spotSet = false;
    function heartBoxInRoot() {                  /* the heart's outline, in the drawing's own units */
      var b = heartShape.getBBox(), m = root.getCTM().inverse().multiply(heartShape.getCTM()), P = svg.createSVGPoint(), xs = [], ys = [];
      [[b.x, b.y], [b.x + b.width, b.y], [b.x, b.y + b.height], [b.x + b.width, b.y + b.height]].forEach(function (c) { P.x = c[0]; P.y = c[1]; var q = P.matrixTransform(m); xs.push(q.x); ys.push(q.y); });
      return [Math.min.apply(null, xs), Math.min.apply(null, ys), Math.max.apply(null, xs), Math.max.apply(null, ys)];
    }
    function spotlight(on) {
      if (on && !spotSet && heartShape) {
        try {
          var hb = heartBoxInRoot(), e = defs.querySelector('#' + U + 'spot .cp__spot');
          if (hb[2] > hb[0]) { spotSet = true;
            e.setAttribute('cx', f2((hb[0] + hb[2]) / 2)); e.setAttribute('cy', f2((hb[1] + hb[3]) / 2 - 8));
            e.setAttribute('rx', f2((hb[2] - hb[0]) / 2 + 17)); e.setAttribute('ry', f2((hb[3] - hb[1]) / 2 + 25)); }
        } catch (x) {}
      }
      if (on) veil.setAttribute('mask', 'url(#' + U + 'spot)'); else veil.removeAttribute('mask');
    }
    var litO = el('g', { 'class': 'cp__lito' }, root);          /* lit organs, under their vessels */
    var tubesBack = el('g', { 'class': 'cp__tubes' }, root);    /* lit vessels behind the heart */
    var litH = el('g', { 'class': 'cp__lito cp__lith' }, root); /* the lit heart and its coronary vessels */
    var tubesFront = el('g', { 'class': 'cp__tubes' }, root);   /* lit vessels in front of it */

    /* ----- the blood ----- */
    var flowG = el('g', { 'class': 'cp__flow' }, root);
    /* the blood in the vessels BEHIND the heart (the drawing's arteries, pulmonary veins and veins) must not
       run over its surface: a mask cuts the heart's body out of their dots. The roots of the great vessels
       above it are drawn in front of it, so the cut starts below them. Only the parts that pass behind the
       heart are masked, to keep the cost of a mask to the few that need it. */
    var flowBackG = el('g', { 'class': 'cp__flowback' }, flowG), behindBox = null;
    if (heartShape) {
      defs.insertAdjacentHTML('beforeend', '<clipPath id="' + U + 'below"><rect x="-600" y="214" width="' + (AW + 1200) + '" height="' + (AH + 600) + '"/></clipPath>' +
        '<mask id="' + U + 'behind" maskUnits="userSpaceOnUse" x="-600" y="-600" width="' + (AW + 1200) + '" height="' + (AH + 1200) + '">' +
        '<rect x="-600" y="-600" width="' + (AW + 1200) + '" height="' + (AH + 1200) + '" fill="#fff"/><g class="cp__behind" clip-path="url(#' + U + 'below)"></g></mask>');
      copyOf(heartShape, { fill: '#000', stroke: 'none' }, defs.querySelector('#' + U + 'behind .cp__behind'));
      flowBackG.setAttribute('mask', 'url(#' + U + 'behind)');
      behindBox = [185, 205, 262, 268];                            /* the heart's body, with room, in the drawing's units */
    }
    function passesBehind(P) {
      if (!behindBox || !(P.c === 'a' || P.c === 'pv' || P.c === 'v')) return false;
      var b = P.box; return b[0] < behindBox[2] && b[0] + b[2] > behindBox[0] && b[1] < behindBox[3] && b[1] + b[3] > behindBox[1];
    }
    var DOT = { a: '#FFE2DC', ag: '#FFE2DC', pv: '#FFE2DC', v: '#DCEAFF', pa: '#DCEAFF', po: '#D8FBF6' };
    var SPEED = { a: 34, ag: 30, pv: 22, v: 17, pa: 26, po: 15 };
    var BUCKETS = [0, .8, 1.8, 3.4, 1e9];
    var flows = [];
    var FANS = { 'mesenteric-vein': 1, 'mesenteric-artery': 1 };
    Object.keys(FLOW).forEach(function (part) {
      var P = FLOW[part], byB = {};
      P.e.forEach(function (e) {
        var r = medianR(e), b = 0; while (r >= BUCKETS[b + 1]) b++;
        if (FANS[part] && r < .36) return;         /* the fine vessels fanning into the intestine: too small for dots */
        (byB[b] = byB[b] || []).push(e);
      });
      Object.keys(byB).forEach(function (b) {
        var list = byB[b], rs = list.map(medianR).sort(function (x, y) { return x - y; }), r = rs[rs.length >> 1];
        var dot = Math.max(.36, Math.min(1.7, r * .5)), dash = dot * 1.5, gap = Math.max(3, dot * 4.6);
        var p = el('path', { d: list.map(dAlong).join(''), fill: 'none', stroke: DOT[P.c], 'stroke-width': f2(dot), 'stroke-linecap': 'round',
          'stroke-dasharray': f2(dash) + ' ' + f2(gap), 'class': 'cp__f', 'data-part': part, opacity: .82 }, passesBehind(P) ? flowBackG : flowG);
        flows.push({ el: p, part: part, c: P.c, gap: gap + dash, speed: SPEED[P.c] * (.72 + Math.min(.55, r * .09)), off: 0 });
      });
    });

    /* ----- the heart, cut open: a magnified view beside it ----- */
    var LENS = { x: 262, y: 176, w: 104, h: 124 };
    var lensG = el('g', { 'class': 'cp__lens', opacity: 0 }, root);
    var lensMode = null, heartKind = 'section', lensNodes = {};
    function buildLens() {
      lensG.innerHTML = '';
      if (!global.HeartArt) return;
      /* the magnifier: a frame round the heart on the body, and two lines out to the view beside it, so it
         is plain which heart is being shown bigger */
      var fb = [187, 205, 257, 266];
      try { if (heartShape) { var hb1 = heartBoxInRoot(); if (hb1[2] > hb1[0]) fb = [hb1[0] - 5, hb1[1] - 5, hb1[2] + 5, hb1[3] + 5]; } } catch (x) {}
      el('rect', { x: f2(fb[0]), y: f2(fb[1]), width: f2(fb[2] - fb[0]), height: f2(fb[3] - fb[1]), rx: 4, fill: 'none', stroke: '#FFD65A', 'stroke-opacity': .9, 'stroke-width': .7, 'class': 'cp__loupe' }, lensG);
      el('path', { d: 'M' + f2(fb[2]) + ' ' + f2(fb[1]) + 'L' + LENS.x + ' ' + (LENS.y + 5) + 'M' + f2(fb[2]) + ' ' + f2(fb[3]) + 'L' + LENS.x + ' ' + (LENS.y + LENS.h - 5),
        stroke: '#FFD65A', 'stroke-opacity': .55, 'stroke-width': .5, 'stroke-dasharray': '1.4 1.1', fill: 'none', 'class': 'cp__lensline' }, lensG);
      el('rect', { x: LENS.x, y: LENS.y, width: LENS.w, height: LENS.h, rx: 5, fill: '#0E1A22', stroke: '#E8EEF1', 'stroke-opacity': .5, 'stroke-width': .6 }, lensG);
      var clip = defs.querySelector('#' + U + 'lensclip rect');
      clip.setAttribute('x', LENS.x); clip.setAttribute('y', LENS.y); clip.setAttribute('width', LENS.w); clip.setAttribute('height', LENS.h);
      var inner = el('g', { 'clip-path': 'url(#' + U + 'lensclip)' }, lensG);
      var s = Math.min((LENS.w - 6) / 470, (LENS.h - 16) / 630);
      var tx = LENS.x + (LENS.w - 480 * s) / 2 + 40 * s, ty = LENS.y + 3 + 70 * s;
      var hg = el('g', { transform: 'translate(' + f2(tx) + ' ' + f2(ty) + ') scale(' + f2(s * 1000) / 1000 + ')', 'class': 'cp__lensheart' }, inner);
      hg.innerHTML = global.HeartArt.svg(beat, { mode: heartKind, rightPV: false });
      lensNodes = global.HeartArt.nodes(hg);
      var cap = el('text', { x: LENS.x + LENS.w / 2, y: LENS.y + LENS.h - 4.2, 'text-anchor': 'middle', 'class': 'cp__lenscap' }, lensG);
      cap.textContent = heartKind === 'exterior' ? 'the heart from the front' : 'the heart, cut open';
      applyLight();
    }

    /* ----- what the pointer can press ----- */
    var hitG = el('g', { 'class': 'cp__hits' }, root);
    Object.keys(organs).forEach(function (p) {
      if (p === 'heart') return;
      organs[p].forEach(function (n) {
        if (p === 'gut') {                     /* its copy for the pointer must not paint: it lies above the vessels */
          var gc = n.cloneNode(true); gc.setAttribute('class', 'cp__hit cp__hit--o'); gc.setAttribute('data-part', 'gut');
          Array.prototype.forEach.call(gc.querySelectorAll('*'), function (c) { c.removeAttribute('style'); c.setAttribute('fill', 'transparent'); c.setAttribute('stroke', 'none'); c.removeAttribute('fill-opacity'); });
          hitG.appendChild(gc); return;
        }
        copyOf(n, { fill: 'transparent', stroke: 'none', 'data-part': p, 'class': 'cp__hit cp__hit--o' }, hitG);
      });
    });
    if (heartShape) copyOf(heartShape, { fill: 'transparent', stroke: 'none', 'data-part': 'heart', 'class': 'cp__hit cp__hit--o' }, hitG);
    Array.prototype.forEach.call(corShapes, function (n) {      /* the vessels on the heart win over the heart itself: red, its arteries; blue, its veins */
      if (n.classList.contains('cp-cor-rim')) return;
      copyOf(n, { fill: 'none', stroke: 'transparent', 'stroke-width': 8, 'vector-effect': 'non-scaling-stroke', 'data-part': n.classList.contains('cp-v') ? 'cardiac-vein' : 'coronary', 'class': 'cp__hit' }, hitG);
    });
    /* the vessels: the gut's small ones last, so they win where they cross the aorta */
    var hitOf = {};
    Object.keys(FLOW).sort(function (a, b) { return (FLOW[a].c === 'ag' || FLOW[a].c === 'po') - (FLOW[b].c === 'ag' || FLOW[b].c === 'po'); }).forEach(function (part) {
      hitOf[part] = el('path', { d: FLOW[part].e.map(dAlong).join(''), fill: 'none', stroke: 'transparent', 'stroke-width': 11, 'vector-effect': 'non-scaling-stroke',
        'stroke-linecap': 'round', 'data-part': part, 'class': 'cp__hit' }, hitG);
    });
    root.appendChild(lensG);                                       /* the lens takes its own clicks: the chambers */

    /* ----- lighting ----- */
    var lit = null;
    function expand(ids) {
      var out = {};
      (ids || []).forEach(function (id) { (ALIAS[id] || [id]).forEach(function (k) { out[k] = 1; }); if (ALIAS[id] && G[id]) out[id] = 1; });
      return out;
    }
    /* a lit vessel, drawn again as a tube along its centre line: the drawing's own rim colour, then its
       own fill, at the width the drawing gives it at every point */
    var TUBE = { a: ['#b62717', '#ffbf00'], ag: ['#b62717', '#ffbf00'], pv: ['#b62717', '#ffbf00'], v: ['#0060b6', '#00a0c6'], pa: ['#0060b6', '#00a0c6'], po: ['#0060b6', '#00d8c6'] };
    function tubePaths(edges, c, parent) {        /* centre lines drawn as the drawing draws a vessel: a rim, then its fill */
      var rim = {}, core = {};
      edges.forEach(function (e) {
        for (var i = 0; i + 5 < e.length; i += 3) {
          var r = (e[i + 2] + e[i + 5]) / 2, seg = 'M' + e[i] + ' ' + e[i + 1] + 'L' + e[i + 3] + ' ' + e[i + 4];
          var wr = Math.round((2 * r + .15) * 5) / 5, wc = Math.max(.3, Math.round((2 * r - .6) * 5) / 5);
          rim[wr] = (rim[wr] || '') + seg; core[wc] = (core[wc] || '') + seg;
        }
      });
      Object.keys(rim).forEach(function (w) { el('path', { d: rim[w], stroke: TUBE[c][1], 'stroke-width': w }, parent); });
      Object.keys(core).forEach(function (w) { el('path', { d: core[w], stroke: TUBE[c][0], 'stroke-width': w }, parent); });
    }
    /* the vessels between the small intestine and its mesenteric vein and artery (js/circ-mesentery.js): the
       artist's stop just above the intestine, which came from another of her drawings. Drawn into the drawing
       itself, in front of the aorta and vena cava, as the mesenteric vessels lie (Daniel, 26 Sep: "you should
       see capillaries going from the small intestine into the mesenteric vein") */
    if (global.CIRC_MESENTERY) {
      var mesG = el('g', { 'class': 'cp__mesentery', fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, artG);
      tubePaths(global.CIRC_MESENTERY.vein, 'po', el('g', {}, mesG));
      tubePaths(global.CIRC_MESENTERY.artery, 'ag', el('g', {}, mesG));
    }
    var BACK = ['a', 'pv', 'v'], FRONT = ['pa', 'po', 'ag'];
    function tubes(host, layers, heartLitNow) {
      host.innerHTML = '';
      if (!lit) return;
      var byLayer = {};
      Object.keys(lit).forEach(function (part) { var P = FLOW[part]; if (P) (byLayer[P.c] = byLayer[P.c] || []).push(P); });
      function draw(c, keep) {
        var list = byLayer[c]; if (!list) return;
        var rim = {}, core = {};
        list.forEach(function (P) {
          P.e.forEach(function (e) {
            for (var i = 0; i + 5 < e.length; i += 3) {
              if (keep && !keep(e[i], e[i + 1], e[i + 3], e[i + 4])) continue;
              var r = (e[i + 2] + e[i + 5]) / 2, seg = 'M' + e[i] + ' ' + e[i + 1] + 'L' + e[i + 3] + ' ' + e[i + 4];
              var wr = Math.round((2 * r + .15) * 5) / 5, wc = Math.max(.3, Math.round((2 * r - .6) * 5) / 5);
              rim[wr] = (rim[wr] || '') + seg; core[wc] = (core[wc] || '') + seg;
            }
          });
        });
        var g = el('g', { 'class': 'cp__tube cp__tube--' + c, fill: 'none', 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, host);
        Object.keys(rim).forEach(function (w) { el('path', { d: rim[w], stroke: TUBE[c][1], 'stroke-width': w }, g); });
        Object.keys(core).forEach(function (w) { el('path', { d: core[w], stroke: TUBE[c][0], 'stroke-width': w }, g); });
      }
      layers.forEach(function (c) { draw(c); });
      /* in the drawing the arch of the aorta lies over the heart, and the descending aorta behind it */
      if (host === tubesFront && heartLitNow) draw('a', function (x0, y0, x1, y1) { return y0 < 213 && y1 < 213 && x0 > 196 && x0 < 236; });
    }
    function applyLight() {
      root.classList.toggle('is-lighting', !!lit);
      litO.innerHTML = ''; litH.innerHTML = ''; heartLit = null; corLit = [];
      var heartOn = !!(lit && (lit.heart || lit.coronary || lit['cardiac-vein'] || anyChamber()));
      if (lit) {
        Object.keys(lit).forEach(function (p) {
          if (!ORGANS[p] || !organs[p]) return;
          if (p === 'gut') { var g2 = organs.gut[0].cloneNode(true); g2.setAttribute('class', 'cp__gut is-lit'); litO.appendChild(g2); return; }
          organs[p].forEach(function (n) {
            if (ORGAN_FILL[p]) copyOf(n, { fill: ORGAN_FILL[p][0], 'fill-opacity': Math.min(.85, ORGAN_FILL[p][1] + .3), stroke: 'none' }, litO);
            copyOf(n, { fill: 'none', stroke: '#6E7F8C', 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke' }, litO);
          });
        });
        if (heartOn && heartShape && !lensMode) {
          heartLit = copyOf(heartShape, {}, litH);
          if (lit.coronary || lit['cardiac-vein'] || lit.heart) corLit = Array.prototype.map.call(corShapes, function (n) { return copyOf(n, {}, litH); });
        }
      }
      spotlight(!!(lit && lensMode && heartOn));
      tubes(tubesBack, BACK, heartOn); tubes(tubesFront, FRONT, heartOn);
      flows.forEach(function (f) { f.el.classList.toggle('is-dim', !!lit && !lit[f.part]); });
      /* the lens: its chambers and valves, lit or dimmed */
      Array.prototype.forEach.call(lensG.querySelectorAll('[data-part]'), function (n) {
        var p = n.getAttribute('data-part');
        var on = !lit || lit[p] || (lit.heart && !anyChamber()) || (p === 'heart');
        n.classList.toggle('is-dim', !on);
        n.classList.toggle('is-lit', !!(lit && lit[p]));
      });
      layoutLabels();
    }
    var heartLit = null, corLit = [];
    function anyChamber() { if (!lit) return false; for (var k in CHAMBERS) if (lit[k]) return true; return false; }
    function light(ids) {
      if (!ids || !ids.length) { lit = null; applyLight(); return { colour: null }; }
      lit = expand(ids);
      applyLight();
      var g0 = G[ids[0]];
      return { colour: g0 ? g0.colour : null };
    }

    /* ----- the lens on and off ----- */
    function lens(mode) {
      var want = mode === 'exterior' || mode === 'section' ? mode : null;
      if (want && want !== heartKind) { heartKind = want; buildLens(); }
      if (want && !lensG.firstChild) buildLens();
      lensMode = want;
      lensG.setAttribute('opacity', want ? 1 : 0);
      lensG.style.pointerEvents = want ? '' : 'none';
      applyLight();
    }

    /* ----- the heartbeat, and the blood moving with it ----- */
    var bpm = 72, t0 = null, raf = null, flowOn = true, lastT = 0, beat = beatState(.9, 72), phase = 0;
    function setRate(b) { bpm = Math.max(40, Math.min(200, b || 72)); }
    function surge(ph) {                                        /* the push of each beat in the arteries */
      return ph < .12 ? .5 : ph < .45 ? .5 + 1.9 * Math.sin(Math.PI * (ph - .12) / .33) : .5;
    }
    var heartBase = heartShape ? (heartShape.getAttribute('transform') || '') : '', heartC = null;
    /* the beat. The ventricles squeezing make the heart SMALLER, shortening towards its apex, which hardly
       moves (the valve plane comes down to it); the atria squeezing, a little. It used to swell as the
       ventricles contracted, the opposite of the cut-open heart beside it (Daniel, 25 Sep: "they are not
       beating at the same rhythm ... or they're actually opposite"). The vessels on its surface move with it. */
    var corAnch = null;
    function corAnchors() {                      /* the apex, in each coronary vessel's own coordinates */
      var out = [];
      try {
        var mh = heartShape.getCTM();
        Array.prototype.forEach.call(corShapes, function (n) {
          var P = svg.createSVGPoint(); P.x = heartC[0]; P.y = heartC[1];
          var mn = n.getCTM(); if (!mh || !mn) return;
          var q = P.matrixTransform(mh).matrixTransform(mn.inverse());
          out.push({ el: n, base: n.getAttribute('transform') || '', a: [q.x, q.y] });
        });
      } catch (x) {}
      return out;
    }
    function scaleAbout(a, k) { return 'translate(' + f2(a[0]) + ' ' + f2(a[1]) + ') scale(' + k + ') translate(' + f2(-a[0]) + ' ' + f2(-a[1]) + ')'; }
    function paintBeat() {
      var k = Math.round((1 - .035 * beat.vent - .006 * beat.atria) * 1000) / 1000;
      if (heartShape && !heartC) { try { var hb0 = heartShape.getBBox(); if (hb0.width) heartC = [hb0.x + hb0.width * .83, hb0.y + hb0.height * .99]; } catch (x) {} }
      if (heartC) {
        if (!corAnch || !corAnch.length) corAnch = corAnchors();      /* measured once the plate is on screen */
        var sc = scaleAbout(heartC, k);
        heartShape.setAttribute('transform', (heartBase ? heartBase + ' ' : '') + sc);
        if (heartLit) heartLit.setAttribute('transform', sc);
        corAnch.forEach(function (c, i) {
          var sc2 = scaleAbout(c.a, k);
          c.el.setAttribute('transform', (c.base ? c.base + ' ' : '') + sc2);
          if (corLit[i]) corLit[i].setAttribute('transform', sc2);
        });
      }
      if (!lensMode || !global.HeartArt || !lensNodes.outer) return;
      global.HeartArt.update(lensNodes, global.HeartArt.paths(beat));      /* the section, or the outside with its coronary arteries */
    }
    function moveFlow(dt) {
      var s = surge(phase), rateK = .55 + .45 * bpm / 72;
      flows.forEach(function (f) {
        var v = f.speed * rateK * (f.c === 'a' || f.c === 'ag' || f.c === 'pa' ? s : 1);
        f.off = (f.off - v * dt) % (f.gap * 1000);
        f.el.setAttribute('stroke-dashoffset', f2(f.off));
      });
    }
    function frame(ts) {
      raf = null;
      if (!svg.isConnected) return;
      if (t0 == null) t0 = ts;
      var t = (ts - t0) / 1000, dt = Math.min(.05, Math.max(0, t - lastT)); lastT = t;
      var period = 60 / bpm;
      phase = (phase + dt / period) % 1;
      beat = beatState(phase, bpm);
      paintBeat();
      if (flowOn && !still) moveFlow(dt);
      raf = requestAnimationFrame(frame);
    }
    function start() { if (!raf && !still) raf = requestAnimationFrame(frame); if (still) { paintBeat(); } }
    function stop() { if (raf) cancelAnimationFrame(raf); raf = null; t0 = null; lastT = 0; }
    document.addEventListener('visibilitychange', function () { if (document.hidden) stop(); else if (svg.isConnected) start(); });

    /* ----- the camera ----- */
    var cam = { x: FULL.x, y: FULL.y, w: FULL.w, h: FULL.h }, flying = null;
    function aspect() { var r = svg.getBoundingClientRect(); return r.width > 0 && r.height > 0 ? r.width / r.height : FULL.w / FULL.h; }
    function fit(b, asIs) {
      var a = aspect(), w = b.w, h = b.h, r = svg.getBoundingClientRect();
      if (w / h > a) h = w / a; else w = h * a;
      /* a part flown to is kept out from under the two columns of names at the sides, zooming out
         by at most a third to do it */
      if (!asIs && b !== FULL && labOn && labSvg && r.width > 0) {
        var c = Math.min(r.width * .26, 150), inner = Math.max(20, b.w - 2 * Math.min(36, b.w * .15));
        var s0 = r.width / w, s = Math.max(.7 * s0, Math.min(s0, (r.width - 2 * c) / inner));
        w = r.width / s; h = w / a;
      }
      return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w: w, h: h };
    }
    function clampView(v) {
      var maxW = Math.max(FULL.w, FULL.h * aspect()) * 1.35, minW = 38;
      var w = Math.max(minW, Math.min(maxW, v.w)), h = w * v.h / v.w;
      var cx = v.x + v.w / 2, cy = v.y + v.h / 2;
      cx = Math.max(-20, Math.min(AW + 20, cx)); cy = Math.max(-10, Math.min(AH + 10, cy));
      return { x: cx - w / 2, y: cy - h / 2, w: w, h: h };
    }
    function setView(v) {
      cam = v;
      svg.setAttribute('viewBox', f2(v.x) + ' ' + f2(v.y) + ' ' + f2(v.w) + ' ' + f2(v.h));
      layoutLabels();
      if (opts.onView) opts.onView(isZoomed());
    }
    function flyTo(box, done) {
      if (flying) cancelAnimationFrame(flying);
      var from = { x: cam.x, y: cam.y, w: cam.w, h: cam.h }, to = clampView(fit(box || FULL));
      if (still) { setView(to); if (done) done(); return; }
      var t0f = null, D = 780;
      (function step(ts) {
        if (t0f == null) t0f = ts;
        var k = Math.min(1, (ts - t0f) / D), e = k < .5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2;
        var zw = from.w * Math.pow(to.w / from.w, e);                      /* zoom evenly, not linearly */
        var f = (from.w === to.w) ? e : (from.w - zw) / (from.w - to.w);
        var cx = (from.x + from.w / 2) + ((to.x + to.w / 2) - (from.x + from.w / 2)) * f, cy = (from.y + from.h / 2) + ((to.y + to.h / 2) - (from.y + from.h / 2)) * f;
        var zh = zw * to.h / to.w;
        setView({ x: cx - zw / 2, y: cy - zh / 2, w: zw, h: zh });
        if (k < 1) flying = requestAnimationFrame(step); else { flying = null; if (done) done(); }
      })(performance.now());
    }
    function jump(box, asIs) { if (flying) cancelAnimationFrame(flying); flying = null; setView(clampView(fit(box || FULL, asIs))); }
    function isZoomed() { return cam.w < Math.max(FULL.w, FULL.h * aspect()) * .86; }
    function zoomAt(k, px, py) {            /* k < 1 zooms in; px, py a point in the drawing that stays put */
      var v = clampView({ x: px - (px - cam.x) * k, y: py - (py - cam.y) * k, w: cam.w * k, h: cam.h * k });
      setView(v);
    }
    function zoomBy(k) { zoomAt(k, cam.x + cam.w / 2, cam.y + cam.h / 2); }
    function toArt(clientX, clientY) {
      var r = svg.getBoundingClientRect(), a = r.width / r.height, va = cam.w / cam.h, sx, ox = r.left, oy = r.top;
      /* preserveAspectRatio meet: the view is letterboxed inside the element */
      if (a > va) { sx = r.height / cam.h; ox += (r.width - cam.w * sx) / 2; } else { sx = r.width / cam.w; oy += (r.height - cam.h * sx) / 2; }
      return { x: cam.x + (clientX - ox) / sx, y: cam.y + (clientY - oy) / sx, s: sx, ox: ox, oy: oy };
    }
    function toScreen(x, y) {                /* drawing units -> px inside the map */
      var r = svg.getBoundingClientRect(), a = r.width / r.height, va = cam.w / cam.h, sx, ox = 0, oy = 0;
      if (a > va) { sx = r.height / cam.h; ox = (r.width - cam.w * sx) / 2; } else { sx = r.width / cam.w; oy = (r.height - cam.h * sx) / 2; }
      var m = opts.map ? opts.map.getBoundingClientRect() : r;
      return { x: (r.left - m.left) + ox + (x - cam.x) * sx, y: (r.top - m.top) + oy + (y - cam.y) * sx };
    }
    svg.addEventListener('wheel', function (e) {
      e.preventDefault();
      var p = toArt(e.clientX, e.clientY), k = Math.exp(e.deltaY * (e.ctrlKey ? .012 : .0016));
      if (flying) { cancelAnimationFrame(flying); flying = null; }
      zoomAt(k, p.x, p.y);
    }, { passive: false });
    var ptrs = {}, drag = null, moved = false;
    svg.addEventListener('pointerdown', function (e) {
      ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(ptrs);
      if (ids.length === 1) { drag = { x: e.clientX, y: e.clientY, cam: cam }; moved = false; }
      else if (ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]];
        drag = { pinch: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, cam: cam }; moved = true;
      }
    });
    svg.addEventListener('pointermove', function (e) {
      lastPtr = { x: e.clientX, y: e.clientY };
      if (ptrs[e.pointerId]) ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
      if (!drag) return hover(e);
      var ids = Object.keys(ptrs);
      if (drag.pinch && ids.length === 2) {
        var a = ptrs[ids[0]], b = ptrs[ids[1]], d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        cam = drag.cam; var p = toArt(drag.mx, drag.my);
        var k = drag.pinch / Math.max(10, d);
        var v = { x: p.x - (p.x - drag.cam.x) * k, y: p.y - (p.y - drag.cam.y) * k, w: drag.cam.w * k, h: drag.cam.h * k };
        var s = svg.getBoundingClientRect().width / v.w;
        v.x -= (mx - drag.mx) / s; v.y -= (my - drag.my) / s;
        setView(clampView(v));
        return;
      }
      if (ids.length !== 1) return;
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (!moved && Math.hypot(dx, dy) < 5) return;
      if (!moved) { moved = true; try { svg.setPointerCapture(e.pointerId); } catch (x) {} if (flying) { cancelAnimationFrame(flying); flying = null; } }
      var s2 = toArt(0, 0).s;
      setView(clampView({ x: drag.cam.x - dx / s2, y: drag.cam.y - dy / s2, w: drag.cam.w, h: drag.cam.h }));
      svg.classList.add('is-dragging');
    });
    function up(e) {
      delete ptrs[e.pointerId];
      if (!Object.keys(ptrs).length) { drag = null; svg.classList.remove('is-dragging'); }
      else if (drag && drag.pinch) drag = null;
    }
    svg.addEventListener('pointerup', up); svg.addEventListener('pointercancel', up);
    svg.addEventListener('dblclick', function (e) { var p = toArt(e.clientX, e.clientY); zoomAt(.55, p.x, p.y); });

    /* ----- pointing and clicking ----- */
    var lastPtr = null, hoverPart = null;
    function partAt(e) { var t = e.target && e.target.closest ? e.target.closest('[data-part]') : null; return t ? t.getAttribute('data-part') : null; }
    function hover(e) {
      var p = partAt(e);
      if (p === hoverPart) { if (p && opts.onEnter) opts.onEnter(p, e.target, e); return; }
      hoverPart = p;
      svg.style.cursor = p ? 'pointer' : 'grab';
      if (p && G[p] && opts.onEnter) opts.onEnter(p, e.target, e); else if (opts.onLeave) opts.onLeave();
    }
    svg.addEventListener('pointerleave', function () { hoverPart = null; lastPtr = null; if (opts.onLeave) opts.onLeave(); });
    svg.addEventListener('click', function (e) { if (moved) { moved = false; return; } var p = partAt(e); if (p && opts.onClick) opts.onClick(p); });

    function pin(target, label, colour) {
      var tag = opts.tag; if (!tag || !opts.map) return;
      var mr = opts.map.getBoundingClientRect(), x, y;
      if (lastPtr && lastPtr.x >= mr.left && lastPtr.x <= mr.right && lastPtr.y >= mr.top && lastPtr.y <= mr.bottom) { x = lastPtr.x - mr.left; y = lastPtr.y - mr.top - 14; }
      else if (target && target.getBoundingClientRect) { var r = target.getBoundingClientRect(); x = r.left + r.width / 2 - mr.left; y = r.top - mr.top - 6; }
      else return;
      tag.style.left = x + 'px'; tag.style.top = Math.max(22, y) + 'px';
      var pill = tag.querySelector('.tag__pill'); if (pill) pill.textContent = label;
      if (colour) tag.style.setProperty('--c', colour); else tag.style.removeProperty('--c');
      tag.classList.add('on');
    }
    function elFor(id) {
      if (hitOf[id]) return hitOf[id];
      var n = svg.querySelector('.cp__hits [data-part="' + id + '"]') || lensG.querySelector('[data-part="' + id + '"]');
      return n || null;
    }
    function boxOf(id, pad) {
      if (BOX[id]) return BOX[id];
      pad = pad == null ? 24 : pad;
      var b = null;
      function add(x0, y0, x1, y1) { if (!b) b = [x0, y0, x1, y1]; else { b[0] = Math.min(b[0], x0); b[1] = Math.min(b[1], y0); b[2] = Math.max(b[2], x1); b[3] = Math.max(b[3], y1); } }
      (ALIAS[id] || ORGAN_VESSELS[id] || [id]).forEach(function (k) {
        if (FLOW[k]) { var q = FLOW[k].box; add(q[0], q[1], q[0] + q[2], q[1] + q[3]); }
        if (CHAMBERS[k] || k === 'heart') add(BOX.heart.x + pad, BOX.heart.y + pad, BOX.heart.x + BOX.heart.w - pad, BOX.heart.y + BOX.heart.h - pad);
        if (organs[k] && k !== 'heart') organs[k].forEach(function (n) {
          var r = n.getBoundingClientRect(), a1 = toArt(r.left, r.top), a2 = toArt(r.right, r.bottom);
          add(a1.x, a1.y, a2.x, a2.y);
        });
      });
      if (!b) return FULL;
      return { x: b[0] - pad, y: b[1] - pad, w: b[2] - b[0] + pad * 2, h: b[3] - b[1] + pad * 2 };
    }

    /* ----- the names at the sides -----
       Each side is a column of names. Every leader is ONE level line, from a dot on its own part to
       its name, and each name is a full row from the next on its side, so no two leaders run close
       together and none bends (Daniel, 25 Sep, zoomed in: "it's very hard to differentiate all of the
       different kind of labels … they gather too closely … some are not exactly pointing where they
       should"). A name tries its hand-placed points first, then the points found in the drawing
       (js/circ-labelpts.js, plate-build/label-points.js: on an organ, clear of every vessel and of any
       organ lying over it; on a vessel, where nothing drawn in front covers it), nearest first, and
       keeps the point it had while that stays free, so names do not hop about as the camera moves.
       Lit parts are named first; parts outside a station's light keep their names, dimmed, while there
       is room. A name that finds no free row is left out: the line under the plate names what is lit.
       One name per word: "carotid artery" twice was clutter. */
    var labOn = true, labBeyond = false, labSvg = null;
    if (opts.map && opts.labels !== false) {
      labSvg = document.createElementNS(NS, 'svg');
      labSvg.setAttribute('class', 'cp-labels'); labSvg.setAttribute('aria-hidden', 'true');
      opts.map.appendChild(labSvg);
      /* a name is pressed like its part: the part is lit and the camera flies to it (Daniel, 25 Sep:
         "it'd be very nice if I could click on the labels and also get the zoom") */
      labSvg.addEventListener('click', function (e) {
        var g = e.target && e.target.closest ? e.target.closest('.cp-lab') : null;
        if (g && opts.onClick) opts.onClick(g.getAttribute('data-part'));
      });
    }
    var labRaf = null;
    function layoutLabels() {                 /* at most once a frame; a newer request replaces an older one */
      if (!labSvg) return;
      if (labRaf) cancelAnimationFrame(labRaf);
      labRaf = requestAnimationFrame(function () { labRaf = null; drawLabels(); });
    }
    var picked = {};                           /* name -> the point it used last time */
    function extra(id) { return !G[id] || G[id].note.indexOf(NOT) >= 0; }     /* not a name 0610 asks for */
    function autoPts(part) {                  /* a lit part with no name of its own: the points found in the drawing, or its longest vessel */
      if (AUTO[part] && AUTO[part].length) return AUTO[part];
      var P = FLOW[part]; if (!P) return null;
      var best = null;
      P.e.forEach(function (e) {
        var L = 0; for (var i = 0; i + 4 < e.length; i += 3) L += Math.hypot(e[i + 3] - e[i], e[i + 4] - e[i + 1]);
        var n = e.length / 3, i1 = 3 * Math.floor(n / 2), i2 = 3 * Math.floor(n / 4);
        if (!best || L > best[0]) best = [L, e[i1], e[i1 + 1], e[i2], e[i2 + 1]];
      });
      return best ? [[best[1], best[2]], [best[3], best[4]]] : null;
    }
    function drawLabels() {
      if (!labSvg) return;
      var m = opts.map.getBoundingClientRect(), W = m.width, H = m.height;
      labSvg.setAttribute('width', W); labSvg.setAttribute('height', H); labSvg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
      if (!labOn || W < 10) { labSvg.innerHTML = ''; return; }
      var small = W < 460, fs = small ? 11 : 12.5, pill = fs + 8, pad = 10;
      var ROW = pill + (small ? 8 : 10);       /* the least room between two leaders on one side */
      /* the drawing's units to px in the map, measured once for the whole layout */
      var r = svg.getBoundingClientRect(), a = r.width / r.height, va = cam.w / cam.h, sx, ox = r.left - m.left, oy = r.top - m.top;
      if (a > va) { sx = r.height / cam.h; ox += (r.width - cam.w * sx) / 2; } else { sx = r.width / cam.w; oy += (r.height - cam.h * sx) / 2; }
      function scr(q) { return { x: ox + (q[0] - cam.x) * sx, y: oy + (q[1] - cam.y) * sx }; }
      var scale = sx;
      var lensBox = null;
      if (lensMode) { var l0 = scr([LENS.x, LENS.y]), l1 = scr([LENS.x + LENS.w, LENS.y + LENS.h]); lensBox = [l0.x - 6, l0.y - 6, l1.x + 6, l1.y + 6]; }
      function inView(q) {
        if (q.x < 18 || q.x > W - 18 || q.y < pill / 2 + 6 || q.y > H - pill / 2 - 4) return false;
        return !(lensBox && q.x > lensBox[0] && q.x < lensBox[2] && q.y > lensBox[1] && q.y < lensBox[3]);
      }
      function isOn(id) { return !lit || !!lit[id] || (id === 'heart' && (lit.heart || anyChamber())); }
      /* the body's midline decides the side while it is in view; the middle of the picture when it is
         not; with the heart magnified on the right, every name goes to the left */
      var midX = scr([211.4, 0]).x;
      var mid = lensMode ? W + 1 : (midX > W * .22 && midX < W * .78 ? midX : W / 2);
      var cols, kept, named;
      function reset() { cols = { L: { w: 0, rows: [] }, R: { w: 0, rows: [] } }; kept = []; named = {}; }
      /* a name fits at a point if its dot is clear of the column (as wide as its longest name, this one
         included, which must not bring the column over a dot already placed) and a full row from every
         other name on that side */
      function fits(side, q, w) {
        var c = Math.max(cols[side].w, w);
        function clear(x) { return side === 'L' ? x >= pad + c + 16 : x <= W - pad - c - 16; }
        if (!clear(q.x)) return false;
        for (var i = 0; i < cols[side].rows.length; i++) {
          var o = cols[side].rows[i];
          if (Math.abs(o.y - q.y) < ROW) return false;
          if (w > cols[side].w && !clear(o.x)) return false;
        }
        return true;
      }
      function put(o, q, side, k) {
        o.x = q.x; o.y = q.y; o.side = side; o.k = k;
        cols[side].rows.push(o); cols[side].w = Math.max(cols[side].w, o.w);
        kept.push(o); if (o.on) named[o.id] = 1; picked[o.key] = k;
      }
      function lift(o) {                        /* take a placed name off again */
        var rows = cols[o.side].rows; rows.splice(rows.indexOf(o), 1); kept.splice(kept.indexOf(o), 1);
        cols[o.side].w = Math.max.apply(null, rows.map(function (x) { return x.w; }).concat([0]));
        if (o.on && !kept.some(function (x) { return x.on && x.id === o.id; })) delete named[o.id];
      }
      function tryAt(o, k) {
        var q = scr(o.pts[k]);
        if (!inView(q)) return false;
        var side = q.x < mid ? 'L' : 'R';
        if (!fits(side, q, o.w)) return false;
        put(o, q, side, k);
        return true;
      }
      function place(o) {
        var last = picked[o.key];
        if (last != null && last < o.pts.length && tryAt(o, last)) return true;
        for (var k = 0; k < o.pts.length; k++) if (k !== last && tryAt(o, k)) return true;
        return false;
      }
      /* a lit name with no free row makes room: the names in its way move to another of their own points;
         one that cannot move is dropped only if it is dimmed, or a lit organ or extra in the way of a
         syllabus vessel (an organ is known by its shape; a vessel only by its name) */
      function makeRoom(o) {
        for (var k = 0; k < o.pts.length; k++) {
          var q = scr(o.pts[k]); if (!inView(q)) continue;
          var side = q.x < mid ? 'L' : 'R';
          var near = cols[side].rows.filter(function (x) { return Math.abs(x.y - q.y) < ROW; });
          if (near.length > 3) continue;
          var was = near.map(function (x) { return { o: x, q: { x: x.x, y: x.y }, side: x.side, k: x.k }; });
          near.forEach(lift);
          if (!fits(side, q, o.w)) { was.forEach(function (w) { put(w.o, w.q, w.side, w.k); }); continue; }
          put(o, q, side, k);
          var moved = [], ok = true;
          near.slice().sort(function (a, b) { return a.dim - b.dim; }).forEach(function (b) {
            if (!ok) return;
            for (var j = 0; j < b.pts.length; j++) if (j !== b.k && tryAt(b, j)) { moved.push(b); return; }
            if (!(b.dim || (!extra(o.id) && !ORGANS[o.id] && (ORGANS[b.id] || extra(b.id))))) ok = false;
          });
          if (ok) return true;
          moved.forEach(lift); lift(o);
          was.forEach(function (w) { put(w.o, w.q, w.side, w.k); });
        }
        return false;
      }
      function gather(all) {
        var cand = [];
        names().forEach(function (N) {
          if (N.lv === 'X' && !labBeyond) return;
          if (N.lv === 'G' && labBeyond) return;
          if (N.needs && !organs[N.needs]) return;
          var on = isOn(N.id);
          if (lit && !on && N.lv !== 'A' && !all) return;               /* while a station lights its parts, only the syllabus names stay, dimmed, for finding your way */
          if (scale < N.z && !(lit && on && N.lv !== 'X')) return;       /* a lit part is named at any zoom */
          /* a station's lit names all come first — the syllabus names, then the extras (the gut's veins, the
             artery in the arm), then the artist's own names — each group the ones with fewest points in view
             first: a vessel has a few places to be named, an organ dozens */
          var room = 0; for (var k = 0; k < N.pts.length; k++) if (inView(scr(N.pts[k]))) room++;
          if (!room) return;
          cand.push({ key: N.key, id: N.id, text: N.text, lv: N.lv, on: on, dim: !!lit && !on, room: room,
                      rank: lit && on ? (N.lv === 'X' ? 3 : extra(N.id) ? 1 : 0) : (on ? 0 : 10) + LV_RANK[N.lv], i: N.i, pts: N.pts, w: N.text.length * fs * .56 + 16 });
        });
        cand.sort(function (x, y) { return x.rank - y.rank || (x.rank < 10 && lit ? x.room - y.room : 0) || x.i - y.i; });
        var litC = cand.filter(function (c) { return c.rank < 10; }), dimC = cand.filter(function (c) { return c.rank >= 10; });
        var missed = litC.filter(function (c) { return !place(c); });
        /* a lit part that no name reaches, in view: name it at a point found in the drawing */
        if (lit) Object.keys(lit).forEach(function (part) {
          if (named[part] || !G[part] || ALIAS[part] || CHAMBERS[part] || ORGANS[part] || part === 'heart') return;
          var at = autoPts(part); if (!at) return;
          var own = names().filter(function (N) { return N.id === part && N.lv !== 'X'; })[0];     /* the same words as its own name elsewhere */
          var text = own ? own.text : G[part].label.toLowerCase();
          var o = { key: 'auto:' + part, id: part, text: text, lv: 'B', on: true, dim: false, rank: 1, i: 999, pts: at, w: text.length * fs * .56 + 16 };
          if (!place(o)) missed.push(o);
        });
        dimC.forEach(place);
        missed.forEach(function (o) { if (!named[o.id] && !kept.some(function (x) { return x.key === o.key; })) makeRoom(o); });
      }
      reset(); gather(false);
      /* zoomed in where nothing lit is in view: the names of what is there, dimmed, rather than none */
      if (lit && !kept.some(function (q) { return q.on; })) { reset(); gather(true); }
      var out = '';
      ['L', 'R'].forEach(function (side) {
        var it = cols[side].rows; if (!it.length) return;
        var edge = side === 'L' ? pad + cols[side].w : W - pad - cols[side].w;
        it.forEach(function (o) {
          var d = 'M' + f2(o.x) + ' ' + f2(o.y) + 'L' + f2(edge) + ' ' + f2(o.y);
          var tx = side === 'L' ? edge - o.w : edge;
          var cls = 'cp-lab' + (o.lv === 'X' ? ' is-beyond' : '') + (o.dim ? ' is-dim' : '');
          out += '<g class="' + cls + '" data-part="' + o.id + '"><path class="cp-lab__halo" d="' + d + '"/><path class="cp-lab__lead" d="' + d + '"/><circle class="cp-lab__dot" cx="' + f2(o.x) + '" cy="' + f2(o.y) + '" r="2.2"/>' +
            '<rect class="cp-lab__pill" x="' + f2(tx) + '" y="' + f2(o.y - pill / 2) + '" width="' + f2(o.w) + '" height="' + f2(pill) + '" rx="' + f2(pill / 2) + '"/>' +
            '<text class="cp-lab__txt" x="' + f2(tx + o.w / 2) + '" y="' + f2(o.y + fs * .36) + '" text-anchor="middle" style="font-size:' + fs + 'px">' + o.text + '</text></g>';
        });
      });
      labSvg.innerHTML = out;
    }
    function labels(on, beyond) { if (on != null) labOn = !!on; if (beyond != null) labBeyond = !!beyond; layoutLabels(); }
    if (global.ResizeObserver && opts.map) {
      var ro = new ResizeObserver(function () {
        if (!svg.isConnected) { ro.disconnect(); return; }
        /* hidden (a widget is standing in the column): keep the view exactly as it is. Re-fitting it to a
           box of no size stretched it, and the body came back zoomed out (Daniel, 25 Sep: "It should
           remain zoomed in, even if I scroll up, and only zoom out if I click whole body") */
        var r = opts.map.getBoundingClientRect();
        if (r.width < 4 || r.height < 4) return;
        jump(cam && isZoomed() ? cam : FULL, true);
      });
      ro.observe(opts.map);
    }

    buildLens(); lens(null);
    applyLight();
    setView(clampView(fit(FULL)));
    paintBeat();

    return {
      G: G, FULL: FULL, BOX: BOX, light: light, clear: function () { return light(null); }, lens: lens,
      organVessels: function (id) { return ORGAN_VESSELS[id] || null; },
      flyTo: flyTo, jump: jump, boxOf: boxOf, isZoomed: isZoomed, zoomBy: zoomBy, home: function (done) { flyTo(FULL, done); },
      labels: labels, pin: pin, elFor: elFor,
      setRate: setRate, rate: function () { return bpm; },
      heartMode: function (m) { var k = m === 'exterior' ? 'exterior' : 'section'; if (k !== heartKind) { heartKind = k; buildLens(); lens(lensMode ? k : null); } },
      flow: function (on) { flowOn = on !== false; },
      start: start, stop: stop,
      /* for the headless checks: one moment of the beat, the blood t seconds on, and the names now */
      __seek: function (ph, t) {
        stop(); phase = ph || 0; beat = beatState(phase, bpm); paintBeat();
        flows.forEach(function (f) { f.off = 0; }); moveFlow(t || 0);
        drawLabels();
      }
    };
  }

  global.CircDraw = CircDraw;
  global.CircDraw.G = G;
  global.CircDraw.LABELS = LABELS;          /* for plate-build/label-points.js, which checks the hand-placed points */
  global.CircDraw.beatState = beatState;
})(window);
