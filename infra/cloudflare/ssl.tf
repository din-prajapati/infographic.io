resource "cloudflare_zone_settings_override" "this" {
  zone_id = cloudflare_zone.this.id

  settings {
    ssl                      = var.ssl_mode
    always_use_https         = var.always_use_https ? "on" : "off"
    automatic_https_rewrites = "on"
    min_tls_version          = "1.2"
  }
}

# DNSSEC. Presence of this resource enables DNSSEC on the zone; destroying it disables.
# Do NOT apply with enable_dnssec = true until the DS record it produces is also set at
# the registrar — otherwise the domain stops resolving.
resource "cloudflare_zone_dnssec" "this" {
  count   = var.enable_dnssec ? 1 : 0
  zone_id = cloudflare_zone.this.id
}
