/* Compliance: configuration checklist, integrity check, livre des recettes, accounting exports, audit log. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, store = HQ.store, L = HQ.legal;
  HQ.views = HQ.views || {};

  HQ.views.compliance = function (root, ctx) {
    const db = store.db(), co = db.settings.company, bl = db.settings.billing, today = U.today();
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Obligations légales"), h("h1", "Conformité"))));
    root.appendChild(h("div.banner", { style: "margin-bottom:14px" }, "Cette page vous aide à vérifier votre configuration. Elle ne remplace pas l'avis de votre expert-comptable ou de votre centre de gestion."));

    // ----- checklist -----
    const issued = db.documents.filter((d) => d.number);
    const proNoSiren = db.clients.filter((c) => c.type === "pro" && !c.siren && db.documents.some((d) => d.clientId === c.id));
    const hasB2C = db.clients.some((c) => c.type === "individual");
    const gaps = L.sequenceGaps(db.documents);
    const items = [
      [co.name && co.address && co.zip && co.city ? "ok" : "ko", "Identité du vendeur", "Nom, adresse complète (Réglages ▸ Entreprise)."],
      [!co.siret ? "ko" : L.validSiret(co.siret) ? "ok" : "ko", "SIRET valide", "Numéro à 14 chiffres, clé de contrôle correcte."],
      [bl.vatRegime === "franchise" ? "ok" : co.vatNumber ? "ok" : "ko", "Régime de TVA", bl.vatRegime === "franchise" ? "Franchise en base : la mention « TVA non applicable, art. 293 B du CGI » est ajoutée automatiquement." : co.vatNumber ? "TVA applicable, numéro de TVA renseigné." : "TVA applicable : renseignez votre numéro de TVA intracommunautaire."],
      [co.iban ? "ok" : "wa", "Coordonnées bancaires", "IBAN / BIC affichés sur les factures."],
      [issued.length ? (gaps.length ? "ko" : "ok") : "ok", "Numérotation continue", gaps.length ? gaps.join(" ; ") : "Séries chronologiques et sans rupture (devis, factures, avoirs)."],
      [proNoSiren.length ? "wa" : "ok", "SIREN des clients professionnels", proNoSiren.length ? `Manquant pour : ${proNoSiren.map((c) => c.name).join(", ")} (obligatoire sur les factures B2B).` : "Renseigné pour les clients concernés."],
      [!hasB2C || co.mediator ? "ok" : "wa", "Médiateur de la consommation", hasB2C ? (co.mediator ? "Renseigné." : "Vous avez des clients particuliers : indiquez votre médiateur de la consommation.") : "Utile uniquement si vous facturez des particuliers."],
      [db.lastBackupAt && Date.now() - db.lastBackupAt < 30 * 86400000 ? "ok" : "wa", "Sauvegarde récente", "Les pièces comptables se conservent 10 ans : exportez régulièrement."],
    ];
    const ico = { ok: "✔", ko: "✖", wa: "!" }, cls = { ok: "ok", ko: "ko", wa: "wa" };
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "Votre configuration"), h("ul.compl", items.map(([s, t, d]) => h("li", h("span." + cls[s], ico[s]), h("div", h("b", t), h("div.row-s", d)))))));

    // ----- integrity -----
    const res = h("div", { style: "margin-top:12px" });
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "Intégrité des pièces", h("small", `${issued.length} émise(s)`)),
      h("p.muted", { style: "font-size:.9rem;margin-bottom:12px" }, "Chaque pièce émise est verrouillée et chaînée à la précédente par une empreinte SHA-256 : toute modification a posteriori est détectée."),
      U.btn("Vérifier maintenant", { icon: "shield", kind: "accent", onClick: async () => { res.textContent = "Vérification…"; const r = await L.verifyChain(db.documents); res.replaceChildren(r.ok ? h("div.banner", `Chaîne intacte : ${r.count} pièce(s) vérifiée(s), aucune rupture de numérotation.`) : h("div.issues", `Rupture détectée à la pièce ${r.brokenAt}.`)); store.audit("integrity.check", r.ok ? "OK" : "KO " + r.brokenAt); } }), res));

    // ----- livre des recettes -----
    const years = [...new Set([today.slice(0, 4), ...db.payments.map((p) => p.date.slice(0, 4))])].sort().reverse();
    let year = years[0];
    const ySel = U.select(years, year), tbl = h("div");
    const drawBook = () => {
      const rows = L.livreRecettes(db, year), total = rows.reduce((s, r) => s + r.amount, 0);
      tbl.replaceChildren(rows.length ? h("div.list", rows.map((r) => h("div.row", { style: "cursor:default" }, h("div", h("div.row-t", `${r.ref || "—"} · ${r.client}`), h("div.row-s", `${U.fmtDate(r.date)} · ${r.method}${r.nature ? " · " + r.nature : ""}`)), h("div.row-r", h("b", U.eur(r.amount)))))) : h("div.empty", "Aucun encaissement cette année."), h("div.totals", { style: "margin-top:12px" }, h("div.grand", h("span", "Total encaissé"), h("span", U.eur(total)))));
    };
    ySel.addEventListener("change", () => { year = ySel.value; drawBook(); });
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "Livre des recettes", ySel), h("p.muted", { style: "font-size:.9rem;margin-bottom:12px" }, "Registre chronologique des encaissements (obligatoire pour les micro-entrepreneurs), alimenté automatiquement par vos paiements."), tbl,
      h("div.form-actions", { style: "justify-content:flex-start" }, U.btn("Exporter en CSV", { icon: "download", onClick: () => U.download(`livre-des-recettes-${year}.csv`, U.csv([["Date", "Pièce", "Client", "Nature", "Mode de règlement", "Montant (€)"], ...L.livreRecettes(db, year).map((r) => [U.fmtDate(r.date), r.ref, r.client, r.nature, r.method, (r.amount / 100).toFixed(2).replace(".", ",")])]), "text/csv") }))));
    drawBook();

    // ----- exports -----
    const journal = () => {
      const rows = [["Date", "Numéro", "Type", "Client", "SIREN", "Total HT (€)", "TVA (€)", "Total TTC (€)", "Payé (€)", "Statut"]];
      issued.slice().sort((a, b) => a.chainIndex - b.chainIndex).forEach((d) => rows.push([U.fmtDate(d.issueDate), d.number, L.TYPE_LABEL[d.type], d.client.name, d.client.siren || "", (d.totals.ht / 100).toFixed(2).replace(".", ","), (d.totals.vat / 100).toFixed(2).replace(".", ","), (d.totals.ttc / 100).toFixed(2).replace(".", ","), d.type === "quote" || d.type === "credit" ? "" : (L.paid(d, db.payments) / 100).toFixed(2).replace(".", ","), d.type === "quote" ? L.quoteState(d, today) : L.invoiceState(d, db.payments, db.documents, today)]));
      U.download(`journal-des-pieces-${today}.csv`, U.csv(rows), "text/csv");
    };
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "Exports pour votre comptable"), h("div.head-actions", U.btn("Journal des pièces (CSV)", { icon: "download", onClick: journal }), U.btn("Journal d'audit (CSV)", { icon: "download", onClick: () => U.download(`journal-audit-${today}.csv`, U.csv([["Horodatage", "Action", "Détail"], ...db.audit.map((a) => [U.fmtDateTime(a.ts), a.action, a.detail])]), "text/csv") }))));

    // ----- good to know -----
    root.appendChild(h("div.card", { style: "margin-bottom:14px" }, h("h2", "À savoir"), h("ul.compl",
      [["Facturation électronique", "Depuis le 1er septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures électroniques ; l'émission devient obligatoire pour les micro-entreprises et PME à partir du 1er septembre 2027, via une plateforme agréée (PDP) ou le portail public. Cet outil produit des PDF et des exports : il n'est pas une plateforme agréée."],
        ["Nouvelles mentions", "Depuis le 1er septembre 2026 : SIREN du client (B2B), adresse de livraison si différente, catégorie d'opération et option TVA sur les débits. Ces champs sont prévus dans l'outil."],
        ["Conservation", "Factures, devis et livre des recettes : 10 ans. Exportez une sauvegarde chiffrée régulièrement."],
        ["Logiciel de facturation", "Cet outil n'est pas certifié (loi anti-fraude à la TVA). Si vous devenez assujetti à la TVA, vérifiez avec votre comptable l'outil à utiliser."]].map(([t, d]) => h("li", h("span.wa", "i"), h("div", h("b", t), h("div.row-s", d)))))));
  };
})();
