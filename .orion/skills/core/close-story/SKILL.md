---
name: close-story
version: 2.0.0
description: >
  Mark a story as Done and cascade all status updates: STORY.md, parent MILESTONE.md,
  parent EPIC.md (with Implementation Update closure entry), TEAM_STATUS.md
  (Now → Done), PHASE_TRACKER.md, AGILE_INDEX.md. Checks DoD before closing.
  If the milestone or epic is now fully done, appends a milestone-closure entry to
  EPIC.md + PHASE_TRACKER.md.
triggers:
  - "close story"
  - "mark story done"
  - "story complete"
  - "story finished"
  - "mark as done"
  - "wrap up story"
domains:
  - all
---

# Skill: close-story

## Purpose

Close a story properly — verify DoD, cascade status to parents, flag milestone/epic completion if applicable.

## Input

Required:
- **Story ID** (e.g., `US-AUTH-031`)
- **PR number** (e.g., `#42`)

Optional: Override reason for DoD bypass

## Protocol

### Step 1 — Locate Story Files

Glob: `{paths.epics}/**/stories/{US-ID}/STORY.md`

### Step 2 — Verify DoD

Check each item in STORY.md Definition of Done. If any unchecked, STOP and report:

```
⛔ Cannot close {US-ID} — DoD incomplete:
  ✅ All ACs checked
  ❌ {gate 1 command} not confirmed
  ❌ Manual flow not verified
  ✅ PR opened
  ❌ TASKS.md task list not fully checked

Resolve or provide written DoD exception reason.
```

**DoD bypass:** If user provides written reason, document in STORY.md:
```markdown
> **DoD exception:** {item} skipped — {reason}. Approved by: {name}, {date}.
```

### Step 3 — Update STORY.md

1. Status: `🔲` or `🟡` → `✅ Done`
2. Closed date: `—` → today
3. PR number: `#_____` → `#{number}`
4. Check all verifiably-done DoD items

### Step 4 — Update TASKS.md

- PR field → `#{number}`
- Check completed tasks
- Skipped tasks → `~~T{N}~~  _(skipped — {reason})_`

### Step 5 — Update Parent MILESTONE.md

Update story row to `✅`. Then check: are ALL stories in milestone now ✅?
- Yes → milestone status `🟡` → `✅ Done`, flag `🎉 Milestone {M-ID} complete!`
- No → leave milestone as `🟡`

### Step 6 — Update Parent EPIC.md

Update story row to `✅`. Append a dated closure entry to the "Implementation Update (log)"
section (newest at top):

```markdown
### {YYYY-MM-DD} — US-{DOMAIN}-{NNN} closed (PR #{N} merged)
- **PR:** [{N}](https://github.com/{org}/{repo}/pull/{N})
- **ACs:** all checked ✅
- **Closed by:** /close-story
- **Notes:** {pull from STORY.md final-update entry if present}
```

Check: are ALL stories in epic now ✅?
- Yes → epic status `🟡` → `✅ Done`, flag `🎉 Epic {EPIC-ID} complete!`, append an epic-closure
  entry to the log (separate from the story-closure entry above)
- No → leave as `🟡`

### Step 6.5 — Update TEAM_STATUS.md

In the relevant domain section of `{paths.team_status}`:
- Remove this story from "🟡 In Progress (Now)"
- Add it to "✅ Recently Closed (last 7 days)" with PR # and closure date
- Update the "Quick Scan" table row for this domain (clear Active Story if this was it; if the
  domain has another active story, point to that)
- If any other story in the board has this story listed in its "Blocker?" or "Blocked By" column,
  remove the dependency note (the unblock cascade)

### Step 7 — Update PHASE_TRACKER.md

Update story count for the epic's row. If milestone or epic closed:
- Append a milestone-closure entry to PHASE_TRACKER.md's deliverables log
- Update epic row status
- Update phase row status if all epics in the phase are now ✅

### Step 8 — Update AGILE_INDEX.md

Update story count: `{done}/{total}` and remaining.

### Step 8.5 — Memory Prompt (if applicable)

If `docs/agile/memory/` exists, offer to save story-specific learnings before closing:

```
💡 Before closing — anything worth preserving in docs/agile/memory/?
   Examples:
   - A surprising constraint or dependency discovered during implementation → project_{slug}.md
   - A pattern the team should apply to future stories in this domain → feedback_{slug}.md
   - An external resource consulted that future stories will need → reference_{slug}.md

   To save: create docs/agile/memory/{type}_{slug}.md, add a bullet to MEMORY.md.
```

Skip this prompt if the story was routine with no surprises.

### Step 9 — Print Report

```
✅ Story Closed: {US-ID} — {title}
   PR: #{number} | Closed: {date}
   
   Parent milestone: {M-ID}
     Status: {still open | 🎉 NOW COMPLETE}
     Stories remaining: {N}
   
   Parent epic: {EPIC-ID}
     Status: {still open | 🎉 NOW COMPLETE}
     Stories done: {N}/{total}

   Files updated: STORY · TASKS · MILESTONE · EPIC (+log entry) · TEAM_STATUS · PHASE_TRACKER · AGILE_INDEX

   {if milestone complete:}
   🎉 MILESTONE COMPLETE: {M-ID}
      Next milestone: {next M-ID}
      
   {if epic complete:}
   🎉 EPIC COMPLETE: {EPIC-ID}
      Gate check: review PHASE_TRACKER.md phase gate criteria.
```

## Edge Cases

| Situation | Rule |
|-----------|------|
| PR not yet merged | Status → 🟡 In Progress. Don't close. |
| Story has multiple PRs | List all in PR field: `#42, #43` |
| Milestone has blocked story | Defer original, create follow-up story |
| Story ID not found | STOP. Confirm ID. |

---

*Skill version: 2.0.0 | Updated: 2026-05-21 | Changes: ORION v0.2.0 — EPIC.md log entry, TEAM_STATUS cascade, milestone-closure entries in PHASE_TRACKER*
