'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ActivitySquare,
  CreditCard,
  Key,
  Shield,
  ShieldAlert,
  Users,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

import { AdminUserTable } from './admin-user-table';
import { AdminUserDetailsDialog } from './admin-user-details-dialog';
import { useAdminRole } from '@/hooks/admin';
import {
  type UserSummary,
  useAdminUserStats,
} from '@/hooks/admin/use-admin-users';
import { formatCredits, dollarsToCredits } from '@/lib/utils/credit-formatter';
import { isLocalMode } from '@/lib/config';

interface StatCardConfig {
  label: string;
  value: number | undefined;
  icon: React.ComponentType<{ className?: string }>;
  format?: 'number' | 'credits';
  helper?: string;
}

const tierLabelMap: Record<string, string> = {
  tier_2_20: 'Tier 20',
  tier_6_50: 'Tier 50',
  tier_12_100: 'Tier 100',
  tier_25_200: 'Tier 200',
  tier_50_400: 'Tier 400',
  tier_125_800: 'Tier 800',
  tier_200_1000: 'Tier 1000',
  free: 'Free',
};

export function AdminDashboard() {
  const { data: adminRole, isLoading: isCheckingAdmin } = useAdminRole();
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useAdminUserStats();

  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const handleCloseDetails = () => {
    setShowDetails(false);
    setSelectedUser(null);
  };

  const isAdmin = adminRole?.isAdmin ?? false;

  const statCards: StatCardConfig[] = useMemo(
    () => [
      {
        label: 'Total accounts',
        value: stats?.total_users,
        icon: Users,
        format: 'number',
        helper: 'All active Prophet organizations',
      },
      {
        label: 'Active (30d)',
        value: stats?.active_users_30d,
        icon: Activity,
        format: 'number',
        helper: 'Accounts that ran at least one workflow',
      },
      {
        label: 'Total credits (USD)',
        value: stats?.total_credits_in_system,
        icon: CreditCard,
        format: 'credits',
        helper: 'Sum of balances across all accounts',
      },
      {
        label: 'Avg. credit balance',
        value: stats?.average_credit_balance,
        icon: Shield,
        format: 'credits',
        helper: 'Mean balance per account',
      },
    ],
    [stats],
  );

  const tierTotal = stats?.tier_distribution?.reduce(
    (sum, tier) => sum + tier.count,
    0,
  );

  const quickActions = useMemo(() => {
    const baseActions = [
      {
        title: 'Billing Console',
        description: 'Adjust credits, refunds and review transactions.',
        href: '/admin/billing',
        icon: CreditCard,
      },
      {
        title: 'Admin API Keys',
        description: 'Rotate elevated API keys for internal tooling.',
        href: '/settings/api-keys',
        icon: Key,
      },
      {
        title: 'System Monitoring',
        description: 'Inspect live health metrics and background jobs.',
        href: '/monitoring',
        icon: ActivitySquare,
      },
    ];

    if (isLocalMode()) {
      baseActions.push({
        title: '.env Manager',
        description: 'Edit local secrets used by the development stack.',
        href: '#env-manager',
        icon: ShieldAlert,
      });
    }

    return baseActions;
  }, []);

  const handleUserSelect = (user: UserSummary) => {
    setSelectedUser(user);
    setShowDetails(true);
  };

  if (isCheckingAdmin) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-[480px] w-full" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <Alert variant="destructive">
        <ShieldAlert className="h-4 w-4" />
        <AlertTitle>Restricted area</AlertTitle>
        <AlertDescription>
          You need the Prophet admin role to access these controls. Ask an
          existing administrator to grant you access in Supabase.
        </AlertDescription>
      </Alert>
    );
  }

  const renderStatValue = (card: StatCardConfig) => {
    if (card.value === undefined || Number.isNaN(card.value)) {
      return '—';
    }

    if (card.format === 'credits') {
      return formatCredits(dollarsToCredits(card.value), {
        showDecimals: true,
      });
    }

    return new Intl.NumberFormat('en-US', {
      maximumFractionDigits: 0,
    }).format(card.value);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Control Center</h1>
          <p className="text-sm text-muted-foreground">
            Monitor Prophet usage, inspect accounts and quickly jump into
            internal tools.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button asChild variant="outline">
            <Link href="/admin/billing">Open Billing Console</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/settings/api-keys">API Keys</Link>
          </Button>
        </div>
      </header>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">Usage analytics</h2>
          <p className="text-sm text-muted-foreground">
            Real-time aggregates collected from Supabase and billing tables.
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {statCards.map((card) => (
            <Card key={card.label}>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.label}
                  </CardTitle>
                  <div className="text-2xl font-semibold">
                    {statsLoading ? (
                      <Skeleton className="mt-2 h-7 w-24" />
                    ) : (
                      renderStatValue(card)
                    )}
                  </div>
                </div>
                <card.icon className="h-5 w-5 text-muted-foreground" />
              </CardHeader>
              {card.helper && (
                <CardContent>
                  <p className="text-xs text-muted-foreground">{card.helper}</p>
                </CardContent>
              )}
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base font-medium">Tier mix</CardTitle>
            <CardDescription>
              Distribution of active accounts by subscription tier.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {statsLoading ? (
              [...Array(4)].map((_, index) => (
                <Skeleton key={index} className="h-6 w-full" />
              ))
            ) : stats?.tier_distribution && stats.tier_distribution.length > 0 ? (
              stats.tier_distribution.map((tier) => {
                const percentage =
                  tierTotal && tierTotal > 0
                    ? Math.round((tier.count / tierTotal) * 100)
                    : 0;

                return (
                  <div key={tier.tier} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">
                        {tierLabelMap[tier.tier] || tier.tier}
                      </span>
                      <span className="text-muted-foreground">
                        {tier.count} · {percentage}%
                      </span>
                    </div>
                    <Progress value={percentage} />
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground">
                No tier information available yet.
              </p>
            )}
            {statsError && (
              <Alert variant="warning">
                <AlertTitle>Unable to load distribution</AlertTitle>
                <AlertDescription>
                  Failed to fetch the tier breakdown. Refresh the page or verify
                  the admin API connectivity.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-medium">Accounts</h2>
            <p className="text-sm text-muted-foreground">
              Search, filter and deep-dive into any Prophet account.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/admin/billing">See billing ledger</Link>
          </Button>
        </div>

        <AdminUserTable onUserSelect={handleUserSelect} />
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-medium">System tools & quick links</h2>
          <p className="text-sm text-muted-foreground">
            Jump to common administrative utilities.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Card key={action.title} className="h-full">
              <CardHeader className="flex flex-row items-start gap-4">
                <action.icon className="h-5 w-5 text-muted-foreground" />
                <div>
                  <CardTitle className="text-base font-semibold">
                    {action.title}
                  </CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link href={action.href}>Open</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <AdminUserDetailsDialog
        user={selectedUser}
        isOpen={showDetails}
        onClose={handleCloseDetails}
      />
    </div>
  );
}

