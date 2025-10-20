"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Activity, Database, Server, Shield, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react"
import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"

interface SystemHealth {
  api_status: 'healthy' | 'degraded' | 'down'
  database_status: 'healthy' | 'degraded' | 'down'
  redis_status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number
  error_rate: number
  uptime_percentage: number
  last_incident?: {
    timestamp: string
    description: string
    resolved: boolean
  }
}

export default function AdminSystemPage() {
  const [health, setHealth] = useState<SystemHealth | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()
  const supabase = useMemo(() => createClient(), [])

  const checkSystemHealth = useCallback(async () => {
    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada",
          variant: "destructive"
        })
        return
      }

      // Simular dados de saúde do sistema enquanto o endpoint não existe
      // TODO: Implementar endpoint real /admin/system/health no backend
      const mockHealth: SystemHealth = {
        api_status: 'healthy',
        database_status: 'healthy',
        redis_status: 'healthy',
        response_time_ms: Math.floor(Math.random() * 100) + 50,
        error_rate: Math.random() * 2,
        uptime_percentage: 99.9,
        last_incident: undefined
      }
      
      // Simular delay de rede
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setHealth(mockHealth)
      
    } catch (error) {
      console.error("Error checking system health:", error)
      toast({
        title: "Erro",
        description: "Erro ao verificar saúde do sistema",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }, [supabase, toast])

  useEffect(() => {
    void checkSystemHealth()
    const interval = setInterval(checkSystemHealth, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [checkSystemHealth])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'healthy':
        return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Saudável</Badge>
      case 'degraded':
        return <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">Degradado</Badge>
      case 'down':
        return <Badge className="bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20">Offline</Badge>
      default:
        return <Badge className="bg-gray-500 text-white hover:bg-gray-600">Desconhecido</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento e saúde do sistema
          </p>
        </div>
        <Button onClick={checkSystemHealth} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          Atualizar
        </Button>
      </div>

      {/* System Status */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">API</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health ? getStatusBadge(health.api_status) : <Badge className="bg-gray-500 text-white animate-pulse">Carregando...</Badge>}
            </div>
            {health && (
              <p className="text-xs text-muted-foreground mt-2">
                Tempo de resposta: {health.response_time_ms}ms
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Banco de Dados</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health ? getStatusBadge(health.database_status) : <Badge className="bg-gray-500 text-white animate-pulse">Carregando...</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              PostgreSQL via Supabase
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cache</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              {health ? getStatusBadge(health.redis_status) : <Badge className="bg-gray-500 text-white animate-pulse">Carregando...</Badge>}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Redis via Upstash
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? `${health.uptime_percentage}%` : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimos 30 dias
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Erro</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? `${health.error_rate.toFixed(2)}%` : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              Últimas 24 horas
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência Média</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health ? `${health.response_time_ms}ms` : '...'}
            </div>
            <p className="text-xs text-muted-foreground">
              P50 das requisições
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Segurança</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              OK
            </div>
            <p className="text-xs text-muted-foreground">
              Sem incidentes
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Incidents */}
      <Card>
        <CardHeader>
          <CardTitle>Incidentes Recentes</CardTitle>
          <CardDescription>
            Últimos incidentes e manutenções do sistema
          </CardDescription>
        </CardHeader>
        <CardContent>
          {health?.last_incident ? (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
              <div className={`p-1.5 rounded ${health.last_incident.resolved ? 'bg-emerald-500/10' : 'bg-red-500/10'}`}>
                {health.last_incident.resolved ? (
                  <CheckCircle className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-600 dark:text-red-400" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{health.last_incident.description}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(health.last_incident.timestamp).toLocaleString('pt-BR')}
                </p>
              </div>
              <Badge className={health.last_incident.resolved ? "bg-gray-500 text-white hover:bg-gray-600" : "bg-red-500 text-white hover:bg-red-600"}>
                {health.last_incident.resolved ? "Resolvido" : "Em andamento"}
              </Badge>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum incidente registrado
            </div>
          )}
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações de Sistema</CardTitle>
          <CardDescription>
            Ferramentas administrativas e manutenção
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-2 md:grid-cols-2 lg:grid-cols-4">
          <Button variant="outline">Limpar Cache</Button>
          <Button variant="outline">Reiniciar Workers</Button>
          <Button variant="outline">Backup Manual</Button>
          <Button variant="outline">Ver Logs</Button>
        </CardContent>
      </Card>
    </div>
  )
}
