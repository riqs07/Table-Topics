// Enhanced Audio Analysis Module
// Provides in-depth analysis of speech audio beyond transcription

// ==================== Audio Analysis Functions ====================

// Analyze real-time coach data for detailed metrics
function analyzeAudioDetailed(realtimeData) {
    if (!realtimeData) return null;

    const analysis = {
        // From real-time data
        paceAnalysis: analyzePace(realtimeData),
        volumeAnalysis: analyzeVolume(realtimeData),
        pauseAnalysis: analyzePauses(realtimeData),
        fillerAnalysis: analyzeFillers(realtimeData),

        // Calculated insights
        deliveryScore: 0,
        insights: [],
        recommendations: []
    };

    // Calculate overall delivery score
    analysis.deliveryScore = calculateDeliveryScore(analysis);

    // Generate insights
    analysis.insights = generateInsights(analysis);

    // Generate recommendations
    analysis.recommendations = generateRecommendations(analysis);

    return analysis;
}

// ==================== Pace Analysis ====================

function analyzePace(data) {
    const wpmHistory = data.wpmHistory || [];
    const avgWpm = data.averageWpm || 0;

    // Calculate pace variation
    let paceVariation = 0;
    if (wpmHistory.length > 1) {
        const wpms = wpmHistory.map(w => w.wpm);
        const mean = wpms.reduce((a, b) => a + b, 0) / wpms.length;
        paceVariation = Math.sqrt(wpms.reduce((sum, w) => sum + Math.pow(w - mean, 2), 0) / wpms.length);
    }

    // Determine pace segments
    const segments = [];
    const segmentSize = Math.max(1, Math.floor(wpmHistory.length / 5));

    for (let i = 0; i < wpmHistory.length; i += segmentSize) {
        const segment = wpmHistory.slice(i, i + segmentSize);
        const segmentAvg = segment.reduce((a, b) => a + b.wpm, 0) / segment.length;
        segments.push({
            start: i,
            end: Math.min(i + segmentSize, wpmHistory.length),
            averageWpm: Math.round(segmentAvg),
            status: getPaceLabel(segmentAvg)
        });
    }

    // Identify pace issues
    const issues = [];
    if (avgWpm < 100) issues.push('Overall pace is too slow');
    if (avgWpm > 170) issues.push('Overall pace is too fast');
    if (paceVariation < 10 && avgWpm > 0) issues.push('Pace is monotonous - vary your speed for emphasis');
    if (paceVariation > 40) issues.push('Pace is inconsistent - try to maintain steadier rhythm');

    // Check for rushing at end
    if (segments.length >= 2) {
        const lastSegment = segments[segments.length - 1];
        const firstSegment = segments[0];
        if (lastSegment.averageWpm > firstSegment.averageWpm + 30) {
            issues.push('You rushed toward the end - practice pacing your conclusion');
        }
    }

    return {
        averageWpm: avgWpm,
        variation: Math.round(paceVariation),
        segments: segments,
        issues: issues,
        score: calculatePaceScore(avgWpm, paceVariation),
        history: wpmHistory
    };
}

function getPaceLabel(wpm) {
    if (wpm < 100) return 'slow';
    if (wpm < 120) return 'moderate';
    if (wpm <= 150) return 'good';
    if (wpm <= 170) return 'fast';
    return 'very-fast';
}

function calculatePaceScore(avgWpm, variation) {
    let score = 100;

    // Penalize for being outside ideal range (120-150)
    if (avgWpm < 120) score -= Math.min(30, (120 - avgWpm) * 1.5);
    if (avgWpm > 150) score -= Math.min(30, (avgWpm - 150) * 1.5);

    // Reward moderate variation (10-25 is ideal)
    if (variation < 10) score -= 10; // Too monotonous
    if (variation > 35) score -= (variation - 35) * 0.5; // Too erratic

    return Math.max(0, Math.min(100, Math.round(score)));
}

// ==================== Volume Analysis ====================

function analyzeVolume(data) {
    const volumeHistory = data.volumeHistory || [];

    if (volumeHistory.length === 0) {
        return {
            averageVolume: 0,
            variation: 0,
            issues: ['No volume data available'],
            score: 50
        };
    }

    const volumes = volumeHistory.map(v => v.volume);
    const avgVolume = volumes.reduce((a, b) => a + b, 0) / volumes.length;
    const maxVolume = Math.max(...volumes);
    const minVolume = Math.min(...volumes.filter(v => v > 5)); // Ignore silence

    // Calculate variation
    const variation = Math.sqrt(
        volumes.reduce((sum, v) => sum + Math.pow(v - avgVolume, 2), 0) / volumes.length
    );

    // Identify issues
    const issues = [];
    if (avgVolume < 20) issues.push('Speaking too quietly - project your voice');
    if (avgVolume > 80) issues.push('Speaking too loudly - moderate your volume');
    if (variation < 5) issues.push('Volume is monotonous - use dynamic range for emphasis');
    if (maxVolume - minVolume < 15) issues.push('Lack of vocal dynamics - vary volume for engagement');

    // Detect volume drops
    const recentAvg = volumes.slice(-10).reduce((a, b) => a + b, 0) / 10;
    const earlyAvg = volumes.slice(0, 10).reduce((a, b) => a + b, 0) / 10;
    if (recentAvg < earlyAvg - 15) {
        issues.push('Volume dropped toward the end - maintain energy throughout');
    }

    return {
        averageVolume: Math.round(avgVolume),
        maxVolume: Math.round(maxVolume),
        minVolume: Math.round(minVolume),
        variation: Math.round(variation),
        dynamicRange: Math.round(maxVolume - minVolume),
        issues: issues,
        score: calculateVolumeScore(avgVolume, variation),
        history: volumeHistory
    };
}

function calculateVolumeScore(avgVolume, variation) {
    let score = 100;

    // Ideal average volume: 30-60
    if (avgVolume < 30) score -= (30 - avgVolume);
    if (avgVolume > 60) score -= (avgVolume - 60) * 0.5;

    // Ideal variation: 10-25
    if (variation < 10) score -= 15; // Too flat
    if (variation > 30) score -= (variation - 30) * 0.5; // Too erratic

    return Math.max(0, Math.min(100, Math.round(score)));
}

// ==================== Pause Analysis ====================

function analyzePauses(data) {
    const totalPauses = data.totalPauses || 0;
    const totalSilenceTime = data.totalSilenceTime || 0;
    const speechDuration = data.wpmHistory?.length > 0 ?
        data.wpmHistory[data.wpmHistory.length - 1].time : 0;

    const silencePercentage = speechDuration > 0 ?
        (totalSilenceTime / speechDuration) * 100 : 0;

    const issues = [];
    if (silencePercentage > 20) {
        issues.push('Too much silence - reduce dead air');
    }
    if (silencePercentage < 5 && speechDuration > 30000) {
        issues.push('No pauses detected - use strategic pauses for emphasis');
    }
    if (totalPauses > 10) {
        issues.push('Many pauses detected - practice for smoother delivery');
    }

    return {
        totalPauses: totalPauses,
        totalSilenceTime: Math.round(totalSilenceTime / 1000), // Convert to seconds
        silencePercentage: Math.round(silencePercentage),
        issues: issues,
        score: calculatePauseScore(silencePercentage, totalPauses)
    };
}

function calculatePauseScore(silencePercentage, pauseCount) {
    let score = 100;

    // Ideal silence: 5-15%
    if (silencePercentage < 3) score -= 10; // No pauses
    if (silencePercentage > 15) score -= (silencePercentage - 15) * 2;

    // Penalize excessive pauses
    if (pauseCount > 10) score -= (pauseCount - 10) * 2;

    return Math.max(0, Math.min(100, Math.round(score)));
}

// ==================== Filler Word Analysis ====================

function analyzeFillers(data) {
    const fillerCount = data.fillerWordCount || 0;
    const breakdown = data.fillerWordBreakdown || {};
    const wordCount = data.transcript?.split(/\s+/).filter(w => w.length > 0).length || 1;

    const fillerPercentage = (fillerCount / wordCount) * 100;

    // Identify most common filler
    let mostCommonFiller = null;
    let maxCount = 0;
    for (const [word, count] of Object.entries(breakdown)) {
        if (count > maxCount) {
            maxCount = count;
            mostCommonFiller = word;
        }
    }

    const issues = [];
    if (fillerPercentage > 5) {
        issues.push(`High filler word usage (${fillerPercentage.toFixed(1)}%)`);
    }
    if (mostCommonFiller && maxCount > 3) {
        issues.push(`Frequent use of "${mostCommonFiller}" (${maxCount} times)`);
    }

    return {
        totalFillers: fillerCount,
        percentage: Math.round(fillerPercentage * 10) / 10,
        breakdown: breakdown,
        mostCommon: mostCommonFiller,
        issues: issues,
        score: calculateFillerScore(fillerPercentage)
    };
}

function calculateFillerScore(percentage) {
    if (percentage === 0) return 100;
    if (percentage < 2) return 90;
    if (percentage < 5) return 70;
    if (percentage < 10) return 50;
    return Math.max(0, 50 - (percentage - 10) * 3);
}

// ==================== Overall Delivery Score ====================

function calculateDeliveryScore(analysis) {
    const weights = {
        pace: 0.3,
        volume: 0.2,
        pauses: 0.2,
        fillers: 0.3
    };

    const weightedScore =
        (analysis.paceAnalysis.score * weights.pace) +
        (analysis.volumeAnalysis.score * weights.volume) +
        (analysis.pauseAnalysis.score * weights.pauses) +
        (analysis.fillerAnalysis.score * weights.fillers);

    return Math.round(weightedScore);
}

// ==================== Insights Generation ====================

function generateInsights(analysis) {
    const insights = [];

    // Pace insights
    if (analysis.paceAnalysis.averageWpm >= 120 && analysis.paceAnalysis.averageWpm <= 150) {
        insights.push({
            type: 'positive',
            icon: 'check-circle',
            text: 'Your speaking pace is in the ideal range for clarity and engagement'
        });
    }

    // Volume insights
    if (analysis.volumeAnalysis.dynamicRange > 20) {
        insights.push({
            type: 'positive',
            icon: 'volume-2',
            text: 'Good use of vocal dynamics - your volume variation helps maintain interest'
        });
    }

    // Filler insights
    if (analysis.fillerAnalysis.percentage < 2) {
        insights.push({
            type: 'positive',
            icon: 'award',
            text: 'Excellent filler word control - your speech sounds polished and confident'
        });
    }

    // Areas for improvement
    if (analysis.paceAnalysis.variation < 10) {
        insights.push({
            type: 'improvement',
            icon: 'activity',
            text: 'Your pace is consistent but could benefit from more variation for emphasis'
        });
    }

    return insights;
}

// ==================== Recommendations Generation ====================

function generateRecommendations(analysis) {
    const recommendations = [];

    // Pace recommendations
    if (analysis.paceAnalysis.averageWpm < 100) {
        recommendations.push({
            priority: 'high',
            category: 'pace',
            title: 'Increase Speaking Speed',
            description: 'Your pace is slower than ideal. Practice reading aloud at a faster tempo.',
            exercise: 'Read a paragraph aloud, timing yourself. Aim to reduce your time by 10% each attempt.'
        });
    }

    if (analysis.paceAnalysis.averageWpm > 170) {
        recommendations.push({
            priority: 'high',
            category: 'pace',
            title: 'Slow Down',
            description: 'You\'re speaking too quickly, which can reduce comprehension.',
            exercise: 'Practice with a metronome set to 120 BPM. Speak one word per beat.'
        });
    }

    // Filler recommendations
    if (analysis.fillerAnalysis.mostCommon) {
        recommendations.push({
            priority: analysis.fillerAnalysis.percentage > 5 ? 'high' : 'medium',
            category: 'fillers',
            title: `Reduce "${analysis.fillerAnalysis.mostCommon}"`,
            description: `You used "${analysis.fillerAnalysis.mostCommon}" ${analysis.fillerAnalysis.breakdown[analysis.fillerAnalysis.mostCommon]} times.`,
            exercise: 'Practice pausing silently instead. Record yourself and count occurrences.'
        });
    }

    // Volume recommendations
    if (analysis.volumeAnalysis.variation < 10) {
        recommendations.push({
            priority: 'medium',
            category: 'volume',
            title: 'Add Vocal Variety',
            description: 'Your volume stays constant. Dynamic speech is more engaging.',
            exercise: 'Practice emphasizing key words by increasing volume slightly. Mark emphasis points in your text.'
        });
    }

    // Pause recommendations
    if (analysis.pauseAnalysis.silencePercentage < 3) {
        recommendations.push({
            priority: 'medium',
            category: 'pauses',
            title: 'Add Strategic Pauses',
            description: 'Pauses give your audience time to absorb information.',
            exercise: 'After each main point, pause for a full breath before continuing.'
        });
    }

    return recommendations;
}

// ==================== Render Analysis Results ====================

function renderDetailedAnalysis(analysis) {
    const analysisCard = document.getElementById('analysis-results-card');
    if (!analysisCard) return;

    analysisCard.innerHTML = `
        <div class="card-header">
            <h2 class="card-title">
                <i data-lucide="bar-chart-3"></i>
                Detailed Analysis
            </h2>
            <button class="btn btn-ghost btn-icon" onclick="closeDetailedAnalysis()">
                <i data-lucide="x"></i>
            </button>
        </div>
        <div class="card-body">
            ${generateAnalysisHTML(analysis)}
        </div>
    `;

    analysisCard.style.display = 'block';

    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function closeDetailedAnalysis() {
    const analysisCard = document.getElementById('analysis-results-card');
    if (analysisCard) {
        analysisCard.style.display = 'none';
    }
}

function generateAnalysisHTML(analysis) {
    return `
        <div class="detailed-analysis">
            <!-- Delivery Score -->
            <div class="analysis-section">
                <h3>Delivery Score</h3>
                <div class="delivery-score-circle ${getScoreClass(analysis.deliveryScore)}">
                    <span class="score-value">${analysis.deliveryScore}</span>
                    <span class="score-label">/ 100</span>
                </div>
            </div>

            <!-- Score Breakdown -->
            <div class="analysis-section">
                <h3>Score Breakdown</h3>
                <div class="score-bars">
                    ${renderScoreBar('Pace', analysis.paceAnalysis.score, 'activity')}
                    ${renderScoreBar('Volume', analysis.volumeAnalysis.score, 'volume-2')}
                    ${renderScoreBar('Pauses', analysis.pauseAnalysis.score, 'pause-circle')}
                    ${renderScoreBar('Fillers', analysis.fillerAnalysis.score, 'message-circle')}
                </div>
            </div>

            <!-- Pace Analysis -->
            <div class="analysis-section">
                <h3><i data-lucide="activity"></i> Pace Analysis</h3>
                <div class="metrics-row">
                    <div class="metric">
                        <span class="metric-value">${analysis.paceAnalysis.averageWpm}</span>
                        <span class="metric-label">Avg WPM</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${analysis.paceAnalysis.variation}</span>
                        <span class="metric-label">Variation</span>
                    </div>
                </div>
                ${analysis.paceAnalysis.issues.map(issue =>
                    `<p class="issue-item"><i data-lucide="alert-circle"></i> ${issue}</p>`
                ).join('')}
                ${renderPaceGraph(analysis.paceAnalysis.history)}
            </div>

            <!-- Volume Analysis -->
            <div class="analysis-section">
                <h3><i data-lucide="volume-2"></i> Volume Analysis</h3>
                <div class="metrics-row">
                    <div class="metric">
                        <span class="metric-value">${analysis.volumeAnalysis.averageVolume}%</span>
                        <span class="metric-label">Avg Volume</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${analysis.volumeAnalysis.dynamicRange}%</span>
                        <span class="metric-label">Dynamic Range</span>
                    </div>
                </div>
                ${analysis.volumeAnalysis.issues.map(issue =>
                    `<p class="issue-item"><i data-lucide="alert-circle"></i> ${issue}</p>`
                ).join('')}
            </div>

            <!-- Filler Words -->
            <div class="analysis-section">
                <h3><i data-lucide="message-circle"></i> Filler Words</h3>
                <div class="metrics-row">
                    <div class="metric">
                        <span class="metric-value">${analysis.fillerAnalysis.totalFillers}</span>
                        <span class="metric-label">Total Fillers</span>
                    </div>
                    <div class="metric">
                        <span class="metric-value">${analysis.fillerAnalysis.percentage}%</span>
                        <span class="metric-label">Of Speech</span>
                    </div>
                </div>
                ${Object.entries(analysis.fillerAnalysis.breakdown).length > 0 ? `
                    <div class="filler-breakdown">
                        ${Object.entries(analysis.fillerAnalysis.breakdown)
                            .sort((a, b) => b[1] - a[1])
                            .map(([word, count]) =>
                                `<span class="filler-chip">"${word}" × ${count}</span>`
                            ).join('')}
                    </div>
                ` : '<p class="text-muted">No filler words detected!</p>'}
            </div>

            <!-- Recommendations -->
            ${analysis.recommendations.length > 0 ? `
                <div class="analysis-section">
                    <h3><i data-lucide="target"></i> Recommendations</h3>
                    <div class="recommendations-list">
                        ${analysis.recommendations.map(rec => `
                            <div class="recommendation-card priority-${rec.priority}">
                                <div class="rec-header">
                                    <span class="rec-category">${rec.category}</span>
                                    <span class="rec-priority">${rec.priority}</span>
                                </div>
                                <h4>${rec.title}</h4>
                                <p>${rec.description}</p>
                                <div class="rec-exercise">
                                    <strong>Exercise:</strong> ${rec.exercise}
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            ` : ''}

            <!-- Insights -->
            ${analysis.insights.length > 0 ? `
                <div class="analysis-section">
                    <h3><i data-lucide="lightbulb"></i> Insights</h3>
                    ${analysis.insights.map(insight => `
                        <div class="insight-item insight-${insight.type}">
                            <i data-lucide="${insight.icon}"></i>
                            <span>${insight.text}</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `;
}

function renderScoreBar(label, score, icon) {
    const colorClass = score >= 80 ? 'excellent' : score >= 60 ? 'good' : score >= 40 ? 'fair' : 'poor';
    return `
        <div class="score-bar-item">
            <div class="score-bar-label">
                <i data-lucide="${icon}"></i>
                <span>${label}</span>
                <span class="score-bar-value">${score}/100</span>
            </div>
            <div class="score-bar-track">
                <div class="score-bar-fill ${colorClass}" style="width: ${score}%"></div>
            </div>
        </div>
    `;
}

function renderPaceGraph(history) {
    if (!history || history.length < 2) return '';

    const width = 300;
    const height = 80;
    const padding = 10;

    const maxWpm = Math.max(...history.map(h => h.wpm), 180);
    const minWpm = Math.min(...history.map(h => h.wpm), 80);

    const points = history.map((h, i) => {
        const x = padding + (i / (history.length - 1)) * (width - 2 * padding);
        const y = height - padding - ((h.wpm - minWpm) / (maxWpm - minWpm)) * (height - 2 * padding);
        return `${x},${y}`;
    }).join(' ');

    return `
        <div class="pace-graph">
            <svg viewBox="0 0 ${width} ${height}" class="pace-svg">
                <!-- Ideal range -->
                <rect x="${padding}" y="${height - padding - ((150 - minWpm) / (maxWpm - minWpm)) * (height - 2 * padding)}"
                      width="${width - 2 * padding}"
                      height="${((150 - 120) / (maxWpm - minWpm)) * (height - 2 * padding)}"
                      fill="rgba(34, 197, 94, 0.1)"/>
                <!-- Line -->
                <polyline points="${points}" fill="none" stroke="hsl(var(--primary))" stroke-width="2"/>
            </svg>
            <div class="pace-graph-labels">
                <span>Start</span>
                <span>End</span>
            </div>
        </div>
    `;
}

function getScoreClass(score) {
    if (score >= 80) return 'excellent';
    if (score >= 60) return 'good';
    if (score >= 40) return 'fair';
    return 'needs-work';
}
