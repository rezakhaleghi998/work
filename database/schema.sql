-- Comprehensive Fitness Tracker Database Schema
-- Drop existing tables if they exist (for fresh setup)
DROP TABLE IF EXISTS workout_exercises;
DROP TABLE IF EXISTS exercises;
DROP TABLE IF EXISTS workouts;
DROP TABLE IF EXISTS user_profiles;
DROP TABLE IF EXISTS user_sessions;
DROP TABLE IF EXISTS admin_users;
DROP TABLE IF EXISTS users;

-- Create Users table
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
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
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL
);

-- Create User Profiles table for detailed fitness data
CREATE TABLE user_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    profile_picture VARCHAR(255),
    bio TEXT,
    fitness_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    preferred_workout_time ENUM('morning', 'afternoon', 'evening', 'night') DEFAULT 'morning',
    workout_frequency INTEGER DEFAULT 3, -- times per week
    target_weight_kg DECIMAL(5,2),
    target_body_fat_percentage DECIMAL(4,2),
    medical_conditions TEXT,
    dietary_restrictions TEXT,
    emergency_contact_name VARCHAR(100),
    emergency_contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Admin Users table
CREATE TABLE admin_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    role ENUM('moderator', 'admin', 'super_admin') DEFAULT 'moderator',
    permissions JSON,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create User Sessions table
CREATE TABLE user_sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    session_token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Exercises table
CREATE TABLE exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(100) NOT NULL,
    category ENUM('cardio', 'strength', 'flexibility', 'balance', 'sports', 'functional') NOT NULL,
    muscle_groups JSON, -- ["chest", "triceps", "shoulders"]
    equipment_needed JSON, -- ["barbell", "bench"]
    difficulty_level ENUM('beginner', 'intermediate', 'advanced') DEFAULT 'beginner',
    instructions TEXT,
    tips TEXT,
    calories_per_minute DECIMAL(4,2),
    is_active BOOLEAN DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    FOREIGN KEY (created_by) REFERENCES users(id)
);

-- Create Workouts table
CREATE TABLE workouts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name VARCHAR(100),
    description TEXT,
    workout_date DATE NOT NULL,
    start_time TIME,
    end_time TIME,
    duration INTEGER, -- in minutes
    total_calories_burned INTEGER,
    intensity ENUM('low', 'moderate', 'high', 'very_high') DEFAULT 'moderate',
    mood_before ENUM('poor', 'fair', 'good', 'excellent'),
    mood_after ENUM('poor', 'fair', 'good', 'excellent'),
    notes TEXT,
    is_completed BOOLEAN DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create Workout Exercises table (many-to-many relationship)
CREATE TABLE workout_exercises (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    workout_id INTEGER NOT NULL,
    exercise_id INTEGER NOT NULL,
    sets INTEGER,
    reps INTEGER,
    weight_kg DECIMAL(6,2),
    distance_km DECIMAL(6,3),
    duration_minutes INTEGER,
    calories_burned INTEGER,
    rest_time_seconds INTEGER,
    notes TEXT,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (workout_id) REFERENCES workouts(id) ON DELETE CASCADE,
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_workouts_user_date ON workouts(user_id, workout_date);
CREATE INDEX idx_workouts_date ON workouts(workout_date);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_exercises_category ON exercises(category);

-- Insert default exercises
INSERT INTO exercises (name, category, muscle_groups, equipment_needed, difficulty_level, instructions, tips, calories_per_minute) VALUES
('Push-ups', 'strength', '["chest", "triceps", "shoulders"]', '["bodyweight"]', 'beginner', 'Start in plank position. Lower body until chest nearly touches floor. Push back up.', 'Keep core tight and body straight', 8.0),
('Squats', 'strength', '["quadriceps", "glutes", "hamstrings"]', '["bodyweight"]', 'beginner', 'Stand with feet shoulder-width apart. Lower body as if sitting back into chair. Return to standing.', 'Keep weight on heels and chest up', 9.0),
('Running', 'cardio', '["legs", "cardiovascular"]', '["none"]', 'beginner', 'Maintain steady pace with proper running form.', 'Start slow and gradually increase pace', 12.0),
('Plank', 'strength', '["core", "shoulders"]', '["bodyweight"]', 'beginner', 'Hold body in straight line from head to heels.', 'Engage core and breathe steadily', 5.0),
('Burpees', 'cardio', '["full body"]', '["bodyweight"]', 'intermediate', 'Squat down, jump back to plank, do push-up, jump feet to squat, jump up.', 'Maintain good form even when tired', 15.0),
('Deadlifts', 'strength', '["hamstrings", "glutes", "back"]', '["barbell"]', 'intermediate', 'Lift barbell from ground to hip level with straight back.', 'Keep bar close to body throughout movement', 10.0),
('Bench Press', 'strength', '["chest", "triceps", "shoulders"]', '["barbell", "bench"]', 'intermediate', 'Lie on bench, lower bar to chest, press up.', 'Control the weight and maintain stable position', 8.0),
('Cycling', 'cardio', '["legs", "cardiovascular"]', '["bicycle"]', 'beginner', 'Maintain steady pedaling rhythm.', 'Adjust resistance based on fitness level', 10.0),
('Mountain Climbers', 'cardio', '["core", "legs", "shoulders"]', '["bodyweight"]', 'intermediate', 'In plank position, alternately bring knees to chest quickly.', 'Keep hips level and core engaged', 12.0),
('Yoga Flow', 'flexibility', '["full body"]', '["yoga mat"]', 'beginner', 'Flow through various yoga poses with controlled breathing.', 'Focus on breath and alignment', 4.0);

-- Insert default admin user (password: admin123)
INSERT INTO users (username, email, password_hash, first_name, last_name, is_active) VALUES
('admin', 'admin@fitnesstrack.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeewRFNIqEX6A9tgm', 'Admin', 'User', 1);

-- Insert admin role
INSERT INTO admin_users (user_id, role, permissions, is_active) VALUES
(1, 'super_admin', '["all"]', 1);

-- Insert demo user (password: demo123)
INSERT INTO users (username, email, password_hash, first_name, last_name, height_cm, weight_kg, is_active) VALUES
('demo', 'demo@example.com', '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Demo', 'User', 175.0, 70.0, 1);

-- Insert demo user profile
INSERT INTO user_profiles (user_id, fitness_level, preferred_workout_time, workout_frequency, target_weight_kg) VALUES
(2, 'intermediate', 'morning', 4, 68.0);

-- Insert sample workout for demo user
INSERT INTO workouts (user_id, name, description, workout_date, duration, total_calories_burned, intensity, is_completed) VALUES
(2, 'Morning Cardio', 'Quick cardio session to start the day', '2025-09-04', 30, 250, 'moderate', 1);

-- Insert sample workout exercises
INSERT INTO workout_exercises (workout_id, exercise_id, sets, reps, duration_minutes, calories_burned) VALUES
(1, 3, 1, 0, 20, 240),  -- Running
(1, 1, 3, 15, 5, 40),   -- Push-ups
(1, 4, 3, 0, 5, 25);    -- Plank (hold for 1 minute each)
