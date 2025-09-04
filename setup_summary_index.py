"""
Setup script for User Summary Index system
Run this to initialize the backend API (optional)
"""

import os
import sys
import subprocess
import sqlite3

def check_requirements():
    """Check if required packages are installed"""
    try:
        import flask
        import flask_cors
        print("✅ Flask and Flask-CORS are available")
        return True
    except ImportError as e:
        print(f"❌ Missing required packages: {e}")
        print("Please install required packages:")
        print("pip install flask flask-cors")
        return False

def initialize_database():
    """Initialize the SQLite database for index storage"""
    try:
        conn = sqlite3.connect('user_summary_index.db')
        cursor = conn.cursor()
        
        # Create table for index history
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_index_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id TEXT NOT NULL,
                score INTEGER NOT NULL,
                level TEXT NOT NULL,
                components TEXT NOT NULL,
                insights TEXT,
                total_workouts INTEGER DEFAULT 0,
                average_calories INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # Create index for efficient queries
        cursor.execute('CREATE INDEX IF NOT EXISTS idx_user_date ON user_index_history(user_id, created_at)')
        
        conn.commit()
        conn.close()
        
        print("✅ Database initialized successfully")
        return True
        
    except Exception as e:
        print(f"❌ Database initialization failed: {e}")
        return False

def start_api_server():
    """Start the Summary Index API server"""
    try:
        print("🚀 Starting User Summary Index API server...")
        print("API will be available at: http://localhost:5004")
        print("Health check: http://localhost:5004/api/summary-index/health")
        print("\nPress Ctrl+C to stop the server")
        
        subprocess.run([sys.executable, 'summary_index_api.py'])
        
    except KeyboardInterrupt:
        print("\n👋 API server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start API server: {e}")

def run_frontend_test():
    """Open the fitness tracker in browser for testing"""
    import webbrowser
    import os
    
    html_file = os.path.abspath('professional_fitness_tracker.html')
    
    if os.path.exists(html_file):
        print(f"🌐 Opening fitness tracker in browser...")
        print(f"File: {html_file}")
        webbrowser.open(f'file://{html_file}')
        print("✅ Fitness tracker opened in browser")
        print("\n📋 Testing Instructions:")
        print("1. Fill out a workout form and click 'Predict Calories'")
        print("2. Look for the 'Fitness Performance Index' panel in the results")
        print("3. Complete multiple workouts to see score changes")
        print("4. Click 'View History' to see historical data")
        print("5. Open browser console to see system logs")
    else:
        print(f"❌ HTML file not found: {html_file}")

def main():
    print("🏃‍♂️ User Summary Index Setup")
    print("="*50)
    
    while True:
        print("\nChoose an option:")
        print("1. Initialize Database (SQLite)")
        print("2. Start API Server (Optional - for backend integration)")
        print("3. Open Fitness Tracker (Test Frontend Integration)")
        print("4. Check Requirements")
        print("5. Exit")
        
        choice = input("\nEnter your choice (1-5): ").strip()
        
        if choice == '1':
            print("\n📊 Initializing Database...")
            initialize_database()
            
        elif choice == '2':
            print("\n🚀 Starting API Server...")
            if check_requirements():
                initialize_database()
                start_api_server()
            
        elif choice == '3':
            print("\n🌐 Opening Fitness Tracker...")
            run_frontend_test()
            
        elif choice == '4':
            print("\n🔍 Checking Requirements...")
            check_requirements()
            
        elif choice == '5':
            print("\n👋 Goodbye!")
            break
            
        else:
            print("❌ Invalid choice. Please try again.")

if __name__ == '__main__':
    main()
