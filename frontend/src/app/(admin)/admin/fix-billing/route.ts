import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"

/**
 * FIX DIRETO para o problema de billing
 * Cria assinaturas manuais para usuários que têm plano PRO no Stripe
 * mas não aparecem no admin billing
 */
export async function POST() {
  const supabase = createAdminClient()
  
  try {
    // Usuários que sabemos que têm PRO
    const proUsers = [
      { 
        email: 'start@prophet.build', 
        user_id: '29e38efa-512a-47c0-9130-0ca0cedeb533',
        customer_id: 'cus_SsfVoAZWvFkukD',
        subscription_id: 'sub_1RwuAjFNfWjTbEjsF6E2QewK'
      },
      { 
        email: 'cavallari@neurociente.com.br', 
        user_id: 'd63efb0e-a5f9-40d4-b07f-2fce1322b86e',
        customer_id: 'cus_Ss6AWUuoQpkCWA',
        subscription_id: 'sub_1RwM1oFNfWjTbEjsWvlLqvBV'
      },
      { 
        email: 'vinicius@agenciadebolso.com', 
        user_id: 'f581c772-e0ef-4ed9-890a-ecebef03cc93',
        customer_id: 'cus_SvyRn9X5JAgtLS',
        subscription_id: 'sub_1S06UGFNfWjTbEjsGHAr8Q8Q'
      }
    ]
    
    const results = []
    
    for (const user of proUsers) {
      try {
        // 1. Garantir que a conta existe no schema público
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', user.user_id)
          .single()
        
        if (!existingAccount) {
          await supabase
            .from('accounts')
            .insert({
              id: user.user_id,
              name: user.email.split('@')[0],
              personal_account: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
        
        // 2. Criar customer se não existir nos DOIS schemas
        // Primeiro no basejump (estrutura original)
        const basejumpCustomerData = {
          id: user.customer_id || `cus_manual_${user.user_id.slice(0, 8)}`,
          account_id: user.user_id,
          email: user.email,
          provider: 'stripe',
          active: true
        }
        
        await supabase
          .schema('basejump')
          .from('billing_customers')
          .upsert(basejumpCustomerData, { onConflict: 'id' })
        
        // Depois no público (estrutura diferente)
        const publicCustomerData = {
          customer_id: user.customer_id || `cus_manual_${user.user_id.slice(0, 8)}`,
          account_id: user.user_id,
          email: user.email
        }
        
        await supabase
          .from('billing_customers')
          .upsert(publicCustomerData, { onConflict: 'customer_id' })
        
        // 3. Criar assinatura PRO manual
        const now = new Date()
        const nextMonth = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        
        const subscriptionData = {
          id: user.subscription_id || `sub_manual_${Date.now()}_${user.user_id.slice(0, 8)}`,
          account_id: user.user_id,
          customer_id: basejumpCustomerData.id,
          status: 'active',
          price_id: null, // Vamos deixar null por enquanto
          quantity: 1,
          cancel_at_period_end: false,
          current_period_start: now.toISOString(),
          current_period_end: nextMonth.toISOString(),
          created: now.toISOString(),
          created_at: now.toISOString(),
          updated_at: now.toISOString(),
          metadata: {
            plan: 'pro',
            manual_fix: true,
            fixed_at: now.toISOString(),
            stripe_sync_issue: true
          }
        }
        
        // Deletar assinatura existente se houver
        await supabase
          .from('billing_subscriptions')
          .delete()
          .eq('account_id', user.user_id)
        
        // Criar nova assinatura
        const { data: created, error: createError } = await supabase
          .from('billing_subscriptions')
          .insert(subscriptionData)
          .select()
          .single()
        
        results.push({
          email: user.email,
          success: !!created,
          error: createError?.message,
          subscription_id: created?.id
        })
        
      } catch (error: any) {
        results.push({
          email: user.email,
          success: false,
          error: error.message
        })
      }
    }
    
    // Verificar total de assinaturas após fix
    const { data: finalSubs } = await supabase
      .from('billing_subscriptions')
      .select('account_id, status, metadata')
      .eq('status', 'active')
    
    return NextResponse.json({
      message: "Fix aplicado!",
      results,
      total_active_subscriptions: finalSubs?.length || 0,
      fixed_users: results.filter(r => r.success).length,
      failed_users: results.filter(r => !r.success).length
    })
    
  } catch (error: any) {
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao aplicar fix'
    }, { status: 500 })
  }
}