@echo off
title Haba Manager Launcher
color 0A

echo ========================================
echo    Haba Manager - Application Launcher
echo ========================================
echo.

echo Checking system requirements...

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo.
    echo Please run setup.bat first to install all requirements.
    echo.
    pause
    exit /b 1
)

echo Node.js version:
node --version
echo.

:: Check if dependencies are installed
if not exist "node_modules" (
    echo WARNING: Frontend dependencies not found!
    echo Running setup first...
    call setup.bat
    if %errorlevel% neq 0 (
        echo Setup failed. Please check the errors above.
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo WARNING: Backend dependencies not found!
    echo Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo Failed to install backend dependencies.
        pause
        exit /b 1
    )
    cd ..
)

:: Check if .env file exists
if not exist "backend\.env" (
    echo Setting up environment configuration...
    cd backend
    copy ".env.example" ".env" >nul
    cd ..
)

echo Starting Haba Manager...
echo.

echo [1/2] Starting backend server...
start "Haba Manager Backend" /min cmd /k "cd /d \"%~dp0backend\" & echo Backend Server Starting... & npm start"

echo [2/2] Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

echo Starting frontend server...
start "Haba Manager Frontend" /min cmd /k "cd /d \"%~dp0\" & echo Frontend Server Starting... & npm run serve"

echo.
echo ========================================
echo    Haba Manager is Starting!
echo ========================================
echo.
echo Please wait a moment for both servers to start...
echo.
echo Your application will be available at:
echo • Frontend: http://localhost:8888
echo • Backend API: http://localhost:3001
echo.
echo The application will open automatically in your browser.
echo.
echo To stop the application:
echo • Close both server windows
echo • Or press Ctrl+C in each server window
echo.

:: Wait a bit more and then open browser
timeout /t 3 /nobreak >nul
echo Opening application in browser...
start http://localhost:8888

echo.
echo Press any key to close this launcher window...
echo (The servers will continue running)
pause >nul