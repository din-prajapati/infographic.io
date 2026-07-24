resource "cloudflare_zone" "this" {
  account_id = var.cloudflare_account_id
  zone       = var.domain_name
  plan       = var.zone_plan
}
