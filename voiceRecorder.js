// Voice Recorder Module
// Uses MediaRecorder API for audio capture

let mediaRecorder = null;
let audioChunks = [];
let recordingStream = null;
let isRecording = false;
let recordingStartTime = null;
let currentRecordingBlob = null;

// Recording state constants
const RecordingState = {
    IDLE: 'idle',
    RECORDING: 'recording',
    PAUSED: 'paused',
    STOPPED: 'stopped'
};

let currentRecordingState = RecordingState.IDLE;

// Initialize voice recording capability
async function initializeRecording() {
    try {
        // Check for browser support
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            throw new Error('Your browser does not support audio recording');
        }

        // Request microphone permission
        recordingStream = await navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true,
                sampleRate: 44100
            }
        });

        // Determine supported MIME type
        const mimeType = getSupportedMimeType();

        // Create MediaRecorder instance
        mediaRecorder = new MediaRecorder(recordingStream, {
            mimeType: mimeType
        });

        // Handle data available event
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                audioChunks.push(event.data);
            }
        };

        // Handle recording stop
        mediaRecorder.onstop = () => {
            currentRecordingBlob = new Blob(audioChunks, { type: mimeType });
            currentRecordingState = RecordingState.STOPPED;
            onRecordingComplete(currentRecordingBlob);
        };

        // Handle errors
        mediaRecorder.onerror = (event) => {
            console.error('MediaRecorder error:', event.error);
            showToastAlert('Recording error occurred', 'alert');
            stopRecording();
        };

        return true;
    } catch (error) {
        console.error('Failed to initialize recording:', error);
        showToastAlert('Microphone access denied or unavailable', 'alert');
        return false;
    }
}

// Get supported MIME type for recording
function getSupportedMimeType() {
    const types = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/ogg;codecs=opus',
        'audio/mp4',
        'audio/mpeg'
    ];

    for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
            return type;
        }
    }

    return 'audio/webm'; // fallback
}

// Start recording
async function startRecording() {
    if (currentRecordingState === RecordingState.RECORDING) {
        console.log('Already recording');
        return false;
    }

    // Initialize if not already done
    if (!mediaRecorder || mediaRecorder.state === 'inactive') {
        const initialized = await initializeRecording();
        if (!initialized) return false;
    }

    // Reset chunks for new recording
    audioChunks = [];
    recordingStartTime = Date.now();

    try {
        mediaRecorder.start(1000); // Collect data every second
        currentRecordingState = RecordingState.RECORDING;
        isRecording = true;

        updateRecordButtonState(true);
        showToastAlert('Recording started', 'success');

        return true;
    } catch (error) {
        console.error('Failed to start recording:', error);
        showToastAlert('Failed to start recording', 'alert');
        return false;
    }
}

// Stop recording
function stopRecording() {
    if (!mediaRecorder || currentRecordingState !== RecordingState.RECORDING) {
        return null;
    }

    try {
        mediaRecorder.stop();
        isRecording = false;

        updateRecordButtonState(false);

        // Stop all tracks to release microphone
        if (recordingStream) {
            recordingStream.getTracks().forEach(track => track.stop());
        }

        return true;
    } catch (error) {
        console.error('Failed to stop recording:', error);
        return false;
    }
}

// Pause recording
function pauseRecording() {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
        mediaRecorder.pause();
        currentRecordingState = RecordingState.PAUSED;
        showToastAlert('Recording paused', 'success');
    }
}

// Resume recording
function resumeRecording() {
    if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        currentRecordingState = RecordingState.RECORDING;
        showToastAlert('Recording resumed', 'success');
    }
}

// Toggle recording state
async function toggleRecording() {
    if (currentRecordingState === RecordingState.RECORDING) {
        stopRecording();
    } else {
        await startRecording();
    }
}

// Update record button visual state
function updateRecordButtonState(isActive) {
    if (btnRecord) {
        if (isActive) {
            btnRecord.classList.add('red');
            btnRecord.classList.add('pulse');
            btnRecord.innerHTML = '<i class="fas fa-stop"></i>';
        } else {
            btnRecord.classList.remove('red');
            btnRecord.classList.remove('pulse');
            btnRecord.innerHTML = '<i class="fas fa-microphone"></i>';
        }
    }
}

// Called when recording is complete
function onRecordingComplete(blob) {
    showToastAlert('Recording complete!', 'success');

    // Calculate recording duration
    const duration = recordingStartTime ? (Date.now() - recordingStartTime) / 1000 : 0;

    // Store the recording data for analysis
    const recordingData = {
        blob: blob,
        duration: duration,
        timestamp: new Date().toISOString(),
        question: currentSessionQuestion || 'Unknown',
        wordOfDay: currentSessionWord || null
    };

    // Trigger analysis if enabled
    if (typeof analyzeRecording === 'function') {
        analyzeRecording(recordingData);
    }
}

// Get the current recording blob
function getCurrentRecording() {
    return currentRecordingBlob;
}

// Get recording duration
function getRecordingDuration() {
    if (!recordingStartTime) return 0;
    return (Date.now() - recordingStartTime) / 1000;
}

// Create audio playback element
function createAudioPlayback(blob) {
    const audioUrl = URL.createObjectURL(blob);
    const audio = new Audio(audioUrl);
    return audio;
}

// Download recording as file
function downloadRecording(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `table-topics-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Check if currently recording
function isCurrentlyRecording() {
    return currentRecordingState === RecordingState.RECORDING;
}

// Clean up resources
function cleanupRecording() {
    if (recordingStream) {
        recordingStream.getTracks().forEach(track => track.stop());
    }
    mediaRecorder = null;
    audioChunks = [];
    currentRecordingBlob = null;
    currentRecordingState = RecordingState.IDLE;
}

// Session tracking variables (will be set by game manager)
let currentSessionQuestion = null;
let currentSessionWord = null;

function setCurrentSessionData(question, word) {
    currentSessionQuestion = question;
    currentSessionWord = word;
}
