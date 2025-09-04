/**
 * Unified Performance Index System - COMPLETELY REBUILT
 * Standardized metrics using industry-standard fitness benchmarks
 * All calculation formulas rebuilt from scratch with standardized weights
 */

class UnifiedPerformanceIndex {
    constructor() {
        this.STORAGE_KEY = 'unifiedPerformanceIndex';
        this.HISTORY_KEY = 'performanceIndexHistory';
        this.MAX_HISTORY_DAYS = 90;
        
        // STANDARDIZED calculation weights (as per requirements)
        this.weights = {
            consistency: 0.25,    // 25% - Workout frequency over past 30 days
            performance: 0.25,    // 25% - Calories vs target (WHO/ACSM standards)
            improvement: 0.20,    // 20% - Monthly progression vs previous month
            variety: 0.15,        // 15% - Workout type diversity (7 types max)
            intensity: 0.15       // 15% - Heart rate zone distribution
        };
        
        // STANDARDIZED MET values (metabolic equivalents)
        this.metValues = {
            running: 11.0,
            cycling: 8.0,
            swimming: 10.0,
            weightlifting: 6.0,
            boxing: 12.0,
            walking: 3.8,
            yoga: 2.5
        };
        
        // STANDARDIZED performance levels (industry standard)
        this.performanceLevels = [
            { min: 90, max: 100, level: 'Elite Athlete' },
            { min: 75, max: 89, level: 'Advanced' },
            { min: 60, max: 74, level: 'Intermediate' },
            { min: 45, max: 59, level: 'Developing' },
            { min: 30, max: 44, level: 'Beginner' },
            { min: 15, max: 29, level: 'Getting Started' },
            { min: 0, max: 14, level: 'New User' }
        ];
    }

    /**
     * REBUILT: Main calculation method with standardized formulas
     * Entry point for unified performance index calculation
     */
    calculateIndex(userId = 'default') {
        try {
            // Validate and get workout data
            const workoutHistory = this.getWorkoutHistory();
            const validatedData = this.validateMetricInputs(workoutHistory);
            
            if (!validatedData.isValid) {
                return this.getDefaultIndex();
            }

            // Calculate standardized components using industry benchmarks
            const components = this.calculateStandardizedComponents(workoutHistory, userId);
            
            // Calculate final standardized score with proper weighting
            const score = this.calculateStandardizedScore(components);
            
            // Get standardized performance level
            const level = this.getStandardizedPerformanceLevel(score);
            
            // Calculate trend and additional metrics
            const trend = this.calculateTrend(userId, score);
            const periodData = this.getPeriodComparisons(userId, score);

            const indexData = {
                score,
                displayScore: score,
                level,
                components,
                trend,
                lastUpdated: new Date().toISOString(),
                workoutCount: workoutHistory.length,
                periodData,
                benchmarksMet: this.getBenchmarkStatus(components)
            };

            // Save to storage
            this.saveCurrentIndex(userId, indexData);
            this.saveToHistory(userId, indexData);

            return indexData;

        } catch (error) {
            console.error('Error calculating unified performance index:', error);
            return this.getDefaultIndex();
        }
    }

    /**
     * REBUILT: Calculate all components using standardized industry formulas
     */
    calculateStandardizedComponents(workoutHistory, userId) {
        // CONSISTENCY (25%): (Workouts_Last_30_Days / 30) * 100
        const consistency = this.calculateStandardizedConsistency(workoutHistory);
        
        // PERFORMANCE (25%): (Actual_Calories / Target_Calories) * 100  
        const performance = this.calculateStandardizedPerformance(workoutHistory);
        
        // IMPROVEMENT (20%): ((Current_Month - Previous_Month) / Previous_Month) * 100
        const improvement = this.calculateStandardizedImprovement(workoutHistory);
        
        // VARIETY (15%): (Unique_Workout_Types / 7_Total_Types) * 100
        const variety = this.calculateStandardizedVariety(workoutHistory);
        
        // INTENSITY (15%): Heart_Rate_Zone_Distribution weighted average
        const intensity = this.calculateStandardizedIntensity(workoutHistory);
        
        return {
            consistency: Math.round(Math.max(0, Math.min(100, consistency))),
            performance: Math.round(Math.max(0, Math.min(100, performance))),
            improvement: Math.round(Math.max(0, Math.min(100, improvement))),
            variety: Math.round(Math.max(0, Math.min(100, variety))),
            intensity: Math.round(Math.max(0, Math.min(100, intensity)))
        };
    }

    /**
     * REBUILT: Calculate final standardized score with proper weighting
     */
    calculateStandardizedScore(components) {
        const weightedScore = 
            (components.consistency * this.weights.consistency) +    // 25%
            (components.performance * this.weights.performance) +    // 25%
            (components.improvement * this.weights.improvement) +    // 20%
            (components.variety * this.weights.variety) +            // 15%
            (components.intensity * this.weights.intensity);         // 15%
        
        // Ensure score is within 0-100 range
        return Math.round(Math.max(0, Math.min(100, weightedScore)));
    }

    /**
     * REBUILT: Standardized Consistency Calculation
     * Formula: (Workouts_Last_30_Days / 30) * 100
     * Benchmark: 1 workout per day = 100%
     */
    calculateStandardizedConsistency(workoutHistory) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentWorkouts = workoutHistory.filter(workout => {
            const workoutDate = new Date(workout.date || workout.timestamp);
            return workoutDate >= thirtyDaysAgo;
        });
        
        const workoutsLast30Days = recentWorkouts.length;
        
        // Formula: (Workouts_Last_30_Days / 30) * 100
        const consistencyScore = (workoutsLast30Days / 30) * 100;
        
        // Minimum threshold: 3 workouts/month = 10%
        if (workoutsLast30Days < 3) {
            return (workoutsLast30Days / 3) * 10;
        }
        
        // Maximum cap: 100% (daily workouts)
        return Math.min(100, consistencyScore);
    }

    /**
     * REBUILT: Standardized Performance Calculation
     * Formula: (Actual_Calories_Burned / Target_Calories) * 100
     * Benchmark: Target based on WHO/ACSM guidelines with age-weight-gender adjustment
     */
    calculateStandardizedPerformance(workoutHistory) {
        if (workoutHistory.length === 0) return 50;
        
        // Get recent workouts (last 10 for performance calculation)
        const recentWorkouts = workoutHistory.slice(-10);
        let totalActualCalories = 0;
        let totalTargetCalories = 0;
        
        recentWorkouts.forEach(workout => {
            const actualCalories = workout.calories || workout.caloriesBurned || 0;
            const targetCalories = this.getStandardizedTargetCalories(workout);
            
            totalActualCalories += actualCalories;
            totalTargetCalories += targetCalories;
        });
        
        if (totalTargetCalories === 0) return 50;
        
        // Formula: (Actual_Calories / Target_Calories) * 100
        const performanceRatio = (totalActualCalories / totalTargetCalories) * 100;
        
        // Scale to 0-100 range with realistic expectations
        return Math.min(100, performanceRatio);
    }

    /**
     * REBUILT: Standardized Improvement Calculation
     * Formula: ((Current_Month_Avg - Previous_Month_Avg) / Previous_Month_Avg) * 100
     * Benchmark: 5% monthly improvement = 100%
     */
    calculateStandardizedImprovement(workoutHistory) {
        if (workoutHistory.length < 2) return 50; // New users start at 50% baseline
        
        const now = new Date();
        const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        const previousMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const previousMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
        
        // Get current month workouts
        const currentMonthWorkouts = workoutHistory.filter(workout => {
            const workoutDate = new Date(workout.date || workout.timestamp);
            return workoutDate >= currentMonthStart;
        });
        
        // Get previous month workouts
        const previousMonthWorkouts = workoutHistory.filter(workout => {
            const workoutDate = new Date(workout.date || workout.timestamp);
            return workoutDate >= previousMonthStart && workoutDate <= previousMonthEnd;
        });
        
        if (previousMonthWorkouts.length === 0) return 50;
        
        // Calculate average performance for each month
        const currentAvg = this.getAverageCalories(currentMonthWorkouts);
        const previousAvg = this.getAverageCalories(previousMonthWorkouts);
        
        if (previousAvg === 0) return 50;
        
        // Formula: ((Current - Previous) / Previous) * 100
        const improvementPercent = ((currentAvg - previousAvg) / previousAvg) * 100;
        
        // Benchmark: 5% improvement = 100%
        const scaledImprovement = (improvementPercent / 5) * 100;
        
        // Handle negative improvement proportionally
        if (improvementPercent < 0) {
            return Math.max(0, 50 + scaledImprovement); // Negative scaled from 50
        }
        
        return Math.min(100, 50 + scaledImprovement); // Positive scaled from 50
    }

    /**
     * REBUILT: Standardized Variety Calculation
     * Formula: (Unique_Workout_Types_Last_30_Days / 7_Total_Types) * 100
     * Benchmark: 7 different types = 100%
     */
    calculateStandardizedVariety(workoutHistory) {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const recentWorkouts = workoutHistory.filter(workout => {
            const workoutDate = new Date(workout.date || workout.timestamp);
            return workoutDate >= thirtyDaysAgo;
        });
        
        if (recentWorkouts.length === 0) return 0;
        
        // Count unique workout types
        const uniqueTypes = new Set();
        recentWorkouts.forEach(workout => {
            const workoutType = workout.activity || workout.workoutType || workout.type || 'unknown';
            uniqueTypes.add(workoutType.toLowerCase());
        });
        
        const uniqueCount = uniqueTypes.size;
        const maxTypes = 7; // Total possible types: running, cycling, swimming, weightlifting, boxing, walking, yoga
        
        // Formula: (Unique_Types / 7_Total_Types) * 100
        const varietyScore = (uniqueCount / maxTypes) * 100;
        
        return Math.min(100, varietyScore);
    }

    /**
     * REBUILT: Standardized Intensity Calculation
     * Formula: Heart_Rate_Zone_Distribution weighted average
     */
    calculateStandardizedIntensity(workoutHistory) {
        if (workoutHistory.length === 0) return 50;
        
        const recentWorkouts = workoutHistory.slice(-10);
        let totalIntensityScore = 0;
        let workoutCount = 0;
        
        recentWorkouts.forEach(workout => {
            const heartRate = workout.heartRate || this.estimateHeartRate(workout);
            const age = workout.age || 25; // Default age if not provided
            const maxHeartRate = 220 - age;
            
            if (heartRate > 0 && maxHeartRate > 0) {
                const hrPercentage = (heartRate / maxHeartRate) * 100;
                const zoneScore = this.getHeartRateZoneScore(hrPercentage);
                totalIntensityScore += zoneScore;
                workoutCount++;
            }
        });
        
        if (workoutCount === 0) return 50;
        
        return totalIntensityScore / workoutCount;
    }

    /**
     * REBUILT: Heart Rate Zone Scoring (Standardized)
     */
    getHeartRateZoneScore(hrPercentage) {
        // Zone 1 (50-60% max HR): 20% value
        if (hrPercentage >= 50 && hrPercentage < 60) return 20;
        // Zone 2 (60-70% max HR): 40% value  
        if (hrPercentage >= 60 && hrPercentage < 70) return 40;
        // Zone 3 (70-80% max HR): 70% value
        if (hrPercentage >= 70 && hrPercentage < 80) return 70;
        // Zone 4 (80-90% max HR): 90% value
        if (hrPercentage >= 80 && hrPercentage < 90) return 90;
        // Zone 5 (90-100% max HR): 100% value
        if (hrPercentage >= 90) return 100;
        
        // Below zone 1
        return 10;
    }

    /**
     * REBUILT: Get standardized target calories based on WHO/ACSM guidelines
     */
    getStandardizedTargetCalories(workout) {
        const age = workout.age || 25;
        const weight = workout.weight || 70;
        const gender = workout.gender || 'male';
        const duration = workout.duration || 30;
        const activity = workout.activity || workout.workoutType || 'running';
        
        // Get standardized MET value for activity
        const met = this.metValues[activity.toLowerCase()] || 7.0;
        
        // Calculate base calorie target using standardized MET formula
        // Calories = MET × weight(kg) × time(hours)
        const baseTarget = met * weight * (duration / 60);
        
        // Apply age and gender adjustments based on WHO guidelines
        let adjustment = 1.0;
        
        // Age adjustments
        if (age < 20) adjustment *= 1.1;
        else if (age > 50) adjustment *= 0.9;
        else if (age > 65) adjustment *= 0.8;
        
        // Gender adjustments (men typically burn 10% more)
        if (gender.toLowerCase() === 'male') adjustment *= 1.1;
        
        return Math.round(baseTarget * adjustment);
    }

    /**
     * REBUILT: Estimate heart rate for intensity calculation
     */
    estimateHeartRate(workout) {
        const age = workout.age || 25;
        const activity = workout.activity || workout.workoutType || 'running';
        const duration = workout.duration || 30;
        
        const maxHeartRate = 220 - age;
        
        // Estimate intensity based on activity type
        let intensityPercent = 0.7; // Default 70%
        
        switch (activity.toLowerCase()) {
            case 'running':
                intensityPercent = 0.75 + (duration > 30 ? 0.1 : 0);
                break;
            case 'cycling':
                intensityPercent = 0.70;
                break;
            case 'swimming':
                intensityPercent = 0.80;
                break;
            case 'weightlifting':
                intensityPercent = 0.65;
                break;
            case 'boxing':
                intensityPercent = 0.85;
                break;
            case 'walking':
                intensityPercent = 0.55;
                break;
            case 'yoga':
                intensityPercent = 0.45;
                break;
        }
        
        return Math.round(maxHeartRate * intensityPercent);
    }

    /**
     * REBUILT: Calculate average calories for improvement calculation
     */
    getAverageCalories(workouts) {
        if (workouts.length === 0) return 0;
        
        const totalCalories = workouts.reduce((sum, workout) => {
            return sum + (workout.calories || workout.caloriesBurned || 0);
        }, 0);
        
        return totalCalories / workouts.length;
    }

    /**
     * REBUILT: Input validation for metric standardization
     */
    validateMetricInputs(workoutHistory) {
        if (!Array.isArray(workoutHistory)) {
            return { isValid: false, reason: 'Invalid workout history format' };
        }
        
        if (workoutHistory.length === 0) {
            return { isValid: true, reason: 'No workout data - using defaults' };
        }
        
        // Validate recent workout data quality
        const recentWorkout = workoutHistory[workoutHistory.length - 1];
        const hasRequiredFields = recentWorkout && 
            (recentWorkout.calories || recentWorkout.caloriesBurned) &&
            (recentWorkout.date || recentWorkout.timestamp);
            
        return { 
            isValid: hasRequiredFields || workoutHistory.length === 0,
            reason: hasRequiredFields ? 'Valid workout data' : 'Missing required fields'
        };
    }

    /**
     * REBUILT: Get standardized performance level mapping
     */
    getStandardizedPerformanceLevel(score) {
        for (const level of this.performanceLevels) {
            if (score >= level.min && score <= level.max) {
                return level.level;
            }
        }
        return 'New User'; // Fallback
    }

    /**
     * REBUILT: Get benchmark status for components
     */
    getBenchmarkStatus(components) {
        return {
            consistency: components.consistency >= 80 ? 'Excellent' : 
                        components.consistency >= 60 ? 'Good' : 
                        components.consistency >= 40 ? 'Fair' : 'Needs Improvement',
            performance: components.performance >= 90 ? 'Excellent' : 
                        components.performance >= 70 ? 'Good' : 
                        components.performance >= 50 ? 'Fair' : 'Needs Improvement',
            improvement: components.improvement >= 70 ? 'Strong Growth' : 
                        components.improvement >= 50 ? 'Steady' : 
                        components.improvement >= 30 ? 'Slow Growth' : 'Declining',
            variety: components.variety >= 60 ? 'Excellent' : 
                    components.variety >= 40 ? 'Good' : 
                    components.variety >= 20 ? 'Fair' : 'Limited',
            intensity: components.intensity >= 80 ? 'High' : 
                      components.intensity >= 60 ? 'Moderate' : 
                      components.intensity >= 40 ? 'Light' : 'Very Light'
        };
    }

    /**
     * PRESERVED: Calculate trend (keeping existing logic)
     */
    calculateTrend(userId, currentScore) {
        const history = this.getIndexHistory(userId, 14); // Last 2 weeks
        
        if (history.length < 3) return 'stable';
        
        const recentScores = history.slice(-5).map(h => h.score);
        const olderScores = history.slice(0, Math.max(1, history.length - 5)).map(h => h.score);
        
        const recentAvg = recentScores.reduce((sum, s) => sum + s, 0) / recentScores.length;
        const olderAvg = olderScores.reduce((sum, s) => sum + s, 0) / olderScores.length;
        
        const diff = recentAvg - olderAvg;
        
        if (diff > 5) return 'improving';
        if (diff < -5) return 'declining'; 
        return 'stable';
    }

    // Remaining preserved methods from original file
    getPeriodComparisons(userId, currentScore) {
        const weeklyComparison = this.compareWithPrevious(userId, 7);
        const monthlyComparison = this.compareWithPrevious(userId, 30);
        
        return {
            weekly: weeklyComparison,
            monthly: monthlyComparison
        };
    }

    compareWithPrevious(userId, days) {
        try {
            const history = this.getIndexHistory(userId, days * 2);
            
            if (history.length < 2) return null;
            
            const cutoffDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
            const previousEntries = history.filter(entry => 
                new Date(entry.timestamp) < cutoffDate
            );
            
            if (previousEntries.length === 0) return null;
            
            const currentEntry = history[history.length - 1];
            const previousEntry = previousEntries[previousEntries.length - 1];
            
            const difference = currentEntry.score - previousEntry.score;
            const percentChange = previousEntry.score > 0 ? 
                ((difference / previousEntry.score) * 100).toFixed(1) : 0;
            
            return {
                current: currentEntry.score,
                previous: previousEntry.score,
                difference,
                percentChange: parseFloat(percentChange),
                trend: difference > 0 ? 'improving' : difference < 0 ? 'declining' : 'stable'
            };
            
        } catch (error) {
            console.error('Error comparing with previous:', error);
            return null;
        }
    }

    formatForDisplay(indexData, format = 'default') {
        const score = indexData.score;
        
        switch(format) {
            case 'percentage':
                return `${score}%`;
            case 'decimal':
                return (score / 10).toFixed(1);
            case 'score':
                return `${score}/100`;
            case 'fraction':
                return `${score}/100`;
            default:
                return score.toString();
        }
    }

    getTrendIcon(trend) {
        switch(trend) {
            case 'improving': return '📈';
            case 'declining': return '📉';
            case 'stable': return '➡️';
            default: return '📊';
        }
    }

    getTrendText(indexData) {
        const { trend, periodData } = indexData;
        
        if (periodData && periodData.weekly) {
            const weekly = periodData.weekly;
            const sign = weekly.difference > 0 ? '+' : '';
            return `${sign}${weekly.difference} vs last week (${weekly.percentChange}%)`;
        }
        
        return trend === 'improving' ? 'Trending upward' :
               trend === 'declining' ? 'Needs attention' : 'Steady progress';
    }

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

    saveToHistory(userId, indexData) {
        try {
            const key = `${this.HISTORY_KEY}_${userId}`;
            let history = JSON.parse(localStorage.getItem(key) || '[]');
            
            // Add current entry
            history.push({
                score: indexData.score,
                level: indexData.level,
                components: indexData.components,
                trend: indexData.trend,
                timestamp: indexData.lastUpdated,
                workoutCount: indexData.workoutCount
            });

            // Clean old entries (keep last 90 days)
            const cutoffDate = new Date(Date.now() - this.MAX_HISTORY_DAYS * 24 * 60 * 60 * 1000);
            history = history.filter(entry => new Date(entry.timestamp) > cutoffDate);

            // Keep only daily snapshots
            history = this.dedupeDailyEntries(history);

            localStorage.setItem(key, JSON.stringify(history));
            return true;
        } catch (error) {
            console.error('Error saving to history:', error);
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
            if (!dailyEntries.has(dateKey) || 
                new Date(entry.timestamp) > new Date(dailyEntries.get(dateKey).timestamp)) {
                dailyEntries.set(dateKey, entry);
            }
        });

        return Array.from(dailyEntries.values())
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
    }

    getWorkoutHistory() {
        try {
            return JSON.parse(localStorage.getItem('workoutHistory') || '[]');
        } catch (error) {
            console.error('Error retrieving workout history:', error);
            return [];
        }
    }

    getDefaultIndex() {
        return {
            score: 0,
            displayScore: 0,
            level: 'Getting Started',
            components: {
                consistency: 0,
                performance: 0,
                improvement: 50,
                variety: 0,
                intensity: 0
            },
            trend: 'stable',
            lastUpdated: new Date().toISOString(),
            workoutCount: 0,
            periodData: { weekly: null, monthly: null }
        };
    }

    onWorkoutCompleted(userId = 'default') {
        setTimeout(() => {
            const indexData = this.calculateIndex(userId);
            this.updateUIElements(indexData);
        }, 500);
    }

    updateUIElements(indexData) {
        try {
            // Update main scores
            this.safeUpdateElement('unifiedPerformanceScore', indexData.score);
            this.safeUpdateElement('performanceLevel', indexData.level);
            
            // Update component scores
            this.safeUpdateElement('consistencyScore', indexData.components.consistency);
            this.safeUpdateElement('performanceScore', indexData.components.performance);
            this.safeUpdateElement('improvementScore', indexData.components.improvement);
            this.safeUpdateElement('varietyScore', indexData.components.variety);
            this.safeUpdateElement('intensityScore', indexData.components.intensity);
            
            // Update trend information
            const trendText = this.getTrendText(indexData);
            this.safeUpdateElement('performanceTrend', trendText);
            
            // Set trend icon
            const trendIcon = indexData.trend === 'improving' ? '📈' : 
                            indexData.trend === 'declining' ? '📉' : '📊';
            this.safeUpdateElement('performanceTrendIcon', trendIcon);
            
            // Update historical comparison data
            if (indexData.periodData) {
                if (indexData.periodData.weekly) {
                    const weekly = indexData.periodData.weekly;
                    const sign = weekly.difference >= 0 ? '+' : '';
                    this.safeUpdateElement('weeklyChange', `${sign}${weekly.difference.toFixed(1)}`);
                    this.safeUpdateElement('weeklyPercent', `${sign}${weekly.percentChange}%`);
                }
                
                if (indexData.periodData.monthly) {
                    const monthly = indexData.periodData.monthly;
                    const sign = monthly.difference >= 0 ? '+' : '';
                    this.safeUpdateElement('monthlyChange', `${sign}${monthly.difference.toFixed(1)}`);
                    this.safeUpdateElement('monthlyPercent', `${sign}${monthly.percentChange}%`);
                }
            }
            
            this.updateInsights(indexData);
            
        } catch (error) {
            console.error('Error updating UI elements:', error);
        }
    }

    updateInsights(indexData) {
        const insights = [];
        
        if (indexData.components.consistency >= 90) {
            insights.push("🔥 Excellent workout consistency! Keep up the great routine.");
        } else if (indexData.components.consistency >= 70) {
            insights.push("💪 Good consistency. Try to maintain regular workout schedule.");
        } else {
            insights.push("📅 Focus on building a consistent workout routine for better results.");
        }
        
        if (indexData.components.performance >= 85) {
            insights.push("⚡ Outstanding performance! You're exceeding calorie burn expectations.");
        } else if (indexData.components.improvement < 30) {
            insights.push("📈 Focus on gradual progression - increase intensity or duration slowly.");
        }
        
        if (indexData.components.variety >= 80) {
            insights.push("🎯 Great workout variety! This helps prevent plateaus and injuries.");
        } else if (indexData.components.variety < 60) {
            insights.push("🔄 Try mixing different workout types to improve overall fitness.");
        }
        
        const insightsList = document.getElementById('insightsList');
        if (insightsList && insights.length > 0) {
            insightsList.innerHTML = insights.map(insight => 
                `<div style="margin-bottom: 8px;">${insight}</div>`
            ).join('');
        }
    }

    initializeButtons() {
        const viewHistoryBtn = document.getElementById('viewUnifiedHistoryBtn');
        if (viewHistoryBtn) {
            viewHistoryBtn.addEventListener('click', () => {
                this.showHistoryModal();
            });
        }
        
        const refreshBtn = document.getElementById('refreshUnifiedIndexBtn');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => {
                const indexData = this.calculateIndex('default');
                this.updateUIElements(indexData);
                console.log('🔄 Performance index refreshed:', indexData);
            });
        }
    }

    showHistoryModal() {
        const history = this.getIndexHistory('default', 30);
        
        if (history.length === 0) {
            alert('No performance history available yet. Complete a few workouts to see your progress!');
            return;
        }
        
        const historyText = history.slice(-10).reverse().map(entry => {
            const date = new Date(entry.timestamp).toLocaleDateString();
            return `${date}: Score ${entry.score} (${entry.level})`;
        }).join('\n');
        
        alert(`📊 Your Recent Performance History:\n\n${historyText}\n\nKeep logging workouts to track your progress over time!`);
    }

    safeUpdateElement(elementId, content) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = content;
        }
    }
}

// Initialize unified system
window.unifiedPerformanceIndex = new UnifiedPerformanceIndex();
