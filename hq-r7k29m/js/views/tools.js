/* Production tools hub + custom shortcuts. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, store = HQ.store;
  HQ.views = HQ.views || {};

  const DEFAULT_LINKS = [
    ["Site public", "https://n29-studio.fr"], ["Profil Malt", "https://www.malt.fr/profile/djasonnathiez"],
    ["Dépôt GitHub du site", "https://github.com/studio-n29/studio-n29_website"], ["Déploiements (GitHub Actions)", "https://github.com/studio-n29/studio-n29_website/actions"],
    ["Formulaire de contact (Web3Forms)", "https://web3forms.com/"],
  ];

  function linkSheet(id, done) {
    const db = store.db(), l = id ? db.links.find((x) => x.id === id) : null;
    const name = U.input({ value: l ? l.name : "", maxlength: 60 }), url = U.input({ type: "url", value: l ? l.url : "", placeholder: "https://…" }), err = h("p.ferr", { role: "alert" });
    const s = U.sheet({ title: l ? "Modifier le raccourci" : "Nouveau raccourci", body: h("form.form", { onsubmit: (e) => {
      e.preventDefault();
      let u = url.value.trim(); if (u && !/^https?:\/\//i.test(u)) u = "https://" + u;
      if (!name.value.trim() || !/^https?:\/\/.+\..+/i.test(u)) { err.textContent = "Nom et adresse (https://…) obligatoires."; return; }
      store.mutate((d) => { if (l) Object.assign(d.links.find((x) => x.id === id), { name: name.value.trim(), url: u }); else d.links.push({ id: U.uid(), name: name.value.trim(), url: u }); });
      s.close(true); done();
    } }, U.field("Nom", name, { req: true }), U.field("Adresse", url, { req: true }), err,
      h("div.form-actions", l ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: () => { store.mutate((d) => { d.links = d.links.filter((x) => x.id !== id); }); s.close(true); done(); } }) : null, U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" }))) });
  }

  HQ.views.tools = function (root, ctx) {
    const db = store.db();
    if (!db.linksSeeded) store.mutate((d) => { d.linksSeeded = true; if (!d.links.length) DEFAULT_LINKS.forEach(([name, url]) => d.links.push({ id: U.uid(), name, url })); });
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Production"), h("h1", "Outils"))));
    const tool = (ico, title, desc, href, meta) => h("a.card", { href, style: "text-decoration:none;display:grid;gap:10px;transition:border-color .2s", onmouseenter: (e) => { e.currentTarget.style.borderColor = "rgba(138,92,255,.6)"; }, onmouseleave: (e) => { e.currentTarget.style.borderColor = ""; } }, h("div", { style: "display:flex;align-items:center;gap:12px" }, h("span", { style: "color:var(--accent-2)" }, icon(ico)), h("b", { style: "font-size:1.05rem" }, title)), h("p.muted", { style: "font-size:.9rem" }, desc), meta ? h("span.badge.acc", { style: "justify-self:start" }, meta) : null);
    root.appendChild(h("div.grid.c3", { style: "margin-bottom:18px" },
      tool("spark", "Apex Prompt Studio", "Générateur de prompts d'illustration pour l'Apex Universe : personnages, créatures, paysages, cartes, style commun et bibliothèque.", "#/tools/apex", `${db.prompts.length} prompt(s) sauvegardé(s)`),
      tool("tasks", "Projets & tâches", "Kanban par projet, ajout rapide, échéances et priorités.", "#/projects", `${db.tasks.filter((t) => t.status !== "done").length} tâche(s) ouverte(s)`),
      tool("doc", "Devis & factures", "Documents conformes à la réglementation française, avoirs, acomptes, livre des recettes.", "#/docs", `${db.documents.filter((d) => d.number).length} pièce(s) émise(s)`)));
    const list = h("div.shortcuts");
    function draw() {
      list.replaceChildren();
      const d = store.db();
      d.links.forEach((l) => list.appendChild(h("div", { style: "display:flex;gap:6px" }, h("a.shortcut", { href: l.url, target: "_blank", rel: "noopener noreferrer", style: "flex:1;min-width:0" }, icon("external"), h("span", { style: "overflow:hidden;text-overflow:ellipsis;white-space:nowrap" }, l.name)), U.iconBtn("edit", "Modifier", () => linkSheet(l.id, draw)))));
      list.appendChild(h("button.shortcut", { type: "button", onclick: () => linkSheet(null, draw), style: "border-style:dashed;color:var(--muted)" }, icon("plus"), "Ajouter un raccourci"));
    }
    draw();
    root.appendChild(h("div.card", h("h2", "Raccourcis"), list));
  };
})();
