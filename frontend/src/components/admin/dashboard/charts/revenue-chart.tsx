"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface BillingStats {
  mrr: number
  arr: number
  total_revenue: number
  active_subscriptions: number
  trial_users: number
  paying_users: number
  churn_rate: number
  average_revenue_per_user: number
  lifetime_value: number
  conversion_rate: number
}

export function RevenueChart() {
  const [stats, setStats] = useState<BillingStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchBillingStats()
  }, [])

  async function fetchBillingStats() {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) return

      const response = await fetch("/api/admin/analytics/billing", {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) throw new Error("Failed to fetch billing data")

      const result = await response.json()
      setStats(result)
    } catch (error) {
      console.error("Error fetching billing stats:", error)
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Receita</CardTitle>
          <CardDescription>Análise financeira e faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!stats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Métricas de Receita</CardTitle>
          <CardDescription>Análise financeira e faturamento</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">Nenhum dado disponível</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* MRR/ARR Card */}
      <Card>
        <CardHeader>
          <CardTitle>Receita Recorrente</CardTitle>
          <CardDescription>MRR e ARR atual</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground">MRR (Mensal)</p>
            <p className="text-3xl font-bold">
              {formatCurrency(stats.mrr)}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">ARR (Anual)</p>
            <p className="text-2xl font-semibold">
              {formatCurrency(stats.arr)}
            </p>
          </div>
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Receita Total</p>
            <p className="text-xl font-semibold">
              {formatCurrency(stats.total_revenue)}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Subscriptions Card */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas</CardTitle>
          <CardDescription>Status de usuários e conversão</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Pagantes</p>
              <p className="text-2xl font-bold">{stats.paying_users}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Trial</p>
              <p className="text-2xl font-bold">{stats.trial_users}</p>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Taxa de Conversão</span>
              <span className="text-sm font-medium">
                {stats.conversion_rate.toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Churn Rate</span>
              <span className="text-sm font-medium">
                {(stats.churn_rate * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">ARPU</span>
              <span className="text-sm font-medium">
                {formatCurrency(stats.average_revenue_per_user)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">LTV</span>
              <span className="text-sm font-medium">
                {formatCurrency(stats.lifetime_value)}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value)
}