---
title: Stack Packs — INDEX
type: index
tags: [orion, skills, stacks]
updated: 2026-05-20
---

# Stack Packs — INDEX

> Tech-specific skill packs. **Loaded selectively** based on `.orion/scaffold.json` `layers` + `techs`.
> Mirrors the `.orion/rules/` tree exactly — same layer-first axis.
> Skill files are deferred to v0.2 — only the directory structure exists today.

---

## Layer-First Roster (skeleton present, skills v0.2)

Each tech folder ships an `INDEX.md` stub listing planned skills. Click any row to see the pack's planned scope.

| Layer | Tech | Pack INDEX |
|-------|------|------------|
| frontend | react | [`frontend/react/INDEX.md`](frontend/react/INDEX.md) |
| frontend | vue | [`frontend/vue/INDEX.md`](frontend/vue/INDEX.md) |
| frontend | tailwind | [`frontend/tailwind/INDEX.md`](frontend/tailwind/INDEX.md) |
| backend | nestjs | [`backend/nestjs/INDEX.md`](backend/nestjs/INDEX.md) |
| backend | fastapi | [`backend/fastapi/INDEX.md`](backend/fastapi/INDEX.md) |
| backend | express | [`backend/express/INDEX.md`](backend/express/INDEX.md) |
| database | prisma | [`database/prisma/INDEX.md`](database/prisma/INDEX.md) |
| database | drizzle | [`database/drizzle/INDEX.md`](database/drizzle/INDEX.md) |
| testing | vitest | [`testing/vitest/INDEX.md`](testing/vitest/INDEX.md) |
| testing | playwright | [`testing/playwright/INDEX.md`](testing/playwright/INDEX.md) |
| platform | railway | [`platform/railway/INDEX.md`](platform/railway/INDEX.md) |
| platform | vercel | [`platform/vercel/INDEX.md`](platform/vercel/INDEX.md) |
| integrations | razorpay | [`integrations/razorpay/INDEX.md`](integrations/razorpay/INDEX.md) |
| integrations | stripe | [`integrations/stripe/INDEX.md`](integrations/stripe/INDEX.md) |
| integrations | sentry | [`integrations/sentry/INDEX.md`](integrations/sentry/INDEX.md) |

**Convention:** new contributions to a pack drop SKILL.md files alongside its `INDEX.md`. Each skill lives in its own subfolder (`<pack>/<skill-name>/SKILL.md`).

---

## How Packs Load

In `.orion/scaffold.json`:
```json
{
  "layers": ["frontend", "backend", "database"],
  "techs": {
    "frontend": ["react", "tailwind"],
    "backend": ["nestjs"],
    "database": ["prisma"]
  }
}
```

The framework auto-discovers skills under `.orion/skills/stacks/<layer>/<tech>/<skill-name>/SKILL.md` and surfaces them only if `(layer, tech)` is in the scaffold. A pure-backend project never sees React skills.

---

## Authoring a New Pack (v0.2)

See [docs/how-to/add-new-tech-stack-pack.md](../../../docs/how-to/add-new-tech-stack-pack.md).

A pack is a folder with:
```
stacks/<layer>/<tech>/
  INDEX.md              ← skills in this pack (one-line each)
  <skill-name>/
    SKILL.md
    scripts/            ← optional
  ...
```

Each skill follows the SKILL.md frontmatter format used by core skills. Stack-specific skills must:
1. Read `.orion/scaffold.json` to confirm the `(layer, tech)` is declared
2. Reference the project's existing files/conventions (don't hardcode paths)
3. Stay focused on idioms specific to the pack — cross-stack concerns belong in core skills or rules

---

## Rules vs Skills (Important Distinction)

- **Rules** (`.orion/rules/<layer>/<tech>/RULES.md`) — *what to do/avoid*. Living documents. Ship as placeholders today.
- **Skills** (`.orion/skills/stacks/<layer>/<tech>/<name>/SKILL.md`) — *how to scaffold a thing*. Code-generating skills. Ship in v0.2.

Both axes match — adding a tech to scaffold.json loads both its rules (today) and its skills (v0.2).

---

*Last updated: 2026-05-20 | Skill files: v0.2.0*
