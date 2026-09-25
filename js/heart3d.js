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
     - the blood: particles on paths traced through the model's own cavities and lumens
       (least-cost paths through the free space, kept away from every wall — see CREDITS.md);
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
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: !!opts.test });
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
  controls.enableDamping = !reduced; controls.dampingFactor = 0.08;
  controls.enablePan = true; controls.screenSpacePanning = true;
  controls.touches = { ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN };
  controls.rotateSpeed = 0.8; controls.zoomSpeed = 0.9;

  /* the heart: everything that belongs to it lives in this group, which turns for the section view */
  const heart = new THREE.Group(); scene.add(heart);

  /* ---------------- the model ---------------- */
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
  const gltf = await loader.loadAsync(opts.model, (ev) => { if (opts.onProgress) opts.onProgress(ev.loaded, ev.total); });
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
    };
    mat.customProgramCacheKey = () => (capHex != null ? 'h3wall-cap' : 'h3wall');
  }
  /* the picking pass: one flat colour per part, and back faces (the cut surface) flagged */
  function idMaterial(index) {
    const m = new THREE.MeshBasicMaterial({ side: THREE.DoubleSide, clippingPlanes: PLANES });
    m.onBeforeCompile = (sh) => {
      sh.uniforms.uId = { value: index / 255 };
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uId;')
        .replace('#include <dithering_fragment>', '#include <dithering_fragment>\ngl_FragColor = vec4(uId, gl_FrontFacing ? 0.0 : 1.0, 0.0, 1.0);');
    };
    m.customProgramCacheKey = () => 'h3id';
    return m;
  }

  const parts = {};            /* id -> { mesh, mat, idMat, index } */
  const byIndex = [null];
  gltf.scene.traverse((o) => {
    if (!o.isMesh) return;
    const id = o.name || (o.parent && o.parent.name);
    const look = LOOK[id] || { c: 0x999999 };
    const solid = SOLID.test(id);
    const mat = new THREE.MeshStandardMaterial({ color: look.c, roughness: look.r || 0.62, metalness: 0, side: THREE.DoubleSide, clippingPlanes: PLANES });
    patchWall(mat, o, solid ? look.cap : null);
    o.material = mat;
    const index = byIndex.length; byIndex.push(id);
    parts[id] = { id, mesh: o, mat, idMat: idMaterial(index), index, solid };
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
  const PAPS = {}; Object.keys(V.paps).forEach((k) => { PAPS[k] = new THREE.Vector3(...V.paps[k]); });
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
     and out through the semilunar valve; out_* from that valve along the artery. A particle rides one
     inlet + the middle + one outlet. Its speed is the flow at that point divided by the local area
     (continuity), so blood crowds in the wide chambers and hurries through the vessels. */
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
    return { key, P, S, R, T, N, B, len: S[n - 1] };
  }
  const PATH = {}; Object.keys(X.paths).forEach((k) => { PATH[k] = mkPath(k); });
  const SIDES = {
    R: { mid: 'mid_r', ins: [['in_svc', 0.4], ['in_ivc', 0.6]], outs: [['out_pa_l', 0.47], ['out_pa_r', 0.53]], av: 'tri', sl: 'pul', color: BLOOD.deo, n: coarse ? 150 : 210 },
    L: { mid: 'mid_l', ins: [['in_pv_rs', 0.25], ['in_pv_ri', 0.25], ['in_pv_ls', 0.25], ['in_pv_li', 0.25]],
         outs: [['out_desc', 0.52], ['out_brachio', 0.2], ['out_lcc', 0.13], ['out_lsub', 0.15]], av: 'mit', sl: 'aor', color: BLOOD.oxy, n: coarse ? 170 : 250 }
  };
  /* where along the middle path each valve blocks: the path point nearest the shut cusps */
  function nearestS(path, p) { let best = 0, bd = 1e9; path.P.forEach((q, i) => { const d = q.distanceToSquared(p); if (d < bd) { bd = d; best = i; } }); return path.S[best]; }
  Object.keys(SIDES).forEach((k) => {
    const sd = SIDES[k], mid = PATH[sd.mid];
    const fa = VALVES[sd.av].f, fs = VALVES[sd.sl].f;
    sd.sAV = nearestS(mid, fa.c);
    sd.sSL = nearestS(mid, tmpA.copy(fs.c).addScaledVector(fs.n, fs.depth * 0.6));
    if (sd.sSL <= sd.sAV + 0.05) sd.sSL = mid.len - 0.01;
  });
  function sampleAt(path, s, out, frame) {
    const S = path.S; let lo = 0, hi = S.length - 1;
    s = clamp(s, 0, path.len);
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (S[m] <= s) lo = m; else hi = m; }
    const t = (s - S[lo]) / Math.max(1e-9, S[hi] - S[lo]);
    out.lerpVectors(path.P[lo], path.P[hi], t);
    if (frame) { frame.r = lerp(path.R[lo], path.R[hi], t); frame.N = path.N[lo]; frame.B = path.B[lo]; }
    return out;
  }
  const pgeo = new THREE.SphereGeometry(coarse ? 0.019 : 0.016, 10, 8);
  const blood = {};
  const rand = rng(20260925);
  function pick(list) { let x = rand(), acc = 0; for (const [k, w] of list) { acc += w; if (x <= acc) return k; } return list[list.length - 1][0]; }
  Object.keys(SIDES).forEach((k) => {
    const sd = SIDES[k];
    const mat = new THREE.MeshStandardMaterial({ color: sd.color, roughness: 0.35, metalness: 0, emissive: sd.color, emissiveIntensity: 0.18, clippingPlanes: PLANES });
    const im = new THREE.InstancedMesh(pgeo, mat, sd.n); im.frustumCulled = false; im.visible = false;
    heart.add(im);
    blood[k] = { im, mat, parts: [] };
  });
  function routeOf(sd, p) {
    const pin = PATH[p.inK], pm = PATH[sd.mid], po = PATH[p.outK];
    return { pin, pm, po, s1: pin.len, s2: pin.len + pm.len, end: pin.len + pm.len + po.len };
  }
  function seedBlood() {
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], B = blood[k]; B.parts = [];
      for (let i = 0; i < sd.n; i++) {
        const p = { inK: pick(sd.ins), outK: pick(sd.outs), rho: Math.sqrt(rand()) * 0.62, phi: rand() * Math.PI * 2 };
        const r = routeOf(sd, p);
        /* start roughly where steady flow would put it: more particles where the space is wider */
        let s = 0;
        for (let tries = 0; tries < 12; tries++) {
          s = rand() * r.end;
          const fr = {}; locate(r, s, tmpA, fr);
          if (rand() < clamp((fr.r / 0.12) * (fr.r / 0.12), 0.08, 1)) break;
        }
        p.s = s; B.parts.push(p);
      }
    });
  }
  function locate(r, s, out, fr) {
    if (s < r.s1) return sampleAt(r.pin, s, out, fr);
    if (s < r.s2) return sampleAt(r.pm, s - r.s1, out, fr);
    return sampleAt(r.po, s - r.s2, out, fr);
  }
  seedBlood();

  /* the flow now: per side, the rates at the inlet, the atrioventricular valve, the semilunar valve
     and in the artery beyond it (units: path lengths a second, before the area correction) */
  const FLOW = { R: { in: 0, av: 0, sl: 0, out: 0 }, L: { in: 0, av: 0, sl: 0, out: 0 } };
  const SPEED = 0.42;
  function velocity(sd, F, r, s) {
    let q;
    if (s < r.s1) q = F.in;
    else if (s < r.s1 + sd.sAV) q = lerp(F.in, F.av, (s - r.s1) / Math.max(0.02, sd.sAV));
    else if (s < r.s1 + sd.sSL) q = lerp(F.av, F.sl, (s - r.s1 - sd.sAV) / Math.max(0.02, sd.sSL - sd.sAV));
    else q = lerp(F.sl, F.out, sstep(0, 0.12, s - r.s1 - sd.sSL));
    return q;
  }
  const fr0 = {};
  function stepBlood(dt) {
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], F = FLOW[k], B = blood[k];
      const avShut = VALVES[sd.av].open < 0.35, slShut = VALVES[sd.sl].open < 0.35;
      B.parts.forEach((p) => {
        const r = routeOf(sd, p);
        locate(r, p.s, tmpA, fr0);
        const area = clamp((0.1 / Math.max(fr0.r, 0.03)) ** 2, 0.3, 2.4);
        let ds = velocity(sd, F, r, p.s) * SPEED * area * dt;
        let s2 = p.s + ds;
        const a = r.s1 + sd.sAV, b = r.s1 + sd.sSL;
        if (avShut) { if (p.s < a && s2 >= a) s2 = a - 0.004; else if (p.s > a && s2 <= a) s2 = a + 0.004; }
        if (slShut) { if (p.s < b && s2 >= b) s2 = b - 0.004; else if (p.s > b && s2 <= b) s2 = b + 0.004; }
        if (s2 >= r.end) { p.inK = pick(sd.ins); p.outK = pick(sd.outs); s2 = s2 - r.end; }
        p.s = Math.max(0, s2);
      });
    });
  }
  const M4 = new THREE.Matrix4(), POS = new THREE.Vector3(), DISP = new THREE.Vector3();
  function drawBlood() {
    Object.keys(SIDES).forEach((k) => {
      const sd = SIDES[k], B = blood[k];
      B.parts.forEach((p, i) => {
        const r = routeOf(sd, p);
        locate(r, p.s, POS, fr0);
        const rad = fr0.r * p.rho;
        POS.addScaledVector(fr0.N, Math.cos(p.phi) * rad).addScaledVector(fr0.B, Math.sin(p.phi) * rad);
        POS.add(beatDisp(POS, DISP));
        M4.makeTranslation(POS.x, POS.y, POS.z);
        B.im.setMatrixAt(i, M4);
      });
      B.im.instanceMatrix.needsUpdate = true;
    });
  }
  drawBlood();

  /* ---------------- modes: what is shown ---------------- */
  let mode = 'explore', xray = false, cutK = 0, selected = null;
  function applyLook() {
    const live = mode !== 'explore';
    const lit = (id) => selected && (selected === id || (selected === 'vena_cava' && /^vena_cava/.test(id)) || (selected === 'papillary' && /^pap_/.test(id)));
    Object.values(parts).forEach((pt) => {
      const m = pt.mat, see = xray && !MODEL_VALVE.test(pt.id);
      pt.mesh.visible = !(live && MODEL_VALVE.test(pt.id)) && !(cutK >= (GONE_AT[pt.id] || 9));
      m.transparent = see; m.opacity = see ? (pt.id === 'coronary' ? 0.55 : pt.solid ? 0.2 : 0.3) : 1;
      m.depthWrite = !see;
      m.side = see ? THREE.FrontSide : THREE.DoubleSide;
      if (m.userData.u) m.userData.u.uCapOn.value = see ? 0 : 1;
      const on = lit(pt.id);
      m.emissive.setHex(on ? 0xffc36b : 0x000000); m.emissiveIntensity = on ? 0.42 : 0;
      m.needsUpdate = true;
    });
    vgroup.visible = live;
    Object.keys(VALVES).forEach((k) => {
      const m = VALVES[k].mesh.material, on = lit('valve_' + k);
      m.emissive.setHex(on ? 0xffb04a : 0x000000); m.emissiveIntensity = on ? 0.5 : 0;
    });
    Object.values(blood).forEach((B) => { B.im.visible = live; });
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
  function updateClip() {
    const d = cutDepth(cutK);
    clipLocal.normal.copy(PN).negate(); clipLocal.constant = d;
    clipWorld.copy(clipLocal).applyMatrix4(heart.matrixWorld);
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
    const sw = sstep(0, 0.28, secs);
    Object.keys(VALVES).forEach((key) => {
      const o = lerp(prev[key] ? 1 : 0, seg.valves[key] ? 1 : 0, sw);
      if (Math.abs(VALVES[key].open - o) > 1e-4) { VALVES[key].open = o; VALVES[key].dirty = true; }
    });
    const ce = sstep(0, 0.7, u);
    setContraction(lerp(seg.atria[0], seg.atria[1], ce), lerp(seg.vent[0], seg.vent[1], ce));
    const env = seg.hold ? sstep(0, 0.06, u) * (1 - sstep(0.62, 0.97, u)) : sstep(0, 0.1, u) * (1 - 0.55 * sstep(0.75, 1, u));
    ['R', 'L'].forEach((s) => { const src = seg.rates[s]; FLOW[s].in = src.in * env; FLOW[s].av = src.av * env; FLOW[s].sl = src.sl * env; FLOW[s].out = src.out * env; });
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
    ['R', 'L'].forEach((s) => { FLOW[s].in = FLOW[s].av = FLOW[s].sl = FLOW[s].out = 0; });
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
    scene.traverse((o) => {
      if (!o.isMesh && !o.isInstancedMesh && !o.isLineSegments) return;
      if (o.isInstancedMesh || o.isLineSegments) { if (o.visible) { swapped.push([o, null, true]); o.visible = false; } return; }
      const pt = parts[o.name] || null; const vv = o.name && o.name.indexOf('pv_') === 0 ? VALVES[o.name.slice(3)] : null;
      const idm = pt ? pt.idMat : vv ? vv.idMat : null;
      if (!idm) return;
      swapped.push([o, o.material, false]); o.material = idm;
    });
    const bg = scene.background, env = scene.environment; scene.background = null; scene.environment = null;
    const oldTarget = renderer.getRenderTarget(), oldClear = renderer.getClearAlpha();
    renderer.setRenderTarget(idRT); renderer.setClearColor(0x000000, 0); renderer.clear();
    if (xray && vgroup.visible) {
      /* see-through walls: the walls first, then the moving valves over them, as you see them */
      vgroup.visible = false; renderer.render(scene, camera); vgroup.visible = true;
      renderer.clearDepth();
      const vis = []; heart.children.forEach((c) => { if (c !== vgroup) { vis.push([c, c.visible]); c.visible = false; } });
      renderer.autoClear = false; renderer.render(scene, camera); renderer.autoClear = true;
      vis.forEach(([c, v]) => { c.visible = v; });
    } else renderer.render(scene, camera);
    renderer.readRenderTargetPixels(idRT, 0, 0, IW, IH, idBuf);
    renderer.setRenderTarget(oldTarget); renderer.setClearColor(0x000000, oldClear);
    scene.background = bg; scene.environment = env;
    swapped.forEach(([o, m, hid]) => { if (hid) o.visible = true; else o.material = m; });
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
  function hideLabels() { over.classList.remove('is-on'); labelsShown = false; clearTimeout(labelTimer); }
  function relabelSoon(ms) { clearTimeout(labelTimer); labelTimer = setTimeout(layoutLabels, ms == null ? 140 : ms); }
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
    const reg = labelWant.map(() => []), loose = labelWant.map(() => []);
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
      if (same(i, m, id)) reg[wi].push(pt); else if (same(i, 1, id)) loose[wi].push(pt);
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
      /* the stage's own furniture keeps its space: the view name and buttons along the top, the hint
         and the colour key along the bottom */
      return { id, nm, hgt, pts: pts.filter((p) => p[1] - hgt / 2 >= 40 && p[1] + hgt / 2 <= h - 44) };
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
    order.forEach((wi) => { const id = labelWant[wi]; if (!tryPlace(prep(id, reg[wi]))) tryPlace(prep(id, loose[wi])); });
    const colL = Math.max(8, minX * sx - 12), colR = Math.min(w - 8, maxX * sx + 12);
    let svg = '';
    placed.forEach((q) => {
      const lab = document.createElement('div');
      lab.className = 'h3__lab h3__lab--' + q.side + (first(q.id) ? ' is-sel' : '');
      lab.innerHTML = '<span class="h3__labn">' + esc(q.nm.name) + '</span>' + (q.nm.sub ? '<span class="h3__labs">' + esc(q.nm.sub) + '</span>' : '');
      lab.style.top = Math.round(q.y) + 'px';
      if (q.side === 'L') lab.style.right = Math.round(w - colL + 6) + 'px'; else lab.style.left = Math.round(colR + 6) + 'px';
      over.appendChild(lab);
      const x2 = q.side === 'L' ? colL : colR;
      const y = Math.round(q.y) + 0.5;
      svg += '<line class="h3__leadhalo" x1="' + q.x.toFixed(1) + '" y1="' + y + '" x2="' + x2.toFixed(1) + '" y2="' + y + '"/>' +
             '<line class="h3__lead" x1="' + q.x.toFixed(1) + '" y1="' + y + '" x2="' + x2.toFixed(1) + '" y2="' + y + '"/>' +
             '<circle class="h3__dot" cx="' + q.x.toFixed(1) + '" cy="' + y + '" r="3"/>';
      lastLayout.push({ id: q.id, x: q.x, y: q.y, side: q.side, x2 });
    });
    lsvg.setAttribute('viewBox', '0 0 ' + w + ' ' + h);
    lsvg.innerHTML = svg;
    /* a label whose box would leave the stage is pulled in and given a solid background */
    Array.prototype.forEach.call(over.querySelectorAll('.h3__lab'), (el) => {
      const r = el.getBoundingClientRect(), hb = host.getBoundingClientRect();
      if (r.left < hb.left + 2) { el.style.right = ''; el.style.left = '4px'; el.classList.add('is-tight'); }
      if (r.right > hb.right - 2) { el.style.left = ''; el.style.right = '4px'; el.classList.add('is-tight'); }
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
  controls.addEventListener('start', () => { moving = true; hideLabels(); if (opts.onInteract) opts.onInteract(); });
  /* any change of camera, however it came about, takes the labels down; they are laid out again once
     the view is still, so a leader is never drawn to where a part used to be */
  controls.addEventListener('change', () => { idStale = true; if (labelsShown) hideLabels(); kick(); });
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
    if (stepAnim(dt)) busy = true;
    const moved = controls.update();
    if (moved) busy = true;
    Object.keys(VALVES).forEach((k) => { if (VALVES[k].dirty && vgroup.visible) buildValve(k); });
    if (vgroup.visible || anim) drawBlood();
    heart.updateMatrixWorld(true); updateClip();
    renderer.render(scene, camera);
    why = (tween ? 'tween ' : '') + (anim && !anim.paused ? 'anim ' : '') + (moved ? 'controls ' : '') + (moving ? 'moving' : '');
    inFrame = false;
    if (busy || moving || pending) raf = requestAnimationFrame(frame);
    else if (!labelsShown && labelWant.length && !tween) relabelSoon(120);
  }
  function renderNow() {
    Object.keys(VALVES).forEach((k) => { if (VALVES[k].dirty) buildValve(k); });
    drawBlood(); heart.updateMatrixWorld(true); updateClip(); controls.update(); renderer.render(scene, camera);
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
      if (m !== 'explore') { seedBlood(); drawBlood(); }
      applyLook(); relabelSoon();
    },
    setCut(k) {
      const was = cutK; cutK = clamp(k, 0, 1); updateClip(); idStale = true; hideLabels();
      if (Object.values(GONE_AT).some((g) => (was >= g) !== (cutK >= g))) applyLook();
      if (was === 0 && cutK > 0 && viewName !== 'section') setView('section');
      kick(); relabelSoon(200);
    },
    cutAt4ch: 0.5,
    setXray(on) { xray = !!on; applyLook(); },
    view(name) { setView(name); },
    select(id) { selected = id; applyLook(); relabelSoon(60); },
    labels: setLabels,
    setValves(vs) { setValvesNow(vs); kick(); },
    play, stop: stopAnim,
    pause() { if (anim) anim.paused = true; },
    resume() { if (anim) { anim.paused = false; kick(); } },
    playing() { return !!(anim && !anim.paused); },
    setSpeed(s) { if (anim) anim.speed = s; },
    reseed() { seedBlood(); drawBlood(); kick(); },
    /* for the headless checks: jump to time t of a plan, deterministically */
    seek(plan, t, o) {
      o = o || {};
      seedBlood(); anim = { plan, t: 0, total: plan.reduce((a, s) => a + s.dur, 0), loop: !!o.loop, speed: 1, segIndex: -1, from: o.from, paused: true };
      const dt = 1 / 60;
      for (let tt = 0; tt < t; tt += dt) { anim.t = tt; applyAt(Math.min(tt, anim.total - 1e-4)); stepBlood(dt); }
      applyAt(Math.min(t, anim.total - 1e-4));
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
      return { frames, why, triangles: r.render.triangles, calls: r.render.calls, geometries: r.memory.geometries, textures: r.memory.textures, pixelRatio: renderer.getPixelRatio(), view: viewName, cut: cutK, mode, labels: lastLayout.slice() };
    },
    layoutNow() { layoutLabels(); return lastLayout.slice(); },
    /* checks only: put the camera anywhere (heart frame), and read a valve ring */
    lookFrom(pos, target) {
      heart.updateMatrixWorld(true);
      const p = new THREE.Vector3(...pos).applyMatrix4(heart.matrixWorld), t = new THREE.Vector3(...target).applyMatrix4(heart.matrixWorld);
      tween = null; controls.enabled = true; controls.minDistance = 0.05; camera.position.copy(p); controls.target.copy(t); controls.update(); idStale = true; renderNow(); kick();
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
      Object.values(parts).forEach((p) => p.idMat.dispose());
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
