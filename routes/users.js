const express = require('express');
const bcrypt = require('bcryptjs');
const { authenticateToken } = require('../middleware/auth');
const database = require('../config/database');

const router = express.Router();

// Apply authentication to all user routes
router.use(authenticateToken);

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const userId = req.user.id;

        const users = await database.query(`
            SELECT id, username, email, profile, created_at, last_login, total_workouts
            FROM users WHERE id = ?
        `, [userId]);

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];
        user.profile = user.profile ? JSON.parse(user.profile) : {};

        res.json(user);

    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Failed to fetch profile' });
    }
});

// Update user profile
router.put('/profile', async (req, res) => {
    try {
        const userId = req.user.id;
        const { profile } = req.body;

        if (!profile) {
            return res.status(400).json({ error: 'Profile data is required' });
        }

        await database.query(
            'UPDATE users SET profile = ? WHERE id = ?',
            [JSON.stringify(profile), userId]
        );

        res.json({ message: 'Profile updated successfully' });

    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});

// Change password
router.put('/password', async (req, res) => {
    try {
        const userId = req.user.id;
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ error: 'Current password and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'New password must be at least 6 characters long' });
        }

        // Get current password hash
        const users = await database.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify current password
        const passwordValid = await bcrypt.compare(currentPassword, users[0].password_hash);
        if (!passwordValid) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await database.query(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [hashedNewPassword, userId]
        );

        res.json({ message: 'Password changed successfully' });

    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Failed to change password' });
    }
});

// Delete account
router.delete('/account', async (req, res) => {
    try {
        const userId = req.user.id;
        const { password } = req.body;

        if (!password) {
            return res.status(400).json({ error: 'Password confirmation required' });
        }

        // Get current password hash
        const users = await database.query(
            'SELECT password_hash FROM users WHERE id = ?',
            [userId]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, users[0].password_hash);
        if (!passwordValid) {
            return res.status(400).json({ error: 'Password is incorrect' });
        }

        // Delete user (cascades to related data)
        await database.query('DELETE FROM users WHERE id = ?', [userId]);

        res.json({ message: 'Account deleted successfully' });

    } catch (error) {
        console.error('Delete account error:', error);
        res.status(500).json({ error: 'Failed to delete account' });
    }
});

// Get user dashboard data
router.get('/dashboard', async (req, res) => {
    try {
        const userId = req.user.id;

        // Recent workouts
        const recentWorkouts = await database.query(`
            SELECT id, workout_type, calories_burned, duration_minutes, created_at
            FROM workouts 
            WHERE user_id = ?
            ORDER BY created_at DESC
            LIMIT 5
        `, [userId]);

        // This week's stats
        const weekStats = await database.query(`
            SELECT 
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                SUM(duration_minutes) as minutes
            FROM workouts 
            WHERE user_id = ? AND WEEK(created_at) = WEEK(NOW()) AND YEAR(created_at) = YEAR(NOW())
        `, [userId]);

        // This month's stats
        const monthStats = await database.query(`
            SELECT 
                COUNT(*) as workouts,
                SUM(calories_burned) as calories,
                SUM(duration_minutes) as minutes
            FROM workouts 
            WHERE user_id = ? AND MONTH(created_at) = MONTH(NOW()) AND YEAR(created_at) = YEAR(NOW())
        `, [userId]);

        // Goals/Streaks (simplified)
        const currentStreak = await database.query(`
            SELECT COUNT(DISTINCT DATE(created_at)) as streak
            FROM workouts 
            WHERE user_id = ? AND created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
        `, [userId]);

        res.json({
            recentWorkouts,
            thisWeek: weekStats[0],
            thisMonth: monthStats[0],
            currentStreak: currentStreak[0].streak
        });

    } catch (error) {
        console.error('Get dashboard error:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard data' });
    }
});

module.exports = router;