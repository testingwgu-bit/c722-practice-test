const QUESTION_PATH = "questions/";
const DOMAIN_PATH = "questions/domain-tests/";
const FLASHCARD_PATH = "flashcards/";

let questions = [];
let index = 0;
let mode = "normal";

function loadTest(file) {
    mode = "normal";
    index = 0;

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

    fetch(FLASHCARD_PATH + file)
        .then(res => res.text())
        .then(text => {
            questions = parseFlashcards(text);
            showFlashcard();
        });
}

function parseQuestions(md) {
    return md.split("\n---").map(block => block.trim()).filter(b => b.includes("Question"));
}

function parseFlashcards(md) {
    return md.split("\n\n").map(card => card.trim()).filter(c => c.length > 0);
}

function showQuestion() {
    if (index >= questions.length) {
        document.getElementById("question-container").innerHTML = "<h2>Test Complete!</h2>";
        return;
    }

    const q = questions[index];

    document.getElementById("question-container").innerHTML = `
        <div class="question">
            ${q.split("**Answer:**")[0]}
            <button onclick="toggleAnswer()">Show Answer</button>
            <div class="answer">${q.split("**Answer:**")[1]}</div>

            <div class="controls">
                <button onclick="mark('know')">I know this</button>
                <button onclick="mark('review')">Review again</button>
                <button onclick="mark('missed')">Missed this question</button>
                <button onclick="mark('flag')">Flag this question</button>
            </div>
        </div>
    `;
}

function showFlashcard() {
    if (index >= questions.length) {
        document.getElementById("question-container").innerHTML = "<h2>Flashcards Complete!</h2>";
        return;
    }

    const card = questions[index];

    document.getElementById("question-container").innerHTML = `
        <div class="question">
            <strong>${card.split(":")[0]}</strong>
            <button onclick="toggleAnswer()">Show Answer</button>
            <div class="answer">${card.split(":")[1]}</div>
        </div>
    `;
}

function toggleAnswer() {
    document.querySelector(".answer").style.display = "block";
}

function mark(type) {
    let missedList = JSON.parse(localStorage.getItem("missed") || "[]");

    if (type === "missed") {
        missedList.push(questions[index]);
        localStorage.setItem("missed", JSON.stringify(missedList));
        questions.splice(index + 3, 0, questions[index]); // repeat later
    }

    index++;
    showQuestion();
}

function startMissedMode() {
    mode = "missed";
    index = 0;

    let missedList = JSON.parse(localStorage.getItem("missed") || "[]");
    questions = missedList;
    showQuestion();
}

function continueSession() {
    let savedIndex = localStorage.getItem("index");
    if (savedIndex) index = parseInt(savedIndex);
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
