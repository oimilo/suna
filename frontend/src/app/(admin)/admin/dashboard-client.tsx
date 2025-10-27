"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Activity,
  AlertTriangle,
  Bot,
  DollarSign,
  GaugeCircle,
  MessageSquare,
  Server,
  TrendingUp,
  Users,
} from "lucide-react"
import type { AnalyticsData } from "@/app/(admin)/admin/analytics/analytics-server"
import type { DashboardInitialData } from "./dashboard-server"

const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 2,
})

const numberFormatter = new Intl.NumberFormat("en-US")

const fallbackUserMetrics: AnalyticsData["userMetrics"] = {
  totalUsers: 0,
  activeUsers: 0,
  newUsersToday: 0,
  newUsersThisWeek: 0,
  newUsersThisMonth: 0,
  userGrowthData: [],
}

const fallbackConversationMetrics: AnalyticsData["conversationMetrics"] = {
  totalThreads: 0,
  totalMessages: 0,
  messagesToday: 0,
  averageMessagesPerThread: 0,
  messageVolumeByHour: [],
  messageGrowthData: [],
}

const fallbackRevenueMetrics: AnalyticsData["revenueMetrics"] = {
  mrr: 0,
  arr: 0,
  totalRevenue: 0,
  averageRevenuePerUser: 0,
  conversionRate: 0,
  churnRate: 0,
  lifetimeValue: 0,
  revenueGrowthData: [],
}

const fallbackPerformanceMetrics: AnalyticsData["performanceMetrics"] = {
  totalAgentRuns: 0,
  successfulRuns: 0,
  failedRuns: 0,
  averageRunDuration: 0,
  errorRate: 0,
  commonErrors: [],
}

export default function DashboardClient({ initialData }: { initialData: DashboardInitialData }) {
  const { analytics, recentUsers } = initialData

  const userMetrics = analytics.userMetrics ?? fallbackUserMetrics
  const conversationMetrics = analytics.conversationMetrics ?? fallbackConversationMetrics
  const revenueMetrics = analytics.revenueMetrics ?? fallbackRevenueMetrics
  const performanceMetrics = analytics.performanceMetrics ?? fallbackPerformanceMetrics
  const agentMetrics = analytics.agentMetrics ?? { totalAgents: 0, averageAgentsPerUser: 0, agentsThisWeek: 0, agentUsageData: [], popularAgentTypes: [] }
  const systemHealth = analytics.systemHealth ?? []
  const recentActivity = analytics.recentActivity ?? []

  const activePercentage =
    userMetrics.totalUsers > 0
      ? ((userMetrics.activeUsers / userMetrics.totalUsers) * 100).toFixed(1)
      : "0.0"

  const effectiveConversionRate =
    typeof revenueMetrics.conversionRate === "number" && revenueMetrics.conversionRate > 0
      ? revenueMetrics.conversionRate
      : 0

  const getHealthBadge = (status: string | undefined) => {
    switch (status) {
      case "healthy":
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Saudável</Badge>
      case "degraded":
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Degradado</Badge>
      case "down":
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Offline</Badge>
      default:
        return <Badge className="bg-gray-500/10 text-gray-600 dark:text-gray-300 border-gray-500/20">Desconhecido</Badge>
    }
  }

  return (
    <div className="flex-1 space-y-6 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Administrativo</h1>
          <p className="text-muted-foreground">
            Visão consolidada das métricas e da saúde da plataforma
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(userMetrics.totalUsers)}</div>
            <p className="text-xs text-muted-foreground">
              +{numberFormatter.format(userMetrics.newUsersToday)} hoje
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários ativos (7d)</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(userMetrics.activeUsers)}</div>
            <p className="text-xs text-muted-foreground">{activePercentage}% da base</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mensagens (24h)</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberFormatter.format(conversationMetrics.messagesToday ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {numberFormatter.format(conversationMetrics.totalMessages)} no total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR estimado</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(revenueMetrics.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Conversão: {effectiveConversionRate.toFixed(1)}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Agentes ativos</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{numberFormatter.format(agentMetrics.totalAgents || 0)}</div>
            <p className="text-xs text-muted-foreground">
              Média {(agentMetrics.averageAgentsPerUser ?? 0).toFixed(1)} por usuário
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Execuções de agente</CardTitle>
            <GaugeCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {numberFormatter.format(performanceMetrics.totalAgentRuns || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Falhas: {numberFormatter.format(performanceMetrics.failedRuns || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(performanceMetrics.errorRate || 0).toFixed(2)}%</div>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ARR estimado</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{currencyFormatter.format(revenueMetrics.arr || 0)}</div>
            <p className="text-xs text-muted-foreground">
              LTV médio: {currencyFormatter.format(revenueMetrics.lifetimeValue || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Usuários recentes</CardTitle>
            <CardDescription>Últimos perfis verificados no sistema</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentUsers.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Nenhum usuário recente encontrado.
              </p>
            )}
            {recentUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{user.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Criado em {user.created_at ? new Date(user.created_at).toLocaleString() : "—"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {user.tier && (
                    <Badge variant="outline" className="capitalize">
                      {user.tier.replace(/_/g, " ")}
                    </Badge>
                  )}
                  <Badge variant="secondary">
                    {currencyFormatter.format(user.credit_balance ?? 0)}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Saúde do sistema</CardTitle>
            <CardDescription>Status dos principais serviços monitorados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.length === 0 && (
              <p className="text-sm text-muted-foreground text-center">
                Sem dados de monitoramento disponíveis.
              </p>
            )}
            {systemHealth.map((service) => (
              <div key={service.service} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{service.service}</p>
                    <p className="text-xs text-muted-foreground">
                      Latência: {service.responseTimeMs ? `${service.responseTimeMs}ms` : "—"}
                    </p>
                  </div>
                </div>
                {getHealthBadge(service.status)}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Atividade financeira recente</CardTitle>
          <CardDescription>Últimos lançamentos no ledger de créditos</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {recentActivity.length === 0 && (
            <p className="text-sm text-muted-foreground text-center">
              Nenhuma atividade registrada.
            </p>
          )}
          {recentActivity.map((entry) => (
            <div key={entry.id || entry.created_at} className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium">{entry.action || "Movimentação"}</p>
                <p className="text-xs text-muted-foreground">
                  {entry.created_at ? new Date(entry.created_at).toLocaleString() : "Data desconhecida"}
                </p>
              </div>
              <Badge
                variant={(entry.amount ?? 0) >= 0 ? "secondary" : "destructive"}
                className="font-mono"
              >
                {(entry.amount ?? 0) >= 0 ? "+" : ""}
                {currencyFormatter.format(entry.amount ?? 0)}
              </Badge>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}
