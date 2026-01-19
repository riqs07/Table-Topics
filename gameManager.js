// Table Topics - Game Manager
// Handles game flow, timer, and session management

// Current session tracking
let currentQuestion = null;
let currentWord = null;
let gameInProgress = false;
let autoRecordEnabled = true; // Automatically start recording when game starts

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

    switch (true) {
        case (time === 60):
            greenLight();
            break;

        case (time === 75):
            yellowLight();
            break;

        case (time === 90):
            redLight();
            break;

        case (time === 120):
            gameOver();
            break;
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

    // Start the countdown
    startCountdownTimer();

    timer.innerHTML = "Get Ready!";
    timer.style.display = "block";
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
    showToastAlert('30 seconds Remaining; Wrap it Up!', 'alert');
}

function gameOver() {
    changeCardColor(Palette.grey);
    clearInterval(counter);
    showToastAlert('Game Over', 'finish');
    showGameButtons('hide');
    gameInProgress = false;

    // Stop recording and trigger analysis
    if (typeof isCurrentlyRecording === 'function' && isCurrentlyRecording()) {
        stopRecording();
        showRecordingIndicator(false);
    }

    // Show qualification status
    if (time < 60 || time > 120) {
        showToastAlert(`Sorry, you have not qualified. Your time was ${time} seconds`, 'alert');
    } else if (time >= 60 && time <= 120) {
        showToastAlert(`Great job, you qualified! Your time was ${time} seconds`, 'success');
    }

    resetTimers();

    setTimeout(() => {
        changeCardColor('#fff');
        changeDisplayState("Game over, Play Again?");
        timer.style.display = "none";
        wordOTD.innerHTML = '';
        enableMenuButtons('enabled');

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
