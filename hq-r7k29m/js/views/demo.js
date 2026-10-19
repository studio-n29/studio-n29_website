/* Demo data: fictional company, clients, projects, tasks and documents (issued through the real pipeline). */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const U = HQ.util, store = HQ.store, L = HQ.legal;
  HQ.demo = {};

  HQ.demo.load = async function () {
    const T = U.today(), day = (n) => U.addDays(T, n);
    const siren = (p) => L.luhnComplete(p), siret = (p) => L.luhnComplete(L.luhnComplete(p) + "0001");
    store.mutate((d) => {
      const keep = d.settings.security, fresh = store._defaultDb();
      Object.keys(d).forEach((k) => delete d[k]); Object.assign(d, fresh); d.settings.security = keep;
      Object.assign(d.settings.company, { name: "Jean Exemple", legalForm: "EI", tradeName: "STUDIO DÉMO", address: "12 rue de l'Exemple", zip: "59000", city: "Lille", siret: siret("12345678"), ape: "5829C", email: "contact@exemple.fr", phone: "06 00 00 00 00", website: "exemple.fr", iban: "FR76 3000 6000 0112 3456 7890 189", bic: "AGRIFRPP", mediator: "CNPM — Médiation de la consommation, 27 avenue de la libération, 42400 Saint-Chamond" });
      d.settings.billing.dailyRate = 45000; d.lastBackupAt = Date.now() - 3 * 86400000; d.linksSeeded = false;
      const cl = (name, type, sr, city, extra) => { const c = Object.assign({ id: U.uid(), createdAt: Date.now(), type, name, contact: "", siren: sr, vatNumber: "", address: "8 avenue du Test", zip: "75010", city, country: "France", deliveryAddress: "", email: "", phone: "", notes: "" }, extra || {}); d.clients.push(c); return c; };
      cl("Pixel Forge SAS", "pro", siren("44306184"), "Paris", { contact: "Camille Martin", email: "compta@pixelforge.example" });
      cl("Atelier Lumen", "pro", siren("55203253"), "Lyon", { contact: "Hugo Bernard", zip: "69002", email: "hugo@lumen.example" });
      cl("Studio Orbite SARL", "pro", siren("38012986"), "Nantes", { zip: "44000", email: "contact@orbite.example" });
      cl("Marie Test", "individual", "", "Lille", { zip: "59000", email: "marie@test.example" });
      const P = (name, color, description, status = "active") => { const p = { id: U.uid(), name, color, status, clientId: "", description, url: "", deadline: "", createdAt: Date.now() }; d.projects.push(p); return p; };
      const hd = P("Heroes Dawn", "#8a5cff", "RPG de gestion mobile — campagne de Brooklyn, outils de design, backend UGS."); hd.deadline = day(45);
      const dc = P("Mission Pixel Forge", "#5cc8ff", "Système de combat et outils d'éditeur pour le client."); dc.clientId = d.clients[0].id; dc.deadline = day(20);
      const ap = P("Apex Universe", "#ffb454", "Bible visuelle, prompts d'illustration, direction artistique.");
      const tk = (project, title, status, priority, due, est) => d.tasks.push({ id: U.uid(), projectId: project.id, title, notes: "", status, priority, due, estimateH: est || "", createdAt: Date.now(), doneAt: status === "done" ? Date.now() - 86400000 : null });
      tk(hd, "Synergie d'équipe : équilibrage des 4 premiers héros", "doing", "high", day(2), "6");
      tk(hd, "Écran de suivi des quêtes — retours de playtest", "review", "med", day(4));
      tk(hd, "Export CSV du contenu pour le tableur", "todo", "med", day(9), "3");
      tk(hd, "Build Android 0.9.0 et test sur appareils", "todo", "urgent", day(1), "4");
      tk(hd, "Cinématique d'introduction", "done", "med", day(-3));
      tk(dc, "Prototype du système de patterns", "doing", "high", day(3), "10");
      tk(dc, "Outil d'éditeur : timeline des interactions", "todo", "med", day(8), "12");
      tk(dc, "Livrable v1 + documentation", "todo", "high", day(18));
      tk(dc, "Atelier de cadrage avec l'équipe", "done", "low", day(-10));
      tk(ap, "Nouveaux visuels de créatures (cryptides)", "todo", "low", day(12));
      tk(ap, "Mise à jour du style commun des prompts", "doing", "med", "");
      tk(ap, "Facturer le mois en cours", "todo", "urgent", day(-1), "1");
      const note = (project, title, md) => d.notes.push({ id: U.uid(), projectId: project.id, title, md, createdAt: Date.now(), updatedAt: Date.now() - d.notes.length * 3600000 });
      note(hd, "Équilibrage des héros — v0.9", "# Équilibrage des héros\n\nObjectif : **chaque héros** doit avoir un rôle clair dans la <u>synergie d'équipe</u>.\n\n## Statistiques de base\n\n| Héros | Rôle | PV | Attaque | Synergie |\n| --- | --- | --- | --- | --- |\n| Rayner | Tank | 1200 | 85 | **Bouclier** |\n| Mira | Soutien | 800 | 60 | Soin de zone |\n| Kael | Dégâts | 700 | 140 | <u>Critique</u> |\n\n## À faire\n\n- Réduire l'attaque de Kael de 10 %\n- Tester le soin de Mira sur 3 ennemis\n- ~~Ajouter un quatrième héros~~ reporté\n\n> Note : valeurs provisoires, à valider après le prochain playtest.\n");
      note(dc, "Compte rendu — atelier de cadrage", "# Atelier de cadrage\n\n**Participants :** Camille, Hugo, Jean\n\n## Décisions\n\n| Sujet | Décision | Échéance |\n| --- | --- | --- |\n| Patterns de combat | Prototype jouable | <span style=\"color: #d6336c\">J+10</span> |\n| Outil d'éditeur | Timeline des interactions | J+20 |\n\n<p style=\"text-align: center\">Prochain point : <b>vendredi</b></p>\n");
      note(ap, "Liste de contrôle — direction artistique", "# Direction artistique\n\n1. Valider la palette\n2. Créer les fiches créatures\n3. Relire les prompts d'illustration\n\n<span style=\"font-size: 24px; font-family: Georgia, serif\">Texte en grand, police à empattements</span>\n");
      d.prompts.push({ id: U.uid(), name: "Rayner — héros (démo)", tab: "perso", prompt: "[superhero, man, mid 30s, tanned skin, short neatly styled hair in dark brown, steel blue eyes, strong jawline, athletic build, tattered leather duster over a dark bodysuit, scar across the left cheek, blue energy crackling along the arm]\n\nstylized semi-3D animated cinematic still, low-poly faceted shading, ruined city street at dusk, dramatic rim light, cinematic 16:9 framing", negative: "photorealistic, 3D render, plastic skin, extra fingers, deformed hands, blurry face, text, watermark", raw: {}, projectId: ap.id, favorite: true, createdAt: Date.now() - 2 * 86400000 });
      const entries = [[-1, "09:00", 150, hd, "Synergie d'équipe — équilibrage", true], [-1, "14:00", 240, dc, "Prototype du système de patterns", true], [-2, "09:30", 420, dc, "Outil d'éditeur — timeline", true], [-3, "10:00", 180, hd, "Build Android et tests appareils", true], [-3, "14:30", 90, ap, "Mise à jour du style des prompts", false], [-4, "09:00", 360, hd, "Écran de suivi des quêtes", true], [-7, "09:00", 420, dc, "Atelier de cadrage et prototypage", true], [-8, "13:00", 300, hd, "Export CSV du contenu", true], [-9, "09:30", 240, ap, "Visuels de créatures", false], [-10, "10:00", 390, dc, "Système de patterns — première itération", true], [-14, "09:00", 420, hd, "Cinématique d'introduction", true], [-15, "09:30", 300, dc, "Documentation technique", true]];
      entries.forEach(([off, start, minutes, project, description, billable]) => d.timeEntries.push({ id: U.uid(), createdAt: Date.now(), date: day(off), start, minutes, projectId: project.id, taskId: "", description, billable }));
      d.settings.billing.hourlyRate = 6500;
      store.audit("demo", "Données de démonstration chargées");
    });

    // ----- documents, issued in chronological order -----
    const db = store.db(), pf = db.clients[0], lu = db.clients[1], or = db.clients[2], ma = db.clients[3];
    const mk = (type, q, patch) => Object.assign(HQ.docs.newDraft(type, store.db(), q || {}), patch);
    const ln = (desc, qty, unit, label = "jour") => ({ id: U.uid(), desc, qty, unit, unitLabel: label, discount: 0, vat: 20 });
    const issue = async (draft) => { const r = await HQ.docs.issue(draft); if (!r.ok) throw new Error("demo: " + r.errors.join(" | ")); return r.doc; };
    const pay = (doc, date, amount, method = "Virement bancaire") => store.mutate((d) => { d.payments.push({ id: U.uid(), docId: doc.id, date, amount, method, note: "" }); });

    const q1 = await issue(mk("quote", { client: pf.id }, { issueDate: day(-75), validUntil: day(-45), notes: "Livraison en 3 itérations, démonstration à chaque fin de sprint.", lines: [ln("Développement gameplay Unity — système de combat", 12, 45000), ln("Outils d'éditeur — création de patterns", 4, 45000)] }));
    store.mutate((d) => { d.documents.find((x) => x.id === q1.id).status = "accepted"; });
    const dep = await issue(mk("deposit", { from: q1.id, pct: 30 }, { issueDate: day(-70), serviceDate: day(-70), dueDate: day(-55) }));
    pay(dep, day(-60), dep.totals.ttc);
    const i4 = await issue(mk("invoice", { client: lu.id }, { issueDate: day(-50), serviceDate: day(-50), dueDate: day(-20), lines: [ln("Intégration de l'interface de menus Unity", 5, 45000), ln("Documentation technique", 1, 30000, "forfait")] }));
    pay(i4, day(-22), i4.totals.ttc);
    const i3 = await issue(mk("invoice", { from: q1.id }, { issueDate: day(-35), serviceDate: day(-35), dueDate: day(-5) }));
    pay(i3, day(-15), 300000, "Virement bancaire");
    await issue(mk("invoice", { client: or.id }, { issueDate: day(-12), serviceDate: day(-14), dueDate: day(18), lines: [ln("Audit de performance et optimisation mobile", 3, 45000)] }));
    const cr = mk("credit", { from: i4.id }, { issueDate: day(-8) }); cr.lines = [Object.assign(ln("Remise commerciale — documentation non livrée", -1, 30000, "forfait"))];
    await issue(cr);
    await issue(mk("quote", { client: ma.id }, { issueDate: day(-6), validUntil: day(24), lines: [ln("Intégration audio et jingle d'ouverture", 2, 45000)] }));
    const draft = mk("invoice", { client: pf.id }, { issueDate: T, serviceDate: T, dueDate: day(30), lines: [ln("Maintenance et évolutions — mois en cours", 3, 45000)] });
    store.mutate((d) => { d.documents.push(draft); });
    await store.saveNow();
  };
})();
