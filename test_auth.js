const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3001; // Use different port for testing

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.')); // Serve static files

// Simple rate limiting for testing
const rateLimitStore = new Map();

const simpleRateLimit = (windowMs, maxRequests) => {
    return (req, res, next) => {
        const identifier = req.ip + (req.user?.userId || 'anonymous');
        const now = Date.now();
        const windowStart = now - windowMs;

        // Clean old entries
        for (let [key, timestamps] of rateLimitStore.entries()) {
            const filtered = timestamps.filter(time => time > windowStart);
            if (filtered.length === 0) {
                rateLimitStore.delete(key);
            } else {
                rateLimitStore.set(key, filtered);
            }
        }

        // Check current user's requests
        const userRequests = rateLimitStore.get(identifier) || [];
        
        if (userRequests.length >= maxRequests) {
            return res.status(429).json({
                error: 'Too many sensitive operations, please try again later.',
                retryAfter: Math.ceil((userRequests[0] + windowMs - now) / 1000)
            });
        }

        // Add current request
        userRequests.push(now);
        rateLimitStore.set(identifier, userRequests);

        next();
    };
};

// Apply rate limiting with high limits for testing
const authLimiter = simpleRateLimit(15 * 60 * 1000, 1000); // 1000 requests per 15 minutes

// Test login endpoint
app.post('/api/auth/login', authLimiter, (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password are required' });
    }

    // Simple demo authentication
    if ((username === 'demo' && password === 'demo123') || 
        (username === 'admin' && password === 'admin123')) {
        return res.json({
            message: 'Login successful',
            user: {
                username: username,
                id: 1,
                email: `${username}@example.com`
            }
        });
    }

    return res.status(401).json({ error: 'Invalid credentials' });
});

// Reset rate limits endpoint for testing
app.post('/api/dev/reset-rate-limits', (req, res) => {
    rateLimitStore.clear();
    res.json({ 
        message: 'Rate limits reset',
        timestamp: new Date().toISOString()
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: 'test-1.0.0'
    });
});

// Serve login page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'login.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🧪 Test Auth Server running on port ${PORT}`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
    console.log(`💻 API Health: http://localhost:${PORT}/api/health`);
    console.log(`🔑 Test login with demo/demo123 or admin/admin123`);
});
