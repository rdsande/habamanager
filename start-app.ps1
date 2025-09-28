# Haba Manager Application Startup Script
Write-Host "Starting Haba Manager Application..." -ForegroundColor Green
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

# Check if backend directory exists
if (-not (Test-Path $backendDir)) {
    Write-Host "Error: Backend directory not found at $backendDir" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Start backend server in background
Write-Host "Starting backend server..." -ForegroundColor Yellow
try {
    $backendProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Minimized -PassThru
    Write-Host "Backend server started (PID: $($backendProcess.Id))" -ForegroundColor Green
} catch {
    Write-Host "Error starting backend server: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

# Wait for backend to start
Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

# Test backend connection
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 5 -UseBasicParsing
    Write-Host "Backend server is running successfully!" -ForegroundColor Green
} catch {
    Write-Host "Warning: Backend server may not be fully ready yet" -ForegroundColor Yellow
}

# Display server information
Write-Host ""
Write-Host "=== Server Information ===" -ForegroundColor Cyan
Write-Host "Backend server: http://localhost:3001" -ForegroundColor White
Write-Host "Frontend server: http://localhost:8888" -ForegroundColor White
Write-Host "=========================" -ForegroundColor Cyan
Write-Host ""
Write-Host "The application will start in your default browser shortly..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the servers when done." -ForegroundColor Yellow
Write-Host ""

# Start frontend server
Write-Host "Starting frontend server..." -ForegroundColor Yellow
try {
    Set-Location $scriptDir
    
    # Check if http-server is available
    $httpServerAvailable = $false
    try {
        npx http-server --version 2>$null | Out-Null
        $httpServerAvailable = $true
    } catch {
        Write-Host "http-server not found, trying alternative..." -ForegroundColor Yellow
    }
    
    if ($httpServerAvailable) {
        # Use http-server
        npx http-server -p 8888 -c-1 -o
    } else {
        # Fallback to Python HTTP server
        Write-Host "Using Python HTTP server as fallback..." -ForegroundColor Yellow
        python -m http.server 8888
    }
} catch {
    Write-Host "Error starting frontend server: $_" -ForegroundColor Red
    Write-Host "Stopping backend server..." -ForegroundColor Yellow
    Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
    Read-Host "Press Enter to exit"
    exit 1
}

# Cleanup on exit
Write-Host "Stopping servers..." -ForegroundColor Yellow
Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
Write-Host "Servers stopped. Goodbye!" -ForegroundColor Green