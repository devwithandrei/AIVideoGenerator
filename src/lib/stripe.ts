import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null;

// Client-side Stripe configuration
export const stripeConfig = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
};

// Credit package pricing (in cents)
export const CREDIT_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter Pack',
    credits: 50,
    price: 0, // Free for new users
    description: 'Free starter pack for new users',
    popular: false,
    isFree: true,
  },
  {
    id: 'pro',
    name: 'Pro Pack',
    credits: 200,
    price: 2999, // $29.99
    description: 'Great for regular users',
    popular: true,
    isFree: false,
  },
  {
    id: 'enterprise',
    name: 'Enterprise Pack',
    credits: 1000,
    price: 9999, // $99.99
    description: 'For power users and businesses',
    popular: false,
    isFree: false,
  },
];

// Feature pricing (credits per use)
export const FEATURE_PRICING = {
  'video-generation': {
    hailuo: 8,
    veo2: 15,
  },
  'image-generation': {
    default: 3,
  },
  'map-animation': {
    hailuo: 5,
    veo2: 10,
  },
};

// Free credits for new users
export const FREE_CREDITS_FOR_NEW_USERS = 50;
