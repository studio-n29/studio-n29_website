(() => {
  const root = document.documentElement;
  root.classList.add("js");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    const header = document.querySelector(".site-header");
    const burger = document.querySelector(".burger");
    const nav = document.querySelector(".nav");

    // Header state
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
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
      targets.forEach((t) => io.observe(t));
    } else {
      targets.forEach((t) => t.classList.add("is-in"));
    }

    // Active section in nav (home page only)
    const links = [...nav.querySelectorAll('a[href^="#"], a[href^="index.html#"], a[href^="../index.html#"]')];
    const sections = links.map((a) => document.getElementById(a.getAttribute("href").split("#")[1])).filter(Boolean);
    if (sections.length && "IntersectionObserver" in window) {
      const so = new IntersectionObserver((entries) => {
        entries.forEach((en) => {
          if (!en.isIntersecting) return;
          links.forEach((a) => a.classList.toggle("is-active", a.getAttribute("href").endsWith("#" + en.target.id)));
        });
      }, { rootMargin: "-45% 0px -50% 0px" });
      sections.forEach((s) => so.observe(s));
    }

    // Custom cursor (fine pointers only)
    const cursor = document.querySelector(".cursor");
    if (cursor && matchMedia("(hover: hover) and (pointer: fine)").matches && !reduce) {
      let x = 0, y = 0, cx = 0, cy = 0;
      window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; cursor.classList.add("is-visible"); }, { passive: true });
      document.addEventListener("mouseleave", () => cursor.classList.remove("is-visible"));
      const loop = () => {
        cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0) skewX(-14deg)`;
        requestAnimationFrame(loop);
      };
      loop();
      document.querySelectorAll("a, button, select, .card").forEach((el) => {
        el.addEventListener("mouseenter", () => cursor.classList.add("is-hover"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("is-hover"));
      });
    }

    // Page transition (slash wipe between pages)
    const slash = document.querySelector(".page-slash");
    if (slash && !reduce) {
      try { if (sessionStorage.getItem("n29-nav")) { slash.classList.add("is-entering"); sessionStorage.removeItem("n29-nav"); } } catch (e) { /* ignore */ }
      document.querySelectorAll("a[href]").forEach((a) => {
        const href = a.getAttribute("href");
        const external = a.target === "_blank" || /^(https?:|mailto:|tel:|#)/.test(href) || a.hasAttribute("download");
        if (external) return;
        const sameDoc = href.startsWith("#") || (href.split("#")[0] === "" );
        if (sameDoc) return;
        a.addEventListener("click", (e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey) return;
          e.preventDefault();
          try { sessionStorage.setItem("n29-nav", "1"); } catch (err) { /* ignore */ }
          slash.classList.add("is-leaving");
          setTimeout(() => { window.location.href = a.href; }, 450);
        });
      });
    }
    // Back/forward cache: make sure the wipe never stays on screen
    window.addEventListener("pageshow", (e) => { if (e.persisted && slash) slash.classList.remove("is-leaving"); });

    const year = document.getElementById("year");
    if (year) year.textContent = new Date().getFullYear();
  });
})();
