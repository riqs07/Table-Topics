// Table Topics - Main Application
// Initializes and wires up all components

const Palette = {
    green: "hsl(142, 76%, 46%)",
    yellow: "hsl(48, 96%, 53%)",
    red: "hsl(0, 84%, 60%)",
    grey: "hsl(240, 5%, 84%)"
};

let time = 0;
let countdownTime = 6;

// UI Element references
let timer;
let questionDisplay;
let background;
let countDownTimerDisplay;
let wordOTD;
let btnPause;
let btnStop;
let btnRecord;
let btnResume;
let btnPlay;
let btnReset;
let btnSettings;
let btnHistory;
let settingsCard;
let displayCard;
let recordingIndicator;
let analysisCard;
let historyCard;
let gameCard;

function getUISelectors() {
    timer = document.getElementById('timer');
    questionDisplay = document.querySelector('#main-display');
    background = document.querySelector('.background');
    countDownTimerDisplay = document.querySelector('#countdown');
    wordOTD = document.querySelector('#WOD');
    gameCard = document.querySelector('#game-card');

    btnPause = document.querySelector('#pause');
    btnStop = document.querySelector('#stop');
    btnRecord = document.querySelector('#record');
    btnResume = document.querySelector('#resume');
    btnPlay = document.querySelector('#play');
    btnReset = document.querySelector('#reset');
    btnSettings = document.querySelector('#settings');
    btnHistory = document.querySelector('#history-btn');

    settingsCard = document.querySelector('#settings-card');
    displayCard = document.querySelector('#display-card');
    recordingIndicator = document.querySelector('#recording-indicator');
    analysisCard = document.querySelector('#analysis-results-card');
    historyCard = document.querySelector('#history-card');
}

function getEventListeners() {
    btnPause.addEventListener('click', pauseTimer);
    btnResume.addEventListener('click', resumeGame);
    btnPlay.addEventListener('click', playGame);
    btnReset.addEventListener('click', resetGame);
    btnStop.addEventListener('click', stopGame);
    btnSettings.addEventListener('click', SettingsToggle);

    // Record button - toggle recording
    btnRecord.addEventListener('click', handleRecordClick);

    // History button
    btnHistory.addEventListener('click', viewSessionHistory);

    // Edit list click handler
    document.querySelector("#edit-question-list")
        .addEventListener('click', itemEditClick);

    // Initialize collapsible elements
    document.addEventListener('click', (e) => {
        if (e.target.closest('.collapsible-header')) {
            const collapsible = e.target.closest('.collapsible');
            if (collapsible) {
                collapsible.classList.toggle('active');
            }
        }
    });
}

// Handle record button click
async function handleRecordClick() {
    if (isCurrentlyRecording()) {
        // Stop recording and trigger analysis
        stopRecording();
        showRecordingIndicator(false);
        btnRecord.classList.remove('active');
    } else {
        // Start recording
        const started = await startRecording();
        if (started) {
            showRecordingIndicator(true);
            btnRecord.classList.add('active');
        }
    }
}

// Show/hide recording indicator
function showRecordingIndicator(show) {
    if (recordingIndicator) {
        recordingIndicator.style.display = show ? 'flex' : 'none';
    }
    // Update button state
    if (btnRecord) {
        if (show) {
            btnRecord.classList.add('active');
        } else {
            btnRecord.classList.remove('active');
        }
    }
}

// Show API key settings
function showApiKeySettings() {
    showApiKeyPrompt();
}

function init() {
    getUISelectors();
    getEventListeners();

    // Hide initial elements
    displayCard.style.display = "none";
    countDownTimerDisplay.style.display = "none";
    settingsCard.style.display = "none";
    timer.style.display = "none";
    wordOTD.style.display = "none";
    if (analysisCard) analysisCard.style.display = "none";
    if (historyCard) historyCard.style.display = "none";
    if (recordingIndicator) recordingIndicator.style.display = "none";

    showGameButtons('hide');

    // Check for API key on load
    if (typeof hasApiKey === 'function' && !hasApiKey()) {
        console.log('No API key configured. Voice analysis will prompt for key when needed.');
    }

    // Show welcome message with session count
    if (typeof getProgressStats === 'function') {
        const stats = getProgressStats();
        if (stats && stats.totalSessions > 0) {
            showToastAlert(`Welcome back! ${stats.totalSessions} sessions completed.`, 'success');
        }
    }

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
