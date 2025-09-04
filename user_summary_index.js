/**
 * User Summary Index System
 * Comprehensive performance tracking and scoring system for the fitness tracker
 * Integrates seamlessly with existing workout tracking without breaking functionality
 */

class UserSummaryIndex {
    constructor() {
        this.STORAGE_KEY = 'userSummaryIndex';
        this.HISTORY_KEY = 'indexHistory';
        this.MAX_HISTORY_DAYS = 90; // Keep 90 days of history
        
        // Index weight configuration (customizable)
        this.weights = {
            consistency: 0.25,      // 25% - How regularly user works out
            performance: 0.25,      // 25% - Calorie burn and efficiency
            improvement: 0.20,      // 20% - Trend over time
            variety: 0.15,          // 15% - Workout type diversity
            intensity: 0.15         // 15% - Heart rate and intensity levels
        };
        
        // Performance benchmarks (age/gender adjusted)
        this.benchmarks = {
            minCaloriesPerWorkout: 200,
            maxCaloriesPerWorkout: 800,
            targetWorkoutsPerWeek: 3,
            targetDuration: 30,
            maxHeartRatePercentage: 85
        };
    }

    /**
     * Calculate the current User Summary Index
     * Returns a score from 0-100 representing overall fitness performance
     */
    calculateCurrentIndex(userId = 'default') {
        try {
            const workoutHistory = this.getWorkoutHistory();
            
            if (workoutHistory.length === 0) {
                return {
                    score: 0,
                    level: 'New User',
                    components: {},
                    insights: ['Start your first workout to begin tracking!'],
                    timestamp: new Date().toISOString()
                };
            }

            // Calculate each component of the index
            const components = {
                consistency: this.calculateConsistencyScore(workoutHistory),
                performance: this.calculatePerformanceScore(workoutHistory),
                improvement: this.calculateImprovementScore(workoutHistory),
                variety: this.calculateVarietyScore(workoutHistory),
                intensity: this.calculateIntensityScore(workoutHistory)
            };

            // Calculate weighted final score
            const score = Math.round(
                components.consistency * this.weights.consistency +
                components.performance * this.weights.performance +
                components.improvement * this.weights.improvement +
                components.variety * this.weights.variety +
                components.intensity * this.weights.intensity
            );

            const level = this.getPerformanceLevel(score);
            const insights = this.generateInsights(components, workoutHistory);

            const indexData = {
                score: Math.max(0, Math.min(100, score)), // Ensure 0-100 range
                level,
                components,
                insights,
                timestamp: new Date().toISOString(),
                totalWorkouts: workoutHistory.length,
                averageCalories: Math.round(workoutHistory.reduce((sum, w) => sum + (w.calories || 0), 0) / workoutHistory.length)
            };

            // Save current index
            this.saveCurrentIndex(userId, indexData);
            
            // Save to history for trend analysis
            this.saveIndexToHistory(userId, indexData);

            return indexData;

        } catch (error) {
            console.error('Error calculating User Summary Index:', error);
            return {
                score: 0,
                level: 'Error',
                components: {},
                insights: ['Unable to calculate index. Please try again.'],
                timestamp: new Date().toISOString()
            };
        }
    }

    /**
     * Calculate consistency score (0-100) based on workout frequency
     */
    calculateConsistencyScore(workoutHistory) {
        const now = new Date();
        const fourWeeksAgo = new Date(now - 28 * 24 * 60 * 60 * 1000);
        
        // Get workouts from last 4 weeks
        const recentWorkouts = workoutHistory.filter(w => 
            new Date(w.timestamp) >= fourWeeksAgo
        );

        if (recentWorkouts.length === 0) return 0;

        // Calculate weekly average
        const weeksOfData = Math.min(4, Math.ceil(recentWorkouts.length / 3));
        const averageWorkoutsPerWeek = recentWorkouts.length / weeksOfData;
        
        // Score based on target frequency (3 workouts per week = 100 points)
        const consistencyScore = Math.min(100, (averageWorkoutsPerWeek / this.benchmarks.targetWorkoutsPerWeek) * 100);
        
        // Bonus for streak consistency
        const streakBonus = this.calculateStreakBonus(workoutHistory);
        
        return Math.min(100, Math.round(consistencyScore + streakBonus));
    }

    /**
     * Calculate performance score based on calorie burn and efficiency
     */
    calculatePerformanceScore(workoutHistory) {
        const recentWorkouts = workoutHistory.slice(-10); // Last 10 workouts
        
        if (recentWorkouts.length === 0) return 0;

        const avgCalories = recentWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0) / recentWorkouts.length;
        const avgEfficiency = recentWorkouts.reduce((sum, w) => sum + (w.efficiency || 70), 0) / recentWorkouts.length;
        const avgCaloriesPerMin = recentWorkouts.reduce((sum, w) => 
            sum + ((w.calories || 0) / (w.duration || 30)), 0) / recentWorkouts.length;

        // Normalize scores (adjust based on age/gender if available)
        const calorieScore = this.normalizeScore(avgCalories, 200, 600, 0, 40);
        const efficiencyScore = this.normalizeScore(avgEfficiency, 60, 95, 0, 35);
        const intensityScore = this.normalizeScore(avgCaloriesPerMin, 5, 20, 0, 25);

        return Math.round(calorieScore + efficiencyScore + intensityScore);
    }

    /**
     * Calculate improvement score based on trends over time
     */
    calculateImprovementScore(workoutHistory) {
        if (workoutHistory.length < 5) return 50; // Neutral score for new users

        const oldWorkouts = workoutHistory.slice(0, Math.floor(workoutHistory.length / 2));
        const newWorkouts = workoutHistory.slice(Math.floor(workoutHistory.length / 2));

        const oldAvgCalories = oldWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0) / oldWorkouts.length;
        const newAvgCalories = newWorkouts.reduce((sum, w) => sum + (w.calories || 0), 0) / newWorkouts.length;

        const improvement = (newAvgCalories - oldAvgCalories) / oldAvgCalories * 100;
        
        // Convert improvement percentage to 0-100 score
        if (improvement > 20) return 100; // Excellent improvement
        if (improvement > 10) return 85;  // Good improvement
        if (improvement > 0) return 70;   // Some improvement
        if (improvement > -5) return 60;  // Maintaining
        if (improvement > -10) return 40; // Slight decline
        return 20; // Significant decline
    }

    /**
     * Calculate variety score based on workout type diversity
     */
    calculateVarietyScore(workoutHistory) {
        const recentWorkouts = workoutHistory.slice(-20); // Last 20 workouts
        const workoutTypes = new Set(recentWorkouts.map(w => w.workoutType));
        
        // Score based on variety (5+ types = 100, 1 type = 20)
        const varietyScore = Math.min(100, 20 + (workoutTypes.size - 1) * 20);
        
        return Math.round(varietyScore);
    }

    /**
     * Calculate intensity score based on heart rate and workout intensity
     */
    calculateIntensityScore(workoutHistory) {
        const recentWorkouts = workoutHistory.slice(-10);
        
        if (recentWorkouts.length === 0) return 0;

        const avgHeartRate = recentWorkouts.reduce((sum, w) => sum + (w.heartRate || 120), 0) / recentWorkouts.length;
        const intensityDistribution = this.getIntensityDistribution(recentWorkouts);
        
        // Calculate age-adjusted max heart rate (if age is available)
        const sampleWorkout = recentWorkouts[0];
        const maxHR = sampleWorkout.age ? 220 - sampleWorkout.age : 190; // Default to 190 if no age
        const hrPercentage = (avgHeartRate / maxHR) * 100;
        
        // Score based on optimal heart rate zone (65-85% max HR)
        let hrScore;
        if (hrPercentage >= 65 && hrPercentage <= 85) hrScore = 100;
        else if (hrPercentage >= 60 && hrPercentage <= 90) hrScore = 80;
        else if (hrPercentage >= 50 && hrPercentage <= 95) hrScore = 60;
        else hrScore = 40;

        // Bonus for intensity variety
        const intensityVarietyBonus = (intensityDistribution.high + intensityDistribution.medium > 0.5) ? 10 : 0;

        return Math.min(100, Math.round(hrScore * 0.8 + intensityVarietyBonus));
    }

    /**
     * Utility Functions
     */
    calculateStreakBonus(workoutHistory) {
        // Calculate current workout streak
        const streak = this.getCurrentStreak(workoutHistory);
        
        if (streak >= 7) return 15; // Excellent streak
        if (streak >= 5) return 10; // Good streak
        if (streak >= 3) return 5;  // Decent streak
        return 0;
    }

    getCurrentStreak(workoutHistory) {
        if (workoutHistory.length === 0) return 0;
        
        const sortedWorkouts = [...workoutHistory].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        let streak = 1;
        let lastDate = new Date(sortedWorkouts[0].timestamp);
        
        for (let i = 1; i < sortedWorkouts.length; i++) {
            const currentDate = new Date(sortedWorkouts[i].timestamp);
            const daysDiff = Math.floor((lastDate - currentDate) / (1000 * 60 * 60 * 24));
            
            if (daysDiff <= 2) { // Allow 1-2 day gaps
                streak++;
                lastDate = currentDate;
            } else {
                break;
            }
        }
        
        return streak;
    }

    getIntensityDistribution(workouts) {
        const distribution = { low: 0, medium: 0, high: 0 };
        
        workouts.forEach(w => {
            const intensity = (w.intensity || 'Medium').toLowerCase();
            if (intensity === 'low') distribution.low++;
            else if (intensity === 'high') distribution.high++;
            else distribution.medium++;
        });

        const total = workouts.length;
        return {
            low: distribution.low / total,
            medium: distribution.medium / total,
            high: distribution.high / total
        };
    }

    normalizeScore(value, min, max, minScore, maxScore) {
        const normalized = Math.max(0, Math.min(1, (value - min) / (max - min)));
        return minScore + (normalized * (maxScore - minScore));
    }

    getPerformanceLevel(score) {
        if (score >= 90) return 'Elite Athlete';
        if (score >= 80) return 'Advanced';
        if (score >= 70) return 'Intermediate';
        if (score >= 60) return 'Developing';
        if (score >= 40) return 'Beginner';
        if (score >= 20) return 'Getting Started';
        return 'New User';
    }

    generateInsights(components, workoutHistory) {
        const insights = [];
        
        // Consistency insights
        if (components.consistency < 40) {
            insights.push('💪 Try to workout more regularly - consistency is key to progress!');
        } else if (components.consistency > 80) {
            insights.push('🔥 Excellent workout consistency! Keep up the great routine.');
        }

        // Performance insights
        if (components.performance < 50) {
            insights.push('⚡ Consider increasing workout intensity for better calorie burn.');
        } else if (components.performance > 85) {
            insights.push('🏆 Outstanding workout performance! You\'re crushing your fitness goals.');
        }

        // Improvement insights
        if (components.improvement < 40) {
            insights.push('📈 Focus on gradual progression - increase intensity or duration slowly.');
        } else if (components.improvement > 80) {
            insights.push('🚀 Amazing progress! Your fitness is improving rapidly.');
        }

        // Variety insights
        if (components.variety < 50) {
            insights.push('🎯 Try mixing up your workouts with different exercise types for better results.');
        }

        return insights;
    }

    /**
     * Historical Data Management
     */
    saveCurrentIndex(userId, indexData) {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            localStorage.setItem(key, JSON.stringify(indexData));
            return true;
        } catch (error) {
            console.error('Error saving current index:', error);
            return false;
        }
    }

    getCurrentIndex(userId = 'default') {
        try {
            const key = `${this.STORAGE_KEY}_${userId}`;
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error retrieving current index:', error);
            return null;
        }
    }

    saveIndexToHistory(userId, indexData) {
        try {
            const key = `${this.HISTORY_KEY}_${userId}`;
            let history = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Add current index to history
            history.push({
                score: indexData.score,
                level: indexData.level,
                components: indexData.components,
                timestamp: indexData.timestamp,
                totalWorkouts: indexData.totalWorkouts
            });

            // Clean old entries (keep last 90 days)
            const cutoffDate = new Date(Date.now() - this.MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
            history = history.filter(entry => new Date(entry.timestamp) > cutoffDate);

            // Keep only daily snapshots (one per day max)
            history = this.dedupeDailyEntries(history);

            localStorage.setItem(key, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error saving index history:', error);
            return false;
        }
    }

    getIndexHistory(userId = 'default', days = 30) {
        try {
            const key = `${this.HISTORY_KEY}_${userId}`;
            const history = JSON.parse(localStorage.getItem(key) || '[]');
            
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            return history.filter(entry => new Date(entry.timestamp) > cutoffDate);
        } catch (error) {
            console.error('Error retrieving index history:', error);
            return [];
        }
    }

    dedupeDailyEntries(history) {
        const dailyEntries = new Map();
        
        history.forEach(entry => {
            const dateKey = new Date(entry.timestamp).toDateString();
            if (!dailyEntries.has(dateKey) || new Date(entry.timestamp) > new Date(dailyEntries.get(dateKey).timestamp)) {
                dailyEntries.set(dateKey, entry);
            }
        });

        return Array.from(dailyEntries.values()).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    /**
     * Comparison Methods
     */
    compareWithPrevious(userId = 'default', periodDays = 7) {
        try {
            const current = this.getCurrentIndex(userId);
            if (!current) return null;

            const history = this.getIndexHistory(userId, periodDays * 2);
            if (history.length < 2) return null;

            const cutoffDate = new Date(Date.now() - periodDays * 24 * 60 * 60 * 1000);
            const previousEntries = history.filter(entry => new Date(entry.timestamp) < cutoffDate);
            
            if (previousEntries.length === 0) return null;

            const previous = previousEntries[previousEntries.length - 1];
            const scoreDiff = current.score - previous.score;
            const percentChange = ((scoreDiff / previous.score) * 100).toFixed(1);

            return {
                current: current.score,
                previous: previous.score,
                difference: scoreDiff,
                percentChange: parseFloat(percentChange),
                trend: scoreDiff > 0 ? 'improving' : scoreDiff < 0 ? 'declining' : 'stable',
                periodDays
            };
        } catch (error) {
            console.error('Error comparing with previous:', error);
            return null;
        }
    }

    getTrendAnalysis(userId = 'default', days = 30) {
        const history = this.getIndexHistory(userId, days);
        if (history.length < 3) return { trend: 'insufficient_data', message: 'Need more data for trend analysis' };

        const scores = history.map(h => h.score);
        const trend = this.calculateTrendDirection(scores);
        const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const volatility = this.calculateVolatility(scores);

        return {
            trend,
            averageScore: Math.round(avgScore),
            volatility: volatility.toFixed(1),
            dataPoints: scores.length,
            message: this.getTrendMessage(trend, volatility)
        };
    }

    calculateTrendDirection(scores) {
        if (scores.length < 2) return 'stable';
        
        const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
        const secondHalf = scores.slice(Math.floor(scores.length / 2));
        
        const firstAvg = firstHalf.reduce((sum, s) => sum + s, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, s) => sum + s, 0) / secondHalf.length;
        
        const diff = secondAvg - firstAvg;
        
        if (diff > 5) return 'strong_improvement';
        if (diff > 2) return 'improving';
        if (diff > -2) return 'stable';
        if (diff > -5) return 'declining';
        return 'strong_decline';
    }

    calculateVolatility(scores) {
        const avg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
        const variance = scores.reduce((sum, s) => sum + Math.pow(s - avg, 2), 0) / scores.length;
        return Math.sqrt(variance);
    }

    getTrendMessage(trend, volatility) {
        const vol = parseFloat(volatility);
        let stabilityMsg = vol < 5 ? 'very consistent' : vol < 10 ? 'fairly stable' : 'variable';
        
        switch (trend) {
            case 'strong_improvement':
                return `Excellent progress with ${stabilityMsg} performance!`;
            case 'improving':
                return `Good upward trend with ${stabilityMsg} results.`;
            case 'stable':
                return `Maintaining steady performance - ${stabilityMsg} results.`;
            case 'declining':
                return `Slight downward trend - consider reviewing your routine.`;
            case 'strong_decline':
                return `Significant decline - may need to adjust your approach.`;
            default:
                return `Performance tracking: ${stabilityMsg} results.`;
        }
    }

    /**
     * Integration with existing workout system
     */
    getWorkoutHistory() {
        try {
            return JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        } catch (error) {
            console.error('Error retrieving workout history:', error);
            return [];
        }
    }

    /**
     * Auto-update when new workout is saved
     */
    onWorkoutSaved(userId = 'default') {
        setTimeout(() => {
            this.calculateCurrentIndex(userId);
        }, 100); // Small delay to ensure workout is saved
    }

    /**
     * Export/Import functionality for backup
     */
    exportUserData(userId = 'default') {
        return {
            currentIndex: this.getCurrentIndex(userId),
            indexHistory: this.getIndexHistory(userId, this.MAX_HISTORY_DAYS),
            workoutHistory: this.getWorkoutHistory(),
            exportDate: new Date().toISOString()
        };
    }

    importUserData(data, userId = 'default') {
        try {
            if (data.currentIndex) {
                this.saveCurrentIndex(userId, data.currentIndex);
            }
            if (data.indexHistory) {
                const key = `${this.HISTORY_KEY}_${userId}`;
                localStorage.setItem(key, JSON.stringify(data.indexHistory));
            }
            return true;
        } catch (error) {
            console.error('Error importing user data:', error);
            return false;
        }
    }
}

// Export for use in other modules
window.UserSummaryIndex = UserSummaryIndex;
