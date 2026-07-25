# --- Redirect Rule: www -> apex, 301, path + query preserved ---
resource "cloudflare_ruleset" "www_redirect" {
  count       = var.enable_www_redirect ? 1 : 0
  zone_id     = cloudflare_zone.this.id
  name        = "www to apex"
  description = "301 redirect www.${var.domain_name} to the apex, preserving path and query string"
  kind        = "zone"
  phase       = "http_request_dynamic_redirect"

  rules {
    ref         = "www_to_apex"
    description = "www to apex"
    expression  = "(http.host eq \"www.${var.domain_name}\")"
    action      = "redirect"

    action_parameters {
      from_value {
        status_code = 301
        target_url {
          expression = "concat(\"https://${var.domain_name}\", http.request.uri)"
        }
        preserve_query_string = false # http.request.uri already includes the query string
      }
    }
  }
}

# --- WAF Custom Rule: skip all security checks for webhook delivery paths ---
#
# Cloudflare's bot/challenge mechanisms are built for browsers, not signed server-to-server
# POSTs. Without this, Bot Fight Mode / Managed Rules / Browser Integrity Check can serve a
# challenge page instead of your actual response, silently breaking webhook signature
# verification and retries (e.g. a Razorpay subscription staying stuck PENDING even though
# the webhook fired).
resource "cloudflare_ruleset" "webhook_waf_skip" {
  count       = var.enable_webhook_waf_skip ? 1 : 0
  zone_id     = cloudflare_zone.this.id
  name        = "Webhook security exemptions"
  description = "Skip Cloudflare security checks for webhook delivery paths"
  kind        = "zone"
  phase       = "http_request_firewall_custom"

  rules {
    ref         = "skip_webhook_security"
    description = "Skip security checks for payment webhooks"
    expression  = "(http.request.uri.path contains \"${var.webhook_path_contains}\")"
    action      = "skip"
    enabled     = true

    action_parameters {
      ruleset  = "current" # skip all remaining custom rules too
      products = ["bic", "ratelimit", "securityLevel", "uablock", "waf", "superBotFightMode"]
    }

    logging {
      enabled = true
    }
  }
}
