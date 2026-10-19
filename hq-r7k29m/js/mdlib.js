/* N29 HQ — Markdown <-> HTML for the document editor.
   Documents are stored as Markdown (.md). Formatting Markdown cannot express (underline, font, size, colour, alignment)
   is kept as inline HTML, which every Markdown renderer accepts.
   Everything that enters the editor (imported .md, pasted HTML) is sanitised: this code runs next to the vault key. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const M = (HQ.md = {});

  const TAGS = ["p", "br", "h1", "h2", "h3", "h4", "strong", "b", "em", "i", "u", "s", "strike", "del", "span", "a", "ul", "ol", "li", "blockquote", "pre", "code", "hr", "table", "thead", "tbody", "tr", "th", "td", "div", "sub", "sup", "mark"];
  const ATTRS = ["href", "title", "style", "target", "rel", "colspan", "rowspan", "align"];
  const PROPS = new Set(["font-family", "font-size", "color", "background-color", "text-align", "font-weight", "font-style", "text-decoration", "text-decoration-line"]);
  const okValue = (prop, v) => {
    v = v.trim();
    if (/url\s*\(|expression|javascript:|@import|[<>{}\\]/i.test(v)) return false;
    if (prop === "font-size") return /^\d+(\.\d+)?(px|pt|em|rem|%)$/.test(v);
    if (prop === "font-family") return /^[\w\s,'"-]+$/.test(v);
    if (prop === "text-align") return /^(left|right|center|justify)$/.test(v);
    if (prop === "font-weight") return /^(normal|bold|[1-9]00)$/.test(v);
    if (prop === "font-style") return /^(normal|italic)$/.test(v);
    if (prop === "text-decoration" || prop === "text-decoration-line") return /^[a-z\s-]+$/.test(v);
    return /^(#[0-9a-f]{3,8}|rgba?\([\d\s.,%]+\)|[a-z]{3,20})$/i.test(v); // colours
  };
  const cleanStyle = (style) => style.split(";").map((d) => d.split(/:(.*)/s)).filter((p) => p.length > 1 && PROPS.has(p[0].trim().toLowerCase()) && okValue(p[0].trim().toLowerCase(), p[1])).map((p) => `${p[0].trim().toLowerCase()}: ${p[1].trim()}`).join("; ");

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.hasAttribute && node.hasAttribute("style")) { const s = cleanStyle(node.getAttribute("style")); if (s) node.setAttribute("style", s); else node.removeAttribute("style"); }
    if (node.tagName === "A") { node.setAttribute("target", "_blank"); node.setAttribute("rel", "noopener noreferrer"); }
  });
  M.sanitize = (html) => DOMPurify.sanitize(String(html || ""), { ALLOWED_TAGS: TAGS, ALLOWED_ATTR: ATTRS, ALLOW_DATA_ATTR: false });

  M.toHtml = (md) => M.sanitize(marked.parse(String(md || ""), { gfm: true, breaks: false, async: false }));

  const attr = (s) => String(s).replace(/"/g, "&quot;");
  const td = new TurndownService({ headingStyle: "atx", codeBlockStyle: "fenced", bulletListMarker: "-", emDelimiter: "*", strongDelimiter: "**", hr: "---" });
  td.use(turndownPluginGfm.gfm);
  // Canonical Markdown: "- item", "1. item" (single space) and ~~strike~~
  td.addRule("strike", { filter: ["del", "s", "strike"], replacement: (c) => (c.trim() ? "~~" + c + "~~" : c) });
  td.addRule("listItem", { filter: "li", replacement: (content, node, options) => {
    let prefix = options.bulletListMarker + " ";
    const parent = node.parentNode;
    if (parent.nodeName === "OL") { const start = parent.getAttribute("start"), i = Array.prototype.indexOf.call(parent.children, node); prefix = (start ? Number(start) + i : i + 1) + ". "; }
    content = content.replace(/^\n+/, "").replace(/\n+$/, "\n").replace(/\n/gm, "\n" + " ".repeat(prefix.length));
    return prefix + content + (node.nextSibling && !/\n$/.test(content) ? "\n" : "");
  } });
  td.addRule("underline", { filter: ["u"], replacement: (c) => (c.trim() ? `<u>${c}</u>` : c) });
  td.addRule("highlight", { filter: ["mark"], replacement: (c) => (c.trim() ? `<mark>${c}</mark>` : c) });
  td.addRule("subsup", { filter: ["sub", "sup"], replacement: (c, n) => `<${n.nodeName.toLowerCase()}>${c}</${n.nodeName.toLowerCase()}>` });
  td.addRule("styledSpan", { filter: (n) => n.nodeName === "SPAN" && !!n.getAttribute("style"), replacement: (c, n) => (c.trim() ? `<span style="${attr(n.getAttribute("style"))}">${c}</span>` : c) });
  td.addRule("tableBreak", { filter: (n) => n.nodeName === "BR" && !!n.closest && !!n.closest("td,th"), replacement: (c, n) => (n.nextSibling ? "<br>" : "") });
  td.addRule("emptyPara", { filter: (n) => n.nodeName === "P" && !n.textContent.trim() && !n.querySelector("img") && !n.closest("td,th"), replacement: () => "" });
  td.addRule("alignedBlock", { filter: (n) => /^(P|H[1-6]|DIV)$/.test(n.nodeName) && /text-align/.test(n.getAttribute("style") || ""), replacement: (c, n) => `\n\n${n.outerHTML}\n\n` });
  // Pasted tables often have no header row; GFM needs one, so the first row becomes the header.
  function withHeaders(html) {
    const t = document.createElement("template"); t.innerHTML = html;
    t.content.querySelectorAll("table").forEach((tb) => {
      const first = tb.querySelector("tr"); if (!first || first.querySelector("th")) return;
      [...first.children].forEach((c) => { const th = document.createElement("th"); th.innerHTML = c.innerHTML; c.replaceWith(th); });
    });
    return t.innerHTML;
  }
  M.fromHtml = (html) => td.turndown(withHeaders(M.sanitize(html))).replace(/\n{3,}/g, "\n\n").trim() + "\n";

  // Short plain-text excerpt for lists and search.
  M.plain = (md) => String(md || "").replace(/<[^>]+>/g, " ").replace(/[#*_`>|~-]+/g, " ").replace(/\[([^\]]*)\]\([^)]*\)/g, "$1").replace(/\s+/g, " ").trim();
})();
