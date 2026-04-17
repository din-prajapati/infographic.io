#!/usr/bin/env node
/**
 * Ensures TEST_USER_EMAIL / TEST_USER_PASSWORD can log in (registers if new).
 * Run after `npm run dev` with BASE_URL pointing at the API (default http://localhost:5000).
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
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

const BASE_URL = process.env.BASE_URL || 'http://localhost:5000';
const email = process.env.TEST_USER_EMAIL;
const password = process.env.TEST_USER_PASSWORD;
const name = process.env.TEST_USER_NAME || 'Payment Test User';
const organizationName = process.env.TEST_USER_ORG_NAME || 'Payment Test Org';

if (!email || !password) {
  console.error('Set TEST_USER_EMAIL and TEST_USER_PASSWORD in .env');
  process.exit(1);
}

async function main() {
  const registerRes = await fetch(`${BASE_URL}/api/v1/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, name, organizationName }),
  });
  const registerData = await registerRes.json().catch(() => ({}));

  if (registerRes.ok) {
    console.log('✅ Registered payment test user:', email);
    return;
  }

  const msg = registerData.message || JSON.stringify(registerData);
  if (
    registerRes.status === 400 ||
    registerRes.status === 409 ||
    /exists|already|duplicate/i.test(String(msg))
  ) {
    const loginRes = await fetch(`${BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const loginData = await loginRes.json().catch(() => ({}));
    if (loginRes.ok && (loginData.access_token || loginData.token)) {
      console.log('✅ Payment test user already exists; login OK:', email);
      return;
    }
    console.error('❌ User exists but login failed:', loginRes.status, loginData);
    process.exit(1);
  }

  console.error('❌ Register failed:', registerRes.status, registerData);
  process.exit(1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
