const express = require('express');
const jwt = require('jsonwebtoken');
const PerformanceMetric = require('../models/PerformanceMetric');
const UserRanking = require('../models/UserRanking');
const router = express.Router();

// Middleware to verify token
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Save performance metrics
router.post('/', authenticateToken, async (req, res) => {
    try {
        const {
            fitnessIndex,
            consistencyScore,
            performanceScore,
            varietyScore,
            intensityScore,
            weeklyChange,
            monthlyChange,
            workoutData,
            caloriesPredicted,
            workoutType,
            duration
        } = req.body;

        // Handle demo user
        if (req.user.userId === 'demo') {
            return res.json({
                message: 'Demo metrics saved (simulation)',
                metric: {
                    id: Date.now(),
                    fitnessIndex,
                    consistencyScore,
                    performanceScore,
                    varietyScore,
                    intensityScore,
                    caloriesPredicted,
                    workoutType,
                    recordedAt: new Date()
                }
            });
        }

        const metric = await PerformanceMetric.create({
            userId: req.user.userId,
            fitnessIndex: parseFloat(fitnessIndex),
            consistencyScore: consistencyScore ? parseFloat(consistencyScore) : null,
            performanceScore: performanceScore ? parseFloat(performanceScore) : null,
            varietyScore: varietyScore ? parseFloat(varietyScore) : null,
            intensityScore: intensityScore ? parseFloat(intensityScore) : null,
            weeklyChange: weeklyChange ? parseFloat(weeklyChange) : null,
            monthlyChange: monthlyChange ? parseFloat(monthlyChange) : null,
            workoutData: workoutData || null,
            caloriesPredicted: caloriesPredicted ? parseFloat(caloriesPredicted) : null,
            workoutType: workoutType || null,
            duration: duration ? parseInt(duration) : null
        });

        // Update user ranking (simplified calculation)
        await updateUserRanking(req.user.userId, fitnessIndex);

        res.status(201).json({
            message: 'Performance metrics saved successfully',
            metric
        });
    } catch (error) {
        console.error('Save metrics error:', error);
        res.status(500).json({ error: 'Server error while saving metrics' });
    }
});

// Get user's recent metrics
router.get('/', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === 'demo') {
            return res.json({
                metrics: [
                    {
                        id: 1,
                        fitnessIndex: 85.5,
                        consistencyScore: 90,
                        performanceScore: 82,
                        varietyScore: 88,
                        intensityScore: 83,
                        recordedAt: new Date(),
                        workoutType: 'Cardio + Strength',
                        caloriesPredicted: 450
                    }
                ]
            });
        }

        const metrics = await PerformanceMetric.findAll({
            where: { userId: req.user.userId },
            order: [['recorded_at', 'DESC']],
            limit: 20
        });

        res.json({ metrics });
    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user ranking
router.get('/ranking', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === 'demo') {
            return res.json({
                ranking: {
                    overallRank: 15,
                    totalUsers: 100,
                    percentile: 85,
                    category: 'Intermediate',
                    categoryRank: 8
                }
            });
        }

        const ranking = await UserRanking.findOne({
            where: { userId: req.user.userId }
        });

        if (!ranking) {
            return res.json({
                ranking: {
                    overallRank: null,
                    totalUsers: 0,
                    percentile: null,
                    category: 'New User',
                    categoryRank: null
                }
            });
        }

        res.json({ ranking });
    } catch (error) {
        console.error('Get ranking error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Helper function to update user ranking
async function updateUserRanking(userId, fitnessIndex) {
    try {
        // Simple ranking calculation
        const totalUsers = await PerformanceMetric.count({
            distinct: true,
            col: 'userId'
        });

        const betterUsers = await PerformanceMetric.count({
            where: {
                fitnessIndex: {
                    $gt: fitnessIndex
                }
            },
            distinct: true,
            col: 'userId'
        });

        const rank = betterUsers + 1;
        const percentile = totalUsers > 0 ? ((totalUsers - rank + 1) / totalUsers) * 100 : 0;

        let category = 'Beginner';
        if (fitnessIndex >= 80) category = 'Advanced';
        else if (fitnessIndex >= 60) category = 'Intermediate';

        await UserRanking.upsert({
            userId,
            overallRank: rank,
            totalUsers,
            percentile,
            category,
            categoryRank: rank
        });
    } catch (error) {
        console.error('Update ranking error:', error);
    }
}

module.exports = router;
