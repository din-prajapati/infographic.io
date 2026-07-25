terraform {
  required_version = ">= 1.5.0"

  required_providers {
    cloudflare = {
      source  = "cloudflare/cloudflare"
      version = "~> 4.0"
    }
  }
}

# CLOUDFLARE_API_TOKEN env var is picked up automatically by the provider.
# Only set api_token here if you deliberately want it sourced from a tfvars
# file instead (not recommended — keep tokens out of any .tfvars you commit).
provider "cloudflare" {}
