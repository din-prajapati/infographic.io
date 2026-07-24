# Apex domain -> app host (proxied so it gets Cloudflare TLS + edge features)
resource "cloudflare_record" "apex" {
  zone_id = cloudflare_zone.this.id
  name    = "@"
  type    = "CNAME"
  value   = var.apex_target
  proxied = true
  ttl     = 1 # must be 1 ("Auto") when proxied
}

# App subdomain -> app host
resource "cloudflare_record" "app" {
  zone_id = cloudflare_zone.this.id
  name    = var.app_subdomain
  type    = "CNAME"
  value   = var.app_target
  proxied = true
  ttl     = 1
}

# www -> apex. Proxied so Cloudflare terminates TLS for it (this is what actually fixes
# "www over https just hangs" — see the Redirect Rule in rules.tf for the 301 itself).
resource "cloudflare_record" "www" {
  count   = var.enable_www_redirect ? 1 : 0
  zone_id = cloudflare_zone.this.id
  name    = "www"
  type    = "CNAME"
  value   = var.domain_name
  proxied = true
  ttl     = 1
}

# --- Transactional email (Resend/SES pattern) ---

resource "cloudflare_record" "email_mx" {
  count    = var.enable_email_records ? 1 : 0
  zone_id  = cloudflare_zone.this.id
  name     = var.email_sending_subdomain
  type     = "MX"
  value    = var.email_mx_target
  priority = var.email_mx_priority
  proxied  = false
  ttl      = 1
}

resource "cloudflare_record" "email_spf" {
  count   = var.enable_email_records ? 1 : 0
  zone_id = cloudflare_zone.this.id
  name    = var.email_sending_subdomain
  type    = "TXT"
  value   = var.email_spf_value
  proxied = false
  ttl     = 1
}

resource "cloudflare_record" "email_dkim" {
  count   = var.enable_email_records ? 1 : 0
  zone_id = cloudflare_zone.this.id
  name    = "${var.email_dkim_selector}._domainkey"
  type    = "TXT"
  value   = var.email_dkim_value
  proxied = false
  ttl     = 1
}

resource "cloudflare_record" "email_dmarc" {
  count   = var.enable_email_records ? 1 : 0
  zone_id = cloudflare_zone.this.id
  name    = "_dmarc"
  type    = "TXT"
  value   = var.email_dmarc_value
  proxied = false
  ttl     = 1
}
