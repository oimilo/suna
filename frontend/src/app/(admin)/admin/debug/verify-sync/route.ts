import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

export async function GET() {
  const supabase = createAdminClient()
  
  try {
    // 1. Buscar TODAS as assinaturas de billing_subscriptions
    const { data: allSubs, error: subError } = await supabase
      .from('billing_subscriptions')
      .select('*')
      .order('created', { ascending: false })
    
    if (subError) throw subError
    
    // 2. Buscar usuários específicos
    const targetEmails = [
      'start@prophet.build',
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    const targetUsersAnalysis = targetEmails.map(email => {
      const user = authUsers?.users?.find(u => u.email === email)
      if (!user) return { email, found: false }
      
      // Buscar assinaturas deste usuário
      const userSubs = allSubs?.filter(s => s.account_id === user.id) || []
      
      return {
        email,
        found: true,
        user_id: user.id,
        subscriptions_count: userSubs.length,
        active_subscriptions: userSubs.filter(s => s.status === 'active').length,
        subscriptions: userSubs.map(s => ({
          id: s.id,
          status: s.status,
          price_id: s.price_id,
          created: s.created,
          metadata: s.metadata
        }))
      }
    })
    
    // 3. Contar por status
    const statusCount: Record<string, number> = {}
    allSubs?.forEach(sub => {
      statusCount[sub.status] = (statusCount[sub.status] || 0) + 1
    })
    
    return NextResponse.json({
      summary: {
        total_subscriptions: allSubs?.length || 0,
        active: statusCount['active'] || 0,
        canceled: statusCount['canceled'] || 0,
        other_statuses: Object.keys(statusCount).filter(s => s !== 'active' && s !== 'canceled')
      },
      target_users: targetUsersAnalysis,
      all_subscriptions: allSubs?.map(s => ({
        id: s.id,
        account_id: s.account_id,
        status: s.status,
        price_id: s.price_id,
        created: s.created,
        metadata: s.metadata
      }))
    })
    
  } catch (error) {
    console.error('Verify Sync Error:', error)
    return NextResponse.json({ 
      error: String(error),
      message: 'Erro ao verificar sincronização'
    }, { status: 500 })
  }
}