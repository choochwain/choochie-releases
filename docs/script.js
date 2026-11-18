// Home page only: latest version next to the download buttons, the member count, and the light motion layer.
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

// "N members": only shown when her server answers with a real number (stays hidden while it's asleep or unreachable)
const MIN_MEMBERS = 10;                          // below this the line stays hidden
(async function members() {
  const box = document.getElementById("members"), num = document.getElementById("members-n"), lab = document.getElementById("members-l");
  if (!box || !num) return;
  let d = null; try { d = await pub("/pet/ai/v1/counts", 8000); } catch (e) { return; }
  const n = Math.floor(Number(d && d.members));
  if (!(n >= MIN_MEMBERS)) return;              // a tiny number reads worse than nothing
  lab.textContent = n === 1 ? "member" : "members";
  box.hidden = false;
  const fmt = v => v.toLocaleString();
  if (calm) { num.textContent = fmt(n); return; }
  const run = () => {
    const t0 = performance.now(), dur = Math.min(1800, 700 + n / 4);
    const step = t => { const k = Math.min(1, (t - t0) / dur); num.textContent = fmt(Math.round(n * (1 - Math.pow(1 - k, 3)))); if (k < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  if ("IntersectionObserver" in window) { const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); run(); } }); io.observe(box); }
  else run();
})();

// floating sparkles + hearts in the hero: a dozen CSS-animated spans, nothing per frame in JS
(function sparkles() {
  const hero = document.querySelector(".hero");
  if (!hero || calm) return;
  const heart = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 21s-7.5-4.6-9.6-9.3C.9 8.2 3.1 4.5 6.7 4.5c2.1 0 3.6 1.1 4.4 2.6h1.8c.8-1.5 2.3-2.6 4.4-2.6 3.6 0 5.8 3.7 4.3 7.2C19.5 16.4 12 21 12 21z"/></svg>';
  const spark = '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.5l2.2 7.3 7.3 2.2-7.3 2.2L12 20.5l-2.2-7.3L2.5 11l7.3-2.2z"/></svg>';
  const colors = ["var(--rose)", "var(--red-light)", "var(--rose-soft)", "#ff8fab"];
  const layer = document.createElement("div"); layer.className = "sparkles"; layer.setAttribute("aria-hidden", "true");
  const count = innerWidth < 640 ? 7 : 13, rnd = (a, b) => a + Math.random() * (b - a);
  let html = "";
  for (let i = 0; i < count; i++) {
    const h = i % 3 === 0;
    html += `<i style="--x:${rnd(2, 96).toFixed(1)}%;--s:${(h ? rnd(12, 20) : rnd(8, 15)).toFixed(0)}px;--t:${rnd(11, 20).toFixed(1)}s;--d:${(-rnd(0, 20)).toFixed(1)}s;--dx:${rnd(-60, 60).toFixed(0)}px;--r:${rnd(-120, 120).toFixed(0)}deg;--o:${rnd(.3, .65).toFixed(2)};--c:${colors[i % colors.length]}">${h ? heart : spark}</i>`;
  }
  layer.innerHTML = html; hero.prepend(layer);
})();

// hover tilt on cards and plan tiles (mouse / pen only; touch keeps the plain hover)
(function tilt() {
  if (calm || !matchMedia("(hover:hover) and (pointer:fine)").matches) return;
  document.querySelectorAll(".grid .card, .trust .card, .tiers .tier").forEach(el => {
    el.classList.add("tilt");
    let raf = 0;
    el.addEventListener("pointermove", e => {
      if (raf) return;
      raf = requestAnimationFrame(() => { raf = 0;
        const r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty("--ry", ((x - .5) * 8).toFixed(2) + "deg"); el.style.setProperty("--rx", ((.5 - y) * 6).toFixed(2) + "deg");
        el.style.setProperty("--mx", (x * 100).toFixed(1) + "%"); el.style.setProperty("--my", (y * 100).toFixed(1) + "%");
        el.classList.add("tilting"); });
    });
    el.addEventListener("pointerleave", () => { cancelAnimationFrame(raf); raf = 0; el.classList.remove("tilting"); el.style.removeProperty("--rx"); el.style.removeProperty("--ry"); });
  });
})();
