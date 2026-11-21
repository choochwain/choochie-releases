// Shared bits for every page: header, footer, 18+ gate, sign-in state, server calls, plans table.
const API = "https://api.choochie.app";
// The public Discord invite - the ONLY place it lives. The owner is moving to a new server soon:
// paste the new invite here and every Discord button and link on the site follows (elements with data-discord).
const DISCORD_INVITE = "https://discord.gg/xvGchM39Kf";
const LINKS = {
  repo: "choochwain/choochie-releases",
  patreon: "https://www.patreon.com/Choochie",
  kofi: "https://ko-fi.com/dahmeows",
  beacons: "https://beacons.ai/choochwain",
  discord: DISCORD_INVITE,                            // empty = her link page instead (it lists the server)
};
// Patreon is "coming soon" (waiting on Patreon's ID check). Plans are bought meanwhile through a ticket on her Discord and
// unlocked with a code (plans.html#buy, account page > Redeem a code). When Patreon is live: set this to true AND set
// PET_PATREON_ENABLED=1 on the server - every Patreon button and link comes back.
const PATREON_LIVE = false;
const BUY_HREF = "plans.html#buy";

const $ = (s, el = document) => el.querySelector(s);
const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
  set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} },
};

// ---- session (a signed token from the server; kept in this browser only)
const Auth = {
  get token() { return store.get("choochie.session"); },
  set(t) { store.set("choochie.session", t); },
  clear() { store.set("choochie.session", null); store.set("choochie.name", null); },
  get signedIn() { return !!this.token; },
};
async function api(path, opts = {}) {
  const headers = Object.assign({}, opts.headers || {}), sent = Auth.token;
  if (sent) headers.Authorization = "Bearer " + sent;
  if (opts.body && typeof opts.body !== "string") { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.body); }
  let r;
  try { r = await fetch(API + path, Object.assign({}, opts, { headers })); }
  catch (e) { throw Object.assign(new Error("Her server is waking up - try again in a few seconds."), { status: 0 }); }
  let j = null; try { j = await r.json(); } catch (e) {}
  if (r.status === 401 && path.startsWith("/pet/ai/v1/account") && sent && sent === Auth.token) Auth.clear();   // only the session that was refused (not a newer one)
  if (!r.ok) throw Object.assign(new Error((j && j.error) || "Something went wrong (" + r.status + ")"), { status: r.status, data: j });
  return j;
}

// ---- "Link this PC": the app's Log in opens login.html?pair=<one-time token> (10 min). A PC is only linked after the signed-in
// user confirms its short code here, so a link someone else sent can't quietly attach THEIR PC to your account.
const Pair = {
  key: "choochie.pair",
  ok: t => /^p1\.[A-Za-z0-9_-]{20,400}\.[A-Za-z0-9_-]{20,64}$/.test(t || ""),
  save(t) { try { sessionStorage.setItem(this.key, JSON.stringify({ t, at: Date.now() })); } catch (e) {} },
  get() { try { const o = JSON.parse(sessionStorage.getItem(this.key) || "null"); if (o && this.ok(o.t) && Date.now() - o.at < 600000) return o.t; } catch (e) {} this.clear(); return null; },
  clear() { try { sessionStorage.removeItem(this.key); } catch (e) {} },
  async code(t) { const r = await fetch(API + "/pet/ai/auth/pair?t=" + encodeURIComponent(t)); if (!r.ok) throw Object.assign(new Error("expired"), { status: r.status }); return (await r.json()).code; },
  expiredHTML: '<div class="note warn" style="margin-bottom:16px">That link from the app expired or was already used. Press <strong>Log in</strong> in Choochie again to get a fresh one.</div>',
  // the confirm box: "Link this PC: K7Q-2M9?" -> POST /account/attach { pair }
  async ask(el, t, done) {
    let code; try { code = await this.code(t); } catch (e) { this.clear(); el.innerHTML = e.status === 410 ? this.expiredHTML : '<div class="note warn" style="margin-bottom:16px">Her server is waking up - reload this page in a few seconds to link your PC.</div>'; return; }
    el.innerHTML = `<div class="note good" style="margin-bottom:16px"><strong style="font-size:17px">Link this PC: <span style="letter-spacing:.08em;font-family:ui-monospace,Consolas,monospace">${esc(code)}</span>?</strong>
      <p style="margin:6px 0 0">Choochie on your PC shows a code right now. Link it only if it's <strong>exactly this code</strong> and you just pressed Log in in the app yourself. Got this link from someone else? Don't link it.</p>
      <div class="row" style="margin-top:10px"><button class="btn btn-primary btn-sm" data-pair-yes>Yes, link this PC</button><button class="btn btn-ghost btn-sm" data-pair-no>Not my PC</button></div></div>`;
    try { el.scrollIntoView({ block: "center" }); } catch (e) {}
    $("[data-pair-no]", el).addEventListener("click", () => { this.clear(); el.innerHTML = '<div class="note" style="margin-bottom:16px">Not linked. Nothing was connected to your account.</div>'; });
    $("[data-pair-yes]", el).addEventListener("click", async e => {
      e.target.disabled = true;
      try { const v = await api("/pet/ai/v1/account/attach", { method: "POST", body: { pair: t } }); this.clear(); el.innerHTML = '<div class="note good" style="margin-bottom:16px"><strong>This PC is signed in.</strong> Go back to Choochie - she picks it up in a few seconds.</div>'; if (done) done(v); }
      catch (err) { if (err.status === 410) { this.clear(); el.innerHTML = this.expiredHTML; } else { toast((err.data && err.data.message) || err.message, true); e.target.disabled = false; } }
    });
  },
};

// public, read-only server data (leaderboard, counts): no Authorization header, so no CORS preflight.
// Her server may be asleep: one quiet retry after `retryMs`.
async function pub(path, retryMs = 6000) {
  for (let i = 0; ; i++) {
    try { const r = await fetch(API + path); if (r.ok) return await r.json(); if (r.status < 500 || i) throw Object.assign(new Error("Something went wrong (" + r.status + ")"), { status: r.status }); }
    catch (e) { if (i || e.status) throw e.status ? e : Object.assign(new Error("Her server is waking up - try again in a few seconds."), { status: 0 }); }
    await new Promise(z => setTimeout(z, retryMs));
  }
}

// a fresh login lands on account.html#c=<one-time code>: the code leaves the address bar at once and is swapped for the session
// (it works once, for 2 minutes), so a copied or shared link never signs anyone into the account. Pages that care wait for sessionReady.
const LOGIN_FRAG = new URLSearchParams(location.hash.slice(1));
const sessionReady = (function takeSession() {
  const c = LOGIN_FRAG.get("c"), t = LOGIN_FRAG.get("t");
  if (c || t) try { history.replaceState(null, "", location.pathname + location.search); } catch (e) {}   // a session (#t=) in a link is never taken: only cleared
  if (!c || !/^[0-9a-f]{48}$/.test(c)) return Promise.resolve(false);
  const swap = () => fetch(API + "/pet/ai/auth/exchange", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ c }) });
  return swap().catch(() => new Promise(z => setTimeout(z, 1500)).then(swap))
    .then(r => r.ok ? r.json() : null).then(j => { if (j && j.t) { Auth.set(j.t); return true; } return false; }).catch(() => false);
})();

// ---- header + footer
const NAV = [
  ["/#features", "Features"], ["chat.html", "Talk to her"], ["clicker.html", "Clicker"], ["plans.html", "Plans"],
  ["downloads.html", "Download"], ["updates.html", "Updates"], ["roadmap.html", "Roadmap"], ["leaderboard.html", "Leaderboard"],
  ["privacy.html", "Privacy"], ["terms.html", "Terms"],
];
// Discord: the invite when set, otherwise her link page (which lists it)
const discordHref = () => LINKS.discord || LINKS.beacons;
const ICON_DISCORD = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17.2 17.2 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.3 12.3 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17.1 17.1 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7zM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1z"/></svg>';
// every [data-discord] link on any page (static or drawn here) points at the one invite above
function wireDiscord(root) { (root || document).querySelectorAll("a[data-discord]").forEach(a => { a.href = discordHref(); if (!a.target) { a.target = "_blank"; a.rel = "noopener"; } }); }
// old links to .../index.html: show the clean address (same page, no reload)
try { if (/\/index\.html$/.test(location.pathname)) history.replaceState(null, "", location.pathname.replace(/index\.html$/, "") + location.search + location.hash); } catch (_) {}
function renderChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  document.documentElement.classList.add("js");
  const nav = $("#site-nav");
  // keyboard users: a "skip to content" link ahead of the header (index.html has its own)
  const main = $("main");
  if (nav && main && !$(".skip")) {
    if (!main.id) main.id = "content";
    const s = document.createElement("a"); s.className = "skip"; s.href = "#" + main.id; s.textContent = "Skip to content";
    nav.before(s);
  }
  if (nav) {
    nav.className = "nav";
    const name = store.get("choochie.name");
    nav.innerHTML = `
      <a class="brand" href="/"><img src="img/favicon.png" alt="" width="28" height="28"><span>Choochie</span></a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
      <nav aria-label="Main">${NAV.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
        <a class="nav-discord" href="${esc(discordHref())}" target="_blank" rel="noopener" data-discord>${ICON_DISCORD}<span>Discord</span></a>
        ${Auth.signedIn
          ? `<a class="nav-account" href="account.html"${here === "account.html" ? ' aria-current="page"' : ""}><span class="avatar">${esc((name || "?")[0].toUpperCase())}</span>${esc(name || "Account")}</a>`
          : `<a class="btn btn-primary btn-sm" href="login.html">Log in</a>`}
      </nav>`;
    const t = $(".nav-toggle", nav);
    t.addEventListener("click", () => { const o = nav.classList.toggle("open"); t.setAttribute("aria-expanded", o); });
  }
  const foot = $("#site-foot");
  if (foot) foot.innerHTML = `
    <div class="foot-cols">
      <div class="foot-brand"><strong>Choochie</strong><p class="fine">An AI-powered 3D desktop companion for Windows 10 / 11: a bratty anime cat-girl who lives on your screen, talks, listens and remembers you. 18+ only.</p>
        <p class="fine">Sign-in is only used to identify your account and sync your energy and perks.</p></div>
      <div><strong>App</strong><a href="downloads.html">Download</a><a href="chat.html">Talk to her</a><a href="clicker.html">Heart Clicker</a><a href="plans.html">Plans</a><a href="updates.html">Updates</a><a href="roadmap.html">Roadmap</a></div>
      <div><strong>Community</strong><a href="${esc(discordHref())}" target="_blank" rel="noopener" data-discord>Discord</a>${PATREON_LIVE ? `<a href="${LINKS.patreon}" target="_blank" rel="noopener">Patreon</a>` : `<a href="${BUY_HREF}">Buy a plan</a>`}<a href="${LINKS.kofi}" target="_blank" rel="noopener">Ko-fi</a><a href="${LINKS.beacons}" target="_blank" rel="noopener">All links</a></div>
      <div><strong>Legal</strong><a href="privacy.html">Privacy Policy</a><a href="terms.html">Terms of Service</a><a href="privacy.html#delete">Delete your data</a><a href="privacy.html#contact">Contact</a></div>
    </div>
    <div class="foot-note"><span>© ${new Date().getFullYear()} Choochie. Fictional character; replies are AI-generated.</span><span>Not affiliated with or endorsed by Discord, Patreon, X or Google.</span></div>`;
  wireDiscord();
}

// ---- scroll reveal + hero parallax (skipped when the visitor prefers less motion)
const calm = matchMedia("(prefers-reduced-motion: reduce)").matches;
function motion() {
  const els = document.querySelectorAll(".reveal");
  if (calm || !("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: .08 });
  els.forEach(e => io.observe(e));
  const fig = $(".hero-figure");
  if (fig && matchMedia("(pointer:fine)").matches) {
    let raf = 0;
    addEventListener("pointermove", e => { if (raf) return; raf = requestAnimationFrame(() => { raf = 0;
      fig.style.setProperty("--px", ((e.clientX / innerWidth - .5) * 18).toFixed(1) + "px");
      fig.style.setProperty("--py", ((e.clientY / innerHeight - .5) * 14 + Math.min(scrollY, 600) * .06).toFixed(1) + "px"); }); }, { passive: true });
  }
}

// ---- 18+ gate, remembered per browser
function gate() {
  if (store.get("choochie18") === "1") return;
  if (/(privacy|terms)\.html$/.test(location.pathname)) return;   // legal pages stay readable for everyone
  const g = document.createElement("div");
  g.className = "gate";
  g.innerHTML = `<div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-h">
      <div class="gate-fang">18+</div><h2 id="gate-h">Adults only</h2>
      <p>Choochie is a flirty, bratty companion with an optional uncensored side. You have to be 18 or older to be here.</p>
      <div class="gate-btns"><button class="btn btn-primary" id="gate-yes">I'm 18 or older</button><a class="btn btn-ghost" href="https://www.google.com">Take me away</a></div></div>`;
  document.body.appendChild(g); document.body.classList.add("locked");
  $("#gate-yes", g).addEventListener("click", () => { store.set("choochie18", "1"); g.remove(); document.body.classList.remove("locked"); });
  try { $("#gate-yes", g).focus({ preventScroll: true }); } catch (e) {}   // keyboard focus starts inside the dialog
}

// ---- plans (one source for the home page, plans page and account page)
const PLANS = [
  { key: "guest", name: "Guest", price: "No account", blurb: "She lives on your desktop and reacts with her own built-in lines." },
  { key: "free", name: "Free account", price: "$0", blurb: "Log in once and she gets a real brain: 500 energy to start, then 50 a day, no card needed." },
  { key: "pet", name: "Pet", price: "$9.99 / mo", blurb: "5× the energy every day, and her 18+ side.", tier: 1 },
  { key: "devoted", name: "Devoted", price: "$19.99 / mo", blurb: "10× energy. She texts you, sees your screen when you ask, watches with you.", tier: 2, popular: true },
  { key: "obsessed", name: "Obsessed", price: "$39.99 / mo", blurb: "Unlimited* everyday use, her in your Discord server, builds before anyone else.", tier: 3 },
];
const ROWS = [
  ["Lives on your desktop, outfits, tasks and mini games", [1, 1, 1, 1, 1]],
  ["AI chat and her voice", [0, 1, 1, 1, 1]],
  ["Energy", ["-", "500 to start + 50 / day", "250 / day", "500 / day", "Unlimited*"]],
  ["Long-term memory and her diary", [0, 1, 1, 1, 1]],
  ["Chat on this website: text, pictures, voice and video calls", [0, 1, 1, 1, 1]],
  ["Monthly leaderboard", [0, 1, 1, 1, 1]],
  ["18+ mode in the app", [0, 0, 1, 1, 1]],
  ["Send her photos in the app", [0, 0, 1, 1, 1]],
  ["Text her on Discord", [0, 0, 0, 1, 1]],
  ["She messages you first on Discord", [0, 0, 0, 1, 1]],
  ["She looks at your screen or webcam (when you ask)", [0, 0, 0, 1, 1]],
  ["She peeks at what you're doing on her own (opt-in)", [0, 0, 0, 1, 1]],
  ["Watch & play together", [0, 0, 0, 1, 1]],
  ["She hangs out in your Discord server", [0, 0, 0, 0, 1]],
  ["Early-access builds", [0, 0, 0, 0, 1]],
  ["Add your ideas to the project", [0, 0, 0, 0, 1]],
  ["Roadmap votes per month", ["-", "1", "3", "6", "12"]],
];
function planIndexFor(view) { if (!view) return -1; return view.tier > 0 ? Math.min(4, view.tier + 1) : 1; }
function renderPlans(el, current) {
  if (!el) return;
  const cell = (v, i) => v === 1 ? `<span class="yes" aria-label="Included">✓</span>` : v === 0 ? `<span class="no" aria-label="Not included">—</span>` : `<span class="val">${esc(v)}</span>`;
  el.innerHTML = `
    <div class="plan-cards">${PLANS.map((p, i) => `
      <div class="plan${p.popular ? " popular" : ""}${current === i ? " current" : ""}">
        ${current === i ? '<span class="plan-tag">Your plan</span>' : p.popular ? '<span class="plan-tag">Most popular</span>' : ""}
        <h3>${p.name}</h3><div class="plan-price">${p.price}</div><p>${p.blurb}</p>
        ${p.tier ? (PATREON_LIVE ? `<a class="btn ${p.popular ? "btn-primary" : "btn-ghost"} btn-block" href="${LINKS.patreon}" target="_blank" rel="noopener">${current === i ? "Manage on Patreon" : "Join on Patreon"}</a>`
            : `<a class="btn ${p.popular ? "btn-primary" : "btn-ghost"} btn-block" href="${BUY_HREF}">${current === i ? "Extend on Discord" : "Buy on Discord"}</a><button type="button" class="btn btn-ghost btn-block btn-sm plan-soon" style="margin-top:8px" disabled title="Patreon is coming soon">Patreon - coming soon</button>`)
          : p.key === "free" ? (Auth.signedIn ? `<a class="btn btn-ghost btn-block" href="account.html">Your account</a>` : `<a class="btn btn-ghost btn-block" href="login.html">Log in free</a>`)
          : `<a class="btn btn-ghost btn-block" href="downloads.html">Download</a>`}
      </div>`).join("")}
    </div>
    <div class="table-wrap"><table class="compare">
      <thead><tr><th scope="col">What you get</th>${PLANS.map((p, i) => `<th scope="col"${current === i ? ' class="current"' : ""}>${p.name}</th>`).join("")}</tr></thead>
      <tbody>${ROWS.map(([label, vals]) => `<tr><th scope="row">${label}</th>${vals.map((v, i) => `<td${current === i ? ' class="current"' : ""}>${cell(v, i)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
    <p class="fine">* Generous daily fair-use limit to prevent abuse. ${PATREON_LIVE ? "Plans are paid through Patreon (Patreon may add taxes where you live). Subscriptions renew monthly through Patreon until you cancel there." : "Patreon is coming soon. Until then you buy a plan through a ticket on her Discord and pay directly; you get a code that unlocks the plan for the time you paid for (it doesn't renew by itself)."} Every plan talks to the same brain - supporting only adds energy and features. Ko-fi treats buy extra energy that never expires.</p>`;
}

// ---- latest release info from GitHub (used by home + downloads)
async function releases() {
  const r = await fetch(`https://api.github.com/repos/${LINKS.repo}/releases?per_page=30`, { headers: { Accept: "application/vnd.github+json" } });
  if (!r.ok) throw new Error("github " + r.status);
  return (await r.json()).filter(x => !x.draft);
}
const setupAsset = rel => (rel.assets || []).find(a => /^Choochie-Setup-.*\.exe$/i.test(a.name));
const fmtDate = s => s ? new Date(s).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";

// tiny, safe markdown for release notes: headings, bullets, bold, inline code, links
function md(src) {
  const inline = s => esc(s).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');
  let out = "", list = false;
  for (const raw of String(src || "").split(/\r?\n/)) {
    const line = raw.trimEnd(), b = line.match(/^\s*[-*]\s+(.*)/), h = line.match(/^#{1,4}\s+(.*)/);
    if (b) { if (!list) { out += "<ul>"; list = true; } out += `<li>${inline(b[1])}</li>`; continue; }
    if (list) { out += "</ul>"; list = false; }
    if (h) out += `<h4>${inline(h[1])}</h4>`; else if (line.trim()) out += `<p>${inline(line)}</p>`;
  }
  return out + (list ? "</ul>" : "");
}

function toast(msg, bad) {
  let t = $("#toast"); if (!t) { t = document.createElement("div"); t.id = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
  t.textContent = msg; t.className = "toast show" + (bad ? " bad" : ""); clearTimeout(t._h); t._h = setTimeout(() => t.className = "toast", 3600);
}

renderChrome(); gate(); document.readyState === "loading" ? addEventListener("DOMContentLoaded", motion) : motion();
// provider icons (also used by login + account pages)
const ICONS = {
  patreon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.5" cy="9.5" r="6.5" fill="currentColor"/><rect x="2.5" y="3" width="4" height="18" rx="1" fill="currentColor"/></svg>',
  discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17.2 17.2 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.3 12.3 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17.1 17.1 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7zM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1z"/></svg>',
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
};
ICONS.x = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-4.9-6.4L6.4 22H3.3l7.3-8.3L2.9 2h6.4l4.4 5.9L18.9 2zm-1.1 18.1h1.7L8.3 3.8H6.5l11.3 16.3z"/></svg>';
const PROV_NAMES = { patreon: "Patreon", discord: "Discord", x: "X", google: "Google" };
const PROV_ORDER = ["discord", "patreon", "x", "google"];
// /pet/ai/auth/providers may answer {providers:{discord:true,...}} or {providers:[{id:"discord",...}|"discord"]}: normalise to {id:true}
function providerMap(j) {
  const p = j && j.providers, out = {};
  if (Array.isArray(p)) p.forEach(x => { const id = typeof x === "string" ? x : x && (x.id || x.p || x.name); if (id && !(x && x.enabled === false)) out[String(id).toLowerCase()] = true; });
  else if (p && typeof p === "object") Object.keys(p).forEach(k => { if (p[k]) out[k.toLowerCase()] = true; });
  if (out.twitter) out.x = true;
  return out;
}

// ---- energy: ONE currency for the desktop app and the web chat. e = the server's `energy` object
// ({ left, max, extra, starter, code, perDollar, buyUrl, resetsAt, costs, unlimited }): left/max = today's daily energy, extra = bought/starter (never expires)
const kofiUrl = o => /^https:\/\//.test(o.buyUrl || "") ? o.buyUrl : LINKS.kofi;
const untilTxt = ts => { const ms = Number(ts || 0) - Date.now(); if (!(ms > 0)) return "soon"; const t = Math.ceil(ms / 60000), h = Math.floor(t / 60), m = t % 60; return "in " + (h ? h + " h " : "") + m + " min"; };
// the rates + numbered "copy code, open Ko-fi, paste, wait" steps
function energyBuyHTML(e, claimHref) {
  if (!e) return "";
  if (e.unlimited) return `<p class="ob-note">This account has unlimited energy, so there's nothing to buy.</p>`;
  const n = v => Number(v || 0).toLocaleString(), max = Number(e.max || 0), per = Number(e.perDollar) || 0;
  const code = e.code ? `<span class="ob-chip"><code>${esc(e.code)}</code><button type="button" class="btn btn-soft btn-sm" data-copy-code="${esc(e.code)}" aria-label="Copy your energy code ${esc(e.code)}">Copy</button></span>` : ` <span class="ob-dim">(your code isn't ready yet - refresh in a minute)</span>`;
  return `<div class="ob">
    <p class="ob-bal"><span>${max > 0 ? `<b>${n(e.left)}</b> / ${n(max)} left today` : "No daily refill"}</span>${Number(e.extra) > 0 ? `<span class="ob-bought">+${n(e.extra)} extra</span>` : ""}</p>
    ${per ? `<ul class="ob-rates" aria-label="What a tip gets you">${[1, 5, 10].map(d => `<li><b>$${d}</b><span>${n(Math.floor(d * per))} energy</span></li>`).join("")}</ul>` : ""}
    <ol class="ob-steps">
      <li><span class="ob-n" aria-hidden="true">1</span><div><strong>Copy your code</strong>${code}</div></li>
      <li><span class="ob-n" aria-hidden="true">2</span><div><strong>Open Ko-fi and tip, or buy the Energy item</strong> <span class="ob-dim">($5+ recommended)</span><a class="btn btn-primary btn-sm ob-kofi" href="${esc(kofiUrl(e))}" target="_blank" rel="noopener">Open Ko-fi</a></div></li>
      <li><span class="ob-n" aria-hidden="true">3</span><div><strong>Paste the code in the Ko-fi message box before you pay</strong> <span class="ob-dim">(the "Say something nice" field) - the code is how we know it's you.</span></div></li>
      <li><span class="ob-n" aria-hidden="true">4</span><div><strong>Energy arrives within a minute or two</strong> <button type="button" class="linkish" data-energy-refresh>Refresh balance</button></div></li>
    </ol>
    <p class="fine ob-fine">Forgot the code? <a href="${esc(claimHref || "account.html#claim")}">Claim it with your Ko-fi receipt</a>. Bought energy never expires, is used after your daily energy, and works everywhere: this website's chat and the desktop app on every PC signed in to your account.</p>
  </div>`;
}

// the energy bar at the top of every page (inside the chat page's top bar), and the buy / "out of energy" panel
const Energy = (() => {
  const KEY = "choochie.energy", FRESH = 15000, bolt = '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M13.2 2 4.5 13.4h6.1L9.8 22l8.7-11.4h-6.1z"/></svg>';
  let e = null, peak = 0, out = null, el = null, shown = { pct: -1, num: null }, modal = null, from = null, raf = 0;
  const ss = { get() { try { return JSON.parse(sessionStorage.getItem(KEY) || "null"); } catch (_) { return null; } }, set(v) { try { v ? sessionStorage.setItem(KEY, JSON.stringify(v)) : sessionStorage.removeItem(KEY); } catch (_) {} } };
  const n = v => Number(v || 0).toLocaleString();
  const cheap = x => Math.max(1, Number(x && x.costs && x.costs.text) || 1);
  const isOut = x => !!x && !x.unlimited && Number(x.left || 0) < cheap(x) && Number(x.extra || 0) < cheap(x);
  // daily | extra (daily used up, living on bought/starter energy) | out | inf (admin)
  const mode = x => x.unlimited ? "inf" : Number(x.max) > 0 && Number(x.left) >= cheap(x) ? "daily" : Number(x.extra) > 0 ? "extra" : "out";

  function mount() {
    const old = el, slot = old ? null : $("#ebar-slot"), nav = $("#site-nav");
    if (!old && !slot && !nav) return;
    const compact = old ? old.classList.contains("ebar-compact") : !!slot;
    el = document.createElement(Auth.signedIn ? "button" : "a");
    el.className = "ebar" + (compact ? " ebar-compact" : "");
    if (old) old.replaceWith(el); else if (slot) slot.replaceWith(el); else { nav.after(el); stick(nav); }
    if (!Auth.signedIn) {
      el.href = "login.html"; el.classList.add("guest");
      el.innerHTML = `<span class="ebar-in"><span class="ebar-bolt">${bolt}</span><span class="ebar-guest"><b>Sign in to get free energy</b><span class="ebar-long"> - one balance for the web chat and the desktop app</span></span><span class="ebar-cta">Sign in</span></span>`;
      return;
    }
    el.type = "button"; el.setAttribute("aria-haspopup", "dialog");
    el.innerHTML = `<span class="ebar-in"><span class="ebar-bolt">${bolt}</span><span class="ebar-name">Energy</span>
      <span class="ebar-track"><i class="ebar-ghost"></i><i class="ebar-fill"></i></span>
      <span class="ebar-num" aria-hidden="true">…</span><span class="ebar-chip" hidden></span><span class="ebar-tag" hidden></span><span class="ebar-plus" aria-hidden="true">+</span></span>`;
    el.setAttribute("aria-label", "Energy - loading. Open to get more energy");
    el.classList.add("loading");
    el.addEventListener("click", () => open(isOut(e)));
  }
  // under the sticky header: it sticks right below it, whatever the header's height
  function stick(nav) { const h = () => document.documentElement.style.setProperty("--navh", nav.offsetHeight + "px"); h(); addEventListener("resize", h); if (window.ResizeObserver) new ResizeObserver(h).observe(nav); }
  function countTo(node, to, fmt) {
    cancelAnimationFrame(raf);
    const fromV = shown.num, t0 = performance.now();
    if (calm || fromV == null || !isFinite(to) || fromV === to) { node.innerHTML = fmt(to); shown.num = to; return; }
    const step = t => { const k = Math.min(1, (t - t0) / 650), v = Math.round(fromV + (to - fromV) * (1 - Math.pow(1 - k, 3))); node.innerHTML = fmt(v); if (k < 1) raf = requestAnimationFrame(step); else shown.num = to; };
    raf = requestAnimationFrame(step);
  }
  function render() {
    if (!el || !e || !Auth.signedIn) return;
    const m = mode(e), left = Number(e.left || 0), max = Number(e.max || 0), extra = Number(e.extra || 0);
    if (extra > peak) peak = extra;
    const pct = m === "inf" ? 100 : m === "daily" ? Math.max(0, Math.min(100, left / max * 100)) : m === "extra" ? Math.max(4, Math.min(100, extra / Math.max(max, peak, 1) * 100)) : 0;
    el.classList.remove("loading", "m-daily", "m-extra", "m-out", "m-inf", "low");
    el.classList.add("m-" + m); if (m === "daily" && pct <= 20) el.classList.add("low");
    const fill = $(".ebar-fill", el), ghost = $(".ebar-ghost", el), num = $(".ebar-num", el), chip = $(".ebar-chip", el), tag = $(".ebar-tag", el), name = $(".ebar-name", el);
    // depletion: the fill drops first, a soft "ghost" follows; refills jump the ghost straight up
    if (pct >= shown.pct) { ghost.style.transition = "none"; ghost.style.width = pct + "%"; void ghost.offsetWidth; ghost.style.transition = ""; }
    else ghost.style.width = pct + "%";
    fill.style.width = pct + "%"; shown.pct = pct;
    name.textContent = m === "extra" ? "Extra energy" : "Energy";
    if (m === "inf") { cancelAnimationFrame(raf); num.textContent = "∞"; shown.num = null; }
    else if (m === "daily") countTo(num, left, v => `<b>${n(v)}</b><small> / ${n(max)}</small>`);
    else countTo(num, m === "extra" ? extra : 0, v => `<b>${n(v)}</b>${m === "extra" ? "<small> extra</small>" : ""}`);
    chip.hidden = !(m === "daily" && extra > 0); chip.innerHTML = "+" + n(extra) + ' <span class="ebar-x">extra</span>';
    tag.hidden = !(m === "extra" || m === "out"); tag.textContent = m === "out" ? "Get more" : max > 0 ? "daily refills " + untilTxt(e.resetsAt) : "never expires";
    el.setAttribute("aria-label", (m === "inf" ? "Energy: unlimited"
      : m === "daily" ? `Energy: ${n(left)} of ${n(max)} left today${extra > 0 ? ", plus " + n(extra) + " extra" : ""}`
      : m === "extra" ? `Daily energy used up. ${n(extra)} extra energy left`
      : "Out of energy") + ". Open to get more energy");
  }
  // new numbers from the server (page load, every chat reply, a refresh). Opens "Out of energy" when the balance just ran out.
  function set(x, quiet) {
    if (!x || typeof x !== "object") return;
    const wasOut = out; e = x; out = isOut(x);
    ss.set({ at: Date.now(), e: x, peak: Math.max(peak, Number(x.extra || 0)) });
    render();
    if (modal && !modal.hidden) fillModal();
    if (out && wasOut === false && !quiet) open(true);
    document.dispatchEvent(new CustomEvent("energy", { detail: x }));
  }
  function ensureModal() {
    if (modal) return modal;
    modal = document.createElement("div"); modal.className = "emodal"; modal.hidden = true;
    modal.setAttribute("role", "dialog"); modal.setAttribute("aria-modal", "true"); modal.setAttribute("aria-labelledby", "em-h");
    modal.innerHTML = `<div class="emodal-card" tabindex="-1">
      <div class="emodal-h"><span class="emodal-bolt" aria-hidden="true">${bolt}</span><h3 id="em-h">Get more energy</h3><button type="button" class="emodal-x" aria-label="Close">✕</button></div>
      <p class="emodal-lead" id="em-lead"></p><div id="em-body"></div>
      <p class="emodal-plans"><a href="plans.html">See plans</a> - a plan gives you more energy every day.</p></div>`;
    document.body.appendChild(modal);
    $(".emodal-x", modal).addEventListener("click", close);
    modal.addEventListener("click", ev => { if (ev.target === modal) close(); });
    modal.addEventListener("keydown", ev => {
      if (ev.key === "Escape") { ev.stopPropagation(); close(); return; }
      if (ev.key !== "Tab") return;   // keep keyboard focus inside the panel
      const f = [...modal.querySelectorAll("a[href],button:not([disabled])")].filter(x => x.offsetParent !== null); if (!f.length) return;
      const a = f[0], b = f[f.length - 1];
      if (ev.shiftKey && document.activeElement === a) { ev.preventDefault(); b.focus(); } else if (!ev.shiftKey && document.activeElement === b) { ev.preventDefault(); a.focus(); }
    });
    return modal;
  }
  let outMode = false;
  function fillModal() {
    const here = (location.pathname.split("/").pop() || "index.html") === "account.html";
    $("#em-h", modal).textContent = outMode ? "Out of energy" : "Get more energy";
    modal.classList.toggle("is-out", outMode);
    if (!e) { $("#em-lead", modal).textContent = "Loading your energy…"; $("#em-body", modal).innerHTML = ""; return; }
    const max = Number(e.max || 0);
    $("#em-lead", modal).innerHTML = e.unlimited ? "" : outMode
      ? `She needs energy to keep talking. ${max > 0 ? `Your daily energy refills <b>${esc(untilTxt(e.resetsAt))}</b> - or buy` : "Buy"} more to continue right now.`
      : `One energy for everything: the web chat here and the desktop app use the same balance. Daily energy is used first, then your extra energy.${e.costs ? ` A message uses ${n(e.costs.text)}; her voice, photos and voice messages use a bit more.` : ""}`;
    $("#em-body", modal).innerHTML = energyBuyHTML(e, here ? "#claim" : "account.html#claim");
  }
  function open(isOutNow) {
    if (!Auth.signedIn) { location.href = "login.html"; return; }
    ensureModal(); outMode = !!isOutNow; fillModal();
    if (modal.hidden) from = document.activeElement;
    modal.hidden = false; document.body.classList.add("emodal-open");
    const f = $("[data-copy-code]", modal) || $(".emodal-x", modal); try { f.focus({ preventScroll: true }); } catch (_) {}
    if (!e) refresh();
  }
  function close() { if (!modal || modal.hidden) return; modal.hidden = true; document.body.classList.remove("emodal-open"); if (from && from.focus) try { from.focus({ preventScroll: true }); } catch (_) {} from = null; }
  // GET the account (also handed to the page via the "account" event)
  async function refresh() {
    if (!Auth.signedIn) return null;
    try { const v = await api("/pet/ai/v1/account"); set(v.energy, true); document.dispatchEvent(new CustomEvent("account", { detail: v })); return v; }
    catch (err) { if (err.status === 401) { ss.set(null); e = null; if (el) mount(); } throw err; }   // signed out elsewhere: the bar turns into the sign-in invite
  }
  function init() {
    mount();
    if (!Auth.signedIn) { ss.set(null); return; }
    const c = ss.get();
    if (c && c.e) { peak = Number(c.peak || 0); e = c.e; out = isOut(e); render(); }
    // pages that load the account themselves (data-energy="self") hand it over with Energy.set
    if (document.body.dataset.energy !== "self" && !(c && Date.now() - c.at < FRESH)) refresh().catch(() => {});
  }
  return { init, set, open, close, refresh, get: () => e, isOut };
})();
document.addEventListener("click", async ev => {
  const b = ev.target.closest("[data-copy-code]");
  if (b) {
    const code = b.dataset.copyCode; let ok = false;
    try { await navigator.clipboard.writeText(code); ok = true; } catch (_) {
      const t = document.createElement("textarea"); t.value = code; t.setAttribute("readonly", ""); t.style.cssText = "position:fixed;opacity:0";
      document.body.appendChild(t); t.select(); try { ok = document.execCommand("copy"); } catch (__) {} t.remove();
    }
    if (ok) { b.textContent = "Copied"; clearTimeout(b._h); b._h = setTimeout(() => b.textContent = "Copy", 2000); toast("Code copied - paste it into the Ko-fi message."); }
    else toast("Couldn't copy - select the code and copy it by hand.", true);
    return;
  }
  const r = ev.target.closest("[data-energy-refresh]"); if (!r || !Auth.signedIn) return;
  r.disabled = true; r.textContent = "Refreshing…";
  try { await Energy.refresh(); toast("Balance updated."); const nr = $("[data-energy-refresh]"); if (nr) nr.focus({ preventScroll: true }); }
  catch (err) { r.disabled = false; r.textContent = "Refresh balance"; toast("Couldn't refresh - try again in a few seconds.", true); }
});
Energy.init();
