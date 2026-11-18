

const frag = LOGIN_FRAG;   // site.js already read (and cleared) the address bar
const freshLogin = !!(frag.get("c") || frag.get("t"));
let view = null;
const fmt = n => Number(n).toLocaleString();
function render(v) {
  view = v; store.set("choochie.name", v.name || "You");
  $("#ac-head").innerHTML = `<h1>Hi${v.name ? ", " + esc(v.name) : ""}~</h1><p class="sub">Account since ${fmtDate(v.since)}.</p>`;
  $("#ac-main").hidden = false;
  $("#ac-av").textContent = (v.name || "?")[0].toUpperCase(); $("#ac-name").textContent = v.name || "You";
  const planName = v.tier > 0 ? v.tierName : "Free account";
  $("#ac-plan").textContent = planName + (v.until ? " · renews " + fmtDate(v.until) : "");
  const max = v.energy.max, left = v.energy.left;
  $("#ac-elabel").textContent = max > 0 ? `${fmt(left)} / ${fmt(max)}` : "No daily refill";
  $("#ac-meter").style.width = (max > 0 ? Math.round(left / max * 100) : (v.energy.extra > 0 ? 100 : 0)) + "%";
  $("#ac-enote").textContent = max > 0 ? "Refills every day at midnight UTC. When it's gone she uses your extra energy." : "Free accounts run on the extra energy below. Join a plan for a daily refill.";
  $("#ac-extra").textContent = fmt(v.energy.extra); $("#ac-pcs").textContent = v.devices; $("#ac-votes").textContent = (v.votes || [])[Math.min(v.tier, 3)] || 0;
  $("#ac-cta").innerHTML = (v.tier < 3 ? `<a class="btn btn-primary btn-sm" href="${LINKS.patreon}" target="_blank" rel="noopener">${v.tier > 0 ? "Upgrade on Patreon" : "Join on Patreon"}</a>` : "")
    + (v.energy.code ? `<a class="btn btn-ghost btn-sm" href="#energy">Buy extra energy</a>` : `<a class="btn btn-ghost btn-sm" href="${LINKS.kofi}" target="_blank" rel="noopener">Buy extra energy</a>`);
  $("#ac-adult-wrap").hidden = false;
  $("#ac-adult").checked = store.get("choochie.webAdult") === "1" && store.get("choochie.web18") === "1";
  const avail_ = providerMap({ providers: v.providers || {} });
  $("#ac-logins").innerHTML = PROV_ORDER.filter(p => p !== "google" || avail_.google || (v.logins || {}).google).map(p => {
    const on = (v.logins || {})[p], avail = avail_[p];
    return `<div class="login-item"><span class="who">${ICONS[p]}${PROV_NAMES[p]}</span>${on
      ? `<button class="btn btn-ghost btn-sm" data-unlink="${p}">Remove</button>`
      : avail ? `<button class="btn btn-ghost btn-sm" data-link="${p}">Add</button>` : `<span class="fine">soon</span>`}</div>`; }).join("");
  if (v.leaderboard) renderLb(v.leaderboard);
  renderEnergy(v.energy);
  Energy.set(v.energy, true);   // the bar at the top
}
document.addEventListener("account", ev => { if (ev.detail) render(ev.detail); });   // "Refresh balance" in the energy panel
// ---- energy: ONE balance for the web chat and the app, bought on Ko-fi with the account's CH- code (lands in "extra" energy)
function renderEnergy(e) {
  const ok = !!(e && (e.code || e.perDollar || e.unlimited)); $("#energy").hidden = !ok; if (!ok) return;
  $("#ac-energy-lead").innerHTML = e.unlimited ? "" : "One energy for everything: the web chat on this site and the desktop app on every PC signed in to this account. Buy more on Ko-fi with your <b>CH-</b> code.";
  $("#ac-energy").innerHTML = energyBuyHTML(e, "#claim");
}
// ---- claim a Ko-fi tip sent without a code, by the e-mail used there
$("#claim-form").addEventListener("submit", async e => {
  e.preventDefault();
  const email = $("#claim-email").value.trim(), msg = $("#claim-msg"), btn = $("#claim-btn");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) { msg.textContent = "Enter the e-mail address you used on Ko-fi."; $("#claim-email").focus(); return; }
  btn.disabled = true; msg.textContent = "Checking…";
  try {
    const v = await api("/pet/ai/v1/account/claim", { method: "POST", body: { email } });
    render(v); $("#claim-email").value = "";
    const c = v.claimed || {}, n = fmt(c.amount || 0);
    msg.textContent = `Added ${n} energy.`; toast(msg.textContent);
  } catch (err) {
    msg.textContent = err.status === 404 ? "Nothing found for that e-mail. Check the spelling, or wait a minute if you just tipped."
      : err.status === 400 ? "That doesn't look like an e-mail address."
      : err.status === 429 ? "Too many tries - wait an hour and try again."
      : err.message;
  } finally { btn.disabled = false; }
});
// ---- leaderboard (opt-in)
let lbView = null, lbScrolled = false;
function renderLb(b) {
  lbView = b;
  $("#lb-level").textContent = `Lv ${b.level} · ${b.title}`;
  const span = Math.max(1, b.nextLevelAt - b.levelAt), into = Math.max(0, b.points - b.levelAt);
  $("#lb-meter").style.width = Math.min(100, Math.round(into / span * 100)) + "%";
  $("#lb-plabel").textContent = `${fmt(b.points)} / ${fmt(b.nextLevelAt)} pts`;
  $("#lb-note").textContent = `${fmt(Math.max(0, b.nextLevelAt - b.points))} points to level ${b.level + 1}${b.nextTitle ? " (" + b.nextTitle + ")" : ""}. 1 point per energy she uses (app or web chat), bonus for energy you buy.`;
  $("#lb-stats").hidden = !b.joined || b.excluded;
  $("#lb-rank").textContent = b.rank ? "#" + b.rank : "-"; $("#lb-mrank").textContent = b.monthRank ? "#" + b.monthRank : "-"; $("#lb-month").textContent = fmt(b.monthPoints);
  $("#lb-join").checked = !!b.joined;
  if (document.activeElement !== $("#lb-nick")) $("#lb-nick").value = b.nickname || b.suggestedNickname || "";
  if (b.excluded) $("#lb-note").textContent += " Admin and tester accounts stay off the public board.";
  if (!lbScrolled && location.hash === "#leaderboard") { lbScrolled = true; requestAnimationFrame(() => $("#leaderboard").scrollIntoView()); }
}
async function lbPost(body, ok) {
  try { renderLb(await api("/pet/ai/v1/account/leaderboard", { method: "POST", body })); if (ok) toast(ok); }
  catch (err) { const d = err.data || {}; if (d.leaderboard) renderLb(d.leaderboard); else if (lbView) renderLb(lbView); toast(d.message || err.message, true); }
}
$("#lb-join").addEventListener("change", e => {
  const nick = $("#lb-nick").value.trim();
  if (e.target.checked) lbPost({ join: true, nickname: nick }, "You're on the leaderboard~");
  else lbPost({ join: false }, "You left the leaderboard. Your points keep counting privately.");
});
$("#lb-save").addEventListener("click", () => lbPost({ nickname: $("#lb-nick").value.trim() }, lbView && lbView.joined ? "Nickname saved." : "Nickname saved. Switch on \"Show me\" to appear on the board."));
$("#lb-nick").addEventListener("keydown", e => { if (e.key === "Enter") { e.preventDefault(); $("#lb-save").click(); } });
async function load() { try { render(await api("/pet/ai/v1/account")); } catch (e) { if (e.status === 401) location.replace("login.html"); else $("#ac-head .sub").textContent = e.message; } }
const banner = (cls, html) => $("#ac-banner").innerHTML = `<div class="note ${cls}" style="margin-bottom:16px">${html}</div>`;
sessionReady.then(fresh => {
  if (fresh) renderChrome();                                           // the header was drawn before the session arrived
  if (!Auth.signedIn) { location.replace(frag.get("c") ? "login.html?expired=1" : "login.html"); return; }
  if (freshLogin && !frag.get("app")) { let n = null; try { n = sessionStorage.getItem("choochie.next"); sessionStorage.removeItem("choochie.next"); } catch (e) {} if (n === "chat") { location.replace("chat.html"); return; } }
  if (frag.get("app")) banner("good", "<strong>This PC is signed in.</strong> Go back to Choochie - she picks it up in a few seconds.");
  else if (frag.get("new")) banner("good", "<strong>Welcome~</strong> Your account is ready, with starter energy to get to know her.");
  load();
});

document.addEventListener("click", async e => {
  const l = e.target.closest("[data-link]"), u = e.target.closest("[data-unlink]");
  try {
    if (l) { const r = await api("/pet/ai/v1/account/link-start", { method: "POST", body: { p: l.dataset.link } }); location.href = r.url; }
    if (u) { if (!confirm("Remove the " + PROV_NAMES[u.dataset.unlink] + " login from this account?")) return; render(await api("/pet/ai/v1/account/unlink", { method: "POST", body: { p: u.dataset.unlink } })); toast("Removed."); }
  } catch (err) { toast(err.message === "last login" ? "That's your only login - add another one first." : err.message, true); }
});
$("#ac-logout").addEventListener("click", () => { Auth.clear(); location.href = "index.html"; });
$("#ac-admin").addEventListener("click", async () => { const code = prompt("Admin code (owner only):"); if (!code) return; try { render(await api("/pet/ai/v1/account/admin", { method: "POST", body: { code: code.trim() } })); toast("Admin unlocked on this account: unlimited energy in web chat."); } catch (err) { toast(err.message, true); } });
$("#ac-signout-pcs").addEventListener("click", async () => { if (!confirm("Sign out of Choochie on every PC?")) return; try { render(await api("/pet/ai/v1/account/signout-pcs", { method: "POST", body: {} })); toast("All PCs signed out."); } catch (err) { toast(err.message, true); } });
$("#ac-delete").addEventListener("click", async () => {
  if (prompt('This deletes your account and its extra energy. Type DELETE to confirm.') !== "DELETE") return;
  try { await api("/pet/ai/v1/account/delete", { method: "POST", body: {} }); Auth.clear(); location.href = "index.html"; } catch (err) { toast(err.message, true); }
});
$("#ac-adult").addEventListener("change", e => {
  if (e.target.checked && store.get("choochie.web18") !== "1") {
    if (!confirm("18+ mode allows explicit adult chat.\n\nPlease confirm you are 18 or older.")) { e.target.checked = false; return; }
    store.set("choochie.web18", "1");
  }
  store.set("choochie.webAdult", e.target.checked ? "1" : null);
});

