/* N29 HQ — sync data model: what is shared between devices, and a 3-way merge at record level.
   Pure functions (no DOM, no network): unit-tested in Node by tools/test-sync.mjs.
   merge(base, local, remote): base = the last state both sides agreed on (null on first sync). */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.HQ = root.HQ || {}).merge = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const M = {};
  const LISTS = ["clients", "projects", "tasks", "timeEntries", "documents", "payments", "prompts", "links", "notes"];
  const canon = (v) => (v === null || typeof v !== "object" ? JSON.stringify(v === undefined ? null : v) : Array.isArray(v) ? "[" + v.map(canon).join(",") + "]" : "{" + Object.keys(v).sort().map((k) => JSON.stringify(k) + ":" + canon(v[k])).join(",") + "}");
  const eq = (a, b) => canon(a) === canon(b);
  M.canon = canon; M.eq = eq;
  const clone = (v) => (v === undefined ? undefined : JSON.parse(JSON.stringify(v)));

  // What leaves the device: everything except per-device settings (auto-lock, remembered device) and the local backup date.
  M.cloudView = (db) => {
    const v = clone(db);
    delete v.lastBackupAt;
    if (v.settings) delete v.settings.security;
    return v;
  };
  // Put a merged shared view back into the local database, keeping what is specific to this device.
  M.compose = (localDb, view) => {
    const out = clone(view);
    out.lastBackupAt = localDb.lastBackupAt;
    out.settings = Object.assign({}, out.settings, { security: localDb.settings.security });
    return out;
  };

  // Plain value, 3-way: whoever changed it wins; both changed -> local wins and it is reported.
  function pick(base, local, remote, path, conflicts) {
    if (eq(local, remote)) return local;
    if (base !== undefined && eq(local, base)) return remote;
    if (base !== undefined && eq(remote, base)) return local;
    if (base === undefined && local === undefined) return remote;
    if (base === undefined && remote === undefined) return local;
    conflicts.push(path);
    return local;
  }
  // Collection of records identified by `id`.
  function mergeList(base, local, remote, path, conflicts, stats) {
    const idx = (a) => new Map((a || []).map((x) => [x.id, x]));
    const B = idx(base), Lm = idx(local), R = idx(remote), out = [];
    const ids = [...new Set([...(local || []).map((x) => x.id), ...(remote || []).map((x) => x.id)])];
    for (const id of ids) {
      const b = B.get(id), l = Lm.get(id), r = R.get(id);
      if (l && r) {
        if (eq(l, r)) out.push(l);
        else if (b && eq(l, b)) { out.push(r); stats.pulled++; }
        else if (b && eq(r, b)) { out.push(l); stats.pushed++; }
        else {
          out.push(l); conflicts.push(`${path}/${id}`);
          if (path === "notes") out.push(Object.assign({}, r, { id: id + "-c" + (r.updatedAt || 0).toString(36), title: (r.title || "Sans titre") + " (conflit)" })); // never lose written text
        }
      } else if (l) {
        if (!b) { out.push(l); stats.pushed++; }                       // created here
        else if (eq(l, b)) stats.pulled++;                              // deleted on the other device, untouched here
        else { out.push(l); conflicts.push(`${path}/${id} (modifié ici, supprimé ailleurs)`); } // an edit beats a deletion
      } else if (r) {
        if (!b) { out.push(r); stats.pulled++; }                        // created there
        else if (eq(r, b)) stats.pushed++;                              // deleted here, untouched there
        else { out.push(r); conflicts.push(`${path}/${id} (supprimé ici, modifié ailleurs)`); }
      }
    }
    return out;
  }
  function mergeObject(base, local, remote, path, conflicts) {
    const out = {};
    for (const k of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) {
      const v = pick(base ? base[k] : undefined, local ? local[k] : undefined, remote ? remote[k] : undefined, `${path}.${k}`, conflicts);
      if (v !== undefined) out[k] = v;
    }
    return out;
  }
  function mergeSettings(base, local, remote, conflicts) {
    const out = {};
    for (const g of new Set([...Object.keys(local || {}), ...Object.keys(remote || {})])) out[g] = mergeObject(base && base[g], local && local[g], remote && remote[g], `settings.${g}`, conflicts);
    return out;
  }
  // Audit log: union of entries, oldest first, capped.
  function mergeAudit(local, remote) {
    const seen = new Map();
    for (const a of [...(remote || []), ...(local || [])]) seen.set(`${a.ts}|${a.action}|${a.detail}`, a);
    return [...seen.values()].sort((a, b) => a.ts - b.ts).slice(-3000);
  }

  M.merge = (base, local, remote) => {
    const conflicts = [], stats = { pulled: 0, pushed: 0 };
    const out = {};
    const B = base || {};
    for (const k of new Set([...Object.keys(local), ...Object.keys(remote)])) {
      if (LISTS.includes(k)) out[k] = mergeList(B[k], local[k], remote[k], k, conflicts, stats);
      else if (k === "audit") out[k] = mergeAudit(local[k], remote[k]);
      else if (k === "settings") out[k] = mergeSettings(B[k], local[k], remote[k], conflicts);
      else if (k === "apex") out[k] = mergeObject(B[k], local[k], remote[k], "apex", conflicts);
      else out[k] = pick(B[k], local[k], remote[k], k, conflicts);
    }
    return { merged: out, conflicts, stats, changedLocal: !eq(out, local), changedRemote: !eq(out, remote) };
  };
  return M;
});
