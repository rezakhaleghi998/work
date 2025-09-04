const express = require('express');
const jwt = require('jsonwebtoken');
const router = express.Router();

// Middleware to verify token (optional for some endpoints)
const authenticateToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
        req.user = decoded;
        next();
    } catch (error) {
        res.status(400).json({ error: 'Invalid token.' });
    }
};

// Calculate calorie prediction (main fitness tracker function)
router.post('/calculate', async (req, res) => {
    try {
        const {
            age,
            gender,
            height,
            weight,
            workoutType,
            duration,
            intensity,
            fitnessLevel
        } = req.body;

        // Validate required fields
        if (!age || !gender || !height || !weight || !workoutType || !duration) {
            return res.status(400).json({
                error: 'Missing required fields: age, gender, height, weight, workoutType, duration'
            });
        }

        // Calculate BMR (Basal Metabolic Rate)
        let bmr;
        if (gender.toLowerCase() === 'male') {
            bmr = 88.362 + (13.397 * parseFloat(weight)) + (4.799 * parseFloat(height)) - (5.677 * parseInt(age));
        } else {
            bmr = 447.593 + (9.247 * parseFloat(weight)) + (3.098 * parseFloat(height)) - (4.330 * parseInt(age));
        }

        // Workout-specific calorie rates (calories per minute)
        const workoutRates = {
            'cardio': 8.5,
            'strength': 6.0,
            'yoga': 3.5,
            'running': 12.0,
            'cycling': 10.0,
            'swimming': 11.0,
            'walking': 4.0,
            'hiit': 14.0,
            'crossfit': 13.0,
            'pilates': 4.5,
            'dancing': 7.0,
            'boxing': 12.5,
            'basketball': 9.0,
            'soccer': 10.5,
            'tennis': 8.0
        };

        // Get base calorie rate
        const baseRate = workoutRates[workoutType.toLowerCase()] || 7.0;

        // Intensity multipliers
        const intensityMultipliers = {
            'low': 0.8,
            'medium': 1.0,
            'high': 1.3
        };

        // Fitness level multipliers
        const fitnessMultipliers = {
            'beginner': 0.9,
            'intermediate': 1.0,
            'advanced': 1.1
        };

        // Calculate calories
        const intensityMult = intensityMultipliers[intensity?.toLowerCase()] || 1.0;
        const fitnessMult = fitnessMultipliers[fitnessLevel?.toLowerCase()] || 1.0;
        
        // Body composition factor (BMR influence)
        const bodyFactor = Math.sqrt(bmr / 1800); // Normalized around average BMR
        
        const totalCalories = Math.round(
            baseRate * 
            parseInt(duration) * 
            intensityMult * 
            fitnessMult * 
            bodyFactor
        );

        // Calculate fitness metrics
        const fitnessIndex = calculateFitnessIndex({
            age: parseInt(age),
            gender,
            height: parseFloat(height),
            weight: parseFloat(weight),
            workoutType,
            duration: parseInt(duration),
            intensity,
            fitnessLevel,
            caloriesBurned: totalCalories
        });

        res.json({
            prediction: {
                totalCalories,
                caloriesPerMinute: Math.round(totalCalories / parseInt(duration) * 10) / 10,
                bmr: Math.round(bmr),
                workoutType,
                duration: parseInt(duration),
                intensity,
                fitnessLevel
            },
            fitnessMetrics: {
                fitnessIndex: Math.round(fitnessIndex * 10) / 10,
                efficiencyGrade: getEfficiencyGrade(fitnessIndex),
                metabolicRate: Math.round(bmr)
            },
            recommendations: generateRecommendations(fitnessIndex, workoutType, intensity)
        });

    } catch (error) {
        console.error('Calculation error:', error);
        res.status(500).json({ error: 'Server error during calculation' });
    }
});

// Helper function to calculate fitness index
function calculateFitnessIndex({ age, gender, height, weight, workoutType, duration, intensity, fitnessLevel, caloriesBurned }) {
    // BMI calculation
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    
    // BMI score (optimal around 22)
    let bmiScore = 100;
    if (bmi < 18.5) bmiScore = 70;
    else if (bmi < 25) bmiScore = 100;
    else if (bmi < 30) bmiScore = 80;
    else bmiScore = 60;

    // Age factor (peak at 25-30)
    let ageFactor = 100;
    if (age < 20) ageFactor = 85;
    else if (age <= 30) ageFactor = 100;
    else if (age <= 40) ageFactor = 95;
    else if (age <= 50) ageFactor = 85;
    else ageFactor = 75;

    // Workout intensity score
    const intensityScores = { 'low': 70, 'medium': 85, 'high': 100 };
    const intensityScore = intensityScores[intensity?.toLowerCase()] || 85;

    // Duration bonus (optimal around 45-60 minutes)
    let durationScore = 100;
    if (duration < 20) durationScore = 60;
    else if (duration <= 60) durationScore = 100;
    else if (duration <= 90) durationScore = 95;
    else durationScore = 85;

    // Fitness level factor
    const fitnessScores = { 'beginner': 70, 'intermediate': 85, 'advanced': 100 };
    const fitnessScore = fitnessScores[fitnessLevel?.toLowerCase()] || 85;

    // Calculate weighted average
    const fitnessIndex = (
        bmiScore * 0.25 +
        ageFactor * 0.15 +
        intensityScore * 0.25 +
        durationScore * 0.20 +
        fitnessScore * 0.15
    );

    return Math.min(100, Math.max(0, fitnessIndex));
}

// Helper function to get efficiency grade
function getEfficiencyGrade(fitnessIndex) {
    if (fitnessIndex >= 90) return 'A+';
    if (fitnessIndex >= 85) return 'A';
    if (fitnessIndex >= 80) return 'A-';
    if (fitnessIndex >= 75) return 'B+';
    if (fitnessIndex >= 70) return 'B';
    if (fitnessIndex >= 65) return 'B-';
    if (fitnessIndex >= 60) return 'C+';
    if (fitnessIndex >= 55) return 'C';
    return 'C-';
}

// Helper function to generate recommendations
function generateRecommendations(fitnessIndex, workoutType, intensity) {
    const recommendations = [];

    if (fitnessIndex < 70) {
        recommendations.push("Consider starting with lower intensity workouts and gradually building up");
        recommendations.push("Focus on consistency - aim for 3-4 workouts per week");
    }

    if (intensity === 'low') {
        recommendations.push("Try increasing workout intensity gradually for better results");
    }

    if (workoutType === 'cardio') {
        recommendations.push("Consider adding strength training for balanced fitness");
    } else if (workoutType === 'strength') {
        recommendations.push("Include cardio exercises to improve heart health");
    }

    if (fitnessIndex >= 85) {
        recommendations.push("Great fitness level! Consider challenging yourself with new workout types");
    }

    return recommendations;
}

// Get workout types and their calorie rates
router.get('/workout-types', (req, res) => {
    res.json({
        workoutTypes: [
            { name: 'Cardio', value: 'cardio', caloriesPerMinute: 8.5 },
            { name: 'Strength Training', value: 'strength', caloriesPerMinute: 6.0 },
            { name: 'Running', value: 'running', caloriesPerMinute: 12.0 },
            { name: 'Cycling', value: 'cycling', caloriesPerMinute: 10.0 },
            { name: 'Swimming', value: 'swimming', caloriesPerMinute: 11.0 },
            { name: 'Walking', value: 'walking', caloriesPerMinute: 4.0 },
            { name: 'HIIT', value: 'hiit', caloriesPerMinute: 14.0 },
            { name: 'CrossFit', value: 'crossfit', caloriesPerMinute: 13.0 },
            { name: 'Yoga', value: 'yoga', caloriesPerMinute: 3.5 },
            { name: 'Pilates', value: 'pilates', caloriesPerMinute: 4.5 },
            { name: 'Dancing', value: 'dancing', caloriesPerMinute: 7.0 },
            { name: 'Boxing', value: 'boxing', caloriesPerMinute: 12.5 },
            { name: 'Basketball', value: 'basketball', caloriesPerMinute: 9.0 },
            { name: 'Soccer', value: 'soccer', caloriesPerMinute: 10.5 },
            { name: 'Tennis', value: 'tennis', caloriesPerMinute: 8.0 }
        ]
    });
});

module.exports = router;
