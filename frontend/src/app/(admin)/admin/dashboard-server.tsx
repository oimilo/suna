import { createAdminClient } from "@/lib/supabase/admin"
import { subDays, startOfDay } from "date-fns"

export async function getDashboardData() {
  const supabase = createAdminClient()
  
  try {
    // Buscar TODOS os usuários reais do auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Erro ao buscar usuários do auth:', authError)
      throw authError
    }
    
    // Buscar todas as contas (organizações)
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (accountsError) console.error('Erro ao buscar contas:', accountsError)
    
    // Buscar threads
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('thread_id, account_id')
    
    if (threadsError) console.error('Erro ao buscar threads:', threadsError)
    
    // Buscar agentes
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('agent_id, account_id')
    
    if (agentsError) console.error('Erro ao buscar agentes:', agentsError)
    
    // Buscar mensagens (apenas contagem)
    const { count: messagesCount, error: messagesError } = await supabase
      .from('messages')
      .select('*', { count: 'exact', head: true })
    
    if (messagesError) console.error('Erro ao buscar mensagens:', messagesError)
    
    // Buscar assinaturas ativas
    const { data: subscriptions, error: subsError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .eq('status', 'active')
    
    if (subsError) console.error('Erro ao buscar assinaturas:', subsError)
    
    // Buscar relações usuário-conta
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_user')
      .select('*')
    
    if (accountUsersError) console.log('account_user não acessível, usando contas pessoais')
    
    // Calcular estatísticas baseadas em USUÁRIOS REAIS
    const now = new Date()
    const todayStart = startOfDay(now)
    const weekAgo = subDays(now, 7)
    
    // Mapear usuários para contas
    const userAccountMap = new Map()
    authUsers?.users?.forEach(user => {
      // Contas do usuário via account_user ou conta pessoal
      const userAccounts = accountUsers?.filter(au => au.user_id === user.id) || []
      const userAccountIds = userAccounts.map(ua => ua.account_id)
      
      // Se não tiver account_user, buscar conta pessoal
      if (userAccountIds.length === 0) {
        const personalAccount = accounts?.find(a => a.id === user.id && a.personal_account === true)
        if (personalAccount) {
          userAccountIds.push(personalAccount.id)
        }
      }
      
      userAccountMap.set(user.id, userAccountIds)
    })
    
    // Contar usuários ativos (que têm threads em suas contas)
    let activeUsersCount = 0
    authUsers?.users?.forEach(user => {
      const userAccountIds = userAccountMap.get(user.id) || []
      const hasThreads = threads?.some(t => userAccountIds.includes(t.account_id))
      if (hasThreads) activeUsersCount++
    })
    
    // Formatar usuários recentes (agora mostrando usuários REAIS)
    const recentUsers = authUsers?.users
      ?.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      ?.slice(0, 5)
      ?.map(user => {
        const userAccountIds = userAccountMap.get(user.id) || []
        const hasSubscription = subscriptions?.some(s => userAccountIds.includes(s.account_id))
        const subscription = subscriptions?.find(s => userAccountIds.includes(s.account_id))
        
        return {
          user_id: user.id,
          email: user.email || `Usuário ${user.id.slice(0, 8)}`,
          created_at: user.created_at,
          plan: hasSubscription ? 'pro' : 'free',
          subscription_status: subscription?.status || null
        }
      }) || []
    
    // Contar usuários Pro (que têm assinaturas ativas em suas contas)
    let proUsersCount = 0
    authUsers?.users?.forEach(user => {
      const userAccountIds = userAccountMap.get(user.id) || []
      const hasSubscription = subscriptions?.some(s => userAccountIds.includes(s.account_id))
      if (hasSubscription) proUsersCount++
    })
    
    const stats = {
      totalUsers: authUsers?.users?.length || 0,  // Total de USUÁRIOS REAIS
      activeUsers: activeUsersCount,
      totalThreads: threads?.length || 0,
      totalAgents: agents?.length || 0,
      totalMessages: messagesCount || 0,
      proUsers: proUsersCount,
      newUsersToday: authUsers?.users?.filter(u => new Date(u.created_at) >= todayStart).length || 0,
      newUsersWeek: authUsers?.users?.filter(u => new Date(u.created_at) >= weekAgo).length || 0,
      totalAccounts: accounts?.length || 0  // Total de contas/organizações
    }
    
    console.log('Dashboard Stats:', {
      totalUsers: stats.totalUsers,
      totalAccounts: stats.totalAccounts,
      activeUsers: stats.activeUsers,
      proUsers: stats.proUsers
    })
    
    return {
      stats,
      recentUsers
    }
  } catch (error) {
    console.error('Erro ao buscar dados do dashboard:', error)
    return {
      stats: {
        totalUsers: 0,
        activeUsers: 0,
        totalThreads: 0,
        totalAgents: 0,
        totalMessages: 0,
        proUsers: 0,
        newUsersToday: 0,
        newUsersWeek: 0,
        totalAccounts: 0
      },
      recentUsers: []
    }
  }
}