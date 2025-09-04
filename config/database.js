const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class Database {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'fitness_tracker',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        };
        this.pool = null;
        this.sqliteDb = null;
        this.dbType = 'mysql'; // Default to MySQL
        this.init();
    }

    async init() {
        try {
            // Create connection pool
            this.pool = mysql.createPool(this.config);
            
            // Test connection
            await this.testConnection();
            
            // Initialize database schema
            await this.initializeSchema();
            
            console.log('✅ Database connected and initialized');
        } catch (error) {
            console.error('❌ Database connection failed:', error.message);
            
            // Clear the failed pool
            this.pool = null;
            
            // Fallback to SQLite for development
            console.log('🔄 Falling back to SQLite for development...');
            await this.initSQLite();
        }
    }

    async testConnection() {
        const connection = await this.pool.getConnection();
        await connection.ping();
        connection.release();
    }

    async initializeSchema() {
        const queries = [
            `CREATE DATABASE IF NOT EXISTS ${this.config.database}`,
            `USE ${this.config.database}`,
            
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                profile JSON,
                role ENUM('user', 'admin') DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT true,
                total_workouts INT DEFAULT 0
            )`,
            
            // Workouts table
            `CREATE TABLE IF NOT EXISTS workouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                workout_data JSON NOT NULL,
                calories_burned INT,
                duration_minutes INT,
                workout_type VARCHAR(50),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_date (user_id, created_at)
            )`,
            
            // Performance tracking
            `CREATE TABLE IF NOT EXISTS performance_metrics (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                metric_type VARCHAR(50) NOT NULL,
                metric_value DECIMAL(10,2),
                recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_metric (user_id, metric_type, recorded_at)
            )`,
            
            // Session tracking
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (session_token),
                INDEX idx_user_expires (user_id, expires_at)
            )`
        ];

        for (const query of queries) {
            await this.pool.execute(query);
        }

        // Create default admin user
        await this.createDefaultAdmin();
    }

    async createDefaultAdmin() {
        const bcrypt = require('bcryptjs');
        const adminUsername = process.env.ADMIN_USERNAME || 'admin';
        const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
        
        try {
            const [existing] = await this.pool.execute(
                'SELECT id FROM users WHERE username = ? AND role = "admin"',
                [adminUsername]
            );

            if (existing.length === 0) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                await this.pool.execute(
                    `INSERT INTO users (username, email, password_hash, role, profile) 
                     VALUES (?, ?, ?, 'admin', ?)`,
                    [
                        adminUsername,
                        `${adminUsername}@fitness-tracker.com`,
                        hashedPassword,
                        JSON.stringify({
                            name: 'System Administrator',
                            created_by: 'system'
                        })
                    ]
                );
                console.log(`✅ Default admin user created: ${adminUsername}`);
            }
        } catch (error) {
            console.error('Failed to create default admin:', error.message);
        }
    }

    async initSQLite() {
        // SQLite fallback for development
        const sqlite3 = require('sqlite3');
        const { open } = require('sqlite');
        const bcrypt = require('bcryptjs');
        
        try {
            this.sqliteDb = await open({
                filename: './fitness_tracker.db',
                driver: sqlite3.Database
            });
            
            // Create SQLite tables
            await this.sqliteDb.exec(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    email TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    profile TEXT,
                    role TEXT DEFAULT 'user',
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    last_login DATETIME,
                    is_active BOOLEAN DEFAULT 1,
                    total_workouts INTEGER DEFAULT 0
                );
                
                CREATE TABLE IF NOT EXISTS workouts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    workout_data TEXT NOT NULL,
                    calories_burned INTEGER,
                    duration_minutes INTEGER,
                    workout_type TEXT,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                CREATE TABLE IF NOT EXISTS performance_metrics (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    metric_type TEXT NOT NULL,
                    metric_value REAL,
                    recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                CREATE TABLE IF NOT EXISTS user_sessions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    session_token TEXT NOT NULL,
                    expires_at DATETIME NOT NULL,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
            `);

            // Create default admin user
            const adminUsername = process.env.ADMIN_USERNAME || 'admin';
            const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
            
            const existing = await this.sqliteDb.get('SELECT id FROM users WHERE username = ? AND role = "admin"', [adminUsername]);
            
            if (!existing) {
                const hashedPassword = await bcrypt.hash(adminPassword, 10);
                await this.sqliteDb.run(
                    'INSERT INTO users (username, email, password_hash, role, profile) VALUES (?, ?, ?, ?, ?)',
                    [
                        adminUsername,
                        `${adminUsername}@fitness-tracker.com`,
                        hashedPassword,
                        'admin',
                        JSON.stringify({
                            name: 'System Administrator',
                            created_by: 'system'
                        })
                    ]
                );
                
                // Create demo user
                const demoPassword = await bcrypt.hash('demo123', 10);
                await this.sqliteDb.run(
                    'INSERT INTO users (username, email, password_hash, role, profile) VALUES (?, ?, ?, ?, ?)',
                    [
                        'demo',
                        'demo@example.com',
                        demoPassword,
                        'user',
                        JSON.stringify({
                            height: 175,
                            weight: 70,
                            age: 30,
                            gender: 'Male',
                            fitnessLevel: 'Intermediate',
                            metabolicRate: 1850
                        })
                    ]
                );
                
                console.log(`✅ Default users created: ${adminUsername} and demo`);
            }
            
            console.log('✅ SQLite database initialized');
        } catch (error) {
            console.error('SQLite initialization failed:', error.message);
        }
    }

    async query(sql, params = []) {
        if (this.pool) {
            const [results] = await this.pool.execute(sql, params);
            return results;
        } else if (this.sqliteDb) {
            // Handle different types of queries for SQLite
            const trimmedSql = sql.trim().toUpperCase();
            
            if (trimmedSql.startsWith('INSERT')) {
                const result = await this.sqliteDb.run(sql, params);
                return { insertId: result.lastID, affectedRows: result.changes };
            } else if (trimmedSql.startsWith('UPDATE') || trimmedSql.startsWith('DELETE')) {
                const result = await this.sqliteDb.run(sql, params);
                return { affectedRows: result.changes };
            } else {
                // SELECT queries
                return await this.sqliteDb.all(sql, params);
            }
        }
        throw new Error('No database connection available');
    }

    async close() {
        if (this.pool) {
            await this.pool.end();
        }
        if (this.sqliteDb) {
            await this.sqliteDb.close();
        }
    }
}

// Export singleton instance
const database = new Database();
module.exports = database;