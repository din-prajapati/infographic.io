# Canary rollout checklist

Use before and during a staged production rollout (US-DEPLOY-005). Not needed for solo beta with low traffic.

## Steps

1. Read `.claude/skills/deploy-release-governance/SKILL.md` — **Protocol: Canary Rollout**.
2. Confirm production deploy target and intended version (tag / Railway deployment).
3. Present the **Canary Rollout Checklist** from `CHECKLISTS.md`.
4. Require explicit thresholds before start:
   - max error rate
   - max p95 latency
   - observation window per stage (e.g. 15–30 min)
5. Walk through Start → Stage 1 → Stage 2 → Full Release OR Rollback.
6. Output verdict per stage: **ADVANCE**, **HOLD**, or **ROLLBACK**.

## When to skip

- No production traffic yet — use Release checklist + flags instead.
- Change is flag-only with 0% rollout — no canary needed.
