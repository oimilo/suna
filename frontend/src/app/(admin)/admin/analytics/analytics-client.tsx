"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Download, RefreshCw, TrendingUp, TrendingDown, Activity, Users, Bot, MessageSquare, Zap, AlertTriangle, CheckCircle, Clock, DollarSign } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useRouter } from "next/navigation"
import type { AnalyticsData } from "./analytics-server"

interface AnalyticsClientProps {
  initialData: AnalyticsData
  initialPeriod: string
}

export function AnalyticsClient({ initialData, initialPeriod }: AnalyticsClientProps) {
  const [period, setPeriod] = useState(initialPeriod)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const router = useRouter()
  
  const handlePeriodChange = (newPeriod: string) => {
    setPeriod(newPeriod)
    router.push(`/admin/analytics?period=${newPeriod}`)
  }
  
  const handleRefresh = () => {
    setIsRefreshing(true)
    router.refresh()
    setTimeout(() => setIsRefreshing(false), 1000)
  }
  
  const exportData = () => {
    const dataStr = JSON.stringify(initialData, null, 2)
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr)
    const exportFileDefaultName = `analytics-${format(new Date(), 'yyyy-MM-dd')}.json`
    
    const linkElement = document.createElement('a')
    linkElement.setAttribute('href', dataUri)
    linkElement.setAttribute('download', exportFileDefaultName)
    linkElement.click()
  }
  
  // Helper function to render metric cards
  const MetricCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change !== undefined && (
          <div className="flex items-center gap-1 text-xs">
            {trend === 'up' ? (
              <TrendingUp className="h-3 w-3 text-emerald-500" />
            ) : trend === 'down' ? (
              <TrendingDown className="h-3 w-3 text-red-500" />
            ) : (
              <Activity className="h-3 w-3 text-amber-500" />
            )}
            <span className={
              trend === 'up' ? 'text-emerald-600 dark:text-emerald-400' :
              trend === 'down' ? 'text-red-600 dark:text-red-400' :
              'text-amber-600 dark:text-amber-400'
            }>
              {change}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  )
  
  // Simple chart component
  const SimpleBarChart = ({ data, label, color = "blue" }: any) => {
    const maxValue = Math.max(...data.map((d: any) => d.count || d.value || 0), 1)
    
    return (
      <div className="space-y-2">
        <div className="h-40 flex items-end gap-1">
          {data.slice(-20).map((point: any, index: number) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
              title={`${point.date || point.label || ''}: ${point.count || point.value || 0}`}
            >
              <div
                className={`w-full bg-${color}-500/20 hover:bg-${color}-500/30 transition-all duration-200 rounded-t`}
                style={{
                  height: `${((point.count || point.value || 0) / maxValue) * 100}%`,
                  minHeight: '2px',
                  backgroundColor: color === 'emerald' ? 'rgb(16 185 129 / 0.2)' :
                                   color === 'blue' ? 'rgb(59 130 246 / 0.2)' :
                                   color === 'amber' ? 'rgb(245 158 11 / 0.2)' :
                                   'rgb(107 114 128 / 0.2)'
                }}
              />
            </div>
          ))}
        </div>
        {label && (
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{data[0]?.date ? format(new Date(data[0].date), 'dd/MM', { locale: ptBR }) : ''}</span>
            <span>{data[data.length - 1]?.date ? format(new Date(data[data.length - 1].date), 'dd/MM', { locale: ptBR }) : ''}</span>
          </div>
        )}
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">
            Análise detalhada de métricas e tendências
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={period} onValueChange={handlePeriodChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">7 dias</SelectItem>
              <SelectItem value="30d">30 dias</SelectItem>
              <SelectItem value="90d">90 dias</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="icon" onClick={handleRefresh} disabled={isRefreshing}>
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
          <Button onClick={exportData}>
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Key Metrics Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total de Usuários"
          value={initialData.userMetrics.totalUsers}
          change={`+${initialData.userMetrics.newUsersThisWeek} esta semana`}
          icon={Users}
          trend="up"
        />
        <MetricCard
          title="Projetos Ativos"
          value={initialData.projectMetrics.totalProjects}
          change={`+${initialData.projectMetrics.projectsThisWeek} esta semana`}
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="Agentes Criados"
          value={initialData.agentMetrics.totalAgents}
          change={`+${initialData.agentMetrics.agentsThisWeek} esta semana`}
          icon={Bot}
          trend="up"
        />
        <MetricCard
          title="MRR"
          value={`R$ ${initialData.revenueMetrics.mrr.toFixed(2)}`}
          change={`${Math.round(initialData.revenueMetrics.mrr / 99)} assinaturas ativas`}
          icon={DollarSign}
          trend="up"
        />
      </div>

      {/* Detailed Tabs */}
      <Tabs defaultValue="growth" className="space-y-4">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="growth">Crescimento</TabsTrigger>
          <TabsTrigger value="usage">Uso</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="errors">Erros</TabsTrigger>
          <TabsTrigger value="revenue">Receita</TabsTrigger>
        </TabsList>

        {/* Growth Tab */}
        <TabsContent value="growth" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Crescimento de Usuários</CardTitle>
              <CardDescription>
                Novos usuários nos últimos {period}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SimpleBarChart 
                data={initialData.userMetrics.userGrowthData} 
                label="Usuários"
                color="emerald"
              />
              <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t">
                <div>
                  <p className="text-xs text-muted-foreground">Hoje</p>
                  <p className="text-lg font-semibold">+{initialData.userMetrics.newUsersToday}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Esta Semana</p>
                  <p className="text-lg font-semibold">+{initialData.userMetrics.newUsersThisWeek}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Este Mês</p>
                  <p className="text-lg font-semibold">+{initialData.userMetrics.newUsersThisMonth}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Taxa de Conversão</CardTitle>
                <CardDescription>Free → Pro</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {initialData.revenueMetrics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {Math.round(initialData.revenueMetrics.mrr / 99)} de {initialData.userMetrics.totalUsers} usuários
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Usuários Ativos</CardTitle>
                <CardDescription>Últimos 7 dias</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {initialData.userMetrics.activeUsers}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  {((initialData.userMetrics.activeUsers / initialData.userMetrics.totalUsers) * 100).toFixed(1)}% do total
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Usage Tab */}
        <TabsContent value="usage" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Projetos Criados</CardTitle>
                <CardDescription>Crescimento de projetos ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={initialData.projectMetrics.projectGrowthData} 
                  label="Projetos"
                  color="blue"
                />
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Média por usuário: {initialData.projectMetrics.averageProjectsPerUser.toFixed(1)}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Volume de Mensagens</CardTitle>
                <CardDescription>Mensagens enviadas ao longo do tempo</CardDescription>
              </CardHeader>
              <CardContent>
                <SimpleBarChart 
                  data={initialData.conversationMetrics.messageGrowthData} 
                  label="Mensagens"
                  color="amber"
                />
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Total: {initialData.conversationMetrics.totalMessages.toLocaleString('pt-BR')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Top Projetos</CardTitle>
              <CardDescription>Projetos mais ativos por número de mensagens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialData.projectMetrics.topProjects.map((project, index) => (
                  <div key={project.id} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="font-medium">{project.name}</span>
                    </div>
                    <Badge className="bg-gray-500 text-white hover:bg-gray-600">
                      {project.messageCount} mensagens
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Automações</CardTitle>
              <CardDescription>Triggers e execuções automatizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span className="text-sm font-medium">Triggers Ativos</span>
                  </div>
                  <p className="text-2xl font-bold">{initialData.automationMetrics.activeTriggers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    de {initialData.automationMetrics.totalTriggers} total
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-4 w-4 text-blue-500" />
                    <span className="text-sm font-medium">Webhooks</span>
                  </div>
                  <p className="text-2xl font-bold">{initialData.automationMetrics.webhookTriggers}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    configurados
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Sucesso</CardTitle>
                <CheckCircle className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.performanceMetrics.totalAgentRuns > 0 
                    ? ((initialData.performanceMetrics.successfulRuns / initialData.performanceMetrics.totalAgentRuns) * 100).toFixed(1)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {initialData.performanceMetrics.successfulRuns} de {initialData.performanceMetrics.totalAgentRuns} execuções
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tempo Médio</CardTitle>
                <Clock className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.performanceMetrics.averageRunDuration.toFixed(1)}s
                </div>
                <p className="text-xs text-muted-foreground">
                  por execução
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.performanceMetrics.errorRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {initialData.performanceMetrics.failedRuns} falhas
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Uso de Ferramentas</CardTitle>
              <CardDescription>Ferramentas mais utilizadas e suas taxas de sucesso</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {initialData.toolUsageData.slice(0, 5).map((tool) => (
                  <div key={tool.tool} className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{tool.tool}</span>
                      <Badge variant="outline">{tool.count} chamadas</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-emerald-500"
                          style={{ width: `${Math.min(100, (tool.avgDuration / 10) * 100)}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {tool.avgDuration.toFixed(1)}s
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Padrões de Uso por Hora</CardTitle>
              <CardDescription>Quando os usuários estão mais ativos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-40 flex items-end gap-1">
                {initialData.conversationMetrics.messageVolumeByHour.map((hour) => {
                  const maxHourValue = Math.max(...initialData.conversationMetrics.messageVolumeByHour.map(h => h.count))
                  return (
                    <div
                      key={hour.hour}
                      className="flex-1 flex flex-col items-center gap-1"
                      title={`${hour.hour}:00 - ${hour.count} mensagens`}
                    >
                      <div
                        className="w-full bg-blue-500/20 hover:bg-blue-500/30 transition-all duration-200 rounded-t"
                        style={{
                          height: `${(hour.count / maxHourValue) * 100}%`,
                          minHeight: '2px'
                        }}
                      />
                      <span className="text-xs text-muted-foreground">
                        {hour.hour}
                      </span>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Agentes Mais Usados</CardTitle>
                <CardDescription>Por número de mensagens</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {initialData.agentMetrics.agentUsageData.slice(0, 5).map((agent) => (
                    <div key={agent.agentId} className="flex items-center justify-between">
                      <span className="text-sm truncate">{agent.name}</span>
                      <Badge variant="outline">{agent.usageCount}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tipos de Agentes</CardTitle>
                <CardDescription>Distribuição por categoria</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {initialData.agentMetrics.popularAgentTypes.map((type) => (
                    <div key={type.type} className="flex items-center justify-between">
                      <span className="text-sm capitalize">{type.type}</span>
                      <Badge variant="outline">{type.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Conversação</CardTitle>
              <CardDescription>Estatísticas de threads e mensagens</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{initialData.conversationMetrics.totalThreads}</p>
                  <p className="text-xs text-muted-foreground">Conversas Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{initialData.conversationMetrics.totalMessages}</p>
                  <p className="text-xs text-muted-foreground">Mensagens Total</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">{initialData.conversationMetrics.averageMessagesPerThread.toFixed(1)}</p>
                  <p className="text-xs text-muted-foreground">Média por Conversa</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Erros Comuns</CardTitle>
              <CardDescription>Erros mais frequentes nas execuções</CardDescription>
            </CardHeader>
            <CardContent>
              {initialData.performanceMetrics.commonErrors.length > 0 ? (
                <div className="space-y-3">
                  {initialData.performanceMetrics.commonErrors.map((error, index) => (
                    <div key={index} className="p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium text-red-600 dark:text-red-400">
                          {error.error.substring(0, 100)}...
                        </span>
                        <Badge className="bg-red-500 text-white hover:bg-red-600">
                          {error.count} ocorrências
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhum erro registrado no período
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Ferramentas com Falhas</CardTitle>
              <CardDescription>Tools que mais apresentaram erros</CardDescription>
            </CardHeader>
            <CardContent>
              {initialData.errors.length > 0 ? (
                <div className="space-y-3">
                  {initialData.errors.slice(0, 5).map((error) => (
                    <div key={error.timestamp} className="flex items-center justify-between p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                      <span className="text-sm font-medium">{error.error}</span>
                      <Badge className="bg-amber-500 text-white hover:bg-amber-600">
                        {error.count} ocorrências
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma falha de ferramenta registrada
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Execuções com Falha</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialData.performanceMetrics.failedRuns}</div>
                <p className="text-xs text-muted-foreground">
                  nos últimos {period}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Erro Geral</CardTitle>
                <Activity className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.performanceMetrics.errorRate.toFixed(2)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  de todas as execuções
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Tools com Problemas</CardTitle>
                <Zap className="h-4 w-4 text-amber-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{initialData.errors.length}</div>
                <p className="text-xs text-muted-foreground">
                  ferramentas com falhas
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">MRR</CardTitle>
                <DollarSign className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  R$ {initialData.revenueMetrics.mrr.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Receita mensal recorrente
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Assinaturas</CardTitle>
                <Users className="h-4 w-4 text-blue-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(initialData.revenueMetrics.mrr / 99)}
                </div>
                <p className="text-xs text-muted-foreground">
                  usuários pagantes
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Taxa de Conversão</CardTitle>
                <TrendingUp className="h-4 w-4 text-emerald-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.revenueMetrics.conversionRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  free → pro
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Churn Rate</CardTitle>
                <TrendingDown className="h-4 w-4 text-red-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {initialData.revenueMetrics.churnRate.toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  últimos 30 dias
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Projeção Anual</CardTitle>
              <CardDescription>Estimativas baseadas no MRR atual</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <span className="text-sm font-medium">ARR (Receita Anual)</span>
                  <span className="text-xl font-bold">R$ {(initialData.revenueMetrics.mrr * 12).toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
                  <span className="text-sm font-medium">Meta 10x (Crescimento)</span>
                  <span className="text-xl font-bold">R$ {(initialData.revenueMetrics.mrr * 12 * 10).toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usuários em Trial</CardTitle>
              <CardDescription>Potencial de conversão</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{initialData.revenueMetrics.trialUsers}</div>
              <p className="text-xs text-muted-foreground mt-2">
                Potencial MRR adicional: R$ {(initialData.revenueMetrics.trialUsers * 97).toFixed(2)}
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}