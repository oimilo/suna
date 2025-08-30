"use client"

import { useEffect, useState } from "react"
import { StatsCards } from "@/components/admin/dashboard/stats-cards"
import { UserGrowthChart } from "@/components/admin/dashboard/charts/user-growth-chart"
import { UsageChart } from "@/components/admin/dashboard/charts/usage-chart"
import { RevenueChart } from "@/components/admin/dashboard/charts/revenue-chart"
import { ActivityFeed } from "@/components/admin/dashboard/activity-feed"
import { SystemHealth } from "@/components/admin/dashboard/system-health"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { fetchAdminApi } from "@/lib/api/admin"

interface DashboardData {
  users: {
    total: number
    active_today: number
    active_week: number
    growth_rate: number
  }
  usage: {
    messages_today: number
    tokens_today: number
    credits_today: number
    avg_messages_per_user: number
  }
  revenue: {
    mrr: number
    arr: number
    active_subscriptions: number
    trial_users: number
  }
  system: {
    api_status: string
    database_status: string
    redis_status: string
    error_rate: number
  }
  recent_activity: Array<{
    id: string
    action: string
    timestamp: string
    admin_id: string
  }>
}

export default function AdminDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState("7d")
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchDashboardData()
  }, [])

  async function fetchDashboardData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive"
        })
        return
      }

      const response = await fetchAdminApi('admin/analytics/dashboard', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch dashboard data")
      }

      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar dados do dashboard",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">Nenhum dado disponível</p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard Administrativo</h1>
        <p className="text-muted-foreground">
          Visão geral do sistema e métricas principais
        </p>
      </div>

      {/* Stats Cards */}
      <StatsCards data={dashboardData} />

      {/* Charts */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList>
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-4">
          <UserGrowthChart period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="usage" className="space-y-4">
          <UsageChart period={selectedPeriod} />
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <RevenueChart />
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <SystemHealth />
        </TabsContent>
      </Tabs>

      {/* Activity Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ActivityFeed activities={dashboardData.recent_activity} />
        </div>
        <div>
          {/* Quick Actions */}
          <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-4">
            <h3 className="text-sm font-medium mb-4">Ações Rápidas</h3>
            <div className="space-y-2">
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
                Criar novo admin
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
                Exportar relatório
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
                Limpar cache
              </button>
              <button className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200">
                Ver logs do sistema
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}