# Stripe product setup for Ely

Create these in the [Stripe Dashboard](https://dashboard.stripe.com/products) (Test mode first):

## Ely Plus

- **Monthly**: $19.00 USD, recurring monthly → copy Price ID to `STRIPE_PRICE_PLUS_MONTHLY`
- **Yearly**: $199.00 USD, recurring yearly → copy Price ID to `STRIPE_PRICE_PLUS_YEARLY`

## Ely Pro

- **Monthly**: $49.00 USD, recurring monthly → copy Price ID to `STRIPE_PRICE_PRO_MONTHLY`

## Webhook

1. Developers → Webhooks → Add endpoint
2. URL: `https://ely.ai/api/stripe/webhook` (or `http://localhost:3000/api/stripe/webhook` with Stripe CLI)
3. Events:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
4. Copy signing secret to `STRIPE_WEBHOOK_SECRET`

### Local webhook forwarding

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```
