// Real-time Speech Coach Module
// Provides live feedback during speech including pace, filler words, and transcript

// ==================== Configuration ====================

const FILLER_WORDS_REALTIME = [
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically',
    'actually', 'literally', 'right', 'so', 'well', 'i mean',
    'kind of', 'sort of', 'okay', 'anyway'
];

const IDEAL_WPM_MIN = 120;
const IDEAL_WPM_MAX = 150;
const WPM_UPDATE_INTERVAL = 2000; // Update WPM every 2 seconds

// ==================== State ====================

let recognition = null;
let isListening = false;
let liveTranscript = '';
let wordTimestamps = [];
let fillerWordCount = 0;
let fillerWordBreakdown = {};
let speechStartTime = null;
let lastWpmUpdate = null;
let currentWpm = 0;
let wpmHistory = [];
let volumeAnalyzer = null;
let volumeHistory = [];
let silenceStart = null;
let totalSilenceTime = 0;
let pauseCount = 0;

// ==================== Web Speech API Setup ====================

function initializeSpeechRecognition() {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
        console.warn('Web Speech API not supported in this browser');
        return false;
    }

    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = handleSpeechResult;
    recognition.onerror = handleSpeechError;
    recognition.onend = handleSpeechEnd;

    return true;
}

// Handle speech recognition results
function handleSpeechResult(event) {
    let interimTranscript = '';
    let finalTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;

        if (event.results[i].isFinal) {
            finalTranscript += transcript;
            // Record timestamp for this segment
            wordTimestamps.push({
                text: transcript,
                timestamp: Date.now() - speechStartTime,
                isFinal: true
            });
        } else {
            interimTranscript += transcript;
        }
    }

    // Update live transcript
    if (finalTranscript) {
        liveTranscript += finalTranscript + ' ';
        detectFillerWords(finalTranscript);
        updateWpm();
    }

    // Update UI
    updateLiveTranscriptDisplay(liveTranscript, interimTranscript);
    updateFillerWordDisplay();
    updatePaceIndicator();
}

// Handle speech recognition errors
function handleSpeechError(event) {
    console.error('Speech recognition error:', event.error);

    if (event.error === 'not-allowed') {
        showToastAlert('Microphone access denied', 'alert');
    } else if (event.error === 'no-speech') {
        // Restart recognition if no speech detected
        if (isListening) {
            recognition.start();
        }
    }
}

// Handle speech recognition end
function handleSpeechEnd() {
    // Restart if still supposed to be listening
    if (isListening) {
        try {
            recognition.start();
        } catch (e) {
            console.log('Recognition restart failed:', e);
        }
    }
}

// ==================== Filler Word Detection ====================

function detectFillerWords(text) {
    const lowerText = text.toLowerCase();

    FILLER_WORDS_REALTIME.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = lowerText.match(regex);
        if (matches) {
            fillerWordCount += matches.length;
            fillerWordBreakdown[filler] = (fillerWordBreakdown[filler] || 0) + matches.length;
        }
    });
}

// ==================== WPM Calculation ====================

function updateWpm() {
    if (!speechStartTime) return;

    const elapsedMinutes = (Date.now() - speechStartTime) / 60000;
    const wordCount = liveTranscript.split(/\s+/).filter(w => w.length > 0).length;

    if (elapsedMinutes > 0.1) { // At least 6 seconds of speech
        currentWpm = Math.round(wordCount / elapsedMinutes);

        // Record WPM history for graph
        wpmHistory.push({
            time: Date.now() - speechStartTime,
            wpm: currentWpm
        });
    }
}

// Get pace status
function getPaceStatus() {
    if (currentWpm === 0) return { status: 'waiting', label: 'Waiting...', color: 'grey' };
    if (currentWpm < IDEAL_WPM_MIN - 20) return { status: 'too-slow', label: 'Too Slow', color: 'blue' };
    if (currentWpm < IDEAL_WPM_MIN) return { status: 'slow', label: 'A Bit Slow', color: 'cyan' };
    if (currentWpm <= IDEAL_WPM_MAX) return { status: 'good', label: 'Good Pace', color: 'green' };
    if (currentWpm <= IDEAL_WPM_MAX + 20) return { status: 'fast', label: 'A Bit Fast', color: 'orange' };
    return { status: 'too-fast', label: 'Too Fast!', color: 'red' };
}

// ==================== Volume Analysis ====================

function initializeVolumeAnalyzer(stream) {
    try {
        const audioContext = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = audioContext.createAnalyser();
        const source = audioContext.createMediaStreamSource(stream);

        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.8;

        source.connect(analyser);

        volumeAnalyzer = {
            analyser: analyser,
            dataArray: new Uint8Array(analyser.frequencyBinCount),
            audioContext: audioContext
        };

        // Start volume monitoring
        monitorVolume();
    } catch (e) {
        console.error('Volume analyzer init failed:', e);
    }
}

function monitorVolume() {
    if (!volumeAnalyzer || !isListening) return;

    volumeAnalyzer.analyser.getByteFrequencyData(volumeAnalyzer.dataArray);

    // Calculate average volume
    const average = volumeAnalyzer.dataArray.reduce((a, b) => a + b, 0) / volumeAnalyzer.dataArray.length;
    const normalizedVolume = Math.min(100, (average / 128) * 100);

    // Record volume history
    volumeHistory.push({
        time: Date.now() - (speechStartTime || Date.now()),
        volume: normalizedVolume
    });

    // Detect silence (for pause detection)
    if (normalizedVolume < 5) {
        if (!silenceStart) {
            silenceStart = Date.now();
        } else if (Date.now() - silenceStart > 1500) {
            // Pause detected (1.5+ seconds of silence)
            if (!silenceStart.counted) {
                pauseCount++;
                silenceStart.counted = true;
            }
        }
    } else {
        if (silenceStart && Date.now() - silenceStart > 500) {
            totalSilenceTime += Date.now() - silenceStart;
        }
        silenceStart = null;
    }

    // Update volume indicator
    updateVolumeIndicator(normalizedVolume);

    // Continue monitoring
    if (isListening) {
        requestAnimationFrame(monitorVolume);
    }
}

// ==================== UI Updates ====================

function updateLiveTranscriptDisplay(finalText, interimText) {
    const container = document.getElementById('live-transcript');
    if (!container) return;

    container.innerHTML = `
        <span class="final-transcript">${finalText}</span>
        <span class="interim-transcript">${interimText}</span>
    `;

    // Auto-scroll to bottom
    container.scrollTop = container.scrollHeight;
}

function updateFillerWordDisplay() {
    const counter = document.getElementById('filler-counter');
    if (!counter) return;

    const statusClass = fillerWordCount === 0 ? 'good' :
        fillerWordCount <= 3 ? 'warning' : 'danger';

    counter.innerHTML = `
        <div class="filler-count ${statusClass}">
            <span class="count-number">${fillerWordCount}</span>
            <span class="count-label">Filler Words</span>
        </div>
    `;
}

function updatePaceIndicator() {
    const indicator = document.getElementById('pace-indicator');
    if (!indicator) return;

    const pace = getPaceStatus();

    indicator.innerHTML = `
        <div class="pace-display pace-${pace.color}">
            <div class="pace-speedometer">
                <svg viewBox="0 0 100 60" class="speedometer-svg">
                    <!-- Background arc -->
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="#e0e0e0" stroke-width="8" stroke-linecap="round"/>
                    <!-- Value arc -->
                    <path d="M 10 55 A 40 40 0 0 1 90 55" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"
                          stroke-dasharray="${calculateArcLength(currentWpm)} 126" class="pace-arc"/>
                    <!-- Needle -->
                    <line x1="50" y1="55" x2="${50 + 30 * Math.cos(calculateNeedleAngle(currentWpm))}"
                          y2="${55 - 30 * Math.sin(calculateNeedleAngle(currentWpm))}"
                          stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                    <circle cx="50" cy="55" r="4" fill="currentColor"/>
                </svg>
            </div>
            <div class="pace-info">
                <span class="pace-wpm">${currentWpm} WPM</span>
                <span class="pace-label">${pace.label}</span>
            </div>
        </div>
    `;
}

function updateVolumeIndicator(volume) {
    const indicator = document.getElementById('volume-indicator');
    if (!indicator) return;

    const bars = 10;
    const activeBars = Math.round((volume / 100) * bars);

    let barsHtml = '';
    for (let i = 0; i < bars; i++) {
        const isActive = i < activeBars;
        const barClass = i < bars * 0.3 ? 'low' : i < bars * 0.7 ? 'mid' : 'high';
        barsHtml += `<div class="volume-bar ${barClass} ${isActive ? 'active' : ''}"></div>`;
    }

    indicator.innerHTML = `<div class="volume-bars">${barsHtml}</div>`;
}

// Helper functions for speedometer
function calculateArcLength(wpm) {
    // Map WPM (80-200) to arc length (0-126)
    const normalized = Math.max(0, Math.min(1, (wpm - 80) / 120));
    return normalized * 126;
}

function calculateNeedleAngle(wpm) {
    // Map WPM to angle (π to 0, left to right)
    const normalized = Math.max(0, Math.min(1, (wpm - 80) / 120));
    return Math.PI - (normalized * Math.PI);
}

// ==================== Start/Stop Functions ====================

async function startRealtimeCoach() {
    // Reset state
    liveTranscript = '';
    wordTimestamps = [];
    fillerWordCount = 0;
    fillerWordBreakdown = {};
    speechStartTime = Date.now();
    currentWpm = 0;
    wpmHistory = [];
    volumeHistory = [];
    totalSilenceTime = 0;
    pauseCount = 0;
    silenceStart = null;

    // Initialize speech recognition
    if (!recognition) {
        if (!initializeSpeechRecognition()) {
            showToastAlert('Speech recognition not supported', 'alert');
            return false;
        }
    }

    // Get microphone stream for volume analysis
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        initializeVolumeAnalyzer(stream);
    } catch (e) {
        console.error('Could not get microphone for volume analysis:', e);
    }

    // Start recognition
    try {
        recognition.start();
        isListening = true;
        showCoachOverlay();
        return true;
    } catch (e) {
        console.error('Failed to start speech recognition:', e);
        return false;
    }
}

function stopRealtimeCoach() {
    isListening = false;

    if (recognition) {
        recognition.stop();
    }

    if (volumeAnalyzer && volumeAnalyzer.audioContext) {
        volumeAnalyzer.audioContext.close();
        volumeAnalyzer = null;
    }

    hideCoachOverlay();

    // Return collected data for analysis
    return {
        transcript: liveTranscript,
        fillerWordCount: fillerWordCount,
        fillerWordBreakdown: fillerWordBreakdown,
        wpmHistory: wpmHistory,
        volumeHistory: volumeHistory,
        averageWpm: currentWpm,
        totalPauses: pauseCount,
        totalSilenceTime: totalSilenceTime,
        wordTimestamps: wordTimestamps
    };
}

// ==================== Coach Overlay UI ====================

function showCoachOverlay() {
    // Create overlay if it doesn't exist
    let overlay = document.getElementById('coach-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'coach-overlay';
        overlay.className = 'coach-overlay';
        document.body.appendChild(overlay);
    }

    overlay.innerHTML = `
        <div class="coach-metrics">
            <div id="pace-indicator" class="coach-metric"></div>
            <div id="filler-counter" class="coach-metric"></div>
            <div id="volume-indicator" class="coach-metric"></div>
        </div>
        <div id="live-transcript" class="live-transcript-box">
            <span class="transcript-placeholder">Start speaking...</span>
        </div>
    `;

    overlay.style.display = 'block';

    // Initial updates
    updateFillerWordDisplay();
    updatePaceIndicator();
}

function hideCoachOverlay() {
    const overlay = document.getElementById('coach-overlay');
    if (overlay) {
        overlay.style.display = 'none';
    }
}

// ==================== Get Analysis Data ====================

function getRealtimeCoachData() {
    return {
        transcript: liveTranscript,
        fillerWordCount: fillerWordCount,
        fillerWordBreakdown: fillerWordBreakdown,
        wpmHistory: wpmHistory,
        volumeHistory: volumeHistory,
        averageWpm: currentWpm,
        totalPauses: pauseCount,
        totalSilenceTime: totalSilenceTime,
        paceVariation: calculatePaceVariation(),
        volumeVariation: calculateVolumeVariation()
    };
}

function calculatePaceVariation() {
    if (wpmHistory.length < 2) return 0;
    const wpms = wpmHistory.map(w => w.wpm);
    const avg = wpms.reduce((a, b) => a + b, 0) / wpms.length;
    const variance = wpms.reduce((sum, wpm) => sum + Math.pow(wpm - avg, 2), 0) / wpms.length;
    return Math.sqrt(variance);
}

function calculateVolumeVariation() {
    if (volumeHistory.length < 2) return 0;
    const volumes = volumeHistory.map(v => v.volume);
    const avg = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const variance = volumes.reduce((sum, vol) => sum + Math.pow(vol - avg, 2), 0) / volumes.length;
    return Math.sqrt(variance);
}
