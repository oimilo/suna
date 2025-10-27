import { fetchAnalyticsData as fetchAnalyticsFromBackend, getAdminHeaders } from "@/lib/admin/api"
import type { AnalyticsData } from "@/app/(admin)/admin/analytics/analytics-server"

interface DashboardUserSummary {
  id: string
  email: string
  created_at: string
  tier?: string
  credit_balance?: number
  subscription_status?: string | null
}

export interface DashboardInitialData {
  analytics: AnalyticsData
  recentUsers: DashboardUserSummary[]
}

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api"

export async function getDashboardData(): Promise<DashboardInitialData> {
  const analytics = (await fetchAnalyticsFromBackend("30d")) as AnalyticsData
  let recentUsers: DashboardUserSummary[] = []

  try {
    const headers = await getAdminHeaders()
    const params = new URLSearchParams({
      page: "1",
      page_size: "5",
      sort_by: "created_at",
      sort_order: "desc",
    })

    const response = await fetch(`${BACKEND_URL}/admin/users/list?${params.toString()}`, {
      headers,
      cache: "no-store",
    })

    if (response.ok) {
      const payload = await response.json()
      recentUsers = (payload?.data || []).map((item: any) => ({
        id: item?.id,
        email: item?.email ?? "Usuário desconhecido",
        created_at: item?.created_at,
        tier: item?.tier,
        credit_balance: typeof item?.credit_balance === "number" ? item.credit_balance : Number(item?.credit_balance || 0),
        subscription_status: item?.subscription_status ?? null,
      }))
    } else {
      console.warn("Failed to load recent admin users:", response.status, response.statusText)
    }
  } catch (error) {
    console.error("Erro ao buscar usuários recentes do dashboard:", error)
  }

  return {
    analytics,
    recentUsers,
  }
}
