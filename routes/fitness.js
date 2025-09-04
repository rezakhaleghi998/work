const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Apply authentication to all fitness routes
router.use(authenticateToken);

// Save workout data
router.post('/workouts', async (req, res) => {
    try {
        const { workoutData, caloriesBurned, duration, workoutType } = req.body;
        const userId = req.user.id;

        // Validate required fields
        if (!workoutData || !caloriesBurned) {
            return res.status(400).json({ error: 'Workout data and calories burned are required' });
        }

        // Save workout
        const result = await database.query(`
            INSERT INTO workouts (user_id, workout_data, calories_burned, duration_minutes, workout_type)
            VALUES (?, ?, ?, ?, ?)
        `, [userId, JSON.stringify(workoutData), caloriesBurned, duration, workoutType]);

        // Update user's total workout count
        await database.query(
            'UPDATE users SET total_workouts = total_workouts + 1 WHERE id = ?',
            [userId]
        );

        res.status(201).json({
            message: 'Workout saved successfully',
            workoutId: result.insertId
        });

    } catch (error) {
        console.error('Save workout error:', error);
        res.status(500).json({ error: 'Failed to save workout' });
    }
});

// Get user's workout history
router.get('/workouts', async (req, res) => {
    try {
        const userId = req.user.id;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 20;
        const offset = (page - 1) * limit;

        const workouts = await database.query(`
            SELECT id, workout_data, calories_burned, duration_minutes, workout_type, created_at
            FROM workouts 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT ? OFFSET ?
        `, [userId, limit, offset]);

        // Parse workout data
        const parsedWorkouts = workouts.map(workout => ({
            ...workout,
            workout_data: workout.workout_data ? JSON.parse(workout.workout_data) : {}
        }));

        // Get total count
        const totalResult = await database.query(
            'SELECT COUNT(*) as total FROM workouts WHERE user_id = ?',
            [userId]
        );
        const total = totalResult[0].total;

        res.json({
            workouts: parsedWorkouts,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalWorkouts: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get workouts error:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Get workout statistics
router.get('/statistics', async (req, res) => {
    try {
        const userId = req.user.id;
        const timeframe = req.query.timeframe || '30'; // days

        const stats = {};

        // Basic stats
        const basicStats = await database.query(`
            SELECT 
                COUNT(*) as totalWorkouts,
                SUM(calories_burned) as totalCalories,
                AVG(calories_burned) as avgCalories,
                SUM(duration_minutes) as totalDuration,
                AVG(duration_minutes) as avgDuration,
                MAX(calories_burned) as maxCalories
            FROM workouts 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `, [userId, timeframe]);
        stats.overview = basicStats[0];

        // Workout types distribution
        const workoutTypes = await database.query(`
            SELECT workout_type, COUNT(*) as count, SUM(calories_burned) as totalCalories
            FROM workouts 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
            GROUP BY workout_type
            ORDER BY count DESC
        `, [userId, timeframe]);
        stats.workoutTypes = workoutTypes;

        // Daily activity (last 30 days)
        const dailyActivity = await database.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as workouts,
                SUM(calories_burned) as calories
            FROM workouts 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date DESC
        `, [userId]);
        stats.dailyActivity = dailyActivity;

        // Weekly progress
        const weeklyProgress = await database.query(`
            SELECT 
                WEEK(created_at) as week,
                YEAR(created_at) as year,
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                AVG(duration_minutes) as avgDuration
            FROM workouts 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 12 WEEK)
            GROUP BY YEAR(created_at), WEEK(created_at)
            ORDER BY year DESC, week DESC
        `, [userId]);
        stats.weeklyProgress = weeklyProgress;

        res.json(stats);

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Save performance metrics
router.post('/metrics', async (req, res) => {
    try {
        const { metricType, metricValue } = req.body;
        const userId = req.user.id;

        if (!metricType || metricValue === undefined) {
            return res.status(400).json({ error: 'Metric type and value are required' });
        }

        await database.query(`
            INSERT INTO performance_metrics (user_id, metric_type, metric_value)
            VALUES (?, ?, ?)
        `, [userId, metricType, metricValue]);

        res.status(201).json({ message: 'Metric saved successfully' });

    } catch (error) {
        console.error('Save metric error:', error);
        res.status(500).json({ error: 'Failed to save metric' });
    }
});

// Get performance metrics
router.get('/metrics', async (req, res) => {
    try {
        const userId = req.user.id;
        const metricType = req.query.type;
        const days = parseInt(req.query.days) || 30;

        let query = `
            SELECT metric_type, metric_value, recorded_at
            FROM performance_metrics 
            WHERE user_id = ? AND recorded_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
        `;
        const params = [userId, days];

        if (metricType) {
            query += ' AND metric_type = ?';
            params.push(metricType);
        }

        query += ' ORDER BY recorded_at DESC';

        const metrics = await database.query(query, params);
        res.json(metrics);

    } catch (error) {
        console.error('Get metrics error:', error);
        res.status(500).json({ error: 'Failed to fetch metrics' });
    }
});

// Delete workout
router.delete('/workouts/:id', async (req, res) => {
    try {
        const workoutId = req.params.id;
        const userId = req.user.id;

        // Verify ownership
        const workout = await database.query(
            'SELECT id FROM workouts WHERE id = ? AND user_id = ?',
            [workoutId, userId]
        );

        if (!workout || workout.length === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        // Delete workout
        await database.query('DELETE FROM workouts WHERE id = ?', [workoutId]);

        // Update user's total workout count
        await database.query(
            'UPDATE users SET total_workouts = GREATEST(total_workouts - 1, 0) WHERE id = ?',
            [userId]
        );

        res.json({ message: 'Workout deleted successfully' });

    } catch (error) {
        console.error('Delete workout error:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

module.exports = router;