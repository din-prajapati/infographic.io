# Session handoff — US-LAUNCH-014 closed, 7 items open

> **Covers:** 2026-09-14 → 2026-10-01 · **Branch:** `main` @ `42fb213` · **Read this first in a new chat.**

---

## One-paragraph state

`US-LAUNCH-014` (sign-up verification gate + abuse controls) is **✅ Done, merged and deployed** to staging and
production. Closing it surfaced four defects and one two-week outage that had nothing to do with the story, all of
which are filed below. Both environments are live on `7044a44`+ after being **down for 15 days**. EPIC-LAUNCH-01 is
14/17; the revenue-on gate is still one story away (US-LAUNCH-005 AC5/6, a real ₹ transaction).

---

## Environment facts worth knowing before touching anything

| Fact | Detail |
|---|---|
| **staging DB == local dev DB** | Both are Neon `ep-billowing-cell`. Production is `ep-aged-king`. Local testing writes to staging data. |
| **Both envs deploy from `main`** | `deploy.yml`'s header claims production deploys on `v*` tags — **it does not**. A push to `main` rebuilds *both*. Last tag `v1.0.0` (2026-08-30). |
| **Production is behind Cloudflare** | `x-forwarded-for` begins at a Cloudflare address (`172.71.x.x`); the real client is **only** in `cf-connecting-ip` / `x-real-ip`. Staging is not fronted. |
| **`TRUSTED_PROXY_HOPS=3`** | Measured, not assumed. `2` was predicted and wrong. |
| **Containers run `prisma db push` on boot** | `railway.json:8` → `npm run db:deploy && npm start`. See BL-33: this makes rollback impossible once the schema moves ahead. |
| **Deploy lag ~3–5 min** | A variable change triggers a rebuild. Any measurement taken before the container swaps is measuring the OLD build — this cost three wrong readings this session. Detect the swap by watching `uptime` **drop** in `/api/v1/health`. |
| **Env vars now set** | staging: `TRUSTED_PROXY_HOPS=3`, `INTERNAL_TEST_EMAIL_DOMAINS=test.local`, `THROTTLE_DEBUG=0`. production: `TRUSTED_PROXY_HOPS=3`, `THROTTLE_DEBUG=0`, **no** allowlist (deliberate). |

---

## Open items

| # | Item | Priority | Why it matters |
|---|---|:--:|---|
| **BL-33** | Boot-time `prisma db push` blocks rollback | **P1** | Once the DB is ahead of a build, **older builds cannot boot** — they try to revert the schema and are refused. Proven live: both envs stayed down until new code shipped. The tempting unblock (`--accept-data-loss`) would silently destroy live data. Fix: `prisma migrate deploy` as a release step, container starts with `npm start` alone. |
| **BL-34** | 15-day outage, no alerting | **P1** | Railway trial lapsed 2026-09-14; both envs served nothing until 2026-09-29 re-subscription. Nobody noticed. All four projects in the workspace were affected, incl. `lead-engine-n8n-prod`. Needs an uptime check + billing-failure alerts somewhere a human reads. |
| **BL-30** | `ValidationPipe` not rejecting bad input | P2 | `{"token":12345}` → 500 instead of 400; unknown fields not refused despite `forbidNonWhitelisted`. **Contradicts BL-19** — one of the two is wrong. Undermines the DTO-validation ACs that US-LAUNCH-016/017 depend on. |
| **BL-31** | Is `100/min` per IP right for real users? | P2 | One page load spends 10+ of the budget, and users behind corporate NAT share an IP. Now that limiting actually works, this value will bite someone. |
| **BL-32** | `AppHeader` overflows 375px by 100px | P2 | `scrollWidth 467` vs `clientWidth 367` on every signed-in page. Proven independent of US-LAUNCH-014's banner. Audience is agents on phones. |
| — | `hotfix/plat/redirect-to-auth-race` (`bf38e5c`) **unmerged** | — | Real fix with 8 passing tests: a token-less 401 armed the login-redirect flag, bouncing freshly logged-in users back to `/auth`. Stands on its own merits; was **not** the cause of the E2E flakiness it was found chasing. |
| — | `us-launch-015-editable-monetization` spec **stale** | — | Waits for an "Editable" toggle US-EDIT-009 removed on 2026-09-01. US-LAUNCH-015's monetization gate therefore has **no working E2E coverage**. Found spending $0.184 on a live run. |

---

## Next stories (already written, hardened, not started)

- **US-LAUNCH-016** — post-signup onboarding, screen 1 (required profile). M, 4–7 h.
- **US-LAUNCH-017** — onboarding brand kit, screen 2. M, 4–7 h. Depends on 016.
- Both lean on DTO validation → **settle BL-30 first** or their ACs will be unenforced at runtime.

---

## Verification shortcuts (reuse these)

```bash
# which build is actually serving, and has the container swapped?
curl -s https://app.buildographic.com/api/v1/health            # commitSha + uptime
curl -s https://infographic-production-staging.up.railway.app/api/v1/health

# does rate limiting engage? (needs one window, so burst in parallel)
seq 1 140 | xargs -P 14 -I{} curl -s -o /dev/null -w "%{http_code}\n" \
  https://app.buildographic.com/api/v1/health | sort | uniq -c   # expect ~100x200 then 429

# measured AI cost basis: $0.1495 avg, $0.274 max per charged op (UsageRecord)
# the 11 live-AI E2E specs ≈ $1–3 for a full run; one spec ≈ $0.18
```

**E2E:** `PLAYWRIGHT_BASE_URL` defaults to **staging** — always override it. Needs ~3 GB free RAM; below that the
suite produces false failures (cost two wrong diagnoses this session). Non-AI subset: 24 specs, 184 passed / 0 failed.

---

## Lessons that cost real time here

1. **Verify what you are measuring before interpreting it.** Three readings this session were taken against a
   container or process that wasn't the one just configured, and one against a memory-starved machine. Each looked
   like a genuine result.
2. **Run a failing test alone before theorising.** A spec passing in isolation and failing in its file points at
   accumulated state — one command would have replaced two wrong root-cause theories.
3. **Reach for cheap evidence first.** "Does this predate my branch?" was answered by `git show main:<file>` in
   seconds, after proposing a worktree + second server to find out.
4. **Local green says nothing about proxy-dependent behaviour.** Rate limiting passed every local test and was
   inert in both deployed environments.

*Written 2026-10-01.*
