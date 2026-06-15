// Usage tracking + per-plan rate limiting.
//
// In demo mode (no Supabase / demo user) limits are NOT enforced, so the product
// is fully explorable. Once Supabase is configured and a user is signed in,
// usage is counted per calendar month against their plan.
import { createClient } from '@/lib/supabase/server';
import type { AppUser } from '@/lib/auth';
import { isSupabaseConfigured } from '@/lib/supabase/config';
import { planFor, type Plan, type UsageAction } from '@/lib/billing/plans';

export interface LimitResult {
  allowed: boolean;
  message?: string;
  used?: number;
  limit?: number;
  plan?: Plan;
}

function periodStartISO(): string {
  const d = new Date();
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)).toISOString();
}

async function getUserPlan(user: AppUser): Promise<Plan> {
  if (!isSupabaseConfigured() || user.isDemo) return 'free';
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single();
  return (data?.plan as Plan) ?? 'free';
}

async function countUsage(user: AppUser, action: UsageAction): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from('usage_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('action', action)
    .gte('occurred_at', periodStartISO());
  return count ?? 0;
}

export async function enforceLimit(
  user: AppUser,
  action: UsageAction,
): Promise<LimitResult> {
  // Don't gate demo mode.
  if (!isSupabaseConfigured() || user.isDemo) return { allowed: true };

  const plan = await getUserPlan(user);
  const limit = planFor(plan).limits[action];
  if (limit < 0) return { allowed: true, plan, limit }; // unlimited

  const used = await countUsage(user, action);
  if (used >= limit) {
    return {
      allowed: false,
      used,
      limit,
      plan,
      message: `You've reached your ${planFor(plan).name} plan limit of ${limit} ${action}${
        limit === 1 ? '' : 's'
      } this month. Upgrade to keep going.`,
    };
  }
  return { allowed: true, used, limit, plan };
}

export async function recordUsage(user: AppUser, action: UsageAction): Promise<void> {
  if (!isSupabaseConfigured() || user.isDemo) return;
  try {
    const supabase = await createClient();
    await supabase.from('usage_log').insert({ user_id: user.id, action });
  } catch (err) {
    console.warn('recordUsage failed:', err instanceof Error ? err.message : err);
  }
}

export interface UsageSummary {
  plan: Plan;
  usage: Record<UsageAction, { used: number; limit: number }>;
}

export async function getUsageSummary(user: AppUser): Promise<UsageSummary> {
  const plan = await getUserPlan(user);
  const limits = planFor(plan).limits;

  if (!isSupabaseConfigured() || user.isDemo) {
    return {
      plan,
      usage: {
        search: { used: 0, limit: limits.search },
        generate: { used: 0, limit: limits.generate },
        send: { used: 0, limit: limits.send },
      },
    };
  }

  const [search, generate, send] = await Promise.all([
    countUsage(user, 'search'),
    countUsage(user, 'generate'),
    countUsage(user, 'send'),
  ]);

  return {
    plan,
    usage: {
      search: { used: search, limit: limits.search },
      generate: { used: generate, limit: limits.generate },
      send: { used: send, limit: limits.send },
    },
  };
}
