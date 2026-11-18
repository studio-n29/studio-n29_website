(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav");

    // Header turns solid once the page scrolls
    const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // Mobile menu
    const closeMenu = () => {
      burger.setAttribute("aria-expanded", "false");
      nav.classList.remove("is-open");
      header.classList.remove("menu-open");
    };
    burger.addEventListener("click", () => {
      const open = burger.getAttribute("aria-expanded") !== "true";
      burger.setAttribute("aria-expanded", String(open));
      nav.classList.toggle("is-open", open);
      header.classList.toggle("menu-open", open);
    });
    nav.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });

    // Reveal on scroll
    const targets = document.querySelectorAll(".reveal");
    if ("IntersectionObserver" in window && !reduce) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); } });
      }, { threshold: 0.1, rootMargin: "0px 0px -5% 0px" });
      targets.forEach((t) => io.observe(t));
    } else {
      targets.forEach((t) => t.classList.add("is-in"));
    }

    // Sticky sub-navigation: highlight the section being read
    const links = [...document.querySelectorAll('.subnav a[href^="#"]')];
    const sections = links.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
      const so = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href") === "#" + en.target.id));
        });
      }, { rootMargin: "-40% 0px -55% 0px" });
      sections.forEach((s) => so.observe(s));
    }

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
