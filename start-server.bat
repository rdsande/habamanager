@echo off
echo Starting Haba Manager Backend Server...
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

echo Navigating to backend directory...
cd /d "%~dp0backend"

echo Checking backend dependencies...
if not exist "node_modules" (
    echo Installing backend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

echo Starting backend server...
npm start

if %errorlevel% neq 0 (
    echo ERROR: Failed to start backend server
    pause
    exit /b 1
)

echo.
echo Backend server stopped.
pause