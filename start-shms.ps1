# Smart Health Management System - Start Script
$ErrorActionPreference = "Stop"

Write-Host "Initializing Smart Health Management System..." -ForegroundColor Cyan

# 1. Start MongoDB
Write-Host "Step 1: Starting Database..." -ForegroundColor Yellow
npm run mongo:local

# 2. Wait for DB to settle
Start-Sleep -Seconds 2

# 3. Start Server and Tunnel
Write-Host "Step 2: Starting Server and Creating Public URL..." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
Write-Host "Opening new windows for Server and Tunnel..."
Write-Host "Keep those windows OPEN to keep the system running."
Write-Host "--------------------------------------------------------"

# Start Server in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev --prefix backend"

# Start Tunnel in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "npx localtunnel --port 4000"

Write-Host "`nDone! Check the new windows for your server logs and public URL." -ForegroundColor Green
