// Plan definitions and per-plan usage limits.
// A limit of -1 means unlimited. Limits are enforced per calendar month.

export type Plan = 'free' | 'pro' | 'enterprise';
export type UsageAction = 'search' | 'generate' | 'send';

export interface PlanDef {
  id: Plan;
  name: string;
  price: number; // USD / month
  priceId?: string; // Stripe price id (paid plans only)
  limits: Record<UsageAction, number>;
  features: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    limits: { search: 5, generate: 10, send: 3 },
    features: [
      '5 searches / month',
      '10 AI generations / month',
      '3 outreach emails / month',
      'Verified contact info',
    ],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_PRO,
    limits: { search: 50, generate: -1, send: 100 },
    features: [
      '50 searches / month',
      'Unlimited AI generations',
      '100 outreach emails / month',
      'LaTeX resume engine',
      'Reply tracking & follow-ups',
    ],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 99,
    priceId: process.env.NEXT_PUBLIC_STRIPE_PRICE_ENTERPRISE,
    limits: { search: -1, generate: -1, send: -1 },
    features: [
      'Unlimited everything',
      'Priority support',
      'API access',
      'Team seats (coming soon)',
    ],
  },
};

export function planFor(plan: string | null | undefined): PlanDef {
  return PLANS[(plan as Plan) ?? 'free'] ?? PLANS.free;
}

export function priceIdToPlan(priceId: string | null | undefined): Plan {
  if (!priceId) return 'free';
  if (priceId === PLANS.pro.priceId) return 'pro';
  if (priceId === PLANS.enterprise.priceId) return 'enterprise';
  return 'free';
}
