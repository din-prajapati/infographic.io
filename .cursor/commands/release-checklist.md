# Release checklist (deploy ≠ release)

Use when code is merged/deployed but you are deciding whether **users** should see the change — flag flip, staging sign-off, or production exposure.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md` — **Protocol: Release**.
2. Confirm current deploy state (staging auto on `main`, production on `v*` tag).
3. Present the **Release Checklist** from `CHECKLISTS.md`.
4. Ask which go/no-go path applies: internal only | canary % | 100% | hold.
5. If using feature flags: record env var name (`FEATURE_*_ENABLED` or `BETA_MODE`) and target environment before any flip.
6. Output verdict: **RELEASE GO** (with scope) or **HOLD**.

## Remember

- Merge approval ≠ release approval.
- Business/product approves user exposure; engineering approves safety.
- Rollback first option for risky features: **disable flag**, not emergency redeploy.
