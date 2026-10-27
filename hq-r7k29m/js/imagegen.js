/* N29 HQ — image generation from the Apex prompts (OpenAI, Google, or any OpenAI-compatible endpoint).
   API keys live in the device-local encrypted slot (store.local()): they are never synced and never leave this device except in the request to the provider you pick.
   Generated images are kept in this browser's IndexedDB (not in the synced vault, which would grow too large). */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const G = (HQ.imagegen = {});

  G.PROVIDERS = {
    openai: { label: "OpenAI", models: ["gpt-image-1", "dall-e-3"], base: "https://api.openai.com/v1", keyHelp: "platform.openai.com ▸ API keys. Les images sont facturées par OpenAI ; gpt-image-1 peut demander une vérification d'organisation." },
    google: { label: "Google (Gemini / Imagen)", models: ["gemini-2.5-flash-image", "imagen-4.0-generate-001"], base: "https://generativelanguage.googleapis.com/v1beta", keyHelp: "aistudio.google.com ▸ Get API key. Les modèles « imagen-… » utilisent l'API Imagen, les autres l'API Gemini." },
    custom: { label: "Autre (compatible OpenAI)", models: [], base: "", keyHelp: "Tout service qui expose POST /images/generations (OpenRouter, Together, un serveur local…). Il doit autoriser les requêtes depuis un navigateur (CORS)." },
  };
  G.FORMATS = [["square", "Carré"], ["landscape", "Paysage 16:9"], ["portrait", "Portrait 9:16"]];
  G.QUALITIES = [["auto", "Auto"], ["low", "Basse (rapide)"], ["medium", "Moyenne"], ["high", "Haute"]];

  // ---------- Settings (device-local, encrypted) ----------
  G.cfg = () => { const l = HQ.store.local(); const c = l.imagegen || (l.imagegen = {}); c.keys = c.keys || {}; c.models = c.models || {}; return c; };
  G.save = () => HQ.store.saveLocal();
  G.hasKey = (p) => p === "custom" ? !!G.cfg().customBase : !!G.cfg().keys[p];
  G.model = (p) => G.cfg().models[p] || G.PROVIDERS[p].models[0] || "";

  const SIZES = { openai: { square: "1024x1024", landscape: "1536x1024", portrait: "1024x1536" }, dalle3: { square: "1024x1024", landscape: "1792x1024", portrait: "1024x1792" } };
  const RATIO = { square: "1:1", landscape: "16:9", portrait: "9:16" };

  function fail(res, body) {
    let msg = body && body.error && (body.error.message || body.error) || "";
    if (typeof msg !== "string") msg = JSON.stringify(msg);
    const e = new Error(res.status === 401 || res.status === 403 ? "Clé API refusée par le fournisseur (" + res.status + "). " + msg : res.status === 429 ? "Trop de requêtes ou quota épuisé (429). " + msg : msg || "Erreur " + res.status);
    e.status = res.status; return e;
  }
  const b64Blob = (b64, mime) => { const bin = atob(b64), a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i); return new Blob([a], { type: mime || "image/png" }); };
  async function post(url, headers, body, signal) {
    let res;
    try { res = await fetch(url, { method: "POST", headers: Object.assign({ "Content-Type": "application/json" }, headers), body: JSON.stringify(body), signal }); }
    catch (e) { if (e.name === "AbortError") throw e; throw new Error("Connexion impossible : réseau coupé, ou le service refuse les requêtes depuis un navigateur (CORS)."); }
    let json = null; try { json = await res.json(); } catch (e) { /* not JSON */ }
    if (!res.ok) throw fail(res, json);
    return json;
  }
  const fullPrompt = (prompt, negative) => (negative && negative.trim() ? `${prompt}\n\nAvoid: ${negative.trim()}` : prompt);

  async function openaiLike(p, o) {
    const cfg = G.cfg(), base = (p === "custom" ? cfg.customBase : G.PROVIDERS.openai.base).replace(/\/+$/, "");
    const dalle = /^dall-e/.test(o.model);
    const body = { model: o.model, prompt: fullPrompt(o.prompt, o.negative), n: dalle ? 1 : o.n, size: (dalle ? SIZES.dalle3 : SIZES.openai)[o.format] };
    if (dalle) { body.response_format = "b64_json"; if (o.quality === "high") body.quality = "hd"; }
    else if (o.quality && o.quality !== "auto") body.quality = o.quality;
    const key = cfg.keys[p];
    const calls = dalle ? Array.from({ length: o.n }, () => post(base + "/images/generations", key ? { Authorization: "Bearer " + key } : {}, body, o.signal)) : [post(base + "/images/generations", key ? { Authorization: "Bearer " + key } : {}, body, o.signal)];
    const out = [];
    for (const j of await Promise.all(calls)) for (const d of j.data || []) {
      if (d.b64_json) out.push(b64Blob(d.b64_json, "image/png"));
      else if (d.url) { try { out.push(await (await fetch(d.url, { signal: o.signal })).blob()); } catch (e) { throw new Error("Image générée mais non téléchargeable depuis le navigateur (CORS) : " + d.url); } }
    }
    return out;
  }
  async function google(o) {
    const base = G.PROVIDERS.google.base, headers = { "x-goog-api-key": G.cfg().keys.google };
    if (/^imagen/.test(o.model)) {
      const j = await post(`${base}/models/${encodeURIComponent(o.model)}:predict`, headers, { instances: [{ prompt: fullPrompt(o.prompt, o.negative) }], parameters: { sampleCount: o.n, aspectRatio: RATIO[o.format] } }, o.signal);
      return (j.predictions || []).filter((x) => x.bytesBase64Encoded).map((x) => b64Blob(x.bytesBase64Encoded, x.mimeType));
    }
    const one = async () => {
      const j = await post(`${base}/models/${encodeURIComponent(o.model)}:generateContent`, headers, { contents: [{ parts: [{ text: fullPrompt(o.prompt, o.negative) }] }], generationConfig: { responseModalities: ["TEXT", "IMAGE"], imageConfig: { aspectRatio: RATIO[o.format] } } }, o.signal);
      const parts = ((j.candidates || [])[0] || {}).content ? j.candidates[0].content.parts || [] : [];
      const img = parts.find((x) => x.inlineData || x.inline_data);
      if (!img) { const why = (j.promptFeedback && j.promptFeedback.blockReason) || (j.candidates && j.candidates[0] && j.candidates[0].finishReason) || "aucune image renvoyée"; throw new Error("Pas d'image reçue (" + why + "). Reformulez le prompt."); }
      const d = img.inlineData || img.inline_data; return b64Blob(d.data, d.mimeType || d.mime_type);
    };
    return Promise.all(Array.from({ length: o.n }, one));
  }

  // o: { provider, model, prompt, negative, format, quality, n, signal } -> Blob[]
  G.generate = async (o) => {
    if (!G.hasKey(o.provider)) throw new Error(o.provider === "custom" ? "Renseignez l'adresse du service dans les réglages API." : "Ajoutez votre clé API dans les réglages API.");
    if (!o.prompt || !o.prompt.trim()) throw new Error("Le prompt est vide.");
    if (!o.model) throw new Error("Choisissez un modèle.");
    const blobs = o.provider === "google" ? await google(o) : await openaiLike(o.provider, o);
    if (!blobs.length) throw new Error("Le service n'a renvoyé aucune image.");
    return blobs;
  };

  // ---------- Local gallery (IndexedDB) ----------
  const open = () => new Promise((res, rej) => { const r = indexedDB.open("n29hq-images", 1); r.onupgradeneeded = () => r.result.createObjectStore("images", { keyPath: "id" }); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("images", mode), s = t.objectStore("images"), r = fn(s); t.oncomplete = () => { db.close(); res(r && r.result); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  G.add = (rec) => tx("readwrite", (s) => s.put(Object.assign({ id: HQ.util.uid(), createdAt: Date.now() }, rec)));
  G.list = async () => ((await tx("readonly", (s) => s.getAll())) || []).sort((a, b) => b.createdAt - a.createdAt);
  G.remove = (id) => tx("readwrite", (s) => s.delete(id));
  G.available = () => "indexedDB" in window;
})();
