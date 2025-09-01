import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Buscar TODAS as assinaturas ativas diretamente do schema basejump
    const { data: basejumpSubscriptions, error: subError } = await supabase
      .schema('basejump')
      .from('billing_subscriptions')
      .select(`
        *,
        billing_customers (
          id,
          account_id,
          email
        )
      `)
      .eq('status', 'active')
    
    if (subError) {
      console.error('Erro ao buscar do basejump:', subError)
      throw subError
    }
    
    // 2. Buscar todas as contas
    const { data: accounts } = await supabase
      .from('accounts')
      .select('*')
    
    // 3. Buscar todos os usuários
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // 4. Buscar relações account_user
    const { data: accountUsers } = await supabase
      .from('account_user')
      .select('*')
    
    // 5. Analisar cada assinatura
    const analysisResults = basejumpSubscriptions?.map(sub => {
      const customer = sub.billing_customers
      const account_id = customer?.account_id
      
      // Encontrar a conta
      const account = accounts?.find(a => a.id === account_id)
      
      // Tentar encontrar o usuário dono
      let owner = null
      let ownerFoundBy = 'Não encontrado'
      
      // Estratégia 1: account_id é o próprio user_id (conta pessoal)
      if (account_id) {
        owner = authUsers?.users?.find(u => u.id === account_id)
        if (owner) ownerFoundBy = 'account_id = user_id (conta pessoal)'
      }
      
      // Estratégia 2: Via primary_owner_user_id
      if (!owner && account?.primary_owner_user_id) {
        owner = authUsers?.users?.find(u => u.id === account.primary_owner_user_id)
        if (owner) ownerFoundBy = 'primary_owner_user_id'
      }
      
      // Estratégia 3: Via account_user
      if (!owner && accountUsers && account_id) {
        const relation = accountUsers.find(au => au.account_id === account_id)
        if (relation) {
          owner = authUsers?.users?.find(u => u.id === relation.user_id)
          if (owner) ownerFoundBy = 'account_user relation'
        }
      }
      
      // Estratégia 4: Via email do customer
      if (!owner && customer?.email) {
        owner = authUsers?.users?.find(u => u.email === customer.email)
        if (owner) ownerFoundBy = 'email match do customer'
      }
      
      // Determinar o plano baseado no price_id
      let plan = 'unknown'
      let amount = 0
      
      // IDs conhecidos dos planos
      const priceMap: Record<string, { plan: string, amount: number }> = {
        'price_1RqK0hFNfWjTbEjsaAFuY7Cb': { plan: 'pro', amount: 97 },
        'price_1RqK0hFNfWjTbEjsN9XCGLA4': { plan: 'pro_yearly', amount: 970 },
        'price_1RqK4xFNfWjTbEjsCrjfvJVL': { plan: 'pro_max', amount: 297 },
        'price_1RqK6cFNfWjTbEjs75UPIgif': { plan: 'pro_max_yearly', amount: 2970 }
      }
      
      if (sub.price_id && priceMap[sub.price_id]) {
        plan = priceMap[sub.price_id].plan
        amount = priceMap[sub.price_id].amount
      }
      
      return {
        subscription_id: sub.id,
        customer_id: customer?.id,
        customer_email: customer?.email,
        account_id: account_id,
        account_name: account?.name || 'Conta não encontrada',
        account_personal: account?.personal_account,
        owner_email: owner?.email || 'ÓRFÃ - SEM DONO',
        owner_id: owner?.id,
        owner_found_by: ownerFoundBy,
        plan,
        price_id: sub.price_id,
        amount,
        status: sub.status,
        metadata: sub.metadata,
        created: sub.created || sub.current_period_start,
        current_period_end: sub.current_period_end,
        stripe_customer_id: customer?.id?.startsWith('cus_') ? customer.id : null,
        is_manual: customer?.id?.startsWith('cus_manual_') || false,
        is_test: customer?.id?.startsWith('cus_test_') || customer?.id?.startsWith('cus_dev_') || false
      }
    }) || []
    
    // Separar órfãs das mapeadas
    const orphanSubscriptions = analysisResults.filter(s => !s.owner_id)
    const mappedSubscriptions = analysisResults.filter(s => s.owner_id)
    
    // Buscar especificamente pelos emails mencionados
    const targetEmails = [
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    const targetUsersAnalysis = targetEmails.map(email => {
      const user = authUsers?.users?.find(u => u.email === email)
      const relatedSubs = analysisResults.filter(s => 
        s.owner_email === email || 
        s.customer_email === email
      )
      
      return {
        email,
        user_found: !!user,
        user_id: user?.id,
        subscriptions_found: relatedSubs.length,
        subscriptions: relatedSubs
      }
    })
    
    return NextResponse.json({
      summary: {
        total_basejump_subscriptions: basejumpSubscriptions?.length || 0,
        total_active_subscriptions: analysisResults.length,
        mapped_subscriptions: mappedSubscriptions.length,
        orphan_subscriptions: orphanSubscriptions.length,
        manual_subscriptions: analysisResults.filter(s => s.is_manual).length,
        test_subscriptions: analysisResults.filter(s => s.is_test).length,
        stripe_subscriptions: analysisResults.filter(s => s.stripe_customer_id).length
      },
      target_users_analysis: targetUsersAnalysis,
      orphan_subscriptions: orphanSubscriptions,
      all_subscriptions: analysisResults,
      debug_info: {
        basejump_schema_used: true,
        customer_ids_found: analysisResults.map(s => s.customer_id).filter(Boolean),
        unique_account_ids: [...new Set(analysisResults.map(s => s.account_id).filter(Boolean))]
      }
    })
    
  } catch (error) {
    console.error('Find Orphans Error:', error)
    return NextResponse.json({ 
      error: String(error),
      message: 'Erro ao buscar assinaturas órfãs'
    }, { status: 500 })
  }
}