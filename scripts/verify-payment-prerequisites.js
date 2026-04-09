#!/usr/bin/env node
/* eslint-env node */
/* global process, console */
/**
 * Payment Test Prerequisites Verification
 * Run from repo root: node scripts/verify-payment-prerequisites.js
 * Does not echo secret values; only reports presence and format.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const rootEnvPath = path.join(__dirname, '..', '.env');
const clientEnvPath = path.join(__dirname, '..', 'client', '.env.development');

const requiredRootVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'RAZORPAY_PLAN_SOLO_MONTHLY',
  'RAZORPAY_PLAN_SOLO_ANNUAL',
  'RAZORPAY_PLAN_TEAM_MONTHLY',
  'RAZORPAY_PLAN_TEAM_ANNUAL',
];

const requiredClientVars = ['VITE_RAZORPAY_KEY_ID'];

function loadEnv(filePath) {
  const out = {};
  if (!fs.existsSync(filePath)) return out;
  const content = fs.readFileSync(filePath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;
    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    out[key] = value;
  }
  return out;
}

function checkValue(name, value) {
  if (!value || value === '') return { ok: false, msg: 'missing or empty' };
  if (name.includes('SECRET') || name.includes('KEY_SECRET')) return { ok: true, msg: 'set' };
  if (name === 'RAZORPAY_KEY_ID' || name === 'VITE_RAZORPAY_KEY_ID') {
    return value.startsWith('rzp_test_') ? { ok: true, msg: 'set (test key)' } : { ok: true, msg: 'set (verify test vs live)' };
  }
  if (
    name.startsWith('RAZORPAY_PLAN_') &&
    (name.endsWith('_MONTHLY') || name.endsWith('_ANNUAL'))
  ) {
    return value.startsWith('plan_')
      ? { ok: true, msg: 'set' }
      : { ok: false, msg: 'expected plan_...' };
  }
  return { ok: true, msg: 'set' };
}

const rootEnv = loadEnv(rootEnvPath);
const clientEnv = loadEnv(clientEnvPath);
// Vite can load from root .env when running from root
const combinedClient = { ...rootEnv, ...clientEnv };

/** Same as api/src/main.ts — DATABASE_URL from PG* when not in file */
function effectiveDatabaseUrl() {
  const fileUrl = rootEnv.DATABASE_URL || '';
  const envUrl = process.env.DATABASE_URL || '';
  if (fileUrl || envUrl) return fileUrl || envUrl;
  const pgUser = rootEnv.PGUSER || process.env.PGUSER;
  const pgPass = rootEnv.PGPASSWORD || process.env.PGPASSWORD;
  const pgHost = rootEnv.PGHOST || process.env.PGHOST;
  if (!pgUser || !pgPass || !pgHost) return '';
  const port = rootEnv.PGPORT || process.env.PGPORT || '5432';
  const db = rootEnv.PGDATABASE || process.env.PGDATABASE || 'neondb';
  const user = encodeURIComponent(pgUser);
  const password = encodeURIComponent(pgPass);
  return `postgresql://${user}:${password}@${pgHost}:${port}/${db}?sslmode=require`;
}

let failed = 0;

console.log('=== Payment test prerequisites ===\n');

function envValue(name) {
  if (name === 'DATABASE_URL') {
    const u = effectiveDatabaseUrl();
    return u;
  }
  return rootEnv[name] || process.env[name] || '';
}

console.log('Root .env:');
requiredRootVars.forEach((name) => {
  const value = envValue(name);
  const { ok, msg } = checkValue(name, value);
  if (!ok) failed++;
  console.log(`  ${name}: ${ok ? 'OK' : 'MISSING'} ${msg}`);
});

console.log('\nClient (VITE_* from root .env or client/.env.development):');
requiredClientVars.forEach((name) => {
  const value = combinedClient[name] || process.env[name] || '';
  const { ok, msg } = checkValue(name, value);
  if (!ok) failed++;
  console.log(`  ${name}: ${ok ? 'OK' : 'MISSING'} ${msg}`);
});

if (failed > 0) {
  console.log('\n❌ Some required variables are missing. Fix and re-run.');
  process.exit(1);
}

console.log('\n✅ All required variables present. You can run the app and test payment.');
process.exit(0);
