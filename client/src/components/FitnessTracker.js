import React, { useState, useEffect } from 'react';
import axios from 'axios';

function FitnessTracker() {
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    height: '',
    weight: '',
    workoutType: '',
    duration: '',
    intensity: 'medium',
    fitnessLevel: 'intermediate'
  });
  const [result, setResult] = useState(null);
  const [workoutTypes, setWorkoutTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadWorkoutTypes();
    loadUserProfile();
  }, []);

  const loadWorkoutTypes = async () => {
    try {
      const response = await axios.get('/api/fitness/workout-types');
      setWorkoutTypes(response.data.workoutTypes);
    } catch (error) {
      console.error('Failed to load workout types:', error);
    }
  };

  const loadUserProfile = async () => {
    try {
      const response = await axios.get('/api/users/profile');
      const profile = response.data;
      if (profile) {
        setFormData(prev => ({
          ...prev,
          age: profile.age || '',
          gender: profile.gender || '',
          height: profile.height || '',
          weight: profile.weight || ''
        }));
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await axios.post('/api/fitness/calculate', formData);
      setResult(response.data);

      // Save workout data to user metrics
      await axios.post('/api/metrics', {
        workoutType: formData.workoutType,
        duration: parseInt(formData.duration),
        intensity: formData.intensity,
        caloriesBurned: response.data.prediction.totalCalories,
        fitnessIndex: response.data.fitnessMetrics.fitnessIndex
      });

    } catch (error) {
      setError(error.response?.data?.error || 'Calculation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container my-4">
      <div className="tracker-container">
        <div className="text-center mb-4">
          <h1 className="text-primary">🏋️ Professional Fitness Tracker</h1>
          <p className="text-muted">Calculate calories burned and track your fitness progress</p>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="age" className="form-label">Age</label>
              <input
                type="number"
                className="form-control"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleChange}
                min="13"
                max="120"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="gender" className="form-label">Gender</label>
              <select
                className="form-control"
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="height" className="form-label">Height (cm)</label>
              <input
                type="number"
                className="form-control"
                id="height"
                name="height"
                value={formData.height}
                onChange={handleChange}
                min="100"
                max="250"
                step="0.1"
                required
              />
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="weight" className="form-label">Weight (kg)</label>
              <input
                type="number"
                className="form-control"
                id="weight"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                min="30"
                max="300"
                step="0.1"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="workoutType" className="form-label">Workout Type</label>
              <select
                className="form-control"
                id="workoutType"
                name="workoutType"
                value={formData.workoutType}
                onChange={handleChange}
                required
              >
                <option value="">Select Workout Type</option>
                {workoutTypes.map(workout => (
                  <option key={workout.value} value={workout.value}>
                    {workout.name} ({workout.caloriesPerMinute} cal/min)
                  </option>
                ))}
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="duration" className="form-label">Duration (minutes)</label>
              <input
                type="number"
                className="form-control"
                id="duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                min="1"
                max="300"
                required
              />
            </div>
          </div>

          <div className="row">
            <div className="col-md-6 mb-3">
              <label htmlFor="intensity" className="form-label">Intensity Level</label>
              <select
                className="form-control"
                id="intensity"
                name="intensity"
                value={formData.intensity}
                onChange={handleChange}
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="col-md-6 mb-3">
              <label htmlFor="fitnessLevel" className="form-label">Fitness Level</label>
              <select
                className="form-control"
                id="fitnessLevel"
                name="fitnessLevel"
                value={formData.fitnessLevel}
                onChange={handleChange}
              >
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </div>
          </div>

          <button 
            type="submit" 
            className="btn btn-primary w-100"
            disabled={loading}
          >
            {loading ? 'Calculating...' : 'Calculate Calories Burned'}
          </button>
        </form>

        {result && (
          <div className="results-card mt-4">
            <h3 className="text-center mb-4">🔥 Your Workout Results</h3>
            
            <div className="row">
              <div className="col-md-8">
                <div className="metric-card">
                  <h4>📊 Calories Burned</h4>
                  <div className="row">
                    <div className="col-6">
                      <strong>Total Calories:</strong> {result.prediction.totalCalories}
                    </div>
                    <div className="col-6">
                      <strong>Calories/Minute:</strong> {result.prediction.caloriesPerMinute}
                    </div>
                  </div>
                </div>

                <div className="metric-card">
                  <h5>💪 Fitness Metrics</h5>
                  <div className="row">
                    <div className="col-6">
                      <strong>Fitness Index:</strong> {result.fitnessMetrics.fitnessIndex}/100
                    </div>
                    <div className="col-6">
                      <strong>Metabolic Rate:</strong> {result.fitnessMetrics.metabolicRate}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="col-md-4 text-center">
                <div className="efficiency-grade">
                  {result.fitnessMetrics.efficiencyGrade}
                </div>
                <p className="mt-2"><strong>Efficiency Grade</strong></p>
              </div>
            </div>

            {result.recommendations && result.recommendations.length > 0 && (
              <div className="mt-4">
                <h5>💡 Recommendations</h5>
                {result.recommendations.map((rec, index) => (
                  <div key={index} className="recommendation-item">
                    {rec}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default FitnessTracker;
