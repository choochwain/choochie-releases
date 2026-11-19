// Choochie Heart Clicker: the page. Input, her stage, juice (numbers, hearts, sounds), the panel tabs, the wheel, pop-ups.
import * as G from "./game.js";
import { HELPERS, SKILLS, BRANCHES, WHEEL, ACH, LINES, TIERS, tierAt, tierName, trainName, TOKEN_MAX, TOKEN_CLICKS, TOKEN_SECONDS } from "./data.js";
import * as M from "./media.js";

const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const fmt = G.fmt, pick = a => a[Math.floor(Math.random() * a.length)];

const S = G.load(), rt = G.runtime();
window.ChoochieClicker = { S, rt, G };                 // for checks from the console
const set = S.settings;
const mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : { matches: false };
const calm = () => set.motion === "on" ? true : set.motion === "off" ? false : mq.matches;
const vol = k => (set.muted ? 0 : set.vol * set[k]);
function applyCalm() { document.body.classList.toggle("calm", calm()); }
applyCalm(); if (mq.addEventListener) mq.addEventListener("change", applyCalm);

// ------------------------------------------------------------------------------------------------ sound
let actx = null;
function ac() {
  if (!actx) { const C = window.AudioContext || window.webkitAudioContext; if (!C) return null; try { actx = new C(); } catch (e) { return null; } }
  if (actx.state === "suspended") actx.resume().catch(() => {});
  return actx;
}
function tone(freq, dur, type, gain, slide) {
  const v = vol("sfx"); if (v <= 0) return; const c = ac(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
  o.type = type || "sine"; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime((gain || 0.18) * v, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
}
const sfx = {
  pop: h => tone(520 + h * 520 + Math.random() * 40, 0.08, "sine", 0.16, 1.6),
  crit: () => { tone(880, 0.12, "triangle", 0.2, 1.5); setTimeout(() => tone(1320, 0.14, "triangle", 0.16, 1.4), 50); },
  buy: () => { tone(660, 0.07, "square", 0.06, 1.2); setTimeout(() => tone(990, 0.1, "square", 0.05, 1.1), 60); },
  no: () => tone(180, 0.12, "sawtooth", 0.06, 0.8),
  tick: () => tone(1500, 0.025, "square", 0.05),
  frenzy: () => { for (let i = 0; i < 5; i++) setTimeout(() => tone(400 + i * 160, 0.12, "sawtooth", 0.07, 1.3), i * 55); },
  gold: () => { [0, 4, 7, 12].forEach((n, i) => setTimeout(() => tone(660 * Math.pow(2, n / 12), 0.16, "triangle", 0.12), i * 70)); },
  level: () => { [0, 4, 7, 12, 16].forEach((n, i) => setTimeout(() => tone(520 * Math.pow(2, n / 12), 0.22, "triangle", 0.13), i * 90)); },
  bad: () => { tone(330, 0.25, "sawtooth", 0.06, 0.6); },
};
const levelAudio = M.makeAudio(() => vol("media"));
const voice = new Audio(); let voiceAt = 0;
function herNoise(name, force) {
  const t = performance.now(), v = vol("sfx"); if (v <= 0 || (!force && t - voiceAt < 6000)) return;
  voiceAt = t; try { voice.src = "chat/sfx/" + name + ".mp3"; voice.volume = Math.min(1, v); voice.play().catch(() => {}); } catch (e) {}
}
const CLICK_NOISES = ["giggle_soft_01", "giggle_shy_02", "ehehe_01", "nya_cute_01", "kiss_01", "coo_soft_02", "giggle_teasing_01", "eep_02"];

// ------------------------------------------------------------------------------------------------ her (3D stage, or a 2D heart when that can't load)
let stage = null;
const play = $("#play"), hit = $("#hit");
function flat(why) {
  if (stage) return;
  $("#flat").hidden = false; $("#stage").hidden = true; $("#load").classList.add("done");
  document.body.classList.add("is-flat"); if (why) console.info("clicker: 2D target (" + why + ")");
}
function bootStage() {
  if (set.lite) { flat("lite mode"); return; }
  const to = setTimeout(() => { if (!stage) flat("timeout"); }, 40000);
  addEventListener("stage-ready", () => {
    clearTimeout(to); if (!$("#flat").hidden) return;
    stage = window.ChoochieStage; $("#load").classList.add("done");
    stage.onTouch = () => {};                                      // her lines come from the clicker instead
    try { stage.react("happy", "wave", 3000); } catch (e) {}
  }, { once: true });
  addEventListener("stage-fail", () => { clearTimeout(to); flat("webgl"); }, { once: true });
  import("../js/stage.js?v=6").catch(() => flat("load"));
}
let touchAt = 0;
function herReact(x, y) {
  if (!stage) return;
  const t = performance.now(); if (t - touchAt < 700) return; touchAt = t;
  try { const r = stage.pick(x, y); if (r) stage.touch(r); else if (Math.random() < 0.3) stage.face && stage.face("face_happy", 900); } catch (e) {}
}
const react = (mood, gest, ms) => { if (stage) try { stage.react(mood, gest, ms || 3500); } catch (e) {} };

// her bubble
const bubble = $("#bubble"); let bubAt = 0, bubT = 0;
function say(key, force) {
  if (!set.herLines && !force) return;
  const t = performance.now(); if (!force && t - bubAt < 3500) return; bubAt = t;
  const line = Array.isArray(key) ? pick(key) : pick(LINES[key] || [key]);
  bubble.textContent = line; bubble.classList.add("on");
  clearTimeout(bubT); bubT = setTimeout(() => bubble.classList.remove("on"), 1800 + line.length * 45);
}

// ------------------------------------------------------------------------------------------------ juice: hearts, numbers, squish, shake
const fx = $("#fx"), fctx = fx.getContext("2d"), parts = [];
function sizeFx() { const r = play.getBoundingClientRect(), d = Math.min(2, devicePixelRatio || 1); fx.width = Math.max(1, r.width * d); fx.height = Math.max(1, r.height * d); fctx.setTransform(d, 0, 0, d, 0, 0); }
sizeFx(); addEventListener("resize", sizeFx);
const COLORS = ["#ff5c8a", "#ff4a5c", "#ffc2d4", "#fff3ec", "#e0263a"];
function burst(x, y, n, gold) {
  if (calm()) n = Math.min(n, 2);
  const r = play.getBoundingClientRect(); x -= r.left; y -= r.top;
  for (let i = 0; i < n; i++) {
    if (parts.length > 180) parts.shift();
    const a = Math.random() * Math.PI * 2, sp = calm() ? 20 : 120 + Math.random() * 240;
    parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (calm() ? 10 : 120), life: 0, max: 0.7 + Math.random() * 0.5, s: 6 + Math.random() * 9, c: gold ? "#ffd54a" : pick(COLORS), rot: Math.random() * 6 });
  }
}
function heartPath(c, s) { c.beginPath(); c.moveTo(0, s * 0.3); c.bezierCurveTo(-s, -s * 0.4, -s * 0.45, -s * 1.1, 0, -s * 0.5); c.bezierCurveTo(s * 0.45, -s * 1.1, s, -s * 0.4, 0, s * 0.3); c.fill(); }
function drawParts(dt) {
  const r = play.getBoundingClientRect(); fctx.clearRect(0, 0, r.width, r.height);
  for (let i = parts.length - 1; i >= 0; i--) {
    const p = parts[i]; p.life += dt; if (p.life >= p.max) { parts.splice(i, 1); continue; }
    p.vy += 420 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.985;
    fctx.save(); fctx.globalAlpha = 1 - p.life / p.max; fctx.fillStyle = p.c; fctx.translate(p.x, p.y); fctx.rotate(Math.sin(p.rot + p.life * 4) * 0.4); heartPath(fctx, p.s); fctx.restore();
  }
}
const nums = $("#nums"), numPool = [];
function num(x, y, text, cls) {
  const r = play.getBoundingClientRect();
  let el = numPool.find(e => !e._busy);
  if (!el) { if (numPool.length >= 28) { el = numPool[0]; el.getAnimations().forEach(a => a.cancel()); } else { el = document.createElement("div"); numPool.push(el); nums.appendChild(el); } }
  el._busy = true; el.className = "ck-num" + (cls ? " " + cls : ""); el.textContent = text;
  const dx = (Math.random() - 0.5) * 40, X = x - r.left + dx, Y = y - r.top - 20;
  const k = calm() ? [{ opacity: 1, transform: `translate(${X}px,${Y}px) translate(-50%,-50%)` }, { opacity: 0, transform: `translate(${X}px,${Y}px) translate(-50%,-50%)` }]
    : [{ opacity: 0, transform: `translate(${X}px,${Y + 10}px) translate(-50%,-50%) scale(.6)` }, { opacity: 1, offset: 0.15, transform: `translate(${X}px,${Y - 8}px) translate(-50%,-50%) scale(1.15)` }, { opacity: 0, transform: `translate(${X + dx}px,${Y - 90}px) translate(-50%,-50%) scale(.9)` }];
  const a = el.animate(k, { duration: cls === "mega" ? 1600 : 900, easing: "cubic-bezier(.2,.7,.3,1)" });
  a.onfinish = a.oncancel = () => { el._busy = false; el.style.opacity = 0; };
}
let squishT = 0;
function squish() { if (calm()) return; play.classList.add("squish"); clearTimeout(squishT); squishT = setTimeout(() => play.classList.remove("squish"), 80); }
function shake(px) {
  if (calm()) return;
  document.body.animate([{ transform: "translate(0,0)" }, { transform: `translate(${px}px,${-px}px)` }, { transform: `translate(${-px}px,${px * 0.6}px)` }, { transform: "translate(0,0)" }], { duration: 180 });
}

// ------------------------------------------------------------------------------------------------ clicking
let lastClickXY = null;
function doClick(x, y) {
  ac();
  const res = G.click(S, rt);
  lastClickXY = [x, y];
  num(x, y, (res.crit ? "CRIT! +" : "+") + fmt(res.gain - res.mega), res.crit ? "crit" : "");
  if (res.mega) { num(x, y - 40, "MEGA KISS +" + fmt(res.mega), "mega"); sfx.level(); shake(4); say(["MEGA kiss~ you earned it.", "Mwah. That one counted."], true); }
  burst(x, y, res.crit ? 14 : 6, res.crit);
  squish(); bump();
  if (res.crit) { sfx.crit(); shake(3); } else sfx.pop(rt.heat);
  herReact(x, y);
  if (Math.random() < 0.12) herNoise(pick(CLICK_NOISES));
  if (res.frenzyStarted) onFrenzy();
  if (res.token) toast("🎡 +1 spin token", "", "gold");
  if (res.milestone) milestone();
  else if (Math.random() < 0.025) say(G.frenzyOn(rt) ? "frenzy" : "click");
  if (S.clicks === 1) $("#hint").classList.add("off");
}
hit.addEventListener("pointerdown", e => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  e.preventDefault(); doClick(e.clientX, e.clientY);
});
hit.addEventListener("keydown", e => {
  if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); const r = hit.getBoundingClientRect(); doClick(r.left + r.width / 2, r.top + r.height * 0.45); }
});
hit.addEventListener("click", e => e.preventDefault());
hit.addEventListener("contextmenu", e => e.preventDefault());
let bumpAt = 0; const bank = $(".ck-bank");
function bump() { const t = performance.now(); if (t - bumpAt < 120 || calm()) return; bumpAt = t; bank.classList.remove("bump"); void bank.offsetWidth; bank.classList.add("bump"); }

function onFrenzy() {
  sfx.frenzy(); shake(5); toast("🔥 FRENZY! clicks x" + (G.rank(S, "f_endless") ? 5 : 3), "", "big");
  say("frenzy", true); react("happy", "excited", 4000);
  herNoise(pick(["laugh_triumphant_01", "giggle_flirty_01", "giggle_mischievous_01"]), true);
}
function milestone() {
  for (let i = 0; i < 3; i++) setTimeout(() => spawnPop(null, i === 0), i * 160);
  say("milestone", true); react("flirty", null, 3000);
  toast("💯 " + rt.session + " kisses this visit!", "", "");
}

// ------------------------------------------------------------------------------------------------ pop-ups
let levels = [], locals = [], pools = [];
const area = () => { const r = play.getBoundingClientRect(), top = Math.max(r.top, 52); return { x: r.left + 6, y: top, w: r.width - 12, h: r.bottom - top - 6 }; };
const popups = M.makePopups({
  layer: $("#layer"), reduced: calm, mediaVol: () => vol("media"), area,
  onPop(d, x, y) { const was = G.frenzyOn(rt), g = G.popClicked(S, rt); num(x, y, "+" + fmt(g), "crit"); burst(x, y, 10); sfx.crit(); if (!was && G.frenzyOn(rt)) onFrenzy(); },
  onGold(d, x, y) {
    const r = G.catchGold(S, rt); burst(x, y, 24, true); sfx.gold(); shake(4);
    num(x, y, r.gain ? "+" + fmt(r.gain) : r.name, "mega");
    toast("💛 " + r.name, r.gain ? "+" + fmt(r.gain) + " ♥" : "", "gold"); say("gold", true); react("surprised", "excited");
  },
});
const poolFor = t => { for (let i = Math.min(t, pools.length - 1); i >= 0; i--) if (pools[i] && pools[i].usable) return pools[i]; return null; };
function chooseTier() {
  const opts = []; let tot = 0;
  for (let t = 0; t <= Math.min(S.maxTier, pools.length - 1); t++) { const p = pools[Math.min(t, pools.length - 1)]; if (!p || !p.usable) continue; const w = Math.pow(1.7, t); opts.push([t, w]); tot += w; }
  if (!opts.length) return -1;
  let r = Math.random() * tot; for (const [t, w] of opts) { r -= w; if (r <= 0) return t; }
  return opts[opts.length - 1][0];
}
function spawnPop(tier, forceAudio) {
  if (tier == null) tier = chooseTier(); if (tier < 0) return;
  const pool = poolFor(tier); if (!pool) return;
  const kind = popups.spawn(pool, Math.min(tier, 9), G.popLife(S, rt));
  if (kind && kind !== "video" && pool.audio.length && (forceAudio || Math.random() < 0.35)) levelAudio.play(pick(pool.audio).src, forceAudio);
}
function spawnGold(n) {
  const A = area();
  for (let i = 0; i < (n || 1); i++) popups.gold(9, A.x + 60 + Math.random() * Math.max(10, A.w - 120), A.y + 80 + Math.random() * Math.max(10, A.h - 160));
}
let popProg = 0;
function popTick(dt) {
  const iv = G.popInterval(S, rt);
  if (!isFinite(iv)) return;
  popProg += dt / iv;
  if (popProg >= 1) {
    popProg = Math.min(popProg - 1, 1);
    if (G.goldRoll(S, rt)) spawnGold(1);
    if (set.popups) spawnPop();
  }
}
async function loadMedia() {
  levels = await M.loadManifest();
  locals = await M.localFiles();
  pools = M.buildPools(levels, locals, Math.max(TIERS, levels.length), set.defaults);
  if (tab === "media") render(true);
}

// ------------------------------------------------------------------------------------------------ toasts + modal
const toasts = $("#toasts");
function toast(text, sub, cls) {
  const d = document.createElement("div"); d.className = "ck-toast" + (cls ? " " + cls : "");
  d.innerHTML = esc(text) + (sub ? `<small>${esc(sub)}</small>` : "");
  toasts.appendChild(d); while (toasts.children.length > 4) toasts.firstChild.remove();
  setTimeout(() => { d.classList.add("bye"); setTimeout(() => d.remove(), 450); }, cls === "big" ? 2600 : 2200);
}
const modal = $("#modal"), modalC = $("#modal-c");
let modalCb = null;
function openModal(html, cb) { modalC.innerHTML = html; modal.hidden = false; modalCb = cb || null; const b = modalC.querySelector("button"); if (b) b.focus(); }
function closeModal() { modal.hidden = true; modalCb = null; }
modal.addEventListener("click", e => {
  if (e.target === modal) { closeModal(); return; }
  const b = e.target.closest("[data-m]"); if (!b) return;
  const cb = modalCb; closeModal(); if (cb) cb(b.dataset.m);
});

// ------------------------------------------------------------------------------------------------ the panel
let tab = "shop", sig = "";
const body = $("#body");
document.querySelectorAll(".ck-tabs button").forEach(b => b.addEventListener("click", () => {
  tab = b.dataset.tab; document.querySelectorAll(".ck-tabs button").forEach(x => x.setAttribute("aria-selected", x === b)); body.scrollTop = 0; render(true);
}));
const can = c => S.hearts >= c;
function shopHtml() {
  const n = set.buyN, tc = G.tapCost(S), next = G.clickBaseOf(S.tap + 1) * G.clickMult(S) * G.globalMult(S);
  let h = `<h4>Kisses</h4>
    <button type="button" class="ck-row${can(tc) ? " can" : ""}" data-act="tap"${can(tc) ? "" : " disabled"}><span class="ic">💋</span>
      <span class="nm"><b>Softer Lips · Lv ${S.tap}</b><small>each kiss ${fmt(G.clickPower(S))} → ${fmt(next + G.cpsBase(S) * 0.01 * G.rank(S, "k_lipstick"))} ♥ · x2 every 10 levels</small></span><span class="pr">${fmt(tc)} ♥</span></button>`;
  const trains = [];
  HELPERS.forEach((x, i) => { const t = G.trainInfo(S, i); if (t && t.ready) trains.push([i, t]); });
  trains.sort((a, b) => a[1].cost - b[1].cost);
  if (trains.length) {
    h += `<h4>Training <small>doubles a helper</small></h4>`;
    for (const [i, t] of trains.slice(0, 4)) h += `<button type="button" class="ck-row${can(t.cost) ? " can" : ""}" data-act="train" data-i="${i}"${can(t.cost) ? "" : " disabled"}><span class="ic">🎓</span><span class="nm"><b>${trainName(t.u)} ${esc(HELPERS[i].name)}s</b><small>${esc(HELPERS[i].name)}s make x2 (level ${t.u + 1})</small></span><span class="pr">${fmt(t.cost)} ♥</span></button>`;
    if (trains.length > 4) h += `<p class="fine">+${trains.length - 4} more training${trains.length - 4 > 1 ? "s" : ""} ready.</p>`;
  }
  h += `<h4>Helpers <small>they click for you</small><span class="ck-seg" role="group" aria-label="Buy amount">${[[1, "x1"], [10, "x10"], [0, "max"]].map(([v, l]) => `<button type="button" data-act="buyn" data-n="${v}" class="${n === v ? "on" : ""}">${l}</button>`).join("")}</span></h4>`;
  const fac = G.helperFactor(S) ; let hidden = false;
  HELPERS.forEach((x, i) => {
    if (!G.helperVisible(S, i)) { if (!hidden) { hidden = true; h += `<div class="ck-row unk" aria-hidden="true"><span class="ic">${x.icon}</span><span class="nm"><b>???</b><small>earn ${fmt(x.cost * 0.5)} ♥ this run to see it</small></span><span class="pr">${fmt(x.cost)} ♥</span></div>`; } return; }
    const k = n === 0 ? Math.max(1, G.maxAffordable(S, i)) : n, c = G.helperPrice(S, i, k), ok = can(c);
    const each = x.cps * Math.pow(2, S.train[i]) * fac;
    h += `<button type="button" class="ck-row${ok ? " can" : ""}" data-act="buy" data-i="${i}"${ok ? "" : " disabled"}><span class="ic">${x.icon}</span>
      <span class="nm"><b>${esc(x.name)}${k > 1 ? ` <small style="display:inline;color:var(--rose-soft)">x${k}</small>` : ""}</b><small>${esc(x.desc)} · ${fmt(each)} ♥/s each</small></span>
      <span class="pr"><em>${S.owned[i]}</em>${fmt(c)} ♥</span></button>`;
  });
  return h;
}
function shopSig() {
  return [tab, set.buyN, S.tap, can(G.tapCost(S)), S.owned.join(), S.train.join(), HELPERS.map((x, i) => G.helperVisible(S, i) && can(G.helperPrice(S, i, set.buyN === 0 ? Math.max(1, G.maxAffordable(S, i)) : set.buyN)) ? 1 : 0).join(""),
    set.buyN === 0 ? HELPERS.map((x, i) => G.maxAffordable(S, i)).join() : "", HELPERS.map((x, i) => { const t = G.trainInfo(S, i); return t && t.ready ? (can(t.cost) ? 2 : 1) : 0; }).join(""), Object.keys(S.skills).length, S.achievements.length, S.devotion].join("|");
}

let selSkill = null;
function skillsHtml() {
  const free = G.skillFree(S), tot = G.skillPoints(S);
  let h = `<div class="ck-sp"><div><b>${free}</b> <span>SP free</span><small>${tot} total · next SP at ${fmt(G.nextSpAt(S))} all-time ♥ · +1 per 4 badges · +2 per rebirth</small></div>
    <button type="button" class="ck-mini" data-act="respec"${G.skillSpent(S) ? "" : " disabled"}>Respec (free)</button></div><div class="ck-tree">`;
  for (const br in BRANCHES) {
    const [nm, col] = BRANCHES[br];
    h += `<div class="ck-br" style="--c:${col}"><h5>${nm}</h5>`;
    for (const k of SKILLS.filter(x => x.br === br)) {
      const r = G.rank(S, k.id), ok = G.canRank(S, k.id);
      const inf = k.ranks === Infinity;
      h += `<button type="button" class="ck-node${r ? " has" : ""}${ok ? " can" : ""}${selSkill === k.id ? " sel" : ""}" data-act="skill" data-id="${k.id}" aria-label="${esc(k.name)}: ${esc(k.desc)}. Rank ${r}${inf ? ", no limit" : " of " + k.ranks}, next rank ${G.rankCost(k, r)} SP"><span class="i">${k.icon}</span><b>${esc(k.name)}</b><span class="pips">${inf ? `<em class="lv">Lv ${r} · ∞</em>` : Array.from({ length: k.ranks }, (_, j) => `<i class="${j < r ? "on" : ""}"></i>`).join("")}</span></button>`;
    }
    h += `</div>`;
  }
  h += `</div>`;
  const k = SKILLS.find(x => x.id === selSkill);
  if (k) {
    const r = G.rank(S, k.id), req = k.req && SKILLS.find(x => x.id === k.req);
    const inf = k.ranks === Infinity, rc = G.rankCost(k, r);
    h += `<div class="ck-detail"><b>${k.icon} ${esc(k.name)}</b> <small class="fine">rank ${r}${inf ? " (no limit)" : "/" + k.ranks} · next rank ${rc} SP</small><p>${esc(k.desc)}${req && !G.rank(S, req.id) ? `<br><em>Needs ${esc(req.name)} first.</em>` : ""}</p>
      <button type="button" class="btn btn-primary btn-sm" data-act="learn" data-id="${k.id}"${G.canRank(S, k.id) ? "" : " disabled"}>${r >= k.ranks ? "Maxed" : `Learn (${rc} SP)`}</button></div>`;
  } else h += `<div class="ck-detail"><p>Tap a skill to see what it does. Skills stay through rebirth, and respec is free, so try things.</p></div>`;
  const gain = G.devotionGain(S);
  h += `<div class="ck-rb"><b>🌸 Rebirth</b> <small class="fine">Devotion ${S.devotion} · +3% everything each</small>
    <p>Start over with more Devotion: hearts, helpers, training and Softer Lips reset; skills, Devotion, badges, levels and spin tokens stay. Needs 1B ♥ this run.</p>
    <button type="button" class="btn btn-ghost btn-sm" data-act="rebirth"${G.canRebirth(S) ? "" : " disabled"}>${G.canRebirth(S) ? `Rebirth for +${fmt(gain)} Devotion` : S.runEarned < 1e9 ? `${fmt(S.runEarned)} / 1B ♥ this run` : "Earn more for your next Devotion"}</button></div>`;
  return h;
}
function skillsSig() { return [tab, selSkill, JSON.stringify(S.skills), G.skillFree(S), S.devotion, G.canRebirth(S), G.devotionGain(S), Math.floor(Math.log10(S.runEarned + 1))].join("|"); }

// ------------------------------------------------------------------------------------------------ the wheel
let spin = null, wres = null, wAngle = 0;
function wheelHtml() {
  const tl = G.spinPrice(S, rt), per = TOKEN_SECONDS / (G.rank(S, "l_wheelcharm") ? 2 : 1);
  return `<h4>Risky Wheel <small>half rewards, half penalties</small></h4>
    <div class="ck-wheel"><i class="ptr" aria-hidden="true"></i><canvas id="wheel" width="640" height="640" aria-label="The risky wheel"></canvas><span class="hub" aria-hidden="true">💗</span></div>
    <div class="ck-wres ${wres ? (wres.good ? "good" : "bad") : ""}" id="wres" aria-live="polite">${wres ? `${wres.icon} ${esc(wres.name)}<small>${esc(wres.text)}</small>` : `<small>Spin for a reward... or a penalty. Feeling lucky?</small>`}</div>
    <div class="ck-wbtns">
      <button type="button" class="btn btn-primary btn-sm" data-act="spin"${S.tokens >= 1 && !spin ? "" : " disabled"}>Spin (🎡 ${S.tokens}/${TOKEN_MAX})</button>
      <button type="button" class="btn btn-ghost btn-sm" data-act="buyspin"${can(tl) && !spin ? "" : " disabled"}>Buy a spin · ${fmt(tl)} ♥</button>
    </div>
    <p class="fine" style="text-align:center">+1 token every ${TOKEN_CLICKS} clicks (${TOKEN_CLICKS - S.tokenClicks} to go) and every ${Math.round(per / 60)} min here (${G.fmtTime(per - S.tokenTime)}). Max ${TOKEN_MAX}.</p>
    <div class="ck-legend">${WHEEL.map(w => `<span class="${w.good ? "g" : "b"}">${w.icon} <b>${esc(w.name)}</b> ${esc(w.desc)}</span>`).join("")}</div>`;
}
function wheelSig() { return [tab, S.tokens, !!spin, can(G.spinPrice(S, rt)), wres && wres.text, S.tokenClicks, Math.floor(S.tokenTime / 30)].join("|"); }
function drawWheel() {
  const cv = document.getElementById("wheel"); if (!cv) return;
  const c = cv.getContext("2d"), R = 320, seg = Math.PI * 2 / WHEEL.length;
  c.clearRect(0, 0, 640, 640); c.save(); c.translate(R, R); c.rotate(wAngle);
  WHEEL.forEach((w, i) => {
    const a0 = i * seg - Math.PI / 2 - seg / 2, a1 = a0 + seg;
    const g = c.createRadialGradient(0, 0, 40, 0, 0, R);
    if (w.good) { g.addColorStop(0, "#ff8aa8"); g.addColorStop(1, i % 4 === 0 ? "#e0263a" : "#ff5c8a"); } else { g.addColorStop(0, "#3a2a36"); g.addColorStop(1, i % 4 === 1 ? "#1c1220" : "#2a1b2c"); }
    c.beginPath(); c.moveTo(0, 0); c.arc(0, 0, R - 8, a0, a1); c.closePath(); c.fillStyle = g; c.fill();
    c.strokeStyle = "rgba(255,243,236,.35)"; c.lineWidth = 3; c.stroke();
    c.save(); c.rotate(a0 + seg / 2); c.textAlign = "right"; c.textBaseline = "middle";
    c.font = "44px system-ui, 'Segoe UI Emoji', sans-serif"; c.fillText(w.icon, R - 30, 0);
    c.font = "800 22px Nunito, system-ui, sans-serif"; c.fillStyle = w.good ? "#fff3ec" : "#cfd8ff"; c.fillText(w.name, R - 92, 0);
    c.restore();
  });
  c.beginPath(); c.arc(0, 0, R - 6, 0, Math.PI * 2); c.lineWidth = 10; c.strokeStyle = "#fff3ec"; c.stroke();
  for (let i = 0; i < WHEEL.length; i++) { const a = i * seg - Math.PI / 2 - seg / 2; c.beginPath(); c.arc(Math.cos(a) * (R - 6), Math.sin(a) * (R - 6), 7, 0, Math.PI * 2); c.fillStyle = "#ffd54a"; c.fill(); }
  c.restore();
}
function doSpin(buy) {
  if (spin) return;
  const r = G.startSpin(S, rt, buy); if (!r) { sfx.no(); return; }
  ac();
  const seg = Math.PI * 2 / WHEEL.length, dur = calm() ? 1200 : 4500;
  // slice i sits under the pointer when the angle is -i*seg (mod 2pi); spin forward 5+ turns, land inside the slice
  const base = wAngle - (wAngle % (Math.PI * 2)), jitter = (Math.random() - 0.5) * seg * 0.7;
  const to = base + Math.PI * 2 * (calm() ? 2 : 6) + (Math.PI * 2 - r.index * seg) + jitter;
  spin = { from: wAngle, to, t0: performance.now(), dur, r, lastSeg: Math.floor(wAngle / seg) };
  wres = null; render(true);
  setTimeout(() => finishSpin(), dur + 30);
}
function stepSpin() {
  if (!spin) return;
  const p = Math.min(1, (performance.now() - spin.t0) / spin.dur), e = 1 - Math.pow(1 - p, 3.2);
  wAngle = spin.from + (spin.to - spin.from) * e;
  const seg = Math.PI * 2 / WHEEL.length, k = Math.floor((wAngle + seg / 2) / seg);
  if (k !== spin.lastSeg) { spin.lastSeg = k; sfx.tick(); }
  drawWheel();
}
function finishSpin() {
  if (!spin) return;
  const sl = spin.r.slice; wAngle = spin.to % (Math.PI * 2); spin = null; drawWheel();
  const text = G.applySpin(S, rt, sl, { spawnGold, peek: n => { const t = S.maxTier + 1, p = poolFor(t); if (!p) return false; for (let i = 0; i < n; i++) setTimeout(() => spawnPop(t, i === 0), i * 200); return true; } });
  wres = { good: sl.good, icon: sl.icon, name: sl.name, text };
  if (sl.good) { sfx.gold(); toast(sl.icon + " " + sl.name, text, "gold"); say("good", true); react("pouty", "pout"); herNoise(pick(["hmph_01", "tch_01", "whine_pouting_01"]), true); burst(innerWidth / 2, innerHeight / 2, 16, true); }
  else { sfx.bad(); toast(sl.icon + " " + sl.name, text, "bad"); say("bad", true); react("smug", "laugh"); herNoise(pick(["laugh_taunting_01", "laugh_taunting_02", "chuckle_smug_01"]), true); shake(3); }
  render(true); save();
}

// ------------------------------------------------------------------------------------------------ badges, media, more
function achHtml() {
  const got = S.achievements.length;
  const st = [["Hearts (all-time)", fmt(S.allTimeEarned)], ["This run", fmt(S.runEarned)], ["Clicks", fmt(S.clicks)], ["Best click speed", S.bestRate.toFixed(1) + " /s"], ["Frenzies", fmt(S.frenzies)], ["Golden hearts", fmt(S.goldens)], ["Pop-ups clicked", fmt(S.popClicks)], ["Crits", fmt(S.crits)], ["Wheel spins", fmt(S.spins) + ` (${S.rewards} good, ${S.penalties} bad)`], ["Rebirths", fmt(S.rebirths)], ["Level", (S.maxTier + 1) + " · " + tierName(S.maxTier)]];
  return `<h4>Badges <small>${got} / ${ACH.length} · each +1% everything · every 4 = +1 SP</small></h4>
    <div class="ck-ach">${ACH.map(a => { const on = S.achievements.includes(a.id); return `<div class="ck-a${on ? " got" : ""}" title="${esc(a.desc)}"><span>${on ? "🏅" : "🔒"}</span><b>${esc(a.name)}</b>${esc(a.desc)}</div>`; }).join("")}</div>
    <h4>Stats</h4><dl class="ck-stats">${st.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join("")}</dl>`;
}
function achSig() { return [tab, S.achievements.length, Math.floor(S.clicks / 25), Math.floor(Math.log10(S.allTimeEarned + 1) * 4), S.spins, S.goldens].join("|"); }
function mediaHtml() {
  const n = Math.max(TIERS, pools.length);
  let h = `<h4>Pop-up levels</h4><p class="fine">Each level has its own pictures, sounds and videos. Higher levels unlock with all-time hearts and show up more often once you reach them. Add your own files to any level: they stay in this browser only and are never uploaded. Pictures and videos show at their own size.</p>`;
  for (let i = 0; i < n; i++) {
    const p = pools[i] || { images: [], audio: [], video: [] }, L = levels[i] || { images: [], audio: [], video: [] }, mine = locals.filter(f => f.level === i);
    const open = i <= S.maxTier, site = L.images.length + L.audio.length + L.video.length;
    const cnt = k => mine.filter(f => f.kind === k).length;
    h += `<div class="ck-lv${open ? "" : " locked"}" data-drop="${i}">
      <div class="ck-lv-h"><b>${open ? "" : "🔒 "}Level ${i + 1} · ${esc(p.title || tierName(i))}</b><small>${open ? "unlocked" : "at " + fmt(tierAt(i)) + " ♥"}</small></div>
      <div class="ck-lv-c">${site ? `${L.images.length} pictures, ${L.audio.length} sounds, ${L.video.length} videos` : "built-in pictures and her voice"}${mine.length ? ` · yours: ${cnt("images")} pictures, ${cnt("audio")} sounds, ${cnt("video")} videos` : ""}</div>
      <div class="ck-lv-b"><button type="button" class="ck-mini" data-act="add" data-l="${i}">+ Add your files</button>${open ? `<button type="button" class="ck-mini" data-act="preview" data-l="${i}">Show one</button>` : ""}<span class="fine" style="margin:0;align-self:center">or drop them here</span></div>
      ${mine.length ? `<div class="ck-lv-f">${mine.map(f => `<span class="ck-chip"><span title="${esc(f.name)}">${f.kind === "images" ? "🖼️" : f.kind === "audio" ? "🎵" : "🎬"} ${esc(f.name)}</span><button type="button" data-act="rm" data-id="${f.id}" aria-label="Remove ${esc(f.name)}">✕</button></span>`).join("")}</div>` : ""}
    </div>`;
  }
  h += `<p class="fine">Past level ${n}, levels keep coming (each needs 30x more hearts) and use level ${n}'s media.</p><input type="file" id="pick" multiple accept="image/*,audio/*,video/*" hidden>`;
  return h;
}
function moreHtml() {
  const r = (k, l) => `<label>${l}<input type="range" min="0" max="1" step="0.05" value="${set[k]}" data-set="${k}"></label>`;
  const c = (k, l) => `<label>${l}<input type="checkbox" data-set="${k}"${set[k] ? " checked" : ""}></label>`;
  return `<h4>Sound</h4><div class="ck-set">${r("vol", "Volume")}${r("media", "Pop-up sounds and videos")}${r("sfx", "Clicks and her voice")}${c("muted", "Mute everything")}</div>
    <h4>Show</h4><div class="ck-set">${c("popups", "Pop-ups")}${c("defaults", "Built-in pictures when a level is empty")}${c("herLines", "Her speech bubbles")}
      <label>Less motion<select data-set="motion"><option value="auto"${set.motion === "auto" ? " selected" : ""}>like my system</option><option value="on"${set.motion === "on" ? " selected" : ""}>on</option><option value="off"${set.motion === "off" ? " selected" : ""}>off</option></select></label>
      ${c("lite", "Lite mode (2D heart instead of her 3D model; reloads)")}</div>
    <h4>Your save</h4><p class="fine">Saved in this browser automatically. Copy it to move it to another browser. The clicker's hearts are only for this game: they never turn into kisses or energy.</p>
    <div class="ck-btns"><button type="button" class="ck-mini" data-act="export">Copy save</button><button type="button" class="ck-mini" data-act="import">Load a save</button><button type="button" class="ck-mini" data-act="reset">Start over</button></div>
    <h4>How to play</h4><p class="fine">Click her for hearts. Click fast to build heat: full heat starts a FRENZY (clicks x3). Pop-ups come faster the faster you click; click them for bonus hearts. Catch golden hearts. Helpers earn while you're away. Spin the Risky Wheel if you dare. Esc or ✕ takes you back to her chat; your progress is kept.</p>
    <div class="ck-btns" style="margin-top:10px"><a class="btn btn-ghost btn-sm" href="chat.html">Back to her chat</a><a class="btn btn-ghost btn-sm" href="index.html">Home</a></div>`;
}

function render(force) {
  let s;
  if (tab === "shop") s = shopSig(); else if (tab === "skills") s = skillsSig(); else if (tab === "wheel") s = wheelSig(); else if (tab === "ach") s = achSig(); else s = tab + (force ? Math.random() : "");
  if (!force && s === sig) return;
  if ((tab === "media" || tab === "more") && !force) return;
  sig = s;
  body.innerHTML = tab === "shop" ? shopHtml() : tab === "skills" ? skillsHtml() : tab === "wheel" ? wheelHtml() : tab === "ach" ? achHtml() : tab === "media" ? mediaHtml() : moreHtml();
  if (tab === "wheel") drawWheel();
}
body.addEventListener("click", async e => {
  const b = e.target.closest("[data-act]"); if (!b || b.disabled) return;
  const a = b.dataset.act, i = +b.dataset.i;
  if (a === "tap") { if (G.buyTap(S)) { sfx.buy(); flashBuy(b); } else sfx.no(); }
  else if (a === "buy") { const n = set.buyN === 0 ? "max" : set.buyN; if (G.buyHelper(S, i, n)) { sfx.buy(); flashBuy(b); if (Math.random() < 0.3) say(["Ooh, a new helper~", "More help? Lazy~", "They click for me now? Cute."]); } else sfx.no(); }
  else if (a === "train") { if (G.train(S, i)) { sfx.level(); flashBuy(b); } else sfx.no(); }
  else if (a === "buyn") { set.buyN = +b.dataset.n; }
  else if (a === "skill") { selSkill = b.dataset.id; }
  else if (a === "learn") { if (G.rankUp(S, b.dataset.id)) { sfx.level(); const r = b.getBoundingClientRect(); burst(r.left + r.width / 2, r.top, 10); } else sfx.no(); }
  else if (a === "respec") { G.respec(S); sfx.buy(); toast("Skill points refunded"); }
  else if (a === "rebirth") {
    openModal(`<h3>🌸 Rebirth?</h3><p>You get <b>+${fmt(G.devotionGain(S))} Devotion</b> (+3% everything each, forever) and +2 SP. Hearts, helpers, training and Softer Lips start over.</p><div class="ck-btns"><button type="button" class="btn btn-primary btn-sm" data-m="yes">Rebirth</button><button type="button" class="btn btn-ghost btn-sm" data-m="no">Not yet</button></div>`,
      m => { if (m !== "yes") return; const g = G.rebirth(S, rt); if (g) { sfx.level(); toast("🌸 Reborn: +" + fmt(g) + " Devotion", "", "big"); say("rebirth", true); react("flirty", "heart"); save(); render(true); } });
  }
  else if (a === "spin") doSpin(false);
  else if (a === "buyspin") doSpin(true);
  else if (a === "add") { pickLevel = +b.dataset.l; const p = document.getElementById("pick"); if (p) p.click(); return; }
  else if (a === "preview") { spawnPop(+b.dataset.l, true); return; }
  else if (a === "rm") { await M.removeLocal(b.dataset.id); await reloadLocals(); return; }
  else if (a === "export") { const str = G.exportSave(S); try { await navigator.clipboard.writeText(str); toast("Save copied"); } catch (err) { openModal(`<h3>Your save</h3><div class="ck-set"><textarea readonly>${esc(str)}</textarea></div><div class="ck-btns" style="margin-top:10px"><button type="button" class="btn btn-ghost btn-sm" data-m="ok">Done</button></div>`); } return; }
  else if (a === "import") {
    openModal(`<h3>Load a save</h3><p>Paste a save you copied. It replaces this one.</p><div class="ck-set"><textarea id="imp"></textarea></div><div class="ck-btns" style="margin-top:10px"><button type="button" class="btn btn-primary btn-sm" data-m="load">Load</button><button type="button" class="btn btn-ghost btn-sm" data-m="no">Cancel</button></div>`);
    const ta = document.getElementById("imp"), cbv = () => ta.value;
    modalCb = m => { if (m !== "load") return; try { const n = G.importSave(cbv()); Object.keys(S).forEach(k => delete S[k]); Object.assign(S, n); save(); location.reload(); } catch (err) { toast("That save didn't work", "", "bad"); } };
    return;
  }
  else if (a === "reset") {
    openModal(`<h3>Start over?</h3><p>Everything goes: hearts, helpers, skills, Devotion and badges. Your own media files stay.</p><div class="ck-btns"><button type="button" class="btn btn-primary btn-sm" data-m="yes">Yes, wipe it</button><button type="button" class="btn btn-ghost btn-sm" data-m="no">Keep playing</button></div>`,
      m => { if (m !== "yes") return; wiping = true; try { localStorage.removeItem(G.SAVE_KEY); } catch (err) {} location.reload(); });
    return;
  }
  render(true);
});
function flashBuy(b) { const r = b.getBoundingClientRect(); if (!calm()) b.animate([{ transform: "scale(.97)" }, { transform: "scale(1)" }], { duration: 160 }); burst(r.left + 22, r.top + r.height / 2, 5); }
body.addEventListener("input", e => {
  const el = e.target.closest("[data-set]"); if (!el) return;
  const k = el.dataset.set;
  set[k] = el.type === "checkbox" ? el.checked : el.type === "range" ? +el.value : el.value;
  if (k === "motion") applyCalm();
  if (k === "muted") muteBtn();
  if (k === "defaults") pools = M.buildPools(levels, locals, Math.max(TIERS, levels.length), set.defaults);
  if (k === "lite") { save(); location.reload(); }
  save();
});
// own files: picker + drag and drop onto a level
let pickLevel = 0;
body.addEventListener("change", async e => { if (e.target.id !== "pick") return; await addFiles(pickLevel, [...e.target.files]); e.target.value = ""; });
body.addEventListener("dragover", e => { const z = e.target.closest("[data-drop]"); if (!z) return; e.preventDefault(); z.classList.add("drag"); });
body.addEventListener("dragleave", e => { const z = e.target.closest("[data-drop]"); if (z) z.classList.remove("drag"); });
body.addEventListener("drop", async e => { const z = e.target.closest("[data-drop]"); if (!z) return; e.preventDefault(); z.classList.remove("drag"); await addFiles(+z.dataset.drop, [...(e.dataTransfer.files || [])]); });
async function addFiles(level, files) {
  if (!files.length) return;
  const r = await M.addLocalFiles(level, files);
  if (r.added.length) toast(`Added ${r.added.length} file${r.added.length > 1 ? "s" : ""} to level ${level + 1}`, "kept in this browser only");
  if (r.skipped.length) toast(`Skipped ${r.skipped.length}`, "only pictures, sounds and videos (up to 300 MB each)", "bad");
  await reloadLocals();
}
async function reloadLocals() { locals = await M.localFiles(); pools = M.buildPools(levels, locals, Math.max(TIERS, levels.length), set.defaults); if (tab === "media") render(true); }

// ------------------------------------------------------------------------------------------------ HUD
const hHearts = $("#hearts"), hCps = $("#cps"), hPk = $("#pk"), hHeat = $("#heat-i"), hHeatT = $("#heat-t"), hHeatBox = $("#heat"), hBuffs = $("#buffs"), hTok = $("#tok b");
let shown = S.hearts, buffSig = "";
function hud(dt) {
  shown += (S.hearts - shown) * Math.min(1, dt * 12); if (Math.abs(S.hearts - shown) < 1 || S.hearts < shown) shown = S.hearts;
  hHearts.textContent = fmt(shown);
  hCps.textContent = fmt(G.cps(S, rt)); hPk.textContent = fmt(G.perKiss(S, rt));
  const fr = G.frenzyOn(rt);
  hHeat.style.transform = `scaleX(${rt.heat.toFixed(3)})`;
  hHeatT.textContent = fr ? `FRENZY ${Math.ceil((rt.frenzyUntil - Date.now()) / 1000)}s · x${G.frenzyMult(S, rt)}` : rt.heat > 0.02 ? `heat x${G.comboMult(S, rt).toFixed(2)}` : "click fast to heat up";
  hHeatBox.setAttribute("aria-valuenow", Math.round(rt.heat * 100));
  document.body.classList.toggle("frenzy", fr);
  hTok.textContent = S.tokens;
  const now = Date.now() / 1000, bs = S.buffs.filter(b => b.until > now).map(b => [b.id, Math.ceil(b.until - now)]);
  const sg = bs.map(b => b.join(":")).join();
  if (sg !== buffSig) { buffSig = sg; hBuffs.innerHTML = bs.map(([id, t]) => { const B = G.BUFF[id]; return `<span class="ck-buff${B.good ? "" : " bad"}">${B.icon} ${esc(B.name)} <small>${G.fmtTime(t)}</small></span>`; }).join(""); }
  $("#dot-skills").hidden = !(G.skillFree(S) > 0 && SKILLS.some(k => G.canRank(S, k.id)));
  $("#dot-wheel").hidden = !(S.tokens >= 1);
}
const muteB = $("#b-mute");
function muteBtn() { muteB.textContent = set.muted ? "🔇" : "🔊"; muteB.setAttribute("aria-pressed", set.muted); }
muteB.addEventListener("click", () => { set.muted = !set.muted; muteBtn(); if (set.muted) levelAudio.stop(); save(); if (tab === "more") render(true); });
muteBtn();
$("#tok").addEventListener("click", () => document.querySelector('.ck-tabs [data-tab="wheel"]').click());
function leave() { save(); if (document.referrer && new URL(document.referrer, location.href).pathname.endsWith("/chat.html") && history.length > 1) history.back(); else location.href = "chat.html"; }
$("#b-x").addEventListener("click", leave);
addEventListener("keydown", e => {
  if (e.key !== "Escape") return;
  if (!modal.hidden) { closeModal(); return; }
  leave();
});

// ------------------------------------------------------------------------------------------------ loops
let wiping = false;
function save() { if (!wiping && !window.ChoochieClicker.noSave) G.save(S); }
let last = performance.now(), achT = 0, saveT = 0, helperT = 0, idleT = 0;
function logic() {
  const t = performance.now(), dt = Math.min(5, (t - last) / 1000); last = t;
  const ev = G.step(S, rt, dt);
  if (ev.frenzyEnded) toast("Frenzy over~ again!", "", "");
  if (ev.token) toast("🎡 +1 spin token", "", "gold");
  popTick(dt);
  // a new level
  const tier = G.tierFor(S.allTimeEarned);
  if (tier > S.maxTier) {
    S.maxTier = tier; sfx.level(); shake(4);
    toast(`🔓 Level ${tier + 1} unlocked: ${tierName(tier)}`, "new pop-ups~", "big"); say("tier", true); react("flirty", "heart", 4000);
    for (let i = 0; i < 3; i++) setTimeout(() => spawnPop(tier, i === 0), 250 + i * 220);
  }
  achT += dt;
  if (achT > 0.5) {
    achT = 0;
    for (const a of G.checkAch(S, rt)) { toast("🏅 " + a.name, a.desc + " · +1% everything", "gold"); sfx.gold(); }
  }
  // her helpers tapping her: small numbers now and then
  helperT += dt;
  const c = G.cps(S, rt);
  if (c > 0 && helperT > 1.1 && !document.hidden) {
    helperT = 0;
    const own = HELPERS.map((h, i) => [h, i]).filter(([h, i]) => S.owned[i] > 0);
    if (own.length) { const [h] = pick(own), A = area(); const x = A.x + A.w * (0.3 + Math.random() * 0.4), y = A.y + A.h * (0.3 + Math.random() * 0.4); num(x, y, h.icon + " +" + fmt(c * 1.1), "small"); }
  }
  idleT = (Date.now() - rt.lastClick) / 1000;
  if (rt.lastClick && idleT > 45 && idleT < 45 + dt + 0.01) say("idle");
  saveT += dt; if (saveT > 10) { saveT = 0; save(); }
  render(false);
}
setInterval(logic, 100);
let lastF = performance.now();
function frame(t) {
  const dt = Math.min(0.1, (t - lastF) / 1000); lastF = t;
  hud(dt); drawParts(dt); stepSpin();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
document.addEventListener("visibilitychange", () => { if (document.hidden) save(); });
addEventListener("pagehide", save);

// ------------------------------------------------------------------------------------------------ start
function welcome() {
  const off = G.offline(S);
  if (off) {
    openModal(`<h3>Welcome back~</h3><p>You were away ${G.fmtTime(off.away)}${off.capped ? " (helpers stop after a while)" : ""}. Your helpers kept clicking:</p><div class="big">+${fmt(off.gain)} ♥</div><p><em>"${esc(pick(LINES.back))}"</em></p><div class="ck-btns"><button type="button" class="btn btn-primary btn-sm" data-m="ok">Collect</button></div>`, () => { sfx.gold(); });
  }
  S.maxTier = Math.max(S.maxTier, G.tierFor(S.allTimeEarned));
}
welcome();
render(true);
bootStage();
loadMedia();
if (S.clicks > 0) $("#hint").classList.add("off");
Object.assign(window.ChoochieClicker, { spawnPop, spawnGold, doClick });
