# Smart Health Management System - Local Start Script
$ErrorActionPreference = "Stop"

Write-Host "Initializing Smart Health Management System (LOCAL)..." -ForegroundColor Cyan

# 1. Start MongoDB
Write-Host "Step 1: Starting Database..." -ForegroundColor Yellow
npm run mongo:local

# 2. Wait for DB to settle
Start-Sleep -Seconds 2

# 3. Start Server
Write-Host "Step 2: Starting Server..." -ForegroundColor Yellow
Write-Host "--------------------------------------------------------"
Write-Host "Your website will be available at: http://localhost:4000"
Write-Host "--------------------------------------------------------"

npm run dev --prefix backend
