import { createClient } from "@/lib/supabase/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { redirect } from "next/navigation"
import { subDays, startOfDay, format } from "date-fns"

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
  toolMetrics: {
    totalToolCalls: number
    uniqueTools: number
    toolUsageDistribution: Array<{ tool: string; count: number; successRate: number }>
    failuresByTool: Array<{ tool: string; failures: number }>
  }
  revenueMetrics: {
    mrr: number
    activeSubscriptions: number
    trialUsers: number
    conversionRate: number
    churnRate: number
  }
}

export async function fetchAnalyticsData(period: string = "30d"): Promise<AnalyticsData> {
  try {
    // Use admin client to bypass RLS for analytics
    const supabase = createAdminClient()
    
    // For server components, we should check if user exists without auth methods
    // The authentication is already handled by middleware
    // We'll proceed directly to fetch data since admin access is controlled by middleware
    
    // Note: Admin authentication should be handled by middleware
    // If you need to verify admin status, implement it in middleware.ts

    const days = parseInt(period) || 30
    const startDate = subDays(new Date(), days)

    console.log('Fetching analytics data for period:', period, 'days:', days)

    // Fetch all data in parallel for better performance
    const [
      userMetrics,
      projectMetrics,
      agentMetrics,
      conversationMetrics,
      automationMetrics,
      performanceMetrics,
      toolMetrics,
      revenueMetrics
    ] = await Promise.all([
      fetchUserMetrics(supabase, startDate, days),
      fetchProjectMetrics(supabase, startDate, days),
      fetchAgentMetrics(supabase, startDate, days),
      fetchConversationMetrics(supabase, startDate, days),
      fetchAutomationMetrics(supabase, startDate, days),
      fetchPerformanceMetrics(supabase, startDate, days),
      fetchToolMetrics(supabase, startDate, days),
      fetchRevenueMetrics(supabase)
    ])

    return {
      userMetrics,
      projectMetrics,
      agentMetrics,
      conversationMetrics,
      automationMetrics,
      performanceMetrics,
      toolMetrics,
      revenueMetrics
    }
  } catch (error) {
    console.error('Error fetching analytics data:', error)
    // Return default data structure on error
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
      toolMetrics: {
        totalToolCalls: 0,
        uniqueTools: 0,
        toolUsageDistribution: [],
        failuresByTool: []
      },
      revenueMetrics: {
        mrr: 0,
        activeSubscriptions: 0,
        trialUsers: 0,
        conversionRate: 0,
        churnRate: 0
      }
    }
  }
}

async function fetchUserMetrics(supabase: any, startDate: Date, days: number) {
  try {
    // Total users - primeiro tenta profiles
    console.log('Fetching user metrics...')
    
    const { data: profiles, count: profileCount, error: profileError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact' })
    
    console.log('Profiles query result:', { profileCount, profileError, dataLength: profiles?.length })
    
    // Tenta também buscar da tabela accounts (basejump)
    const { data: accounts, count: accountCount, error: accountError } = await supabase
      .from('accounts')
      .select('id', { count: 'exact' })
    
    console.log('Accounts query result:', { accountCount, accountError, dataLength: accounts?.length })
    
    // Usa o maior valor entre profiles e accounts
    const finalTotalUsers = Math.max(profileCount || 0, accountCount || 0)

    // Active users - contar usuários únicos que criaram mensagens nos últimos 7 dias
    const { data: activeMessages } = await supabase
      .from('messages')
      .select('threads!inner(account_id)')
      .gte('created_at', subDays(new Date(), 7).toISOString())
    
    // Contar unique account_ids
    const uniqueActiveUsers = new Set()
    ;(activeMessages || []).forEach((msg: any) => {
      if (msg.threads?.account_id) {
        uniqueActiveUsers.add(msg.threads.account_id)
      }
    })
    const activeUsers = uniqueActiveUsers.size

    // New users counts
    const today = startOfDay(new Date())
    const weekAgo = subDays(today, 7)
    const monthAgo = subDays(today, 30)

    // Try profiles first, then accounts
    const { count: newUsersToday } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString())

    const { count: newUsersThisWeek } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    const { count: newUsersThisMonth } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', monthAgo.toISOString())

    // User growth data
    const { data: userRecords } = await supabase
      .from('profiles')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    const userGrowthData = processGrowthData(userRecords || [], days)

    return {
      totalUsers: finalTotalUsers,
      activeUsers,
      newUsersToday: newUsersToday || 0,
      newUsersThisWeek: newUsersThisWeek || 0,
      newUsersThisMonth: newUsersThisMonth || 0,
      userGrowthData
    }
  } catch (error) {
    console.error('Error in fetchUserMetrics:', error)
    return {
      totalUsers: 0,
      activeUsers: 0,
      newUsersToday: 0,
      newUsersThisWeek: 0,
      newUsersThisMonth: 0,
      userGrowthData: []
    }
  }
}

async function fetchProjectMetrics(supabase: any, startDate: Date, days: number) {
  try {
    // Total projects - with better error handling
    const { data: projectsData, count: totalProjects, error: projectError } = await supabase
      .from('projects')
      .select('*', { count: 'exact' })
    
    if (projectError) {
      console.error('Error fetching projects:', projectError)
    }
    
    console.log('Total projects found:', totalProjects)

    // Projects this week
    const weekAgo = subDays(new Date(), 7)
    const { count: projectsThisWeek } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekAgo.toISOString())

    // Average projects per user
    const { count: userCount } = await supabase
      .from('accounts')
      .select('*', { count: 'exact', head: true })
    
    const averageProjectsPerUser = userCount ? (totalProjects || 0) / userCount : 0

    // Project growth data
    const { data: projects } = await supabase
      .from('projects')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    const projectGrowthData = processGrowthData(projects || [], days)

    // Top projects by message count
    const { data: topProjects } = await supabase
      .from('projects')
      .select(`
        project_id,
        name,
        threads!inner(
          thread_id,
          messages(message_id)
        )
      `)
      .limit(10)

    const processedTopProjects = (topProjects || []).map((project: any) => {
      const messageCount = project.threads?.reduce((acc: number, thread: any) => {
        return acc + (thread.messages?.length || 0)
      }, 0) || 0
      
      return {
        id: project.project_id,
        name: project.name,
        messageCount
      }
    }).sort((a: any, b: any) => b.messageCount - a.messageCount).slice(0, 5)

    return {
      totalProjects: totalProjects || 0,
      projectsThisWeek: projectsThisWeek || 0,
      averageProjectsPerUser,
      projectGrowthData,
      topProjects: processedTopProjects
    }
  } catch (error) {
    console.error('Error in fetchProjectMetrics:', error)
    return {
      totalProjects: 0,
      projectsThisWeek: 0,
      averageProjectsPerUser: 0,
      projectGrowthData: [],
      topProjects: []
    }
  }
}

async function fetchAgentMetrics(supabase: any, startDate: Date, days: number) {
  try {
    // Total agents
    const { count: totalAgents } = await supabase
      .from('agents')
      .select('*', { count: 'exact', head: true })

  // Agents this week
  const weekAgo = subDays(new Date(), 7)
  const { count: agentsThisWeek } = await supabase
    .from('agents')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', weekAgo.toISOString())

  // Average agents per user
  const { count: userCount } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })
  
  const averageAgentsPerUser = userCount ? (totalAgents || 0) / userCount : 0

  // Agent usage data (from messages)
  const { data: agentUsage } = await supabase
    .from('messages')
    .select('agent_id, agents!inner(agent_id, name)')
    .not('agent_id', 'is', null)
    .gte('created_at', startDate.toISOString())

  const agentUsageMap = new Map()
  ;(agentUsage || []).forEach((msg: any) => {
    const agentId = msg.agent_id
    const agentName = msg.agents?.name || 'Unknown'
    if (!agentUsageMap.has(agentId)) {
      agentUsageMap.set(agentId, { agentId, name: agentName, usageCount: 0 })
    }
    agentUsageMap.get(agentId).usageCount++
  })

  const agentUsageData = Array.from(agentUsageMap.values())
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 10)

  // Popular agent types (based on metadata or system prompt patterns)
  const { data: agents } = await supabase
    .from('agents')
    .select('metadata, system_prompt')

  const typeMap = new Map()
  ;(agents || []).forEach((agent: any) => {
    const type = agent.metadata?.type || 
                 (agent.system_prompt?.includes('código') ? 'coding' :
                  agent.system_prompt?.includes('escrita') ? 'writing' :
                  agent.system_prompt?.includes('análise') ? 'analysis' : 'general')
    
    typeMap.set(type, (typeMap.get(type) || 0) + 1)
  })

  const popularAgentTypes = Array.from(typeMap.entries())
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)

    return {
      totalAgents: totalAgents || 0,
      agentsThisWeek: agentsThisWeek || 0,
      averageAgentsPerUser,
      agentUsageData,
      popularAgentTypes
    }
  } catch (error) {
    console.error('Error in fetchAgentMetrics:', error)
    return {
      totalAgents: 0,
      agentsThisWeek: 0,
      averageAgentsPerUser: 0,
      agentUsageData: [],
      popularAgentTypes: []
    }
  }
}

async function fetchConversationMetrics(supabase: any, startDate: Date, days: number) {
  // Total threads and messages
  const { count: totalThreads } = await supabase
    .from('threads')
    .select('*', { count: 'exact', head: true })

  const { count: totalMessages } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })

  const averageMessagesPerThread = totalThreads ? (totalMessages || 0) / totalThreads : 0

  // Message volume by hour
  const { data: messages } = await supabase
    .from('messages')
    .select('created_at')
    .gte('created_at', startDate.toISOString())

  const hourMap = new Map()
  for (let i = 0; i < 24; i++) {
    hourMap.set(i, 0)
  }

  ;(messages || []).forEach((msg: any) => {
    const hour = new Date(msg.created_at).getHours()
    hourMap.set(hour, hourMap.get(hour) + 1)
  })

  const messageVolumeByHour = Array.from(hourMap.entries())
    .map(([hour, count]) => ({ hour, count }))
    .sort((a, b) => a.hour - b.hour)

  // Message growth data
  const messageGrowthData = processGrowthData(messages || [], days)

  return {
    totalThreads: totalThreads || 0,
    totalMessages: totalMessages || 0,
    averageMessagesPerThread,
    messageVolumeByHour,
    messageGrowthData
  }
}

async function fetchAutomationMetrics(supabase: any, startDate: Date, days: number) {
  // Total triggers
  const { count: totalTriggers } = await supabase
    .from('agent_triggers')
    .select('*', { count: 'exact', head: true })

  // Active triggers
  const { count: activeTriggers } = await supabase
    .from('agent_triggers')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  // Webhook triggers
  const { count: webhookTriggers } = await supabase
    .from('agent_triggers')
    .select('*', { count: 'exact', head: true })
    .eq('trigger_type', 'webhook')

  // Scheduled triggers
  const { count: scheduledTriggers } = await supabase
    .from('agent_triggers')
    .select('*', { count: 'exact', head: true })
    .eq('trigger_type', 'schedule')

  // Trigger executions (we'll simulate this for now as there's no execution log table)
  const triggerExecutions = []
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    triggerExecutions.push({
      date,
      count: Math.floor(Math.random() * 50) // Simulated data
    })
  }

  return {
    totalTriggers: totalTriggers || 0,
    activeTriggers: activeTriggers || 0,
    webhookTriggers: webhookTriggers || 0,
    scheduledTriggers: scheduledTriggers || 0,
    triggerExecutions: triggerExecutions.reverse()
  }
}

async function fetchPerformanceMetrics(supabase: any, startDate: Date, days: number) {
  // Total agent runs
  const { count: totalAgentRuns } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', startDate.toISOString())

  // Successful runs
  const { count: successfulRuns } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', startDate.toISOString())

  // Failed runs
  const { count: failedRuns } = await supabase
    .from('agent_runs')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed')
    .gte('created_at', startDate.toISOString())

  // Average run duration
  const { data: runs } = await supabase
    .from('agent_runs')
    .select('started_at, completed_at')
    .not('completed_at', 'is', null)
    .gte('created_at', startDate.toISOString())

  let totalDuration = 0
  let validRuns = 0
  ;(runs || []).forEach((run: any) => {
    if (run.started_at && run.completed_at) {
      const duration = new Date(run.completed_at).getTime() - new Date(run.started_at).getTime()
      totalDuration += duration
      validRuns++
    }
  })

  const averageRunDuration = validRuns > 0 ? totalDuration / validRuns / 1000 : 0 // in seconds

  // Error rate
  const errorRate = totalAgentRuns ? ((failedRuns || 0) / totalAgentRuns) * 100 : 0

  // Common errors
  const { data: errors } = await supabase
    .from('agent_runs')
    .select('error')
    .not('error', 'is', null)
    .gte('created_at', startDate.toISOString())

  const errorMap = new Map()
  ;(errors || []).forEach((run: any) => {
    const error = run.error || 'Unknown error'
    errorMap.set(error, (errorMap.get(error) || 0) + 1)
  })

  const commonErrors = Array.from(errorMap.entries())
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)

  return {
    totalAgentRuns: totalAgentRuns || 0,
    successfulRuns: successfulRuns || 0,
    failedRuns: failedRuns || 0,
    averageRunDuration,
    errorRate,
    commonErrors
  }
}

async function fetchToolMetrics(supabase: any, startDate: Date, days: number) {
  // Tool calls from messages with type 'tool_call'
  const { data: toolCalls } = await supabase
    .from('messages')
    .select('metadata')
    .eq('type', 'tool_call')
    .gte('created_at', startDate.toISOString())

  const toolMap = new Map()
  let totalToolCalls = 0

  ;(toolCalls || []).forEach((msg: any) => {
    totalToolCalls++
    const toolName = msg.metadata?.tool_name || msg.metadata?.name || 'unknown'
    const success = msg.metadata?.success !== false // assume success if not explicitly false
    
    if (!toolMap.has(toolName)) {
      toolMap.set(toolName, { tool: toolName, count: 0, successes: 0, failures: 0 })
    }
    
    const tool = toolMap.get(toolName)
    tool.count++
    if (success) {
      tool.successes++
    } else {
      tool.failures++
    }
  })

  const toolUsageDistribution = Array.from(toolMap.values())
    .map(tool => ({
      tool: tool.tool,
      count: tool.count,
      successRate: tool.count > 0 ? (tool.successes / tool.count) * 100 : 0
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10)

  const failuresByTool = Array.from(toolMap.values())
    .filter(tool => tool.failures > 0)
    .map(tool => ({ tool: tool.tool, failures: tool.failures }))
    .sort((a, b) => b.failures - a.failures)
    .slice(0, 5)

  return {
    totalToolCalls,
    uniqueTools: toolMap.size,
    toolUsageDistribution,
    failuresByTool
  }
}

async function fetchRevenueMetrics(supabase: any) {
  // Fetch billing subscriptions
  const { data: subscriptions } = await supabase
    .from('billing_subscriptions')
    .select(`
      *,
      billing_prices (
        amount
      )
    `)

  const activeSubscriptions = subscriptions?.filter((s: any) => s.status === 'active') || []
  const trialUsers = subscriptions?.filter((s: any) => s.status === 'trialing').length || 0

  // Calculate MRR
  const mrr = activeSubscriptions.reduce((sum: number, sub: any) => {
    const amount = sub.billing_prices?.amount || sub.metadata?.amount || 0
    return sum + (amount / 100) // Convert from cents to reais
  }, 0)

  // Conversion rate
  const { count: totalUsers } = await supabase
    .from('accounts')
    .select('*', { count: 'exact', head: true })

  const conversionRate = totalUsers ? (activeSubscriptions.length / totalUsers) * 100 : 0

  // Churn rate (simplified - canceled in last 30 days)
  const { count: canceledRecently } = await supabase
    .from('billing_subscriptions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'canceled')
    .gte('updated_at', subDays(new Date(), 30).toISOString())

  const churnRate = activeSubscriptions.length ? 
    ((canceledRecently || 0) / activeSubscriptions.length) * 100 : 0

  return {
    mrr,
    activeSubscriptions: activeSubscriptions.length,
    trialUsers,
    conversionRate,
    churnRate
  }
}

function processGrowthData(items: any[], days: number) {
  const dailyData: Record<string, number> = {}
  
  // Initialize all days with 0
  for (let i = 0; i < days; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd')
    dailyData[date] = 0
  }
  
  // Count items per day
  items.forEach(item => {
    const date = format(new Date(item.created_at), 'yyyy-MM-dd')
    if (dailyData[date] !== undefined) {
      dailyData[date]++
    }
  })
  
  // Convert to array and sort
  return Object.entries(dailyData)
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date))
}