"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { Activity, AlertTriangle, RefreshCw, Server } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { backendApi } from "@/lib/api-client"
import { useToast } from "@/components/ui/use-toast"

interface SystemHealthRecord {
  service_name?: string
  service?: string
  status?: "healthy" | "degraded" | "down"
  response_time_ms?: number | null
  error_rate?: number | null
  metadata?: Record<string, unknown>
  last_check?: string
}

const numberFormatter = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 })

export default function AdminSystemPage() {
  const [records, setRecords] = useState<SystemHealthRecord[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const { toast } = useToast()

  const refreshHealth = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await backendApi.get<SystemHealthRecord[]>("/admin/analytics/system-health")
      if (response.success && Array.isArray(response.data)) {
        setRecords(response.data)
      } else {
        throw new Error(response.error?.message ?? "Erro desconhecido")
      }
    } catch (error) {
      console.error("Erro ao consultar saúde do sistema:", error)
      toast({
        title: "Não foi possível atualizar",
        description: "Verifique sua conexão ou tente novamente em instantes.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [toast])

  useEffect(() => {
    void refreshHealth()
    const interval = setInterval(refreshHealth, 30000)
    return () => clearInterval(interval)
  }, [refreshHealth])

  const summary = useMemo(() => {
    if (!records.length) {
      return {
        services: 0,
        degraded: 0,
        avgLatency: 0,
        avgErrorRate: 0,
      }
    }

    const healthyMetrics = records.filter((record) => typeof record.response_time_ms === "number")
    const avgLatency =
      healthyMetrics.reduce((acc, record) => acc + (record.response_time_ms ?? 0), 0) /
      (healthyMetrics.length || 1)

    const errorMetrics = records.filter((record) => typeof record.error_rate === "number")
    const avgErrorRate =
      errorMetrics.reduce((acc, record) => acc + (record.error_rate ?? 0), 0) /
      (errorMetrics.length || 1)

    const degraded = records.filter((record) => record.status === "degraded" || record.status === "down").length

    return {
      services: records.length,
      degraded,
      avgLatency,
      avgErrorRate,
    }
  }, [records])

  const getStatusBadge = (status: string | undefined) => {
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sistema</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo quase real dos serviços críticos
          </p>
        </div>
        <Button onClick={refreshHealth} disabled={isLoading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços monitorados</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.services}</div>
            <p className="text-xs text-muted-foreground">Cobertura de monitoramento atual</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Latência média</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.services ? `${numberFormatter.format(summary.avgLatency)}ms` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Média ponderada entre serviços</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de erro média</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.services ? `${numberFormatter.format(summary.avgErrorRate)}%` : "—"}
            </div>
            <p className="text-xs text-muted-foreground">Nas últimas consultas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Serviços degradados</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.degraded}</div>
            <p className="text-xs text-muted-foreground">Inclui status degraded e down</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status por serviço</CardTitle>
          <CardDescription>
            Detalhes do último healthcheck executado pelo backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {records.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-6">
              Nenhum dado disponível no momento.
            </p>
          )}
          {records.map((record) => {
            const label = record.service ?? record.service_name ?? "Serviço"
            return (
              <div
                key={label}
                className="flex items-center justify-between rounded-lg border border-black/5 dark:border-white/10 bg-black/[0.02] dark:bg-white/[0.03] p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-black/[0.04] dark:bg-white/[0.06] border border-black/5 dark:border-white/10 flex items-center justify-center">
                    <Server className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">
                      Latência: {typeof record.response_time_ms === "number" ? `${record.response_time_ms}ms` : "—"} ·
                      Erro: {typeof record.error_rate === "number" ? `${numberFormatter.format(record.error_rate)}%` : "—"}
                    </p>
                    {record.metadata && Object.keys(record.metadata).length > 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {Object.entries(record.metadata)
                          .map(([key, value]) => `${key}: ${value}`)
                          .join(" · ")}
                      </p>
                    )}
                  </div>
                </div>
                {getStatusBadge(record.status)}
              </div>
            )
          })}
        </CardContent>
      </Card>
    </div>
  )
}
