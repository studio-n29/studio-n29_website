// Unit tests for the time-tracking helpers. Run: node tools/test-time.mjs
import { createRequire } from "node:module";
import assert from "node:assert/strict";
const require = createRequire(import.meta.url);
const T = require("../hq-r7k29m/js/timeutil.js");

let n = 0;
const t = (name, fn) => { try { fn(); n++; console.log("  ok  ", name); } catch (e) { console.error("  FAIL", name, "\n", e.message); process.exitCode = 1; } };
console.log("timeutil.js");

t("duration parsing accepts the usual freelance formats", () => {
  const cases = { "1h30": 90, "1 h 30": 90, "2h": 120, "45m": 45, "45 min": 45, "90": 90, "1:30": 90, "0:45": 45, "1.5": 90, "1,5": 90, "0,25": 15, "1.5h": 90, "2 heures": 120, "1h05": 65, "  3h ": 180 };
  for (const [input, min] of Object.entries(cases)) assert.equal(T.parseDuration(input), min, input);
  for (const bad of ["", "abc", "h", "1h30x", "-5", null]) assert.equal(T.parseDuration(bad), null, String(bad));
});

t("duration formatting", () => {
  assert.equal(T.fmtDuration(90), "1 h 30"); assert.equal(T.fmtDuration(120), "2 h"); assert.equal(T.fmtDuration(45), "45 min"); assert.equal(T.fmtDuration(0), "0 min");
  assert.equal(T.fmtClock(65), "1:05"); assert.equal(T.fmtHours(90), "1,50 h"); assert.equal(T.fmtHours(20), "0,33 h");
});

t("start / end times", () => {
  assert.equal(T.timeToMin("09:30"), 570); assert.equal(T.timeToMin("9h"), null);
  assert.equal(T.endTime({ start: "09:30", minutes: 90 }), "11:00");
  assert.equal(T.endTime({ start: "23:30", minutes: 60 }), "00:30"); assert.equal(T.endTime({ minutes: 60 }), "");
});

t("weeks start on Monday and month matrix is complete", () => {
  assert.equal(T.weekStart("2026-10-18"), "2026-10-12"); // Sunday -> previous Monday
  assert.equal(T.weekStart("2026-10-12"), "2026-10-12");
  const m = T.monthMatrix(2026, 9); // October 2026 starts on a Thursday
  assert.equal(m[0][0], "2026-09-28"); assert.equal(m[0][3], "2026-10-01"); assert.equal(m.at(-1).at(-1), "2026-11-01");
  assert.ok(m.every((w) => w.length === 7)); assert.equal(m.length, 5);
});

t("range presets", () => {
  const today = "2026-10-18";
  assert.deepEqual(T.rangeFor("week", today), { from: "2026-10-12", to: "2026-10-18" });
  assert.deepEqual(T.rangeFor("lastweek", today), { from: "2026-10-05", to: "2026-10-11" });
  assert.deepEqual(T.rangeFor("month", today), { from: "2026-10-01", to: "2026-10-31" });
  assert.deepEqual(T.rangeFor("lastmonth", "2026-01-15"), { from: "2025-12-01", to: "2025-12-31" });
  assert.deepEqual(T.rangeFor("30d", today), { from: "2026-09-19", to: "2026-10-18" });
  assert.deepEqual(T.rangeFor("year", today), { from: "2026-01-01", to: "2026-12-31" });
  assert.equal(T.eachDay("2026-02-27", "2026-03-02").length, 4);
  assert.equal(T.diffDays("2026-10-18", "2026-10-12"), 6);
});

const ctx = {
  projects: [{ id: "p1", name: "Heroes Dawn", color: "#8a5cff", clientId: "", rate: 5000 }, { id: "p2", name: "Mission Pixel Forge", color: "#5cc8ff", clientId: "c1" }],
  tasks: [{ id: "t1", title: "Combat", projectId: "p1" }], clients: [{ id: "c1", name: "Pixel Forge" }],
  billing: { hourlyRate: 0, dailyRate: 45000 },
};
const E = (o) => Object.assign({ id: Math.random().toString(36), date: "2026-10-12", minutes: 60, projectId: "p1", taskId: "", billable: true }, o);

t("hourly rate falls back entry > project > hourly > daily/7", () => {
  assert.equal(T.hourlyRate({ rate: 7000 }, ctx.projects[0], ctx.billing), 7000);
  assert.equal(T.hourlyRate({}, ctx.projects[0], ctx.billing), 5000);
  assert.equal(T.hourlyRate({}, ctx.projects[1], ctx.billing), Math.round(45000 / 7));
  assert.equal(T.hourlyRate({}, ctx.projects[1], { hourlyRate: 6000, dailyRate: 45000 }), 6000);
  assert.equal(T.hourlyRate({}, null, {}), 0);
});

t("amounts only count billable time", () => {
  assert.equal(T.amount(E({ minutes: 90 }), ctx.projects[0], ctx.billing), 7500);
  assert.equal(T.amount(E({ minutes: 90, billable: false }), ctx.projects[0], ctx.billing), 0);
});

t("filters by range, project, billable and billed state", () => {
  const docs = [{ id: "d1" }];
  const list = [E({ date: "2026-10-01" }), E({ date: "2026-10-12", projectId: "p2" }), E({ date: "2026-10-13", billable: false }), E({ date: "2026-10-14", docId: "d1" }), E({ date: "2026-10-14", docId: "ghost" }), E({ date: "2026-11-02" })];
  assert.equal(T.filter(list, { from: "2026-10-01", to: "2026-10-31" }, docs).length, 5);
  assert.equal(T.filter(list, { projects: new Set(["p2"]) }, docs).length, 1);
  assert.equal(T.filter(list, { billable: "no" }, docs).length, 1);
  assert.equal(T.filter(list, { billed: "done" }, docs).length, 1); // a deleted draft ("ghost") frees its entries
  assert.equal(T.filter(list, { billed: "todo" }, docs).length, 4); // billable and not invoiced
});

t("summary and grouping", () => {
  const list = [E({ minutes: 120 }), E({ minutes: 60, taskId: "t1" }), E({ minutes: 30, projectId: "p2", date: "2026-10-13" }), E({ minutes: 45, projectId: "", date: "2026-10-13", billable: false })];
  const s = T.summary(list, ctx);
  assert.equal(s.minutes, 255); assert.equal(s.billableMinutes, 210); assert.equal(s.days, 2);
  assert.equal(s.amount, 5000 * 3 + Math.round((30 / 60) * Math.round(45000 / 7)));
  const byP = T.aggregate(list, ctx, "project");
  assert.deepEqual(byP.map((g) => [g.label, g.minutes]), [["Heroes Dawn", 180], ["Sans projet", 45], ["Mission Pixel Forge", 30]]);
  assert.deepEqual(T.aggregate(list, ctx, "day").map((g) => [g.key, g.minutes]), [["2026-10-12", 180], ["2026-10-13", 75]]);
  assert.deepEqual(T.aggregate(list, ctx, "client").map((g) => g.label).sort(), ["Pixel Forge", "Sans client"]);
  assert.ok(T.aggregate(list, ctx, "task").some((g) => g.label === "Combat" && g.minutes === 60));
});

console.log(`\n${n} test(s) passed`);
