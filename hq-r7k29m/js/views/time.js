/* Time tracking (Toggl-style): timer, calendar (month / week), entry sheet, reports, CSV/PDF export, invoice from hours. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, esc = U.esc, store = HQ.store, TU = HQ.timeutil, L = HQ.legal;
  HQ.views = HQ.views || {};

  const pad = (n) => String(n).padStart(2, "0");
  const DOW = ["L", "M", "M", "J", "V", "S", "D"];
  const dateObj = (iso) => new Date(iso + "T12:00:00");
  const longDate = (iso) => dateObj(iso).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  const shortDate = (iso) => dateObj(iso).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" }).replace(".", "");
  const monthLabel = (y, m) => new Date(y, m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
  const ctxOf = (db) => ({ projects: db.projects, tasks: db.tasks, clients: db.clients, billing: db.settings.billing });
  const durInput = (min) => { const hh = Math.floor(min / 60), m = min % 60; return hh && m ? `${hh}h${pad(m)}` : hh ? `${hh}h` : `${m}m`; };
  const entryTitle = (db, e) => { const t = db.tasks.find((x) => x.id === e.taskId); return e.description || (t && t.title) || (db.projects.find((p) => p.id === e.projectId) || {}).name || "Temps"; };

  // ---------- Entry sheet ----------
  function openEntry(id, defaults, done) {
    const db = store.db(), e0 = id ? db.timeEntries.find((x) => x.id === id) : null;
    const v = Object.assign({ date: U.today(), start: "", minutes: 0, projectId: "", taskId: "", description: "", billable: true }, defaults || {}, e0 || {});
    const f = {
      date: U.input({ type: "date", value: v.date }), start: U.input({ type: "time", value: v.start }), end: U.input({ type: "time", value: v.start && v.minutes ? TU.endTime(v) : "" }),
      dur: U.input({ value: v.minutes ? durInput(v.minutes) : "", placeholder: "1h30, 45m, 1:30, 1,5", inputmode: "text", autocapitalize: "off" }),
      project: U.select([["", "— sans projet —"], ...db.projects.filter((p) => p.status !== "done" || p.id === v.projectId).map((p) => [p.id, p.name])], v.projectId),
      task: h("select"), description: U.input({ value: v.description, placeholder: "Sur quoi avez-vous travaillé ?", maxlength: 200 }), billable: h("input", { type: "checkbox", checked: !!v.billable }),
    };
    const fillTasks = (keep) => { f.task.replaceChildren(h("option", { value: "" }, "— aucune —"), ...db.tasks.filter((t) => t.projectId === f.project.value && (t.status !== "done" || t.id === keep)).map((t) => h("option", { value: t.id }, t.title))); f.task.value = keep || ""; };
    fillTasks(v.taskId);
    f.project.addEventListener("change", () => fillTasks(""));
    const hint = h("span.hint");
    const fromTimes = () => { const a = TU.timeToMin(f.start.value), b = TU.timeToMin(f.end.value); if (a != null && b != null && a !== b) { f.dur.value = durInput((b - a + 1440) % 1440); } };
    const fromDur = () => { const m = TU.parseDuration(f.dur.value), a = TU.timeToMin(f.start.value); hint.textContent = m ? `= ${TU.fmtDuration(m)} (${TU.fmtHours(m)})` : f.dur.value ? "Durée non reconnue" : ""; if (m && a != null) f.end.value = TU.minToTime(a + m); };
    f.start.addEventListener("input", () => { if (f.end.value) fromTimes(); else fromDur(); fromDur(); });
    f.end.addEventListener("input", () => { fromTimes(); fromDur(); });
    f.dur.addEventListener("input", fromDur);
    fromDur();
    const chips = h("div.pill-row", [30, 60, 90, 120, 240, 420].map((m) => h("button.chip", { type: "button", onclick: () => { f.dur.value = durInput(m); fromDur(); } }, TU.fmtDuration(m))));
    const err = h("p.ferr", { role: "alert" });
    const finish = () => { s.close(true); if (done) done(); else HQ.rerender && HQ.rerender(); };
    const s = U.sheet({ title: e0 ? "Modifier le temps" : "Saisir du temps", body: h("form.form", { onsubmit: (ev) => {
      ev.preventDefault(); err.textContent = "";
      const minutes = TU.parseDuration(f.dur.value);
      if (!f.date.value) { err.textContent = "Choisissez une date."; return; }
      if (!minutes || minutes <= 0) { err.textContent = "Indiquez une durée (ex. 1h30, 45m, 1:30)."; f.dur.focus(); return; }
      if (minutes > 1440) { err.textContent = "Une saisie ne peut pas dépasser 24 h."; return; }
      const o = { date: f.date.value, start: f.start.value || "", minutes, projectId: f.project.value, taskId: f.task.value, description: f.description.value.trim(), billable: f.billable.checked };
      store.mutate((d) => { if (e0) Object.assign(d.timeEntries.find((x) => x.id === id), o); else d.timeEntries.push(Object.assign({ id: U.uid(), createdAt: Date.now() }, o)); });
      U.toast(e0 ? "Temps mis à jour" : "Temps enregistré", "ok"); finish();
    } },
      field("Description", f.description), h("div.r2", field("Projet", f.project), field("Tâche", f.task)),
      h("div.dte", field("Date", f.date, { req: true }), field("Début", f.start), field("Fin", f.end)),
      field("Durée", f.dur, { req: true }), hint, chips,
      h("label.check", f.billable, "Facturable"), err,
      h("div.form-actions", e0 ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: async () => { if (await U.confirm({ title: "Supprimer cette saisie ?", text: `${entryTitle(db, e0)} — ${TU.fmtDuration(e0.minutes)}`, ok: "Supprimer", danger: true })) { store.mutate((d) => { d.timeEntries = d.timeEntries.filter((x) => x.id !== id); }); finish(); } } }) : null,
        e0 ? U.btn("Dupliquer", { icon: "copy", onClick: () => { s.close(true); openEntry(null, { date: e0.date, start: "", minutes: e0.minutes, projectId: e0.projectId, taskId: e0.taskId, description: e0.description, billable: e0.billable }, done); } }) : null,
        U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
  }

  // ---------- Timer ----------
  function stopTimer() {
    const t = store.db().timer; if (!t) return null;
    const mins = Math.min(1440, Math.max(1, Math.round((Date.now() - t.startedAt) / 60000))), st = new Date(t.startedAt);
    const entry = { id: U.uid(), createdAt: Date.now(), date: U.isoDate(st), start: `${pad(st.getHours())}:${pad(st.getMinutes())}`, minutes: mins, projectId: t.projectId, taskId: t.taskId, description: t.description, billable: t.billable !== false };
    store.mutate((d) => { d.timeEntries.push(entry); d.timer = null; });
    return entry;
  }
  HQ.timer = { stop: stopTimer };

  // ---------- Invoice from hours ----------
  function invoiceFromHours(entries) {
    const db = store.db(), bl = db.settings.billing, ctx = ctxOf(db);
    const todo = entries.filter((e) => e.billable && !TU.isBilled(e, db.documents));
    if (!todo.length) { U.toast("Aucune heure facturable à facturer dans cette sélection.", "bad"); return; }
    const P = new Map(db.projects.map((p) => [p.id, p]));
    const counts = {}; todo.forEach((e) => { const c = (P.get(e.projectId) || {}).clientId; if (c) counts[c] = (counts[c] || 0) + e.minutes; });
    const best = Object.keys(counts).sort((a, b) => counts[b] - counts[a])[0] || "";
    const sel = U.select([["", "— choisir un client —"], ...db.clients.map((c) => [c.id, c.name])], best), err = h("p.ferr", { role: "alert" });
    const tot = TU.summary(todo, ctx), noRate = todo.filter((e) => !TU.hourlyRate(e, P.get(e.projectId), bl)).length;
    const s = U.sheet({ title: "Facturer les heures", body: h("form.form", { onsubmit: (ev) => {
      ev.preventDefault();
      if (!sel.value) { err.textContent = "Choisissez le client à facturer."; return; }
      const groups = new Map();
      todo.forEach((e) => { const p = P.get(e.projectId), rate = TU.hourlyRate(e, p, bl), key = (e.projectId || "") + "|" + rate; const g = groups.get(key) || { p, rate, minutes: 0 }; g.minutes += e.minutes; groups.set(key, g); });
      const dates = todo.map((e) => e.date).sort(), from = dates[0], to = dates[dates.length - 1];
      const doc = HQ.docs.newDraft("invoice", db, { client: sel.value });
      doc.lines = [...groups.values()].map((g) => ({ id: U.uid(), desc: `${g.p ? g.p.name : "Prestation"} — ${TU.fmtDuration(g.minutes)} de développement (du ${U.fmtDate(from)} au ${U.fmtDate(to)})`, qty: Math.round((g.minutes / 60) * 100) / 100, unit: g.rate, unitLabel: "heure", discount: 0, vat: bl.defaultVat }));
      doc.serviceDate = to; doc.timeEntryIds = todo.map((e) => e.id);
      store.mutate((d) => { d.documents.push(doc); todo.forEach((e) => { d.timeEntries.find((x) => x.id === e.id).docId = doc.id; }); store.audit("time.invoice", `${todo.length} saisies → brouillon de facture`); });
      s.close(true); U.toast("Brouillon de facture créé", "ok"); HQ.go("/docs/" + doc.id);
    } }, h("dl.kv", h("dt", "Saisies facturables non facturées"), h("dd", String(todo.length)), h("dt", "Temps"), h("dd", `${TU.fmtDuration(tot.minutes)} (${TU.fmtHours(tot.minutes)})`), h("dt", "Montant HT estimé"), h("dd", U.eur(tot.amount))),
      noRate ? h("div.banner.warn", `${noRate} saisie(s) sans taux horaire : renseignez un taux sur le projet ou dans Réglages ▸ Facturation, ou ajustez les prix dans le brouillon.`) : null,
      field("Client", sel, { req: true }), h("p.hint", "Les saisies utilisées sont marquées « facturées » et ne seront pas reprises dans une prochaine facture. Si vous supprimez le brouillon, elles redeviennent disponibles."), err,
      h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Créer le brouillon", { kind: "accent", type: "submit", icon: "doc" }))) });
  }

  // ---------- View ----------
  HQ.views.time = function (root, ctx) {
    HQ.rerender = ctx.rerender;
    const db = store.db(), today = U.today();
    let tab = ctx.query.tab || "calendar";
    const cal = { mode: "month", cursor: today, selected: today };
    const rep = { preset: "month", from: TU.rangeFor("month", today).from, to: TU.rangeFor("month", today).to, projects: null, billable: "all", billed: "all", by: "project" };
    let clockTimer = null;
    const redraw = () => { drawTimer(); (tab === "calendar" ? drawCalendar : drawReport)(); };

    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Suivi"), h("h1", "Temps")), h("div.head-actions", U.btn("Saisir du temps", { kind: "accent", icon: "plus", onClick: () => openEntry(null, { date: tab === "calendar" ? cal.selected : today }, redraw) }))));
    const timerBox = h("div.card", { style: "margin-bottom:14px" });
    const tabs = h("div.tabs-inline", { role: "tablist" }), body = h("div");
    root.append(timerBox, tabs, body);

    // ----- timer card -----
    function drawTimer() {
      clearInterval(clockTimer);
      const t = store.db().timer, d = store.db();
      const proj = U.select([["", "— sans projet —"], ...d.projects.filter((p) => p.status !== "done" || (t && p.id === t.projectId)).map((p) => [p.id, p.name])], t ? t.projectId : sessionStorage.getItem("n29hq.tproj") || "");
      const desc = U.input({ placeholder: "Sur quoi travaillez-vous ?", value: t ? t.description : "", maxlength: 200, "aria-label": "Description" });
      const bill = h("input", { type: "checkbox", checked: t ? t.billable !== false : true });
      if (t) {
        const clock = h("div.timer-clock", "0:00:00");
        const tick = () => { const s = Math.floor((Date.now() - t.startedAt) / 1000); clock.textContent = `${Math.floor(s / 3600)}:${pad(Math.floor(s / 60) % 60)}:${pad(s % 60)}`; };
        tick(); clockTimer = setInterval(tick, 1000);
        const upd = () => store.mutate((x) => { Object.assign(x.timer, { projectId: proj.value, description: desc.value.trim(), billable: bill.checked }); });
        desc.addEventListener("change", upd); proj.addEventListener("change", upd); bill.addEventListener("change", upd);
        U.set(timerBox, h("div.timer", h("div", { style: "display:flex;justify-content:space-between;align-items:center;gap:12px;flex-wrap:wrap" }, h("div", h("span.eyebrow", "Chronomètre en cours"), clock), h("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, U.btn("Arrêter", { kind: "accent", icon: "check", onClick: () => { upd(); const e = stopTimer(); U.toast(`${TU.fmtDuration(e.minutes)} enregistrées`, "ok"); redraw(); } }), U.btn("Annuler", { onClick: async () => { if (await U.confirm({ title: "Abandonner le chronomètre ?", text: "Le temps écoulé ne sera pas enregistré.", ok: "Abandonner", danger: true })) { store.mutate((x) => { x.timer = null; }); redraw(); } } }))), h("div.timer-row", desc, proj, h("label.check", bill, "Facturable"))));
      } else {
        U.set(timerBox, h("div.timer", h("div.eyebrow", "Chronomètre"), h("div.timer-row", desc, proj, h("label.check", bill, "Facturable"), U.btn("Démarrer", { kind: "accent", icon: "clock", onClick: () => { try { sessionStorage.setItem("n29hq.tproj", proj.value); } catch (e) { /* ignore */ } store.mutate((x) => { x.timer = { startedAt: Date.now(), projectId: proj.value, taskId: "", description: desc.value.trim(), billable: bill.checked }; }); drawTimer(); } }))));
      }
    }

    // ----- shared entry element -----
    function entryEl(e, opts = {}) {
      const d = store.db(), p = d.projects.find((x) => x.id === e.projectId), t = d.tasks.find((x) => x.id === e.taskId), billed = TU.isBilled(e, d.documents);
      const sub = [e.start ? `${e.start}–${TU.endTime(e)}` : null, p && p.name, t && t.title !== entryTitle(d, e) ? t.title : null].filter(Boolean).join(" · ");
      return h("button.entry", { type: "button", style: `--c:${p ? p.color : "var(--faint)"}`, onclick: () => openEntry(e.id, null, redraw) },
        h("div", { style: "display:flex;justify-content:space-between;gap:10px;align-items:start" }, h("b", { style: "font-weight:600;overflow-wrap:anywhere" }, entryTitle(d, e)), h("span.mono", { style: "white-space:nowrap;font-size:.85rem" }, TU.fmtDuration(e.minutes))),
        sub ? h("span.hint", sub) : null,
        h("div", { style: "display:flex;gap:6px;flex-wrap:wrap" }, e.billable ? h("span.badge.acc", "Facturable") : h("span.badge", "Non facturable"), billed ? h("span.badge.ok", "Facturé") : null));
    }
    const dayEntries = (iso) => store.db().timeEntries.filter((e) => e.date === iso).sort((a, b) => (a.start || "99").localeCompare(b.start || "99") || a.createdAt - b.createdAt);
    const dayMinutes = (iso) => dayEntries(iso).reduce((s, e) => s + e.minutes, 0);

    // ----- calendar -----
    function drawCalendar() {
      const cur = dateObj(cal.cursor), y = cur.getFullYear(), m = cur.getMonth();
      const weekFrom = TU.weekStart(cal.cursor), weekTo = TU.addDays(weekFrom, 6);
      const range = cal.mode === "month" ? { from: TU.monthStart(cal.cursor), to: TU.monthEnd(cal.cursor) } : { from: weekFrom, to: weekTo };
      const total = store.db().timeEntries.filter((e) => e.date >= range.from && e.date <= range.to).reduce((s, e) => s + e.minutes, 0);
      const move = (dir) => { cal.cursor = cal.mode === "month" ? U.isoDate(new Date(y, m + dir, 1)) : TU.addDays(cal.cursor, 7 * dir); if (cal.mode === "month") cal.selected = cal.cursor; drawCalendar(); };
      const label = cal.mode === "month" ? monthLabel(y, m) : `${dateObj(weekFrom).getDate()} – ${dateObj(weekTo).toLocaleDateString("fr-FR", { day: "numeric", month: "long" })}`;
      const bar = h("div.cal-head", h("div", { style: "display:flex;gap:6px;align-items:center" }, U.iconBtn("chevL", "Précédent", () => move(-1)), U.iconBtn("chevR", "Suivant", () => move(1)), h("b", { style: "font-size:1.1rem;text-transform:capitalize;margin-left:6px" }, label)),
        h("div", { style: "display:flex;gap:8px;align-items:center;flex-wrap:wrap" }, h("span.badge.acc", `Total ${TU.fmtDuration(total)}`), U.btn("Aujourd'hui", { sm: true, onClick: () => { cal.cursor = today; cal.selected = today; drawCalendar(); } }),
          h("div.seg", [["month", "Mois"], ["week", "Semaine"]].map(([k, l]) => h("button", { type: "button", "aria-pressed": String(cal.mode === k), onclick: () => { cal.mode = k; drawCalendar(); } }, l)))));
      body.replaceChildren(bar);
      if (cal.mode === "month") {
        const grid = h("div.cal", DOW.map((x) => h("div.dow", x)));
        TU.monthMatrix(y, m).flat().forEach((iso) => {
          const es = dayEntries(iso), mins = es.reduce((s, e) => s + e.minutes, 0), colors = [...new Set(es.map((e) => (store.db().projects.find((p) => p.id === e.projectId) || {}).color || "#8f8d99"))].slice(0, 4);
          grid.appendChild(h("button.day" + (iso.slice(0, 7) !== cal.cursor.slice(0, 7) ? ".out" : "") + (iso === today ? ".today" : "") + (iso === cal.selected ? ".sel" : ""), { type: "button", "aria-label": longDate(iso) + (mins ? ", " + TU.fmtDuration(mins) : ""), onclick: () => { cal.selected = iso; if (iso.slice(0, 7) !== cal.cursor.slice(0, 7)) cal.cursor = iso; drawCalendar(); if (matchMedia("(max-width: 1099px)").matches) { const pn = body.querySelector(".daypanel"); if (pn) pn.scrollIntoView({ behavior: "smooth", block: "nearest" }); } } },
            h("span.n", String(dateObj(iso).getDate())), mins ? h("span.h", TU.fmtClock(mins)) : null, colors.length ? h("span.dots", colors.map((c) => h("span.dot", { style: `--c:${c}` }))) : null));
        });
        const panel = h("div.card.daypanel");
        const es = dayEntries(cal.selected), mins = dayMinutes(cal.selected);
        panel.append(h("h2", { style: "text-transform:capitalize" }, longDate(cal.selected), h("small", mins ? TU.fmtDuration(mins) : "")),
          es.length ? h("div.stack", { style: "gap:8px" }, es.map((e) => entryEl(e))) : h("div.empty", "Aucun temps saisi ce jour."),
          h("div", { style: "margin-top:12px" }, U.btn("Ajouter du temps", { icon: "plus", kind: "accent", sm: true, onClick: () => openEntry(null, { date: cal.selected }, redraw) })));
        body.appendChild(h("div.calwrap", grid, panel));
      } else {
        const week = h("div.week");
        TU.eachDay(weekFrom, weekTo).forEach((iso) => {
          const es = dayEntries(iso), mins = dayMinutes(iso);
          week.appendChild(h("div.wday" + (iso === today ? ".today" : ""), h("div.wday-h", h("div", h("b", { style: "text-transform:capitalize" }, shortDate(iso))), h("span.mono", { style: "font-size:.78rem;color:var(--muted)" }, mins ? TU.fmtDuration(mins) : "—"), U.iconBtn("plus", "Ajouter du temps le " + longDate(iso), () => openEntry(null, { date: iso }, redraw))), h("div.stack", { style: "gap:8px;padding:10px" }, es.map((e) => entryEl(e)))));
        });
        body.appendChild(week);
      }
    }

    // ----- report -----
    const filters = () => ({ from: rep.from, to: rep.to, projects: rep.projects, billable: rep.billable, billed: rep.billed });
    function reportData() {
      const d = store.db(), c = ctxOf(d), entries = TU.filter(d.timeEntries, filters(), d.documents).sort((a, b) => (b.date + (b.start || "")).localeCompare(a.date + (a.start || "")));
      return { d, c, entries, sum: TU.summary(entries, c), groups: TU.aggregate(entries, c, rep.by) };
    }
    function drawReport() {
      const { d, c, entries, sum, groups } = reportData();
      const P = new Map(d.projects.map((p) => [p.id, p]));
      const presets = [["week", "Cette semaine"], ["lastweek", "Semaine dernière"], ["month", "Ce mois"], ["lastmonth", "Mois dernier"], ["30d", "30 jours"], ["year", "Cette année"]];
      const setPreset = (k) => { rep.preset = k; Object.assign(rep, TU.rangeFor(k, today)); drawReport(); };
      const from = U.input({ type: "date", value: rep.from, "aria-label": "Du" }), to = U.input({ type: "date", value: rep.to, "aria-label": "Au" });
      const onRange = () => { if (from.value && to.value && from.value <= to.value) { rep.preset = "custom"; rep.from = from.value; rep.to = to.value; drawReport(); } };
      from.addEventListener("change", onRange); to.addEventListener("change", onRange);
      const ids = ["", ...d.projects.map((p) => p.id)], isOn = (id) => !rep.projects || rep.projects.has(id);
      const toggleProject = (id) => { const s = new Set(rep.projects || ids); if (s.has(id)) s.delete(id); else s.add(id); rep.projects = s.size === ids.length ? null : s; drawReport(); };
      const projChips = h("div.pill-row", h("button.chip", { type: "button", style: !rep.projects ? "border-color:var(--accent);background:var(--accent-soft)" : "", onclick: () => { rep.projects = null; drawReport(); } }, "Tous"),
        [...d.projects.map((p) => [p.id, p.name, p.color]), ["", "Sans projet", "#8f8d99"]].map(([id, name, color]) => h("button.chip", { type: "button", "aria-pressed": String(isOn(id) && !!rep.projects), style: `display:inline-flex;align-items:center;gap:7px;${rep.projects && isOn(id) ? "border-color:var(--accent);background:var(--accent-soft)" : ""}${rep.projects && !isOn(id) ? "opacity:.5" : ""}`, onclick: () => toggleProject(id) }, h("span.dot", { style: `--c:${color}` }), name)));
      const seg = (cur, items, set) => h("div.seg", items.map(([k, l]) => h("button", { type: "button", "aria-pressed": String(cur === k), onclick: () => { set(k); drawReport(); } }, l)));

      const f = h("div.card", { style: "margin-bottom:14px" }, h("div.stack",
        h("div.pill-row", presets.map(([k, l]) => h("button.chip", { type: "button", style: rep.preset === k ? "border-color:var(--accent);background:var(--accent-soft)" : "", onclick: () => setPreset(k) }, l))),
        h("div.r2", field("Du", from), field("Au", to)), h("div.field", h("span.lbl", "Projets"), projChips),
        h("div", { style: "display:flex;gap:10px;flex-wrap:wrap" }, seg(rep.billable, [["all", "Tout"], ["yes", "Facturable"], ["no", "Non facturable"]], (k) => (rep.billable = k)), seg(rep.billed, [["all", "Facturé ou non"], ["todo", "À facturer"], ["done", "Déjà facturé"]], (k) => (rep.billed = k))),
        h("div.field", h("span.lbl", "Grouper par"), seg(rep.by, [["project", "Projet"], ["task", "Tâche"], ["day", "Jour"], ["client", "Client"]], (k) => (rep.by = k)))));

      // summary
      const avg = sum.days ? Math.round(sum.minutes / sum.days) : 0;
      const stats = h("div.grid.c4", { style: "margin-bottom:14px" },
        h("div.stat", h("small", "Temps total"), h("b", TU.fmtDuration(sum.minutes)), h("span", TU.fmtHours(sum.minutes))),
        h("div.stat", h("small", "Facturable"), h("b", TU.fmtDuration(sum.billableMinutes)), h("span", sum.minutes ? Math.round((sum.billableMinutes / sum.minutes) * 100) + " % du temps" : "—")),
        h("div.stat", h("small", "Montant estimé HT"), h("b", sum.amount ? U.eur(sum.amount) : "—"), h("span", sum.amount ? "au taux horaire" : "renseignez un taux")),
        h("div.stat", h("small", "Jours travaillés"), h("b", String(sum.days)), h("span", sum.days ? `${TU.fmtDuration(avg)} par jour` : "—")));

      // chart
      const days = TU.eachDay(rep.from, rep.to), weekly = days.length > 62, buckets = new Map();
      entries.forEach((e) => { const k = weekly ? TU.weekStart(e.date) : e.date; buckets.set(k, (buckets.get(k) || 0) + e.minutes); });
      const keys = weekly ? [...new Set(days.map(TU.weekStart))] : days, max = Math.max(1, ...keys.map((k) => buckets.get(k) || 0));
      const chart = h("div.card", { style: "margin-bottom:14px" }, h("h2", "Activité", h("small", weekly ? "par semaine" : "par jour")),
        h("div.bars", { role: "img", "aria-label": "Histogramme du temps travaillé" }, keys.map((k, i) => { const mins = buckets.get(k) || 0, dt = dateObj(k); return h("div.bar", { title: `${weekly ? "Semaine du " : ""}${U.fmtDate(k)} : ${TU.fmtDuration(mins)}`, style: `height:${Math.max(2, (mins / max) * 100)}%;${mins ? "" : "opacity:.25"}` }, keys.length <= 31 || i % 5 === 0 ? h("span", weekly ? `${pad(dt.getDate())}/${pad(dt.getMonth() + 1)}` : String(dt.getDate())) : null); })));

      // breakdown
      const lbl = (g) => (rep.by === "day" ? shortDate(g.key) : g.label);
      const breakdown = h("div.card", { style: "margin-bottom:14px" }, h("h2", "Répartition", h("small", { style: "text-transform:none" }, { project: "par projet", task: "par tâche", day: "par jour", client: "par client" }[rep.by])),
        groups.length ? h("div.list", groups.map((g) => h("div", { style: "padding:11px 0;border-bottom:1px solid var(--line);display:grid;gap:7px" }, h("div", { style: "display:flex;justify-content:space-between;gap:12px;align-items:center" }, h("span", { style: "display:inline-flex;gap:9px;align-items:center;font-weight:600;overflow-wrap:anywhere" }, h("span.dot", { style: `--c:${g.color}` }), lbl(g)), h("span.mono", { style: "white-space:nowrap;font-size:.85rem" }, `${TU.fmtDuration(g.minutes)}${g.amount ? " · " + U.eur(g.amount) : ""}`)), h("div.meter", h("i", { style: `transform:scaleX(${sum.minutes ? g.minutes / sum.minutes : 0});background:${g.color}` }))))) : h("div.empty", "Aucune saisie ne correspond à ces filtres."));

      // detail
      const billable = entries.filter((e) => e.billable && !TU.isBilled(e, d.documents));
      const detail = h("div.card", h("h2", "Détail des saisies", h("small", `${entries.length}`)), entries.length ? h("div.list", entries.slice(0, 200).map((e) => { const p = P.get(e.projectId), amt = TU.amount(e, p, d.settings.billing); return h("div.row", { role: "button", tabindex: "0", onclick: () => openEntry(e.id, null, redraw), onkeydown: (ev) => { if (ev.key === "Enter") openEntry(e.id, null, redraw); } }, h("div", h("div.row-t", entryTitle(d, e)), h("div.row-s", [U.fmtDate(e.date), e.start ? `${e.start}–${TU.endTime(e)}` : null, p && p.name, TU.isBilled(e, d.documents) ? "facturé" : e.billable ? null : "non facturable"].filter(Boolean).join(" · "))), h("div.row-r", h("b", TU.fmtDuration(e.minutes)), amt ? h("span.row-s", U.eur(amt)) : null)); })) : h("div.empty", "Rien à afficher."),
        entries.length > 200 ? h("p.hint", { style: "margin-top:10px" }, "200 premières saisies affichées. L'export CSV contient tout.") : null);

      const actions = h("div.head-actions", { style: "margin-bottom:14px" }, U.btn("Exporter en CSV", { icon: "download", onClick: () => exportCsv(entries, d) }), U.btn("Imprimer / PDF", { icon: "print", onClick: () => U.printHTML(reportHTML(d, rep, sum, groups, entries)) }), billable.length ? U.btn(`Facturer ${TU.fmtDuration(billable.reduce((s, e) => s + e.minutes, 0))}`, { kind: "accent", icon: "euro", onClick: () => invoiceFromHours(entries) }) : null);
      body.replaceChildren(f, actions, stats, chart, breakdown, detail);
    }
    function exportCsv(entries, d) {
      const P = new Map(d.projects.map((p) => [p.id, p])), C = new Map(d.clients.map((c) => [c.id, c])), K = new Map(d.tasks.map((t) => [t.id, t]));
      const rows = [["Date", "Début", "Fin", "Durée", "Heures", "Projet", "Client", "Tâche", "Description", "Facturable", "Taux (€/h)", "Montant (€)", "Facture"]];
      entries.slice().sort((a, b) => a.date.localeCompare(b.date) || (a.start || "").localeCompare(b.start || "")).forEach((e) => { const p = P.get(e.projectId), cl = p && C.get(p.clientId), doc = d.documents.find((x) => x.id === e.docId); rows.push([U.fmtDate(e.date), e.start || "", TU.endTime(e), TU.fmtClock(e.minutes), (e.minutes / 60).toFixed(2).replace(".", ","), p ? p.name : "", cl ? cl.name : "", (K.get(e.taskId) || {}).title || "", e.description, e.billable ? "oui" : "non", (TU.hourlyRate(e, p, d.settings.billing) / 100).toFixed(2).replace(".", ","), (TU.amount(e, p, d.settings.billing) / 100).toFixed(2).replace(".", ","), doc && doc.number ? doc.number : doc ? "brouillon" : ""]); });
      U.download(`temps-${rep.from}_${rep.to}.csv`, U.csv(rows), "text/csv");
    }
    show(tab);
    function show(t) { tab = t; tabs.replaceChildren(...[["calendar", "Calendrier"], ["report", "Rapport"]].map(([id, l]) => h("button", { role: "tab", "aria-selected": String(id === tab), onclick: () => { show(id); } }, l))); drawTimer(); (tab === "calendar" ? drawCalendar : drawReport)(); }
    return () => clearInterval(clockTimer);
  };

  // ---------- Printable report ----------
  function reportHTML(d, rep, sum, groups, entries) {
    const co = d.settings.company, P = new Map(d.projects.map((p) => [p.id, p]));
    const projNames = rep.projects ? d.projects.filter((p) => rep.projects.has(p.id)).map((p) => p.name).concat(rep.projects.has("") ? ["Sans projet"] : []).join(", ") : "Tous les projets";
    const lbl = (g) => (rep.by === "day" ? U.fmtDate(g.key) : g.label);
    return `<div class="paper"><div class="p-head"><div class="p-logo">${U.LOGO}<span>${esc((co.tradeName || "STUDIO N29").toUpperCase())}</span></div><div class="p-meta"><h1>RAPPORT D'ACTIVITÉ</h1><b>${esc(U.fmtDate(rep.from))} → ${esc(U.fmtDate(rep.to))}</b></div></div>
      <div class="p-parties" style="margin:22px 0 16px"><div class="p-box"><h4>Prestataire</h4><b>${esc(co.name || "")}</b><br>${esc([co.address, co.zip, co.city].filter(Boolean).join(", "))}</div><div class="p-box"><h4>Périmètre</h4>${esc(projNames)}<br>${esc({ all: "Facturable et non facturable", yes: "Facturable uniquement", no: "Non facturable uniquement" }[rep.billable])}</div></div>
      <table><tbody><tr><td><b>Temps total</b></td><td class="n">${esc(TU.fmtDuration(sum.minutes))} (${esc(TU.fmtHours(sum.minutes))})</td><td><b>Facturable</b></td><td class="n">${esc(TU.fmtDuration(sum.billableMinutes))}</td><td><b>Jours</b></td><td class="n">${sum.days}</td>${sum.amount ? `<td><b>Montant HT</b></td><td class="n">${U.num(sum.amount)} €</td>` : ""}</tr></tbody></table>
      <h4 style="margin:18px 0 0;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#6c6a78">Répartition</h4>
      <table><thead><tr><th>${{ project: "Projet", task: "Tâche", day: "Jour", client: "Client" }[rep.by]}</th><th class="n">Durée</th><th class="n">Heures</th><th class="n">Montant HT</th></tr></thead><tbody>${groups.map((g) => `<tr><td>${esc(lbl(g))}</td><td class="n">${esc(TU.fmtDuration(g.minutes))}</td><td class="n">${esc(TU.fmtHours(g.minutes))}</td><td class="n">${g.amount ? U.num(g.amount) + " €" : ""}</td></tr>`).join("")}</tbody></table>
      <h4 style="margin:18px 0 0;font:600 10px 'JetBrains Mono',monospace;letter-spacing:.14em;text-transform:uppercase;color:#6c6a78">Détail</h4>
      <table><thead><tr><th>Date</th><th>Projet</th><th>Description</th><th class="n">Durée</th></tr></thead><tbody>${entries.slice().sort((a, b) => a.date.localeCompare(b.date)).map((e) => `<tr><td>${esc(U.fmtDate(e.date))}${e.start ? " " + esc(e.start) : ""}</td><td>${esc((P.get(e.projectId) || {}).name || "—")}</td><td>${esc(entryTitle(d, e))}</td><td class="n">${esc(TU.fmtDuration(e.minutes))}</td></tr>`).join("")}</tbody></table>
      <div class="p-foot"><p>Rapport généré le ${esc(U.fmtDate(U.today()))} — ${entries.length} saisie(s).</p></div></div>`;
  }
})();
