// Session History Module
// Tracks and stores practice session data for progress monitoring

const SESSION_STORAGE_KEY = 'tableTopicsSessionHistory';
const MAX_SESSIONS = 100; // Keep last 100 sessions

// Save a session to history
function saveSessionToHistory(analysis) {
    if (!analysis) return;

    const session = {
        id: generateSessionId(),
        timestamp: new Date().toISOString(),
        date: new Date().toLocaleDateString(),
        question: analysis.recordingData?.question || 'Unknown',
        wordOfDay: analysis.recordingData?.wordOfDay || null,
        duration: analysis.duration,
        wordCount: analysis.wordCount,
        wordsPerMinute: analysis.wordsPerMinute,
        overallScore: analysis.overallScore || null,
        scores: analysis.scores || null,
        fillerWords: analysis.fillerWords,
        transcript: analysis.transcript?.text || '',
        paceAssessment: analysis.paceAssessment || null,
        strengths: analysis.strengths || [],
        areasToImprove: analysis.areasToImprove || []
    };

    const history = getSessionHistory();
    history.unshift(session); // Add to beginning

    // Keep only the last MAX_SESSIONS
    if (history.length > MAX_SESSIONS) {
        history.pop();
    }

    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(history));

    return session;
}

// Get all session history
function getSessionHistory() {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

// Get a specific session by ID
function getSessionById(id) {
    const history = getSessionHistory();
    return history.find(s => s.id === id);
}

// Delete a session
function deleteSession(id) {
    let history = getSessionHistory();
    history = history.filter(s => s.id !== id);
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(history));
}

// Clear all history
function clearSessionHistory() {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    showToastAlert('Session history cleared', 'success');
}

// Generate unique session ID
function generateSessionId() {
    return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Calculate progress statistics
function getProgressStats() {
    const history = getSessionHistory();

    if (history.length === 0) {
        return null;
    }

    // Get sessions with scores
    const scoredSessions = history.filter(s => s.overallScore !== null);

    // Calculate averages
    const stats = {
        totalSessions: history.length,
        scoredSessions: scoredSessions.length,
        averageScore: 0,
        averageWPM: 0,
        averageDuration: 0,
        averageFillerWords: 0,
        totalPracticeTime: 0,
        totalWords: 0,
        scoreProgress: [],
        wpmProgress: [],
        fillerProgress: [],
        recentImprovement: null,
        streakDays: 0,
        lastPractice: history[0]?.timestamp || null
    };

    // Calculate totals and averages
    let totalScore = 0;
    let totalWPM = 0;
    let totalDuration = 0;
    let totalFillers = 0;

    history.forEach((session, index) => {
        totalDuration += session.duration || 0;
        totalWPM += session.wordsPerMinute || 0;
        totalFillers += session.fillerWords?.total || 0;
        stats.totalWords += session.wordCount || 0;

        if (session.overallScore) {
            totalScore += session.overallScore;
        }

        // Track progress over time (last 10 sessions)
        if (index < 10) {
            stats.scoreProgress.unshift({
                date: session.date,
                score: session.overallScore
            });
            stats.wpmProgress.unshift({
                date: session.date,
                wpm: session.wordsPerMinute
            });
            stats.fillerProgress.unshift({
                date: session.date,
                fillers: session.fillerWords?.total || 0
            });
        }
    });

    stats.averageScore = scoredSessions.length > 0 ? Math.round(totalScore / scoredSessions.length) : 0;
    stats.averageWPM = history.length > 0 ? Math.round(totalWPM / history.length) : 0;
    stats.averageDuration = history.length > 0 ? Math.round(totalDuration / history.length) : 0;
    stats.averageFillerWords = history.length > 0 ? (totalFillers / history.length).toFixed(1) : 0;
    stats.totalPracticeTime = totalDuration;

    // Calculate recent improvement (compare last 5 to previous 5)
    if (scoredSessions.length >= 10) {
        const recent5 = scoredSessions.slice(0, 5).reduce((sum, s) => sum + s.overallScore, 0) / 5;
        const previous5 = scoredSessions.slice(5, 10).reduce((sum, s) => sum + s.overallScore, 0) / 5;
        stats.recentImprovement = Math.round(recent5 - previous5);
    }

    // Calculate streak
    stats.streakDays = calculateStreak(history);

    return stats;
}

// Calculate practice streak
function calculateStreak(history) {
    if (history.length === 0) return 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let streak = 0;
    let currentDate = new Date(today);

    // Get unique practice dates
    const practiceDates = new Set(history.map(s => new Date(s.timestamp).toDateString()));

    while (true) {
        if (practiceDates.has(currentDate.toDateString())) {
            streak++;
            currentDate.setDate(currentDate.getDate() - 1);
        } else if (streak === 0 && currentDate.getTime() === today.getTime()) {
            // No practice today yet, check yesterday
            currentDate.setDate(currentDate.getDate() - 1);
        } else {
            break;
        }
    }

    return streak;
}

// Format duration for display
function formatDuration(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
        return `${mins}m ${secs}s`;
    }
    return `${secs}s`;
}

// Format total practice time
function formatTotalTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);

    if (hours > 0) {
        return `${hours}h ${mins}m`;
    }
    return `${mins} minutes`;
}

// View session history UI
function viewSessionHistory() {
    const history = getSessionHistory();
    const stats = getProgressStats();

    const historyCard = document.getElementById('history-card') || createHistoryCard();
    historyCard.style.display = 'block';

    let html = `
        <div class="history-container">
            <div class="row">
                <div class="col s12">
                    <h5 class="center-align">Practice History</h5>
                </div>
            </div>
    `;

    // Stats Overview
    if (stats) {
        html += `
            <div class="row stats-overview">
                <div class="col s6 m3 center-align">
                    <div class="stat-card">
                        <div class="stat-value">${stats.totalSessions}</div>
                        <div class="stat-title">Total Sessions</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-card">
                        <div class="stat-value">${stats.averageScore || '--'}</div>
                        <div class="stat-title">Avg Score</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-card">
                        <div class="stat-value">${stats.averageWPM}</div>
                        <div class="stat-title">Avg WPM</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-card">
                        <div class="stat-value">${formatTotalTime(stats.totalPracticeTime)}</div>
                        <div class="stat-title">Total Practice</div>
                    </div>
                </div>
            </div>

            <!-- Progress Indicator -->
            ${stats.recentImprovement !== null ? `
            <div class="row">
                <div class="col s12 center-align">
                    <div class="progress-indicator ${stats.recentImprovement >= 0 ? 'positive' : 'negative'}">
                        <i class="fas fa-${stats.recentImprovement >= 0 ? 'arrow-up' : 'arrow-down'}"></i>
                        <span>${Math.abs(stats.recentImprovement)} points ${stats.recentImprovement >= 0 ? 'improvement' : 'change'}</span>
                        <small>(Last 5 vs Previous 5)</small>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Streak -->
            ${stats.streakDays > 0 ? `
            <div class="row">
                <div class="col s12 center-align">
                    <div class="streak-badge">
                        <i class="fas fa-fire"></i>
                        <span>${stats.streakDays} day streak!</span>
                    </div>
                </div>
            </div>
            ` : ''}
        `;
    }

    // Session List
    if (history.length === 0) {
        html += `
            <div class="row">
                <div class="col s12 center-align">
                    <p class="grey-text">No practice sessions yet. Start practicing to track your progress!</p>
                </div>
            </div>
        `;
    } else {
        html += `
            <div class="row">
                <div class="col s12">
                    <h6>Recent Sessions</h6>
                    <ul class="collection session-list">
        `;

        history.slice(0, 20).forEach(session => {
            html += `
                <li class="collection-item session-item" data-id="${session.id}">
                    <div class="session-header">
                        <span class="session-date">${session.date}</span>
                        ${session.overallScore ? `
                            <span class="session-score badge ${getScoreBadgeClass(session.overallScore)}">${session.overallScore}/100</span>
                        ` : ''}
                    </div>
                    <div class="session-question truncate">${session.question}</div>
                    <div class="session-stats grey-text">
                        <span><i class="fas fa-clock"></i> ${formatDuration(session.duration)}</span>
                        <span><i class="fas fa-tachometer-alt"></i> ${session.wordsPerMinute} WPM</span>
                        <span><i class="fas fa-comment-dots"></i> ${session.fillerWords?.total || 0} fillers</span>
                    </div>
                </li>
            `;
        });

        html += `
                    </ul>
                </div>
            </div>
        `;
    }

    // Action Buttons
    html += `
        <div class="row">
            <div class="col s12 center-align">
                <button class="btn waves-effect waves-light" onclick="closeHistoryCard()">
                    <i class="fas fa-times left"></i> Close
                </button>
                ${history.length > 0 ? `
                    <button class="btn waves-effect waves-light red" onclick="confirmClearHistory()">
                        <i class="fas fa-trash left"></i> Clear History
                    </button>
                ` : ''}
            </div>
        </div>
    </div>
    `;

    historyCard.innerHTML = html;
}

// Create history card element if it doesn't exist
function createHistoryCard() {
    const card = document.createElement('div');
    card.id = 'history-card';
    card.className = 'card history-card';
    document.querySelector('.container').appendChild(card);
    return card;
}

// Close history card
function closeHistoryCard() {
    const historyCard = document.getElementById('history-card');
    if (historyCard) {
        historyCard.style.display = 'none';
    }
}

// Get score badge class
function getScoreBadgeClass(score) {
    if (score >= 80) return 'green white-text';
    if (score >= 60) return 'orange white-text';
    if (score >= 40) return 'yellow black-text';
    return 'red white-text';
}

// Confirm clear history
function confirmClearHistory() {
    if (confirm('Are you sure you want to clear all practice history? This cannot be undone.')) {
        clearSessionHistory();
        viewSessionHistory(); // Refresh the view
    }
}

// Export history as JSON
function exportHistory() {
    const history = getSessionHistory();
    const dataStr = JSON.stringify(history, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `table-topics-history-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToastAlert('History exported!', 'success');
}
