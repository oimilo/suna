import { createAdminClient } from "@/lib/supabase/admin"

export async function getUsersData() {
  const supabase = createAdminClient()
  
  try {
    // Buscar TODOS os usuários do auth.users (usuários reais)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Erro ao buscar usuários do auth:', authError)
      throw authError
    }
    
    // Buscar todas as contas do basejump para mapear relacionamentos
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('*')
    
    if (accountsError) console.error('Erro ao buscar contas:', accountsError)
    
    // Buscar relações usuário-conta do basejump
    const { data: accountUsers, error: accountUsersError } = await supabase
      .from('account_user')
      .select('*')
    
    if (accountUsersError) {
      // Se a tabela account_user não existir na view pública, tentamos basejump.account_user
      console.log('Tentando buscar de basejump.account_user...')
    }
    
    // Buscar assinaturas
    const { data: subscriptions, error: subsError } = await supabase
      .from('billing_subscriptions')
      .select('*')
    
    if (subsError) console.error('Erro ao buscar assinaturas:', subsError)

    // Buscar threads
    const { data: threads, error: threadsError } = await supabase
      .from('threads')
      .select('account_id, thread_id')
    
    if (threadsError) console.error('Erro ao buscar threads:', threadsError)

    // Buscar agentes
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('account_id, agent_id')
    
    if (agentsError) console.error('Erro ao buscar agentes:', agentsError)

    // Mapear dados dos usuários REAIS
    const usersData = authUsers?.users?.map(user => {
      // Encontrar a conta pessoal do usuário (onde id = user.id)
      const personalAccount = accounts?.find(a => a.id === user.id && a.personal_account === true)
      
      // Encontrar todas as contas do usuário via account_user
      const userAccounts = accountUsers?.filter(au => au.user_id === user.id) || []
      const userAccountIds = userAccounts.map(ua => ua.account_id)
      
      // Se não tiver account_user, assumir que a conta pessoal é a única
      if (userAccountIds.length === 0 && personalAccount) {
        userAccountIds.push(personalAccount.id)
      }
      
      // Contar threads e agentes de todas as contas do usuário
      const userThreads = threads?.filter(t => userAccountIds.includes(t.account_id)) || []
      const userAgents = agents?.filter(a => userAccountIds.includes(a.account_id)) || []
      
      // Verificar se tem assinatura ativa em alguma conta
      const userSubscription = subscriptions?.find(s => userAccountIds.includes(s.account_id))
      
      return {
        user_id: user.id,
        email: user.email || `Usuário ${user.id.slice(0, 8)}`,
        created_at: user.created_at || new Date().toISOString(),
        plan: userSubscription?.status === 'active' ? 'pro' : 'free',
        subscription_status: userSubscription?.status || null,
        threads_count: userThreads.length,
        agents_count: userAgents.length,
        accounts_count: userAccountIds.length,
        phone: user.phone,
        last_sign_in: user.last_sign_in_at,
        email_confirmed: user.email_confirmed_at ? true : false
      }
    }) || []
    
    // Calcular estatísticas
    const totalUsers = usersData.length
    const proUsers = usersData.filter(u => u.plan !== 'free').length
    const activeUsers = usersData.filter(u => u.threads_count > 0).length
    const totalAgents = usersData.reduce((acc, u) => acc + u.agents_count, 0)
    
    console.log(`Total de usuários encontrados: ${totalUsers}`)
    console.log(`Usuários Pro: ${proUsers}`)
    console.log(`Usuários Ativos: ${activeUsers}`)
    
    return {
      users: usersData,
      stats: {
        totalUsers,
        proUsers,
        activeUsers,
        totalAgents
      }
    }
  } catch (error) {
    console.error('Erro ao buscar dados de usuários:', error)
    return {
      users: [],
      stats: {
        totalUsers: 0,
        proUsers: 0,
        activeUsers: 0,
        totalAgents: 0
      }
    }
  }
}