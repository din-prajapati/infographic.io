---
name: close-story
version: 1.0.0
description: >
  Mark a story as Done and cascade all status updates: STORY.md, parent MILESTONE.md,
  parent EPIC.md, PHASE_TRACKER.md, AGILE_INDEX.md. Checks DoD before closing.
  Flags if the milestone or epic is now complete.
triggers:
  - "close story"
  - "mark story done"
  - "story complete"
  - "story finished"
  - "mark as done"
  - "story is done"
  - "wrap up story"
domains:
  - all
---

# Skill: close-story

## Purpose

Close a story properly — not just changing a status emoji, but verifying the DoD,
cascading status to parent milestones and epics, and flagging milestone/epic completion
if all child stories are now done.

---

## Input

Required (ask if not provided):
- **Story ID:** `US-{DOMAIN}-{NNN}` (e.g., `US-AI-031`)
- **PR number:** GitHub PR # that merged this story (e.g., `#42`)

Optional:
- **Override reason:** If any DoD item is being skipped with explicit justification

---

## Protocol

### Step 1 — Locate Story Files

Find the story directory:
```
Glob: docs/agile/epics/**/stories/{US-ID}/STORY.md
```

Read both `STORY.md` and `TASKS.md`.

### Step 2 — Verify Definition of Done

Check each item in the STORY.md DoD section. If any item is unchecked, STOP and report:

```
⛔ Cannot close US-{ID} — DoD incomplete:
  ✅ All ACs checked
  ❌ npm run check not confirmed passed
  ❌ Manual flow not verified
  ✅ PR opened
  ❌ TASKS.md task list not fully checked

Resolve the above before closing. If you have a written justification for
skipping any item, provide it and Claude will document the exception.
```

**DoD bypass (must have explicit reason):**
If the user provides a written reason for bypassing a DoD item (e.g., "AC3 requires staging — deferred to US-DESIGN-003 QA story"), document it as:
```markdown
> **DoD exception:** AC3 skipped — requires staging environment. 
> Deferred to US-DESIGN-003 manual QA story. Approved by: Dinesh, 2026-05-18.
```
Add this note directly below the DoD checklist in STORY.md.

### Step 3 — Update STORY.md

Make these exact changes:
1. Status line: `🔲 Not Started` → `✅ Done`
2. Closed date: `**Closed:** —` → `**Closed:** {today's date}`
3. PR number: `**PR:** #_____` → `**PR:** #{number}`
4. All unchecked DoD items that are verifiably done: `- [ ]` → `- [x]`

### Step 4 — Update TASKS.md

1. PR number field: fill with `#{number}`
2. All tasks that were completed but not checked: check them
3. If any task was skipped: add note `~~T{N}~~  _(skipped — {reason})_`

### Step 5 — Update Parent MILESTONE.md

Find the parent milestone file (read from STORY.md's Milestone field).

In the Stories table, update the story row:
```
| [US-{ID}](../stories/US-{ID}/STORY.md) | {title} | ✅ | #{PR} |
```

Then check: are ALL stories in this milestone now `✅ Done`?
- **Yes →** Update milestone status: `🟡 In Progress` → `✅ Done`
  - Add closed date to milestone file
  - Flag: `🎉 Milestone {M-ID} is now complete!`
- **No →** Leave milestone status as `🟡 In Progress`

### Step 6 — Update Parent EPIC.md

Find the parent epic file (read from STORY.md's Epic field).

In the Stories table, update the story row:
```
| [US-{ID}](stories/US-{ID}/STORY.md) | {title} | M-{ID} | ✅ | #{PR} |
```

Check: are ALL stories in this epic now `✅ Done`?
- **Yes →** Update epic status: `🟡 In Progress` → `✅ Done`
  - Flag: `🎉 Epic {EPIC-ID} is now complete! Update AGILE_INDEX.md.`
- **No →** Leave epic status as `🟡 In Progress`. Count remaining open stories.

### Step 7 — Update PHASE_TRACKER.md

Find the epic's row in PHASE_TRACKER.md and update story status count.
If milestone closed: tick the milestone in the epic's milestone table.
If epic closed: update epic status in the phase table.

### Step 8 — Update AGILE_INDEX.md

Find the epic's row and update the story count and pending count:
```
| [EPIC-{ID}] | {title} | {status} | {done} / {total} stories | {remaining} |
```

### Step 9 — Print Closure Report

```
✅ Story Closed: {US-ID} — {title}
   PR: #{number} | Closed: {date}
   
   Parent milestone: {M-ID}
     {milestone status: still open | 🎉 NOW COMPLETE}
     Stories remaining: {N}
   
   Parent epic: {EPIC-ID}
     {epic status: still open | 🎉 NOW COMPLETE}
     Stories done: {N}/{total}

   Files updated:
     ✅ STORY.md (status, closed date, PR)
     ✅ TASKS.md (PR, final task checks)
     ✅ {M-ID}.md (story row, milestone status)
     ✅ EPIC.md (story row, epic status if changed)
     ✅ PHASE_TRACKER.md (story count)
     ✅ AGILE_INDEX.md (story count)

   {if milestone complete:}
   🎉 MILESTONE COMPLETE: {M-ID}
      Next milestone to start: {next M-ID in epic}
      
   {if epic complete:}
   🎉 EPIC COMPLETE: {EPIC-ID}
      Update team and stakeholders.
      Gate check: review PHASE_TRACKER.md phase gate criteria.
```

---

## Edge Cases

| Situation | Rule |
|-----------|------|
| PR not yet merged | Update story status to `🟡 In Progress`, PR field to "open: #{N}". Don't close until PR is merged. |
| DoD has unverifiable items (staging QA) | Document as DoD exception with reason. Still close the story. Create a follow-up QA story if needed. |
| Story has multiple PRs | List all PR numbers in STORY.md PR field: `#42, #43`. |
| Milestone has a story that's blocked indefinitely | Create a new deferred story, close the original with `**Closed:** {date} (deferred to {new-US-ID})`. |
| Story ID doesn't match any file | Stop. Ask user to confirm the ID. Do not create new files. |

---

*Skill version: 1.0.0 | Created: 2026-05-18*
