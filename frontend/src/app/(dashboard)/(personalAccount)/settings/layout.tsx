'use client';

import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { isLocalMode } from '@/lib/config';

type SettingsLayoutProps = {
  children: React.ReactNode;
};

const BASE_ITEMS = [
  { name: 'Perfil', href: '/settings' },
  { name: 'Cobrança', href: '/settings/billing' },
  { name: 'Transações', href: '/settings/transactions' },
];

export default function PersonalAccountSettingsLayout({ children }: SettingsLayoutProps) {
  const pathname = usePathname();

  const items = [
    ...BASE_ITEMS,
    ...(isLocalMode()
      ? [{ name: 'Gerenciar variáveis locais', href: '/settings/env-manager' }]
      : []),
  ];

  return (
    <div className="space-y-6 w-full">
      <Separator className="border-subtle dark:border-white/10" />
      <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 w-full max-w-7xl mx-auto px-4">
        <aside className="lg:w-1/4 p-1">
          <nav className="flex flex-col space-y-1">
            {items.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'
                  }`}
                >
                  {item.name}
                </Link>
              );
            })}
          </nav>
        </aside>
        <div className="flex-1 bg-card dark:bg-background-secondary rounded-2xl p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
