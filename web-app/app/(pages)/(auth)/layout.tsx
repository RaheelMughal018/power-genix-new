'use client';

import { ThemeToggle } from '@/app/_shared/components/ui/themeToggle/themeToggle';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* Left branded panel — 60% */}
      <div className="hidden md:flex w-[60%] bg-[var(--color-primary-700)] flex-col items-center justify-center relative">
        <div className="text-center space-y-6">
          <img
            src="https://prod.hsol.pk/files/system/_file6904e8851fc62-site-logo.png"
            alt="Power Genix Logo"
            className="w-32 h-auto mx-auto"
          />
          <div>
            <h1 className="text-3xl font-bold text-white">Power Genix</h1>
            <p className="text-white/70 text-lg mt-2">Inventory Management System</p>
          </div>
        </div>
        <div className="absolute bottom-8 text-white/40 text-xs">
          &copy; {new Date().getFullYear()} Power Genix. All rights reserved.
        </div>
      </div>

      {/* Right form panel — 40% */}
      <div className="w-full md:w-[40%] flex flex-col bg-[var(--color-bg-primary)]">
        <div className="flex justify-end p-4">
          <ThemeToggle />
        </div>
        <div className="flex-1 flex items-center justify-center px-8">
          <div className="w-full max-w-sm">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
