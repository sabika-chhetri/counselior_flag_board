// Pure logic: CSV parsing, cleaning, flagging, supervisor aggregation.
// Works in the browser (window.SA) and in Node (module.exports) so it can be tested.
(function (root) {
  const LEVELS = ["Urgent", "High", "Review", "None"];
  const RANK = { Urgent: 0, High: 1, Review: 2, None: 3 };

  // Minimal CSV parser (handles quotes, commas in quotes, CRLF, BOM).
  function parseCSV(text) {
    text = text.replace(/^﻿/, "");
    const rows = [];
    let row = [], cell = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') q = false;
        else cell += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(cell); cell = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(cell); cell = "";
        if (row.some((x) => x.trim() !== "")) rows.push(row);
        row = [];
      } else cell += c;
    }
    row.push(cell);
    if (row.some((x) => x.trim() !== "")) rows.push(row);
    const head = rows.shift().map((h) => h.trim());
    return rows.map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? "").trim()])));
  }

  const norm = (v) => (v ?? "").trim().toLowerCase();

  // Normalise a raw row. Unknown/blank values become null (never guessed).
  function clean(raw) {
    const issues = [];
    const scale = (key) => {
      const s = norm(raw[key]);
      if (s === "") { issues.push(key + " missing"); return null; }
      const n = Number(s);
      if (![1, 2, 3, 4].includes(n)) { issues.push(key + " invalid (" + raw[key] + ")"); return null; }
      return n;
    };
    const pick = (key, map) => {
      const s = norm(raw[key]);
      if (s === "") { issues.push(key + " missing"); return null; }
      if (map[s]) return map[s];
      issues.push(key + " invalid (" + raw[key] + ")");
      return null;
    };
    const yn = { yes: "Yes", y: "Yes", no: "No", n: "No" };
    return {
      id: (raw.student_id || "").trim(),
      school: (raw.school || "").trim().replace(/\s+/g, " "),
      cls: (raw.class || "").trim().toUpperCase(),
      q1: scale("q1_sleep_well"),
      q2: scale("q2_safe_at_home"),
      q3: pick("q3_bullied", { never: "Never", sometimes: "Sometimes", often: "Often" }),
      q4: pick("q4_trusted_adult", yn),
      q5: pick("q5_sad_most_days", yn),
      q6: pick("q6_thoughts_of_self_harm", { ...yn, "prefer not to say": "Prefer not to say" }),
      q7: pick("q7_wants_counsellor", yn),
      comment: (raw.comment || "").trim(),
      issues,
    };
  }

  // Baseline rules in order (first match wins) + extra rules (AC-08).
  // Returns { level, reasons[] }.
  function flag(s) {
    const r = [];
    // 1. Urgent
    if (s.q6 === "Yes") return { level: "Urgent", reasons: ["Reported thoughts of self-harm (Q6 = Yes)"] };
    // 2. High
    if (s.q3 === "Often") r.push("Bullied often (Q3)");
    if (s.q2 === 1) r.push("Never feels safe at home (Q2 = 1)");
    if (r.length) return withExtra(s, "High", r);
    // 3. Review
    const signals = [];
    if (s.q1 !== null && s.q1 <= 2) signals.push("sleeps poorly (Q1 ≤ 2)");
    if (s.q5 === "Yes") signals.push("sad most days (Q5)");
    if (s.q4 === "No") signals.push("no trusted adult (Q4)");
    if (signals.length >= 2) r.push("Two or more signals: " + signals.join(", "));
    if (s.q7 === "Yes") r.push("Asked to see the counsellor (Q7)");
    if (r.length) return withExtra(s, "Review", r, signals);
    return withExtra(s, "None", [], signals);
  }

  // EXTRA RULE (AC-08): "Prefer not to say" on Q6 is not a "No". Baseline rules give such a
  // student None unless other answers happen to match. We treat it as at least Review,
  // and High if any other risk signal is present. Also: if key answers are missing and
  // nothing else flagged, send to Review rather than silently showing None.
  function withExtra(s, level, reasons, signals = []) {
    reasons = reasons.slice();
    if (s.q6 === "Prefer not to say") {
      const other = signals.length > 0 || s.q7 === "Yes" || reasons.length > 0;
      const target = other ? "High" : "Review";
      reasons.push("Chose “Prefer not to say” on self-harm question (Q6)" + (other ? " alongside other signals" : ""));
      if (RANK[target] < RANK[level]) level = target;
    } else if (level === "None" && (s.q2 === null || s.q3 === null || s.q6 === null)) {
      level = "Review";
      reasons.push("Key answers missing – check manually");
    }
    if (level === "None") reasons = ["No risk rule matched"];
    return { level, reasons };
  }

  function build(rawRows) {
    const students = rawRows.map(clean).filter((s) => s.id);
    const seen = new Set();
    students.forEach((s) => {
      if (seen.has(s.id)) s.issues.push("duplicate student_id");
      seen.add(s.id);
      Object.assign(s, flag(s));
    });
    students.sort((a, b) => RANK[a.level] - RANK[b.level] || a.id.localeCompare(b.id));
    return students;
  }

  const ROMAN = ["I","II","III","IV","V","VI","VII","VIII","IX","X","XI","XII"];
  const classOrder = (c) => { const i = ROMAN.indexOf(c); return i < 0 ? 99 : i; };

  // Supervisor aggregation. NO student IDs leave this function.
  // Groups with fewer than MIN students show "<5" for every number.
  const MIN_GROUP = 5;
  function aggregate(students) {
    const groups = new Map();
    for (const s of students) {
      const key = s.school + "|" + s.cls;
      if (!groups.has(key)) groups.set(key, { school: s.school, cls: s.cls, n: 0, counts: { Urgent: 0, High: 0, Review: 0, None: 0 } });
      const g = groups.get(key);
      g.n++; g.counts[s.level]++;
    }
    return [...groups.values()]
      .sort((a, b) => a.school.localeCompare(b.school) || classOrder(a.cls) - classOrder(b.cls))
      .map((g) => (g.n < MIN_GROUP
        ? { school: g.school, cls: g.cls, suppressed: true, total: "<5", counts: { Urgent: "<5", High: "<5", Review: "<5", None: "<5" } }
        : { school: g.school, cls: g.cls, suppressed: false, total: g.n, counts: g.counts }));
  }

  const api = { LEVELS, RANK, parseCSV, clean, flag, build, aggregate, MIN_GROUP, classOrder };
  if (typeof module !== "undefined") module.exports = api;
  else root.SA = api;
})(typeof window !== "undefined" ? window : globalThis);
