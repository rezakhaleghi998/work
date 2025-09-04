@echo off
echo 🔧 Fixing Fitness Tracker Rate Limiting Issue...
echo.

REM Stop any existing Node.js processes
echo 🛑 Stopping existing servers...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

REM Start the server
echo 🚀 Starting server with rate limiting fix...
echo.
echo ✅ Rate limiting has been disabled for development
echo 🔑 You can now login with demo/demo123 without rate limit errors
echo 🌐 Access the app at: http://localhost:3000
echo.

node server.js
