# push-staging-vars.ps1
# Reads secrets from local .env and pushes staging-appropriate variables to Railway.
# Run from the repo root after: railway login && railway link (select staging environment)
#
# Usage:
#   .\scripts\push-staging-vars.ps1 -StagingUrl "https://your-app.up.railway.app"
#   .\scripts\push-staging-vars.ps1 -StagingUrl "https://your-app.up.railway.app" -NeonStagingUrl "postgresql://..."

param(
    [Parameter(Mandatory=$true)]
    [string]$StagingUrl,

    [Parameter(Mandatory=$false)]
    [string]$NeonStagingUrl = ""
)

$ErrorActionPreference = "Stop"

# --- Parse .env file into a hashtable ---
$envFile = Join-Path $PSScriptRoot ".." ".env"
$envFile = (Resolve-Path $envFile).Path
$env_vars = @{}
foreach ($line in Get-Content $envFile -Encoding UTF8) {
    if ($line -match '^\s*#' -or $line.Trim() -eq '') { continue }
    if ($line -match '^([^=]+)=(.*)$') {
        $key = $Matches[1].Trim()
        $val = $Matches[2].Trim().Trim('"').Trim("'")
        $env_vars[$key] = $val
    }
}

# --- Generate fresh secrets for staging (never reuse local dev secrets) ---
$rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
$b32 = New-Object byte[] 32; $rng.GetBytes($b32); $jwtSecret  = [Convert]::ToBase64String($b32)
$b64 = New-Object byte[] 64; $rng.GetBytes($b64); $sessSecret = [Convert]::ToBase64String($b64)

# --- Determine DATABASE_URL ---
if ($NeonStagingUrl -ne "") {
    $dbUrl = $NeonStagingUrl
} else {
    $dbUrl = $env_vars["DATABASE_URL"]
    Write-Warning "No -NeonStagingUrl provided - using local DATABASE_URL. Create a separate Neon staging branch for isolation."
}

# --- Build the variable map ---
$stagingVars = [ordered]@{
    DATABASE_URL                = $dbUrl
    NODE_ENV                    = "production"
    JWT_SECRET                  = $jwtSecret
    SESSION_SECRET              = $sessSecret
    OPENAI_API_KEY              = $env_vars["OPENAI_API_KEY"]
    IDEOGRAM_API_KEY            = $env_vars["IDEOGRAM_API_KEY"]
    RAZORPAY_KEY_ID             = $env_vars["RAZORPAY_KEY_ID"]
    RAZORPAY_KEY_SECRET         = $env_vars["RAZORPAY_KEY_SECRET"]
    RAZORPAY_WEBHOOK_SECRET     = $env_vars["RAZORPAY_WEBHOOK_SECRET"]
    RAZORPAY_PLAN_SOLO_MONTHLY  = $env_vars["RAZORPAY_PLAN_SOLO_MONTHLY"]
    RAZORPAY_PLAN_SOLO_ANNUAL   = $env_vars["RAZORPAY_PLAN_SOLO_ANNUAL"]
    RAZORPAY_PLAN_TEAM_MONTHLY  = $env_vars["RAZORPAY_PLAN_TEAM_MONTHLY"]
    RAZORPAY_PLAN_TEAM_ANNUAL   = $env_vars["RAZORPAY_PLAN_TEAM_ANNUAL"]
    VITE_RAZORPAY_KEY_ID        = $env_vars["RAZORPAY_KEY_ID"]
    GOOGLE_CLIENT_ID            = $env_vars["GOOGLE_CLIENT_ID"]
    GOOGLE_CLIENT_SECRET        = $env_vars["GOOGLE_CLIENT_SECRET"]
    GOOGLE_CALLBACK_URL         = "$StagingUrl/api/v1/auth/google/callback"
    SENTRY_DSN                  = $env_vars["SENTRY_DSN"]
    VITE_SENTRY_DSN             = $env_vars["VITE_SENTRY_DSN"]
    VITE_STORAGE_PREFIX         = "infographicai"
    STRIPE_ENABLED              = "false"
}

# --- Verify railway CLI is available ---
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Error "railway CLI not found. Install it: npm install -g @railway/cli"
    exit 1
}

# --- Build and run railway variables --set ---
Write-Host ""
Write-Host "[push-staging-vars] Pushing $($stagingVars.Count) variables to Railway staging..." -ForegroundColor Cyan
Write-Host ""

$setArgs = @()
foreach ($kv in $stagingVars.GetEnumerator()) {
    $setArgs += "--set"
    $setArgs += "$($kv.Key)=$($kv.Value)"
}

& railway variables @setArgs

Write-Host ""
Write-Host "[push-staging-vars] Done. Variables pushed to Railway staging." -ForegroundColor Green
Write-Host "  JWT_SECRET / SESSION_SECRET were freshly generated." -ForegroundColor DarkGray
Write-Host "  GOOGLE_CALLBACK_URL = $StagingUrl/api/v1/auth/google/callback" -ForegroundColor DarkGray
Write-Host ""
Write-Host "Next: Add the callback URL above to Google Cloud Console > OAuth credentials > Authorized redirect URIs." -ForegroundColor Yellow
