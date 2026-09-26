/* ============================================================
   heart3d.js — the heart in three dimensions, for the heart3d widget (js/w-heart3d.js).

   Loaded ONLY when the widget comes on screen, by a dynamic import() in w-heart3d.js, so a
   reader who never reaches the heart never downloads three.js or the model. Everything it needs
   is vendored in js/vendor/three (three.js r185.1, MIT) and assets/3d/heart.glb: nothing comes
   from a CDN at run time, and every import carries a ?v= stamp so the lab's service worker keeps
   it for offline use.

   THE MODEL (assets/3d/CREDITS.md has the full record)
   A real human heart: the HuBMAP Human Reference Atlas "3D Reference Organ for Heart, Male v1.3"
   (Browne and Schlehlein 2024, CC BY 4.0), segmented from the Visible Human Male of the US
   National Library of Medicine, with the great vessels and coronary arteries from the same
   body's "Blood Vasculature, Male v1.3". Frame (baked into the file): 1 unit = 1 decimetre,
   +x = the body's LEFT, +y = superior, +z = anterior. A camera on +z therefore sees the heart
   exactly as it sits in a person facing you: its right side on your left, the apex to your right.
   The chamber meshes are SOLID myocardium, so a cut shows the true wall thickness.

   What this file adds to the scan, because a scan is one moment and a lab needs a beat:
     - the valve cusps: drawn here, on the model's own valve rings, so they can open and close
       (3 tricuspid, 2 mitral, 3 + 3 semilunar), with chordae tendineae to the model's own
       papillary muscles;
     - the blood: particles moved by volume through five compartments a side (vein, atrium,
       ventricle, the root of the artery, artery), on paths traced through the model's own cavities
       and lumens (see CREDITS.md), spread through all the room each chamber leaves round its path;
     - in the Blood flow and Valves tabs, the walls as glass: clear face on, bright edge on, the
       right side outlined in blue and the left in red, the septum cream;
     - the beat: a smooth squeeze of each chamber towards its cavity centre.

   The biology it animates, with sources (checked 25 Sep 2026):
     OpenStax Anatomy and Physiology 2e (2022, CC BY 4.0), 19.1 Heart Anatomy:
       the superior and inferior venae cavae (and the coronary sinus) empty into the right atrium;
       four pulmonary veins return blood to the left atrium; the tricuspid valve has three
       leaflets, the mitral two, the pulmonary and aortic valves three each; chordae tendineae
       and papillary muscles stop the cusps being forced into the atria; the left and right
       coronary arteries arise from the aortic sinuses, just above the aortic valve; the left
       ventricular myocardium is significantly thicker than the right.
     OpenStax 19.3 Cardiac Cycle: pressure gradients open and shut the valves (valves have no
       muscle); atrial systole ~100 ms, ventricular systole ~270 ms, diastole ~430 ms at 75 beats
       a minute; S1 ("lub") is the atrioventricular valves closing, S2 ("dub") the semilunar
       valves closing; atrial contraction adds the last 20-30 % of ventricular filling.
     Measured on this model (raycasts from each cavity): left ventricle wall 10-16 mm, right
       ventricle wall 5-7 mm, atria 3-7 mm.
   ============================================================ */
import * as THREE from './vendor/three/build/three.module.min.js?v=0.185.1';
import { GLTFLoader } from './vendor/three/examples/jsm/loaders/GLTFLoader.js?v=0.185.1';
import { OrbitControls } from './vendor/three/examples/jsm/controls/OrbitControls.js?v=0.185.1';
import { MeshoptDecoder } from './vendor/three/examples/jsm/libs/meshopt_decoder.module.js?v=0.185.1';
import { RoomEnvironment } from './vendor/three/examples/jsm/environments/RoomEnvironment.js?v=0.185.1';

/* ---------- the look of each part ----------
   Muscle is dark red-brown, cut muscle a paler red, valve tissue cream. Arteries are pale, as they
   are in a dissection; the venae cavae look blue-purple because their walls are thin and the
   blood behind them is dark. The coronary arteries are a brighter red so they can be found. */
const LOOK = {
  lv: { c: 0x8c302b, cap: 0xc9665b }, rv: { c: 0x8c302b, cap: 0xc9665b }, septum: { c: 0x8c302b, cap: 0xc9665b },
  la: { c: 0x96433c, cap: 0xd4766a }, ra: { c: 0x96433c, cap: 0xd4766a },
  pap_lv_al: { c: 0x86302b, cap: 0xc9665b }, pap_lv_pm: { c: 0x86302b, cap: 0xc9665b },
  pap_rv_ant: { c: 0x86302b, cap: 0xc9665b }, pap_rv_post: { c: 0x86302b, cap: 0xc9665b }, pap_rv_sep: { c: 0x86302b, cap: 0xc9665b },
  valve_tri: { c: 0xeadcc6, cap: 0xf7efe2 }, valve_mit: { c: 0xeadcc6, cap: 0xf7efe2 },
  valve_aor: { c: 0xeadcc6, cap: 0xf7efe2 }, valve_pul: { c: 0xeadcc6, cap: 0xf7efe2 },
  aorta: { c: 0xdcb4aa, r: 0.52 }, pulmonary_artery: { c: 0xd9b0ab, r: 0.52 },
  pulmonary_veins: { c: 0xb65b5f, r: 0.5 }, vena_cava_sup: { c: 0x5d4d80, r: 0.5 }, vena_cava_inf: { c: 0x5d4d80, r: 0.5 },
  coronary: { c: 0xd9483e, r: 0.4 }
};
const SOLID = /^(lv|rv|la|ra|septum|pap_|valve_)/;
/* the cut depth past which only a stray sliver of a part would be left floating: hide it there
   (measured on the model: at the four-chamber cut 1.4 % of the aorta is left, a crescent of the
   descending aorta that looked like a vessel leaving the left atrium) */
const GONE_AT = { aorta: 0.45, valve_pul: 0.2, valve_aor: 0.35 };
const MODEL_VALVE = /^valve_/;
/* the blood, in the lab's own reds and blues (heart-art.js COL.oxy / COL.deo) */
const BLOOD = { deo: 0x3b62b5, oxy: 0xd63c3b };

const clamp = (x, a, b) => (x < a ? a : x > b ? b : x);
const lerp = (a, b, k) => a + (b - a) * k;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

export function webglAvailable() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGL2RenderingContext && c.getContext('webgl2')) || !!c.getContext('webgl');
  } catch (e) { return false; }
}

/* A small seeded random, so the blood starts in the same places every time and a headless
   check of frame t is repeatable. */
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

export async function mount(host, opts) {
  opts = opts || {};
  const reduced = !!opts.reduced;
  const coarse = !!opts.coarse;
  const NAMES = opts.names || {};
  const disposers = [];
  let dead = false;

  /* ---------------- renderer, scene, camera ---------------- */
  const gl = document.createElement('div'); gl.className = 'h3__gl'; host.appendChild(gl);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, stencil: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.test });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.localClippingEnabled = true;
  renderer.setClearColor(0x000000, 0);
  gl.appendChild(renderer.domElement);
  renderer.domElement.setAttribute('role', 'img');
  renderer.domElement.setAttribute('aria-label', opts.ariaLabel || 'A real human heart in three dimensions.');

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  const envTex = pmrem.fromScene(room, 0.04).texture;
  room.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) o.material.dispose(); });
  pmrem.dispose();
  scene.environment = envTex; scene.environmentIntensity = 0.55;
  scene.add(new THREE.HemisphereLight(0xfff2e8, 0x1a2430, 0.75));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(-1.2, 1.6, 2.4); scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd8ff, 0.6); fill.position.set(2, 0.3, 1); scene.add(fill);
  const rim = new THREE.DirectionalLight(0xffe0c0, 0.7); rim.position.set(0.5, -1, -2); scene.add(rim);

  const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 60);
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = !reduced; controls.dampingFactor = 0.16;
  controls.enablePan = true; controls.screenSpacePanning = true;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  /* Turning (Daniel, 25 Sep: "with the mouse it's very very bad ... it's very hard to move around"): a
     third of the stage's height swung the camera right over the top, where an orbit is stuck looking
     straight down, and the heart kept drifting after the mouse let go. So: two thirds of the speed with a mouse,
     never closer than 20 degrees to either pole, and it stops soon after you let go. */
  controls.rotateSpeed = coarse ? 0.7 : 0.55; controls.zoomSpeed = 0.9;
  controls.minPolarAngle = 0.35; controls.maxPolarAngle = Math.PI - 0.35;

  /* the heart: everything that belongs to it lives in this group, which turns for the section view */
  const heart = new THREE.Group(); scene.add(heart);

  /* ---------------- the model ---------------- */
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  let gltf;
  try { gltf = await loader.loadAsync(opts.model, (ev) => { if (opts.onProgress) opts.onProgress(ev.loaded, ev.total); }); }
  catch (e) {
    /* the model did not arrive: leave nothing behind, so the widget can try again or draw the 2D heart */
    controls.dispose(); envTex.dispose(); renderer.dispose(); gl.remove();
    throw e;
  }
  if (dead) return null;
  const X = gltf.scene.userData || {};            /* the paths, rings and plane written by the build */
  heart.add(gltf.scene);
  heart.updateMatrixWorld(true);

  /* beat: every chamber squeezes towards its cavity centre, a smooth field shared by the GPU (walls)
     and the CPU (valves, blood), so nothing tears apart. w = amount, k = 1/(2 sigma^2). */
  const CH = ['ra', 'la', 'rv', 'lv'];
  const beatC = CH.map((k) => new THREE.Vector4(X.centres[k][0], X.centres[k][1], X.centres[k][2], 0));
  const SIG = { ra: 0.26, la: 0.26, rv: 0.34, lv: 0.36 };
  const beatK = new THREE.Vector4(...CH.map((k) => 1 / (2 * SIG[k] * SIG[k])));
  const U_BEAT_C = { value: beatC }, U_BEAT_K = { value: beatK };
  const U_CUT_D = { value: 1e3 };      /* the cut's depth along the plane's normal (1e3: no cut) */
  function beatDisp(p, out) {
    out.set(0, 0, 0);
    for (let i = 0; i < 4; i++) {
      const c = beatC[i]; if (!c.w) continue;
      const qx = c.x - p.x, qy = c.y - p.y, qz = c.z - p.z;
      const k = c.w * Math.exp(-(qx * qx + qy * qy + qz * qz) * beatK.getComponent(i));
      out.x += qx * k; out.y += qy * k; out.z += qz * k;
    }
    return out;
  }

  const clipLocal = new THREE.Plane(new THREE.Vector3(), 1e3);   /* in the heart's own frame */
  const clipWorld = new THREE.Plane(new THREE.Vector3(0, 0, -1), 1e3);
  const PLANES = [clipWorld];

  const BEAT_VS = `
uniform vec4 uBeatC[4]; uniform vec4 uBeatK; uniform mat4 uL2H; uniform mat4 uH2L;
vec3 h3beat(vec3 p){ vec3 d = vec3(0.0); for (int i = 0; i < 4; i++) { vec3 q = uBeatC[i].xyz - p; d += q * (uBeatC[i].w * exp(-dot(q, q) * uBeatK[i])); } return d; }`;
  function patchWall(mat, mesh, capHex) {
    const L2H = new THREE.Matrix4().copy(mesh.matrixWorld);        /* heart is at identity now */
    const H2L = L2H.clone().invert();
    const u = { uBeatC: U_BEAT_C, uBeatK: U_BEAT_K, uL2H: { value: L2H }, uH2L: { value: H2L },
                uCap: { value: new THREE.Color().setHex(capHex || 0xffffff, THREE.LinearSRGBColorSpace) }, uCapOn: { value: 1 } };
    mat.userData.u = u;
    mat.onBeforeCompile = (sh) => {
      Object.assign(sh.uniforms, u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + BEAT_VS)
        .replace('#include <begin_vertex>', '#include <begin_vertex>\n{ vec3 hp = (uL2H * vec4(transformed, 1.0)).xyz; hp += h3beat(hp); transformed = (uH2L * vec4(hp, 1.0)).xyz; }');
      if (capHex != null) sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform vec3 uCap; uniform float uCapOn;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\nif (!gl_FrontFacing && uCapOn > 0.5) gl_FragColor = vec4(uCap, 1.0);');
      if (loose(mesh)) patchLoose(sh);
    };
    mat.customProgramCacheKey = () => (capHex != null ? 'h3wall-cap' : loose(mesh) ? 'h3wall-loose' : 'h3wall');
  }
  /* a vessel's pieces cut loose (see "pieces cut loose" below): each point carries the shallowest cut
     that still leaves it joined to the heart, and is not drawn once the cut is deeper */
  const loose = (mesh) => !!(mesh && mesh.geometry.getAttribute('aJoin'));      /* the moving valves pass no mesh */
  function patchLoose(sh) {
    sh.uniforms.uCutD = U_CUT_D;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aJoin; varying float vJoin;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvJoin = aJoin;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uCutD; varying float vJoin;')
      .replace('#include <clipping_planes_fragment>', '#include <clipping_planes_fragment>\nif (vJoin > uCutD) discard;');
  }
  /* the picking pass: one flat colour per part, and back faces (the cut surface) flagged */
  function idMaterial(index, mesh) {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, clippingPlanes: PLANES });
    m.onBeforeCompile = (sh) => {
      if (loose(mesh)) patchLoose(sh);
      sh.uniforms.uId = { value: index / 255 };
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uId;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor = vec4(uId, gl_FrontFacing ? 0.0 : 1.0, 0.0, 1.0);');
    };
    m.customProgramCacheKey = () => (loose(mesh) ? 'h3id-loose' : 'h3id');
    return m;
  }

  const parts = {};            /* id -> { mesh, mat, idMat, index } */
  const byIndex = [null];
  let plug = null;
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const id = o.name || (o.parent && o.parent.name);
    if (id === 'ra_plug') { plug = o; return; }          /* joined to the right atrium below */
    const look = LOOK[id] || { c: 0x999999 };
    const solid = SOLID.test(id);
    const mat = new THREE.MeshStandardMaterial({ color: look.c, roughness: look.r || 0.62, metalness: 0, side: THREE.DoubleSide, clippingPlanes: PLANES });
    patchWall(mat, o, solid ? look.cap : null);
    o.material = mat;
    const index = byIndex.length; byIndex.push(id);
    parts[id] = { id, mesh: o, mat, idMat: idMaterial(index, o), index, solid };
  });
  /* ---------------- a hole in the right atrium's wall ----------------
     In the model a small tunnel, about 1.5 by 3 mm, runs through the back wall of the right atrium
     low down beside the inferior vena cava; there is no vessel in it. From behind it looked like a
     hole, with the tricuspid valve white through it (Daniel, 26 Sep: "in the back, there is a little
     hole"). The model file carries a plug made to fit it (ra_plug: the wall's own shape closed over
     the tunnel; assets/3d/CREDITS.md), joined to the wall here so that it is the wall: it is pressed,
     lit, cut and counted in the cut face as the right atrium. */
  (function joinPlug() {
    if (!plug || !parts.ra) return;
    const ra = parts.ra.mesh, g = ra.geometry, pg = plug.geometry;
    const toRa = new THREE.Matrix4().copy(ra.matrixWorld).invert().multiply(plug.matrixWorld), nm = new THREE.Matrix3().getNormalMatrix(toRa);
    const gp = g.getAttribute('position'), gn = g.getAttribute('normal'), pp = pg.getAttribute('position'), pn = pg.getAttribute('normal');
    const n0 = gp.count, n1 = pp.count, P = new THREE.Vector3(), N = new THREE.Vector3();
    const pos = new Float32Array((n0 + n1) * 3), nor = new Float32Array((n0 + n1) * 3);
    for (let i = 0; i < n0; i++) { P.fromBufferAttribute(gp, i).toArray(pos, i * 3); if (gn) N.fromBufferAttribute(gn, i).toArray(nor, i * 3); }
    for (let i = 0; i < n1; i++) {
      P.fromBufferAttribute(pp, i).applyMatrix4(toRa).toArray(pos, (n0 + i) * 3);
      if (pn) N.fromBufferAttribute(pn, i).applyMatrix3(nm).normalize().toArray(nor, (n0 + i) * 3);
    }
    const ia = Array.from(g.index.array), ib = pg.index.array;
    for (let i = 0; i < ib.length; i++) ia.push(ib[i] + n0);
    const ng = new THREE.BufferGeometry();
    ng.setAttribute('position', new THREE.BufferAttribute(pos, 3)); ng.setAttribute('normal', new THREE.BufferAttribute(nor, 3)); ng.setIndex(ia);
    g.dispose(); pg.dispose(); ra.geometry = ng; plug.parent.remove(plug);
  })();
  /* ---------------- the coronary arteries' ends ----------------
     The model's coronary branches stop as open tubes, 4 to 5 mm across, most of them on the back of
     the heart within 2 mm of its wall: seen end on, each looked like a hole in the heart (Daniel,
     26 Sep: "in the back, there is a little hole"). Each open end is closed with a flat disc in the
     artery's own colour, so a branch simply stops, as it does where a real one passes into the wall. */
  (function closeEnds(pt) {
    if (!pt) return;
    const g = pt.mesh.geometry, pos = g.getAttribute('position'), n = pos.count, idx = g.index;
    if (!idx) return;
    const P = new THREE.Vector3(), key = (i) => { P.fromBufferAttribute(pos, i); return P.x.toFixed(6) + ',' + P.y.toFixed(6) + ',' + P.z.toFixed(6); };
    const node = new Int32Array(n), at = new Map(), first = [];
    for (let i = 0; i < n; i++) { const k = key(i); let j = at.get(k); if (j === undefined) { j = first.length; at.set(k, j); first.push(i); } node[i] = j; }
    /* an edge used by one triangle only is on an open end; its direction is kept, so the disc faces out */
    const I = idx.array, uses = new Map(), dir = new Map();
    for (let t = 0; t < I.length; t += 3) for (let e = 0; e < 3; e++) {
      const a = node[I[t + e]], b = node[I[t + (e + 1) % 3]], k = a < b ? a + ',' + b : b + ',' + a;
      uses.set(k, (uses.get(k) || 0) + 1); dir.set(k, [a, b]);
    }
    const edges = []; uses.forEach((c, k) => { if (c === 1) edges.push(dir.get(k)); });
    if (!edges.length) return;
    /* the edges of one end share their points: group them */
    const up = new Map(), find = (x) => { while (up.has(x) && up.get(x) !== x) x = up.get(x); return x; };
    edges.forEach(([a, b]) => { const ra = find(a), rb = find(b); if (!up.has(ra)) up.set(ra, ra); if (!up.has(rb)) up.set(rb, rb); if (ra !== rb) up.set(ra, rb); });
    const ends = new Map(); edges.forEach((e) => { const r = find(e[0]); if (!ends.has(r)) ends.set(r, []); ends.get(r).push(e); });
    /* new attributes: the old values, then per end its rim again (with the disc's normal) and its centre */
    const names = Object.keys(g.attributes), add = [];
    ends.forEach((es) => {
      const c = new THREE.Vector3(), N = new THREE.Vector3(), A = new THREE.Vector3(), B = new THREE.Vector3(), rim = [];
      es.forEach(([a, b]) => { rim.push(a, b); c.add(A.fromBufferAttribute(pos, first[a])); }); c.divideScalar(es.length);
      es.forEach(([a, b]) => { A.fromBufferAttribute(pos, first[b]).sub(c); B.fromBufferAttribute(pos, first[a]).sub(c); N.add(A.clone().cross(B)); });
      add.push({ es, c, N: N.normalize() });
    });
    let extra = 0; add.forEach((d) => { extra += d.es.length * 2 + 1; });
    const total = n + extra, next = {};
    names.forEach((nm) => {
      const at0 = g.getAttribute(nm), isz = at0.itemSize, arr = new Float32Array(total * isz);
      for (let i = 0; i < n; i++) for (let q = 0; q < isz; q++) arr[i * isz + q] = at0.getComponent ? at0.getComponent(i, q) : [at0.getX(i), at0.getY(i), at0.getZ(i), at0.getW(i)][q];
      next[nm] = { arr, isz };
    });
    const tris = Array.from(I); let v = n;
    const put = (src, p, normal) => {           /* a new point copying src's values, at p, with normal */
      names.forEach((nm) => { const { arr, isz } = next[nm]; for (let q = 0; q < isz; q++) arr[v * isz + q] = arr[src * isz + q]; });
      next.position.arr.set([p.x, p.y, p.z], v * 3);
      if (next.normal) next.normal.arr.set([normal.x, normal.y, normal.z], v * 3);
      return v++;
    };
    const T = new THREE.Vector3();
    add.forEach(({ es, c, N }) => {
      const mid = put(first[es[0][0]], c, N);
      es.forEach(([a, b]) => {
        const pa = put(first[a], T.fromBufferAttribute(pos, first[a]), N), pb = put(first[b], T.fromBufferAttribute(pos, first[b]), N);
        tris.push(pb, pa, mid);                 /* the rim edge the other way round: the disc faces out */
      });
    });
    const ng = new THREE.BufferGeometry();
    names.forEach((nm) => ng.setAttribute(nm, new THREE.BufferAttribute(next[nm].arr, next[nm].isz)));
    ng.setIndex(tris);
    g.dispose(); pt.mesh.geometry = ng;
  })(parts.coronary);
  /* ---------------- the left ventricle's papillary muscles ----------------
     The model's two are rods 4 to 5 cm long down the middle of the left ventricle, 7 to 12 mm from the
     mitral valve's axis, joined to no wall (Daniel, 26 Sep: "as if they were floating"). They are drawn
     here as in the textbooks instead: each rises from the ventricle's wall halfway to the apex (50 mm
     below the valve ring), under one end of the mitral valve's opening (where its two flaps meet: the
     front one at 65 degrees from the middle of the front flap; the back one at 85, a little towards the
     back flap, which keeps it whole behind the four-chamber cut), and reaches half way to the flaps'
     edge; the tendons take the other half. That makes each about 17 mm long, with tendons as long. They replace the
     model's shapes under the same names, so they are pressed, lit and cut as before. The right
     ventricle's three are the model's own: joined to its wall and well placed. */
  const PAP_TIP = {};
  (function leftPapillary() {
    const walls = ['lv', 'septum'].map((k) => parts[k] && parts[k].mesh).filter(Boolean);
    const f = ringFrame(X.valves.mit), rc = new THREE.Raycaster();
    [['pap_lv_pm', 85], ['pap_lv_al', -65]].forEach(([id, ang]) => {
      const pt = parts[id]; if (!pt || walls.length < 2) return;
      const e = f.u.clone().multiplyScalar(Math.cos(ang * Math.PI / 180)).addScaledVector(f.w, Math.sin(ang * Math.PI / 180));
      const a = f.c.clone().addScaledVector(f.n, 0.5);
      rc.set(a, e); const hit = rc.intersectObjects(walls, false)[0]; if (!hit) return;
      const base = hit.point, edge = f.c.clone().addScaledVector(f.n, 0.16).addScaledVector(e, f.r * 0.7);
      const dir = edge.clone().sub(base), L = dir.length() * 0.5; dir.normalize();
      const tip = base.clone().addScaledVector(dir, L); PAP_TIP[id] = tip;
      /* a round-tipped pillar, flared where it grows from the wall; its foot is sunk 3 mm into the wall */
      const R = 0.028, prof = [[0, -0.03], [0.058, -0.03], [0.05, 0], [0.042, L * 0.3], [0.034, L * 0.65], [R, L - R]];
      for (let k = 1; k <= 6; k++) { const t = k / 6 * Math.PI / 2; prof.push([R * Math.cos(t), L - R + R * Math.sin(t)]); }
      const g = new THREE.LatheGeometry(prof.map(([x, y]) => new THREE.Vector2(Math.max(x, 1e-5), y)), 18);
      g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)); g.translate(base.x, base.y, base.z);
      /* into the part's own frame (the model's parts carry their quantisation in their matrices) */
      const inv = new THREE.Matrix4().copy(pt.mesh.matrixWorld).invert(); g.applyMatrix4(inv);
      /* outward-facing, so the cut face counts it as solid */
      const P = g.getAttribute('position'), I = g.index.array; let vol = 0; const A = new THREE.Vector3(), B = new THREE.Vector3(), C = new THREE.Vector3();
      for (let t = 0; t < I.length; t += 3) { A.fromBufferAttribute(P, I[t]); B.fromBufferAttribute(P, I[t + 1]); C.fromBufferAttribute(P, I[t + 2]); vol += A.dot(B.cross(C)); }
      if (vol < 0) { for (let t = 0; t < I.length; t += 3) { const q = I[t + 1]; I[t + 1] = I[t + 2]; I[t + 2] = q; } g.computeVertexNormals(); }
      g.deleteAttribute('uv');
      pt.mesh.geometry.dispose(); pt.mesh.geometry = g;
    });
  })();
  /* ---------------- the cut face ----------------
     Drawn ON the cut plane, the stencil way (three.js's clipping-stencil example, with the test done by
     depth), after the heart itself:
       1. the plane's depth is written;
       2. for one group of closed solids, every face that lies behind the plane counts into the stencil,
          +1 for a back face and -1 for a front face, so wherever the plane passes through any of the
          group's solids the count is not zero;
       3. a flat face in the group's cut colour is drawn on the plane there, over whatever is drawn
          (seen from the open side, nothing kept lies between you and the cut), and the count is reset;
       then the next group. The valves go first and the walls over them: an atrioventricular valve's
       rim lies inside the wall it is sewn into, and its cut showed as white islands in the wall's cut
       face. (The semilunar valves' rims were moved out of the walls in the model itself.) Seen from the other side the cut face is
     inside the heart, so none of this is drawn. The depth test in step 2 is made for every sample of a
     pixel; the clipping plane's own test is made once per pixel, so near a wall standing edge-on to you
     a few samples of it poke through the cut, and a cut face tested against them showed faint dotted
     lines where two solids meet. The model's septum overlaps the walls of both ventricles; the old way
     (each wall's back faces coloured) let its buried faces show through the cut as slivers and streaks
     from some angles (Daniel, 26 Sep: "some sections look a little bit wonky"). Parts whose mesh is not
     closed (the right ventricle's papillary muscles, the aortic valve) keep the old way: a count through
     an open mesh would be wrong. */
  const CAP_GROUPS = [
    { ids: ['valve_tri', 'valve_mit', 'valve_pul'], color: 0xf7efe2 },
    { ids: ['lv', 'rv', 'septum', 'pap_lv_al', 'pap_lv_pm'], color: 0xc9665b },
    { ids: ['la', 'ra'], color: 0xd4766a }
  ];
  const capObjs = [], capQuads = [];
  const capPlane = new THREE.PlaneGeometry(4, 4);
  const capDepth = new THREE.Mesh(capPlane, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, depthFunc: THREE.AlwaysDepth, side: THREE.DoubleSide }));
  capDepth.renderOrder = 19; capDepth.visible = false; capDepth.frustumCulled = false;
  heart.add(capDepth); capObjs.push(capDepth);
  function stencilMat(side, op, part) {
    const m = new THREE.MeshBasicMaterial({ side, colorWrite: false, depthWrite: false, depthFunc: THREE.GreaterDepth,
      stencilWrite: true, stencilFunc: THREE.AlwaysStencilFunc, stencilRef: 0,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.KeepStencilOp, stencilZPass: op });
    patchWall(m, part.mesh, null);           /* the same beat as the wall it counts */
    return m;
  }
  CAP_GROUPS.forEach((g, gi) => {
    g.ids.forEach((id) => {
      const pt = parts[id]; if (!pt) return;
      [[THREE.BackSide, THREE.IncrementWrapStencilOp], [THREE.FrontSide, THREE.DecrementWrapStencilOp]].forEach(([side, op]) => {
        const c = new THREE.Mesh(pt.mesh.geometry, stencilMat(side, op, pt));
        c.renderOrder = 20 + gi * 2; c.frustumCulled = false; c.visible = false;
        pt.mesh.add(c); capObjs.push(c);                 /* a child: it turns, hides and beats with its part */
      });
    });
    const q = new THREE.Mesh(capPlane, new THREE.MeshBasicMaterial({ color: g.color, toneMapped: false, side: THREE.DoubleSide,
      depthTest: false, depthWrite: false, stencilWrite: true, stencilRef: 0, stencilFunc: THREE.NotEqualStencilFunc,
      stencilFail: THREE.KeepStencilOp, stencilZFail: THREE.ReplaceStencilOp, stencilZPass: THREE.ReplaceStencilOp }));
    q.renderOrder = 21 + gi * 2; q.visible = false; q.frustumCulled = false;
    heart.add(q); capQuads.push(q); capObjs.push(q);
  });
  const box = new THREE.Box3();
  ['lv', 'rv', 'la', 'ra', 'aorta', 'pulmonary_artery', 'vena_cava_sup', 'vena_cava_inf'].forEach((k) => parts[k] && box.expandByObject(parts[k].mesh));
  const FOCUS = box.getCenter(new THREE.Vector3());
  const SIZE = box.getSize(new THREE.Vector3());
  const DIST = Math.max(SIZE.y, SIZE.x * 1.15) / (2 * Math.tan(THREE.MathUtils.degToRad(15))) * 1.08;
  controls.target.copy(FOCUS);
  controls.minDistance = DIST * 0.35; controls.maxDistance = DIST * 2.2;

  /* ---------------- the valves that move ----------------
     Each ring comes from the model's own valve (centre, axis, radius; build step valves.py); the cusps
     are drawn on it. An atrioventricular cusp is a sheet from the ring to a free edge: open, the free
     edges hang into the ventricle as a funnel; shut, they meet in the middle and the cusps bulge a
     little towards the atrium, held there by the chordae. A semilunar cusp hangs from a U-shaped line
     on the artery wall: open, it lies back against the wall; shut, the three free edges meet in the
     middle and the pocket below each fills with blood. */
  const V = X.valves;
  const vgroup = new THREE.Group(); heart.add(vgroup);
  const valveMat = new THREE.MeshStandardMaterial({ color: 0xeee0c8, roughness: 0.5, metalness: 0, side: THREE.DoubleSide, clippingPlanes: PLANES });
  const cordMat = new THREE.LineBasicMaterial({ color: 0xf6eedc, transparent: true, opacity: 0.85, clippingPlanes: PLANES });
  const NU = 14, NV = 9;
  function ringFrame(v) {
    const n = new THREE.Vector3(...v.n).normalize();
    const u = new THREE.Vector3(...v.u); u.addScaledVector(n, -u.dot(n)).normalize();
    const w = new THREE.Vector3().crossVectors(n, u);
    return { c: new THREE.Vector3(...v.c), n, u, w, r: v.r, depth: v.depth };
  }
  const deg = (d) => d * Math.PI / 180;
  /* cusp spans, in degrees round the ring from its reference direction:
     tricuspid — septal cusp centred on the septum, then anterior, then posterior;
     mitral — anterior (aortic) cusp centred towards the aortic valve, a third of the ring and longer;
     aortic — the right coronary cusp centred on the right coronary ostium, the left one near the left
     ostium, the non-coronary cusp between; pulmonary — three equal cusps. */
  const aorL = (V.aor.left_angle_deg || 120);
  const VALVES = {
    tri: { kind: 'av', f: ringFrame(V.tri), cusps: [[-60, 60, 0.95], [60, 180, 1.0], [180, 300, 0.85]], paps: [['pap_rv_sep', 'pap_rv_ant'], ['pap_rv_ant', 'pap_rv_post'], ['pap_rv_post', 'pap_rv_sep']] },
    mit: { kind: 'av', f: ringFrame(V.mit), cusps: [[-65, 65, 1.1], [65, 295, 0.7]], paps: [['pap_lv_pm', 'pap_lv_al'], ['pap_lv_al', 'pap_lv_pm']] },
    aor: { kind: 'sl', f: ringFrame(V.aor), cusps: aorL > 0 ? [[-60, 60], [60, 180], [180, 300]] : [[-60, 60], [180, 300], [60, 180]] },
    pul: { kind: 'sl', f: ringFrame(V.pul), cusps: [[-60, 60], [60, 180], [180, 300]] }
  };
  /* the ring is drawn a little inside the scan's valve ring, so the cusps sit in the orifice */
  VALVES.tri.f.r *= 0.9; VALVES.mit.f.r *= 0.86;
  const PAPS = {}; Object.keys(V.paps).forEach((k) => { PAPS[k] = PAP_TIP[k] ? PAP_TIP[k].clone() : new THREE.Vector3(...V.paps[k]); });
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), tmpD = new THREE.Vector3();
  Object.keys(VALVES).forEach((key) => {
    const vv = VALVES[key];
    const per = (NU + 1) * (NV + 1), n = vv.cusps.length;
    const pos = new Float32Array(per * n * 3);
    const idx = [];
    for (let c = 0; c < n; c++) for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) {
      const a = c * per + i * (NV + 1) + j, b = a + NV + 1;
      idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setIndex(idx);
    const mesh = new THREE.Mesh(g, valveMat.clone()); mesh.name = 'pv_' + key; mesh.frustumCulled = false;
    vgroup.add(mesh);
    vv.mesh = mesh; vv.open = 0; vv.dirty = true;
    vv.idMat = idMaterial(byIndex.length); byIndex.push('valve_' + key); vv.index = byIndex.length - 1;
    if (vv.kind === 'av') {
      const cordN = n * 4;
      const cg = new THREE.BufferGeometry(); cg.setAttribute('position', new THREE.BufferAttribute(new Float32Array(cordN * 2 * 3), 3));
      vv.cords = new THREE.LineSegments(cg, cordMat); vv.cords.frustumCulled = false; vgroup.add(vv.cords);
    }
  });
  function buildValve(key) {
    const vv = VALVES[key], f = vv.f, o = vv.open, per = (NU + 1) * (NV + 1);
    const pos = vv.mesh.geometry.attributes.position.array;
    const c = tmpD.copy(f.c).add(beatDisp(f.c, tmpA));
    let k = 0;
    const P = new THREE.Vector3();
    const cordPts = [];
    vv.cusps.forEach((cs, ci) => {
      const ta = deg(cs[0]), tb = deg(cs[1]);
      for (let i = 0; i <= NU; i++) {
        const uu = i / NU, th = lerp(ta, tb, uu);
        const ct = Math.cos(th), st = Math.sin(th);
        /* the edge where this cusp meets its neighbours when shut: out along one radius, in along the other */
        const side = uu <= 0.5 ? ta : tb, rho = Math.abs(1 - 2 * uu);
        const cs2 = Math.cos(side), ss2 = Math.sin(side);
        for (let j = 0; j <= NV; j++) {
          const v = j / NV;
          let ax, ay, az, ex, ey, ez;       /* attachment point and free-edge point, in ring coordinates (u, w, n) */
          if (vv.kind === 'av') {
            const len = f.depth * (cs[2] || 1) * (0.42 + 0.58 * Math.pow(Math.sin(Math.PI * uu), 0.55));
            ax = f.r * ct; ay = f.r * st; az = 0;
            /* shut: the free edges meet along the radii to the commissures, a little into the ventricle */
            const sx = rho * f.r * cs2, sy = rho * f.r * ss2, sz = f.depth * 0.18 * (1 - rho);
            /* open: the free edges hang into the ventricle */
            const ox = 0.64 * f.r * ct, oy = 0.64 * f.r * st, oz = len;
            ex = lerp(sx, ox, o); ey = lerp(sy, oy, o); ez = lerp(sz, oz, o);
            const bx = lerp(ax, ex, v), by = lerp(ay, ey, v);
            /* shut, the belly of the cusp bulges back towards the atrium */
            const bz = lerp(az, ez, v) - (1 - o) * f.depth * 0.16 * Math.sin(Math.PI * v) * Math.sin(Math.PI * uu);
            P.copy(c).addScaledVector(f.u, bx).addScaledVector(f.w, by).addScaledVector(f.n, bz);
          } else {
            const H = f.depth;
            const hAtt = H * (1 - Math.sin(Math.PI * uu));        /* the U-shaped line on the wall */
            ax = f.r * ct; ay = f.r * st; az = hAtt;
            const sx = rho * f.r * cs2, sy = rho * f.r * ss2, sz = lerp(0.72 * H, H, rho);
            const ox = 0.9 * f.r * ct, oy = 0.9 * f.r * st, oz = H * (0.98 - 0.08 * Math.sin(Math.PI * uu));
            ex = lerp(sx, ox, o); ey = lerp(sy, oy, o); ez = lerp(sz, oz, o);
            let bx = lerp(ax, ex, v), by = lerp(ay, ey, v), bz = lerp(az, ez, v);
            /* shut, the pocket bulges down towards the ventricle; open, the cusp lies back on the wall */
            const bulge = Math.sin(Math.PI * v) * Math.sin(Math.PI * uu);
            bz -= (1 - o) * H * 0.22 * bulge;
            const push = 1 + o * 0.08 * bulge;
            bx *= push; by *= push;
            P.copy(c).addScaledVector(f.u, bx).addScaledVector(f.w, by).addScaledVector(f.n, bz);
          }
          pos[k++] = P.x; pos[k++] = P.y; pos[k++] = P.z;
          if (vv.kind === 'av' && j === NV && (i === 3 || i === 5 || i === 9 || i === 11)) cordPts.push([P.clone(), ci, i]);
        }
      }
    });
    vv.mesh.geometry.attributes.position.needsUpdate = true;
    vv.mesh.geometry.computeVertexNormals();
    vv.mesh.geometry.computeBoundingSphere();
    if (vv.cords) {
      const ca = vv.cords.geometry.attributes.position.array; let q = 0;
      cordPts.forEach(([p, ci, i]) => {
        const pm = PAPS[vv.paps[ci][i < NU / 2 ? 0 : 1]];
        const tip = tmpB.copy(pm).add(beatDisp(pm, tmpA));
        ca[q++] = p.x; ca[q++] = p.y; ca[q++] = p.z; ca[q++] = tip.x; ca[q++] = tip.y; ca[q++] = tip.z;
      });
      vv.cords.geometry.attributes.position.needsUpdate = true;
    }
    vv.dirty = false;
  }
  Object.keys(VALVES).forEach(buildValve);
  vgroup.visible = false;

  /* ---------------- the blood ----------------
     Paths (build step paths.py) run IN THE DIRECTION BLOOD FLOWS: in_* from a vein's cut end to the
     centre of its atrium; mid_* from the atrium through the atrioventricular valve, into the ventricle
     and out through the semilunar valve; out_* from that valve along the artery.

     How the blood moves (rebuilt 25 Sep 2026, after Daniel: "it feels that sometimes some of the blood
     is stagnated"). The first version moved every particle at a speed read off the flow at its point,
     and stopped it at a shut valve, so the blood arriving in an atrium while its valve was shut piled
     up in a knot against the valve, and more of it gathered wherever the flow was slow. Blood is not
     like that: it cannot be squeezed, and a filling chamber fills everywhere at once.
     So each side is five compartments in a row — vein, atrium, ventricle, the root of the artery,
     artery — and each has a volume that changes as blood comes in and goes out. A particle's place is
     the fraction of its compartment's blood that lies upstream of it, f from 0 at the inlet to 1 at
     the outlet, and it moves by exactly the blood that flows past it:
         df/dt = (Q_in (1 − f) + Q_out f) / V
     (V the compartment's volume, Q_in and Q_out the flows at its ends). With the outlet shut, the
     blood already there spreads out as the chamber fills, and new blood comes in behind it; nothing
     crowds against the valve. Drawn, each fraction is placed by volume along the compartment's path,
     so the blood is spread evenly through every chamber and vessel.
     One beat moves one stroke volume through every valve, and the volumes the stages move (the widget's
     rates: the atria give the last quarter of the filling, OpenStax 19.3) return every compartment to
     where it began, so beat after beat nothing piles up anywhere. */
  function mkPath(key) {
    const src = X.paths[key]; const n = src.r.length;
    const P = [], S = [0], R = src.r.slice();
    for (let i = 0; i < n; i++) P.push(new THREE.Vector3(src.p[i * 3], src.p[i * 3 + 1], src.p[i * 3 + 2]));
    for (let i = 1; i < n; i++) S.push(S[i - 1] + P[i].distanceTo(P[i - 1]));
    /* parallel-transport frames, for spreading particles across the lumen */
    const T = [], N = [], B = [];
    for (let i = 0; i < n; i++) T.push(new THREE.Vector3().subVectors(P[Math.min(n - 1, i + 1)], P[Math.max(0, i - 1)]).normalize());
    let nn = new THREE.Vector3(0, 1, 0); if (Math.abs(nn.dot(T[0])) > 0.9) nn.set(1, 0, 0);
    nn.addScaledVector(T[0], -nn.dot(T[0])).normalize();
    for (let i = 0; i < n; i++) {
      if (i) { nn.addScaledVector(T[i], -nn.dot(T[i])); if (nn.lengthSq() < 1e-8) nn.copy(N[i - 1]); nn.normalize(); }
      N.push(nn.clone()); B.push(new THREE.Vector3().crossVectors(T[i], nn));
    }
    /* the scan's path has no radius at a vessel's cut end; the blood keeps the width it has inside */
    const med = R.slice().sort((a, b) => a - b)[n >> 1] || 0.05;
    const RR = R.map((r) => Math.max(r, 0.6 * med));
    const CV = [0];                                   /* the volume of lumen from the start, for placing by volume */
    for (let i = 1; i < n; i++) { const rr = (RR[i] + RR[i - 1]) / 2; CV.push(CV[i - 1] + Math.PI * rr * rr * (S[i] - S[i - 1])); }
    return { key, P, S, R: RR, T, N, B, CV, len: S[n - 1], vol: CV[n - 1] };
  }
  const PATH = {}; Object.keys(X.paths).forEach((k) => { PATH[k] = mkPath(k); });
  /* The room round the blood. A path's radius is its distance to the NEAREST wall, so blood spread
     within it filled only a thin tube down the middle of a chamber, and a ventricle looked empty. So for
     every point of every path, how far you can go across the path in each of 16 directions before you
     meet the heart's or a vessel's wall is measured once, here, from the model's own vertices; the blood
     is spread through that room, and stays inside its vessel.
     The same measure trims each vessel's path to the vessel: a path traced through the whole body's
     vasculature ran on past the short stumps the model keeps (the arch's branches, the descending
     aorta), and blood there seemed to pass through the wall (Daniel, 25 Sep). A point is inside a vessel
     when nearly every direction meets a wall; a path is cut where it last is. */
  const NDIR = 16;
  let roomMs = 0;
  (function measureRoom() {
    const t0 = performance.now();
    const cell = 0.03, grid = new Map(), v = new THREE.Vector3();
    const hk = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791));
    Object.values(parts).forEach((pt) => {
      /* the walls only: blood flows round the papillary muscles and through the valves, which move */
      if (pt.id === 'coronary' || /^pap_/.test(pt.id) || MODEL_VALVE.test(pt.id)) return;
      const pos = pt.mesh.geometry.attributes.position, mw = pt.mesh.matrixWorld;
      for (let i = 0; i < pos.count; i++) {
        v.fromBufferAttribute(pos, i).applyMatrix4(mw);
        const k = hk(Math.floor(v.x / cell), Math.floor(v.y / cell), Math.floor(v.z / cell));
        let a = grid.get(k); if (!a) grid.set(k, a = []); a.push(v.x, v.y, v.z);
      }
    });
    const R2 = 0.02 * 0.02;
    function tissue(x, y, z) {
      const cx = Math.floor(x / cell), cy = Math.floor(y / cell), cz = Math.floor(z / cell);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        const a = grid.get(hk(cx + dx, cy + dy, cz + dz)); if (!a) continue;
        for (let j = 0; j < a.length; j += 3) { const ex = a[j] - x, ey = a[j + 1] - y, ez = a[j + 2] - z; if (ex * ex + ey * ey + ez * ez < R2) return true; }
      }
      return false;
    }
    const CAP = 0.44;
    function measure(path) {
      path.shut = [];
      path.E = path.P.map((p, i) => {
        const raw = new Float32Array(NDIR), open = [];
        for (let j = 0; j < NDIR; j++) {
          const th = j / NDIR * Math.PI * 2, c = Math.cos(th), sn = Math.sin(th);
          const dx = path.N[i].x * c + path.B[i].x * sn, dy = path.N[i].y * c + path.B[i].y * sn, dz = path.N[i].z * c + path.B[i].z * sn;
          let d = Math.max(0.01, path.R[i] * 0.5);
          while (d < CAP && !tissue(p.x + dx * d, p.y + dy * d, p.z + dz * d)) d += 0.01;
          raw[j] = Math.max(0.012, d - 0.018);
          open.push(d >= CAP);         /* no wall met: the way out along a vessel, or out of the model */
        }
        path.shut.push(open.filter((o) => !o).length);
        /* a direction that ran out takes the room of the others */
        const walls = [...raw].filter((x, j) => !open[j]).sort((x, y) => x - y);
        const typical = walls.length ? walls[walls.length >> 1] : path.R[i];
        const E = raw.map((x, j) => (open[j] ? typical : Math.min(x, 0.34)));
        /* a little smoothing round the circle, so the blood's edge has no spikes */
        return E.map((x, j) => 0.5 * x + 0.25 * (E[(j + NDIR - 1) % NDIR] + E[(j + 1) % NDIR]));
      });
    }
    /* keep points i0..i1 of a path, with everything measured along it */
    function slice(path, i0, i1) {
      const P = path.P.slice(i0, i1 + 1), R = path.R.slice(i0, i1 + 1), T = path.T.slice(i0, i1 + 1), N = path.N.slice(i0, i1 + 1), B = path.B.slice(i0, i1 + 1);
      const E = path.E.slice(i0, i1 + 1), shut = path.shut.slice(i0, i1 + 1), S = [0], CV = [0];
      for (let i = 1; i < P.length; i++) {
        S.push(S[i - 1] + P[i].distanceTo(P[i - 1]));
        const rr = (R[i] + R[i - 1]) / 2; CV.push(CV[i - 1] + Math.PI * rr * rr * (S[i] - S[i - 1]));
      }
      return { key: path.key, P, S, R, T, N, B, CV, E, shut, len: S[S.length - 1], vol: CV[CV.length - 1], trimmed: path.P.length - P.length };
    }
    Object.keys(PATH).forEach((key) => {
      const path = PATH[key]; measure(path);
      const n = path.P.length, inside = (i) => path.shut[i] >= 12;
      if (/^out_/.test(key)) {             /* from the valve outwards: cut after the last point inside the vessel */
        let i1 = n - 1; while (i1 > 4 && !inside(i1)) i1--;
        if (i1 < n - 1) PATH[key] = slice(path, 0, i1);
      } else if (/^in_/.test(key)) {       /* from the vein's end inwards: start at the first point inside it */
        let i0 = 0; while (i0 < n - 5 && !inside(i0)) i0++;
        if (i0 > 0) PATH[key] = slice(path, i0, n - 1);
      }
    });
    roomMs = Math.round(performance.now() - t0);
  })();
  function findIdx(arr, x) { let lo = 0, hi = arr.length - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (arr[m] <= x) lo = m; else hi = m; } return lo; }
  function volAt(path, s) { s = clamp(s, 0, path.len); const i = findIdx(path.S, s), j = Math.min(i + 1, path.S.length - 1); const t = (s - path.S[i]) / Math.max(1e-9, path.S[j] - path.S[i]); return lerp(path.CV[i], path.CV[j], t); }
  function sAtVol(path, v) { v = clamp(v, 0, path.vol); const i = findIdx(path.CV, v), j = Math.min(i + 1, path.CV.length - 1); const t = (v - path.CV[i]) / Math.max(1e-12, path.CV[j] - path.CV[i]); return lerp(path.S[i], path.S[j], t); }
  const SIDES = {
    R: { mid: 'mid_r', ins: [['in_svc', 0.4], ['in_ivc', 0.6]], outs: [['out_pa_l', 0.47], ['out_pa_r', 0.53]], av: 'tri', sl: 'pul', color: BLOOD.deo },
    L: { mid: 'mid_l', ins: [['in_pv_rs', 0.28], ['in_pv_ri', 0.24], ['in_pv_ls', 0.24], ['in_pv_li', 0.24]],
         outs: [['out_desc', 0.52], ['out_brachio', 0.2], ['out_lcc', 0.13], ['out_lsub', 0.15]], av: 'mit', sl: 'aor', color: BLOOD.oxy }
  };
  /* where along the middle path each valve blocks: the path point nearest the shut cusps */
  function nearestS(path, p) { let best = 0, bd = 1e9; path.P.forEach((q, i) => { const d = q.distanceToSquared(p); if (d < bd) { bd = d; best = i; } }); return path.S[best]; }
  /* the compartments of each side, and the stroke volume: 55 % of the ventricle's own volume here */
  const V_IN = 0, V_AT = 1, V_VE = 2, V_RO = 3, V_AR = 4;
  Object.keys(SIDES).forEach((k) => {
    const sd = SIDES[k], mid = PATH[sd.mid];
    const fa = VALVES[sd.av].f, fs = VALVES[sd.sl].f;
    sd.sAV = nearestS(mid, fa.c);
    sd.sSL = nearestS(mid, tmpA.copy(fs.c).addScaledVector(fs.n, fs.depth * 0.6));
    if (sd.sSL <= sd.sAV + 0.05) sd.sSL = mid.len - 0.01;
    sd.vAV = volAt(mid, sd.sAV); sd.vSL = volAt(mid, sd.sSL);
    sd.Gat = sd.vAV; sd.Gve = sd.vSL - sd.vAV; sd.Gro = mid.vol - sd.vSL;
    sd.hasRoot = sd.Gro > 0.0004;
    sd.SV = 0.55 * sd.Gve;
    /* a vein or an artery is as long as the scan made it, so how long blood takes to cross one is not
       its volume over its flow: each is given a crossing of one to three and a half beats, as in life
       blood in the big vessels next to the heart is never more than a few beats from it */
    sd.win = {}; sd.wout = {}; sd.Rin = {}; sd.Rout = {};
    sd.ins.forEach(([p, w]) => { sd.win[p] = w; sd.Rin[p] = clamp(PATH[p].vol, w * sd.SV * 1.2, w * sd.SV * 3.5); });
    sd.outs.forEach(([p, w]) => { sd.wout[p] = w; sd.Rout[p] = clamp(PATH[p].vol, w * sd.SV * 1.0, w * sd.SV * 2.5); });
    sd.vol = { in: {}, out: {}, at: sd.Gat, ve: sd.Gve };
  });
  /* the volumes at the start of each stage of the right beat, so a stage can begin as it would in a
     heart that has been beating (the widget's rates: A 0 in / 0.25 through the AV valve; V 0.4 in / 1.0
     out; D 0.6 in / 0.75 through; the arteries pass on 0.16, 0.5 and 0.34 of the stroke volume) */
  const START = { A: { at: -0.15, ve: -0.25, vin: 0, vout: -0.34 }, V: { at: -0.4, ve: 0, vin: 0.2, vout: -0.5 }, D: { at: 0, ve: -1, vin: 0.17, vout: 0 } };
  function setVolumes(key) {
    const st = START[key] || START.A;
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], V = sd.vol;
      V.at = Math.max(0.25 * sd.Gat, sd.Gat + st.at * sd.SV);
      V.ve = Math.max(0.3 * sd.Gve, sd.Gve + st.ve * sd.SV);
      sd.ins.forEach(([p, w]) => { V.in[p] = sd.Rin[p] + st.vin * w * sd.SV; });
      sd.outs.forEach(([p, w]) => { V.out[p] = sd.Rout[p] + (st.vout + 0.34) * w * sd.SV; });
    });
  }
  function sampleAt(path, s, out, frame) {
    const S = path.S; let lo = 0, hi = S.length - 1;
    s = clamp(s, 0, path.len);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const t = (s - S[lo]) / Math.max(1e-9, S[hi] - S[lo]);
    out.lerpVectors(path.P[lo], path.P[hi], t);
    if (frame) { frame.r = lerp(path.R[lo], path.R[hi], t); frame.N = path.N[lo]; frame.B = path.B[lo]; frame.T = path.T[lo]; frame.i = lo; frame.u = t; }
    return out;
  }
  /* the room across the path in direction phi at this point: from the measured room where there is one */
  function roomAt(path, fr, phi) {
    if (!path.E) return fr.r;
    const a = ((phi / (Math.PI * 2)) % 1 + 1) % 1 * NDIR, j0 = Math.floor(a) % NDIR, j1 = (j0 + 1) % NDIR, w = a - Math.floor(a);
    const i1 = Math.min(fr.i + 1, path.E.length - 1), E0 = path.E[fr.i], E1 = path.E[i1];
    return lerp(lerp(E0[j0], E0[j1], w), lerp(E1[j0], E1[j1], w), fr.u);
  }
  /* a particle is a small drop, drawn longer the faster it moves, so the flow shows its direction */
  const PR = coarse ? 0.011 : 0.0095;
  const pgeo = new THREE.SphereGeometry(1, 10, 7);
  const blood = {};
  const rand = rng(20260925);
  function pick(list) { let x = rand(), acc = 0; for (const [k, w] of list) { acc += w; if (x <= acc) return k; } return list[list.length - 1][0]; }
  const NTOTAL = coarse ? 640 : 980;
  Object.keys(SIDES).forEach((k) => {
    const sd = SIDES[k];
    sd.n = Math.round(NTOTAL / 2);
    const mat = new THREE.MeshStandardMaterial({ color: sd.color, roughness: 0.4, metalness: 0, emissive: sd.color, emissiveIntensity: 0.6, clippingPlanes: PLANES });
    const im = new THREE.InstancedMesh(pgeo, mat, sd.n); im.frustumCulled = false; im.visible = false;
    heart.add(im);
    blood[k] = { im, mat, parts: [] };
  });
  /* compartment c of side sd: its path, the volume of lumen before it on that path, its own volume
     of lumen (for drawing), and the blood it holds now (for moving) */
  function compOf(sd, p) {
    if (p.c === V_IN) return [PATH[p.inK], 0, PATH[p.inK].vol, sd.vol.in[p.inK]];
    if (p.c === V_AT) return [PATH[sd.mid], 0, sd.Gat, sd.vol.at];
    if (p.c === V_VE) return [PATH[sd.mid], sd.vAV, sd.Gve, sd.vol.ve];
    if (p.c === V_RO) return [PATH[sd.mid], sd.vSL, sd.Gro, sd.Gro];
    return [PATH[p.outK], 0, PATH[p.outK].vol, sd.vol.out[p.outK]];
  }
  function seedBlood(key) {
    setVolumes(key || 'A');
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], B = blood[k], V = sd.vol; B.parts = [];
      /* the blood each compartment holds decides how many particles start in it */
      const bins = [];
      sd.ins.forEach(([pk]) => bins.push([V_IN, pk, null, V.in[pk]]));
      bins.push([V_AT, null, null, V.at]); bins.push([V_VE, null, null, V.ve]);
      if (sd.hasRoot) bins.push([V_RO, null, null, sd.Gro]);
      sd.outs.forEach(([pk]) => bins.push([V_AR, null, pk, V.out[pk]]));
      const tot = bins.reduce((a, b) => a + b[3], 0);
      for (let i = 0; i < sd.n; i++) {
        let x = rand() * tot, b = bins[bins.length - 1];
        for (const q of bins) { if (x <= q[3]) { b = q; break; } x -= q[3]; }
        B.parts.push({ c: b[0], f: rand(), inK: b[1] || pick(sd.ins), outK: b[2] || pick(sd.outs),
                       rho: Math.sqrt(rand()), phi: rand() * Math.PI * 2, sp: 0 });
      }
    });
  }
  seedBlood('A');

  /* the flow now, per side, in volume a second: from the body into the veins, from the veins into the
     atrium, through the atrioventricular valve, through the semilunar valve, and on from the arteries */
  const FLOW = { R: { body: 0, in: 0, av: 0, sl: 0, out: 0 }, L: { body: 0, in: 0, av: 0, sl: 0, out: 0 } };
  function ends(sd, F, p) {                 /* [flow in at its inlet, flow out at its outlet] */
    if (p.c === V_IN) { const w = sd.win[p.inK]; return [w * F.body, w * F.in]; }
    if (p.c === V_AT) return [F.in, F.av];
    if (p.c === V_VE) return [F.av, F.sl];
    if (p.c === V_RO) return [F.sl, F.sl];
    const w = sd.wout[p.outK]; return [w * F.sl, w * F.out];
  }
  function held(sd, p) { return p.c === V_IN ? sd.vol.in[p.inK] : p.c === V_AT ? sd.vol.at : p.c === V_VE ? sd.vol.ve : p.c === V_RO ? sd.Gro : sd.vol.out[p.outK]; }
  function next(sd, p) {                    /* across an outlet */
    if (p.c === V_IN) p.c = V_AT;
    else if (p.c === V_AT) p.c = V_VE;
    else if (p.c === V_VE) { p.c = sd.hasRoot ? V_RO : V_AR; if (p.c === V_AR) p.outK = pick(sd.outs); }
    else if (p.c === V_RO) { p.c = V_AR; p.outK = pick(sd.outs); }
    else { p.c = V_IN; p.inK = pick(sd.ins); }          /* on round the body, and back in by a vein */
  }
  function prev(sd, p) {                    /* back across an inlet: false where there is nowhere to go */
    if (p.c === V_IN) return false;
    if (p.c === V_AT) { p.c = V_IN; return true; }
    if (p.c === V_VE) { p.c = V_AT; return true; }
    if (p.c === V_RO) { p.c = V_VE; return true; }
    p.c = sd.hasRoot ? V_RO : V_VE; return true;
  }
  function stepBlood(dt) {
    if (!(dt > 0)) return;
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], F = FLOW[k], V = sd.vol, B = blood[k];
      /* the compartments fill and empty */
      sd.ins.forEach(([pk, w]) => { V.in[pk] = Math.max(0.3 * sd.Rin[pk], V.in[pk] + w * (F.body - F.in) * dt); });
      V.at = Math.max(0.2 * sd.Gat, V.at + (F.in - F.av) * dt);
      V.ve = Math.max(0.2 * sd.Gve, V.ve + (F.av - F.sl) * dt);
      sd.outs.forEach(([pk, w]) => { V.out[pk] = Math.max(0.3 * sd.Rout[pk], V.out[pk] + w * (F.sl - F.out) * dt); });
      B.parts.forEach((p) => {
        const e = ends(sd, F, p), vol = held(sd, p);
        let df = (e[0] * (1 - p.f) + e[1] * p.f) / vol * dt;
        const g = compOf(sd, p);
        p.sp = df * g[2] / dt;                  /* volume a second past it, for the length of its streak */
        let f = p.f + df;
        for (let guard = 0; guard < 4 && (f > 1 || f < 0); guard++) {
          if (f > 1) { const carry = (f - 1) * held(sd, p); next(sd, p); f = carry / held(sd, p); }
          else { const carry = -f * held(sd, p); if (!prev(sd, p)) { f = 0; break; } f = 1 - carry / held(sd, p); }
        }
        p.f = clamp(f, 0, 1);
      });
    });
  }
  const M4 = new THREE.Matrix4(), POS = new THREE.Vector3(), DISP = new THREE.Vector3(), QN = new THREE.Quaternion(), SC = new THREE.Vector3(), UPY = new THREE.Vector3(0, 1, 0);
  const fr0 = {};
  function drawBlood() {
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], B = blood[k];
      B.parts.forEach((p, i) => {
        const g = compOf(sd, p), path = g[0];
        const s = sAtVol(path, g[1] + p.f * g[2]);
        sampleAt(path, s, POS, fr0);
        /* in a chamber, across all the room it leaves; in a vessel, within most of its lumen */
        const rad = roomAt(path, fr0, p.phi) * p.rho * (/^mid_/.test(path.key) ? 0.92 : 0.85);
        POS.addScaledVector(fr0.N, Math.cos(p.phi) * rad).addScaledVector(fr0.B, Math.sin(p.phi) * rad);
        POS.add(beatDisp(POS, DISP));
        /* speed along the path: the volume passing, over the lumen's cross-section there */
        const v = Math.abs(p.sp) / Math.max(1e-4, Math.PI * fr0.r * fr0.r);
        const len = Math.min(0.045, v * 0.06);
        QN.setFromUnitVectors(UPY, fr0.T);
        SC.set(PR, PR + len / 2, PR);
        M4.compose(POS, QN, SC);
        B.im.setMatrixAt(i, M4);
      });
      B.im.instanceMatrix.needsUpdate = true;
    });
  }
  drawBlood();

  /* ---------------- the see-through heart ----------------
     Daniel, 25 Sep 2026: with the walls evenly translucent "it's a bit tricky to see the chambers ...
     clearly separate the chambers and outline the edges of the vessels". So the walls become glass
     that is almost clear where you look straight through it and bright where you look along it, as a
     real glass model is: each chamber and vessel shows as a clean outline with the blood inside it.
     The right side of the heart and its vessels are outlined in blue and the left side in red, as the
     lab's diagrams colour them; the septum between them is cream. Added light, not layered colour, so
     no wall can hide another however they overlap. */
  const XRAY_COL = { R: 0x9db9ff, L: 0xffa89a, S: 0xfff1dc };
  const VALVE_SIDE = { tri: 'R', pul: 'R', mit: 'L', aor: 'L' };
  let sideOnly = null;            /* 'R' or 'L': the other side of the heart fades and its blood is hidden */
  const XRAY_SIDE = { ra: 'R', rv: 'R', vena_cava_sup: 'R', vena_cava_inf: 'R', pulmonary_artery: 'R', la: 'L', lv: 'L', pulmonary_veins: 'L', aorta: 'L', septum: 'S' };
  function xrayMat(pt) {
    if (pt.xmat) return pt.xmat;
    const u = pt.mat.userData.u, side = XRAY_SIDE[pt.id], cor = pt.id === 'coronary', pap = /^pap_/.test(pt.id);
    pt.xmat = new THREE.ShaderMaterial({
      uniforms: { uBeatC: U_BEAT_C, uBeatK: U_BEAT_K, uL2H: u.uL2H, uH2L: u.uH2L,
                  uCol: { value: new THREE.Color(side ? XRAY_COL[side] : cor ? 0xd9483e : 0xc98a80) },
                  uA0: { value: cor ? 0.0 : pap ? 0.015 : 0.02 }, uA1: { value: cor ? 0.18 : pap ? 0.3 : side === 'S' ? 0.6 : 0.72 }, uFade: { value: 1 } },
      vertexShader: BEAT_VS + `
varying vec3 vN; varying vec3 vV;
void main() {
  vec3 hp = (uL2H * vec4(position, 1.0)).xyz; hp += h3beat(hp);
  vec4 mv = modelViewMatrix * vec4((uH2L * vec4(hp, 1.0)).xyz, 1.0);
  vN = normalize(normalMatrix * normal); vV = -mv.xyz;
  gl_Position = projectionMatrix * mv;
}`,
      fragmentShader: `
uniform vec3 uCol; uniform float uA0; uniform float uA1; uniform float uFade;
varying vec3 vN; varying vec3 vV;
void main() {
  float ndv = abs(dot(normalize(vN), normalize(vV)));
  float rim = pow(1.0 - ndv, 3.2);
  gl_FragColor = vec4(uCol * (0.35 + 0.9 * rim), mix(uA0, uA1, rim) * uFade);
  #include <colorspace_fragment>
}`,
      transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
    });
    return pt.xmat;
  }

  /* ---------------- a red circle round a valve set wrongly ----------------
     After Run this stage in the valves tab, a valve set wrongly flashes red: the valve itself, and a
     circle round it drawn over the blood and the walls, so it can be found at once. The circle always
     faces you and is centred on the middle of the valve, with a radius that takes in all of it, open or
     shut, from any side (Daniel, 26 Sep: a ring lying in the valve's own ring looked like an ellipse
     from the side, with the cusps outside it). */
  const flagRings = {}, FLAG_C = {};
  Object.keys(VALVES).forEach((k) => {
    const f = VALVES[k].f, half = (f.depth || f.r) / 2;
    FLAG_C[k] = f.c.clone().addScaledVector(f.n, half);
    const R = Math.hypot(f.r, half) * 1.12 + 0.004;
    const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.006, 8, 96),
      new THREE.MeshBasicMaterial({ color: 0xff3b3b, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false, toneMapped: false }));
    ring.renderOrder = 30; ring.visible = false; ring.frustumCulled = false;
    scene.add(ring); flagRings[k] = ring;
  });
  function placeFlags() {          /* after the heart and the camera have moved for this frame */
    flagged.forEach((k) => { const ring = flagRings[k]; if (!ring) return; ring.position.copy(FLAG_C[k]).applyMatrix4(heart.matrixWorld); ring.quaternion.copy(camera.quaternion); });
  }

  /* ---------------- the tendons, for the scanned valves ----------------
     The scan has no tendons (chordae tendineae). With the moving valves (Blood flow, The valves) they
     are drawn as lines; for the scanned valves shown in Explore they are drawn here as white cords,
     0.8 mm across (Daniel, 26 Sep: "drawing in white the ligaments that join the valves to the wall"):
     from the edge of each atrioventricular valve's flaps, taken every 20 degrees round the ring where
     the scanned flap reaches lowest, to the tip of the nearest papillary muscle. Pressed, they are named
     like any part. */
  (function tendons() {
    const pos = [], nor = [], idx = [];
    const add = (a, b) => {                /* one cord: a closed-ended tube from a to b */
      const d = b.clone().sub(a), L = d.length(); if (L < 1e-4) return;
      const g = new THREE.CylinderGeometry(0.004, 0.004, L, 6, 1, false);
      g.translate(0, L / 2, 0); g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(a.x, a.y, a.z);
      const o = pos.length / 3, gp = g.getAttribute('position'), gn = g.getAttribute('normal');
      for (let i = 0; i < gp.count; i++) { pos.push(gp.getX(i), gp.getY(i), gp.getZ(i)); nor.push(gn.getX(i), gn.getY(i), gn.getZ(i)); }
      g.index.array.forEach((q) => idx.push(q + o)); g.dispose();
    };
    [['tri', ['pap_rv_ant', 'pap_rv_post', 'pap_rv_sep']], ['mit', ['pap_lv_al', 'pap_lv_pm']]].forEach(([key, paps]) => {
      const pt = parts['valve_' + key]; if (!pt) return;
      const f = ringFrame(V[key]), K = 18, low = new Array(K).fill(null), depth = new Array(K).fill(-1e9);
      const gp = pt.mesh.geometry.getAttribute('position'), P = new THREE.Vector3(), Q = new THREE.Vector3();
      for (let i = 0; i < gp.count; i++) {
        P.fromBufferAttribute(gp, i).applyMatrix4(pt.mesh.matrixWorld); Q.copy(P).sub(f.c);
        const ax = Q.dot(f.n), b = Math.floor(((Math.atan2(Q.dot(f.w), Q.dot(f.u)) / (2 * Math.PI) + 1) % 1) * K) % K;
        if (ax > depth[b]) { depth[b] = ax; low[b] = P.clone(); }
      }
      low.forEach((e) => {
        if (!e) return;
        let tip = null, best = Infinity;
        paps.forEach((k) => { const d = PAPS[k] ? e.distanceTo(PAPS[k]) : Infinity; if (d < best) { best = d; tip = PAPS[k]; } });
        if (tip) add(e.clone().addScaledVector(f.n, -0.002), tip);      /* from just inside the flap's edge */
      });
    });
    if (!pos.length) return;
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nor, 3)); g.setIndex(idx);
    const mat = new THREE.MeshStandardMaterial({ color: 0xf3ead8, roughness: 0.55, metalness: 0, side: THREE.DoubleSide, clippingPlanes: PLANES });
    const mesh = new THREE.Mesh(g, mat); mesh.name = 'chordae'; heart.add(mesh);
    patchWall(mat, mesh, null);
    const index = byIndex.length; byIndex.push('chordae');
    parts.chordae = { id: 'chordae', mesh, mat, idMat: idMaterial(index, mesh), index, solid: false };
  })();

  /* ---------------- modes: what is shown ---------------- */
  let mode = 'explore', xray = false, cutK = 0, selected = null;
  /* the valves tab: the blood shows only while a stage runs (Daniel, 26 Sep: set the valves with no
     blood in the way, then run the stage to see what they do), and a valve set wrongly flashes red */
  let bloodShown = false;
  const flagged = new Set();
  function paintFlags(now) {
    const pulse = reduced ? 1 : 0.5 + 0.5 * Math.sin(now / 1000 * Math.PI * 2 * 1.1);
    Object.keys(VALVES).forEach((k) => {
      const m = VALVES[k].mesh.material, on = flagged.has(k), ring = flagRings[k];
      if (ring) { ring.visible = on && vgroup.visible; ring.material.opacity = 0.35 + 0.6 * pulse; }
      if (on) { m.color.setHex(0xf06a6a); m.emissive.setHex(0xff2424); m.emissiveIntensity = 0.2 + 0.5 * pulse; }
      else if (m.userData.flagged) m.color.setHex(0xeee0c8);
      m.userData.flagged = on;
    });
  }
  function applyLook() {
    const live = mode !== 'explore';
    const lit = (id) => selected && (selected === id || (selected === 'vena_cava' && /^vena_cava/.test(id)) || (selected === 'papillary' && /^pap_/.test(id)));
    Object.values(parts).forEach((pt) => {
      const m = pt.mat, see = xray && !MODEL_VALVE.test(pt.id);
      pt.mesh.visible = !(live && MODEL_VALVE.test(pt.id)) && !(live && pt.id === 'chordae') && !(cutK >= (GONE_AT[pt.id] || 9));
      pt.mesh.material = see ? xrayMat(pt) : m;
      /* one side shown: the other side's walls fade to a trace, so you can still see where it is */
      if (pt.xmat) pt.xmat.uniforms.uFade.value = sideOnly && XRAY_SIDE[pt.id] && XRAY_SIDE[pt.id] !== 'S' && XRAY_SIDE[pt.id] !== sideOnly ? 0.14 : 1;
      m.transparent = false; m.opacity = 1; m.depthWrite = true; m.side = THREE.DoubleSide;
      if (m.userData.u) m.userData.u.uCapOn.value = 1;
      const on = lit(pt.id);
      m.emissive.setHex(on ? 0xffc36b : 0x000000); m.emissiveIntensity = on ? 0.42 : 0;
      m.needsUpdate = true;
    });
    vgroup.visible = live;
    Object.keys(VALVES).forEach((k) => {
      const m = VALVES[k].mesh.material, on = lit('valve_' + k), thin = mode === 'flow';
      m.transparent = thin; m.opacity = thin ? 0.5 : 1; m.depthWrite = !thin; m.needsUpdate = true;
      m.emissive.setHex(on ? 0xffb04a : 0x000000); m.emissiveIntensity = on ? 0.5 : 0;
    });
    /* The valves tab shows the valves alone while you set them: with the blood moving through them they
       were "very very hard to see" (Daniel, 26 Sep). It shows the blood when a stage runs. */
    Object.keys(blood).forEach((k) => { blood[k].im.visible = (mode === 'flow' || (mode === 'valves' && bloodShown)) && !(sideOnly && sideOnly !== k); });
    Object.keys(VALVES).forEach((k) => { const on = !(sideOnly && VALVE_SIDE[k] !== sideOnly); VALVES[k].mesh.visible = on; if (VALVES[k].cords) VALVES[k].cords.visible = on; });
    paintFlags(performance.now());
    idStale = true; kick();
  }

  /* ---------------- the cut ----------------
     A plane parallel to the heart's FOUR-CHAMBER PLANE (through the mitral and tricuspid rings and the
     apex; build step build_model.py). A plane parallel to the body's frontal plane cannot show the four
     chambers of a real heart at once — the left atrium lies behind the others — so the cut follows the
     heart's own long axis, which is the plane the exam's "frontal section" diagram is drawn in.
     k = 0: no cut; k = 0.5: through the valves (all four chambers); k = 1: near the back. */
  const PL = X.plane;
  const PN = new THREE.Vector3(...PL.n).normalize(), PUP = new THREE.Vector3(...PL.up).normalize();
  function cutDepth(k) {
    if (k <= 0) return 1e3;
    return k <= 0.5 ? lerp(PL.max + 0.02, PL.through, k / 0.5) : lerp(PL.through, PL.min + 0.12, (k - 0.5) / 0.5);
  }
  /* ---------------- pieces cut loose ----------------
     A vessel cut right across leaves a piece behind the plane that is no longer joined to the heart:
     the arch and the top of the descending aorta once the ascending aorta is cut (cuts 0.05 to 0.4),
     the branches of the pulmonary artery (0.05 to 0.35), the ends of the pulmonary veins (0.1 to 0.8).
     Left in place, such a piece hangs in the air up to 2 cm from the heart, so it goes with the part
     cut away, as it would in a dissection. For every point of a vessel: the shallowest cut that leaves
     it joined, through what is left of the vessel, to where the vessel meets its own chamber (JOIN,
     within 2 mm; each vessel touches its own, the aorta through its valve). That is the least deep of
     all the paths along the vessel's wall, a path being as deep as its deepest point: a Dijkstra search
     that keeps the deepest point instead of the sum. Points of one vessel within 0.5 mm of each other
     count as joined: the model's branches overlap their trunk without sharing points. Only the
     vessel's OWN chamber counts: a right pulmonary vein passes within 2 mm of the right atrium, and a
     piece of it cut loose would otherwise stay. */
  const JOIN = { aorta: ['valve_aor', 'lv'], pulmonary_artery: ['rv', 'valve_pul'], pulmonary_veins: ['la'],
    vena_cava_sup: ['ra'], vena_cava_inf: ['ra'], coronary: ['lv', 'rv', 'la', 'ra', 'septum'] };
  let joinMs = 0;
  (function joinDepths() {
    const t0 = performance.now(), P = new THREE.Vector3(), toHeart = new THREE.Matrix4().copy(heart.matrixWorld).invert();
    const key = (i, j, k) => ((i + 1024) * 2048 + j + 1024) * 2048 + k + 1024;
    const pointsOf = (pt) => {        /* in the heart's own frame */
      const pos = pt.mesh.geometry.getAttribute('position'), out = new Float32Array(pos.count * 3);
      for (let i = 0; i < pos.count; i++) { P.fromBufferAttribute(pos, i).applyMatrix4(pt.mesh.matrixWorld).applyMatrix4(toHeart); out[3 * i] = P.x; out[3 * i + 1] = P.y; out[3 * i + 2] = P.z; }
      return out;
    };
    function grid(arrs, r) {        /* points binned in cells of side r */
      const g = new Map();
      arrs.forEach((a) => { for (let q = 0; q < a.length; q += 3) { const k = key(Math.floor(a[q] / r), Math.floor(a[q + 1] / r), Math.floor(a[q + 2] / r)); let c = g.get(k); if (!c) g.set(k, c = []); c.push(a[q], a[q + 1], a[q + 2], q / 3); } });
      return (x, y, z, fn) => {        /* fn(index, distance squared) for every point in the 27 cells round (x, y, z) */
        const i0 = Math.floor(x / r), j0 = Math.floor(y / r), k0 = Math.floor(z / r);
        for (let i = i0 - 1; i <= i0 + 1; i++) for (let j = j0 - 1; j <= j0 + 1; j++) for (let k = k0 - 1; k <= k0 + 1; k++) {
          const c = g.get(key(i, j, k)); if (!c) continue;
          for (let q = 0; q < c.length; q += 4) { const dx = c[q] - x, dy = c[q + 1] - y, dz = c[q + 2] - z; fn(c[q + 3], dx * dx + dy * dy + dz * dz); }
        }
      };
    }
    const R = 0.02, RP = 0.005;
    Object.keys(JOIN).forEach((id) => {
      const pt = parts[id]; if (!pt) return;
      const near = grid(JOIN[id].filter((a) => parts[a]).map((a) => pointsOf(parts[a])), R);
      const g = pt.mesh.geometry, pos = g.getAttribute('position'), n = pos.count, pts = pointsOf(pt);
      /* one node per position (a vertex may be split for its normals) */
      const node = new Int32Array(n), at = new Map(), xyz = [], depth = [], start = [];
      for (let i = 0; i < n; i++) {
        const x = pts[3 * i], y = pts[3 * i + 1], z = pts[3 * i + 2], k = x.toFixed(5) + ',' + y.toFixed(5) + ',' + z.toFixed(5);
        let j = at.get(k);
        if (j === undefined) {
          j = depth.length; at.set(k, j); xyz.push(x, y, z); depth.push(PN.x * x + PN.y * y + PN.z * z);
          let meets = false; near(x, y, z, (q, d2) => { if (d2 < R * R) meets = true; }); start.push(meets);
        }
        node[i] = j;
      }
      const m = depth.length, nb = Array.from({ length: m }, () => []);
      const idx = g.index ? g.index.array : null, tri = idx ? idx.length : n;
      for (let t = 0; t < tri; t += 3) {
        const a = node[idx ? idx[t] : t], b = node[idx ? idx[t + 1] : t + 1], c = node[idx ? idx[t + 2] : t + 2];
        nb[a].push(b, c); nb[b].push(a, c); nb[c].push(a, b);
      }
      const self = grid([new Float32Array(xyz)], RP);
      for (let j = 0; j < m; j++) self(xyz[3 * j], xyz[3 * j + 1], xyz[3 * j + 2], (q, d2) => { if (q !== j && d2 < RP * RP) nb[j].push(q); });
      const best = new Float64Array(m).fill(Infinity), heap = [];
      const push = (v, j) => { heap.push([v, j]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let s = i; if (l < heap.length && heap[l][0] < heap[s][0]) s = l; if (r < heap.length && heap[r][0] < heap[s][0]) s = r; if (s === i) break; [heap[s], heap[i]] = [heap[i], heap[s]]; i = s; } } return top; };
      for (let j = 0; j < m; j++) if (start[j]) { best[j] = depth[j]; push(depth[j], j); }
      while (heap.length) {
        const [v, j] = pop(); if (v > best[j]) continue;
        for (const q of nb[j]) { const c = Math.max(v, depth[q]); if (c < best[q]) { best[q] = c; push(c, q); } }
      }
      /* a piece never joined to its chamber (none in this model) shows only while nothing is cut */
      const join = new Float32Array(n); for (let i = 0; i < n; i++) join[i] = Math.min(best[node[i]], 100);
      g.setAttribute('aJoin', new THREE.BufferAttribute(join, 1));
    });
    joinMs = performance.now() - t0;
  })();
  const Z_AXIS = new THREE.Vector3(0, 0, 1), CAM_L = new THREE.Vector3();
  function updateClip() {
    const d = cutDepth(cutK); U_CUT_D.value = d;
    clipLocal.normal.copy(PN).negate(); clipLocal.constant = d;
    clipWorld.copy(clipLocal).applyMatrix4(heart.matrixWorld);
    /* the cut faces lie on the plane; they are drawn only while you look at the open side */
    const on = cutK > 0 && mode === 'explore' && !xray && PN.dot(heart.worldToLocal(CAM_L.copy(camera.position))) > d;
    capQuads.forEach((q) => { q.position.copy(PN).multiplyScalar(d); q.quaternion.setFromUnitVectors(Z_AXIS, PN); });
    capDepth.position.copy(PN).multiplyScalar(d); capDepth.quaternion.setFromUnitVectors(Z_AXIS, PN);
    capObjs.forEach((o) => { o.visible = on; });
  }

  /* ---------------- views ----------------
     front: as it sits in a person facing you. back: from behind. section: the heart turned so you look
     straight at the cut, atria at the top, the right side on your left — the diagram's layout. */
  const Q_ID = new THREE.Quaternion();
  const Q_SEC = (() => {
    const e3 = PN.clone(), e2 = PUP.clone(), e1 = new THREE.Vector3().crossVectors(e2, e3).normalize();
    const m = new THREE.Matrix4().makeBasis(e1, e2, e3).transpose();
    return new THREE.Quaternion().setFromRotationMatrix(m);
  })();
  let tween = null, viewName = 'front';
  /* each view is framed to fit: the whole heart and its vessels from the front or back (with room at
     the sides for labels); the cut face fills more of the stage */
  const FIT = {};
  (function () {
    const chambers = ['lv', 'rv', 'la', 'ra'].map((k) => parts[k].mesh);
    const q0 = heart.quaternion.clone();
    heart.quaternion.copy(Q_SEC); heart.updateMatrixWorld(true);
    const b = new THREE.Box3(); chambers.forEach((m) => b.expandByObject(m));
    FIT.section = { c: b.getCenter(new THREE.Vector3()), s: b.getSize(new THREE.Vector3()), mx: 1.12, my: 1.1 };
    heart.quaternion.copy(q0); heart.updateMatrixWorld(true);
    FIT.front = { c: FOCUS.clone(), s: SIZE.clone(), mx: 1.55, my: 1.1 };
    FIT.back = FIT.front;
  })();
  function fitDist(f) {
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), a = camera.aspect || 1.4;
    return Math.max(f.s.y * f.my / 2 / t, f.s.x * f.mx / 2 / (t * a)) + f.s.z / 2;
  }
  function viewTarget(name) {
    const f = FIT[name] || FIT.front;
    const dir = name === 'back' ? new THREE.Vector3(0, 0.06, -1) : new THREE.Vector3(0, 0.06, 1);
    return { q: name === 'section' ? Q_SEC : Q_ID, pos: f.c.clone().addScaledVector(dir.normalize(), fitDist(f)), target: f.c.clone() };
  }
  function setView(name, instant) {
    viewName = name;
    const T = viewTarget(name);
    if (instant || reduced || opts.test) {
      heart.quaternion.copy(T.q); camera.position.copy(T.pos); controls.target.copy(T.target);
      heart.updateMatrixWorld(true); updateClip(); controls.update(); tween = null; idStale = true; relabelSoon(); kick(); return;
    }
    controls.enabled = false;
    tween = { t: 0, dur: 0.9, q0: heart.quaternion.clone(), q1: T.q, p0: camera.position.clone(), p1: T.pos, c0: controls.target.clone(), c1: T.target };
    hideLabels(); kick();
  }
  function stepTween(dt) {
    if (!tween) return false;
    tween.t = Math.min(tween.dur, tween.t + dt);
    const e = easeIO(tween.t / tween.dur);
    heart.quaternion.slerpQuaternions(tween.q0, tween.q1, e);
    /* the camera swings round the target, it does not cut through the heart */
    const a = tween.p0.clone().sub(tween.c0), b = tween.p1.clone().sub(tween.c1);
    const la = a.length(), lb = b.length();
    const dir = a.normalize().lerp(b.normalize(), e); if (dir.lengthSq() < 1e-6) dir.set(0, 0, 1);
    dir.normalize();
    controls.target.lerpVectors(tween.c0, tween.c1, e);
    camera.position.copy(controls.target).addScaledVector(dir, lerp(la, lb, e));
    heart.updateMatrixWorld(true); updateClip();
    if (tween.t >= tween.dur) { tween = null; controls.enabled = true; idStale = true; relabelSoon(); }
    return true;
  }

  /* ---------------- turning by buttons ----------------
     Daniel, 25 Sep: "if I just want to turn it I click those arrows and it turns more easily, and then if
     I just want to flip it then I can use the mouse". turn(): one smooth step round the heart, the same
     way a drag would turn it (left: the heart's front goes left; up: its front tips up). spin(): keeps
     turning, in degrees a second, while a button is held; spin(0, 0) stops. Never past the poles, the
     same 20 degrees from them as the mouse. */
  const SPH = new THREE.Spherical(), OFF = new THREE.Vector3();
  function orbitBy(az, pol) {
    OFF.copy(camera.position).sub(controls.target);
    SPH.setFromVector3(OFF);
    SPH.theta += az; SPH.phi = clamp(SPH.phi + pol, controls.minPolarAngle, controls.maxPolarAngle); SPH.makeSafe();
    OFF.setFromSpherical(SPH);
    return controls.target.clone().add(OFF);
  }
  function turn(azDeg, polDeg) {
    if (tween) stepTween(tween.dur);                      /* a view still arriving: land it first */
    spinning = null; viewName = 'own';
    const p1 = orbitBy(THREE.MathUtils.degToRad(azDeg), THREE.MathUtils.degToRad(polDeg));
    if (reduced || opts.test) { camera.position.copy(p1); controls.update(); idStale = true; hideLabels(); relabelSoon(); kick(); return; }
    controls.enabled = false;
    tween = { t: 0, dur: 0.42, q0: heart.quaternion.clone(), q1: heart.quaternion.clone(), p0: camera.position.clone(), p1, c0: controls.target.clone(), c1: controls.target.clone() };
    hideLabels(); kick();
  }
  let spinning = null;
  function spin(azRate, polRate) {
    if (!azRate && !polRate) { if (spinning) { spinning = null; idStale = true; relabelSoon(); } return; }
    if (tween) stepTween(tween.dur);
    viewName = 'own';
    spinning = { az: THREE.MathUtils.degToRad(azRate), pol: THREE.MathUtils.degToRad(polRate) };
    hideLabels(); kick();
  }
  function stepSpin(dt) {
    if (!spinning) return false;
    camera.position.copy(orbitBy(spinning.az * dt, spinning.pol * dt));
    idStale = true;
    return true;
  }

  /* ---------------- a beat, or one stage of it ----------------
     plan: [{ stage, dur, valves: {tri, mit, pul, aor}, rates: {R, L}, atria: [from, to], vent: [from, to], hold }]
     Valves swing in the first quarter-second of a stage; chambers contract or relax over the stage;
     flow rises at once and dies away at the end of a stage that holds, so the last frame is still. */
  let anim = null;
  const REST = { tri: 1, mit: 1, pul: 0, aor: 0 };
  function setValvesNow(vs) { Object.keys(VALVES).forEach((k) => { const o = vs[k] ? 1 : 0; if (VALVES[k].open !== o) { VALVES[k].open = o; VALVES[k].dirty = true; } }); }
  function setContraction(a, v) {
    beatC[0].w = 0.15 * a; beatC[1].w = 0.15 * a; beatC[2].w = 0.14 * v; beatC[3].w = 0.14 * v;
    Object.values(VALVES).forEach((vv) => { vv.dirty = true; });
  }
  function applyAt(t) {
    const plan = anim.plan; let t0 = 0, k = 0;
    for (k = 0; k < plan.length - 1 && t >= t0 + plan[k].dur; k++) t0 += plan[k].dur;
    const seg = plan[k], u = clamp((t - t0) / seg.dur, 0, 1), secs = u * seg.dur;
    const prev = k > 0 ? plan[k - 1].valves : (anim.from || seg.valves);
    /* A valve that shuts swings first; one that opens waits until it has shut, so for a moment all four
       valves are shut: just after "lub", while the ventricles squeeze and their pressure rises to the
       arteries', and just after "dub", while it falls to the atria's. The animation used to swing
       them all at once. */
    const SW = Math.min(0.28, seg.dur * 0.18), GAP = Math.min(0.22, seg.dur * 0.12);
    const shuts = Object.keys(VALVES).some((key) => prev[key] && !seg.valves[key]);
    const late = (key) => shuts && !prev[key] && !!seg.valves[key];
    Object.keys(VALVES).forEach((key) => {
      const a = late(key) ? SW + GAP : 0;
      const o = lerp(prev[key] ? 1 : 0, seg.valves[key] ? 1 : 0, sstep(a, a + SW, secs));
      if (Math.abs(VALVES[key].open - o) > 1e-4) { VALVES[key].open = o; VALVES[key].dirty = true; }
    });
    const ce = sstep(0, 0.7, u);
    setContraction(lerp(seg.atria[0], seg.atria[1], ce), lerp(seg.vent[0], seg.vent[1], ce));
    /* the flows: each stage moves its volumes (the widget's rates, in stroke volumes) through the valves
       in one smooth surge, while the veins fill and the arteries pass blood on steadily. A stage that
       holds brings everything to rest before its end, so its last frame is still. */
    const bump = (a, b) => (u <= a || u >= b ? 0 : Math.pow(Math.sin(Math.PI * (u - a) / (b - a)), 2) * 2 / (b - a));
    const end = seg.hold ? 0.86 : 0.94, pulse = bump(seg.hold ? 0.04 : 0.06, end);
    const pulseLate = bump((SW * 1.5 + GAP) / seg.dur, end);      /* through a valve that opens late: once it is half open */
    const steady = seg.hold ? bump(0.02, 0.9) : 1;
    ['R', 'L'].forEach((s) => {
      const v = seg.rates[s], F = FLOW[s], q = SIDES[s].SV / seg.dur;
      const pAv = late(s === 'R' ? 'tri' : 'mit') ? pulseLate : pulse, pSl = late(s === 'R' ? 'pul' : 'aor') ? pulseLate : pulse;
      F.body = (v.body || 0) * steady * q; F.in = v.in * steady * q; F.av = v.av * pAv * q; F.sl = v.sl * pSl * q; F.out = v.out * steady * q;
    });
    if (anim.segIndex !== k) { anim.segIndex = k; if (anim.onStep) anim.onStep(k, seg); }
  }
  function play(plan, o) {
    o = o || {};
    anim = { plan, t: 0, total: plan.reduce((a, s) => a + s.dur, 0), loop: !!o.loop, speed: o.speed || 1, segIndex: -1,
             onStep: o.onStep, onDone: o.onDone, from: o.from, paused: false };
    if (o.still || reduced) {
      /* reduced motion: no movement, only the end of the stage — the blood already moved there */
      const dt = 1 / 30;
      for (let t = 0; t < anim.total; t += dt) { applyAt(t); stepBlood(dt * anim.speed); }
      anim.t = anim.total; applyAt(anim.total - 1e-4);
      Object.keys(VALVES).forEach((k) => { if (VALVES[k].dirty) buildValve(k); });
      drawBlood(); const done = anim.onDone; anim.paused = true; idStale = true; kick(); if (done && !anim.loop) done();
      return;
    }
    applyAt(0); kick();
  }
  function stepAnim(dt) {
    if (!anim || anim.paused) return false;
    const sdt = dt * anim.speed;
    anim.t += sdt;
    let finished = false;
    if (anim.t >= anim.total) {
      if (anim.loop) { anim.t -= anim.total; anim.segIndex = -1; }
      else { anim.t = anim.total; finished = true; }
    }
    applyAt(Math.min(anim.t, anim.total - 1e-4));
    stepBlood(sdt);
    if (finished) { anim.paused = true; const d = anim.onDone; if (d) d(); }
    return true;
  }
  function stopAnim(resetValves) {
    anim = null;
    ['R', 'L'].forEach((s) => { FLOW[s].body = FLOW[s].in = FLOW[s].av = FLOW[s].sl = FLOW[s].out = 0; });
    setContraction(0, 0);
    if (resetValves) setValvesNow(resetValves);
    kick();
  }

  /* ---------------- picking and labels ----------------
     One off-screen render in flat part colours answers both "what did I press?" and "where can a label
     point?": a label's dot is always put on a pixel of its own part that you can see. */
  let idRT = null, idBuf = null, IW = 0, IH = 0, idStale = true;
  const idMats = new Map();
  function renderIds() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return false;
    const s = Math.min(1, 520 / w);
    const iw = Math.max(64, Math.round(w * s)), ih = Math.max(64, Math.round(h * s));
    if (!idRT || iw !== IW || ih !== IH) {
      if (idRT) idRT.dispose();
      idRT = new THREE.WebGLRenderTarget(iw, ih, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, type: THREE.UnsignedByteType });
      IW = iw; IH = ih; idBuf = new Uint8Array(iw * ih * 4);
    }
    const swapped = [];
    capObjs.forEach((o) => { if (o.visible) { swapped.push([o, null, true]); o.visible = false; } });
    Object.values(flagRings).forEach((o) => { if (o.visible) { swapped.push([o, null, true]); o.visible = false; } });
    scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isLineSegments) return;
      if (capObjs.indexOf(o) >= 0) return;
      if (o.isInstancedMesh || o.isLineSegments) { if (o.visible) { swapped.push([o, null, true]); o.visible = false; } return; }
      const pt = parts[o.name] || null; const vv = o.name && o.name.indexOf('pv_') === 0 ? VALVES[o.name.slice(3)] : null;
      const idm = pt ? pt.idMat : vv ? vv.idMat : null;
      if (!idm) return;
      swapped.push([o, o.material, false]); o.material = idm;
    });
    const bg = scene.background, env = scene.environment; scene.background = null; scene.environment = null;
    const oldTarget = renderer.getRenderTarget(), oldClear = renderer.getClearAlpha(), vis = []; let vgHid = false;
    try {
      renderer.setRenderTarget(idRT); renderer.setClearColor(0x000000, 0); renderer.clear();
      if (xray && vgroup.visible) {
        /* see-through walls: the walls first, then the moving valves over them, as you see them */
        vgroup.visible = false; vgHid = true; renderer.render(scene, camera); vgroup.visible = true; vgHid = false;
        renderer.clearDepth();
        heart.children.forEach((c) => { if (c !== vgroup) { vis.push([c, c.visible]); c.visible = false; } });
        renderer.autoClear = false; renderer.render(scene, camera);
      } else renderer.render(scene, camera);
      renderer.readRenderTargetPixels(idRT, 0, 0, IW, IH, idBuf);
    } finally {
      /* whatever happens in the pass, the heart gets back its own look (a throw here once left the
         valves wearing their picking colours, and every later change of look failed) */
      renderer.autoClear = true; if (vgHid) vgroup.visible = true; vis.forEach(([c, v]) => { c.visible = v; });
      renderer.setRenderTarget(oldTarget); renderer.setClearColor(0x000000, oldClear);
      scene.background = bg; scene.environment = env;
      swapped.forEach(([o, m, hid]) => { if (hid) o.visible = true; else o.material = m; });
    }
    idStale = false;
    return true;
  }
  function idAt(cx, cy) {      /* css px in the host -> [part id, isWall] */
    if (idStale && !renderIds()) return null;
    const w = host.clientWidth, h = host.clientHeight;
    const x = Math.floor(cx / w * IW), y = IH - 1 - Math.floor(cy / h * IH);
    if (x < 0 || y < 0 || x >= IW || y >= IH) return null;
    const i = (y * IW + x) * 4, v = idBuf[i];
    if (!v) return null;
    return [byIndex[v], idBuf[i + 1] > 127];
  }

  /* labels overlay: an SVG for the ruled leaders and dots, and a box per label */
  const over = document.createElement('div'); over.className = 'h3__labels'; over.setAttribute('aria-hidden', 'true');
  const svgNS = 'http://www.w3.org/2000/svg';
  const lsvg = document.createElementNS(svgNS, 'svg'); lsvg.setAttribute('class', 'h3__leaders'); over.appendChild(lsvg);
  host.appendChild(over);
  let labelWant = [];      /* part ids to label, in priority order */
  let labelTimer = null, labelsShown = false;
  function hideLabels() { over.classList.remove('is-on'); labelsShown = false; clearTimeout(labelTimer); labelTimer = null; }
  function relabelSoon(ms) { clearTimeout(labelTimer); labelTimer = setTimeout(() => { labelTimer = null; layoutLabels(); }, ms == null ? 140 : ms); }
  function labelText(id) {
    const nm = NAMES[id] || { name: id };
    return nm;
  }
  const PARTOF = (id) => (/^vena_cava/.test(id) ? 'vena_cava' : /^pap_/.test(id) ? 'papillary' : id);
  let lastLayout = [];
  function layoutLabels() {
    if (dead) return;
    while (over.children.length > 1) over.removeChild(over.lastChild);
    lsvg.innerHTML = '';
    lastLayout = [];
    if (!labelWant.length) { hideLabels(); return; }
    if (!renderIds()) return;
    const w = host.clientWidth, h = host.clientHeight, sx = w / IW, sy = h / IH;
    /* the regions: every pixel of each wanted part, and the extent of the whole heart on screen */
    const want = new Map(); labelWant.forEach((id, i) => want.set(id, i));
    const keyOf = (v, back) => { const id = byIndex[v]; if (!id) return null; if (back && want.has(id + '#wall')) return id + '#wall'; return want.has(id) ? id : PARTOF(id); };
    const reg = labelWant.map(() => []), loose = labelWant.map(() => []), thin = labelWant.map(() => []);
    let minX = 1e9, maxX = -1e9;
    const m = 3;       /* a candidate should have its own part 3 pixels away on all four sides (1 if nothing else fits) */
    const K = (j) => keyOf(idBuf[j], idBuf[j + 1] > 127);
    const same = (i, d, id) => K(i + d * 4) === id && K(i - d * 4) === id && K(i + d * IW * 4) === id && K(i - d * IW * 4) === id;
    for (let y = m; y < IH - m; y += 2) for (let x = m; x < IW - m; x += 2) {
      const i = (y * IW + x) * 4, v = idBuf[i];
      if (!v) continue;
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      const id = K(i); const wi = want.get(id);
      if (wi == null) continue;
      const pt = [(x + 0.5) * sx, (IH - 1 - y + 0.5) * sy];     /* the centre of the ID pixel, so it maps back to the same one */
      if (same(i, m, id)) reg[wi].push(pt); else if (same(i, 1, id)) loose[wi].push(pt); else if (id === 'chordae') thin[wi].push(pt);
    }
    const midX = (minX + maxX) / 2 * sx;
    const phoneish = w < 520;
    const lineH = phoneish ? 15 : 17;
    const placed = [];
    /* the parts with least room on screen choose their height first; a chosen part always comes first */
    /* who chooses a height first: the part you pressed; then the chambers and the septum; then the
       valves; then the vessels; then the rest. Within each group, the part with least room first. */
    const first = (id) => id === selected || id === selected + '#wall';
    const tier = (id) => (first(id) ? 0 : /^(ra|la|rv|lv|septum)(#wall)?$/.test(id) ? 1 : /^valve_/.test(id) ? 2 : /^(aorta|pulmonary_artery|pulmonary_veins|vena_cava)/.test(id) ? 3 : 4);
    const order = labelWant.map((id, wi) => wi).sort((a, b) => (tier(labelWant[a]) - tier(labelWant[b])) || (reg[a].length - reg[b].length));
    const clash = (top, bot, skip) => placed.filter((q) => q !== skip && top < q.bot + 3 && bot > q.top - 3);
    function prep(id, pts) {
      const nm = labelText(id), hgt = lineH * (nm.sub ? 2 : 1) + 6;
      let cx = 0, cy = 0; pts.forEach((p) => { cx += p[0]; cy += p[1]; }); cx /= pts.length || 1; cy /= pts.length || 1;
      pts.sort((a, b) => (a[0] - cx) ** 2 + (a[1] - cy) ** 2 - ((b[0] - cx) ** 2 + (b[1] - cy) ** 2));
      /* the stage's own furniture keeps its space: the view name, its buttons, the top arrow and the stage
         caption along the top; the hint, the bottom arrow and the colour key along the bottom */
      return { id, nm, hgt, pts: pts.filter((p) => p[1] - hgt / 2 >= (phoneish ? 112 : 80) && p[1] + hgt / 2 <= h - 74) };
    }
    const put = (c, p) => ({ id: c.id, x: p[0], y: p[1], top: p[1] - c.hgt / 2, bot: p[1] + c.hgt / 2, nm: c.nm, side: p[0] < midX ? 'L' : 'R', c });
    /* no two labels may share a band of height: horizontal leaders at distinct heights never cross, and
       the boxes on each side cannot overlap. A part that finds no free band may move ONE label already
       placed to another of that label's own points, if that makes room. */
    function tryPlace(c) {
      if (!c.pts.length) return false;
      for (const p of c.pts) { const L = put(c, p); if (!clash(L.top, L.bot).length) { placed.push(L); return true; } }
      for (const p of c.pts) {
        const L = put(c, p), cl = clash(L.top, L.bot);
        if (cl.length !== 1) continue;
        const q = cl[0];
        for (const p2 of q.c.pts) {
          const Q = put(q.c, p2);
          if (Q.top < L.bot + 3 && Q.bot > L.top - 3) continue;
          if (clash(Q.top, Q.bot, q).length) continue;
          placed[placed.indexOf(q)] = Q; placed.push(L); return true;
        }
      }
      return false;
    }
    /* the tendons are cords a few pixels across: any pixel of one is on it */
    order.forEach((wi) => { const id = labelWant[wi]; if (!tryPlace(prep(id, reg[wi])) && !tryPlace(prep(id, loose[wi]))) tryPlace(prep(id, thin[wi])); });
    const colL = Math.max(8, minX * sx - 12), colR = Math.min(w - 8, maxX * sx + 12);
    let svg = '';
    placed.forEach((q) => {
      const lab = document.createElement('div');
      const wrong = q.id.indexOf('valve_') === 0 && flagged.has(q.id.slice(6));
      lab.className = 'h3__lab h3__lab--' + q.side + (first(q.id) ? ' is-sel' : '') + (wrong ? ' is-wrong' : '');
      lab.innerHTML = '<span class="h3__labn">' + esc(q.nm.name) + '</span>' + (q.nm.sub ? '<span class="h3__labs">' + esc(q.nm.sub) + '</span>' : '');
      lab.style.top = Math.round(q.y) + 'px';
      if (q.side === 'L') lab.style.right = Math.round(w - colL + 6) + 'px'; else lab.style.left = Math.round(colR + 6) + 'px';
      over.appendChild(lab);
      const x2 = q.side === 'L' ? colL : colR;
      const y = Math.round(q.y) + 0.5;
      svg += '<line class="h3__leadhalo" x1="' + q.x.toFixed(1) + '" y1="' + y + '" x2="' + x2.toFixed(1) + '" y2="' + y + '"/>' +
             '<line class="h3__lead' + (wrong ? ' is-wrong' : '') + '" x1="' + q.x.toFixed(1) + '" y1="' + y + '" x2="' + x2.toFixed(1) + '" y2="' + y + '"/>' +
             '<circle class="h3__dot' + (wrong ? ' is-wrong' : '') + '" cx="' + q.x.toFixed(1) + '" cy="' + y + '" r="3"/>';
      lastLayout.push({ id: q.id, x: q.x, y: q.y, side: q.side, x2 });
    });
    lsvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    lsvg.innerHTML = svg;
    /* a label whose box would leave the stage, or reach under the turning arrow at the middle of either
       side, is pulled in and given a solid background */
    const hb = host.getBoundingClientRect(), midY = hb.top + hb.height / 2;
    Array.prototype.forEach.call(over.querySelectorAll('.h3__lab'), (el) => {
      const r = el.getBoundingClientRect(), gut = r.top < midY + 26 && r.bottom > midY - 26 ? 48 : 4;
      if (r.left < hb.left + gut - 2) { el.style.right = ''; el.style.left = gut + 'px'; el.classList.add('is-tight'); }
      if (r.right > hb.right - gut + 2) { el.style.left = ''; el.style.right = gut + 'px'; el.classList.add('is-tight'); }
    });
    over.classList.add('is-on'); labelsShown = true;
    if (opts.onLabels) opts.onLabels(lastLayout.slice());
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }
  function clearLabels() { while (over.children.length > 1) over.removeChild(over.lastChild); lsvg.innerHTML = ''; lastLayout = []; }
  function setLabels(ids) { labelWant = (ids || []).slice(); if (!labelWant.length) { hideLabels(); clearLabels(); return; } relabelSoon(30); }

  /* ---------------- pointer: turn, and press to name ---------------- */
  let down = null, moving = false;
  const el = renderer.domElement;
  el.addEventListener('pointerdown', (e) => { down = { x: e.clientX, y: e.clientY, t: performance.now() }; });
  el.addEventListener('pointerup', (e) => {
    if (!down) return;
    const d = Math.hypot(e.clientX - down.x, e.clientY - down.y), quick = performance.now() - down.t < 600;
    down = null;
    if (d > 5 || !quick) return;
    const b = el.getBoundingClientRect();
    if (idStale) renderIds();
    const hit = idAt(e.clientX - b.left, e.clientY - b.top);
    if (opts.onPick) opts.onPick(hit ? hit[0] : null, hit ? hit[1] : false);
  });
  el.addEventListener('pointermove', (e) => {
    if (down || coarse) return;
    const b = el.getBoundingClientRect();
    if (idStale) return;               /* hover never forces a render; the cursor updates once idle */
    const hit = idAt(e.clientX - b.left, e.clientY - b.top);
    el.style.cursor = hit ? 'pointer' : 'grab';
  });
  controls.addEventListener('start', () => { moving = true; viewName = 'own'; hideLabels(); if (opts.onInteract) opts.onInteract(); });
  /* any change of camera, however it came about, takes the labels down; they are laid out again once
     the view is still, so a leader is never drawn to where a part used to be */
  controls.addEventListener('change', () => { idStale = true; if (labelsShown || labelTimer) hideLabels(); kick(); });
  controls.addEventListener('end', () => { moving = false; });

  /* ---------------- the loop: only when something moves, only when you can see it ---------------- */
  let raf = 0, last = 0, visible = true, onScreen = true;
  /* One loop only. controls.update() inside a frame fires 'change', which kicks: a kick during a frame
     only asks for one more frame, it never starts a second loop (two loops doubled every frame). */
  let inFrame = false, pending = false;
  function kick() {
    pending = true;
    if (!raf && !inFrame && visible && onScreen && !dead) { last = -1; raf = requestAnimationFrame(frame); }
  }
  let frames = 0, why = '';
  function frame(now) {
    raf = 0; frames++; inFrame = true; pending = false;
    if (dead) return;
    /* the first frame after a pause moves nothing; a rAF timestamp can be older than performance.now() */
    const dt = last < 0 ? 0 : clamp((now - last) / 1000, 0, 0.05); last = now;
    let busy = false;
    if (stepTween(dt)) busy = true;
    if (stepSpin(dt)) busy = true;
    if (stepAnim(dt)) busy = true;
    if (flagged.size) { paintFlags(now); if (!reduced) busy = true; }
    const moved = controls.update();
    if (moved) busy = true;
    Object.keys(VALVES).forEach((k) => { if (VALVES[k].dirty && vgroup.visible) buildValve(k); });
    if (vgroup.visible || anim) drawBlood();
    heart.updateMatrixWorld(true); updateClip(); if (flagged.size) placeFlags();
    renderer.render(scene, camera);
    why = (tween ? 'tween ' : '') + (anim && !anim.paused ? 'anim ' : '') + (moved ? 'controls ' : '') + (moving ? 'moving' : '');
    inFrame = false;
    /* the names come back once the camera is still, even while the blood keeps flowing */
    if (!labelsShown && labelWant.length && !tween && !moving && !labelTimer) relabelSoon(busy ? 240 : 120);
    if (busy || moving || pending) raf = requestAnimationFrame(frame);
  }
  function renderNow() {
    Object.keys(VALVES).forEach((k) => { if (VALVES[k].dirty) buildValve(k); });
    drawBlood(); heart.updateMatrixWorld(true); updateClip(); controls.update(); if (flagged.size) placeFlags(); renderer.render(scene, camera);
  }

  function resize() {
    const w = host.clientWidth, h = host.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; camera.updateProjectionMatrix();
    idStale = true; hideLabels(); kick(); relabelSoon(160);
  }
  const ro = new ResizeObserver(resize); ro.observe(host); disposers.push(() => ro.disconnect());
  const io = new IntersectionObserver((ents) => { onScreen = ents.some((e) => e.isIntersecting); if (onScreen) kick(); }, { rootMargin: '80px' });
  io.observe(host); disposers.push(() => io.disconnect());
  const onVis = () => { visible = !document.hidden; if (visible) kick(); };
  document.addEventListener('visibilitychange', onVis); disposers.push(() => document.removeEventListener('visibilitychange', onVis));

  setView('front', true);
  resize();
  applyLook();

  /* ---------------- the handle the widget holds ---------------- */
  const api = {
    THREE,
    setMode(m) {
      mode = m; xray = m !== 'explore';
      if (m !== 'explore') { cutK = 0; updateClip(); }
      stopAnim(m === 'explore' ? null : REST);
      if (m !== 'explore') { seedBlood('A'); drawBlood(); }
      applyLook(); relabelSoon();
    },
    setCut(k) {
      const was = cutK; cutK = clamp(k, 0, 1); updateClip(); idStale = true; hideLabels();
      if (Object.values(GONE_AT).some((g) => (was >= g) !== (cutK >= g))) applyLook();
      if (was === 0 && cutK > 0 && viewName !== 'section') setView('section');
      kick(); relabelSoon(200);
      return viewName;                /* the view it leaves you in: turned by you ('own') stays turned */
    },
    cutAt4ch: 0.5,
    setXray(on) { xray = !!on; applyLook(); },
    showBlood(on) { bloodShown = !!on; applyLook(); },
    flagValves(keys) { flagged.clear(); (keys || []).forEach((k) => flagged.add(k)); applyLook(); relabelSoon(60); },
    view(name) { setView(name); },
    turn(az, pol) { turn(az, pol); },
    spin(az, pol) { spin(az, pol); },
    select(id) { selected = id; applyLook(); relabelSoon(60); },
    /* 'R' or 'L' shows that side of the heart only; null shows both */
    showSide(side) { sideOnly = side === 'R' || side === 'L' ? side : null; applyLook(); relabelSoon(60); },
    labels: setLabels,
    setValves(vs) { setValvesNow(vs); kick(); },
    play, stop: stopAnim,
    pause() { if (anim) anim.paused = true; },
    resume() { if (anim) { anim.paused = false; kick(); } },
    playing() { return !!(anim && !anim.paused); },
    setSpeed(s) { if (anim) anim.speed = s; },
    reseed(key) { seedBlood(key); drawBlood(); kick(); },
    /* for the headless checks: jump to time t of a plan, deterministically */
    seek(plan, t, o) {
      o = o || {};
      seedBlood(plan[0] && plan[0].stage); anim = { plan, t: 0, total: plan.reduce((a, s) => a + s.dur, 0), loop: !!o.loop, speed: 1, segIndex: -1, from: o.from, paused: true };
      const dt = 1 / 60, at = (tt) => (anim.loop ? tt % anim.total : Math.min(tt, anim.total - 1e-4));
      for (let tt = 0; tt < t; tt += dt) { anim.t = at(tt); if (anim.loop && tt % anim.total < dt) anim.segIndex = -1; applyAt(anim.t); stepBlood(dt); }
      applyAt(at(t));
      renderNow(); idStale = true;
      return { t, stage: anim.segIndex };
    },
    frameCost(n) {      /* ms per full frame, measured by rendering n frames back to back */
      n = n || 60; const t0 = performance.now();
      for (let i = 0; i < n; i++) { stepBlood(1 / 60); drawBlood(); renderer.render(scene, camera); }
      renderer.getContext().finish();
      return (performance.now() - t0) / n;
    },
    /* checks only: median GPU time of one full frame, from a timer query where the driver has one */
    async gpuMs(n) {
      const g = renderer.getContext(), ext = g.getExtension('EXT_disjoint_timer_query_webgl2'); if (!ext) return null;
      const res = [];
      for (let i = 0; i < (n || 20); i++) {
        const q = g.createQuery(); g.beginQuery(ext.TIME_ELAPSED_EXT, q);
        stepBlood(1 / 60); drawBlood(); renderer.render(scene, camera); g.endQuery(ext.TIME_ELAPSED_EXT);
        for (let k = 0; k < 60 && !g.getQueryParameter(q, g.QUERY_RESULT_AVAILABLE); k++) await new Promise((r) => setTimeout(r, 10));
        if (!g.getParameter(ext.GPU_DISJOINT_EXT)) res.push(g.getQueryParameter(q, g.QUERY_RESULT) / 1e6);
        g.deleteQuery(q);
      }
      res.sort((a, b) => a - b); return res.length ? +res[res.length >> 1].toFixed(2) : null;
    },
    info() {
      const r = renderer.info;
      return { frames, why, triangles: r.render.triangles, calls: r.render.calls, geometries: r.memory.geometries, textures: r.memory.textures, pixelRatio: renderer.getPixelRatio(), view: viewName, cut: cutK, mode, joinMs: Math.round(joinMs), labels: lastLayout.slice() };
    },
    layoutNow() { layoutLabels(); return lastLayout.slice(); },
    /* checks only: put the camera anywhere (heart frame), and read a valve ring */
    lookFrom(pos, target) {
      heart.updateMatrixWorld(true);
      const p = new THREE.Vector3(...pos).applyMatrix4(heart.matrixWorld), t = new THREE.Vector3(...target).applyMatrix4(heart.matrixWorld);
      tween = null; controls.enabled = true; controls.minDistance = 0.05; camera.position.copy(p); controls.target.copy(t); controls.update(); idStale = true; renderNow(); kick();
    },
    /* checks only: where the camera is, and what it looks at */
    camInfo() { return { pos: camera.position.toArray().map((x) => +x.toFixed(3)), target: controls.target.toArray().map((x) => +x.toFixed(3)), enabled: controls.enabled, tween: !!tween }; },
    /* checks only: the room measured round the middle paths — per point, the least and most across */
    roomStats() {
      const out = {};
      ['mid_r', 'mid_l'].forEach((k) => { const P = PATH[k]; if (!P || !P.E) return; out[k] = P.E.map((e, i) => [+P.S[i].toFixed(2), +P.R[i].toFixed(3), +Math.min(...e).toFixed(3), +Math.max(...e).toFixed(3)]); });
      out.trimmed = Object.fromEntries(Object.keys(PATH).map((k) => [k, (PATH[k].trimmed || 0) + ' pts cut, ' + PATH[k].len.toFixed(2) + ' dm left']));
      out.sAV = { R: SIDES.R.sAV, L: SIDES.L.sAV }; out.sSL = { R: SIDES.R.sSL, L: SIDES.L.sSL }; out.ms = roomMs;
      return out;
    },
    /* checks only: where each compartment's particles are on screen (css px in the stage) */
    bloodScreen() {
      const out = {}, v = new THREE.Vector3(), w = host.clientWidth, h = host.clientHeight;
      Object.keys(SIDES).forEach((k) => {
        const sd = SIDES[k], acc = {};
        blood[k].parts.forEach((p, i) => {
          const m = new THREE.Matrix4(); blood[k].im.getMatrixAt(i, m); v.setFromMatrixPosition(m).applyMatrix4(heart.matrixWorld).project(camera);
          const x = (v.x + 1) / 2 * w, y = (1 - v.y) / 2 * h, a = acc[p.c] || (acc[p.c] = { n: 0, x0: 1e9, x1: -1e9, y0: 1e9, y1: -1e9 });
          a.n++; a.x0 = Math.min(a.x0, x); a.x1 = Math.max(a.x1, x); a.y0 = Math.min(a.y0, y); a.y1 = Math.max(a.y1, y);
        });
        out[k] = Object.fromEntries(Object.entries(acc).map(([c, a]) => [['vein', 'atrium', 'ventricle', 'root', 'artery'][c], [a.n, Math.round(a.x0), Math.round(a.x1), Math.round(a.y0), Math.round(a.y1)]]));
      });
      return out;
    },
    /* checks only: how many particles each compartment holds, and the blood in it now */
    bloodStats() {
      const out = {};
      Object.keys(SIDES).forEach((k) => {
        const sd = SIDES[k], n = [0, 0, 0, 0, 0];
        blood[k].parts.forEach((p) => { n[p.c]++; });
        out[k] = { n, SV: +sd.SV.toFixed(5), at: +sd.vol.at.toFixed(5), ve: +sd.vol.ve.toFixed(5), Gat: +sd.Gat.toFixed(5), Gve: +sd.Gve.toFixed(5), Gro: +sd.Gro.toFixed(5), sAV: +sd.sAV.toFixed(3), sSL: +sd.sSL.toFixed(3), len: +PATH[sd.mid].len.toFixed(3),
                   flow: Object.fromEntries(Object.entries(FLOW[k]).map(([q, v]) => [q, +v.toFixed(5)])) };
      });
      return out;
    },
    idStats() { renderIds(); const c = {}; for (let i = 0; i < idBuf.length; i += 4) { const v = idBuf[i]; if (v) { const k = byIndex[v] + (idBuf[i + 1] > 127 ? '(back)' : ''); c[k] = (c[k] || 0) + 1; } } return c; },
    ring(k) { const f = VALVES[k].f; return { c: f.c.toArray(), n: f.n.toArray(), u: f.u.toArray(), r: f.r, depth: f.depth, open: VALVES[k].open }; },
    showOnly(re) { const rx = re ? new RegExp(re) : null; Object.values(parts).forEach((pt) => { pt.mesh.visible = !rx || rx.test(pt.id); }); Object.values(blood).forEach((B) => { B.im.visible = !rx; }); kick(); },
    pickAt(x, y) { renderIds(); return idAt(x, y); },
    resize,
    kick,
    dispose() {
      if (dead) return; dead = true;
      if (raf) cancelAnimationFrame(raf); raf = 0; clearTimeout(labelTimer);
      disposers.forEach((f) => { try { f(); } catch (e) {} });
      controls.dispose();
      scene.traverse((o) => {
        if (o.geometry) o.geometry.dispose();
        if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => m.dispose());
      });
      Object.values(parts).forEach((p) => { p.idMat.dispose(); p.mat.dispose(); if (p.xmat) p.xmat.dispose(); });
      Object.values(VALVES).forEach((v) => v.idMat.dispose());
      pgeo.dispose(); envTex.dispose(); if (idRT) idRT.dispose();
      renderer.dispose();
      try { renderer.forceContextLoss(); } catch (e) {}
      if (gl.parentNode) gl.parentNode.removeChild(gl);
      if (over.parentNode) over.parentNode.removeChild(over);
    }
  };
  return api;
}
