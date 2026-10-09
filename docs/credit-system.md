# Credit System Documentation

## Overview

The MediaForge AI credit system provides a pay-per-use model for AI services. Users receive free credits upon registration and can purchase additional credits through Stripe integration.

## Features

### 🎁 Free Credits for New Users
- **50 free credits** are automatically allocated to new users upon registration
- Credits are added via Clerk webhook when `user.created` event is triggered

### 💳 Credit Pack System
- **Free Starter Pack**: 50 credits for free (one-time use)
- **Paid Credit Packs**: Purchase additional credits when needed
- **Three Credit Packages**:
  - Starter Pack: 50 credits for FREE (new users)
  - Pro Pack: 200 credits for $29.99 (Most Popular)
  - Enterprise Pack: 1000 credits for $99.99

### 📊 Real-time Credit Display
- Credits are displayed in the header for authenticated users
- Auto-refreshes every 30 seconds
- Shows current balance with loading states

### 🔄 Credit Pack Consumption System
- Credits are consumed automatically when using AI features
- Each feature has a specific credit cost per use
- When credits are depleted, users must purchase new credit packs
- Admin users have unlimited access (no credit deduction)

## Feature Pricing

| Feature | Model | Credits |
|---------|-------|---------|
| Video Generation | Hailuo | 8 credits |
| Video Generation | Veo2 | 15 credits |
| Map Animation | Hailuo | 5 credits |
| Map Animation | Veo2 | 10 credits |
| Image Generation | Default | 3 credits |

## Database Schema

### Core Tables
- `users`: User information (extends Clerk data)
- `credits`: User credit balances
- `credit_transactions`: All credit operations (purchases, usage, bonuses)
- `usage_logs`: Detailed usage tracking
- `credit_packages`: Available credit packages
- `purchases`: Purchase history
- `feature_pricing`: Credit costs for different features

## API Endpoints

### Credit Management
- `GET /api/credits/balance` - Get user's credit balance
- `GET /api/credits/check` - Check if user has enough credits for a feature
- `GET /api/credits/packages` - Get available credit packages

### Stripe Integration
- `POST /api/stripe/create-checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhook events

### Webhooks
- `POST /api/webhooks/clerk` - Handle Clerk user events

## Setup Instructions

### 1. Environment Variables
```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/your_database"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret

# Stripe Payment Processing
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=whsec_your_stripe_webhook_secret
```

### 2. Database Setup
```bash
# Run database migrations
npm run db:push

# Initialize credit system
npm run credits:setup
```

### 3. Webhook Configuration

#### Clerk Webhook
- Endpoint: `https://your-domain.com/api/webhooks/clerk`
- Events: `user.created`
- Secret: Use the `CLERK_WEBHOOK_SECRET` from your Clerk dashboard

#### Stripe Webhook
- Endpoint: `https://your-domain.com/api/stripe/webhook`
- Events: `checkout.session.completed`, `payment_intent.payment_failed`
- Secret: Use the webhook secret from your Stripe dashboard

## Usage Examples

### Checking Credits Before Feature Use
```typescript
import { CreditService } from '@/lib/services/credit-service';

const creditCheck = await CreditService.checkCredits(userId, 'video-generation', 'hailuo');
if (creditCheck.hasCredits) {
  // Proceed with feature
} else {
  // Show insufficient credits message
}
```

### Deducting Credits After Feature Use
```typescript
const result = await CreditService.deductCredits(
  userId, 
  'video-generation', 
  'hailuo',
  'User prompt text',
  { duration: 30, quality: 'high' }
);
```

### Adding Credits (Purchase/Bonus)
```typescript
await CreditService.addCredits(
  userId,
  50,
  'purchase',
  'Credit purchase - 50 credits',
  { sessionId: 'cs_xxx', packageId: 'starter' }
);
```

## Components

### CreditDisplay
- Real-time credit balance display
- Auto-refreshes every 30 seconds
- Shows loading and error states

### CreditPurchase
- Credit package selection
- Stripe checkout integration
- Purchase confirmation handling

## Security Features

- **Webhook Verification**: All webhooks are verified using signatures
- **Admin Protection**: Admin users have unlimited access without credit deduction
- **Transaction Logging**: All credit operations are logged for audit
- **Error Handling**: Comprehensive error handling and user feedback

## Monitoring

### Credit Usage Analytics
- Track usage patterns by feature and model
- Monitor credit consumption rates
- Identify popular features

### Purchase Analytics
- Track conversion rates
- Monitor revenue from credit sales
- Analyze package popularity

## Troubleshooting

### Common Issues

1. **Credits not updating**: Check webhook configuration and database connectivity
2. **Purchase not completing**: Verify Stripe webhook setup and secret
3. **User not getting free credits**: Check Clerk webhook configuration

### Debug Commands
```bash
# Check credit system status
npm run credits:setup

# View database schema
npm run db:studio
```

## Future Enhancements

- [ ] Credit expiration system
- [ ] Referral credit bonuses
- [ ] Bulk credit discounts
- [ ] Credit usage analytics dashboard
- [ ] Automated credit top-up
- [ ] Credit gifting system
