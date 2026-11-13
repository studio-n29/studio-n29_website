/* N29 HQ — explorer model: pure, DOM-free queries / sort / prefs / recents (HQ.exm). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.HQ = root.HQ || {}).exm = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---- Tree queries ---- */
  const MAX_DEPTH = 50;
  function folderMap(db) { return new Map((db.folders || []).map((f) => [f.id, f])); }

  function ancestors(db, folderId) {
    const map = folderMap(db), out = [], seen = new Set();
    let id = folderId;
    while (id && map.has(id) && !seen.has(id) && out.length < MAX_DEPTH) {
      seen.add(id); const f = map.get(id); out.unshift(f); id = f.parentId;
    }
    return out;
  }

  function isTrashed(db, id) {
    const trash = new Set((db.trash || []).map((t) => t.id));
    if (!trash.size) return false;
    if (trash.has(id)) return true;
    const note = (db.notes || []).find((n) => n.id === id);
    const start = note ? note.folderId : id;
    return ancestors(db, start).some((f) => trash.has(f.id));
  }

  function listFolder(db, target) {
    const fid = target.folderId || "";
    const own = fid ? (db.folders || []).find((f) => f.id === fid) : null;
    const pid = own ? own.projectId || "" : target.projectId || "";
    const trash = new Set((db.trash || []).map((t) => t.id));
    const memo = new Map();
    const folderTrashed = (id) => {
      if (memo.has(id)) return memo.get(id);
      let r = false;
      for (const f of ancestors(db, id)) if (trash.has(f.id)) { r = true; break; }
      memo.set(id, r); return r;
    };
    const folders = (db.folders || []).filter((f) => (f.projectId || "") === pid && (f.parentId || "") === fid && !trash.has(f.id) && !folderTrashed(f.id));
    const notes = (db.notes || []).filter((n) => (n.projectId || "") === pid && (n.folderId || "") === fid && !trash.has(n.id) && !(fid && folderTrashed(fid)));
    return { folders, notes };
  }

  function descendantIds(db, folderId) {
    const folders = [], seen = new Set([folderId]), queue = [folderId];
    while (queue.length) {
      const cur = queue.shift();
      for (const f of db.folders || []) if (f.parentId === cur && !seen.has(f.id)) { seen.add(f.id); folders.push(f.id); queue.push(f.id); }
    }
    const inTree = new Set([folderId, ...folders]);
    const notes = (db.notes || []).filter((n) => inTree.has(n.folderId)).map((n) => n.id);
    return { folders, notes };
  }

  /* ---- Items & sort ---- */
  function toItems(folders, notes) {
    return [
      ...(folders || []).map((rec) => ({ type: "folder", rec })),
      ...(notes || []).map((rec) => ({ type: "note", rec })),
    ];
  }

  const SORT_KEYS = ["name", "modified", "created", "type", "size"];
  const TYPE_LABEL = { md: "Document", sheet: "Tableur", pdf: "PDF" };
  const collator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });
  const nameOf = (it) => String((it.type === "folder" ? it.rec.name : it.rec.title) || "");
  const typeOf = (it) => (it.type === "folder" ? "Dossier" : TYPE_LABEL[it.rec.kind] || String(it.rec.kind || ""));
  const valueOf = {
    name: nameOf,
    modified: (it) => it.rec.updatedAt || it.rec.createdAt || 0,
    created: (it) => it.rec.createdAt || 0,
    type: typeOf,
    size: (it) => (it.rec.file && it.rec.file.size) || 0,
  };

  function sortItems(items, opts) {
    const key = SORT_KEYS.includes(opts && opts.key) ? opts.key : "name";
    const sign = opts && opts.dir === "desc" ? -1 : 1;
    const val = valueOf[key];
    const cmp = (a, b) => {
      const x = val(a), y = val(b);
      return typeof x === "string" ? collator.compare(x, y) : x - y;
    };
    return items.slice().sort((a, b) => {
      if (a.type !== b.type) return a.type === "folder" ? -1 : 1;
      const c = cmp(a, b);
      if (c) return sign * c;
      return collator.compare(nameOf(a), nameOf(b)) || (a.rec.id < b.rec.id ? -1 : a.rec.id > b.rec.id ? 1 : 0);
    });
  }

  /* ---- Preferences ---- */
  const DEFAULT_PREFS = { view: "list", sort: { key: "name", dir: "asc" } };
  const prefsKey = (projectId, folderId) => (folderId ? folderId : "root:" + (projectId || ""));
  const clonePrefs = () => ({ view: DEFAULT_PREFS.view, sort: { ...DEFAULT_PREFS.sort } });

  function readPrefs(storage, key) {
    try {
      const raw = storage.getItem("n29hq.explorer." + key);
      if (!raw) return clonePrefs();
      const p = JSON.parse(raw);
      if (!p || (p.view !== "list" && p.view !== "grid") || !p.sort || !SORT_KEYS.includes(p.sort.key) || (p.sort.dir !== "asc" && p.sort.dir !== "desc")) return clonePrefs();
      return { view: p.view, sort: { key: p.sort.key, dir: p.sort.dir } };
    } catch (e) { return clonePrefs(); }
  }
  function writePrefs(storage, key, prefs) {
    try { storage.setItem("n29hq.explorer." + key, JSON.stringify(prefs)); } catch (e) { /* ignore */ }
  }

  /* ---- Recents ---- */
  function pushRecent(list, id, max = 30) { return [id, ...(list || []).filter((x) => x !== id)].slice(0, max); }
  function readRecents(storage) {
    try {
      const a = JSON.parse(storage.getItem("n29hq.recents"));
      return Array.isArray(a) ? a.filter((x) => typeof x === "string") : [];
    } catch (e) { return []; }
  }
  function writeRecents(storage, list) {
    try { storage.setItem("n29hq.recents", JSON.stringify(list)); } catch (e) { /* ignore */ }
  }

  /* ---- Favorites / trash / move / search (mutators take the db inside store.mutate) ---- */
  const findNote = (db, id) => (db.notes || []).find((n) => n.id === id);
  const findFolder = (db, id) => (db.folders || []).find((f) => f.id === id);
  const itemById = (db, id) => {
    const f = findFolder(db, id); if (f) return { type: "folder", rec: f };
    const n = findNote(db, id); return n ? { type: "note", rec: n } : null;
  };
  const parentOf = (it) => (it.type === "folder" ? it.rec.parentId : it.rec.folderId) || "";
  const liveItem = (db, id) => { const it = itemById(db, id); return it && !isTrashed(db, id) ? it : null; };

  function isFavorite(db, id) { return (db.favorites || []).some((f) => f.id === id); }
  function toggleFavorite(db, id) {
    if (!itemById(db, id)) return false;
    db.favorites = db.favorites || [];
    if (isFavorite(db, id)) { db.favorites = db.favorites.filter((f) => f.id !== id); return false; }
    db.favorites.push({ id }); return true;
  }
  function favoritesView(db) { return (db.favorites || []).map((f) => liveItem(db, f.id)).filter(Boolean); }
  function recentsView(db, ids) { return (ids || []).map((id) => liveItem(db, id)).filter(Boolean); }

  function trashItems(db, ids, now) {
    db.trash = db.trash || [];
    let n = 0;
    for (const id of ids || []) {
      if (!itemById(db, id) || isTrashed(db, id)) continue;
      db.trash.push({ id, at: now }); n++;
    }
    return n;
  }
  function restoreItems(db, ids) {
    let n = 0;
    for (const id of ids || []) {
      if (!(db.trash || []).some((t) => t.id === id)) continue;
      db.trash = db.trash.filter((t) => t.id !== id); n++;
      const it = itemById(db, id), pid = it && parentOf(it);
      if (it && pid && isTrashed(db, pid)) { if (it.type === "folder") it.rec.parentId = ""; else it.rec.folderId = ""; }
    }
    return n;
  }
  // What restoreItems(db, ids) would do, without changing db: count = ids it restores (same value it returns),
  // toRoot = those that land at their project root because their parent folder is still effectively in the trash.
  function restoreInfo(db, ids) {
    const sim = Object.assign({}, db, { trash: (db.trash || []).slice() });
    let count = 0; const toRoot = [];
    for (const id of ids || []) {
      if (!sim.trash.some((t) => t.id === id)) continue;
      sim.trash = sim.trash.filter((t) => t.id !== id); count++;
      const it = itemById(db, id), pid = it && parentOf(it);
      if (it && pid && isTrashed(sim, pid)) toRoot.push(id);
    }
    return { count, toRoot };
  }
  function trashView(db) {
    const direct = new Set((db.trash || []).map((t) => t.id));
    const out = [];
    for (const t of db.trash || []) {
      const it = itemById(db, t.id); if (!it) continue;
      if (ancestors(db, parentOf(it)).some((f) => direct.has(f.id))) continue;
      out.push({ ...it, at: t.at });
    }
    return out.sort((a, b) => (b.at || 0) - (a.at || 0));
  }
  function purge(db, ids) {
    const fset = new Set(), nset = new Set();
    for (const id of ids || []) {
      if (findFolder(db, id)) { fset.add(id); const d = descendantIds(db, id); d.folders.forEach((x) => fset.add(x)); d.notes.forEach((x) => nset.add(x)); }
      else if (findNote(db, id)) nset.add(id);
    }
    db.folders = (db.folders || []).filter((f) => !fset.has(f.id));
    db.notes = (db.notes || []).filter((n) => !nset.has(n.id));
    const gone = (r) => fset.has(r.id) || nset.has(r.id);
    db.favorites = (db.favorites || []).filter((r) => !gone(r));
    db.trash = (db.trash || []).filter((r) => !gone(r));
    return { noteIds: [...nset].sort() };
  }
  function emptyTrash(db) { return purge(db, (db.trash || []).map((t) => t.id)); }
  function prune(db) {
    const keep = (r) => !!itemById(db, r.id);
    const fa = db.favorites || [], tr = db.trash || [];
    db.favorites = fa.filter(keep); db.trash = tr.filter(keep);
    return fa.length - db.favorites.length + tr.length - db.trash.length;
  }

  function topLevelIds(db, ids) {
    const set = new Set(ids || []), out = [], seen = new Set();
    for (const id of ids || []) {
      if (seen.has(id)) continue;
      seen.add(id);
      const it = itemById(db, id); if (!it) continue;
      if (ancestors(db, parentOf(it)).some((f) => set.has(f.id))) continue;
      out.push(id);
    }
    return out;
  }

  function canMove(db, ids, target) {
    const list = topLevelIds(db, ids);
    if ((ids || []).some((id) => !itemById(db, id))) return { ok: false, reason: "missing" };
    const items = list.map((id) => itemById(db, id));
    if (!list.length || items.some((it) => !it)) return { ok: false, reason: "missing" };
    const fid = (target && target.folderId) || "";
    const dest = fid ? findFolder(db, fid) : null;
    if (fid && !dest) return { ok: false, reason: "missing" };
    const pid = dest ? dest.projectId || "" : (target && target.projectId) || "";
    for (const it of items) {
      if (it.type !== "folder" || !fid) continue;
      if (it.rec.id === fid || descendantIds(db, it.rec.id).folders.includes(fid)) return { ok: false, reason: "into-self" };
    }
    if (fid && isTrashed(db, fid)) return { ok: false, reason: "trashed-target" };
    const moving = new Set(list);
    const taken = new Set(listFolder(db, { projectId: pid, folderId: fid }).folders.filter((f) => !moving.has(f.id)).map((f) => String(f.name || "").toLowerCase()));
    for (const it of items) {
      if (it.type !== "folder") continue;
      const k = String(it.rec.name || "").toLowerCase();
      if (taken.has(k)) return { ok: false, reason: "name-conflict" };
      taken.add(k);
    }
    return { ok: true };
  }
  function moveItems(db, ids, target, now) {
    const chk = canMove(db, ids, target);
    if (!chk.ok) throw new Error("cannot-move:" + chk.reason);
    const fid = target.folderId || "";
    const dest = fid ? findFolder(db, fid) : null;
    const pid = dest ? dest.projectId || "" : target.projectId || "";
    for (const id of topLevelIds(db, ids)) {
      const f = findFolder(db, id);
      if (f) {
        f.parentId = fid; f.projectId = pid;
        const d = descendantIds(db, id);
        for (const sid of d.folders) findFolder(db, sid).projectId = pid;
        for (const nid of d.notes) findNote(db, nid).projectId = pid;
      } else {
        const n = findNote(db, id);
        if ((n.folderId || "") === fid && (n.projectId || "") === pid) continue;
        n.folderId = fid; n.projectId = pid; n.updatedAt = now;
      }
    }
  }

  function search(db, q, scope, o) {
    const needle = o.norm(q || "").trim();
    if (!needle) return [];
    const type = scope && scope.type;
    let inFolders = null, inNotes = null;
    if (type === "folder") {
      if (!scope.folderId) return [];
      const d = descendantIds(db, scope.folderId);
      inFolders = new Set(d.folders); inNotes = new Set(d.notes);
    }
    const okProject = (rec) => type !== "project" || (rec.projectId || "") === scope.projectId;
    const live = (id) => !isTrashed(db, id);
    const folders = (db.folders || []).filter((f) => okProject(f) && (!inFolders || inFolders.has(f.id)) && live(f.id) && o.norm(f.name || "").includes(needle));
    const notes = (db.notes || []).filter((n) => okProject(n) && (!inNotes || inNotes.has(n.id)) && live(n.id) &&
      (o.norm(n.title || "").includes(needle) || o.norm(o.plain(n.md || "") + " " + (n.text || "")).includes(needle)));
    return toItems(folders, notes);
  }

  /* ---- Selection ---- */
  const EMPTY_SELECTION = Object.freeze({ ids: Object.freeze([]), anchor: null, mode: false });

  function selectStep(state, action) {
    const order = action.order || [];
    const inOrder = new Set(order);
    const cur = state || EMPTY_SELECTION;
    let ids = (cur.ids || []).filter((x) => inOrder.has(x));
    let anchor = cur.anchor && inOrder.has(cur.anchor) ? cur.anchor : null;
    let mode = !!cur.mode && ids.length > 0;
    const out = (activate) => ({ state: ids.length ? { ids, anchor, mode } : { ids: [], anchor: null, mode: false }, activate: activate || null });
    const toggle = (id) => {
      if (!inOrder.has(id)) return;
      ids = ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id];
      anchor = id; mode = true;
    };
    switch (action.type) {
      case "clear": return { state: { ids: [], anchor: null, mode: false }, activate: null };
      case "all": ids = order.slice(); mode = ids.length > 0; return out();
      case "toggle": toggle(action.id); return out();
      case "click": {
        if (action.shift) {
          const a = order.indexOf(anchor || action.id), b = order.indexOf(action.id);
          if (b < 0) return out();
          const from = a < 0 ? b : a;
          ids = order.slice(Math.min(from, b), Math.max(from, b) + 1);
          anchor = anchor || action.id; mode = true;
          return out();
        }
        if (action.ctrl || mode) { toggle(action.id); return out(); }
        return out(action.id);
      }
      default: return out();
    }
  }

  /* ---- Tree rows & keyboard ---- */
  const frCollator = new Intl.Collator("fr", { sensitivity: "base", numeric: true });

  function treeRows(db, expanded, o) {
    const filter = (o && o.projectFilter) || "all", counts = !!(o && o.counts);
    const exp = expanded || new Set();
    const live = (db.folders || []).filter((f) => !isTrashed(db, f.id));
    const kids = new Map();
    for (const f of live) {
      const key = (f.projectId || "") + "|" + (f.parentId || "");
      if (!kids.has(key)) kids.set(key, []);
      kids.get(key).push(f);
    }
    for (const arr of kids.values()) arr.sort((a, b) => frCollator.compare(String(a.name || ""), String(b.name || "")) || (a.id < b.id ? -1 : 1));
    const special = (id, label, count) => {
      const r = { id, kind: "special", label, depth: 0, hasChildren: false, expanded: false, parentId: "", projectId: "", folderId: "" };
      if (counts && count != null) r.count = count;
      return r;
    };
    const recents = o && Array.isArray(o.recents) ? o.recents : null;
    const rows = [
      special("@fav", "Favoris", favoritesView(db).length),
      special("@recent", "Récents", recents ? recentsView(db, recents).length : null),
      special("@trash", "Corbeille", trashView(db).length),
    ];
    const addFolders = (pid, parentId, parentRowId, depth) => {
      for (const f of kids.get(pid + "|" + parentId) || []) {
        const sub = kids.get(pid + "|" + f.id) || [];
        const isOpen = exp.has(f.id);
        rows.push({ id: f.id, kind: "folder", label: f.name, depth, hasChildren: sub.length > 0, expanded: isOpen, parentId: parentRowId, projectId: pid, folderId: f.id });
        if (isOpen) addFolders(pid, f.id, f.id, depth + 1);
      }
    };
    const addProject = (pid, label, color) => {
      const id = "p:" + pid, isOpen = exp.has(id);
      const row = { id, kind: "project", label, depth: 0, hasChildren: (kids.get(pid + "|") || []).length > 0, expanded: isOpen, parentId: "", projectId: pid, folderId: "" };
      if (color) row.color = color;
      rows.push(row);
      if (isOpen) addFolders(pid, "", id, 1);
    };
    for (const p of db.projects || []) {
      if (filter === "all" || filter === p.id) addProject(p.id, p.name, p.color);
    }
    if (filter === "all" || filter === "none") addProject("", "Sans projet", "");
    return rows;
  }

  function treeKey(rows, focusId, key) {
    const res = { focus: focusId, expand: null, collapse: null, activate: null };
    const i = rows.findIndex((r) => r.id === focusId);
    if (i < 0) return res;
    const row = rows[i];
    switch (key) {
      case "ArrowDown": res.focus = rows[Math.min(i + 1, rows.length - 1)].id; break;
      case "ArrowUp": res.focus = rows[Math.max(i - 1, 0)].id; break;
      case "Home": res.focus = rows[0].id; break;
      case "End": res.focus = rows[rows.length - 1].id; break;
      case "ArrowRight":
        if (row.hasChildren && !row.expanded) res.expand = row.id;
        else if (row.hasChildren && row.expanded && rows[i + 1] && rows[i + 1].parentId === row.id) res.focus = rows[i + 1].id;
        break;
      case "ArrowLeft":
        if (row.hasChildren && row.expanded) res.collapse = row.id;
        else if (row.parentId && rows.some((r) => r.id === row.parentId)) res.focus = row.parentId;
        break;
      case "Enter": case " ": res.activate = row.id; break;
      default: break;
    }
    return res;
  }

  return {
    EMPTY_SELECTION, selectStep, treeRows, treeKey,
    folderMap, ancestors, isTrashed, listFolder, descendantIds, toItems,
    SORT_KEYS, sortItems, DEFAULT_PREFS, prefsKey, readPrefs, writePrefs,
    pushRecent, readRecents, writeRecents,
    isFavorite, toggleFavorite, favoritesView, recentsView, trashItems, restoreItems, restoreInfo, trashView,
    purge, emptyTrash, prune, topLevelIds, canMove, moveItems, search,
  };
});
