/* Clients directory. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, h = U.h, icon = U.icon, field = U.field, store = HQ.store, L = HQ.legal;
  HQ.views = HQ.views || {};

  const TYPES = [["pro", "Professionnel (entreprise)"], ["individual", "Particulier"]];

  function clientTotals(db, id) {
    const docs = db.documents.filter((d) => d.clientId === id && d.number && d.type !== "quote");
    return { count: docs.length, ttc: docs.reduce((s, d) => s + d.totals.ttc, 0) };
  }

  function openSheet(id, onDone) {
    const db = store.db();
    const c = id ? db.clients.find((x) => x.id === id) : null;
    const v = Object.assign({ type: "pro", name: "", contact: "", siren: "", vatNumber: "", address: "", zip: "", city: "", country: "France", deliveryAddress: "", email: "", phone: "", notes: "" }, c || {});
    const f = {
      type: U.select(TYPES, v.type), name: U.input({ value: v.name }), contact: U.input({ value: v.contact }),
      siren: U.input({ value: v.siren, inputmode: "numeric", placeholder: "9 chiffres" }), vatNumber: U.input({ value: v.vatNumber, placeholder: "FR12345678901" }),
      address: U.input({ value: v.address }), zip: U.input({ value: v.zip, inputmode: "numeric" }), city: U.input({ value: v.city }), country: U.input({ value: v.country }),
      deliveryAddress: U.textarea({ rows: 2, value: v.deliveryAddress, placeholder: "Si différente de l'adresse de facturation" }),
      email: U.input({ type: "email", value: v.email }), phone: U.input({ type: "tel", value: v.phone }), notes: U.textarea({ rows: 3, value: v.notes }),
    };
    const proOnly = [];
    const wName = field(v.type === "pro" ? "Raison sociale" : "Nom complet", f.name, { req: true });
    const wSiren = field("SIREN (obligatoire en B2B)", f.siren), wVat = field("N° de TVA intracommunautaire", f.vatNumber);
    proOnly.push(wSiren, wVat);
    const sync = () => { const pro = f.type.value === "pro"; wName.querySelector("label").firstChild.textContent = pro ? "Raison sociale" : "Nom complet"; proOnly.forEach((w) => (w.hidden = !pro)); };
    f.type.addEventListener("change", sync);
    const err = h("p.ferr", { role: "alert" });
    const form = h("form.form", {
      onsubmit: (e) => {
        e.preventDefault(); err.textContent = "";
        const o = Object.fromEntries(Object.entries(f).map(([k, el]) => [k, el.value.trim()]));
        if (!o.name) { err.textContent = "Le nom est obligatoire."; f.name.focus(); return; }
        if (o.type === "pro" && o.siren && !L.validSiren(o.siren)) { err.textContent = "SIREN invalide : 9 chiffres (clé de contrôle incorrecte)."; f.siren.focus(); return; }
        o.siren = L.cleanId(o.siren);
        let savedId = id;
        store.mutate((d) => {
          if (id) Object.assign(d.clients.find((x) => x.id === id), o);
          else { savedId = U.uid(); d.clients.push(Object.assign({ id: savedId, createdAt: Date.now() }, o)); }
          store.audit(id ? "client.update" : "client.create", o.name);
        });
        s.close(true); U.toast(id ? "Client mis à jour" : "Client créé", "ok");
        if (onDone) onDone(savedId); else HQ.go("/clients");
      },
    },
      h("div.r2", field("Type", f.type), wName),
      h("div.r2", field("Contact (personne)", f.contact), field("E-mail", f.email)),
      h("div.r2", wSiren, wVat),
      field("Adresse", f.address), h("div.r3", field("Code postal", f.zip), field("Ville", f.city), field("Pays", f.country)),
      field("Adresse de livraison", f.deliveryAddress), field("Téléphone", f.phone), field("Notes internes", f.notes), err,
      h("div.form-actions",
        c ? U.btn("Supprimer", { kind: "danger", icon: "trash", onClick: async () => {
          const used = db.documents.some((d) => d.clientId === id);
          if (used) { U.toast("Impossible : ce client a des documents (conservation légale).", "bad"); return; }
          if (await U.confirm({ title: "Supprimer ce client ?", text: v.name, ok: "Supprimer", danger: true })) { store.mutate((d) => { d.clients = d.clients.filter((x) => x.id !== id); store.audit("client.delete", v.name); }); s.close(true); HQ.go("/clients"); }
        } }) : null,
        c ? U.btn("Nouveau devis", { icon: "doc", onClick: () => { s.close(true); HQ.go("/docs/new/quote?client=" + id); } }) : null,
        U.btn("Annuler", { onClick: () => s.close() }), U.btn("Enregistrer", { kind: "accent", type: "submit" })));
    sync();
    const s = U.sheet({ title: c ? "Modifier le client" : "Nouveau client", body: form, wide: true });
    return s;
  }
  HQ.clients = { openSheet };

  HQ.views.clients = function (root, ctx) {
    const db = store.db();
    let q = "";
    root.appendChild(h("div.page-head", h("div", h("div.eyebrow", "Carnet"), h("h1", "Clients")), h("div.head-actions", U.btn("Nouveau client", { kind: "accent", icon: "plus", onClick: () => openSheet(null) }))));
    const search = U.input({ type: "search", placeholder: "Rechercher un client…" });
    const list = h("div.list");
    root.append(h("div.toolbar", h("div.search", icon("search"), search)), h("div.card", list));
    function draw() {
      list.replaceChildren();
      const items = db.clients.filter((c) => !q || U.norm([c.name, c.contact, c.city, c.email, c.siren].join(" ")).includes(U.norm(q))).sort((a, b) => a.name.localeCompare(b.name, "fr"));
      if (!items.length) { list.appendChild(h("div.empty", db.clients.length ? "Aucun résultat." : "Aucun client pour l'instant. Ajoutez-en un pour créer vos devis et factures.")); return; }
      items.forEach((c) => {
        const t = clientTotals(db, c.id);
        list.appendChild(h("div.row", { role: "button", tabindex: "0", onclick: () => openSheet(c.id), onkeydown: (e) => { if (e.key === "Enter") openSheet(c.id); } },
          h("div", h("div.row-t", c.name), h("div.row-s", [c.type === "pro" ? "Pro" : "Particulier", c.city, c.contact].filter(Boolean).join(" · "))),
          h("div.row-r", h("b", t.count ? U.eur(t.ttc) : "—"), h("span.row-s", t.count ? `${t.count} pièce${t.count > 1 ? "s" : ""}` : "Aucune facture"))));
      });
    }
    search.addEventListener("input", () => { q = search.value; draw(); });
    draw();
  };
})();
