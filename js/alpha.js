/* Android Alpha sign-up: POSTs the email (+ consent) to the public, insert-only Supabase table site_alpha_signups.
   A duplicate address (HTTP 409) is reported as a success, so the form never reveals who is already registered.
   Visible states: sending (spinner, fields locked) -> done (the form is replaced by a confirmation panel) | error (message + shake). */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("alpha-form");
  if (!form) return;
  const box = form.closest(".alpha-box");
  const status = document.getElementById("alpha-status");
  const done = document.getElementById("alpha-done");
  const sentTo = document.getElementById("alpha-sent-to");
  const again = document.getElementById("alpha-again");
  const btn = form.querySelector('button[type="submit"]');
  const t = (k) => (window.N29 && window.N29.t(k)) || "";
  const say = (msg, cls = "") => { status.textContent = msg; status.className = "form-status " + cls; };
  const lock = (on) => { [...form.elements].forEach((el) => { el.disabled = on; }); btn.classList.toggle("is-loading", on); box.dataset.state = on ? "sending" : "idle"; };
  const fail = (msg) => {
    say(msg, "err");
    form.classList.remove("is-error"); void form.offsetWidth; form.classList.add("is-error"); // restart the shake animation
  };

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.elements.botcheck.value) return; // honeypot: bots fill hidden fields
    const email = form.elements.email.value.trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) { form.elements.email.focus(); return fail(t("alpha.bad")); }
    if (!form.elements.consent.checked) return fail(t("alpha.noconsent"));

    say("");
    lock(true);
    try {
      const res = await fetch(`${form.dataset.url}/rest/v1/site_alpha_signups`, {
        method: "POST",
        headers: { apikey: form.dataset.key, "Content-Type": "application/json", Prefer: "return=minimal" },
        body: JSON.stringify({ email, consent: true, lang: document.documentElement.lang === "fr" ? "fr" : "en", source: "website" }),
      });
      if (!res.ok && res.status !== 409) throw new Error("HTTP " + res.status);
      sentTo.textContent = email;
      form.reset();
      lock(false);
      box.dataset.state = "done";
      form.hidden = true;
      done.hidden = false;
      done.focus({ preventScroll: true });
    } catch (err) {
      lock(false);
      fail(`${t("alpha.err")} ${form.dataset.mail}`);
    }
  });

  again.addEventListener("click", () => {
    done.hidden = true;
    form.hidden = false;
    box.dataset.state = "idle";
    say("");
    form.elements.email.focus();
  });
});
