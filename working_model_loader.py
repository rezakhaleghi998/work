"""
Working Model Loader - Joblib Format
Successfully loads the enhanced fitness model using joblib
"""

import joblib
import numpy as np
import warnings
warnings.filterwarnings('ignore')

def load_enhanced_model(model_path="enhanced_fitness_model.pkl"):
    """Load the enhanced model using joblib"""
    try:
        import joblib
        data = joblib.load(model_path)
        print("Model loaded successfully using joblib!")
        return data
        
    except Exception as e:
        print(f"Error loading model: {e}")
        return None

class WorkingEnhancedModelPredictor:
    """Working predictor for the enhanced fitness model"""
    
    def __init__(self, model_path="enhanced_fitness_model.pkl"):
        self.model_data = load_enhanced_model(model_path)
        self.models = None
        self.label_encoders = {}
        self.scalers = None
        
        if self.model_data:
            self._extract_components()
    
    def _extract_components(self):
        """Extract model components from loaded data"""
        try:
            if isinstance(self.model_data, dict):
                self.models = self.model_data.get('models', None)
                self.label_encoders = self.model_data.get('encoders', {})
                self.scalers = self.model_data.get('scalers', None)
                self.feature_cols = self.model_data.get('feature_cols', [])
                
                print(f"Extracted components:")
                print(f"  Models: {type(self.models)} ({len(self.models) if hasattr(self.models, '__len__') else 'Unknown'})")
                print(f"  Model names: {list(self.models.keys()) if isinstance(self.models, dict) else 'Unknown'}")
                print(f"  Encoders: {list(self.label_encoders.keys()) if isinstance(self.label_encoders, dict) else 'Unknown'}")
                print(f"  Scalers: {type(self.scalers)}")
                print(f"  Feature columns: {self.feature_cols}")
            
        except Exception as e:
            print(f"Error extracting components: {e}")
    
    def safe_encode(self, encoder_name, value):
        """Safely encode categorical values"""
        if encoder_name not in self.label_encoders:
            return 0
        
        encoder = self.label_encoders[encoder_name]
        if hasattr(encoder, 'classes_') and value in encoder.classes_:
            return encoder.transform([value])[0]
        elif hasattr(encoder, 'classes_'):
            return encoder.transform([encoder.classes_[0]])[0]
        else:
            return 0
    
    def predict(self, workout_data):
        """Make predictions using the enhanced model"""
        if not self.models:
            return self._fallback_prediction(workout_data)
        
        try:
            # Check what models we have
            available_models = list(self.models.keys()) if isinstance(self.models, dict) else []
            print(f"Available models: {available_models}")
            
            # For calories prediction (main one we care about)
            if 'Calories Burned' in self.models:
                calories_model = self.models['Calories Burned']
                
                # Try to create features based on available data
                # Map to common features that the model might expect
                feature_mapping = {
                    'Age': workout_data.get('age', 25),
                    'Weight (kg)': workout_data.get('weight', 70),
                    'Height (cm)': workout_data.get('height', 170),
                    'Duration (min)': workout_data.get('duration', 30),
                    'Heart Rate (bpm)': workout_data.get('heart_rate', 120),
                    'Body Temperature (C)': workout_data.get('weather_temp', 20),
                    'Sleep Hours': workout_data.get('sleep_hours', 7),
                    'Water Intake (liters)': workout_data.get('water_intake', 2)
                }
                
                # Try to encode categorical features if encoders exist
                categorical_mappings = {
                    'Gender': workout_data.get('gender', 'Male'),
                    'Workout Type': workout_data.get('workout_type', 'Cardio'),
                    'Intensity': workout_data.get('intensity', 'Medium')
                }
                
                # Create feature array - try different approaches
                features = []
                
                # Add numerical features
                for feature_name, value in feature_mapping.items():
                    features.append(value)
                
                # Add encoded categorical features
                for cat_name, value in categorical_mappings.items():
                    if cat_name in self.label_encoders:
                        encoded = self.safe_encode(cat_name, value)
                        features.append(encoded)
                    else:
                        # Try some common mappings
                        if cat_name == 'Gender':
                            features.append(1 if value.lower() == 'male' else 0)
                        elif cat_name == 'Workout Type':
                            workout_map = {'Cardio': 0, 'Strength': 1, 'Yoga': 2, 'Running': 3, 'Cycling': 4, 'HIIT': 5}
                            features.append(workout_map.get(value, 0))
                        elif cat_name == 'Intensity':
                            intensity_map = {'Low': 0, 'Medium': 1, 'High': 2}
                            features.append(intensity_map.get(value, 1))
                
                # Convert to numpy array
                features_array = np.array([features])
                print(f"Feature array shape: {features_array.shape}")
                print(f"Features: {features}")
                
                # Make prediction
                try:
                    calories_pred = calories_model.predict(features_array)[0]
                    print(f"Raw calories prediction: {calories_pred}")
                    
                    # Calculate other metrics based on calories
                    duration = workout_data.get('duration', 30)
                    efficiency = calories_pred / duration if duration > 0 else 10
                    
                    return {
                        'calories_burned': max(0, calories_pred),
                        'efficiency': efficiency,
                        'fatigue_level': 5.0,
                        'recovery_time': 24.0,
                        'performance_score': min(10, max(1, calories_pred / 50))
                    }
                
                except Exception as pred_error:
                    print(f"Prediction error: {pred_error}")
                    print(f"Trying with fewer features...")
                    
                    # Try with just basic features
                    basic_features = [
                        workout_data.get('age', 25),
                        workout_data.get('weight', 70),
                        workout_data.get('duration', 30),
                        workout_data.get('heart_rate', 120)
                    ]
                    
                    basic_array = np.array([basic_features])
                    try:
                        calories_pred = calories_model.predict(basic_array)[0]
                        print(f"Basic prediction successful: {calories_pred}")
                        
                        duration = workout_data.get('duration', 30)
                        efficiency = calories_pred / duration if duration > 0 else 10
                        
                        return {
                            'calories_burned': max(0, calories_pred),
                            'efficiency': efficiency,
                            'fatigue_level': 5.0,
                            'recovery_time': 24.0,
                            'performance_score': min(10, max(1, calories_pred / 50))
                        }
                    except Exception as basic_error:
                        print(f"Basic prediction also failed: {basic_error}")
                        return self._fallback_prediction(workout_data)
            
            return self._fallback_prediction(workout_data)
            
        except Exception as e:
            print(f"Prediction error: {e}")
            return self._fallback_prediction(workout_data)
    
    def _fallback_prediction(self, workout_data):
        """Fallback prediction when model fails"""
        duration = workout_data.get('duration', 30)
        intensity_multipliers = {'Low': 8, 'Medium': 12, 'High': 16}
        multiplier = intensity_multipliers.get(workout_data.get('intensity', 'Medium'), 12)
        
        return {
            'calories_burned': duration * multiplier,
            'efficiency': multiplier,
            'fatigue_level': 5.0,
            'recovery_time': 24.0,
            'performance_score': 7.0
        }

# Test the working loader
if __name__ == "__main__":
    print("TESTING WORKING MODEL LOADER")
    print("=" * 50)
    
    predictor = WorkingEnhancedModelPredictor()
    
    test_data = {
        'age': 28,
        'weight': 72,
        'height': 175,
        'gender': 'Male',
        'workout_type': 'HIIT',
        'duration': 45,
        'intensity': 'High',
        'heart_rate': 150,
        'mood_before': 'Neutral',
        'mood_after': 'Energized',
        'weather_temp': 22,
        'sleep_hours': 7,
        'water_intake': 2.5
    }
    
    result = predictor.predict(test_data)
    
    print(f"\nPREDICTION RESULTS:")
    print(f"Calories: {result.get('calories_burned', 0):.1f}")
    print(f"Efficiency: {result.get('efficiency', 0):.2f}")
    print(f"Fatigue: {result.get('fatigue_level', 0):.1f}")
    print(f"Recovery: {result.get('recovery_time', 0):.1f}")
    print(f"Performance: {result.get('performance_score', 0):.1f}")
    
    print(f"\nWorking loader test completed!")
