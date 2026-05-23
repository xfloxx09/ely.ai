# Ely — ely.ai

Ely is an AI-powered life assistant with a product-first affiliate program. This MVP includes marketing pages, authentication, Stripe subscriptions (Plus/Pro), AI chat (Smart Concierge & Content Crafter), genealogy tracking, and simplified commission calculations.

> **Legal disclaimer:** This codebase is an engineering scaffold. Consult an MLM compliance attorney before public launch in any jurisdiction.

## Stack

- **Next.js 16** (App Router, standalone output for Railway)
- **PostgreSQL** + **Prisma**
- **Auth.js** (credentials)
- **Stripe** (subscriptions + webhooks)
- **OpenAI** (streaming chat)

## Local development

### 1. Prerequisites

- Node.js 20+
- Docker (for local Postgres) or a remote `DATABASE_URL`

### 2. Setup

```bash
cp .env.example .env
# Edit .env with your secrets

docker compose up -d
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Stripe (test mode)

See [scripts/stripe-seed.md](scripts/stripe-seed.md) for product/price setup.

Forward webhooks locally:

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

Copy the webhook signing secret into `.env` as `STRIPE_WEBHOOK_SECRET`.

### 4. OpenAI

Set `OPENAI_API_KEY` in `.env` to enable the assistant at `/app`.

## Railway deployment

1. Repo: [github.com/xfloxx09/ely.ai](https://github.com/xfloxx09/ely.ai) — connect this in Railway.
2. Create a Railway project → **Deploy from GitHub** → select the repo.
3. Add **PostgreSQL** → reference `DATABASE_URL` on the web service.
4. Set environment variables from `.env.example` (production values).
5. **Settings → Deploy → Pre-deploy command:** `npx prisma migrate deploy` (also in `railway.toml`).
6. Add custom domain **ely.ai** (and redirect `www` → apex).
7. Stripe webhook: `https://ely.ai/api/stripe/webhook`.

### Monthly commissions cron

Schedule a POST request (Railway cron or external):

```http
POST https://ely.ai/api/cron/commissions
Authorization: Bearer YOUR_CRON_SECRET
```

Run on the 1st of each month (or your chosen payout cycle).

## MVP compensation (simplified)

| Type | Rate | Notes |
|------|------|-------|
| Fast-start | 30% | First month of personally enrolled Plus/Pro |
| Personal residual | 20% | Recurring on personal enrollments |
| Unilevel L1 | 5% | Explorer — level-1 downline subscriptions |

Affiliates must maintain **active Ely Pro** and **$50+ personal volume** to earn.

## Project structure

```
src/
  app/           # Routes (marketing, auth, app, dashboard, API)
  components/    # UI
  lib/
    mlm/         # Genealogy, GV, commissions
    ai/          # OpenAI modules & usage
  auth.ts        # Auth.js config
prisma/          # Schema & migrations
```

## Phase 2 (not in MVP)

- Full unilevel depth by rank, leadership matching, retail bonus pool
- 70% retail rule enforcement
- Redis leaderboards & Builder's Arena campaigns
- Additional AI modules (Home, Habit, Knowledge, Finance)
- Stripe Connect payouts

## License

Private — All rights reserved.
