/* N29 HQ — explorer model: pure, DOM-free queries / sort / prefs / recents (HQ.exm). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.HQ = root.HQ || {}).exm = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ---- Tree queries ----
     Concurrent edits on two devices can leave shapes no single device writes; the read paths tolerate them without
     rewriting the data: a folder / note whose parent folder is missing sits at the root of its project, a parent chain
     that loops is cut at the folder with the smallest id (shown at the root), and the children of a folder are listed
     under it whatever their own projectId (the folder is authoritative). Every query below follows these effective
     parents, so what is listed is exactly what moves, trashes, restores and purges act on. */
  function folderMap(db) { return new Map((db.folders || []).map((f) => [f.id, f])); }

  // { map: id -> folder, par: id -> effective parent id ("" = project root) }, O(F), cycle-safe.
  function structure(db) {
    const map = folderMap(db), par = new Map(), state = new Map(); // state: 1 = on the current path, 2 = done
    for (const start of map.keys()) {
      if (state.has(start)) continue;
      const path = []; let cur = start;
      while (cur && map.has(cur) && !state.has(cur)) { state.set(cur, 1); path.push(cur); cur = map.get(cur).parentId || ""; }
      if (cur && state.get(cur) === 1) { // a loop: path[from..] is the cycle, cut at its smallest id
        let low = cur;
        for (let i = path.indexOf(cur); i < path.length; i++) if (path[i] < low) low = path[i];
        par.set(low, "");
      }
      for (const x of path) {
        state.set(x, 2);
        if (!par.has(x)) { const p = map.get(x).parentId || ""; par.set(x, map.has(p) ? p : ""); }
      }
    }
    return { map, par };
  }
  const noteParent = (st, n) => (n.folderId && st.map.has(n.folderId) ? n.folderId : "");
  const effParent = (st, it) => (it.type === "folder" ? st.par.get(it.rec.id) || "" : noteParent(st, it.rec));
  // the effective chain above folderId, root first, folderId included (acyclic by construction; seen is a safety net)
  function chain(st, folderId) {
    const out = [], seen = new Set();
    let id = folderId;
    while (id && st.map.has(id) && !seen.has(id)) { seen.add(id); out.unshift(st.map.get(id)); id = st.par.get(id); }
    return out;
  }

  function ancestors(db, folderId) { return chain(structure(db), folderId); }

  // Every effectively trashed id (in the trash, or under a trashed folder), in one O(N + F) pass.
  function trashedOf(db, st) {
    const trash = new Set((db.trash || []).map((t) => t.id)), out = new Set(trash);
    if (!trash.size) return out;
    const memo = new Map();
    const folderTrashed = (id) => {
      const path = []; let cur = id, r = false;
      while (cur) {
        if (memo.has(cur)) { r = memo.get(cur); break; }
        path.push(cur);
        if (trash.has(cur)) { r = true; break; }
        cur = st.par.get(cur) || "";
      }
      for (const x of path) memo.set(x, r);
      return r;
    };
    for (const id of st.map.keys()) if (folderTrashed(id)) out.add(id);
    for (const n of db.notes || []) { const p = noteParent(st, n); if (p && folderTrashed(p)) out.add(n.id); }
    return out;
  }
  function trashedSet(db) { return trashedOf(db, structure(db)); }

  function isTrashed(db, id) {
    const trash = new Set((db.trash || []).map((t) => t.id));
    if (!trash.size) return false;
    if (trash.has(id)) return true;
    const map = folderMap(db);
    const note = map.has(id) ? null : (db.notes || []).find((n) => n.id === id);
    const start = note ? note.folderId || "" : id;
    // the raw parent chain is the effective one unless it loops: only then build the cycle-cut structure
    const seen = new Set();
    for (let cur = start; cur && map.has(cur); cur = map.get(cur).parentId || "") {
      if (seen.has(cur)) return chain(structure(db), start).some((f) => trash.has(f.id));
      seen.add(cur);
    }
    for (const x of seen) if (trash.has(x)) return true;
    return false;
  }

  function listFolder(db, target) {
    const fid = target.folderId || "", st = structure(db), ts = trashedOf(db, st);
    if (fid) {
      if (!st.map.has(fid) || ts.has(fid)) return { folders: [], notes: [] };
      return {
        folders: (db.folders || []).filter((f) => st.par.get(f.id) === fid && !ts.has(f.id)),
        notes: (db.notes || []).filter((n) => n.folderId === fid && !ts.has(n.id)),
      };
    }
    const pid = target.projectId || "";
    return {
      folders: (db.folders || []).filter((f) => (f.projectId || "") === pid && st.par.get(f.id) === "" && !ts.has(f.id)),
      notes: (db.notes || []).filter((n) => (n.projectId || "") === pid && !noteParent(st, n) && !ts.has(n.id)),
    };
  }

  function descendantIds(db, folderId) {
    const st = structure(db), kids = new Map();
    for (const f of db.folders || []) {
      const p = st.par.get(f.id);
      if (!p) continue;
      if (!kids.has(p)) kids.set(p, []);
      kids.get(p).push(f.id);
    }
    const folders = [], seen = new Set([folderId]), queue = [folderId];
    while (queue.length) {
      for (const id of kids.get(queue.shift()) || []) if (!seen.has(id)) { seen.add(id); folders.push(id); queue.push(id); }
    }
    const inTree = new Set(st.map.has(folderId) ? [folderId, ...folders] : []);
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
  // the items of ids that exist and are not trashed, in the order of ids (one trashed pass, map lookups)
  function liveItems(db, ids) {
    const ts = trashedSet(db), fm = folderMap(db), nm = new Map((db.notes || []).map((n) => [n.id, n]));
    const out = [];
    for (const id of ids) {
      if (ts.has(id)) continue;
      if (fm.has(id)) out.push({ type: "folder", rec: fm.get(id) });
      else if (nm.has(id)) out.push({ type: "note", rec: nm.get(id) });
    }
    return out;
  }

  function isFavorite(db, id) { return (db.favorites || []).some((f) => f.id === id); }
  function toggleFavorite(db, id) {
    if (!itemById(db, id)) return false;
    db.favorites = db.favorites || [];
    if (isFavorite(db, id)) { db.favorites = db.favorites.filter((f) => f.id !== id); return false; }
    db.favorites.push({ id }); return true;
  }
  function favoritesView(db) { return liveItems(db, (db.favorites || []).map((f) => f.id)); }
  function recentsView(db, ids) { return liveItems(db, ids || []); }

  function trashItems(db, ids, now) {
    db.trash = db.trash || [];
    let n = 0;
    for (const id of ids || []) {
      if (!itemById(db, id) || isTrashed(db, id)) continue;
      db.trash.push({ id, at: now }); n++;
    }
    return n;
  }
  // a restored item goes back to its parent folder, or to its project root when that folder is gone or still trashed
  const backToRoot = (db, it) => { const pid = parentOf(it); return !!pid && (!findFolder(db, pid) || isTrashed(db, pid)); };
  function restoreItems(db, ids) {
    let n = 0;
    for (const id of ids || []) {
      if (!(db.trash || []).some((t) => t.id === id)) continue;
      db.trash = db.trash.filter((t) => t.id !== id); n++;
      const it = itemById(db, id);
      if (it && backToRoot(db, it)) { if (it.type === "folder") it.rec.parentId = ""; else it.rec.folderId = ""; }
    }
    return n;
  }
  // What restoreItems(db, ids) would do, without changing db: count = ids it restores (same value it returns),
  // toRoot = those that land at their project root because their parent folder is gone or still effectively in the trash.
  function restoreInfo(db, ids) {
    const sim = Object.assign({}, db, { trash: (db.trash || []).slice() });
    let count = 0; const toRoot = [];
    for (const id of ids || []) {
      if (!sim.trash.some((t) => t.id === id)) continue;
      sim.trash = sim.trash.filter((t) => t.id !== id); count++;
      const it = itemById(db, id);
      if (it && backToRoot(sim, it)) toRoot.push(id);
    }
    return { count, toRoot };
  }
  function trashView(db) {
    const direct = new Set((db.trash || []).map((t) => t.id)), st = structure(db);
    const out = [];
    for (const t of db.trash || []) {
      const it = itemById(db, t.id); if (!it) continue;
      if (chain(st, effParent(st, it)).some((f) => direct.has(f.id))) continue; // shown through its trashed ancestor
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
    const set = new Set(ids || []), out = [], seen = new Set(), st = structure(db);
    for (const id of ids || []) {
      if (seen.has(id)) continue;
      seen.add(id);
      const it = itemById(db, id); if (!it) continue;
      if (chain(st, effParent(st, it)).some((f) => f.id !== id && set.has(f.id))) continue;
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
    const ts = trashedSet(db), live = (id) => !ts.has(id);
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
    const st = structure(db), ts = trashedOf(db, st);
    // children keyed by effective parent: "#<folderId>" under a folder, "@<projectId>" at a project root
    const kids = new Map();
    for (const f of db.folders || []) {
      if (ts.has(f.id)) continue;
      const p = st.par.get(f.id), key = p ? "#" + p : "@" + (f.projectId || "");
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
    const addFolders = (pid, key, parentRowId, depth) => {
      for (const f of kids.get(key) || []) {
        const sub = kids.get("#" + f.id) || [];
        const isOpen = exp.has(f.id);
        rows.push({ id: f.id, kind: "folder", label: f.name, depth, hasChildren: sub.length > 0, expanded: isOpen, parentId: parentRowId, projectId: pid, folderId: f.id });
        if (isOpen) addFolders(pid, "#" + f.id, f.id, depth + 1);
      }
    };
    const addProject = (pid, label, color) => {
      const id = "p:" + pid, isOpen = exp.has(id);
      const row = { id, kind: "project", label, depth: 0, hasChildren: (kids.get("@" + pid) || []).length > 0, expanded: isOpen, parentId: "", projectId: pid, folderId: "" };
      if (color) row.color = color;
      rows.push(row);
      if (isOpen) addFolders(pid, "@" + pid, id, 1);
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
    folderMap, ancestors, isTrashed, trashedSet, listFolder, descendantIds, toItems,
    SORT_KEYS, sortItems, DEFAULT_PREFS, prefsKey, readPrefs, writePrefs,
    pushRecent, readRecents, writeRecents,
    isFavorite, toggleFavorite, favoritesView, recentsView, trashItems, restoreItems, restoreInfo, trashView,
    purge, emptyTrash, prune, topLevelIds, canMove, moveItems, search,
  };
});
