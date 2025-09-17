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
  uniquePayingUsers: number
  churnRate: number
  averageRevenue: number
  totalUsers: number
  conversionRate: number
}

interface Subscription {
  user_id: string
  account_id: string
  email: string
  account_name: string
  plan: string
  subscription_status: string | null
  created_at: string
  subscription_created: string
  stripe_subscription_id: string | null
  amount: number
  interval: string
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
    // Mapear planos para classes personalizadas com melhor contraste
    const getClassName = (plan: string) => {
      switch(plan) {
        case 'pro':
          return "bg-blue-500 text-white hover:bg-blue-600"
        case 'pro_max':
          return "bg-purple-500 text-white hover:bg-purple-600"
        case 'custom':
        case 'Personalizado':
          return "bg-emerald-500 text-white hover:bg-emerald-600"
        case 'free':
          return "bg-gray-500 text-white hover:bg-gray-600"
        default:
          return "bg-zinc-600 text-white hover:bg-zinc-700"
      }
    }
    
    const labels: Record<string, string> = {
      pro: "Pro",
      pro_max: "Pro Max",
      custom: "Personalizado",
      Personalizado: "Personalizado",
      free: "Free"
    }
    
    return (
      <Badge className={getClassName(plan)}>
        {labels[plan] || plan}
      </Badge>
    )
  }

  const getStatusBadge = (status: string | null) => {
    if (!status) return null
    
    // Usar classes personalizadas para melhor contraste
    const getClassName = (status: string) => {
      switch(status) {
        case 'active':
          return "bg-green-500 text-white hover:bg-green-600"
        case 'canceled':
          return "bg-red-500 text-white hover:bg-red-600"
        case 'past_due':
          return "bg-orange-500 text-white hover:bg-orange-600"
        case 'trialing':
          return "bg-yellow-500 text-white hover:bg-yellow-600"
        default:
          return "bg-gray-500 text-white hover:bg-gray-600"
      }
    }
    
    const labels: Record<string, string> = {
      active: "Ativo",
      canceled: "Cancelado",
      past_due: "Vencido",
      trialing: "Teste"
    }
    
    return (
      <Badge className={getClassName(status)}>
        {labels[status] || status}
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
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
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
            <CardTitle className="text-sm font-medium">Usuários Pagantes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.uniquePayingUsers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalUsers > 0 ? `${stats.conversionRate.toFixed(1)}% de conversão` : 'Calculando...'}
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
            <CardTitle className="text-sm font-medium">Assinaturas Ativas</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeSubscriptions}</div>
            <p className="text-xs text-muted-foreground">
              Total de assinaturas
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
                  <TableHead>Email do Usuário</TableHead>
                  <TableHead>Conta</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Usuário Desde</TableHead>
                  <TableHead>Assinatura Desde</TableHead>
                  <TableHead>ID Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {subscriptions.map((sub) => (
                  <TableRow key={`${sub.user_id}-${sub.account_id}`}>
                    <TableCell className="font-medium">{sub.email}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{sub.account_name}</TableCell>
                    <TableCell>{getPlanBadge(sub.plan)}</TableCell>
                    <TableCell>{getStatusBadge(sub.subscription_status)}</TableCell>
                    <TableCell>
                      {formatCurrency(sub.amount)}
                      <span className="text-xs text-muted-foreground">/{sub.interval === 'month' ? 'mês' : 'ano'}</span>
                    </TableCell>
                    <TableCell className="text-sm">{formatDate(sub.created_at)}</TableCell>
                    <TableCell className="text-sm">{formatDate(sub.subscription_created)}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {sub.stripe_subscription_id ? (
                        <span className="truncate max-w-[100px] inline-block">
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
                  <Badge className="bg-blue-500 text-white hover:bg-blue-600">Pro</Badge>
                  <span className="text-sm text-muted-foreground">R$ 97/mês</span>
                </div>
                <span className="font-medium">
                  {subscriptions.filter(s => s.plan === 'pro').length} assinaturas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-purple-500 text-white hover:bg-purple-600">Pro Max</Badge>
                  <span className="text-sm text-muted-foreground">R$ 297/mês</span>
                </div>
                <span className="font-medium">
                  {subscriptions.filter(s => s.plan === 'pro_max').length} assinaturas
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">Personalizado</Badge>
                  <span className="text-sm text-muted-foreground">Valor customizado</span>
                </div>
                <span className="font-medium">
                  {subscriptions.filter(s => s.plan === 'custom' || s.plan === 'Personalizado').length} assinaturas
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