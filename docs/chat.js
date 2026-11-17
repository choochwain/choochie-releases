// Web chat with Choochie. Needs a signed-in session (site.js Auth). Messages live in sessionStorage only (last 50).
(function () {
  const FACE = "img/portrait-smirk.jpg", KEY = "choochie.chat", MAX_KEEP = 50, MAX_SIDE = 1280, MAX_REC_MS = 55000;
  const log = $("#log"), form = $("#composer"), ta = $("#text"), hint = $("#hint");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  let busy = false, pending = null, account = null;

  // ---------- not signed in: a friendly wall instead of the composer
  if (!Auth.signedIn) {
    $("#status").textContent = "sign in to talk to her";
    log.innerHTML = `<div class="signin-wall"><img src="${FACE}" alt=""><h2 style="font-size:26px">Sign in to talk to her</h2>
      <p class="muted">A free account is enough. Sign-in (Discord, Patreon, X, or Google if offered) is only used to identify your account and sync energy/perks; it is never used to generate images.</p>
      <a class="btn btn-primary" href="login.html?next=chat">Sign in</a>
      <p class="fine" style="margin-top:14px">Orbs power web chat; your desktop energy is separate.</p></div>`;
    return;
  }

  // ---------- history (this tab only)
  const load = () => { try { return JSON.parse(sessionStorage.getItem(KEY) || "[]"); } catch (e) { return []; } };
  let hist = load();
  const save = () => { hist = hist.slice(-MAX_KEEP); try { sessionStorage.setItem(KEY, JSON.stringify(hist)); } catch (e) { hist.forEach(m => delete m.thumb); try { sessionStorage.setItem(KEY, JSON.stringify(hist)); } catch (_) {} } };

  function bubble(m) {
    const row = document.createElement("div");
    row.className = "m " + m.who;
    if (m.who === "her") { const f = document.createElement("img"); f.className = "face"; f.src = FACE; f.alt = ""; row.appendChild(f); }
    const b = document.createElement("div"); b.className = "b";
    if (m.thumb) { const i = document.createElement("img"); i.src = m.thumb; i.alt = "Picture you sent"; b.appendChild(i); }
    if (m.heard) { const h = document.createElement("span"); h.className = "heard"; h.textContent = "🎙️ " + m.heard; b.appendChild(h); }
    if (m.text) b.appendChild(document.createTextNode(m.text));
    row.appendChild(b); log.appendChild(row); log.scrollTop = log.scrollHeight;
    return row;
  }
  const add = (who, text, extra) => { const m = Object.assign({ who, text }, extra || {}); if (who !== "sys") { hist.push(m); save(); } return bubble(m); };
  function typing(label) {
    const row = document.createElement("div"); row.className = "m her typing";
    row.innerHTML = `<img class="face" src="${FACE}" alt=""><div class="b" aria-label="She's typing"><span></span><span></span><span></span><em></em></div>`;
    $("em", row).textContent = label || ""; log.appendChild(row); log.scrollTop = log.scrollHeight; return row;
  }
  function sys(html) { const row = document.createElement("div"); row.className = "m sys"; row.innerHTML = `<div class="b">${html}</div>`; log.appendChild(row); log.scrollTop = log.scrollHeight; return row; }

  // ---------- orbs
  function showOrbs(o) {
    if (!o) return;
    $("#orbs").hidden = false; $("#orbs-n").textContent = Number(o.left || 0).toLocaleString() + (o.max ? " / " + Number(o.max).toLocaleString() : "");
    $("#orbs-reset").textContent = o.resetsAt ? "refills " + whenTxt(o.resetsAt) : "";
  }
  function whenTxt(ts) {
    const ms = ts - Date.now(); if (!(ms > 0)) return "soon";
    const t = Math.ceil(ms / 60000), h = Math.floor(t / 60), m = t % 60;
    return "in " + (h ? h + " h " : "") + m + " min";
  }
  const awake = (on, txt) => { $("#av").classList.toggle("asleep", !on); $("#status").textContent = txt; };

  // ---------- server calls that survive a Render cold start
  const coldish = e => e.status === 0 || ((e.status === 502 || e.status === 503 || e.status === 504) && !(e.data && e.data.error));
  async function call(path, opts, onWait) {
    for (let i = 0; ; i++) {
      try { return await api(path, Object.assign({}, opts, opts && opts.body ? { body: JSON.parse(JSON.stringify(opts.body)) } : {})); }
      catch (e) { if (!coldish(e) || i >= 7) throw e; if (onWait) onWait(i); await sleep(Math.min(4000 + i * 2000, 10000)); }
    }
  }

  async function boot() {
    hist.forEach(bubble);
    if (!hist.length) bubble({ who: "her", text: "oh. you found me on the internet. cute~ what do you want?" });
    let wait = null;
    try {
      account = await call("/pet/ai/v1/account", {}, () => { awake(false, "waking her up…"); if (!wait) wait = sys("Her server was asleep - waking her up… (this can take up to a minute)"); });
    } catch (e) {
      if (wait) wait.remove();
      if (e.status === 401) { location.replace("login.html?next=chat"); return; }
      awake(false, "couldn't reach her"); sys(`Couldn't reach her right now (${esc(e.message)}). <a href="chat.html">Try again</a>`); return;
    }
    if (wait) wait.remove();
    store.set("choochie.name", account.name || "You"); renderChrome();
    awake(true, "online · " + (account.tier > 0 ? esc(account.tierName) : "free account"));
    showOrbs(account.orbs);
    form.hidden = false; $("#tools").hidden = false;
    $("#adult-wrap").hidden = !(account.features || []).includes("adult");
    $("#adult").checked = store.get("choochie.webAdult") === "1";
    $("#voice").checked = store.get("choochie.webVoice") === "1";
    if (!window.MediaRecorder || !navigator.mediaDevices) $("#b-mic").hidden = true;
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) $("#b-cam").hidden = true;
    ta.focus({ preventScroll: true });
  }
  $("#adult").addEventListener("change", e => store.set("choochie.webAdult", e.target.checked ? "1" : null));
  $("#voice").addEventListener("change", e => store.set("choochie.webVoice", e.target.checked ? "1" : null));
  $("#clear").addEventListener("click", () => { hist = []; save(); log.innerHTML = ""; bubble({ who: "her", text: "fresh start? fine. hi again." }); });

  // ---------- send
  async function send({ text = "", image = null, thumb = null, audio = null }) {
    if (busy) return; busy = true; setBusy(true);
    const mine = add("me", text, thumb ? { thumb } : null);
    const msgs = hist.slice(0, -1).filter(m => m.text || m.heard).slice(-16).map(m => ({ role: m.who === "me" ? "user" : "assistant", content: [m.heard, m.text].filter(Boolean).join(" ") }));
    const body = { text, messages: msgs, adult: $("#adult").checked };
    if (image) body.image = image;
    if (audio) body.audio = audio;
    if (audio && !text) { $(".b", mine).textContent = "🎙️ …"; }
    if ($("#voice").checked) body.voice = true;
    const t = typing();
    try {
      const r = await call("/pet/ai/v1/account/chat", { method: "POST", body }, i => { awake(false, "waking her up…"); $("em", t).textContent = "waking her up…"; });
      awake(true, "online");
      t.remove();
      if (r.transcript != null) {   // show what she heard on the voice bubble
        const m = hist[hist.length - 1]; m.heard = r.transcript || "(couldn't make that out)"; if (!m.text) m.text = ""; save();
        const b = $(".b", mine); b.textContent = ""; if (m.thumb) { const i = document.createElement("img"); i.src = m.thumb; i.alt = ""; b.appendChild(i); }
        const h = document.createElement("span"); h.className = "heard"; h.textContent = "🎙️ " + m.heard; b.appendChild(h); if (m.text) b.appendChild(document.createTextNode(m.text));
      }
      const row = add("her", r.reply || "…");
      if (r.audio) playAudio(r.audio, r.audioType || "audio/wav", row);
      else if (r.voiceError) sys("Her voice glitched that time - text only.");
      showOrbs(r.orbs);
    } catch (e) {
      t.remove();
      const d = e.data || {};
      if (d.orbs) showOrbs(d.orbs);
      if (e.status === 401) { sys(`Your sign-in expired. <a href="login.html?next=chat">Sign in again</a>`); }
      else if (e.status === 402 || d.error === "orbs") {
        sys(`She's out of Orbs for now~ They refill ${esc(whenTxt(d.orbs && d.orbs.resetsAt))}. <a href="${LINKS.patreon}" target="_blank" rel="noopener">Support her on Patreon</a> for more every day.`);
      }
      else if (e.status === 429) sys("slow DOWN. one at a time. (wait a few seconds)");
      else if (e.status === 413) sys("That was too big for her - try a shorter recording or a smaller picture.");
      else if (d.error === "no speech") sys("She didn't hear anything - hold the mic button while you talk.");
      else if (d.error === "busy") sys(esc(d.message || "She's resting right now - try again later."));
      else sys("ugh, her brain lagged. say that again? <span class='fine'>(" + esc(e.message) + ")</span>");
      if (hist.length && hist[hist.length - 1].who === "me") { hist.pop(); save(); mine.style.opacity = ".55"; }
    } finally { busy = false; setBusy(false); }
  }
  function setBusy(on) { ["#b-send", "#b-mic", "#b-file", "#b-cam"].forEach(s => $(s).disabled = on); }
  function playAudio(b64, type, row) {
    try {
      const url = URL.createObjectURL(new Blob([Uint8Array.from(atob(b64), c => c.charCodeAt(0))], { type }));
      const a = new Audio(url), btn = document.createElement("button");
      btn.type = "button"; btn.className = "play"; btn.textContent = "▶ play again"; btn.addEventListener("click", () => { a.currentTime = 0; a.play(); });
      $(".b", row).appendChild(document.createElement("br")); $(".b", row).appendChild(btn);
      a.play().catch(() => {});
    } catch (e) {}
  }

  form.addEventListener("submit", e => {
    e.preventDefault();
    const text = ta.value.trim(); if (!text && !pending) return;
    const p = pending; ta.value = ""; autosize(); clearAttach();
    send({ text, image: p && p.data, thumb: p && p.thumb });
  });
  ta.addEventListener("keydown", e => { if (e.key === "Enter" && !e.shiftKey && !e.isComposing) { e.preventDefault(); form.requestSubmit ? form.requestSubmit() : form.dispatchEvent(new Event("submit")); } });
  const autosize = () => { ta.style.height = "auto"; ta.style.height = Math.min(ta.scrollHeight, 160) + "px"; };
  ta.addEventListener("input", autosize);

  // ---------- pictures: file picker, paste, webcam -> downscaled JPEG (max 1280 px), attached until you send
  async function toJpeg(src, maxSide) {
    const img = await new Promise((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = bad; i.src = src; });
    const w0 = img.naturalWidth || img.width, h0 = img.naturalHeight || img.height, k = Math.min(1, maxSide / Math.max(w0, h0));
    const c = document.createElement("canvas"); c.width = Math.max(1, Math.round(w0 * k)); c.height = Math.max(1, Math.round(h0 * k));
    const g = c.getContext("2d"); g.fillStyle = "#000"; g.fillRect(0, 0, c.width, c.height); g.drawImage(img, 0, 0, c.width, c.height);
    return c.toDataURL("image/jpeg", .85);
  }
  async function attach(blobOrUrl) {
    let url = typeof blobOrUrl === "string" ? blobOrUrl : URL.createObjectURL(blobOrUrl);
    try {
      const data = await toJpeg(url, MAX_SIDE), thumb = await toJpeg(data, 180);
      pending = { data, thumb }; $("#attach-img").src = thumb; $("#attach").hidden = false; ta.focus();
    } catch (e) { toast("That picture couldn't be read.", true); }
    finally { if (typeof blobOrUrl !== "string") URL.revokeObjectURL(url); }
  }
  function clearAttach() { pending = null; $("#attach").hidden = true; $("#attach-img").removeAttribute("src"); }
  $("#attach-x").addEventListener("click", clearAttach);
  $("#b-file").addEventListener("click", () => $("#file").click());
  $("#file").addEventListener("change", e => { const f = e.target.files[0]; if (f) attach(f); e.target.value = ""; });
  ta.addEventListener("paste", e => { const it = [...(e.clipboardData || {}).items || []].find(i => i.type.startsWith("image/")); if (it) { e.preventDefault(); attach(it.getAsFile()); } });

  // webcam: ask, preview, capture one frame, never auto-send
  let camStream = null;
  const camStop = () => { if (camStream) camStream.getTracks().forEach(t => t.stop()); camStream = null; $("#cam-v").srcObject = null; };
  const camClose = () => { camStop(); $("#cam").hidden = true; };
  function camMode(shot) { $("#cam-v").hidden = shot; $("#cam-shot").hidden = !shot; $("#cam-snap").hidden = shot; $("#cam-use").hidden = !shot; $("#cam-retake").hidden = !shot; }
  async function camOpen() {
    $("#cam").hidden = false; camMode(false); $("#cam-note").textContent = "Your browser will ask for camera permission. Nothing is sent until you press send.";
    try {
      camStream = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1280 }, height: { ideal: 960 }, facingMode: "user" }, audio: false });
      const v = $("#cam-v"); v.srcObject = camStream; await v.play();
      $("#cam-note").textContent = "Your camera turns off as soon as you take the photo. Nothing is sent until you press send.";
    } catch (e) { $("#cam-note").textContent = "No camera access (" + (e.name === "NotAllowedError" ? "permission denied" : "no camera found") + ")."; $("#cam-snap").hidden = true; }
  }
  $("#b-cam").addEventListener("click", camOpen);
  $("#cam-cancel").addEventListener("click", camClose);
  $("#cam-retake").addEventListener("click", camOpen);
  $("#cam-snap").addEventListener("click", () => {
    const v = $("#cam-v"); if (!v.videoWidth) return;
    const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
    c.getContext("2d").drawImage(v, 0, 0); $("#cam-shot").src = c.toDataURL("image/jpeg", .9); camStop(); camMode(true);
  });
  $("#cam-use").addEventListener("click", async () => { const src = $("#cam-shot").src; $("#cam").hidden = true; await attach(src); hint.textContent = "Snapshot attached - add a message or just press send."; });
  document.addEventListener("keydown", e => { if (e.key === "Escape" && !$("#cam").hidden) camClose(); });

  // ---------- mic: hold to talk (webm/opus), sent when you let go
  let rec = null, chunks = [], micStream = null, recStart = 0, recTimer = 0, wantStop = false;
  const mime = () => ["audio/webm;codecs=opus", "audio/webm", "audio/ogg;codecs=opus"].find(t => MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(t)) || "";
  async function recStartFn() {
    if (busy || rec) return; wantStop = false;
    try { if (!micStream) { hint.textContent = "Allow the microphone, then hold the button while you talk."; micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true } }); } }
    catch (e) { hint.textContent = "No microphone access - check your browser's permission for this site."; return; }
    if (wantStop) { hint.textContent = "Mic ready - now hold the button while you talk."; return; }   // permission prompt ate the press
    const t = mime(); if (!t) { hint.textContent = "This browser can't record in a format she understands - try Chrome, Edge or Firefox."; return; }
    chunks = []; rec = new MediaRecorder(micStream, { mimeType: t, audioBitsPerSecond: 32000 });
    rec.ondataavailable = e => e.data && e.data.size && chunks.push(e.data);
    rec.onstop = onRecStop; rec.start(); recStart = Date.now();
    $("#b-mic").classList.add("rec"); hint.textContent = "Listening… let go to send.";
    recTimer = setTimeout(recStopFn, MAX_REC_MS);
  }
  function recStopFn() { wantStop = true; clearTimeout(recTimer); if (rec && rec.state !== "inactive") rec.stop(); }
  async function onRecStop() {
    $("#b-mic").classList.remove("rec"); const dur = Date.now() - recStart, type = rec.mimeType; rec = null;
    if (micStream) { micStream.getTracks().forEach(t => t.stop()); micStream = null; }   // mic off between presses
    if (dur < 500 || !chunks.length) { hint.textContent = "Too short - hold the button while you talk."; return; }
    hint.textContent = "";
    const blob = new Blob(chunks, { type: type.split(";")[0] || "audio/webm" });
    const data = await new Promise(ok => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(blob); });
    const p = pending, text = ta.value.trim(); ta.value = ""; autosize(); clearAttach();
    send({ text, audio: data, image: p && p.data, thumb: p && p.thumb });
  }
  const mic = $("#b-mic");
  mic.addEventListener("pointerdown", e => { e.preventDefault(); try { mic.setPointerCapture(e.pointerId); } catch (_) {} recStartFn(); });
  ["pointerup", "pointercancel"].forEach(ev => mic.addEventListener(ev, recStopFn));
  mic.addEventListener("contextmenu", e => e.preventDefault());
  mic.addEventListener("keydown", e => { if ((e.key === " " || e.key === "Enter") && !e.repeat) { e.preventDefault(); recStartFn(); } });
  mic.addEventListener("keyup", e => { if (e.key === " " || e.key === "Enter") { e.preventDefault(); recStopFn(); } });

  boot();
})();
