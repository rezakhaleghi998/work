# Enhanced Multi-Output Fitness Predictor with Ultimate AI Integration + Smart Recommendations v3.0
# enhanced_fitness_predictor.py

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import traceback
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, r2_score
import math
from typing import Dict, List, Any, Optional
from datetime import datetime

# Import Ultimate Fitness AI for enhanced recommendations
try:
    from ultimate_fitness_ai import UltimateFitnessAI, get_ultimate_fitness_recommendations
    ULTIMATE_AI_AVAILABLE = True
    print("✅ Ultimate Fitness AI (30/30 + BERT4Rec) loaded!")
except ImportError:
    ULTIMATE_AI_AVAILABLE = False
    print("⚠️ Ultimate Fitness AI not available, using standard predictions")

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Enhanced Smart Recommendations Engine - Integrated into existing API
class SmartRecommendationsEngine:
    """
    Enhanced Smart Recommendations Engine integrated into your existing fitness tracker.
    Provides detailed water, nutrition, WHO guidelines, and performance recommendations.
    """
    
    def __init__(self):
        # WHO and nutrition guidelines
        self.WHO_WATER_INTAKE = {
            'male': 3700,  # ml per day
            'female': 2700  # ml per day
        }
        
        self.WHO_PHYSICAL_ACTIVITY = {
            'moderate_intensity_minutes_per_week': 150,
            'vigorous_intensity_minutes_per_week': 75,
            'strength_training_days_per_week': 2
        }
        
        # Macronutrient ratios for different goals
        self.MACRO_RATIOS = {
            'weight_loss': {'carbs': 0.35, 'protein': 0.35, 'fat': 0.30},
            'muscle_gain': {'carbs': 0.45, 'protein': 0.30, 'fat': 0.25},
            'endurance': {'carbs': 0.55, 'protein': 0.20, 'fat': 0.25},
            'general_fitness': {'carbs': 0.45, 'protein': 0.25, 'fat': 0.30}
        }
    
    def generate_smart_recommendations(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Generate comprehensive smart recommendations based on user data and predictions."""
        
        # Enhanced recommendations
        recommendations = {
            'water_intake_detailed': self._calculate_detailed_hydration(user_data, predictions),
            'macro_nutrition_breakdown': self._calculate_nutrition_breakdown(user_data, predictions),
            'foods_to_avoid': self._get_foods_to_avoid(user_data),
            'who_guidelines_compliance': self._assess_who_guidelines(user_data, predictions),
            'pre_post_workout_advice': self._get_workout_timing_advice(user_data, predictions),
            'performance_improvement_tips': self._get_performance_tips(user_data, predictions),
            'timestamp': datetime.now().isoformat()
        }
        
        return recommendations
    
    def _calculate_detailed_hydration(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Calculate detailed hydration recommendations."""
        
        gender = user_data.get('Gender', 'Male').lower()
        base_needs = self.WHO_WATER_INTAKE.get(gender, 3000)
        
        # Additional needs based on workout
        duration_hours = user_data.get('Workout Duration (mins)', 30) / 60
        intensity = user_data.get('Workout Intensity', 'Medium').lower()
        
        intensity_multiplier = {'low': 400, 'medium': 600, 'high': 800}.get(intensity, 600)
        exercise_water = duration_hours * intensity_multiplier
        
        # Heart rate based sweat rate
        hr = user_data.get('Heart Rate (bpm)', 140)
        resting_hr = user_data.get('Resting Heart Rate (bpm)', 70)
        sweat_rate = 500 * (hr / resting_hr) if resting_hr > 0 else 500
        
        # Sleep dehydration recovery
        sleep_hours = user_data.get('Sleep Hours', 8)
        sleep_dehydration = max(0, (8 - sleep_hours) * 100)
        
        total_needs = min(base_needs + exercise_water + sweat_rate + sleep_dehydration, 5000)
        current_intake = user_data.get('water_intake_today_ml', 1000)
        
        return {
            'total_daily_needs_ml': round(total_needs),
            'current_intake_ml': current_intake,
            'remaining_needs_ml': max(0, round(total_needs - current_intake)),
            'hydration_status': self._get_hydration_status(current_intake, total_needs),
            'pre_workout_ml': 500,
            'during_workout_ml': round(duration_hours * 600),
            'post_workout_ml': round(predictions.get('calories_burned', 300) * 1.5),
            'hourly_target_ml': round(total_needs / 16),  # Over 16 waking hours
            'hydration_tips': [
                "Monitor urine color - pale yellow is ideal",
                "Add electrolytes for workouts >60 minutes",
                "Drink 500ml 2-3 hours before workout",
                "Avoid excessive intake (>1L per hour)"
            ]
        }
    
    def _calculate_nutrition_breakdown(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Calculate detailed macro nutrition breakdown."""
        
        # Calculate BMR and TDEE
        age = user_data.get('Age', 30)
        gender = user_data.get('Gender', 'Male').lower()
        weight = user_data.get('Weight (kg)', 70)
        height = user_data.get('Height (cm)', 170)
        
        # BMR calculation
        if gender == 'male':
            bmr = 10 * weight + 6.25 * height - 5 * age + 5
        else:
            bmr = 10 * weight + 6.25 * height - 5 * age - 161
        
        # Activity level multiplier (estimated from workout data)
        intensity = user_data.get('Workout Intensity', 'Medium').lower()
        duration = user_data.get('Workout Duration (mins)', 30)
        
        if intensity == 'high' and duration > 45:
            activity_multiplier = 1.725  # Very active
        elif intensity in ['medium', 'high']:
            activity_multiplier = 1.55   # Moderately active
        else:
            activity_multiplier = 1.375  # Lightly active
        
        tdee = bmr * activity_multiplier
        
        # Fitness goal (estimated from workout type and user profile)
        workout_type = user_data.get('Workout Type', 'Running').lower()
        if workout_type in ['weightlifting', 'strength training']:
            fitness_goal = 'muscle_gain'
        elif user_data.get('BMI', 25) > 25:
            fitness_goal = 'weight_loss'
        elif workout_type in ['running', 'cycling', 'swimming']:
            fitness_goal = 'endurance'
        else:
            fitness_goal = 'general_fitness'
        
        # Calculate macros
        macro_ratios = self.MACRO_RATIOS[fitness_goal]
        
        protein_g = weight * (1.6 if fitness_goal == 'muscle_gain' else 1.2 if fitness_goal == 'weight_loss' else 1.0)
        carb_g = (tdee * macro_ratios['carbs']) / 4
        fat_g = (tdee * macro_ratios['fat']) / 9
        
        # Adjust calories based on goal
        if fitness_goal == 'weight_loss':
            target_calories = tdee - 400  # 400 calorie deficit
        elif fitness_goal == 'muscle_gain':
            target_calories = tdee + 300  # 300 calorie surplus
        else:
            target_calories = tdee
        
        return {
            'daily_targets': {
                'calories': round(target_calories),
                'protein_g': round(protein_g, 1),
                'carbohydrates_g': round(carb_g, 1),
                'fat_g': round(fat_g, 1),
                'fiber_g': round(weight * 0.35, 1)
            },
            'bmr': round(bmr),
            'tdee': round(tdee),
            'fitness_goal': fitness_goal,
            'meal_distribution': {
                'breakfast': {'protein_g': round(protein_g * 0.25, 1), 'carbs_g': round(carb_g * 0.30, 1), 'fat_g': round(fat_g * 0.25, 1)},
                'lunch': {'protein_g': round(protein_g * 0.30, 1), 'carbs_g': round(carb_g * 0.35, 1), 'fat_g': round(fat_g * 0.35, 1)},
                'dinner': {'protein_g': round(protein_g * 0.30, 1), 'carbs_g': round(carb_g * 0.25, 1), 'fat_g': round(fat_g * 0.30, 1)},
                'snacks': {'protein_g': round(protein_g * 0.15, 1), 'carbs_g': round(carb_g * 0.10, 1), 'fat_g': round(fat_g * 0.10, 1)}
            },
            'pre_workout_nutrition': {
                'timing': '1-3 hours before workout',
                'carbs_g': round(carb_g * 0.15, 1),
                'protein_g': round(protein_g * 0.10, 1),
                'examples': ['Banana with peanut butter', 'Oatmeal with berries', 'Toast with honey']
            },
            'post_workout_nutrition': {
                'timing': 'Within 30 minutes',
                'protein_g': round(protein_g * 0.20, 1),
                'carbs_g': round(min(carb_g * 0.25, predictions.get('calories_burned', 300) / 4), 1),
                'examples': ['Chocolate milk (3:1 ratio)', 'Protein shake with banana', 'Greek yogurt with berries']
            },
            'food_sources': {
                'protein': ['Chicken breast', 'Fish', 'Eggs', 'Greek yogurt', 'Legumes', 'Quinoa'],
                'carbs': ['Oats', 'Sweet potatoes', 'Brown rice', 'Fruits', 'Vegetables', 'Whole grain bread'],
                'fats': ['Avocado', 'Nuts', 'Olive oil', 'Fatty fish', 'Seeds', 'Coconut oil']
            }
        }
    
    def _get_foods_to_avoid(self, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """Get foods to avoid based on goals and timing."""
        
        return {
            'general_avoid': [
                "Processed foods high in trans fats",
                "Sugary drinks and sodas", 
                "Alcohol in excess (>2 drinks/day men, >1 drink/day women)",
                "High-sodium processed meats",
                "Refined white bread and pastries",
                "Deep-fried fast foods"
            ],
            'pre_workout_avoid': [
                "High-fat foods (slow digestion)",
                "High-fiber foods (GI distress risk)",
                "Spicy foods",
                "Large meals within 2 hours",
                "Alcohol"
            ],
            'post_workout_avoid': [
                "Alcohol (impairs recovery)",
                "High-fat foods (slow nutrient absorption)",
                "Excessive caffeine",
                "Sugary drinks without protein"
            ],
            'weight_loss_specific': [
                "Calorie-dense nuts in large portions",
                "High-fat dairy products",
                "Liquid calories (smoothies, juices)",
                "Large portion sizes"
            ] if user_data.get('BMI', 25) > 25 else [],
            'portion_control_tips': [
                "Use hand-size portions for protein",
                "Cupped hand for carbs",
                "Thumb-size for fats",
                "Eat slowly and mindfully"
            ]
        }
    
    def _assess_who_guidelines(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Assess WHO guidelines compliance and fat burning recommendations."""
        
        age = user_data.get('Age', 30)
        duration = user_data.get('Workout Duration (mins)', 30)
        intensity = user_data.get('Workout Intensity', 'Medium').lower()
        hr = user_data.get('Heart Rate (bpm)', 140)
        
        # Estimate weekly activity (simplified)
        weekly_sessions = 3  # Assume 3x per week
        if intensity == 'high':
            weekly_vigorous = duration * weekly_sessions
            weekly_moderate = 0
        else:
            weekly_vigorous = 0
            weekly_moderate = duration * weekly_sessions
        
        meets_guidelines = (weekly_moderate >= 150) or (weekly_vigorous >= 75)
        
        # Fat burning zone calculation
        max_hr = 220 - age
        fat_burn_lower = int(max_hr * 0.60)
        fat_burn_upper = int(max_hr * 0.70)
        current_hr_zone = self._get_hr_zone(hr, max_hr)
        
        return {
            'who_compliance': {
                'meets_guidelines': meets_guidelines,
                'weekly_moderate_estimate': f"{weekly_moderate} minutes",
                'weekly_vigorous_estimate': f"{weekly_vigorous} minutes",
                'target_moderate': "150 minutes/week",
                'target_vigorous': "75 minutes/week"
            },
            'fat_burning': {
                'optimal_hr_zone': f"{fat_burn_lower}-{fat_burn_upper} bpm (60-70% max HR)",
                'current_hr_zone': current_hr_zone,
                'in_fat_burn_zone': fat_burn_lower <= hr <= fat_burn_upper,
                'calorie_deficit_target': "300-500 calories below TDEE for 1-2 lbs/week weight loss",
                'current_session_burn': f"{predictions.get('calories_burned', 300):.0f} calories"
            },
            'recommendations': [
                "Aim for 150 min moderate OR 75 min vigorous activity weekly",
                "Include 2+ strength training sessions per week",
                "Stay in 60-70% max HR for optimal fat burning",
                "7-9 hours sleep for recovery and metabolism"
            ]
        }
    
    def _get_workout_timing_advice(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Get pre and post workout timing advice."""
        
        calories_burned = predictions.get('calories_burned', 300)
        intensity = user_data.get('Workout Intensity', 'Medium').lower()
        duration = user_data.get('Workout Duration (mins)', 30)
        
        return {
            'pre_workout': {
                '3_hours_before': "Large balanced meal (complex carbs + lean protein)",
                '1_hour_before': "Light snack (banana with peanut butter)",
                '30_mins_before': "Small amount easily digestible carbs",
                'hydration': "500-600ml water 2-3 hours before",
                'avoid': "High-fat, high-fiber, or spicy foods"
            },
            'during_workout': {
                'hydration': f"Drink {duration * 6}ml total during workout",
                'electrolytes': "Add electrolytes if workout >60 minutes",
                'energy': "Sports drink only for intense sessions >90 minutes"
            },
            'post_workout': {
                'immediate_0_30_mins': {
                    'protein': f"{round(calories_burned * 0.1, 1)}g high-quality protein",
                    'carbs': f"{round(calories_burned * 0.15, 1)}g fast-digesting carbs",
                    'ratio': "3:1 or 4:1 carbs to protein ratio",
                    'hydration': f"Drink {round(calories_burned * 1.5)}ml fluid replacement"
                },
                '30_mins_2_hours': "Complete balanced meal to support recovery",
                'avoid': "Alcohol (impairs muscle protein synthesis)"
            },
            'supplementation': {
                'caffeine': "3-6mg/kg body weight, 30-60 mins before (if tolerated)",
                'creatine': "3-5g daily (timing not critical)",
                'protein_powder': "20-30g post-workout if whole foods not available"
            }
        }
    
    def _get_performance_tips(self, user_data: Dict[str, Any], predictions: Dict[str, float]) -> Dict[str, Any]:
        """Get performance improvement recommendations."""
        
        calories_burned = predictions.get('calories_burned', 300)
        duration = user_data.get('Workout Duration (mins)', 30)
        efficiency = calories_burned / duration if duration > 0 else 0
        workout_type = user_data.get('Workout Type', 'Running').lower()
        age = user_data.get('Age', 30)
        
        return {
            'current_performance': {
                'efficiency_cal_per_min': round(efficiency, 1),
                'performance_level': self._get_performance_level(efficiency),
                'improvement_potential': "High" if efficiency < 10 else "Moderate" if efficiency < 15 else "Maintenance"
            },
            'progressive_overload': {
                'intensity': "Increase by 5-10% weekly",
                'duration': "Increase by 10% weekly (follow 10% rule)",
                'frequency': "Add 1 session per week every 3-4 weeks"
            },
            'technique_optimization': self._get_technique_tips(workout_type),
            'cross_training': self._get_cross_training(workout_type),
            'recovery_optimization': {
                'sleep_target': f"{8 + (0.5 if user_data.get('Workout Intensity', 'Medium').lower() == 'high' else 0)} hours",
                'active_recovery': ["Light walking", "Stretching", "Foam rolling"],
                'rest_days': "1-2 complete rest days per week"
            },
            'monitoring': {
                'track_resting_hr': "Should decrease over time with improved fitness",
                'track_sleep_quality': "Use HRV or sleep tracking for recovery",
                'progressive_metrics': ["Distance", "Speed", "Weight lifted", "Heart rate recovery"]
            }
        }
    
    # Helper methods
    def _get_hydration_status(self, current: int, needs: float) -> str:
        ratio = current / needs if needs > 0 else 0
        if ratio >= 0.9: return "Well hydrated"
        elif ratio >= 0.7: return "Adequately hydrated" 
        elif ratio >= 0.5: return "Mild dehydration"
        else: return "Dehydration risk"
    
    def _get_hr_zone(self, hr: int, max_hr: int) -> str:
        percentage = (hr / max_hr) * 100
        if percentage < 60: return "Recovery zone (<60% max HR)"
        elif percentage < 70: return "Fat burning zone (60-70% max HR)"
        elif percentage < 80: return "Aerobic zone (70-80% max HR)"
        elif percentage < 90: return "Anaerobic zone (80-90% max HR)"
        else: return "Red line zone (>90% max HR)"
    
    def _get_performance_level(self, efficiency: float) -> str:
        if efficiency > 15: return "Elite level"
        elif efficiency > 12: return "Advanced level"
        elif efficiency > 8: return "Intermediate level"
        elif efficiency > 5: return "Beginner+ level"
        else: return "Beginner level"
    
    def _get_technique_tips(self, workout_type: str) -> List[str]:
        tips = {
            'running': ["Midfoot landing", "180 steps/min cadence", "Upright posture", "Relaxed shoulders"],
            'cycling': ["Proper bike fit", "80-100 RPM cadence", "Core engagement", "Efficient gear use"],
            'weightlifting': ["Form over weight", "Control eccentric phase", "Full ROM", "Progressive overload"],
            'swimming': ["Horizontal body position", "Bilateral breathing", "High elbow catch", "Hip-driven kick"]
        }
        return tips.get(workout_type, ["Focus on form", "Gradual progression", "Listen to your body"])
    
    def _get_cross_training(self, primary_workout: str) -> List[str]:
        cross_training = {
            'running': ['Swimming (low-impact)', 'Cycling (leg strength)', 'Yoga (flexibility)', 'Strength training'],
            'cycling': ['Running (different muscles)', 'Swimming (upper body)', 'Core work', 'Hiking'],
            'weightlifting': ['Cardio activities', 'Yoga (mobility)', 'Swimming (recovery)', 'Hiking'],
            'swimming': ['Land cardio', 'Strength training', 'Flexibility work', 'Core strengthening']
        }
        return cross_training.get(primary_workout, ['Add variety', 'Include cardio and strength', 'Flexibility work'])

# Initialize the Smart Recommendations Engine
smart_recommendations = SmartRecommendationsEngine()

# Load the original dataset to create a multi-output model
try:
    df = pd.read_csv('workout_fitness_tracker_data.csv')
    print("✅ Dataset loaded successfully!")
    
    # Prepare features and multiple targets
    # Input features (what users provide)
    input_features = [
        'Age', 'Gender', 'Height (cm)', 'Weight (kg)', 
        'Workout Type', 'Workout Duration (mins)', 
        'Heart Rate (bpm)', 'Workout Intensity',
        'Resting Heart Rate (bpm)', 'Mood Before Workout', 'Mood After Workout'
    ]
    
    # Output targets (what we predict)
    output_targets = [
        'Calories Burned', 'Distance (km)', 'Sleep Hours', 
        'Daily Calories Intake', 'Steps Taken'  # Adding steps as bonus
    ]
    
    # We'll also calculate VO2 MAX as a derived metric
    
    print(f"Input features: {input_features}")
    print(f"Output targets: {output_targets}")
    print("✅ Enhanced Smart Recommendations Engine integrated!")
    
    # Prepare the data
    X = df[input_features].copy()
    y = df[output_targets].copy()
    
    # Handle categorical variables
    le_gender = LabelEncoder()
    le_workout = LabelEncoder()
    le_intensity = LabelEncoder()
    le_mood_before = LabelEncoder()
    le_mood_after = LabelEncoder()
    
    X['Gender_encoded'] = le_gender.fit_transform(X['Gender'])
    X['Workout Type_encoded'] = le_workout.fit_transform(X['Workout Type'])
    X['Workout Intensity_encoded'] = le_intensity.fit_transform(X['Workout Intensity'])
    X['Mood Before Workout_encoded'] = le_mood_before.fit_transform(X['Mood Before Workout'])
    X['Mood After Workout_encoded'] = le_mood_after.fit_transform(X['Mood After Workout'])
    
    # Create feature engineering
    X['BMI'] = X['Weight (kg)'] / (X['Height (cm)'] / 100) ** 2
    X['Heart_rate_intensity'] = X['Heart Rate (bpm)'] / X['Resting Heart Rate (bpm)']
    
    # Select numerical features for training
    feature_cols = [
        'Age', 'Height (cm)', 'Weight (kg)', 'Workout Duration (mins)',
        'Heart Rate (bpm)', 'Resting Heart Rate (bpm)', 'BMI', 'Heart_rate_intensity',
        'Gender_encoded', 'Workout Type_encoded', 'Workout Intensity_encoded',
        'Mood Before Workout_encoded', 'Mood After Workout_encoded'
    ]
    
    X_final = X[feature_cols]
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X_final, y, test_size=0.2, random_state=42)
    
    # Train separate models for each target (better than multi-output for different scales)
    models = {}
    scalers = {}
    
    for target in output_targets:
        print(f"Training model for {target}...")
        
        # Scale features
        scaler = StandardScaler()
        X_train_scaled = scaler.fit_transform(X_train)
        X_test_scaled = scaler.transform(X_test)
        
        # Train model
        model = RandomForestRegressor(n_estimators=200, random_state=42, n_jobs=-1)
        model.fit(X_train_scaled, y_train[target])
        
        # Evaluate
        y_pred = model.predict(X_test_scaled)
        mae = mean_absolute_error(y_test[target], y_pred)
        r2 = r2_score(y_test[target], y_pred)
        
        print(f"  {target}: MAE={mae:.2f}, R²={r2:.4f}")
        
        models[target] = model
        scalers[target] = scaler
    
    # Save encoders and models
    model_data = {
        'models': models,
        'scalers': scalers,
        'encoders': {
            'gender': le_gender,
            'workout_type': le_workout,
            'intensity': le_intensity,
            'mood_before': le_mood_before,
            'mood_after': le_mood_after
        },
        'feature_cols': feature_cols,
        'input_features': input_features,
        'output_targets': output_targets
    }
    
    joblib.dump(model_data, 'enhanced_fitness_model.pkl')
    print("✅ Enhanced multi-output model saved!")
    
except Exception as e:
    print(f"❌ Error creating enhanced model: {e}")
    model_data = None

def calculate_vo2_max(age, gender, heart_rate, resting_hr, duration, intensity):
    """Calculate estimated VO2 Max based on workout data"""
    # Basic VO2 Max estimation formula
    if gender.lower() == 'male':
        base_vo2 = 15.3 * (heart_rate / resting_hr)
    else:
        base_vo2 = 15.0 * (heart_rate / resting_hr)
    
    # Adjust for age
    age_factor = 1 - (age - 25) * 0.01 if age > 25 else 1
    
    # Adjust for intensity
    intensity_multiplier = {'Low': 0.8, 'Medium': 1.0, 'High': 1.2}.get(intensity, 1.0)
    
    # Adjust for duration
    duration_factor = min(1 + (duration - 30) * 0.01, 1.5) if duration > 30 else 1
    
    vo2_max = base_vo2 * age_factor * intensity_multiplier * duration_factor
    
    # Typical ranges: 20-60 ml/kg/min
    return max(20, min(60, vo2_max))

def enhanced_calorie_calculation(predicted_calories, age, weight, gender, duration, intensity, heart_rate):
    """Enhanced calorie calculation with multiple factors"""
    
    # Base metabolic rate (BMR) component
    if gender.lower() == 'male':
        bmr = 88.362 + (13.397 * weight) + (4.799 * 170) - (5.677 * age)  # Assuming average height
    else:
        bmr = 447.593 + (9.247 * weight) + (3.098 * 170) - (4.330 * age)
    
    # Exercise metabolic equivalent (MET) values
    met_values = {
        'Running': {'Low': 6, 'Medium': 9, 'High': 12},
        'Cycling': {'Low': 4, 'Medium': 7, 'High': 10},
        'Swimming': {'Low': 5, 'Medium': 8, 'High': 11},
        'Weightlifting': {'Low': 3, 'Medium': 5, 'High': 7},
        'Walking': {'Low': 2.5, 'Medium': 4, 'High': 5.5},
        'Yoga': {'Low': 2, 'Medium': 3, 'High': 4}
    }
    
    # Heart rate based adjustment
    hr_factor = min(heart_rate / 100, 2.0)  # Cap at 2x for very high heart rates
    
    # Enhanced calculation
    enhanced_calories = predicted_calories * hr_factor * 0.7 + (predicted_calories * 0.3)
    
    return round(enhanced_calories, 1)

@app.route('/', methods=['GET'])
def home():
    return jsonify({
        'message': 'Enhanced Fitness Tracker Multi-Output Predictor',
        'version': '2.0',
        'features': {
            'inputs': [
                'Age', 'Gender', 'Height (cm)', 'Weight (kg)', 
                'Workout Type', 'Workout Duration (mins)', 
                'Heart Rate (bpm)', 'Workout Intensity',
                'Resting Heart Rate (bpm)', 'Mood Before Workout', 'Mood After Workout'
            ],
            'outputs': [
                'Calories Burned', 'Distance (km)', 'Sleep Hours', 
                'Daily Calories Intake', 'Steps Taken', 'VO2 Max (estimated)'
            ]
        },
        'endpoints': {
            'predict': 'POST /predict',
            'health': 'GET /health'
        }
    })

@app.route('/predict', methods=['POST'])
def predict():
    if model_data is None:
        return jsonify({'error': 'Enhanced model not loaded'}), 500
    
    try:
        # Get input data
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        print(f"Received data: {data}")
        
        # Try Ultimate Fitness AI first (your 30/30 + BERT4Rec model)
        ultimate_predictions = None
        if ULTIMATE_AI_AVAILABLE:
            try:
                # Convert to Ultimate AI format
                current_workout = {
                    'age': data['Age'],
                    'weight': data['Weight (kg)'],
                    'height': data['Height (cm)'],
                    'gender': data['Gender'],
                    'workout_type': data['Workout Type'],
                    'duration': data['Workout Duration (mins)'],
                    'intensity': data['Workout Intensity'],
                    'heart_rate': data['Heart Rate (bpm)'],
                    'mood_before': data['Mood Before Workout'],
                    'mood_after': data['Mood After Workout'],
                    'weather_temp': 20,
                    'sleep_hours': 7,
                    'water_intake': 2
                }
                
                # Get workout history if provided
                workout_history = data.get('workout_history', [])
                
                # Get Ultimate AI prediction
                ultimate_result = get_ultimate_fitness_recommendations(current_workout, workout_history)
                ultimate_predictions = ultimate_result
                print(f"✅ Ultimate AI prediction successful: {ultimate_result.get('calories_burned', 0)} calories")
                
            except Exception as e:
                print(f"⚠️ Ultimate AI failed, falling back to standard model: {e}")
        
        # Standard model prediction (fallback or supplement)
        # Create input DataFrame
        input_df = pd.DataFrame([data])
        
        # Encode categorical variables
        input_df['Gender_encoded'] = model_data['encoders']['gender'].transform([data['Gender']])[0]
        input_df['Workout Type_encoded'] = model_data['encoders']['workout_type'].transform([data['Workout Type']])[0]
        input_df['Workout Intensity_encoded'] = model_data['encoders']['intensity'].transform([data['Workout Intensity']])[0]
        input_df['Mood Before Workout_encoded'] = model_data['encoders']['mood_before'].transform([data['Mood Before Workout']])[0]
        input_df['Mood After Workout_encoded'] = model_data['encoders']['mood_after'].transform([data['Mood After Workout']])[0]
        
        # Add engineered features
        input_df['BMI'] = data['Weight (kg)'] / (data['Height (cm)'] / 100) ** 2
        input_df['Heart_rate_intensity'] = data['Heart Rate (bpm)'] / data['Resting Heart Rate (bpm)']
        
        # Select features for prediction
        X_pred = input_df[model_data['feature_cols']]
        
        # Make predictions for all targets
        predictions = {}
        for target in model_data['output_targets']:
            scaler = model_data['scalers'][target]
            model = model_data['models'][target]
            
            X_scaled = scaler.transform(X_pred)
            pred = model.predict(X_scaled)[0]
            predictions[target] = max(0, pred)  # Ensure non-negative values
        
        # Use Ultimate AI calories if available, otherwise use enhanced calculation
        if ultimate_predictions:
            enhanced_calories = ultimate_predictions.get('calories_burned', predictions['Calories Burned'])
        else:
            enhanced_calories = enhanced_calorie_calculation(
                predictions['Calories Burned'],
                data['Age'],
                data['Weight (kg)'],
                data['Gender'],
                data['Workout Duration (mins)'],
                data['Workout Intensity'],
                data['Heart Rate (bpm)']
            )
        
        # Calculate VO2 Max
        vo2_max = calculate_vo2_max(
            data['Age'],
            data['Gender'],
            data['Heart Rate (bpm)'],
            data['Resting Heart Rate (bpm)'],
            data['Workout Duration (mins)'],
            data['Workout Intensity']
        )
        
        # Prepare response with Ultimate AI insights
        results = {
            'calories_burned': round(enhanced_calories, 1),
            'distance_km': round(predictions['Distance (km)'], 2),
            'sleep_hours': round(predictions['Sleep Hours'], 1),
            'daily_calories_intake': round(predictions['Daily Calories Intake'], 0),
            'steps_taken': round(predictions['Steps Taken'], 0),
            'vo2_max': round(vo2_max, 1),
            'fitness_metrics': {
                'bmi': round(input_df['BMI'].values[0], 1),
                'heart_rate_intensity': round(input_df['Heart_rate_intensity'].values[0], 2),
                'workout_efficiency': round(enhanced_calories / data['Workout Duration (mins)'], 1)
            }
        }
        
        # Add Ultimate AI insights if available
        response = {
            'success': True,
            'predictions': results,
            'model_version': '2.1 - Enhanced with Ultimate AI',
            'input_summary': {
                'workout': f"{data['Workout Type']} ({data['Workout Intensity']} intensity)",
                'duration': f"{data['Workout Duration (mins)']} minutes",
                'user': f"{data['Age']}y {data['Gender']}, {data['Weight (kg)']}kg"
            }
        }
        
        # Include Ultimate AI insights if available
        if ultimate_predictions:
            response['ultimate_ai'] = {
                'available': True,
                'model_rating': '30/30 - EXTREMELY VALUABLE',
                'enhanced_predictions': {
                    'efficiency': round(ultimate_predictions.get('efficiency', 0), 2),
                    'fatigue_level': round(ultimate_predictions.get('fatigue_level', 0), 1),
                    'recovery_time': round(ultimate_predictions.get('recovery_time', 0), 1),
                    'performance_score': round(ultimate_predictions.get('performance_score', 0), 1)
                }
            }
            
            # Add AI insights if available
            if 'ai_insights' in ultimate_predictions:
                insights = ultimate_predictions['ai_insights']
                response['ultimate_ai']['insights'] = {
                    'fitness_trajectory': insights.get('fitness_trajectory', 'Analyzing...'),
                    'combined_ai_score': round(insights.get('combined_ai_score', 0) * 100, 1),
                    'optimization_tips': insights.get('optimization_tips', [])[:3]  # Top 3 tips
                }
                
                # Pattern analysis
                if 'pattern_analysis' in insights:
                    pattern = insights['pattern_analysis']
                    response['ultimate_ai']['pattern_analysis'] = {
                        'variety_score': round(pattern.get('variety_score', 0) * 100, 0),
                        'consistency_score': round(pattern.get('consistency_score', 0) * 100, 0),
                        'next_recommendation': pattern.get('next_recommendation', 'Continue current plan')
                    }
        else:
            response['ultimate_ai'] = {
                'available': False,
                'message': 'Using standard enhanced model'
            }
        
        # 🔥 NEW: Generate Enhanced Smart Recommendations
        try:
            # Prepare user data with BMI calculation
            user_data_for_recommendations = {
                **data,
                'BMI': input_df['BMI'].values[0],
                'water_intake_today_ml': data.get('water_intake_today_ml', 1000)  # Default if not provided
            }
            
            # Prepare predictions dictionary
            predictions_for_recommendations = {
                'calories_burned': enhanced_calories,
                'distance_km': predictions['Distance (km)'],
                'sleep_hours': predictions['Sleep Hours'],
                'daily_calories_intake': predictions['Daily Calories Intake'],
                'steps_taken': predictions['Steps Taken'],
                'vo2_max': vo2_max,
                'bmi': input_df['BMI'].values[0]
            }
            
            # Generate comprehensive smart recommendations
            smart_recs = smart_recommendations.generate_smart_recommendations(
                user_data_for_recommendations, 
                predictions_for_recommendations
            )
            
            # Add to response
            response['smart_recommendations'] = {
                'version': '3.0 - WHO Guidelines & Science-Based',
                'available': True,
                'recommendations': smart_recs
            }
            
            print("✅ Enhanced Smart Recommendations generated successfully!")
            
        except Exception as rec_error:
            print(f"⚠️ Smart recommendations error: {rec_error}")
            response['smart_recommendations'] = {
                'available': False,
                'error': f'Recommendations unavailable: {str(rec_error)}'
            }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error in prediction: {e}")
        print(f"Traceback: {traceback.format_exc()}")
        return jsonify({
            'error': str(e),
            'traceback': traceback.format_exc()
        }), 500

@app.route('/smart-recommendations', methods=['POST'])
def get_smart_recommendations_only():
    """Get detailed smart recommendations without full prediction."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No JSON data received'}), 400
        
        # Calculate basic metrics needed for recommendations
        bmi = data['Weight (kg)'] / (data['Height (cm)'] / 100) ** 2
        
        # Prepare user data
        user_data_for_recommendations = {
            **data,
            'BMI': bmi,
            'water_intake_today_ml': data.get('water_intake_today_ml', 1000)
        }
        
        # Simple calorie estimation for recommendations
        met_values = {'Running': 11, 'Cycling': 8, 'Walking': 4, 'Weightlifting': 6, 'Swimming': 8, 'Boxing': 10, 'Yoga': 3}
        workout_type = data.get('Workout Type', 'Running')
        met = met_values.get(workout_type, 8)
        
        intensity_multiplier = {'Low': 0.8, 'Medium': 1.0, 'High': 1.3}.get(data.get('Workout Intensity', 'Medium'), 1.0)
        estimated_calories = met * data['Weight (kg)'] * (data['Workout Duration (mins)'] / 60) * intensity_multiplier
        
        # Prepare basic predictions
        predictions_for_recommendations = {
            'calories_burned': estimated_calories,
            'distance_km': 5.0,  # Default estimate
            'sleep_hours': 8.0,
            'daily_calories_intake': 2200,
            'steps_taken': 8000,
            'vo2_max': 35,
            'bmi': bmi
        }
        
        # Generate smart recommendations
        smart_recs = smart_recommendations.generate_smart_recommendations(
            user_data_for_recommendations, 
            predictions_for_recommendations
        )
        
        return jsonify({
            'success': True,
            'smart_recommendations': {
                'version': '3.0 - WHO Guidelines & Science-Based',
                'recommendations': smart_recs,
                'basic_predictions': predictions_for_recommendations
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_data is not None,
        'ultimate_ai_available': ULTIMATE_AI_AVAILABLE,
        'smart_recommendations_available': True,
        'version': '3.0 - Enhanced with Smart Recommendations + Ultimate AI',
        'features': [
            'Multi-output predictions',
            'Ultimate AI integration (30/30 + BERT4Rec)',
            'Smart hydration recommendations',
            'Macro nutrition breakdown',
            'WHO guidelines compliance',
            'Pre/post workout timing',
            'Performance improvement tips'
        ]
    })

if __name__ == '__main__':
    print("🚀 Starting Enhanced Fitness Tracker API with Smart Recommendations v3.0...")
    print("📡 Main prediction endpoint: http://localhost:5002/predict")
    print("🧠 Smart recommendations only: http://localhost:5002/smart-recommendations")
    print("💡 Health check: http://localhost:5002/health")
    app.run(debug=True, host='0.0.0.0', port=5002)
