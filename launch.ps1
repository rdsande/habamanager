# Haba Manager Launcher (PowerShell)
Write-Host "Starting Haba Manager..." -ForegroundColor Green
Write-Host ""

# Check if Node.js is installed
try {
    $nodeVersion = node --version 2>$null
    Write-Host "Node.js version: $nodeVersion" -ForegroundColor Cyan
} catch {
    Write-Host "Error: Node.js is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

# Get the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$backendDir = Join-Path $scriptDir "backend"

# Navigate to backend directory
Set-Location $backendDir

# Install dependencies if node_modules doesn't exist
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error: Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

# Start the backend server in a new window
Write-Host "Starting backend server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendDir'; npm run dev"

# Wait for server to start
Write-Host "Waiting for server to start..." -ForegroundColor Cyan
Start-Sleep -Seconds 3

# Test if server is responding
$maxAttempts = 10
$attempt = 0
do {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3001" -TimeoutSec 2 -ErrorAction Stop
        break
    } catch {
        $attempt++
        if ($attempt -lt $maxAttempts) {
            Write-Host "Waiting for server... (attempt $attempt/$maxAttempts)" -ForegroundColor Cyan
            Start-Sleep -Seconds 1
        } else {
            Write-Host "Warning: Server may not have started properly" -ForegroundColor Yellow
            break
        }
    }
} while ($attempt -lt $maxAttempts)

# Open the application in default browser
Write-Host "Opening Haba Manager in browser..." -ForegroundColor Green
Start-Process "http://localhost:3001"

Write-Host ""
Write-Host "Haba Manager is now running!" -ForegroundColor Green
Write-Host "Backend server: http://localhost:3001" -ForegroundColor Cyan
Write-Host ""
Write-Host "To stop the application, close the backend server window." -ForegroundColor Yellow
Write-Host ""
Read-Host "Press Enter to exit this launcher"