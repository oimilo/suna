"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Loader2 } from "lucide-react"

interface AdminUser {
  id: string
  user_id: string
  role: 'super_admin' | 'admin' | 'support' | 'viewer'
  is_active: boolean
}

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const [isLoading, setIsLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
  }, [])

  async function checkAdminAccess() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        router.push("/auth/signin")
        return
      }

      // Check if user is admin
      const { data: adminData, error } = await supabase
        .from("admin_users")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single()

      if (error || !adminData) {
        // Not an admin, redirect to main app
        router.push("/")
        return
      }

      setAdminUser(adminData)
      setIsAdmin(true)
    } catch (error) {
      console.error("Error checking admin access:", error)
      router.push("/")
    } finally {
      setIsLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Verificando acesso administrativo...</p>
        </div>
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta área.</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}