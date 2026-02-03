# Secrets Management Best Practices Guide

**Last Updated:** January 2025  
**Status:** Post-MVP Implementation  
**Priority:** 🟡 HIGH - Critical for production security

---

## 📋 Overview

This document outlines the comprehensive secrets management strategy for multi-platform development (Replit, Cursor, Production) and enterprise-grade cloud secrets management solutions.

---

## 🎯 Multi-Platform Secret Management Strategy

### Tiered Approach

```
┌─────────────────────────────────────────────┐
│  Tier 1: Cloud Secrets Manager             │
│  (AWS Secrets Manager / Azure Key Vault)   │
│  - Production secrets                      │
│  - Shared team secrets                     │
│  - Automatic rotation                      │
└─────────────────────────────────────────────┘
           ↓ (fallback)
┌─────────────────────────────────────────────┐
│  Tier 2: Platform-Native Secrets            │
│  (Replit Secrets, Vercel Env)              │
│  - Development environment                 │
│  - Platform-specific config                │
└─────────────────────────────────────────────┘
           ↓ (fallback)
┌─────────────────────────────────────────────┐
│  Tier 3: Local Development                  │
│  (.env file for Cursor)                    │
│  - Local development only                  │
│  - Never committed to git                  │
└─────────────────────────────────────────────┘
```

---

## ☁️ Cloud Secrets Management Services

### Comparison Matrix

| Service | Provider | Cost Model | Best For | Integration |
|---------|----------|------------|----------|-------------|
| **AWS Secrets Manager** | AWS | $0.40/secret/month + $0.05/10K API calls | AWS-hosted apps | Native AWS SDK |
| **Azure Key Vault** | Microsoft | $0.03/secret/month + API calls | Azure-hosted apps | Azure SDK |
| **Google Secret Manager** | Google Cloud | $0.06/secret/month + API calls | GCP-hosted apps | GCP SDK |
| **HashiCorp Vault** | Self-hosted/Cloud | Free (self-hosted) or $0.10/secret/month | Multi-cloud, enterprise | Universal API |
| **1Password Secrets Automation** | 1Password | $7/user/month | Teams, CI/CD | REST API |
| **Doppler** | Doppler | Free tier available | Multi-platform, developer-friendly | Universal SDK |

### Cost Comparison (Example: 20 secrets, 100K operations/month)

- **AWS Secrets Manager:** ~$8.50/month
- **Azure Key Vault:** ~$0.66/month ⭐ **Most Cost-Effective**
- **Google Secret Manager:** ~$1.26/month
- **Doppler:** Free tier (3 projects) or $12/user/month

### Recommendation

- **Small Projects:** Doppler (free tier) or platform-native secrets
- **Medium Projects:** Azure Key Vault (lowest cost)
- **Enterprise:** AWS Secrets Manager or HashiCorp Vault

---

## 🏗️ Implementation Architecture

### Current Setup (MVP)

- **Development (Cursor):** `.env` file (local, gitignored) ✅
- **Development (Replit):** Replit Secrets ✅
- **Production:** Platform environment variables (Vercel/Railway)

### Post-MVP Enhancement

- **Production:** Cloud Secrets Manager (AWS/Azure/GCP)
- **Staging:** Cloud Secrets Manager (separate environment)
- **Development:** Fallback to `.env` / Replit Secrets

---

## 🔧 Implementation Strategies

### Option 1: AWS Secrets Manager

**When to Use:** Production deployment on AWS (EC2, ECS, Lambda)

**Setup:**
1. Create AWS account and IAM role
2. Install AWS SDK: `npm install @aws-sdk/client-secrets-manager`
3. Configure IAM permissions
4. Create secrets in AWS Console
5. Implement unified secrets loader

**Implementation:**
```typescript
// api/src/config/secrets-manager.service.ts
import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

@Injectable()
export class SecretsManagerService {
  private client: SecretsManagerClient;
  private cache: Map<string, any> = new Map();

  constructor() {
    this.client = new SecretsManagerClient({
      region: process.env.AWS_REGION || 'us-east-1',
    });
  }

  async getSecret(secretName: string): Promise<any> {
    // Check cache first (5-minute TTL)
    if (this.cache.has(secretName)) {
      return this.cache.get(secretName);
    }

    try {
      const command = new GetSecretValueCommand({ SecretId: secretName });
      const response = await this.client.send(command);
      const secret = JSON.parse(response.SecretString || '{}');
      
      // Cache for 5 minutes
      this.cache.set(secretName, secret);
      setTimeout(() => this.cache.delete(secretName), 5 * 60 * 1000);
      
      return secret;
    } catch (error) {
      console.error(`Failed to fetch secret ${secretName}:`, error);
      // Fallback to environment variables
      return this.getFromEnv(secretName);
    }
  }

  private getFromEnv(secretName: string): any {
    // Fallback to .env file for local development
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      // ... other secrets
    };
  }
}
```

### Option 2: Azure Key Vault

**When to Use:** Production deployment on Azure (App Service, Azure Functions)

**Setup:**
1. Create Azure Key Vault
2. Install Azure SDK: `npm install @azure/keyvault-secrets @azure/identity`
3. Configure Managed Identity or Service Principal
4. Create secrets in Azure Portal
5. Implement unified secrets loader

**Implementation:**
```typescript
// api/src/config/azure-keyvault.service.ts
import { SecretClient } from '@azure/keyvault-secrets';
import { DefaultAzureCredential } from '@azure/identity';

@Injectable()
export class AzureKeyVaultService {
  private client: SecretClient;

  constructor() {
    const vaultUrl = process.env.AZURE_KEY_VAULT_URL;
    if (vaultUrl) {
      const credential = new DefaultAzureCredential();
      this.client = new SecretClient(vaultUrl, credential);
    }
  }

  async getSecret(secretName: string): Promise<string | undefined> {
    if (!this.client) {
      // Fallback to environment variables
      return process.env[secretName];
    }

    try {
      const secret = await this.client.getSecret(secretName);
      return secret.value;
    } catch (error) {
      console.error(`Failed to fetch secret ${secretName}:`, error);
      return process.env[secretName]; // Fallback
    }
  }
}
```

### Option 3: Doppler (Multi-Platform Friendly)

**When to Use:** Multi-platform development, team collaboration

**Setup:**
1. Sign up at https://doppler.com
2. Install CLI: `npm install -g @doppler/cli`
3. Login: `doppler login`
4. Create project and configs
5. Integrate with application

**Implementation:**
```typescript
// api/src/config/doppler.service.ts
import { Doppler } from '@dopplerhq/node-sdk';

@Injectable()
export class DopplerService {
  private doppler: Doppler;

  constructor() {
    this.doppler = new Doppler({
      token: process.env.DOPPLER_TOKEN, // Service token
    });
  }

  async getSecrets(project: string, config: string): Promise<Record<string, string>> {
    try {
      const secrets = await this.doppler.secrets.get({
        project,
        config,
      });
      return secrets.secrets;
    } catch (error) {
      console.error('Failed to fetch from Doppler:', error);
      // Fallback to .env
      return {};
    }
  }
}
```

### Option 4: Unified Secrets Loader

**Recommended:** Create a unified loader that supports multiple sources with fallback

```typescript
// api/src/config/unified-secrets.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class UnifiedSecretsService {
  constructor(private configService: ConfigService) {}

  async loadSecrets(): Promise<Record<string, string>> {
    const source = process.env.SECRETS_SOURCE || 'env'; // env, aws, azure, doppler

    switch (source) {
      case 'aws':
        return await this.loadFromAWS();
      case 'azure':
        return await this.loadFromAzure();
      case 'doppler':
        return await this.loadFromDoppler();
      case 'env':
      default:
        return this.loadFromEnv();
    }
  }

  private async loadFromAWS(): Promise<Record<string, string>> {
    // AWS Secrets Manager implementation
    // ...
  }

  private async loadFromAzure(): Promise<Record<string, string>> {
    // Azure Key Vault implementation
    // ...
  }

  private async loadFromDoppler(): Promise<Record<string, string>> {
    // Doppler implementation
    // ...
  }

  private loadFromEnv(): Record<string, string> {
    // Load from .env file (development)
    return {
      DATABASE_URL: process.env.DATABASE_URL,
      JWT_SECRET: process.env.JWT_SECRET,
      // ... all secrets
    };
  }
}
```

---

## 🔐 Security Best Practices

### Do's ✅

1. **Use IAM Roles** - Prefer IAM roles over access keys when possible
2. **Enable Audit Logging** - Track all secret access
3. **Rotate Secrets Regularly** - Especially JWT_SECRET, SESSION_SECRET
4. **Use Least Privilege** - Grant minimum required permissions
5. **Encrypt at Rest & Transit** - Ensure encryption in all states
6. **Monitor Access Patterns** - Set up alerts for unusual access
7. **Separate Environments** - Different secrets for dev/staging/prod
8. **Use Secret Versioning** - Enable versioning for rollback capability

### Don'ts ❌

1. **Never Commit Secrets** - `.env` files must be gitignored ✅
2. **Never Share in Chat/Email** - Use secure channels only
3. **Never Hardcode Secrets** - Always use environment variables
4. **Never Use Production Secrets in Dev** - Separate environments
5. **Never Store in `.replit` File** - Only defaults, not secrets
6. **Never Log Secrets** - Mask secrets in logs
7. **Never Use Default Secrets** - Change all default values

---

## 📁 File Structure

```
project-root/
├── .env                    # Local dev (gitignored) ✅
├── .env.example           # Template (committed) ✅
├── .env.backup.encrypted  # Encrypted backup (gitignored)
├── .env.replit            # Replit-specific (gitignored)
│
├── scripts/
│   ├── sync-secrets.sh    # Sync secrets across platforms
│   └── backup-secrets.sh  # Backup encryption script
│
├── api/src/config/
│   ├── secrets-manager.service.ts    # AWS implementation
│   ├── azure-keyvault.service.ts     # Azure implementation
│   ├── doppler.service.ts            # Doppler implementation
│   └── unified-secrets.service.ts   # Unified loader
│
└── docs/
    └── SECRETS_MANAGEMENT.md  # This document
```

---

## 🔄 Workflow

### Initial Setup

1. **Choose Cloud Provider** - AWS, Azure, or GCP based on deployment
2. **Set Up Secrets Manager** - Create vault/key vault
3. **Create Secrets** - Add all production secrets
4. **Configure IAM** - Set up access permissions
5. **Implement Loader** - Create unified secrets service
6. **Test Fallback** - Verify `.env` fallback works
7. **Document Locations** - Update this document

### Daily Development

- **Cursor:** Use local `.env` file
- **Replit:** Use Replit Secrets (auto-loaded)
- **Production:** Use cloud secrets manager

### When Secrets Change

1. Update in cloud secrets manager first
2. Update platform secrets (Replit, Vercel, etc.)
3. Update local `.env` if needed
4. Create new encrypted backup
5. Document changes in this file

---

## 🚨 Emergency Recovery

If secrets are lost:

1. **Check Cloud Secrets Manager** - Primary source
2. **Check Encrypted Backup** - `.env.backup.encrypted`
3. **Check Password Manager** - Master backup
4. **Check Platform Dashboards** - Replit, Vercel, Railway
5. **Regenerate from Source** - API dashboards (RazorPay, OpenAI, etc.)
6. **Update All Locations** - Synchronize immediately

---

## 📊 Secret Categories

### Critical Secrets (Rotate Quarterly)
- `JWT_SECRET`
- `SESSION_SECRET`
- Database passwords
- Payment provider secrets

### API Keys (Rotate Annually)
- `OPENAI_API_KEY`
- `IDEOGRAM_API_KEY`
- `GOOGLE_API_KEY`
- Payment provider keys

### Configuration (Rotate As Needed)
- `DATABASE_URL`
- `BASE_URL`
- `CLIENT_URL`
- Plan IDs

---

## 🔧 Implementation Checklist

### Phase 1: Setup (Post-MVP)
- [ ] Choose cloud provider (AWS/Azure/GCP)
- [ ] Set up secrets manager account
- [ ] Create production secrets vault
- [ ] Configure IAM roles/permissions
- [ ] Install required SDKs

### Phase 2: Implementation (Post-MVP)
- [ ] Create unified secrets loader service
- [ ] Implement cloud provider integration
- [ ] Add fallback to `.env` for local dev
- [ ] Add caching mechanism
- [ ] Add error handling and logging

### Phase 3: Migration (Post-MVP)
- [ ] Migrate production secrets to cloud vault
- [ ] Update application configuration
- [ ] Test secret retrieval in all environments
- [ ] Set up monitoring/alerting
- [ ] Document secret locations

### Phase 4: Enhancement (Post-MVP)
- [ ] Set up automatic secret rotation
- [ ] Implement secret versioning
- [ ] Add audit logging dashboard
- [ ] Create backup automation
- [ ] Train team on secret management

---

## 📝 Environment-Specific Configuration

### Development (Cursor)
```env
SECRETS_SOURCE=env
# Secrets loaded from .env file
```

### Development (Replit)
```env
SECRETS_SOURCE=env
# Secrets loaded from Replit Secrets panel
```

### Staging
```env
SECRETS_SOURCE=aws  # or azure, doppler
AWS_REGION=us-east-1
AWS_SECRET_NAME=infographic-editor/staging
```

### Production
```env
SECRETS_SOURCE=aws  # or azure, doppler
AWS_REGION=us-east-1
AWS_SECRET_NAME=infographic-editor/production
```

---

## 🔍 Monitoring & Alerting

### Recommended Alerts

1. **Failed Secret Retrieval** - Alert if cloud secrets unavailable
2. **Fallback Activation** - Alert when falling back to `.env`
3. **Unusual Access Patterns** - Alert on unexpected access
4. **Secret Rotation Failures** - Alert if rotation fails
5. **Access Denied Errors** - Alert on permission issues

---

## 📚 Additional Resources

- [AWS Secrets Manager Documentation](https://docs.aws.amazon.com/secretsmanager/)
- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)
- [Google Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)
- [Doppler Documentation](https://docs.doppler.com/)
- [HashiCorp Vault Documentation](https://www.vaultproject.io/docs)

---

## 🎯 Post-MVP Roadmap

1. **Q1 Post-MVP:** Evaluate cloud providers and choose solution
2. **Q1 Post-MVP:** Implement unified secrets loader
3. **Q2 Post-MVP:** Migrate production secrets to cloud vault
4. **Q2 Post-MVP:** Set up automatic rotation for critical secrets
5. **Q3 Post-MVP:** Implement audit logging dashboard
6. **Q3 Post-MVP:** Create backup automation

---

**Last Updated:** January 2025  
**Next Review:** After MVP launch, before production deployment
