import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

class FitnessModelTrainer:
    def __init__(self, data_path):
        self.data_path = data_path
        self.models = {}
        self.encoders = {}
        self.scalers = {}
        
    def load_and_prepare_data(self):
        """Load and prepare the fitness tracker data"""
        print("📊 Loading workout fitness tracker data...")
        
        # Load the dataset
        self.df = pd.read_csv(self.data_path)
        print(f"✅ Loaded {len(self.df)} workout records")
        
        # Clean column names
        self.df.columns = self.df.columns.str.strip()
        
        # Create encoders for categorical variables
        categorical_cols = ['Gender', 'Workout Type', 'Workout Intensity', 'Mood Before Workout', 'Mood After Workout']
        
        for col in categorical_cols:
            if col in self.df.columns:
                le = LabelEncoder()
                self.df[f'{col}_encoded'] = le.fit_transform(self.df[col].fillna('Unknown'))
                self.encoders[col] = le
        
        print("🔄 Data preprocessing completed")
        return self.df
    
    def train_hydration_model(self):
        """Train XGBoost model for hydration recommendations"""
        print("💧 Training hydration prediction model...")
        
        # Features for hydration prediction
        features = ['Weight (kg)', 'Height (cm)', 'Workout Duration (mins)', 
                   'Workout Intensity_encoded', 'Calories Burned', 'Heart Rate (bpm)']
        
        # Target: Water Intake (liters) -> convert to ml
        X = self.df[features].fillna(self.df[features].mean())
        y = self.df['Water Intake (liters)'] * 1000  # Convert to ml
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost model
        model = XGBRegressor(
            n_estimators=100,
            max_depth=6,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"   📈 Hydration Model - MAE: {mae:.2f}ml, R²: {r2:.3f}")
        
        self.models['hydration'] = model
        return model
    
    def train_nutrition_model(self):
        """Train XGBoost model for nutrition/calorie recommendations"""
        print("🍎 Training nutrition prediction model...")
        
        # Features for nutrition prediction
        features = ['Age', 'Gender_encoded', 'Height (cm)', 'Weight (kg)', 
                   'Workout Duration (mins)', 'Calories Burned', 'Body Fat (%)']
        
        # Target: Daily Calories Intake
        X = self.df[features].fillna(self.df[features].mean())
        y = self.df['Daily Calories Intake'].fillna(self.df['Daily Calories Intake'].mean())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost model
        model = XGBRegressor(
            n_estimators=150,
            max_depth=8,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"   📈 Nutrition Model - MAE: {mae:.2f} calories, R²: {r2:.3f}")
        
        self.models['nutrition'] = model
        return model
    
    def train_calorie_burn_model(self):
        """Train XGBoost model for workout benefits/calorie burn prediction"""
        print("🎯 Training workout benefits prediction model...")
        
        # Features for calorie burn prediction
        features = ['Age', 'Weight (kg)', 'Workout Type_encoded', 'Workout Duration (mins)',
                   'Workout Intensity_encoded', 'Heart Rate (bpm)', 'VO2 Max']
        
        # Target: Calories Burned
        X = self.df[features].fillna(self.df[features].mean())
        y = self.df['Calories Burned'].fillna(self.df['Calories Burned'].mean())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost model
        model = XGBRegressor(
            n_estimators=200,
            max_depth=7,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"   📈 Workout Benefits Model - MAE: {mae:.2f} calories, R²: {r2:.3f}")
        
        self.models['calorie_burn'] = model
        return model
    
    def train_heart_rate_model(self):
        """Train XGBoost model for heart rate zone predictions"""
        print("❤️ Training heart rate prediction model...")
        
        # Features for heart rate prediction
        features = ['Age', 'Weight (kg)', 'Resting Heart Rate (bpm)', 'VO2 Max',
                   'Workout Type_encoded', 'Workout Intensity_encoded']
        
        # Target: Heart Rate (bpm) during workout
        X = self.df[features].fillna(self.df[features].mean())
        y = self.df['Heart Rate (bpm)'].fillna(self.df['Heart Rate (bpm)'].mean())
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
        
        # Train XGBoost model
        model = XGBRegressor(
            n_estimators=100,
            max_depth=5,
            learning_rate=0.1,
            random_state=42
        )
        
        model.fit(X_train, y_train)
        
        # Evaluate
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"   📈 Heart Rate Model - MAE: {mae:.2f} bpm, R²: {r2:.3f}")
        
        self.models['heart_rate'] = model
        return model
    
    def save_models(self):
        """Save all trained models and encoders"""
        print("💾 Saving trained models...")
        
        # Create models directory if it doesn't exist
        os.makedirs('ml_models', exist_ok=True)
        
        # Save models
        for model_name, model in self.models.items():
            joblib.dump(model, f'ml_models/{model_name}_xgboost_model.pkl')
            print(f"   ✅ Saved {model_name}_xgboost_model.pkl")
        
        # Save encoders
        joblib.dump(self.encoders, 'ml_models/label_encoders.pkl')
        print("   ✅ Saved label_encoders.pkl")
        
        # Save data statistics for normalization
        stats = {
            'mean_values': self.df.select_dtypes(include=[np.number]).mean().to_dict(),
            'std_values': self.df.select_dtypes(include=[np.number]).std().to_dict()
        }
        joblib.dump(stats, 'ml_models/data_stats.pkl')
        print("   ✅ Saved data_stats.pkl")
        
        print("🎉 All models saved successfully!")
    
    def train_all_models(self):
        """Train all XGBoost models"""
        print("🚀 Starting XGBoost model training...")
        print("=" * 50)
        
        # Load and prepare data
        self.load_and_prepare_data()
        
        # Train all models
        self.train_hydration_model()
        self.train_nutrition_model()
        self.train_calorie_burn_model()
        self.train_heart_rate_model()
        
        # Save models
        self.save_models()
        
        print("=" * 50)
        print("✅ XGBoost training completed successfully!")
        print(f"📁 Models saved in 'ml_models/' directory")
        
        return self.models

if __name__ == "__main__":
    # Train models using your dataset
    trainer = FitnessModelTrainer('workout_fitness_tracker_data.csv')
    models = trainer.train_all_models()
