/* Project documents: Markdown (.md) notes edited visually (fonts, sizes, bold/italic/underline, colours, lists, tables…). */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, store = HQ.store, MD = HQ.md;
  HQ.views = HQ.views || {};

  const FONTS = [["'Space Grotesk', sans-serif", "Space Grotesk"], ["Arial, Helvetica, sans-serif", "Arial"], ["Verdana, Geneva, sans-serif", "Verdana"], ["'Trebuchet MS', sans-serif", "Trebuchet"], ["Georgia, serif", "Georgia"], ["'Times New Roman', Times, serif", "Times New Roman"], ["'JetBrains Mono', monospace", "JetBrains Mono"], ["'Courier New', monospace", "Courier New"]];
  const SIZES = [10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 40, 48];
  const FONT_SIZE_LEGACY = { 1: 10, 2: 13, 3: 16, 4: 18, 5: 24, 6: 32, 7: 48 };
  const TEMPLATES = {
    blank: ["Document vierge", ""],
    meeting: ["Compte rendu de réunion", "# Compte rendu de réunion\n\n**Date :** \n\n**Participants :** \n\n## Ordre du jour\n\n- \n\n## Décisions\n\n| Sujet | Décision | Responsable | Échéance |\n| --- | --- | --- | --- |\n|  |  |  |  |\n\n## Actions\n\n- \n"],
    spec: ["Spécification de fonctionnalité", "# Nom de la fonctionnalité\n\n## Objectif\n\nCe que le joueur doit pouvoir faire, et pourquoi.\n\n## Règles\n\n1. \n2. \n\n## Cas limites\n\n- \n\n## Paramètres d'équilibrage\n\n| Paramètre | Valeur | Remarque |\n| --- | --- | --- |\n|  |  |  |\n\n## Critères d'acceptation\n\n- \n"],
    todo: ["Liste de contrôle", "# Liste de contrôle\n\n## À faire\n\n- \n\n## En cours\n\n- \n\n## Terminé\n\n- \n"],
  };
  const slug = (s) => U.norm(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "document";
  const title1 = (md, fallback) => { const m = /^#\s+(.+)$/m.exec(md || ""); return m ? m[1].replace(/[*_`~<>]/g, "").trim().slice(0, 120) : fallback; };

  // ---------- Data ----------
  function createNote({ title, projectId, md }) {
    const id = U.uid();
    store.mutate((d) => { d.notes.push({ id, projectId: projectId || "", title: title || "Sans titre", md: md || "", createdAt: Date.now(), updatedAt: Date.now() }); });
    return id;
  }
  function createSheet(projectId) {
    const db = store.db();
    const f = { title: U.input({ placeholder: "Titre du document", maxlength: 120 }), project: U.select([["", "— sans projet —"], ...db.projects.map((p) => [p.id, p.name])], projectId || ""), tpl: U.select(Object.entries(TEMPLATES).map(([k, v]) => [k, v[0]]), "blank") };
    const s = U.sheet({ title: "Nouveau document", body: h("form.form", { onsubmit: (e) => {
      e.preventDefault();
      const t = TEMPLATES[f.tpl.value], title = f.title.value.trim() || (f.tpl.value === "blank" ? "Sans titre" : t[0]);
      const id = createNote({ title, projectId: f.project.value, md: t[1] });
      s.close(true); HQ.go("/projects/doc/" + id);
    } }, field("Titre", f.title), h("div.r2", field("Projet", f.project), field("Modèle", f.tpl)), h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Créer", { kind: "accent", type: "submit" }))) });
  }
  async function importMd(projectId) {
    const file = await U.pickFile(".md,.markdown,.txt,text/markdown,text/plain"); if (!file) return;
    const text = await U.readFile(file);
    if (text.length > 2000000) { U.toast("Fichier trop volumineux (2 Mo maximum).", "bad"); return; }
    const id = createNote({ title: title1(text, file.name.replace(/\.[^.]+$/, "")), projectId, md: text });
    U.toast("Document importé", "ok"); HQ.go("/projects/doc/" + id);
  }

  // ---------- List (Documents tab of the Projects page) ----------
  HQ.notes = {
    createSheet, importMd,
    panel(pf, redraw) {
      const db = store.db();
      let q = "";
      const search = U.input({ type: "search", placeholder: "Rechercher un document…" }), list = h("div.list");
      const projId = pf !== "all" && pf !== "none" ? pf : "";
      const draw = () => {
        const nq = U.norm(q);
        const items = db.notes.filter((n) => (pf === "all" || (pf === "none" ? !n.projectId : n.projectId === pf)) && (!nq || U.norm(n.title + " " + MD.plain(n.md)).includes(nq))).sort((a, b) => b.updatedAt - a.updatedAt);
        list.replaceChildren();
        if (!items.length) { list.appendChild(h("div.empty", db.notes.length ? "Aucun document ne correspond." : "Aucun document. Créez un compte rendu, une spécification ou une simple note pour ce projet.")); return; }
        items.forEach((n) => { const p = db.projects.find((x) => x.id === n.projectId); list.appendChild(h("a.row", { href: "#/projects/doc/" + n.id }, h("div", h("div.row-t", n.title), h("div.row-s", { style: "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" }, MD.plain(n.md).slice(0, 220) || "Document vide")), h("div.row-r", p ? h("span", { style: "display:inline-flex;gap:6px;align-items:center;font-size:.8rem;color:var(--muted)" }, h("span.dot", { style: `--c:${p.color}` }), p.name) : null, h("span.row-s", U.fmtDate(U.isoDate(new Date(n.updatedAt))))))); });
      };
      search.addEventListener("input", () => { q = search.value; draw(); });
      draw();
      return h("div", h("div.toolbar", h("div.search", icon("search"), search), U.btn("Nouveau document", { kind: "accent", icon: "plus", onClick: () => createSheet(projId) }), U.btn("Importer .md", { icon: "upload", onClick: () => importMd(projId) })), h("div.card", list));
    },
  };

  // ---------- Editor ----------
  HQ.views.noteEdit = function (root, ctx) {
    const db = store.db(), note = db.notes.find((n) => n.id === ctx.params.id);
    if (!note) { root.appendChild(h("div.empty", "Document introuvable. ", h("a", { href: "#/projects", style: "text-decoration:underline" }, "Retour aux projets"))); return; }
    let source = false, timer = null, savedRange = null, dirty = false;
    HQ.holdRefresh = true;

    const back = () => HQ.go("/projects?tab=docs" + (note.projectId ? "&p=" + note.projectId : ""));
    const titleIn = U.input({ value: note.title, maxlength: 120, "aria-label": "Titre du document", style: "font-size:1.35rem;font-weight:700;letter-spacing:-.02em;border:0;border-bottom:1px solid var(--line);background:transparent;padding-left:0" });
    const projSel = U.select([["", "— sans projet —"], ...db.projects.map((p) => [p.id, p.name])], note.projectId);
    const status = h("span.hint", "Enregistré");
    const words = h("span.hint");
    const ed = h("div.rte.notepaper", { contenteditable: "true", spellcheck: "true", role: "textbox", "aria-multiline": "true", "aria-label": "Contenu du document" });
    const src = h("textarea.rte-src", { spellcheck: false, "aria-label": "Markdown", hidden: true });
    ed.innerHTML = MD.toHtml(note.md) || "<p><br></p>";
    try { document.execCommand("defaultParagraphSeparator", false, "p"); } catch (e) { /* unsupported */ }

    // ----- saving -----
    const countWords = () => { const t = (source ? src.value : ed.innerText).trim(); words.textContent = t ? `${t.split(/\s+/).length} mots` : "Vide"; };
    function persist() {
      clearTimeout(timer); if (!dirty) return; dirty = false;
      const md = source ? src.value : MD.fromHtml(ed.innerHTML);
      store.mutate((d) => { const n = d.notes.find((x) => x.id === note.id); if (n) { n.md = md; n.title = titleIn.value.trim() || "Sans titre"; n.projectId = projSel.value; n.updatedAt = Date.now(); } });
      status.textContent = "Enregistré"; countWords();
    }
    function touch() { dirty = true; status.textContent = "Enregistrement…"; clearTimeout(timer); timer = setTimeout(persist, 700); countWords(); }
    titleIn.addEventListener("input", touch); projSel.addEventListener("change", () => { touch(); persist(); });
    src.addEventListener("input", touch);

    // ----- normalising what execCommand produces (legacy <font>) into styled spans -----
    function normalize() {
      const made = [];
      ed.querySelectorAll("font").forEach((f) => {
        const s = document.createElement("span"), st = [];
        if (f.getAttribute("face")) st.push(`font-family: ${f.getAttribute("face")}`);
        if (f.getAttribute("color")) st.push(`color: ${f.getAttribute("color")}`);
        if (f.getAttribute("size")) st.push(`font-size: ${f.dataset.px || FONT_SIZE_LEGACY[f.getAttribute("size")] || 16}px`);
        if (f.style.cssText) st.push(f.style.cssText.replace(/;$/, ""));
        if (st.length) s.setAttribute("style", st.join("; "));
        while (f.firstChild) s.appendChild(f.firstChild);
        f.replaceWith(s); made.push(s);
      });
      // a size set on a wrapper wins over nested sizes
      made.forEach((s) => { if (/font-size/.test(s.getAttribute("style") || "")) s.querySelectorAll("span[style]").forEach((c) => { c.style.removeProperty("font-size"); if (!c.getAttribute("style")) c.replaceWith(...c.childNodes); }); });
      ed.querySelectorAll("span:not([style])").forEach((s) => s.replaceWith(...s.childNodes));
      ed.normalize();
      return made;
    }
    function selectNodes(nodes) { if (!nodes.length) return; const r = document.createRange(); r.setStartBefore(nodes[0]); r.setEndAfter(nodes[nodes.length - 1]); const s = getSelection(); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); }

    // ----- selection handling (toolbar selects/inputs steal focus) -----
    document.addEventListener("selectionchange", onSel);
    function onSel() { const s = getSelection(); if (s.rangeCount && ed.contains(s.anchorNode)) { savedRange = s.getRangeAt(0).cloneRange(); syncBar(); } }
    function restore() { ed.focus({ preventScroll: true }); if (savedRange) { const s = getSelection(); s.removeAllRanges(); s.addRange(savedRange); } }
    function run(cmd, val) { if (source) return; restore(); document.execCommand(cmd, false, val); normalize(); touch(); syncBar(); }

    // ----- toolbar -----
    const bar = h("div.rte-bar", { role: "toolbar", "aria-label": "Mise en forme" });
    const press = {}; // buttons whose pressed state follows the selection
    const btn = (key, content, label, fn, o = {}) => { const b = h("button", { type: "button", class: "tb" + (o.cls ? " " + o.cls : ""), title: label, "aria-label": label, onmousedown: (e) => e.preventDefault(), onclick: fn }, content); if (o.state) press[key] = [b, o.state]; return b; };
    const sep = () => h("span.tb-sep");
    const blockSel = h("select.tb-sel", { "aria-label": "Style de paragraphe", onchange: () => { run("formatBlock", "<" + blockSel.value + ">"); } }, [["p", "Texte"], ["h1", "Titre 1"], ["h2", "Titre 2"], ["h3", "Titre 3"], ["blockquote", "Citation"], ["pre", "Code"]].map(([v, l]) => h("option", { value: v }, l)));
    const fontSel = h("select.tb-sel", { "aria-label": "Police", style: "max-width:150px", onchange: () => { restore(); document.execCommand("fontName", false, fontSel.value); const made = normalize(); selectNodes(made); touch(); } }, FONTS.map(([v, l]) => h("option", { value: v }, l)));
    const sizeSel = h("select.tb-sel", { "aria-label": "Taille de police", style: "width:72px", onchange: () => applySize(Number(sizeSel.value)) }, SIZES.map((n) => h("option", { value: n }, n + " px")));
    function applySize(px) {
      restore(); const sel = getSelection(); if (!sel.rangeCount) return;
      if (sel.isCollapsed) { try { sel.modify("move", "backward", "word"); sel.modify("extend", "forward", "word"); } catch (e) { /* no word selection support */ } if (sel.isCollapsed) { U.toast("Sélectionnez du texte pour changer sa taille."); return; } }
      document.execCommand("fontSize", false, "7");
      ed.querySelectorAll('font[size="7"]').forEach((f) => { f.dataset.px = px; });
      selectNodes(normalize()); touch();
    }
    const colorIn = h("input", { type: "color", value: "#15151a", class: "tb-color", "aria-label": "Couleur du texte", title: "Couleur du texte", onchange: () => { restore(); document.execCommand("foreColor", false, colorIn.value); selectNodes(normalize()); touch(); } });
    const hiliteIn = h("input", { type: "color", value: "#fff3a3", class: "tb-color", "aria-label": "Surlignage", title: "Surlignage", onchange: () => { restore(); document.execCommand("styleWithCSS", false, true); document.execCommand("hiliteColor", false, hiliteIn.value); document.execCommand("styleWithCSS", false, false); normalize(); touch(); } });
    function linkSheet() {
      restore(); const keep = savedRange;
      const url = U.input({ type: "url", placeholder: "https://…" }), err = h("p.ferr");
      const s = U.sheet({ title: "Insérer un lien", body: h("form.form", { onsubmit: (e) => { e.preventDefault(); let v = url.value.trim(); if (v && !/^(https?:|mailto:|#)/i.test(v)) v = "https://" + v; if (!/^(https?:\/\/.+\..+|mailto:.+@.+|#.+)/i.test(v)) { err.textContent = "Adresse invalide."; return; } s.close(true); savedRange = keep; run("createLink", v); } }, field("Adresse", url, { req: true }), err, h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Insérer", { kind: "accent", type: "submit" }))) });
    }
    function tableSheet() {
      restore(); const keep = savedRange;
      const rows = U.input({ type: "number", value: "3", min: "2", max: "30" }), cols = U.input({ type: "number", value: "3", min: "1", max: "10" });
      const s = U.sheet({ title: "Insérer un tableau", body: h("form.form", { onsubmit: (e) => {
        e.preventDefault(); const r = Math.min(30, Math.max(2, +rows.value || 3)), c = Math.min(10, Math.max(1, +cols.value || 3)); s.close(true); savedRange = keep;
        const t = document.createElement("table"), mkRow = (tag, txt) => { const tr = document.createElement("tr"); for (let i = 0; i < c; i++) { const x = document.createElement(tag); x.innerHTML = txt ? txt + (i + 1) : "<br>"; tr.appendChild(x); } return tr; };
        t.createTHead().appendChild(mkRow("th", "Colonne ")); const tbd = t.createTBody(); for (let i = 1; i < r; i++) tbd.appendChild(mkRow("td"));
        restore(); const sel = getSelection();
        let blk = sel.anchorNode && ed.contains(sel.anchorNode) ? (sel.anchorNode.nodeType === 1 ? sel.anchorNode : sel.anchorNode.parentNode) : ed;
        while (blk && blk !== ed && blk.parentNode !== ed) blk = blk.parentNode;
        const empty = blk && blk !== ed && !blk.textContent.trim() && /^(P|DIV)$/.test(blk.nodeName);
        if (!blk || blk === ed) ed.appendChild(t); else if (empty) blk.replaceWith(t); else blk.after(t);
        if (!t.nextElementSibling) { const p = document.createElement("p"); p.innerHTML = "<br>"; t.after(p); }
        placeCaret(t.querySelector("th"), true); touch(); syncBar();
      } }, h("div.r2", field("Lignes (en-tête inclus)", rows), field("Colonnes", cols)), h("p.hint", "La première ligne est l'en-tête. Vous pourrez ajouter ou supprimer des lignes et des colonnes avec les boutons qui apparaissent dans la barre quand le curseur est dans le tableau."), h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Insérer", { kind: "accent", type: "submit" }))) });
    }

    bar.append(
      btn("undo", icon("undo"), "Annuler", () => run("undo")), btn("redo", icon("redo"), "Rétablir", () => run("redo")), sep(), blockSel, fontSel, sizeSel, sep(),
      btn("bold", "B", "Gras (Ctrl+B)", () => run("bold"), { cls: "b", state: () => document.queryCommandState("bold") }), btn("italic", "I", "Italique (Ctrl+I)", () => run("italic"), { cls: "i", state: () => document.queryCommandState("italic") }),
      btn("underline", "U", "Souligné (Ctrl+U)", () => run("underline"), { cls: "u", state: () => document.queryCommandState("underline") }), btn("strike", "S", "Barré", () => run("strikeThrough"), { cls: "s", state: () => document.queryCommandState("strikeThrough") }),
      h("label.tb-colorwrap", { title: "Couleur du texte" }, h("span", "A"), colorIn), h("label.tb-colorwrap.hl", { title: "Surlignage" }, h("span", "ab"), hiliteIn), sep(),
      btn("ul", icon("listUl"), "Liste à puces", () => run("insertUnorderedList"), { state: () => document.queryCommandState("insertUnorderedList") }), btn("ol", icon("listOl"), "Liste numérotée", () => run("insertOrderedList"), { state: () => document.queryCommandState("insertOrderedList") }), sep(),
      btn("al", icon("alignL"), "Aligner à gauche", () => run("justifyLeft")), btn("ac", icon("alignC"), "Centrer", () => run("justifyCenter")), btn("ar", icon("alignR"), "Aligner à droite", () => run("justifyRight")), sep(),
      btn("link", icon("link"), "Insérer un lien", linkSheet), btn("unlink", icon("unlink"), "Retirer le lien", () => run("unlink")), btn("table", icon("table"), "Insérer un tableau", tableSheet), btn("hr", icon("rule"), "Ligne de séparation", () => run("insertHorizontalRule")),
      btn("clear", icon("eraser"), "Effacer la mise en forme", () => { run("removeFormat"); run("formatBlock", "<p>"); }));
    // table tools, only visible inside a table
    const tableBar = h("div.rte-bar.rte-tables", { hidden: true, role: "toolbar", "aria-label": "Outils de tableau" }, h("span.tb-label", "Tableau"));
    const tbtn = (label, fn, danger) => h("button", { type: "button", class: "tb tb-text" + (danger ? " danger" : ""), onmousedown: (e) => e.preventDefault(), onclick: () => { restore(); fn(); touch(); syncBar(); } }, label);
    const cellOf = () => { const s = getSelection(); const n = s.anchorNode && (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement); const c = n && n.closest && n.closest("td,th"); return c && ed.contains(c) ? c : null; };
    function placeCaret(el, all) { if (!el) return; const r = document.createRange(); r.selectNodeContents(el); if (!all) r.collapse(true); const s = getSelection(); s.removeAllRanges(); s.addRange(r); savedRange = r.cloneRange(); }
    const mk = (tag) => { const c = document.createElement(tag); c.innerHTML = "<br>"; return c; };
    const colIndex = (c) => [...c.parentElement.children].indexOf(c);
    function addRow(after) { const c = cellOf(); if (!c) return; const tr = c.parentElement, t = tr.closest("table"); const n = document.createElement("tr"); [...tr.children].forEach(() => n.appendChild(mk("td"))); if (tr.parentElement.tagName === "THEAD") { let tb = t.querySelector("tbody"); if (!tb) { tb = document.createElement("tbody"); t.appendChild(tb); } tb.insertBefore(n, tb.firstChild); } else if (after) tr.after(n); else tr.before(n); placeCaret(n.children[colIndex(c)]); }
    function addCol(after) { const c = cellOf(); if (!c) return; const i = colIndex(c) + (after ? 1 : 0); c.closest("table").querySelectorAll("tr").forEach((tr) => { const n = mk(tr.parentElement.tagName === "THEAD" || tr.children[0].tagName === "TH" ? "th" : "td"); if (n.tagName === "TH") n.innerHTML = "Colonne"; tr.insertBefore(n, tr.children[i] || null); }); placeCaret(c.parentElement.children[i]); }
    function delRow() { const c = cellOf(); if (!c) return; const tr = c.parentElement, t = tr.closest("table"); if (tr.parentElement.tagName === "THEAD" || t.rows.length <= 2) { U.toast("Un tableau garde son en-tête et au moins une ligne."); return; } const next = tr.nextElementSibling || tr.previousElementSibling; tr.remove(); placeCaret(next && next.children[Math.min(colIndex(c), next.children.length - 1)]); }
    function delCol() { const c = cellOf(); if (!c) return; const t = c.closest("table"), i = colIndex(c), row = c.parentElement; if (row.children.length <= 1) { U.toast("Un tableau garde au moins une colonne."); return; } t.querySelectorAll("tr").forEach((tr) => tr.children[i] && tr.children[i].remove()); placeCaret(row.children[Math.min(i, row.children.length - 1)]); }
    function delTable() { const c = cellOf(); if (!c) return; const t = c.closest("table"), p = document.createElement("p"); p.innerHTML = "<br>"; t.replaceWith(p); placeCaret(p); }
    tableBar.append(tbtn("Ligne ↑", () => addRow(false)), tbtn("Ligne ↓", () => addRow(true)), tbtn("Colonne ←", () => addCol(false)), tbtn("Colonne →", () => addCol(true)), tbtn("Suppr. ligne", delRow, true), tbtn("Suppr. colonne", delCol, true), tbtn("Suppr. tableau", delTable, true));

    function syncBar() {
      for (const [b, st] of Object.values(press)) { let on = false; try { on = st(); } catch (e) { /* ignore */ } b.setAttribute("aria-pressed", String(!!on)); }
      const s = getSelection(), n = s.anchorNode && ed.contains(s.anchorNode) ? (s.anchorNode.nodeType === 1 ? s.anchorNode : s.anchorNode.parentElement) : null;
      if (n) {
        const cs = getComputedStyle(n), px = Math.round(parseFloat(cs.fontSize));
        const near = SIZES.reduce((a, b) => (Math.abs(b - px) < Math.abs(a - px) ? b : a), SIZES[0]); sizeSel.value = String(near);
        const fam = cs.fontFamily.toLowerCase(), hit = FONTS.find(([v]) => fam.startsWith(v.split(",")[0].replace(/['"]/g, "").toLowerCase())); if (hit) fontSel.value = hit[0];
        const blk = n.closest("h1,h2,h3,blockquote,pre"); blockSel.value = blk ? blk.tagName.toLowerCase() : "p";
      }
      tableBar.hidden = !cellOf();
    }

    // ----- editing behaviour -----
    ed.addEventListener("input", () => { touch(); });
    ed.addEventListener("focus", () => { document.execCommand("defaultParagraphSeparator", false, "p"); });
    ed.addEventListener("keydown", (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s") { e.preventDefault(); persist(); U.toast("Document enregistré", "ok"); return; }
      const c = cellOf();
      if (c && e.key === "Enter") { e.preventDefault(); document.execCommand("insertLineBreak"); return; } // keep a cell inline so the table stays valid Markdown
      if (c && e.key === "Tab") {
        e.preventDefault(); const cells = [...c.closest("table").querySelectorAll("th,td")], i = cells.indexOf(c) + (e.shiftKey ? -1 : 1);
        if (i >= cells.length) { addRow(true); touch(); } else if (cells[i]) placeCaret(cells[i], true);
      }
    });
    ed.addEventListener("paste", (e) => {
      e.preventDefault(); const cd = e.clipboardData, html = cd.getData("text/html"), text = cd.getData("text/plain");
      if (cellOf() || !html) document.execCommand("insertText", false, text);
      else document.execCommand("insertHTML", false, MD.sanitize(html));
      normalize(); touch();
    });
    ed.addEventListener("drop", (e) => { e.preventDefault(); const t = e.dataTransfer.getData("text/plain"); if (t) document.execCommand("insertText", false, t); });
    ed.addEventListener("click", (e) => { const a = e.target.closest("a"); if (a && (e.ctrlKey || e.metaKey)) window.open(a.href, "_blank", "noopener"); });

    // ----- actions -----
    function setSource(on) {
      if (on === source) return;
      persist();
      if (on) { src.value = MD.fromHtml(ed.innerHTML); src.hidden = false; ed.hidden = true; bar.classList.add("off"); tableBar.hidden = true; srcBtn.setAttribute("aria-pressed", "true"); }
      else { ed.innerHTML = MD.toHtml(src.value) || "<p><br></p>"; src.hidden = true; ed.hidden = false; bar.classList.remove("off"); srcBtn.setAttribute("aria-pressed", "false"); dirty = true; }
      source = on; countWords();
    }
    const srcBtn = U.btn("Markdown", { icon: "doc", sm: true, onClick: () => setSource(!source) });
    const exportMd = () => { persist(); const n = db.notes.find((x) => x.id === note.id); const md = /^#\s/.test(n.md) ? n.md : `# ${n.title}\n\n${n.md}`; U.download(slug(n.title) + ".md", md, "text/markdown"); };
    const printDoc = () => { persist(); const n = db.notes.find((x) => x.id === note.id); U.printHTML(`<div class="paper notepaper"><h1 style="margin-bottom:18px">${U.esc(n.title)}</h1>${MD.toHtml(n.md)}</div>`); };
    const actions = h("div.head-actions.page-actions-scroll", { style: "gap:8px" }, srcBtn, U.btn("Exporter .md", { icon: "download", sm: true, onClick: exportMd }), U.btn("Copier le Markdown", { icon: "copy", sm: true, onClick: () => { persist(); U.copy(db.notes.find((x) => x.id === note.id).md, "Markdown copié"); } }), U.btn("PDF", { icon: "print", sm: true, onClick: printDoc }),
      U.btn("Dupliquer", { sm: true, onClick: () => { persist(); const n = db.notes.find((x) => x.id === note.id); const id = createNote({ title: n.title + " (copie)", projectId: n.projectId, md: n.md }); HQ.go("/projects/doc/" + id); } }),
      U.btn("Supprimer", { kind: "danger", sm: true, icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer ce document ?", text: note.title, ok: "Supprimer", danger: true })) { dirty = false; clearTimeout(timer); store.mutate((d) => { d.notes = d.notes.filter((x) => x.id !== note.id); }); back(); } } }));

    root.append(h("div.page-head", { style: "margin-bottom:14px" }, h("div", { style: "flex:1;min-width:0" }, h("button.back", { type: "button", onclick: () => { persist(); back(); } }, icon("chevL"), "Documents"), h("div", { style: "margin-top:10px" }, titleIn))),
      h("div.toolbar", { style: "margin-bottom:12px" }, h("div", { style: "min-width:200px;flex:1" }, projSel), status, words), actions,
      h("div.rte-wrap", { style: "margin-top:14px" }, bar, tableBar, h("div.rte-page", ed, src)));
    countWords(); syncBar();
    if (!note.md) setTimeout(() => ed.focus(), 50);
    return () => { document.removeEventListener("selectionchange", onSel); persist(); HQ.holdRefresh = false; };
  };
})();
