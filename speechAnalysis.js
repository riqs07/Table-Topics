// Speech Analysis Module
// AI-powered transcription and analysis using OpenAI API

// Configuration - API key stored in localStorage
const OPENAI_API_URL = 'https://api.openai.com/v1';
const STORAGE_KEY_API = 'tableTopicsApiKey';

// Common filler words to detect
const FILLER_WORDS = [
    'um', 'uh', 'er', 'ah', 'like', 'you know', 'basically', 'actually',
    'literally', 'right', 'so', 'well', 'i mean', 'kind of', 'sort of',
    'you see', 'okay', 'anyway', 'honestly', 'obviously'
];

// Analysis results structure
let currentAnalysis = null;
let isAnalyzing = false;

// Get or set API key
function getApiKey() {
    return localStorage.getItem(STORAGE_KEY_API);
}

function setApiKey(key) {
    localStorage.setItem(STORAGE_KEY_API, key);
}

function hasApiKey() {
    const key = getApiKey();
    return key && key.length > 0;
}

// Main analysis function
async function analyzeRecording(recordingData) {
    if (isAnalyzing) {
        showToastAlert('Analysis already in progress', 'alert');
        return null;
    }

    if (!hasApiKey()) {
        showApiKeyPrompt();
        return null;
    }

    isAnalyzing = true;
    showAnalysisLoading();

    try {
        // Step 1: Transcribe the audio
        showToastAlert('Transcribing your speech...', 'success');
        const transcript = await transcribeAudio(recordingData.blob);

        if (!transcript) {
            throw new Error('Transcription failed');
        }

        // Step 2: Analyze the transcript
        showToastAlert('Analyzing your speech...', 'success');
        const analysis = await analyzeTranscript(transcript, recordingData);

        // Step 3: Store and display results
        currentAnalysis = {
            ...analysis,
            transcript: transcript,
            recordingData: {
                duration: recordingData.duration,
                timestamp: recordingData.timestamp,
                question: recordingData.question,
                wordOfDay: recordingData.wordOfDay
            }
        };

        // Save to session history
        saveSessionToHistory(currentAnalysis);

        // Display results
        showAnalysisResults(currentAnalysis);

        return currentAnalysis;

    } catch (error) {
        console.error('Analysis error:', error);
        showToastAlert('Analysis failed: ' + error.message, 'alert');
        hideAnalysisLoading();
        return null;
    } finally {
        isAnalyzing = false;
    }
}

// Transcribe audio using OpenAI Whisper API
async function transcribeAudio(audioBlob) {
    const apiKey = getApiKey();

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', audioBlob, 'recording.webm');
    formData.append('model', 'whisper-1');
    formData.append('response_format', 'verbose_json');
    formData.append('timestamp_granularities[]', 'word');

    try {
        const response = await fetch(`${OPENAI_API_URL}/audio/transcriptions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`
            },
            body: formData
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Transcription request failed');
        }

        const result = await response.json();
        return {
            text: result.text,
            words: result.words || [],
            duration: result.duration
        };

    } catch (error) {
        console.error('Transcription error:', error);
        throw error;
    }
}

// Analyze transcript using GPT
async function analyzeTranscript(transcript, recordingData) {
    const apiKey = getApiKey();

    // Calculate basic metrics
    const basicMetrics = calculateBasicMetrics(transcript, recordingData.duration);

    // Build the analysis prompt
    const analysisPrompt = buildAnalysisPrompt(transcript.text, recordingData, basicMetrics);

    try {
        const response = await fetch(`${OPENAI_API_URL}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are an expert public speaking coach and communication skills trainer.
                        Analyze the following impromptu speech transcript and provide constructive, actionable feedback.
                        Be encouraging but honest. Focus on specific improvements the speaker can make.
                        Your response must be valid JSON matching the specified format.`
                    },
                    {
                        role: 'user',
                        content: analysisPrompt
                    }
                ],
                temperature: 0.7,
                response_format: { type: "json_object" }
            })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error?.message || 'Analysis request failed');
        }

        const result = await response.json();
        const aiAnalysis = JSON.parse(result.choices[0].message.content);

        // Combine AI analysis with basic metrics
        return {
            ...basicMetrics,
            ...aiAnalysis
        };

    } catch (error) {
        console.error('Analysis error:', error);
        // Return basic metrics even if AI analysis fails
        return {
            ...basicMetrics,
            aiAnalysisError: true,
            overallFeedback: 'AI analysis unavailable. Review the basic metrics above.',
            suggestions: ['Try again or check your API key settings.']
        };
    }
}

// Calculate basic speech metrics
function calculateBasicMetrics(transcript, duration) {
    const text = transcript.text.toLowerCase();
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const wordCount = words.length;

    // Calculate words per minute
    const durationMinutes = duration / 60;
    const wordsPerMinute = durationMinutes > 0 ? Math.round(wordCount / durationMinutes) : 0;

    // Detect filler words
    const fillerWordCounts = {};
    let totalFillerWords = 0;

    FILLER_WORDS.forEach(filler => {
        const regex = new RegExp(`\\b${filler}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
            fillerWordCounts[filler] = matches.length;
            totalFillerWords += matches.length;
        }
    });

    // Calculate filler word percentage
    const fillerPercentage = wordCount > 0 ? ((totalFillerWords / wordCount) * 100).toFixed(1) : 0;

    // Analyze sentence structure
    const sentences = transcript.text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.length > 0 ? Math.round(wordCount / sentences.length) : 0;

    // Calculate unique words (vocabulary diversity)
    const uniqueWords = new Set(words.map(w => w.replace(/[^a-z]/g, '')));
    const vocabularyDiversity = wordCount > 0 ? ((uniqueWords.size / wordCount) * 100).toFixed(1) : 0;

    // Estimate pauses from word timestamps if available
    let pauseCount = 0;
    let totalPauseDuration = 0;

    if (transcript.words && transcript.words.length > 1) {
        for (let i = 1; i < transcript.words.length; i++) {
            const gap = transcript.words[i].start - transcript.words[i - 1].end;
            if (gap > 1.0) { // Pauses longer than 1 second
                pauseCount++;
                totalPauseDuration += gap;
            }
        }
    }

    return {
        wordCount,
        duration: Math.round(duration),
        wordsPerMinute,
        fillerWords: {
            total: totalFillerWords,
            percentage: parseFloat(fillerPercentage),
            breakdown: fillerWordCounts
        },
        sentenceCount: sentences.length,
        avgSentenceLength,
        vocabularyDiversity: parseFloat(vocabularyDiversity),
        uniqueWordCount: uniqueWords.size,
        pauses: {
            count: pauseCount,
            totalDuration: Math.round(totalPauseDuration)
        }
    };
}

// Build the analysis prompt for GPT
function buildAnalysisPrompt(transcriptText, recordingData, basicMetrics) {
    return `
Analyze this impromptu speech for a Table Topics practice session.

**Topic/Question:** ${recordingData.question}
${recordingData.wordOfDay ? `**Word of the Day to incorporate:** ${recordingData.wordOfDay.word} (${recordingData.wordOfDay.definition})` : ''}

**Speech Transcript:**
"${transcriptText}"

**Basic Metrics (already calculated):**
- Duration: ${basicMetrics.duration} seconds
- Word Count: ${basicMetrics.wordCount}
- Speaking Pace: ${basicMetrics.wordsPerMinute} words per minute
- Filler Words: ${basicMetrics.fillerWords.total} (${basicMetrics.fillerWords.percentage}% of speech)
- Vocabulary Diversity: ${basicMetrics.vocabularyDiversity}%
- Significant Pauses: ${basicMetrics.pauses.count}

Please provide your analysis in the following JSON format:
{
    "overallScore": <number 1-100>,
    "scores": {
        "clarity": <number 1-10>,
        "structure": <number 1-10>,
        "engagement": <number 1-10>,
        "relevance": <number 1-10>,
        "confidence": <number 1-10>,
        "vocabulary": <number 1-10>
    },
    "paceAssessment": "<'too slow', 'good', or 'too fast'>",
    "paceNote": "<brief explanation of pace>",
    "structureAnalysis": {
        "hasIntroduction": <boolean>,
        "hasBody": <boolean>,
        "hasConclusion": <boolean>,
        "note": "<brief analysis of speech structure>"
    },
    "topicRelevance": "<how well they addressed the topic>",
    "wordOfDayUsed": <boolean or null if no word of day>,
    "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
    "areasToImprove": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
    "specificSuggestions": ["<actionable suggestion 1>", "<actionable suggestion 2>", "<actionable suggestion 3>"],
    "overallFeedback": "<2-3 sentence encouraging summary of their performance>"
}
`;
}

// Show API key prompt modal
function showApiKeyPrompt() {
    const existingModal = document.getElementById('api-key-modal');
    if (existingModal) {
        const instance = M.Modal.getInstance(existingModal);
        instance.open();
        return;
    }

    // Create modal HTML
    const modalHtml = `
    <div id="api-key-modal" class="modal">
        <div class="modal-content">
            <h4>OpenAI API Key Required</h4>
            <p>To analyze your speech, please enter your OpenAI API key.
               This is stored locally in your browser and never sent anywhere except OpenAI.</p>
            <div class="input-field">
                <input type="password" id="api-key-input" />
                <label for="api-key-input">OpenAI API Key</label>
            </div>
            <p class="grey-text">
                <small>Get your API key from <a href="https://platform.openai.com/api-keys" target="_blank">OpenAI Platform</a></small>
            </p>
        </div>
        <div class="modal-footer">
            <a href="#!" class="modal-close waves-effect waves-red btn-flat">Cancel</a>
            <a href="#!" class="waves-effect waves-green btn" onclick="saveApiKeyFromModal()">Save</a>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    const modal = document.getElementById('api-key-modal');
    M.Modal.init(modal);
    M.Modal.getInstance(modal).open();
}

// Save API key from modal
function saveApiKeyFromModal() {
    const input = document.getElementById('api-key-input');
    const key = input.value.trim();

    if (key && key.startsWith('sk-')) {
        setApiKey(key);
        showToastAlert('API key saved!', 'success');

        const modal = document.getElementById('api-key-modal');
        M.Modal.getInstance(modal).close();

        // Retry analysis if there's a pending recording
        if (currentRecordingBlob) {
            showToastAlert('Retrying analysis...', 'success');
        }
    } else {
        showToastAlert('Please enter a valid OpenAI API key', 'alert');
    }
}

// Show loading state during analysis
function showAnalysisLoading() {
    const resultsCard = document.getElementById('analysis-results-card');
    if (resultsCard) {
        resultsCard.style.display = 'block';
        resultsCard.innerHTML = `
            <div class="center-align" style="padding: 40px;">
                <div class="preloader-wrapper active">
                    <div class="spinner-layer spinner-blue-only">
                        <div class="circle-clipper left"><div class="circle"></div></div>
                        <div class="gap-patch"><div class="circle"></div></div>
                        <div class="circle-clipper right"><div class="circle"></div></div>
                    </div>
                </div>
                <p class="grey-text">Analyzing your speech...</p>
            </div>
        `;
    }
}

// Hide loading state
function hideAnalysisLoading() {
    const resultsCard = document.getElementById('analysis-results-card');
    if (resultsCard) {
        resultsCard.style.display = 'none';
    }
}

// Display analysis results
function showAnalysisResults(analysis) {
    const resultsCard = document.getElementById('analysis-results-card');
    if (!resultsCard) return;

    resultsCard.style.display = 'block';

    // Build the results HTML
    const html = `
        <div class="analysis-results">
            <div class="row">
                <div class="col s12">
                    <h5 class="center-align">Speech Analysis Results</h5>
                </div>
            </div>

            <!-- Overall Score -->
            <div class="row">
                <div class="col s12 center-align">
                    <div class="overall-score ${getScoreClass(analysis.overallScore)}">
                        <span class="score-number">${analysis.overallScore || '--'}</span>
                        <span class="score-label">/ 100</span>
                    </div>
                </div>
            </div>

            <!-- Quick Stats -->
            <div class="row">
                <div class="col s6 m3 center-align">
                    <div class="stat-box">
                        <div class="stat-number">${analysis.duration}s</div>
                        <div class="stat-label">Duration</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-box">
                        <div class="stat-number">${analysis.wordsPerMinute}</div>
                        <div class="stat-label">Words/Min</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-box">
                        <div class="stat-number">${analysis.wordCount}</div>
                        <div class="stat-label">Total Words</div>
                    </div>
                </div>
                <div class="col s6 m3 center-align">
                    <div class="stat-box ${analysis.fillerWords.percentage > 5 ? 'warning' : ''}">
                        <div class="stat-number">${analysis.fillerWords.total}</div>
                        <div class="stat-label">Filler Words</div>
                    </div>
                </div>
            </div>

            <!-- Detailed Scores -->
            ${analysis.scores ? `
            <div class="row">
                <div class="col s12">
                    <h6>Performance Breakdown</h6>
                    <div class="scores-grid">
                        ${renderScoreBar('Clarity', analysis.scores.clarity)}
                        ${renderScoreBar('Structure', analysis.scores.structure)}
                        ${renderScoreBar('Engagement', analysis.scores.engagement)}
                        ${renderScoreBar('Relevance', analysis.scores.relevance)}
                        ${renderScoreBar('Confidence', analysis.scores.confidence)}
                        ${renderScoreBar('Vocabulary', analysis.scores.vocabulary)}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Pace Assessment -->
            ${analysis.paceAssessment ? `
            <div class="row">
                <div class="col s12">
                    <div class="pace-badge ${analysis.paceAssessment === 'good' ? 'green' : 'orange'} lighten-4">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>Pace: ${analysis.paceAssessment.charAt(0).toUpperCase() + analysis.paceAssessment.slice(1)}</span>
                    </div>
                    <p class="grey-text">${analysis.paceNote || ''}</p>
                </div>
            </div>
            ` : ''}

            <!-- Filler Words Breakdown -->
            ${analysis.fillerWords.total > 0 ? `
            <div class="row">
                <div class="col s12">
                    <h6>Filler Words Detected</h6>
                    <div class="filler-words">
                        ${Object.entries(analysis.fillerWords.breakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([word, count]) => `
                                <span class="chip">"${word}" x${count}</span>
                            `).join('')}
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Strengths -->
            ${analysis.strengths && analysis.strengths.length > 0 ? `
            <div class="row">
                <div class="col s12">
                    <h6><i class="fas fa-star green-text"></i> Strengths</h6>
                    <ul class="browser-default">
                        ${analysis.strengths.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}

            <!-- Areas to Improve -->
            ${analysis.areasToImprove && analysis.areasToImprove.length > 0 ? `
            <div class="row">
                <div class="col s12">
                    <h6><i class="fas fa-chart-line orange-text"></i> Areas to Improve</h6>
                    <ul class="browser-default">
                        ${analysis.areasToImprove.map(a => `<li>${a}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}

            <!-- Specific Suggestions -->
            ${analysis.specificSuggestions && analysis.specificSuggestions.length > 0 ? `
            <div class="row">
                <div class="col s12">
                    <h6><i class="fas fa-lightbulb blue-text"></i> Actionable Tips</h6>
                    <ul class="browser-default">
                        ${analysis.specificSuggestions.map(s => `<li>${s}</li>`).join('')}
                    </ul>
                </div>
            </div>
            ` : ''}

            <!-- Overall Feedback -->
            ${analysis.overallFeedback ? `
            <div class="row">
                <div class="col s12">
                    <div class="card-panel teal lighten-5">
                        <p style="margin: 0;"><strong>Summary:</strong> ${analysis.overallFeedback}</p>
                    </div>
                </div>
            </div>
            ` : ''}

            <!-- Transcript -->
            <div class="row">
                <div class="col s12">
                    <ul class="collapsible">
                        <li>
                            <div class="collapsible-header">
                                <i class="fas fa-file-alt"></i>
                                View Full Transcript
                            </div>
                            <div class="collapsible-body">
                                <p style="white-space: pre-wrap; font-style: italic;">"${analysis.transcript.text}"</p>
                            </div>
                        </li>
                    </ul>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="row">
                <div class="col s12 center-align">
                    <button class="btn waves-effect waves-light" onclick="closeAnalysisResults()">
                        <i class="fas fa-times left"></i> Close
                    </button>
                    <button class="btn waves-effect waves-light blue" onclick="viewSessionHistory()">
                        <i class="fas fa-history left"></i> View History
                    </button>
                </div>
            </div>
        </div>
    `;

    resultsCard.innerHTML = html;

    // Initialize Materialize components
    const collapsibles = resultsCard.querySelectorAll('.collapsible');
    M.Collapsible.init(collapsibles);
}

// Helper function to render score bars
function renderScoreBar(label, score) {
    const percentage = (score / 10) * 100;
    const colorClass = score >= 7 ? 'green' : score >= 5 ? 'orange' : 'red';

    return `
        <div class="score-item">
            <div class="score-label-row">
                <span>${label}</span>
                <span>${score}/10</span>
            </div>
            <div class="progress">
                <div class="determinate ${colorClass}" style="width: ${percentage}%"></div>
            </div>
        </div>
    `;
}

// Helper function to get score class
function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs-work';
}

// Close analysis results
function closeAnalysisResults() {
    const resultsCard = document.getElementById('analysis-results-card');
    if (resultsCard) {
        resultsCard.style.display = 'none';
    }
}

// Get current analysis
function getCurrentAnalysis() {
    return currentAnalysis;
}
