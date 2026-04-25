$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $projectRoot "backend\mongod.pid"

if (-not (Test-Path $pidPath)) {
  Write-Host "No mongod.pid file found. MongoDB may already be stopped."
  exit 0
}

$pidValue = Get-Content $pidPath | Select-Object -First 1

if (-not $pidValue) {
  Remove-Item $pidPath -Force -ErrorAction SilentlyContinue
  Write-Host "Removed empty PID file."
  exit 0
}

try {
  Stop-Process -Id ([int]$pidValue) -Force -ErrorAction Stop
  Write-Host "Stopped local MongoDB process $pidValue."
} catch {
  Write-Host "Process $pidValue was not running. Cleaning up PID file."
}

Remove-Item $pidPath -Force -ErrorAction SilentlyContinue

