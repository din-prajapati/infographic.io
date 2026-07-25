variable "cloudflare_account_id" {
  description = "Cloudflare account ID (Dashboard → Account Home → API panel)."
  type        = string
}

variable "domain_name" {
  description = "Apex domain to onboard, e.g. buildographic.com"
  type        = string
}

variable "zone_plan" {
  description = "Cloudflare plan for the zone."
  type        = string
  default     = "free"
}

variable "apex_target" {
  description = "CNAME target for the apex domain, e.g. your Railway/Vercel/Fly hostname."
  type        = string
}

variable "app_subdomain" {
  description = "Subdomain label for the main app, e.g. \"app\" for app.<domain>."
  type        = string
  default     = "app"
}

variable "app_target" {
  description = "CNAME target for the app subdomain."
  type        = string
}

# --- www handling ---

variable "enable_www_redirect" {
  description = "Create www.<domain> (proxied CNAME to apex) and a 301 redirect rule to the apex."
  type        = bool
  default     = true
}

# --- outbound email (Resend/SES-style transactional sending) ---

variable "enable_email_records" {
  description = "Create SPF/DKIM/DMARC/MX records for transactional email sending."
  type        = bool
  default     = true
}

variable "email_sending_subdomain" {
  description = "Subdomain used as the Resend/SES sending domain, e.g. \"send\" for send.<domain>."
  type        = string
  default     = "send"
}

variable "email_spf_value" {
  description = "SPF TXT record value, e.g. \"v=spf1 include:amazonses.com ~all\"."
  type        = string
  default     = "v=spf1 include:amazonses.com ~all"
}

variable "email_dkim_selector" {
  description = "DKIM selector label, e.g. \"resend\" for resend._domainkey.<domain>."
  type        = string
  default     = "resend"
}

variable "email_dkim_value" {
  description = "DKIM TXT record value (public key). Pull this from the Resend dashboard for THIS domain — do not reuse another domain's key."
  type        = string
}

variable "email_dmarc_value" {
  description = "DMARC TXT record value."
  type        = string
  default     = "v=DMARC1; p=none;"
}

variable "email_mx_target" {
  description = "MX target for the sending subdomain, e.g. \"feedback-smtp.ap-northeast-1.amazonses.com\"."
  type        = string
  default     = "feedback-smtp.ap-northeast-1.amazonses.com"
}

variable "email_mx_priority" {
  description = "MX record priority."
  type        = number
  default     = 10
}

# --- SSL / edge behavior ---

variable "ssl_mode" {
  description = "Zone SSL/TLS mode: off | flexible | full | strict (strict = Full (strict))."
  type        = string
  default     = "strict"
}

variable "always_use_https" {
  description = "Force HTTP -> HTTPS redirects at the Cloudflare edge."
  type        = bool
  default     = true
}

variable "enable_dnssec" {
  description = "Enable DNSSEC on the zone. Only turn on once a matching DS record is set at the registrar — enabling here without it breaks resolution."
  type        = bool
  default     = false
}

variable "enable_bot_fight_mode" {
  description = "Enable Cloudflare Bot Fight Mode. Leave off unless the webhook WAF-skip rule (below) is already in place, or bot challenges can break webhook delivery."
  type        = bool
  default     = false
}

# --- Webhook WAF exemption ---

variable "enable_webhook_waf_skip" {
  description = "Create a WAF custom rule that skips all Cloudflare security checks for webhook paths, so Bot Fight Mode / Managed Rules / Browser Integrity Check never intercept a signed webhook delivery (Razorpay, Stripe, etc)."
  type        = bool
  default     = true
}

variable "webhook_path_contains" {
  description = "URI path substring that identifies webhook requests to exempt, e.g. \"/api/v1/webhooks/\"."
  type        = string
  default     = "/api/v1/webhooks/"
}
