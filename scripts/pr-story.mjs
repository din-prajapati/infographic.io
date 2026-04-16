#!/usr/bin/env node
/**
 * Story PR helper — GitHub-aligned two-phase flow:
 *   1) PR_BODY.draft.md locally (review before GitHub)
 *   2) gh pr create --draft → gh pr ready (when you want formal review)
 *
 * Usage:
 *   node scripts/pr-story.mjs resolve US-DESIGN-002
 *   node scripts/pr-story.mjs init-draft US-DESIGN-002
 *   node scripts/pr-story.mjs save-draft US-DESIGN-002 path/to/body.md
 *   node scripts/pr-story.mjs create US-DESIGN-002 --title "[US-…] …" [--body-file PATH] [--draft | --ready]
 *   node scripts/pr-story.mjs promote <PR_NUMBER>
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const EPICS_DIR = path.join(REPO_ROOT, 'docs', 'agile', 'epics');

function usage() {
  console.error(`Usage:
  node scripts/pr-story.mjs resolve <STORY_ID>
  node scripts/pr-story.mjs init-draft <STORY_ID>     # copy PR_BODY.md → PR_BODY.draft.md if present
  node scripts/pr-story.mjs save-draft <STORY_ID> <SOURCE_MARKDOWN_FILE>
  node scripts/pr-story.mjs create <STORY_ID> --title "..." [--body-file PATH] [--draft | --ready]
  node scripts/pr-story.mjs promote <PR_NUMBER>       # gh pr ready (draft → ready for review)

Examples:
  node scripts/pr-story.mjs create US-DESIGN-002 --title "[US-DESIGN-002] Token polish" --draft
  node scripts/pr-story.mjs promote 1
`);
  process.exit(1);
}

function normalizeStoryId(raw) {
  const s = String(raw).trim().toUpperCase();
  const m = s.match(/^US-([A-Z]+)-(\d+)$/);
  if (!m) {
    console.error(`Invalid story id: ${raw} (expected US-DOMAIN-NNN, e.g. US-DESIGN-002)`);
    process.exit(1);
  }
  return `US-${m[1]}-${m[2].padStart(3, '0')}`;
}

function findStoryDir(storyIdRaw) {
  const id = normalizeStoryId(storyIdRaw);
  if (!fs.existsSync(EPICS_DIR)) {
    console.error(`Epics dir missing: ${EPICS_DIR}`);
    process.exit(1);
  }
  for (const name of fs.readdirSync(EPICS_DIR)) {
    const epicPath = path.join(EPICS_DIR, name);
    if (!name.startsWith('EPIC-') || !fs.statSync(epicPath).isDirectory()) continue;
    const candidate = path.join(epicPath, 'stories', id);
    if (fs.existsSync(path.join(candidate, 'STORY.md'))) return { dir: candidate, id };
  }
  console.error(`Story not found under ${EPICS_DIR}: ${id}`);
  process.exit(1);
}

function assertInsideRepo(absPath) {
  const resolved = path.resolve(absPath);
  const rootWithSep = REPO_ROOT.endsWith(path.sep) ? REPO_ROOT : REPO_ROOT + path.sep;
  if (resolved !== REPO_ROOT && !resolved.startsWith(rootWithSep)) {
    console.error(`Path escapes repo root: ${absPath}`);
    process.exit(1);
  }
}

function runGh(args) {
  const r = spawnSync('gh', args, { stdio: 'inherit', cwd: REPO_ROOT, env: process.env });
  if (r.error) {
    console.error(r.error.message);
    process.exit(1);
  }
  if (r.status !== 0) process.exit(r.status ?? 1);
}

const argv = process.argv.slice(2);
if (argv.length < 2) usage();

const cmd = argv[0];
const arg1 = argv[1];

if (cmd === 'resolve') {
  const { dir, id } = findStoryDir(arg1);
  console.log(id);
  console.log(dir);
  process.exit(0);
}

if (cmd === 'init-draft') {
  const { dir, id } = findStoryDir(arg1);
  const published = path.join(dir, 'PR_BODY.md');
  const draft = path.join(dir, 'PR_BODY.draft.md');
  if (!fs.existsSync(published)) {
    console.error(`No PR_BODY.md at ${published}; create PR_BODY.draft.md manually or use save-draft`);
    process.exit(1);
  }
  fs.copyFileSync(published, draft);
  console.log(`Wrote ${draft} (from PR_BODY.md)`);
  process.exit(0);
}

if (cmd === 'save-draft') {
  const source = argv[2];
  if (!source) usage();
  const { dir, id } = findStoryDir(arg1);
  const srcAbs = path.resolve(REPO_ROOT, source);
  assertInsideRepo(srcAbs);
  if (!fs.existsSync(srcAbs)) {
    console.error(`Source file not found: ${srcAbs}`);
    process.exit(1);
  }
  const dest = path.join(dir, 'PR_BODY.draft.md');
  fs.copyFileSync(srcAbs, dest);
  console.log(`Wrote ${dest}`);
  process.exit(0);
}

if (cmd === 'create') {
  const { dir, id } = findStoryDir(arg1);
  let title = '';
  let bodyFile = path.join(dir, 'PR_BODY.draft.md');
  let draft = true;

  const rest = argv.slice(2);
  for (let i = 0; i < rest.length; i++) {
    if (rest[i] === '--title' && rest[i + 1]) {
      title = rest[++i];
    } else if (rest[i] === '--body-file' && rest[i + 1]) {
      bodyFile = path.resolve(REPO_ROOT, rest[++i]);
    } else if (rest[i] === '--draft') draft = true;
    else if (rest[i] === '--ready') draft = false;
  }
  if (!title) {
    console.error('Missing --title "[US-…] Short description"');
    process.exit(1);
  }
  assertInsideRepo(bodyFile);
  if (!fs.existsSync(bodyFile)) {
    console.error(`Body file not found: ${bodyFile}`);
    console.error('Use: init-draft, save-draft, or --body-file path/to.md');
    process.exit(1);
  }

  const ghArgs = ['pr', 'create', '--base', 'main', '--title', title, '--body-file', bodyFile];
  if (draft) ghArgs.push('--draft');
  runGh(ghArgs);
  process.exit(0);
}

if (cmd === 'promote') {
  if (!/^\d+$/.test(arg1)) {
    console.error('promote requires numeric PR number (e.g. node scripts/pr-story.mjs promote 1)');
    process.exit(1);
  }
  runGh(['pr', 'ready', arg1]);
  process.exit(0);
}

usage();
