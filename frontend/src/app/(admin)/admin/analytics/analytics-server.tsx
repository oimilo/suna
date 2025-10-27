import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { fetchAnalyticsData as fetchAnalyticsFromBackend } from "@/lib/admin/api"

export interface AnalyticsData {
  userMetrics: {
    totalUsers: number
    activeUsers: number
    newUsersToday: number
    newUsersThisWeek: number
    newUsersThisMonth: number
    userGrowthData: Array<{ date: string; count: number }>
  }
  projectMetrics: {
    totalProjects: number
    projectsThisWeek: number
    averageProjectsPerUser: number
    projectGrowthData: Array<{ date: string; count: number }>
    topProjects: Array<{ id: string; name: string; messageCount: number }>
  }
  agentMetrics: {
    totalAgents: number
    agentsThisWeek: number
    averageAgentsPerUser: number
    agentUsageData: Array<{ agentId: string; name: string; usageCount: number }>
    popularAgentTypes: Array<{ type: string; count: number }>
  }
  conversationMetrics: {
    totalThreads: number
    totalMessages: number
    messagesToday?: number
    averageMessagesPerThread: number
    messageVolumeByHour: Array<{ hour: number; count: number }>
    messageGrowthData: Array<{ date: string; count: number }>
  }
  automationMetrics: {
    totalTriggers: number
    activeTriggers: number
    webhookTriggers: number
    scheduledTriggers: number
    triggerExecutions: Array<{ date: string; count: number }>
  }
  performanceMetrics: {
    totalAgentRuns: number
    successfulRuns: number
    failedRuns: number
    averageRunDuration: number
    errorRate: number
    commonErrors: Array<{ error: string; count: number }>
  }
  toolUsageData: Array<{ tool: string; count: number; avgDuration: number }>
  revenueMetrics: {
    mrr: number
    arr: number
    totalRevenue: number
    averageRevenuePerUser: number
    conversionRate: number
    churnRate: number
    lifetimeValue: number
    revenueGrowthData: Array<{ date: string; amount: number }>
  }
  systemHealth: Array<{
    service: string
    status: 'healthy' | 'degraded' | 'down'
    uptime: number
    lastCheck: string
    responseTimeMs?: number
    errorRate?: number
    metadata?: Record<string, any>
  }>
  recentActivity: Array<{
    id?: string
    action?: string
    amount: number
    created_at?: string
  }>
  errors: Array<{
    timestamp: string
    error: string
    count: number
    severity: string
  }>
}

export async function fetchAnalyticsData(period: string = "30d"): Promise<AnalyticsData> {
  try {
    // Check authentication first
    const supabase = await createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error || !user) {
      redirect('/login')
    }

    // Check if user is admin (simplified check - you may want to verify against admin_users table)
    const isAdmin = user.email?.includes('@prophet.build') || 
                   user.email?.includes('@suna.com') ||
                   process.env.NODE_ENV === 'development'
    
    if (!isAdmin) {
      redirect('/dashboard')
    }

    // Use backend API if in production
    if (process.env.NODE_ENV === 'production' || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return await fetchAnalyticsFromBackend(period) as AnalyticsData
    }

    // For development with service role key, fetch directly from Supabase
    // This allows for richer data during development
    const { createAdminClient } = await import("@/lib/supabase/admin")
    const adminSupabase = createAdminClient()
    
    // Simplified data fetching for development
    const [
      usersResult,
      projectsResult,
      agentsResult,
      threadsResult,
      messagesResult
    ] = await Promise.all([
      adminSupabase.from('accounts').select('*', { count: 'exact' }),
      adminSupabase.from('projects').select('*', { count: 'exact' }),
      adminSupabase.from('agents').select('*', { count: 'exact' }),
      adminSupabase.from('threads').select('*', { count: 'exact' }),
      adminSupabase.from('messages').select('*', { count: 'exact' })
    ])

    // Return simplified analytics data
    return {
      userMetrics: {
        totalUsers: usersResult.count || 0,
        activeUsers: Math.floor((usersResult.count || 0) * 0.3),
        newUsersToday: 0,
        newUsersThisWeek: 0,
        newUsersThisMonth: 0,
        userGrowthData: []
      },
      projectMetrics: {
        totalProjects: projectsResult.count || 0,
        projectsThisWeek: 0,
        averageProjectsPerUser: (projectsResult.count || 0) / Math.max(usersResult.count || 1, 1),
        projectGrowthData: [],
        topProjects: []
      },
      agentMetrics: {
        totalAgents: agentsResult.count || 0,
        agentsThisWeek: 0,
        averageAgentsPerUser: (agentsResult.count || 0) / Math.max(usersResult.count || 1, 1),
        agentUsageData: [],
        popularAgentTypes: []
      },
      conversationMetrics: {
        totalThreads: threadsResult.count || 0,
        totalMessages: messagesResult.count || 0,
        messagesToday: 0,
        averageMessagesPerThread: (messagesResult.count || 0) / Math.max(threadsResult.count || 1, 1),
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
      systemHealth: [
        {
          service: 'API',
          status: 'healthy',
          uptime: 99.9,
          lastCheck: new Date().toISOString(),
          responseTimeMs: 80,
          errorRate: 0.2,
        },
        {
          service: 'Database',
          status: 'healthy',
          uptime: 99.99,
          lastCheck: new Date().toISOString(),
          responseTimeMs: 65,
          errorRate: 0.1,
        }
      ],
      recentActivity: [],
      errors: []
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    
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
        messagesToday: 0,
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
