"use client"

import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Users, Search, Mail, Calendar, Bot, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

interface UserData {
  user_id: string
  email: string
  created_at: string
  plan: string
  subscription_status: string | null
  threads_count?: number
  agents_count?: number
  accounts_count?: number
  phone?: string
  last_sign_in?: string
  email_confirmed?: boolean
}

interface UsersClientProps {
  initialData: {
    users: UserData[]
    stats: {
      totalUsers: number
      proUsers: number
      activeUsers: number
      totalAgents: number
    }
  }
}

export default function UsersClient({ initialData }: UsersClientProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchInput, setSearchInput] = useState("")
  const { toast } = useToast()
  
  // Filtrar usuários baseado na pesquisa
  const filteredUsers = searchQuery 
    ? initialData.users.filter(u => u.email.toLowerCase().includes(searchQuery.toLowerCase()))
    : initialData.users
  
  // Recalcular estatísticas baseado nos usuários filtrados
  const totalUsers = filteredUsers.length
  const proUsers = filteredUsers.filter(u => u.plan !== 'free').length
  const activeUsers = filteredUsers.filter(u => (u.threads_count || 0) > 0).length
  const totalAgents = filteredUsers.reduce((acc, u) => acc + (u.agents_count || 0), 0)

  const handleSearch = () => {
    setSearchQuery(searchInput)
  }

  const formatDate = (date: string) => {
    try {
      return format(new Date(date), "dd/MM/yyyy HH:mm", { locale: ptBR })
    } catch {
      return date
    }
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
      free: "Free",
      pro: "Pro",
      pro_max: "Pro Max",
      custom: "Personalizado",
      Personalizado: "Personalizado"
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
          <h1 className="text-3xl font-bold tracking-tight">Usuários</h1>
          <p className="text-muted-foreground">
            Gerencie e monitore os usuários da plataforma
          </p>
        </div>
      </div>

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchQuery ? totalUsers : initialData.stats.totalUsers}</div>
            <p className="text-xs text-muted-foreground">
              {searchQuery ? "Resultado da busca" : "Usuários cadastrados"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Pro</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchQuery ? proUsers : initialData.stats.proUsers}</div>
            <p className="text-xs text-muted-foreground">
              {totalUsers > 0 ? `${((proUsers / totalUsers) * 100).toFixed(1)}% do total` : "0% do total"}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchQuery ? activeUsers : initialData.stats.activeUsers}</div>
            <p className="text-xs text-muted-foreground">
              Com conversas criadas
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Agentes</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchQuery ? totalAgents : initialData.stats.totalAgents}</div>
            <p className="text-xs text-muted-foreground">
              Agentes criados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Pesquisa */}
      <Card>
        <CardHeader>
          <CardTitle>Pesquisar Usuários</CardTitle>
          <CardDescription>
            Busque usuários por email
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o email do usuário..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="pl-8"
              />
            </div>
            <Button onClick={handleSearch}>
              Buscar
            </Button>
            {searchQuery && (
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchQuery("")
                  setSearchInput("")
                }}
              >
                Limpar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Usuários */}
      <Card>
        <CardHeader>
          <CardTitle>Lista de Usuários</CardTitle>
          <CardDescription>
            {searchQuery ? `Resultados para "${searchQuery}"` : "Todos os usuários"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">
                {searchQuery ? "Nenhum usuário encontrado para esta busca" : "Nenhum usuário encontrado"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Plano</TableHead>
                  <TableHead>Verificado</TableHead>
                  <TableHead>Conversas</TableHead>
                  <TableHead>Agentes</TableHead>
                  <TableHead>Contas</TableHead>
                  <TableHead>Último Login</TableHead>
                  <TableHead>Cadastro</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.user_id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{user.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getPlanBadge(user.plan)}
                    </TableCell>
                    <TableCell>
                      {user.email_confirmed ? (
                        <Badge variant="outline" className="text-green-600">
                          Verificado
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-amber-600">
                          Pendente
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.threads_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.agents_count || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">
                        {user.accounts_count || 1}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {user.last_sign_in ? formatDate(user.last_sign_in) : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">
                          {formatDate(user.created_at)}
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}