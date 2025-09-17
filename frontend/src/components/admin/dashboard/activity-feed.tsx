"use client"

import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { 
  User, 
  CreditCard, 
  Settings, 
  Shield, 
  AlertCircle,
  CheckCircle,
  Clock
} from "lucide-react"

interface Activity {
  id: string
  action: string
  timestamp: string
  admin_id: string
  type?: string
}

interface ActivityFeedProps {
  activities: Activity[]
}

export function ActivityFeed({ activities }: ActivityFeedProps) {
  const getActivityIcon = (action: string) => {
    if (action.toLowerCase().includes('user')) return User
    if (action.toLowerCase().includes('credit') || action.toLowerCase().includes('billing')) return CreditCard
    if (action.toLowerCase().includes('admin')) return Shield
    if (action.toLowerCase().includes('setting') || action.toLowerCase().includes('config')) return Settings
    if (action.toLowerCase().includes('error') || action.toLowerCase().includes('fail')) return AlertCircle
    if (action.toLowerCase().includes('success') || action.toLowerCase().includes('complete')) return CheckCircle
    return Clock
  }

  const getActivityColor = (action: string) => {
    if (action.toLowerCase().includes('error') || action.toLowerCase().includes('fail')) {
      return "text-red-600 dark:text-red-400"
    }
    if (action.toLowerCase().includes('success') || action.toLowerCase().includes('complete')) {
      return "text-emerald-600 dark:text-emerald-400"
    }
    if (action.toLowerCase().includes('warning')) {
      return "text-amber-600 dark:text-amber-400"
    }
    return "text-muted-foreground"
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Últimas ações administrativas realizadas
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Nenhuma atividade recente
              </p>
            ) : (
              activities.map((activity) => {
                const Icon = getActivityIcon(activity.action)
                const color = getActivityColor(activity.action)
                
                return (
                  <div
                    key={activity.id}
                    className="flex items-start gap-3 pb-4 border-b border-black/6 dark:border-white/8 last:border-0"
                  >
                    <div className={`p-2 rounded-md bg-transparent opacity-60 shrink-0 ${color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-1">
                      <p className="text-sm">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(activity.timestamp), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}