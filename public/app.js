const $ = (id) => document.getElementById(id);
const COLORS = { Urgent: "#c1121f", High: "#e8590c", Review: "#f2b705", None: "#8a94a6" };
const STATUSES = ["Not started", "In progress", "Closed"];
const KEY = "sa-followups-v1";
let students = [];
let status = {};
try { status = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch { status = {}; }

const saveStatus = () => { try { localStorage.setItem(KEY, JSON.stringify(status)); } catch {} };
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

async function load() {
  try {
    const res = await fetch("data/SA_sample_dataset_SYNTHETIC.csv");
    if (!res.ok) throw new Error(res.status);
    init(await res.text());
  } catch {
    $("loader").hidden = false;
    $("file").onchange = async (e) => {
      const f = e.target.files[0];
      if (f) { $("loader").hidden = true; init(await f.text()); }
    };
  }
}

function init(text) {
  students = SA.build(SA.parseCSV(text));
  const bad = students.filter((s) => s.issues.length);
  if (bad.length) {
    $("notes").hidden = false;
    $("notes").innerHTML = "<b>Data quality:</b> " + bad.length + " record(s) had problems, handled without guessing: " +
      bad.map((s) => esc(s.id) + " (" + esc(s.issues.join("; ")) + ")").join(", ");
  }
  const uniq = (k) => [...new Set(students.map((s) => s[k]))].sort((a, b) => k === "cls" ? SA.classOrder(a) - SA.classOrder(b) : a.localeCompare(b));
  uniq("school").forEach((v) => $("f-school").add(new Option(v, v)));
  uniq("cls").forEach((v) => $("f-class").add(new Option(v, v)));
  ["search", "f-school", "f-class", "f-level", "f-open"].forEach((id) => $(id).addEventListener("input", renderTable));
  renderTable();
  renderSupervisor();
}

function renderTable() {
  const q = $("search").value.trim().toLowerCase();
  const fs = $("f-school").value, fc = $("f-class").value, fl = $("f-level").value, hide = $("f-open").checked;
  const rows = students.filter((s) =>
    (!q || s.id.toLowerCase().includes(q)) && (!fs || s.school === fs) && (!fc || s.cls === fc) &&
    (!fl || s.level === fl) && !(hide && s.level !== "None" && status[s.id] === "Closed"));

  const counts = { Urgent: 0, High: 0, Review: 0, None: 0 };
  students.forEach((s) => counts[s.level]++);
  $("summary").innerHTML = SA.LEVELS.map((l) =>
    `<button class="stat s-${l}${$("f-level").value === l ? " on" : ""}" data-level="${l}" title="Click to filter by ${l}">
       <span class="num">${counts[l]}</span><span class="lab">${l}</span></button>`).join("") +
    `<div class="showing">Showing ${rows.length} of ${students.length}</div>`;
  document.querySelectorAll(".stat").forEach((b) => b.onclick = () => {
    $("f-level").value = $("f-level").value === b.dataset.level ? "" : b.dataset.level;
    renderTable();
  });

  $("tbl").querySelector("tbody").innerHTML = rows.map((s) => {
    const st = status[s.id] || "Not started";
    const follow = s.level === "None" ? '<span class="na">–</span>' :
      `<select data-id="${esc(s.id)}" aria-label="Follow-up status for ${esc(s.id)}">` +
      STATUSES.map((o) => `<option${o === st ? " selected" : ""}>${o}</option>`).join("") + "</select>";
    return `<tr class="r-${s.level}${s.level !== "None" && st === "Closed" ? " closed" : ""}">
      <td>${esc(s.id)}</td><td>${esc(s.school)}</td><td>${esc(s.cls)}</td>
      <td><span class="badge ${s.level}">${s.level === "Urgent" ? "⚠ URGENT" : s.level}</span></td>
      <td>${esc(s.reasons.join(" · "))}</td><td>${follow}</td></tr>`;
  }).join("") || '<tr><td colspan="6" class="na">No students match.</td></tr>';

  document.querySelectorAll("td select").forEach((el) => el.onchange = () => {
    status[el.dataset.id] = el.value; saveStatus(); renderTable();
  });
}

function renderSupervisor() {
  const agg = SA.aggregate(students);
  const cell = (g, l) => g.suppressed ? '<span class="na">&lt;5</span>' : g.counts[l];
  $("agg").querySelector("tbody").innerHTML = agg.map((g) =>
    `<tr><td>${esc(g.school)}</td><td>${esc(g.cls)}</td><td>${g.suppressed ? '<span class="na">&lt;5</span>' : g.total}</td>` +
    SA.LEVELS.map((l) => `<td>${cell(g, l)}</td>`).join("") + "</tr>").join("");

  $("chart").innerHTML = '<div class="legend">' + SA.LEVELS.map((l) => `<span><i style="background:${COLORS[l]}"></i>${l}</span>`).join("") + "</div>" +
    agg.map((g) => g.suppressed
      ? `<div class="barrow"><span class="lbl">${esc(g.school)} · ${esc(g.cls)}</span><span class="na">&lt;5 students – hidden</span></div>`
      : `<div class="barrow"><span class="lbl">${esc(g.school)} · ${esc(g.cls)}</span><div class="bar" role="img" aria-label="${SA.LEVELS.map((l) => l + " " + g.counts[l]).join(", ")}">` +
        SA.LEVELS.map((l) => `<span style="width:${g.counts[l] / g.total * 100}%;background:${COLORS[l]}" title="${l}: ${g.counts[l]}"></span>`).join("") + "</div></div>").join("");
}

function show(which) {
  $("counsellor").hidden = which !== "c"; $("supervisor").hidden = which !== "s";
  $("tab-c").classList.toggle("active", which === "c"); $("tab-s").classList.toggle("active", which === "s");
}
$("tab-c").onclick = () => show("c");
$("tab-s").onclick = () => show("s");
load();
