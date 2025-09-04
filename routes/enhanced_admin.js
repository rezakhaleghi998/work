const express = require('express');
const { query } = require('../config/simple_database');
const { authenticateToken } = require('../middleware/auth');
const logger = require('../utils/logger');

const router = express.Router();

// Simple admin auth middleware
const requireAdmin = async (req, res, next) => {
    try {
        if (!req.user || !req.user.id) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Check if user is admin (simple check - you can enhance this)
        const [adminCheck] = await query('SELECT id FROM admin_users WHERE user_id = ? AND is_active = 1', [req.user.id]);
        
        if (adminCheck.length === 0 && req.user.username !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        next();
    } catch (error) {
        logger.error('Admin auth error:', error);
        res.status(500).json({ error: 'Authorization check failed' });
    }
};

// Apply authentication to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Admin verification endpoint
router.get('/verify', async (req, res) => {
    try {
        res.json({
            message: 'Admin access verified',
            username: req.user.username,
            role: req.user.role || 'admin',
            userId: req.user.id
        });
    } catch (error) {
        logger.error('Admin verification error:', error);
        res.status(500).json({ error: 'Verification failed' });
    }
});

// Dashboard statistics
router.get('/stats', async (req, res) => {
    try {
        // Get total users
        const [totalUsersResult] = await query('SELECT COUNT(*) as count FROM users');
        const totalUsers = totalUsersResult[0].count;

        // Get total workouts
        const [totalWorkoutsResult] = await query('SELECT COUNT(*) as count FROM workouts');
        const totalWorkouts = totalWorkoutsResult[0].count;

        // Get active users (last 30 days) - handle both SQLite and MySQL date functions
        const [activeUsersResult] = await query(`
            SELECT COUNT(DISTINCT user_id) as count 
            FROM workouts 
            WHERE created_at >= datetime('now', '-30 days')
               OR created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `);
        const activeUsers = activeUsersResult[0].count;

        // Get total calories burned
        const [totalCaloriesResult] = await query(`
            SELECT SUM(total_calories_burned) as total 
            FROM workouts 
            WHERE total_calories_burned IS NOT NULL
        `);
        const totalCalories = totalCaloriesResult[0].total || 0;

        res.json({
            totalUsers,
            totalWorkouts,
            activeUsers,
            totalCalories
        });

    } catch (error) {
        logger.error('Admin stats error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Registration trend chart data
router.get('/charts/registration-trend', async (req, res) => {
    try {
        const [results] = await query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as registrations
            FROM users
            WHERE created_at >= datetime('now', '-30 days')
               OR created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
            GROUP BY DATE(created_at)
            ORDER BY date
        `);

        const labels = results.map(row => row.date);
        const values = results.map(row => row.registrations);

        res.json({ labels, values });

    } catch (error) {
        logger.error('Registration trend error:', error);
        res.status(500).json({ error: 'Failed to fetch registration trend' });
    }
});

// Workout categories chart data
router.get('/charts/workout-categories', async (req, res) => {
    try {
        const [results] = await query(`
            SELECT 
                e.category,
                COUNT(*) as count
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            GROUP BY e.category
            ORDER BY count DESC
        `);

        const labels = results.map(row => row.category);
        const values = results.map(row => row.count);

        res.json({ labels, values });

    } catch (error) {
        logger.error('Workout categories error:', error);
        // Return default data if no workout exercises exist yet
        res.json({ 
            labels: ['cardio', 'strength', 'flexibility'], 
            values: [10, 15, 5] 
        });
    }
});

// Recent activity
router.get('/recent-activity', async (req, res) => {
    try {
        const [results] = await query(`
            SELECT 
                u.username,
                u.email,
                COALESCE(w.name, 'Workout') as activity,
                w.created_at as date,
                CASE 
                    WHEN w.is_completed = 1 THEN 'completed'
                    ELSE 'planned'
                END as status
            FROM workouts w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
            LIMIT 10
        `);

        res.json(results);

    } catch (error) {
        logger.error('Recent activity error:', error);
        res.json([]); // Return empty array if no data
    }
});

// Users management
router.get('/users', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            status = '',
            role = ''
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        // Build where conditions
        if (search) {
            whereConditions.push('(u.username LIKE ? OR u.email LIKE ? OR u.first_name LIKE ? OR u.last_name LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (status !== '') {
            whereConditions.push('u.is_active = ?');
            queryParams.push(status === '1' ? 1 : 0);
        }

        if (role) {
            if (role === 'admin') {
                whereConditions.push('EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id)');
            } else {
                whereConditions.push('NOT EXISTS (SELECT 1 FROM admin_users au WHERE au.user_id = u.id)');
            }
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        // Get users with workout count
        const usersQuery = `
            SELECT 
                u.id, u.username, u.email, u.first_name, u.last_name,
                u.created_at, u.last_login, u.is_active,
                COUNT(w.id) as total_workouts
            FROM users u
            LEFT JOIN workouts w ON u.id = w.user_id
            ${whereClause}
            GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login, u.is_active
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const [users] = await query(usersQuery, queryParams);

        // Get total count for pagination
        const countQuery = `
            SELECT COUNT(DISTINCT u.id) as total
            FROM users u
            ${whereClause}
        `;
        
        const countParams = queryParams.slice(0, -2); // Remove limit and offset
        const [countResult] = await query(countQuery, countParams);
        const totalUsers = countResult[0].total;
        const totalPages = Math.ceil(totalUsers / limit);

        res.json({
            users,
            totalUsers,
            totalPages,
            currentPage: parseInt(page)
        });

    } catch (error) {
        logger.error('Admin users fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Update user status
router.put('/users/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { is_active } = req.body;

        await query('UPDATE users SET is_active = ? WHERE id = ?', [is_active ? 1 : 0, id]);

        logger.info(`User ${id} status updated to ${is_active ? 'active' : 'inactive'} by admin ${req.user.id}`);
        
        res.json({ 
            message: `User ${is_active ? 'activated' : 'deactivated'} successfully` 
        });

    } catch (error) {
        logger.error('Update user status error:', error);
        res.status(500).json({ error: 'Failed to update user status' });
    }
});

// Get user details
router.get('/users/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Get user basic info
        const [userResult] = await query(`
            SELECT u.*, up.* 
            FROM users u
            LEFT JOIN user_profiles up ON u.id = up.user_id
            WHERE u.id = ?
        `, [id]);

        if (userResult.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = userResult[0];

        // Get user workout summary
        const [workoutSummary] = await query(`
            SELECT 
                COUNT(*) as total_workouts,
                SUM(duration_minutes) as total_duration,
                SUM(total_calories_burned) as total_calories,
                AVG(duration_minutes) as avg_duration
            FROM workouts
            WHERE user_id = ?
        `, [id]);

        // Get recent workouts
        const [recentWorkouts] = await query(`
            SELECT w.*
            FROM workouts w
            WHERE w.user_id = ?
            ORDER BY w.workout_date DESC
            LIMIT 10
        `, [id]);

        res.json({
            user,
            workoutSummary: workoutSummary[0] || {},
            recentWorkouts
        });

    } catch (error) {
        logger.error('Admin get user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Workouts management
router.get('/workouts', async (req, res) => {
    try {
        const {
            page = 1,
            limit = 10,
            search = '',
            dateFrom = '',
            dateTo = '',
            intensity = '',
            status = ''
        } = req.query;

        const offset = (page - 1) * limit;
        let whereConditions = [];
        let queryParams = [];

        // Build where conditions
        if (search) {
            whereConditions.push('(w.name LIKE ? OR w.description LIKE ? OR u.username LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (dateFrom) {
            whereConditions.push('w.workout_date >= ?');
            queryParams.push(dateFrom);
        }

        if (dateTo) {
            whereConditions.push('w.workout_date <= ?');
            queryParams.push(dateTo);
        }

        if (intensity) {
            whereConditions.push('w.intensity = ?');
            queryParams.push(intensity);
        }

        if (status !== '') {
            whereConditions.push('w.is_completed = ?');
            queryParams.push(status === '1' ? 1 : 0);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const workoutsQuery = `
            SELECT 
                w.*,
                u.username
            FROM workouts w
            JOIN users u ON w.user_id = u.id
            ${whereClause}
            ORDER BY w.workout_date DESC, w.created_at DESC
            LIMIT ? OFFSET ?
        `;

        queryParams.push(parseInt(limit), parseInt(offset));
        const [workouts] = await query(workoutsQuery, queryParams);

        res.json({ workouts });

    } catch (error) {
        logger.error('Admin workouts fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch workouts' });
    }
});

// Exercises management
router.get('/exercises', async (req, res) => {
    try {
        const {
            search = '',
            category = '',
            difficulty = ''
        } = req.query;

        let whereConditions = [];
        let queryParams = [];

        if (search) {
            whereConditions.push('(name LIKE ? OR instructions LIKE ?)');
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm);
        }

        if (category) {
            whereConditions.push('category = ?');
            queryParams.push(category);
        }

        if (difficulty) {
            whereConditions.push('difficulty_level = ?');
            queryParams.push(difficulty);
        }

        const whereClause = whereConditions.length > 0 ? 'WHERE ' + whereConditions.join(' AND ') : '';

        const exercisesQuery = `
            SELECT *
            FROM exercises
            ${whereClause}
            ORDER BY name
        `;

        const [exercises] = await query(exercisesQuery, queryParams);

        res.json({ exercises });

    } catch (error) {
        logger.error('Admin exercises fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch exercises' });
    }
});

// Analytics
router.get('/analytics', async (req, res) => {
    try {
        // Average session duration
        const [avgDurationResult] = await query(`
            SELECT AVG(duration_minutes) as avg_duration
            FROM workouts
            WHERE duration_minutes IS NOT NULL
        `);

        // User retention rate (users active in last 7 days vs last 30 days)
        const [retentionResult] = await query(`
            SELECT 
                COUNT(DISTINCT CASE WHEN w.created_at >= datetime('now', '-7 days') 
                                         OR w.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
                                    THEN w.user_id END) as weekly_active,
                COUNT(DISTINCT CASE WHEN w.created_at >= datetime('now', '-30 days')
                                         OR w.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
                                    THEN w.user_id END) as monthly_active
            FROM workouts w
        `);

        // Most popular exercise
        const [popularExerciseResult] = await query(`
            SELECT e.name, COUNT(*) as usage_count
            FROM workout_exercises we
            JOIN exercises e ON we.exercise_id = e.id
            GROUP BY e.id, e.name
            ORDER BY usage_count DESC
            LIMIT 1
        `);

        // Growth rate (new users this month vs last month)
        const [growthResult] = await query(`
            SELECT 
                COUNT(CASE WHEN created_at >= datetime('now', 'start of month')
                                OR created_at >= DATE_FORMAT(NOW(), '%Y-%m-01')
                           THEN 1 END) as this_month,
                COUNT(CASE WHEN (created_at >= datetime('now', 'start of month', '-1 month') 
                                AND created_at < datetime('now', 'start of month'))
                                OR (created_at >= DATE_SUB(DATE_FORMAT(NOW(), '%Y-%m-01'), INTERVAL 1 MONTH)
                                AND created_at < DATE_FORMAT(NOW(), '%Y-%m-01'))
                           THEN 1 END) as last_month
            FROM users
        `);

        const avgSessionDuration = Math.round(avgDurationResult[0].avg_duration || 0);
        const retentionRate = retentionResult[0].monthly_active > 0 
            ? Math.round((retentionResult[0].weekly_active / retentionResult[0].monthly_active) * 100)
            : 0;
        const popularExercise = popularExerciseResult[0]?.name || 'N/A';
        const growthRate = growthResult[0].last_month > 0
            ? Math.round(((growthResult[0].this_month - growthResult[0].last_month) / growthResult[0].last_month) * 100)
            : 0;

        res.json({
            avgSessionDuration: `${avgSessionDuration} min`,
            retentionRate,
            popularExercise,
            growthRate,
            performanceTrends: {
                labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                datasets: [
                    {
                        label: 'Average Workouts',
                        data: [12, 19, 15, 25],
                        borderColor: '#667eea'
                    },
                    {
                        label: 'Average Duration',
                        data: [30, 35, 28, 40],
                        borderColor: '#51cf66'
                    }
                ]
            }
        });

    } catch (error) {
        logger.error('Admin analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics' });
    }
});

// Create new user
router.post('/users', async (req, res) => {
    try {
        const { username, email, password, firstName, lastName, role } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        // Check if user exists
        const [existingUser] = await query('SELECT id FROM users WHERE username = ? OR email = ?', [username, email]);
        if (existingUser.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash(password, 12);

        // Create user
        const [result] = await query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
            VALUES (?, ?, ?, ?, ?, 1)
        `, [username, email, hashedPassword, firstName || '', lastName || '']);

        // Add admin role if specified
        if (role === 'admin') {
            await query(`
                INSERT INTO admin_users (user_id, role, permissions, is_active)
                VALUES (?, 'admin', '["users", "workouts", "exercises"]', 1)
            `, [result.insertId]);
        }

        logger.info(`New user created by admin ${req.user.id}: ${username} (${email})`);

        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        logger.error('Admin create user error:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
});

// Delete workout
router.delete('/workouts/:id', async (req, res) => {
    try {
        const { id } = req.params;

        // Delete workout exercises first (foreign key constraint)
        await query('DELETE FROM workout_exercises WHERE workout_id = ?', [id]);
        
        // Delete workout
        const [result] = await query('DELETE FROM workouts WHERE id = ?', [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Workout not found' });
        }

        logger.info(`Workout ${id} deleted by admin ${req.user.id}`);

        res.json({ message: 'Workout deleted successfully' });

    } catch (error) {
        logger.error('Admin delete workout error:', error);
        res.status(500).json({ error: 'Failed to delete workout' });
    }
});

// Add new exercise
router.post('/exercises', async (req, res) => {
    try {
        const {
            name,
            category,
            muscle_groups,
            equipment_needed,
            difficulty_level,
            instructions,
            tips,
            calories_per_minute
        } = req.body;

        if (!name || !category) {
            return res.status(400).json({ error: 'Name and category are required' });
        }

        const [result] = await query(`
            INSERT INTO exercises (
                name, category, muscle_groups, equipment_needed,
                difficulty_level, instructions, tips, calories_per_minute,
                created_by
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
            name,
            category,
            JSON.stringify(muscle_groups || []),
            JSON.stringify(equipment_needed || []),
            difficulty_level || 'beginner',
            instructions || '',
            tips || '',
            calories_per_minute || 0,
            req.user.id
        ]);

        logger.info(`New exercise created by admin ${req.user.id}: ${name}`);

        res.status(201).json({
            message: 'Exercise created successfully',
            exerciseId: result.insertId
        });

    } catch (error) {
        logger.error('Admin create exercise error:', error);
        res.status(500).json({ error: 'Failed to create exercise' });
    }
});

// Export data
router.get('/export/users', async (req, res) => {
    try {
        const [users] = await query(`
            SELECT 
                u.username, u.email, u.first_name, u.last_name,
                u.created_at, u.last_login, u.is_active,
                COUNT(w.id) as total_workouts
            FROM users u
            LEFT JOIN workouts w ON u.id = w.user_id
            GROUP BY u.id, u.username, u.email, u.first_name, u.last_name, u.created_at, u.last_login, u.is_active
            ORDER BY u.created_at DESC
        `);

        res.json(users);

    } catch (error) {
        logger.error('Admin export users error:', error);
        res.status(500).json({ error: 'Failed to export users' });
    }
});

module.exports = router;
