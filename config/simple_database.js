const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');
const fs = require('fs').promises;

class SimpleDatabase {
    constructor() {
        this.db = null;
        this.dbPath = path.join(__dirname, '..', 'fitness_tracker.db');
    }

    async init() {
        try {
            console.log('🔗 Initializing SQLite database...');
            
            this.db = await open({
                filename: this.dbPath,
                driver: sqlite3.Database
            });

            await this.createTables();
            await this.insertDefaultData();
            
            console.log('✅ Database initialized successfully');
            console.log('📄 Database file:', this.dbPath);
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            throw error;
        }
    }

    async createTables() {
        const tableCreationQueries = [
            // Users table
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

            // User profiles table
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

            // Admin users table
            `CREATE TABLE IF NOT EXISTS admin_users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                role TEXT DEFAULT 'admin',
                permissions TEXT DEFAULT '["users", "workouts", "exercises"]',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                is_active INTEGER DEFAULT 1,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`,

            // Exercises table
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

            // Workouts table
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
            )`,

            // Workout exercises table
            `CREATE TABLE IF NOT EXISTS workout_exercises (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                workout_id INTEGER NOT NULL,
                exercise_id INTEGER NOT NULL,
                sets INTEGER DEFAULT 1,
                reps INTEGER,
                weight_kg REAL,
                duration_minutes INTEGER,
                distance_km REAL,
                calories_burned REAL,
                notes TEXT,
                order_in_workout INTEGER DEFAULT 1,
                FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
                FOREIGN KEY (exercise_id) REFERENCES exercises(id)
            )`,

            // User sessions table
            `CREATE TABLE IF NOT EXISTS user_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                session_token TEXT UNIQUE NOT NULL,
                expires_at DATETIME NOT NULL,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
            )`
        ];

        for (const query of tableCreationQueries) {
            await this.db.exec(query);
        }

        // Create indexes
        const indexes = [
            `CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`,
            `CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`,
            `CREATE INDEX IF NOT EXISTS idx_workouts_user_id ON workouts(user_id)`,
            `CREATE INDEX IF NOT EXISTS idx_workouts_date ON workouts(workout_date)`,
            `CREATE INDEX IF NOT EXISTS idx_workout_exercises_workout_id ON workout_exercises(workout_id)`,
            `CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token)`
        ];

        for (const index of indexes) {
            await this.db.exec(index);
        }
    }

    async insertDefaultData() {
        // Check if we already have data
        try {
            const userCount = await this.db.get('SELECT COUNT(*) as count FROM users');
            if (userCount.count > 0) {
                console.log('📊 Default data already exists, skipping insertion');
                return;
            }
        } catch (error) {
            console.log('📊 No users table yet, continuing with data insertion...');
        }

        try {
            // Default admin user (password: admin123)
            const bcrypt = require('bcryptjs');
            const adminPassword = await bcrypt.hash('admin123', 12);

            await this.db.run(`
                INSERT INTO users (username, email, password_hash, first_name, last_name, is_active)
                VALUES (?, ?, ?, ?, ?, ?)
            `, ['admin', 'admin@fitness.local', adminPassword, 'Admin', 'User', 1]);

            const adminUserId = (await this.db.get('SELECT last_insert_rowid() as id')).id;

            // Make user admin
            await this.db.run(`
                INSERT INTO admin_users (user_id, role, permissions, is_active)
                VALUES (?, ?, ?, ?)
            `, [adminUserId, 'admin', JSON.stringify(['users', 'workouts', 'exercises', 'analytics']), 1]);

            // Default exercises
            const exercises = [
                {
                    name: 'Push-ups',
                    category: 'strength',
                    muscle_groups: JSON.stringify(['chest', 'shoulders', 'triceps']),
                    equipment_needed: JSON.stringify(['none']),
                    difficulty_level: 'beginner',
                    instructions: 'Start in plank position, lower body to ground, push back up',
                    tips: 'Keep your core tight and maintain straight line from head to toe',
                    calories_per_minute: 7
                },
                {
                    name: 'Squats',
                    category: 'strength',
                    muscle_groups: JSON.stringify(['quadriceps', 'glutes', 'hamstrings']),
                    equipment_needed: JSON.stringify(['none']),
                    difficulty_level: 'beginner',
                    instructions: 'Stand with feet shoulder-width apart, lower hips back and down, return to standing',
                    tips: 'Keep chest up and weight in your heels',
                    calories_per_minute: 8
                },
                {
                    name: 'Running',
                    category: 'cardio',
                    muscle_groups: JSON.stringify(['legs', 'cardiovascular']),
                    equipment_needed: JSON.stringify(['none']),
                    difficulty_level: 'intermediate',
                    instructions: 'Maintain steady pace, breathe rhythmically',
                    tips: 'Start slow and gradually increase pace',
                    calories_per_minute: 12
                },
                {
                    name: 'Plank',
                    category: 'strength',
                    muscle_groups: JSON.stringify(['core', 'shoulders']),
                    equipment_needed: JSON.stringify(['none']),
                    difficulty_level: 'beginner',
                    instructions: 'Hold plank position with straight body line',
                    tips: 'Engage core and avoid sagging hips',
                    calories_per_minute: 5
                },
                {
                    name: 'Jumping Jacks',
                    category: 'cardio',
                    muscle_groups: JSON.stringify(['full body']),
                    equipment_needed: JSON.stringify(['none']),
                    difficulty_level: 'beginner',
                    instructions: 'Jump while spreading legs and raising arms overhead',
                    tips: 'Land softly and maintain rhythm',
                    calories_per_minute: 10
                }
            ];

            for (const exercise of exercises) {
                await this.db.run(`
                    INSERT INTO exercises (
                        name, category, muscle_groups, equipment_needed,
                        difficulty_level, instructions, tips, calories_per_minute, created_by
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `, [
                    exercise.name,
                    exercise.category,
                    exercise.muscle_groups,
                    exercise.equipment_needed,
                    exercise.difficulty_level,
                    exercise.instructions,
                    exercise.tips,
                    exercise.calories_per_minute,
                    adminUserId
                ]);
            }

            console.log('📊 Default data inserted successfully');
            console.log('👤 Admin credentials: admin / admin123');
        } catch (error) {
            console.error('❌ Error inserting default data:', error);
            // Don't throw, just log the error
        }
    }

    async query(sql, params = []) {
        if (!this.db) {
            throw new Error('Database not initialized');
        }

        try {
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
        } catch (error) {
            console.error('Database query error:', error);
            throw error;
        }
    }

    async close() {
        if (this.db) {
            await this.db.close();
            this.db = null;
        }
    }
}

// Create singleton instance
const database = new SimpleDatabase();

module.exports = {
    init: () => database.init(),
    query: (sql, params) => database.query(sql, params),
    close: () => database.close()
};
