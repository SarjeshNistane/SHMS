$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$serverRoot = Join-Path $projectRoot "backend"
$dataDir = Join-Path $serverRoot ".mongodb-data"
$localMongoRoot = Join-Path $serverRoot ".mongodb-bin"
$logPath = Join-Path $serverRoot "mongodb.log"
$pidPath = Join-Path $serverRoot "mongod.pid"
$port = 27017

function Get-MongodPath {
  if (Test-Path $localMongoRoot) {
    $localMatch = Get-ChildItem $localMongoRoot -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue |
      Sort-Object FullName -Descending |
      Select-Object -First 1
    if ($localMatch) {
      return $localMatch.FullName
    }
  }

  $command = Get-Command mongod.exe -ErrorAction SilentlyContinue
  if ($command) {
    return $command.Source
  }

  $commonRoots = @(
    "C:\Program Files\MongoDB\Server",
    "C:\Program Files\MongoDB"
  )

  foreach ($root in $commonRoots) {
    if (Test-Path $root) {
      $match = Get-ChildItem $root -Recurse -Filter "mongod.exe" -ErrorAction SilentlyContinue |
        Select-Object -First 1
      if ($match) {
        return $match.FullName
      }
    }
  }

  return $null
}

function Test-MongoPort {
  $client = New-Object System.Net.Sockets.TcpClient
  try {
    $asyncResult = $client.BeginConnect("127.0.0.1", $port, $null, $null)
    $connected = $asyncResult.AsyncWaitHandle.WaitOne(1000, $false) -and $client.Connected
    return $connected
  } catch {
    return $false
  } finally {
    $client.Close()
  }
}

if (Test-MongoPort) {
  Write-Host "MongoDB already appears to be running on port $port."
  Write-Host "URI: mongodb://127.0.0.1:$port/ai-smart-hospital"
  exit 0
}

$mongodPath = Get-MongodPath
if (-not $mongodPath) {
  Write-Error "mongod.exe was not found. Install MongoDB Community Server or add mongod.exe to PATH, then rerun 'npm run mongo:local'."
}

if (-not (Test-Path $dataDir)) {
  New-Item -ItemType Directory -Path $dataDir | Out-Null
}

$arguments = @(
  "--dbpath", "`"$dataDir`"",
  "--port", "$port",
  "--bind_ip", "127.0.0.1",
  "--logpath", "`"$logPath`"",
  "--logappend"
)

$process = Start-Process -FilePath $mongodPath -ArgumentList $arguments -PassThru -WindowStyle Hidden
Set-Content -Path $pidPath -Value $process.Id

Start-Sleep -Seconds 2
$ready = $false

for ($i = 0; $i -lt 15; $i++) {
  if (Test-MongoPort) {
    $ready = $true
    break
  }
  Start-Sleep -Seconds 1
}

if ($ready) {
  Write-Host "Local MongoDB started successfully."
  Write-Host "PID: $($process.Id)"
  Write-Host "URI: mongodb://127.0.0.1:$port/ai-smart-hospital"
  Write-Host "Binary: $mongodPath"
  Write-Host "Data: $dataDir"
  Write-Host "Log: $logPath"
  exit 0
}

Write-Error "MongoDB process started but port $port did not open. Check $logPath for details."
