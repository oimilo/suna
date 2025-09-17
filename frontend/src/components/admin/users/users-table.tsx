"use client"

import { useState } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { MoreHorizontal, User, CreditCard, Lock, Mail } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"
import { cn } from "@/lib/utils"

interface User {
  user_id: string
  email: string
  created_at: string
  last_active: string | null
  plan: string
  subscription_status: string | null
  total_messages: number
  total_tokens: number
  total_credits: number
  daily_credits_remaining: number | null
  monthly_credits_remaining: number | null
}

interface UsersTableProps {
  users: User[]
  onUserAction: (userId: string, action: string, data?: any) => void
}

export function UsersTable({ users, onUserAction }: UsersTableProps) {
  const [selectedUser, setSelectedUser] = useState<string | null>(null)

  const getPlanBadge = (plan: string, status: string | null) => {
    if (plan === 'free' || !status) {
      return <Badge variant="secondary">Free</Badge>
    }
    if (status === 'active') {
      return <Badge className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20">Premium</Badge>
    }
    if (status === 'trialing') {
      return <Badge className="bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20">Trial</Badge>
    }
    return <Badge variant="outline">{plan}</Badge>
  }

  const formatCredits = (credits: number | null) => {
    if (credits === null || credits === undefined) return "-"
    return credits.toFixed(2)
  }

  return (
    <div className="rounded-lg bg-black/[0.02] dark:bg-white/[0.03] border border-black/6 dark:border-white/8">
      <Table>
        <TableHeader>
          <TableRow className="border-black/6 dark:border-white/8">
            <TableHead className="text-xs">Usuário</TableHead>
            <TableHead className="text-xs">Plano</TableHead>
            <TableHead className="text-xs">Mensagens</TableHead>
            <TableHead className="text-xs">Créditos</TableHead>
            <TableHead className="text-xs">Última Atividade</TableHead>
            <TableHead className="text-xs">Cadastro</TableHead>
            <TableHead className="text-xs text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                Nenhum usuário encontrado
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow 
                key={user.user_id}
                className="border-black/6 dark:border-white/8 hover:bg-black/[0.02] dark:hover:bg-white/[0.03]"
              >
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-md bg-transparent opacity-60">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{user.email}</p>
                      <p className="text-xs text-muted-foreground">ID: {user.user_id.slice(0, 8)}...</p>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  {getPlanBadge(user.plan, user.subscription_status)}
                </TableCell>
                <TableCell>
                  <span className="text-sm">{user.total_messages.toLocaleString('pt-BR')}</span>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    <p>{formatCredits(user.total_credits)}</p>
                    <p className="text-xs text-muted-foreground">
                      Diário: {formatCredits(user.daily_credits_remaining)}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {user.last_active 
                      ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true, locale: ptBR })
                      : "Nunca"
                    }
                  </span>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-muted-foreground">
                    {formatDistanceToNow(new Date(user.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => onUserAction(user.user_id, 'view')}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Ver Detalhes
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUserAction(user.user_id, 'update-credits', {
                          credits: 100,
                          operation: 'add',
                          reason: 'Ajuste manual'
                        })}
                      >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Adicionar Créditos
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => onUserAction(user.user_id, 'reset-password')}
                      >
                        <Mail className="mr-2 h-4 w-4" />
                        Resetar Senha
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-red-600 dark:text-red-400"
                        onClick={() => onUserAction(user.user_id, 'suspend', {
                          reason: 'Suspenso pelo admin'
                        })}
                      >
                        <Lock className="mr-2 h-4 w-4" />
                        Suspender Usuário
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}