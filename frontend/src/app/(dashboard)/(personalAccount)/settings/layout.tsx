'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { isLocalMode } from '@/lib/config';
import { usePtTranslations } from '@/hooks/use-pt-translations';
import { cn } from '@/lib/utils';
import { User2, CreditCard, BarChart3, Settings2 } from 'lucide-react';

export default function PersonalAccountSettingsPage({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { t } = usePtTranslations();
  
  const items = [
    { name: 'Conta', href: '/settings', icon: User2 },
    { name: 'Cobrança', href: '/settings/billing', icon: CreditCard },
    { name: 'Logs de Uso', href: '/settings/usage-logs', icon: BarChart3 },
    ...(isLocalMode() ? [{ name: t('settings.localEnvManager'), href: '/settings/env-manager', icon: Settings2 }] : []),
  ];
  return (
    <div className="flex flex-col lg:flex-row gap-8 w-full max-w-7xl mx-auto px-4 py-6">
      {/* Sidebar com design Suna */}
      <aside className="lg:w-[200px] flex-shrink-0">
        <nav className="flex flex-col gap-1 mt-[52px]">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                  isActive
                    ? "bg-black/[0.04] dark:bg-white/[0.06] text-foreground"
                    : "text-muted-foreground hover:bg-black/[0.02] dark:hover:bg-white/[0.03] hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 opacity-60" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      {/* Content area */}
      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
