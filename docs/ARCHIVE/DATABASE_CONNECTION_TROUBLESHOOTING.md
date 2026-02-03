# Database Connection Troubleshooting Guide

## Issue: Prisma Commands Fail with P1001 Error

**Error Message:**
```
Error: P1001: Can't reach database server at `ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech:5432`
```

## Root Cause

The Neon database server is unreachable. This typically happens because:

1. **Neon Auto-Pause** (Most Common) - Neon automatically pauses databases after periods of inactivity
2. **Network/Firewall Issues** - Connection blocked by firewall or network configuration
3. **Invalid/Expired Connection String** - Database endpoint may have changed

## Solutions

### Solution 1: Wake Up Neon Database (Most Likely Fix)

1. **Visit Neon Console:**
   - Go to https://console.neon.tech/
   - Log in to your account
   - Find your project with database `neondb`

2. **Check Database Status:**
   - Look for "Paused" or "Active" status
   - If paused, click "Resume" or "Wake Up"

3. **Wait for Activation:**
   - Database wake-up takes 5-30 seconds
   - You'll see status change to "Active"

4. **Retry Connection:**
   ```powershell
   node check-db-connection.js
   ```

### Solution 2: Verify Connection String

1. **Get Fresh Connection String:**
   - In Neon Console, go to your database
   - Click "Connection Details" or "Connection String"
   - Copy the new connection string

2. **Update .env File:**
   ```env
   DATABASE_URL="postgresql://user:password@host/database?sslmode=require"
   ```

3. **Test Connection:**
   ```powershell
   node check-db-connection.js
   ```

### Solution 3: Check Network/Firewall

If database is active but still unreachable:

1. **Verify Internet Connection:**
   ```powershell
   Test-NetConnection ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech -Port 5432
   ```

2. **Check Firewall:**
   - Ensure port 5432 is not blocked
   - Check corporate firewall/VPN settings

### Solution 4: Use Neon's Connection Pooler (Recommended)

Neon provides a connection pooler that's more reliable:

1. **In Neon Console:**
   - Go to Connection Details
   - Look for "Pooled connection" option
   - Use the pooled connection string instead

2. **Update .env:**
   ```env
   DATABASE_URL="postgresql://user:password@ep-xxx-pooler.us-west-2.aws.neon.tech/neondb?sslmode=require"
   ```

## Quick Diagnostic Commands

### Test Database Connection
```powershell
node check-db-connection.js
```

### Test Prisma Commands (without DB connection)
```powershell
# These work without database:
npx prisma format --schema=api/prisma/schema.prisma
npx prisma generate --schema=api/prisma/schema.prisma

# These require database:
npx prisma migrate status --schema=api/prisma/schema.prisma
npx prisma migrate dev --name migration_name --schema=api/prisma/schema.prisma
```

### Check Environment Variables
```powershell
# PowerShell
Get-Content .env | Select-String "DATABASE_URL"

# Or check if loaded:
node -e "require('dotenv').config(); console.log(process.env.DATABASE_URL ? 'SET' : 'NOT SET')"
```

## Prevention

To prevent auto-pause in Neon:

1. **Use Connection Pooler** - More reliable, stays active longer
2. **Set Up Keep-Alive** - Configure periodic connections
3. **Upgrade Plan** - Some Neon plans don't auto-pause

## Current Database Info

- **Provider:** Neon (Serverless PostgreSQL)
- **Host:** `ep-lingering-frost-afktjhej.c-2.us-west-2.aws.neon.tech`
- **Database:** `neondb`
- **Region:** US West 2 (Oregon)
- **Status:** Likely paused (needs wake-up)

## Next Steps

1. ✅ Visit https://console.neon.tech/ and check database status
2. ✅ Wake up database if paused
3. ✅ Run `node check-db-connection.js` to verify connection
4. ✅ Once connected, run Prisma migrations:
   ```powershell
   npx prisma migrate dev --name add_conversations_and_extractions --schema=api/prisma/schema.prisma
   ```
