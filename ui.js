// UI Helper Functions - Modern Design

function enableMenuButtons(type) {
    switch (type) {
        case 'disabled':
            btnPlay.disabled = true;
            btnPlay.classList.add('disabled');
            btnSettings.disabled = true;
            btnSettings.classList.add('disabled');
            break;

        case 'enabled':
            btnPlay.disabled = false;
            btnPlay.classList.remove('disabled');
            btnSettings.disabled = false;
            btnSettings.classList.remove('disabled');
            break;
    }
}

// Modern Toast Notification System
function showToastAlert(msg, type) {
    const container = document.getElementById('toast-container') || createToastContainer();

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;

    // Add icon based on type
    let icon = '';
    switch (type) {
        case 'success':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(142, 76%, 36%);"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>';
            break;
        case 'alert':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(0, 84%, 60%);"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>';
            break;
        case 'finish':
            icon = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: hsl(160, 60%, 45%);"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>';
            break;
    }

    toast.innerHTML = `${icon}<span>${msg}</span>`;

    container.appendChild(toast);

    // Auto-remove after delay
    setTimeout(() => {
        toast.style.animation = 'slide-out 0.3s ease-in forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

function createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toast-container';
    container.className = 'toast-container';
    document.body.appendChild(container);
    return container;
}

// Add slide-out animation
const style = document.createElement('style');
style.textContent = `
    @keyframes slide-out {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

function changeCardColor(color) {
    if (background) {
        background.style.backgroundColor = color;
    }
    if (gameCard) {
        gameCard.style.backgroundColor = color;
    }
}

function showGameButtons(type) {
    const controls = document.querySelector('.game-controls');

    switch (type) {
        case 'show':
            if (controls) controls.style.display = "flex";
            btnPause.style.display = "inline-flex";
            btnResume.style.display = "inline-flex";
            btnReset.style.display = "inline-flex";
            btnStop.style.display = "inline-flex";
            btnRecord.style.display = "inline-flex";
            break;

        case 'hide':
            if (controls) controls.style.display = "none";
            btnPause.style.display = "none";
            btnResume.style.display = "none";
            btnReset.style.display = "none";
            btnStop.style.display = "none";
            btnRecord.style.display = "none";
            break;
    }
}

function openSettings() {
    settingsCard.style.display = "block";
    btnPlay.disabled = true;
    btnPlay.classList.add('disabled');

    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeSettings() {
    settingsCard.style.display = "none";
    displayCard.style.display = "none";

    btnPlay.disabled = false;
    btnPlay.classList.remove('disabled');
}

function closeDisplayCard() {
    displayCard.style.display = "none";
}

function SettingsToggle() {
    if (settingsCard.style.display === "block") {
        closeSettings();
    } else {
        openSettings();
    }
}

function showQuestionsArray() {
    displayCard.style.display = "block";
    document.querySelector('#edit-question-list').innerHTML = '';

    questions.forEach(entry => {
        let li = document.createElement('li');
        li.className = "item";
        li.id = `question-${entry.id}`;
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${entry.question}</strong>
                    <span class="badge ${getDifficultyColor(entry.difficulty)}" style="margin-left: 8px;">${entry.difficulty || 'medium'}</span>
                </div>
                <button class="btn btn-ghost btn-icon edit-item" onclick="itemEditClick(event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
            </div>
        `;
        document.querySelector('#edit-question-list').insertAdjacentElement('beforeend', li);
    });

    showStoredQuestions();
}

function getDifficultyColor(difficulty) {
    switch (difficulty) {
        case 'easy': return 'green';
        case 'hard': return 'red';
        default: return 'orange';
    }
}

function showWODArray() {
    displayCard.style.display = "block";
    document.querySelector('#edit-question-list').innerHTML = '';

    wordOfDay.forEach(entry => {
        let li = document.createElement('li');
        li.className = "item";
        li.id = `WOD-${entry.id}`;
        li.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <strong>${entry.word}</strong>
                    <span class="text-muted" style="margin-left: 8px;">(${entry.partOfSpeech})</span>
                    <p class="text-muted" style="margin: 4px 0 0 0; font-size: 0.875rem;">${entry.definition}</p>
                </div>
                <button class="btn btn-ghost btn-icon edit-item" onclick="itemEditClick(event)">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                </button>
            </div>
        `;
        document.querySelector('#edit-question-list').insertAdjacentElement('beforeend', li);
    });

    showStoredWords();
}

function updateQuestionListInUI(id) {
    question = getQuestionEditStateInputs();

    let questionsList = document.querySelectorAll('.item');
    questionsListArray = Array.from(questionsList);

    questionsListArray.forEach(entry => {
        if (entry.id === `question-${id}`) {
            entry.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${question.updatedQuestion}</strong>
                        <span class="badge ${getDifficultyColor(question.updatedDiffuculty)}" style="margin-left: 8px;">${question.updatedDiffuculty}</span>
                    </div>
                    <button class="btn btn-ghost btn-icon edit-item" onclick="itemEditClick(event)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                </div>
            `;
        }
    });
}

function updateWODListInUI(id) {
    word = getWODEditStateInputs();

    let wordList = document.querySelectorAll('.item');
    wordListArray = Array.from(wordList);

    wordListArray.forEach(entry => {
        if (entry.id === `WOD-${id}`) {
            entry.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <strong>${word.updatedWord}</strong>
                        <span class="text-muted" style="margin-left: 8px;">(${word.updatedPartOfSpeech})</span>
                        <p class="text-muted" style="margin: 4px 0 0 0; font-size: 0.875rem;">${word.updatedDefinition}</p>
                    </div>
                    <button class="btn btn-ghost btn-icon edit-item" onclick="itemEditClick(event)">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                    </button>
                </div>
            `;
        }
    });
}

function deleteFromQuestionListInUI(id) {
    let questionsList = document.querySelectorAll('.item');
    questionsListArray = Array.from(questionsList);

    questionsListArray.forEach(entry => {
        if (entry.id === `question-${id}`) {
            entry.remove();
        }
    });
}

function deleteFromWODListInUI(id) {
    let wordList = document.querySelectorAll('.item');
    wordListArray = Array.from(wordList);

    wordListArray.forEach(entry => {
        if (entry.id === `WOD-${id}`) {
            entry.remove();
        }
    });
}
