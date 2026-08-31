# Cloudflare R2 — Setup Runbook

> **Purpose:** provision the object storage EPIC-INFRA-02 needs, from a fresh Cloudflare account
> to verified environment variables on both Railway environments.
>
> **Tracked as:** [`HUMAN_TASKS`](../agile/HUMAN_TASKS.md) #5 — a **prerequisite**, not a
> follow-up. `US-INFRA-001` cannot start until this is done; no AI agent can self-provision
> third-party cloud credentials.
>
> **Time:** ~20 minutes. **Reversible:** everything except the bucket location hint (§2).
>
> **Contract:** [`ENVIRONMENTS.md` §5a](./ENVIRONMENTS.md) ·
> [`EPIC-INFRA-02/ENV.yaml`](../agile/epics/phase-1-ai-core/EPIC-INFRA-02/ENV.yaml)

---

## What you are creating

| # | Object | Value |
|:-:|---|---|
| 1 | Bucket | `buildographic-assets` (production) |
| 2 | Bucket | `buildographic-assets-staging` |
| 3 | API token | scoped to bucket 1 **only** |
| 4 | API token | scoped to bucket 2 **only** |
| 5 | Custom domain | `assets.buildographic.com` → bucket 1 |

Plus one toggle (`r2.dev` on bucket 2) and one account action (enable R2).

**Zero DNS records by hand.** `buildographic.com` is already on Cloudflare nameservers
(`eugene.ns.cloudflare.com` / `zainab.ns.cloudflare.com`, verified 2026-08-30), so §4 creates
its own record.

### Why two of everything

R2 has **no test/live mode**. RazorPay separates environments at the provider — a test plan ID
is invisible to live, and the app refuses to boot on a live key outside production. R2 gives you
none of that: one bucket can serve every environment, the credentials are structurally
identical, and `R2_ACCOUNT_ID` is *the same value* in both.

So nothing about a production token makes it fail when used from staging. The failure that
guards against is not a crash — it is staging quietly writing into the bucket serving real
customers' assets, noticed only when something is overwritten.

Two things prevent it, and you need both:

1. **Per-bucket token scoping** (§5) — a staging token that physically cannot reach production.
2. **The boot guard** (`US-INFRA-001` AC6) — refuses to start a non-production environment whose
   `R2_BUCKET_NAME` has no `staging` marker.

---

## Before you start

- [ ] A **payment method** on the Cloudflare account. R2 requires one even inside the free
      allowance, and you cannot create a bucket without it.
- [ ] Somewhere to paste secrets as you go — §6 has a worksheet. **Each token secret is shown
      exactly once**, at creation, and can never be retrieved again.

---

## 1. Enable R2

1. Cloudflare dashboard → **R2** in the left sidebar
2. Follow the enable/subscribe prompt and add a payment method if asked

**Record now, while you are on this screen:** the **Account ID** shown under *Account details*
on the R2 overview page.

```
R2_ACCOUNT_ID = d84f6c3d301dbd8fb220248c5784a6e7
```

This is **shared by every environment** — the same value locally, on staging, and on production.
Precisely because it is shared, it provides no isolation on its own. That is what §5's scoping
is for.

---

## 2. Create the two buckets

**R2 → Create bucket**, twice:

| Bucket name | Location hint |
|---|---|
| `buildographic-assets` | **APAC** |
| `buildographic-assets-staging` | **APAC** |

> ⚠️ **The location hint cannot be changed after creation.** Changing your mind means creating a
> new bucket and copying every object across. Pick **APAC** — the customers are in India.

> ⚠️ **The staging bucket name must contain the literal substring `staging`.** `US-INFRA-001`
> AC6's boot guard matches on it. Rename it to something creative and staging will refuse to
> boot — or worse, if you also drop the guard, it will silently accept the production bucket.

Leave everything else at defaults. No versioning, no lifecycle rules, no data catalog — none of
it is needed, and each is a thing to reason about later.

---

## 3. Staging public access — `r2.dev`

**R2 → `buildographic-assets-staging` → Settings → Bucket Access → Allow Access → under
"R2.dev subdomain" → Allow Access.**

Cloudflare will ask you to type the bucket name to confirm — this makes the bucket's objects
publicly readable to anyone with the URL.

**Record the `r2.dev` URL it gives you:**

```
R2_PUBLIC_URL (staging) = https://pub-c4533d683e4e45c68ab89280d537e997.r2.dev
```

> **Decided 2026-08-30: staging gets no custom domain.** `r2.dev` is rate-limited and Cloudflare
> explicitly scopes it to non-production use — which is exactly why it suits staging. It also
> saves a second DNS record and certificate for an environment nobody outside the team ever
> loads. Note that WAF rules, caching controls and bot management are **custom-domain only**, so
> staging does not get them; that is acceptable for staging and not acceptable for production,
> which is the next step.

---

## 4. Production public access — custom domain

**R2 → `buildographic-assets` → Settings → Domain Access → Connect Domain.**

1. Enter `assets.buildographic.com` → **Continue**
2. Cloudflare shows the DNS record it will add — review it → **Connect Domain**

Because the zone is already on this account, the record is created for you — a `CNAME` from
`assets` to the bucket. Certificate issuance usually takes a minute or two; the domain shows
**Active / Enabled** when it is ready.

```
R2_PUBLIC_URL (production) = https://assets.buildographic.com
```

> ⚠️ **Leave "Public Development URL" DISABLED on this bucket.** The custom domain already
> exposes it. Enabling `r2.dev` as well would add a *second* public entrance to the same objects
> — and WAF rules, cache rules, bot management and access controls are **custom-domain-only
> features**, so that second hostname is an unprotected route around every protection you
> configure on the first one. It is also rate-limited, and once such a URL escapes into stored
> content or a shared link it is awkward to retire without breaking those links.
>
> **One public route per bucket** is what makes `R2_PUBLIC_URL` meaningful — one bucket, one
> hostname, no ambiguity about which URL an asset "really" has:
>
> | Bucket | Custom domain | Public Development URL |
> |---|---|---|
> | `buildographic-assets` | ✅ `assets.buildographic.com` | ❌ disabled |
> | `buildographic-assets-staging` | ❌ none | ✅ enabled (§3) |
>
> The one legitimate reason to turn it on temporarily is comparing cached-through-CDN against
> straight-from-bucket while debugging a caching problem. Turn it off again afterwards.

> **No trailing slash**, here or in any env var. `StorageService.getPublicUrl()` joins with `/`,
> so a trailing slash produces `//` in every asset URL — which mostly works, looks broken, and
> will eventually break something that normalises paths.

---

## 5. Create the two scoped API tokens

**R2 overview → Account details → Manage R2 API tokens.** Do this twice.

### 5a. Account token, not User token

The page offers two buttons. **Use "Create Account API token"** — the top one — both times.

| | Account API token ✅ | User API token ❌ |
|---|---|---|
| Tied to | the account | **your personal login** |
| If you leave / lose the account | keeps working | **stops working** |
| Cloudflare's own label | "ideal for production systems (recommended)" | "ideal for personal access or development work" |

A User token would make production's ability to write assets depend on one human's account
surviving. When it broke there would be no code change and no obvious cause.

### 5b. Type and scope are different choices

Easy to conflate, so to be explicit — you are making **two** independent selections:

| Axis | Where | Choose |
|---|---|---|
| **Type** | the two buttons on the tokens page | **Account** |
| **Scope** | inside the creation form | **one specific bucket** |

"Account API token" refers to *ownership*, not reach. An Account token scoped to a single bucket
is exactly right; the account/user distinction has nothing to do with how many buckets it can
touch.

### 5c. The two tokens

| | Token 1 | Token 2 |
|---|---|---|
| Type | **Account API token** | **Account API token** |
| Name | `buildographic-prod` | `buildographic-staging` |
| Permission | **Object Read & Write** | **Object Read & Write** |
| Scope | **Apply to specific buckets** → `buildographic-assets` | **Apply to specific buckets** → `buildographic-assets-staging` |

> ⚠️ **The scope is the entire point.** A token left at the default *all buckets* scope works
> fine from staging against the production bucket, and nothing will tell you it happened. This
> is about the **scope** selector, not the Account/User choice above — an Account token is
> correct, an *unscoped* token is not.

> **Permission, not more:** Object Read & Write is sufficient. `StorageService` only implements
> `upload()` and `getPublicUrl()` — no delete, no list (explicitly out of scope in
> `US-INFRA-001`). An Admin-level token would grant bucket deletion to application code that has
> no reason to ever do that.

After each **Create API Token**, Cloudflare shows the **Access Key ID** and **Secret Access
Key**. Copy both **now** — the secret is never shown again. Losing it means deleting the token
and creating a replacement.

---

## 6. Values worksheet

Nine distinct values. Fill this in as you go, then delete it — do not commit it anywhere.

> ⚠️ **This repository is PUBLIC.** Do not paste real values into this file, or into any other
> committed document — including `R2_ACCOUNT_ID` and the `r2.dev` hostname, which are not
> credentials but still do not belong on the open internet. Keep them in your local `.env` and
> `secrets/*.env`, both gitignored. Only the token secrets require rotation if exposed; the
> others are simply nobody else's business.

```
SHARED
  R2_ACCOUNT_ID              = ____________________

PRODUCTION  (token: buildographic-prod)
  R2_ACCESS_KEY_ID           = ____________________
  R2_SECRET_ACCESS_KEY       = ____________________
  R2_BUCKET_NAME             = buildographic-assets
  R2_PUBLIC_URL              = https://assets.buildographic.com

STAGING  (token: buildographic-staging)
  R2_ACCESS_KEY_ID           = ____________________
  R2_SECRET_ACCESS_KEY       = ____________________
  R2_BUCKET_NAME             = buildographic-assets-staging
  R2_PUBLIC_URL              = https://____________.r2.dev
```

---

## 7. Set the variables

Per [`ENV_SINGLE_SOURCE_OF_TRUTH.md`](./ENV_SINGLE_SOURCE_OF_TRUTH.md): edit a master file and
publish it, never type into the Railway dashboard.

**Local `.env`** — use the **staging** values, all five:

```bash
R2_ACCOUNT_ID=...
R2_ACCESS_KEY_ID=...            # staging token
R2_SECRET_ACCESS_KEY=...        # staging token
R2_BUCKET_NAME=buildographic-assets-staging
R2_PUBLIC_URL=https://....r2.dev
```

> ⚠️ **Never put the production token in a local `.env`.** A developer machine writing into the
> customer-facing bucket is the same failure as staging doing it — and more likely, because
> `.env` files get copied between people and machines.

**Railway**, both environments. Add the five lines to each master file, then publish:

```bash
bash scripts/railway-env-sync.sh secrets/staging.env staging
bash scripts/railway-env-sync.sh secrets/production.env production
```

Railway redeploys automatically on a variable change — no manual redeploy, and
`railway redeploy` will in fact fail while that automatic deploy is still in flight.

---

## 8. Verify — do not skip

Pull the values back rather than trusting the dashboard. This is the step whose omission caused
the incident `ENV_SINGLE_SOURCE_OF_TRUTH.md` was written about.

```bash
railway variables --environment staging    --kv | grep R2_
railway variables --environment production --kv | grep R2_
```

Check, specifically:

- [ ] `R2_ACCOUNT_ID` is **identical** in both
- [ ] `R2_BUCKET_NAME` **differs** — `...-staging` on staging, `buildographic-assets` on production
- [ ] `R2_ACCESS_KEY_ID` **differs** between the two
- [ ] `R2_PUBLIC_URL` points at the hostname belonging to *that environment's* bucket

Then confirm each bucket is actually public — upload any small file through the Cloudflare
dashboard and fetch it:

```bash
curl -I https://assets.buildographic.com/<test-object>          # expect 200
curl -I https://<staging>.r2.dev/<test-object>                  # expect 200
```

Delete the test objects afterwards.

---

## 9. Gotchas, collected

| Thing | Consequence |
|---|---|
| Bucket **location hint** is permanent | Recreate + copy everything to change it |
| Token **secret** shown once | Lose it → delete the token, create a new one |
| Staging bucket name must contain `staging` | Boot guard (AC6) matches that substring |
| `R2_PUBLIC_URL` trailing slash | `//` in every asset URL |
| Account-wide token scope | Staging can silently write to production |
| Production token in local `.env` | Same, from a laptop |
| `r2.dev` has no WAF / caching / bot rules | Fine for staging, not for production |

---

## 10. Nothing here is urgent

`US-INFRA-001` has not started, and **nothing is broken while R2 is unprovisioned**. AC6's guard
is written so an absent `R2_BUCKET_NAME` boots normally — R2 being missing is the expected state
until this runbook is followed.

Provision when you are ready to start the story, not before.
