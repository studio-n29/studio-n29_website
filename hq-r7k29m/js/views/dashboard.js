/* Dashboard: key figures, tasks, invoices to follow, shortcuts, alerts. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, store = HQ.store, L = HQ.legal;
  HQ.views = HQ.views || {};

  HQ.views.dash = function (root, ctx) {
    HQ.rerender = ctx.rerender;
    const db = store.db(), today = U.today(), year = today.slice(0, 4), co = db.settings.company, bl = db.settings.billing;
    const hour = new Date().getHours(), first = (co.name || "").split(" ")[0];

    // ----- figures -----
    const invoices = db.documents.filter((d) => d.number && (d.type === "invoice" || d.type === "deposit"));
    const paidYearHT = db.payments.filter((p) => p.date.startsWith(year)).reduce((s, p) => { const d = db.documents.find((x) => x.id === p.docId); const r = d && d.totals.ttc ? d.totals.ht / d.totals.ttc : 1; return s + p.amount * r; }, 0);
    const paidYear = db.payments.filter((p) => p.date.startsWith(year)).reduce((s, p) => s + p.amount, 0);
    const withState = invoices.map((d) => ({ d, st: L.invoiceState(d, db.payments, db.documents, today), bal: L.balance(d, db.payments, db.documents) }));
    const open = withState.filter((x) => ["issued", "partial", "overdue"].includes(x.st));
    const overdue = open.filter((x) => x.st === "overdue");
    const quotes = db.documents.filter((d) => d.type === "quote" && d.number && L.quoteState(d, today) === "sent");

    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", U.fmtDate(today)), h("h1", `${hour >= 18 || hour < 5 ? "Bonsoir" : "Bonjour"}${first ? " " + first : ""}`)), h("div.head-actions", U.btn("Facture", { kind: "accent", icon: "plus", onClick: () => HQ.go("/docs/new/invoice") }), U.btn("Devis", { icon: "plus", onClick: () => HQ.go("/docs/new/quote") }))));

    // ----- alerts -----
    const alerts = [];
    if (!co.name || !co.address || !co.siret) alerts.push(h("div.banner.warn", "Complétez les informations de votre entreprise (nom, adresse, SIRET) pour pouvoir émettre des factures. ", h("a", { href: "#/settings", style: "text-decoration:underline" }, "Ouvrir les réglages")));
    const lb = db.lastBackupAt; if (!lb || Date.now() - lb > 14 * 86400000) alerts.push(h("div.banner.warn", lb ? "Votre dernière sauvegarde date de plus de 14 jours. " : "Vous n'avez encore fait aucune sauvegarde : vos données ne sont que sur cet appareil. ", h("a", { href: "#/settings", style: "text-decoration:underline" }, "Sauvegarder maintenant")));
    if (!HQ.isStandalone() && !localStorage.getItem("hq.installDismissed")) alerts.push(h("div.banner", { dataset: { install: "1" }, style: "display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap" }, h("span", "Installez l'application sur votre appareil : icône sur l'écran d'accueil, plein écran et mode hors ligne."), h("span", { style: "display:flex;gap:8px" }, U.btn("Installer", { kind: "accent", sm: true, icon: "download", onClick: () => HQ.install() }), U.btn("Plus tard", { sm: true, onClick: (e) => { try { localStorage.setItem("hq.installDismissed", "1"); } catch (x) { /* ignore */ } e.target.closest("[data-install]").remove(); } }))));
    if (alerts.length) root.appendChild(h("div.stack", { style: "margin-bottom:14px" }, alerts));

    // ----- stats -----
    const lateSum = overdue.reduce((s, x) => s + x.bal, 0);
    root.appendChild(h("div.grid.c4", { style: "margin-bottom:14px" },
      h("div.stat", h("small", `Encaissé · ${year}`), h("b", U.eur(paidYear)), h("span", `${db.payments.filter((p) => p.date.startsWith(year)).length} paiement(s)`)),
      h("div.stat", h("small", "À encaisser"), h("b", U.eur(open.reduce((s, x) => s + Math.max(0, x.bal), 0))), h("span", `${open.length} facture(s) ouverte(s)`)),
      h("div.stat" + (overdue.length ? ".bad" : ".ok"), h("small", "En retard"), h("b", overdue.length ? U.eur(lateSum) : "Aucun"), h("span", overdue.length ? `${overdue.length} facture(s)` : "Tout est à jour")),
      h("div.stat", h("small", "Devis en attente"), h("b", String(quotes.length)), h("span", U.eur(quotes.reduce((s, d) => s + d.totals.ttc, 0))))));

    // ----- meters -----
    const meter = (label, used, max, hint) => { const pct = max ? used / max : 0; return h("div", { style: "display:grid;gap:8px" }, h("div", { style: "display:flex;justify-content:space-between;gap:10px;font-size:.88rem;flex-wrap:wrap" }, h("span", label), h("span.mono", { style: "font-size:.78rem;color:var(--muted)" }, `${U.eur(Math.round(used))} / ${U.eur(max)} · ${Math.round(pct * 100)} %`)), h("div.meter" + (pct >= 1 ? ".bad" : pct >= 0.8 ? ".warn" : ""), h("i", { style: `transform:scaleX(${Math.min(1, pct)})` })), hint ? h("span.hint", hint) : null); };
    const meters = [meter("Plafond de chiffre d'affaires (micro)", paidYearHT, bl.threshold, "CA encaissé HT de l'année — vérifiez le plafond de votre activité (modifiable dans Réglages ▸ Facturation).")];
    if (bl.vatRegime === "franchise") meters.push(meter("Seuil de franchise de TVA", paidYearHT, bl.vatThreshold, "Au-delà du seuil, la TVA devient applicable : demandez conseil à votre comptable."));
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "Seuils de l'année"), h("div.stack", meters)));

    // ----- time -----
    const TU = HQ.timeutil, wk = TU.rangeFor("week", today), weekMin = db.timeEntries.filter((e) => e.date >= wk.from && e.date <= wk.to).reduce((a, e) => a + e.minutes, 0), todayMin = db.timeEntries.filter((e) => e.date === today).reduce((a, e) => a + e.minutes, 0);
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("div", { style: "display:flex;justify-content:space-between;gap:12px;align-items:center;flex-wrap:wrap" },
      h("div", h("div.eyebrow", db.timer ? "Chronomètre en cours" : "Temps travaillé"), h("div", { style: "margin-top:8px;font-size:1.3rem;font-weight:700;letter-spacing:-.02em" }, `${TU.fmtDuration(todayMin)} aujourd'hui · ${TU.fmtDuration(weekMin)} cette semaine`)),
      h("div", { style: "display:flex;gap:8px;flex-wrap:wrap" }, db.timer ? U.btn("Arrêter le chronomètre", { kind: "accent", icon: "check", onClick: () => { const e = HQ.timer.stop(); U.toast(`${TU.fmtDuration(e.minutes)} enregistrées`, "ok"); ctx.rerender(); } }) : null, U.btn("Ouvrir le suivi du temps", { icon: "clock", onClick: () => HQ.go("/time") })))));

    // ----- shortcuts -----
    const sc = (ico, label, fn) => h("button.shortcut", { type: "button", onclick: fn }, icon(ico), label);
    root.appendChild(h("div.shortcuts", { style: "margin-bottom:14px" }, sc("spark", "Apex Studio", () => HQ.go("/tools/apex")), sc("tasks", "Nouvelle tâche", () => HQ.tasks.openTask(null)), sc("users", "Clients", () => HQ.go("/clients")), sc("shield", "Conformité", () => HQ.go("/compliance"))));

    // ----- two columns -----
    const weekEnd = U.addDays(today, 7);
    const tasks = db.tasks.filter((t) => t.status !== "done" && ((t.due && t.due <= weekEnd) || t.priority === "urgent")).sort((a, b) => (a.due || "9").localeCompare(b.due || "9")).slice(0, 7);
    const taskList = h("div.list");
    if (!tasks.length) taskList.appendChild(h("div.empty", "Rien d'urgent cette semaine."));
    tasks.forEach((t) => { const p = db.projects.find((x) => x.id === t.projectId); taskList.appendChild(h("div.row", { role: "button", tabindex: "0", onclick: () => HQ.tasks.openTask(t.id), onkeydown: (e) => { if (e.key === "Enter") HQ.tasks.openTask(t.id); } }, h("div", h("div.row-t", t.title), h("div.row-s", [p && p.name, t.status === "doing" ? "En cours" : null].filter(Boolean).join(" · ") || "Sans projet")), h("div.row-r", t.due ? h("span.badge" + (t.due < today ? ".bad" : t.due === today ? ".warn" : ""), t.due < today ? "En retard · " + U.fmtDate(t.due) : t.due === today ? "Aujourd'hui" : U.fmtDate(t.due)) : h("span.badge.acc", "Urgente")))); });
    const follow = open.slice().sort((a, b) => (a.st === "overdue" ? 0 : 1) - (b.st === "overdue" ? 0 : 1) || (a.d.dueDate || "").localeCompare(b.d.dueDate || "")).slice(0, 7);
    const invList = h("div.list");
    if (!follow.length) invList.appendChild(h("div.empty", "Aucune facture en attente de paiement."));
    follow.forEach((x) => invList.appendChild(h("a.row", { href: "#/docs/" + x.d.id }, h("div", h("div.row-t", x.d.number), h("div.row-s", `${x.d.client.name} · échéance ${U.fmtDate(x.d.dueDate)}`)), h("div.row-r", h("b", U.eur(x.bal)), HQ.docs.badge(x.st)))));
    root.appendChild(h("div.dash", h("div.card", h("h2", "Tâches à suivre", h("small", "7 prochains jours")), taskList, h("div", { style: "margin-top:10px" }, U.btn("Voir le tableau", { sm: true, onClick: () => HQ.go("/projects") }))), h("div.card", h("h2", "Factures à suivre"), invList, h("div", { style: "margin-top:10px" }, U.btn("Toutes les factures", { sm: true, onClick: () => HQ.go("/docs") })))));
  };
})();
