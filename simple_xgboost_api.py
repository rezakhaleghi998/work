#!/usr/bin/env python3
"""
Simple XGBoost API - Working Version
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np

app = Flask(__name__)
CORS(app)

# Global variables for models
models = {}
encoders = {}

def load_models():
    """Load all XGBoost models"""
    global models, encoders
    try:
        print("🔄 Loading XGBoost models...")
        
        models['hydration'] = joblib.load('ml_models/hydration_xgboost_model.pkl')
        models['nutrition'] = joblib.load('ml_models/nutrition_xgboost_model.pkl')
        models['calorie_burn'] = joblib.load('ml_models/calorie_burn_xgboost_model.pkl')
        models['heart_rate'] = joblib.load('ml_models/heart_rate_xgboost_model.pkl')
        
        encoders = joblib.load('ml_models/label_encoders.pkl')
        
        print("✅ All models loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        return False

def encode_value(value, column):
    """Encode categorical values"""
    try:
        if column in encoders:
            encoder = encoders[column]
            if value in encoder.classes_:
                return encoder.transform([value])[0]
            else:
                return encoder.transform([encoder.classes_[0]])[0]
        return value
    except:
        return 0

@app.route('/health', methods=['GET'])
def health():
    """Health check"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': len(models) > 0,
        'model_count': len(models)
    })

@app.route('/api/test', methods=['GET'])
def test():
    """Test endpoint"""
    try:
        if len(models) == 0:
            return jsonify({'error': 'Models not loaded'}), 500
            
        # Simple test
        test_data = pd.DataFrame([{
            'Weight': 70,
            'Height': 175,
            'Age': 25,
            'Duration': 30,
            'Gender': 0,  # encoded
            'Workout_Type': 0,  # encoded
            'Intensity': 3
        }])
        
        # Test one model
        hydration_pred = models['hydration'].predict(test_data[['Weight', 'Height', 'Duration', 'Age', 'Gender']])[0]
        
        return jsonify({
            'status': 'success',
            'hydration_prediction': float(hydration_pred),
            'models_available': list(models.keys())
        })
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/recommendations', methods=['POST'])
def recommendations():
    """Generate recommendations using XGBoost"""
    try:
        if len(models) == 0:
            return jsonify({'success': False, 'error': 'Models not loaded'}), 500
        
        data = request.json
        print(f"📥 Request: {data}")
        
        # Extract and validate data
        weight = float(data.get('weight', 70))
        height = float(data.get('height', 175))
        age = int(data.get('age', 25))
        duration = float(data.get('workout_duration', 30))
        gender = data.get('gender', 'male').lower()
        workout_type = data.get('workout_type', 'cardio').lower()
        intensity = float(data.get('workout_intensity', 3))
        
        # Encode categorical variables
        gender_encoded = encode_value(gender, 'Gender')
        workout_encoded = encode_value(workout_type, 'Workout_Type')
        
        # Predict hydration
        hydration_features = pd.DataFrame([{
            'Weight': weight, 'Height': height, 'Duration': duration, 
            'Age': age, 'Gender': gender_encoded
        }])
        hydration_ml = models['hydration'].predict(hydration_features)[0]
        hydration_ml = max(1500, min(4000, hydration_ml))
        
        # Predict nutrition
        nutrition_features = pd.DataFrame([{
            'Weight': weight, 'Height': height, 'Age': age,
            'Gender': gender_encoded, 'Duration': duration, 'Workout_Type': workout_encoded
        }])
        calories = models['nutrition'].predict(nutrition_features)[0]
        calories = max(1200, min(4000, calories))
        
        # Predict calorie burn
        calorie_features = pd.DataFrame([{
            'Weight': weight, 'Duration': duration, 'Age': age,
            'Workout_Type': workout_encoded, 'Intensity': intensity
        }])
        calorie_burn = models['calorie_burn'].predict(calorie_features)[0]
        calorie_burn = max(50, min(1000, calorie_burn))
        
        # Predict heart rate
        hr_features = pd.DataFrame([{
            'Age': age, 'Weight': weight, 'Duration': duration, 'Workout_Type': workout_encoded
        }])
        max_hr = models['heart_rate'].predict(hr_features)[0]
        max_hr = max(150, min(220, max_hr))
        
        # Format responses
        response = {
            'success': True,
            'model_type': 'XGBoost',
            'smart_recommendations': {
                'hydration_strategy': {
                    'daily_total': f"{hydration_ml:.0f}ml",
                    'recommendations': [
                        f"Drink {hydration_ml*0.2:.0f}ml 2 hours before workout",
                        f"Consume {hydration_ml*0.15:.0f}ml every 20 minutes during exercise"
                    ]
                },
                'nutrition_strategy': {
                    'daily_calories': f"{calories:.0f}",
                    'protein_grams': f"{int(calories * 0.3 / 4)}g",
                    'carbs_grams': f"{int(calories * 0.4 / 4)}g",
                    'fats_grams': f"{int(calories * 0.3 / 9)}g"
                },
                'workout_benefits': {
                    'calorie_burn_range': f"{calorie_burn-30:.0f}-{calorie_burn+30:.0f} calories",
                    'muscle_groups': ['Legs', 'Core', 'Cardio'],
                    'recovery_time': f"{24 + intensity*12:.0f} hours"
                },
                'heart_rate_zones': {
                    'max_hr': f"{max_hr:.0f}",
                    'fat_burn_zone': f"{int(max_hr*0.6)}-{int(max_hr*0.7)}",
                    'cardio_zone': f"{int(max_hr*0.7)}-{int(max_hr*0.85)}",
                    'max_zone': f"{int(max_hr*0.85)}-{int(max_hr*0.95)}"
                }
            }
        }
        
        print("✅ Predictions generated successfully")
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting XGBoost API...")
    
    # Load models at startup
    if load_models():
        print("🌐 Starting server on http://localhost:5001")
        app.run(host='0.0.0.0', port=5001, debug=True)
    else:
        print("❌ Failed to load models. Exiting.")
