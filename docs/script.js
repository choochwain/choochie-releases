// Discord invite lives in site.js (LINKS.discord).
const DISCORD_INVITE = LINKS.discord;

const REPO = LINKS.repo;
const RELEASES = `https://github.com/${REPO}/releases`;

// Discord
(function discord() {
  const b = document.getElementById("discord-btn"), n = document.getElementById("discord-note");
  if (DISCORD_INVITE) { b.href = DISCORD_INVITE; n.textContent = "Keep it civil; she's PG-13 in there."; }
  else { b.textContent = "Discord server: link coming soon"; b.classList.remove("btn-primary"); b.classList.add("btn-ghost"); b.removeAttribute("target"); b.addEventListener("click", e => e.preventDefault()); n.textContent = "Until then, Ko-fi messages and Patreon posts reach her creator."; }
})();

// Latest release: find the Setup .exe and show version + size
(async function release() {
  const btn = document.getElementById("dl-btn"), meta = document.getElementById("dl-meta"), hv = document.getElementById("hero-version"), hero = document.getElementById("hero-dl");
  const fallback = () => { meta.innerHTML = `Grab it from the <a href="${RELEASES}">releases page</a>.`; hv.textContent = "Windows installer · unsigned (see note below)"; };
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error(r.status);
    const rel = await r.json();
    const asset = (rel.assets || []).find(a => /^Choochie-Setup-.*\.exe$/i.test(a.name));
    if (!asset) throw new Error("no setup asset");
    const mb = (asset.size / 1048576).toFixed(0);
    const date = rel.published_at ? new Date(rel.published_at).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" }) : "";
    btn.href = asset.browser_download_url; hero.href = asset.browser_download_url;
    btn.textContent = `Download Choochie ${rel.tag_name.replace(/^v/, "")}`;
    meta.innerHTML = `${asset.name} · ${mb} MB${date ? " · " + date : ""} · <a href="${RELEASES}">all versions</a>`;
    hv.textContent = `Version ${rel.tag_name.replace(/^v/, "")} · ${mb} MB · Windows installer`;
  } catch (e) { fallback(); }
})();

// plans + latest update note
(async function plans() {
  renderPlans(document.getElementById("plans-box"), Auth.signedIn ? 1 : -1);
  if (Auth.signedIn) { try { renderPlans(document.getElementById("plans-box"), planIndexFor(await api("/pet/ai/v1/account"))); } catch (e) {} }
})();
(async function latest() {
  const el = document.getElementById("latest-note");
  try { const r = (await releases()).find(x => !x.prerelease); if (!r) throw 0;
    const first = (r.body || "").split(/\r?\n/).map(l => l.replace(/^[-*#\s]+/, "").trim()).filter(Boolean).slice(0, 3);
    el.innerHTML = `<strong>${esc(r.name || r.tag_name)}</strong> · <span class="fine">${fmtDate(r.published_at)}</span>${first.length ? "<ul>" + first.map(l => `<li>${esc(l.replace(/\*\*/g, ""))}</li>`).join("") + "</ul>" : ""}`;
  } catch (e) { el.textContent = "See the updates page."; }
})();
