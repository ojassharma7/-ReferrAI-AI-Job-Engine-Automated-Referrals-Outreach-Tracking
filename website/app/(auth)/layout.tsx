import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-gray-50 to-white px-4">
      <Link href="/" className="mb-8 text-2xl font-bold tracking-tight">
        ReferrAI
      </Link>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
