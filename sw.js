/* ============================================================
   sw.template.js — the offline worker both labs share.

   tools/build.mjs fills in the four placeholders below — the lab's name, this build's
   version, the list of stamped files, and a hash per picture — and writes the result to that
   lab's repo root as sw.js. Its scope is therefore exactly /<lab>/ on Pages:
   the most a worker gets by default, this lab and nothing above it. Never edit sw.js.

   ---------------------------------------------------------------------------
   THE ONE DECISION THAT MATTERS: the HTML document is fetched NETWORK-FIRST.

   A service worker on GitHub Pages is the one change that cannot be undone by pushing a fix,
   because we cannot set response headers. The way that goes wrong is always the same: the
   worker serves a cached index.html forever, and every later deploy is invisible. The usual
   defence is a version banner and a kill switch, and the usual result is that a class sits on
   a stale page for a lesson while someone works out why.

   So this worker never prefers the cache for the document while the network is reachable. It
   asks the network first, with a short timeout, and only falls back to what it holds when
   that fails. Online, a student sees exactly what they see today. Offline, they get the lab.

   Everything else IS cache-first, and safely so, because every other URL is immutable by
   construction: index.html carries a ?v= stamp on every script and stylesheet, and the stamp
   changes whenever the file does, so a cached ?v=1 file can never stand in for ?v=2. Pictures
   are keyed by a hash of their own bytes for the same reason.

   The cost is one 12 KB document fetch per online load. That is the price of making the
   unrecoverable failure impossible, and it is worth paying.
   ---------------------------------------------------------------------------

   Cache names are prefixed with the lab, because both labs — and the hubs, and the other
   sims — share the origin nlcsbiology.com and therefore share one CacheStorage.
   ============================================================ */
const LAB        = 'circulation-lab';
const VERSION    = '1790389882';
const SHELL      = LAB + '-shell-v' + VERSION;
const MEDIA      = LAB + '-media';
const PRECACHE   = ["./css/app.css?v=1790389882","./css/w-journey.css?v=1790389882","./css/w-monitor.css?v=1790389882","./css/w-ecgsim.css?v=1790389882","./css/w-chd.css?v=1790389882","./css/w-defence.css?v=1790389882","./css/w-bodyflow.css?v=1790389882","./css/w-heart3d.css?v=1790389882","./js/config.js?v=1790389882","./js/data/glossary.js?v=1790389882","./js/data/syllabus.js?v=1790389882","./js/data/stations.js?v=1790389882","./js/data/photos.js?v=1790389882","./js/body-art.js?v=1790389882","./js/heart-art.js?v=1790389882","./js/circ-art.js?v=1790389882","./js/circ-flow.js?v=1790389882","./js/circ-mesentery.js?v=1790389882","./js/circ-gut.js?v=1790389882","./js/circ-labelpts.js?v=1790389882","./js/circ-draw.js?v=1790389882","./js/terms.js?v=1790389882","./js/marking.js?v=1790389882","./js/sync.js?v=1790389882","./js/signin.js?v=1790389882","./js/engine.js?v=1790389882","./js/syllabus.js?v=1790389882","./js/widgets.js?v=1790389882","./js/learn.js?v=1790389882","./js/w-common.js?v=1790389882","./js/w-heart.js?v=1790389882","./js/w-task.js?v=1790389882","./js/w-route.js?v=1790389882","./js/w-exercise.js?v=1790389882","./js/w-journey.js?v=1790389882","./js/w-monitor.js?v=1790389882","./js/ecg-cells.js?v=1790389882","./js/w-ecgsim.js?v=1790389882","./js/w-chd.js?v=1790389882","./js/w-defence.js?v=1790389882","./js/w-bodyflow.js?v=1790389882","./js/w-heart3d.js?v=1790389882","./js/engine-ext.js?v=1790389882","./js/plate.js?v=1790389882","./js/app.js?v=1790389882"];      /* every stamped .js and .css, taken from the HTML the build just stamped */
const MEDIA_REV  = {"3d/heart.glb":"eff55b0c","audio/heart-normal.mp3":"3b0ae583","photos/angiogram-blocked-900.jpg":"3c609ef6","photos/angiogram-blocked-900.webp":"3ae9807d","photos/blood-centrifuged-900.jpg":"6ace84ab","photos/blood-centrifuged-900.webp":"77c1fe89","photos/blood-layers-900.jpg":"ae97de90","photos/blood-layers-900.webp":"df3a4037","photos/blood-smear-900.jpg":"ca353f36","photos/blood-smear-900.webp":"5de23367","photos/coronary-cast-900.jpg":"5d1684db","photos/coronary-cast-900.webp":"c9556611","photos/heart-dissected-900.jpg":"a6a8f18c","photos/heart-dissected-900.webp":"dbeb5372","photos/heart-valves-above-900.jpg":"407e0018","photos/heart-valves-above-900.webp":"2cf0f04d","photos/jn-artery-1400.jpg":"1186e2d0","photos/jn-artery-1400.webp":"20b88c1a","photos/jn-artery-900.jpg":"fa806234","photos/jn-artery-900.webp":"ddb60f58","photos/jn-artery-vein-900.jpg":"bf1227b6","photos/jn-artery-vein-900.webp":"f41b6dc4","photos/jn-capillary-tem-1400.jpg":"7af26f53","photos/jn-capillary-tem-1400.webp":"e3f73358","photos/jn-capillary-tem-900.jpg":"e2cfa40f","photos/jn-capillary-tem-900.webp":"f7a46727","photos/jn-skin-capillaries-1400.jpg":"914bc571","photos/jn-skin-capillaries-1400.webp":"07357cee","photos/jn-skin-capillaries-900.jpg":"3be0a266","photos/jn-skin-capillaries-900.webp":"0515daa8","photos/kidney-vessels-900.jpg":"de4c1f04","photos/kidney-vessels-900.webp":"e3eef2eb","photos/laennec-necker-900.jpg":"508c2228","photos/laennec-necker-900.webp":"df3c2353","photos/laennec-stethoscopes-900.jpg":"b6139d91","photos/laennec-stethoscopes-900.webp":"728b8796","photos/liver-vessels-900.jpg":"b6f6f21b","photos/liver-vessels-900.webp":"1f9cee93","photos/pressure-graphs-900.jpg":"5a9569de","photos/pressure-graphs-900.webp":"d7add77c","photos/stethoscope-900.jpg":"7104701c","photos/stethoscope-900.webp":"3024ccb5","photos/vertebrate-hearts-900.jpg":"045122be","photos/vertebrate-hearts-900.webp":"f55885e4","video/phagocyte-real.jpg":"8e2f11fa","video/plasma-function.jpg":"d58230e3","video/rbc-oxygen.jpg":"abceb4e6"};     /* 'photos/x.jpg' -> a short hash of its bytes */
const DOC_TIMEOUT = 3000;

/* ---------- install: take a complete, self-consistent copy ---------- */
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const c = await caches.open(SHELL);
    /* cache:'reload' is not optional. A Request built from a plain string uses the default
       cache mode, so './' would come from the browser's own HTTP cache — which Pages lets it
       hold for ten minutes — while the never-before-seen ?v= urls come from the network. That
       pairs an old document with new files, which is the exact failure this worker exists to
       avoid. */
    const doc = await fetch('./', { cache: 'reload' });
    if (!doc.ok) throw new Error('index responded ' + doc.status);
    await c.put('./', doc.clone());
    await c.addAll(PRECACHE);
    /* And then check what is ACTUALLY in the cache, not what the server said. If the document
       we hold does not name this worker's own version, throw: a failed install simply never
       activates, and the lab goes on behaving exactly as it does without a worker. */
    const held = await (await c.match('./')).text();
    const m = held.match(/stations\.js\?v=(\d+)/);
    if (!m || m[1] !== VERSION) {
      await caches.delete(SHELL);
      throw new Error('cached index is v' + (m && m[1]) + ' but this worker is v' + VERSION);
    }
  })());
});

/* ---------- activate: drop this lab's old shells, and only this lab's ---------- */
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const k of await caches.keys())
      if (k.indexOf(LAB + '-shell-v') === 0 && k !== SHELL) await caches.delete(k);
    /* forget pictures that are no longer in the build */
    const media = await caches.open(MEDIA);
    const want = new Set(Object.keys(MEDIA_REV).map(p => p + '?r=' + MEDIA_REV[p]));
    for (const req of await media.keys()) {
      const u = new URL(req.url);
      const rel = u.pathname.split('/assets/')[1];
      if (rel && !want.has(rel + u.search)) await media.delete(req);
    }
    /* clients.matchAll is scoped to the ORIGIN, not to this worker: both labs live on
       nlcsbiology.com, so an unfiltered broadcast would pop a "newer version" banner in
       the OTHER lab's tab, whose Reload button would then do nothing for ever. */
    const cs = await self.clients.matchAll({ includeUncontrolled: true, type: 'window' });
    for (const c of cs)
      if (c.url.indexOf(self.registration.scope) === 0)
        c.postMessage({ type: 'VERSION', lab: LAB, version: VERSION });
  })());
});

self.addEventListener('message', e => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

/* ---------- fetch ---------- */
function inScope(url) { return url.href.indexOf(self.registration.scope) === 0; }

async function fromNetworkFirst(request) {
  /* the document. Online it is always the live one; offline it is the last one we held. */
  const cache = await caches.open(SHELL);
  try {
    const net = await Promise.race([
      fetch(request, { cache: 'no-store' }),
      new Promise((_, no) => setTimeout(() => no(new Error('slow')), DOC_TIMEOUT))
    ]);
    if (net && net.ok) { cache.put('./', net.clone()); return net; }
    throw new Error('document responded ' + (net && net.status));
  } catch (e) {
    const held = await cache.match('./');
    if (held) return held;
    throw e;
  }
}

async function cacheFirst(request, cacheName) {
  /* Anything unexpected in here — CacheStorage refused in a private window, quota, a bug —
     must end in an ordinary network fetch. A respondWith that rejects does not fall back to
     the network: it fails the request outright, which would be a blank lab. */
  try {
    const cache = await caches.open(cacheName);
    const hit = await cache.match(request);
    if (hit) return hit;
    const net = await fetch(request);
    if (net && net.ok && net.type === 'basic') cache.put(request, net.clone());
    return net;
  } catch (e) {
    return fetch(request);
  }
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  /* A Range request is how Safari on iOS plays and scrubs a video. Answering one from a whole
     cached body breaks playback silently on exactly that browser, so never touch them. */
  if (req.headers.has('range')) return;
  const url = new URL(req.url);
  /* cross-origin — the Google sign-in client, the font stylesheet — is never this worker's
     business. Letting it through untouched is what keeps sign-in working. */
  if (url.origin !== location.origin || !inScope(url)) return;

  if (req.mode === 'navigate') { event.respondWith(fromNetworkFirst(req)); return; }

  const rel = url.pathname.slice(new URL(self.registration.scope).pathname.length);

  /* stamped code: the url changes whenever the file does, so the cache can never be stale */
  if (url.search.indexOf('v=') >= 0 && /\.(js|css)$/.test(url.pathname)) {
    event.respondWith(cacheFirst(req, SHELL)); return;
  }
  /* pictures, video posters, silhouettes: keyed by a hash of their own bytes */
  if (rel.indexOf('assets/') === 0) {
    const key = rel.slice('assets/'.length);
    const rev = MEDIA_REV[key];
    if (rev) {
      const keyed = new Request(url.origin + url.pathname + '?r=' + rev, { mode: 'same-origin' });
      event.respondWith((async () => {
        try {
          const cache = await caches.open(MEDIA);
          const hit = await cache.match(keyed);
          if (hit) return hit;
          const net = await fetch(req);
          /* the put has to be held open by the event: mobile Chrome and iOS Safari stop the
             worker the moment respondWith settles, so a detached put is dropped on exactly
             the devices this is for, while working every time on a Mac. */
          if (net && net.ok && net.type === 'basic') event.waitUntil(cache.put(keyed, net.clone()));
          return net;
        } catch (e) { return fetch(req); }
      })());
      return;
    }
  }
  /* version.txt above all: it is how the page learns a deploy has happened */
  /* everything else goes straight to the network */
});
