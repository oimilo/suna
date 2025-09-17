import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // Buscar TODAS as assinaturas ativas com detalhes
    const { data: activeSubscriptions } = await supabase
      .from('billing_subscriptions')
      .select(`
        *,
        billing_prices (
          amount,
          interval
        )
      `)
      .eq('status', 'active')
    
    // Buscar TODAS as contas
    const { data: allAccounts } = await supabase
      .from('accounts')
      .select('*')
    
    // Buscar TODOS os usuários
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // Buscar TODAS as relações account_user
    const { data: allAccountUsers } = await supabase
      .from('account_user')
      .select('*')
    
    // Mapear cada assinatura para encontrar seu dono
    const subscriptionDetails = activeSubscriptions?.map(sub => {
      const account = allAccounts?.find(a => a.id === sub.account_id)
      
      // Tentar encontrar o dono da conta
      let owner = null
      let ownerFoundBy = 'Não encontrado'
      
      // 1. Via primary_owner_user_id
      if (account?.primary_owner_user_id) {
        owner = authUsers?.users?.find(u => u.id === account.primary_owner_user_id)
        if (owner) ownerFoundBy = 'primary_owner_user_id'
      }
      
      // 2. Via account_user
      if (!owner && allAccountUsers) {
        const relation = allAccountUsers.find(au => au.account_id === sub.account_id)
        if (relation) {
          owner = authUsers?.users?.find(u => u.id === relation.user_id)
          if (owner) ownerFoundBy = 'account_user relation'
        }
      }
      
      // 3. Se é conta pessoal e ID = user ID
      if (!owner && account?.personal_account) {
        owner = authUsers?.users?.find(u => u.id === account.id)
        if (owner) ownerFoundBy = 'personal account (id match)'
      }
      
      const amount = sub.billing_prices?.amount || 0
      let plan = 'unknown'
      if (amount === 9700) plan = 'pro'
      else if (amount === 29700) plan = 'pro_max'
      else if (amount > 0) plan = 'custom'
      
      return {
        subscription_id: sub.id,
        account_id: sub.account_id,
        account_name: account?.name || 'Conta não encontrada',
        account_personal: account?.personal_account || false,
        account_primary_owner: account?.primary_owner_user_id || null,
        owner_email: owner?.email || 'ÓRFÃ - SEM DONO',
        owner_id: owner?.id || null,
        owner_found_by: ownerFoundBy,
        plan,
        amount: amount / 100,
        status: sub.status,
        created: sub.created,
        stripe_customer_id: sub.stripe_customer_id,
        stripe_subscription_id: sub.stripe_subscription_id
      }
    }) || []
    
    // Separar assinaturas órfãs
    const orphanSubscriptions = subscriptionDetails.filter(s => !s.owner_id)
    const mappedSubscriptions = subscriptionDetails.filter(s => s.owner_id)
    
    return NextResponse.json({
      summary: {
        total_active_subscriptions: activeSubscriptions?.length || 0,
        mapped_subscriptions: mappedSubscriptions.length,
        orphan_subscriptions: orphanSubscriptions.length,
        total_accounts: allAccounts?.length || 0,
        total_users: authUsers?.users?.length || 0,
        total_account_user_relations: allAccountUsers?.length || 0
      },
      orphan_subscriptions: orphanSubscriptions,
      mapped_subscriptions: mappedSubscriptions,
      all_subscriptions: subscriptionDetails
    })
    
  } catch (error) {
    console.error('Subscriptions Debug Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}