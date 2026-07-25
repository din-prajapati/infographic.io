output "zone_id" {
  description = "Cloudflare zone ID for this domain."
  value       = cloudflare_zone.this.id
}

output "nameservers" {
  description = "Set these two nameservers at the domain's registrar to activate Cloudflare."
  value       = cloudflare_zone.this.name_servers
}

output "webhook_waf_skip_rule_id" {
  description = "Ruleset ID of the webhook WAF exemption, if enabled."
  value       = var.enable_webhook_waf_skip ? cloudflare_ruleset.webhook_waf_skip[0].id : null
}
