#!/usr/bin/env node
// Clicker media manifest: scans docs/clicker/media/level1, level2, ... and writes docs/clicker/media/manifest.json,
// which the clicker page reads to know which pictures, sounds and videos each level has.
// Usage (from the repo root):  node tools/clicker_manifest.js      (or double-click tools/clicker_manifest.cmd)
// Drop files into the level folders (sub-folders are fine), run this, commit and push. The GitHub Action
// .github/workflows/clicker-manifest.yml also runs it on every push that touches the media folders.
"use strict";
const fs = require("fs"), path = require("path");

const MEDIA = path.join(__dirname, "..", "docs", "clicker", "media");
const KINDS = {
  images: [".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".svg"],
  audio: [".mp3", ".ogg", ".oga", ".wav", ".m4a", ".aac", ".opus", ".flac"],
  video: [".mp4", ".webm", ".ogv", ".mov", ".m4v"],
};
const kindOf = f => { const e = path.extname(f).toLowerCase(); for (const k in KINDS) if (KINDS[k].includes(e)) return k; return null; };
const natural = (a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" });

function walk(dir, rel, out) {
  let list = [];
  try { list = fs.readdirSync(dir, { withFileTypes: true }); } catch (e) { return out; }
  list.sort((a, b) => natural(a.name, b.name));
  for (const d of list) {
    if (d.name.startsWith(".") || d.name.startsWith("_")) continue;          // .gitkeep, _drafts/ ...
    const p = path.join(dir, d.name), r = rel ? rel + "/" + d.name : d.name;
    if (d.isDirectory()) walk(p, r, out);
    else if (d.isFile()) { const k = kindOf(d.name); if (k) out[k].push(r); }
  }
  return out;
}

if (!fs.existsSync(MEDIA)) { console.error("No media folder at " + MEDIA); process.exit(1); }
const levels = fs.readdirSync(MEDIA, { withFileTypes: true })
  .filter(d => d.isDirectory() && /^level\d+$/i.test(d.name))
  .map(d => d.name).sort(natural)
  .map(name => {
    const files = walk(path.join(MEDIA, name), "", { images: [], audio: [], video: [] });
    const pre = s => name + "/" + s;
    let title = "";
    try { title = fs.readFileSync(path.join(MEDIA, name, "_name.txt"), "utf8").split(/\r?\n/)[0].trim().slice(0, 40); } catch (e) {}
    return { id: name.toLowerCase(), title, images: files.images.map(pre), audio: files.audio.map(pre), video: files.video.map(pre) };
  });

const manifest = { version: 1, levels };
const file = path.join(MEDIA, "manifest.json");
const next = JSON.stringify(manifest, null, 1) + "\n";
let prev = ""; try { prev = fs.readFileSync(file, "utf8"); } catch (e) {}
if (prev !== next) fs.writeFileSync(file, next);
for (const l of levels) console.log(`${l.id.padEnd(8)} ${String(l.images.length).padStart(4)} pictures ${String(l.audio.length).padStart(4)} sounds ${String(l.video.length).padStart(4)} videos${l.title ? "  (" + l.title + ")" : ""}`);
console.log(prev === next ? "manifest.json already up to date" : "wrote " + path.relative(process.cwd(), file));
