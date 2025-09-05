# Haba Manager Launcher (PowerShell)
# Enhanced version with better error handling and user experience

$Host.UI.RawUI.WindowTitle = "Haba Manager Launcher"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Haba Manager - Application Launcher" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Checking system requirements..." -ForegroundColor Yellow

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "✓ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js is not installed!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please run setup.ps1 first to install all requirements." -ForegroundColor Yellow
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

# Check if frontend dependencies are installed
if (-not (Test-Path "node_modules")) {
    Write-Host "⚠ Frontend dependencies not found!" -ForegroundColor Yellow
    Write-Host "Running setup first..." -ForegroundColor Yellow
    
    try {
        & ".\setup.ps1"
        if ($LASTEXITCODE -ne 0) {
            throw "Setup failed"
        }
    } catch {
        Write-Host "✗ Setup failed. Please check the errors above." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Check if backend dependencies are installed
$backendDir = Join-Path $scriptDir "backend"
if (-not (Test-Path "$backendDir\node_modules")) {
    Write-Host "⚠ Backend dependencies not found!" -ForegroundColor Yellow
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    
    Set-Location $backendDir
    try {
        npm install
        if ($LASTEXITCODE -ne 0) {
            throw "npm install failed"
        }
        Write-Host "✓ Backend dependencies installed" -ForegroundColor Green
    } catch {
        Write-Host "✗ Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location $scriptDir
}

# Check if .env file exists
if (-not (Test-Path "$backendDir\.env")) {
    Write-Host "Setting up environment configuration..." -ForegroundColor Yellow
    Copy-Item "$backendDir\.env.example" "$backendDir\.env"
    Write-Host "✓ Environment file created" -ForegroundColor Green
}

Write-Host ""
Write-Host "Starting Haba Manager..." -ForegroundColor Green
Write-Host ""

# Start the backend server in a new window
Write-Host "[1/2] Starting backend server..." -ForegroundColor Yellow
$backendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; Write-Host 'Backend Server Starting...' -ForegroundColor Green; npm start" -PassThru

# Wait for backend to start
Write-Host "[2/2] Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Start the frontend server in a new window
Write-Host "Starting frontend server..." -ForegroundColor Yellow
$frontendProcess = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$scriptDir'; Write-Host 'Frontend Server Starting...' -ForegroundColor Green; npm run serve" -PassThru

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "    Haba Manager is Starting!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Please wait a moment for both servers to start..." -ForegroundColor White
Write-Host ""
Write-Host "Your application will be available at:" -ForegroundColor White
Write-Host "• Frontend: http://localhost:8888" -ForegroundColor Cyan
Write-Host "• Backend API: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "The application will open automatically in your browser." -ForegroundColor White
Write-Host ""
Write-Host "To stop the application:" -ForegroundColor White
Write-Host "• Close both server windows" -ForegroundColor White
Write-Host "• Or press Ctrl+C in each server window" -ForegroundColor White
Write-Host ""

# Wait a bit more for servers to fully start
Start-Sleep -Seconds 3

# Test if backend server is responding
$maxAttempts = 10
$attempt = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -ErrorAction Stop
        Write-Host "✓ Backend server is responding" -ForegroundColor Green
        break
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "Waiting for backend server... (attempt $attempt/$maxAttempts)" -ForegroundColor Yellow
            Start-Sleep -Seconds 1
        } else {
            Write-Host "⚠ Backend server may not have started properly" -ForegroundColor Yellow
            Write-Host "Please check the backend server window for errors" -ForegroundColor Yellow
            break
        }
    }
} while ($attempt -lt $maxAttempts)

# Open the application in default browser
Write-Host "Opening application in browser..." -ForegroundColor Green
Start-Process "http://localhost:8888"

Write-Host ""
Write-Host "Press Enter to close this launcher window..." -ForegroundColor White
Write-Host "(The servers will continue running)" -ForegroundColor Gray
Read-Host