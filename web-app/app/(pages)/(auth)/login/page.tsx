import { LoginForm } from '@/app/_shared/components/forms/loginForm/loginForm';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sign In | Power Genix',
  description: 'Sign in to Power Genix Inventory System',
};

interface LoginPageProps {
  searchParams: Promise<{ callbackUrl?: string }>;
}

export default async function LoginPage({ searchParams }: LoginPageProps) {
  const { callbackUrl } = await searchParams;

  return (
    <div className="space-y-6">
      {/* Mobile logo — hidden on desktop since left panel shows it */}
      <div className="flex justify-center md:hidden mb-4">
        <img
          src="https://prod.hsol.pk/files/system/_file6904e8851fc62-site-logo.png"
          alt="Power Genix Logo"
          className="w-20 h-auto"
        />
      </div>
      <div className="text-center">
        <h1 className="text-2xl font-bold text-[var(--color-text-primary)]">
          Welcome back
        </h1>
        <p className="text-[var(--color-text-secondary)]">
          Sign in to your account to continue
        </p>
      </div>
      <LoginForm callbackUrl={callbackUrl} />
    </div>
  );
}
