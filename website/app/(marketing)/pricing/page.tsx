import Link from 'next/link';
import { PricingCards } from '@/components/billing/PricingCards';

export default function PricingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ReferrAI
        </Link>
        <Link href="/dashboard" className="text-sm font-medium hover:underline">
          Open app
        </Link>
      </header>

      <section className="container mx-auto max-w-5xl px-4 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold tracking-tight">Simple pricing</h1>
          <p className="mt-3 text-lg text-muted-foreground">
            Start free. Upgrade when referrals start landing interviews.
          </p>
        </div>
        <PricingCards mode="signup" />
      </section>
    </main>
  );
}
