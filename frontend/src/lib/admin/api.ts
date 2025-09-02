/**
 * Admin API client for production-safe access
 * Uses backend endpoints instead of direct Supabase access with service role
 */

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8000/api'

interface AdminHeaders {
  'Content-Type': string
  'Authorization'?: string
  'X-Admin-Token'?: string
}

/**
 * Get auth headers for admin requests
 */
async function getAdminHeaders(): Promise<AdminHeaders> {
  const headers: AdminHeaders = {
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

    // Fetch dashboard stats
    const dashboardResponse = await fetch(`${BACKEND_URL}/admin/analytics/dashboard`, {
      headers,
      cache: 'no-store'
    })

    if (!dashboardResponse.ok) {
      throw new Error(`Dashboard stats failed: ${dashboardResponse.statusText}`)
    }

    const dashboardData = await dashboardResponse.json()

    // Fetch charts data in parallel
    const [userGrowthRes, usageRes, billingRes, healthRes] = await Promise.all([
      fetch(`${BACKEND_URL}/admin/analytics/charts/user-growth?days=${days}`, { headers }),
      fetch(`${BACKEND_URL}/admin/analytics/charts/usage?metric=messages_sent&days=${days}`, { headers }),
      fetch(`${BACKEND_URL}/admin/analytics/billing`, { headers }),
      fetch(`${BACKEND_URL}/admin/analytics/system-health`, { headers })
    ])

    const [userGrowth, usage, billing, health] = await Promise.all([
      userGrowthRes.ok ? userGrowthRes.json() : null,
      usageRes.ok ? usageRes.json() : null,
      billingRes.ok ? billingRes.json() : null,
      healthRes.ok ? healthRes.json() : []
    ])

    // Transform backend data to match frontend format
    return {
      userMetrics: {
        totalUsers: dashboardData.users?.total || 0,
        activeUsers: dashboardData.users?.active_week || 0,
        newUsersToday: dashboardData.users?.active_today || 0,
        newUsersThisWeek: dashboardData.users?.active_week || 0,
        newUsersThisMonth: dashboardData.users?.total || 0,
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
        totalAgents: 0,
        agentsThisWeek: 0,
        averageAgentsPerUser: 0,
        agentUsageData: [],
        popularAgentTypes: []
      },
      conversationMetrics: {
        totalThreads: 0,
        totalMessages: dashboardData.usage?.messages_today || 0,
        averageMessagesPerThread: dashboardData.usage?.avg_messages_per_user || 0,
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
        totalAgentRuns: 0,
        successfulRuns: 0,
        failedRuns: 0,
        averageRunDuration: 0,
        errorRate: dashboardData.system?.error_rate || 0,
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
      systemHealth: health || [],
      errors: dashboardData.recent_activity?.filter((a: any) => 
        a.action?.toLowerCase().includes('error')
      ) || []
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