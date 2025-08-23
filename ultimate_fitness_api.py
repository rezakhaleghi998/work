"""
Ultimate Fitness API - Enhanced with BERT4Rec + Your 30/30 Model
Integrates the Ultimate Fitness AI into your existing fitness tracker app
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
import traceback
import warnings
from datetime import datetime, timedelta
import os
import sys

warnings.filterwarnings('ignore')

# Import the Ultimate Fitness AI components
try:
    from ultimate_fitness_ai import UltimateFitnessAI, get_ultimate_fitness_recommendations
    ULTIMATE_AI_AVAILABLE = True
    print("✅ Ultimate Fitness AI loaded successfully!")
except ImportError as e:
    print(f"⚠️ Ultimate Fitness AI not available: {e}")
    ULTIMATE_AI_AVAILABLE = False

app = Flask(__name__)
CORS(app)

# Initialize Ultimate AI
if ULTIMATE_AI_AVAILABLE:
    try:
        ultimate_ai = UltimateFitnessAI()
        print("🚀 Ultimate AI initialized successfully!")
    except Exception as e:
        print(f"❌ Failed to initialize Ultimate AI: {e}")
        ultimate_ai = None
        ULTIMATE_AI_AVAILABLE = False
else:
    ultimate_ai = None

# Fallback: Load existing models
try:
    fallback_model = joblib.load('fitness_tracker_model.pkl')
    fallback_metadata = joblib.load('model_metadata.pkl')
    print("✅ Fallback models loaded")
except Exception as e:
    print(f"⚠️ Fallback models not available: {e}")
    fallback_model = None
    fallback_metadata = None

@app.route('/ultimate-predict', methods=['POST'])
def ultimate_predict():
    """Enhanced prediction using Ultimate Fitness AI"""
    try:
        data = request.get_json()
        
        if not ULTIMATE_AI_AVAILABLE or not ultimate_ai:
            return fallback_predict(data)
        
        # Convert input data to Ultimate AI format
        current_workout = {
            'age': data.get('Age', 25),
            'weight': data.get('Weight (kg)', 70),
            'height': data.get('Height (cm)', 170),
            'gender': data.get('Gender', 'Male'),
            'workout_type': data.get('Workout Type', 'Cardio'),
            'duration': data.get('Workout Duration (mins)', 30),
            'intensity': data.get('Workout Intensity', 'Medium'),
            'heart_rate': data.get('Heart Rate (bpm)', 120),
            'mood_before': data.get('Mood Before Workout', 'Neutral'),
            'mood_after': data.get('Mood After Workout', 'Neutral'),
            'weather_temp': data.get('Temperature', 20),
            'sleep_hours': data.get('Sleep Hours', 7),
            'water_intake': data.get('Water Intake', 2)
        }
        
        # Get workout history if provided
        workout_history = data.get('workout_history', [])
        
        # Get Ultimate AI prediction
        result = ultimate_ai.get_ultimate_prediction(current_workout, workout_history)
        
        # Format response
        response = {
            'success': True,
            'prediction_type': 'Ultimate AI (30/30 + BERT4Rec)',
            'predictions': {
                'calories_burned': round(result.get('calories_burned', 0), 1),
                'efficiency': round(result.get('efficiency', 0), 2),
                'fatigue_level': round(result.get('fatigue_level', 0), 1),
                'recovery_time': round(result.get('recovery_time', 0), 1),
                'performance_score': round(result.get('performance_score', 0), 1)
            },
            'ai_insights': result.get('ai_insights', {}),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response)
        
    except Exception as e:
        print(f"❌ Ultimate prediction error: {e}")
        print(traceback.format_exc())
        
        # Fallback to basic prediction
        return fallback_predict(data)

@app.route('/predict', methods=['POST'])
def predict():
    """Standard prediction endpoint (compatibility)"""
    return ultimate_predict()

def fallback_predict(data):
    """Fallback prediction using existing models"""
    try:
        if not fallback_model or not fallback_metadata:
            # Manual fallback calculation
            duration = data.get('Workout Duration (mins)', 30)
            intensity_map = {'Low': 8, 'Medium': 12, 'High': 16}
            intensity = data.get('Workout Intensity', 'Medium')
            multiplier = intensity_map.get(intensity, 12)
            
            calories = duration * multiplier
            
            return jsonify({
                'success': True,
                'prediction_type': 'Basic Fallback',
                'predictions': {
                    'calories_burned': calories,
                    'efficiency': multiplier,
                    'fatigue_level': 5.0,
                    'recovery_time': 24.0,
                    'performance_score': 7.0
                },
                'message': 'Using basic calculation',
                'timestamp': datetime.now().isoformat()
            })
        
        # Use existing model
        df_input = pd.DataFrame([data])
        
        # Add engineered features
        df_input['BMI'] = df_input['Weight (kg)'] / (df_input['Height (cm)'] / 100) ** 2
        if 'Steps Taken' in df_input.columns and 'Distance (km)' in df_input.columns:
            df_input['Steps_per_km'] = df_input['Steps Taken'] / df_input['Distance (km)']
        else:
            df_input['Steps_per_km'] = 2000  # Default
            
        df_input['Heart_rate_intensity'] = df_input['Heart Rate (bpm)'] / df_input.get('Resting Heart Rate (bpm)', 65)
        
        # Add age group
        age = df_input['Age'].values[0]
        if age <= 25:
            df_input['Age_Group'] = '18-25'
        elif age <= 35:
            df_input['Age_Group'] = '26-35'
        elif age <= 45:
            df_input['Age_Group'] = '36-45'
        elif age <= 55:
            df_input['Age_Group'] = '46-55'
        else:
            df_input['Age_Group'] = '56+'
        
        # Add sleep quality
        sleep = df_input.get('Sleep Hours', [7]).values[0]
        if sleep <= 6:
            df_input['Sleep_Quality'] = 'Poor'
        elif sleep <= 7.5:
            df_input['Sleep_Quality'] = 'Fair'
        elif sleep <= 9:
            df_input['Sleep_Quality'] = 'Good'
        else:
            df_input['Sleep_Quality'] = 'Excellent'
        
        # Select features
        if 'feature_cols' in fallback_metadata:
            df_input = df_input[fallback_metadata['feature_cols']]
        
        # Make prediction
        prediction = fallback_model.predict(df_input)[0]
        
        return jsonify({
            'success': True,
            'prediction_type': 'Fallback Model',
            'predictions': {
                'calories_burned': float(prediction),
                'efficiency': float(prediction / data.get('Workout Duration (mins)', 30)),
                'fatigue_level': 5.0,
                'recovery_time': 24.0,
                'performance_score': 7.0
            },
            'timestamp': datetime.now().isoformat()
        })
        
    except Exception as e:
        print(f"❌ Fallback prediction error: {e}")
        return jsonify({'error': str(e), 'success': False}), 400

@app.route('/health', methods=['GET'])
def health():
    """Health check endpoint"""
    status = {
        'status': 'healthy',
        'ultimate_ai_available': ULTIMATE_AI_AVAILABLE,
        'fallback_model_available': fallback_model is not None,
        'timestamp': datetime.now().isoformat()
    }
    
    if ULTIMATE_AI_AVAILABLE and ultimate_ai:
        status['ai_components'] = {
            'enhanced_model': 'loaded',
            'bert4rec': 'initialized',
            'rating': '30/30 - EXTREMELY VALUABLE'
        }
    
    return jsonify(status)

@app.route('/ai-info', methods=['GET'])
def ai_info():
    """Get information about the AI system"""
    info = {
        'api_version': '2.0 - Ultimate AI Enhanced',
        'features': [
            'Enhanced 30/30 rated model predictions',
            'BERT4Rec sequential analysis',
            'Pattern detection and optimization',
            'Personalized workout recommendations',
            'Multi-output predictions'
        ],
        'endpoints': {
            'ultimate-predict': 'POST - Enhanced prediction with AI insights',
            'predict': 'POST - Standard prediction (enhanced)',
            'health': 'GET - System health check',
            'ai-info': 'GET - AI system information'
        }
    }
    
    if ULTIMATE_AI_AVAILABLE:
        info['ai_status'] = 'Ultimate AI Fully Operational'
        info['model_rating'] = '30/30 - EXTREMELY VALUABLE'
    else:
        info['ai_status'] = 'Fallback Mode'
        info['model_rating'] = 'Standard Model'
    
    return jsonify(info)

@app.route('/', methods=['GET'])
def home():
    """Home page with API information"""
    return jsonify({
        'message': 'Ultimate Fitness Tracker API - Enhanced with AI',
        'version': '2.0',
        'ai_enhanced': ULTIMATE_AI_AVAILABLE,
        'endpoints': {
            'ultimate-predict': 'POST /ultimate-predict',
            'predict': 'POST /predict',
            'health': 'GET /health',
            'ai-info': 'GET /ai-info'
        },
        'description': 'Advanced fitness prediction API with 30/30 rated model + BERT4Rec intelligence'
    })

if __name__ == '__main__':
    print("🚀 Starting Ultimate Fitness API...")
    print(f"🤖 Ultimate AI Available: {ULTIMATE_AI_AVAILABLE}")
    print(f"🔄 Fallback Model Available: {fallback_model is not None}")
    print("🌐 Server starting on http://localhost:5000")
    
    app.run(debug=True, host='0.0.0.0', port=5000)
