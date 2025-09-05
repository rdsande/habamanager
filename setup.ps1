# Haba Manager Setup Script (PowerShell)
# This script will install dependencies and set up the application

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Haba Manager - Setup Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if running as administrator
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "Note: Running without administrator privileges" -ForegroundColor Yellow
    Write-Host "Some features may require elevated permissions" -ForegroundColor Yellow
    Write-Host ""
}

# Check if Node.js is installed
Write-Host "Checking Node.js installation..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js is installed: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please install Node.js:" -ForegroundColor Yellow
    Write-Host "1. Go to https://nodejs.org/" -ForegroundColor White
    Write-Host "2. Download the LTS version for Windows" -ForegroundColor White
    Write-Host "3. Run the installer and follow instructions" -ForegroundColor White
    Write-Host "4. Restart your computer after installation" -ForegroundColor White
    Write-Host "5. Run this setup script again" -ForegroundColor White
    Write-Host ""
    $openBrowser = Read-Host "Open Node.js download page? (y/n)"
    if ($openBrowser -eq 'y' -or $openBrowser -eq 'Y') {
        Start-Process "https://nodejs.org/"
    }
    exit 1
}

# Get script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Install frontend dependencies
Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
try {
    npm install
    Write-Host "✓ Frontend dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install frontend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

# Install backend dependencies
Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
Set-Location "backend"
try {
    npm install
    Write-Host "✓ Backend dependencies installed successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
    Read-Host "Press Enter to continue anyway"
}

# Set up environment file
Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "✓ Environment file created from template" -ForegroundColor Green
} else {
    Write-Host "✓ Environment file already exists" -ForegroundColor Green
}

# Initialize database
Write-Host "Initializing database..." -ForegroundColor Yellow
try {
    npm run init-db
    Write-Host "✓ Database initialized successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠ Database initialization failed, but continuing..." -ForegroundColor Yellow
}

Set-Location $scriptDir

# Create desktop shortcut
Write-Host "Creating desktop shortcut..." -ForegroundColor Yellow
$shortcutPath = "$env:USERPROFILE\Desktop\Haba Manager.lnk"
$targetPath = "$scriptDir\launch.bat"

try {
    $WshShell = New-Object -comObject WScript.Shell
    $Shortcut = $WshShell.CreateShortcut($shortcutPath)
    $Shortcut.TargetPath = $targetPath
    $Shortcut.WorkingDirectory = $scriptDir
    $Shortcut.Description = "Launch Haba Manager Application"
    $Shortcut.Save()
    
    if (Test-Path $shortcutPath) {
        Write-Host "✓ Desktop shortcut created successfully!" -ForegroundColor Green
    } else {
        Write-Host "⚠ Could not verify desktop shortcut creation" -ForegroundColor Yellow
    }
} catch {
    Write-Host "⚠ Could not create desktop shortcut: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Setup Complete!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Your Haba Manager application is now ready to use!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the application:" -ForegroundColor White
Write-Host "• Double-click the 'Haba Manager' shortcut on your desktop" -ForegroundColor White
Write-Host "• OR run launch.bat from this folder" -ForegroundColor White
Write-Host "• OR run launch.ps1 from this folder" -ForegroundColor White
Write-Host ""
Write-Host "The application will be available at:" -ForegroundColor White
Write-Host "• Frontend: http://localhost:8888" -ForegroundColor Cyan
Write-Host "• Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter to exit"