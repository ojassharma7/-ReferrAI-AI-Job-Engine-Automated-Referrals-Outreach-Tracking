// Creates a Stripe Checkout session for upgrading to a paid plan.
import { NextResponse, type NextRequest } from 'next/server';
import { getAppUser } from '@/lib/auth';
import { getStripe, appUrl } from '@/lib/billing/stripe';
import { PLANS, type Plan } from '@/lib/billing/plans';
import { createClient } from '@/lib/supabase/server';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export async function POST(request: NextRequest) {
  const user = await getAppUser();
  if (!user || user.isDemo) {
    return NextResponse.json({ error: 'Sign in to upgrade.' }, { status: 401 });
  }

  const stripe = getStripe();
  if (!stripe || !isSupabaseConfigured()) {
    return NextResponse.json(
      { error: 'Billing is not configured on this deployment.' },
      { status: 503 },
    );
  }

  const { plan } = (await request.json().catch(() => ({}))) as { plan?: Plan };
  if (plan !== 'pro' && plan !== 'enterprise') {
    return NextResponse.json({ error: 'Invalid plan.' }, { status: 400 });
  }

  const priceId = PLANS[plan].priceId;
  if (!priceId) {
    return NextResponse.json(
      { error: `No Stripe price configured for the ${plan} plan.` },
      { status: 503 },
    );
  }

  try {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single();

    // Reuse or create the Stripe customer.
    let customerId = profile?.stripe_customer_id ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email ?? undefined,
        metadata: { user_id: user.id },
      });
      customerId = customer.id;
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: customerId })
        .eq('id', user.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      client_reference_id: user.id,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${appUrl()}/billing?status=success`,
      cancel_url: `${appUrl()}/billing?status=cancelled`,
      metadata: { user_id: user.id, plan },
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Checkout failed' },
      { status: 500 },
    );
  }
}
