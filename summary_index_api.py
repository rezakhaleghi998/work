"""
User Summary Index API Endpoint
Optional backend integration for the User Summary Index system
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
import json
import sqlite3
from datetime import datetime, timedelta
import os

app = Flask(__name__)
CORS(app)

# Database initialization
def init_db():
    """Initialize SQLite database for index storage"""
    conn = sqlite3.connect('user_summary_index.db')
    cursor = conn.cursor()
    
    # Create table for index history
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_index_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id TEXT NOT NULL,
            score INTEGER NOT NULL,
            level TEXT NOT NULL,
            components TEXT NOT NULL, -- JSON string
            insights TEXT, -- JSON string
            total_workouts INTEGER DEFAULT 0,
            average_calories INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create index for efficient queries
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_date ON user_index_history(user_id, created_at)')
    
    conn.commit()
    conn.close()

@app.route('/api/summary-index/calculate', methods=['POST'])
def calculate_summary_index():
    """
    Calculate User Summary Index based on workout history
    
    Expected payload:
    {
        "user_id": "user123",
        "workout_history": [
            {
                "calories": 350,
                "duration": 30,
                "workout_type": "Running",
                "intensity": "Medium",
                "heart_rate": 140,
                "efficiency": 75,
                "timestamp": "2025-09-01T10:30:00.000Z"
            }
        ]
    }
    """
    try:
        data = request.json
        user_id = data.get('user_id', 'default')
        workout_history = data.get('workout_history', [])
        
        if not workout_history:
            return jsonify({
                'success': True,
                'data': {
                    'score': 0,
                    'level': 'New User',
                    'components': {},
                    'insights': ['Start your first workout to begin tracking!'],
                    'total_workouts': 0,
                    'timestamp': datetime.now().isoformat()
                }
            })
        
        # Calculate index using the same logic as frontend
        index_data = calculate_index_from_history(workout_history)
        
        # Save to database
        save_index_to_db(user_id, index_data)
        
        return jsonify({
            'success': True,
            'data': index_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/summary-index/history/<user_id>', methods=['GET'])
def get_index_history(user_id):
    """Get historical index data for a user"""
    try:
        days = request.args.get('days', 30, type=int)
        cutoff_date = datetime.now() - timedelta(days=days)
        
        conn = sqlite3.connect('user_summary_index.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT score, level, components, total_workouts, created_at
            FROM user_index_history 
            WHERE user_id = ? AND created_at >= ?
            ORDER BY created_at ASC
        ''', (user_id, cutoff_date))
        
        rows = cursor.fetchall()
        conn.close()
        
        history = []
        for row in rows:
            history.append({
                'score': row[0],
                'level': row[1],
                'components': json.loads(row[2]) if row[2] else {},
                'total_workouts': row[3],
                'timestamp': row[4]
            })
        
        return jsonify({
            'success': True,
            'data': history
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/summary-index/compare/<user_id>', methods=['GET'])
def compare_with_previous(user_id):
    """Compare current index with previous period"""
    try:
        days = request.args.get('days', 7, type=int)
        
        conn = sqlite3.connect('user_summary_index.db')
        cursor = conn.cursor()
        
        # Get current (latest) index
        cursor.execute('''
            SELECT score, created_at FROM user_index_history 
            WHERE user_id = ? ORDER BY created_at DESC LIMIT 1
        ''', (user_id,))
        current = cursor.fetchone()
        
        if not current:
            return jsonify({
                'success': False,
                'error': 'No index data found'
            }), 404
        
        # Get previous index from specified days ago
        cutoff_date = datetime.now() - timedelta(days=days)
        cursor.execute('''
            SELECT score FROM user_index_history 
            WHERE user_id = ? AND created_at <= ?
            ORDER BY created_at DESC LIMIT 1
        ''', (user_id, cutoff_date))
        previous = cursor.fetchone()
        
        conn.close()
        
        if not previous:
            return jsonify({
                'success': True,
                'data': {
                    'current': current[0],
                    'previous': None,
                    'difference': None,
                    'percent_change': None,
                    'trend': 'insufficient_data'
                }
            })
        
        difference = current[0] - previous[0]
        percent_change = round((difference / previous[0]) * 100, 1) if previous[0] > 0 else 0
        trend = 'improving' if difference > 0 else 'declining' if difference < 0 else 'stable'
        
        return jsonify({
            'success': True,
            'data': {
                'current': current[0],
                'previous': previous[0],
                'difference': difference,
                'percent_change': percent_change,
                'trend': trend,
                'period_days': days
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def calculate_index_from_history(workout_history):
    """Calculate index using the same algorithm as frontend JavaScript"""
    
    # Simplified version of the calculation logic
    # In practice, you'd want to port the full algorithm from JavaScript
    
    if not workout_history:
        return {
            'score': 0,
            'level': 'New User',
            'components': {},
            'insights': ['Start your first workout to begin tracking!'],
            'total_workouts': 0,
            'timestamp': datetime.now().isoformat()
        }
    
    # Basic calculations (simplified for example)
    total_workouts = len(workout_history)
    avg_calories = sum(w.get('calories', 0) for w in workout_history) / total_workouts
    avg_duration = sum(w.get('duration', 30) for w in workout_history) / total_workouts
    
    # Simplified component scores (0-100)
    consistency = min(100, (total_workouts / 10) * 100)  # 10 workouts = 100 points
    performance = min(100, (avg_calories / 500) * 100)   # 500 cal = 100 points
    improvement = 50  # Neutral for simplified version
    variety = len(set(w.get('workout_type', 'Unknown') for w in workout_history)) * 20
    intensity = 70  # Default intensity score
    
    # Weighted final score
    weights = {
        'consistency': 0.25,
        'performance': 0.25,
        'improvement': 0.20,
        'variety': 0.15,
        'intensity': 0.15
    }
    
    score = round(
        consistency * weights['consistency'] +
        performance * weights['performance'] +
        improvement * weights['improvement'] +
        variety * weights['variety'] +
        intensity * weights['intensity']
    )
    
    # Determine performance level
    if score >= 90: level = 'Elite Athlete'
    elif score >= 80: level = 'Advanced'
    elif score >= 70: level = 'Intermediate'
    elif score >= 60: level = 'Developing'
    elif score >= 40: level = 'Beginner'
    elif score >= 20: level = 'Getting Started'
    else: level = 'New User'
    
    # Generate insights
    insights = []
    if consistency < 50:
        insights.append('Try to workout more regularly for better results')
    if performance > 80:
        insights.append('Excellent workout intensity! Keep it up')
    if variety < 40:
        insights.append('Consider mixing different types of workouts')
    
    return {
        'score': max(0, min(100, score)),
        'level': level,
        'components': {
            'consistency': round(consistency),
            'performance': round(performance),
            'improvement': round(improvement),
            'variety': round(variety),
            'intensity': round(intensity)
        },
        'insights': insights or ['Keep up the great work!'],
        'total_workouts': total_workouts,
        'average_calories': round(avg_calories),
        'timestamp': datetime.now().isoformat()
    }

def save_index_to_db(user_id, index_data):
    """Save index data to database"""
    try:
        conn = sqlite3.connect('user_summary_index.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO user_index_history 
            (user_id, score, level, components, insights, total_workouts, average_calories)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (
            user_id,
            index_data['score'],
            index_data['level'],
            json.dumps(index_data['components']),
            json.dumps(index_data['insights']),
            index_data.get('total_workouts', 0),
            index_data.get('average_calories', 0)
        ))
        
        conn.commit()
        conn.close()
        return True
        
    except Exception as e:
        print(f"Error saving to database: {e}")
        return False

@app.route('/api/summary-index/export/<user_id>', methods=['GET'])
def export_user_data(user_id):
    """Export user's complete index data"""
    try:
        conn = sqlite3.connect('user_summary_index.db')
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT * FROM user_index_history 
            WHERE user_id = ? 
            ORDER BY created_at ASC
        ''', (user_id,))
        
        rows = cursor.fetchall()
        conn.close()
        
        export_data = []
        for row in rows:
            export_data.append({
                'id': row[0],
                'user_id': row[1],
                'score': row[2],
                'level': row[3],
                'components': json.loads(row[4]) if row[4] else {},
                'insights': json.loads(row[5]) if row[5] else [],
                'total_workouts': row[6],
                'average_calories': row[7],
                'created_at': row[8]
            })
        
        return jsonify({
            'success': True,
            'data': {
                'user_id': user_id,
                'export_date': datetime.now().isoformat(),
                'total_entries': len(export_data),
                'history': export_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/summary-index/health', methods=['GET'])
def health_check():
    """API health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'User Summary Index API',
        'version': '1.0.0',
        'timestamp': datetime.now().isoformat()
    })

if __name__ == '__main__':
    # Initialize database on startup
    init_db()
    
    # Run the API server
    port = int(os.environ.get('PORT', 5004))
    app.run(host='0.0.0.0', port=port, debug=True)
