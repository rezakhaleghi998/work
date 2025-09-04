const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Apply authentication to all admin routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users with pagination
router.get('/users', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const offset = (page - 1) * limit;

        // Get users with pagination
        const users = await database.query(`
            SELECT id, username, email, role, created_at, last_login, is_active, total_workouts,
                   JSON_EXTRACT(profile, '$.name') as name,
                   JSON_EXTRACT(profile, '$.age') as age,
                   JSON_EXTRACT(profile, '$.gender') as gender
            FROM users 
            ORDER BY created_at DESC 
            LIMIT ? OFFSET ?
        `, [limit, offset]);

        // Get total count
        const totalResult = await database.query('SELECT COUNT(*) as total FROM users');
        const total = totalResult[0].total;

        res.json({
            users,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(total / limit),
                totalUsers: total,
                hasNext: page * limit < total,
                hasPrev: page > 1
            }
        });

    } catch (error) {
        console.error('Get users error:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// Get user details by ID
router.get('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user details
        const users = await database.query(`
            SELECT id, username, email, role, profile, created_at, last_login, is_active, total_workouts
            FROM users WHERE id = ?
        `, [userId]);

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        user.profile = user.profile ? JSON.parse(user.profile) : {};

        // Get recent workouts
        const workouts = await database.query(`
            SELECT id, workout_data, calories_burned, duration_minutes, workout_type, created_at
            FROM workouts WHERE user_id = ? 
            ORDER BY created_at DESC LIMIT 10
        `, [userId]);

        // Parse workout data
        const parsedWorkouts = workouts.map(workout => ({
            ...workout,
            workout_data: workout.workout_data ? JSON.parse(workout.workout_data) : {}
        }));

        res.json({
            user,
            recentWorkouts: parsedWorkouts
        });

    } catch (error) {
        console.error('Get user details error:', error);
        res.status(500).json({ error: 'Failed to fetch user details' });
    }
});

// Update user
router.put('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;
        const { username, email, role, profile, is_active } = req.body;

        // Check if user exists
        const existingUsers = await database.query('SELECT id FROM users WHERE id = ?', [userId]);
        if (!existingUsers || existingUsers.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user
        await database.query(`
            UPDATE users 
            SET username = ?, email = ?, role = ?, profile = ?, is_active = ?
            WHERE id = ?
        `, [username, email, role, JSON.stringify(profile), is_active, userId]);

        res.json({ message: 'User updated successfully' });

    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// Delete user
router.delete('/users/:id', async (req, res) => {
    try {
        const userId = req.params.id;

        // Prevent admin from deleting themselves
        if (parseInt(userId) === req.user.id) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Delete user (cascades to workouts due to foreign key)
        const result = await database.query('DELETE FROM users WHERE id = ?', [userId]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ message: 'User deleted successfully' });

    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});

// Get system statistics
router.get('/statistics', async (req, res) => {
    try {
        const stats = {};

        // User statistics
        const userStats = await database.query(`
            SELECT 
                COUNT(*) as totalUsers,
                SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as activeUsers,
                SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as adminUsers,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as newUsersToday
            FROM users
        `);
        stats.users = userStats[0];

        // Workout statistics
        const workoutStats = await database.query(`
            SELECT 
                COUNT(*) as totalWorkouts,
                SUM(CASE WHEN DATE(created_at) = CURDATE() THEN 1 ELSE 0 END) as workoutsToday,
                AVG(calories_burned) as avgCalories,
                AVG(duration_minutes) as avgDuration
            FROM workouts
        `);
        stats.workouts = workoutStats[0];

        // Recent activity
        const recentActivity = await database.query(`
            SELECT u.username, w.workout_type, w.calories_burned, w.created_at
            FROM workouts w
            JOIN users u ON w.user_id = u.id
            ORDER BY w.created_at DESC
            LIMIT 10
        `);
        stats.recentActivity = recentActivity;

        // Top users by workout count
        const topUsers = await database.query(`
            SELECT u.username, u.total_workouts, u.last_login
            FROM users u
            WHERE u.role = 'user'
            ORDER BY u.total_workouts DESC
            LIMIT 5
        `);
        stats.topUsers = topUsers;

        res.json(stats);

    } catch (error) {
        console.error('Get statistics error:', error);
        res.status(500).json({ error: 'Failed to fetch statistics' });
    }
});

// Search users
router.get('/search/users', async (req, res) => {
    try {
        const { q, role, active } = req.query;

        let query = 'SELECT id, username, email, role, created_at, last_login, is_active FROM users WHERE 1=1';
        const params = [];

        if (q) {
            query += ' AND (username LIKE ? OR email LIKE ?)';
            params.push(`%${q}%`, `%${q}%`);
        }

        if (role) {
            query += ' AND role = ?';
            params.push(role);
        }

        if (active !== undefined) {
            query += ' AND is_active = ?';
            params.push(active === 'true' ? 1 : 0);
        }

        query += ' ORDER BY created_at DESC LIMIT 100';

        const users = await database.query(query, params);
        res.json(users);

    } catch (error) {
        console.error('Search users error:', error);
        res.status(500).json({ error: 'Search failed' });
    }
});

// Export user data (for GDPR compliance)
router.get('/users/:id/export', async (req, res) => {
    try {
        const userId = req.params.id;

        // Get user data
        const users = await database.query(`
            SELECT username, email, profile, created_at, last_login, total_workouts
            FROM users WHERE id = ?
        `, [userId]);

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Get all workouts
        const workouts = await database.query(`
            SELECT workout_data, calories_burned, duration_minutes, workout_type, created_at
            FROM workouts WHERE user_id = ?
            ORDER BY created_at DESC
        `, [userId]);

        const exportData = {
            user: users[0],
            workouts: workouts.map(w => ({
                ...w,
                workout_data: w.workout_data ? JSON.parse(w.workout_data) : {}
            })),
            exportedAt: new Date().toISOString()
        };

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="user-${userId}-data.json"`);
        res.json(exportData);

    } catch (error) {
        console.error('Export user data error:', error);
        res.status(500).json({ error: 'Failed to export user data' });
    }
});

module.exports = router;