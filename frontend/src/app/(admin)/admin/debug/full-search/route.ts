import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Buscar o usuário start@prophet.build especificamente
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const startUser = authUsers?.users?.find(u => u.email === 'start@prophet.build')
    
    // 2. Buscar TODAS as assinaturas de TODOS os schemas possíveis
    const allSubscriptions: any[] = []
    
    // Schema público - billing_subscriptions
    const { data: publicSubs } = await supabase
      .from('billing_subscriptions')
      .select('*')
    
    if (publicSubs) {
      publicSubs.forEach(sub => {
        allSubscriptions.push({
          ...sub,
          source: 'public.billing_subscriptions'
        })
      })
    }
    
    // Schema basejump - billing_subscriptions
    const { data: basejumpSubs } = await supabase
      .schema('basejump')
      .from('billing_subscriptions')
      .select('*')
    
    if (basejumpSubs) {
      basejumpSubs.forEach(sub => {
        allSubscriptions.push({
          ...sub,
          source: 'basejump.billing_subscriptions'
        })
      })
    }
    
    // 3. Buscar TODOS os customers
    const allCustomers: any[] = []
    
    // Schema basejump - billing_customers
    const { data: basejumpCustomers } = await supabase
      .schema('basejump')
      .from('billing_customers')
      .select('*')
    
    if (basejumpCustomers) {
      basejumpCustomers.forEach(cust => {
        allCustomers.push({
          ...cust,
          source: 'basejump.billing_customers'
        })
      })
    }
    
    // 4. Buscar TODAS as contas (accounts)
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
    
    // 5. Buscar relações account_user
    const { data: accountUsers } = await supabase
      .from('account_user')
      .select('*')
    
    // 6. Análise específica do usuário start@prophet.build
    let startUserAnalysis = null
    if (startUser) {
      // Encontrar contas do usuário
      const userAccounts = accounts?.filter(a => 
        a.id === startUser.id || 
        a.primary_owner_user_id === startUser.id
      ) || []
      
      const userAccountRelations = accountUsers?.filter(au => 
        au.user_id === startUser.id
      ) || []
      
      const allUserAccountIds = [
        ...userAccounts.map(a => a.id),
        ...userAccountRelations.map(r => r.account_id),
        startUser.id // O próprio ID do usuário pode ser um account_id
      ]
      const uniqueAccountIds = [...new Set(allUserAccountIds)]
      
      // Buscar customers desse usuário
      const userCustomers = allCustomers.filter(c => 
        uniqueAccountIds.includes(c.account_id) ||
        c.email === startUser.email
      )
      
      // Buscar assinaturas
      const userSubscriptions = allSubscriptions.filter(s => 
        uniqueAccountIds.includes(s.account_id) ||
        userCustomers.some(c => c.id === s.customer_id)
      )
      
      startUserAnalysis = {
        user_id: startUser.id,
        email: startUser.email,
        created_at: startUser.created_at,
        accounts: userAccounts,
        account_relations: userAccountRelations,
        all_account_ids: uniqueAccountIds,
        customers: userCustomers,
        subscriptions: userSubscriptions
      }
    }
    
    // 7. Buscar pelos outros emails mencionados
    const targetEmails = [
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com',
      'start@prophet.build'
    ]
    
    const emailAnalysis = targetEmails.map(email => {
      const user = authUsers?.users?.find(u => u.email === email)
      if (!user) return { email, found: false }
      
      // Encontrar todas as contas possíveis
      const userAccounts = accounts?.filter(a => 
        a.id === user.id || 
        a.primary_owner_user_id === user.id
      ) || []
      
      const userAccountRelations = accountUsers?.filter(au => 
        au.user_id === user.id
      ) || []
      
      const allUserAccountIds = [
        ...userAccounts.map(a => a.id),
        ...userAccountRelations.map(r => r.account_id),
        user.id
      ]
      const uniqueAccountIds = [...new Set(allUserAccountIds)]
      
      // Buscar customers
      const userCustomers = allCustomers.filter(c => 
        uniqueAccountIds.includes(c.account_id) ||
        c.email === email
      )
      
      // Buscar assinaturas
      const userSubscriptions = allSubscriptions.filter(s => 
        uniqueAccountIds.includes(s.account_id) ||
        userCustomers.some(c => c.id === s.customer_id)
      )
      
      return {
        email,
        found: true,
        user_id: user.id,
        account_ids: uniqueAccountIds,
        customers: userCustomers,
        subscriptions: userSubscriptions,
        has_active_subscription: userSubscriptions.some(s => s.status === 'active')
      }
    })
    
    // 8. Mapear TODAS as assinaturas para seus donos
    const subscriptionMapping = allSubscriptions.map(sub => {
      // Encontrar a conta
      const account = accounts?.find(a => a.id === sub.account_id)
      
      // Encontrar o customer
      const customer = allCustomers.find(c => c.id === sub.customer_id)
      
      // Tentar encontrar o usuário dono
      let owner = null
      let ownerFoundBy = 'not_found'
      
      // Via account_id direto (conta pessoal)
      owner = authUsers?.users?.find(u => u.id === sub.account_id)
      if (owner) ownerFoundBy = 'account_id_is_user_id'
      
      // Via primary_owner
      if (!owner && account?.primary_owner_user_id) {
        owner = authUsers?.users?.find(u => u.id === account.primary_owner_user_id)
        if (owner) ownerFoundBy = 'primary_owner_user_id'
      }
      
      // Via customer email
      if (!owner && customer?.email) {
        owner = authUsers?.users?.find(u => u.email === customer.email)
        if (owner) ownerFoundBy = 'customer_email'
      }
      
      // Via account_user relation
      if (!owner && sub.account_id) {
        const relation = accountUsers?.find(au => au.account_id === sub.account_id)
        if (relation) {
          owner = authUsers?.users?.find(u => u.id === relation.user_id)
          if (owner) ownerFoundBy = 'account_user_relation'
        }
      }
      
      return {
        subscription_id: sub.id,
        source: sub.source,
        account_id: sub.account_id,
        customer_id: sub.customer_id,
        status: sub.status,
        owner_email: owner?.email || 'ORPHAN',
        owner_id: owner?.id,
        owner_found_by: ownerFoundBy,
        account_name: account?.name,
        customer_email: customer?.email,
        metadata: sub.metadata,
        created: sub.created || sub.created_at
      }
    })
    
    return NextResponse.json({
      summary: {
        total_users: authUsers?.users?.length || 0,
        total_accounts: accounts?.length || 0,
        total_customers: allCustomers.length,
        total_subscriptions: allSubscriptions.length,
        active_subscriptions: allSubscriptions.filter(s => s.status === 'active').length,
        orphan_subscriptions: subscriptionMapping.filter(s => !s.owner_id).length
      },
      start_user_analysis: startUserAnalysis,
      target_emails_analysis: emailAnalysis,
      all_subscriptions: subscriptionMapping,
      raw_data: {
        customers: allCustomers,
        subscriptions: allSubscriptions
      }
    })
    
  } catch (error) {
    console.error('Full Search Error:', error)
    return NextResponse.json({ 
      error: String(error),
      message: 'Erro na busca completa'
    }, { status: 500 })
  }
}