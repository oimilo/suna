import { createAdminClient } from "@/lib/supabase/admin"

export async function getBillingData() {
  const supabase = createAdminClient()
  
  try {
    // Buscar TODOS os usuários reais do sistema
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers()
    
    if (authError) {
      console.error('Erro ao buscar usuários do auth:', authError)
      throw authError
    }
    
    // Buscar todas as assinaturas (ativas e inativas) com informações de preço
    const { data: allSubscriptions, error: allSubsError } = await supabase
      .from('billing_subscriptions')
      .select(`
        *,
        billing_prices (
          amount,
          interval
        )
      `)
      .order('created', { ascending: false })
    
    if (allSubsError) throw allSubsError
    
    // Filtrar apenas assinaturas ativas
    const activeSubscriptions = allSubscriptions?.filter(s => s.status === 'active') || []
    
    // Buscar todas as contas (sem primary_owner_user_id que não existe no schema público)
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, created_at, personal_account')
    
    if (accountsError) console.error('Erro ao buscar contas:', accountsError)
    
    // Buscar relações usuário-conta - primeiro tentar schema público
    let accountUsers = null
    let accountUsersError = null
    
    // Tentar buscar de account_user (view pública)
    const publicResult = await supabase
      .from('account_user')
      .select('*')
    
    if (!publicResult.error) {
      accountUsers = publicResult.data
      console.log(`Encontradas ${accountUsers?.length || 0} relações em account_user`)
    } else {
      accountUsersError = publicResult.error
      console.log('Erro ao buscar account_user:', publicResult.error)
      
      // Se não funcionar, tentar o schema basejump diretamente
      const basejumpResult = await supabase
        .from('basejump.account_user')
        .select('*')
      
      if (!basejumpResult.error) {
        accountUsers = basejumpResult.data
        console.log(`Encontradas ${accountUsers?.length || 0} relações em basejump.account_user`)
      } else {
        console.log('Erro ao buscar basejump.account_user:', basejumpResult.error)
        console.log('account_user não acessível em nenhum schema, usando apenas contas pessoais')
      }
    }
    
    // Log para debug
    console.log(`Total de usuários no auth.users: ${authUsers?.users?.length || 0}`)
    console.log(`Total de contas: ${accounts?.length || 0}`)
    console.log(`Total de assinaturas ativas: ${activeSubscriptions.length}`)
    console.log(`Total de relações usuário-conta: ${accountUsers?.length || 0}`)
    
    // Debug específico para usuários mencionados
    const debugEmails = [
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    debugEmails.forEach(email => {
      const user = authUsers?.users?.find(u => u.email === email)
      if (user) {
        console.log(`\n=== Debug para ${email} ===`)
        console.log(`User ID: ${user.id}`)
        
        // Verificar contas do usuário
        const userAccountRelations = accountUsers?.filter(au => au.user_id === user.id) || []
        const personalAccount = accounts?.find(a => a.id === user.id && a.personal_account === true)
        
        console.log(`Relações em account_user: ${userAccountRelations.length}`)
        console.log(`Conta pessoal encontrada: ${personalAccount ? 'Sim' : 'Não'}`)
        
        // Verificar se alguma dessas contas tem assinatura
        const allUserAccountIds = [
          ...userAccountRelations.map(r => r.account_id),
          ...(personalAccount ? [personalAccount.id] : [])
        ]
        const uniqueAccountIds = [...new Set(allUserAccountIds)]
        
        console.log(`IDs de contas do usuário: ${uniqueAccountIds.join(', ')}`)
        
        uniqueAccountIds.forEach(accountId => {
          const sub = activeSubscriptions.find(s => s.account_id === accountId)
          if (sub) {
            console.log(`  -> Assinatura encontrada na conta ${accountId}: ${sub.status}`)
          }
        })
      } else {
        console.log(`Usuário ${email} NÃO encontrado no auth.users`)
      }
    })
    
    // Primeiro, vamos verificar se há assinaturas órfãs (sem usuário mapeado)
    const accountIdsWithSubscription = activeSubscriptions.map(s => s.account_id)
    console.log('Contas com assinatura ativa:', accountIdsWithSubscription)
    
    // Mapear quais usuários têm assinaturas ativas
    const usersWithSubscriptions = []
    const unmappedSubscriptions = [] // Assinaturas sem usuário encontrado
    
    authUsers?.users?.forEach(user => {
      // Encontrar todas as contas do usuário
      let userAccountIds = []
      
      // Via account_user (relação N:N)
      if (accountUsers) {
        const userAccounts = accountUsers.filter(au => au.user_id === user.id)
        userAccountIds = userAccounts.map(ua => ua.account_id)
      }
      
      // Se não tiver account_user, buscar conta pessoal
      if (userAccountIds.length === 0) {
        const personalAccount = accounts?.find(a => 
          a.id === user.id && a.personal_account === true
        )
        if (personalAccount) {
          userAccountIds.push(personalAccount.id)
        }
      }
      
      // Verificar se alguma conta do usuário tem assinatura ativa
      const userSubscriptions = activeSubscriptions.filter(sub => 
        userAccountIds.includes(sub.account_id)
      )
      
      // Se o usuário tem assinatura ativa, adicionar à lista
      userSubscriptions.forEach(sub => {
        const account = accounts?.find(a => a.id === sub.account_id)
        // Tentar pegar o valor de billing_prices ou do metadata
        const amount = sub.billing_prices?.amount || sub.metadata?.amount || 0
        const metadataPlan = sub.metadata?.plan
        
        let plan = metadataPlan || 'free'
        // Se não tiver plan no metadata, determinar pelo valor
        if (!metadataPlan) {
          if (amount === 9700) plan = 'pro'
          else if (amount === 29700) plan = 'pro_max'
          else if (amount > 0) plan = 'custom'
        }
        
        usersWithSubscriptions.push({
          user_id: user.id,
          account_id: sub.account_id,
          email: user.email || `Usuário ${user.id.slice(0, 8)}`,
          account_name: account?.name || 'Conta Pessoal',
          plan,
          subscription_status: sub.status,
          created_at: user.created_at,
          subscription_created: sub.created,
          stripe_subscription_id: sub.id,
          amount: amount / 100, // Converter de centavos para reais
          interval: sub.billing_prices?.interval || sub.metadata?.interval || 'month'
        })
      })
    })
    
    // Verificar se há assinaturas que não foram mapeadas para nenhum usuário
    activeSubscriptions.forEach(sub => {
      const isMapped = usersWithSubscriptions.some(uws => uws.account_id === sub.account_id)
      if (!isMapped) {
        const account = accounts?.find(a => a.id === sub.account_id)
        // Tentar pegar o valor de billing_prices ou do metadata
        const amount = sub.billing_prices?.amount || sub.metadata?.amount || 0
        const metadataPlan = sub.metadata?.plan
        
        let plan = metadataPlan || 'free'
        // Se não tiver plan no metadata, determinar pelo valor
        if (!metadataPlan) {
          if (amount === 9700) plan = 'pro'
          else if (amount === 29700) plan = 'pro_max'
          else if (amount > 0) plan = 'custom'
        }
        
        // Tentar encontrar o dono da conta através de várias estratégias
        let ownerEmail = null
        let ownerUserId = null
        
        // Estratégia 1: Procurar no account_user quem está nessa conta
        if (!ownerEmail && accountUsers) {
          const accountUserRelation = accountUsers.find(au => au.account_id === sub.account_id)
          if (accountUserRelation) {
            const owner = authUsers?.users?.find(u => u.id === accountUserRelation.user_id)
            if (owner) {
              ownerEmail = owner.email
              ownerUserId = owner.id
              console.log(`Dono encontrado via account_user: ${ownerEmail}`)
            }
          }
        }
        
        // Estratégia 2: Se é conta pessoal, o ID da conta é o ID do usuário
        if (!ownerEmail && account?.personal_account) {
          const owner = authUsers?.users?.find(u => u.id === account.id)
          if (owner) {
            ownerEmail = owner.email
            ownerUserId = owner.id
            console.log(`Dono encontrado via conta pessoal: ${ownerEmail}`)
          }
        }
        
        console.warn(`Assinatura encontrada - Account ID: ${sub.account_id}, Account Name: ${account?.name}, Owner: ${ownerEmail || 'Não encontrado'}, Plan: ${plan}`)
        
        // Adicionar assinatura (mesmo que não tenhamos encontrado o dono)
        unmappedSubscriptions.push({
          user_id: ownerUserId || sub.account_id, // Usar ID do usuário se encontrado
          account_id: sub.account_id,
          email: ownerEmail || account?.name || `Conta ${sub.account_id.slice(0, 8)}`,
          account_name: account?.name || 'Conta sem nome',
          plan,
          subscription_status: sub.status,
          created_at: account?.created_at || sub.created,
          subscription_created: sub.created,
          stripe_subscription_id: sub.id,
          amount: amount / 100,
          interval: sub.billing_prices?.interval || sub.metadata?.interval || 'month'
        })
      }
    })
    
    // Combinar assinaturas mapeadas e órfãs
    const allSubscriptionsList = [...usersWithSubscriptions, ...unmappedSubscriptions]
    
    console.log(`Assinaturas mapeadas para usuários: ${usersWithSubscriptions.length}`)
    console.log(`Assinaturas órfãs (sem usuário): ${unmappedSubscriptions.length}`)
    console.log(`Total de assinaturas mostradas: ${allSubscriptionsList.length}`)
    
    // Calcular estatísticas
    const planPrices: Record<string, number> = {
      pro: 97,
      pro_max: 297
    }
    
    // Calcular receita total baseada nos valores reais das assinaturas
    const totalRevenue = allSubscriptionsList.reduce((acc, sub) => {
      return acc + sub.amount
    }, 0)
    
    // Contar usuários únicos com assinatura (um usuário pode ter múltiplas contas)
    const uniqueUsersWithSubscription = new Set(
      allSubscriptionsList.map(s => s.user_id)
    ).size
    
    // Calcular churn
    const canceledCount = allSubscriptions?.filter(s => s.status === 'canceled').length || 0
    const totalSubs = allSubscriptions?.length || 1
    
    const stats = {
      totalRevenue,
      activeSubscriptions: activeSubscriptions.length,
      uniquePayingUsers: uniqueUsersWithSubscription,
      churnRate: (canceledCount / totalSubs) * 100,
      averageRevenue: uniqueUsersWithSubscription > 0 
        ? totalRevenue / uniqueUsersWithSubscription 
        : 0,
      totalUsers: authUsers?.users?.length || 0,
      conversionRate: authUsers?.users?.length > 0
        ? (uniqueUsersWithSubscription / authUsers.users.length) * 100
        : 0
    }
    
    console.log('Billing Stats:', {
      totalUsers: stats.totalUsers,
      uniquePayingUsers: stats.uniquePayingUsers,
      activeSubscriptions: stats.activeSubscriptions,
      totalRevenue: stats.totalRevenue
    })
    
    return {
      stats,
      subscriptions: allSubscriptionsList
    }
  } catch (error) {
    console.error('Erro ao buscar dados de billing:', error)
    return {
      stats: {
        totalRevenue: 0,
        activeSubscriptions: 0,
        uniquePayingUsers: 0,
        churnRate: 0,
        averageRevenue: 0,
        totalUsers: 0,
        conversionRate: 0
      },
      subscriptions: []
    }
  }
}