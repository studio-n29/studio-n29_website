// Unit tests for the sync data model and 3-way merge. Run: node tools/test-sync.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const M = require("../hq-r7k29m/js/merge.js");

let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ok  ", name); } catch (e) { console.error("  FAIL", name, "\n", e.stack.split("\n").slice(0, 4).join("\n")); process.exitCode = 1; } };
console.log("merge.js");

const emptyDb = () => ({ v: 1, createdAt: 1, settings: { company: { name: "A", city: "Lille" }, billing: { paymentDays: 30 }, security: { autoLockMinutes: 5, remember: false } }, clients: [], projects: [], tasks: [], timeEntries: [], documents: [], payments: [], prompts: [], links: [], apex: { style: null, state: null }, audit: [], lastBackupAt: null, timer: null });
const clone = (x) => JSON.parse(JSON.stringify(x));
const task = (id, o = {}) => Object.assign({ id, title: "T" + id, status: "todo" }, o);

t("cloud view drops per-device data and compose restores it", () => {
  const db = emptyDb(); db.lastBackupAt = 123; db.settings.security.remember = true;
  const v = M.cloudView(db);
  assert.equal(v.lastBackupAt, undefined); assert.equal(v.settings.security, undefined); assert.equal(v.settings.company.name, "A");
  const back = M.compose({ lastBackupAt: 999, settings: { security: { autoLockMinutes: 15, remember: true } } }, v);
  assert.equal(back.lastBackupAt, 999); assert.equal(back.settings.security.autoLockMinutes, 15); assert.equal(back.settings.company.name, "A");
});

t("identical sides merge to themselves", () => {
  const a = M.cloudView(emptyDb());
  const r = M.merge(a, a, a);
  assert.deepEqual(r.conflicts, []); assert.equal(r.changedLocal, false); assert.equal(r.changedRemote, false);
});

t("records created on both devices are all kept", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  local.tasks.push(task("l1")); remote.tasks.push(task("r1"));
  const r = M.merge(base, local, remote);
  assert.deepEqual(r.merged.tasks.map((x) => x.id).sort(), ["l1", "r1"]);
  assert.equal(r.conflicts.length, 0); assert.equal(r.changedLocal, true); assert.equal(r.changedRemote, true);
});

t("an edit on one side wins when the other side did not touch the record", () => {
  const base = M.cloudView(emptyDb()); base.tasks.push(task("1"));
  const local = clone(base), remote = clone(base);
  remote.tasks[0].status = "done";
  assert.equal(M.merge(base, local, remote).merged.tasks[0].status, "done");
  const local2 = clone(base); local2.tasks[0].title = "Renamed";
  const m = M.merge(base, local2, base).merged.tasks[0];
  assert.equal(m.title, "Renamed");
});

t("both edited: local wins and the conflict is reported", () => {
  const base = M.cloudView(emptyDb()); base.tasks.push(task("1"));
  const local = clone(base), remote = clone(base);
  local.tasks[0].title = "Local"; remote.tasks[0].title = "Remote";
  const r = M.merge(base, local, remote);
  assert.equal(r.merged.tasks[0].title, "Local"); assert.deepEqual(r.conflicts, ["tasks/1"]);
});

t("deletions propagate unless the record was edited on the other side", () => {
  const base = M.cloudView(emptyDb()); base.tasks.push(task("1"), task("2"));
  const local = clone(base), remote = clone(base);
  local.tasks = local.tasks.filter((x) => x.id !== "1");           // deleted here, untouched there
  remote.tasks[1].title = "Edited remotely";                        // edited there
  let r = M.merge(base, local, remote);
  assert.deepEqual(r.merged.tasks.map((x) => x.id), ["2"]); assert.equal(r.merged.tasks[0].title, "Edited remotely");
  const l2 = clone(base); l2.tasks = l2.tasks.filter((x) => x.id !== "2");   // deleted here ...
  const r2 = clone(base); r2.tasks[1].status = "doing";                       // ... but edited there: the edit survives
  r = M.merge(base, l2, r2);
  assert.ok(r.merged.tasks.some((x) => x.id === "2" && x.status === "doing")); assert.equal(r.conflicts.length, 1);
});

t("settings merge key by key, per-device security stays out", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  local.settings.company.city = "Paris"; remote.settings.company.name = "B"; remote.settings.billing.paymentDays = 45;
  const r = M.merge(base, local, remote);
  assert.equal(r.merged.settings.company.city, "Paris"); assert.equal(r.merged.settings.company.name, "B"); assert.equal(r.merged.settings.billing.paymentDays, 45);
  assert.equal(r.conflicts.length, 0); assert.equal(r.merged.settings.security, undefined);
});

t("a timer started on another device is picked up, a stopped one clears", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  remote.timer = { startedAt: 5, description: "x" };
  assert.deepEqual(M.merge(base, local, remote).merged.timer, { startedAt: 5, description: "x" });
  const base2 = clone(remote), local2 = clone(remote), remote2 = clone(remote); remote2.timer = null;
  assert.equal(M.merge(base2, local2, remote2).merged.timer, null);
});

t("audit log is a union without duplicates, oldest first", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  local.audit = [{ ts: 3, action: "a", detail: "" }, { ts: 1, action: "x", detail: "" }]; remote.audit = [{ ts: 2, action: "b", detail: "" }, { ts: 1, action: "x", detail: "" }];
  assert.deepEqual(M.merge(base, local, remote).merged.audit.map((a) => a.ts), [1, 2, 3]);
});

t("first sync without a base keeps both sides and flags differing records", () => {
  const local = M.cloudView(emptyDb()), remote = clone(local);
  local.clients.push({ id: "c", name: "Local" }); remote.clients.push({ id: "c", name: "Remote" }, { id: "d", name: "Only remote" });
  const r = M.merge(null, local, remote);
  assert.deepEqual(r.merged.clients.map((c) => c.id).sort(), ["c", "d"]); assert.equal(r.merged.clients.find((c) => c.id === "c").name, "Local"); assert.equal(r.conflicts.length, 1);
});

t("merge is idempotent and converges for both devices", () => {
  const base = M.cloudView(emptyDb()); base.tasks.push(task("1"));
  const A = clone(base), B = clone(base);
  A.tasks.push(task("a")); A.tasks[0].status = "doing";
  B.tasks.push(task("b")); B.timeEntries.push({ id: "e1", minutes: 30 });
  const onA = M.merge(base, A, B).merged;         // device A syncs second
  const onB = M.merge(base, B, A).merged;         // device B would have synced the other way round
  const norm = (d) => ({ ...d, tasks: [...d.tasks].sort((x, y) => (x.id < y.id ? -1 : 1)) });
  assert.deepEqual(norm(onA), norm(onB));
  assert.equal(M.merge(onA, onA, onA).conflicts.length, 0);
});

t("issued documents are never duplicated or altered by a plain merge", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  const doc = { id: "d1", number: "FA-2026-0001", hash: "abc", chainIndex: 1 };
  local.documents.push(doc); remote.documents.push(clone(doc));
  const r = M.merge(base, local, remote);
  assert.equal(r.merged.documents.length, 1); assert.equal(r.conflicts.length, 0);
});

t("a document edited on both devices keeps both texts", () => {
  const note = (o) => Object.assign({ id: "n1", projectId: "", title: "Spec", md: "base", createdAt: 1, updatedAt: 1 }, o);
  const base = M.cloudView(emptyDb()); base.notes = [note()];
  const local = clone(base), remote = clone(base);
  local.notes[0] = note({ md: "texte local", updatedAt: 5 }); remote.notes[0] = note({ md: "texte distant", updatedAt: 6 });
  const r = M.merge(base, local, remote);
  assert.equal(r.merged.notes.length, 2); assert.equal(r.merged.notes[0].md, "texte local");
  assert.ok(r.merged.notes.some((x) => x.md === "texte distant" && /conflit/.test(x.title)));
  assert.equal(r.conflicts.length, 1);
  const again = M.merge(r.merged, r.merged, r.merged); assert.equal(again.merged.notes.length, 2);
});

// ---------- Attachments written by the N29 HQ app (desktop / Android): db.fileManifest and db.fileKeys ----------
// This PWA never reads them, but it syncs the same vault: its merge must treat them exactly like the app's merge.js does.
const fe = (blobId, updatedAt, o = {}) => Object.assign({ blobId, name: blobId + ".pdf", size: 10, sha256: "s" + blobId, updatedAt }, o);

t("fileManifest: entries added on two devices are all kept", () => {
  const base = M.cloudView(emptyDb()); base.fileManifest = {};
  const local = clone(base), remote = clone(base);
  local.fileManifest.a = fe("a1", 5); remote.fileManifest.b = fe("b1", 6);
  const r = M.merge(base, local, remote);
  assert.deepEqual(Object.keys(r.merged.fileManifest).sort(), ["a", "b"]);
  assert.equal(r.conflicts.length, 0);
});

t("fileManifest: same docId replaced on both sides -> newest updatedAt wins (both directions)", () => {
  const base = M.cloudView(emptyDb()); base.fileManifest = { d: fe("old", 1) };
  const local = clone(base), remote = clone(base);
  local.fileManifest.d = fe("loc", 10); remote.fileManifest.d = fe("rem", 20);
  assert.equal(M.merge(base, local, remote).merged.fileManifest.d.blobId, "rem");
  assert.equal(M.merge(base, remote, local).merged.fileManifest.d.blobId, "rem");
});

t("fileManifest: a newer deletion beats an older edit, an older deletion loses", () => {
  const base = M.cloudView(emptyDb()); base.fileManifest = { d: fe("x", 1) };
  const local = clone(base), remote = clone(base);
  local.fileManifest.d = fe("y", 5); remote.fileManifest.d = fe("x", 9, { deleted: true });
  assert.equal(M.merge(base, local, remote).merged.fileManifest.d.deleted, true);
  assert.equal(M.merge(base, remote, local).merged.fileManifest.d.deleted, true);
  remote.fileManifest.d = fe("x", 3, { deleted: true });
  assert.equal(M.merge(base, local, remote).merged.fileManifest.d.deleted, undefined);
  remote.fileManifest.d = fe("x", 5, { deleted: true }); // tie: the live entry is kept
  assert.equal(M.merge(base, local, remote).merged.fileManifest.d.blobId, "y");
  assert.equal(M.merge(base, remote, local).merged.fileManifest.d.blobId, "y");
});

t("fileManifest: an old cloud without the key still merges", () => {
  const base = M.cloudView(emptyDb()), local = clone(base), remote = clone(base);
  local.fileManifest = { a: fe("a1", 5) };
  const r = M.merge(base, local, remote);
  assert.deepEqual(r.merged.fileManifest, { a: fe("a1", 5) });
  const r2 = M.merge(base, remote, local);
  assert.deepEqual(r2.merged.fileManifest, { a: fe("a1", 5) });
  assert.ok("fileManifest" in M.cloudView(local));
});

const rec = (docId, n) => ({ docId, key: Buffer.alloc(32, n).toString("base64"), at: n });

t("fileKeys: a union on both sides, also with an old cloud that has none; a key removed on one side comes back", () => {
  const base = { fileKeys: { k0: rec("d0", 1) } };
  const local = { fileKeys: { k0: rec("d0", 1), kA: rec("d1", 2) } }, remote = { fileKeys: { k0: rec("d0", 1), kB: rec("d1", 3) } };
  for (const [l, r] of [[local, remote], [remote, local]]) {
    const out = M.merge(base, l, r);
    assert.deepEqual(Object.keys(out.merged.fileKeys).sort(), ["k0", "kA", "kB"]);
    assert.deepEqual(out.conflicts, []);
  }
  assert.deepEqual(Object.keys(M.merge(base, { fileKeys: {} }, remote).merged.fileKeys).sort(), ["k0", "kB"]);
  assert.deepEqual(M.merge(null, local, {}).merged.fileKeys, local.fileKeys);
  assert.deepEqual(M.merge(null, {}, local).merged.fileKeys, local.fileKeys);
  assert.deepEqual(M.mergeFileKeys(null, "junk"), {});
  assert.ok("fileKeys" in M.cloudView({ fileKeys: {}, settings: {} }), "file keys are part of the synced (encrypted) view");
});

t("fileKeys: two records for one key id -> newest 'at' wins, then a canonical tie-break; same result on both devices", () => {
  const a = { docId: "d", key: "AAAA", at: 5 }, b = { docId: "d", key: "BBBB", at: 9 }, c = { docId: "d", key: "CCCC", at: 9 };
  assert.equal(M.mergeFileKeys({ k: a }, { k: b }).k.key, "BBBB");
  assert.equal(M.mergeFileKeys({ k: b }, { k: a }).k.key, "BBBB");
  assert.deepEqual(M.mergeFileKeys({ k: b }, { k: c }), M.mergeFileKeys({ k: c }, { k: b }));
});

t("PWA signed in again (no base) with a stale local copy: the app's newer attachments and keys survive the 'local wins' conflict rule", () => {
  // The app uploaded doc d2, replaced d1 and deleted d3 since this browser last synced; the PWA lost its sync state (base = null).
  const stale = M.cloudView(emptyDb());
  stale.fileManifest = { d1: fe("old1", 1), d3: fe("b3", 1) }; stale.fileKeys = { k1: rec("d1", 1), k3: rec("d3", 1) };
  const cloud = clone(stale);
  cloud.fileManifest = { d1: fe("new1", 20, { kid: "k1b", fileKey: "x" }), d2: fe("b2", 21, { kid: "k2", fileKey: "y" }), d3: fe("b3", 22, { deleted: true }) };
  cloud.fileKeys = { k1: rec("d1", 1), k3: rec("d3", 1), k1b: rec("d1", 20), k2: rec("d2", 21) };
  const r = M.merge(null, stale, cloud);
  assert.deepEqual(r.merged.fileManifest, cloud.fileManifest, "the stale manifest does not win");
  assert.deepEqual(r.merged.fileKeys, cloud.fileKeys, "no key is dropped");
  assert.equal(r.changedRemote, false, "nothing stale is pushed back");
  assert.deepEqual(r.conflicts, []);
});

t("PWA holding an old backup without attachments (keys missing locally): the merge restores them instead of deleting them in the cloud", () => {
  const base = M.cloudView(emptyDb());
  base.fileManifest = { d1: fe("b1", 5, { kid: "k1", fileKey: "x" }) }; base.fileKeys = { k1: rec("d1", 5) };
  const remote = clone(base); remote.fileKeys.k2 = rec("d2", 8); remote.fileManifest.d2 = fe("b2", 8);
  const local = M.cloudView(emptyDb());           // imported backup: no fileManifest / fileKeys at all
  const r = M.merge(base, local, remote);
  assert.deepEqual(r.merged.fileKeys, remote.fileKeys);
  assert.deepEqual(r.merged.fileManifest, remote.fileManifest);
  assert.equal(r.changedRemote, false);
});

// ---------- store.js: whatever replaces the local database keeps the attachment keys already held ----------
// Loaded in a vm context with a fake localStorage (PBKDF2 at the real cost: a few hundred ms per derivation).
import vm from "node:vm";
import fs from "node:fs";
const ta = async (name, fn) => { try { await fn(); n++; console.log("  ok  ", name); } catch (e) { console.error("  FAIL", name, "\n", e.stack.split("\n").slice(0, 4).join("\n")); process.exitCode = 1; } };
function loadPwaStore() {
  const ls = new Map();
  const sandbox = {
    console, setTimeout, clearTimeout, TextEncoder, TextDecoder, btoa, atob, crypto: globalThis.crypto,
    document: { hidden: false, addEventListener() {} }, indexedDB: { open() { throw new Error("no idb"); } },
    localStorage: { getItem: (k) => (ls.has(k) ? ls.get(k) : null), setItem: (k, v) => { ls.set(k, String(v)); }, removeItem: (k) => { ls.delete(k); } },
    HQ: { merge: M, util: { toast() {} } },
  };
  sandbox.window = sandbox; sandbox.addEventListener = () => {};
  const ctx = vm.createContext(sandbox);
  vm.runInContext(fs.readFileSync(new URL("../hq-r7k29m/js/store.js", import.meta.url), "utf8"), ctx, { filename: "store.js" });
  return sandbox.HQ.store;
}
console.log("store.js (attachment keys)");

await ta("store: importing an older readable backup keeps the attachment keys this vault already holds", async () => {
  const S = loadPwaStore();
  await S.create("correct horse battery");
  const old = S.exportPlain();                    // a backup taken before any attachment existed
  assert.equal(JSON.parse(old).db.fileKeys, undefined, "the PWA does not invent the key by itself");
  S.applyView(Object.assign(M.cloudView(S.db()), { fileKeys: { k1: rec("d1", 1) }, fileManifest: { d1: fe("b1", 1) } })); // merged from the app
  assert.deepEqual(clone(S.db().fileKeys), { k1: rec("d1", 1) });
  await S.importBackup(old);
  assert.deepEqual(clone(S.db().fileKeys), { k1: rec("d1", 1) }, "not dropped by the import");
  assert.deepEqual(clone(M.cloudView(S.db()).fileKeys), { k1: rec("d1", 1) }, "so a plain push of the local view cannot delete it in the cloud");
});

await ta("store: applying an older view (restored version) keeps the keys; keys of the view are added", async () => {
  const S = loadPwaStore();
  await S.create("correct horse battery");
  const older = M.cloudView(S.db());
  S.applyView(Object.assign(clone(older), { fileKeys: { k1: rec("d1", 1) } }));
  S.applyView(Object.assign(clone(older), { fileKeys: { k2: rec("d2", 2) } }));
  assert.deepEqual(Object.keys(S.db().fileKeys).sort(), ["k1", "k2"]);
  S.applyView(clone(older));                      // a view from before attachments
  assert.deepEqual(Object.keys(S.db().fileKeys).sort(), ["k1", "k2"]);
  const fresh = loadPwaStore(); await fresh.create("correct horse battery");
  fresh.applyView(M.cloudView(fresh.db()));
  assert.equal("fileKeys" in fresh.db(), false, "a vault that never saw attachments is left as it is");
});

await ta("store: importing an encrypted backup over an unlocked vault keeps its attachment keys", async () => {
  const S = loadPwaStore();
  await S.create("correct horse battery");
  const backup = await S.exportEncrypted();
  S.applyView(Object.assign(M.cloudView(S.db()), { fileKeys: { k1: rec("d1", 1) } }));
  await S.importBackup(backup, "correct horse battery");
  assert.deepEqual(clone(S.db().fileKeys), { k1: rec("d1", 1) });
});

console.log(`\n${n} test(s) passed`);
