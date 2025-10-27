/**
 * Admin API client for production-safe access
 * Uses backend endpoints instead of direct Supabase access with service role
 */

import { getFallbackAnalyticsData } from './fallback-api'

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api'

/**
 * Get auth headers for admin requests
 */
export async function getAdminHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  }

  // Try to get session from cookies (server-side)
  if (typeof window === 'undefined') {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    const token = cookieStore.get('sb-access-token')?.value
    if (token) {
      headers['Authorization'] = `Bearer ${token}`
    }
  } else {
    // Client-side - get token from Supabase
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: { session } } = await supabase.auth.getSession()
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`
    }
  }

  return headers
}

/**
 * Fetch analytics data from backend
 */
export async function fetchAnalyticsData(period: string = "30d") {
  try {
    const headers = await getAdminHeaders()
    
    // Parse period to days
    const days = period === '7d' ? 7 : period === '30d' ? 30 : 90

    // Fetch dashboard stats with better error handling
    let dashboardData = null
    try {
      const dashboardResponse = await fetch(`${BACKEND_URL}/admin/analytics/dashboard`, {
        headers,
        cache: 'no-store'
      })

      if (dashboardResponse.ok) {
        dashboardData = await dashboardResponse.json()
      } else {
        console.warn(`Dashboard stats failed: ${dashboardResponse.status} ${dashboardResponse.statusText}`)
      }
    } catch (error) {
      console.warn('Dashboard fetch error:', error)
    }

    // Fetch charts data in parallel with error handling
    const fetchWithFallback = async (url: string, headers: Record<string, string>) => {
      try {
        const response = await fetch(url, { headers })
        if (response.ok) {
          return await response.json()
        }
        console.warn(`Failed to fetch ${url}: ${response.status}`)
        return null
      } catch (error) {
        console.warn(`Error fetching ${url}:`, error)
        return null
      }
    }

    const [userGrowth, usage, billing, health] = await Promise.all([
      fetchWithFallback(`${BACKEND_URL}/admin/analytics/charts/user-growth?days=${days}`, headers),
      fetchWithFallback(`${BACKEND_URL}/admin/analytics/charts/usage?metric=messages_sent&days=${days}`, headers),
      fetchWithFallback(`${BACKEND_URL}/admin/analytics/billing`, headers),
      fetchWithFallback(`${BACKEND_URL}/admin/analytics/system-health`, headers)
    ])

    // If all backend calls failed, use fallback
    if (!dashboardData && !userGrowth && !usage && !billing && !health) {
      console.warn('All backend analytics endpoints failed, using fallback')
      return await getFallbackAnalyticsData()
    }

    const totalUsers = dashboardData?.users?.total ?? 0
    const activeToday = dashboardData?.users?.active_today ?? 0
    const activeWeek = dashboardData?.users?.active_week ?? 0

    const platform = dashboardData?.platform ?? {}
    const threadsTotal = platform?.threads_total ?? 0
    const agentsTotal = platform?.agents_total ?? 0
    const agentRunsTotal = dashboardData?.system?.agent_runs_total ?? 0
    const agentRunsFailed = dashboardData?.system?.agent_runs_failed ?? 0
    const messagesTotal = dashboardData?.usage?.messages_total ?? 0
    const messagesToday = dashboardData?.usage?.messages_today ?? 0
    const avgMessagesPerUser = dashboardData?.usage?.avg_messages_per_user ?? 0
    const errorRate = dashboardData?.system?.error_rate ?? 0

    const recentActivity = (dashboardData?.recent_activity || []).map((item: any) => ({
      id: item?.id,
      action: item?.action,
      amount: typeof item?.amount === 'number' ? item.amount : Number(item?.amount || 0),
      created_at: item?.created_at,
    }))

    const systemHealth = (health || []).map((item: any) => ({
      service: item?.service ?? item?.service_name ?? 'Serviço',
      status: item?.status ?? 'healthy',
      uptime: typeof item?.uptime === 'number' ? item.uptime : 0,
      lastCheck: item?.lastCheck ?? item?.last_check ?? new Date().toISOString(),
      responseTimeMs: typeof item?.response_time_ms === 'number' ? item.response_time_ms : undefined,
      errorRate: typeof item?.error_rate === 'number' ? item.error_rate : undefined,
      metadata: item?.metadata ?? {},
    }))

    return {
      userMetrics: {
        totalUsers,
        activeUsers: activeWeek,
        newUsersToday: activeToday,
        newUsersThisWeek: activeWeek,
        newUsersThisMonth: totalUsers,
        userGrowthData: userGrowth?.data?.map((p: any) => ({
          date: p.timestamp,
          count: p.value
        })) || []
      },
      projectMetrics: {
        totalProjects: 0,
        projectsThisWeek: 0,
        averageProjectsPerUser: 0,
        projectGrowthData: [],
        topProjects: []
      },
      agentMetrics: {
        totalAgents: agentsTotal,
        agentsThisWeek: 0,
        averageAgentsPerUser: totalUsers ? parseFloat((agentsTotal / totalUsers).toFixed(2)) : 0,
        agentUsageData: [],
        popularAgentTypes: []
      },
      conversationMetrics: {
        totalThreads: threadsTotal,
        totalMessages: messagesTotal,
        messagesToday,
        averageMessagesPerThread: threadsTotal ? parseFloat((messagesTotal / threadsTotal).toFixed(2)) : 0,
        messageVolumeByHour: [],
        messageGrowthData: usage?.data?.map((p: any) => ({
          date: p.timestamp,
          count: p.value
        })) || []
      },
      automationMetrics: {
        totalTriggers: 0,
        activeTriggers: 0,
        webhookTriggers: 0,
        scheduledTriggers: 0,
        triggerExecutions: []
      },
      performanceMetrics: {
        totalAgentRuns: agentRunsTotal,
        successfulRuns: agentRunsTotal - agentRunsFailed,
        failedRuns: agentRunsFailed,
        averageRunDuration: 0,
        errorRate,
        commonErrors: []
      },
      toolUsageData: [],
      revenueMetrics: {
        mrr: billing?.mrr || 0,
        arr: billing?.arr || 0,
        totalRevenue: billing?.total_revenue || 0,
        averageRevenuePerUser: billing?.average_revenue_per_user || 0,
        conversionRate: billing?.conversion_rate || 0,
        churnRate: billing?.churn_rate || 0,
        lifetimeValue: billing?.lifetime_value || 0,
        revenueGrowthData: []
      },
      systemHealth,
      recentActivity,
      errors: recentActivity.filter((a: any) =>
        typeof a.action === 'string' && a.action.toLowerCase().includes('error')
      )
    }
  } catch (error) {
    console.error('Error fetching analytics from backend:', error)
    
    // Return empty data structure on error
    return {
      userMetrics: {
        totalUsers: 0,
        activeUsers: 0,
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        userGrowthData: []
      },
      projectMetrics: {
        totalProjects: 0,
        projectsThisWeek: 0,
        averageProjectsPerUser: 0,
        projectGrowthData: [],
        topProjects: []
      },
      agentMetrics: {
        totalAgents: 0,
        agentsThisWeek: 0,
        averageAgentsPerUser: 0,
        agentUsageData: [],
        popularAgentTypes: []
      },
      conversationMetrics: {
        totalThreads: 0,
        totalMessages: 0,
        averageMessagesPerThread: 0,
        messageVolumeByHour: [],
        messageGrowthData: []
      },
      automationMetrics: {
        totalTriggers: 0,
        activeTriggers: 0,
        webhookTriggers: 0,
        scheduledTriggers: 0,
        triggerExecutions: []
      },
      performanceMetrics: {
        totalAgentRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageRunDuration: 0,
        errorRate: 0,
        commonErrors: []
      },
      toolUsageData: [],
      revenueMetrics: {
        mrr: 0,
        arr: 0,
        totalRevenue: 0,
        averageRevenuePerUser: 0,
        conversionRate: 0,
        churnRate: 0,
        lifetimeValue: 0,
        revenueGrowthData: []
      },
      systemHealth: [],
      recentActivity: [],
      errors: []
    }
  }
}

/**
 * Fetch billing data from backend
 */
export async function fetchBillingData() {
  try {
    const headers = await getAdminHeaders()
    
    const response = await fetch(`${BACKEND_URL}/admin/analytics/billing`, {
      headers,
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`Billing data fetch failed: ${response.statusText}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Error fetching billing data:', error)
    return null
  }
}

/**
 * Fetch user stats from backend
 */
export async function fetchUserStats() {
  try {
    const headers = await getAdminHeaders()
    
    const response = await fetch(`${BACKEND_URL}/admin/analytics/dashboard`, {
      headers,
      cache: 'no-store'
    })

    if (!response.ok) {
      throw new Error(`User stats fetch failed: ${response.statusText}`)
    }

    const data = await response.json()
    return data.users || {}
  } catch (error) {
    console.error('Error fetching user stats:', error)
    return {}
  }
}
