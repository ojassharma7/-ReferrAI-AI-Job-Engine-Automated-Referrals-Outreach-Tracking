// Stripe helper. Returns null when Stripe isn't configured so billing degrades
// gracefully (the UI shows "billing not set up" instead of crashing).
import Stripe from 'stripe';

const PLACEHOLDERS = ['your_', '_here', 'changeme'];

export function stripeConfigured(): boolean {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.trim() === '') return false;
  return !PLACEHOLDERS.some((p) => key.toLowerCase().includes(p));
}

let cached: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (!stripeConfigured()) return null;
  if (!cached) {
    cached = new Stripe(process.env.STRIPE_SECRET_KEY as string);
  }
  return cached;
}

export function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
}
