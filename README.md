# Professional Fitness Tracker - Render Deployment

A full-stack fitness tracking application with calorie prediction, user authentication, and admin dashboard. Deployed on Render with PostgreSQL database integration.

## 🚀 Live Demo

- **Frontend**: https://fitness-tracker-frontend.onrender.com
- **Backend API**: https://fitness-tracker-backend.onrender.com/api
- **Demo Account**: Email: `demo`, Password: `demo123`

## ✨ Features

- 🔐 **User Authentication** - Secure login/registration system
- 📊 **Admin Dashboard** - Complete admin panel with analytics
- 💪 **Workout Tracking** - Log and track workouts and exercises
- 📈 **Analytics** - Performance tracking and insights
- 🗄️ **Multi-Database Support** - SQLite, MySQL, PostgreSQL
- 📱 **Responsive Design** - Works on all devices
- 🛡️ **Security** - Rate limiting, JWT tokens, bcrypt passwords

## 🚀 Quick Deploy

### Railway (Recommended)
1. Fork this repository
2. Connect to [Railway](https://railway.app)
3. Add PostgreSQL service
4. Set `JWT_SECRET=your-secret-key`
5. Deploy!

### Render
1. Fork this repository
2. Connect to [Render](https://render.com)
3. Build: `npm install`
4. Start: `npm start`
5. Add environment variables

## 🗄️ Database Options

The app automatically detects and uses databases in this order:

1. **PostgreSQL** (if `DATABASE_URL` is set)
2. **MySQL** (if `DB_HOST` is set)
3. **SQLite** (fallback - always works)

### Environment Variables
```env
# Required
JWT_SECRET=your-super-secret-jwt-key

# Optional - PostgreSQL
DATABASE_URL=postgresql://user:pass@host:5432/db

# Optional - MySQL
DB_HOST=your-mysql-host.com
DB_USER=username
DB_PASSWORD=password
DB_NAME=fitness_tracker
```

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Start with SQLite (simple)
npm start

# Start with multi-database support
npm run start:multi-db

# Development mode
npm run dev
```

## 📱 Application URLs

- **Main App**: `/`
- **Login**: `/login`
- **Admin Dashboard**: `/admin`
- **Health Check**: `/api/health`

## 🔐 Default Credentials

- **Username**: `admin`
- **Password**: `admin123`

*Change these in production!*

## 🚀 Production Deployment

1. **Set Environment Variables**:
   ```env
   NODE_ENV=production
   JWT_SECRET=your-secure-secret-key
   ```

2. **Choose Database**:
   - SQLite: No additional setup
   - PostgreSQL: Set `DATABASE_URL`
   - MySQL: Set `DB_HOST`, `DB_USER`, `DB_PASSWORD`

3. **Deploy**:
   ```bash
   npm install
   npm start
   ```

---

**Ready to deploy your fitness tracker!** 🎉