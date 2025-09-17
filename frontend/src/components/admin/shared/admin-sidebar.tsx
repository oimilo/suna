"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import {
  LayoutDashboard,
  Users,
  TrendingUp,
  CreditCard,
  Settings,
  Monitor,
  Shield,
  LogOut,
  ChevronLeft,
  Menu
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"

const menuItems = [
  {
    title: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
    exact: true
  },
  {
    title: "Usuários",
    href: "/admin/users",
    icon: Users
  },
  {
    title: "Analytics",
    href: "/admin/analytics",
    icon: TrendingUp
  },
  {
    title: "Billing",
    href: "/admin/billing",
    icon: CreditCard
  },
  {
    title: "Sistema",
    href: "/admin/system",
    icon: Monitor
  },
  {
    title: "Admins",
    href: "/admin/admins",
    icon: Shield
  },
  {
    title: "Configurações",
    href: "/admin/settings",
    icon: Settings
  }
]

export function AdminSidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    await supabase.auth.signOut()
    router.push("/auth/signin")
  }

  return (
    <aside className={cn(
      "bg-black/[0.02] dark:bg-white/[0.03] border-r border-black/6 dark:border-white/8 transition-all duration-200",
      isCollapsed ? "w-16" : "w-64"
    )}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-black/6 dark:border-white/8">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-semibold">Admin Panel</h2>
                <p className="text-xs text-muted-foreground">Prophet/Suna</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => setIsCollapsed(!isCollapsed)}
            >
              {isCollapsed ? (
                <Menu className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {menuItems.map((item) => {
            const isActive = item.exact 
              ? pathname === item.href
              : pathname.startsWith(item.href)
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200",
                  "hover:bg-black/[0.04] dark:hover:bg-white/[0.06]",
                  isActive && "bg-black/[0.06] dark:bg-white/[0.08] font-medium",
                  isCollapsed && "justify-center"
                )}
                title={isCollapsed ? item.title : undefined}
              >
                <item.icon className={cn(
                  "h-4 w-4 opacity-60",
                  isActive && "opacity-100"
                )} />
                {!isCollapsed && (
                  <span className="text-sm">{item.title}</span>
                )}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-black/6 dark:border-white/8">
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start gap-3 text-sm",
              "hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-400",
              isCollapsed && "justify-center px-0"
            )}
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4 opacity-60" />
            {!isCollapsed && "Sair"}
          </Button>
        </div>
      </div>
    </aside>
  )
}