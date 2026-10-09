const BASE_URL = "https://testingwgu-bit.github.io/c722-practice-test/";
const QUESTION_PATH = BASE_URL + "questions/";
const DOMAIN_PATH = BASE_URL + "questions/domain-tests/";
const FLASHCARD_PATH = BASE_URL + "flashcards/";

let questions = [];
let index = 0;
let mode = "normal";

/* ============================
   VIEW SWITCHING
   ============================ */

function showTestView() {
    document.querySelector(".menu").style.display = "none";
    document.getElementById("question-container").style.display = "block";
}

function showDashboard() {
    document.querySelector(".menu").style.display = "block";
    document.getElementById("question-container").style.display = "none";
}

/* ============================
   STATS SYSTEM
   ============================ */

let stats = {
    answered: 0,
    missed: 0,
    mastered: 0,
    todayCount: 0,
    dailyGoal: 20,
    streak: 0,
    lastStudyDate: null
};

function initStats() {
    const saved = JSON.parse(localStorage.getItem("stats") || "null");
    if (saved) stats = saved;

    const today = new Date().toISOString().slice(0,10);
    if (stats.lastStudyDate !== today) {
        if (stats.lastStudyDate) {
            const prev = new Date(stats.lastStudyDate);
            const diff = (new Date(today) - prev) / (1000*60*60*24);
            stats.streak = diff === 1 ? stats.streak + 1 : 1;
        } else {
            stats.streak = 1;
        }
        stats.todayCount = 0;
        stats.lastStudyDate = today;
        saveStats();
    }
    renderStats();
}

function saveStats() {
    localStorage.setItem("stats", JSON.stringify(stats));
}

function renderStats() {
    document.getElementById("stat-answered").textContent = stats.answered;
    document.getElementById("stat-missed").textContent = stats.missed;
    document.getElementById("stat-mastered").textContent = stats.mastered;
    document.getElementById("stat-streak").textContent = stats.streak;
    document.getElementById("stat-today").textContent = stats.todayCount;
    document.querySelectorAll("#stat-goal").forEach(el => el.textContent = stats.dailyGoal);

    const pct = Math.min(100, (stats.todayCount / stats.dailyGoal) * 100);
    document.getElementById("progress-fill").style.width = pct + "%";
}

/* ============================
   LOADERS
   ============================ */

function loadTest(file) {
    mode = "normal";
    index = 0;

    showTestView();

    const path = file.includes("domain") ? DOMAIN_PATH + file : QUESTION_PATH + file;

    fetch(path)
        .then(res => res.text())
        .then(text => {
            questions = parseQuestions(text);
            showQuestion();
        });
}

function loadFlashcards(file) {
    mode = "flashcards";
    index = 0;

    showTestView();

    fetch(FLASHCARD_PATH + file)
        .then(res => res.text())
        .then(text => {
            questions = parseFlashcards(text);
            showFlashcard();
        });
}

/* ============================
   PARSERS
   ============================ */

function parseQuestions(md) {
    return md.split("\n---").map(block => block.trim()).filter(b => b.includes("Question"));
}

function parseFlashcards(md) {
    return md.split("\n\n").map(card => card.trim()).filter(c => c.length > 0);
}

/* ============================
   QUESTION VIEW
   ============================ */

function showQuestion() {
    if (index >= questions.length) {
        document.getElementById("question-container").innerHTML = "<h2>Test Complete!</h2>";
        return;
    }

    const q = questions[index];

    document.getElementById("question-container").innerHTML = `
        <div class="question">
            <div class="question-text">
                ${q.split("**Answer:**")[0].trim()}
            </div>

            <button onclick="toggleAnswer()">Show Answer</button>

            <div class="answer">
                ${q.split("**Answer:**")[1].trim()}
            </div>

            <div class="controls">
                <button onclick="mark('know')">I know this</button>
                <button onclick="mark('review')">Review again</button>
                <button onclick="mark('missed')">Missed this question</button>
                <button onclick="mark('flag')">Flag this question</button>
            </div>

            <div style="margin-top:20px;">
                <button onclick="showDashboard()">Back to Dashboard</button>
            </div>
        </div>
    `;
}

/* ============================
   FLASHCARD VIEW
   ============================ */

function showFlashcard() {
    if (index >= questions.length) {
        document.getElementById("question-container").innerHTML = "<h2>Flashcards Complete!</h2>";
        return;
    }

    const card = questions[index];

    document.getElementById("question-container").innerHTML = `
        <div class="question">
            <div class="question-text">
                <strong>${card.split(":")[0].trim()}</strong>
            </div>

            <button onclick="toggleAnswer()">Show Answer</button>

            <div class="answer">
                ${card.split(":")[1].trim()}
            </div>

            <div style="margin-top:20px;">
                <button onclick="showDashboard()">Back to Dashboard</button>
            </div>
        </div>
    `;
}

/* ============================
   INTERACTION
   ============================ */

function toggleAnswer() {
    const ans = document.querySelector(".answer");
    if (ans) ans.style.display = "block";
}

function mark(type) {
    stats.answered += 1;
    stats.todayCount += 1;

    let missedList = JSON.parse(localStorage.getItem("missed") || "[]");

    if (type === "missed") {
        stats.missed += 1;
        missedList.push(questions[index]);
        localStorage.setItem("missed", JSON.stringify(missedList));
        questions.splice(index + 3, 0, questions[index]);
    } else if (type === "know") {
        stats.mastered += 1;
    }

    saveStats();
    renderStats();

    index++;
    mode === "flashcards" ? showFlashcard() : showQuestion();
}

/* ============================
   MODES
   ============================ */

function startMissedMode() {
    mode = "missed";
    index = 0;

    let missedList = JSON.parse(localStorage.getItem("missed") || "[]");
    questions = missedList;
    showQuestion();
}

function continueSession() {
    showQuestion();
}

function startExam() {
    mode = "exam";
    index = 0;

    fetch(QUESTION_PATH + "high-priority-test.md")
        .then(res => res.text())
        .then(text => {
            questions = shuffle(parseQuestions(text)).slice(0, 76);
            showQuestion();
        });
}

function shuffle(arr) {
    return arr.sort(() => Math.random() - 0.5);
}

/* ============================
   DARK MODE
   ============================ */

function toggleDarkMode() {
    document.body.classList.toggle("dark");
    localStorage.setItem("darkMode", document.body.classList.contains("dark") ? "1" : "0");
}

function initDarkMode() {
    const dm = localStorage.getItem("darkMode");
    if (dm === "1") document.body.classList.add("dark");
}

/* ============================
   INIT
   ============================ */

window.onload = () => {
    initDarkMode();
    initStats();
};
