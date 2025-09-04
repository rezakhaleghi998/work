# 📁 Essential Files for Deployment

## ✅ **Core Application Files (REQUIRED):**
- package.json
- deploy_server.js (main server)
- multi_db_server.js (multi-database server)
- professional_fitness_tracker.html (main app)
- login.html (login page)
- admin-dashboard.html (admin panel)

## ✅ **Configuration Files:**
- .env.example (environment template)
- Procfile (for Heroku)

## ✅ **Routes Directory:**
- routes/auth.js
- routes/admin.js
- routes/fitness.js
- routes/users.js

## ✅ **Middleware Directory:**
- middleware/auth.js

## ✅ **Database Configuration:**
- config/simple_database.js (simple SQLite)
- config/multi_database.js (multi-database support)

## ✅ **Frontend Assets:**
- js/ directory (all JavaScript files)
- css/ directory (if any)
- Any images or static assets

## ✅ **Documentation:**
- README.md
- DEPLOYMENT_GUIDE.md
- DATABASE_GUIDE.md
- COMPLETE_DATABASE_GUIDE.md

## ❌ **Files to EXCLUDE:**
- node_modules/ (will be installed by npm)
- .env (contains secrets)
- fitness_tracker.db (database file)
- __pycache__/ 
- *.log files
- .DS_Store
- Thumbs.db

## 🔧 **Git Commands to Deploy:**

```bash
# 1. Initialize git in your project
cd "C:\Users\Rezvan\Desktop\workkkk\fitness-tracker-deployment"
git init

# 2. Add remote repository
git remote add origin https://github.com/rezakhaleghi998/work.git

# 3. Add all essential files
git add package.json
git add deploy_server.js
git add multi_db_server.js
git add *.html
git add routes/
git add middleware/
git add config/
git add js/
git add *.md
git add .env.example
git add Procfile

# 4. Commit changes
git commit -m "Initial fitness tracker deployment"

# 5. Push to repository
git branch -M main
git push -u origin main --force
```
