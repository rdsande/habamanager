@echo off
setlocal enabledelayedexpansion

:: Set window title
title Haba Manager - Starting Application...

echo ========================================
echo    HABA MANAGER - SMART LAUNCHER
echo ========================================
echo.

:: Check if Node.js is installed
echo [1/6] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    echo.
    pause
    exit /b 1
)
echo ✓ Node.js is installed

:: Get script directory
set "SCRIPT_DIR=%~dp0"
set "BACKEND_DIR=%SCRIPT_DIR%backend"

:: Check if backend directory exists
echo [2/6] Checking backend directory...
if not exist "%BACKEND_DIR%" (
    echo ERROR: Backend directory not found at %BACKEND_DIR%
    echo Please ensure the backend folder exists in the application directory.
    echo.
    pause
    exit /b 1
)
echo ✓ Backend directory found

:: Check if backend dependencies are installed
echo [3/6] Checking backend dependencies...
if not exist "%BACKEND_DIR%\node_modules" (
    echo Installing backend dependencies...
    cd /d "%BACKEND_DIR%"
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)
echo ✓ Backend dependencies ready

:: Check if frontend dependencies are installed
echo [4/6] Checking frontend dependencies...
cd /d "%SCRIPT_DIR%"
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)
echo ✓ Frontend dependencies ready

:: Kill any existing processes on our ports
echo [5/6] Cleaning up existing processes...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo ✓ Ports cleaned up

:: Start backend server
echo [6/6] Starting servers...
echo Starting backend server on port 3001...
start "Haba Manager Backend" /min cmd /c "cd /d \"%BACKEND_DIR%\" && node server.js"

:: Wait for backend to start
echo Waiting for backend to initialize...
timeout /t 5 /nobreak >nul

:: Test backend connection
set "BACKEND_READY=0"
for /l %%i in (1,1,10) do (
    curl -s http://localhost:3001/api/health >nul 2>&1
    if !errorlevel! equ 0 (
        set "BACKEND_READY=1"
        goto :backend_ready
    )
    timeout /t 1 /nobreak >nul
)

:backend_ready
if !BACKEND_READY! equ 1 (
    echo ✓ Backend server is running
) else (
    echo ⚠ Backend server may still be starting...
)

:: Start frontend server
echo Starting frontend server on port 8888...
start "Haba Manager Frontend" cmd /c "cd /d \"%SCRIPT_DIR%\" && npx http-server -p 8888 -c-1 -o --cors"

:: Wait a moment for frontend to start
timeout /t 3 /nobreak >nul

:: Open application in browser
echo Opening application in browser...
start http://localhost:8888

echo.
echo ========================================
echo   APPLICATION STARTED SUCCESSFULLY!
echo ========================================
echo.
echo Frontend: http://localhost:8888
echo Backend:  http://localhost:3001
echo.
echo The application is now running in your browser.
echo Keep this window open to maintain the servers.
echo Press any key to stop the servers and exit.
echo.
pause >nul

:: Cleanup - kill the server processes
echo Stopping servers...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    taskkill /f /pid %%a >nul 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8888') do (
    taskkill /f /pid %%a >nul 2>&1
)
echo Servers stopped. Goodbye!
timeout /t 2 /nobreak >nul
exit