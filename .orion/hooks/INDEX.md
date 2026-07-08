---
title: Hooks — INDEX
type: index
tags: [orion, index]
updated: 2026-05-20
---

# Hooks — INDEX

> Automated shell commands triggered by Claude Code events.
> Configured in `.claude/settings.json` of the host project.
> Source-of-truth scripts live here in `/aine/.orion/hooks/`.

---

## Roster

| Hook | Event | Effect | Cost |
|------|-------|--------|:----:|
| [pre-push-gate1](pre-push-gate1.sh) | `PreToolUse` on `Bash(git push*)` | Runs Gate 1 (typecheck + unit tests); blocks push on failure | shell |
| [post-edit-tasks-sync](post-edit-tasks-sync.sh) | `PostToolUse` on `Edit` of `**/TASKS.md` | Parses TASKS.md checkboxes → emits status hints | shell |
| [pre-edit-schema-warn](pre-edit-schema-warn.sh) | `PreToolUse` on `Edit` of schema files | Warns: "Schema change — confirm migration plan exists" | shell |
| [pre-edit-env-secret](pre-edit-env-secret.sh) | `PreToolUse` on `Edit` of `.env*` | Blocks edits that would commit real secrets | shell |
| [stop-session-summary](stop-session-summary.sh) | `Stop` | Appends 3-line session summary to TEAM_STATUS.md | shell |
| [post-edit-story-close-check](post-edit-story-close-check.sh) | `PostToolUse` on `Edit` of `**/STORY.md` | If status flipped to ✅ Done, suggests `/close-story` | shell |
| [session-start-recall](session-start-recall.sh) | `SessionStart` | Prints branch state, last session, in-progress stories, latest ADR | shell |
| [cascade-close-story](cascade-close-story.sh) | Invoked by PR-merge workflow or manually | Closes story IDs → cascades ✅ to MILESTONE/EPIC/PHASE/AGILE | shell |
| [compact-session-log](compact-session-log.sh) | Manual / weekly cron | Archives 7+ day session-log entries to `docs/agile/history/YYYY-WW.md`; trims TEAM_STATUS | shell |

**Cost:** "shell" = zero LLM tokens. All ORION hooks are shell-only by design.

---

## How to Enable

Copy `settings.example.json` to the host project's `.claude/settings.json`:

```bash
cp aine/.orion/settings.example.json /path/to/host-project/.claude/settings.json
```

Edit to enable/disable individual hooks by removing their entry. Path references inside the file use `${CLAUDE_PROJECT_DIR}` so hooks work from any working directory.

---

## Hook Authoring Rules

1. **Idempotent.** Running the same hook twice with the same input must produce the same result.
2. **Fast.** A hook should complete in < 5 seconds. Move slow work to background skills.
3. **No interactive prompts.** Hooks run non-interactively. Use exit codes and stderr for feedback.
4. **Use `${CLAUDE_PROJECT_DIR}`** instead of relative paths so hooks work from any CWD.
5. **Reads PROJECT_CONTEXT.yaml** when project-specific values are needed.
6. **Exit code 0 = allow, non-zero = block.** Only applies to `PreToolUse` hooks.
7. **Cross-platform.** Provide `.sh` for bash and `.ps1` for PowerShell where reasonable.

---

## Event Reference

| Event | When it fires | Can block? |
|-------|--------------|:----------:|
| `PreToolUse` | Before any tool call | ✅ (exit non-zero) |
| `PostToolUse` | After any tool call succeeds | ❌ |
| `Stop` | When Claude ends its turn | ❌ |
| `Notification` | On user-facing notifications | ❌ |
| `SubagentStop` | When a SubAgent ends | ❌ |

---

*Last updated: 2026-05-18*
