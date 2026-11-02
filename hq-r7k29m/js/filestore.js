/* N29 HQ — binary attachments (PDF, spreadsheets) kept in this browser's IndexedDB, keyed by document id.
   They are not part of the synced vault (too large): the document record syncs, the file stays on the device that imported it. */
(function () {
  "use strict";
  const HQ = (window.HQ = window.HQ || {});
  const open = () => new Promise((res, rej) => { const r = indexedDB.open("n29hq-files", 1); r.onupgradeneeded = () => r.result.createObjectStore("files"); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const tx = async (mode, fn) => { const db = await open(); return new Promise((res, rej) => { const t = db.transaction("files", mode), r = fn(t.objectStore("files")); t.oncomplete = () => { db.close(); res(r && r.result); }; t.onerror = () => { db.close(); rej(t.error); }; }); };
  HQ.files = {
    available: () => "indexedDB" in window,
    put: (id, blob) => tx("readwrite", (s) => s.put(blob, id)),
    get: async (id) => { try { return (await tx("readonly", (s) => s.get(id))) || null; } catch (e) { return null; } },
    remove: async (id) => { try { await tx("readwrite", (s) => s.delete(id)); } catch (e) { /* ignore */ } },
    has: async (id) => !!(await HQ.files.get(id)),
  };
})();
