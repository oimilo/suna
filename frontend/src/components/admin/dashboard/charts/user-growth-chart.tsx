"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { fetchAdminApi } from "@/lib/api/admin"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

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
  const supabase = createClient()

  useEffect(() => {
    fetchChartData()
  }, [period])

  async function fetchChartData() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const days = parseInt(period) || 30
      
      console.log('Fetching chart data with token:', session.access_token ? 'Token exists' : 'No token')
      
      const response = await fetchAdminApi(`admin/analytics/charts/user-growth?days=${days}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        console.error('Chart fetch failed:', response.status, response.statusText)
        throw new Error("Failed to fetch chart data")
      }

      const result = await response.json()
      setData(result.data || [])
    } catch (error) {
      console.error("Error fetching chart data:", error)
    } finally {
      setIsLoading(false)
    }
  }

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