// Choochie usage dashboard. The data never lives on this site: it is fetched live from the server with the admin code,
// which is kept in sessionStorage only (gone when the tab closes, or with "Forget code").
(function () {
  const API = 'https://stream-alerts-bot.onrender.com/pet/ai/v1/admin/stats';
  const KEY = 'choochie-admin-code';
  const $ = id => document.getElementById(id);
  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
  const usd = (n, d) => '$' + (Number(n) || 0).toFixed(d == null ? 2 : d);
  const num = n => (Number(n) || 0).toLocaleString('en-US');
  const store = { get() { try { return sessionStorage.getItem(KEY) || ''; } catch (_) { return ''; } }, set(v) { try { sessionStorage.setItem(KEY, v); } catch (_) {} }, clear() { try { sessionStorage.removeItem(KEY); } catch (_) {} } };
  let timer = null, busy = false;

  function showLogin(msg) { $('dash').classList.add('hidden'); $('login').classList.remove('hidden'); $('login-msg').textContent = msg || ''; clearInterval(timer); timer = null; }
  function showDash() { $('login').classList.add('hidden'); $('dash').classList.remove('hidden'); }
  function banner(text) { const b = $('banner'); b.textContent = text || ''; b.classList.toggle('hidden', !text); }

  async function load(manual) {
    const code = store.get(); if (!code) { showLogin(''); return; }
    if (busy) return; busy = true;
    const days = $('days').value;
    let wakeShown = false; const wake = setTimeout(() => { wakeShown = true; banner('Waking the server... (free hosting sleeps when idle, this can take ~30 s)'); }, 3500);
    try {
      for (let attempt = 0; attempt < 4; attempt++) {
        let r;
        try { r = await fetch(API + '?days=' + days, { headers: { 'x-admin-code': code }, cache: 'no-store' }); }
        catch (e) { if (attempt < 3) { await new Promise(z => setTimeout(z, 4000)); continue; } throw new Error('Could not reach the server.'); }
        if (r.status === 401) { store.clear(); showLogin('That code is not right.'); return; }
        if (r.status === 429) { store.clear(); showLogin('Too many wrong codes from here. Try again in an hour.'); return; }
        if (r.status === 502 || r.status === 503) { if (attempt < 3) { await new Promise(z => setTimeout(z, 5000)); continue; } }
        if (!r.ok) throw new Error('Server answered ' + r.status + '.');
        const j = await r.json();
        showDash(); banner(''); render(j);
        if (!timer) timer = setInterval(() => load(false), 60000);
        return;
      }
    } catch (e) {
      if ($('dash').classList.contains('hidden')) showLogin(e.message); else banner(e.message + ' Retrying in a minute.');
    } finally { clearTimeout(wake); if (wakeShown && !$('banner').textContent.startsWith('Could')) {} busy = false; }
  }

  function kpi(label, val, note, barPct) {
    const c = el('div', 'card kpi'); c.appendChild(el('div', 'label', label)); c.appendChild(el('div', 'val', val));
    if (note) c.appendChild(el('div', 'note', note));
    if (barPct != null) { const b = el('div', 'bar' + (barPct > 85 ? ' warn' : '')), i = el('i'); i.style.width = Math.max(0, Math.min(100, barPct)) + '%'; b.appendChild(i); c.appendChild(b); }
    return c;
  }
  function row(host, label, value, pct) {
    const r = el('div', 'row'); r.appendChild(el('span', null, label)); r.appendChild(el('span', null, value));
    if (pct != null) { const m = el('div', 'mini'), i = el('i'); i.style.width = Math.max(0, Math.min(100, pct)) + '%'; m.appendChild(i); r.appendChild(m); }
    host.appendChild(r);
  }

  function render(j) {
    const days = j.days || [], today = days[days.length - 1] || { cost: {}, payments: {} }, m = j.month || { cost: {}, payments: {} };
    const ttsKey = today.cost && today.cost.inworld != null ? 'inworld' : 'tts';
    $('meta').textContent = 'Updated ' + new Date(j.generatedAt).toLocaleTimeString() + ' · server up ' + Math.round((j.uptimeSeconds || 0) / 60) + ' min' + (j.commit ? ' · ' + j.commit : '') + (j.trackingSince ? ' · tracking since ' + j.trackingSince : ' · tracking starts now');

    // KPI tiles
    const k = $('kpis'); k.textContent = '';
    k.appendChild(kpi('Active PCs today', num(j.active.today), num(j.active.d7) + ' this week · ' + num(j.active.d30) + ' in ' + j.active.windowDays + ' days'));
    k.appendChild(kpi('Installs', num(j.installs.total), num((j.totals.d7 || {}).installs) + ' new this week'));
    k.appendChild(kpi('Est. spend today', usd(today.cost.total), 'Venice ' + usd(today.cost.venice) + ' · Inworld ' + usd(today.cost[ttsKey])));
    k.appendChild(kpi('Est. spend this month', usd(m.cost.total), 'Venice ' + usd(m.cost.venice) + ' · Inworld ' + usd(m.cost.tts)));
    const vb = j.providers && j.providers.venice && j.providers.venice.balance;
    k.appendChild(kpi('Venice balance', vb ? usd(vb.USD) : '-', vb ? (vb.DIEM ? num(vb.DIEM) + ' DIEM · ' : '') + 'live from Venice' : (j.providers.venice.error || 'unavailable')));
    k.appendChild(kpi('Inworld', 'est. ' + usd(m.cost.tts), 'no balance API: check platform.inworld.ai/billing'));
    k.appendChild(kpi('Payments this month', usd(m.payments.usd), num(m.payments.count) + ' payment(s)'));
    const em = j.energy.month, ed = j.energy.today;
    k.appendChild(kpi('Energy this month', num(Math.round(em.used)) + ' / ' + num(em.cap), Math.round(100 * em.used / Math.max(1, em.cap)) + '% of the monthly cap', 100 * em.used / Math.max(1, em.cap)));
    k.appendChild(kpi('Energy today', num(Math.round(ed.used)) + ' / ' + num(ed.cap), 'free pool ' + num(Math.round(j.energy.demoPool.used)) + ' / ' + num(j.energy.demoPool.cap), 100 * ed.used / Math.max(1, ed.cap)));

    // chart
    chart(days);

    // tiers
    const t = $('tiers'); t.textContent = ''; const by = j.tiers.byTier || {}; const tot = Object.values(by).reduce((a, b) => a + b, 0) || 1;
    for (const [name, n] of Object.entries(by)) row(t, name, num(n), 100 * n / tot);
    row(t, 'Testers', num(j.tiers.testers)); row(t, 'Admins', num(j.tiers.admins)); row(t, 'Active patrons', num(j.tiers.activePatrons)); row(t, 'Discord linked', num(j.tiers.discordLinked));

    // request mix for the selected window
    const sum = { chat: 0, decision: 0, memory: 0, vision: 0, spectate: 0, discord: 0, tts: 0, stt: 0 }; let tin = 0, tout = 0, chars = 0, secs = 0;
    for (const d of days) { for (const key in sum) sum[key] += (d.req || {})[key] || 0; tin += d.tokensIn; tout += d.tokensOut; chars += d.ttsChars; secs += d.sttSecs; }
    const labels = { chat: 'Chat replies', decision: 'Her decisions', memory: 'Memory', vision: 'Photos / screen', spectate: 'Watch & play', discord: 'Discord replies', tts: 'Voice lines', stt: 'Mic (heard you)' };
    const mx = $('mix'); mx.textContent = ''; const all = Object.values(sum).reduce((a, b) => a + b, 0) || 1;
    for (const key in sum) row(mx, labels[key], num(sum[key]), 100 * sum[key] / all);
    row(mx, 'Tokens in / out', num(tin) + ' / ' + num(tout)); row(mx, 'Voice characters', num(chars)); row(mx, 'Mic seconds', num(Math.round(secs)));
    const pm = j.providers.models || {}, pr = $('prices'); pr.textContent = '';
    const lines = Object.entries(pm).map(([role, p]) => role + ': ' + p.model + (p.in != null ? ' ($' + p.in + ' / $' + p.out + ' per 1M tok)' : ' (price unknown)'));
    lines.push('voice: ' + j.providers.tts.model + ' at $' + j.providers.tts.perMillionChars + ' per 1M chars (estimate)');
    lines.push('mic: ' + j.providers.stt.model + ' at $' + j.providers.stt.perSecond + '/s');
    for (const l of ['Costs are estimates from usage x price:'].concat(lines)) pr.appendChild(el('div', null, l));

    // table (newest first)
    const tb = $('table'); tb.textContent = '';
    const head = el('tr'); for (const h of ['Day', 'PCs', 'New', 'Chat', 'Voice', 'Mic', 'Energy', 'Venice', 'Inworld', 'Total', 'Paid']) head.appendChild(el('th', null, h));
    const thead = el('thead'); thead.appendChild(head); tb.appendChild(thead); const body = el('tbody');
    for (const d of days.slice().reverse()) {
      const tr = el('tr'); const c = d.cost || {};
      for (const v of [d.date.slice(5), num(d.active), num(d.installs), num((d.req || {}).chat), num((d.req || {}).tts), num((d.req || {}).stt), num(Math.round(d.energy)), usd(c.venice, 3), usd(c.inworld != null ? c.inworld : c.tts, 3), usd(c.total, 3), d.payments.usd ? usd(d.payments.usd) : '-']) tr.appendChild(el('td', null, v));
      body.appendChild(tr);
    }
    tb.appendChild(body);
  }

  function chart(days) {
    const host = $('chart'); host.textContent = '';
    const W = 640, H = 220, L = 34, R = 40, T = 10, B = 26, n = Math.max(1, days.length);
    const maxA = Math.max(1, ...days.map(d => d.active)), maxC = Math.max(0.01, ...days.map(d => (d.cost || {}).total || 0));
    const NS = 'http://www.w3.org/2000/svg', svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H); svg.setAttribute('width', '100%'); svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', 'Active PCs and estimated cost per day');
    const mk = (t, a) => { const e = document.createElementNS(NS, t); for (const k in a) e.setAttribute(k, a[k]); svg.appendChild(e); return e; };
    const cw = (W - L - R) / n;
    for (let g = 0; g <= 4; g++) { const y = T + (H - T - B) * g / 4; mk('line', { x1: L, x2: W - R, y1: y, y2: y, stroke: 'rgba(255,255,255,.06)' }); }
    mk('text', { x: 4, y: T + 8 }).textContent = String(maxA); mk('text', { x: W - R + 4, y: T + 8 }).textContent = '$' + maxC.toFixed(2);
    const pts = [];
    days.forEach((d, i) => {
      const h = (H - T - B) * d.active / maxA, x = L + i * cw;
      const r = mk('rect', { x: x + cw * 0.15, y: H - B - h, width: Math.max(1, cw * 0.7), height: Math.max(0, h), rx: 3, fill: '#ff5c8a', opacity: 0.85 });
      const tip = document.createElementNS(NS, 'title'); tip.textContent = d.date + ': ' + d.active + ' PCs, ' + usd((d.cost || {}).total, 3); r.appendChild(tip);
      pts.push((x + cw / 2).toFixed(1) + ',' + (H - B - (H - T - B) * ((d.cost || {}).total || 0) / maxC).toFixed(1));
      if (n <= 31 ? i % Math.ceil(n / 8) === 0 : i % Math.ceil(n / 6) === 0) mk('text', { x: x + cw / 2, y: H - 8, 'text-anchor': 'middle' }).textContent = d.date.slice(5);
    });
    mk('polyline', { points: pts.join(' '), fill: 'none', stroke: '#fff3ec', 'stroke-width': 2, 'stroke-linejoin': 'round' });
    host.appendChild(svg);
  }

  $('login-form').addEventListener('submit', e => { e.preventDefault(); const v = $('code').value.trim(); if (!v) return; store.set(v); $('code').value = ''; $('login-msg').textContent = 'Checking...'; load(true); });
  $('refresh').addEventListener('click', () => load(true));
  $('days').addEventListener('change', () => load(true));
  $('forget').addEventListener('click', () => { store.clear(); showLogin('Forgotten.'); });
  if (store.get()) load(false); else showLogin('');
})();
