# PR Task List — US-DESIGN-001

> **Story:** [STORY.md](./STORY.md)  
> **Type:** Manual QA — no code changes unless manual walk-through surfaces issues  
> **Branch:** only needed if AC1–3 uncover bugs requiring fixes  
> **PR:** — (QA-only milestone; PR opened only if code changes needed)

---

## This Story's Work Is QA-Driven

US-DESIGN-001 is the **baseline verification** story. Phase A automated QA already verified ACs 4–7. This task list covers the **human verification steps** for ACs 1–3.

If the walk-through reveals bugs, those become tasks in US-DESIGN-002 (design token fixes) or a new fix story.

---

## Human QA Tasks

### T1 — Theme toggle walk-through
**Where:** `localhost:5000/account` → Appearance section  
**AC:** AC1  
**Steps:**
1. Open account page
2. Click theme toggle: confirm switches Light → Dark → System
3. In System mode: use OS color scheme toggle — verify app changes within 2 seconds without reload
4. Verify UserProfileDropdown shows current theme selection

**Record in TC-DS-001-08:**  
- Pass: check AC1 ✅ in STORY.md  
- Fail: open a fix story, note exact failure observed

---

### T2 — Light mode visual walk-through (all pages)
**Pages to check:** Templates · My Designs · Account · Usage Dashboard · Pricing · Auth  
**AC:** AC2  
**Steps:**
1. Set theme to Light
2. Visit each page — check:
   - All text is readable (not invisible light-on-light)
   - Card/panel backgrounds clearly bounded
   - Buttons have visible labels
   - No gray/dark panels appearing on a light page

**Record in TC-DS-001-09:**  
- Note any page + element where contrast looks wrong → screenshot + file name in Finding column

---

### T3 — Dark mode visual walk-through (all pages)
**Pages to check:** Templates · My Designs · Account · Usage Dashboard · Pricing · Auth  
**AC:** AC3  
**Steps:**
1. Set theme to Dark
2. Same checklist as T2 but in Dark mode
3. Special check: Account page billing section, org section — is all text visible?

**Record in TC-DS-001-10**

---

### T4 — If code changes needed after T1–T3
Only create a branch and PR if you find bugs. Use this branch name:
```bash
git checkout -b fix/design-us-design-001-theme-toggle
```
Commit: `fix(theme): {what was broken} — US-DESIGN-001`

---

## File-to-Task Mapping (if code changes needed)

| File | Issue | AC |
|------|-------|----|
| `client/src/lib/theme-provider.tsx` | Theme toggle logic | AC1 |
| `client/src/index.css` | Missing Light mode token override | AC2 |
| `client/src/components/UserProfileDropdown.tsx` | Toggle UI not showing state | AC1 |

---

## Exact Test Commands

```bash
# If code changes were made:
npm run check           # TypeScript — must pass
npm run test:unit       # must pass

# Re-run automated theme tests to confirm no regression
npm run test:e2e -- --grep "design-consistency"
```

---

## Task Checklist

- [ ] T1 — Theme toggle walk-through (AC1)
- [ ] T2 — Light mode all pages visual check (AC2)
- [ ] T3 — Dark mode all pages visual check (AC3)
- [ ] TC-DS-001-08/09/10 results recorded in STORY.md
- [ ] If bugs found: fix story opened OR fix PR merged
- [ ] STORY.md ACs 1–3 checked ✅ or deferred with reason

---

*Tasks created: 2026-04-15*
