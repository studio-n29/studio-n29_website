/* Settings (company, billing, security, data) and the mobile "More" menu. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, store = HQ.store, L = HQ.legal;
  HQ.views = HQ.views || {};

  const CAT = [["service", "Prestation de services"], ["goods", "Livraison de biens"], ["mixed", "Mixte"]];
  const REG = [["franchise", "Franchise en base de TVA (art. 293 B du CGI)"], ["normal", "TVA applicable"], ["autoliq", "Autoliquidation (client UE assujetti)"]];
  const COMPANY = [
    ["name", "Nom ou raison sociale", { req: true }], ["legalForm", "Forme juridique", { opts: L.LEGAL_FORMS }], ["tradeName", "Nom commercial"],
    ["address", "Adresse", { req: true, full: true }], ["zip", "Code postal", { req: true, mode: "numeric" }], ["city", "Ville", { req: true }], ["country", "Pays"],
    ["siret", "SIRET (14 chiffres)", { req: true, mode: "numeric" }], ["ape", "Code APE / NAF"], ["vatNumber", "N° de TVA intracommunautaire"],
    ["registration", "Immatriculation (RCS / RM)", { full: true }], ["capital", "Capital social (sociétés)"],
    ["email", "E-mail", { type: "email" }], ["phone", "Téléphone", { type: "tel" }], ["website", "Site web"],
    ["iban", "IBAN"], ["bic", "BIC"],
    ["insurance", "Assurance professionnelle (RC pro…)", { area: true, full: true }], ["mediator", "Médiateur de la consommation (obligatoire pour les particuliers)", { area: true, full: true }],
  ];
  const BILLING = [
    ["vatRegime", "Régime de TVA par défaut", { opts: REG, full: true }], ["defaultVat", "Taux de TVA par défaut (%)", { opts: L.VAT_RATES.map((r) => [r, String(r).replace(".", ",") + " %"]), num: true }],
    ["operationCategory", "Catégorie d'opération par défaut", { opts: CAT }], ["vatOnDebits", "Option TVA d'après les débits", { check: true }],
    ["paymentDays", "Délai de paiement par défaut (jours)", { int: true }], ["quoteValidityDays", "Validité des devis (jours)", { int: true }],
    ["prefixInvoice", "Préfixe des factures", { text: true }], ["prefixQuote", "Préfixe des devis", { text: true }], ["prefixCredit", "Préfixe des avoirs", { text: true }],
    ["paymentMethods", "Modes de règlement affichés", { full: true }], ["dailyRate", "Taux journalier (TJM) en € HT", { eur: true }],
    ["recoveryFee", "Indemnité forfaitaire de recouvrement (€)", { eur: true }], ["discountMention", "Mention d'escompte", { full: true }],
    ["threshold", "Plafond de CA micro (€)", { eur: true }], ["vatThreshold", "Seuil de franchise de TVA (€)", { eur: true }],
    ["noteInvoice", "Mention libre en pied de facture", { area: true, full: true }], ["noteQuote", "Mention libre en pied de devis", { area: true, full: true }],
  ];

  function formFrom(descs, values, onSave, extraTop) {
    const ctl = {};
    const wraps = descs.map(([k, label, o = {}]) => {
      let el, v = values[k];
      if (o.opts) el = U.select(o.opts, String(v));
      else if (o.check) el = h("input", { type: "checkbox", checked: !!v });
      else if (o.area) el = U.textarea({ rows: 2, value: v || "" });
      else if (o.eur) el = U.input({ value: v ? String(v / 100).replace(".", ",") : "", inputmode: "decimal", placeholder: "0,00" });
      else el = U.input({ value: v == null ? "" : v, type: o.type || "text", inputmode: o.mode || (o.int ? "numeric" : undefined) });
      ctl[k] = { el, o };
      const w = o.check ? h("label.check", { style: "grid-column:1/-1" }, el, label) : field(label, el, { req: o.req });
      if (o.full) w.style.gridColumn = "1 / -1";
      return w;
    });
    const err = h("p.ferr", { role: "alert" });
    return h("form.form", { onsubmit: (e) => {
      e.preventDefault(); err.textContent = "";
      const out = {};
      for (const [k, { el, o }] of Object.entries(ctl)) {
        out[k] = o.check ? el.checked : o.eur ? U.parseMoney(el.value) : o.int ? Math.max(0, Math.round(U.parseNum(el.value))) : o.num ? Number(el.value) : el.value.trim();
      }
      const msg = onSave(out); if (msg) { err.textContent = msg; return; }
      U.toast("Enregistré", "ok");
    } }, extraTop, h("div.form.r2", { style: "display:grid;gap:14px" }, wraps), err, h("div.form-actions", U.btn("Enregistrer", { kind: "accent", type: "submit", icon: "check" })));
  }

  // ---------- Data helpers ----------
  async function exportEncrypted() {
    const txt = await store.exportEncrypted();
    U.download(`n29-hq-sauvegarde-chiffree-${U.today()}.json`, txt);
    U.toast("Sauvegarde chiffrée exportée", "ok");
  }
  function importFlow(rerender) {
    U.pickFile(".json,application/json").then(async (f) => {
      if (!f) return;
      const text = await U.readFile(f), type = store.peekBackupType(text);
      if (!type) { U.toast("Fichier non reconnu.", "bad"); return; }
      const ok = await U.confirm({ title: "Remplacer les données de cet appareil ?", text: "L'import remplace toutes les données actuelles par celles de la sauvegarde. Faites d'abord une sauvegarde si besoin.", ok: "Remplacer", danger: true });
      if (!ok) return;
      try {
        if (type === "n29hq-backup-encrypted") {
          const p = U.input({ type: "password", placeholder: "Phrase secrète de la sauvegarde" }), msg = h("p.ferr");
          const s = U.sheet({ title: "Phrase secrète de la sauvegarde", body: h("form.form", { onsubmit: async (e) => { e.preventDefault(); try { await store.importBackup(text, p.value); s.close(true); U.toast("Sauvegarde restaurée", "ok"); HQ.go("/"); setTimeout(() => location.reload(), 600); } catch (x) { msg.textContent = "Phrase secrète incorrecte ou fichier corrompu."; } } }, field("Phrase secrète", p), msg, h("div.form-actions", U.btn("Restaurer", { kind: "accent", type: "submit" }))) });
        } else { await store.importBackup(text); U.toast("Sauvegarde restaurée", "ok"); rerender(); }
      } catch (e) { U.toast(e.message || "Import impossible", "bad"); }
    });
  }

  // ---------- Settings view ----------
  HQ.views.settings = function (root, ctx) {
    const db = store.db();
    let tab = ctx.query.tab || "company";
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Configuration"), h("h1", "Réglages"))));
    const tabs = h("div.tabs-inline", { role: "tablist" }), body = h("div.fade-in");
    const T = [["company", "Entreprise"], ["billing", "Facturation"], ["security", "Sécurité"], ["data", "Données"]];
    root.append(tabs, body);
    const show = (t) => { tab = t; tabs.replaceChildren(...T.map(([id, l]) => h("button", { role: "tab", "aria-selected": String(id === tab), onclick: () => show(id) }, l))); body.replaceChildren(PANES[t]()); };
    const PANES = {
      company: () => h("div.card", h("p.muted", { style: "font-size:.88rem;margin-bottom:16px" }, "Ces informations figurent sur chaque devis et facture (mentions légales). Elles sont figées sur une pièce au moment de son émission."),
        formFrom(COMPANY, db.settings.company, (o) => { if (o.siret && !L.validSiret(o.siret)) return "SIRET invalide (14 chiffres, clé de contrôle incorrecte)."; o.siret = L.cleanId(o.siret); store.mutate((d) => { Object.assign(d.settings.company, o); store.audit("settings.company", o.name); }); })),
      billing: () => h("div.card", formFrom(BILLING, db.settings.billing, (o) => { store.mutate((d) => { Object.assign(d.settings.billing, o); store.audit("settings.billing", ""); }); }, h("div.banner", { style: "margin-bottom:6px" }, "Changer un préfixe ouvre une nouvelle série qui repart de 0001. Les pièces déjà émises ne sont pas modifiées."))),
      security: () => {
        const sec = db.settings.security;
        const lock = U.select([[0, "Jamais"], [1, "1 minute"], [2, "2 minutes"], [5, "5 minutes"], [10, "10 minutes"], [15, "15 minutes"], [30, "30 minutes"]], String(sec.autoLockMinutes));
        lock.addEventListener("change", () => { store.mutate((d) => { d.settings.security.autoLockMinutes = Number(lock.value); }); U.toast("Verrouillage automatique mis à jour", "ok"); });
        const rem = h("input", { type: "checkbox", checked: !!sec.remember });
        rem.addEventListener("change", async () => { await store.setRemember(rem.checked); U.toast(rem.checked ? "Cet appareil est mémorisé" : "Appareil oublié", "ok"); });
        const o = U.input({ type: "password", autocomplete: "current-password" }), n = U.input({ type: "password", autocomplete: "new-password" }), n2 = U.input({ type: "password", autocomplete: "new-password" }), err = h("p.ferr", { role: "alert" });
        return h("div.stack",
          h("div.card", h("h2", "Verrouillage"), h("div.form", field("Verrouiller après inactivité", lock), h("label.check", rem, "Mémoriser cet appareil (ne pas redemander la phrase secrète à l'ouverture)"), h("p.hint", "Si activé, la clé reste dans ce navigateur : toute personne qui ouvre cet appareil déverrouillé accède aux données. Le bouton « Verrouiller » l'oublie."), h("div.form-actions", { style: "justify-content:flex-start" }, U.btn("Verrouiller maintenant", { icon: "lock", onClick: () => HQ.lockNow() })))),
          h("div.card", h("h2", "Changer la phrase secrète"), h("form.form", { onsubmit: async (e) => { e.preventDefault(); err.textContent = ""; if (n.value.length < 10) { err.textContent = "10 caractères minimum."; return; } if (n.value !== n2.value) { err.textContent = "Les deux phrases ne correspondent pas."; return; } try { await store.changePassphrase(o.value, n.value); o.value = n.value = n2.value = ""; U.toast("Phrase secrète modifiée", "ok"); } catch (x) { err.textContent = "Phrase secrète actuelle incorrecte."; } } }, field("Phrase actuelle", o), field("Nouvelle phrase", n), field("Confirmer", n2), err, h("div.form-actions", U.btn("Modifier", { kind: "accent", type: "submit" })))));
      },
      data: () => {
        const counts = [["Clients", db.clients.length], ["Projets", db.projects.length], ["Tâches", db.tasks.length], ["Documents", db.documents.length], ["Paiements", db.payments.length], ["Prompts", db.prompts.length]];
        const lb = db.lastBackupAt, est = h("p.hint");
        if (navigator.storage && navigator.storage.estimate) navigator.storage.estimate().then((e) => { est.textContent = `Stockage utilisé par le navigateur : ${(e.usage / 1048576).toFixed(1)} Mo.`; });
        const isIos = /iphone|ipad|ipod/i.test(navigator.userAgent), installed = matchMedia("(display-mode: standalone)").matches || navigator.standalone;
        return h("div.stack",
          h("div.card", h("h2", "Sauvegardes", h("small", lb ? "Dernière : " + U.fmtDateTime(lb) : "Jamais")),
            h("p.muted", { style: "font-size:.9rem;margin-bottom:14px" }, "Vos données ne sont que sur cet appareil. Exportez régulièrement une sauvegarde et gardez-la ailleurs (cloud privé, clé USB). Les pièces comptables doivent être conservées 10 ans."),
            h("div.head-actions", U.btn("Sauvegarde chiffrée", { kind: "accent", icon: "download", onClick: exportEncrypted }), U.btn("Export lisible (JSON)", { icon: "download", onClick: () => { U.download(`n29-hq-export-${U.today()}.json`, store.exportPlain()); U.toast("Export lisible téléchargé — ne le partagez pas", "ok"); } }), U.btn("Importer", { icon: "upload", onClick: () => importFlow(ctx.rerender) })), est),
          h("div.card", h("h2", "Contenu"), h("dl.kv", counts.map(([k, v]) => [h("dt", k), h("dd", String(v))]))),
          h("div.card", h("h2", "Application"), h("p.muted", { style: "font-size:.9rem;margin-bottom:12px" }, installed ? "L'application est installée sur cet appareil." : isIos ? "Sur iPhone : touchez Partager, puis « Sur l'écran d'accueil ». L'application s'ouvre alors plein écran et garde ses données plus durablement." : "Installez l'application pour l'ouvrir comme une app, hors ligne."), !installed && !isIos ? U.btn("Installer l'application", { icon: "download", onClick: async () => { if (HQ.installPrompt) { HQ.installPrompt.prompt(); HQ.installPrompt = null; } else U.toast("Utilisez le menu du navigateur : « Installer l'application ».", "bad"); } }) : null),
          h("div.card", h("h2", "Zone de test"), h("p.muted", { style: "font-size:.9rem;margin-bottom:12px" }, "Charge des données fictives (clients, projets, devis, factures) pour essayer l'application. Remplace toutes les données actuelles."), h("div.head-actions", U.btn("Charger les données de démonstration", { icon: "refresh", onClick: async () => { if (await U.confirm({ title: "Remplacer par des données fictives ?", text: "Toutes vos données actuelles seront remplacées. Exportez une sauvegarde avant si besoin.", ok: "Charger", danger: true })) { await HQ.demo.load(); U.toast("Données de démonstration chargées", "ok"); HQ.go("/"); } } }), U.btn("Effacer toutes les données", { kind: "danger", icon: "trash", onClick: () => wipeSheet() }))));
      },
    };
    function wipeSheet() {
      const i = U.input({ placeholder: "EFFACER" }); const s = U.sheet({ title: "Effacer toutes les données", body: h("form.form", { onsubmit: async (e) => { e.preventDefault(); if (i.value.trim() !== "EFFACER") return; await store.wipe(); s.close(true); location.hash = ""; location.reload(); } }, h("p", { style: "color:var(--bad)" }, "Action irréversible : clients, factures, projets et prompts de cet appareil seront supprimés. Exportez une sauvegarde avant."), field("Tapez EFFACER pour confirmer", i), h("div.form-actions", U.btn("Annuler", { onClick: () => s.close() }), U.btn("Tout effacer", { kind: "danger", type: "submit" }))) });
    }
    show(tab);
  };

  // ---------- Mobile "More" ----------
  HQ.views.more = function (root) {
    const db = store.db(), lb = db.lastBackupAt;
    const item = (ico, label, sub, href, fn) => h(href ? "a.row" : "button.row", Object.assign(href ? { href } : { type: "button", onclick: fn }, { style: "text-align:left;background:none;border:0;border-bottom:1px solid var(--line);width:100%;color:inherit;padding-left:0;padding-right:0" }), h("div", { style: "display:flex;gap:14px;align-items:center" }, h("span", { style: "color:var(--accent-2)" }, icon(ico)), h("div", h("div.row-t", label), h("div.row-s", sub))), icon("chevR"));
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Menu"), h("h1", "Plus"))));
    root.appendChild(h("div.card", h("div.list",
      item("users", "Clients", `${db.clients.length} client(s)`, "#/clients"), item("shield", "Conformité", "Mentions, intégrité, livre des recettes", "#/compliance"), item("settings", "Réglages", "Entreprise, facturation, sécurité, données", "#/settings"),
      item("download", "Sauvegarder", lb ? "Dernière : " + U.fmtDateTime(lb) : "Aucune sauvegarde", null, exportEncrypted), item("lock", "Verrouiller", "Fermer l'espace privé", null, () => HQ.lockNow()))));
  };
})();
