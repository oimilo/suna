'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { AdminUserTable } from '@/components/admin/admin-user-table';
import { AdminUserDetailsDialog } from '@/components/admin/admin-user-details-dialog';
import {
  useAdminUserStats,
  useRefreshUserData,
  UserSummary,
} from '@/hooks/react-query/admin/use-admin-users';
import { Users, TrendingUp, DollarSign, Sparkles } from 'lucide-react';

export default function AdminBillingPage() {
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { data: stats } = useAdminUserStats();
  const { refreshUserList, refreshUserStats } = useRefreshUserData();

  const handleUserSelect = (user: UserSummary) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
  };

  const handleRefreshData = () => {
    refreshUserList();
    refreshUserStats();
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const calculateActivityRate = () => {
    if (!stats || stats.total_users === 0) return 0;
    return Math.round((stats.active_users_30d / stats.total_users) * 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
              Billing Management - Admin
            </h1>
            <p className="text-md text-muted-foreground mt-2">
              Manage billing, user balances, and administrative adjustments
            </p>
          </div>

          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-full">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Total Users
                    </p>
                    <p className="text-lg font-semibold">{stats.total_users}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                    <DollarSign className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Active (30d)
                    </p>
                    <p className="text-lg font-semibold">{stats.active_users_30d}</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-full">
                    <TrendingUp className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Activity Rate
                    </p>
                    <p className="text-lg font-semibold">
                      {calculateActivityRate()}%
                    </p>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="p-2 bg-purple-100 dark:bg-purple-950/40 rounded-full">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wide">
                      Paid Tiers
                    </p>
                    <p className="text-lg font-semibold">
                      {stats.tier_distribution
                        ?.filter((tier) => tier.tier !== 'free')
                        .reduce((acc, tier) => acc + tier.count, 0) ?? 0}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <Card className="border-none shadow-md bg-white/90 dark:bg-black/40">
          <CardContent className="p-0">
            <AdminUserTable onUserSelect={handleUserSelect} />
          </CardContent>
        </Card>

        <AdminUserDetailsDialog
          user={selectedUser}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onRefresh={handleRefreshData}
        />
      </div>
    </div>
  );
}
