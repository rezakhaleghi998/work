/**
 * User Summary Index UI Components
 * Seamlessly integrates with existing fitness tracker interface
 */

class SummaryIndexUI {
    constructor(summaryIndex) {
        this.summaryIndex = summaryIndex;
        this.userId = 'default'; // Can be extended for multi-user support
    }

    /**
     * Create and insert the Summary Index panel into the existing UI
     */
    initializeSummaryPanel() {
        // Create the summary panel HTML
        const summaryPanelHTML = this.createSummaryPanelHTML();
        
        // Find a good place to insert it in the existing UI
        // Look for results section or create a new section
        const resultsDiv = document.getElementById('resultsDiv');
        if (resultsDiv) {
            const summaryPanel = document.createElement('div');
            summaryPanel.innerHTML = summaryPanelHTML;
            
            // Insert at the beginning of results for visibility
            resultsDiv.insertBefore(summaryPanel.firstElementChild, resultsDiv.firstChild);
        } else {
            console.warn('Results div not found - adding summary panel to container');
            const container = document.querySelector('.container');
            if (container) {
                const summaryPanel = document.createElement('div');
                summaryPanel.innerHTML = summaryPanelHTML;
                container.appendChild(summaryPanel.firstElementChild);
            }
        }
    }

    createSummaryPanelHTML() {
        return `
        <div id="summaryIndexPanel" class="summary-index-panel" style="
            background: rgba(255, 255, 255, 0.95);
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
            border: 1px solid rgba(255, 255, 255, 0.3);
        ">
            <div class="summary-header" style="
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                border-bottom: 2px solid #e8f4fd;
                padding-bottom: 16px;
            ">
                <div>
                    <h3 style="color: #2c3e50; margin: 0; font-size: 1.4rem; font-weight: 600;">
                        🏃‍♂️ Fitness Performance Index
                    </h3>
                    <p style="color: #7f8c8d; margin: 4px 0 0 0; font-size: 0.9rem;">
                        Your comprehensive fitness score
                    </p>
                </div>
                <div class="index-score-badge" style="
                    background: linear-gradient(135deg, #3498db, #2980b9);
                    color: white;
                    padding: 12px 20px;
                    border-radius: 12px;
                    text-align: center;
                    min-width: 80px;
                ">
                    <div id="currentIndexScore" style="font-size: 1.8rem; font-weight: bold;">--</div>
                    <div style="font-size: 0.8rem; opacity: 0.9;">Score</div>
                </div>
            </div>

            <div class="summary-content" style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div class="performance-overview">
                    <div id="performanceLevel" style="
                        font-size: 1.1rem;
                        font-weight: 600;
                        color: #2c3e50;
                        margin-bottom: 12px;
                    ">Getting Started</div>
                    
                    <div class="components-breakdown" style="margin-bottom: 16px;">
                        <div style="font-size: 0.9rem; font-weight: 600; color: #34495e; margin-bottom: 8px;">
                            Score Breakdown:
                        </div>
                        <div id="consistencyComponent" class="component-item">
                            <span>Consistency:</span> <span class="component-score">--</span>
                        </div>
                        <div id="performanceComponent" class="component-item">
                            <span>Performance:</span> <span class="component-score">--</span>
                        </div>
                        <div id="improvementComponent" class="component-item">
                            <span>Improvement:</span> <span class="component-score">--</span>
                        </div>
                        <div id="varietyComponent" class="component-item">
                            <span>Variety:</span> <span class="component-score">--</span>
                        </div>
                        <div id="intensityComponent" class="component-item">
                            <span>Intensity:</span> <span class="component-score">--</span>
                        </div>
                    </div>
                </div>

                <div class="trend-analysis">
                    <div style="font-size: 0.9rem; font-weight: 600; color: #34495e; margin-bottom: 8px;">
                        Recent Trend:
                    </div>
                    <div id="trendIndicator" style="
                        display: flex;
                        align-items: center;
                        gap: 8px;
                        margin-bottom: 12px;
                    ">
                        <span id="trendIcon" style="font-size: 1.2rem;">📊</span>
                        <span id="trendText" style="color: #2c3e50;">Calculating...</span>
                    </div>
                    
                    <div id="comparisonSection" style="font-size: 0.85rem; color: #7f8c8d;">
                        <div id="weeklyComparison">Weekly change: --</div>
                        <div id="monthlyComparison">Monthly change: --</div>
                    </div>
                </div>
            </div>

            <div id="summaryInsights" class="insights-section" style="
                margin-top: 20px;
                padding-top: 16px;
                border-top: 1px solid #ecf0f1;
            ">
                <div style="font-size: 0.9rem; font-weight: 600; color: #34495e; margin-bottom: 8px;">
                    💡 Insights:
                </div>
                <div id="insightsList" style="font-size: 0.85rem; color: #555;">
                    <div>Complete your first workout to see personalized insights!</div>
                </div>
            </div>

            <div class="summary-actions" style="
                margin-top: 16px;
                display: flex;
                gap: 12px;
                justify-content: flex-end;
            ">
                <button id="viewHistoryBtn" class="summary-btn" style="
                    background: #ecf0f1;
                    color: #2c3e50;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="summaryIndexUI.showHistoryModal()">
                    📈 View History
                </button>
                <button id="refreshIndexBtn" class="summary-btn" style="
                    background: #3498db;
                    color: white;
                    border: none;
                    padding: 8px 16px;
                    border-radius: 8px;
                    font-size: 0.8rem;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="summaryIndexUI.refreshIndex()">
                    🔄 Refresh
                </button>
            </div>
        </div>

        <style>
            .component-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 4px 0;
                font-size: 0.85rem;
                color: #555;
            }
            
            .component-score {
                font-weight: 600;
                color: #2c3e50;
            }
            
            .summary-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0,0,0,0.15);
            }
            
            .trend-up { color: #27ae60; }
            .trend-down { color: #e74c3c; }
            .trend-stable { color: #f39c12; }
        </style>
        `;
    }

    /**
     * Update the summary panel with current data
     */
    updateSummaryPanel() {
        const indexData = this.summaryIndex.calculateCurrentIndex(this.userId);
        
        if (!indexData) {
            console.error('Failed to calculate index data');
            return;
        }

        // Update main score and level
        this.safeUpdateElement('currentIndexScore', indexData.score);
        this.safeUpdateElement('performanceLevel', indexData.level);

        // Update component scores
        if (indexData.components) {
            this.updateComponentScore('consistencyComponent', indexData.components.consistency);
            this.updateComponentScore('performanceComponent', indexData.components.performance);
            this.updateComponentScore('improvementComponent', indexData.components.improvement);
            this.updateComponentScore('varietyComponent', indexData.components.variety);
            this.updateComponentScore('intensityComponent', indexData.components.intensity);
        }

        // Update trend analysis
        this.updateTrendAnalysis();

        // Update insights
        this.updateInsights(indexData.insights || []);

        // Update badge color based on score
        this.updateScoreBadgeColor(indexData.score);
    }

    updateComponentScore(elementId, score) {
        const element = document.getElementById(elementId);
        if (element) {
            const scoreSpan = element.querySelector('.component-score');
            if (scoreSpan) {
                scoreSpan.textContent = Math.round(score);
                scoreSpan.style.color = this.getScoreColor(score);
            }
        }
    }

    updateTrendAnalysis() {
        const weeklyComparison = this.summaryIndex.compareWithPrevious(this.userId, 7);
        const monthlyComparison = this.summaryIndex.compareWithPrevious(this.userId, 30);
        const trendAnalysis = this.summaryIndex.getTrendAnalysis(this.userId, 14);

        // Update trend indicator
        if (trendAnalysis) {
            this.safeUpdateElement('trendText', trendAnalysis.message);
            const trendIcon = document.getElementById('trendIcon');
            if (trendIcon) {
                trendIcon.textContent = this.getTrendIcon(trendAnalysis.trend);
            }
        }

        // Update comparisons
        if (weeklyComparison) {
            this.safeUpdateElement('weeklyComparison', 
                `Weekly: ${weeklyComparison.difference > 0 ? '+' : ''}${weeklyComparison.difference} (${weeklyComparison.percentChange}%)`);
        }

        if (monthlyComparison) {
            this.safeUpdateElement('monthlyComparison', 
                `Monthly: ${monthlyComparison.difference > 0 ? '+' : ''}${monthlyComparison.difference} (${monthlyComparison.percentChange}%)`);
        }
    }

    updateInsights(insights) {
        const insightsList = document.getElementById('insightsList');
        if (insightsList && insights.length > 0) {
            insightsList.innerHTML = insights.map(insight => 
                `<div style="margin-bottom: 4px;">• ${insight}</div>`
            ).join('');
        }
    }

    updateScoreBadgeColor(score) {
        const badge = document.querySelector('.index-score-badge');
        if (badge) {
            let gradient;
            if (score >= 80) gradient = 'linear-gradient(135deg, #27ae60, #2ecc71)'; // Green
            else if (score >= 60) gradient = 'linear-gradient(135deg, #f39c12, #e67e22)'; // Orange
            else if (score >= 40) gradient = 'linear-gradient(135deg, #e74c3c, #c0392b)'; // Red
            else gradient = 'linear-gradient(135deg, #95a5a6, #7f8c8d)'; // Gray
            
            badge.style.background = gradient;
        }
    }

    getTrendIcon(trend) {
        switch (trend) {
            case 'strong_improvement': return '🚀';
            case 'improving': return '📈';
            case 'stable': return '➡️';
            case 'declining': return '📉';
            case 'strong_decline': return '⚠️';
            default: return '📊';
        }
    }

    getScoreColor(score) {
        if (score >= 80) return '#27ae60';
        if (score >= 60) return '#f39c12';
        if (score >= 40) return '#e74c3c';
        return '#95a5a6';
    }

    /**
     * Modal for viewing detailed history
     */
    showHistoryModal() {
        const history = this.summaryIndex.getIndexHistory(this.userId, 30);
        
        const modal = document.createElement('div');
        modal.id = 'historyModal';
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 1000;
        `;

        modal.innerHTML = `
            <div class="modal-content" style="
                background: white;
                border-radius: 16px;
                padding: 32px;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button onclick="document.getElementById('historyModal').remove()" style="
                    position: absolute;
                    top: 16px;
                    right: 16px;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                    color: #7f8c8d;
                ">×</button>
                
                <h3 style="color: #2c3e50; margin-bottom: 20px;">📊 Fitness Index History</h3>
                
                <div id="historyChart" style="margin-bottom: 20px;">
                    ${this.createHistoryChart(history)}
                </div>
                
                <div id="historyList">
                    ${this.createHistoryList(history)}
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close modal when clicking outside
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    createHistoryChart(history) {
        if (history.length === 0) {
            return '<p style="text-align: center; color: #7f8c8d;">No history data available</p>';
        }

        // Simple text-based chart
        const maxScore = Math.max(...history.map(h => h.score));
        const minScore = Math.min(...history.map(h => h.score));
        const range = maxScore - minScore || 1;

        const chartHTML = history.slice(-14).map((entry, index) => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            const barHeight = Math.max(4, ((entry.score - minScore) / range) * 40);
            
            return `
                <div style="display: inline-block; margin-right: 8px; text-align: center;">
                    <div style="
                        width: 20px;
                        height: ${barHeight}px;
                        background: ${this.getScoreColor(entry.score)};
                        margin-bottom: 4px;
                        border-radius: 2px;
                    "></div>
                    <div style="font-size: 0.7rem; color: #7f8c8d; writing-mode: vertical-rl;">
                        ${date.split('/')[1]}/${date.split('/')[2]}
                    </div>
                    <div style="font-size: 0.75rem; font-weight: 600; color: #2c3e50;">
                        ${entry.score}
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="
                border: 1px solid #ecf0f1;
                border-radius: 8px;
                padding: 16px;
                background: #f8f9fa;
                text-align: center;
            ">
                <div style="font-size: 0.9rem; font-weight: 600; margin-bottom: 12px; color: #34495e;">
                    Last 14 Days Score Trend
                </div>
                <div style="display: flex; justify-content: center; align-items: end; min-height: 60px;">
                    ${chartHTML}
                </div>
            </div>
        `;
    }

    createHistoryList(history) {
        if (history.length === 0) {
            return '<p style="text-align: center; color: #7f8c8d;">No history entries found</p>';
        }

        const listHTML = history.slice(-10).reverse().map(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            const time = new Date(entry.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
            
            return `
                <div style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 12px;
                    border-bottom: 1px solid #ecf0f1;
                    background: ${entry.score >= 70 ? '#f0fff4' : entry.score >= 50 ? '#fff8f0' : '#fff0f0'};
                ">
                    <div>
                        <div style="font-weight: 600; color: #2c3e50;">${entry.level}</div>
                        <div style="font-size: 0.8rem; color: #7f8c8d;">${date} at ${time}</div>
                    </div>
                    <div style="text-align: right;">
                        <div style="
                            font-size: 1.2rem;
                            font-weight: bold;
                            color: ${this.getScoreColor(entry.score)};
                        ">${entry.score}</div>
                        <div style="font-size: 0.75rem; color: #7f8c8d;">
                            ${entry.totalWorkouts || 0} workouts
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        return `
            <div style="border: 1px solid #ecf0f1; border-radius: 8px; background: white;">
                <div style="padding: 16px 16px 0 16px;">
                    <div style="font-size: 0.9rem; font-weight: 600; color: #34495e; margin-bottom: 12px;">
                        Recent Index History
                    </div>
                </div>
                ${listHTML}
            </div>
        `;
    }

    /**
     * Refresh the index calculation and update display
     */
    refreshIndex() {
        console.log('🔄 Refreshing User Summary Index...');
        this.updateSummaryPanel();
        
        // Show refresh feedback
        const refreshBtn = document.getElementById('refreshIndexBtn');
        if (refreshBtn) {
            const originalText = refreshBtn.textContent;
            refreshBtn.textContent = '✅ Updated';
            refreshBtn.style.background = '#27ae60';
            
            setTimeout(() => {
                refreshBtn.textContent = originalText;
                refreshBtn.style.background = '#3498db';
            }, 1500);
        }
    }

    /**
     * Integration hooks for existing workout system
     */
    onWorkoutCompleted() {
        // This will be called after a workout is saved
        setTimeout(() => {
            this.summaryIndex.onWorkoutSaved(this.userId);
            this.updateSummaryPanel();
        }, 500);
    }

    /**
     * Initialize the summary index system
     */
    initialize() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                this.initializeSummaryPanel();
                this.updateSummaryPanel();
            });
        } else {
            this.initializeSummaryPanel();
            this.updateSummaryPanel();
        }

        // Hook into existing workout save function if it exists
        this.hookIntoExistingSystem();
    }

    hookIntoExistingSystem() {
        // Override the existing saveWorkoutData function to trigger index update
        if (typeof window.saveWorkoutData === 'function') {
            const originalSaveWorkoutData = window.saveWorkoutData;
            
            window.saveWorkoutData = (workoutData) => {
                const result = originalSaveWorkoutData(workoutData);
                if (result) {
                    this.onWorkoutCompleted();
                }
                return result;
            };
            
            console.log('✅ Successfully hooked into existing workout save system');
        }
    }

    /**
     * Utility functions
     */
    safeUpdateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }

    /**
     * Export functionality for user data
     */
    exportUserSummary() {
        const exportData = this.summaryIndex.exportUserData(this.userId);
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitness-summary-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
}

// Initialize the summary index system
let summaryIndexInstance = null;
let summaryIndexUI = null;

// Auto-initialize when script loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Initializing User Summary Index System...');
    
    // Initialize the summary index
    summaryIndexInstance = new UserSummaryIndex();
    summaryIndexUI = new SummaryIndexUI(summaryIndexInstance);
    
    // Initialize the UI
    summaryIndexUI.initialize();
    
    console.log('✅ User Summary Index System initialized successfully!');
});

// Export for global access
window.SummaryIndexUI = SummaryIndexUI;
window.summaryIndexInstance = summaryIndexInstance;
window.summaryIndexUI = summaryIndexUI;
