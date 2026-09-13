#!/usr/bin/env node
/*
 * Verifica cobertura y enlaces de los recursos.
 *   node tools/check-resources.js            -> cobertura por tema
 *   node tools/check-resources.js --links    -> además comprueba cada URL (HTTP)
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
global.window = {};
require(path.join(ROOT, "data/curriculum.js"));
const resDir = path.join(ROOT, "data/resources");
const files = fs.readdirSync(resDir).filter((f) => /^r\d+.*\.js$/.test(f)).sort();
for (const f of files) {
  try { require(path.join(resDir, f)); }
  catch (e) { console.error(`✗ ${f}: ${e.message}`); process.exitCode = 1; }
}

const CATS = ["theory", "videos", "listening", "songs", "reading", "tests"];
const MIN = { theory: 2, videos: 2, listening: 1, songs: 0, reading: 1, tests: 3 };
const R = window.ER_RESOURCES || {};
const topics = [];
window.ER_CURRICULUM.levels.forEach((l) => l.clusters.forEach((c) => c.topics.forEach((t) => topics.push(t))));
const ids = new Set(topics.map((t) => t.id));

let missing = 0, thin = 0, total = 0;
const allUrls = new Map();
for (const t of topics) {
  const r = R[t.id];
  if (!r) { console.log(`MISSING  ${t.id}`); missing++; continue; }
  const counts = CATS.map((c) => (r[c] || []).length);
  total += counts.reduce((a, b) => a + b, 0);
  const low = CATS.filter((c, i) => counts[i] < MIN[c]);
  if (low.length) { thin++; console.log(`THIN     ${t.id.padEnd(32)} ${CATS.map((c, i) => c[0] + counts[i]).join(" ")}  (<min: ${low.join(",")})`); }
  CATS.forEach((c) => (r[c] || []).forEach((x) => {
    if (!x.url || !/^https?:\/\//.test(x.url)) console.log(`BADURL   ${t.id} ${c} ${x.url}`);
    if (!x.title) console.log(`NOTITLE  ${t.id} ${c} ${x.url}`);
    if (!allUrls.has(x.url)) allUrls.set(x.url, []);
    allUrls.get(x.url).push(`${t.id}/${c}`);
  }));
}
Object.keys(R).filter((k) => !ids.has(k)).forEach((k) => console.log(`UNKNOWN  ${k} (no existe en curriculum)`));
console.log(`\nTopics: ${topics.length} · con recursos: ${topics.length - missing} · sin recursos: ${missing} · por debajo del mínimo: ${thin}`);
console.log(`Recursos: ${total} · URLs únicas: ${allUrls.size}`);

if (process.argv.includes("--links")) {
  (async () => {
    const urls = [...allUrls.keys()];
    const bad = [];
    let i = 0;
    const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128 Safari/537.36";
    async function worker() {
      while (i < urls.length) {
        const url = urls[i++];
        let status = 0;
        try {
          const ctrl = new AbortController();
          const to = setTimeout(() => ctrl.abort(), 15000);
          const res = await fetch(url, { redirect: "follow", signal: ctrl.signal, headers: { "User-Agent": UA, Accept: "text/html,*/*" } });
          clearTimeout(to);
          status = res.status;
        } catch (e) { status = e.name === "AbortError" ? "TIMEOUT" : "ERR"; }
        if (!(status >= 200 && status < 400)) bad.push({ url, status, where: allUrls.get(url).join(", ") });
      }
    }
    await Promise.all(Array.from({ length: 10 }, worker));
    // 403/429 suelen ser bloqueos anti-bot (el enlace funciona en navegador): se listan aparte.
    const hard = bad.filter((b) => ![403, 429, "TIMEOUT"].includes(b.status));
    const soft = bad.filter((b) => [403, 429, "TIMEOUT"].includes(b.status));
    console.log(`\nEnlaces rotos (${hard.length}):`);
    hard.forEach((b) => console.log(`  ${b.status}  ${b.url}  <- ${b.where}`));
    console.log(`\nDudosos / anti-bot (${soft.length}):`);
    soft.forEach((b) => console.log(`  ${b.status}  ${b.url}  <- ${b.where}`));
  })();
}
