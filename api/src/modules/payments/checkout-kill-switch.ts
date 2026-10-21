/**
 * The checkout kill-switch — `BETA_MODE`.
 *
 * ## What it is
 *
 * One environment variable that stops the product taking new money, without a
 * code change. `BETA_MODE=true` refuses every request that would start or
 * escalate a paid subscription.
 *
 * The name is historical. It was introduced to gate checkout during a public
 * beta, and beta-gating was retired by decision on 2026-10-19 — the product now
 * accepts payment whether it presents as beta or commercial. The variable is
 * deliberately **kept** and **repurposed** as an operational kill-switch: the
 * thing you reach for when the payment provider is misbehaving and charging
 * customers would be worse than turning the checkout off.
 *
 * ## Why it was rewritten (BL-29, D2)
 *
 * BL-29 happened because people reasoned about this flag as though it protected
 * checkout while it was unset — a guard that looks like a safety control but
 * cannot fire is worse than no guard, because it earns trust it has not paid
 * for. Three concrete defects were fixed when it became a real switch:
 *
 * 1. **It only covered one of two money paths.** `POST /payments/create-subscription`
 *    was guarded; `POST /payments/update-plan` was not — and update-plan cancels
 *    the existing subscription and creates a new one at the new tier, which takes
 *    money. A switch with a hole in it is the BL-29 shape all over again.
 *
 * 2. **The client half could not be flipped.** `VITE_BETA_MODE` is read through
 *    `import.meta.env`, which Vite replaces at **build** time. It therefore only
 *    changes when the frontend is rebuilt, and a cached or un-rebuilt bundle
 *    silently keeps the old value — so the page could advertise checkout that the
 *    server was refusing. The server is now the authority: its state travels to
 *    the browser on the public pricing response, at runtime. `VITE_BETA_MODE` is
 *    kept as a build-time default (useful locally), but it can only ever turn the
 *    gate *on*, never off.
 *
 * 3. **Nothing said whether it was active.** You had to read env vars on a host to
 *    find out. It is now reported by `GET /api/v1/health` and logged every time it
 *    refuses a request, so "is checkout off right now?" is answerable rather than
 *    assumed. That is the actual lesson of BL-29.
 *
 * ## What it deliberately does NOT block
 *
 * A kill-switch that strands in-flight money is worse than the problem it solves.
 * These stay open while it is active:
 *
 * - **`POST /payments/verify`** — a customer mid-checkout must still be able to
 *   have their payment verified, or they are charged with nothing to show for it.
 * - **Provider webhooks** — they must keep being processed, or subscription state
 *   drifts away from the provider's and reconciliation has to repair it later.
 * - **`POST /payments/cancel`** — a customer must always be able to stop paying.
 * - **Reads** (`/subscription`, `/history`, `/plans`) — turning off billing is not
 *   a reason to hide someone's own records.
 *
 * In short: it stops money coming *in*, and never traps money already moving.
 *
 * ## Operating it
 *
 * Set `BETA_MODE=true` on the environment and redeploy. Confirm it took effect:
 *
 *     curl -s https://app.buildographic.com/api/v1/health
 *     → { ..., "checkoutDisabled": true }
 *
 * Do not confirm by reading the variable — that is what BL-29 did. Confirm by
 * asking the running service.
 */

/** The error code returned to clients when the switch refuses a request. */
export const CHECKOUT_DISABLED_CODE = 'BETA_MODE_ACTIVE';

/** What a refused caller is told. Deliberately not "we are in beta" — the switch
 *  outlives the beta it was named for, and the honest message is operational. */
export const CHECKOUT_DISABLED_MESSAGE =
  'New subscriptions are temporarily unavailable. Existing subscriptions are unaffected.';

/**
 * Is the checkout kill-switch engaged right now?
 *
 * Read from `process.env` on every call rather than captured at module load, so
 * the value cannot go stale within a process and so tests can toggle it without
 * module-cache gymnastics.
 *
 * Strictly `'true'`. Any other value — unset, empty, `'1'`, `'TRUE'`, `'yes'` —
 * leaves checkout open. A kill-switch must fail *open* on a typo: a mistyped
 * variable that silently stopped all revenue would be a worse outage than the one
 * it was reached for.
 */
export function isCheckoutDisabled(): boolean {
  return process.env.BETA_MODE === 'true';
}
