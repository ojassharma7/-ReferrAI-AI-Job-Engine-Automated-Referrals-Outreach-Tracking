import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/auth';
import { getUsageSummary } from '@/lib/usage';
import { planFor, type UsageAction } from '@/lib/billing/plans';
import { PricingCards } from '@/components/billing/PricingCards';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const ACTION_LABELS: Record<UsageAction, string> = {
  search: 'Searches',
  generate: 'AI generations',
  send: 'Emails sent',
};

export default async function BillingPage() {
  const user = await getAppUser();
  if (!user) redirect('/login');

  const summary = await getUsageSummary(user);
  const plan = planFor(summary.plan);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Billing & usage</h1>
        <p className="text-muted-foreground">
          You&apos;re on the <strong>{plan.name}</strong> plan.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">This month</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {(Object.keys(summary.usage) as UsageAction[]).map((action) => {
            const { used, limit } = summary.usage[action];
            const unlimited = limit < 0;
            const pct = unlimited ? 0 : Math.min(100, (used / Math.max(limit, 1)) * 100);
            return (
              <div key={action} className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">
                    {ACTION_LABELS[action]}
                  </span>
                  <span className="text-sm font-medium">
                    {used}
                    {unlimited ? '' : ` / ${limit}`}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full rounded-full bg-primary transition-all"
                    style={{ width: unlimited ? '8%' : `${pct}%` }}
                  />
                </div>
                {unlimited && (
                  <span className="text-xs text-muted-foreground">Unlimited</span>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div>
        <h2 className="mb-4 text-lg font-semibold">Plans</h2>
        <PricingCards mode="checkout" currentPlan={summary.plan} />
      </div>
    </div>
  );
}
