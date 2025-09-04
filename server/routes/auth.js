const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const router = express.Router();

// Register
router.post('/register', [
    body('username').isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, email, password, firstName, lastName, height, weight, age, gender } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({
            where: {
                $or: [{ email }, { username }]
            }
        });

        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create user
        const user = await User.create({
            username,
            email,
            password: hashedPassword,
            firstName,
            lastName,
            height: height ? parseFloat(height) : null,
            weight: weight ? parseFloat(weight) : null,
            age: age ? parseInt(age) : null,
            gender
        });

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        // Update last login
        await user.update({ lastLogin: new Date() });

        res.status(201).json({
            message: 'User registered successfully',
            token,
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
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration' });
    }
});

// Login
router.post('/login', [
    body('username').notEmpty().withMessage('Username is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { username, password } = req.body;

        // Check for demo account
        if (username === 'demo' && password === 'demo123') {
            return res.json({
                message: 'Demo login successful',
                token: jwt.sign(
                    { userId: 'demo', username: 'demo' },
                    process.env.JWT_SECRET || 'fallback-secret',
                    { expiresIn: '7d' }
                ),
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

        // Find user
        const user = await User.findOne({
            where: {
                $or: [{ username }, { email: username }]
            }
        });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, username: user.username },
            process.env.JWT_SECRET || 'fallback-secret',
            { expiresIn: '7d' }
        );

        // Update last login
        await user.update({ lastLogin: new Date() });

        res.json({
            message: 'Login successful',
            token,
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
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login' });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        
        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        
        if (decoded.userId === 'demo') {
            return res.json({
                user: {
                    id: 'demo',
                    username: 'demo',
                    email: 'demo@fitness.app',
                    firstName: 'Demo',
                    lastName: 'User'
                }
            });
        }

        const user = await User.findByPk(decoded.userId);
        if (!user) {
            return res.status(401).json({ error: 'User not found' });
        }

        res.json({
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
        console.error('Token verification error:', error);
        res.status(401).json({ error: 'Invalid token' });
    }
});

module.exports = router;
