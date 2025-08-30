"use client"

import { 
  Users, 
  MessageSquare, 
  CreditCard, 
  TrendingUp,
  Activity,
  Zap,
  DollarSign,
  UserCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

interface StatsCardsProps {
  data: {
    users: {
      total: number
      active_today: number
      active_week: number
      growth_rate: number
    }
    usage: {
      messages_today: number
      tokens_today: number
      credits_today: number
      avg_messages_per_user: number
    }
    revenue: {
      mrr: number
      arr: number
      active_subscriptions: number
      trial_users: number
    }
    system: {
      api_status: string
      database_status: string
      redis_status: string
      error_rate: number
    }
  }
}

export function StatsCards({ data }: StatsCardsProps) {
  const cards = [
    {
      title: "Total de Usuários",
      value: data.users.total.toLocaleString('pt-BR'),
      change: `+${data.users.growth_rate}%`,
      changeType: "positive" as const,
      icon: Users,
      description: "Usuários cadastrados"
    },
    {
      title: "Usuários Ativos Hoje",
      value: data.users.active_today.toLocaleString('pt-BR'),
      change: `${data.users.active_week} esta semana`,
      changeType: "neutral" as const,
      icon: UserCheck,
      description: "Atividade diária"
    },
    {
      title: "Mensagens Hoje",
      value: data.usage.messages_today.toLocaleString('pt-BR'),
      change: `~${Math.round(data.usage.avg_messages_per_user)} por usuário`,
      changeType: "neutral" as const,
      icon: MessageSquare,
      description: "Total de mensagens"
    },
    {
      title: "Tokens Usados",
      value: formatNumber(data.usage.tokens_today),
      change: `${formatNumber(data.usage.credits_today)} créditos`,
      changeType: "neutral" as const,
      icon: Zap,
      description: "Consumo de tokens"
    },
    {
      title: "MRR",
      value: formatCurrency(data.revenue.mrr),
      change: `${data.revenue.active_subscriptions} assinaturas`,
      changeType: "positive" as const,
      icon: DollarSign,
      description: "Receita recorrente mensal"
    },
    {
      title: "Taxa de Erro",
      value: `${(data.system.error_rate * 100).toFixed(2)}%`,
      change: data.system.api_status,
      changeType: data.system.error_rate > 0.05 ? "negative" : "positive",
      icon: Activity,
      description: "Saúde do sistema"
    }
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {cards.map((card, index) => (
        <div
          key={index}
          className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8 p-6 hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-all duration-200"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground font-medium">
                {card.title}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-2xl font-bold tracking-tight">
                  {card.value}
                </h3>
                <span className={cn(
                  "text-xs font-medium",
                  card.changeType === "positive" && "text-emerald-600 dark:text-emerald-400",
                  card.changeType === "negative" && "text-red-600 dark:text-red-400",
                  card.changeType === "neutral" && "text-muted-foreground"
                )}>
                  {card.change}
                </span>
              </div>
              <p className="text-xs text-muted-foreground/60">
                {card.description}
              </p>
            </div>
            <div className="p-2 rounded-md bg-transparent opacity-60">
              <card.icon className="h-4 w-4" />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

function formatNumber(num: number): string {
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`
  }
  return num.toLocaleString('pt-BR')
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}