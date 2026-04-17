Here's the full comparison, filtered specifically for your stack (NestJS + Express + Socket.io + PostgreSQL):                                                                                       
                                                                                                                                                                                                        ---                                                                                                                                                                                                 
  Platform Comparison for InfographicAI                                                                                                                                                                                                                                                                                                                                                                     
  Capability Requirements Check                                                                                                                                                                                                                                                                                                                                                                             
  ┌───────────────────────────────────┬────────────────────────────────────┐                                                                                                                            │            Requirement            │           Why it matters           │                                                                                                                            ├───────────────────────────────────┼────────────────────────────────────┤                                                                                                                          
  │ Persistent server (no serverless) │ NestJS boots once, stays running   │
  ├───────────────────────────────────┼────────────────────────────────────┤
  │ WebSocket / Socket.io             │ AI generation progress streaming   │
  ├───────────────────────────────────┼────────────────────────────────────┤
  │ Long request timeout (>10s)       │ AI generation can take 30–60s      │
  ├───────────────────────────────────┼────────────────────────────────────┤
  │ PostgreSQL                        │ Already on Neon (external)         │
  ├───────────────────────────────────┼────────────────────────────────────┤
  │ Webhook reliability               │ RazorPay webhooks need 24/7 uptime │
  └───────────────────────────────────┴────────────────────────────────────┘

  ---
  Platform Comparison Table

  ┌───────────────────────────┬──────────────────────────────┬───────────────────────────────────┬────────────────────┬────────────┬───────────────────────┬──────────────┬───────────────┐
  │         Platform          │          Free Tier           │            Paid Entry             │ Persistent Server  │ WebSockets │        Timeout        │ Cold Starts  │      DX       │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Railway                   │ $5 one-time credit           │ $5/mo (Hobby)                     │ ✅ Yes             │ ✅ Yes     │ ✅ Unlimited          │ ❌ None      │ ⭐⭐⭐⭐⭐    │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Render                    │ ✅ Perpetual (sleeps)        │ $7/mo (no sleep)                  │ ✅ Yes             │ ✅ Yes     │ ✅ Unlimited          │ ⚠️ Free only │ ⭐⭐⭐⭐      │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Fly.io                    │ ❌ Removed 2024              │ ~$2–4/mo (pay-per-use)            │ ✅ Yes             │ ✅ Yes     │ ✅ Unlimited          │ ❌ None      │ ⭐⭐⭐        │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Koyeb                     │ ✅ Perpetual (scale-to-zero) │ ~$2–5/mo                          │ ⚠️ Scale-to-zero   │ ⚠️ Limited │ ✅ Yes                │ ⚠️ Yes       │ ⭐⭐⭐        │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Vercel                    │ ✅ Perpetual (frontend only) │ $20/mo                            │ ❌ Serverless only │ ❌ No      │ ❌ 10s free / 60s pro │ ⚠️ Yes       │ ⭐⭐⭐⭐      │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Heroku                    │ ❌ None                      │ $5/mo (sleeps) / $7/mo (no sleep) │ ✅ Yes             │ ✅ Yes     │ ✅ Unlimited          │ ⚠️ Eco only  │ ⭐⭐⭐        │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ DigitalOcean App Platform │ ❌ Static only               │ $5/mo                             │ ✅ Yes             │ ✅ Yes     │ ✅ Unlimited          │ ❌ None      │ ⭐⭐⭐        │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ Hetzner VPS               │ ❌ None                      │ €3.49/mo                          │ ✅ Full control    │ ✅ Yes     │ ✅ Unlimited          │ ❌ None      │ ⭐⭐ (manual) │
  ├───────────────────────────┼──────────────────────────────┼───────────────────────────────────┼────────────────────┼────────────┼───────────────────────┼──────────────┼───────────────┤
  │ DigitalOcean Droplet      │ ❌ None                      │ $4–6/mo                           │ ✅ Full control    │ ✅ Yes     │ ✅ Unlimited          │ ❌ None      │ ⭐⭐ (manual) │
  └───────────────────────────┴──────────────────────────────┴───────────────────────────────────┴────────────────────┴────────────┴───────────────────────┴──────────────┴───────────────┘

  ---
  Value for Money — Ranked for Your Stack

  1. Render Free → Best for Pre-Launch / Testing

  - Cost: $0
  - Catch: Sleeps after 15 min → cold start ~30s → breaks RazorPay webhooks
  - Workaround: Use an uptime monitor (UptimeRobot free) to ping every 10 min — keeps it awake
  - Verdict: Viable for testing, risky for production payments

  2. Koyeb Free → Best Zero-Cost Option

  - Cost: $0 perpetual — 1 service + 1 PostgreSQL included
  - Catch: Scale-to-zero (cold starts); 512MB RAM may be tight for NestJS + Socket.io under load
  - Verdict: Worth trying before paying anything. May work fine for early-stage MVP

  3. Railway Hobby → Best Paid DX

  - Cost: $5/mo (includes $5 credit — small apps often run near-free)
  - Catch: Paywall to start
  - Verdict: Easiest setup, zero config, no cold starts. Worth $5 at launch stage

  4. Render Paid → Best Railway Alternative

  - Cost: $7/mo (no sleep, no cold starts)
  - Catch: $2/mo more than Railway, slightly less polished DX
  - Verdict: Near-equivalent to Railway at similar price

  5. Fly.io → Best for Cost Control at Scale

  - Cost: ~$2–4/mo for a small app (true pay-per-use)
  - Catch: CLI-heavy setup, more DevOps knowledge needed
  - Verdict: Cheapest persistent option long-term, but adds setup complexity pre-launch

  6. Hetzner / DigitalOcean Droplet → Best Long-Term Value

  - Cost: €3.49–$6/mo for a full VPS (2–4GB RAM, full root access)
  - Catch: You manage everything — OS updates, Node.js, process manager (PM2), nginx, SSL
  - Verdict: Best value per spec, but 2–4 hours of setup time. Post-launch migration candidate

  ---
  Recommendation for InfographicAI

  ┌─────────────────────────────┬───────────────┬──────────┬─────────────────────────────────────────────────────────┐
  │            Phase            │   Platform    │   Cost   │                         Reason                          │
  ├─────────────────────────────┼───────────────┼──────────┼─────────────────────────────────────────────────────────┤
  │ Right now (pre-launch)      │ Koyeb free    │ $0       │ Test if it handles NestJS + Socket.io before committing │
  ├─────────────────────────────┼───────────────┼──────────┼─────────────────────────────────────────────────────────┤
  │ Launch (if Koyeb struggles) │ Railway Hobby │ $5/mo    │ Zero friction, reliable webhooks                        │
  ├─────────────────────────────┼───────────────┼──────────┼─────────────────────────────────────────────────────────┤
  │ Post-launch (Month 2+)      │ Hetzner VPS   │ €3.49/mo │ Better specs, cheaper, migrate once stable              │
  └─────────────────────────────┴───────────────┴──────────┴─────────────────────────────────────────────────────────┘

  ---
  The Split Strategy (Frontend free forever)

  Since Vercel is free for static frontends:

  Vercel (free)          Koyeb or Railway ($0–5/mo)    Neon (free)
  ─────────────          ──────────────────────────    ──────────
  React/Vite SPA    →    NestJS + Express + Socket.io → PostgreSQL

  This requires ~1–2 hours to remove the Express proxy and point the frontend at the API URL directly — but saves the full hosting cost of the frontend tier.