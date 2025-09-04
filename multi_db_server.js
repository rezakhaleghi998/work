const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { init, getDbType } = require('./config/multi_database');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const fitnessRoutes = require('./routes/fitness');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database before starting server
async function startServer() {
    try {
        console.log('🚀 Starting Fitness Tracker Server...');
        
        // Initialize database (will try MySQL, PostgreSQL, then SQLite)
        await init();
        console.log(`📊 Database Type: ${getDbType().toUpperCase()}`);

        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: false
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000,
            max: 100,
            message: 'Too many requests from this IP, please try again later.'
        });
        app.use('/api/', limiter);

        // CORS configuration
        app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? process.env.FRONTEND_URL || true
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        }));

        // Body parsing middleware
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Serve static files
        app.use(express.static(path.join(__dirname)));
        app.use('/js', express.static(path.join(__dirname, 'js')));
        app.use('/css', express.static(path.join(__dirname, 'css')));

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development',
                database: getDbType()
            });
        });

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/fitness', fitnessRoutes);
        app.use('/api/users', userRoutes);

        // Serve main application pages
        app.get('/', (req, res) => {
            res.sendFile(path.join(__dirname, 'professional_fitness_tracker.html'));
        });

        app.get('/login', (req, res) => {
            res.sendFile(path.join(__dirname, 'login.html'));
        });

        app.get('/admin', (req, res) => {
            res.sendFile(path.join(__dirname, 'admin-dashboard.html'));
        });

        app.get('/test', (req, res) => {
            res.sendFile(path.join(__dirname, 'test_app.html'));
        });

        app.get('/api-test', (req, res) => {
            res.sendFile(path.join(__dirname, 'api_test.html'));
        });

        // 404 handler
        app.use((req, res) => {
            res.status(404).json({ 
                error: 'Route not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        // Global error handler
        app.use((err, req, res, next) => {
            console.error('Unhandled error:', err);
            
            res.status(err.status || 500).json({
                error: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : err.message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });

        // Start server
        const server = app.listen(PORT, '0.0.0.0', () => {
            console.log(`✅ Fitness Tracker Server running on port ${PORT}`);
            console.log(`🌐 Frontend: http://localhost:${PORT}`);
            console.log(`🔧 Admin Panel: http://localhost:${PORT}/admin`);
            console.log(`💻 API Health: http://localhost:${PORT}/api/health`);
            console.log(`📊 Database: ${getDbType().toUpperCase()}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            console.log('🛑 Shutting down server...');
            server.close(() => {
                console.log('✅ Server closed');
                process.exit(0);
            });
        };

        process.on('SIGTERM', shutdown);
        process.on('SIGINT', shutdown);

    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Start the server
startServer();

module.exports = app;
