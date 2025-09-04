@echo off
echo 🚀 Fitness Tracker Deployment Script
echo =====================================

echo.
echo 📁 Step 1: Checking current directory...
cd /d "C:\Users\Rezvan\Desktop\workkkk\fitness-tracker-deployment"
echo Current directory: %CD%

echo.
echo 🔧 Step 2: Initializing Git repository...
git init

echo.
echo 🌐 Step 3: Setting up remote repository...
git remote remove origin 2>nul
git remote add origin https://github.com/rezakhaleghi998/work.git

echo.
echo 📦 Step 4: Adding essential files...
git add package.json
git add deploy_server.js
git add multi_db_server.js
git add professional_fitness_tracker.html
git add login.html
git add admin-dashboard.html
git add routes/
git add middleware/
git add config/
git add .env.example
git add .gitignore
git add README.md
git add *.md
git add Procfile

echo.
echo 💾 Step 5: Committing changes...
git commit -m "Deploy: Complete Fitness Tracker Application with multi-database support"

echo.
echo 🚀 Step 6: Pushing to repository...
git branch -M main
git push -u origin main --force

echo.
echo ✅ Deployment Complete!
echo.
echo 📍 Your repository: https://github.com/rezakhaleghi998/work
echo 🚀 Ready to deploy to Railway/Render/Vercel!
echo.
echo Next steps:
echo 1. Go to your hosting platform (Railway/Render)
echo 2. Connect the repository: https://github.com/rezakhaleghi998/work
echo 3. Set environment variable: JWT_SECRET=your-secret-key
echo 4. Deploy!
echo.
pause
