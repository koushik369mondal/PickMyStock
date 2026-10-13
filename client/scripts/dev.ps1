# PickMyStock Root Launcher Script (PowerShell)
# Starts Server (Port 5000) and Client (Port 5173) concurrently with full error checking and cleanup.

$ErrorActionPreference = "Stop"

$RootDir = (Get-Item $PSScriptRoot).Parent.FullName
$ServerDir = Join-Path $RootDir "server"
$ClientDir = Join-Path $RootDir "client"
$DevMjs = Join-Path $PSScriptRoot "dev.mjs"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "  PickMyStock: Concurrent Development Launcher" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "Root Directory:   $RootDir" -ForegroundColor Gray
Write-Host "Server Directory: $ServerDir" -ForegroundColor Gray
Write-Host "Client Directory: $ClientDir" -ForegroundColor Gray
Write-Host ""

# 1. Validation checks
if (-not (Test-Path $ServerDir)) {
    Write-Error "Error: Server directory not found at $ServerDir"
    exit 1
}

if (-not (Test-Path $ClientDir)) {
    Write-Error "Error: Client directory not found at $ClientDir"
    exit 1
}

if (-not (Test-Path (Join-Path $ServerDir "node_modules"))) {
    Write-Error "Error: Server dependencies missing. Run 'cd server; npm install' first."
    exit 1
}

if (-not (Test-Path (Join-Path $ClientDir "node_modules"))) {
    Write-Error "Error: Client dependencies missing. Run 'cd client; npm install' first."
    exit 1
}

if (-not (Test-Path (Join-Path $ServerDir ".env"))) {
    Write-Warning "Warning: server/.env not found. Backend may fail to connect to database."
}

# 2. Check and clean up any orphan processes holding ports 5000 or 5173
$ports = @(5000, 5173)
foreach ($port in $ports) {
    try {
        $conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
        if ($conns) {
            foreach ($c in $conns) {
                Write-Host "Port $port occupied by PID $($c.OwningProcess). Terminating orphan process..." -ForegroundColor Yellow
                Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue
            }
        }
    } catch {
        # Ignore port check errors
    }
}

# 3. Launch concurrent services
Write-Host "Launching PickMyStock concurrently..." -ForegroundColor Green
Write-Host "  - Client UI:   http://localhost:5173" -ForegroundColor Green
Write-Host "  - Server API:  http://localhost:5000/api" -ForegroundColor Green
Write-Host "  - Proxied API: http://localhost:5173/api" -ForegroundColor Green
Write-Host "Press Ctrl+C to terminate both applications.`n" -ForegroundColor Yellow

# Run dev runner
& node $DevMjs
