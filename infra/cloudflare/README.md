# Cloudflare domain onboarding (Terraform)

Reproduces, as code, the manual Cloudflare setup done for `buildographic.com` on 2026-07-24:
DNS records, SSL mode, edge redirects, and the WAF exemption for payment webhooks. Use this
as the starting point for any new domain (e.g. the LensDeliver domain) instead of clicking
through the dashboard again.

## What this creates

- The zone itself (add the domain to your Cloudflare account)
- DNS records: apex + app subdomain (proxied, pointed at your app host), `www` (proxied,
  used only as the redirect target's origin), and an optional email-sending record set
  (SPF/DKIM/DMARC/MX — defaults match the Resend/SES pattern used for buildographic.com)
- SSL/TLS mode: **Full (strict)**
- Edge Certificates: **Always Use HTTPS** on
- Redirect Rule: `www.<domain>` → `https://<domain>` (301, path + query preserved)
- WAF Custom Rule: skips all Cloudflare security checks (managed rules, Super Bot Fight
  Mode, rate limiting, Browser Integrity Check, Security Level, User Agent Blocking) for
  any path matching `/api/v1/webhooks/` — prevents Cloudflare from ever challenge-paging a
  Razorpay/Stripe webhook delivery

Not included (Cloudflare Free plan already runs these unconditionally, nothing to declare):
network-layer DDoS mitigation, SSL/TLS DDoS mitigation, HTTP DDoS mitigation. Also not
included: DNSSEC and Bot Fight Mode — both left off by default; see `variables.tf` if a
future domain needs them turned on.

**For a full step-by-step walkthrough** (installing Terraform, creating an API token, every
variable explained, troubleshooting, running multiple domains) see **[HOW_TO_USE.md](HOW_TO_USE.md)**.
The rest of this file is the quick-reference version.

## Prerequisites

1. [Install Terraform](https://developer.hashicorp.com/terraform/install) (this was written
   against the `cloudflare/cloudflare` provider `~> 4.0`).
2. Create a Cloudflare API token (My Profile → API Tokens → Create Token) with at minimum:
   `Zone:Zone:Edit`, `Zone:DNS:Edit`, `Zone:SSL and Certificates:Edit`,
   `Zone:Web Application Firewall:Edit`, `Account:Account Settings:Read`.
3. Have the domain registered (registrar-agnostic — Namecheap, GoDaddy, etc.) but **do not**
   change nameservers yet; that happens after `terraform apply`, once Cloudflare hands you
   the two nameservers to set at the registrar (see `outputs.tf`).

## Usage

```bash
cd infra/cloudflare
cp terraform.tfvars.example terraform.tfvars
# edit terraform.tfvars: domain_name, cloudflare_account_id, origin targets, etc.
export CLOUDFLARE_API_TOKEN="your-token-here"   # never commit this

terraform init
terraform plan
terraform apply
```

After apply, `terraform output nameservers` gives you the two nameservers to set at the
registrar (same manual step as before — Terraform can't do that part, it's on the
registrar's side, not Cloudflare's).

## Reproducing this for a second domain

Copy this directory, or better, keep it as one Terraform workspace and add a second
`.tfvars` file (e.g. `lensdeliver.tfvars`) and run `terraform apply -var-file=lensdeliver.tfvars`
against a distinct state file (`terraform init -backend-config=...` or separate state per
domain) so the two domains don't collide in one state.

## Important: buildographic.com already exists

This config's example `.tfvars` uses buildographic.com's real values so the template is
concrete, but the zone, DNS records, and rules for buildographic.com were already created
manually through the dashboard (2026-07-24) — they are **not** currently tracked by
Terraform. Running `terraform apply` with the example values as-is will try to *create* a
second `cloudflare_zone` for a domain that's already active in the account and fail (or
worse, conflict). Two options:

1. **Use this only for the next domain** (e.g. LensDeliver) with its own `.tfvars` — the
   straightforward path, no import needed.
2. **Bring buildographic.com under Terraform**: run `terraform import` for each resource
   (`cloudflare_zone.this`, each `cloudflare_record.*`, `cloudflare_zone_settings_override.this`,
   `cloudflare_ruleset.www_redirect[0]`, `cloudflare_ruleset.webhook_waf_skip[0]`) against the
   already-existing IDs before the first `apply`, so Terraform adopts the existing objects
   instead of trying to create duplicates.

## Known gap

The email DNS record values (SPF/DKIM/DMARC) in `terraform.tfvars.example` are copied from
buildographic.com's actual Resend/SES setup as of 2026-07-24. A new domain will get its own
DKIM key from Resend — pull the real values from the Resend dashboard for that sending
domain before applying, don't reuse buildographic.com's key.
