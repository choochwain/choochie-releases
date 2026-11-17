// Home page only: show the latest version next to the download buttons.
(async function release() {
  const hv = document.getElementById("hero-version"), meta = document.getElementById("dl-meta");
  try {
    const r = await fetch(`https://api.github.com/repos/${LINKS.repo}/releases/latest`, { headers: { Accept: "application/vnd.github+json" } });
    if (!r.ok) throw new Error(r.status);
    const rel = await r.json(), asset = setupAsset(rel);
    if (!asset) throw new Error("no setup asset");
    const v = rel.tag_name.replace(/^v/, ""), mb = (asset.size / 1048576).toFixed(0);
    if (hv) hv.textContent = `Version ${v} · ${mb} MB`;
    if (meta) meta.innerHTML = `Version ${esc(v)} · ${mb} MB${rel.published_at ? " · " + fmtDate(rel.published_at) : ""} · <a href="downloads.html">install guide</a>`;
  } catch (e) { if (meta) meta.innerHTML = `Windows 10 / 11 · <a href="downloads.html">install guide</a>`; }
})();
