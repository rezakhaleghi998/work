const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
const { init } = require('./config/simple_database');
const logger = require('./utils/logger');

require('dotenv').config();

const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/enhanced_admin');
const fitnessRoutes = require('./routes/fitness');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize application
async function initializeApp() {
    try {
        // Initialize database
        logger.info('Initializing database...');
        await init();
        logger.success('Database initialized successfully');

        // Security middleware
        app.use(helmet({
            contentSecurityPolicy: false // Disabled for development
        }));

        // Rate limiting
        const limiter = rateLimit({
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: 100, // limit each IP to 100 requests per windowMs
            message: 'Too many requests from this IP, please try again later.'
        });
        app.use('/api/', limiter);

        // CORS configuration
        app.use(cors({
            origin: process.env.NODE_ENV === 'production' 
                ? ['https://your-domain.com'] 
                : ['http://localhost:3000', 'http://127.0.0.1:3000'],
            credentials: true
        }));

        // Body parsing middleware
        app.use(express.json({ limit: '10mb' }));
        app.use(express.urlencoded({ extended: true, limit: '10mb' }));

        // Serve static files
        app.use(express.static(path.join(__dirname, 'public')));
        app.use('/js', express.static(path.join(__dirname, 'js')));
        app.use('/css', express.static(path.join(__dirname, 'css')));

        // API Routes
        app.use('/api/auth', authRoutes);
        app.use('/api/admin', adminRoutes);
        app.use('/api/fitness', fitnessRoutes);
        app.use('/api/users', userRoutes);

        // Health check endpoint
        app.get('/api/health', (req, res) => {
            res.json({ 
                status: 'healthy', 
                timestamp: new Date().toISOString(),
                uptime: process.uptime(),
                environment: process.env.NODE_ENV || 'development'
            });
        });

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

        // Test pages
        app.get('/test', (req, res) => {
            res.sendFile(path.join(__dirname, 'test_app.html'));
        });

        app.get('/api-test', (req, res) => {
            res.sendFile(path.join(__dirname, 'api_test.html'));
        });

        // 404 handler
        app.use('*', (req, res) => {
            res.status(404).json({ 
                error: 'Route not found',
                path: req.originalUrl,
                method: req.method
            });
        });

        // Global error handler
        app.use((err, req, res, next) => {
            logger.error('Unhandled error:', err);
            
            res.status(err.status || 500).json({
                error: process.env.NODE_ENV === 'production' 
                    ? 'Internal server error' 
                    : err.message,
                ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
            });
        });

        // Start server
        const server = app.listen(PORT, () => {
            logger.success(`🚀 Fitness Tracker Server running on port ${PORT}`);
            logger.info(`📊 Admin Dashboard: http://localhost:${PORT}/admin`);
            logger.info(`🏃 Main App: http://localhost:${PORT}/`);
            logger.info(`🔑 Login: http://localhost:${PORT}/login`);
            logger.info(`🩺 Health Check: http://localhost:${PORT}/api/health`);
            logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
        });

        // Graceful shutdown handling
        process.on('SIGTERM', () => {
            logger.info('SIGTERM received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        process.on('SIGINT', () => {
            logger.info('SIGINT received, shutting down gracefully');
            server.close(() => {
                logger.info('Process terminated');
                process.exit(0);
            });
        });

        // Handle uncaught exceptions
        process.on('uncaughtException', (err) => {
            logger.error('Uncaught Exception:', err);
            process.exit(1);
        });

        process.on('unhandledRejection', (reason, promise) => {
            logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });

    } catch (error) {
        logger.error('Failed to initialize application:', error);
        process.exit(1);
    }
}

// Initialize and start the application
initializeApp();

module.exports = app;
