import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAppUser } from '@/lib/auth';
import { AppNav } from '@/components/app/AppNav';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getAppUser();
  // Middleware already guards these routes, but double-check on the server.
  if (!user) redirect('/login');

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur">
        <div className="container mx-auto flex h-14 items-center justify-between gap-4 px-4">
          <Link href="/dashboard" className="text-lg font-bold tracking-tight">
            ReferrAI
          </Link>
          <AppNav />
          <div className="flex items-center gap-3">
            {user.isDemo ? (
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                Demo mode
              </span>
            ) : (
              <span className="hidden text-sm text-muted-foreground md:inline">
                {user.email}
              </span>
            )}
            {!user.isDemo && (
              <form action="/auth/signout" method="post">
                <Button type="submit" variant="ghost" size="icon-sm" title="Sign out">
                  <LogOut className="h-4 w-4" />
                </Button>
              </form>
            )}
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 py-8">{children}</main>
    </div>
  );
}
