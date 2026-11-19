// Choochie Heart Clicker: the helpers you own, on screen. One little animated sprite per helper type (a few of each when you
// own more, with a xN badge) stand around her and tap her in rhythm with what they produce: each tap carries that sprite's
// share of the helper's ♥/s, so the taps add up to the real production. Inline SVG drawn here, animated with transform and
// opacity only, created once and reused. They never take clicks (pointer-events: none).
//
// opts: { root: element inside the play area, target(): her rect in client px {x,y,w,h}, area(): the play rect {x,y,w,h},
//         calm(): reduced motion, small(): phone layout, onTap(x, y, i, amount, withNumber) }

const OL = 'stroke="#5a1f2e" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"';
// shared gradients: defined once in a hidden <svg>, used by every sprite
const DEFS = `<svg class="hx-defs" width="0" height="0" aria-hidden="true" focusable="false" style="position:absolute"><defs>
<linearGradient id="hxCream" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fffaf6"/><stop offset="1" stop-color="#ffe1d3"/></linearGradient>
<linearGradient id="hxPink" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffd3e0"/><stop offset="1" stop-color="#ff8fb0"/></linearGradient>
<linearGradient id="hxRose" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8aa8"/><stop offset="1" stop-color="#e0263a"/></linearGradient>
<linearGradient id="hxGold" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".55" stop-color="#ffc93a"/><stop offset="1" stop-color="#d79a1c"/></linearGradient>
<linearGradient id="hxMetal" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#cfc6d9"/></linearGradient>
<linearGradient id="hxDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4a3640"/><stop offset="1" stop-color="#1f1218"/></linearGradient>
<linearGradient id="hxHair" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#c46a4c"/><stop offset="1" stop-color="#6e2a22"/></linearGradient>
<linearGradient id="hxPanel" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9fd8ff"/><stop offset="1" stop-color="#c58bff"/></linearGradient>
<radialGradient id="hxGlow"><stop offset="0" stop-color="#fff3a0" stop-opacity=".95"/><stop offset=".5" stop-color="#ff8aa8" stop-opacity=".45"/><stop offset="1" stop-color="#ff5c8a" stop-opacity="0"/></radialGradient>
<radialGradient id="hxVoid" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#ffffff"/><stop offset=".25" stop-color="#ffc2f0"/><stop offset=".6" stop-color="#8a3ad0"/><stop offset="1" stop-color="#2a0a40"/></radialGradient>
<linearGradient id="hxRing" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5c8a"/><stop offset=".5" stop-color="#c58bff"/><stop offset="1" stop-color="#5cc8ff"/></linearGradient>
</defs></svg>`;
const HEART = (x, y, s, fill, extra) => `<path d="M${x} ${y + s * 0.35}c${-s * 1.05} ${-s * 0.62} ${-s * 0.62} ${-s * 1.5} 0 ${-s * 0.98}c${s * 0.62} ${-s * 0.52} ${s * 1.05} ${s * 0.36} 0 ${s * 0.98}z" fill="${fill}" ${extra || ""}/>`;

// viewBox 0 0 64 64; "up" (-y) is the tapping side for the paw (it is turned to point at her), the rest stay upright
const ART = {
  paw: `<g class="hx-paw">
    <path d="M22 50c-4-6-4-16 2-21 5-4 11-4 16 0 6 5 6 15 2 21z" fill="url(#hxCream)" ${OL}/>
    <circle cx="19" cy="26" r="5.6" fill="url(#hxCream)" ${OL}/><circle cx="27" cy="18.5" r="5.8" fill="url(#hxCream)" ${OL}/>
    <circle cx="37" cy="18.5" r="5.8" fill="url(#hxCream)" ${OL}/><circle cx="45" cy="26" r="5.6" fill="url(#hxCream)" ${OL}/>
    <ellipse cx="19.4" cy="26.4" rx="2.6" ry="2.9" fill="#ff8fb0"/><ellipse cx="27.2" cy="19" rx="2.7" ry="3" fill="#ff8fb0"/>
    <ellipse cx="36.8" cy="19" rx="2.7" ry="3" fill="#ff8fb0"/><ellipse cx="44.6" cy="26.4" rx="2.6" ry="2.9" fill="#ff8fb0"/>
    ${HEART(32, 39, 9, "#ff8fb0")}
    <path d="M21 50h22v6a3 3 0 0 1-3 3H24a3 3 0 0 1-3-3z" fill="url(#hxRose)" ${OL}/>
    <path d="M21 52.5h22" stroke="#ffc2d4" stroke-width="1.6" stroke-dasharray="2 2.4"/>
    <circle cx="27" cy="34" r="1.6" fill="#fff" opacity=".9"/></g>`,
  kitty: `<path class="hx-tail" d="M47 50c8 0 11-6 8-12" fill="none" stroke="#f3b27a" stroke-width="5" stroke-linecap="round"/>
    <ellipse cx="32" cy="47" rx="17" ry="11" fill="url(#hxCream)" ${OL}/>
    <path d="M17 22l2-13 10 8z" fill="#f3b27a" ${OL}/><path d="M47 22l-2-13-10 8z" fill="url(#hxCream)" ${OL}/>
    <path d="M20 19l1-6 5 4z" fill="#ff8fb0"/><path d="M44 19l-1-6-5 4z" fill="#ff8fb0"/>
    <circle cx="32" cy="29" r="15" fill="url(#hxCream)" ${OL}/>
    <path d="M18 25c4-7 9-9 13-9-2 4-6 8-13 9z" fill="#f3b27a" opacity=".95"/>
    <path d="M23.5 29q2.5-3 5 0M35.5 29q2.5-3 5 0" fill="none" stroke="#5a1f2e" stroke-width="2" stroke-linecap="round"/>
    <ellipse cx="22" cy="34" rx="3.2" ry="2" fill="#ff8fb0" opacity=".75"/><ellipse cx="42" cy="34" rx="3.2" ry="2" fill="#ff8fb0" opacity=".75"/>
    <path d="M29.5 33.5q1.25 1.6 2.5 0q1.25 1.6 2.5 0" fill="none" stroke="#5a1f2e" stroke-width="1.6" stroke-linecap="round"/>
    <g class="hx-kl"><ellipse cx="25" cy="52" rx="5.2" ry="4.2" fill="#fff" ${OL}/><path d="M23 51.5v2M27 51.5v2" stroke="#e8b9c4" stroke-width="1.2"/></g>
    <g class="hx-kr"><ellipse cx="39" cy="52" rx="5.2" ry="4.2" fill="#fff" ${OL}/><path d="M37 51.5v2M41 51.5v2" stroke="#e8b9c4" stroke-width="1.2"/></g>`,
  maid: `<path d="M32 6v6" stroke="#5a1f2e" stroke-width="2"/>${HEART(32, 7, 5, "url(#hxRose)", 'class="hx-bulb"')}
    <rect x="14" y="12" width="36" height="30" rx="14" fill="url(#hxMetal)" ${OL}/>
    <path d="M15 19c3-5 7-6 9-3 2-4 6-4 8-1 2-3 6-3 8 1 2-3 6-2 9 3" fill="#fff" ${OL}/>
    <path d="M16 20.5h32" stroke="#2a1b24" stroke-width="2.6"/>
    <rect x="19" y="23" width="26" height="14" rx="7" fill="url(#hxDark)"/>
    ${HEART(26, 30.5, 3.6, "#ff5c8a")}${HEART(38, 30.5, 3.6, "#ff5c8a")}
    <path d="M18 44h28l3 12H15z" fill="#2a1b24" ${OL}/>
    <path d="M23 44h18l2 12H21z" fill="#fff" ${OL}/>
    <path d="M21 56c2 2 4 2 5.5 0 1.5 2 3.5 2 5.5 0 2 2 4 2 5.5 0 1.5 2 3.5 2 5.5 0" fill="none" stroke="#5a1f2e" stroke-width="1.6"/>
    <g class="hx-duster"><path d="M49 40l8-14" stroke="#8e5a0a" stroke-width="2.6" stroke-linecap="round"/>
    <path d="M57 26c-4-1-6-5-3-8 1 3 4 2 5 0 2 3 1 7-2 8z" fill="#ffc2d4" ${OL}/></g>`,
  letter: `<g class="hx-wl"><path d="M14 30c-8-4-11-11-9-15 4 1 8 5 9 10z" fill="#fff" ${OL}/></g>
    <g class="hx-wr"><path d="M50 30c8-4 11-11 9-15-4 1-8 5-9 10z" fill="#fff" ${OL}/></g>
    <rect x="11" y="22" width="42" height="30" rx="4" fill="url(#hxCream)" ${OL}/>
    <path d="M12 24l20 16 20-16" fill="none" ${OL}/>
    <path d="M12 51l15-13M52 51L37 38" stroke="#e8b9c4" stroke-width="1.6"/>
    <circle cx="32" cy="40" r="7" fill="url(#hxRose)" ${OL}/>${HEART(32, 41.5, 4, "#ffc2d4")}
    <g class="hx-fly">${HEART(32, 16, 6, "url(#hxRose)", OL)}</g>`,
  fanclub: `<g class="hx-stick"><path d="M44 36l7-22" stroke="#2a1b24" stroke-width="3" stroke-linecap="round"/>
    <circle cx="51" cy="13" r="9" fill="url(#hxGlow)"/>${HEART(51, 15, 6.5, "url(#hxPink)", OL)}</g>
    <path d="M14 58c0-12 8-18 18-18s18 6 18 18z" fill="url(#hxRose)" ${OL}/>
    <path d="M24 50h16" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".8"/>
    <circle cx="32" cy="28" r="14" fill="#ffe3d6" ${OL}/>
    <path d="M18 24c1-9 8-13 14-13s13 4 14 13c-4-4-9-5-14-5s-10 1-14 5z" fill="#3a2430" ${OL}/>
    <path d="M18.5 23h27" stroke="#e0263a" stroke-width="3.4"/>${HEART(32, 24.2, 3.4, "#fff")}
    <circle cx="26.5" cy="29" r="1.9" fill="#2a1b24"/><circle cx="37.5" cy="29" r="1.9" fill="#2a1b24"/>
    <path d="M28.5 33.5q3.5 5 7 0z" fill="#e0263a" ${OL} stroke-width="1.4"/>
    <ellipse cx="23" cy="33" rx="2.6" ry="1.6" fill="#ff8fb0" opacity=".8"/><ellipse cx="41" cy="33" rx="2.6" ry="1.6" fill="#ff8fb0" opacity=".8"/>
    <path d="M45 44c2-3 2-6 0-8" stroke="#ffe3d6" stroke-width="5" stroke-linecap="round"/>`,
  shrine: `<circle class="hx-halo" cx="32" cy="18" r="15" fill="url(#hxGlow)"/>
    <path d="M10 56h44l-5 5H15z" fill="url(#hxGold)" ${OL}/>
    <path d="M14 56c0-4 8-6 18-6s18 2 18 6" fill="url(#hxGold)" ${OL}/>
    <rect x="23" y="27" width="18" height="25" rx="3" fill="url(#hxCream)" ${OL}/>
    <path d="M23 31c3 0 3 5 6 5s2-5 6-5 3 7 6 7v-7" fill="#fff" opacity=".9"/>
    <path d="M32 27v-4" stroke="#5a1f2e" stroke-width="1.8"/>
    <g class="hx-flame">${HEART(32, 20, 7, "url(#hxGold)", 'stroke="#ff5c8a" stroke-width="1.6"')}${HEART(32, 19, 3.2, "#fff")}</g>
    ${HEART(32, 43, 4, "#ff8fb0")}`,
  factory: `<g class="hx-puff">${HEART(48, 10, 5, "#ffc2d4", 'opacity=".9"')}</g><g class="hx-puff hx-p2">${HEART(48, 10, 4, "#ffc2d4", 'opacity=".9"')}</g>
    <rect x="43" y="14" width="9" height="22" fill="url(#hxRose)" ${OL}/><path d="M43 18h9" stroke="#fff" stroke-width="2" opacity=".7"/>
    <path d="M8 58V32l11-7v7l11-7v7l11-7v33z" fill="url(#hxPink)" ${OL}/>
    <path d="M41 58V30h15v28z" fill="url(#hxRose)" ${OL}/>
    <rect x="13" y="40" width="10" height="9" rx="2" fill="#fff3a0" ${OL} stroke-width="1.6"/>
    <rect x="27" y="40" width="10" height="9" rx="2" fill="#fff3a0" ${OL} stroke-width="1.6"/>
    <path d="M15 45q3 2.5 6 0q-3-2.5-6 0z" fill="#e0263a"/><path d="M29 45q3 2.5 6 0q-3-2.5-6 0z" fill="#e0263a"/>
    ${HEART(48.5, 46, 4.6, "#fff")}
    <path d="M6 58h52" ${OL}/>`,
  simps: `${HEART(32, 9, 5, "url(#hxRose)", OL)}
    <rect x="15" y="12" width="34" height="46" rx="5" fill="url(#hxDark)" ${OL}/>
    <rect x="19" y="16" width="26" height="12" rx="3" fill="#120a0e"/>
    <path d="M23 22.5q2.4-3 4.8 0M36.2 22.5q2.4-3 4.8 0" stroke="#ff5c8a" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    ${HEART(32, 25.5, 2.2, "#ff5c8a")}
    <rect x="19" y="32" width="26" height="5" rx="1.5" fill="#2e1e26"/><rect x="19" y="40" width="26" height="5" rx="1.5" fill="#2e1e26"/><rect x="19" y="48" width="26" height="5" rx="1.5" fill="#2e1e26"/>
    <circle class="hx-led" cx="23" cy="34.5" r="1.5" fill="#ff5c8a"/><circle class="hx-led hx-l2" cx="27.5" cy="34.5" r="1.5" fill="#7dffb0"/>
    <circle class="hx-led hx-l3" cx="23" cy="42.5" r="1.5" fill="#7dffb0"/><circle class="hx-led" cx="27.5" cy="42.5" r="1.5" fill="#ff5c8a"/>
    <circle class="hx-led hx-l2" cx="23" cy="50.5" r="1.5" fill="#ff5c8a"/><circle class="hx-led hx-l3" cx="27.5" cy="50.5" r="1.5" fill="#ffd54a"/>
    <path d="M33 34.5h9M33 42.5h9M33 50.5h9" stroke="#5a4450" stroke-width="1.4" stroke-dasharray="1.6 1.4"/>`,
  cupid: `<g class="hx-sat"><rect x="2" y="25" width="17" height="12" rx="1.5" fill="url(#hxPanel)" ${OL}/><path d="M8 25v12M13.5 25v12M2 31h17" stroke="#5a1f2e" stroke-width="1.1" opacity=".55"/>
    <rect x="45" y="25" width="17" height="12" rx="1.5" fill="url(#hxPanel)" ${OL}/><path d="M50.5 25v12M56 25v12M45 31h17" stroke="#5a1f2e" stroke-width="1.1" opacity=".55"/>
    <path d="M19 31h5M40 31h5" ${OL}/>
    ${HEART(32, 40, 13, "url(#hxRose)", OL)}
    <path d="M24 26c2-3 5-4 7-3" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round" opacity=".75"/>
    <path d="M32 18v-7" stroke="#5a1f2e" stroke-width="2"/><path d="M26 10q6-6 12 0" fill="url(#hxMetal)" ${OL}/>
    <circle class="hx-blink" cx="32" cy="8" r="2" fill="#ffd54a"/>
    <path d="M18 52l9-8M24 45.5l3-1.5-.5 3.2" stroke="url(#hxGold)" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`,
  portal: `<circle cx="32" cy="32" r="25" fill="url(#hxVoid)" ${OL}/>
    <g class="hx-swirl"><path d="M32 32c0-8 8-12 14-8M32 32c8 0 12 8 8 14M32 32c0 8-8 12-14 8M32 32c-8 0-12-8-8-14" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" opacity=".85"/></g>
    <circle cx="32" cy="32" r="25" fill="none" stroke="url(#hxRing)" stroke-width="5"/>
    <circle cx="32" cy="32" r="27.5" fill="none" stroke="#5a1f2e" stroke-width="1.6"/>
    <g class="hx-orbit">${HEART(32, 6.5, 3.6, "#ffc2d4", OL.replace("2.2", "1.2"))}${HEART(32, 59, 3, "#fff3a0")}</g>`,
  clone: `<path d="M14 62c0-10 8-15 18-15s18 5 18 15z" fill="url(#hxDark)" ${OL}/>
    <path d="M24 49l8 6 8-6" fill="none" stroke="#c9c2cc" stroke-width="1.6"/>
    <path d="M13 22l1-14 10 7zM51 22l-1-14-10 7z" fill="url(#hxHair)" ${OL}/>
    <path d="M16 18l.6-6 5 3.5zM48 18l-.6-6-5 3.5z" fill="#ff8fb0"/>
    <path d="M11 34c-1-14 8-22 21-22s22 8 21 22c-1 8-3 13-6 15l-1-12H18l-1 12c-3-2-5-7-6-15z" fill="url(#hxHair)" ${OL}/>
    <ellipse cx="32" cy="35" rx="14" ry="13" fill="#ffe8de" ${OL}/>
    <path d="M17 31c3-9 9-13 15-13 0 4-3 8-7 9 3 0 6-2 8-5 1 4 5 6 9 6-2 0-4-1-5-2 3 2 7 3 10 3-2-7-8-11-14-11" fill="url(#hxHair)" stroke="#5a1f2e" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M23 36.5q3-2.6 6 0M35 36.5q3-2.6 6 0" fill="none" stroke="#5a1f2e" stroke-width="2" stroke-linecap="round"/>
    <path d="M24 36.2q2.5 1.6 4.4 0" stroke="#e0263a" stroke-width="1.6" fill="none"/><path d="M36 36.2q2.5 1.6 4.4 0" stroke="#e0263a" stroke-width="1.6" fill="none"/>
    <ellipse cx="22.5" cy="40.5" rx="3" ry="1.8" fill="#ff8fb0" opacity=".85"/><ellipse cx="41.5" cy="40.5" rx="3" ry="1.8" fill="#ff8fb0" opacity=".85"/>
    <path d="M29 42q3 3 6 0" fill="none" stroke="#5a1f2e" stroke-width="1.6" stroke-linecap="round"/><path d="M33.6 42.6l.8 2 .8-2.4z" fill="#fff" stroke="#5a1f2e" stroke-width=".8"/>`,
  engine: `<g class="hx-gear"><path d="M32 4l3.4 5.2 6-1.6.8 6.2 5.8 2.4-2.4 5.8 4.2 4.6-4.6 4.2 2.4 5.8-5.8 2.4-.8 6.2-6-1.6L32 48l-3.4-5.2-6 1.6-.8-6.2-5.8-2.4 2.4-5.8-4.2-4.6 4.6-4.2-2.4-5.8 5.8-2.4.8-6.2 6 1.6z" transform="translate(0 6)" fill="url(#hxMetal)" ${OL}/>
    <circle cx="32" cy="32" r="6" fill="#cfc6d9" ${OL}/></g>
    <g class="hx-beat">${HEART(32, 42, 16, "url(#hxRose)", OL)}
    <path d="M22 30c2-4 6-5 9-4" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".7"/>
    <path d="M20 40h7l3-5 4 9 3-6h7" fill="none" stroke="#fff3ec" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></g>`,
};
export const HELPER_IDS = Object.keys(ART);

// how many of one type stand on screen (the badge shows the full count)
const shownOf = n => (n <= 0 ? 0 : n < 2 ? 1 : n < 10 ? 2 : 3);              // spec 14: 1 owned = 1, 2-9 = 2, 10+ = 3
// seconds between taps for one sprite: more owned = faster (1.6 s for one, ~0.6 s for hundreds)
export const tapPeriod = n => Math.max(0.25, Math.min(2.4, 2.4 / Math.sqrt(Math.max(1, n))));   // spec 14: one tap of the TYPE per period

export function makeHelpers(opts) {
  const root = opts.root;
  if (!document.querySelector(".hx-defs")) document.body.insertAdjacentHTML("beforeend", DEFS);
  const live = new Map();                      // key "i:k" -> sprite
  let on = true, owned = [], out = [], numBudget = 0, layoutT = 0, sleeping = false;

  function make(i, k) {
    const id = HELPER_IDS[i], w = document.createElement("div");
    w.className = "hx hx-" + id; w.setAttribute("aria-hidden", "true");
    w.innerHTML = `<i class="hx-sh"></i><div class="hx-i"><div class="hx-b"><svg viewBox="0 0 64 64" width="100%" height="100%">${ART[id]}</svg></div></div><b class="hx-n"></b>`;
    w.style.setProperty("--d", (-Math.random() * 2.4).toFixed(2) + "s");
    root.appendChild(w);
    return { i, k, w, b: w.querySelector(".hx-b"), n: w.querySelector(".hx-n"), x: 0, y: 0, ux: 0, uy: -1, t: Math.random(), placed: false };
  }
  // positions on two arcs beside her (left and right), alternating, so every type gets a spot next to her body
  function layout() {
    const A = opts.area(), T = opts.target(), small = opts.small(), size = small ? 40 : 58;
    root.style.setProperty("--hx", size + "px");
    const list = [...live.values()].sort((a, b) => a.i - b.i || a.k - b.k);
    // around her upper body: from her face down to her thighs
    const cx = T.x + T.w / 2, cy = T.y + T.h * 0.4;
    const rx0 = T.w / 2 + size * 0.45, ry = Math.max(T.h * 0.3, size * 1.6);
    // each side holds as many as fit along its arc without overlapping; the rest go on an outer ring, further out
    const fit = Math.max(2, Math.floor(2 * ry * Math.sin(62 * Math.PI / 180) / (size * 0.92)) + 1);
    const L = [], R = [];
    list.forEach((s, j) => (j % 2 ? L : R).push(s));
    const arc = (all, side) => all.forEach((s, j) => {
      const ring = Math.floor(j / fit), arr = all.slice(ring * fit, ring * fit + fit), jj = j - ring * fit;
      const f = arr.length === 1 ? 0.5 : jj / (arr.length - 1) + (ring % 2 ? 0.5 / arr.length : 0);
      const a = (-62 + 124 * Math.min(1, f)) * Math.PI / 180;           // -62..62 deg from the horizontal
      const rx = rx0 + ring * size * 1.02;
      let x = cx + side * Math.cos(a) * rx, y = cy + Math.sin(a) * ry;
      x = Math.max(A.x + size * 0.6, Math.min(A.x + A.w - size * 0.6, x));
      y = Math.max(A.y + size * 0.9, Math.min(A.y + A.h - size * 0.6, y));
      let ux = cx - x, uy = (cy + Math.sin(a) * ry * 0.6) - y; const m = Math.hypot(ux, uy) || 1; ux /= m; uy /= m;
      s.x = x; s.y = y; s.ux = ux; s.uy = uy;
      s.w.style.transform = `translate3d(${(x - P.left - size / 2).toFixed(1)}px,${(y - P.top - size / 2).toFixed(1)}px,0)`;
      s.w.style.setProperty("--rot", (s.i === 0 ? Math.atan2(uy, ux) * 180 / Math.PI + 90 : 0).toFixed(1) + "deg");
      s.w.style.setProperty("--flip", ux < 0 && s.i !== 0 ? -1 : 1);
      if (!s.placed) { s.placed = true; requestAnimationFrame(() => s.w.classList.add("in")); }
    });
    const P = root.getBoundingClientRect();
    arc(R, 1); arc(L, -1);
  }
  function sync(ownedNow, outNow) {
    owned = ownedNow; out = outNow;
    const small = opts.small(), cap = small ? 12 : 24;
    const want = owned.map(n => (on ? shownOf(n) : 0));
    // too many: newest types win - take extras from the oldest types first, then whole old types
    for (let tot = want.reduce((a, b) => a + b, 0), i = 0; tot > cap && i < 60; i++) {
      let j = want.findIndex(v => v > 1); if (j < 0) j = want.findIndex(v => v > 0); if (j < 0) break; want[j]--; tot--;
    }
    let changed = false;
    for (const [key, s] of live) if (s.k >= want[s.i]) { s.w.remove(); live.delete(key); changed = true; }
    want.forEach((n, i) => { for (let k = 0; k < n; k++) if (!live.has(i + ":" + k)) { live.set(i + ":" + k, make(i, k)); changed = true; } });
    for (const s of live.values()) {
      const badge = s.k === 0 && owned[s.i] > want[s.i] ? "×" + fmtN(owned[s.i]) : "";
      if (s.n.textContent !== badge) s.n.textContent = badge;
    }
    if (changed) layout();
  }
  const fmtN = n => (n < 1000 ? String(n) : opts.fmt ? opts.fmt(n) : String(n));
  function tap(s, amount, withNum) {
    const calm = opts.calm(), L = opts.small() ? 7 : 10;
    if (!calm) {
      const dx = s.ux * L, dy = s.uy * L;
      s.b.animate([{ transform: "translate(0,0) scale(1,1)" }, { transform: `translate(${dx.toFixed(1)}px,${dy.toFixed(1)}px) scale(1.08,.92)`, offset: 0.35 }, { transform: "translate(0,0) scale(1,1)" }],
        { duration: 300, easing: "cubic-bezier(.3,.7,.4,1)" });
    } else s.b.animate([{ opacity: 1 }, { opacity: 0.65, offset: 0.4 }, { opacity: 1 }], { duration: 300 });
    const size = opts.small() ? 40 : 58, reach = size * 0.55 + L;
    opts.onTap(s.x + s.ux * reach, s.y + s.uy * reach, s.i, amount, withNum);
  }
  // dt seconds. out[i] = live ♥/s of helper type i (0 while they nap)
  function tick(dt) {
    if (!on || !live.size) return;
    layoutT += dt; if (layoutT > 1.6) { layoutT = 0; layout(); }
    numBudget = Math.min(2, numBudget + dt * (opts.small() ? 1.6 : 2.6));
    const nap = out.every(v => !(v > 0));
    if (nap !== sleeping) { sleeping = nap; root.classList.toggle("nap", nap); }
    if (nap) return;
    const count = []; for (const s of live.values()) count[s.i] = (count[s.i] || 0) + 1;
    for (const s of live.values()) {
      const per = tapPeriod(owned[s.i]) * count[s.i];                     // the sprites of one type take turns
      s.t += dt / per;
      if (s.t >= 1) {
        s.t -= Math.floor(s.t);
        const amount = (out[s.i] || 0) * per / count[s.i];
        const withNum = numBudget >= 1 && Math.random() < 0.75; if (withNum) numBudget -= 1;
        tap(s, amount, withNum);
      }
    }
  }
  function setOn(v) { on = !!v; root.hidden = !on; if (!on) { for (const s of live.values()) s.w.remove(); live.clear(); } else sync(owned, out); }
  function clear() { for (const s of live.values()) s.w.remove(); live.clear(); }
  return { sync, tick, layout, setOn, clear, get count() { return live.size; }, get on() { return on; } };
}
