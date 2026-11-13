const assert = require("assert"), fs = require("fs"), path = require("path");
const SA = require("../public/rules.js");
const rows = SA.parseCSV(fs.readFileSync(path.join(__dirname, "../data/SA_sample_dataset_SYNTHETIC.csv"), "utf8"));
const st = SA.build(rows);
const by = Object.fromEntries(st.map((s) => [s.id, s]));

assert.strictEqual(st.length, 72);
assert.strictEqual(by["S-005"].level, "Urgent");           // q6 Yes
assert.strictEqual(by["S-038"].level, "Urgent");
assert.strictEqual(by["S-001"].level, "High");             // q2 = 1
assert.strictEqual(by["S-045"].level, "High");             // "often" lower-case cleaned
assert.strictEqual(by["S-014"].level, "High");             // q3 Often beats Review
assert.strictEqual(by["S-016"].level, "High");             // PNTS + other signals (extra rule)
assert.strictEqual(by["S-027"].level, "High");             // PNTS + no adult (extra rule)
assert.strictEqual(by["S-029"].level, "High");             // PNTS + q1<=2... see data
assert.strictEqual(by["S-003"].level, "None");             // only one review signal
assert.strictEqual(by["S-013"].level, "Review");           // q1<=2 + q5 Yes
assert.strictEqual(by["S-018"].level, "Review");           // q7 Yes
assert.ok(by["S-010"].issues.length === 1);                // missing q1 flagged, not guessed
assert.strictEqual(st[0].level, "Urgent");                 // urgent first
const agg = SA.aggregate(st);
const d = agg.find((g) => g.school === "School D" && g.cls === "XI");
assert.strictEqual(d.total, "<5");
assert.ok(!JSON.stringify(agg).includes("S-0"));           // no IDs in supervisor data
console.log("levels:", SA.LEVELS.map((l) => l + "=" + st.filter((s) => s.level === l).length).join(" "));
console.log("all tests passed");
