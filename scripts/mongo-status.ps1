$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$pidPath = Join-Path $projectRoot "backend\mongod.pid"
$logPath = Join-Path $projectRoot "backend\mongodb.log"
$port = 27017

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

$isListening = Test-MongoPort
$pidValue = if (Test-Path $pidPath) { Get-Content $pidPath | Select-Object -First 1 } else { $null }

if ($isListening) {
  Write-Host "MongoDB is listening on port $port."
} else {
  Write-Host "MongoDB is not listening on port $port."
}

if ($pidValue) {
  Write-Host "PID file: $pidValue"
}

if (Test-Path $logPath) {
  Write-Host "Log file: $logPath"
}
