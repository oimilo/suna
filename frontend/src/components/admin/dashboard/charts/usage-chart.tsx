"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { subDays, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChartData {
  timestamp: string
  value: number
  label: string
}

interface UsageChartProps {
  period?: string
}

export function UsageChart({ period = "7d" }: UsageChartProps) {
  const [messagesData, setMessagesData] = useState<ChartData[]>([])
  const [threadsData, setThreadsData] = useState<ChartData[]>([])
  const [agentsData, setAgentsData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState("messages")
  const supabase = useMemo(() => createClient(), [])

  const fetchChartData = useCallback(async () => {
    try {
      setIsLoading(true)
      const days = parseInt(period) || 7
      const startDate = subDays(new Date(), days)
      
      if (selectedMetric === "messages") {
        // Buscar mensagens criadas no período
        const { data: messages, error } = await supabase
          .from('messages')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })
        
        if (error) throw error
        
        const chartData = processDataByDay(messages || [], days)
        setMessagesData(chartData)
        
      } else if (selectedMetric === "threads") {
        // Buscar threads criadas no período
        const { data: threads, error } = await supabase
          .from('threads')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })
        
        if (error) throw error
        
        const chartData = processDataByDay(threads || [], days)
        setThreadsData(chartData)
        
      } else if (selectedMetric === "agents") {
        // Buscar agentes criados no período
        const { data: agents, error } = await supabase
          .from('agents')
          .select('created_at')
          .gte('created_at', startDate.toISOString())
          .order('created_at', { ascending: true })
        
        if (error) throw error
        
        const chartData = processDataByDay(agents || [], days)
        setAgentsData(chartData)
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }, [supabase, period, selectedMetric])
  
  useEffect(() => {
    void fetchChartData()
  }, [fetchChartData])
  
  function processDataByDay(items: any[], days: number): ChartData[] {
    const dailyData: Record<string, number> = {}
    
    // Inicializar todos os dias com 0
    for (let i = 0; i < days; i++) {
      const date = subDays(new Date(), i)
      const dateKey = format(startOfDay(date), 'yyyy-MM-dd')
      dailyData[dateKey] = 0
    }
    
    // Contar itens por dia
    items.forEach(item => {
      const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd')
      if (dailyData[dateKey] !== undefined) {
        dailyData[dateKey]++
      }
    })
    
    // Converter para formato do gráfico
    return Object.entries(dailyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({
        timestamp: date,
        value: count,
        label: format(new Date(date), 'dd/MM', { locale: ptBR })
      }))
  }

  const getCurrentData = () => {
    switch (selectedMetric) {
      case "messages": return messagesData
      case "threads": return threadsData
      case "agents": return agentsData
      default: return []
    }
  }

  const currentData = getCurrentData()
  const maxValue = Math.max(...currentData.map((d: ChartData) => d.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Uso</CardTitle>
        <CardDescription>
          Atividade do sistema nos últimos {period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={selectedMetric} onValueChange={setSelectedMetric}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="messages">Mensagens</TabsTrigger>
            <TabsTrigger value="threads">Conversas</TabsTrigger>
            <TabsTrigger value="agents">Agentes</TabsTrigger>
          </TabsList>

          <TabsContent value={selectedMetric} className="mt-4">
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Bar chart */}
                <div className="h-48 flex items-end gap-1">
                  {currentData.map((point: ChartData, index: number) => (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2"
                    >
                      <div
                        className="w-full bg-blue-500/20 hover:bg-blue-500/30 transition-all duration-200 rounded-t"
                        style={{
                          height: `${(point.value / maxValue) * 100}%`,
                          minHeight: '4px'
                        }}
                        title={`${point.value.toLocaleString('pt-BR')}`}
                      />
                      <span className="text-xs text-muted-foreground">
                        {point.label}
                      </span>
                    </div>
                  ))}
                </div>
                
                {/* Summary stats */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                  <div>
                    <p className="text-xs text-muted-foreground">Total</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(
                        currentData.reduce((sum: number, d: ChartData) => sum + d.value, 0),
                        selectedMetric
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(
                        Math.round(currentData.reduce((sum: number, d: ChartData) => sum + d.value, 0) / currentData.length),
                        selectedMetric
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Pico</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(maxValue, selectedMetric)}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}

function formatMetricValue(value: number, metric: string): string {
  if (metric === "credits_used") {
    return value.toFixed(2)
  }
  if (value >= 1000000) {
    return `${(value / 1000000).toFixed(1)}M`
  }
  if (value >= 1000) {
    return `${(value / 1000).toFixed(1)}K`
  }
  return value.toLocaleString('pt-BR')
}