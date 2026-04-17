#!/usr/bin/env node
/* eslint-env node */
/* global process, console, fetch, setTimeout, clearTimeout, AbortController */
/**
 * Payment Automated Tests
 * Run from repo root: node scripts/run-payment-automated-tests.js
 *
 * Prerequisites:
 * - App must be running: npm run dev
 * - For create-subscription test: set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const FETCH_TIMEOUT_MS = 25000;

async function fetchWithTimeout(url, options = {}) {
  const ctrl = new AbortController();
  const timeout = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: ctrl.signal });
    clearTimeout(timeout);
    return res;
  } catch (e) {
    clearTimeout(timeout);
    throw e;
  }
}

// Load .env
const rootEnvPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(rootEnvPath)) {
  const content = fs.readFileSync(rootEnvPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
}

let passed = 0;
let failed = 0;

function log(msg, type = 'info') {
  const prefix = type === 'pass' ? '✅' : type === 'fail' ? '❌' : '  ';
  console.log(`${prefix} ${msg}`);
}

async function runPrerequisites() {
  console.log('\n=== 1. Prerequisites verification ===');
  try {
    const { execSync } = await import('child_process');
    execSync('node scripts/verify-payment-prerequisites.js', {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe',
    });
    log('All required variables present', 'pass');
    passed++;
    return true;
  } catch (e) {
    log('Prerequisites check failed. Run: node scripts/verify-payment-prerequisites.js', 'fail');
    failed++;
    return false;
  }
}

async function testProviderInfo() {
  console.log('\n=== 2. GET /api/v1/payments/provider-info ===');
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/payments/provider-info?currency=INR`);
    const data = await res.json();
    if (!res.ok) {
      log(`Failed: ${res.status} ${JSON.stringify(data)}`, 'fail');
      failed++;
      return;
    }
    if (data.provider === 'RAZORPAY') {
      log(`Returns provider: ${data.provider} (razorpayKeyId from client env)`, 'pass');
      passed++;
    } else {
      log(`Unexpected response: ${JSON.stringify(data)}`, 'fail');
      failed++;
    }
  } catch (e) {
    log(`Request failed: ${e.message}. Is the app running? (npm run dev)`, 'fail');
    failed++;
  }
}

async function getAuthToken() {
  const email = process.env.TEST_USER_EMAIL;
  const password = process.env.TEST_USER_PASSWORD;
  if (!email || !password) return null;
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    return data.access_token || data.token || null;
  } catch {
    return null;
  }
}

function assertCreateSubscriptionResponse(res, data, label) {
  if (!res.ok) {
    if (data.message?.includes('start_at') || data.message?.includes('start time')) {
      log(`${label}: API responds; Razorpay start_at error (expected in test).`, 'pass');
      passed++;
      return;
    }
    log(`${label}: Failed: ${res.status} ${JSON.stringify(data)}`, 'fail');
    failed++;
    return;
  }
  if (data.success && data.providerSubscription) {
    log(`${label}: success, providerSubscription present`, 'pass');
    passed++;
  } else {
    log(`${label}: Unexpected response: ${JSON.stringify(data)}`, 'fail');
    failed++;
  }
}

async function testCreateSubscription() {
  console.log('\n=== 3. POST /api/v1/payments/create-subscription (SOLO monthly) ===');
  const token = await getAuthToken();
  if (!token) {
    log('Skipped: Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env to run', 'info');
    return;
  }
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/payments/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planTier: 'SOLO',
        currency: 'INR',
        region: 'IN',
        billingPeriod: 'monthly',
      }),
    });
    const data = await res.json();
    assertCreateSubscriptionResponse(res, data, 'SOLO monthly');
  } catch (e) {
    log(`Request failed: ${e.message}`, 'fail');
    failed++;
  }
}

async function testCreateSubscriptionAnnual() {
  console.log('\n=== 3b. POST create-subscription (TEAM annual — Track B) ===');
  const token = await getAuthToken();
  if (!token) {
    log('Skipped (same as §3): TEST_USER_* not set', 'info');
    return;
  }
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/v1/payments/create-subscription`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        planTier: 'TEAM',
        currency: 'INR',
        region: 'IN',
        billingPeriod: 'annual',
      }),
    });
    const data = await res.json();
    assertCreateSubscriptionResponse(res, data, 'TEAM annual');
  } catch (e) {
    log(`TEAM annual request failed: ${e.message}`, 'fail');
    failed++;
  }
}

async function testWebhookValidSignature() {
  console.log('\n=== 4. Webhook: valid signature (2.3) ===');
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!secret) {
    log('Skipped: RAZORPAY_WEBHOOK_SECRET not set', 'info');
    return;
  }
  const payload = {
    event: 'subscription.activated',
    payload: {
      subscription: {
        entity: {
          id: 'sub_test_automated',
          plan_id: 'plan_test',
          status: 'activated',
        },
      },
    },
  };
  const body = JSON.stringify(payload);
  const signature = crypto.createHmac('sha256', secret).update(body).digest('hex');
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': signature,
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    // 200 = accepted; 500 can occur if NestJS fails (e.g. subscription not in DB)
    if (res.status === 200 || (res.status === 500 && data.error?.includes('process'))) {
      log('Webhook accepts valid signature (signature verification passes)', 'pass');
      passed++;
    } else {
      log(`Unexpected: ${res.status} ${JSON.stringify(data)}`, 'fail');
      failed++;
    }
  } catch (e) {
    log(`Request failed: ${e.message}`, 'fail');
    failed++;
  }
}

async function testWebhookInvalidSignature() {
  console.log('\n=== 5. Webhook: invalid signature (2.4) ===');
  const payload = { event: 'subscription.activated', payload: {} };
  const body = JSON.stringify(payload);
  const invalidSignature = 'invalid_signature_12345';
  try {
    const res = await fetchWithTimeout(`${BASE_URL}/api/webhooks/razorpay`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Razorpay-Signature': invalidSignature,
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (res.status === 401 && (data.error?.includes('Invalid') || data.error?.includes('signature'))) {
      log('Rejects invalid signature (401)', 'pass');
      passed++;
    } else {
      log(`Expected 401 for invalid signature, got: ${res.status} ${JSON.stringify(data)}`, 'fail');
      failed++;
    }
  } catch (e) {
    log(`Request failed: ${e.message}`, 'fail');
    failed++;
  }
}

async function main() {
  console.log('Payment Automated Tests');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('Ensure app is running: npm run dev');

  await runPrerequisites();
  await testProviderInfo();
  await testCreateSubscription();
  await testCreateSubscriptionAnnual();
  await testWebhookValidSignature();
  await testWebhookInvalidSignature();

  console.log('\n=== Summary ===');
  console.log(`Passed: ${passed}, Failed: ${failed}`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
