
# Dockerfile for fitness tracker model
FROM python:3.9-slim

WORKDIR /app

# Copy model files
COPY fitness_tracker_model.pkl .
COPY model_metadata.pkl .
COPY fitness_predictor_api.py .

# Install dependencies
RUN pip install flask pandas scikit-learn xgboost lightgbm joblib numpy

# Expose port
EXPOSE 5000

# Run the API
CMD ["python", "fitness_predictor_api.py"]
