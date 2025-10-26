'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import {
  User,
  CreditCard,
  History,
  DollarSign,
  Activity,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Clock,
  Infinity,
  MessageSquare,
  ExternalLink,
} from 'lucide-react';
import {
  useAdminUserDetails,
  useAdminUserThreads,
  useAdminUserActivity,
  UserSummary,
} from '@/hooks/react-query/admin/use-admin-users';
import {
  useUserBillingSummary,
  useAdjustCredits,
  useProcessRefund,
  useAdminUserTransactions,
} from '@/hooks/react-query/admin/use-admin-billing';

interface AdminUserDetailsDialogProps {
  user: UserSummary | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

export function AdminUserDetailsDialog({
  user,
  isOpen,
  onClose,
  onRefresh,
}: AdminUserDetailsDialogProps) {
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');
  const [refundAmount, setRefundAmount] = useState('');
  const [refundReason, setRefundReason] = useState('');
  const [adjustIsExpiring, setAdjustIsExpiring] = useState(true);
  const [refundIsExpiring, setRefundIsExpiring] = useState(false);
  const [threadsPage, setThreadsPage] = useState(1);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [activityPage, setActivityPage] = useState(1);

  const { data: userDetails, isLoading } = useAdminUserDetails(user?.id || null);
  const { data: billingSummary, refetch: refetchBilling } = useUserBillingSummary(user?.id || null);
  const { data: userThreads, isLoading: threadsLoading } = useAdminUserThreads({
    email: user?.email || '',
    page: threadsPage,
    page_size: 10,
  });
  const { data: userTransactions, isLoading: transactionsLoading } = useAdminUserTransactions({
    userId: user?.id || '',
    page: transactionsPage,
    page_size: 10,
  });
  const { data: userActivity, isLoading: activityLoading } = useAdminUserActivity({
    userId: user?.id || '',
    page: activityPage,
    page_size: 10,
  });
  const adjustCreditsMutation = useAdjustCredits();
  const processRefundMutation = useProcessRefund();

  const primaryEmail =
    userDetails?.user?.billing_customers?.[0]?.email ??
    user?.email ??
    'unknown';
  const currentBalance =
    billingSummary?.credit_account?.balance ?? user?.credit_balance ?? 0;
  const totalPurchased =
    billingSummary?.credit_account?.lifetime_purchased ?? user?.total_purchased ?? 0;
  const totalUsed =
    billingSummary?.credit_account?.lifetime_used ?? user?.total_used ?? 0;
  const subscriptionStatus =
    (billingSummary?.subscription as Record<string, any> | null)?.status ??
    user?.subscription_status ??
    undefined;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toFixed(2)}`;
  };

  const handleAdjustCredits = async () => {
    if (!user || !adjustAmount || !adjustReason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await adjustCreditsMutation.mutateAsync({
        account_id: user.id,
        amount: parseFloat(adjustAmount),
        reason: adjustReason,
        notify_user: true,
        is_expiring: adjustIsExpiring,
      });

      toast.success(
        `Credits adjusted successfully. New balance: ${formatCurrency(result.new_balance)}`,
      );

      refetchBilling();
      onRefresh?.();
      setAdjustAmount('');
      setAdjustReason('');
      setAdjustIsExpiring(true);
    } catch (error: any) {
      toast.error(error.message || 'Failed to adjust credits');
    }
  };

  const handleProcessRefund = async () => {
    if (!user || !refundAmount || !refundReason) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      const result = await processRefundMutation.mutateAsync({
        account_id: user.id,
        amount: parseFloat(refundAmount),
        reason: refundReason,
        stripe_refund: false,
        is_expiring: refundIsExpiring,
      });

      toast.success(
        `Refund processed. New balance: ${formatCurrency(result.new_balance)}`,
      );

      refetchBilling();
      onRefresh?.();

      setRefundAmount('');
      setRefundReason('');
      setRefundIsExpiring(false);
    } catch (error: any) {
      toast.error(error.message || 'Failed to process refund');
    }
  };

  const getTierBadgeVariant = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'pro':
        return 'default';
      case 'premium':
        return 'secondary';
      case 'free':
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getSubscriptionBadgeVariant = (status?: string) => {
    switch (status) {
      case 'active':
        return 'default';
      case 'cancelled':
        return 'destructive';
      case 'past_due':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'usage':
        return 'text-red-600';
      case 'admin_grant':
        return 'text-green-600';
      case 'tier_grant':
        return 'text-blue-600';
      case 'purchase':
        return 'text-purple-600';
      case 'refund':
        return 'text-orange-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Details - {user.email}
          </DialogTitle>
            <DialogDescription>
              Manage user account, billing, and perform admin actions
            </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-4 p-1">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-64 w-full" />
            </div>
          ) : (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-5 sticky top-0 z-10">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="threads">Threads</TabsTrigger>
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="activity">Activity</TabsTrigger>
                <TabsTrigger value="actions">Admin Actions</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Account Info
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Email</p>
                        <p className="font-mono text-sm break-all">{primaryEmail}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">User ID</p>
                        <p className="font-mono text-xs">{user.id}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Joined</p>
                        <p className="text-sm">{formatDate(user.created_at)}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Tier</p>
                        <Badge variant={getTierBadgeVariant(user.tier)} className="capitalize">
                          {user.tier}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Credit Summary
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Current Balance</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(currentBalance)}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Purchased</p>
                          <p className="font-medium">{formatCurrency(totalPurchased)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Used</p>
                          <p className="font-medium">{formatCurrency(totalUsed)}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-muted-foreground">Subscription</p>
                        <Badge
                          variant={getSubscriptionBadgeVariant(subscriptionStatus ?? undefined)}
                          className="capitalize"
                        >
                          {subscriptionStatus || 'None'}
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="threads" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4" />
                      User Threads
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {threadsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : userThreads && userThreads.data.length > 0 ? (
                      <div className="space-y-2">
                        {userThreads.data.map((thread) => (
                          <div
                            key={thread.thread_id}
                            className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                {thread.project_name ? (
                                  <p className="text-sm font-medium truncate">{thread.project_name}</p>
                                ) : (
                                  <p className="text-sm font-medium text-muted-foreground">Direct Thread</p>
                                )}
                                {thread.is_public && (
                                  <Badge variant="outline" className="text-xs">
                                    Public
                                  </Badge>
                                )}
                              </div>
                              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                <span>Updated {formatDate(thread.updated_at)}</span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                {thread.thread_id}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              asChild
                              className="ml-2 flex-shrink-0"
                            >
                              <a
                                href={`/share/${thread.thread_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Open
                              </a>
                            </Button>
                          </div>
                        ))}
                        {userThreads.pagination && userThreads.pagination.total_pages > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userThreads.pagination.has_previous}
                              onClick={() => setThreadsPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {userThreads.pagination.current_page} of {userThreads.pagination.total_pages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userThreads.pagination.has_next}
                              onClick={() => setThreadsPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No threads found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="transactions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <DollarSign className="h-4 w-4" />
                      Transactions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {transactionsLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : userTransactions && userTransactions.data?.length > 0 ? (
                      <div className="space-y-2">
                        {userTransactions.data.map((transaction: any) => (
                          <div
                            key={transaction.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div>
                              <p className="text-sm font-medium">{transaction.description}</p>
                              <p className="text-xs text-muted-foreground">
                                {formatDate(transaction.created_at)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className={`font-semibold ${getTransactionColor(transaction.type)}`}>
                                {transaction.amount > 0 ? '+' : ''}
                                {formatCurrency(Math.abs(transaction.amount))}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Balance: {formatCurrency(transaction.balance_after)}
                              </p>
                            </div>
                          </div>
                        ))}
                        {userTransactions.pagination && userTransactions.pagination.total_pages > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userTransactions.pagination.has_prev}
                              onClick={() => setTransactionsPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {userTransactions.pagination.page} of {userTransactions.pagination.total_pages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userTransactions.pagination.has_next}
                              onClick={() => setTransactionsPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No transactions found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Activity className="h-4 w-4" />
                      Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {activityLoading ? (
                      <div className="space-y-2">
                        {[...Array(3)].map((_, i) => (
                          <Skeleton key={i} className="h-16 w-full" />
                        ))}
                      </div>
                    ) : userActivity && userActivity.data?.length > 0 ? (
                      <div className="space-y-2">
                        {userActivity.data.map((item: any) => (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3 border rounded-lg"
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{item.agent_name}</p>
                                <Badge
                                  variant={
                                    item.status === 'completed'
                                      ? 'default'
                                      : item.status === 'failed'
                                      ? 'destructive'
                                      : 'secondary'
                                  }
                                  className="text-xs"
                                >
                                  {item.status}
                                </Badge>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDate(item.created_at)}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                                {item.thread_id || 'Thread not available'}
                              </p>
                            </div>
                          </div>
                        ))}
                        {userActivity.pagination && userActivity.pagination.total_pages > 1 && (
                          <div className="flex items-center justify-between pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userActivity.pagination.has_prev}
                              onClick={() => setActivityPage((p) => Math.max(1, p - 1))}
                            >
                              Previous
                            </Button>
                            <span className="text-sm text-muted-foreground">
                              Page {userActivity.pagination.page} of {userActivity.pagination.total_pages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={!userActivity.pagination.has_next}
                              onClick={() => setActivityPage((p) => p + 1)}
                            >
                              Next
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No activity found</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              <TabsContent value="actions" className="space-y-4">
                <div className="grid grid-cols-1 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4" />
                        Process Refund
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 border border-red-200 dark:border-red-950 bg-red-50 dark:bg-red-950/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <AlertCircle className="h-4 w-4 text-red-600 mt-0.5" />
                          <p className="text-sm text-red-700">
                            Refunds assigns credits back to the user's account.
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="refund-amount">Refund Amount (USD)</Label>
                        <Input
                          id="refund-amount"
                          type="number"
                          step="0.01"
                          placeholder="50.00"
                          value={refundAmount}
                          onChange={(e) => setRefundAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="refund-reason">Refund Reason</Label>
                        <Textarea
                          id="refund-reason"
                          placeholder="Service outage compensation"
                          value={refundReason}
                          onChange={(e) => setRefundReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="refund-expiring" className="cursor-pointer flex items-center gap-2">
                            {refundIsExpiring ? (
                              <Clock className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Infinity className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">
                              {refundIsExpiring ? 'Expiring Credits' : 'Non-Expiring Credits'}
                            </span>
                          </Label>
                        </div>
                        <Switch
                          id="refund-expiring"
                          checked={!refundIsExpiring}
                          onCheckedChange={(checked) => setRefundIsExpiring(!checked)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground -mt-2">
                        {refundIsExpiring
                          ? 'Credits will expire at the end of the billing cycle'
                          : 'Refunds typically use non-expiring credits (recommended)'}
                      </p>
                      <Button
                        onClick={handleProcessRefund}
                        disabled={processRefundMutation.isPending}
                        variant="destructive"
                        className="w-full"
                      >
                        {processRefundMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          'Process Refund'
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <History className="h-4 w-4" />
                        Adjust Credits
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 border border-blue-200 dark:border-blue-950 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-700">
                            Adjust credits directly for the user's account.
                          </p>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="adjust-amount">Amount (USD)</Label>
                        <Input
                          id="adjust-amount"
                          type="number"
                          step="0.01"
                          placeholder="100.00"
                          value={adjustAmount}
                          onChange={(e) => setAdjustAmount(e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor="adjust-reason">Reason</Label>
                        <Textarea
                          id="adjust-reason"
                          placeholder="Customer success credit grant"
                          value={adjustReason}
                          onChange={(e) => setAdjustReason(e.target.value)}
                          rows={3}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <Label htmlFor="adjust-expiring" className="cursor-pointer flex items-center gap-2">
                            {adjustIsExpiring ? (
                              <Clock className="h-4 w-4 text-orange-500" />
                            ) : (
                              <Infinity className="h-4 w-4 text-blue-500" />
                            )}
                            <span className="font-medium">
                              {adjustIsExpiring ? 'Expiring Credits' : 'Non-Expiring Credits'}
                            </span>
                          </Label>
                        </div>
                        <Switch
                          id="adjust-expiring"
                          checked={!adjustIsExpiring}
                          onCheckedChange={(checked) => setAdjustIsExpiring(!checked)}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground -mt-2">
                        {adjustIsExpiring
                          ? 'Credits will expire at the end of the billing cycle'
                          : 'Non-expiring credits remain available until used'}
                      </p>
                      <Button
                        onClick={handleAdjustCredits}
                        disabled={adjustCreditsMutation.isPending}
                        className="w-full"
                      >
                        {adjustCreditsMutation.isPending ? (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                            Applying...
                          </>
                        ) : (
                          'Adjust Credits'
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>

        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
