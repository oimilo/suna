"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, TrendingUp, CreditCard, Users } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface BillingStats {
  totalRevenue: number
  activeSubscriptions: number
  churnRate: number
  averageRevenue: number
}

interface Subscription {
  user_id: string
  account_id: string
  email: string
  plan: string
  subscription_status: string | null
  created_at: string
  stripe_subscription_id: string | null
}

interface BillingClientProps {
  initialData: {
    stats: BillingStats
    subscriptions: Subscription[]
  }
}

export default function BillingClient({ initialData }: BillingClientProps) {
  const { stats, subscriptions } = initialData

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy", { locale: ptBR })
    } catch {
      return date
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value)
  }

  const getPlanBadge = (plan: string) => {
    const variants: Record<string, "default" | "secondary" | "outline"> = {
      pro: "default",
      pro_max: "outline"
    }
    
    const labels: Record<string, string> = {
      pro: "Pro",
      pro_max: "Pro Max"
    }
    
    return (
      <Badge variant={variants[plan] || "secondary"}>
        {labels[plan] || plan}
      </Badge>
    )
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      active: "default",
      canceled: "destructive",
      past_due: "destructive",
      trialing: "secondary"
    }
    
    return (
      <Badge variant={variants[status] || "outline"}>
        {status}
      </Badge>
    )
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Billing</h1>
          <p className="text-muted-foreground">
            Gerencie assinaturas e receita
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR (Receita Mensal)</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Receita recorrente mensal
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Clientes pagantes
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Médio</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.averageRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              Por assinatura
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa de Churn</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.churnRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Cancelamentos
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabela de Assinaturas */}
      <Card>
        <CardHeader>
          <CardTitle>Assinaturas Ativas</CardTitle>
          <CardDescription>
            Lista de todas as assinaturas ativas na plataforma
          </CardDescription>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Nenhuma assinatura ativa encontrada</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor Mensal</TableHead>
                  <TableHead>Cliente Desde</TableHead>
                  <TableHead>ID Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={sub.user_id}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                    <TableCell>{getStatusBadge(sub.subscription_status)}</TableCell>
                    <TableCell>
                      {formatCurrency(sub.plan === 'pro' ? 97 : sub.plan === 'pro_max' ? 297 : 0)}
                    </TableCell>
                    <TableCell>{formatDate(sub.created_at)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {sub.stripe_subscription_id ? (
                        <span className="truncate max-w-[150px] inline-block">
                          {sub.stripe_subscription_id}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Resumo por Plano */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Distribuição por Plano</CardTitle>
            <CardDescription>
              Quantidade de assinaturas por tipo de plano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge>Pro</Badge>
                  <span className="text-sm text-muted-foreground">R$ 97/mês</span>
                </div>
                <span className="font-medium">
                  {subscriptions.filter(s => s.plan === 'pro').length} assinaturas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Pro Max</Badge>
                  <span className="text-sm text-muted-foreground">R$ 297/mês</span>
                </div>
                <span className="font-medium">
                  {subscriptions.filter(s => s.plan === 'pro_max').length} assinaturas
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Projeção Anual</CardTitle>
            <CardDescription>
              Estimativa de receita anual recorrente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">ARR (Receita Anual)</span>
                <span className="text-2xl font-bold">
                  {formatCurrency(stats.totalRevenue * 12)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Crescimento necessário (10x)</span>
                <span className="font-medium">
                  {formatCurrency(stats.totalRevenue * 12 * 10)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}