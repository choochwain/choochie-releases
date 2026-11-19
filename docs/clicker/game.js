// Choochie Heart Clicker: the rules (shared spec v1.0 with the desktop app). State, production, buying, heat + frenzy,
// buffs, wheel, golden hearts, rebirth, achievements, saving. No DOM here: ui.js draws it.
import { HELPERS, COST_GROWTH, trainNeed, TAP_COST, SKILLS, tierAt, wheelOf, SULK, SPOILED_MIN, SPOILED_MULT, TRIBUTE_WINDOW, TOKEN_MAX, TOKEN_CLICKS, TOKEN_SECONDS, ACH } from "./data.js";

export const SAVE_KEY = "choochie.clicker.v1";
const nowS = () => Date.now() / 1000;
const H = HELPERS.length;

export function fresh() {
  return {
    v: 1, hearts: 0, runEarned: 0, allTimeEarned: 0, clicks: 0, clicksRun: 0, tap: 0,
    owned: Array(H).fill(0), train: Array(H).fill(0), skills: {}, bonusSP: 0, devotion: 0, rebirths: 0, achievements: [],
    tokens: 1, tokenClicks: 0, tokenTime: 0, frenzies: 0, goldens: 0, spins: 0, penalties: 0, rewards: 0, popClicks: 0, crits: 0,
    bestRate: 0, lastTick: nowS(), maxTier: 0, buffs: [], afk: 0, tributeAsks: 0, tributes: 0, tributed: 0, trib: null,
    // sv = settings version (2: maxPops default 7 -> 20). ui = size of the side panel, HUD and menus (0.7 .. 1.6)
    settings: { sv: 2, vol: 0.7, media: 0.8, sfx: 0.5, muted: false, popups: true, maxPops: 20, defaults: true, herLines: true, helpersFx: true, buyN: 1, motion: "auto", lite: false,
      ui: 1, wheelMode: "normal" },
  };
}
export function sane(j) {
  const s = fresh();
  if (!j || typeof j !== "object") return s;
  const N = (v, d) => (typeof v === "number" && isFinite(v) && v >= 0 ? v : d);
  for (const k of ["hearts", "runEarned", "allTimeEarned", "clicks", "clicksRun", "tap", "bonusSP", "devotion", "rebirths", "tokens", "tokenClicks", "tokenTime",
    "frenzies", "goldens", "spins", "penalties", "rewards", "popClicks", "crits", "bestRate", "lastTick", "maxTier", "afk", "tributeAsks", "tributes", "tributed"]) s[k] = N(j[k], s[k]);
  // a tribute the player chose to send, waiting for Ko-fi to confirm it (signed-in players): spec 8b trib { amount, at (unix s), credits }
  // credits = the account's bought energy when it was sent (null until her server answered)
  if (j.trib && [5, 10, 15].includes(j.trib.amount) && N(j.trib.at, 0) > nowS() - TRIBUTE_WINDOW) s.trib = { amount: j.trib.amount, at: j.trib.at, credits: typeof j.trib.credits === "number" ? j.trib.credits : null };
  for (const k of ["owned", "train"]) if (Array.isArray(j[k])) for (let i = 0; i < H; i++) s[k][i] = Math.floor(N(j[k][i], 0));
  if (j.skills && typeof j.skills === "object") for (const k of SKILLS) { const r = Math.floor(N(j.skills[k.id], 0)); if (r) s.skills[k.id] = Math.min(k.ranks, r); }
  if (Array.isArray(j.achievements)) s.achievements = ACH.map(a => a.id).filter(id => j.achievements.includes(id));
  if (Array.isArray(j.buffs)) s.buffs = j.buffs.filter(b => b && typeof b.id === "string" && BUFF[b.id] && N(b.until, 0) > nowS()).map(b => ({ id: b.id, until: b.until, mult: N(b.mult, 1) })).slice(0, 20);
  if (j.settings && typeof j.settings === "object") {
    for (const k in s.settings) if (k !== "sv" && typeof j.settings[k] === typeof s.settings[k]) s.settings[k] = j.settings[k];
    if (!(j.settings.sv >= 2) && j.settings.maxPops === 7) s.settings.maxPops = 20;      // kept the old default -> the new one
  }
  const st = s.settings;
  st.maxPops = Math.max(1, Math.min(30, Math.round(st.maxPops) || 20)); st.ui = Math.max(0.7, Math.min(1.6, +st.ui || 1));
  if (!["normal", "risky"].includes(st.wheelMode)) st.wheelMode = "normal";
  s.tap = Math.floor(s.tap); s.tokens = Math.min(TOKEN_MAX, Math.floor(s.tokens)); s.maxTier = Math.floor(s.maxTier);
  s.allTimeEarned = Math.max(s.allTimeEarned, s.runEarned);
  return s;
}
export function load() { try { const raw = localStorage.getItem(SAVE_KEY); if (raw) return sane(JSON.parse(raw)); } catch (e) {} return fresh(); }
export function save(s) { s.lastTick = nowS(); try { localStorage.setItem(SAVE_KEY, JSON.stringify(s)); return true; } catch (e) { return false; } }
export const exportSave = s => { try { return btoa(unescape(encodeURIComponent(JSON.stringify(s)))); } catch (e) { return ""; } };
export const importSave = str => sane(JSON.parse(decodeURIComponent(escape(atob(String(str).trim())))));

// ------------------------------------------------------------------------------------------------ numbers (spec 1)
// K .. Dc, then aa ab .. az ba .. zz (1e36 = 1aa): enough for any double
const SUF = ["", "K", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"];
for (let a = 0; a < 26; a++) for (let b = 0; b < 26; b++) SUF.push(String.fromCharCode(97 + a, 97 + b));
export function fmt(n) {
  if (n !== n || n <= 0) return "0";
  if (!isFinite(n)) n = Number.MAX_VALUE;
  if (n < 1000) return n < 10 && n % 1 ? (Math.floor(n * 10) / 10).toFixed(1) : String(Math.floor(n));
  let e = Math.floor(Math.log10(n) / 3), v = n / Math.pow(1000, e);
  let t = v >= 100 ? Math.floor(v).toString() : v >= 10 ? (Math.floor(v * 10) / 10).toFixed(1) : (Math.floor(v * 100) / 100).toFixed(2);
  if (parseFloat(t) >= 1000 && e + 1 < SUF.length) { e++; t = "1.00"; }
  return t + SUF[e];
}
export function fmtTime(sec) {
  const s = Math.max(0, Math.round(sec));
  if (s < 60) return s + "s";
  if (s < 3600) return Math.floor(s / 60) + "m " + String(s % 60).padStart(2, "0") + "s";
  return Math.floor(s / 3600) + "h " + String(Math.floor(s / 60) % 60).padStart(2, "0") + "m";
}

// ------------------------------------------------------------------------------------------------ buffs (same id refreshes, different ids multiply)
export const BUFF = {
  g_kiss:   { kind: "click", name: "Kiss Frenzy",   icon: "💋", good: true },
  g_storm:  { kind: "cps",   name: "Heart Storm",   icon: "⛈️", good: true },
  w_frenzy: { kind: "click", name: "FRENZY x7",     icon: "🔥", good: true },
  w_storm:  { kind: "cps",   name: "Heart Storm",   icon: "⛈️", good: true },
  w_nap:    { kind: "cps",   name: "Nap Time",      icon: "😴", good: false },
  w_butter: { kind: "click", name: "Butterfingers", icon: "🧈", good: false },
  w_cold:   { kind: "pause", name: "Cold Shoulder", icon: "🧊", good: false },
  w_combo:  { kind: "heat",  name: "Combo Break",   icon: "💔", good: false },
  w_slow:   { kind: "cps",   name: "Slow Down",     icon: "🐌", good: false },
  w_tease:  { kind: "click", name: "Teased~",       icon: "😏", good: false },
  w_yawn:   { kind: "cps",   name: "Yawn",          icon: "🥱", good: false },
  w_rush:   { kind: "click", name: "Kiss Rush",     icon: "💨", good: true },
  sulk:     { kind: "cps",   name: "She's sulking", icon: "😤", good: false },
  spoiled_c:{ kind: "click", name: "Spoiled~",      icon: "👑", good: true },
  spoiled_s:{ kind: "cps",   name: "Spoiled~",      icon: "👑", good: true },
};
export function addBuff(s, id, mult, sec) {
  const until = nowS() + sec, b = s.buffs.find(x => x.id === id);
  if (b) { b.until = until; b.mult = mult; } else s.buffs.push({ id, until, mult });
}
const live = s => s.buffs.filter(b => b.until > nowS());
const buffMult = (s, kind) => live(s).reduce((m, b) => (BUFF[b.id].kind === kind ? m * b.mult : m), 1);
export const buffOn = (s, kind) => live(s).some(b => BUFF[b.id].kind === kind);

// ------------------------------------------------------------------------------------------------ derived values
export const rank = (s, id) => s.skills[id] || 0;
export const typesOwned = s => s.owned.filter(n => n > 0).length;
export const helpersTotal = s => s.owned.reduce((a, b) => a + b, 0);
export const globalMult = s => (1 + 0.03 * s.devotion) * (1 + 0.01 * s.achievements.length);
export const helperOut = (s, i) => s.owned[i] * HELPERS[i].cps * Math.pow(2, s.train[i]);
export const helperFactor = s => (1 + 0.25 * rank(s, "h_paw")) * (1 + 0.03 * typesOwned(s) * rank(s, "h_team")) * (rank(s, "h_clones") ? 3 : 1) * globalMult(s);
export function cpsBase(s) { let t = 0; for (let i = 0; i < H; i++) t += helperOut(s, i); return t * helperFactor(s); }
export function cps(s, rt) {
  const idle = rt ? (Date.now() - rt.lastClick) / 1000 : 0;
  return cpsBase(s) * buffMult(s, "cps") * (rank(s, "h_overtime") && idle >= 60 ? 2 : 1);
}
export const clickBaseOf = tap => (1 + tap) * Math.pow(2, Math.floor(tap / 10));
export const clickMult = s => (1 + 0.5 * rank(s, "k_pucker")) * (rank(s, "k_muscle") ? 2 : 1);
export const clickPower = s => clickBaseOf(s.tap) * clickMult(s) * globalMult(s) + cpsBase(s) * 0.01 * rank(s, "k_lipstick");
export const comboMult = (s, rt) => 1 + rt.heat * (1 + rank(s, "f_king"));
export const frenzyOn = rt => rt.frenzyUntil > Date.now();
export const frenzyMult = (s, rt) => (frenzyOn(rt) ? (rank(s, "f_endless") ? 5 : 3) : 1);
export const critChance = s => [0, 0.04, 0.08, 0.12][rank(s, "k_crit")];
export const perKiss = (s, rt) => clickPower(s) * comboMult(s, rt) * frenzyMult(s, rt) * buffMult(s, "click");

// ------------------------------------------------------------------------------------------------ buying
export function helperPrice(s, i, n) {
  const k = 1 - 0.05 * rank(s, "h_bulk"), first = HELPERS[i].cost * Math.pow(COST_GROWTH, s.owned[i]) * k;
  n = n || 1; return first * (Math.pow(COST_GROWTH, n) - 1) / (COST_GROWTH - 1);
}
export function maxAffordable(s, i) {
  const first = helperPrice(s, i, 1); if (s.hearts < first) return 0;
  return Math.max(1, Math.floor(Math.log(s.hearts * (COST_GROWTH - 1) / first + 1) / Math.log(COST_GROWTH) + 1e-9));
}
export function buyHelper(s, i, n) {
  if (n === "max") n = maxAffordable(s, i);
  n = Math.floor(n || 1); if (n < 1) return 0;
  const c = helperPrice(s, i, n); if (c > s.hearts * (1 + 1e-12)) return 0;
  s.hearts = Math.max(0, s.hearts - c); s.owned[i] += n; return n;
}
export const helperVisible = (s, i) => s.owned[i] > 0 || s.runEarned >= HELPERS[i].cost * 0.5;
export function trainInfo(s, i) {
  const u = s.train[i];
  return { u, need: trainNeed(u), cost: HELPERS[i].cost * 10 * Math.pow(8, u), ready: s.owned[i] >= trainNeed(u) };
}
export function train(s, i) { const t = trainInfo(s, i); if (!t || !t.ready || s.hearts < t.cost) return false; s.hearts -= t.cost; s.train[i]++; return true; }
export const tapCost = s => TAP_COST(s.tap);
export function buyTap(s) { const c = tapCost(s); if (s.hearts < c) return false; s.hearts -= c; s.tap++; return true; }

// ------------------------------------------------------------------------------------------------ skills
export const skillPoints = s => Math.max(0, Math.floor(3 * Math.log10(Math.max(1, s.allTimeEarned))) - 3) + 2 * s.rebirths + Math.floor(s.achievements.length / 4) + s.bonusSP;
export const rankCost = (k, r) => (k.ranks === Infinity ? k.cost + Math.floor(r / 3) : k.cost);      // cost of rank r+1
const spentOn = (k, R) => { if (k.ranks !== Infinity) return R * k.cost; let t = 0; for (let r = 0; r < R; r++) t += rankCost(k, r); return t; };
export const skillSpent = s => SKILLS.reduce((t, k) => t + spentOn(k, rank(s, k.id)), 0);
export const skillFree = s => skillPoints(s) - skillSpent(s);
export function canRank(s, id) { const k = SKILLS.find(x => x.id === id); return !!k && rank(s, id) < k.ranks && (!k.req || rank(s, k.req) >= 1) && skillFree(s) >= rankCost(k, rank(s, id)); }
export function rankUp(s, id) { if (!canRank(s, id)) return false; s.skills[id] = rank(s, id) + 1; return true; }
export function respec(s) { s.skills = {}; }
export const nextSpAt = s => { const n = Math.max(0, Math.floor(3 * Math.log10(Math.max(1, s.allTimeEarned)))) + 1; return Math.pow(10, n / 3); };

// ------------------------------------------------------------------------------------------------ media tiers
export function tierFor(all) { let t = 0; while (t < 5000 && all >= tierAt(t + 1)) t++; return t; }

// ------------------------------------------------------------------------------------------------ earning
// numbers stay finite: every add is capped at 1e300 (spec 1.1)
export const BIG = 1e300;
const add = (a, b) => Math.min(BIG, a + b);
export function earn(s, n) { if (!(n > 0)) return; if (!isFinite(n)) n = BIG; s.hearts = add(s.hearts, n); s.runEarned = add(s.runEarned, n); s.allTimeEarned = add(s.allTimeEarned, n); }

export function runtime() { return { heat: 0, frenzyUntil: 0, lastClick: 0, times: [], session: 0, activeNoGold: 0, rate: 0 }; }
export function clickRate(rt) { const t = Date.now(); while (rt.times.length && t - rt.times[0] > 2000) rt.times.shift(); return rt.times.length / 2; }

// one click on her. returns { gain, crit, mega, frenzyStarted, token, milestone }
export function click(s, rt) {
  const t = Date.now(), out = { gain: 0, crit: false, mega: 0, frenzyStarted: false, token: false, milestone: false };
  rt.lastClick = t; rt.times.push(t); if (rt.times.length > 60) rt.times.shift();
  if (!frenzyOn(rt)) {
    rt.heat = Math.min(1, rt.heat + 0.045 * (1 + 0.2 * rank(s, "f_warm")) * (buffOn(s, "heat") ? 0.5 : 1));
    if (rt.heat >= 1) { startFrenzy(s, rt); out.frenzyStarted = true; }
  }
  let g = perKiss(s, rt);
  if (Math.random() < critChance(s)) { g *= rank(s, "k_smooch") ? 25 : 10; out.crit = true; s.crits++; }
  s.clicks++; s.clicksRun++; rt.session++;
  if (rank(s, "k_favorite") && s.clicks % 100 === 0) { out.mega = Math.max(60 * cps(s, rt), 100 * clickPower(s)); g += out.mega; }
  earn(s, g); out.gain = g;
  s.tokenClicks++;
  if (s.tokenClicks >= TOKEN_CLICKS) { s.tokenClicks = 0; if (s.tokens < TOKEN_MAX) { s.tokens++; out.token = true; } }
  if (rt.session % 100 === 0) out.milestone = true;
  const r = clickRate(rt); rt.rate = r; if (r > s.bestRate) s.bestRate = r;
  return out;
}
export function startFrenzy(s, rt) { rt.heat = 1; rt.frenzyUntil = Date.now() + (8 + 4 * rank(s, "f_overdrive")) * 1000; s.frenzies++; }
// time passes (dt seconds). returns { frenzyEnded, token }
export function step(s, rt, dt) {
  const t = Date.now(), out = { frenzyEnded: false, token: false };
  s.buffs = live(s);
  earn(s, cps(s, rt) * dt);
  if (rt.frenzyUntil && t >= rt.frenzyUntil) { rt.frenzyUntil = 0; rt.heat = rank(s, "f_endless") ? 0.7 : 0.5; out.frenzyEnded = true; }
  if (!frenzyOn(rt)) {
    const idle = (t - rt.lastClick) / 1000;
    rt.heat = Math.max(0, rt.heat - dt * 0.22 * [1, 0.7, 0.5][rank(s, "f_hot")] * (idle > 1 ? 2.5 : 1));
  }
  rt.rate = clickRate(rt);
  if ((t - rt.lastClick) < 10000) rt.activeNoGold += dt;
  s.tokenTime += dt;
  const per = TOKEN_SECONDS / (rank(s, "l_wheelcharm") ? 2 : 1);
  if (s.tokenTime >= per) { s.tokenTime -= per; if (s.tokens < TOKEN_MAX) { s.tokens++; out.token = true; } }
  s.lastTick = nowS();
  return out;
}
// earnings while away (spec 6)
export function offline(s) {
  const elapsed = Math.max(0, nowS() - (s.lastTick || nowS())), r = rank(s, "h_night");
  const used = Math.min(elapsed, [2, 8, 24][r] * 3600);
  const gain = cpsBase(s) * used * [0.25, 0.5, 0.75][r];
  if (!(gain > 0) || elapsed <= 60) return null;
  earn(s, gain); s.afk = 1;
  return { gain, away: elapsed, capped: elapsed > used };
}

// ------------------------------------------------------------------------------------------------ pop-ups (spec 7): spawn interval + lifetime
export function popInterval(s, rt) {
  const idle = (Date.now() - rt.lastClick) / 1000;
  if (buffOn(s, "pause")) return Infinity;
  let iv;
  if (!rt.lastClick || idle >= 60) { if (!helpersTotal(s)) return Infinity; iv = 45; }
  else iv = Math.min(23, Math.max(0.4, 7 / (0.3 + 0.6 * rt.rate)));
  if (frenzyOn(rt)) iv *= rank(s, "f_fever") ? 0.25 : 0.5;
  return iv;
}
export const popLife = (s, rt) => Math.min(6.5, Math.max(2.5, 6.5 - 0.3 * rt.rate)) * (rank(s, "l_collector") ? 1.5 : 1);
export const popPay = s => clickPower(s) * 5 * (1 + rank(s, "l_pop"));
export function popClicked(s, rt) { const g = popPay(s); earn(s, g); s.popClicks++; if (!frenzyOn(rt)) { rt.heat = Math.min(1, rt.heat + 0.06); if (rt.heat >= 1) startFrenzy(s, rt); } return g; }

// ------------------------------------------------------------------------------------------------ golden hearts
export const goldChance = (s, rt) => Math.min(0.5, 0.03 * (1 + 0.3 * rank(s, "l_charm")) * (frenzyOn(rt) && rank(s, "f_fever") ? 3 : 1));
export function goldRoll(s, rt) {           // on each pop-up spawn; pity after 240 s of active play
  if (Math.random() < goldChance(s, rt) || rt.activeNoGold >= 240) { rt.activeNoGold = 0; return true; }
  return false;
}
export function catchGold(s, rt) {
  s.goldens++;
  const k = 1 + 0.5 * rank(s, "l_gold"), r = Math.random();
  const lucky = x => { const v = (Math.min(s.hearts * 0.15, cps(s, rt) * 900) + clickPower(s) * 13 + 13) * k * x; earn(s, v); return v; };
  if (rank(s, "l_jackpot") && Math.random() < 0.1) return { id: "jackpot", name: "JACKPOT!", gain: lucky(7) };
  if (r < 0.5) return { id: "lucky", name: "Lucky!", gain: lucky(1) };
  if (r < 0.8) { addBuff(s, "g_kiss", 7, 15 * k); return { id: "kiss", name: "Kiss Frenzy! clicks x7" }; }
  addBuff(s, "g_storm", 5, 45 * k); return { id: "storm", name: "Heart Storm! ♥/s x5" };
}

// ------------------------------------------------------------------------------------------------ the Risky Wheel (spec 8)
export const spinPrice = (s, rt) => Math.max(250, cps(s, rt) * 180 + clickPower(s) * 120);
// pay (token first, else hearts if buy) and pick a slice; the effect lands when the wheel stops (applySpin)
export function startSpin(s, rt, buy) {
  if (s.tokens >= 1 && !buy) s.tokens--;
  else { const p = spinPrice(s, rt); if (s.hearts < p) return null; s.hearts -= p; }
  s.spins++;
  const W = wheelOf(s.settings.wheelMode), i = Math.floor(Math.random() * W.length);
  return { index: i, slice: W[i], mode: s.settings.wheelMode };
}
// fx: { spawnGold(n), peek(n) -> bool (false when every level is unlocked) }
// mode: the wheel mode the spin was paid in. A tribute slice only counts here; ui.js shows her card.
// fx: { spawnGold(n), peek(n) -> bool (false when no locked level has media) }
export function applySpin(s, rt, slice, fx, mode) {
  const soft = rank(s, "l_wheelcharm") ? 0.5 : 1, cp = clickPower(s), c = cps(s, rt);
  if (slice.tribute) { s.tributeAsks++; return "$" + slice.tribute + " tribute on Ko-fi (optional, real money)"; }
  if (slice.good) s.rewards++; else s.penalties++;
  const gain = v => { earn(s, v); return `+${fmt(v)} ♥`; };
  const best = n0 => { let b = -1, bv = 0; for (let i = 0; i < H; i++) { const v = helperOut(s, i); if (v > bv) { bv = v; b = i; } } return b; };
  const peek = n => { if (fx && fx.peek && fx.peek(n)) return "a peek at the next level~"; if (fx && fx.spawnGold) fx.spawnGold(n); return `${n} golden hearts!`; };
  switch (slice.id) {
    // normal
    case "n_lucky": return gain(Math.max(s.hearts * 0.10, c * 300, cp * 100));
    case "n_pocket": return gain(Math.max(s.hearts * 0.05, c * 120, cp * 50));
    case "n_tease": addBuff(s, "w_tease", 0.75, 20 * soft); return "clicks x0.75 for " + Math.round(20 * soft) + " s";
    case "n_yawn": addBuff(s, "w_yawn", 0.75, 30 * soft); return "♥/s x0.75 for " + Math.round(30 * soft) + " s";
    case "n_storm": addBuff(s, "w_storm", 3, 45); return "♥/s x3 for 45 s";
    case "n_helper": { const b = best(); if (b < 0) { s.owned[0] += 5; return "+5 Paw Cursors"; } s.owned[b]++; return `+1 ${HELPERS[b].name}`; }
    case "n_frenzy": startFrenzy(s, rt); return "FRENZY!";
    case "n_rush": addBuff(s, "w_rush", 3, 30); return "clicks x3 for 30 s";
    case "n_token": if (s.tokens < TOKEN_MAX) { s.tokens++; return "+1 spin token"; } return "tokens full: " + gain(Math.max(s.hearts * 0.10, c * 300, cp * 100));
    case "n_gold": if (fx && fx.spawnGold) fx.spawnGold(1); return "catch it!";
    case "n_peek": return peek(3);
    // risky
    case "lucky": return gain(Math.max(s.hearts * 0.30, c * 900, cp * 300));
    case "frenzy": startFrenzy(s, rt); addBuff(s, "w_frenzy", 7, 30); return "FRENZY! clicks x7 for 30 s";
    case "helper": { const b = best(); if (b < 0) { s.owned[0] += 10; return "+10 Paw Cursors"; } s.owned[b] += 3; return `+3 ${HELPERS[b].name}s`; }
    case "sp": s.bonusSP += 2; return "+2 skill points, forever";
    case "storm": addBuff(s, "w_storm", 7, 60); return "♥/s x7 for 60 s";
    case "peek": return peek(5);
    case "tax": { const v = s.hearts * 0.15 * soft; s.hearts = Math.max(0, s.hearts - v); return `-${fmt(v)} ♥`; }
    case "butter": addBuff(s, "w_butter", 0.5, 60 * soft); return "clicks x0.5 for " + Math.round(60 * soft) + " s";
    case "combo": rt.heat = 0; rt.frenzyUntil = 0; addBuff(s, "w_combo", 0.5, 30 * soft); return "heat gone, builds slower for " + Math.round(30 * soft) + " s";
  }
  return "";
}

// ------------------------------------------------------------------------------------------------ tributes (spec 8b: real Ko-fi tips, always optional)
// "maybe later" / Esc / a click outside / the card's timeout: she sulks (normal ♥/s x0.8 for 30 s, risky x0.5 for 60 s). Nothing else.
export function sulk(s, mode) {
  const k = SULK[mode] || SULK.normal, soft = rank(s, "l_wheelcharm") ? 0.5 : 1;
  s.penalties++; addBuff(s, "sulk", k.mult, k.sec * soft);
  return `♥/s x${k.mult} for ${Math.round(k.sec * soft)} s`;
}
// the pending tribute was confirmed: "Spoiled~" (k = amount / 5)
export function spoiled(s, rt, amount) {
  const k = Math.max(1, amount / 5), v = Math.max(s.hearts * 0.5 * k, cps(s, rt) * 1800 * k, clickPower(s) * 1000 * k);
  earn(s, v);
  addBuff(s, "spoiled_c", SPOILED_MULT, SPOILED_MIN * 60 * k); addBuff(s, "spoiled_s", SPOILED_MULT, SPOILED_MIN * 60 * k);
  s.tokens = Math.min(TOKEN_MAX, s.tokens + k); s.bonusSP += k;
  s.tributes++; s.tributed += amount; s.trib = null;
  return v;
}

// ------------------------------------------------------------------------------------------------ rebirth (spec 10)
export const devotionFor = all => Math.floor(10 * Math.cbrt(all / 1e9));
export const devotionGain = s => Math.max(0, devotionFor(s.allTimeEarned) - s.devotion);
export const canRebirth = s => s.runEarned >= 1e9 && devotionGain(s) >= 1;
export function rebirth(s, rt) {
  if (!canRebirth(s)) return 0;
  const g = devotionGain(s);
  s.devotion += g; s.rebirths++;
  Object.assign(s, { hearts: 0, runEarned: 0, clicksRun: 0, tap: 0, owned: Array(H).fill(0), train: Array(H).fill(0), buffs: [] });
  if (rt) { rt.heat = 0; rt.frenzyUntil = 0; }
  return g;
}

// ------------------------------------------------------------------------------------------------ achievements
export function checkAch(s, rt) {
  const done = k => rank(s, k.id) >= (k.ranks === Infinity ? 3 : k.ranks), brMax = br => SKILLS.filter(k => k.br === br).every(done);
  const v = { clicks: s.clicks, all: s.allTimeEarned, cps: cps(s, rt), helpers: helpersTotal(s), types: typesOwned(s), frenzies: s.frenzies, goldens: s.goldens,
    spins: s.spins, penalties: s.penalties, rewards: s.rewards, rebirths: s.rebirths, maxTier: s.maxTier, bestRate: s.bestRate, popClicks: s.popClicks,
    afk: !!s.afk, crits: s.crits, branchMaxed: ["kiss", "help", "luck", "frenzy"].some(brMax), treeMaxed: SKILLS.every(done) };
  const got = [];
  for (const a of ACH) if (!s.achievements.includes(a.id) && a.test(v)) { s.achievements.push(a.id); got.push(a); }
  return got;
}
