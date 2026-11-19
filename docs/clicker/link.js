// Adds a "Heart Clicker" card to the web chat's Games popup (play.js draws that popup; this only appends a link to it).
(() => {
  const add = root => {
    const g = root.querySelector && root.querySelector(".pl-games");
    if (!g || g.querySelector(".pl-gcard-ck")) return;
    const a = document.createElement("a");
    a.className = "pl-gcard pl-gcard-ck"; a.href = "clicker.html";
    a.style.cssText = "text-decoration:none;color:inherit";
    a.title = "Heart Clicker: click her for hearts, hire helpers, spin the risky wheel";
    a.innerHTML = '<span aria-hidden="true">💗</span><b>Heart Clicker</b><small>Click her, unlock pop-ups</small>';
    g.insertBefore(a, g.firstChild);
  };
  const mo = new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) if (n.nodeType === 1) add(n.classList && n.classList.contains("pl-games") ? n.parentNode : n); });
  const start = () => { add(document.body); mo.observe(document.body, { childList: true, subtree: true }); };
  if (document.body) start(); else document.addEventListener("DOMContentLoaded", start);
})();
