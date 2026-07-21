---
title: ADR-001: Email sending domain & DNS record scoping for buildographic.com
type: template
tags: [orion, template]
updated: 2026-07-21
---

# ADR-001: Email sending domain & DNS record scoping for buildographic.com

> **Status:** ✅ Accepted
> **Date:** 2026-07-21
> **Deciders:** Dinesh (product owner), Claude (implementation)
> **Scope:** domain:LAUNCH

## Context

`buildographic.com` was purchased 2026-07-17 to unblock the single hard requirement of the public beta: real password-reset email delivery (US-LAUNCH-003) and M-LAUNCH-01's "email arrives in a real inbox" acceptance criterion. Without a verified sending domain, Resend only delivers from `onboarding@resend.dev` to the account owner's own inbox — real beta users never receive the reset link. Resend requires DKIM, SPF, and (optionally) MX + DMARC records to verify a domain for sending.

## Decision

Send transactional email from the **`send.buildographic.com` subdomain**, not the apex domain — via Resend, with DNS configured at Namecheap:

- **DKIM**: TXT `resend._domainkey` → Resend-generated key (per-account, verified byte-for-byte during setup)
- **MX** (bounce/complaint handling): `send` → `feedback-smtp.ap-northeast-1.amazonses.com`, priority 10
- **SPF**: TXT `send` → `v=spf1 include:amazonses.com ~all`
- **DMARC**: TXT `_dmarc` → `v=DMARC1; p=none;` (monitor-only to start)

Adding the MX record required switching Namecheap's domain-wide **Mail Settings** mode from "Email Forwarding" to **Custom MX** — Namecheap does not expose an MX record type in the generic host-records "Add New Record" flow; it's gated behind this mode selector regardless of which host the MX record targets.

## Alternatives Considered

- **Send from the apex domain (`buildographic.com`) directly** — rejected: couples transactional-email sender reputation to the root domain. If bulk/transactional mail ever gets flagged as spam, it would drag down deliverability for future root-domain business email (`hello@`, `support@`) too. Subdomain isolation is standard SaaS practice for exactly this reason.
- **Leave Namecheap on "Email Forwarding" and skip the MX record** — considered as a fallback since MX is only for bounce/complaint handling, not required for SPF/DKIM to pass. Rejected once we confirmed no forwarders were actually configured under Email Forwarding (nothing to lose by switching), and MX is best-practice per Resend's own setup instructions.
- **Skip DMARC for now** — rejected: negligible cost to add `p=none` today; it establishes visibility (aggregate reports) before any policy tightening, rather than delaying and losing that monitoring window.

## Consequences

- ➕ Root domain's future email reputation (support/marketing inboxes) is isolated from transactional-sending reputation.
- ➕ DMARC monitoring is live from day one, ahead of any policy enforcement — gives lead time to catch alignment issues before tightening.
- ➖ Namecheap's Mail Settings is a single domain-wide switch; enabling Custom MX for the `send` subdomain also changes how the registrar would handle any future root-domain (`@`) mail routing, even though no MX record was added at the root.
- ⚠️ **Follow-up required:** DMARC policy is `p=none` (report-only). Tighten to `p=quarantine` then `p=reject` after a few weeks of clean aggregate reports, once SPF/DKIM alignment is confirmed stable.
- ⚠️ **Follow-up required:** Root domain (`@buildographic.com`) mail is not yet configured — no inbox exists for `hello@` / `support@`. A separate decision (Google Workspace, Zoho Mail, or Namecheap Private Email) is needed before advertising a root-domain contact address.

## References

- US-LAUNCH-002 — Transactional email foundation (EmailService)
- US-LAUNCH-003 — Forgot/reset password flow (the consumer of this domain verification)
- M-LAUNCH-01-public-beta — milestone acceptance criterion #2 (real-inbox email delivery)
- `docs/setup/ENVIRONMENTS.md` §6a — `RESEND_API_KEY` / `EMAIL_FROM` env contract
- `docs/agile/LAUNCH_TIMELINE.md` — domain decision context (2026-07-17)
