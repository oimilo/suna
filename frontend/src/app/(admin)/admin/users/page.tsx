'use client'

import { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Users, Activity, Sparkles, DoorOpen } from 'lucide-react'
import { AdminUserTable } from '@/components/admin/admin-user-table'
import { AdminUserDetailsDialog } from '@/components/admin/admin-user-details-dialog'
import {
  useAdminUserStats,
  useRefreshUserData,
  type UserSummary,
} from '@/hooks/react-query/admin/use-admin-users'

export default function AdminUsersPage() {
  const [selectedUser, setSelectedUser] = useState<UserSummary | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: stats } = useAdminUserStats()
  const { refreshUserList, refreshUserStats } = useRefreshUserData()

  const handleUserSelect = (user: UserSummary) => {
    setSelectedUser(user)
    setIsDialogOpen(true)
  }

  const handleCloseDialog = () => {
    setIsDialogOpen(false)
    setSelectedUser(null)
  }

  const handleRefresh = () => {
    refreshUserList()
    refreshUserStats()
  }

  const calculateActivityRate = () => {
    if (!stats || stats.total_users === 0) return 0
    return Math.round((stats.active_users_30d / stats.total_users) * 100)
  }

  const paidTierCount =
    stats?.tier_distribution
      ?.filter((tier) => tier.tier !== 'free')
      .reduce((acc, tier) => acc + tier.count, 0) ?? 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="max-w-5xl mx-auto p-6 space-y-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Diretório de Usuários
            </h1>
            <p className="text-md text-muted-foreground mt-2">
              Explore contas, assinaturas e engajamento dos usuários da plataforma.
            </p>
          </div>
        </div>

        {stats && (
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-full">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Usuários totais
                  </p>
                  <p className="text-lg font-semibold">{stats.total_users}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-950/40 rounded-full">
                  <Activity className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Ativos (30d)
                  </p>
                  <p className="text-lg font-semibold">
                    {stats.active_users_30d}
                  </p>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 bg-white/80 shadow-sm dark:bg-black/40">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/40 rounded-full">
                  <DoorOpen className="h-5 w-5 text-blue-500" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide">
                    Taxa de atividade
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
                    Tiers pagos
                  </p>
                  <p className="text-lg font-semibold">{paidTierCount}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <Card className="border-none shadow-md bg-white/90 dark:bg-black/40">
          <CardContent className="p-0">
            <AdminUserTable onUserSelect={handleUserSelect} />
          </CardContent>
        </Card>

        <AdminUserDetailsDialog
          user={selectedUser}
          isOpen={isDialogOpen}
          onClose={handleCloseDialog}
          onRefresh={handleRefresh}
        />
      </div>
    </div>
  )
}
