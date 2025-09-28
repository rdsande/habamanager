@echo off
echo ========================================
echo    Haba Manager - Setup Script
echo ========================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo.
    echo ERROR: Node.js is not installed!
    echo.
    echo Please follow these steps:
    echo 1. Go to https://nodejs.org/
    echo 2. Download the LTS version for Windows
    echo 3. Run the installer and follow the instructions
    echo 4. Restart your computer after installation
    echo 5. Run this setup script again
    echo.
    echo Press any key to open Node.js download page...
    pause >nul
    start https://nodejs.org/
    exit /b 1
)

echo Node.js is installed!
node --version
echo.

echo Installing frontend dependencies...
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd backend
npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Setting up environment configuration...
if not exist ".env" (
    copy ".env.example" ".env"
    echo Environment file created from template
) else (
    echo Environment file already exists
)

echo.
echo Initializing database...
npm run init-db
if %errorlevel% neq 0 (
    echo WARNING: Database initialization failed, but continuing...
)

cd ..

echo.
echo Creating desktop shortcut...
set "shortcutPath=%USERPROFILE%\Desktop\Haba Manager.lnk"
set "targetPath=%CD%\launch.bat"
set "iconPath=%CD%\launch.bat"

powershell -Command "$WshShell = New-Object -comObject WScript.Shell; $Shortcut = $WshShell.CreateShortcut('%shortcutPath%'); $Shortcut.TargetPath = '%targetPath%'; $Shortcut.WorkingDirectory = '%CD%'; $Shortcut.Description = 'Launch Haba Manager Application'; $Shortcut.Save()"

if exist "%shortcutPath%" (
    echo Desktop shortcut created successfully!
) else (
    echo WARNING: Could not create desktop shortcut
)

echo.
echo ========================================
echo    Setup Complete!
echo ========================================
echo.
echo Your Haba Manager application is now ready to use!
echo.
echo To start the application:
echo - Double-click the "Haba Manager" shortcut on your desktop
echo - OR run launch.bat from this folder
echo - OR run launch.ps1 from this folder
echo.
echo The application will be available at:
echo - Frontend: http://localhost:8888
echo - Backend API: http://localhost:3001
echo.
echo Press any key to exit...
pause >nul