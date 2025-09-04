# 🗄️ Database Configuration Guide

Your fitness tracker now supports **multiple database types**! The app will automatically try to connect in this order:

1. **MySQL** (if DB_HOST is provided)
2. **PostgreSQL** (if DATABASE_URL is provided) 
3. **SQLite** (fallback - always works)

## 📊 Database Support

### ✅ Currently Supported:
- **SQLite** - Local file database (default)
- **MySQL** - Popular relational database
- **PostgreSQL** - Advanced open-source database

## 🔧 Configuration Options

### Option 1: SQLite (No Setup Required)
```env
# No environment variables needed
# Will create fitness_tracker.db automatically
```

### Option 2: MySQL Database
```env
DB_HOST=your-mysql-host.com
DB_PORT=3306
DB_USER=your_username
DB_PASSWORD=your_password
DB_NAME=fitness_tracker
```

### Option 3: PostgreSQL Database
```env
DATABASE_URL=postgresql://username:password@hostname:port/database
```

## 🌐 Popular Hosting Services

### Railway (PostgreSQL)
```env
# Railway provides this automatically:
DATABASE_URL=${{DATABASE_URL}}
```

### Render (PostgreSQL)
```env
DATABASE_URL=postgresql://user:pass@hostname:5432/dbname
```

### PlanetScale (MySQL)
```env
DB_HOST=your-host.planetscale.dev
DB_USER=your-username
DB_PASSWORD=your-password
DB_NAME=your-database
```

### AWS RDS (MySQL/PostgreSQL)
```env
DB_HOST=your-rds-endpoint.amazonaws.com
DB_USER=admin
DB_PASSWORD=your-password
DB_NAME=fitness_tracker
```

### Supabase (PostgreSQL)
```env
DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres
```

## 🚀 Deployment with Different Databases

### For Railway:
1. Deploy your app
2. Add PostgreSQL addon
3. Railway automatically sets DATABASE_URL
4. Your app will use PostgreSQL!

### For Render:
1. Create PostgreSQL database
2. Get connection string
3. Set DATABASE_URL environment variable
4. Deploy your app

### For MySQL (any host):
1. Create MySQL database
2. Set DB_HOST, DB_USER, DB_PASSWORD, DB_NAME
3. Deploy your app

## 🔄 How It Works

The app tries databases in this order:
1. **Checks for DB_HOST** → Uses MySQL
2. **Checks for DATABASE_URL** → Uses PostgreSQL  
3. **Fallback** → Uses SQLite

## 📝 Server Files

- `multi_db_server.js` - Server with multi-database support
- `config/multi_database.js` - Database manager
- `deploy_server.js` - Simple server (SQLite only)

## 🎯 Quick Start Commands

```bash
# With multi-database support
node multi_db_server.js

# Simple deployment (SQLite only)
node deploy_server.js

# Production start
npm start
```

## ✅ Status Check

Visit `/api/health` to see which database is being used:
```json
{
  "status": "healthy",
  "database": "sqlite", // or "mysql" or "postgresql"
  "timestamp": "2025-09-04T21:45:00.000Z"
}
```

Your app now supports any database you want! 🎉
