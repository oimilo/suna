import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // Emails específicos
    const targetEmails = [
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    // Buscar usuários
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const targetUsers = authUsers?.users?.filter(u => 
      targetEmails.includes(u.email || '')
    ) || []
    
    // Para cada usuário, fazer uma busca mais agressiva
    const results = []
    
    for (const user of targetUsers) {
      // Buscar TODAS as contas onde esse usuário pode estar
      const { data: allAccounts } = await supabase
        .from('accounts')
        .select('*')
        .or(`id.eq.${user.id},primary_owner_user_id.eq.${user.id}`)
      
      // Buscar em account_user
      const { data: accountUserRelations } = await supabase
        .from('account_user')
        .select('*')
        .eq('user_id', user.id)
      
      // Buscar assinaturas de todas essas contas
      const accountIds = [
        ...(allAccounts?.map(a => a.id) || []),
        ...(accountUserRelations?.map(au => au.account_id) || [])
      ]
      const uniqueAccountIds = [...new Set(accountIds)]
      
      const { data: userSubscriptions } = await supabase
        .from('billing_subscriptions')
        .select('*, billing_prices(*)')
        .in('account_id', uniqueAccountIds)
        .eq('status', 'active')
      
      results.push({
        email: user.email,
        user_id: user.id,
        accounts_found: allAccounts?.length || 0,
        account_user_relations: accountUserRelations?.length || 0,
        account_ids: uniqueAccountIds,
        subscriptions: userSubscriptions || []
      })
    }
    
    // Buscar TODAS as assinaturas ativas para comparar
    const { data: allActiveSubscriptions } = await supabase
      .from('billing_subscriptions')
      .select('*, billing_prices(*)')
      .eq('status', 'active')
    
    // Buscar contas por nome similar
    const nameSearchResults = []
    for (const email of targetEmails) {
      const nameParts = email.split('@')[0].split('.')
      
      for (const part of nameParts) {
        const { data: accountsByName } = await supabase
          .from('accounts')
          .select('*')
          .ilike('name', `%${part}%`)
        
        if (accountsByName && accountsByName.length > 0) {
          for (const account of accountsByName) {
            const { data: accountSubs } = await supabase
              .from('billing_subscriptions')
              .select('*, billing_prices(*)')
              .eq('account_id', account.id)
              .eq('status', 'active')
            
            nameSearchResults.push({
              search_term: part,
              original_email: email,
              account,
              subscriptions: accountSubs || []
            })
          }
        }
      }
    }
    
    return NextResponse.json({
      target_users: results,
      total_active_subscriptions: allActiveSubscriptions?.length || 0,
      accounts_found_by_name: nameSearchResults,
      debug_info: {
        total_users_checked: targetUsers.length,
        emails_searched: targetEmails
      }
    })
    
  } catch (error) {
    console.error('Debug API Error:', error)
    return NextResponse.json({ error: String(error) }, { status: 500 })
  }
}