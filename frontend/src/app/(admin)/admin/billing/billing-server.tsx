import { createAdminClient } from "@/lib/supabase/admin"

export async function getBillingData() {
  const supabase = createAdminClient()
  
  try {
    // Buscar todas as assinaturas com informações de preço
    const { data: subscriptions, error: subsError } = await supabase
      .from('billing_subscriptions')
      .select(`
        *,
        billing_prices (
          amount,
          interval
        )
      `)
      .eq('status', 'active')
      .order('created', { ascending: false })
    
    if (subsError) throw subsError
    
    // Buscar contas para obter nomes
    const { data: accounts, error: accountsError } = await supabase
      .from('accounts')
      .select('id, name, created_at')
    
    if (accountsError) throw accountsError
    
    // Mapear assinaturas pagas
    const paidSubscriptions = subscriptions?.map(sub => {
      const account = accounts?.find(a => a.id === sub.account_id)
      const amount = sub.billing_prices?.amount || 0
      
      let plan = 'free'
      if (amount === 9700) plan = 'pro'
      else if (amount === 29700) plan = 'pro_max'
      
      return {
        user_id: sub.account_id,
        account_id: sub.account_id,
        email: account?.name || `Conta ${sub.account_id.slice(0, 8)}`,
        plan,
        subscription_status: sub.status,
        created_at: account?.created_at || sub.created,
        stripe_subscription_id: sub.id
      }
    }) || []
    
    // Calcular estatísticas
    const planPrices: Record<string, number> = {
      pro: 97,
      pro_max: 297
    }
    
    const totalRevenue = paidSubscriptions.reduce((acc, sub) => {
      return acc + (planPrices[sub.plan] || 0)
    }, 0)
    
    // Buscar todas as assinaturas para calcular churn
    const { data: allSubs } = await supabase
      .from('billing_subscriptions')
      .select('status')
    
    const canceledCount = allSubs?.filter(s => s.status === 'canceled').length || 0
    const totalSubs = allSubs?.length || 1
    
    const stats = {
      totalRevenue,
      activeSubscriptions: paidSubscriptions.length,
      churnRate: (canceledCount / totalSubs) * 100,
      averageRevenue: paidSubscriptions.length > 0 
        ? totalRevenue / paidSubscriptions.length 
        : 0
    }
    
    return {
      stats,
      subscriptions: paidSubscriptions
    }
  } catch (error) {
    console.error('Erro ao buscar dados de billing:', error)
    return {
      stats: {
        totalRevenue: 0,
        activeSubscriptions: 0,
        churnRate: 0,
        averageRevenue: 0
      },
      subscriptions: []
    }
  }
}