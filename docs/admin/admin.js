// Choochie usage dashboard. The data never lives on this site: it is fetched live from the server with the admin code,
// which is kept in sessionStorage only (gone when the tab closes, or with "Forget code"). Vanilla JS + inline SVG.
(function () {
  const API = 'https://api.choochie.app/pet/ai/v1/admin/stats';
  const KEY = 'choochie-admin-code';
  const C = { rose: '#ff5c8a', red: '#e0263a', redDark: '#8e0a14', soft: '#ffc2d4', cream: '#fff3ec', grid: 'rgba(255,255,255,.06)', track: '#241a21' };
  const TIER_COLORS = ['#5a4650', '#ff5c8a', '#e0263a', '#ffc2d4', '#8e0a14', '#b5a1aa'];
  const NS = 'http://www.w3.org/2000/svg';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const sv = (tag, attrs, parent) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (parent) parent.appendChild(e); return e; };
  const usd = (n, d) => '$' + (Number(n) || 0).toFixed(d == null ? 2 : d);
  const num = n => Math.round(Number(n) || 0).toLocaleString('en-US');
  const store = { get() { try { return sessionStorage.getItem(KEY) || ''; } catch (_) { return ''; } }, set(v) { try { sessionStorage.setItem(KEY, v); } catch (_) {} }, clear() { try { sessionStorage.removeItem(KEY); } catch (_) {} } };
  let timer = null, busy = false;

  // ------------------------------------------------------------------ loading
  function showLogin(msg) { $('dash').classList.add('hidden'); $('login').classList.remove('hidden'); $('login-msg').textContent = msg || ''; clearInterval(timer); timer = null; }
  function showDash() { $('login').classList.add('hidden'); $('dash').classList.remove('hidden'); }
  function banner(text) { const b = $('banner'); b.textContent = text || ''; b.classList.toggle('hidden', !text); }
  async function load() {
    const code = store.get(); if (!code) { showLogin(''); return; }
    if (busy) return; busy = true;
    const wake = setTimeout(() => banner('Waking the server... (free hosting sleeps when idle, this can take ~30 s)'), 3500);
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        let r;
        try { r = await fetch(API + '?days=' + $('days').value, { headers: { 'x-admin-code': code }, cache: 'no-store' }); }
        catch (e) { if (attempt < 3) { await new Promise(z => setTimeout(z, 4000)); continue; } throw new Error('Could not reach the server.'); }
        if (r.status === 401) { store.clear(); showLogin('That code is not right.'); return; }
        if (r.status === 429) { store.clear(); showLogin('Too many wrong codes from here. Try again in an hour.'); return; }
        if ((r.status === 502 || r.status === 503) && attempt < 3) { await new Promise(z => setTimeout(z, 5000)); continue; }
        if (!r.ok) throw new Error('Server answered ' + r.status + '.');
        const j = await r.json(); showDash(); banner(''); render(j);
        if (!timer) timer = setInterval(load, 60000);
        return;
      }
    } catch (e) { if ($('dash').classList.contains('hidden')) showLogin(e.message); else banner(e.message + ' Retrying in a minute.'); }
    finally { clearTimeout(wake); busy = false; }
  }

  // ------------------------------------------------------------------ small pieces
  function spark(values, color) {
    const W = 160, H = 30, n = values.length, max = Math.max(1e-9, ...values), min = Math.min(0, ...values);
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', class: 'spark', 'aria-hidden': 'true' });
    if (n < 2) return svg;
    const x = i => i * W / (n - 1), y = v => H - 2 - (H - 4) * (v - min) / (max - min || 1);
    const line = values.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    sv('polygon', { points: `0,${H} ${line} ${W},${H}`, fill: color, opacity: 0.15 }, svg);
    sv('polyline', { points: line, fill: 'none', stroke: color, 'stroke-width': 2, 'vector-effect': 'non-scaling-stroke', 'stroke-linejoin': 'round' }, svg);
    return svg;
  }
  function kpi(label, val, series, note, money) {
    const c = el('div', 'card kpi'); c.appendChild(el('div', 'label', label));
    const r = el('div', 'row1'); r.appendChild(el('div', 'val', val));
    if (series && series.length >= 2) {
      const a = series[series.length - 1], b = series[series.length - 2], d = a - b;
      const t = d === 0 ? '±0' : (d > 0 ? '+' : '−') + (money ? usd(Math.abs(d)) : num(Math.abs(d)));
      const chip = el('span', 'delta ' + (d > 0 ? 'up' : d < 0 ? 'down' : ''), t + ' vs yesterday'); r.appendChild(chip);
    }
    c.appendChild(r); if (note) c.appendChild(el('div', 'note', note));
    if (series) c.appendChild(spark(series.slice(-14), C.rose));
    return c;
  }
  // a hover tooltip over an SVG chart: hit columns map to the day under the pointer
  function hover(host, svg, n, x0, colW, html) {
    const tip = el('div', 'tip'); host.appendChild(tip);
    const hl = sv('rect', { x: 0, y: 0, width: colW, height: '100%', fill: 'rgba(255,92,138,.07)', opacity: 0 }, svg);
    const move = ev => {
      const r = svg.getBoundingClientRect(), vb = svg.viewBox.baseVal, px = (ev.clientX - r.left) * vb.width / r.width;
      const i = Math.max(0, Math.min(n - 1, Math.floor((px - x0) / colW)));
      hl.setAttribute('x', x0 + i * colW); hl.setAttribute('opacity', 1);
      tip.textContent = ''; for (const [cls, t] of html(i)) tip.appendChild(el('div', cls, t));
      const hr = host.getBoundingClientRect(); tip.style.left = Math.max(70, Math.min(hr.width - 70, ev.clientX - hr.left)) + 'px'; tip.style.top = (ev.clientY - hr.top) + 'px'; tip.classList.add('on');
    };
    svg.addEventListener('pointermove', move); svg.addEventListener('pointerdown', move);
    svg.addEventListener('pointerleave', () => { tip.classList.remove('on'); hl.setAttribute('opacity', 0); });
  }
  function axisLabels(svg, days, x0, colW, H, B) {
    const n = days.length, step = Math.ceil(n / 7);
    days.forEach((d, i) => { if (i % step === 0 || i === n - 1) sv('text', { x: x0 + i * colW + colW / 2, y: H - B + 16, 'text-anchor': 'middle' }, svg).textContent = d.date.slice(5); });
  }

  // ------------------------------------------------------------------ charts
  function activeChart(days) {
    const host = $('ch-active'); host.textContent = '';
    const W = 640, H = 230, L = 34, R = 10, T = 12, B = 24, n = Math.max(1, days.length), colW = (W - L - R) / n;
    const max = Math.max(4, ...days.map(d => d.active), ...days.map(d => d.installs));
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Active PCs and new installs per day' });
    const y = v => H - B - (H - T - B) * v / max;
    for (let g = 0; g <= 4; g++) { const v = Math.round(max * g / 4); sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: C.grid }, svg); sv('text', { x: L - 6, y: y(v) + 3, 'text-anchor': 'end' }, svg).textContent = v; }
    const pts = k => days.map((d, i) => [L + i * colW + colW / 2, y(d[k])]);
    const a = pts('active'), ins = pts('installs');
    if (a.length) {
      const grad = sv('linearGradient', { id: 'ga', x1: 0, y1: 0, x2: 0, y2: 1 }, sv('defs', {}, svg));
      sv('stop', { offset: '0', 'stop-color': C.rose, 'stop-opacity': 0.45 }, grad); sv('stop', { offset: '1', 'stop-color': C.rose, 'stop-opacity': 0 }, grad);
      const line = a.map(p => p.map(v => v.toFixed(1)).join(',')).join(' ');
      sv('polygon', { points: `${a[0][0]},${H - B} ${line} ${a[a.length - 1][0]},${H - B}`, fill: 'url(#ga)' }, svg);
      sv('polyline', { points: line, fill: 'none', stroke: C.rose, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, svg);
      sv('polyline', { points: ins.map(p => p.map(v => v.toFixed(1)).join(',')).join(' '), fill: 'none', stroke: C.cream, 'stroke-width': 2, 'stroke-dasharray': '5 4', 'stroke-linejoin': 'round' }, svg);
      a.forEach(p => sv('circle', { cx: p[0], cy: p[1], r: n > 45 ? 1.5 : 3, fill: C.rose }, svg));
    }
    axisLabels(svg, days, L, colW, H, B);
    host.appendChild(svg);
    hover(host, svg, n, L, colW, i => [['d', days[i].date], ['', num(days[i].active) + ' active PCs'], ['', num(days[i].installs) + ' new installs']]);
  }
  function costChart(days) {
    const host = $('ch-cost'); host.textContent = '';
    const W = 640, H = 220, L = 44, R = 10, T = 12, B = 24, n = Math.max(1, days.length), colW = (W - L - R) / n;
    const tts = d => (d.cost.inworld != null ? d.cost.inworld : d.cost.tts) || 0;
    const max = Math.max(0.05, ...days.map(d => d.cost.total || 0));
    const svg = sv('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Estimated cost per day, Venice and Inworld' });
    const y = v => H - B - (H - T - B) * v / max;
    for (let g = 0; g <= 4; g++) { const v = max * g / 4; sv('line', { x1: L, x2: W - R, y1: y(v), y2: y(v), stroke: C.grid }, svg); sv('text', { x: L - 6, y: y(v) + 3, 'text-anchor': 'end' }, svg).textContent = '$' + v.toFixed(v < 1 ? 2 : 1); }
    days.forEach((d, i) => {
      const x = L + i * colW + colW * 0.15, w = Math.max(1, colW * 0.7), v = d.cost.venice || 0, t = tts(d);
      sv('rect', { x, y: y(v), width: w, height: Math.max(0, H - B - y(v)), fill: C.red, rx: 2 }, svg);
      sv('rect', { x, y: y(v + t), width: w, height: Math.max(0, y(v) - y(v + t)), fill: C.soft, rx: 2 }, svg);
    });
    axisLabels(svg, days, L, colW, H, B);
    host.appendChild(svg);
    hover(host, svg, n, L, colW, i => [['d', days[i].date], ['', 'Venice ' + usd(days[i].cost.venice, 3)], ['', 'Inworld ' + usd(tts(days[i]), 3)], ['', 'Total ' + usd(days[i].cost.total, 3)]]);
  }
  function donut(byTier, total) {
    const host = $('donut'); host.textContent = ''; const leg = $('donut-legend'); leg.textContent = '';
    const S = 150, R = 60, sw = 22, cx = S / 2, cy = S / 2, circ = 2 * Math.PI * R;
    const svg = sv('svg', { viewBox: `0 0 ${S} ${S}`, width: S, height: S, role: 'img', 'aria-label': 'Installs by tier' });
    sv('circle', { cx, cy, r: R, fill: 'none', stroke: C.track, 'stroke-width': sw }, svg);
    let off = 0; const entries = Object.entries(byTier);
    entries.forEach(([name, n], i) => {
      const frac = total ? n / total : 0, col = TIER_COLORS[i % TIER_COLORS.length];
      if (frac > 0) { const seg = sv('circle', { cx, cy, r: R, fill: 'none', stroke: col, 'stroke-width': sw, 'stroke-dasharray': `${Math.max(0, frac * circ - (entries.length > 1 ? 2 : 0))} ${circ}`, 'stroke-dashoffset': -off * circ, transform: `rotate(-90 ${cx} ${cy})` }, svg); sv('title', {}, seg).textContent = `${name}: ${n}`; }
      off += frac;
      const li = el('div', 'li'), sw2 = el('b'); sw2.style.background = col; li.appendChild(sw2); li.appendChild(el('span', null, name)); li.appendChild(el('span', null, num(n) + (total ? ' · ' + Math.round(100 * n / total) + '%' : ''))); leg.appendChild(li);
    });
    sv('text', { x: cx, y: cy + 2, 'text-anchor': 'middle', style: 'fill:#fff3ec;font-size:24px;font-weight:800' }, svg).textContent = num(total);
    sv('text', { x: cx, y: cy + 18, 'text-anchor': 'middle' }, svg).textContent = 'installs';
    host.appendChild(svg);
  }
  function gauge(label, used, cap, sub) {
    const box = el('div', 'gauge'), S = 110, R = 42, sw = 12, cx = S / 2, cy = S / 2 + 6;
    const pct = cap > 0 ? Math.min(1, used / cap) : 0, start = Math.PI * 0.75, sweep = Math.PI * 1.5;
    const pt = a => [cx + R * Math.cos(a), cy + R * Math.sin(a)];
    const arc = (a0, a1) => { const [x0, y0] = pt(a0), [x1, y1] = pt(a1); return `M${x0.toFixed(2)},${y0.toFixed(2)} A${R},${R} 0 ${a1 - a0 > Math.PI ? 1 : 0} 1 ${x1.toFixed(2)},${y1.toFixed(2)}`; };
    const svg = sv('svg', { viewBox: `0 0 ${S} ${S - 10}`, width: '100%', role: 'img', 'aria-label': `${label}: ${Math.round(pct * 100)}%` });
    sv('path', { d: arc(start, start + sweep), fill: 'none', stroke: C.track, 'stroke-width': sw, 'stroke-linecap': 'round' }, svg);
    if (pct > 0.003) sv('path', { d: arc(start, start + sweep * pct), fill: 'none', stroke: pct > 0.85 ? C.red : C.rose, 'stroke-width': sw, 'stroke-linecap': 'round' }, svg);
    sv('text', { x: cx, y: cy + 4, 'text-anchor': 'middle', style: 'fill:#fff3ec;font-size:20px;font-weight:800' }, svg).textContent = Math.round(pct * 100) + '%';
    box.appendChild(svg); box.appendChild(el('div', 'g-l', label)); box.appendChild(el('div', 'g-s', num(used) + ' / ' + num(cap) + (sub ? ' ' + sub : '')));
    return box;
  }
  function mix(days) {
    const host = $('mix'); host.textContent = '';
    const labels = { chat: 'Chat replies', tts: 'Voice lines', decision: 'Her decisions', stt: 'Mic (heard you)', memory: 'Memory', vision: 'Photos / screen', spectate: 'Watch & play', discord: 'Discord replies' };
    const sum = {}; for (const k in labels) sum[k] = days.reduce((a, d) => a + ((d.req || {})[k] || 0), 0);
    const max = Math.max(1, ...Object.values(sum));
    Object.keys(labels).sort((a, b) => sum[b] - sum[a]).forEach(k => {
      const r = el('div', 'hb'); r.appendChild(el('span', null, labels[k]));
      const tr = el('div', 'track'), i = el('i'); i.style.width = (100 * sum[k] / max) + '%'; tr.appendChild(i); r.appendChild(tr);
      r.appendChild(el('span', null, num(sum[k]))); host.appendChild(r);
    });
    $('mix-period').textContent = 'last ' + days.length + ' days';
  }

  // ------------------------------------------------------------------ page
  function render(j) {
    const days = j.days || [], today = days[days.length - 1] || { cost: {}, payments: {}, req: {} }, m = j.month || { cost: {}, payments: {} };
    const tts = d => (d.cost.inworld != null ? d.cost.inworld : d.cost.tts) || 0;
    $('meta').textContent = 'Updated ' + new Date(j.generatedAt).toLocaleTimeString() + ' · server up ' + Math.round((j.uptimeSeconds || 0) / 60) + ' min' + (j.trackingSince ? ' · tracking since ' + j.trackingSince : ' · tracking starts now');

    const k = $('kpis'); k.textContent = '';
    k.appendChild(kpi('Active PCs today', num(j.active.today), days.map(d => d.active), num(j.active.d7) + ' this week · ' + num(j.active.d30) + ' in ' + j.active.windowDays + ' d'));
    k.appendChild(kpi('New installs today', num(today.installs), days.map(d => d.installs), num(j.installs.total) + ' installs total'));
    k.appendChild(kpi('Est. spend today', usd(today.cost.total), days.map(d => d.cost.total || 0), 'Venice ' + usd(today.cost.venice) + ' · Inworld ' + usd(tts(today)), true));
    k.appendChild(kpi('Est. spend this month', usd(m.cost.total), null, 'Venice ' + usd(m.cost.venice) + ' · Inworld ' + usd(m.cost.tts)));
    k.appendChild(kpi('Chats today', num(today.req.chat), days.map(d => (d.req || {}).chat || 0), num(today.req.tts) + ' voice lines'));
    k.appendChild(kpi('Payments this month', usd(m.payments.usd), days.map(d => d.payments.usd || 0), num(m.payments.count) + ' payment(s)', true));

    activeChart(days); costChart(days);

    // Venice balance + runway at the 7-day average
    const vb = j.providers.venice && j.providers.venice.balance, last7 = days.slice(-7), avg = last7.reduce((a, d) => a + (d.cost.venice || 0), 0) / Math.max(1, last7.length);
    $('vb').textContent = vb ? usd(vb.USD) : '-';
    $('vb-note').textContent = vb ? 'live from Venice' + (vb.DIEM ? ' · ' + num(vb.DIEM) + ' DIEM' : '') : (j.providers.venice.error || 'unavailable');
    const p = $('vb-proj'); p.textContent = '';
    if (vb && avg > 0.0005) { const dleft = vb.USD / avg; p.appendChild(el('strong', null, (dleft > 999 ? '999+' : Math.floor(dleft)) + ' days')); p.appendChild(document.createTextNode(' left at the 7-day average of ' + usd(avg, 3) + '/day')); }
    else p.textContent = vb ? 'Not enough spend yet to project how long it lasts.' : 'Balance not available.';
    const f = $('facts'); f.textContent = '';
    for (const [a, b] of [['Inworld (est.) month', usd(m.cost.tts)], ['Tokens in / out', num(j.totals.d7.tokensIn) + ' / ' + num(j.totals.d7.tokensOut)], ['Voice chars (7 d)', num(j.totals.d7.ttsChars)]]) { const x = el('div', 'fact'); x.appendChild(el('div', null, a)); x.appendChild(el('div', null, b)); f.appendChild(x); }

    const g = $('gauges'); g.textContent = '';
    g.appendChild(gauge('Today', j.energy.today.used, j.energy.today.cap));
    g.appendChild(gauge('This month', j.energy.month.used, j.energy.month.cap));
    g.appendChild(gauge('Free pool', j.energy.demoPool.used, j.energy.demoPool.cap));

    const by = j.tiers.byTier || {}; donut(by, Object.values(by).reduce((a, b) => a + b, 0));
    const chips = $('chips'); chips.textContent = '';
    for (const [a, b] of [['Testers', j.tiers.testers], ['Admins', j.tiers.admins], ['Active patrons', j.tiers.activePatrons], ['Patreon-linked PCs', j.tiers.patronInstalls], ['Discord linked', j.tiers.discordLinked]]) { const c = el('span', 'chip', a); c.appendChild(el('strong', null, num(b))); chips.appendChild(c); }

    mix(days);

    const tb = $('table'); tb.textContent = '';
    const head = el('tr'); for (const h of ['Day', 'PCs', 'New', 'Chat', 'Voice', 'Mic', 'Energy', 'Venice', 'Inworld', 'Total', 'Paid']) head.appendChild(el('th', null, h));
    const thead = el('thead'); thead.appendChild(head); tb.appendChild(thead); const body = el('tbody');
    for (const d of days.slice().reverse()) {
      const tr = el('tr');
      for (const v of [d.date.slice(5), num(d.active), num(d.installs), num(d.req.chat), num(d.req.tts), num(d.req.stt), num(d.energy), usd(d.cost.venice, 3), usd(tts(d), 3), usd(d.cost.total, 3), d.payments.usd ? usd(d.payments.usd) : '-']) tr.appendChild(el('td', null, v));
      body.appendChild(tr);
    }
    tb.appendChild(body);

    const pr = $('prices'); pr.textContent = ''; pr.appendChild(el('div', null, 'Costs are estimates (usage x price). Venice prices are read live from Venice; Inworld has no usage API, so voice is characters x $' + j.providers.tts.perMillionChars + ' per 1M (change with PET_COST_TTS_PER_M on Render).'));
    for (const [role, q] of Object.entries(j.providers.models || {})) pr.appendChild(el('div', null, role + ': ' + q.model + (q.in != null ? ' · $' + q.in + ' in / $' + q.out + ' out per 1M tokens' : ' · price unknown')));
    pr.appendChild(el('div', null, 'mic: ' + j.providers.stt.model + ' · $' + j.providers.stt.perSecond + ' per second'));
  }

  $('login-form').addEventListener('submit', e => { e.preventDefault(); const v = $('code').value.trim(); if (!v) return; store.set(v); $('code').value = ''; $('login-msg').textContent = 'Checking...'; load(); });
  $('refresh').addEventListener('click', load);
  $('days').addEventListener('change', load);
  $('forget').addEventListener('click', () => { store.clear(); showLogin('Forgotten.'); });
  if (store.get()) load(); else showLogin('');
})();
