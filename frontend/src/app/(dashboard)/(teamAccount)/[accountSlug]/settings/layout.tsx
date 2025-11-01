'use client';

import React from 'react';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type LayoutParams = {
  accountSlug: string;
};

export default function TeamSettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<LayoutParams>;
}) {
  const unwrappedParams = React.use(params);
  const { accountSlug } = unwrappedParams;
  const pathname = usePathname();
  const items = [
    { name: 'Account', href: `/${accountSlug}/settings` },
    { name: 'Members', href: `/${accountSlug}/settings/members` },
    { name: 'Billing', href: `/${accountSlug}/settings/billing` },
  ];
  return (
    <div className="w-full space-y-6">
      <Separator className="border-subtle dark:border-white/10" />
      <div className="mx-auto flex w-full max-w-6xl flex-col space-y-8 px-4 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-56 lg:flex-none">
          <nav className="flex flex-col space-y-1">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  pathname === item.href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </aside>
        <div className="flex-1 pb-12 lg:pb-16">{children}</div>
      </div>
    </div>
  );
}
