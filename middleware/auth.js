const jwt = require('jsonwebtoken');
const database = require('../config/database');

// JWT Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid or expired token' });
        }

        try {
            // Verify user still exists and is active
            const user = await database.query(
                'SELECT id, username, email, role, is_active FROM users WHERE id = ?',
                [decoded.userId]
            );

            if (!user || user.length === 0 || !user[0].is_active) {
                return res.status(403).json({ error: 'User account not found or inactive' });
            }

            req.user = user[0];
            next();
        } catch (error) {
            console.error('Auth middleware error:', error);
            res.status(500).json({ error: 'Authentication verification failed' });
        }
    });
};

// Admin role verification middleware
const requireAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Rate limiting for sensitive operations - TEMPORARILY DISABLED FOR DEVELOPMENT
const sensitiveOperationLimit = (req, res, next) => {
    // Skip rate limiting in development
    if (process.env.NODE_ENV === 'development') {
        return next();
    }
    
    // Original rate limiting code for production
    const rateLimit = require('express-rate-limit');
    const limiter = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 50, // limit each IP to 50 requests per windowMs for sensitive operations
        message: { error: 'Too many sensitive operations, please try again later.' },
        standardHeaders: true,
        legacyHeaders: false,
    });
    
    return limiter(req, res, next);
};

module.exports = {
    authenticateToken,
    requireAdmin,
    sensitiveOperationLimit
};