/* N29 HQ — import of files and whole folders into the project documents.
   .md/.txt  -> editable document;  .xlsx/.xls/.ods/.csv -> editable document made of Markdown tables (+ original kept locally);
   .pdf      -> viewable document (+ extracted text for search). Anything else is skipped and reported. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const I = (HQ.importer = {});

  const LIMITS = { md: 2e6, pdf: 40e6, sheet: 15e6, files: 600, rows: 2000, cols: 40 };
  const KINDS = { md: ["md", "markdown", "txt"], pdf: ["pdf"], sheet: ["xlsx", "xlsm", "xls", "ods", "csv", "tsv"] };
  I.ACCEPT = ".md,.markdown,.txt,.pdf,.xlsx,.xlsm,.xls,.ods,.csv,.tsv,text/markdown,text/plain,application/pdf,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
  const ext = (n) => (/\.([^.\/\\]+)$/.exec(n) || [])[1] ? /\.([^.\/\\]+)$/.exec(n)[1].toLowerCase() : "";
  I.kind = (name) => { const e = ext(name); return Object.keys(KINDS).find((k) => KINDS[k].includes(e)) || null; };
  const baseName = (n) => n.replace(/^.*[\/\\]/, "").replace(/\.[^.]+$/, "");
  const IGNORED = /^(\.|~\$|thumbs\.db$|desktop\.ini$)|^(node_modules|__macosx)$/i;
  const ignored = (path) => path.split("/").some((s) => IGNORED.test(s));

  const scripts = {};
  I.load = (src) => scripts[src] || (scripts[src] = new Promise((res, rej) => { const s = document.createElement("script"); s.src = src; s.onload = res; s.onerror = () => { delete scripts[src]; rej(new Error("Bibliothèque introuvable : " + src)); }; document.head.appendChild(s); }));
  I.loadSheets = async () => { if (!window.XLSX) await I.load("js/vendor/xlsx.mini.min.js"); return window.XLSX; };
  I.loadPdf = async () => { if (!window.pdfjsLib) await I.load("js/vendor/pdf.min.js"); window.pdfjsLib.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js"; return window.pdfjsLib; };

  // ---------- spreadsheet -> Markdown tables ----------
  const cell = (v) => String(v == null ? "" : v).replace(/\r?\n/g, "<br>").replace(/\|/g, "\\|").trim();
  I.sheetToMd = async (buf, name) => {
    const X = await I.loadSheets();
    const wb = X.read(buf, { type: "array", cellDates: true });
    const parts = [`# ${baseName(name)}`], notes = [];
    for (const sn of wb.SheetNames) {
      const rows = X.utils.sheet_to_json(wb.Sheets[sn], { header: 1, raw: false, defval: "", blankrows: false });
      while (rows.length && rows[rows.length - 1].every((c) => c === "")) rows.pop();
      if (!rows.length) continue;
      let width = Math.max(...rows.map((r) => r.length));
      if (width > LIMITS.cols) { notes.push(`« ${sn} » : ${width - LIMITS.cols} colonne(s) ignorée(s)`); width = LIMITS.cols; }
      let used = rows;
      if (rows.length > LIMITS.rows + 1) { notes.push(`« ${sn} » : ${rows.length - 1 - LIMITS.rows} ligne(s) ignorée(s)`); used = rows.slice(0, LIMITS.rows + 1); }
      const pad = (r) => Array.from({ length: width }, (_, i) => cell(r[i]));
      const head = pad(used[0]).map((c, i) => c || `Col ${i + 1}`);
      parts.push(`## ${sn}\n\n| ${head.join(" | ")} |\n| ${head.map(() => "---").join(" | ")} |\n${used.slice(1).map((r) => `| ${pad(r).join(" | ")} |`).join("\n")}`.trimEnd());
    }
    if (parts.length === 1) parts.push("*Classeur vide.*");
    return { md: parts.join("\n\n") + "\n", notes };
  };

  // ---------- PDF ----------
  I.pdfInfo = async (buf) => {
    const lib = await I.loadPdf();
    const doc = await lib.getDocument({ data: new Uint8Array(buf.slice(0)) }).promise;
    let text = "";
    for (let i = 1; i <= Math.min(doc.numPages, 60) && text.length < 60000; i++) {
      try { const c = await (await doc.getPage(i)).getTextContent(); text += c.items.map((x) => x.str).join(" ") + "\n"; } catch (e) { /* unreadable page */ }
    }
    const pages = doc.numPages; doc.destroy();
    return { pages, text: text.replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 60000) };
  };

  // ---------- picking / dropping ----------
  // Files from <input multiple> or <input webkitdirectory>
  I.fromInput = (fileList) => [...fileList].map((f) => ({ file: f, path: (f.webkitRelativePath || f.name).replace(/\\/g, "/") }));
  // Files and folders from a drop event (walks directories)
  I.fromDrop = async (dt) => {
    const out = [];
    const walk = async (entry, prefix) => {
      if (entry.isFile) await new Promise((res) => entry.file((f) => { out.push({ file: f, path: prefix + f.name }); res(); }, res));
      else if (entry.isDirectory) {
        const reader = entry.createReader();
        for (;;) { const batch = await new Promise((res) => reader.readEntries(res, () => res([]))); if (!batch.length) break; for (const e of batch) await walk(e, prefix + entry.name + "/"); }
      }
    };
    const entries = [...dt.items].filter((i) => i.kind === "file").map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null));
    if (entries.some(Boolean)) { for (const e of entries) if (e) await walk(e, ""); }
    else I.fromInput(dt.files).forEach((x) => out.push(x));
    return out;
  };

  // ---------- main import ----------
  const readText = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsText(f); });
  const readBuf = (f) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsArrayBuffer(f); });
  const title1 = (md, fallback) => { const m = /^#\s+(.+)$/m.exec(md || ""); return m ? m[1].replace(/[*_`~<>]/g, "").trim().slice(0, 120) : fallback; };
  const fold = (s) => s.toLowerCase();

  // entries: [{file, path}] -> report. Folders in the paths are recreated under `folderId`.
  I.run = async (entries, { projectId = "", folderId = "" } = {}, onProgress) => {
    const U = HQ.util, store = HQ.store, db = store.db();
    const rep = { notes: 0, folders: 0, pdf: 0, sheets: 0, md: 0, skipped: [], failed: [], notes2: [] };
    const todo = entries.filter((e) => !ignored(e.path));
    rep.skippedHidden = entries.length - todo.length;
    if (todo.length > LIMITS.files) { rep.failed.push(`Trop de fichiers (${todo.length}) : ${LIMITS.files} au maximum par import.`); return rep; }
    const newFolders = [], newNotes = [], folderKey = new Map();
    const exists = (pid, parent, name) => db.folders.find((f) => (f.projectId || "") === pid && (f.parentId || "") === parent && fold(f.name) === fold(name)) || newFolders.find((f) => f.projectId === pid && f.parentId === parent && fold(f.name) === fold(name));
    const ensure = (segments) => {
      let parent = folderId;
      segments.forEach((name) => {
        const key = parent + "/" + fold(name);
        let id = folderKey.get(key);
        if (!id) {
          const found = exists(projectId, parent, name);
          if (found) id = found.id; else { id = U.uid(); newFolders.push({ id, name: name.slice(0, 80), projectId, parentId: parent, createdAt: Date.now() }); rep.folders++; }
          folderKey.set(key, id);
        }
        parent = id;
      });
      return parent;
    };
    let i = 0;
    for (const { file, path } of todo) {
      i++; onProgress && onProgress(i, todo.length, file.name);
      const k = I.kind(file.name);
      if (!k) { rep.skipped.push(path); continue; }
      if (file.size > LIMITS[k]) { rep.failed.push(`${path} : fichier trop volumineux (${Math.round(file.size / 1e6)} Mo, maximum ${Math.round(LIMITS[k] / 1e6)} Mo).`); continue; }
      try {
        const segs = path.split("/").slice(0, -1), fid = ensure(segs), id = U.uid(), now = Date.now();
        const base = { id, projectId, folderId: fid, createdAt: now, updatedAt: now };
        if (k === "md") { const md = await readText(file); newNotes.push(Object.assign(base, { title: title1(md, baseName(file.name)), md, kind: "md" })); rep.md++; }
        else if (k === "sheet") {
          const { md, notes } = await I.sheetToMd(await readBuf(file), file.name);
          if (HQ.files.available()) await HQ.files.put(id, file);
          newNotes.push(Object.assign(base, { title: baseName(file.name), md, kind: "sheet", file: { name: file.name, size: file.size, mime: file.type } })); rep.sheets++; notes.forEach((n) => rep.notes2.push(`${file.name} — ${n}`));
        } else {
          const buf = await readBuf(file), info = await I.pdfInfo(buf);
          await HQ.files.put(id, file);
          newNotes.push(Object.assign(base, { title: baseName(file.name), md: "", kind: "pdf", text: info.text, pages: info.pages, file: { name: file.name, size: file.size, mime: "application/pdf" } })); rep.pdf++;
        }
      } catch (e) { rep.failed.push(`${path} : ${e.message || "illisible"}`); }
    }
    if (newFolders.length || newNotes.length) store.mutate((d) => { d.folders.push(...newFolders); d.notes.push(...newNotes); });
    rep.notes = newNotes.length;
    return rep;
  };
})();
