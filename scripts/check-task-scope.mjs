#!/usr/bin/env node
// Scope check (ADR-004, rule 4): fail when a PR changes files that its stories' TASKS.md does not list.
//
// Stories come from the PR title and branch name:
//   - US-XXX-NNN anywhere in the title or branch
//   - a milestone branch (feat/<domain>/m-<nn>-<slug>) adds every story in that milestone's table
// Allowed files per story: backticked paths in TASKS.md "File → Task Map" (first column);
// if a story has no map, the "Primary files touched" list in STORY.md.
//
// Usage (CI or local):
//   node scripts/check-task-scope.mjs --base origin/main [--head HEAD] [--title "..."] [--branch name]
// Env fallbacks: PR_TITLE, PR_BRANCH, BASE_REF. Exit 0 = pass or skipped, 1 = out-of-scope files found.

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join, sep } from 'node:path';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, all) => {
    if (a.startsWith('--')) acc.push([a.slice(2), all[i + 1] && !all[i + 1].startsWith('--') ? all[i + 1] : 'true']);
    return acc;
  }, []),
);

const git = (...a) => execFileSync('git', a, { encoding: 'utf8' }).trim();
const base = args.base || process.env.BASE_REF || 'origin/main';
const head = args.head || 'HEAD';
const title = args.title ?? process.env.PR_TITLE ?? '';
const branch = args.branch ?? process.env.PR_BRANCH ?? git('rev-parse', '--abbrev-ref', 'HEAD');

const EPICS_DIR = 'docs/agile/epics';
const read = (p) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');

// Always in scope: agile docs and the story/tracker files a story is expected to update.
const ALWAYS_ALLOWED = [/^docs\//, /(^|\/)(STORY|TASKS)\.md$/];

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p.split(sep).join('/'));
  }
  return out;
}

const allDocs = existsSync(EPICS_DIR) ? walk(EPICS_DIR) : [];

function storyDir(id) {
  const hit = allDocs.find((p) => p.endsWith(`/stories/${id}/STORY.md`));
  return hit ? hit.slice(0, -'/STORY.md'.length) : null;
}

function storiesFromMilestoneBranch(name) {
  // feat/prop/m-prop-01-property-record or feat/prop/m-01-property-record → M-PROP-01-property-record.md
  const m = name.match(/^feat\/([a-z0-9-]+)\/(m-(?:[a-z]+-)?\d+(?:-[a-z0-9-]+)?)$/i);
  if (!m) return [];
  const domain = m[1].toLowerCase();
  const slug = m[2].toLowerCase();
  const withDomain = slug.startsWith(`m-${domain}-`) ? slug : slug.replace(/^m-/, `m-${domain}-`);
  const file = allDocs.find((p) => /\/milestones\/M-[^/]+\.md$/.test(p) && p.toLowerCase().endsWith(`/${withDomain}.md`));
  if (!file) return [];
  return [...new Set(read(file).match(/US-[A-Z]+-\d+/g) ?? [])];
}

// `a/{X,Y}.tsx` → `a/X.tsx`, `a/Y.tsx`
function expandBraces(p) {
  const m = p.match(/^(.*?)\{([^{}]+)\}(.*)$/);
  return m ? m[2].split(',').flatMap((part) => expandBraces(`${m[1]}${part.trim()}${m[3]}`)) : [p];
}

const looksLikePath = (s) => /[/.]/.test(s) && !/\s/.test(s);

function backtickedPaths(text) {
  return (text.match(/`([^`]+)`/g) ?? []).map((s) => s.slice(1, -1).trim()).filter(looksLikePath);
}

// Bullets: first backticked path per bullet (later ones are usually explanation).
// Table rows: backticked paths in the first column.
function pathsInSection(section) {
  return section.split('\n').flatMap((l) => {
    if (/^\s*\|/.test(l)) return backtickedPaths(l.split('|')[1] ?? '');
    if (/^\s*[-*]\s/.test(l)) return backtickedPaths(l).slice(0, 1);
    return [];
  });
}

function allowedFilesFor(id) {
  const dir = storyDir(id);
  if (!dir) return { source: 'missing', paths: [] };
  const story = read(`${dir}/STORY.md`);
  const tasks = existsSync(`${dir}/TASKS.md`) ? read(`${dir}/TASKS.md`) : '';
  const done = (source, paths) => ({ source, paths: paths.flatMap(expandBraces) });

  // 1. Lane-style STORY.md: a yaml `owns:` list.
  const owns = story.match(/^owns:\s*\n((?:\s+-\s+.*\n?)+)/m);
  if (owns) {
    const paths = owns[1].split('\n').map((l) => l.replace(/^\s+-\s+/, '').replace(/\s+#.*$/, '').trim()).filter(looksLikePath);
    if (paths.length) return done('STORY.md owns:', paths);
  }

  // 2. A TASKS.md file section: "File → Task Map", "File-to-Task Mapping", "Files in scope", "Primary files touched", …
  const section = tasks.split(/^## /m).find((s) => /^(Files?\b|Primary files)/i.test(s));
  if (section) {
    const paths = pathsInSection(section);
    if (paths.length) return done('TASKS.md', paths);
  }

  // 3. STORY.md "Primary files touched" bullets.
  const primary = story.split(/\*\*Primary files touched:\*\*/)[1]?.split(/\n## |\n---/)[0] ?? '';
  return done('STORY.md', pathsInSection(primary));
}

function toMatcher(p) {
  const clean = p.replace(/^\.\//, '');
  if (clean.includes('*')) {
    const re = clean.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*\*/g, '§').replace(/\*/g, '[^/]*').replace(/§/g, '.*');
    return (f) => new RegExp(`^${re}$`).test(f);
  }
  if (clean.endsWith('/')) return (f) => f.startsWith(clean);
  return (f) => f === clean;
}

// --- main -------------------------------------------------------------------

const ids = [
  ...new Set([...(`${title} ${branch}`.toUpperCase().match(/US-[A-Z]+-\d+/g) ?? []), ...storiesFromMilestoneBranch(branch)]),
];

if (!ids.length) {
  console.log(`scope-check: no story ID in title or branch ("${branch}") — skipped.`);
  process.exit(0);
}

const changed = git('diff', '--name-only', '--diff-filter=ACMRD', `${base}...${head}`).split('\n').filter(Boolean);

const matchers = [];
const warnings = [];
for (const id of ids) {
  const { source, paths } = allowedFilesFor(id);
  if (source === 'missing') warnings.push(`${id}: no STORY.md found under ${EPICS_DIR}`);
  else if (!paths.length) warnings.push(`${id}: no file list in TASKS.md or STORY.md`);
  else console.log(`scope-check: ${id} → ${paths.length} file(s) from ${source}`);
  for (const p of paths) {
    matchers.push(toMatcher(p));
    // A schema change brings its generated migration with it.
    if (p.endsWith('api/prisma/schema.prisma')) matchers.push((f) => f.startsWith('api/prisma/migrations/'));
    // A package.json change brings its lock file with it.
    if (p.endsWith('package.json')) matchers.push((f) => f === p.replace(/package\.json$/, 'package-lock.json'));
    // Unit tests for a listed file may live in a __tests__ folder beside it (unit-test-agent writes them there).
    const dir = p.includes('/') ? p.slice(0, p.lastIndexOf('/') + 1) : '';
    if (!p.includes('*') && !p.endsWith('/')) matchers.push((f) => f.startsWith(`${dir}__tests__/`));
  }
}

warnings.forEach((w) => console.log(`scope-check: warning — ${w}`));

if (!matchers.length) {
  console.log('scope-check: no file lists found for these stories — skipped (warning only).');
  process.exit(0);
}

const outOfScope = changed.filter((f) => !ALWAYS_ALLOWED.some((re) => re.test(f)) && !matchers.some((m) => m(f)));

if (!outOfScope.length) {
  console.log(`scope-check: PASS — ${changed.length} changed file(s), all in scope for ${ids.join(', ')}.`);
  process.exit(0);
}

console.log(`scope-check: FAIL — ${outOfScope.length} file(s) not listed in TASKS.md for ${ids.join(', ')}:`);
outOfScope.forEach((f) => console.log(`  - ${f}`));
console.log('Fix: add the file to the story\'s File → Task Map (if it belongs), revert it, or add the `scope-override` label with a reason in the PR.');
process.exit(1);
