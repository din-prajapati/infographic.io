#!/usr/bin/env node
/**
 * Run the unit and/or E2E tests for one or more product modules.
 *
 *   npm run test:module -- listings                 unit (client + api) then E2E for listings
 *   npm run test:module -- listings editor --unit   unit tests only, two modules
 *   npm run test:module -- workspace --e2e          E2E only
 *   npm run test:module -- --changed                modules touched since main (git diff main...HEAD + working tree)
 *   npm run test:module -- --changed --base=HEAD~3  modules touched since another ref
 *   npm run test:module -- --list                   show modules and their test locations
 *   npm run test:module -- listings --dry-run       print the commands without running them
 *
 * The module map lives in scripts/test-modules.mjs.
 */
import { execSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { MODULES, modulesForPath } from './test-modules.mjs';

// Windows: a lower-case drive letter in the working directory (d:\ vs D:\) makes vitest load a spec file twice when
// path filters are passed ("failed to find the current suite"). Always run from the canonical upper-case drive path.
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..').replace(/^([a-z]):/, (_, drive) => `${drive.toUpperCase()}:`);

const args = process.argv.slice(2);
const flags = new Set(args.filter(arg => arg.startsWith('--') && !arg.includes('=')));
const base = args.find(arg => arg.startsWith('--base='))?.slice('--base='.length) ?? 'main';
const dryRun = flags.has('--dry-run');
const unitOnly = flags.has('--unit'), e2eOnly = flags.has('--e2e');
const runUnit = !e2eOnly, runE2e = !unitOnly;

if (flags.has('--list')) {
  for (const [name, m] of Object.entries(MODULES)) {
    console.log(`\n${name} — ${m.description}`);
    console.log(`  client unit: ${m.clientUnit.join(', ') || '—'}`);
    console.log(`  api unit:    ${m.apiUnit.join(', ') || '—'}`);
    console.log(`  e2e:         e2e/${m.e2e}/  (${m.e2eConfig ?? 'playwright.config.ts'})`);
  }
  process.exit(0);
}

let names = args.filter(arg => !arg.startsWith('--'));
if (flags.has('--changed')) {
  const git = command => execSync(command, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).split('\n').map(line => line.trim()).filter(Boolean);
  const files = new Set([...git(`git diff --name-only ${base}...HEAD`), ...git('git diff --name-only HEAD'), ...git('git ls-files --others --exclude-standard')]);
  const changed = new Set([...files].flatMap(modulesForPath));
  changed.delete('editor-real-backend'); // needs a running stack; run it on purpose, never implicitly
  names = [...new Set([...names, ...changed])];
  console.log(`Changed since ${base}: ${names.join(', ') || 'no mapped modules'}`);
  if (!names.length) process.exit(0);
}
if (!names.length) { console.error('Name at least one module, or pass --changed / --list.'); process.exit(2); }
const unknown = names.filter(name => !MODULES[name]);
if (unknown.length) { console.error(`Unknown module(s): ${unknown.join(', ')}. Known: ${Object.keys(MODULES).join(', ')}`); process.exit(2); }

const steps = [];
const clientUnit = [...new Set(names.flatMap(name => MODULES[name].clientUnit))];
const apiUnit = [...new Set(names.flatMap(name => MODULES[name].apiUnit))];
if (runUnit && clientUnit.length) steps.push({ label: 'client unit', cwd: 'client', cmd: ['npx', 'vitest', 'run', ...clientUnit] });
if (runUnit && apiUnit.length) steps.push({ label: 'api unit', cwd: 'api', cmd: ['npx', 'vitest', 'run', '--config', 'vitest.config.ts', ...apiUnit] });
if (runE2e) {
  const byConfig = new Map();
  for (const name of names) {
    const m = MODULES[name], config = m.e2eConfig ?? 'playwright.config.ts';
    if (!byConfig.has(config)) byConfig.set(config, []);
    byConfig.get(config).push(m.e2e);
  }
  for (const [config, folders] of byConfig) {
    // Playwright positional args are path filters; a trailing slash keeps "editor/" from matching "editor-legacy/".
    steps.push({ label: `e2e (${config})`, cwd: '.', cmd: ['npx', 'playwright', 'test', '-c', config, ...folders.map(folder => `${folder}/`)] });
  }
}

let failed = 0;
for (const step of steps) {
  console.log(`\n▶ ${step.label}: (cd ${step.cwd} && ${step.cmd.join(' ')})`);
  if (dryRun) continue;
  const result = spawnSync(step.cmd[0], step.cmd.slice(1), { cwd: path.join(repoRoot, step.cwd), stdio: 'inherit', shell: process.platform === 'win32' });
  if (result.status !== 0) failed++;
}
if (failed) { console.error(`\n${failed} step(s) failed.`); process.exit(1); }
