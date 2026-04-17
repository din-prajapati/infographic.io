# Razorpay webhook via ngrok — run from repo root (separate terminal from npm run dev).
# Prerequisites: ngrok installed (https://ngrok.com/download) and `ngrok config add-authtoken <token>` done once.
#
# Usage:
#   .\scripts\ngrok-webhook.ps1
#   .\scripts\ngrok-webhook.ps1 -Port 5000
#
# Then in Razorpay Dashboard (Test mode): Settings → Webhooks → Add URL:
#   https://<your-subdomain>.ngrok-free.app/api/webhooks/razorpay
# Copy the webhook signing secret into root .env as RAZORPAY_WEBHOOK_SECRET (must match this Test webhook).
#
# Note: Razorpay may block some tunnel domains; if webhooks fail to deliver, try zrok or a staging host.
# See docs/payments/RAZORPAY_WEBHOOK_SETUP_GUIDE.md

param(
  [int]$Port = 5000
)

$ngrok = Get-Command ngrok -ErrorAction SilentlyContinue
if (-not $ngrok) {
  Write-Host "ngrok not found in PATH. Install from https://ngrok.com/download and add to PATH." -ForegroundColor Red
  exit 1
}

Write-Host "Starting ngrok http $Port (forwarding to local app)..." -ForegroundColor Cyan
Write-Host "Webhook URL to paste in Razorpay (replace host with the HTTPS URL ngrok prints):" -ForegroundColor Yellow
Write-Host "  https://YOUR-NGROK-HOST/api/webhooks/razorpay"
Write-Host ""
& ngrok http $Port
