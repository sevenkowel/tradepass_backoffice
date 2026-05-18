# TradePass Environment Variables

Complete reference for all environment variables used in production, staging, and development.

---

## Required (Production)

| Variable | Description | Example |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/tradepass` |
| `JWT_SECRET` | Strong random string for JWT signing | `min-32-char-random-string` |
| `STRIPE_SECRET_KEY` | Stripe secret key (live or test) | `sk_live_...` / `sk_test_...` |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook endpoint secret | `whsec_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (client-side) | `pk_live_...` / `pk_test_...` |

## Optional

| Variable | Description | Default | Used By |
|---|---|---|---|
| `NODE_ENV` | Runtime environment | `development` | All |
| `PORT` | Server port | `3000` | Server |
| `HOSTNAME` | Bind address | `0.0.0.0` | Server |
| `NEXT_TELEMETRY_DISABLED` | Disable Next.js telemetry | `1` | Next.js |
| `NEXT_PUBLIC_APP_VERSION` | App version shown in health check | `1.0.0` | Health API |
| `REDIS_URL` | Redis connection for sessions/cache | — | Session, Rate Limit |
| `SENTRY_DSN` | Sentry error tracking DSN | — | Error reporting |
| `LOG_LEVEL` | Winston/pino log level | `info` | Logger |
| `CORS_ORIGIN` | Allowed CORS origins (comma-separated) | `*` | API |

## Stripe Webhook Endpoints

Configure these in your Stripe Dashboard:

| Event | Endpoint | Action |
|---|---|---|
| `checkout.session.completed` | `POST /api/webhooks/stripe` | Activate subscription |
| `invoice.paid` | `POST /api/webhooks/stripe` | Mark invoice paid |
| `invoice.payment_failed` | `POST /api/webhooks/stripe` | Notify + mark failed |
| `customer.subscription.deleted` | `POST /api/webhooks/stripe` | Downgrade to free |
| `customer.subscription.updated` | `POST /api/webhooks/stripe` | Sync status |

## Development Setup

```bash
# Copy example
cp .env .env.local

# Required for local dev
DATABASE_URL="file:./prisma/dev.db"
JWT_SECRET="dev-secret-min-32-chars-long"

# Stripe (placeholder = dev mode without real calls)
STRIPE_SECRET_KEY="sk_test_placeholder_replace_with_real_key"
STRIPE_WEBHOOK_SECRET="whsec_placeholder_replace_with_real_secret"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_placeholder_replace_with_real_key"
```

## Security Checklist

- [ ] `JWT_SECRET` is at least 32 random characters
- [ ] `STRIPE_SECRET_KEY` is never exposed client-side
- [ ] `DATABASE_URL` uses SSL in production (`?sslmode=require`)
- [ ] `.env` is in `.gitignore`
- [ ] Webhook secret matches Stripe Dashboard configuration
