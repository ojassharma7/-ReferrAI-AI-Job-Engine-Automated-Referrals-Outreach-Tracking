'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLANS, type Plan } from '@/lib/billing/plans';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PricingCardsProps {
  // 'checkout' = signed-in billing page; 'signup' = public pricing page.
  mode: 'checkout' | 'signup';
  currentPlan?: Plan;
}

export function PricingCards({ mode, currentPlan }: PricingCardsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<Plan | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function upgrade(plan: Plan) {
    if (mode === 'signup') {
      router.push('/register');
      return;
    }
    setLoading(plan);
    setError(null);
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not start checkout');
      if (data.url) window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Checkout failed');
      setLoading(null);
    }
  }

  const order: Plan[] = ['free', 'pro', 'enterprise'];

  return (
    <div className="space-y-4">
      {error && <p className="text-center text-sm text-red-600">{error}</p>}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {order.map((id) => {
          const plan = PLANS[id];
          const isCurrent = currentPlan === id;
          const highlight = id === 'pro';
          return (
            <Card
              key={id}
              className={cn(highlight && 'border-primary shadow-md', 'flex flex-col')}
            >
              <CardHeader>
                <CardTitle className="flex items-baseline justify-between">
                  <span>{plan.name}</span>
                  <span className="text-2xl font-bold">
                    ${plan.price}
                    <span className="text-sm font-normal text-muted-foreground">
                      /mo
                    </span>
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-1 flex-col gap-4">
                <ul className="flex-1 space-y-2 text-sm">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                {id === 'free' ? (
                  <Button variant="outline" disabled={isCurrent} className="w-full">
                    {isCurrent ? 'Current plan' : 'Free'}
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    variant={highlight ? 'default' : 'outline'}
                    disabled={isCurrent || loading !== null}
                    onClick={() => upgrade(id)}
                  >
                    {loading === id && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isCurrent ? 'Current plan' : `Upgrade to ${plan.name}`}
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
