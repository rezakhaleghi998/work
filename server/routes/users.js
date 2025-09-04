const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const PerformanceMetric = require('../models/PerformanceMetric');
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

// Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === 'demo') {
            return res.json({
                user: {
                    id: 'demo',
                    username: 'demo',
                    email: 'demo@fitness.app',
                    firstName: 'Demo',
                    lastName: 'User',
                    height: 175,
                    weight: 70,
                    age: 30,
                    gender: 'Male'
                }
            });
        }

        const user = await User.findByPk(req.user.userId, {
            attributes: { exclude: ['password'] }
        });

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
    try {
        if (req.user.userId === 'demo') {
            return res.json({
                message: 'Demo profile updated (simulation)',
                user: {
                    id: 'demo',
                    username: 'demo',
                    ...req.body
                }
            });
        }

        const { firstName, lastName, height, weight, age, gender } = req.body;
        
        const user = await User.findByPk(req.user.userId);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await user.update({
            firstName,
            lastName,
            height: height ? parseFloat(height) : user.height,
            weight: weight ? parseFloat(weight) : user.weight,
            age: age ? parseInt(age) : user.age,
            gender: gender || user.gender
        });

        res.json({
            message: 'Profile updated successfully',
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                firstName: user.firstName,
                lastName: user.lastName,
                height: user.height,
                weight: user.weight,
                age: user.age,
                gender: user.gender
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get user's performance history
router.get('/performance', authenticateToken, async (req, res) => {
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
            limit: 50
        });

        res.json({ metrics });
    } catch (error) {
        console.error('Get performance error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
