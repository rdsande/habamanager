@echo off
echo Starting Haba Manager Application...
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Start backend server in background
echo Starting backend server...
start "Haba Manager Backend" /min cmd /c "cd /d "%~dp0backend" && node server.js"

:: Wait a moment for backend to start
timeout /t 3 /nobreak >nul

:: Start frontend server
echo Starting frontend server...
echo.
echo Backend server: http://localhost:3001
echo Frontend server: http://localhost:8888
echo.
echo The application will open in your default browser shortly...
echo Press Ctrl+C to stop the servers when done.
echo.

:: Start frontend server (this will keep the window open)
cd /d "%~dp0"
npm run serve

pause