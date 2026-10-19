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

console.log(`\n${n} test(s) passed`);
