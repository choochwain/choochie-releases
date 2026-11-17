// Shared bits for every page: header, footer, 18+ gate, sign-in state, server calls, plans table.
const API = "https://stream-alerts-bot.onrender.com";
const LINKS = {
  repo: "choochwain/choochie-releases",
  patreon: "https://www.patreon.com/ChooChwain",
  kofi: "https://ko-fi.com/dahmeows",
  beacons: "https://beacons.ai/choochwain",
  discord: "",          // your Discord invite, e.g. "https://discord.gg/xxxxxxx" (empty = hidden)
};

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
  const headers = Object.assign({}, opts.headers || {});
  if (Auth.token) headers.Authorization = "Bearer " + Auth.token;
  if (opts.body && typeof opts.body !== "string") { headers["Content-Type"] = "application/json"; opts.body = JSON.stringify(opts.body); }
  let r;
  try { r = await fetch(API + path, Object.assign({}, opts, { headers })); }
  catch (e) { throw Object.assign(new Error("Her server is waking up - try again in a few seconds."), { status: 0 }); }
  let j = null; try { j = await r.json(); } catch (e) {}
  if (r.status === 401 && path.startsWith("/pet/ai/v1/account")) Auth.clear();
  if (!r.ok) throw Object.assign(new Error((j && j.error) || "Something went wrong (" + r.status + ")"), { status: r.status, data: j });
  return j;
}

// a fresh login lands on account.html#t=<session>: keep it before the header draws
(function takeSession() { const f = new URLSearchParams(location.hash.slice(1)); if (f.get("t")) Auth.set(f.get("t")); })();

// ---- header + footer
const NAV = [
  ["index.html", "Home"], ["index.html#features", "Features"], ["plans.html", "Plans"],
  ["downloads.html", "Download"], ["updates.html", "Updates"], ["roadmap.html", "Roadmap"],
];
function renderChrome() {
  const here = location.pathname.split("/").pop() || "index.html";
  const nav = $("#site-nav");
  if (nav) {
    nav.className = "nav";
    const name = store.get("choochie.name");
    nav.innerHTML = `
      <a class="brand" href="index.html"><img src="img/favicon.png" alt="" width="28" height="28"><span>Choochie</span></a>
      <button class="nav-toggle" aria-label="Menu" aria-expanded="false"><span></span><span></span></button>
      <nav>${NAV.map(([h, t]) => `<a href="${h}"${h === here ? ' aria-current="page"' : ""}>${t}</a>`).join("")}
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
      <div><strong>Choochie</strong><p class="fine">A bratty 3D desktop pet with a real AI brain. Windows 10 / 11. 18+ only.</p></div>
      <div><strong>App</strong><a href="downloads.html">Download</a><a href="updates.html">Updates</a><a href="roadmap.html">Roadmap</a><a href="plans.html">Plans</a></div>
      <div><strong>Her</strong><a href="${LINKS.patreon}" target="_blank" rel="noopener">Patreon</a><a href="${LINKS.kofi}" target="_blank" rel="noopener">Ko-fi</a><a href="${LINKS.beacons}" target="_blank" rel="noopener">All links</a>${LINKS.discord ? `<a href="${LINKS.discord}" target="_blank" rel="noopener">Discord</a>` : ""}</div>
      <div><strong>Legal</strong><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a></div>
    </div>`;
}

// ---- 18+ gate, remembered per browser
function gate() {
  if (store.get("choochie18") === "1") return;
  const g = document.createElement("div");
  g.className = "gate";
  g.innerHTML = `<div class="gate-card" role="dialog" aria-modal="true" aria-labelledby="gate-h">
      <div class="gate-fang">18+</div><h2 id="gate-h">Adults only</h2>
      <p>Choochie is a flirty, bratty companion with an optional uncensored side. You have to be 18 or older to be here.</p>
      <div class="gate-btns"><button class="btn btn-primary" id="gate-yes">I'm 18 or older</button><a class="btn btn-ghost" href="https://www.google.com">Take me away</a></div></div>`;
  document.body.appendChild(g); document.body.classList.add("locked");
  $("#gate-yes", g).addEventListener("click", () => { store.set("choochie18", "1"); g.remove(); document.body.classList.remove("locked"); });
}

// ---- plans (one source for the home page, plans page and account page)
const PLANS = [
  { key: "guest", name: "Guest", price: "No account", blurb: "She lives on your desktop and reacts with her own built-in lines." },
  { key: "free", name: "Free account", price: "$0", blurb: "Log in once and she gets a real brain: 500 starter energy, no card needed." },
  { key: "pet", name: "Pet", price: "$9.99 / mo", blurb: "5× the energy every day, and her 18+ side.", tier: 1 },
  { key: "devoted", name: "Devoted", price: "$19.99 / mo", blurb: "10× energy. She texts you, sees your screen when you ask, watches with you.", tier: 2, popular: true },
  { key: "obsessed", name: "Obsessed", price: "$39.99 / mo", blurb: "Unlimited energy, her in your Discord server, builds before anyone else.", tier: 3 },
];
const ROWS = [
  ["Lives on your desktop, outfits, games", [1, 1, 1, 1, 1]],
  ["AI chat and her voice", [0, 1, 1, 1, 1]],
  ["Energy", ["-", "500 once", "250 / day", "500 / day", "Unlimited*"]],
  ["Long-term memory and her diary", [0, 1, 1, 1, 1]],
  ["Chat with her on this website", [0, 1, 1, 1, 1]],
  ["18+ mode", [0, 0, 1, 1, 1]],
  ["Send her pictures", [0, 0, 1, 1, 1]],
  ["Discord DMs - she texts you first", [0, 0, 0, 1, 1]],
  ["She looks at your screen or webcam (when you ask)", [0, 0, 0, 1, 1]],
  ["Watch & play together", [0, 0, 0, 1, 1]],
  ["She hangs out in your Discord server", [0, 0, 0, 0, 1]],
  ["Streaming tools (Choochie Cam)", [0, 0, 0, 0, 1]],
  ["Early-access builds", [0, 0, 0, 0, 1]],
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
        ${p.tier ? `<a class="btn ${p.popular ? "btn-primary" : "btn-ghost"} btn-block" href="${LINKS.patreon}" target="_blank" rel="noopener">${current === i ? "Manage on Patreon" : "Join on Patreon"}</a>`
          : p.key === "free" ? (Auth.signedIn ? `<a class="btn btn-ghost btn-block" href="account.html">Your account</a>` : `<a class="btn btn-ghost btn-block" href="login.html">Log in free</a>`)
          : `<a class="btn btn-ghost btn-block" href="downloads.html">Download</a>`}
      </div>`).join("")}
    </div>
    <div class="table-wrap"><table class="compare">
      <thead><tr><th scope="col">What you get</th>${PLANS.map((p, i) => `<th scope="col"${current === i ? ' class="current"' : ""}>${p.name}</th>`).join("")}</tr></thead>
      <tbody>${ROWS.map(([label, vals]) => `<tr><th scope="row">${label}</th>${vals.map((v, i) => `<td${current === i ? ' class="current"' : ""}>${cell(v, i)}</td>`).join("")}</tr>`).join("")}</tbody>
    </table></div>
    <p class="fine">* Unlimited = a generous daily fair-use limit. Every plan talks to the same brain - supporting only adds energy and features. Ko-fi treats buy extra energy that never expires. Patreon unlocks within seconds of logging in with it.</p>`;
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

renderChrome(); gate();
// provider icons (also used by login + account pages)
const ICONS = {
  patreon: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="14.5" cy="9.5" r="6.5" fill="currentColor"/><rect x="2.5" y="3" width="4" height="18" rx="1" fill="currentColor"/></svg>',
  discord: '<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M19.6 5.3A17 17 0 0 0 15.4 4l-.5 1.1a15.6 15.6 0 0 0-5.8 0L8.6 4a17 17 0 0 0-4.2 1.3C1.7 9.3 1 13.2 1.3 17a17.2 17.2 0 0 0 5.2 2.6l1.1-1.8a11 11 0 0 1-1.7-.8l.4-.3a12.3 12.3 0 0 0 11.4 0l.4.3-1.7.8 1.1 1.8a17.1 17.1 0 0 0 5.2-2.6c.4-4.4-.7-8.3-3.1-11.7zM8.5 14.7c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1zm7 0c-1 0-1.9-1-1.9-2.1s.8-2.1 1.9-2.1 1.9 1 1.9 2.1-.8 2.1-1.9 2.1z"/></svg>',
  google: '<svg viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>',
};
const PROV_NAMES = { patreon: "Patreon", discord: "Discord", google: "Google" };
