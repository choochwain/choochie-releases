#!/usr/bin/env node
// Heart Clicker sound effects: renders the browser's WebAudio tones (docs/clicker/ui.js `sfx`) to WAV files in
// docs/clicker/sfx/, so the desktop app can play the very same sounds. Usage (from the repo root): node tools/clicker_sfx.js
// Each tone: oscillator (sine / triangle / square / sawtooth, band-limited), frequency sliding exponentially from f to f*slide over
// the duration, gain rising exponentially from silence to `gain` in 10 ms, then falling exponentially to silence at the end.
// Rendered at sfx volume 1.0, 44.1 kHz, 16-bit mono. Keep the table below in sync with `sfx` in ui.js.
"use strict";
const fs = require("fs"), path = require("path");
const RATE = 44100, OUT = path.join(__dirname, "..", "docs", "clicker", "sfx");

// [startSeconds, freqHz, durSeconds, type, gain, slide]
const semi = n => Math.pow(2, n / 12);
const SFX = {
  pop:       [[0, 520, 0.08, "sine", 0.16, 1.6]],                                  // heat 0 (the web raises it: 520 + heat*520 Hz)
  pop_hot:   [[0, 1040, 0.08, "sine", 0.16, 1.6]],                                 // heat 1 (full heat / frenzy)
  crit:      [[0, 880, 0.12, "triangle", 0.2, 1.5], [0.05, 1320, 0.14, "triangle", 0.16, 1.4]],
  buy:       [[0, 660, 0.07, "square", 0.06, 1.2], [0.06, 990, 0.1, "square", 0.05, 1.1]],
  no:        [[0, 180, 0.12, "sawtooth", 0.06, 0.8]],
  tick:      [[0, 1500, 0.025, "square", 0.05, 1]],
  frenzy:    [0, 1, 2, 3, 4].map(i => [i * 0.055, 400 + i * 160, 0.12, "sawtooth", 0.07, 1.3]),
  gold:      [0, 4, 7, 12].map((n, i) => [i * 0.07, 660 * semi(n), 0.16, "triangle", 0.12, 1]),
  level:     [0, 4, 7, 12, 16].map((n, i) => [i * 0.09, 520 * semi(n), 0.22, "triangle", 0.13, 1]),
  bad:       [[0, 330, 0.25, "sawtooth", 0.06, 0.6]],
  tribute:   [0, 7, 12, 19].map((n, i) => [i * 0.085, 440 * semi(n), 0.2, "triangle", 0.12, 1.02]).concat([[0.38, 1760, 0.3, "sine", 0.08, 1]]),
  helper_tap:[[0, 1050, 0.035, "sine", 0.05, 1.3]],                                // the web varies it 900-1200 Hz
};

function wave(type, phase, f) {                     // band-limited by summing harmonics below 18 kHz
  if (type === "sine") return Math.sin(phase);
  const max = Math.max(1, Math.floor(18000 / f)); let v = 0;
  if (type === "square") { for (let k = 1; k <= max; k += 2) v += Math.sin(k * phase) / k; return v * 4 / Math.PI; }
  if (type === "sawtooth") { for (let k = 1; k <= max; k++) v += (k % 2 ? 1 : -1) * Math.sin(k * phase) / k; return v * 2 / Math.PI; }
  for (let k = 1, s = 1; k <= max; k += 2, s = -s) v += s * Math.sin(k * phase) / (k * k);   // triangle
  return v * 8 / (Math.PI * Math.PI);
}
function render(tones) {
  const end = Math.max(...tones.map(t => t[0] + t[2] + 0.02)), buf = new Float32Array(Math.ceil(end * RATE));
  for (const [t0, f0, dur, type, gain, slide] of tones) {
    let phase = 0; const n0 = Math.round(t0 * RATE), n = Math.round((dur + 0.02) * RATE);
    for (let i = 0; i < n && n0 + i < buf.length; i++) {
      const t = i / RATE, f = f0 * Math.pow(slide || 1, Math.min(1, t / dur));
      phase += 2 * Math.PI * f / RATE;
      const g = t < 0.01 ? 0.0001 * Math.pow(gain / 0.0001, t / 0.01) : t < dur ? gain * Math.pow(0.0001 / gain, (t - 0.01) / (dur - 0.01)) : 0;
      buf[n0 + i] += wave(type, phase, f) * g;
    }
  }
  return buf;
}
function wav(samples) {
  const b = Buffer.alloc(44 + samples.length * 2);
  b.write("RIFF", 0); b.writeUInt32LE(36 + samples.length * 2, 4); b.write("WAVE", 8); b.write("fmt ", 12);
  b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(1, 22); b.writeUInt32LE(RATE, 24); b.writeUInt32LE(RATE * 2, 28);
  b.writeUInt16LE(2, 32); b.writeUInt16LE(16, 34); b.write("data", 36); b.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) b.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32767), 44 + i * 2);
  return b;
}
fs.mkdirSync(OUT, { recursive: true });
for (const [name, tones] of Object.entries(SFX)) {
  const file = path.join(OUT, name + ".wav"); fs.writeFileSync(file, wav(render(tones)));
  console.log(name + ".wav", fs.statSync(file).size, "bytes");
}
