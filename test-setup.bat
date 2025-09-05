@echo off
echo ========================================
echo    Haba Manager - Setup Test
echo ========================================
echo.

echo Testing system requirements...
echo.

:: Test Node.js installation
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ✗ FAIL: Node.js is not installed
    echo Please install Node.js from https://nodejs.org/
    goto :end
) else (
    echo ✓ PASS: Node.js is installed
    node --version
)

echo.

:: Test frontend dependencies
echo [2/5] Checking frontend dependencies...
if exist "node_modules" (
    echo ✓ PASS: Frontend dependencies are installed
) else (
    echo ✗ FAIL: Frontend dependencies missing
    echo Run setup.bat to install dependencies
    goto :end
)

echo.

:: Test backend dependencies
echo [3/5] Checking backend dependencies...
if exist "backend\node_modules" (
    echo ✓ PASS: Backend dependencies are installed
) else (
    echo ✗ FAIL: Backend dependencies missing
    echo Run setup.bat to install dependencies
    goto :end
)

echo.

:: Test environment configuration
echo [4/5] Checking environment configuration...
if exist "backend\.env" (
    echo ✓ PASS: Environment file exists
) else (
    echo ✗ FAIL: Environment file missing
    echo Run setup.bat to create .env file
    goto :end
)

echo.

:: Test desktop shortcut
echo [5/5] Checking desktop shortcut...
if exist "%USERPROFILE%\Desktop\Haba Manager.lnk" (
    echo ✓ PASS: Desktop shortcut exists
) else (
    echo ⚠ WARNING: Desktop shortcut not found
    echo This is optional - you can still use launch.bat
)

echo.
echo ========================================
echo    Test Results
echo ========================================
echo.
echo ✓ Your Haba Manager setup appears to be complete!
echo.
echo To start the application:
echo • Double-click "Haba Manager" shortcut on desktop
echo • OR double-click launch.bat
echo • OR run launch.ps1
echo.
echo The application will be available at:
echo • Frontend: http://localhost:8888
echo • Backend: http://localhost:3001
echo.

:end
echo Press any key to exit...
pause >nul