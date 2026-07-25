# Bot Fight Mode. Left off by default (see variables.tf) — only turn on for a domain that
# also has the webhook WAF-skip rule above deployed, or legitimate webhook/API traffic can
# get challenged.
resource "cloudflare_bot_management" "this" {
  count      = var.enable_bot_fight_mode ? 1 : 0
  zone_id    = cloudflare_zone.this.id
  fight_mode = true
}
