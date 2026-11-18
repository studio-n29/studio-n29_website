import { SITE, EMAIL, MALT, LINKEDIN, ACCESS_KEY, t, tx } from "../data.mjs";
import { head, header, footer, scripts, wishlist } from "../layout.mjs";

export const render = () => {
  const p = "";
  return `${head({ title: t("page.contact.title"), desc: t("page.contact.desc"), prefix: p, canonical: SITE + "/contact.html", page: "contact" })}
<body>
${header(p, "contact")}
<main id="main">
  <section class="page-head">
    <div class="wrap">
      ${tx("span", "c.eyebrow", "eyebrow")}
      ${tx("h1", "c.title", "page-title")}
      ${tx("p", "c.lead", "lead")}
    </div>
  </section>

  <section class="section" style="padding-top:2rem">
    <div class="wrap contact-grid">
      <div class="reveal">
        ${tx("h2", "c.pro.title", "block-title")}
        ${tx("p", "contact.lead", "lead")}
        <div class="contact-list">
          <a href="mailto:${EMAIL}">${tx("small", "contact.email")}<span>${EMAIL}</span></a>
          <a href="${LINKEDIN}" target="_blank" rel="noopener">${tx("small", "contact.linkedin")}<span>linkedin.com/in/djason-nathiez</span></a>
          <a href="${MALT}" target="_blank" rel="noopener">${tx("small", "contact.malt")}<span>malt.fr/profile/djasonnathiez</span></a>
          <div>${tx("small", "contact.where")}${tx("span", "contact.where.v")}</div>
        </div>
        <aside class="player-box">
          ${tx("h3", "c.players.title")}
          ${tx("p", "c.players.d")}
          <p>${wishlist("btn--sm")}</p>
        </aside>
      </div>
      <form class="form reveal" id="contact-form" style="--d:.1s">
        <input type="hidden" name="access_key" value="${ACCESS_KEY}">
        <input type="hidden" name="subject" value="Nouveau message — site STUDIO N29">
        <input type="hidden" name="from_name" value="Site STUDIO N29">
        <input class="hp" type="text" name="botcheck" tabindex="-1" autocomplete="off" aria-hidden="true">
        <div class="field">${tx("label", "form.name", "", false, 'for="f-name"')}<input id="f-name" name="name" type="text" autocomplete="name" required></div>
        <div class="field">${tx("label", "form.email", "", false, 'for="f-email"')}<input id="f-email" name="email" type="email" autocomplete="email" required></div>
        <div class="field">${tx("label", "form.topic", "", false, 'for="f-topic"')}
          <select id="f-topic" name="topic" required>
            <option value="" disabled selected data-i18n="form.topic.0">${t("form.topic.0")}</option>
            <option value="freelance" data-i18n="form.topic.1">${t("form.topic.1")}</option>
            <option value="collab" data-i18n="form.topic.2">${t("form.topic.2")}</option>
            <option value="other" data-i18n="form.topic.3">${t("form.topic.3")}</option>
          </select></div>
        <div class="field">${tx("label", "form.message", "", false, 'for="f-message"')}<textarea id="f-message" name="message" required></textarea></div>
        <button class="btn btn--solid" type="submit" data-i18n="form.send">${t("form.send")}</button>
        <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
      </form>
    </div>
  </section>
</main>
${footer(p)}
${scripts(p, { form: true })}`;
};
