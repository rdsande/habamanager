# Haba Manager - PowerShell Startup Script
# This script starts a local web server for the Haba Manager application

Write-Host "=================================" -ForegroundColor Green
Write-Host "    Haba Manager Startup" -ForegroundColor Green
Write-Host "=================================" -ForegroundColor Green
Write-Host ""

# Check if Python is installed
try {
    $pythonVersion = python --version 2>$null
    if ($pythonVersion) {
        Write-Host "Python found: $pythonVersion" -ForegroundColor Green
    } else {
        throw "Python not found"
    }
} catch {
    Write-Host "ERROR: Python is not installed or not in PATH" -ForegroundColor Red
    Write-Host "Please install Python from: https://www.python.org/downloads/" -ForegroundColor Yellow
    Write-Host "Make sure to check 'Add Python to PATH' during installation" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting web server..." -ForegroundColor Yellow
Write-Host "Server will be available at: http://localhost:8888" -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the Python HTTP server
try {
    python -m http.server 8888
} catch {
    Write-Host "ERROR: Failed to start server" -ForegroundColor Red
    Write-Host "Make sure port 8888 is not already in use" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Server stopped." -ForegroundColor Yellow
Read-Host "Press Enter to exit"