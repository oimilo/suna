import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

/**
 * Script completo de sincronização Stripe -> Banco de Dados
 * Corrige o problema de assinaturas não aparecerem no admin panel
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const execute = searchParams.get('execute') === 'true'
  
  const supabase = createAdminClient()
  
  try {
    console.log('🔄 Iniciando sincronização Stripe -> Banco de Dados')
    
    // 1. Buscar TODAS as assinaturas ativas no Stripe
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer']
    })
    
    console.log(`📊 Encontradas ${subscriptions.data.length} assinaturas ativas no Stripe`)
    
    // 2. Buscar todos os usuários do sistema
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    const usersByEmail = new Map(authUsers?.users?.map(u => [u.email, u]) || [])
    
    const results = {
      total: subscriptions.data.length,
      synced: 0,
      errors: [] as any[],
      details: [] as any[]
    }
    
    // 3. Processar cada assinatura
    for (const sub of subscriptions.data) {
      const customer = sub.customer as Stripe.Customer
      const customerEmail = customer.email
      const customerId = customer.id
      
      console.log(`\n🔍 Processando: ${customerEmail}`)
      
      // Encontrar usuário
      const user = usersByEmail.get(customerEmail || '')
      if (!user) {
        console.log(`  ❌ Usuário não encontrado para email: ${customerEmail}`)
        results.errors.push({
          subscription_id: sub.id,
          customer_email: customerEmail,
          error: 'Usuário não encontrado no sistema'
        })
        continue
      }
      
      const userId = user.id
      console.log(`  ✅ Usuário encontrado: ${userId}`)
      
      if (!execute) {
        // Modo dry-run - apenas mostrar o que seria feito
        results.details.push({
          email: customerEmail,
          user_id: userId,
          subscription_id: sub.id,
          customer_id: customerId,
          would_sync: true
        })
        continue
      }
      
      try {
        // 4. Garantir que existe conta no schema público
        const { data: existingAccount } = await supabase
          .from('accounts')
          .select('id')
          .eq('id', userId)
          .single()
        
        if (!existingAccount) {
          console.log(`  📝 Criando conta para ${userId}`)
          await supabase
            .from('accounts')
            .insert({
              id: userId,
              name: customerEmail?.split('@')[0] || 'User',
              personal_account: true,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })
        }
        
        // 5. Garantir que existe billing_customer em AMBOS os schemas
        // Primeiro no basejump (original)
        const { data: existingBasejumpCustomer } = await supabase
          .schema('basejump')
          .from('billing_customers')
          .select('id')
          .eq('id', customerId)
          .single()
        
        if (!existingBasejumpCustomer) {
          console.log(`  📝 Criando billing_customer no basejump ${customerId}`)
          await supabase
            .schema('basejump')
            .from('billing_customers')
            .insert({
              id: customerId,
              account_id: userId,
              email: customerEmail,
              provider: 'stripe',
              active: true
            })
        }
        
        // Depois no público (para satisfazer FK) - estrutura diferente!
        const { data: existingPublicCustomer } = await supabase
          .from('billing_customers')
          .select('customer_id')
          .eq('customer_id', customerId)
          .single()
        
        if (!existingPublicCustomer) {
          console.log(`  📝 Criando billing_customer no público ${customerId}`)
          const { error: publicCustomerError } = await supabase
            .from('billing_customers')
            .insert({
              customer_id: customerId,  // Campo diferente no público!
              account_id: userId,
              email: customerEmail
              // Não tem active nem provider no schema público
            })
          
          if (publicCustomerError) {
            console.error(`  ❌ Erro ao criar billing_customer no público: ${publicCustomerError.message}`)
            throw publicCustomerError
          }
        }
        
        // 6. Criar/atualizar billing_subscription
        const priceId = sub.items.data[0]?.price.id
        const subscriptionData = {
          id: sub.id,
          account_id: userId,
          customer_id: customerId,
          status: sub.status,
          price_id: priceId,
          quantity: sub.items.data[0]?.quantity || 1,
          cancel_at_period_end: sub.cancel_at_period_end,
          current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
          current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
          created: new Date(sub.created * 1000).toISOString(),
          created_at: new Date(sub.created * 1000).toISOString(),
          updated_at: new Date().toISOString(),
          metadata: {
            plan: priceId?.includes('pro_max') ? 'pro_max' : 'pro',
            synced_from_stripe: true,
            last_sync: new Date().toISOString()
          }
        }
        
        // Usar upsert para evitar duplicatas
        const { error: subError } = await supabase
          .from('billing_subscriptions')
          .upsert(subscriptionData, { 
            onConflict: 'id',
            ignoreDuplicates: false 
          })
        
        if (subError) {
          throw subError
        }
        
        console.log(`  ✅ Assinatura sincronizada: ${sub.id}`)
        results.synced++
        
        results.details.push({
          email: customerEmail,
          user_id: userId,
          subscription_id: sub.id,
          customer_id: customerId,
          synced: true,
          error: null
        })
        
      } catch (error: any) {
        console.error(`  ❌ Erro ao sincronizar: ${error.message}`)
        results.errors.push({
          subscription_id: sub.id,
          customer_email: customerEmail,
          error: error.message
        })
        
        results.details.push({
          email: customerEmail,
          user_id: userId,
          subscription_id: sub.id,
          customer_id: customerId,
          synced: false,
          error: error.message
        })
      }
    }
    
    // 7. Verificar resultado final
    const { data: finalCount } = await supabase
      .from('billing_subscriptions')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'active')
    
    // Verificar usuários específicos
    const targetEmails = [
      'start@prophet.build',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    const targetUsersStatus = []
    for (const email of targetEmails) {
      const user = usersByEmail.get(email)
      if (user) {
        const { data: userSub } = await supabase
          .from('billing_subscriptions')
          .select('*')
          .eq('account_id', user.id)
          .eq('status', 'active')
          .single()
        
        targetUsersStatus.push({
          email,
          user_id: user.id,
          has_subscription: !!userSub,
          subscription_id: userSub?.id
        })
      }
    }
    
    return NextResponse.json({
      executed: execute,
      results,
      database_status: {
        total_active_subscriptions: finalCount?.count || 0
      },
      target_users: targetUsersStatus,
      instructions: execute 
        ? `✅ Sincronização concluída! ${results.synced} de ${results.total} assinaturas sincronizadas.`
        : "🔍 Modo DRY-RUN. Use ?execute=true para sincronizar de verdade."
    })
    
  } catch (error: any) {
    console.error('❌ Erro na sincronização:', error)
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao sincronizar com Stripe'
    }, { status: 500 })
  }
}