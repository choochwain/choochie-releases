// Fill this in with your server invite (e.g. "https://discord.gg/xxxxxxx"). Empty = "coming soon".
const DISCORD_INVITE = "";

const REPO = "choochwain/choochie-releases";
const RELEASES = `https://github.com/${REPO}/releases`;

// 18+ gate, remembered per browser
(function gate() {
  const g = document.getElementById("gate");
  let ok = false;
  try { ok = localStorage.getItem("choochie18") === "1"; } catch (e) {}
  if (ok) return;
  g.hidden = false; document.body.classList.add("locked");
  document.getElementById("gate-yes").addEventListener("click", () => {
    try { localStorage.setItem("choochie18", "1"); } catch (e) {}
    g.hidden = true; document.body.classList.remove("locked");
  });
})();

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
