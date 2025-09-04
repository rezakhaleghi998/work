# Railway Deployment Configuration
# This file tells Railway how to run your fitness tracker app

# Railway will automatically detect the Node.js app from package.json
# No additional configuration needed - Railway reads package.json "start" script

# Environment Variables you need to set in Railway Dashboard:
# NODE_ENV=production
# PORT=3000 (Railway sets this automatically)
# JWT_SECRET=your-super-secret-jwt-key-here
# DB_HOST=your-database-host (optional, will use SQLite if not provided)
# DB_USER=your-database-user (optional)
# DB_PASSWORD=your-database-password (optional)
# DB_NAME=fitness_tracker (optional)

# Instructions:
# 1. Create account at railway.app
# 2. Connect your GitHub repository
# 3. Deploy from main branch
# 4. Set environment variables in Railway dashboard
# 5. Your app will be available at: https://your-app-name.railway.app
