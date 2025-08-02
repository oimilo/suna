'use client';

import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isLocalMode } from '@/lib/config';
import { usePtTranslations } from '@/hooks/use-pt-translations';

export default function PersonalAccountSettingsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = usePtTranslations();
  
  const items = [
    { name: 'Conta', href: '/settings' },
    { name: 'Equipes', href: '/settings/teams' },
    { name: t('settings.billing'), href: '/settings/billing' },
    { name: t('settings.usageLogs'), href: '/settings/usage-logs' },
    ...(isLocalMode() ? [{ name: t('settings.localEnvManager'), href: '/settings/env-manager' }] : []),
  ];
  return (
    <>
      <div className="space-y-6 w-full">
        <Separator />
        <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0 w-full max-w-7xl mx-auto px-4">
          <aside className="lg:w-1/4 p-1 lg:ml-[30px]">
            <nav className="flex flex-col space-y-1">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${pathname === item.href
                      ? 'bg-accent text-accent-foreground'
                      : 'text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground'}`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </aside>
          <div className="flex-1">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
