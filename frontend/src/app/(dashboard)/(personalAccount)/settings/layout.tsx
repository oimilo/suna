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
    <div className="w-full space-y-6">
      <Separator className="border-subtle dark:border-white/10" />
      <div className="mx-auto flex w-full max-w-6xl flex-col space-y-8 px-4 lg:flex-row lg:space-x-12 lg:space-y-0">
        <aside className="lg:w-56 lg:flex-none">
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
        <div className="flex-1 pb-12 lg:pb-16">{children}</div>
      </div>
    </div>
  );
}
