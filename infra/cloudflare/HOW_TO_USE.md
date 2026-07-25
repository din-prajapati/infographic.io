# How to use this Terraform config

Step-by-step guide for onboarding a domain onto Cloudflare using this config — what to
install, what to edit, what to run, and how to check it worked. Written for someone who
has never run this config before.

---

## 1. What this actually does

Running this against a domain reproduces the manual Cloudflare setup done for
`buildographic.com` on 2026-07-24:

- Adds the domain as a Cloudflare zone
- Creates DNS records: apex → your app, `app.<domain>` → your app, `www.<domain>` (redirect
  target), plus SPF/DKIM/DMARC/MX for transactional email
- Sets SSL/TLS to Full (strict) and turns on Always Use HTTPS
- Creates a redirect rule: `www.<domain>` → `https://<domain>` (301, path+query preserved)
- Creates a WAF rule that exempts webhook paths (`/api/v1/webhooks/...`) from Cloudflare's
  bot/security checks, so payment webhooks never get a challenge page instead of your API
  response

It does **not** touch your registrar's nameserver setting automatically — that one step
stays manual (see Step 7 below), because Terraform only controls Cloudflare, not your
registrar account.

---

## 2. Prerequisites

### 2.1 Install Terraform

Pick one, based on what you have:

**Windows (PowerShell), using winget:**
```powershell
winget install HashiCorp.Terraform
```

**Windows, using Chocolatey:**
```powershell
choco install terraform
```

**macOS, using Homebrew:**
```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
```

**Manual (any OS):** download from
[developer.hashicorp.com/terraform/install](https://developer.hashicorp.com/terraform/install),
unzip, put the `terraform` binary somewhere on your `PATH`.

Verify it's installed:
```bash
terraform -version
```
You need `>= 1.5.0` (required by `versions.tf`).

### 2.2 Create a Cloudflare API token

This config authenticates with a scoped API token, not your Cloudflare login/password.

1. Go to Cloudflare Dashboard → click your profile icon (top right) → **My Profile** → **API Tokens**
2. Click **Create Token** → **Create Custom Token** (skip the templates)
3. Give it a name, e.g. `terraform-domain-onboarding`
4. Add these permissions (all scoped to **Zone**, except the last one):
   - `Zone` → `Zone` → `Edit`
   - `Zone` → `DNS` → `Edit`
   - `Zone` → `SSL and Certificates` → `Edit`
   - `Zone` → `Web Application Firewall` → `Edit`
   - `Zone` → `Zone Settings` → `Edit`
   - `Account` → `Account Settings` → `Read`
5. Under **Zone Resources**, choose **All zones from an account** (so it can create *new*
   zones too, not just edit existing ones) — or scope it to a specific zone once it exists,
   if you're only ever going to manage one domain and prefer a narrower token.
6. Create it, copy the token immediately (Cloudflare only shows it once).

### 2.3 Get your Cloudflare Account ID

Dashboard → any domain → right sidebar → **API** section → **Account ID**. You already have
this for buildographic.com (`d84f6c3d301dbd8fb220248c5784a6e7`) — it's the same for every
domain in the same Cloudflare account, so you only need to look this up once per account,
not once per domain.

### 2.4 Have the domain ready, but don't touch nameservers yet

Buy/own the domain at any registrar (Namecheap, GoDaddy, etc.). Leave its nameservers as
the registrar's default for now — you'll change them in Step 7, after Terraform gives you
the specific Cloudflare nameservers to point at.

---

## 3. Step-by-step: onboarding a new domain

Run everything from `infra/cloudflare/`.

### Step 1 — Set your API token as an environment variable

Never put the token in a `.tfvars` file. Set it as an env var for the session instead.

**PowerShell:**
```powershell
$env:CLOUDFLARE_API_TOKEN = "paste-your-token-here"
```

**Bash:**
```bash
export CLOUDFLARE_API_TOKEN="paste-your-token-here"
```

This only lasts for the current terminal session — you'll need to re-set it if you open a
new terminal window later.

### Step 2 — Create your variables file

```bash
cd infra/cloudflare
cp terraform.tfvars.example lensdeliver.tfvars    # name it after the domain/project
```

(Substitute whatever name makes sense — `lensdeliver.tfvars`, `mynextsite.tfvars`, etc. Using
a per-domain filename, instead of always `terraform.tfvars`, is what makes it easy to run
this config against more than one domain later — see Section 5.)

### Step 3 — Edit the variables file for your new domain

Open the file you just created and change these (see Section 4 for the full reference):

```hcl
cloudflare_account_id = "d84f6c3d301dbd8fb220248c5784a6e7"   # same account = same value, reuse it
domain_name            = "yournewdomain.com"                  # CHANGE THIS

apex_target = "xxxxxxxx.up.railway.app"   # CHANGE — Railway hostname for this project's apex service
app_target  = "yyyyyyyy.up.railway.app"   # CHANGE — Railway hostname for this project's app service

email_dkim_value = "p=..."   # CHANGE — pull the real key from Resend for THIS domain, don't reuse buildographic.com's
```

If the new project doesn't send transactional email the same way (different provider, or
no email at all), set `enable_email_records = false` instead of editing the email fields.

### Step 4 — Initialize Terraform

```bash
terraform init
```

This downloads the Cloudflare provider plugin into a local `.terraform/` folder (gitignored,
safe to delete and re-run `init` any time).

### Step 5 — Preview the plan

```bash
terraform plan -var-file=lensdeliver.tfvars
```

Read through the output. It lists every resource Terraform is about to create — zone, DNS
records, SSL settings, rules. Nothing is created yet at this step; `plan` is read-only.

### Step 6 — Apply

```bash
terraform apply -var-file=lensdeliver.tfvars
```

Terraform shows the same plan again and asks you to type `yes` to confirm. Type `yes` and
it creates everything in Cloudflare.

### Step 7 — Point the registrar at Cloudflare

```bash
terraform output nameservers
```

This prints two nameservers, e.g.:
```
[
  "eugene.ns.cloudflare.com",
  "zainab.ns.cloudflare.com",
]
```

Go to your registrar (Namecheap, GoDaddy, etc.) → domain settings → change nameservers from
the registrar's default to these two Cloudflare ones. This is the one step Terraform can't
do for you — it's an action on your registrar account, not Cloudflare's.

### Step 8 — Wait and verify

Propagation is usually minutes, sometimes up to 24 hours. Check it's done:

```bash
# any OS with nslookup:
nslookup -type=NS yournewdomain.com 8.8.8.8

# PowerShell:
Resolve-DnsName -Name yournewdomain.com -Type NS -Server 8.8.8.8
```

Once that returns the Cloudflare nameservers, verify the site itself:

```bash
curl -sS -o /dev/null -w "apex: %{http_code}\n" https://yournewdomain.com/
curl -sS -o /dev/null -w "app: %{http_code}\n" https://app.yournewdomain.com/
curl -sS -D - -o /dev/null https://www.yournewdomain.com/   # should show 301 -> apex
```

---

## 4. Variable reference — what to change per domain

| Variable | Change per domain? | Default | Notes |
|---|---|---|---|
| `cloudflare_account_id` | No (same account = same value) | — required | Find once in Dashboard → API panel |
| `domain_name` | **Yes** | — required | The apex domain, no `www.`, no `https://` |
| `zone_plan` | No | `"free"` | Only change if the new domain needs a paid plan |
| `apex_target` | **Yes** | — required | Your app host's CNAME target for the apex, e.g. Railway/Vercel/Fly hostname |
| `app_subdomain` | Rarely | `"app"` | Change only if you don't want `app.<domain>` as the subdomain label |
| `app_target` | **Yes** | — required | CNAME target for the app subdomain |
| `enable_www_redirect` | Rarely | `true` | Set `false` if you don't want `www` handled at all |
| `enable_email_records` | Sometimes | `true` | Set `false` if this project doesn't send transactional email, or uses a different provider than Resend/SES |
| `email_sending_subdomain` | Rarely | `"send"` | Change only if your email provider uses a different subdomain convention |
| `email_spf_value` | Rarely | Amazon SES SPF | Change if using a different email provider |
| `email_dkim_selector` | Rarely | `"resend"` | Change if using a different email provider |
| `email_dkim_value` | **Yes, always** | — required | **Must** be the new domain's own DKIM key from Resend — never reuse another domain's |
| `email_dmarc_value` | Rarely | `"v=DMARC1; p=none;"` | Tighten to `p=quarantine` or `p=reject` once you trust deliverability |
| `email_mx_target` | Rarely | Amazon SES ap-northeast-1 | Change if using a different email provider/region |
| `email_mx_priority` | No | `10` | |
| `ssl_mode` | No | `"strict"` | Only lower if your origin can't serve a trusted cert (shouldn't happen on Railway/Vercel/Fly) |
| `always_use_https` | No | `true` | |
| `enable_dnssec` | No | `false` | Only flip to `true` after setting a matching DS record at the registrar — see the warning in `ssl.tf` |
| `enable_bot_fight_mode` | No | `false` | Only flip to `true` if `enable_webhook_waf_skip` is also `true` |
| `enable_webhook_waf_skip` | No | `true` | Keep on if this project has any webhook endpoints (payments, etc.) |
| `webhook_path_contains` | Sometimes | `"/api/v1/webhooks/"` | Change if this project's webhook routes live under a different path |

**Bold "Yes" rows are the ones you must change for every new domain.** Everything else can
usually stay at its default unless the new project's stack differs from buildographic.com's.

---

## 5. Running this for more than one domain

Each domain needs its **own Terraform state** — otherwise Terraform thinks the second
domain's resources belong to the first domain's zone and things break.

Simplest approach (local state, one folder, multiple state files):

```bash
# Domain 1
terraform apply -var-file=buildographic.tfvars -state=buildographic.tfstate

# Domain 2
terraform apply -var-file=lensdeliver.tfvars -state=lensdeliver.tfstate
```

Always pass the matching `-state=` file with every `plan`/`apply`/`destroy` for that domain,
or Terraform falls back to the default `terraform.tfstate` and mixes them up.

A cleaner long-term approach once you have 3+ domains: use a remote backend (Terraform
Cloud, or an S3/R2 bucket) with one **workspace per domain**
(`terraform workspace new lensdeliver`). Not set up here to keep this template simple —
revisit if the number of domains grows.

---

## 6. Common operations after the first apply

**Change a value (e.g. rotate the DKIM key):**
```bash
# edit the value in your .tfvars file, then:
terraform plan -var-file=lensdeliver.tfvars -state=lensdeliver.tfstate
terraform apply -var-file=lensdeliver.tfvars -state=lensdeliver.tfstate
```

**Add a new webhook path to exempt from WAF:** edit `webhook_path_contains` in your
`.tfvars`, or for multiple distinct paths, edit the `expression` in `rules.tf`'s
`webhook_waf_skip` rule directly (e.g. change `contains` to a regex matching several paths).

**See what's currently deployed:**
```bash
terraform show -state=lensdeliver.tfstate
```

**Tear down a domain's Cloudflare config entirely (rare, be careful):**
```bash
terraform destroy -var-file=lensdeliver.tfvars -state=lensdeliver.tfstate
```
This deletes the zone from Cloudflare. Only do this if you're fully decommissioning the
domain from Cloudflare — it does not un-register the domain itself or touch the registrar.

---

## 7. Bringing the existing buildographic.com under this Terraform config (optional)

buildographic.com's zone, DNS records, and rules already exist from the manual setup on
2026-07-24 — Terraform doesn't know about them yet. If you want Terraform to manage
buildographic.com going forward too (instead of only new domains), you need to `import`
each existing resource so Terraform adopts it instead of trying to create a duplicate:

```bash
terraform import -var-file=buildographic.tfvars -state=buildographic.tfstate \
  cloudflare_zone.this <zone_id>

terraform import -var-file=buildographic.tfvars -state=buildographic.tfstate \
  cloudflare_record.apex <zone_id>/<dns_record_id>

# ...repeat for cloudflare_record.app, cloudflare_record.www[0],
# cloudflare_record.email_mx[0], cloudflare_record.email_spf[0],
# cloudflare_record.email_dkim[0], cloudflare_record.email_dmarc[0],
# cloudflare_zone_settings_override.this,
# cloudflare_ruleset.www_redirect[0], cloudflare_ruleset.webhook_waf_skip[0]
```

Find each resource's ID in the Cloudflare dashboard (DNS record IDs and ruleset IDs are in
the URL when you open that specific record/rule for editing) or via the Cloudflare API
(`GET /zones/{zone_id}/dns_records`). After every resource is imported, run
`terraform plan -var-file=buildographic.tfvars -state=buildographic.tfstate` — it should
show **no changes** if everything was imported correctly and the `.tfvars` values match
what's actually live. If plan shows a diff, fix the `.tfvars` value to match reality (don't
let Terraform "fix" a live production domain by guessing).

This is optional and only worth doing if you want a single source of truth going forward.
Leaving buildographic.com as manually-managed and using this config only for future domains
is a completely reasonable choice too.

---

## 8. Troubleshooting

| Symptom | Likely cause | Fix |
|---|---|---|
| `Error: 1003: Account is not authorized to manage this zone` | API token missing `Account Settings: Read` or wrong account ID | Recheck token scopes and `cloudflare_account_id` |
| `Error: zone already exists` on `apply` | Domain already onboarded to Cloudflare (manually or by a prior apply) | Either use a different domain, or `import` it (Section 7) |
| `Error: 9109: Invalid access token` | Env var not set in this terminal session, or token expired/revoked | Re-run the `export`/`$env:` command from Step 1, or issue a new token |
| `terraform plan` shows changes every time even though nothing changed | A `.tfvars` value doesn't match what's actually live in Cloudflare (drift) | Check the dashboard for that field, correct the `.tfvars` |
| Site unreachable after `apply` but before nameserver switch | Expected — Cloudflare only takes over once the registrar's nameservers point at it | Complete Step 7 |
| `www` still hangs over HTTPS after apply | `enable_www_redirect` was `false`, or the redirect rule didn't deploy | Check `terraform state list` includes `cloudflare_ruleset.www_redirect[0]` |

---

## 9. Security notes

- Never commit any `*.tfvars` file with a real DKIM key or account ID if the repo is public
  — this repo's `.gitignore` already excludes `terraform.tfvars` and `*.auto.tfvars`, but a
  custom-named file like `lensdeliver.tfvars` matches the `*.tfvars` pattern too, so it's
  covered — double check with `git status` before committing infra changes.
- Rotate the API token (Cloudflare Dashboard → API Tokens → Roll) if it's ever pasted
  somewhere it shouldn't be (chat, ticket, screenshot).
- State files (`*.tfstate`) contain resource IDs and some config values in plain text —
  also gitignored here. If you move to a shared/remote backend later, make sure it's
  access-controlled, not a public bucket.
