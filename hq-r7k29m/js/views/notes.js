/* Project documents: Markdown (.md) notes edited visually (fonts, sizes, bold/italic/underline, colours, lists, tables…),
   organised in folders, with PDF and spreadsheet (Excel/Sheets) documents. */
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
  const bytes = (n) => (n < 1e6 ? Math.max(1, Math.round(n / 1e3)) + " Ko" : (n / 1e6).toFixed(1).replace(".", ",") + " Mo");
  const KIND = { md: "Document", pdf: "PDF", sheet: "Tableur" };

  // ---------- Folders ----------
  const folderById = (id) => store.db().folders.find((f) => f.id === id);
  const folderPath = (id) => { const out = []; let f = folderById(id), n = 0; while (f && n++ < 30) { out.unshift(f.name); f = folderById(f.parentId); } return out.join(" / "); };
  const descendants = (id) => { const all = store.db().folders, out = []; const walk = (p) => all.filter((f) => f.parentId === p).forEach((f) => { out.push(f.id); walk(f.id); }); walk(id); return out; };
  // [value, label] pairs of the folders of a project, indented by depth
  function folderOptions(projectId, exclude) {
    const all = store.db().folders.filter((f) => (f.projectId || "") === (projectId || "") && !(exclude || []).includes(f.id)), out = [["", "— racine —"]];
    const walk = (parent, depth) => all.filter((f) => (f.parentId || "") === parent).sort((a, b) => a.name.localeCompare(b.name, "fr")).forEach((f) => { out.push([f.id, "  ".repeat(depth) + (depth ? "↳ " : "") + f.name]); walk(f.id, depth + 1); });
    walk("", 0);
    return out;
  }
  const countIn = (id) => { const d = store.db(); return d.notes.filter((n) => n.folderId === id).length + d.folders.filter((f) => f.parentId === id).length; };

  function folderSheet(existing, projectId, parentId, done) {
    const name = U.input({ value: existing ? existing.name : "", maxlength: 80, placeholder: "Nom du dossier" }), err = h("p.ferr", { role: "alert" });
    const s = U.sheet({ title: existing ? "Renommer le dossier" : "Nouveau dossier", body: h("form.form", { onsubmit: (e) => {
      e.preventDefault(); const v = name.value.trim().replace(/[\/\\]/g, "-");
      if (!v) { err.textContent = "Donnez un nom au dossier."; return; }
      const pid = existing ? existing.projectId || "" : projectId, par = existing ? existing.parentId || "" : parentId;
      if (store.db().folders.some((f) => f.id !== (existing && existing.id) && (f.projectId || "") === pid && (f.parentId || "") === par && f.name.toLowerCase() === v.toLowerCase())) { err.textContent = "Un dossier porte déjà ce nom ici."; return; }
      let id = existing && existing.id;
      store.mutate((d) => { if (existing) d.folders.find((f) => f.id === id).name = v; else { id = U.uid(); d.folders.push({ id, name: v, projectId: pid, parentId: par, createdAt: Date.now() }); } });
      s.close(true); done && done(id);
    } }, field("Nom", name, { req: true }), err, h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn(existing ? "Renommer" : "Créer", { kind: "accent", type: "submit" }))) });
    setTimeout(() => name.focus(), 60);
  }
  async function deleteFolder(f, done) {
    const n = countIn(f.id);
    if (!(await U.confirm({ title: "Supprimer ce dossier ?", text: `${f.name}${n ? ` — ses ${n} élément(s) remontent d'un niveau, rien n'est supprimé.` : ""}`, ok: "Supprimer le dossier", danger: true }))) return;
    store.mutate((d) => { d.notes.forEach((x) => { if (x.folderId === f.id) x.folderId = f.parentId || ""; }); d.folders.forEach((x) => { if (x.parentId === f.id) x.parentId = f.parentId || ""; }); d.folders = d.folders.filter((x) => x.id !== f.id); });
    done && done();
  }
  function moveNotes(ids, folderId) {
    const target = folderById(folderId);
    store.mutate((d) => { d.notes.forEach((n) => { if (ids.includes(n.id)) { n.folderId = folderId || ""; if (target) n.projectId = target.projectId || ""; n.updatedAt = Date.now(); } }); });
  }
  function moveSheet(note, done) {
    const sel = U.select(folderOptions(note.projectId), note.folderId || "");
    const s = U.sheet({ title: "Déplacer le document", body: h("form.form", { onsubmit: (e) => { e.preventDefault(); moveNotes([note.id], sel.value); s.close(true); U.toast("Document déplacé", "ok"); done && done(); } },
      h("p.muted", note.title), field("Dossier du projet", sel), h("p.hint", "Les dossiers appartiennent à un projet. Pour changer de projet, ouvrez le document."), h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Déplacer", { kind: "accent", type: "submit" }))) });
  }

  // ---------- Data ----------
  function createNote({ title, projectId, folderId, md }) {
    const id = U.uid();
    store.mutate((d) => { d.notes.push({ id, projectId: projectId || "", folderId: folderId || "", title: title || "Sans titre", md: md || "", kind: "md", createdAt: Date.now(), updatedAt: Date.now() }); });
    return id;
  }
  function createSheet(projectId, folderId) {
    const db = store.db();
    const f = { title: U.input({ placeholder: "Titre du document", maxlength: 120 }), project: U.select([["", "— sans projet —"], ...db.projects.map((p) => [p.id, p.name])], projectId || ""), tpl: U.select(Object.entries(TEMPLATES).map(([k, v]) => [k, v[0]]), "blank") };
    const folderWrap = h("div"), drawFolder = () => { const sel = U.select(folderOptions(f.project.value), f.project.value === (projectId || "") ? folderId || "" : ""); folderWrap.replaceChildren(field("Dossier", sel)); f.folder = sel; };
    drawFolder(); f.project.addEventListener("change", drawFolder);
    const s = U.sheet({ title: "Nouveau document", body: h("form.form", { onsubmit: (e) => {
      e.preventDefault();
      const t = TEMPLATES[f.tpl.value], title = f.title.value.trim() || (f.tpl.value === "blank" ? "Sans titre" : t[0]);
      const id = createNote({ title, projectId: f.project.value, folderId: f.folder.value, md: t[1] });
      s.close(true); HQ.go("/projects/doc/" + id);
    } }, field("Titre", f.title), h("div.r2", field("Projet", f.project), field("Modèle", f.tpl)), folderWrap, h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Créer", { kind: "accent", type: "submit" }))) });
  }

  // ---------- Import (files and whole folders) ----------
  async function runImport(entries, projectId, folderId, redraw) {
    if (!entries.length) { U.toast("Aucun fichier à importer."); return; }
    let busy; const bar = U.sheet({ title: "Import en cours", body: busy = h("div.stack", h("p.muted", { id: "imp-line" }, "Préparation…"), h("div.meter", h("i", { id: "imp-bar", style: "transform:scaleX(0)" }))) });
    let rep;
    try { rep = await HQ.importer.run(entries, { projectId, folderId }, (i, n, name) => { const l = busy.querySelector("#imp-line"), b = busy.querySelector("#imp-bar"); if (l) l.textContent = `${i}/${n} — ${name}`; if (b) b.style.transform = `scaleX(${i / n})`; }); }
    catch (e) { bar.close(true); U.toast("Import impossible : " + e.message, "bad"); return; }
    bar.close(true); redraw && redraw();
    const lines = [`${rep.notes} document(s) importé(s) : ${rep.md} texte, ${rep.sheets} tableur, ${rep.pdf} PDF.`, rep.folders ? `${rep.folders} dossier(s) créé(s).` : null].filter(Boolean);
    const warn = [...rep.notes2, ...rep.failed, ...(rep.skipped.length ? [`${rep.skipped.length} fichier(s) ignoré(s) (format non pris en charge) : ${rep.skipped.slice(0, 8).join(", ")}${rep.skipped.length > 8 ? "…" : ""}`] : [])];
    if (!warn.length) { U.toast(lines[0], "ok"); return; }
    const s = U.sheet({ title: "Import terminé", body: h("div.stack", ...lines.map((l) => h("p", l)), h("div.banner.warn", { style: "display:grid;gap:6px" }, ...warn.map((w) => h("div", { style: "overflow-wrap:anywhere;font-size:.88rem" }, w))), h("div.form-actions", U.btn("OK", { kind: "accent", onClick: () => s.close() }))) });
  }
  function importSheet(projectId, folderId, redraw) {
    const mk = (props) => h("input", Object.assign({ type: "file", hidden: true }, props));
    const files = mk({ multiple: true, accept: HQ.importer.ACCEPT }), dir = mk({ webkitdirectory: true, multiple: true });
    files.addEventListener("change", () => { const e = HQ.importer.fromInput(files.files); s.close(true); runImport(e, projectId, folderId, redraw); });
    dir.addEventListener("change", () => { const e = HQ.importer.fromInput(dir.files); s.close(true); runImport(e, projectId, folderId, redraw); });
    const s = U.sheet({ title: "Importer", body: h("div.stack", files, dir,
      h("p.muted", "Texte et Markdown (.md, .txt) restent modifiables. Excel / Sheets (.xlsx, .xls, .ods, .csv) deviennent des tableaux modifiables ; l'original est gardé sur cet appareil. Les PDF sont consultables dans l'application."),
      U.btn("Choisir des fichiers", { kind: "accent", icon: "upload", onClick: () => files.click() }), U.btn("Choisir un dossier complet", { icon: "folder", onClick: () => dir.click() }),
      h("p.hint", "Le dossier choisi est recréé avec ses sous-dossiers. Sur iPhone, Safari ne sait pas choisir un dossier : importez les fichiers, ou utilisez un ordinateur. Sur ordinateur, vous pouvez aussi glisser-déposer fichiers et dossiers sur la liste."),
      h("p.hint", "Les PDF et les fichiers originaux restent sur l'appareil qui les a importés (non synchronisés) ; le texte et les tableaux, eux, sont synchronisés.")) });
  }

  // ---------- List (Documents tab of the Projects page) ----------
  HQ.notes = {
    createSheet,
    purgeFiles: (ids) => ids.forEach((id) => HQ.files.remove(id)),
    panel(pf, redraw) {
      const db = store.db();
      const inScope = (pid) => pf === "all" || (pf === "none" ? !pid : pid === pf);
      const projId = pf !== "all" && pf !== "none" ? pf : "";
      let q = "", cur = "";
      try { cur = sessionStorage.getItem("n29hq.folder") || ""; } catch (e) { /* ignore */ }
      { const f = folderById(cur); if (!f || !inScope(f.projectId || "")) cur = ""; }
      const setCur = (id) => { cur = id; try { sessionStorage.setItem("n29hq.folder", id); } catch (e) { /* ignore */ } draw(); };
      const search = U.input({ type: "search", placeholder: "Rechercher dans les documents…" }), list = h("div.list"), crumbs = h("div.crumbs", { "aria-label": "Chemin" });
      const curProject = () => (cur ? (folderById(cur) || {}).projectId || "" : projId);

      const noteRow = (n, showPath) => {
        const p = db.projects.find((x) => x.id === n.projectId);
        const sub = n.kind === "pdf" ? `PDF · ${n.pages || "?"} page(s)${n.file ? " · " + bytes(n.file.size) : ""}` : n.kind === "sheet" ? "Tableur" + (n.file ? " · " + n.file.name : "") : MD.plain(n.md).slice(0, 200) || "Document vide";
        const row = h("div.row.row--doc", { draggable: "true" },
          h("a.row-main", { href: "#/projects/doc/" + n.id }, h("span.kind", { class: "kind kind--" + (n.kind || "md") }, icon(n.kind === "pdf" ? "doc" : n.kind === "sheet" ? "table" : "edit"), (KIND[n.kind || "md"])), h("div", h("div.row-t", n.title), h("div.row-s", { style: "display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden" }, (showPath && n.folderId ? folderPath(n.folderId) + " — " : "") + sub))),
          h("div.row-r", p && pf === "all" ? h("span", { style: "display:inline-flex;gap:6px;align-items:center;font-size:.8rem;color:var(--muted)" }, h("span.dot", { style: `--c:${p.color}` }), p.name) : null, h("span.row-s", U.fmtDate(U.isoDate(new Date(n.updatedAt)))), U.iconBtn("folder", "Déplacer dans un dossier", () => moveSheet(n, draw))));
        row.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/n29-note", n.id); e.dataTransfer.effectAllowed = "move"; });
        return row;
      };
      const folderRow = (f) => {
        const p = db.projects.find((x) => x.id === f.projectId);
        const row = h("div.row.row--folder", { dataset: { folder: f.id } },
          h("button.row-main", { type: "button", onclick: () => setCur(f.id) }, h("span.kind.kind--folder", icon("folder")), h("div", h("div.row-t", f.name), h("div.row-s", `${countIn(f.id)} élément(s)${p && pf === "all" ? " · " + p.name : ""}`))),
          h("div.row-r", { style: "grid-auto-flow:column;gap:6px" }, U.iconBtn("edit", "Renommer", () => folderSheet(f, "", "", draw)), U.iconBtn("trash", "Supprimer le dossier", () => deleteFolder(f, draw), "danger")));
        dropTarget(row, f.id);
        return row;
      };
      // dragging a document onto a folder moves it; dropping files / folders from the computer imports them there
      function dropTarget(el, folderRef) {
        const target = () => (typeof folderRef === "function" ? folderRef() : folderRef);
        const over = (e) => { const t = [...(e.dataTransfer.types || [])]; if (t.includes("text/n29-note") || t.includes("Files")) { e.preventDefault(); e.stopPropagation(); el.classList.add("drop"); } };
        el.addEventListener("dragover", over); el.addEventListener("dragenter", over);
        el.addEventListener("dragleave", () => el.classList.remove("drop"));
        el.addEventListener("drop", async (e) => {
          e.preventDefault(); e.stopPropagation(); el.classList.remove("drop");
          const id = e.dataTransfer.getData("text/n29-note");
          const folderId = target();
          if (id) { moveNotes([id], folderId); draw(); U.toast("Document déplacé", "ok"); return; }
          if (e.dataTransfer.types.includes("Files")) { const entries = await HQ.importer.fromDrop(e.dataTransfer); runImport(entries, folderId ? (folderById(folderId) || {}).projectId || "" : projId, folderId, draw); }
        });
      }
      function drawCrumbs() {
        crumbs.replaceChildren();
        const chain = []; let f = folderById(cur), n = 0; while (f && n++ < 30) { chain.unshift(f); f = folderById(f.parentId); }
        crumbs.append(h("button", { type: "button", onclick: () => setCur("") }, icon("home"), "Racine"), ...chain.flatMap((x, i) => [h("span", { "aria-hidden": "true" }, "›"), i === chain.length - 1 ? h("b", x.name) : h("button", { type: "button", onclick: () => setCur(x.id) }, x.name)]));
        crumbs.hidden = !cur;
      }
      function draw() {
        const nq = U.norm(q); list.replaceChildren();
        const noteHit = (n) => U.norm(n.title + " " + MD.plain(n.md) + " " + (n.text || "")).includes(nq);
        if (nq) {
          crumbs.hidden = true;
          const fs = db.folders.filter((f) => inScope(f.projectId || "") && U.norm(f.name).includes(nq)), ns = db.notes.filter((n) => inScope(n.projectId) && noteHit(n)).sort((a, b) => b.updatedAt - a.updatedAt);
          fs.forEach((f) => list.appendChild(folderRow(f))); ns.forEach((n) => list.appendChild(noteRow(n, true)));
          if (!fs.length && !ns.length) list.appendChild(h("div.empty", "Aucun résultat."));
          return;
        }
        drawCrumbs();
        const folders = db.folders.filter((f) => (f.parentId || "") === cur && (cur ? true : inScope(f.projectId || ""))).sort((a, b) => a.name.localeCompare(b.name, "fr"));
        const notes = db.notes.filter((n) => (n.folderId || "") === cur && (cur ? true : inScope(n.projectId))).sort((a, b) => b.updatedAt - a.updatedAt);
        folders.forEach((f) => list.appendChild(folderRow(f))); notes.forEach((n) => list.appendChild(noteRow(n, false)));
        if (!folders.length && !notes.length) list.appendChild(h("div.empty", cur ? "Dossier vide. Créez un document, importez des fichiers ou glissez-y des documents." : db.notes.some((n) => inScope(n.projectId)) || db.folders.some((f) => inScope(f.projectId || "")) ? "Rien ici." : "Aucun document. Créez un compte rendu, une spécification, importez un dossier, des PDF ou des tableurs Excel."));
      }
      search.addEventListener("input", () => { q = search.value; draw(); });
      draw();
      const wrap = h("div", h("div.toolbar", h("div.search", icon("search"), search), U.btn("Document", { kind: "accent", icon: "plus", onClick: () => createSheet(curProject(), cur) }), U.btn("Dossier", { icon: "folder", onClick: () => folderSheet(null, curProject(), cur, (id) => { setCur(id); }) }), U.btn("Importer", { icon: "upload", onClick: () => importSheet(curProject(), cur, draw) })), crumbs, h("div.card.dropzone", list, h("p.hint", { style: "margin-top:10px" }, "Glissez des fichiers ou des dossiers ici (ordinateur) pour les importer.")));
      dropTarget(wrap.querySelector(".dropzone"), () => cur);
      wrap.querySelector(".dropzone").addEventListener("dragover", (e) => { if ([...(e.dataTransfer.types || [])].includes("Files")) e.preventDefault(); });
      return wrap;
    },
  };

  function downloadBlob(blob, name) { const u = URL.createObjectURL(blob), a = h("a", { href: u, download: name }); document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); }

  // ---------- PDF viewer ----------
  function pdfView(root, note) {
    const db = store.db();
    let zoom = 1, doc = null, observer = null, token = 0;
    const back = () => { try { sessionStorage.setItem("n29hq.folder", note.folderId || ""); } catch (e) { /* ignore */ } HQ.go("/projects?tab=docs" + (note.projectId ? "&p=" + note.projectId : "")); };
    const titleIn = U.input({ value: note.title, maxlength: 120, "aria-label": "Titre du document", style: "font-size:1.35rem;font-weight:700;letter-spacing:-.02em;border:0;border-bottom:1px solid var(--line);background:transparent;padding-left:0" });
    const projSel = U.select([["", "— sans projet —"], ...db.projects.map((p) => [p.id, p.name])], note.projectId), folderSel = U.select(folderOptions(note.projectId), note.folderId || "");
    const save = () => store.mutate((d) => { const n = d.notes.find((x) => x.id === note.id); if (n) { n.title = titleIn.value.trim() || "Sans titre"; n.projectId = projSel.value; n.folderId = folderSel.value || ""; n.updatedAt = Date.now(); } });
    titleIn.addEventListener("change", save); folderSel.addEventListener("change", () => { note.folderId = folderSel.value; save(); });
    projSel.addEventListener("change", () => { note.projectId = projSel.value; folderSel.replaceChildren(...folderOptions(projSel.value).map(([v, l]) => h("option", { value: v }, l))); folderSel.value = ""; save(); });
    const pages = h("div.pdf-pages"), info = h("span.hint", `${note.pages || "?"} page(s)${note.file ? " · " + bytes(note.file.size) : ""}`);
    const zoomLbl = h("span.hint", { style: "min-width:44px;text-align:center" }, "100 %");
    const setZoom = (z) => { zoom = Math.min(3, Math.max(0.5, z)); zoomLbl.textContent = Math.round(zoom * 100) + " %"; renderAll(); };
    let blob = null;
    const actions = h("div.head-actions.page-actions-scroll", { style: "gap:8px" }, U.btn("−", { sm: true, onClick: () => setZoom(zoom - 0.25), title: "Réduire" }), zoomLbl, U.btn("+", { sm: true, onClick: () => setZoom(zoom + 0.25), title: "Agrandir" }),
      U.btn("Télécharger", { icon: "download", sm: true, kind: "accent", onClick: () => blob ? downloadBlob(blob, note.file ? note.file.name : note.title + ".pdf") : U.toast("Fichier indisponible sur cet appareil.", "bad") }),
      U.btn("Remplacer le PDF", { icon: "upload", sm: true, onClick: attach }),
      U.btn("Supprimer", { kind: "danger", sm: true, icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer ce PDF ?", text: note.title, ok: "Supprimer", danger: true })) { HQ.files.remove(note.id); store.mutate((d) => { d.notes = d.notes.filter((x) => x.id !== note.id); }); back(); } } }));
    root.append(h("div.page-head", { style: "margin-bottom:14px" }, h("div", { style: "flex:1;min-width:0" }, h("button.back", { type: "button", onclick: back }, icon("chevL"), "Documents"), h("div", { style: "margin-top:10px" }, titleIn))),
      h("div.toolbar", { style: "margin-bottom:12px" }, h("div", { style: "min-width:180px;flex:1" }, projSel), h("div", { style: "min-width:180px;flex:1" }, folderSel), info), actions, h("div.pdf-wrap", { style: "margin-top:14px" }, pages));

    async function attach() {
      const f = await U.pickFile(".pdf,application/pdf"); if (!f) return;
      if (f.size > 40e6) { U.toast("PDF trop volumineux (40 Mo maximum).", "bad"); return; }
      try { const buf = await f.arrayBuffer(), inf = await HQ.importer.pdfInfo(buf); await HQ.files.put(note.id, f); store.mutate((d) => { const n = d.notes.find((x) => x.id === note.id); n.pages = inf.pages; n.text = inf.text; n.file = { name: f.name, size: f.size, mime: "application/pdf" }; }); note.pages = inf.pages; note.file = { name: f.name, size: f.size }; load(); U.toast("PDF attaché", "ok"); }
      catch (e) { U.toast("PDF illisible : " + e.message, "bad"); }
    }
    async function load() {
      pages.replaceChildren(h("div.hint", "Chargement du PDF…"));
      blob = await HQ.files.get(note.id);
      if (!blob) { pages.replaceChildren(h("div.empty", "Ce PDF n'est pas disponible sur cet appareil : les fichiers ne sont pas synchronisés, seul le texte l'est. Importez-le à nouveau avec « Remplacer le PDF » pour le consulter ici.", note.text ? h("details", { style: "margin-top:12px;text-align:left" }, h("summary", "Texte extrait"), h("div.out", { style: "max-height:40vh;overflow:auto" }, note.text.slice(0, 6000))) : null)); return; }
      try {
        const lib = await HQ.importer.loadPdf(); if (doc) doc.destroy();
        doc = await lib.getDocument({ data: new Uint8Array(await blob.arrayBuffer()) }).promise;
        info.textContent = `${doc.numPages} page(s) · ${bytes(blob.size)}`; renderAll();
      } catch (e) { pages.replaceChildren(h("div.empty", "Impossible d'afficher ce PDF : " + e.message + " Vous pouvez le télécharger.")); }
    }
    async function renderAll() {
      if (!doc) return; const my = ++token; pages.replaceChildren(); if (observer) observer.disconnect();
      const width = Math.max(260, pages.clientWidth || root.clientWidth - 8) * zoom, dpr = Math.min(window.devicePixelRatio || 1, 2);
      const holders = [];
      for (let i = 1; i <= doc.numPages; i++) {
        const pg = await doc.getPage(i); if (my !== token) return;
        const v1 = pg.getViewport({ scale: 1 }), scale = width / v1.width, vp = pg.getViewport({ scale });
        const holder = h("div.pdf-page", { style: `width:${Math.floor(vp.width)}px;height:${Math.floor(vp.height)}px`, dataset: { n: i } });
        holder._render = async () => {
          if (holder._done) return; holder._done = true;
          const cv = document.createElement("canvas"), pv = pg.getViewport({ scale: scale * dpr }); cv.width = Math.floor(pv.width); cv.height = Math.floor(pv.height); cv.style.width = "100%"; cv.style.height = "100%";
          holder.appendChild(cv);
          try { await pg.render({ canvasContext: cv.getContext("2d"), viewport: pv }).promise; } catch (e) { holder._done = false; }
        };
        pages.appendChild(holder); holders.push(holder);
      }
      observer = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) e.target._render(); }), { rootMargin: "600px 0px" });
      holders.forEach((x) => observer.observe(x));
    }
    load();
    let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(renderAll, 250); };
    window.addEventListener("resize", onResize);
    return () => { window.removeEventListener("resize", onResize); if (observer) observer.disconnect(); token++; if (doc) doc.destroy(); };
  }

  // ---------- Editor ----------
  HQ.views.noteEdit = function (root, ctx) {
    const db = store.db(), note = db.notes.find((n) => n.id === ctx.params.id);
    if (!note) { root.appendChild(h("div.empty", "Document introuvable. ", h("a", { href: "#/projects", style: "text-decoration:underline" }, "Retour aux projets"))); return; }
    if (note.kind === "pdf") return pdfView(root, note);
    let source = false, timer = null, savedRange = null, dirty = false;
    HQ.holdRefresh = true;

    const back = () => { try { sessionStorage.setItem("n29hq.folder", folderSel.value || ""); } catch (e) { /* ignore */ } HQ.go("/projects?tab=docs" + (note.projectId ? "&p=" + note.projectId : "")); };
    const titleIn = U.input({ value: note.title, maxlength: 120, "aria-label": "Titre du document", style: "font-size:1.35rem;font-weight:700;letter-spacing:-.02em;border:0;border-bottom:1px solid var(--line);background:transparent;padding-left:0" });
    const projSel = U.select([["", "— sans projet —"], ...db.projects.map((p) => [p.id, p.name])], note.projectId);
    const folderSel = U.select(folderOptions(note.projectId), note.folderId || "");
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
      store.mutate((d) => { const n = d.notes.find((x) => x.id === note.id); if (n) { n.md = md; n.title = titleIn.value.trim() || "Sans titre"; n.projectId = projSel.value; n.folderId = folderSel.value || ""; n.updatedAt = Date.now(); } });
      status.textContent = "Enregistré"; countWords();
    }
    function touch() { dirty = true; status.textContent = "Enregistrement…"; clearTimeout(timer); timer = setTimeout(persist, 700); countWords(); }
    titleIn.addEventListener("input", touch); folderSel.addEventListener("change", () => { touch(); persist(); });
    projSel.addEventListener("change", () => { folderSel.replaceChildren(...folderOptions(projSel.value).map(([v, l]) => h("option", { value: v }, l))); folderSel.value = ""; touch(); persist(); });
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
    const origBtn = note.file ? U.btn("Original (" + (note.file.name.split(".").pop() || "fichier").toLowerCase() + ")", { icon: "download", sm: true, onClick: async () => { const b = await HQ.files.get(note.id); if (!b) { U.toast("L'original n'est pas disponible sur cet appareil (les fichiers ne sont pas synchronisés).", "bad"); return; } downloadBlob(b, note.file.name); } }) : null;
    const actions = h("div.head-actions.page-actions-scroll", { style: "gap:8px" }, srcBtn, origBtn, U.btn("Exporter .md", { icon: "download", sm: true, onClick: exportMd }), U.btn("Copier le Markdown", { icon: "copy", sm: true, onClick: () => { persist(); U.copy(db.notes.find((x) => x.id === note.id).md, "Markdown copié"); } }), U.btn("PDF", { icon: "print", sm: true, onClick: printDoc }),
      U.btn("Dupliquer", { sm: true, onClick: () => { persist(); const n = db.notes.find((x) => x.id === note.id); const id = createNote({ title: n.title + " (copie)", projectId: n.projectId, folderId: n.folderId, md: n.md }); HQ.go("/projects/doc/" + id); } }),
      U.btn("Supprimer", { kind: "danger", sm: true, icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer ce document ?", text: note.title, ok: "Supprimer", danger: true })) { dirty = false; clearTimeout(timer); HQ.files.remove(note.id); store.mutate((d) => { d.notes = d.notes.filter((x) => x.id !== note.id); }); back(); } } }));

    root.append(h("div.page-head", { style: "margin-bottom:14px" }, h("div", { style: "flex:1;min-width:0" }, h("button.back", { type: "button", onclick: () => { persist(); back(); } }, icon("chevL"), "Documents"), h("div", { style: "margin-top:10px" }, titleIn))),
      h("div.toolbar", { style: "margin-bottom:12px" }, h("div", { style: "min-width:180px;flex:1" }, projSel), h("div", { style: "min-width:180px;flex:1" }, folderSel), status, words), actions,
      h("div.rte-wrap", { style: "margin-top:14px" }, bar, tableBar, h("div.rte-page", ed, src)));
    countWords(); syncBar();
    if (!note.md) setTimeout(() => ed.focus(), 50);
    return () => { document.removeEventListener("selectionchange", onSel); persist(); HQ.holdRefresh = false; };
  };
})();
