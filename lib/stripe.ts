import Stripe from 'stripe';

type StripeInstance = InstanceType<typeof Stripe>;

let _stripe: StripeInstance | null = null;

function getInstance(): StripeInstance {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('STRIPE_SECRET_KEY environment variable is not set');
    _stripe = new Stripe(key, { apiVersion: '2026-03-25.dahlia' });
  }
  return _stripe;
}

// Lazy proxy — Stripe is only instantiated on first method call, not at import time.
// This prevents build failures when STRIPE_SECRET_KEY is not available at build time.
export const stripe = new Proxy({} as StripeInstance, {
  get(_target, prop: string | symbol) {
    return (getInstance() as any)[prop];
  },
});
