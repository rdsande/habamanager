@echo off
echo Starting Haba Manager Application...
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

echo Starting backend server...
start "Haba Manager Backend" cmd /k "cd /d backend && npm start"

echo Waiting for backend to initialize...
timeout /t 3 /nobreak >nul

echo Starting frontend server...
start "Haba Manager Frontend" cmd /k "npm run serve"

echo.
echo Both servers are starting...
echo Backend will be available at: http://localhost:3001
echo Frontend will be available at: http://localhost:8888
echo.
echo Press any key to close this window (servers will continue running)
pause >nul