/* Android Alpha sign-up: POSTs the email (+ consent) to the public, insert-only Supabase table site_alpha_signups.
   A duplicate address (HTTP 409) is reported as a success, so the form never reveals who is already registered. */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("alpha-form");
  if (!form) return;
  const status = document.getElementById("alpha-status");
  const btn = form.querySelector('button[type="submit"]');
  const t = (k) => (window.N29 && window.N29.t(k)) || "";
  const say = (msg, cls = "") => { status.textContent = msg; status.className = "form-status " + cls; };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.botcheck.value) return; // honeypot: bots fill hidden fields
    const email = form.elements.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return say(t("alpha.bad"), "err");
    if (!form.elements.consent.checked) return say(t("alpha.noconsent"), "err");

    btn.disabled = true;
    say(t("alpha.sending"));
    try {
      const res = await fetch(`${form.dataset.url}/rest/v1/site_alpha_signups`, {
        method: "POST",
        headers: { apikey: form.dataset.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ email, consent: true, lang: document.documentElement.lang === "fr" ? "fr" : "en", source: "website" }),
      });
      if (!res.ok && res.status !== 409) throw new Error("HTTP " + res.status);
      say(t("alpha.ok"), "ok");
      form.reset();
    } catch (err) {
      say(`${t("alpha.err")} ${form.dataset.mail}`, "err");
    } finally {
      btn.disabled = false;
    }
  });
});
