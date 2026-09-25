/* ============================================================
   build.mjs — turns the master content into what the site ships.

     node tools/build.mjs [password]

   Reads   ../circulation-lab-source/stations.master.js   (has the answers)
   Writes  js/data/stations.js    presentation + salted hashes, NO answers
           js/data/glossary.js    the shared definitions
           js/data/photos.js      the pixel size of every picture, and which have a 1400 twin
           js/engine.js, js/marking.js, js/sync.js, js/widgets.js   copied from labs-shared/engine/
           js/signin.js                                           copied from labs-shared/ (one sign-in for the whole site)
           index.html             every ?v= stamped
           sw.js                  the offline worker, from labs-shared/sw.template.js
           ../../labs-shared/labs.json   this lab's station and question counts

   The hashes let the page mark an answer right or wrong without the answer
   existing anywhere in the download. Nothing in the site can say what the
   answer is, because nothing in the site has it.

   Pass --vault to also write js/data/keys.enc.js, an AES-GCM encrypted copy
   of the answers for your own checking. The site never loads it, .gitignore
   keeps it out of the repo, and it is not published.
   ============================================================ */
import { readFileSync, writeFileSync, existsSync, copyFileSync, readdirSync, statSync } from 'node:fs';
import { webcrypto as crypto, createHash } from 'node:crypto';
import { dirname, resolve, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const HERE = dirname(fileURLToPath(import.meta.url));
const REPO = resolve(HERE, '..');
const LAB = 'circulation-lab';
const MASTER = resolve(REPO, '../circulation-lab-source/stations.master.js');
const ITER = 250000;

const password = process.argv[2] && !process.argv[2].startsWith('--') ? process.argv[2] : 'Biology2026';
if (!existsSync(MASTER)) {
  console.error('Cannot find the master content at:\n  ' + MASTER + '\nIt must stay outside the published repo. See README.');
  process.exit(1);
}
const { STATIONS } = await import(pathToFileURL(MASTER).href);

/* ---------- every widget must land on a sentence that exists ----------
   learn.interact places a widget under learn.exam[after]. app.js renders a widget whose `after`
   matches no sentence NOWHERE AT ALL — it is not appended, it simply disappears, with nothing on
   screen or in the console to say so. Delete or add one sentence and every widget below it is
   silently one out, and the last one falls off the end. That happened on 11 Sep 2026: removing a
   duplicated equation sentence moved four widgets under the wrong sentence and made the
   hydrogencarbonate indicator vanish (Plants Lab). Caught here from now on. */
{
  const bad = [];
  for (const st of STATIONS) {
    const n = ((st.learn && st.learn.exam) || []).length;
    for (const w of ((st.learn && st.learn.interact) || [])) {
      if (w.after == null) continue;                 /* null is legal: it goes at the end */
      if (!Number.isInteger(w.after) || w.after < 0 || w.after >= n)
        bad.push(`    ${st.id}: a ${w.type} widget wants sentence ${w.after}, but that station has ${n} (0-${n - 1})`);
    }
  }
  if (bad.length) {
    console.error('\n  WIDGET PLACEMENT FAILED — these widgets would not appear at all:\n' + bad.join('\n') +
                  '\n  Did you add or remove a learn.exam sentence? Every `after` below it shifts.\n');
    process.exit(1);
  }
}

/* ---------- every part you can press on the body is answered, or is meant only to be named ----------
   app.js openGroup: a pressed part lands on the sentence whose `group` names it — in the station being
   read, else in the part's own station (plate.owns, then plate.light) — and the body shows it beside
   that sentence. A part that no sentence explains is named on the body, with its note, where the reader
   is (Daniel, 26 Sep 2026: "not every single button needs to take you somewhere ... is the student going
   to learn more about that?"). So each part has a sentence in its own station, or is on NAMED_ONLY on
   purpose; a group that names no part is a typo. */
{
  const draw = readFileSync(resolve(REPO, 'js/circ-draw.js'), 'utf8');
  const g0 = draw.indexOf('var G = {'), block = draw.slice(g0, draw.indexOf('\n  };', g0));
  const PARTS = [...block.matchAll(/^\s{4}'?([a-z-]+)'?:\s*\{\s*label:/gm)].map(m => m[1]);
  /* vessels beyond the syllabus that the lab names but does not teach, and the one organ it only names */
  const NAMED_ONLY = ['cardiac-vein', 'head', 'coeliac-artery', 'gastric-artery', 'splenic-artery', 'mesenteric-artery', 'head-artery', 'jugular',
                      'head-vein', 'arm-artery', 'arm-vein', 'head-arm-vein', 'leg-artery', 'leg-vein', 'artery', 'vein'];
  const NOT_PRESSABLE = ['arms', 'legs', 'body'];         /* names a station lights by; nothing is drawn to press */
  const OWNER = {};
  for (const st of STATIONS) for (const g of ((st.plate || {}).owns || [])) OWNER[g] = st.id;
  for (const st of STATIONS) for (const g of ((st.plate || {}).light || [])) if (!OWNER[g]) OWNER[g] = st.id;
  const answers = {};                                      /* station -> parts its sentences answer */
  const bad = [];
  for (const st of STATIONS) {
    const a = answers[st.id] = new Set();
    const take = (o, where) => { if (o && typeof o === 'object' && o.group) for (const g of [].concat(o.group)) { a.add(g); if (!PARTS.includes(g)) bad.push(`    ${st.id} ${where}: group "${g}" is no part of the body`); } };
    ((st.learn && st.learn.exam) || []).forEach((b, i) => { take(b, '#' + i); ((b && b.list) || []).forEach((x, k) => take(x, '#' + i + '.' + k)); });
  }
  if (PARTS.length < 40) bad.push(`    found only ${PARTS.length} parts in js/circ-draw.js: has its G block changed shape?`);
  for (const id of PARTS) {
    if (NOT_PRESSABLE.includes(id)) continue;
    const own = OWNER[id], answered = !!(own && answers[own] && answers[own].has(id));
    if (NAMED_ONLY.includes(id) && answered) bad.push(`    ${id}: on NAMED_ONLY, but ${own} has a sentence for it — take it off the list`);
    if (!NAMED_ONLY.includes(id) && !answered) bad.push(`    ${id}: pressing it lands nowhere — give a sentence in ${own || 'its station'} the group "${id}", or put it on NAMED_ONLY`);
  }
  if (bad.length) {
    console.error('\n  BODY PARTS FAILED — where a press on the body takes the student:\n' + bad.join('\n') + '\n');
    process.exit(1);
  }
}

/* ---------- the shared folder ----------
   labs-shared/ is an ancestor of this repo. It holds the glossary every lab prints from, and
   the engine, marking, sync, sign-in and Learn widgets every lab runs. Edit them there; a
   build copies them in. The body, the heart and the vessels on this lab's plate are its own
   (js/circ-draw.js), not shared. */
function findShared(from) {
  let dir = from;
  for (let i = 0; i < 8; i++) {
    const p = resolve(dir, 'labs-shared');
    if (existsSync(resolve(p, 'glossary.master.js'))) return p;
    const up = resolve(dir, '..');
    if (up === dir) break;
    dir = up;
  }
  return null;
}
const SHARED = findShared(REPO);
if (!SHARED) {
  console.error('Cannot find labs-shared/ above:\n  ' + REPO + '\nIt holds the glossary and the engine every lab shares. See README.');
  process.exit(1);
}
for (const [from, to] of [['engine/engine.js', 'js/engine.js'], ['engine/marking.js', 'js/marking.js'], ['engine/syllabus.js', 'js/syllabus.js'],
                          ['engine/sync.js', 'js/sync.js'], ['engine/widgets.js', 'js/widgets.js'], ['signin.js', 'js/signin.js']]) {
  copyFileSync(resolve(SHARED, from), resolve(REPO, to));
}

/* ---------- the shared glossary ---------- */
const { GLOSSARY } = await import(pathToFileURL(resolve(SHARED, 'glossary.master.js')).href);
const { formsOf } = await import(pathToFileURL(resolve(SHARED, 'glossary-forms.mjs')).href);
const DEF = new Map(GLOSSARY.map(e => [e.term.toLowerCase(), e]));
const missing = [], clash = [];
for (const st of STATIONS) {
  st.keywords = (st.keywords || []).map(k => {
    const term = typeof k === 'string' ? k : k.term;
    const e = DEF.get(String(term).toLowerCase());
    if (!e) { missing.push(st.id + ' -> ' + term); return { term, def: '' }; }
    if (typeof k === 'object' && k.def && k.def !== e.def) clash.push(st.id + ' -> ' + term);
    return { term: e.term, def: e.def };
  });
}
if (missing.length || clash.length) {
  if (missing.length) console.error('Terms named by a station but not in the glossary:\n  ' + missing.join('\n  '));
  if (clash.length) console.error('Terms whose station wording differs from the glossary:\n  ' + clash.join('\n  '));
  process.exit(1);
}

/* ---------- helpers shared with the runtime (must stay identical to marking.js) ---------- */
const enc = new TextEncoder();
const hex = b => [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join('');
function norm(s) {
  return String(s ?? '').toLowerCase().trim()
    .replace(/[‘’]/g, "'").replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ').replace(/[.,;:!?]+$/, '').replace(/^(the|a|an)\s+/, '');
}
const SALT = hex(crypto.getRandomValues(new Uint8Array(16)));
async function H(parts) {
  const d = await crypto.subtle.digest('SHA-256', enc.encode(SALT + '|' + parts.join('|')));
  return hex(d).slice(0, 32);
}
/* deterministic shuffle so ordering tasks never ship in the right order */
function scramble(arr, seed) {
  const a = arr.slice();
  let s = 0; for (const ch of seed) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  const rnd = () => ((s = (s * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff);
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a.join('|') === arr.join('|') && a.length > 1 ? scramble(arr, seed + '.') : a;
}

/* ---------- transform ---------- */
const vault = {};
const pub = [];
let nAct = 0;
/* things a question may show that are not its answer: a picture, a table, a drawing */
const SHOW = ['table', 'img', 'imgCap', 'svg', 'credit'];

for (const st of STATIONS) {
  const s = { ...st, activities: [] };
  for (let i = 0; i < (st.activities || []).length; i++) {
    const a = st.activities[i], id = st.id + ':' + i, t = a.type;
    const p = { type: t, prompt: a.prompt };
    for (const k of SHOW) if (a[k] != null) p[k] = a[k];
    const v = {};
    nAct++;

    if (t === 'blank') {
      p.text = a.text;
      p.hints = {}; p.k = {};
      const anyOrder = a.anyOrder || [];
      const groupIx = g => anyOrder.findIndex(grp => grp.indexOf(g) >= 0);
      for (const [g, spec] of Object.entries(a.answers)) {
        p.hints[g] = spec.hint;
        const gi = groupIx(g);
        const label = gi < 0 ? 'g' + g : 'grp' + gi + ':' + g;
        p.k[g] = await Promise.all(spec.accept.map(x => H([id, label, norm(x)])));
      }
      if (anyOrder.length) p.anyOrder = anyOrder;
      v.answers = Object.fromEntries(Object.entries(a.answers).map(([g, sp]) => [g, sp.accept[0]]));

    } else if (t === 'mcq') {
      p.options = a.options;
      p.multi = a.correct.length > 1;
      p.k = await H([id, 'mcq', a.correct.slice().sort((x, y) => x - y).join(',')]);
      v.correct = a.correct; v.why = a.why;

    } else if (t === 'order') {
      p.items = scramble(a.items, id);
      p.k = await H([id, 'order', a.items.join('~')]);
      v.items = a.items;

    } else if (t === 'match') {
      p.left = a.left; p.right = a.right;
      p.leftHead = a.leftHead; p.rightHead = a.rightHead;
      if (a.leftNotes) p.leftNotes = a.leftNotes;
      p.k = await H([id, 'match', a.pairs.map(x => x.join('-')).sort().join(',')]);
      v.pairs = a.pairs;

    } else if (t === 'sort') {
      p.bins = a.bins;
      p.items = scramble(a.items.map(x => x.text), id);
      p.k = await H([id, 'sort', a.items.map(x => norm(x.text) + '=' + x.bin).sort().join(',')]);
      v.items = a.items;

    } else if (t === 'drag') {
      p.tokens = a.tokens; p.distractors = a.distractors || [];
      p.slots = a.slots.map(s2 => ({ label: s2.label }));
      p.k = await H([id, 'drag', a.slots.map((s2, j) => j + '=' + norm(s2.accept)).join(',')]);
      v.slots = a.slots.map(s2 => s2.accept);

    } else if (t === 'grid') {
      p.rows = a.rows.map(r => (typeof r === 'string' ? { label: r } : { label: r.label, note: r.note }));
      p.cols = a.cols;
      p.k = {};
      for (let r = 0; r < a.rows.length; r++) {
        const ticked = (a.ticks[r] || []).slice().sort((x, y) => x - y).join(',');
        p.k[r] = await H([id, 'grid', String(r), ticked]);
      }
      v.ticks = a.ticks;

    } else if (t === 'hotspot') {
      p.regions = a.regions.map(r => ({ id: r.id, x: r.x, y: r.y, r: r.r || 7 }));
      p.need = a.correct.length;
      p.k = await H([id, 'hotspot', a.correct.slice().sort().join(',')]);
      v.correct = a.correct; v.labels = Object.fromEntries(a.regions.map(r => [r.id, r.label || '']));

    } else {
      throw new Error(id + ': unknown activity type ' + t);
    }

    vault[id] = v;
    s.activities.push(p);
  }
  pub.push(s);
}

/* ---------- the answer vault (only with --vault; never loaded by the site) ---------- */
const kSalt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey']);
const key = await crypto.subtle.deriveKey({ name: 'PBKDF2', salt: kSalt, iterations: ITER, hash: 'SHA-256' },
  base, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);
const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(vault)));
const b64 = Buffer.from(new Uint8Array(ct)).toString('base64');

/* the syllabus, both versions, most recent first — the viewer is js/syllabus.js */
{
  const raw = JSON.parse(readFileSync(resolve(SHARED, 'syllabus.json'), 'utf8'));
  const versions = Object.keys(raw).sort().reverse().map(id => ({ id, label: id.replace('-', '–'), topics: raw[id].topics }));
  writeFileSync(resolve(REPO, 'js/data/syllabus.js'), '/* GENERATED by tools/build.mjs from labs-shared/syllabus.json — do not edit. The Cambridge IGCSE Biology 0610 syllabus, as published, every version kept. */\nwindow.SYLLABUS = ' + JSON.stringify({ versions }) + ';\n');
}
writeFileSync(resolve(REPO, 'js/data/glossary.js'),
  '/* GENERATED by tools/build.mjs from labs-shared/glossary.master.js — do not edit.\n' +
  '   The definitions every Biology Lab shares. */\n' +
  'window.GLOSSARY = ' + JSON.stringify(GLOSSARY, null, 1) + ';\n' +
  '/* every form that opens one of those entries: its plural or singular, the verb behind it, an alias */\n' +
  'window.GLOSSARY_FORMS = ' + JSON.stringify(formsOf(GLOSSARY)) + ';\n');

writeFileSync(resolve(REPO, 'js/data/stations.js'),
  '/* GENERATED by tools/build.mjs — do not edit.\n' +
  '   Presentation only. The answers are not in this file: each question carries\n' +
  '   a salted hash, which is enough to mark an answer but not to read it. */\n' +
  'window.ANSWER_SALT = ' + JSON.stringify(SALT) + ';\n' +
  'window.STATIONS = ' + JSON.stringify(pub, null, 1) + ';\n');

if (process.argv.includes('--vault')) {
  writeFileSync(resolve(REPO, 'js/data/keys.enc.js'),
    '/* GENERATED by tools/build.mjs --vault — do not edit, and do not add it to index.html. */\n' +
    'window.ANSWER_VAULT = ' + JSON.stringify({ v: 1, iter: ITER, salt: Buffer.from(kSalt).toString('hex'),
      iv: Buffer.from(iv).toString('hex'), ct: b64 }) + ';\n');
}

/* ---------- the size of every photograph ----------
   A picture with no width and height attributes has no height until it arrives, so the
   pins on it pile up in the corner and the page jumps when it loads. The build measures
   each JPEG and ships the sizes, so the browser reserves the right box from the first paint.
   The whole filename is the key ('x-1400.jpg' present means the 1400 twin exists), and the
   bare base is keyed too, for the widgets. */
function jpegSize(buf) {
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i++; continue; }
    const m = buf[i + 1];
    if (m >= 0xc0 && m <= 0xcf && m !== 0xc4 && m !== 0xc8 && m !== 0xcc)
      return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
    i += 2 + buf.readUInt16BE(i + 2);
  }
  return null;
}
const SIZES = {};
for (const f of readdirSync(resolve(REPO, 'assets/photos'))) {
  if (!/\.jpg$/.test(f)) continue;
  const wh = jpegSize(readFileSync(resolve(REPO, 'assets/photos', f)));
  if (!wh) continue;
  SIZES[f] = wh;
  const m = /^(.+)-900\.jpg$/.exec(f);
  if (m) SIZES[m[1]] = wh;
}
for (const f of readdirSync(resolve(REPO, 'assets/video'))) {
  if (!/\.jpg$/.test(f)) continue;
  const wh = jpegSize(readFileSync(resolve(REPO, 'assets/video', f)));
  if (wh) SIZES['video/' + f] = wh;
}

/* ---------- every picture the content names must exist, in every variant it needs ----------
   <picture> does NOT fall back on a 404: a chosen <source> that is missing is a broken
   image. So every base must have its -900 JPEG and WebP; a -1400 pair is optional but must
   be complete if it is there. And every img, video and svg a station names is checked here,
   rather than turning up blank in a lesson. */
{
  const bases = new Set(), files = new Set(), videos = new Set(), svgs = new Set(), sounds = new Set();
  const walk = (o) => {
    if (!o || typeof o !== 'object') return;
    if (Array.isArray(o)) { o.forEach(walk); return; }
    for (const [k, v] of Object.entries(o)) {
      if (k === 'img' && typeof v === 'string') { if (/\.(jpg|webp|png)$/.test(v)) files.add(v); else bases.add(v); }
      else if (k === 'src' && typeof v === 'string' && o.type === 'video') videos.add(v);
      else if (k === 'audio' && typeof v === 'string') sounds.add(v);
      else if (k === 'svg' && typeof v === 'string') svgs.add(v);
      else walk(v);
    }
  };
  walk(STATIONS);
  const missingF = [];
  for (const b of bases) {
    for (const v of ['-900.jpg', '-900.webp']) if (!existsSync(resolve(REPO, 'assets/photos', b + v))) missingF.push('assets/photos/' + b + v);
    const big = ['-1400.jpg', '-1400.webp'].map(v => existsSync(resolve(REPO, 'assets/photos', b + v)));
    if (big[0] !== big[1]) missingF.push('assets/photos/' + b + ' has one -1400 variant but not the other');
  }
  for (const f of files) if (!existsSync(resolve(REPO, 'assets/photos', f))) missingF.push('assets/photos/' + f);
  for (const v of videos) for (const ext of ['.mp4', '.jpg']) if (!existsSync(resolve(REPO, 'assets/video', v + ext))) missingF.push('assets/video/' + v + ext);
  for (const a of sounds) if (!existsSync(resolve(REPO, 'assets/audio', a + '.mp3'))) missingF.push('assets/audio/' + a + '.mp3');
  if (missingF.length) throw new Error('these pictures are named by the content but missing:\n  ' + missingF.join('\n  '));
  console.log(`  ${bases.size} picture bases, ${files.size} plain files, ${videos.size} videos, ${sounds.size} sounds, ${svgs.size} drawings — all present`);
}
writeFileSync(resolve(REPO, 'js/data/photos.js'),
  '/* GENERATED by tools/build.mjs — the pixel size of every photograph, so a picture\n' +
  '   reserves its box before it loads and the pins on it never pile up. A -1400 key means\n' +
  '   that twin exists. */\n' +
  'window.PHOTO_SIZE = ' + JSON.stringify(SIZES) + ';\n');

/* ---------- the stamp: one value, set here, so a deploy cannot ship new JS behind an old ?v= ---------- */
const idxPath = resolve(REPO, 'index.html');
let idx = readFileSync(idxPath, 'utf8');
const STAMP = String(Math.floor(Date.now() / 1000));
writeFileSync(resolve(REPO, 'version.txt'), STAMP + '\n');
const nStamp = (idx.match(/\.(?:js|css)\?v=\d+/g) || []).length;
if (!nStamp) throw new Error('index.html has no ?v= stamps to bump — cache busting would be silent');
writeFileSync(idxPath, idx.replace(/(\.(?:js|css))\?v=\d+/g, `$1?v=${STAMP}`));

/* ---------- the register ----------
   labs-shared/labs.json is the single register: this lab's counts are written by this build,
   so the hubs' percentages and the Apps Script's totals can never disagree with what is here. */
{
  const regPath = resolve(SHARED, 'labs.json');
  const reg = JSON.parse(readFileSync(regPath, 'utf8'));
  const row = reg.labs.find(l => l.id === LAB);
  if (!row) throw new Error('labs-shared/labs.json has no entry for ' + LAB + ' — add one (id, name, shelf, url, store) before building');
  if (row.stations !== pub.length || row.questions !== nAct) {
    row.stations = pub.length; row.questions = nAct;
    writeFileSync(regPath, JSON.stringify(reg, null, 2).replace(/\{\n\s+"id"/g, '{ "id"') + '\n');
    console.log(`  labs.json             ${LAB} now ${pub.length} stations · ${nAct} questions — rebuild the hubs (node tools/stamp.mjs) so they see it`);
  }
}

/* ---------- the offline worker ---------- */
const SW_TEMPLATE = resolve(SHARED, 'sw.template.js');
if (!process.argv.includes('--no-sw')) {
  const stamped = readFileSync(idxPath, 'utf8');
  const assets = [...stamped.matchAll(/(?:src|href)="([^":]+?\.(?:js|css))\?v=(\d+)"/g)];
  const wrong = assets.filter(m => m[2] !== STAMP);
  if (wrong.length) throw new Error('index.html still carries old stamps: ' + wrong.map(m => m[1] + '?v=' + m[2]).join(', '));
  const PRECACHE = assets.map(m => './' + m[1] + '?v=' + m[2]);
  if (PRECACHE.length < 3) throw new Error('only ' + PRECACHE.length + ' assets found for the worker — the regex has stopped matching');

  /* every picture, keyed by a hash of its own bytes. Video is left out on purpose: it is
     served with Range requests, which the worker never touches. */
  const MEDIA_REV = {};
  let mediaBytes = 0;
  (function walkAssets(dir) {
    for (const f of readdirSync(dir)) {
      const full = join(dir, f);
      if (statSync(full).isDirectory()) { walkAssets(full); continue; }
      if (/\.(mp4|webm|mov|md|json)$/i.test(f)) continue;
      const buf = readFileSync(full);
      MEDIA_REV[relative(resolve(REPO, 'assets'), full).split('\\').join('/')] =
        createHash('sha1').update(buf).digest('hex').slice(0, 8);
      mediaBytes += buf.length;
    }
  })(resolve(REPO, 'assets'));

  const tpl = readFileSync(SW_TEMPLATE, 'utf8')
    .replace('__LAB__', LAB)
    .replace('__VERSION__', STAMP)
    .replace('__PRECACHE__', JSON.stringify(PRECACHE))
    .replace('__MEDIA_REV__', JSON.stringify(MEDIA_REV));
  if (/__[A-Z_]+__/.test(tpl)) throw new Error('sw.template.js has a placeholder this build does not fill: ' + /__[A-Z_]+__/.exec(tpl)[0]);
  writeFileSync(resolve(REPO, 'sw.js'), tpl);
  console.log(`  sw.js                 ${PRECACHE.length} stamped files + ${Object.keys(MEDIA_REV).length} pictures (${(mediaBytes/1024/1024).toFixed(1)} MB), version ${STAMP}`);
} else {
  console.log('  sw.js                 LEFT ALONE (--no-sw)');
}
console.log(`built ${pub.length} stations, ${nAct} activities`);
console.log(`  js/data/stations.js   presentation + hashes (no answers)`);
console.log(`  js/data/glossary.js   ${GLOSSARY.length} shared definitions`);
console.log(`  js/data/photos.js     ${Object.keys(SIZES).length} picture sizes`);
console.log(`  shared engine, marking, sync, sign-in, syllabus and widgets copied in`);
console.log(`  index.html + version.txt  stamped ${STAMP} (${nStamp} assets)`);

/* ---------- the marking gate ---------- */
{
  const gate = resolve(SHARED, 'marking-gate.mjs');
  if (existsSync(gate)) {
    try {
      const out = execFileSync('node', [gate, REPO, MASTER], { encoding: 'utf8' }).trim();
      const wrong = Number((out.match(/wrong:\s*(\d+)/) || [])[1] ?? -1);
      if (wrong !== 0) { console.error('\n  MARKING GATE FAILED — ' + out); process.exit(1); }
      console.log('  marking gate           ' + out.replace(/^.*=>\s*/, ''));
    } catch (e) {
      console.error('\n  MARKING GATE FAILED\n' + (e.stdout || '') + (e.stderr || e.message));
      process.exit(1);
    }
  } else {
    console.error('  marking gate MISSING at ' + gate + ' — cannot prove the answers still mark.');
    process.exit(1);
  }
}
