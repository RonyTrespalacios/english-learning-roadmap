/* English Roadmap — app logic (vanilla JS, sin dependencias) */
(function () {
  "use strict";

  const CURRICULUM = window.ER_CURRICULUM;
  const RESOURCES = window.ER_RESOURCES || {};
  const STORAGE_KEY = "er:progress:v1";
  const CATEGORIES = [
    { key: "theory", label: "Teoría", icon: "📘" },
    { key: "videos", label: "Videos explicativos", icon: "🎬" },
    { key: "listening", label: "Listening", icon: "🎧" },
    { key: "songs", label: "Canciones", icon: "🎵" },
    { key: "reading", label: "Lecturas", icon: "📰" },
    { key: "tests", label: "Tests y ejercicios", icon: "✅" },
  ];
  const TYPES = {
    grammar: "Gramática",
    vocab: "Vocabulario",
    pronunciation: "Pronunciación",
    skills: "Habilidades",
    method: "Método",
    test: "Diagnóstico / Examen",
  };

  /* ---------------- Progress (localStorage) ---------------- */
  const progress = loadProgress();
  function loadProgress() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const p = raw ? JSON.parse(raw) : {};
      return { done: p.done || {}, topicDone: p.topicDone || {} };
    } catch (e) {
      return { done: {}, topicDone: {} };
    }
  }
  function saveProgress() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(progress)); } catch (e) { /* quota / private mode */ }
  }
  const resKey = (topicId, res) => topicId + "|" + res.url;

  /* ---------------- Data helpers ---------------- */
  const topicsById = {};
  const topicOrder = [];
  CURRICULUM.levels.forEach((lvl) => {
    lvl.clusters.forEach((cl) => {
      cl.topics.forEach((t) => {
        t._level = lvl; t._cluster = cl;
        topicsById[t.id] = t;
        topicOrder.push(t.id);
      });
    });
  });

  function topicResources(topicId) {
    const r = RESOURCES[topicId] || {};
    const list = [];
    CATEGORIES.forEach((c) => (r[c.key] || []).forEach((res) => list.push({ ...res, _cat: c.key })));
    return list;
  }
  function topicStatus(topicId) {
    const list = topicResources(topicId);
    const total = list.length;
    const done = list.filter((res) => progress.done[resKey(topicId, res)]).length;
    const complete = progress.topicDone[topicId] === true || (total > 0 && done === total);
    return { total, done, complete };
  }
  function levelStatus(level) {
    let total = 0, done = 0;
    level.clusters.forEach((cl) => cl.topics.forEach((t) => { total++; if (topicStatus(t.id).complete) done++; }));
    return { total, done };
  }

  /* ---------------- Render roadmap ---------------- */
  const body = document.getElementById("roadmap-body");
  const svg = document.getElementById("connectors");

  function renderRoadmap() {
    body.innerHTML = "";
    let n = 0;
    CURRICULUM.levels.forEach((lvl) => {
      const levelEl = el("section", { class: "level", id: "level-" + lvl.id, style: `--level-color:${lvl.color}` });
      const ms = el("div", { class: "milestone", "data-level": lvl.id });
      ms.innerHTML = `<span class="code">${lvl.code}</span><span>${lvl.name}</span><span class="pct"></span>`;
      levelEl.appendChild(ms);

      const box = el("div", { class: "level-box" });
      box.innerHTML = `
        <div class="level-head">
          <div>
            <h2 class="level-title"><span>${lvl.code}</span> · ${lvl.name}</h2>
            <p class="level-sub">${lvl.subtitle}</p>
          </div>
          <p class="level-intro">${lvl.intro}</p>
        </div>`;
      const clusters = el("div", { class: "clusters" });
      lvl.clusters.forEach((cl) => {
        const cEl = el("div", { class: "cluster", "data-cluster": cl.id });
        cEl.innerHTML = `<div class="cluster-title">${cl.name}</div>`;
        const list = el("div", { class: "cluster-list" });
        cl.topics.forEach((t) => {
          n++;
          const wrap = el("div", { class: "node-wrap" });
          const btn = el("button", { class: "node", type: "button", "data-topic": t.id, "data-type": t.type, title: t.en });
          btn.innerHTML = `<span class="num"><span>${n}</span></span><span class="label">${t.title}</span><span class="meta"></span>`;
          btn.addEventListener("click", () => openTopic(t.id));
          wrap.appendChild(btn);
          list.appendChild(wrap);
        });
        cEl.appendChild(list);
        clusters.appendChild(cEl);
      });
      box.appendChild(clusters);
      levelEl.appendChild(box);
      body.appendChild(levelEl);
    });
    renderLegend();
    renderNav();
    refreshStatus();
    requestAnimationFrame(drawConnectors);
  }

  function renderLegend() {
    const lg = document.getElementById("legend");
    lg.innerHTML = Object.entries(TYPES)
      .map(([k, v]) => `<span class="chip"><i style="background:var(--t-${k})"></i>${v}</span>`)
      .join("") + `<span class="chip done"><i style="background:var(--ok-bg)"></i>Tema completado</span>`;
  }

  function renderNav() {
    const nav = document.getElementById("level-nav");
    nav.innerHTML = CURRICULUM.levels
      .map((l) => `<a href="#level-${l.id}" data-level="${l.id}"><span>${l.code}</span><small></small></a>`)
      .join("");
  }

  function refreshStatus() {
    let totalTopics = 0, doneTopics = 0;
    CURRICULUM.levels.forEach((lvl) => {
      const st = levelStatus(lvl);
      totalTopics += st.total; doneTopics += st.done;
      const ms = document.querySelector(`.milestone[data-level="${lvl.id}"]`);
      if (ms) {
        ms.querySelector(".pct").textContent = `${st.done}/${st.total}`;
        ms.classList.toggle("complete", st.done === st.total && st.total > 0);
      }
      const nav = document.querySelector(`.level-nav a[data-level="${lvl.id}"] small`);
      if (nav) nav.textContent = `${Math.round((st.done / st.total) * 100)}%`;
    });
    document.querySelectorAll(".node").forEach((btn) => {
      const st = topicStatus(btn.dataset.topic);
      btn.classList.toggle("done", st.complete);
      btn.querySelector(".meta").textContent = st.total ? `${st.done}/${st.total}` : "";
    });
    document.getElementById("global-bar").style.transform = `scaleX(${totalTopics ? doneTopics / totalTopics : 0})`;
    document.getElementById("global-label").textContent = `${doneTopics} / ${totalTopics} temas`;
  }

  /* ---------------- Connectors (SVG) ---------------- */
  function drawConnectors() {
    const root = document.getElementById("roadmap");
    const rb = root.getBoundingClientRect();
    svg.setAttribute("width", rb.width);
    svg.setAttribute("height", rb.height);
    svg.setAttribute("viewBox", `0 0 ${rb.width} ${rb.height}`);
    const rel = (r) => ({ x: r.left - rb.left, y: r.top - rb.top, w: r.width, h: r.height, cx: r.left - rb.left + r.width / 2, cy: r.top - rb.top + r.height / 2 });
    let d = "";
    let dashed = "";
    const levels = Array.from(body.querySelectorAll(".level"));
    levels.forEach((lv, i) => {
      const ms = rel(lv.querySelector(".milestone").getBoundingClientRect());
      const box = rel(lv.querySelector(".level-box").getBoundingClientRect());
      // milestone -> level box top
      d += ` M ${ms.cx} ${ms.y + ms.h} L ${ms.cx} ${box.y}`;
      // cluster -> next cluster (dashed arrow in the gap between boxes, same row only)
      const cls = Array.from(lv.querySelectorAll(".cluster")).map((c) => rel(c.getBoundingClientRect()));
      for (let k = 0; k < cls.length - 1; k++) {
        const a = cls[k], b = cls[k + 1];
        if (Math.abs(a.y - b.y) > 4 || b.x <= a.x) continue;
        const y = a.y + 24;
        dashed += ` M ${a.x + a.w + 2} ${y} L ${b.x - 3} ${y}`;
        d += ` M ${b.x - 9} ${y - 5} L ${b.x - 2} ${y} L ${b.x - 9} ${y + 5}`;
      }
      // level box bottom -> next milestone
      if (i < levels.length - 1) {
        const next = rel(levels[i + 1].querySelector(".milestone").getBoundingClientRect());
        d += ` M ${ms.cx} ${box.y + box.h} L ${next.cx} ${next.y - 10}`;
        d += ` M ${next.cx - 7} ${next.y - 14} L ${next.cx} ${next.y - 2} L ${next.cx + 7} ${next.y - 14}`;
      }
    });
    svg.innerHTML = `
      <path d="${d}" fill="none" stroke="#111827" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <path d="${dashed}" fill="none" stroke="#111827" stroke-width="2" stroke-dasharray="6 6" opacity="0.6"/>`;
  }
  let rt;
  const ro = new ResizeObserver(() => { clearTimeout(rt); rt = setTimeout(drawConnectors, 60); });
  ro.observe(document.getElementById("roadmap-body"));
  window.addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(drawConnectors, 60); });

  /* ---------------- Modal ---------------- */
  const modal = document.getElementById("modal");
  const modalContent = document.getElementById("modal-content");
  let currentTopic = null;

  function openTopic(id) {
    const t = topicsById[id];
    if (!t) return;
    currentTopic = id;
    history.replaceState(null, "", "#" + id);
    modalContent.innerHTML = buildTopicHTML(t);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.scrollTop = 0;
    bindModal(t);
    observeImages();
  }
  function closeModal() {
    modal.hidden = true;
    document.body.style.overflow = "";
    currentTopic = null;
    history.replaceState(null, "", location.pathname + location.search);
    refreshStatus();
  }
  modal.addEventListener("click", (e) => { if (e.target.hasAttribute("data-close")) closeModal(); });
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !modal.hidden) closeModal(); });

  function buildTopicHTML(t) {
    const st = topicStatus(t.id);
    const res = RESOURCES[t.id] || {};
    const structure = t.structure && t.structure.length ? `
      <div class="m-section-title">Estructura y ejemplos</div>
      <div class="structure-wrap"><table class="structure">
        <thead><tr><th>Forma</th><th>Patrón</th><th>Ejemplos</th></tr></thead>
        <tbody>${t.structure.map((s) => `<tr><td><b>${esc(s.label)}</b></td><td class="pattern">${esc(s.pattern)}</td><td>${s.examples.map((e) => `<span class="ex">${esc(e)}</span>`).join("")}</td></tr>`).join("")}</tbody>
      </table></div>` : "";
    const tips = t.tips && t.tips.length ? `
      <div class="m-section-title">Tips</div>
      <ul class="tips">${t.tips.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : "";
    const sections = CATEGORIES.map((c) => {
      const items = res[c.key] || [];
      if (!items.length && c.key === "songs") return "";
      return `
        <div class="m-section-title">${c.icon} ${c.label} <span class="count">${items.length}</span></div>
        ${items.length ? `<div class="cards">${items.map((r) => cardHTML(t.id, r, c.key)).join("")}</div>` : `<div class="empty-res">Sin recursos todavía para esta categoría.</div>`}`;
    }).join("");
    return `
      <div class="m-badges">
        <span class="badge" style="background:${t._level.color};color:#fff;border-color:${t._level.color}">${t._level.code} · ${t._level.name}</span>
        <span class="badge type" data-type="${t.type}">${TYPES[t.type] || t.type}</span>
        <span class="badge">${esc(t._cluster.name)}</span>
      </div>
      <h2 class="m-title" id="modal-title">${esc(t.title)}</h2>
      <p class="m-en">${esc(t.en)}</p>
      ${t.why ? `<div class="m-why"><b>¿Por qué está aquí?</b> ${esc(t.why)}</div>` : ""}
      ${t.summary ? `<p class="m-summary">${esc(t.summary)}</p>` : ""}
      ${structure}
      ${tips}
      <div class="m-progress">
        <strong>Progreso del tema</strong>
        <div class="progress-bar"><div class="progress-fill" id="m-bar" style="transform:scaleX(${st.total ? st.done / st.total : 0})"></div></div>
        <span class="progress-label" id="m-label">${st.done} / ${st.total} recursos</span>
        <button class="btn ghost" id="m-all" type="button">Marcar todo</button>
        <label class="manual"><input type="checkbox" id="m-manual" ${progress.topicDone[t.id] ? "checked" : ""}/> Marcar tema como completado</label>
      </div>
      ${sections}`;
  }

  function cardHTML(topicId, r, cat) {
    const key = resKey(topicId, r);
    const done = !!progress.done[key];
    const domain = hostOf(r.url);
    const fav = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64`;
    const title = cat === "songs" && r.artist ? `${r.title} — ${r.artist}` : r.title;
    return `
      <article class="card ${done ? "done" : ""}" data-key="${esc(key)}">
        <a class="card-preview" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer" data-preview="${esc(r.url)}">
          <div class="ph"><img class="fav" src="${fav}" alt="" loading="lazy"/><span class="dom">${esc(domain)}</span><span class="spinner"></span></div>
          <img alt="" data-src="${esc(r.url)}"/>
          <button class="refresh" type="button" title="Recargar vista previa" data-refresh>↻</button>
        </a>
        <div class="card-body">
          <div class="card-source"><img src="${fav}" alt="" loading="lazy"/>${esc(r.source || domain)}</div>
          <a class="card-title" href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${esc(title)}</a>
          ${r.desc ? `<p class="card-desc">${esc(r.desc)}</p>` : ""}
        </div>
        <div class="card-foot">
          <label class="check"><input type="checkbox" data-check="${esc(key)}" ${done ? "checked" : ""}/> Hecho</label>
          <span class="lang">${(r.lang || "en").toUpperCase()}</span>
        </div>
      </article>`;
  }

  function bindModal(t) {
    modalContent.querySelectorAll("input[data-check]").forEach((cb) => {
      cb.addEventListener("change", () => {
        const key = cb.dataset.check;
        if (cb.checked) progress.done[key] = true; else delete progress.done[key];
        cb.closest(".card").classList.toggle("done", cb.checked);
        saveProgress();
        updateModalProgress(t.id);
      });
    });
    modalContent.querySelector("#m-all").addEventListener("click", () => {
      const cbs = modalContent.querySelectorAll("input[data-check]");
      const allDone = Array.from(cbs).every((c) => c.checked);
      cbs.forEach((c) => { c.checked = !allDone; c.dispatchEvent(new Event("change")); });
    });
    modalContent.querySelector("#m-manual").addEventListener("change", (e) => {
      if (e.target.checked) progress.topicDone[t.id] = true; else delete progress.topicDone[t.id];
      saveProgress();
      updateModalProgress(t.id);
    });
    modalContent.querySelectorAll("[data-refresh]").forEach((b) => {
      b.addEventListener("click", (e) => {
        e.preventDefault(); e.stopPropagation();
        const a = b.closest(".card-preview");
        loadPreview(a, true);
      });
    });
  }
  function updateModalProgress(topicId) {
    const st = topicStatus(topicId);
    const bar = modalContent.querySelector("#m-bar");
    const label = modalContent.querySelector("#m-label");
    if (bar) bar.style.transform = `scaleX(${st.total ? st.done / st.total : 0})`;
    if (label) label.textContent = `${st.done} / ${st.total} recursos`;
    const all = modalContent.querySelector("#m-all");
    if (all) all.textContent = st.total && st.done === st.total ? "Desmarcar todo" : "Marcar todo";
    refreshStatus();
  }

  /* ---------------- Preview images: lazy + cache (IndexedDB + Service Worker) ---------------- */
  const IDB_NAME = "er-preview-cache", IDB_STORE = "images";
  let idbP = null;
  function idb() {
    if (idbP) return idbP;
    idbP = new Promise((resolve) => {
      try {
        const req = indexedDB.open(IDB_NAME, 1);
        req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(null);
      } catch (e) { resolve(null); }
    });
    return idbP;
  }
  async function idbGet(key) {
    const db = await idb(); if (!db) return null;
    return new Promise((res) => {
      const tx = db.transaction(IDB_STORE, "readonly").objectStore(IDB_STORE).get(key);
      tx.onsuccess = () => res(tx.result || null); tx.onerror = () => res(null);
    });
  }
  async function idbSet(key, val) {
    const db = await idb(); if (!db) return;
    try { db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).put(val, key); } catch (e) { /* ignore */ }
  }
  async function idbDel(key) {
    const db = await idb(); if (!db) return;
    try { db.transaction(IDB_STORE, "readwrite").objectStore(IDB_STORE).delete(key); } catch (e) { /* ignore */ }
  }

  function previewSources(url) {
    const yt = youtubeId(url);
    if (yt) return [`https://img.youtube.com/vi/${yt}/hqdefault.jpg`];
    return [
      `https://s0.wp.com/mshots/v1/${encodeURIComponent(url)}?w=640&h=400`,
      `https://image.thum.io/get/width/640/crop/400/noanimate/${url}`,
    ];
  }
  function youtubeId(url) {
    const m = url.match(/(?:youtube\.com\/watch\?(?:.*&)?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{11})/);
    return m ? m[1] : null;
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { io.unobserve(en.target); loadPreview(en.target, false); }
    });
  }, { root: null, rootMargin: "300px 0px" });

  function observeImages() {
    modalContent.querySelectorAll(".card-preview").forEach((a) => io.observe(a));
  }

  async function loadPreview(a, force) {
    const url = a.dataset.preview;
    const img = a.querySelector("img[data-src]");
    const ph = a.querySelector(".ph");
    if (!img) return;
    img.classList.remove("loaded");
    ph.style.display = "";
    if (force) await idbDel(url);
    else {
      const cached = await idbGet(url);
      if (cached) { showBlob(img, ph, cached); return; }
    }
    let fallback = null;
    for (const src of previewSources(url)) {
      const res = await fetchPreview(src);
      if (!res) continue;
      if (res.placeholder) { fallback = fallback || res.blob; continue; }
      await idbSet(url, res.blob);          // solo se cachea una captura real
      showBlob(img, ph, res.blob);
      return;
    }
    if (fallback) {
      showBlob(img, ph, fallback);
      // mShots genera la captura en segundo plano: reintentar más tarde (sin cachear el placeholder)
      const tries = (retries[url] = (retries[url] || 0) + 1);
      if (tries <= 3) setTimeout(() => { if (a.isConnected) loadPreview(a, false); }, 8000 * tries);
      return;
    }
    const sp = ph.querySelector(".spinner"); if (sp) sp.remove();
  }
  const retries = {};

  // Descarga con CORS y valida que sea una imagen real (no el "Generating preview" de mShots).
  async function fetchPreview(src) {
    try {
      const resp = await fetch(src, { mode: "cors" });
      if (!resp.ok) return null;
      const blob = await resp.blob();
      if (!blob.type.startsWith("image/") || blob.size < 1500) return null;
      let placeholder = false;
      if (src.includes("mshots") && "createImageBitmap" in window) {
        try {
          const bmp = await createImageBitmap(blob);
          placeholder = bmp.width !== 640; // la captura real mide 640x400; el placeholder 400x300
          bmp.close && bmp.close();
        } catch (e) { placeholder = true; }
      }
      return { blob, placeholder };
    } catch (e) { return null; }
  }
  function showBlob(img, ph, blob) {
    const u = URL.createObjectURL(blob);
    img.onload = () => { img.classList.add("loaded"); ph.style.display = "none"; };
    img.src = u;
  }

  if ("serviceWorker" in navigator && /^https?:/.test(location.protocol)) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }

  /* ---------------- Search ---------------- */
  const search = document.getElementById("search");
  search.addEventListener("input", () => {
    const q = norm(search.value.trim());
    const nodes = document.querySelectorAll(".node");
    if (!q) { nodes.forEach((n) => n.classList.remove("dim", "hit")); return; }
    let first = null;
    nodes.forEach((n) => {
      const t = topicsById[n.dataset.topic];
      const hay = norm([t.title, t.en, t.summary, t._cluster.name].join(" "));
      const hit = hay.includes(q);
      n.classList.toggle("dim", !hit); n.classList.toggle("hit", hit);
      if (hit && !first) first = n;
    });
    if (first) first.scrollIntoView({ block: "center", behavior: "smooth" });
  });
  function norm(s) { return (s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }

  /* ---------------- Export / import / reset ---------------- */
  document.getElementById("btn-export").addEventListener("click", () => {
    const blob = new Blob([JSON.stringify(progress, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `english-roadmap-progreso-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    toast("Progreso exportado");
  });
  document.getElementById("file-import").addEventListener("change", async (e) => {
    const f = e.target.files[0]; if (!f) return;
    try {
      const p = JSON.parse(await f.text());
      progress.done = p.done || {}; progress.topicDone = p.topicDone || {};
      saveProgress(); refreshStatus(); toast("Progreso importado");
    } catch (err) { toast("Archivo inválido"); }
    e.target.value = "";
  });
  document.getElementById("btn-reset").addEventListener("click", () => {
    if (!confirm("¿Borrar todo el progreso guardado en este navegador?")) return;
    progress.done = {}; progress.topicDone = {};
    saveProgress(); refreshStatus(); toast("Progreso reiniciado");
  });

  let toastT;
  function toast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastT); toastT = setTimeout(() => (t.hidden = true), 2200);
  }

  /* ---------------- Utils ---------------- */
  function el(tag, attrs) {
    const e = document.createElement(tag);
    Object.entries(attrs || {}).forEach(([k, v]) => e.setAttribute(k, v));
    return e;
  }
  function esc(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function hostOf(url) {
    try { return new URL(url).hostname.replace(/^www\./, ""); } catch (e) { return url; }
  }

  /* ---------------- Init ---------------- */
  renderRoadmap();
  window.addEventListener("load", () => setTimeout(drawConnectors, 100));
  if (location.hash && topicsById[location.hash.slice(1)]) openTopic(location.hash.slice(1));
})();
