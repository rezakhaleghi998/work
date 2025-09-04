const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class EnhancedDatabase {
    constructor() {
        this.config = {
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'fitness_tracker',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0,
            acquireTimeout: 60000,
            timeout: 60000,
            reconnect: true
        };
        this.pool = null;
        this.sqliteDb = null;
        this.dbType = 'mysql';
        this.isInitialized = false;
    }

    async init() {
        if (this.isInitialized) {
            console.log('🔄 Database already initialized, skipping...');
            return;
        }

        try {
            console.log('🔗 Attempting to connect to MySQL database...');
            
            // First try to connect without specifying database
            const tempConfig = { ...this.config };
            delete tempConfig.database;
            
            const tempPool = mysql.createPool(tempConfig);
            const connection = await tempPool.getConnection();
            
            // Create database if it doesn't exist
            await connection.execute(`CREATE DATABASE IF NOT EXISTS ${this.config.database}`);
            await connection.execute(`USE ${this.config.database}`);
            connection.release();
            await tempPool.end();
            
            // Now connect to the specific database
            this.pool = mysql.createPool(this.config);
            const testConnection = await this.pool.getConnection();
            await testConnection.ping();
            testConnection.release();
            
            console.log('✅ MySQL database connected successfully');
            this.dbType = 'mysql';
            
            await this.initializeSchema();
            this.isInitialized = true;
            
        } catch (error) {
            console.error('❌ MySQL connection failed:', error.message);
            console.log('🔄 Falling back to SQLite for development...');
            
            try {
                await this.initSQLite();
                console.log('✅ SQLite database initialized');
                this.dbType = 'sqlite';
                this.isInitialized = true;
            } catch (sqliteError) {
                console.error('❌ SQLite initialization failed:', sqliteError);
                throw new Error('Failed to initialize any database connection');
            }
        }
    }

    async initSQLite() {
        const dbPath = path.join(__dirname, '..', 'fitness_tracker.db');
        
        this.sqliteDb = await open({
            filename: dbPath,
            driver: sqlite3.Database
        });

        console.log('📄 SQLite database file:', dbPath);
        await this.initializeSQLiteSchema();
    }

    async initializeSchema() {
        if (this.dbType === 'mysql') {
            await this.createMySQLTables();
        }
    }

    async initializeSQLiteSchema() {
        await this.createSQLiteTables();
    }

    async createMySQLTables() {
        const tables = [
            // Users table
            `CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE NOT NULL,
                email VARCHAR(100) UNIQUE NOT NULL,
                password_hash VARCHAR(255) NOT NULL,
                first_name VARCHAR(50),
                last_name VARCHAR(50),
                date_of_birth DATE,
                gender ENUM('male', 'female', 'other'),
                height_cm DECIMAL(5,2),
                weight_kg DECIMAL(5,2),
                activity_level ENUM('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active') DEFAULT 'moderately_active',
                fitness_goals TEXT,
                is_active BOOLEAN DEFAULT 1,
                email_verified BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                last_login TIMESTAMP NULL,
                INDEX idx_email (email),
                INDEX idx_username (username)
            )`,

            // User profiles table
            `CREATE TABLE IF NOT EXISTS user_profiles (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                profile_picture VARCHAR(255),
                bio TEXT,
                fitness_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                preferred_workout_time ENUM('morning', 'afternoon', 'evening', 'night') DEFAULT 'morning',
                workout_frequency INT DEFAULT 3,
                target_weight_kg DECIMAL(5,2),
                target_body_fat_percentage DECIMAL(4,2),
                medical_conditions TEXT,
                dietary_restrictions TEXT,
                emergency_contact_name VARCHAR(100),
                emergency_contact_phone VARCHAR(20),
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                role ENUM('moderator', 'admin', 'super_admin') DEFAULT 'moderator',
                permissions JSON,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            // Exercises table
            `CREATE TABLE IF NOT EXISTS exercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                name VARCHAR(100) NOT NULL,
                category ENUM('cardio', 'strength', 'flexibility', 'balance', 'sports', 'functional') NOT NULL,
                muscle_groups JSON,
                equipment_needed JSON,
                difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
                instructions TEXT,
                tips TEXT,
                calories_per_minute DECIMAL(4,2),
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                created_by INT,
                FOREIGN KEY (created_by) REFERENCES users(id),
                INDEX idx_category (category)
            )`,

            // Workouts table
            `CREATE TABLE IF NOT EXISTS workouts (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                name VARCHAR(100),
                description TEXT,
                workout_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                duration_minutes INT,
                total_calories_burned INT,
                intensity ENUM('low', 'moderate', 'high', 'very_high') DEFAULT 'moderate',
                mood_before ENUM('poor', 'fair', 'good', 'excellent'),
                mood_after ENUM('poor', 'fair', 'good', 'excellent'),
                notes TEXT,
                is_completed BOOLEAN DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_user_date (user_id, workout_date),
                INDEX idx_date (workout_date)
            )`,

            // Workout exercises table
            `CREATE TABLE IF NOT EXISTS workout_exercises (
                id INT AUTO_INCREMENT PRIMARY KEY,
                workout_id INT NOT NULL,
                exercise_id INT NOT NULL,
                sets INT,
                reps INT,
                weight_kg DECIMAL(6,2),
                distance_km DECIMAL(6,3),
                duration_minutes INT,
                calories_burned INT,
                rest_time_seconds INT,
                notes TEXT,
                order_index INT DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            )`,

            // User sessions table
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                session_token VARCHAR(255) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                ip_address VARCHAR(45),
                user_agent TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_token (session_token),
                INDEX idx_user (user_id)
            )`
        ];

        for (const table of tables) {
            try {
                await this.query(table);
            } catch (error) {
                console.error('Error creating table:', error);
            }
        }

        await this.insertDefaultData();
        console.log('📋 MySQL schema initialized');
    }

    async createSQLiteTables() {
        const tables = [
            // Convert MySQL tables to SQLite
            `CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                first_name TEXT,
                last_name TEXT,
                date_of_birth DATE,
                gender TEXT CHECK(gender IN ('male', 'female', 'other')),
                height_cm REAL,
                weight_kg REAL,
                activity_level TEXT DEFAULT 'moderately_active' CHECK(activity_level IN ('sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active')),
                fitness_goals TEXT,
                is_active BOOLEAN DEFAULT 1,
                email_verified BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                last_login DATETIME
            )`,

            `CREATE TABLE IF NOT EXISTS user_profiles (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                profile_picture TEXT,
                bio TEXT,
                fitness_level TEXT DEFAULT 'beginner' CHECK(fitness_level IN ('beginner', 'intermediate', 'advanced')),
                preferred_workout_time TEXT DEFAULT 'morning' CHECK(preferred_workout_time IN ('morning', 'afternoon', 'evening', 'night')),
                workout_frequency INTEGER DEFAULT 3,
                target_weight_kg REAL,
                target_body_fat_percentage REAL,
                medical_conditions TEXT,
                dietary_restrictions TEXT,
                emergency_contact_name TEXT,
                emergency_contact_phone TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'moderator' CHECK(role IN ('moderator', 'admin', 'super_admin')),
                permissions TEXT, -- JSON stored as text
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                category TEXT NOT NULL CHECK(category IN ('cardio', 'strength', 'flexibility', 'balance', 'sports', 'functional')),
                muscle_groups TEXT, -- JSON stored as text
                equipment_needed TEXT, -- JSON stored as text
                difficulty_level TEXT DEFAULT 'beginner' CHECK(difficulty_level IN ('beginner', 'intermediate', 'advanced')),
                instructions TEXT,
                tips TEXT,
                calories_per_minute REAL,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                created_by INTEGER,
                FOREIGN KEY (created_by) REFERENCES users(id)
            )`,

            `CREATE TABLE IF NOT EXISTS workouts (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                name TEXT,
                description TEXT,
                workout_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                duration_minutes INTEGER,
                total_calories_burned INTEGER,
                intensity TEXT DEFAULT 'moderate' CHECK(intensity IN ('low', 'moderate', 'high', 'very_high')),
                mood_before TEXT CHECK(mood_before IN ('poor', 'fair', 'good', 'excellent')),
                mood_after TEXT CHECK(mood_after IN ('poor', 'fair', 'good', 'excellent')),
                notes TEXT,
                is_completed BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            `CREATE TABLE IF NOT EXISTS workout_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                sets INTEGER,
                reps INTEGER,
                weight_kg REAL,
                distance_km REAL,
                duration_minutes INTEGER,
                calories_burned INTEGER,
                rest_time_seconds INTEGER,
                notes TEXT,
                order_index INTEGER DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            )`,

            `CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT NOT NULL,
                expires_at DATETIME NOT NULL,
                ip_address TEXT,
                user_agent TEXT,
                is_active BOOLEAN DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const table of tables) {
            try {
                await this.sqliteDb.exec(table);
            } catch (error) {
                console.error('Error creating SQLite table:', error);
            }
        }

        await this.insertDefaultDataSQLite();
        console.log('📋 SQLite schema initialized');
    }

    async insertDefaultData() {
        // Insert default exercises
        const exercises = [
            ['Push-ups', 'strength', JSON.stringify(['chest', 'triceps', 'shoulders']), JSON.stringify(['bodyweight']), 'beginner', 'Start in plank position. Lower body until chest nearly touches floor. Push back up.', 'Keep core tight and body straight', 8.0],
            ['Squats', 'strength', JSON.stringify(['quadriceps', 'glutes', 'hamstrings']), JSON.stringify(['bodyweight']), 'beginner', 'Stand with feet shoulder-width apart. Lower body as if sitting back into chair. Return to standing.', 'Keep weight on heels and chest up', 9.0],
            ['Running', 'cardio', JSON.stringify(['legs', 'cardiovascular']), JSON.stringify(['none']), 'beginner', 'Maintain steady pace with proper running form.', 'Start slow and gradually increase pace', 12.0],
            ['Plank', 'strength', JSON.stringify(['core', 'shoulders']), JSON.stringify(['bodyweight']), 'beginner', 'Hold body in straight line from head to heels.', 'Engage core and breathe steadily', 5.0],
            ['Burpees', 'cardio', JSON.stringify(['full body']), JSON.stringify(['bodyweight']), 'intermediate', 'Squat down, jump back to plank, do push-up, jump feet to squat, jump up.', 'Maintain good form even when tired', 15.0]
        ];

        const checkExercise = 'SELECT COUNT(*) as count FROM exercises WHERE name = ?';
        const insertExercise = 'INSERT INTO exercises (name, category, muscle_groups, equipment_needed, difficulty_level, instructions, tips, calories_per_minute) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';

        for (const exercise of exercises) {
            try {
                const [rows] = await this.query(checkExercise, [exercise[0]]);
                if (rows[0].count === 0) {
                    await this.query(insertExercise, exercise);
                }
            } catch (error) {
                console.error('Error inserting exercise:', exercise[0], error);
            }
        }

        // Insert default admin user (password: admin123)
        const adminExists = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
        const [adminRows] = await this.query(adminExists, ['admin']);
        
        if (adminRows[0].count === 0) {
            const insertAdmin = 'INSERT INTO users (username, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?)';
            const result = await this.query(insertAdmin, [
                'admin', 
                'admin@fitnesstrack.com', 
                '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeewRFNIqEX6A9tgm', 
                'Admin', 
                'User', 
                1
            ]);

            // Insert admin role
            const insertAdminRole = 'INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES (?, ?, ?, ?)';
            await this.query(insertAdminRole, [result[0].insertId, 'super_admin', JSON.stringify(['all']), 1]);
        }

        // Insert demo user (password: demo123)
        const demoExists = 'SELECT COUNT(*) as count FROM users WHERE username = ?';
        const [demoRows] = await this.query(demoExists, ['demo']);
        
        if (demoRows[0].count === 0) {
            const insertDemo = 'INSERT INTO users (username, email, password_hash, first_name, last_name, height_cm, weight_kg, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)';
            await this.query(insertDemo, [
                'demo', 
                'demo@example.com', 
                '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 
                'Demo', 
                'User', 
                175.0, 
                70.0, 
                1
            ]);
        }
    }

    async insertDefaultDataSQLite() {
        // Similar to insertDefaultData but for SQLite
        const exercises = [
            ['Push-ups', 'strength', '["chest", "triceps", "shoulders"]', '["bodyweight"]', 'beginner', 'Start in plank position. Lower body until chest nearly touches floor. Push back up.', 'Keep core tight and body straight', 8.0],
            ['Squats', 'strength', '["quadriceps", "glutes", "hamstrings"]', '["bodyweight"]', 'beginner', 'Stand with feet shoulder-width apart. Lower body as if sitting back into chair. Return to standing.', 'Keep weight on heels and chest up', 9.0],
            ['Running', 'cardio', '["legs", "cardiovascular"]', '["none"]', 'beginner', 'Maintain steady pace with proper running form.', 'Start slow and gradually increase pace', 12.0],
            ['Plank', 'strength', '["core", "shoulders"]', '["bodyweight"]', 'beginner', 'Hold body in straight line from head to heels.', 'Engage core and breathe steadily', 5.0],
            ['Burpees', 'cardio', '["full body"]', '["bodyweight"]', 'intermediate', 'Squat down, jump back to plank, do push-up, jump feet to squat, jump up.', 'Maintain good form even when tired', 15.0]
        ];

        for (const exercise of exercises) {
            try {
                const checkResult = await this.sqliteDb.get('SELECT COUNT(*) as count FROM exercises WHERE name = ?', [exercise[0]]);
                if (checkResult.count === 0) {
                    await this.sqliteDb.run('INSERT INTO exercises (name, category, muscle_groups, equipment_needed, difficulty_level, instructions, tips, calories_per_minute) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', exercise);
                }
            } catch (error) {
                console.error('Error inserting SQLite exercise:', exercise[0], error);
            }
        }

        // Insert admin and demo users for SQLite
        try {
            const adminExists = await this.sqliteDb.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['admin']);
            if (adminExists.count === 0) {
                const adminResult = await this.sqliteDb.run('INSERT INTO users (username, email, password_hash, first_name, last_name, is_active) VALUES (?, ?, ?, ?, ?, ?)', [
                    'admin', 'admin@fitnesstrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeewRFNIqEX6A9tgm', 'Admin', 'User', 1
                ]);

                await this.sqliteDb.run('INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES (?, ?, ?, ?)', [
                    adminResult.lastID, 'super_admin', '["all"]', 1
                ]);
            }

            const demoExists = await this.sqliteDb.get('SELECT COUNT(*) as count FROM users WHERE username = ?', ['demo']);
            if (demoExists.count === 0) {
                await this.sqliteDb.run('INSERT INTO users (username, email, password_hash, first_name, last_name, height_cm, weight_kg, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', [
                    'demo', 'demo@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', 175.0, 70.0, 1
                ]);
            }
        } catch (error) {
            console.error('Error inserting default SQLite users:', error);
        }
    }

    async query(sql, params = []) {
        if (this.dbType === 'mysql') {
            return await this.pool.execute(sql, params);
        } else if (this.dbType === 'sqlite') {
            if (sql.toLowerCase().includes('select')) {
                return [await this.sqliteDb.all(sql, params)];
            } else {
                const result = await this.sqliteDb.run(sql, params);
                return [{ insertId: result.lastID, affectedRows: result.changes }];
            }
        }
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
const database = new EnhancedDatabase();

module.exports = {
    query: (sql, params) => database.query(sql, params),
    close: () => database.close(),
    dbType: () => database.dbType
};
