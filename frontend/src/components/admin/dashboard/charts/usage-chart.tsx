"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchAdminApi } from "@/lib/api/admin"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

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
  const [tokensData, setTokensData] = useState<ChartData[]>([])
  const [creditsData, setCreditsData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedMetric, setSelectedMetric] = useState("messages_sent")
  const supabase = createClient()

  useEffect(() => {
    fetchChartData()
  }, [period, selectedMetric])

  async function fetchChartData() {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const days = parseInt(period) || 7
      const response = await fetchAdminApi(
        `admin/analytics/charts/usage?metric=${selectedMetric}&days=${days}`,
        {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        }
      )

      if (!response.ok) throw new Error("Failed to fetch chart data")

      const result = await response.json()
      
      if (selectedMetric === "messages_sent") {
        setMessagesData(result.data || [])
      } else if (selectedMetric === "tokens_used") {
        setTokensData(result.data || [])
      } else {
        setCreditsData(result.data || [])
      }
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCurrentData = () => {
    switch (selectedMetric) {
      case "messages_sent": return messagesData
      case "tokens_used": return tokensData
      case "credits_used": return creditsData
      default: return []
    }
  }

  const currentData = getCurrentData()
  const maxValue = Math.max(...currentData.map(d => d.value), 1)

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
            <TabsTrigger value="messages_sent">Mensagens</TabsTrigger>
            <TabsTrigger value="tokens_used">Tokens</TabsTrigger>
            <TabsTrigger value="credits_used">Créditos</TabsTrigger>
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
                  {currentData.map((point, index) => (
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
                        currentData.reduce((sum, d) => sum + d.value, 0),
                        selectedMetric
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Média</p>
                    <p className="text-lg font-semibold">
                      {formatMetricValue(
                        Math.round(currentData.reduce((sum, d) => sum + d.value, 0) / currentData.length),
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