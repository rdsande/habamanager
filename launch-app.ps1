# Haba Manager - Smart Application Launcher
# This script automatically starts both backend and frontend servers

param(
    [switch]$NoOpen = $false
)

# Set console title
$Host.UI.RawUI.WindowTitle = "Haba Manager - Starting Application..."

# Color functions
function Write-Step($message, $step, $total) {
    Write-Host "[$step/$total] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
    Write-Host "✓ $message" -ForegroundColor Green
}

function Write-Warning($message) {
    Write-Host "⚠ $message" -ForegroundColor Yellow
}

function Write-Error($message) {
    Write-Host "✗ $message" -ForegroundColor Red
}

# Header
Write-Host "========================================" -ForegroundColor Magenta
Write-Host "   HABA MANAGER - SMART LAUNCHER" -ForegroundColor Magenta
Write-Host "========================================" -ForegroundColor Magenta
Write-Host ""

try {
    # Step 1: Check Node.js
    Write-Step "Checking Node.js installation..." 1 7
    try {
        $nodeVersion = node --version 2>$null
        if ($LASTEXITCODE -eq 0) {
            Write-Success "Node.js is installed ($nodeVersion)"
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Error "Node.js is not installed or not in PATH"
        Write-Host "Please install Node.js from https://nodejs.org/" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Get script directory
    $scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
    $backendDir = Join-Path $scriptDir "backend"

    # Step 2: Check backend directory
    Write-Step "Checking backend directory..." 2 7
    if (-not (Test-Path $backendDir)) {
        Write-Error "Backend directory not found at $backendDir"
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Success "Backend directory found"

    # Step 3: Check and install backend dependencies
    Write-Step "Checking backend dependencies..." 3 7
    $backendNodeModules = Join-Path $backendDir "node_modules"
    if (-not (Test-Path $backendNodeModules)) {
        Write-Host "Installing backend dependencies..." -ForegroundColor Yellow
        Push-Location $backendDir
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
        } finally {
            Pop-Location
        }
    }
    Write-Success "Backend dependencies ready"

    # Step 4: Check and install frontend dependencies
    Write-Step "Checking frontend dependencies..." 4 7
    $frontendNodeModules = Join-Path $scriptDir "node_modules"
    if (-not (Test-Path $frontendNodeModules)) {
        Write-Host "Installing frontend dependencies..." -ForegroundColor Yellow
        Push-Location $scriptDir
        try {
            npm install
            if ($LASTEXITCODE -ne 0) {
                throw "npm install failed"
            }
        } finally {
            Pop-Location
        }
    }
    Write-Success "Frontend dependencies ready"

    # Step 5: Clean up existing processes
    Write-Step "Cleaning up existing processes..." 5 7
    try {
        # Kill processes using our ports
        Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Fallback method using netstat
        $processes = netstat -ano | Select-String ":3001|:8888" | ForEach-Object {
            ($_ -split "\s+")[-1]
        } | Sort-Object -Unique
        
        foreach ($pid in $processes) {
            if ($pid -and $pid -ne "0") {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            }
        }
    }
    Write-Success "Ports cleaned up"

    # Step 6: Start backend server
    Write-Step "Starting backend server..." 6 7
    $backendProcess = Start-Process -FilePath "node" -ArgumentList "server.js" -WorkingDirectory $backendDir -WindowStyle Minimized -PassThru
    Write-Host "Backend server starting (PID: $($backendProcess.Id))..." -ForegroundColor Yellow

    # Wait and test backend
    Write-Host "Waiting for backend to initialize..." -ForegroundColor Yellow
    $backendReady = $false
    for ($i = 1; $i -le 15; $i++) {
        Start-Sleep -Seconds 1
        try {
            $response = Invoke-WebRequest -Uri "http://localhost:3001/api/health" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
            if ($response.StatusCode -eq 200) {
                $backendReady = $true
                break
            }
        } catch {
            # Continue waiting
        }
        Write-Host "." -NoNewline -ForegroundColor Yellow
    }
    Write-Host ""

    if ($backendReady) {
        Write-Success "Backend server is running on http://localhost:3001"
    } else {
        Write-Warning "Backend server may still be starting..."
    }

    # Step 7: Start frontend server
    Write-Step "Starting frontend server..." 7 7
    $frontendProcess = Start-Process -FilePath "npx" -ArgumentList "http-server", "-p", "8888", "-c-1", "--cors" -WorkingDirectory $scriptDir -WindowStyle Minimized -PassThru
    Write-Host "Frontend server starting (PID: $($frontendProcess.Id))..." -ForegroundColor Yellow

    # Wait for frontend
    Start-Sleep -Seconds 3
    Write-Success "Frontend server is running on http://localhost:8888"

    # Success message
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "  APPLICATION STARTED SUCCESSFULLY!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Frontend: http://localhost:8888" -ForegroundColor Cyan
    Write-Host "Backend:  http://localhost:3001" -ForegroundColor Cyan
    Write-Host ""

    # Open browser
    if (-not $NoOpen) {
        Write-Host "Opening application in browser..." -ForegroundColor Yellow
        Start-Process "http://localhost:8888"
    }

    Write-Host "The application is now running in your browser." -ForegroundColor Green
    Write-Host "Keep this window open to maintain the servers." -ForegroundColor Yellow
    Write-Host "Press any key to stop the servers and exit." -ForegroundColor Yellow
    Write-Host ""

    # Wait for user input
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

} catch {
    Write-Error "An error occurred: $($_.Exception.Message)"
    Read-Host "Press Enter to exit"
    exit 1
} finally {
    # Cleanup
    Write-Host ""
    Write-Host "Stopping servers..." -ForegroundColor Yellow
    
    try {
        # Kill processes using our ports
        Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
        Get-NetTCPConnection -LocalPort 8888 -ErrorAction SilentlyContinue | ForEach-Object {
            Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue
        }
    } catch {
        # Fallback cleanup
        if ($backendProcess -and -not $backendProcess.HasExited) {
            Stop-Process -Id $backendProcess.Id -Force -ErrorAction SilentlyContinue
        }
        if ($frontendProcess -and -not $frontendProcess.HasExited) {
            Stop-Process -Id $frontendProcess.Id -Force -ErrorAction SilentlyContinue
        }
    }
    
    Write-Success "Servers stopped. Goodbye!"
    Start-Sleep -Seconds 2
}