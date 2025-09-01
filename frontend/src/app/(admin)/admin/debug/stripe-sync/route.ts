import { createAdminClient } from "@/lib/supabase/admin"
import { NextResponse } from "next/server"
import Stripe from "stripe"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-11-20.acacia'
})

// Mapeamento de price IDs para planos
const PRICE_MAP: Record<string, { name: string, amount: number }> = {
  'price_1RqK0hFNfWjTbEjsaAFuY7Cb': { name: 'pro', amount: 97 },
  'price_1RqK0hFNfWjTbEjsN9XCGLA4': { name: 'pro_yearly', amount: 970 },
  'price_1RqK4xFNfWjTbEjsCrjfvJVL': { name: 'pro_max', amount: 297 },
  'price_1RqK6cFNfWjTbEjs75UPIgif': { name: 'pro_max_yearly', amount: 2970 }
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const dryRun = searchParams.get('dry-run') === 'true'
  const syncNow = searchParams.get('sync') === 'true'
  
  const supabase = createAdminClient()
  
  try {
    // 1. Buscar todas as assinaturas ativas no Stripe
    console.log('Buscando assinaturas no Stripe...')
    const subscriptions = await stripe.subscriptions.list({
      status: 'active',
      limit: 100,
      expand: ['data.customer']
    })
    
    console.log(`Encontradas ${subscriptions.data.length} assinaturas ativas no Stripe`)
    
    // 2. Buscar todos os usuários do sistema
    const { data: authUsers } = await supabase.auth.admin.listUsers()
    
    // 3. Mapear assinaturas para usuários
    const subscriptionMapping = []
    const orphanSubscriptions = []
    
    for (const sub of subscriptions.data) {
      const customer = sub.customer as Stripe.Customer
      const customerEmail = customer.email
      const customerId = customer.id
      
      // Buscar usuário por email
      const user = authUsers?.users?.find(u => u.email === customerEmail)
      
      // Extrair informações do plano
      const priceId = sub.items.data[0]?.price.id
      const priceInfo = PRICE_MAP[priceId] || { name: 'unknown', amount: 0 }
      
      const mappingEntry = {
        subscription_id: sub.id,
        customer_id: customerId,
        customer_email: customerEmail,
        user_id: user?.id,
        user_found: !!user,
        plan: priceInfo.name,
        price_id: priceId,
        amount: priceInfo.amount,
        status: sub.status,
        current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
        current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
        created: new Date(sub.created * 1000).toISOString()
      }
      
      if (user) {
        subscriptionMapping.push(mappingEntry)
      } else {
        orphanSubscriptions.push(mappingEntry)
      }
    }
    
    // 4. Se sync=true, sincronizar com o banco
    let syncResults = null
    if (syncNow && !dryRun) {
      syncResults = {
        created: 0,
        updated: 0,
        errors: []
      }
      
      for (const mapping of subscriptionMapping) {
        if (!mapping.user_id) continue
        
        try {
          // Verificar se customer existe no basejump
          const { data: existingCustomer } = await supabase
            .schema('basejump')
            .from('billing_customers')
            .select('id')
            .eq('id', mapping.customer_id)
            .single()
          
          // Se não existe, criar customer
          if (!existingCustomer) {
            await supabase
              .schema('basejump')
              .from('billing_customers')
              .insert({
                id: mapping.customer_id,
                account_id: mapping.user_id,
                email: mapping.customer_email,
                provider: 'stripe',
                active: true
              })
          }
          
          // Verificar se assinatura existe
          const { data: existingSub } = await supabase
            .from('billing_subscriptions')
            .select('id')
            .eq('id', mapping.subscription_id)
            .single()
          
          const subscriptionData = {
            id: mapping.subscription_id,
            account_id: mapping.user_id,
            customer_id: mapping.customer_id,
            status: mapping.status,
            price_id: mapping.price_id,
            quantity: 1,
            cancel_at_period_end: false,
            current_period_start: mapping.current_period_start,
            current_period_end: mapping.current_period_end,
            created: mapping.created,
            metadata: {
              plan: mapping.plan,
              synced_from_stripe: true,
              synced_at: new Date().toISOString()
            }
          }
          
          if (existingSub) {
            // Atualizar
            const { error: updateError } = await supabase
              .from('billing_subscriptions')
              .update(subscriptionData)
              .eq('id', mapping.subscription_id)
            
            if (updateError) {
              throw new Error(`Update error: ${updateError.message}`)
            }
            syncResults.updated++
          } else {
            // Criar
            const { error: insertError } = await supabase
              .from('billing_subscriptions')
              .insert(subscriptionData)
            
            if (insertError) {
              throw new Error(`Insert error: ${insertError.message}`)
            }
            syncResults.created++
          }
          
          // Verificar/criar billing_price se não existir
          if (mapping.price_id && PRICE_MAP[mapping.price_id]) {
            const { data: existingPrice } = await supabase
              .from('billing_prices')
              .select('id')
              .eq('id', mapping.price_id)
              .single()
            
            if (!existingPrice) {
              await supabase
                .from('billing_prices')
                .insert({
                  id: mapping.price_id,
                  product_id: 'prod_prophet_' + mapping.plan,
                  active: true,
                  type: 'recurring',
                  amount: PRICE_MAP[mapping.price_id].amount * 100, // Converter para centavos
                  currency: 'brl',
                  interval: mapping.plan.includes('yearly') ? 'year' : 'month',
                  interval_count: 1,
                  metadata: {}
                })
            }
          }
          
        } catch (error: any) {
          syncResults.errors.push({
            subscription_id: mapping.subscription_id,
            error: error.message
          })
        }
      }
    }
    
    // 5. Verificar usuários específicos
    const targetEmails = [
      'start@prophet.build',
      'claudio.ferreira@trademaster.com.br',
      'cavallari@neurociente.com.br',
      'vinicius@agenciadebolso.com'
    ]
    
    const targetUsersStatus = targetEmails.map(email => {
      const stripeSubscription = subscriptionMapping.find(s => s.customer_email === email) ||
                                orphanSubscriptions.find(s => s.customer_email === email)
      
      return {
        email,
        has_stripe_subscription: !!stripeSubscription,
        stripe_plan: stripeSubscription?.plan,
        stripe_status: stripeSubscription?.status,
        user_found_in_db: !!authUsers?.users?.find(u => u.email === email),
        subscription_data: stripeSubscription
      }
    })
    
    return NextResponse.json({
      summary: {
        total_stripe_subscriptions: subscriptions.data.length,
        mapped_to_users: subscriptionMapping.length,
        orphan_subscriptions: orphanSubscriptions.length,
        dry_run: dryRun,
        sync_requested: syncNow
      },
      sync_results: syncResults,
      target_users_status: targetUsersStatus,
      mapped_subscriptions: subscriptionMapping,
      orphan_subscriptions: orphanSubscriptions,
      instructions: {
        dry_run: "Use ?dry-run=true para apenas visualizar",
        sync: "Use ?sync=true para sincronizar com o banco",
        both: "Use ?sync=true&dry-run=false para sincronizar de verdade"
      }
    })
    
  } catch (error: any) {
    console.error('Stripe Sync Error:', error)
    return NextResponse.json({ 
      error: error.message,
      message: 'Erro ao sincronizar com Stripe'
    }, { status: 500 })
  }
}