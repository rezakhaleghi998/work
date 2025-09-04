const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

class DatabaseManager {
    constructor() {
        this.db = null;
        this.dbType = 'sqlite'; // Default to SQLite
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) {
            console.log('🔄 Database already initialized');
            return;
        }

        // Try different database connections in order of preference
        if (process.env.DB_HOST) {
            await this.tryMySQL();
        } else if (process.env.DATABASE_URL) {
            await this.tryPostgreSQL();
        } else {
            await this.initSQLite();
        }

        this.isInitialized = true;
    }

    async tryMySQL() {
        try {
            console.log('🔗 Attempting MySQL connection...');
            
            const config = {
                host: process.env.DB_HOST,
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER,
                password: process.env.DB_PASSWORD,
                database: process.env.DB_NAME || 'fitness_tracker',
                waitForConnections: true,
                connectionLimit: 10,
                queueLimit: 0
            };

            // Create connection pool
            this.db = mysql.createPool(config);
            
            // Test connection
            const connection = await this.db.getConnection();
            await connection.ping();
            connection.release();

            console.log('✅ MySQL connected successfully');
            this.dbType = 'mysql';
            
            await this.createMySQLTables();
            await this.insertDefaultMySQLData();

        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.log('🔄 Falling back to SQLite...');
            await this.initSQLite();
        }
    }

    async tryPostgreSQL() {
        try {
            console.log('🔗 Attempting PostgreSQL connection...');
            
            // For services like Railway, Render that provide DATABASE_URL
            const { Pool } = require('pg');
            this.db = new Pool({
                connectionString: process.env.DATABASE_URL,
                ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
            });

            // Test connection
            const client = await this.db.connect();
            await client.query('SELECT NOW()');
            client.release();

            console.log('✅ PostgreSQL connected successfully');
            this.dbType = 'postgresql';
            
            await this.createPostgreSQLTables();
            await this.insertDefaultPostgreSQLData();

        } catch (error) {
            console.error('❌ PostgreSQL connection failed:', error.message);
            console.log('🔄 Falling back to SQLite...');
            await this.initSQLite();
        }
    }

    async initSQLite() {
        try {
            console.log('🔗 Initializing SQLite database...');
            
            const dbPath = path.join(__dirname, '..', 'fitness_tracker.db');
            this.db = await open({
                filename: dbPath,
                driver: sqlite3.Database
            });

            console.log('✅ SQLite database initialized');
            console.log('📄 Database file:', dbPath);
            this.dbType = 'sqlite';
            
            await this.createSQLiteTables();
            await this.insertDefaultSQLiteData();

        } catch (error) {
            console.error('❌ SQLite initialization failed:', error);
            throw error;
        }
    }

    async createMySQLTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) DEFAULT '',
                last_name VARCHAR(50) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                is_active BOOLEAN DEFAULT TRUE
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                age INT,
                gender ENUM('Male', 'Female', 'Other'),
                height_cm INT,
                weight_kg DECIMAL(5,2),
                fitness_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                goals TEXT,
                medical_conditions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            
            `CREATE TABLE IF NOT EXISTS exercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category ENUM('cardio', 'strength', 'flexibility', 'sports') NOT NULL,
                muscle_groups JSON,
                equipment_needed JSON,
                difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                instructions TEXT,
                tips TEXT,
                calories_per_minute DECIMAL(5,2) DEFAULT 0,
                created_by INT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS workouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100),
                description TEXT,
                workout_date DATE,
                duration_minutes INT,
                intensity ENUM('low', 'medium', 'high'),
                total_calories_burned DECIMAL(7,2),
                notes TEXT,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const table of tables) {
            await this.db.execute(table);
        }
    }

    async createPostgreSQLTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(50) DEFAULT '',
                last_name VARCHAR(50) DEFAULT '',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                last_login TIMESTAMP,
                is_active BOOLEAN DEFAULT TRUE
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                age INTEGER,
                gender VARCHAR(10),
                height_cm INTEGER,
                weight_kg DECIMAL(5,2),
                fitness_level VARCHAR(20) DEFAULT 'beginner',
                goals TEXT,
                medical_conditions TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS exercises (
                id SERIAL PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category VARCHAR(20) NOT NULL,
                muscle_groups JSONB DEFAULT '[]',
                equipment_needed JSONB DEFAULT '[]',
                difficulty_level VARCHAR(20) DEFAULT 'beginner',
                instructions TEXT,
                tips TEXT,
                calories_per_minute DECIMAL(5,2) DEFAULT 0,
                created_by INTEGER REFERENCES users(id),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`,
            
            `CREATE TABLE IF NOT EXISTS workouts (
                id SERIAL PRIMARY KEY,
                user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                name VARCHAR(100),
                description TEXT,
                workout_date DATE,
                duration_minutes INTEGER,
                intensity VARCHAR(10),
                total_calories_burned DECIMAL(7,2),
                notes TEXT,
                is_completed BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`
        ];

        for (const table of tables) {
            await this.db.query(table);
        }
    }

    async createSQLiteTables() {
        const tables = [
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT DEFAULT '',
                last_name TEXT DEFAULT '',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME,
                is_active INTEGER DEFAULT 1
            )`,
            
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                age INTEGER,
                gender TEXT,
                height_cm INTEGER,
                weight_kg REAL,
                fitness_level TEXT DEFAULT 'beginner',
                goals TEXT,
                medical_conditions TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,
            
            `CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL,
                muscle_groups TEXT DEFAULT '[]',
                equipment_needed TEXT DEFAULT '[]',
                difficulty_level TEXT DEFAULT 'beginner',
                instructions TEXT,
                tips TEXT,
                calories_per_minute REAL DEFAULT 0,
                created_by INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,
            
            `CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT,
                description TEXT,
                workout_date DATE,
                duration_minutes INTEGER,
                intensity TEXT CHECK (intensity IN ('low', 'medium', 'high')),
                total_calories_burned REAL,
                notes TEXT,
                is_completed INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const table of tables) {
            await this.db.exec(table);
        }
    }

    async insertDefaultMySQLData() {
        // Check if admin user exists
        const [users] = await this.db.execute('SELECT COUNT(*) as count FROM users');
        if (users[0].count > 0) return;

        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 12);

        await this.db.execute(`
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'admin@fitness.local', adminPassword, 'Admin', 'User']);

        console.log('✅ Default MySQL data created');
        console.log('👤 Admin credentials: admin / admin123');
    }

    async insertDefaultPostgreSQLData() {
        // Check if admin user exists
        const result = await this.db.query('SELECT COUNT(*) as count FROM users');
        if (result.rows[0].count > 0) return;

        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 12);

        await this.db.query(`
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES ($1, $2, $3, $4, $5)
        `, ['admin', 'admin@fitness.local', adminPassword, 'Admin', 'User']);

        console.log('✅ Default PostgreSQL data created');
        console.log('👤 Admin credentials: admin / admin123');
    }

    async insertDefaultSQLiteData() {
        // Check if admin user exists
        const result = await this.db.get('SELECT COUNT(*) as count FROM users');
        if (result.count > 0) return;

        const bcrypt = require('bcryptjs');
        const adminPassword = await bcrypt.hash('admin123', 12);

        await this.db.run(`
            INSERT INTO users (username, email, password_hash, first_name, last_name)
            VALUES (?, ?, ?, ?, ?)
        `, ['admin', 'admin@fitness.local', adminPassword, 'Admin', 'User']);

        console.log('✅ Default SQLite data created');
        console.log('👤 Admin credentials: admin / admin123');
    }

    async query(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
            if (this.dbType === 'mysql') {
                const [rows] = await this.db.execute(sql, params);
                return [rows];
            } else if (this.dbType === 'postgresql') {
                // Convert ? placeholders to $1, $2, etc. for PostgreSQL
                let pgSql = sql;
                let pgParams = params;
                if (params.length > 0) {
                    pgSql = sql.replace(/\?/g, (match, offset, string) => {
                        const index = string.substring(0, offset).split('?').length;
                        return `$${index}`;
                    });
                }
                const result = await this.db.query(pgSql, pgParams);
                return [result.rows];
            } else {
                // SQLite
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    const rows = await this.db.all(sql, params);
                    return [rows];
                } else if (sql.trim().toUpperCase().startsWith('INSERT')) {
                    const result = await this.db.run(sql, params);
                    return [{ insertId: result.lastID, affectedRows: result.changes }];
                } else {
                    const result = await this.db.run(sql, params);
                    return [{ affectedRows: result.changes }];
                }
            }
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async close() {
        if (this.db) {
            if (this.dbType === 'sqlite') {
                await this.db.close();
            } else if (this.dbType === 'mysql') {
                await this.db.end();
            } else if (this.dbType === 'postgresql') {
                await this.db.end();
            }
            this.db = null;
        }
    }
}

// Create singleton instance
const dbManager = new DatabaseManager();

module.exports = {
    init: () => dbManager.init(),
    query: (sql, params) => dbManager.query(sql, params),
    close: () => dbManager.close(),
    getDbType: () => dbManager.dbType
};
