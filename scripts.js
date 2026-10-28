"use strict";

/* ============================================================
   CONFIGURATION  (change these to match your university)
   ============================================================ */
const CA_MAX = 30;      // maximum Continuous Assessment mark
const EXAM_MAX = 70;    // maximum Exam mark  (CA_MAX + EXAM_MAX = 100)
const DEFAULT_ROWS = 5;

// Grade scale: min score -> letter -> grade point (highest first)
const GRADE_SCALE = [
    { min: 80, letter: "A",  point: 4.0 },
    { min: 70, letter: "B+", point: 3.5 },
    { min: 60, letter: "B",  point: 3.0 },
    { min: 55, letter: "C+", point: 2.5 },
    { min: 50, letter: "C",  point: 2.0 },
    { min: 45, letter: "D+", point: 1.5 },
    { min: 40, letter: "D",  point: 1.0 },
    { min: 0,  letter: "F",  point: 0.0 }
];

// Degree classification by GPA (highest first)
const CLASSES = [
    { min: 3.5, name: "First Class" },
    { min: 3.0, name: "Second Class Upper" },
    { min: 2.5, name: "Second Class Lower" },
    { min: 2.0, name: "Third Class" },
    { min: 0,   name: "Pass / Fail" }
];

const STORAGE = { theme: "gpa_theme", history: "gpa_history" };

/* ============================================================
   HELPERS
   ============================================================ */
const $ = (id) => document.getElementById(id);

const els = {
    body: $("courseBody"),
    error: $("errorBox"),
    gpaValue: $("gpaValue"),
    gpaRing: $("gpaRing"),
    letterChip: $("letterChip"),
    classChip: $("classChip"),
    statCredits: $("statCredits"),
    statPoints: $("statPoints"),
    statCourses: $("statCourses"),
    historyBody: $("historyBody"),
    emptyHistory: $("emptyHistory"),
    scaleBody: $("scaleBody")
};

let rowId = 0;
let history = [];

function gradeFor(score) {
    return GRADE_SCALE.find((g) => score >= g.min);
}

function classFor(gpa) {
    return CLASSES.find((c) => gpa >= c.min).name;
}

function gradeClass(letter) {
    return "g-" + letter.charAt(0);
}

function safeStorage(action, key, value) {
    try {
        if (action === "get") return localStorage.getItem(key);
        if (action === "set") localStorage.setItem(key, value);
    } catch (e) { /* storage unavailable */ }
    return null;
}

/* ============================================================
   COURSE ROWS
   ============================================================ */
function addCourse(animate = true) {
    rowId++;
    const n = els.body.children.length + 1;
    const tr = document.createElement("tr");
    tr.dataset.id = rowId;
    if (animate) tr.classList.add("row-in");

    tr.innerHTML = `
        <td class="row-num">${n}</td>
        <td><input type="text" class="f-name" placeholder="Course ${n}" aria-label="Course name"></td>
        <td><input type="number" class="f-ca" min="0" max="${CA_MAX}" step="any" placeholder="0-${CA_MAX}" aria-label="CA score"></td>
        <td><input type="number" class="f-exam" min="0" max="${EXAM_MAX}" step="any" placeholder="0-${EXAM_MAX}" aria-label="Exam score"></td>
        <td><input type="number" class="f-credit" min="0" max="20" step="any" placeholder="e.g. 3" aria-label="Credit units"></td>
        <td class="cell-total">–</td>
        <td><span class="grade-badge">–</span></td>
        <td><button class="row-del" title="Remove course" aria-label="Remove course">&times;</button></td>
    `;

    tr.querySelectorAll("input").forEach((inp) => inp.addEventListener("input", () => liveUpdate(tr)));
    tr.querySelector(".row-del").addEventListener("click", () => removeCourse(tr));
    els.body.appendChild(tr);
}

function removeCourse(tr) {
    if (els.body.children.length <= 1) {
        showError("You need at least one course row.");
        return;
    }
    tr.remove();
    renumber();
    hideError();
}

function renumber() {
    [...els.body.children].forEach((tr, i) => {
        tr.querySelector(".row-num").textContent = i + 1;
        tr.querySelector(".f-name").placeholder = "Course " + (i + 1);
    });
}

function readRow(tr) {
    const caRaw = tr.querySelector(".f-ca").value;
    const examRaw = tr.querySelector(".f-exam").value;
    const credRaw = tr.querySelector(".f-credit").value;
    return {
        tr,
        name: tr.querySelector(".f-name").value.trim(),
        ca: caRaw === "" ? null : parseFloat(caRaw),
        exam: examRaw === "" ? null : parseFloat(examRaw),
        credit: credRaw === "" ? null : parseFloat(credRaw)
    };
}

// Show total + grade per row while typing
function liveUpdate(tr) {
    const r = readRow(tr);
    const total = tr.querySelector(".cell-total");
    const badge = tr.querySelector(".grade-badge");

    tr.querySelectorAll("input").forEach((i) => i.classList.remove("invalid"));

    if (r.ca === null && r.exam === null) {
        total.textContent = "–";
        badge.textContent = "–";
        badge.className = "grade-badge";
        return;
    }

    const score = (r.ca || 0) + (r.exam || 0);
    const g = gradeFor(score);
    total.textContent = round(score) + "%";
    badge.textContent = g.letter;
    badge.className = "grade-badge " + gradeClass(g.letter);
}

function round(n) {
    return Math.round(n * 100) / 100;
}

/* ============================================================
   VALIDATION + CALCULATION
   ============================================================ */
function validate(rows) {
    const problems = [];

    rows.forEach((r, i) => {
        const label = r.name || "Course " + (i + 1);
        const fields = [
            { key: "ca", sel: ".f-ca", max: CA_MAX, label: "CA" },
            { key: "exam", sel: ".f-exam", max: EXAM_MAX, label: "Exam" },
            { key: "credit", sel: ".f-credit", max: 20, label: "Credit" }
        ];
        fields.forEach((f) => {
            const v = r[f.key];
            if (v !== null && (isNaN(v) || v < 0 || v > f.max)) {
                r.tr.querySelector(f.sel).classList.add("invalid");
                problems.push(`${label}: ${f.label} must be between 0 and ${f.max}.`);
            }
        });
        if (r.credit === null || r.credit === 0) {
            // allowed to skip empty rows, but flag partial rows
            if (r.ca !== null || r.exam !== null) {
                r.tr.querySelector(".f-credit").classList.add("invalid");
                problems.push(`${label}: please enter the credit units.`);
            }
        }
    });

    return problems;
}

function calculateGPA() {
    hideError();
    const rows = [...els.body.children].map(readRow);
    const problems = validate(rows);

    if (problems.length) {
        showError(problems.slice(0, 3).join(" ") + (problems.length > 3 ? ` (+${problems.length - 3} more)` : ""));
        return;
    }

    let points = 0, credits = 0, counted = 0;

    rows.forEach((r) => {
        if (!r.credit) return; // skip rows without credits
        const score = (r.ca || 0) + (r.exam || 0);
        const g = gradeFor(score);
        points += g.point * r.credit;
        credits += r.credit;
        counted++;
    });

    if (!credits) {
        showError("Enter at least one course with its scores and credit units.");
        return;
    }

    const gpa = points / credits;
    const gpaFixed = gpa.toFixed(2);
    const letter = gradeFor(gpaToScore(gpa)).letter;

    showResult(gpa, letter, credits, points, counted);
    addHistory({
        date: new Date().toLocaleDateString(),
        courses: counted,
        credits: round(credits),
        gpa: gpaFixed,
        letter
    });
}

// Convert GPA back to a letter using the same grade points
function gpaToScore(gpa) {
    const g = GRADE_SCALE.find((x) => gpa >= x.point);
    return g.min;
}

function showResult(gpa, letter, credits, points, counted) {
    els.gpaValue.textContent = gpa.toFixed(2);
    els.gpaRing.style.setProperty("--pct", (gpa / 4) * 100);
    els.letterChip.textContent = "Grade: " + letter;
    els.classChip.textContent = "Class: " + classFor(gpa);
    els.statCredits.textContent = round(credits);
    els.statPoints.textContent = round(points);
    els.statCourses.textContent = counted;
}

/* ============================================================
   HISTORY
   ============================================================ */
function addHistory(entry) {
    history.push(entry);
    safeStorage("set", STORAGE.history, JSON.stringify(history));
    renderHistory();
}

function renderHistory() {
    els.historyBody.innerHTML = "";
    history.forEach((h, i) => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${i + 1}</td>
            <td>${h.date}</td>
            <td>${h.courses}</td>
            <td>${h.credits}</td>
            <td><b>${h.gpa}</b></td>
            <td><span class="grade-badge ${gradeClass(h.letter)}">${h.letter}</span></td>
        `;
        els.historyBody.appendChild(tr);
    });
    els.emptyHistory.hidden = history.length > 0;
}

function clearHistory() {
    if (!history.length) return;
    if (!confirm("Clear all saved history?")) return;
    history = [];
    safeStorage("set", STORAGE.history, "[]");
    renderHistory();
}

function downloadHistory() {
    if (!history.length) {
        showError("There is no history to download yet.");
        return;
    }
    const lines = ["No,Date,Courses,Credits,GPA,Grade"];
    history.forEach((h, i) => {
        lines.push([i + 1, h.date, h.courses, h.credits, h.gpa, h.letter].join(","));
    });
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "gpa_history.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(a.href);
}

/* ============================================================
   UI UTILITIES
   ============================================================ */
function showError(msg) {
    els.error.textContent = msg;
    els.error.hidden = false;
}

function hideError() {
    els.error.hidden = true;
}

function resetForm() {
    els.body.innerHTML = "";
    for (let i = 0; i < DEFAULT_ROWS; i++) addCourse(false);
    hideError();
    showResult(0, "–", 0, 0, 0);
    els.letterChip.textContent = "Grade: –";
    els.classChip.textContent = "Class: –";
}

function renderScale() {
    els.scaleBody.innerHTML = GRADE_SCALE.map((g, i) => {
        const upper = i === 0 ? 100 : GRADE_SCALE[i - 1].min - 1;
        return `<tr>
            <td>${g.min} – ${upper}</td>
            <td><span class="grade-badge ${gradeClass(g.letter)}">${g.letter}</span></td>
            <td><b>${g.point.toFixed(1)}</b></td>
        </tr>`;
    }).join("");
}

/* ----- Theme ----- */
function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    $("iconMoon").hidden = theme === "dark";
    $("iconSun").hidden = theme !== "dark";
}

function toggleTheme() {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next);
    safeStorage("set", STORAGE.theme, next);
}

function initTheme() {
    const saved = safeStorage("get", STORAGE.theme);
    const prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    applyTheme(saved || (prefersDark ? "dark" : "light"));
}

/* ============================================================
   INIT
   ============================================================ */
document.addEventListener("DOMContentLoaded", () => {
    $("caMaxLabel").textContent = CA_MAX;
    $("examMaxLabel").textContent = EXAM_MAX;
    $("year").textContent = new Date().getFullYear();

    initTheme();
    renderScale();

    try {
        history = JSON.parse(safeStorage("get", STORAGE.history) || "[]");
    } catch (e) {
        history = [];
    }
    renderHistory();
    resetForm();

    $("addBtn").addEventListener("click", () => { addCourse(); hideError(); });
    $("resetBtn").addEventListener("click", resetForm);
    $("calcBtn").addEventListener("click", calculateGPA);
    $("downloadBtn").addEventListener("click", downloadHistory);
    $("clearBtn").addEventListener("click", clearHistory);
    $("themeBtn").addEventListener("click", toggleTheme);

    // Press Enter in any field to calculate
    els.body.addEventListener("keydown", (e) => {
        if (e.key === "Enter") calculateGPA();
    });
});
