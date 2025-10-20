"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchAdminApi } from "@/lib/api/admin"
import { Loader2, CheckCircle, AlertTriangle, XCircle } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface HealthMetric {
  service_name: string
  status: 'healthy' | 'degraded' | 'down'
  response_time_ms: number | null
  error_rate: number | null
  cpu_usage: number | null
  memory_usage: number | null
  active_connections: number | null
  last_check: string
  metadata: Record<string, any>
}

export function SystemHealth() {
  const [metrics, setMetrics] = useState<HealthMetric[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchHealthMetrics = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetchAdminApi("admin/analytics/system-health", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error("Failed to fetch health metrics")

      const result = await response.json()
      setMetrics(result)
    } catch (error) {
      console.error("Error fetching health metrics:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase])

  useEffect(() => {
    void fetchHealthMetrics()
    const interval = setInterval(fetchHealthMetrics, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [fetchHealthMetrics])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="h-4 w-4 text-emerald-500" />
      case 'degraded':
        return <AlertTriangle className="h-4 w-4 text-amber-500" />
      case 'down':
        return <XCircle className="h-4 w-4 text-red-500" />
      default:
        return null
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return "text-emerald-600 dark:text-emerald-400"
      case 'degraded':
        return "text-amber-600 dark:text-amber-400"
      case 'down':
        return "text-red-600 dark:text-red-400"
      default:
        return "text-muted-foreground"
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {isLoading ? (
        <Card className="col-span-full">
          <CardContent className="flex items-center justify-center h-48">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </CardContent>
        </Card>
      ) : (
        metrics.map((metric) => (
          <Card key={metric.service_name}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{metric.service_name}</CardTitle>
                {getStatusIcon(metric.status)}
              </div>
              <CardDescription className={cn("text-xs", getStatusColor(metric.status))}>
                {metric.status.toUpperCase()}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {metric.response_time_ms !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Latência</span>
                  <span className="font-medium">{metric.response_time_ms}ms</span>
                </div>
              )}
              
              {metric.error_rate !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Taxa de Erro</span>
                  <span className={cn(
                    "font-medium",
                    metric.error_rate > 5 && "text-red-600 dark:text-red-400"
                  )}>
                    {metric.error_rate.toFixed(2)}%
                  </span>
                </div>
              )}
              
              {metric.cpu_usage !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">CPU</span>
                  <span className={cn(
                    "font-medium",
                    metric.cpu_usage > 80 && "text-amber-600 dark:text-amber-400"
                  )}>
                    {metric.cpu_usage.toFixed(1)}%
                  </span>
                </div>
              )}
              
              {metric.memory_usage !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Memória</span>
                  <span className={cn(
                    "font-medium",
                    metric.memory_usage > 80 && "text-amber-600 dark:text-amber-400"
                  )}>
                    {metric.memory_usage.toFixed(1)}%
                  </span>
                </div>
              )}
              
              {metric.active_connections !== null && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Conexões</span>
                  <span className="font-medium">{metric.active_connections}</span>
                </div>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}