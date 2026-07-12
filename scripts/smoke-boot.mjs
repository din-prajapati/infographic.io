#!/usr/bin/env node
/**
 * Boot smoke-check — does the NestJS API actually start and listen?
 *
 * Catches the class of bug that passes `tsc` AND mocked unit tests but crashes
 * at real startup — e.g. the EmailService→ConfigService DI boot crash (PT-12)
 * that left `main` un-bootable. tsc can't see it; a mocked unit test can't see
 * it; only booting the app does.
 *
 * Boot OK  = the port answers with ANY HTTP status (200 healthy, 503 db-down —
 *            both mean the app booted and is serving).
 * Boot FAIL = the process exits early, or nothing ever answers the port
 *            (connection refused) within the timeout.
 *
 * Uses a distinct port (SMOKE_PORT, default 3999) so it never collides with a
 * running `npm run dev` (:3001).
 *
 * Usage:  node scripts/smoke-boot.mjs   (or: npm run smoke:boot)
 */
import { spawn } from 'node:child_process';
import http from 'node:http';
import process from 'node:process';

const PORT = process.env.SMOKE_PORT || '3999';
const TIMEOUT_MS = Number(process.env.SMOKE_TIMEOUT_MS || 90_000);
const HEALTH = `http://localhost:${PORT}/api/v1/health`;
const isWin = process.platform === 'win32';

console.log(`[smoke:boot] starting NestJS on :${PORT} (timeout ${TIMEOUT_MS / 1000}s)…`);

const child = spawn('npx', ['tsx', 'src/main.ts'], {
  cwd: 'api',
  env: { ...process.env, API_PORT: PORT, PORT, NODE_ENV: 'development' },
  shell: isWin,
  stdio: ['ignore', 'pipe', 'pipe'],
});

child.stdout.on('data', (d) => process.stdout.write(d));
child.stderr.on('data', (d) => process.stderr.write(d));

let exited = false;
let exitCode = null;
child.on('exit', (code) => {
  exited = true;
  exitCode = code;
});

function killChild() {
  if (exited || child.pid == null) return;
  if (isWin) {
    spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' });
  } else {
    try {
      child.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  }
}

function ping() {
  return new Promise((resolve) => {
    const req = http.get(HEALTH, (res) => {
      res.resume();
      resolve(res.statusCode || 0);
    });
    req.on('error', () => resolve(0));
    req.setTimeout(2500, () => {
      req.destroy();
      resolve(0);
    });
  });
}

function finish(ok, msg) {
  console.log(msg);
  killChild();
  // brief grace for the kill to propagate, then exit
  setTimeout(() => process.exit(ok ? 0 : 1), 600);
}

const start = Date.now();
const loop = setInterval(async () => {
  if (exited) {
    clearInterval(loop);
    finish(false, `\n[smoke:boot] ❌ BOOT FAILED — API process exited (code ${exitCode}) before serving. See log above.`);
    return;
  }
  const code = await ping();
  if (code !== 0) {
    clearInterval(loop);
    finish(true, `\n[smoke:boot] ✅ BOOT OK — API answered on :${PORT} (HTTP ${code}) in ${((Date.now() - start) / 1000).toFixed(0)}s.`);
    return;
  }
  if (Date.now() - start > TIMEOUT_MS) {
    clearInterval(loop);
    finish(false, `\n[smoke:boot] ❌ BOOT TIMEOUT — API did not answer :${PORT} within ${TIMEOUT_MS / 1000}s.`);
  }
}, 2000);

process.on('SIGINT', () => finish(false, '\n[smoke:boot] interrupted'));
