import pandas as pd
import numpy as np
from xgboost import XGBRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import mean_absolute_error, r2_score
import joblib
import os

def load_and_preprocess_data():
    """Load and preprocess the workout fitness tracker data"""
    print("📊 Loading workout fitness tracker data...")
    
    # Load the CSV data
    df = pd.read_csv('workout_fitness_tracker_data.csv')
    print(f"✅ Loaded {len(df)} workout records")
    
    # Create label encoders for categorical variables
    label_encoders = {}
    
    # Encode Gender
    label_encoders['gender'] = LabelEncoder()
    df['Gender_encoded'] = label_encoders['gender'].fit_transform(df['Gender'])
    
    # Encode Workout Type
    label_encoders['workout_type'] = LabelEncoder()
    df['Workout_Type_encoded'] = label_encoders['workout_type'].fit_transform(df['Workout Type'])
    
    # Encode Workout Intensity
    intensity_map = {'Low': 1, 'Medium': 2, 'High': 3}
    df['Workout_Intensity_encoded'] = df['Workout Intensity'].map(intensity_map)
    
    # Create BMR calculation (Mifflin-St Jeor equation)
    df['BMR'] = np.where(df['Gender'] == 'Male',
                        (10 * df['Weight (kg)']) + (6.25 * df['Height (cm)']) - (5 * df['Age']) + 5,
                        (10 * df['Weight (kg)']) + (6.25 * df['Height (cm)']) - (5 * df['Age']) - 161)
    
    # Calculate activity multiplier based on workout intensity and duration
    df['Activity_Multiplier'] = 1.2 + (df['Workout_Intensity_encoded'] * 0.2) + (df['Workout Duration (mins)'] / 120)
    
    # Calculate theoretical daily calories needed
    df['Theoretical_Daily_Calories'] = df['BMR'] * df['Activity_Multiplier']
    
    # Calculate hydration needs (35ml per kg + exercise adjustment)
    df['Theoretical_Hydration'] = (df['Weight (kg)'] * 35) + (df['Workout Duration (mins)'] * df['Workout_Intensity_encoded'] * 10)
    
    # Calculate theoretical max heart rate
    df['Theoretical_Max_HR'] = 220 - df['Age']
    
    print("🔄 Data preprocessing completed")
    return df, label_encoders

def train_hydration_model(df):
    """Train XGBoost model for hydration prediction"""
    print("💧 Training hydration prediction model...")
    
    # Features for hydration prediction
    features = ['Weight (kg)', 'Height (cm)', 'Workout Duration (mins)', 
               'Workout_Intensity_encoded', 'Age']
    
    X = df[features]
    y = df['Theoretical_Hydration']  # Using calculated hydration as target
    
    # Split the data
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
    
    return model

def train_nutrition_model(df):
    """Train XGBoost model for nutrition prediction"""
    print("🍎 Training nutrition prediction model...")
    
    # Features for nutrition prediction
    features = ['Age', 'Weight (kg)', 'Height (cm)', 'Gender_encoded', 
               'Workout Duration (mins)', 'Workout_Intensity_encoded', 'BMR']
    
    X = df[features]
    y = df['Theoretical_Daily_Calories']  # Using calculated daily calories as target
    
    # Split the data
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
    
    return model

def train_calorie_burn_model(df):
    """Train XGBoost model for calorie burn prediction"""
    print("🎯 Training calorie burn prediction model...")
    
    # Features for calorie burn prediction
    features = ['Weight (kg)', 'Workout Duration (mins)', 'Workout_Intensity_encoded',
               'Workout_Type_encoded', 'Age', 'Heart Rate (bpm)']
    
    X = df[features]
    y = df['Calories Burned']  # Using actual calories burned from data
    
    # Split the data
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
    
    print(f"   📈 Calorie Burn Model - MAE: {mae:.2f} calories, R²: {r2:.3f}")
    
    return model

def train_heart_rate_model(df):
    """Train XGBoost model for heart rate zone prediction"""
    print("❤️ Training heart rate zone prediction model...")
    
    # Features for heart rate prediction
    features = ['Age', 'Resting Heart Rate (bpm)', 'Workout_Intensity_encoded',
               'Workout_Type_encoded', 'VO2 Max']
    
    X = df[features]
    y = df['Theoretical_Max_HR']  # Using calculated max HR as target
    
    # Split the data
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
    
    return model

def save_models_and_encoders(hydration_model, nutrition_model, calorie_model, 
                           heart_rate_model, label_encoders, df):
    """Save all trained models and encoders"""
    print("💾 Saving trained models...")
    
    # Create models directory if it doesn't exist
    os.makedirs('ml_models', exist_ok=True)
    
    # Save models
    joblib.dump(hydration_model, 'ml_models/hydration_xgboost_model.pkl')
    print("   ✅ Saved hydration_xgboost_model.pkl")
    
    joblib.dump(nutrition_model, 'ml_models/nutrition_xgboost_model.pkl')
    print("   ✅ Saved nutrition_xgboost_model.pkl")
    
    joblib.dump(calorie_model, 'ml_models/calorie_burn_xgboost_model.pkl')
    print("   ✅ Saved calorie_burn_xgboost_model.pkl")
    
    joblib.dump(heart_rate_model, 'ml_models/heart_rate_xgboost_model.pkl')
    print("   ✅ Saved heart_rate_xgboost_model.pkl")
    
    # Save label encoders
    joblib.dump(label_encoders, 'ml_models/label_encoders.pkl')
    print("   ✅ Saved label_encoders.pkl")
    
    # Save data statistics for normalization
    data_stats = {
        'weight_mean': df['Weight (kg)'].mean(),
        'weight_std': df['Weight (kg)'].std(),
        'height_mean': df['Height (cm)'].mean(),
        'height_std': df['Height (cm)'].std(),
        'workout_types': list(df['Workout Type'].unique()),
        'intensity_levels': ['Low', 'Medium', 'High']
    }
    joblib.dump(data_stats, 'ml_models/data_stats.pkl')
    print("   ✅ Saved data_stats.pkl")

def main():
    """Main training function"""
    print("🚀 Starting IMPROVED XGBoost model training...")
    print("=" * 50)
    
    try:
        # Load and preprocess data
        df, label_encoders = load_and_preprocess_data()
        
        # Train individual models
        hydration_model = train_hydration_model(df)
        nutrition_model = train_nutrition_model(df)
        calorie_model = train_calorie_burn_model(df)
        heart_rate_model = train_heart_rate_model(df)
        
        # Save everything
        save_models_and_encoders(hydration_model, nutrition_model, calorie_model, 
                               heart_rate_model, label_encoders, df)
        
        print("🎉 All models saved successfully!")
        print("=" * 50)
        print("✅ IMPROVED XGBoost training completed successfully!")
        print("📁 Models saved in 'ml_models/' directory")
        
        # Display model summary
        print("\n📊 MODEL SUMMARY:")
        print("💧 Hydration Model: Predicts daily water needs (ml)")
        print("🍎 Nutrition Model: Predicts daily calorie needs (calories)")
        print("🎯 Calorie Burn Model: Predicts workout calorie burn (calories)")
        print("❤️ Heart Rate Model: Predicts max heart rate zones (bpm)")
        
    except Exception as e:
        print(f"❌ Error during training: {str(e)}")
        raise

if __name__ == "__main__":
    main()
