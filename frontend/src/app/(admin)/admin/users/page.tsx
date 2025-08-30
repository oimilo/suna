"use client"

import { useEffect, useState } from "react"
import { UsersTable } from "@/components/admin/users/users-table"
import { UserSearch } from "@/components/admin/users/user-search"
import { createClient } from "@/lib/supabase/client"
import { useToast } from "@/components/ui/use-toast"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

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

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalUsers, setTotalUsers] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const { toast } = useToast()
  const supabase = createClient()
  const pageSize = 20

  useEffect(() => {
    fetchUsers()
  }, [currentPage, searchQuery])

  async function fetchUsers() {
    try {
      setIsLoading(true)
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada. Por favor, faça login novamente.",
          variant: "destructive"
        })
        return
      }

      const params = new URLSearchParams({
        page: currentPage.toString(),
        page_size: pageSize.toString()
      })

      if (searchQuery) {
        params.append("search", searchQuery)
      }

      const response = await fetch(`/api/admin/users?${params}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error("Failed to fetch users")
      }

      const data = await response.json()
      setUsers(data.users || [])
      setTotalUsers(data.total || 0)
      setHasMore(data.has_more || false)
    } catch (error) {
      console.error("Error fetching users:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar usuários",
        variant: "destructive"
      })
    } finally {
      setIsLoading(false)
    }
  }

  async function handleUserAction(userId: string, action: string, data?: any) {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast({
          title: "Erro",
          description: "Sessão expirada",
          variant: "destructive"
        })
        return
      }

      let endpoint = ""
      let method = "POST"
      let body = null

      switch (action) {
        case "suspend":
          endpoint = `/api/admin/users/${userId}/suspend`
          body = JSON.stringify({ reason: data.reason })
          break
        case "reactivate":
          endpoint = `/api/admin/users/${userId}/reactivate`
          break
        case "reset-password":
          endpoint = `/api/admin/users/${userId}/reset-password`
          break
        case "update-credits":
          endpoint = `/api/admin/users/${userId}/credits`
          body = JSON.stringify(data)
          break
        default:
          throw new Error(`Unknown action: ${action}`)
      }

      const response = await fetch(endpoint, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        },
        body
      })

      if (!response.ok) {
        throw new Error(`Failed to ${action} user`)
      }

      toast({
        title: "Sucesso",
        description: `Ação realizada com sucesso`,
      })

      // Refresh users list
      fetchUsers()
    } catch (error) {
      console.error(`Error performing ${action}:`, error)
      toast({
        title: "Erro",
        description: `Erro ao executar ação`,
        variant: "destructive"
      })
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Gestão de Usuários</h1>
        <p className="text-muted-foreground">
          Visualize e gerencie todos os usuários do sistema
        </p>
      </div>

      {/* Search and Filters */}
      <UserSearch 
        onSearch={setSearchQuery}
        totalUsers={totalUsers}
      />

      {/* Users Table */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <UsersTable 
            users={users}
            onUserAction={handleUserAction}
          />

          {/* Pagination */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, totalUsers)} de {totalUsers} usuários
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                Anterior
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => p + 1)}
                disabled={!hasMore}
              >
                Próximo
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  )
}