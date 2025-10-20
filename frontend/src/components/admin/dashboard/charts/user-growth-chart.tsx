"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { subDays, format, startOfDay } from "date-fns"
import { ptBR } from "date-fns/locale"

interface ChartData {
  timestamp: string
  value: number
  label: string
}

interface UserGrowthChartProps {
  period?: string
}

export function UserGrowthChart({ period = "30d" }: UserGrowthChartProps) {
  const [data, setData] = useState<ChartData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = useMemo(() => createClient(), [])

  const fetchChartData = useCallback(async () => {
    try {
      setIsLoading(true)
      
      const days = parseInt(period) || 30
      const startDate = subDays(new Date(), days)
      
      // Buscar todas as contas criadas no período
      const { data: accounts, error } = await supabase
        .from('accounts')
        .select('created_at')
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: true })
      
      if (error) throw error
      
      // Agrupar por dia
      const dailyData: Record<string, number> = {}
      
      // Inicializar todos os dias com 0
      for (let i = 0; i < days; i++) {
        const date = subDays(new Date(), i)
        const dateKey = format(startOfDay(date), 'yyyy-MM-dd')
        dailyData[dateKey] = 0
      }
      
      // Contar usuários por dia
      accounts?.forEach(account => {
        const dateKey = format(new Date(account.created_at), 'yyyy-MM-dd')
        if (dailyData[dateKey] !== undefined) {
          dailyData[dateKey]++
        }
      })
      
      // Converter para formato do gráfico
      const chartData: ChartData[] = Object.entries(dailyData)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, count]) => ({
          timestamp: date,
          value: count,
          label: format(new Date(date), 'dd/MM', { locale: ptBR })
        }))
      
      setData(chartData)
    } catch (error) {
      console.error("Error fetching chart data:", error)
      setData([])
    } finally {
      setIsLoading(false)
    }
  }, [supabase, period])

  useEffect(() => {
    void fetchChartData()
  }, [fetchChartData])

  // Simple bar chart visualization (can be replaced with a proper charting library)
  const maxValue = Math.max(...data.map(d => d.value), 1)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Crescimento de Usuários</CardTitle>
        <CardDescription>
          Novos usuários nos últimos {period}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {/* Simple bar chart */}
            <div className="h-64 flex items-end gap-2">
              {data.slice(-10).map((point, index) => (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-2"
                >
                  <div
                    className="w-full bg-primary/20 hover:bg-primary/30 transition-all duration-200 rounded-t"
                    style={{
                      height: `${(point.value / maxValue) * 100}%`,
                      minHeight: '4px'
                    }}
                    title={`${point.value} usuários`}
                  />
                  <span className="text-xs text-muted-foreground rotate-45 origin-left">
                    {point.label}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Summary */}
            <div className="grid grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-lg font-semibold">
                  {data.reduce((sum, d) => sum + d.value, 0).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Média</p>
                <p className="text-lg font-semibold">
                  {Math.round(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString('pt-BR')}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Pico</p>
                <p className="text-lg font-semibold">
                  {maxValue.toLocaleString('pt-BR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}