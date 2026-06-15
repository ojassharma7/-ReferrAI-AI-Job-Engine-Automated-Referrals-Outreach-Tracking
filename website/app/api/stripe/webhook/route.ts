// Stripe webhook: keeps `subscriptions` and `profiles.plan` in sync.
// Uses the service-role client to bypass RLS (there's no user session here).
import { NextResponse, type NextRequest } from 'next/server';
import type Stripe from 'stripe';
import { getStripe } from '@/lib/billing/stripe';
import { createServiceClient } from '@/lib/supabase/server';
import { priceIdToPlan, type Plan } from '@/lib/billing/plans';

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: 'Stripe not configured' }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  const payload = await request.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${err instanceof Error ? err.message : ''}` },
      { status: 400 },
    );
  }

  const supabase = createServiceClient();

  async function syncSubscription(sub: Stripe.Subscription, userIdHint?: string) {
    const customerId =
      typeof sub.customer === 'string' ? sub.customer : sub.customer.id;
    const priceId = sub.items.data[0]?.price.id;
    const plan: Plan = sub.status === 'active' || sub.status === 'trialing'
      ? priceIdToPlan(priceId)
      : 'free';

    // Resolve the user: prefer the hint, else look up by stripe_customer_id.
    let userId = userIdHint;
    if (!userId) {
      const { data } = await supabase
        .from('profiles')
        .select('id')
        .eq('stripe_customer_id', customerId)
        .maybeSingle();
      userId = data?.id;
    }
    if (!userId) return;

    const periodEnd = (sub as unknown as { current_period_end?: number })
      .current_period_end;

    await supabase.from('subscriptions').upsert(
      {
        user_id: userId,
        stripe_customer_id: customerId,
        stripe_subscription_id: sub.id,
        plan,
        status: sub.status,
        current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
      },
      { onConflict: 'user_id' },
    );

    await supabase.from('profiles').update({ plan }).eq('id', userId);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id ?? session.metadata?.user_id;
        if (session.subscription) {
          const sub = await stripe.subscriptions.retrieve(
            session.subscription as string,
          );
          await syncSubscription(sub, userId ?? undefined);
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        await syncSubscription(event.data.object as Stripe.Subscription);
        break;
      }
      default:
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
