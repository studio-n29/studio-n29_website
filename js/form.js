/* Contact form — Web3Forms (public client-side access key, same as the previous site) */
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("contact-form");
  if (!form) return;
  const status = document.getElementById("form-status");
  const btn = form.querySelector("button[type=submit]");
  const t = (k) => (window.N29 && window.N29.t(k)) || "";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (form.querySelector('[name="botcheck"]').value) return; // honeypot
    const label = btn.textContent;
    btn.disabled = true;
    btn.textContent = t("form.sending") || "…";
    status.className = "form-status";
    status.textContent = "";
    try {
      const res = await fetch("https://api.web3forms.com/submit", { method: "POST", body: new FormData(form) });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "web3forms error");
      status.textContent = t("form.ok");
      status.classList.add("ok");
      form.reset();
    } catch (err) {
      console.error("Contact form:", err);
      status.textContent = t("form.err");
      status.classList.add("err");
    } finally {
      btn.disabled = false;
      btn.textContent = label;
    }
  });
});
