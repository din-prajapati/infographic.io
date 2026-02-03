
> **Purpose:** Complete guide for configuring RazorPay webhooks for subscription management  
> **For:** MVP Launch - Task 1.2  
> **Time Required:** 15-20 minutes  
> **Last Updated:** January 2025

---

## 📋 Prerequisites

- RazorPay account set up (see [RazorPay Setup Guide](RAZORPAY_SETUP_GUIDE.md))
- Test Mode enabled
- API Keys generated
- Application running locally or deployed

---

## 🌐 Webhook Configuration Per Environment

Your codebase uses different env files per environment. Razorpay has **separate Test Mode and Live Mode**; each mode has its own webhooks and secrets. Configure as below.

| Environment     | Env file to use                         | Razorpay Dashboard mode                            | Webhook URL you add in Dashboard                                             | Where to set `RAZORPAY_WEBHOOK_SECRET`                               |
| --------------- | --------------------------------------- | -------------------------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| **Development** | `.env.development` or `.env`            | **Test Mode** (toggle ON)                          | `https://<your-ngrok-id>.ngrok.io/api/webhooks/razorpay` (or similar tunnel) | Same env file (`RAZORPAY_WEBHOOK_SECRET` from Test Mode webhook)     |
| **Staging**     | `.env.development` or `.env.staging`    | **Test Mode** (or Live if you use live in staging) | `https://staging.your-app.com/api/webhooks/razorpay`                         | Same env file; use the secret for this webhook                       |
| **Production**  | `.env.production` or `.env` (on server) | **Live Mode** (toggle OFF)                         | `https://your-app.com/api/webhooks/razorpay`                                 | Same env file (`RAZORPAY_WEBHOOK_SECRET` from **Live Mode** webhook) |

**Important:**

1. **Test Mode vs Live Mode** – In Razorpay Dashboard, switch between Test/Live (top-right). Webhooks are **per mode**: create one webhook in Test Mode (for dev/staging) and a different one in Live Mode (for production). Each webhook has its own URL and **its own secret**.
2. **One secret per environment** – Use the secret from the webhook you created in the same mode (Test or Live) that matches the API keys in that env file. Development uses Test Mode keys + Test Mode webhook secret; production uses Live Mode keys + Live Mode webhook secret.
3. **Which env file the app loads** – Typically the app loads `.env` or `.env.development` / `.env.production` based on `NODE_ENV` or your host’s config. Ensure the env file that is actually loaded contains the correct `BASE_URL` and `RAZORPAY_WEBHOOK_SECRET` for that environment.
4. **Multiple products** – If you have one app per product, you can use one webhook URL per app (e.g. different domains or paths). If one app serves multiple products, use one URL and in the handler use `plan_id` (or similar) to identify the product. See [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md) “Extended Configuration Summary”.

**Quick checklist:**

- [ ] **Development:** Razorpay in **Test Mode** → Add webhook URL (ngrok/tunnel) → Copy secret → Put in `.env.development` (or `.env`) as `RAZORPAY_WEBHOOK_SECRET`.
- [ ] **Production:** Razorpay in **Live Mode** → Add webhook URL (production domain) → Copy secret → Put in `.env.production` (or server `.env`) as `RAZORPAY_WEBHOOK_SECRET`.

---

## 🚀 Step 1: Configure Webhook Endpoint

### Step 1.1: Access Webhook Settings

1. **Log in to RazorPay Dashboard:**
   - Go to: https://dashboard.razorpay.com
   - Ensure Test Mode is enabled (toggle in top-right)

2. **Navigate to Webhooks:**
   - Click "Settings" in left sidebar
   - Click "Webhooks" under Settings section
   - You'll see "Webhook URLs" section

### Step 1.2: Add Webhook URL

**For Production:**
- [ ] Click "Add New Webhook" button
- [ ] Enter webhook URL: `https://your-app.com/api/webhooks/razorpay`
- [ ] Replace `your-app.com` with your actual domain

**For Local Testing (using ngrok):**
- [ ] Install ngrok: https://ngrok.com/download
- [ ] Start your application: `npm run dev` (runs on port 5000)
- [ ] In new terminal, run: `ngrok http 5000`
- [ ] Copy HTTPS URL (e.g., `https://abc123.ngrok.io`)
- [ ] Add webhook URL: `https://abc123.ngrok.io/api/webhooks/razorpay`
- [ ] **Note:** ngrok URL changes each time you restart ngrok (free tier)

### Step 1.3: Select Webhook Events

- [ ] Check the following events:
  - ✅ `subscription.activated` - When subscription becomes active
  - ✅ `subscription.charged` - When subscription is charged (recurring billing)
  - ✅ `subscription.cancelled` - When subscription is cancelled
  - ✅ `payment.failed` - When payment fails

- [ ] Click "Create Webhook" or "Save"

### Step 1.4: Copy Webhook Secret

- [ ] After creating webhook, you'll see webhook details
- [ ] **Webhook Secret** is displayed (starts with `whsec_`)
- [ ] Format: `whsec_xxxxxxxxxxxxxx`
- [ ] **⚠️ CRITICAL:** Copy webhook secret immediately!
- [ ] Save securely (password manager or encrypted file)

---

## ⚙️ Step 2: Configure Environment Variable

### Step 2.1: Add Webhook Secret to Backend

- [ ] Open the **env file for this environment** (e.g. `.env.development` for local, `.env.production` on server). See [Webhook Configuration Per Environment](#-webhook-configuration-per-environment) above.
- [ ] Add or update:
  ```env
  RAZORPAY_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxx
  ```
- [ ] Replace `whsec_xxxxxxxxxxxxxx` with the **secret for the webhook you created in the same Razorpay mode** (Test vs Live) that matches this env’s API keys.

### Step 2.2: Restart Server

- [ ] Stop development server (Ctrl+C)
- [ ] Restart: `npm run dev`
- [ ] Verify no errors about missing webhook secret

---

## 🧪 Step 3: Test Webhook Endpoint

### Step 3.1: Verify Webhook Endpoint is Accessible

- [ ] Check your webhook endpoint is reachable:
  - Production: `https://your-app.com/api/webhooks/razorpay`
  - Local (ngrok): `https://abc123.ngrok.io/api/webhooks/razorpay`
- [ ] Should return 200 OK or 405 Method Not Allowed (GET not allowed, POST is)

### Step 3.2: Send Test Webhook from RazorPay Dashboard

1. **Navigate to Webhooks:**
   - RazorPay Dashboard → Settings → Webhooks
   - Find your webhook URL
   - Click "Send Test Webhook" button

2. **Select Test Event:**
   - Choose `subscription.activated` for testing
   - Click "Send Test Webhook"

3. **Verify Receipt:**
   - Check your application logs
   - Should see webhook request received
   - Verify signature verification passes
   - Check for any errors

### Step 3.3: Test with Real Subscription

- [ ] Complete a test subscription payment (Task 1.1 Step 2)
- [ ] Check application logs for webhook received
- [ ] Verify webhook handler processes event:
  - Subscription status updated to ACTIVE
  - Invoice created in database
  - Payment record created

---

## 🔍 Step 4: Verify Webhook Processing

### Step 4.1: Check Application Logs

- [ ] Look for webhook request logs:
  ```
  Webhook received: subscription.activated
  Signature verified: true
  Processing webhook...
  ```

### Step 4.2: Verify Database Updates

- [ ] Check subscription status:
  ```sql
  SELECT * FROM subscriptions WHERE status = 'ACTIVE';
  ```

- [ ] Check invoice created:
  ```sql
  SELECT * FROM invoices WHERE subscription_id = '...';
  ```

- [ ] Check payment record:
  ```sql
  SELECT * FROM payments WHERE subscription_id = '...';
  ```

---

## 🐛 Troubleshooting

### Issue: "Webhook not received"

**Symptoms:**
- No webhook requests in application logs
- RazorPay shows webhook delivery failed

**Solutions:**
- ✅ Verify webhook URL is correct and accessible
- ✅ Check firewall/security settings allow incoming requests
- ✅ For local testing, ensure ngrok is running
- ✅ Verify webhook URL uses HTTPS (required by RazorPay)
- ✅ Check RazorPay Dashboard → Webhooks → Delivery Logs for errors

### Issue: "Signature verification failed"

**Symptoms:**
- Error: "Invalid webhook signature"
- Webhook rejected

**Solutions:**
- ✅ Verify `RAZORPAY_WEBHOOK_SECRET` is correct
- ✅ Check webhook secret matches the one in RazorPay Dashboard
- ✅ Ensure raw request body is used for signature verification (not parsed JSON)
- ✅ Verify webhook secret is from correct webhook (Test Mode vs Live Mode)
- ✅ Check application code uses correct signature algorithm (HMAC-SHA256)

### Issue: "Webhook received but not processed"

**Symptoms:**
- Webhook request received (200 OK)
- Database not updated
- No processing logs

**Solutions:**
- ✅ Check webhook handler code for errors
- ✅ Verify event type matches handler logic
- ✅ Check database connection
- ✅ Review application logs for processing errors
- ✅ Verify webhook handler is registered correctly

---

## 🧪 Testing Payments Without Deploying (Local Debugging)

Use these approaches to test payment and webhook flows **without deploying to a live environment**.

### Recommended: Razorpay Test Mode + Tunnel (ngrok or similar)

1. **Use Razorpay Test Mode only** – No real money; test cards and simulated payments.
2. **Expose your local server** – Run a tunnel so Razorpay can reach your webhook:
   - **ngrok:** `ngrok http 5000` (or the port your app uses). Use the HTTPS URL (e.g. `https://abc123.ngrok.io`) as base; webhook URL = `https://abc123.ngrok.io/api/webhooks/razorpay`.
   - **Alternatives:** Cloudflare Tunnel, localtunnel, or your host’s dev tunnel. Ensure the URL is **HTTPS** (Razorpay requires it).
3. **Configure one Test Mode webhook** in Razorpay Dashboard (Test Mode ON) with that tunnel URL. Copy the webhook secret into `.env.development` (or `.env`) as `RAZORPAY_WEBHOOK_SECRET`.
4. **Use Test Mode keys** in the same env file (`RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` from Test Mode). Run the app with this env so checkout and webhooks both use Test Mode.
5. **Optional – stable URL for debugging:** Free ngrok URLs change on restart. For a fixed URL, use ngrok’s reserved domain (paid) or another tunnel with a fixed subdomain so you don’t have to re-add the webhook in the Dashboard each time.

### End-to-end flow without going live

- **Create subscription (test):** Use your app’s pricing/checkout flow; Razorpay Checkout will open in test mode.
- **Pay with test card:** Use [Razorpay test card numbers](https://razorpay.com/docs/payments/payments/test-card-details/) (e.g. `4111 1111 1111 1111`). No real charge.
- **Webhooks:** Razorpay sends `subscription.activated`, `subscription.charged`, etc. to your tunnel URL; your local server receives them. Check logs and DB to verify handler logic.
- **Replay / manual testing:** In Razorpay Dashboard → Settings → Webhooks → your URL → “Send Test Webhook” to resend a sample event (e.g. `subscription.activated`) for debugging without doing another payment.

### Debugging tips

- **Log raw webhook body and signature** (only in development) to verify HMAC and payload structure.
- **Use Razorpay Dashboard → Webhooks → Delivery Logs** to see if requests were sent and what status code your endpoint returned.
- **Replay a real payload locally:** Copy a request from Delivery Logs (or use a saved sample), then send it to `http://localhost:5000/api/webhooks/razorpay` with the same body and `X-Razorpay-Signature` header; ensure your handler uses the **raw** body for signature verification.

### Summary

| Goal                         | Approach                                                                 |
| ---------------------------- | ------------------------------------------------------------------------ |
| Test checkout + webhooks     | Run app locally + ngrok (or tunnel) + Razorpay Test Mode + one webhook   |
| Avoid changing webhook URL   | Use a tunnel with a fixed subdomain (e.g. ngrok reserved domain)         |
| Debug handler without paying | “Send Test Webhook” from Dashboard or replay a saved payload locally     |
| Match production behaviour   | Use same events and payload structure; only keys and URLs differ in prod |

---

## 📝 Webhook Event Details

### subscription.activated

**When:** Subscription becomes active after successful payment

**Payload includes:**
- `subscription.id` - Subscription ID
- `subscription.status` - "active"
- `subscription.entity` - Subscription details
- `payment.entity` - Payment details

**Action:** Update subscription status to ACTIVE, create invoice, create payment record

### subscription.charged

**When:** Recurring subscription charge (monthly/annual billing)

**Payload includes:**
- `subscription.id` - Subscription ID
- `payment.entity` - Payment details
- `invoice.entity` - Invoice details

**Action:** Create new payment record, update invoice, reset usage limits if applicable

### subscription.cancelled

**When:** Subscription is cancelled (by user or payment failure)

**Payload includes:**
- `subscription.id` - Subscription ID
- `subscription.status` - "cancelled"
- `subscription.ended_at` - Cancellation timestamp

**Action:** Update subscription status to CANCELLED, downgrade user to FREE tier, reset usage limits

### payment.failed

**When:** Payment attempt fails (insufficient funds, card declined, etc.)

**Payload includes:**
- `payment.entity.id` - Payment ID
- `payment.entity.status` - "failed"
- `payment.entity.error` - Error details

**Action:** Create payment record with FAILED status, update subscription status, notify user

---

## ✅ Verification Checklist

Before proceeding to next task, verify:

- [ ] ✅ Webhook URL configured in RazorPay Dashboard
- [ ] ✅ All required events selected:
  - [ ] subscription.activated
  - [ ] subscription.charged
  - [ ] subscription.cancelled
  - [ ] payment.failed
- [ ] ✅ Webhook secret copied and saved
- [ ] ✅ Environment variable set: `RAZORPAY_WEBHOOK_SECRET`
- [ ] ✅ Server restarted with new environment variable
- [ ] ✅ Test webhook sent successfully from RazorPay Dashboard
- [ ] ✅ Webhook received and processed correctly
- [ ] ✅ Signature verification working
- [ ] ✅ Database updates verified

**✅ Ready to proceed to webhook testing**

---

## 🔗 Useful Links

- **RazorPay Webhook Documentation:** https://razorpay.com/docs/webhooks/
- **RazorPay Dashboard:** https://dashboard.razorpay.com
- **ngrok Download:** https://ngrok.com/download
- **RazorPay Setup Guide:** [RAZORPAY_SETUP_GUIDE.md](RAZORPAY_SETUP_GUIDE.md)

---

**Status:** ✅ Ready for Testing  
**Next Step:** Proceed to Task 1.2 Step 2 - Test Webhook Signature Verification

---

*Last Updated: January 2025*  
*For: MVP 1-Week Launch Plan*
