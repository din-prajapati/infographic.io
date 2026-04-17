# PowerShell script to start both Express frontend and NestJS API
# For Windows users in Cursor

Write-Host "🚀 Starting InfographicAI platform..." -ForegroundColor Green
Write-Host "📦 Express frontend will run on port 5000" -ForegroundColor Cyan
Write-Host "🔧 NestJS API will run on port 3001" -ForegroundColor Cyan
Write-Host ""

function Stop-ProcessOnPort {
    param([int]$Port, [string]$PortLabel)
    $conn = $null
    try {
        $conn = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
    } catch {
        Write-Host "⚠️  Get-NetTCPConnection failed, trying netstat..." -ForegroundColor Yellow
        $netstat = netstat -ano | Select-String ":$Port\s"
        if (-not $netstat) { return $true }
        $last = ($netstat | Select-Object -Last 1).ToString() -match '\s+(\d+)\s*$'
        if ($matches) { $conn = [PSCustomObject]@{ OwningProcess = [int]$matches[1] } }
    }
    if (-not $conn) { return $true }
    $conn = $conn | Select-Object -First 1
    $pidToKill = $conn.OwningProcess
    if ($pidToKill -eq 0) {
        Write-Host "⏳ $PortLabel is in TIME_WAIT. Waiting 5s..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        return $false
    }
    try {
        $proc = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
        $procName = if ($proc) { $proc.ProcessName } else { "unknown" }
        Write-Host "🔄 Stopping process on $PortLabel (PID: $pidToKill - $procName)..." -ForegroundColor Yellow
        Stop-Process -Id $pidToKill -Force -ErrorAction Stop
        Start-Sleep -Seconds 2
        return $true
    } catch {
        Write-Host "❌ Failed to stop PID $pidToKill : $($_.Exception.Message)" -ForegroundColor Red
        Write-Host "   Run: taskkill /PID $pidToKill /F" -ForegroundColor Yellow
        return $false
    }
}

# Free port 5000 (Express) and 3001 (NestJS)
foreach ($portInfo in @(
    @{ Port = 5000; Label = "port 5000" }
    @{ Port = 3001; Label = "port 3001" }
)) {
    $retries = 0
    while ($retries -lt 3) {
        $conn = Get-NetTCPConnection -LocalPort $portInfo.Port -ErrorAction SilentlyContinue
        if (-not $conn) { break }
        if (-not (Stop-ProcessOnPort -Port $portInfo.Port -PortLabel $portInfo.Label)) {
            $retries++
            continue
        }
        $conn = Get-NetTCPConnection -LocalPort $portInfo.Port -ErrorAction SilentlyContinue
        if (-not $conn) {
            Write-Host "✅ Port $($portInfo.Port) is free" -ForegroundColor Green
            break
        }
        $retries++
    }
}

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:API_PORT = "3001"

# Start the application
Write-Host "Starting servers..." -ForegroundColor Yellow
npm run dev

