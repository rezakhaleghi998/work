/**
 * Fitness Tracker Database System
 * Handles user authentication, data storage, and ranking system
 * Uses localStorage for client-side data persistence
 */

class FitnessDatabase {
    constructor() {
        this.USERS_KEY = 'fitness_users';
        this.PERFORMANCE_KEY = 'fitness_performance';
        this.RANKINGS_KEY = 'fitness_rankings';
        this.SESSION_KEY = 'fitness_session';
        
        // Initialize default demo user
        this.initializeDefaultUsers();
        
        console.log('🗄️ Fitness Database System initialized');
    }

    /**
     * Initialize default demo users for testing
     */
    initializeDefaultUsers() {
        const users = this.getUsers();
        
        if (users.length === 0) {
            // Create demo user
            this.createUser('demo', 'demo@example.com', 'demo123', {
                height: 175,
                weight: 70,
                age: 30,
                gender: 'Male',
                fitnessLevel: 'Intermediate',
                metabolicRate: 1850
            });
            
            // Create additional sample users for ranking comparison
            this.createUser('john_doe', 'john@example.com', 'password', {
                height: 180,
                weight: 75,
                age: 28,
                gender: 'Male',
                fitnessLevel: 'Advanced',
                metabolicRate: 1920
            });
            
            this.createUser('jane_smith', 'jane@example.com', 'password', {
                height: 165,
                weight: 60,
                age: 26,
                gender: 'Female',
                fitnessLevel: 'Beginner',
                metabolicRate: 1650
            });
            
            console.log('✅ Default users created');
        }
    }

    /**
     * Create a new user account
     */
    createUser(username, email, password, profile = {}) {
        const users = this.getUsers();
        
        // Check if user already exists
        const existingUser = users.find(u => u.username === username || u.email === email);
        if (existingUser) {
            return false;
        }

        const newUser = {
            id: this.generateId(),
            username,
            email,
            password: this.hashPassword(password),
            profile: {
                height: profile.height || null,
                weight: profile.weight || null,
                age: profile.age || null,
                gender: profile.gender || null,
                fitnessLevel: profile.fitnessLevel || 'Beginner',
                metabolicRate: profile.metabolicRate || this.calculateMetabolicRate(profile)
            },
            createdAt: new Date().toISOString(),
            lastLogin: null,
            totalWorkouts: 0
        };

        users.push(newUser);
        this.saveUsers(users);
        
        console.log(`👤 User created: ${username}`);
        return true;
    }

    /**
     * Authenticate user login
     */
    async authenticateUser(username, password) {
        const users = this.getUsers();
        const hashedPassword = this.hashPassword(password);
        
        const user = users.find(u => 
            (u.username === username || u.email === username) && 
            u.password === hashedPassword
        );

        if (user) {
            // Update last login
            user.lastLogin = new Date().toISOString();
            this.saveUsers(users);
            
            // Create session
            this.createSession(user);
            
            console.log(`🔐 User authenticated: ${user.username}`);
            return {
                id: user.id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                totalWorkouts: user.totalWorkouts
            };
        }

        return null;
    }

    /**
     * Get current authenticated user
     */
    getCurrentUser() {
        const sessionData = localStorage.getItem(this.SESSION_KEY);
        if (sessionData) {
            const session = JSON.parse(sessionData);
            // Check if session is still valid (24 hours)
            if (Date.now() - session.timestamp < 24 * 60 * 60 * 1000) {
                return session.user;
            }
        }
        return null;
    }

    /**
     * Create user session
     */
    createSession(user) {
        const session = {
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                profile: user.profile,
                totalWorkouts: user.totalWorkouts
            },
            timestamp: Date.now()
        };
        
        localStorage.setItem(this.SESSION_KEY, JSON.stringify(session));
    }

    /**
     * Logout user
     */
    logout() {
        localStorage.removeItem(this.SESSION_KEY);
        console.log('👋 User logged out');
    }

    /**
     * Save performance data for user
     */
    savePerformanceData(userId, performanceData) {
        const key = `${this.PERFORMANCE_KEY}_${userId}`;
        let userPerformance = JSON.parse(localStorage.getItem(key) || '[]');
        
        const newEntry = {
            id: this.generateId(),
            timestamp: new Date().toISOString(),
            fitnessIndex: performanceData.fitnessIndex || 0,
            metabolicRate: performanceData.metabolicRate || 0,
            efficiencyGrade: performanceData.efficiencyGrade || 'C',
            workoutData: performanceData.workoutData || {},
            components: performanceData.components || {}
        };
        
        userPerformance.push(newEntry);
        
        // Keep only last 90 days of data
        const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
        userPerformance = userPerformance.filter(entry => 
            new Date(entry.timestamp).getTime() > ninetyDaysAgo
        );
        
        localStorage.setItem(key, JSON.stringify(userPerformance));
        
        // Update user total workouts
        this.updateUserWorkoutCount(userId);
        
        // Update rankings
        this.updateUserRankings();
        
        console.log('📊 Performance data saved for user:', userId);
    }

    /**
     * Get performance data for user
     */
    getPerformanceData(userId, days = 30) {
        const key = `${this.PERFORMANCE_KEY}_${userId}`;
        const userPerformance = JSON.parse(localStorage.getItem(key) || '[]');
        
        if (days) {
            const cutoffDate = Date.now() - (days * 24 * 60 * 60 * 1000);
            return userPerformance.filter(entry => 
                new Date(entry.timestamp).getTime() > cutoffDate
            );
        }
        
        return userPerformance;
    }

    /**
     * Update user workout count
     */
    updateUserWorkoutCount(userId) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].totalWorkouts += 1;
            this.saveUsers(users);
        }
    }

    /**
     * Update user profile data
     */
    updateUserProfile(userId, profileData) {
        const users = this.getUsers();
        const userIndex = users.findIndex(u => u.id === userId);
        
        if (userIndex !== -1) {
            users[userIndex].profile = {
                ...users[userIndex].profile,
                ...profileData
            };
            
            // Recalculate metabolic rate if weight, height, age, or gender changed
            if (profileData.weight || profileData.height || profileData.age || profileData.gender) {
                users[userIndex].profile.metabolicRate = this.calculateMetabolicRate(users[userIndex].profile);
            }
            
            this.saveUsers(users);
            console.log('👤 Profile updated for user:', userId);
            return true;
        }
        
        return false;
    }

    /**
     * Calculate basal metabolic rate using Mifflin-St Jeor Equation
     */
    calculateMetabolicRate(profile) {
        if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
            return 1800; // Default BMR
        }
        
        let bmr;
        if (profile.gender.toLowerCase() === 'male') {
            bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) + 5;
        } else {
            bmr = (10 * profile.weight) + (6.25 * profile.height) - (5 * profile.age) - 161;
        }
        
        return Math.round(bmr);
    }

    /**
     * Get user rankings
     */
    getUserRankings(userId) {
        const rankings = JSON.parse(localStorage.getItem(this.RANKINGS_KEY) || '{}');
        return rankings[userId] || {
            overallRank: 0,
            fitnessRank: 0,
            efficiencyRank: 0,
            consistencyRank: 0,
            totalUsers: 0,
            percentile: 0
        };
    }

    /**
     * Update user rankings across all users
     */
    updateUserRankings() {
        const users = this.getUsers();
        const rankings = {};
        
        // Collect performance data for all users
        const userStats = users.map(user => {
            const performanceData = this.getPerformanceData(user.id, 30);
            const latestPerformance = performanceData[performanceData.length - 1];
            
            return {
                id: user.id,
                username: user.username,
                fitnessIndex: latestPerformance?.fitnessIndex || 0,
                efficiencyGrade: latestPerformance?.efficiencyGrade || 'F',
                consistency: performanceData.length, // Number of workouts as consistency metric
                totalWorkouts: user.totalWorkouts
            };
        });
        
        // Sort by fitness index for overall ranking
        userStats.sort((a, b) => b.fitnessIndex - a.fitnessIndex);
        
        // Calculate rankings
        userStats.forEach((user, index) => {
            const rank = index + 1;
            const percentile = ((userStats.length - index) / userStats.length) * 100;
            
            rankings[user.id] = {
                overallRank: rank,
                fitnessRank: rank,
                efficiencyRank: this.getEfficiencyRank(user, userStats),
                consistencyRank: this.getConsistencyRank(user, userStats),
                totalUsers: userStats.length,
                percentile: Math.round(percentile)
            };
        });
        
        localStorage.setItem(this.RANKINGS_KEY, JSON.stringify(rankings));
        console.log('🏆 User rankings updated');
    }

    /**
     * Get efficiency ranking for user
     */
    getEfficiencyRank(user, userStats) {
        const gradeValues = { 'A+': 10, 'A': 9, 'A-': 8, 'B+': 7, 'B': 6, 'B-': 5, 'C+': 4, 'C': 3, 'C-': 2, 'D': 1, 'F': 0 };
        const sortedByEfficiency = [...userStats].sort((a, b) => 
            (gradeValues[b.efficiencyGrade] || 0) - (gradeValues[a.efficiencyGrade] || 0)
        );
        
        return sortedByEfficiency.findIndex(u => u.id === user.id) + 1;
    }

    /**
     * Get consistency ranking for user
     */
    getConsistencyRank(user, userStats) {
        const sortedByConsistency = [...userStats].sort((a, b) => b.consistency - a.consistency);
        return sortedByConsistency.findIndex(u => u.id === user.id) + 1;
    }

    /**
     * Get all users for comparison
     */
    getAllUsersForComparison() {
        const users = this.getUsers();
        return users.map(user => ({
            id: user.id,
            username: user.username,
            profile: user.profile,
            totalWorkouts: user.totalWorkouts,
            rankings: this.getUserRankings(user.id)
        }));
    }

    /**
     * Utility functions
     */
    getUsers() {
        return JSON.parse(localStorage.getItem(this.USERS_KEY) || '[]');
    }

    saveUsers(users) {
        localStorage.setItem(this.USERS_KEY, JSON.stringify(users));
    }

    generateId() {
        return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    hashPassword(password) {
        // Simple hash for demo - in production use proper hashing like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Clear all data (for testing/reset)
     */
    clearAllData() {
        localStorage.removeItem(this.USERS_KEY);
        localStorage.removeItem(this.PERFORMANCE_KEY);
        localStorage.removeItem(this.RANKINGS_KEY);
        localStorage.removeItem(this.SESSION_KEY);
        console.log('🗑️ All data cleared');
        this.initializeDefaultUsers();
    }

    /**
     * Export data for backup
     */
    exportData() {
        return {
            users: this.getUsers(),
            rankings: JSON.parse(localStorage.getItem(this.RANKINGS_KEY) || '{}'),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Import data from backup
     */
    importData(data) {
        if (data.users) {
            this.saveUsers(data.users);
        }
        if (data.rankings) {
            localStorage.setItem(this.RANKINGS_KEY, JSON.stringify(data.rankings));
        }
        console.log('📥 Data imported successfully');
    }
}

// Initialize global database instance
if (typeof window !== 'undefined') {
    window.fitnessDatabase = new FitnessDatabase();
}

// Export for Node.js environments
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FitnessDatabase;
}
