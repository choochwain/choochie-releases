// Choochie Heart Clicker: reward media. Level folders (docs/clicker/media/levelN, listed in manifest.json), the player's own
// files (kept in this browser's IndexedDB, never uploaded), built-in defaults from the site's pictures and her voice noises,
// and the pop-up layer that shows them at their own size.
const BASE = "clicker/media/";
const EXT = {
  images: /\.(png|jpe?g|gif|webp|avif|svg)$/i,
  audio: /\.(mp3|ogg|oga|wav|m4a|aac|opus|flac)$/i,
  video: /\.(mp4|webm|ogv|mov|m4v)$/i,
};
export const kindOfName = n => EXT.images.test(n) ? "images" : EXT.audio.test(n) ? "audio" : EXT.video.test(n) ? "video" : null;
const kindOfType = t => /^image\//.test(t) ? "images" : /^audio\//.test(t) ? "audio" : /^video\//.test(t) ? "video" : null;

// built-in defaults: used for a level (per kind) only while it has nothing of its own. They are small copies of the site's
// photos (clicker/def/<name>-<width>.jpg) and, like every other picture, show at their own pixel size.
const S = n => "chat/sfx/" + n + ".mp3", I = (n, w) => ({ src: "clicker/def/" + n.replace(/\.jpg$/, "") + "-" + w + ".jpg" });
const DEF = [
  { img: [I("portrait-cta.jpg", 150)], snd: ["giggle_soft_01", "giggle_soft_02", "giggle_shy_01", "nya_cute_01", "eep_01"], words: ["hehe~", "again?", "boop", "hi cutie", "more~"] },
  { img: [I("portrait-cta.jpg", 190), I("shot-talk.jpg", 170)], snd: ["giggle_teasing_01", "giggle_teasing_02", "ehehe_01", "ehehe_02", "coo_soft_01", "nya_cute_02"], words: ["good pet~", "don't stop", "faster~", "mm, nice", "ehehe"] },
  { img: [I("shot-talk.jpg", 210), I("shot-walk.jpg", 210)], snd: ["kiss_01", "kiss_02", "chuckle_cheeky_01", "giggle_mischievous_01", "squeak_embarrassed_01"], words: ["mwah!", "you're cute", "keep going", "obsessed?", "*blush*"] },
  { img: [I("shot-wardrobe2.jpg", 280), I("shot-walk.jpg", 240)], snd: ["kiss_blown_01", "kiss_blown_02", "giggle_flirty_01", "giggle_flirty_02", "sigh_dreamy_01"], words: ["all mine~", "harder!", "so good", "don't you dare stop", "mwah mwah"] },
  { img: [I("shot-bunny.jpg", 240), I("portrait-smirk.jpg", 260)], snd: ["chuckle_smug_01", "chuckle_smug_02", "hmph_smug_01", "laugh_short_01", "gasp_flustered_01"], words: ["good pet.", "faster, pet", "you're addicted~", "that's it", "Good. More."] },
  { img: [I("portrait-smirk.jpg", 300), I("hero-fangs.jpg", 290)], snd: ["kiss_tease_01", "kiss_tease_02", "laugh_breathy_01", "gasp_flustered_02", "sigh_affectionate_01"], words: ["you're MINE", "never stop", "so devoted~", "I see you", "♥♥♥"] },
  { img: [I("hero-fangs.jpg", 330), I("shot-bunny.jpg", 300), I("tier-devoted.jpg", 460)], snd: ["laugh_triumphant_01", "laugh_breathy_02", "sigh_affectionate_02", "giggle_flirty_01"], words: ["devoted", "worship me~", "perfect pet", "more. now.", "good. good."] },
  { img: [I("hero-fangs.jpg", 360), I("portrait-smirk.jpg", 350), I("tier-obsessed.jpg", 460)], snd: ["laugh_taunting_01", "laugh_taunting_02", "kiss_blown_02", "sigh_dreamy_02"], words: ["OBSESSED", "you belong to me", "my favourite", "forever~", "♥ ♥ ♥ ♥"] },
  { img: [I("hero-fangs.jpg", 400), I("shot-bunny.jpg", 340), I("shot-wardrobe2.jpg", 420)], snd: ["laugh_triumphant_01", "chuckle_breathy_01", "chuckle_breathy_02", "giggle_mischievous_02"], words: ["burn for me~", "hotter.", "you can't stop", "mine mine mine"] },
  { img: [I("portrait-smirk.jpg", 440), I("hero-fangs.jpg", 440), I("tier-obsessed.jpg", 460)], snd: ["laugh_triumphant_01", "laugh_taunting_01", "kiss_tease_02", "chuckle_smug_02"], words: ["kneel~", "good pet. GOOD.", "all yours? no. all MINE.", "♥ forever ♥"] },
];
export const defaultsFor = i => DEF[Math.min(i, DEF.length - 1)];

// ------------------------------------------------------------------------------------------------ level folders
export async function loadManifest() {
  let levels = [];
  try {
    const r = await fetch(BASE + "manifest.json?t=" + Math.floor(Date.now() / 60000), { cache: "no-cache" });
    if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.levels)) levels = j.levels; }
  } catch (e) {}
  // on GitHub Pages also ask GitHub for the folder listing, so files pushed before the manifest was rebuilt still show up
  if (/github\.io$/i.test(location.hostname)) { try { levels = merge(levels, await ghListing()); } catch (e) {} }
  levels = levels.filter(l => l && /^level\d+$/i.test(l.id || "")).sort((a, b) => num(a.id) - num(b.id));
  const out = [];
  for (const l of levels) out[num(l.id) - 1] = { id: l.id, title: String(l.title || "").slice(0, 40), images: list(l.images), audio: list(l.audio), video: list(l.video) };
  return out;
}
const num = id => parseInt(String(id).replace(/\D/g, ""), 10) || 0;
const list = a => (Array.isArray(a) ? a : []).filter(s => typeof s === "string" && !/\.\.|^\/|^[a-z]+:/i.test(s)).map(s => ({ src: BASE + s.split("/").map(encodeURIComponent).join("/"), name: s.split("/").pop() }));
function merge(a, b) {
  const by = new Map(a.map(l => [String(l.id).toLowerCase(), { ...l }]));
  for (const l of b) {
    const m = by.get(l.id) || { id: l.id, title: "", images: [], audio: [], video: [] };
    for (const k of ["images", "audio", "video"]) m[k] = [...new Set([...(m[k] || []), ...l[k]])];
    by.set(l.id, m);
  }
  return [...by.values()];
}
async function ghListing() {
  const KEY = "choochie.clicker.gh";
  try { const c = JSON.parse(sessionStorage.getItem(KEY) || "null"); if (c && Date.now() - c.at < 10 * 60000) return c.levels; } catch (e) {}
  const owner = location.hostname.split(".")[0], repo = location.pathname.split("/").filter(Boolean)[0];
  if (!owner || !repo) return [];
  const api = `https://api.github.com/repos/${owner}/${repo}`;
  const dir = await (await fetch(`${api}/contents/docs/clicker`)).json();
  const media = Array.isArray(dir) && dir.find(d => d.name === "media" && d.type === "dir");
  if (!media) return [];
  const tree = await (await fetch(`${api}/git/trees/${media.sha}?recursive=1`)).json();
  const by = {};
  for (const t of (tree && tree.tree) || []) {
    if (t.type !== "blob") continue;
    const parts = t.path.split("/"); if (parts.length < 2 || !/^level\d+$/i.test(parts[0])) continue;
    if (parts.some(p => p.startsWith(".") || p.startsWith("_"))) continue;
    const k = kindOfName(t.path); if (!k) continue;
    const id = parts[0].toLowerCase(); (by[id] = by[id] || { id, images: [], audio: [], video: [] })[k].push(id + t.path.slice(parts[0].length));
  }
  const levels = Object.values(by);
  try { sessionStorage.setItem(KEY, JSON.stringify({ at: Date.now(), levels })); } catch (e) {}
  return levels;
}

// ------------------------------------------------------------------------------------------------ the player's own files (IndexedDB)
let dbp = null;
function db() {
  if (dbp) return dbp;
  dbp = new Promise((res, rej) => {
    try {
      if (!window.indexedDB) { rej(new Error("no idb")); return; }
      const r = indexedDB.open("choochie-clicker", 1);
      r.onupgradeneeded = () => { r.result.createObjectStore("files", { keyPath: "id" }); };
      r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error);
    } catch (e) { rej(e); }
  });
  dbp.catch(() => {});
  return dbp;
}
const tx = (mode, fn) => db().then(d => new Promise((res, rej) => {
  const t = d.transaction("files", mode), req = fn(t.objectStore("files"));
  t.oncomplete = () => res(req && "result" in req ? req.result : undefined); t.onerror = () => rej(t.error); t.onabort = () => rej(t.error);
}));
export const MAX_FILE = 300 * 1024 * 1024;
export async function addLocalFiles(level, files) {
  const added = [], skipped = [];
  for (const f of files) {
    const kind = kindOfType(f.type || "") || kindOfName(f.name || "");
    if (!kind || f.size > MAX_FILE) { skipped.push(f.name); continue; }
    const rec = { id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8), level, kind, name: String(f.name).slice(0, 120), type: f.type, size: f.size, blob: f, added: Date.now() };
    try { await tx("readwrite", s => s.put(rec)); added.push(rec); } catch (e) { skipped.push(f.name); }
  }
  return { added, skipped };
}
export async function localFiles() { try { return (await tx("readonly", s => s.getAll())) || []; } catch (e) { return []; } }
export async function removeLocal(id) { try { await tx("readwrite", s => s.delete(id)); } catch (e) {} }

// ------------------------------------------------------------------------------------------------ pools per level
const urls = [];
export function buildPools(levels, locals, count, useDefaults) {
  while (urls.length) URL.revokeObjectURL(urls.pop());
  const pools = [];
  for (let i = 0; i < count; i++) {
    const L = levels[i] || { images: [], audio: [], video: [] }, mine = locals.filter(f => f.level === i);
    const own = k => [...L[k], ...mine.filter(f => f.kind === k).map(f => { const u = URL.createObjectURL(f.blob); urls.push(u); return { src: u, name: f.name, local: true }; })];
    const d = defaultsFor(i);
    const p = { images: own("images"), audio: own("audio"), video: own("video"), title: L.title || "", words: [] };
    p.own = p.images.length + p.audio.length + p.video.length;
    if (useDefaults !== false) {
      if (!p.images.length) p.images = d.img.map(x => ({ src: x.src, w: x.w, def: true }));
      if (!p.audio.length) p.audio = d.snd.map(n => ({ src: S(n), def: true }));
      if (!p.own) p.words = d.words;
    }
    p.usable = p.images.length + p.video.length + p.words.length > 0;
    pools.push(p);
  }
  return pools;
}

// ------------------------------------------------------------------------------------------------ sound: the level's clips (one track) + her noises
export function makeAudio(getVol) {
  const track = new Audio(); track.preload = "auto";
  let lastAt = -1e9;
  const playing = () => !track.paused && !track.ended;
  function play(src, force) {
    const vol = getVol(), t = performance.now();
    if (vol <= 0) return false;
    if (!force && (playing() || t - lastAt < 1500)) return false;
    lastAt = t;
    try { track.src = src; track.volume = Math.min(1, vol); const p = track.play(); if (p && p.catch) p.catch(() => {}); } catch (e) { return false; }
    return true;
  }
  return { play, stop() { try { track.pause(); } catch (e) {} }, get playing() { return playing(); } };
}

// ------------------------------------------------------------------------------------------------ the pop-up layer
// opts: { layer, reduced(), mediaVol(), onPop(el, x, y) when one is clicked, onGold(el, x, y) }
// how many show at once: opts.max() (the player's "Max pop-ups" setting, default 20); 2 of them videos at most
export const MAX_POPS_DEFAULT = 20, MAX_POPS_LIMIT = 40, MAX_VIDEOS = 2;
export function makePopups(opts) {
  const layer = opts.layer, live = new Set(), free = [];
  let videos = 0;
  const vw = () => document.documentElement.clientWidth, vh = () => window.innerHeight;
  function take() { const d = free.pop() || document.createElement("button"); d.type = "button"; d.className = "ck-pop"; d.innerHTML = ""; d.removeAttribute("style"); d.removeAttribute("data-nat"); d._fading = false; d._timer = 0; d.tabIndex = -1; return d; }
  function done(d) {
    if (!live.has(d)) return;
    live.delete(d); clearTimeout(d._timer);
    const v = d.querySelector("video"); if (v) { try { v.pause(); v.removeAttribute("src"); v.load(); } catch (e) {} videos--; }
    d.remove(); if (free.length < 24) free.push(d);
  }
  function fade(d, quick) {
    if (!live.has(d) || d._fading) return; d._fading = true; clearTimeout(d._timer);
    d.classList.remove("in"); d.classList.add(quick ? "burst" : "out");
    setTimeout(() => done(d), opts.reduced() ? 30 : quick ? 320 : 900);
  }
  // a timer that pauses while hovered
  function timer(d, sec) {
    d._left = sec * 1000; d._t0 = performance.now();
    const arm = () => { clearTimeout(d._timer); d._t0 = performance.now(); d._timer = setTimeout(() => fade(d), d._left); };
    d.onpointerenter = e => { if (e.pointerType !== "mouse") return; clearTimeout(d._timer); d._left -= performance.now() - d._t0; };
    d.onpointerleave = e => { if (e.pointerType !== "mouse" || d._fading) return; arm(); };
    arm();
  }
  // w, h = the file's own pixel size. Pictures and videos show at exactly that many CSS px (what the browser shows when you open
  // the file at 100%), never stretched up; only when bigger than 85% of the play area are they scaled down to fit it.
  function place(d, w, h, x0, y0) {
    const A = opts.area ? opts.area() : { x: 0, y: 0, w: vw(), h: vh() };
    const k = Math.min(1, (A.w * 0.85) / w, (A.h * 0.85) / h);
    const W = Math.max(24, Math.round(w * k)), Hh = Math.max(24, Math.round(h * k));
    const x = x0 != null ? x0 - W / 2 : A.x + Math.random() * Math.max(0, A.w - W), y = y0 != null ? y0 - Hh / 2 : A.y + Math.random() * Math.max(0, A.h - Hh);
    d.style.left = Math.max(A.x, Math.min(A.x + A.w - W, x)) + "px"; d.style.top = Math.max(A.y, Math.min(A.y + A.h - Hh, y)) + "px";
    d.style.width = W + "px"; d.style.height = Hh + "px";
    d.style.setProperty("--rot", ((Math.random() - 0.5) * (opts.reduced() ? 0 : 12)).toFixed(1) + "deg");
  }
  function show(d) { requestAnimationFrame(() => requestAnimationFrame(() => d.classList.add("in"))); }
  const maxPops = () => Math.max(1, Math.min(MAX_POPS_LIMIT, Math.round(opts.max ? opts.max() : MAX_POPS_DEFAULT)));
  function makeRoom() { while (live.size - fading() >= maxPops()) { const oldest = [...live].find(x => !x._fading && !x.classList.contains("gold")); if (!oldest) break; fade(oldest); } }
  const fading = () => { let n = 0; for (const d of live) if (d._fading) n++; return n; };
  function attach(d, tier, kind) {
    d.dataset.tier = tier + 1; d.dataset.kind = kind;
    d.setAttribute("aria-label", kind === "gold" ? "Golden heart: click it!" : "Pop-up: click it for bonus hearts");
    d.onclick = e => { e.stopPropagation(); if (d._fading) return; const r = d.getBoundingClientRect(); (kind === "gold" ? opts.onGold : opts.onPop)(d, r.left + r.width / 2, r.top + r.height / 2); fade(d, true); };
    layer.appendChild(d); live.add(d);
  }
  // one pop-up from a pool. life = seconds visible. returns the kind shown or null
  function spawn(pool, tier, life) {
    if (!pool || !pool.usable) return null;
    makeRoom();
    const d = take();
    const nVid = pool.video.length, nImg = pool.images.length, nTxt = pool.words.length;
    let pick = Math.random() * (nVid * (videos < MAX_VIDEOS ? 1 : 0) + nImg + nTxt * 0.6);
    if (nVid && videos < MAX_VIDEOS && pick < nVid) {
      const it = pool.video[Math.floor(Math.random() * nVid)];
      const v = document.createElement("video");
      v.playsInline = true; v.preload = "auto"; v.muted = opts.mediaVol() <= 0; v.volume = Math.min(1, Math.max(0, opts.mediaVol()));
      d.appendChild(v); d.classList.add("vid"); videos++;
      v.addEventListener("loadedmetadata", () => { place(d, v.videoWidth || 320, v.videoHeight || 180); d.dataset.nat = v.videoWidth + "x" + v.videoHeight; show(d); }, { once: true });
      v.addEventListener("ended", () => fade(d), { once: true });
      v.addEventListener("error", () => fade(d, true), { once: true });
      v.src = it.src;
      const p = v.play(); if (p && p.catch) p.catch(() => { v.muted = true; v.play().catch(() => {}); });
      d._timer = setTimeout(() => fade(d), 30000);              // videos play to the end, 30 s at most
      attach(d, tier, "video");
      return "video";
    }
    pick -= nVid * (videos < MAX_VIDEOS ? 1 : 0);
    if (pick < nImg) {
      const it = pool.images[Math.floor(Math.random() * nImg)];
      const img = new Image(); img.decoding = "async"; img.alt = ""; img.draggable = false;
      img.onload = () => { if (!live.has(d)) return; place(d, img.naturalWidth || 200, img.naturalHeight || 200); d.dataset.nat = img.naturalWidth + "x" + img.naturalHeight; show(d); timer(d, life); };
      img.onerror = () => fade(d, true);
      if (it.def) d.classList.add("def");
      d.appendChild(img); attach(d, tier, "image"); img.src = it.src;
      return "image";
    }
    const w = pool.words[Math.floor(Math.random() * nTxt)];
    d.classList.add("txt"); const b = document.createElement("b"); b.textContent = w; d.appendChild(b);
    attach(d, tier, "text");
    const r = d.getBoundingClientRect(); place(d, Math.max(60, r.width), Math.max(36, r.height)); d.style.width = d.style.height = "";
    show(d); timer(d, life);
    return "text";
  }
  function gold(life, x, y) {
    const d = take(); d.classList.add("gold"); d.innerHTML = '<span aria-hidden="true">💛</span>';
    attach(d, 0, "gold");
    place(d, 74, 74, x, y);
    d.style.setProperty("--dx", ((Math.random() - 0.5) * 160).toFixed(0) + "px"); d.style.setProperty("--dy", (-40 - Math.random() * 90).toFixed(0) + "px");
    d.style.setProperty("--life", life + "s");
    show(d); d._timer = setTimeout(() => fade(d), life * 1000);
    return d;
  }
  function clear() { for (const d of [...live]) done(d); }
  return { spawn, gold, clear, get count() { return live.size; }, get videos() { return videos; } };
}
