// Table Topics - Game Manager
// Handles game flow, timer, and session management

// Current session tracking
let currentQuestion = null;
let currentWord = null;
let gameInProgress = false;
let autoRecordEnabled = true; // Automatically start recording when game starts
let realtimeCoachEnabled = true; // Enable real-time speech coaching

// Current mode settings (will be set from practiceModes.js)
let currentModeSettings = {
    duration: 120,
    qualifyTime: 60,
    warningTime: 90
};

function startCountdownTimer() {
    // Get a random word of the day
    currentWord = getNewWordofTheDay();
    wordOTD.innerHTML = `<strong>${currentWord.word}</strong>: ${currentWord.definition}`;

    countDownTimerDisplay.style.display = "block";
    xx = setInterval(getCountdownTime, 1000);
}

function getCountdownTime() {
    if (countdownTime != 0) {
        countdownTime--;
        countDownTimerDisplay.innerHTML = countdownTime;
    } else {
        countDownTimerDisplay.style.display = "none";
        clearInterval(xx);
        startTimer();
        enableMenuButtons('disabled');
        showGameButtons('show');

        // Auto-start recording when speaking begins
        if (autoRecordEnabled) {
            startRecordingForSession();
        }

        // Start real-time coach if enabled
        if (realtimeCoachEnabled && typeof startRealtimeCoach === 'function') {
            const coachToggle = document.getElementById('coach-toggle');
            if (coachToggle && coachToggle.checked) {
                startRealtimeCoach();
            }
        }
    }
}

// Start recording for the current session
async function startRecordingForSession() {
    // Set session data for the recorder
    setCurrentSessionData(currentQuestion, currentWord);

    // Start recording
    const started = await startRecording();
    if (started) {
        showRecordingIndicator(true);
    }
}

function startTimer() {
    timer.innerHTML = "Go!";
    counter = setInterval(timeTracker, 1000);
    gameInProgress = true;

    if (background.style.backgroundColor != "#fff") {
        changeCardColor('#fff');
    }
}

function timeTracker() {
    time++;
    timer.innerHTML = time;

    // Use mode-specific timings
    const mode = typeof getCurrentMode === 'function' ? getCurrentMode() : null;
    if (mode) {
        currentModeSettings = {
            duration: mode.duration,
            qualifyTime: mode.qualifyTime,
            warningTime: mode.warningTime
        };
    }

    const { duration, qualifyTime, warningTime } = currentModeSettings;

    switch (true) {
        case (time === qualifyTime):
            greenLight();
            break;

        case (time === warningTime):
            yellowLight();
            break;

        case (time === duration - 30):
            if (duration > 60) {
                redLight();
            }
            break;

        case (time === duration):
            gameOver();
            break;
    }

    // For short modes, adjust warnings
    if (duration <= 60) {
        if (time === Math.floor(duration * 0.5) && time !== qualifyTime) {
            yellowLight();
        }
        if (time === Math.floor(duration * 0.8) && time !== warningTime) {
            redLight();
        }
    }
}

function getNewQuestion() {
    const length = questions.length;
    const selection = Math.floor(Math.random() * length);
    const question = questions[selection];

    // Return the question text
    return question.question;
}

function getNewWordofTheDay() {
    const length = wordOfDay.length;
    const selection = Math.floor(Math.random() * length);
    return wordOfDay[selection];
}

function playGame() {
    // Get a new question
    currentQuestion = getNewQuestion();

    // Display the question
    questionDisplay.innerHTML = currentQuestion;
    btnSettings.classList.add('disabled');

    // Hide mode selector during game
    const modeSelector = document.getElementById('mode-selector');
    if (modeSelector) modeSelector.style.display = 'none';

    // Hide coach toggle during game
    const coachToggle = document.querySelector('.coach-toggle');
    if (coachToggle) coachToggle.style.display = 'none';

    // Start the countdown
    startCountdownTimer();

    timer.innerHTML = "Get Ready!";
    timer.style.display = "block";
    wordOTD.style.display = "block";
}

function resetGame() {
    clearInterval(counter);
    resetTimers();
    showToastAlert('Game Reset', 'success');

    // Stop recording if active
    if (typeof isCurrentlyRecording === 'function' && isCurrentlyRecording()) {
        stopRecording();
        showRecordingIndicator(false);
    }

    // Stop real-time coach
    if (typeof stopRealtimeCoach === 'function') {
        stopRealtimeCoach();
    }

    timer.innerHTML = time;
    gameInProgress = false;
}

function pauseTimer() {
    clearInterval(counter);
    showToastAlert('Game Paused', 'success');

    // Pause recording if active
    if (typeof isCurrentlyRecording === 'function' && isCurrentlyRecording()) {
        pauseRecording();
    }
}

function resumeGame() {
    startTimer();
    showToastAlert('Game Resumed', 'success');

    // Resume recording if it was paused
    if (typeof resumeRecording === 'function') {
        resumeRecording();
    }
}

function stopGame() {
    gameOver();
}

function resetTimers() {
    time = 0;
    countdownTime = 6;
}

function greenLight() {
    changeCardColor(Palette.green);
    showToastAlert('Good Job! You Qualified!', 'success');
}

function yellowLight() {
    changeCardColor(Palette.yellow);
}

function redLight() {
    changeCardColor(Palette.red);
    const mode = typeof getCurrentMode === 'function' ? getCurrentMode() : null;
    const remaining = mode ? mode.duration - time : 30;
    showToastAlert(`${remaining} seconds Remaining; Wrap it Up!`, 'alert');
}

function gameOver() {
    changeCardColor(Palette.grey);
    clearInterval(counter);
    showToastAlert('Game Over', 'finish');
    showGameButtons('hide');
    gameInProgress = false;

    // Collect real-time coach data before stopping
    let coachData = null;
    if (typeof getRealtimeCoachData === 'function') {
        coachData = getRealtimeCoachData();
    }

    // Stop real-time coach
    if (typeof stopRealtimeCoach === 'function') {
        stopRealtimeCoach();
    }

    // Stop recording and trigger analysis
    if (typeof isCurrentlyRecording === 'function' && isCurrentlyRecording()) {
        stopRecording();
        showRecordingIndicator(false);
    }

    // Get mode settings for qualification check
    const mode = typeof getCurrentMode === 'function' ? getCurrentMode() : null;
    const qualifyTime = mode ? mode.qualifyTime : 60;
    const duration = mode ? mode.duration : 120;

    // Show qualification status
    if (time < qualifyTime) {
        showToastAlert(`You didn't reach the qualifying time. Your time was ${time} seconds (need ${qualifyTime}+)`, 'alert');
    } else if (time >= qualifyTime && time <= duration) {
        showToastAlert(`Great job, you qualified! Your time was ${time} seconds`, 'success');
    }

    // Perform detailed audio analysis if coach data is available
    if (coachData && typeof analyzeAudioDetailed === 'function') {
        // Small delay to allow speech analysis to complete first
        setTimeout(() => {
            const analysis = analyzeAudioDetailed(coachData);
            if (analysis && typeof renderDetailedAnalysis === 'function') {
                renderDetailedAnalysis(analysis);
            }
        }, 500);
    }

    const finalTime = time;
    resetTimers();

    setTimeout(() => {
        changeCardColor('#fff');
        changeDisplayState("Game over, Play Again?");
        timer.style.display = "none";
        wordOTD.innerHTML = '';
        wordOTD.style.display = 'none';
        enableMenuButtons('enabled');

        // Show mode selector again
        const modeSelector = document.getElementById('mode-selector');
        if (modeSelector) modeSelector.style.display = 'block';

        // Show coach toggle again
        const coachToggle = document.querySelector('.coach-toggle');
        if (coachToggle) coachToggle.style.display = 'block';

        // Reset current session data
        currentQuestion = null;
        currentWord = null;
    }, 4000);
}

// Check if game is in progress
function isGameInProgress() {
    return gameInProgress;
}

// Get current session info
function getCurrentSessionInfo() {
    return {
        question: currentQuestion,
        word: currentWord,
        time: time,
        inProgress: gameInProgress
    };
}

// Initialize game manager settings
function initGameManager() {
    // Render mode selector if function exists
    if (typeof renderModeSelector === 'function') {
        renderModeSelector();
    }
}

// Call init when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGameManager);
} else {
    initGameManager();
}
