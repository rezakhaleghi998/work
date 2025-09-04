const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const database = require('../config/database');
const { sensitiveOperationLimit } = require('../middleware/auth');

const router = express.Router();

// User Registration
router.post('/register', sensitiveOperationLimit, async (req, res) => {
    try {
        const { username, email, password, profile } = req.body;

        // Validation
        if (!username || !email || !password) {
            return res.status(400).json({ error: 'Username, email, and password are required' });
        }

        if (password.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Check if user already exists
        const existingUser = await database.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUser && existingUser.length > 0) {
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const result = await database.query(
            `INSERT INTO users (username, email, password_hash, profile) VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, JSON.stringify(profile || {})]
        );

        res.status(201).json({
            message: 'User created successfully',
            userId: result.insertId
        });

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Registration failed' });
    }
});

// User Login
router.post('/login', sensitiveOperationLimit, async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user
        const users = await database.query(
            'SELECT id, username, email, password_hash, role, profile, is_active FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (!users || users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        if (!user.is_active) {
            return res.status(403).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const passwordValid = await bcrypt.compare(password, user.password_hash);
        if (!passwordValid) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await database.query(
            'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?',
            [user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { 
                userId: user.id, 
                username: user.username, 
                role: user.role 
            },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profile: user.profile ? JSON.parse(user.profile) : {}
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Login failed' });
    }
});

// Token Verification
router.post('/verify', async (req, res) => {
    try {
        const { token } = req.body;

        if (!token) {
            return res.status(400).json({ error: 'Token required' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Get updated user info
        const users = await database.query(
            'SELECT id, username, email, role, profile, is_active FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (!users || users.length === 0 || !users[0].is_active) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        const user = users[0];

        res.json({
            valid: true,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role,
                profile: user.profile ? JSON.parse(user.profile) : {}
            }
        });

    } catch (error) {
        res.status(401).json({ error: 'Invalid token', valid: false });
    }
});

// Password Reset (simplified version)
router.post('/reset-password', sensitiveOperationLimit, async (req, res) => {
    try {
        const { email, newPassword } = req.body;

        if (!email || !newPassword) {
            return res.status(400).json({ error: 'Email and new password are required' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters long' });
        }

        // Find user by email
        const users = await database.query(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (!users || users.length === 0) {
            return res.status(404).json({ error: 'Email not found' });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update password
        await database.query(
            'UPDATE users SET password_hash = ? WHERE email = ?',
            [hashedPassword, email]
        );

        res.json({ message: 'Password reset successful' });

    } catch (error) {
        console.error('Password reset error:', error);
        res.status(500).json({ error: 'Password reset failed' });
    }
});

module.exports = router;