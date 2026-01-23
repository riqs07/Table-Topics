// Practice Modes Module
// Different practice formats for various skill levels and goals

const PracticeModes = {
    QUICK_FIRE: {
        id: 'quick-fire',
        name: 'Quick Fire',
        description: 'Rapid 30-second responses to build quick thinking',
        duration: 30,
        qualifyTime: 20,
        warningTime: 25,
        icon: 'zap',
        color: 'orange'
    },
    STANDARD: {
        id: 'standard',
        name: 'Standard',
        description: 'Classic Table Topics format (60-120 seconds)',
        duration: 120,
        qualifyTime: 60,
        warningTime: 90,
        icon: 'target',
        color: 'primary'
    },
    EXTENDED: {
        id: 'extended',
        name: 'Extended',
        description: 'Longer form practice for developed arguments (3-5 min)',
        duration: 300,
        qualifyTime: 180,
        warningTime: 270,
        icon: 'clock',
        color: 'blue'
    },
    ELEVATOR_PITCH: {
        id: 'elevator-pitch',
        name: 'Elevator Pitch',
        description: 'Concise, persuasive 60-second pitch',
        duration: 60,
        qualifyTime: 45,
        warningTime: 50,
        icon: 'trending-up',
        color: 'green'
    },
    INTERVIEW: {
        id: 'interview',
        name: 'Interview Prep',
        description: 'Practice answering interview questions (2 min)',
        duration: 120,
        qualifyTime: 60,
        warningTime: 100,
        icon: 'briefcase',
        color: 'purple'
    }
};

// Current selected mode
let currentMode = PracticeModes.STANDARD;

// Get all modes as array
function getAllModes() {
    return Object.values(PracticeModes);
}

// Set current mode
function setCurrentMode(modeId) {
    const mode = Object.values(PracticeModes).find(m => m.id === modeId);
    if (mode) {
        currentMode = mode;
        updateModeDisplay();
        return true;
    }
    return false;
}

// Get current mode
function getCurrentMode() {
    return currentMode;
}

// Update UI to show current mode
function updateModeDisplay() {
    const modeIndicator = document.getElementById('current-mode-indicator');
    if (modeIndicator) {
        modeIndicator.innerHTML = `
            <span class="mode-badge mode-${currentMode.color}">
                <i data-lucide="${currentMode.icon}"></i>
                ${currentMode.name}
            </span>
        `;
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Get questions filtered by mode (some modes have specific question types)
function getQuestionsForMode(mode) {
    switch (mode.id) {
        case 'interview':
            // Filter for professional questions
            return questions.filter(q =>
                q.category === 'professional' ||
                q.category === 'reflection'
            );
        case 'elevator-pitch':
            // Filter for persuasive/creative questions
            return questions.filter(q =>
                q.category === 'persuasive' ||
                q.category === 'creative' ||
                q.category === 'professional'
            );
        default:
            return questions;
    }
}

// Render mode selector UI
function renderModeSelector() {
    const container = document.getElementById('mode-selector');
    if (!container) return;

    const modes = getAllModes();

    container.innerHTML = `
        <div class="mode-selector-title">Practice Mode</div>
        <div class="mode-buttons">
            ${modes.map(mode => `
                <button class="mode-btn ${mode.color} ${currentMode.id === mode.id ? 'active' : ''}"
                        onclick="selectMode('${mode.id}')">
                    <i data-lucide="${mode.icon}"></i>
                    <span class="mode-name">${mode.name}</span>
                    <span class="mode-duration">${formatModeDuration(mode.duration)}</span>
                </button>
            `).join('')}
        </div>
    `;

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Format duration for display
function formatModeDuration(seconds) {
    if (seconds < 60) {
        return `${seconds}s`;
    } else if (seconds < 120) {
        return `${Math.floor(seconds / 60)} min`;
    } else {
        return `${Math.floor(seconds / 60)}-${Math.ceil(seconds / 60)} min`;
    }
}

// Select mode from UI
function selectMode(modeId) {
    setCurrentMode(modeId);

    // Update UI
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    document.querySelector(`.mode-btn[onclick="selectMode('${modeId}')"]`)?.classList.add('active');

    showToastAlert(`Mode set to ${currentMode.name}`, 'success');
}

// Show mode selector modal/panel
function showModeSelector() {
    const displayCard = document.getElementById('display-card');
    if (displayCard) {
        displayCard.style.display = 'block';
        document.getElementById('edit-question-list').innerHTML = renderModeSelector();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}
