/* Apex Prompt Studio — prompt generator for the Apex Universe / Heroes Dawn art pipeline.
   Same generation logic and data as the original standalone tool; new UI, shared style, prompt library. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const { h, icon, field, btn, toast, copy } = HQ.util;
  const AD = HQ.apexData;
  const { DATA, CITIES, TEXT_POOLS, STYLE_FACTORY, STYLE_OPTIONS, CUSTOM } = AD;
  const store = HQ.store;

  // ---------- Form schemas ----------
  const sel = (k, l, list, extra = {}) => Object.assign({ k, t: "select", l, list }, extra);
  const area = (k, l) => ({ k, t: "area", l });
  const geo = { k: "geo", t: "geo", l: "Pays et ville", show: (v) => v.lieu === "city" };
  const palette = { k: "palette", t: "multi", l: "Palette de couleurs", list: () => DATA.palette };
  const atmo = sel("atmosphere", "Atmosphère", () => DATA.atmosphere, { custom: true });
  const lieu = sel("lieu", "Type d'emplacement", () => DATA.lieu);

  const SCHEMAS = {
    perso: [
      { g: "Identité", f: [
        sel("role", "Type / rôle", () => DATA.role, { custom: true }), sel("sexe", "Sexe", () => DATA.sexe),
        sel("age", "Tranche d'âge", () => DATA.age, { custom: true }), sel("peau", "Couleur de peau", () => DATA.peau, { custom: true }),
        sel("ethnie", "Ethnie", () => DATA.ethnie, { custom: true }), sel("cheveux", "Cheveux", () => DATA.cheveux, { custom: true }),
        sel("couleur", "Couleur des cheveux", () => DATA.couleur, { custom: true }), sel("yeux", "Yeux", () => DATA.yeux, { custom: true }),
        sel("visage", "Forme du visage", () => DATA.visage, { custom: true }), sel("corpulence", "Corpulence", () => DATA.corpulence, { custom: true }),
      ] },
      { g: "Détails", f: [area("tenue", "Tenue"), area("detail", "Détail physique"), area("pouvoir", "Pouvoir (visuel)"), area("posture", "Posture")] },
      { g: "Environnement", f: [lieu, geo, area("env", "Détails de l'environnement"), palette, atmo] },
    ],
    creat: [
      { g: "Type", f: [
        sel("ctype", "Type de créature", () => DATA.creatTypes),
        sel("cat", "Catégorie", (v) => DATA.cats[v.ctype] || [], { custom: true, show: (v) => v.ctype === "animal" || v.ctype === "insect" }),
        sel("espece", "Espèce (optionnel)", (v) => DATA.especes[v.cat] || [], { custom: true, show: (v) => v.ctype === "animal" || v.ctype === "insect" }),
        sel("race", "Race (optionnel)", (v) => DATA.races[v.espece] || [], { custom: true, show: (v) => v.ctype === "animal" || v.ctype === "insect" }),
        sel("creature", "Créature", () => DATA.cryptids, { custom: true, show: (v) => v.ctype === "cryptid" }),
        Object.assign(area("libre", "Description personnalisée (prompt du sujet)"), { show: (v) => v.ctype === "custom" }),
      ] },
      { g: "Détails", f: [area("tenue", "Équipement / marques"), area("detail", "Détail physique"), area("pouvoir", "Pouvoir (visuel)"), area("posture", "Posture")] },
      { g: "Environnement", f: [lieu, geo, area("env", "Détails de l'environnement"), palette, atmo] },
    ],
    paysage: [
      { g: "Lieu", f: [lieu, geo, area("env", "Éléments du décor"), area("premier", "Premier plan")] },
      { g: "Ambiance", f: [
        sel("moment", "Moment de la journée", () => DATA.moments), sel("meteo", "Météo", () => DATA.meteos, { custom: true }),
        sel("presence", "Présence humaine", () => DATA.presences), sel("point", "Point de vue", () => DATA.points), palette, atmo,
      ] },
    ],
    carte: [
      { g: "Carte", f: [sel("ctype", "Type de carte", () => DATA.cardTypes, { custom: true }), sel("affin", "Affinité / élément", () => DATA.affinities, { custom: true }), sel("format", "Format de la carte", () => DATA.cardFormats)] },
      { g: "Illustration", f: [area("sujet", "Sujet principal"), sel("composition", "Composition", () => DATA.compositions, { custom: true }), area("arriere", "Arrière-plan"), area("effets", "Effets visuels")] },
      { g: "Ambiance", f: [palette, atmo] },
    ],
  };
  const TABS = [["perso", "Personnage"], ["creat", "Créatures"], ["paysage", "Paysage"], ["carte", "Carte"], ["style", "Style commun"], ["img", "Images"], ["lib", "Bibliothèque"]];
  const TITLE = { perso: "Personnage", creat: "Créature", paysage: "Paysage", carte: "Carte" };

  // ---------- Prompt builders (unchanged logic) ----------
  const D = {
    perso(v) {
      const hair = v.cheveux && v.couleur ? `${v.cheveux} in ${v.couleur}` : (v.cheveux || (v.couleur ? `${v.couleur} hair` : ""));
      const eyes = v.yeux ? (v.yeux.includes("eyes") ? v.yeux : `${v.yeux} eyes`) : "";
      const face = v.visage ? (v.visage.includes("face") ? v.visage : `${v.visage} face`) : "";
      const build = v.corpulence ? (/build|physique/.test(v.corpulence) ? v.corpulence : `${v.corpulence} build`) : "";
      return [v.role, v.sexe, v.age, v.peau, v.ethnie, hair, eyes, face, build, v.tenue, v.detail, v.pouvoir, v.posture].filter(Boolean).join(", ");
    },
    creat(v) {
      if (v.ctype === "custom") return v.libre || "";
      const parts = [];
      if (v.ctype === "cryptid") { if (v.creature) parts.push(`${v.creature}, cryptid creature`); }
      else { const name = v.race && v.espece ? `${v.race} ${v.espece}` : (v.espece || (v.cat ? `${v.cat} animal` : "")); if (name) parts.push(name); }
      return parts.concat([v.tenue, v.detail, v.pouvoir, v.posture]).filter(Boolean).join(", ");
    },
    paysage: (v) => [v.moment, v.meteo, v.premier, v.presence, v.point].filter(Boolean).join(", "),
    carte: (v) => ["trading card game illustration", v.ctype && `${v.ctype} card`, v.affin && `${v.affin} element`, v.sujet, v.composition, v.arriere && `background: ${v.arriere}`, v.effets, "no text, no border, no frame"].filter(Boolean).join(", "),
  };
  function locationPhrase(v) {
    if (!v.lieu) return "";
    if (v.lieu !== "city") return v.lieu;
    const g = v.geo || {}, place = [g.ville, g.pays].filter(Boolean).join(", ");
    return place ? `city street in ${place}` : "city street";
  }
  function envLine(v) {
    const pal = (v.palette || []).length ? `${v.palette.join(", ")} color palette` : "", atm = v.atmosphere ? `${v.atmosphere} atmosphere` : "";
    return [locationPhrase(v), v.env, pal, atm].filter(Boolean).join(", ");
  }
  const styleLine = (st, env) => [st.base, env, st.ombres, st.eclairage, st.cadrage, st.profondeur, st.cadre, st.finition].filter(Boolean).join(", ");
  function buildPrompt(tab, v, st) {
    const desc = D[tab](v);
    const style = tab === "carte" && v.format ? Object.assign({}, st, { cadre: v.format }) : st;
    return (desc ? `[${desc}]\n\n` : "") + styleLine(style, envLine(v));
  }

  // ---------- Helpers ----------
  const toPairs = (list) => list.map((x) => (Array.isArray(x) ? x : [x, x]));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const flat = (tab) => SCHEMAS[tab].flatMap((g) => g.f);
  const norm = HQ.util.norm;
  const opt = (s, value, text) => s.appendChild(h("option", { value }, text));

  function loadStyle() {
    const saved = store.db().apex.style;
    return Object.assign({}, STYLE_FACTORY, saved || {});
  }

  // ---------- View ----------
  HQ.views = HQ.views || {};
  HQ.views.apex = function render(root, ctx) {
    const state = { tab: ctx.params.tab || localStorage.getItem("n29hq.apextab") || "perso" };
    if (!TABS.some((t) => t[0] === state.tab)) state.tab = "perso";
    const refs = {};
    const styleRefs = {};
    let saveTimer;
    const panes = {};

    const page = h("div.fade-in");
    root.appendChild(page);
    const headRow = h("div.page-head", h("div", h("a.back", { href: "#/tools" }, icon("chevL"), "Outils"), h("div.eyebrow", "Apex Universe"), h("h1", "Apex Prompt Studio")), h("div.head-actions"));
    const tabs = h("div.tabs-inline", { role: "tablist" });
    const body = h("div");
    const fab = h("button.btn.btn--accent.fab", { type: "button", onclick: () => { const o = panes[state.tab] && panes[state.tab]._out; if (o) copy(`${o.out.textContent}

negative prompt : ${o.neg.textContent}`, "Prompt et négatif copiés"); } }, icon("copy"), "Copier le prompt");
    page.append(headRow, tabs, body, fab);

    TABS.forEach(([id, label]) => tabs.appendChild(h("button", { role: "tab", dataset: { tab: id }, onclick: () => show(id) }, label)));

    function show(id) {
      state.tab = id;
      try { localStorage.setItem("n29hq.apextab", id); } catch (e) { /* ignore */ }
      tabs.querySelectorAll("button").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.tab === id)));
      Object.entries(panes).forEach(([k, el]) => { el.hidden = k !== id; });
      fab.hidden = !SCHEMAS[id];
      if (id === "lib") renderLibrary();
      if (id === "img") renderGallery();
      if (SCHEMAS[id]) refresh(id, false);
      headRow.querySelector(".head-actions").replaceChildren(...(SCHEMAS[id] ? [btn("Au hasard", { icon: "dice", kind: "accent", onClick: () => randomize(id) }), btn("Effacer", { icon: "trash", onClick: () => clearTab(id) })] : []));
    }

    // ----- raw <-> effective -----
    function readRaw(tab) {
      const raw = {};
      flat(tab).forEach((f) => {
        const r = refs[tab][f.k];
        if (f.t === "select") raw[f.k] = { v: r.sel.value, c: r.custom ? r.custom.value : "" };
        else if (f.t === "area") raw[f.k] = r.el.value;
        else if (f.t === "multi") raw[f.k] = [...r.box.querySelectorAll("input:checked")].map((i) => i.value);
        else if (f.t === "geo") raw[f.k] = { pays: r.pays.value, ville: r.ville.value, villeCustom: r.villeCustom.value };
      });
      return raw;
    }
    function effective(tab, raw) {
      const v = {};
      flat(tab).forEach((f) => {
        const r = raw[f.k];
        if (f.t === "select") { const s = r || {}; v[f.k] = s.v === CUSTOM ? String(s.c || "").trim() : (s.v || ""); }
        else if (f.t === "geo") { const g = r || {}; v.geo = { pays: g.pays || "", ville: g.ville === CUSTOM ? String(g.villeCustom || "").trim() : (g.ville || "") }; }
        else if (f.t === "multi") v[f.k] = Array.isArray(r) ? r : [];
        else v[f.k] = String(r || "").trim();
      });
      return v;
    }
    const vals = (tab) => effective(tab, readRaw(tab));

    // ----- fields -----
    function buildField(tab, f) {
      const r = (refs[tab][f.k] = {});
      const wrap = h("div" + (f.t === "area" || f.t === "multi" || f.t === "geo" ? ".full" : ""), { style: f.t === "area" || f.t === "multi" || f.t === "geo" ? "grid-column:1/-1" : "" });
      r.wrap = wrap;
      if (f.t === "select") {
        r.sel = h("select"); r.custom = f.custom ? h("input", { placeholder: "Saisir en anglais", hidden: true, style: "margin-top:8px" }) : null;
        wrap.append(...[field(f.l, r.sel), r.custom].filter(Boolean));
      } else if (f.t === "area") {
        r.el = h("textarea", { rows: 2 }); wrap.append(field(f.l, r.el));
      } else if (f.t === "multi") {
        r.summary = h("summary", "Aucune couleur choisie");
        r.box = h("div.mcheck");
        toPairs(f.list({})).forEach(([l, val]) => r.box.appendChild(h("label.check", h("input", { type: "checkbox", value: val }), l)));
        wrap.append(h("div.field", h("span.lbl", f.l), h("details.dd", r.summary, r.box)));
      } else if (f.t === "geo") {
        r.paysSearch = h("input", { placeholder: "Filtrer les pays, ex. japon" }); r.pays = h("select");
        r.villeSearch = h("input", { placeholder: "Filtrer les villes, ex. lyon" }); r.ville = h("select");
        r.villeCustom = h("input", { placeholder: "Saisir la ville en anglais", hidden: true, style: "margin-top:8px" });
        wrap.append(h("div.form.r2", { style: "display:grid;gap:14px" }, h("div.stack", { style: "gap:8px" }, field("Filtrer les pays", r.paysSearch), field("Pays", r.pays)), h("div.stack", { style: "gap:8px" }, field("Filtrer les villes", r.villeSearch), field("Ville", r.ville), r.villeCustom)));
      }
      return wrap;
    }
    function fillSelect(tab, f, v) {
      const r = refs[tab][f.k], s = r.sel, cur = s.value;
      s.replaceChildren(); opt(s, "", "— choisir —");
      toPairs(f.list(v)).forEach(([l, val]) => opt(s, val, l));
      if (f.custom) opt(s, CUSTOM, "✎ Autre (saisir)");
      if (cur && [...s.options].some((o) => o.value === cur)) s.value = cur;
    }
    function refillCountries(tab) {
      const r = refs[tab].geo, cur = r.pays.value, q = norm(r.paysSearch.value);
      r.pays.replaceChildren(); opt(r.pays, "", "— choisir —");
      Object.keys(CITIES).filter((c) => norm(c).includes(q)).forEach((c) => opt(r.pays, c, c));
      if (cur && [...r.pays.options].some((o) => o.value === cur)) r.pays.value = cur;
    }
    function refillCities(tab) {
      const r = refs[tab].geo, cur = r.ville.value, q = norm(r.villeSearch.value), list = CITIES[r.pays.value] || [];
      r.ville.replaceChildren(); opt(r.ville, "", "— choisir —");
      list.filter((c) => norm(c).includes(q)).forEach((c) => opt(r.ville, c, c));
      opt(r.ville, CUSTOM, "✎ Autre (saisir)");
      if (cur && [...r.ville.options].some((o) => o.value === cur)) r.ville.value = cur;
    }

    function refresh(tab, save = true) {
      const fields = flat(tab);
      fields.forEach((f) => { if (f.t === "select") fillSelect(tab, f, vals(tab)); if (f.t === "geo") { refillCountries(tab); refillCities(tab); } });
      const v = vals(tab);
      fields.forEach((f) => {
        const r = refs[tab][f.k];
        if (f.t === "select" && f.custom) r.custom.hidden = r.sel.value !== CUSTOM;
        if (f.t === "multi") { const n = r.box.querySelectorAll("input:checked").length; r.summary.textContent = n ? `${n} couleur(s) choisie(s)` : "Aucune couleur choisie"; }
        if (f.t === "geo") r.villeCustom.hidden = r.ville.value !== CUSTOM;
        if (f.show) r.wrap.hidden = !f.show(v);
      });
      const o = panes[tab]._out, st = readStyle();
      const prompt = buildPrompt(tab, v, st);
      o.out.textContent = prompt; o.neg.textContent = st.negative; o.count.textContent = prompt.length + " caractères";
      if (save) persistState();
    }
    function writeRaw(tab, raw) {
      flat(tab).forEach((f) => {
        const r = refs[tab][f.k], x = raw[f.k];
        if (f.t === "select") { fillSelect(tab, f, vals(tab)); if (r.custom) r.custom.value = (x && x.c) || ""; r.sel.value = (x && x.v) || ""; }
        else if (f.t === "area") r.el.value = x || "";
        else if (f.t === "multi") { const a = Array.isArray(x) ? x : []; r.box.querySelectorAll("input").forEach((cb) => { cb.checked = a.includes(cb.value); }); }
        else if (f.t === "geo") { const g = x || {}; refillCountries(tab); r.pays.value = g.pays || ""; refillCities(tab); r.ville.value = g.ville || ""; r.villeCustom.value = g.villeCustom || ""; }
      });
      refresh(tab, false);
    }
    function persistState() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => store.mutate((d) => { d.apex.state = Object.fromEntries(Object.keys(SCHEMAS).map((t) => [t, readRaw(t)])); }), 500);
    }
    function randomize(tab) {
      flat(tab).forEach((f) => {
        const r = refs[tab][f.k];
        if (f.t === "select") { fillSelect(tab, f, vals(tab)); const o = toPairs(f.list(vals(tab))); if (o.length) r.sel.value = pick(o)[1]; if (r.custom) r.custom.value = ""; }
        else if (f.t === "multi") { const chosen = toPairs(f.list({})).slice().sort(() => Math.random() - 0.5).slice(0, 3).map((p) => p[1]); r.box.querySelectorAll("input").forEach((cb) => { cb.checked = chosen.includes(cb.value); }); }
        else if (f.t === "area") { if (TEXT_POOLS[f.k]) r.el.value = pick(TEXT_POOLS[f.k]); }
        else if (f.t === "geo") { r.paysSearch.value = ""; r.villeSearch.value = ""; refillCountries(tab); r.pays.value = pick(Object.keys(CITIES)); refillCities(tab); r.ville.value = pick(CITIES[r.pays.value]); r.villeCustom.value = ""; }
      });
      refresh(tab); toast("Valeurs tirées au hasard");
    }
    function clearTab(tab) {
      const g = refs[tab].geo; if (g) { g.paysSearch.value = ""; g.villeSearch.value = ""; }
      writeRaw(tab, {}); persistState(); toast("Champs effacés");
    }

    // ----- style -----
    function readStyle() {
      if (!styleRefs.base) return loadStyle();
      const st = { base: styleRefs.base.value.trim(), negative: styleRefs.negative.value.trim() };
      Object.keys(STYLE_OPTIONS).forEach((k) => { st[k] = styleRefs[k].value; });
      return st;
    }
    function applyStyle(s) {
      styleRefs.base.value = s.base; styleRefs.negative.value = s.negative;
      Object.keys(STYLE_OPTIONS).forEach((k) => { const el = styleRefs[k]; if (![...el.options].some((o) => o.value === s[k])) opt(el, s[k], s[k]); el.value = s[k]; });
    }
    const refreshAll = () => Object.keys(SCHEMAS).forEach((t) => refs[t] && panes[t] && panes[t]._out && refresh(t, false));
    function buildStylePane() {
      const p = h("div.stack");
      const swatches = [["#03060D", "Nuit"], ["#0A1A3F", "Bleu nuit"], ["#5CC8FF", "Cyan"], ["#DCE5F2", "Argent"], ["#FF6A2B", "Aube"], ["#E8283C", "Rouge"]];
      p.appendChild(h("div.card", h("h2", "Direction artistique", h("small", "Heroes Dawn / Apex")), h("p.muted", { style: "font-size:.9rem;margin-bottom:14px" }, "Semi-3D cinématique, low-poly. Nuit bleu-noir, lumière cyan, argent poli, aube orange. Les personnages gardent un contraste fort et une silhouette lisible."), h("div", { style: "display:grid;grid-template-columns:repeat(auto-fit,minmax(110px,1fr));gap:8px" }, swatches.map(([c, n]) => h("div", { style: "display:grid;gap:6px;font-size:.76rem;color:var(--muted)" }, h("i", { style: `display:block;height:40px;background:${c};border:1px solid var(--line)` }), `${n} · ${c}`)))));
      const grid = h("div.form");
      styleRefs.base = h("textarea", { rows: 3 }); grid.appendChild(field("Style de base", styleRefs.base));
      const row = h("div.form.r2", { style: "display:grid;gap:14px" });
      const labels = { eclairage: "Éclairage", ombres: "Ombres", cadrage: "Cadrage / angle", profondeur: "Profondeur de champ", cadre: "Format", finition: "Finition" };
      Object.keys(STYLE_OPTIONS).forEach((k) => { styleRefs[k] = h("select"); STYLE_OPTIONS[k].forEach((v) => opt(styleRefs[k], v, v)); row.appendChild(field(labels[k], styleRefs[k])); });
      grid.appendChild(row);
      styleRefs.negative = h("textarea", { rows: 3 }); grid.appendChild(field("Prompt négatif", styleRefs.negative));
      grid.appendChild(h("div.form-actions", btn("Réglages d'origine", { onClick: () => { store.mutate((d) => { d.apex.style = null; }); applyStyle(Object.assign({}, STYLE_FACTORY)); refreshAll(); toast("Réglages d'origine rétablis"); } }), btn("Revenir à l'enregistré", { onClick: () => { applyStyle(loadStyle()); refreshAll(); toast("Réglages enregistrés rétablis"); } }), btn("Enregistrer par défaut", { kind: "accent", icon: "check", onClick: () => { store.mutate((d) => { d.apex.style = readStyle(); }); toast("Style enregistré par défaut", "ok"); } })));
      p.appendChild(h("div.card", h("h2", "Style de base commun"), grid, h("p.hint", { style: "margin-top:12px" }, "Ce style s'applique à tous les onglets. « Enregistrer par défaut » le garde pour les prochaines ouvertures (chiffré avec le reste des données).")));
      p.addEventListener("input", refreshAll); p.addEventListener("change", refreshAll);
      return p;
    }

    // ----- generator panes -----
    function buildGenPane(tab) {
      refs[tab] = {};
      const p = h("div.gen");
      const form = h("div.stack");
      SCHEMAS[tab].forEach((g) => { const grid = h("div.form.r2", { style: "display:grid;gap:14px" }); g.f.forEach((f) => grid.appendChild(buildField(tab, f))); form.appendChild(h("div.card", h("h2", g.g), grid)); });
      const o = { out: h("div.out"), neg: h("div.out.neg"), count: h("span.hint") };
      const outCard = h("div.card.cut.gen-out", h("h2", "Prompt généré", o.count),
        o.out,
        h("div.form-actions", { style: "justify-content:stretch;margin-top:14px" },
          btn("Copier le prompt", { kind: "accent", icon: "copy", onClick: () => copy(`${o.out.textContent}\n\nnegative prompt : ${o.neg.textContent}`, "Prompt et négatif copiés") }),
          btn("Négatif", { icon: "copy", onClick: () => copy(o.neg.textContent, "Négatif copié") }),
          btn("Sauvegarder", { icon: "star", onClick: () => savePromptSheet(tab, o) })),
        h("div.lbl", { style: "margin:16px 0 8px" }, "Prompt négatif"), o.neg, genBlock(tab, o));
      p._out = o;
      p.append(form, outCard);
      p.addEventListener("input", () => refresh(tab)); p.addEventListener("change", () => refresh(tab));
      return p;
    }

    // ----- image generation -----
    const IG = HQ.imagegen, urls = [];
    const thumb = (blob) => { const u = URL.createObjectURL(blob); urls.push(u); return u; };
    function apiSheet(done) {
      const cfg = IG.cfg(), f = {};
      const prov = (id) => {
        const P = IG.PROVIDERS[id];
        f[id] = { key: HQ.util.input({ type: "password", value: cfg.keys[id] || "", placeholder: id === "custom" ? "Clé (optionnelle)" : "Collez votre clé API", autocomplete: "off", "aria-label": "Clé API " + P.label }), model: HQ.util.input({ value: cfg.models[id] || "", placeholder: P.models[0] || "nom du modèle", list: "ig-models-" + id }) };
        if (id === "custom") f[id].base = HQ.util.input({ type: "url", value: cfg.customBase || "", placeholder: "https://exemple.com/v1" });
        return h("div.card", { style: "padding:14px" }, h("h3", { style: "margin-bottom:6px" }, P.label), h("p.hint", { style: "margin-bottom:10px" }, P.keyHelp),
          h("div.form", id === "custom" ? field("Adresse de l'API", f[id].base) : null, field("Clé API", f[id].key), field("Modèle", f[id].model), h("datalist", { id: "ig-models-" + id }, P.models.map((m) => h("option", { value: m })))));
      };
      const s = HQ.util.sheet({ title: "Génération d'images — réglages API", wide: true, body: h("form.form", { onsubmit: (e) => {
        e.preventDefault();
        Object.keys(IG.PROVIDERS).forEach((id) => { cfg.keys[id] = f[id].key.value.trim(); if (!cfg.keys[id]) delete cfg.keys[id]; cfg.models[id] = f[id].model.value.trim(); if (!cfg.models[id]) delete cfg.models[id]; });
        cfg.customBase = f.custom.base.value.trim().replace(/\/+$/, "");
        if (cfg.customBase && !/^https:\/\//i.test(cfg.customBase) && !/^http:\/\/(localhost|127\.0\.0\.1)/i.test(cfg.customBase)) { toast("L'adresse doit commencer par https://", "bad"); return; }
        IG.save(); s.close(true); toast("Réglages enregistrés", "ok"); done && done();
      } },
        h("div.notice", "Vos clés restent sur cet appareil : chiffrées avec votre phrase secrète, jamais envoyées à Supabase ni synchronisées. Elles ne partent que vers le fournisseur choisi, à chaque génération. Sur un autre appareil, il faudra les saisir à nouveau."),
        ...Object.keys(IG.PROVIDERS).map(prov),
        h("p.hint", "Chaque image est facturée par le fournisseur selon son tarif. Utilisez de préférence une clé avec une limite de dépense."),
        h("div.form-actions", HQ.util.btn("Annuler", { onClick: () => s.close() }), HQ.util.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
    }
    function viewImage(rec, after) {
      const url = thumb(rec.blob), ext = (rec.blob.type.split("/")[1] || "png").replace("jpeg", "jpg");
      const s = HQ.util.sheet({ title: "Image générée", wide: true, body: h("div.stack",
        h("img", { src: url, alt: rec.prompt.slice(0, 120), style: "width:100%;max-height:70vh;object-fit:contain;background:var(--bg)" }),
        h("p.row-s", `${(IG.PROVIDERS[rec.provider] || {}).label || rec.provider} · ${rec.model} · ${HQ.util.fmtDate(HQ.util.isoDate(new Date(rec.createdAt)))}`),
        h("div.out", { style: "max-height:140px;overflow:auto;font-size:.82rem;min-height:0" }, rec.prompt),
        h("div.form-actions", { style: "justify-content:flex-start" },
          btn("Télécharger", { icon: "download", kind: "accent", onClick: () => { const a = h("a", { href: url, download: `apex-${rec.id}.${ext}` }); document.body.appendChild(a); a.click(); a.remove(); } }),
          btn("Copier le prompt", { icon: "copy", onClick: () => copy(rec.prompt, "Prompt copié") }),
          btn("Supprimer", { icon: "trash", kind: "danger", onClick: async () => { if (await HQ.util.confirm({ title: "Supprimer cette image ?", text: "Elle sera effacée de cet appareil.", ok: "Supprimer", danger: true })) { await IG.remove(rec.id); s.close(true); after && after(); } } }))) });
    }
    function genBlock(tab, o) {
      const cfg = IG.cfg(), box = h("div", { style: "margin-top:20px;padding-top:16px;border-top:1px solid var(--line)" });
      if (!IG.available()) { box.appendChild(h("p.hint", "La génération d'images nécessite un navigateur avec IndexedDB.")); return box; }
      const provSel = HQ.util.select(Object.entries(IG.PROVIDERS).map(([k, v]) => [k, v.label + (IG.hasKey(k) ? "" : " — non configuré")]), cfg.provider && IG.PROVIDERS[cfg.provider] ? cfg.provider : "openai");
      const model = HQ.util.input({ placeholder: "modèle", list: "ig-m-" + tab, "aria-label": "Modèle" }), dl = h("datalist", { id: "ig-m-" + tab });
      const fmt = HQ.util.select(IG.FORMATS, cfg.format || "landscape"), qual = HQ.util.select(IG.QUALITIES, cfg.quality || "auto"), count = HQ.util.select([["1", "1 image"], ["2", "2 images"], ["4", "4 images"]], String(cfg.count || 1));
      const status = h("p.hint", { role: "status", "aria-live": "polite", style: "min-height:1.4em;margin-top:10px" }), results = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:10px" });
      const syncModel = () => { const P = IG.PROVIDERS[provSel.value]; model.value = IG.model(provSel.value); dl.replaceChildren(...P.models.map((m) => h("option", { value: m }))); };
      syncModel();
      const goBtn = btn("Générer l'image", { kind: "accent", icon: "spark", onClick: run });
      let ctl = null;
      provSel.addEventListener("change", () => { syncModel(); cfg.provider = provSel.value; IG.save(); });
      [fmt, qual, count].forEach((el) => el.addEventListener("change", () => { cfg.format = fmt.value; cfg.quality = qual.value; cfg.count = Number(count.value); IG.save(); }));
      async function run() {
        const prov = provSel.value;
        if (!IG.hasKey(prov)) { apiSheet(() => { [...provSel.options].forEach((op) => { op.textContent = IG.PROVIDERS[op.value].label + (IG.hasKey(op.value) ? "" : " — non configuré"); }); }); return; }
        if (ctl) { ctl.abort(); return; }
        const m = model.value.trim(); if (m !== IG.model(prov)) { cfg.models[prov] = m; IG.save(); }
        ctl = new AbortController(); goBtn.lastChild.textContent = "Annuler"; goBtn.classList.add("busy");
        status.textContent = "Génération en cours… (cela peut prendre une minute)";
        try {
          const blobs = await IG.generate({ provider: prov, model: m, prompt: o.out.textContent, negative: o.neg.textContent, format: fmt.value, quality: qual.value, n: Number(count.value), signal: ctl.signal });
          const recs = [];
          for (const b of blobs) { const rec = { id: HQ.util.uid(), provider: prov, model: m, tab, prompt: o.out.textContent, negative: o.neg.textContent, format: fmt.value, blob: b, createdAt: Date.now() }; await IG.add(rec); recs.push(rec); }
          recs.forEach((rec) => results.prepend(h("button", { type: "button", "aria-label": "Ouvrir l'image", style: "padding:0;border:1px solid var(--line);background:var(--bg);cursor:pointer;aspect-ratio:1;overflow:hidden", onclick: () => viewImage(rec, () => { results.replaceChildren(); }) }, h("img", { src: thumb(rec.blob), alt: "", style: "width:100%;height:100%;object-fit:cover" }))));
          status.textContent = `${recs.length} image(s) enregistrée(s) dans l'onglet Images (sur cet appareil).`;
        } catch (e) { status.textContent = e.name === "AbortError" ? "Génération annulée." : "Échec : " + e.message; }
        finally { ctl = null; goBtn.lastChild.textContent = "Générer l'image"; goBtn.classList.remove("busy"); }
      }
      box.append(h("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:10px" }, h("h2", { style: "margin:0;font-size:1.05rem" }, "Générer l'image"), HQ.util.iconBtn("settings", "Réglages API", () => apiSheet(() => { /* keys saved */ }))),
        h("div.form.r2", { style: "display:grid;gap:10px" }, field("Fournisseur", provSel), field("Modèle", model), field("Format", fmt), field("Qualité", qual)),
        h("div", { style: "display:flex;gap:10px;align-items:end;flex-wrap:wrap;margin-top:12px" }, h("div", { style: "min-width:120px" }, count), goBtn), dl, status, results);
      return box;
    }
    async function renderGallery() {
      const pane = panes.img; pane.replaceChildren(h("div.hint", "Chargement…"));
      let list = []; try { list = await IG.list(); } catch (e) { pane.replaceChildren(h("div.empty", "Galerie indisponible : " + e.message)); return; }
      const grid = h("div", { style: "display:grid;grid-template-columns:repeat(auto-fill,minmax(170px,1fr));gap:10px" });
      list.forEach((rec) => grid.appendChild(h("button", { type: "button", "aria-label": "Ouvrir l'image", style: "padding:0;border:1px solid var(--line);background:var(--bg);cursor:pointer;text-align:left;display:grid", onclick: () => viewImage(rec, renderGallery) },
        h("img", { src: thumb(rec.blob), alt: "", loading: "lazy", style: "width:100%;aspect-ratio:1;object-fit:cover" }), h("span.row-s", { style: "padding:6px 8px" }, `${TITLE[rec.tab] || "Image"} · ${HQ.util.fmtDate(HQ.util.isoDate(new Date(rec.createdAt)))}`))));
      pane.replaceChildren(h("div.toolbar", h("span.hint", `${list.length} image(s) sur cet appareil. Elles ne sont ni synchronisées ni incluses dans les sauvegardes : téléchargez celles que vous gardez.`), btn("Réglages API", { icon: "settings", sm: true, onClick: () => apiSheet() })), list.length ? grid : h("div.empty", "Aucune image. Générez-en depuis l'onglet Personnage, Créatures, Paysage ou Carte."));
    }

    // ----- library -----
    function savePromptSheet(tab, o, existing) {
      const name = HQ.util.input({ value: existing ? existing.name : `${TITLE[tab] || "Prompt"} — ${HQ.util.fmtDate(HQ.util.today())}`, maxlength: 80 });
      const projects = store.db().projects;
      const proj = HQ.util.select([["", "— aucun —"], ...projects.map((p) => [p.id, p.name])], existing ? existing.projectId || "" : "");
      const s = HQ.util.sheet({ title: "Sauvegarder dans la bibliothèque", body: h("form.form", { onsubmit: (e) => {
        e.preventDefault();
        store.mutate((d) => { d.prompts.unshift({ id: HQ.util.uid(), name: name.value.trim() || "Sans titre", tab, prompt: o.out.textContent, negative: o.neg.textContent, raw: readRaw(tab), projectId: proj.value || "", favorite: false, createdAt: Date.now() }); });
        s.close(); toast("Prompt sauvegardé", "ok");
      } }, field("Nom", name, { req: true }), projects.length ? field("Projet lié (optionnel)", proj) : null, h("div.form-actions", btn("Annuler", { onClick: () => s.close() }), btn("Sauvegarder", { kind: "accent", type: "submit" }))) });
    }
    let libQuery = "", libFilter = "all";
    function renderLibrary() {
      const pane = panes.lib; pane.replaceChildren();
      const d = store.db();
      const search = HQ.util.input({ placeholder: "Rechercher un prompt…", value: libQuery, type: "search" });
      const seg = h("div.seg", [["all", "Tous"], ["fav", "★ Favoris"], ...Object.entries(TITLE)].map(([k, l]) => h("button", { type: "button", "aria-pressed": String(libFilter === k), onclick: () => { libFilter = k; renderLibrary(); } }, l)));
      pane.appendChild(h("div.toolbar", h("div.search", icon("search"), search), seg, btn("Exporter .md", { icon: "download", sm: true, onClick: exportMd })));
      const list = h("div.stack");
      const items = d.prompts.filter((p) => (libFilter === "all" || (libFilter === "fav" ? p.favorite : p.tab === libFilter)) && (!libQuery || HQ.util.norm(p.name + " " + p.prompt).includes(HQ.util.norm(libQuery))));
      if (!items.length) list.appendChild(h("div.empty", d.prompts.length ? "Aucun résultat." : "Aucun prompt sauvegardé. Générez-en un puis touchez « Sauvegarder »."));
      items.forEach((p) => {
        const proj = d.projects.find((x) => x.id === p.projectId);
        list.appendChild(h("div.card", h("div", { style: "display:flex;justify-content:space-between;gap:10px;align-items:start;margin-bottom:8px" },
          h("div", h("div.row-t", p.name), h("div.row-s", `${TITLE[p.tab] || p.tab} · ${HQ.util.fmtDate(HQ.util.isoDate(new Date(p.createdAt)))}${proj ? " · " + proj.name : ""}`)),
          h("div", { style: "display:flex;gap:6px" }, HQ.util.iconBtn("star", p.favorite ? "Retirer des favoris" : "Favori", () => { store.mutate(() => { p.favorite = !p.favorite; }); renderLibrary(); }, p.favorite ? "" : ""), HQ.util.iconBtn("trash", "Supprimer", async () => { if (await HQ.util.confirm({ title: "Supprimer ce prompt ?", text: p.name, ok: "Supprimer", danger: true })) { store.mutate((dd) => { dd.prompts = dd.prompts.filter((x) => x.id !== p.id); }); renderLibrary(); } }, "danger"))),
          h("div.out", { style: "max-height:120px;overflow:auto;font-size:.85rem" }, p.prompt),
          h("div.form-actions", { style: "justify-content:flex-start;margin-top:12px" }, btn("Copier", { icon: "copy", sm: true, kind: "accent", onClick: () => copy(`${p.prompt}\n\nnegative prompt : ${p.negative}`, "Prompt copié") }), btn("Rouvrir dans le générateur", { sm: true, onClick: () => { if (SCHEMAS[p.tab]) { writeRaw(p.tab, p.raw || {}); persistState(); show(p.tab); } } }))));
      });
      pane.appendChild(list);
      search.addEventListener("input", () => { libQuery = search.value; const pos = search.selectionStart; renderLibrary(); const s2 = pane.querySelector("input[type=search]"); s2.focus(); s2.setSelectionRange(pos, pos); });
    }
    function exportMd() {
      const d = store.db();
      const md = "# Bibliothèque de prompts — Apex Prompt Studio\n\n" + d.prompts.map((p) => `## ${p.name}\n*${TITLE[p.tab] || p.tab} — ${HQ.util.fmtDate(HQ.util.isoDate(new Date(p.createdAt)))}*\n\n${p.prompt}\n\n**Negative prompt:** ${p.negative}\n`).join("\n---\n\n");
      HQ.util.download("apex-prompts.md", md, "text/markdown");
    }

    // ----- build & init -----
    Object.keys(SCHEMAS).forEach((t) => { panes[t] = buildGenPane(t); body.appendChild(panes[t]); });
    panes.style = buildStylePane(); body.appendChild(panes.style);
    panes.img = h("div"); body.appendChild(panes.img);
    panes.lib = h("div"); body.appendChild(panes.lib);
    applyStyle(loadStyle());
    const saved = store.db().apex.state;
    if (saved) Object.keys(SCHEMAS).forEach((t) => { if (saved[t]) writeRaw(t, saved[t]); });
    show(state.tab);
    return () => { clearTimeout(saveTimer); urls.forEach((u) => URL.revokeObjectURL(u)); };
  };
})();
