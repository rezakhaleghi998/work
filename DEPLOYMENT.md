# Deployment Instructions for Render

## Quick Start
1. Push your code to GitHub
2. Connect to Render and it will auto-deploy using render.yaml
3. Your app will be live at the provided URLs

## Manual Render Setup

### 1. Create PostgreSQL Database
1. Go to Render Dashboard
2. Click "New" → "PostgreSQL"
3. Name: `fitness-tracker-db`
4. Database Name: `fitness_tracker`
5. User: `fitness_user`
6. Plan: Free
7. Note the connection string

### 2. Create Backend Service
1. Click "New" → "Web Service"
2. Connect your GitHub repository
3. Name: `fitness-tracker-backend`
4. Environment: Node
5. Build Command: `cd server && npm install`
6. Start Command: `cd server && npm start`
7. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `JWT_SECRET` = (generate a random string)
   - `DATABASE_URL` = (from your PostgreSQL service)

### 3. Create Frontend Service
1. Click "New" → "Static Site"
2. Connect same GitHub repository
3. Name: `fitness-tracker-frontend`
4. Build Command: `cd client && npm install && npm run build`
5. Publish Directory: `client/build`

### 4. Database Setup
The database will auto-initialize with tables when the backend starts.

### 5. Demo Account
A demo account will be automatically created:
- Email: `demo`
- Password: `demo123`

## Testing
1. Backend: `https://your-backend-name.onrender.com/api/health`
2. Frontend: `https://your-frontend-name.onrender.com`
3. Login with demo account

## Environment Variables
- `NODE_ENV`: production
- `JWT_SECRET`: Random secure string
- `DATABASE_URL`: PostgreSQL connection string
- `CORS_ORIGIN`: Frontend URL (optional)

## Troubleshooting
- Check build logs in Render dashboard
- Ensure all dependencies are in package.json
- Verify environment variables are set
- Database connection issues: Check DATABASE_URL format
