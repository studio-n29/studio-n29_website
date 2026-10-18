/* N29 HQ — time tracking helpers: duration parsing/formatting, date ranges, calendar matrix, rates and aggregation.
   Pure functions (no DOM): unit-tested in Node by tools/test-time.mjs. Dates are ISO strings (YYYY-MM-DD), money in cents. */
(function (root, factory) {
  if (typeof module === "object" && module.exports) module.exports = factory();
  else (root.HQ = root.HQ || {}).timeutil = factory();
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";
  const T = {};
  const pad = (n) => String(n).padStart(2, "0");
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parse = (s) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };
  T.addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
  T.diffDays = (a, b) => Math.round((Date.UTC(...a.split("-").map((x, i) => (i === 1 ? x - 1 : +x))) - Date.UTC(...b.split("-").map((x, i) => (i === 1 ? x - 1 : +x)))) / 86400000);
  T.weekStart = (s) => { const d = parse(s); return T.addDays(s, -((d.getDay() + 6) % 7)); }; // Monday
  T.monthStart = (s) => s.slice(0, 8) + "01";
  T.monthEnd = (s) => { const d = parse(s); return iso(new Date(d.getFullYear(), d.getMonth() + 1, 0)); };

  // ---------- Durations ----------
  // Accepted: "1h30", "1 h 30", "2h", "45m", "90" (minutes), "1:30", "1.5" / "1,5" (hours)
  T.parseDuration = (input) => {
    let s = String(input == null ? "" : input).trim().toLowerCase().replace(",", ".");
    if (!s) return null;
    let m;
    if ((m = /^(\d+):(\d{1,2})$/.exec(s))) return +m[1] * 60 + +m[2];
    if ((m = /^(\d+\.\d+)$/.exec(s))) return Math.round(parseFloat(m[1]) * 60);
    if ((m = /^(?:(\d+(?:\.\d+)?)\s*h(?:eures?|rs?)?)?\s*(?:(\d+)\s*(?:m|min|mn|minutes?)?)?$/.exec(s)) && (m[1] || m[2])) return Math.round(parseFloat(m[1] || 0) * 60) + +(m[2] || 0);
    return null;
  };
  T.fmtDuration = (min) => { min = Math.max(0, Math.round(min || 0)); const h = Math.floor(min / 60), m = min % 60; return h && m ? `${h} h ${pad(m)}` : h ? `${h} h` : `${m} min`; };
  T.fmtClock = (min) => `${Math.floor(min / 60)}:${pad(Math.round(min) % 60)}`; // 1:30
  T.fmtHours = (min) => (Math.round(((min || 0) / 60) * 100) / 100).toFixed(2).replace(".", ",") + " h";
  T.timeToMin = (hhmm) => { const m = /^(\d{1,2}):(\d{2})$/.exec(hhmm || ""); return m ? +m[1] * 60 + +m[2] : null; };
  T.minToTime = (min) => `${pad(Math.floor(((min % 1440) + 1440) % 1440 / 60))}:${pad(((min % 60) + 60) % 60)}`;
  T.endTime = (e) => (e.start ? T.minToTime(T.timeToMin(e.start) + e.minutes) : "");

  // ---------- Ranges ----------
  T.rangeFor = (preset, today) => {
    switch (preset) {
      case "week": { const a = T.weekStart(today); return { from: a, to: T.addDays(a, 6) }; }
      case "lastweek": { const a = T.addDays(T.weekStart(today), -7); return { from: a, to: T.addDays(a, 6) }; }
      case "month": return { from: T.monthStart(today), to: T.monthEnd(today) };
      case "lastmonth": { const p = T.addDays(T.monthStart(today), -1); return { from: T.monthStart(p), to: T.monthEnd(p) }; }
      case "30d": return { from: T.addDays(today, -29), to: today };
      case "year": return { from: today.slice(0, 4) + "-01-01", to: today.slice(0, 4) + "-12-31" };
      default: return { from: T.monthStart(today), to: T.monthEnd(today) };
    }
  };
  T.eachDay = (from, to) => { const out = []; for (let d = from; d <= to; d = T.addDays(d, 1)) out.push(d); return out; };
  // Weeks (Mon-first) covering a month, as arrays of ISO dates.
  T.monthMatrix = (year, month0) => {
    const first = iso(new Date(year, month0, 1)), last = iso(new Date(year, month0 + 1, 0));
    const start = T.weekStart(first), end = T.addDays(T.weekStart(last), 6), weeks = [];
    for (let d = start; d <= end; d = T.addDays(d, 7)) weeks.push(T.eachDay(d, T.addDays(d, 6)));
    return weeks;
  };

  // ---------- Rates & money ----------
  T.hourlyRate = (entry, project, billing) => {
    if (entry && entry.rate > 0) return entry.rate;
    if (project && project.rate > 0) return project.rate;
    if (billing && billing.hourlyRate > 0) return billing.hourlyRate;
    if (billing && billing.dailyRate > 0) return Math.round(billing.dailyRate / 7);
    return 0;
  };
  T.amount = (entry, project, billing) => (entry.billable ? Math.round((entry.minutes / 60) * T.hourlyRate(entry, project, billing)) : 0);
  T.isBilled = (entry, documents) => !!(entry.docId && documents.some((d) => d.id === entry.docId));

  // ---------- Filtering & aggregation ----------
  T.filter = (entries, f, documents) => entries.filter((e) => {
    if (f.from && e.date < f.from) return false;
    if (f.to && e.date > f.to) return false;
    if (f.projects && !f.projects.has(e.projectId || "")) return false;
    if (f.billable === "yes" && !e.billable) return false;
    if (f.billable === "no" && e.billable) return false;
    const billed = T.isBilled(e, documents || []);
    if (f.billed === "todo" && (billed || !e.billable)) return false;
    if (f.billed === "done" && !billed) return false;
    return true;
  });
  T.summary = (entries, ctx) => {
    const byId = new Map((ctx.projects || []).map((p) => [p.id, p]));
    const s = { minutes: 0, billableMinutes: 0, amount: 0, days: new Set() };
    for (const e of entries) { s.minutes += e.minutes; if (e.billable) s.billableMinutes += e.minutes; s.amount += T.amount(e, byId.get(e.projectId), ctx.billing); s.days.add(e.date); }
    return { minutes: s.minutes, billableMinutes: s.billableMinutes, amount: s.amount, days: s.days.size };
  };
  T.aggregate = (entries, ctx, by) => {
    const P = new Map(ctx.projects.map((p) => [p.id, p])), K = new Map(ctx.tasks.map((t) => [t.id, t])), C = new Map(ctx.clients.map((c) => [c.id, c]));
    const groups = new Map();
    for (const e of entries) {
      const p = P.get(e.projectId);
      let key, label, color = "#8f8d99";
      if (by === "day") { key = e.date; label = e.date; }
      else if (by === "task") { const t = K.get(e.taskId); key = e.taskId || "~" + (e.projectId || ""); label = t ? t.title : "Sans tâche"; color = p ? p.color : color; }
      else if (by === "client") { const c = p && C.get(p.clientId); key = c ? c.id : "~"; label = c ? c.name : "Sans client"; }
      else { key = e.projectId || "~"; label = p ? p.name : "Sans projet"; color = p ? p.color : color; }
      const g = groups.get(key) || { key, label, color, minutes: 0, billableMinutes: 0, amount: 0, count: 0 };
      g.minutes += e.minutes; if (e.billable) g.billableMinutes += e.minutes; g.amount += T.amount(e, p, ctx.billing); g.count++;
      groups.set(key, g);
    }
    const out = [...groups.values()];
    return by === "day" ? out.sort((a, b) => (a.key < b.key ? -1 : 1)) : out.sort((a, b) => b.minutes - a.minutes);
  };
  return T;
});
