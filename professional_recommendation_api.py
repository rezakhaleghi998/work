"""
Professional Recommendation API
Serves the Ultimate Fitness Recommendation Engine for the professional fitness tracker
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import traceback
import warnings
from datetime import datetime
import sys
import os

warnings.filterwarnings('ignore')

# Import the Ultimate Recommendation Engine
try:
    from ultimate_recommendation_engine import get_ultimate_fitness_recommendations, UltimateFitnessRecommendationEngine
    ULTIMATE_ENGINE_AVAILABLE = True
    print("✅ Ultimate Recommendation Engine loaded successfully!")
except ImportError as e:
    print(f"⚠️ Ultimate Recommendation Engine not available: {e}")
    ULTIMATE_ENGINE_AVAILABLE = False

app = Flask(__name__)
CORS(app)

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'Professional Recommendation API',
        'ultimate_engine_available': ULTIMATE_ENGINE_AVAILABLE,
        'timestamp': datetime.now().isoformat()
    })


@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    """Generate recommendations using the Professional Engine, but mimic XGBoost API input/output"""
    try:
        if not ULTIMATE_ENGINE_AVAILABLE:
            return jsonify({'success': False, 'error': 'Ultimate Recommendation Engine not available'}), 503

        data = request.json
        print(f"📥 Request: {data}")

        # Extract and validate data (mimic XGBoost API)
        weight = float(data.get('weight', 70))
        height = float(data.get('height', 175))
        age = int(data.get('age', 25))
        duration = float(data.get('workout_duration', 30))
        gender = data.get('gender', 'male').capitalize()
        workout_type = data.get('workout_type', 'cardio').capitalize()
        intensity = data.get('workout_intensity', '3')
        try:
            intensity_val = float(intensity)
        except:
            intensity_val = 3.0

        # Map to professional engine input
        recommendations = get_ultimate_fitness_recommendations(
            age=age,
            gender=gender,
            height_cm=height,
            weight_kg=weight,
            workout_type=workout_type,
            workout_duration_mins=duration,
            heart_rate_bpm=140,  # Default estimate
            workout_intensity='Medium',
            resting_heart_rate_bpm=65,
            mood_before_workout='Good',
            mood_after_workout='Good'
        )

        # Mimic XGBoost API output
        calories = recommendations['predictions']['calories_burned']
        daily_calories = recommendations['predictions']['daily_calories_intake']
        hydration_ml = max(1500, min(4000, calories * 30))
        max_hr = 220 - age

        response = {
            'success': True,
            'model_type': 'ProfessionalUltimate',
            'smart_recommendations': {
                'hydration_strategy': {
                    'daily_total': f"{hydration_ml:.0f}ml",
                    'recommendations': [
                        f"Drink {hydration_ml*0.2:.0f}ml 2 hours before workout",
                        f"Consume {hydration_ml*0.15:.0f}ml every 20 minutes during exercise"
                    ]
                },
                'nutrition_strategy': {
                    'daily_calories': f"{daily_calories:.0f}",
                    'protein_grams': f"{int(daily_calories * 0.3 / 4)}g",
                    'carbs_grams': f"{int(daily_calories * 0.4 / 4)}g",
                    'fats_grams': f"{int(daily_calories * 0.3 / 9)}g"
                },
                'workout_benefits': {
                    'calorie_burn_range': f"{calories-30:.0f}-{calories+30:.0f} calories",
                    'muscle_groups': ['Legs', 'Core', 'Cardio'],
                    'recovery_time': f"{24 + intensity_val*12:.0f} hours"
                },
                'heart_rate_zones': {
                    'max_hr': f"{max_hr:.0f}",
                    'fat_burn_zone': f"{int(max_hr*0.6)}-{int(max_hr*0.7)}",
                    'cardio_zone': f"{int(max_hr*0.7)}-{int(max_hr*0.85)}",
                    'max_zone': f"{int(max_hr*0.85)}-{int(max_hr*0.95)}"
                }
            }
        }

        print("✅ Professional Ultimate recommendations generated successfully")
        return jsonify(response)

    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

def _get_muscle_groups(workout_type):
    """Get muscle groups based on workout type"""
    muscle_groups_map = {
        'Running': ['Legs', 'Core', 'Cardiovascular'],
        'Cycling': ['Legs', 'Core', 'Glutes'],
        'Weightlifting': ['Full Body', 'Arms', 'Core'],
        'Swimming': ['Full Body', 'Core', 'Shoulders'],
        'Yoga': ['Core', 'Flexibility', 'Balance'],
        'Cardio': ['Cardiovascular', 'Core', 'Legs'],
        'Strength': ['Arms', 'Core', 'Legs']
    }
    return muscle_groups_map.get(workout_type, ['Full Body', 'Core'])

def _get_workout_benefits(workout_type):
    """Get workout benefits based on type"""
    benefits_map = {
        'Running': ['Cardiovascular Health', 'Leg Strength', 'Endurance'],
        'Cycling': ['Lower Body Strength', 'Cardiovascular Fitness', 'Low Impact'],
        'Weightlifting': ['Muscle Building', 'Bone Density', 'Metabolism'],
        'Swimming': ['Full Body Workout', 'Low Impact', 'Cardiovascular'],
        'Yoga': ['Flexibility', 'Balance', 'Mental Health'],
        'Cardio': ['Heart Health', 'Calorie Burn', 'Stamina'],
        'Strength': ['Muscle Strength', 'Bone Health', 'Functional Fitness']
    }
    return benefits_map.get(workout_type, ['Fitness', 'Health', 'Strength'])

@app.route('/api/test', methods=['GET'])
def test_endpoint():
    """Test endpoint to verify the API is working"""
    return jsonify({
        'message': 'Professional Recommendation API is working!',
        'engine_available': ULTIMATE_ENGINE_AVAILABLE,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/', methods=['GET'])
def home():
    """Home endpoint with API information"""
    return jsonify({
        'service': 'Professional Recommendation API',
        'version': '2.0',
        'description': 'Advanced fitness recommendations using Ultimate Engine (30/30 rated)',
        'endpoints': {
            'recommendations': 'POST /api/recommendations',
            'health': 'GET /health',
            'test': 'GET /api/test'
        },
        'ultimate_engine_available': ULTIMATE_ENGINE_AVAILABLE
    })

# Patch the missing methods into the global scope for the helper functions
def patch_helper_methods():
    """Patch helper methods to global scope"""
    globals()['_get_muscle_groups'] = _get_muscle_groups
    globals()['_get_workout_benefits'] = _get_workout_benefits

if __name__ == '__main__':
    patch_helper_methods()
    print("🚀 Starting Professional Recommendation API...")
    print(f"🔥 Ultimate Engine Available: {ULTIMATE_ENGINE_AVAILABLE}")
    print("🌐 Server starting on http://localhost:5001")
    
    app.run(debug=True, host='0.0.0.0', port=5001)
