# PowerShell script to start both Express frontend and NestJS API
# For Windows users in Cursor

Write-Host "🚀 Starting InfographicAI platform..." -ForegroundColor Green
Write-Host "📦 Express frontend will run on port 5000" -ForegroundColor Cyan
Write-Host "🔧 NestJS API will run on port 3001" -ForegroundColor Cyan
Write-Host ""

# Check if port 5000 is already in use
$maxRetries = 3
$retryCount = 0
$portFreed = $false

while ($retryCount -lt $maxRetries -and -not $portFreed) {
    $port5000 = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
    if ($port5000) {
        $retryCount++
        $pidToKill = $port5000.OwningProcess
        Write-Host "⚠️  Port 5000 is already in use by PID: $pidToKill (Attempt $retryCount/$maxRetries)" -ForegroundColor Yellow
        
        # Get process info before killing
        $processInfo = Get-Process -Id $pidToKill -ErrorAction SilentlyContinue
        if ($processInfo) {
            Write-Host "   Process: $($processInfo.ProcessName) (PID: $pidToKill)" -ForegroundColor Gray
        }
        
        try {
            Write-Host "🔄 Attempting to free the port..." -ForegroundColor Yellow
            Stop-Process -Id $pidToKill -Force -ErrorAction Stop
            Write-Host "✅ Process $pidToKill terminated successfully" -ForegroundColor Green
            Start-Sleep -Seconds 3
            
            # Verify port is free
            $checkPort = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue
            if (-not $checkPort) {
                $portFreed = $true
                Write-Host "✅ Port 5000 is now free" -ForegroundColor Green
            } else {
                Write-Host "⚠️  Port still in use, will retry..." -ForegroundColor Yellow
            }
        } catch {
            $errorMessage = $_.Exception.Message
            Write-Host "❌ Failed to terminate process ${pidToKill}: $errorMessage" -ForegroundColor Red
            if ($retryCount -ge $maxRetries) {
                Write-Host ""
                Write-Host "Please kill it manually:" -ForegroundColor Yellow
                Write-Host "   taskkill /PID $pidToKill /F" -ForegroundColor Yellow
                Write-Host ""
                Write-Host "Or use a different port:" -ForegroundColor Yellow
                Write-Host "   `$env:PORT = '5001'; npm run dev" -ForegroundColor Yellow
                exit 1
            }
        }
    } else {
        $portFreed = $true
    }
}

# Set environment variables
$env:NODE_ENV = "development"
$env:PORT = "5000"
$env:API_PORT = "3001"

# Start the application
Write-Host "Starting servers..." -ForegroundColor Yellow
npm run dev

