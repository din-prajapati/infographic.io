# M-INFRA-01-durable-asset-storage — Durable Asset Storage

> **Epic:** [EPIC-INFRA-02](../EPIC.md)
> **Feature:** F-INFRA-01, F-INFRA-02
> **Status:** 🟡 **Code merged, milestone not closed** — all three stories ✅ Done and merged via
> [PR #46](https://github.com/din-prajapati/infographic.io/pull/46) (2026-09-01), Gate 1 green.
> The four Acceptance items below are *runtime* checks and **none has been run**, so the milestone
> is not Done. Card said "🔲 Not Started" until 2026-09-02 — closeout drift, corrected.
> **Target date:** before US-LAUNCH-005 AC6 (real ₹ transaction)
> **Branch:** `feat/infra/m-01-durable-asset-storage` (merged, deleted)

---

## Goal

Every generated infographic image, composed-design variant, and user-uploaded source photo lands
in a Cloudflare R2 bucket Buildographic owns — not on Ideogram's expiring CDN and not on the
NestJS container's ephemeral tmp dir — verified end-to-end on staging.

---

## Stories in this Milestone

| Order | Story | Title | Size | Blocked By | Status | PR |
|:-----:|-------|-------|:----:|------------|:------:|:--:|
| 1 | [US-INFRA-001](../stories/US-INFRA-001/STORY.md) | R2 bucket + StorageService | S | — | ✅ Done | [#46](https://github.com/din-prajapati/infographic.io/pull/46) |
| 2 | [US-INFRA-002](../stories/US-INFRA-002/STORY.md) | Persist generated images to owned storage | M | US-INFRA-001 | ✅ Done | [#46](https://github.com/din-prajapati/infographic.io/pull/46) |
| 2 | [US-INFRA-003](../stories/US-INFRA-003/STORY.md) | Move source-photo uploads off the ephemeral tmp dir | S | US-INFRA-001 | ✅ Done | [#46](https://github.com/din-prajapati/infographic.io/pull/46) |

---

## Acceptance (Milestone Done When…)

- [x] `Infographic.imageUrl` for a newly-created generation points at the owned R2 domain,
      not `ideogram.ai` — ✅ **verified on staging 2026-09-03.** All 3 variation URLs from a real
      AI Chat generation came back on `pub-c4533d683e4e45c68ab89280d537e997.r2.dev`, which is
      staging's own `R2_PUBLIC_URL`; none matched `ideogram.ai`.

      Automated in `e2e/us-edit-009-gate2.spec.ts`, riding along on a generation that story
      already pays for — the check itself is free. It reads the `/variations` API response rather
      than the canvas `<img src>`, because that src is the `/api/proxy-image` URL and would report
      the proxy's host no matter where the bytes actually live. The domain is matched per
      environment (production `assets.buildographic.com`, staging `*.r2.dev`), overridable with
      `R2_PUBLIC_URL_EXPECTED`, and the test refuses to pass vacuously if no `/variations`
      response was captured.

      **Production is not yet verified** — the `R2_*` vars were pushed 2026-09-03 and the
      deployment succeeded, but no generation has been run there. Same spec, pointed at
      `https://app.buildographic.com`, would answer it at the cost of one real generation and one
      real infographic record in production data.
- [ ] The `composedDesigns` cache (US-AI-048) keys off and serves the owned URL for new writes
- [ ] A source-photo upload survives a mid-generation Railway container restart
- [ ] Verified live: an infographic generated through this pipeline still renders after its
      original Ideogram URL would have expired (simulate by revoking/ignoring the Ideogram URL and
      confirming the app serves the R2 copy)
- [x] All stories above have status ✅ Done
- [x] Verification gates pass (Gate 1 mandatory; Gate 4 API smoke for the backend changes)

> **Updated 2026-09-03 — two of the four blockers cleared.**
>
> **Production now has all 5 `R2_*` variables.** Pushed 2026-09-03 in a single batched call,
> deployment SUCCESS, new instance serving (uptime 27s, DB connected), bucket
> `buildographic-assets` → `assets.buildographic.com`. Production is no longer storing new images
> on an expiring provider CDN by configuration — though that has not yet been *observed* there.
>
> **Check 1 is verified on staging** — see the evidence on the item above.
>
> Still open: check 3 (survives a container restart) and check 4 (renders after the provider URL
> would have expired). Both need real infrastructure events rather than assertions, and check 4
> needs elapsed time or a deliberate URL revocation. Neither is automatable as written.
>
> The failure mode to keep in mind for all of these: `uploadAndFallback` never throws, so a broken
> R2 degrades to the provider URL instead of failing the generation. Nothing errors and nothing
> looks wrong — the stored URL simply expires later, taking the customer's design with it. Every
> check here therefore asserts on the *stored URL*, never on whether the image renders.

---

## Notes / Blockers

- Gates the M-LAUNCH-02 revenue-on flip (`BETA_MODE=false`) — see
  [PHASE_TRACKER.md](../../../../PHASE_TRACKER.md) and
  [LAUNCH_TIMELINE.md §5](../../../../LAUNCH_TIMELINE.md). Not itself part of M-LAUNCH-02's story
  list — a separate epic/milestone whose completion is a precondition US-LAUNCH-005 AC6 should
  check before running the real ₹ transaction.
- Requires a Cloudflare account + R2 bucket provisioned (US-INFRA-001, HUMAN task: create the
  bucket and API token — Claude cannot self-provision third-party cloud credentials).
- No Prisma schema migration needed — `Infographic.imageUrl` stays a `String` column; only its
  *source* changes.
- Backfilling pre-existing `Infographic` rows (already pointing at Ideogram URLs) is explicitly out
  of scope for this milestone — see EPIC.md "Out of Scope."

---

*Milestone created: 2026-08-19*
