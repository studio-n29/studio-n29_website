/* Projects & tasks: kanban board, quick add, project overview. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, store = HQ.store;
  HQ.views = HQ.views || {};

  const COLS = [["todo", "À faire"], ["doing", "En cours"], ["review", "En revue"], ["done", "Terminé"]];
  const PRIO = [["low", "Basse"], ["med", "Normale"], ["high", "Haute"], ["urgent", "Urgente"]];
  const PRIO_W = { urgent: 0, high: 1, med: 2, low: 3 };
  const PSTATUS = [["active", "Actif"], ["paused", "En pause"], ["done", "Terminé"]];
  const COLORS = ["#8a5cff", "#5cc8ff", "#3ddc84", "#ffb454", "#ff6b6b", "#ff6ac1", "#dcdce6"];

  const today = U.today;
  const isLate = (t) => t.due && t.status !== "done" && t.due < today();

  // ---------- Task sheet ----------
  function openTask(id, defaults) {
    const db = store.db();
    const t = id ? db.tasks.find((x) => x.id === id) : null;
    const v = Object.assign({ title: "", notes: "", projectId: "", status: "todo", priority: "med", due: "", estimateH: "" }, defaults || {}, t || {});
    const f = {
      title: U.input({ value: v.title, maxlength: 140 }),
      projectId: U.select([["", "— sans projet —"], ...db.projects.filter((p) => p.status !== "done" || p.id === v.projectId).map((p) => [p.id, p.name])], v.projectId),
      status: U.select(COLS, v.status), priority: U.select(PRIO, v.priority),
      due: U.input({ type: "date", value: v.due }), estimateH: U.input({ value: v.estimateH, inputmode: "decimal", placeholder: "ex. 3,5" }),
      notes: U.textarea({ rows: 4, value: v.notes }),
    };
    const quick = h("div.pill-row", [["Aujourd'hui", 0], ["Demain", 1], ["+ 1 semaine", 7]].map(([l, n]) => h("button.chip", { type: "button", onclick: () => { f.due.value = U.addDays(today(), n); } }, l)), h("button.chip", { type: "button", onclick: () => { f.due.value = ""; } }, "Aucune"));
    const err = h("p.ferr", { role: "alert" });
    const s = U.sheet({ title: t ? "Modifier la tâche" : "Nouvelle tâche", body: h("form.form", {
      onsubmit: (e) => {
        e.preventDefault();
        const o = { title: f.title.value.trim(), projectId: f.projectId.value, status: f.status.value, priority: f.priority.value, due: f.due.value, estimateH: f.estimateH.value.trim(), notes: f.notes.value.trim() };
        if (!o.title) { err.textContent = "Donnez un titre à la tâche."; f.title.focus(); return; }
        store.mutate((d) => {
          if (t) { const x = d.tasks.find((k) => k.id === id); if (x.status !== "done" && o.status === "done") x.doneAt = Date.now(); if (o.status !== "done") x.doneAt = null; Object.assign(x, o); }
          else d.tasks.push(Object.assign({ id: U.uid(), createdAt: Date.now(), doneAt: o.status === "done" ? Date.now() : null }, o));
        });
        s.close(true); U.toast(t ? "Tâche mise à jour" : "Tâche ajoutée", "ok"); HQ.rerender && HQ.rerender();
      },
    },
      field("Titre", f.title, { req: true }), h("div.r2", field("Projet", f.projectId), field("Statut", f.status)),
      h("div.r2", field("Priorité", f.priority), field("Estimation (heures)", f.estimateH)), field("Échéance", f.due), quick,
      field("Notes", f.notes), err,
      h("div.form-actions", t ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer cette tâche ?", text: v.title, ok: "Supprimer", danger: true })) { store.mutate((d) => { d.tasks = d.tasks.filter((k) => k.id !== id); }); s.close(true); HQ.rerender && HQ.rerender(); } } }) : null, U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
  }

  // ---------- Project sheet ----------
  function openProject(id) {
    const db = store.db();
    const p = id ? db.projects.find((x) => x.id === id) : null;
    const v = Object.assign({ name: "", color: COLORS[0], status: "active", clientId: "", description: "", url: "", deadline: "" }, p || {});
    const f = {
      name: U.input({ value: v.name, maxlength: 80 }), status: U.select(PSTATUS, v.status),
      clientId: U.select([["", "— aucun —"], ...db.clients.map((c) => [c.id, c.name])], v.clientId),
      deadline: U.input({ type: "date", value: v.deadline }), rate: U.input({ value: v.rate ? String(v.rate / 100).replace(".", ",") : "", inputmode: "decimal", placeholder: "Taux par défaut" }), url: U.input({ type: "url", value: v.url, placeholder: "https://… (dépôt, GDD, Notion)" }),
      description: U.textarea({ rows: 3, value: v.description }),
    };
    let color = v.color;
    const sw = h("div.pill-row", COLORS.map((c) => { const b = h("button", { type: "button", "aria-label": c, "aria-pressed": String(c === color), style: `width:34px;height:34px;border:2px solid ${c === color ? "var(--ink)" : "transparent"};background:${c};cursor:pointer`, onclick: () => { color = c; sw.querySelectorAll("button").forEach((x) => { x.style.borderColor = x === b ? "var(--ink)" : "transparent"; }); } }); return b; }));
    const err = h("p.ferr", { role: "alert" });
    const s = U.sheet({ title: p ? "Modifier le projet" : "Nouveau projet", body: h("form.form", {
      onsubmit: (e) => {
        e.preventDefault();
        const o = { name: f.name.value.trim(), status: f.status.value, clientId: f.clientId.value, deadline: f.deadline.value, rate: U.parseMoney(f.rate.value), url: f.url.value.trim(), description: f.description.value.trim(), color };
        if (!o.name) { err.textContent = "Donnez un nom au projet."; f.name.focus(); return; }
        let sid = id;
        store.mutate((d) => { if (p) Object.assign(d.projects.find((x) => x.id === id), o); else { sid = U.uid(); d.projects.push(Object.assign({ id: sid, createdAt: Date.now() }, o)); } });
        s.close(true); U.toast(p ? "Projet mis à jour" : "Projet créé", "ok"); HQ.go("/projects?p=" + sid);
      },
    }, field("Nom", f.name, { req: true }), h("div.r2", field("Statut", f.status), field("Client", f.clientId)), h("div.r2", field("Échéance", f.deadline), field("Taux horaire HT (€/h)", f.rate)), field("Lien", f.url), field("Description", f.description), h("div.field", h("span.lbl", "Couleur"), sw), err,
      h("div.form-actions", p ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: async () => { const n = db.tasks.filter((t) => t.projectId === id).length; if (await U.confirm({ title: "Supprimer ce projet ?", text: `${v.name}${n ? ` — ses ${n} tâche(s) seront aussi supprimées.` : ""}`, ok: "Supprimer", danger: true })) { store.mutate((d) => { d.projects = d.projects.filter((x) => x.id !== id); d.tasks = d.tasks.filter((t) => t.projectId !== id); }); s.close(true); HQ.go("/projects"); } } }) : null, U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
  }
  HQ.tasks = { openTask, openProject };

  // ---------- View ----------
  HQ.views.projects = function (root, ctx) {
    HQ.rerender = ctx.rerender;
    const db = store.db();
    let pf = ctx.query.p || sessionStorage.getItem("n29hq.pf") || "all";
    if (pf !== "all" && pf !== "none" && !db.projects.some((p) => p.id === pf)) pf = "all";
    let q = "";
    const setPf = (v) => { pf = v; try { sessionStorage.setItem("n29hq.pf", v); } catch (e) { /* ignore */ } draw(); };

    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Production"), h("h1", "Projets & tâches")), h("div.head-actions", U.btn("Projet", { icon: "folder", onClick: () => openProject(null) }), U.btn("Tâche", { kind: "accent", icon: "plus", onClick: () => openTask(null, { projectId: pf !== "all" && pf !== "none" ? pf : "" }) }))));
    const chips = h("div.seg", { style: "margin-bottom:14px" });
    const overview = h("div");
    const quickIn = U.input({ placeholder: "Ajouter une tâche rapidement… (Entrée)", "aria-label": "Ajouter une tâche rapidement", enterkeyhint: "done" });
    const search = U.input({ type: "search", placeholder: "Rechercher…" });
    const board = h("div.kanban");
    root.append(chips, overview, h("div.toolbar", h("div.search", icon("search"), search), h("div", { style: "flex:2 1 280px" }, quickIn)), board);

    quickIn.addEventListener("keydown", (e) => {
      if (e.key !== "Enter" || !quickIn.value.trim()) return;
      store.mutate((d) => { d.tasks.push({ id: U.uid(), title: quickIn.value.trim(), notes: "", projectId: pf !== "all" && pf !== "none" ? pf : "", status: "todo", priority: "med", due: "", estimateH: "", createdAt: Date.now(), doneAt: null }); });
      quickIn.value = ""; draw(); U.toast("Tâche ajoutée", "ok");
    });
    search.addEventListener("input", () => { q = search.value; drawBoard(); });

    function drawChips() {
      chips.replaceChildren();
      const open = (id) => db.tasks.filter((t) => t.status !== "done" && (id === "all" || (id === "none" ? !t.projectId : t.projectId === id))).length;
      const mk = (id, label, color) => h("button", { type: "button", "aria-pressed": String(pf === id), onclick: () => setPf(id) }, color ? h("span.dot", { style: `--c:${color};margin-right:8px` }) : null, `${label} · ${open(id)}`);
      chips.append(mk("all", "Tous"), ...db.projects.filter((p) => p.status !== "done" || pf === p.id).map((p) => mk(p.id, p.name, p.color)), mk("none", "Sans projet"));
    }
    function drawOverview() {
      overview.replaceChildren();
      const p = db.projects.find((x) => x.id === pf);
      if (!p) return;
      const ts = db.tasks.filter((t) => t.projectId === p.id), done = ts.filter((t) => t.status === "done").length, pct = ts.length ? Math.round((done / ts.length) * 100) : 0;
      const client = db.clients.find((c) => c.id === p.clientId);
      overview.appendChild(h("div.card", { style: "margin-bottom:14px;border-left:3px solid " + p.color },
        h("div", { style: "display:flex;justify-content:space-between;gap:12px;align-items:start;flex-wrap:wrap" },
          h("div", h("div", { style: "display:flex;gap:10px;align-items:center;flex-wrap:wrap" }, h("h2", { style: "margin:0" }, p.name), h("span.badge" + (p.status === "active" ? ".ok" : p.status === "paused" ? ".warn" : ""), PSTATUS.find((s) => s[0] === p.status)[1])),
            h("p.row-s", { style: "margin-top:6px" }, [client && client.name, p.deadline && "Échéance " + U.fmtDate(p.deadline)].filter(Boolean).join(" · ") || "Aucune échéance")),
          h("div", { style: "display:flex;gap:8px" }, p.url ? h("a.icon-btn", { href: p.url, target: "_blank", rel: "noopener noreferrer", "aria-label": "Ouvrir le lien", title: "Ouvrir le lien" }, icon("external")) : null, U.iconBtn("edit", "Modifier le projet", () => openProject(p.id)))),
        p.description ? h("p.muted", { style: "margin:12px 0;font-size:.92rem" }, p.description) : null,
        h("div", { style: "display:flex;align-items:center;gap:12px;margin-top:12px" }, h("div.meter", { style: "flex:1" }, h("i", { style: `transform:scaleX(${pct / 100})` })), h("span.mono.muted", { style: "font-size:.78rem" }, `${done}/${ts.length} · ${pct} %`))));
    }
    function card(t) {
      const p = db.projects.find((x) => x.id === t.projectId);
      const idx = COLS.findIndex((c) => c[0] === t.status);
      const move = (dir) => (e) => { e.stopPropagation(); store.mutate((d) => { const x = d.tasks.find((k) => k.id === t.id); x.status = COLS[idx + dir][0]; x.doneAt = x.status === "done" ? Date.now() : null; }); draw(); };
      const el = h("div.task" + (t.status === "done" ? ".done" : ""), { role: "button", tabindex: "0", draggable: "true", dataset: { p: t.priority, id: t.id }, onclick: () => openTask(t.id), onkeydown: (e) => { if (e.key === "Enter") openTask(t.id); } },
        h("b", t.title),
        h("div.meta", p && pf === "all" ? h("span", { style: "display:inline-flex;gap:6px;align-items:center" }, h("span.dot", { style: `--c:${p.color}` }), p.name) : null,
          t.due ? h("span.badge" + (isLate(t) ? ".bad" : t.due === today() ? ".warn" : ""), icon("calendar", ""), U.fmtDate(t.due)) : null,
          t.priority === "urgent" || t.priority === "high" ? h("span.badge" + (t.priority === "urgent" ? ".bad" : ".warn"), t.priority === "urgent" ? "Urgente" : "Haute") : null,
          t.estimateH ? h("span", `${t.estimateH} h`) : null),
        h("div.mv", idx > 0 ? h("button.icon-btn", { type: "button", style: "width:34px;height:34px", "aria-label": "Colonne précédente", onclick: move(-1) }, icon("chevL")) : null, idx < COLS.length - 1 ? h("button.icon-btn", { type: "button", style: "width:34px;height:34px", "aria-label": "Colonne suivante", onclick: move(1) }, icon("chevR")) : null));
      el.addEventListener("dragstart", (e) => { e.dataTransfer.setData("text/plain", t.id); e.dataTransfer.effectAllowed = "move"; });
      return el;
    }
    function drawBoard() {
      board.replaceChildren();
      const nq = U.norm(q);
      const mine = db.tasks.filter((t) => (pf === "all" || (pf === "none" ? !t.projectId : t.projectId === pf)) && (!nq || U.norm(t.title + " " + t.notes).includes(nq)));
      COLS.forEach(([id, label]) => {
        let items = mine.filter((t) => t.status === id);
        items = id === "done" ? items.sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0)).slice(0, 15) : items.sort((a, b) => PRIO_W[a.priority] - PRIO_W[b.priority] || (a.due || "9").localeCompare(b.due || "9"));
        const col = h("div.kcol", { dataset: { s: id } }, h("div.kcol-h", label, h("span", String(mine.filter((t) => t.status === id).length))), h("div.kcol-b", items.length ? items.map(card) : h("div.hint", { style: "padding:8px 4px;text-align:center" }, "—")));
        col.addEventListener("dragover", (e) => { e.preventDefault(); col.style.borderColor = "var(--accent)"; });
        col.addEventListener("dragleave", () => { col.style.borderColor = ""; });
        col.addEventListener("drop", (e) => { e.preventDefault(); col.style.borderColor = ""; const tid = e.dataTransfer.getData("text/plain"); store.mutate((d) => { const x = d.tasks.find((k) => k.id === tid); if (x && x.status !== id) { x.status = id; x.doneAt = id === "done" ? Date.now() : null; } }); draw(); });
        board.appendChild(col);
      });
    }
    function draw() { drawChips(); drawOverview(); drawBoard(); }
    draw();
  };
})();
